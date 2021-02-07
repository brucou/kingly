// Ramda fns
import {
  ACTION_FACTORY_DESC, DEEP, ENTRY_ACTION_FACTORY_DESC, FUNCTION_THREW_ERROR, HISTORY_PREFIX, HISTORY_STATE_NAME,
  INIT_EVENT, INIT_STATE, INVALID_ACTION_FACTORY_EXECUTED, INVALID_PREDICATE_EXECUTED, MACHINE_CREATION_ERROR_MSG,
  NO_OUTPUT,
  PREDICATE_DESC,
  SHALLOW, WRONG_EVENT_FORMAT_ERROR
} from "./properties"
import {objectTreeLenses, PRE_ORDER, traverseObj} from "fp-rosetree"

export const noop = () => {
};
export const emptyConsole = {log: noop, warn: noop, info: noop, debug: noop, error: noop, trace: noop, group:noop, groupEnd: noop};
export const emptyTracer = noop;

export function isBoolean(x) {
  return typeof x === 'boolean'
}

export function isFunction(x) {
  return typeof x === 'function'
}

export function isControlState(x) {
  return x && typeof x === 'string' || isHistoryControlState(x)
}

export function isEvent(x) {
  return typeof x === 'undefined' || typeof x === 'string'
}

export function isActionFactory(x) {
  return x && typeof x === 'function'
}

export function make_states(stateList) {
  return stateList.reduce((acc, state) => {
    acc[state] = "";
    return acc
  }, {})
}

export function make_events(eventList) {
  return eventList
}

/**
 * Returns the name of the function as taken from its source definition.
 * For instance, function do_something(){} -> "do_something"
 * @param fn {Function}
 * @returns {String}
 */
export function get_fn_name(fn) {
  const tokens =
    /^[\s\r\n]*function[\s\r\n]*([^\(\s\r\n]*?)[\s\r\n]*\([^\)\s\r\n]*\)[\s\r\n]*\{((?:[^}]*\}?)+)\}\s*$/
      .exec(fn.toString());
  return tokens[1];
}

export function wrap(str) {
  return ['-', str, '-'].join("");
}

export function times(fn, n) {
  return Array.apply(null, {length: n}).map(Number.call, Number).map(fn)
}

export function always(x) {
  return x
}

export function keys(obj) {
  return Object.keys(obj)
}

export function merge(a, b) {
  return Object.assign({}, a, b)
}

// Contracts

export function is_history_transition(transition) {
  return transition.to.startsWith(HISTORY_PREFIX)
}

export function is_entry_transition(transition) {
  return transition.event === INIT_EVENT
}

export function is_from_control_state(controlState) {
  return function (transition) {
    return transition.from === controlState
  }
}

export function is_to_history_control_state_of(controlState) {
  return function (transition) {
    return is_history_control_state_of(controlState, transition.to)
  }
}

export function is_history_control_state_of(controlState, state) {
  return state.substring(HISTORY_PREFIX.length) === controlState
}

export function format_transition_label(_event, predicate, action) {
  const event = _event || '';
  return predicate && action
    ? `${event} [${predicate.name}] / ${action.name}`
    : predicate
      ? `${event} [${predicate.name}]}`
      : action
        ? `${event} / ${action.name}`
        : `${event}`
}

export function format_history_transition_state_name({from, to}) {
  return `${from}.${to.substring(HISTORY_PREFIX.length)}.${HISTORY_STATE_NAME}`
}

export function get_all_transitions(transition) {
  const {from, event, guards} = transition;

  return guards
    ? guards.map(({predicate, to, action}) => ({from, event, predicate, to, action}))
    : [transition];
}

/**
 * 'this_name' => 'this name'
 * @param {String} str
 * @returns {String}
 */
export function getDisplayName(str) {
  return str.replace(/_/g, ' ')
}

/**
 * This function MERGES extended state updates. That means that given two state updates, the resulting state update
 * will be the concatenation of the two, in the order in which they are passed
 * @param {function[]}  arrayUpdateActions
 * @returns {function(*=, *=, *=): {updates: *}}
 */
export function mergeModelUpdates(arrayUpdateActions) {
  return function (extendedState, eventData, settings) {
    return {
      updates: arrayUpdateActions.reduce((acc, updateAction) => {
        const update = updateAction(extendedState, eventData, settings).updates;
        if (update) {
          return acc.concat(update)
        }
        else {
          return acc
        }
      }, []),
      outputs: NO_OUTPUT
    }
  }
}

