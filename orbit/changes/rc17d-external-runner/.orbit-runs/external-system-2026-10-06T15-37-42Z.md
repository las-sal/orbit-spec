# External Review: rc17d-external-runner (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-06

## CRITICAL

### Removed preamble text becomes executable shell syntax
**File**: src/core/templates/workflows/review.ts:547
**Description**: Step 9d inserts the runner’s removed preamble directly into a double-quoted `git commit -m` argument. Backticks and `$(...)` in that text execute commands; embedded double quotes can terminate the argument. Even ordinary Markdown such as “could not run `git push`” is unsafe when substituted literally. The integration harness hides this defect by passing the message through a process argument array instead of executing the documented shell command. Write the message as literal data to a file and use `git commit --only … -F <message-file>`. Test preambles containing shell metacharacters through the actual documented mechanism.
**Reproduction**: Substitute the returned preamble `I could not run $(printf ORBIT_PREAMBLE_EXECUTED >&2)` into Step 9d. This harmless probe replaces Git with an argument printer:

```sh
(
  git() { printf '%s\n' "$@"; }
  git commit --only saved-review.md -m "External review (system, iter 1): demo

Removed above the heading by orbit external save:
> I could not run $(printf ORBIT_PREAMBLE_EXECUTED >&2)"
)
```

Expected: the preamble remains literal commit-message data and nothing executes from it. Observed: `ORBIT_PREAMBLE_EXECUTED` is printed to stderr, and the substitution disappears from the message received by `git`. I executed this probe.

### The advertised recovery command bypasses review freshness protection
**File**: src/core/templates/workflows/review.ts:566
**Description**: The recovery command printed while the runner is active omits `--launch <T0 token>`. If the session ends and an apply occurs before recovery, following that command saves the old review with a new timestamp. The trail consequently treats it as fresh even though the normal return path rejects it. Include the original launch token in the recovery command and its corresponding spec scenario; the launch provenance is known here and must survive session loss.
**Reproduction**: In a writable scratch directory with the reviewed CLI installed:

```sh
review_tmp=$(mktemp -d)
cd "$review_tmp"
mkdir -p orbit/changes/demo/.orbit-runs
printf '{}\n' \
  > orbit/changes/demo/.orbit-runs/apply-2000-01-01T00-05-00Z.json
printf '%s\n' \
  '# External Review: demo (iteration 1)' \
  '**Reviewer**: fixture' '**Date**: 2026-10-06' \
  '## CRITICAL' 'None.' '## WARNING' 'None.' \
  '## SUGGESTION' 'None.' '## Blocks' 'None.' \
  '## Direction' '**Disposition**: forward' 'Fixture review.' \
  > raw.md

orbit external save demo --as system --from "$review_tmp/raw.md" \
  --launch 2000-01-01T00-00-00Z --json || true

orbit external save demo --as system --from "$review_tmp/raw.md" --json
```

The review represents the state at the launch token, before the apply. Expected: recovery preserves that provenance and refuses the superseded return. Observed: the first command refuses it, while the advertised recovery form writes an accepted pass timestamped after the apply. I confirmed these outcomes against `saveExternalReturn` and `readTrail` using an in-memory filesystem; the resulting pass’s freshness comparison returned `false` for stale.

## WARNING

### Failure fallback points reviewers at the worktree it just deleted
**File**: src/core/templates/workflows/review.ts:556
**Description**: Step 7 puts the temporary worktree’s absolute path in the committed prompt’s `## Repo` section. On runner failure, Step 9d removes that worktree and then directs the user to hand off the same prompt. Its repository location is now nonexistent, and a reviewer on another machine could not use that local path anyway. Prepare a usable manual fallback before advertising it: name an accessible repository and the intended revision, then satisfy the appropriate handoff preflight. A superseding apply also requires a newly prepared review request rather than reuse of the old launch prompt. The harness checks only the fallback classification, not whether its prompt remains usable.

### Successful saves can fail the mandatory report step
**File**: src/core/external-runner.ts:272
**Description**: Acceptance is checked only through `readTrail`, which permits returns that `normalizeExternalPass` rejects under the archived report-rendering contract. For example, a review with a reviewer and all three severity sections but no `**Date**:` is saved and counted as a pass; rendering rejects it with `missing '**Date**:' field`. I confirmed that mismatch with the actual saver and report normalizer. Step 9d commits and pushes the file before discovering this failure. Validate the normalized return against the report parser before writing or committing it. Missing, duplicate, empty, and invalid header metadata are mechanically detectable defects, distinct from the declared limit about judging whether a review is substantively complete.

### The return steps leave the destination checkout implicit
**File**: src/core/templates/workflows/review.ts:532
**Description**: The launch command changes directory into the detached worktree, but the subsequent save, commit, push, and report commands never explicitly select the original checkout. `ExternalCommand.save` resolves its project root from the current directory. An execution environment that retains the changed directory can therefore save and commit the return inside the disposable worktree. The harness supplies `cwd: repo` for saving and all Git operations, an assumption missing from the reference. Scope the launch’s directory change to a child/subshell and explicitly anchor return operations to the original repository.

### The saver follows aliases into another change’s trail
**File**: src/core/external-runner.ts:242
**Description**: Change validation checks the lexical name and follows `statSync`; the final trail write performs no physical containment or canonical-child check. With `a/.orbit-runs` pointing to `b/.orbit-runs`, saving a review headed for `a` writes it into `b`’s ledger while reporting an `a` path. The trail reader also accepts that file as a pass for `b`. An in-memory filesystem model confirmed this behavior. Apply the canonical target and trail-child checks already used by the emit surface, including rejection of sibling aliases and escapes, before accepting the destination.

### Active review instructions still prohibit the behavior this change adds
**File**: src/core/templates/workflows/review.ts:941
**Description**: The generated review trunk still describes external dispatch as packaging only and states that “no review passes run in that invocation,” while its loaded reference now requires launching and waiting for a review. The archived `orbit-review` dispatch scenario and its external-class description retain the same contradiction. The design explicitly defers these corrections to rc17b, but that leaves contradictory instructions active between the two changes. Qualify the trunk and owning requirement so the packaging-only behavior applies to the manual route, or coordinate delivery so the contradictory intermediate surface is not shipped.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The automatic return path needs to preserve reviewer output as inert data and retain launch provenance during recovery. The fallback, destination, and report-validation gaps also need resolution before this launch procedure becomes the reusable foundation for the blind-pair command.

## Notes

Reviewed the change artifacts, the requested commit range, affected callers, archived contracts, and generated workflow source. Strict change validation, fingerprint checks, source lint, and diff whitespace checks passed. Modified requirement blocks retain their baseline scenarios.

The scenario map reports 49 delta scenarios: 22 behavior declarations, 25 text declarations, and two declared untestable scenarios, with no uncovered, orphaned, or malformed entries. These are coverage declarations, not evidence of a successful test execution. Task 5.5 remains the explicitly declared user-validation handoff.

The targeted Vitest command could not start because this checkout has no installed dependencies (`vitest: command not found`). Direct shell and source-level probes ran; filesystem mutations were modeled in memory. The linked build used for CLI checks was compared with the relevant checkout sources. Project goals, root convention files, and both lens files were absent; there were no named perspectives or critical paths to evaluate.

I could not write the findings file, commit, or push because this workspace is read-only. The complete findings are provided here for manual saving and committing.