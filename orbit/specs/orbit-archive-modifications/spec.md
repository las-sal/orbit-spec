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
  `review-system` gate, per `orbit-engine-gates`' override contract) — and covers the field list
  in this capability's own `Archive run summary written` requirement

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

