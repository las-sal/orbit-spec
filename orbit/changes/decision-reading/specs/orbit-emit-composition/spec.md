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
