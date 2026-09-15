## MODIFIED Requirements

### Requirement: Cycle context populated from prior runs

The system SHALL include a "Cycle context" section in the prompt with iteration number, prior findings (open and resolved), populated from `.orbit-runs/` if it contains prior runs — EXCEPT when the pass being packaged is a BLIND-PAIR MEMBER, in which case every channel carrying prior findings is WITHHELD.

**Reading the genre.** The external-handoff branch SHALL run `orbit status --change <name> --json` as an explicit step ordered BEFORE the cycle-context step, and read `next_hint_keys.slot` from it. This is a NEW read: the branch makes no such call today (its only CLI reads are `orbit list --json` and the git preflight), so the step must be added rather than assumed. The genre is never inferred from flags, file scans, or trail inspection — `orbit-engine-gates`' canonical-next computation owns the question of which cadence slot is in play, and a body-side heuristic could disagree with the gate about the very property the gate is certifying.

**The rule is a CONJUNCTION on a POSITIVE signal.** A pass is a blind-pair member when `next_hint_keys.slot` is present AND equals `blind-pair` AND the invoked reviewer class is independent (`fresh` or `external`). Absence of the slot is NOT treated as a blind-pair signal:

| `next_hint_keys.slot` | invoked class | cycle context | why |
|---|---|---|---|
| `blind-pair` | `external` or `fresh` | **WITHHELD** | the pass can satisfy the slot; its partner must not reach it |
| `blind-pair` | `in-context` | retained | an in-context pass can never satisfy a blind-pair slot, and is the verification genre that most needs prior context |
| `in-context` / `external` / `fresh` / `independent` | any | retained | not a pair slot; a confirming or sequential pass is doing a different job |
| ABSENT — a prior pass's findings stand unwalked | any | retained | the canonical-next unresolved-findings branch carries no slot; this is the ordinary state between a review and its walk |
| ABSENT — every gate has passed | any | retained | `next_hint_keys` carries only the phase |
| ABSENT — status call failed, or no reviewed gate declared | any | retained | including architecture mode, which has no change and no cadence |

Withholding on a positive signal only cannot leak: a pair member is runnable in exactly two states — the pair empty, or one member standing — and both render the slot (the empty case from the needed-slot branch, the open case from the open-pair branch, which is evaluated BEFORE the unresolved-findings branch). The states where the slot is absent are never pair states.

**Every channel, not only the section.** Withholding covers the Cycle context section AND the prompt's project-context pointer to `orbit/changes/<change-name>/.orbit-runs/`, which otherwise directs the reviewer to the directory holding its partner's emit. A prompt whose section is empty while its reading list still points at the findings is not blinded.

#### Scenario: Prior internal review summary exists

- **WHEN** the change has a prior `review-proposal-<TS>.json` or `review-system-<TS>.json` summary in `.orbit-runs/` and the packaged pass is not a blind-pair member
- **THEN** the cycle context section includes counts and short titles of those findings

#### Scenario: Prior external review exists

- **WHEN** the change has a prior `external-<as>-<TS>.md` in `.orbit-runs/` and the packaged pass is not a blind-pair member
- **THEN** the cycle context section summarizes those findings so the external AI knows what was previously flagged

#### Scenario: Blind-pair member withholds every prior-findings channel

- **WHEN** the command packages a prompt, `next_hint_keys.slot` is `blind-pair`, and the invoked class is `external` — whether neither member yet stands or the fresh half has already landed with findings
- **THEN** the Cycle context section carries the iteration number and a one-line withheld note naming the reason, carries NO prior-findings content of either genre, AND the prompt's project-context reading list omits the `.orbit-runs/` pointer

#### Scenario: Absent slot retains, and does not read as a pair signal

- **WHEN** the command packages a prompt and `next_hint_keys.slot` is absent — a prior pass's findings stand unwalked, every gate has passed, the status call failed, or the change declares no reviewed gate
- **THEN** the prompt renders cycle context exactly as it does today, because absence is not a blind-pair signal and a sequential iteration must not be blinded by a missing field
