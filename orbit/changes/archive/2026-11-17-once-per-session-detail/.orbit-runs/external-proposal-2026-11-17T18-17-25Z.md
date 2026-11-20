# External Review: once-per-session-detail (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-17

## CRITICAL

None.

## WARNING

### Pre-emit gate check misses newly declared user-validation handoffs
**File**: orbit/changes/once-per-session-detail/specs/orbit-decision-records/spec.md:66
**Description**: The new cue reads the persisted apply gate before the run-summary emit and writes no account unless that gate already reads `passed`. However, `src/core/artifact-graph/gates.ts:892` obtains user-validation declarations from the latest persisted apply emit, not the current session’s pending payload. Consider a change with tasks 1.1 and 1.2 checked, only marked user-validation task 2.1 unchecked, and no earlier declaration of 2.1. The session prepares `user_validation_tasks: ["2.1"]`. Before its emit, status reports apply as `ready`, so the cue skips the account. The subsequent emit makes the gate pass, leaving the required account unwritten. This contradicts the retained user-validation scenario and changes existing instructions, which explicitly consider this session’s declaration. Define the pre-emit completeness check using the current declaration as well as persisted state, and add a test for a first declaration made in the completing session.

### Proposal specifies reference destinations that the design explicitly rejects
**File**: orbit/changes/once-per-session-detail/proposal.md:21
**Description**: The proposal directs four skills to gain `run-summary-schema.md` and three to append detail to existing schema references. Design Decision 2 explicitly rejects that arrangement and chooses a separate `run-summary-emit.md` for all seven skills; the delta spec and task 3.1 follow that decision. These are materially different installed surfaces and reading costs. Update the proposal to name the chosen destinations and acknowledge the documented deviation so the artifacts give implementers one consistent instruction.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The extraction approach is workable, but the account cue needs to preserve completion behavior when a session first declares a user-validation handoff. Resolve that ordering issue and align the proposal’s reference destinations with the design before implementation.

## Notes

`orbit validate once-per-session-detail` passed. Its scenario-map messages concern new scenarios whose test tags are already planned in the tasks. No unresolved `@review:` markers were found in the change artifacts.

The environment is read-only. I could not write the findings file or commit/push it; this Markdown is the complete review for manual saving and committing.