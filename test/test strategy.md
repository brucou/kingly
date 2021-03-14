# API testing

- Test contracts separately

- Test errors separately
  - user-provided functions throwing
  - library throwing
 
- Test space (assuming valid machine x no errors/exceptions):
  - through incremental generation of machines
    - start with an init state => INIT space = ((atomic, compound) init control state x initial transition)
    - add a transition
      - transition can go to (atomic state, compound state, history state)
      - transition cannot go to init state (that is contract, so REMOVED from test here)
      - transition = (from, event, predicate, to, action)
        - => transition space = (atomic state, compound state) x (init event, non-init event, eventless) x (>1 predicates, 1 predicate, 0 predicate) x (atomic, (1, 2, 3 depth) compound, (deep, shallow) history)) x (action, no action)
        - ok, this is a tad incorrect, the space is smaller. init event are only allowed for compound state, but writing it properly complicates the formula. We are only generating valid machines, so this is implicit that the space if the cartesian product intersected with the space of valid machines.
    - repeat n times
 
- Properties:
  - we can't have an oracle if the machines are generated randomly. The oracle would be equivalent to having an implementation.
  - we thus need example-based testing here, which can be complemented with property-based testing.
  - we chose to do example-based testing
    - we already have examples that hopefully cover the test space in interesting ways
  - we chose not to do property-based testing:
    - writing a good machine generator may be a complex task
    - writing properties that are easy to check may require prior knowledge of the shape of the generated machine (the properties to select depend on that shape)
    - coupling properties and shape of generated machine adds to the complexity; this has to be simple enough, as we do not want to make mistakes in the tests themselves and have to test the tests...
 
- Test strategy:
  - To cover the test space, we will make test on 1 unique test case that the initial control state is equivalent to the initial transition. We will then test that the initial transition admits guards (reminder: no actions are allowed). That is 3 test cases (2, 1, 0 guards). We test guard ordering only once: the test with two guards will have true as first guard and true as the second, and we check that the second guard is not run.
  - That done, we have removed guard ordering and initial transition from the INIT test space
    - New York Hypothesis: if it makes it there, it can make it anywhere
  - We then have shortened the INIT test space to `(atomic, compound) init control state` and divided by 2 the total test space with our NY hypothesis.
 
  We make another 3 test cases to remove guard ordering for non initial transitions from the picture. NY hypothesis once again. We do make those tests again because we know that initial transitions are likely to be dealt separately in the program vs. non-initial transitions, so we increase our coverage this way. That is grey-box testing -- we use our knowledge of or our guess about the implementation.
 
  From that, we are covering the rest of the test space by generating long test sequences that cover the parts that we are intereted in. The example-based tests are taken from real examples (tutorials) that are drawn with yed and preprocessed with yed2kingly. We thus have an oracle (we manually tested the tutorials), and this way, we also test yed2kingly!
 
- Example-based tests:
  - chess game with hierarchy with undo and timer highlighted with init.graphml
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
  - routing machine v2.graphml
    - shallow history state for compound state with several sub-compound states
    - shallow history state for compound state with no sub-compound states
    - those two cases implies different calculation for the shallow history so we increase test coverage again with this, but pick well the sequence of events!!! so H is confirmed different from H*
    - eventless x compound x >1 predicates
    - eventless x atomic x >1 predicates
    - compound x eventless x >1 predicates
    - eventless x history state x >1 predicates
    - compound x event x history state x 0 predicates
  - ~~sparks application process with comeback proper syntax hierarchical fsm iter1.1.graphml~~
    - ~~nothing interesting actually, so dropped~~
  - we miss a few things like:
    - atomic state x eventless x (>1, 1) predicate x
      - we assume that:
        - it is enough to check (>1, 1, 0) predicate once on any combination to have it work in every combination
        - if eventless transition to history state, if we have a passing test for deep or shallow, the test will pass also for the shallow or deep (respectively). In other words, the nature of the history state is not connected to the eventless transition (greybox again).
        - 0, 1 action is decorrelated from the eventless nature of transitions
      - with this we should have covered the full atomic state x eventless x ... subspace
    - atomic state x event x >1 predicate
      - we assume that:
        - it is enough to check (>1, 1, 0) predicate once on any combination to have it work in every combination
          - and we did with compound state x >1 prdicate
        - .. in short we no longer pay attention to guards, guard ordering, and actions.
    - we may however continue to **pay attention to history states** as the most tricky feature
          - history state when no history for a compound state (default to init transition)
          - history state (H x H*) where there is a history - nesting level 1
          - history state (H x H*) where there is a history - nesting level 2
          - we keep a dedicated file for testing these situations
 
