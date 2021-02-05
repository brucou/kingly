# Done
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

- compiler to js : spec -> js code
