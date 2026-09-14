# External Review: rc02-gate-semantics (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-12

## CRITICAL

### The canonical merged walk has no trail representation
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:193
**Description**: Clause (b) resolves each pass only through an `address-reviews` record whose singular `source_path` references that pass, while the shipped address workflow makes `--from-file` exclusive to one input and emits one singular `source_path` (`orbit/specs/orbit-address-reviews/spec.md:17,62`). The delta nevertheless requires one walk to resolve both blind-pair members in the scenario at lines 295–300, and R-crc-4/rc03 require one merged walk. A real one-walk record can match at most one member, so the other remains unresolved forever; a synthetic test that makes one record resolve both would describe a trail the product cannot produce. Either make rc02 explicitly use two post-pair walks until rc03 adds merge support, or assign and specify a multi-source representation (`source_paths` or per-resolution provenance) in the stage that owns the merge, then test the full emitted-record-to-gate path.

### A CRITICAL pair has no defined convergent successor
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:207
**Description**: The confirming set is defined as both members of the earliest `blind-pair`, so for external T1 carrying one CRITICAL plus clean fresh T2, resolving the findings, running the trailing check, and then adding clean independent T5 does not change that set: it remains T1/T2 and clause (c) continues to see T1's CRITICAL. Lines 219–221 simultaneously say the one later pass “becomes the new confirming set,” but give no rule that replaces the cadence-selected pair or proves that pass is on the walked state. At budget 3 the spend is then exhausted, yet the budget scenario keeps the canonical next command unchanged, so the engine can request T6, T7, and beyond. Specify the complete critical transition—what token boundary the extra pass must beat, when it replaces the pair, whether another verification is required, and what recommendation occurs at exhaustion—and add a constructed five-pass test that actually reaches `passed`.

### The trailing check can run before the walk it claims to verify
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:339
**Description**: `[blind-pair, in-context]` orders the in-context pass after the pair's later pass, but clause (b) places no ordering constraint between that pass and the resolution walk. A trail with external T1, fresh T2, clean in-context T3, then resolution record(s) at T4/T5 satisfies coverage; after the later walk resolves the pair, clause (b) and a no-CRITICAL clause (c) also hold, so the gate passes even though T3 never read the walk's diff. This contradicts the line's claimed safety property and R-crc-4's pair → walk → verification order. Require the trailing pass token to be strictly later than every resolution record that closes the confirming review set (and any resulting edits), and test the pre-walk-pass ordering as unpassed.

## WARNING

### The near-ceiling proposal blind pair is not computed by any stage
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:325
**Description**: R-crc-4 requires proposal mode to use a blind pair when the change is within 20% of the size ceiling, and lines 340–343 use that pair to justify `review-proposal`'s budget of 3. But v4 leaves the proposal cadence permanently `[independent, in-context]`; neither the gate schema nor any task computes size proximity or conditionally changes the slot, and rc03's charter does not name this missing conditional. A near-ceiling proposal can therefore converge after one independent pass. Assign ownership explicitly and specify a computable condition/cadence (or remove the conditional ruling and its budget rationale), with boundary tests at both sides of the 20% threshold.

### Same-second tokens make blindness and pair selection ambiguous
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:181
**Description**: Trail tokens are only second-granular, and cross-prefix events can legitimately share one token. With external and fresh passes at T and a walk of one member also at T, the strict-between predicate sees no intervening walk and can certify a pair whose blindness is unknowable. With multiple pair candidates sharing the same later token, “earliest” also has no tie-break; different iteration order can select different members and therefore different CRITICAL outcomes. Define a total event order or fail safe on equality (for example, reject ambiguous pairs and treat a matching resolution at either endpoint as breaking blindness), then cover same-token passes, walks, and tied candidate pairs.

