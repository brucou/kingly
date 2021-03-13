import { createStateMachine } from "kingly";

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
//   "can move &amp;&amp; won": function (){},
//   "can move &amp;&amp; !won": function (){},
//   "white piece": function (){},
//   "black piece": function (){},
//   "&gt;0 moves": function (){},
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
//   "update clock": function (){},
//   "cancel timer": function (){},
//   "End game for whites": function (){},
//   "Move white piece": function (){},
//   "Highlight selected white piece": function (){},
//   "End game for blacks": function (){},
//   "Move black piece": function (){},
//   "Highlight selected black piece": function (){},
//   "restart timer": function (){},
//   "Undo": function (){},
//   "reset and start clock": function (){},
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
var events = ["clock ticked", "clock clicked", "click", "Undo"];
var states = {
  "Game overღn0": "",
  Initღn1: "",
  "Game onღn2": {
    "Black turnღn2::n0": { "Black playsღn2::n0::n0": "", "Piece selectedღn2::n0::n1": "" },
    "White turnღn2::n1": { "White playsღn2::n1::n0": "", "Piece selectedღn2::n1::n1": "", "Initღn2::n1::n2": "" },
    "Initღn2::n3": "",
  },
  "Updating clockღn3": "",
  "Paused clockღn4": "",
};
function getKinglyTransitions(record) {
  var aF = record.actionFactories;
  var guards = record.guards;
  var actionList = [
    "update clock",
    "cancel timer",
    "End game for whites",
    "Move white piece",
    "Highlight selected white piece",
    "End game for blacks",
    "Move black piece",
    "Highlight selected black piece",
    "restart timer",
    "Undo",
    "reset and start clock",
  ];
  var predicateList = [
    "can move &amp;&amp; won",
    "can move &amp;&amp; !won",
    "white piece",
    "black piece",
    "&gt;0 moves",
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
    { from: "nok", event: "init", to: "Game onღn2", action: chain([], aF) },
    { from: "Game onღn2", event: "clock ticked", to: "Updating clockღn3", action: chain(["update clock"], aF) },
    { from: "Updating clockღn3", event: "", to: { deep: "Game onღn2" }, action: chain([], aF) },
    { from: "Game onღn2", event: "clock clicked", to: "Paused clockღn4", action: chain(["cancel timer"], aF) },
    {
      from: "Piece selectedღn2::n1::n1",
      event: "click",
      guards: [
        {
          predicate: every(["can move &amp;&amp; won"], guards),
          to: "Game overღn0",
          action: chain(["End game for whites"], aF),
        },
        {
          predicate: every(["can move &amp;&amp; !won"], guards),
          to: "Black playsღn2::n0::n0",
          action: chain(["Move white piece"], aF),
        },
        {
          predicate: every(["white piece"], guards),
          to: "Piece selectedღn2::n1::n1",
          action: chain(["Highlight selected white piece"], aF),
        },
      ],
    },
    {
      from: "Piece selectedღn2::n0::n1",
      event: "click",
      guards: [
        {
          predicate: every(["can move &amp;&amp; won"], guards),
          to: "Game overღn0",
          action: chain(["End game for blacks"], aF),
        },
        {
          predicate: every(["can move &amp;&amp; !won"], guards),
          to: "White playsღn2::n1::n0",
          action: chain(["Move black piece"], aF),
        },
        {
          predicate: every(["black piece"], guards),
          to: "Piece selectedღn2::n0::n1",
          action: chain(["Highlight selected black piece"], aF),
        },
      ],
    },
    {
      from: "Paused clockღn4",
      event: "clock clicked",
      to: { deep: "Game onღn2" },
      action: chain(["restart timer"], aF),
    },
    {
      from: "Black turnღn2::n0",
      event: "Undo",
      guards: [
        { predicate: every(["&gt;0 moves"], guards), to: "White playsღn2::n1::n0", action: chain(["Undo"], aF) },
      ],
    },
    {
      from: "White turnღn2::n1",
      event: "Undo",
      guards: [
        { predicate: every(["&gt;0 moves"], guards), to: "Black playsღn2::n0::n0", action: chain(["Undo"], aF) },
      ],
    },
    { from: "Game onღn2", event: "init", to: "White turnღn2::n1", action: chain(["reset and start clock"], aF) },
    {
      from: "Black playsღn2::n0::n0",
      event: "click",
      guards: [
        {
          predicate: every(["black piece"], guards),
          to: "Piece selectedღn2::n0::n1",
          action: chain(["Highlight selected black piece"], aF),
        },
      ],
    },
    {
      from: "White playsღn2::n1::n0",
      event: "click",
      guards: [
        {
          predicate: every(["white piece"], guards),
          to: "Piece selectedღn2::n1::n1",
          action: chain(["Highlight selected white piece"], aF),
        },
      ],
    },
    { from: "White turnღn2::n1", event: "init", to: "White playsღn2::n1::n0", action: chain([], aF) },
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

export { events, states, getKinglyTransitions, createStateMachineFromGraph };
