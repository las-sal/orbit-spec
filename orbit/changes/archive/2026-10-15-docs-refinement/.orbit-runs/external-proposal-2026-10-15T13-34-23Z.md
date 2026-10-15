# External Review: docs-refinement (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-15

## CRITICAL

None.

## WARNING

### The exact start-section list excludes an existing new-first starting path
**File**: orbit/changes/docs-refinement/specs/orbit-user-docs/spec.md:23
**Description**: The table classifies “every other passage” as reference or example, but `docs/workflows.md:35-47` explicitly instructs readers to “create the change with `/orbit:new`” under “Step by step.” This section suggests where new work starts, yet neither the exact seven-section list nor task 2.3 includes it. Implementing the listed edits leaves this new-first path intact while the check passes, contradicting the modified `orbit-architect` requirement and program goal G1. Add this section to the checked list and explicitly task its architect-first introduction, preserving new/continue as the subsequent artifact-by-artifact path. Resolve this known omission during proposal rather than leaving it for the apply-time residual sweep.

## SUGGESTION

### Adding architect makes the getting-started introduction’s command count stale
**File**: orbit/changes/docs-refinement/tasks.md:11
**Description**: Task 2.1 adds architect to README’s six-command first-change list, but getting-started’s introduction (`docs/getting-started.md:3`) still says Quickstart lists “the six commands.” Task 2.2 covers the new step and renumbering without mentioning this cross-page count. Update the introduction alongside the list, preferably removing the explicit count to avoid future drift.

## Blocks

None.

## Direction

**Disposition**: hold

The proposal should account for the existing “Step by step” starting path before implementation. Its explicit exclusion undermines the intended coverage of the architect-first rule and would let the new check certify documentation that still recommends starting new work with another command.

## Notes

Both capability deltas use valid operation sections and preserve the modified requirements’ baseline scenarios. `orbit validate docs-refinement --strict` passed; it reported the four new scenarios as undeclared, which task 1.2 plans to address. No inline review markers were found in the change artifacts. Dependencies and the local build output are absent, so implementation tests were not run.

The environment is read-only. I could not write the findings file or commit/push it; the complete review is provided here for manual saving and committing.