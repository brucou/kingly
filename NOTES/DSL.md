# Chess game

## Basic game
Learning:
- having the events helps writing the `When`.
  - The user clicks on a square, we don't know at that time if it is a white piece or a black piece. It is possible to implement it that way but that would require the view to have state (clicking on the same square would trigger different events!).

CONTRACTS:
- we want to have unicity of :x: !!

```gherkin
:0:
When user navigates to game url
Then display chess board in initial position, and the rest of the chess game interface
-> :1:

:1: (White plays)
When user clicks on the chessboard
Then
  If a white piece is clicked
  Then select and highlight that piece
-> :2:

:2:
When user clicks on the chess board
Then
  If user clicked on another white piece
  Then select and highlight that piece,
       -> :2:
  Else If the clicked square points to a winning chess move
  Then execute the move, update the chess board, update the player turn,
       -> :5:
  Else If the clicked square points to a valid, non-winning chess move
  Then execute the move, update the chess board,
       -> :3:

:3: (Black plays)
When user clicks on the chessboard
Then
  If a black piece is clicked
  Then select and highlight that piece
-> :4:

:4:
When user clicks on the chess board
Then
  If user clicked on another black piece
  Then select and highlight that piece, -> :4:
  Else If the clicked square points to a winning chess move
  Then execute the move, update the chess board, update the player turn -> :5:
  Else If the clicked square points to a valid, non-winning chess move
  Then execute the move, update the chess board, update the player turn -> :1:

:5:

```


## Adding undo
```gherkin
:1:, :2: (Whites turn)
When the user clicks undo
Then
  If there has been at least one move
  Then undo the move, update the chess board, update the player turn, -> :3:

:3:, :4: (Blacks turn)
When the user clicks undo
Then
  If there has been at least one move
  Then undo the move, update the chess board, update the player turn, -> :1:

```

NOTE:
- syntax :x:, :y: (state identifier) to define a compound state
  - achtung this opens the door to hypergraph, so add some control that one :x: can only be in one compound state or sth
  - or leave it, but let the user pick his favorite, the one that will appear in the graph

# Code
## Events
Autofilled by the compiler. The event idenfifiers are provided by the user
```js
// :0: user navigates to game url
const INIT_CHESS_GAME = ...
// :1:, :2: :3:, :4: user clicks on the chessboard
const BOARD_CLICKED = ...
```

NOTE:
- the actual value of the event does not matter so can be a number (auto-suggested and guaranteed unique)

## Guards
- anything after if

ADR:
- we don't go the way of an algebra for guards at least now. The algebra can be implemented in JS easily
- we prefer natural language even if it may lead to duplication in naive implementations
- we don't want the (specs) user to think about a programming language and make mistakes using it

```js
// :1: a white piece is clicked
function isWhitePieceClickedOn(extS, ev, stg) {
  ...
}

// :2: user clicked on another white piece

// :2: the clicked square points to a winning chess move

// :2: the clicked square points to a valid, non-winning chess move

// :3: a black piece is clicked

// :4: user clicked on another black piece

// :4: the clicked square points to a winning chess move
// this is the same as :1: !!

// :4: the clicked square points to a valid, non-winning chess move


```

ADR:
- :4: and :2: have the same label, but are differentiated by their origin control state
- that is ok. If same at programming level, we just have them do the same thing
- while if not, we still have the freedom to do something different
- again, it is better not to couple natural language and programming language!

ADR:
- for DX, the comment lines come pre-filled from the specs
- they can be updated  because they refer to a unique identifier x in :x: (cf. contracts)!!
- in the prefilling show below fn <nothing> (extS, ev, stg){} so the user does not have to fill it in

## Actions
- Anything after Then Then (case we have a If) or Then ?
  - we can only have one If level
- same DX than for guards
- we actually do not need a name for function, they can be anonymous given that we know what they implement
- also we could have `const x = (...) => ...`, we just copy the code anyways...
  - that would allow to repeat less code in case two functions are equal
  - cause other issues of ordering as constant do not hoist? mmm

