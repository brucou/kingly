var createStateMachine = require("kingly").createStateMachine;

// Copy-paste help
// For debugging purposes, guards and actions functions should all have a name
// Using natural language sentences for labels in the graph is valid
// guard and action functions name still follow JavaScript rules though
// -----Guards------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns Boolean
 */
// const guards = {
//   "cart url": function (){},
//   "about url": function (){},
//   "home url": function (){},
//   "checkout url": function (){},
//   "unknown url": function (){},
//   "team url": function (){},
//   "slash url": function (){},
//   "unknown about url": function (){},
// };
// -----Actions------
/**
 * @param {E} extendedState
 * @param {D} eventData
 * @param {X} settings
 * @returns {{updates: U[], outputs: O[]}}
 * (such that updateState:: E -> U[] -> E)
 */
// const actions = {
//   "update url": function (){},
//   "initialize state": function (){},
//   "transition prev -&gt; cart": function (){},
//   "transition prev -&gt; about": function (){},
//   "transition prev -&gt; home": function (){},
//   "transition prev -&gt; checkout": function (){},
//   "restore url": function (){},
//   "render cart": function (){},
//   "transition prev -&gt; team": function (){},
//   "transition prev -&gt; about home": function (){},
//   "correct url": function (){},
//   "render checkout": function (){},
//   "render home": function (){},
// };
// ----------------
function contains(as, bs) {
  return as.every(function (a) {
    return bs.indexOf(a) > -1;
  });
}

function chain(arrFns, actions) {
  if (arrFns.length === 0)
    return function NO_ACTION() {
      return { outputs: [], updates: [] };
    };
  if (arrFns.length === 1) return actions[arrFns[0]];
  return function chain_(s, ed, stg) {
    return arrFns.reduce(
      function (acc, fn) {
        var r = actions[fn](s, ed, stg);

        return {
          updates: acc.updates.concat(r.updates),
          outputs: acc.outputs.concat(r.outputs),
        };
      },
      { updates: [], outputs: [] }
    );
  };
}

function every(arrFns, guards) {
  if (arrFns.length === 0)
    return function True() {
      return true;
    };
  if (arrFns.length === 1) return guards[arrFns[0]];
  return function every_(s, ed, stg) {
    return arrFns.reduce(function (acc, fn) {
      var r = guards[fn](s, ed, stg);

      return r && acc;
    }, true);
  };
}

