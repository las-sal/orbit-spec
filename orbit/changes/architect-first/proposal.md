## Why

orbit's architect tier is its biggest addition over OpenSpec, yet every surface that suggests where to start new work
points at explore or new. At the close of `update-gh-documentation` the handoff suggested `/orbit:explore`, and Sal
expected `/orbit:architect`. R-rda-1 makes orbit architect-first, and R-rda-2 scopes it: what orbit SUGGESTS changes,
and what it REQUIRES does not (stage `refine-documentation-and-architect › architect-first`). The exploration settled
the five surfaces on Sal's word (see explore.md, D-af-2 to D-af-6).

## What Changes

- **Idle `orbit status` gives a next** (D-af-2). Today, with nothing in flight, it prints the program band, LAST and
  WAITING, and no `Ready when you are:` line.
  - On the ladder's rungs 2 and 3 it renders the newest emit's recorded `next_recommended` verbatim when that string
    begins with `/orbit:`. Otherwise, or when no emit exists, it renders `/orbit:architect <name>`.
  - Rung 3's no-active-changes message stays and gains that line. Both rungs' `--json` carry the same `next`.
- **The archive emit's next follows the change's citation** (D-af-3). Today it reads "Change archived. Run /orbit:new or
  /orbit:explore to start the next change, …".
  - A change citing a program whose doc exists recommends `/orbit:architect <doc>`: review stage `<stage>` and take up
    the program's next stage.
  - Any other change recommends `/orbit:architect <name>` to plan the next piece of work.
  - Both begin with the command, so idle status renders them, and both keep `/orbit:audit-drift` as the alternative.
- **The CLI's start hints name architect** (D-af-4, D-af-5):
  - `orbit init`'s `Getting started:` line, which today reads `/orbit:propose "your idea"`.
  - `orbit update`'s `Getting started:` list, which today leads with `/orbit:new`.
  - The welcome screen's `Quick start` list, which today leads with `/orbit:new`.
- **`orbit-architect`'s stance clause is restated** (R-rda-2). The canonical flow becomes architect → explore →
  propose → …; an architect session stays never required, and nothing flags work that skipped it. A new requirement
  names the start surfaces and splits them as D-af-4 does:
  - Strict surfaces name architect and no other start, and a test checks them.
  - Prose surfaces may describe explore and new as the one-off path, after architect.
- **The onboard body puts architect first** (D-af-6). The canonical-flow diagram shows architect as the step before
  the per-change flow, and the try-it nudge leads with `/orbit:architect <name>`. The per-change strip is unchanged.
- **Mirrors follow:** `orbit-conventions`' example payload and the archive body's example carry the new archive
  string, and `orbit-run-summary-emit` stops naming the archive emit as a prose value.

Out of scope: the docs (stage `docs-refinement`), the CLI's OpenSpec wording (stage `cli-says-orbit`), and the D-arc's
unratified stages (Considered & out in explore.md).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-architect`: `Architect is a stance, never a gatekeeper` is restated for the architect-first canonical flow;
  ADDED `Start surfaces name the architect workflow first`. The Purpose is edited in place.
- `orbit-orientation`: the idle rungs gain a next line. Four requirements are carried: `Bare orbit status renders the
  current sprint`, `Continuity predicate and degradation ladder`, `Next-recommendation sourcing is time-shifted,
  never live` (a second exception) and `JSON output for both tiers`.
- `orbit-emit-composition`: `Atomic next_recommended — pre-computable and post-write classes`. Archive's
  recommendation is no longer a constant; it is composed from the archived change's metadata.
- `orbit-run-summary-emit`: `Named-mode explore recommendation by maturity` stops naming the archive emit as a prose
  value.
- `orbit-conventions`: `Internal-run JSON summary format`'s example carries the new archive string.
- `orbit-onboard`: `Canonical-flow walkthrough section` and `Try-it nudge section` put architect first.

## Size

- capabilities: one rule (R-rda-2) spread over the six specs that each own one surface it changes; splitting would ship a half architect-first orbit (Sal, 2026-10-14)

## Impact

- **`src/commands/workflow/status.ts`, `src/core/orientation.ts`:** the idle next line, text and JSON.
- **`src/core/emit-composition.ts`:** archive's `next_recommended`, from the archived change's metadata.
- **`src/core/init.ts`, `src/core/update.ts`, `src/ui/welcome-screen.ts`:** the start hints.
- **`src/core/templates/workflows/architect.ts`, `onboard.ts`, `archive-change.ts`:** the stance paragraph, the onboard
  flow and nudge, and the archive example. The generated surface is refreshed, and the pinned template hashes move.
- **Tests:** a start-surfaces test (G1's strict rows), the idle-status cases, the archive next by citation, and the
  existing tests that pin the old strings.
- **No new capability:** baseline capabilities stay at 30.
