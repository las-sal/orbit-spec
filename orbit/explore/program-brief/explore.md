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

Since 2026-11-13 (D-pb-11, D-pb-15) this exploration carries the PER-CHANGE sign-off — the setting's absent, `off` and
`change` values, the reader taking the account under `change`, the `signoff` record and the archive's hold — and keeps
the name `program-brief`; the per-program sign-off — the `program` value, the program brief's save at the architect
session and the program hold — is `orbit/explore/program-signoff/`, proposed after it. Before that (D-pb-7, D-pb-9) it
carried the third of the stage's three changes whole. The first two opened as their own
explorations, `orbit/explore/change-account/` and `orbit/explore/brief-render/`, carrying the rules D-pb-4 and D-pb-6
held here; both were archived on 2026-11-13, their explorations now at
`orbit/changes/archive/2026-11-13-change-account/explore.md` and `orbit/changes/archive/2026-11-13-brief-render/explore.md`. (R-adf-2 has since been amended to match D-pb-1, at the architect session of 2026-11-12.)

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

### D-pb-8 — a sign-off cites the saved brief, and a decline keeps the hold
Domain: each answer the user gives to a sign-off the setting asks for, and the setting's off value
| member | covered by |
|---|---|
| the user signs | a `signoff` record cites the saved brief by filename and hash and says `signed`; the hold lifts |
| the user declines | the `signoff` record says `declined` with the user's reason in plain words; the hold stays, and what happens next is the user's direction, as with a stop's answer |
| the brief changes after a decline (the work is fixed) | a new saved copy with a new hash; the next sign-off cites it |
| sign-off off | no `signoff` record is asked for or written |
Closure: DERIVED — the two answers a sign-off admits, the re-render that follows a decline, and the setting's off value
Moves:
- READ: applied — D-pb-6's sign and decline rows, which this entry carries; the saved copy and its hash are brief-render's (D-br-2)
- ENUMERATE: applied — this table
- COHERE: applied — under `change` the archive saves the brief (brief-render) before it waits for the sign-off (this change), so the record always has a copy to cite
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a sign-off citing only a brief's name could be over different text than the user read; the hash ties the record to the exact copy
- CONFORM: applied — `orbit-decision-records`' plain-language rule binds the decline's reason; R-adf-1 (off by default)
- FEASIBILITY: not applied — one record per sign-off
- CONSUME: applied — the archive hold and the architect hold read the latest `signoff` record; the driver will later
- INVOKE: applied — on the user's answer at a hold

### D-pb-12 — this change ships the sign-off setting's absent, `off` and `change` values
Domain: each value the sign-off setting can hold in this change, against each `pr:` mode
| member | covered by |
|---|---|
| absent or `off`, any `pr:` mode | nothing waits on a sign-off — today's behaviour (R-adf-1); the archive still saves the brief (R-adf-7) |
| any other value, `program` included until `program-signoff` ships, or a shape that is not one word, any `pr:` mode | read as absent, with one warning naming the value, as an unrecognized `pr:` value is read |
| `change`, `pr: never` | the change's archive waits for a sign-off over that change's saved brief (D-pb-14) |
| `change`, `pr: per-proposal` | the archive waits, and with it the per-change READY flip the archive tail performs |
| `change`, `pr: per-architecture` | the archive waits; the program PR is untouched by stage archives already |
Closure: DERIVED — the values this change reads (absent or `off`, `change`, and every other value) crossed with `PR_MODES`' three (`src/core/project-config.ts`), every cell listed
Moves:
- READ: applied — D-pb-1's rows for these values; `resolvePrMode` and `resolveScenarioMapConfig` in `src/core/project-config.ts` read an unrecognized value as off with one warning naming it; `PR_MODES` is `never`, `per-proposal`, `per-architecture`, absent meaning `never`
- ENUMERATE: applied — this table; the unrecognized row is new beside D-pb-1, because `program` is not read until `program-signoff` ships (D-pb-15)
- COHERE: applied — the hold sits inside the archive (D-pb-14), so the chain's grant of `archive` and the hold never meet in the chain resolver
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a `program` value written before `program-signoff` ships would otherwise hold nothing, silently; the warning says it is not read
- CONFORM: applied — R-adf-1 (off by default), R-adf-6 (its own key), R-adf-2 as amended (per change, at its archive), R-adf-7
- FEASIBILITY: not applied — one key read by one resolver
- CONSUME: applied — the archive and bulk-archive bodies (the hold, D-pb-14) and the reading's selection (D-pb-13)
- INVOKE: applied — read at each archive and at each system review's reading step

