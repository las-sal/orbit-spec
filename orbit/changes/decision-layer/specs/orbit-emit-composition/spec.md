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
| raised stop | `relies_on` is empty and `raised_stop` is absent; `relies_on` is not empty and `raised_stop` is present; or `raised_stop` names no stop record in the same `decisions/` folder, one belonging to other work (its `change` or `doc` differs from the record's own), or one whose condition is not `security-unprecedented` or `user-facing-uncovered` |
| resolution's stop | `stop` names no stop record in the same `decisions/` folder, one belonging to other work (its `change` or `doc` differs from the record's own), or one a resolution already names |

A stop or resolution is NAMED by its record's filename (`stop-<TS>.json`), read from the same `decisions/` folder; a
`resolution` citation in `relies_on` names its history and token, never a path, and is found by
`orbit-decision-records`' lookup, so it survives the moves at propose and at archive. The gate judges FORM and EXISTENCE only (R-crc-10):
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

#### Scenario: A stop of another program is refused

- **WHEN** `orbit emit resolution --doc prog-b` names, as `stop`, a stop record in `orbit/architecture/.orbit-runs/decisions/` whose `doc` is `prog-a`
- **THEN** the emit is refused naming `stop`; no file is written

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

### Requirement: Atomic next_recommended — pre-computable and post-write classes

