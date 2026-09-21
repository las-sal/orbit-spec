# External Review: rc02c-confirmation-semantics (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-21

## CRITICAL

None.

## WARNING

### The deleted new-finding match still anchors active engine documentation

**File**: src/core/artifact-graph/gates.ts:197
**Description**: The walk replaced the dead "new-finding match" cross-reference in the modified requirement, but the same retired rule still defines the key in the resolution-completeness comment here, the deferred-suggestion comment at lines 215-217, and the public `TrailFinding` comment in `trail.ts:28`. There is no live new-finding match after clause (c)'s removal, so these comments still require archaeology to discover the actual contract and leave the iteration-1 vocabulary finding only partially resolved. Name the key directly at each site as the normalized tuple of trimmed, case-sensitive title plus repo-relative file.

### The projection comment contradicts the newly specified surface split

**File**: src/core/artifact-graph/instruction-loader.ts:149
**Description**: This comment says a new gate-status field reaches JSON only when it is also named in the human gate row. The modified requirement now deliberately specifies the opposite for `budget`: the declaration is JSON-only while the human row renders recorded spend alone. The conditional-spread implementation correctly preserves that split, but its adjacent maintainer guidance would tell a future change to collapse it. Rewrite the comment to say that JSON projection is explicit and field-by-field, while human rendering is an independent surface; likewise update `gates.ts:678`, where `computeSpend` is still described as computing "two spend figures" even though `budget` is a declaration and is no longer computed or bundled there.

## SUGGESTION

### The tests do not pin the changed reason prefix or the blocked mode-less hoist

**File**: test/core/artifact-graph/rc02-gate-semantics.test.ts:162
**Description**: The deferred-suggestion assertion matches only the suffix, so the retired `converged with ...` reason and the new `passed with ...` reason both satisfy it. The mode-less declaration test at lines 733-750 exercises the live reviewed-status path, while the blocked test at lines 786-795 uses a mode-derived `review-system` gate and therefore never reaches the new mode-less blocked branch. The current implementation behaves correctly in both cases, but either regression would remain green. Assert the full passed reason (or at least its `passed with` prefix), and add a blocked `peer-check` case that requires `budget` to remain present while `independentSpend` remains absent.

## Notes

I executed the engine rather than relying on the diff: a branch matrix covered live and blocked reviewed gates, derivable and underivable modes, and declared and undeclared budgets; the projected rows preserved exactly the same key presence, and a deferred-suggestion trail produced the new `passed with ...` reason. The build, the 99 affected gate tests, the full 2,205-test suite, strict validation of all 26 items, the change fingerprint check, and diff whitespace validation all passed. The declaration hoist, conditional spreads, and public reason are sound in the implementation; the residual risk is that the comments and under-specific assertions do not preserve that result against later edits. The declared project, convention, and lens files are absent, so those passes were skipped as instructed.
