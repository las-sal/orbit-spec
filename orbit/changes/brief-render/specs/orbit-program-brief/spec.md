## ADDED Requirements

### Requirement: A brief tells the user what a change or a program did, from the trail

orbit SHALL compose the BRIEF of one change, or of a program (an architecture doc), from what the trail already holds,
written for a reader who knows only the program's architecture doc (`automate-dev-flow`'s stage program-brief, R-adf-7,
G5). A CHANGE BRIEF covers one change; a PROGRAM BRIEF covers every change whose metadata cites the doc
(`architecture.doc`), active or archived, grouped by the stage each cites in the order the doc declares its stages (a
cited stage the doc does not declare comes after them, under its id; a citing change whose metadata names no stage comes
last, under a heading saying it names no stage), followed by the architecture trail's decision records whose `doc` is
that doc. Within a stage, archived changes come first in the order they were archived, then active changes by name. A
doc that declares no stages (one the architecture parser reads as LEGACY) groups its citing changes by the stage ids they
cite, each group in the order of its earliest change. A change citing no doc has a change brief and is in no program
brief.

A change brief carries these sections, in this order, each from the source named:

| section | covered by |
|---|---|
| what was built | the latest account's `built` (`orbit-decision-records`' `Each change carries one account, written when apply is complete`); a change with no account says none was written |
| capabilities and requirements added or changed | the requirement titles from the change's delta specs, under the heading of each delta operation, with what the change's archive record says of the sync, as `A brief says only what the archive recorded` states |
| new terms | every distinct term and definition in the `defines` lists of the latest record in each chain of the change's `decisions/` folder and of its latest account, once each, naming the records that define it; a term defined two ways appears once per definition |
| new seams | the latest account's `seams` |
| the ledger | the latest ledger entry of each chain: its `decided`, `alternatives` and `why`, and what it relies on (each citation by kind and name) or the stop it raised |
| stops | the latest stop record of each chain: its `about` and `question`, with the `answer` and `effect` of the latest resolution naming any record of its chain, or marked open |
| tripwires | until stage tripwires of `automate-dev-flow` ships, one line saying tripwires are not installed, never that none fired |
| deviations from the charter | the latest account's `deviations`, beside the signals orbit computes: the archive record's `warnings` and the `accepted` claims of its `readiness` judgement, as `A brief says only what the archive recorded` states, and each dimension a `## Size` section of the change's `proposal.md` declares breached |
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`) when the brief is rendered, by filename, as `A brief says only what the archive recorded` states, and the account when one exists, as checked by no reader (`No reader takes the account yet`) |

The sections are the stage charter's list in `orbit/architecture/automate-dev-flow.md`, plus the records no reader
checked that `orbit-review`'s named limit on the reading step assigns to the brief; a program brief carries, for the
architecture trail's records, the new terms, the ledger and the stops sections.

Within a section, entries are in the order of their records' timestamps, oldest first; new terms are in the order of the
term, then of the earliest record defining it. A term's definition belongs to the record that wrote it, so a term two
records define the same way is shown once naming both, and a term defined two ways is shown with each definition beside
the records that wrote it.

The text orbit writes around the records — headings, labels, the lines for an absent account, an open stop and
uninstalled tripwires — is plain language by the same rule as the records (`orbit-decision-records`' `Decision records
are written for a reader who knows only the architecture`). A record's prose is shown as written. A requirement title
is shown as its spec names it, under a heading that says it is the spec's title, since orbit cannot make it plain.

#### Scenario: A change brief carries every section

- **WHEN** an archived change citing `prog` holds an account, a ledger entry, a stop with its resolution and an archive
  record whose `sync_specs` names one capability
- **THEN** its brief carries, in order, what was built, the capabilities and requirements with their titles, the new
  terms, the seams, the ledger entry, the stop with its answer, the tripwires line, the deviations and the records no
  reader checked

#### Scenario: A change with no account says so

- **WHEN** a change brief is rendered for a change whose history holds no `account/` folder
- **THEN** what was built, the seams and the account's deviations each say no account was written, and the other
  sections render from their sources

#### Scenario: A replaced ledger entry shows its latest wording

- **WHEN** `ledger-A` is replaced by `ledger-B`
- **THEN** the ledger section shows `ledger-B`'s fields and not `ledger-A`'s

#### Scenario: An unanswered stop is marked open

- **WHEN** a stop record has no resolution naming any record of its chain
- **THEN** the stops section shows its `about` and `question` and marks it open

#### Scenario: Tripwires are never reported as quiet

- **WHEN** any brief is rendered before stage tripwires ships
- **THEN** it says tripwires are not installed, and never that none fired

#### Scenario: One definition from two records is shown once

- **WHEN** two latest records of a change both define `hold` as "a wait for the user's answer"
- **THEN** the new terms section shows `hold` once with that definition, naming both records

#### Scenario: Two definitions of a term are both shown

- **WHEN** `ledger-A` defines `hold` one way and the change's account defines it another
- **THEN** the new terms section shows `hold` twice, each definition beside the record that wrote it

#### Scenario: A program brief groups changes by stage

- **WHEN** `orbit/architecture/prog.md` declares stages `a` then `b`, archived change `x` cites stage `b`, active
  change `y` cites stage `a`, change `z` cites no doc, and the architecture trail holds a ledger entry of `doc: "prog"`
- **THEN** the program brief carries `y` under stage `a`, then `x` under stage `b`, then the architecture trail's
  ledger entry, and nothing of `z`

### Requirement: A brief says only what the archive recorded

A change brief SHALL render each section whose source is the change's archive record by what that record says, by this
table, and never infer a sync or a judgement no record states:

| the change | capabilities and requirements added or changed | the archive's warnings and accepted risks |
|---|---|---|
| active — on demand, and the copy the archive saves before its sync (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`) | the delta's titles as what the change proposes, with a line saying no archive has recorded a sync yet | a line saying its archive records them after this brief, and that they appear in the archived change's brief and the program brief |
| archived, its record's `sync_specs.ran` true | the capabilities updated and the counts `sync_specs` reports, with the delta's titles | the record's `warnings` and the `accepted` claims of its `readiness` judgement |
| archived, its record's `sync_specs.ran` false | the delta's titles, with a line saying the archive recorded no sync, and its `skipped_reason` when it has one | the record's `warnings` and the `accepted` claims of its `readiness` judgement |
| archived, with no archive record (archived before orbit recorded archives, or brought from OpenSpec) | the delta's titles, with a line saying the change was archived without an archive record, so whether they were synced is not recorded | a line saying no archive record holds any |

