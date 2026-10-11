## ADDED Requirements

### Requirement: Stage line in the archive completion readout

The archive completion output SHALL include a stage line when the archived change's metadata
carries an `architecture:` citation: after the move, render the cited stage's post-archive
computed position from `orbit architecture status` (e.g. `stage d2-architect: now quiescent —
completion is yours to ratify`, or `stage d6-pr-lifecycle: still in-change — <other-change>
remains active`). One line riding the existing position render — no prompt, no doc edit, no new
mechanism (D-arc D-d2-4: the readout is the reminder; ratification happens in an architect
session or by hand, never here). Uncited changes see no stage line.

#### Scenario: Quiescent stage surfaced at archive

- **WHEN** a change citing `{doc, stage}` archives and no other live work cites that stage
- **THEN** the completion readout includes the stage line reporting quiescent-awaiting-ratification (or `complete` if already ratified)

#### Scenario: Uncited change unchanged

- **WHEN** a change without an `architecture:` citation archives
- **THEN** the completion readout contains no stage line and is byte-identical to pre-D2 behavior
