## 1. Engine: the deferral record and its write-gate check

- [x] 1.1 Add `deferred_validations` to the archive payload table in `src/core/emit-composition.ts` and validate its shape: an array of `{task, why, when, where}`, with all four non-empty strings, no other key, and no task named twice; an empty array is written as absent.
- [x] 1.2 In the archive write gate, read the archived `tasks.md` with `parseCheckboxes` (design D4) and refuse, naming the task or line: an unchecked `(User-validation` task with no deferral; a marked unchecked task with no task id; a marked unchecked line outside every `## ` group (a fence-aware line scan compared with the reader's set, design D4); a deferral naming a checked task, an unmarked task or no task. A missing `tasks.md` is an empty marked set.
- [x] 1.3 Tests in `test/core/emit-composition.test.ts` for every refusal in 1.1–1.2 and for the acceptance path (a deferral written; no deferral needed once every marked task is checked; an empty array written as absent), each carrying its `@scenario` tag.

## 2. Archive body and schema reference

- [x] 2.1 Upstream Step 3, a named edit: exclude every unchecked `(User-validation` task from the incomplete-tasks count, which now prompts only on ordinary unchecked tasks.
- [x] 2.2 New Step 3.2, user-validation closure: find every unchecked marked task, dispose of each as OBSERVED (check the box with a one-line evidence note) or DEFERRED (compose a `deferred_validations` entry with its `why`), check each case of the `DEFERRAL REFUSALS` production against the composed deferrals — carried in the body as a CHECKED MIRROR of the requirement's fence — report any id-less or ungrouped marked task for the user to fix or abort, and brief the user with each disposition and `why` before the move. The brief reports and does not prompt. State the post-move recovery: re-run the emit, never the sync or the move.
- [x] 2.3 Step 3.4 widened: read every `reviewed` row of `gates[]`, list each one whose `state` is not `passed` and whose `superseded` field is not true in ONE prompt with its state and reason (spend MAY be shown, never branched on), record one `continuation` entry per listed gate on Proceed anyway, and point at `orbit-engine-gates`' override contract rather than restate it.
- [x] 2.4 Completion readout: one line per deferral.
- [x] 2.5 Archive schema reference: document `deferred_validations` with a `## Field notes` bullet and a `json example` block that the reference round trip submits through the write gate; repair the review-system-only sentences at `archive-change.ts` lines 24, 61, 107 and 143 by pointing at the override contract's gate set (`gate_state` gains `blocked`), and replace the example's `warnings` line at 126, which still treats a validation task as an incomplete task, with the deferral it now is.
- [x] 2.6 Bulk archive (`bulk-archive-change.ts`): run Step 3.2 per change before that change's sync and move, exclude the marked tasks Step 3.2 owns from bulk archive's own task count (so a validation-only change is never classed incomplete or offered for skipping), and carry each change's dispositions in the batch summary (design D8).
- [x] 2.7 Reference round trip: a second seeding rule, stated beside the first, seeding a `(User-validation` task for each deferral an example names; examples with no deferral keep passing against a seed with none.
- [x] 2.8 Body surface tests for 2.1–2.4 and 2.6, each carrying its `@scenario` tag, and a parity test holding Step 3.2's `DEFERRAL REFUSALS` mirror byte-equal to the requirement's fence; move the template parity pins this changes, recording each move as its own act.

## 3. Scenario declarations

- [x] 3.1 Declare the 20 carried scenarios: a `@scenario` tag where an existing test asserts what the THEN is about, otherwise a `orbit/scenario-ledger.yaml` entry with its reason. Never a tag without evidence.
- [x] 3.2 Declare the new scenarios 1.3 and 2.8 did not tag, including the engine-gates scenarios about which gates the archive prompt lists, and confirm `orbit status --change rc10-apply-closure --scenarios` shows zero undeclared.

## 4. Verification

- [x] 4.1 Build, `node bin/orbit.js update --force`, then the full `npm test` green (the full suite, never a filtered run); `orbit validate rc10-apply-closure --strict` passes.
- [x] 4.2 Run rc03a's shape (Case 3(2)): a fixture change with `review-proposal` unpassed, `apply` ready and `review-system` blocked, read through `orbit status --change <name> --json`, confirming the rows Step 3.4 lists are exactly `review-proposal` and `review-system`.
- [x] 4.3 Run Case 3(1): a fixture whose `apply` gate is passed-for-flow, confirming that the body's Step 3 count excludes the marked task and that only Step 3.2 addresses it.
- [ ] 4.4 (User-validation, exit 2) At the next archive carrying a user-validation task (this change's own archive, through this task), the seam briefs the task with its disposition before the move, and the archive emit is accepted by the write gate.
