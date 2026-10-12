## 1. The command-coverage check

- [ ] 1.1 Implement `commandCoverageFailures(surfaces, paths, workflowIds)` in `test/helpers/user-docs.ts` (design D2, D3): `docs/cli.md` is checked against every command path, `docs/commands.md` against every workflow id, with the bounded text match over the whole file; an owing page neither listed nor present fails naming it; every other user doc passes
- [ ] 1.2 Wire it into `fileLocalFailures`. The paths come from `fromProgram(buildProgram(...))`, walked recursively into full `orbit <command> <subcommand>…` strings, and the ids from `ALL_WORKFLOWS`; neither list is typed in a test
- [ ] 1.3 Write `test/core/user-docs/coverage.test.ts`: one test per scenario of the ADDED requirement, each tagged `@scenario`, plus a non-vacuity test of the real domain that types no total: it holds at least one path at depth two, holds neither hidden command (`experimental`, `__complete`), and holds at least one workflow id (55 paths and 15 ids today, an exploration measurement, never asserted). Show each case able to fail by a mutation of the check, and record the mutations under this task

## 2. `orbit feedback`

- [ ] 2.1 Retarget `src/commands/feedback.ts` (design D5): both repository sites to `las-sal/orbit-spec`, the `feedback` label dropped from the URL and the argv, and the fallback's `Labels: feedback` line removed; change the help description "Submit feedback about OpenSpec" to "Submit feedback about orbit" at both its sites, `src/cli/program.ts` and `src/core/completions/command-registry.ts`; update `test/commands/feedback.test.ts` to match

## 3. The pages

- [ ] 3.1 Rewrite `docs/installation.md` in design D4's outline: Node `>=20.19.0`, R-ugd-4's line at `v2.0.0` and why it installs a release tree, `orbit --version`, `orbit init` (with `--tools codex`), upgrading as two steps (reinstall the newer tag, then `orbit update` per project, which refreshes the generated surface and downloads nothing), the README's from-source route; no pnpm, yarn, bun or Nix section
- [ ] 3.2 Rewrite `docs/getting-started.md` (design D4): one change end to end, the address-reviews walk after each review, what each step writes, the readout's eligibility line, `orbit status`; link back to the README's Quickstart rather than repeating it
- [ ] 3.3 Rewrite `docs/cli.md` (design D4): every visible command path in the groups D4 names, `config profile` and `init --profile` as they behave (D-rd-5, design D4: read from `src/core/profiles.ts`, `src/core/init.ts` and the config command before writing; `init --help`'s "(core or custom)" is documented as accepted and inert), the `change`/`spec` forms as their help describes them, the engine surfaces as agent-facing; every flag documented read from `orbit <command> --help`
- [ ] 3.4 Rewrite `docs/commands.md` (design D4): all 15 `/orbit:` workflows, the four orbit adds included, with `review`'s modes and reviewer selectors read from the review body; no profile framing
- [ ] 3.5 Rewrite `docs/workflows.md` (design D4): the patterns, the review cadence around apply and the walk, and "When to Update vs Start Fresh" as the one copy (D-rd-2); no profile framing
- [ ] 3.6 Move `docs/opsx.md` to `docs/workflow-engine.md` with `git mv` and rewrite it (design D4, D-rd-7). Its config, command-list and update-versus-fresh sections become links. Add the page to `README.md`'s docs list and repoint `docs/migration-guide.md`'s link

## 4. Close

- [ ] 4.1 Remove the six entries from `test/core/user-docs/pending-rewrite.json` (five paths plus `docs/opsx.md`). Rewrite the assertion in `test/core/user-docs/pending-rewrite.test.ts` that filters `docs/cli.md` out of the live list and expects it back, so it builds its own pending set over a page it names rather than depending on the live list. If a page needs a head beyond `orbit`, `git`, `gh`, `npm` and `cd`, add a MODIFIED delta of `The user docs declare their own command heads` declaring it (design D6), and run `orbit fingerprint reference-docs`
- [ ] 4.2 Read each of the six pages for upstream behaviour taught under orbit's name: profiles, a `core` install, a command orbit lacks, upstream's tracker (design D7, exit 3). Record what was read and found under this task
- [ ] 4.3 `npm test` green on the full suite; `orbit validate reference-docs --strict` passes; `orbit status --change reference-docs --scenarios` shows every delta scenario declared
- [ ] 4.4 Commit and push the apply
