> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: program-brief

## Premise

Stage `program-brief` of `automate-dev-flow`: the engine composes the program brief from the trail — what was built,
the capabilities and requirements added or changed, new terms and seams, the ledger, stops and tripwires fired, and
deviations from the charter — in plain language, written in every mode (R-adf-7). The sign-off seam follows R-adf-2
(autonomous: once per program, over the brief, before the program PR goes READY; seam-chained: at each stage's
archive), gated by its own setting, defaulting to today's behaviour (R-adf-1, R-adf-6). G5 grades the brief at
first-run: reading only the brief, the user can say what was built, the new terms and seams, and every ledger
judgement, and signs off or declines without opening another artifact.

What this exploration must settle: what the brief's unit and sources are, which parts the engine can compute from
the trail and which need authored prose, where the brief is written and when, what the sign-off setting is and what
it holds under each regime, and what a sign-off leaves on the record.

## Mechanism

### D-pb-1 — how often the user signs off is its own setting, off by default
Domain: each value of the sign-off setting against each `pr:` mode (the mode decides what a sign-off can hold)
| member | covered by |
|---|---|
| absent / off, any `pr:` mode | nothing waits on a sign-off — today's behaviour (R-adf-1); the brief is still written (R-adf-7) |
| `change`, `pr: never` | the change's archive waits for a sign-off over that change's brief |
| `change`, `pr: per-proposal` | the archive waits, and with it the per-change READY flip the archive tail performs |
| `change`, `pr: per-architecture` | the archive waits; the program PR is untouched by stage archives already |
| `program`, `pr: per-architecture` | the program PR's READY flip waits for a sign-off over the program brief at arc-done (the flip is the user's act today, so the hold is what the arc-done readout reports, and what the driver later obeys) |
| `program`, `pr: per-proposal` | the program's completion waits (D-pb-3); the brief says each change has already merged |
| `program`, `pr: never` | the program's completion waits (D-pb-3); the brief says the work has already landed, with no PR |
Closure: DERIVED — the setting's three values crossed with `PR_MODES`' three (`src/core/project-config.ts`), every cell listed
Moves:
- READ: applied — R-adf-1, R-adf-2, R-adf-6 and R-adf-7 read in the architecture doc; `PR_MODES` is `never`, `per-proposal`, `per-architecture`, absent meaning `never`; `orbit-pr-lifecycle`'s `Generalized READY rule` makes the program PR's flip a human act
- ENUMERATE: applied — this table; the two `program` cells without a program PR were open until D-pb-3 covered them
- COHERE: applied — with the `chain` map granting `archive`, a `change` sign-off must still stop the chain before archive, so the chain's refusal reasons gain one; a granted arrival records `consent: "setting"`, which a sign-off does not replace
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — `program` under `pr: per-proposal` holds nothing that can still be undone, so a sign-off there is a reading, not a gate
- CONFORM: applied — R-adf-1 (off by default), R-adf-6 (its own key), R-adf-7 (the brief is written whatever the value), R-adf-2 amended at the user's word (stop `stop-2026-11-12T21-09-30Z.json` and its resolution)
- FEASIBILITY: not applied — one key with three values
- CONSUME: applied — consumers: the archive body, the chain resolver, the architect flow's arc-done readout, and later the driver
- INVOKE: applied — fires at each archive under `change`, and at arc-done under `program`

### D-pb-3 — a `program` sign-off holds the program's completion in every `pr:` mode
Domain: each `pr:` mode under which a `program` sign-off is owed
| member | covered by |
|---|---|
| `pr: per-architecture` | the last stage's ratification is not offered, and the program PR's READY flip is not surfaced as ready to run, until the program brief is signed |
| `pr: per-proposal` | the last stage's ratification is not offered until signed; the brief states that every change has already merged, so signing reads finished work |
| `pr: never` | the last stage's ratification is not offered until signed; the brief states that the work has already landed, with no PR |
Closure: SOURCED — `PR_MODES` in `src/core/project-config.ts`, absent meaning `never`
Moves:
- READ: applied — `PR_MODES`; `orbit-pr-lifecycle`'s arc-done readout (surfaced by any architect invocation that observes arc-done, never by a stored flag)
- ENUMERATE: applied — this table
- COHERE: applied — the hold sits in the architect flow, the one place that offers ratification and surfaces the READY flip, so the two holds under `per-architecture` are one check
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — under `per-proposal` and `never` the hold stops only the program being called complete, not any work landing; the brief says so rather than implying a gate it is not
- CONFORM: applied — R-adf-2 as amended (D-pb-1), R-adf-14 (a program runs on one PR, so `per-architecture` is the shape the hold is strongest in), R-adf-7
- FEASIBILITY: not applied — one check in the architect flow
- CONSUME: applied — the architect flow's ratification offer and arc-done readout read it; the driver will stop on it later
- INVOKE: applied — fires once every declared stage's changes are archived, at the next architect invocation

