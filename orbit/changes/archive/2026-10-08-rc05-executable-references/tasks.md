## 1. One program, built by an exported builder (D1, D2)

- [x] 1.1 Before moving anything, capture in a scratch directory the `--help` output of the root and of every command and subcommand, and `orbit --version` (the pre-refactor baseline for task 1.4; a one-time measurement, not a fixture)
- [x] 1.2 Create `src/cli/program.ts` exporting `buildProgram(options)` with everything `src/cli/index.ts` builds today: the version, the global `--no-color` option, every command, and the three `register*Command` calls. All five `preAction` hooks are skipped when `options.hooks` is `false`: the root's and `change`'s in `index.ts`, and `spec`'s, `config`'s and `schema`'s, which live in `src/commands/spec.ts`, `src/commands/config.ts` and `src/commands/schema.ts`. `registerSpecCommand`, `registerConfigCommand` and `registerSchemaCommand` each take the option. `index.ts` becomes the build plus `parse()`
- [x] 1.3 Tests (`test/core/cli-grammar/builder.test.ts`): `index.ts` declares no command, option or hook and builds through `buildProgram`; a build with `hooks: false`, neutralised per D2, runs no action and no hook (including `config --scope local list` and `schema which`); an argv with an undeclared option rejects with commander's own message and the process does not exit; `external` alone rejects with `commander.help`, `external frobnicate` with commander's unknown-command error, and `--help` and `--version` are accepted
- [x] 1.4 Measure once, after 1.2: every `--help` output captured in 1.1, and `orbit --version`, is byte-identical; record the result in the apply emit

## 2. The shared extraction helper (D3, D4)

- [x] 2.1 Add `markdown-it` (and its types) as a devDependency. Read its version, and measure before building on it: its `fence` tokens include the four list-nested `bash` fences (continue, ff, propose, verify) and the review prompt template's outer ```` ```markdown ```` block, whose content parsed again yields the inner `bash` fence
- [x] 2.2 Write `test/helpers/surface-snippets.ts`: enumerate every generated surface through `getSkillTemplates()` (`instructions` and `references` of each entry); locate fences with `markdown-it`, parsing `markdown`/`md` fence content again; extract shell-fence lines and inline spans for a named tool; tokenize by the spec's rules (quotes with `\"` not closing, `<…>` placeholders with spaces or a suffix, trailing ` # …`, `…`, lines joined for an open quote only within the same fence, an unterminated quote a failure); apply the bare-name rule against a given command tree; and list the guard's failures (after stripping leading whitespace, `>` markers, list markers and a leading `|`: first token the tool, a later token beginning `-`). Keep it tool-agnostic apart from the tool name
- [x] 2.3 Unit tests for the helper: one per row of the spec's places table and fence table, the tokenizer rules, the unterminated-quote failure, the guard's normalisation, and a prose line carrying no flag passing the guard; the helper's workflow set equals `getSkillTemplates()`'s (architect included, feedback excluded)

## 3. The sweep and the escaped-backtick check (exit 1; D6, D8)

- [x] 3.1 `test/core/cli-grammar/snippet-sweep.test.ts`: for every extracted `orbit` snippet, build a fresh neutralised program (D2) and `parseAsync` its argument vector; a failure names the workflow, the file, the line, the snippet and commander's message. A second test runs the guard over the same parse
- [x] 3.2 `test/core/cli-grammar/escaped-backticks.test.ts` (D8): fail on any backslash immediately before a backtick in a generated surface's raw text, naming the surface and the line. Run it red, then fix the three slips: `src/core/templates/workflows/architect.ts:50` and `src/core/templates/workflows/review.ts:427` and `:510`. Move the `getArchitectSkillTemplate` pin in `test/core/templates/skill-templates-parity.test.ts` and `PASTE_ITEMS_BEFORE_RUNNERS` in `test/core/templates/external-runner-branch.test.ts`, recording each move in its file; rebuild and refresh the local surface (`npm run build && node bin/orbit.js update --force`)
- [x] 3.3 The sweep, the guard and the escaped-backtick check pass over today's surface; any further defect the sweep finds is fixed here and listed in the apply emit, with the sweep's parsed and bare-name counts stated as figures

## 4. The completion registry (D5)

- [x] 4.1 `test/core/cli-grammar/registry-parity.test.ts`: compare the builder's program and `COMMAND_REGISTRY` both ways over the fields the spec's table names, excluding the hidden commands and the named automatic options; run it red and record the failures
- [x] 4.2 Fill `src/core/completions/command-registry.ts` until the parity test passes, adding the missing commands with their flags and positionals, and removing or correcting any entry the program does not declare
- [x] 4.3 Test: `orbit completion generate <shell>` output, for each of `zsh`, `bash`, `fish` and `powershell`, offers `status`, `emit`, `architecture`, `external`, `fingerprint`, `instructions`, `templates`, `schemas` and `new`

## 5. Every check shown able to fail (exit 2)

- [x] 5.1 Inject into a copy of the surface, through the helper, an unknown flag, an unknown subcommand and an extra positional, each in a SKILL.md inline span, a reference's shell fence, a list-nested shell fence, and the shell fence inside the `markdown` fence (twelve cases); each fails naming the surface and the line
- [x] 5.2 Inject into an untagged fence of a copy of the surface `orbit validate --strict` and `orbit status --frobnicate`, and the same inside a blockquote; the guard fails each naming the surface and the line
- [x] 5.3 Show the parity test failing, naming the command or flag, for: a command added to a build that the registry lacks; a registry command the program lacks; a flag added to a program command that the registry lacks; a registry flag the program lacks; and a changed `short` and a changed `takesValue` on one flag
- [x] 5.4 Show the escaped-backtick check failing on an injected backslash-backtick in a copy of a surface

## 6. Charter, scenarios, suite

- [x] 6.1 Add `@scenario` tags for the delta's scenarios on the tests that assert their THENs; `orbit status --change rc05-executable-references --scenarios` shows none uncovered
- [x] 6.2 In `orbit/architecture/clean-up-review-cycle.md`, revise rc05's charter prose to the rescoped stage (every generated surface, `orbit` first, grammar only; `git` and the `gh` move to `rc05b-git-grammar`) and its exits: (1) and (3) as design.md's Goals state them, and (2) as "each injection in tasks.md section 5 fails the suite; a snippet or guard injection names the snippet's surface and line, and a parity injection names the command or flag". Add a dated note under R-crc-12's first case: the charter's "three PR references" and "100% of invocation-shaped snippets" no longer measured the stage once the extractor defines a snippet
- [x] 6.3 Full `npm test` green; `orbit validate rc05-executable-references --strict` clean
- [x] 6.4 (User-validation — observed on this stage's own system blind pair) the pair finds zero grammar defects in an `orbit` snippet (exit (3))
