## MODIFIED Requirements

### Requirement: Three invocation modes supported

The system SHALL support three invocation modes: (A) bare — no file; (B) named — `/orbit:explore <name>`; (C) crystallized — bare invocation that becomes named midway.

#### Scenario: Mode A — bare

- **WHEN** `/orbit:explore` is invoked with no argument
- **THEN** the command enters think-mode with no `explore.md` file; no staging directory is created

#### Scenario: Mode B — new named exploration

- **WHEN** `/orbit:explore <name>` is invoked and `orbit/explore/<name>/` does not exist
- **THEN** the command creates the staging directory and writes a stub `explore.md` with the five sections (Premise / Decisions / Open questions / Considered & out / References) AND a minimal `orbit/explore/<name>/.openspec.yaml` metadata file (D-arc Stage D2; same metadata genre as changes — base fields `schema: spec-driven` + `created: <ISO-8601>`, mirroring change metadata so the reused change-metadata helpers' schema validation passes unchanged; both are placeholders superseded at promotion, where propose's merge writes fresh `schema`/`created`/`schema_version` values) — carrying the optional `architecture: {doc, stage}` citation when the exploration serves a declared stage (offered when the name or conversation indicates a stage; omitted otherwise, with zero ceremony for standalone explores); the BEGIN emit fires immediately after scaffold + metadata are written (per `orbit-run-summary-emit`'s begin-emit scenario — D-arc Stage D3); ongoing conversation populates the file

#### Scenario: Mode B — resume

- **WHEN** `/orbit:explore <name>` is invoked and `orbit/explore/<name>/explore.md` already exists
- **THEN** the command reads the existing file for context and resumes the exploration; a pre-D2 staging directory lacking `.openspec.yaml` gains it on resume (add-only, citation still optional)

#### Scenario: Mode C — crystallization prompt

- **WHEN** the user has been exploring in Mode A and the conversation has produced 2 or more substantive decisions
- **THEN** the command prompts the user: "We have enough material here to capture — what should we call this exploration?"

#### Scenario: Definition of "substantive decision"

- **WHEN** the AI is counting decisions toward the crystallization threshold
- **THEN** a decision is counted as substantive if it: (a) resolves between two or more named alternatives (e.g., "go with X instead of Y"), (b) locks a name, structure, or format ("we'll call it Z", "the file will have these sections"), or (c) supersedes an earlier choice ("change our mind on X, go with Y instead"); decisions that don't count: exploratory thinking, speculation, "let me think about X", or restating something already established

#### Scenario: Mode C — user accepts name

- **WHEN** the user provides a name in response to the crystallization prompt
- **THEN** the command creates `orbit/explore/<name>/explore.md` (and the minimal `.openspec.yaml`, as in Mode B), back-fills the Premise and Decisions sections with what's been discussed, THEN fires the BEGIN emit — mode-aware, carrying the back-filled counts and a maturity-consistent recommendation per `orbit-run-summary-emit`'s Mode C begin-emit scenario (NOT Mode B's zero-count shape) — and continues as Mode B

#### Scenario: Mode C — user declines

- **WHEN** the user declines the crystallization prompt
- **THEN** the command continues in Mode A and does not re-prompt for this shape within the conversation