ADR:
- we impose a single If level for ease of implementation but also for simplicity and readability

```js
// :0: display chess board in initial position, and the rest of the chess game interface
function ...(...){...}

// :1: select and highlight that piece

// :2: select and highlight that piece

// :2: execute the move, update the chess board, update the player turn

// :2: execute the move, update the chess board

// :3: select and highlight that piece//

// :4: ...
```

ADR:
- everything to inject has to go through settings. That is the only way we can avoid imports...
- also allows to remain multi-language?
- but is more verbose... everytime we may need to deconstruct `const {dep} = settings`...
- for now, KISS and deconstruct!
- some analysis may tell us what are the properties used under settings? would be cool for DX
  - but that would captured through testing anyways if one is missing right?

but here we need the closure with the render of the framework in question... or imports!!

TODO: to decide
- closure and imports only allowed for command handlers which are not pure
  - or we may require effect handlers, and that way we no longer need imports!!

## Interfaced systems
- could be nice to have a specific tab listing the interfaced system, and mappingg the command to the interfaced systems!
- Yes, do that like a 1 to many relationship drawing though one command may affect seevera systems...
- user should declare the shape of the commands at that moment
- that is also true for the render command (props)
THEN I Should go write the actions!

## Command handlers
- Have them all in one file, gathered under a parameter called commandHandlers
- const commandHandlers = {[command1]: ..., etc.}
- no export, we will concatenate the files
- must have a name which will be uesd to prefix the file and as value of .command property
- the name is put in a constant that has the same name but in caps

ADR:
- no effect handlers
- simpler, easier to control, less declaration
- not so useful anyways outside complex cases

## Tests
**TODO** that will be... for each guard how to transiion or not!
f(ext state, test state) -> {inpout | null}

## Machine creation
- updateState (use defaults in the .fsm.js user can override)
- initialState
- initialControlState : cf. ADR
- settings: build the dependency injections, so also need imports here but no exports

ADR:
- initialControlState is :0: by convention (or :0: (identifier) if that is useful)
- settings are defined with const settings = {...} in the last line of the file .settings, no exports
- imports are in most modular languages and are alike while exports vary widely
- we want to use this in other language than JavaScript too
- we will produce only one concatenated file with everything inside for production so need for export internally
- may be necessaary at the end of the large file though to export the final machine or app
-

# ADR
- the textual mode alone would be challenging to follow even on a small app with few interactions
- the plan is to do the app iteratively:
  - At :1: I already have the chess board drawn with initial pos
  - At :2: I have the chess board drawn with highlit piece
  - etc. So at each step, I have an interface from which I can imagine what are the events, and reactions
  - worse case, I should allow to link a jpq
- best is to have all fsm files in one directory? NO, no early structuring, will know when necessary
- keep the programming concerns separated from the spec concerns. The idea is to have several people focusing on different things
- one file per command handler
- all files with same prefix
  - <prefix>.<fsm name>.fsm.specs or ...fsm.bdd
  - .fsm.command.js
  - .fsm.render.js
  - .fsm.guards.js
  - .fsm.actions.js (ou ts?)
  - .fsm.<time>.tests
  - .fsm.js (need to create the fsm.. and pass updateState, initialState)
  - fsm.settings.js
- every section should be wrapped in an HTML tag, custom element style e.g. <fsm-specs slot="specs">, <fsm-guards> etc.
  -  then formatting for the web is easy, copy paste into html and import the custom elements implementation!
  - this also allows to add parameters to each custom element to parameterize whatever may be needed
  - slots allows for easy manipulation and redistribution of the whole file with all contents
  - maybe a top level component doing this slot distribution precisely?

TOO MANY THINGS!!
- specs
- tests
- command handlers (including view)
- guards
- actions

