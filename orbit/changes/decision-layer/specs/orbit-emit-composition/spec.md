## ADDED Requirements

### Requirement: The write gate checks decision records

`orbit emit ledger`, `orbit emit stop` and `orbit emit resolution` SHALL compose and write the three decision records
`orbit-decision-records` defines, through the same narrative-only payload contract as every other command (an
engine-owned field or an unknown key is refused naming it; `model` is required). The engine composes `command`,
`timestamp`, `change` and, for an architecture-scoped record, `doc`; nothing else. The payload tables:

| command | payload fields |
|---|---|
| `ledger` | `area`, `decided`, `alternatives`, `why`, `relies_on`, `raised_stop` (optional), `defines` (optional), `detail` (optional) |
| `stop` | `condition`, `about`, `question`, `defines` (optional), `detail` (optional) |
| `resolution` | `stop`, `answer`, `effect`, `defines` (optional), `detail` (optional) |

Before ANY write the gate SHALL refuse, writing no file, with a non-zero exit, empty stdout and the field named:

| check | refused when |
|---|---|
| plain fields | `decided`, `why`, `about`, `question`, `answer` or `effect` is absent, not a string, or blank after trimming; `alternatives` is not a non-empty array of such strings |
| defines | `defines` is present and not an array of objects `{term, definition}`, both non-blank strings, no other key, no term twice |
| detail | `detail` is present and not a string |
| area | `area` is not one of the eighteen ids of `orbit-decision-records`' `The ledger's eighteen areas`; the refusal lists them |
| condition | `condition` is not one of `security-unprecedented`, `user-facing-uncovered`, `ruling-amendment`, `outward-act`, `unresolvable-critical`; `tripwire` is refused from a payload, since orbit raises it itself |
| relies on | `relies_on` is not an array; an entry is not one of the shapes `orbit-decision-records`' `A ledger entry names what it relies on` lists; or an entry names something that does not exist by that requirement's test |
| raised stop | `relies_on` is empty and `raised_stop` is absent; or `raised_stop` names no stop record in the same `decisions/` folder, or one whose condition is not `security-unprecedented` or `user-facing-uncovered` |
| resolution's stop | `stop` names no stop record in the same `decisions/` folder, or one a resolution already names |

A stop or resolution is NAMED by its record's filename (`stop-<TS>.json`), read from the same `decisions/` folder; a
`resolution` citation in `relies_on` is a repo-relative path. The gate judges FORM and EXISTENCE only (R-crc-10):
whether a call belongs in an area, whether a citation covers the decision, and whether prose is clear are judgements
outside it. No existing command's payload table or check changes.

#### Scenario: A well-formed ledger entry writes

- **WHEN** `orbit emit ledger --change foo` receives `{model, area: "defaults", decided: "…", alternatives: ["…"], why: "…", relies_on: [{kind: "goal", doc: "automate-dev-flow", id: "G1"}]}` and the doc holds `**G1` under `## Goals`
- **THEN** the record is written to `orbit/changes/foo/.orbit-runs/decisions/ledger-<TS>.json` carrying the payload's fields with `command`, `timestamp` and `change`

#### Scenario: A tripwire stop from a payload is refused

- **WHEN** a stop payload carries `condition: "tripwire"`
- **THEN** the emit is refused naming `condition`; no file is written

#### Scenario: A second resolution of one stop is refused

- **WHEN** `stop-2026-11-07T10-00-00Z.json` already has a resolution and another resolution payload names it
- **THEN** the emit is refused naming the stop; no file is written

#### Scenario: A raised stop of the wrong condition is refused

- **WHEN** a ledger payload with `relies_on: []` names, as `raised_stop`, a stop whose condition is `outward-act`
- **THEN** the emit is refused naming `raised_stop`; no file is written

## MODIFIED Requirements

### Requirement: Engine-owned spine composition and filename discipline

