# External Review: rc15-ended-stage-state (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-28

## CRITICAL

None.

## WARNING

### The unchanged ratified-detail branch will call a concluded exploration live
**File**: orbit/changes/rc15-ended-stage-state/tasks.md:9
**Description**: Task 2.2 requires the `[x]` column to keep its existing two-branch inconsistency detail byte-unchanged. The existing implementation distinguishes only `premised` from every other non-quiescent observation and labels the latter `live citing work observed`; once `concluded` is added, `[x]` + `concluded` will therefore render the self-contradictory detail `live citing work observed (concluded)`, even though this change's central rule is that a concluded exploration is not live activity. Keep the table outcome INCONSISTENT, but add a distinct concluded-detail branch (for example, that a conclusion is not evidence that the exit criteria were met), revise the “byte-unchanged” claim to cover the pre-existing cells rather than the detail implementation, and assert that the concluded diagnostic never calls the citer live.

### The test task does not execute all fifteen composition cells
**File**: orbit/changes/rc15-ended-stage-state/tasks.md:11
**Description**: The proposal and design promise a cell-for-cell test of the five-observation × three-mark table, but task 2.4 enumerates only part of it. In particular, it does not require assertions for `[~]` + `concluded`, `[~]` + live `exploring`, or `[x]` + live `exploring`; it also relies implicitly on existing tests for several unmarked cells instead of pinning the complete table. A wrong branch could therefore pass while violating the normative table. Require one table-driven test covering all 15 `(observed, mark) → rendered` outcomes, with focused assertions retained for dates, attribution, citer names, and inconsistency details.

### The unprompted route both permits any stage and promises never to write an unsupported mark
**File**: orbit/changes/rc15-ended-stage-state/specs/orbit-architect/spec.md:16
**Description**: The requirement says an unprompted user declaration may end ANY stage and that the body writes the mark, but its closing sentence says this flow writes only marks the engine's observation supports; the engine table rejects the mark on `in-change` and live `exploring`. A user declaring a live stage ended thus has two incompatible required outcomes: write a mark that immediately produces an INCONSISTENT state and CRITICAL audit finding, or decline the write. Close the domain explicitly—preferably allow the unprompted workflow write only for `premised`, `quiescent`, and `concluded`, and define the live-state response—or explicitly specify and test a deliberate write-despite-inconsistency path.

### The architect scaffold will keep publishing the obsolete two-production grammar
**File**: src/core/templates/workflows/architect.ts:81
**Description**: The generated architect body has a closed scaffold-format sentence saying the exact `Complete:` grammar is only `[ ]` or `[x]`, while task 3.1 limits the planned body edit to section 5 and the emit step. Applying the tasks as written therefore leaves the same workflow teaching two productions immediately before it later teaches a third one. Add the scaffold grammar sentence to task 3.1 (or a separate task), include `[~] <YYYY-MM-DD> (<who>)`, and pin that mirror in the fidelity test.

## SUGGESTION

### The design names the wrong JSON surface
**File**: orbit/changes/rc15-ended-stage-state/design.md:84
**Description**: D-rc15-6 says `show --json` carries the new state fields for free, but `orbit architecture show --json` returns a stage index or a verbatim section and never computes `StageState`; `orbit architecture status --json` is the surface that carries `ended`, `endedDate`, and `endedWho`, as the proposal, delta, and task 2.4 correctly say. Replace `show --json` with `status --json` so the design does not assert a nonexistent contract.

### The claimed closed production leaves attribution and calendar near-misses undecided
**File**: orbit/changes/rc15-ended-stage-state/tasks.md:3
**Description**: The prescribed `\d{4}-\d{2}-\d{2}` / `(.+?)` regex accepts values such as `2026-99-99` and treats `Complete: [~] 2026-09-28 (Sal))` as a valid mark whose attribution is `Sal)`. The artifacts call the production exact and the domain closed, but the near-miss set does not say whether calendar validity or delimiter characters inside `<who>` are part of validity; the existing `[x]` parser is equally permissive. State the intended lexical contract explicitly and test it—either declare dates shape-only and attribution opaque (preserving `[x]` parity), or harden both dated productions consistently rather than leaving the new line's classification accidental.

## Notes

The 5×3 outcome table is internally coherent, and strict validation plus the recorded baseline fingerprints pass. The main risk is one layer outward from the cells themselves: an old diagnostic branch becomes false for the new row, the test plan does not actually pin the whole matrix, and the generated architect body retains a stale closed grammar mirror.