`next_recommended` SHALL be composed, on every run summary, in one of two engine-owned ways, resolved per command (a
DECISION RECORD — `ledger`, `stop`, `resolution`, per `orbit-decision-records` — carries none, per `Deterministic facts
are engine-composed per command`):
(a) PRE-COMPUTABLE — commands whose recommendation derives from the payload or an
already-parsed on-disk source, with no dependence on the emit having landed (review's
findings-dependent pointer from the payload's scorecard, T0's path template, explore's
maturity grid from the parsed staging `explore.md`, archive's post-archive recommendation — composed from the
archived change's `.openspec.yaml` (below), the ARCHITECTURE-SCOPED emits — review `--as architecture`'s
handoff mirror and the doc-scoped address-reviews walk, whose recommendation is the gate-less
confirm pointer naming the doc (`/orbit:review --as architecture <doc>` to confirm the
resolutions) since no change status exists to synthesize): composed before the write;
(b) POST-WRITE SEMANTICS — CHANGE-SCOPED invocations of commands whose
recommendation is the engine's canonical `next_command` AFTER this emit joins the trail
(address-reviews, apply; the class keeps the POST-WRITE name for its SEMANTICS — the
recommendation reflects the landed state — though no provisional file is ever written): the
engine composes the candidate complete except `next_recommended`, computes the change status
against a SYNTHETIC TRAIL — the on-disk trail plus the in-memory candidate treated as already
landed — stamps the field, passes the now-complete record through the full write gate, and
writes EXACTLY ONCE, atomically (temp-file + rename or equivalent). No provisional RECORD
ever exists on the trail: the write gate's before-any-write claim holds for every kind with
ZERO exceptions — the temp file's name never parses as an emit, so no trail reader can see a
half-written record; any failure the process survives cleans the temp file up (a hard kill MAY
strand an inert temp file — noise the trail never reads, never a record) — and the
written emit's `next_recommended` equals the engine's post-landing `next_command` BY
CONSTRUCTION — extended, for apply chunk emits only, by the engine-composed
` — next chunk: <chunk-name>` suffix from the preamble (still one voice: every character is
engine-owned). The emitting AI never performs the write-then-check-then-correct dance.
(`orbit-orientation`'s spine-invalid surfacing remains as defense-in-depth against corruption
from OTHER sources — hand-tampering, partial copies, pre-capability tooling; nothing on this
path can produce a half-written record.) `orbit emit archive` writes to the ARCHIVED change's
trail (`orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/`) AFTER the directory move
completes — the archive directory is resolved by scanning `orbit/changes/archive/` for
`*-<name>/` matches and taking the lexically greatest (never composed from today's date,
which diverges from the move's date across a UTC midnight); no match fails with the
target-resolution contract's clean not-found error. The emit records an outcome
(`archive_path`, the archived-to sentence), and
composing it before the move would record an outcome that does not yet exist; no status
recompute runs against an archived change. Archive's `next_recommended` begins with the command
(`orbit-architect`'s `Start surfaces name the architect workflow first`) and is chosen by the
archived change's `architecture:` citation, read from the `.openspec.yaml` in the archived
directory through the change-metadata schema: when the citation's doc file `orbit/architecture/<doc>.md` exists, it is
`/orbit:architect <doc> — change archived; review stage <stage> and take up the program's next stage, or run /orbit:audit-drift for a project-wide drift check.`;
when there is no citation, the doc file is missing, the metadata cannot be read, or the citation
fails the change-metadata schema (a `doc` that is not a plain file stem, a `stage` that is not
kebab-case), it is
`/orbit:architect <name> — change archived; plan the next piece of work, or run /orbit:audit-drift for a project-wide drift check.`
— the literal `<name>`, a placeholder the user fills. The recommendation never refuses the emit:
an unreadable metadata file selects the second form.

#### Scenario: Post-write stamping matches the engine

- **WHEN** `orbit emit address-reviews --change foo` completes with all findings resolved
- **THEN** the written emit's `next_recommended` equals `orbit status --change foo --json`'s `next_command` computed AFTER the emit landed — byte-identical, by construction

#### Scenario: Every class writes once, complete

- **WHEN** `orbit emit review --change foo` (pre-computable) or `orbit emit apply --change foo` (post-write semantics) runs
- **THEN** the file is written exactly once, complete — no transient missing-field state exists for ANY class

#### Scenario: Crash during synthetic-trail composition leaves no file

- **WHEN** the surface crashes after computing the synthetic-trail status but before the atomic write completes
- **THEN** the trail is unchanged — no file, no partial record; the invocation simply failed

#### Scenario: Archive emit is pre-computable and lands on the archived trail

- **WHEN** `orbit emit archive --change foo` runs after the archive flow has moved the change to `orbit/changes/archive/2026-08-03-foo/`
- **THEN** the emit writes once, complete, to `orbit/changes/archive/2026-08-03-foo/.orbit-runs/archive-<TS>.json` with the engine-composed post-archive `next_recommended`; no status recompute runs against the archived change

#### Scenario: A cited change's archive recommends its program's architect session

- **WHEN** `orbit emit archive --change foo` runs and `orbit/changes/archive/2026-10-14-foo/.openspec.yaml` carries `architecture: {doc: prog, stage: s1}` and `orbit/architecture/prog.md` exists
- **THEN** `next_recommended` is `/orbit:architect prog — change archived; review stage s1 and take up the program's next stage, or run /orbit:audit-drift for a project-wide drift check.`

#### Scenario: An uncited or dangling change's archive recommends a new architect session

- **WHEN** the archived change's metadata carries no `architecture:` citation, or cites a doc whose file no longer exists, or cannot be read, or carries a citation that fails the change-metadata schema (e.g. `doc: ../x`)
- **THEN** `next_recommended` is `/orbit:architect <name> — change archived; plan the next piece of work, or run /orbit:audit-drift for a project-wide drift check.` and the emit is written

### Requirement: Write-gate validation via the shared normalizers

Before ANY write, the composed candidate SHALL pass the same validation the read side uses.
For review emits the gate is MODE-SCOPED (D4's architecture-mode render exemption drawn at
write time): proposal/system review emits pass `orbit-report-rendering`'s strict internal
normalizer (spine semantics, scorecard/findings cell-rollup equality, single-line slot
enforcement, dimension membership); architecture-mode review emits — which that normalizer
rejects by design (`mode` pinned to `proposal|system`, spine `change` required to be a
string) — instead pass the universal-spine checks (which SHALL accept `change: null` plus a
required `doc` for architecture-scoped emits), the same scorecard/findings cell-rollup
equality, and the `orbit-architect`-owned `handoff`-section shape. Every kind passes the
universal-spine checks. A DECISION RECORD (`ledger`, `stop`, `resolution`, per `orbit-decision-records`) carries no
kind and no run-summary reader reads it: it passes instead the decision-record spine checks — `command`, `timestamp`
and `model` present, and `change` a string, or `null` with a string `doc` for an architecture-scoped record — and the
checks of `The write gate checks decision records`; `final_assessment`, `next_recommended` and `kind` are neither
required of it nor accepted from it. Validation failure means NO file, a non-zero exit, the field-naming
error on stderr, and empty stdout. One validator, two gates: the fail-loud boundary that D4
placed at render time moves to write time, so a malformed emit is refused before it becomes a
record rather than discovered when rendered.

**THE ORDERING REFUSAL (rc04a).** A payload carrying JUDGEMENT RECORDS — identified by the presence
of the top-level `judgements` KEY, and by nothing else — SHALL additionally pass an ORDERING check
PER ENTRY. `judgements` is an ARRAY (shape owned by `orbit-run-summary-emit`) and each entry carries
its own `formed_against`, so the check iterates: it is not one comparison against a merged set, and
two entries on one emit may legitimately cite different passes. For EVERY entry,
every token in that entry's `formed_against` MUST be STRICTLY EARLIER than the EMIT'S OWN `<TS>` FILENAME
TOKEN — the engine-composed one, compared in that single representation. The record carries no
timestamp of its own; the comparand is the emit's, and naming it explicitly matters because the
emit holds that instant in TWO forms (the colon-bearing JSON `timestamp` and the hyphenated
filename `<TS>`) and comparing across the two would silently never match. An ENTRY citing a token equal to or later than that
is REFUSED, naming the offending token, the emit's token, and the entry's index — an array of
judgements needs the index or the error cannot be acted on. This is the single computed thing about a judgement
record and the reason the record is buildable at all: R-crc-11(g) requires the AI to judge
readiness KNOWING what the independent reviewers returned, belief is not observable, and ORDERING
is. The engine SHALL NOT evaluate whether the judgement was correct, whether the cited passes were
clean, or whether enough of them were cited — it refuses only a claim that COULD NOT have been
informed by the evidence it names.

The check is SCOPED BY PRESENCE so that no emit that exists today can newly fail: a payload with no
`judgements` key carries no judgement record and is not ordering-checked. Scoping on the KEY rather
than on a nested field is what keeps the check cheap and total — the engine decides whether to
descend at all before it reads anything inside. The RESOLUTION SOURCE is the trail reader's PASS SET — the same `trail.passes` that clause (a)
coverage reads, which admits `review-(proposal|system)-<TS>.json` AND `external-(proposal|system)-<TS>.md`.
Naming it matters: an external pass has no JSON emit and `review-external-<TS>.json` is a PACKAGING
record rather than a pass, so without this the most common external citation would look
unresolvable. A token naming nothing in that set is REFUSED as unresolvable rather than silently
skipped — a citation that cannot be resolved certifies nothing, which is the `Q-crc-17` failure
mode in a new field.

Two edges are settled rather than left to the implementer. (a) An `in-context` token is REFUSED:
`formed_against` names INDEPENDENT passes, and an in-context pass is not one — this is a
well-formedness check on the citation, not the forbidden judgement about whether ENOUGH passes were
cited. (b) A REJECTED external return (`trail.rejectedExternals` — a return that came back
unreadable and still cost a run) is not a pass and citing one is REFUSED: it satisfies no slot and
carries no findings a judgement could have been formed against. (c) The cited pass's MODE is
DELIBERATELY NOT CHECKED, and this is settled rather than overlooked: `TrailPass.mode` is as
observable as the other two, so a terminal `readiness` at archive citing only a
`review-proposal` pass could be refused as a category confusion. It is not, because a proposal-phase
pass genuinely CAN inform a terminal judgement — a design objection raised before apply and accepted
without resolution is exactly an `accepted` pair — and refusing it would be the engine ruling on
whether the cited evidence was the RIGHT evidence, which is the judgement R-crc-10 puts off limits.
(d) An EMPTY `formed_against` is REFUSED on a `continuation`/`proceed` entry WHEN ANY independent
pass in the resolution set is strictly earlier than the emit's own token, naming the LATEST such
pass and the entry's index; it is ACCEPTED when none is. `orbit-run-summary-emit` owns the rule's
statement and its scope (the exemption exists for `continuation`/`proceed` alone); this requirement
names it because THIS is the check that performs it, and a reader asking what the ordering check
may refuse must find it here.

**Edge (d) is well-formedness, NOT sufficiency, and the distinction is the same one edge (a)
already turns on.** The SHALL-NOT above forbids the engine judging whether ENOUGH passes were
cited — a question about adequacy, answerable only by opinion, and it remains forbidden: the engine
still never asks whether two passes should have been three. Edge (d) asks something the trail
answers outright — the entry asserts *there was nothing to cite*, and the trail either bears that
out or contradicts it. Refusing a contradicted assertion is the same act as refusing an
`in-context` token or a rejected external: the CITATION is malformed, not the judgement inadequate.
The boundary is ZERO: at zero the claim is checkable against the trail; above zero, adequacy is
opinion and the engine stays out.

Edges (a), (b) and (d) are well-formedness of the CITATION; mode would be an opinion about the
JUDGEMENT.

#### Scenario: Scorecard/findings mismatch refused at write

- **WHEN** a review payload's scorecard shows zero warnings while its findings contain a WARNING entry
- **THEN** `orbit emit review` exits non-zero naming the mismatched cell; no file is written; stdout is empty

#### Scenario: Forged single-line slot refused at write

- **WHEN** a review payload's finding title contains an embedded newline
- **THEN** the surface exits non-zero naming the slot; no file is written

#### Scenario: Architecture-mode review emit passes the mode-scoped gate

- **WHEN** `orbit emit review --doc my-program` composes an architecture-mode summary (`change: null`, `doc`, `handoff` section) with a valid spine and a rollup-consistent scorecard
- **THEN** the emit writes — the strict internal normalizer (proposal/system-only) is not applied; the universal-spine checks accept `change: null` + `doc`, and a missing or malformed `handoff` section is refused naming the section

#### Scenario: A readiness record citing a LATER pass is refused

- **WHEN** an archive payload's `judgements` array holds a `readiness` entry whose `formed_against`
  names a pass token later than the emit's own `<TS>` token
- **THEN** the surface exits non-zero naming the offending token and the emit's `<TS>` token; no file
  is written; stdout is empty

#### Scenario: A record citing its own timestamp exactly is refused

- **WHEN** an entry's `formed_against` names a token EQUAL to the emit's own `<TS>` token
- **THEN** it is refused — the comparison is STRICTLY earlier, because a judgement formed in the
  same second as the pass it cites cannot be shown to have been informed by it

#### Scenario: An unresolvable citation is refused rather than skipped

- **WHEN** an entry's `formed_against` names a token matching no readable pass on the change's trail
- **THEN** the emit is refused naming the unresolvable token — a citation that resolves to nothing
  certifies nothing

#### Scenario: The check runs per entry, not over a merged set

- **WHEN** an emit's `judgements` array holds two entries, one citing only earlier tokens and one
  citing a later token
- **THEN** the emit is refused naming the SECOND entry's index and its offending token — a valid
  entry does not rescue an invalid one, and a merged comparison would have hidden it

#### Scenario: An empty citation is refused when the trail contradicts it

- **WHEN** a `continuation`/`proceed` entry carries `formed_against: []` and the resolution set holds
  an independent pass strictly earlier than the emit's own token
- **THEN** the emit is REFUSED, naming the LATEST such pass and the entry's index — the entry
  asserts an empty cadence and the trail contradicts it, which is a malformed CITATION rather than
  an opinion about whether enough passes were cited

#### Scenario: An empty citation is accepted when the trail bears it out

- **WHEN** a `continuation`/`proceed` entry carries `formed_against: []` and no independent pass in
  the resolution set precedes the emit's own token
- **THEN** the ordering check ACCEPTS it — the assertion is true of the trail, and this is the case
  that makes the record total over the proceed-anyway domain

#### Scenario: Sufficiency above zero remains outside the engine

- **WHEN** an entry cites ONE independent pass while two preceded the emit
- **THEN** the emit is ACCEPTED — whether the cited evidence was ENOUGH is the judgement R-crc-10
  puts off limits, and edge (d)'s boundary is exactly zero

#### Scenario: A payload with no judgement record is not ordering-checked

- **WHEN** any emit without a `judgements` key is composed
- **THEN** the ordering check does not run and the emit's behaviour is byte-identical to before this
  change — the check is scoped by PRESENCE so no existing emit can newly fail

#### Scenario: A decision record passes its own spine checks

- **WHEN** `orbit emit stop --change foo` composes a well-formed stop record, which has no `final_assessment`, `next_recommended` or `kind`, and a second stop payload omits `model`
- **THEN** the first record is written; the second is refused naming `model`, and no file is written
