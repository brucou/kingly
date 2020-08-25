import * as QUnit from "qunitjs";
import {ACTION_IDENTITY, createPureStateMachine, formatUndefinedInJSON} from "../src";
import {tracer} from "courtesan";

QUnit.module("Fixing issue 4", {});

const updateState = (extendedState, updates) =>
  Object.assign({}, extendedState, updates);
const traceTransition = str => ({ outputs: [str], updates: {} });

QUnit.test("createPureStateMachine: not setting state for the machine => same semantics as createStateMachine", function exec_test(
  assert
) {
  const events = ["event1", "event2"];
  const states = {
    n1ღA: "",
    n2ღ: {
      "n2::n0ღB": "",
      "n2::n2ღ": {
        "n2::n2::n1ღ": {
          "n2::n2::n1::n0ღB": "",
          "n2::n2::n1::n2ღC": "",
          "n2::n2::n1::n3ღ": {
            "n2::n2::n1::n3::n0ღA": "",
            "n2::n2::n1::n3::n1ღB": "",
            "n2::n2::n1::n3::n2ღC": "",
            "n2::n2::n1::n3::n3ღD": ""
          }
        }
      }
    }
  };
  const guards = {
    // we test on extended state, so we test also the guard parameters
    // are as expected
    "not(isNumber)": (s, e, stg) => typeof e.n !== "number",
    isNumber: (s, e, stg) => typeof e.n === "number",
    shouldReturnToA: (s, e, stg) => e.shouldReturnToA
  };
  const actionFactories = {
    logAtoGroup1: (s, e, stg) => traceTransition("A -> Group1"),
    logGroup1toGroup2: (s, e, stg) => traceTransition("Group1 -> B"),
    logGroup2toGroup3: (s, e, stg) => traceTransition("Group2 -> Group3"),
    logGroup3toB: (s, e, stg) => traceTransition("Group3 -> B"),
    logGroup3BtoGroup4: (s, e, stg) => traceTransition("B -> Group4"),
    logGroup3toC: (s, e, stg) => traceTransition("Group3 -> C"),
    logAtoB: (s, e, stg) => traceTransition("A -> B"),
    logAtoC: (s, e, stg) => traceTransition("A -> C"),
    logBtoD: (s, e, stg) => traceTransition("B -> D"),
    logDtoA: (s, e, stg) => traceTransition("D -> A"),
    logCtoD: (s, e, stg) => traceTransition("C -> D")
  };
  const {
    logAtoB,
    logAtoC,
    logAtoGroup1,
    logBtoD,
    logCtoD,
    logDtoA,
    logGroup1toGroup2,
    logGroup2toGroup3,
    logGroup3toB,
    logGroup3toC,
    logGroup3BtoGroup4
  } = actionFactories;
  const transitions = [
    {
      from: "nok",
      event: "init",
      to: "n1ღA",
      action: ACTION_IDENTITY
    },
    {
      from: "n1ღA",
      event: "event1",
      to: "n2ღ",
      action: logAtoGroup1
    },
    {
      from: "n2::n0ღB",
      event: "",
      to: "n2::n2ღ",
      action: ACTION_IDENTITY
    },
    {
      from: "n2ღ",
      event: "init",
      to: "n2::n0ღB",
      action: logGroup1toGroup2
    },
    {
      from: "n2::n2ღ",
      event: "init",
      to: "n2::n2::n1ღ",
      action: logGroup2toGroup3
    },
    {
      from: "n2::n2::n1::n0ღB",
      event: "event1",
      to: "n2::n2::n1::n3ღ",
      action: logGroup3BtoGroup4
    },
    {
      from: "n2::n2::n1ღ",
      event: "init",
      guards: [
        {
          predicate: guards.isNumber,
          to: "n2::n2::n1::n0ღB",
          action: logGroup3toB
        },
        {
          predicate: guards["not(isNumber)"],
          to: "n2::n2::n1::n2ღC",
          action: logGroup3toC
        }
      ]
    },
    {
      from: "n2::n2::n1::n3::n0ღA",
      event: "event1",
      to: "n2::n2::n1::n3::n1ღB",
      action: logAtoB
    },
    {
      from: "n2::n2::n1::n3::n0ღA",
      event: "event2",
      to: "n2::n2::n1::n3::n2ღC",
      action: logAtoC
    },
    {
      from: "n2::n2::n1::n3::n1ღB",
      event: "event2",
      to: "n2::n2::n1::n3::n3ღD",
      action: logBtoD
    },
    {
      from: "n2::n2::n1::n3::n2ღC",
      event: "event1",
      to: "n2::n2::n1::n3::n3ღD",
      action: logCtoD
    },
    {
      from: "n2::n2::n1::n3::n3ღD",
      event: "",
      guards: [
        {
          predicate: guards.shouldReturnToA,
          to: "n2::n2::n1::n3::n0ღA",
          action: logDtoA
        }
      ]
    },
    {
      from: "n2::n2::n1::n3ღ",
      event: "init",
      to: "n2::n2::n1::n3::n0ღA",
      action: ACTION_IDENTITY
    }
  ];

  const fsmDef = {
    updateState,
    initialExtendedState: void 0,
    events,
    states,
    transitions
  };
  const inputs = [
    { event1: { n: 0 } },
    { event1: void 0 },
    { event1: void 0 },
    { event2: { shouldReturnToA: false } },
    { event2: { shouldReturnToA: false } }
  ];
  const fsm = createPureStateMachine(fsmDef, {debug:{console}, devTool:{tracer}});
  const outputs1 = inputs.map(input => fsm(input).outputs);

  assert.deepEqual(
    outputs1,
    [
      ["A -> Group1", "Group1 -> B", "Group2 -> Group3", "Group3 -> B"],
      ["B -> Group4"],
      ["A -> B"],
      ["B -> D", null],
      null
    ],
    formatUndefinedInJSON(inputs)
  );
});

