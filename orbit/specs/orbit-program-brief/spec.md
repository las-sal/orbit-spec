# orbit-program-brief Specification

## Purpose
The BRIEF of a change or of a program (stage `program-brief` of `automate-dev-flow`, R-adf-7, G5): what the work built, the capabilities and requirements it added or changed, the new terms and seams, the ledger, the stops, the tripwires line, the deviations from the charter and the records no reader checked, composed from what the trail already holds and written for a reader who knows only the program's architecture doc. A brief says only what the change's archive record states, in every shape such records have been written in. `orbit brief` renders a change brief or a program brief read-only, whole or absent; `--save` keeps an active change's brief in its own history, never overwritten, and prints the SHA-256 a later sign-off cites; for a doc it keeps the program's brief in the architecture trail's `brief/<doc>/` once the program is finished, and again only when its text changes. The archive saves each change's brief before its sync, and the architect session saves the program's. The `signoff` setting (`off`, the default, `change` or `program`) holds each change's archive until the user signs off on that saved copy (`change`), or the program's completion until the user signs off once on the program's latest saved brief (`program`); `orbit emit signoff` records the answer against the copy's SHA-256 (for a program, with the closing review it was given under), and `orbit brief --change <name> --hold` and `orbit brief <doc> --hold` read the change's and the program's hold.
## Requirements
### Requirement: A brief tells the user what a change or a program did, from the trail

orbit SHALL compose the BRIEF of one change, or of a program (an architecture doc), from what the trail already holds,
written for a reader who knows only the program's architecture doc (`automate-dev-flow`'s stage program-brief, R-adf-7,
G5). A CHANGE BRIEF covers one change; a PROGRAM BRIEF covers every change whose metadata cites the doc
(`architecture.doc`), active or archived, grouped by the stage each cites in the order the doc declares its stages (a
cited stage the doc does not declare comes after them, under its id; a citing change whose metadata names no stage comes
last, under a heading saying it names no stage), followed by the architecture trail's decision records whose `doc` is
that doc. Within a stage, archived changes come first in the order they were archived (the timestamp of each one's latest
archive record, or its archive directory's date when it has none), then active changes by name. A
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
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`) when the brief is rendered, by filename, as `A brief says only what the archive recorded` states; under every sign-off setting but `change` and `program`, the account, when one exists, named apart as checked by no reader; under `change` or `program` the latest account is among the records the selection returns while no reading has listed it, and is not named once a reading has (`orbit-decision-records`' `The reader takes the account when the user signs off`) |

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

#### Scenario: An account the reader takes is listed with the records

- **WHEN** `orbit brief --change foo` runs under `signoff: change` on a change whose history holds `account-A`, which no
  reading has listed, and no decision record
- **THEN** the records-no-reader-checked section lists `account-A` among the records the selection returns, and does not
  name it apart

#### Scenario: An account a reader checked is not listed as unchecked

- **WHEN** `orbit brief --change foo` runs under `signoff: change` and an in-context system review emit lists `foo`'s
  latest account, `account-A`, in `decision_records_read`
- **THEN** the records-no-reader-checked section names `account-A` neither among the selection's records nor apart

#### Scenario: Under `program`, an unread account is listed with the records

- **WHEN** `orbit brief --change foo` runs under `signoff: program` on a change whose history holds `account-A`, which no
  reading has listed
- **THEN** the records-no-reader-checked section lists `account-A` among the records the selection returns, and does not
  name it apart

### Requirement: A brief says only what the archive recorded

A change brief SHALL render each section whose source is the change's archive record by what that record says, by this
table, and never infer a sync or a judgement no record states:

| the change | capabilities and requirements added or changed | the archive's warnings and accepted risks |
|---|---|---|
| active — on demand, and the copy the archive saves before its sync (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`) | the delta's titles as what the change proposes, with a line saying no archive has recorded a sync yet | a line saying its archive records them after this brief, and that they appear in the archived change's brief and the program brief |
| archived, its record stating the sync ran | the capabilities updated and the counts `sync_specs` reports, when it reports them, with the delta's titles | the record's `warnings` and the `accepted` claims of its `readiness` judgement |
| archived, its record stating the sync did not run | the delta's titles, with a line saying the archive recorded no sync, and its `skipped_reason` when it has one | the record's `warnings` and the `accepted` claims of its `readiness` judgement |
| archived, its record stating the sync in none of the shapes below | the delta's titles, with a line saying the record does not say, in a form orbit reads, whether they were synced | the record's `warnings` and the `accepted` claims of its `readiness` judgement |
| archived, with no archive record (archived before orbit recorded archives, or brought from OpenSpec) | the delta's titles, with a line saying the change was archived without an archive record, so whether they were synced is not recorded | a line saying no archive record holds any |

