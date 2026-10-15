# External Review: docs-refinement (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-15

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

### Explicitly skip stage ratification on the one-off path
**File**: docs/getting-started.md:26
**Description**: The one-off guidance says “the steps below run the same way without a citation,” but step 8 invokes `/orbit:architect app-theming`. A reader who skipped step 0 has no such program; the archived `orbit-architect` contract says this invocation creates an architecture doc when absent. Say that the one-off path follows steps 1–7 and skips step 8, and qualify step 8 as applying only to a program-backed change.

### Assert the start-section inventory independently
**File**: test/core/user-docs/start-sections.test.ts:30
**Description**: The shipped-docs test consumes `START_SECTIONS` and verifies that its members have pages, but never asserts the exact eight-member inventory required by the delta spec. Accidentally removing a member silently removes its coverage while the test remains green. Add an explicit equality assertion against the specified page-and-heading pairs.

## Blocks

None.

## Direction

**Disposition**: forward

The implementation follows the proposed scope and makes the edited start passages architect-first while retaining the optional one-off path. The remaining issues concern tutorial clarity and protection against future coverage erosion; neither warrants holding this documentation change.

## Notes

Reviewed the change range beginning at `213f3844`, the proposal, design, tasks, delta specs, relevant archived contracts, edited documentation, and test-helper integration. No production CLI, MCP, HTTP, or public-function implementation changes appear in the range.

The named perspective and critical-path lens files are absent. I walked the documented program-backed and one-off paths directly.

Scenario coverage verification and strict validation were not run successfully: both CLI invocations failed because `dist/cli/index.js` is missing. Dependencies are also absent, and the read-only environment prevents building or installing them, so tests were not run. No scenario-coverage conclusion is inferred from test-file searches.

Task 5.1 remains explicitly unchecked for Sal’s page review. The implementation tasks are marked complete; this human validation remains outstanding.

---

I could **not** write the findings file or commit/push it because this environment is read-only. The complete review above is ready to save manually.