The surface SHALL compose the universal spine (per `orbit-conventions`): `command` from the
argument, `timestamp` as the current UTC instant in standard colon format, `change` from
`--change` (or `null` with a `doc` extension for architecture-scoped commands), `kind` from an
engine-internal command→kind taxonomy table (workflow / editorial / lifecycle — the taxonomy in
`orbit-conventions` becomes engine data, not prose bodies re-state), and the emit path from the
command's persistence location (change trail, explore trail, or architecture trail). A DECISION
RECORD (`ledger`, `stop`, `resolution`, per `orbit-decision-records`) is not a run summary: it
carries no `kind`, and its path is the `decisions/` child of the resolved trail, per
`orbit-decision-records`' `Where decision records are kept`. The
target-resolution contract: `--change <name>` names the WORKSTREAM — a change, or the staging
exploration for explore-trail emits — resolved per the command's trail. Scope capability is
PER COMMAND: `architect` is architecture-ONLY, taking `--doc <doc-name>` (supplying `--change`
to it is a clean usage error); `review` is DUAL-SCOPE on the
change/architecture axis, resolved PER INVOCATION — `--change` routes it to the change
trail, `--doc` to the architecture trail (serving `orbit-review`'s architecture mode);
`address-reviews` is TRIPLE-SCOPE — `--change` (with an ARCHIVED-change fallback: an
active/staging miss resolves against `orbit/changes/archive/*-<name>/` by the archive emit's
lexically-greatest rule, landing the log on the archived trail), `--doc` (the
architecture-scoped resolution logs: `change: null` + `doc`), and BARE for the anchor-less
whole-repo walk, resolving `orbit/.orbit-runs/` (created if absent) with `change: null`, where
the payload's `remaining_markers_in_scope` (a REQUIRED non-negative integer at this scope — it
drives the engine's findings-dependent recommendation) fails loud when missing or invalid,
never defaulting to a clean record — every walk persists through the surface, no scope
hand-writes its log;
`audit-drift` is dual-scope on the change/PROJECT axis — with `--change` it is
change-scoped, bare it is project-scoped, resolving `orbit/.orbit-runs/` (created if absent)
with `change: null`, and `--doc` on it is a usage error; the three decision-record commands are
DUAL-SCOPE on the change/architecture axis like `review` — `--change` resolves an active change or
a staging exploration (never an archived change: a decision is recorded while the work is live),
`--doc` the architecture trail with `change: null` + `doc` — and a bare invocation of them is a
missing-target usage error; every other command is
change-scoped-only (`--doc` to it is a clean usage error). Both flags at once is always a
clean usage error, and a bare invocation of any command without a bare scope (everything
except the two project-scoped commands, `audit-drift` and `address-reviews`) is a
missing-target usage error. A
`--change`/`--doc` value SHALL be a single canonical identifier — a workstream name or doc
filename stem, never a path: separators, traversal segments, and leading dots are a clean
usage error before any resolution (the same contained-identity rule as architecture doc
names); an existing target directory that physically resolves outside its orbit root (a
symlinked container escape) is refused; and the `.orbit-runs` trail child must physically BE its container's canonical `.orbit-runs`
child (IDENTITY, not ancestry: an in-container alias like `.orbit-runs -> .` or a sibling
redirect is refused exactly like an outside escape — a lexically-correct path whose physical
record no trail reader would find is not a trail), checked TWICE (and, for a decision record, its `decisions/` child must likewise physically BE the
trail's canonical `decisions` child) — after creation, and again
AFTER every caller-supplied value is materialized into the final bytes, immediately before
the write (no caller-controlled code runs between the final check and the write, closing the
check/use window across composition). The CONTENT is frozen the same way: the record is
materialized to inert plain data BEFORE the write gate runs, the gate validates that frozen
record, and the written bytes are serialized from the same frozen record — the gate-validated
candidate and the written bytes are ONE read of caller state, so no getter or toJSON hook can
present gate-clean values and serialize different ones. The surface writes orbit trails ONLY, and
no failure path writes any file. A
`--change`/`--doc` value that resolves to no on-disk workstream (no change directory, no
staging directory, no architecture doc) fails with a clean error naming the path checked; no
file is written. The
filename `<TS>` token is the timestamp with colons replaced by hyphens; when ANY file in the
target trail directory already carries that token — of any command, any extension (a pass
record, a walk log, an external findings or prompt file) — the token is bumped forward one
second until no trail file carries it (the collision rule bodies previously taught as prose —
engine-owned here, preserving lexical ordering guarantees). For a decision record the target directory is the trail's
`decisions/` child, so the token is unique among decision records and independent of the trail's
own files. Within one trail, token order is
therefore WRITE order for every reader that orders records by strict token comparison (the
reviewed gate, the pass-genre computation, the judgement ordering check): a walk and the review
written after it in the same second cannot share a token and read as unordered. Prior trails
that already hold an equal-token pair are not rewritten; the rule runs at write time only.
Filename-token resolution — INCLUDING any collision bump — precedes deterministic-fact
composition: a recommendation that names this emit's own path always names the FINAL written
path, never a pre-bump token.

#### Scenario: Anchor-less walk persists through the bare project scope

- **WHEN** `orbit emit address-reviews --payload <file>` runs bare after a whole-repo marker walk
- **THEN** the log lands at `orbit/.orbit-runs/address-reviews-<TS>.json` with `change: null`, composed and gated by the engine — never hand-written

#### Scenario: Archived-change walk persists to the archived trail

- **WHEN** `orbit emit address-reviews --change <name>` runs and `<name>` exists only under `orbit/changes/archive/`
- **THEN** the resolution falls back to the lexically-greatest `archive/<YYYY-MM-DD>-<name>/` match and the log lands on that archived trail

#### Scenario: Traversal-shaped targets never write

- **WHEN** `orbit emit explore --change ../elsewhere` (or any target value carrying separators, `..`, or a leading dot) runs
- **THEN** the invocation fails with the clean canonical-identifier usage error before resolution; no directory is created and no file is written anywhere

#### Scenario: Collision bumps forward

- **WHEN** an emit composes to a token that a file already in the trail carries — its own filename, or any other command's record or markdown file
- **THEN** the `<TS>` token advances one second at a time until no trail file carries it, and the JSON `timestamp` field matches the final token

#### Scenario: A same-second walk precedes the review written after it

- **WHEN** an address-reviews log is written at token T and an in-context review of the same mode is emitted within the same second
- **THEN** the review's token is bumped past T, so the pass-genre computation reads the walk as preceding it and computes `VERIFICATION`

#### Scenario: Trail location per command

- **WHEN** `orbit emit explore --change foo` runs for a staging exploration
- **THEN** the file lands in `orbit/explore/foo/.orbit-runs/` (the explore trail); change-scoped commands land in `orbit/changes/<name>/.orbit-runs/`; architecture-scoped commands land in `orbit/architecture/.orbit-runs/`; bare project-scoped `orbit emit audit-drift` lands in `orbit/.orbit-runs/`; `orbit emit archive` lands in the ARCHIVED change's trail `orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/` (per the atomic-recommendation requirement's archive rule)

#### Scenario: Project-scope emit takes no target flag

- **WHEN** `orbit emit audit-drift` runs with neither `--change` nor `--doc`
- **THEN** the file lands at `orbit/.orbit-runs/audit-drift-<TS>.json` with `change: null`; the same invocation with `--change foo` is change-scoped to foo's trail, and supplying `--doc` is a clean usage error

#### Scenario: A decision record lands in the trail's decisions folder

- **WHEN** `orbit emit stop --change foo` runs for an active change, and `orbit emit ledger --doc my-program` runs for an architecture doc
- **THEN** the first writes `orbit/changes/foo/.orbit-runs/decisions/stop-<TS>.json` and the second `orbit/architecture/.orbit-runs/decisions/ledger-<TS>.json` with `change: null` and `doc: "my-program"`; neither record carries `kind`, and `orbit emit ledger --change` naming a change that exists only under `orbit/changes/archive/` fails with the not-found error

### Requirement: Deterministic facts are engine-composed per command

Where a capability defines an emit field as a deterministic fact, the surface SHALL compute it
— never accept it from the payload: for review emits, `final_assessment` is the severity-counts
sentence derived from the payload's scorecard (`"X critical, Y warning, Z suggestion."` /
`"No findings."`) and `next_recommended` is the findings-dependent pointer — when findings
exist, the change-scoped `/orbit:address-reviews <change>` for proposal/system (naming no file:
on an active change the change-scoped walk discovers every pass that carries a finding, per `orbit-address-reviews`'
`Address-reviews command available`, so the emit names the walk the gate's canonical next
names whenever that next is a walk, per `orbit-engine-gates`' `A reviewed gate lists its outstanding passes` — the
emit's pointer depends only on the pass's findings, while the gate's next is computed from the whole trail and names
the missing member on a half-landed pair), and for architecture mode the address-reviews
`--from-file` invocation naming this emit's own path (no change-scoped walk reads the
architecture trail); when CLEAN,
the `orbit status --change <name> --report` render pointer for proposal/system, and for
architecture mode — where `change` is null and no report surface exists — the payload's
architect-owned `handoff.next_command`, MIRRORED per the architect rule below — per
`orbit-report-rendering`'s strict contract, which the write gate enforces on proposal/system —
and review emits'
`iteration` is likewise engine-computed: for proposal/system the next ordinal on the SHARED
internal+external pass axis (the report ordinal's counting rule per `orbit-report-rendering`);
for architecture mode the per-DOC ordinal (prior `review-architecture-*.json` emits with
matching `doc` + 1 — the `orbit-review` baseline's own per-doc anchoring), never
payload-supplied — the ordinal-divergence seam D4 closed at render time stays closed at write
time; for review-external
T0 emits, `next_recommended` is the recommendation `orbit-run-summary-emit`'s `Review-external
T0 multi-step recommendation` owns, composed from the prompt path template, and
`awaiting_findings: true` is engine-set; for explore emits, the
counts and maturity-grid recommendation per the computed-extensions requirement; for apply
emits, `final_assessment`'s CORE is the engine-composed chunk/counts sentence from the fields
the engine already computes (`"Completed chunk 2 of 5 (inventory+parsing); 28 of 76 tasks
done."`, with paused and no-chunking variants from `chunk_complete`/`chunk`), and the payload
MAY supply an optional `assessment_suffix` string (the judgment sentence) that the engine
appends after the core — a payload-supplied `final_assessment` on an apply emit is rejected
as engine-owned (the two-voices seam the D-d5-1 governing rule closes; review's counts
sentence is the precedent); for architect emits, the spine's `next_recommended` is
engine-COPIED verbatim from the payload's architect-owned `handoff.next_command` (the
`handoff` section remains the single authored home — the spine field mirrors it, never a
second author; direct payload supply of spine `next_recommended` stays rejected). The
remaining emitting commands (the propose family, verify, audit-drift) derive their
recommendations as deterministic facts from their owning capability's recommendation
requirements in `orbit-run-summary-emit` — no emitting command lacks a composition rule. A
decision record (`ledger`, `stop`, `resolution`) records one decision, not a run, and recommends
nothing: its rule is ABSENCE — it carries neither `next_recommended` nor `final_assessment`, and a
payload supplying either is refused as engine-owned (per `orbit-decision-records`).

#### Scenario: Review counts sentence composed from the payload scorecard

- **WHEN** a review payload's scorecard sums to 1 warning
- **THEN** the written emit's `final_assessment` is `0 critical, 1 warning, 0 suggestion.` and, for a proposal- or system-mode pass on change `foo`, `next_recommended` is `/orbit:address-reviews foo` — naming no path

#### Scenario: Review iteration engine-computed from the shared pass axis

- **WHEN** `orbit emit review --change foo` runs with two prior passes on foo's shared internal+external axis
- **THEN** the emit carries `iteration: 3` computed from the trail; a payload supplying `iteration` is rejected naming the field

#### Scenario: T0 recommendation composed from the path template

- **WHEN** `orbit emit review-external --change foo` receives a payload with `prompt_path`
- **THEN** the emit's `next_recommended` is the paste-and-save prose naming the prompt path and the expected findings path pattern, ending at the save step, and `awaiting_findings` is `true`

#### Scenario: Apply assessment core engine-composed, suffix appended

- **WHEN** `orbit emit apply --change foo` fires at chunk-2 completion with payload `assessment_suffix: "Parser edge cases ran deeper than planned."`
- **THEN** the written `final_assessment` is the engine-composed chunk/counts core followed by the suffix; a payload supplying `final_assessment` itself is rejected naming the field

#### Scenario: Architect recommendation mirrors the handoff

- **WHEN** `orbit emit architect --doc my-program` receives a payload whose `handoff.next_command` names the resume invocation
- **THEN** the emit's spine `next_recommended` equals that handoff value verbatim — mirrored, not re-authored; a payload supplying spine `next_recommended` directly is still rejected naming the field

#### Scenario: Architecture-mode review keeps its self pointer

- **WHEN** `orbit emit review --doc my-program` writes an architecture-mode pass with one finding
- **THEN** `next_recommended` is `/orbit:address-reviews --from-file orbit/architecture/.orbit-runs/<this emit's file name>` — unchanged by the change-mode short form

#### Scenario: A clean change-mode pass still points at the report

- **WHEN** a proposal-mode payload for change `foo` carries no findings
- **THEN** `next_recommended` is `orbit status --change foo --report`

#### Scenario: A decision record carries no recommendation

- **WHEN** `orbit emit ledger --change foo` writes a well-formed entry, and a second ledger payload supplies `next_recommended`
- **THEN** the first record carries neither `next_recommended` nor `final_assessment`; the second is refused naming the field as engine-owned, and no file is written
