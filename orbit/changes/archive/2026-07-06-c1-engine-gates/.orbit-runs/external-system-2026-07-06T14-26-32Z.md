# External Review: c1-engine-gates (system mode, iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-06

## CRITICAL

### Stale unresolved review passes can be bypassed by later clean cadence
**File**: src/core/artifact-graph/gates.ts:286
**Description**: `computeReviewedStatus` filters the trail down to non-stale passes, evaluates `evaluateReviewed(gate, fresh, trail)`, and immediately returns `passed` when that fresh-only subset converges. That means clause (b)'s "resolution over EVERY pass" check only runs over fresh passes, not every same-gate pass in the audit trail. I reproduced `review-system` passing and recommending `/orbit:archive` with an older unresolved system review carrying a WARNING, a later `apply-*.json` making that pass stale, and then a clean in-context/external/in-context cadence after the apply. The contract in `orbit-engine-gates` and the review spec says any unresolved gate-relevant pass blocks convergence, even when other branches are satisfied. Compute unresolved findings over all relevant same-gate passes before allowing a pass state; use freshness only for cadence coverage and stale reporting, or explicitly change the spec if stale unresolved findings are meant to be exempt.

### Malformed external findings files count as clean external passes
**File**: src/core/artifact-graph/trail.ts:192
**Description**: `parseExternalMarkdown` initializes all severity counts to zero and returns a completed external `TrailPass` even when the file has no required external-review structure or severity sections. I reproduced `review-system` passing with a file named `external-system-<TS>.md` whose content was just plain text, plus clean surrounding in-context passes. That treats an invalid external artifact as a clean external review and can advance the gate to archive without a real external pass. The specs require clean Path A only when the severity sections parse confidently as empty, and malformed/empty external markdown should be treated as not-clean/default unresolved. Validate the expected markdown shape before returning a pass, or return a pass that cannot satisfy clean convergence and points to address/re-review.

## WARNING

### Malformed address-reviews emits can resolve findings
**File**: src/core/artifact-graph/trail.ts:175
**Description**: `parseAddressReviews` defaults missing `resolution_summary.deferred` and `resolution_summary.escalated` to `0`, so an address-reviews JSON with only `source_path` is treated as a successful resolution. I reproduced `review-system` passing with an external WARNING and an address-reviews JSON that omitted `resolution_summary` entirely. The spec requires those fields to show `0`, and the edge-case contract says missing required fields are treated as if no address-reviews run exists. Preserve invalid/missing resolution fields as unresolved and require both fields to be present numeric zero in `passResolved`; also consider replacing the current basename-only source match with exact repo-relative target normalization so dangling or mistargeted paths cannot resolve a pass.

### Canonical next and position readout use declaration order instead of gate edges
**File**: src/core/artifact-graph/instruction-loader.ts:411
**Description**: `formatChangeStatus` scans `computation.gates` in normalized declaration order when choosing `next_command`, and `buildPositionReadout` similarly iterates the passed-in gate list despite its comment saying edges are used. A schema that declares `apply` before `review-proposal` while `review-proposal.before: apply` currently reports `next_command: /orbit:apply <change>` and position `propose ✓ -> apply ready -> review(proposal) unpassed`, even though the `before` edge makes the unpassed review gate the active frontier. The spec says step order follows `requires`/`before` edges with declaration order only as a tie-breaker. Build a graph/topological flow order from `requires` and `before`, and use that order consistently for position and canonical-next selection.

## SUGGESTION

### Actual NUL bytes make the main gate source look binary
**File**: src/core/artifact-graph/gates.ts:113
**Description**: The finding key separator in `hasNewFindings` is an actual U+0000 byte inside the TypeScript source. Git reports `src/core/artifact-graph/gates.ts` as binary in `git diff --stat`, and ripgrep treats it as a binary file, which hides the most important C1 engine file from normal text review/search tooling. Replace the literal NUL with a printable unlikely separator or an escaped string representation so the file remains ordinary UTF-8 text.

## Notes

Verification run:

- `node bin/orbit.js validate c1-engine-gates --strict` passed.
- `npx vitest run test/core/artifact-graph/gates.test.ts` passed: 25/25.
- Full `npx vitest run` executed after `npm ci`; 1545/1569 tests passed, with 24 command tests failing because this workspace path contains a space (`New project 2`) and those tests invoke `node ${openspecBin}` without shell-quoting the path, causing Node to look for `/Users/sal/Documents/New`. I treated that as an environment-sensitive pre-existing test harness issue rather than a C1 gate finding.
