## ADDED Requirements

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
`passes_run`, `passes_skipped`; address-reviews: the `source*` fields, `walk_mode`,
`resolutions`, the narrative `final_assessment` — its `iteration` is ENGINE-computed, the
count of prior address-reviews emits on the change's trail plus one, rejected when
payload-supplied; the table's per-command rows derive from the
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
whole-repo walk, resolving `orbit/.orbit-runs/` (created if absent) with `change: null` —
every walk persists through the surface, no scope hand-writes its log;
`audit-drift` is dual-scope on the change/PROJECT axis — with `--change` it is
change-scoped, bare it is project-scoped, resolving `orbit/.orbit-runs/` (created if absent)
with `change: null`, and `--doc` on it is a usage error; every other command is
change-scoped-only (`--doc` to it is a clean usage error). Both flags at once is always a
clean usage error, and a bare invocation of any command without a bare scope (everything
except project-scoped `audit-drift`) is a missing-target usage error. A
`--change`/`--doc` value SHALL be a single canonical identifier — a workstream name or doc
filename stem, never a path: separators, traversal segments, and leading dots are a clean
usage error before any resolution (the same contained-identity rule as architecture doc
names), and an existing target directory that physically resolves outside its orbit root
(a symlinked escape) is refused — the surface writes orbit trails ONLY, and no failure path
writes any file. A
`--change`/`--doc` value that resolves to no on-disk workstream (no change directory, no
staging directory, no architecture doc) fails with a clean error naming the path checked; no
file is written. The
filename `<TS>` token is the timestamp with colons replaced by hyphens; when the target path
already exists, the token is bumped forward one second until free (the collision rule bodies
previously taught as prose — engine-owned here, preserving lexical ordering guarantees).
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

- **WHEN** an emit composes to a filename that already exists in the trail
- **THEN** the `<TS>` token advances one second at a time until the path is free, and the JSON `timestamp` field matches the final token

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

#### Scenario: Scorecard/findings mismatch refused at write

- **WHEN** a review payload's scorecard shows zero warnings while its findings contain a WARNING entry
- **THEN** `orbit emit review` exits non-zero naming the mismatched cell; no file is written; stdout is empty

#### Scenario: Forged single-line slot refused at write

- **WHEN** a review payload's finding title contains an embedded newline
- **THEN** the surface exits non-zero naming the slot; no file is written

#### Scenario: Architecture-mode review emit passes the mode-scoped gate

- **WHEN** `orbit emit review --doc my-program` composes an architecture-mode summary (`change: null`, `doc`, `handoff` section) with a valid spine and a rollup-consistent scorecard
- **THEN** the emit writes — the strict internal normalizer (proposal/system-only) is not applied; the universal-spine checks accept `change: null` + `doc`, and a missing or malformed `handoff` section is refused naming the section

### Requirement: Per-command computed extensions

The surface SHALL compute the per-command extension fields that are functions of on-disk
state: for `explore` emits — `decisions_captured`, `open_questions_count`, and
`open_questions_with_recommendation` ("n of m") parsed fence-aware from the staging
`explore.md`. The counter grammar: each counter counts TOP-LEVEL list items directly under
the `## Decisions` / `## Open questions` heading (nested bullets, paragraphs, and fenced
content are never entries); a heading absent entirely yields count 0 for that section (`"0 of
0"` for the attestation) plus a single stderr note naming the missing section — the
five-section format makes absence a format violation to surface, never an emit blocker. The
attestation's MEMBERSHIP criterion: an entry counts toward `n` when its content carries a
`Standing recommendation:` line whose value is NOT the literal `none yet` — the attestation
measures RECORDED LEANINGS (the leak-hardening intent), so `none yet` entries and slot-less
entries both fall outside `n`; slot-less entries are audit-drift's format finding, never the
counter's concern. Also
computed: the maturity-grid `next_recommended` (Early / Mid / Mature / Stalled per
`orbit-run-summary-emit`'s maturity requirement — the grid is engine data); for `apply` emits —
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
