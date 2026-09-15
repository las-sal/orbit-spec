## MODIFIED Requirements

### Requirement: Cycle context populated from prior runs

The system SHALL include a "Cycle context" section in the prompt with iteration number, prior findings (open and resolved), populated from `.orbit-runs/` if it contains prior runs — EXCEPT when the pass being packaged fills a `blind-pair` cadence slot, in which case the section's prior-findings content is WITHHELD. The genre is READ FROM THE ENGINE, never inferred by the body: the command reads `next_hint_keys.slot` from the `orbit status --change <name> --json` call it already makes, and the slot value `blind-pair` (which `orbit-engine-gates`' canonical-next computation returns both when neither pair member stands and when one member stands and the other is missing) is what suppresses the content. When the slot CANNOT be determined — the status call fails, the change declares no reviewed gate, or the field is absent on an older engine — the command FAILS CLOSED and withholds. The consequences are asymmetric: withholding from a sequential iteration costs that reviewer convenience and is stated in the prompt, while including prior findings in a blind-pair member's prompt anchors the pair to its partner's findings, is invisible to the gate's walk-based blindness predicate, and corrupts the capture-recapture residual estimate the pair exists to produce.

#### Scenario: Prior internal review summary exists

- **WHEN** the change has a prior `review-proposal-<TS>.json` or `review-system-<TS>.json` summary in `.orbit-runs/` and the packaged pass does NOT fill a `blind-pair` slot
- **THEN** the cycle context section includes counts and short titles of those findings

#### Scenario: Prior external review exists

- **WHEN** the change has a prior `external-<as>-<TS>.md` in `.orbit-runs/` and the packaged pass does NOT fill a `blind-pair` slot
- **THEN** the cycle context section summarizes those findings so the external AI knows what was previously flagged

#### Scenario: Blind-pair member withholds prior findings

- **WHEN** the command packages a prompt and `next_hint_keys.slot` is `blind-pair` — whether neither member yet stands or the fresh half has already landed with findings
- **THEN** the Cycle context section carries the iteration number and a one-line withheld note naming the reason (a blind-pair member is read blind of its partner), and carries NO prior-findings content of either genre — no counts, no titles, no resolved-since list

#### Scenario: Slot undeterminable fails closed

- **WHEN** the command cannot read `next_hint_keys.slot` — the status call fails, the change declares no reviewed gate, or the field is absent
- **THEN** the prompt withholds prior-findings content exactly as for a blind-pair member, and the withheld note states that the slot could not be determined
