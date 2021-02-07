/**
 * The idea here is to test for the extra flexibility we added to start a machine.
 * A Kingly machine can start in a user-provided control state, or have an initial
 * transition (defined as a transition from the initial state INIT_STATE).
 * The initial transition is already tested in other test files. We focus here on
 * the scenario in which the user provides an initial control state.
 */
import * as QUnit from "qunitjs"
import {clone, F, merge, T} from "ramda"
import {
  ACTION_IDENTITY, arrayizeOutput,
  createStateMachine, INIT_EVENT, INIT_STATE, KinglyError
} from "../src"
import {applyPatch} from "json-patch-es6"
import {assertContract, isArrayUpdateOperations} from "../test/helpers"
import {CONTRACT_MODEL_UPDATE_FN_RETURN_VALUE} from "../src/properties"
import {fsmContracts} from "../src/contracts"
import {tracer} from "../devtool";

function spy_on_args(fn, spy_fn) {
  return function spied_on(...args) {
    spy_fn(...args);

    return fn(...args);
  }
}

/**
 *
 * @param {ExtendedState} extendedState
 * @param {Operation[]} extendedStateUpdateOperations
 * @returns {ExtendedState}
 */
export function applyJSONpatch(extendedState, extendedStateUpdateOperations) {
  assertContract(isArrayUpdateOperations, [extendedStateUpdateOperations],
    `applyUpdateOperations : ${CONTRACT_MODEL_UPDATE_FN_RETURN_VALUE}`);

  // NOTE : we don't validate operations, to avoid throwing errors when for instance the value property for an
  // `add` JSON operation is `undefined` ; and of course we don't mutate the document in place
  return applyPatch(extendedState, extendedStateUpdateOperations, false, false).newDocument;
}

const default_settings = {};
const FALSE_GUARD = function always_false(action, state) {
  return [{predicate: F, to: state, action}]
};
const TRUE_GUARD = function always_true(to, action) {
  return [{predicate: T, to, action}]
};

const EVENT1 = 'event1';
const EVENT1_DATA = {
  event1_data_key1: 'event1_data_value1'
}
const a_value = "some value";
const another_value = "another value";
const an_output = {
  outputKey1: 'outputValue1'
};
const another_output = {
  anotherOutputKey1: 'anotherOutputValue1'
};
const initialExtendedState = {
  a_key: a_value,
  another_key: another_value
};
const dummy_action_result = {
  updates: [],
  outputs: [an_output]
};
const another_dummy_action_result = {
  updates: [],
  outputs: [another_output]
};
const update_model_ops_2 = [
  {op: "add", path: '/new_model_key_2', value: 'new_model_value_2'},
];
const another_dummy_action_result_with_update = {
  updates: update_model_ops_2,
  outputs: [another_output]
};

function dummy_action(extendedState, event_data, settings) {
  return dummy_action_result
}

function another_dummy_action(extendedState, event_data, settings) {
  return another_dummy_action_result
}

function another_dummy_action_with_update(extendedState, event_data, settings) {
  return merge(another_dummy_action_result_with_update, {
      outputs: [{
        // NOTE : ! this is the extendedState before update!!
        extendedState: clone(extendedState),
        event_data: clone(event_data),
        settings: JSON.parse(JSON.stringify(settings))
      }]
    }
  )
}

const debug_settings = Object.assign({}, default_settings, {debug: {checkContracts: fsmContracts, console}, devTool: {tracer}});

QUnit.module("Testing createStateMachine(fsmDef, settings) with initial control state", {});

QUnit.test("initial control state, event, no action, false guard", function exec_test(assert) {
  const fsmDef = {
    states: {A: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {from: 'A', event: 'ev', guards: FALSE_GUARD(ACTION_IDENTITY, 'A')}
    ],
    initialExtendedState: initialExtendedState,
    initialControlState: 'A',
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, debug_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, [null], `event starts the state machine`);
});

QUnit.test("initial control state, event, no action, true guard", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {from: 'A', to: 'B', event: INIT_EVENT, guards: TRUE_GUARD('A', ACTION_IDENTITY)}
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, null, `INIT event starts the state machine`);
});

