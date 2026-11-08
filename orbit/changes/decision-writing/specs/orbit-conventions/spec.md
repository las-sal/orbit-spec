## ADDED Requirements

### Requirement: Decision-writing discipline

The system SHALL tell the AI when to write each decision record (`orbit-decision-records`) by a fifth execution
discipline, DECISION-WRITING, stated once in this fence and carried byte-equal by every generated workflow body's
disciplines epitome:

```
- **Decision-writing (call-time)**: under every setting, keep a record of each call and each stop without changing what the user sees or is asked. BEFORE asking the user a question that a stop condition describes — `security-unprecedented` (a security-relevant call with nothing approved to rely on), `user-facing-uncovered` (an end-user-visible call no ratified goal covers), `ruling-amendment` (amending a ratified ruling or goal), `outward-act` (an outward or irreversible act the settings do not grant), `unresolvable-critical` (a CRITICAL review finding no edit inside the change resolves) — write a stop record (`orbit emit stop`), then ask exactly as you would have; with the user's answer, write a resolution naming that stop (`orbit emit resolution`); when `ruling-amendment`, `outward-act` or `unresolvable-critical` describes an act you take without asking — the user directed it (they told you to amend a ruling), or no flow asks — write its stop record before the act, then, when the user directed it, a resolution naming that stop whose answer is their direction, and otherwise leave the stop open; AFTER any call that falls in a ledger area — made without asking, or made with the user's answer to a stop — `user-sees-or-does`, `defaults`, `when-things-go-wrong`, `user-data`, `things-others-build-on`, `docs`, `who-can-get-in`, `secrets`, `network-exposure`, `trusting-input`, `new-dependencies`, `permissions-and-sandboxing`, `encryption`, `personal-data-and-privacy`, `cost`, `licensing`, `accessibility`, `performance-user-feels` — write a ledger entry (`orbit emit ledger`) citing what it relies on; when `security-unprecedented` or `user-facing-uncovered` describes the call, by its own gloss above, the entry cites nothing and names that stop: the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open. A designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed. A question no condition describes writes nothing, nor does a call in no area. A record names the work it belongs to (`--change <name>` for a change or a named exploration, or `--doc <doc>` in an architect session); in a session with neither (a project-wide run, an unnamed exploration), or on an archived change (orbit writes no record to its trail), write no record, never attaching it to other work. What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in `references/decision-records.md`, beside this skill; a refused record names the field to fix.
```

The fence is the owner. A generated body cannot read this spec, so the statement it carries names the stop conditions
and ledger areas themselves; the ids are those `orbit-decision-records` defines (its event table's five conditions a
payload may raise, and `The ledger's eighteen areas`), composed in code from the same lists the write gate checks, and
a parity test holds the composed statement equal to this fence. The moments the statement names, and what each
writes:

