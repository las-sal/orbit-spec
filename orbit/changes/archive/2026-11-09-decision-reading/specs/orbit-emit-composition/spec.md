## MODIFIED Requirements

### Requirement: The write gate checks decision records

`orbit emit ledger`, `orbit emit stop` and `orbit emit resolution` SHALL compose and write the three decision records
`orbit-decision-records` defines, through the same narrative-only payload contract as every other command (an
engine-owned field or an unknown key is refused naming it; `model` is required). The engine composes `command`,
`timestamp`, `change` and, for an architecture-scoped record, `doc`; nothing else. The payload tables:

| command | payload fields |
|---|---|
| `ledger` | `area`, `decided`, `alternatives`, `why`, `relies_on`, `raised_stop` (optional), `defines` (optional), `detail` (optional), `replaces` (optional) |
| `stop` | `condition`, `about`, `question`, `defines` (optional), `detail` (optional), `replaces` (optional) |
| `resolution` | `stop`, `answer`, `effect`, `defines` (optional), `detail` (optional), `replaces` (optional) |

Before ANY write the gate SHALL refuse, writing no file, with a non-zero exit, empty stdout and the field named:

| check | refused when |
|---|---|
| plain fields | `decided`, `why`, `about`, `question`, `answer` or `effect` is absent, not a string, or blank after trimming; `alternatives` is not a non-empty array of such strings |
| defines | `defines` is present and not an array of objects `{term, definition}`, both non-blank strings, no other key, no term twice |
| detail | `detail` is present and not a string |
| area | `area` is not one of the eighteen ids of `orbit-decision-records`' `The ledger's eighteen areas`; the refusal lists them |
| condition | `condition` is not one of `security-unprecedented`, `user-facing-uncovered`, `ruling-amendment`, `outward-act`, `unresolvable-critical`; `tripwire` is refused from a payload, since orbit raises it itself |
| relies on | `relies_on` is not an array; an entry is not one of the shapes `orbit-decision-records`' `A ledger entry names what it relies on` lists; or an entry names something that does not exist by that requirement's test |
| raised stop | `relies_on` is empty and `raised_stop` is absent; `relies_on` is not empty and `raised_stop` is present; or `raised_stop` names no stop record in the same `decisions/` folder, one belonging to other work (its `change` or `doc` differs from the record's own), or one whose condition is not `security-unprecedented` or `user-facing-uncovered` |
| resolution's stop | `stop` names no stop record in the same `decisions/` folder, one belonging to other work (its `change` or `doc` differs from the record's own), or one whose stop chain a resolution already answers: a resolution naming any record of the stop's replacement chain counts, and each resolution chain counts once (a payload replacing that stop's resolution is not a second) |
| replaces | `replaces` is present and does not name, by filename, a record of the same command in the same `decisions/` folder belonging to the same work; names one another record already replaces; or the payload's link fields (`orbit-decision-records`' `A record is fixed by a replacement, never edited`) differ from the named record's, the refusal naming the first that differs |
| replaced target | `raised_stop`, a resolution's `stop`, or a `resolution` citation in `relies_on` names a record that has been replaced, unless the payload carries `replaces` and that link equals its original's (a carried link is not new); the refusal names the latest record in its chain, to cite instead |

A stop or resolution is NAMED by its record's filename (`stop-<TS>.json`), read from the same `decisions/` folder; a
`resolution` citation in `relies_on` names its history and token, never a path, and is found by
`orbit-decision-records`' lookup, so it survives the moves at propose and at archive. `replaces` names a record by its
filename in the same `decisions/` folder. The gate judges FORM and EXISTENCE only (R-crc-10):
whether a call belongs in an area, whether a citation covers the decision, and whether prose is clear are judgements
outside it. The run-summary commands change only as `The reading's selection is recorded at review and archive` states:
the in-context system review emit gains a payload field and its checks, and the review and archive emits each gain an
engine-computed field.

A decision record is published WITHOUT OVERWRITING: its temporary file is created exclusively and linked to its final
name, so a second writer that drew the same token in the same `decisions/` folder is refused naming the collision,
writing nothing, rather than replacing a record or another writer's temporary file. A resolution's refusal for an
already-resolved stop names EVERY resolution that names it.

#### Scenario: A well-formed ledger entry writes

- **WHEN** `orbit emit ledger --change foo` receives `{model, area: "defaults", decided: "…", alternatives: ["…"], why: "…", relies_on: [{kind: "goal", doc: "automate-dev-flow", id: "G1"}]}` and the doc holds `**G1 — …**` under `## Goals`
- **THEN** the record is written to `orbit/changes/foo/.orbit-runs/decisions/ledger-<TS>.json` carrying the payload's fields with `command`, `timestamp` and `change`

#### Scenario: A tripwire stop from a payload is refused

- **WHEN** a stop payload carries `condition: "tripwire"`
- **THEN** the emit is refused naming `condition`; no file is written

#### Scenario: A second resolution of one stop is refused

