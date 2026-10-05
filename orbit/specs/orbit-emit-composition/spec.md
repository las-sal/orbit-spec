# orbit-emit-composition Specification

## Purpose

The engine-owned emit surface (`orbit emit <command>`, D-arc Stage D5): every run-summary JSON on every orbit trail is COMPOSED and WRITTEN by the engine from a narrative-only payload — the emitting AI supplies only the fields it genuinely authors, and the engine owns the universal spine, the deterministic facts, the per-command computed extensions, the filename/collision handling, and a fail-loud write gate that validates the frozen record before a single byte lands. Target resolution covers every trail (change, staging exploration, archived change, architecture doc, bare project scope) with contained-identifier and canonical-trail-child guarantees — the surface writes orbit trails ONLY. This capability retires the hand-composed-emit practice: a wrong-but-plausible record can no longer be authored, only computed.
## Requirements
### Requirement: Generic emit surface with a narrative-only payload contract

The system SHALL expose `orbit emit <command> --change <name>` — ONE generic surface for
composing and writing run-summary emits (naming precedent: the verb-first `orbit fingerprint`).
The payload arrives as JSON on stdin or via `--payload <file>` — when `--payload` is present
stdin is not consulted (no both-channels ambiguity exists), and an absent payload (no flag,
empty or terminal stdin) is a clean non-zero error naming both channels with no file
written — and carries ONLY the
narrative/authored fields for that command per an AUTHORITATIVE engine-owned per-command
payload-field table (the fields the emitting AI genuinely authors — review: `mode`,
`reviewer_class`, `depth`, `flags`, `scorecard`, `findings`, `stale_suppressed`, `commentary`,
`passes_run`, `passes_skipped`, the optional `blocks`, `direction` — OPTIONAL on an `in-context` pass and OWED by a `fresh` or `external` one, per `The review payload carries direction` — and `verification` — OWED when the emit's computed `pass_genre` is `VERIFICATION`, each finding entry optionally carrying `walk_entry`, per `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (the genre and its walk set are computed extensions, per `The review emit records its pass genre and the walks it verifies`); address-reviews: the `source*` fields, `walk_mode`,
`resolutions`, the narrative `final_assessment` — its `iteration` is ENGINE-computed, the
count of prior address-reviews emits on the resolved trail plus one, ANCHORED PER DOC on the
shared architecture trail (a doc-scoped walk counts only logs whose `doc` matches — the same
per-doc rule as the review-architecture ordinal; doc B's walk never counts doc A's logs),
rejected when payload-supplied; propose and ff additionally accept an OPTIONAL structured
`pr_attachment` object (`{branch, granularity, url?, state?, doc?}` — the composite ATTACHMENT
record whose owning definition and key semantics live in `orbit-run-summary-emit`), and
archive additionally accepts OPTIONAL `pr_url` and `pr_state` narrative pass-through fields
(archive RESOLVES no attachment — it reads the one propose/ff recorded and reports the PR
state it observed) (per `orbit-pr-lifecycle` — the trail records
the outward PR artifact's URL and state AS OBSERVED AT EMIT TIME, never a forward-looking
claim: `pr_state` is exactly one of the two lowercase strings `"draft"` or `"ready"` (a
closed or merged PR is NOT representable — the field records the draft/ready axis only, so a
body elides the field both when it CANNOT observe the state and when it observes a condition
off that axis; `pr_url` may still accompany an elided `pr_state`, recording which PR was
observed). The archive emit is written after the
tail's READ-ONLY PREFLIGHT and before its mutations, so it records what the preflight
OBSERVED — normally `"draft"`, and truthfully `"ready"` when the PR was already flipped (by
the USER at an earlier point, including at a prior program's arc-done for a program PR
adopted afterward — never by a stage);
the READY transition that the tail performs afterward is evidenced by the PR itself and the
completion readout, NOT by a field asserting a state that has not happened. Both fields are
elided when absent, never computed by the engine); the table's per-command rows derive from the
owning capability's emit definitions, and these inline lists are EXCERPTS of that derivation —
the owning capability's definition governs when they diverge). Fields the engine owns (`command`, `timestamp`,
`change`, `kind`, the filename token, every deterministic fact per the deterministic-facts
requirement, and every computed extension) SHALL be REJECTED when present in the payload with
a clean error naming the field — a second voice on a computable fact is refused at the seam,
never silently overwritten. Keys in NEITHER the command's payload table nor the engine-owned
set SHALL likewise be REJECTED naming the key — a typo'd narrative key (`pases_run`) fails
loudly at the seam, never passes silently into the record. The per-skill
`references/run-summary-schema.md` payload lists MIRROR the engine table, never define it. An
unknown `<command>` fails with a clean error naming the emittable command set. The payload SHALL include a `model` key (nullable — the emitting AI's model
identity, or explicit `null` when unknown); a payload missing the key is rejected naming it,
so provenance is always a conscious act.

#### Scenario: Payload carries only authored fields

- **WHEN** `orbit emit review --change foo` receives a payload with `mode`, `reviewer_class`, `depth`, `scorecard`, `findings: []`, and `model`
- **THEN** the engine composes the full emit around those fields and writes it to `orbit/changes/foo/.orbit-runs/review-<mode>-<TS>.json`

#### Scenario: Engine-owned field in the payload is rejected

- **WHEN** a payload includes `timestamp` or `next_recommended`
- **THEN** the surface exits non-zero with a clean error naming the engine-owned field; no file is written

#### Scenario: Unknown payload key is rejected

- **WHEN** a review payload includes `pases_run` — a key in neither the review payload table nor the engine-owned set
- **THEN** the surface exits non-zero with a clean error naming the unknown key; no file is written

#### Scenario: Missing model key is rejected

- **WHEN** a payload omits the `model` key entirely
- **THEN** the surface exits non-zero naming `model` (explicit `null` is accepted); no file is written

#### Scenario: Unknown command

- **WHEN** `orbit emit frobnicate --change foo` is invoked
- **THEN** the surface exits non-zero with a clean error naming the supported command set; no file is written

#### Scenario: PR pass-through fields record emit-time truth

- **WHEN** an archive payload includes `pr_url` and `pr_state` carrying the value the read-only preflight observed — `"draft"` ordinarily, or `"ready"` for a PR already flipped before this archive
- **THEN** the written emit carries both fields verbatim; the engine enforces the enum and the observed-not-predicted contract, not a particular value (a body composing a state it did NOT observe is the false record — including asserting `"ready"` on the strength of a flip the tail has yet to perform); the same fields on a review payload are rejected as unknown keys

### Requirement: Engine-owned spine composition and filename discipline

The surface SHALL compose the universal spine (per `orbit-conventions`): `command` from the
argument, `timestamp` as the current UTC instant in standard colon format, `change` from
`--change` (or `null` with a `doc` extension for architecture-scoped commands), `kind` from an
engine-internal command→kind taxonomy table (workflow / editorial / lifecycle — the taxonomy in
`orbit-conventions` becomes engine data, not prose bodies re-state), and the emit path from the
command's persistence location (change trail, explore trail, or architecture trail). The
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
with `change: null`, and `--doc` on it is a usage error; every other command is
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
record no trail reader would find is not a trail), checked TWICE — after creation, and again
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
engine-owned here, preserving lexical ordering guarantees). Within one trail, token order is
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

### Requirement: Deterministic facts are engine-composed per command

Where a capability defines an emit field as a deterministic fact, the surface SHALL compute it
— never accept it from the payload: for review emits, `final_assessment` is the severity-counts
sentence derived from the payload's scorecard (`"X critical, Y warning, Z suggestion."` /
`"No findings."`) and `next_recommended` is the findings-dependent pointer — the
address-reviews `--from-file` invocation naming this emit's own path when findings exist (all
modes; the architecture-scoped walk ingests exactly like the change-scoped one); when CLEAN,
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
T0 emits, `next_recommended` is the multi-step paste/save/ingest recommendation composed from
the prompt path template and `awaiting_findings: true` is engine-set; for explore emits, the
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
requirements in `orbit-run-summary-emit` — no emitting command lacks a composition rule.

#### Scenario: Review counts sentence composed from the payload scorecard

