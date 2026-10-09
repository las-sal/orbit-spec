## 1. Operator-aware extraction (D1, D-rc05b-5)

- [ ] 1.1 `tokenize` in `test/helpers/surface-snippets.ts` splits at unquoted `&&`, `||`, `|&`, `|`, `;`, `&`, whether spaced or glued, and returns segments. It drops a redirection with its target, keeps a quoted operator as an argument, strips a `(` opening a segment with its matching `)` as grouping, and reports an unquoted `$(`, backtick or `;;` as a failure. Unit cases go in `test/core/cli-grammar/surface-snippets.test.ts`.
- [ ] 1.2 `extractFenceLines` and `extractInline` emit one snippet per segment whose first token is the tool, at the line's own number; `extractInline` keeps rc05's gate (a span is read only when it begins with the tool). The quote-join rule stays line-level, and the header comment's "consumes it unchanged" is corrected.
- [ ] 1.3 Tag the three new MODIFIED scenarios (chained split, pipe into another tool, command substitution) with `@scenario` on tests that assert them. Run rc05's `orbit` sweep, injections and extractor suites green with no edits to their expectations.
- [ ] 1.4 Re-measure: the `git` and `gh` snippet counts after the split, with the twelve operator snippets now yielding per-segment snippets. Record the numbers in this task line.

## 2. The `git` contract capture (D3, D4, D-rc05b-7)

- [ ] 2.1 `scripts/capture.vitest.config.ts` (include: the capture file only), `scripts/capture-git-contract.capture.ts`, and `"capture:git"` in `package.json`. Confirm a plain `npm test` does not collect the capture.
- [ ] 2.2 The capture's candidate set is every `git` segment from `generatedSurfaces()` through the shared extractor, bare names included. It probes per D4: known, the bogus-flag self-check choosing the `-h` or run strategy, each flag as written, value-taking, and positional required. It runs under the D4 environment in a throwaway repository with one commit. A command no strategy rejects and no `ORBIT_SIDE_RULES` entry names fails the capture and writes nothing.
- [ ] 2.3 The refusal and the classification are pure functions over probe results, unit-tested with fake results: a usage page, `unknown option`, `invalid option`, `unrecognized argument`, `requires a value`, an unclassifiable command with and without a named rule. Tag `The capture refuses a command it cannot classify`.
- [ ] 2.4 Run `npm run capture:git`, commit `test/integration/cli-contracts/git-contract.json`, and read the diff. Any surface flag git records as REJECTED is a real defect: fix it in its template under this stage and re-capture.
- [ ] 2.5 `test/integration/cli-contracts/git-contract.test.ts`: the file parses, records a `git version`, and carries every command key the surface uses. No test spawns `git`. Tag `The suite needs no git`.

## 3. The `git` validator (D5)

- [ ] 3.1 `test/integration/cli-contracts/git-contract-validate.cjs` per D5: longest-key lookup, exact flag names, rejected flags with git's message, unrecorded flags naming `npm run capture:git`, value consumption (separate, `=`, and attached short), `--`, `positional_required`, the `rev-parse` recorded-flags rule, and placeholders as values.
- [ ] 3.2 Validator unit cases, one per D5 branch. Tag `The orbit-side rule rejects what git would accept` and `A flag added after capture asks for re-capture`.

## 4. One sweep for both recorded tools (D2, D-rc05b-6, D-rc05b-8)

- [ ] 4.1 `test/helpers/recorded-sweep.ts`: `commandTreeFromKeys`, `analyseRecorded`, `sweepRecorded`, with failures formatted as `orbit-sweep.ts` formats them (surface, line, snippet, message).
- [ ] 4.2 `test/core/cli-grammar/recorded-sweep.test.ts`: `git` and `gh` over every generated surface, with every snippet validating and zero guard failures for either tool (exit (1)), and bare-name cases from the contract tree. Tag `Today's surface validates for both recorded tools`, `A gh snippet in a SKILL.md body is validated`, `An unknown git flag fails the sweep`, `A missing value fails the sweep` and `An unrecorded subcommand fails and a recorded bare name is prose`.
- [ ] 4.3 Retire `ghSnippets` and `snippetArgv` from `test/core/templates/orbit-content-fidelity.test.ts`. Its nine negative fixtures, the bare-name case and the quoted-value case re-run through the shared extractor on synthetic surfaces. `grep -rn "ghSnippets\|snippetArgv" test` returns nothing.
- [ ] 4.4 Tag the four carried `orbit-pr-lifecycle` scenarios on the tests that assert them (`gh-contract.test.ts`, the harness's stub cases, and the moved sweep fixtures).

## 5. Exit (2)'s injection matrix (D6)

- [ ] 5.1 Extend `test/core/cli-grammar/injections.test.ts` with `git` and `gh` defect rows at rc05's four places: an unknown flag, an unknown subcommand, and a missing required argument (`gh`: the selector rule; `git`: a `positional_required` command from the contract, else `git switch -c`). That makes 24 cases, each asserting the surface, the line and the message.

## 6. Verification

- [ ] 6.1 Full `npm test` green (count stated against 3145), with no compile failures in the run output. `orbit validate rc05b-git-grammar --strict` passes, and `orbit status --change rc05b-git-grammar --scenarios` shows zero undeclared delta scenarios.
- [ ] 6.2 At archive: replace `orbit-cli-grammar`'s baseline Purpose in place so it names the recorded-contract tools and the operator split. No delta carries `## Purpose`.
