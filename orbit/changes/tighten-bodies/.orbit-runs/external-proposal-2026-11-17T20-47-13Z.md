# External Review: tighten-bodies (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-17

## CRITICAL

None.

## WARNING

### Description test conflicts with the unchanged audit-drift description

**File**: orbit/changes/tighten-bodies/tasks.md:28
**Description**: Task 5.1 requires every description to contain a “Use when” or “Use after” clause, but the current audit-drift description says “Use standalone when something feels off,” and design Decision 4 explicitly says that description stays unchanged. An implementation following both instructions cannot pass the specified test. Either allow other valid when-clauses in the test or authorize and specify a revision to audit-drift’s description.

### The RG1 amendment has no implementation task

**File**: orbit/changes/tighten-bodies/tasks.md:42
**Description**: The proposal and design require this change to write the amended RG1 limits into `orbit/architecture/reduce-orbit-phase1.md`, but the tasks only check the new figures and adjust the test ceilings. An implementer completing the checklist can leave the architecture document stating the old limits, making the shipped artifacts inconsistent. Add an explicit task to update RG1 and its associated text in the architecture document.

### Removing the new-change guardrail weakens its explicit boundary

**File**: orbit/changes/tighten-bodies/specs/orbit-conventions/spec.md:225
**Description**: The proposed replacement for “Do NOT create any artifacts yet” is a sequence ending in “STOP and wait for user direction.” That sequence does not explicitly prohibit creating an artifact while obtaining or presenting the first artifact’s instructions. The guardrail therefore carries a negative instruction that the cited steps do not state, contrary to the removal rule and the goal of preserving behavior. Retain the guardrail or add an equivalent explicit prohibition to the steps before removing it.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the conflicting description test and preserve the explicit new-change boundary before implementation. The architecture amendment also needs a task so that the implementation checklist closes the documented change.

## Notes

The delta requirement names were checked against the archived baselines. The occurrences of `@review:` in the reviewed artifacts describe marker syntax; they are not unresolved inline review markers. Validation could not be run because the checkout has no built `dist/cli/index.js`.

The workspace is read-only, so I could not write the findings file, commit it, or push it. The findings above need to be saved and committed manually.