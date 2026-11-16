## MODIFIED Requirements

### Requirement: Output contract and read-only guarantee beyond the emit

On success the surface SHALL print the written path to stdout. With `--json`, stdout is
instead EXACTLY ONE structured JSON object — `{path, emit, render?}`: `path` the written
file, `emit` the complete composed emit, `render` present only when `--render` applies —
never a plain-text line preceding or following the object (automation consumers parse one
document, no split heuristics). Without `--json`, for proposal/system review emits `--render`
additionally prints
the engine report render (the `orbit status --change <name> --report` output) after the
path — persist-first and run-and-paste collapse into one invocation. For architecture-mode
review emits `--render` is a no-op with a one-line stderr note (the report render is a
change-scoped surface; no architecture report surface exists — D4's architecture exemption). The surface writes EXACTLY one file (the emit,
atomically, for every class) and modifies nothing else — no artifact,
no metadata, no baseline — with one exception: a seam emit whose reading halts also writes each `tripwire` stop record
`orbit-tripwires`' `A halting reading writes a tripwire stop` requires, into the change's `decisions/` folder, only
after the emit has passed its write gate and before the emit itself is written.

#### Scenario: Render in the same breath

- **WHEN** `orbit emit review --change foo --render` succeeds
- **THEN** stdout carries the written path followed by the engine-rendered report for the just-written pass

#### Scenario: --json is one machine-readable object

- **WHEN** `orbit emit review --change foo --json --render` succeeds
- **THEN** stdout is exactly one JSON object with `path`, `emit`, and `render` keys — no plain-text framing precedes or follows it

#### Scenario: Exactly one file

- **WHEN** any `orbit emit` invocation succeeds and no reading on it halts
- **THEN** the trail gains exactly one new file and no other file in the project changed

#### Scenario: A halting reading adds its stop

- **WHEN** `orbit emit review --change foo` succeeds and its `touchpoints` reading halts on a key no stop covers
- **THEN** the trail gains the review emit and one `tripwire` stop record in `decisions/`, and no other file changed

#### Scenario: A refused emit writes no stop

- **WHEN** a review payload that would halt a reading is refused at the write gate
- **THEN** no file is written, the stop included

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
outside it. The decision records change the run-summary commands only as `The reading's selection is recorded at review
and archive` states: the in-context system review emit gains a payload field and its checks, and the review and archive
emits each gain an engine-computed field. The seam emits' `tripwires` field is `orbit-tripwires`' own (`Every seam emit
carries the readings`), and so is the `tripwire` stop orbit writes, which no payload may raise.

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

