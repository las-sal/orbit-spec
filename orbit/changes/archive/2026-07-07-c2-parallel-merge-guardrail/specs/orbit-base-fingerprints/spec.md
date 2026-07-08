## ADDED Requirements

### Requirement: `base_fingerprints` change-metadata format

The change metadata schema SHALL accept an optional `base_fingerprints` field
(`ChangeMetadataSchema`, persisted as `.openspec.yaml` in the change directory): a map keyed
capability directory name → requirement name → hash string. Requirement-name keys use the parsed requirement name
exactly as `normalizeRequirementName` yields it. Hash values SHALL carry an algorithm prefix
(`sha256:<lowercase hex>`). The field SHALL round-trip through the metadata read/write helpers
without loss, and metadata files without the field SHALL remain valid (no migration of existing
changes or archives).

#### Scenario: Metadata with fingerprints validates and round-trips

- **WHEN** a change's `.openspec.yaml` contains a `base_fingerprints` map with capability and
  requirement keys and `sha256:`-prefixed values
- **THEN** the metadata parses as valid, and a read-modify-write cycle through the metadata
  helpers preserves the map byte-for-byte semantically (keys, values, and nesting intact)

#### Scenario: Metadata without fingerprints stays valid

- **WHEN** a change's `.openspec.yaml` contains only `{schema, created}` (any pre-C2 change or
  archive), or the change has no `.openspec.yaml` at all (the metadata read returns null)
- **THEN** the metadata layer raises no error and downstream consumers treat every touched
  requirement as having no stored fingerprint

### Requirement: Fingerprint hashing rule

A requirement's fingerprint SHALL be the SHA-256 hash of the requirement block's verbatim `raw`
text as produced by the fence-aware requirements parser (`extractRequirementsSection`), with
line-ending normalization (`\r\n?` → `\n`) as the ONLY transformation. No whitespace collapsing,
case folding, or markdown normalization is applied: any real change to the baseline block — even
cosmetic — is content the delta author did not see and SHALL register as divergence.

#### Scenario: Identical content, different line endings

- **WHEN** the same requirement block is hashed once with LF endings and once with CRLF endings
- **THEN** the two fingerprints are equal

#### Scenario: Cosmetic edit registers as divergence

- **WHEN** the live baseline block differs from the fingerprinted base only by rewording or added
  whitespace inside the block
- **THEN** the recomputed live hash differs from the stored fingerprint and the requirement
  reports `diverged`

### Requirement: Fingerprint stamp and check CLI command

The CLI SHALL provide `orbit fingerprint <change-name>` — a top-level verb-first command (the
`orbit change ...` namespace is deprecated and gains no new subcommands) — with a stamp mode
(default) and a check mode (`--check`), plus `--json` output for workflow consumption.

**Stamp mode** SHALL: parse each delta spec under the change's `specs/`, derive the
touched-requirement set per capability — `RENAMED[].from` ∪ `REMOVED[]` ∪ `MODIFIED[]`, with each
MODIFIED name mapped back through the delta's own RENAMED pairs to its live (FROM) name — read
each touched requirement's current block from the live baseline spec, hash it per the hashing
rule, and write the result into `base_fingerprints` in the change's `.openspec.yaml`. Stamping is
add-missing-only by default: an existing fingerprint SHALL NOT be overwritten unless `--refresh`
is passed. A touched requirement absent from the live baseline SHALL be skipped with a warning
(delta validation owns that error). ADDED requirements are never fingerprinted (they have no base).

**Check mode** SHALL recompute the live hash for every touched requirement and report a
per-requirement status from the closed set: `verified` (stored fingerprint matches live hash, or
the idempotent-write skip applies), `diverged` (stored fingerprint differs from live hash),
`unverified` (touched requirement with no stored fingerprint), `missing` (touched requirement
absent from the live baseline). The idempotent-write skip takes precedence over `unverified`: a
no-fingerprint requirement whose live hash equals the incoming block hash reports `verified`
(the write is a no-op; nothing can be lost). Check mode SHALL NOT modify any file, and SHALL
exit non-zero when any requirement reports `diverged` or `missing` (zero for
verified/unverified-only results).

