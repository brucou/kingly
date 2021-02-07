/**
 * Tests include:
 * - flat machines, i.e. machine without compound states
 * - machines with hierarchy and advanced features (e.g., history)
 * - stateful and pure machine APIs
 * - conversion to plantUML
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
