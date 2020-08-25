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
  wrap
} from "./helpers";
import {fsmContractChecker} from "./contracts"

function alwaysTrue() {
  return true
};

/**
 * Processes the hierarchically nested states and returns miscellaneous objects derived from it:
 * `is_group_state` : {Object<String,Boolean>} Hash whose properties (state names) are matched with
 * whether that state is a nested state
 * `hash_states` : Hierarchically nested object whose properties are the nested states.
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
 * @returns {{hash_states: {}, is_group_state: {}}}
 */
function build_nested_state_structure(states) {
  const root_name = "State";
  let hash_states = {};
  let is_group_state = {};

  // Add the starting state
  states = {nok: states};

  ////////
  // Helper functions
  function build_state_reducer(states, curr_constructor) {
    keys(states).forEach(function (state_name) {
      const state_config = states[state_name];

      // The hierarchical state mechanism is implemented by reusing the standard Javascript
      // prototypal inheritance If A < B < C, then C has a B as prototype which has an A as
      // prototype So when an event handler (transition) is put on A, that event handler will be
      // visible in B and C
      hash_states[state_name] = new curr_constructor();
      hash_states[state_name].name = state_name;
      const parent_name = (hash_states[state_name].parent_name = get_fn_name(
        curr_constructor
      ));
      hash_states[state_name].root_name = root_name;

      if (typeof state_config === "object") {
        is_group_state[state_name] = true;
        const curr_constructor_new = function () {
        };
        curr_constructor_new.displayName = state_name;
        curr_constructor_new.prototype = hash_states[state_name];
        build_state_reducer(state_config, curr_constructor_new);
      }
    });
  }

  function State() {
  }

  State.prototype = {
    current_state_name: INIT_STATE
  };

  hash_states[INIT_STATE] = new State();
  hash_states[STATE_PROTOTYPE_NAME] = new State();

  build_state_reducer(states, State);

  return {
    hash_states: hash_states,
    is_group_state: is_group_state
  };
}

export function normalizeTransitions(fsmDef) {
  const {initialControlState, transitions} = fsmDef;
  const initTransition = findInitTransition(transitions);

  if (initialControlState) {
    return transitions
      .concat([{from: INIT_STATE, event: INIT_EVENT, to: initialControlState, action: ACTION_IDENTITY}])
  }
  else if (initTransition) {
    return transitions
  }
}

export function createStateMachine(fsmDef, settings) {
  const res = createStateMachineAPIs(fsmDef, settings);
  if (res instanceof Error) return res
    else return res.withProtectedState
}

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
 * @return {{withProtectedState: function(input), withPureState: function(input, fsmState)}}|Error
 */
