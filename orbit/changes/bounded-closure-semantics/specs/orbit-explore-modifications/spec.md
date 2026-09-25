## ADDED Requirements

### Requirement: Nine moves applied per rule in the Mechanism section

The body SHALL treat a rule's Mechanism entry as the record of NINE MOVES applied to that rule, each a way a mechanism can be wrong, written in the entry grammar `orbit-conventions` owns:

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
| its trigger | it is correct, complete, and nothing ever causes it to run | **INVOKE** |

**The set is BOUNDED, declared in its own slots.** Residual kind: a further way a mechanism is wrong that none of the nine names. Residual method: classifying another record's CRITICALs against the table — the only method that has ever grown it (five to six on rc03a's record; six to eight on rc02's; eight to nine when a review pass found INVOKE in the first attempt's own evidence). Confidence about closure was wrong three times and every correction came from a record, never from further thought.

**How the set grows.** A defect that classifies to NO move is a finding about the SET, recorded as an `@review:` marker in the exploration that found it AND carried into that change's review emit as a finding against this requirement. Growing the set is a change to this requirement; nothing grows it silently.

**The boundary test**, because a dismissal branch with no test is an invitation: a candidate is IN when it names a way the mechanism ITSELF fails — its facts, domain, parts, computation, purpose, context, RESOURCES, consumer, or trigger (the vocabulary is the table's rows, all nine). A candidate is OUT when it concerns how the rule is PRESENTED or AUTHORED — medium choice (prose versus a slot) is the standing example. When the test does not decide, the candidate is IN: over-covering costs one disposition line, under-covering costs a review cycle.

READ is the read-before-reference discipline and ENUMERATE is the accounting obligation, both existing rulings made checkable where mechanism is AUTHORED. EXECUTE is NOT sufficient alone: an executed case demonstrates one path, and eleven of one stage's fifteen CRITICALs were READ, ENUMERATE or COHERE failures with zero EXECUTE failures.

The shipped body carries ONE conforming exemplar entry (this change's D-bcs-3), so the convention shows its shape rather than describing it.

#### Scenario: A rule's entry records all nine moves

- **WHEN** a live rule's Mechanism entry is written
- **THEN** it carries the `Domain:` table, the `Closure:` token (with both residual slots iff BOUNDED), and nine move lines each `applied — <what it found>` or `not applied — <reason>`, per the grammar

#### Scenario: A defect that fits no move grows the set through the trail

- **WHEN** a walk or review classifies a defect and no move names its failure mode
- **THEN** an `@review:` marker is left in the exploration and the finding is recorded against this requirement in the review emit; the table is edited only by a change to this requirement

#### Scenario: The exemplar conforms

- **WHEN** the explore body is generated
- **THEN** its exemplar entry's lines match the grammar's productions — the generated-surface test asserts it, and the maturity-signal stage parses the same exemplar as a fixture

### Requirement: Re-entry resolution and the conclude verb

`/orbit:explore <name>` SHALL resolve the name against three facts — a staging directory exists; it is concluded (defined only when it exists); an active change of that name exists — as ONE table, six cells, two refused:

| staging dir | concluded | active change | resolution |
|---|---|---|---|
| no | — | no | Mode B new |
| yes | no | no | Mode B resume |
| yes | yes | no | state the conclusion and its `Re-entry:` trigger; REOPEN only on the user's word |
| no | — | yes | resume IN PLACE against `orbit/changes/<name>/explore.md`, say so, scaffold nothing |
| yes | either | yes | REFUSED — second claim on one truth; name both paths and stop |

An active change WITHOUT an `explore.md` is Mode B new IN the change directory (the file is created beside the artifacts; no staging directory is scaffolded).

**The conclude verb** runs inside a named session on the user's declared word, in this order: the residency sweep; the CONCLUDED entry with its `Re-entry:` slot; the header token; the citation key; THEN the final boundary emit (whose `final_assessment` states the conclusion in the author's words). The emit is composed from the concluded file, so the maturity-signal stage's rung reads it as concluded. Reopening is the inverse edit plus a dated entry saying why, then a boundary emit. The body never concludes on its own judgement: it recommends, and writes on the user's word (the arc's rules of engagement; `orbit-lifecycle-consent`).

#### Scenario: A promoted name resumes against the change directory

- **WHEN** `/orbit:explore <name>` is invoked and `orbit/changes/<name>/explore.md` exists while `orbit/explore/<name>/` does not
- **THEN** the session resumes against the change directory's `explore.md`, states that it is doing so, and creates no staging directory

#### Scenario: Both a staging directory and an active change exist

- **WHEN** `/orbit:explore <name>` is invoked and both `orbit/explore/<name>/` and `orbit/changes/<name>/` exist
- **THEN** the command refuses, names both paths, and stops — it neither resumes nor scaffolds

#### Scenario: A concluded name is re-entered

- **WHEN** `/orbit:explore <name>` resolves to a staging directory whose header token is `concluded`
- **THEN** the body states the conclusion and its `Re-entry:` trigger and asks nothing else; only the user's explicit word reopens it, by the inverse edit, a dated entry, and a boundary emit

#### Scenario: The user concludes

- **WHEN** the user declares, in a named session, that nothing will be built
- **THEN** the body sweeps, writes the CONCLUDED entry, flips the header, annotates the citation, and fires the boundary emit — in that order — and leaves the directory where it is

## MODIFIED Requirements

### Requirement: explore.md five-section convention

The system SHALL maintain `orbit/explore/<name>/explore.md` in the format `orbit-conventions` owns — SIX sections in fixed order (Premise, **Mechanism**, Decisions, Open questions, Considered & out, References), the Decisions entry slots, the Mechanism entry grammar, and the two status tokens — and this requirement NAMES that format rather than restating it (R-crc-14). (The TITLE is retained for delta identity; the format is six sections.) Open-question entries carry the `Standing recommendation:` slot per that format (D-arc Stage D5, leak-hardening layer 1): the current leaning verbatim, or the literal `none yet` — a pending leaning discussed in conversation always has a file-resident home.

#### Scenario: Initial stub structure

- **WHEN** a new `explore.md` is created
- **THEN** all six sections are present with empty content under headings; the file includes the status header `> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.`

#### Scenario: Resolving an Open question

- **WHEN** an Open question is resolved during the conversation
- **THEN** the command moves the entry from `Open questions` to `Decisions` with a dated rationale — as an entry with an ID opener and its `Kind:` — and acknowledges in chat

#### Scenario: Rejecting a considered option

- **WHEN** an option discussed is explicitly rejected
- **THEN** the command moves it to `Considered & out` with a brief rationale and date

#### Scenario: Capturing an open question with its leaning

- **WHEN** the conversation surfaces an open question with a discussed leaning that is not yet a decision
- **THEN** the captured entry carries `Standing recommendation: <the leaning>`; a question with no leaning yet carries `Standing recommendation: none yet` — never an entry with the slot absent

#### Scenario: A rule gets its Mechanism entry when it is captured

- **WHEN** a Decision that is a rule (per `orbit-conventions`' entry classification) is captured in a named exploration
- **THEN** the body writes its Mechanism entry in the same sitting — domain table, closure token, residual slots iff BOUNDED, nine move lines — or leaves the entry with `Kind: rule` and no Mechanism entry as a VISIBLE open domain rather than downgrading the Kind to escape it

### Requirement: Three invocation modes supported

The system SHALL support three invocation modes: (A) bare — no file; (B) named — `/orbit:explore <name>`; (C) crystallized — bare invocation that becomes named midway. Name resolution in mode B follows the re-entry table (per the re-entry requirement); the scenarios below state Mode B's two ordinary cells and point to that table for the rest.

#### Scenario: Mode A — bare

- **WHEN** `/orbit:explore` is invoked with no argument
- **THEN** the command enters think-mode with no `explore.md` file; no staging directory is created

#### Scenario: Mode B — new named exploration

- **WHEN** `/orbit:explore <name>` is invoked, `orbit/explore/<name>/` does not exist, AND no active change of that name exists
- **THEN** the command creates the staging directory and writes a stub `explore.md` with the six sections (Premise / Mechanism / Decisions / Open questions / Considered & out / References) AND a minimal `orbit/explore/<name>/.openspec.yaml` metadata file (D-arc Stage D2; same metadata genre as changes — base fields `schema: spec-driven` + `created: <ISO-8601>`, mirroring change metadata so the reused change-metadata helpers' schema validation passes unchanged; both are placeholders superseded at promotion, where propose's merge writes fresh `schema`/`created`/`schema_version` values) — carrying the optional `architecture: {doc, stage}` citation when the exploration serves a declared stage (offered when the name or conversation indicates a stage; omitted otherwise, with zero ceremony for standalone explores); the BEGIN emit fires immediately after scaffold + metadata are written (per `orbit-run-summary-emit`'s begin-emit scenario — D-arc Stage D3); ongoing conversation populates the file

#### Scenario: Mode B — resume

- **WHEN** `/orbit:explore <name>` is invoked, `orbit/explore/<name>/explore.md` exists with the `exploring` status token, AND no active change of that name exists
- **THEN** the command reads the existing file for context and resumes the exploration; a pre-D2 staging directory lacking `.openspec.yaml` gains it on resume (add-only, citation still optional); a file lacking a Mechanism section gains one (add-only)

#### Scenario: Mode B — other cells

- **WHEN** `/orbit:explore <name>` resolves to a concluded staging directory, an active change, or both a staging directory and an active change
- **THEN** the re-entry table governs — re-entry stated, resume in place, or refusal naming both paths

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

Before EVERY named-mode explore emit (begin emits excepted — nothing has been discussed yet), the body SHALL run the residency sweep (D-arc Stage D5, leak-hardening layer 2): decisions, leanings, rejections, and citations discussed since the last emit must be file-resident — in Decisions (with the entry's ID opener and `Kind:`), in the Mechanism section (a rule's domain table, its closure token and residual slots, or a move's disposition), in an open question's `Standing recommendation:` slot, in Considered & out, or in References — BEFORE the emit is invoked ("no emit without sweep"). The sweep rides the EXISTING conversation-boundary emit trigger (per `orbit-run-summary-emit`'s timing semantics) — no new trigger, no new prompt, no user-facing step (the R-d-4 constraint honored at design time). The engine-computed attestation (`open_questions_with_recommendation`, per `orbit-emit-composition`) then reflects the swept file, and `orbit-audit-drift`'s cross-check closes the loop.

#### Scenario: Sweep precedes the boundary emit

- **WHEN** a named-mode explore conversation reaches a boundary with a leaning discussed but not yet captured
- **THEN** the body writes the leaning into the relevant slot (Decision, Mechanism entry, standing recommendation, Considered & out, or Reference) BEFORE invoking `orbit emit explore` — the emit's engine-computed counts describe the swept file

#### Scenario: A rule discussed to a domain is swept into its Mechanism entry

- **WHEN** a rule's domain, closure or a move disposition was settled in conversation and its Mechanism entry does not yet carry it
- **THEN** the body writes it into the entry before the emit; a rule left with no entry is a visible open domain, never a downgraded `Kind:`

#### Scenario: Honest ceiling acknowledged

- **WHEN** a leaning was discussed but the session's sweep misses it
- **THEN** no structural layer can recover it (nothing outside the conversation knows what was discussed) — the sweep is an instruction-layer discipline whose VERIFIABLE half is the attestation count; the miss surfaces, if ever, through audit-drift's cross-check or the next session's re-derivation
