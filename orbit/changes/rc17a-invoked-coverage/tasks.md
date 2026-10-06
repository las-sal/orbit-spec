## 1. Measure before code

- [ ] 1.1 Measure the red set before any code moves, and record it under this task: every test, golden and hash pin naming `foreclosed`, the `PairFailure` set, the v4 cadences (`[independent, in-context]`, `[blind-pair, in-context]`), `version: 4` / the schema-version source, the five-token cadence vocabulary, the discovery fence's parity test, the `orbit-address-reviews` body pins, and the `orbit-apply-change` body pin (`skill-templates-parity`), which task 4.2's edit moves. Grep for what a pin HASHES, not only for names (rc04c).
- [ ] 1.2 Read `orbit-orientation`'s and `orbit status --change --json`'s gate-row projection and list every surface that prints `nextCommand`, so the preference reaches all of them through the one read in the gate computation (design D6).

## 2. Grammar, trail and the launch record

- [ ] 2.1 Add `invoked` to `CADENCE_ENTRIES` (`types.ts`); the schema validator's unknown-entry message names six tokens; `commandForClass` stays exhaustive over the new token.
- [ ] 2.2 `orbit emit review-external` accepts an optional `pair` (payload table + write gate): refuse a non-boolean `pair` naming it; refuse `pair: true` without an explicit `mode` of `proposal` or `system`, naming `mode`; `pair: false` / absent write the ordinary T0 byte-unchanged.
- [ ] 2.3 The trail reader loads `Trail.launches` (`{token, mode}`) from `review-external-*.json` files whose JSON carries `pair: true` and a valid `mode`; a T0 that fails to parse, lacks the flag or lacks a mode is no launch. Passes are unchanged.

## 3. Gate computation

- [ ] 3.1 Implement pair membership per `A pair's membership is computed from its launch`: per mode, a launch's members are the first fresh pass and the first external return, among the trail reader's accepted passes, later than it and earlier than the mode's next launch; a walk record referencing a landed member before its partner ENDS the pair (the walked member reads as a single); every other independent pass is a single. One exported pure function, read by coverage, diagnosis and presentation; beside it, an exported pure entry that evaluates one reviewed gate over an in-memory `Trail`, the seam the oracle (6.1) calls.
- [ ] 3.2 `slotCandidates` for `invoked`: every eligible single at its own token, and every COMPLETE pair (distinct tokens, blind per the existing interval rule) at its later token, in the existing total order.
- [ ] 3.3 `assignCadence` records the minimum lower bound seen at the deepest slot; `diagnosePair` reads only the pairable passes above that bound (D-bpc-6's table); `foreclosed` leaves `PairFailure` and the reason table; `canonicalNextForReviewed`'s pairability scan reads the same eligible set.
- [ ] 3.4 The `invoked` presentation table (`The first review slot covers what the user invoked`): reason strings verbatim, canonical next, `nextSlot` as the presented class, `openPair` on the PAIR-OPEN-one-landed row only; the reason's pair note and the open-pair-outranks-the-walk rule fire for an `invoked` open pair.
- [ ] 3.5 `review_preference` in `project-config.ts`: a map from gate id to `blind-pair` | `fresh` | `external`; an unknown value warns naming the gate and value and resolves to `blind-pair`; a non-map warns and is ignored. The gate computation reads it once from the change's project root and consults it only on the presentation table's preference rows.
- [ ] 3.6 `unwalkedPasses` on the gate row (`A reviewed gate lists its outstanding passes`): computed on every non-blocked return path including `passed`, absent on `blocked`, in the `unresolvedPasses` shape and order; carried through the `orbit status --change --json` projection.

## 4. Schema version 5

- [ ] 4.1 `schemas/spec-driven/schema.yaml`: `version: 5`, both reviewed gates `cadence: [invoked, in-context]`, the header comment rewritten for v5 (the invoked slot, the preference, no versioned cadence); `budget`, `confirm` and `consent` unchanged.
- [ ] 4.2 Move every marked schema-version figure to 5 in the same edit (`orbit validate --sources` green), and sweep living prose that states the v4 cadences as current, recording each site: CLAUDE.md, the program doc, the apply body (`apply-change.ts:64`, "under spec-driven v4 the first uncovered slot is `blind-pair`"), and the review body's worked example (`review.ts:1100`, an engine line v5 without a launch never prints). `orbit-run-summary-emit`'s version-qualified sentence is a named residual (design, Risks), not a sweep site.

## 5. Walk discovery

- [ ] 5.1 The `orbit-address-reviews` body: install the delta's DISCOVERY fence byte-equal into the checked mirror, and rewrite discovery row 4's handling from a stop to the warning that offers stop or walk (including the degradation line at `address-reviews.ts:503`, "the walk stops before triage"), and the body's prose that says a SUGGESTION-only pass is reached by `--from-file` (`address-reviews.ts:349` and `:1040`), the "outstanding passes come from ... `unresolvedPasses`" sentence (`:345`) and the nothing-discovered condition (`:502`), so discovery reads `unresolvedPasses` with `unwalkedPasses`. A moved hash pin is recorded as its own act.
- [ ] 5.2 Rebuild and refresh the local surface (`npm run build && node bin/orbit.js update --force`) and confirm the generated address-reviews skill carries the new fence.

## 6. Tests and measurement

- [ ] 6.1 Exit (1): `test/core/invoked-coverage-oracle.test.ts`, the exhaustive oracle of design D9 — every cadence of length 1–3 over the six tokens × every trail of up to five events (three pass classes, `pair: true` T0s, walk records referencing a chosen pass, rejected external returns and apply tokens, plus the tie case), engine `openPair` and slot coverage against an independent brute-force reference through the in-memory seam of 3.1, D9's two properties (equality with the diagnosis; repairability one way only, so a tie with no `openPair` is not a failure), the stated size in the header, and rc08b's `[external, blind-pair]` reproduction pinned by name.
- [ ] 6.2 Exit (2): a suite showing a single fresh and a single external pass each cover the `invoked` slot on BOTH gates, and that the preference set to each value, absent, unknown and malformed changes only `nextCommand` / `nextSlot` (every other gate-row field deep-equal across the cases).
- [ ] 6.3 Exit (3): a discovery suite where a SUGGESTION-only pass is listed in `unwalkedPasses`, walked by `/orbit:address-reviews <change>`, and leaves the set once a log defers its findings; the walk adds nothing to clause (b), and a walk landing AFTER the following slot's pass uncovers that slot (the walk-after-confirm scenario), both asserted.
- [ ] 6.4 Declare every delta scenario: `@scenario` tags on the tests that exercise them, or ledger entries where none can; re-point the two tags this change orphaned (`outstanding-passes.test.ts:164`, `walk-routing.test.ts:230`); `orbit status --change rc17a-invoked-coverage --scenarios` reads 0 uncovered and 0 orphans.
- [ ] 6.5 Full `npm test` green (the full suite, not a filter); `orbit validate rc17a-invoked-coverage --strict`; `orbit validate --sources`.
