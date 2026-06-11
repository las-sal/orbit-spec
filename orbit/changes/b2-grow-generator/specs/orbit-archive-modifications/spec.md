## ADDED Requirements

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
  in that requirement's canonical lifecycle example) — and covers the field list
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
