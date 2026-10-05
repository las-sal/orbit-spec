## Why

The reviewed gates hardcode what covers their first slot: `review-proposal` takes any single
independent pass, and `review-system` requires a blind pair. Sal, from extended use (D-bpc-8): the
user decides what review to run, the blind pair is the RECOMMENDED first review rather than the
required one (R-crc-4 as amended 2026-10-05), and what covers the slot is what the user INVOKED. A
pair, once invoked, covers only when both halves land. A single fresh or external pass covers by
itself.

Three defects ride the same seam:

- **The pair diagnosis reads the wrong set** (rc08b system walk 1, external W1, routed here).
  `diagnosePair` reads the whole pass list rather than the passes the uncovered slot could use. On
  `[external, blind-pair]`, with a clean external consumed by the first slot and an unwalked fresh
  standing, the engine sets no `openPair` and recommends the walk, which makes the pair impossible
  to form.
- **A pair has no record of being invoked.** Nothing on the trail says a pair was started, so the
  engine cannot tell a half-open pair from two unrelated singles.
- **A SUGGESTION-only pass is never walked by discovery.** Discovery reads only the gate's
  `unresolvedPasses`, so a pass with only SUGGESTIONs is reached only by `--from-file`. Sal
  (D-bpc-15): severity is a judgement; a walk walks every pass that carries a finding and has not
  been walked.

This is stage `rc17a-invoked-coverage` of `clean-up-review-cycle`, the first child of the split
`rc17-blind-pair-command`. Its exploration is the design input (`explore.md`, D-bpc-6, -8, -10,
-15). The one-command pair is `rc17b`; the review emit's short next line is `rc17c` (split at this
propose, D-bpc-17).

## What Changes

- **`spec-driven` version 5.** Both reviewed gates read `cadence: [invoked, in-context]`. The new
  cadence token `invoked` is covered by what the user invoked: a single independent pass that is not
  a pair member, or a COMPLETE pair. `independent` and `blind-pair` stay in the grammar, unchanged.
- **The pair launch.** A `review-external` T0 emit whose payload carries `pair: true` is the pair's
  LAUNCH. The pair's members are the first fresh pass and the first external return after it, before
  the mode's next launch. The engine computes the pair's state from the trail (NO-LAUNCH, PAIR-OPEN,
  COMPLETE, BROKEN) and stores nothing.
- **`openPair` on the `invoked` slot.** A launched pair with one half landed reports
  `openPair: {missing}`, the slot stays uncovered, and the walk's `openPair` stop applies unchanged.
- **A per-gate review preference.** `review_preference` in `orbit/config.yaml`, keyed by gate id,
  with the values `blind-pair` (the default), `fresh` or `external`, changes only which command the
  readout presents when nothing covers the first slot. An unknown value warns and resolves to
  `blind-pair`. Until rc17b's command ships, the `blind-pair` preference presents the fresh review.
- **The pair diagnosis is slot-bound** (D-bpc-6). `diagnosePair` reads the passes eligible at the
  failed `blind-pair` slot, at the lowest lower bound that reaches it. The `foreclosed` label is
  retired: under the slot-bound reading a whole-list foreclosure is a missing class.
- **`unwalkedPasses`.** Each reviewed gate's status row also lists every pass that carries a
  finding and that no walk record references. The gate does not hold on them. A change-scoped walk
  discovers the union of `unresolvedPasses` and `unwalkedPasses`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`: the `invoked` cadence token; pair membership computed from the trail;
  `spec-driven` version 5; the slot-bound pair diagnosis and the `foreclosed` label's retirement;
  the review preference and the presented command; `unwalkedPasses` on the gate row.
- `orbit-emit-composition`: the `review-external` T0 payload accepts `pair`, the launch record.
- `orbit-address-reviews`: discovery reads `unwalkedPasses` beside `unresolvedPasses`; a
  SUGGESTION-only pass is discovered.

Three capabilities, at R-crc-1's ceiling.

## Impact

- `src/core/artifact-graph/{gates,trail,types,schema}.ts`: the `invoked` slot, launch reading, pair
  state, the slot-bound diagnosis, `unwalkedPasses`, the preference reaching canonical-next.
- `schemas/spec-driven/schema.yaml`: version 5.
- `src/core/project-config.ts`: the `review_preference` key.
- `src/core/emit-composition.ts`: the T0's `pair` field.
- `src/core/templates/workflows/address-reviews.ts`: the discovery fence's checked mirror.
- Tests: an exhaustive oracle over small cadences and trails (exit (1)), and gate, config, emit and
  discovery suites.
- Every change, including ones stamped v4, is gated by v5: the engine has no versioned schema
  selector. No change loses coverage under it (design D3).
