# External Review: release (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-15

## CRITICAL

None.

## WARNING

### The historical phrase admission cannot match the shipped README
**File**: orbit/changes/release/specs/orbit-user-docs/spec.md:17
**Description**: The exact admission requires “orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0” on one source line. README.md:14–15 wraps that phrase across two lines. Applying the specified check after the version bump therefore rejects both historical tokens and reports the phrase admission as stale, contradicting the shipped-docs passing scenario. The scenario at line 47 also supplies only the shorter phrase “orbit 2.0.0 is orbit's first release”, which cannot match the exact admitted phrase. Define matching across normalized soft-wrapped whitespace while preserving token locations, or specify separate exact admissions that match the actual source. Align the scenario fixture with that decision and test the shipped wrapping.

### Value admissions and a tag-only presence check can accept a wrong install pin
**File**: orbit/changes/release/specs/orbit-user-docs/spec.md:24
**Description**: The normative table requires the GitHub install pin to equal the package version, but the operational rules permit any admitted value anywhere and describe the presence check only as finding `#v<version>`. With package version `2.0.1`, an installation page containing `npm install -g github:las-sal/orbit-spec#v1.3.1` and the prose “The `#v2.0.1` tag names a release tree” can pass: `v1.3.1` is admitted by value and the prose supplies the current tag. This diverges from the intended guarantee that the documented install command installs the current release. Specify that every `github:las-sal/orbit-spec#v<x>` install target must use the current version regardless of value admissions, and that each required page must contain an actual current install command. Add a negative scenario covering a wrong install target beside current-tag prose.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the phrase-matching contract and the install-pin precedence before implementation. As written, the check can reject the intended historical text while accepting an install command that names the wrong release.

## Notes

`orbit validate release --strict` passed. Its scenario-map messages identify the new scenarios as not yet implemented, consistent with proposal mode. No inline review markers were found in the change artifacts. The modified requirement preserves its baseline scenarios. Review included the release baseline, current documentation, check helpers, and the governing architecture; no implementation tests were run.