# External Review: seam-chaining-grants (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-10

## CRITICAL

None.

## WARNING

### Apply scenarios contradict the withdrawn-grant exception
**File**: orbit/changes/seam-chaining-grants/specs/orbit-run-summary-emit/spec.md:35
**Description**: “A granted apply records setting” requires every later emit to retain the same consent value, and “Consent constant across one apply's chunk emits” makes the same unconditional promise. Both conflict with the newly specified withdrawal path, where a later emit omits `consent`. An implementation following these scenarios could retain a withdrawn grant or fail to write the later summary. Qualify both scenarios with the withdrawal exception, or explicitly require the grant to remain enabled throughout the invocation.

### Program-PR scenario assumes an initially draft PR
**File**: orbit/changes/seam-chaining-grants/specs/orbit-archive-modifications/spec.md:280
**Description**: The granted program-PR scenario says the PR “stays a draft,” but its inputs do not require a draft PR. The archived baseline explicitly supports already-ready program PRs, including adopted PRs, and requires their observed state to be preserved. Replace this assertion with preservation of the observed draft/ready state and absence of a ready flip, or restrict this scenario to an initially draft PR.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the scenario contradictions before moving forward so the acceptance criteria agree with the intended withdrawal behavior and supported PR states. The inspected implementation follows those intentions; the conflicting scenarios leave future implementations and verification with incompatible instructions.

## Notes

Reviewed the implementation range beginning at `364fcbf7`, the proposal, design, completed tasks, delta specifications, affected archived requirements, and callers around chaining, emit composition, and archive-tail choreography.

Using the globally installed `orbit` 2.0.2, strict change validation and source validation passed. The scenario map reported 109 delta scenarios, zero uncovered scenarios, and no orphaned or malformed declarations. These are declaration checks, not evidence that tests executed.

Build and tests were not run: the checkout lacks dependencies and compiled CLI output, and filesystem access is read-only. Project, convention, perspective, and critical-path files requested conditionally were absent apart from `CLAUDE.md`.

I could not write the findings file or commit/push because this environment is read-only. The complete report is provided here for manual saving and committing.