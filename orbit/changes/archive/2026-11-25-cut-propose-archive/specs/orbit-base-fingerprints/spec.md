## MODIFIED Requirements

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
The generated archive workflow (`/orbit:archive`) applies deltas
agent-driven (via the sync-specs primitive) and moves with `mv`, so it never runs
`buildUpdatedSpec`; that path is covered by the mandatory pre-archive fingerprint check step
(per `orbit-archive-modifications`' `Fingerprint-divergence inflection prompt` requirement).
Neither layer has a silent path.

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

- **WHEN** the generated `/orbit:archive` workflow (which applies deltas
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
