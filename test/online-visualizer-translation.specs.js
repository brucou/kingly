import * as QUnit from "qunitjs"
import { ACTION_IDENTITY, INIT_EVENT, INIT_STATE, SHALLOW, DEEP, toDagreVisualizerFormat } from "../src"

const EVENT1 = 'event1';
const EVENT2 = 'event2';
const EVENT3 = 'event3';
const EVENT4 = 'event4';
const EVENT5 = 'event5';
function incCounter(extS, eventData) {
  const { counter } = extS;

  return {
    updates: [{ op: 'add', path: '/counter', value: counter + 1 }],
    outputs: counter
  }
}

function incCounterTwice(extS, eventData) {
  const { counter } = extS;

  return {
    updates: [{ op: 'add', path: '/counter', value: counter + 2 }],
    outputs: counter
  }
}

QUnit.module("Testing conversion from fsm specs to online visualizer format", {});

QUnit.test("History states, entry states, standard states, and all transitions : CD player", function exec_test(assert) {
  function identity() {}

  function fsm_initialize_model() {}

  function open_drawer() {}

  function close_drawer() {}

  function play() {}

  function stop() {}

  function eject() {}

  function go_next_track() {}

  function go_track_1() {}

  function go_previous_track() {}

  function pause_playing_cd() {}

  function resume_paused_cd() {}

  function go_forward_1_s() {}

  function go_backward_1_s() {}

  function create_pause_timer() {}

  function stop_forward_timer() {}

  function stop_backward_timer() {}

  function is_not_cd_in_drawer() {}

  function is_cd_in_drawer() {}

  function is_last_track() {}

  function is_not_last_track() {}

  function is_track_gt_1() {}

  function is_track_eq_1() {}

  function is_not_end_of_cd() {}

  function is_end_of_cd() {}

  const states = {
    no_cd_loaded: {
      cd_drawer_closed: '', cd_drawer_open: '', closing_cd_drawer: ''
    },
    cd_loaded: {
      cd_loaded_group: {
        cd_paused_group: {
          time_and_track_fields_not_blank: '', time_and_track_fields_blank: ''
        },
        cd_playing: '',
        cd_stopped: ''
      },
      stepping_forwards: '',
      stepping_backwards: ''
    }
  };
  const transitions = [
    { from: INIT_STATE, to: "no_cd_loaded", event: INIT_EVENT, action: fsm_initialize_model },
    { from: "no_cd_loaded", to: "cd_drawer_closed", event: INIT_EVENT, action: identity },
    { from: "cd_drawer_closed", to: "cd_drawer_open", event: "EJECT", action: open_drawer },
    { from: "cd_drawer_open", to: "closing_cd_drawer", event: "EJECT", action: close_drawer },
    {
      from: "closing_cd_drawer", guards: [
        { predicate: is_not_cd_in_drawer, to: "cd_drawer_closed", action: identity },
        { predicate: is_cd_in_drawer, to: "cd_loaded", action: identity }
      ]
    },
    { from: "cd_loaded", to: "cd_loaded_group", event: INIT_EVENT, action: identity },
    { from: "cd_playing", to: "cd_paused_group", event: "PAUSE", action: pause_playing_cd },
    { from: "cd_paused_group", to: "cd_playing", event: "PAUSE", action: resume_paused_cd },
    { from: "cd_paused_group", to: "cd_playing", event: "PLAY", action: resume_paused_cd },
    { from: "cd_paused_group", to: "time_and_track_fields_not_blank", event: INIT_EVENT, action: identity },
    {
      from: "time_and_track_fields_not_blank",
      to: "time_and_track_fields_blank",
      event: "TIMER_EXPIRED",
      action: create_pause_timer
    },
    {
      from: "time_and_track_fields_blank",
      to: "time_and_track_fields_not_blank",
      event: "TIMER_EXPIRED",
      action: create_pause_timer
    },
    { from: "cd_paused_group", to: "cd_stopped", event: "STOP", action: stop },
    { from: "cd_stopped", to: "cd_playing", event: "PLAY", action: play },
    { from: "cd_playing", to: "cd_stopped", event: "STOP", action: stop },
    { from: "cd_loaded_group", to: "cd_stopped", event: INIT_EVENT, action: stop },
    {
      from: "cd_loaded_group", event: "NEXT_TRACK", guards: [
        { predicate: is_last_track, to: "cd_stopped", action: stop },
        { predicate: is_not_last_track, to: "history.cd_loaded_group", action: go_next_track }
      ]
    },
    {
      from: "cd_loaded_group", event: "PREVIOUS_TRACK", guards: [
        { predicate: is_track_gt_1, to: "history.cd_loaded_group", action: go_previous_track },
        { predicate: is_track_eq_1, to: "history.cd_loaded_group", action: go_track_1 }
      ]
    },
    { from: "cd_loaded", to: "cd_drawer_open", event: "EJECT", action: eject },
    {
      from: "stepping_forwards", event: "TIMER_EXPIRED", guards: [
        { predicate: is_not_end_of_cd, to: "stepping_forwards", action: go_forward_1_s },
        { predicate: is_end_of_cd, to: "cd_stopped", action: stop }
      ]
    },
    { from: "stepping_forwards", to: "history.cd_loaded_group", event: "FORWARD_UP", action: stop_forward_timer },
    { from: "cd_loaded_group", to: "stepping_forwards", event: "FORWARD_DOWN", action: go_forward_1_s },
    { from: "stepping_backwards", to: "stepping_backwards", event: "TIMER_EXPIRED", action: go_backward_1_s },
    { from: "stepping_backwards", to: "history.cd_loaded_group", event: "REVERSE_UP", action: stop_backward_timer },
    { from: "cd_loaded_group", to: "stepping_backwards", event: "REVERSE_DOWN", action: go_backward_1_s }
  ];

  const fsmDef = {
    states,
    transitions,
  };
  const translation = toDagreVisualizerFormat(fsmDef, {});
  const expectedTranslation = {
    "states": ["nok", [["no_cd_loaded", ["cd_drawer_closed", "cd_drawer_open", "closing_cd_drawer"]], ["cd_loaded", [["cd_loaded_group", [["cd_paused_group", ["time_and_track_fields_not_blank", "time_and_track_fields_blank"]], "cd_playing", "cd_stopped"]], "stepping_forwards", "stepping_backwards"]]]],
    "transitions": [{
      "from": "nok",
      "to": "no_cd_loaded",
      "event": "init",
      "action": "fsm_initialize_model"
    }, {
      "from": "no_cd_loaded",
      "to": "cd_drawer_closed",
      "event": "init",
      "action": "identity"
    }, {
      "from": "cd_drawer_closed",
      "to": "cd_drawer_open",
      "event": "EJECT",
      "action": "open_drawer"
    }, {
      "from": "cd_drawer_open",
      "to": "closing_cd_drawer",
      "event": "EJECT",
      "action": "close_drawer"
    }, {
      "from": "closing_cd_drawer",
      "guards": [{
        "predicate": "is_not_cd_in_drawer",
        "to": "cd_drawer_closed",
        "action": "identity"
      }, { "predicate": "is_cd_in_drawer", "to": "cd_loaded", "action": "identity" }]
    }, {
      "from": "cd_loaded",
      "to": "cd_loaded_group",
      "event": "init",
      "action": "identity"
    }, {
      "from": "cd_playing",
      "to": "cd_paused_group",
      "event": "PAUSE",
      "action": "pause_playing_cd"
    }, {
      "from": "cd_paused_group",
      "to": "cd_playing",
      "event": "PAUSE",
      "action": "resume_paused_cd"
    }, {
      "from": "cd_paused_group",
      "to": "cd_playing",
      "event": "PLAY",
      "action": "resume_paused_cd"
    }, {
      "from": "cd_paused_group",
      "to": "time_and_track_fields_not_blank",
      "event": "init",
      "action": "identity"
    }, {
      "from": "time_and_track_fields_not_blank",
      "to": "time_and_track_fields_blank",
      "event": "TIMER_EXPIRED",
      "action": "create_pause_timer"
    }, {
      "from": "time_and_track_fields_blank",
      "to": "time_and_track_fields_not_blank",
      "event": "TIMER_EXPIRED",
      "action": "create_pause_timer"
    }, { "from": "cd_paused_group", "to": "cd_stopped", "event": "STOP", "action": "stop" }, {
      "from": "cd_stopped",
      "to": "cd_playing",
      "event": "PLAY",
      "action": "play"
    }, { "from": "cd_playing", "to": "cd_stopped", "event": "STOP", "action": "stop" }, {
      "from": "cd_loaded_group",
      "to": "cd_stopped",
      "event": "init",
      "action": "stop"
    }, {
      "from": "cd_loaded_group",
      "event": "NEXT_TRACK",
      "guards": [{
        "predicate": "is_last_track",
        "to": "cd_stopped",
        "action": "stop"
      }, { "predicate": "is_not_last_track", "to": "history.cd_loaded_group", "action": "go_next_track" }]
    }, {
      "from": "cd_loaded_group",
      "event": "PREVIOUS_TRACK",
      "guards": [{
        "predicate": "is_track_gt_1",
        "to": "history.cd_loaded_group",
        "action": "go_previous_track"
      }, { "predicate": "is_track_eq_1", "to": "history.cd_loaded_group", "action": "go_track_1" }]
    }, {
      "from": "cd_loaded",
      "to": "cd_drawer_open",
      "event": "EJECT",
      "action": "eject"
    }, {
      "from": "stepping_forwards",
      "event": "TIMER_EXPIRED",
      "guards": [{
        "predicate": "is_not_end_of_cd",
        "to": "stepping_forwards",
        "action": "go_forward_1_s"
      }, { "predicate": "is_end_of_cd", "to": "cd_stopped", "action": "stop" }]
    }, {
      "from": "stepping_forwards",
      "to": "history.cd_loaded_group",
      "event": "FORWARD_UP",
      "action": "stop_forward_timer"
    }, {
      "from": "cd_loaded_group",
      "to": "stepping_forwards",
      "event": "FORWARD_DOWN",
      "action": "go_forward_1_s"
    }, {
      "from": "stepping_backwards",
      "to": "stepping_backwards",
      "event": "TIMER_EXPIRED",
      "action": "go_backward_1_s"
    }, {
      "from": "stepping_backwards",
      "to": "history.cd_loaded_group",
      "event": "REVERSE_UP",
      "action": "stop_backward_timer"
    }, {
      "from": "cd_loaded_group",
      "to": "stepping_backwards",
      "event": "REVERSE_DOWN",
      "action": "go_backward_1_s"
    }]
  };

  assert.deepEqual(JSON.parse(translation), expectedTranslation, `works`);
});

