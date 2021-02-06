import {
    emptyConsole,
    findInitTransition,
    getAncestorMap,
    getEventTransitionsMaps,
    getHistoryStatesMap,
    getHistoryUnderlyingState,
    getStatesPath,
    getStatesTransitionsMap,
    getStateEventTransitionsMaps,
    getStatesType,
    getTargetStatesMap,
    isActionFactory,
    isControlState,
    isEvent,
    isFunction,
    isHistoryControlState,
    noop
} from "./helpers"
// @ts-ignore
import {objectTreeLenses, PRE_ORDER, traverseObj} from "fp-rosetree"
import { CONTRACTS_EVAL, INIT_EVENT, INIT_STATE, MACHINE_CREATION_ERROR_MSG } from "./properties"

// Contracts

// S2. State names must be unique
export const noDuplicatedStates = {
    name: 'noDuplicatedStates',
    shouldThrow: false,
    predicate: (fsmDef, settings) => {
        const {getLabel} = objectTreeLenses;
        const traverse = {
            strategy: PRE_ORDER,
            seed: {duplicatedStates: [], statesHashMap: {}},
            visit: (acc, traversalState, tree) => {
                const {duplicatedStates, statesHashMap} = acc;
                const treeLabel = getLabel(tree);
                const controlState = Object.keys(treeLabel)[0];
                if (controlState in statesHashMap) {
                    return {
                        duplicatedStates: duplicatedStates.concat(controlState),
                        statesHashMap
                    }
                }
                else {
                    return {
                        duplicatedStates,
                        statesHashMap: (statesHashMap[controlState] = "", statesHashMap)
                    }
                }
            }
        }

        const {duplicatedStates} = traverseObj(traverse, fsmDef.states);

        const isFulfilled = duplicatedStates.length === 0;
        return {
            isFulfilled,
            blame: {
                message: `State names must be unique! Found duplicated state names. Cf. log`,
                info: {duplicatedStates}
            }
        }
    },
};

// S1. State name cannot be a reserved state name (for now only INIT_STATE)
export const noReservedStates = {
    name: 'noReservedStates',
    shouldThrow: false,
    predicate: (fsmDef, settings, {statesType}) => {
        return {
            isFulfilled: Object.keys(statesType).indexOf(INIT_STATE) === -1,
            blame: {
                message: `You cannot use a reserved control state name for any of the configured control states for the machine! Cf. log`,
                info: {reservedStates: [INIT_STATE], statesType}
            }
        }
    },
};

// S4. At least one control state (other than the initial state) muat be declared
export const atLeastOneState = {
    name: 'atLeastOneState',
    shouldThrow: false,
    predicate: (fsmDef, settings, {statesType}) => {
        return {
            isFulfilled: Object.keys(statesType).length > 0,
            blame: {
                message: `Machine configuration must define at least one control state! Cf. log`,
                info: {statesType}
            }
        }
    },
};

// S5. check initial control state is a defined state in states
export const isInitialControlStateDeclared = {
    name: 'isInitialControlStateDeclared',
    shouldThrow: false,
    predicate: (fsmDef, settings, {initTransition, statesType}) => {
        const {initialControlState, transitions} = fsmDef;
        const stateList = Object.keys(statesType);
        if (initialControlState) {
            return {
                isFulfilled: stateList.indexOf(initialControlState) > -1,
                blame: {
                    message: `Configured initial control state must be a declared state. Cf. log`,
                    info: {initialControlState, declaredStates: stateList}
                }
            }
        }
        else {
            return {
                isFulfilled: true,
                blame: void 0
            }
        }

    },
};

// E0. `fsmDef.events` msut be an array of strings
export const eventsAreStrings = {
    name: 'eventsAreStrings',
    shouldThrow: false,
    predicate: (fsmDef, settings) => {
        return {
            isFulfilled: fsmDef.events.every(x => typeof x === 'string'),
            blame: {
                message: `Events must be an array of strings!`,
                info: {events: fsmDef.events}
            }
        }
    },
};

export const validInitialConfig = {
    name: 'validInitialConfig',
    shouldThrow: false,
    predicate: (fsmDef, settings, {initTransition}) => {
        const {initialControlState} = fsmDef;

        if (initTransition && initialControlState) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Invalid machine configuration : defining an initial control state and an initial transition at the same time may lead to ambiguity and is forbidden!`,
                    info: {initialControlState, initTransition}
                }
            }
        }
        else if (!initTransition && !initialControlState) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Invalid machine configuration : you must define EITHER an initial control state OR an initial transition! Else in which state is the machine supposed to start?`,
                    info: {initialControlState, initTransition}
                }
            }
        }
        else return {
                isFulfilled: true,
                blame: void 0
            }
    },
};