### D-pb-4 — the engine computes what the trail holds; the AI writes the rest as one record per change
Domain: the brief's sections, as the stage charter lists them
| member | covered by |
|---|---|
| what was built | authored: the change's account record, written when apply finishes |
| capabilities and requirements added or changed | computed: the archive record's `sync_specs` and the delta specs' requirement headers |
| new terms | computed: every record's `defines` list, the account's included |
| new seams | authored: the account record (a place the user is now asked, or a setting that now changes what happens) |
| the ledger | computed: the latest ledger entry of each chain |
| stops fired | computed: each stop with its resolution chain, open stops marked open |
| tripwires fired | computed once stage tripwires ships; until then the brief says they are not installed, never "none" |
| deviations from the charter | authored: the account record, rendered beside the computed signals (archive `warnings`, accepted judgement claims, declared size breaches) |
| records no reader checked | computed: `decision_records_unread` and the selection rule (the review spec's promise that the brief brings them to the user) |
Closure: SOURCED — the stage charter's list of what the brief holds, plus the unread records `orbit-review`'s named limit assigns to it
Moves:
- READ: applied — the charter's list; `orbit-decision-records`' selection rule (the latest record of each chain no system review has listed), so a record written when apply finishes is read at the system review; the archive record's fields in `2026-11-12-chained-review-commit`
- ENUMERATE: applied — this table
- COHERE: applied — the system walk can change what was built after the reading; the walk then replaces the account, and the replacement reaches no reader before archive (D-dr-2's named limit), which the brief's unread row shows
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an authored deviations field can leave a deviation out; the computed signals render beside it so an omission shows against them
- CONFORM: applied — `orbit-decision-records`' plain-language rule (the account's fields join its table, as its residual asks for a new surface rendering record prose); R-adf-7; G5; G0 by R-adf-9 (the apply body gains an instruction to record something), with the reader held off the account at the defaults (D-pb-5)
- FEASIBILITY: not applied — one record per change
- CONSUME: applied — the brief renderer, the reading step's brief, the sign-off
- INVOKE: applied — the apply body's end, on every change whatever the settings (R-adf-7)

### D-pb-5 — the reader takes the account only when sign-off is on
Domain: the sign-off setting's values, for a change carrying an account
| member | covered by |
|---|---|
| absent / off | the account is written and left out of the reading's selection; the brief marks it unread; a change with no other record has no reading, as today |
| `change` | the account is selected like any record and read at the system review |
| `program` | the same as `change`: every change's account is read before the program brief is signed |
Closure: DERIVED — D-pb-1's three values
Moves:
- READ: applied — R-adf-11 (each default-on behaviour named in G0), R-adf-12 (setting-dependent behaviour allowed when the defaults are unchanged); the selection rule in `orbit-decision-records`
- ENUMERATE: applied — this table
- COHERE: applied — the archive's `decision_records_unread` count would include an account left out at the defaults; the brief's unread row and the count must agree on whether it counts (left to propose)
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a setting turned on after a change's system review leaves that account unread; the brief's unread row shows it
- CONFORM: applied — R-adf-11 and R-adf-12: no new G0 exception; the user's answer (stop `stop-2026-11-12T21-21-45Z.json` and its resolution)
- FEASIBILITY: not applied — one filter in the selection
- CONSUME: applied — `orbit decisions brief`'s selection, the system review's read list check, the archive's unread count
- INVOKE: applied — at every system review of a change carrying an account

### D-pb-6 — the brief is rendered on demand, saved where it is final, and a sign-off cites the saved copy
Domain: each moment the brief is produced or answered
| member | covered by |
|---|---|
| asked for at any time | `orbit brief <doc> [--change <name>]` renders it read-only to standard output, writing nothing, as `orbit decisions brief` does |
| a change archives, any setting | the archive saves that change's brief beside its records, with its hash (R-adf-7: written in every mode) |
| every declared stage's changes archived, any setting | the architect flow saves the program brief in the architecture trail, with its hash |
| the user signs | a new `signoff` record cites the saved brief by filename and hash and says `signed`; the hold lifts |
| the user declines | the `signoff` record says `declined` with the user's reason in plain words; the hold stays, and what happens next is the user's direction, as with a stop's answer |
| sign-off off | the brief is still saved; no `signoff` record is asked for or written |
Closure: DERIVED — the two units of D-pb-2 and D-pb-3 (a change, a program) crossed with render, save, sign and decline, the setting's off value included
Moves:
- READ: applied — `orbit decisions brief` renders read-only and is the only source of its brief (`orbit-decision-records`); R-adf-7
- ENUMERATE: applied — this table
- COHERE: applied — under `change` the archive both saves the brief and waits for the sign-off, so the save comes before the hold and the sign-off cites what was saved; a re-render after a declined change is fixed is a new saved copy with a new hash
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a sign-off citing only a brief's name could be over different text than the user read; the hash ties the record to the exact copy
- CONFORM: applied — R-adf-7; G0 by R-adf-9 (the archive gains an instruction to record something); `orbit-decision-records`' plain-language rule binds the decline's reason
- FEASIBILITY: not applied — one file per change and one per program
- CONSUME: applied — the archive hold and the architect hold read the `signoff` record; the driver will later; first-run's closing review grades G5 from the saved briefs
- INVOKE: applied — at each archive, at arc-done, and on the user's answer

## Decisions

- **2026-11-12 — D-pb-1: how often the user signs off is its own setting, off by default** The user (stop
  `stop-2026-11-12T21-09-30Z.json` and its resolution): the frequency is a setting separate from the regime, with two
  choices — at every change's archive, over that change's brief, or once at the end of a whole program, before its
  pull request is made ready — and absent means no sign-off, as today. This amends R-adf-2 ("granularity follows the
  regime"); the amendment is recorded at the next architect session. The key's name and spelling are not yet locked.
  Kind: rule
- **2026-11-12 — D-pb-2: "sign off at each explore" means each change's archive** The user's own reading: each
  exploration becomes one change, and the sign-off is over what that change built, before it archives — not an
  approval of the plan before apply. At `change` frequency the brief's unit is the one change.
  Kind: scope
- **2026-11-12 — D-pb-3: a `program` sign-off holds the program's completion in every `pr:` mode** The user took the
  AI's recommendation: once every declared stage's changes are archived, the architect flow offers no ratification
  of the last stage until the program brief is signed; under `pr: per-architecture` it also holds the program PR's
  READY flip. Under `per-proposal` and `never` the work has already landed, and the brief says so. Chosen over
  refusing `program` unless `pr: per-architecture`, which would make one setting depend on another.
  Kind: rule
- **2026-11-12 — D-pb-4: the engine computes what the trail holds; the AI writes the rest as one record per change**
  Settled by the AI (method). Of the charter's sections, three cannot be computed — what was built, new seams,
  deviations from the charter — so each change carries one new record, its account, written when apply finishes,
  with those three as plain fields under `orbit-decision-records`' plain-language rule. Written then, the existing
  reading step reads it at the system review. Everything else in the brief is computed from the trail. Chosen over
  writing the three fields into the archive record, which no reader would check before the user signs. The record's
  name is not yet locked.
  Kind: rule

- **2026-11-12 — D-pb-5: the reader takes the account only when sign-off is on** The user (stop
  `stop-2026-11-12T21-21-45Z.json` and its resolution), taking the AI's recommendation: with sign-off off the account is
  written but left out of the reading, and the brief marks it unread, so G0 holds by R-adf-12 with no new exception.
  Chosen over reading it on every change and naming that as G0's third exception.
  Kind: rule

- **2026-11-12 — D-pb-6: the brief is rendered on demand, saved where it is final, and a sign-off cites the saved copy**
  The user took the AI's recommendation: `orbit brief` renders it read-only; each archive saves the change's brief and
  arc-done saves the program brief, in every mode (R-adf-7); a new `signoff` record cites the saved copy by name and
  hash and says signed or declined; a decline keeps the hold, records the user's reason, and what happens next is the
  user's direction. The command's and record's names are not yet locked.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-12 — Sign-off once per stage (at stage ratification, or at the stage's last change's archive):** out. The
  user chose every change and once per program; a stage's end is known to the engine only at ratification, and
  neither chosen value needs it. A third value could add it later.
- **2026-11-12 — Refusing or warning on `program` unless `pr: per-architecture`:** out (D-pb-3). It would make one
  setting depend on another; holding completion works under every mode.
- **2026-11-12 — A sign-off on the plan before apply:** out. The user meant the sign-off on what a change built
  (D-pb-2); approving the plan at propose is a different seam nobody asked for.

## References

- `orbit/architecture/automate-dev-flow.md` — R-adf-1, R-adf-2, R-adf-6, R-adf-7, R-adf-14; G5; stage program-brief.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — `Generalized READY rule` and the arc-done readout (the program PR's flip is the user's act).
- `orbit/specs/orbit-decision-records/spec.md` — `Decision records are written for a reader who knows only the architecture` (its table names the program brief as a reader of the ledger; its residual names a new surface rendering record prose).
- `orbit/specs/orbit-review/spec.md` — the reading step's named limit: the program brief brings unread records to the user at sign-off.
- `src/core/chain.ts` — `CHAIN_WHY`, the chain's refusal reasons a held archive would join.
- `orbit/changes/archive/2026-11-12-chained-review-commit/.orbit-runs/archive-2026-11-12T19-46-14Z.json` — a sample of what an archive record carries (`sync_specs`, `warnings`, `judgements`, `decision_records_unread`).