- **WHEN** a review payload's scorecard sums to 1 warning
- **THEN** the written emit's `final_assessment` is `0 critical, 1 warning, 0 suggestion.` and `next_recommended` names this emit's own path in an address-reviews invocation

#### Scenario: Review iteration engine-computed from the shared pass axis

- **WHEN** `orbit emit review --change foo` runs with two prior passes on foo's shared internal+external axis
- **THEN** the emit carries `iteration: 3` computed from the trail; a payload supplying `iteration` is rejected naming the field

#### Scenario: T0 recommendation composed from the path template

- **WHEN** `orbit emit review-external --change foo` receives a payload with `prompt_path`
- **THEN** the emit's `next_recommended` is the paste/save/ingest prose naming the prompt path and the expected findings path pattern, and `awaiting_findings` is `true`

#### Scenario: Apply assessment core engine-composed, suffix appended

- **WHEN** `orbit emit apply --change foo` fires at chunk-2 completion with payload `assessment_suffix: "Parser edge cases ran deeper than planned."`
- **THEN** the written `final_assessment` is the engine-composed chunk/counts core followed by the suffix; a payload supplying `final_assessment` itself is rejected naming the field

#### Scenario: Architect recommendation mirrors the handoff

- **WHEN** `orbit emit architect --doc my-program` receives a payload whose `handoff.next_command` names the resume invocation
- **THEN** the emit's spine `next_recommended` equals that handoff value verbatim — mirrored, not re-authored; a payload supplying spine `next_recommended` directly is still rejected naming the field

### Requirement: Atomic next_recommended — pre-computable and post-write classes

