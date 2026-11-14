## ADDED Requirements

### Requirement: The write gate checks the sign-off record

`orbit emit signoff --change <name>` SHALL compose and write a change's sign-off (`orbit-program-brief`'s `A sign-off is
recorded against the saved copy, and the hold reads it`), through the same narrative-only payload contract as every
other command (an engine-owned field or an unknown key is refused naming it; `model` is required). The engine composes
`command`, `timestamp`, `change` and `sha256` — the SHA-256 of the named copy's bytes, in lower-case hex, read when the
record is written. The payload fields are `brief`, `answer`, `reason` (required when `answer` is `declined`, optional
otherwise), `defines` (optional) and `detail` (optional).

Like the account, a sign-off is not a run summary: it carries no `kind`, and neither `next_recommended` nor
`final_assessment` — a payload supplying either, or `sha256`, is refused as engine-owned — and it passes the
decision-record spine checks of `Write-gate validation via the shared normalizers` (`command`, `timestamp` and `model`
present, `change` a string). Its path is `orbit/changes/<name>/.orbit-runs/signoff/signoff-<TS>.json`. The `signoff/`
child is held to the identity rule the account's `account/` child is held to (`The write gate checks the account`):
it must physically BE the trail's canonical `signoff` child, checked after creation and again immediately before the
record is published; the filename token, with its collision bump, is unique within `signoff/`; and it is published
without overwriting, its temporary file created exclusively and linked to its final name.

Before ANY write the gate SHALL refuse, writing no file, with a non-zero exit, empty stdout and the field, flag or
setting named:

