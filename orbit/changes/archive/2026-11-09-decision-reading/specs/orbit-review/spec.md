## ADDED Requirements

### Requirement: The reading step checks decision records in system review

An in-context system review SHALL run a READING STEP whenever `orbit decisions brief <change>` selects records
(`orbit-decision-records`' `The reading step's brief is rendered by orbit`): the invoking session renders the brief,
dispatches a clean-context subagent given that brief verbatim and nothing else, folds the reader's findings into
the pass's own findings, and lists the filenames the brief rendered in the emit's `decision_records_read`
(`orbit-emit-composition`'s `The reading's selection is recorded at review and archive`). The brief it dispatches and
the filenames it records come from ONE run of `orbit decisions brief <change> --json` (its `markdown` and its
`selected`), so the read list names exactly what the reader was given. The reader judges each record against the reader rows of `orbit-decision-records`' `The
plain-language rule is held by structure and by a reader`.

Where it runs, and where it does not:

| context | the reading step |
|---|---|
| system review, in-context pass, records selected | runs, in either pass genre, at every depth (`--fast` included); the pass lists `reading` in `passes_run` and the brief's records in `decision_records_read` |
| system review, in-context pass, nothing selected | not run; the pass lists `reading` in neither list, or in `passes_skipped` with the note in its commentary that nothing was selected |
| system review, in-context pass, records selected, and no subagent can be dispatched | not run; the pass lists `reading` in `passes_skipped`, gives the reason in its commentary, and lists no `decision_records_read`, so the records stay selected for the next reading |
| system review, in-context pass, records selected, and `orbit decisions brief` fails | not run; as the row above, the command's error in the commentary |
| system review, fresh or external pass | not run: a fresh reviewer is itself a dispatched worker, and the external runner cannot dispatch; the in-context pass of the same cycle reads |
| proposal review | not run: records made while exploring and proposing travel into the change and are read at system review |
| architecture-mode review | not run — a named limit below |

The reading step is not one of the seven passes `System mode runs verify-change + six system-wide passes` counts, and it
is not part of Pass 4: it runs whether or not `orbit/lenses/perspectives.md` exists and whatever the depth, because its
trigger is the selected records. Its findings carry `pass: "reading"`, are scored under Coherence, and are graded by
`orbit-conventions`' Severity ladder by consequence: a record a reader would misread, or whose restatement shifts what
it cites, is a WARNING; one that only slows a reader is a SUGGESTION; the brief states this rule to the reader. The
reader names each record by its filename; the session sets the finding's `file` to that record's path, and its title
names the record and the reader row. On a VERIFICATION-genre pass a reading finding carries no `walk_entry`, so
it renders `[outside the walk record]`, as `Verification-genre passes grade the walk record` marks any unlinked
finding.

The reader is NOT a review-genre reviewer: `Review-genre passes read the artifacts and the code, never the trail's
findings` governs the pass that dispatches it, not the reader's brief, which orbit renders and which carries the
records' content and points at no file to open. Its findings are walked like any finding, and a record they fix is fixed by a
replacement (`orbit-decision-records`' `A record is fixed by a replacement, never edited`).

Named limit — records written by the walk of the in-context pass's own findings, and records of an architect session,
are read by no reading step before archive; the archive emit records how many a change carries
(`orbit-emit-composition`'s `The reading's selection is recorded at review and archive`), and the program brief brings
them to the user at sign-off when sign-off is on.

Residual kind: a record written in work no system review cycle reaches, or at a step a later stage adds after the last reading

Residual method: when a stage adds a step that writes records, its proposal places it against this table; the archive emit's unread count surfaces any that reach archive unread

#### Scenario: The reading runs on a change with records

- **WHEN** an in-context system review runs on a change whose `decisions/` holds a ledger entry no in-context system
  review emit lists as read
- **THEN** the session renders the brief, dispatches a clean subagent with it, folds its findings with `pass:
  "reading"`, lists `reading` in `passes_run` and lists the brief's records in `decision_records_read`

#### Scenario: No records, no reading

- **WHEN** an in-context system review runs on a change with no `decisions/` folder
- **THEN** no reader is dispatched and the emit is written without `reading` in `passes_run`

#### Scenario: The reader's brief carries no path

- **WHEN** the reading step dispatches its reader
- **THEN** the subagent's brief is the output of `orbit decisions brief <change>` and nothing else: no file to open, no
  finding title, no pass token

#### Scenario: The reading runs with no perspectives defined

- **WHEN** an in-context system review runs with `--fast` on a change with selected records and no
  `orbit/lenses/perspectives.md`
- **THEN** Pass 4 is skipped as today, and the reading step still runs

#### Scenario: A fresh pass does not read

- **WHEN** a fresh system review pass runs on a change with selected records
- **THEN** it dispatches no reader and lists `reading` in neither list; its emit carries no `decision_records_owed` and no
  `decision_records_read`
