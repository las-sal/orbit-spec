## ADDED Requirements

### Requirement: A brief tells the user what a change or a program did, from the trail

orbit SHALL compose the BRIEF of one change, or of a program (an architecture doc), from what the trail already holds,
written for a reader who knows only the program's architecture doc (`automate-dev-flow`'s stage program-brief, R-adf-7,
G5). A CHANGE BRIEF covers one change; a PROGRAM BRIEF covers every change whose metadata cites the doc
(`architecture.doc`), active or archived, grouped by the stage each cites in the order the doc declares its stages (a
cited stage the doc does not declare comes after them, under its id), followed by the architecture trail's decision
records whose `doc` is that doc. A change citing no doc has a change brief and is in no program brief.

A change brief carries these sections, in this order, each from the source named:

| section | covered by |
|---|---|
| what was built | the latest account's `built` (`orbit-decision-records`' `Each change carries one account, written when apply is complete`); a change with no account says none was written |
| capabilities and requirements added or changed | the archive record's `sync_specs` (the capabilities updated and the counts), with the requirement titles from the change's delta specs under the heading of each delta operation; before archive, the delta specs alone, as `A brief rendered before its change's archive record says what it cannot yet show` states |
| new terms | every `defines` entry of the latest record in each chain of the change's `decisions/` folder and of its latest account, each term once (the definition of the latest record defining it) |
| new seams | the latest account's `seams` |
| the ledger | the latest ledger entry of each chain: its `decided`, `alternatives` and `why`, and what it relies on (each citation by kind and name) or the stop it raised |
| stops | the latest stop record of each chain: its `about` and `question`, with the `answer` and `effect` of the latest resolution naming any record of its chain, or marked open |
| tripwires | until stage tripwires of `automate-dev-flow` ships, one line saying tripwires are not installed, never that none fired |
| deviations from the charter | the latest account's `deviations`, beside the signals orbit computes: the archive record's `warnings`, the `accepted` claims of its `readiness` judgement, and each dimension a `## Size` section of the change's `proposal.md` declares breached |
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`), by filename, and the account when one exists, as checked by no reader (`No reader takes the account yet`) |

The sections are the stage charter's list in `orbit/architecture/automate-dev-flow.md`, plus the records no reader
checked that `orbit-review`'s named limit on the reading step assigns to the brief; a program brief carries, for the
architecture trail's records, the new terms, the ledger and the stops sections.

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

#### Scenario: A term defined twice is shown once

- **WHEN** two latest records of a change both define `hold`
- **THEN** the new terms section shows `hold` once, with the definition of the later record

#### Scenario: A program brief groups changes by stage

- **WHEN** `orbit/architecture/prog.md` declares stages `a` then `b`, archived change `x` cites stage `b`, active
  change `y` cites stage `a`, change `z` cites no doc, and the architecture trail holds a ledger entry of `doc: "prog"`
- **THEN** the program brief carries `y` under stage `a`, then `x` under stage `b`, then the architecture trail's
  ledger entry, and nothing of `z`

### Requirement: A brief rendered before its change's archive record says what it cannot yet show

A change brief SHALL render each section whose source is the archive record by this table whenever no archive record
exists for the change — on demand for an active change, and in the copy the archive saves before its sync
(`orbit-archive-modifications`' `The archive saves the change's brief before the sync`):

| section (its archive-record source) | covered by |
|---|---|
| capabilities and requirements added or changed (`sync_specs`) | the requirement titles from the change's delta specs, under the heading of each delta operation, marked as not yet synced when the brief was rendered |
| deviations: the archive's warnings and its readiness judgement's accepted claims (`warnings`, `judgements[].accepted`) | a line saying the archive records them after this brief and that they appear in the program brief and in the brief of the archived change; the account's `deviations` and a declared size breach still show |
| records no reader checked (`decision_records_unread`) | the records the selection returns, the same selection the archive's count uses, so the brief and the archive record agree |

The rows are the archive record's keys the change brief reads: `sync_specs`, `warnings`, `judgements[].accepted` and
`decision_records_unread`, of which only the last has a source before the archive.

#### Scenario: An active change's brief lists its delta specs as not yet synced

- **WHEN** `orbit brief --change foo` runs on active change `foo` whose delta spec adds requirement `R` to capability
  `cap`
- **THEN** the capabilities section names `cap` and `R` under the ADDED heading, marked as not yet synced

#### Scenario: The archive's own signals are promised, not omitted silently

- **WHEN** a change brief is rendered for an active change
- **THEN** the deviations section says the archive's warnings and accepted risks are recorded after this brief and where
  they appear

#### Scenario: The unread records agree with the archive's count

- **WHEN** a change's brief is saved before its archive and the archive then records `decision_records_unread: 2`
- **THEN** the saved brief lists the same two records as checked by no reader

### Requirement: `orbit brief` renders a brief read-only

`orbit brief --change <name>` SHALL render a change brief and `orbit brief <doc>` a program brief, to standard output,
writing no file. `--json` prints the same content as structured data, with the brief's text as `markdown`. The change is
found as an active change at `orbit/changes/<name>/`, else as the newest archived change
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`; its archive record, when archived, is the latest `archive-*.json` in its
history. A `<doc>` names `orbit/architecture/<doc>.md`. Both names are held to the emit surface's single-name rule.
Giving both `<doc>` and `--change`, or neither, is a usage error.

A brief is whole or absent, never partial, as `orbit decisions brief`'s is: when the change or the doc is not found, or a
record, the account, the archive record or a delta spec the brief reads cannot be read or is not valid, the command
exits non-zero naming it and prints nothing to standard output.

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

#### Scenario: Both units at once is a usage error

- **WHEN** `orbit brief prog --change foo` runs
- **THEN** the command exits non-zero saying to name either a doc or a change, and prints nothing to standard output

### Requirement: A change's brief is saved, never overwritten

`orbit brief --change <name> --save` SHALL save an ACTIVE change's brief as
`orbit/changes/<name>/.orbit-runs/brief/brief-<TS>.md`, the brief's text exactly as the render prints it, `<TS>` the
trail's UTC token (`YYYY-MM-DDTHH-MM-SSZ`). It prints the saved file's path and the SHA-256 of its bytes (lower-case
hex); with `--json`, the brief's data with a `saved` object carrying `path` and `sha256`. The save is the archive's
step (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`), and may be run by hand.

The save never overwrites: the file is published by the same exclusive link the decision records use, so a name already
taken refuses the save naming it, and nothing is written. It writes nothing when the brief cannot be rendered whole, and
it refuses an archived change, since orbit writes no record to an archived change's history. A change's saved briefs
are kept in time order; the latest is the change's brief. The `brief/` folder moves with the change when it is archived,
as the rest of its history does, and no reader of run summaries reads it: `orbit status`, the reviewed gates and the
report render read only the files directly in `.orbit-runs/`.

Saving the PROGRAM brief, at the architect session that finds a program finished, is stage program-brief's third
change (D-br-5 in this change's `explore.md`); `--save` with a doc and no `--change` is a usage error saying so.

#### Scenario: A saved brief is the printed brief, with its hash

- **WHEN** `orbit brief --change foo --save` runs on active change `foo`
- **THEN** `orbit/changes/foo/.orbit-runs/brief/brief-<TS>.md` holds exactly the text `orbit brief --change foo` prints,
  and the printed hash is the SHA-256 of that file

#### Scenario: A taken name is refused, not overwritten

- **WHEN** a save draws a `<TS>` whose `brief-<TS>.md` already exists in the change's `brief/` folder
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
