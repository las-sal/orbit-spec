> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: brief-render

## Premise

The second of stage program-brief's three changes (D-pb-7 and D-pb-9 in `orbit/explore/program-brief/explore.md`).
orbit renders the brief from the trail — what was built, the capabilities and requirements added or changed, new
terms and seams, the ledger, stops, tripwires and deviations from the charter — in plain language (the stage
charter), in every mode (R-adf-7), and saves it where it is final, so a later sign-off (the third change) can cite
the exact copy. The parts orbit cannot compute come from each change's account (`orbit/explore/change-account/`,
the first change). G5 grades the result at first-run: reading only the brief, the user can say what was built, the
new terms and seams, and every ledger judgement.

## Mechanism

### D-br-1 — the brief's sections come from the trail, and three come from the account
Domain: each section the stage charter names, plus the unread records `orbit-review`'s named limit assigns to the brief, for a change brief and a program brief
| member | covered by |
|---|---|
| what was built | the latest account's `built`; a change with no account says none was written; the program brief lists each change's, grouped by stage |
| capabilities and requirements added or changed | the archive record's `sync_specs` with the requirement titles from the change's delta specs; before archive, the delta specs alone, marked not yet synced |
| new terms | every `defines` entry of the change's latest records, the account's included, each term once; the program brief adds the architecture trail's records |
| new seams | the latest account's `seams` |
| the ledger | the latest ledger entry of each chain: `decided`, `alternatives`, `why`, and what it relies on |
| stops fired | each stop's `about` and `question`, with its latest resolution's `answer` and `effect`, or marked open; the program brief adds the architecture trail's stops |
| tripwires fired | until stage tripwires ships, a line saying tripwires are not installed, never "none fired" |
| deviations from the charter | the latest account's `deviations`, beside the computed signals: the archive record's `warnings`, the accepted claims of its readiness judgement, and a declared size breach |
| records no reader checked | the records the selection still holds (`decision_records_unread` at archive), and the account when no reader took it (D-ca-2) |
| a change citing no architecture doc | the same sections; deviations are stated against the proposal (D-ca-1), and no program brief includes it |
Closure: SOURCED — the stage charter's list in `orbit/architecture/automate-dev-flow.md`, plus `orbit-review`'s named limit, each for the two units D-pb-2 and D-pb-3 set
Moves:
- READ: applied — the charter's list; an archive record's fields (`sync_specs`, `warnings`, `judgements[].accepted`, `decision_records_unread`, in `2026-11-12-chained-review-commit`); the records' plain fields in `orbit-decision-records`
- ENUMERATE: applied — this table
- COHERE: applied — the brief shows record prose to the user, so its plain sections are exactly the plain fields `orbit-decision-records` binds; the computed signals are engine text, not prose the reader checks
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an account can leave a deviation out; the computed signals sit beside it so an omission shows against them. The renderer cannot make a requirement title plain; it shows titles as the spec names them, under a heading that says so
- CONFORM: applied — R-adf-7, G5, the plain-language rule (its residual: a new surface rendering record prose joins its table), R-adf-10
- FEASIBILITY: not applied — one read over one change's or one program's trail
- CONSUME: applied — the user reads it; the third change's sign-off cites the saved copy (D-br-2); first-run's closing review grades G5 from saved copies
- INVOKE: applied — on `orbit brief`, and at the saves D-br-2 lists

### D-br-2 — `orbit brief` renders read-only, and the brief is saved where it is final
Domain: each moment the brief is produced
| member | covered by |
|---|---|
| asked for at any time | `orbit brief <doc> [--change <name>]` prints it to standard output and writes nothing, as `orbit decisions brief` does; `--json` gives the same content as data with the text as `markdown` |
| a change archives, any setting | the archive saves the change's brief in the archived change's trail, with the hash of its text, after the sync and move, so the brief shows what was synced |
| every declared stage of a program is finished (complete, ended, or all its citing changes archived), any setting | the architect flow saves the program brief in the architecture trail, with its hash, once; a later change to the program saves a new copy |
| a brief that cannot be rendered whole (a record unreadable, a source missing) | the command exits non-zero naming it and prints nothing, as `orbit decisions brief` does; the archive notes the failure in one line and still archives |
Closure: DERIVED — the two units (a change, a program) times rendering and saving, plus the failure that `orbit decisions brief`'s whole-or-absent rule already defines
Moves:
- READ: applied — `orbit-decision-records`' `The reading step's brief is rendered by orbit` (read-only, standard output, `--json` with `markdown`, whole or absent); D-pb-6's render and save rows
- ENUMERATE: applied — this table
- COHERE: applied — saving at archive in every mode is a new file a default archive writes; it is a record, which G0 allows (R-adf-9), and nothing a user is asked changes; whether the archive's run record names the saved file is settled at propose
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a brief saved before the sync would show requirements as not yet synced; the save follows the sync
- CONFORM: applied — R-adf-7 (written in every mode), R-adf-9, R-adf-12; `orbit-pr-lifecycle`'s archive commit scope must take the saved file (checked at propose)
- FEASIBILITY: not applied — one file per change and one per program
- CONSUME: applied — the third change's `signoff` record cites a saved copy by name and hash (D-pb-8)
- INVOKE: applied — at each archive, and at the architect session that first finds the program finished

## Decisions

- **2026-11-12 — D-br-1: the brief's sections come from the trail, and three come from the account** From D-pb-4's
  computed rows and D-pb-2 in `orbit/explore/program-brief/explore.md` (divided by D-pb-9): every section the charter
  names is computed from the records, except what was built, new seams and deviations, which come from the change's
  latest account; a change brief covers one change, a program brief covers every change citing the doc, grouped by
  stage, plus the architecture trail's records.
  Kind: rule
- **2026-11-12 — D-br-2: `orbit brief` renders read-only, and the brief is saved where it is final** From D-pb-6's
  render and save rows (D-pb-9): `orbit brief` prints it and writes nothing; each archive saves the change's brief, and
  the architect flow saves the program brief once the program is finished, each with its hash, in every mode. The
  command's name is settled at propose.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-12 — Saving the brief only when someone signs off:** out (D-pb-6). R-adf-7 asks for it in every mode.

## References

- `orbit/explore/program-brief/explore.md` — D-pb-2, D-pb-4, D-pb-6, D-pb-7, D-pb-9.
- `orbit/explore/change-account/explore.md` — the account the brief reads (D-ca-1) and why it may be unread (D-ca-2).
- `orbit/architecture/automate-dev-flow.md` — stage program-brief's charter (the sections), R-adf-7, G5.
- `orbit/specs/orbit-decision-records/spec.md` — `The reading step's brief is rendered by orbit`, the pattern `orbit brief` follows.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — the archive tail's commit scope, which the saved brief must reach.
- `orbit/changes/archive/2026-11-12-chained-review-commit/.orbit-runs/archive-2026-11-12T19-46-14Z.json` — a sample archive record.
