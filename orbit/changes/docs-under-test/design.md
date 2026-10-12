## Context

`update-gh-documentation` rewrites `README.md` and the eleven `docs/` pages before the repository goes public. This is
its first stage: the docs are put under machine checks first, so every later rewrite is graded by a machine. The
exploration (see explore.md) probed the shipped sweeps against today's docs: the `orbit` and `git`/`gh` sweeps found
zero snippets and would pass vacuously, the tool inventory reported 108 `openspec` heads plus install tooling and
continuation flags, and about 800 findings in all would fail today. All seven decisions (D-dut-1..7) were ratified by
Sal in the exploration.

The sweeps live in tests, read through `generatedSurfaces()` (`test/helpers/surface-snippets.ts`), which returns
`Surface` records (`{workflowId, file, text}`); every analyser takes `Surface[]`, so the docs can be fed in without
changing an analyser.

## Goals / Non-Goals

**Goals:**
- The user docs are a checked surface: the three shipped sweeps read them, and a residue check applies R-ugd-1
  (D-dut-1, D-dut-5).
- Today's failing docs are carried by a pending-rewrite FILE list, exact both ways, so the suite stays green (D-dut-2).
- The inventory judges each surface against its own declared set (D-dut-4).
- Each check is shown able to fail, on an injected case.

**Non-Goals:**
- Editing any doc. The rewrite stages (`landing-page`, `reference-docs`, `concept-docs`) do that and empty the list.
- Engine code or a CLI surface for the docs checks. The sweeps are test-only today, and so are these.
- Setting the floor values now (D-dut-7): they have no value while any file is listed; the edit that empties the
  list sets them (D5).
- Protecting a listed file between stages (D-dut-3).

## Decisions

**D1 — One docs-surface helper, unlisted files only.** `docSurfaces()` beside `generatedSurfaces()` reads `README.md`
and `docs/*.md` (non-recursive), drops the files on the pending-rewrite list, and returns `Surface` records with
`workflowId: 'docs'` and `file` the repository-relative path. `describeSurface` returns `file` alone for a docs
surface (a skill keeps `<workflow>/<file>`), so a failure names `README.md` or `docs/cli.md` as they stand, never
`docs/README.md`. The helper takes the pending list as a parameter (default: the list file), so a test can inject
one. A second helper returns ALL user docs, for the list's own exactness check and the `git` capture (D8). The
analysers are untouched.

