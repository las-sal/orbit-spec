# Program: refine-documentation-and-architect

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

`update-gh-documentation` ended on 2026-10-13 with orbit public at `v2.0.0`, and two gaps showed in its last hours.

First, orbit still introduces itself as OpenSpec. `orbit init` prints "Welcome to OpenSpec", "OpenSpec structure
created" and "OpenSpec Setup Complete", and `orbit --help` describes commands as OpenSpec's: about 27 user-visible
strings that R-ugd-3 kept out of the docs program. Issue #24, "Refine Documentation", collects them, along with the
documentation clean-up Sal finds on review.

Second, orbit points new work at the wrong door. The architect tier is orbit's biggest addition over OpenSpec, yet
every surface that suggests where to start says explore. The archive emit ends with "Run /orbit:new or /orbit:explore",
the onboard diagram and the orientation strip start at explore, and the README Quickstart never mentions
`/orbit:architect`. This is not an accident: `orbit-architect`'s `Architect is a stance, never a gatekeeper` states that
the canonical flow (explore → propose → …) is unchanged by the architect workflow. At the program's close the handoff
suggested `/orbit:explore refine-documentation`, and Sal expected `/orbit:architect`.

What the program must produce: an orbit that is architect-first in what it suggests, a CLI that says orbit, and
documentation refined to match, released as a new version.

## Goals

- **G1 — architect-first is what orbit suggests.** No generated body, engine `next` or user doc names explore or new
  as where new work starts; checked by a test over the surfaces R-rda-2 lists.
- **G2 — the CLI says orbit.** No user-visible CLI string says OpenSpec outside the cases R-ugd-3 protected; checked
  by a test.
- **G3 — the docs match the tool.** Every doc snippet and quoted output agrees with the shipped CLI, under the
  existing `orbit-user-docs` checks.
- **G4 — a release ships it.** A tag whose install prints the new version and whose `orbit init` says orbit.

## Rulings index

