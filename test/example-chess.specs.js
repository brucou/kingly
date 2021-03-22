import { Chess } from "chess.js";
import { createStateMachineFromGraph } from "./graphs/chess_game_with_hierarchy_with_undo_and_timer_highlighted_with_init.graphml.fsm"
import { tracer } from "../devtool"
import { fsmContracts } from "../src/contracts"
import * as QUnit from "qunitjs"

function makeTracedOutputs(actionName, extS, evD, stg, commands) {
  return [
    {
      [actionName]: {
        eventData: evD,
        extendedState: extS,
        settings: Object.keys(stg),
        commands
      }
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

// Constants
const IS_WHITE_TURN = 'w';
const IS_BLACK_TURN = 'b';
const INITIAL_WHITE_PIECES_POS = [
  "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
  "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
];
const INITIAL_BLACK_PIECES_POS = [
  "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
  "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8",
];

// Event monikers
const START = "START";
const BOARD_CLICKED = "click";
const UNDO = "UNDO";
const UNDO_MOVE = "UNDO_MOVE";
const TICK = "clock ticked";
const CLOCK_CLICKED = "clock clicked";

// Commands
const MOVE_PIECE = "MOVE_PIECE";
const SET_TIMER = "SET_TIMER";
const CANCEL_TIMER = "CANCEL_TIMER";

// State update
// Basically {a, b: {c, d}}, [{b:{e}]} -> {a, b:{e}}
// All Object.assign caveats apply
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function updateState(extendedState, extendedStateUpdates) {
  const extendedStateCopy = Object.assign({}, extendedState);
  return extendedStateUpdates.reduce((acc, x) => Object.assign(acc, x), extendedStateCopy);
}

// Guards
function isWhitePieceClicked(extendedState, eventData) {
  const { whitePiecesPos } = extendedState;
  const square = eventData;

  return whitePiecesPos.indexOf(square) > -1
}

function isBlackPieceClicked(extendedState, eventData) {
  const { blackPiecesPos } = extendedState;
  const square = eventData;

  return blackPiecesPos.indexOf(square) > -1
}

function isLegalNonWinningMove(extendedState, eventData, settings) {
  const { chessEngine } = settings;
  const { pieceSquare } = extendedState;
  const square = eventData;

  const move = chessEngine.move({
    from: pieceSquare,
    to: square,
    promotion: "q" // always promote to a queen for example simplicity
  });
  const isLegalMove = move != null;
  const hasWon = chessEngine.game_over();
  isLegalMove && chessEngine.undo();

  return isLegalMove && !hasWon
}

function isLegalWinningMove(extendedState, eventData, settings) {
  const { chessEngine } = settings;
  const { pieceSquare } = extendedState;
  const square = eventData;

  const move = chessEngine.move({
    from: pieceSquare,
    to: square,
    promotion: "q" // always promote to a queen for example simplicity
  });
  const isLegalMove = move != null;
  const hasWon = chessEngine.game_over();
  // undo the effect! We may run this again in the next guard
  // Anyways no effect in guards please!!
  isLegalMove && chessEngine.undo();

  return isLegalMove && hasWon
}

function isMoveHistoryNotEmpty(extendedState, eventData, settings) {
  const { whitePiecesPos } = extendedState;
  const isInitialPosition = INITIAL_WHITE_PIECES_POS.every(pos => whitePiecesPos.indexOf(pos) > -1);

  return !isInitialPosition
}

function moveWhitePiece(extS, evD, stg) {
  const { pieceSquare: fromSquare, whitePiecesPos: wPP, blackPiecesPos: bPP, status, } = extS;
  const { chessEngine } = stg;
  const square = evD;
  const squareStyles = '';
  // remove old white piece position and add new one
  const whitePiecesPos = wPP.filter(x => x !== fromSquare).concat([square]);
  // remove old black piece position if any - case when a white piece gobbles a black one
  const blackPiecesPos = bPP.filter(x => x !== square);

  // Use the chess engine to get the Forsyth–Edwards Notation (`fen`)
  chessEngine.move({ from: fromSquare, to: square, promotion: "q" });
  const position = chessEngine.fen();
  // We don't undo in the test
  // chessEngine.undo();

  // As the move is over, reset the piece
  const pieceSquare = "";
  const turn = IS_BLACK_TURN;

  return {
    outputs: makeTracedOutputs('Move white piece', extS, evD, stg, [{
      command: MOVE_PIECE,
      params: { from: fromSquare, to: square }
    }
    ]),
    updates: [
      { pieceSquare },
      { position },
      { squareStyles },
      { whitePiecesPos },
      { blackPiecesPos },
      { turn },
    ]
  }

}

function moveBlackPiece(extS, evD, stg) {
  const { pieceSquare: fromSquare, whitePiecesPos: wPP, blackPiecesPos: bPP, status } = extS;
  const { chessEngine } = stg;
  const square = evD;
  const squareStyles = '';
  // remove old black piece position and add new one
  const blackPiecesPos = bPP.filter(x => x !== fromSquare).concat([square]);
  // remove old white piece position if any - case when a black piece gobbles a white one
  const whitePiecesPos = wPP.filter(x => x !== square);

  // Use the chess engine to get the Forsyth–Edwards Notation (`fen`)
  chessEngine.move({ from: fromSquare, to: square, promotion: "q" });
  const position = chessEngine.fen();
  // We are moving the piece for real!!
  // chessEngine.undo();

  const pieceSquare = "";
  const turn = IS_WHITE_TURN;

  return {
    outputs: makeTracedOutputs('Move black piece', extS, evD, stg, [{
      command: MOVE_PIECE,
      params: { from: fromSquare, to: square }
    }]),
    updates: [
      { pieceSquare },
      { position },
      { squareStyles },
      { whitePiecesPos },
      { blackPiecesPos },
      { turn },
    ],
  }
}

const guards = {
  "can move &amp;&amp; won": isLegalWinningMove,
  "can move &amp;&amp; !won": isLegalNonWinningMove,
  "white piece": isWhitePieceClicked,
  "black piece": isBlackPieceClicked,
  "&gt;0 moves": isMoveHistoryNotEmpty,
};
const actionFactories = {
  "update clock": function updateAndDisplayClock(extS, evD, stg) {
    const { gameDuration } = extS;

    return {
      outputs: makeTracedOutputs('update clock', extS, evD, stg, [{
        command: SET_TIMER,
        params: 1000
      }]),
      updates: [
        { gameDuration: gameDuration + 1 }
      ],
    }
  },
  "cancel timer": function pauseClock(extS, evD, stg) {
    return {
      outputs: makeTracedOutputs('cancel timer', extS, evD, stg, [{
        // Concurrency is a bitch. Once we start playing with timers, we have to make sure
        // we de-activate them in a timely manner
        command: CANCEL_TIMER,
        params: void 0
      }
      ]),
      updates: [],
    }
  },
  "restart timer": function resumeClock(extS, evD, stg) {
    return {
      outputs: makeTracedOutputs('restart timer', extS, evD, stg, [
        {
          command: SET_TIMER,
          params: 1000
        }
      ]),
      updates: [],
    }
  },
  "reset and start clock": function resetAndStartTimer(extS, evD, stg) {
    return {
      outputs: makeTracedOutputs('reset and start clock', extS, evD, stg, [{
        command: SET_TIMER,
        params: 1000
      }]),
      updates: []
    }
  },
  "Move white piece": moveWhitePiece,
  "Move black piece": moveBlackPiece,
  "Undo": function undoMove(extS, evD, stg) {
    // chessEngine.ascii() output
// 0: "   +------------------------+"
// 1: " 8 | r  n  b  q  k  b  n  r |"
// 2: " 7 | p  p  p  p  p  p  p  p |"
// 3: " 6 | .  .  .  .  .  .  .  . |"
// 4: " 5 | .  .  .  .  .  .  .  . |"
// 5: " 4 | .  .  .  .  .  .  .  . |"
// 6: " 3 | .  .  .  .  .  .  .  . |"
// 7: " 2 | P  P  P  P  P  P  P  P |"
// 8: " 1 | R  N  B  Q  K  B  N  R |"
// 9: "   +------------------------+"
// 10: "     a  b  c  d  e  f  g  h"
// 11: ""
    const { chessEngine } = stg;
    const { turn: oldTurn } = extS;

    // Get the last move, undo it, get the fen position, redo the move
    // so any effects performed on the chess engine is cancelled

    const { from, to } = chessEngine.undo();
    const position = chessEngine.fen();

    const rowLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const columnDigits = [8, 7, 6, 5, 4, 3, 2, 1];
    const board = chessEngine.ascii().split('\n').splice(1, 8).map(
      row => row.replace(/\s/g, '').split('').splice(2, 8).join('')
    );
    const { whitePiecesPos, blackPiecesPos } = board.reduce((acc, row, rowIndex) => {
      const { whitePiecesPos, blackPiecesPos } = acc;
      const blackRow = row.split('').map((c, index) => {
        return (c < 'z' && c > 'a')
          ? rowLetters[index] + columnDigits[rowIndex]
          : ''
      });
      const whiteRow = row.split('').map((c, index) => {
        return (c < 'Z' && c > 'A')
          ? rowLetters[index] + columnDigits[rowIndex]
          : ''
      });

      return {
        whitePiecesPos: whitePiecesPos.concat(whiteRow.filter(x => x)),
        blackPiecesPos: blackPiecesPos.concat(blackRow.filter(x => x))
      }
    }, { whitePiecesPos: [], blackPiecesPos: [] });

    // We don't undo the undo, there is no command handler in this test to redo undo
    // chessEngine.move({ from, to });

    const turn = oldTurn === IS_WHITE_TURN ? IS_BLACK_TURN : IS_WHITE_TURN;

    return {
      outputs: makeTracedOutputs('Undo', extS, evD, stg),
      updates: [
        { whitePiecesPos },
        { blackPiecesPos },
        { position },
        { status: '' },
        { turn },
        {
          command: UNDO_MOVE,
          params: void 0
        },
      ]
    }
  },
  "Highlight selected white piece": function highlightWhiteSelectedPiece(extS, evD, stg) {
    const square = evD;

    return {
      updates: [
        { pieceSquare: square },
      ],
      outputs: makeTracedOutputs(`Highlight selected white piece (${evD})`, extS, evD, stg, []),
    }
  },
  "Highlight selected black piece": function highlightBlackSelectedPiece(extS, evD, stg) {
    const square = evD;

    return {
      updates: [
        { pieceSquare: square },
      ],
      outputs: makeTracedOutputs('Highlight selected black piece', extS, evD, stg, []),
    }
  },
  "End game for blacks": function endBlackGame(extendedState, eventData, settings) {
    const { updates, outputs: o } = moveBlackPiece(extendedState, eventData, settings);

    const status = "Black wins!";

    return {
      updates,
      outputs: [Object.assign({}, o[0], { status })]
    }
  },
  "End game for whites": function endWhiteGame(extendedState, eventData, settings) {
    const { updates, outputs: o } = moveWhitePiece(extendedState, eventData, settings);

    const status = "White wins!";

    return {
      updates,
      outputs: [Object.assign({}, o[0], { status })]
    }
  },
};

const initialExtendedState = {
  // Initial positions of the black and white pieces
  position: 'start',
  whitePiecesPos: INITIAL_WHITE_PIECES_POS,
  blackPiecesPos: INITIAL_BLACK_PIECES_POS,
  // square with the currently clicked piece
  pieceSquare: "",
  // Visual clues
  status: "",
  turn: IS_WHITE_TURN,
  gameDuration: 0
};

QUnit.module("Testing createStateMachine(fsmDef, settings) with examples", {});

/**
 * Besides testing that actions are passed the right arguments, that the extended state updates are correctly peformed,
 * and the machine semantics respected, this test provides examples of (cf. test strategy.md for the test space
 * breakdown):
 - compound initial control state
 - atomic state x event x 1 predicate x atomic x action
 - atomic state x event x 1 predicate x atomic x  no action
 - atomic state x eventless x 0 predicate x deep history x  no action
 - atomic state x event x 0 predicate x deep history x  action
 - deep history here great because H is different from H*! so we can check that too
 - compound state x event x 0 predicate x atomic x action
 - compound state x event x 1 predicate x atomic x action
 - compound state x init event x 0 predicate x compound state x action
 - compound state x init event x 0 predicate x atomic state x 0 action
 */

QUnit.test("Chess game - short chess game ending in mate, including illegal moves", function exec_test(assert) {
  const chessEngine = new Chess();
  const settings = {
    debug: { console, checkContracts: null },   // Injecting necessary dependencies
    eventEmitter: { next: () => {} },
    chessEngine
  }

  const fsm = createStateMachineFromGraph({
    updateState,
    initialExtendedState,
    actionFactories,
    guards
  }, settings);

  // The test sequence can be found in this article::
  // https://www.infoq.com/articles/functional-ui-stream-based-approach/
  const shortChessGameWithWrongMoves = [
    [{ [BOARD_CLICKED]: "a3" },
      // click a3	none (empty square)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "a8" },
      // click a8	none (black piece)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "g2" },
      // click g2	highlight g2
      [
        {
          "Highlight selected white piece (g2)": {
            "commands": [],
            "eventData": "g2",
            "extendedState": {
              "blackPiecesPos": INITIAL_BLACK_PIECES_POS,
              "gameDuration": 0,
              "pieceSquare": "",
              "position": "start",
              "status": "",
              "turn": "w",
              "whitePiecesPos": INITIAL_WHITE_PIECES_POS
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "g5" },
      // click g5	none (invalid move)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "g4" },
      // click g4	move piece g2-g4, render new position
      [
        {
          "Move white piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "g2",
                  "to": "g4"
                }
              }
            ],
            "eventData": "g4",
            "extendedState": {
              "blackPiecesPos": INITIAL_BLACK_PIECES_POS,
              "gameDuration": 0,
              "pieceSquare": "g2",
              "position": "start",
              "status": "",
              "turn": "w",
              "whitePiecesPos": INITIAL_WHITE_PIECES_POS
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "e6" },
      // click e6	highlight e6
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "e7" },
      // click e7	highlight e7
      [
        {
          "Highlight selected black piece": {
            "commands": [],
            "eventData": "e7",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "e7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8"
              ],
              "gameDuration": 0,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "e4" },
      // click e4	none (invalid move)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "e5" },
      // click e5	move piece e7-e5, render new position
      [
        {
          "Move black piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "e7",
                  "to": "e5"
                }
              }
            ],
            "eventData": "e5",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "e7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8"
              ],
              "gameDuration": 0,
              "pieceSquare": "e7",
              "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "f2" },
      // click f2	highlight f2
      [
        {
          "Highlight selected white piece (f2)": {
            "commands": [],
            "eventData": "f2",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 0,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/6P1/8/PPPPPP1P/RNBQKBNR w KQkq e6 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "w",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "f4" },
      // click f4	move piece f2-f4, render new position
      [
        {
          "Move white piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "f2",
                  "to": "f4"
                }
              }
            ],
            "eventData": "f4",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 0,
              "pieceSquare": "f2",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/6P1/8/PPPPPP1P/RNBQKBNR w KQkq e6 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "w",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "d8" },
      // click d8	highlight f2
      [
        {
          "Highlight selected black piece": {
            "commands": [],
            "eventData": "d8",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 0,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq f3 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "h2",
                "g4",
                "f4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "h4" },
      // click h4	move piece d8-h4, render new position
      [
        {
          "Move black piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "d8",
                  "to": "h4"
                }
              }
            ],
            "eventData": "h4",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 0,
              "pieceSquare": "d8",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq f3 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "h2",
                "g4",
                "f4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          },
          "status": "Black wins!"
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "a2" },
      // click a2	none (game is over)
      null,
    ],
    [{ [BOARD_CLICKED]: "h2" },
      // click h2	none (game is over)
      null,
    ],
    [{ [BOARD_CLICKED]: "e6" },
      // click e6	none (game is over)
      null
    ],
  ];

  const outputs = shortChessGameWithWrongMoves
    .map(inputOutputMap => inputOutputMap[0])
    .map(fsm);
  const expectedOutputs = shortChessGameWithWrongMoves
    .map(inputOutputMap => inputOutputMap[1]);
  assert.deepEqual(outputs, expectedOutputs, `This short chess game is successfully concluded with a checkmate.`)
});

QUnit.test("Chess game - testing clock and deep history state", function exec_test(assert) {
  const chessEngine = new Chess();
  const settings = {
    debug: { console, checkContracts: null },   // Injecting necessary dependencies
    eventEmitter: { next: () => {} },
    chessEngine
  }

  const fsm = createStateMachineFromGraph({
    updateState,
    initialExtendedState,
    actionFactories,
    guards
  }, settings);

  // The test sequence can be found in this article::
  // https://www.infoq.com/articles/functional-ui-stream-based-approach/
  const shortChessGameWithWrongMoves = [
    [{ [CLOCK_CLICKED]: void 0 }, [
      // Cancels the clcok timer and suspends the game
      {
      "cancel timer": {
        "commands": [
          {
            "command": CANCEL_TIMER,
            "params": void 0
          }
        ],
        "eventData": void 0,
        "extendedState": initialExtendedState,
        "settings": ["debug", "eventEmitter", "chessEngine"]
      }
    }
    ]],
    [{ [TICK]: void 0 },
      // No event handler for the TICK event when the clock (game) is paused
      null
    ],
    [{ [BOARD_CLICKED]: "g2" },
      // nothing happens - the game is suspended
      null],
    [{ [CLOCK_CLICKED]: void 0 }, [
      // Resumes the clock timer and the game
      {
        "restart timer": {
          "commands": [
            {
              "command": SET_TIMER,
              "params": 1000
            }
          ],
          "eventData": void 0,
          "extendedState": initialExtendedState,
          "settings": ["debug", "eventEmitter", "chessEngine"]
        }
      }
    ]],
    [{ [BOARD_CLICKED]: "a3" },
      // click a3	none (empty square)
      [
        null
      ],
    ],
    [{ [TICK]: void 0 },[
      // Resumes the clock timer and the game
      {
        "update clock": {
          "commands": [
            {
              "command": SET_TIMER,
              "params": 1000
            }
          ],
          "eventData": void 0,
          "extendedState": initialExtendedState,
          "settings": ["debug", "eventEmitter", "chessEngine"]
        }
      }
    ]],
    [{ [BOARD_CLICKED]: "a8" },
      // click a8	none (black piece)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "g2" },
      // click g2	highlight g2
      [
        {
          "Highlight selected white piece (g2)": {
            "commands": [],
            "eventData": "g2",
            "extendedState": {
              "blackPiecesPos": INITIAL_BLACK_PIECES_POS,
              "gameDuration": 1,
              "pieceSquare": "",
              "position": "start",
              "status": "",
              "turn": "w",
              "whitePiecesPos": INITIAL_WHITE_PIECES_POS
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "g5" },
      // click g5	none (invalid move)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "g4" },
      // click g4	move piece g2-g4, render new position
      [
        {
          "Move white piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "g2",
                  "to": "g4"
                }
              }
            ],
            "eventData": "g4",
            "extendedState": {
              "blackPiecesPos": INITIAL_BLACK_PIECES_POS,
              "gameDuration": 1,
              "pieceSquare": "g2",
              "position": "start",
              "status": "",
              "turn": "w",
              "whitePiecesPos": INITIAL_WHITE_PIECES_POS
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "e6" },
      // click e6	highlight e6
      [
        null
      ],
    ],
    [{ [TICK]: void 0 },[
      // Resumes the clock timer and the game
      {
        "update clock": {
          "commands": [
            {
              "command": SET_TIMER,
              "params": 1000
            }
          ],
          "eventData": void 0,
          "extendedState": {
            "blackPiecesPos": [
              "a7",
              "b7",
              "c7",
              "d7",
              "e7",
              "f7",
              "g7",
              "h7",
              "a8",
              "b8",
              "c8",
              "d8",
              "e8",
              "f8",
              "g8",
              "h8"
            ],
            "gameDuration": 1,
            "pieceSquare": "",
            "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
            "squareStyles": "",
            "status": "",
            "turn": "b",
            "whitePiecesPos": [
              "a1",
              "b1",
              "c1",
              "d1",
              "e1",
              "f1",
              "g1",
              "h1",
              "a2",
              "b2",
              "c2",
              "d2",
              "e2",
              "f2",
              "h2",
              "g4"
            ]
          },
          "settings": ["debug", "eventEmitter", "chessEngine"]
        }
      }
    ]],
    [{ [BOARD_CLICKED]: "e7" },
      // click e7	highlight e7
      [
        {
          "Highlight selected black piece": {
            "commands": [],
            "eventData": "e7",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "e7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8"
              ],
              "gameDuration": 2,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [CLOCK_CLICKED]: void 0 }, [
      // Cancels the clcok timer and suspends the game
      {
        "cancel timer": {
          "commands": [
            {
              "command": CANCEL_TIMER,
              "params": void 0
            }
          ],
          "eventData": void 0,
          "extendedState": {
            "blackPiecesPos": [
              "a7",
              "b7",
              "c7",
              "d7",
              "e7",
              "f7",
              "g7",
              "h7",
              "a8",
              "b8",
              "c8",
              "d8",
              "e8",
              "f8",
              "g8",
              "h8"
            ],
            "gameDuration": 2,
            "pieceSquare": "e7",
            "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
            "squareStyles": "",
            "status": "",
            "turn": "b",
            "whitePiecesPos": [
              "a1",
              "b1",
              "c1",
              "d1",
              "e1",
              "f1",
              "g1",
              "h1",
              "a2",
              "b2",
              "c2",
              "d2",
              "e2",
              "f2",
              "h2",
              "g4"
            ]
          },
          "settings": ["debug", "eventEmitter", "chessEngine"]
        }
      }
    ]],
    [{ [CLOCK_CLICKED]: void 0 }, [
      // Resumes the clock timer and resumes the game
      {
        "restart timer": {
          "commands": [
            {
              "command": SET_TIMER,
              "params": 1000
            }
          ],
          "eventData": void 0,
          "extendedState": {
            "blackPiecesPos": [
              "a7",
              "b7",
              "c7",
              "d7",
              "e7",
              "f7",
              "g7",
              "h7",
              "a8",
              "b8",
              "c8",
              "d8",
              "e8",
              "f8",
              "g8",
              "h8"
            ],
            "gameDuration": 2,
            "pieceSquare": "e7",
            "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
            "squareStyles": "",
            "status": "",
            "turn": "b",
            "whitePiecesPos": [
              "a1",
              "b1",
              "c1",
              "d1",
              "e1",
              "f1",
              "g1",
              "h1",
              "a2",
              "b2",
              "c2",
              "d2",
              "e2",
              "f2",
              "h2",
              "g4"
            ]
          },
          "settings": ["debug", "eventEmitter", "chessEngine"]
        }
      }
    ]],
    [{ [BOARD_CLICKED]: "e4" },
      // click e4	none (invalid move)
      [
        null
      ],
    ],
    [{ [BOARD_CLICKED]: "e5" },
      // click e5	move piece e7-e5, render new position
      [
        {
          "Move black piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "e7",
                  "to": "e5"
                }
              }
            ],
            "eventData": "e5",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "e7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8"
              ],
              "gameDuration": 2,
              "pieceSquare": "e7",
              "position": "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "f2" },
      // click f2	highlight f2
      [
        {
          "Highlight selected white piece (f2)": {
            "commands": [],
            "eventData": "f2",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 2,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/6P1/8/PPPPPP1P/RNBQKBNR w KQkq e6 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "w",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "f4" },
      // click f4	move piece f2-f4, render new position
      [
        {
          "Move white piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "f2",
                  "to": "f4"
                }
              }
            ],
            "eventData": "f4",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 2,
              "pieceSquare": "f2",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/6P1/8/PPPPPP1P/RNBQKBNR w KQkq e6 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "w",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "f2",
                "h2",
                "g4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "d8" },
      // click d8	highlight f2
      [
        {
          "Highlight selected black piece": {
            "commands": [],
            "eventData": "d8",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 2,
              "pieceSquare": "",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq f3 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "h2",
                "g4",
                "f4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          }
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "h4" },
      // click h4	move piece d8-h4, render new position
      [
        {
          "Move black piece": {
            "commands": [
              {
                "command": "MOVE_PIECE",
                "params": {
                  "from": "d8",
                  "to": "h4"
                }
              }
            ],
            "eventData": "h4",
            "extendedState": {
              "blackPiecesPos": [
                "a7",
                "b7",
                "c7",
                "d7",
                "f7",
                "g7",
                "h7",
                "a8",
                "b8",
                "c8",
                "d8",
                "e8",
                "f8",
                "g8",
                "h8",
                "e5"
              ],
              "gameDuration": 2,
              "pieceSquare": "d8",
              "position": "rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq f3 0 2",
              "squareStyles": "",
              "status": "",
              "turn": "b",
              "whitePiecesPos": [
                "a1",
                "b1",
                "c1",
                "d1",
                "e1",
                "f1",
                "g1",
                "h1",
                "a2",
                "b2",
                "c2",
                "d2",
                "e2",
                "h2",
                "g4",
                "f4"
              ]
            },
            "settings": [
              "debug",
              "eventEmitter",
              "chessEngine"
            ]
          },
          "status": "Black wins!"
        }
      ],
    ],
    [{ [BOARD_CLICKED]: "a2" },
      // click a2	none (game is over)
      null,
    ],
    [{ [BOARD_CLICKED]: "h2" },
      // click h2	none (game is over)
      null,
    ],
    [{ [BOARD_CLICKED]: "e6" },
      // click e6	none (game is over)
      null
    ],
    [{ [CLOCK_CLICKED]: void 0 },
      // game is over
      null],
    [{ [TICK]: void 0 },
      // game is over
      null]
  ];

  const outputs = shortChessGameWithWrongMoves
    .map(inputOutputMap => inputOutputMap[0])
    .map(fsm);
  const expectedOutputs = shortChessGameWithWrongMoves
    .map(inputOutputMap => inputOutputMap[1]);
  assert.deepEqual(outputs, expectedOutputs, `This short chess game is successfully concluded with a checkmate.`)
});
