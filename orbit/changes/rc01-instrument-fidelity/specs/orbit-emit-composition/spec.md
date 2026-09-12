## ADDED Requirements

### Requirement: Payload tables agree with their schema references

For every emit command whose per-command schema is documented in a `references/*schema*.md` file (review, address-reviews, audit-drift, archive), a test SHALL derive the AI-supplied field set from that reference — the top-level keys of its schema block minus one explicit, asserted-non-empty list of engine-owned spine and computed fields — and assert that the command's `payloadFields` table accepts every derived field. A field the reference documents as AI-supplied but the table rejects is a failing test, never an archive-time discovery. The engine table remains the definition and the reference remains its mirror; the test makes them agree without changing which is authoritative. Commands whose payload fields are documented only inline in bodies are outside this requirement (recorded for the artifact-lint stage).

#### Scenario: A documented conditional field is accepted by the table

- **WHEN** the archive schema reference documents `gate_overridden`, `fingerprint_overridden`, `fingerprints_unverified`, and `audit_skipped_via_flag`
- **THEN** the parity test asserts each is in the archive command's `payloadFields`, and removing any one from the table fails the test naming the field and the reference

#### Scenario: Every full-record block is read

- **WHEN** a schema reference carries more than one JSON block whose top-level keys include `command` (the review reference documents change modes and architecture mode separately)
- **THEN** the parity test unions the blocks' keys before subtraction, so a field documented only in a later block (architecture mode's) is checked against the table like any other

#### Scenario: A new engine-owned key must be declared

- **WHEN** a schema reference gains a top-level key that is engine-composed rather than AI-supplied
- **THEN** the test fails until the key is added to the explicit engine-owned list — a visible edit, never a silent pass
