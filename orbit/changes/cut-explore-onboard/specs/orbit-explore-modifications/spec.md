## MODIFIED Requirements

### Requirement: Upstream explore stance preserved

The system SHALL preserve upstream `/orbit:explore`'s "stance, not workflow" character — thinking-partner mode, no fixed steps, no mandatory outputs, no implementation.

The upstream portion of the explore body SHALL change only by the edits `reduce-orbit-phase2`'s R-rop2-13 rules (Sal,
2026-11-23: "ok to remove some of openspec's original stuff") and the table below names: illustrative text the stance
already states. This requirement is the named edit `orbit-conventions`' `Generated-file disposition` asks of a change to
an orbit-modified body's upstream portion. Each edit is named below, in the body generated at `9a122611`, and every other
line of the upstream portion is unchanged; a further removal is a further named edit, never this requirement read as a
general rule:

| member | covered by |
|---|---|
| "Handling Different Entry Points": its heading, its four dialogues (a vague idea, a specific problem, stuck mid-implementation, comparing options) and the `---` separator that closes it, the one before its heading staying between "What You Don't Have To Do" and "Ending Discovery" | removed (R-rop2-13): the stance bullets and "What You Might Do" carry what they illustrate |
| "What You Might Do": the `**Visualize**` label and its ASCII box | removed (R-rop2-13): the stance's "**Visual** - Use ASCII diagrams liberally when they'd help clarify thinking" says it |
| "Ending Discovery": the "What We Figured Out" summary template | removed (R-rop2-13); the sentence before it ("When it feels like things are crystallizing, you might summarize:") and the one after it ("But this summary is optional.") join as one: "When it feels like things are crystallizing, you might summarize what you figured out, but this summary is optional."; "Sometimes the thinking IS the value." stays |
| Guardrails: "Don't implement" | removed as restated: the opening's "**IMPORTANT: Explore mode is for thinking, not implementing.**" paragraph |
| Guardrails: "Don't rush", "Don't force structure" | removed as restated: the stance's "**Patient** - Don't rush to conclusions, let the shape of the problem emerge" |
| Guardrails: "Don't auto-capture" | kept: no single line states it at its scope, the whole skill ("Orbit Awareness" step 4's "Don't auto-capture" sits under "When a change exists") |
| Guardrails: "Do visualize" | removed as restated: the stance's "**Visual**" bullet |
| Guardrails: "Do explore the codebase" | removed as restated: the stance's "**Grounded** - Explore the actual codebase when relevant" |
| Guardrails: "Don't fake understanding", "Do question assumptions" | kept: no other line states either ("Including the user's and your own" adds to "Challenge assumptions") |

The table is sourced from the upstream portion's sections as generated at `9a122611`, read whole.

#### Scenario: Bare invocation

- **WHEN** the user invokes `/orbit:explore` with no argument and no orbit-specific capture trigger fires
- **THEN** the command behaves exactly as upstream: conversational think-mode, no file created

#### Scenario: Implementation guardrail preserved

- **WHEN** the user asks the command to implement code or apply features
- **THEN** the command refuses and reminds the user to exit explore mode (same as upstream); the opening's IMPORTANT
  paragraph, which states the refusal, is still in the body after the Guardrails line restating it is removed

#### Scenario: The illustrative upstream text is gone

- **WHEN** the explore skill is generated
- **THEN** it carries no "Handling Different Entry Points" heading, no `COLLABORATION SPECTRUM` dialogue, no ASCII box
  under a `**Visualize**` label and no `## What We Figured Out` template, and its Guardrails list carries exactly the
  three kept lines

#### Scenario: A removed Guardrails line's statement stays

- **WHEN** the explore skill is generated
- **THEN** each line the table names as a Guardrails restatement is still in the body: the opening's IMPORTANT
  paragraph and the stance's "Patient", "Visual" and "Grounded" bullets

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

The shipped skill carries TWO conforming exemplar entries, one per closure outcome (D-bcs-3, CLOSED, and D-bcs-12, BOUNDED with both residual slots — of the archived `bounded-closure-semantics` change), so the convention shows both shapes rather than describing them. They, the nine moves' table and the Mechanism entry grammar are carried by the skill's `references/mechanism-entries.md`, which the body reads before a Mechanism entry is written or edited (a rule captured, a Mechanism entry swept at a boundary, a resume adding the section); the body keeps which rules owe an entry, so a session knows when to read it (`reduce-orbit-phase2`'s `cut-explore-onboard`, D-inv-5).

#### Scenario: A rule's entry records all nine moves

- **WHEN** a live rule's Mechanism entry is written
- **THEN** it carries the `Domain:` table, the `Closure:` token (with both residual slots iff BOUNDED), and nine move lines each `applied — <what it found>` or `not applied — <reason>`, per the grammar

#### Scenario: A defect that fits no move grows the set through the trail

- **WHEN** a walk or review classifies a defect and no move names its failure mode
- **THEN** an `@review:` marker is left in the exploration and the finding is recorded against this requirement in the review emit; the table is edited only by a change to this requirement

#### Scenario: The exemplar conforms

- **WHEN** the explore skill is generated
- **THEN** each exemplar entry's lines in its `references/mechanism-entries.md` match the grammar's productions, the BOUNDED branch included — the generated-surface test asserts it, and the engine's form parse accepts the same entries under the grammar `orbit-emit-composition`'s `The explore grammar has one source in code` carries

#### Scenario: The body reads the grammar before writing an entry

- **WHEN** the explore skill is generated
- **THEN** its body names `references/mechanism-entries.md`, says to read it before a Mechanism entry is written or
  edited, and carries neither the nine moves' table nor an exemplar entry
