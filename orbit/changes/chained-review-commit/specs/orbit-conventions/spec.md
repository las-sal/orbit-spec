## ADDED Requirements

### Requirement: The commit step closes every body that writes to a change

Every generated workflow body that writes to a change SHALL close with the commit step: one text composed once in code
(`COMMIT_STEP`) and carried byte-equal. The step runs `orbit pr commit <change-name> --json` in the session the command
was invoked in, after the command's run summary is written and before the chain end step (`No-chaining contract`),
and acts on the record by `orbit-pr-lifecycle`'s consumption table (`PR actions are workflow-body choreography (zero
engine git)`). On `off` it prints nothing and runs nothing. On `skip` it writes one line from the reason. On `proceed`
it writes the commit message (one line naming the command, the change and what the session did), runs the printed
steps in order, and names, in one line, each path `observations.untracked` lists. What it may commit, and to which
branch, is `orbit-pr-lifecycle`'s `` `orbit pr commit` computes the closing commit step ``; what grants it is that
capability's `The commit and push settings`. A worker the session dispatched (a fresh reviewer, a blind pair's fresh
half) persists its pass and returns, and never runs the step. The bodies, SOURCED from the workflow templates under
`src/core/templates/workflows/`:

| body | carries the step |
|---|---|
| propose, ff | yes: after the completion emit and `publish`'s record segment, before the chain end step |
| apply | yes: at the session's close, before the chain end step, not at each chunk boundary |
| review | yes: in the invoking session, before the chain end step |
| address-reviews | yes: before the chain end step |
| verify | yes: at its close |
| explore | yes: after each boundary emit; it resolves `off` for a staging exploration, which has no attachment |
| archive | yes: after the PR-attached tail and before the completion readout; the tail commits its enumerated scope, and under `commit: true` the step commits the rest in a second commit, so the tail's unrelated-paths guarantee (`orbit-archive-modifications`' `PR-attached archive tail`) holds for the tail's own commit |
| new, continue | no: never attached (`orbit-pr-lifecycle`'s `PR entry points`) |
| bulk-archive | no: it archives several changes and runs no tail; its writes ride the next carrying body's commit |
| architect, audit-drift | no: no change target |
| sync-specs | no: it writes no run record; its writes ride the next carrying body's commit |
| onboard | no: it writes nothing |

(`feedback` is not generated, and `pr-choreography` is text propose and ff share, not a body.) At the defaults (neither
setting granted) the step's one act is that read-only call: the record is `off`, and the body prints nothing and runs
nothing (G0, as R-adf-12 words it). Named limits: an apply session's work stays uncommitted until the session closes,
however many chunks it completes; and bulk-archive's and sync-specs' writes wait for the next carrying body.

#### Scenario: At the defaults the step prints nothing

- **WHEN** a carrying body closes in a project that sets neither `commit` nor `push`
- **THEN** `orbit pr commit` prints `off`, the body prints nothing about it, and the turn ends as it did before the step
  existed

#### Scenario: The step commits before the chain read

- **WHEN** `commit: true` is set and an attached change's walk closes with its edits uncommitted
- **THEN** the step commits them before the chain end step reads the `chain` object

#### Scenario: A dispatched worker never commits

- **WHEN** a fresh reviewer dispatched by `/orbit:review --fresh` persists its pass under `commit: true`
- **THEN** the worker runs no commit step; the invoking session's step commits the pass

#### Scenario: The archive's second commit carries what the tail left

- **WHEN** an attached change archives under `commit: true` with an unrelated tracked edit in the tree
- **THEN** the tail's commit leaves the edit out, as `orbit-archive-modifications` promises, and the step after it
  commits the edit; without the setting the edit stays uncommitted, as today

#### Scenario: Every carrying body carries the step byte-equal

- **WHEN** the workflow skills are generated
- **THEN** each body the table marks yes carries `COMMIT_STEP` byte-equal, and no body the table marks no carries it

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
chained command ends the same way, so a chain continues until the object reports `may_run: false` (a chained archive
ends the chain at its completion readout and reads no object, because the command after it is not a change command), and the AI then
states its `why` in one line whenever `configured` is true — on `open-stop`, naming the object's `stop` record and
putting that stop's question to the user. A command run because the object allowed it records that as one sentence,
`Chained: granted by chain.<key>.`, in the record its session writes: a walk in its run summary's `final_assessment`,
an external review or a blind pair in its launch record's `final_assessment`, an in-context review in its pass's
`commentary` (the review emit owns a pass's `final_assessment`); a chained apply or archive records it as its
`consent: "setting"` value and writes no sentence, because the key and the command are one-to-one
(`orbit-lifecycle-consent`'s `Consent recorded in consent-scoped lifecycle emits`); a chained fresh review records nothing, because its
pass is written by a worker whose brief carries nothing from the session that dispatched it — a named limit. Only the session that invoked a
command reads the object at its end: a worker that session dispatched — a fresh reviewer, a blind pair's fresh half —
persists its pass and returns, and never chains. A command with no change target — an architecture-mode review, a
`--doc` walk, a project-wide walk — reads no object and ends at its readout. A chained external review or blind pair
needs a committed tree. Where the commit step commits (`The commit step closes every body that writes to a change`: `commit: true`, an attached change, HEAD on its branch), it runs before this read, so the review arrives on a committed tree; anywhere else an uncommitted tree makes it write no run record, the object reports `no-progress`, and the AI
says the tree is uncommitted — a named limit. With no `chain` setting the object never allows a command,
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

#### Scenario: A chained apply records its grant in its consent value

- **WHEN** a proposal walk ends, the `chain` object reports `may_run: true` for `/orbit:apply <change> — user-invoked`,
  granted by `chain.apply`, and the walk's closing step runs apply
- **THEN** apply's emits carry `consent: "setting"`, and no `Chained:` sentence is added to their assessment

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the disciplines
  epitome (one bullet per discipline) instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

#### Scenario: A granted commit reaches a chained external review committed

- **WHEN** `commit: true` and `push: true` are set, an attached change's apply closes on its branch with the work
  uncommitted, and the `chain` object reports `may_run: true` for `/orbit:review --as system --reviewer blind-pair <change>`
- **THEN** the commit step commits and pushes before the chain read, the pair's preflight finds a clean tree, and the
  pair writes its launch record, so the chain does not stop on `no-progress`
