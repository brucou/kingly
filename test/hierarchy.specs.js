import {
  ACTION_IDENTITY, createStateMachine, INIT_EVENT, INIT_STATE, NO_OUTPUT, SHALLOW, DEEP,
  historyState
} from "../src"
import { formatResult } from "./helpers"
import * as QUnit from "qunitjs"
import { assertContract, isArrayUpdateOperations } from "../test/helpers"
import { applyPatch } from "json-patch-es6/lib/duplex"
import { CONTRACT_MODEL_UPDATE_FN_RETURN_VALUE } from "../src/properties"

const default_settings = {};

const A = 'A';
const B = 'B';
const C = 'C';
const D = 'D';
const E = 'E';
const EVENT1 = 'event1';
const EVENT2 = 'event2';
const EVENT3 = 'event3';
const EVENT4 = 'event4';
const EVENT5 = 'event5';
// constant for switching between deep history and shallow history

/**
 *
 * @param {*} extendedState
 * @param {Operation[]} operations
 * @returns {*}
 */
function applyJSONpatch(extendedState, operations) {
  assertContract(isArrayUpdateOperations, [operations],
    `applyUpdateOperations : ${CONTRACT_MODEL_UPDATE_FN_RETURN_VALUE}`);

  // NOTE : we don't validate operations, to avoid throwing errors when for instance the value property for an
  // `add` JSON operation is `undefined` ; and of course we don't mutate the document in place
  return applyPatch(extendedState, operations, false, false).newDocument;
}

function incCounter(extS, eventData) {
  const { counter } = extS;

  return {
    updates: [{ op: 'add', path: '/counter', value: counter + 1 }],
    outputs: [counter]
  }
}

function incCounterTwice(extS, eventData) {
  const { counter } = extS;

  return {
    updates: [{ op: 'add', path: '/counter', value: counter + 2 }],
    outputs: [counter]
  }
}

function setBdata(extendedState, eventData) {
  return {
    updates: [
      { op: 'add', path: '/b', value: eventData }
    ],
    outputs: NO_OUTPUT
  }
}

function setCinvalidData(extendedState, eventData) {
  return {
    updates: [
      { op: 'add', path: '/c', value: { error: eventData.error, data: eventData.data } },
      { op: 'add', path: '/switch', value: false },
    ]
  }
}

function setCvalidData(extendedState, eventData) {
  return {
    updates: [
      { op: 'add', path: '/c', value: { error: null, data: eventData.data } },
      { op: 'add', path: '/switch', value: true },
    ],
    outputs: NO_OUTPUT
  }
}

function setReviewed(extendedState, eventData) {
  return {
    updates: [
      { op: 'add', path: '/reviewed', value: true },
    ],
    outputs: NO_OUTPUT
  }
}

function setReviewedAndOuput(extendedState, eventData) {
  return {
    updates: [
      { op: 'add', path: '/reviewed', value: true },
    ],
    outputs: extendedState
  }
}

function setSwitch() {
  return {
    updates: [{ op: 'add', path: '/switch', value: true }],
    outputs: NO_OUTPUT
  }
}

function unsetSwitch() {
  return {
    updates: [{ op: 'add', path: '/switch', value: false }],
    outputs: NO_OUTPUT
  }
}

function incC(extS) {
  const c = extS.c;
  return {
    updates: [{ op: 'add', path: '/c', value: c + 1 }],
    outputs: NO_OUTPUT
  }
}

function incB(extS) {
  const b = extS.b;
  return {
    updates: [{ op: 'add', path: '/b', value: b + 1 }],
    outputs: NO_OUTPUT
  }
}

function outputState(extS){
return {
  updates : [],
  outputs : [extS]
}
}

function isSetSwitch(extS) {
  return extS.switch
}

function isNotSetSwitch(extS) {
  return !extS.switch
}

QUnit.module("Testing hierarchy features", {});

