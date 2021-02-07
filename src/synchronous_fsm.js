//@ts-check
import {
  ACTION_IDENTITY,
  AUTO_EVENT, DEBUG_MSG,
  DEEP,
  ERROR_MSG,
  history_symbol,
  INIT_EVENT, INIT_INPUT_MSG,
  INIT_STATE, INPUT_MSG, INTERNAL_INPUT_MSG, INTERNAL_OUTPUTS_MSG, MACHINE_CREATION_ERROR_MSG,
  OUTPUTS_MSG,
  SHALLOW,
  STATE_PROTOTYPE_NAME,
  WARN_MSG
} from "./properties";
import {
  arrayizeOutput,
  assert,
  computeHistoryMaps,
  destructureEvent,
  emptyConsole,
  emptyTracer,
  findInitTransition,
  get_fn_name,
  getFsmStateList,
  initHistoryDataStructure,
  isActions,
  isEventStruct,
  isHistoryControlState,
  keys, KinglyError,
  updateHistory,
  wrap,
  throwKinglyErrorFactory, wrapUpdateStateFn
} from "./helpers";
import { runContracts } from "./contracts"

function alwaysTrue() {
  return true
};

/**
 * Processes the hierarchically nested states and returns miscellaneous objects derived from it:
 * `is_group_state`: Hash matching keys (state names) to whether that state is a nested state
 * `hash_states`: Hierarchically nested object whose properties are the nested states.
 * - Nested states inherit (prototypal inheritance) from the containing state.
 * - Holds a `history` property which holds a `last_seen_state` property which holds the latest
 * state for that hierarchy group For instance, if A < B < C and the state machine leaves C for a
 * state in another branch, then `last_seen_state` will be set to C for A, B and C
 * - Tthe root state (NOK) is added to the whole hierarchy, i.e. all states inherit from the root
 * state
 * `states` {Object<String,Boolean>} : Hash which maps every state name with itself
 * `states.history` {Object<String,Function>} : Hash which maps every state name with a function
 * whose name is the state name
 * @param states
 * @returns {{hashStates: {}, isGroupState: Object<String,Boolean>}}
 */
function buildNestedStateStructure(states) {
  const root_name = "State";
  let hashStates = {};
  let isGroupState = {};

  // Add the starting state
  states = { nok: states };

  ////////
  // Helper functions
  function build_state_reducer(states, curr_constructor) {
    keys(states).forEach(function (state_name) {
      const state_config = states[state_name];

      // The hierarchical state mechanism is implemented by reusing the standard Javascript
      // prototypal inheritance If A < B < C, then C has a B as prototype which has an A as
      // prototype So when an event handler (transition) is put on A, that event handler will be
      // visible in B and C
      hashStates[state_name] = new curr_constructor();
      hashStates[state_name].name = state_name;
      const parent_name = (hashStates[state_name].parent_name = get_fn_name(
        curr_constructor
      ));
      hashStates[state_name].root_name = root_name;

      if (typeof state_config === "object") {
        isGroupState[state_name] = true;
        const curr_constructor_new = function () {
        };
        curr_constructor_new.displayName = state_name;
        curr_constructor_new.prototype = hashStates[state_name];
        build_state_reducer(state_config, curr_constructor_new);
      }
    });
  }

  function State() {
  }

  State.prototype = {
    current_state_name: INIT_STATE
  };

  hashStates[INIT_STATE] = new State();
  hashStates[STATE_PROTOTYPE_NAME] = new State();

  build_state_reducer(states, State);

  return {
    hashStates: hashStates,
    isGroupState: isGroupState
  };
}

export function normalizeTransitions(fsmDef) {
  const { initialControlState, transitions } = fsmDef;
  const initTransition = findInitTransition(transitions);

  if (initialControlState) {
    return transitions
      .concat([{ from: INIT_STATE, event: INIT_EVENT, to: initialControlState, action: ACTION_IDENTITY }])
  }
  else if (initTransition) {
    return transitions
  }
}

/**
 *
 * @param {FSM_Def} fsmDef
 * @param {FSM_Settings} [settings]
 * @returns {Error | Stateful_FSM}
 */
export function createStateMachine(fsmDef, settings) {
  const res = createStateMachineAPIs(fsmDef, settings);
  if (res instanceof Error) return res
  else return res.withProtectedState
}