export function createStateMachineAPIs(fsmDef, settings) {
  const {
    states: control_states,
    events,
    // transitions ,
    initialExtendedState,
    updateState: userProvidedUpdateStateFn,
  } = fsmDef;
  const {debug, devTool, displayName} = settings || {};
  const checkContracts = debug && debug.checkContracts || void 0;
  let console = debug && debug.console || emptyConsole;
  let tracer = devTool && devTool.tracer || emptyTracer;
  const throwKinglyError = obj => {
    throw new KinglyError(obj, console, tracer)
  };

  // Conracts must be checked before we start doing all sort of computations
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
          machineState: {cs: undefined, es: initialExtendedState, hs: undefined}
        }
      });
      return e
    }
  }

  const wrappedUpdateState = (extendedState, updates) => {
    const fnName = userProvidedUpdateStateFn.name || userProvidedUpdateStateFn.displayName || "";

    try {
      return userProvidedUpdateStateFn(extendedState, updates)
    }
    catch (e) {
      throwKinglyError({
        when: `Executing updateState function ${fnName}`,
        location: `createStateMachine > wrappedUpdateState`,
        info: {extendedState, updates},
        message: e.message,
        stack: e.stack,
      })
    }
  };
  const transitions = normalizeTransitions(fsmDef);

  // Create the nested hierarchy
  const hash_states_struct = build_nested_state_structure(control_states);

  // This will be the extended state object which will be updated by all actions and on which conditions
  // will be evaluated It is safely contained in a closure so it cannot be accessed in any way
  // outside the state machine.
  // Note the extended state is modified by the `settings.updateState` function, which should not modify
  // the extended state object. There is hence no need to do any cloning.
  let extendedState = initialExtendedState;

  // history maps
  const {stateList, stateAncestors} = computeHistoryMaps(control_states);
  let history = initHistoryDataStructure(stateList);

  // @type {Object<state_name,boolean>}, allows to know whether a state has a init transition defined
  let is_init_state = {};
  // @type {Object<state_name,boolean>}, allows to know whether a state has an automatic transition defined
  // that would be init transitions + eventless transitions
  let is_auto_state = {};
  // @type {Object<state_name,boolean>}, allows to know whether a state is a group of state or not
  const is_group_state = hash_states_struct.is_group_state;
  let hash_states = hash_states_struct.hash_states;

  function assertContract(contract, arrayParams) {
    const hasFailed = assert(contract, arrayParams);
    if (checkContracts && hasFailed) {
      throwKinglyError(hasFailed)
    }

    return void 0
  }

  function getCurrentControlState() {
    return hash_states[INIT_STATE].current_state_name
  }

  function send_event(event_struct, isExternalEvent) {
    assertContract(isEventStruct, [event_struct]);

    const {eventName, eventData} = destructureEvent(event_struct);
    const current_state = getCurrentControlState();

    console.debug("send event", event_struct);

    // Edge case : INIT_EVENT sent and the current state is not the initial state
    // We have to do this separately, as by construction the INIT_STATE is a
    // super state of all states in the machine. Hence sending an INIT_EVENT
    // would always execute the INIT transition by prototypal delegation
    if (isExternalEvent && eventName === INIT_EVENT && current_state !== INIT_STATE) {
      tracer({
        type: WARN_MSG,
        trace: {
          info: {eventName, eventData},
          message: `The external event INIT_EVENT can only be sent when starting the machine!`,
          machineState: {cs: current_state, es: extendedState, hs: history}
        }
      });
      console.warn(`The external event INIT_EVENT can only be sent when starting the machine!`)

      return null
    }

    const outputs = process_event(
      hash_states_struct.hash_states,
      eventName,

      eventData,
      extendedState
    );

    return outputs
  }

  function process_event(hash_states, event, event_data, extendedState) {
    const current_state = hash_states[INIT_STATE].current_state_name;
    const event_handler = hash_states[current_state][event];

    if (event_handler) {
      // CASE : There is a transition associated to that event
      console.log("found event handler!");
      console.info("WHEN EVENT ", event, event_data);
      /* OUT : this event handler modifies the extendedState and possibly other data structures */
      const {stop, outputs: rawOutputs} = event_handler(extendedState, event_data, current_state);
      debug && !stop && console.warn("No guards have been fulfilled! We recommend to configure guards explicitly to" +
        " cover the full state space!")
      const outputs = arrayizeOutput(rawOutputs);

      // we read it anew as the execution of the event handler may have changed it
      const new_current_state = hash_states[INIT_STATE].current_state_name;

      // Two cases here:
      // 1. Init handlers, when present on the current state, must be acted on immediately
      // This allows for sequence of init events in various state levels
      // For instance, L1: init -> L2:init -> L3:init -> L4: stateX
      // In this case event_data will carry on the data passed on from the last event (else we loose
      // the extendedState?)
      // 2. transitions with no events associated, only conditions (i.e. transient states)
      // NOTE : the guard is to defend against loops occuring when an AUTO transition fails to advance and stays
      // in the same control state!! But by contract that should never happen : all AUTO transitions should advance!
      // TODO : test that case, what is happening? I should add a branch and throw!!
      if (is_auto_state[new_current_state] && new_current_state !== current_state) {
        // CASE : transient state with no triggering event, just conditions
        // automatic transitions = transitions without events
        const auto_event = is_init_state[new_current_state]
          ? INIT_EVENT
          : AUTO_EVENT;

        tracer({
          type: INTERNAL_INPUT_MSG,
          trace: {
            info: {eventName: auto_event, eventData: event_data},
            event: {[auto_event]: event_data},
            machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
          }
        });

        const nextOutputs = send_event({[auto_event]: event_data}, false);

        tracer({
          type: INTERNAL_OUTPUTS_MSG,
          trace: {
            outputs: nextOutputs,
            machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
          }
        });

        return [].concat(outputs).concat(nextOutputs);
      } else return outputs;
    } else {
      // CASE : There is no transition associated to that event from that state
      console.warn(`There is no transition associated to the event |${event}| in state |${current_state}|!`);
      tracer({
        type: WARN_MSG,
        trace: {
          info: {received: {[event]: event_data}},
          message: `There is no transition associated to the event |${event}| in state |${current_state}|!`,
          machineState: {cs: current_state, es: extendedState, hs: history}
        }
      });

      return null;
    }
  }

  function leave_state(from, extendedState, hash_states) {
    // NOTE : extendedState is passed as a parameter for symetry reasons, no real use for it so far
    const state_from = hash_states[from];
    const state_from_name = state_from.name;

    history = updateHistory(history, stateAncestors, state_from_name);

    console.info("left state", wrap(from));
  }

  function enter_next_state(to, updatedExtendedState, hash_states) {
    let state_to;
    let state_to_name;
    // CASE : history state (H)
    if (isHistoryControlState(to)) {
      const history_type = to.deep ? DEEP : to.shallow ? SHALLOW : void 0;
      const history_target = to[history_type];
      // Edge case : history state (H) && no history (i.e. first time state is entered), target state
      // is the entered state
      // TODO: edge case should be init state for compound state, and check it is recursively descended,
      // and error if the history target is an atomic state
      // if (!is_auto_state(history_target)) throw `can't be atomic state`
      // then by setting the compound state, it should evolve toward to init control state naturally
      debug && console && !is_init_state[history_target] && console.error(`Configured a history state which does not relate to a compound state! The behaviour of the machine is thus unspecified. Please review your machine configuration`);
      state_to_name = history[history_type][history_target] || history_target;
      state_to = hash_states[state_to_name];
    }
    else if (to) {
      // CASE : normal state
      state_to = hash_states[to];
      state_to_name = state_to.name;
    } else {
      throwKinglyError ("enter_state : unknown case! Not a state name, and not a history state to enter!");
    }
    hash_states[INIT_STATE].current_state_name = state_to_name;

    tracer({
      type: DEBUG_MSG,
      trace: {
        message: isHistoryControlState(to)
          ? `Entering history state for ${to[to.deep ? DEEP : to.shallow ? SHALLOW : void 0]}`
          : `Entering state ${to}`,
        machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
      }
    });
    debug && console.info("AND TRANSITION TO STATE", state_to_name);
    return state_to_name;
  }

  function start() {
    tracer({
      type: INIT_INPUT_MSG,
      trace: {
        info: {eventName: INIT_EVENT, eventData: initialExtendedState},
        event: {[INIT_EVENT]: initialExtendedState},
        machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
      }
    });

    return send_event({[INIT_EVENT]: initialExtendedState}, true);
  }

  transitions.forEach(function (transition) {
    let {from, to, action, event, guards: arr_predicate} = transition;
    // CASE : ZERO OR ONE condition set
    if (!arr_predicate)
      arr_predicate = [{predicate: void 0, to: to, action: action}];

    // CASE : transition has a init event
    // NOTE : there should ever only be one, but we don't enforce it here
    if (event === INIT_EVENT) {
      is_init_state[from] = true;
    }

    let from_proto = hash_states[from];

    // CASE : automatic transitions : no events - likely a transient state with only conditions
    if (!event) {
      event = AUTO_EVENT;
      is_auto_state[from] = true;
    }
    // CASE : automatic transitions : init event automatically fired upon entering a grouping state
    if (is_group_state[from] && is_init_state[from]) {
      is_auto_state[from] = true;
    }

    // NTH: this seriously needs refactoring, that is one line in ramda
    from_proto[event] = arr_predicate.reduce((acc, guard, index) => {
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
                  info: {extendedState, event, event_data, settings, guard, from, to, index},
                  message: [`Error occurred while processing event ${event} with target state ${to}`, e.message].join("\n"),
                  stack: e.stack,
                })
              }
            })(extendedState_, event_data, settings);

            if (typeof shouldTransitionBeTaken !== "boolean") {
              throwKinglyError({
                when: `Executing predicate function ${predicateName}`,
                location: `createStateMachine > event handler > condition_checking_fn > throwIfInvalidGuardResult`,
                info: {event, guard, from, to, index, shouldTransitionBeTaken},
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
                    info: {eventData: event_data, from, action: actionName, to},
                    machineState: {cs: current_state, es: extendedState_, hs: history}
                  }
                });
                console.info(`CASE: guard ${predicate.name} for transition is fulfilled`);
              }
              else {
                tracer({
                  type: DEBUG_MSG,
                  trace: {
                    message: `Evaluating transition with no guards`,
                    info: {eventData: event_data, from, action: actionName, to},
                    machineState: {cs: current_state, es: extendedState, hs: history}
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
                    info: {extendedState, event, event_data, settings, guard, from, to, index, action},
                    message: e.message,
                    stack: e.stack,
                  })
                }
              })(extendedState_, event_data, settings);

              if (!isActions(actionResult)) {
                throwKinglyError({
                  when: `Executing action factory ${actionName}`,
                  location: `createStateMachine > event handler > condition_checking_fn`,
                  info: {extendedState, event, event_data, settings, guard, from, to, index, action, actionResult},
                  message: `Action factory returned a value that does not have the expected shape!`,
                })
              }

              const {updates, outputs} = actionResult;

              // Leave the current state
              leave_state(from, extendedState_, hash_states);

              // Update the extendedState before entering the next state
              extendedState = wrappedUpdateState(extendedState_, updates);

              // ...and enter the next state (can be different from `to` if we have nesting state group)
              const next_state = enter_next_state(to, updates, hash_states);
              console.info("ENTERING NEXT STATE: ", next_state);
              console.info("with extended state: ", extendedState);

              // allows for chaining and stop chaining guard
              return {stop: true, outputs};
            }
            else {
              // CASE : guard for transition is not fulfilled
              tracer({
                type: DEBUG_MSG,
                trace: {
                  message: guard.predicate ? `The guard ${predicateName} is not fulfilled!` : `Evaluated and skipped transition`,
                  info: {eventData: event_data, settings, guard, from, to, index, action: actionName},
                  machineState: {cs: current_state, es: extendedState, hs: history}
                }
              });
              return {stop: false, outputs: null};
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
        return {stop: false, outputs: null};
      }
    );
  });

  try {
    start();
  }
  catch (e) {
    // Do not break the program, errors should be passed to console and dev tool
    tracer({
      type: MACHINE_CREATION_ERROR_MSG,
      trace: {
        message: e.message,
        info: {fsmDef, settings, error: e},
        machineState: {cs: INIT_STATE, es: extendedState, hs: history}
      }
    });
    return e
  }

  const fsmAPIs = {
  // NOTE : yield is a reserved JavaScript word so using yyield
    withProtectedState:   function yyield(x) {
      try {
        const {eventName, eventData} = destructureEvent(x);
        const current_state = getCurrentControlState();

        tracer({
          type: INPUT_MSG,
          trace: {
            info: {eventName, eventData},
            machineState: {cs: current_state, es: extendedState, hs: history}
          }
        });

        const outputs = send_event(x, true);

        debug && console.info("OUTPUTS:", outputs);
        tracer({
          type: OUTPUTS_MSG,
          trace: {
            outputs,
            machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
          }
        });

        return outputs
      }
      catch (e) {
        if (e instanceof KinglyError) {
          // We don't break the program, but we can't continue as nothing happened: we return the error
          tracer({
            type: ERROR_MSG,
            trace: {
              error: e,
              message: `An error ocurred while running an input through the machine!`,
              machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
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
              machineState: {cs: getCurrentControlState(), es: extendedState, hs: history}
            }
          });
          console.error(`yyield > unexpected error!`, e);
          // We should only catch the errors we are responsible for!
          throw e
        }
      }
    },
    withPureInterface: function compute(input, fsmState){
      if (fsmState === void 0){
        // Don't update the state of the state machine
        // This means the machine will continue processing inputs
        // using its current state
      }
      else if (fsmState == null) {
        // Reinitialize the machine
        extendedState = initialExtendedState;
        history = initHistoryDataStructure(stateList);
        hash_states[INIT_STATE].current_state_name = INIT_STATE;
        start();
      }
      else {
        // Reset the state (available in closure) of the state machine
      const {cs, hs, es} = fsmState;
        extendedState = es;
        history = hs;
        hash_states[INIT_STATE].current_state_name = cs;
      }
      // run the machine
      const outputs = fsmAPIs.withProtectedState(input);
      return {outputs, fsmState: {cs: getCurrentControlState(), hs:history, es:extendedState}}
    }
  }

  return fsmAPIs
}

/**
 *
 * @param {WebComponentName} name name for the web component. Must include at least one hyphen per custom
 * components' specification
 * @param {Subject} eventHandler A factory function which returns a subject, i.e. an object which
 * implements the `Observer` and `Observable` interface
 * @param {FSM} fsm An executable machine, i.e. a function which accepts machine inputs
 * @param {Object.<CommandName, CommandHandler>} commandHandlers
 * @param {*} effectHandlers Typically anything necessary to perform effects. Usually this is a hashmap mapping an effect moniker to a function performing the corresponding effect.
 * @param {{initialEvent, terminalEvent, NO_ACTION}} options
 */
export function makeWebComponentFromFsm({name, eventHandler, fsm, commandHandlers, effectHandlers, options}) {
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

          if (actions === NO_ACTION) return;
          actions.forEach(action => {
            if (action === NO_ACTION) return;
            const {command, params} = action;
            commandHandlers[command](this.eventSubject.next, params, effectHandlers, el);
          });
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