# Notes
Other way to do the coupling: use two columns
```gherkin
# comments
Given :x:                           | state identifier
OR
:state identifier:

When ...                            | event identifier (*)
Then ...                            | action identifier
-> :x:                              | transition identifier (use for path generation) | generator identifier (**)

When ...                            | event identifier (*)
Then
  (Else) If ...                     | guard identifier
  Then  ...                         | action identifier
  -> :x:                            | transition identifier (use for path generation) | generator identifier (**)

Eventless transitions:
Given :x:
(Else) If ...
Then ...
-> :x:                               | transition identifier (use for path generation) | generator identifier (**)

History transitions:
Given :x:
When event
Then action
-> resume :y: (defaults to deep history which should be the most used ?)
-> resume at top level :y: (for shallow history)

Init transitions: (***)
Given :compound state identifier: (:x:, :y:)
When entered (RESERVED!!)
Then ... as usual
-> :..:
```

ADR:
- empty lines are separators, indicated end of expression
  - useful for error reporting. file parsed into expressions, parsed into Given...
  - line information is kept for each token
  - the parse structure is then analyzed, if incorrect errors are generated with line information
    - Then missing a Given
    - Else without an If 
    - When entered ... cannot have anything after
  - this error reporting is better than using native parser errors which are not user friendly... but that complicates the code

(*) there is no generator identifier here. We may need one but it will follow conventions, i.e. tied to the name of the event. For instance, <event>_arb = (this, that) => Maybe val
(**) generator identifier should be prefixed by the event it relates to. <event>_<arb_identifier>_arb = ...
(***) : only use this syntax!  not :x:, :y: (name) even though the latter is cooler. Possible to give no name (::)? only if never used later; Given is optional

Then the IDE may swap between the two When x | y => When x or When y. Or grey out some parts, use tooltips, etc.
line returns and ident can be used as they are not significant.

# Testing DSL
- I need to describe test generation at each transition
  - that is taken care of with the Spec DSL
