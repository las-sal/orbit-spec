> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: docs-under-test

## Premise

Stage `docs-under-test` of `update-gh-documentation` (goal G4): put `README.md` and `docs/*.md` under machine checks
BEFORE the rewrite stages run, so the rewrite is graded by a machine rather than by review. The stage charter asks
for the existing sweeps extended to the docs, an old-name residue check applying R-ugd-1, and a recorded account of
today's failures that the later stages empty.

Probed 2026-10-12 (a throwaway test feeding README plus the eleven `docs/` pages to the shipped helpers as surfaces;
deleted after the run):

| check | generated surface | README + docs/ today |
|---|---|---|
| `orbit` grammar sweep (rc05) | 130 snippets parsed | 0 snippets — vacuous |
| `git` / `gh` recorded-contract sweep (rc05b) | 120 snippets | 0 snippets — vacuous |
| tool inventory (rc09b) | every head recorded or declared | unknown heads: `openspec` ×108, `npm` ×4, `cd` ×2, `nix` ×2, `pnpm`, `yarn`, `bun`, `node`, and continuation flags `--description` ×2, `--artifacts` ×2, `--default` ×2, `--body`, plus `schema:` |
| escaped-backtick check | 0 | 0 |

What the probe shows:

- The two parse sweeps PASS VACUOUSLY on today's docs: the docs invoke `openspec`, which neither sweep extracts. A
  check bolted on as-is reports green over the wrong instructions, so each shipped check needs a non-vacuity floor
  that only rewritten docs can meet.
- The tool inventory already catches COMMAND-form residue (every `openspec` line is an unknown head). It cannot see
  residue in prose and links (`/opsx:` slash commands, `@fission-ai/openspec`, upstream's Discord and badge URLs,
  "OpenSpec" in sentences); that needs a new text-level check.
