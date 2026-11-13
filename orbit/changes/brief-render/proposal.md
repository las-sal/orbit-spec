## Why

Stage program-brief of `automate-dev-flow` must give the user one plain-language brief of what a change or a whole
program did: what was built, the capabilities and requirements it added or changed, the new terms and seams, every
ledger judgement, the stops, the tripwires and where the work left its plan (the stage charter, R-adf-7, G5). The first
change of the stage gave each change its account (`change-account`); nothing yet composes the brief or keeps a copy a
later sign-off could cite. This change, the second of the stage's three (D-pb-7 and D-pb-9 in
`orbit/explore/program-brief/explore.md`), renders the brief from the trail and saves each change's brief at its
archive, before the sync, so the third change's per-change sign-off can wait on it while the change can still be fixed
(see `explore.md`, D-br-3, D-br-6, D-br-7).

## What Changes

- A new command, `orbit brief`, renders a brief read-only to standard output: `orbit brief --change <name>` for one
  change (active or archived), `orbit brief <doc>` for a program — every change citing the doc, grouped by stage, plus
  the architecture trail's records for that doc. `--json` gives the same content as data with the text as `markdown`.
  It writes nothing, and a brief that cannot be rendered whole exits non-zero naming why and prints nothing.
- A brief's sections, each from the trail: what was built, new seams and deviations from the change's latest account;
  the requirements added or changed from its delta specs and, once archived, its archive record; new terms from the
  `defines` lists of its latest records; the ledger; the stops with their answers or marked open; a line saying
  tripwires are not installed; the archive's warnings and accepted risks with a declared size breach; and the records
  no reader checked, the account included. The sync and archive-signal lines say only what the change's archive record
  says — the sync ran, was skipped, or no record exists — and an active change's say no archive has recorded a sync yet
  (D-br-6); new terms show each definition with the records that wrote it (D-br-7).
- `orbit brief --change <name> --save` saves an active change's brief as
  `orbit/changes/<name>/.orbit-runs/brief/brief-<TS>.md`, never overwriting, and prints the file and the SHA-256 of its
  text — the hash the third change's sign-off will cite.
- The archive saves the change's brief after its anomaly prompts and BEFORE the sync, in every mode, so the copy moves
  with the change; a brief that cannot be saved is recorded in the archive run record's `warnings` and shown nowhere,
  and the archive goes on. `/orbit:bulk-archive` saves each change's brief before that change's sync.
- The PR-attached archive tail stages the saved brief with the archived tree and leaves it out of its untracked-files
  line, as the brief is the archive's own write (the archive emit is the one other such file).
- `docs/cli.md` and the completion registry name `orbit brief`.

Not in this change: saving the PROGRAM brief at the architect session (D-br-5: the stage's third change, beside the
program sign-off's hold that reads it), the sign-off setting and its holds, and a reading step over the account.

## Capabilities

### New Capabilities

- `orbit-program-brief`: the brief of a change and of a program — its sections and where each comes from, what a brief
  says of the change's archive record, `orbit brief` (read-only render, whole or absent), and the saved copy
  (`--save`, where it is kept, its hash, never overwritten).

### Modified Capabilities

- `orbit-archive-modifications`: one ADDED requirement — the archive (and bulk-archive) saves the change's brief before
  the sync, recording a failure in `warnings` and showing nothing; and `PR-attached archive tail` MODIFIED so the saved
  brief is staged with the archived tree and not named among the carried untracked files.
- `orbit-decision-records`: three MODIFIED requirements that name the brief as a reader — the plain-language rule's field
  table (stops and resolutions reach the user through the brief too), the replacement rule's named limit on readers of
  `decisions/` (the brief takes the latest in each chain), and `No reader takes the account yet`'s table of the
  selection's callers (the brief lists the unread records with the same selection, and shows the account as checked by
  no reader).

## Impact

- New `src/core/program-brief.ts` (the brief's model, render and save) and `src/commands/brief.ts`; `orbit brief`
  registered in `src/cli/program.ts` and `src/core/completions/command-registry.ts`; `docs/cli.md` gains its section.
- `src/core/emit-composition.ts` — its no-overwrite publish shared with the brief's save (no change to any emit).
- `src/core/pr/tail.ts` — `carried_untracked` leaves out the saved brief.
- `src/core/templates/workflows/archive-change.ts`, `src/core/templates/workflows/bulk-archive-change.ts` — the save
  step.
- At archive, the new capability's Purpose is written and `orbit-archive-modifications`' Purpose names the saved brief
  (design.md, At archive).
- Tests: the brief's render, save and failure tests, golden renders of a fixture program and of a second whose changes carry ledger entries and stops (the stage's first exit criterion); the
  tail exclusion; the bodies' save step. Pins that move as closed sets this extends (R-adf-9), each named at archive:
  the archive and bulk-archive skill hash pins, `rc03b`'s `emit-composition.ts` pin.
- G0 with no new exception: a new command, a record the archive writes, and a body step that tells the AI to record
  something (R-adf-9); no readout, gate or prompt changes, and a default archive shows nothing new (D-br-3).
