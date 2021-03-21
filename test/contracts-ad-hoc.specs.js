import * as QUnit from "qunitjs"
import {fsmContracts, NO_OUTPUT} from "../src"
import {events, fsmFactory, routes} from "./contracts-fsm"

// Cheapest deep equal possible
// Bit beware of caveats of JSON.stringify and the JSON format!
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Remove the NO_OUTPUT from the sequence of actions for comparison
// (NO_OUTPUT is an implementation detail that is not part of the specifications)
// It can occur when the machine traverses transient states and takes a transition without actions
function removeNoOutputs(arr) {
    return arr.filter(x => x !== NO_OUTPUT)
}

function computeCleanedActualOutputs(fsm, inputSeq) {
    return inputSeq.map(fsm).filter(Boolean).map(removeNoOutputs);
}

QUnit.module("Testing home route fsm", {});

const [ROUTE_CHANGED, TAGS_FETCHED_OK, TAGS_FETCHED_NOK, ARTICLES_FETCHED_OK, ARTICLES_FETCHED_NOK] = events;
const {home} = routes;

const HOME_ROUTE_LOADING_SEQ = [
    {[ROUTE_CHANGED]: {hash: home}}
];

const HOME_ROUTE_LOADING_SEQ_COMMANDS = [
    [
        {
            "command": "FETCH_AUTHENTICATION",
            "params": undefined
        }
    ]
];

const fsmMapping = [
    [`Loading `, HOME_ROUTE_LOADING_SEQ, HOME_ROUTE_LOADING_SEQ_COMMANDS],
];

const fsmSettings = {debug: {console, checkContracts: fsmContracts}};
// const fsmSettings = { debug: { console } };

fsmMapping.forEach(([scenario, inputSeq, outputsSeq]) => {
    QUnit.test(`Home route: ${scenario}`, function exec_test(assert) {
        const fsm = fsmFactory(fsmSettings);

        const actualOutputsSeq = computeCleanedActualOutputs(fsm, inputSeq);

        let indexWhenFailed = -1;
        const isTestPassed = inputSeq.every((input, index) => {
            const outputs = actualOutputsSeq[index];
            const expected = outputsSeq[index];
            const isTestPassed = deepEqual(outputs, expected);
            if (!isTestPassed) {
                indexWhenFailed = index
            }

            return isTestPassed
        });

        const errorMessage = `Actual outputs sequence differ from expected outputs sequence at index ${indexWhenFailed}`;
        const okMessage = `Alles gut!`;
        const message = isTestPassed ? okMessage : errorMessage;

        assert.deepEqual(actualOutputsSeq, outputsSeq, message);
    });
});
