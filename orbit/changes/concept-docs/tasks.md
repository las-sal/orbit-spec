## 1. The two new checks

- [ ] 1.1 Add `carriedByFailures` to `test/helpers/user-docs.ts` (design D1) and join it into `fileLocalFailures`;
  `test/core/user-docs/carried-by.test.ts` tags every scenario of `Every H2 section of four concept pages declares its
  owner on a checked Carried by line` and shows each failing row able to fail
- [ ] 1.2 Add `toolCoverageFailures` (design D2), reading `AI_TOOLS`, joined into `fileLocalFailures`;
  `test/core/user-docs/tool-coverage.test.ts` tags the four scenarios of `The supported-tools page lists every init
  target in two tiers`, including a page neither listed nor present
- [ ] 1.3 Confirm the tool inventory reads the `docs-inventory` fence from the active delta (`utility: npm cd find grep
  ls`), and that the unused-declaration rule passes only once `docs/migration-guide.md` is unlisted

## 2. The `orbit init` warning (R-ugd-11)

- [ ] 2.1 Add `detectOpenspecProject` and its call in `InitCommand.execute`, after the welcome screen and before tool
  selection, printing the warning design D3 describes
- [ ] 2.2 `test/core/init-openspec-warning.test.ts` tags the four scenarios of `orbit init warns when an OpenSpec project
  directory sits beside it`, running a real non-interactive init in temp directories, and asserts exit 0 and that
  `orbit/` is created

## 3. The five pages (design D4)

- [ ] 3.1 Rewrite `docs/concepts.md`: the inherited concepts shortened, orbit's additions added, one opening
  attribution, a `Carried by:` line on every H2 whose owners are re-read from their specs before they are named
- [ ] 3.2 Rewrite `docs/customization.md`: `schema`, `context`, `rules`, orbit's config keys and the schema `gates:` list,
  each H2 carried
- [ ] 3.3 Rewrite `docs/multi-language.md` in orbit's names, each H2 carried
- [ ] 3.4 Rewrite `docs/supported-tools.md` in the two tiers, every `AI_TOOLS` id in its tier, stating Codex's actual
  directories
- [ ] 3.5 Rewrite `docs/migration-guide.md`: the checklist (one command and fix per hazard row), the move steps, the
  "what orbit does not have" table, "what changes for you", and the measured version 1.14.1;
  `test/core/user-docs/migration-guide.test.ts` tags "The guide names its measured version"
- [ ] 3.6 Empty `test/core/user-docs/pending-rewrite.json` and set the three docs floors in the same commit (design D5),
  each at most its measured count; brief Sal before inventing a floor any sweep measures at zero

## 4. Exit (3): the recorded run (design D6)

- [ ] 4.1 Build a fresh upstream 1.14.1 project with one fixture per checklist hazard, run the guide as written, and
  record every command and its output in `orbit/changes/concept-docs/migration-run.md`
- [ ] 4.2 Declare "The guide's steps move a 1.14.1 project" `observed` in `orbit/scenario-ledger.yaml`, citing
  `migration-run.md`; fix any guide line the run falsified and re-run it

## 5. Close

- [ ] 5.1 `npm test` (full suite), `orbit validate concept-docs --strict`, and `orbit status --change concept-docs
  --scenarios` showing every delta scenario declared
