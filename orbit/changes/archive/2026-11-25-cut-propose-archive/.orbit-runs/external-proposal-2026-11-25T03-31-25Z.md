# External Review: cut-propose-archive (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-24

## CRITICAL

None.

## WARNING

### An unreadable tasks file can bypass the pre-move check
**File**: orbit/changes/cut-propose-archive/specs/orbit-archive-modifications/spec.md:507  
**Description**: Step 3.2 must report an unreadable `tasks.md` and wait for repair or abort while the change is still active. The same requirement moves that procedure into a reference reached only when a scan finds an unchecked marked task. A failed scan cannot establish whether the file has such a task. Define separate outcomes for a match, a successful scan with no matches, and a read error. Route the read error to the existing repair-or-abort procedure before sync and move, and cover it in the scenario.

### The PR branch mismatch check has no defined place before the consent prompt
**File**: orbit/changes/cut-propose-archive/design.md:106  
**Description**: The current entry observation puts a HEAD mismatch in the consent preview when one fires. D2 puts the prompt in the Step 0 consent reference and the comparison in the Step 0.7 PR reference, whose explicit read cue is before Step 1. An agent following that order can ask for consent before it knows about the mismatch. Specify that the body loads and runs the read-only attachment check before an AI-mediated consent prompt is composed and before any consent-era stamp on every arrival. Preserve the one-line notice on arrivals without a prompt and test both paths with HEAD on a different branch.

### Step 4.9 assumes a prior reference read on a path that can skip it
**File**: orbit/changes/cut-propose-archive/design.md:110  
**Description**: D2 moves Step 4.9’s carry-forward detail to the PR reference on the assumption that Step 0.7 already read it. Step 0.7 skips the read when it finds no attachment, but Step 4.9 can still exit non-zero. The current body reports that error verbatim and continues unattached. Keep that error branch in Step 4.9’s basic content or make the step explicitly read the reference on a non-zero exit and follow it from the result already in hand. Also retain the read cue on a successful non-`off` result so the observation used by the emit and tail is available at that point.

### The consent-reference trigger uses two definitions of user invocation
**File**: orbit/changes/cut-propose-archive/design.md:92  
**Description**: The retained User-invoked bullet covers both slash commands and explicit same-turn prose such as “archive it” or “implement the change.” The proposed cue sends “any arrival that is not user-typed” to the reference that handles AI-mediated and granted arrivals. Read literally, the cue can also send an explicit prose invocation down that path. Make the cue depend on the Step 0 provenance classification and test that explicit prose stays on the zero-added-prompt path.

### Step 0d’s byte-equal move leaves its size-brief pointer in the wrong file
**File**: orbit/changes/cut-propose-archive/tasks.md:26  
**Description**: The current Step 0d refers to “the size brief below.” Moving it byte-equal to `references/consume-mode.md` leaves that pointer in a file with no size brief below it. The task names only Step 0c’s Touchpoints pointer for rewording. Name the Step 0d edit as a second ledger pair before the move and point it to the body’s Size brief step so the reference and the retained cue agree on when staged metadata is merged and moved.

## SUGGESTION

### Include the root convention in the retirement sweep
**File**: skill_body_convention.md:76  
**Description**: The Exceptions section still lists bulk-archive as a live workflow awaiting conversion. Add this file to the retirement task and remove that exception.

### Include sync-specs in the proposal’s ledger inventory
**File**: orbit/changes/cut-propose-archive/proposal.md:37  
**Description**: The proposal lists four edited bodies in its ledger summary. Design D4 and task 1.1 list five, including sync-specs. Add sync-specs to the summary so it agrees with the required pre-edit hashes.

## Blocks

None.

## Direction

**Disposition**: hold

The reference moves need explicit read cues for the archive paths where timing matters. The current instructions allow the session to miss a repair decision before the move or ask for consent before it has the branch-mismatch information that belongs in the preview. Resolve those paths in the proposal so implementation and tests have a single expected sequence.

## Notes

The installed Orbit 2.0.2 CLI accepted the proposal in strict mode. The checkout’s CLI could not run because `dist/cli/index.js` was absent. I compared the delta requirements against the archived baselines and found no unresolved inline review markers in the proposal artifacts.

---

The workspace is read-only, so I could not save, commit, or push the findings. Save the Markdown above as `orbit/changes/cut-propose-archive/.orbit-runs/external-proposal-2026-11-25T03-21-57Z.md` for manual commit and push.