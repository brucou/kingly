//@ts-check
/**
 * @typedef {Boolean} True the `true` boolean value
 */
/**
 * @typedef  {Array<MachineOutput> | null} FSM_Outputs
 */
/**
 * @typedef  {Object} FSM_Internal_State
 * @property {String} cs control state
 * @property {HistoryState} hs history state
 * @property {ExtendedState} es extended state
 */
/**
 * @callback Stateful_FSM
 * @param {*} input
 * @returns {FSM_Outputs|Error}
 */
/**
 * @callback Pure_FSM
 * @param {*} input
 * @param {FSM_Internal_State} fsm_state
 * @returns {{outputs: FSM_Outputs|Error, fsmState: FSM_Internal_State}}
 */
/**
 * @typedef {Object} FSM_Def
 * @property {FSM_States} states Object whose every key is a control state admitted by the
 * specified state machine. The value associated to that key is unused in the present version of the library. The
 * hierarchy of the states correspond to property nesting in the `states` object
 * @property {Array<EventLabel>} events A list of event monikers the machine is configured to react to
 * @property {Array<Transition>} transitions An array of transitions the machine is allowed to take
 * @property {*} initialExtendedState The initial value for the machine's extended state
 * @property {function(ExtendedState, ExtendedStateUpdate) : ExtendedState} updateState function
 * which update the extended state of the state machine
 */
/**
 * @typedef {Object.<ControlState, *>} FSM_States
 */
/**
 * @typedef {InconditionalTransition | ConditionalTransition} Transition
 */
/**
 * @typedef {{from: ControlState, to: ControlState|HistoryState, event?: EventLabel, action: ActionFactory}} InconditionalTransition
 *   Inconditional_Transition encodes transition with no guards attached. Every time the specified event occurs, and
 *   the machine is in the specified state, it will transition to the target control state, and invoke the action
 *   returned by the action factory
 */
/**
 * @typedef {{from: ControlState, event?: EventLabel, guards: Array<Condition>}} ConditionalTransition Transition for the
 * specified state is contingent to some guards being passed. Those guards are defined as an array.
 */
/**
 * @typedef {{predicate: FSM_Predicate, to: ControlState|HistoryState, action: ActionFactory}} Condition On satisfying the
 * specified predicate, the received event data will trigger the transition to the specified target control state
 * and invoke the action created by the specified action factory, leading to an update of the internal state of the
 * extended state machine and possibly an output to the state machine client.
 */
/**
 * @typedef {function(ExtendedState, EventData, FSM_Settings) : Actions} ActionFactory
 */
/**
 * @typedef {{updates: ExtendedStateUpdate, outputs: Array<MachineOutput>}} Actions The actions
 * to be performed by the state machine in response to a transition. `updates` represents the state update for
 * the variables of the extended state machine. `output` represents the output of the state machine passed to the
 * API caller.
 */
/** @typedef {function (ExtendedState, EventData) : Boolean} FSM_Predicate */
/**
 * @typedef {Object} Debug_Settings
 * @property {*} checkContracts opaque type. Just use the fsmContracts that is exported by Kingly.
 * @property {Console} console object with the same properties as console in a browser environment.
 * Can be used to fake or stub the console for logging purposes or outside browser environments.
 *
 * */
/** @typedef {Object} DevTool_Settings
 * @property {*} tracer opaque type. Just use the tracer provided by the Courtesan extension.
 * */
/** @typedef {Object|{}} FSM_Settings
 * @property {Debug_Settings} [debug]
 * @property {DevTool_Settings} [devTool]
 * @property {String} [displayName]
 * Miscellaneous settings including how to update the machine's state and debug
 * configuration
 * */
/** @typedef {{merge: MergeObsFn, from: FromObsFn, filter: FilterObsFn, map: MapObsFn, share:ShareObsFn, ...}} FSM$_Settings */
/**
 * @typedef {function (Array<Observable>) : Observable} MergeObsFn Similar to Rxjs v4's `Rx.Observable.merge`. Takes
 * an array of observables and return an observable which passes on all outputs emitted by the observables in the array.
 */
