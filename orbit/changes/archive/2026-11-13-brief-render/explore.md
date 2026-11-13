> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: brief-render

## Premise

The second of stage program-brief's three changes (D-pb-7 and D-pb-9 in `orbit/explore/program-brief/explore.md`).
orbit renders the brief from the trail — what was built, the capabilities and requirements added or changed, new
terms and seams, the ledger, stops, tripwires and deviations from the charter — in plain language (the stage
charter), in every mode (R-adf-7), and saves it where it is final, so a later sign-off (the third change) can cite
the exact copy. The parts orbit cannot compute come from each change's account
(`orbit/changes/<name>/.orbit-runs/account/`, owned by `orbit-decision-records`; the first change, archived as
`orbit/changes/archive/2026-11-13-change-account/`). G5 grades the result at first-run: reading only the brief, the
user can say what was built, the new terms and seams, and every ledger judgement.

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
| a change citing no architecture doc | the same sections; deviations are stated against the proposal (`orbit-decision-records`' `Each change carries one account, written when apply is complete`), and no program brief includes it |
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

### D-br-3 — the archive saves the change's brief before the sync, and the brief is the archive's own write
Domain: each moment the brief is produced, and each surface the saved copy reaches
| member | covered by |
|---|---|
| asked for at any time | `orbit brief` (its name settled at propose) prints the brief of a program or of one change to standard output and writes nothing, as `orbit decisions brief` does; `--json` gives the same content as data with the text as `markdown` |
| a change archives, any setting | the archive saves the change's brief, with the hash of its text, in the change's own trail BEFORE the sync and the move, so the copy moves with the change; it is rendered as D-br-8 says |
| an archive that stops after the save (a refused sync, the user stopping it) | the copy stays in the active change's trail; the next archive saves a new one, and the latest is the change's brief |
| the PR-attached archive tail | the saved brief is the archive's own write: staged with the archived tree and left out of the untracked-files line, as the archive emit already is |
| every declared stage of a program is finished (complete, ended, or all its citing changes archived), any setting | the architect flow saves the program brief in the architecture trail with its hash, and saves again only when a fresh render's hash differs from the latest saved copy; built by the third change, `program-brief`, not this one (D-br-5) |
| a brief that cannot be rendered whole (a record unreadable, a source missing) | the command exits non-zero naming it and prints nothing, as `orbit decisions brief` does; the archive records the failure in its run record, prints nothing about it, and still archives |
Closure: DERIVED — the two units (a change, a program) crossed with rendering and saving, the archive's two outcomes after the save (it completes, it stops), the one surface that lists a carried file (the tail's untracked-files line), and the whole-or-absent failure `orbit decisions brief` defines
Moves:
- READ: applied — D-pb-1's `change` rows ("the change's archive waits for a sign-off") and D-pb-8's COHERE move (the archive saves the brief before it waits) in `orbit/explore/program-brief/explore.md`; the archive body's order (Step 5 moves, Step 5.5 emits, Step 5.6 runs the tail); `src/core/pr/tail.ts`'s `carried_untracked`, which leaves out only the archive emit
- ENUMERATE: applied — this table; the stopped-archive and tail rows are new against D-br-2
- COHERE: applied — D-br-2 saved after the sync and the move, so a per-change sign-off (the third change) could be declined only after the change was synced and moved; saving first lets a decline leave the change where it was. The cost is D-br-8
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a copy saved first could describe work the archive then fails to land; the stopped-archive row makes the next attempt's copy the latest, and the archive record still states what was synced
- CONFORM: applied — R-adf-7 (every mode); G0 with no new exception: the save is a record (R-adf-9), the tail's line is unchanged by the exclusion (R-adf-13's line names strays, and the brief is not one), and the failure prints nothing at the defaults (R-adf-11); R-adf-2 as amended
- FEASIBILITY: not applied — one file per archive attempt and one per program
- CONSUME: applied — the third change's `signoff` record cites the saved copy by name and hash (D-pb-8); first-run's closing review grades G5 from saved copies; the archive record names a failure for a later reader, and a sign-off, when on, cannot proceed without a copy
- INVOKE: applied — at each archive, before its sync; at the architect session that finds the program finished; on the user's command