/**
 * This function CHAINS extended state updates, in the order in which they are passed. It is thus similar to a pipe.
 * The second update function receives the state updated by the first update function.
 * @param {function[]}  arrayUpdateActions
 */
export function chainModelUpdates(arrayUpdateActions) {
  return function (extendedState, eventData, settings) {
    const {updateState} = settings;
    return {
      updates: arrayUpdateActions
        .reduce((acc, updateAction) => {
          const {extendedState, updates} = acc;
          const update = updateAction(extendedState, eventData, settings).updates;
          const updatedState = updateState(extendedState, updates)

          return {extendedState: updatedState, updates: update}
        }, {extendedState, updates: []})
        .updates || [],
      outputs: NO_OUTPUT
    }
  }
}

/**
 *
 * @param {function (Array<Array<MachineOutput>>) : Array<MachineOutput>} mergeOutputFn
 * @param {Array<ActionFactory>} arrayActionFactory
 * @returns {function(*=, *=, *=): {updates: *[], outputs: *|null}}
 */
export function mergeActionFactories(mergeOutputFn, arrayActionFactory) {
  return function (extendedState, eventData, settings) {
    const arrayActions = arrayActionFactory.map(factory => factory(extendedState, eventData, settings));
    const arrayStateUpdates = arrayActions.map(x => x.updates || []);
    const arrayOutputs = arrayActions.map(x => x.outputs || {});

    return {
      updates: [].concat(...arrayStateUpdates),
      // for instance, mergeFn = R.mergeAll or some variations around R.mergeDeepLeft
      outputs: mergeOutputFn(arrayOutputs)
    }
  }
}

/** @type ActionFactory*/
export function identity(extendedState, eventData, settings) {
  return {
    updates: [],
    outputs: NO_OUTPUT
  }
}

export function lastOf(arr) {
  return arr[arr.length - 1];
}

function formatActionName(action, from, event, to, predicate) {
  const predicateName = predicate ? predicate.name : "";
  const formattedPredicate = predicateName ? `[${predicateName}]` : "";
  const actionName = action ? action.name : "identity";
  const formattedAction = actionName ? actionName : "unnamed action";
  return `${formattedAction}:${from}-${event}->${to} ${formattedPredicate}`;
}

export function getFsmStateList(states) {
  const {getLabel} = objectTreeLenses;
  const traverse = {
    strategy: PRE_ORDER,
    seed: {},
    visit: (accStateList, traversalState, tree) => {
      const treeLabel = getLabel(tree);
      const controlState = Object.keys(treeLabel)[0];
      accStateList[controlState] = "";

      return accStateList;
    }
  };
  const stateHashMap = traverseObj(traverse, states);

  return stateHashMap
}

export function getStatesType(statesTree) {
  const {getLabel, isLeafLabel} = objectTreeLenses;

  const traverse = {
    strategy: PRE_ORDER,
    seed: {},
    visit: (acc, traversalState, tree) => {
      const treeLabel = getLabel(tree);
      const controlState = Object.keys(treeLabel)[0];

      // true iff control state is a compound state
      return isLeafLabel(treeLabel)
        ? (acc[controlState] = false, acc)
        : (acc[controlState] = true, acc)
    }
  };

  return traverseObj(traverse, statesTree);
}

export function getStatesPath(statesTree) {
  const {getLabel} = objectTreeLenses;

  const traverse = {
    strategy: PRE_ORDER,
    seed: {},
    visit: (acc, traversalState, tree) => {
      const pathStr = traversalState.get(tree).path.join('.');
      const treeLabel = getLabel(tree);
      const controlState = Object.keys(treeLabel)[0];

      return (acc[controlState] = pathStr, acc)
    }
  };

  return traverseObj(traverse, statesTree);
}

export function getStatesTransitionsMap(transitions) {
  // Map a control state to the transitions which it as origin
  return transitions.reduce((acc, transition) => {
      const {from, event} = transition;
      // NOTE: that should never be, but we need to be defensive here to keep semantics
      if (isHistoryControlState(from)) return acc

      acc[from] = acc[from] || {};
      acc[from][event] = transition;
      return acc
    }, {})
    || {}
}

