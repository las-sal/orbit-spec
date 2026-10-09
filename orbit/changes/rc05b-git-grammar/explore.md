> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc05b-git-grammar

## Premise
rc05 shipped the shared extractor (`test/helpers/surface-snippets.ts`), the guard and the CommonMark-located fences,
with `orbit` as their first consumer. This stage brings the other two tools on the generated surface onto them: `git`,
which has no in-repo program and so needs a RECORDED contract, and `gh`, whose rc01 sweep still runs its own
inline-only extractor over three references. The charter (clean-up-review-cycle.md, Stage rc05b-git-grammar) leaves
open whether `git`'s contract joins `orbit-cli-grammar` or sits beside `gh`'s in `orbit-pr-lifecycle`. Grammar only
(D-rc05-6): nothing is executed by the suite.

## Mechanism

### D-rc05b-5 — split at every unquoted shell control operator; each segment classified by its own first token
Domain: every shell construct on a snippet line that separates commands or attaches non-argv text, per POSIX's shell token grammar (XCU 2.10) plus bash's `|&`
| member | covered by |
|---|---|
| `&&` (six snippets today) | split; each segment a candidate snippet |
| `\|` (six today, all `\| tail -1`) | split; the `tail` segment is no contract's tool |
| `\|\|`, `;`, `&`, `\|&` (none today) | split, the same rule |
| an operator glued to a word (`a&&b`; none today) | split: the tokenizer recognizes operator characters unquoted, as the shell does |
| an operator inside quotes (`"&&"`; none today) | an argument: the tokenizer marks quotedness |
| `;;` (case syntax; none today) | fails extraction, naming the surface and line |
| a redirection (`>`, `>>`, `<`, `2>`, `2>&1`, `<<`; none today) | the operator and its target are dropped from the argv |
| `$(`, a backtick, or `(` unquoted (none today) | fails extraction, naming the surface and line |
| a newline inside a shell fence | already a line boundary (rc05); a quote spanning lines keeps rc05's join rule |
Closure: SOURCED — POSIX XCU 2.10's control and redirection operators, plus bash's `|&`; substitution and grouping are refused rather than parsed
Moves:
- READ: applied — the twelve operator snippets were read from the extractor's own output (D-rc05b-2); `orbit-cli-grammar`'s residual names `&&`, `|`, `;` and `$ `
- ENUMERATE: applied — this table, from the shell grammar's operator list rather than from the surface
- COHERE: applied — the guard reads lines, not segments; a tool word after an operator outside a fence remains the guard's residual, and the split narrows it only inside extracted text
- EXECUTE: not applied — nothing is built; the second probe confirmed today's surface carries only the first two rows
- FALSIFY: applied — a pipeline whose LATER segment is `git` (`… | git apply`) is now extracted; before, a `git` command after `|` was invisible
- CONFORM: applied — R-crc-14 (one tokenizer, stated once in `orbit-cli-grammar`), D-rc05-11 (extraction by shape; the contract decides)
- FEASIBILITY: not applied — one pass over each line's characters
- CONSUME: applied — every tool's sweep reads segments: `orbit`'s parser and both recorded validators receive one command per argv; rc05's `orbit` sweep must stay green
- INVOKE: applied — `npm test`, every build