- I also need to describe a specific subset of the test space
  - do it directly from arbitraries?? YES, a Turing language is the best here (ADR)
  - I do not want to do that from the specs! (cause that's impl.) Want to do it independently But i want ot test the specs so it should follow the specs... It is the PBT that provides a different take at the specs and should allow to find errors in the specs

- 773 782 856 hygienic number
- 773 782 850 hygienic number

ADR:
- cannot check properties while generating because properties may depend on the future, e.g. inputs that have not been generated yet

ALMOST:
- describe PATHS of the machine not sequences of inputs!
  - so name each transition (after the `|` character)
  - paths are t1-t2-(exp)?-(exp)+{MIN, MAX}-(exp)*{MIN, MAX}-t1, t2- any -
    - default of MAX is 2, we don't want too many
    - t1, t2 means t1 or t2 randomly (choice operator)
    - could add in a second phase P => t1, Q => t2 where P receives the transitions generated so far
      - this allows to change the future transitions in function of the past transitions
      - should i have this depend also on past generated inputs?
      - semantics: what if none of P and Q is valid? path is finished? or continue with no transitions?

Semantics:
- t1 - t2 : what if t2 cannot be taken?
  - t2 and t1 do not share a common state: semantic error (contract)
  - t2 starts where t1 ends but cannot be taken because of the previous inputs = current ext state (guard can't be fulfilled)
    - what to do? warning with path so far and no path output? YES, path generation can be reattempted
    - BUT if there is no path at all generated even after X arbitraries attempt, log an error? but that's not an error from the reactive system specifications, thats a user error. Wrong test writing. So thats a warning!

## DSL
We need to specify for each path generated the properties that hold on that path. So each path needs to be named?
Or put the properties directly below the path?

```gherkin
Scenario fragment expression_identifier
r1-r2-...

Scenario path identifier
t1-t2-(exp)?-(exp)+{MAX}-(exp)*{MAX}-t1 or t2- any -
Satisfies property description                       | javascript function identifier
Satisfies property description                       | javascript function identifier

```

ADR:
- I NEED TO DEFINE PROPERTIES INDEPENDENTLY so I compose bigger formulas from smaller formulas!
- NOOO!! too compllicated implementation and syntax (formulas will use variables and a substitution mechanism has to be dfined - that's defining a whole expression language, don't wanna go there)
- work with the predefined patterns but try to write them so they are intuitive
- No LTL syntax too complicated
  - - ¬◇□∧∨○
  - Note that wikipedia use capital letter GXUW etc. Should I do same? or provide the symbols somehow
- could use a marble-like syntax but also complicated in the end, better to directly use JS and an embedded DSL (maybe template language?)
- cf. **property patterns**: http://people.cs.ksu.edu/~dwyer/SPAT/ltl.html


**TODO: I AM HERE**: clean below, keep only what has been decided which is pretty much delete all. But keep examples of properties for the chess and conduit app too. Try to express the props in the marble-like language but don't sweat it. The more important is to use the proposed syntax to see how it handles long property definition or how it looks like.

## Counter example
Events: button click; Outputs: render command with counter to render:
- we have an oracle, we know for each sequence what should be the output
- could write properties with next operator

## Password meter
Events: input field value, submit button; Commands: render (green/blue), submit

We also have an oracle here, but it requires goign through the inputs statefully! so let's use properties
- password submitted only once
  - if there is submit command, there is only one
    - P:x -> ! P:x < P:y
    - □(submit_cmd -> ○□¬submit_cmd)
- input field value is invalid pwd -> render red
  - always(invalid_password_input_entered -> render_red_field)
  - □(invalid_input_value -> red_render_cmd)
  - P -> Q **(but I cannot say that they are at the same time!!)**
  - P : if they are at the same tine, because I pass all info that's enough
- input field value is valid pwd -> render green
  - same as before
- input field value is invalid pwd & submit click -> no submit command. Reverse it!
  - submit command if input field value and not input field invalid between input field value and submit click
    - click and command are the same property, e.g. true only if (input, output) = (click, ...) 
  - pattern S precedes P without Z
    - S: input field value is valid, T: submit_click, Z: input field value is invalid
    - P: submit_cmd
    - P => S < P & !(S <= Z <= P)
  - □(submit event fails between invalid typed and valid|invalid typed)
  - □(P between Q and R)

- syntax cmd:x, i .... cmd:y,j .... f(x,y)
  - so : for assigment; () for application
  - x value, i index in the input sequence
  - cmd, cmd:x, cmd:x,i are valid syntaxes

# Error messages
- could not generate input sequence for scenario (path identifier) after X attempts
- (warning) generated X/Y test case for scenario (path identifier). Could not generate Y-X cases.

# Interoperabiity
- should interoperate with fast-check??
  - I could generate a compiled code that does!

## Conversion to yed
TODO

## Inclusion of svg graph
generated by yed

# Methodology
- specify
  - specs
  - list of interfaced systems
  - list of commands on the interfaced systems
- implement
  - start with render
    - that gives events
  - events give actions
  - implement those actions
    - that gives events
  - iteratively update the specs or revise implementation
- test


ADR:
- We want always the view to be a pure function.
  - Even if the view render command may be passing just the updated props. Still having test a simple aggreagation function and a pure view: manageable.
- classification of properties:
  - safety properties: □p
  - guarantee properties: ◇p
  - obligation properties: ◇r -> ◇q
    - Every boolean combination of safety and guarantee properties is an obligation
      property
  - response properties: p => ◇q, or □(p -> ◇q)
    - p implies q will happen
    - They can express the property of response of a system, stating that
      every stimulus has a response. 
  - persistence properties: ◇□p, or □(p -> ◇□q)
    - from a certain position on, iet is continuously
      true that if p occurred in the past then q holds now. 
  - reactivity properties: □◇p V □◇q., or □◇r -> □◇p
- the last 5 are progress properties

# Rejected
ADR:
- added the command identifier in each THEN to reference the commands in the properties!
  - maybe I should instead have a ACTIONS keyword listing the commands, and then use that?
  - I may have to repeat many times the commands (like render)
  - on the other hand, more explicit and declarative (would only miss state update desc.)
- have patterns hard-coded in addition to the basic operator □...
  - between, before, cf.http://people.cs.ksu.edu/~dwyer/SPAT/ltl.html
- P (predicate) will receive the input and output of the fsm at index i AND extra params as rquested per property
  - Ex: P:x ^ Q:y -> R   implies R:: (event, commands) -> [x,y] -> Boolean
- P identifiers should use camel_case notations
- from P, one can make expressions
```wikipedia
if p ∈ AP then p is an LTL formula;
if ψ and φ are LTL formulas then ¬ψ, φ ∨ ψ, X ψ, and φ U ψ are LTL formulas.[7]
```
  - so formula F = predicate_formula | unary_op formaula | formula1 binary_op formula2 | pattern_formula
  - predicate_formula = predicate_identifier | predicate_identifier:variable_identifier
  - unary_op = ¬ □ ◇ ○ always eventually next not
  - binary_op = ∧ ∨ ->
  - pattern_formula PF =
    - formula **between** formula **and** formula
      - Q then R implies P occurs between Q and R
      - Q < R => Q < P <= R
    - formula **before** formula
      - P is before R (if occur)
      - R implies P occurs before or when R
      - R => P <= R
    - formula **precedes** formula
      - P precedes R (if occur)
      - R implies first P then R
      - R => P < R
    - formula **after** formula
    - formula **implies** formula
    - S **responds to** P (P -> <>S)
      - not P then S because that implies that P occurs which is not necessary the case!
      - could be: if P then later S
      - or: P implies S occurs when P or later
      - P => P < S (note how different from S => P < S)
    - S,T without Z responds to P:
      - P => P < S < T & !(S <= Z <= T)
    - P occurs at most twice
      - P:x => !(P:x < P:y < P:z)
    - P responds to S,T:
      - S & S < T => S < T < P
    - P weak until Q:
      - Q => P < Q | □P.... - cannot be expressed in my language...
      - I cannot say for all t < Q P holds
  - be careful that always is not always starting from the beginning but from the current index

SO:
- do that in a template language
  - the S, T, P passed as params, and the ${} are the params
- switch to the <= notation
- always is presupposed so no need to use □
- and P < ... implies it exists P so no need to use that operator either!
- need to think about the evaluation model
  - P means it exists P or ◇P
  - S < T means ◇S, ◇T and S < T
    - but there could be two S or two T...
    - we always refer to the first one! NO
    - we evaluate in order. Look for first S, then look for first T after S
    - don't reevaluate X, bind the evaluation to it!
    - P: so look for first P, bind
    - P < S < T: P is bound, look for S, bind, look for T, bind it
    - that should work? remind me of Mozart/Oz!
      - I can still do P:x, P:y and pass the (x, y) to another Q but both will have to be bound for Q to be computed...
  - P, Q means exists P and exists Q
  - S & S < T => S < T < P means
    - if exists S, and exists T such that S < T, then exists P such that S < T < P
    - ◇S -> ○( ◇T -> ○(◇(T ∧ ◇P) )
  ! S & S < T => S < T < P ≠ S => S < T < P
    - in both cases      S always false -> formula true
    - in the second case S true > once and no T then formula false
    - in the first case  S true > once and no T then formula true

# Grammar
LANG = COMMENT | TRANSITION | SCENARIO
SCENARIO = SCENARIO_PATH | SCENARIO_FRAGMENT 
TRANSITION = ("Given")? given_expr "When" when_expr "Then" then_expr "->" goto_expr
given_expr = ":" local_state_identifier ":" ("|" external_state_idenfier)?
when_expr = "When" when_desc ("|" external_event_idenfier)?
then_expr = "Then" then_clause
          | "Then" "If" if_then_clause
          | "Then" "If" if_then_clause (else_if_then_expr)+
then_clause = then_desc ("|" external_action_idenfier)?
if_then_clause = if_desc ("|" external_guard_idenfier)? "Then" then_clause
else_if_then_expr = "Else if" if_then_clause
