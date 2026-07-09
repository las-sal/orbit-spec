## ADDED Requirements

### Requirement: Consent prompt on AI-mediated archive entry

The archive workflow SHALL apply `orbit-lifecycle-consent`'s provenance rule at command entry,
BEFORE any other step (before the Step 3.4 gate prompt — consent asks "should we be here at all";
the anomaly prompts ask "is the state sound"): when the archive is reached without an explicit
same-turn user invocation, fire the consent AskUserQuestion (position readout + what the archive
will write: N deltas across M capabilities synced to baseline, change moved to archive —
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

#### Scenario: Consent recorded in the summary

- **WHEN** the archive completes (post-consent-capability)
- **THEN** the archive run summary includes `consent: "user-invoked" | "prompted"` per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` for a user-typed invocation, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded; there is no third value (a consent abort writes no summary). Distinct from `user_decision` (audit outcome), `gate_overridden` (cadence override), and the fingerprint fields (content guard).

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
