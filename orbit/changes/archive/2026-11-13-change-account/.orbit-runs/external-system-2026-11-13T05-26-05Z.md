# External Review: change-account (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-13

## CRITICAL

None.

## WARNING

### The all_done shortcut can leave an existing account stale
**File**: src/core/templates/workflows/apply-change.ts:66
**Description**: The early `all_done` branch writes an account only when none exists, then proceeds directly to the completion readout. Consider a reopened change with an existing account: an apply session completes the reopened tasks, changes the behavior, and is interrupted before replacing the account. The next session arrives on `all_done`, sees an account, and follows this shortcut without reconciling it. This conflicts with the Account step’s instruction to consider all work since the latest account, including earlier sessions. Route `all_done` through the full Account step for both missing and existing accounts, loading the context needed to compare the account with the finished work before returning.

## SUGGESTION

### Mixed review walks need an explicit account timing rule
**File**: src/core/disciplines.ts:372
**Description**: A walk can fix one finding directly and reopen tasks for another. The first bullet requires a replacement describing the change “as it now stands,” while the next says to write no account “for” the reopened finding. It is unclear whether that walk should replace the account immediately or defer the entire replacement until apply completes. State the intended behavior for this combined case in the spec and workflow instruction, including how unfinished work should be represented.

## Blocks

None.

## Direction

**Disposition**: hold

The resumed-completion path should reconcile an existing account before returning. Otherwise a routine interruption can leave the account describing an earlier implementation even after a subsequent apply session finishes successfully. The separate account folder and reuse of the existing publication checks otherwise fit the intended isolation from current readers.

## Notes

Reviewed the change range beginning at `286b7c18`, the proposal, design, tasks, delta specs, relevant archived requirements, affected workflow branches, and the existing trail, orientation, report, and decision-selection readers.

All task checkboxes are marked complete. Scenario coverage verification was not run: `node bin/orbit.js status --change change-account --scenarios --json` could not start because `dist/cli/index.js` is absent. Strict validation failed to start for the same environmental reason; this is not evidence of an artifact validation failure. Build and tests were not run in this read-only checkout.

The repository has no `orbit/project.md`, named perspective lens, or critical-path lens files, so those project-specific reviews were unavailable. No unresolved `@review:` marker was found in the change artifacts outside the run history.

The environment permits no file writes. The findings file could not be saved, committed, or pushed; the user must save and commit this markdown manually.