The rows are the three states an archived change's history can show of its archive (a record whose sync ran, one whose
sync was skipped, none) and the active change, which has none yet; the columns are the archive record's keys the change
brief reads, `sync_specs`, and `warnings` with `judgements[].accepted`. An active change already synced by
`/orbit:sync` reads as active: no archive has recorded its sync.

The records no reader checked are those the selection returns when the brief is rendered: a SNAPSHOT. The copy the
archive saves before its sync therefore lists the records written before the save. A record the archiving session writes
after it — at the sync, or before the move — is counted in the archive record's `decision_records_unread` and is not in
the copy, so the copy's section says that records written after it appear in the archived change's brief and the program
brief. When no record is written after the save, the copy and the archive record's count agree.

#### Scenario: An active change's brief lists its delta as proposed

- **WHEN** `orbit brief --change foo` runs on active change `foo` whose delta spec adds requirement `R` to capability
  `cap`
- **THEN** the capabilities section names `cap` and `R` under the ADDED heading, with a line saying no archive has
  recorded a sync yet, and nothing in it says the requirements were or were not synced

#### Scenario: The archive's own signals are promised, not omitted silently

- **WHEN** a change brief is rendered for an active change
- **THEN** the deviations section says the archive's warnings and accepted risks are recorded after this brief and where
  they appear

#### Scenario: An archive that skipped the sync says so

- **WHEN** archived change `foo`'s archive record carries `sync_specs.ran: false` and its delta adds requirement `R`
- **THEN** the capabilities section lists `R` with a line saying the archive recorded no sync, and does not show `R` as
  synced

#### Scenario: A change archived without an archive record says so

- **WHEN** `orbit brief --change rename-followups` runs and the change exists only as
  `orbit/changes/archive/2026-06-08-rename-followups/`, whose history holds no `archive-*.json`
- **THEN** the capabilities section lists the delta's titles with a line saying the change was archived without an archive
  record, the deviations section says no archive record holds warnings or accepted risks, and nothing says a sync is
  still to come

#### Scenario: The copy and the archive's count agree when nothing is written after the save

- **WHEN** a change's brief is saved before its archive, no record is written before the move, and the archive then
  records `decision_records_unread: 2`
- **THEN** the saved brief lists the same two records as checked by no reader

#### Scenario: A record written after the save is the archive's to count, and the copy says so

- **WHEN** a change's brief is saved listing two unread records, and the archiving session then writes a ledger entry
  before the move
- **THEN** the archive record carries `decision_records_unread: 3`, the copy still lists two, and its section says that
  records written after it appear in the archived change's brief and the program brief

### Requirement: `orbit brief` renders a brief read-only

