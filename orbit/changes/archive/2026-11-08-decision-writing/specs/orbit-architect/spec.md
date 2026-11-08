## MODIFIED Requirements

### Requirement: Architect workflow available

The system SHALL expose `/orbit:architect [<doc-name>]` as a first-class generated workflow with
the complete command anatomy: a generated skill (`orbit-architect`) plus a thin launcher command
(per the D14 pattern), the execution disciplines block, a run-summary emit, registration in
every generator registry, and installation for all tools (D15 full surface — the addition
grew the generated surface to 16 workflows at D2; 15 post-D5's review-external merge). Invoked with a `<doc-name>`: create `orbit/architecture/
<doc-name>.md` scaffolded in the parseable format (per `orbit-architecture-engine`) if absent, or
resume the existing doc. Invoked bare: list parseable docs via `orbit architecture status` and
prompt selection (offering create-new).

#### Scenario: Create scaffolds the parseable format

- **WHEN** `/orbit:architect my-program` runs and `orbit/architecture/my-program.md` does not exist
- **THEN** the body scaffolds the doc with the parseable structure by construction — status header, Premise/Goals/Rulings/Stages/Status-log skeleton, and at least the stage-heading + slot-line conventions demonstrated — so format correctness never depends on prose memory

#### Scenario: Resume reads the doc as authoritative

- **WHEN** `/orbit:architect my-program` runs and the doc exists
- **THEN** the body reads the doc (and `orbit architecture status` for its computed position) before any edit