`next_recommended` SHALL be composed in one of two engine-owned ways, resolved per command:
(a) PRE-COMPUTABLE — commands whose recommendation derives from the payload or an
already-parsed on-disk source, with no dependence on the emit having landed (review's
findings-dependent pointer from the payload's scorecard, T0's path template, explore's
maturity grid from the parsed staging `explore.md`, archive's stock post-archive prose — an
engine-owned constant, the ARCHITECTURE-SCOPED emits — review `--as architecture`'s
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
recompute runs against an archived change.

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
- **THEN** the emit writes once, complete, to `orbit/changes/archive/2026-08-03-foo/.orbit-runs/archive-<TS>.json` with the engine-composed stock post-archive `next_recommended`; no status recompute runs against the archived change

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
universal-spine checks. Validation failure means NO file, a non-zero exit, the field-naming
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

### Requirement: Per-command computed extensions

The surface SHALL compute the per-command extension fields that are functions of on-disk
state: for `explore` emits — `decisions_captured`, `open_questions_count`, and
`open_questions_with_recommendation` ("n of m") parsed fence-aware from the staging
`explore.md`. The counter grammar: each counter counts TOP-LEVEL list items directly under
the `## Decisions` / `## Open questions` heading (nested bullets, paragraphs, and fenced
content are never entries); a heading absent entirely yields count 0 for that section (`"0 of
0"` for the attestation) plus a single stderr note naming the missing section — the
`explore.md` format (per `orbit-conventions`' format requirement) makes absence a format
violation to surface, never an emit blocker. The
attestation's MEMBERSHIP criterion: an entry counts toward `n` when its content carries a
`Standing recommendation:` line whose value is NOT the literal `none yet` — the attestation
measures RECORDED LEANINGS (the leak-hardening intent), so `none yet` entries and slot-less
entries both fall outside `n`; slot-less entries are audit-drift's format finding, never the
counter's concern.

Also for `explore` emits — FIVE fields computed by the FORM parse of the same file, through the
productions `orbit-conventions` owns (the status header, the Decision entry, the Mechanism entry —
imported from the grammar module per the single-source requirement below, never restated) and
through the engine's ONE CommonMark fence grammar (`createFenceTracker` in `src/core/markdown-fence.ts`,
which the counter also adopts — a local fence scanner is the defect class Q-crc-15 records):
`rules_total` (integer — the LIVE rules, as `orbit-conventions`' Decision-entry requirement defines
membership in the accounting obligation; a live rule is counted whether or not its ID is well-formed),
`rules_open` (an array holding LIVE RULES ONLY — one entry per live rule whose domain is not
ACCOUNTED, `{id?, state, line?}`, `state` exactly one of five DISJOINT values, tested in this order:
`open` (a Decisions entry whose ID is not well-formed per `orbit-conventions`' Decision-entry
requirement — it can be keyed to no Mechanism entry, so its domain is open by construction; `line`
present, `id` absent), `absent` (no Mechanism entry keyed by its ID), `bounded-incomplete` (a BOUNDED
entry missing `Residual kind:` or `Residual method:` — this state takes PRECEDENCE over the grammar's
MALFORMED classification of the same defect, because the more specific name is the actionable one),
`no-closure` (an entry without a `Closure:` line), or `malformed-entry` (any OTHER failure in the
Mechanism grammar's MALFORMED list on that rule's own entry — a bad or empty `Domain:` table, a
missing or duplicated move line, an unknown `Closure:` token, a residual slot on a non-BOUNDED entry —
`line` naming the failing line); the array is ORDERED by the Decisions entries' file order, and its
LENGTH is the maturity rung's K — an open live rule is exactly one entry here and nothing else is),
`key_defects` (an array of defects that are NOT rules with open domains but defects in the KEY space
itself: `{id, kind, line}` — `id` always present, since every kind names a key — with `kind` one of
`orphan` (a Mechanism entry whose ID matches no Decisions entry — `id` the heading's ID, `line` its
line) or `duplicate` (a key claimed twice on EITHER side: a Decisions entry whose ID repeats an earlier
one — the FIRST occurrence in file order owns the key and joins its Mechanism entry; the second is this
defect, `id` the repeated ID, `line` its line, EXCLUDED from `rules_total` — or a second Mechanism
heading carrying an ID an earlier heading already used — the FIRST heading in file order is the
rule's own entry and is judged normally; the second is this defect, `line` its heading's line, and it
is never judged as the rule's entry); ordered
by line; never a member of `rules_open`, never counted in K, reported in its own clause beside every
rung), `residuals` (an array `{id, kind, method}`, one per ACCOUNTED BOUNDED entry, in the Decisions
entries' file order — the residual named beside the rung), and `status` (`{token, date?, re_entry?}`
— `token` is `exploring` or `concluded` per the status-header production and its neither-token rule;
`date` present iff concluded; `re_entry` present iff concluded AND at least one live entry carries a
`Re-entry:` slot, carrying the FIRST such entry's text in file order — when NO live entry carries one
the field is ABSENT and the rendered prose alone carries the fallback; when MORE than one live entry
carries one the first still wins and a stderr note names each further carrier's line, because the
exactly-one-live-slot rule is `orbit-conventions`' AUTHORING obligation and this is the reader's
recovery from a file that breaks it — the decoder reports, it never withholds). The two arrays are DISJOINT by construction: a key defect is never a rule and a rule's own
entry defect is never a key defect, so no file state reaches two clauses of the rung through one entry.

**What the parse adds beyond the owned productions** (stated here once; the Mechanism-side states
are `orbit-conventions`' and the ID well-formedness rule — a first-line prefix match — is
`orbit-conventions`' Decision-entry requirement's, both pointed at, not restated): a `Kind:` or
`Disposition:` line whose value is outside its production does not match, so the slot is ABSENT and
the demanding default applies (a typo cannot escape the obligation). The parse judges FORM ONLY — the
FORM-only clause of `orbit-conventions`' Mechanism-grammar requirement governs what it may and may not
claim — and the form parse SHALL NOT claim more: a file whose every decision is `Kind: fact` yields
`rules_total: 0` and `rules_open: []`, truthfully; a rule never written down is invisible to it. A
missing `## Mechanism` section makes every live rule `absent` and adds ONE stderr note naming the
section, like the counter's; a missing FILE yields `rules_total: 0`, `rules_open: []`,
`key_defects: []`, `residuals: []`, `status: {token: "exploring"}` and the counter's existing
missing-section notes (no additional Mechanism note). Fenced content is never structure — including a
four-backtick fence enclosing a three-backtick example, and a fence indented beyond CommonMark's
three-space limit, both of which the shared tracker resolves and a local scanner did not. A defect of
either array NEVER blocks the emit: the fields record it and the rung reports it.

Also computed: the maturity-grid `next_recommended` (Concluded / Early / Mid / Stalled /
Unaccounted / Accounted per `orbit-run-summary-emit`'s maturity requirement — the grid is engine
data; the header token is read FIRST; K is `rules_open`'s length and key defects render in their own
clause); for `apply` emits —
`tasks_completed`/`tasks_remaining` from checkbox arithmetic, `user_validation_remaining` and
the per-chunk user-validation subset from the payload's `user_validation_tasks` identifier
list (the payload's ONE checkbox judgment — which tasks are user-validation; each named task
is validated to exist and be unchecked, a bad entry rejected naming it; the count itself is
engine-owned and rejected when payload-supplied), `chunk`/`chunk_name`/
`chunk_complete` from the tasks.md chunk-preamble grammar (parsed by the engine —
`chunk_complete` = the current chunk's unchecked tasks minus its user-validation subset, the
whole task set standing in as the "current chunk" when `chunk` is null, per
`orbit-run-summary-emit`'s field semantics; a malformed
preamble degrades per `orbit-run-summary-emit`'s tolerant-on-read rule with the documented
stderr warning), and `files_touched` — the file paths changed since the previous apply
emit's BOUNDARY, engine-computed as `git diff --name-only <base>` against the WORKING TREE:
committed and uncommitted tracked changes both count (the emit is a boundary snapshot, and
sessions routinely reach the boundary before the chunk's commit lands — a committed-only
list would under-report at exactly the moment the field fires; brand-new untracked files
stay invisible until staged, a stated git-visibility limitation). The BOUNDARY is exact,
never timestamp-inferred: at every apply emit the engine captures the tracked working state
as a git TREE OBJECT (`git write-tree` against a temporary index — the `git stash create`
mechanism) and records its OID as the emit's engine-computed `diff_base` field; the next
emit's `<base>` IS the previous emit's recorded `diff_base` tree, so the list is per-chunk
exact under EVERY commit ordering — late-committed prior-chunk work cannot reappear in the
next chunk's list. The FIRST apply emit — and any emit whose predecessor carries no
`diff_base` (pre-capability) or whose recorded tree object is no longer present (gc pruned;
the snapshot is content-addressed and deliberately unreferenced) — falls back to the
change's first commit as its base; `null` only outside a git repository or when no base
resolves at all, never a hand-listed approximation. (The boot render's ACTUAL touchpoints map remains committed-only
`<change-start>..HEAD` per `orbit-orientation` — a durable-truth view computed fresh per
invocation; the two diffs are deliberately different.) Payload attempts to supply any computed
extension are rejected as engine-owned fields.

#### Scenario: Explore counts computed from the file

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with 4 decisions and 2 open questions — one carrying a real leaning, one reading `Standing recommendation: none yet`
- **THEN** the emit carries `decisions_captured: 4`, `open_questions_count: 2`, `open_questions_with_recommendation: "1 of 2"` (the `none yet` entry falls outside `n`), and the Stalled-state recommendation — none supplied by the payload

#### Scenario: Missing section heading counts zero with a format note

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` that lacks a `## Open questions` heading
- **THEN** the emit still writes, carrying `open_questions_count: 0` and `open_questions_with_recommendation: "0 of 0"`, and a single stderr note names the missing section

#### Scenario: Rule fields computed from the form parse

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with six Decisions entries — four `Kind: rule` (one with a SOURCED entry, one with a complete BOUNDED entry, one with a BOUNDED entry missing `Residual method:`, one with no entry), one `Kind: fact`, one `Kind: scope` — and one Mechanism entry `D-foo-9` matching no Decisions entry
- **THEN** the emit carries `rules_total: 4`, `rules_open` with two entries in file order (`{id: "D-foo-3", state: "bounded-incomplete"}`, `{id: "D-foo-4", state: "absent"}`), `key_defects` with one entry (`{id: "D-foo-9", kind: "orphan", line: <its heading's line>}`), `residuals` with one entry naming the complete BOUNDED entry's kind and method, `status: {token: "exploring"}`, and the Unaccounted recommendation reading "2 of 4 live rules have open domains (D-foo-3, D-foo-4); 1 key defect (D-foo-9 at line <n>)" — none supplied by the payload

#### Scenario: A malformed entry on a unique live rule is an open live rule

- **WHEN** a file's only defect is a live rule `D-foo-2` whose Mechanism entry has a `Domain:` table with no member rows
- **THEN** `rules_open` is `[{id: "D-foo-2", state: "malformed-entry", line: <the table's first line>}]`, `key_defects` is `[]`, and the rung reads "1 of R live rules has an open domain (D-foo-2 at line <n>)" — the rule counts in K, because its domain is not accounted

#### Scenario: An orphan alone is a key defect, not an open rule

- **WHEN** a file's only defect is a Mechanism entry `D-foo-9` matching no Decisions entry, every live rule accounted
- **THEN** `rules_open` is `[]`, `key_defects` is `[{id: "D-foo-9", kind: "orphan", line: <n>}]`, and the rung is Accounted with the clause "; 1 key defect (D-foo-9 at line <n>)" appended — the verb does not change on a key defect

#### Scenario: A duplicate ID alone is a key defect

- **WHEN** a file's only defect is two Decisions entries opening with `D-foo-2`, the first's Mechanism entry accounted
- **THEN** `rules_total` counts the first only, `rules_open` is `[]`, `key_defects` is `[{id: "D-foo-2", kind: "duplicate", line: <the second entry's line>}]`, and the rung is Accounted with the key-defect clause

#### Scenario: A duplicate Mechanism heading is a key defect, and the first heading is the rule's entry

- **WHEN** a file's only defect is two Mechanism headings `### D-foo-5 — …`, the first well-formed and SOURCED, the second missing its `Closure:` line
- **THEN** `D-foo-5` is ACCOUNTED (judged on the first heading), `rules_open` is `[]`, and `key_defects` is `[{id: "D-foo-5", kind: "duplicate", line: <the second heading's line>}]` — the second heading is never judged as the rule's entry

#### Scenario: BOUNDED missing a slot takes the specific state

- **WHEN** a live rule's Mechanism entry reads `Closure: BOUNDED` with `Residual kind:` present and `Residual method:` absent
- **THEN** its `rules_open` entry is `{id, state: "bounded-incomplete"}` — never `malformed-entry`, though the grammar's MALFORMED list names the same defect

#### Scenario: ID-less, wrapped and unknown-Kind entries are each named, none dropped

- **WHEN** a Decisions section holds an entry whose first line is `- **Decision:** we will …` (no date, no ID), an entry whose opener `- **2026-09-25 — D-foo-7: a long title` wraps so its closing `**` falls on the second line, and an entry carrying `Kind: banana`
- **THEN** the prefix-less entry appears in `rules_open` as `{state: "open", line: <its first line>}` with no `id` and counts in `rules_total`; the wrapped entry is WELL-FORMED per `orbit-conventions` (`D-foo-7`, counted and joined like any other); and the `Kind: banana` entry is a live rule (the slot did not match, so it is absent and defaults to rule) that owes a Mechanism entry like any other

#### Scenario: A nested fence hides nothing and reveals nothing

- **WHEN** a Decisions section holds a real entry, then a four-backtick fence containing a three-backtick example that itself contains a decoy `- **2026-01-01 — D-foo-8: decoy**` line, then the fence's four-backtick closer, then a second real entry
- **THEN** the decoy is never an entry and the second real entry IS counted — the shared fence tracker closes the outer fence only on its own delimiter; an indented fence beyond three spaces is likewise not a fence

#### Scenario: Concluded with no live Re-entry slot, and with two

- **WHEN** one file's header is `concluded` and no live Decisions entry carries `Re-entry:`, and another's header is `concluded` with TWO live entries carrying it
- **THEN** the first emit's `status` is `{token: "concluded", date: "<date>"}` with `re_entry` ABSENT (the rendered prose carries the fallback); the second's `re_entry` is the first entry's text in file order and a stderr note names the second entry's line

#### Scenario: Concluded status computed from the header and the live entry

- **WHEN** the staging file's first non-blank line is `> **Status**: concluded 2026-09-25.` and its Decisions section holds one live entry carrying `Re-entry: a third withdrawn stage`
- **THEN** the emit carries `status: {token: "concluded", date: "2026-09-25", re_entry: "a third withdrawn stage"}` and the Concluded recommendation

#### Scenario: No Mechanism section is a format note, never a blocker

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with five ID'd decisions and no `## Mechanism` heading
- **THEN** the emit writes, `rules_open` names all five as `absent`, `key_defects` is `[]`, and a single stderr note names the missing section

#### Scenario: Rule fields are engine-owned at the seam

- **WHEN** an explore payload includes `rules_open: []` (or `rules_total`, `key_defects`, `residuals`, or `status`)
- **THEN** the surface exits non-zero with the engine-owned error naming the field — the same sentence a payload `decisions_captured` draws — never the unknown-key error; no file is written

#### Scenario: Apply chunk fields computed from tasks.md

- **WHEN** `orbit emit apply --change foo` runs mid-chunk-2 of a 3-chunk tasks.md, with some chunk work committed and some still uncommitted in the working tree
- **THEN** the chunk fields and checkbox totals are engine-parsed; `files_touched` lists the paths changed since the prior apply emit's recorded `diff_base` boundary — committed and uncommitted tracked changes both included — and this emit records its own fresh `diff_base`; `null` when no base resolves

#### Scenario: First apply emit references the change's first commit

- **WHEN** the first apply emit for a change fires (no previous apply emit carrying `diff_base`) inside a git repository
- **THEN** `files_touched` is computed against the change's first commit as the base — not `null` — and the emit records its own `diff_base` tree for the next boundary

#### Scenario: Late-committed chunk work does not reappear

- **WHEN** chunk 1's emit fires with its work uncommitted (the boundary tree recorded as `diff_base`) and that work is committed only afterward
- **THEN** chunk 2's `files_touched`, diffed from chunk 1's recorded `diff_base` tree, excludes chunk 1's files unless the session touched them again — per-chunk exactness holds under every commit ordering

#### Scenario: User-validation judgment supplied as a verified task list

- **WHEN** `orbit emit apply --change foo` receives payload `user_validation_tasks: ["9.6"]` and task 9.6 exists unchecked in the final chunk
- **THEN** the engine computes `user_validation_remaining: 1` and the final chunk's `chunk_complete` from the per-chunk subset; a payload naming a checked or nonexistent task exits non-zero naming the entry, and a payload supplying `user_validation_remaining` directly is rejected as engine-owned

### Requirement: The explore grammar has one source in code

The three productions `orbit-conventions` owns for `explore.md` — the status header, the Decision entry (ID opener and slot lines), and the Mechanism entry (`Domain:` table, `Closure:` token, residual slots, move lines) — SHALL be carried in code by ONE module, `src/core/explore-grammar.ts`, exporting the productions as the strings the spec fences and the regular expressions that match them. Every engine extension of the grammar SHALL import that module: the form parse this capability computes, the generated-surface test's grammar assertions, and the explore body template, which interpolates the module's strings so that the rendered skill's mirrors are BYTE-IDENTICAL to the pre-module render (the skill's hash pin does not move). A parity test SHALL read the OWNING spec text's three fenced productions — resolving the owner the way the generated-surface mirror test already does: ONE active change's delta holding the block when one exists, the baseline otherwise — and assert the module's strings equal them, so the spec remains the single stated source (R-crc-14), the module is a checked extension of it rather than a second statement, and parity stays enforceable while a later change is mid-flight on a production. Matching rules the spec states in PROSE rather than in a fence (e.g. the `Closure:` token "matched from line start to the first ` — `") have no fenced text to compare and are covered instead by the parse's fixture tests over the two exemplar entries the explore body carries.

#### Scenario: Module and spec agree

- **WHEN** the parity test reads the owning text's fenced status-header, Decision-entry and Mechanism-entry productions (an active delta's block first, `orbit/specs/orbit-conventions/spec.md` otherwise)
- **THEN** each equals the corresponding string the grammar module exports; a divergence fails the test naming the production

#### Scenario: Body interpolation changes no byte

- **WHEN** the explore body template interpolates the module's production strings in place of its literal mirrors
- **THEN** the rendered `orbit-explore` skill is byte-identical to the literal render, and the skill-templates hash pin is unchanged

#### Scenario: The parse and the surface test share one regex

- **WHEN** the form parse and the generated-surface test each match a `Closure:` line
- **THEN** both use the module's exported expression; neither file restates the pattern

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
no metadata, no baseline.

#### Scenario: Render in the same breath

- **WHEN** `orbit emit review --change foo --render` succeeds
- **THEN** stdout carries the written path followed by the engine-rendered report for the just-written pass

#### Scenario: --json is one machine-readable object

- **WHEN** `orbit emit review --change foo --json --render` succeeds
- **THEN** stdout is exactly one JSON object with `path`, `emit`, and `render` keys — no plain-text framing precedes or follows it

#### Scenario: Exactly one file

- **WHEN** any `orbit emit` invocation succeeds
- **THEN** the trail gains exactly one new file and no other file in the project changed

### Requirement: Payload tables agree with their schema references

For every emit command whose per-command schema is documented in a `references/*schema*.md` file (review, address-reviews, audit-drift, archive), a test SHALL derive the AI-supplied field set from that reference — the top-level keys of its schema block minus one explicit, asserted-non-empty list of engine-owned spine and computed fields — and assert that the command's `payloadFields` table accepts every derived field. A field the reference documents as AI-supplied but the table rejects is a failing test, never an archive-time discovery. The engine table remains the definition and the reference remains its mirror; the test makes them agree without changing which is authoritative. The test admits NO exemption: there is no list of tolerated divergences, so a reference that documents a field the table refuses is reconciled before it ships, never pinned. Commands whose payload fields are documented only inline in bodies are outside this requirement. That a documented payload is ACCEPTED is proven by execution, per `Payload schema references are proven by execution` below; this test checks only that the schema block names no field the table refuses.

#### Scenario: A documented conditional field is accepted by the table

- **WHEN** the archive schema reference documents `fingerprint_overridden`, `fingerprints_unverified`, and `audit_skipped_via_flag`
- **THEN** the parity test asserts each is in the archive command's `payloadFields`, and removing any one from the table fails the test naming the field and the reference

#### Scenario: Every full-record block is read

- **WHEN** a schema reference carries more than one JSON block whose top-level keys include `command` (the review reference documents change modes and architecture mode separately)
- **THEN** the parity test unions the blocks' keys before subtraction, so a field documented only in a later block (architecture mode's) is checked against the table like any other

