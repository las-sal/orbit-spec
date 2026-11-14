# External Review: program-brief (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-13

## CRITICAL

None.

## WARNING

### Retained scenarios contradict the new conditional behavior
**File**: orbit/changes/program-brief/specs/orbit-archive-modifications/spec.md:111
**Description**: The retained “A failed save is recorded, not shown, and the archive completes” scenario has no setting precondition. Under `signoff: change`, its inputs also satisfy the new scenario at line 128, but their expected results are opposite: complete silently versus stop and report the failure. Restrict the retained scenario to settings other than `change`. The same problem affects “A change with no records renders nothing to read” in `orbit/changes/program-brief/specs/orbit-decision-records/spec.md:83`: an empty `decisions/` folder can now coexist with an unread selected account. Qualify that scenario by an empty selection. Also update the archived baseline scenario “No records, no reading” at `orbit/specs/orbit-review/spec.md:712`, which still promises no reader whenever `decisions/` is absent, including the newly supported account-only case. Carry that correction as a delta and reconcile the affected-capability declaration.

### The task can label an already-read account as unchecked
**File**: orbit/changes/program-brief/tasks.md:16
**Description**: Task 3.2 tells the implementation to name the account apart whenever the selection did not take it. Under `signoff: change`, an account already listed in `decision_records_read` is deliberately absent from the selection. Following this task therefore labels an account the reader checked as “checked by no reader.” The program-brief spec’s parenthetical instead limits this separate listing to settings other than `change`. Make the task and design use that setting condition explicitly, and add a scenario where a read account is absent from both the selection list and the separate unchecked-account statement.

### Sign-off write failure is placed after the first matching archive branch
**File**: orbit/changes/program-brief/specs/orbit-archive-modifications/spec.md:16
**Description**: The table explicitly uses first-match semantics. Its `why: "unsigned"` row performs the emit and says that on `signed` the archive goes on; the following row says an emit refusal stops it. For an unsigned hold where the user signs but the emit fails, the unsigned row has already matched, making the refusal row unreachable under the stated evaluation rule. An implementation can continue without a persisted sign-off. Separate hold selection from the emit-result handling, or state inside the unsigned row that continuation requires a successful emit and every failure stops before sync. Add a scenario where the user signs and the emit fails.

### The hold has no contract for unreadable or malformed history
**File**: orbit/changes/program-brief/specs/orbit-program-brief/spec.md:76
**Description**: The new hold reads saved copies and sign-off records independently of the existing brief renderer, but its contract defines only normal states and usage errors. It does not say what happens when a history folder cannot be listed, the latest sign-off is invalid JSON or has an invalid shape, or the latest saved copy cannot be read for hashing. Implementations could reject the command, treat the history as absent, or skip a malformed latest record and reuse an earlier signature. Those choices produce different archive decisions; skipping a latest declined record could revive an older signature. Specify filename selection, record validation, and failure behavior explicitly. Require an unreadable or invalid latest record to produce a named non-zero error with empty stdout, without falling back to an earlier signature, and cover these cases with scenarios.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The proposed seam fits the intended per-change sign-off, but its implementation contract still gives conflicting answers for account-only readings and failed saves. The archive also needs an unambiguous requirement that signing succeeds only after the record is persisted, with defined handling for damaged history. Resolve those points before implementation.

## Notes

Compared the five capability deltas with their archived baselines and checked the current brief, account, review, and archive integration points. The `@review:` occurrences in the change are quoted workflow vocabulary and scenarios, rather than unresolved inline review annotations.

Strict validation could not execute: `node bin/orbit.js validate program-brief --strict` failed to load the missing `dist/cli/index.js`. This is an environment limitation, not evidence that artifact validation failed.

The workspace is read-only. I could not write `orbit/changes/program-brief/.orbit-runs/external-proposal-2026-11-13T22-41-43Z.md` or commit/push the findings. The complete findings are provided here for manual saving and committing.