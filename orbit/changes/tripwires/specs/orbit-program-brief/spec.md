## MODIFIED Requirements

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
| tripwires | the readings on the change's seam emits (`orbit-tripwires`' `Every seam emit carries the readings`): each key a reading fired on (`cannot-read` included), once, with its sensor, the evidence of the latest reading carrying it, the seam emit that first carried it, whether its evidence marks it declared late, and the stop covering it with that stop's answer, or marked open; then each sensor's latest outcome; for a change none of whose emits carries the field, one line saying tripwires were not installed when it ran, never that none fired |
| deviations from the charter | the latest account's `deviations`, beside the signals orbit computes: the archive record's `warnings` and the `accepted` claims of its `readiness` judgement, as `A brief says only what the archive recorded` states, and each dimension a `## Size` section of the change's `proposal.md` declares breached |
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`) when the brief is rendered, by filename, as `A brief says only what the archive recorded` states; under every sign-off setting but `change` and `program`, the account, when one exists, named apart as checked by no reader; under `change` or `program` the latest account is among the records the selection returns while no reading has listed it, and is not named once a reading has (`orbit-decision-records`' `The reader takes the account when the user signs off`) |

The sections are the stage charter's list in `orbit/architecture/automate-dev-flow.md`, plus the records no reader
checked that `orbit-review`'s named limit on the reading step assigns to the brief; a program brief carries, for the
architecture trail's records, the new terms, the ledger and the stops sections, and closes with a Tripwires section
saying that each change's readings are shown under that change, since an architecture session writes no seam emit.

Within a section, entries are in the order of their records' timestamps, oldest first; new terms are in the order of the
term, then of the earliest record defining it. A term's definition belongs to the record that wrote it, so a term two
records define the same way is shown once naming both, and a term defined two ways is shown with each definition beside
the records that wrote it.

The text orbit writes around the records — headings, labels, the lines for an absent account, an open stop and
tripwires not installed when a change ran — is plain language by the same rule as the records (`orbit-decision-records`' `Decision records
are written for a reader who knows only the architecture`). A record's prose is shown as written. A requirement title
is shown as its spec names it, under a heading that says it is the spec's title, since orbit cannot make it plain.

#### Scenario: A change brief carries every section

- **WHEN** an archived change citing `prog` holds an account, a ledger entry, a stop with its resolution and an archive
  record whose `sync_specs` names one capability
- **THEN** its brief carries, in order, what was built, the capabilities and requirements with their titles, the new
  terms, the seams, the ledger entry, the stop with its answer, the tripwires section, the deviations and the records no
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

- **WHEN** a change brief is rendered for a change none of whose emits carries a `tripwires` field
- **THEN** it says tripwires were not installed when the change ran, and never that none fired

#### Scenario: A fired reading is listed once with its stop

- **WHEN** a change's apply emit and review emit both carry a `touchpoints` reading fired with key `K`, and a
  `tripwire` stop naming `K` has a resolution
- **THEN** the tripwires section lists `K` once, with the review emit's evidence, the apply emit as the seam that first
  carried it, and the resolution's answer, then the sensor's latest outcome

#### Scenario: A program brief points at each change's readings

- **WHEN** a program brief is rendered for a doc two changes cite
- **THEN** each change's section carries its own tripwires section, and the brief closes with a Tripwires section saying
  the readings are shown under each change, never that none fired

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