#### Scenario: A new engine-owned key must be declared

- **WHEN** a schema reference gains a top-level key that is engine-composed rather than AI-supplied
- **THEN** the test fails until the key is added to the explicit engine-owned list — a visible edit, never a silent pass

#### Scenario: No divergence is tolerated

- **WHEN** a schema reference documents an AI-supplied field the command's `payloadFields` table does not contain
- **THEN** the parity test fails naming the field and the reference — there is no exemption list through which the field could pass, and adding one is itself a change to this requirement

### Requirement: The review payload carries `blocks`

The `review` command's payload table SHALL admit an OPTIONAL `blocks` field: an array of single-line strings, each naming a lifecycle BLOCK the pass found (per `orbit-conventions`' Severity ladder — a condition that must be addressed before apply and is not a severity) with its location. The write gate enforces the single-line slot on each entry and the array shape; a non-array or a multi-line entry is refused naming the index. The field is pass-through narrative: it is never counted in the scorecard rollup, never read by the gate graph, and absent means no block was found. `references/run-summary-schema.md` names it and the schema-table parity test derives it.

#### Scenario: Blocks accepted and carried

- **WHEN** a review payload carries `"blocks": ["Pass 1: orbit validate fails — specs/x/spec.md:12 scenario has 3 hashtags"]`
- **THEN** the emit writes with the array verbatim; the scorecard rollup check is unchanged by it

