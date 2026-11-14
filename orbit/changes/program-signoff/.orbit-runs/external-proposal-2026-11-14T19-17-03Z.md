# External Review: program-signoff (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-14

## CRITICAL

None.

## WARNING

### An unavailable PR state can bypass the required re-sign
**File**: orbit/changes/program-signoff/specs/orbit-architect/spec.md:32
**Description**: The `re-sign` branch asks again only when `pr.state` is `draft` or `unverified`, treating every other result as ready or absent. The existing command returns `observations.pr: null` for additional outcomes: `unobserved` or `gh-absent` when no recorded URL exists, and `several` when discovery finds multiple candidates. For example, after a signed program gets a changed brief, a failed discovery with no recorded URL produces no `pr.state`; the prescribed “otherwise” branch skips re-sign even though the PR state is unknown. This contradicts D-ps-7’s requirement to ask again when the state cannot be read. Specify branches using the actual `observations.pr`, `observations.outcome`, and candidate fields. Exempt only positively established ready or absent results; define conservative behavior for failed and ambiguous observations, with scenarios for each.

### Archive completion does not establish that changes have merged
**File**: orbit/changes/program-signoff/specs/orbit-program-brief/spec.md:353
**Description**: The `program` row requires the brief to say every change has already landed under `pr: per-proposal`, while the proposal and exploration explicitly describe those changes as already merged. The completion checks establish that changes were archived, not that their PRs merged. The per-change archive can flip a PR READY while leaving its merge to the human. A program whose stages are archived and closing review is recorded can therefore reach sign-off while its per-change PRs remain open. Implementing the required wording would misrepresent what the user is signing. Describe the established fact—each change has passed its archive seam and program sign-off does not hold its individual READY flip—or require live merge evidence before claiming it merged. Specify the brief’s wording and add a scenario with archived changes whose PRs remain open.

## SUGGESTION

### The archived capability purpose will retain the old sign-off contract
**File**: orbit/specs/orbit-program-brief/spec.md:4
**Description**: The baseline Purpose describes only `off` and `change`, saving only active change briefs, and the change-targeted hold. The delta updates requirements but supplies no task to update this overview. Include an explicit update so the archived capability also describes `program`, per-doc saved briefs, and the program hold.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the PR-observation branches and the unsupported claim that archived work has merged before implementation. Both affect what the user is asked to approve and whether renewed approval is requested when the program PR’s state is unknown.

## Notes

I compared the modified requirement blocks with their archived baselines, checked the rename sources, scanned the change artifacts for unresolved inline review markers, and traced the existing stage-state computation and program PR readout. The artifacts contain no unresolved inline review markers.

Runtime validation was unavailable: this checkout has no built `dist/` entry point or installed toolchain. The validation result remains unverified.

The environment is read-only. I could not write the findings file, commit it, or push it; the findings above must be saved and committed manually.