/**
 * Tests include:
 * - APIs
 * TODO: update after updating tests with the 4 identified main test cases. Cf. test strategy
 * keep issue 5
 *   The test strategy consists of testing separately simple and complex machines; and
 *   stateful and pure APIs, e.g. covering the space (simple, complex) x (stateful, pure):
 *   - flat machines, i.e. machine without compound states
 *   - machines with hierarchy and advanced features (e.g., history)
 * - conversion to plantUML
 * - visualizer
 * - regression tests linked to solved issues
 * - miscellaneous auxiliary functions
 */
import './no-hierarchy.specs'
import './no-hierarchy-pure.specs'
import './no-hierarchy-with-init-control-state-specs'
import './hierarchy.specs'
import "./convert-to-plantuml.specs"
import "./online_visualizer_translation.specs"
import "./utils.specs"
import './contracts.specs'
import './errors-specs'
import './contracts.ad-hoc.specs'
import './issue-5.specs'
QUnit.dump.maxDepth = 50;


