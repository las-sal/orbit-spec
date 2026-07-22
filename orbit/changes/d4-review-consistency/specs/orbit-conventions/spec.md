## MODIFIED Requirements

### Requirement: Final-assessment phrasings

The system SHALL use stock phrasings for the final-assessment line of AUDIT reports and gate-less architecture-mode review reports; proposal- and system-mode REVIEW reports carry no skill-authored final-assessment line — their assessment, gate, and eligibility lines are the engine-rendered tail of the pasted report per `orbit-report-rendering` (D-arc Stage D4).

#### Scenario: Stock phrasings (audit reports)

- **WHEN** an audit-drift scorecard report is emitted
- **THEN** the final-assessment line uses one of:
  - `X critical issue(s) found. Fix before <gate>.`
  - `No critical issues. Y warning(s) to consider. Ready <gate> (with noted improvements).`
  - `All checks passed. Ready <gate>.`
  where `<gate>` varies per audit-drift invocation context

#### Scenario: Review reports end in the engine tail (D-arc Stage D4)

- **WHEN** a proposal- or system-mode review report is produced
- **THEN** it is the pasted `orbit status --change <name> --report` render whose final lines are the engine-computed gate/position/eligibility tail — no stock skill-authored assessment line exists

#### Scenario: Gate-less architecture-mode phrasings (D-arc Stage D2)

- **WHEN** `/orbit:review --as architecture` emits its final-assessment line
- **THEN** the gate-referencing phrasings above do NOT apply (no gate exists over architecture docs); the line uses the gate-less forms specified in `orbit-review`'s `Architecture-mode final assessment has no gate` requirement (`X critical / Y warning(s). Ready when you are: /orbit:address-reviews --from-file <emit>.` with findings; `No findings. The architecture trail records this pass.` when clean)
