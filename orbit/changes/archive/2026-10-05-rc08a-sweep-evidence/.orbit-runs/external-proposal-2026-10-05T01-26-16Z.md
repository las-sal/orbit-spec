# External Review: rc08a-sweep-evidence (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-05

## CRITICAL

None.

## WARNING

### An in-change miss cannot have the scenario's `scope` kind
**File**: orbit/changes/rc08a-sweep-evidence/specs/orbit-address-reviews/spec.md:51
**Description**: The scenario calls a leftover in this change's `design.md` a `scope` miss because the earlier entry has `scope: []`. But the gate spec puts every file under a change directory in every entry's CHECK SCOPE, regardless of `sweep.scope`; `design.md` is therefore inside it. This makes the example contradict the closed `kind` definition and would teach the walker to misclassify a common miss. Define `scope` against the walker's recorded examined scope if that is the intended distinction, or move the example's leftover to a path outside the change directory and its other scope members.

### Legacy resolved walks cannot be named as ripple misses
**File**: orbit/changes/rc08a-sweep-evidence/specs/orbit-emit-composition/spec.md:58
**Description**: The pointer check requires the earlier entry to have `outcome: "resolved"`, while the trail reader deliberately recognizes legacy `status: "resolved"` when `outcome` is absent. Archived trails contain such resolved entries, and archived-fallback walks use those same trails. A later walk therefore cannot attribute a miss to one of them even though the trail reads it as resolved. Use the trail reader's normalized disposition for the earlier record; keep the new-payload `status`-only refusal in the separate sweep requirement.

### The pointer is both verbatim and normalized
**File**: orbit/changes/rc08a-sweep-evidence/specs/orbit-address-reviews/spec.md:39
**Description**: This requirement says `ripple_miss_of.title` and `.file` are the earlier entry's values verbatim. The gate instead trims the title and strips the file's line suffix, and its success scenario accepts pointer `file: "design.md"` for an earlier entry on `design.md:40`. Those contracts produce different payloads. State that the pointer carries the normalized key, as design D6 and the gate scenario intend, and adjust the walk-body guidance accordingly.

### The promised suffix rule is not the function tasks reuse
**File**: orbit/changes/rc08a-sweep-evidence/specs/orbit-emit-composition/spec.md:15
**Description**: The path rule strips `:<line>` and anything after it, but `stripLineSuffix` in `src/core/artifact-graph/trail.ts` currently strips only a terminal `:<digits>` or `:<digits>:<digits>`. Design D6 and task 1.2 say to export and reuse that function without specifying a behavior change. A path such as `design.md:40 (section)` would be stripped under the spec and left unresolved under the planned implementation. Either narrow the accepted suffix syntax in the spec or extend the shared function and test its effect on both path resolution and trail keys.

### Text presence cannot certify an edit set landed
**File**: orbit/changes/rc08a-sweep-evidence/design.md:22
**Description**: The design says the retired/introduced checks close charter job (3), including an edit set that half-applied. The gate tests final text presence, not whether each intended edit occurred. For an addition-only fix with `retired: []`, if the same `introduced.text` already appears elsewhere in its named file, a missed addition passes. Narrow the claimed guarantee to the observable text assertions, or add an edit-specific check if the all-or-nothing claim is required.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the conflicting scope and pointer rules before implementation. The edit-presence claim also needs a narrower contract or a check that can establish it; otherwise a passing walk log can overstate what landed.

## Notes

I read the change artifacts, relevant baselines, trail reader and emit implementation, and project handoff. `orbit validate rc08a-sweep-evidence --strict` exits successfully. Its scenario-map notices are informational at this proposal stage, and the tasks explicitly schedule declarations. The visible `@review:` strings are documentation of marker syntax, not unresolved markers.
