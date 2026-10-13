## 1. The two new checks

- [x] 1.1 Add `carriedByFailures` to `test/helpers/user-docs.ts` (design D1) and join it into `fileLocalFailures`;
  `test/core/user-docs/carried-by.test.ts` tags every scenario of `Every H2 section of four concept pages declares its
  owner on a checked Carried by line` and shows each failing row able to fail
- [x] 1.2 Add `toolCoverageFailures` (design D2), reading `AI_TOOLS`, joined into `fileLocalFailures`;
  `test/core/user-docs/tool-coverage.test.ts` tags the five scenarios of `The supported-tools page lists every init
  target in two tiers`, including a page neither listed nor present
- [x] 1.3 Confirm the tool inventory reads the `docs-inventory` fence from the active delta (`utility: npm cd find grep
  ls rm`), and that the unused-declaration rule passes only once `docs/migration-guide.md` is unlisted

## 2. The `orbit init` warning (R-ugd-11)

- [x] 2.1 Add `detectOpenspecProject` and its call in `InitCommand.execute`, right after `validate` and before the
  legacy cleanup, printing the warning design D3 describes
- [x] 2.2 `test/core/init-openspec-warning.test.ts` tags the five scenarios of `orbit init warns when an OpenSpec project
  directory sits beside it`, running a real non-interactive init in temp directories, and asserts exit 0 and that
  `orbit/` is created

## 3. The five pages (design D4)

- [x] 3.1 Rewrite `docs/concepts.md`: the inherited concepts shortened, orbit's additions added, one opening
  attribution, a `Carried by:` line on every H2 whose owners are re-read from their specs before they are named
- [x] 3.2 Rewrite `docs/customization.md`: `schema`, `context`, `rules`, writing schemas and their templates in full,
  orbit's config keys and the schema `gates:` list, each H2 carried
- [x] 3.3 Rewrite `docs/multi-language.md` in orbit's names, each H2 carried
- [x] 3.4 Rewrite `docs/supported-tools.md` in the two tiers, every `AI_TOOLS` id in its tier, stating, for each tier-1 tool, the
  directories orbit writes and how it invokes the workflows
- [x] 3.5 Rewrite `docs/migration-guide.md`: the checklist (one command and fix per hazard row), the move steps, the
  "what orbit does not have" table, "what changes for you", and the measured version 1.14.1;
  `test/core/user-docs/migration-guide.test.ts` tags "The guide names its measured version" and "A move into an
  existing orbit directory is never offered" (the guide's text for an `orbit/` holding work carries no `git mv` line
  and names the nesting)
- [x] 3.6 Run `npm run capture:git` once `docs/migration-guide.md` carries its move steps, and confirm
  `test/integration/cli-contracts/git-contract.json` now records `mv`; record in the commit message the keys and flags
  the recapture dropped
- [x] 3.7 Empty `test/core/user-docs/pending-rewrite.json` and set the three docs floors in the same commit (design D5),
  each at most its measured count; brief Sal before inventing a floor any sweep measures at zero

## 4. Exit (3): the recorded run (design D6)

- [x] 4.1 Build a fresh upstream 1.14.1 project with one fixture per checklist hazard (both nested-path forms among them), run the guide as written (the move twice: before any `orbit init`, and after one has
  created `orbit/`), archive a copy
  of each fixture change and inspect the resulting baseline, and
  record every command and its output in `orbit/changes/concept-docs/migration-run.md`
- [x] 4.2 Declare "The guide's steps move a 1.14.1 project" `observed` in `orbit/scenario-ledger.yaml`, citing
  `migration-run.md`; fix any guide line the run falsified and re-run it

## 5. Close

- [x] 5.1 `npm test` (full suite), `orbit validate concept-docs --strict`, and `orbit status --change concept-docs
  --scenarios` showing every delta scenario declared
