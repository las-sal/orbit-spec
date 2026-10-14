## 1. The instrument first

- [ ] 1.1 Write `test/helpers/cli-name.ts`: the shipped-file walk (`src/**/*.ts` through the TypeScript AST, per
  design decision 2; `schemas/`, `bin/` and `scripts/postinstall.js` line by line), the `OpenSpec|Openspec` pattern,
  the exact admitted list keyed by file, line substring and reason (design decision 3), and a pure `residue()` that
  returns `file:line: residue '<occurrence>'` failures and `stale admission` failures
- [ ] 1.2 Write `test/core/cli-name.test.ts` with fixture cases for each scenario of `orbit-cli-name`: an unadmitted
  literal, a comment and an identifier, a schema line, an admitted occurrence beside a stale entry. Tag each
  `@scenario`
- [ ] 1.3 Add the runtime help check to the same file: recurse over `buildProgram()`'s visible commands, render
  `helpInformation()`, and assert no case-insensitive `openspec` except `OPENSPEC_CONCURRENCY`. Tag it `@scenario`
- [ ] 1.4 Add the real-package case (the scan over the shipped files must return no failures) and run it red: it
  must list the 48 rename occurrences and the schema line and nothing else. Record the count

## 2. The CLI's strings

- [ ] 2.1 Rename the console and spinner output in `src/ui/welcome-screen.ts`, `src/core/init.ts` and
  `src/core/view.ts` per design decision 1
- [ ] 2.2 Rename the three directory errors in `src/core/update.ts`, `src/core/archive.ts` and `src/core/list.ts` to
  name the directory (D-cso-4), and update `test/core/{archive,list,update}.test.ts`, tagging the list case `@scenario`
- [ ] 2.3 Rename the help descriptions in `src/cli/program.ts`, `src/commands/spec.ts`, `src/commands/config.ts` and
  `src/core/completions/command-registry.ts`
- [ ] 2.4 Rename the completion generator headers, the bash and zsh rc-file comment and printed snippet, the zsh
  removal message and `src/commands/completion.ts`' prompt, keeping the `OPENSPEC:START/END` markers (D-cso-3).
  Update the installer and generator tests that quote them
- [ ] 2.5 Rename `src/commands/feedback.ts`' footer and `src/core/legacy-cleanup.ts`' upgrade banner and context
  line, keeping its three marker lines. Update `test/commands/feedback.test.ts` and
  `test/core/legacy-cleanup.test.ts` where they quote the old text
- [ ] 2.6 Rename the description in `schemas/spec-driven/schema.yaml`
- [ ] 2.7 Change `test/cli-e2e/basic.test.ts`' three init asserts to "orbit Setup Complete", and add to the
  `--tools claude` case an assert that stdout carries no case-insensitive `openspec`. Tag it `@scenario`

## 3. The generated skills

- [ ] 3.1 Apply the named edits to the orbit-modified bodies in place, exactly as `orbit-cli-name`'s named-edit table
  states: `explore.ts`, `apply-change.ts` (skill and command), `new-change.ts`, `ff-change.ts`,
  `continue-change.ts`
- [ ] 3.2 Rename `review.ts`' four "an OpenSpec change" to "an orbit change"
- [ ] 3.3 Re-pin `test/core/templates/skill-templates-parity.test.ts`' hashes with a dated note naming this change,
  then `npm run build && node bin/orbit.js update --force` to refresh the local `.claude/` surface

## 4. Closure

- [ ] 4.1 Run the real-package case green. Then show the instrument can fail: revert one renamed string in `src/`,
  the schema line and one admitted entry's target, each alone. The scan names each one, and the stale check fires
  for the third. Restore all three
- [ ] 4.2 Run the named limit's method: a case-insensitive grep of the shipped files for command-form prose
  (`openspec <verb>`). Record what it returns
- [ ] 4.3 Edit `orbit/specs/orbit-review/spec.md`'s Purpose in place: "an OpenSpec change" becomes "an orbit change"
- [ ] 4.4 Run the full `npm test` and `orbit validate cli-says-orbit --strict`
- [ ] 4.5 (User-validation) In a scratch directory, run `orbit init`, then `orbit --help`. Neither says OpenSpec
