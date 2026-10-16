# External Review: release (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-15

## CRITICAL

None.

## WARNING

### Suffixed refs pass as the exact current release pin
**File**: test/helpers/user-docs.ts:597
**Description**: The version scanner reads only the three numeric components, and the install-command matcher permits a following hyphen. Running the actual helper against a README containing only `npm install -g github:las-sal/orbit-spec#v2.0.1-missing`, with version `2.0.1`, returns `[]`. So does `#v2.0.1-rc.1`. Neither supplies the required current release command, but both satisfy the check. Parse and compare the complete install ref, and require the command argument to end after the exact version. Add regression cases for prerelease and arbitrary suffixes.

### README install changes omit the required apply-time sandbox verification
**File**: orbit/changes/release/tasks.md:23
**Description**: The archived `orbit-conventions` requirement “Install documentation describes actual install surface,” scenario “README-modifying changes pair with sandbox verification,” requires an apply-time fresh-sandbox task whenever README installation instructions change. This change updates the install target, but its tasks stop at tests and a local `--version` check. The design instead defers installation observation until ratification. Include the required end-to-end sandbox verification task and evidence, or explicitly amend the baseline requirement to permit deferred verification for release-pin changes.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The version bump and docs edits are consistent, but the new guard accepts install refs other than the intended release, and the verification plan does not satisfy the archived README installation contract. Resolve those gaps before moving forward.

## Notes

Reviewed the diff from `b1c1ad4d` through HEAD, release artifacts, affected helpers and callers, and relevant archived contracts. All tasks are marked complete. The installed `orbit status --change release --scenarios --json` reports behaviour declarations for all eleven delta scenarios, with no uncovered scenarios, orphans, or malformed declarations. Installed `orbit validate release` succeeds, and the diff whitespace check passes. No unresolved review markers were found in the change artifacts.

The checkout lacks dependencies and built CLI output, so the full test suite and checkout-local CLI execution were not run. The install-ref finding was reproduced by executing the actual helper section through Node’s TypeScript stripping API without writing files. Project context and named perspective/critical-path files were absent.

The environment is read-only. I could not save the findings file or commit/push it; this complete chat report must be saved and committed manually.