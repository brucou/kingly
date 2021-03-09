import * as QUnit from "qunitjs"
import { clone, F, merge, T } from "ramda"
import {
  ACTION_IDENTITY, computeHistoryMaps, INIT_EVENT, INIT_STATE
} from "../src"
import { formatResult, } from "./helpers"
import { mapOverTransitionsActions, reduceTransitions} from "../src/helpers"

const a_value = "some value";
const another_value = "another value";
const an_output = {
  outputKey1: 'outputValue1'
};
const another_output = {
  anotherOutputKey1: 'anotherOutputValue1'
};
const model_initial = {
  a_key: a_value,
  another_key: another_value
};
const replaced_model_property = {
  new_model_key: 'new_model_value'
}
const update_model_ops_1 = [
  { op: "add", path: '/new_model_key_1', value: 'new_model_value_1' },
  { op: "replace", path: '/a_key', value: replaced_model_property },
  { op: "remove", path: '/another_key' },
];
const update_model_ops_2 = [
  { op: "add", path: '/new_model_key_2', value: 'new_model_value_2' },
];
const dummy_action_result_with_update = {
  updates: update_model_ops_1,
  outputs: an_output
};
const another_dummy_action_result_with_update = {
  updates: update_model_ops_2,
  outputs: another_output
};
const EVENT1 = 'event1';

function dummy_action_with_update(model, event_data, settings) {
  return merge(dummy_action_result_with_update, {
    outputs: {
      // NOTE : ! this is the model before update!!
      model: clone(model),
      event_data: clone(event_data),
      settings: JSON.parse(JSON.stringify(settings))
    }
  })
}

function another_dummy_action_with_update(model, event_data, settings) {
  return merge(another_dummy_action_result_with_update, {
      outputs: {
        // NOTE : ! this is the model before update!!
        model: clone(model),
        event_data: clone(event_data),
        settings: JSON.parse(JSON.stringify(settings))
      }
    }
  )
}

const reduceFn = (acc, transitionStruct, guardIndex, transitionIndex) => {
  return acc.concat({ transitionStruct, guardIndex, transitionIndex })
};
const mapFn = (action, transition, guardIndex, transitionIndex) => {
  return function () {}
};

QUnit.module("Testing reduceTransitions(reduceFn, seed, transitions)", {});

QUnit.test("INIT event, no action, no guard", function exec_test(assert) {
  const fsmDef = {
    states: { A: '' },
    events: [],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY }
    ],
    initialExtendedState: model_initial
  };
  const result = reduceTransitions(reduceFn, [], fsmDef.transitions).map(formatResult);
  assert.deepEqual(result, [
    {
      "guardIndex": 0,
      "transitionIndex": 0,
      "transitionStruct": {
        "action": "ACTION_IDENTITY",
        "event": "init",
        "from": "nok",
        "predicate": undefined,
        "to": "A"
      }
    }
  ], `reduce transition when no guards are specified`);
});

QUnit.test("INIT event, 2 actions, [F,T] conditions, 2nd action executed", function exec_test(assert) {
  const fsmDef = {
    states: { A: '' },
    events: [],
    transitions: [
      {
        from: INIT_STATE, event: INIT_EVENT, guards: [
          { predicate: F, to: 'A', action: ACTION_IDENTITY },
          { predicate: T, to: 'A', action: ACTION_IDENTITY }
        ]
      }
    ],
    initialExtendedState: model_initial
  };
  const result = reduceTransitions(reduceFn, [], fsmDef.transitions).map(formatResult);
  assert.deepEqual(result, [
      {
        "guardIndex": 0,
        "transitionIndex": 0,
        "transitionStruct": {
          "action": "ACTION_IDENTITY",
          "event": "init",
          "from": "nok",
          "predicate": "anonymous",
          "to": "A"
        }
      },
      {
        "guardIndex": 1,
        "transitionIndex": 0,
        "transitionStruct": {
          "action": "ACTION_IDENTITY",
          "event": "init",
          "from": "nok",
          "predicate": "anonymous",
          "to": "A"
        }
      }
    ],
    `reduce transition when guards are specified`);
});