/**
 *
 * @param {FSM_Def} fsmDef
 * @param {FSM_Settings} settings
 * @returns {Error | Pure_FSM}
 */
export function createPureStateMachine(fsmDef, settings) {
  const res = createStateMachineAPIs(fsmDef, settings);
  if (res instanceof Error) return res
  else return res.withPureInterface
}

/**
 * Creates an instance of state machine from a set of states, transitions, and accepted events. The initial
 * extended state for the machine is included in the machine definition.
 * @param {FSM_Def} fsmDef
 * @param {FSM_Settings} settings
 * @return {{withProtectedState: Stateful_FSM, withPureInterface: Pure_FSM}|Error}
 */
export function createStateMachineAPIs(fsmDef, settings) {
  const {
    states: controlStates,
    events,
    // transitions ,
    initialExtendedState,
    updateState: userProvidedUpdateStateFn,
  } = fsmDef;
  const { debug, devTool, displayName } = settings || {};
  const checkContracts = debug && debug.checkContracts || void 0;
  let console = debug && debug.console || emptyConsole;
  let tracer = devTool && devTool.tracer || emptyTracer;
  const throwKinglyError = throwKinglyErrorFactory(console, tracer);

  // Check contracts if the API user wants to,
  // but don't throw errors, return them and possibly log them
  if (checkContracts) {
    const e = runContracts({ fsmDef, settings }, checkContracts, { throwKinglyError, tracer });
    if (e instanceof Error) return e
  }

  // Wrap user-provided update state function to capture errors
  const wrappedUpdateState = wrapUpdateStateFn(userProvidedUpdateStateFn, { throwKinglyError, tracer });
  // We also massage the shape of the user-provided transitions,
  // unifying the two ways of providing an initial state for the machine
  const transitions = normalizeTransitions(fsmDef);

  // Create auxiliary data structures to quickly answer common queries:
  // - is `stateName` a state that has an initial transition configured
  //   (top-level, or compound state) : `isInitState[stateName]`
  // - is `stateName` a transient state, i.e. with an configured
  //   initial or eventless transitions: `isAutoState[stateName]`
  // - is `stateName` a compound state: `isGroupState[stateName]`
  // - what computation to run in `stateName`:
  //   `hashStates[stateName][event]` has the event handler for `event`
  // NOTE: we use JS prototypal inheritance to make this work even when
  // A < ... < B. and the event handler in configured on parent A, and not on B
  // When the machine is in state B, it must answer to the event as A would
  // - what control state is the machine in:
  //   `hashStates[INIT_STATE].current_state_name`
  const hashStatesStruct = buildNestedStateStructure(controlStates);
  // @type {Object<state_name,boolean>}
  let isInitState = {};
  // @type {Object<state_name,boolean>}, allows to know whether a state has an automatic transition defined
  // that would be init transitions + eventless transitions
  let isAutoState = {};
  // @type {Object<state_name,boolean>}
  const isGroupState = hashStatesStruct.isGroupState;
  let hashStates = hashStatesStruct.hashStates;

  // Fill in the auxiliary data structures
  transitions.forEach(function (transition) {
    let { from, to, action, event, guards: arr_predicate } = transition;
    // CASE: ZERO OR ONE condition set
    if (!arr_predicate)
      arr_predicate = [{ predicate: void 0, to: to, action: action }];

    // CASE: transition has a init event
    // NOTE: there should ever only be one, but we don't enforce it here
    if (event === INIT_EVENT) {
      isInitState[from] = true;
    }

    let from_proto = hashStates[from];

    // CASE: automatic transitions: no events - likely a transient state with only conditions
    if (!event) {
      event = AUTO_EVENT;
      isAutoState[from] = true;
    }
    // CASE: automatic transitions : init event automatically fired upon entering a grouping state
    if (isGroupState[from] && isInitState[from]) {
      isAutoState[from] = true;
    }

    // NTH: this seriously needs refactoring, that is one line in ramda
    from_proto[event] = arr_predicate.reduce(
      (acc, guard, index) => {
        const action = guard.action || ACTION_IDENTITY;
        const actionName = action.name || action.displayName || "";
        const condition_checking_fn = (function (guard, settings) {
          let condition_suffix = "";
          // We add the `current_state` because the current control state might be different from
          // the `from` field here This is the case for instance when we are in a substate, but
          // through prototypal inheritance it is the handler of the prototype which is called
          const condition_checking_fn = function (extendedState_, event_data, current_state) {
            from = current_state || from;
            const predicate = guard.predicate || alwaysTrue;
            const predicateName = predicate.name || predicate.displayName || "<anonymous>";
            const to = guard.to;
            const shouldTransitionBeTaken = ((extendedState, event_data, settings) => {
              try {
                return predicate(extendedState, event_data, settings);
              }
              catch (e) {
                throwKinglyError({
                  when: `Executing predicate function ${predicateName}`,
                  location: `createStateMachine > event handler > condition_checking_fn > shouldTransitionBeTaken`,
                  info: { extendedState, event, event_data, settings, guard, from, to, index },
                  message: [`Error occurred while processing event ${event} with target state ${to}`, e.message].join("\n"),
                  stack: e.stack,
                })
              }
            })(extendedState_, event_data, settings);

            if (typeof shouldTransitionBeTaken !== "boolean") {
              throwKinglyError({
                when: `Executing predicate function ${predicateName}`,
                location: `createStateMachine > event handler > condition_checking_fn > throwIfInvalidGuardResult`,
                info: { event, guard, from, to, index, shouldTransitionBeTaken },
                message: `Guard index ${index} with name ${predicateName} did not return a boolean!`,
              })
            }

            if (shouldTransitionBeTaken) {
              // CASE : guard for transition is fulfilled so we can execute the actions...
              console.info("IN STATE ", from);
              if (guard.predicate) {
                tracer({
                  type: DEBUG_MSG,
                  trace: {
                    message: `The guard ${predicateName} is fulfilled`,
                    info: { eventData: event_data, from, action: actionName, to },
                    machineState: { cs: current_state, es: extendedState_, hs: history }
                  }
                });
                console.info(`CASE: guard ${predicate.name} for transition is fulfilled`);
              }
              else {
                tracer({
                  type: DEBUG_MSG,
                  trace: {
                    message: `Evaluating transition with no guards`,
                    info: { eventData: event_data, from, action: actionName, to },
                    machineState: { cs: current_state, es: extendedState, hs: history }
                  }
                });
                console.info(`CASE: unguarded transition`);
              }

              console.info("THEN : we execute the action " + actionName);
              const actionResult = ((extendedState, eventData, settings) => {
                try {
                  return action(extendedState, eventData, settings);
                }
                catch (e) {
                  throwKinglyError({
                    when: `Executing action factory ${actionName}`,
                    location: `createStateMachine > event handler > condition_checking_fn`,
                    info: { extendedState, event, event_data, settings, guard, from, to, index, action },
                    message: e.message,
                    stack: e.stack,
                  })
                }
              })(extendedState_, event_data, settings);

              if (!isActions(actionResult)) {
                throwKinglyError({
                  when: `Executing action factory ${actionName}`,
                  location: `createStateMachine > event handler > condition_checking_fn`,
                  info: { extendedState, event, event_data, settings, guard, from, to, index, action, actionResult },
                  message: `Action factory returned a value that does not have the expected shape!`,
                })
              }

              const { updates, outputs } = actionResult;

              // Leave the current state
              leaveState(from, extendedState_, hashStates);

              // Update the extendedState before entering the next state
              extendedState = wrappedUpdateState(extendedState_, updates);

              // ...and enter the next state (can be different from `to` if we have nesting state group)
              const newControlState = enterNextState(to, updates, hashStates);
              console.info("ENTERING NEXT STATE: ", cs);
              console.info("with extended state: ", extendedState);

              // allows for chaining and stop chaining guard
              return { stop: true, outputs };
            }
            else {
              // CASE : guard for transition is not fulfilled
              tracer({
                type: DEBUG_MSG,
                trace: {
                  message: guard.predicate ? `The guard ${predicateName} is not fulfilled!` : `Evaluated and skipped transition`,
                  info: { eventData: event_data, settings, guard, from, to, index, action: actionName },
                  machineState: { cs: current_state, es: extendedState, hs: history }
                }
              });
              return { stop: false, outputs: null };
            }
          };

          condition_checking_fn.displayName = from + condition_suffix;
          return condition_checking_fn;
        })(guard, settings);

        return function arr_predicate_reduce_fn(extendedState_, event_data, current_state) {
          const condition_checked = acc(extendedState_, event_data, current_state);
          return condition_checked.stop
            ? condition_checked
            : condition_checking_fn(extendedState_, event_data, current_state);
        };
      },
      function dummy() {
        return { stop: false, outputs: null };
      }
    );
  });

  // Setting up the initial state of the machine in closure
  // That is the control state, history state, and extended state
  // NOTE: the user-provided update function by contract cannot update in place
  // There is thus no need to clone the initial extended state.
  const { stateList, stateAncestors } = computeHistoryMaps(controlStates);
  let history = initHistoryDataStructure(stateList);
  let extendedState = initialExtendedState;
  let cs = INIT_STATE;

  // Run the machine's initial transition so it positions itself
  // in the configured control state
  try {
    start();
  }
  catch (e) {
    // Do not break the program, errors should be passed to console and dev tool
    tracer({
      type: MACHINE_CREATION_ERROR_MSG,
      trace: {
        message: e.message,
        info: { fsmDef, settings, error: e },
        machineState: { cs: INIT_STATE, es: extendedState, hs: history }
      }
    });
    return e
  }

  const fsmAPIs = {
    /**
     * @description This function encapsulates the behavior of a state machine. The function receives the input to be
     *   processed by the machine, and outputs the results of the machine computation. In the general case, the machine
     *   computes an array of values. The array can be empty, and when not, it may contain null values. The machine may
     *   also return null (in csae of an input that the machine is not configured to react to) instead of returning an
     *   array.
     * @param {*} input
     * @returns {FSM_Outputs|Error}
     * @throws if an error is produced that is not an error recognized by Kingly. This generally means an unexpected
     *   exception has occurred.
     */
    withProtectedState: function fsm(input) {
      try {
        const { eventName, eventData } = destructureEvent(input);

        tracer({
          type: INPUT_MSG,
          trace: {
            info: { eventName, eventData },
            machineState: { cs: cs, es: extendedState, hs: history }
          }
        });

        const outputs = sendEvent(input, false);

        debug && console.info("OUTPUTS:", outputs);
        tracer({
          type: OUTPUTS_MSG,
          trace: {
            outputs,
            machineState: { cs, es: extendedState, hs: history }
          }
        });

        return outputs
      }
      catch (e) {
        if (e instanceof KinglyError) {
          // We don't break the program, but we can't continue as if nothing happened: we return the error
          tracer({
            type: ERROR_MSG,
            trace: {
              error: e,
              message: `An error ocurred while running an input through the machine!`,
              machineState: { cs, es: extendedState, hs: history }
            }
          });

          return e
        }
        else {
          tracer({
            type: ERROR_MSG,
            trace: {
              error: e,
              message: `An unknown error ocurred while running an input through the machine!`,
              machineState: { cs, es: extendedState, hs: history }
            }
          });
          console.error(`yyield > unexpected error!`, e);
          // We should only catch the errors we are responsible for!
          throw e
        }
      }
    },
    /**
     * @description This function encapsulates the behavior of a state machine but requires to be passed both the
     *   machine internal state and an input from which to compute the machine outputs. According to the parameter
     *   passed as internal state, the machine may: 1. (undefined) compute outputs from the last state of the machine,
     *   1. (null) compute outputs, restarting from its initial state, 3. (truthy) compute outputs from the given state
     *   of the machine
     * @param {*} input
     * @param {FSM_Internal_State} fsmState
     * @returns {{outputs: FSM_Outputs|Error, fsmState: FSM_Internal_State}}
     */
    withPureInterface: function compute(input, fsmState) {
      if (fsmState === void 0) {
        // Don't update the state of the state machine
        // This means the machine will continue processing inputs
        // using its current state
      }
      else if (fsmState === null) {
        // Reinitialize the machine
        extendedState = initialExtendedState;
        history = initHistoryDataStructure(stateList);
        hashStates[INIT_STATE].current_state_name = INIT_STATE;
        start();
      }
      else {
        // Reset the state (available in closure) of the state machine
        const { cs: _cs, hs, es } = fsmState;
        extendedState = es;
        history = hs;
        cs = _cs;
      }

      // run the machine
      const outputs = fsmAPIs.withProtectedState(input);
      // NOTE: history does not need to be cloned here! We do not update the
      // history in place => No risk of accidentally modifying the history
      // of another machine
      // TODO: We should however definitely clone `extendedState` How to modify the API?
      // Require a clone function in settings? with a default of JSON.stringify?
      // or we shift the responsibility on the API user to do the cloning?
      // Good: faster in the default case, simpler library too, no cloning when not needed
      // Bad: library user can forget, so footgun...
      // ADR: API that forces to signal a clone function, which can be DEFAULT_CLONE
      return { outputs, fsmState: { cs, hs: history, es: extendedState } }
    }
  };

  return fsmAPIs

  // Auxiliary functions
  //

  /**
   *
   * @param {function(...*): True | Error} contract
   * @param {Array<*>} arrayParams
   * @returns {undefined}
   * @throws KinglyError in case of one or more failing contracts
   */
  function assertContract(contract, arrayParams) {
    const hasFailed = assert(contract, arrayParams);
    if (checkContracts && hasFailed) {
      throwKinglyError(hasFailed)
    }

    return void 0
  }

  /**
   * @description process an input (aka event) according to the machine specifications.
   * @param {LabelledEvent} event_struct input to be processed by the machine
   * @param {Boolean} isInternalEvent should be true iff the event is sent by Kingly, not by the
   * API user. API user should always leave this undefined.
   * This works around an edge case discovered through testing.
   * With the fix implemented here, API users that send an INIT_EVENT will have it ignored.
   * INIT_EVENT is reserved and API users should not use it. This fix is for robustness purposes.
   * @returns {FSM_Outputs|null}
   */
  function sendEvent(event_struct, isInternalEvent) {
    assertContract(isEventStruct, [event_struct]);

    const { eventName, eventData } = destructureEvent(event_struct);

    console.group("send event " + eventName || "");
    console.log(event_struct);

    // Edge case to deal with: INIT_EVENT sent and the current state is the initial state
    // This is a side-effect of our implementation that leverages JS prototypes.
    // The INIT_STATE is a super-state of all states in the machine. Hence sending an INIT_EVENT
    // would always execute the INIT transition by prototypal delegation.
    // This led to a bug where an API user would maliciously send the reserved INIT_EVENT,
    // thus resetting the machine in its initial state, with an unpredictable extended state!
    // That, in turn, results from a **design mistake** that I will not correct here, which consisted
    // in letting API users configure an initial control state, OR initial INIT_EVENT transitions.
    // ADR: the impact is small, the fix is ok. API users have more flexibility at the
    // cost of implementation complexity. But next time, pick simplicity over flexibility.
    if (!isInternalEvent && eventName === INIT_EVENT && cs !== INIT_STATE) {
      tracer({
        type: WARN_MSG,
        trace: {
          info: { eventName, eventData },
          message: `The external event INIT_EVENT can only be sent when starting the machine!`,
          machineState: { cs: cs, es: extendedState, hs: history }
        }
      });
      console.warn(`The external event INIT_EVENT can only be sent when starting the machine!`)
      console.groupEnd();

      return null
    }

    const outputs = processEvent(
      hashStatesStruct.hashStates,
      eventName,
      eventData,
      extendedState
    );

    console.groupEnd();

    return outputs
  }

  function processEvent(hashStates, event, eventData, extendedState) {
    const oldCurrentState = cs;
    const eventHandler = hashStates[oldCurrentState][event];

    // CASE : There is a transition associated to that event
    if (eventHandler) {
      console.log("found event handler!");
      console.info("WHEN EVENT ", event, eventData);

      // The transition is evaluated:
      // - no guards are satisfied => outputs = null
      // - guards satisfied => outputs an array, possibly containing a null value
      /** OUT: this event handler modifies the in-closure machine state (extendedState, cs, history state) */
      const { stop, outputs: rawOutputs } = eventHandler(extendedState, eventData, oldCurrentState);
      const newControlState = cs;
      debug && !stop && console.warn("No guards have been fulfilled! We recommend to configure guards explicitly to" +
        " cover the full state space!")
      const outputs = arrayizeOutput(rawOutputs);

      // Two cases here:
      // 1. Init handlers, when present on the new control state, must be acted on immediately
      // This allows for sequence of init events in various state levels
      // For instance, L1:init -> L2:init -> L3:init -> L4: stateX
      // In this case, eventData will be passed on every INIT_EVENT
      // 2. eventless transitions
      // NOTE : the inside guard is to defend against loops occuring when an AUTO transition fails to advance and stays
      // in the same control state!! But by contract that should never happen: all AUTO transitions should advance!
      if (isAutoState[newControlState]) {
        if (newControlState !== oldCurrentState) {
          const auto_event = isInitState[newControlState]
            ? INIT_EVENT
            : AUTO_EVENT;

          tracer({
            type: INTERNAL_INPUT_MSG,
            trace: {
              info: { eventName: auto_event, eventData: eventData },
              event: { [auto_event]: eventData },
              machineState: { cs, es: extendedState, hs: history }
            }
          });

          const nextOutputs = sendEvent({ [auto_event]: eventData }, true);

          tracer({
            type: INTERNAL_OUTPUTS_MSG,
            trace: {
              outputs: nextOutputs,
              machineState: { cs, es: extendedState, hs: history }
            }
          });

          return [].concat(outputs).concat(nextOutputs);
        }
        else {
          // We found an eventless transition that returns to the same control state!
          // This is forbidden as this may generate infinite loops on that stationary control state
          // We throw in that case, as this is a breach of contract, one which we should
          // detect at configuration time.
          console.error(`Eventless transitions (event |${event}| in state |${cs}|) cannot return to the same control state!! This is forbidden to avoid possible infinite loops.`);
          tracer({
            type: ERROR_MSG,
            trace: {
              info: { received: { [event]: eventData } },
              message: `Eventless transitions (event |${event}| in state |${cs}|) cannot return to the same control state!! This is forbidden to avoid possible infinite loops.`,
              machineState: { cs: cs, es: extendedState, hs: history }
            }
          });

          throwKinglyError({
            message: `Eventless transitions (event |${event}| in state |${cs}|) cannot return to the same control state!! This is forbidden to avoid possible infinite loops.`,
            location: "processEvent"
          })
        }
      }
      else return outputs;
    }
    // CASE : There is no transition associated to that event from that state
    else {
      console.warn(`There is no transition associated to the event |${event}| in state |${cs}|!`);
      tracer({
        type: WARN_MSG,
        trace: {
          info: { received: { [event]: eventData } },
          message: `There is no transition associated to the event |${event}| in state |${cs}|!`,
          machineState: { cs: cs, es: extendedState, hs: history }
        }
      });

      return null;
    }
  }

  function leaveState(from, extendedState, hash_states) {
    history = updateHistory(history, stateAncestors, hash_states[from].name);

    console.info("left state", wrap(from));
  }

  function enterNextState(to, updatedExtendedState, hash_states) {
    let targetStateName;

    // CASE: history state (H)
    if (isHistoryControlState(to)) {
      const historyType = to[DEEP] ? DEEP : to[SHALLOW] ? SHALLOW : void 0;
      const historyTarget = to[historyType];

      // Contract: history state MUST be associated to compound state (else there is no history to be had)
      if (!isInitState[historyTarget]) {
        const message = `Configured a history state unrelated to a compound state! The behaviour of the machine is thus unspecified. Please review your machine configuration`;
        debug && console && console.error(message);
        throwKinglyError({ message })
      }

      // Edge case: If there is no history for the compound state, then we evaluate the
      // initial transition for that compound state, i.e. we set that state as target state
      targetStateName = history[historyType][historyTarget] || historyTarget;
    }
    // CASE: not a history state
    else if (to) {
      targetStateName = hash_states[to].name;
    }
    // Dead branch: should never happen
    else {
      throwKinglyError({ message: "enter_state : unknown case! Not a state name, and not a history state to enter!" });
    }
    cs = targetStateName;

    tracer({
      type: DEBUG_MSG,
      trace: {
        message: isHistoryControlState(to)
          ? `Entering history state for ${to[to.deep ? DEEP : to.shallow ? SHALLOW : void 0]}`
          : `Entering state ${to}`,
        machineState: { cs, es: extendedState, hs: history }
      }
    });
    debug && console.info("AND TRANSITION TO STATE", targetStateName);
    return targetStateName;
  }

  function start() {
    tracer({
      type: INIT_INPUT_MSG,
      trace: {
        info: { eventName: INIT_EVENT, eventData: initialExtendedState },
        event: { [INIT_EVENT]: initialExtendedState },
        machineState: { cs, es: extendedState, hs: history }
      }
    });

    return sendEvent({ [INIT_EVENT]: initialExtendedState }, true);
  }

}