// T1. There must be configured at least one transition away from the initial state
// T2. A transition away from the initial state can only be triggered by the initial event
// T7b. The initial state must have a valid transition INIT_STATE -INIT-> defined which does not have a history
// state as target
// T23. We allow conditional initial transitions, but what about the action ? should it be always identity? We
// can't run any actions. We can update internal state, but we can't trace it, so we loose tracing properties and
// debugging!. So enforce ACTIONS to be identity
export const validInitialTransition = {
    name: 'validInitialTransition',
    shouldThrow: false,
    predicate: (fsmDef, settings, {initTransition}) => {
        const {initialControlState, transitions} = fsmDef;
        const initTransitions = transitions.reduce((acc, transition) => {
            transition.from === INIT_STATE && acc.push(transition);
            return acc
        }, []);
        // DOC : or not, we allow conditional init transitions!! allow to set the initial state depending on settings!
        // NOTE: functional object reference, and decoration (trace, entry actions )do not work well together, so we don't
        // enforce the part of the contract which require to have no actions for initial transitions...
        const isFulfilled =
            (initialControlState && !initTransition) ||
            (!initialControlState && initTransition && initTransitions.length === 1 && initTransition.event === INIT_EVENT
                && (
                    isInconditionalTransition(initTransition) // && initTransition.action === ACTION_IDENTITY
                    || areCconditionalTransitions(initTransition)
                    // && initTransition.guards.every(guard => guard.action === ACTION_IDENTITY)
                )
            );

        return {
            isFulfilled,
            blame: {
                message: `Invalid configuration for initial transition! Cf. log`,
                info: {initTransition, initTransitions, initialControlState}
            }
        }
    },
};

// T15. Init transitions can only occur from compound states or the initial state, i.e. A -INIT-> B iff A is a compound
// state or A is the initial state
export const initEventOnlyInCompoundStates = {
    name: 'initEventOnlyInCompoundStates',
    shouldThrow: false,
    predicate: (fsmDef, settings, {statesTransitionsMap, statesType, statesPath}) => {
        // The compound states below does not include the initial state by construction
        const atomicStates = Object.keys(statesType).filter(controlState => !statesType[controlState]);
        const atomicInitTransitions = atomicStates.map(
            atomicState => ({
                [atomicState]: statesTransitionsMap[atomicState] && statesTransitionsMap[atomicState][INIT_EVENT]
            })
        ).filter(obj => Object.values(obj)[0]);

        const hasInitEventOnlyInCompoundStates = atomicInitTransitions.length === 0

        return {
            isFulfilled: hasInitEventOnlyInCompoundStates,
            blame: {
                message: `Found at least one atomic state with an entry transition! That is forbidden! Cf. log`,
                info: {initTransitions: atomicInitTransitions}
            }
        }
    },
};

