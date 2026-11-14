## ADDED Requirements

### Requirement: The archive holds for a per-change sign-off

The archive workflow SHALL, at a step directly after the brief's save (`The archive saves the change's brief before the
sync`) and BEFORE the sync assessment, read the hold by running `orbit brief --change <name> --hold --json`
(`orbit-program-brief`'s `A sign-off is recorded against the saved copy, and the hold reads it`) and act by the first row
of this table that matches (D-pb-14 in this change's `explore.md`):

| the save and the hold | the archive |
|---|---|
| the hold command exits non-zero | stops before the sync, naming the error as the command reported it; nothing is synced or moved. With the setting off the hold reads no history, so this row is reached only on a usage error, which an archive body and the `orbit` it was generated with never produce |
| `why: "off"` | goes on, saying nothing about the hold; when the hold carries a warning, it states the warning in one line |
| the save exited non-zero, or `why: "no-copy"` | stops before the sync, naming the save's failure as the command reported it, or that no copy is saved, and saying there is no copy to sign; nothing is synced or moved, and the change stays active |
| `why: "signed"` | states in one line that the latest sign-off covers this copy's text, naming the record, and goes on |
| `why: "unsigned"` | shows the latest saved copy whole, then asks the user to sign off or decline; writes the answer by `orbit emit signoff --change <name>` with the copy's filename as `brief`, `answer`, and, on a decline, the user's reason as `reason` (asked for when the answer did not give one); it acts on the answer only once that emit has written the record: on `signed` it goes on; on `declined` it stops before the sync, says the change stays active and the user's reason is recorded, and asks nothing further: what happens next is the user's direction. When the emit is refused or fails, whatever the answer, it stops before the sync, naming the refusal: a signature that is not recorded lifts no hold |

The rows are the hold command's failure and the hold's four `why` values, the save's own failure joining `no-copy` (an
earlier copy may still be saved, but it is not the text this archive would sync); the `unsigned` row carries the write of
the answer, its success and its failure. An archive that stops at the hold writes no run summary, as an aborted archive writes none; the brief's saved
copy and any sign-off stay in the active change's history.

The question is a DECISION prompt (`orbit-conventions`' `A chain treats each prompt by its kind`): an archive the
`chain` object allowed asks it exactly as an archive the user typed, and the chain does not continue after it. The
consent prompt is unchanged: a granted arrival still records `consent: "setting"`, which a sign-off does not replace.

The bulk-archive workflow SHALL run the same step for each change, after that change's brief save and before its sync,
with the same table: a change whose hold stops is not archived and stays active, and the others go on; the bulk
summary reports it among the changes not archived, with the reason.

With every setting at its default, nothing the user sees or is asked changes: the hold reports `why: "off"` with no
warning and the archive goes on silently (`automate-dev-flow`'s R-adf-12). Each body carries the command, the table,
and the `orbit emit signoff` invocation with its fields, so an installed skill needs no spec to run the step; a test
holds each body carrying them.

#### Scenario: A default archive reads the hold and asks nothing

- **WHEN** `/orbit:archive foo` runs with every setting at its default
- **THEN** the hold reports `why: "off"`, no sign-off is asked for, nothing about the hold is shown, and the archive
  completes as it did before the step existed

#### Scenario: A default archive is not stopped by an unreadable history

- **WHEN** `/orbit:archive foo` runs with every setting at its default, and `foo`'s `.orbit-runs/brief/` folder exists and
  cannot be listed
- **THEN** the hold reports `why: "off"` without reading the folder, and the archive goes on exactly as it would without
  the hold step

#### Scenario: Under `change`, the archive shows the copy and asks

- **WHEN** `/orbit:archive foo` runs under `signoff: change` and the hold reports `why: "unsigned"`
- **THEN** the latest saved copy is shown whole and the user is asked to sign off or decline before the sync assessment

#### Scenario: A signature lets the archive go on

- **WHEN** the user signs off at `foo`'s hold
- **THEN** a `signoff` record saying `signed` and naming the copy is written, and the archive goes on to the sync
  assessment

#### Scenario: A signature whose record is not written stops the archive

- **WHEN** the user signs off at `foo`'s hold and `orbit emit signoff --change foo` is refused
- **THEN** the archive stops before the sync naming the refusal, nothing is synced or moved, and `foo` stays active

#### Scenario: A decline stops the archive and keeps the change active

- **WHEN** the user declines at `foo`'s hold, giving a reason
- **THEN** a `signoff` record saying `declined` with that reason is written, nothing is synced or moved, no run summary
  is written, and `foo` stays under `orbit/changes/`

#### Scenario: A copy already signed is not asked again

- **WHEN** `foo`'s archive stopped at the sync prompt after a signature, and the next archive saves a copy with the same
  text
- **THEN** the hold reports `why: "signed"`, the archive states that in one line, and no sign-off is asked for

#### Scenario: An unrecognized value warns and goes on

- **WHEN** `/orbit:archive foo` runs under `signoff: program`
- **THEN** the archive states the hold's warning in one line, asks no sign-off, and completes

#### Scenario: Bulk archive asks per change

- **WHEN** `/orbit:bulk-archive` archives `foo` and `bar` under `signoff: change`, and the user signs `foo` and declines
  `bar`
- **THEN** `foo` is archived, `bar` stays active, and the bulk summary reports `bar` among the changes not archived with
  the user's reason

## MODIFIED Requirements

### Requirement: The archive saves the change's brief before the sync

The archive workflow SHALL save the change's brief (`orbit-program-brief`'s `A change's brief is saved, never
overwritten`) under every setting, at a step after the pre-archive audit sweep and its prompt and BEFORE the sync
assessment (upstream Step 4), by running `orbit brief --change <name> --save` while the change is still active, so the
copy is written into the change's own history and moves with it. The step sits there because a sign-off given per
change (`The archive holds for a per-change sign-off`, the step that follows it) waits before anything is synced or
moved, and must cite a copy that already exists; the copy is therefore rendered before the
archive record exists (`orbit-program-brief`'s `A brief says only what the archive recorded`).

| the save | the archive |
|---|---|
| succeeds | says nothing about it and goes on |
| exits non-zero (the brief cannot be rendered whole, or a racing writer took its name) | composes ONE `warnings` entry naming the failure as the command reported it, for the Step 5.5 run summary, says nothing about it in chat, and goes on to the hold: under every sign-off setting but `change` a brief that cannot be saved never stops an archive; under `change` the hold stops it, since there is no copy to sign (`The archive holds for a per-change sign-off`) |
| ran, and the archive then stops (an abort or a cancel at a later prompt) | the copy stays in the active change's history; the next archive saves a new one, and the latest is the change's brief |

The rows are the save's two outcomes (written, or refused whole) and the one way an archive can end after it without
completing (it stops before the sync and the move).

With every setting at its default, nothing the user sees or is asked changes: the save is a record (`automate-dev-flow`'s
R-adf-9), the tail does not name it (`PR-attached archive tail`), and a failure is recorded, never shown. The bulk-archive
workflow SHALL run the same step per change, after that change's base-fingerprint check and before its sync (its Step
8a), with the same table. Each body carries the
command and the table, so an installed skill needs no spec to run the step; a test holds each body carrying them.

#### Scenario: A default archive saves the brief before the sync

- **WHEN** `/orbit:archive foo` runs with every setting at its default, and `foo`'s delta spec adds a requirement
- **THEN** the archived change's `.orbit-runs/brief/` holds one `brief-<TS>.md` whose requirements section says no
  archive has recorded a sync yet, and the completion readout is what it was before the save existed

#### Scenario: A failed save is recorded, not shown, and the archive completes

- **WHEN** with the sign-off setting not `change`, the save step's `orbit brief --change foo --save` exits non-zero naming
  an unreadable record
- **THEN** the archive syncs, moves and writes its run summary, whose `warnings` carries one entry naming the failure,
  and nothing about the brief is shown

#### Scenario: A stopped archive leaves its copy, and the next saves another

- **WHEN** the brief is saved and the user then cancels at the sync prompt, and later archives `foo` again
- **THEN** the first copy stays in `foo`'s history, the second archive saves a second copy, and the latest is `foo`'s
  brief

#### Scenario: Bulk archive saves each change's brief

- **WHEN** `/orbit:bulk-archive` archives `foo` and `bar`
- **THEN** each change's brief is saved before that change's sync, and each archived history holds its own copy

#### Scenario: A failed save under `change` stops at the hold

- **WHEN** under `signoff: change` the save step's `orbit brief --change foo --save` exits non-zero naming an unreadable
  record
- **THEN** the archive stops before the sync, naming the failure and saying there is no copy to sign; nothing is synced
  or moved, and `foo` stays active
