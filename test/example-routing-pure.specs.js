import * as QUnit from "qunitjs"
// Achtung!! For some reason, parcel does not bundle well if using the original
// import line in routing_machine_v2.graphml.
// Gentlemen this is a hack, let's now pray that the original file does not change
// and we forget to change this one too...
import {
  states, events, getKinglyTransitions, createStateMachineFromGraph
} from "./graphs/routing_machine_v2_without_external_import.graphml.fsm"
import { tracer } from "../devtool"
import { fsmContracts } from "../src/contracts"
import { createPureStateMachine } from "../src/synchronous_fsm"

function makeTracedOutputs(actionName, extS) {
  return [
    {
      [actionName]: extS
    }
  ]
}

const default_settings = {};
const debug_settings = Object.assign({}, default_settings, {
    debug: {
      checkContracts: fsmContracts,
      console
    },
    devTool: { tracer },
  }
);

// Event monikers
const URL_CHANGED = "url changed";
const BACK = "back";
const NAVIGATE = "navigate";

// Actually we are not doing any state update here, so reusing the one for the chess tests
// State update
// Basically {a, b: {c, d}}, [{b:{e}}] -> {a, b:{e}}
// All Object.assign caveats apply
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function updateState(extendedState, extendedStateUpdates) {
  const extendedStateCopy = Object.assign({}, extendedState);
  return extendedStateUpdates.reduce((acc, x) => Object.assign(acc, x), extendedStateCopy);
}

// Guards
const guards = {
  "cart url": function isCartURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^cart\/?/.exec(URL)
  },
  "about url": function isAboutURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^about\/?/.exec(URL)
  },
  "home url": function isSearchURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^home\/?/.exec(URL)
  },
  "checkout url": function isCheckoutURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^checkout\/?/.exec(URL)
  },
  "unknown url": function cannotTransition(extendedState, eventData, settings) {
    const URL = eventData;
    return !(
      /^cart\/?/.exec(URL) ||
      /^about\/?/.exec(URL) ||
      /^search\/?/.exec(URL) ||
      /^checkout\/?/.exec(URL)
    )
  },
  "unknown about url": function cannotTransition(extendedState, eventData, settings) {
    const URL = eventData;
    return !URL || !!/^about\/?/.exec(URL) &&
      !/^about\/team$/.exec(URL)
  },
  "team url": function isTeamURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^about\/team$/.exec(URL)
  },
  "slash url": function isSlashURL(extendedState, eventData, settings) {
    const URL = eventData;
    return !!/^about\/?$/.exec(URL)
  },
};

// -----Actions------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns {{updates: U[], outputs: O[]}}
 * (such that updateState:: E -> U[] -> E)
 */
const actionFactories = {
  "update url": function updateURL(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("update url", extendedState),
      updates: [{URL: eventData, oldURL: extendedState.URL || "home"}]
    }
  },
  "initialize state": function initializeState(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("initialize state", extendedState),
      updates: [{oldURL:"home"}]
    }
  },
  "transition prev -&gt; cart": function transitionPrevToCart(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> cart", extendedState),
      updates: [{URL: eventData}]
    }

  },
  "transition prev -&gt; about": function transitionPrevToAbout(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> about", extendedState),
      updates: [{URL:eventData}]
    }
  },
  "transition prev -&gt; home": function transitionPrevToSearch(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> home", extendedState),
      updates: [{URL:eventData}]
    }
  },
  "transition prev -&gt; checkout": function transitionPrevToCheckout(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> checkout", extendedState),
      updates: [{URL:eventData}]
    }
  },
  "restore url": function restoreURL(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("restore url", extendedState),
      updates: [{URL:extendedState.oldURL, oldURL: "home"}]
    }
  },
  "render cart": function renderCart(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("render cart", extendedState),
      updates: []
    }
  },
  "transition prev -&gt; team": function transitionPrevToAboutTeam(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> team", extendedState),
      updates: [{URL:eventData}]
    }
  },
  "transition prev -&gt; about home": function transitionPrevToAboutHome(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("transition prev -> home", extendedState),
      updates: [{URL:"about"}]
    }
  },
  "render checkout": function renderCheckout(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("render checkout", extendedState),
      updates: []
    }
  },
  "render home": function renderHome(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("render home", extendedState),
      updates: []
    }
  },
  "render about home": function renderAboutDetail(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("render about home", extendedState),
      updates: []
    }
  },
  "correct url": function correctURL(extendedState, eventData, settings) {
    return {
      outputs: makeTracedOutputs("correct url", extendedState),
      updates: [{URL: "about", oldURL: "about"}]
    }
  },
};
// ----------------

const initialExtendedState = {
  oldURL: void 0,
  URL: void 0
};

