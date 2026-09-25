# orbit-explore-modifications Specification

## Purpose
TBD - created by archiving change relocate-modified-upstream-workflows. Update Purpose after archive.
## Requirements
### Requirement: Upstream explore stance preserved

The system SHALL preserve upstream `/orbit:explore`'s "stance, not workflow" character — thinking-partner mode, no fixed steps, no mandatory outputs, no implementation.

#### Scenario: Bare invocation

- **WHEN** the user invokes `/orbit:explore` with no argument and no orbit-specific capture trigger fires
- **THEN** the command behaves exactly as upstream: conversational think-mode, no file created

#### Scenario: Implementation guardrail preserved

- **WHEN** the user asks the command to implement code or apply features
- **THEN** the command refuses and reminds the user to exit explore mode (same as upstream)

### Requirement: Three invocation modes supported

The system SHALL support three invocation modes: (A) bare — no file; (B) named — `/orbit:explore <name>`; (C) crystallized — bare invocation that becomes named midway. Name resolution in mode B follows the re-entry table (per the re-entry requirement); the scenarios below state Mode B's two ordinary cells and point to that table for the rest.

#### Scenario: Mode A — bare

- **WHEN** `/orbit:explore` is invoked with no argument
- **THEN** the command enters think-mode with no `explore.md` file; no staging directory is created

#### Scenario: Mode B — new named exploration

- **WHEN** `/orbit:explore <name>` is invoked, `orbit/explore/<name>/` does not exist, AND no active change of that name exists
- **THEN** the command creates the staging directory and writes a stub `explore.md` with the six sections in the order `orbit-conventions`' format requirement states AND a minimal `orbit/explore/<name>/.openspec.yaml` metadata file (D-arc Stage D2; same metadata genre as changes — base fields `schema: spec-driven` + `created: <ISO-8601>`, mirroring change metadata so the reused change-metadata helpers' schema validation passes unchanged; both are placeholders superseded at promotion, where propose's merge writes fresh `schema`/`created`/`schema_version` values) — carrying the optional `architecture: {doc, stage}` citation when the exploration serves a declared stage (offered when the name or conversation indicates a stage; omitted otherwise, with zero ceremony for standalone explores); the BEGIN emit fires immediately after scaffold + metadata are written (per `orbit-run-summary-emit`'s begin-emit scenario — D-arc Stage D3); ongoing conversation populates the file

#### Scenario: Mode B — resume

- **WHEN** `/orbit:explore <name>` is invoked, `orbit/explore/<name>/explore.md` exists with the `exploring` status token, AND no active change of that name exists
- **THEN** the command reads the existing file for context and resumes the exploration; a pre-D2 staging directory lacking `.openspec.yaml` gains it on resume (add-only, citation still optional); a file lacking a Mechanism section gains one (add-only)

#### Scenario: Mode B — other cells

- **WHEN** `/orbit:explore <name>` resolves to any cell other than the two above — a concluded staging directory, an active change with or without `explore.md`, both a staging directory and an active change, or a concluded header inside the change directory
- **THEN** the re-entry table and its edge paragraph govern (per the re-entry requirement); this scenario names no outcome of its own

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

### Requirement: Five capture types with capture triggers

The system SHALL recognize capture-worthy content in the conversation and offer to write it to the appropriate file. Five capture types: conventions, perspectives, critical paths, decisions, references.

#### Scenario: Convention capture

- **WHEN** the user says something that reads as a durable convention (e.g., "we always do X", "X should be named Y", "let's standardize on…")
- **THEN** the command offers to capture it in a topic-specific convention file at project root (e.g., `naming_convention.md`); on accept, the file is created or appended; on decline, the command continues

#### Scenario: Convention capture uses the structured format

- **WHEN** a convention capture is accepted and the AI writes to `<topic>_convention.md`
- **THEN** the file follows the four-section structured format defined in orbit-conventions (Purpose / Rules / Examples / Exceptions); when creating a new file, all sections are scaffolded; when appending to an existing file, the new rule is added to the appropriate section (typically Rules)

#### Scenario: Convention update offered on contradiction

- **WHEN** the user's statement contradicts an existing rule in a `*_convention.md` file
- **THEN** the command surfaces the contradiction and offers to update the convention rather than silently overwriting; user decides whether to update, supersede, or leave the existing rule in place