export function getStateEventTransitionsMaps(transitions) {
  // Map a control state to the transitions which it as origin
  return transitions.reduce((acc, transition) => {
      const {from, event} = transition;
      // NOTE: that should never be, but we need to be defensive here to keep semantics
      if (isHistoryControlState(from)) return acc

      acc[from] = acc[from] || {};
      acc[from][event] = acc[from][event] ? acc[from][event].concat(transition) : [transition];
      return acc
    }, {})
    || {}
}

export function getEventTransitionsMaps(transitions) {
  // Map an event to the origin control states of the transitions it triggers
  return transitions.reduce((acc, transition) => {
      const {from, event} = transition;
      // NOTE: that should never be, but we need to be defensive here to keep semantics
      if (isHistoryControlState(from)) return acc

      acc[event] = acc[event] || {};
      acc[event][from] = acc[event][from] ? acc[event][from].concat(transition) : [transition];
      return acc
    }, {})
    || {}
}

export function getHistoryStatesMap(transitions) {
  return reduceTransitions((map, flatTransition, guardIndex, transitionIndex) => {
      const {from, event, to, action, predicate, gen} = flatTransition;
      if (isHistoryControlState(from)) {
        const underlyingControlState = getHistoryUnderlyingState(from);
        map.set(underlyingControlState, (map.get(underlyingControlState) || []).concat([flatTransition]));
      }
      else if (isHistoryControlState(to)) {
        const underlyingControlState = getHistoryUnderlyingState(to);
        map.set(underlyingControlState, (map.get(underlyingControlState) || []).concat([flatTransition]));
      }

      return map
    }, new Map(), transitions)
    || {};
}

export function getTargetStatesMap(transitions) {
  return reduceTransitions((map, flatTransition, guardIndex, transitionIndex) => {
      const {to} = flatTransition;
      map.set(to, (map.get(to) || []).concat([flatTransition]));
      return map
    }, new Map(), transitions)
    || {};
}

export function getAncestorMap(statesTree) {
  const {getLabel, getChildren} = objectTreeLenses;

  const traverse = {
    strategy: PRE_ORDER,
    seed: {},
    visit: (acc, traversalState, tree) => {
      const treeLabel = getLabel(tree);
      const controlState = Object.keys(treeLabel)[0];
      const children = getChildren(tree)
      const childrenControlStates = children.map(tree => Object.keys(getLabel(tree))[0]);

      childrenControlStates.forEach(state => {
        acc[state] = acc[state] || [];
        acc[state] = acc[state].concat(controlState);
      });

      return acc
    }
  };

  return traverseObj(traverse, statesTree);
}

export function computeHistoryMaps(control_states) {
  if (Object.keys(control_states).length === 0) {
    throw `computeHistoryMaps : passed empty control states parameter?`
  }

  const {getLabel, isLeafLabel} = objectTreeLenses;
  const traverse = {
    strategy: PRE_ORDER,
    seed: {stateList: [], stateAncestors: {}},
    visit: (acc, traversalState, tree) => {
      const treeLabel = getLabel(tree);
      const controlState = Object.keys(treeLabel)[0];
      acc.stateList = acc.stateList.concat(controlState);

      // NOTE : we don't have to worry about path having only one element
      // that case correspond to the root of the tree which is excluded from visiting
      const {path} = traversalState.get(tree);
      traversalState.set(JSON.stringify(path), controlState);
      const parentPath = path.slice(0, -1);
      if (parentPath.length === 1) {
        // That's the root
        traversalState.set(JSON.stringify(parentPath), INIT_STATE);
      }
      else {
        const parentControlState = traversalState.get(JSON.stringify(parentPath));
        acc.stateAncestors[controlState] = [parentControlState];

        const {ancestors} = path.reduce((acc, _) => {
          const parentPath = acc.path.slice(0, -1);
          acc.path = parentPath;
          if (parentPath.length > 1) {
            const parentControlState = traversalState.get(JSON.stringify(parentPath));
            acc.ancestors = acc.ancestors.concat(parentControlState);
          }

          return acc
        }, {ancestors: [], path});
        acc.stateAncestors[controlState] = ancestors;
      }

      return acc
    }
  };
  const {stateList, stateAncestors} = traverseObj(traverse, control_states);

  return {stateList, stateAncestors}
}

