import * as QUnit from "qunitjs"
import {clone, F, merge, T} from "ramda"
import {
  ACTION_IDENTITY,
  createPureStateMachine, INIT_EVENT, INIT_STATE, NO_OUTPUT
} from "../src"
import {arrayizeOutput} from "../src/helpers"
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
const debug_settings = Object.assign({}, default_settings, {
    debug: {
      checkContracts: fsmContracts,
      console
    },
  devTool: {tracer}
  }
);

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
const replaced_model_property = {
  new_model_key: 'new_model_value'
}
const update_model_ops_1 = [
  {op: "add", path: '/new_model_key_1', value: 'new_model_value_1'},
  {op: "replace", path: '/a_key', value: replaced_model_property},
  {op: "remove", path: '/another_key'},
];
const update_model_ops_2 = [
  {op: "add", path: '/new_model_key_2', value: 'new_model_value_2'},
];
const dummy_action_result_with_update = {
  updates: update_model_ops_1,
  outputs: [an_output]
};
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

function dummy_action_with_update(extendedState, event_data, settings) {
  return merge(dummy_action_result_with_update, {
    outputs: [{
      // NOTE : ! this is the extendedState before update!!
      extendedState: clone(extendedState),
      event_data: clone(event_data),
      settings: JSON.parse(JSON.stringify(settings))
    }]
  })
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

QUnit.module("Testing createPureStateMachine(fsmDef, settings)", {});

QUnit.test("initial (no prev state) - event, no action, false guard", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      { from: 'A', to: 'B', event: 'ev', guards: FALSE_GUARD(ACTION_IDENTITY, 'A') }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState } = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, [null], `pure machine computes first input correctly - event starts the state machine`);
  assert.deepEqual(fsmState, {
    "cs": "A",
    "es": {
      "a_key": "some value",
      "another_key": "another value"
    },
    "hs": {
      "deep": {
        "A": "",
        "B": ""
      },
      "shallow": {
        "A": "",
        "B": ""
      }
    }
  }, `pure machine computes first input correctly - event starts the state machine`);
});

QUnit.test("event, no action, true guard", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      { from: 'A', to: 'B', event: INIT_EVENT, guards: TRUE_GUARD('A', ACTION_IDENTITY) }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef);
  const {outputs, fsmState } = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, null, `INIT event starts the state machine`);
  assert.deepEqual(fsmState, {
    "cs": "A",
    "es": initialExtendedState,
    "hs": {
      "deep": {
        "A": "",
        "B": ""
      },
      "shallow": {
        "A": "",
        "B": ""
      }
    }
  }, `INIT event starts the state machine`);
});

QUnit.test("event, action, false guard", function exec_test(assert) {
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `Guard is false, this action should not be called!`)
    });
  const fsmDef = {
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      { from: 'A', to: 'B', event: INIT_EVENT, conditions: FALSE_GUARD(fail_if_called) }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef);
  const {outputs, fsmState } = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, null, `event starts the state machine`);
  assert.deepEqual(fsmState, {
    "cs": "A",
    "es": initialExtendedState,
    "hs": {
      "deep": {
        "A": "",
        "B": ""
      },
      "shallow": {
        "A": "",
        "B": ""
      }
    }
  }, `event starts the state machine`);
});

