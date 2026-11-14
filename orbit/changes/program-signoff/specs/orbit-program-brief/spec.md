## ADDED Requirements

### Requirement: A program's brief is saved once the program is finished

`orbit brief <doc> --save` SHALL save a program's brief, once the program is FINISHED, as
`orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md`, under every sign-off setting (`automate-dev-flow`'s R-adf-7;
D-ps-3 and D-ps-6 in `program-signoff`'s `explore.md`). A program is FINISHED when its doc declares at least one stage
and every stage it declares renders `quiescent-awaiting-ratification`, `complete`, `ended` or `ended-from-explore`
(`orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`): no stage is in a change, being
explored, premised or inconsistent. A doc the architecture parser reads as LEGACY declares no stage, so it is never
finished. The save acts by the first row of this table that matches:

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
over a program's latest saved brief once the program is otherwise done (D-ps-5, D-ps-6 and D-ps-7 in `program-signoff`'s
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
(`A program's brief is saved once the program is finished`) and its closing review is recorded.

`orbit brief <doc> --hold` SHALL report, read-only and writing no file, whether a program waits on a sign-off, by the
first row of this table that matches:

| the program | `why` | held |
|---|---|---|
| the setting is not `program` | `off` | no |
| not finished, or finished with no closing review recorded | `not-done` | no |
| no saved copy in `brief/<doc>/` | `no-copy` | yes |
| its latest sign-off says `signed`, and that record's `sha256` equals the latest saved copy's | `signed` | no |
| its latest sign-off says `signed`, names the current closing review as its `closing_review`, and covers different text | `re-sign` | yes under `pr: per-architecture`; no under `per-proposal` and `never` |
| any other state: no sign-off, a `declined` latest one, or a signed one given before the current closing review over different text | `unsigned` | yes |

The rows are the setting, whether the program is done, whether a copy is saved, and, for a done program with a copy,
the latest sign-off's answer, whether it covers that copy's text and whether it was given under the current closing
review. The `re-sign` row is D-ps-7: once a done program is signed, a copy saved after it holds only where a step it
holds is still to come, the program PR's READY flip under `pr: per-architecture`; whether that flip is still to come is
the architect session's to observe (`orbit-architect`'s `The architect session saves the program brief and asks for the program's sign-off`). A signature given before a later closing review covers a program that has
since been reviewed again, so a copy differing from it is asked about afresh.

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

- **WHEN** under `signoff: program` and `pr: per-architecture` `prog` was signed over `brief-A.md` under its current
  closing review, and a later save writes `brief-B.md` with different bytes
- **THEN** the hold reports `why: "re-sign"` and `held: true`

#### Scenario: A later copy asks nothing once the work has landed

- **WHEN** under `signoff: program` and `pr: per-proposal` `prog` was signed over `brief-A.md` under its current closing
  review, and a later save writes `brief-B.md` with different bytes
- **THEN** the hold reports `why: "re-sign"` and `held: false`

#### Scenario: A new closing review asks afresh

- **WHEN** under `signoff: program` `prog` was signed under one closing review, a later closing review is recorded, and
  the latest copy's bytes differ from the signed one's
- **THEN** the hold reports `why: "unsigned"` and `held: true`

#### Scenario: With the setting off the program's hold reads nothing

- **WHEN** the sign-off setting is absent and the architecture trail's `brief/prog/` folder exists and cannot be listed
- **THEN** `orbit brief prog --hold --json` reports `why: "off"` with `finished`, `closing_review`, `copy` and `signoff`
  all `null`, and exits zero

#### Scenario: A damaged latest program sign-off fails the hold

- **WHEN** under `signoff: program` `prog` is done and its latest sign-off is not valid JSON
- **THEN** the hold exits non-zero naming it, prints nothing to standard output, and does not report `prog` signed

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

### Requirement: The sign-off setting holds a change's archive or a program's completion for the user's sign-off

orbit SHALL read a SIGN-OFF SETTING, the `signoff` key of `orbit/config.yaml`, saying whether the user signs off on each
change before it lands, or once on a program before it is done (`automate-dev-flow`'s R-adf-2 as amended, R-adf-1,
R-adf-6; D-pb-12 in `program-brief`'s `explore.md`, D-ps-1 and D-ps-5 in `program-signoff`'s). It is read from that key alone, by each reader below, and no other setting derives it:

| the key's value | under every `pr:` mode |
|---|---|
| absent or `off`, or `orbit/config.yaml` absent or unreadable | nothing waits on a sign-off: today's behaviour; the archive still saves each change's brief (`orbit-archive-modifications`' `The archive saves the change's brief before the sync`) |
| `change` | each change's archive waits for the user's sign-off over that change's saved brief (`orbit-archive-modifications`' `The archive holds for a per-change sign-off`); under `pr: per-proposal` the per-change READY flip the archive tail performs waits with it; under `pr: per-architecture` the program PR, which stage archives never flip, is untouched |
| `program` | nothing waits at any change's archive; the program's completion waits for the user's sign-off over the program's saved brief (`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`), and under `pr: per-architecture` the program PR's READY flip waits with it (`orbit-pr-lifecycle`'s `Program PR (Shape A) semantics`); under `pr: per-proposal` and `never` every change has already landed when the user is asked, and the brief says so |
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

## RENAMED Requirements

- FROM: `### Requirement: The sign-off setting holds each change's archive for the user's sign-off`
- TO: `### Requirement: The sign-off setting holds a change's archive or a program's completion for the user's sign-off`
