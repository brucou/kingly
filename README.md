|Modelize your interface | Encode the graph | Run the generated machine! |
|---|---|---|
|![password submit fsm](assets/password%20submit%20fsm.png) |![password selector fsm transitions](assets/password%20selector%20transitions%20code.png)|![password selector](assets/password%20selector.png)

[![npm version](https://badge.fury.io/js/kingly.svg)](https://badge.fury.io/js/kingly)
![](https://img.shields.io/bundlephobia/minzip/kingly.svg)
![](https://img.shields.io/github/license/brucou/kingly.svg)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)

# Table of Contents
- [Features](#features)
- [Documentation](#documentation)
- [Examples](#examples)
- [Tooling](#tooling)
- [Motivation](#motivation)
- [Install](#install)
- [Tests](#tests)
- [Integration with UI libraries](#integration-with-ui-libraries)
- [API design](#api-design)
- [Visualization tools](#visualization-tools)
- [Credits](#credits)
- [Roadmap](#roadmap)
- [Who else uses state machines](#who-else-uses-state-machines)
- [Annex](#annex)
  * [So what is an Extended Hierarchical State Transducer ?](#so-what-is-an-extended-hierarchical-state-transducer--)
  * [Terminology](#terminology)

# Features
This library enables you to implement the **behaviour** of your user interfaces or components as 
state machines. The behaviour is the relation between the actions performed on the user 
interface (button clicks, etc.) and the actions (commands) to perform on the interfaced systems 
(fetch data, display screens, etc.). You specify the machine as a graph. The library computes a function which 
 implements the state machine which specifies the behaviour. You **drive** your interface with 
 that function, you **display** the UI with the UI framework of  your choice. 

Salient features:

- **small size**: implementation treeshakeable to 5KB core, [compilable to 1KB-2KB](https://github.com/brucou/slim)
- **small API**: one function for the state machine
9- **just a function!**: easy to integrate into any front-end framework

# Documentation
All documentation can be accessed in the [dedicated web site](https://brucou.github.io/documentation/).

# Tooling
Kingly has been used to implement large applications such as [Conduit](https://github.com/gothinkster/realworld), a simplified [Medium](https://medium.com/)'s clone. On such a large machine, the process has been significantly smoothed by using the free professional graph editor [yEd](https://www.yworks.com/products/yed) to produce the machine graphs.

In summary, Kingly has the following tools available:

- yEd graph editor ([documentation](https://brucou.github.io/documentation/v1/tooling/graph_editing.html))
  - yEd graphs are saved as `.graphml` files    
- yed2kingly converter ([documentation](https://brucou.github.io/documentation/v1/tooling/graph_editing.html#yed2Kingly))
  - the converter enables the conversion of `.graphml` files to Kingly state machines 
- compiler ([documentation](https://brucou.github.io/documentation/v1/tooling/compiling.html))
  - the compiler compiles a `.graphml` file into small, plain, zero-dependency JavaScript which implements the logic expressed in the graph 
- devtool ([devtool](https://brucou.github.io/documentation/v1/tooling/devtool.html))
  - traces a Kingly machine computation. The devtool is of invaluable help while testing and debugging.

![devtool screenshot](https://brucou.github.io/documentation/images/extension/courtesan%200.png)
  
# Examples
You can review the following examples which have been implemented with the same state machine, across different UI frameworks, with links to the corresponding codesandboxes. Note that the examples may use older versions of Kingly.

## Trivial counter application
| State Machine | Demo |UI library 
|---|---|---|
|![trivial counter fsm](https://brucou.github.io/documentation/graphs/trivial%20counter%20machine.png)|![trivial counter demo](assets/counter%20app%20demo.gif)|[Vanilla JS](https://codesandbox.io/s/w6x42521n7)

## Password meter
| State Machine | Demo |  UI library
|---|---|---|
|![password submit fsm](assets/password%20submit%20fsm.png)|![password meter demo](assets/password%20selector%20demo%20animated.png)|[Vanilla js](https://codesandbox.io/s/mqx96pm64j)<br>[Nanomorph](https://codesandbox.io/s/73wy8jwk86)<br>[Vue](https://codesandbox.io/s/l9o1qknoz7)

## Movie database search interface
| State Machine | Demo |  UI library
|---|---|---|
|![movie app machine](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20no%20emphasis%20switchMap.png)|![movie app demo](assets/movie%20app%20demo%20init.png)|[Vue](https://codesandbox.io/s/p7xv6r1moq)<br>[React](https://codesandbox.io/s/ym8vpqm7m9)<br>[Ivi](https://codesandbox.io/s/3x9x5v4kq5)<br>[Inferno](https://codesandbox.io/s/9zjo5yx8po)<br>[Nerv](https://codesandbox.io/s/o4vkwmw7y)<br>[Svelte](https://github.com/brucou/movie-search-app-svelte)

## Wizard forms
| State Machine | Demo |UI library 
|---|---|---|
|![wizard form machine](https://github.com/brucou/cycle-state-machine-demo/raw/first-iteration-fix/public/assets/images/graphs/sparks%20application%20process%20with%20comeback%20proper%20syntax%20-%20flat%20fsm.png)|![wizard form demo](https://github.com/brucou/cycle-state-machine-demo/raw/first-iteration-fix/public/assets/images/animated_demo.gif)|[Cycle JS](https://github.com/brucou/cycle-state-machine-demo/tree/first-iteration-fix)

# Motivation
This library fundamentally implements computations which can be modelized by a type of state 
machines called hierarchical extended [state transducer](https://en.wikipedia.org/wiki/Finite-state_transducer). This library offers a way to define, and use such transducers. 

The major motivation for this library is the specification and implementation of user interfaces. 
As a matter of fact, to [every user interface can be associated a computation](http://brucou.github.io/documentation/v1/contributed/User%20interfaces%20as%20reactive%20systems.html) relating 
inputs to the user interface to an action to be performed on the interfaced systems. That 
computation often has a logic [organized around a limited set of control states](http://brucou.github.io/documentation/v1/tutorials/password-meter.html), and can be advantageously modelized by a state machine. 

[**Jump to the tutorials**](https://brucou.github.io/documentation/v1/tutorials/).

This library was born in early 2016 from:

- the absence of existing javascript libraries which satisfy our [design criteria](https://github.com/brucou/state-transducer#api-design)
  - mostly, we want the state machine library API design to be as close as possible from the mathematical object denoting it. This should allow us to reason about it, compose and reuse it easily. 
  - most libraries we found either do not feature hierarchy in their state machines, or use a rather imperative API, or impose a concurrency model on top of the state machine's control flow

In the four years of existence and use of this library, we reached an API which should be fairly stable. It has been used succesfully for user-interfaces as well as in other contexts:

- in multi-steps workflows: see an example [here](https://github.com/brucou/component-combinators/tree/master/examples/volunteerApplication), a constant feature of enterprise software today
- for ['smart' synchronous streams](https://github.com/brucou/partial-synchronous-streams), which tracks computation state to avoid useless re-computations
- to implement cross-domain communication protocols, to coordinate iframes with a main window

In such cases, we were able to modelize our computation with an Extended Hierarchical State Transducer in a way that:

- is economical (complexity of the transducer proportional to complexity of the computation)
- is reasonably easy to reason about and communicate (the transducer can be visually represented)
- supports step-wise refinement and iterative development (control states can be refined into a hierarchy of nested states)
 
# Install
`npm install kingly --save`

Cf [documentation](http://brucou.github.io/documentation/v1/tutorials/installation.html)

# Tests
To run the current automated tests: `npm run test`

# Integration with UI libraries
The machine implementation is just a function. As such it is pretty easy to integrate in any 
framework. In fact, we have implemented the same interface behaviour over [React](https://codesandbox.io/s/ym8vpqm7m9), [Vue](https://codesandbox.io/s/p7xv6r1moq), [Svelte](https://github.com/brucou/movie-search-app-svelte), [Inferno](https://codesandbox.io/s/9zjo5yx8po), [Nerv](https://codesandbox.io/s/o4vkwmw7y), [Ivi](https://codesandbox.io/s/3x9x5v4kq5) with the exact same fsm. By isolating your component behaviour in a fsm, you can delay the UI library choice to the last moment.

# API design
The key objectives for the API was:

- **generality**, **reusability** and **simplicity** 
  - there is no explicit provision made to accommodate specific use cases or frameworks
  - it must be possible to add a [concurrency and/or communication mechanism](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.92.6145&rep=rep1&type=pdf) on top of the current design
  - it must be possible to integrate smoothly into React, Angular and your popular framework
  - support for both interactive and reactive programming
- parallel and sequential composability of state machines

As a result of this, the following choices were made:

- **functional interface**: the Kingly state machine is just a function. As such, the machine is a black-box, and only its outputs can be observed
- **complete encapsulation** of the state of the machine
- **no effects** performed by the machine
- no exit and entry actions, or activities as in other state machine formalisms
  - there is no loss of generality as both entry and exit actions can be implemented with our  state machine. There is simply no syntactic support for it in the core API. This can however be provided through standard functional programming patterns (higher-order functions, etc.)
- every computation performed is synchronous (asynchrony is an effect)
- action factories return the **updates** to the extended state to avoid any 
unwanted direct modification of the extended state (API user must provide such update function, 
which in turn allows him to use any formalism to represent state - for instance `immutable.js`)
- no restriction is made on output of state machines, but inputs must follow some conventions (if a
 machine's output match those conventions, two such machines can be sequentially composed
- parallel composition naturally occurs by feeding two state machines the same input(s))
  - as a result, reactive programming is naturally enabled. If `inputs` is a stream of 
well-formatted machine inputs, and `f` is the fsm, then the stream of outputs will be `inputs.map
(f)`. It is so simple that we do not even surface it at the API level.

Concretely, our state machine will be created by the factory function `createStateMachine`, which returns a state machine which:

- immediately positions itself in its configured initial state (as defined by its initial control
 state and initial extended state) 
- will compute an output for any input that is sent to it since that

Let us insist again on the fact that the state machine is not, in general, a pure function of 
its inputs. However, a given output of the machine depends exclusively on the sequence of inputs 
it has received so far ([causality property](https://en.wikipedia.org/wiki/Causal_system)). This means that it is possible to associate to a state machine another function which takes a sequence of inputs into a sequence of outputs, in a way that **that** function is pure. This is what enables simple and automated testing.

# Visualization tools
We have included two helpers for visualization of the state machine:

- conversion to plantUML: `toPlantUml :: FSM_Def -> PlantUml`
  - the resulting chain of characters can be pasted in [plantText](`https://www.planttext.com/`) or [plantUML previewer](http://sujoyu.github.io/plantuml-previewer/) to get an automated graph representation. Both will produce the exact same visual representation
- conversion to [online visualizer](https://github.com/brucou/state-transducer-visualizer) format (dagre layout engine): for instructions, cf. github directory: `toDagreVisualizerFormat :: FSM_Def -> JSON`

![visualization example](https://github.com/brucou/state-transducer-visualizer/raw/master/assets/cd-player-automatic-dagre-visualization.png)

Automated visualization works well with simple graphs, but seems to encounter trouble to generate optimally satisfying complex graphs. The Dagre layout seems to be a least worse option. I believe the best option for visualization is to use professional specialized tooling such as `yed`. We provide a CLI for conversion to `yed` graph format to facilitate such workflow (cf. [yed2Kingly](https://github.com/brucou/yed2Kingly)). The [`yed`](https://www.yworks.com/products/yed)'s orthogonal and flowchart layout seem to give pretty good results.

# Credits
- Credit to [Pankaj Parashar](https://css-tricks.com/password-strength-meter/) for the password selector
- Credit to [Sari Marton](https://github.com/sarimarton/) for the [original version](https://github.com/sarimarton/tmdb-ui-cyclejs) of the movie search app

# Roadmap
## Roadmap v1.0: complete core, set API in stone
- [x] stabilise core API
  - state machine as an effectless, impure function with causality properties
  - expose only the factory, keep internal state fully encapsulated
- [x] test [integration with React](https://github.com/brucou/react-state-driven)
- [x] test [integration with Vue](https://github.com/brucou/vue-state-driven)
- [x] support [model-based testing, and test input generation](https://pdfs.semanticscholar.org/f8e6/b3019c0d5422f35d2d98c242f149184992a3.pdf)
  - [x] *all-paths* coverage test case generator
- ~~[x] add tracing support~~
  - ~~obtained by decorating the machine definition~~
- ~~[x] add entry actions~~
- ~~[ ] babel macro for converting yed graphml and yakindu sct files~~
- ~~[ ] babel macro to compile away the machine library to reduce bundle size~~
- [x] add support for [yEd](https://www.yworks.com/products/yed) (professional graph editor)
- [x] [dev tool](https://github.com/brucou/yed2Kingly) (including documentation)
- [x] [compiler](https://github.com/brucou/slim) (including documentation)
- [ ] decide definitively on tricky semantic cases
  - transitionning to history states when there is no history
    - Qt: use the initial control state for the compound state in that case
    - cf. https://www.state-machine.com/qm/sm_hist.html
  - ~~event delegation~~ 

## Roadmap v1.X: consolidate
- [ ] support for live, interactive debugging
  - render time machine
- [x] add cloning API (useful for testing, to avoid replaying all machine inputs to get it back to a given state)
- [x] add reset API 
- [ ] document serialization support (already implemented in core, to implement in compiler too. Cf. https://github.com/brucou/kingly/issues/8)
- [ ] compiler should generate code optimized for debugging or size (not for speed, I don't believe there is much to gain there). Configurable via flags. Right now it is something in the middle.

## Roadmap v1.Y: testing
- [ ] finalize, document and release testing API 
- [ ] turn the test generation into an iterator(ES6 generator): this allows it to be composed with transducers and manipulate the test cases one by one as soon as they are produced. Will be useful for both example-based and property-based testing. When the generators runs through thousands of test cases, we often have to wait a long time before seeing any result, which is pretty damageable when a failure is located toward the ends of the generated input sequences.
- [ ] add other searches that DFS, BFS (add probability to transitions, exclude some transitions, etc.). HINT: `store.pickOne` can be used to select the next transition
   - pick a random transition
   - pick next transition according to ranking (probability-based, prefix-based or else) 

# Who else uses state machines
The use of state machines is not unusual for safety-critical software for embedded systems. Nearly all safety-critical code on the Airbus A380 is implemented with a [suite of tools](https://www.ansys.com/products/embedded-software/ansys-scade-suite/scade-suite-capabilities#cap1) which produces state machines both as [specification](https://www.youtube.com/watch?list=PL0lZXwHtV6Ok5s-iSkBjHirM1fu53_Phv&v=EHP_spl5xU0) and [implementation](https://www.youtube.com/watch?v=523bJ1vZZmw&index=5&list=PL0lZXwHtV6Ok5s-iSkBjHirM1fu53_Phv) target. The driver here is two-fold. On the one hand is productivity: writing highly reliable code by hand can be done but it is painstakingly slow, while state machines allow to **generate the code** automatically. On the other hand is reliability. Quoting Gerard Berry, founder of Esterel technologies, [<< low-level programming techniques will not remain acceptable for large safety-critical programs, since they make behavior understanding and analysis almost impracticable >>](https://ptolemy.berkeley.edu/projects/chess/design/2010/discussions/Pdf/synclang.pdf), in a harsh regulatory context which may require that every single system requirement be traced to the code that implements it (!). Requirements modeled by state-machines are amenable to formal verification and validation. 

State machines have also been used extensively in [games of reasonable complexity](http://howtomakeanrpg.com/a/state-machines.html), and [tutorials](https://www.gamedev.net/articles/programming/general-and-gameplay-programming/state-machines-in-games-r2982/) abound on the subject. Fu and Houlette, in  [AI Game Programming Wisdom 2](https://www.researchgate.net/publication/284383920_The_Ultimate_Guide_to_FSMs_in_Games) summarized the rationale: "Behavior modeling techniques based on state-machines are very   popular in the gaming industry because they are easy to implement, computationally efficient,   an intuitive representation of behavior, accessible to subject matter experts in addition to programmers, relatively easy to maintain, and can be developed in a number of commercial integrated development environments". 

More prosaically, did you know that ES6 generators compile down to ES5 state machines where no native option is available? Facebook's [`regenerator`](https://github.com/facebook/regenerator) is a good example of such.

So state machines are nothing like a new, experimental tool, but rather one with a fairly extended and proven track in both industrial and consumer applications. 

# About the name
We call this library "Kingly" to express it allows developers to rule their UI -- like a king. 
Developers define rules in the machine, in the form of control states and guards, those rules 
define what is possible and what is not, and what should happen in response to events.

And also, the other names I wanted were already taken :-).

# Acknowledgments
This library is old and went through several redesigns and a large refactoring as I grew as a programmer and accumulated experience using it. I actually started after toiling with the cyclejs framework and complex state orchestration. I was not an expert in functional programming, and the original design was quite tangled (streams, asynchrony, etc.) and hardly reusable out of cyclejs. The current design resulting from my increased understanding and awareness of architecture, and functional design.

The key influences I want to quote thus are:
- cyclejs, but of course, from which I started to understand the benefits of the separation of effects from logic
- elm - who led me to the equational thinking behind Kingly
- erlang - for forcing me to learn much more about concurrency.

# Annex
## So what is an Extended Hierarchical State Transducer ? 
Not like it matters so much but anyways. Feel free to skip that section if you have little interest in computer science.

Alright, let's build the concept progressively.

An [automaton](https://en.wikipedia.org/wiki/Automata_theory) is a construct made of states designed to determine if a sequence of inputs should be accepted or rejected. It looks a lot like a basic board game where each space on the board represents a state. Each state has information about what to do when an input is received by the machine (again, rather like what to do when you land on the Jail spot in a popular board game). As the machine receives a new input, it looks at the state and picks a new spot based on the information on what to do when it receives that input at that state. When there are no more inputs, the automaton stops and the space it is on when it completes determines whether the automaton accepts or rejects that particular set of inputs.

State machines and automata are essentially interchangeable terms. Automata is the favored term when connoting automata theory, while state machines is more often used in the context of the actual or practical usage of automata.

An extended state machine is a state machine endowed with a set of variables, predicates (guards) and instructions governing the update of the mentioned set of variables. To any extended state machines it corresponds a standard state machine (albeit often one with a far greater number of states) with the same semantics.

A hierarchical state machine is a state machine whose states can be themselves state machines. Thus instead of having a set of states as in standard state machines, we have a hierarchy (tree) of states describing the system under study.

A [state transducer](https://en.wikipedia.org/wiki/Finite-state_transducer) is a state machine, which in addition to accepting inputs, and modifying its state accordingly, may also generate outputs.

We propose here a library dealing with extended hierarchical state transducers, i.e. a state machine whose states can be other state machines (hierarchical part), which (may) associate an output to an input (transducer part), and whose input/output relation follows a logic guided by predefined control states (state machine part), and an encapsulated memory which can be modified through actions guarded by predicates (extended part).

Note that if we add concurrency and messaging to extended hierarchical state transducers, we get a statechart. We made the design decision to remain at the present level, and not to incorporate  any concurrency mechanism.[^2]

[^2]: Our rationale is as follows:  
 - statecharts include activities and actions which may produce effects, and concurrency. We are seeking an purely computational approach (i.e effect-less) to facilitate **composition, reuse and testing**. 
 - In the absence of concurrency (i.e. absence of parallel regions), a statechart can be turned into a hierarchical state transducer. That is often enough! 
 - there is no difference in terms of expressive power between statecharts and hierarchical transducers[^4], just as there is no difference in expressive power between extended state machines and regular state machines. The difference lies in naturalness and convenience: a 5-state extended state machine is easier to read and maintain than the equivalent 50-state regular state machine. 
 - we argue that convenience here is on the side of being able to freely plug in any [concurrent or communication model](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.92.6145&rep=rep1&type=pdf) fitting the problem space. In highly concurrent systems, programmers may have it hard to elaborate a mental model of the statecharts solely from the visualization of concurrent statecharts.
 - some [statecharts practitioners](http://sismic.readthedocs.io/en/master/communication.html#) favor having separate state charts communicating[^5] in an ad-hoc way rather than an integrated statechart model where concurrent state charts are gathered in nested states of a single statechart. We agree.
 
[^3]: As a matter of fact, more than 20 different semantics have been proposed to define precisely the concurrency model for statecharts, e.g Rhapsody, Statemate, VisualMate, StateFlow, UML, etc. do not share a single concurrency model.
[^4]: David Harel, Statecharts.History.CACM: Speaking in the strict mathematical sense of power of expression, hierarchy and orthogonality are but helpful abbreviations and can be eliminated
[^5]: David Harel, Statecharts.History.CACM: <<I definitely do not recommend having a single statechart for an entire system. (...) concurrency occurs on a higher level.)>>
