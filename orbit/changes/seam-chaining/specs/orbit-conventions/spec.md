## MODIFIED Requirements

### Requirement: No-chaining contract

The AI SHALL invoke at most the orbit workflow commands the user's message explicitly requests, plus the next command
the change status's `chain` object allows (`orbit-engine-gates`' `The change status says whether the next command may
run unasked`) — one command per explicit user request; without that allowance the AI recommends, never invokes.
Completing a command ENDS the turn at the position readout and the engine's canonical-next line (eligibility-framed,
per `orbit-engine-gates`); the AI SHALL NOT invoke the next orbit command — any `/orbit:*`
workflow, review iterations included — unless the user's message requests it or the `chain` object reports
`may_run: true` for it. When it does, the AI renders the position readout and the eligibility line, then one line naming
the command it runs and the setting key that granted it, and runs that command as the next act of the same turn; the
chained command ends the same way, so a chain continues until the object reports `may_run: false`, and the AI then
states its `why` in one line whenever `configured` is true — on `open-stop`, naming the object's `stop` record and
putting that stop's question to the user. A command run because the object allowed it records that as one sentence,
`Chained: granted by chain.<key>.`, in the record its session writes: a walk in its run summary's `final_assessment`,
an external review or a blind pair in its launch record's `final_assessment`, an in-context review in its pass's
`commentary` (the review emit owns a pass's `final_assessment`); a chained fresh review records nothing, because its
pass is written by a worker whose brief carries nothing from the session that dispatched it — a named limit. Only the session that invoked a
command reads the object at its end: a worker that session dispatched — a fresh reviewer, a blind pair's fresh half —
persists its pass and returns, and never chains. With no `chain` setting the object never allows a command,
and the contract holds exactly as without the setting. Blanket delegation
("follow the cadence", "take it through review") covers work WITHIN each explicitly requested
command (the passes of one review, the tasks of one apply), never the next command; gate `passed`
means *eligible*, not *commanded* — only the user's own `chain` setting commands. This contract is echoed in every generated workflow body
(the self-contained-disciplines pattern) and is the behavior layer the consent prompts
(`orbit-lifecycle-consent`) backstop at the consent-marked seams. The per-body echo MAY take
the EPITOME form (D-arc Stage D5's body economy): for no-chaining, ~2 structural-leaning lines
leaning on the turn-ending structure (position readout + eligibility line); for the
disciplines block generally, an epitome of one bullet per discipline with procedural detail moved to the
step that uses it (detail-to-situ) — the full normative text keeps ONE home (this capability's
discipline requirements), an epitome echo is COMPLIANT, and body-fidelity checks pin the
epitome form, not the pre-D5 full block. The bodies whose end can name a change's next command — propose, ff,
apply, review and address-reviews — carry the `chain` allowance in their echo and in their closing step.

#### Scenario: Command completion ends the turn

- **WHEN** an orbit workflow command completes, a next command is eligible, and the change status's `chain` object
  reports `may_run: false`
- **THEN** the AI renders the position readout + the engine's canonical-next line and stops;
  it does not invoke the eligible command

#### Scenario: A granted next command runs in the same turn

- **WHEN** a fresh system review completes with findings and the `chain` object reports
  `next: "/orbit:address-reviews <change>"` and `may_run: true`, granted by `chain.address-reviews`
- **THEN** the AI renders the position readout and the eligibility line, names `/orbit:address-reviews <change>` and the
  key `address-reviews` in one line, and runs the walk; the walk's `final_assessment` carries
  `Chained: granted by chain.address-reviews.`, and at the walk's end it reads the object again

#### Scenario: A chain ends by stating why

- **WHEN** a chained command completes, `configured` is true, and the `chain` object reports `may_run: false` with
  `why: "not-granted"`
- **THEN** the AI renders the position readout and the eligibility line, states that the chain stops because the next
  command is not granted, and ends the turn

#### Scenario: A dispatched worker never chains

- **WHEN** a fresh reviewer — dispatched by `/orbit:review --fresh` or as a blind pair's fresh half — persists its pass,
  and the `chain` object reports `may_run: true` for `/orbit:address-reviews <change>`
- **THEN** the worker returns without reading the object or running the walk; only the invoking session's closing step
  may run it

#### Scenario: Blanket delegation does not cross commands

- **WHEN** the user has said "run the review cadence", no `chain` setting grants the next review, and one review
  command completes with the gate still unpassed
- **THEN** the AI reports position and recommends; the next review invocation is the user's
  (review-cycle COUNT is the user's call)

#### Scenario: Explicit multi-command requests are honored as scoped

- **WHEN** the user's message explicitly names multiple commands ("run a fresh review, then
  address its findings")
- **THEN** exactly those named commands are run — the request defines the scope; nothing beyond
  it is invoked unless the `chain` object allows it

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the disciplines
  epitome (one bullet per discipline) instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

## ADDED Requirements

### Requirement: A chain treats each prompt by its kind

A command the AI runs because the `chain` object allowed it SHALL treat each prompt its body can put to the user by the
prompt's kind: a TARGET prompt (which change, which mode) does not fire, because the next command names both; a
ROUTINE confirmation — a prompt whose body marks a default and whose default sends nothing outside the project — is
answered with that default, and the command's run summary records it as one sentence in its `final_assessment`:
`The chain took the default: <prompt> — <answer>.`; every other prompt is a DECISION, which stops the chain: the AI asks
it exactly as on an arrival the user typed, the chain does not continue after it, and the AI states in one line that the
chain stopped at it. A prompt that would leave unfinished work behind is a decision whatever default it marks. The
prompts of the two commands a chain can arrive at, `orbit-review` and `orbit-address-reviews`:

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

On any arrival the user typed, every prompt fires exactly as without the `chain` setting. The list is a named limit —
Residual kind: a question a chained body asks in prose that matches neither pattern of Case 1. Residual method: D-sc-13's
test over the generated bodies, and a fixture chain run through each granted command, any turn that ends awaiting the
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

### Requirement: Each chained prompt states its kind

Each prompt that `A chain treats each prompt by its kind` lists SHALL carry, at its site in the generated body or
reference, a tag naming its kind in the form `(chain: target)`, `(chain: routine, default: <option>)` or
`(chain: decision)`; a line that names `AskUserQuestion` or the pause pattern without asking anything (a mention), and
the list's not-a-prompt row, carry `(chain: not a prompt)`. A test over the generated `orbit-review` and
`orbit-address-reviews` bodies and their references SHALL fail on an `AskUserQuestion` site, or a prose ask matching
the pause pattern (pause, wait for guidance, ask for clarification), that carries no tag, and on a tagged site whose
prompt the requirement's list does not name. The tag is
read only on an arrival the `chain` object allowed; on every other arrival it changes nothing the AI does (G0, as
R-adf-12 words it). The sites are found by two patterns — a named limit: Residual kind: a question a chained body asks
in prose that neither pattern matches. Residual method: the stage's fixture chain, where a turn ending on the user
without a tagged prompt is the missed member.

#### Scenario: An untagged prompt fails the test

- **WHEN** a template edit adds an `AskUserQuestion` to the address-reviews body with no `(chain: …)` tag
- **THEN** the test fails naming the site

#### Scenario: A tag the list does not name fails the test

- **WHEN** a review reference carries `(chain: routine, default: proceed)` at a prompt the requirement's list does not name
- **THEN** the test fails naming the tag
