## ADDED Requirements

### Requirement: Architecture staleness check

The Category 3 (cross-doc consistency) scan SHALL additionally check parseable architecture docs
against engine-computed reality — "a stale architecture doc is the most expensive drift there is"
(D-arc Stage D2): (a) prose in a stage section that contradicts the stage's computed state (e.g.
"awaits the user's propose" while a citing change is active) → WARNING; (b) a ratified
`Complete: [x]` mark on a stage with live citing work (active change or live explore) → CRITICAL
(the completion claim is falsified by observation); (c) a hand-written state line (`*State:*`
form) in a parseable doc → WARNING (state is computed, never stored — flag for deletion);
(d) dangling `architecture:` citations in change/explore metadata (either level) → CRITICAL
(they also fail validation; the audit catches ones written since the last validate). When no
parseable architecture docs exist, the check is skipped with the note `no parseable architecture
docs; skip architecture staleness`. Architecture content is NEVER flagged for having originated
outside an architect session (flow-entry ruling).

#### Scenario: Falsified completion mark flagged

- **WHEN** the audit scans a doc whose stage carries `Complete: [x]` while an active change cites that stage
- **THEN** a CRITICAL finding names the stage, the mark, and the citing change

#### Scenario: Hand-written state line flagged

- **WHEN** a parseable doc contains a `*State:*`-form hand-written state line
- **THEN** a WARNING finding recommends deleting it in favor of the computed readout

#### Scenario: No architecture docs, clean skip

- **WHEN** the repo has no parseable architecture docs
- **THEN** the architecture staleness check is skipped with a note and no findings
