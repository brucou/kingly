import { ACTION_IDENTITY, create_state_machine, INIT_EVENT, INIT_STATE, traceFSM } from "../src"
import { formatResult } from "./helpers"
import * as QUnit from "qunitjs"
import * as Rx from "rx"
import { F, T } from "ramda"

const $ = Rx.Observable;

const default_settings = {
  subject_factory: () => {
    const subject = new Rx.Subject();
    // NOTE : this is intended for Rxjs v4-5!! but should work for most also
    subject.emit = subject.next || subject.onNext;
    return subject
  },
  merge: function merge(arrayObs) {return $.merge(...arrayObs)},
  of: $.of,
};
const FALSE_GUARD = function always_false(action, state) {return [{ predicate: F, to: state, action }]};
const TRUE_GUARD = function always_true(to, action) { return [{ predicate: T, to, action }]};

function setBdata(extendedState, eventData) {
  return {
    model_update: [
      { op: 'add', path: '/b', value: eventData }
    ]
  }
}

function setCinvalidData(extendedState, eventData) {
  return {
    model_update: [
      { op: 'add', path: '/c', value: { error: eventData.error, data: eventData.data } },
      { op: 'add', path: '/switch', value: false },
    ]
  }
}

function setCvalidData(extendedState, eventData) {
  return {
    model_update: [
      { op: 'add', path: '/c', value: { error: null, data: eventData.data } },
      { op: 'add', path: '/switch', value: true },
    ]
  }
}

function setReviewed(extendedState, eventData) {
  return {
    model_update: [
      { op: 'add', path: '/reviewed', value: true },
    ]
  }
}

function setReviewedAndOuput(extendedState, eventData) {
  return {
    model_update: [
      { op: 'add', path: '/reviewed', value: true },
    ],
    output: extendedState
  }
}

const dummyB = { keyB: 'valueB' };
const dummyCv = { valid: true, data: 'valueC' };
const dummyCi = { valid: false, data: 'invalid key for C' };

QUnit.module("Testing hierarchy features", {});

QUnit.test("INIT event multi transitions, self-loop, 1-loop, 2-loops, conditions, inner INIT event transitions", function exec_test(assert) {
  const CLICK = 'click';
  const REVIEW_A = 'reviewA';
  const REVIEW_B = 'reviewB';
  const SAVE = 'save';
  const fsmDef = {
    states: { A: '', B: '', C: '', OUTER_GROUP_D: { INNER_GROUP_D: { D: '' }}, E: '' },
    events: [CLICK, REVIEW_A, REVIEW_B, SAVE],
    initial_extended_state: { switch: false, reviewed: false },
    transitions: [
      // TODO : check if the actions are located where they should? Can I have actions on a group state?? not if I
      // have outputs THINK, maybe allow to aggregate outputs on the path, just like extended state is, but then
      // output can also be an array of outputs, can be annoying on the receiving end
      {
        from: INIT_STATE, event: INIT_EVENT, guards: [
          { predicate: function isSwitchOn(x, e) {return x.switch}, to: 'A', action: ACTION_IDENTITY },
          { predicate: function isSwitchOff(x, e) {return !x.switch}, to: 'B', action: ACTION_IDENTITY }
        ]
      },
      {
        from: 'A', event: CLICK, guards: [
          { predicate: function isReviewed(x, e) {return x.reviewed}, to: 'OUTER_GROUP_D', action: ACTION_IDENTITY },
          { predicate: function isNotReviewed(x, e) {return !x.reviewed}, to: 'B', action: ACTION_IDENTITY }
        ]
      },
      { from: 'B', event: CLICK, to: 'C', action: setBdata },
      {
        from: 'C', event: CLICK, guards: [
          { predicate: function isValid(x, e) {return e.valid}, to: 'INNER_GROUP_D', action: setCvalidData },
          { predicate: function isNotValid(x, e) {return !e.valid}, to: 'C', action: setCinvalidData }
        ]
      },
      { from: 'D', event: REVIEW_A, to: 'A', action: setReviewed },
      { from: 'D', event: REVIEW_B, to: 'B', action: ACTION_IDENTITY },
      { from: 'D', event: SAVE, to: 'E', action: setReviewedAndOuput },
      { from: 'OUTER_GROUP_D', event: INIT_EVENT, to: 'INNER_GROUP_D', action: ACTION_IDENTITY },
      { from: 'INNER_GROUP_D', event: INIT_EVENT, to: 'D', action: ACTION_IDENTITY },
    ],
  };
  const settings = default_settings;
  const inputSequence = [
    { "init": null },
    { "click": { "keyB": "valueB" } },
    { "click": { "valid": true, "data": "valueC" } }
  ];
  const fsm = create_state_machine(traceFSM({}, fsmDef), settings);
  const outputSequence = inputSequence.map(fsm.yield);
  const formattedResults = outputSequence.map(formatResult);
  assert.deepEqual(formattedResults, [
    {
      "actionFactory": "ACTION_IDENTITY",
      "controlState": "nok",
      "event": {
        "eventData": null,
        "eventLabel": "init"
      },
      "extendedState": {
        "reviewed": false,
        "switch": false
      },
      "guardIndex": 1,
      "model_update": [],
      "newExtendedState": {
        "reviewed": false,
        "switch": false
      },
      "output": null,
      "predicate": "isSwitchOff",
      settings: formatResult(settings),
      "targetControlState": "B",
      "transitionIndex": 0
    },
    {
      "actionFactory": "setBdata",
      "controlState": "B",
      "event": {
        "eventData": {
          "keyB": "valueB"
        },
        "eventLabel": "click"
      },
      "extendedState": {
        "reviewed": false,
        "switch": false
      },
      "guardIndex": 0,
      "model_update": [
        {
          "op": "add",
          "path": "/b",
          "value": {
            "keyB": "valueB"
          }
        }
      ],
      "newExtendedState": {
        "b": {
          "keyB": "valueB"
        },
        "reviewed": false,
        "switch": false
      },
      "output": undefined,
      "predicate": undefined,
      settings: formatResult(settings),
      "targetControlState": "C",
      "transitionIndex": 2
    },
    {
      "actionFactory": "ACTION_IDENTITY",
      "controlState": "INNER_GROUP_D",
      "event": {
        "eventData": {
          "data": "valueC",
          "valid": true
        },
        "eventLabel": "init"
      },
      "extendedState": {
        "b": {
          "keyB": "valueB"
        },
        "c": {
          "data": "valueC",
          "error": null
        },
        "reviewed": false,
        "switch": true
      },
      "guardIndex": 0,
      "model_update": [],
      "newExtendedState": {
        "b": {
          "keyB": "valueB"
        },
        "c": {
          "data": "valueC",
          "error": null
        },
        "reviewed": false,
        "switch": true
      },
      "output": null,
      "predicate": undefined,
      settings: formatResult(settings),
      "targetControlState": "D",
      "transitionIndex": 8
    }
  ], `Cascading init transitions are correctly taken`);
});