// T5. Every compound state NOT the initial state A must have a valid transition A -INIT-> defined
// T7a. Every compound state NOT the initial state must have a valid INCONDITIONAL transition A -INIT-> defined which
// does not have a history state as target
// NOTE: actually we could limit it to history state of the containing compound state to avoid infinity loop
// T8. Every compound state NOT the initial state must have a valid INCONDITIONAL transition A -INIT-> defined which
// does not have the history state as target and has a target control state that is one of its substates (no
// out-of-hierarchy INIT transitions)
export const validInitialTransitionForCompoundState = {
    name: 'validInitialTransitionForCompoundState',
    shouldThrow: false,
    predicate: (fsmDef, settings, {statesTransitionsMap, statesType, statesPath}) => {
        // The compound states below does not include the initial state by construction
        const compoundStates = Object.keys(statesType).filter(controlState => statesType[controlState]);
        const compoundStatesInitTransitions = compoundStates.map(
            compoundState => statesTransitionsMap[compoundState] && statesTransitionsMap[compoundState][INIT_EVENT]);

        const allHaveInitTransitions = compoundStatesInitTransitions.every(Boolean);

        if (!allHaveInitTransitions) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Found at least one compound state without an entry transition! Cf. log`,
                    info: {
                        hasEntryTransitions: compoundStates.map(
                            state => ({[state]: !!(statesTransitionsMap[state] && statesTransitionsMap[state][INIT_EVENT])}))
                    }
                }
            }
        }

        const allHaveValidInitTransitions = allHaveInitTransitions &&
            compoundStatesInitTransitions.every(initTransition => {
                const {guards, to} = initTransition;
                if (!guards) {
                    //  T7a
                    return typeof to === 'string'
                }
                else {
                    const targetStates = guards.map(guard => guard.to);
                    return targetStates.every(targetState => typeof targetState === 'string')
                }
            });
        if (!allHaveValidInitTransitions) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Found at least one compound state with an invalid entry transition! Entry transitions for compound states must have the associated target control states which are not a history pseudo-state. Cf. log`,
                    info: {entryTransitions: compoundStatesInitTransitions}
                }
            }
        }
        ;

        const allHaveTargetStatesWithinHierarchy = allHaveValidInitTransitions &&
            compoundStatesInitTransitions.every(initTransition => {
                const {from, guards, to} = initTransition;

                // Don't forget to also eliminate the case when from = to
                // Also note that wwe check that `to` is in statesPath as one is derived from states in transitions, and the
                // other from declared states
                if (!guards){
                    return from !== to && statesPath[to] && statesPath[to].startsWith(statesPath[from])
                }
                else {
                    const targetStates = guards.map(guard => guard.to);
                    return targetStates.every(to => {
                        return from !== to && statesPath[to] && statesPath[to].startsWith(statesPath[from])
                    })
                }
            });
        if (!allHaveTargetStatesWithinHierarchy) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Found at least one compound state with an invalid entry transition! Entry transitions for compound states must have a target state which is strictly below the compound state in the state hierarchy! `,
                    info: {states: fsmDef.states, statesPath, entryTransitions: compoundStatesInitTransitions}
                }
            }
        }

        return {
            isFulfilled: true,
            blame: void 0
        }
    },
};

// T11. If there is an eventless transition A -eventless-> B, there cannot be a competing A -ev-> X
// T24. Check that we have this implicitly : Compound states must not have eventless transitions
// defined on them (would introduce ambiguity with the INIT transition).
export const validEventLessTransitions = {
    name: 'validEventLessTransitions',
    shouldThrow: false,
    predicate: (fsmDef, settings, {statesTransitionsMap, statesType, statesPath}) => {
        // The compound states below does not include the initial state by construction
        const stateList = Object.keys(statesType);
        const failingOriginControlStates = stateList.map(state => {
            return {
                [state]: statesTransitionsMap[state] &&
                `${void 0}` in statesTransitionsMap[state] &&
                Object.keys(statesTransitionsMap[state]).length !== 1
            }
        }).filter(obj => Object.values(obj)[0] !== void 0 && Object.values(obj)[0]);

        const isFulfilled = failingOriginControlStates.length === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found at least one control state without both an eventless transition and a competing transition! Cf. log`,
                info: {failingOriginControlStates}
            }
        }
    },
};

// T12. All transitions A -ev-> * must have the same transition index, i.e. all associated guards must be together
// in a single array and there cannot be two transition rows showcasing A -ev-> * transitions
export const allStateTransitionsOnOneSingleRow = {
    name: 'allStateTransitionsOnOneSingleRow',
    shouldThrow: false,
    predicate: (fsmDef, settings, {stateEventTransitionsMaps}) => {
        const originStateList = Object.keys(stateEventTransitionsMaps);
        const statesTransitionsInfo = originStateList.reduce((acc, state) => {
            const events = Object.keys(stateEventTransitionsMaps[state]);
            const wrongEventConfig = events.filter(event => stateEventTransitionsMaps[state][event].length > 1);
            if (wrongEventConfig.length > 0) {
                acc[state] = wrongEventConfig;
            }

            return acc
        }, {});

        const isFulfilled = Object.keys(statesTransitionsInfo).length === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found at least one control state and one event for which the associated transition are not condensated under a unique row! Cf. log`,
                info: {statesTransitionsInfo}
            }
        }
    },
};

// T14. Conflicting transitions are not allowed, i.e. A -ev-> B and A < OUTER_A
// with ev non reserved event (init event or eventless) is not compatible with OUTER_A-ev->C.
// The event `ev` could trigger a transition towards either B or C
export const noConflictingTransitionsWithAncestorState = {
    name: 'noConflictingTransitionsWithAncestorState',
    shouldThrow: false,
    predicate: (fsmDef, settings, {stateEventTransitionsMaps, eventTransitionsMaps, ancestorMap}) => {
        const eventList = Object.keys(eventTransitionsMaps).filter(ev => ev !== INIT_EVENT && ev !== void 0);
        const eventTransitionsInfo = eventList.reduce((acc, event) => {
            const states = Object.keys(eventTransitionsMaps[event]);
            // The wrongly configured states are those which have an ancestor also in the transition map for the same event
            const wrongStateConfig = states
                .filter(state => state !== INIT_STATE)
                .map(state => ancestorMap[state] && {
                    [state]: ancestorMap[state].find(
                        ancestorState => states.indexOf(ancestorState) > -1
                    )
                })
                // removing cases : undefined and {[state]: undefined}
                .filter(obj => {
                    return obj && Object.values(obj).filter(Boolean).length > 0
                });

            if (wrongStateConfig.length > 0) {
                acc[event] = wrongStateConfig;
            }

            return acc
        }, {});

        const isFulfilled = Object.keys(eventTransitionsInfo).length === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found two conflicting transitions! A -ev-> X, and B -ev-> Y leads to ambiguity if A < B or B < A. Cf. log`,
                info: {eventTransitionsInfo}
            }
        }
    },
};