- **WHEN** `stop-2026-11-07T10-00-00Z.json` already has a resolution and another resolution payload names it
- **THEN** the emit is refused naming the stop; no file is written

#### Scenario: A same-token writer cannot replace a record

- **WHEN** a stop is emitted while the temporary file for its token already exists in the `decisions/` folder (another writer mid-write)
- **THEN** the emit is refused naming the collision; that temporary file is left in place, and no record is written or replaced

#### Scenario: A stop of another program is refused

- **WHEN** `orbit emit resolution --doc prog-b` names, as `stop`, a stop record in `orbit/architecture/.orbit-runs/decisions/` whose `doc` is `prog-a`
- **THEN** the emit is refused naming `stop`; no file is written

#### Scenario: A raised stop of the wrong condition is refused

- **WHEN** a ledger payload with `relies_on: []` names, as `raised_stop`, a stop whose condition is `outward-act`
- **THEN** the emit is refused naming `raised_stop`; no file is written

#### Scenario: A replacement of another kind is refused

- **WHEN** a stop payload carries `replaces: "ledger-2026-11-08T10-00-00Z.json"`
- **THEN** the emit is refused naming `replaces`; no file is written

#### Scenario: A second replacement of one record is refused

- **WHEN** `ledger-A` is already replaced by `ledger-C`, and another ledger payload carries `replaces: "ledger-A.json"`
- **THEN** the emit is refused naming `replaces` and `ledger-C`; no file is written

#### Scenario: A raised stop that was replaced is refused

- **WHEN** `stop-S` is replaced by `stop-T`, and a ledger payload with `relies_on: []` names `stop-S` as `raised_stop`
- **THEN** the emit is refused naming `raised_stop` and `stop-T`; no file is written

#### Scenario: A replacement carries a link to a replaced stop

- **WHEN** `stop-S` is replaced by `stop-T`, and a ledger payload carries `replaces: "ledger-L.json"` with
  `raised_stop: "stop-S.json"` and every other link field equal to `ledger-L`'s
- **THEN** the replacement is written

#### Scenario: A second answer through a replaced stop is refused

- **WHEN** `resolution-B` names `stop-S`, `stop-S` is replaced by `stop-T`, and a resolution payload names `stop-T`
  without `replaces`
- **THEN** the emit is refused naming the stop and `resolution-B`; no file is written

### Requirement: Payload schema references are proven by execution

Every payload schema block in a shipped skill reference — today six blocks across five references: the review skill's `run-summary-schema.md` (change modes; architecture mode) and `external-handoff.md` (the review-external T0 payload), and the address-reviews, audit-drift and archive schema references — SHALL be accompanied, in the same reference, by its example payloads — normally ONE, and more only where the block documents fields that cannot appear in one payload together: each a fenced block whose info string is `json example` followed by one or more scope words, holding real JSON that is EXACTLY a payload file the skill's body tells the AI to write. An example carries NO ENGINE-OWNED field — no spine field the engine composes and no engine-computed extension; `model` is always present, and `final_assessment` is present wherever the command's payload table carries it. An example belongs to the NEAREST PRECEDING full-record schema block in the same reference (a JSON block whose top-level keys include `command`); an example preceding every such block belongs to none and fails the test. A worked example a reference shows for illustration is NOT a schema block and SHALL omit `command`, so the definition matches schema blocks only — and a worked example that carries `command` fails loudly, as a schema block with no example, never silently. A block's examples JOINTLY carry every AI-supplied key the block documents: the union of their top-level keys, excluding `model`, equals the block's top-level keys minus the engine-owned list the field-set test subtracts and minus the GENRE-DEPENDENT keys named below; `model` is asserted present in every example separately. So a documented field is EXECUTED, never only compared, and an optional field appears in an example rather than being left out of it. The GENRE-DEPENDENT keys are a closed list — today one, the review payload's `verification`, which the write gate owes on a VERIFICATION-genre pass and refuses on a REVIEW-genre pass, so its acceptance turns on walk records in the trail rather than on the example: such a key is exempt from joint coverage by name, and its acceptance stays proven by the write gate's own tests. The example is taken from the reference's own text, verbatim: never by instantiating the schema block's documentation dialect (`"<placeholder>"` strings, `"a" | "b"` unions) and never from a fixture written in a test — those are the three places a payload can come from, and only the first is the reference.

A test SHALL submit each example, unchanged, through the engine's real write gate (`composeAndWriteEmit`) in a disposable project, once per scope word on its info string, and SHALL assert that the gate ACCEPTS it and writes the emit. No engine-owned key is stripped before submission: an example that supplies one is refused, as it would be in use, and the test fails carrying the gate's own error text. The scope words are a closed set, decided by this table:

| scope word | target the test submits to |
|---|---|
| `change` | an active change directory created in the disposable project |
| `archived` | an archived change directory (`orbit/changes/archive/<date>-<name>/`) created in the disposable project — the archive command's only target, and address-reviews' archived fallback |
| `project` | no target (the bare project-scoped invocation) |
| `doc` | an architecture doc created in the disposable project |
| any other word, or none | the test fails naming the block's opening line |

