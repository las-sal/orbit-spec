# External Review: rc03c-verification-record (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-04

## CRITICAL

### A wrong stale call cannot be linked while an earlier resolution is landed
**File**: orbit/changes/rc03c-verification-record/specs/orbit-emit-composition/spec.md:40
**Description**: `walk_entry` identifies only a normalized (title, file) key. The owed-set rule keeps an earlier `resolved` entry owed when a later walk calls that same key `stale`, but the gate rejects every finding linked to that key if its verdict is `landed`. This makes the required truthful record impossible when the earlier edit holds and the later stale call is wrong. Give the link enough walk identity to distinguish the stale entry from the resolved entry, then apply the landed-link prohibition only to findings about the resolved edit.
**Reproduction**: Construct an accepted independent pass and walk W1 with (`T`, `F`) `resolved` for a defect at site A. A later in-context pass reports a distinct defect at site B with the same title `T` and file `F`; walk W2 calls that finding `stale` incorrectly. Both walks are after the same latest independent pass. The W1 edit at A is present, complete and clean; B remains defective. For the subsequent in-context pass, the owed-set rule requires one verdict for (`T`, `F`) against W1, so the truthful verdict is `landed`; the finding about W2 must link to its stale entry using `walk_entry: {title: "T", file: "F"}`. Expected: the emit records W1 as landed and the finding against W2's stale call. Observed under the specified gate: the link names an owed key with verdict `landed` and is refused; changing the verdict or omitting the link misstates the review.

## WARNING

### An absent verification refusal does not supply the keys the body needs
**File**: orbit/changes/rc03c-verification-record/specs/orbit-emit-composition/spec.md:40
**Description**: For a missing `verification` field, this rule requires only the field name and owed count in the refusal. The review body at `specs/orbit-review/spec.md:5` says that, when its metadata probe disagrees with the engine, it reads the owed keys *named by that refusal* and emits again. A rejected external return can create exactly this disagreement: the probe treats it as the latest independent pass and sends a REVIEW payload with no record, while the engine computes VERIFICATION. Name every owed key and its walk token in the absent-field refusal too, and test that reconciliation path.

### The diff baseline misses edits committed with the independent pass
**File**: orbit/changes/rc03c-verification-record/specs/orbit-review/spec.md:5
**Description**: The residual check diffs against the commit that first added the latest accepted independent pass's file. Any walk edit committed in that same commit is already in `<C>` and cannot appear in `git diff <C>`, even if no sweep scope lists it. This repository has that layout now: `76c5978` first added the fresh proposal pass file and also contains its walk and repaired artifacts; the prescribed diff and untracked-file listing are empty at that commit. Use a pre-walk tree or a separately recorded walk baseline, and cover a pass file and an unlisted edit committed together in the test. If no such baseline exists, state that co-committed edits are outside the residual check's reach.

### A readable walk can owe a key no valid verdict can name
**File**: orbit/changes/rc03c-verification-record/specs/orbit-emit-composition/spec.md:36
**Description**: The owed set uses the trail reader's `readable` predicate. That reader accepts any non-empty resolutions array whose entries have recognized severity and disposition, even when an entry lacks `title` or `file` (`src/core/artifact-graph/trail.ts:308-323`). A `resolved` entry with an empty key is therefore owed, while this delta requires non-empty `verification[].title` and `file`; every payload is refused. Define how verification treats entries with invalid keys, such as marking that walk unreadable for this record, and add a fixture for an otherwise readable entry missing a key.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The record needs a way to distinguish a finding about a later stale decision from a verdict on an earlier edit with the same key. The refusal and residual-check contracts also need to match the workflows that consume them before an implementer can produce a reliable verification pass.

## Notes

`orbit validate rc03c-verification-record --strict`, `orbit fingerprint rc03c-verification-record --check`, and `orbit validate --sources` passed. The change artifacts contain no unresolved `@review:` markers. The current `76c5978` commit provides a concrete example of the residual check's baseline limitation.
