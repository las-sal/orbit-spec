## MODIFIED Requirements

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

The shipped body carries TWO conforming exemplar entries, one per closure outcome (D-bcs-3, CLOSED, and D-bcs-12, BOUNDED with both residual slots — of the archived `bounded-closure-semantics` change), so the convention shows both shapes rather than describing them.

#### Scenario: A rule's entry records all nine moves

- **WHEN** a live rule's Mechanism entry is written
- **THEN** it carries the `Domain:` table, the `Closure:` token (with both residual slots iff BOUNDED), and nine move lines each `applied — <what it found>` or `not applied — <reason>`, per the grammar

#### Scenario: A defect that fits no move grows the set through the trail

- **WHEN** a walk or review classifies a defect and no move names its failure mode
- **THEN** an `@review:` marker is left in the exploration and the finding is recorded against this requirement in the review emit; the table is edited only by a change to this requirement

#### Scenario: The exemplar conforms

- **WHEN** the explore body is generated
- **THEN** each exemplar entry's lines match the grammar's productions, the BOUNDED branch included — the generated-surface test asserts it, and the engine's form parse accepts the same entries under the grammar `orbit-emit-composition`'s `The explore grammar has one source in code` carries