function createPureStateMachineFromGraph(fsmDefForCompile, settings) {
  var updateState = fsmDefForCompile.updateState;
  var initialExtendedState = fsmDefForCompile.initialExtendedState;

  var transitions = getKinglyTransitions({
    actionFactories: fsmDefForCompile.actionFactories,
    guards: fsmDefForCompile.guards,
  });

  var fsm = createPureStateMachine(
    {
      updateState,
      initialExtendedState,
      states,
      events,
      transitions,
    },
    settings
  );

  return fsm;
}


QUnit.module("Testing createPureStateMachine(fsmDef, settings) with examples", {});

// Properties:
// Running a sequence through createStateMachine generates the same inputs than running a sequence through createPureStateMachine with the returned extended state
// We test that property for one sample sequence, from different starting points
// Because the API is pure, we can create only one state machine
// 1. We run a sequence through the pure API with fsmState === void 0
//  -> the machine will behave as in createStateMachine
// We store the intermediate states the machine goes through
// 2. We reset the machine (fsmState == null)
// 3. We rerun 1.
// -> We should get the same results
// 4. We run n times the sequence from index n with the nth previously stored intermediate state of the machine
// -> results should a subset of the results of the first run 1.
// Those tests give us some confidence that the intermediate internal states are not mutated as they are reused several times!

