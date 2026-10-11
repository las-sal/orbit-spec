> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc09b-tool-inventory

## Premise
rc09b's charter (declared 2026-10-10 from rc09's split, D-rc09-13): an inventory test over the generated surface, so
that capturing a recorded contract becomes the price of a new tool — the external-tool spike made permanent. Its
starting record is D-rc09-12 and its Mechanism entry, in the archived rc09a exploration. Exit (2), as revised under
R-crc-12's first case: a new command head on the generated surface fails the suite, naming surface and line, until a
contract or a declared exemption covers it. Owner: `orbit-cli-grammar`.

Re-measuring D-rc09-12's Case 3 on 2026-10-11 FALSIFIED its domain against the stage's own purpose (Case 1): every one of
the surface's 34 `gh` invocations is an inline code span, none is in a shell fence — so the charter's fence-only
inventory would have passed the very tool (D6's `gh`) that motivated it. What D-rc09-12 named as a residual corner is
the surface's main channel of invocation.

## Mechanism
### D-rc09b-1 — the inventory reads shell fences and FLAGGED inline segments; an unnamed head fails the suite
Domain: every word that can head a command segment the inventory reads on the generated surface
| member | covered by |
|---|---|
| a segment head in a `bash`/`sh`/`shell` fence, top-level | read; must be named by a contract, the declared utility list, or the placeholder list |
| a segment head in a shell fence nested in a `markdown`/`md` fence | read, exactly as the extractor's `walkText` recurses |
| a single-backtick inline span segment whose head (after any assignment prefix) is a lowercase bare word and which carries a flag token (`-` or `--` then a letter or digit) | read; must be named, or be on the declared prose-head list |
| an inline segment with no flag token | not read — the residual |
| an inline segment whose head is not a lowercase bare word (path-prefixed, `/orbit:` slash command, capitalised prose) | not read — the residual |
| a tool with a recorded contract (`orbit`'s program; `git-contract.json`; `gh-contract.json`) | passes; its own sweep checks the grammar |
| a declared utility or builtin (`mv`, `mkdir`, `grep`, `rm`, `rmdir`, `head`, `tail`, `cd`, `[`, `command`, `sh`, `node` on today's surface) | passes |
| a declared placeholder (`<argv[0]>`, the runner record) | passes |
| a declared prose head — a message template carrying a flag (`unknown`, `argument`, `skipped`, `reach` today) | passes |
| an assignment prefix (`VAR=value cmd`) | skipped; the next word is the head |
| a subshell or group | stripped by rc05b's tokenizer; each inner segment's head is read |
| a refused or unterminated fence line | rc05b's extraction failure already fails it |
| an inline span the tokenizer refuses or leaves open (17 today) | not read — the residual; a recorded tool's span already fails in rc05's extractor |
| a comment or blank fence line | not read |
| a `json` or untagged fence | not read |
| any other head | fails, naming surface and line |
Closure: BOUNDED — the fence and inline-segment kinds are SOURCED by rc05b's extractor and markdown-it's token types; the PURPOSE (no tool reaches the surface unrecorded) is not, because the flag discriminator is a heuristic over prose
Residual kind: a tool whose every inline invocation carries no flag token, is path-prefixed, or sits in a span the tokenizer refuses; or one invoked only in prose, in a double-backtick span, or in a `json` or untagged fence
Residual method: an independent review reading a new surface's inline spans; rc05's guard already fails a recorded tool's flagged line outside a fence
Moves:
- READ: applied — `tokenize`, `walkText`, `extractInline` and `generatedSurfaces` in `test/helpers/surface-snippets.ts`, read 2026-10-11; the markdown-fence recursion corrects D-rc09-12's "non-shell fence not read" row
- ENUMERATE: applied — this table, from Case 1's measured heads plus the extractor's fence and inline kinds
- COHERE: applied — the refused-line rows defer to rc05b's existing failure rather than adding a second one
- EXECUTE: applied — Case 2: the exact rule run over today's surface; every head falls in a passing row once twelve utilities, one placeholder and four prose heads are declared; 17 inline spans are refused and not read
- FALSIFY: applied — Case 1 falsified the fence-only domain (`gh` is 100% inline); the flag rule still passes a tool written inline only without flags, which is the stated residual
- CONFORM: applied — R-crc-10 (heads are tokens of a generated file, never prose intent); R-crc-12 (exit (2) as revised is still measurable); R-crc-14 (the declared lists stated once — see the open question)
- FEASIBILITY: not applied — one pass over 36 surfaces
- CONSUME: applied — the suite; a failure names surface and line, as rc05b's matrix does
- INVOKE: applied — `npm test`, on every change

### Case 2 — the exact rule over today's surface (2026-10-11, at propose)
A throwaway probe ran the rule as the Domain table states it (segments, assignment prefix skipped, flag token
`^--?[A-Za-z0-9]`, lowercase bare head `^[a-z][a-z0-9._-]*$`). Fence heads: orbit 48 lines, git 16 (2 nested), mv 4,
mkdir 2, `[` 2, grep, rm, rmdir, cd, `<argv[0]>` 1 each. Flagged inline heads: orbit 62, git 48, gh 15, command 4, tail 6
(a pipeline fragment after `git log`), grep 2, head 2, node 1, sh 1, and the four prose heads. Not read: 17 inline spans
the tokenizer refuses, 38 flagged segments with a non-bare head (21 `/orbit:review`, other slash commands, capitalised
prose). The digit in the flag token admits `head -1`, which Case 1's letter-only rule missed.

### Case 1 — command heads on today's surface, fences and inline (2026-10-11)
Throwaway vitest probes over `generatedSurfaces()` (36 surfaces), markdown-it, rc05b's `tokenize`; deleted after the run.
Shell-fence heads (lines / surfaces): orbit 48/15, git 14/2 plus 2 lines in a bash fence nested in a markdown fence, mv
4/3, mkdir 2/2, `[` 2/1, grep, rm, rmdir, cd, `<argv[0]>` 1/1 each; `gh` 0. Inline multi-word spans with a lowercase head:
about 50 distinct heads — orbit 121 spans/29 surfaces, git 102/12, gh 34/7, and about 35 prose heads (`no baseline…`,
`line N`, `pr list` as a `gh` fragment). Restricting inline segments to those carrying a flag token leaves seven tool heads
(orbit, gh, git, node, sh, grep, command) and four prose heads, all message templates: `unknown flag: --repo`, `argument
required when using the --repo flag`, `skipped per --fast`, `reach by --from-file <path>`.

## Decisions
- **2026-10-11 — D-rc09b-1: the inventory reads shell fences (nested included) and every inline segment carrying a flag token; a head no contract or declared list names FAILS the suite** (Sal: fences + flagged inline)
  Supersedes D-rc09-12's fence-only domain (archived rc09a exploration), which Case 1 falsified against the stage's own
  purpose. Chosen over all multi-word inline spans (about 35 prose heads to declare, every new code-formatted phrase a
  suite failure) and over fence-only as chartered (gh, node, sh and `command -v` invisible).
  Kind: rule
- **2026-10-11 — D-rc09b-2: every `gh` invocation on the generated surface is an inline code span** Measured in Case 1:
  34 spans on 7 surfaces, zero shell-fence lines.
  Kind: fact

- **2026-10-11 — D-rc09b-3: the declared lists (utilities and builtins, placeholders, prose heads) are a fenced table in `orbit-cli-grammar`'s owning requirement, read by the test** (Sal: resolved at propose, Q-rc09b-1)
  The spec owns the list once (R-crc-14), the way `test/core/canonical-examples.test.ts` reads its examples from
  `orbit-conventions`.
  Kind: scope
- **2026-10-11 — D-rc09b-4: `node`, `sh` and `command` are declared utilities, not recorded contracts** (Sal: resolved at propose, Q-rc09b-2)
  `node` is the runtime orbit already requires; `sh` and `command` are POSIX. A contract is the price for a tool the
  surface drives, not for the shell's own furniture.
  Kind: scope
## Open questions

## Considered & out
- **2026-10-11 — the charter's fence-only domain (D-rc09-12).** Case 1: it passes every `gh` invocation unrecorded, the
  tool whose unrun prose motivated rc09 — D-rc09b-1.
- **2026-10-11 — every multi-word inline span with a lowercase head.** About 35 prose heads to declare today, and any new
  code-formatted phrase fails the suite until declared — noise out of proportion to the four the flag rule needs — D-rc09b-1.
- **2026-10-11 — moving every inline invocation into a shell fence.** Rewrites some 250 inline spans against the body-economy work, to make the domain fit the tool — D-rc09b-1.

## References
- `orbit/changes/archive/2026-10-11-rc09a-size-record/explore.md` — D-rc09-12, its Mechanism entry and Case 3 (the starting record); D-rc09-13 (the split)
- `orbit/architecture/clean-up-review-cycle.md` — Stage rc09-propose-hygiene (the charter and its split paragraph), Stage rc09b-tool-inventory; R-crc-10, R-crc-12, R-crc-14
- `test/helpers/surface-snippets.ts` — `generatedSurfaces`, `tokenize`, `walkText`, `extractInline`, `SHELL_INFO`, `MARKDOWN_INFO`
- `test/integration/cli-contracts/git-contract.json`, `test/integration/pr-lifecycle/gh-contract.json` — the two recorded contracts
- `orbit/specs/orbit-cli-grammar/spec.md` — the owning capability