### D-br-4 — a brief rendered before its change's archive record exists says what it cannot yet show
Domain: each section of D-br-1 whose source is the archive record
| member | covered by |
|---|---|
| capabilities and requirements added or changed (`sync_specs`) | the requirement titles from the change's delta specs; in the copy the archive saves, marked as what this archive syncs; on demand, marked not yet synced |
| deviations: the archive record's `warnings` and its readiness judgement's `accepted` claims | not yet written; the brief says the archive records them and that they appear in the program brief and in the archived change's brief; the account's `deviations` and a declared size breach still show |
| records no reader checked (`decision_records_unread`) | computed by the same selection the archive's unread count uses, so the saved copy and the archive record agree |
Closure: SOURCED — the archive record's keys D-br-1 reads (`sync_specs`, `warnings`, `judgements[].accepted`, `decision_records_unread`), read from `2026-11-12-chained-review-commit`'s archive record
Moves:
- READ: applied — that record's keys; the archive body composes `warnings` and `judgements` at Step 5.5, after the move, so no copy saved before the sync can hold them
- ENUMERATE: applied — this table: every D-br-1 row whose source is the archive record
- COHERE: applied — the unread list and the archive's count come from one selection, so the saved copy and the record cannot disagree
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — a saved copy silent about the archive's warnings would look complete; it says they come later and where. D-br-1's FALSIFY move (computed signals beside the account catch an omitted deviation) holds in the saved copy only for a declared size breach; the archive's signals reach the user in the program brief
- CONFORM: applied — G5 (every ledger judgement is in the copy; the readiness judgement is not a ledger entry); `orbit-decision-records`' plain-language rule for the brief's own words
- FEASIBILITY: not applied — the same reads as D-br-1
- CONSUME: applied — a user signing one change (the third change) reads the saved copy; the program brief and an archived change's brief carry the archive's signals
- INVOKE: applied — whenever a change's brief is rendered with no archive record: the archive's save, and `orbit brief` on an active change

