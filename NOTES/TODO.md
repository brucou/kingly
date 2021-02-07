# TODO
- rewrite: for recruitment purposes
  - propertly the machine library
  - rewrite the test also to be more understandable (with graphs??)
- Examples
  - I could also redo the wizard form example!!
    - same, first
    - then with better looks
  - cculd be a terrific demo (from SAP, code is there with UI5 as example)
    - https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/checkout
  - if I do a game, this one, it has actual modal states: https://github.com/jakesgordon/javascript-tiny-platformer
    - jumping while falling: ..., jumping while not falling: jump
  - Routing demo would be great to showcase dynamic import, i.e. lazy loading 
  - good example of routing and animations :  https://github.com/sdras/page-transitions-travelapp
- API
  - `TEST!`, document and release officially the version with state reset/backtracking etc. (createPureStateMachine)
    - haven't written a test to check that the history state is not modified between different execution of the pure machine
    - on an hierarchical/non machine: one pure machine run with history change -> state1. reset run-> state 2. state2 === state1




    - on an hierarchical/non machine: one pure machine run with history change -> state1. event [guard1]-> state 2. state1 back with ext state passing guard2 event[guard2]-> state 3. All this with history change. state 2. transition to H*. state3 transition to H*.
      - check history states are what they should be. Rather check that the right actions are run -- thats history-implementation independent
    - on an hierarchical/non machine: one pure machine run -> state1. event1 -> state 2 (modify ext state1). back to state1 and event2 -> state 3 (modify ext state1).
      - state 2 and state 3: no overwriting
  - do the createPureStateMachine also in compiler
  - demo with web component logic with sm - short size when compiled? TMDB app?
    - add back the web component API in the code? and doc it?
  - compile to TypeScript, Elm, Rust, Go, Python?
- DOC
  - DOC!!!! event not accepted by machine => null, event accepted but no guard fulfilled => [null,...]
  - present kingly not as porable UI library but state machine library, that allows portable UI
    - so in docs, one part for machines, one part for UIs
  - add counter with Ink in react terminal in the docs!!
  - doc site take it from there : https://github.com/alexkrolick/testing-library-docs
    - or https://www.ably.io/documentation
    - https://github.com/axefrog/docs
