## ADDED Requirements

### Requirement: Four size figures are computed from the change's artifacts

The engine SHALL compute four figures for an active change, from artifacts it already reads and from nothing else:

| figure | computed as |
|---|---|
| `capabilities` | the number of `specs/<capability>/spec.md` files in the change directory; a capability directory with no `spec.md` is not counted |
| `requirements` | the entries `parseDeltaSpec` returns, summed over every capability: ADDED + MODIFIED + REMOVED + RENAMED, except that a MODIFIED block under a RENAMED entry's new name is not counted a second time |
| `changed_bytes` | the NEW side of the delta, per the table below |
| `tasks` | every checkbox in `tasks.md` the tracked gate's own counter (`parseCheckboxes`) reads, checked or not; no `tasks.md` reads zero |

`changed_bytes` counts, for every construct a delta spec carries:

| construct | bytes counted |
|---|---|
| an ADDED block | its full UTF-8 bytes |
| a MODIFIED block matched by name to a requirement of the current baseline `orbit/specs/<capability>/spec.md` | the bytes, newline included, of its lines that are absent from that baseline block, counted as a MULTISET: a line present k times in the baseline block absorbs at most k occurrences |
| a MODIFIED block under a RENAMED entry's new name | the same, against the baseline block of the OLD name |
| a MODIFIED block whose name matches no baseline requirement, or whose capability has no baseline file | its full bytes |
| a REMOVED or RENAMED entry | zero |
| a deleted line of a MODIFIED block | not counted |
| fenced content inside a block | part of that block, as `parseDeltaSpec`'s fence mask delimits it |
| text outside requirement blocks | not counted |

The table is the delta format's four section kinds, as `parseDeltaSpec`'s `DeltaPlan` defines them, plus the text
outside its blocks. Deletions are not counted, per R-crc-1's 2026-09-23 clarification: the byte figure measures new
text, and a retirement that deletes much and adds little reads small. The multiset under-counts only a line that
MOVED within a block, which reads as unchanged. Over the 227 MODIFIED blocks of 35 archived changes it matched
git's diff on 221 blocks and was never more than 1.3% off on a change. A baseline that moved since propose is
`orbit-base-fingerprints`' concern, not this figure's.

#### Scenario: An ADDED block counts whole

- **WHEN** a change's only delta is one ADDED block of 1,200 bytes
- **THEN** `changed_bytes` is 1200, `requirements` is 1 and `capabilities` is 1

#### Scenario: A MODIFIED block counts only its new lines

- **WHEN** a MODIFIED block reproduces its 5,000-byte baseline requirement and changes one 80-byte line
- **THEN** `changed_bytes` counts that one new line's bytes and nothing for the 4,920 carried bytes or the deleted line

#### Scenario: A repeated line is absorbed once per baseline occurrence

- **WHEN** a baseline block carries a line once and its MODIFIED block carries that line twice
- **THEN** the second occurrence counts as new

#### Scenario: A renamed and modified requirement counts once

- **WHEN** a delta renames a requirement and carries a MODIFIED block under its new name
- **THEN** `requirements` counts the pair once, and the block is diffed against the old name's baseline block

#### Scenario: Tasks are counted by the tracked gate's counter

- **WHEN** `tasks.md` carries 12 checked and 5 unchecked checkboxes and one checkbox inside a fenced block
- **THEN** `tasks` is 17

#### Scenario: A change with no tasks file reads zero tasks

- **WHEN** a change carries specs but no `tasks.md`
- **THEN** `tasks` is 0 and the other three figures are computed

### Requirement: The ceiling is opt-in by the size_ceiling config key

The size check SHALL be ON only when `orbit/config.yaml` carries a `size_ceiling` map with at least one valid entry.
Its four optional keys are `capabilities`, `requirements`, `changed_bytes` and `tasks`, each a positive integer
maximum; a figure is a BREACH when it is STRICTLY GREATER than its maximum. The shapes form this table:

| `size_ceiling` | outcome |
|---|---|
| absent, or no config file, or an unparseable config file | OFF, silently |
| not a mapping (a scalar, a list, `null`) | OFF, with one warning naming the shape |
| a mapping entry whose key is not one of the four | ignored, with one warning naming the key |
| an entry whose value is not a positive integer | that dimension ignored, with one warning naming the dimension and the value |
| a mapping with no valid entry | OFF |
| a valid entry | that dimension is compared |
| a dimension with no entry | not compared |

The key is read ON ITS OWN: validate and status read only `size_ceiling` from `orbit/config.yaml` and SHALL NOT print
a warning about any other field. Nothing is on by default: the maxima are a project's ruling, and R-crc-1 is this
repository's.

#### Scenario: An absent key leaves validate unchanged

- **WHEN** `orbit/config.yaml` has no `size_ceiling` key and a change carries six capabilities
- **THEN** `orbit validate <change>` reports nothing about size

#### Scenario: A partial map compares only its dimensions

- **WHEN** `size_ceiling` is `{capabilities: 3}` and a change carries 4 capabilities and 30 tasks
- **THEN** the capabilities figure is a breach and the tasks figure is not compared

#### Scenario: A figure at its maximum is not a breach

- **WHEN** `size_ceiling.tasks` is 19 and a change carries 19 tasks
- **THEN** tasks is not a breach

#### Scenario: A malformed entry is ignored with a warning

- **WHEN** `size_ceiling` is `{tasks: 0, requirements: 12}`
- **THEN** one warning names `tasks` and its value, and only `requirements` is compared

