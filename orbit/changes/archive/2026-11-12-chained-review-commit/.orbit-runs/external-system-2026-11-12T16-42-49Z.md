# External Review: chained-review-commit (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-12

## CRITICAL

None.

## WARNING

### The closing step can restart a PR layer that already stopped
**File**: src/core/disciplines.ts:123
**Description**: The closing step unconditionally calls `orbit pr commit` whenever a change target exists. However, `src/core/templates/workflows/pr-choreography.ts:25` says a failed publish or tail step stops further PR steps for that invocation. For example, if propose's publish push fails, the completion emit still records the branch attachment. The closing step then finds that attachment and can print another commit and push, despite the earlier failure leaving recovery to the user. Archive has the same conflict after a tail failure. Carry the invocation's PR-layer termination state into the closing step and explicitly suppress further writes after termination; align the delta requirement and shared consumption table with that behavior.

### A nonempty porcelain status does not guarantee a commit after staging
**File**: src/core/pr/commit.ts:107
**Description**: The implementation prints a commit whenever porcelain contains any entry, but `git add -A` can remove every staged difference. For example, modify a tracked file, stage it, then restore its working-tree contents from HEAD without changing the index. Porcelain reports `MM`, so this code prints stage, commit and potentially push. The stage restores the index to HEAD, and the printed commit fails with nothing to commit, preventing the subsequent push even when older commits need pushing. Determine whether staging will produce an actual difference from HEAD, and omit the commit when it will not. Cover this state in the requirement and an execution case rather than treating a retry of an empty commit as user recovery.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the closing step's interaction with earlier PR-layer termination and ensure its printed commit can succeed when staged and unstaged changes cancel. These affect the reliability of the automatic command-to-command handoff this change introduces.

## Notes

All task checkboxes are marked complete, and static inspection shows the shared step carried by the six intended workflow bodies. The project context and lens files requested beyond `CLAUDE.md` are absent.

Scenario-map coverage was not verified: `node bin/orbit.js status --change chained-review-commit --scenarios --json` could not start because `dist/cli/index.js` is absent. Validation likewise could not start. Dependencies are absent, and the read-only environment prevented building or running the test suite. These limitations are unperformed checks, not observed validation failures. The commit-range whitespace check passed.