### D-pb-13 — the reader takes the account when sign-off is `change`
Domain: the sign-off setting's values in this change, for a change carrying an account
| member | covered by |
|---|---|
| absent, `off` or unrecognized | the account is written and left out of the reading's selection; the brief names it apart as checked by no reader; a change with no other record has no reading, as today |
| `change` | the latest account no reading listed is selected like any decision record: rendered by `orbit decisions brief`, owed and accepted by the in-context system review, counted in the archive's `decision_records_unread` while unread, and listed with the records no reader checked by `orbit brief` |
Closure: DERIVED — D-pb-12's values, the unrecognized value read as absent
Moves:
- READ: applied — `orbit-decision-records`' `No reader takes the account yet` (its table's rows are every caller of the one selection function); `orbit-emit-composition`'s `The reading's selection is recorded at review and archive`, which states the selection as the `decisions/` folder's
- ENUMERATE: applied — this table
- COHERE: applied — D-pb-5's open point: the archive's count and the brief's unread section read the same selection, so under `change` both count an unread account and under the other values neither does
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a setting turned to `change` after a change's system review leaves that account unread; the archive's count and the brief both show it
- CONFORM: applied — R-adf-11 and R-adf-12: at the defaults the selection is unchanged, so no new G0 exception
- FEASIBILITY: not applied — one filter in the selection
- CONSUME: applied — `orbit decisions brief`, the system review's `decision_records_owed` and read-list check, the archive's `decision_records_unread`, `orbit brief`'s unread section
- INVOKE: applied — at every system review and archive of a change carrying an account

### D-pb-14 — under `change`, the archive holds after its save and asks the sign-off itself
Domain: each way an archive is entered under `change`, and each outcome at its hold
| member | covered by |
|---|---|
| `/orbit:archive`, typed | after the brief is saved and before the sync, the archive shows the saved copy whole and asks the user to sign or decline; D-pb-8's record keeps the answer |
| `/orbit:archive`, chained (the chain grants `archive`) | the same question, asked as a decision prompt: the consent prompt does not fire (the grant records `consent: "setting"`), the sign-off is asked exactly as typed, and the chain does not continue after it; the chain gains no refusal reason |
| `/orbit:bulk-archive` | the same, per change, after that change's save; a decline leaves that change active and the others go on |
| the user signs | the hold lifts, and the archive syncs and moves as it does today |
| the user declines | the archive stops before the sync: nothing is synced or moved, and the change stays active (D-pb-8) |
| the save failed (the brief cannot be rendered whole, or a racing writer took its name) | the archive stops before the sync, naming the failure, since there is no copy to sign; under the other values a failed save is still only recorded |
| the latest signed record cites a copy whose hash equals the copy just saved | the hold lifts without asking again |
| the archive stops at a later prompt after a signature | the signature stays on record; the next archive saves a new copy and asks again unless its hash matches, as above |
Closure: DERIVED — the three ways an archive is entered (typed, chained, bulk), then the hold's outcomes: signed, declined, no copy to sign, already signed over the same text, and a stop after signing
Moves:
- READ: applied — `orbit-archive-modifications`' `The archive saves the change's brief before the sync` (after the audit sweep, before the sync; a failure never stops an archive at the defaults); `orbit-conventions`' chain end step (a decision prompt is asked as typed, and the chain stops after it); `CHAIN_WHY` in `src/core/chain.ts`
- ENUMERATE: applied — this table
- COHERE: applied — D-pb-1's COHERE line had the chain stop before the archive with a new refusal reason; with the hold inside the archive, after the save (D-br-3), that would add a turn in which the user types the archive before signing, against G1; superseded here
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a signature over an older copy could lift a hold over different text; the hash comparison lifts it only when the text is the same
- CONFORM: applied — R-adf-2 as amended (per change, at its archive), R-adf-12 (text whose effect depends on a setting, leaving today's flow unchanged at the defaults), G1 (the user appears only to sign), G5 (the brief is shown whole)
- FEASIBILITY: not applied — one question per change
- CONSUME: applied — the archive's sync step; the PR tail, not reached on a decline, so the READY flip waits under `pr: per-proposal`; D-pb-8's record
- INVOKE: applied — at each archive, and at each change of a bulk archive, under `change`

## Decisions

- **2026-11-12 — D-pb-1: how often the user signs off is its own setting, off by default** The user (stop
  `stop-2026-11-12T21-09-30Z.json` and its resolution): the frequency is a setting separate from the regime, with two
  choices — at every change's archive, over that change's brief, or once at the end of a whole program, before its
  pull request is made ready — and absent means no sign-off, as today. This amends R-adf-2 ("granularity follows the
  regime"); the amendment is recorded at the next architect session. The key's name and spelling are not yet locked.
  Kind: rule
  Disposition: superseded D-pb-12 (the absent, `off` and `change` values) and D-ps-1 in `orbit/explore/program-signoff/explore.md` (the `program` value), per D-pb-15
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
  Disposition: superseded D-ps-2 in `orbit/explore/program-signoff/explore.md`, per D-pb-15
- **2026-11-12 — D-pb-4: the engine computes what the trail holds; the AI writes the rest as one record per change**
  Settled by the AI (method). Of the charter's sections, three cannot be computed — what was built, new seams,
  deviations from the charter — so each change carries one new record, its account, written when apply finishes,
  with those three as plain fields under `orbit-decision-records`' plain-language rule. Written then, the existing
  reading step reads it at the system review. Everything else in the brief is computed from the trail. Chosen over
  writing the three fields into the archive record, which no reader would check before the user signs. The record's
  name is not yet locked.
  Kind: rule
  Disposition: superseded D-ca-1 in `orbit/changes/archive/2026-11-13-change-account/explore.md` (the account) and D-br-1 in `orbit/changes/archive/2026-11-13-brief-render/explore.md` (the computed sections), per D-pb-9

- **2026-11-12 — D-pb-5: the reader takes the account only when sign-off is on** The user (stop
  `stop-2026-11-12T21-21-45Z.json` and its resolution), taking the AI's recommendation: with sign-off off the account is
  written but left out of the reading, and the brief marks it unread, so G0 holds by R-adf-12 with no new exception.
  Chosen over reading it on every change and naming that as G0's third exception.
  Kind: rule
  Disposition: superseded D-pb-13 (the `change` value) and D-ps-1 in `orbit/explore/program-signoff/explore.md` (the `program` value), per D-pb-15

- **2026-11-12 — D-pb-6: the brief is rendered on demand, saved where it is final, and a sign-off cites the saved copy**
  The user took the AI's recommendation: `orbit brief` renders it read-only; each archive saves the change's brief and
  arc-done saves the program brief, in every mode (R-adf-7); a new `signoff` record cites the saved copy by name and
  hash and says signed or declined; a decline keeps the hold, records the user's reason, and what happens next is the
  user's direction. The command's and record's names are not yet locked.
  Kind: rule
  Disposition: superseded D-pb-8 (signing and declining) and D-br-2 in `orbit/changes/archive/2026-11-13-brief-render/explore.md` (rendering and saving), per D-pb-9
- **2026-11-12 — D-pb-7: the stage lands as three changes, all citing stage program-brief** Estimated at the start of
  `/orbit:propose program-brief`, before anything was generated: proposed whole, the stage touches about five or six
  capabilities against a ceiling of three — `orbit-decision-records` (the account and `signoff` records, the reader's
  filter), a new `orbit-program-brief` (the renderer, its sections, the setting), `orbit-archive-modifications` (the
  save and the hold), `orbit-architect` (the save at arc-done and the program hold) and `orbit-conventions` (the
  chain's new stop reason). The user chose three changes (AI recommendation), proposed in order: (1) the account
  record, written when apply finishes and left out of the reading while no sign-off can be on (D-pb-4's account rows,
  D-pb-5's off row); (2) `orbit brief` and saving the brief at each archive and at arc-done (D-pb-2, D-pb-4's computed
  rows, D-pb-6's render and save rows); (3) the sign-off setting, the `signoff` record and the holds (D-pb-1, D-pb-3,
  D-pb-5's on rows, D-pb-6's sign and decline rows), re-measured at its propose, where a declared breach may remain.
  How this exploration is divided among the three, and the changes' names, are settled in the exploration before the
  first propose. The same pattern as `seam-chaining-grants`' D-sga-1.
  Kind: scope
- **2026-11-12 — D-pb-8: a sign-off cites the saved brief, and a decline keeps the hold** D-pb-6's sign and decline
  rows, carried here when D-pb-6 was divided (D-pb-9): a `signoff` record cites the saved brief by filename and hash
  and says signed or declined; a decline keeps the hold, records the user's reason, and what happens next is the
  user's direction. The record's name is not yet locked.
  Kind: rule
- **2026-11-12 — D-pb-9: the three changes are `change-account`, `brief-render` and `program-brief`** The user chose
  the AI's plan for dividing this exploration: two new explorations, `orbit/explore/change-account/` (change 1: the
  account record, D-ca-1, and its exclusion from the reading, D-ca-2) and `orbit/explore/brief-render/` (change 2: the
  brief's sections, D-br-1, and rendering and saving it, D-br-2), each citing stage program-brief; this exploration
  carries change 3 (D-pb-1, D-pb-3, D-pb-5, D-pb-8). The plan renamed this one to `sign-off`; it keeps its name
  instead, because two of its ledger entries cite their resolutions as belonging to `program-brief`, and the engine
  finds a resolution by the work's name (`src/core/decision-records.ts`), so a rename would leave both citations
  pointing at nothing when the reading step renders them.
  Kind: scope
- **2026-11-13 — D-pb-10: this change also builds the program brief's save at the architect session** From D-br-5 in
  `orbit/changes/archive/2026-11-13-brief-render/explore.md`: the architect flow saves the program brief in the architecture trail, with its
  hash, once every declared stage is finished, and again only when a fresh render's hash differs from the latest saved
  copy (D-br-3's program row, which owns the rule). It lands here beside the program sign-off's hold, which reads that
  copy (D-pb-3, D-pb-8); `brief-render` keeps the rendering and the archive's save.
  Kind: scope
  Disposition: superseded D-ps-3 and D-ps-4 in `orbit/explore/program-signoff/explore.md`, per D-pb-15
- **2026-11-13 — D-pb-11: this change splits in two, the per-change sign-off here and the per-program sign-off in a new
  exploration** Estimated at the start of `/orbit:propose program-brief`, before anything was generated: proposed whole,
  this change touches about six capabilities against a ceiling of three — `orbit-program-brief` (the setting, the
  `signoff` record, the program brief's save), `orbit-decision-records` and `orbit-emit-composition` (the reader taking
  the account, whose selection both state as the `decisions/` folder alone), `orbit-archive-modifications` (the archive's
  hold, in archive and bulk-archive), `orbit-architect` (the program brief's save and the program hold) and
  `orbit-pr-lifecycle` (the arc-done readout that surfaces the program PR's READY flip). The estimate takes the
  per-change hold to sit inside the archive, after its save, so that a chained archive asks the sign-off as a decision
  prompt and the chain gains no refusal reason (D-pb-1's COHERE line), keeping `orbit-engine-gates` and
  `orbit-lifecycle-consent` out; the exploration settles that. The user chose two changes (AI recommendation): this one,
  keeping the name `program-brief` (D-pb-9), carries the per-change sign-off — the setting, the `signoff` record, the
  archive's hold and the reader taking the account (D-pb-1's `change` rows, D-pb-5, D-pb-8), about four capabilities,
  a declared breach likely; a new exploration, citing stage program-brief, carries the per-program sign-off — the
  program brief's save at the architect session and the program hold (D-pb-1's `program` rows, D-pb-3, D-pb-10), about
  three. How the rules are divided and the new exploration's name are settled in this exploration before the propose.
  Chosen over one change with a declared breach, and over three changes (the reader taking the account on its own).
  Kind: scope
- **2026-11-13 — D-pb-12: this change ships the sign-off setting's absent, `off` and `change` values; `program` is read
  as unrecognized until `program-signoff` ships** D-pb-1's rows for those values, carried here when D-pb-1 was divided
  (D-pb-15): absent or `off`, nothing waits on a sign-off, as today; `change`, each change's archive waits for a sign-off
  over that change's saved brief, under every `pr:` mode. Any other value — `program` included until the second change
  adds it — is read as absent with one warning naming it, as an unrecognized `pr:` value is (`src/core/project-config.ts`),
  so a project that writes `program` early is told it holds nothing yet. Settled by the AI (method). The key's name is
  not yet locked.
  Kind: rule
- **2026-11-13 — D-pb-13: the reader takes the account when sign-off is `change`** D-pb-5's off and on rows for this
  change's values, carried when D-pb-5 was divided (D-pb-15): absent, `off` or unrecognized, the account is written and
  left out of the reading, as today; `change`, the latest account no reading listed is selected like any decision record,
  read at the system review, counted in the archive's unread figure while unread, and listed by the brief with the
  records no reader checked. Because the archive's count and the brief's unread section read the one selection, they
  agree under every value (D-pb-5's open point, settled).
  Kind: rule
- **2026-11-13 — D-pb-14: under `change`, the archive holds after its save and asks the sign-off itself** Settled by the
  AI (method), the assumption D-pb-11's estimate rested on: after the brief is saved and before the sync, the archive
  shows the saved copy whole and asks the user to sign or decline; a chained archive asks the same question as a decision
  prompt, so the chain gains no refusal reason (this supersedes D-pb-1's COHERE line, which had the chain stop before the
  archive and would cost the user a second turn, against G1); bulk-archive asks per change, a decline leaving only that
  change active. Under `change` a failed save stops the archive before the sync, since there is no copy to sign. The hold
  lifts without asking again when the latest signed record cites a copy whose hash equals the one just saved.
  Kind: rule
- **2026-11-13 — D-pb-15: the second change is `program-signoff`, and the rules divide by unit** The user chose the
  name (AI recommendation) and the AI's division: this exploration carries the per-change sign-off — D-pb-12, D-pb-13,
  D-pb-14 and D-pb-8 — and keeps the name `program-brief` (D-pb-9); a new exploration,
  `orbit/explore/program-signoff/`, citing stage program-brief, carries the per-program sign-off — the `program` value
  with its reader row (D-ps-1, from D-pb-1 and D-pb-5), the program hold (D-ps-2, from D-pb-3) and the program brief's
  save at the architect session (D-ps-3, from D-pb-10 and D-br-3's program row). It is proposed after this change.
  Kind: scope

## Open questions

## Considered & out

- **2026-11-12 — Sign-off once per stage (at stage ratification, or at the stage's last change's archive):** out. The
  user chose every change and once per program; a stage's end is known to the engine only at ratification, and
  neither chosen value needs it. A third value could add it later.
- **2026-11-12 — Renaming this exploration to `sign-off`:** out (D-pb-9). Its ledger entries cite resolutions by the
  work's name, and a rename would break them.
- **2026-11-12 — Refusing or warning on `program` unless `pr: per-architecture`:** out (D-pb-3). It would make one
  setting depend on another; holding completion works under every mode.
- **2026-11-13 — The chain stopping before the archive with a new refusal reason, under `change`:** out (D-pb-14). The
  user would type the archive and then sign, two turns where one does (G1), and the chain resolver, `orbit-engine-gates`
  and `orbit-lifecycle-consent` would each change for it.
- **2026-11-13 — One change with a declared breach of about six capabilities, or three changes:** out (D-pb-11).
- **2026-11-12 — A sign-off on the plan before apply:** out. The user meant the sign-off on what a change built
  (D-pb-2); approving the plan at propose is a different seam nobody asked for.

## References

- `orbit/architecture/automate-dev-flow.md` — R-adf-1, R-adf-2, R-adf-6, R-adf-7, R-adf-14; G5; stage program-brief.
- `orbit/explore/program-signoff/explore.md` — the per-program sign-off, divided from this exploration (D-pb-15).
- `orbit/specs/orbit-archive-modifications/spec.md` — `The archive saves the change's brief before the sync`, where the hold sits (D-pb-14).
- `orbit/specs/orbit-emit-composition/spec.md` — `The reading's selection is recorded at review and archive`, which the reader taking the account changes (D-pb-13).
- `src/core/project-config.ts` — `resolvePrMode`, the unrecognized-value rule D-pb-12 follows.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — `Generalized READY rule` and the arc-done readout (the program PR's flip is the user's act).
- `orbit/specs/orbit-decision-records/spec.md` — `Decision records are written for a reader who knows only the architecture` (its table names the program brief as a reader of the ledger; its residual names a new surface rendering record prose).
- `orbit/specs/orbit-review/spec.md` — the reading step's named limit: the program brief brings unread records to the user at sign-off.
- `src/core/chain.ts` — `CHAIN_WHY`, the chain's refusal reasons a held archive would join.
- `orbit/changes/archive/2026-11-12-chained-review-commit/.orbit-runs/archive-2026-11-12T19-46-14Z.json` — a sample of what an archive record carries (`sync_specs`, `warnings`, `judgements`, `decision_records_unread`).
