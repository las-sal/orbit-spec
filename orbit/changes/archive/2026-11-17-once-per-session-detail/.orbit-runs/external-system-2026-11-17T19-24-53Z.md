# External Review: once-per-session-detail (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-17

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

### Clarify which emit triggers the reference read

**File**: src/core/disciplines.ts:487  
**Description**: The shared cue says to read the run-summary reference “before the session’s first emit,” but sessions can also emit decision records and accounts. A literal reading could call for the reference before one of those unrelated writes, even though it contains instructions for composing a run-summary payload. Say “before the session’s first run-summary emit” to identify the intended moment.

## Blocks

None.

## Direction

**Disposition**: forward

The moved instructions and their generated references preserve the reviewed workflow structure. The cue wording can be clarified without changing the design.

## Notes

The scenario map reported all changed scenarios declared, and `orbit validate once-per-session-detail` passed. The requested perspective and critical-path lens files were absent. The change’s account and final apply record are present.

The environment is read-only, so I could not write the findings file or commit and push it. The report above is provided for manual saving and commit.