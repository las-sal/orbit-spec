# External Review: rc09a-size-record (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-10

## CRITICAL

None.

## WARNING

### Multiline declaration reasons have conflicting interpretations
**File**: orbit/changes/rc09a-size-record/specs/orbit-change-size/spec.md:125
**Description**: An empty reason makes an item MALFORMED, but continuation lines are also defined as part of its reason. For `- tasks:` followed by an indented non-empty explanation, a line scanner rejects the declaration while an item-based parser accepts it. This changes whether strict validation passes. Specify whether the reason must begin on the item’s first line, define indentation and item termination, and add scenarios for continuation-only reasons and nested bullets.

### Size computation does not specify filesystem failure behavior
**File**: orbit/changes/rc09a-size-record/specs/orbit-change-size/spec.md:19
**Description**: The computation handles missing baselines and missing tasks, but leaves unreadable files and directories unspecified. An unreadable baseline could be treated as absent, inflating changed bytes, or throw and prevent ordinary status from rendering—even with the ceiling disabled, because JSON always computes size. An unreadable delta could likewise be skipped or abort validation. Define missing versus unreadable behavior for the specs directory, delta files, baselines, tasks and proposal. Specify the diagnostic and command outcome for each, and cover those paths in the implementation tasks.

### Split does not override the existing completion instruction
**File**: orbit/changes/rc09a-size-record/specs/orbit-propose-modifications/spec.md:18
**Description**: Choosing Split recommends returning to exploration, but the requirement still completes propose and leaves its existing completion behavior untouched. The current template’s completion override instructs the user to run `/orbit:review <name>`, and its completion emit carries the engine’s review pointer. An implementation that simply inserts the specified step can recommend exploration and then immediately recommend reviewing the unsplit proposal. Explicitly define the final chat instruction for Split, its precedence over the existing completion prompt, and how the unchanged engine pointer is presented. Add a rendered-body assertion for that branch.

## SUGGESTION

### Empty ceiling maps changed semantics without a recorded narrowing
**File**: orbit/changes/rc09a-size-record/explore.md:80
**Description**: The exploration specifies that a map with zero valid entries is ON, comparing nothing; the delta specifies OFF. This affects `ceiling: {}` versus `null` and whether the human `Size:` line appears. The design records the repeated-heading narrowing but not this one. Record the final decision explicitly and mark the exploration’s earlier outcome as superseded.

### Clarify which status render modes carry size
**File**: orbit/changes/rc09a-size-record/specs/orbit-change-size/spec.md:194
**Description**: The status requirement promises a top-level size object on every change, while the command has separate early-return render paths for `--boot --json` and `--scenarios --json`. The design excludes the boot render but does not state these exclusions in the owning requirement. Limit the requirement explicitly to ordinary change status, or specify the field’s behavior in each alternate render mode.

## Blocks

None.

## Direction

**Disposition**: hold

The central design is implementable, and the delta preserves the modified baseline’s scenarios. The declaration parser and failure behavior still allow materially different implementations, and the Split branch needs a consistent completion instruction before handoff.

## Notes

I checked the delta requirement names against the baselines, retained scenarios, task coverage, existing parsers, status render paths and propose completion instructions. No inline review markers were found. The existing parsers yield three capabilities, seven requirements and 17 tasks; a direct reading of the byte rule yields approximately 15 KB.

CLI validation could not run because this checkout lacks `dist/cli/index.js` and installed dependencies. This is an environment limitation, not an observed artifact-validation failure.

The environment is read-only. I could not write the findings file or commit/push it; this complete chat return is the manual-save fallback.