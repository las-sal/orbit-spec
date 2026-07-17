# orbit-archive-modifications Specification

## Purpose
TBD - created by archiving change relocate-modified-upstream-workflows. Update Purpose after archive.
## Requirements
### Requirement: Upstream archive behavior preserved

The system SHALL preserve upstream `/orbit:archive`'s core behavior: validate the change is ready, run `sync-specs` to merge deltas into baseline, and move the change directory to `orbit/changes/archive/<YYYY-MM-DD>-<name>/`.

#### Scenario: Standard archive flow

- **WHEN** the user invokes `/orbit:archive <change-name>` for an applied change with no orbit-specific intervention
- **THEN** the upstream sequence runs: validation, sync-specs, move-to-archive — exactly as upstream

### Requirement: Pre-archive audit-drift invocation

The system SHALL auto-invoke `/orbit:audit-drift` as a pre-archive sweep before completing the archive operation, unless `--skip-audit` is set.

#### Scenario: Audit runs before archive

- **WHEN** `/orbit:archive <change-name>` is invoked without `--skip-audit`
- **THEN** the command invokes `/orbit:audit-drift` as a library function before any move or sync-specs operation; the audit's findings are presented in the archive output

#### Scenario: `--skip-audit` bypass

- **WHEN** the command runs with `--skip-audit`
- **THEN** Pre-archive audit is skipped; the archive run summary records `audit_skipped_via_flag: true`

### Requirement: Critical-drift prompt, not gate

The system SHALL prompt the user (not block) when audit-drift reports critical findings. This audit-drift prompt is DISTINCT from the `review-system` gate inflection prompt (per `orbit-engine-gates`): the audit prompt concerns drift findings; the gate prompt concerns review convergence. Both are apply-parity prompts — surface-and-record, never hard-block — and both MAY fire in a single archive invocation (the gate prompt first, per the gated-phase contract, then the audit prompt).

#### Scenario: Critical drift detected

- **WHEN** the pre-archive audit reports one or more CRITICAL findings
- **THEN** the command prompts via `AskUserQuestion`: "Address now / Proceed with archive / Abort?" with the audit's full findings shown to inform the choice

#### Scenario: Address now

- **WHEN** the user chooses "Address now"
- **THEN** the archive does not proceed; the user can fix the drift issues and re-invoke the archive command later

#### Scenario: Proceed despite critical

- **WHEN** the user chooses "Proceed with archive" despite critical findings
- **THEN** the archive proceeds normally and the archive run summary records `user_decision: proceeded_despite_critical`

#### Scenario: Abort

- **WHEN** the user chooses "Abort"
- **THEN** the archive is cancelled; no move, no sync-specs, no summary written

#### Scenario: No critical findings