export function mapOverTransitionsActions(mapFn, transitions) {
  return reduceTransitions(function (acc, transition, guardIndex, transitionIndex) {
    const {from, event, to, action, predicate} = transition;
    const mappedAction = mapFn(action, transition, guardIndex, transitionIndex);
    mappedAction.displayName = mappedAction.displayName || (action && (action.name || action.displayName || formatActionName(action, from, event, to, predicate)));

    if (typeof(predicate) === 'undefined') {
      acc.push({from, event, to, action: mappedAction})
    }
    else {
      if (guardIndex === 0) {
        acc.push({from, event, guards: [{to, predicate, action: mappedAction}]})
      }
      else {
        acc[acc.length - 1].guards.push({to, predicate, action: mappedAction})
      }
    }

    return acc
  }, [], transitions)
}

export function reduceTransitions(reduceFn, seed, transitions) {
  const result = transitions.reduce((acc, transitionStruct, transitionIndex) => {
    let {from, event, to, gen, action, guards} = transitionStruct;
    // Edge case when no guards are defined
    if (!guards) {
      guards = gen ? [{to, action, gen, predicate: undefined}] : [{to, action, predicate: undefined}]
    }
    return guards.reduce((acc, guard, guardIndex) => {
      const {to, action, gen, predicate} = guard;
      return gen
        ? reduceFn(acc, {from, event, to, action, predicate, gen}, guardIndex, transitionIndex)
        : reduceFn(acc, {from, event, to, action, predicate}, guardIndex, transitionIndex)
    }, acc);
  }, seed);

  return result
}

export function everyTransition(pred, transition) {
  return reduceTransitions((acc, flatTransition) => {
    return acc && pred(flatTransition)
  }, true, [transition])
}

export function computeTimesCircledOn(edgePath, edge) {
  return edgePath.reduce((acc, edgeInEdgePath) => edgeInEdgePath === edge ? acc + 1 : acc, 0);
}

export function isInitState(s) {
  return s === INIT_STATE
}

export function isInitEvent(e) {
  return e === INIT_EVENT
}

export function isEventless(e) {
  return typeof e === 'undefined'
}

/**
 * @description takes an output and turns it into an array
 * @param {*} output
 * @returns {*[]|null} if the output is null: null, if output is an array: output, else: [output]
 */
export function arrayizeOutput(output) {
  return output === NO_OUTPUT
    ? NO_OUTPUT
    : Array.isArray(output)
      ? output
      : [output]
}

export function isHistoryControlState(to) {
  return typeof to === 'object' && (DEEP in to || SHALLOW in to)
}

export function getHistoryParentState(to) {
  return to[SHALLOW] || to[DEEP]
}

export function isShallowHistory(to) {
  return to[SHALLOW]
}

export function isDeepHistory(to) {
  return to[DEEP]
}

export function getHistoryType(history) {
  return history[DEEP] ? DEEP : SHALLOW
}

export function getHistoryUnderlyingState(history) {
  return history[getHistoryType(history)]
}

export function isHistoryStateEdge(edge) {
  return typeof edge.history !== 'undefined'
}

/**
 * Creates a history object from a state list. The created history object represents the history states when no
 * control states have been entered or exited.
 * @param stateList
 * @returns {History}
 */
export function initHistoryDataStructure(stateList) {
  // NOTE : we update history in place, so we need two different objects here, even
  // when they start with the same value
  const initHistory = () => stateList.reduce((acc, state) => (acc[state] = '', acc), {});
  return {[DEEP]: initHistory(), [SHALLOW]: initHistory()};
}

export function isCompoundState(analyzedStates, controlState) {
  const {statesAdjacencyList} = analyzedStates;
  return statesAdjacencyList[controlState] && statesAdjacencyList[controlState].length !== 0
}

export function isAtomicState(analyzedStates, controlState) {
  return !isCompoundState(analyzedStates, controlState)
}

/**
 * Updates the history state (both deep and shallow) after `state_from_name` has been exited. Impacted states are the
 * `stateAncestors` which are the ancestors for the exited state.
 * @param {HistoryState} _history Contains deep history and shallow history for all
 * control states, except the INIT_STATE (not that the concept has no value for atomic state). The function
 * `updateHistory` allows to update the history as transitions occur in the state machine.
 * @param {Object.<DEEP|SHALLOW, Object.<ControlState, Array<ControlState>>>} stateAncestors
 * @returns {HistoryState}
 * @modifies history
 */