- Playground
  - DSL format to design
  - DSL can be made with codemirror playground - cf. brave bookmark (bar, specs editor)
  - codesandbox with user interface text area (for graphml conent), other tab is states, events, transitions (with fake names)
  - state machine component IDE (cf. https://components.studio/edit/mzK3QRdpQm6wl4JZBlGM)
    - text format taken from BDD (chevrotain)
      GIVEN <string> "<control state>" <string>
      -- complex
      WHEN <string> "<event>" <string> {
        <pred> => <target state> : <fn>
        <pred> => <target state> : <fn>
      }
      -- simple
      WHEN <string> "<event>" <string> => <target state> : <fn>
      -- eventless
      WHEN <string> "<event>" <string> => <target state> : <fn>
      but guards would maybe fit more in GIVEn in BDD?
  - tab for actions
  - tab for guards
  - tab for effects
  - tab for stories (which are simply tests...)
  - tab for PBT (maybe a generator language to design too)
    - see how we can derive that from the BDD-like text format
- beware that history states must not be updated in place  
- DROP everything and do cypress demo! https://github.com/cypress-io/cypress-realworld-app
- Finish Realworld demo design and impl.
  - write new impl
  - add doc (don't remove existing for now)
  - write infoq article about it
  - write medium article about it (different and much shorter)
  - LESSON LEARNT: look at all the if we removed, and how the behavior is more clear
    - we may find a bug: if you click on the canvas, tiny box and cannot be enlarged
- MAYBE BPMN.io great for visualization of small stuff - admits nested processes
  - must draw yourself the layout but thats fine
  - then will have some work to map data-element-id to machine components but doable
  - then style it to have a step-by-step debugger!!!! 
  - allow create, load, and save of .bpmn file: perfect, put that in github.
    - can I use a webpack loader?? raw-loader!! AMAZING    
  - BUT can not fold compound states...
- eshop nice demo (vue) : https://github.com/sdras/ecommerce-netlify /

# Concepts
- machine useful for stateful equation, if no state no machine
  - new control state useful to show that variation
  - machine makes a lot of sense if computation methods changes a lot per control state
    - so much that that variation cannot be contained in a variable, or not usefully

# Cookbook
- modals
  - usually leave to another compound state and return with history

# Roadmap
- most applications will have a lot of X -> X transitions as they do not have a lot of modes. In that case, it may be importeant to understand the state updates happening to reason about the program
  - a graph which display those would be great: DO SOME RESEARCH of prior art
  - machine state is a tree: DRAW THAT
  - then draw relationships between entities acting on any part of the tree (pieces of state)
  - have some querying facilities
  - have some time-visualization, and time-querying because this happens over time
  - a lot to study here

# Features
- reset and backtrack and clone fucntions NOT on the function object mais imported (tree-shakeable) and going to access values on the machine function object. That's better. Also backtracking only possible if machine has been created with `save history` setting. and backtracking returns a cloned machine, does not update in place. may mean I need a way to clone state, so cloneState should also be in settings, like updateState
  - NO! Now I compile, so I can have non-tree-shakeable impl. More important than breaking code. Or have a new API, createCloneableFsm so I don't break

# DOC
- take a page from nearley docs: 1. this, 2. that... it is short and very explicit, can use at very first before details
- put that quote somewhere (Bob Martin)
  - BDD are state machiens (2008!!): https://sites.google.com/site/unclebobconsultingllc/the-truth-about-bdd
- add  that no events can be called 'undefined', and add a contract for it
- fsmContracts in debug - update types too to include it
- state updates MUST be an array if using the compiler or yed converter, outputs MUST be an array or null
- website:
  - build a real documentation site separated from the README.md
    - cf. talk https://www.youtube.com/watch?v=t4vKPhjcMZg
    - tutorial
      - start with the password example (letter/number)
        - exercise left to learner : use a password library (forgot the name)
      - then go up from more complex examples
        - no hierarchy
        - with hierarchy
        - with history etc.
      - etc. that means having a graduated parcours to follow (i.e. curriculum)
      - maybe include testing at the same time as development
      - TUTORIAL (learning-oriented, most useful when we are studying and evaluating the material) 
      are about concreteness not abstraction (include a dropdown with abstraction by 
      default hidden), no unnecessary explanation
    - how to (problem-oriented)
    - discussion (understanding oriented - that is like the article I am writing for frontarm, 
    gives context, explain why, alternative approaches, connecting to other things)
    - reference
- document use cases!
  - make a UI
  - make a component
  - ?
  - maybe put use cases (if there are 3 of them) on the top entry page

# Articles
- make article on when to model behavior with state machines -- and when not (InfoQ)
  - take some of my answers to gaeron tweet

# Now
- the best adoption strategy is to have people play with it!! So IDE, textual language (see if I find online free graph editor), and playground...
 TOP OF THE TOP: cf. https://components.studio/edit/mzK3QRdpQm6wl4JZBlGM
  - have a left/right division
  - left: tabs: code with textual language | guards | actions | effects exec | test seqs
  - right: UML viz live updated with text lang | test viz (stories kind of) | pages (live comp) | Readme | Help

  - zero values are used for action identity, and those are ([] and null), maybe future version add an option to change that
// TODO: Courtesan: in content-courtesan.js change .kuker to .courtesan (but last)
// TODO: Courtesan devtool: Ben hyperlink schneidermann - information seeking mantra
   - overview first
   - zoom + filter
   - details on demand 
// TODO: Suspense!! cf. video react conf on relay react C:\Users\toshiba\Downloads\conferences
   - suspense creates boundaries which accumulate all data needs from component within the boundary
   - and then suspense machine, show how this can be achieved with fsm
   - in realworld, we fetch tags and posts separately and display two loading indicators
   - we could suspend! load both queries, and display once all data is there else one unique loading indicator
   - that's FETCH THEN RENDER, issue is there is no incremental rendering, it is all, loading, or nothing
   - it is better than displaying loading indicators for all component which require data
   - having several suspense boundaries allow to have incremental rendering, the fallback holds the layout and displays a nice placeholer
   - unfortunately there is not enough data fetching to implement suspense list
     - suspense list allow to enforce ordering of suspensed renders so one comopnent waits for another before rendering itself
   - I could try render as you fetch for page transitions (cf. 19:29)
     - this involves declaring ahead of time the component to download and the data for that component, so they can be downloaded at the same time, instead of sequentially (download code, then download data)
     - the downloads call happens then in the handler that handles the page transition, not in the component displyaing the page
     - a state machine does that naturally, not less naturally than React
     - see how to integrate that as part of a routing machine
     - also the machine level delegate data fetchign to handlers, so there can be handled caching, and waiting X ms to invalidate a cache (throttling essentially)
       - how to implement cancelation? if user clicks tab A -> download <A> fetch A data, then quickly clicks Tab B -> cancel A, do B 
// TODO: I now allow initial transitions with multi target states. Check that the state-transducer-testing still works. Maybe add tests for it. 
- other example of full app: https://github.com/TrillCyborg/fullstack (dead link now...)
- REMOVE render commands from REACT_STATE_DRIVEN!!!! put it in kingly!!! for dependency reasons
- similar to what I want to do with actor/processes/cycle : 
  - https://medium.com/dailyjs/introducing-bloc-pattern-with-react-and-rxjs-40109665bb2
- regex for tufte hexo tag: (\s*)(```)(tufte)\s+\n?([\s\S]+?)\s*(\2)(\n?|$)
- do a Vue doc contribution with the sparks example in Vue!!
- CONTRACT: event emitter must be on microtask? so that event passed through the emitter are run 
before other machine events are processed? can it also be immediate/synchronous?
- shepherd - guiding user through app can be done with state machines: https://shepherdjs.dev/
- for tutorial/demo site use graph widget https://github.com/ui-router/visualizer 
- add more eventless tests
  - eventless <-> eventless with guards in both, and state modification
- do the react version of password demo from the vue one
  
- Promote
  - finish react-state-driven then vue-state-driven
  - vue-state-driven to put in awesome vue : https://github.com/sdras/awesome-vue
    - https://github.com/sdras/awesome-vue#examples
  - look if I can put react-state-driven in awesome react if any
  - finish react-state-driven then write ivi component as ivi hook then publish to ivi example
    - https://github.com/localvoid/ivi/tree/master/packages/ivi, https://github.com/localvoid/ivi#apps
  - put in svelte awesome : https://github.com/sveltejs/awesome 

- also for webcomponents README https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance 
- do the webcomponent wih a rendr property customizable
- add a tutorial section in README:
  - modelization (show graph)
  - implementation (show transitions)
  - execution (show interface)
- towards v1.X
  - test wise, would be good to generate tests starting from a target not INIT and some initial 
state at that target (cf. previous) 
  - maybe write a generator like with jsverify. cf. https://github.com/jsverify/jsverify#types 
    - seems like shrinking in our case is easy, just remove one input from the failing sequence
- do an angular2 demo (like ng-state-machine or something)
- do a svelte-state-machine demo (will be useful for template-based libraries)
- DOC the generator state in the testing generator
- test new version with iterator of graph-adt 0.8.1!
- DOC if outputs wants to output an array as outputs how to do it : [Array]! DOC it
- think about using the test generator for proprty-based testing
  - for instance any valid test case must respect invariant : no invalid input
    - that might have found the bug we found
  - if no review, all ABOUT inputs in the last domain action must be found in the last ABOUT
    continue event data
  - if no review, all QUESTION inputs in the last domain action must be found in the last ABOUT
    continue event data
  - if review, all reviewed ABOUT inputs in the last domain action must be found in the last
    ABOUT continue event data
  - if review, all reviewed QUESTION inputs in the last domain action must be found in the last
    ABOUT continue event data
  - must be as many domain action as continue button click
  - etc.
- !! all-transitions is all-path-with-no-repeated-transitions which is a all-transition but
bigger, call it all-transitions* ?? to avoid changing everything
- there can be error when generating the inputs!! typically when it is done wrong, and th
emachine is not in sync with the gen. Should identify that early and return a warning? Generally
error is ...[0] is undefined. That means an event was sent and could not be handleed by the state
 machine
 
 # Roadmap
- would be good a function `clone` which returns a new state machine, with the same state as the 
 current one
- ROADMAP : DSL with parser (check my gmail) like http://blog.efftinge
.de/2012/05/implementing-fowlers-state-machine-dsl.html so I can convert to it and back for
drawing and debugging?


 # Contracts
! WRITE ALL CONTRACTS
  - TODO add contract for test gen : apply only to FSM for which init event sets the initial state
   in the machine
     - could ignore event data from gen corresponding to INIT_STATE??
- CONTRACT : for guards associated to (from, event), only one guard can be fulfilled!!
  - for now priority works : first guard fulfilled
  - but that kills generative testing, it could follow a branch that is impossible by following
  the path given by the second guard fulfilled
  - so write defensively the guards : no else concept
  - review the demo, and replace all the T for else
- CONTRACT : for guards associated to (from1, event) and (from2, event) where from1 and from2 are
 in a hierarchy relation, for instance from2 < from1
   - for now REJECT
   - in the future could allow if guard1 and guard2 are never true together
     - if that is the case, the test input generation will work
     - but not the implementation which does not forward event!!
   - note this is a generalization of from1 = from 2 mentioned previously
- ROADMAP : add the super test from quantum leaps for hierarchy specs : remove those who cannot work
- ROADMAP : NO!! allow event forwarding : THAT IS A REWRITE, good thing tests are already there
  - that requires getting rid of prototypes and make a list of transitions for each (from, event)
  - when done, graph transformation does not change
  - BUT edge traversal changes : do not take a edge (from1, event) if from2 < from1 and
  (from2, event) generates an input
    - but even that is shaky as we generate only one input, there is no guarantee that for
    another input, we would not have the guard passing. But it is correct for that case, so
    useful for that case, but we loose generality!! We have only tested for a portion of the test
     space linked to this choice of event data. Obviously that is always the case, but ideally we
      want to choose our guards and fsm and gen so that the eventData can be variabalized and
      fuzzied over for fuller testing. We want to test the model with specific event data, and if
       true, we want to generalize to all possible eventData! can't do it if we propagate events
    - will work always if both guards related to from1 and from2 can never be true together
  - NOTE that this can be worked around by adding guards to from1
    - from1.final guard = !from2.guard && from1.guard (in general all ancestor of from2 on the
    path to from1)
    - could be important in that case to memoize the guard, as we might repeat them often.
    Extended state is immutable so should be practical. Impose settings immutable, and eventData
    immutable and we are good
- ROADMAP : implement iterator symbol, async iterator probably to emulate stream without stream
library
- ROADMAP : targetless events : NO only serves to confuse readability
      // NOTE : we implemented it here by repeating the self-loop corresponding to the targetless event in all substates
- ROADMAP : // T9. A transition to a history state must transition to the history state containing parent, if there is no history
            // ENFORCE, NOT IMPLEMENTED TODO in ROADMAP!!! impact on test generation
            NO~~~ there must be a history!! throw if none?
- no hierarchy : TODO : add tests for when event passed in not in state machine
- would be great to have a query language to select input sequences from the generated set
  - for instance includes a cycle
  - includes a cycle which includes this node etc.
  - it is an array

# Later
- at some point, write more serious tests, cf. [Imgur](https://i.imgur.com/IWoe84U.png)
  - specially with hierarchical part
  - the imgur link tests all topological transitions up to four levels!! good test!
  - expected run here [Imgur](https://i.imgur.com/Lei0BcM.png)
  - all info in pdf AN_Crash_Course_in_UML_State_Machines

# Testing
The FSM can be used to generate test cases fulfilling test
covers. There exists a set of desirable properties for the testing
of FSMs. Action Coverage is defined as the desirable property
of executing every possible action at each state at least once.
Action coverage is the easiest test coverage criterion for a
FSM model. Ref. [9] introduces Branch Cover, Switch Cover,
Boundary-Interior Cover and H-Language as test coverage
criteria. Branch Cover traverses an FSM in order to visit each
branch, so that the complexity of all possible paths reaching
to infinity at worst can be reduced. Switch Cover describes a
branch-to-branch tuple, meaning that in and out branches of
a state are covered by test sequences [10]. Boundary-Interior
Cover as described in [9] characterize test sequences causing
loops to be traversed once without additional iterations. HLanguage is a similar approach to for Boundary-Interior
Cover loop testing. 
From Test case generation approach for industrial automation systems 2011

 Furthermore, “the process of deriving tests tends to be unstructured, not reproducible, not documented,
lacking detailed rationales for the test design, and dependent on the ingenuity of single 
engineers” [7].  in Review of Model-Based Testing Approaches

# DSL for state machines
- I can use template literals!!! pass action functions in ${} it works!!! incredible

Guards:
---
function xxx()
---

Actions :
---
function xxx(){}
test if closure can be used this is evaluated so probably ??
---
Given ST1, When EV And guard THEN xxx
or 
ST1 => ST2 when EV AND guard
ST1 => ST2 on EV if guard
ST1:
  EV when guard => ST2
    DO actions 

amazing world

Background: (allows to describe a setup)
Given the following languages exist:
  | Name    | Culture |
  | English | en-US   |
  | Polish  | pl      |
  | Italian | it-IT   | 
And the following translations exist:
 | Language | Key                 | Translation             |
 | English  | Invalid Login       | Invalid Login           |
(sequence: [ev1, ev2, ...])
Scenario: Receive Messages in my Set Language (allows to describe a sequence input/ouput)
    Given I am the user "fcastillo" 
      And (cs: ...)
    When the system sends the message "Invalid Login" (event: ...)
     And the message allows (pred: ...)
    Then I should see the error message "Login non valido" (action: ...)
     And (cs: ...)
    When Then ...
     And ...
    Then ...

It could be better than having a more concise syntax which group the guard, as it gives one tsts for each guard.
We may not need conciseness here.

Background: 
Given an user exist                               (seq: [...])
  And an user has navigated to the login page
Scenario: user enters strong password
    Given the user sees the login page            (cs: ...)
    When user types T:letter                      (event: ...)
     And ...                                      (pred: ...)
    Then updates input field                      (actions:..., cs, prop: ...)
     And show in red
     And some property                            (prop: ...) that is a PBT predicate (can only test internal state at that point? don't have result of actions)
    When Then user types T:number                 (prop: ...) could be for example the result of a previous action as a message arrives
    Then updates input field, enble submit button
     And show in green
    When Then user clicks submit
    Then submit password 

The specifications of the behaviour are not the specifications of the machine, but that of the behavior of the machine...
We want a language to describe the machine, not its computation! We can do that by colocating bdd annotations like TS annotate JS with types.
Showing the annotations at the margin increase readability, not like TS which mixes types with JS.
That textual language is better shown on a screen for navigation purposes. Could be a two-column format
It could be better to mix all three: user specs, machine specs, tests specs. Complete colocation! complete coupling too...
USE TAB INSTAD OF SPACES FOR THE TWO COLUMN ALIGNMENT

Gherkin grammar: https://github.com/gasparnagy/berp/blob/master/examples/gherkin/GherkinGrammar.berp
Also excellent summary: https://docs.behat.org/en/v2.5/guides/1.gherkin.html
And BDD examples: https://www.clearlyagileinc.com/agile-blog/real-world-example-of-bdd-behavior-driven-development-agile-engineering-practices

Display:
- one text, two columns
- in IDE, where you can switch from one view (one column) to the other. Can remove tests specs, machine specs, etc.
  - it is like one document with three annotated layers


- I could also reverse the order
Given
When    event            (some text)
 And    pred
   Then ...
 Or     pred
   Then ...

Et reconciler avec le BDD 
