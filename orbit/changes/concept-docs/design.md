## Context

This change is the stage `update-gh-documentation › concept-docs`. Five `docs/` pages are the last entries on
`test/core/user-docs/pending-rewrite.json`. They describe upstream OpenSpec: none mentions `orbit`, and the migration
guide covers a different migration (legacy OpenSpec to upstream's 1.x workflow). The exploration (see explore.md)
measured the migration this guide must teach on real projects:

- **Case 1.** `orbit init` over an upstream 1.3.1 or 1.14.1 project leaves `openspec/` untouched, creates an empty
  `orbit/` beside it, and installs orbit's skills beside upstream's. Nothing warns. Moving `openspec/` to `orbit/` by
  hand works.
- **Case 2.** A 1.14.1 project degrades in orbit's 1.3.1 engine in eleven ways, five of them silent.

Taking upstream fixes into the engine is out (D-cd-9, recorded in the program's Considered & out). The engine changes
only by R-ugd-11's carve-out: one warning in `orbit init`.

Exit criteria: (1) the five pages pass docs-under-test's checks with no recorded exception; (2) every concept-page
claim about orbit's behaviour names the capability that carries it; (3) the migration guide's steps are run once on a
real OpenSpec project, and the run is recorded.

## Goals / Non-Goals

**Goals:**
- The five pages are rewritten in orbit's names (R-ugd-1) and leave the pending-rewrite list. Its emptying sets the
  docs floors.
- Exit (2) is a CHECK: the carried-by check, plus the system review's reading of whether each named owner is true.
- `docs/supported-tools.md` tells the truth about tool breadth, held to `AI_TOOLS`.
- An adopter arriving from OpenSpec 1.x learns what breaks before moving, and `orbit init` tells them when they are
  about to build a second project beside their first.

**Non-Goals:**
- No engine change beyond the warning: the task-marker grammar, the dropped metadata keys and the Purpose placeholder
  stay as they are (D-cd-9). R-ugd-3 stands for every other string.
- No `orbit update` warning (Considered & out in explore.md, Sal: init only).
- No migrate command, and no detection of upstream's `openspec-*` skills on their own.
- The README is not touched: landing-page owns it.

## Decisions

### D1 — the carried-by check is a file-local check in `test/helpers/user-docs.ts`, parsed as the claims check parses

`carriedByFailures(surfaces, exists)` sits beside `claimsFailures` and reuses its markdown-it parse and its `<name>`
production. Sections, carried-by lines and the navigation exemption are read from the token stream, never by regex over
raw text, so a fence is never structure. A `fork-and-orbify D<n>` item resolves against the headings of
`orbit/architecture/fork-and-orbify.md`, read once. The check joins `fileLocalFailures`. The pending-rewrite
requirement's list of file-local checks names it (a MODIFIED block), so the exactness rule runs it over a listed page
alone. This follows D-cd-7. It is a check rather than a record (R-crc-11): the engine can observe the line and resolve
its names, while whether a capability carries the claim stays a reading.

*Alternative considered:* leave exit (2) to the system review as a record. Rejected: the declaration is observable,
and an unchecked declaration drifts the day a capability is renamed.

### D2 — the tool-coverage check reads `AI_TOOLS` and two tier headings

`toolCoverageFailures(surfaces, tools)` imports `AI_TOOLS` from `src/core/config.ts` (the test already reads the
program the same way, through `buildProgram`). A tier is the text under an H2 whose heading text begins `Tier 1` or
`Tier 2`. A tool is named by its id as an inline code span in a table row. As with the command-coverage check, a page
that is neither listed nor present fails. Tier membership is fixed in the check (claude and codex in tier 1, every
other available entry in tier 2) because it encodes fork-and-orbify D11, not a fact the code carries.

### D3 — the warning is a pure detector plus one call in `InitCommand.execute`

`detectOpenspecProject(projectPath)` returns whether `openspec/` holds `specs/` or `changes/`. A pure function makes the
spec's table directly testable. `execute` calls it after the legacy cleanup and the welcome screen, and before tool
selection, so an interactive user reads it before choosing tools and both modes print it before `orbit/` is created. It
prints in yellow through `console.log`, like the legacy cleanup's summary, and points at
`https://github.com/las-sal/orbit-spec/blob/main/docs/migration-guide.md`. That URL 404s until the repository is
public, which is accepted: no adopter can install orbit before then either (R-ugd-9).

*Alternatives considered (explore.md, Q-cd-3):* document only, which leaves the side-by-side state silent; or a
migrate command, which is more code than the carve-out covers. Sal took the warning.

### D4 — page shapes

- **`docs/concepts.md`.** The upstream concepts (specs, changes, artifacts, delta specs, schemas, archive) stay,
  shortened, each carried by `the 1.3.1 baseline` or by the capability that changed it (archive's divergence guard is
  `orbit-base-fingerprints`). New sections cover what orbit adds: reviewed gates and the cadence (`orbit-engine-gates`,
  `orbit-review`), the blind pair and walks (`orbit-review-external`, `orbit-external-runner`,
  `orbit-address-reviews`), emits and trails (`orbit-emit-composition`, `orbit-run-summary-emit`,
  `orbit-report-rendering`), orientation (`orbit-orientation`), the architect tier (`orbit-architect`,
  `orbit-architecture-engine`), `orbit pr` (`orbit-pr-lifecycle`), and consent (`orbit-lifecycle-consent`). One prose
  attribution opens the page (D-cd-3).
- **`docs/customization.md`.** `config.yaml`'s `schema`, `context` and `rules` (the 1.3.1 baseline), plus orbit's keys:
  `pr` (`orbit-pr-lifecycle`), `scenario_map` (`orbit-scenario-map`), `review_preference` (`orbit-engine-gates`),
  `size_ceiling` (`orbit-change-size`) and `models` (`orbit-engine-gates`, the eligibility-line hint). Each owner
  is re-read from its spec before the page names it. Custom schemas gain the `gates:` list (`orbit-engine-gates`).
- **`docs/multi-language.md`.** `context:`-driven language guidance; the 1.3.1 baseline.
- **`docs/supported-tools.md`.** D2's two tiers; tier 1's sections are carried by `orbit-skill-generation`, tier 2's by
  `the 1.3.1 baseline`.
- **`docs/migration-guide.md`.** The checklist, the move steps, the "what orbit does not have" table, and a short
  "what changes for you" section (`/opsx:` becomes `/orbit:`; reviewed gates now sit between propose, apply and
  archive). It names 1.14.1 as the version it was measured against. Its `openspec` paths are admitted by the residue
  check; its `grep`, `find` and `ls` heads are declared in the `docs-inventory` fence.

### D5 — the floors are set by the commit that empties the list

`DOCS_FLOOR` in `test/core/cli-grammar/snippet-sweep.test.ts` and the `git`/`gh` entries in
`test/core/cli-grammar/recorded-sweep.test.ts` are set in the same commit that empties `pending-rewrite.json`. Each is
a positive integer at most the count its sweep measures over the user docs at that edit, as the floors requirement
states. A sweep that measures zero `gh` snippets cannot take a positive floor: that is measured at apply. If it reads
zero, the docs must teach at least one `gh` line, or the gap is briefed to Sal before a floor is invented.

### D6 — exit (3) is one recorded run, and the ledger cites it

A fresh upstream 1.14.1 project is built in a scratch directory (`npx @fission-ai/openspec@1.14.1 init --tools
claude`), with one fixture per checklist hazard. Then the guide is executed as written: the checklist, the fixes, the
move steps, and orbit's `list`, `status` and `validate --all`. The transcript, every command and its output, is
recorded at `orbit/changes/concept-docs/migration-run.md`. The scenario "The guide's steps move a 1.14.1 project" is
declared `observed` in `orbit/scenario-ledger.yaml`, citing that file. Every other delta scenario is tagged in a test.

## Risks / Trade-offs

- **D-cd-3 (bounded):** an orbit change to inherited behaviour that no capability states. See the named limit in
  `orbit-user-docs`' `Every H2 section of four concept pages declares its owner on a checked Carried by line`.
- **D-cd-5 (bounded):** a hazard the measurement missed, or one upstream ships later. See the named limit in
  `orbit-user-docs`' `The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project`.
- **[The checks read declarations, not truth]** → the system review reads each page for orbit behaviour and diffs the
  claims against `upstream/v1.3.1` where a page says "the 1.3.1 baseline".
- **[Tier 2 is untested]** → the page says so, rather than "supported", and names the 1.3.1 directories.
- **[The warning's URL 404s until the flip]** → accepted (D3).
- **[The capability count moves 28 → 29]** → `CLAUDE.md`'s marked figure is updated at archive, or `orbit validate
  --sources` fails.

## Alternatives considered

From explore.md's Considered & out and resolved questions:
- **The same warning in `orbit update`.** Out (Sal: init only).
- **Exit (2) as a record only.** Out (D1).
- **The migration guide as an incompatibility table without commands** (Q-cd-6 option b), and **the warning widened to
  scan for the hazards** (option c, more engine code). Out: the silent hazards are exactly what a grep finds.
- **Cherry-picking upstream fixes before launch.** Out (Sal, program Considered & out).

## Touchpoints

- `docs/concepts.md` + `docs/customization.md` + `docs/supported-tools.md` + `docs/multi-language.md` + `docs/migration-guide.md` — the rewrites.
- `test/core/user-docs/pending-rewrite.json` — emptied.
- `test/helpers/user-docs.ts` — the carried-by and tool-coverage checks, joined into `fileLocalFailures`.
- `test/core/user-docs/carried-by.test.ts` — new.
- `test/core/user-docs/tool-coverage.test.ts` — new.
- `test/core/user-docs/migration-guide.test.ts` — new: the measured version is named.
- `test/core/cli-grammar/snippet-sweep.test.ts` + `test/core/cli-grammar/recorded-sweep.test.ts` — the docs floors.
- `src/core/init.ts` — the detector and its call.
- `test/core/init-openspec-warning.test.ts` — new.
- `orbit/scenario-ledger.yaml` — the observed run.
- `orbit/changes/concept-docs/migration-run.md` — the recorded run.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-cd-2 | SOURCED | live rule | `orbit-init-openspec-warning`'s `orbit init warns when an OpenSpec project directory sits beside it` — a normative TABLE |
| D-cd-3 | BOUNDED | live rule | `orbit-user-docs`' `Every H2 section of four concept pages declares its owner on a checked Carried by line` — the owner paragraph, and the named limit verbatim |
| D-cd-5 | BOUNDED | live rule | `orbit-user-docs`' `The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project` — a TABLE, and the named limit verbatim |
| D-cd-7 | SOURCED | live rule | `orbit-user-docs`' `Every H2 section of four concept pages declares its owner on a checked Carried by line` — a GRAMMAR block and a TABLE |
| D-cd-8 | SOURCED | live rule | `orbit-user-docs`' `The supported-tools page lists every init target in two tiers` — a TABLE |
| D-cd-1, D-cd-6, D-cd-9 | — | `Kind: scope` | not carried |
| D-cd-4 | — | `Kind: fact` | not carried |
