# External Review: d6-pr-lifecycle (iteration 3)

**Reviewer**: GPT-5 Codex
**Date**: 2026-08-25

## CRITICAL

### An absent attachment both triggers discovery and prohibits the tail
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:103
**Description**: The discovery rule says that when `pr_attachment` is absent, the body falls back to a branch-name query and can proceed against exactly one matching PR. The same requirement later says attachment absence makes the change byte-identical to pre-capability behavior, task 4.3 says an unattached change skips, and the consent delta deliberately omits the outward-writes preview for that state. A `new`/`continue` change with a manually opened matching PR can therefore either skip or commit, push, edit, and flip after a prompt that disclosed none of those writes. Make the fallback query available only when an attachment exists but lacks `url`; make a wholly absent attachment terminate the PR path before remote/`gh` work, and add an integration case with an unattached change plus a matching open PR.

## WARNING

### `pr: never` has incompatible output contracts
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:19
**Description**: `never` and an absent key promise byte-identical pre-capability behavior, but the next paragraph requires a no-remote/no-`gh` degradation note regardless of configuration; the propose requirement and task 3.1 also group `never` with degraded modes under one-note behavior. Thus an unset/`never` repository without a remote can either remain silent or emit a new note, and an implementation may unnecessarily probe `gh` in a disabled mode. Define precedence explicitly: availability resolution and its note should run only after a recognized active mode selects PR behavior, while absent/`never` should return without probing or output; also state how invalid-value/invalid-shape warnings interact with unavailable tooling.

### Compatible per-proposal branches can be impossible to reuse at the specified seam
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:7
**Description**: PR choreography starts only after artifacts have been generated in the current worktree, yet the reuse path may then need to switch to an existing compatible per-proposal branch. That branch is defined as carrying this change's artifact commits, so it commonly already tracks the same paths that are currently untracked on the default branch; Git refuses the switch because those files would be overwritten. The specification requires reuse but defines neither a safe transport/sequencing mechanism for the generated artifact set nor a switch-failure outcome. Specify how artifacts survive selection of an existing target branch (or move target-branch selection before generation without allowing premature outward writes), and add a harness case that proposes from the default branch while a compatible per-proposal branch already tracks the change paths.

### Archive failures strand a non-rerunnable tail without completion commands
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-archive-modifications/spec.md:194
**Description**: The design rejects an automated retry surface in favor of precise manual completion, but the archive contract only asks for a completed-vs-skipped note after push/`gh` failure. At that point the active change has already moved and emitted, so `/orbit:archive` is no longer a retry path; a failed push leaves a local archive commit, while failed edit/READY calls leave different remote states. Define the exact repository-qualified commands and consequence for each remaining step after commit, push, description edit, or READY failure, and cover those partial-state cases in the integration harness. Also state that staging/commit failures use the same stop-and-report rule rather than leaving those errors outside the degradation contract.

### Arc-done lookup validates a recorded URL but defines no invalid-URL branch
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:226
**Description**: The architect readout selects the most recent URL-bearing record and then validates it live, but fallback discovery is specified only when no URL-bearing record exists. The text separately handles an `isDraft` query failure as `state unverified`; it never says what to do when validation positively finds the recorded PR closed, merged, retargeted, in another repository, or missing. A fresh implementation can suppress the required readout, surface commands for the invalid PR, or query for a replacement. Define each validation outcome and whether it stops, scans an older record, or invokes the constrained fallback, then add architect-readout cases for semantic invalidity separately from transport/auth failure.

## SUGGESTION

### Attachment state is not permanently draft by construction
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-pr-lifecycle/spec.md:212
**Description**: The live-state rationale says `pr_attachment.state` is permanently `"draft"` by construction, while the attachment schema allows `"ready"` as an observed value and the same change explicitly permits adopting an already-READY program PR. The conclusion—architect must query live state—is still correct, but the stated premise contradicts supported input. Describe the field as a point-in-time observation that becomes stale after emit, regardless of whether its initial value was draft or ready.

### The no-CI probe has no specified Git ref
**File**: orbit/changes/d6-pr-lifecycle/specs/orbit-propose-modifications/spec.md:47
**Description**: “A repository with no `.github/workflows/`” can be evaluated in the pre-switch worktree, the reused target branch, or the resolved remote default branch, and those can disagree—especially for a long-lived program branch. Bind the check to one ref (preferably the already-fetched resolved remote default branch) and add a fixture where the target branch and base disagree, so the note is deterministic and describes the CI context the new PR actually inherits.

## Notes

The dominant residual pattern is authority at negative and partial states: the happy paths now carry strong identity constraints, but “no attachment,” “invalid recorded URL,” and “some tail steps already completed” still allow different bodies to make materially different outward decisions. I walked those states across the consent preview, emit timing, archive move, branch reuse, and arc-done readout, and reproduced the existing-branch checkout collision with a disposable Git repository.