// T16.a History states must be target states
export const isHistoryStatesTargetStates = {
    name: 'isHistoryStatesTargetStates',
    shouldThrow: false,
    predicate: (fsmDef, settings, {}) => {
        const wrongHistoryStates = fsmDef.transitions.reduce((acc, transition) => {
            return isHistoryControlState(transition.from)
                ? acc.concat(transition)
                : acc
        }, []);

        const isFulfilled = Object.keys(wrongHistoryStates).length === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found a history pseudo state configured as the origin control state for a transition. History pseudo states should only be target control states. Cf. log`,
                info: {wrongHistoryStates}
            }
        }
    },
};

// T16.b History states must be compound states
export const isHistoryStatesCompoundStates = {
    name: 'isHistoryStatesCompoundStates',
    shouldThrow: false,
    predicate: (fsmDef, settings, {stateEventTransitionsMaps, statesType}) => {
        const originStateList = Object.keys(stateEventTransitionsMaps);
        const wrongHistoryStates = originStateList.map(originState => {
            if (originState === INIT_STATE) return []

            const events = Object.keys(stateEventTransitionsMaps[originState]);

            return events.reduce((acc, event) => {
                // I should only ever have one transition, that is checked in another contract
                // !! if there are several transitions, we may have a false positive, but that is ok
                // When the other contract will fail and the issue will be solved, and app will be rerun,
                // this will be recomputed correctly
                const transition = stateEventTransitionsMaps[originState][event][0];
                const {guards, to} = transition;
                if (!guards) {
                    // Reminder: statesType[controlState] === true iff controlState is compound state
                    return isHistoryControlState(to) && !statesType[getHistoryUnderlyingState(to)]
                        ? acc.concat(transition)
                        : acc
                }
                else {
                    return guards.reduce((acc, guard) => {
                        const {to} = guard;

                        return isHistoryControlState(to) && !statesType[getHistoryUnderlyingState(to)]
                            ? acc.concat(transition)
                            : acc
                    }, acc)
                }
            }, [])
        })
            .reduce((acc, x) => acc.concat(x), []);

        const isFulfilled = Object.keys(wrongHistoryStates).length === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found a history pseudo state connected to an atomic state! History pseudo states only refer to compound states. Cf. log`,
                info: {wrongHistoryStates, states: fsmDef.states}
            }
        }
    },
};

