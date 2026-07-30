## ADDED Requirements

### Requirement: Generic emit surface with a narrative-only payload contract

The system SHALL expose `orbit emit <command> --change <name>` — ONE generic surface for
composing and writing run-summary emits (naming precedent: the verb-first `orbit fingerprint`).
The payload arrives as JSON on stdin or via `--payload <file>` and carries ONLY the
narrative/authored fields for that command (the fields the emitting AI genuinely authors —
e.g. review: `mode`, `reviewer_class`, `depth`, `scorecard`, `findings`, `stale_suppressed`,
`commentary`, `passes_run`, `passes_skipped`; address-reviews: the `source*` fields,
`walk_mode`, `resolutions`, the narrative `final_assessment`). Fields the engine owns
(`command`, `timestamp`, `change`, `kind`, the filename token, and every deterministic fact per
the deterministic-facts requirement) SHALL be REJECTED when present in the payload with a clean
error naming the field — a second voice on a computable fact is refused at the seam, never
silently overwritten. An unknown `<command>` fails with a clean error naming the emittable
command set. The payload SHALL include a `model` key (nullable — the emitting AI's model
identity, or explicit `null` when unknown); a payload missing the key is rejected naming it,
so provenance is always a conscious act.

#### Scenario: Payload carries only authored fields

- **WHEN** `orbit emit review --change foo` receives a payload with `mode`, `reviewer_class`, `depth`, `scorecard`, `findings: []`, and `model`
- **THEN** the engine composes the full emit around those fields and writes it to `orbit/changes/foo/.orbit-runs/review-<mode>-<TS>.json`

#### Scenario: Engine-owned field in the payload is rejected

- **WHEN** a payload includes `timestamp` or `next_recommended`
- **THEN** the surface exits non-zero with a clean error naming the engine-owned field; no file is written

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
filename `<TS>` token is the timestamp with colons replaced by hyphens; when the target path
already exists, the token is bumped forward one second until free (the collision rule bodies
previously taught as prose — engine-owned here, preserving lexical ordering guarantees).

#### Scenario: Collision bumps forward

- **WHEN** an emit composes to a filename that already exists in the trail
- **THEN** the `<TS>` token advances one second at a time until the path is free, and the JSON `timestamp` field matches the final token

#### Scenario: Trail location per command

- **WHEN** `orbit emit explore --change foo` runs for a staging exploration
- **THEN** the file lands in `orbit/explore/foo/.orbit-runs/` (the explore trail); change-scoped commands land in `orbit/changes/<name>/.orbit-runs/`; architecture-scoped commands land in `orbit/architecture/.orbit-runs/`

### Requirement: Deterministic facts are engine-composed per command

Where a capability defines an emit field as a deterministic fact, the surface SHALL compute it
— never accept it from the payload: for review emits, `final_assessment` is the severity-counts
sentence derived from the payload's scorecard (`"X critical, Y warning, Z suggestion."` /
`"No findings."`) and `next_recommended` is the findings-dependent pointer (the
address-reviews `--from-file` invocation naming this emit's own path when findings exist; the
`orbit status --change <name> --report` render pointer when clean) — per
`orbit-report-rendering`'s strict contract, which the write gate enforces; for review-external
T0 emits, `next_recommended` is the multi-step paste/save/ingest recommendation composed from
the prompt path template and `awaiting_findings: true` is engine-set; for explore emits, the
counts and maturity-grid recommendation per the computed-extensions requirement.

#### Scenario: Review counts sentence composed from the payload scorecard

- **WHEN** a review payload's scorecard sums to 1 warning
- **THEN** the written emit's `final_assessment` is `0 critical, 1 warning, 0 suggestion.` and `next_recommended` names this emit's own path in an address-reviews invocation

#### Scenario: T0 recommendation composed from the path template

- **WHEN** `orbit emit review-external --change foo` receives a payload with `prompt_path`
- **THEN** the emit's `next_recommended` is the paste/save/ingest prose naming the prompt path and the expected findings path pattern, and `awaiting_findings` is `true`

### Requirement: Atomic next_recommended — pre-computable and post-write classes