#### Scenario: Malformed blocks refused

- **WHEN** `blocks` is not an array, or an entry is not a string, or an entry contains a newline
- **THEN** the surface exits non-zero naming `blocks[<i>]` (or `blocks` for a non-array); no file is written

### Requirement: An internal CRITICAL carries its reproduction at the write gate

`orbit emit review` SHALL refuse a review payload in ANY mode (proposal, system, architecture — the check reads one field of one severity and never reads `mode`) whose `findings[]` holds an entry with `severity: "CRITICAL"` and no non-empty string `reproduction` — absent, non-string, or blank after trimming — exiting non-zero, naming the finding's title and index, writing no file, with empty stdout. On EVERY finding of any severity, a PRESENT `reproduction` that is not a string is refused the same way: the content requirement is CRITICAL's alone, the type requirement is every entry's, so the write gate never persists a record the read-side normalizer (`orbit-report-rendering`) refuses. This is the first gate check that REFUSES on a finding entry's narrative field (the scorecard rollup already reads every entry's `dimension` and `severity`, as a rollup); `validatePayload`'s unknown-KEY check stays at the top level (unknown finding keys remain unchecked, so `recommendation_options`-style forward-compat is untouched), and the new check reads exactly one field of exactly one severity. The engine judges PRESENCE only (R-crc-10): whether the reproduction reproduces is the walk's judgement, per `orbit-address-reviews`. The rule the check enforces is `orbit-conventions`' Severity ladder; this requirement names it and defines nothing of its own.

#### Scenario: CRITICAL without reproduction refused

- **WHEN** a review payload's `findings[]` carries `{ "severity": "CRITICAL", "title": "X", … }` with no `reproduction` key, or `"reproduction": ""`, or `"reproduction": 42`
- **THEN** the surface exits non-zero with `write gate: findings[<i>] 'X' is CRITICAL and carries no reproduction`; no file is written; stdout is empty

#### Scenario: CRITICAL with a multi-line reproduction accepted

- **WHEN** a CRITICAL entry's `reproduction` is a non-empty string containing newlines
- **THEN** the emit writes — the field is not a single-line slot and the single-line helper is not applied to it

#### Scenario: WARNING and SUGGESTION need no reproduction, but a present one must be a string

- **WHEN** a WARNING or SUGGESTION entry carries no `reproduction`
- **THEN** the emit writes; the field is optional below CRITICAL and a present string is passed through verbatim

#### Scenario: A mistyped reproduction is refused at any severity

- **WHEN** a WARNING entry carries `"reproduction": 42`
- **THEN** the surface exits non-zero naming `findings[<i>].reproduction`; no file is written — the gate and the normalizer agree, so no persisted record is unrenderable

#### Scenario: Architecture mode is checked the same way

- **WHEN** `orbit emit review --doc <doc>` composes an architecture-mode summary whose CRITICAL carries no `reproduction`
- **THEN** it is refused exactly as a change-mode payload is — the mode-scoped render exemption is about the normalizer, not this check

#### Scenario: Prior-generation emits are untouched

- **WHEN** the trail holds a review emit written before this requirement whose CRITICAL carries no `reproduction`
- **THEN** every reader (trail, render, gate) accepts it as before — the check runs at write time only and no migration re-grades or rewrites it

### Requirement: The review payload carries `direction`

The `review` command's payload table SHALL admit a `direction` field — an object `{disposition, reasoning}` carrying the reviewer's FORWARD RECOMMENDATION: `disposition` exactly one of the two strings `forward` | `hold`, `reasoning` a non-empty string (multi-line allowed, never a single-line slot) — the reviewer's reasoning, whose CONTENT contract `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` owns; THIS requirement owns the SHAPE, and every other spec names it and re-lists nothing. The write gate enforces PRESENCE BY CLASS and SHAPE AT EVERY CLASS, in ANY mode (`mode` is never read): a payload whose `reviewer_class` is `fresh` or `external` — the gate model's independent classes, by the ONE predicate `orbit-engine-gates`' cadence vocabulary already defines, exported rather than restated — and which carries no `direction` is refused, exiting non-zero naming `direction` and the class, writing no file, with empty stdout; a payload of ANY class whose present `direction` is not an object, whose `disposition` is outside the closed set, or whose `reasoning` is absent, non-string or blank after trimming is refused the same way naming `direction.<key>`; an `in-context` payload without the field writes; a payload whose `reviewer_class` is not one of `in-context` | `fresh` | `external` is refused by this check naming the three values — in every mode, because the architecture-mode write gate validates the class nowhere else and an unrecognised class would otherwise read as not-owed. The `external` × `architecture` cell is never PRODUCED by the `/orbit:review` workflow — `--reviewer external` requires `--as proposal|system` (a clean usage error, per `orbit-review`) — while this gate reads class and never mode, so a hand-composed external × architecture payload on the public emit surface is checked exactly like any other, not refused for its mode. The field is pass-through narrative: never counted in the scorecard rollup, never read by the gate graph, rendered by `orbit-report-rendering` in its own section. Keys inside `direction` beyond the two are CARRIED, never read — the gate checks the two it names and the renderer reads the two it names, so an extra key persists verbatim in the record and reaches no surface (declared here so the openness is a stated fact, not a discovery; the top-level unknown-key rule is the payload table's and does not descend). The engine judges presence and shape only (R-crc-10): whether the direction is RIGHT, and whether its reasoning agrees with its token, is the in-context reaction's and the readiness author's judgement (R-crc-11(f), (g)). The vocabulary is `orbit-run-summary-emit`'s judgement record's (`disposition` + `reasoning`, a kind-specific value set) — adopted, not invented. `references/run-summary-schema.md` names it and the schema-table parity test derives it.

#### Scenario: Independent class without a direction refused

- **WHEN** a review payload carries `"reviewer_class": "fresh"` (or `"external"`) and no `direction` key
- **THEN** the surface exits non-zero with `write gate: review emit of class 'fresh' carries no direction — an independent pass owes its forward recommendation`; no file is written; stdout is empty

#### Scenario: In-context pass without a direction writes

- **WHEN** a review payload carries `"reviewer_class": "in-context"` and no `direction` key
- **THEN** the emit writes exactly as before this requirement — the field is optional on the reacting class

#### Scenario: Well-shaped direction accepted at any class

- **WHEN** a payload of any class carries `"direction": { "disposition": "hold", "reasoning": "the walk-authored mechanism…\n…" }`
- **THEN** the emit writes with the object verbatim; the scorecard rollup check and every gate input are unchanged by it

#### Scenario: Mis-shaped direction refused at any class

- **WHEN** a payload carries `"direction": "forward"`, or `{ "disposition": "ship", "reasoning": "…" }`, or `{ "disposition": "forward" }`, or `{ "disposition": "forward", "reasoning": "" }`, or `{ "disposition": "forward", "reasoning": 42 }`
- **THEN** the surface exits non-zero naming `direction` (or `direction.disposition` / `direction.reasoning`); no file is written — the gate and the renderer's normalizer agree, so no persisted record is unrenderable

#### Scenario: Extra keys inside direction are carried, never read

- **WHEN** a payload carries `"direction": { "disposition": "forward", "reasoning": "ok", "extra": 1 }`
- **THEN** the emit writes the object verbatim, `extra` included, and the report renders the direction from `disposition` and `reasoning` alone — the extra key reaches no surface

#### Scenario: Unrecognised reviewer class refused

- **WHEN** a payload carries `"reviewer_class": "Fresh"` (or `"fressh"`) in any mode
- **THEN** the surface exits non-zero naming `reviewer_class` and the three values; no file is written — the owed check never silently reads a typo as not-owed

#### Scenario: Architecture mode is checked the same way

- **WHEN** `orbit emit review --doc <doc>` composes an architecture-mode summary with `"reviewer_class": "fresh"` and no `direction`
- **THEN** it is refused exactly as a change-mode payload is — the rule keys on class, never on mode

#### Scenario: Prior-generation emits are untouched

