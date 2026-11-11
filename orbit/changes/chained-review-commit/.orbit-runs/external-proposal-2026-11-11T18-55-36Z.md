# External Review: chained-review-commit (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-11

## CRITICAL

None.

## WARNING

### Default-branch protection has an undefined fail-open case
**File**: orbit/changes/chained-review-commit/specs/orbit-pr-lifecycle/spec.md:58
**Description**: The guard depends entirely on `refs/remotes/<remote>/HEAD`, but does not specify what happens when that symbolic ref is absent or stale. A repository created with `git init` and `git remote add` commonly lacks it. With HEAD and the attachment both naming `main`, the equality check cannot establish that this is the default branch, and the otherwise row permits committing and pushing. The no-remote path explicitly bypasses the guard too. Define behavior when the default branch cannot be established, reconcile it with the unconditional “never default branch” promise, and add missing-ref and stale-ref scenarios.

### The prescribed resolver still requires gh
**File**: orbit/changes/chained-review-commit/design.md:49
**Description**: The design prescribes `resolve(run, {withDefault: false})` to avoid requiring `gh`, but the existing resolver in `src/core/pr/resolve.ts` returns `gh-absent` before checking `withDefault`. Implementing the stated call therefore drops the push when `gh` is absent, contradicting the new no-gh scenario. Explicitly require the resolver change, preserve existing callers’ behavior, and add a regression test for this branch.

### Push eligibility compares against a potentially different destination
**File**: orbit/changes/chained-review-commit/specs/orbit-pr-lifecycle/spec.md:83
**Description**: The push targets the resolved remote and current branch name, while the unpushed count uses `@{u}`. These can name different destinations. For example, with `origin` selected, HEAD tracking `fork/topic`, and HEAD equal to that upstream but ahead of `origin/topic`, a push-only invocation prints no push even though the intended destination lacks commits. Compare against the actual push destination, and define missing or stale destination-ref handling. Add a fixture with an upstream on another remote.

### Staging explorations cannot produce the promised off record
**File**: orbit/changes/chained-review-commit/specs/orbit-conventions/spec.md:24
**Description**: The explore row says a staging exploration calls the step and resolves `off`, but the subcommand accepts only active or archived changes and declares any other name a usage error. A name present only under `orbit/explore/` therefore errors before reaching the no-attachment gate. Specify whether the command resolves staging explorations or the body omits the call for them. Also explicitly exclude review invocations without a change target, which cannot supply the required change-name argument.

### The commit-message file can be swept into the commit
**File**: orbit/changes/chained-review-commit/specs/orbit-conventions/spec.md:10
**Description**: The body authors `<message-file>` after the engine observes porcelain and before running `git add -A`, but no rule places that file outside the worktree. A body writing it to an unignored repository path will commit the message file itself, omit it from `observations.untracked`, and potentially dirty the tree again when removing it. Require message files outside the repository, preserve them for failure recovery, and verify cleanliness after the complete body sequence rather than only the printed Git steps.

### Ignore rules are incorrectly described as excluding tracked files
**File**: orbit/changes/chained-review-commit/specs/orbit-pr-lifecycle/spec.md:70
**Description**: The table says a file matching `.gitignore` is never staged because porcelain does not report it. Git continues reporting and staging tracked files even when they match ignore rules. This conflicts with both the modified-tracked-file row and the prescribed `git add -A`. State that ignore rules exclude untracked files only; tracked and already staged files remain included. Add a tracked-file-matching-ignore scenario so the advertised boundary matches actual Git behavior.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify the branch guard, destination comparison, target resolution, and scratch-file lifecycle before implementation. These determine whether the step commits to the intended branch and reliably prepares the next review’s tree.

## Notes

The artifact and baseline comparison found no unresolved inline review markers. Automated validation could not run: `node bin/orbit.js validate chained-review-commit --strict` failed because `dist/cli/index.js` is absent. This is an unverified check, not evidence of an artifact validation failure.

This environment is read-only. I could not write the findings file or commit/push it; the full review is provided here for manual saving and committing.