`next_recommended` SHALL be composed in one of two engine-owned ways, resolved per command:
(a) PRE-COMPUTABLE — commands whose recommendation derives from the payload alone (review's
findings-dependent pointer, T0's path template, explore's maturity grid): composed before the
write; (b) POST-WRITE — commands whose recommendation is the engine's canonical `next_command`
AFTER this emit joins the trail (address-reviews, apply, archive): the engine writes the emit
complete except `next_recommended`, recomputes the change status with the just-written file on
disk, stamps the field, and finalizes — one invocation, one consistent file at return. The
emitting AI never performs the write-then-check-then-correct dance; a crash between write and
stamp leaves a spine-incomplete emit that strict downstream readers reject loudly (fail-loud,
never a silently plausible record).

#### Scenario: Post-write stamping matches the engine

- **WHEN** `orbit emit address-reviews --change foo` completes with all findings resolved
- **THEN** the written emit's `next_recommended` equals `orbit status --change foo --json`'s `next_command` computed AFTER the emit landed — byte-identical, by construction

#### Scenario: Pre-computable class writes once

- **WHEN** `orbit emit review --change foo` runs
- **THEN** the file is written exactly once, complete — no transient missing-field state exists for the pre-computable class

### Requirement: Write-gate validation via the shared normalizers

Before ANY write, the composed candidate SHALL pass the same validation the read side uses:
review emits pass `orbit-report-rendering`'s strict internal normalizer (spine semantics,
scorecard/findings cell-rollup equality, single-line slot enforcement, dimension membership);
every kind passes the universal-spine checks. Validation failure means NO file, a non-zero
exit, the field-naming error on stderr, and empty stdout. One validator, two gates: the
fail-loud boundary that D4 placed at render time moves to write time, so a malformed emit is
refused before it becomes a record rather than discovered when rendered.

#### Scenario: Scorecard/findings mismatch refused at write

- **WHEN** a review payload's scorecard shows zero warnings while its findings contain a WARNING entry
- **THEN** `orbit emit review` exits non-zero naming the mismatched cell; no file is written; stdout is empty

#### Scenario: Forged single-line slot refused at write

- **WHEN** a review payload's finding title contains an embedded newline
- **THEN** the surface exits non-zero naming the slot; no file is written

### Requirement: Per-command computed extensions

The surface SHALL compute the per-command extension fields that are functions of on-disk
state: for `explore` emits — `decisions_captured`, `open_questions_count`, and
`open_questions_with_recommendation` ("n of m") parsed fence-aware from the staging
`explore.md`, plus the maturity-grid `next_recommended` (Early / Mid / Mature / Stalled per
`orbit-run-summary-emit`'s maturity requirement — the grid is engine data); for `apply` emits —
`tasks_completed`/`tasks_remaining` from checkbox arithmetic, `chunk`/`chunk_name`/
`chunk_complete` from the tasks.md chunk-preamble grammar (parsed by the engine; a malformed
preamble degrades per `orbit-run-summary-emit`'s tolerant-on-read rule with the documented
stderr warning), and `files_touched` — the file paths changed since the previous apply emit
(engine-computed from the git diff; `null` outside a git repository or when no prior reference
resolves, never a hand-listed approximation). Payload attempts to supply any computed
extension are rejected as engine-owned fields.

#### Scenario: Explore counts computed from the file

- **WHEN** `orbit emit explore --change foo` runs against a staging `explore.md` with 4 decisions and 2 open questions (1 carrying a standing recommendation)
- **THEN** the emit carries `decisions_captured: 4`, `open_questions_count: 2`, `open_questions_with_recommendation: "1 of 2"`, and the Stalled-state recommendation — none supplied by the payload

#### Scenario: Apply chunk fields computed from tasks.md

- **WHEN** `orbit emit apply --change foo` runs mid-chunk-2 of a 3-chunk tasks.md
- **THEN** the chunk fields and checkbox totals are engine-parsed; `files_touched` lists the paths changed since the prior apply emit, or `null` when no diff reference resolves

### Requirement: Output contract and read-only guarantee beyond the emit

On success the surface SHALL print the written path to stdout; `--json` additionally echoes
the complete composed emit; for review emits `--render` additionally prints the engine report
render (the `orbit status --change <name> --report` output) after the write — persist-first
and run-and-paste collapse into one invocation. The surface writes EXACTLY one file (the emit;
plus the internal finalize of the post-write class) and modifies nothing else — no artifact,
no metadata, no baseline.

#### Scenario: Render in the same breath

- **WHEN** `orbit emit review --change foo --render` succeeds
- **THEN** stdout carries the written path followed by the engine-rendered report for the just-written pass

#### Scenario: Exactly one file

- **WHEN** any `orbit emit` invocation succeeds
- **THEN** the trail gains exactly one new file and no other file in the project changed