export function updateHistory(_history, stateAncestors, state_from_name) {
  // 27.08.2020: Now that I expose history state I have to make sure that it is not mutated!!
  // We have a fixed format here, so we use native `assign` at deepest level
  const history = {
    [DEEP]: Object.assign({}, _history[DEEP]),
    [SHALLOW]: Object.assign({}, _history[SHALLOW]),
  };

  // Edge case, we start with INIT_STATE but that is not kept in the history (no transition to it!!)
  if (state_from_name === INIT_STATE) {
    return history
  }
  else {
      // ancestors for the state which is exited
      const ancestors = stateAncestors[state_from_name] || [];
      ancestors.reduce((oldAncestor, newAncestor) => {
        // set the exited state in the history of all ancestors
        history[DEEP][newAncestor] = state_from_name;
        history[SHALLOW][newAncestor] = oldAncestor;

        return newAncestor
      }, state_from_name);

    return history
  }
}

/**
 * for all parentState, computes history(parentState), understood as the last control state descending from the
 * parent state. Last can be understood two ways : DEEP and SHALLOW. Deep history state refer to the last atomic
 * control state which is a children of the parent state and was exited. Shallow history states refer to the last
 * control state which is a direct child of the parent state and was exited.
 * @param {FSM_States} states
 * @param {Array<ControlState>} controlStateSequence Sequence of control states which has been entered and exited,
 * and from which the history must be injected
 * @param {DEEP | SHALLOW} historyType
 * @param {ControlState} historyParentState
 * @returns {Object.<DEEP|SHALLOW, Object.<ControlState, ControlState>>}
 */
export function computeHistoryState(states, controlStateSequence, historyType, historyParentState) {
  // NOTE : we compute the whole story every time. This is inefficient, but for now sufficient
  const {stateList, stateAncestors} = computeHistoryMaps(states);
  let history = initHistoryDataStructure(stateList);
  history = controlStateSequence.reduce(
    (history, controlState) => updateHistory(history, stateAncestors, controlState),
    history
  );

  return history[historyType][historyParentState]
}

export function findInitTransition(transitions) {
  return transitions.find(transition => {
    return transition.from === INIT_STATE && transition.event === INIT_EVENT
  })
}

export function tryCatch(fn, errCb) {
  return function tryCatch(...args) {
    try {
      return fn.apply(fn, args);
    }
    catch (e) {
      return errCb(e, args);
    }
  };
}

export function tryCatchMachineFn(fnType, fn, argsDesc = []) {
  return tryCatch(fn, (e, args) => {
    const err = new Error(e);
    const fnName = getFunctionName(fn);
    // NOTE : we concatenate causes but not `info`
    const probableCause = FUNCTION_THREW_ERROR(fnName, fnType);
    err.probableCause = e.probableCause ? [e.probableCause, probableCause].join('\n') : probableCause;

    const info = {
      fnName,
      params: argsDesc.reduce((acc, argDesc, index) => {
        return acc[argDesc] = args[index], acc
      }, {})
    };
    err.info = e.info ? [].concat([e.info]).concat([info]) : info;

    return err
  })
}

export function getFunctionName(actionFactory) {
  return actionFactory.name || actionFactory.displayName || 'anonymous'
}

/**
 *
 * @param {function(...*): True | Error} contract Contract that either fulfills or returns an error
 * @param {Array<*>} arrayParams Parameters to be passed to the contract
 * @returns {undefined|{when, location, info, message}|Object} either true (fulfilled contract)
 * or an object with optional properties for diagnostic and tracing purposes
 * about the cause of the error if the contract is not fulfilled
 */
export function assert(contract, arrayParams) {
  const contractName = contract.name || "";
  const isFulfilledOrError = contract.apply(null, arrayParams);
  if (isFulfilledOrError === true) return void 0
  else {
    return {
      ...isFulfilledOrError,
      when: `Checking contract`,
      message: [isFulfilledOrError.message, `failed contract ${contractName}`].join("\n"),
      info: isFulfilledOrError.info,
    }
  }
}

export function notifyThrows(console, error) {
  console.error(error);
  error.probableCause && console.error(`Probable cause: ${error.probableCause}`);
  error.info && console.error(`ERROR: additional info`, error.info);
}

/**
 * false iff no errors or invalid actions
 * if not throws an exception
 * @param {{debug, console}} notify
 * @param {*} execInfo Information about the call - should include the function, and the parameters for the function
 * call
 * @param {Actions | Error} actionResultOrError
 * @param {function} throwFn handles when the action factory throws during its execution
 * @param {function} invalidResultFn handles when the action factory returns invalid actions
 * @returns {boolean}
 * @param postCondition
 */