#### Scenario: Stamp after delta generation

- **WHEN** `orbit fingerprint <name>` runs on a change whose delta specs contain MODIFIED,
  REMOVED, and RENAMED requirements
- **THEN** `.openspec.yaml` gains one fingerprint per touched requirement, keyed by capability and
  live requirement name, hashed from the current baseline blocks

#### Scenario: Re-stamp does not silently overwrite

- **WHEN** `orbit fingerprint <name>` runs again (without `--refresh`) after the baseline
  diverged from a stored fingerprint
- **THEN** the existing fingerprint is left unchanged (the divergence stays detectable) and only
  requirements with no stored fingerprint gain one

#### Scenario: Deliberate refresh

- **WHEN** the user runs `orbit fingerprint <name> --refresh` after hand-editing the delta
  to incorporate divergent live content
- **THEN** every touched requirement's fingerprint is recomputed from the current baseline and
  overwritten

#### Scenario: MODIFIED-after-RENAME maps to the live name

- **WHEN** a delta renames requirement A to B and also carries a MODIFIED block for B
- **THEN** stamp and check read the LIVE baseline block under A (the FROM name) for that
  requirement's fingerprint

#### Scenario: Check reports machine-readable statuses

- **WHEN** `orbit fingerprint <name> --check --json` runs
- **THEN** the output lists every touched requirement with `{capability, requirement, status}`
  from the closed status set, plus `base_hash`/`live_hash` where applicable, and no file is
  modified

### Requirement: Fingerprint capture at every spec-authoring point

Every workflow that generates delta specs SHALL invoke the fingerprint stamp
(`orbit fingerprint <name>`) — `/orbit:propose`, `/orbit:continue` (when it creates
spec artifacts), and `/orbit:ff` — immediately after delta-spec generation completes, so that
MODIFIED/REMOVED/RENAMED requirements are fingerprinted against the baseline the author actually
read.

#### Scenario: Propose stamps fingerprints

- **WHEN** `/orbit:propose` finishes generating a change's delta specs
- **THEN** the workflow runs the fingerprint stamp before reporting completion, and the change's
  `.openspec.yaml` records `base_fingerprints` for every MODIFIED/REMOVED/RENAMED requirement

#### Scenario: Hand-authored delta lacks fingerprints

- **WHEN** a user hand-writes a delta spec without running any stamping workflow or command
- **THEN** nothing fails at authoring time; the touched requirements simply report `unverified`
  at archive-time check (never a silent pass — see the archive guard requirement)

### Requirement: Archive-time divergence guard in the spec-apply engine

Before the spec-apply engine (`buildUpdatedSpec`) mutates a target spec, it SHALL recompute the
live hash of every MODIFIED/REMOVED/RENAMED requirement (using the same FROM-name mapping as
capture) and compare against the change's stored `base_fingerprints`:

- **Diverged, no override**: the engine SHALL refuse — abort the archive before any file is
  written, and print a divergence report naming each diverged requirement with a diff between the
  **current live block** and the **block the delta would write** (deletions in that diff are
  exactly the content the write would destroy).
- **Diverged, explicit override** (`--override-fingerprints` on the archive invocation): the
  engine SHALL proceed with the wholesale replace.
- **Unverified** (no stored fingerprint): the engine SHALL warn ("can't verify — no base
  recorded") and proceed; missing fingerprints never hard-fail (pre-C2 changes, hand-authored
  deltas) and never pass silently.
- **Idempotent write**: when the live block's hash equals the hash of the incoming delta block
  itself, the write cannot destroy content and the requirement SHALL be treated as `verified`
  regardless of the stored fingerprint. REMOVED requirements get no such skip.
- **Missing** (touched requirement absent from the live baseline, e.g. a sibling renamed or
  removed it): the guard SHALL defer to the spec-apply engine's existing not-found hard errors
  (a MODIFIED/REMOVED/RENAMED target absent from the live spec already aborts the archive);
  no new lenient path is introduced.
- **Override visibility**: when the override flag is exercised, the engine SHALL print a notice
  naming each requirement whose divergence was overridden — CLI-direct runs write no run summary,
  so the console notice keeps the deliberate-loss act visible in terminal and CI logs.

