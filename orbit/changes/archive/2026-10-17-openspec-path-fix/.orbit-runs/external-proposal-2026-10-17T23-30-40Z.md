# External Review: openspec-path-fix (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-10-17

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

### Include user-level schema overrides in the adoption caveat
**File**: orbit/changes/openspec-path-fix/proposal.md:43  
**Description**: The adoption caveat mentions project-local forks, but `getSchemaDir` also prefers user-level schemas over the package schema (`src/core/artifact-graph/resolver.ts:75`). A stale user override will continue serving the incorrect paths after upgrading, and forks made from that override will inherit them. Extend the caveat and design's risk statement to cover user-level overrides, and qualify the claim that every subsequent fork receives the fix: its resolved source must be the updated package schema.

## Blocks

None.

## Direction

**Disposition**: forward

The proposed changes are precise and consistent across the proposal, design, delta spec, and tasks. They correct the instruction paths and extend the existing guard within a clearly defined scope. The adoption caveat could describe schema precedence more fully, but that does not undermine the package fix.

## Notes

`orbit validate openspec-path-fix --strict` passed using the installed CLI. It reported the new scenario as undeclared; task 1.2 explicitly adds its declaration during implementation. No unresolved inline review markers were found in the change artifacts.

Checked the baseline requirement, source-scan helper, existing tests, schema instructions and template, resolver precedence, fork implementation, and hash pins. This checkout has neither dependencies nor built output, so repository tests and the checkout's CLI were not run.

The environment is read-only. I could not write the findings file or commit/push it; the complete findings are provided here for manual saving and committing.