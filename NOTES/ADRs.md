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
=> NO! no need, we want to keep the API surface minimal. Possible via decoration

- would be good to have a `reset` function which puts the machine back in starting position and 
 returns a clone of it.
=> YES, partially done 2.2021