QUnit.test("INIT event, 2 actions with model update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [EVENT1],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update },
      { from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update },
    ],
    initialExtendedState: model_initial
  };
  const result = reduceTransitions(reduceFn, [], fsmDef.transitions).map(formatResult);
  assert.deepEqual(result, [
    {
      "guardIndex": 0,
      "transitionIndex": 0,
      "transitionStruct": {
        "action": "dummy_action_with_update",
        "event": "init",
        "from": "nok",
        "predicate": undefined,
        "to": "A"
      }
    },
    {
      "guardIndex": 0,
      "transitionIndex": 1,
      "transitionStruct": {
        "action": "another_dummy_action_with_update",
        "event": "event1",
        "from": "A",
        "predicate": undefined,
        "to": "B"
      }
    }
  ], `event triggers correct transition`);
});

QUnit.module("Testing mapOverTransitionsActions(mapFn, transitions)", {});

QUnit.test("INIT event, no action, no guard", function exec_test(assert) {
  const fsmDef = {
    states: { A: '' },
    events: [],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY }
    ],
    initialExtendedState: model_initial
  };
  const result = mapOverTransitionsActions(mapFn, fsmDef.transitions).map(formatResult);
  assert.deepEqual(result, [
    {
      "action": "ACTION_IDENTITY",
      "event": "init",
      "from": "nok",
      "to": "A"
    }
  ], `reduce transition when no guards are specified`);
});

QUnit.test("INIT event, 2 actions, [F,T] conditions, 2nd action executed", function exec_test(assert) {
  const fsmDef = {
    states: { A: '' },
    events: [],
    transitions: [
      {
        from: INIT_STATE, event: INIT_EVENT, guards: [
          { predicate: F, to: 'A', action: ACTION_IDENTITY },
          { predicate: T, to: 'A', action: ACTION_IDENTITY }
        ]
      }
    ],
    initialExtendedState: model_initial
  };
  const result = mapOverTransitionsActions(mapFn, fsmDef.transitions)
    .map(({ event, from, guards }) => ({ event, from, guards: guards.map(formatResult) }));
  assert.deepEqual(result,
    [
      {
        "event": "init",
        "from": "nok",
        "guards": [
          {
            "action": "ACTION_IDENTITY",
            "predicate": "anonymous",
            "to": "A"
          },
          {
            "action": "ACTION_IDENTITY",
            "predicate": "anonymous",
            "to": "A"
          }
        ]
      }
    ],
    `reduce transition when guards are specified`);
});

QUnit.test("INIT event, 2 actions with model update, NOK -> A -> B, no guards", function exec_test(assert) {
  const fsmDef = {
    states: { A: '', B: '' },
    events: [EVENT1],
    transitions: [
      { from: INIT_STATE, to: 'A', event: INIT_EVENT, action: dummy_action_with_update },
      { from: 'A', to: 'B', event: EVENT1, action: another_dummy_action_with_update },
    ],
    initialExtendedState: model_initial
  };
  const result = mapOverTransitionsActions(mapFn, fsmDef.transitions).map(formatResult);
  assert.deepEqual(result,
    [
      {
        "action": "dummy_action_with_update",
        "event": "init",
        "from": "nok",
        "to": "A"
      },
      {
        "action": "another_dummy_action_with_update",
        "event": "event1",
        "from": "A",
        "to": "B"
      }
    ], `event triggers correct transition`);
});

QUnit.module("Testing computeHistoryMaps(control_states)", {});

const OUTER = 'OUTER';
const INNER = 'INNER';
const OUTER_A = 'outer_a';
const OUTER_B = 'outer_b';
const INNER_S = 'inner_s';
const INNER_T = 'inner_t';
const Z = 'z';

QUnit.test("states with hierarchy", function exec_test(assert) {
  const states = { [OUTER]: { [INNER]: { [INNER_S]: '', [INNER_T]: '' }, [OUTER_A]: '', [OUTER_B]: '' }, [Z]: '' };
  const history = computeHistoryMaps(states);
  assert.deepEqual(history, {
    "stateAncestors": {
        "INNER": [
          "OUTER"
        ],
        "inner_s": [
          "INNER",
          "OUTER"
        ],
        "inner_t": [
          "INNER",
          "OUTER"
        ],
        "outer_a": [
          "OUTER"
        ],
        "outer_b": [
          "OUTER"
        ]
    },
    "stateList": [
      "OUTER",
      "INNER",
      "inner_s",
      "inner_t",
      "outer_a",
      "outer_b",
      "z"
    ]
  }, `...`);
});
