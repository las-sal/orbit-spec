# External Review: rc02c-confirmation-semantics (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-21

## CRITICAL

None.

## WARNING

### Undeclared budget survives in the public status object as an undefined key

**File**: src/core/artifact-graph/instruction-loader.ts:427
**Description**: Task 2.3b and the modified requirement say `budget` is present only when declared, never as an undefined-valued projected key. `computeGateStates` honors that, but `formatChangeStatus` unconditionally reconstructs every row with `budget: g.budget`. On a schema with no budget, `Object.hasOwn(row, "budget")` is therefore true even though JSON serialization hides the key; an in-process consumer of this exported public function can still mistake the row for a declared budget. Project optional fields with conditional spreads and add the no-budget assertion at the `formatChangeStatus` layer, not only against `computeGateStates`.

### The status requirement promises a human-row budget the implementation intentionally removed

**File**: orbit/changes/rc02c-confirmation-semantics/specs/orbit-engine-gates/spec.md:503
**Description**: This requirement says `orbit status --change <name>` renders gate rows with both `budget` and `independentSpend`, but the same delta says rendered rows show `independentSpend` alone, and `status.ts` now prints only `[spend N]`. The JSON projection correctly carries the two fields separately, so the intended split is recoverable, but this sentence would archive a false human-surface requirement. State explicitly that human rows render spend alone while JSON rows carry the optional declaration and the recorded spend as separate fields.

### A public gate reason still claims convergence

**File**: src/core/artifact-graph/gates.ts:731
**Description**: The change's central boundary says the engine no longer computes whether the change has converged, yet a passed gate with deferred suggestions emits `reason: "converged with ..."`; that reason reaches human status and JSON. This is not merely an internal variable name: it is the exact readiness claim the change says moves to rc04's record. Render `passed with N SUGGESTION-grade findings deferred` (and align the delta scenario wording) so the public surface reports the process fact it actually owns.

### The retained budget is still documented as a bound

**File**: orbit/changes/rc02c-confirmation-semantics/specs/orbit-engine-gates/spec.md:436
**Description**: The modified declaration requirement says an absent budget means "unbounded", directly after saying the field is inert and nothing consults it. The public `NormalizedGate` and `GateStatus` comments repeat "independent-pass ceiling" and "unbounded" (`types.ts:112`, `gates.ts:43`), while `GateStatusRow` still describes a trigger count and annotation (`instruction-loader.ts:147`). This preserves exactly the landmine D3 says the change must close: readers are still told the declaration constrains execution. Replace those descriptions with "declared expectation; absent means no expectation declared" and remove the retired trigger vocabulary.

### The modified requirement normatively references a deleted matching rule

**File**: orbit/changes/rc02c-confirmation-semantics/specs/orbit-engine-gates/spec.md:88
**Description**: Resolution completeness and deferred-suggestion deduplication are defined as using the same key as "the new-finding match", but that match and `hasNewFindings` are deleted with clause (c). The duplicate references at line 136 and in `gates.ts` comments now point to no live rule, so a future implementer cannot derive the key without archaeology. Specify the tuple directly at both sites—trimmed title plus repo-relative file—and remove the dead cross-reference.

### The scenario-accounting section is not the full audit it claims to be

**File**: orbit/changes/rc02c-confirmation-semantics/design.md:247
**Description**: A mechanical baseline/delta comparison shows scenario rewrites outside the two requirements listed here: the gate-aware-status budget-token scenario is replaced by `Spend never renders a position token`, the gate-reason spend scenario is replaced by `The reason names the rule, never the spend`, and `Apply-complete recommends the engine's canonical next` changes under `orbit-run-summary-emit`. The last is anticipated by task 4.1 and the first two are appropriate consequences of the deletion, but line 270 still claims every other scenario across all eight requirements is byte-identical. Expand the accounting to name all three rewrites or narrow the completeness claim.

### The active rc10 charter still requires the deleted exhaustion signal

**File**: orbit/architecture/clean-up-review-cycle.md:1476
**Description**: The post-apply architecture amendments mark Q-crc-19 delivered, but the future `rc10-apply-closure` charter still says the seam SHALL branch on any gate carrying `budgetExhausted` and adds an "exhausted" exit condition. Q-crc-12's standing recommendation at lines 347-360 says the same. That field no longer exists, so the active plan now instructs a later stage to consume an impossible signal. Amend or explicitly supersede Q-crc-12/rc10 so the seam is framed only in terms of live gate states and whatever readiness record ultimately replaces the old exhaustion path.

## SUGGESTION

### The mode-less spend test still reads the retired field and misses the surviving invariant

**File**: test/core/artifact-graph/rc02-gate-semantics.test.ts:742
**Description**: The mode-less-gate case still asserts `g.budgetExhausted === undefined`, even though that property was removed from `GateStatus`, and never asserts the new live rule that a mode-less reviewed gate reports no `independentSpend`. Vitest transpilation lets this stale property access pass without type-checking, so the suite is green while the intended mode-attribution invariant is uncovered. Assert `independentSpend` is absent and, if a deletion regression check is wanted, use an explicit structural `in` check through `Record<string, unknown>` as the other rc02c tests do.

## Notes

The build, full test suite, strict validation, fingerprint check, affected CLI surfaces, and archived-trail comparison all behaved as the change record describes. I mechanically compared all eight MODIFIED requirements against their archived baselines; apart from the unaccounted but intentional rewrites called out above, preserved scenarios were byte-identical. The declared perspective and critical-path lens files are absent, so those two passes were skipped; the real lifecycle and both status projections were walked instead.
