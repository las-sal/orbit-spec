## ADDED Requirements

### Requirement: No-chaining contract

The AI SHALL invoke at most the orbit workflow commands the user's message explicitly requests —
one command per explicit user request; the AI recommends, never invokes. Completing a command
ENDS the turn at the position readout and the engine's canonical-next line (eligibility-framed,
per `orbit-engine-gates`); the AI SHALL NOT invoke the next orbit command — any `/orbit:*`
workflow, review iterations included — unless the user's message requests it. Blanket delegation
("follow the cadence", "take it through review") covers work WITHIN each explicitly requested
command (the passes of one review, the tasks of one apply), never the next command; gate `passed`
means *eligible*, not *commanded*. This contract is echoed in every generated workflow body
(the self-contained-disciplines pattern) and is the behavior layer the consent prompts
(`orbit-lifecycle-consent`) backstop at the consent-marked seams.

#### Scenario: Command completion ends the turn

- **WHEN** an orbit workflow command completes and a next command is eligible
- **THEN** the AI renders the position readout + the engine's canonical-next line and stops;
  it does not invoke the eligible command

#### Scenario: Blanket delegation does not cross commands

- **WHEN** the user has said "run the review cadence" and one review command completes with the
  gate still unpassed
- **THEN** the AI reports position and recommends; the next review invocation is the user's
  (review-cycle COUNT is the user's call)

#### Scenario: Explicit multi-command requests are honored as scoped

- **WHEN** the user's message explicitly names multiple commands ("run a fresh review, then
  address its findings")
- **THEN** exactly those named commands are run — the request defines the scope; nothing beyond
  it is invoked