- The docs write commands across lines with a trailing `\`, and the inventory reads each continuation line as its
  own head (by its spec's rule: write the command on one line, never declare the flag).

## Mechanism

### D-dut-1 — the residue check admits the old name in four places and nowhere else
Domain: every case-insensitive occurrence of `openspec`, `opsx` or `fission` in `README.md` and `docs/*.md`
| member | covered by |
|---|---|
| anything under the README heading `Built on OpenSpec` | admitted (1), the attribution |
| anything under the README heading `How orbit improves on OpenSpec` | admitted (1), the comparison |
| any occurrence in `docs/migration-guide.md` | admitted (2), file-scoped |
| the identifier `.openspec.yaml` anywhere | admitted (3) |
| a global directory the tool writes anywhere: `~/.config/openspec`, `~/.local/share/openspec`, `$XDG_CONFIG_HOME/openspec`, `$XDG_DATA_HOME/openspec`, `%APPDATA%/openspec`, `%LOCALAPPDATA%/openspec` | admitted (4) |
| `openspec` as a command (any fence or span) | residue; the tool inventory also reports its head |
| a `/opsx:` slash command | residue |
| `@fission-ai/openspec`, a Fission-AI URL, upstream's Discord or badges | residue |
| "OpenSpec" or `openspec` in any other prose, path or link | residue |
Closure: BOUNDED — the three patterns cover upstream's names as measured; an upstream name form none of them matches is not ruled out
Residual kind: an upstream name or link form that contains none of `openspec`, `opsx` or `fission` (a renamed product, a shortened URL, a logo asset path)
Residual method: a case-insensitive grep of upstream's v1.3.1 README and docs (the `upstream/v1.3.1` tag) for its product, org and link names, compared against the three patterns, plus the public-readiness stage's sweep of upstream assets and links
Moves:
- READ: applied — `GLOBAL_CONFIG_DIR_NAME` and `GLOBAL_DATA_DIR_NAME`, both `'openspec'` (`src/core/global-config.ts:6,8`), with their XDG and Windows forms in the same file; every change carries `.openspec.yaml`; the legacy paths orbit detects are `src/core/legacy-cleanup.ts:34-40`
- ENUMERATE: applied — this table; every occurrence lands in exactly one row
- COHERE: applied — the migration guide's legacy commands would fail the tool inventory as unknown heads; they belong in an untagged or `text` fence, which the inventory does not read (its read table's data-fence row), so the two checks agree
- EXECUTE: applied — run by hand over today's docs, 2026-10-12: 685 residue, 121 admitted in the migration guide, 5 admitted as on-disk identifiers; all 68 README occurrences are residue, as they must be while neither admitted heading exists
- FALSIFY: applied — residue inside an admitted place passes (an upstream install line pasted into the comparison section, or the migration guide telling a NEW user to run `openspec`); the check cannot judge intent, so that is a named limit review owns
- CONFORM: applied — R-ugd-1 (this is its mechanism), R-crc-10 (text and headings are observable; intent is not, hence the limit), R-crc-14 (the rule is stated once, in the owning capability's spec)
- FEASIBILITY: not applied — one regex pass over about 170 KB
- CONSUME: applied — the pending-rewrite list consumes the per-file result, and landing-page's exit (1) reads the README's
- INVOKE: applied — runs in `npm test` with the other surface sweeps

### D-dut-2 — the checks gate docs file by file, through a pending-rewrite list exact both ways
Domain: every file `README.md` and `docs/*.md` (non-recursive; `docs/` holds no subdirectories), crossed with list state and check result
| member | covered by |
|---|---|
| listed, fails at least one check | skipped: owed to its rewrite stage |
| listed, passes every check | the suite FAILS naming the file: remove it from the list |
| unlisted, passes every check | passes |
| unlisted, fails a check | the suite FAILS naming file, line and check |
| a listed path that names no file | the suite FAILS naming the stale entry |
| a docs file added later, unlisted | held to every check from its first commit |
Closure: DERIVED — two list states times two check results over a file set the glob defines, plus the stale-entry row
Moves:
- READ: applied — the rewrite stages' exits in `update-gh-documentation.md` say "passes docs-under-test's checks with no recorded exception", which unlisted means here
- ENUMERATE: applied — this table
- COHERE: applied — D-dut-1's admitted places are applied BEFORE a file is judged passing, so the migration guide's admitted mentions never make it a failing file
- EXECUTE: applied — today all twelve files fail at least one check (eleven carry residue; the migration guide, whose residue is all admitted, carries 9 `openspec` heads in shell fences), so listing all twelve is exact on day one
- FALSIFY: applied — a listed file can be made worse unnoticed; accepted by D-dut-3, since every listed file is scheduled for a full rewrite
- CONFORM: applied — rc09b's exactness both ways (an exemption leaves with its last use), R-crc-13 (the check reports and fails the suite; it gates no lifecycle step), D-dut-3
- FEASIBILITY: not applied — twelve entries
- CONSUME: applied — landing-page, reference-docs and concept-docs each finish by removing their files; when the list is empty the non-vacuity floors (the open question on non-vacuity floors) become meetable
- INVOKE: applied — runs in `npm test`; the list shrinks only by a rewrite stage's own edit

### D-dut-4 — the tool inventory judges each surface against its own declared set
Domain: every command head the inventory reads, by the surface it sits on and where it is legal
| member | covered by |
|---|---|
| a recorded tool (`orbit`, `git`, `gh`) on either surface | legal on both, derived from the contracts as today |
| a head on the generated surface declared in the generated fence | legal |
| a head in the docs declared in the docs fence | legal |
| a head on the generated surface declared only in the docs fence | FAILS, naming surface, line and head |
| a head in the docs declared only in the generated fence | FAILS, naming file, line and head |
| a head in neither fence and not recorded | FAILS on either surface |
| a declared head no line of its own surface uses | FAILS, naming the head and its fence |
Closure: DERIVED — two surfaces times four legality sources (recorded, own fence, other fence, none), plus each fence's unused-entry row
Moves:
- READ: applied — `orbit-cli-grammar`'s inventory requirement holds one `inventory` fence, exact both ways ("an exemption leaves with the last line that used it"), and derives the recorded tools from the contracts
- ENUMERATE: applied — this table
- COHERE: applied — the recorded tools are derived once and shared, so only the declared sets split; D-dut-2's listed files are skipped before their heads are judged, so the docs fence is exact only over unlisted files
- EXECUTE: applied — on today's tree the generated surface is unchanged (it reads its own fence as before), and every docs file is listed, so the docs fence starts EMPTY and gains a head only when a rewritten file first uses one (R-ugd-4's `npm` is the expected first)
- FALSIFY: applied — a tool both surfaces use is declared twice, once per fence; duplication accepted as the price of exactness
- CONFORM: applied — rc09b (exact both ways), R-crc-14 (each fence stated once, in its owner: the generated one in `orbit-cli-grammar`, the docs one in `orbit-user-docs` by D-dut-5)
- FEASIBILITY: not applied — two small fences
- CONSUME: applied — the inventory test reads both fences and judges each surface against its own
- INVOKE: applied — runs in `npm test` beside the existing inventory

### D-dut-6 — commands in the docs are written on one line
Domain: every command line the docs checks read in a shell fence of `README.md` or `docs/*.md`
| member | covered by |
|---|---|
| a command on one line | read whole by every sweep |
| a command continued with a trailing `\` | each continuation line read as its own head, so a flag-led line fails as an unknown head; written as one line instead |
| today's three continued commands (`docs/cli.md` 722 and 960, `docs/customization.md` 143) | in listed files; rewritten as one-liners by reference-docs and concept-docs |
| a command in an untagged or `text` fence (D-dut-1's migration-guide legacy commands) | not read by the inventory or the sweeps |
Closure: SOURCED — `orbit-cli-grammar`'s inventory read table defines how a continuation and a data fence are read; the grep for a trailing `\` over README and docs (2026-10-12) supplies today's members
Moves:
- READ: applied — the inventory read table's continuation row ("write the command on one line, never declare the flag") and its data-fence row
- ENUMERATE: applied — this table
- COHERE: applied — D-dut-1's guidance puts legacy commands in data fences, which this rule's last row leaves unread, so the two never ask for opposite things
- EXECUTE: applied — the probe read `--description`, `--artifacts`, `--default` and `--body` as heads, exactly the continuation lines the grep found
- FALSIFY: applied — a long command on one line is harder to read in rendered docs; accepted, the generated surface lives with the same rule
- CONFORM: applied — `orbit-cli-grammar`'s inventory rule, unchanged (D-dut-5: that capability widens its domain and changes no rule)
- FEASIBILITY: not applied — three commands
- CONSUME: applied — reference-docs and concept-docs rewrite the three; the inventory reads the result
- INVOKE: applied — the inventory runs in `npm test`; a continuation in an unlisted file fails there
### D-dut-7 — the docs sweeps carry non-vacuity floors over unlisted files, active once the list is empty
Domain: every check run over the docs, and whether it needs a floor to mean something
| member | covered by |
|---|---|
| the `orbit` grammar sweep | a floor over unlisted files, active once D-dut-2's list is empty |
| the `git` recorded-contract sweep | the same |
| the `gh` recorded-contract sweep | the same |
| the tool inventory | no floor of its own: once the list is empty its heads include `orbit`, which the `orbit` sweep's floor already proves read |
| the residue check (D-dut-1) | no floor: it fails on presence, and finding nothing is its success |
Closure: SOURCED — the checks are the four D-dut-5 assigns plus the residue check, the whole set this stage ships
Moves:
- READ: applied — the probe's 0 snippets for both parse sweeps on today's docs; rc09b's floor note in `tool-inventory.test.ts` (a floor never pins what an exactness rule lets leave)
- ENUMERATE: applied — this table
- COHERE: applied — a floor counted over listed files would pin files D-dut-2 exempts; counting unlisted files only, and only once the list is empty, keeps the two from contradicting
- EXECUTE: not applied — no file is unlisted yet, so every floor is inactive on day one by construction; its values are measured by the edit that empties the list
- FALSIFY: applied — while any file is listed a sweep can still pass vacuously; accepted by D-dut-3, since the program is validated at its end
- CONFORM: applied — rc05 and rc05b's floors (non-vacuity, never pins), rc09b's lesson, D-dut-3
- FEASIBILITY: not applied — one count per sweep
- CONSUME: applied — the edit that empties the list reads the rewritten docs' counts and sets each floor below them; an empty list with an unset floor fails
- INVOKE: applied — the floors run in `npm test`; they bite only once the list is empty

## Decisions

- **2026-10-12 — D-dut-1: the residue check admits the old name in four places and nowhere else** (Sal). Across
  `README.md` and `docs/*.md`, every case-insensitive occurrence of `openspec`, `opsx` or `fission` is RESIDUE unless
  it sits in one of four admitted places: (1) the README sections headed `Built on OpenSpec` (the attribution) and
  `How orbit improves on OpenSpec` (the comparison); (2) anywhere in `docs/migration-guide.md`, which describes what
  an adopter arriving from OpenSpec has; (3) inside the identifier `.openspec.yaml`; (4) inside the identifier
  `~/.config/openspec`. The last two are names the tool still writes on disk (R-ugd-3 keeps the code scrub out), so a
  doc that renamed them would be wrong. Section-scoped for the README, file-scoped for the guide: an author never has
  to think about scope outside the README, and "OpenSpec" written anywhere else is a mistake the check catches.
  Resolves the open question on how R-ugd-1's admitted mentions become machine-checkable (options were a phrase
  allowlist, marked spans, or declared headings). Widened 2026-10-12 at the proposal walk (Sal: F1 A): place (4) is
  every global directory the tool writes — the configuration and the data directory (`~/.local/share/openspec`), each
  in its XDG and Windows forms — since the same reason admits them all.
  Kind: rule
- **2026-10-12 — D-dut-2: the checks gate docs file by file, through a pending-rewrite list exact both ways** (Sal).
  The checks ship running in `npm test` while today's docs fail them (about 800 findings), so the stage carries a
  PENDING-REWRITE list of files. A listed file is skipped; an unlisted file must pass every check; a listed file that
  already passes every check FAILS the suite, naming it, so a finished file cannot stay listed; a listed path that
  names no file fails too. Each rewrite stage removes its files as it ships them, which is what "passes
  docs-under-test's checks with no recorded exception" means in their exits. Chosen over a per-line failure list
  (about 800 entries, churning on every edit) and a report-only check (enforces nothing until the end). Accepted
  blind spot: a listed file gets no protection until it is rewritten (see D-dut-3).
  Kind: rule
- **2026-10-12 — D-dut-3: interim states inside this program need no protection** (Sal: "not worried about issues
  within this program. i intend to run it atomically and then test/use/install it and validate"). The program runs
  as one atomic sequence and is validated by installing and using the result at its end, so a check need not defend
  the docs BETWEEN stages; D-dut-2's blind spot is accepted by design. A program-level stance, to be offered to the
  program doc as an R-ugd ruling.
  Kind: scope
- **2026-10-12 — D-dut-4: the tool inventory judges each surface against its own declared set** (Sal: "keep two
  domains"). The generated surface keeps its exemption fence in `orbit-cli-grammar`, unchanged; the docs get their own
  fence; a head is legal on a surface only when it is a recorded tool (`orbit`, `git`, `gh`, derived as today) or
  declared in THAT surface's fence. Each fence is exact for its own surface: a head the docs declare does not excuse
  it on a generated skill, and a declared head no line of its own surface uses fails. Chosen over one shared fence,
  which would be exact only for the union and would let a tool reach a skill through the docs' declaration, reopening
  the hole rc09b closed.
  Kind: rule
- **2026-10-12 — D-dut-5: a new `orbit-user-docs` capability owns the docs checks** (Sal: "go with orbit-user-docs").
  It owns D-dut-1's residue check, D-dut-2's pending-rewrite list and D-dut-4's docs fence, and later reference-docs'
  every-command-is-documented check. `orbit-cli-grammar` widens the domain of its three surface requirements (the
  `orbit` sweep, the `git`/`gh` sweep, the tool inventory) from the generated surface to it plus the user docs, and
  points at `orbit-user-docs` for what is docs-specific. Two capabilities, within R-crc-1's ceiling. Chosen over a
  new requirement inside `orbit-cli-grammar`, because the residue check is a naming rule about prose, not CLI grammar.
  Kind: scope
- **2026-10-12 — D-dut-6: commands in the docs are written on one line** (Sal: ratified as the standing
  recommendation stood). The generated surface's rule applies unchanged: the tool inventory reads each line of a
  backslash-continued command as its own head, so a continuation beginning with a flag fails as an unknown head, and
  the docs check builds no continuation reader. Today's three continued commands (`docs/cli.md` lines 722 and 960,
  `docs/customization.md` line 143; seven lines, measured 2026-10-12) are rewritten as one-liners by the stages that
  own those pages.
  Kind: rule
- **2026-10-12 — D-dut-7: the docs sweeps carry non-vacuity floors over unlisted files, active once the list is
  empty** (Sal: ratified as the standing recommendation stood). The `orbit` and `git`/`gh` sweeps found 0 snippets on
  today's docs and would pass vacuously; each asserts a minimum snippet count over UNLISTED files only, active once
  D-dut-2's list is empty, its value set at public-readiness from the rewritten docs' measured counts. A floor never
  pins a file the list still exempts (rc09b's lesson). Revised 2026-10-12 at the proposal walk (Sal: F6 A): the edit
  that EMPTIES the list sets the floors from its measured counts, in the same commit, and an empty list with an unset
  floor fails, since public-readiness runs after the list empties and would leave the floors active with no value.
  Kind: rule

## Open questions

## Considered & out

- **2026-10-12 — a per-line failure list** (the charter's "recorded list of today's failures"): about 800 entries,
  churning on every edit. Out for D-dut-2's file list.
- **2026-10-12 — a report-only check, flipped to failing at the end**: enforces nothing until the last stage. Out
  for D-dut-2.
- **2026-10-12 — a phrase allowlist, or marked spans in the markdown, for R-ugd-1's exceptions**: an allowlist cannot
  scope prose, and marked spans put check syntax in a public README. Out for D-dut-1's four admitted places.
- **2026-10-12 — one shared declared-heads fence over both surfaces**: exact only for the union, so a docs declaration
  would excuse a tool on a generated skill. Out for D-dut-4.
- **2026-10-12 — the residue check as a new `orbit-cli-grammar` requirement**: it is a naming rule about prose, not
  CLI grammar. Out for D-dut-5.
- **2026-10-12 — a continuation reader for the docs**: three commands do not justify a second reading rule. Out for
  D-dut-6.

## References

- `orbit/architecture/update-gh-documentation.md` — the program; stage `docs-under-test`, goal G4, rulings R-ugd-1
  (nomenclature) and R-ugd-4 (the install line).
- `test/helpers/surface-snippets.ts` — `generatedSurfaces()`, `analyseHeads`, the tokenizer; the `Surface` shape the
  docs would be fed as.
- `test/helpers/orbit-sweep.ts`, `test/helpers/recorded-sweep.ts` — the `orbit` and `git`/`gh` sweeps.
- `test/core/cli-grammar/tool-inventory.test.ts` — the exact-both-ways inventory and its exemption fence.
- `orbit/specs/orbit-cli-grammar/spec.md` — owns the sweeps and the inventory "on the generated surface"; extending
  them to the docs changes that domain.
- GitHub issue #1 — the docs rewrite this program answers.
