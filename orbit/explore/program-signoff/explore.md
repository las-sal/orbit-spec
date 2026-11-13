> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: program-signoff

## Premise

Stage `program-brief` of `automate-dev-flow`, its fourth change: the PER-PROGRAM sign-off. The stage's third change,
`program-brief`, was divided when it measured about six capabilities against a ceiling of three (D-pb-11 and D-pb-15 in
`orbit/explore/program-brief/explore.md`): it carries the per-change sign-off — the sign-off setting's absent, `off` and
`change` values, the reader taking the account under `change`, the `signoff` record and the archive's hold — and this
exploration carries the rest, proposed after it.

What this change builds: the setting's `program` value (R-adf-2 as amended: once per program, over the program brief,
holding the program's completion under every `pr:` mode and, under `pr: per-architecture`, the program PR's READY flip);
the program brief's save at the architect session that finds the program finished (R-adf-7: written in every mode); and
the program hold in the architect flow. Until it ships, `program-brief` reads a `program` value as unrecognized, with one
warning (D-pb-12).

What this exploration must settle: where the saved program brief and its `signoff` record are kept, and how the hold
reads them; what the architect session shows at the defaults (G0) and under `program`.

## Mechanism

### D-ps-1 — the sign-off setting's `program` value
Domain: the `program` value against each `pr:` mode, and the per-change surfaces it touches
| member | covered by |
|---|---|
| `program`, `pr: per-architecture` | the program's completion and the program PR's READY flip wait for a sign-off over the program brief (D-ps-2) |
| `program`, `pr: per-proposal` | the program's completion waits (D-ps-2); the brief says each change has already merged |
| `program`, `pr: never` | the program's completion waits (D-ps-2); the brief says the work has already landed, with no PR |
| `program`, a change carrying an account | the account is selected and read at the system review, as under `change` (D-pb-13 in `orbit/explore/program-brief/explore.md`) |
| `program`, a change's archive | nothing waits at the archive; the change's brief is saved as under every value |
Closure: DERIVED — `PR_MODES`' three (`src/core/project-config.ts`), plus the two per-change surfaces the value reaches (the reading and the archive)
Moves:
- READ: applied — D-pb-1's `program` rows and D-pb-5's `program` row in `orbit/explore/program-brief/explore.md`; `PR_MODES` is `never`, `per-proposal`, `per-architecture`, absent meaning `never`
- ENUMERATE: applied — this table; the archive row is new beside D-pb-1, stating that a program sign-off holds no change's archive
- COHERE: applied — `program-brief` reads `program` as unrecognized (D-pb-12); this change makes it read, so the warning for it goes
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — under `pr: per-proposal` and `never` every change has landed before the sign-off, so the brief says so rather than implying a gate it is not
- CONFORM: applied — R-adf-1 (off by default), R-adf-2 as amended, R-adf-6, R-adf-7, R-adf-12
- FEASIBILITY: not applied — one more value of one key
- CONSUME: applied — the architect flow's hold (D-ps-2), the reading's selection (D-pb-13's filter gains the value)
- INVOKE: applied — read at each architect session, each system review's reading step and each archive

### D-ps-2 — a `program` sign-off holds the program's completion in every `pr:` mode
Domain: each `pr:` mode under which a `program` sign-off is owed
| member | covered by |
|---|---|
| `pr: per-architecture` | the last stage's ratification is not offered, and the program PR's READY flip is not surfaced as ready to run, until the program brief is signed |
| `pr: per-proposal` | the last stage's ratification is not offered until signed; the brief states that every change has already merged, so signing reads finished work |
| `pr: never` | the last stage's ratification is not offered until signed; the brief states that the work has already landed, with no PR |
Closure: SOURCED — `PR_MODES` in `src/core/project-config.ts`, absent meaning `never`
Moves:
- READ: applied — D-pb-3 in `orbit/explore/program-brief/explore.md`, carried whole; `orbit-pr-lifecycle`'s arc-done readout (surfaced by any architect invocation that observes arc-done, never by a stored flag); `orbit-architect`'s `Completion-ratification flow`
- ENUMERATE: applied — this table
- COHERE: applied — the hold sits in the architect flow, the one place that offers ratification and surfaces the READY flip, so the two holds under `per-architecture` are one check; it reads the copy D-ps-3 saves in the same session
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — under `per-proposal` and `never` the hold stops only the program being called complete, not any work landing; the brief says so
- CONFORM: applied — R-adf-2 as amended, R-adf-14 (one PR per program, so `per-architecture` is where the hold is strongest), R-adf-7
- FEASIBILITY: not applied — one check in the architect flow
- CONSUME: applied — the architect flow's ratification offer and arc-done readout; the driver will stop on it later
- INVOKE: applied — fires once every declared stage's changes are archived, at the next architect invocation

### D-ps-3 — the program brief is saved at the architect session that finds the program finished
Domain: each architect session on a doc, by the program's state and its saved copies
| member | covered by |
|---|---|
| every declared stage finished (complete, ended, or all its citing changes archived), no saved program brief | saves the program brief with its hash; at the defaults it says nothing about it |
| every declared stage finished, a fresh render's hash equal to the latest saved copy's | saves nothing |
| every declared stage finished, a fresh render's hash different (a change archived or a record written since) | saves a new copy; the latest is the program's brief |
| a declared stage not finished | saves nothing |
| the program brief cannot be rendered whole | saves nothing; at the defaults the failure is recorded and not shown; under `program` the session says so, and the hold stays with nothing to sign |
Closure: DERIVED — whether the program is finished, crossed with whether a saved copy exists and whether its hash matches a fresh render, plus the render's failure
Moves:
- READ: applied — D-br-3's and D-br-2's program rows in `orbit/changes/archive/2026-11-13-brief-render/explore.md`; `orbit-program-brief`'s `A change's brief is saved, never overwritten` (`--save` with a doc is a usage error naming this work)
- ENUMERATE: applied — this table
- COHERE: applied — the hold (D-ps-2) reads the latest saved copy, so the save runs before the hold in the same session
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a copy saved once, at the first finish, goes stale when a later change cites the doc; the hash comparison saves a new copy then
- CONFORM: applied — R-adf-7 (written in every mode), R-adf-9 (a record a default session writes), G0 (nothing shown at the defaults)
- FEASIBILITY: not applied — one render per architect session on a finished program
- CONSUME: applied — D-ps-2's hold; the `signoff` record citing the copy; first-run's closing review grading G5 from saved copies
- INVOKE: applied — at each architect session on the doc

## Decisions

- **2026-11-13 — D-ps-1: the sign-off setting's `program` value** D-pb-1's `program` rows and D-pb-5's `program` row,
  carried here when `program-brief` was divided (D-pb-15 in `orbit/explore/program-brief/explore.md`): once per
  program, over the program brief, holding the program's completion under every `pr:` mode (D-ps-2); under `program` the
  account is read like any record, as under `change`; no change's archive waits.
  Kind: rule
- **2026-11-13 — D-ps-2: a `program` sign-off holds the program's completion in every `pr:` mode** D-pb-3, carried whole
  (D-pb-15): once every declared stage's changes are archived, the architect flow offers no ratification of the last
  stage until the program brief is signed; under `pr: per-architecture` it also holds the program PR's READY flip. Under
  `per-proposal` and `never` the work has already landed, and the brief says so.
  Kind: rule
- **2026-11-13 — D-ps-3: the program brief is saved at the architect session that finds the program finished** From
  D-pb-10 and D-br-3's program row (D-pb-15): once every declared stage is finished, the architect session saves the
  program brief with its hash, and again only when a fresh render's hash differs from the latest saved copy; at the
  defaults it shows nothing about the save.
  Kind: rule
- **2026-11-13 — D-ps-4: this exploration is the stage's fourth change, divided from `program-brief`** The user chose
  the name and the AI's division (D-pb-15): this change builds the `program` value, the program brief's save and the
  program hold, about three capabilities (`orbit-program-brief`, `orbit-architect`, `orbit-pr-lifecycle`), proposed after
  `program-brief`, whose `signoff` record it extends to a program.
  Kind: scope

## Open questions

- **Where the saved program brief and its `signoff` record are kept, and how the record names its doc.** The architecture
  trail holds every doc's records in one folder, each naming its doc.
  Standing recommendation: `orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md` for the copies, and the `signoff`
  record written with `--doc <doc>` in the architecture trail, citing the copy by filename and hash, as `program-brief`'s
  change record does.

## Considered & out

- **2026-11-12 — Refusing or warning on `program` unless `pr: per-architecture`:** out (D-pb-3, carried as D-ps-2). It
  would make one setting depend on another; holding completion works under every mode.

## References

- `orbit/explore/program-brief/explore.md` — D-pb-1, D-pb-3, D-pb-5, D-pb-8, D-pb-10 (the carried rules), D-pb-11 and D-pb-15 (the division), D-pb-12 (`program` unrecognized until this change).
- `orbit/changes/archive/2026-11-13-brief-render/explore.md` — D-br-3 and D-br-5 (the program brief's save).
- `orbit/architecture/automate-dev-flow.md` — R-adf-2 as amended, R-adf-7, R-adf-14; G5; stage program-brief.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — the arc-done readout and the program PR's READY flip (a human act).
- `orbit/specs/orbit-architect/spec.md` — `Completion-ratification flow`.
- `orbit/specs/orbit-program-brief/spec.md` — `A change's brief is saved, never overwritten` (`--save` with a doc).
