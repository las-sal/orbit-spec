## MODIFIED Requirements

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

### Requirement: Audit informational, not blocking by default

The system SHALL treat audit-drift findings as informational unless the user explicitly chooses to abort. Audit-drift remains orthogonal to the gate graph (per `orbit-engine-gates` D-c1-9); the `review-system` gate is a separate, also-non-blocking concern that the archive flow surfaces via its own inflection prompt.

#### Scenario: Don't auto-fix

- **WHEN** audit-drift surfaces findings
- **THEN** the archive command does NOT attempt to resolve them automatically; the user's options are surface-prompt-proceed-or-abort

#### Scenario: Don't re-run reviews

- **WHEN** the user invokes archive
- **THEN** the command does NOT automatically invoke `/orbit:review --as system` even if it hasn't run — the user owns review execution. The `review-system` gate (per `orbit-engine-gates`) computes whether system review has converged; when the gate is unpassed or stale, the archive flow fires the inflection prompt (address the gate / proceed anyway / abort) with the canonical next command, and proceeding records `gate_overridden` in the archive run summary. The gate surfaces and records — it never auto-runs review and never hard-blocks the archive.

### Requirement: Archive run summary written

The system SHALL write a JSON summary to `orbit/changes/archive/<YYYY-MM-DD>-<change-name>/.orbit-runs/archive-<TS>.json` after a successful archive (the `<YYYY-MM-DD>-` prefix is added by upstream's archive move step).

#### Scenario: Summary contents

- **WHEN** the archive completes
- **THEN** the JSON includes: command name, timestamp, change name, audit (ran/skipped, findings summary by severity), user_decision (one of: `proceeded_with_no_critical`, `proceeded_despite_critical`, `audit_skipped_via_flag`), sync_specs (capabilities updated, counts of added/modified/removed/renamed)

#### Scenario: Gate override recorded in the summary

- **WHEN** the `review-system` gate is unpassed or stale at archive and the user chooses proceed-anyway at the inflection prompt (per `orbit-engine-gates`' override contract)
- **THEN** the archive run summary additionally includes `gate_overridden: {gate, state, reason}` captured at decision time (e.g. `{gate: "review-system", state: "unpassed", reason: <gate reason>}`); the field is absent when no gate override occurred and REQUIRED when proceed-anyway was chosen. This is distinct from `user_decision`, which records the audit-drift prompt outcome.

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