// TODO: have a look at implementation of React-state-driven and see if makes sense
// also test it with the codesandbox from old versions *ivi for instance
/**
 * @typedef {Object} WebComponentFactoryParams
 * @property {String} name Name for the web component. Must include at least one hyphen per custom
 * components' specification
 * @property {Subject} eventHandler A factory function which returns a subject, i.e. an object which
 * implements the `Observer` and `Observable` interface
 * @property {Stateful_FSM} fsm An executable machine, i.e. a function which accepts machine inputs
 * @property {Object.<CommandName, CommandHandler>} commandHandlers
 * @property {*} effectHandlers Typically anything necessary to perform effects. Usually this is a hashmap mapping an
 *   effect moniker to a function performing the corresponding effect.
 * @property {{initialEvent, terminalEvent, NO_ACTION}} options
 */
/**
 * @param {WebComponentFactoryParams} webComponentFactoryParams
 */
export function makeWebComponentFromFsm({ name, eventHandler, fsm, commandHandlers, effectHandlers, options }) {
  class FsmComponent extends HTMLElement {
    constructor() {
      if (name.split('-').length <= 1) throw `makeWebComponentFromFsm : web component's name MUST include a dash! Please review the name property passed as parameter to the function!`
      super();
      const el = this;
      this.eventSubject = eventHandler;
      this.options = Object.assign({}, options);
      const NO_ACTION = this.options.NO_ACTION || null;

      // Set up execution of commands
      this.eventSubject.subscribe({
        next: eventStruct => {
          const actions = fsm(eventStruct);

          if (actions instanceof Error) {
            console && console.error(actions);
            // NOTE: we do not throw here, the web component will fail
            // but the rest of the page may go on.
          }
          else if (actions === NO_ACTION) return;
          else {
            actions.forEach(action => {
              if (action === NO_ACTION) return;
              const { command, params } = action;
              commandHandlers[command](this.eventSubject.next, params, effectHandlers, el);
            })
          }
          ;
        }
      });
    }

    static get observedAttributes() {
      return [];
    }

    connectedCallback() {
      this.options.initialEvent && this.eventSubject.next(this.options.initialEvent);
    }

    disconnectedCallback() {
      this.options.terminalEvent && this.eventSubject.next(this.options.terminalEvent);
      this.eventSubject.complete();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      // simulate a new creation every time an attribute is changed
      // i.e. they are not expected to change
      this.constructor();
      this.connectedCallback();
    }
  }

  return customElements.define(name, FsmComponent);
}

