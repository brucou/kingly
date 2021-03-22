// Core API testing
// cf. test/test strategy.md
// 1. Testing stateful API (createStateMachine)
import './example-chess.specs'
import './example-routing.specs'
import './errors-specs'
import './contracts.specs'
import './contracts-ad-hoc.specs'

// 2. Testing pure API (createPureStateMachine)
import './no-hierarchy-pure.specs'
import './example-routing-pure.specs'

// Legacy tests
// It does not cost anything to leave them here
// but if they need update for some reason, remove them
import './no-hierarchy.specs'
import './no-hierarchy-with-init-control-state-specs'
import './hierarchy.specs'

// Regression test issued from reported bugs
import './issue-5.specs'

// Tests for intermediary functions (i.e. byproducts of the impl.)
import "./utils.specs"

// Other tests
import "./convert-to-plantuml.specs"
import "./online-visualizer-translation.specs"

// This is to get deeper QUnit object dumps, else the actual/expected object diff.
// appears enpty which is fairly misleading
QUnit.dump.maxDepth = 50;
