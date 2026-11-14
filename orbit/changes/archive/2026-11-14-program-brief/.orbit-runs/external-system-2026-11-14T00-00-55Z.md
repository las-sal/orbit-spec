# External Review: program-brief (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-13

## CRITICAL

None.

## WARNING

### The hold accepts stored sign-offs that fail the required spine checks
**File**: src/core/signoff.ts:138
**Description**: `checkStoredSignoff` validates `command`, `sha256` and the narrative fields, but omits the required `timestamp`, `model` and `change` checks and the prohibition on `kind`, `final_assessment` and `next_recommended`. A stored object containing only `command`, `brief`, `answer: "signed"` and the matching hash can therefore lift the hold. This contradicts the delta requirement that a stored sign-off whose shape the write gate would refuse makes the hold fail. Share the stored-record spine validation with the writer and reject malformed latest records before comparing hashes.

### Account-folder read failures silently remove the account from the reading
**File**: src/core/decision-records.ts:724
**Description**: The new account-selection branch calls `readAccountFolder`, which catches every directory-listing error and returns an empty folder. Under `signoff: change`, an existing account folder that becomes unlistable therefore produces no selected account: an account-only change can report nothing to read, and the review can owe no reading. That hides a failed read as an empty selection, undermining the intended account check before sign-off. Distinguish an absent folder from other listing failures and propagate the latter through the brief and selection callers with the folder named.

## SUGGESTION

### The account module still says the selection never takes accounts
**File**: src/core/account.ts:13
**Description**: The module documentation says no reader of `selectUnreadRecords` takes the account. This change makes that statement false under `signoff: change`. Update the comment to describe the conditional reader rule.

## Blocks

None.

## Direction

**Disposition**: hold

The normal archive sequence follows the design, but its handling of damaged history needs tightening. A malformed signature should not release the hold, and an account that cannot be discovered should not disappear from the reading obligation. Address these gaps before relying on this seam for user sign-off.

## Notes

Reviewed the change artifacts, the requested commit range starting at `55245ff3`, affected baseline requirements, selection callers, CLI registration, archive templates and documentation. All task checkboxes are marked complete; no unresolved `@review:` markers were found outside run history.

Scenario coverage was not checked: `node bin/orbit.js status --change program-brief --scenarios --json` could not start because `dist/cli/index.js` is absent. Strict validation could not start for the same reason; this is not an observed validation failure. Build and tests were not run in the read-only workspace.

No perspectives defined; skip Pass 4. No critical paths defined; skip Pass 5.

The workspace is read-only. I could not write `orbit/changes/program-brief/.orbit-runs/external-system-2026-11-13T23-55-18Z.md`, commit, or push. The findings above are the complete chat fallback for manual saving and committing.