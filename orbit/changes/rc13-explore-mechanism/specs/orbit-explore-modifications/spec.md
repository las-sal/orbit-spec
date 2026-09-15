## ADDED Requirements

### Requirement: Six moves applied per rule in the Mechanism section

The system SHALL treat the Mechanism section as the record of EIGHT MOVES applied to each RULE in Decisions. The set is **BOUNDED, not DERIVED** — its members are named and an explicit residual is stated. Each move is a way a mechanism can be wrong:

| part of the mechanism | the way it goes wrong | move |
|---|---|---|
| the facts it cites | the fact is not true | **READ** |
| its input domain | a member it ranges over is unhandled | **ENUMERATE** |
| its own parts | two of them assume incompatible things | **COHERE** |
| its computation | wrong output on a member it does handle | **EXECUTE** |
| its purpose | it is correct and still misses a class of defect | **FALSIFY** |
| its context | it violates a standing ruling | **CONFORM** |
| its resources | it does not terminate, or does not fit | **FEASIBILITY** |
| its output's consumer | the output is correct and the mechanism consuming it breaks | **CONSUME** |

**THE RESIDUAL, stated because BOUNDED requires it**: this set is not closed. It was assembled by classifying two records — one stage's fifteen CRITICALs and another's four — and each classification found members the previous set lacked. FEASIBILITY and CONSUME were found by the second classification, after the six-move set had been ratified. Further classification is expected to find more, and the set SHALL grow when it does; a defect that classifies to no move is a finding about the SET, recorded as such, not an unclassifiable defect. MEDIUM CHOICE — whether a rule belongs in prose or a template slot — is deliberately OUT of the set: it is not a way a mechanism is wrong, and admitting it would make the set range over two different things.

Two of these are EXISTING obligations that nothing enforced at explore time: READ is the read-before-reference discipline, and ENUMERATE is `orbit-conventions`' closure requirement, itself the explore-time form of the decision-table corollary. The stage's contribution is to make them checkable where the mechanism is authored rather than where it is reviewed.

EXECUTE is NOT the primary move and SHALL NOT be treated as sufficient. An executed case demonstrates ONE PATH through a rule; the program's record shows that eleven of one stage's fifteen CRITICALs were READ, ENUMERATE or COHERE failures and ZERO were EXECUTE failures — every executed case ran correctly on the path it walked.

#### Scenario: A rule's Mechanism entry records all six moves

- **WHEN** a RULE is captured in Decisions and its Mechanism entry is written
- **THEN** the entry records that rule's domain as a closed enumeration with its declared closure form, and the DISPOSITION of each move — applied (with what it found), or not applied (with the reason). A disposition of `not executed — <reason>` satisfies EXECUTE; the enumeration and its declared form are the only parts that cannot be dispositioned away, because they are what the maturity signal reads

#### Scenario: An executed case does not substitute for a closed domain

- **WHEN** a rule's Mechanism entry carries an executed case but no closed enumeration of its domain
- **THEN** the rule is not satisfied, because an executed case covers the path it walked and says nothing about the members it did not

### Requirement: Re-entry resumes in place for a promoted name

The system SHALL resume in place when `/orbit:explore <name>` resolves to an ACTIVE CHANGE rather than a staging directory: the exploration continues against `orbit/changes/<name>/explore.md`, and the body SAYS SO. It SHALL NOT scaffold a second staging directory at `orbit/explore/<name>/`.

R-crc-6 routes REDESIGN back to explore, and a change that has been promoted no longer has a staging directory — `/orbit:propose` moved it. Scaffolding a fresh one would put a second `explore.md` beside the authoritative one, which is the second-claim-on-one-truth condition that propose's own metadata merge refuses when it discards the staged `.openspec.yaml`.

#### Scenario: A promoted name resumes against the change directory

- **WHEN** `/orbit:explore <name>` is invoked and `orbit/changes/<name>/explore.md` exists while `orbit/explore/<name>/` does not
- **THEN** the session resumes against the change directory's `explore.md`, states that it is doing so, and creates no staging directory

