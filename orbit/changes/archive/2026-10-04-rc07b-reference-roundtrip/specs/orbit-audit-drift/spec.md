## MODIFIED Requirements

### Requirement: Internal run summary persisted

The system SHALL write a JSON run summary for **standalone** invocations only, per the emit model owned by `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` requirement: change-scoped standalone (`/orbit:audit-drift <change-name>`) writes to `orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json`; project-wide standalone (`/orbit:audit-drift` with no positional) writes to `orbit/.orbit-runs/audit-drift-<TS>.json` (creating the directory if needed). Non-standalone contexts write NO separate audit-drift JSON: library-call findings (system-mode review Pass 6) are folded into the review report and travel in its `review-system-<TS>.json` emit; pre-archive findings are captured in the archive's `archive-<TS>.json` `audit.*` fields per `orbit-archive-modifications`.

#### Scenario: Change-scoped standalone summary written

- **WHEN** `/orbit:audit-drift <change-name>` completes
- **THEN** a JSON summary is created at `orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json` carrying the payload `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` owns, composed by `orbit emit audit-drift`

#### Scenario: Project-wide standalone summary written

- **WHEN** `/orbit:audit-drift` (no positional) completes
- **THEN** a JSON summary with the same content shape is created at `orbit/.orbit-runs/audit-drift-<TS>.json`

#### Scenario: No separate JSON in library or pre-archive contexts

- **WHEN** audit-drift runs as a library call (review Pass 6) or as the archive pre-sweep
- **THEN** no `audit-drift-<TS>.json` is written; findings travel in the caller's emit (the review's `review-system-<TS>.json`, or the archive's `archive-<TS>.json` `audit.*` fields respectively)
