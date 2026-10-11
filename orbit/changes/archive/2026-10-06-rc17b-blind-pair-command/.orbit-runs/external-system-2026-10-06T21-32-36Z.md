# External Review: rc17b-blind-pair-command (iteration 1)

**Reviewer**: GPT-6 Codex  
**Date**: 2026-10-06

## CRITICAL

None.

## WARNING

### Fresh re-run still uses live-state CLI reads
**File**: src/core/templates/workflows/review.ts:1214  
**Description**: The added brief tells a fresh re-run to review the pair’s earlier commit, but the worker’s unchanged Step 4 runs `orbit status` and `orbit instructions apply` against the live checkout, and the system review includes a structural check of that checkout. If the change has moved since BASE without an apply emit, those reads can assess a later state while the pass is counted as the pair’s missing half. Give the worker a commit-pinned read environment or specify commit-pinned replacements for every state-reading step while keeping the emit at the repository root.

### Pasted system prompt still directs a HEAD diff
**File**: src/core/templates/workflows/review.ts:758  
**Description**: A pasted pair half’s `## Repo` line names the reviewed commit, but its system-mode read list still directs `git diff <change-start>..HEAD` and names the change files without a revision. On a re-run, HEAD contains the committed partner and may contain later edits. Substitute the reviewed commit into the pair half’s read instructions, including the diff and artifact reads.

### Supersession notice is skipped when an apply makes the member stale
**File**: src/core/templates/workflows/review.ts:455  
**Description**: Step 3b promises a superseded-state message when an apply is later than L, but it checks for that apply only after `openPair: {missing: "external"}`. The gate omits `openPair` when the landed fresh member became stale after an apply, so this common case takes the “no openPair” branch and gives no notice. Check the latest pair launch and later apply before the no-`openPair` exit, or narrow the stated message requirement.

### Session-end recovery assumes a fresh pass file exists
**File**: src/core/templates/workflows/review.ts:1027  
**Description**: The recovery line tells the user to commit the fresh pass file first even when the session ends before the fresh worker emits one. That instruction cannot be followed in the missing-fresh case. Make recovery conditional on the trail landing read: commit a landed fresh file; otherwise save the external return, leave the pair open, and explain how to run the missing fresh half.

## SUGGESTION

### Config guidance still describes the interim default
**File**: orbit/config.yaml:64  
**Description**: The comment says the default `blind-pair` preference presents a fresh review “until a one-command pair ships.” This change ships that command and changes the presented default. Update the comment so adopters see the current behavior.

## Blocks

None.

## Direction

**Disposition**: hold

The commit-pinned state is central to the pair’s blindness claim. The fresh re-run and pasted external instructions still contain live-state reads, so I would resolve those instructions before treating a completed pair as a review of one state.

## Notes

The globally installed `orbit` reported every delta scenario declared, and strict validation and fingerprint checks passed. The local build, full test suite, and verify-change-style command were not run: this read-only checkout has no `node_modules/` or `dist/`, and the installed CLI has no `verify` subcommand. I checked the task list and compared the modified scenario sets with their archived baselines; task 6.5 is explicitly a user-validation handoff.

I could not write the findings file or commit and push it because this workspace is read-only.