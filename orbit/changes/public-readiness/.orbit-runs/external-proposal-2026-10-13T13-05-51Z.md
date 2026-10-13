# External Review: public-readiness (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-13

## CRITICAL

None.

## WARNING

### Deleting the Nix job leaves retained CI jobs referencing it
**File**: orbit/changes/public-readiness/design.md:74
**Description**: D2 deletes `nix-flake-validate` and explicitly says nothing else in the workflow changes. However, `.github/workflows/ci.yml:279` and `:305` retain that job in the `needs` lists of both “All checks passed” jobs, and their scripts also inspect its result. Following the design literally leaves dependencies on a nonexistent job. Explicitly require removing the Nix dependency and result-handling branches from both aggregate jobs, and verify that every retained `needs` entry names a retained job.

### The readiness record never observes the three-platform test matrix
**File**: orbit/changes/public-readiness/tasks.md:43
**Description**: Task 5.2 records only the pull request’s CI run. Under the job shape D2 preserves, `test_matrix` runs only on a push to `main`; the PR exercises Linux alone. Consequently, the record can declare CI observed while macOS and Windows remain untested, despite D2 explicitly anticipating failures on platforms where the suite has never run. Also, the scenario’s “every CI job completes successfully” cannot literally hold on a PR because the push-only jobs are skipped. Define success for applicable jobs, and add an explicit observation of the post-merge `main` matrix before the release/public-readiness exit is accepted, or arrange for the matrix to run before merge.

### Token matches have no false-positive disposition or precise detection rule
**File**: orbit/changes/public-readiness/specs/orbit-public-repository/spec.md:43
**Description**: Every token-shape finding must be removed and rotated, but the artifacts themselves contain literal `ghp_`, `github_pat_`, `sk-` and `AKIA` examples. The detection rule gives prefixes without lengths or boundaries, so an implementation using those stated patterns will find harmless prose that cannot be rotated; another implementation may silently choose stricter patterns and produce different results. Specify the actual matching rules and distinguish candidate matches from confirmed credentials. Add a documented false-positive disposition for examples and ordinary text, while retaining removal and rotation for confirmed secrets.

### Scan resolution contradicts the required treatment of secrets found only in history
**File**: orbit/changes/public-readiness/specs/orbit-public-repository/spec.md:55
**Description**: The table requires a historical token to be rotated while history is never rewritten. The scenario nevertheless requires “a removal for each RESOLVED finding,” which includes those historical tokens. A historical-only credential therefore cannot satisfy both instructions. Require evidence appropriate to each row: removal and rotation for a current credential, rotation or revocation for a historical credential, and the stated reason for an accepted finding. Define how those actions are evidenced without putting credential values into the readiness record.

## SUGGESTION

### The root inventory contains twenty-two files, not twenty-one
**File**: orbit/changes/public-readiness/design.md:48
**Description**: The disposition table enumerates twenty-two files, matching the current tracked root listing. The “21” claim also appears in the design’s Context and in explore.md. Correct those figures to twenty-two. No file appears missing from the table; the discrepancy is in the recorded count.

### Readiness-record citations need to survive archive
**File**: orbit/changes/public-readiness/tasks.md:45
**Description**: Task 5.3 cites `readiness-record.md` from `orbit/scenario-ledger.yaml`, while D7 says the record moves with the change at archive. A citation to `orbit/changes/public-readiness/readiness-record.md` will then become stale, and the scenario-map reader only requires a non-empty citation rather than checking its destination. Explicitly require updating these ledger citations to the archived record path at the archive seam.

## Blocks

None.

## Direction

**Disposition**: hold

The cleanup scope is coherent, but the CI instructions need to account for dependencies on deleted jobs and for platform checks that occur only after merge. The scan also needs an executable classification rule and mutually consistent evidence requirements. Resolve those ambiguities before implementation so the readiness record can substantiate the claims it makes.

## Notes

I read the proposal, design, tasks, exploration, all three delta specs, the affected baseline specs, project guidance, the public-readiness architecture charter, and the existing CI and package configuration. The source-lint modification preserves the baseline’s eight scenarios and removes the intended historical exclusion row. `orbit validate public-readiness --strict` exited successfully; its scenario-declaration messages are informational and correspond to work planned in the tasks. No unresolved inline review markers were found in the proposal artifacts.