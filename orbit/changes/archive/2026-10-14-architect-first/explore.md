> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: architect-first

## Premise

Stage `architect-first` of `refine-documentation-and-architect`. R-rda-1 makes orbit architect-first, and R-rda-2
scopes it: what orbit SUGGESTS changes (the canonical flow becomes architect → explore → propose → …, and every
surface that suggests where to start names `/orbit:architect <name>` first; a change that cites a program points at
that program's next stage), while what orbit REQUIRES does not (an architect session stays optional, and nothing flags
work that skipped it). This exploration works out what each suggesting surface should say and how G1's test reads
them.

## Mechanism

### D-af-2 — idle `orbit status` renders the last recorded next, or architect
Domain: what the newest emit (the LAST band's record) offers when no live workstream exists, on rungs 2 and 3
| member | covered by |
|---|---|
| a LAST emit whose `next_recommended` begins with `/orbit:` | `Ready when you are: <it, verbatim>` |
| a LAST emit whose `next_recommended` names no command (e.g. a project walk's "No markers remain in scope; …") | `Ready when you are: /orbit:architect <name>` — a constant, never a reading of the prose |
| a LAST emit whose `next_recommended` is the empty string (an architect payload with no `handoff.next_command`) | the same constant |
| no emit anywhere (a fresh `orbit init`) | the same constant |
| rung 3 (no parseable doc) | the upstream no-active-changes message, then the line by the rows above |
Closure: SOURCED — LAST is spine-valid by construction (`next_recommended` is a string, orientation.ts's spine check), so a string beginning `/orbit:`, another non-empty string, the empty string, and no record exhaust it; the rungs are the ladder's three, of which rung 1 is not idle
Moves:
- READ: applied — the ladder and the time-shifted sourcing requirement read in `orbit-orientation`; the spine check requires a string `next_recommended`; bare idle status run on 2026-10-14 printed no next line
- ENUMERATE: applied — this table
- COHERE: applied — the constant fallback is the one fresh string the CLI writes; `Next-recommendation sourcing is time-shifted, never live` must name it as a second exception beside the concluded rule, or the two contradict
- EXECUTE: applied — on today's trail LAST is the architect emit of 2026-10-14, whose next `/orbit:explore architect-first` begins with `/orbit:` and would render verbatim
- FALSIFY: applied — a prose next rendered under the eligibility label would assert an eligibility nothing has (the concluded rule's reason), hence the `/orbit:` test rather than "render whatever was recorded"
- CONFORM: applied — R-rda-2 (suggest architect, require nothing); the read-only and no-artifact-parsing clauses of `orbit-orientation` (LAST is already read)
- FEASIBILITY: not applied — one line from a record already loaded
- CONSUME: applied — `--json` must carry the same `next` so a cold session reads it without the text render
- INVOKE: applied — bare `orbit status` on rungs 2 and 3, the first command a cold session runs

### D-af-3 — the archive emit's next is chosen by the change's citation
Domain: the archived change's `architecture:` citation, as read from its `.openspec.yaml` in the archived directory
| member | covered by |
|---|---|
| no citation | `/orbit:architect <name> — plan the next piece of work, or /orbit:audit-drift for a project-wide drift check` |
| a citation whose doc file `orbit/architecture/<doc>.md` exists | `/orbit:architect <doc> — review stage <stage> and take up the program's next stage, or /orbit:audit-drift …` |
| a citation whose doc file is missing (renamed or deleted after propose) | the no-citation form |
| unreadable metadata | the no-citation form; the archive is not refused over its recommendation |
Closure: SOURCED — the change-metadata schema makes `architecture` optional with `doc` and `stage` strings, so present-and-resolving, present-and-dangling, absent and unreadable exhaust it
Moves:
- READ: applied — the archive emit resolves `changeDir` to the archived directory (`emit-composition.ts`, the archived resolution), so the metadata is readable there; the current string is in case `archive`
- ENUMERATE: applied — this table
- COHERE: applied — the next now begins with `/orbit:`, so D-af-2's first row renders it after the change leaves the live set
- EXECUTE: applied — public-readiness (cited `update-gh-documentation`/`public-readiness`) would have recommended `/orbit:architect update-gh-documentation`, the session Sal actually ran next
- FALSIFY: applied — "ratify <stage>" would be false while another change still cites the stage, so the text says "review"; the architect session's own offer decides ratification
- CONFORM: applied — R-rda-2's "a change that cites a program points at that program's next stage"; supersedes the post-archive "recommend forward, not architect" practice; no-chaining (it recommends, invokes nothing)
- FEASIBILITY: not applied — one metadata read and one file-existence check
- CONSUME: applied — `orbit-conventions`' example payload and the archive body's example restate the string and must follow it; orientation's LAST band reads it verbatim
- INVOKE: applied — every `orbit emit archive`

### D-af-4 — G1 is strict where orbit composes a next, prose elsewhere
Domain: the start surfaces D-af-1 measured
| member | covered by |
|---|---|
| the archive emit's next | strict — names `/orbit:architect` and no `/orbit:explore` or `/orbit:new`; asserted by test |
| idle `orbit status` | strict — D-af-2's constant; asserted by test |
| `orbit init`'s start hint | strict — asserted by test |
| `orbit update`'s command list | strict for its start line; the list may still name `/orbit:new` as a command, not as where to start |
| the welcome screen | strict for its start line, as above |
| the `orbit-architect` stance clause and body | prose — states the new canonical flow and that architect is never required |
| the onboard body | prose — architect first; explore and new described as the path for a one-off fix, after architect |
| the docs | prose — stage `docs-refinement`'s |
Closure: BOUNDED — the set is D-af-1's sweep, which matched the command names and "canonical flow"
Residual kind: a surface that steers new work to explore or new without naming either command (e.g. "start by thinking it through")
Residual method: grep the generated bodies and the CLI's user-visible strings for "start", "begin", "first change" and "new work" at apply, and classify each hit against this table
Moves:
- READ: applied — each member's file and line read in D-af-1's sweep
- ENUMERATE: applied — this table, from D-af-1
- COHERE: applied — "names architect first" (R-rda-2) and "names no other start" (G1) meet at the strict rows, and prose rows may name others only after architect
- EXECUTE: not applied — the test is apply's; its assertions are the strict rows
- FALSIFY: applied — a check on the string `/orbit:explore` alone misses a reworded start; the residual covers it
- CONFORM: applied — R-rda-2 (never required: prose may keep the one-off path), R-rda-4's G1
- FEASIBILITY: not applied — a handful of string assertions
- CONSUME: applied — `docs-refinement` takes the prose rows for the docs, so its pages follow this split
- INVOKE: applied — the test runs in `npm test`, and so in CI

## Decisions

- **2026-10-14 — D-af-1: the surfaces that suggest where new work starts (measured)** A sweep of `src/`,
  `orbit/specs/` and the docs for `/orbit:explore`, `/orbit:new` and "canonical flow" found these:
  Kind: fact
  - the archive emit's `next_recommended` (`src/core/emit-composition.ts`, case `archive`), mirrored in
    `orbit-conventions`' example and the archive body's example (`src/core/templates/workflows/archive-change.ts`);
  - idle `orbit status`, which on degradation rung 2 renders the `--full` view with NO `Ready when you are:` line,
    and on rung 3 the upstream no-active-changes message (`orbit-orientation`'s `Continuity predicate and degradation
    ladder`; `src/commands/workflow/status.ts`);
  - the `orbit-architect` stance clause (`Architect is a stance, never a gatekeeper`) and its body mirror
    (`src/core/templates/workflows/architect.ts`, "Never a gatekeeper");
  - the onboard body (`src/core/templates/workflows/onboard.ts`: the 9-phase canonical flow starting at explore, and
    "run `/orbit:explore <your-change-name>`" as the first recommendation), owned by `orbit-onboard`;
  - the CLI's own start hints: `orbit init` prints `Start your first change: /orbit:new "your idea"`
    (`src/core/init.ts`), `orbit update` lists `/orbit:new  Start a new change` (`src/core/update.ts`), and the
    welcome screen lists `/orbit:new  Create a change` (`src/ui/welcome-screen.ts`);
  - the docs (README, `docs/workflows.md`, `docs/getting-started.md`, `docs/concepts.md`), which are stage
    `docs-refinement`'s, not this one's.
  Not a start surface: the per-change strip `explore → propose → review ⟲ → apply → review ⟲ → archive` (a change's
  own lifecycle, below the program tier), explore's maturity rungs (they continue a named exploration), and
  address-reviews' REDESIGN route (it reroutes existing work).

- **2026-10-14 — D-af-2: idle `orbit status` gives a next (settles Q-af-1, Sal)** On rungs 2 and 3 it renders the
  LAST emit's recorded `next_recommended` under `Ready when you are:` when that string begins with `/orbit:`, and
  `/orbit:architect <name>` otherwise or when no emit exists. Rung 3's message gains the line.
  Kind: rule
- **2026-10-14 — D-af-3: the archive emit's next follows the citation (settles Q-af-2, Sal)** A change citing a
  program whose doc exists recommends `/orbit:architect <doc>` to review the stage and take up the next one; any
  other change recommends `/orbit:architect <name>`. Both begin with the command and keep `/orbit:audit-drift` as an
  alternative. This retires the post-archive "recommend forward, not architect" practice.
  Kind: rule
- **2026-10-14 — D-af-4: G1 is strict for composed nexts and CLI hints, prose elsewhere (settles Q-af-3, Sal)** The
  archive next, idle status and the CLI's start hints name architect and no other start, under test; the onboard body,
  the architect body and the docs may describe explore and new as the one-off path, after architect.
  Kind: rule
- **2026-10-14 — D-af-5: the CLI start hints are this stage's (settles Q-af-4, Sal)** `orbit init`'s, `orbit update`'s
  and the welcome screen's start lines change here; `cli-says-orbit` takes only the OpenSpec wording.
  Kind: scope
- **2026-10-14 — D-af-6: onboard shows architect as the step before the per-change flow (settles Q-af-5, Sal)** The
  per-change strip `explore → … → archive` is unchanged.
  Kind: scope

## Open questions

## Considered & out

- **Changing the per-change strip** (2026-10-14) — out: the strip tracks one change's lifecycle, below the program
  tier, so architect has no place on it (D-af-6).
- **Clearing the D-arc's five unratified stages here** (2026-10-14) — out: `d2-architect` … `d6-pr-lifecycle` show
  in every `orbit status` WAITING band, but ratifying them is an `/orbit:architect d-arc-arbitered-flow` session,
  Sal's to run, not this stage's work.

## References

- `orbit/architecture/refine-documentation-and-architect.md` — R-rda-1, R-rda-2, G1
- `orbit/specs/orbit-architect/spec.md` — `Architect is a stance, never a gatekeeper`
- `orbit/specs/orbit-orientation/spec.md` — degradation ladder; time-shifted next sourcing
- `orbit/specs/orbit-onboard/spec.md` — the canonical-flow diagram and the first recommendations
- `src/core/emit-composition.ts` — archive `next_recommended`