QUnit.test("shallow history transitions, event CASCADING transitions", function exec_test(assert) {
  const OUTER = 'OUTER';
  const INNER = 'INNER';
  const OUTER_A = 'outer_a';
  const OUTER_B = 'outer_b';
  const INNER_S = 'inner_s';
  const INNER_T = 'inner_t';
  const Z = 'z';
  const states = { [OUTER]: { [INNER]: { [INNER_S]: '', [INNER_T]: '' }, [OUTER_A]: '', [OUTER_B]: '' }, [Z]: '' };
  const fsmDef = {
    states,
    events: [EVENT1, EVENT2, EVENT3, EVENT4],
    initialExtendedState: { history: SHALLOW, counter: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: OUTER, action: ACTION_IDENTITY },
      { from: OUTER, event: INIT_EVENT, to: OUTER_A, action: ACTION_IDENTITY },
      { from: OUTER_A, event: EVENT1, to: INNER, action: ACTION_IDENTITY },
      { from: INNER, event: INIT_EVENT, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER_S, event: EVENT3, to: INNER_T, action: ACTION_IDENTITY },
      { from: INNER_T, event: EVENT3, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER, event: EVENT2, to: OUTER_B, action: ACTION_IDENTITY },
      { from: OUTER, event: EVENT1, to: Z, action: ACTION_IDENTITY },
      {
        from: Z, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounter
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounter
          }
        ]
      },
    ],
    updateState: applyJSONpatch,
  };
  const inputSequence = [
    // { "init": fsmDef.initialExtendedState },
    { [EVENT1]: {} },
    { [EVENT3]: {} },
    { [EVENT1]: {} },
    { [EVENT4]: {} },
  ];
  const fsm = createStateMachine(fsmDef, {debug:{console}});
  // @ts-ignore
  const outputSequence = inputSequence.map(fsm);
  // @ts-ignore
  const formattedResults = outputSequence.map(output => output && output.map(formatResult));
  assert.deepEqual(formattedResults, [
    [],
    NO_OUTPUT,
    NO_OUTPUT,
    [0]
  ], `eventless transitions are correctly taken`);
});

QUnit.test("deep history transitions, event CASCADING transitions", function exec_test(assert) {
  const OUTER = 'OUTER';
  const INNER = 'INNER';
  const OUTER_A = 'outer_a';
  const OUTER_B = 'outer_b';
  const INNER_S = 'inner_s';
  const INNER_T = 'inner_t';
  const Z = 'z';
  const states = { [OUTER]: { [INNER]: { [INNER_S]: '', [INNER_T]: '' }, [OUTER_A]: '', [OUTER_B]: '' }, [Z]: '' };
  const fsmDef = {
    states,
    events: [EVENT1, EVENT2, EVENT3, EVENT4],
    initialExtendedState: { history: DEEP, counter: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: OUTER, action: ACTION_IDENTITY },
      { from: OUTER, event: INIT_EVENT, to: OUTER_A, action: ACTION_IDENTITY },
      { from: OUTER_A, event: EVENT1, to: INNER, action: ACTION_IDENTITY },
      { from: INNER, event: INIT_EVENT, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER_S, event: EVENT3, to: INNER_T, action: ACTION_IDENTITY },
      { from: INNER_T, event: EVENT3, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER, event: EVENT2, to: OUTER_B, action: ACTION_IDENTITY },
      { from: OUTER, event: EVENT1, to: Z, action: ACTION_IDENTITY },
      {
        from: Z, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounter
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounter
          }
        ]
      },
    ],
    updateState: applyJSONpatch,
    settings : default_settings
  };
  const inputSequence = [
    // { "init": fsmDef.initialExtendedState },
    { [EVENT1]: {} },
    { [EVENT3]: {} },
    { [EVENT1]: {} },
    { [EVENT4]: {} },
  ];
  const fsm = createStateMachine(fsmDef);
  // @ts-ignore
  const outputSequence = inputSequence.map(fsm);
  // @ts-ignore
  const formattedResults = outputSequence.map(output => output && output.map(formatResult));
  assert.deepEqual(formattedResults, [
    [],
    NO_OUTPUT,
    NO_OUTPUT,
    [0]
  ], `eventless transitions are correctly taken`);
});