#### Scenario: Heuristic for new file vs. append

- **WHEN** a convention capture matches the topic of an existing file (e.g., user mentions naming and `naming_convention.md` exists)
- **THEN** the offer targets the existing file; only when no matching topic file exists is a new file proposed

#### Scenario: Perspective capture

- **WHEN** the user describes a caller or client of the system (e.g., "Claude Desktop calls our MCP server", "from the Swift host's POV")
- **THEN** the command offers to capture it in `orbit/lenses/perspectives.md` with the structured entry shape (Surfaces, Description, Typical call patterns)

#### Scenario: Critical-path capture

- **WHEN** the user describes a critical user flow (e.g., "the typical user flow is...", "users typically...")
- **THEN** the command offers to capture it in `orbit/lenses/critical-paths.md` with the structured entry shape (Description, Touchpoints, Expected behavior)

#### Scenario: Decision capture (Mode B/C only)

- **WHEN** the conversation produces an explicit decision in an active named exploration
- **THEN** the command proactively captures the decision in the `Decisions` section of `orbit/explore/<name>/explore.md` and acknowledges in chat ("captured")

#### Scenario: User vetoes decision capture

- **WHEN** the user says "don't capture that" or similar
- **THEN** the proposed capture is not written; the conversation continues unaffected

### Requirement: Offer-don't-auto for non-decision captures

The system SHALL offer rather than auto-write for convention, perspective, critical-path, and reference captures. Decisions are proactively captured with acknowledgment.

#### Scenario: Offer phrased clearly

- **WHEN** a capture-worthy convention/perspective/critical-path is detected
- **THEN** the command pauses briefly and emits a one-sentence offer naming the target file

#### Scenario: Group offer when natural

- **WHEN** multiple capture-worthy items of the same type emerge in close succession (e.g., three conventions)
- **THEN** the command groups them into a single offer rather than asking three times

### Requirement: explore.md five-section convention

The system SHALL maintain `orbit/explore/<name>/explore.md` in the format `orbit-conventions` owns — SIX sections in the order that format states, the Decisions entry slots, the Mechanism entry grammar, and the two status tokens — and this requirement NAMES that format rather than restating it (R-crc-14). (The TITLE is retained for delta identity; the format is six sections.) Open-question entries carry the `Standing recommendation:` slot per that format (D-arc Stage D5, leak-hardening layer 1): the current leaning verbatim, or the literal `none yet` — a pending leaning discussed in conversation always has a file-resident home.

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

### Requirement: Sibling captures supported

The system SHALL accept additional files in `orbit/explore/<name>/` beyond `explore.md` (e.g., `sketches/*.md`, draft convention files).

#### Scenario: Sketch directory

- **WHEN** a design sketch is captured during exploration
- **THEN** it can be written to `orbit/explore/<name>/sketches/<sketch-name>.md` and persists there until promotion

### Requirement: Decline tracking within conversation

The system SHALL track recent capture declines within a single conversation to avoid double-offering.

#### Scenario: Declined convention not re-offered

- **WHEN** the user has just declined a convention capture for a specific topic
- **THEN** the command does not re-offer that convention later in the same conversation

### Requirement: Boundary residency sweep before emits

