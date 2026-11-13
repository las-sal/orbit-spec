## 1. The account's write gate

- [ ] 1.1 Add the account's payload fields and checks (plain fields, defines, detail, one account, replaces, active change only) beside the decision records' in `src/core/decision-records.ts` or a sibling module
- [ ] 1.2 Add the `account` command to `src/core/emit-composition.ts`'s command table: `kind: null`, change scope only, path `.orbit-runs/account/account-<TS>.json`, decision-record spine checks, no `next_recommended` or `final_assessment`, no-overwrite publish
- [ ] 1.3 Tests for every scenario of `orbit-emit-composition`'s `The write gate checks the account`, each refusal shown able to fail
- [ ] 1.4 Move the closed-set pins this extends: `emit-composition.test.ts`'s every-command spine case list and `rc03b-untouched-modules.test.ts`'s `emit-composition.ts` hash, each recorded here

## 2. No reader takes it

- [ ] 2.1 Tests for `No reader takes the account yet`: `orbit decisions brief` renders nothing to read with only an account, the archive's unread count leaves it out, and `orbit status` and the gates read a change with an `account/` folder as without it

## 3. The bodies

- [ ] 3.1 Add `ACCOUNT_STEP` to `src/core/disciplines.ts`, composed from the account's field list: written by the apply session that checks the last task, before its run summary; replaced when a later apply changes what it says; the three fields in plain language, "none" in words; how to run `orbit emit account`
- [ ] 3.2 Carry it in the apply body before the run-summary emit, and one sentence in the address-reviews walk: a resolved finding that changes what was built, a seam or a deviation replaces the latest account
- [ ] 3.3 A test holds both bodies carrying the step, and one that submits the step's example payload through `orbit emit account`
- [ ] 3.4 Re-record the skill hash pins that move (apply, and address-reviews if pinned), each recorded here

## 4. Close

- [ ] 4.1 `npm run build && node bin/orbit.js update --force`, then full `npm test` green
- [ ] 4.2 Scenario tags for every delta scenario, and `node bin/orbit.js validate change-account --strict`
