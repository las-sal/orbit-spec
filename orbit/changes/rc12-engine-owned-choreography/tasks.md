## 1. Instrument first

- [ ] 1.1 Extend `harness.ts`: scripted `gh pr view` and `gh pr list` responses (state, isDraft, head, base, url, body), and a `git` PATH shim that records argv and execs the real git; both logs readable per case
- [ ] 1.2 Write the allowlist assertion helper (every recorded `git`/`gh` call matches the allowlist table of `The \`orbit pr\` command observes and prints; it never writes`; an `off` case recorded none) and a helper that runs a plan's printed `commands` in order with placeholders filled

## 2. The engine module

- [ ] 2.1 `src/core/pr/run.ts`: the read-only runner (git and gh through one function that refuses anything outside the allowlist), `gh` availability by PATH lookup, and the output record type with the three actions and the closed placeholder set
- [ ] 2.2 `src/core/pr/resolve.ts`: the shared remote, canonical id and default-branch resolution, promoted from `phase1.ts`
- [ ] 2.3 `src/core/pr/select.ts`: Phase 1 promoted from `phase1.ts` with the switch removed; the four `branch_state` outcomes print their switch; creation prints `--no-track`
- [ ] 2.4 `src/core/pr/publish.ts`: the enumerated scope from git status, the no-CI observation via `ls-tree` on the remote default, the program path's four-axis query, and the printed commit, push, create and attachment-record commands
- [ ] 2.5 `src/core/pr/preflight.ts`: the attachment from the trail, citation divergence, live validation with the specific reasons, the fallback query, and the `emit` values
- [ ] 2.6 `src/core/pr/tail.ts`: archived-change resolution, the gh and HEAD preconditions with case-specific recovery, the computed scope with `--include`, the per-change and program PR steps, and `after_merge`
- [ ] 2.7 `src/core/pr/program.ts`: the architect readout's record validation and query, printing the READY flip and merge as the user's acts

## 3. CLI

- [ ] 3.1 `src/commands/pr.ts` and its registration in `src/cli/program.ts`: five subcommands, `--json` on each, `--include` on `tail`, exit 0 on every action and non-zero only on a usage error; the text rendering prints each argv as a shell-quoted line
- [ ] 3.2 Add the commands to `src/core/completions/command-registry.ts` and run the registry parity test

## 4. Tests (exit (1) and exit (3))

- [ ] 4.1 Move `phase1.test.ts`'s cases to `test/core/pr/select.test.ts` against the engine. Each `proceed` case executes the printed switch and asserts the branch and HEAD state the transcription used to assert. Retire `phase1.ts` and `phase1.test.ts`
- [ ] 4.2 `publish` cases: the scope with unrelated pre-staged and untracked files, CI present and absent, the program path's adopt, create, several and query-error outcomes; each `proceed` case executes the printed commit and push against the bare remote and the create against the stub
- [ ] 4.3 `preflight` cases: absent attachment (`off`), every validation reason, the fallback's three outcomes, an unavailable observation, citation divergence
- [ ] 4.4 `tail` cases: the scope intersection with an unrelated baseline edit, `--include`, HEAD mismatch in all three recovery cases, an already-ready PR, both granularities, the printed steps executed in order
- [ ] 4.5 `program` cases, and the allowlist assertion run across every case of 4.1–4.5; an `off` case for each gated subcommand asserts zero invocations
- [ ] 4.6 Declare every delta scenario with `@scenario` tags on the cases that exercise it (`orbit status --change rc12-engine-owned-choreography --scenarios` reads zero undeclared)

## 5. Close

- [ ] 5.1 Update the zero-engine-git comments in `harness.ts`, `src/core/emit-composition.ts` and any other site the grep for `zero-engine-git` finds, to the observes/prints wording; run the full `npm test` and `orbit validate rc12-engine-owned-choreography --strict`
