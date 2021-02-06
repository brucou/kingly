# Functional vs. class API
We could define the machine through a class constructor or a function factory. 
A class constructor creates a type, allows naturally encapsulating private data (internal state of the machine), and lets us extend the machine design in the future by adding methods to the class. This could be useful to add `clone` methods for instance.

A function factory, on the other hand, is arguably an interface closer to the denotational semantics of the machine: a machine IS a functional computation. The function factory approach additionally does not preclude using a class syntax in the future while a class syntax precludes from using a functional interface forever. Function factory can have internal state stored in closure. Adding methods is not possible. However, we worked around having to add a clone function by adopting two functional interfaces:
- one with a stateful (impure) functional interface: I (S) => O (S')
- one with a pure functional interface S x I => O X S

There is thus no longer a need to clone the machine produced by a factory. Cloning the state is what we actually want. The machine itself, i.e. its definition should be immutable: we are not changing the machine, only its state.
 
This is a subjective point but I believe that the functional interface works best for the current, and leaves the flexibility to switch to another design later on, should the need occur.

Additionally, the pure functional interface is useful to folks who wants to store the machine state out-of-process, and also for testing, to avoid recreating and rerunning a test sequence to put a machine back in a given state.
