## Why

A payload schema reference is a claim about what `orbit emit` accepts, and today the instrument that checks it compares FIELD SETS — so it recorded audit-drift's six refused fields as a `KNOWN_DIVERGENCE` exemption, and a ratified follow-up described the engine as "accepting a third shape" when the truth is a HARD REFUSAL. The audit-drift command's own Step 10 is unfollowable from its own shipped reference. Measured at exploration (see explore.md): the exemption is still live, its owner (rc07) archived without taking it, and FOUR voices plus practice disagree on audit-drift's payload — the engine table, `orbit-run-summary-emit`, `orbit-conventions`, the shipped reference — while the exemption contradicts its own owning requirement, which admits none. Worse, the engine composes audit-drift's recommendation from a SUPPLIED `findings_total` that the reference never documents, so a reference-faithful payload would record "No drifts detected" over real findings.

## What Changes

- **A payload reference is proven by execution.** Each payload schema block carries a verbatim, real-JSON example — exactly a payload file the body tells the AI to write, jointly carrying every AI-supplied key the block documents — and a test submits it through the real write gate (`composeAndWriteEmit`) in a disposable project, in every scope the reference documents, with NO engine-owned strip: acceptance is the assertion, and a refusal fails the test with the gate's own error text (explore D-rc07b-1, D-rc07b-2). The rc01 field-set test stays for the schema block's keys.
- **The round trip's reach is stated, not implied.** It is exactly as strong as the write gate's validators: a documented type or value the gate does not check stays a reviewer's claim — the named limit in the requirement (D-rc07b-1, BOUNDED). The findings formats and `orbit …` invocations inside references are named residuals outside the domain (D-rc07b-6).
- **audit-drift's counts become ENGINE-COMPUTED.** `findings_total` (= `findings.length`) and `findings_by_category` (per-category counts over `findings[].category`, keyed as `orbit-emit-composition`'s `Audit-drift counts are engine-computed` states — the union of `categories_run` and the categories findings carry, over refused malformed inputs) are computed and REFUSED if supplied, removing the silent clean-recommendation path by construction (D-rc07b-3; `findings_total` equals `findings.length` on 13 of 13 recorded emits, and `findings_by_category`'s recorded VALUES match the per-category count on every emit that records it flat — 10 of 13, the other three nesting by severity — while five of those carry KEY sets the union rule would not compose; nothing is migrated). **BREAKING** for a payload that supplies either count: the write gate refuses it as engine-owned.
- **audit-drift's payload reconciles to the engine and practice.** `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` is the owner; `categories_run` is an array of category-id strings `"1"`..`"6"`. The shipped reference drops `context`, `caller`, `depth`, `flags`, `categories_skipped` and `findings_summary`; `orbit-conventions`' and `orbit-audit-drift`'s restatements become pointers to the owner (R-crc-14); the body's Step 10 field list points at the reference (D-rc07b-4).
- **The `KNOWN_DIVERGENCE` exemption is RETIRED** (exit (2); D-rc07b-5), and the parity requirement's stale "recorded for the artifact-lint stage" pointer goes with it.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-emit-composition`: ADDED `Payload schema references are proven by execution` (the round trip, the example block, the named limit and residuals) and `Audit-drift counts are engine-computed`; MODIFIED `Payload tables agree with their schema references` (the field-set test admits no exemption; the stale artifact-lint pointer becomes a pointer to the round-trip requirement).
- `orbit-run-summary-emit`: MODIFIED `Audit-drift standalone recommendations` (this requirement OWNS the payload; `categories_run` is category-id strings; the two counts point at `orbit-emit-composition`).
- `orbit-conventions`: MODIFIED `Internal-run JSON summary format` (the editorial-kind bullet and scenario stop restating audit-drift's fields and point at the owner).
- `orbit-audit-drift`: MODIFIED `Internal run summary persisted` (one summary scenario points at the owner instead of naming a counts shape).

FOUR capabilities against R-crc-1's ceiling of three — the breach DECLARED by one under R-crc-9 and ratified by Sal at exploration (D-rc07b-7); two of the four deltas are R-crc-14 pointer substitutions, not mechanism.

## Impact

- **Engine**: `src/core/emit-composition.ts` — the audit-drift payload table loses `findings_total` and `findings_by_category`; its compose case computes both and reads the computed total for `next_recommended`.
- **Generated surface**: `src/core/templates/workflows/audit-drift.ts` (schema reference rewritten to the owner's shape; example block; Step 10 pointer); the review, address-reviews and archive schema references each gain their example block(s).
- **Tests**: a new round-trip suite; `test/core/emit-schema-parity.test.ts` loses `KNOWN_DIVERGENCE` and its two pinning tests.
- **Records**: no migration. Archived audit-drift emits keep their supplied counts (no src reader exists); three older emits with severity-nested `findings_by_category` stay valid history.
