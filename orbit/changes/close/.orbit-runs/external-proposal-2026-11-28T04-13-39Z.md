# External Review: close (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-27

## CRITICAL

None.

## WARNING

### Equal products can hide drift in both report settings

**File**: orbit/changes/close/design.md:55  
**Description**: The product check accepts a report configured for 4,000 tokens at five characters per token because `4000 × 5` still equals 20,000. At 20,000 characters that report prints 4,000 estimated tokens, while the new requirement says it computes 5,000. Assert both constants individually against the specified values and add a mutation that changes both while preserving their product. Update the spec and task 2.2 to require that check.

### The archive grading has no durable handoff

**File**: orbit/changes/close/tasks.md:3  
**Description**: The task says to keep the ceiling-history output without naming where to save it. The checklist ends at verification, while the design assigns the grades, Shipped as, status log, and `CLAUDE.md` update to a later archive session. A fresh session can finish the ordinary archive flow without finding those obligations or the evidence collected for them. Give the evidence a named destination and add an explicit archive checklist for recording the grades and including both documentation edits in the archive tail.

### The G0 evidence plan overlooks a known baseline discrepancy

**File**: orbit/changes/close/design.md:73  
**Description**: The previous stage’s Shipped as records that onboard dropped the “D-arc Stage D2” provenance and that neither scenario test asserts it. `orbit/specs/orbit-onboard/spec.md:56` still includes that wording in the expected output of “Enumerates orbit-distinctive layers.” A green suite and the removal rulings cannot settle whether this baseline expectation still holds. Require the G0 grade to account explicitly for the discrepancy and cite the rule that permits the omission, or record it as an unmet expectation.

### The proposed G3 evidence covers inventory entries and misses later edits

**File**: orbit/changes/close/design.md:76  
**Description**: The count of yes marks in the inventory establishes replay coverage only for entries that were classified there. The explore Decisions-entry move was added at apply after the planned cuts left explore 914 characters over, and the architecture log explicitly says it was outside the inventory. Require the close grade to reconcile actual landed edits with the marked list and record the replay judgment for additions and substitutions. That gives the reader evidence for why each unlisted edit could land without replay.

### The ceiling repair rule reads differently across the artifacts

**File**: orbit/changes/close/specs/orbit-skill-generation/spec.md:17  
**Description**: The breach row and proposal prohibit raising a ceiling past the cap, while the next spec row limits its “never raised to fit a body” wording to ceilings below the cap. Design D4 and `skill_body_convention.md` state the general rule. A reviewer could read fitting a growing body by raising its ceiling from 15,000 to 16,000 as permitted by the breach row. State the prohibition in that row and in the proposal, and identify the 20,000 limit separately as the part enforced by the test.

## SUGGESTION

### The ceiling history understates the number of reductions

**File**: orbit/changes/close/design.md:22  
**Description**: Comparing the ceiling maps at `e2eabb02` and the review checkout shows all fourteen surviving character ceilings decreased. Bulk-archive’s ceiling was removed, and explore’s separate line ceiling was deleted. Correct “Twelve were lowered” and distinguish the two deletions in the G2 evidence.

### The comment-edit scope differs between the proposal and the checklist

**File**: orbit/changes/close/tasks.md:13  
**Description**: The proposal and design name two stale size comments, while task 3.1 also directs the implementer to edit every other comment whose figure differs from the current report. Some comments preserve historical measurements, such as the previous ceiling or the size at a named walk. Limit the sweep to figures presented as current, and preserve explicitly dated measurements.

## Blocks

None.

## Direction

**Disposition**: hold

The permanent budget is ready to specify once the cross-check verifies the actual estimator settings. The close stage also needs a durable grading handoff that accounts for the known baseline discrepancy and edits added after inventory. Those details determine whether the archive can substantiate the program’s grades.

## Notes

The installed `orbit validate close` passed. It reported the scenario tags planned for apply as informational, and the proposal artifacts contained no unresolved `@review:` markers. The checkout lacked `dist/`, so the repository-local validator and size report could not verify the built output here.

The workspace was read-only. I could not save the findings file, commit it, or push it.