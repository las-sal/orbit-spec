## Why

rc05 made `orbit`'s snippets on the generated surface testable claims. It shipped a shared extractor, a guard and
CommonMark-located fences, and named `git` and the `gh` sweep's move as this stage's work (see explore.md, Premise).
Today `git` is the second most-cited tool and nothing checks it: the shared extractor, run unchanged, finds 119 `git`
snippets across 13 surfaces, 52 of them in review's choreography rather than the PR references (D-rc05b-1). `gh` has
a recorded contract (rc01), but its sweep still runs its own inline-only extractor over three references, so the six
`gh` snippets in SKILL.md bodies are never validated, and the repo carries two extractors.

The exploration found two things that block the obvious path. First, twelve `git` snippets chain with `&&` or pipe
into `| tail -1`, and the tokenizer passes the operator through as an argument, so any `git` validator would read
`git add <p> && git commit --only <p>` as `add --only` (D-rc05b-2). Second, `git` exposes no complete machine-readable
grammar. `-h` omits `log`'s revision options and has no option list for `rev-parse`, and the completion helper lists
long options only, without arity (D-rc05b-3). rc01's shape, one help page per command, would fail correct snippets on
about half the subcommands in use. A spike found that real git's own errors do separate an unknown flag, a missing
value and acceptance on 18 of the 19 subcommands in use, given a probe repository holding one commit. `rev-parse`
echoes any unknown flag with exit 0 (D-rc05b-4).

## What Changes

- The shared extractor splits a snippet at every unquoted shell control operator (`&&`, `||`, `|`, `|&`, `;`, `&`),
  and each segment is classified by its own first token. Redirections are dropped from the argv, and a subshell's `( … )` is
  stripped as grouping. An unquoted `$(`, backtick or `;;` fails extraction, naming the surface and line (D-rc05b-5). This narrows the places residual
  `orbit-cli-grammar` names for `orbit` too.
- `git` gets a RECORDED contract, `test/integration/cli-contracts/git-contract.json`, written by a deliberate capture
  (`npm run capture:git`) that PROBES real git in a throwaway repository. It probes every subcommand and flag the shared
  extractor finds on the surface, bare names included, and git's own errors decide every entry. A flag git rejects is
  recorded with git's message, and `rev-parse` carries a named orbit-side rule: recorded flags only (D-rc05b-7). One
  CommonJS validator reads the contract, and the suite never spawns `git`.
- `gh`'s sweep moves onto the shared extractor. rc01's `ghSnippets` and `snippetArgv` are retired, the six `gh`
  snippets in bodies are validated, and the `gh` contract, its validator and the harness stub are unchanged
  (D-rc05b-6).
- For `git` and `gh`, the bare-name tree is the contract's command keys: a span naming a recorded command with
  nothing after it is prose, and one naming an unrecorded command fails as unknown (D-rc05b-8).
- Exit (2)'s injections cover both tools at rc05's four extraction sites: an unknown flag, an unknown subcommand and
  a missing required argument, each failing with the surface and line.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-cli-grammar`: the snippet requirement's tool table, places table and tokenizer paragraph take the operator
  split and point `git` and `gh` at a new requirement. One ADDED requirement covers every `git` and `gh` snippet
  validating against its tool's recorded contract, `git`'s probe capture, and the contract-keyed bare-name rule
  (D-rc05b-5, D-rc05b-6, D-rc05b-7, D-rc05b-8).
- `orbit-pr-lifecycle`: `Test instruments derive from a recorded real-CLI contract` keeps the `gh` contract and the
  stub. Its fidelity-sweep sentence now points at `orbit-cli-grammar`'s requirement, which reads every generated
  surface through the shared extractor and the same validator (D-rc05b-6).

**Size: two capabilities**, under R-crc-1's ceiling: 1 ADDED and 2 MODIFIED requirements.

## Impact

- `test/helpers/surface-snippets.ts`: operator-aware tokenizing and per-segment classification; a contract-keyed
  command tree for recorded tools.
- New: `scripts/capture-git-contract.capture.ts` with its own vitest config (the capture reaches the TypeScript
  extractor through the test toolchain; there is no `tsx`), `test/integration/cli-contracts/git-contract.json`,
  `git-contract-validate.cjs`, and a `capture:git` npm script.
- `test/core/templates/orbit-content-fidelity.test.ts`: rc01's inline `gh` extractor retired; its negative fixtures
  move onto the shared extractor.
- `test/core/cli-grammar/`: a `git` and `gh` sweep beside `orbit`'s, and the injection matrix extended to both tools.
- No engine code and no adopter-visible change. Generated-surface text changes only where the capture records a surface
  flag rejected by real git (task 2.4). Every instrument is test-only.