`orbit brief --change <name>` SHALL render a change brief and `orbit brief <doc>` a program brief, to standard output,
writing no file. `--json` prints the same content as structured data, with the brief's text as `markdown`. The change is
found as an active change at `orbit/changes/<name>/`, else as the newest archived change
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`; its archive record, when archived, is the latest `archive-*.json` in its
history. A `<doc>` names `orbit/architecture/<doc>.md`. Both names are held to the emit surface's single-name rule.
Giving both `<doc>` and `--change`, or neither, is a usage error.

A brief is whole or absent, never partial, as `orbit decisions brief`'s is: when the change or the doc is not found, the
doc is one the architecture parser reads as MALFORMED (the refusal names `orbit architecture validate <doc>`), or a
record, the account, the archive record or a delta spec the brief reads cannot be read or is not valid, the command exits
non-zero naming it and prints nothing to standard output.

#### Scenario: A change brief is printed and nothing is written

- **WHEN** `orbit brief --change foo` runs on an active change
- **THEN** the brief is printed to standard output and no file in the repository changes

#### Scenario: JSON carries the text too

- **WHEN** `orbit brief --change foo --json` runs
- **THEN** the output is one JSON object holding the brief's sections and its text as `markdown`, the same text the run
  without `--json` prints

#### Scenario: An archived change is found

- **WHEN** `orbit brief --change foo` runs and `foo` exists only as `orbit/changes/archive/2026-11-13-foo/`
- **THEN** the brief renders from the archived history, its archive record included

#### Scenario: An unreadable record fails the brief

- **WHEN** a change's `decisions/` folder holds a record that is not valid JSON
- **THEN** `orbit brief --change` exits non-zero naming the record and prints nothing to standard output

#### Scenario: A malformed doc fails the program brief

- **WHEN** `orbit brief prog` runs and `orbit/architecture/prog.md` has a stage heading that breaks the stage grammar
- **THEN** the command exits non-zero naming `orbit architecture validate prog` and prints nothing to standard output

#### Scenario: Both units at once is a usage error

- **WHEN** `orbit brief prog --change foo` runs
- **THEN** the command exits non-zero saying to name either a doc or a change, and prints nothing to standard output

### Requirement: A change's brief is saved, never overwritten

`orbit brief --change <name> --save` SHALL save an ACTIVE change's brief as
`orbit/changes/<name>/.orbit-runs/brief/brief-<TS>.md`, `<TS>` the trail's UTC token (`YYYY-MM-DDTHH-MM-SSZ`) drawn
unique within `brief/` by the same collision bump the decision records' and the account's folders use. The file holds
exactly the bytes `orbit brief --change <name>` prints, its final newline included, so the SHA-256 of that output equals
the file's. The command prints two lines and not the brief: the saved file's path, then `sha256 <hex>`, the SHA-256 of
the file's bytes in lower-case hex; with `--json`, the brief's data with a `saved` object carrying `path` and `sha256`.
The save is the archive's step (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`),
and may be run by hand.

The save never overwrites: the file is published by the same exclusive link the decision records use, so a writer that
races another to the same name is refused naming it, and nothing is written. It writes nothing when the brief cannot be
rendered whole, and it refuses an archived change, since orbit writes no record to an archived change's history. A
change's saved briefs are kept in time order; the latest is the change's brief. The `brief/` folder moves with the change
when it is archived, as the rest of its history does, and no reader of run summaries reads it: `orbit status`, the
reviewed gates and the report render read only the files directly in `.orbit-runs/`.

Saving the PROGRAM brief, at the architect session that finds a program finished, is stage program-brief's third
change (D-br-5 in this change's `explore.md`); `--save` with a doc and no `--change` is a usage error saying so.

#### Scenario: A saved brief is the printed brief, with its hash

- **WHEN** `orbit brief --change foo --save` runs on active change `foo`
- **THEN** `orbit/changes/foo/.orbit-runs/brief/brief-<TS>.md` holds exactly the bytes `orbit brief --change foo` prints,
  the command prints that path and then `sha256 <hex>`, and `<hex>` is the SHA-256 of the file

#### Scenario: A second save in the same second takes the next token

- **WHEN** two saves of `foo`'s brief run within one second
- **THEN** the second draws the next token, both files exist, and neither is overwritten

#### Scenario: A racing writer is refused, not overwritten

- **WHEN** another writer publishes `brief-<TS>.md` after a save drew `<TS>` and before it publishes
- **THEN** the save exits non-zero naming the file, and the existing file is unchanged

#### Scenario: An archived change's brief is not saved

- **WHEN** `orbit brief --change foo --save` runs and `foo` exists only in the archive
- **THEN** the command exits non-zero saying orbit writes nothing to an archived change's history, and no file is written

#### Scenario: A brief that cannot be rendered saves nothing

- **WHEN** `orbit brief --change foo --save` runs and a record in `foo`'s `decisions/` folder is not valid JSON
- **THEN** the command exits non-zero naming the record, and no file is written under `brief/`

#### Scenario: Today's readers do not see saved briefs

- **WHEN** a change's history holds a `brief/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it
