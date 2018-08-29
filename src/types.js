/**
 * @typedef {Object} FSM_Def
 * @property {Object.<ControlState, *>} states Object whose every key is a control state admitted by the
 * specified state machine. The value associated to that key is unused in the present version of the library. The
 * hierarchy of the states correspond to property nesting in the `states` object
 * @property {Array<EventLabel>} events A list of event monikers the machine is configured to react to
 * @property {Array<Transition>} transitions An array of transitions the machine is allowed to take
 * @property {*} initial_extended_state The initial value for the machine's extended state
 */
/**
 * @typedef {InconditionalTransition | ConditionalTransition} Transition
 */
/**
 * @typedef {{from: ControlState, to: ControlState, event: EventLabel, action: ActionFactory}} InconditionalTransition
 *   Inconditional_Transition encodes transition with no guards attached. Every time the specified event occurs, and
 *   the machine is in the specified state, it will transition to the target control state, and invoke the action
 *   returned by the action factory
 */
/**
 * @typedef {{from: ControlState, event: EventLabel, guards: Array<Condition>}} ConditionalTransition Transition for the
 * specified state is contingent to some guards being passed. Those guards are defined as an array.
 */
/**
 * @typedef {{predicate: FSM_Predicate, to: ControlState, action: ActionFactory}} Condition On satisfying the
 * specified predicate, the received event data will trigger the transition to the specified target control state
 * and invoke the action created by the specified action factory, leading to an update of the internal state of the
 * extended state machine and possibly an output to the state machine client.
 */
/**
 * @typedef {function(model: ExtendedState, event_data: *, settings: FSM_Settings) : Actions} ActionFactory
 */
/**
 * @typedef {{model_update: *, outputs: Array<MachineOutput> | NO_OUTPUT}} Actions The actions
 * to be performed by the state machine in response to a transition. `model_update` represents the state update for
 * the variables of the extended state machine. `output` represents the output of the state machine passed to the
 * API caller.
 */
/** @typedef {function (ExtendedState, EventData) : Boolean} FSM_Predicate */
/** @typedef {{updateModel :: Function(ExtendedState, *) : ExtendedState, ...}} FSM_Settings */
/** @typedef {{merge: MergeObsFn, from: FromObsFn, filter: FilterObsFn, map: MapObsFn, share:ShareObsFn, ...}} FSM$_Settings */
/** @typedef {*} MachineOutput well it is preferrable that that be an object instead of a primitive */
/** @typedef {String} EventLabel */
/** @typedef {String} ControlState Name of the control state */
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
 * @typedef {*} EventData
 */
/**
 * @typedef {*} ExtendedState extended state for a given state machine
 */
/**
 * @typedef {Object} FsmTraceData
 * @property {ControlState} controlState
 * @property {{EventLabel, EventData}} eventLabel
 * @property {ControlState} targetControlState
 * @property {FSM_Predicate} predicate
 * @property {*} model_update
 * @property {ExtendedState} extendedState
 * @property {ActionFactory} actionFactory
 * @property {Number} guardIndex
 * @property {Number} transitionIndex
 */


