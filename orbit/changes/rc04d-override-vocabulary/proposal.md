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

- **Five requirement texts are re-worded across three capabilities.** Four are plain
  substitutions of the field name for the concept (`gate_overridden` → "the override"). The fifth
  — `orbit-engine-gates`' `Inflection-prompt override contract` — additionally MOVES OWNERSHIP of
  the record's shape to `orbit-run-summary-emit`, which already owns it. That requirement
  currently restates `{gate, state, reason}`, making `orbit-engine-gates` a second voice on
  another capability's fact.
- **NO BEHAVIOUR CHANGES.** No engine edit, no workflow-body edit, no emit-shape change, no test
  change. Every re-worded form is TRUE OF THE ENGINE AS IT STANDS TODAY — that is what makes the
  stage verifiable rather than merely plausible, and exit criterion (2) is written to catch a
  breach rather than leave it to a reviewer's judgement.
- **The workflow bodies are deliberately untouched** and keep naming the field. They describe what
  is written TODAY, and today the field IS written; `rc04c` retires it. Verified in exploration
  (D-rc04d-1): no instrument in the repo reads spec wording against body wording, so a body naming
  a field its spec now describes generically is invisible to every check that exists.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`: three requirements stop naming the field; the override contract moves
  record-shape ownership to `orbit-run-summary-emit` rather than restating `{gate, state, reason}`.
- `orbit-pr-lifecycle`: the `Generalized READY rule` and its scenario describe a recorded
  proceed-anyway override rather than a named field.
- `orbit-conventions`: the `Review mode decision framework` scenario records "the override"
  rather than the field.

## Impact

- **`orbit/specs/` only.** Three delta specs, five MODIFIED requirements.
- **`src/` — NOTHING.** A `src/` change anywhere in this stage's diff means the stage was
  mis-scoped, and exit (2) fails on it deliberately.
- **`test/` — NOTHING.** `test/core/templates/orbit-content-fidelity.test.ts` pins
  `gate_overridden` in the `apply-change` and `archive-change` BODIES and reads zero spec files;
  those pins are rc04c's to update, not this stage's.
- **Downstream**: `rc04c-retire-gate-overridden` declares `Depends-on` this stage and inherits a
  scope narrowed from six capabilities to three.