QUnit.test("shallow history transitions FROM INSIDE, event CASCADING transitions", function exec_test(assert) {
  const OUTER = 'OUTER';
  const INNER = 'INNER';
  const OUTER_A = 'outer_a';
  const OUTER_B = 'outer_b';
  const INNER_S = 'inner_s';
  const INNER_T = 'inner_t';
  const Z = 'z';
  const states = { [OUTER]: { [INNER]: { [INNER_S]: '', [INNER_T]: '' }, [OUTER_A]: '', [OUTER_B]: '' }, [Z]: '' };
  const fsmDef = {
    states,
    events: [EVENT1, EVENT2, EVENT3, EVENT4],
    initialExtendedState: { history: SHALLOW, counter: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: OUTER, action: ACTION_IDENTITY },
      { from: OUTER, event: INIT_EVENT, to: OUTER_A, action: ACTION_IDENTITY },
      { from: OUTER_A, event: EVENT1, to: INNER, action: ACTION_IDENTITY },
      { from: INNER, event: INIT_EVENT, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER_S, event: EVENT3, to: INNER_T, action: ACTION_IDENTITY },
      { from: INNER_T, event: EVENT3, to: INNER_S, action: ACTION_IDENTITY },
      {
        from: INNER_T, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounterTwice
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounterTwice
          }
        ]
      },
      { from: INNER, event: EVENT2, to: OUTER_B, action: ACTION_IDENTITY },
      { from: OUTER, event: EVENT1, to: Z, action: ACTION_IDENTITY },
      {
        from: Z, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounter
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounter
          }
        ]
      },
    ],
    updateState: applyJSONpatch,
    settings : default_settings
  };
  const inputSequence = [
    // { "init": fsmDef.initialExtendedState },
    { [EVENT1]: {} },
    { [EVENT3]: {} },
    { [EVENT4]: {} },
  ];
  const fsm = createStateMachine(fsmDef, default_settings);
  // @ts-ignore
  const outputSequence = inputSequence.map(fsm);
  console.log(`outputSequence `, outputSequence)
  // @ts-ignore
  const formattedResults = outputSequence.map(output => output && output.map(formatResult));
  assert.deepEqual(formattedResults, [
    // [NO_OUTPUT, NO_OUTPUT],
    [],
    [],
    [0]
  ], `eventless transitions are correctly taken`);
});

QUnit.test("deep history transitions FROM INSIDE, event CASCADING transitions", function exec_test(assert) {
  const OUTER = 'OUTER';
  const INNER = 'INNER';
  const OUTER_A = 'outer_a';
  const OUTER_B = 'outer_b';
  const INNER_S = 'inner_s';
  const INNER_T = 'inner_t';
  const Z = 'z';
  const states = { [OUTER]: { [INNER]: { [INNER_S]: '', [INNER_T]: '' }, [OUTER_A]: '', [OUTER_B]: '' }, [Z]: '' };
  const fsmDef = {
    states,
    events: [EVENT1, EVENT2, EVENT3, EVENT4],
    initialExtendedState: { history: DEEP, counter: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: OUTER, action: ACTION_IDENTITY },
      { from: OUTER, event: INIT_EVENT, to: OUTER_A, action: ACTION_IDENTITY },
      { from: OUTER_A, event: EVENT1, to: INNER, action: ACTION_IDENTITY },
      { from: INNER, event: INIT_EVENT, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER_S, event: EVENT3, to: INNER_T, action: ACTION_IDENTITY },
      { from: INNER_T, event: EVENT3, to: INNER_S, action: ACTION_IDENTITY },
      {
        from: INNER_T, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounterTwice
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounterTwice
          }
        ]
      },
      { from: INNER, event: EVENT2, to: OUTER_B, action: ACTION_IDENTITY },
      { from: OUTER, event: EVENT1, to: Z, action: ACTION_IDENTITY },
      {
        from: Z, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: historyState(DEEP, OUTER),
            action: incCounter
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: historyState(SHALLOW, OUTER),
            action: incCounter
          }
        ]
      },
    ],
    updateState: applyJSONpatch,
  };
  const inputSequence = [
    // { "init": fsmDef.initialExtendedState },
    { [EVENT1]: {} },
    { [EVENT3]: {} },
    { [EVENT4]: {} },
  ];
  const fsm = createStateMachine(fsmDef, default_settings);
  // @ts-ignore
  const outputSequence = inputSequence.map(fsm);
  // @ts-ignore
  const formattedResults = outputSequence.map(output => output && output.map(formatResult));
  assert.deepEqual(formattedResults, [
    // [NO_OUTPUT, NO_OUTPUT],
    [],
    [],
    [0]
  ], `eventless transitions are correctly taken`);
});