QUnit.test("Running pure API with sequence", function exec_test(assert) {

  const fsm = createPureStateMachineFromGraph({
    updateState,
    initialExtendedState,
    actionFactories,
    guards
  }, debug_settings);
  const baseFsm = createStateMachineFromGraph({
    updateState,
    initialExtendedState,
    actionFactories,
    guards
  }, debug_settings);

  const allGoodRoutesSomeBadRoutesAndBack = [
    // bad route at the start -> should go to home route
    // we tested here history state when there is no history for a compound state yet
    // it takes the init transition for that compound state!
    { [URL_CHANGED]: "a3" },
    // Another bad one - it should do the same, we test history again but with some history
    // created and at nesting level -1 (so we know H is not computed as H* by mistake)
    { [URL_CHANGED]: "a4" },
    // a good one now
    { [URL_CHANGED]: "home" },
    // another one
    { [URL_CHANGED]: "cart" },
    // and another one
    { [URL_CHANGED]: "checkout" },
    // a bad one but nested
    { [URL_CHANGED]: "about/a5" },
    // navigating to about/team
    { [NAVIGATE]: void 0 },
    // a bad one but nested, should return to `team` this time!
    { [URL_CHANGED]: "about/a6" },
    // navigating to prove that it is NOT in `about` indeed
    { [NAVIGATE]: void 0 },
    // this time go back
    { [BACK]: void 0 },
    // should end up in team by history state mechanism
    // navigating to prove that it is NOT in `about` indeed
    { [NAVIGATE]: void 0 },
    // another good route not covered yet
    { [URL_CHANGED]: "about/team" },
    // a last good route to achieve transitions coverage
    { [URL_CHANGED]: "about/" },
  ];
  // @ts-ignore
  const outputs = allGoodRoutesSomeBadRoutesAndBack.map(baseFsm);
  const expectedOutputs = [
      [
        {
          "update url": {
            "URL": undefined,
            "oldURL": undefined
          }
        },
        {
          "initialize state": {
            "URL": undefined,
            "oldURL": undefined
          }
        },
        {
          "restore url": {
            "URL": "a3",
            "oldURL": "home"
          }
        },
        {
          "render home": {
            "URL": "home",
            "oldURL": "home"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "home",
            "oldURL": "home"
          }
        },
        {
          "restore url": {
            "URL": "a4",
            "oldURL": "home"
          }
        },
        {
          "render home": {
            "URL": "home",
            "oldURL": "home"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "home",
            "oldURL": "home"
          }
        },
        {
          "transition prev -> home": {
            "URL": "home",
            "oldURL": "home"
          }
        },
        {
          "render home": {
            "URL": "home",
            "oldURL": "home"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "home",
            "oldURL": "home"
          }
        },
        {
          "transition prev -> cart": {
            "URL": "cart",
            "oldURL": "home"
          }
        },
        {
          "render cart": {
            "URL": "cart",
            "oldURL": "home"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "cart",
            "oldURL": "home"
          }
        },
        {
          "transition prev -> checkout": {
            "URL": "checkout",
            "oldURL": "cart"
          }
        },
        {
          "render checkout": {
            "URL": "checkout",
            "oldURL": "cart"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "checkout",
            "oldURL": "cart"
          }
        },
        {
          "transition prev -> about": {
            "URL": "about/a5",
            "oldURL": "checkout"
          }
        },
        {
          "correct url": {
            "URL": "about/a5",
            "oldURL": "checkout"
          }
        },
        {
          "transition prev -> home": {
            "URL": "about",
            "oldURL": "about"
          }
        }
      ],
      [],
      [
        {
          "update url": {
            "URL": "about",
            "oldURL": "about"
          }
        },
        {
          "transition prev -> about": {
            "URL": "about/a6",
            "oldURL": "about"
          }
        },
        {
          "correct url": {
            "URL": "about/a6",
            "oldURL": "about"
          }
        }
      ],
      // No event handlers for the NAVIGATE event!
      null,
      // Back event
      [
        {
          "restore url": {
            "URL": "about",
            "oldURL": "about"
          }
        },
        {
          "correct url": {
            "URL": "about",
            "oldURL": "home"
          }
        }
      ],
      // No event handlers for the NAVIGATE event! We are in TEAM
      null,
      [
        {
          "update url": {
            "URL": "about",
            "oldURL": "about"
          }
        },
        {
          "transition prev -> about": {
            "URL": "about/team",
            "oldURL": "about"
          }
        },
        {
          "transition prev -> team": {
            "URL": "about/team",
            "oldURL": "about"
          }
        }
      ],
      [
        {
          "update url": {
            "URL": "about/team",
            "oldURL": "about"
          }
        },
        {
          "transition prev -> about": {
            "URL": "about/",
            "oldURL": "about/team"
          }
        },
        {
          "transition prev -> home": {
            "URL": "about/",
            "oldURL": "about/team"
          }
        }
      ]
    ];

  assert.deepEqual(outputs, expectedOutputs, `Base machine is computing fine.`);

// Achtung! Do do not do .map(fsm)!! Because array mapping is passing extra parameters that are wrongly interpreted!
  const pureMachineTraces = allGoodRoutesSomeBadRoutesAndBack.map(input => {
    // @ts-ignore
    return fsm(input)
  });
  const pureMachineOutputs = pureMachineTraces.map(x => x.outputs);
  assert.deepEqual(pureMachineOutputs, expectedOutputs, `Pure API is computing fine with undefined as second parameter.`);

 // resetting the pure machine
  // Passing an input that will be rejected by the machine so we don't advance
  // before running the full sequence
  // @ts-ignore
  fsm({}, null);

  // Redoing the same test
  const pureMachineTraces2 = allGoodRoutesSomeBadRoutesAndBack.map(input => {
    // @ts-ignore
    return fsm(input)
  });
  const pureMachineOutputs2 = pureMachineTraces2.map(x => x.outputs);
  assert.deepEqual(pureMachineOutputs2, expectedOutputs, `Pure API is computing fine with undefined as second parameter after reset.`);

  const pureMachineInternalStateSequence = pureMachineTraces.map(x => x.fsmState);
  // No, we are not going to test the exact content of the internal state. That's nuts hard to maintain. We do PBT.
  // assert.deepEqual(pureMachineInternalStateSequence, [...], `Pure API is computing fine with undefined as second parameter.`);

  const testRunTraces= pureMachineInternalStateSequence.reduce((testSeqAcc, pureMachineInternalState, internalStateIndex )=> {
    // Run the sequence starting at index till the end, gather the results and compare
    // that with original results from the stateful machine
    const outputsSeq = allGoodRoutesSomeBadRoutesAndBack.reduce((acc, input, inputIndex) => {
      // Gotta be careful here that the first internal state of the machine
      // is obtained AFTER running input index 0. So it is input index 1
      // that must run with internal state 0! input index n with internal state n+1
      if (inputIndex < internalStateIndex + 1) return acc

      const {fsmState, outputs} = acc;
      // @ts-ignore
      const {fsmState: newFsmState, outputs: newOutputs} = fsm(input, fsmState);
      return {
        fsmState: newFsmState,
        outputs: outputs.concat([newOutputs])
      }
    },{fsmState: pureMachineInternalState, outputs: []})

    return testSeqAcc.concat(outputsSeq);
  }, []);

  const testRunsOutputs = testRunTraces.map(x => x.outputs);
  // Remember that we are offset by 1
  assert.deepEqual(testRunsOutputs[0], expectedOutputs.slice(1), `Pure API is computing sequences fine when passed stored internal state back as parameter.`);
  // and now by 2
  assert.deepEqual(testRunsOutputs[1], expectedOutputs.slice(2), `Pure API is computing sequences fine when passed stored internal state back as parameter.`);
  // and so on
  // The edge case of the last index of testRunsOutputs works because slice returns [] and the testRunTraces also is [] (no output is run)
  assert.deepEqual(testRunsOutputs, expectedOutputs.map((_, i) => expectedOutputs.slice(i+1)), `Pure API is computing sequences fine when passed stored internal state back as parameter.`);
});