The rows are the four states an archived change's history can show of its archive (a record stating the sync ran, one
stating it did not, one stating neither in a shape the brief reads, none) and the active change, which has none yet; the
columns are the archive record's keys the change brief reads, the sync's statement, and `warnings` with
`judgements[].accepted`. An active change already synced by `/orbit:sync` reads as active: no archive has recorded its
sync.

A record states the sync in the current shape, `sync_specs.ran` true or false, or in one of the earlier shapes archive
records were written in, which the brief reads as they state it: `specs_synced` true or false; `sync.synced` true or
false; and a `sync_specs` without `ran` that lists at least one capability in `capabilities_updated`, which states the
sync ran. The first of these present decides. A record stating it in none of them is the fourth archived row, never read
as synced or as not synced.

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

#### Scenario: An archive record of an earlier shape is read as it states the sync

- **WHEN** archived change `foo`'s archive record carries `specs_synced: true` and no `sync_specs`, and archived change
  `bar`'s carries none of the shapes the brief reads
- **THEN** `foo`'s capabilities section says the archive synced them, and `bar`'s says its record does not say, in a form
  orbit reads, whether they were synced, and neither brief is refused

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
record, the account, the archive record, the change's metadata or a delta spec the brief reads cannot be read or is not
valid, the command exits non-zero naming it and prints nothing to standard output. A delta spec is not valid when it
states no requirement under an ADDED, MODIFIED, REMOVED or RENAMED Requirements heading, and a capability folder under
`specs/` with no `spec.md` is refused as one; a record is not valid when the write gate would refuse its shape. A folder
the brief reads that is absent reads as empty; one that exists and cannot be listed is refused, naming it. A program
brief reads only the architecture trail's records whose `doc` is its doc, and any record there that cannot be read at
all, whose doc cannot be known.

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

A PROGRAM's brief is saved by `orbit brief <doc> --save` into the architecture trail, not into a change's history
(`A program's brief is saved once the program is finished`).

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

### Requirement: A sign-off is recorded against the saved copy, and the hold reads it