QUnit.test("event, action, true guard", function exec_test(assert) {
  const spied_on_dummy_action = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.deepEqual(extendedState, initialExtendedState, `action called with extendedState as first parameter`);
      assert.deepEqual(event_data, initialExtendedState, `action called with event_data as second parameter`);
      // assert.deepEqual(settings, default_settings, `action called with settings as third parameter`);
    });
  const fsmDef = {
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      { from: 'A', event: 'ev', guards: TRUE_GUARD('B', spied_on_dummy_action), }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, debug_settings);
  const {outputs, fsmState} = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
  assert.deepEqual(fsmState, {
    "cs": "B",
    "es": initialExtendedState,
    "hs": {
      "deep": {
        "A": "",
        "B": ""
      },
      "shallow": {
        "A": "",
        "B": ""
      }
    }
  }, `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("event, 2 actions, [T,T] conditions, 1st action executed", function exec_test(assert) {
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
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      {
        from: 'A', event: 'ev', guards: [
          { predicate: T, to: 'B', action: spied_on_dummy_action },
          { predicate: T, to: 'B', action: fail_if_called }
        ]
      }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState} = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("event, 2 actions, [F,T] conditions, 2nd action executed", function exec_test(assert) {
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
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      {
        from: 'A', event: 'ev', guards: [
          { predicate: F, to: 'B', action: fail_if_called },
          { predicate: T, to: 'B', action: spied_on_dummy_action }
        ]
      }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState} = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("event, 2 actions, [T,F] conditions, 1st action executed", function exec_test(assert) {
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
    states: { A: '', B: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      {
        from: 'A', event: 'ev', guards: [
          { predicate: F, to: 'B', action: spied_on_dummy_action },
          { predicate: T, to: 'B', action: fail_if_called }
        ]
      }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState} = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, arrayizeOutput(dummy_action_result.outputs),
    `event starts the state machine, transition is taken, action is executed`);
  assert.deepEqual(fsmState, {
      "cs": "B",
      "es": initialExtendedState,
      "hs": {
        "deep": {
          "A": "",
          "B": ""
        },
        "shallow": {
          "A": "",
          "B": ""
        }
      }
    },
    `event starts the state machine, transition is taken, action is executed`);
});

QUnit.test("event, 2 actions, [F,F] conditions, no action executed", function exec_test(assert) {
  const fail_if_called = spy_on_args(dummy_action,
    (extendedState, event_data, settings) => {
      assert.ok(true, false, `This true guard comes second, this action should not be called!`)
    });
  const fsmDef = {
    states: { A: '' },
    events: ['ev'],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY },
      {
        from: 'A', event: 'ev', guards: [
          { predicate: F, to: 'A', action: fail_if_called },
          { predicate: F, to: 'A', action: fail_if_called }
        ]
      }
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, debug_settings);
  const {outputs, fsmState} = fsm({ ev: initialExtendedState });
  assert.deepEqual(outputs, [null],
    `event starts the state machine, all guards failing, no transition is taken, no action is executed`);
  assert.deepEqual(fsmState, {
      "cs": "A",
      "es": {
        "a_key": "some value",
        "another_key": "another value"
      },
      "hs": {
        "deep": {
          "A": ""
        },
        "shallow": {
          "A": ""
        }
      }
    },
    `event starts the state machine, all guards failing, no transition is taken, no action is executed`);
});

QUnit.test("event, 2 actions with no extendedState update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [EVENT1],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action },
      { from: 'A', to: 'B', event: EVENT1, action: another_dummy_action },
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState} = fsm({ [EVENT1]: EVENT1_DATA });
  assert.deepEqual(outputs, arrayizeOutput(another_output), `event triggers correct transition`);
  assert.deepEqual(fsmState, {
    "cs": "B",
    "es": initialExtendedState,
    "hs": {
      "deep": {
        "A": "",
        "B": ""
      },
      "shallow": {
        "A": "",
        "B": ""
      }
    }
  }, `event triggers correct transition`);
});

QUnit.test("event, 2 actions with extendedState update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [EVENT1],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update },
      { from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update },
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, default_settings);
  const {outputs, fsmState} = fsm({ [EVENT1]: EVENT1_DATA });
  const cloned_model_initial = clone(initialExtendedState);
  assert.deepEqual([outputs], [
    [
      {
        "event_data": {
          "event1_data_key1": "event1_data_value1"
        },
        "extendedState": {
          "a_key": {
            "new_model_key": "new_model_value"
          },
          "new_model_key_1": "new_model_value_1"
        },
        "settings": {}
      }
    ]
  ], `event triggers correct transition`);
});

QUnit.test("2 INIT event", function exec_test(assert) {
  const fsmDef = {
    states: {A: '', B: ''},
    events: [EVENT1],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update},
      {from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update},
    ],
    initialExtendedState: initialExtendedState,
    updateState: applyJSONpatch,
  };
  const fsm = createPureStateMachine(fsmDef, debug_settings);
  const result2 = fsm({[INIT_EVENT]: EVENT1_DATA});
  assert.deepEqual([result2], [
    {
      "fsmState": {
        "cs": "A",
        "es": {
          "a_key": {
            "new_model_key": "new_model_value"
          },
          "new_model_key_1": "new_model_value_1"
        },
        "hs": {
          "deep": {
            "A": "",
            "B": ""
          },
          "shallow": {
            "A": "",
            "B": ""
          }
        }
      },
      "outputs": null
    }
  ], `event triggers correct transition`);
});
