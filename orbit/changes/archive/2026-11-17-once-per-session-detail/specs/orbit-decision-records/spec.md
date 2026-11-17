## MODIFIED Requirements

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

The apply and address-reviews workflow bodies each carry their step's BASIC CONTENT, and the skill's reference file
beside the body its full instruction. Apply's basic content sends the agent, at the session's end and before the run
summary (or the completion readout when the session writes none), to `references/account-step.md`; the walk's sends the
agent, after its logs, to `references/account-walk-step.md`. Each reads its reference every time its moment comes and
carries no condition of its own, so every branch of the two steps, their source, is decided where the step is stated
whole: the reference decides whether to write the account, a replacement of it, or none. Each reference carries its
step's instruction for its rows of the table, naming the fields the write gate accepts (`orbit-emit-composition`'s `The
write gate checks the account`) and how to invoke `orbit emit account`, `replaces` included, so an installed skill of
either needs no spec and no other skill to write one; a test holds each body carrying its basic content and each
reference the fields and the invocation.

Named limit — a session that does not read the reference writes no account, and nothing in orbit reports a change whose
apply is complete and which has none: the apply gate counts tasks and never reads the `account/` folder.

#### Scenario: The apply body sends the agent to the account reference at the session's end

- **WHEN** the apply skill is generated
- **THEN** its body carries the account step's heading and basic content (at the session's end, before the run-summary
  emit or the completion readout, read `references/account-step.md` and follow it) with no condition of its own, and
  the skill ships `references/account-step.md` holding the full step with the fields and the `orbit emit account`
  invocation

#### Scenario: The walk sends the agent to its reference after its logs

- **WHEN** the address-reviews skill is generated
- **THEN** its step 7 carries the basic content naming `references/account-walk-step.md` after the logs are written,
  with no condition of its own, and the skill ships that reference holding the full walk step

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