A SIGN-OFF SHALL be the user's answer, under `signoff: change`, to the question the archive asks over a change's saved
brief (`A change's brief is saved, never overwritten`), kept as a `signoff` record at
`orbit/changes/<name>/.orbit-runs/signoff/signoff-<TS>.json`, beside the `account/` and `brief/` folders, and written by
`orbit emit signoff --change <name>` (`orbit-emit-composition`'s `The write gate checks the sign-off record`). It is not a
decision record: it records the user's answer over one copy, never a call or a stop, so `orbit-decision-records`'
`Three decision records, one job each` is unchanged and the reading step never selects it. A program's sign-off is the
same record over a program's saved brief, asked at the architect session rather than the archive
(`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`). Its fields:

| field | holds |
|---|---|
| `brief` | the filename of the saved copy the user read, `brief-<TS>.md`: the latest in the change's `brief/` folder when the record is written |
| `sha256` | written by orbit: the SHA-256 of that copy's bytes in lower-case hex, the figure `--save` printed for it |
| `answer` | `signed` or `declined` |
| `reason` | plain: the user's reason, in their words; required when `declined`, optional when `signed` |
| `defines`, `detail` | as the decision records have them |

Each answer the user gives, the save that follows a decline, and the setting's other values touch the record by this
table (D-pb-8 in `program-brief`'s `explore.md`):

| the moment | the record |
|---|---|
| the user signs | a record says `signed`, naming the copy; the hold lifts |
| the user declines | a record says `declined`, with the user's reason; the hold stays, and what happens next is the user's direction |
| the change is fixed after a decline and archived again | the archive saves a new copy; the next sign-off names it |
| the setting is not `change` | no sign-off is asked for, and the write gate refuses one |

A change's sign-offs are kept in time order and never replaced: each answers the copy it names, and the latest is the
change's current sign-off. The `signoff/` folder moves with the change when it is archived, and no reader of run
summaries reads it: `orbit status`, the reviewed gates and the report render read only the files directly in
`.orbit-runs/`.

`orbit brief --change <name> --hold` SHALL report, read-only and writing no file, whether an active change waits on a
sign-off: the sign-off setting's value and its warning when it has one, the latest saved copy by filename with the
SHA-256 of its bytes, the latest sign-off by filename with its answer, `why` and `held`, by the first row of this table
that matches:

| the change | `why` | held |
|---|---|---|
| the setting is not `change` | `off` | no |
| no saved copy in its `brief/` folder | `no-copy` | yes |
| its latest sign-off says `signed`, and that record's `sha256` equals the latest saved copy's | `signed` | no |
| any other state: no sign-off, a `declined` latest one, or a signed one over different text | `unsigned` | yes |

The hold reads the setting FIRST: under any value but `change` it reads no folder of the change's history and reports
`why: "off"` with no copy and no sign-off, so with the setting off it fails only on a usage error, never on the state of
the history. The first two rows decide by the setting and the folder; the last two split a change with a saved copy by
whether a signature covers that copy's exact text, so a copy saved again with the same text is not asked again, and a signature
over an earlier text does not lift the hold. The command prints one line naming `why`, the copy and the latest sign-off;
`--json` prints one object with exactly these keys: `change`; `setting`, `off`, `change` or `program`; `warning`, the
warning or `null`; `copy`, `{file, sha256}` for the latest saved copy or `null`; `signoff`, `{file, answer}` for the latest sign-off
or `null`; `why`; and `held`. With the setting off, `copy` and `signoff` are `null`, since no folder is read. It renders
no brief, so it answers when the brief cannot be rendered.

Under `change` the hold reads the two folders by filename: a saved copy is a file named `brief-<TS>.md` in `brief/`, a
sign-off a file named `signoff-<TS>.json` in `signoff/`, the latest of each the one with the greatest token, and any
other name is ignored; an absent folder reads as empty. A folder that exists and cannot be listed, a latest saved copy
that cannot be read, or a latest sign-off that cannot be read, is not valid JSON, or has a shape the write gate would
refuse (`orbit-emit-composition`'s `The write gate checks the sign-off record`) makes the command exit non-zero naming
it and print nothing to standard output. It never falls back to an earlier copy or an earlier sign-off: a damaged
latest record would otherwise let an older signature lift a hold that a later decline keeps.

Under every value, `--hold` with `--save`, or for a change that is not active, is a usage error: the command exits
non-zero, names the reason and prints nothing to standard output. `--hold` with a `<doc>` reads a program's hold
(`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`).

#### Scenario: A signature lifts the hold

- **WHEN** under `signoff: change` change `foo` holds `brief-A.md` and a sign-off naming it says `signed`
- **THEN** `orbit brief --change foo --hold --json` reports `why: "signed"` and `held: false`

#### Scenario: A decline keeps the hold and records the reason

- **WHEN** under `signoff: change` the user declines `foo`'s latest copy, saying the seams section leaves out a new prompt
- **THEN** the `signoff` record says `declined` with that reason, and the hold reports `why: "unsigned"` and
  `held: true`

#### Scenario: A copy saved again with the same text is not asked again

- **WHEN** `foo`'s `brief-A.md` was signed, the archive then stopped at a later prompt, and the next archive saves
  `brief-B.md` with the same bytes
- **THEN** the hold reports `why: "signed"`: the signature's `sha256` equals `brief-B.md`'s

#### Scenario: A signature over different text does not lift the hold

- **WHEN** `foo`'s `brief-A.md` was signed, and a later save writes `brief-B.md` whose bytes differ
- **THEN** the hold reports `why: "unsigned"` and `held: true`

#### Scenario: No saved copy holds with nothing to sign

- **WHEN** under `signoff: change` change `foo`'s history holds no `brief/` folder
- **THEN** the hold reports `why: "no-copy"` and `held: true`

#### Scenario: A damaged latest sign-off fails the hold, never reviving an earlier one

- **WHEN** under `signoff: change` change `foo`'s `signoff/` holds `signoff-A.json`, a `signed` record over the latest
  copy, and a later `signoff-B.json` that is not valid JSON
- **THEN** `orbit brief --change foo --hold` exits non-zero naming `signoff-B.json`, prints nothing to standard output,
  and does not report `foo` signed

#### Scenario: An unreadable history folder fails the hold under `change`

- **WHEN** under `signoff: change` change `foo`'s `.orbit-runs/brief/` folder exists and cannot be listed
- **THEN** the hold exits non-zero naming the folder and prints nothing to standard output

#### Scenario: Today's readers do not see the sign-offs

- **WHEN** a change's history holds a `signoff/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

#### Scenario: Under `program`, a change's hold reads no history

- **WHEN** under `signoff: program` change `foo`'s `.orbit-runs/brief/` folder exists and cannot be listed
- **THEN** `orbit brief --change foo --hold --json` reports `setting: "program"`, `why: "off"` and `held: false`, with
  no warning, and exits zero

### Requirement: The sign-off setting holds a change's archive or a program's completion for the user's sign-off

orbit SHALL read a SIGN-OFF SETTING, the `signoff` key of `orbit/config.yaml`, saying whether the user signs off on each
change before it lands, or once on a program before it is done (`automate-dev-flow`'s R-adf-2 as amended, R-adf-1,
R-adf-6; D-pb-12 in `program-brief`'s `explore.md`, D-ps-5 and D-ps-9 in `program-signoff`'s). It is read from that key alone, by each reader below, and no other setting derives it:

| the key's value | under every `pr:` mode |
|---|---|
| absent or `off`, or `orbit/config.yaml` absent or unreadable | nothing waits on a sign-off: today's behaviour; the archive still saves each change's brief (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`) |
| `change` | each change's archive waits for the user's sign-off over that change's saved brief (`orbit-archive-modifications`' `The archive holds for a per-change sign-off`); under `pr: per-proposal` the per-change READY flip the archive tail performs waits with it; under `pr: per-architecture` the program PR, which stage archives never flip, is untouched |
| `program` | nothing waits at any change's archive; the program's completion waits for the user's sign-off over the program's saved brief (`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`), and under `pr: per-architecture` the program PR's READY flip waits with it (`orbit-pr-lifecycle`'s `Program PR (Shape A) semantics`); under `pr: per-proposal` each change has passed its archive when the user is asked, its PR marked ready there and its merge left to the user, and under `never` its work is archived on its branch: nothing waits on either, and the brief writes no line about it |
| any other value, or a shape that is not a single word | read as absent; the hold (`A sign-off is recorded against the saved copy, and the hold reads it`) carries one warning naming the value and saying that nothing waits on a sign-off |

The rows are the values this capability reads (absent or `off`, `change` and `program`) and every other value, each under the
three `pr:` modes `PR_MODES` names, absent meaning `never`.

Its readers are the two holds, a change's (`A sign-off is recorded against the saved copy, and the hold reads it`) and
a program's (`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`), the `signoff` record's write gate
(`orbit-emit-composition`'s `The write gate checks the sign-off record`) and the reading's selection
(`orbit-decision-records`' `The reader takes the account when the user signs off`). The write gate and the selection read it silently; only
the holds report the warning. No readout, gate
or recommendation reads it: `orbit status` and the reviewed gates render the same under every value.

#### Scenario: With the setting absent, nothing waits

- **WHEN** `orbit/config.yaml` carries no `signoff` key and change `foo`'s brief has been saved
- **THEN** `orbit brief --change foo --hold` reports the setting off and `foo` not held, with no warning

#### Scenario: `off` reads as absent

- **WHEN** `orbit/config.yaml` carries `signoff: off`
- **THEN** the hold reports the setting off and the change not held, with no warning

#### Scenario: `change` holds a change with a saved copy and no sign-off

- **WHEN** `orbit/config.yaml` carries `signoff: change` and change `foo`'s brief has been saved, with no sign-off
- **THEN** the hold reports `foo` held, its `why` `unsigned`

#### Scenario: An unrecognized value is read as absent, with a warning

- **WHEN** `orbit/config.yaml` carries `signoff: weekly`
- **THEN** the hold reports the setting off and the change not held, with one warning naming `weekly` and saying that
  nothing waits on a sign-off

#### Scenario: `program` holds no change's archive

- **WHEN** `orbit/config.yaml` carries `signoff: program` and change `foo`'s brief has been saved, with no sign-off
- **THEN** `orbit brief --change foo --hold` reports the setting `program`, `why: "off"` and `foo` not held, with no
  warning

#### Scenario: `program` holds a done program with no sign-off

- **WHEN** `orbit/config.yaml` carries `signoff: program`, every stage of `prog` is finished, its closing review is
  recorded, and its brief has been saved with no sign-off
- **THEN** `orbit brief prog --hold` reports `prog` held, its `why` `unsigned`

#### Scenario: Under `per-proposal`, open change PRs do not change the program's hold

- **WHEN** under `signoff: program` and `pr: per-proposal` `prog` is done, its brief has been saved with no sign-off,
  and the PRs of its archived changes are ready and not merged
- **THEN** `orbit brief prog --hold` reports `prog` held, its `why` `unsigned`, reading no PR

### Requirement: A program's brief is saved once the program is finished

`orbit brief <doc> --save` SHALL save a program's brief, once the program is FINISHED, as
`orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md`, under every sign-off setting (`automate-dev-flow`'s R-adf-7;
D-ps-3 and D-ps-6 in `program-signoff`'s `explore.md`). A program is FINISHED when its doc declares at least one stage
and every stage it declares renders `quiescent-awaiting-ratification`, `complete`, `ended` or `ended-from-explore`
(`orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`), and no LIVE work cites the doc,
whatever stage it names or none. Live work is what those stage states count as live: an active change under
`orbit/changes/`, or an exploration under `orbit/explore/` whose `explore.md` is not concluded. On a declared stage,
live work already keeps the stage from rendering finished; this clause adds live work that cites a stage the doc does
not declare, or no stage. A doc the architecture parser reads as LEGACY declares no stage, so it is never finished. The
save acts by the first row of this table that matches:

| the program | the save |
|---|---|
| the doc is not found or is MALFORMED, or its brief cannot be rendered whole | exits non-zero naming it, as `orbit brief <doc>` does (`` `orbit brief` renders a brief read-only ``), and writes nothing |
| not finished | writes nothing, prints one line saying the program is not finished, and exits zero |
| finished, and the latest saved copy in `brief/<doc>/` holds exactly the bytes `orbit brief <doc>` prints | writes nothing, prints one line naming that copy as unchanged, and exits zero |
| finished, with no saved copy, or a latest one whose bytes differ | saves a new copy holding exactly the bytes `orbit brief <doc>` prints, and prints its path and then `sha256 <hex>`, as a change's save does |

The rows are the render's failure, then whether the program is finished crossed with whether the latest copy matches a
fresh render (D-ps-3's table): a copy saved once, at the first finish, goes stale when a later change cites the doc or a
record is written for it, and the comparison saves a new copy then. With `--json` it prints the brief's data with `save`,
one of `saved`, `unchanged` and `not-finished`, and `saved`, `{path, sha256}` for the copy written or, when
unchanged, for the latest copy, and `null` when the program is not finished.

The copy is published as a change's is (`A change's brief is saved, never overwritten`): its `<TS>` drawn unique within
`brief/<doc>/` by the same collision bump, its file linked exclusively so a racing writer is refused naming it. The
`<doc>` folder is the doc's name, held to the single-name rule, so it cannot reach outside the trail. A program's saved
briefs are kept in time order; the latest is the program's brief. The architecture trail never moves, so the copies stay
where they were saved; a doc renamed after a copy was saved leaves that copy under its old name, and the next save for
the renamed doc writes its first. The program brief renders neither `brief/` nor `signoff/`, so saving a copy or
writing a sign-off never changes the text a sign-off covers, and no reader of run summaries reads them: `orbit status`,
`orbit architecture status` and the report render read the same as without them.

The architect session runs the save (`orbit-architect`'s `The architect session saves the program brief and asks for the program's sign-off`), and it may be run by hand.

#### Scenario: A finished program's brief is saved

- **WHEN** every stage `prog` declares renders `complete` or `quiescent-awaiting-ratification`, no copy is saved, and
  `orbit brief prog --save` runs
- **THEN** `orbit/architecture/.orbit-runs/brief/prog/brief-<TS>.md` holds exactly the bytes `orbit brief prog` prints,
  and the command prints that path and then `sha256 <hex>`

#### Scenario: An unfinished program saves nothing

- **WHEN** a stage of `prog` renders `in-change` and `orbit brief prog --save` runs
- **THEN** no file is written, the command says the program is not finished, and it exits zero

#### Scenario: An active change under an undeclared stage keeps the program unfinished

- **WHEN** every stage `prog` declares renders `complete`, and an active change cites `prog` under a stage it does not
  declare
- **THEN** `orbit brief prog --save --json` writes nothing and reports `save: "not-finished"`

#### Scenario: A live exploration under an undeclared stage keeps the program unfinished

- **WHEN** every stage `prog` declares renders `complete`, and an exploration under `orbit/explore/` whose `explore.md`
  is not concluded cites `prog` under a stage it does not declare
- **THEN** `orbit brief prog --save --json` writes nothing and reports `save: "not-finished"`

#### Scenario: A concluded exploration under an undeclared stage leaves the program finished

- **WHEN** every stage `prog` declares renders `complete`, no copy is saved, and the only work citing `prog` under a
  stage it does not declare is an exploration whose `explore.md` is concluded
- **THEN** `orbit brief prog --save --json` saves a copy and reports `save: "saved"`

#### Scenario: An unchanged brief is not saved again

- **WHEN** `prog` is finished and its latest saved copy holds exactly the bytes `orbit brief prog` prints
- **THEN** `orbit brief prog --save --json` writes nothing and reports `save: "unchanged"` with that copy in `saved`

#### Scenario: A changed brief is saved anew

- **WHEN** `prog` is finished, `brief-A.md` is saved, and a ledger entry of `doc: "prog"` is then written
- **THEN** `orbit brief prog --save` writes `brief-B.md` beside `brief-A.md`, and `brief-A.md` is unchanged

#### Scenario: A program brief that cannot be rendered saves nothing

- **WHEN** `prog` is finished and a record of `doc: "prog"` in the architecture trail's `decisions/` folder is not
  valid JSON
- **THEN** `orbit brief prog --save` exits non-zero naming the record, and nothing is written under `brief/prog/`

#### Scenario: Today's readers do not see a program's saved briefs

- **WHEN** the architecture trail holds a `brief/` folder
- **THEN** `orbit status`, `orbit architecture status` and the report render read the same as without it

### Requirement: A program's sign-off is recorded against its saved copy, and the hold reads arc-done

A PROGRAM'S SIGN-OFF SHALL be the user's answer, under `signoff: program`, to the question the architect session asks
over a program's latest saved brief once the program is otherwise done (D-ps-5, D-ps-6 and D-ps-8 in `program-signoff`'s
`explore.md`): a `signoff` record at `orbit/architecture/.orbit-runs/signoff/<doc>/signoff-<TS>.json`, written by
`orbit emit signoff --doc <doc>` (`orbit-emit-composition`'s `The write gate checks the sign-off record`). It carries the
fields a change's sign-off carries (`A sign-off is recorded against the saved copy, and the hold reads it`), its `brief`
the latest copy in `brief/<doc>/`, and one field more, written by orbit: `closing_review`, the filename of the program's
closing review when the record is written, or `null` when none is recorded. Its moments are a change sign-off's, at the
architect session rather than the archive: a signature lifts the hold; a decline keeps it, records the user's reason,
and the next architect session on the doc asks again; a copy saved after a signature is asked about by the `re-sign` row
below. A program's sign-offs are kept in time order and never replaced; the latest is the program's current sign-off.

The program's CLOSING REVIEW is R-d-3's closing `/orbit:review --as architecture`: the latest
`review-architecture-<TS>.json` in `orbit/architecture/.orbit-runs/` whose `doc` is the doc and whose token is later than
the time each archived change citing the doc was archived (its latest archive record's token, or its archive directory's
date when it has none, as the program brief orders them). The program is DONE, for the sign-off, when it is finished
(`A program's brief is saved once the program is finished`) and its closing review is recorded. A program whose stages
all ended with no citing change archived has no archive to order against, so any `review-architecture` record of the
doc counts as its closing review, one written before the stages ended included: a named limit, since the hold reads no
time at which a stage was ended. A signature STILL STANDS while the review its `closing_review` names is later than
every citing change's archive, by the same ordering; once a change citing the doc is archived after that review, the
program was REOPENED after the signature.

`orbit brief <doc> --hold` SHALL report, read-only and writing no file, whether a program waits on a sign-off, by the
first row of this table that matches:

| the program | `why` | held |
|---|---|---|
| the setting is not `program` | `off` | no |
| not finished, or finished with no closing review recorded | `not-done` | no |
| no saved copy in `brief/<doc>/` | `no-copy` | yes |
| its latest sign-off says `signed`, and that record's `sha256` equals the latest saved copy's | `signed` | no |
| its latest sign-off says `signed`, still stands, and covers different text | `re-sign` | yes under `pr: per-architecture`; no under `per-proposal` and `never` |
| any other state: no sign-off, a `declined` latest one, or a signed one over different text that no longer stands, the program reopened after it, or that names no closing review | `unsigned` | yes |

The rows are the setting, whether the program is done, whether a copy is saved, and, for a done program with a copy,
the latest sign-off's answer, whether it covers that copy's text and whether it still stands. The `re-sign` row is
D-ps-8: once a done program is signed, a copy saved after it holds only where a step it holds is still to come, the
program PR's READY flip under `pr: per-architecture`; whether that flip is still to come is the architect session's to
observe (`orbit-architect`'s `The architect session saves the program brief and asks for the program's sign-off`). A
closing review run again with no citing archive after the signature's leaves the signature standing, so its copy is a
later copy like any other. A signature the program was reopened after covers none of the reopening change's work, so a
copy differing from it is asked about afresh under every mode.

The hold reads the setting FIRST: under any value but `program` it reads nothing else and reports `why: "off"`, so with
the setting off it fails only on a usage error. Under `program` it reads the doc's stage states, the architecture
trail's `review-architecture-*.json` files and the archive records of the changes citing the doc, then, for a done
program, the two folders by filename as a change's hold reads its own: a copy is a file named `brief-<TS>.md` in
`brief/<doc>/`, a sign-off a file named `signoff-<TS>.json` in `signoff/<doc>/`, the latest of each the one with the
greatest token, any other name ignored, an absent folder empty. A doc not found or MALFORMED, a folder that exists and
cannot be listed, a file the hold reads that cannot be read, or a latest sign-off that is not valid JSON or has a shape
the write gate would refuse makes the command exit non-zero naming it and print nothing to standard output; it never
falls back to an earlier copy or sign-off. It renders no brief.

The command prints one line naming `why`, the copy and the latest sign-off; `--json` prints one object with exactly these
keys: `doc`; `setting`, `off`, `change` or `program`; `warning`, the setting's warning or `null`; `finished`, `true`
or `false`, `null` when the setting is not `program`; `closing_review`, `{file}` or `null`; `copy`, `{file, sha256}` or
`null`; `signoff`, `{file, answer}` or `null`; `why`; and `held`. A key the hold did not read is `null`.

Named limit — the `signed` row reads only the hash: a signature over the latest copy's exact text lifts the hold
whatever closing review it names. One recorded by hand with `orbit emit signoff --doc` before the closing review, its
`closing_review` `null`, reads `signed` once that review is recorded, when the review left the brief's text unchanged.

Residual kind: a program signature given before its closing review, over text the closing review did not change

Residual method: the architect session asks only once the program is done, so the signatures it records name a closing review; the record's `closing_review` shows the user which review a signature was given under, and its hash proves the text they signed is the text the hold reads

Named limit — the closing review and each archive are ordered by their tokens, which are UTC times to the second: a
closing review is taken to follow an archive when its token is later.

Residual kind: a closing review written in the same second as a citing change's archive, or on the archive day of a change archived with no archive record, read as before or after that archive by its token alone

Residual method: the closing review runs in a session after the last archive, so the tokens differ in practice; a review the hold misplaces is visible to the user in `closing_review`, and running the closing review again records a later one

#### Scenario: A finished program without its closing review is not done

- **WHEN** under `signoff: program` every stage of `prog` is finished and no `review-architecture` record of
  `doc: "prog"` is later than its last citing change's archive
- **THEN** `orbit brief prog --hold --json` reports `why: "not-done"`, `held: false` and `closing_review: null`

#### Scenario: An unfinished program is not done

- **WHEN** under `signoff: program` a stage of `prog` renders `premised`
- **THEN** the hold reports `why: "not-done"`, `finished: false` and `held: false`

#### Scenario: A signature lifts the program's hold

- **WHEN** under `signoff: program` `prog` is done, `brief-A.md` is its latest copy, and a sign-off naming it says `signed`
- **THEN** the hold reports `why: "signed"` and `held: false`

#### Scenario: A decline keeps the program held

- **WHEN** under `signoff: program` the user declines `prog`'s latest copy, giving a reason
- **THEN** the `signoff` record says `declined` with that reason, and the hold reports `why: "unsigned"` and
  `held: true`

#### Scenario: A later copy asks again while the program PR can still be flipped

- **WHEN** under `signoff: program` and `pr: per-architecture` `prog` was signed over `brief-A.md`, the signature still
  stands, and a later save writes `brief-B.md` with different bytes
- **THEN** the hold reports `why: "re-sign"` and `held: true`

#### Scenario: A later copy asks nothing under `per-proposal`

- **WHEN** under `signoff: program` and `pr: per-proposal` `prog` was signed over `brief-A.md`, the signature still
  stands, and a later save writes `brief-B.md` with different bytes
- **THEN** the hold reports `why: "re-sign"` and `held: false`

#### Scenario: A reopened program asks afresh

- **WHEN** under `signoff: program` and `pr: per-proposal` `prog` was signed under one closing review, a change citing
  `prog` is then archived, a later closing review is recorded, and the latest copy's bytes differ from the signed one's
- **THEN** the hold reports `why: "unsigned"` and `held: true`

#### Scenario: A closing review run again leaves the signature standing

- **WHEN** under `signoff: program` and `pr: per-proposal` `prog` was signed under one closing review, a later closing
  review is recorded with no citing change archived since, and the latest copy's bytes differ from the signed one's
- **THEN** the hold reports `why: "re-sign"` and `held: false`

#### Scenario: With the setting off the program's hold reads nothing

- **WHEN** the sign-off setting is absent and the architecture trail's `brief/prog/` folder exists and cannot be listed
- **THEN** `orbit brief prog --hold --json` reports `why: "off"` with `finished`, `closing_review`, `copy` and `signoff`
  all `null`, and exits zero

#### Scenario: A damaged latest program sign-off fails the hold

- **WHEN** under `signoff: program` `prog` is done and its latest sign-off is not valid JSON
- **THEN** the hold exits non-zero naming it, prints nothing to standard output, and does not report `prog` signed