QUnit.test("eventless x atomic transitions", function exec_test(assert) {
  const states = { [A]: '', [B]: '', [C]: '', [D]: '', [E]: '' };
  const fsmDef = {
    states,
    events: [EVENT1, EVENT2],
    initialExtendedState: { switch: false, b: 0, c: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: A, action: setSwitch },
      {
        from: A, guards: [
          { predicate: isSetSwitch, to: C, action: incC },
          { predicate: isNotSetSwitch, to: B, action: incB },
        ]
      },
      { from: C, event: EVENT1, to: D, action: ACTION_IDENTITY },
      { from: B, event: EVENT2, to: D, action: ACTION_IDENTITY },
      {
        from: D, guards: [
          { predicate: isSetSwitch, to: A, action: unsetSwitch},
          { predicate: isNotSetSwitch, to: E, action: outputState},
        ]
      },
    ],
    updateState: applyJSONpatch,
  };
  const inputSequence = [
    // { "init": fsmDef.initialExtendedState },
    { [EVENT1]: {} },
    { [EVENT2]: {} },
  ];
  const fsm = createStateMachine(fsmDef, {debug:{console}});
  // @ts-ignore
  const outputSequence = inputSequence.map(fsm);
  // @ts-ignore
  const formattedResults = outputSequence.map(output => output && output.map(formatResult));
  assert.deepEqual(formattedResults, [
    // [
    //   null,
    //   null
    // ],
    [],
    [
      {
        "b": 1,
        "c": 1,
        "switch": false
      }
    ]
  ], `eventless transitions are correctly taken`);
});

QUnit.test("eventless transitions returning to origin control state at creation time", function exec_test(assert) {
  const states = { [A]: ''};
  const fsmDef = {
    states,
    events: [],
    initialExtendedState: {},
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: A, action: ACTION_IDENTITY },
      {
        from: A, guards: [
          { predicate: () => true, to: A, action: ACTION_IDENTITY },
        ]
      },
    ],
    updateState: applyJSONpatch,
  };
  const fsm = createStateMachine(fsmDef, {debug:{console}});
  assert.ok(fsm instanceof Error, `It is not possible to create a machine with an eventless transition that loops back to the same origin control state`)
});

QUnit.test("eventless transitions returning to origin control state at runtime", function exec_test(assert) {
  const states = { [A]: '', [B]: '', };
  const fsmDef = {
    states,
    events: [],
    initialExtendedState: {},
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: A, action: ACTION_IDENTITY },
      { from: A, event: EVENT1, to:B, action: ACTION_IDENTITY },
      {
        from: B, guards: [
          { predicate: () => true, to: B, action: ACTION_IDENTITY },
        ]
      },
    ],
    updateState: applyJSONpatch,
  };
  const inputSequence = [
    {[EVENT1]: {}}
  ];
  const fsm = createStateMachine(fsmDef, {debug:{console}});
  if (fsm instanceof Error) {
    assert.ok(false, `Test failing at creating the machine! Please investigate.`)
    return
  }
  const outputSequence = inputSequence.map(fsm);
  // @ts-ignore
  const formattedResults = outputSequence.map(output => {
    if (output instanceof Error){
      return "Error"
    }
    else return output && output.map(formatResult)
  });
  assert.deepEqual(formattedResults, [
      "Error"
  ], `Evaluating eventless transitions that loop back to the same control state produces an error`);
});