// T17 An history state must refer to an existing state
export const isHistoryStatesExisting = {
    name: 'isHistoryStatesExisting',
    shouldThrow: false,
    predicate: (fsmDef, settings, {historyStatesMap, statesType}) => {
        const invalidTransitions = Array.from(historyStatesMap.entries())
            .map(([historyState, flatTransitions]) => {
                return !(historyState in statesType) && {historyState, flatTransitions}
            })
            .filter(Boolean);

        const howMany = Object.keys(invalidTransitions).length;
        const isFulfilled = howMany === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found ${howMany} history pseudo state referring to a control state that is not declared! Check the states property of the state machine definition.`,
                info: {invalidTransitions, states: fsmDef.states}
            }
        }
    },
};

export function isInconditionalTransition(transition) {
    const {from, event, guards, to, action} = transition;

    return typeof guards === `${void 0}` && to && isControlState(from) && isEvent(event) && isControlState(to) && isActionFactory(action)
}

export function isValidGuard(guard) {
    const {to, predicate, action} = guard;

    return to && isControlState(to) && isFunction(predicate) && isActionFactory(action)
}

export function areCconditionalTransitions(transition) {
    const {from, event, guards, to} = transition;

    return guards && Array.isArray(guards) && guards.length > 0
        && !to && isControlState(from) && isEvent(event) && guards.every(isValidGuard)
}

export const isValidFsmDef = {
    name: 'isValidFsmDef',
    shouldThrow: false,
    predicate: (fsmDef, settings) => {
        const {transitions, states, events, initialExtendedState} = fsmDef;
        const isValidTransitions = transitions && Array.isArray(transitions);
        const isValidStates = states && typeof(states) === 'object';
        const isValidEvents = events && Array.isArray(events);
        if (!isValidTransitions) {
            return {
                isFulfilled: false,
                blame: {
                    message: `The transitions property for a machine definition must be an array!`,
                    info: {transitions}
                }
            }
        }
        else if (!isValidStates) {
            return {
                isFulfilled: false,
                blame: {
                    message: `The states property for a machine definition must be an object!`,
                    info: {states}
                }
            }
        }
        else if (!isValidEvents) {
            return {
                isFulfilled: false,
                blame: {
                    message: `The events property for a machine definition must be an array!`,
                    info: {events}
                }
            }
        }
        // NOTE : we do not deal with initialExtendedState, initialControlState and settings
        // this is done in other contracts
        else {
            return {
                isFulfilled: true,
                blame: void 0
            }
        }
    },
}

// T18. Transitions have a valid format, and are either inconditional (no guards) or conditional
// events are strings
// guards are functions
// action factories are functions
export const haveTransitionsValidTypes = {
    name: 'haveTransitionsValidTypes',
    shouldThrow: false,
    predicate: (fsmDef, settings) => {
        const {transitions} = fsmDef;
        const wrongTransitions = transitions
            .map((transition, transitionIndex) => {
                return !isInconditionalTransition(transition) && !areCconditionalTransitions(transition) && {
                    transition,
                    index: transitionIndex
                }
            })
            .filter(Boolean)

        const howMany = Object.keys(wrongTransitions).length;
        const isFulfilled = howMany === 0;

        return {
            isFulfilled,
            blame: {
                message: `Found ${howMany} transitions with invalid format! Check logs for more details.`,
                info: {wrongTransitions, transitions}
            }
        }
    },
}

export const areEventsDeclared = {
    name: 'areEventsDeclared',
    shouldThrow: false,
    predicate: (fsmDef, settings, {eventTransitionsMaps}) => {
        const eventList = Object.keys(eventTransitionsMaps);
        const declaredEventList = fsmDef.events;
        const eventsDeclaredButNotTriggeringTransitions = declaredEventList
            .map(declaredEvent => eventList.indexOf(declaredEvent) === -1 && declaredEvent)
            .filter(Boolean);
        const eventsNotDeclaredButTriggeringTransitions = eventList
            .map(triggeringEvent => declaredEventList.indexOf(triggeringEvent) === -1 && triggeringEvent)
            .filter(Boolean)
            // Filtering out init events which must not be declared, being reserved events
            // Filtering out undefined events linked to eventless transitions
            .filter(ev => ev !== INIT_EVENT && ev !== 'undefined')

        const isFulfilled = eventsDeclaredButNotTriggeringTransitions.length === 0
            && eventsNotDeclaredButTriggeringTransitions.length === 0;

        return {
            isFulfilled,
            blame: {
                message: `All declared events must be used in transitions. All events used in transition must be declared! Cf. log`,
                info: {eventsDeclaredButNotTriggeringTransitions, eventsNotDeclaredButTriggeringTransitions}
            }
        }
    },
};

export const areStatesDeclared = {
    name: 'areStatesDeclared',
    shouldThrow: false,
    predicate: (fsmDef, settings, {stateEventTransitionsMaps, targetStatesMap, statesType}) => {
        const originStateList = Object.keys(stateEventTransitionsMaps);
        const targetStateList = Array.from(targetStatesMap.keys()).filter(x => typeof x !== 'object');
        const stateList = Object.keys([originStateList, targetStateList].reduce((acc, stateList) => {
            stateList.forEach(state => acc[state] = true)
            return acc
        }, {}));
        const declaredStateList = Object.keys(statesType);
        const statesDeclaredButNotTriggeringTransitions = declaredStateList
            .map(declaredState => stateList.indexOf(declaredState) === -1 && declaredState)
            .filter(Boolean);
        const statesNotDeclaredButTriggeringTransitions = stateList
            .map(stateInTransition =>
                stateInTransition !== INIT_STATE && declaredStateList.indexOf(stateInTransition) === -1 && stateInTransition)
            .filter(Boolean);

        const isFulfilled = statesDeclaredButNotTriggeringTransitions.length === 0
            && statesNotDeclaredButTriggeringTransitions.length === 0;

        return {
            isFulfilled,
            blame: {
                message: `All declared states must be used in transitions. All states used in transition must be declared! Cf. log`,
                info: {statesDeclaredButNotTriggeringTransitions, statesNotDeclaredButTriggeringTransitions}
            }
        }
    },
};

// T25. SS1 - as of v0.13 settings is no longer mandatory
export const isValidSettings = {
    name: 'isValidSettings',
    shouldThrow: false,
    predicate: (fsmDef) => {
        return {
            isFulfilled: true,
            blame: void 0
        }
    },
};

// T22. There are no incoming transitions to the reserved initial state, check if implemented or not, prob. not
export const isInitialStateOriginState = {
    name: 'isInitialStateOriginState',
    shouldThrow: false,
    predicate: (fsmDef, settings, {targetStatesMap}) => {

        if (Array.from(targetStatesMap.keys()).indexOf(INIT_STATE) > -1) {
            return {
                isFulfilled: false,
                blame: {
                    message: `Found at least one transition with the initial state as target state! CF. log`,
                    info: {targetStates: Array.from(targetStatesMap.keys()), transitions: fsmDef.transitions}
                }
            }
        }
        else {
            return {
                isFulfilled: true,
                blame: void 0
            }
        }
    },
};

// T23. eventless self-transitions are forbidden (while theoretically possible, the feature is of
// little practical value, though being a possible source of ambiguity or infinite loops)
// A -_> A impossible on compound states because there is A -INIT-> X
// so only possibility is A -_> A with A atomic state
export const isValidSelfTransition = {
    name: 'isValidSelfTransition',
    shouldThrow: false,
    predicate: (fsmDef, settings, {targetStatesMap, statesType}) => {
        const targetStates = Array.from(targetStatesMap.keys());
        const wrongSelfTransitions = targetStates
            .map(targetState => {
                const flatTransitions = targetStatesMap.get(targetState);
                return flatTransitions
                    .map(flatTransition => {
                        const {from, event} = flatTransition;
                        if (targetState in statesType && !statesType[targetState] && from && from === targetState && !event) {
                            return {state: targetState, flatTransition}
                        }
                    })
                    .filter(Boolean)
            })
            .filter(x => x.length > 0);

        return {
            isFulfilled: wrongSelfTransitions.length === 0,
            blame: {
                message: `Found at least one eventless self-transition involving an atomic state! This is forbidden to avoid infinity loop! Cf. log`,
                info: {wrongSelfTransitions}
            }
        }
    },
};

export const fsmContracts = {
    injected: (fsmDef, settings) => {
        return {
            statesType: getStatesType(fsmDef.states),
            initTransition: findInitTransition(fsmDef.transitions),
            statesTransitionsMap: getStatesTransitionsMap(fsmDef.transitions),
            stateEventTransitionsMaps: getStateEventTransitionsMaps(fsmDef.transitions),
            eventTransitionsMaps: getEventTransitionsMaps(fsmDef.transitions),
            ancestorMap: getAncestorMap(fsmDef.states),
            statesPath: getStatesPath(fsmDef.states),
            historyStatesMap: getHistoryStatesMap(fsmDef.transitions),
            targetStatesMap: getTargetStatesMap(fsmDef.transitions)
        }
    },
    description: 'FSM structure',
    contracts: [isValidFsmDef, isValidSettings, isInitialControlStateDeclared, isInitialStateOriginState, eventsAreStrings, haveTransitionsValidTypes, noDuplicatedStates, noReservedStates, atLeastOneState, areEventsDeclared, areStatesDeclared, validInitialConfig, validInitialTransition, initEventOnlyInCompoundStates, validInitialTransitionForCompoundState, validEventLessTransitions, isValidSelfTransition, allStateTransitionsOnOneSingleRow, noConflictingTransitionsWithAncestorState, isHistoryStatesExisting, isHistoryStatesTargetStates, isHistoryStatesCompoundStates],
};

/**
 * Takes a series of contracts grouped considered as a unit, run them, and return the results. Some contracts may
 * throw. If no contract throws, the returned value include a list of the failing contracts if any. A failing
 * contract data structure include relevant information about the failing contract, in particular the contract name,
 * the associated error message and additional info expliciting the error message.
 * @param contractsDef
 * @param settings
 * @returns {function(...[*]=): {isFulfilled: boolean, failingContracts: Array}}
 */
function makeContractHandler(contractsDef, settings) {
    const console = settings && settings.debug && settings.debug.console || emptyConsole;
    const trace = settings && settings.debug && settings.debug.trace || noop;
    const contractsDescription = contractsDef.description;

    return function checkContracts(...args) {
        const failingContracts = [];
        const computedArgs = contractsDef.injected.apply(null, args);
        const isFulfilled = contractsDef.contracts.reduce((acc, contract) => {
            const {name: contractName, predicate, shouldThrow} = contract;
            const fullArgs = args.concat(computedArgs);
            const {isFulfilled, blame} = predicate.apply(null, fullArgs);
            const blameMessageHeader = `${contractsDescription} FAILS ${contractName}!`;
            const {message, info} = blame || {};

            if (isFulfilled) return acc
            else {
                failingContracts.push({name: contractName, message, info});
                console.error(blameMessageHeader);
                console.error([contractName, message].join(': '));
                console.debug('Supporting error data:', info);

                if (shouldThrow) throw new Error([blameMessageHeader, `check console for information!`].join('\n'))
                else {
                    return false
                }
            }
        }, true)

        const contractsEval = {isFulfilled, failingContracts};
        trace({[CONTRACTS_EVAL]: contractsEval})

        return contractsEval
    }
}

// @ts-ignore error here is due to variable number of arguments, not worth spending time there
export const fsmContractChecker = (fsmDef, settings, fsmContracts) => makeContractHandler(fsmContracts, settings)(fsmDef, settings);

export function runContracts({fsmDef, settings}, checkContracts, {throwKinglyError, tracer}){
  if (checkContracts) {
    const {failingContracts} = fsmContractChecker(fsmDef, settings, checkContracts);
    try {
      if (failingContracts.length > 0) throwKinglyError({
        when: `Attempting to create a Kingly machine`,
        location: `createStateMachine`,
        info: {fsmDef, settings, failingContracts},
        message: `I found that one or more Kingly contracts are violated!`
      })
    }
    catch (e) {
      // Do not break the program, errors should be passed to console and dev tool
      tracer({
        type: MACHINE_CREATION_ERROR_MSG,
        trace: {
          info: e.errors,
          message: e.message,
          machineState: {cs: void 0, es: void 0, hs: void 0}
        }
      });
      return e
    }
  }
}


// Terminology
// . A transition is uniquely defined by `(origin, event, predicate, target, action, transition index, guard index)`
// For instance, the transition array `[{from: INIT_STATE, event:INIT_EVENT, to:A}, {from: A, event: Ev,
// guards : [{predicate: T, to:B, action: IDENTITY}] }]` has its first transition
// uniquely referenced by `(INIT_STATE, INIT_EVENT, undefined, undefined, A, 0, 0)`. The second transition would be
// referenced by `(A, Ev, T, B, IDENTITY, 1, 0)`.
// . We write A < B if A is a substate of B, with the implication that B is hence a compound state
// . We write A !< B if A is a direct substate of B
// . We write A. !< B if A is a substate of B, and A is also an atomic state
// . We write A -ev-> B to denote a transition from A to B triggered by `ev`

// Behaviour
// B6. If an event is configured to be processed by the state machine, it must progress the machine (possibly
// returning to the same state)
// ENFORCED by T13, T4, T10, necessary for generative testing
// B7. There is only one 'dead' state, the final state. Any other state should feature transitions which progress
// the state machine.
// NOT ENFORCED. Not very important in practice. Several final states may also appear, though it is weird
// ROADMAP : distingush a true final state. When final state receive event, throw? Not important in practice
// B8. It is possible to reach any states
// NOT ENFORCED. Just a warning to issue. reachable states requires a graph structure, and a traversal