- **WHEN** the pre-archive audit reports no CRITICAL findings
- **THEN** the archive proceeds without prompting FOR DRIFT; warnings (if any) are logged in the archive run summary. "Without prompting" scopes to the audit-drift prompt ONLY — an unpassed or stale `review-system` gate still fires its own inflection prompt (per `orbit-engine-gates`' override contract), independent of the audit result.

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

#### Scenario: Summary contents

- **WHEN** the archive completes
- **THEN** the JSON includes: command name, timestamp, change name, audit (ran/skipped, findings summary by severity), user_decision (one of: `proceeded_with_no_critical`, `proceeded_despite_critical`, `audit_skipped_via_flag`), sync_specs (capabilities updated, counts of added/modified/removed/renamed)

#### Scenario: Gate override recorded in the summary

- **WHEN** the `review-system` gate is unpassed or stale at archive and the user chooses proceed-anyway at the inflection prompt (per `orbit-engine-gates`' override contract)
- **THEN** the archive run summary additionally includes `gate_overridden: {gate, state, reason}` captured at decision time (e.g. `{gate: "review-system", state: "unpassed", reason: <gate reason>}`); the field is absent when no gate override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from `user_decision`, which records the audit-drift prompt outcome.

#### Scenario: Fingerprint override recorded in the summary

- **WHEN** the user chooses proceed-anyway at the fingerprint-divergence inflection prompt (per this capability's `Fingerprint-divergence inflection prompt` requirement)
- **THEN** the archive run summary additionally includes `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` — one entry per diverged requirement, captured at decision time; the field is absent when no fingerprint override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from `gate_overridden` (review-cadence override) and `user_decision` (audit-drift outcome).

#### Scenario: Unverified fingerprints recorded in the summary

- **WHEN** the archive proceeds past requirements whose fingerprint status was `unverified` (no base recorded)
- **THEN** the archive run summary additionally includes `fingerprints_unverified: [{capability, requirement}]` — one entry per unverified requirement; the field is absent when every touched requirement was verified

#### Scenario: Consent recorded in the summary

- **WHEN** the archive completes (post-consent-capability)
- **THEN** the archive run summary includes `consent: "user-invoked" | "prompted"` per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` for a user-typed invocation, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded; there is no third value (a consent abort writes no summary). Distinct from `user_decision` (audit outcome), `gate_overridden` (cadence override), and the fingerprint fields (content guard).

### Requirement: `.orbit-runs/` directory moves with the change

The system SHALL move the change's `.orbit-runs/` directory along with the rest of the change content into the archive.

#### Scenario: Move with the change

- **WHEN** the archive moves `orbit/changes/<name>/` to `orbit/changes/archive/<YYYY-MM-DD>-<name>/`
- **THEN** the `.orbit-runs/` subdirectory is moved as part of the change content; all prior internal-run summaries and external-review findings persist in the archived location at `orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/`

### Requirement: Unresolved marker warning

The system SHALL grep the change directory for unresolved `@review:` markers before completing the archive and warn the user if any are present.

#### Scenario: Unresolved markers detected

- **WHEN** `orbit/changes/<change-name>/` contains one or more `@review:` markers
- **THEN** the command warns: "N unaddressed `@review:` markers will land in archive — convert to `@todo:` or address before archiving?" and offers the user options to convert / address / proceed

#### Scenario: No markers

- **WHEN** the change directory contains no `@review:` markers
- **THEN** the archive proceeds without this warning

### Requirement: Edge cases

The system SHALL handle archive edge cases predictably.

#### Scenario: Already archived

- **WHEN** the user invokes `/orbit:archive <change-name>` for a change already in `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/`
- **THEN** the command halts with a clear error: "Change <name> is already at orbit/changes/archive/<YYYY-MM-DD>-<name>/."

#### Scenario: audit-drift fails to run

- **WHEN** the pre-archive audit fails to execute (parse error, internal exception)
- **THEN** the archive proceeds with a warning; the archive run summary records `audit.ran: false` with the failure reason

### Requirement: Audit informational, not blocking by default

The system SHALL treat audit-drift findings as informational unless the user explicitly chooses to abort. Audit-drift remains orthogonal to the gate graph (per `orbit-engine-gates` D-c1-9); the `review-system` gate is a separate, also-non-blocking concern that the archive flow surfaces via its own inflection prompt.

#### Scenario: Don't auto-fix

- **WHEN** audit-drift surfaces findings
- **THEN** the archive command does NOT attempt to resolve them automatically; the user's options are surface-prompt-proceed-or-abort

#### Scenario: Don't re-run reviews

- **WHEN** the user invokes archive
- **THEN** the command does NOT automatically invoke `/orbit:review --as system` even if it hasn't run — the user owns review execution. The `review-system` gate (per `orbit-engine-gates`) computes whether system review has converged; when the gate is unpassed or stale, the archive flow fires the inflection prompt (address the gate / proceed anyway / abort) with the canonical next command, and proceeding records `gate_overridden` in the archive run summary. The gate surfaces and records — it never auto-runs review and never hard-blocks the archive.

### Requirement: Archive summary schema reference ships with the skill

The generated `orbit-archive-change` skill SHALL include
`references/archive-summary-schema.md` — the full schema for the Step 5.5 archive run-summary
JSON that the skill body already instructs the AI to read when composing the summary. The
content is migrated from the overlay's `openspec-archive-change/references/archive-summary-schema.md`
and **reconciled to the baseline-canonical shape and vocabulary** — the overlay source predates
the B1 baselines and disagrees on shape (four documented points) and carries opsx/openspec-era
residue that path renaming alone does not fix — satisfying the deferral recorded in B1.

#### Scenario: Reference exists after init

- **WHEN** `orbit init` generates the `orbit-archive-change` skill
- **THEN** `<skills-dir>/orbit-archive-change/references/archive-summary-schema.md` exists and
  documents the archive emit's fields: the universal spine plus the five named lifecycle-kind
  extensions (`archive_path`, `audit`, `sync_specs`, `unresolved_markers`, `user_decision`) per
  `orbit-conventions`' `Internal-run JSON summary format` requirement, plus `warnings` (present
  in that requirement's canonical lifecycle example), plus the conditional `gate_overridden`
  field (`{gate, state, reason}`; present only when the user proceeded past an unpassed/stale
  `review-system` gate, per `orbit-engine-gates`' override contract), plus the conditional
  fingerprint fields (`fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]`
  and `fingerprints_unverified: [{capability, requirement}]`; present only when the corresponding
  fingerprint outcome occurred, per this capability's `Archive run summary written` requirement),
  plus the `consent` field (`"user-invoked" | "prompted"`; present on every post-capability
  archive emit, per `orbit-lifecycle-consent`'s emit-field requirement)
  — and covers the field list in this capability's own `Archive run summary written` requirement

#### Scenario: Schema shapes match the baselines, not the overlay source

- **WHEN** the shipped schema is compared against the B1 baselines
- **THEN** it documents `unresolved_markers` as an ARRAY (not the overlay's object), the sync
  delta counts directly under `sync_specs` (not nested under `sync_specs.counts`), exactly the
  three baseline `user_decision` values — no `aborted` (per the baseline, an aborted archive
  writes no summary) — and the flat `audit_skipped_via_flag: true` skip-flag field (not the
  overlay's nested `audit.skipped_via_flag`), matching the baseline and the skill body

#### Scenario: No predecessor-era vocabulary survives

- **WHEN** the shipped reference content is scanned
- **THEN** it contains no `/opsx:` command references, no `openspec/` workspace paths, and no
  `openspec-*` skill names — all command, path, and skill vocabulary is orbit-named

#### Scenario: Body cite resolves

- **WHEN** the archive skill body instructs reading `references/archive-summary-schema.md`
- **THEN** that path resolves within the generated skill directory (the B1-era dangling cite is
  closed)

### Requirement: Fingerprint-divergence inflection prompt

The archive workflow SHALL check base fingerprints (`orbit fingerprint <name> --check
--json`, per `orbit-base-fingerprints`) after the `review-system` gate inflection prompt and
before the pre-archive audit sweep, and prompt on anything not `verified`:

- **Any requirement `diverged`** → fire an inflection prompt (AskUserQuestion) presenting the
  divergence report (requirement names plus the live-vs-would-be-written diff) with exactly three
  options: **Reconcile** (halt the archive; print the guided-manual reconcile instructions per
  `orbit-base-fingerprints`), **Proceed anyway** (continue the archive flow past the check; the
  run summary records the override — the workflow applies deltas agent-driven, so no CLI flag is
  involved; `--override-fingerprints` is the equivalent for CLI-direct `orbit archive` runs), or
  **Abort**. When `unverified` requirements exist alongside diverged ones, the divergence prompt
  SHALL list them too (proceeding records both run-summary fields).
- **Any requirement `unverified` and none `diverged`** → prompt proceed / abort ("can't verify —
  no base recorded"); proceeding records the unverified requirements in the run summary. The
  engine-level warn alone is not sufficient interactively — a console warning in a `--yes` flow is
  near-silent, and missing fingerprints must not become a silent-loss loophole.
- **All requirements `verified`** (or the change touches no existing requirements) → no prompt.

This prompt is DISTINCT from the `review-system` gate prompt and the audit-drift prompt; all three
MAY fire in one archive invocation (gate first, then fingerprints, then audit). The bulk-archive
workflow SHALL run the same check and prompt per change before that change's sync and move steps
(its agent-driven path never runs the engine guard, so the check step is its only guard layer).

#### Scenario: Divergence prompt fires with the diff

- **WHEN** the pre-archive fingerprint check reports `diverged` for at least one requirement
- **THEN** the workflow fires the reconcile / proceed-anyway / abort prompt showing which
  requirements diverged and what content the write would drop, and does not proceed without an
  explicit choice

#### Scenario: Proceed-anyway is recorded

- **WHEN** the user chooses proceed-anyway at the divergence prompt
- **THEN** the archive flow continues past the check and the run summary records
  `fingerprint_overridden` for every diverged requirement, captured at decision time

#### Scenario: Unverified-only proceed is recorded

- **WHEN** the check reports `unverified` requirements and no `diverged` ones, and the user
  chooses to proceed
- **THEN** the archive flow continues normally and the run summary records
  `fingerprints_unverified`

#### Scenario: Clean check is silent

- **WHEN** every touched requirement reports `verified`
- **THEN** no fingerprint prompt fires and no fingerprint fields appear in the run summary

### Requirement: Consent prompt on AI-mediated archive entry

The archive workflow SHALL apply `orbit-lifecycle-consent`'s provenance rule at command entry:
provenance is CLASSIFIED at entry (a fact about the triggering turn), and on AI-mediated arrival
the consent AskUserQuestion fires AFTER read-only discovery (change selection; the read-only look
at the change's `specs/` that supplies the write preview) and BEFORE any of the command's writes
or anomaly prompts (before the Step 3.4 gate prompt — consent asks "should we be here at all";
the anomaly prompts ask "is the state sound"). The prompt content: position readout + what the
archive will write (N deltas across M capabilities synced to baseline, change moved to archive —
Proceed / Abort). A user-typed `/orbit:archive` runs with no consent prompt. Proceeding records
`consent: "prompted"` in the archive run summary; an abort writes no summary. The bulk-archive
workflow applies the same rule per change (a user-typed `/orbit:bulk-archive` whose flow confirms
the batch is user-invoked for the confirmed set).

#### Scenario: AI-mediated entry prompts first

- **WHEN** the archive workflow is reached via delegation/inference (no same-turn user
  invocation)
- **THEN** the consent prompt fires before the gate, fingerprint, and audit steps; Abort leaves
  no writes and no summary

#### Scenario: User-typed entry skips the consent prompt

- **WHEN** the user types `/orbit:archive <name>`
- **THEN** no consent prompt fires; the flow proceeds directly to Step 1.5 onward, and the run
  summary records `consent: "user-invoked"`

### Requirement: Stage line in the archive completion readout

The archive completion output SHALL include a stage line when the archived change's metadata
carries an `architecture:` citation: after the move, render the cited stage's post-archive
computed position from `orbit architecture status` (e.g. `stage d2-architect: now quiescent —
completion is yours to ratify`, or `stage d6-pr-lifecycle: still in-change — <other-change>
remains active`). One line riding the existing position render — no prompt, no doc edit, no new
mechanism (D-arc D-d2-4: the readout is the reminder; ratification happens in an architect
session or by hand, never here). Uncited changes see no stage line.

#### Scenario: Quiescent stage surfaced at archive

- **WHEN** a change citing `{doc, stage}` archives and no other live work cites that stage
- **THEN** the completion readout includes the stage line reporting quiescent-awaiting-ratification (or `complete` if already ratified)

#### Scenario: Uncited change unchanged

- **WHEN** a change without an `architecture:` citation archives
- **THEN** the completion readout contains no stage line and is byte-identical to pre-D2 behavior