| moment | writes |
|---|---|
| the AI is about to ask the user a question a stop condition describes | a stop record, then the question, asked exactly as without the record |
| the user answers that question | a resolution naming the stop |
| an act `ruling-amendment`, `outward-act` or `unresolvable-critical` describes, taken without asking — the user directed it, or no flow asks | a stop record before the act; when the user directed it, a resolution naming the stop whose answer is that direction; otherwise the stop stays OPEN |
| a call in a ledger area made without asking that neither `security-unprecedented` (a security-relevant call with nothing approved to rely on) nor `user-facing-uncovered` (an end-user-visible call no ratified goal covers) describes | a ledger entry citing what it relies on |
| a call in a ledger area one of those two conditions describes, each by its own gloss, put to the user as a question | a stop record of that condition, then the question, then, after the answer, the resolution and the ledger entry citing nothing and naming the stop |
| a call in a ledger area one of those two conditions describes, made without asking (where today's flow asks nothing) | a stop record of that condition, then the ledger entry citing nothing and naming it; nothing is asked, and the stop stays OPEN — no resolution answers it |
| a designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — that no stop condition describes | nothing: a designed seam is not a stop |
| a designed prompt a stop condition also describes (a gate's inflection prompt over a CRITICAL finding no edit inside the change resolves: `unresolvable-critical`) | a stop record, then the prompt as designed; with the user's answer, the resolution naming the stop |
| a question no condition describes | nothing |
| a call in no ledger area | nothing |
| any moment in a session with no change and no architecture doc (a project-wide audit-drift run, an unnamed exploration, an onboard read), or on an archived change (an address-reviews walk of its trail) | nothing: decision records have no project-wide home (`orbit-decision-records`' `Where decision records are kept`), the emit surface writes none to an archived change's trail (a decision is recorded while the work is live), and a record is never attached to work it does not belong to |
| a `tripwire` stop | nothing from the AI: orbit raises it (stage `tripwires` of `automate-dev-flow`), and a payload naming it is refused |

The table is closed by derivation: a moment is either a question for the user — a stop condition, a seam no condition
describes, a seam one does, or neither — or an act a directly raised condition describes, taken with no question (the
user directed it, or no flow asks), or a call the AI makes — in an area neither ledger condition describes, in an area
one does (asked, or not asked), or in none — and every branch is a row; a moment in a session with no home for a
record — no change and no doc, or an archived change — is its own row whatever its branch. The two ledger conditions
are read each by its own gloss, as R-adf-3 rules them: an end-user-visible call that a requirement supports but no
ratified goal covers is `user-facing-uncovered`, and its entry cites nothing and names that stop. Under supervised settings the discipline changes nothing the user sees or is asked: a stop record keeps the
moment and halts nothing (`orbit-decision-records`' `Decision records are written in every mode`), and an OPEN stop —
one written where today's flow asks nothing — is expected: it marks a moment a later setting may halt on. Named limit — a moment in a session
with no change and no doc, or on an archived change, goes unrecorded, and nothing tells the user so. Whether a moment
WAS recorded is a reader's judgement, graded at `automate-dev-flow`'s first-run (G2, G4): orbit checks a record's form
when it is written, never that a record was owed.

#### Scenario: Every workflow body carries the statement

- **WHEN** each generated workflow skill that carries a disciplines epitome is generated
- **THEN** its epitome carries the statement byte-equal to this fence, as its fifth bullet after no-chaining

#### Scenario: The statement is composed from the write gate's lists

- **WHEN** the composed statement is read
- **THEN** it names every stop condition a payload may raise and every ledger area, in the lists' order, and does not
  name `tripwire`; a parity test holds it equal to this fence

#### Scenario: A stop record precedes the question it keeps

- **WHEN** the AI is about to ask the user whether to amend a ratified ruling
- **THEN** it writes a stop record of condition `ruling-amendment` first, then asks exactly as it would have, and on
  the user's answer writes a resolution naming that stop

#### Scenario: A call put to the user leaves all three records

- **WHEN** the AI is about to ask the user how to handle a security-relevant call with nothing approved to rely on
- **THEN** it writes a stop record of condition `security-unprecedented`, asks exactly as it would have, writes a
  resolution naming that stop with the user's answer, and, once it makes the call, a ledger entry whose `raised_stop`
  names that stop

#### Scenario: A call relying on nothing, made without asking, names an open stop

- **WHEN** under default settings the AI picks a default that a spec requirement supports but no ratified goal covers,
  where today's flow asks nothing
- **THEN** it writes a stop record of condition `user-facing-uncovered`, then a ledger entry with `relies_on: []`
  whose `raised_stop` names that stop; it asks the user nothing, and no resolution is written

#### Scenario: A session with no change and no doc writes no record

- **WHEN** during a project-wide `/orbit:audit-drift` run the AI is about to ask the user a question a stop condition
  describes
- **THEN** it writes no decision record and asks exactly as it would have

#### Scenario: An act the user directed writes its stop and its resolution

- **WHEN** the user tells the AI to amend a ratified ruling, and the AI amends it without asking anything
- **THEN** it writes a stop record of condition `ruling-amendment` before the amendment, and a resolution naming that
  stop whose answer is the user's direction

#### Scenario: A walk of an archived change writes no record

- **WHEN** during `/orbit:address-reviews` on an archived change the AI makes a call in a ledger area
- **THEN** it writes no decision record: the emit surface writes none to an archived change's trail

#### Scenario: A seam prompt writes nothing

- **WHEN** the AI asks the user for consent at a consent-marked seam, or fires a gate's inflection prompt, and no stop
  condition describes the prompt
- **THEN** no decision record is written: the prompt is a seam, not a stop

#### Scenario: A seam a stop condition describes writes its stop first

- **WHEN** a gate's inflection prompt is about to fire over a CRITICAL review finding no edit inside the change
  resolves
- **THEN** the AI writes a stop record of condition `unresolvable-critical`, fires the prompt exactly as designed,
  and on the user's answer writes a resolution naming that stop

### Requirement: Decision-record reference ships beside the statement

Every generated workflow skill whose epitome carries the decision-writing statement SHALL ship the reference
`references/decision-records.md`, one constant shared by every such skill, so that the statement's pointer names a
file the installed skill holds. The reference says, for each of the three records (`orbit-decision-records`):

- the command and the payload form: a JSON file passed with `--payload <file>`, carrying `model` (a model id or
  `null`) and the work it belongs to given as `--change <name>` or `--doc <doc>`;
- its fields, composed in code from `DECISION_PAYLOAD_FIELDS`, each with the form the write gate accepts;
- for a ledger entry, the citation kinds of `relies_on`, composed from the write gate's citation shapes, and the
  `[]`-with-`raised_stop` form;
- the plain-language rule: the fields `orbit-decision-records` binds as plain (`decided`, `alternatives`,
  `why`, `about`, `question`, `answer`, `effect`, composed from that requirement's table) are written for a reader who knows only the program's architecture doc, and any other
  term the record uses is defined in `defines`;
- one example payload per record, a fenced `json` block under that record's heading, which a test submits unchanged
  through the record's `orbit emit` command, in a disposable project seeded with what the example cites (the stop a
  resolution or ledger entry names, the requirement or ruling it relies on), and which the gate accepts.

The reference documents no emit schema block and carries no `json example` block, so it is outside the set
`orbit-emit-composition`'s `Payload schema references are proven by execution` counts and seeds; its examples are
executed by this requirement's own test.

The reference restates no event the statement owns: when to write a record is the statement's, what a record holds is
the reference's.

#### Scenario: Every statement-carrying skill ships the reference

- **WHEN** the generated workflow skills are generated
- **THEN** every skill whose epitome carries the decision-writing statement ships `references/decision-records.md`,
  byte-equal across them, and no other skill ships it

#### Scenario: The reference's fields are the write gate's

- **WHEN** the reference is read
- **THEN** it names, for each record, every field `DECISION_PAYLOAD_FIELDS` lists for that command and no other besides `model`, and
  every citation kind the write gate accepts

#### Scenario: Each example passes the write gate

- **WHEN** each example payload in the reference is submitted through its `orbit emit` command, in a disposable
  project seeded with what it cites
- **THEN** the gate accepts it and writes the record

## MODIFIED Requirements

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
(`orbit-lifecycle-consent`) backstop at the consent-marked seams. The per-body echo MAY take
the EPITOME form (D-arc Stage D5's body economy): for no-chaining, ~2 structural-leaning lines
leaning on the turn-ending structure (position readout + eligibility line); for the
disciplines block generally, an epitome of one bullet per discipline with procedural detail moved to the
step that uses it (detail-to-situ) — the full normative text keeps ONE home (this capability's
discipline requirements), an epitome echo is COMPLIANT, and body-fidelity checks pin the
epitome form, not the pre-D5 full block.

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

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the disciplines
  epitome (one bullet per discipline) instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

### Requirement: Generated-file disposition

The system SHALL classify every skill and command file orbit generates into one of four disposition categories by template provenance. Each category dictates how the file's source template is maintained in the fork.

#### Scenario: Orbit-authored — full ownership

- **WHEN** a generated file's template body has no upstream-derived content (currently `orbit-onboard`, whose body replaces upstream's guided-tour content entirely; the net-new editorial workflows — review (whose `--reviewer external` branch absorbed the external packaging at D-arc Stage D5's merge; the standalone review-external template joined at B3 and RETIRED at D5), audit-drift, address-reviews; and `orbit-architect`, fully orbit-authored — joined as the 16th workflow at D-arc Stage D2, the surface standing at 15 post-D5)
- **THEN** the template is fully owned by orbit; orbit's contributors edit it freely; the file uses the `orbit-*` directory naming convention for consistency with siblings even when the body is 100% orbit-authored

#### Scenario: Orbit-modified — upstream body with `# Orbit additions`

- **WHEN** a generated file's template bundles upstream's body with an appended `# Orbit additions` section (`orbit-explore`, `orbit-propose`, `orbit-archive-change`, `orbit-apply-change`, `orbit-verify-change`, `orbit-continue-change`, `orbit-ff-change`, `orbit-new-change`, `orbit-bulk-archive-change`)
- **THEN** the upstream-authored portion is the vendored-baseline snapshot and SHALL change only through a change whose delta spec names the edit — the step it replaces and the requirement that replaces it — so a future upstream cherry-pick can find every edit as a named act; an edit so named lands IN PLACE, and no additions-section text overrides a step edited under this rule, so the body carries one instruction for that step; orbit's other behavior and constraints land in the additions section. Known limits, both from before this rule and outside its clauses: upstream portions already edited name no delta — `orbit-apply-change` and `orbit-archive-change` carry semantic edits, found by diffing each body's upstream portion against `upstream/v1.3.1` with the rename normalized (2026-10-04) — and additions sections already override upstream steps, such as `orbit-propose`'s consume mode replacing Step 1 and `orbit-bulk-archive-change`'s fingerprint check superseding Step 5c's heuristic; a cherry-pick finds the first kind by diffing against that tag and the second by reading the additions sections

#### Scenario: A named edit replaces an upstream step in place

- **WHEN** a change's delta spec names an edit to an orbit-modified body's upstream portion (`orbit-verify-modifications`' `Verify's Scenario Coverage step reads the scenario map` names the replacement of verify-change's test-tracing instruction)
- **THEN** the step is edited in place in the upstream portion, no additions-section text overrides the same step, and the rest of the upstream portion is unchanged by that edit

#### Scenario: Upstream-verbatim — kept unchanged

- **WHEN** orbit generates an upstream skill it never modified because its interaction is at the invocation layer, not the skill-body layer (currently `orbit-sync-specs`, which upstream's own archive flow invokes as a callable primitive)
- **THEN** the template carries the upstream body unchanged; a `# Orbit additions` section, where present, carries only the execution disciplines' epitome every body carries and notes on how the skill behaves when invoked (`orbit-sync-specs`: consent inherited from the flow that invokes it), and no step of its own; beside the body, the skill ships only the shared decision-record reference (`references/decision-records.md`) that the epitome's decision-writing statement points at

#### Scenario: Not generated — excluded from the install surface

- **WHEN** an upstream skill provides no orbit-mission value (e.g., `feedback`, which sends user feedback to Fission-AI and has no role in orbit's workflow)
- **THEN** orbit does not register its template for generation; a fresh `orbit init` produces no such skill or command in the project

#### Scenario: Per-skill disposition is documented

- **WHEN** orbit's contributors evaluate a new upstream skill arriving via a future engine upgrade or cherry-pick
- **THEN** the disposition decision is recorded in the change proposal that performs the upgrade; the new skill is assigned to one of the four categories with rationale

#### Scenario: Commands are thin launchers delegating to skills

- **WHEN** orbit generates (or declines to generate) a `/orbit:*` command file
- **THEN** the command is a thin launcher that invokes its corresponding skill (the skill is the single source of workflow behavior and carries the disposition above); the command surface mirrors the skill surface 1:1, and a skill that is not generated has no command either
