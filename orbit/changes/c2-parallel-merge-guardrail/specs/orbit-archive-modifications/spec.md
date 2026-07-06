## ADDED Requirements

### Requirement: Fingerprint-divergence inflection prompt

The archive workflow SHALL check base fingerprints (`orbit change fingerprint <name> --check
--json`, per `orbit-base-fingerprints`) after the `review-system` gate inflection prompt and
before the pre-archive audit sweep, and prompt on anything not `verified`:

- **Any requirement `diverged`** → fire an inflection prompt (AskUserQuestion) presenting the
  divergence report (requirement names plus the live-vs-would-be-written diff) with exactly three
  options: **Reconcile** (halt the archive; print the guided-manual reconcile instructions per
  `orbit-base-fingerprints`), **Proceed anyway** (re-invoke the archive with
  `--override-fingerprints`; the run summary records the override), or **Abort**.
- **Any requirement `unverified` and none `diverged`** → prompt proceed / abort ("can't verify —
  no base recorded"); proceeding records the unverified requirements in the run summary. The
  engine-level warn alone is not sufficient interactively — a console warning in a `--yes` flow is
  near-silent, and missing fingerprints must not become a silent-loss loophole.
- **All requirements `verified`** (or the change touches no existing requirements) → no prompt.

This prompt is DISTINCT from the `review-system` gate prompt and the audit-drift prompt; all three
MAY fire in one archive invocation (gate first, then fingerprints, then audit).

#### Scenario: Divergence prompt fires with the diff

- **WHEN** the pre-archive fingerprint check reports `diverged` for at least one requirement
- **THEN** the workflow fires the reconcile / proceed-anyway / abort prompt showing which
  requirements diverged and what content the write would drop, and does not proceed without an
  explicit choice

#### Scenario: Proceed-anyway is recorded

- **WHEN** the user chooses proceed-anyway at the divergence prompt
- **THEN** the archive is re-invoked with `--override-fingerprints` and the run summary records
  `fingerprint_overridden` for every diverged requirement

#### Scenario: Unverified-only prompts without the override flag

- **WHEN** the check reports `unverified` requirements and no `diverged` ones, and the user
  chooses to proceed
- **THEN** the archive proceeds WITHOUT `--override-fingerprints` (the engine warn-and-proceed
  path per `orbit-base-fingerprints` covers unverified) and the run summary records
  `fingerprints_unverified`

#### Scenario: Clean check is silent

- **WHEN** every touched requirement reports `verified`
- **THEN** no fingerprint prompt fires and no fingerprint fields appear in the run summary

## MODIFIED Requirements

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
  fingerprint outcome occurred, per this capability's `Archive run summary written` requirement)
  — and covers the field list in this capability's own `Archive run summary written` requirement