/**
 * @typedef {function (value) : Observable} FromObsFn Similar to Rxjs v4's `Rx.Observable.from`. Takes
 * a value and lift it into an observable which completes immediately after emitting that value.
 */
/**
 * @typedef {function (value) : Observable} FilterObsFn Similar to Rxjs v4's `Rx.Observable.filter`. Takes
 * a value and lift it into an observable which completes immediately after emitting that value.
 */
/**
 * @typedef {function (value) : Observable} MapObsFn Similar to Rxjs v4's `Rx.Observable.map`. Takes
 * a value and lift it into an observable which completes immediately after emitting that value.
 */
/**
 * @typedef {function (value) : Observable} ShareObsFn Similar to Rxjs v4's `Rx.Observable.share`. Takes
 * a value and lift it into an observable which completes immediately after emitting that value.
 */
/**
 * @typedef {Object.<EventLabel, EventData>} LabelledEvent extended state for a given state machine
 */
/**
 * @typedef {Object} FsmTraceData
 * @property {ControlState} controlState
 * @property {{EventLabel, EventData}} eventLabel
 * @property {ControlState} targetControlState
 * @property {FSM_Predicate} predicate
 * @property {ExtendedStateUpdate} updates
 * @property {ExtendedState} extendedState
 * @property {ActionFactory} actionFactory
 * @property {Number} guardIndex
 * @property {Number} transitionIndex
 */
/**
 * @typedef {function(historyType: HistoryType, controlState: ControlState): HistoryState} HistoryStateFactory
 */
/**
 * @typedef {Object.<HistoryType, HistoryDict>} HistoryState history object containing deeep and shallow history states
 * for all relevant control states
 */
/**
 * @typedef {Object.<ControlState, ControlState>} HistoryDict Maps a compound control state to its history state
 */
/**
 * @typedef {DEEP | SHALLOW} HistoryType
 */
/** @typedef {String} ControlState Name of the control state */
/** @typedef {String} EventLabel */
/**
 * @typedef {*} EventData
 */
/**
 * @typedef {*} ExtendedState extended state for a given state machine
 */
/**
 * @typedef {*} ExtendedStateUpdate
 */
/** @typedef {* | NO_OUTPUT} MachineOutput well it is preferrable that that be an object instead of a primitive */


// Contract types
/**
 * @typedef {Object} ContractsDef
 * @property {String} description name for the series of contracts
 * @property {function(FSM_Def):Object} injected a function of the machine definition which returns an object to be
 * injected to the contracts predicates
 * @property {Array<ContractDef>} contracts array of contract definitions
 */
/**
 * @typedef {Object} ContractDef
 * @property {String} name name for the contract
 * @property {Boolean} shouldThrow whether the contract should thrown an exception or alternatively return one
 * @property {function(FSM_Def, injected):ContractCheck} predicate array of contract definitions
 */
/**
 * @typedef {Object} ContractCheck
 * @property {Boolean} isFulfilled whether the contract is fulfilled
 * @property {{message:String, info:*}} blame information about the cause for the contract failure. The
 * `message` property is destined to the developer (for instnce can be printed in the console). Info aims
 * at providing additional data helping to track the error cause
 * @property {function(FSM_Def, injected):ContractCheck} predicate array of contract definitions
 */

// Component types
/**
 * @typedef {String} CommandName
 */
/**
 * @typedef {function(SubjectEmitter, CommandParams, EffectHandlers, Element, Subject): ()} CommandHandler
 * A command handler performs effect, possibly relying on effects implementation included in the effect handlers
 * parameter. A command handler also receives parameters for its execution and two subjects, one for receiving
 * events, another one for emitting them. Lastly, a command handler may receive an Element which is generally used
 * for rendering purposes
 */
/**
 * @typedef {function(): Subject} SubjectFactory
 */

/**
 * @typedef {*} Operation
 */
