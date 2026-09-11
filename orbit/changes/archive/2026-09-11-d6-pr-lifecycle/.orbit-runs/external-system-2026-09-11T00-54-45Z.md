# External Review: d6-pr-lifecycle (iteration 3)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-11

## CRITICAL

### The shared default-branch command is rejected by the real GitHub CLI

**File**: src/core/templates/workflows/pr-choreography.ts:42
**Description**: `gh repo view --repo <owner>/<repo> --json defaultBranchRef` is not a valid command. With the installed GitHub CLI 2.91.0, the documented invocation exits 1 with `unknown flag: --repo`; this subcommand takes the repository positionally. The invalid command is propagated to every PR reference, while the stub and repository-qualification fidelity assertions accept or require it. A checkout created with `git init` plus remote-add/fetch need not have `refs/remotes/<remote>/HEAD`, so the fallback does not rescue that ordinary case: healthy GitHub access still degrades every PR seam. Use `gh repo view <owner>/<repo> --json defaultBranchRef`, make repository qualification command-specific instead of requiring `--repo` universally, and align the transcription, assertions, and spec/task examples with the real CLI grammar.

### Remote-ahead fast-forward bypasses both input preservation and branch compatibility

**File**: src/core/templates/workflows/pr-choreography.ts:132
**Description**: The generation-input guard and per-proposal compatibility check approve the existing local branch before step 6 advances it to a different remote tip. The transcription follows this ordering: it selects the local ref, checks compatibility and generation inputs, then fast-forwards after switching. In a disposable real repository, HEAD and the local program branch held identical tracked exploration content, while the already-existing remote tip changed it. `runPhase1` returned `proceed` and replaced the approved exploration with the remote content. A second per-proposal case returned `proceed` and imported an unrelated file from the remote tip despite the own-path rule. Neither case needs concurrency. Resolve the effective final tip first and validate both constraints against every tree transition that will occur, before switching or fast-forwarding. Add regression cases for changed remote exploration and foreign remote paths.

## WARNING

### Enumerated archive staging still commits unrelated pre-staged files

**File**: src/core/templates/workflows/pr-choreography.ts:308
**Description**: An explicit `git add` list does not limit a subsequent ordinary `git commit` to that list: it retains everything already in the index. The archive preconditions check tooling and HEAD, but not out-of-scope staged changes. A disposable-repository reproduction pre-staged `unrelated-staged.txt`, performed the archive move, added only the documented archive paths, and committed and pushed successfully; the resulting commit included the unrelated user file. This violates the delta's scenario that unrelated dirty paths never ride the commit and can publish work the user did not authorize this archive to include. Before staging, detect out-of-scope index entries and skip the tail with a precise note, or use a commit-isolation procedure that preserves those entries without including them. Cover pre-staged additions and modifications.

### The archive reference still contains the live-config early-return gate

**File**: src/core/templates/workflows/pr-choreography.ts:413
**Description**: `PR_ARCHIVE_TAIL_REFERENCE` interpolates `PR_CONFIG_ORDER_SECTION`, which tells the performer to read live `pr` and RETURN IMMEDIATELY without probing when it is `never`. Later in the same generated reference, the attachment-authority rule says the tail runs regardless of live config. Thus archiving an attached change after setting `pr: never` presents incompatible instructions, and following the early return abandons its PR. This also contradicts the explicit archive scenario saying live config is not consulted at this seam. Remove the attaching-seam config gate from the archive reference, as was done for the architect reference, and retain attachment presence plus availability as the archive gates. Assert that generated archive instructions contain no live-config return gate.

### The architect reference gates discovery on the URL discovery is meant to recover

**File**: src/core/templates/workflows/pr-choreography.ts:384
**Description**: The new reference defines its attachment gate as a URL-bearing per-architecture record, immediately after promising fallback discovery when no URL-bearing record exists. The architect body explicitly supports that fallback. For example, program PR creation can fail and leave a valid `{branch, granularity, doc}` attachment; the user can then complete the documented manual PR creation. At arc-done there is a real program PR but no stored URL, so the reference's gate excludes exactly the recovery case its query should handle. Gate on a matching per-architecture attachment regardless of optional URL, and use URL presence only to choose stored-identity validation versus constrained discovery. Align the reference header and body, including the case where live config has subsequently become `never`.

### The new final push can restart choreography after an earlier failure

**File**: src/core/templates/workflows/propose.ts:314
**Description**: Both propose and ff now require committing and pushing the emit whenever the choreography "ran," including a run whose initial artifact push failed. The shared mid-flight contract instead says any failed step skips the remaining choreography and recovery is manual. A performer following the new completion step therefore commits the branch-only attachment and retries the rejected push in the same invocation; a transient failure can become a successful outward write after the flow reported that the remaining work was skipped. The new durability scenario is narrower: it applies when a PR was opened or adopted. Define an explicit success gate for the final commit/push, apply it consistently to propose, ff, and the shared reference, and specify that an earlier-failure emit stays local with manual recovery unless a different failure policy is deliberately ratified.

### Attachment-push recovery stops at an already-completed commit

**File**: src/core/templates/workflows/pr-choreography.ts:230
**Description**: Every final-record failure gets the same completing command, `git add <emit-path> && git commit && git push <remote> <branch>`. When the record commit succeeded but its push failed, the worktree can already be clean. Reproducing that state in a disposable repository gave recovery-commit exit 1 with `nothing to commit, working tree clean`; shell `&&` consequently never attempted the push, although a standalone push succeeded. Recovery must depend on the failed step: prescribe only the push when the record is already committed, and add/commit before pushing only when those steps remain unfinished. Report completed versus pending actions explicitly, as the archive-tail recovery already does.

## SUGGESTION

### Put the early HEAD warning in a genuinely pre-write step

**File**: src/core/templates/workflows/archive-change.ts:357
**Description**: The new observation says to warn BEFORE any archive write, so the user can switch before carrying sync and move changes across branches, but it is located in Step 5.45, after Step 4 sync and Step 5 move. Its reference to the entry consent preview is also retrospective by that point. A performer can infer that the paragraph should be hoisted, but the numbered workflow does not implement the promised timing. Move attachment-branch/HEAD observation into the read-only entry preflight before consent and sync, keep live PR-state observation near the emit, and retain the immediate pre-staging HEAD recheck as the actual tail guard.

## Notes

Reviewed branch `d-arc` at `e1b141a`, including the eight deltas, modified baselines, iteration history, and regenerated Claude workflow surfaces. Build and strict change validation passed; all five captured fingerprints verified. The full suite passed: 91 files, 2004 tests, from this checkout path containing spaces. Generated PR references matched their templates and carried byte-identical shared resolution text. The extra Git probes used disposable repositories and local bare remotes; no live PR was created, edited, or flipped. The zero-engine-git boundary remains intact. Perspective and critical-path lens passes were skipped because those files are absent. Task 6.3 remains the declared user-validation handoff, not a review defect. The remaining risks concentrate at transitions between individually plausible instructions: checked versus final branch tips, existing index versus enumerated staging, attachment authority versus shared gates, and successful completion versus manual recovery.
