# External Review: rc10-apply-closure (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### Valid Markdown fences can hide a validation task from the write gate
**File**: src/core/parsers/apply-state.ts:62
**Description**: The new archive check relies on a parser that toggles fence state on any three-or-more backticks or tildes, without tracking the opening fence’s character or length. A valid four-backtick example containing a three-backtick line leaves the parser inside a fence after the actual closing fence. A real unchecked validation task following that example disappears from both the grouped and ungrouped results, so the archive check requires no deferral for it. A direct Node import confirmed `tasksRemaining: 0` and empty unchecked collections for `## 1. Validation\n````markdown\n```\n````\n- [ ] 1.1 (User-validation) Real validation\n`. Track fence character and length, accept only a matching closing fence, and verify that this task requires a deferral.

### Task-file read failures silently disable validation closure
**File**: src/core/emit-composition.ts:958
**Description**: The catch treats every failure reading archived `tasks.md` as an empty marked set. The requirement permits this only for a missing file. Permission errors, I/O failures, or a directory named `tasks.md` therefore allow an archive emit without checking the validation tasks or recording why they were deferred. Handle only `ENOENT` as the documented missing-file case; report other errors and refuse the emit.

### Duplicate task IDs bypass the checked-task refusal
**File**: src/core/emit-composition.ts:987
**Description**: The check accepts a deferral as soon as its ID appears in `markedUnchecked`, before checking whether that ID also names a checked task or an unmarked task. For example, `- [x] 1.1 (User-validation) Observed` followed by `- [ ] 1.1 (User-validation) Still pending` produces both checked and unchecked ID `1.1`; a single deferral for `1.1` is accepted. Multiple unchecked validation tasks sharing an ID also collapse into one set entry and require only one record. This makes the task-to-disposition mapping ambiguous and contradicts the promised checked-task refusal. Reject duplicate IDs relevant to validation closure, naming the conflicting lines, before matching deferrals.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The archive record should reliably account for the validation tasks it claims to close. Its current reader can omit a real task, silently substitute an empty task set after a read failure, or accept an ambiguous task identity. Resolve those gaps before relying on the new closure guarantee.

## Notes

The gate-prompt expansion and the single-change and bulk validation instructions are consistent with the intended reporting mechanism. The main concern is the boundary between task-file contents and the engine’s keyed task set.

The scenario-map structural check was not run: `node bin/orbit.js status --change rc10-apply-closure --scenarios --json` failed because `dist/cli/index.js` is absent. Strict validation was likewise unavailable for that reason. The read-only environment prevents building the CLI; the full test suite was not run. Scenario coverage was not inferred from test-file searches.

Task 4.4 remains unchecked and explicitly describes the intended archive-time user validation. No unresolved review markers were found in the change artifacts. The requested project, root convention, perspective, and critical-path files were absent; no named-perspective or named-flow review could be performed.

---

I could **not save, commit, or push** the findings because this environment is read-only. Save this report as `orbit/changes/rc10-apply-closure/.orbit-runs/external-system-2026-10-11T22:48:27Z.md` and commit/push it manually.