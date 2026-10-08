## 1. One program, built by an exported builder (D1, D2)

- [ ] 1.1 Before moving anything, capture in a scratch directory the `--help` output of the root and of every command and subcommand, and the output of `orbit --version` and `orbit completion generate zsh` (the pre-refactor baseline; not committed)
- [ ] 1.2 Create `src/cli/program.ts` exporting `buildProgram(options)` with everything `src/cli/index.ts` builds today, including the three `register*Command` calls, the version, the global `--no-color` option and the three `preAction` hooks, the hooks skipped when `options.hooks` is `false`; `index.ts` becomes the build plus `parse()`
- [ ] 1.3 Tests (`test/core/cli-grammar/`): every captured `--help` output and the two command outputs from 1.1 are byte-identical after the refactor; building with `hooks: false` and a neutralised walk runs no action and no hook; an argv with an undeclared option rejects with commander's own message and the process does not exit

## 2. The shared extraction helper (D3, D4)

- [ ] 2.1 Add `markdown-it` (and its types) as a devDependency. Read its version, and measure before building on it: its `fence` tokens include the four list-nested `bash` fences (continue, ff, propose, verify) and the review prompt template's outer ```` ```markdown ```` block, whose content parsed again yields the inner `bash` fence
- [ ] 2.2 Write `test/helpers/surface-snippets.ts`: enumerate every generated surface (each `get*SkillTemplate()`'s `instructions` and `references`); locate fences with `markdown-it`, parsing `markdown`/`md` fence content again; extract shell-fence lines and inline spans for a named tool; tokenize by the spec's rules (quotes, `<…>` placeholders with spaces or a suffix, trailing ` # …`, `…`, joined lines for an open quote); apply the bare-name rule against a given command tree; and list the guard's candidate lines. Keep it tool-agnostic apart from the tool name
- [ ] 2.3 Unit tests for the helper: one per row of the spec's places table and fence table, and the tokenizer rules

## 3. The sweep (exit 1)

- [ ] 3.1 `test/core/cli-grammar/snippet-sweep.test.ts`: for every extracted `orbit` snippet, build a fresh neutralised program (D2) and `parseAsync` its argument vector; a failure names the workflow, the file, the line, the snippet and commander's message. A second test runs the guard over the same parse
- [ ] 3.2 Fix the architect scaffold (`src/core/templates/workflows/architect.ts:50`) so the generated body carries plain backticks; move the `getArchitectSkillTemplate` pin in `test/core/templates/skill-templates-parity.test.ts`, recording the move in its comment; rebuild and refresh the local surface (`npm run build && node bin/orbit.js update --force`)
- [ ] 3.3 The sweep and the guard pass over today's surface; any further defect the sweep finds is fixed here and listed in the apply emit, with the parsed and bare-name counts stated as figures

## 4. The completion registry (D5)

- [ ] 4.1 `test/core/cli-grammar/registry-parity.test.ts`: compare the builder's program and `COMMAND_REGISTRY` both ways over the fields the spec's table names, excluding the hidden commands and the named automatic options; run it red and record the failures
- [ ] 4.2 Fill `src/core/completions/command-registry.ts` until the parity test passes, adding the missing commands with their flags and positionals, and removing or correcting any entry the program does not declare
- [ ] 4.3 Test: `orbit completion generate zsh` output offers `status`, `emit`, `architecture`, `external`, `fingerprint`, `instructions`, `templates`, `schemas` and `new`

## 5. Every check shown able to fail (exit 2)

- [ ] 5.1 Inject into a copy of the surface, through the helper, an unknown flag, an unknown subcommand and an extra positional, each in a SKILL.md inline span, a reference's shell fence, a list-nested shell fence, and the shell fence inside the `markdown` fence (twelve cases); each fails naming the surface and the line
- [ ] 5.2 Inject an `orbit` command into an untagged fence of a copy of the surface; the guard fails naming the surface and the line
- [ ] 5.3 Show the parity test failing in both directions: a command added to a build that the registry lacks, and a registry entry naming a command the program lacks

## 6. Charter, scenarios, suite

- [ ] 6.1 Add `@scenario` tags for the delta's twelve scenarios on the tests that assert their THENs; `orbit status --change rc05-executable-references --scenarios` shows none uncovered
- [ ] 6.2 In `orbit/architecture/clean-up-review-cycle.md`, revise rc05's charter prose to the rescoped stage (every generated surface, `orbit` first, grammar only; `git` and the `gh` move to `rc05b-git-grammar`) and its exits to D-rc05-17's (1) and (2) and D-rc05-14's (3), with a dated note under R-crc-12's first case: the charter's "three PR references" and "100% of invocation-shaped snippets" no longer measured the stage once the extractor defines a snippet
- [ ] 6.3 Full `npm test` green; `orbit validate rc05-executable-references --strict` clean
- [ ] 6.4 (User-validation — observed on this stage's own system blind pair) the pair finds zero grammar defects in an `orbit` snippet (exit (3))
