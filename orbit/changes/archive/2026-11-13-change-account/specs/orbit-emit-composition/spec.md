## ADDED Requirements

### Requirement: The write gate checks the account

`orbit emit account --change <name>` SHALL compose and write a change's account (`orbit-decision-records`' `Each change
carries one account, written when apply is complete`), through the same narrative-only payload contract as every other
command (an engine-owned field or an unknown key is refused naming it; `model` is required). The engine composes
`command`, `timestamp` and `change`; nothing else. The payload fields are `built`, `seams`, `deviations`, `defines`
(optional), `detail` (optional) and `replaces` (optional).

Like a decision record, an account is not a run summary: it carries no `kind`, and neither `next_recommended` nor
`final_assessment` — a payload supplying either is refused as engine-owned — and it passes the decision-record spine
checks of `Write-gate validation via the shared normalizers` (`command`, `timestamp` and `model` present, `change` a
string). Its path is `orbit/changes/<name>/.orbit-runs/account/account-<TS>.json`. The `account/` child is held to the
identity rule `Engine-owned spine composition and filename discipline` applies to a decision record's `decisions/`
child: it must physically BE the trail's canonical `account` child — a symlink redirecting it outside the trail, or onto
another folder inside it, is refused naming the folder — checked TWICE, after creation and again immediately before the
record is published; and the filename token, with its collision bump, is unique within `account/`. It is published
without overwriting, as a decision record is: its temporary file is created exclusively and linked to its final name, so
a same-token writer is refused naming the collision and nothing is replaced.

Before ANY write the gate SHALL refuse, writing no file, with a non-zero exit, empty stdout and the field or flag named:

| check | refused when |
|---|---|
| scope | `--doc` is given (a usage error), or `--change` names no active change: a change that exists only as an exploration under `orbit/explore/`, only under `orbit/changes/archive/`, or nowhere; the refusal says that an account is written only for an active change under `orbit/changes/`, naming where the name was found, if anywhere |
| plain fields | `built`, `seams` or `deviations` is absent, not a string, or blank after trimming |
| defines | `defines` is present and not an array of objects `{term, definition}`, both non-blank strings, no other key, no term twice |
| detail | `detail` is present and not a string |
| one account | `replaces` is absent and the change's `account/` folder already holds an account; the refusal names the latest account, to replace instead |
| replaces | `replaces` is present and does not name, by filename, an account in the same `account/` folder, or names one another account already replaces; the refusal names the latest account |

The gate judges FORM and EXISTENCE only (R-crc-10): whether the account is true, complete or clear is a reader's
judgement. No other command changes: the account adds no field to any run summary, and no readout, gate or
recommendation reads it.

Named limit — the one-account check assumes one writer per `account/` folder at a time: it reads the folder, then
writes, and nothing holds the folder between the two.

Residual kind: two accounts of one change written concurrently without `replaces`, each passing the check before the other lands

Residual method: a later account without `replaces` is refused naming the latest, so the second chain surfaces; serializing writers belongs to stage `parallel-lanes` of `automate-dev-flow` (R-adf-4), as for the one-resolution check

#### Scenario: A well-formed account writes

- **WHEN** `orbit emit account --change foo` receives `{model, built: "…", seams: "None.", deviations: "None."}` for an
  active change with no account
- **THEN** the record is written to `orbit/changes/foo/.orbit-runs/account/account-<TS>.json` carrying the payload's
  fields with `command`, `timestamp` and `change`, and no `kind`

#### Scenario: A blank plain field is refused

- **WHEN** an account payload's `built` is blank after trimming
- **THEN** the emit is refused naming `built`; no file is written

#### Scenario: A second account must replace the first

- **WHEN** change `foo` holds `account-A` and an account payload carries no `replaces`
- **THEN** the emit is refused naming `replaces` and `account-A`; no file is written

#### Scenario: A replacement of the latest account writes

- **WHEN** change `foo` holds `account-A` and an account payload carries `replaces: "account-A.json"` and a new `built`
- **THEN** the replacement is written, and `account-A` stays as it was

#### Scenario: A replaced account cannot be replaced again

- **WHEN** `account-A` is replaced by `account-B`, and an account payload carries `replaces: "account-A.json"`
- **THEN** the emit is refused naming `replaces` and `account-B`; no file is written

#### Scenario: An account outside an active change is refused

- **WHEN** `orbit emit account --change foo` runs while only `orbit/explore/foo/` exists, and again with `--doc prog`
- **THEN** the first is refused saying an account is written only for an active change and naming
  `orbit/explore/foo/`, and the second as a usage error; no file is written

#### Scenario: An aliased account folder is refused

- **WHEN** change `foo`'s `.orbit-runs/account` is a symlink to a directory outside the trail, and, in a second case, to
  the trail's own `decisions/` folder
- **THEN** each emit is refused naming the folder; no file is written in either place

#### Scenario: An account carries no recommendation

- **WHEN** an account payload supplies `next_recommended`
- **THEN** the emit is refused naming the field as engine-owned; no file is written