QUnit.test("no initial control state, no initial transition, event, no action, true guard", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      { from: 'A', to: 'B', event: INIT_EVENT, guards: TRUE_GUARD('A', ACTION_IDENTITY) }
    ],
    // initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, {debug: {console, checkContracts: fsmContracts}});
  assert.ok(fsm instanceof KinglyError, `Throws if no configuration for starting the machine `);
});

QUnit.test("no initial control state, no initial transition, event, no action, true guard", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'B', event: INIT_EVENT, guards: TRUE_GUARD('A', ACTION_IDENTITY)}
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, debug_settings);
  assert.ok(fsm instanceof KinglyError, `Throws if invalid configuration for starting the machine `);
});

QUnit.test("initial control state, event, action, false guard", function exec_test(assert) {
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `Guard is false, this action should not be called!`)
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {from: 'A', event: INIT_EVENT, guards: FALSE_GUARD(fail_if_called, 'B')}
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, null, `event starts the state machine`);
});

QUnit.test("initial control state, event, action, true guard", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {from: 'A', event: 'ev', guards: TRUE_GUARD('B', spied_on_dummy_action),}
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("initial control state, event, 2 actions, [T,T] conditions, 1st action executed", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `This true guard comes second, this action should not be called!`)
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {
        from: 'A', event: 'ev', guards: [
          {predicate: T, to: 'B', action: spied_on_dummy_action},
          {predicate: T, to: 'B', action: fail_if_called}
        ]
      }
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("initial control state, event, 2 actions, [F,T] conditions, 2nd action executed", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `This true guard comes second, this action should not be called!`)
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {
        from: 'A', event: 'ev', guards: [
          {predicate: F, to: 'B', action: fail_if_called},
          {predicate: T, to: 'B', action: spied_on_dummy_action}
        ]
      }
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("initial control state, event, 2 actions, [T,F] conditions, 1st action executed", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `This true guard comes second, this action should not be called!`)
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {
        from: 'A', event: 'ev', guards: [
          {predicate: F, to: 'B', action: spied_on_dummy_action},
          {predicate: T, to: 'B', action: fail_if_called}
        ]
      }
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("initial control state, event, 2 actions, [F,F] conditions, no action executed", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `This true guard comes second, this action should not be called!`)
    });
  const fsmDef = {
    states: {A: '', B: ''},
    events: ['ev'],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action : ACTION_IDENTITY},
      {
        from: 'A', event: 'ev', guards: [
          {predicate: F, to: 'A', action: fail_if_called},
          {predicate: F, to: 'A', action: fail_if_called}
        ]
      }
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result = fsm({ev: initialExtendedState});
  assert.deepEqual(result, [null],
    `event starts the state machine, all guards failing, no transition is taken, no action is executed`);
});

QUnit.test("initial control state, event, 2 actions with no extendedState update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [EVENT1],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action },
      {from: 'A', to: 'B', event: EVENT1, action: another_dummy_action},
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result2 = fsm({[EVENT1]: EVENT1_DATA});
  assert.deepEqual([result2], [arrayizeOutput(another_output)], `event triggers correct transition`);
});

QUnit.test("initial control state, event, 2 actions with extendedState update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [EVENT1],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update },
      {from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update},
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result2 = fsm({[EVENT1]: EVENT1_DATA});
  const cloned_model_initial = clone(initialExtendedState);
  assert.deepEqual([result2], [
    [
      {
        "event_data": EVENT1_DATA,
        "extendedState": initialExtendedState,
        "settings": {}
      }
    ]
  ], `event triggers correct transition`);
});

QUnit.test("initial control state, 2 INIT event", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [EVENT1],
    transitions: [
      // { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update },
      {from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update},
    ],
    initialControlState: 'A',
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, default_settings);
  const result2 = fsm({[INIT_EVENT]: EVENT1_DATA});
  assert.deepEqual([result2], [

    null
  ], `event triggers correct transition`);
});