### D-rc05b-7 — the `git` contract is captured by probing real git
Domain: every fact the validator needs about a `git` segment, and how the capture decides it
| member | covered by |
|---|---|
| a subcommand git knows | probe `git <sub> -h`: a usage page (exit 129) records it; `is not a git command` records it unknown |
| a two-level subcommand (`worktree add`, `worktree remove`) | keyed with its verb, as `gh`'s `pr view`; probed the same way |
| a subcommand written only as a bare name (`git init`) | in the candidate set: the capture reads bare segments too |
| a flag that takes no value | bare flag not a grammar error, and `<flag>=x` reports that it takes no value |
| a flag that requires a value (`-m`, `-c`, `-F`, `-S`, `--since`) | bare flag reports `requires a value` |
| a flag with an optional value (`--track`, `-u`) | bare flag accepted and `<flag>=x` not refused |
| a flag written `--name=value` on the surface (`--format=%h`) | recorded by the name before `=` |
| a numeric flag (`-1`) | recorded as the literal token git accepted |
| a flag git rejects | recorded rejected, with git's message; the sweep fails with it |
| a required positional | bare `git <sub>` (and `git <sub> <verb>`) reports a usage page |
| `--` | the validator treats every later token as positional |
| `rev-parse`, which accepts any flag | a named orbit-side rule: recorded flags only |
| a placeholder value or positional | passes, as in rc01's validator |
Closure: BOUNDED — the probe's verdict rests on classifying git's messages, a set git does not publish
Residual kind: a grammar error whose message matches none of the recorded shapes, classified as accepted — a false pass
Residual method: the capture also probes a deliberately bogus flag on every subcommand and requires it to classify as rejected; a subcommand where it does not either carries a named orbit-side rule (`rev-parse`) or fails the capture
Moves:
- READ: applied — the message shapes and the `rev-parse` exception were read from real git 2.50.1 (D-rc05b-4), and both value-arity forms from `-h` pages
- ENUMERATE: applied — this table, from the validator's needs (subcommand, flag, value kind, positional) crossed with the surface's forms
- COHERE: applied — the candidate set comes from the same extractor the sweep reads, so the contract cannot lack a segment the sweep checks except by a surface edit after capture, which fails as an unrecorded entry and asks for re-capture
- EXECUTE: applied — the spike ran unknown, missing-value and accepted probes on eleven subcommands and observed the shapes in the table
- FALSIFY: applied — a contract built from the surface's own flags cannot say a valid-but-unused flag is valid; that costs a re-capture when a body adopts one, the same cost a new `gh` verb pays today
- CONFORM: applied — rc01 (a recorded contract, one validator, deliberate re-capture, no real CLI in the suite), D-rc05-6 (grammar only: the probing runs at capture, never in the suite)
- FEASIBILITY: applied — the probes execute git in a throwaway repo holding one commit, so state cannot mask grammar; `LANG=C` fixes the messages, `GIT_EDITOR=false`, no stdin, no remote, an empty global config and a timeout keep a probe from waiting; how a capture script reaches the TypeScript extractor is the proposal's to settle
- CONSUME: applied — the validator and the injection tests of exit (2) read the contract; a missing-value injection needs the value kind, a missing-positional injection the positional flag
- INVOKE: applied — the capture on the author's command; the validator on `npm test`

### D-rc05b-8 — a recorded tool's bare-name tree is its contract's command keys
Domain: every inline span beginning `git ` or `gh `, by how its tokens meet the contract's keys
| member | covered by |
|---|---|
| tokens resolve to a key with nothing after (`git push`, `gh pr merge`) | prose, never parsed |
| tokens resolve to a key with more after | extracted and validated |
| the first token after the tool matches no key | extracted; fails as an unknown command |
| a two-level key's first word alone (`git worktree`) | prose: an interior node of the tree, as `orbit`'s tree treats a command group |
Closure: DERIVED — the tree is built from the contract's keys, and each span either walks to a node with nothing left, walks to a node with tokens left, or leaves the tree
Moves:
- READ: applied — rc01's `ghSnippets` applies this rule today; `isBareCommandName` in the shared extractor walks a `CommandNode` tree
- ENUMERATE: applied — this table, the three outcomes of walking a tree plus the interior-node case
- COHERE: applied — D-rc05b-7 records bare-only subcommands, so a bare name the surface uses is always a key
- EXECUTE: not applied — nothing is built
- FALSIFY: applied — a bare span of a real but unrecorded subcommand (prose naming `git rebase`) fails as unknown until re-capture, which D-rc05b-7's candidate set prevents for every span on the surface
- CONFORM: applied — D-rc05-18 (a bare name is prose), R-crc-14 (one bare-name rule, in the shared extractor)
- FEASIBILITY: not applied — a tree of tens of keys
- CONSUME: applied — the `gh` sweep's two bare body spans (`gh pr ready`, `gh pr merge`) stay prose, as rc01 decides today
- INVOKE: applied — `npm test`

