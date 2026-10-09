## Context

rc05 shipped `test/helpers/surface-snippets.ts`: every generated SKILL.md and reference, its commands extracted from
shell-tagged fences and single-backtick spans located by markdown-it, a guard over every other line, and a tokenizer
stated in `orbit-cli-grammar`. `orbit` is its only consumer. rc01's `gh` sweep in
`test/core/templates/orbit-content-fidelity.test.ts` has its own extractor (`ghSnippets`, `snippetArgv`): a regex
over inline spans in three references. It validates through `gh-contract-validate.cjs`, the module the harness stub
also loads.

The exploration measured the ground (see explore.md, Decisions D-rc05b-1 to D-rc05b-4): 119 `git` and 34 `gh`
snippets extracted by the shared extractor unchanged, with no extraction failure and no guard hit. Twelve `git`
snippets carry `&&` or `|`. git offers no complete introspectable grammar. Real git's errors, probed in a repository
holding one commit, separate unknown, missing-value and accepted on every subcommand in use except `rev-parse`. A
second spike at propose found that `git <key> <flag> -h` decides a flag without running anything on the
parse-options builtins. On `log`, `show` and `rev-list` it does not: they answer `-h` before parsing, so a bogus flag
still prints usage.

## Goals / Non-Goals

**Goals:**
- Every `git` and `gh` snippet on the generated surface is held to its tool's recorded contract, through the ONE
  extractor (exit (1)).
- An unknown flag, an unknown subcommand and a missing required argument, injected at each of rc05's four extraction
  sites for each tool, fail naming the surface and line. rc01's inline extractor is retired (exit (2)).
- The extractor reads a chained or piped snippet as the shell does, for every tool.

**Non-Goals:**
- Executing any documented command in the suite (D-rc05-6). The capture runs git; the suite never does.
- Positional COUNTS for `git` beyond whether one is required: git's synopses vary by mode, and no snippet's defect on
  record was a count.