/**
 * This function works to merge outputs by simple concatenation and flattening
 * Every action return T or [T], and we want in output [T] always
 * mergeOutputsFn([a, [b]) = mergeOutputsFn([a,b]) = mergeOutputsFn([[a],b) = mergeOutputsFn([[a],[b]]) = [a,b]
 * If we wanted to pass [a] as value we would have to do mergeOutputsFn([[[a]],[b]]) to get [[a],b]
 * @param arrayOutputs
 * @returns {*}
 */
export function mergeOutputsFn(arrayOutputs) {
  // NOTE : here, this array of outputs could be array x non-array ^n
  // The algorithm is to concat all elements
  return arrayOutputs.reduce((acc, element) => acc.concat(element), [])
}

/**
 * Construct history states `hs` from a list of states for a given state machine. The history states for a given control
 * state can then be referenced as follows :
 * - `hs.shallow(state)` will be the shallow history state associated to the `state`
 * - `hs.deep(state)` will be the deep history state associated to the `state`
 * @param {FSM_States} states
 * @return {HistoryStateFactory}
 */
export function makeHistoryStates(states) {
  const stateList = Object.keys(getFsmStateList(states));
  // used for referential equality comparison to discriminate history type

  return (historyType, controlState) => {
    if (!stateList.includes(controlState)) {
      throw `makeHistoryStates: the state for which a history state must be constructed is not a configured state for the state machine under implementation!!`
    }

    return {
      [historyType]: controlState,
      type: history_symbol
    }
  }
}

export function historyState(historyType, controlState) {
  return {
    [historyType]: controlState
  }
}
