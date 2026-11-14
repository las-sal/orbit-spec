> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: program-signoff

## Premise

Stage `program-brief` of `automate-dev-flow`, its fourth change: the PER-PROGRAM sign-off. The stage's third change,
`program-brief`, was divided when it measured about six capabilities against a ceiling of three (D-pb-11 and D-pb-15 in
`orbit/changes/archive/2026-11-14-program-brief/explore.md`): it carries the per-change sign-off — the sign-off setting's absent, `off` and
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
| `program`, `pr: per-architecture` | the program's completion and the program PR's READY flip wait for a sign-off over the program brief (D-ps-5) |
| `program`, `pr: per-proposal` | the program's completion waits (D-ps-5); the brief says each change has already merged |
| `program`, `pr: never` | the program's completion waits (D-ps-5); the brief says the work has already landed, with no PR |
| `program`, a change carrying an account | the account is selected and read at the system review, as under `change` (D-pb-13 in `orbit/changes/archive/2026-11-14-program-brief/explore.md`) |
| `program`, a change's archive | nothing waits at the archive; the change's brief is saved as under every value |
Closure: DERIVED — `PR_MODES`' three (`src/core/project-config.ts`), plus the two per-change surfaces the value reaches (the reading and the archive)
Moves:
- READ: applied — D-pb-1's `program` rows and D-pb-5's `program` row in `orbit/changes/archive/2026-11-14-program-brief/explore.md`; `PR_MODES` is `never`, `per-proposal`, `per-architecture`, absent meaning `never`
- ENUMERATE: applied — this table; the archive row is new beside D-pb-1, stating that a program sign-off holds no change's archive
- COHERE: applied — `program-brief` reads `program` as unrecognized (D-pb-12); this change makes it read, so the warning for it goes
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — under `pr: per-proposal` and `never` every change has landed before the sign-off, so the brief says so rather than implying a gate it is not
- CONFORM: applied — R-adf-1 (off by default), R-adf-2 as amended, R-adf-6, R-adf-7, R-adf-12
- FEASIBILITY: not applied — one more value of one key
- CONSUME: applied — the architect flow's hold (D-ps-5), the reading's selection (D-pb-13's filter gains the value)
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
- READ: applied — D-pb-3 in `orbit/changes/archive/2026-11-14-program-brief/explore.md`, carried whole; `orbit-pr-lifecycle`'s arc-done readout (surfaced by any architect invocation that observes arc-done, never by a stored flag); `orbit-architect`'s `Completion-ratification flow`
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
- COHERE: applied — the hold (D-ps-5) reads the latest saved copy, so the save runs before the hold in the same session
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a copy saved once, at the first finish, goes stale when a later change cites the doc; the hash comparison saves a new copy then
- CONFORM: applied — R-adf-7 (written in every mode), R-adf-9 (a record a default session writes), G0 (nothing shown at the defaults)
- FEASIBILITY: not applied — one render per architect session on a finished program
- CONSUME: applied — D-ps-5's hold; the `signoff` record citing the copy; first-run's closing review grading G5 from saved copies
- INVOKE: applied — at each architect session on the doc

### D-ps-5 — under `program`, the sign-off is part of the program's arc-done
Domain: each `pr:` mode under a `program` sign-off, and each act before arc-done that the hold could sit at
| member | covered by |
|---|---|
| `pr: per-architecture` | arc-done waits for the sign-off; the arc-done readout asks for it first and surfaces the READY flip only once it is signed |
| `pr: per-proposal` | arc-done waits for the sign-off; the brief says every change has already merged |
| `pr: never` | arc-done waits for the sign-off; the brief says the work has already landed, with no PR |
| the last stage's ratification | offered as today: a sign-off holds no ratification |
| the closing architecture review and its walk | run before the sign-off, so the records they write are in the copy the user signs |
Closure: DERIVED — `PR_MODES`' three (`src/core/project-config.ts`), crossed with the acts that come before arc-done: the ratification the architect flow offers, and the closing review arc-done requires (R-d-3)
Moves:
- READ: applied — `orbit-pr-lifecycle`'s `Program PR (Shape A) semantics` (arc-done is every declared stage archived and the closing architecture review recorded; any architect invocation that observes it surfaces the remaining human acts); `orbit-architect`'s `Completion-ratification flow`; `buildProgramBrief` in `src/core/program-brief.ts` renders the doc's `decisions/` records and no stage state, so a ratification leaves the brief's text unchanged and a `--doc` record changes it
- ENUMERATE: applied — this table; the ratification row is where D-ps-2 held, and the closing-review row is why it moves
- COHERE: applied — the save (D-ps-3) runs in the same invocation before the hold reads the latest copy; the per-change hold's rule carries over, a sign-off covering the copy whose hash it records
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a sign-off before the closing review would cover a copy its walk's records make stale, asking the user twice under `per-architecture`; a copy saved after the sign-off asks again only while the program PR is a draft (D-ps-7)
- CONFORM: applied — R-adf-2 as amended ("holding the program's completion"), R-adf-1 (nothing waits with the setting absent), R-d-3, R-adf-14
- FEASIBILITY: not applied — one more condition on an observed state
- CONSUME: applied — the architect flow's arc-done readout and `orbit pr program`'s human acts, the READY flip staying a human act; the driver will stop on it later
- INVOKE: applied — at each architect invocation that observes every declared stage archived and the closing review recorded

### D-ps-6 — a program's saved briefs and sign-offs live in per-doc folders of the architecture trail
Domain: each file the program sign-off writes or reads, and the folders beside them it leaves as they are
| member | covered by |
|---|---|
| a saved program brief | `orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md`, never overwritten |
| a program sign-off record | `orbit/architecture/.orbit-runs/signoff/<doc>/signoff-<TS>.json`, written with `--doc <doc>` and carrying `doc` |
| the record's citation of its copy | the copy's filename, which must be the latest in `brief/<doc>/`, and the SHA-256 orbit computes from its bytes |
| the doc's decision records | unchanged: the shared `decisions/` folder, each record naming its doc |
| a change's saved briefs and sign-offs | unchanged: the change trail's `brief/` and `signoff/` folders |
Closure: SOURCED — the files `orbit brief <doc> --save` and `orbit emit signoff --doc <doc>` write and `orbit brief <doc> --hold` reads, beside the shipped folders in `src/core/signoff.ts` and `src/core/program-brief.ts` they sit next to
Moves:
- READ: applied — `latestSavedCopy` and `computeHold` in `src/core/signoff.ts` read one folder's latest copy and latest record; `buildProgramBrief` in `src/core/program-brief.ts` reads only `decisions/` from the architecture trail, filtered by `doc`
- ENUMERATE: applied — this table
- COHERE: applied — the program brief renders neither `brief/` nor `signoff/`, so saving a copy or writing a sign-off never changes the text being signed
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a doc that is renamed leaves its copies and records under the old name, and the renamed doc has none, so the next session that finds it finished saves a copy and asks; a doc name is a single name, so `<doc>` cannot reach outside the trail
- CONFORM: applied — `orbit-architecture-engine`'s `Architecture trail location`; the change trail's layout shipped by `program-brief`
- FEASIBILITY: not applied — two folders per doc
- CONSUME: applied — D-ps-5's hold and D-ps-7's re-ask read the latest of each folder; first-run's closing review grades G5 from the saved copies
- INVOKE: applied — at each save and each sign-off on a doc

### D-ps-7 — a copy saved after the sign-off asks again only while the program PR is a draft
Domain: a copy saved after the latest sign-off, by `pr:` mode and the program PR's observed state
| member | covered by |
|---|---|
| `pr: per-architecture`, the program PR a draft | asks again; the READY flip is surfaced only once the new copy is signed |
| `pr: per-architecture`, the PR's state unverified | asks again, since nothing is known of the flip |
| `pr: per-architecture`, the PR ready, merged or closed | saved; asks nothing; arc-done stays observed |
| `pr: per-architecture`, no program PR found | saved; asks nothing: there is no flip to hold |
| `pr: per-proposal` | saved; asks nothing; arc-done stays observed |
| `pr: never` | saved; asks nothing; arc-done stays observed |
| the latest sign-off a decline | not a later copy: the program is held, and the next session asks again |
Closure: DERIVED — `PR_MODES`' three, crossed under `per-architecture` with the state `orbit pr program` reports (`draft`, `ready`, `unverified`, or no PR found, a merged or closed PR reading as no longer draft), plus the decline edge the per-change hold already has
Moves:
- READ: applied — `orbit-pr-lifecycle`'s `` `orbit pr program` computes the architect readout's PR facts `` (`pr.state` is `draft`, `ready` or `unverified`; the readout is never suppressed); `computeHold` in `src/core/signoff.ts` counts only a latest `signed` record whose hash equals the latest copy's
- ENUMERATE: applied — this table
- COHERE: applied — the re-ask holds exactly what D-ps-5 holds and nothing more: under `per-architecture` the flip, elsewhere nothing outward remains once signed
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — without the rule, a merged program would ask for a sign-off at every later session whose records changed its brief, holding nothing
- CONFORM: applied — R-adf-2 as amended, R-adf-1, and orbit's report-and-record stance (one prompt where it holds something, never a nag)
- FEASIBILITY: not applied — one read of a state the readout already observes
- CONSUME: applied — the architect flow's arc-done readout; `orbit pr program`'s human acts
- INVOKE: applied — at each architect invocation on a doc whose program is done and whose brief has a copy newer than its latest sign-off

## Decisions

- **2026-11-13 — D-ps-1: the sign-off setting's `program` value** D-pb-1's `program` rows and D-pb-5's `program` row,
  carried here when `program-brief` was divided (D-pb-15 in `orbit/changes/archive/2026-11-14-program-brief/explore.md`): once per
  program, over the program brief, holding the program's completion under every `pr:` mode (D-ps-5); under `program` the
  account is read like any record, as under `change`; no change's archive waits.
  Kind: rule
- **2026-11-13 — D-ps-2: a `program` sign-off holds the program's completion in every `pr:` mode** D-pb-3, carried whole
  (D-pb-15): once every declared stage's changes are archived, the architect flow offers no ratification of the last
  stage until the program brief is signed; under `pr: per-architecture` it also holds the program PR's READY flip. Under
  `per-proposal` and `never` the work has already landed, and the brief says so.
  Kind: rule
  Disposition: superseded D-ps-5
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
- **2026-11-14 — D-ps-5: under `program`, the sign-off is part of the program's arc-done** The user chose B: once every
  declared stage is archived and the closing architecture review is recorded, the program is not done until the user
  signs the latest saved program brief. The architect invocation that observes the rest of arc-done saves the brief
  (D-ps-3), then asks; under `pr: per-architecture` the program PR's READY flip is surfaced only once it is signed. No
  stage's ratification waits. Supersedes D-ps-2, which held the last stage's ratification: the closing review and its
  walk come after that ratification and write records the program brief renders, so the user would sign a brief the
  program's own closing review had not yet graded, and under `per-architecture` sign twice. R-adf-2 is unchanged: arc-done
  is the program's completion it names.
  Kind: rule
- **2026-11-14 — D-ps-6: a program's saved briefs and sign-offs live in per-doc folders of the architecture trail** The
  user took the standing recommendation: copies at `orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md`, records at
  `orbit/architecture/.orbit-runs/signoff/<doc>/signoff-<TS>.json`, each record written with `--doc <doc>`, carrying its
  doc and citing the copy by filename, with orbit adding the copy's SHA-256, as the change record does. A saved copy is
  markdown with no field to name its doc, and per-doc folders let the shipped latest-copy and latest-sign-off reads run
  unchanged. The doc's decision records stay in the shared `decisions/` folder.
  Kind: rule
- **2026-11-14 — D-ps-7: a copy saved after the sign-off asks again only while the program PR is a draft** The user took
  the standing recommendation: under `pr: per-architecture`, while the program PR is still a draft, or its state cannot be
  read, a later copy asks again, since the READY flip it holds has not happened; under `per-proposal` and `never`, and
  once the program PR is no longer a draft, a later copy is saved, asks nothing, and arc-done stays observed. As in the
  per-change hold, only a latest record of `signed` whose hash equals the latest copy's counts as signed; a decline holds.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-12 — Refusing or warning on `program` unless `pr: per-architecture`:** out (D-pb-3, carried as D-ps-2). It
  would make one setting depend on another; holding completion works under every mode.
- **2026-11-14 — Signing at the last stage's ratification (D-ps-2, option A):** out (D-ps-5). The closing architecture
  review comes after it, so the signed brief would not include that review, and its walk's records would make the copy
  stale, asking again at the READY flip.
- **2026-11-14 — Signing at ratification and letting later records not void the signature (option C):** out (D-ps-5).
  The record's hash would no longer mean the text the user read, unlike the per-change sign-off `program-brief` shipped.

## References

- `orbit/changes/archive/2026-11-14-program-brief/explore.md` — D-pb-1, D-pb-3, D-pb-5, D-pb-8, D-pb-10 (the carried rules), D-pb-11 and D-pb-15 (the division), D-pb-12 (`program` unrecognized until this change).
- `orbit/changes/archive/2026-11-13-brief-render/explore.md` — D-br-3 and D-br-5 (the program brief's save).
- `orbit/architecture/automate-dev-flow.md` — R-adf-2 as amended, R-adf-7, R-adf-14; G5; stage program-brief.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — `Program PR (Shape A) semantics` (arc-done, R-d-3; the readout and the program PR's READY flip, a human act) and `` `orbit pr program` computes the architect readout's PR facts ``.
- `src/core/signoff.ts` — the shipped per-change hold (`computeHold`, `latestSavedCopy`) and `SIGNOFF_DOC_REFUSAL`, which names this change; `src/commands/brief.ts` refuses `--save` and `--hold` with a doc the same way; `src/core/decision-records.ts` takes the account only when the setting is `change`.
- `src/core/program-brief.ts` — `buildProgramBrief`: the citing changes by stage, then the doc's `decisions/` records; no stage state.
- `orbit/specs/orbit-architect/spec.md` — `Completion-ratification flow`.
- `orbit/specs/orbit-program-brief/spec.md` — `A change's brief is saved, never overwritten` (`--save` with a doc).
