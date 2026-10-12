# External Review: rc12-body-adoption (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### Recovery instructions omit the failed command
**File**: src/core/templates/workflows/pr-choreography.ts:25
**Description**: The consumption table requires recovery argv only for *skipped* steps, omitting the step that failed. If the archive tail’s final `ready` step fails, there are no later skipped steps, so the prescribed recovery contains no command. If `push` fails, recovery can start with `rewrite` without first landing the archive commit. This conflicts with the explicit failure-specific recovery requirements in `orbit-archive-modifications` and `orbit-propose-modifications`. Include the failed step followed by the unexecuted steps, with input tokens resolved, and describe the actual resting state rather than calling every failure “unattached.” Update the owning delta and its checked mirror together.

### Arc-done readout does not cover observations without a PR URL
**File**: src/core/templates/workflows/pr-choreography.ts:185
**Description**: The reference reports observation failure only through `observations.pr.state: unverified`. However, `prProgram` returns `proceed` with `observations.pr: null` when a URL-less program attachment exists and resolution or discovery fails. Its candidates and human acts can also be empty, leaving every prescribed readout item empty despite the requirement that the readout never be suppressed. A successful zero-result query likewise lacks an explicit reporting instruction. Add instructions for `observations.outcome`, `resolution_failure`, and `query_error`, distinguishing unavailable observation from confirmed absence and reporting either even when `pr` is null.

### Archive no longer names unrelated unstaged edits
**File**: src/core/templates/workflows/pr-choreography.ts:155
**Description**: The rewritten archive reference names only `observations.unrelated_staged`. The tail filters that field to staged entries, so an unrelated tracked file with unstaged edits—such as a capability spec this sync did not touch—is omitted from the completion note. The archived `orbit-archive-modifications` requirement explicitly requires both unrelated dirty paths and unrelated staged paths to be named. Preserve that reporting contract by exposing the unstaged paths in the tail record and consuming them in the reference; keep their exclusion from the commit unchanged.

### Retargeting example reports the expected base as the observed base
**File**: src/core/templates/workflows/pr-choreography.ts:133
**Description**: The reference suggests describing a retargeted PR as “retargeted to” its `expected` base. `validatePrUrl` puts the PR’s actual base in `reason.detail.observed` and the resolved default branch in `expected`. For a PR retargeted from `main` to `release`, this instruction would report “retargeted to main,” reversing the observation. Use `observed` for the retargeted-to value and optionally name `expected` separately.

## SUGGESTION

### Proposal does not declare the added CLI-grammar scope
**File**: orbit/changes/rc12-body-adoption/proposal.md:36
**Description**: The proposal lists only `orbit-pr-lifecycle` as modified, while the final change also modifies two `orbit-cli-grammar` requirements and stamps their fingerprints. The apply record explains this scope addition, but the proposal and design still describe the earlier scope. Add the capability and briefly explain the inventory-exemption removal and revised grammar scenario so the artifacts describe the implementation being reviewed.

## Blocks

None.

## Direction

**Disposition**: hold

The shared targeting predicate and earlier archive preflight fit the intended design. The workflow adoption still needs complete failure recovery and truthful reporting for empty or failed observations. Resolve those gaps before treating the shorter references as a complete replacement for the runbook.

## Notes

All task checkboxes are marked complete. Static comparison found no removed scenario headings in the modified requirements. Evaluating the reference constants produced 6,168, 5,317, and 962 bytes, each below its stated ceiling.

Scenario coverage verification and strict validation were not run successfully: both CLI attempts failed because `dist/cli/index.js` is absent. The read-only environment prevents building the checkout; dependencies are also absent, so the test suite was not run. These are review-environment limitations, not demonstrated validation failures in the change.

The requested project, convention, perspective, and critical-path files were absent. The review used the repository orientation, baseline capability specs, commit-range diff, and affected workflow and PR code.