- **WHEN** the trail holds a fresh review emit written before this requirement with no `direction`
- **THEN** the trail reader and the gate accept it as before — the check runs at write time only — and the render is unchanged in kind: a D4-generation (renderable) emit renders marked `[no direction]` per `orbit-report-rendering`, by absence, never by date, while a pre-D4 emit still fails as `pre-capability emit` at the existing render boundary, which this requirement does not relax

### Requirement: The review emit records its pass genre and the walks it verifies

The surface SHALL compute, for every `review` emit in every mode, two COMPUTED EXTENSIONS — `pass_genre`, exactly one of the strings `REVIEW` | `VERIFICATION`, and `verified_walks`, an array of address-reviews record tokens — by ONE exported function implementing the pass-genre table that `orbit-conventions`' `Review mode decision framework` OWNS (this requirement names the table and restates none of its rows). The function's inputs are the trail reader's ACCEPTED pass set, its address-reviews records, and the pass's own `reviewer_class`, `mode` and filename token; it reads only records whose tokens precede that token. `verified_walks` is the table's QUALIFYING-WALK set for the pass, in token order — the SAME computation that decides the genre, so for an `in-context` pass in proposal or system mode `verified_walks` is non-empty exactly when `pass_genre` is `VERIFICATION`, and for every other pass `pass_genre` is `REVIEW` and `verified_walks` is `[]`. The set is UNNARROWED: a prior in-context pass does not move the qualifying-walk lower bound, so a second VERIFICATION-genre pass re-lists the walks an earlier one verified, which is how a later walk undoing an earlier fix is caught. A walk's MODE resolves through the accepted pass set: an address-reviews record whose `source_path` names an accepted pass of mode M is a walk of mode M; one whose source names a REJECTED external return, names no pass on the trail, or is null is MODE-LESS and qualifies for no mode. The function lives outside `src/core/artifact-graph/gates.ts`, which carries no diff for it, and the gate graph reads neither field (R-crc-13); `orbit-report-rendering` recomputes the genre at render time through the same function. Both fields are engine-owned and REJECTED when present in the payload, naming the field. Prior-generation emits lack both and stay valid on the trail; the computation runs at write time only.

#### Scenario: The worked trail computes VERIFICATION over two walks

- **WHEN** a system-mode trail holds a `fresh` pass at `03-55-35Z`, an accepted `external` return at `03-57-21Z`, a walk at `04-08-51Z` whose source is the fresh pass, and a walk at `04-12-35Z` whose source is the external return, and an `in-context` system-mode review is emitted after them
- **THEN** the emit carries `pass_genre: "VERIFICATION"` and `verified_walks` naming the two walk tokens in token order

#### Scenario: Independent classes and architecture mode compute REVIEW

- **WHEN** a `fresh` or `external` pass is emitted at any trail position, or any pass is emitted under `--as architecture`
- **THEN** the emit carries `pass_genre: "REVIEW"` and `verified_walks: []`

#### Scenario: A walk of a rejected external return is mode-less

- **WHEN** the only walk after the latest accepted independent pass names, as its `source_path`, an external findings file the trail reader rejected
- **THEN** that walk qualifies for no mode, and an in-context pass after it computes `REVIEW` with `verified_walks: []`

#### Scenario: A second VERIFICATION-genre pass re-lists earlier walks

- **WHEN** an in-context pass has verified walks W1 and W2, a walk W3 resolves its findings, and a further in-context pass of the same mode is emitted with no independent pass in between
- **THEN** the further pass carries `verified_walks` naming W1, W2 and W3

#### Scenario: Payload-supplied genre fields are refused

- **WHEN** a review payload supplies `pass_genre` or `verified_walks`
- **THEN** the surface exits non-zero naming the field as engine-owned; no file is written

### Requirement: A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record

The `review` command's payload table SHALL admit `verification` — an array of objects `{title, file, verdict}`, `title` and `file` non-empty single-line strings, `verdict` exactly one of `landed` | `regressed`, no other key — and each `findings[]` entry SHALL admit an optional `walk_entry` — an object `{title, file}`, both non-empty single-line strings, no other key. THIS requirement owns both shapes and the meaning of the two verdicts; every other spec names it and re-lists nothing.

**The owed set.** An entry of a READABLE address-reviews record named in the emit's computed `verified_walks` OWES a verdict exactly when its disposition is `resolved`, at every severity — `stale`, `deferred` and `escalated` claim no edit and owe nothing. An owed entry is KEYED by the tuple the gate uses for resolution (trimmed, case-sensitive title + repo-relative file, any `:line` suffix stripped — per `orbit-engine-gates`' reviewed-gate resolution), and the payload's `verification[]` and `walk_entry` keys are normalized by the SAME rule before every check below (every refusal prints the normalized form); a key carried `resolved` by ANY walk of `verified_walks` is ONE owed entry, judged against the LATEST walk that carries it `resolved` — a later walk carrying the same key at another disposition (a `stale` call naming the earlier fix) does not lift the obligation, since that earlier edit is exactly what a verification checks; an UNREADABLE record owes nothing (it stays listed in `verified_walks`) — and for this record a walk the trail reader reads is ALSO unreadable when any of its entries normalizes to an empty title or an empty file, because no well-shaped verdict could name that key. `orbit-conventions`' pass-genre table says a verification answers "per resolution"; by this requirement that reads as per OWED (`resolved`) entry.

**The verdicts**, stated once here as a fenced production. An adopter's installed review skill has none of our specs, so the review body carries this fence as a CHECKED MIRROR that says so and names this requirement, held byte-equal by a parity test (R-crc-14's mirror corollary); no other surface restates it:

```
landed — the resolution's edit is PRESENT, COMPLETE across every site the resolution claims, CLEAN (it introduced no defect), and NOT UNDONE by a later edit.
regressed — any of those fails, or the verifying pass cannot decide (an undecidable claim is not a held one); its cause is stated by the finding that names it.
```

**The write gate** refuses, exiting non-zero with no file written and empty stdout, naming what it refuses: a `verification` or `walk_entry` that is mis-shaped, at ANY genre; a payload whose computed `pass_genre` is `VERIFICATION` and which carries no `verification` (naming the field, the owed count and EACH owed key as `walk <token>: (<title>, <file>)`, exactly as the incomplete-record refusal does — this refusal is the channel through which a review body whose metadata probe read REVIEW learns the owed set) — with ZERO owed entries the field is still owed, as `[]`, so a present empty array records that the pass checked and found nothing to grade; a `verification` that omits an owed key (naming EACH missing key as `walk <token>: (<title>, <file>)`, so the refusal itself tells the author the owed set); a verdict whose key is not owed, or a second verdict for one key; a `verification` field in ANY form, `[]` included, on a `REVIEW`-genre pass; a `walk_entry` naming a key carried by no readable record of `verified_walks` (on a `REVIEW`-genre pass every `walk_entry` names nothing); a `walk_entry` naming an owed key whose verdict is `landed`, WHEN every entry carrying that key in `verified_walks` is `resolved` — when a `stale`, `deferred` or `escalated` entry shares the key, the link may concern that entry, so it is accepted whatever the verdict (a DECLARED gap: in that shared-key case a landed-plus-linked contradiction is not refused, and the link rendered beside the finding is what shows it); and a `regressed` verdict that no finding's `walk_entry` names. A `walk_entry` MAY name an entry of ANY disposition — a finding that a walk dismissed a real finding as `stale` links to that entry. A finding WITHOUT `walk_entry` is never refused: on a pass carrying `verification` it renders marked, per `orbit-report-rendering`'s `Verification renders as its own section and its absence is marked`. The engine judges shape, presence, completeness and existence only (R-crc-10): whether a verdict is TRUE, and whether a `walk_entry` is RELEVANT to its finding, are the verifying pass's recorded judgement and the readiness author's to read; the gate graph reads none of it (R-crc-13). `references/run-summary-schema.md` names both fields and the schema-table parity test derives them. Prior-generation emits are untouched: the checks run at write time only.

#### Scenario: Owed record absent is refused

- **WHEN** an in-context system-mode payload computes `pass_genre: "VERIFICATION"` over walks holding nine `resolved` entries and carries no `verification`
- **THEN** the surface exits non-zero naming `verification` and each of the nine owed entries as `walk <token>: (<title>, <file>)`; no file is written

