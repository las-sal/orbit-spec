# External Review: d6-pr-lifecycle (iteration 4)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-11

## CRITICAL

### The archive state-observation command lacks the selector required with --repo

**File**: src/core/templates/workflows/pr-choreography.ts:305
**Description**: The generated archive reference instructs `gh pr view --repo <owner>/<repo> --json isDraft`, without a PR number, URL, or branch. The real CLI rejects this before making a request: running the documented command for this repository exits 1 with `argument required when using the --repo flag`. Consequently, a literal performance of the normal attached-archive path cannot observe state and takes the following degradation branch: PR fields are elided and the entire commit/push/rewrite/READY tail is skipped, despite a healthy attachment and GitHub connection. Supply the validated or discovered PR's explicit URL, as the architect body already does, or reuse `isDraft` from that same identity's validation result. Keep observation independent of the current checkout branch, and add a selector-presence assertion for repository-qualified `gh pr view` examples; checking only for `--repo` does not establish valid grammar.

## WARNING

### The archive spec's recovery command still bypasses commit isolation

**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:223
**Description**: The new happy-path clause and generated reference correctly require `git commit --only`, but this normative failure branch still prescribes `git add <paths> && git commit`. A user following that recovery after a failed isolated commit commits the entire index, including unrelated pre-staged work that the new rule promises to preserve. In a disposable repository, an isolated commit deliberately failed on author identity; after restoring the valid identity, the spec's ordinary recovery commit succeeded and included both the archive file and pre-staged `foreign.txt`. Update the recovery recipe to `git add <paths> && git commit --only <paths>` and align its scenario with the generated reference. The ratified isolation decision must survive manual recovery as well as the automatic happy path.

### The normative repository-qualification rule still requires the rejected flag form

**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:150
**Description**: The source resolver is now correct, but the owning requirement still mandates `--repo <owner>/<repo>` on EVERY `gh` invocation and explicitly includes `repo view`. Its scenario at line 172 likewise allows only `--repo` or a full PR URL, neither of which describes positional repository selection for `gh repo view`. The corrected default-branch paragraph immediately below therefore contradicts the requirement and scenario that will be synced into baseline. Task 3.1a retains the same universal-flag wording. Replace these surviving clauses with command-specific qualification: positional repository for `gh repo view`, `--repo` for the PR verbs, and explicitly qualified PR identities where appropriate. Sweep normative prose and scenarios, not only contiguous command examples, so a later baseline-driven implementation cannot restore the invalid command while claiming compliance.

### Onboarding teaches that stage archive flips program PRs READY

**File**: src/core/templates/workflows/onboard.ts:99
**Description**: The archive teach-in describes rewriting the per-change body or appending a program stage entry, then unconditionally says to flip the PR READY. Because the sentence explicitly includes program PRs, it teaches that both granularities flip at stage archive. The actual archive reference forbids program flips, and the lifecycle contract reserves them for the human at arc-done. The preceding propose paragraph introduces per-architecture mode without supplying that exception elsewhere. Split the teaching at this seam: per-change archive rewrites and flips; program archive only appends, with the architect readout later surfacing the human's READY and merge actions at arc-done. Add a fidelity check for that distinction in onboarding, not just in the performing archive body.

### The phase-1 transcription treats a failed compatibility diff as an empty compatible diff

**File**: test/integration/pr-lifecycle/phase1.ts:182
**Description**: The per-proposal compatibility check reads only `git diff` stdout and discards its exit status. With an existing same-named orphan branch, `git diff origin/main...add-thing` exits 128 with `no merge base` and empty stdout. A real-repository probe then made `runPhase1` return `proceed`, switch to that unrelated-root branch, and expose its foreign file, rather than report the required collision. This is a defect in the executable transcription, not an engine Git path; it weakens the instrument used to validate the branch-safety prose. Require successful diff/ancestry resolution before classifying paths, return a named skip on failure, and add the per-proposal unrelated-root regression with HEAD remaining unchanged. State the failed-observation rule explicitly in the shared compatibility instructions as well.

### The phase-1 transcription can create a branch with gh genuinely absent

**File**: test/integration/pr-lifecycle/phase1.ts:110
**Description**: There is no independent `gh`-availability gate before branch work. A failed executable lookup becomes the same null result as a failed repository query, after which a valid symbolic remote HEAD lets resolution succeed. With PATH restricted to Git, no `gh` executable, and `refs/remotes/origin/HEAD` set, a disposable-repository probe returned `proceed` and created/switched to `add-thing`. The documented no-gh path instead degrades before any branch work. Add an explicit availability check while preserving the fallback for an installed CLI whose default-branch query fails, and assert no branch or HEAD mutation in the absent-tool case. Also make the harness's `gh: 'absent'` setup genuinely exclude a host-installed CLI; currently it merely omits the stub and inherits the host PATH.

## SUGGESTION

None.

## Notes

Reviewed `d-arc` at `9940f29`, including the iteration-3 resolution commit `c8a8a9c`, the eight deltas, prior review history, and the affected engine and generated workflow surfaces. Installation, build, regeneration, strict validation, and all five fingerprint checks passed. The full suite passed: 91 files, 2008 tests, from this checkout path containing spaces. All five modified baseline requirements retained their existing scenarios. Generated PR references matched the templates, shared resolution was byte-identical, and the config-order gate appeared only in propose/ff. Real-Git probes confirmed that the repaired effective-tip guard preserves tracked exploration and that isolated archive commits handle tracked moves while retaining unrelated staged entries. The remaining transcription findings concern the test instrument, not engine execution; the zero-engine-git boundary remains intact. Probes used disposable repositories and local bare remotes, and no live PR was created, edited, or flipped. Perspective and critical-path lens passes were skipped because those files are absent. Task 6.3 remains the declared user-validation handoff. The remaining pattern is incomplete agreement between executable commands, their normative descriptions, and the instruments intended to verify them.
