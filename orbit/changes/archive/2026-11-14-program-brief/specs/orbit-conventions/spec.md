## MODIFIED Requirements

### Requirement: A chain treats each prompt by its kind

A command the AI runs because the `chain` object allowed it SHALL treat each prompt its body can put to the user by the
prompt's kind: a TARGET prompt (which change, which mode) does not fire, because the next command names both; a
ROUTINE confirmation — a prompt whose body marks a default and whose default sends nothing outside the project — is
answered with that default, and the command's run summary records it as one sentence in its `final_assessment`:
`The chain took the default: <prompt> — <answer>.`; every other prompt is a DECISION, which stops the chain: the AI asks
it exactly as on an arrival the user typed, the chain does not continue after it, and the AI states in one line that the
chain stopped at it. A prompt that would leave unfinished work behind is a decision whatever default it marks, and so
is every anomaly prompt (a gate inflection, a base-fingerprint check, a critical audit). The prompts of the four
commands a chain can arrive at, `orbit-review`, `orbit-address-reviews`, `orbit-apply-change` and
`orbit-archive-change`:

| prompt | kind |
|---|---|
| review: which change — or, in architecture mode, which doc — when none is named | target: does not fire (a chain names a change, never architecture mode) |
| review: which mode, when `--as` is not given and `tasks.md` is missing, mixed or ambiguous | target: does not fire |
| review: which change, in the external handoff, when none is named or the name is ambiguous | target: does not fire |
| review: the external return the user pastes back | not a prompt: the `chain` object refuses the command with `needs-user` before it runs |
| address-reviews: triage scoping the user's reply leaves unsettled (default: walk all) | routine: walks all, recorded |
| address-reviews: a half-landed pair, stop or walk now | decision: stops |
| address-reviews: a decision-lane finding (briefing, ratification, closure prompt) | decision: stops |
| address-reviews: an unresolvable finding's alternatives to filing a task (convert to `@todo`, or escalate) | decision: stops |
| apply: which change, when none is named or it is ambiguous | target: does not fire |
| apply: the consent prompt | not a prompt on an arrival the `chain` object allowed: the arrival is granted, records `setting`, and the prompt does not fire (`orbit-lifecycle-consent`) |
| apply: the gate inflection at a `blocked-by-gate` entry | decision: stops |
| apply: a pause — an unclear task, a design issue the work reveals, an error or a blocker | decision: stops |
| archive: which change, when none is named | target: does not fire |
| archive: the consent prompt | not a prompt on an arrival the `chain` object allowed: the arrival is granted, records `setting`, and the prompt does not fire (`orbit-lifecycle-consent`) |
| archive: unaddressed `@review:` markers (address now, convert to `@todo:`, or proceed) | decision: stops |
| archive: incomplete artifacts | decision: stops |
| archive: incomplete tasks | decision: stops |
| archive: a user-validation task line the closure cannot dispose of (repair `tasks.md`, or abort) | decision: stops |
| archive: the sign-off over the saved brief, under `signoff: change` (sign off, or decline) | decision: stops |
| archive: the sync assessment (default: Sync now when deltas need syncing; Archive now when they are already synced) | routine: takes the marked default, recorded |
| archive: the gate inflection | decision: stops |
| archive: the base-fingerprint check, unverified or diverged | decision: stops |
| archive: critical audit findings | decision: stops |

On any arrival the user typed, every prompt fires exactly as without the `chain` setting. The list is a named limit —
Residual kind: a question a chained body asks in prose that matches neither pattern of Case 1. Residual method: D-sc-13's
test over the generated bodies, apply's and archive's among them, and a fixture chain run through each granted command, any turn that ends awaiting the
user without a listed prompt being the missed member. (Case 1 and D-sc-13 are the stage exploration's, archived with
this change: the two patterns are the `AskUserQuestion` sites and the prose asks of the pause pattern, and D-sc-13's
test is `Each chained prompt states its kind`.)

#### Scenario: A routine scoping prompt takes its default

- **WHEN** `/orbit:address-reviews <change>` runs because the `chain` object allowed it, and triage would ask how much
  to walk
- **THEN** no prompt fires, every finding is walked, and the walk's `final_assessment` carries
  `The chain took the default: triage scoping — walk all.`

#### Scenario: A decision-lane finding stops the chain

- **WHEN** a chained walk reaches a finding in the decision lane
- **THEN** the AI briefs it and waits for the user exactly as on a typed walk, and after the walk ends it runs no next
  command, stating that the chain stopped at a decision

#### Scenario: A typed arrival asks every prompt

- **WHEN** the user types `/orbit:address-reviews <change>` under a `chain` setting that grants `address-reviews`
- **THEN** triage scoping asks as it does today, and no default is taken

#### Scenario: A chained archive takes the sync default

- **WHEN** `/orbit:archive <change>` runs because the `chain` object allowed it and its deltas need syncing
- **THEN** no sync prompt fires, the deltas are synced, and the archive's `final_assessment` carries
  `The chain took the default: sync assessment — Sync now.`

#### Scenario: A pause in a chained apply stops the chain

- **WHEN** apply runs because the `chain` object allowed it and a task turns out unclear
- **THEN** the AI asks as on a typed apply, and after apply ends it runs no next command, stating that the chain
  stopped at a decision

#### Scenario: Unaddressed markers stop a chained archive

- **WHEN** a chained archive's marker scan finds `@review:` markers in the change
- **THEN** the marker prompt is asked exactly as on a typed archive

#### Scenario: The sign-off stops a chained archive

- **WHEN** `/orbit:archive <change>` runs because the `chain` object allowed it, under `signoff: change`, and the hold
  reports the change unsigned
- **THEN** the saved brief is shown and the sign-off is asked exactly as on a typed archive, and after the archive ends
  the AI runs no next command, stating that the chain stopped at a decision