#### Scenario: A complete record writes

- **WHEN** the same payload carries nine verdicts, one per owed key, each `landed` or `regressed`, and every `regressed` key is named by a finding's `walk_entry`
- **THEN** the emit writes with `verification` verbatim beside the computed `pass_genre` and `verified_walks`

#### Scenario: A missing key is named with its walk

- **WHEN** a VERIFICATION-genre payload's `verification` omits one owed entry
- **THEN** the refusal names that entry as `walk <token>: (<title>, <file>)`; no file is written

#### Scenario: Only resolved entries owe a verdict

- **WHEN** a verified walk holds two `resolved` WARNING entries and one `stale` WARNING entry
- **THEN** two verdicts are owed; a verdict for the `stale` entry's key is refused as not owed

#### Scenario: A key in two walks owes one verdict

- **WHEN** two walks of `verified_walks` both carry a `resolved` entry with the same (title, file)
- **THEN** exactly one verdict is owed for that key, judged against the later walk's `resolved` entry; a second verdict for the key is refused

#### Scenario: An unreadable walk owes nothing

- **WHEN** a walk in `verified_walks` is unreadable to the trail reader
- **THEN** it owes no verdict and remains listed in `verified_walks`

#### Scenario: A regressed verdict needs its finding

- **WHEN** a payload's `verification` carries `{title: "T", file: "F", verdict: "regressed"}` and no finding carries `walk_entry: {title: "T", file: "F"}`
- **THEN** the surface exits non-zero naming the unpaired `regressed` key; no file is written

#### Scenario: A finding against a landed entry is a contradiction

- **WHEN** a finding carries `walk_entry` naming a key whose verdict is `landed`, and every entry carrying that key in `verified_walks` is `resolved`
- **THEN** the surface exits non-zero naming the contradiction; no file is written

#### Scenario: A shared key lets a stale finding link beside a landed verdict

- **WHEN** W1 carries (`T`, `F`) `resolved` and its edit holds, a later walk W2 carries (`T`, `F`) `stale` wrongly, and the verifying pass grades (`T`, `F`) `landed` and files a finding with `walk_entry: {title: "T", file: "F"}` about W2's call
- **THEN** the emit writes — the key is shared with a non-`resolved` entry, so the link is accepted whatever the verdict

#### Scenario: A walk with an entry no verdict can name is unreadable for the record

- **WHEN** a walk in `verified_walks` is readable to the trail reader but one of its `resolved` entries carries no `title`
- **THEN** that walk owes no verdict, stays listed in `verified_walks`, and renders as an unreadable row

#### Scenario: A finding may link to a stale entry

- **WHEN** a verifying pass finds that a walk wrongly dismissed a finding as `stale`, and its finding carries `walk_entry` naming that `stale` entry
- **THEN** the emit writes; the stale entry owes no verdict and the link is accepted

#### Scenario: Records and links on a REVIEW-genre pass are refused

- **WHEN** a payload whose computed `pass_genre` is `REVIEW` carries `verification` — `[]` included — or a finding carrying `walk_entry`
- **THEN** the surface exits non-zero naming the field or the unresolvable link; no file is written

#### Scenario: Zero owed entries still owe an empty record

- **WHEN** a payload computes `VERIFICATION` over walks whose entries are all `stale`, `deferred` or `escalated`
- **THEN** a payload without `verification` is refused naming the field and an owed count of 0, and the same payload with `"verification": []` writes

#### Scenario: Payload keys are normalized before matching

- **WHEN** an owed entry is keyed (`T`, `design.md`) and the payload's verdict names `{"title": " T ", "file": "design.md:42"}`
- **THEN** the verdict matches the owed key; a key that still matches nothing after normalization is refused naming its normalized form

#### Scenario: A later stale call does not lift an earlier resolution

- **WHEN** walk W1 carries (`T`, `F`) `resolved` and a later walk W3 of `verified_walks` carries (`T`, `F`) `stale`
- **THEN** (`T`, `F`) is owed, judged against W1's entry

#### Scenario: Mis-shaped verdicts are refused at any genre

- **WHEN** a payload carries `"verification": [{"title": "T", "file": "F", "verdict": "fixed"}]`, or an entry with an extra key, or a `walk_entry` that is a string
- **THEN** the surface exits non-zero naming `verification[<i>].verdict` (or the extra key, or `findings[<i>].walk_entry`); no file is written

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

**Trail seeding.** Where a write-gate check reads the change's trail — today the `judgements` ordering check, which refuses a `formed_against` token that names no accepted independent pass — the test SHALL seed the disposable project's trail, before submission, with ONE minimal independent pass file at every token an example names in a `formed_against` array, and nothing else. Seeding never edits the example; a check that reads trail state no example names is outside what seeding supplies and is named in the residual below.

The schema block remains documentation and may show spine and engine-computed keys, marked as such; the field-set test of `Payload tables agree with their schema references` continues to check that block.

**Named limit.** The round trip is exactly as strong as the write gate's validators. Residual kind: a documented field type or value the write gate does not validate (today most fields of every command; audit-drift's `categories_run`, `findings` and finding `category` are checked by `Audit-drift counts are engine-computed`), a write-gate check reading trail state that no example's `formed_against` names, and the genre-dependent keys exempted above (today `verification`), which no example executes. Residual method: read each command's validators in `emit-composition.ts`; a documented constraint with no validator is outside the round trip and stays a reviewer's claim.

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

- **WHEN** the archive reference's example (info string `json example archived`) carries a `readiness` judgement whose `formed_against` names one pass token
- **THEN** the test creates the archived change directory, writes one minimal independent pass file at that token in its trail, submits the example unchanged, and asserts acceptance

#### Scenario: An unknown scope word fails the test

- **WHEN** an example's info string is `json example archive-dir`
- **THEN** the test fails naming that block's opening line; the example is not submitted

#### Scenario: A schema block without an example fails

- **WHEN** a payload schema reference carries a schema block and no `json example` block
- **THEN** the round-trip test fails naming the reference

### Requirement: Audit-drift counts are engine-computed

The surface SHALL compute audit-drift's two count fields from the payload's `findings` array and SHALL refuse either one in the payload as engine-owned. Because the computation reads them, the write gate SHALL first refuse, naming the field, a payload whose `categories_run` is present and not an array of strings, whose `findings` is present and not an array, or whose finding carries a `category` that is not a non-empty string — a malformed input to the count is refused, never coerced. Then: `findings_total` is the length of `findings` (absent `findings` counts as empty), and `findings_by_category` is an object keyed by category id whose value is the number of findings carrying that `category` — one key for every id in `categories_run` (zero when no finding carries it) and one for every category a finding carries. `stale_suppressed` entries are not findings and are not counted. The `next_recommended` composition `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` owns reads the COMPUTED total, so the findings-versus-clean branch can no longer disagree with the findings the emit records.

#### Scenario: A supplied count is refused

- **WHEN** `orbit emit audit-drift` receives a payload carrying `findings_total`
- **THEN** the write gate refuses it naming the field as engine-owned; no file is written

#### Scenario: Counts computed from findings

- **WHEN** an audit-drift payload carries `categories_run: ["1", "3", "4"]` and two findings, both `category: "3"`
- **THEN** the written emit carries `findings_total: 2` and `findings_by_category: {"1": 0, "3": 2, "4": 0}`, and `next_recommended` takes the findings branch

#### Scenario: A malformed count input is refused, never coerced

- **WHEN** an audit-drift payload carries `categories_run: {"1": true, "3": true}` (the object shape an earlier spec prescribed), or `categories_run: [1, 3]`, or a finding with no `category`
- **THEN** the write gate refuses it naming the field; no file is written

#### Scenario: A finding outside the categories run is still counted

- **WHEN** an audit-drift payload carries `categories_run: ["1"]` and one finding with `category: "4"`
- **THEN** `findings_by_category` is `{"1": 0, "4": 1}` and `findings_total` is `1` — the two counts agree by construction

### Requirement: The walk write gate checks sweep evidence

