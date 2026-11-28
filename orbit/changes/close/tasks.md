## 1. Baseline

- [ ] 1.1 Run `npm run build` and `npm test` for the green baseline count, and `npm run size:report` for every body's figure. Re-run the ceiling-history comparison design's Context names (every ceiling at `e2eabb02` against each commit that edited `skill-body-budget.test.ts`, and against `HEAD`) and keep its output for the archive's G2 grade.

## 2. The cap and the cross-check (design D2, D3)

- [ ] 2.1 In `skill-body-budget.test.ts`, add the cap (20,000 characters, as 5,000 estimated tokens at four characters each) and a check that fails naming each body whose character ceiling is over it, stating the budget rule. Show it failing on a clean mutation (a ceiling map with one body at 20,001). Tag the case `@scenario behaviour orbit-skill-generation :: Every generated skill body fits what a compaction keeps :: A ceiling over the cap fails the suite`.
- [ ] 2.2 Add a function over the report's source text that parses `KEPT_AFTER_COMPACTION` and `CHARS_PER_TOKEN` from `scripts/skill-size-report.mjs` with anchored patterns. It fails naming both figures when either is missing or their product differs from the cap. Run it on the real file, and show it failing on a mutated source (4,000 tokens kept) and on a source with neither constant. Tag the case `… :: The test and the size report measure the same budget`.
- [ ] 2.3 Tag the existing "within its character ceiling and its line limit" case, joined with the cap, `… :: Every body is within the cap`. Assert every rendered body is at most the cap and at most 500 lines. Confirm `orbit status --change close --scenarios` shows all three scenarios declared.

## 3. Comments and the convention (design D4)

- [ ] 3.1 Correct the two stale ceiling comments to the sizes `npm run size:report` reads (explore 19,984, onboard 19,951), and every other ceiling comment whose figure differs from the report. Change no ceiling value. Rewrite the test's doc comments so they state the cap as `orbit-skill-generation`'s requirement, not a goal of the program alone.
- [ ] 3.2 Name the requirement in `scripts/skill-size-report.mjs`' header comment (the suite carries it; the report still never fails) and in `skill_body_convention.md`'s "The budget holds" bullet.

## 4. Verify

- [ ] 4.1 Run `npm run build`, the full `npm test` (count against 1.1's baseline plus the new cases), `npm run size:report` (no body over) and `node bin/orbit.js validate close`. Check that `git diff` touches no file under `src/` and no generated body, so `skill-templates-parity` and the cut ledger are unchanged.