- **R-rda-1** (Sal, 2026-10-13) — orbit is ARCHITECT FIRST, not explore first: where orbit suggests how to start new
  work, it suggests `/orbit:architect <name>`. ("How do we make orbit an architect first instead of explore first
  framework?") This reverses the canonical-flow clause of `orbit-architect`'s `Architect is a stance, never a
  gatekeeper`; R-rda-2 says what replaces it.
- **R-rda-2** (Sal, 2026-10-14; settles Q-rda-1) — architect-first changes the SUGGESTION, never the requirement. Kept:
  an architect session is never required; explore plus hand-editing stays a working path, and nothing flags work
  that skipped it. Replaced: the canonical flow becomes architect → explore → propose → …, and every surface that
  suggests where to start names `/orbit:architect <name>` first — the archive emit's next, `orbit status` with nothing
  in flight, the onboard diagram, and the README, workflows and getting-started pages. A change that cites a program
  points at that program's next stage.
- **R-rda-3** (Sal, 2026-10-14; settles Q-rda-2) — four stages, below. `cli-says-orbit` leaves `.openspec.yaml`, the
  data-format tags, the global config directory and legacy-OpenSpec detection as they are (R-ugd-3's protections).
  The release is `v2.0.1`.
- **R-rda-4** (Sal, 2026-10-14; settles Q-rda-3) — the goals G1–G4 above.

## Open questions

(None open. Q-rda-1, Q-rda-2 and Q-rda-3 were settled on 2026-10-14 as R-rda-2, R-rda-3 and R-rda-4.)

## Program stages

### Stage architect-first — orbit suggests architect for new work

Depends-on: (none)
Complete: [x] 2026-10-14 (Sal)

The engine and spec half of R-rda-1, as R-rda-2 scopes it. `orbit-architect`'s `Architect is a stance, never a
gatekeeper` keeps "never required" and states the new canonical flow. The archive emit's next (composed in
`src/core/emit-composition.ts`), its mirror in `orbit-conventions`' example and the archive body, the orientation
readout with nothing in flight, and the onboard diagram all name `/orbit:architect <name>` first; a change that
cites a program points at that program's next stage instead.

Exit criteria: a test over those surfaces fails if any names explore or new as where new work starts (G1's engine
half); the specs that stated explore-first are restated; the change is archived.

Shipped as (2026-10-14; archived as `orbit/changes/archive/2026-10-14-architect-first/`; the charter stands, widened at
propose by Sal's word to the CLI's start hints and the no-changes message and errors): every strict start surface names
`/orbit:architect` first. The archive emit's next follows the change's citation, to `/orbit:architect <doc>` for a
cited change whose doc file exists and `/orbit:architect <name>` otherwise. Idle `orbit status` gains a next line on
the ladder's rungs 2 and 3: the newest recorded `/orbit:` command verbatim, or `/orbit:architect <name>`. `orbit init`,
`orbit update`, the welcome screen, `No active changes.` and the two no-changes errors follow. `orbit-architect` gains
`Start surfaces name the architect workflow first`, and `test/core/start-surfaces.test.ts` asserts its strict rows;
reverting each of nine old strings turns it red. The stance paragraph, the onboard flow (architect, the per-change
phases, architect to ratify) and its nudge are architect-first, and an architect session stays never required. Two
named limits ride the specs: bulk-archive's upstream `Create a new change to get started.`, recorded rather than edited,
and a later prose record (a clean project-wide audit-drift) hiding an earlier command from the idle line. Task 6.5, Sal
running `orbit init` then `orbit status` cold, is deferred; the fresh system pass ran it and saw both name architect.

### Stage cli-says-orbit — the CLI's user-visible strings say orbit

Depends-on: (none)
Complete: [ ]

The roughly 27 user-visible `OpenSpec` strings issue #24 lists — `orbit init`'s banners and spinners, `--help`
descriptions, other command output — become orbit's. Out of scope by R-rda-3: `.openspec.yaml`, data-format tags,
the global config directory and legacy-OpenSpec detection.

Exit criteria: a test over the CLI's user-visible strings fails on an unprotected `OpenSpec` (G2); `orbit init` in
a scratch project prints no OpenSpec; the change is archived.

Shipped as (2026-10-14; archived as `orbit/changes/archive/2026-10-14-cli-says-orbit/`; the charter stands, widened
by Sal's word to the generated skills at explore and to the launchers at the system walk): the measured surface was
48 strings in `src/`, not the roughly 27 the issue listed, plus the shipped schema's description and `build.js`'
banner. All of them say orbit. The three directory errors now name `orbit/` and `orbit/changes/`, and the rc-file
comment reads "Orbit" between the unchanged `OPENSPEC:START/END` markers. Fourteen lines of skill descriptions and
tool-naming body sentences carry `orbit-cli-name`'s named edits, and the 13 launchers' shared sentence says
"upstream behavior". The new `orbit-cli-name` holds it with a source scan (the TypeScript AST's string literals,
plus `schemas/`, `bin/`, `scripts/postinstall.js` and `build.js` line by line), an exact admitted list of six
entries, and a runtime check of every command's help and `orbit init`. Reverting a source string, the schema line
or an admitted target turns the scan red. Kept as named residue: `OPENSPEC_CONCURRENCY` and `OPENSPEC_NO_AUTO_CONFIG`,
and the skills' `metadata.author: 'openspec'`. Task 4.5, Sal running `orbit init` then `orbit --help`, is deferred;
the fresh system pass ran both clean.

### Stage docs-refinement — the docs follow the tool

Depends-on: architect-first, cli-says-orbit
Complete: [ ]

The README Quickstart led by `/orbit:architect`; the workflow and getting-started pages following the
architect-first canonical flow; quoted CLI output re-captured after `cli-says-orbit`; and the further clean-up Sal
adds to issue #24. Depends on the first two so the docs describe what the CLI does.

Exit criteria: G1's docs half and G3 hold under the `orbit-user-docs` checks; Sal has reviewed the pages; the change
is archived.

### Stage release — v2.0.1

Depends-on: architect-first, cli-says-orbit, docs-refinement
Complete: [ ]

Cut `v2.0.1` by `npm run release:tree`, with a CHANGELOG entry, so the installed CLI matches the docs. Pushing the
tag is Sal's act.

Exit criteria: G4 — an install from the tag prints 2.0.1 and its `orbit init` says orbit; issue #24 closed or its
remainder re-filed.

## Considered & out

## Status log

**2026-10-13 — program opened (Sal), in an architect session.** Opened the same day `update-gh-documentation`
completed, from issue #24 and Sal's question at its close: why the handoff suggested `/orbit:explore` rather than
`/orbit:architect`. R-rda-1 captured. The stage plan, the goals and the scope of "architect first" are open questions
with standing recommendations.

**2026-10-14 — plan settled (Sal).** Sal accepted the three standing recommendations: R-rda-2 (scope), R-rda-3 (four
stages, release `v2.0.1`), R-rda-4 (goals G1–G4). Stages declared; `architect-first` and `cli-says-orbit` are
independent and may run in either order.

**2026-10-14 — `architect-first` ratified (Sal), in an architect session.** All three exits held: the start-surfaces
test (mutation-checked over nine old strings), the restated specs, the archive (`2026-10-14-architect-first`, PR #25
merged). Task 6.5, Sal's cold `orbit init` then `orbit status`, stays deferred and is not an exit. `cli-says-orbit` is
the one stage now startable; `docs-refinement` waits on it, and `release` on both.