export function handleFnExecError(notify, execInfo, actionResultOrError, postCondition, throwFn, invalidResultFn) {
  const {debug, console} = notify;

  if (debug && actionResultOrError instanceof Error) {
    throwFn({debug, console}, actionResultOrError, execInfo)
    return true
  }
  else if (debug && !postCondition(actionResultOrError)) {
    invalidResultFn({debug, console}, actionResultOrError, execInfo)
    return true
  }
  else return false
}

export function notifyAndRethrow({debug, console}, actionResultOrError) {
  notifyThrows(console, actionResultOrError)
  throw actionResultOrError
}

export function throwIfInvalidActionResult({debug, console}, actionResultOrError, exec) {
  const {action, extendedState, eventData, settings} = exec;
  const actionName = getFunctionName(action);
  const error = new Error(INVALID_ACTION_FACTORY_EXECUTED(actionName, ACTION_FACTORY_DESC));
  error.info = {
    fnName: getFunctionName(action),
    params: {updatedExtendedState: extendedState, eventData, settings},
    returned: actionResultOrError
  };
  notifyThrows(console, error)
  throw error
}

export function throwIfInvalidGuardResult({debug, console}, resultOrError, exec) {
  const predName = getFunctionName(exec.predicate);
  const error = new Error(INVALID_PREDICATE_EXECUTED(predName, PREDICATE_DESC));
  error.info = {
    predicateName: predName,
    params: exec,
    returned: resultOrError
  };
  notifyThrows(console, error)
  throw error
}

export function throwIfInvalidEntryActionResult({debug, console}, exitActionResultOrError, exec) {
  const {action, extendedState, eventData, settings} = exec;
  const actionName = getFunctionName(action);
  const error = new Error(INVALID_ACTION_FACTORY_EXECUTED(actionName, ENTRY_ACTION_FACTORY_DESC));
  error.info = {
    fnName: getFunctionName(action),
    params: {updatedExtendedState: extendedState, eventData, settings},
    returned: exitActionResultOrError
  };
  notifyThrows(console, error)
  throw error
}

export function isActions(obj) {
  return obj && `updates` in obj && `outputs` in obj
    && Array.isArray(obj.outputs)
  // && Array.isArray(obj.updates)
  // !! does not have to be arrays. HAs to be anything that is accepted by updateState
}

/**
 * That is a Either contract, not a Boolean contract!
 * @param obj
 * @returns {boolean|Error}
 */
export function isEventStruct(obj) {
  let trueOrError;
  if (!obj || typeof obj !== 'object') {
    trueOrError = new Error(WRONG_EVENT_FORMAT_ERROR);
    trueOrError.info = {event: obj, cause: `not an object!`}
  }
  else if (Object.keys(obj).length > 1) {
    trueOrError = new Error(WRONG_EVENT_FORMAT_ERROR);
    trueOrError.info = {event: obj, cause: `Event objects must have only one key which is the event name!`}
  }
  else trueOrError = true;

  return trueOrError
}

export function isError(obj) {
  return obj instanceof Error
}

export function destructureEvent(obj) {
  const eventName = Object.keys(obj)[0];
  const eventData = obj[eventName];

  return {eventName, eventData}
}

export function formatUndefinedInJSON(obj){
  return JSON.stringify(obj, (key,value)=> {if (value === undefined) return "undefined"; else return value})
}

export function getCurrentControlState(hash_states) {
  return hash_states[INIT_STATE].current_state_name
}

export function wrapUpdateStateFn(userProvidedUpdateStateFn, {throwKinglyError, tracer}){
  return (extendedState, updates) => {
    const fnName = userProvidedUpdateStateFn.name || "";

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
}

export function throwKinglyErrorFactory (console,tracer)  {
  return obj => {
  throw new KinglyError(obj, console, tracer)
  }
};

export class KinglyError extends Error {
  constructor(m, console, tracer) {
    super(m && m.message || "");
    this.name = `KinglyError`;
    this.stack = m && m.stack || this.stack;
    this.errors = m;
    const { when, location, info, message } = m || {};
    const fm = `At ${location}: ${when} => ${message}`;
    const infoMsg = info ? `See extra info in console` : "";
    const fullMsg = [fm, infoMsg].join("\n");
    // this.message = fullMsg;
    console && console.error(fullMsg);
    info && console && console.info(info);
  }
}
