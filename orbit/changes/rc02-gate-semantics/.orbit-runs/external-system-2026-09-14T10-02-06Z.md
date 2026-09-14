# External Review: rc02-gate-semantics (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-14

## CRITICAL

### A partial resolution record certifies findings it omits
**File**: src/core/artifact-graph/gates.ts:195
**Description**: `passResolved` treats a readable record as complete merely because none of the entries it contains has a substantive deferred/escalated disposition. A pass with warnings `A` and `B` therefore resolves when the latest record names only `A` as resolved and omits `B`; in a synthetic fresh/external pair followed by the trailing in-context pass, that omission was enough to certify convergence. This contradicts clause (b)'s requirement that every substantive finding be resolved and is unsafe for the real four-generation archive, where title/file shapes already drift. Require the address emit/reader to prove one resolution entry per normalized substantive source finding (or an equivalent validated cardinality contract), and treat an incomplete or unmatchable record as unreadable/unresolved; add an omission regression.

### Ambiguous same-token pair candidates are certified
**File**: src/core/artifact-graph/gates.ts:275
**Description**: `slotCandidates` rejects token equality only between the two members of one candidate. With fresh T1, two distinct external artifacts at T2, and the required trailing in-context T3, it constructs two pairs with the same later and earlier tokens, breaks the tie by the later artifact filename, and certifies the cadence. The delta's explicit token-tie scenario requires two candidate pairs with the same later token and no distinguishing earlier token to be rejected rather than certified. Detect this ambiguity across candidate pairs before the filename tie-break, return the `tie` failure, and add the exact two-external-at-T2 regression.

### A null outcome revives legacy status instead of failing safe
**File**: src/core/artifact-graph/trail.ts:279
**Description**: `normalizeDisposition` only stops fallback when a present `outcome` is an unrecognized string. For `{ "outcome": null, "status": "resolved" }`, it falls through to `status`, marks the record readable, and can override a blocking `resolution_summary`; the synthetic case with `deferred: 1` was certified. The specification allows legacy `status` only when `outcome` is absent, so every present non-recognized outcome must make the entry unreadable. Branch on property presence, return `null` for any invalid present `outcome`, consult `status` only when the property is absent, and cover null, numeric, and object outcomes.

### The gate accepts external files the strict parser rejects
**File**: src/core/artifact-graph/trail.ts:358
**Description**: The trail parser is not fence-aware and validates only that a header plus three severity-heading strings occur somewhere. A file with the three headings inside a fenced example is counted as a clean external pass, while the canonical report parser correctly rejects it; a header plus real empty headings also passes here without the required reviewer/date fields. Such a malformed or truncated return can satisfy the external half of a blind pair instead of appearing in `rejectedExternals`. Use one shared fence-aware structural parser (or enforce equivalent validation here), require the canonical metadata and severity-section shape, and add gate tests for fenced headings and missing metadata.

## WARNING

### Rejected external returns disappear from the reason below budget
**File**: src/core/artifact-graph/gates.ts:695
**Description**: Rejected returns are appended to the reason only inside the `exhausted` branch. With one malformed external and one valid independent pass against budget 3, both spend fields correctly report two, but the reason omits the rejected filename, contrary to the normative rule and its below-budget scenario. Compose the rejected-return clause independently of exhaustion, then add the budget-spent clause when applicable; test both sides of the threshold.

### Mode-less reviewed gates report a cross-mode budget
**File**: src/core/artifact-graph/gates.ts:647
**Description**: When `gateMode` returns `null`, both pass and rejected-return filters accept every mode and `budgetFields` is still emitted. A custom reviewed gate such as `review-quality` therefore reports a budget and sums proposal plus system runs, although the delta explicitly requires a reviewed gate whose mode cannot be derived from its id to report no budget at all. Suppress all budget/spend/exhaustion fields when mode attribution is unavailable (and avoid cross-mode accounting), with a custom-id regression.

### Blind-pair guidance uses weaker predicates than assignment
**File**: src/core/artifact-graph/gates.ts:350
**Description**: `diagnosePair` examines all passes without the failed slot's consumed indices or lower bound and even labels a no-walk pair `blindness-broken`; for cadence `[external, blind-pair]` with external T1 and fresh T2, the gate correctly remains uncovered but claims a walk broke blindness when none exists. Separately, `isPairable` ignores a referencing resolution at the pass's exact token because it uses `>` although the blindness rule is endpoint-inclusive, so canonical guidance can purchase a partner that cannot form a valid pair. Derive diagnosis and pairability from the same candidate predicate used by assignment, carrying failed-slot state through, and use inclusive token rejection; add both reproductions.

### Cadence backtracking grows exponentially on valid custom schemas
**File**: src/core/artifact-graph/gates.ts:312
**Description**: The depth-first search has no memoization or pruning of equivalent states. On a valid custom cadence of repeated `independent` slots followed by one unavailable `external` slot, measured runtime grew from 74 ms at 16 passes/9 slots to 260 ms at 18/10, 1.1 s at 20/11, and 4.5 s at 22/12. The schema places no practical cadence-length bound, so a status read can become unusable on a modest trail. Add dynamic-programming/memoized failure states or a polynomial ordered-assignment algorithm, and retain an adversarial performance regression (or explicitly bound cadence complexity in schema validation).

### Verify emits implement behavior absent from this change's delta
**File**: src/core/emit-composition.ts:213
**Description**: The implementation now asks the gate graph for the system-review command, so v4 verify emits can begin with `--fresh`, but the active baseline `orbit-run-summary-emit` requirements still normatively require the bare `/orbit:review --as system <name>` form and forbid fresh-context qualifiers. The change's tasks acknowledge assigning those requirement edits to rc02c while this change already ships the code, leaving the applied artifact/spec state contradictory. Either include the corresponding MODIFIED requirement blocks in the change that alters the behavior or land the implementation atomically with rc02c; add parity tests against the resulting normative text.

### The removed confirmation-set rewrite remains in declared scope
**File**: orbit/changes/rc02-gate-semantics/design.md:41
**Description**: D3 says the confirming-pass-set rewrite was removed to `rc02c-confirmation-semantics`, yet the goals still promise confirmation over a whole cadence slot, the proposal's Modified Capabilities still says clause (c) "confirms over the slot's pass set," and the touchpoints still name "the confirming pass set." The shipped delta and code instead retain the most-recent-independent predicate. Scrub or rewrite those scope declarations to describe only the shipped substantive-finding change and point the set semantics to rc02c, so reviewers and downstream stages do not treat removed behavior as delivered.

## SUGGESTION

None.

## Notes

Adversarial execution covered invented trails with missing and in-context-only passes, stale applies, same-second events, competing candidate pairs, malformed and mixed-generation resolution entries, rejected external returns, mode attribution, and custom cadences. I also evaluated the archived address-review records with the delta's exact readability predicate; the generations remain computable, but their title/file drift reinforces that resolution completeness must be demonstrated rather than inferred from one readable entry. The R-crc-1 remeasurement is 3 capabilities, 9 requirement blocks, 52,216 delta bytes, and 18 task checkboxes: the design's disclosure is materially accurate, with the byte guide exceeded and the other axes within their ceilings.