**Seeding.** Where a write-gate check reads state beside the payload, the test SHALL seed the disposable project, before submission, by exactly three rules, and nothing else:

- **The trail.** The `judgements` ordering check refuses a `formed_against` token that names no accepted independent pass, so the test seeds ONE minimal independent pass file at every token an example names in a `formed_against` array.
- **The tasks file.** The archive write gate refuses an unchecked `(User-validation` task without a deferral and a deferral naming no such task (`orbit-archive-modifications`' `User-validation closure at the archive seam`), so the test seeds the target's `tasks.md` with ONE unchecked task carrying the `(User-validation` marker at every task id an example names in a `deferred_validations` array. An example naming none is submitted against a `tasks.md` carrying no marked task.
- **The decisions folder.** The in-context system review write gate refuses a `decision_records_read` filename
  outside the selection (`The reading's selection is recorded at review and archive`), so the test seeds ONE minimal
  record file at every filename an example names in a `decision_records_read` array, in the target trail's
  `decisions/` folder. An example naming none is submitted against a trail with no `decisions/` folder.

Seeding never edits the example; a check that reads state no example names is outside what seeding supplies and is named in the residual below.

The schema block remains documentation and may show spine and engine-computed keys, marked as such; the field-set test of `Payload tables agree with their schema references` continues to check that block.

**Named limit.** The round trip is exactly as strong as the write gate's validators. Residual kind: a documented field type or value the write gate does not validate (today most fields of every command; audit-drift's `categories_run`, `findings` and finding `category` are checked by `Audit-drift counts are engine-computed`), a write-gate check reading trail or tasks-file state that no example's `formed_against`, `deferred_validations` or `decision_records_read` names, and the genre-dependent keys exempted above (today `verification`), which no example executes. Residual method: read each command's validators in `emit-composition.ts`; a documented constraint with no validator is outside the round trip and stays a reviewer's claim.

**Outside this requirement, by name.** The findings formats a reference documents (`external-findings-format.md`, `internal-findings-format.md`) and the review prompt template's output format — whose surfaces are the external-findings readers, not the write gate — and `orbit …` invocations written inside references. Neither is proven by this test.

#### Scenario: A refused example fails by execution

- **WHEN** a schema reference's example supplies a key its command's payload table does not accept
- **THEN** the round-trip test fails, and its message carries the write gate's `unknown payload key` error naming the key

#### Scenario: An engine-owned key in the example is refused, not stripped

- **WHEN** the audit-drift reference's example supplies `next_recommended`
- **THEN** the write gate refuses the payload naming the field as engine-owned and the round-trip test fails — the test removes nothing before submission

#### Scenario: Each scope word is exercised

- **WHEN** the audit-drift example's info string is `json example change project`
- **THEN** the test submits the example twice — once to a change in the disposable project, once with no target — and both submissions must be accepted

#### Scenario: A documented field missing from every example fails

- **WHEN** a schema block documents an AI-supplied key, not on the closed genre-dependent list, that none of its examples carries
- **THEN** the round-trip test fails naming the key and the block — the field would otherwise be compared and never executed

#### Scenario: An example attaches to the nearest preceding schema block

- **WHEN** a field documented in the review reference's architecture-mode block is carried only by the change-mode block's example
- **THEN** the test fails naming the field and the architecture-mode block — coverage is checked per block, by attachment, never pooled across a reference

#### Scenario: A genre-dependent key is exempt by name, and only by name

- **WHEN** the review change-mode block documents `verification` and its example omits it
- **THEN** the joint-coverage check passes for that key — and the same omission of any key not on the closed genre-dependent list fails

#### Scenario: The archive example runs against an archived target with a seeded trail

- **WHEN** the archive reference's example (info string `json example archived`) carries a `readiness` judgement whose `formed_against` names one pass token, and a `deferred_validations` entry naming one task
- **THEN** the test creates the archived change directory, writes one minimal independent pass file at that token in its trail and one unchecked `(User-validation` task at that id in its `tasks.md`, submits the example unchanged, and asserts acceptance

#### Scenario: An unknown scope word fails the test

- **WHEN** an example's info string is `json example archive-dir`
- **THEN** the test fails naming that block's opening line; the example is not submitted

#### Scenario: A schema block without an example fails

- **WHEN** a payload schema reference carries a schema block and no `json example` block
- **THEN** the round-trip test fails naming the reference

## ADDED Requirements

### Requirement: The reading's selection is recorded at review and archive

The emit surface SHALL record which decision records a reading covered, and which it owes, on a change's in-context
system review emits and its archive emit. A record is READ once an in-context `review --mode system` emit lists its
filename in `decision_records_read`; the SELECTION is the latest record in each replacement chain of the change's
`decisions/` folder that is not read (`orbit-decision-records`' `The reading step's brief is rendered by orbit` renders
it). No ordering of timestamps decides either: the tokens of `decisions/` and of `.orbit-runs/` are allocated
independently, so a record's token cannot be ordered against a review emit's.

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
