## 1. The instrument first

- [x] 1.1 Write `test/helpers/cli-name.ts`: the shipped-file walk (`src/**/*.ts` through the TypeScript AST, per
  design decision 2; `schemas/`, `bin/`, `scripts/postinstall.js` and `build.js` line by line), the `OpenSpec|Openspec` pattern,
  the exact admitted list keyed by file, line substring and reason (design decision 3), and a pure `residue()` that
  returns `file:line: residue '<occurrence>'` failures and `stale admission` failures
- [x] 1.2 Write `test/core/cli-name.test.ts` with fixture cases for each scenario of `orbit-cli-name`: an unadmitted
  literal, a comment and an identifier, a schema line, an admitted occurrence beside a stale entry, and a line
  carrying an admitted occurrence and an unadmitted one. Tag each `@scenario`
- [x] 1.3 Add the runtime help check to the same file: recurse over `buildProgram()`'s visible commands, render
  `helpInformation()`, and assert no case-insensitive `openspec` except `OPENSPEC_CONCURRENCY`. Tag it `@scenario`
- [x] 1.4 Add the real-package case (the scan over the shipped files must return no failures) and run it red: it
  must list the 48 rename occurrences, the schema line and `build.js`' banner, and nothing else. Record the count

## 2. The CLI's strings

- [x] 2.1 Rename the console and spinner output in `src/ui/welcome-screen.ts`, `src/core/init.ts` and
  `src/core/view.ts` per design decision 1
- [x] 2.2 Rename the three directory errors in `src/core/update.ts`, `src/core/archive.ts` and `src/core/list.ts` to
  name the directory (D-cso-4), and update `test/core/{archive,list,update}.test.ts`, tagging the list case `@scenario`
- [x] 2.3 Rename the help descriptions in `src/cli/program.ts`, `src/commands/spec.ts`, `src/commands/config.ts` and
  `src/core/completions/command-registry.ts`. Update `test/commands/config.test.ts:100`, which quotes the config
  description
- [x] 2.4 Rename the completion generator headers, the bash and zsh rc-file comment and printed snippet, the zsh
  removal message and `src/commands/completion.ts`' prompt, keeping the `OPENSPEC:START/END` markers (D-cso-3).
  Update the tests in three ways. (a) The removal and replace fixtures (`zsh-installer.test.ts:540-566`,
  `bash-installer.test.ts` ~410-435) KEEP the old comment: they model rc files users already have. (b) The
  install-content asserts (`zsh-installer.test.ts:406`, `bash-installer.test.ts:120,276`) move to the new comment.
  (c) Add one case: a re-install over an old-comment block leaves the new comment and one marker pair. The three
  generator header asserts (`{bash,zsh,fish}-generator.test.ts:34-35`) follow
- [x] 2.5 Rename `src/commands/feedback.ts`' footer and `src/core/legacy-cleanup.ts`' upgrade banner and context
  line, keeping its three marker lines. Update `test/commands/feedback.test.ts:182,275`,
  `test/core/update.test.ts:932,979,1096` (the upgrade banner) and `test/core/legacy-cleanup.test.ts` where they
  quote the old text
- [x] 2.6 Rename the description in `schemas/spec-driven/schema.yaml` and `build.js`' "Building OpenSpec..." banner
- [x] 2.7 Change `test/cli-e2e/basic.test.ts`' three init asserts to "orbit Setup Complete", and add to the
  `--tools claude` case an assert that stdout carries no case-insensitive `openspec`. Tag it `@scenario`

## 3. The generated skills

- [x] 3.1 Apply the named edits to the orbit-modified bodies in place, exactly as `orbit-cli-name`'s named-edit table
  states: `explore.ts`, `apply-change.ts` (skill and command), `new-change.ts`, `ff-change.ts`,
  `continue-change.ts`
- [x] 3.2 Rename `review.ts`' four "an OpenSpec change" to "an orbit change"
- [x] 3.3 Re-pin `test/core/templates/skill-templates-parity.test.ts`' hashes with a dated note naming this change,
  then `npm run build && node bin/orbit.js update --force` to refresh the local `.claude/` surface

## 4. Closure

- [x] 4.1 Run the real-package case green. Then show the instrument can fail: revert one renamed string in `src/`,
  the schema line and one admitted entry's target, each alone. The scan names each one, and the stale check fires
  for the third. Restore all three
- [x] 4.2 Run the named limit's method: a case-insensitive grep of the shipped files for command-form prose
  (`openspec <verb>`). Record what it returns
- [x] 4.3 Edit two files in place. In `orbit/specs/orbit-review/spec.md`'s Purpose, "an OpenSpec change" becomes "an
  orbit change". In `CLAUDE.md:17`, the Tier-C list drops "`OpenSpec` branding prose": that prose is now renamed
  and held by `orbit-cli-name`. The protected names stay listed, joined by the `OPENSPEC_*` environment variables
  and the rc-file markers
- [x] 4.4 Run the full `npm test` and `orbit validate cli-says-orbit --strict`
- [x] 4.5 (User-validation) In a scratch directory, run `orbit init`, then `orbit --help`. Neither says OpenSpec. OBSERVED after archive, 2026-10-14: Sal ran both and reported them complete; the archive emit (archive-2026-10-14T17-30-10Z) records the task as deferred, which was true at that seam.