var NO_OUTPUT = [];
var NO_STATE_UPDATE = [];
var events = ["url changed", "back", "navigate"];
var states = {
  Routingღn1: "",
  Startღn2: "",
  "Group 6ღn3": {
    "Aboutღn3::n1": {
      "Routingღn3::n1::n1": "",
      "About detailღn3::n1::n2": { "Indexღn3::n1::n2::n0": "", "Teamღn3::n1::n2::n1": "" },
    },
    "Cartღn3::n2": { "Cartღn3::n2::n0": "" },
    "Homeღn3::n3": { "Homeღn3::n3::n0": "" },
    "Checkoutღn3::n4": { "Checkoutღn3::n4::n0": "" },
  },
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = [
    "update url",
    "initialize state",
    "transition prev -&gt; cart",
    "transition prev -&gt; about",
    "transition prev -&gt; home",
    "transition prev -&gt; checkout",
    "restore url",
    "render cart",
    "transition prev -&gt; team",
    "transition prev -&gt; about home",
    "correct url",
    "render checkout",
    "render home",
  ];
  var predicateList = [
    "cart url",
    "about url",
    "home url",
    "checkout url",
    "unknown url",
    "team url",
    "slash url",
    "unknown about url",
  ];
  if (!contains(actionList, Object.keys(aF))) {
    console.error(
      "Some actions are missing either in the graph, or in the action implementation object! Cf actionFactories (you passed that) vs. actionList (from the graph) below. They must have the same items!"
    );
    console.error({ actionFactories: Object.keys(aF), actionList });
    var passedAndMissingInGraph = Object.keys(aF).filter(function (k) {
      return actionList.indexOf(k) === -1;
    });
    passedAndMissingInGraph.length > 0 &&
      console.error(
        "So the following actions were passed in parameters but do not match any action in the graph! This may happen if you modified the name of an action in the graph, but kept using the older name in the implementation! Please check.",
        passedAndMissingInGraph
      );
    var inGraphButNotImplemented = actionList.filter(function (k) {
      return Object.keys(aF).indexOf(k) === -1;
    });
    inGraphButNotImplemented.length > 0 &&
      console.error(
        "So the following actions declared in the graph are not implemented! Please add the implementation. You can have a look at the comments of the generated fsm file for typing information.",
        inGraphButNotImplemented
      );
    throw new Error(
      "Some actions implementations are missing either in the graph, or in the action implementation object!"
    );
  }
  if (!contains(predicateList, Object.keys(guards))) {
    console.error(
      "Some guards are missing either in the graph, or in the action implementation object! Cf guards (you passed that) vs. predicateList (from the graph) below. They must have the same items!"
    );
    console.error({ guards: Object.keys(guards), predicateList });
    throw new Error("Some guards are missing either in the graph, or in the guard implementation object!");
  }
  const transitions = [
    { from: "Startღn2", event: "url changed", to: "Routingღn1", action: chain(["update url", "initialize state"], aF) },
    { from: "Group 6ღn3", event: "url changed", to: "Routingღn1", action: chain(["update url"], aF) },
    {
      from: "Routingღn1",
      event: "",
      guards: [
        {
          predicate: every(["cart url"], guards),
          to: "Cartღn3::n2",
          action: chain(["transition prev -&gt; cart"], aF),
        },
        {
          predicate: every(["about url"], guards),
          to: "Aboutღn3::n1",
          action: chain(["transition prev -&gt; about"], aF),
        },
        {
          predicate: every(["home url"], guards),
          to: "Homeღn3::n3",
          action: chain(["transition prev -&gt; home"], aF),
        },
        {
          predicate: every(["checkout url"], guards),
          to: "Checkoutღn3::n4",
          action: chain(["transition prev -&gt; checkout"], aF),
        },
        {
          predicate: every(["unknown url"], guards),
          to: { shallow: "Group 6ღn3" },
          action: chain(["restore url"], aF),
        },
      ],
    },
    { from: "nok", event: "init", to: "Startღn2", action: chain([], aF) },
    { from: "Group 6ღn3", event: "back", to: { shallow: "Group 6ღn3" }, action: chain(["restore url"], aF) },
    { from: "Cartღn3::n2", event: "init", to: "Cartღn3::n2::n0", action: chain(["render cart"], aF) },
    { from: "Aboutღn3::n1", event: "init", to: "Routingღn3::n1::n1", action: chain([], aF) },
    {
      from: "Routingღn3::n1::n1",
      event: "",
      guards: [
        {
          predicate: every(["team url"], guards),
          to: "Teamღn3::n1::n2::n1",
          action: chain(["transition prev -&gt; team"], aF),
        },
        {
          predicate: every(["slash url"], guards),
          to: "Indexღn3::n1::n2::n0",
          action: chain(["transition prev -&gt; about home"], aF),
        },
        {
          predicate: every(["unknown about url"], guards),
          to: { shallow: "About detailღn3::n1::n2" },
          action: chain(["correct url"], aF),
        },
      ],
    },
    { from: "Indexღn3::n1::n2::n0", event: "navigate", to: "Teamღn3::n1::n2::n1", action: chain([], aF) },
    { from: "Checkoutღn3::n4", event: "init", to: "Checkoutღn3::n4::n0", action: chain(["render checkout"], aF) },
    { from: "Homeღn3::n3", event: "init", to: "Homeღn3::n3::n0", action: chain(["render home"], aF) },
    { from: "Group 6ღn3", event: "init", to: "Homeღn3::n3", action: chain([], aF) },
    {
      from: "About detailღn3::n1::n2",
      event: "init",
      to: "Indexღn3::n1::n2::n0",
      action: chain(["transition prev -&gt; about home"], aF),
    },
  ];

  return transitions;
}

function createStateMachineFromGraph(fsmDefForCompile, settings) {
  var updateState = fsmDefForCompile.updateState;
  var initialExtendedState = fsmDefForCompile.initialExtendedState;

  var transitions = getKinglyTransitions({
    actionFactories: fsmDefForCompile.actionFactories,
    guards: fsmDefForCompile.guards,
  });

  var fsm = createStateMachine(
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

module.exports = {
  events,
  states,
  getKinglyTransitions,
  createStateMachineFromGraph,
};
