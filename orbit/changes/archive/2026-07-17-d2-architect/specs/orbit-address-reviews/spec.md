## ADDED Requirements

### Requirement: Architecture-scoped resolution logs

The resolution log SHALL land in the architecture trail when the walked findings are
architecture-scoped: when `--from-file` points into `orbit/architecture/.orbit-runs/` (a
`review-architecture-*.json` emit), the resulting `address-reviews-<TS>.json` is written to
`orbit/architecture/.orbit-runs/` (no change positional exists for architecture scope; routing
the log to the project-wide location would split the architecture evidence chain the review
standing depends on — D-arc Stage D2).

#### Scenario: Architecture findings walk emits to the architecture trail

- **WHEN** `/orbit:address-reviews --from-file orbit/architecture/.orbit-runs/review-architecture-<TS>.json` completes its walk
- **THEN** the resolution log lands at `orbit/architecture/.orbit-runs/address-reviews-<TS>.json` with `change: null` and the `doc` carried from the source emit

## MODIFIED Requirements

### Requirement: Ripple cascade by default

The system SHALL automatically apply ripple-affected edits to in-scope files when a finding resolves, unless `--no-cascade` is specified. Ripple-flagged files are always recorded in the resolution log; the difference between default and `--no-cascade` modes is whether the system edits them or merely lists them.

**Cascade scope** (normative — defines which files cascade refuses to edit; everything else ripple-flagged is fair game regardless of file extension):

The cascade IN set is defined by exclusion. The OUT list captures four lifecycle-invariant categories — each entry is OUT for a structural workflow reason, not for a "this might be unsafe" heuristic. Files NOT matching any OUT category are IN, regardless of extension (`.py`, `.swift`, `.c`, `.sh`, `.md`, configs, dotfiles — all eligible if ripple-flagged).