`orbit emit address-reviews` SHALL refuse, writing nothing, a payload whose `resolutions[]` holds an entry with `outcome: "resolved"` and no `sweep` object, or a `sweep` that does not have exactly the five keys and element shapes `orbit-address-reviews`' `A resolved walk entry records its sweep evidence` owns, or a `sweep` on an entry whose `outcome` is not `resolved`, or an entry that carries the legacy key `status` and no `outcome`: the trail reader's fallback to `status` (`normalizeDisposition` in `src/core/artifact-graph/trail.ts`) exists for logs already on disk, and a new log names its disposition only by `outcome`, so no entry the gate counts as resolved can skip this check. For every resolved entry it SHALL then check the evidence against the files as they are at emit time, the walk's last act:

| check | refused when | the refusal names |
|---|---|---|
| retired | a `retired` string occurs in a file of the entry's CHECK SCOPE that is not a `kept` path | the entry index and title, the string, the path, the 1-based line |
| introduced | an `introduced.text` does not occur in its `path`, or the path resolves to no file | the entry index and title, the path, the text |
| scope | a `sweep.scope` path resolves to no file or directory | the entry index and title, the path |

An entry's CHECK SCOPE, and the one rule by which a PATH from any of these fields resolves, are stated in this fence (an installed skill cannot open this spec, so the review and walk bodies carry it as a CHECKED MIRROR held byte-equal by a parity test):

```
CHECK SCOPE — the union of: on a change-scoped walk, every file under the change directory except its .orbit-runs/ trail; the entry's file; its ripple_cascade.applied paths; its sweep.scope paths, a directory contributing the regular files under it (a symlink met inside a directory is not followed; a path named explicitly is read at its target). Files under .git/, node_modules/, dist/ and build/ are never read, however the path entered the scope; for the change directory's own files those names are read below the change directory.
PATH — strip a trailing :<line> or :<line>:<column> (digits only, at the very end; a path carrying anything after the suffix, such as "design.md:40 (section)", is not stripped, and resolves to nothing); a path beginning orbit/changes/<name>/ for the walk's own change resolves under the change directory, archived or active; otherwise it resolves against the project root, then, on a change-scoped walk and only when nothing exists there, against the change directory.
```

A walk resolved through the archived fallback is change-scoped, its change directory the archive directory. A project- or doc-scoped walk has no change directory. The suffix strip is the trail reader's `stripLineSuffix`, reused so a path and a trail key are normalized by one rule. Every resolved path must stay inside the project root (the surface's containment rule). An entry's `file` or `ripple_cascade.applied` path that resolves to nothing is skipped and named in a stderr warning: those fields predate this check and carry free text. A `sweep` path that resolves to nothing is refused, and a `kept` path that resolves to a directory is refused: a kept element is one file, and exempts that file only. A member of the check scope that cannot be listed, examined or read refuses the emit naming its path: an unread file is not evidence of absence. The checks run on the record as frozen for writing (the surface's materialize-first rule), and `ripple_misses` is counted from that same record.

MATCHING is literal and case-sensitive after every run of whitespace, newlines included, is collapsed to one space, in both the string and the file. A phrase wrapped across lines therefore matches. Named limit: markup that splits a phrase other than whitespace (a blockquote `>` or list marker at a wrapped line's start, emphasis inside the phrase) is not normalized, so such an occurrence is not found. `searched` is never checked: it is a record. Named limit of `--keep-resolved-markers` (a debug flag that leaves resolved `@review:` markers in their files, per `orbit-address-reviews`' `Marker removal invariant`): a retained marker quoting retired wording is found like any other text, so such a walk lists that file under `kept` with the flag as its `why`, which takes the file out of that entry's retired check. Named limit of `kept`: a kept path is excluded from that entry's retired check IN FULL, so a live occurrence elsewhere in the same file is not found either; a walker that keeps a file mixing history and live prose retires a string specific to the live site to keep that site checked.

The check runs at write time only. A walk log on disk is never re-validated by any reader.

#### Scenario: A surviving retired string refuses the log

- **WHEN** an entry retires `"seventeen blocks"` and the change's `proposal.md` still says "seventeen\nblocks" on lines 12–13
- **THEN** the surface exits non-zero naming the entry, `seventeen blocks`, the proposal's path and line 12; no file is written; stdout is empty

#### Scenario: A kept path is not searched

- **WHEN** the same string survives only in the change's `explore.md`, and the entry lists `explore.md` under `kept`
- **THEN** the emit writes

#### Scenario: An introduced text that did not land refuses the log

- **WHEN** an entry introduces `{path: "<change>/design.md", text: "sixteen blocks"}` and `design.md` does not contain it
- **THEN** the surface exits non-zero naming the entry, the path and the text; no file is written

#### Scenario: A resolved entry without sweep is refused

- **WHEN** a payload's resolved entry carries no `sweep`
- **THEN** the surface exits non-zero naming `resolutions[<i>].sweep`; no file is written

#### Scenario: A legacy status key without outcome is refused

- **WHEN** a payload's entry carries `status: "resolved"`, no `outcome` and no `sweep`
- **THEN** the surface exits non-zero naming the entry and `outcome`; no file is written

#### Scenario: A stale entry with a sweep is refused

- **WHEN** an entry with `outcome: "stale"` carries a `sweep`
- **THEN** the surface exits non-zero naming the entry; no file is written

#### Scenario: A free-text ripple path is skipped with a warning

- **WHEN** an entry's `ripple_cascade.applied` holds `".openspec.yaml fingerprint (13th stamp)"`, which resolves to no file
- **THEN** the emit writes and stderr names the unresolved path; the entry's other scope members are still checked

### Requirement: A ripple-miss pointer resolves and is counted

`orbit emit address-reviews` SHALL refuse, writing nothing, a resolution whose `ripple_miss_of` is not an object of exactly the four keys and values `orbit-address-reviews`' `A ripple miss is attributed by the walk that finds it` owns, or that sits on an entry whose `outcome` is not `resolved`, or whose pointer does not resolve: `walk` must be the filename token of an `address-reviews-<token>.json` already in the same trail, earlier than this emit's token, whose `resolutions[]` holds an entry the trail reader reads as resolved (its `outcome`, or the legacy key `status` when `outcome` is absent: the refusal of a `status`-only entry binds the payload being written, never a record already on disk) whose title and file equal the pointer's, both sides compared after the same normalization: the title trimmed, the file through `stripLineSuffix`. The refusal names the entry and the pointer.

The surface SHALL compute `ripple_misses`, the number of this payload's resolutions carrying `ripple_miss_of`, as a computed extension on every address-reviews emit. It is engine-owned: a payload that supplies `ripple_misses` is refused as an unknown key. No reader branches on the count; it is recorded, never targeted (R-crc-11(h)).

#### Scenario: A pointer to a resolved entry of an earlier walk writes

- **WHEN** a payload's resolution carries `ripple_miss_of: {walk: "2026-10-05T01-00-00Z", title: "T", file: "design.md", kind: "scope"}` and `address-reviews-2026-10-05T01-00-00Z.json` in the same trail holds a resolved entry titled `T` on `design.md:40`
- **THEN** the emit writes, carrying `ripple_misses: 1`

#### Scenario: A pointer to a legacy resolved entry writes

- **WHEN** the named earlier walk log's entry carries `status: "resolved"` and no `outcome`, and the pointer's title and file match it
- **THEN** the emit writes: the earlier record is read as the trail reader reads it

#### Scenario: A pointer to nothing is refused

- **WHEN** the named walk log does not exist, or holds no resolved entry with that title and file
- **THEN** the surface exits non-zero naming the entry and the pointer; no file is written

#### Scenario: A pointer on an unresolved entry is refused

- **WHEN** an entry with `outcome: "stale"` carries `ripple_miss_of`
- **THEN** the surface exits non-zero naming the entry; no file is written

#### Scenario: An unknown kind is refused

- **WHEN** `ripple_miss_of.kind` is `"wording"`
- **THEN** the surface exits non-zero naming the three accepted values; no file is written

#### Scenario: A walk with no attribution counts zero

- **WHEN** no resolution carries `ripple_miss_of`
- **THEN** the emit carries `ripple_misses: 0`