**D2 — The list lives in the test tree.** `test/core/user-docs/pending-rewrite.json`, a JSON array of
repository-relative paths, starting with all twelve. It is test data, so it stays out of the directories a visitor to
the public repository reads, and each rewrite stage's edit to it is a one-line diff. Its exactness test runs the
FILE-LOCAL checks on each listed file alone — the residue check, the `orbit` and `git`/`gh` sweeps, and the
inventory's unknown-head rule — and fails on a listed file that passes them all, or on a stale path
(`orbit-user-docs`' gating requirement). The whole-docs rules, an unused `docs-inventory` declaration and the floors,
are never run per file: one page cannot decide them.

**D3 — The residue check reads sections from a CommonMark parse.** A README section starts at a top-level ATX
heading whose text is exactly `Built on OpenSpec` or `How orbit improves on OpenSpec` and ends at the next top-level ATX heading whose
level is at most its own. A setext heading is not read (a named limit). A `#` line inside a fence, an HTML block, a list item
or a blockquote is not a heading, so the scan takes its headings from markdown-it, the parser the shared extractor already
uses, with HTML blocks enabled as GitHub renders the README, rather than from a regex over lines: Q-crc-15's lesson, a
second block grammar is a second bug. Occurrences are matched case-insensitively over the whole text, fenced or not.

**D4 — The docs fence is read the way the generated fence is.** The `docs-inventory` fence is read from
`orbit-user-docs`' requirement as it stands, through the same single-active-owner lookup the inventory test uses for
its own fence — `inventorySource` in `test/core/cli-grammar/tool-inventory.test.ts` (the one active delta holding the
requirement heading under ADDED or MODIFIED, else the baseline; two holders throw), extracted into a shared helper
that takes the capability, the requirement title and the fence's info string — and parsed by the same line grammar,
its malformed-block rules included. It starts empty, and a fence with no lines is legal: the shared parser reads zero
lines, never one empty line. Its info string differs, so neither test can read the other's block.

**D5 — Floors are unset until the list empties.** Each docs sweep carries its floor beside the generated surface's
as a number or `null`, `null` while any file is listed. The guard runs only when the pending list is empty, and then
fails on a `null` floor naming the sweep, and on a floor that is not a positive integer, so the edit that empties the
list must set each floor to a positive integer at most its sweep's measured count in the same commit (D-dut-7, revised at the proposal walk). The guard takes the list and the floors as
parameters, so a test injects both cases.

**D6 — Requirement titles are kept.** The three `orbit-cli-grammar` titles say "on the generated surface", and the
other requirements and the tests quote them verbatim, so a rename would ripple through every pointer. The titles
stay as identity and the bodies widen (precedent: `orbit-conventions`' explore.md format requirement keeps its
"five-section" title).

**D7 — Every check is shown able to fail.** Each extended check gets an injected case (a residue occurrence, an
unknown flag, an unrecorded `git` flag, an undeclared head, a continuation, a listed file that passes, a stale entry)
that fails the suite with the expected message. A check that cannot be made to fail does not count (rc17a's oracle
lesson). The injected set also covers the floors (an empty list with a floor unset, one not a positive integer, and one below its floor), a
command inside an admitted README section, an empty docs fence, a clean listed page beside a declared head it does not
use, and the exact surface name a docs failure prints.

**D8 — The `git` capture reads every user doc.** `scripts/capture-git-contract.capture.ts` takes its candidate set
from the generated surface plus ALL user docs, listed or not, so a rewrite stage records a command its page writes
before it unlists the page. Today's docs write no `git`, so the contract does not change. `gh` keeps its fixed command
list (`scripts/capture-gh-contract.mjs`); a docs-only `gh` command is a named limit in `orbit-cli-grammar`, met by
extending the list and re-capturing.

## Risks / Trade-offs

- [D-dut-1 is BOUNDED] → Its residual (an upstream name form matching none of the three patterns) is stated as a
  named limit in `orbit-user-docs`' `The old name appears in the user docs only in four admitted places`.
- [A listed file has no protection] → Accepted by D-dut-3; every listed file is scheduled for a full rewrite.
- [The stage's exit (3) says "the recorded list of today's failures"] → D-dut-2 records them as a file list; the
  archive records the term as revised (R-crc-12's first case), because the criterion's measure still applies.
- [A title saying "generated surface" over a widened domain] → D6 keeps the titles; each body names the user docs
  where it states its domain, and the `orbit` requirement says the title is kept as identity.

## Alternatives considered

From explore.md's Considered & out: a per-line failure list (about 800 entries, churning on every edit); a report-only
check flipped to failing at the end (enforces nothing until then); a phrase allowlist or marked spans for R-ugd-1's
exceptions (an allowlist cannot scope prose; marked spans put check syntax in a public README); one shared
declared-heads fence (exact only for the union); the residue check inside `orbit-cli-grammar` (a naming rule, not
CLI grammar); and a continuation reader (three commands do not justify a second reading rule).

## Touchpoints

- `test/helpers/surface-snippets.ts` — `docSurfaces()` and the all-docs helper.
- `test/core/user-docs/` — the residue check, the list's exactness, the docs fence, and `pending-rewrite.json`.
- `test/core/cli-grammar/snippet-sweep.test.ts` + `test/core/cli-grammar/recorded-sweep.test.ts` + `test/core/cli-grammar/tool-inventory.test.ts` — the three sweeps over the docs, with injected failures and inactive floors.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-dut-1 | BOUNDED | live rule | `orbit-user-docs`: `The old name appears in the user docs only in four admitted places` — TABLE, with the residual as a named limit |
| D-dut-2 | DERIVED | live rule | `orbit-user-docs`: `The user docs are a checked surface, gated by an exact pending-rewrite list` — TABLE |
| D-dut-4 | DERIVED | live rule | `orbit-user-docs`: `The user docs declare their own command heads` — GRAMMAR (the `docs-inventory` fence) with `orbit-cli-grammar`'s inventory requirement's per-surface sentence |
| D-dut-6 | SOURCED | live rule | `orbit-cli-grammar`: `Every command head on the generated surface is a recorded tool or a declared exemption` — SENTENCE (the rows apply to the user docs unchanged, so a command is written on one line) |
| D-dut-7 | SOURCED | live rule | `orbit-user-docs`: `The docs sweeps carry non-vacuity floors once the pending list is empty` — TABLE |
| D-dut-3 | — | scope | not carried (stated in the gating requirement's prose as the reason a listed file is unprotected) |
| D-dut-5 | — | scope | not carried (it decides which capability owns each requirement) |