- **OUT — audit trail (all four `.orbit-runs/` locations)**: `orbit/changes/<name>/.orbit-runs/*`, `orbit/.orbit-runs/*`, `orbit/explore/<name>/.orbit-runs/*`, and `orbit/architecture/.orbit-runs/*` (D-arc Stage D2: the architecture trail is the evidence review standing depends on; the explore trail closes the same pre-existing gap). Audit-trail files; editing would corrupt the workflow's own record. NEVER edited by cascade.
- **OUT — baseline specs**: `orbit/specs/<capability>/spec.md`. Baseline mutations flow through the proposal cycle (`/orbit:propose` → delta spec → `/orbit:archive` triggers `sync-specs` to propagate). Cascade refuses direct baseline edits; the appropriate action is to add a delta in the current change's `specs/<capability>/spec.md`.
- **OUT — cross-change directories (active and archived)**: `orbit/changes/<other-name>/*` (other active changes' directories) AND `orbit/changes/archive/*` (any archived change, regardless of date prefix). Change-isolation invariant for active changes; immutable-history invariant for archived changes. Cascade never edits either, even when the current change's ripple-flag set surfaces a path inside one. The corresponding scenario `Cascade respects current-change scope only` documents both cases.
- **OUT — safe-exclusions**: `.git/`, `node_modules/`, `dist/`, `build/`. Universal "never edit anywhere" set.

**Mode invariants**:

- Default mode (cascade on): IN ripples are edited; OUT ripples are recorded in `flagged_not_applied` with a reason naming the OUT category (preserving the v1 ripple-flag audit trail for files cascade refused to touch).
- `--no-cascade` mode: NO ripples are edited regardless of IN/OUT classification; all ripple-flagged files are recorded in `flagged_not_applied` with reason `--no-cascade suppressed`.
- Both modes: cascaded files are recorded in `ripple_cascade.applied`; flagged-not-applied files are recorded in `ripple_cascade.flagged_not_applied`.

**Cascade trusts the ripple-flag analysis**: the cascade step does NOT make independent "should this file be touched?" judgments beyond the four-category OUT check. Its job is to apply the fix to ripple-flagged files in the IN set. The contextual scope judgment ("is this file relevant to my finding?") lives in the earlier ripple-flag step, where the AI derives which files a fix affects. If ripple-flag analysis didn't surface a file, cascade doesn't touch it.

#### Scenario: Cascade applies to in-scope change-dir markdown

- **WHEN** a finding resolves and its ripple-flag set includes `orbit/changes/<name>/design.md` (a change-dir markdown file)
- **THEN** the cascade edits `design.md` consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`

#### Scenario: Cascade applies to non-markdown project files

- **WHEN** a finding resolves and its ripple-flag set includes a non-markdown project file (e.g., `src/handlers.py`, `bin/deploy.sh`, `Dockerfile`, `package.json`, a Swift / Go / C source file, or any dotfile in the project root)
- **THEN** the cascade edits the file consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`. File extension is NOT a discriminator — cascade applies the same pushback + classify + fix lifecycle to any file in the IN set. Pushback discipline + decision-fork prompts handle ambiguous edits regardless of file type.

#### Scenario: Cascade applies to orbit framework files when developing orbit itself

- **WHEN** the current repo IS the orbit framework's source (i.e., orbit develops itself; the change's content includes orbit's own generated skill/command surface — the tool-specific skills and commands directories — README, etc.) AND a finding's ripple-flag set includes one of these files
- **THEN** the cascade edits the file consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`. Orbit's framework files have no special status when they ARE the project being developed — they're in scope because they're not in any OUT category. The mutation-via-delta rule applies only to baseline `orbit/specs/<capability>/spec.md`, not to the framework's behavioral surface (skill prompts, command mirrors, prose docs).

#### Scenario: Cascade skips .orbit-runs/ audit trail

- **WHEN** a finding's ripple-flag set includes any path under `orbit/changes/<name>/.orbit-runs/`, `orbit/.orbit-runs/`, `orbit/explore/<name>/.orbit-runs/`, or `orbit/architecture/.orbit-runs/`
- **THEN** the cascade SKIPS that file (it's audit-trail; editing would corrupt the workflow's own record); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `audit-trail file; cascade skipped by policy`

#### Scenario: Cascade skips baseline orbit/specs/ — guides user to add a delta

- **WHEN** a finding's ripple-flag set includes any path under `orbit/specs/<capability>/`
- **THEN** the cascade SKIPS that file (baseline mutations flow through the proposal cycle, not via direct edits during address-reviews); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `baseline spec; add a delta to your current change's specs/<capability>/spec.md to capture this ripple`. The reason text explicitly guides the user to the correct mutation path (delta operation in the change-dir, which sync-specs propagates at archive).

#### Scenario: Cascade skips safe-exclusion paths

- **WHEN** a finding's ripple-flag set includes any path under exactly one of the four safe-exclusion prefixes: `.git/`, `node_modules/`, `dist/`, `build/`
- **THEN** the cascade SKIPS that file (universal "never edit" set); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `safe-exclusion path; never edited`. Such paths typically should not appear in a ripple-flag set at all — if one does, it's likely a ripple-flag-analysis bug worth surfacing in the resolution log so the user can investigate. The safe-exclusion prefix set is EXACT — implementers MUST NOT extend it ad-hoc to other paths during codegen. Expanding the set requires a spec change to amend this list explicitly; the Option D framing depends on the OUT list being closed and predictable.

#### Scenario: --no-cascade flag suppresses all cascade

- **WHEN** the user invokes `/orbit:address-reviews --no-cascade <scope>` or `/orbit:address-reviews <change-name> --no-cascade`
- **THEN** NO cascade edits are made regardless of file type or scope; ALL ripple-flagged files are recorded under `ripple_cascade.flagged_not_applied`. The resolution log's per-resolution audit-trail entries are identical to v1 list-only behavior — the cascade output is preserved as an audit record without acting.

#### Scenario: Cascade respects current-change scope only

- **WHEN** a finding's ripple-flag set includes a path under another active change (e.g., `orbit/changes/<other-name>/proposal.md`) or a path in the archive
- **THEN** the cascade SKIPS that file (cross-change ripples are explicitly out-of-scope); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `cross-change ripple; cascade scope is current change only`

#### Scenario: Cascade preserves marker-removal invariant

- **WHEN** a finding resolves with cascade-applied ripples in walk-mode
- **THEN** the `@review:` marker on the original finding is removed at the end of the per-finding cycle (per `Marker removal invariant`); cascaded files do NOT carry new markers (cascade is a fix, not a flagging operation)