| check | refused when |
|---|---|
| scope | `--doc` is given (a usage error: the program's sign-off is stage program-brief's fourth change, `program-signoff`), or `--change` names no active change; the refusal says that a sign-off is written only for an active change under `orbit/changes/`, naming where the name was found, if anywhere |
| setting | the sign-off setting (`orbit-program-brief`'s `The sign-off setting holds each change's archive for the user's sign-off`) is not `change`; the refusal names the value read and says that nothing waits on a sign-off |
| brief | `brief` is absent, not a string, not the filename of a saved copy in the change's `brief/` folder, or not the latest one there; the refusal names the latest copy, or says that none is saved |
| answer | `answer` is absent or neither `signed` nor `declined` |
| reason | `answer` is `declined` and `reason` is absent, not a string or blank after trimming; or `reason` is present and not a non-blank string |
| defines | `defines` is present and not an array of objects `{term, definition}`, both non-blank strings, no other key, no term twice |
| detail | `detail` is present and not a string |

The gate judges FORM and EXISTENCE only (R-crc-10): whether the user read the copy, and whether the reason is clear, is
not the gate's to judge. No other command changes: the sign-off adds no field to any run summary, and no readout, gate or
recommendation reads it; the hold `orbit brief --hold` is its one reader.

Named limit — the latest-copy check assumes one writer per change history at a time: it reads `brief/`, then writes, and
a copy saved between the two leaves the record naming the copy before it.

Residual kind: a sign-off naming a copy that a concurrent save made no longer the latest

Residual method: the hold compares the record's `sha256` with the latest copy's, so a sign-off over different text lifts no hold and the user is asked again; serializing writers belongs to stage `parallel-lanes` of `automate-dev-flow` (R-adf-4)

#### Scenario: A well-formed sign-off writes with the copy's hash

- **WHEN** under `signoff: change` `orbit emit signoff --change foo` receives `{model, brief: "brief-A.md", answer:
  "signed"}` and `brief-A.md` is `foo`'s latest saved copy
- **THEN** the record is written to `orbit/changes/foo/.orbit-runs/signoff/signoff-<TS>.json` carrying the payload's
  fields, `command: "signoff"`, `change: "foo"`, and `sha256` equal to the SHA-256 of `brief-A.md`'s bytes

#### Scenario: A sign-off with the setting off is refused

- **WHEN** the sign-off setting is absent and a well-formed sign-off payload is submitted
- **THEN** the emit is refused naming the setting; no file is written

#### Scenario: A sign-off naming an earlier copy is refused

- **WHEN** `foo`'s `brief/` holds `brief-A.md` and a later `brief-B.md`, and the payload names `brief-A.md`
- **THEN** the emit is refused naming `brief` and `brief-B.md`; no file is written

#### Scenario: A decline without a reason is refused

- **WHEN** a payload carries `answer: "declined"` and no `reason`
- **THEN** the emit is refused naming `reason`; no file is written

#### Scenario: The hash is the engine's

- **WHEN** a payload supplies `sha256`
- **THEN** the emit is refused naming `sha256` as engine-owned; no file is written

#### Scenario: An archived change takes no sign-off

- **WHEN** `orbit emit signoff --change foo` runs and `foo` exists only under `orbit/changes/archive/`
- **THEN** the emit is refused saying a sign-off is written only for an active change, naming where `foo` was found

## MODIFIED Requirements

### Requirement: The reading's selection is recorded at review and archive

The emit surface SHALL record which decision records — and, under `signoff: change`, which account — a reading covered,
and which it owes, on a change's in-context system review emits and its archive emit. A record is READ once an
in-context `review --mode system` emit lists its filename in `decision_records_read`; the SELECTION is the latest record
in each replacement chain of the change's `decisions/` folder that is not read, and, when the sign-off setting
(`orbit-program-brief`'s `The sign-off setting holds each change's archive for the user's sign-off`) is `change`, the
latest record of the change's `account/` chain when it is not read (`orbit-decision-records`' `The reader takes the
account only when sign-off is per change`); `orbit-decision-records`' `The reading step's brief is rendered by orbit`
renders it. No ordering of timestamps decides either: the tokens of `decisions/`, of `account/` and of `.orbit-runs/`
are allocated independently, so a record's token cannot be ordered against a review emit's.

| emit | field | who writes it | what it holds |
|---|---|---|---|
| an in-context `review --mode system` emit | `decision_records_read` | the payload | the filenames of the records the brief the reader was given rendered; `[]` or absent when no reading ran |
| an in-context `review --mode system` emit | `decision_records_owed` | the engine | the selection when the emit is written, before its own `decision_records_read` applies; `[]` when none |
| the `archive` emit | `decision_records_unread` | the engine | the number of records the selection holds at archive: records no reading saw |

An in-context system review payload SHALL be refused, writing nothing, when:

| check | refused when |
|---|---|
| silent | `decision_records_owed` is not empty and `reading` is in neither `passes_run` nor `passes_skipped` |
| read without a list | `reading` is in `passes_run` and `decision_records_read` is absent or empty |
| list without a read | `decision_records_read` is not empty and `reading` is not in `passes_run` |
| outside the selection | a filename in `decision_records_read` is not in the selection when the emit is written; the refusal names it |
| unlistable | the sign-off setting is `change` and a folder the selection reads (the change's `decisions/` or `account/`) exists and cannot be listed; the refusal names the folder |

Under `signoff: change` the archive emit is refused on the same condition, naming the folder, rather than counting an
unlistable folder as holding no record; it is written after the move, so the archive stands, and the emit is written
again once the folder can be listed. Under every other value the selection reads an unlistable folder as empty, as it
did before the setting existed (`automate-dev-flow`'s G0).

The two engine-computed fields are engine-owned: a payload supplying either is refused naming it. Fresh and external
review emits, proposal-mode emits and every other command carry none of the three; a payload of one supplying
`decision_records_read` is refused naming it. None of the three is rendered in any readout: `orbit status`, the report
render and the archive readout show what they show today, and no gate reads them.

Named limit — the review refusal checks that the pass DECLARES the reading, not that a reader ran or read well; that is
the walk's and a later reviewer's to judge (R-crc-10).

Residual kind: a pass that lists `reading` in `passes_run` without having dispatched a reader

Residual method: the reader's findings name records of the selection; a run listing the reading with no finding and no commentary on the records is visible on the trail to G2's closing review

#### Scenario: An in-context system emit records what it owed and read

- **WHEN** a change holds `ledger-A`, which no reading has listed, and a new in-context system review emit lists
  `reading` in `passes_run` and `decision_records_read: ["ledger-A.json"]`
- **THEN** the emit is written with `decision_records_owed: ["ledger-A.json"]`, and the next selection is empty

#### Scenario: A pass that owed a reading and is silent about it is refused

- **WHEN** `decision_records_owed` would be non-empty and the payload lists `reading` in neither `passes_run` nor
  `passes_skipped`
- **THEN** the emit is refused naming `reading`; no file is written

#### Scenario: A skipped reading leaves its records selected

- **WHEN** an in-context system review emit owed `ledger-A` and listed `reading` in `passes_skipped`, with no
  `decision_records_read`
- **THEN** the next in-context system review emit owes `ledger-A` again, and an archive before it counts
  `decision_records_unread: 1`

#### Scenario: A record written during the pass stays selected

- **WHEN** the brief a reader was given rendered `ledger-A`, `ledger-B` was written before the emit, and the emit lists
  `decision_records_read: ["ledger-A.json"]`
- **THEN** the emit is written with `decision_records_owed` holding both, and the next selection holds `ledger-B`

#### Scenario: A read list outside the selection is refused

- **WHEN** a payload lists, in `decision_records_read`, a record an earlier in-context system review emit already listed
- **THEN** the emit is refused naming that record; no file is written

#### Scenario: Nothing owed, nothing required

- **WHEN** every record of a change has been listed as read
- **THEN** the emit is written with `decision_records_owed: []` and need not mention `reading`

#### Scenario: Archive counts what no reading saw

- **WHEN** a change is archived holding two records that no in-context system review emit lists as read
- **THEN** the archive emit carries `decision_records_unread: 2`, and the archive readout is unchanged

#### Scenario: The fields are engine-owned

- **WHEN** an archive payload supplies `decision_records_unread`
- **THEN** the emit is refused naming the field; no file is written

#### Scenario: Under `change`, an unread account is owed and counted

- **WHEN** under `signoff: change` a change holds `account-A` and `ledger-A`, neither listed as read, and is archived with
  no in-context system review emit
- **THEN** the archive emit carries `decision_records_unread: 2`; with the setting absent it would carry `1`

#### Scenario: Under `change`, an unlistable folder refuses the emit

- **WHEN** under `signoff: change` change `foo`'s `.orbit-runs/decisions/` folder exists and cannot be listed, and an
  in-context system review emit or `foo`'s archive emit is written
- **THEN** the emit is refused naming the folder and nothing is written; with the setting absent the folder reads as
  empty and each emit is written as before

#### Scenario: Under `change`, a read account leaves the selection

- **WHEN** under `signoff: change` an in-context system review emit lists `reading` in `passes_run` and
  `decision_records_read: ["account-A.json"]`, the change's latest account
- **THEN** the emit is written with `decision_records_owed` holding `account-A.json`, and the next selection does not
  hold it
