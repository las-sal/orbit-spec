# orbit-program-brief Specification

## Purpose
The BRIEF of a change or of a program (stage `program-brief` of `automate-dev-flow`, R-adf-7, G5): what the work built, the capabilities and requirements it added or changed, the new terms and seams, the ledger, the stops, the tripwires line, the deviations from the charter and the records no reader checked, composed from what the trail already holds and written for a reader who knows only the program's architecture doc. A brief says only what the change's archive record states, in every shape such records have been written in. `orbit brief` renders a change brief or a program brief read-only, whole or absent; `--save` keeps an active change's brief in its own history, never overwritten, and prints the SHA-256 a later sign-off cites. The archive saves each change's brief before its sync. The `signoff` setting (`off`, the default, or `change`) holds each change's archive until the user signs off on that saved copy; `orbit emit signoff` records the answer against the copy's SHA-256 and `orbit brief --change <name> --hold` reads it.
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
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`) when the brief is rendered, by filename, as `A brief says only what the archive recorded` states; under every sign-off setting but `change`, the account, when one exists, named apart as checked by no reader; under `change` the latest account is among the records the selection returns while no reading has listed it, and is not named once a reading has (`orbit-decision-records`' `The reader takes the account only when sign-off is per change`) |

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

Saving the PROGRAM brief, at the architect session that finds a program finished, is stage program-brief's fourth
change, `program-signoff` (D-pb-15 in `program-brief`'s `explore.md`; D-br-5 in `brief-render`'s first moved it out of
`brief-render`); `--save` with a doc and no `--change` is a usage error saying so.

#### Scenario: Saving a program brief names the change that builds it

- **WHEN** `orbit brief prog --save` runs
- **THEN** the command exits non-zero saying that saving a program brief is not built yet and is `program-signoff`'s, and
  prints nothing to standard output

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

### Requirement: The sign-off setting holds each change's archive for the user's sign-off

orbit SHALL read a SIGN-OFF SETTING, the `signoff` key of `orbit/config.yaml`, saying whether the user signs off on each
change before it lands (`automate-dev-flow`'s R-adf-2 as amended, R-adf-1, R-adf-6; D-pb-12 in this change's
`explore.md`). It is read from that key alone, by each reader below, and no other setting derives it:

| the key's value | under every `pr:` mode |
|---|---|
| absent or `off`, or `orbit/config.yaml` absent or unreadable | nothing waits on a sign-off: today's behaviour; the archive still saves each change's brief (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`) |
| `change` | each change's archive waits for the user's sign-off over that change's saved brief (`orbit-archive-modifications`' `The archive holds for a per-change sign-off`); under `pr: per-proposal` the per-change READY flip the archive tail performs waits with it; under `pr: per-architecture` the program PR, which stage archives never flip, is untouched |
| any other value, or a shape that is not a single word | read as absent; the hold (`A sign-off is recorded against the saved copy, and the hold reads it`) carries one warning naming the value and saying that nothing waits on a sign-off; `program` is such a value until stage program-brief's fourth change, `program-signoff` (D-pb-15 in this change's `explore.md`), reads it |

The rows are the values this capability reads (absent or `off`, and `change`) and every other value, each under the
three `pr:` modes `PR_MODES` names, absent meaning `never`.

Its readers are the hold, the `signoff` record's write gate (`orbit-emit-composition`'s `The write gate checks the
sign-off record`) and the reading's selection (`orbit-decision-records`' `The reader takes the account only when sign-off
is per change`). The write gate and the selection read it silently; only the hold reports the warning. No readout, gate
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

- **WHEN** `orbit/config.yaml` carries `signoff: program`
- **THEN** the hold reports the setting off and the change not held, with one warning naming `program` and saying that
  nothing waits on a sign-off

### Requirement: A sign-off is recorded against the saved copy, and the hold reads it

A SIGN-OFF SHALL be the user's answer, under `signoff: change`, to the question the archive asks over a change's saved
brief (`A change's brief is saved, never overwritten`), kept as a `signoff` record at
`orbit/changes/<name>/.orbit-runs/signoff/signoff-<TS>.json`, beside the `account/` and `brief/` folders, and written by
`orbit emit signoff --change <name>` (`orbit-emit-composition`'s `The write gate checks the sign-off record`). It is not a
decision record: it records the user's answer over one copy, never a call or a stop, so `orbit-decision-records`'
`Three decision records, one job each` is unchanged and the reading step never selects it. Its fields:

| field | holds |
|---|---|
| `brief` | the filename of the saved copy the user read, `brief-<TS>.md`: the latest in the change's `brief/` folder when the record is written |
| `sha256` | written by orbit: the SHA-256 of that copy's bytes in lower-case hex, the figure `--save` printed for it |
| `answer` | `signed` or `declined` |
| `reason` | plain: the user's reason, in their words; required when `declined`, optional when `signed` |
| `defines`, `detail` | as the decision records have them |

Each answer the user gives, the save that follows a decline, and the setting's other values touch the record by this
table (D-pb-8 in this change's `explore.md`):

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
`--json` prints one object with exactly these keys: `change`; `setting`, `off` or `change`; `warning`, the warning or
`null`; `copy`, `{file, sha256}` for the latest saved copy or `null`; `signoff`, `{file, answer}` for the latest sign-off
or `null`; `why`; and `held`. With the setting off, `copy` and `signoff` are `null`, since no folder is read. It renders
no brief, so it answers when the brief cannot be rendered.

Under `change` the hold reads the two folders by filename: a saved copy is a file named `brief-<TS>.md` in `brief/`, a
sign-off a file named `signoff-<TS>.json` in `signoff/`, the latest of each the one with the greatest token, and any
other name is ignored; an absent folder reads as empty. A folder that exists and cannot be listed, a latest saved copy
that cannot be read, or a latest sign-off that cannot be read, is not valid JSON, or has a shape the write gate would
refuse (`orbit-emit-composition`'s `The write gate checks the sign-off record`) makes the command exit non-zero naming
it and print nothing to standard output. It never falls back to an earlier copy or an earlier sign-off: a damaged
latest record would otherwise let an older signature lift a hold that a later decline keeps.

Under every value, `--hold` with a `<doc>` (the program's sign-off is `program-signoff`'s), with `--save`, or for a change that is not
active is a usage error: the command exits non-zero, names the reason and prints nothing to standard output.

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

#### Scenario: The hold names a change, never a doc

- **WHEN** `orbit brief prog --hold` runs
- **THEN** the command exits non-zero saying the program's sign-off is not built yet, and prints nothing to standard
  output

