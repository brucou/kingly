import * as QUnit from "qunitjs"
import {
  ACTION_IDENTITY, createStateMachine, INIT_EVENT, INIT_STATE
} from "../src"
import {applyJSONpatch} from "./helpers"
import {fsmContracts} from "../src/contracts"
import { KinglyError } from "../src/helpers"

const default_settings = {};
const debug_settings = Object.assign({}, default_settings, {
  debug: {
    checkContracts: fsmContracts,
    console
  }
});

const errorString = `An error occurred`;
const invalidAction = {};
const throwingAction = function () {
  throw errorString
};
const factoryReturningInvalidAction = function () {
  return invalidAction
};
const invalidReturningPredicate = () => {
}
const throwingPredicate = () => {
  throw errorString
}

QUnit.module("Testing error capture in user-provided functions", {});

QUnit.test("Transition action factory error - throws", function exec_test(assert) {
  const fsmDef = {
    states: {A: {C: ''}, B: ''},
    events: ['ev'],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'C', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'C', to: 'B', event: 'ev', action: throwingAction},
    ],
    initialExtendedState: {},
    updateState: applyJSONpatch,
  };

  const fsm = createStateMachine(fsmDef, debug_settings);
  assert.ok(
    fsm({ev: void 0}) instanceof KinglyError,
    `No throwing, a KinglyError object is returned`
  );
});

QUnit.test("Transition action factory error - returns invalid action", function exec_test(assert) {
  const fsmDef = {
    states: {A: {C: ''}, B: ''},
    events: ['ev'],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'C', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'C', to: 'B', event: 'ev', action: factoryReturningInvalidAction},
    ],
    initialExtendedState: {},
    updateState: applyJSONpatch,
  };

  const fsm = createStateMachine(fsmDef, debug_settings);
  assert.ok(fsm({ev: void 0}) instanceof KinglyError, `KinglyError thrown`);
});

QUnit.test("Guard error - throws", function exec_test(assert) {
  const fsmDef = {
    states: {A: {C: ''}, B: ''},
    events: ['ev'],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'C', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'C', event: 'ev', guards: [{predicate: throwingPredicate, to: 'B', action: ACTION_IDENTITY}]},
    ],
    initialExtendedState: {},
    updateState: applyJSONpatch,
  };

  const fsm = createStateMachine(fsmDef, debug_settings);

  assert.ok(fsm({ev: void 0}) instanceof KinglyError, `KinglyError thrown`);
});

QUnit.test("Guard error - returns non boolean", function exec_test(assert) {
  const fsmDef = {
    states: {A: {C: ''}, B: ''},
    events: ['ev'],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'C', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'C', event: 'ev', guards: [{predicate: invalidReturningPredicate, to: 'B', action: ACTION_IDENTITY}]},
    ],
    initialExtendedState: {},
    updateState: applyJSONpatch,
  };

  const fsm = createStateMachine(fsmDef, debug_settings);

  assert.ok(fsm({ev: void 0}) instanceof KinglyError, `KinglyError thrown`);
});

QUnit.test("Update state function error - throws", function exec_test(assert) {
  const fsmDef = {
    states: {A: {C: ''}, B: ''},
    events: ['ev'],
    transitions: [
      {from: INIT_STATE, to: 'A', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'A', to: 'C', event: INIT_EVENT, action: ACTION_IDENTITY},
      {from: 'C', event: 'ev', guards: [{predicate: throwingPredicate, to: 'B', action: ACTION_IDENTITY}]},
    ],
    initialExtendedState: {},
    updateState: function throwingUpdateState() {
      throw errorString
    },
  };
  const fsm = createStateMachine(fsmDef, debug_settings);
  console.info(`fsm`,fsm)
  assert.ok(fsm instanceof KinglyError, `KinglyError thrown`);
});