QUnit.test("test shallow history transitions, INIT event CASCADING transitions", function exec_test(assert) {
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
    initialExtendedState: { history: SHALLOW, counter: 0 },
    transitions: [
      { from: INIT_STATE, event: INIT_EVENT, to: OUTER, action: ACTION_IDENTITY },
      { from: OUTER, event: INIT_EVENT, to: OUTER_A, action: ACTION_IDENTITY },
      { from: OUTER_A, event: EVENT1, to: INNER, action: ACTION_IDENTITY },
      { from: INNER, event: INIT_EVENT, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER_S, event: EVENT3, to: INNER_T, action: ACTION_IDENTITY },
      { from: INNER_T, event: EVENT3, to: INNER_S, action: ACTION_IDENTITY },
      { from: INNER, event: EVENT2, to: OUTER_B, action: ACTION_IDENTITY },
      { from: OUTER, event: EVENT5, to: Z, action: ACTION_IDENTITY },
      {
        from: Z, event: EVENT4, guards: [
          {
            predicate: function isDeep(x, e) {return x.history === DEEP},
            to: [OUTER, 'H*'].join('.'),
            action: incCounter
          },
          {
            predicate: function isShallow(x, e) {return x.history !== DEEP},
            to: [OUTER, 'H'].join('.'),
            action: incCounter
          }
        ]
      },
    ],
  };
  const translation = toDagreVisualizerFormat(fsmDef, {});
  // NOTE : Wll not work in the visualizer because the history states are not declared or preocessed (03/09/2018)
  const expectedTranslation = {
    "states": [
      "nok",
      [
        [
          "OUTER",
          [
            [
              "INNER",
              [
                "inner_s",
                "inner_t"
              ]
            ],
            "outer_a",
            "outer_b"
          ]
        ],
        "z"
      ]
    ],
    "transitions": [
      {
        "action": "ACTION_IDENTITY",
        "event": "init",
        "from": "nok",
        "to": "OUTER"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "init",
        "from": "OUTER",
        "to": "outer_a"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "event1",
        "from": "outer_a",
        "to": "INNER"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "init",
        "from": "INNER",
        "to": "inner_s"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "event3",
        "from": "inner_s",
        "to": "inner_t"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "event3",
        "from": "inner_t",
        "to": "inner_s"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "event2",
        "from": "INNER",
        "to": "outer_b"
      },
      {
        "action": "ACTION_IDENTITY",
        "event": "event5",
        "from": "OUTER",
        "to": "z"
      },
      {
        "event": "event4",
        "from": "z",
        "guards": [
          {
            "action": "incCounter",
            "predicate": "isDeep",
            "to": "OUTER.H*"
          },
          {
            "action": "incCounter",
            "predicate": "isShallow",
            "to": "OUTER.H"
          }
        ]
      }
    ]
  };

  assert.deepEqual(JSON.parse(translation), expectedTranslation, `works`);
});


