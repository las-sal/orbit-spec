## Why

Three baseline capabilities name `gate_overridden` while saying only that an override is RECORDED
— they do not depend on the field's shape. `rc04c-retire-gate-overridden` removes that field, and
the ORDER of the two stages is the whole point of the split (see `explore.md`, and the charters in
`orbit/architecture/clean-up-review-cycle.md`): de-named FIRST, there is never a moment when a
spec normatively demands a field nothing writes. Retired first, the interim state leaves three
capabilities requiring a record the emit layer has already refused.

The same measurement that produced the split — `gate_overridden` spans SIX baseline capabilities
across FOURTEEN requirements, twice R-crc-1's ceiling — is why this stage exists separately: it
takes three of the six out of the retirement's scope while moving no behaviour at all, leaving
both halves AT the ceiling rather than one at double.

## What Changes

- **Five requirement texts are re-worded across three capabilities, and they are NOT uniform.**
  THREE are plain substitutions of the field name for the concept (`gate_overridden` → "the
  override"): `orbit-engine-gates`' position-readout and budget requirements, and
  `orbit-conventions`' `Review mode decision framework` scenario. A FOURTH —
  `orbit-pr-lifecycle`' `Generalized READY rule` — substitutes the phrase AND narrows the SHALL,
  which the unqualified form had widened across both archive-seam overrides: the shipped text
  reads "at the `review-system` gate". The FIFTH
  — `orbit-engine-gates`' `Inflection-prompt override contract` — additionally STOPS RESTATING
  the record's shape, keeping only what the gate capability owns: that the override is recorded,
  and which facts about the gate a joint decision must preserve. It names no shape owner at all
  (R-crc-13: a gate reports, an emit records).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`: three requirements stop naming the field; the override contract also
  stops restating `{gate, state, reason}` and names no shape owner — the obligation stays, the
  shape claim goes.
- `orbit-pr-lifecycle`: the `Generalized READY rule` and its scenario describe a recorded
  proceed-anyway override rather than a named field, and the requirement's SHALL is narrowed to
  the `review-system` gate — the only gate that can be unpassed at the archive seam.
- `orbit-conventions`: the `Review mode decision framework` scenario records "the override"
  rather than the field.

## Impact

- **`orbit/specs/` only.** Three delta specs, five MODIFIED requirements.
- **`src/` — NOTHING.** A `src/` change anywhere in this stage's diff means the stage was
  mis-scoped, and exit (2) fails on it deliberately.
- **`test/` — NOTHING.** FOUR test files pin `gate_overridden`
  (`orbit-content-fidelity`, `emit-schema-parity`, `emit-composition`, `judgement-record-fixture`
  — full inventory in tasks 3.1), and none of them reads a spec file; those pins are rc04c's to
  update when the bodies stop writing the field, not this stage's.
- **Downstream**: `rc04c-retire-gate-overridden` declares `Depends-on` this stage and inherits a
  scope narrowed from six capabilities to three.