#### Scenario: An unpromoted name behaves as before

- **WHEN** `/orbit:explore <name>` is invoked and no active change of that name exists
- **THEN** Mode B proceeds unchanged — the staging directory is created or resumed as today

## MODIFIED Requirements

### Requirement: explore.md five-section convention

The system SHALL maintain `orbit/explore/<name>/explore.md` with six sections in fixed order: Premise, **Mechanism**, Decisions, Open questions, Considered & out, References. The Mechanism section carries, per RULE in Decisions, the closed enumeration of that rule's domain and the dispositions of the moves applied to it. Open-question entries carry the `Standing recommendation:` slot per `orbit-conventions`' five-section format (D-arc Stage D5, leak-hardening layer 1): the current leaning verbatim, or the literal `none yet` — a pending leaning discussed in conversation always has a file-resident home.

#### Scenario: Initial stub structure

- **WHEN** a new `explore.md` is created
- **THEN** all six sections are present with empty content under headings; the file includes the status header `> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.`

#### Scenario: Resolving an Open question

- **WHEN** an Open question is resolved during the conversation
- **THEN** the command moves the entry from `Open questions` to `Decisions` with a dated rationale, and acknowledges in chat

#### Scenario: Rejecting a considered option

- **WHEN** an option discussed is explicitly rejected
- **THEN** the command moves it to `Considered & out` with a brief rationale and date

#### Scenario: Capturing an open question with its leaning

- **WHEN** the conversation surfaces an open question with a discussed leaning that is not yet a decision
- **THEN** the captured entry carries `Standing recommendation: <the leaning>`; a question with no leaning yet carries `Standing recommendation: none yet` — never an entry with the slot absent

### Requirement: Three invocation modes supported

The system SHALL support three invocation modes: (A) bare — no file; (B) named — `/orbit:explore <name>`; (C) crystallized — bare invocation that becomes named midway.

#### Scenario: Mode A — bare

- **WHEN** `/orbit:explore` is invoked with no argument
- **THEN** the command enters think-mode with no `explore.md` file; no staging directory is created

#### Scenario: Mode B — new named exploration

- **WHEN** `/orbit:explore <name>` is invoked, `orbit/explore/<name>/` does not exist, AND no active change of that name exists
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

### Requirement: Boundary residency sweep before emits

Before EVERY named-mode explore emit (begin emits excepted — nothing has been discussed yet), the body SHALL run the residency sweep (D-arc Stage D5, leak-hardening layer 2): decisions, leanings, rejections, and citations discussed since the last emit must be file-resident — in Decisions, in the Mechanism section (a rule's domain enumeration, its declared closure form, or a move's disposition), in an open question's `Standing recommendation:` slot, in Considered & out, or in References — BEFORE the emit is invoked ("no emit without sweep"). The sweep rides the EXISTING conversation-boundary emit trigger (per `orbit-run-summary-emit`'s timing semantics) — no new trigger, no new prompt, no user-facing step (the R-d-4 constraint honored at design time). The engine-computed attestation (`open_questions_with_recommendation`, per `orbit-emit-composition`) then reflects the swept file, and `orbit-audit-drift`'s cross-check closes the loop.

#### Scenario: Sweep precedes the boundary emit

- **WHEN** a named-mode explore conversation reaches a boundary with a leaning discussed but not yet captured
- **THEN** the body writes the leaning into the relevant slot (Decision, standing recommendation, Considered & out, or Reference) BEFORE invoking `orbit emit explore` — the emit's engine-computed counts describe the swept file

#### Scenario: Honest ceiling acknowledged

- **WHEN** a leaning was discussed but the session's sweep misses it
- **THEN** no structural layer can recover it (nothing outside the conversation knows what was discussed) — the sweep is an instruction-layer discipline whose VERIFIABLE half is the attestation count; the miss surfaces, if ever, through audit-drift's cross-check or the next session's re-derivation