### D-br-8 — a brief says only what the archive recorded, in every shape a record states it, and its unread list is a snapshot
Domain: each state of a change's archive record, crossed with the sections that read it
| member | covered by |
|---|---|
| an active change (on demand, and the copy the archive saves before its sync) | requirements: the delta's titles as what the change proposes, with a line that no archive has recorded a sync yet; the archive's warnings and accepted risks: a line that its archive records them after this brief, and where they appear |
| an archived change whose record says the sync ran (in `sync_specs.ran`, or in an earlier shape: `specs_synced`, `sync.synced`, or a `sync_specs` without `ran` listing its capabilities) | requirements: the capabilities and counts `sync_specs` reports when it reports them, with the delta's titles; warnings and accepted risks: the record's |
| an archived change whose record says the sync was skipped (in any of those shapes) | requirements: the delta's titles, with a line that the archive recorded no sync and its skipped reason; warnings and accepted risks: the record's |
| an archived change whose record states the sync in none of those shapes | requirements: the delta's titles, with a line that the record does not say, in a form orbit reads, whether they were synced; warnings and accepted risks: the record's |
| an archived change with no archive record (archived before orbit recorded archives, or brought from OpenSpec) | requirements: the delta's titles, with a line that whether they were synced is not recorded; warnings and accepted risks: a line that no archive record holds any |
| records no reader checked, in every state | the selection's records when the brief is rendered: a snapshot; the copy the archive saves says records written after it appear in the archived change's brief and the program brief |
Closure: DERIVED — the four states an archived change's history can show of its archive (a record stating its sync ran, one stating it was skipped, one stating neither in a shape the brief reads, none) plus the active change, which has none yet; and the one section whose source can change between the save and the archive record
Moves:
- READ: applied — `sync_specs.ran` and `skipped_reason` in the archive record of `2026-11-12-chained-review-commit`; three archived changes here with no `archive-*.json` (e.g. `2026-06-08-rename-followups`); the archive body's Step 4 (an already-synced change, "Archive without syncing")
- ENUMERATE: applied — this table; the skipped and no-record rows came from the proposal review (the fresh half and codex); the earlier shapes and the fourth archived row came from the system review's fresh half, measured over this repository's 66 archive records (`2026-07-17-d2-architect` writes `specs_synced`, `2026-07-21-d3-orientation` writes `sync.synced`, `2026-06-11-relocate-modified-upstream-workflows` and `2026-07-06-c1-engine-gates` write `sync_specs` without `ran`)
- COHERE: applied — D-br-4 keyed the label on whether an archive record exists, which made an archived change without one "not yet synced"; keying on what the record says gives each state one true line. "No archive has recorded a sync yet" is true even of an active change synced by `/orbit:sync`
- EXECUTE: applied — `orbit brief d-arc-arbitered-flow` renders after the system walk, where refusing those records had made it fail for good
- FALSIFY: applied — one selection function does not make one moment: the archiving session can write a ledger entry at the sync, after the save, which the archive counts and the copy lacks; the copy says so rather than claiming agreement
- CONFORM: applied — G5 (a record written after the save still reaches the user, in the archived change's brief and the program brief); the plain-language rule for the brief's own lines
- FEASIBILITY: not applied — the same reads as D-br-7
- CONSUME: applied — the third change's per-change sign-off reads the saved copy, whose unread line now says what it cannot hold; first-run's G5 grading reads saved copies
- INVOKE: applied — whenever a change brief is rendered, by state

### D-br-7 — the brief's sections come from the trail, three from the account, and each definition of a term is shown with its records
Domain: each section the stage charter names, plus the unread records `orbit-review`'s named limit assigns to the brief, for a change brief and a program brief
| member | covered by |
|---|---|
| what was built | the latest account's `built`; a change with no account says none was written; the program brief lists each change's, grouped by stage |
| capabilities and requirements added or changed | the delta specs' requirement titles, labelled by what the archive recorded of the sync (D-br-8) |
| new terms | every distinct term and definition in the `defines` lists of the change's latest records, the account's included, once each, naming the records that define it; a term defined two ways appears once per definition; the program brief adds the architecture trail's records |
| new seams | the latest account's `seams` |
| the ledger | the latest ledger entry of each chain: `decided`, `alternatives`, `why`, and what it relies on |
| stops fired | each stop's `about` and `question`, with its latest resolution's `answer` and `effect`, or marked open; the program brief adds the architecture trail's stops |
| tripwires fired | until stage tripwires ships, a line saying tripwires are not installed, never "none fired" |
| deviations from the charter | the latest account's `deviations`, beside the computed signals (D-br-8 says which the archive state allows) and a declared size breach |
| records no reader checked | the records the selection returns (a snapshot, D-br-8), and the account when no reader took it (D-ca-2) |
| a change citing no architecture doc | the same sections; deviations are stated against the proposal (`orbit-decision-records`' `Each change carries one account, written when apply is complete`), and no program brief includes it |
Closure: SOURCED — the stage charter's list in `orbit/architecture/automate-dev-flow.md`, plus `orbit-review`'s named limit, each for the two units D-pb-2 and D-pb-3 set
Moves:
- READ: applied — the charter's list; the records' `defines` belong to each record (`orbit-decision-records`' plain-language rule: a term is defined in the record that uses it)
- ENUMERATE: applied — this table
- COHERE: applied — D-br-1 merged terms with no rule, and the proposal chose the latest definition; codex's review showed that attaches one record's meaning to another's prose, so each distinct definition stays with its records
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an account can leave a deviation out; the computed signals sit beside it so an omission shows against them, where the archive state has them (D-br-8). The renderer cannot make a requirement title plain; it shows titles as the spec names them, under a heading that says so
- CONFORM: applied — R-adf-7, G5, the plain-language rule (its residual: a new surface rendering record prose joins its table), R-adf-10
- FEASIBILITY: not applied — one read over one change's or one program's trail
- CONSUME: applied — the user reads it; the third change's sign-off cites the saved copy (D-br-3); first-run's closing review grades G5 from saved copies
- INVOKE: applied — on `orbit brief`, and at the archive's save (D-br-3)

## Decisions

- **2026-11-12 — D-br-1: the brief's sections come from the trail, and three come from the account** From D-pb-4's
  computed rows and D-pb-2 in `orbit/explore/program-brief/explore.md` (divided by D-pb-9): every section the charter
  names is computed from the records, except what was built, new seams and deviations, which come from the change's
  latest account; a change brief covers one change, a program brief covers every change citing the doc, grouped by
  stage, plus the architecture trail's records.
  Kind: rule
  Disposition: superseded D-br-7
- **2026-11-12 — D-br-2: `orbit brief` renders read-only, and the brief is saved where it is final** From D-pb-6's
  render and save rows (D-pb-9): `orbit brief` prints it and writes nothing; each archive saves the change's brief, and
  the architect flow saves the program brief once the program is finished, each with its hash, in every mode. The
  command's name is settled at propose.
  Kind: rule
  Disposition: superseded D-br-3
- **2026-11-13 — D-br-3: the archive saves the change's brief before the sync, and the brief is the archive's own
  write** Supersedes D-br-2, whose archive row saved the brief after the sync and the move: a sign-off given per change
  (D-pb-1, D-pb-8) waits before anything is synced, so the copy it cites must exist by then, and a decline must leave the
  change unarchived. The copy is saved in the change's own trail and moves with it; the archive tail stages it and leaves it
  out of its untracked-files line, as it does the archive's own record; a brief that cannot be rendered is recorded in the
  archive's run record and shown nowhere at the defaults, so G0 needs no new exception. On-demand rendering and the
  program save carry over from D-br-2.
  Kind: rule
- **2026-11-13 — D-br-4: a brief rendered before its change's archive record exists says what it cannot yet show** The
  archive's warnings and its readiness judgement are written after the move, so the copy the archive saves (D-br-3)
  cannot hold them: it lists the delta specs' requirements as what this archive syncs, computes the unread records from
  the same selection the archive counts with, and says the archive's own signals appear in the program brief.
  Kind: rule
  Disposition: superseded D-br-6

- **2026-11-13 — D-br-5: the program brief's save at the architect session is built by the third change** The user
  chose the AI's recommendation (option a): D-br-3's program row moves to the third change, `program-brief`, which
  already edits the architect flow for the program sign-off's hold, so the saved copy and the hold that reads it land
  together. This change renders both units on demand and builds the archive's save. Kept here, it would likely have
  touched four capabilities (`orbit-decision-records`, `orbit-archive-modifications`, `orbit-architect` and probably
  `orbit-emit-composition`) against a ceiling of three; an estimate, measured at propose. Chosen over keeping it with a
  declared size breach, and over a change of its own.
  Kind: scope
- **2026-11-13 — D-br-6: a brief says only what the archive recorded, and its unread list is a snapshot** Supersedes
  D-br-4 (the user, at the proposal walk, decision A): the requirements and archive-signal lines follow what the change's
  archive record says — sync ran, sync skipped, or no record at all — and an active change's brief says no archive has
  recorded a sync yet, instead of "not yet synced", which was false of an archived change without a record and of an
  active change already synced. The records no reader checked are a snapshot at rendering, so the copy the archive saves
  says that records written after it appear in the archived change's brief and the program brief.
  Kind: rule
  Disposition: superseded D-br-8
- **2026-11-13 — D-br-7: the brief's sections come from the trail, three from the account, and each definition of a term
  is shown with its records** Supersedes D-br-1 (the user, at the proposal walk, decision B): a term's definition belongs
  to the record that wrote it, so the new-terms section shows each distinct term and definition once with the records
  that define it, and a term defined two ways appears twice; the other sections are D-br-1's, the requirements line
  labelled by D-br-8.
  Kind: rule
- **2026-11-13 — D-br-8: a brief says only what the archive recorded, in every shape a record states it, and its unread
  list is a snapshot** Supersedes D-br-6 (the user, at the system walk, decision B): an archive record states its sync in
  the current shape or in an earlier one (`specs_synced`, `sync.synced`, or a `sync_specs` without `ran` listing its
  capabilities), and the brief reads each as it states it; a record stating it in none of them gets a line saying it does
  not say, in a form orbit reads, whether the requirements were synced, and is never refused, since an archived record
  is never edited and a refusal would leave its change and its program with no brief for good. The rest is D-br-6's.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-12 — Saving the brief only when someone signs off:** out (D-pb-6). R-adf-7 asks for it in every mode.
- **2026-11-13 — Building the program brief's save here, with a declared size breach, or as a change of its own:**
  out (D-br-5). The save belongs beside the architect hold that reads it, which the third change builds.

## References

- `orbit/explore/program-brief/explore.md` — D-pb-2, D-pb-4, D-pb-6, D-pb-7, D-pb-9.
- `orbit/changes/archive/2026-11-13-change-account/explore.md` — the account the brief reads (D-ca-4, which superseded D-ca-3 and D-ca-1) and why it may be unread (D-ca-2).
- `orbit/architecture/automate-dev-flow.md` — stage program-brief's charter (the sections), R-adf-7, G5.
- `orbit/specs/orbit-decision-records/spec.md` — `The reading step's brief is rendered by orbit`, the pattern `orbit brief` follows.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — the archive tail's commit scope, which the saved brief must reach.
- `orbit/changes/archive/2026-11-12-chained-review-commit/.orbit-runs/archive-2026-11-12T19-46-14Z.json` — a sample archive record.
