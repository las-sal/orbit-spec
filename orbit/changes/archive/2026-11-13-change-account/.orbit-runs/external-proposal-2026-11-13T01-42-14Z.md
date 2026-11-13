# External Review: change-account (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-12

## CRITICAL

None.

## WARNING

### Apply has no recovery rule when the last checkbox predates the account
**File**: orbit/changes/change-account/specs/orbit-decision-records/spec.md:30
**Description**: Initial account creation belongs exclusively to the session that checks the last task. If that session ends after checking the checkbox but before emitting the account, a resumed apply sees all tasks complete, checks no last task, and has no instruction to create the missing account. The existing apply body's `all_done` branch already directs that arrival toward the next step. The same gap affects changes completed before this feature is installed. Define recovery explicitly: an apply session encountering completed tasks and no account writes the initial account before its summary or completion readout. Add a scenario covering interruption between the final checkbox and account publication.

### Lifecycle rows disagree when reopened work remains incomplete
**File**: orbit/changes/change-account/specs/orbit-decision-records/spec.md:29
**Description**: The table says an apply session leaving any task unchecked writes no account, while the existing-account row requires a replacement whenever that session changes what the account says. Both apply when a walk reopens two tasks and a later apply changes behavior while completing only one. Implementations can either leave an outdated account or publish a replacement before completion. Qualify the no-account row with “when no account exists,” as its scenario already does, and state whether replacements occur during incomplete apply sessions or only once all tasks are complete. Add a scenario for the chosen behavior.

### Archived walks are instructed to perform a write the gate refuses
**File**: orbit/changes/change-account/specs/orbit-decision-records/spec.md:33
**Description**: The replacement instruction covers any walk on a change with an account. Address-reviews explicitly supports archived changes, including findings supplied through `--from-file`, but the account gate refuses every archived-only target. An archived walk resolving a finding that changes a seam or deviation therefore owes a replacement it cannot emit. Restrict account replacement to active-change walks and define what an archived walk records instead, or deliberately support archived replacements. Carry the same scope restriction into the workflow instruction and add a scenario.

### The new account directory lacks the existing child-directory identity protection
**File**: orbit/changes/change-account/specs/orbit-emit-composition/spec.md:14
**Description**: The account introduces a new writable child directory but specifies only its lexical path and exclusive publication. The baseline's physical identity checks explicitly cover `.orbit-runs` and its `decisions/` child; they do not cover `account/`. With a canonical `.orbit-runs` and `account` symlinked elsewhere, an implementation following these instructions can publish outside the intended account directory while passing the existing trail check. Require `account/` to physically be the trail's canonical account child, checked after creation and immediately before publication, matching the decision-record protection. Add refusal scenarios for an outside redirect and an in-container alias.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The separate account folder is a sound way to preserve existing reader behavior, but the writing lifecycle needs explicit recovery and scope rules before implementation. Resolve which sessions must publish replacements, how completed changes acquire a missing account, and how archived walks behave. The new writable directory should also inherit the existing physical identity protection.

## Notes

`orbit validate change-account --strict` passed using the installed CLI. It reported informational notices for undeclared delta scenarios; the tasks already include adding scenario declarations. No inline review markers were found in the proposal, design, tasks, exploration, or delta specs.

The main risk is lifecycle coverage: normal first completion is specified clearly, while interrupted completion, partially completed reopened work, and archived walks expose conflicting or missing instructions.