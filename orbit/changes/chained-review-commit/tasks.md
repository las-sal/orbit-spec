## 1. The settings and the subcommand

- [ ] 1.1 Add the `commit` and `push` resolver beside `resolveChainSetting` (only the literal `true` grants; anything else is silent), and type both keys in `src/core/project-config.ts` for documentation only; test the four combinations and the non-`true` values (`The commit and push settings`).
- [ ] 1.2 Write `src/core/pr/commit.ts`: resolve the change as active, else archived; run the gate table in order (`off` after no `git` call; `detached`, `head-mismatch`, `default-branch`, `merge-in-progress`); read porcelain with the shared parser; print the one segment (`stage`, `commit`, `push`, each by its row); resolve the remote with `withDefault: false`; drop the push with `degraded: "pr"` when no remote resolves; carry `branch`, `settings`, `untracked` and `unpushed` in `observations`.
- [ ] 1.3 Register `commit` in `src/commands/pr.ts`, `src/cli/program.ts` and `src/core/completions/command-registry.ts`, so the registry test passes both ways.
- [ ] 1.4 Write `test/core/pr/commit.test.ts` against real repositories with a bare remote and the `gh` stub, running each printed segment and asserting the repository and remote state, with the PATH shim failing on any invocation outside the allowlist; tag every scenario of the two ADDED `orbit-pr-lifecycle` requirements; mutation-check the gate order and the ignored-file case so the oracle is shown able to fail.

## 2. The step and the owners' text

- [ ] 2.1 Update the consumption-table mirror in `src/core/templates/workflows/pr-choreography.ts` to the MODIFIED `PR actions are workflow-body choreography (zero engine git)` table (the `commit` failure row), so its parity test holds it byte-equal.
- [ ] 2.2 Add `COMMIT_STEP` to `src/core/disciplines.ts` and interpolate it into the eight bodies the step's table marks yes, at the positions the table names (before `CHAIN_END_STEP` in propose, ff, apply, review and address-reviews; at the close of verify and explore; after archive's tail, before its completion readout).
- [ ] 2.3 Narrow `CHAIN_END_STEP`'s dirty-tree sentence to the MODIFIED `No-chaining contract`'s wording: the limit holds only where the commit step does not commit.
- [ ] 2.4 Test the carriage: `COMMIT_STEP` byte-equal in every yes-body and absent from every no-body; and that at the defaults the step's record is `off` with no `git` call (`The commit step closes every body that writes to a change`).
- [ ] 2.5 Test the chained arrival over a fixture: with both settings granted on an attached change, running the printed segment leaves `git status --porcelain` empty (the blind pair's preflight condition), and the chain object then reads no `no-progress` once the pair writes its record; tag the No-chaining contract's new scenario.
- [ ] 2.6 Test the archive's second commit over a fixture: the tail's commit leaves an unrelated tracked edit out, and `orbit pr commit` on the archived change prints the stage and commit that carry it; without `commit: true` it prints `off`.
- [ ] 2.7 Declare every carried scenario of the three MODIFIED blocks (`orbit status --change chained-review-commit --scenarios` shows none undeclared), tagging the existing tests that cover them.

## 3. Pins, docs and the green suite

- [ ] 3.1 Re-record each skill hash pin the eight bodies' text moves, and list every moved pin for the archive's note (R-adf-9).
- [ ] 3.2 Update `docs/customization.md` (the key count, a `commit` row and a `push` row, and the `chain` row's last sentence narrowed as the contract is) and `docs/cli.md` (an `orbit pr commit` row), and run the docs tests.
- [ ] 3.3 Run `npm run build && node bin/orbit.js update --force`, then the full `npm test`, and confirm green.