QUnit.test("createPureStateMachine: setting state for the machine allows us to repeat computation", function exec_test(
  assert
) {
  const events = ["event1", "event2"];
  const states = {
    n1ღA: "",
    n2ღ: {
      "n2::n0ღB": "",
      "n2::n2ღ": {
        "n2::n2::n1ღ": {
          "n2::n2::n1::n0ღB": "",
          "n2::n2::n1::n2ღC": "",
          "n2::n2::n1::n3ღ": {
            "n2::n2::n1::n3::n0ღA": "",
            "n2::n2::n1::n3::n1ღB": "",
            "n2::n2::n1::n3::n2ღC": "",
            "n2::n2::n1::n3::n3ღD": ""
          }
        }
      }
    }
  };
  const guards = {
    // we test on extended state, so we test also the guard parameters
    // are as expected
    "not(isNumber)": (s, e, stg) => typeof e.n !== "number",
    isNumber: (s, e, stg) => typeof e.n === "number",
    shouldReturnToA: (s, e, stg) => e.shouldReturnToA
  };
  const actionFactories = {
    logAtoGroup1: (s, e, stg) => traceTransition("A -> Group1"),
    logGroup1toGroup2: (s, e, stg) => traceTransition("Group1 -> B"),
    logGroup2toGroup3: (s, e, stg) => traceTransition("Group2 -> Group3"),
    logGroup3toB: (s, e, stg) => traceTransition("Group3 -> B"),
    logGroup3BtoGroup4: (s, e, stg) => traceTransition("B -> Group4"),
    logGroup3toC: (s, e, stg) => traceTransition("Group3 -> C"),
    logAtoB: (s, e, stg) => traceTransition("A -> B"),
    logAtoC: (s, e, stg) => traceTransition("A -> C"),
    logBtoD: (s, e, stg) => traceTransition("B -> D"),
    logDtoA: (s, e, stg) => traceTransition("D -> A"),
    logCtoD: (s, e, stg) => traceTransition("C -> D")
  };
  const {
    logAtoB,
    logAtoC,
    logAtoGroup1,
    logBtoD,
    logCtoD,
    logDtoA,
    logGroup1toGroup2,
    logGroup2toGroup3,
    logGroup3toB,
    logGroup3toC,
    logGroup3BtoGroup4
  } = actionFactories;
  const transitions = [
    {
      from: "nok",
      event: "init",
      to: "n1ღA",
      action: ACTION_IDENTITY
    },
    {
      from: "n1ღA",
      event: "event1",
      to: "n2ღ",
      action: logAtoGroup1
    },
    {
      from: "n2::n0ღB",
      event: "",
      to: "n2::n2ღ",
      action: ACTION_IDENTITY
    },
    {
      from: "n2ღ",
      event: "init",
      to: "n2::n0ღB",
      action: logGroup1toGroup2
    },
    {
      from: "n2::n2ღ",
      event: "init",
      to: "n2::n2::n1ღ",
      action: logGroup2toGroup3
    },
    {
      from: "n2::n2::n1::n0ღB",
      event: "event1",
      to: "n2::n2::n1::n3ღ",
      action: logGroup3BtoGroup4
    },
    {
      from: "n2::n2::n1ღ",
      event: "init",
      guards: [
        {
          predicate: guards.isNumber,
          to: "n2::n2::n1::n0ღB",
          action: logGroup3toB
        },
        {
          predicate: guards["not(isNumber)"],
          to: "n2::n2::n1::n2ღC",
          action: logGroup3toC
        }
      ]
    },
    {
      from: "n2::n2::n1::n3::n0ღA",
      event: "event1",
      to: "n2::n2::n1::n3::n1ღB",
      action: logAtoB
    },
    {
      from: "n2::n2::n1::n3::n0ღA",
      event: "event2",
      to: "n2::n2::n1::n3::n2ღC",
      action: logAtoC
    },
    {
      from: "n2::n2::n1::n3::n1ღB",
      event: "event2",
      to: "n2::n2::n1::n3::n3ღD",
      action: logBtoD
    },
    {
      from: "n2::n2::n1::n3::n2ღC",
      event: "event1",
      to: "n2::n2::n1::n3::n3ღD",
      action: logCtoD
    },
    {
      from: "n2::n2::n1::n3::n3ღD",
      event: "",
      guards: [
        {
          predicate: guards.shouldReturnToA,
          to: "n2::n2::n1::n3::n0ღA",
          action: logDtoA
        }
      ]
    },
    {
      from: "n2::n2::n1::n3ღ",
      event: "init",
      to: "n2::n2::n1::n3::n0ღA",
      action: ACTION_IDENTITY
    }
  ];

  const fsmDef = {
    updateState,
    initialExtendedState: void 0,
    events,
    states,
    transitions
  };
  const inputs = [
    { event1: { n: 0 } },
    { event1: void 0 },
    { event1: void 0 },
    { event2: { shouldReturnToA: false } },
    { event2: { shouldReturnToA: false } }
  ];
  const fsm = createPureStateMachine(fsmDef, {debug:{console}, devTool:{tracer}});
  const  sequence= inputs.map(input => fsm(input));
  const fsmStateSeq = sequence.map(x => x.fsmState);
  const outputsSeq= sequence.map(x => x.outputs);
  const outputsSeq2 = inputs.map((input, index) => fsm(input, index > 0 ? fsmStateSeq[index -1]:null).outputs);

  assert.deepEqual(
    outputsSeq2,
    outputsSeq,
    formatUndefinedInJSON(inputs)
  );
});

