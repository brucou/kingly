import * as QUnit from "qunitjs";
import {ACTION_IDENTITY, createStateMachine} from "../src";
import {tracer} from "courtesan";
import { formatUndefinedInJSON } from "../src/helpers"

QUnit.module("Fixing issue 5", {});

const updateState = (extendedState, updates) =>
  Object.assign({}, extendedState, updates);
const traceTransition = str => ({outputs: [str], updates: {}});
const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

QUnit.test("debug settings, event, no action, false guard", function exec_test(
  assert
) {
  const events = ["event3", "event2", "event1"];
  const event1 = {event1: void 0};
  const event2 = {event2: void 0};
  const event3 = {event3: void 0};
  const states = {
    n1ღE: "",
    n2ღ: {
      "n2::n0ღB": "",
      "n2::n1ღC": "",
      "n2::n2ღ": {
        "n2::n2::n0ღD": "",
        "n2::n2::n2ღD": ""
      },
      "n2::n4ღH": ""
    }
  };
  const guards = {};
  const actionFactories = {
    logGroup1toC: (s, e, stg) => traceTransition("Group1 -> C"),
    logGroup1toD: (s, e, stg) => traceTransition("Group1 -> D"),
    logGroup1toE: (s, e, stg) => traceTransition("Group1 -> E"),
    logBtoC: (s, e, stg) => traceTransition("B -> C"),
    logBtoD: (s, e, stg) => traceTransition("B -> D"),
    logCtoD: (s, e, stg) => traceTransition("C -> D"),
    logDtoD: (s, e, stg) => traceTransition("D -> D"),
    logGroup1toH: (s, e, stg) => traceTransition("Group1 -> Group1H")
  };
  const {
    logCtoD,
    logBtoD,
    logBtoC,
    logDtoD,
    logGroup1toC,
    logGroup1toD,
    logGroup1toE,
    logGroup1toH
  } = actionFactories;
  const transitions = [
      {
        from: 'nok',
        event: 'init',
        to: 'n2::n0ღB',
        action: ACTION_IDENTITY
      },
      {
        from: 'n2::n0ღB',
        event: 'event1',
        to: 'n2::n2::n2ღD',
        action: logBtoD
      },
      {
        from: 'n2::n2::n2ღD',
        event: 'event1',
        to: 'n2::n2::n0ღD',
        action: logDtoD
      },
      {
        from: 'n2ღ',
        event: 'event3',
        to: 'n1ღE',
        action: logGroup1toH
      },
      {
        from: 'n1ღE',
        event: '',
        to: {shallow: 'n2ღ'},
        action: ACTION_IDENTITY
      },
      {
        from: 'n2::n0ღB',
        event: 'event2',
        to: 'n2::n1ღC',
        action: logBtoC
      },
      {
        from: 'n2::n1ღC',
        event: '',
        to: 'n2::n2::n0ღD',
        action: logCtoD
      },
      {
        from: 'n2::n2ღ',
        event: 'init',
        to: 'n2::n2::n0ღD',
        action: logGroup1toD
      },
      {
        from: 'n2ღ',
        event: 'init',
        to: 'n2::n1ღC',
        action: logGroup1toC
      },
    ]
  ;

  const fsmDef = {
    updateState,
    initialExtendedState: void 0,
    events,
    states,
    transitions
  };
  const inputSpace = cartesian([0, 1, 2], [0, 1, 2], [0, 1, 2]);
  const eventSpace = [event1, event2, event3];

  const cases = inputSpace.map(scenario => {
    return [eventSpace[scenario[0]], eventSpace[scenario[1]], eventSpace[scenario[2]]];
  });

  const expected1 = [
    // [event1, event1, event1]
    [['B -> D'], ['D -> D'], null],
    [['B -> D'], ['D -> D'], null],
    [['B -> D'], ['D -> D'], ['Group1 -> Group1H', 'Group1 -> D']],
    // [event1, event2, event1]
    [['B -> D'], null, ['D -> D']],
    [['B -> D'], null, null],
    [['B -> D'], null, ['Group1 -> Group1H', 'Group1 -> D']],
    // [event1, event3, event1]
    [['B -> D'], ['Group1 -> Group1H', 'Group1 -> D'], null],
    [['B -> D'], ['Group1 -> Group1H', 'Group1 -> D'], null],
    [['B -> D'], ['Group1 -> Group1H', 'Group1 -> D'], ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event2, event1, event1]
    [['B -> C', 'C -> D'], null, null],
    [['B -> C', 'C -> D'], null, null],
    [['B -> C', 'C -> D'], null, ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event2, event2, event1]
    [['B -> C', 'C -> D'], null, null],
    [['B -> C', 'C -> D'], null, null],
    [['B -> C', 'C -> D'], null, ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event2, event3, event1]
    [['B -> C', 'C -> D'], ['Group1 -> Group1H', 'Group1 -> D'], null],
    [['B -> C', 'C -> D'], ['Group1 -> Group1H', 'Group1 -> D'], null],
    [['B -> C', 'C -> D'], ['Group1 -> Group1H', 'Group1 -> D'], ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event3, event3, event1]
    [['Group1 -> Group1H'], ['B -> D'], ['D -> D']],
    [['Group1 -> Group1H'], ['B -> D'], null],
    [['Group1 -> Group1H'], ['B -> D'], ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event3, event3, event2]
    [['Group1 -> Group1H'], ['B -> C', 'C -> D'], null],
    [['Group1 -> Group1H'], ['B -> C', 'C -> D'], null],
    [['Group1 -> Group1H'], ['B -> C', 'C -> D'], ['Group1 -> Group1H', 'Group1 -> D']],
    // // [event3, event3, event3]
    [['Group1 -> Group1H'], ['Group1 -> Group1H'], ['B -> D']],
    [['Group1 -> Group1H'], ['Group1 -> Group1H'], ['B -> C', 'C -> D']],
    [['Group1 -> Group1H'], ['Group1 -> Group1H'], ['Group1 -> Group1H']],
  ];

  cases.forEach((scenario, index) => {
    console.log(scenario)
    const fsm1 = createStateMachine(fsmDef, {debug: {console}, devTool: {tracer}})
    if (index >30) return
    const outputs = scenario.map(fsm1);
    assert.deepEqual(outputs, expected1[index], formatUndefinedInJSON(scenario));
  });

});
