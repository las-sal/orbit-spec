## 1. Instrument first

- [ ] 1.1 Extend `harness.ts`: remotes with GitHub-shaped URLs (retiring the `remote.<r>.ghurl` hook), scripted `gh pr view` and `gh pr list` responses (state, isDraft, head, base, url, body, and a missing pull request), and a `git` PATH shim that records argv and execs the real git; both logs readable per case
- [ ] 1.2 Add the not-found probe to `scripts/capture-gh-contract.mjs`, run `npm run capture:gh`, and commit the contract diff carrying the third error rule; the stub returns it for a scripted missing pull request
- [ ] 1.3 Write the instrument helpers: the allowlist assertion (every recorded call matches the allowlist table; an `off` case recorded none), and the segment runner (authors each segment's inputs, runs its steps in order, never runs `human_acts`); add the two injected-failure cases that show each can fail

## 2. The engine module

- [ ] 2.1 `src/core/pr/record.ts` and `src/core/pr/run.ts`: the record type (action, reason codes, degraded, observations, segments with the closed input set, human_acts), and the read-only runner that refuses anything outside the allowlist, including the bounded `ls-remote` + explicit-refspec `--no-tags` fetch
- [ ] 2.2 `src/core/pr/resolve.ts`: the shared remote, canonical id and default-branch resolution, promoted from `phase1.ts`
- [ ] 2.3 `src/core/pr/select.ts`: Phase 1 promoted from `phase1.ts` with the switch printed rather than run; the inputs table (staging dir, active change, standalone); the four `branch_state` outcomes; creation prints `--no-track`
- [ ] 2.4 `src/core/pr/publish.ts`: the enumerated scope from `git status --porcelain`, `observations.unrelated`, the no-CI observation, the program path's query outcomes (adopt, create, several and query-error as `degraded`), and the two segments
- [ ] 2.5 `src/core/pr/preflight.ts`: the attachment from the trail, citation divergence, the closed outcome set with the not-found discriminator, and `observations.emit`
- [ ] 2.6 `src/core/pr/tail.ts`: archived-change resolution, the archive-emit reading table, the `gh` and HEAD preconditions, the scope from `sync_specs.capabilities_updated` plus `--include`, the per-change and program PR steps with `current_body`, and the `human_acts`
- [ ] 2.7 `src/core/pr/program.ts`: the latest URL-bearing record, live validation, fall-through, `unverified` on a failed observation, `candidates`, and the two human acts

## 3. CLI

- [ ] 3.1 `src/commands/pr.ts` and its registration in `src/cli/program.ts`: five subcommands, `--json` on each, `--include` on `tail`, exit 0 on every action and non-zero only on a usage error; the text rendering prints each argv as a shell-quoted line under its segment's inputs
- [ ] 3.2 Add the commands to `src/core/completions/command-registry.ts` and run the registry parity test

## 4. Tests (exit (1) and exit (3))

- [ ] 4.1 Move `phase1.test.ts`'s 39 cases: the commit-isolation case to `test/core/pr/publish.test.ts`, the rest to `test/core/pr/select.test.ts` against the engine, each `proceed` case executing the printed segment; add the inputs-table cases (staging-only cited, standalone, invalid name) and the configured-refspec and tag case; retire `phase1.ts` and `phase1.test.ts`
- [ ] 4.2 `publish` cases: the scope with unrelated pre-staged and untracked files, CI present and absent, the program query's four outcomes; each `proceed` case runs segment 1, writes a real propose emit from its result, runs segment 2, and asserts the record reached the bare remote
- [ ] 4.3 `preflight` cases: absent attachment (`off`), every outcome in the closed set (not-found and an auth failure side by side), citation divergence
- [ ] 4.4 `tail` cases: the archive-emit reading table's four rows, the scope with a modified and an ADDED capability beside an unrelated edit, `--include`, HEAD mismatch in all three recovery cases, both granularities, the segment executed, the human acts unrun
- [ ] 4.5 `program` cases (the URL-bearing record rule, fall-through, unverified, several), and the allowlist assertion run across every case of 4.1–4.5
- [ ] 4.6 Declare every delta scenario with `@scenario` tags on the cases that exercise it (`orbit status --change rc12-engine-owned-choreography --scenarios` reads zero undeclared)

## 5. Close

- [ ] 5.1 Apply design D10's sweep dispositions: edit the zero-engine-git comments in `harness.ts` and `src/core/emit-composition.ts` to the observes/prints wording, leave the kept sites as D10 states; run the full `npm test` and `orbit validate rc12-engine-owned-choreography --strict`
