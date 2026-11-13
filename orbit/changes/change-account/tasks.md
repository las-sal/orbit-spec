## 1. The account's write gate

- [ ] 1.1 Add the account's payload fields and checks (plain fields, defines, detail, one account, replaces, active change only with its own refusal wording) beside the decision records' in `src/core/decision-records.ts` or a sibling module
- [ ] 1.2 Add the `account` command to `src/core/emit-composition.ts`'s command table: `kind: null`, change scope only, path `.orbit-runs/account/account-<TS>.json`, the canonical-child check on `account/` (after creation and before publish), a token unique within `account/`, decision-record spine checks, no `next_recommended` or `final_assessment`, no-overwrite publish
- [ ] 1.3 Tests for every scenario of `orbit-emit-composition`'s `The write gate checks the account`, the aliased-folder cases included, each refusal shown able to fail
- [ ] 1.4 Move the closed-set pins this extends: `emit-composition.test.ts`'s every-command spine case list and `rc03b-untouched-modules.test.ts`'s `emit-composition.ts` hash, each recorded here

## 2. No reader takes it

- [ ] 2.1 Tests for `No reader takes the account yet`: `orbit decisions brief` renders nothing to read with only an account, the archive's unread count leaves it out, and `orbit status` and the gates read a change with an `account/` folder as without it

## 3. The bodies

- [ ] 3.1 Add `ACCOUNT_STEP` to `src/core/disciplines.ts`, composed from the account's field list: an apply session that ends with apply complete (the apply gate passing, declared `(User-validation` handoffs included) writes the account when none exists, or replaces the latest when the work done since it was written changed what it says, before its run summary or its `all_done` completion readout; a session that ends with apply not complete writes none; the three fields in plain language, "none" in words; the `orbit emit account` invocation with `replaces`
- [ ] 3.2 Add `ACCOUNT_WALK_STEP`, composed the same way: a walk of an active change that has an account replaces the latest when a resolved finding changes what was built, a seam or a deviation, and writes none when it resolved the finding by reopening tasks; a walk of an archived change writes none; the fields and the invocation with `replaces`
- [ ] 3.3 Carry `ACCOUNT_STEP` in the apply body (before the run-summary emit and in the `all_done` branch) and `ACCOUNT_WALK_STEP` in the address-reviews walk
- [ ] 3.4 A test holds both bodies carrying their step with every field and the invocation, and one that submits each step's example payload through `orbit emit account`
- [ ] 3.5 Re-record the skill hash pins that move (apply, and address-reviews if pinned), each recorded here

## 4. Docs

- [ ] 4.1 Name `orbit emit account` in `docs/cli.md`'s `orbit emit` section (the command list and the paragraph on records that are not run summaries) and in the `emit` command's description in `src/cli/program.ts`

## 5. Close

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`, then full `npm test` green
- [ ] 5.2 Scenario tags for every delta scenario, and `node bin/orbit.js validate change-account --strict`
