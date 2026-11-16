> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: tripwire-steward

## Premise

Stage `tripwires` of `automate-dev-flow`, the third of its four changes (D-tw-19): the steward, the one judgement
sensor — an independent, single-question review at each cited change's archive, off at the defaults, firing on drift
whether or not the change's account declared it. It writes through the first change's contract (D-tw-1, D-tw-3, D-tw-6).
Capabilities measured at the division: `orbit-tripwires`, `orbit-archive-modifications`, and up to two more by the
route chosen below. A bare `D-tw-<n>` here names a decision in `orbit/explore/tripwires/explore.md` (once that change is
archived, the `explore.md` in its `orbit/changes/archive/` folder); the decisions below are restated from that
exploration, each naming its source.

## Mechanism

### D-tst-1 — the steward is a single-question review by an independent reviewer: is this change still its stage?
Domain: what the steward reads, and what its verdict can be
| member | covered by |
|---|---|
| the stage charter as it stood at the stage's first citing propose | the reference (D-tw-3), read from git at that commit; when the current charter differs, the reading says so |
| the change's proposal and diff | the work being judged |
| the change's account `deviations` | the run's own claim, compared with the verdict (D-tst-3) |
| verdict `on-stage` | no firing |
| verdict `drifted` | fires, with the reviewer's evidence |
| verdict `cannot-tell` | fires: a sensor that cannot decide is never a pass (D-tw-3's residual) |
| a change citing no stage | the steward does not run: there is no charter to judge against |
Closure: DERIVED — three inputs the charter and the account requirement define, three verdicts, and the one case with no reference
Moves:
- READ: applied — architecture mode's six passes judge the doc (`src/core/templates/workflows/review.ts`, `Architecture-mode passes (6)`), and no change-mode pass reads a charter; the account's `deviations` field (`orbit-decision-records`' `Each change carries one account, written when apply is complete`); four architecture reviews on the trail in total
- ENUMERATE: applied — this table
- COHERE: applied — the steward and the account are two statements of one fact, fit to the charter, one by the run and one by an independent reviewer; D-tst-3 reads them against each other
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — reading the CURRENT charter would let a run make its drift legitimate by rewording the charter, which no other sensor watches (the ruling-or-goal sensor covers Goals and Rulings only)
- CONFORM: applied — D-tw-1 (the judgement member of the contract); D-tw-3 (a reference fixed before the run); D-tw-6 (the verdict becomes a reading on the steward's own emit); the charter's text names architecture mode, so its parenthetical is reworded at the next architect session
- FEASIBILITY: applied — one independent review per cited change: real cost, which is why it is off at the defaults (D-tst-2)
- CONSUME: applied — the reading, the brief's Tripwires line, and under a halt setting the `tripwire` stop; G6's fixture tests prove only the engine's part (verdict to reading, `cannot-tell` fired, the comparison with the account) — the reviewer's judgement is graded at first-run, a named limit
- INVOKE: applied — D-tst-2

### D-tst-2 — the steward runs at each cited change's archive, and is off at the defaults
Domain: each point where the steward could run, and each state of its setting
| member | covered by |
|---|---|
| a cited change's archive, setting on | runs, after the account exists and before the archive's own emit |
| a cited change's archive, setting absent or off | does not run; the archive is as today |
| the user invoking it on a change, any setting | runs |
| a change's propose | does not run (the user's choice, 2a) |
| stage completion at architect | does not run (the user's choice, 2a) |
Closure: DERIVED — the lifecycle points a change passes where its stage fit could be judged, by the setting's two states, plus the user's own invocation
Moves:
- READ: applied — the account is written when apply is complete, so at archive it exists (`orbit-decision-records`); G0's body clause and R-adf-12
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-5 computes sensors at the defaults so first-run can count firings; the steward is the one exception, by cost, so supervised stretches carry no steward readings and G6 counts only the stretches where it was on
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a steward that ran only at stage completion would judge up to four changes at once, after all of them had landed
- CONFORM: applied — G0 (an added independent review at every archive changes the flow and its cost; off by default holds it with no exception); R-adf-6 (its own setting); R-adf-12 (the archive body's text for it acts only when the setting is on)
- FEASIBILITY: applied — one review per cited change, only when the user turns it on
- CONSUME: applied — the archive emit's readings (D-tw-6); the driver, which turns it on for an autonomous run
- INVOKE: applied — the archive of a cited change with the setting on, or the user's invocation

### D-tst-3 — the steward fires on drift whether or not the account declared it
Domain: the steward's verdict against the account's `deviations`
| member | covered by |
|---|---|
| `on-stage`, account declares none | no firing |
| `on-stage`, account declares a deviation | no firing; the reading notes the account declared one the reviewer did not judge drift |
| `drifted`, the account declared it | fires, marked declared |
| `drifted`, the account did not declare it | fires, marked undeclared |
| `cannot-tell` | fires, marked as such |
Closure: DERIVED — three verdicts by whether the account declared a deviation
Moves:
- READ: applied — the account is written by the run after the work and ratified by no one (`orbit-decision-records`)
- ENUMERATE: applied — this table
- COHERE: applied — D-tw-3's declared escape is a declaration in the PLAN, fixed before the run; the account is written after, so it is not one
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — if a declared deviation escaped, a run could excuse any drift by confessing it in its account
- CONFORM: applied — D-tw-3; R-adf-6 (a halt setting may choose to halt on undeclared drift only, since the reading marks which)
- FEASIBILITY: not applied — one comparison
- CONSUME: applied — the reading's mark, read by the halt setting and the brief
- INVOKE: applied — every steward run (D-tst-2)

## Decisions

- **2026-11-16 — D-tst-1: the steward is a single-question review by an independent reviewer: is this change still its
  stage?** Restated from D-tw-8 at the division (D-tw-19). Confirmed by the user, over architecture mode with a stage filter: that mode's passes judge the doc, never the
  work, and nothing else independent compares a change with its charter. It reads the charter as it stood at the stage's
  first citing propose; its verdict is `on-stage`, `drifted` or `cannot-tell`. The charter's parenthetical
  ("`/orbit:review --as architecture` aimed at one stage") is reworded at the next architect session.
  Kind: rule
- **2026-11-16 — D-tst-2: the steward runs at each cited change's archive, and is off at the defaults** Restated from D-tw-9 at the division (D-tw-19). The user's choice
  (2a, over also running at propose, or only at stage completion; off at the defaults confirmed). It runs under its own
  setting or when the user invokes it: the one sensor not computed at the defaults, by cost (G0).
  Kind: rule
- **2026-11-16 — D-tst-3: the steward fires on drift whether or not the account declared it** Restated from D-tw-10 at the division (D-tw-19). The user's choice. The
  reading marks declared or undeclared, so a halt setting may halt on undeclared drift only; an after-the-fact account
  is not a declaration in the plan.
  Kind: rule

## Open questions

- **The steward's route.** A new review mode, or its own record kind?
  A new mode reaches the closed mode lists in `orbit-review` (`--fresh` "all modes — proposal, system, and
  architecture") and `orbit-emit-composition` (a review payload "in ANY mode (proposal, system, architecture)"), and
  every reader of review emits filters by mode; its own record kind may reach only the emit table.
  Standing recommendation: its own record kind, written by an independent reviewer dispatched from the archive under
  the setting or on the user's invocation; measure which enumerations each route makes false before choosing

## Considered & out

- **2026-11-16 — The steward as architecture-mode review aimed at one stage:** out (the user, D-tst-1). Its six passes
  judge the doc, never the work.
- **2026-11-16 — The steward also at propose:** out (the user, D-tst-2).
- **2026-11-16 — The steward only at stage completion:** out (the user, D-tst-2). It would judge up to four changes at
  once, after all had landed.
- **2026-11-16 — A deviation the account declared escapes the steward:** out (the user, D-tst-3). A run could excuse any
  drift by confessing it.
- **2026-11-16 — Computing sensors only under a setting:** out (the user, D-tw-5). First-run's G6 could not count firings
  in supervised stretches. The steward is the one exception, off at the defaults by cost (D-tst-2).

## References

- `orbit/explore/tripwires/explore.md` — the parent exploration: the contract, the reference model, the record, and D-tw-19's division
- `orbit/architecture/automate-dev-flow.md` — stage `tripwires`, G0, G3, G6
- `src/core/templates/workflows/review.ts` — `Architecture-mode passes (6)`, which judge the doc, never the work
- `orbit/specs/orbit-decision-records/spec.md` — `Each change carries one account, written when apply is complete` (the `deviations` field)
- `orbit/specs/orbit-archive-modifications/spec.md` — where a setting-gated step at archive would sit
