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

- The external-handoff branch GAINS an explicit `orbit status --change <name> --json` read,
  ordered before the cycle-context step, and reads `next_hint_keys.slot` from it. This is a NEW
  call: the branch makes none today — its only CLI reads are `orbit list --json` and the git
  preflight. No new ENGINE surface is required, because `canonicalNextForReviewed` already returns
  `slot: 'blind-pair'` from both the open-pair and empty-pair branches; what is missing is the ask.
- Withholding fires on a CONJUNCTION and a POSITIVE signal only: the slot is present AND equals
  `blind-pair` AND the invoked reviewer class is independent (`fresh` or `external`). An absent
  slot is not a pair signal — it is the ordinary state between a review and its walk, and after
  every gate passes — so a sequential iteration is never blinded by a missing field. An
  `in-context` pass during the pair window keeps its context, because it can never satisfy a
  blind-pair slot and is the verification genre that most needs it.
- Withholding covers EVERY channel carrying prior findings, not only the Cycle context section:
  the prompt's project-context pointer to `orbit/changes/<name>/.orbit-runs/` is withheld too,
  since a reading list aimed at the directory holding the partner's emit is not blinded.
- The internal review branches apply the same rule to their own prior-run read. The external
  half's cycle context and the fresh half's prior-run read are the same context wearing two names.
  Architecture mode is explicitly carved out — no change, no gate, no cadence, so no pair.
- `Cycle context populated from prior runs` becomes GENRE-CONDITIONAL, specified as a DECISION
  TABLE with the absent-slot rows stated by construction (R-crc-7). Its existing behaviour and both
  existing scenarios are preserved for non-pair passes.

**Not** BREAKING: a sequential external iteration receives exactly today's prompt.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities**:
- `orbit-review-external` — `Cycle context populated from prior runs` gains the blind-pair
  condition and a scenario for it.
- `orbit-review` — an ADDED requirement stating that a blind-pair member receives no
  prior-findings context, keyed on the engine-reported slot.

## Impact

- `src/core/templates/workflows/review.ts` — the external-handoff reference (a NEW status-read
  step plus the cycle-context step), the shared prompt template's project-context reading list
  (`references/prompt-template.md`, where the `.orbit-runs/` pointer lives), and the internal
  branches' prior-run step.
- The generated surface (`.claude/skills/orbit-review/`) regenerates from that one source.
- No engine change. No schema-version bump. No migration: older trails simply never report a
  `blind-pair` slot, and the fail-closed default covers them.
- Unblocks rc03-review-genres, which now `Depends-on` this stage and inherits the resolved
  conflict rather than re-deciding it.
