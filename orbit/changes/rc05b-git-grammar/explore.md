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
| a `(` opening a segment and its matching `)` (one today: the runner launch's subshell, `external-handoff.md`) | grouping, stripped; the commands inside are segments (D-rc05b-12) |
| `$(` or a backtick unquoted (none today on any shell-fence line or tool-headed span, measured at the proposal walk) | fails extraction, naming the surface and line |
| an inline span beginning with a word other than the tool | not read: rc05's gate is kept, and a tool command after an operator there is in the places residual (D-rc05b-12) |
| a newline inside a shell fence | already a line boundary (rc05); a quote spanning lines keeps rc05's join rule |
Closure: SOURCED — POSIX XCU 2.10's control and redirection operators, plus bash's `|&`; grouping is stripped, substitution refused rather than parsed
Moves:
- READ: applied — the twelve operator snippets were read from the extractor's own output (D-rc05b-2); `orbit-cli-grammar`'s residual names `&&`, `|`, `;` and `$ `
- ENUMERATE: applied — this table, from the shell grammar's operator list rather than from the surface
- COHERE: applied — the guard reads lines, not segments; a tool word after an operator outside a fence remains the guard's residual, and the split narrows it only inside extracted text
- EXECUTE: not applied — nothing is built; the second probe confirmed today's surface carries only the first two rows
- FALSIFY: applied — a pipeline whose LATER segment is `git` (`… | git apply`) is now extracted on a shell-fence line or in a span beginning with the tool; before, a `git` command after `|` was invisible. The proposal walk's fresh pass found the first version of the `(` row would have failed a real line (`external-handoff.md:151`), because the "none today" measure had read only the three tools' snippets
- CONFORM: applied — R-crc-14 (one tokenizer, stated once in `orbit-cli-grammar`), D-rc05-11 (extraction by shape; the contract decides)
- FEASIBILITY: not applied — one pass over each line's characters
- CONSUME: applied — every tool's sweep reads segments: `orbit`'s parser and both recorded validators receive one command per argv; rc05's `orbit` sweep must stay green
- INVOKE: applied — `npm test`, every build

### D-rc05b-7 — the `git` contract is captured by probing real git
Domain: every fact the validator needs about a `git` segment, and how the capture decides it (revised at re-exploration, D-rc05b-11)
| member | covered by |
|---|---|
| every probe | runs in its OWN fresh copy of a template repository (one commit, branch `main`), so no probe sees another's effects (D-rc05b-10) |
| a command group | `git <a> orbitcapturebogusverb` reports `unknown subcommand` (`worktree` today) |
| a command key | a group's key is two words, its second the segment's verb; every other key is one word |
| a key git knows | `git <key> -h`: a first line beginning `usage:` records it known; `is not a git command` or `unknown subcommand` records it unknown, with that line |
| a subcommand written only as a bare name (`git init`) | in the candidate set: the capture reads bare segments too |
| the command's class | `git <key> --orbit-capture-bogus -h` rejected → PARSE-OPTIONS; else `git <key> --orbit-capture-bogus HEAD` rejected or a usage page → RUN; else a named orbit-side rule, or the capture fails naming the key |
| whether a flag takes a value | `git <key> <name>` with nothing after: `requires a value` records it value-taking |
| a flag's acceptance, PARSE-OPTIONS class | `git <key> <flag as written> [x when value-taking] -h`: a usage page records it accepted; a rejection shape records it rejected with git's line; any other line fails the capture naming the probe |
| a flag's acceptance, RUN class | `git <key> <flag as written> [x when value-taking] HEAD`: a rejection shape or a usage page records it rejected with git's line; anything else records it accepted |
| a flag written `--name=value` on the surface | probed as written (`--name=x`), recorded by the name before `=` |
| value arity on a flag git does not report as `requires a value` (`check-ref-format --branch`) | recorded not value-taking: its value reads as a positional, so a missing value on it is not caught |
| a required positional | `git <key>` alone: a first line beginning `usage:` records one required |
| `--` | the validator treats every later token as positional |
| `rev-parse`, which echoes any flag with exit 0 under both bogus probes | the named orbit-side rule: recorded flags only, each recorded as written, unprobed |
| a placeholder value or positional | passes, as in rc01's validator |
Closure: BOUNDED — the probe's verdict rests on classifying git's messages, a set git does not publish
Residual kind: a grammar error whose message matches none of the recorded shapes, classified as accepted — a false pass
Residual method: the capture also probes a deliberately bogus flag on every subcommand and requires it to classify as rejected; a subcommand where it does not either carries a named orbit-side rule (`rev-parse`) or fails the capture
Moves:
- READ: applied — every row's outcome was read from real git 2.50.1 in the re-exploration's matrix (Case 1); the rejection shapes are `error: unknown option`, `error: invalid option`, `error: unknown switch`, `fatal: unrecognized argument:` and `error: option ... takes no value`
- ENUMERATE: applied — this table, from the validator's needs (key, class, flag, value kind, positional) crossed with the probe forms the proposal pair found missing (F1: value-taking under `-h`; F2: commands needing a positional; F4: key arity)
- COHERE: applied — a usage page means ACCEPTED in the PARSE-OPTIONS class (`-h` was reached) and REJECTED in the RUN class (`HEAD` satisfies the positional), and the class is decided first, by the same bogus flag the residual method uses, so the two readings never meet one command
- EXECUTE: applied — the prototype ran this table over all 129 `git` segments (146 probes, each in a fresh copy): 21 keys, 37 flags, every surface flag recorded accepted (Case 2); over ten invented defects it rejected each with git's line (Case 3)
- FALSIFY: applied — a contract built from the surface's own flags cannot say a valid-but-unused flag is valid; that costs a re-capture when a body adopts one, the same cost a new `gh` verb pays today; and git rejects `log --format HEAD` while accepting `log --format=%h HEAD`, so a flag is probed only in the form the surface writes
- CONFORM: applied — rc01 (a recorded contract, one validator, deliberate re-capture, no real CLI in the suite), D-rc05-6 (grammar only: the probing runs at capture, never in the suite), R-crc-6 (this revision came from the walk's redesign route, not from the walk)
- FEASIBILITY: applied — 146 probes, each copying a one-file repository, ran in seconds; `LANG=C`, `GIT_EDITOR=false`, closed stdin, no remote, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1` and a 10-second timeout keep a probe from waiting or reading the user's config
- CONSUME: applied — the validator reads `known`, `positional_required`, and per flag `takes_value` and `accepted`; exit (2)'s missing-argument injection for `git` has six `positional_required` keys to draw on (Case 2)
- INVOKE: applied — the capture on the author's command; the validator on `npm test`

### Case 1 — the probe matrix, real git 2.50.1
The first matrix ran every probe form against one shared repository. `switch -c x HEAD` switched its branch and `init orbitbogusverb` created a nested repository, so later probes read a different state. The second ran each probe in a fresh copy. Readings: `git commit -m -h` runs the commit (`-h` taken as the message); `git commit -m x -h` prints usage. `git rev-list --count` and `--orbit-capture-bogus` both print usage with no positional; with `HEAD`, `--count` exits 0 and the bogus flag still prints usage. `git check-ref-format --branch HEAD` fails on the name (exit 128), and the bogus flag with `HEAD` prints usage. `git worktree orbitbogusverb` reports `unknown subcommand`; `git push origin -h`, `git diff main -h` and `git switch main -h` print each command's own usage. `git rev-parse --orbit-bogus HEAD` echoes the flag, exit 0.

### Case 2 — the prototype over today's surface
Classes: PARSE-OPTIONS for 16 keys; RUN for `log`, `show`, `rev-list` and `check-ref-format`; the rule for `rev-parse`. `positional_required` for `symbolic-ref`, `check-ref-format`, `merge-base`, `rev-list`, `worktree add` and `worktree remove`. Value-taking: `switch -c`, `commit -m`, `commit -F`, `log -S`. All 37 flags accepted.

### Case 3 — the prototype rejects
`commit --frobnicate` (unknown option), `log --frobnicate` and `show --nope` (unrecognized argument), `rev-list --frobnicate HEAD` and `check-ref-format --frob x` (usage page, RUN class), `status --short=x` (takes no value), `switch --orbit-x`, `diff --bogus-diff` (invalid option), `worktree frobverb` (unknown subcommand), and `frobnicate` (not a git command): each recorded rejected or unknown, with git's line.

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
- **2026-10-09 — D-rc05b-9: the proposal pair refuted two rows of D-rc05b-7's first probe table and found a third question it left open**
  Kind: fact
  Re-entered from the proposal walk's REDESIGN route (address-reviews-2026-10-09T16-28-05Z, entries F1, F2, F4). The `-h` row
  cannot classify a value-taking flag, because the flag consumes `-h` and the command runs; the run row read a usage page
  as rejection on commands that print usage for a missing positional (`rev-list --count`, `check-ref-format --branch`);
  and nothing decided command-key arity. All three reproduced here (Case 1).
- **2026-10-09 — D-rc05b-10: probes mutate the repository they run in**
  Kind: fact
  `switch -c x HEAD` switches the branch and `init <word>` creates a nested repository, so a shared probe repository
  makes a probe's reading depend on the probes before it (Case 1). Every probe runs in a fresh copy.
- **2026-10-09 — D-rc05b-11: D-rc05b-7's probe table is revised: commands are classed first by a bogus flag, a value-taking flag is probed with a stand-in value, the RUN class supplies `HEAD` as its positional, and a group's verb is found by a bogus verb**
  Kind: fact
  The rule D-rc05b-7 states stands; its Mechanism entry is rewritten in place to the table the prototype executed
  (Cases 2 and 3). This entry records the revision so the change's artifacts can be repaired against it.
- **2026-10-09 — D-rc05b-12: Sal's rulings at the proposal walk: subshell grouping stripped, the inline gate kept, the `=value` promise descoped**
  Kind: scope
  Sal: "a" on F5, F6 and F3. A `(` opening a segment and its `)` are grouping, stripped (D-rc05b-5's table). An inline span is
  read only when it begins with the tool, and the rest is in the places residual. The validator accepts `--name=value` on any
  accepted long flag, so an `=value` written after capture on a flag that takes none is a named limit, not a check.

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
