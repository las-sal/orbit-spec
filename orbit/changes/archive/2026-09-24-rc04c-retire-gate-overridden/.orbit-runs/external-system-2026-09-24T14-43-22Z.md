# External Review: rc04c-retire-gate-overridden (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-24

## CRITICAL

### The workflow bodies mistake every external return for a readable pass
**File**: src/core/templates/workflows/archive-change.ts:285
**Description**: Step 3.4 says to cite every `external-<mode>-<TS>.md` and asserts that this set is exactly what the write gate resolves; the same instruction is repeated at archive Step 5.5 (`archive-change.ts:386`), apply (`apply-change.ts:205`), and the review-external spend seam (`review.ts:481`). That is false for a rejected external return: `readTrail` puts a malformed external artifact in `rejectedExternals`, not `passes`, and the new owning requirement explicitly says it is not a member of the resolution set. On the critical path where the trail contains only a rejected external return, the shipped reference correctly teaches `formed_against: []`, but the body tells the composing AI to cite the rejected token; `judgementOrderingCheck` then refuses it as unresolvable. At archive this refusal happens after the move, leaving the successfully moved change without its required archive summary. This is the fourth duplicate-rule drift the task preamble warned about, and the apply emit's claim that no fourth instance appeared is therefore false. Make every writer obtain the same readable pass set the engine uses (preferably through a reader-backed engine surface rather than filename re-enumeration), update all three bodies, and add a generated-body regression for the rejected-external-only path.

### The owning requirement still defines the zero-pass record out of existence
**File**: orbit/changes/rc04c-retire-gate-overridden/specs/orbit-run-summary-emit/spec.md:132
**Description**: The requirement still defines a cadence judgement as a decision formed against independent review output and calls that the exact qualifying test. Lines 140-148 then say membership is instead determined by cadence position and expressly admit a proceed decision when no independent output exists; lines 187-204 make that evidence-free record the headline totality case. The added exclusion paragraph did not repair the opening definition, so the canonical requirement still gives mutually exclusive answers about whether the record belongs in `judgements`. Rewrite the definition and qualifying test around cadence position, with `formed_against` recording the readable evidence available at that position and `[]` being a checked assertion for `continuation/proceed`; do not leave the exception to contradict the definition it is meant to widen.

## WARNING

### The final task-count record is arithmetically stale in two places
**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:18
**Description**: The preamble says the ratified count was 34 and is "now 35", while also saying that tasks 5.1e and 5.1f were added; the file actually contains 36 checked boxes, and the apply emit independently computed `tasks_completed: 36`. The live program section still says the stage sits at 34 tasks and calls that its real figure (`orbit/architecture/clean-up-review-cycle.md:1742`). Ratifying the breach rather than a number preserves the authorization, but it does not make the current size record true. Correct the preamble to 36 and route an architect-owned amendment that distinguishes the 34-task ratification-time measurement from the final 36-task stage.

## SUGGESTION

None.

## Notes

I ran strict change validation, source-marker validation, the build, and the full 2,241-test suite. I also walked proceed-anyway with two readable independent passes, only an in-context pass, only a rejected external return, and no pass. The engine behaves consistently with `readTrail(...).passes`; the highest-risk drift is in the prose that teaches AIs how to construct the payload before that engine check runs.
