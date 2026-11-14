## MODIFIED Requirements

### Requirement: The reading step's brief is rendered by orbit

`orbit decisions brief <change>` SHALL render, read-only, the brief the reading step gives its reader, and SHALL be the
only source of that brief: the reviewing session passes it to the reader verbatim and adds nothing. It writes no file
and prints the brief to standard output (`--json` prints the same content as structured data, together with the
brief's text as `markdown`, so one run gives the reading step both the text it dispatches and the filenames it records).

It SELECTS the records to read: the latest record in each replacement chain of the change's `decisions/` folder that no
in-context system review emit on the change's history lists in its `decision_records_read`
(`orbit-emit-composition`'s `The reading's selection is recorded at review and archive`), and, when the sign-off setting
is `change` or `program`, the change's latest account that no such emit lists (`The reader takes the account when the user signs off`). No ordering of timestamps decides it: a record a skipped reading did not read, or one written while a pass
ran, stays selected until a reading lists it. A selection that is empty renders a brief saying there is nothing to read.

For the selected records it renders, in this order:

| part | rendered as |
|---|---|
| the architecture doc | the full text of the doc the change cites (`architecture.doc` in its metadata), and of any other doc a selected record cites; with none, the brief says the reader knows no architecture doc |
| each record | under its bare filename, the name the reader reports it by: its plain fields, its `defines` list, and its `detail` marked as not bound |
| an account, when selected | as each record: its plain fields `built`, `seams` and `deviations`, its `defines` list and its `detail` marked as not bound; it cites nothing |
| a `requirement` citation | the requirement's text from the baseline spec, from its heading to its first scenario, under its capability and title |
| a `ruling` or `goal` citation | its id, which the reader finds in the architecture doc above |
| a `resolution` citation | the cited resolution's `answer` and `effect`, the latest in its chain |
| a `decision` citation | that Decisions entry's text from the `explore.md` it belongs to |
| a ledger entry's `area` | its row of `The ledger's eighteen areas`: the area's name and what it covers |
| a stop's `condition` | the condition's wording in `Three decision records, one job each` |
| a ledger entry's `raised_stop` or a resolution's `stop` | the named stop's `about` and `question`, the latest in its chain |
| when and in what work | the record's timestamp and the change or exploration it belongs to |
| the reader's task, last | the four reader rows of `The plain-language rule is held by structure and by a reader`; the severity rule of `orbit-review`'s `The reading step checks decision records in system review`; that cited requirement text is the baseline's; and the return shape: one finding per record and row, naming the record by its filename, the row, the field, and what a reader would take it to mean |

The brief points its reader at no file to open: of its own it names no path under `.orbit-runs/`, no review pass, no
finding and no walk, and a record is named by its bare filename. Text it quotes (a cited requirement, a record's prose,
the doc) is rendered whole, a path inside it included, since the reader reads it and opens nothing. Its reader is not a
review-genre reviewer, and knows only what the brief carries.

A brief is whole or absent, never partial: when a selected record cannot be read or is not valid JSON, or a source the
brief renders (the architecture doc, a cited requirement, resolution or Decisions entry) no longer resolves, or, when the
sign-off setting is `change` or `program`, a folder the selection reads (the change's `decisions/` or `account/`) exists and cannot be
listed, the command exits non-zero naming it and prints nothing to standard output, so a failure is never read as an
empty selection. Under every other value the selection reads its folders as it did before the setting existed, a
folder that cannot be listed reading as empty (`automate-dev-flow`'s G0).

The brief and the fields of `orbit-emit-composition`'s `The reading's selection is recorded at review and archive` are
the readers of `decisions/` this capability adds, and, under `signoff: change` or `program`, of the account; no reader of run
summaries reads the folder, as `Where decision records are kept` states.

Named limit — a cited requirement is rendered from the BASELINE spec, which the write gate checked the citation
against; a delta in the change that modifies that requirement is not shown.

Residual kind: a record whose citation names a requirement the change itself rewrites, read against its old text

Residual method: the reader is told, in the brief, that cited requirement text is the baseline's; the walk compares the change's delta when a finding turns on it

#### Scenario: The brief carries only the doc and the records' content

- **WHEN** `orbit decisions brief foo` runs on a change citing `prog`, whose `decisions/` holds one ledger entry citing
  `{kind: "requirement", capability: "cap", title: "T"}`
- **THEN** the output holds `prog`'s text, the entry's filename and plain fields, requirement T's text, the area's row
  and the reader's task, and no `.orbit-runs/` path

#### Scenario: Only records no reading listed are selected

- **WHEN** a change's history holds `ledger-A` and `ledger-B`, and an in-context system review emit lists `ledger-A.json`
  in its `decision_records_read`
- **THEN** the brief renders `ledger-B` alone

#### Scenario: A replaced record is not rendered

- **WHEN** `ledger-A` is replaced by `ledger-C`, and no reading has listed either
- **THEN** the brief renders `ledger-C` and not `ledger-A`

#### Scenario: A cited path is quoted whole

- **WHEN** a selected ledger entry cites `{kind: "requirement", capability: "orbit-decision-records", title: "Where
  decision records are kept"}`
- **THEN** the brief renders that requirement's text with the `.orbit-runs/` paths it holds, and names no other path
  under `.orbit-runs/`

#### Scenario: A missing source fails the brief

- **WHEN** a selected ledger entry cites a requirement the baseline spec no longer holds
- **THEN** the command exits non-zero naming the citation and prints nothing to standard output

#### Scenario: A change with no records renders nothing to read

- **WHEN** `orbit decisions brief foo` runs on a change whose `decisions/` folder is absent or empty and whose selection
  holds no account (the sign-off setting is neither `change` nor `program`, or a reading has listed the latest account)
- **THEN** the output says there is nothing to read, and the command exits zero

#### Scenario: Under `change`, an unlistable folder fails the brief

- **WHEN** `orbit decisions brief foo` runs under `signoff: change` and `foo`'s `.orbit-runs/decisions/` folder exists and
  cannot be listed
- **THEN** the command exits non-zero naming the folder and prints nothing to standard output; with the setting absent
  the folder reads as empty, as before

#### Scenario: An account is selected under `change`

- **WHEN** `orbit decisions brief foo` runs under `signoff: change` on a change whose history holds `account-A`, which no
  reading has listed, and no decision record
- **THEN** the brief renders `account-A` under its filename with its `built`, `seams` and `deviations`, followed by the
  reader's task

### Requirement: Each change carries one account, written when apply is complete

Each change SHALL carry one ACCOUNT: a record, written by the AI in plain language, of what the change built, the new
places the user is asked something, and where the work left its plan — the three parts of the program brief (stage
program-brief of `automate-dev-flow`, R-adf-7) that no other record holds. The account is not a decision record: it
records no call and no stop, and `Three decision records, one job each` is unchanged. Its fields:

| field | holds |
|---|---|
| `built` | plain: what the change built, as its user would describe it |
| `seams` | plain: each new place the user is asked something, or where a setting now changes what happens; when there is none, it says so in words |
| `deviations` | plain: where the work left its stage's charter in the architecture doc the change cites, or, for a change citing none, the proposal's scope; when there is none, it says so in words |
| `defines` | as the decision records have it: every term a plain field uses that the architecture doc does not |
| `detail` | as the decision records have it: not bound by the plain-language rule, never the only statement |
| `replaces` | the account this one replaces, by filename |

It is kept in `orbit/changes/<name>/.orbit-runs/account/`, named `account-<TS>.json`, beside the `decisions/` folder and
outside it, and moves with the change when it is archived. Its accounts form one replacement chain, whose latest record
is the change's current account; a replacement may change any field, since an account records no link to another
record. The account is written under every setting, and writing it changes nothing the user sees or is asked.

APPLY IS COMPLETE when the change's apply gate passes: every task is checked, or every unchecked one is a declared,
marked `(User-validation` handoff (`orbit-engine-gates`' user-validation subset rule). An apply session writes or
replaces the account only when apply is complete at its end, so the account always describes finished work. Each step of
a change's lifecycle touches the account by this table:

| step | the account |
|---|---|
| explore, propose, ff, the proposal review and its walk | none: nothing is built yet |
| an apply session that ends with apply not complete | none, whether or not an account exists: the session that completes apply writes or replaces it |
| an apply session that ends with apply complete, on a change with no account | writes the account, before its run summary, or before its completion readout when it writes no run summary — whether it checked the last task, resumed after a session that ended before writing, or arrived on a change completed before accounts existed |
| an apply session that ends with apply complete, on a change that has an account (a walk reopened tasks) | when the work done since the latest account was written changed what it says, writes a replacement of it, at the same point; otherwise none |
| the system review | none: the review writes no account; under `signoff: change` or `program` its reading step reads the latest one (`The reader takes the account when the user signs off`) |
| a walk of an active change that has an account, when a resolved finding changes what was built, a seam, or a deviation | writes a replacement of the latest account; a walk that resolves any finding by reopening tasks writes none, not even for its other fixes: the apply session that completes them replaces it, covering those fixes too |
| a walk of an active change that resolves a reading finding against its account (under `signoff: change` or `program`, `The reader takes the account when the user signs off`) | writes a replacement of the latest account for each such finding resolved, as `A record is fixed by a replacement, never edited` does for a decision record; the replacement rewords and states no new fact, so it is written in a walk that reopens tasks too |
| a walk of an archived change | none: orbit writes no record to an archived change's trail, as for decision records |
| archive | none: the archived change keeps its latest account |

A change abandoned before apply is complete carries no account, and so does a change archived before its first
complete apply session ran after this requirement shipped. The table is closed by derivation: its rows are the
spec-driven schema's phases (explore and propose, the proposal review, apply, the system review, archive) with the walk
that follows each review, apply split by whether apply is complete at the session's end and whether an account already
exists, and a walk split by whether the change is active or archived and, for an active change, by whether a resolved
finding changes the account's facts or rewords it after a reading.

The apply and address-reviews workflow bodies each carry the instruction for their rows of the table, each naming the
fields the write gate accepts (`orbit-emit-composition`'s `The write gate checks the account`) and how to invoke
`orbit emit account`, `replaces` included, so an installed skill of either needs no spec and no other skill to write
one; a test holds each body carrying the fields and the invocation.

#### Scenario: The session that completes apply writes the account

- **WHEN** an apply session checks the last unchecked task of change `foo`, which has no account
- **THEN** it writes `orbit/changes/foo/.orbit-runs/account/account-<TS>.json` with `built`, `seams` and `deviations`
  before its run summary

#### Scenario: A change ending on a user-validation handoff gets its account

- **WHEN** change `foo`'s `tasks.md` holds 1.1 and 1.2 and `- [ ] 2.1 (User-validation handoff) live-test`, and an apply
  session checks 1.1 and 1.2 and declares `user_validation_tasks: ["2.1"]`
- **THEN** apply is complete with 2.1 unchecked, and the session writes the account before its run summary

#### Scenario: A resumed session writes a missing account

- **WHEN** every task of change `foo` is checked, `foo` has no account (the session that checked the last task ended
  before writing it), and an apply session arrives on it
- **THEN** that session writes the account before its completion readout

#### Scenario: An apply session that leaves work writes none

- **WHEN** an apply session ends with a task of change `foo` still unchecked, and `foo` has no account
- **THEN** no account is written

#### Scenario: A reopened change replaces its account once, when apply completes

- **WHEN** a walk reopens two tasks of change `foo`, which has `account-A`; one apply session finishes the first and
  changes what `foo` does, and a second finishes the other
- **THEN** the first session writes no account, and the second, whose own task changed nothing the account says, writes
  one replacing `account-A` that describes the finished work

#### Scenario: A walk that reopens tasks writes no account

- **WHEN** a system walk of change `foo`, which has `account-A`, resolves a finding by reopening a task that adds a
  behaviour
- **THEN** the walk writes no account, and the apply session that completes the reopened task writes one replacing
  `account-A`

#### Scenario: A walk of an archived change writes no account

- **WHEN** `/orbit:address-reviews` walks an archived change that has an account, and a resolved finding changes what
  the account says
- **THEN** no account is written

#### Scenario: A reading finding against the account writes its own replacement

- **WHEN** under `signoff: change` a system walk of change `foo`, which has `account-A`, resolves two reading findings
  against `account-A`'s wording, one after the other
- **THEN** the first writes `account-B` replacing `account-A` and the second writes `account-C` replacing `account-B`,
  each changing only the wording its finding named

#### Scenario: A walk fix that changes what was built replaces the account

- **WHEN** a system walk of change `foo`, which has `account-A`, resolves a finding by adding a behaviour the account
  does not mention
- **THEN** the walk writes an account carrying `replaces: "account-A.json"` that names the behaviour, and `account-A`
  stays as it was

#### Scenario: An uncited change states deviations against its proposal

- **WHEN** a change whose metadata carries no `architecture:` citation writes its account
- **THEN** its `deviations` field states where the work left the proposal's scope, or that it did not

#### Scenario: Archive writes no account

- **WHEN** change `foo`, holding `account-A` and its replacement `account-B`, is archived
- **THEN** the archived change's `.orbit-runs/account/` holds both, and no account is written by the archive

### Requirement: The reader takes the account when the user signs off

A reading step SHALL take a change's account only when the sign-off setting (`orbit-program-brief`'s `The sign-off setting holds a change's archive or a program's completion for the user's sign-off`) is `change` or `program`, the two values under which the
user signs off (D-pb-13 in `program-brief`'s `explore.md`, D-ps-1 in `program-signoff`'s): then
the selection (`The reading step's brief is rendered by orbit`) holds the change's latest account — the latest record of
its `account/` chain — until an in-context system review emit lists it in `decision_records_read`, as it holds a decision
record. Under every other value the account is kept out of the selection, which reads only the `decisions/` folder, and
every reader of the selection is as it was before the setting existed:

| reader of the selection | the setting is `change` or `program` | any other value |
|---|---|---|
| `orbit decisions brief` | renders the latest unread account as a record | renders no account |
| the in-context system review's `decision_records_owed` and its read-list check | owes and accepts the latest unread account | neither owes nor accepts an account |
| the archive emit's `decision_records_unread` | counts the latest account while it is unread | does not count the account |
| whether the reading step runs | it runs when the latest account is unread, even when no decision record is selected | unchanged: a change whose only record is its account has nothing selected, so no reader is dispatched |
| `orbit brief` (`orbit-program-brief`) | lists the latest unread account among the records the selection returns | lists the records the selection returns, and names the account apart as checked by no reader |

The rows are every caller of the one selection function; the columns are the setting's two readings, `change` and
`program` reading alike, an unrecognized value read as absent. A replaced account is not selected: only the latest of its chain is, as for a decision record.

A reader's finding against the account is folded into the pass like any reading finding, its `file` the account's path
under `account/` (`orbit-review`'s `The reading step checks decision records in system review`). The walk resolves it by a
replacement of the latest account, one per resolved finding (`Each change carries one account, written when apply is
complete`), a replacement rewording the account and changing no fact it states; a finding that is a gap in the brief is
recorded `deferred` against `The reading step's brief is rendered by orbit`, as for a decision record.

No reader of run summaries reads the `account/` folder: `orbit status`, the reviewed gates and the report render read
only the files directly in `.orbit-runs/`, as they do for `decisions/` (`Where decision records are kept`).

Named limit — under every value but `change` and `program`, `The plain-language rule is held by structure and by a reader` holds an
account's plain fields by the write gate alone: the reader rows of its table reach no account.

Residual kind: an account whose prose is unclear, leans on implementation detail, restates what it cites with its meaning shifted, or uses a term it leaves undefined, in a project whose sign-off setting is neither `change` nor `program`

Residual method: the user reads the account in the brief, where it is named as checked by no reader; a finding against it is fixed by a replacement

#### Scenario: The brief does not render the account

- **WHEN** `orbit decisions brief foo` runs with the sign-off setting absent, on a change whose history holds `account-A`
  and no decision record
- **THEN** the output says there is nothing to read, and the command exits zero

#### Scenario: The account is not counted unread at archive

- **WHEN** with the sign-off setting absent, a change whose history holds `account-A` and one decision record no reading
  listed is archived
- **THEN** the archive emit carries `decision_records_unread: 1`

#### Scenario: The brief shows the account as checked by no reader

- **WHEN** `orbit brief --change foo` runs with the sign-off setting absent, on a change whose history holds `account-A`
  and no decision record
- **THEN** its records-no-reader-checked section names no decision record and names the account as checked by no reader

#### Scenario: Under `change`, the reading runs on an account alone

- **WHEN** an in-context system review runs under `signoff: change` on a change whose only record is `account-A`, which
  no reading has listed
- **THEN** `orbit decisions brief` selects `account-A`, and the review owes it in `decision_records_owed`

#### Scenario: Only the latest account is selected

- **WHEN** under `signoff: change` a change holds `account-A` and `account-B`, which replaces it, and no reading has
  listed either
- **THEN** the selection holds `account-B` and not `account-A`

#### Scenario: Under `program`, the account is selected as under `change`

- **WHEN** `orbit decisions brief foo` runs under `signoff: program` on a change whose only record is `account-A`, which
  no reading has listed
- **THEN** the brief renders `account-A` under its filename with its `built`, `seams` and `deviations`

#### Scenario: An unrecognized value reads the account as at the defaults

- **WHEN** `orbit decisions brief foo` runs under `signoff: weekly` on a change whose only record is `account-A`
- **THEN** the output says there is nothing to read, as with the setting absent

#### Scenario: Today's readers do not see the account

- **WHEN** a change's history holds an `account/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

## RENAMED Requirements

- FROM: `### Requirement: The reader takes the account only when sign-off is per change`
- TO: `### Requirement: The reader takes the account when the user signs off`