### Malformed external results vanish from both spend and diagnosis
**File**: src/core/artifact-graph/trail.ts:247
**Description**: `parseExternalMarkdown` returns `null` unless the header and all three sections are recognized, and `readTrail` then omits the artifact entirely. Under the proposed budget, a returned external review that cost a model run but has one malformed heading counts as no spend, while the teaching reason reports only that the external partner is missing and recommends buying another run. That conflicts with “spend is spend” and is not actionable without inspecting the directory. Preserve rejected-pass diagnostics separately from cadence-eligible passes: invalid results must not satisfy coverage, but their attempt should be visible in spend/reason (or the proposal must explicitly define why malformed returns are free), with a malformed-external test.

### The legacy fallback misses the actual v3 resolution shape
**File**: orbit/changes/rc02-gate-semantics/design.md:22
**Description**: The claim that real d6/rc01 entries reliably carry `outcome` is not true across their v3 trail. Of 150 object resolution entries in those two archives, 17 carry legacy `status` and no `outcome`; for example `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/.orbit-runs/address-reviews-2026-08-12T16-37-44Z.json` has `severity: "CRITICAL", status: "resolved"` under `schema_version: 3`. Across archived trails, many more severity-bearing entries lack `outcome`, so the “no per-entry severity” fallback does not apply and the unknown-outcome rule turns already-resolved findings into permanent unresolved ones. Parse legacy `status` as the disposition or fall back at record level when the generation lacks `outcome`, and use a real v3 fixture in an active-gate computation—not only an archived-row smoke test.

### A compound slot can reuse a pass from the preceding slot
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:175
**Description**: The general rule says one pass cannot satisfy two slots, but the blind-pair rule requires only the pair's later token to beat the previous slot. For cadence `[external, blind-pair]`, external T1 may satisfy slot 1 and be reused as the external member of a pair with fresh T2, because the pair is “satisfied” at T2. A pair can likewise straddle an unrelated preceding slot. Require both pair members to be strictly later than the previous slot and prevent reuse of already-consumed pass indices; add the straddling and reuse trails requested by the review prompt.

### The governing program still specifies the reversed sixth state
**File**: orbit/architecture/clean-up-review-cycle.md:227
**Description**: The proposal reversed `budget-exhausted` from a gate state to an `unpassed` annotation, but the active program's Q-crc-4 resolution, rc02 charter/exit, and rc04 charter still require and branch on a `budget-exhausted` state (lines 157–161, 227–234, 286–292), and still list the two consumer capabilities that the reversal removed. The split also leaves the document saying “Eleven small stages” at line 184 and `CLAUDE.md:113`, although twelve stage headings now exist. Cascade the reversal and the rc02b split through the governing context so rc04 is specified to branch on `budgetExhausted` and future work does not reintroduce the discarded state.

### Budget exhaustion on a stale gate is underspecified
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:12
**Description**: `budgetExhausted` is defined when spend reaches budget and the gate “has not converged,” which includes a `stale` gate, and stale independent passes explicitly count toward spend. The same requirement then says a budget-exhausted gate is precisely `unpassed`, while the only special readout token is `unpassed BUDGET-SPENT`. A codegen agent can reasonably annotate stale gates or reasonably exclude them, producing different JSON, reasons, and rc04 behavior. State whether stale gates can be budget-exhausted and define their reason/readout in either case; add a full previously-converged-then-staled trail at the budget boundary.

## SUGGESTION

### Define how deferred suggestions are aggregated
**File**: orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md:192
**Description**: The delta requires a passed gate to report “the deferred suggestion count,” but a gate can have several passes and several latest per-pass resolution records, and one resolution record may eventually cover multiple sources once the merged-walk seam is fixed. It does not say whether the count is from the final walk, summed across the latest resolution for every pass, or deduplicated by finding identity. Define the aggregation and deduplication rule and add a multi-pass test so the teaching reason is deterministic.

## Notes

I traced the ordered-slot arithmetic on constructed trails, inspected the single-source address workflow and the real external parser, sampled archived resolution generations, and checked the three consumers claimed untouched. Keeping exhaustion beside `state` does preserve those consumers' five-state behavior; the remaining problem there is the stale governing prose. Structural checks were clean: strict change validation passed, all five baseline fingerprints verified, no inline review markers remain, and the measured proposal is one capability, seven requirement blocks, 32,344 delta bytes, and 19 task checkboxes—inside R-crc-1.
