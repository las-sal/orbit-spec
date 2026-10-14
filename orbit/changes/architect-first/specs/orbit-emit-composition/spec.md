## MODIFIED Requirements

### Requirement: Atomic next_recommended — pre-computable and post-write classes

`next_recommended` SHALL be composed in one of two engine-owned ways, resolved per command:
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
directory: when the citation's doc file `orbit/architecture/<doc>.md` exists, it is
`/orbit:architect <doc> — change archived; review stage <stage> and take up the program's next stage, or run /orbit:audit-drift for a project-wide drift check.`;
when there is no citation, the doc file is missing, or the metadata cannot be read, it is
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

- **WHEN** the archived change's metadata carries no `architecture:` citation, or cites a doc whose file no longer exists, or cannot be read
- **THEN** `next_recommended` is `/orbit:architect <name> — change archived; plan the next piece of work, or run /orbit:audit-drift for a project-wide drift check.` and the emit is written