Before EVERY named-mode explore emit (begin emits excepted — nothing has been discussed yet), the body SHALL run the residency sweep (D-arc Stage D5, leak-hardening layer 2): decisions, leanings, rejections, and citations discussed since the last emit must be file-resident — in Decisions (with the entry's ID opener and `Kind:`), in the Mechanism section (a rule's domain table, its closure token and residual slots, or a move's disposition), in an open question's `Standing recommendation:` slot, in Considered & out, or in References — BEFORE the emit is invoked ("no emit without sweep"). The sweep rides the EXISTING conversation-boundary emit trigger (per `orbit-run-summary-emit`'s timing semantics) — no new trigger, no new prompt, no user-facing step (the R-d-4 constraint honored at design time). The engine-computed attestation (`open_questions_with_recommendation`, per `orbit-emit-composition`) then reflects the swept file, and `orbit-audit-drift`'s cross-check closes the loop.

#### Scenario: Sweep precedes the boundary emit

- **WHEN** a named-mode explore conversation reaches a boundary with a leaning discussed but not yet captured
- **THEN** the body writes the leaning into the relevant slot (Decision, Mechanism entry, standing recommendation, Considered & out, or Reference) BEFORE invoking `orbit emit explore` — the emit's engine-computed counts describe the swept file

#### Scenario: A rule discussed to a domain is swept into its Mechanism entry

- **WHEN** a rule's domain, closure or a move disposition was settled in conversation and its Mechanism entry does not yet carry it
- **THEN** the body writes it into the entry before the emit; a rule left with no entry stays a visible open domain (per the capture scenario of the five-section convention requirement)

#### Scenario: Honest ceiling acknowledged

- **WHEN** a leaning was discussed but the session's sweep misses it
- **THEN** no structural layer can recover it (nothing outside the conversation knows what was discussed) — the sweep is an instruction-layer discipline whose VERIFIABLE half is the attestation count; the miss surfaces, if ever, through audit-drift's cross-check or the next session's re-derivation

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

The shipped body carries TWO conforming exemplar entries, one per closure outcome (D-bcs-3, CLOSED, and D-bcs-12, BOUNDED with both residual slots — of the archived `bounded-closure-semantics` change), so the convention shows both shapes rather than describing them.

#### Scenario: A rule's entry records all nine moves

- **WHEN** a live rule's Mechanism entry is written
- **THEN** it carries the `Domain:` table, the `Closure:` token (with both residual slots iff BOUNDED), and nine move lines each `applied — <what it found>` or `not applied — <reason>`, per the grammar

#### Scenario: A defect that fits no move grows the set through the trail

- **WHEN** a walk or review classifies a defect and no move names its failure mode
- **THEN** an `@review:` marker is left in the exploration and the finding is recorded against this requirement in the review emit; the table is edited only by a change to this requirement

#### Scenario: The exemplar conforms

- **WHEN** the explore body is generated
- **THEN** each exemplar entry's lines match the grammar's productions, the BOUNDED branch included — the generated-surface test asserts it, and the maturity-signal stage parses the same exemplars as fixtures

### Requirement: Re-entry resolution and the conclude verb

`/orbit:explore <name>` SHALL resolve the name against FOUR facts — a staging directory exists; it is concluded (per the status-header production; defined only when the directory exists); an active change of that name exists; that change carries an `explore.md` (defined only when the change exists) — as ONE table, nine cells, four refused:

| staging dir | concluded | active change | change carries `explore.md` | resolution |
|---|---|---|---|---|
| no | — | no | — | Mode B new |
| yes | no | no | — | Mode B resume |
| yes | yes | no | — | state the conclusion and its `Re-entry:` trigger, ask nothing else; REOPEN only on the user's word |
| no | — | yes | yes | resume IN PLACE against `orbit/changes/<name>/explore.md`, say so, scaffold nothing |
| no | — | yes | no | Mode B new IN the change directory — the file is created beside the artifacts; no staging directory is scaffolded |
| yes | either | yes | either | REFUSED — second claim on one truth; name both paths and stop (neither resume nor scaffold) |

A staging directory WITHOUT `explore.md`, or whose header carries neither fixed token, resolves as not-concluded and resumes with the stub or header added (add-only) — never as MALFORMED. The status-header production is read on the change-directory file too: a `concluded` header inside `orbit/changes/<name>/explore.md` (a name promoted without reopening) resolves as the third row — state the conclusion and its trigger, reopen only on the user's word — never as a silent resume.

**The conclude verb** runs inside a named session on the user's declared word, in this order: the residency sweep; the CONCLUDED entry with its `Re-entry:` slot; the header token; THEN the final boundary emit, whose `final_assessment` states the conclusion in the author's words and whose engine-computed counts and recommendation describe the concluded file (the interim behaviour of that recommendation is the concluded-outcome requirement's KNOWN limit, named there and not restated here). What the record IS — the two tokens, what is written and what is not, the kept citation, the directory staying in place, and that conclude is no consent-marked seam — is `orbit-conventions`' concluded-outcome requirement; this requirement names it and does not restate it. Reopening follows that requirement's reopen scenario, then a boundary emit. The body never concludes on its own judgement: it recommends, and writes on the user's word (the arc's rules of engagement).

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
- **THEN** the body sweeps, writes the CONCLUDED entry, flips the header, and fires the boundary emit — in that order — and leaves the directory and its metadata where they are
