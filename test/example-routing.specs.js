import { createStateMachineFromGraph } from "./graphs/routing_machine_v2.graphml.fsm"
import { tracer } from "../devtool"
import { fsmContracts } from "../src/contracts"
import * as QUnit from "qunitjs"

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
// Basically {a, b: {c, d}}, [{b:{e}]} -> {a, b:{e}}
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

QUnit.module("Testing createStateMachine(fsmDef, settings) with examples", {});

/**
 * This test provides examples of (cf. test strategy.md for the test space breakdown):
 - shallow history state for compound state with several sub-compound states
 - shallow history state for compound state with no sub-compound states
 - those two cases implies different calculation for the shallow history so we increase test coverage again with this, but pick well the sequence of events!!! so H is confirmed different from H*
 - eventless x compound x >1 predicates
 - eventless x atomic x >1 predicates
 - compound x eventless x >1 predicates
 - eventless x history state x >1 predicates
 - compound x event x history state x 0 predicates
 */

QUnit.test("Nested routing - miscellaneous route changes - testing history in several nested levels", function exec_test(assert) {
  const fsm = createStateMachineFromGraph({
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

  const outputs = allGoodRoutesSomeBadRoutesAndBack.map(fsm);
  assert.deepEqual(outputs, [
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
  ], `Routing machine correctly executed`)
});
