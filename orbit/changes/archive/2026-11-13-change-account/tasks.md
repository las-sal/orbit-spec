## 1. The account's write gate

- [x] 1.1 Add the account's payload fields and checks (plain fields, defines, detail, one account, replaces, active change only with its own refusal wording) beside the decision records' in `src/core/decision-records.ts` or a sibling module
- [x] 1.2 Add the `account` command to `src/core/emit-composition.ts`'s command table: `kind: null`, change scope only, path `.orbit-runs/account/account-<TS>.json`, the canonical-child check on `account/` (after creation and before publish), a token unique within `account/`, decision-record spine checks, no `next_recommended` or `final_assessment`, no-overwrite publish
- [x] 1.3 Tests for every scenario of `orbit-emit-composition`'s `The write gate checks the account`, the aliased-folder cases included, each refusal shown able to fail
  Recorded (2026-11-12): `test/core/account.test.ts`. Shown able to fail by twelve mutations, one per check, each run against the file and each failing it, then restored: plain fields, defines, detail, the `replaces` shape, one account, replaces-names-no-account, already-replaced, active-change scope, the identity check after creation, the identity check before publish, `final_assessment` engine-owned, and the no-overwrite publish (`linkSync` → `renameSync`).
- [x] 1.4 Move the closed-set pins this extends: `emit-composition.test.ts`'s every-command spine case list and `rc03b-untouched-modules.test.ts`'s `emit-composition.ts` hash, each recorded here
  Recorded (2026-11-12): `emit-composition.test.ts`'s rc17c case — `account` is filtered out of the run-summary command set beside the three decision records (its spine is held in `account.test.ts`). `rc03b-untouched-modules.test.ts` — the `src/core/emit-composition.ts` hash moved, with a MOVED note naming this change's edits. No other pin in either file moved.

## 2. No reader takes it

- [x] 2.1 Tests for `No reader takes the account yet`: `orbit decisions brief` renders nothing to read with only an account, the archive's unread count leaves it out, and `orbit status` and the gates read a change with an `account/` folder as without it

## 3. The bodies

- [x] 3.1 Add `ACCOUNT_STEP` to `src/core/disciplines.ts`, composed from the account's field list: an apply session that ends with apply complete (the apply gate passing, declared `(User-validation` handoffs included) writes the account when none exists, or replaces the latest when the work done since it was written changed what it says, before its run summary or its `all_done` completion readout; a session that ends with apply not complete writes none; the three fields in plain language, "none" in words; the `orbit emit account` invocation with `replaces`
- [x] 3.2 Add `ACCOUNT_WALK_STEP`, composed the same way: a walk of an active change that has an account replaces the latest when a resolved finding changes what was built, a seam or a deviation, and writes none when it resolved any finding by reopening tasks, not even for its other fixes; a walk of an archived change writes none; the fields and the invocation with `replaces`
- [x] 3.3 Carry `ACCOUNT_STEP` in the apply body (before the run-summary emit and in the `all_done` branch) and `ACCOUNT_WALK_STEP` in the address-reviews walk
- [x] 3.4 A test holds both bodies carrying their step with every field and the invocation, and one that submits each step's example payload through `orbit emit account`
- [x] 3.5 Re-record the skill hash pins that move (apply, and address-reviews if pinned), each recorded here
  Recorded (2026-11-12): `test/core/templates/skill-templates-parity.test.ts` — `getApplyChangeSkillTemplate` and the generated `orbit-apply-change` hash moved, each with a note naming the Account step. address-reviews is pinned in neither table, so no pin of it moved; no other skill or command-template pin moved. The carriage test is `test/core/templates/account-step.test.ts`, shown able to fail by removing the walk step from the address-reviews body and by dropping a field's form.

## 4. Docs

- [x] 4.1 Name `orbit emit account` in `docs/cli.md`'s `orbit emit` section (the command list and the paragraph on records that are not run summaries) and in the `emit` command's description in `src/cli/program.ts`
  Recorded (2026-11-12): also the `emit` entry's description in `src/core/completions/command-registry.ts`, a sibling copy of the same sentence the task did not name.

## 5. Close

- [x] 5.1 `npm run build && node bin/orbit.js update --force`, then full `npm test` green
- [x] 5.2 Scenario tags for every delta scenario, and `node bin/orbit.js validate change-account --strict`
  Recorded (2026-11-13): 16 `@scenario behaviour` tags (`test/core/account.test.ts`), 8 `untestable` entries in `orbit/scenario-ledger.yaml` (the AI-conduct and prose scenarios), and `The session that completes apply writes the account` declared `observed` from this apply session's own account, written after this box was checked. `validate --strict` passes.
