# External Review: rc17b-blind-pair-command (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-06

## CRITICAL

### Retrying from BASE can certify a superseded review as current
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review-external/spec.md:115
**Description**: The retry now reviews the original pair’s BASE, but its save still checks the retry’s newer T0 token. The exploration explicitly retains `--launch <the re-run’s T0 token>` at line 105. An apply between the original launch and the retry therefore escapes the supersession check. A fresh pass emitted after that apply can remain usable even if it inspected the earlier state, allowing both independent reviews of the old state to satisfy the current system gate. When a retry reads the original BASE, use the original pair token L for supersession checks. Refuse resumption after an apply later than L and require review of the current committed state. Add this interleaving to the integration cases.
**Reproduction**: Construct change `foo` with completed apply tasks, a system cadence `[invoked, in-context]`, and no findings or walk records:

1. At `2026-10-06T20-00-00Z` (L), write a system T0 with `pair: true`; BASE contains state S0. Both reviewers begin inspecting S0.
2. At `2026-10-06T20-00-01Z` (A), another apply commits state S1 and writes its apply emit.
3. At `2026-10-06T20-00-02Z` (F), the fresh reviewer emits its clean review of S0. The original external save correctly refuses because A is later than L. The gate reports `openPair: {missing: "external"}` because F’s token is later than A.
4. At `2026-10-06T20-00-03Z` (R), retry the external half. The proposed rule places its worktree at the original BASE, so it reviews S0. Saving with `--launch R` accepts the return: A is earlier than R.
5. Save that clean return at `2026-10-06T20-00-04Z`, then add a clean in-context pass at `2026-10-06T20-00-05Z`.

Expected: the resumed external return is refused as superseded; reviews of S0 cannot establish current review coverage for S1. Observed under the specified rules: both independent pass tokens are later than A, the pair covers, and the gate returns `state: "passed"` with `nextCommand: "/orbit:archive foo"`. A read-only, in-memory call to the existing `evaluateReviewedGate` confirmed this result.

## WARNING

### Runner selection occurs after route-dependent packaging is committed
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review/spec.md:95
**Description**: Step 4 resolves the runner after steps 2–3 have written and committed the prompt and T0. Packaging already needs that decision: launched prompts name an allocated worktree, pasted prompts name the repository and reviewed commit, and a launched T0 names the runner. The delegated external-handoff packaging already resolves the runner earlier, so following both instructions entails another resolution after commitment. The artifacts do not say which result controls the route if they differ. Resolve the runner once before packaging, allocate the required paths from that result, and reuse the same result through launch or paste. Update the ordered table and reference tasks accordingly.

### Failed external retries direct the paste reviewer to the wrong commit
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review-external/spec.md:29
**Description**: The failed-run fallback still names the run’s handoff commit. On a retry, that is the newer commit containing the committed fresh partner—the exact state line 115 forbids the launched reviewer from reading. If the retry runner fails, a reviewer following the fallback faithfully is directed to that newer state and can encounter its partner’s findings. This is caused by the instructions themselves, beyond the named limit of a reviewer disregarding its instructed commit. Make a pair retry’s failure fallback name the original BASE or REVIEWED COMMIT, including the failed-push variant. Add a failed-retry fallback case; the planned successful retry test does not exercise this path.

### The fresh retry loses its reviewed-state instruction
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review-external/spec.md:118
**Description**: Omitting trail pointers prevents an explicit instruction to read the partner; it does not tell the fresh reviewer which source revision to review. Design D6 removes the exploration’s instruction to read BASE and substitutes the ordinary brief, which names artifacts in the live checkout. After an external-only pair return, commit an ordinary source edit without an apply emit and retry `--fresh`: a compliant worker reads the newer source revision while its external partner reviewed BASE. The residual describes a reader going past a commit it was told to read, but this worker was never told that commit. Restore BASE as an explicit fresh-retry read target while keeping emission in the live repository root. Physical isolation can remain a named limitation.

### A missing fresh half has conflicting external-save prerequisites
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review-external/spec.md:80
**Description**: This table row permits saving a pair’s external return only after the fresh pass file is committed. The surrounding prose at lines 71–74 and the pair table at `orbit-review/spec.md:101` also permit saving once the fresh half is known missing. If the fresh worker fails before emitting, these instructions give opposing answers: save the external return and leave `missing: "fresh"`, or wait for a commit that cannot exist. Add the missing-half exception to the table and a scenario plus integration case for a failed fresh worker with a successful external return.

### A stopped fresh worker can leave a member the engine still counts
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review/spec.md:99
**Description**: Step 6 declares a stopped or failed half MISSING and commits nothing for it. The fresh worker persists directly into the live trail before returning, however, and membership depends on accepted files rather than process completion or git commits. A worker stopped after `orbit emit review` can leave an accepted fresh file behind. Saving the external return then completes the pair’s first slot even though the orchestrator declared the fresh half missing and left its file uncommitted. Define recovery from the actual persistence state: either recognize the accepted file as the landed member and commit it, or explicitly quarantine a failed candidate before continuing. Test interruption both before and after persistence.

## SUGGESTION

### Define how existing review flags apply to the pair
**File**: orbit/changes/rc17b-blind-pair-command/specs/orbit-review/spec.md:98
**Description**: The pair specifies its reviewers but leaves existing flags such as `--fast`, `--focus`, `--strict`, `--skip-verify`, and proposal-mode `--mark` without a pair-specific routing contract. A compact compatibility table should identify which flags reach each half and when marker writes occur. This would make invocations such as `--blind-pair --skip-verify` predictable and keep marker writes outside concurrent review work.

## Blocks

None.

## Direction

**Disposition**: hold

Settle retry validity, fallback commit selection, and missing-half recovery before implementation proceeds. These rules determine whether the command delivers independent reviews of the intended state. The recovery paths currently undermine that promise even when reviewers follow their instructions.

## Notes

Compared every MODIFIED requirement block with its archived owner and followed the referenced runner and gate contracts. Strict validation succeeded; the scenario-map notices remain informational before apply. No unresolved inline review markers were found.

The state-transition probes ran read-only against the installed engine after checking that the relevant gate and save sources matched this checkout. The central risk is recovery: the happy-path ordering is explicit, while retries and interrupted workers inherit assumptions that no longer consistently hold.