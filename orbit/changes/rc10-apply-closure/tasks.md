## 1. Engine: the deferral record and its write-gate check

- [ ] 1.1 Add `deferred_validations` to the archive payload table in `src/core/emit-composition.ts` and validate its shape: an array of `{task, when, where}`, with `task`, `when` and `where` non-empty strings, no other key, and no task named twice.
- [ ] 1.2 In the archive write gate, read the archived `tasks.md` with `parseCheckboxes` (design D4) and refuse, naming the task: an unchecked `(User-validation` task with no deferral; a marked unchecked task with no task id; a deferral naming a checked task or no task.
- [ ] 1.3 Tests in `test/core/emit-composition.test.ts` for every refusal in 1.1–1.2 and for the acceptance path (a forward deferral written; no deferral needed once every marked task is checked), each carrying its `@scenario` tag.

## 2. Archive body and schema reference

- [ ] 2.1 Upstream Step 3, a named edit: exclude every unchecked `(User-validation` task from the incomplete-tasks count, which now prompts only on ordinary unchecked tasks.
- [ ] 2.2 New Step 3.2, user-validation closure: find every unchecked marked task, dispose of each as OBSERVED (check the box with a one-line evidence note) or FORWARD (compose a `deferred_validations` entry), and brief the user with each disposition before the move. The brief reports and does not prompt.
- [ ] 2.3 Step 3.4 widened: read every `reviewed` row of `gates[]`, list each one not `passed` and not `superseded` in ONE prompt with its state and reason (spend MAY be shown, never branched on), record one `continuation` entry per listed gate on Proceed anyway, and point at `orbit-engine-gates`' override contract rather than restate it.
- [ ] 2.4 Completion readout: one line per deferral.
- [ ] 2.5 Archive schema reference: document `deferred_validations` with a `## Field notes` bullet and a `json example` block that the reference round trip submits through the write gate.
- [ ] 2.6 Body surface tests for 2.1–2.4, each carrying its `@scenario` tag; move the template parity pins this changes, recording each move as its own act.

## 3. Scenario declarations

- [ ] 3.1 Declare the 20 carried scenarios: a `@scenario` tag where an existing test asserts what the THEN is about, otherwise a `orbit/scenario-ledger.yaml` entry with its reason. Never a tag without evidence.
- [ ] 3.2 Declare the new scenarios 1.3 and 2.6 did not tag, including the engine-gates scenarios about which gates the archive prompt lists, and confirm `orbit status --change rc10-apply-closure --scenarios` shows zero undeclared.

## 4. Verification

- [ ] 4.1 Build, `node bin/orbit.js update --force`, then the full `npm test` green (the full suite, never a filtered run); `orbit validate rc10-apply-closure --strict` passes.
- [ ] 4.2 Run rc03a's shape (Case 3(2)): a fixture change with `review-proposal` unpassed, `apply` ready and `review-system` blocked, read through `orbit status --change <name> --json`, confirming the rows Step 3.4 lists are exactly `review-proposal` and `review-system`.
- [ ] 4.3 Run Case 3(1): a fixture whose `apply` gate is passed-for-flow, confirming that the body's Step 3 count excludes the marked task and that only Step 3.2 addresses it.
- [ ] 4.4 (User-validation, exit 2) At the next archive carrying a user-validation task (this change's own archive, through this task), the seam briefs the task with its disposition before the move, and the archive emit is accepted by the write gate.