Coverage model (two layers): the engine guard covers every path that runs `buildUpdatedSpec` —
the `orbit archive` CLI (including `--yes` non-interactive runs) and any programmatic caller.
The generated archive workflows (`/orbit:archive`, `/orbit:bulk-archive`) apply deltas
agent-driven (via the sync-specs primitive) and move with `mv`, so they never run
`buildUpdatedSpec`; those paths are covered by the mandatory pre-archive fingerprint check step
(per `orbit-archive-modifications`' `Fingerprint-divergence inflection prompt` requirement,
which bulk-archive SHALL apply per change). Neither layer has a silent path.

#### Scenario: Stale snapshot refused

- **WHEN** change B archives with a MODIFIED block fingerprinted against `BASE` while the live
  baseline holds `BASE+A` (a sibling change landed first)
- **THEN** the archive aborts with no files written, and the report shows the live-vs-would-be-
  written diff in which change A's content appears as a deletion

#### Scenario: Explicit override proceeds

- **WHEN** the same archive is re-invoked with `--override-fingerprints`
- **THEN** the replace proceeds (deliberate, recorded loss — the workflow layer records the
  override in the run summary) and the engine prints a console notice naming each overridden
  requirement

#### Scenario: Touched requirement missing from the live baseline

- **WHEN** a fingerprinted requirement no longer exists in the live baseline at archive time (a
  sibling change renamed or removed it)
- **THEN** the archive aborts via the engine's existing not-found error for that
  MODIFIED/REMOVED/RENAMED target; the fingerprint check's `missing` status adds context but
  introduces no path that proceeds silently

#### Scenario: Non-interactive CLI archive cannot clobber silently

- **WHEN** `orbit archive <name> --yes` runs against a diverged requirement without the override
  flag
- **THEN** the archive aborts exactly as in the interactive case

#### Scenario: Agent-driven archive path is covered by the check step

- **WHEN** the generated `/orbit:archive` or `/orbit:bulk-archive` workflow (which applies deltas
  agent-driven rather than through `buildUpdatedSpec`) reaches its pre-archive fingerprint check
  and a requirement reports `diverged`
- **THEN** the workflow fires the divergence inflection prompt (per `orbit-archive-modifications`)
  before any baseline write or archive move; there is no workflow path that syncs or moves past a
  diverged requirement without an explicit recorded decision

#### Scenario: Own delta already applied (idempotent skip)

- **WHEN** a change's MODIFIED content was already applied to the baseline mid-flight (e.g. via
  the sync workflow) so the live block equals the incoming block
- **THEN** the guard reports `verified` and the archive proceeds without prompting

#### Scenario: Matching fingerprints pass clean

- **WHEN** every touched requirement's live hash equals its stored fingerprint
- **THEN** the guard is silent and archive behavior is byte-identical to pre-guard behavior

### Requirement: Guided-manual reconcile flow

When divergence is detected, the reconcile path SHALL be guided-manual (Phase 0): the CLI/workflow
prints the divergence report and instructs the user to (1) hand-edit the change's delta spec to
incorporate the divergent live content, THEN (2) re-stamp via
`orbit fingerprint <name> --refresh`. The instructions SHALL present editing before
re-stamping — a refresh without incorporating the content re-opens the loss hole (the guard checks
hash equality, not semantic incorporation); this residual footgun is accepted for Phase 0 because
it is reachable only after the divergence was shown, and is removed by the deferred Phase-1 3-way
merge.

#### Scenario: Reconcile instructions ordered edit-then-refresh

- **WHEN** the user chooses reconcile at a divergence prompt (or hits the engine refusal directly)
- **THEN** the printed guidance names the diverged requirement(s), shows or references the
  divergence diff, and lists hand-editing the delta BEFORE the `--refresh` re-stamp step

#### Scenario: After a true reconcile the archive passes

- **WHEN** the user incorporates the divergent content into the delta and runs
  `orbit fingerprint <name> --refresh`, then re-invokes archive
- **THEN** the guard reports `verified` for the reconciled requirement and the archive proceeds,
  with the formerly-divergent sibling content preserved in the written baseline
