## MODIFIED Requirements

### Requirement: explore.md five-section convention

The system SHALL maintain `orbit/explore/<name>/explore.md` with five sections in fixed order: Premise, Decisions, Open questions, Considered & out, References. Open-question entries carry the `Standing recommendation:` slot per `orbit-conventions`' five-section format (D-arc Stage D5, leak-hardening layer 1): the current leaning verbatim, or the literal `none yet` — a pending leaning discussed in conversation always has a file-resident home.

#### Scenario: Initial stub structure

- **WHEN** a new `explore.md` is created
- **THEN** all five sections are present with empty content under headings; the file includes the status header `> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.`

#### Scenario: Resolving an Open question

- **WHEN** an Open question is resolved during the conversation
- **THEN** the command moves the entry from `Open questions` to `Decisions` with a dated rationale, and acknowledges in chat

#### Scenario: Rejecting a considered option

- **WHEN** an option discussed is explicitly rejected
- **THEN** the command moves it to `Considered & out` with a brief rationale and date

#### Scenario: Capturing an open question with its leaning

- **WHEN** the conversation surfaces an open question with a discussed leaning that is not yet a decision
- **THEN** the captured entry carries `Standing recommendation: <the leaning>`; a question with no leaning yet carries `Standing recommendation: none yet` — never an entry with the slot absent

## ADDED Requirements

### Requirement: Boundary residency sweep before emits

Before EVERY named-mode explore emit (begin emits excepted — nothing has been discussed yet), the body SHALL run the residency sweep (D-arc Stage D5, leak-hardening layer 2): decisions, leanings, rejections, and citations discussed since the last emit must be file-resident — in Decisions, in an open question's `Standing recommendation:` slot, in Considered & out, or in References — BEFORE the emit is invoked ("no emit without sweep"). The sweep rides the EXISTING conversation-boundary emit trigger (per `orbit-run-summary-emit`'s timing semantics) — no new trigger, no new prompt, no user-facing step (the R-d-4 constraint honored at design time). The engine-computed attestation (`open_questions_with_recommendation`, per `orbit-emit-composition`) then reflects the swept file, and `orbit-audit-drift`'s cross-check closes the loop.

#### Scenario: Sweep precedes the boundary emit

- **WHEN** a named-mode explore conversation reaches a boundary with a leaning discussed but not yet captured
- **THEN** the body writes the leaning into the relevant slot (Decision, standing recommendation, Considered & out, or Reference) BEFORE invoking `orbit emit explore` — the emit's engine-computed counts describe the swept file

#### Scenario: Honest ceiling acknowledged

- **WHEN** a leaning was discussed but the session's sweep misses it
- **THEN** no structural layer can recover it (nothing outside the conversation knows what was discussed) — the sweep is an instruction-layer discipline whose VERIFIABLE half is the attestation count; the miss surfaces, if ever, through audit-drift's cross-check or the next session's re-derivation
