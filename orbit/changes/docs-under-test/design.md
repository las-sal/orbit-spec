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
- Setting the floor values (D-dut-7): they stay inactive until the list is empty and are set at public-readiness.
- Protecting a listed file between stages (D-dut-3).

## Decisions

**D1 — One docs-surface helper, unlisted files only.** `docSurfaces()` beside `generatedSurfaces()` reads `README.md`
and `docs/*.md` (non-recursive), drops the files on the pending-rewrite list, and returns `Surface` records with
`workflowId: 'docs'` and `file` the repository-relative path, so every failure message names the doc as it does a
skill. A second helper returns ALL user docs, for the list's own exactness check. The analysers are untouched.

**D2 — The list lives in the test tree.** `test/core/user-docs/pending-rewrite.json`, a JSON array of
repository-relative paths, starting with all twelve. It is test data, so it stays out of the directories a visitor to
the public repository reads, and each rewrite stage's edit to it is a one-line diff. Its exactness test runs every
check (the residue check and the three sweeps over that one file) on each listed file and fails on a listed file
that passes everything, or on a stale path (`orbit-user-docs`' gating requirement table).

**D3 — The residue check reads sections through the engine's fence tracker.** A README section starts at an ATX
heading whose text is exactly `Built on OpenSpec` or `How orbit improves on OpenSpec` and ends at the next heading of
the same or a higher level. A `#` line inside a fence is not a heading, so the scan uses the shared CommonMark fence
tracker (`src/core/markdown-fence.ts`) rather than a regex over lines: Q-crc-15's lesson, a second fence grammar is a
second bug. Occurrences are matched case-insensitively over the whole text, fenced or not.

**D4 — The docs fence is read the way the generated fence is.** The `docs-inventory` fence is read from
`orbit-user-docs`' requirement as it stands, through the same single-active-owner lookup the inventory test uses for
its own fence (`test/helpers/owner-text.ts`), and parsed by the same line grammar. Its info string differs, so
neither test can read the other's block. It starts empty.

**D5 — Floors are inactive constants.** Each docs sweep carries its floor beside the generated surface's, asserted
only when the pending list is empty (D-dut-7). Until public-readiness sets them, their values are placeholders the
inactive guard never reads.

**D6 — Requirement titles are kept.** The three `orbit-cli-grammar` titles say "on the generated surface", and the
other requirements and the tests quote them verbatim, so a rename would ripple through every pointer. The titles
stay as identity and the bodies widen (precedent: `orbit-conventions`' explore.md format requirement keeps its
"five-section" title).

**D7 — Every check is shown able to fail.** Each extended check gets an injected case (a residue occurrence, an
unknown flag, an unrecorded `git` flag, an undeclared head, a continuation, a listed file that passes, a stale entry)
that fails the suite with the expected message. A check that cannot be made to fail does not count (rc17a's oracle
lesson).

## Risks / Trade-offs

- [D-dut-1 is BOUNDED] → Its residual (an upstream name form matching none of the three patterns) is stated as a
  named limit in `orbit-user-docs`' `The old name appears in the user docs only in four admitted places`.
- [A listed file has no protection] → Accepted by D-dut-3; every listed file is scheduled for a full rewrite.
- [The stage's exit (3) says "the recorded list of today's failures"] → D-dut-2 records them as a file list; the
  archive records the term as revised (R-crc-12's first case), because the criterion's measure still applies.
- [A title saying "generated surface" over a widened domain] → Each body states the domain in its first sentence and
  says the title is kept as identity (D6).

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