- POSIX utilities and `node` (`orbit-cli-grammar`'s tool table keeps them uncovered).
- Any generated-surface text, engine code, or adopter-visible behaviour.

## Decisions

### D1 — The tokenizer returns segments; the extractor classifies each (D-rc05b-5)

`tokenize` gains operator awareness. Outside quotes, `&&`, `||`, `|&`, `|`, `;` and `&` end the current token and the
current segment whether or not whitespace surrounds them. A redirection (`>`, `>>`, `<` followed by whitespace, `<<`,
a digit before `>`, `>&`) and its target are dropped. An unquoted `$(`, backtick, `(` or `;;` is an extraction
failure. The result is a list of segments, each a token list. `extractFenceLines` and `extractInline` emit one
snippet per segment whose first token is the swept tool, all at the line where the span or fence line starts. The
quote-join rule is unchanged: it decides at the LINE level whether a line was absorbed into another command's quote.
The guard is untouched, because it reads raw lines and the places residual keeps "mid-line after an operator" outside
every shell fence and span. The header comment's claim that rc05b "consumes it unchanged" is corrected.

### D2 — One generic recorded-tool sweep (D-rc05b-6, D-rc05b-8)

New `test/helpers/recorded-sweep.ts` exports `commandTreeFromKeys(keys)` and `analyseRecorded(surfaces, tool,
contract)`. The second runs `analyseSurfaces` with the contract-keyed tree, plus `sweepRecorded(analysis, validate,
contract)`, which mirrors `orbit-sweep.ts`'s failure format. `gh` uses `gh-contract.json` and its existing validator,
`git` the new pair. The bare-name rule is the shared extractor's `isBareCommandName` over that tree. rc01's `ghSnippets`
and `snippetArgv` are deleted. Their negative fixtures (nine cases), the bare-name case and the quoted-value case
re-run through the shared extractor on synthetic surfaces in the same describe block, so no coverage is lost.

### D3 — The `git` contract and its file shape (D-rc05b-7)

`test/integration/cli-contracts/git-contract.json` holds `git_version`, `captured_at`, `commands` keyed like `gh`'s
(`"worktree remove"`), and `rules`. Each command records `known`, `positional_required` and `flags: [{name,
takes_value, accepted, message?}]`, one entry per flag token the surface writes. The short flag and the long flag are
separate entries, since git has no alias map the capture can read. `rules` names the orbit-side rules,
`rev_parse_recorded_flags_only: true` today. The directory is new because `git` is not a PR-lifecycle tool here
(D-rc05b-6). `gh`'s files stay where the harness loads them.

The exploration's table distinguished an optional-value flag from a no-value flag. That collapses at propose to
`takes_value` alone. The validator needs only to know whether a flag consumes the next token. An `=value` written on
the surface is probed AS WRITTEN, so a value git refuses on a flag that takes none is recorded as rejected with git's
message. The one form left uncaught is an `=value` added after capture on a flag recorded without one. It fails as an
unrecorded form, asking for re-capture.

### D4 — The capture: probe strategy chosen per command by a self-check

`scripts/capture-git-contract.capture.ts` runs under its own `scripts/capture.vitest.config.ts`, whose `include`
names only that file. `npm run capture:git` invokes it, and `vitest run` never collects it (the default `include` is
`test/**/*.test.ts`). It reaches the TypeScript extractor through the test toolchain. There is no `tsx`, and `dist/`
does not carry test helpers. Per command key:

1. `git <key> -h`: known or unknown.
2. The bogus-flag self-check, `git <key> --orbit-capture-bogus -h`. If it reports an unknown or invalid option, the
   command is parse-options-first and every flag is probed with `-h` appended, so nothing runs. If it prints usage, the
   bogus flag is RUN in the throwaway repository. When that reports it rejected, every flag is probed by running
   (`log`, `show`, `rev-list`: read-only). When neither probe rejects it, the command needs a rule named in the
   capture's `ORBIT_SIDE_RULES` (`rev-parse`), or the capture fails naming it and writes nothing.
3. Per flag: the flag as written with `-h` or run, then the flag alone as the last token for `requires a value`.
4. `git <key>` alone for `positional_required`: a usage page means yes.

Every probe runs with `LANG=C`, `GIT_EDITOR=false`, stdin closed, `GIT_CONFIG_GLOBAL=/dev/null`,
`GIT_CONFIG_NOSYSTEM=1`, no remote, cwd the throwaway repository, and a 10-second timeout. A probe that runs a
mutating command (`git add -A` alone) mutates only the throwaway repository. The capture prints a summary and the git
version, and the diff is reviewed like `capture:gh`'s.

### D5 — The `git` validator is strict, and its messages say which kind of miss

`test/integration/cli-contracts/git-contract-validate.cjs` exports `validate(argv, contract)` with `gh`'s calling
convention: argv excludes `git`; the result is `{ok, message}`. The lookup takes the longest key. An unknown command
gets `unknown command "<x>" for "git"`. A flag must match a recorded name exactly, with no abbreviation and no
bundling. An attached short value (`-S<x>`) is accepted only on a value-taking short flag. A rejected flag returns
git's recorded message. An unrecorded flag returns `flag <f> on git <key> is not in the recorded contract — re-run
npm run capture:git`. `--` ends options. `positional_required` with no positional returns `git <key> requires an
argument`. `rev-parse` applies the recorded-flags rule. Placeholders pass. Strictness is deliberate: a bundled or
abbreviated flag fails, and the author unbundles it. No snippet on today's surface bundles.

### D6 — Exit (2)'s injection matrix extends rc05's

`test/core/cli-grammar/injections.test.ts` keeps its four `PLACES`. It gains `git` and `gh` defect rows: an unknown
flag (`git commit --only <paths> --frobnicate`, `gh pr view --repo <owner>/<repo> <url> --frobnicate`), an unknown
subcommand (`git frobnicate <path>`, `gh pr frobnicate --repo <owner>/<repo>`), and a missing required argument. For
`gh` that is the recorded selector rule (`gh pr view --repo <owner>/<repo> --json isDraft`). For `git` it is a command
the capture records `positional_required`, chosen from the contract at apply, with `git switch -c` (a missing value)
as the fallback if none is recorded. 4 places × 3 defects × 2 tools = 24 cases, each asserting the surface, the line
and the message.

### D7 — The stage's exits stand as written

All three charter exits can be measured by the shipped mechanism. (1) is the "today's surface" scenario. (2) is D6
plus the deletion of `ghSnippets`/`snippetArgv`, checked by a grep in the task. (3) is the stage's own system blind
pair. No R-crc-12 revision is needed.

## Alternatives considered

- **`git`'s contract from `-h` plus a declared supplement**: the supplement for `log`, `show` and `rev-parse` would be a remembered grammar beside a captured one (see explore.md, Considered & out).
- **`git`'s contract from `contrib/completion/git-completion.bash`**: a hand-maintained copy inside git's tree, and a third copy here (explore.md).
- **Splitting operators in a `git`-only pre-pass**: two places that tokenize one snippet, and `orbit`'s residual left open (explore.md).
- **`git`'s contract beside `gh`'s in `orbit-pr-lifecycle`**: most `git` snippets are review choreography (explore.md).
- **Three value kinds (none / required / optional) in the contract**: the validator consumes on `required` only; probing the surface's own `=value` form covers the rest (D3).
- **A capture written in `.mjs` that reads `dist/`**: `dist/` carries no test helpers, and duplicating the extractor in the script would make two extractors again (D4).

## Risks / Trade-offs

- **D-rc05b-7's classification residual**: a git grammar error whose message the capture does not recognise would be
  recorded as accepted. The named limit and its method are stated in `orbit-cli-grammar`'s `Every \`git\` and \`gh\`
  snippet on the generated surface validates against its tool's recorded contract`.
- **[A probe runs git commands]** → only in a throwaway repository with no remote, a failing editor, closed stdin and a
  timeout. The commands that answer `-h` first are read-only.
- **[The contract is surface-derived]** → a valid flag a body adopts fails until re-capture. The message names
  `npm run capture:git`, the same cost a new `gh` verb pays.
- **[git version drift]** → the contract records the version it was captured against. The suite reads the file only;
  re-capture on a new git is a reviewed diff.
- **[The tokenizer change reaches `orbit`'s sweep]** → `orbit` snippets carry no operator today (D-rc05b-2). rc05's
  sweep and injections must stay green, and they are in the task list's gate.

## Touchpoints

- `test/helpers/surface-snippets.ts` — operator-aware tokenizer; per-segment extraction; header comment.
- `test/helpers/recorded-sweep.ts` — new: contract-keyed tree and the recorded-tool sweep.
- `test/integration/cli-contracts/` — new: `git-contract.json`, `git-contract-validate.cjs`, `git-contract.test.ts`.
- `scripts/capture-git-contract.capture.ts` + `scripts/capture.vitest.config.ts` — the capture.
- `package.json` — `capture:git`.
- `test/core/templates/orbit-content-fidelity.test.ts` — rc01's extractor retired.
- `test/core/cli-grammar/*.test.ts` — the `git`/`gh` sweep, tokenizer cases, the injection matrix.
- `test/integration/pr-lifecycle/gh-contract.test.ts` — scenario tags for the carried `orbit-pr-lifecycle` scenarios.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc05b-5 | SOURCED | live rule | `Every \`orbit\` snippet on the generated surface parses against that program` (MODIFIED) — TABLE: the operator rows of the places table, with the closure sentence naming POSIX XCU 2.10 |
| D-rc05b-7 | BOUNDED | live rule | `Every \`git\` and \`gh\` snippet on the generated surface validates against its tool's recorded contract` (ADDED) — TABLE: the probe table, residual slots verbatim as its named limit; Risks entry above |
| D-rc05b-8 | DERIVED | live rule | `Every \`git\` and \`gh\` snippet on the generated surface validates against its tool's recorded contract` (ADDED) — TABLE: the bare-name table, with its closure sentence |
