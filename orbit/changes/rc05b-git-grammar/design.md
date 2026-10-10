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
holding one commit, separate unknown, missing-value and accepted on every subcommand in use except `rev-parse`. The
proposal pair refuted the first probe table: `-h` cannot classify a value-taking flag, and a usage page is not a
rejection on a command that needs a positional. Re-exploration executed a revised table against real git, each probe
in a fresh repository copy (explore.md D-rc05b-9 to D-rc05b-11, Cases 1–3): every surface flag is accepted and ten
invented defects are rejected.

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
- Any generated-surface text, engine code, or adopter-visible behaviour, except a template fix for a surface flag the
  capture records as rejected by real git (task 2.4).

## Decisions

### D1 — The tokenizer returns segments; the extractor classifies each (D-rc05b-5)

`tokenize` gains operator awareness. Outside quotes, `&&`, `||`, `|&`, `|`, `;` and `&` end the current token and the
current segment whether or not whitespace surrounds them. A redirection (`>`, `>>`, `>|`, `>&`, `<` followed by
whitespace, `<>`, `<&`, a digit glued before any of them) and its target are dropped. A `(` opening a segment and its
matching `)` are grouping and are stripped, so the runner launch's subshell in `external-handoff.md` yields ordinary
segments. An unquoted `$(`, backtick, `<(`, `>(`, `;;` or `<<`, and a `$(` or backtick inside double quotes, is an
extraction failure; none appears on today's surface (measured at the proposal walk for the unquoted three, every
shell-fence line and every tool-headed inline span; at the system walk for the rest). The result is a list of segments, each a token list. `extractFenceLines` and `extractInline` emit one
snippet per segment whose first token is the swept tool, all at the line where the span or fence line starts.
`extractInline` keeps rc05's gate: an inline span is read only when it begins with the tool, and then every segment of
that tool in it is extracted. A tool command after an operator in a span beginning with another word is in the places
residual. The
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
(`"worktree remove"`), and `rules`. Each command records `known`, `class` (`parse-options` | `run` | `rule`),
`positional_required` and `flags: [{name, takes_value, accepted, message?}]`, one entry per flag token the surface writes. The short flag and the long flag are
separate entries, since git has no alias map the capture can read. `rules` names the orbit-side rules,
`rev_parse_recorded_flags_only: true` today. The directory is new because `git` is not a PR-lifecycle tool here
(D-rc05b-6). `gh`'s files stay where the harness loads them.

The exploration's table distinguished an optional-value flag from a no-value flag. That collapses at propose to
`takes_value` alone. The validator needs only to know whether a flag consumes the next token. An `=value` written on
the surface is probed AS WRITTEN, so a value git refuses on a flag that takes none is recorded as rejected with git's
message. An `=value` added after capture on a long flag that takes none is NOT caught: the validator accepts
`--name=value` on any accepted long flag, because the contract records which flags git accepts, not which forms;
nor, conversely, is a bare form added after capture of a flag recorded from its `=` form (`git log --format %h`).
Every form written at capture is probed; how a name's forms reduce to its one entry is a row of the ADDED
requirement's capture table. This
is a named limit in the ADDED requirement's validator paragraph, descoped at the proposal walk rather than recording
per-flag forms.

### D4 — The capture: classify the command first, then probe each flag in its class (D-rc05b-11)

`scripts/capture-git-contract.capture.ts` runs under its own `scripts/capture.vitest.config.ts`, whose `include`
names only that file. `npm run capture:git` invokes it, and `vitest run` never collects it (the default `include` is
`test/**/*.test.ts`). It reaches the TypeScript extractor through the test toolchain. There is no `tsx`, and `dist/`
does not carry test helpers. The procedure is the ADDED requirement's probe table, which a prototype executed over all
129 `git` segments on today's surface (see explore.md, Cases 1–3):

1. **Groups and keys.** `git <a> orbitcapturebogusverb` reporting `unknown subcommand` makes `<a>` a group. A group's
   key takes the segment's second token as its verb only when it matches `^[a-z][a-z0-9-]*$` (the prototype's test);
   a group segment with no such token has no key and fails as an unknown command. Every other key is one word.
2. **Known.** `git <key> -h`: a `usage:` first line means known; `is not a git command` or `unknown subcommand` means
   unknown, recorded with the line.
3. **Class.** A rejection shape from `git <key> --orbit-capture-bogus -h` means PARSE-OPTIONS. Otherwise, a rejection
   shape or usage page from `git <key> --orbit-capture-bogus HEAD` means RUN. Otherwise the key needs a rule named in
   the capture's `ORBIT_SIDE_RULES` (`rev-parse`), or the capture fails naming it and writes nothing.
4. **Per flag.** `git <key> <name>` alone, and `requires a value` means value-taking. Acceptance is then probed with the
   flag as written plus `x` when value-taking: under `-h` for PARSE-OPTIONS (usage means accepted, a rejection shape
   means rejected, any other line fails the capture), and with `HEAD` for RUN (a rejection shape or usage means
   rejected, anything else accepted).
5. **Positional.** `git <key>` alone with a `usage:` first line means a positional is required.

Every probe runs in a FRESH copy of a template repository (one commit, branch `main`). A probe can mutate its repository
(`switch -c x HEAD` switched the branch in the first matrix, and `init <word>` created a nested repository), so a shared
one makes each reading depend on the probes before it. The environment is `LANG=C`, `LC_ALL=C`, `GIT_EDITOR=false`,
closed stdin, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_TERMINAL_PROMPT=0`, no remote, and a
10-second timeout. The prototype's run was 146 probes in seconds. The probe-result classifiers (the rejection shapes,
class, value-taking, acceptance, key arity) are PURE functions over `{status, firstLine}`, so the tests exercise every
branch with recorded lines and never spawn git. The capture prints a summary and the git version, and the diff is
reviewed like `capture:gh`'s.

### D5 — The `git` validator is strict, and its messages say which kind of miss

`test/integration/cli-contracts/git-contract-validate.cjs` exports `validate(argv, contract)` with `gh`'s calling
convention: argv excludes `git`; the result is `{ok, message}`. The lookup takes the longest key. A key the contract records
`known: false` returns git's recorded line (`is not a git command`, `unknown subcommand`); a leading word matching no
recorded key returns `unknown command "<x>" for "git" — re-run npm run capture:git`. A flag must match a recorded name exactly, with no abbreviation and no
bundling. An attached short value (`-S<x>`) is accepted only on a value-taking short flag. `--name=value` is accepted on any accepted long flag (D3's
named limit). A rejected flag returns
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
- **Three value kinds (none / required / optional) in the contract**: the validator consumes on `required` only (D3).
- **Recording the form the surface writes per flag** (proposal walk): would catch a post-capture `=value` on a no-value flag; descoped as a named limit, since no defect on record has that shape (D3).
- **A capture written in `.mjs` that reads `dist/`**: `dist/` carries no test helpers, and duplicating the extractor in the script would make two extractors again (D4).

## Risks / Trade-offs

- **D-rc05b-7's classification residual**: a git grammar error whose message the capture does not recognise would be
  recorded as accepted. The named limit and its method are stated in `orbit-cli-grammar`'s `Every \`git\` and \`gh\`
  snippet on the generated surface validates against its tool's recorded contract`.
- **[A probe runs git commands]** → each in its own fresh copy of a throwaway repository, with no remote, a failing
  editor, closed stdin, no user configuration and a timeout. A probe's mutation dies with its copy (D4).
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
