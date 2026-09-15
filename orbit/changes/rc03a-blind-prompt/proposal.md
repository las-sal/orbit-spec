# Proposal: rc03a-blind-prompt

## Why

Two archived requirements cannot both hold, and the contradiction silently defeats the instrument
this program depends on.

`orbit-review-external`'s **Cycle context populated from prior runs** SHALL-includes "prior findings
(open and resolved)" in every external prompt. `orbit-engine-gates` requires a `blind-pair`'s two
members to be blind to each other. The gate's blindness predicate checks only for a WALK recorded
between the two passes' tokens — it cannot see that the second reviewer's PROMPT contained the
first reviewer's findings. So a pair anchored through its prompt is CERTIFIED BLIND, and the
capture-recapture residual estimate that rc04 will build on silently stops meaning anything.

The engine's own canonical next command is the path that produces this: an empty `blind-pair` slot
renders `--fresh` first, so the fresh half lands and the external prompt then reads it. rc02's pair
escaped by ordering luck alone — its external prompt was written 24 minutes before the fresh pass
existed, recording "Prior internal findings still open: 0". **The only measurement this program has
produced survives because the operator did not do what the tool said.**

The question is not "delete a bullet". Cycle context is CORRECT for a sequential iteration — a
reviewer verifying whether prior findings were addressed needs to know what they were — and WRONG
for a blind-pair member. This change makes the distinction computable rather than accidental.

## What Changes

- The external-handoff branch READS the slot the engine already computes
  (`next_hint_keys.slot` from `orbit status --change <name> --json`) and SUPPRESSES the Cycle
  context section when that slot is `blind-pair`, rendering a one-line "withheld" note in its
  place. No new engine surface: `canonicalNextForReviewed` already returns `slot: 'blind-pair'`
  from both the open-pair and empty-pair branches.
- The internal review branches apply the SAME rule to their own prior-run read: a pass filling a
  `blind-pair` slot skips the Step-5 prior-summary inspection. The external half's cycle context
  and the fresh half's prior-run read are the same thing wearing two names.
- When the slot cannot be determined (status fails, no reviewed gate, older engine), both branches
  FAIL CLOSED — suppress rather than retain.
- `Cycle context populated from prior runs` becomes GENRE-CONDITIONAL. Its existing behaviour and
  both existing scenarios are preserved for non-pair passes; the blind-pair condition is added.

**Not** BREAKING: a sequential external iteration receives exactly today's prompt.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities**:
- `orbit-review-external` — `Cycle context populated from prior runs` gains the blind-pair
  condition and a scenario for it.
- `orbit-review` — an ADDED requirement stating that a blind-pair member receives no
  prior-findings context, keyed on the engine-reported slot.

## Impact

- `src/core/templates/workflows/review.ts` — the external-handoff reference's cycle-context step
  and the internal branches' prior-run step; both read a slot they already have access to.
- The generated surface (`.claude/skills/orbit-review/`) regenerates from that one source.
- No engine change. No schema-version bump. No migration: older trails simply never report a
  `blind-pair` slot, and the fail-closed default covers them.
- Unblocks rc03-review-genres, which now `Depends-on` this stage and inherits the resolved
  conflict rather than re-deciding it.