## Decisions
- **2026-10-09 — D-rc05b-1: the shared extractor, run unchanged over today's surface, finds 119 `git` and 34 `gh` snippets, zero extraction failures and zero guard hits**
  Kind: fact
  Measured by a throwaway probe through `analyseSurfaces` with no command tree (so bare names are counted). `git`: 17
  fenced, 102 inline, across 13 surfaces; 52 sit in review's SKILL.md and its `passes-system`, `external-handoff`,
  `blind-pair` and `prompt-template` references, not in the PR references. Nineteen subcommands: `add` 20, `commit` 18,
  `push` 14, `switch` 13, `diff` 11, `log` 9, `rev-parse` 8, `symbolic-ref` 4, `init` 4, `ls-files` 3, `worktree` 3,
  `check-ref-format`, `merge-base`, `merge`, `status` 2 each, `branch`, `fetch`, `rev-list`, `show` 1 each. `gh`: 34,
  all inline; six in SKILL.md bodies (archive 2, onboard 1, architect 3), matching the charter, and 28 in the four
  references. The charter's 100 for `git` used a different count; 119 includes bare names.
- **2026-10-09 — D-rc05b-2: twelve inline `git` snippets carry a shell operator, which the tokenizer passes through as an argument**
  Kind: fact
  Six chain with `&&` (four `git add <emit-path> && git commit --only <emit-path> && git push …` in the two
  `pr-choreography.md` copies; `git fetch <resolved-remote> && git switch -c …` and `git add <paths> && git commit
  --only <paths>` in `pr-archive-tail.md`), and six pipe into `| tail -1` (review SKILL.md, `external-handoff.md`).
  Corrected the same day from "fourteen": a second probe tokenized every snippet of all three tools and found these
  twelve and no other operator — no `||`, `;`, `&`, redirect, `$(…)`, backtick or operator glued to a word, and none
  in an `orbit` or `gh` snippet. The extractor emits each as ONE argv headed by the
  first `git`, so a `git` validator would read `--only` as a flag of `add`: a false failure. `orbit-cli-grammar` names
  "mid-line after `&&`, `$ ` or `|`" as a residual of the places table; no `orbit` snippet needed the split.
- **2026-10-09 — D-rc05b-3: `git` exposes no single complete machine-readable grammar**
  Kind: fact
  Measured against git 2.50.1. `git <sub> -h` lists parse-options flags with short names and value arity, but omits
  `log`'s and `show`'s revision and diff options (`--format`, `--diff-filter`, `-S`, `--since`, `-1`), prints no
  option list for `rev-parse`, and only a synopsis for `worktree`. The hidden `git <sub> --git-completion-helper`
  lists LONG options only (no `-m`, `-c`, `-u`, `-A`, `-F`), no arity, the same omissions for `log`, nothing for
  `rev-parse` or `worktree remove`, and `check-ref-format` does not support it. rc01's shape — parse one help page per
  command — would fail correct snippets on about half the subcommands in use.
