# TODO
- do the createPureStateMachine also in compiler
- if I do a game, this one, it has actual modal states: https://github.com/jakesgordon/javascript-tiny-platformer
  - jumping while falling: ..., jumping while not falling: jump
- present kingly not as porable UI library but state machine library, that allows portable UI
  - so in docs, one part for machines, one part for UIs
- add counter with Ink in react terminal in the docs!!
- DOC!!!! event not accepted by machine => null, event accepted but no guard fulfilled => [null,...]
- DROP everything and do cypress demo! https://github.com/cypress-io/cypress-realworld-app
- same thing with Oracle demo (more complete and nice!):
  - https://www.oracle.com/webfolder/technetwork/jet/globalExamples-App-FixItFast.html (get the zip)
- cculd be a terrific demo (from SAP, code is there with UI5 as example)
  - https://openui5.hana.ondemand.com/test-resources/sap/m/demokit/cart/webapp/index.html?sap-ui-theme=sap_fiori_3#/checkout 
- Finish Realworld demo design and impl.
  - write new impl
  - add doc (don't remove existing for now)
  - write infoq article about it
  - write medium article about it (different and much shorter)
  - LESSON LEARNT: look at all the if we removed, and how the behavior is more clear
    - we may find a bug: if you click on the canvas, tiny box and cannot be enlarged
- I could also redo the wizard form example!!
  - same, first
  - then with better looks
- Do excalidraw example (React, https://excalidraw.com/)
  - design / impl. / test
  - put on example of doc sites
  - update lesson learnt, cookbook, best practices
  - WITH SVELTE - then set a repository for folks to do it in their own framework = BUZZ
- textual format to design
  - convert to UML
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
- demo with web component logic with sm - short size when compiled? TMDB app?
- demo with machine in worker only sending changed prop to DOM for rendering?
- demo compiling to TypeScript, Elm, Rust, Go?
- Routing demo would be great to showcase dynamic import, i.e. lazy loading 
- Suspense component in Svelte with compiled version
  - including SuspenseList
  - try to include page transitions too?
- Do plyr popular video player (https://github.com/sampotts/plyr/blob/master/src/js/controls.js)
  - not too sure anymore what was the interest but popular, very accessible
- an example of parallel charts (https://tritarget.org/#Statechart%20based%20form%20manager) to do with multicasting events and Kingly
- don't do but modelize the popular flatpickr
  - https://flatpickr.js.org/examples/#range-calendar
  - I only have one mode which is when I can select a range of dates
  - the rest is view logic, not behaviour in sense of a = f(e,s)
    - because view = f(props) pure, there is no state hence no machine needed
    - now the view can have ifs all as necessary, still don't need a machine
    - and if we do by diff v = f(p), v + dv = f(p + dp); we have dp, we need dv, dv = h(dp) find h from f
      - given f such as v = f(p) find h such that dv = h(dp)
      - templates framework compute h for us
      - render framwork too via reconciliation
      - we can also do it by hand
        - if we see dp as an event, then dv = h(dp) with h pure means that we have no state so no machine!

# Concepts
- machine useful for stateful equation, if no state no machine
- new control state useful to show that variation
- machine makes a lot of sense if computation methods changes a lot per control state
  - so much that that variation cannot be contained in a variable, or not usefully
- we thus have a lot of control states with a lot of events circling to the same origin state
  - the visualization does not help, we need other ways to indicate what pieces of state are modified in these cases
  - also need to condensate the visualization somewhat to avoid a ton of circles
  - COULD ALSO have an multi-label edges, e.g. e[g]/a \n e[g]/a \n ...
    - need not do anything special with yed!!
    - can be done relatively quickly
    - small thing that helps a lot differentiate vs. other like xstate visualizer
    - that introduces however ambiguity in the grammar 
      - means more docs, more code complexity...
      - could impose e[g]/a in ONE line so easy to read and parse: YES in a first version
      - could also change the separator to some unused symbol | or || for instance
      
```js
| e[g]/a
| e[g]/a
| e[g]/a
```

# Cookbook
- modals
  - usually leave to another compound state and return with history

# Think
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

# Doc
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
- make article on stop coupling ui and logic!
- make article on testing - using the chess as an example

# Decision records
- maybe add or pass a settings object to the command handler (passed if needed to command handlers)?
  - this is for dependency injection - can have effects or commands more testable
  - or leave it userland?
  - but the effect handlers is already dependency injection!! Put all dependencies there even if they don't do effects!!
=> NO! I can already pass necessary settings to command handlers via params

- refactor away from prototype to allow event propagation:
  - each state (compound or atomic) has an handling function
  - that handling function in the case of a compound state is a regular transducer BUT if that transducer returns null then it applies the other relevant event handler at top level
  - so a compound component is a regular inside function || outside function
=> NO! simplicity first. And event forwarding does not help readability, also advised against by experts (can't find reference)

- Do leonardo.io (vanilla JS should be the simplest to reimplement)
  - but does not demonstrate so much about benefits? just a nice demo?
  - (use D3, use popup/modals, use component (color picker) etc)
=> NO! Leonardo already written without framework, and there is almost to no modes, so value of state machines is little

# Editors
- add bpmn.io!!! It has nesting. cf. /assets/diagram.bpmn.xml (it is a bpmn file though)
  - compound states: subProcess
  - atomic state: task
  - startEvent: init event
  - transition: sequenceFlow
- that seems to be easier actually than yed
- traverse the xml graph and create objects (all the transitions, create the hierarchy on the fly)
- then massage the created objects into the desired objects
- BUT! There is no history pseudo-states (maybe will have to add a custom element...)
  - or use the data store reference (history is also stored so could work)
- better for small graphs because it does not collapse compound states...
  - which makes sense because if collapsed what layout show? if extended what layout show? 
  - also big nodes, so harder to navigate in the end
- could be worth doing in order to achieve some cross-promotion with camunda?? 

# Now
-- the best adoption strategy is to have people play with it!! So IDE, textual language (see if I find online free graph editor), and playground...
// Port Excalidraw to kingly -- would be great demo too
// https://excalidraw.com/
// modes with each drawing tool. Sub modes with locking tool
// or maybe not - all of that could be done with a single giant state
// drawing action = drawing command parameterized by the state
// intead of changing the command itself...
// So control states useful when such staet parametrization is not practical i.e. the reactive functions are too dissimilar
/ TOP OF THE TOP: cf. https://components.studio/edit/mzK3QRdpQm6wl4JZBlGM
// - have a left/right division
// - left: tabs: code with textual language | guards | actions | effects exec | test seqs
// - right: UML viz live updated with text lang | test viz (stories kind of) | pages (live comp) | Readme | Help

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
- other example of full app: https://github.com/TrillCyborg/fullstack
- REMOVE render commands from REACT_STATE_DRIVEN!!!! put it in kingly!!! for dependency reasons
- similar to what I want to do with actor/processes/cycle : 
  - https://medium.com/dailyjs/introducing-bloc-pattern-with-react-and-rxjs-40109665bb2
- BPMN.io great for visualization - admits nested processes
  - must draw yourself the layout but thats fine
  - then will have some work to map data-element-id to machine components but doable
  - then style it to have a step-by-step debugger!!!! 
  - allow create, load, and save of .bpmn file: perfect, put that in github.
    - can I use a webpack loader?? raw-loader!! AMAZING    
- regex for tufte hexo tag: (\s*)(```)(tufte)\s+\n?([\s\S]+?)\s*(\2)(\n?|$)
- URGENT: change code and tests!! so subject factory is replace by subject!!
  - change makeWebComponentFromFsm in kingly
  - change react-state-driven, vue-state-driven etc. and all examples...
- could implement tracing with a proxy!! proxying the machien returned by createStateMachine!
- extension to processes:
  -         event
  - input -> fsm -> output
  -         event
  - actually event -> input -> fsm -> output -> event !
  - so for instance network request = command, which when executed is event
  - response is event which when received is input
  - so only difference is timing = scheduling, debouncing, delay etc.
  - to have full picture, we need the function event -> input e.g. the connectors
  - that is the only way to deal with concurrency/ similar to I/O automata
- unload all these improvements in the issues directory of each
  - add compositing of state machines. Outgoing links are parameterizable : target state, and 
  condition/action, and events? whatever necessary to customize for the functionality -> similar 
  to partial application!
  - for insance debounce is timmer running <-> timer registering, and three parameters: query 
  changed, display loading screen, and timer duration, -> similar to debounce(source, duration)
    - it is debounce (event, duration, action); but that action may update the state of the outside
- in react-state-driven, an improvement would be to have a render handler:: machineComponent, 
renderWith, params, next, directUpdate with directUpdate:: (renderWithInstance, params, next) -> 
Bool, so that returns false if no direct update. Then props update occurs on renderWith. Else 
returns true. That means that the instance state is updated directly. Be careful that the 
instance must exist for directUpdate to be called. TO THINK ABOUT 
  - could also be include a decision function: updateStateOrProps:: params -> Boolean with 
  directUpdate:: renderWithInstance, params, next -> () (don't forget postRenderCallback)
- do proxx game from google, 
  - https://github.com/GoogleChromeLabs/proxx
  - https://proxx.app/
  - have a section on modelization and show the state machines for it 
  - no routing here : great! just skip the worker things
  - and talk about it in some architecture section
  - ADD a undo/redo that is sorely missing
  - see if I do the animation or not
- do a Vue doc contribution with the sparks example in Vue!!
- CONTRACT: event emitter must be on microtask? so that event passed through the emitter are run 
before other machine events are processed? can it also be immediate/synchronous?
- shepherd - guiding user through app can be done with state machines: https://shipshapecode.github.io/shepherd/docs/welcome/
- for tutorial/demo site use graph widget https://github.com/ui-router/visualizer 
- write a nested router with fsm
  - though it should rather be a higher order component wrapping the display component
  - OnRoute(route, options, displayWith)
  - so the on route would send an init event to displayWith? or? 
- add more eventless tests
  - eventless <-> eventless with guards in both, and state modification
- do the react version of password demo from the vue one
- doc site take it from there : https://github.com/alexkrolick/testing-library-docs
  - or https://www.ably.io/documentation
  - https://github.com/axefrog/docs
- testing - talk to gleb bahmutov so it puts in cypress somehow,
  - cf. 
  
- in future version test the traceFSM for errors, error should be goign in properties directly, no throwing
- Demos
  - boulderdash game!!
  - eshop nice demo (vue) : https://github.com/sdras/sample-vue-shop / https://github.com/sdras/ecommerce-netlify
    - example of multi-step process
  - chess game
    - https://raulsebastianmihaila.github.io/chess/ : https://github
    .com/raulsebastianmihaila/chess-src THE BEST!!!
  Programs : https://reactjsexample.com/chess-game-with-react-js/, https://www.techighness.com/post/develop-two-player-chess-game-with-react-js/
    - use redux, supposedly super well written,
    - none of them do check, checkmate, etc. probably because lots of if... so do it as a 
    modification and write articles about it
    - true chess with stock fish API but have server side... underwaterchess.com , https://www.reddit.com/r/reactjs/comments/53th5k/online_chess_made_with_react_and_redux/   
    - then do chess with components to see how machines change with component (maintainability!!) https://github.com/vitogit/vue-chessboard-examples
    -    or https://pusher.com/tutorials/realtime-chess-game-react (real time chat on top)
    - or pacman : https://github.com/platzhersh/pacman-canvas, from https://superdevresources.com/open-source-html5-games/
  - dinosaur google gam : simple and known abd linkable o twnsor flow
    - https://cs.chromium.org/chromium/src/components/neterror/resources/offline.js?q=t-rex+package:%5Echromium$&dr=C&l=7
    - https://github.com/Code-Bullet/Google-Chrome-Dino-Game-AI
    - webstorm dir Genetic algorithm
  - use https://itnext.io/a-wicked-custom-elements-alternative-6d1504b5857f to have web 
  components without needing custom elements!!
  - mario game : https://github.com/mahsu/MariOCaml/blob/master/director.ml and https://github.com/reasonml-community/Mareo 
  - could also reuse shop microfrontends : https://micro-frontends.org/
  - game demo with https://codeincomplete.com/posts/javascript-gauntlet-foundations/, also boulder 
    dash
  - simple game demo : snake with ivi
     - https://github.com/localvoid/ivi-examples/tree/master/packages/apps/snake
  - good example of routing and animations : https://page-transitions.com/, https://github.com/sdras/page-transitions-travelapp
  - maybe this https://buttercms.com/blog/build-a-beautiful-animated-news-app-with-vuejs-and-vuetify
    - LOW PRIORITY - but good as a Vue example and also adding states to the fetch (handling errors)
    which are not in the current version
    - THIS absolutely : music player!! https://github
    .com/Upmostly/react-use-context-hook/blob/master/src/hooks/useMusicPlayer.js ??

- Promote
  - finish react-state-driven then vue-state-driven
  - vue-state-driven to put in awesome vue : https://github.com/sdras/awesome-vue
    - https://github.com/sdras/awesome-vue#examples
  - look if I can put react-state-driven in awesome react if any
  - finish react-state-driven then write ivi component as ivi hook then publish to ivi example
    - https://github.com/localvoid/ivi/tree/master/packages/ivi, https://github.com/localvoid/ivi#apps
  - put in svelte awesome : https://github.com/sveltejs/awesome 

- also for webcomponenets README https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance 
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
- think about debugger for state machine - basically a UI around traceFSM
  - could use http://wso2.github.io/VizGrammar/samples/ to dynamically update the graph
    - remains to be seen how to add interactivity (event handling) to the graph though
  - that is the best way to explain the state machine behavior!!
  - review the format for the visualizer
  - need to find a way to outline the current control state
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
 - version 1.X for entry actions and exit actions
 // TODO: analyze edge case : I pile on entry transitions decorateEntry(decorateEntry(...))
 // - what happens if same entry transition twice? should be ok, same order, both will apply, write a test
 // NO!! A -ev-> B ACT1
 // NO!! Entry B : ACT2
 // NO!! Entry B : ACT3
 // decorate(ACT2, decorate(ACT3, ...) -> [ACT1, ACT3, ACT2]!!
 // test and DOC it (but that should be another version right?) maybe include in this one after all
 // TODO : DOC that decorated actions should also be tryCatch separately for better error tracking - otherwise the
 // error will be caught, but it will not be possible to identify which action (transition or decorated) caused the
 // problem
- would be good to have a `reset` function which puts the machine back in starting position and 
 returns a clone of it.
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

# Didactic
- implement auto-complete field with state machines
  - will use history states and pre-emption (cancelling tasks)
- implement a page with two autocomplete fields, and which returns availability of, say, seats,
provided the autocomplete fields fulfill some validity rules (part of a given list) orig-dest
  - shows how to reuse a graph into another one?? to check
  - that will show benefits of hierarchical state machines
- then move to multi-step workflow full example
- could show auto-complete example in react with same library
- could show auto-complete example in angular with same library
LOTS OF WORK
do the design on spare time but work rather on the dev tool!!! that is the killing thing

# to think about
- modelling tool for visual DSL!! https://github.com/webgme/webgme
- already one exists for state machines. Complex but already exists. Would be good to have a
plugin to exchange format between the two!! That way I don't have to do a tracer myself!.!.!
- compiler to js : spec -> js code

# NOTE
you can remove some guards by giving them different event names and generating those. That is if
you can access the data which serve to compute the guard at event triggering time!!

# Trivia
- example of game state machine (tetris) : https://www.colinfahey.com/tetris/tetris.html?utm_source=ponyfoo+weekly&utm_medium=email&utm_campaign=146

#testing
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
