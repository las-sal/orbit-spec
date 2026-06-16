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
