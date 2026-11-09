# External Review: decision-reading (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-09

## CRITICAL

None.

## WARNING

### The brief renders superseded stop wording
**File**: src/core/decision-records.ts:871
**Description**: Named stops are read directly through `folder.records.get(stopName)`, without following their replacement chains. If stop S is replaced by T, an existing ledger entry or resolution naming S still receives S’s old `about` and `question` in its brief. This contradicts the replacement requirement that readers take the latest record as current, including its explicit scenario where a carried link to S is followed forward to T. The reader can consequently judge a record against wording already repaired. Resolve the stop through `latestInChain` before rendering its content, and identify the current stop in the brief.

### One replacement for several findings conflicts with the default walk
**File**: src/core/templates/workflows/address-reviews.ts:1170
**Description**: The new instruction requires one replacement containing every resolved fix to a record, but the existing default walk at line 1082 completes each finding’s resolution before beginning the next finding’s pushback. With two findings on ledger A, resolving the first writes replacement B before the second has been evaluated or ratified. Resolving the second then requires another replacement, editing immutable B, or anticipating the second finding’s outcome. None satisfies both contracts. Define an explicit procedure for collecting resolutions on the same record and delaying its replacement, including interruption and mixed resolved/deferred outcomes. Carry any necessary change to the archived `orbit-address-reviews` requirements rather than leaving the worker to invent an exception.

### Separate brief invocations can mark unseen records as read
**File**: src/core/templates/workflows/review.ts:380
**Description**: The worker obtains the reader’s markdown and its `selected` list from two independent command invocations. If record B is written after the markdown command renders A but before the JSON command runs, the reader sees only A while the JSON selection contains A and B. Step 4 then instructs the worker to submit both filenames as read. The write gate accepts both because both belong to its current selection, permanently removing unseen B from subsequent readings. This defeats the explicit requirement that records written during the pass stay selected until read. Produce the reader’s markdown and coverage filenames from one captured snapshot, and use that same snapshot for dispatch and the emit.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The reading’s evidence must reliably describe what the reader actually saw, and repaired stop wording must reach that reader. The repair workflow also needs an executable procedure for multiple findings on one immutable record. Resolve those inconsistencies before moving forward.

## Notes

Reviewed the change range beginning at `d1204c3`, its proposal, design, tasks, deltas, affected implementation and workflow callers, and relevant archived contracts. Tasks are checked complete.

The installed `orbit status --change decision-reading --scenarios --json` returned 73 delta scenarios, with 64 behaviour declarations, four text declarations and six untestable declarations; none were uncovered, orphaned or malformed. These are declarations, not independently executed test results. `orbit validate decision-reading` succeeded, and the diff whitespace check passed.

The checkout lacks the built CLI and local test dependencies, so implementation tests were not rerun. The installed CLI supplied validation and scenario-map results. Project guidance, root convention files, named perspectives and critical-path lenses were absent except for `CLAUDE.md`; no named perspective or critical-path simulations were available.

The environment is read-only. No findings file was written, committed or pushed.