## ADDED Requirements

### Requirement: Six moves applied per rule in the Mechanism section

The system SHALL treat the Mechanism section as the record of SIX MOVES applied to each RULE in Decisions. The set is DERIVED from the parts of a mechanism — an assembly of parts computing outputs from inputs under constraints — so each part is a way the mechanism can be wrong:

| part of the mechanism | the way it goes wrong | move |
|---|---|---|
| the facts it cites | the fact is not true | **READ** |
| its input domain | a member it ranges over is unhandled | **ENUMERATE** |
| its own parts | two of them assume incompatible things | **COHERE** |
| its computation | wrong output on a member it does handle | **EXECUTE** |
| its purpose | it is correct and still misses a class of defect | **FALSIFY** |
| its context | it violates a standing ruling | **CONFORM** |

Two of these are EXISTING obligations that nothing enforced at explore time: READ is the read-before-reference discipline, and ENUMERATE is `orbit-conventions`' closure requirement, itself the explore-time form of the decision-table corollary. The stage's contribution is to make them checkable where the mechanism is authored rather than where it is reviewed.

EXECUTE is NOT the primary move and SHALL NOT be treated as sufficient. An executed case demonstrates ONE PATH through a rule; the program's record shows that eleven of one stage's fifteen CRITICALs were READ, ENUMERATE or COHERE failures and ZERO were EXECUTE failures — every executed case ran correctly on the path it walked.

#### Scenario: A rule's Mechanism entry records all six moves

- **WHEN** a RULE is captured in Decisions and its Mechanism entry is written
- **THEN** the entry records, for that rule: the facts it cites and how each was verified, its domain's closed enumeration with the declared closure form, whether its parts were checked against each other, at least one executed case with a concrete input and the output it produced, the class of defect it does not catch, and which standing rulings were checked

#### Scenario: An executed case does not substitute for a closed domain

- **WHEN** a rule's Mechanism entry carries an executed case but no closed enumeration of its domain
- **THEN** the rule is not satisfied, because an executed case covers the path it walked and says nothing about the members it did not

### Requirement: Re-entry resumes in place for a promoted name

The system SHALL resume in place when `/orbit:explore <name>` resolves to an ACTIVE CHANGE rather than a staging directory: the exploration continues against `orbit/changes/<name>/explore.md`, and the body SAYS SO. It SHALL NOT scaffold a second staging directory at `orbit/explore/<name>/`.

R-crc-6 routes REDESIGN back to explore, and a change that has been promoted no longer has a staging directory — `/orbit:propose` moved it. Scaffolding a fresh one would put a second `explore.md` beside the authoritative one, which is the second-claim-on-one-truth condition that propose's own metadata merge refuses when it discards the staged `.openspec.yaml`.

#### Scenario: A promoted name resumes against the change directory

- **WHEN** `/orbit:explore <name>` is invoked and `orbit/changes/<name>/explore.md` exists while `orbit/explore/<name>/` does not
- **THEN** the session resumes against the change directory's `explore.md`, states that it is doing so, and creates no staging directory

#### Scenario: An unpromoted name behaves as before

- **WHEN** `/orbit:explore <name>` is invoked and no active change of that name exists
- **THEN** Mode B proceeds unchanged — the staging directory is created or resumed as today
