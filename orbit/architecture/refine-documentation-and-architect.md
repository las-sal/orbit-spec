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
Complete: [x] 2026-10-14 (Sal)

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
and the skills' `metadata.author: 'openspec'`. Task 4.5, Sal running `orbit init` then `orbit --help`, was deferred at archive
and observed by Sal the same day; the fresh system pass had run both clean.

### Stage docs-refinement — the docs follow the tool

Depends-on: architect-first, cli-says-orbit
Complete: [x] 2026-10-15 (Sal)

The README Quickstart led by `/orbit:architect`; the workflow and getting-started pages following the
architect-first canonical flow; quoted CLI output re-captured after `cli-says-orbit`; and the further clean-up Sal
adds to issue #24. Depends on the first two so the docs describe what the CLI does.

Exit criteria: G1's docs half and G3 hold under the `orbit-user-docs` checks; Sal has reviewed the pages; the change
is archived.

Shipped as (2026-10-15; archived as `orbit/changes/archive/2026-10-15-docs-refinement/`; the charter stands, narrowed
at explore by measurement): the user docs lead with `/orbit:architect`. README's first-change list and
getting-started open with an architect session (getting-started's new step 0) and close with one that ratifies the
stage (step 8). workflows' flow block, "Step by step", "Exploring first" and Practices name architect first,
workflow-engine's diagram starts at `architect ──►`, and concepts' `## Artifacts` places explore after architect. The
two reference tables list `/orbit:architect` first. `/orbit:explore` alone stays the one-off path, which stops at
archive. The system walks added that the exploration is what records the stage citation, and that a `/orbit:new`
change carries none unless `architecture: {doc, stage}` is added to its `.openspec.yaml`. `orbit-user-docs` gains
`The user docs' start sections name the architect workflow first`: eight (page, heading) sections, held exactly, in
each of which the first start command must be architect (a `/orbit:<id>` mention, or a fenced `<id> ──►`). The check
joins the file-local set, and `orbit-architect`'s user-docs row is now checked prose. The re-capture item needed no
edit: the docs quote no output either prior stage changed (D-dr-3, measured), and issue #24 §3 added no clean-up.
Task 5.1, Sal reading the pages, was deferred at archive.

### Stage release — v2.0.1

Depends-on: architect-first, cli-says-orbit, docs-refinement
Complete: [x] 2026-10-16 (Sal)

Cut `v2.0.1` by `npm run release:tree`, with a CHANGELOG entry, so the installed CLI matches the docs. Pushing the
tag is Sal's act.

Exit criteria: G4 — an install from the tag prints 2.0.1 and its `orbit init` says orbit; issue #24 closed or its
remainder re-filed.

Shipped as (2026-10-16; archived as `orbit/changes/archive/2026-10-16-release/`; the charter stands, the tag still to
cut): `package.json` and the lockfile say `2.0.1`, `CHANGELOG.md` gains a `2.0.1` entry (architect named first, the
CLI says orbit with the kept names listed, the docs lead with architect, a link to issue #24), and the five
current-version sites in `README.md` and `docs/installation.md` say `2.0.1`. `orbit-user-docs` gains `The user docs
state orbit's current version as package.json's`: every version token is current or on an exact admitted list (three
values and one README phrase), an install target is read by its whole ref and is never admitted, both install pages
carry the current install command, and a stale admission fails. The system walks added the whole-ref reading (codex
found `#v2.0.1-rc.1` passing; the fresh pass found a sentence-ending command refused) and an apply-time sandbox
rehearsal that `orbit-conventions` requires of a README install edit: from a scratch clone with a local `v2.0.1`, the
install printed `2.0.1` and `orbit init --tools claude` wrote the README's surface and said orbit. The tag itself is
cut after the merge: `npm run release:tree` on `main`'s merge commit, then Sal pushes `v2.0.1` by name; the G4
observation from the pushed tag, and issue #24's closure, are the ratification's.

## Considered & out

- **Making an architect session required** (2026-10-14, R-rda-2). R-rda-1 could have been read as a gate: no change
  without an architect session. Rejected: architect-first changes what orbit suggests, never what it requires, so
  `/orbit:explore` plus hand-editing stays a working path and nothing flags work that skipped the session.
- **Bumping the docs' install pins by hand, with no check** (2026-10-15, `release` explore, Sal). Rejected: nothing
  would catch a missed pin, now or at the next release, so `release` added the version check to `orbit-user-docs`.
- **Deferring the README install check to ratification by amending `orbit-conventions`** (2026-10-15, `release`
  system walk, Sal). The tag cannot exist before the merge, so an apply-time install from it is impossible. Rejected
  in favour of an apply-time rehearsal from a scratch clone carrying a local tag, which keeps the requirement whole;
  the install from the pushed tag stayed the ratification's.

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

**2026-10-14 — `cli-says-orbit` ratified (Sal), in an architect session.** All three exits held: `orbit-cli-name`'s
scan and help check (mutation-checked on a source string, the schema line and an admitted target), `orbit init` in a
scratch project (the e2e case, and task 4.5, which Sal observed after archive), and the archive
(`2026-10-14-cli-says-orbit`, PR #26 merged). `docs-refinement` is now startable, and `release` waits on it. Measured
at this session for that stage: no user doc quotes a string `cli-says-orbit` renamed; the README names
`/orbit:architect` only in its install table, not its Quickstart; `docs/workflows.md:51` says to start with
`/orbit:explore` when the problem is unclear; issue #24's §3 ("Other documentation clean-up") has no items yet, so
Sal's review at the stage's exit is where they arrive.

**2026-10-15 — `docs-refinement` ratified (Sal), in an architect session.** All three exits held: the `orbit-user-docs`
checks, the new start-sections check among them, pass over the merged docs; Sal read the edited pages (task 5.1,
deferred at archive and observed here); the archive (`2026-10-15-docs-refinement`, PR #27 merged). Sal named no
clean-up item for issue #24 §3 at ratification. `release` is now startable, the program's last stage.

**2026-10-16 — `release` ratified (Sal), in an architect session.** G4 held. After PR #28 merged (`3985b4cc`), Sal ran
`npm run release:tree` on `main` (release commit `baf1e76b`) and pushed `v2.0.1`; `git ls-remote` shows the tag. In
an isolated HOME, npm prefix and PATH with no `orbit` on it, `npm install -g github:las-sal/orbit-spec#v2.0.1` exited
0 and installed a directory; `orbit --version` printed `2.0.1`; in a new `git init` project, `orbit init --tools
claude` printed "orbit Setup Complete", "15 skills and 15 commands in .claude/" and the `/orbit:architect <name>`
suggestion, and `orbit status` pointed at `/orbit:architect <name>`. Issue #24 is closed. Every stage of the program
is now complete.

**2026-10-16 — closing architecture review walked (Sal: a).** The review (`review-architecture-2026-10-16T13-53-54Z`)
found three suggestions, all repaired: `architect-first`'s task 6.5, deferred since 2026-10-14, is ticked in its
archived tasks on the evidence of the `release` ratification's clean install, which ran exactly its case; Considered &
out records the three routes the program turned down; `CLAUDE.md` no longer names this program as live.
