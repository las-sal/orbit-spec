# External Review: c1-engine-gates (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-30

## CRITICAL

None.

## WARNING

### Authoritative explore decision still states the old convergence rule
**File**: orbit/changes/c1-engine-gates/explore.md:76
**Description**: `explore.md` is listed as the authoritative D-c1 decision source, but D-c1-5 still says convergence is class-set coverage plus a universal "0 CRITICAL and 0 new findings" independent pass. D-c1-7 also still describes `cadence: [reviewer classes]` without the per-gate `confirm` field. That conflicts with the remediated design/spec/tasks rule: ordered cadence slots, `independent` as a cadence-only meta-class, and per-gate `confirm` (`review-proposal: no-new-findings`; `review-system: findings-resolved`). A codegen pass following the prompt's "explore decisions are authoritative" instruction could reimplement the pre-remediation rule. Update D-c1-5/D-c1-7 to match the current engine-gates spec, or add an explicit note that those decision bullets were superseded by the later address-reviews resolution and point to the normative spec lines.

### Proposal-mode review phrasings still bypass the gate-aware canonical next command
**File**: orbit/changes/c1-engine-gates/specs/orbit-review/spec.md:15
**Description**: The requirement intro promises that all final-assessment phrasings are engine-sourced, single-voiced, and render one full canonical next command, but the proposal-mode no-critical scenarios still say `Ready to apply (with noted improvements).` / `Ready to apply.` with no `review-proposal` gate state, no position readout, and no full `/orbit:apply <change>` command. On a first in-context proposal review, that exact text can tell the user to apply while the `review-proposal` gate is still missing the independent cadence slot, recreating the skip surface C1 is meant to remove. Make the proposal-mode final assessments gate-aware too: render the engine-computed `review-proposal` state and canonical next command (independent review/address loop until the gate passes; only then `Next: /orbit:apply <change>`), or explicitly separate pass-local assessment from the required handoff text and require the position readout plus canonical command immediately alongside it.

## SUGGESTION

None.

## Notes

`node bin/orbit.js validate c1-engine-gates --strict` passes after `npm install` builds the CLI, and no `@review:` marker residue was found under the change artifacts.