- **2026-10-09 — D-rc05b-4: real git, probed in a disposable repo, separates an unknown flag and a missing value from acceptance on every subcommand in use but one**
  Kind: fact
  Spike, git 2.50.1, a throwaway repo. Unknown flag: `error: unknown option` / `error: invalid option` (exit 129) on
  the parse-options builtins, `fatal: unrecognized argument:` (exit 128) on `log` and `show`, a usage page (129) on
  `rev-list` and `diff`. Missing value: `error: switch `m' requires a value` (129), `fatal: Option '--since' requires
  a value` (128). Two hazards: repository STATE masks grammar (in an empty repo `git log --bogusflag` reports "does not
  have any commits yet", so a probe repo needs a commit), and `git rev-parse` ACCEPTS an unknown flag, echoing it with
  exit 0, so git itself defines no unknown-flag rule for `rev-parse` — an injected unknown `rev-parse` flag can fail
  only by an orbit-side rule, the shape of rc01's two qualification rules for `gh`.
- **2026-10-09 — D-rc05b-5: the shared extractor splits a snippet at every unquoted shell control operator, and each segment is classified by its own first token**
  Sal: "will take your recs". The tokenizer marks an unquoted `&&`, `||`, `|`, `|&`, `;` or `&` as an operator, glued
  or spaced, as the shell does; a quoted one stays an argument. Each segment between operators is a candidate snippet
  whose first token decides its tool, so `git add <p> && git commit --only <p>` yields two `git` snippets and
  `git log … | tail -1` yields one `git` snippet and a `tail` segment no contract reads. A redirection operator and its
  target are dropped from the argv. An unquoted `$(`, backtick or `(` fails extraction, naming the surface and line.
  This edits the extractor rc05 shipped (the charter's "unchanged" is superseded) and MODIFIES `orbit-cli-grammar`'s
  places table, narrowing its residual for `orbit` as well.
- **2026-10-09 — D-rc05b-6: `git`'s contract and the move of the `gh` sweep are owned by `orbit-cli-grammar`; `orbit-pr-lifecycle` keeps the `gh` stub**
  Kind: scope
  Sal: "will take your recs". `orbit-cli-grammar`'s tool table already carries a `git` row ("not covered by this
  capability") and 52 of 119 `git` snippets sit outside the PR references (D-rc05b-1), so `git` is not a PR-lifecycle
  tool here. `orbit-pr-lifecycle`'s `Test instruments derive from a recorded real-CLI contract` keeps the recorded `gh`
  contract and the stub, and its sweep sentence moves to point at the shared extractor. Two capabilities, MODIFIED both,
  under R-crc-1's ceiling.
- **2026-10-09 — D-rc05b-7: `git`'s contract is recorded by a capture that PROBES real git, in a disposable repository, for every subcommand and flag the surface uses**
  Sal: "will take your recs" (option (b) of the source question; (a) and (c) are in Considered & out). The capture —
  the only code that runs a real `git`, a deliberate act like `npm run capture:gh` — takes its candidate set from the
  shared extractor's `git` segments (bare names included, so a subcommand written only as a name, `git init`, is
  recorded), probes each, and records per subcommand its flags with their value kind (none / required / optional) and
  whether a positional is required, each entry as git classified it, beside the git version. Git's own error decides
  every entry; a flag git rejects is recorded with git's message so the sweep fails with it. `rev-parse` accepts any
  flag (D-rc05b-4), so the contract carries a NAMED orbit-side rule for it — recorded flags only — as rc01's contract
  carries two for `gh`. One CommonJS validator reads the contract; the suite never spawns `git` for grammar.
- **2026-10-09 — D-rc05b-8: a recorded tool's bare-name tree is its contract's command keys**
  The shared extractor's bare-name rule takes a command tree; for `orbit` it is the program (rc05). For `git` and `gh`
  it is the contract's command keys, split on spaces into a tree — the rule rc01's `ghSnippets` already applies, moved
  into the shared extractor. A span whose tokens all resolve to keys with nothing after is prose; a span naming an
  unrecorded subcommand is extracted and fails as unknown, so an invented verb cannot pass as prose.

## Open questions

## Considered & out
- **`git`'s contract from `-h` plus a declared supplement** (2026-10-09) — the supplement for `log`, `show` and `rev-parse` is a remembered grammar beside a captured one, rc01's anti-pattern on half the commands; out for D-rc05b-7.
- **`git`'s contract from `contrib/completion/git-completion.bash`** (2026-10-09) — a hand-maintained copy inside git's own tree, and a third copy here; out for D-rc05b-7.
- **Splitting operators in a `git`-only pre-pass, leaving rc05's extractor unchanged** (2026-10-09) — two places that tokenize one snippet, and `orbit`'s residual left open; out for D-rc05b-5.
- **`git`'s contract beside `gh`'s in `orbit-pr-lifecycle`** (2026-10-09) — most `git` snippets are review choreography, not PR lifecycle; out for D-rc05b-6.

## References
- `orbit/changes/archive/2026-10-08-rc05-executable-references/explore.md` — D-rc05-6 (grammar only), D-rc05-11/13 (places, fences), D-rc05-15 (this split)
- `orbit/specs/orbit-cli-grammar/spec.md` — the tool table and the places residual
- `orbit/specs/orbit-pr-lifecycle/spec.md` — `Test instruments derive from a recorded real-CLI contract`
- `test/helpers/surface-snippets.ts`, `test/helpers/orbit-sweep.ts` — the shared extractor and its `orbit` consumer
- `test/core/templates/orbit-content-fidelity.test.ts` (`ghSnippets`, `snippetArgv`) — rc01's inline extractor, to retire
- `test/integration/pr-lifecycle/gh-contract{.json,-validate.cjs,.test.ts}`, `scripts/capture-gh-contract.mjs` — rc01's contract shape
