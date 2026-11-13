## ADDED Requirements

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
| the system review | none: no reader takes the account (`No reader takes the account yet`) |
| a walk of an active change that has an account, when a resolved finding changes what was built, a seam, or a deviation | writes a replacement of the latest account; a walk that resolves any finding by reopening tasks writes none, not even for its other fixes: the apply session that completes them replaces it, covering those fixes too |
| a walk of an archived change | none: orbit writes no record to an archived change's trail, as for decision records |
| archive | none: the archived change keeps its latest account |

A change abandoned before apply is complete carries no account, and so does a change archived before its first
complete apply session ran after this requirement shipped. The table is closed by derivation: its rows are the
spec-driven schema's phases (explore and propose, the proposal review, apply, the system review, archive) with the walk
that follows each review, apply split by whether apply is complete at the session's end and whether an account already
exists, and a walk split by whether the change is active or archived.

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

### Requirement: No reader takes the account yet

No reading step SHALL read a change's account until a later stage adds the setting under which one does (stage
program-brief's third change, D-pb-5 in `orbit/explore/program-brief/explore.md`). Because the account is kept outside
the `decisions/` folder, and the selection (`The reading step's brief is rendered by orbit`) reads only that folder,
every reader of the selection is unchanged by construction:

| reader of the selection | with an account in the change's history |
|---|---|
| `orbit decisions brief` | renders no account |
| the in-context system review's `decision_records_owed` and its read-list check | neither owes nor accepts an account |
| the archive emit's `decision_records_unread` | does not count the account |
| whether the reading step runs | unchanged: a change whose only record is its account has nothing selected, so no reader is dispatched |

The rows are every caller of the one selection function; a reader the stage's second change adds (the program brief)
shows the account as not checked by a reader.

No reader of run summaries reads the `account/` folder: `orbit status`, the reviewed gates and the report render read
only the files directly in `.orbit-runs/`, as they do for `decisions/` (`Where decision records are kept`).

Named limit — `The plain-language rule is held by structure and by a reader` holds an account's plain fields by the
write gate alone until a reading step takes the account: the reader rows of its table reach no account before stage
program-brief's third change.

Residual kind: an account whose prose is unclear, leans on implementation detail, restates what it cites with its meaning shifted, or uses a term it leaves undefined

Residual method: the third change's reading step, when sign-off is on; until then the user reads the account in the brief, and a finding against it is fixed by a replacement

#### Scenario: The brief does not render the account

- **WHEN** `orbit decisions brief foo` runs on a change whose history holds `account-A` and no decision record
- **THEN** the output says there is nothing to read, and the command exits zero

#### Scenario: The account is not counted unread at archive

- **WHEN** a change whose history holds `account-A` and one decision record no reading listed is archived
- **THEN** the archive emit carries `decision_records_unread: 1`

#### Scenario: Today's readers do not see the account

- **WHEN** a change's history holds an `account/` folder
- **THEN** `orbit status`, the reviewed gates and the report render read the change exactly as they would without it

## MODIFIED Requirements

### Requirement: Decision records are written for a reader who knows only the architecture

Every plain-language field of a decision record, and of a change's account, SHALL be written so that a reader who knows the program's
architecture doc — its Premise, Goals, Rulings and stage charters — and nothing else understands it. Any other term
is defined in the record's `defines` list, or not used. Implementation detail the AI knows and the reader does not
(internal names, file layouts, mechanisms coined during the work) MAY appear in the `detail` field and SHALL NOT be
the only statement of what was decided. A plain field that restates something the record cites (a ruling, a goal, a
requirement, a resolution, an explore decision) states it as the cited text does, never narrowing or widening it.

What a record POINTS AT is part of the record, not outside knowledge: the text of each requirement, resolution and
explore decision it cites, its area's row in `The ledger's eighteen areas`, its stop condition's wording, the stop it
names, and when and in what work it was written. A reader is given them with the record (`The reading step's brief is
rendered by orbit`), so a reader who knows only the architecture doc can still check what the record relies on. The
fields the rule binds:

| field | record | reaches the reader as |
|---|---|---|
| `decided`, `alternatives`, `why` | ledger entry | the ledger, and the program brief built from it |
| `about`, `question` | stop record | the question put to the user at the stop |
| `answer`, `effect` | resolution | the answer as recorded, and the precedent later entries cite |
| `built`, `seams`, `deviations` | account | the program brief's what was built, new seams and deviations from the charter |
| `detail` | every record | not bound: may be technical, never the only statement |

Named limit — the fields are the ones this change defines.

Residual kind: a prose field a later stage adds to a record, or a new surface that renders record prose to the user

Residual method: when a field or surface is added, ask whether its text reaches the user; if it does, it joins this table

#### Scenario: A coined term is defined in the record

- **WHEN** a ledger entry's `why` uses "hub token", a term the architecture doc never uses
- **THEN** the entry's `defines` list carries `{term: "hub token", definition: "…"}`

#### Scenario: Detail is never the only statement

- **WHEN** a ledger entry's `decided` reads "see detail" and `detail` names the files changed
- **THEN** the entry fails this requirement: what was decided is stated nowhere a reader of the architecture can read

#### Scenario: A restatement keeps the cited text's meaning

- **WHEN** a ledger entry relying on R-adf-3 says its call stops on "an outward act", and R-adf-3's condition is "an
  outward or irreversible act the config has not granted"
- **THEN** the entry fails this requirement: the restatement widens the condition it cites

#### Scenario: An account's coined term is defined

- **WHEN** an account's `seams` uses "hold", a term the architecture doc never uses
- **THEN** the account's `defines` list carries `{term: "hold", definition: "…"}`