#### Scenario: A non-mapping value turns the check off

- **WHEN** `orbit/config.yaml` carries `size_ceiling: 40`
- **THEN** the check is OFF and one warning names the shape

### Requirement: A breach is declared in the proposal's Size section

A change SHALL declare a breach in a `## Size` section of its `proposal.md`, one list item per breached dimension, by
this production:

```
## Size
- <dimension>: <reason>        <dimension> ::= capabilities | requirements | changed_bytes | tasks; <reason> non-empty
```

The section is read fence-aware through the engine's shared CommonMark fence tracker, and every line kind under it
resolves by this table:

| line under `## Size` | reading |
|---|---|
| a list item `- <dimension>: <reason>` with a known dimension and a non-empty reason | DECLARES that dimension |
| a list item with an unknown dimension, no colon, or an empty reason | MALFORMED, naming the line; it declares nothing |
| a second item for an already-declared dimension | DUPLICATE, naming the line; the first item declares |
| a continuation line or nested bullet under an item | part of that item's reason |
| prose that is not a list item | not read |
| fenced content | not read |
| a second `## Size` heading | merged with the first |
| the section's end | the next heading of level 1 or 2, or end of file |

The engine reads WHICH dimensions are declared and never what a reason says: whether a breach is justified, and where
to split instead, stay the author's and the user's judgement (R-crc-10). Declaring a dimension that is not over is
legal and reads STALE.

#### Scenario: One item declares one dimension

- **WHEN** `proposal.md` carries `## Size` with the item `- capabilities: the ladder needs its owner and every restating surface`
- **THEN** `capabilities` is declared

#### Scenario: An unknown dimension is malformed

- **WHEN** the section carries `- caps: four`
- **THEN** that line is reported MALFORMED and declares nothing

#### Scenario: A fenced example declares nothing

- **WHEN** the section carries a fenced block containing `- tasks: example`
- **THEN** `tasks` is not declared

### Requirement: Validate reports each breach as declared or undeclared

With the size check ON, `orbit validate <change>` SHALL report each configured dimension by this table, every issue
carrying the path `size` and naming the dimension, its figure and its maximum:

| state | level |
|---|---|
| figure at or under its maximum, not declared | nothing |
| figure over its maximum, declared | INFO: "declared" |
| figure over its maximum, not declared | WARNING: "undeclared" |
| figure at or under its maximum, declared | INFO: the declaration is stale |
| a MALFORMED or DUPLICATE `## Size` line | WARNING naming the line |
| `proposal.md` absent, or no `## Size` section | nothing declared: every breach is undeclared |

Non-strict validation therefore never fails on size, and `orbit validate <change> --strict` fails exactly when an
undeclared breach or a malformed declaration stands. Human-mode `orbit validate <change>` SHALL print every `size`
issue beneath the `is valid` line when the report is valid, as it prints the scenario map's INFO lines; a report
carrying no `size` issue prints exactly as before. With the check OFF the capability contributes no issue. The level
REPORTS; no gate reads it (R-crc-13).

#### Scenario: An undeclared breach fails strict validation

- **WHEN** the check is ON with `capabilities: 3` and a change touches four capabilities with no `## Size` section
- **THEN** `orbit validate <change>` passes and prints a WARNING naming capabilities, 4 and 3, and `orbit validate <change> --strict` fails

#### Scenario: A declared breach passes strict validation

- **WHEN** the same change's proposal carries `## Size` with a `capabilities` item
- **THEN** `orbit validate <change> --strict` passes and prints an INFO line naming capabilities, 4, 3 and "declared"

#### Scenario: A change that grows past a declaration fails again

- **WHEN** a change declared over on capabilities later gains a twentieth task with `tasks: 19` configured
- **THEN** `--strict` fails on the undeclared tasks breach

#### Scenario: A stale declaration is INFO

- **WHEN** the proposal declares `requirements` and the change touches 8 requirements against a maximum of 12
- **THEN** validate reports an INFO naming the declaration stale and `--strict` passes

### Requirement: Status carries the size figures

`orbit status --change <name> --json` SHALL carry a top-level `size` object on every change: `capabilities`,
`requirements`, `changed_bytes` and `tasks` as numbers, `ceiling` (the valid configured maxima, or `null` when the
check is OFF), and `breaches`, a list of `{dimension, figure, maximum, declared}` (empty when the check is OFF). The
figures are carried whether or not the check is ON, because effort is RECORDED (R-crc-11(h)).

Human-mode `orbit status --change <name>` SHALL print one `Size:` line when the check is ON, and none when it is OFF.
The line states the four figures ALONE, then each breach as `<dimension> <figure> > <maximum>` with `declared` or
`undeclared`, or `none over`; it renders no ratio and no proximity. The figures never enter gate state, the position
readout or the canonical next.

#### Scenario: JSON carries the figures with the check off

- **WHEN** `size_ceiling` is absent
- **THEN** `orbit status --change <name> --json` carries `size` with the four figures, `ceiling: null` and `breaches: []`

#### Scenario: The human line names a breach

- **WHEN** the check is ON with `tasks: 19` and a change carries 22 tasks with no declaration
- **THEN** the `Size:` line states the four figures and `tasks 22 > 19 undeclared`

#### Scenario: Size never moves a gate

- **WHEN** a change's figures move from under to over every maximum
- **THEN** every gate row, the position readout and `next_command` are unchanged
