# External Review: d6-pr-lifecycle (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-10

## CRITICAL

### Fresh explore-to-propose changes are forced onto the unattached path
**File**: src/core/templates/workflows/pr-choreography.ts:79
**Description**: The generation-input guard treats any consume-mode staging directory that is absent from the target commit as something `git switch` would destroy. That is false for the ordinary path created by `/orbit:explore <name>`: the explore body writes `orbit/explore/<name>/` but performs no commit, so a user who immediately invokes propose has an untracked staging directory which naturally does not exist on either a reused proposal/program branch or the remote-default ref used for a new branch. The generated PR reference therefore tells the performing AI to skip the PR layer and proceed unattached in the primary explore-to-propose flow. A real-Git probe with `?? orbit/` confirmed that `git switch -c add-thing origin/main` succeeds and preserves the untracked exploration, while the executable transcription returns `skip` for the same untracked directory when an existing target branch is used. The rationale on lines 84-86 correctly identifies the actual danger as committed tracked content. Restrict the destructive-switch guard to staging paths tracked by the current commit that would be removed or changed by the target ref (while letting Git reject genuine untracked overwrite collisions), and add end-to-end phase-one cases for a fresh untracked named exploration against both new and existing target branches.

## WARNING

### A present null `pr:` value bypasses the required invalid-value warning
**File**: src/core/project-config.ts:198
**Description**: The reader explicitly treats YAML `pr:` with no value (parsed as `null`) as if the key were absent and emits no warning. The delta only grants silent behavior to an absent key; a present scalar outside the closed `never | per-proposal | per-architecture` vocabulary is required to take the inert path with a one-line warning naming the value. This undocumented exception lets an incomplete or accidentally blank setting silently disable every PR seam. Route a present `null` through the invalid-value warning (naming it clearly, while still resolving to `never`) and change the test that currently codifies silence.

### CLI tests break when the checkout path contains spaces
**File**: test/commands/spec.test.ts:62
**Description**: The full suite is not portable to this review workspace: 24 tests fail because command tests interpolate an absolute `openspecBin`/`bin` path into an unquoted shell string, so `/Users/sal/Documents/ChatGPT/orbit PR 2/bin/orbit.js` is executed as `/Users/sal/Documents/ChatGPT/orbit`. The same pattern appears across `spec.test.ts`, `show.test.ts`, the four interactive show/validate files, and `validate.enriched-output.test.ts`; 1,973 tests pass and the 24 shell-path cases fail. Replace `execSync(\`node ${bin} ...\`)`-style calls with `execFileSync(process.execPath, [bin, ...args])` or `spawnSync` argument arrays so the claimed full-suite verification is reproducible from ordinary checkout paths.

## SUGGESTION

None.

## Notes

I regenerated and inspected the `.claude` surface after a successful install/build, traced the eight deltas through the workflow bodies and engine validation, ran strict change validation and the fingerprint check, and walked the propose, ff, archive, bulk-archive, and architect seams as a performing AI. The D6-focused engine/template/integration suites passed. The zero-engine-git boundary held: lifecycle Git/GitHub operations remain instructions for the performing AI rather than engine subprocesses. `orbit/lenses/perspectives.md` and `orbit/lenses/critical-paths.md` are absent, so those two judgment-layer passes were skipped as directed.
