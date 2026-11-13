## ADDED Requirements

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

The first two rows decide by the setting and the folder; the last two split a change with a saved copy by whether a
signature covers that copy's exact text, so a copy saved again with the same text is not asked again, and a signature
over an earlier text does not lift the hold. The command prints one line naming `why`, the copy and the latest sign-off;
`--json` prints them as one object with `held`. It renders no brief, so it answers when the brief cannot be rendered.
`--hold` with a `<doc>` (the program's sign-off is `program-signoff`'s), with `--save`, or for a change that is not
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

#### Scenario: Today's readers do not see the sign-offs

- **WHEN** a change's history holds a `signoff/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

#### Scenario: The hold names a change, never a doc

- **WHEN** `orbit brief prog --hold` runs
- **THEN** the command exits non-zero saying the program's sign-off is not built yet, and prints nothing to standard
  output

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
| tripwires | until stage tripwires of `automate-dev-flow` ships, one line saying tripwires are not installed, never that none fired |
| deviations from the charter | the latest account's `deviations`, beside the signals orbit computes: the archive record's `warnings` and the `accepted` claims of its `readiness` judgement, as `A brief says only what the archive recorded` states, and each dimension a `## Size` section of the change's `proposal.md` declares breached |
| records no reader checked | the records the selection returns (`orbit-decision-records`' `The reading step's brief is rendered by orbit`) when the brief is rendered, by filename, as `A brief says only what the archive recorded` states; the account, when one exists and the selection does not take it (under every sign-off setting but `change`, `orbit-decision-records`' `The reader takes the account only when sign-off is per change`), named apart as checked by no reader; under `change` an unread latest account is among the records the selection returns |

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
