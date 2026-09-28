## MODIFIED Requirements

### Requirement: Architecture staleness check

The Category 3 (cross-doc consistency) scan SHALL additionally check parseable architecture docs
against engine-computed reality — "a stale architecture doc is the most expensive drift there is"
(D-arc Stage D2): (a) prose in a stage section that contradicts the stage's computed state (e.g.
"awaits the user's propose" while a citing change is active) → WARNING; (b) a ratified
`Complete: [x]` mark on a stage whose observed state is not quiescent — live citing work OR no
citing artifacts at all (`premised`) → CRITICAL (the completion claim is falsified, or
unsupported, by observation), and an ended `Complete: [~]` mark on a stage with LIVE citing work —
an active change or a live explore; `premised` and `concluded` are consistent with an ended mark —
→ CRITICAL (the composition rule is `orbit-architecture-engine`'s; this check consumes it and
restates none of it); (c) a hand-written state line (`*State:*`
form) in a parseable doc → WARNING (state is computed, never stored — flag for deletion);
(d) dangling `architecture:` citations in change/explore metadata (either level) → CRITICAL
(change citations also fail `orbit validate <change>`; explore citations have no validating
surface and are caught ONLY here). Check (d)
scans change/explore metadata INDEPENDENTLY of doc presence — a typo'd `doc:` name can itself
create the no-parseable-docs condition, and must not suppress its own detection. Only the
doc-side checks (a)–(c) are skipped when no parseable architecture docs exist, with the note
`no parseable architecture docs; skip architecture staleness (doc-side)`. Architecture content is NEVER flagged for having originated
outside an architect session (flow-entry ruling).

#### Scenario: Falsified completion mark flagged

- **WHEN** the audit scans a doc whose stage carries `Complete: [x]` while an active change cites that stage
- **THEN** a CRITICAL finding names the stage, the mark, and the citing change

#### Scenario: Ended mark contradicted by live work flagged

- **WHEN** the audit scans a doc whose stage carries `Complete: [~]` while an active change or a live explore cites that stage
- **THEN** a CRITICAL finding names the stage, the mark, and the live citing artifact

#### Scenario: Ended mark on a premised stage is not flagged

- **WHEN** the audit scans a doc whose stage carries `Complete: [~]` and no artifact cites it
- **THEN** no finding is raised — the engine renders `ended`, and the check consumes that rule

#### Scenario: Hand-written state line flagged

- **WHEN** a parseable doc contains a `*State:*`-form hand-written state line
- **THEN** a WARNING finding recommends deleting it in favor of the computed readout

#### Scenario: No architecture docs, doc-side skip only

- **WHEN** the repo has no parseable architecture docs and no change/explore metadata carries an `architecture:` citation
- **THEN** the doc-side checks are skipped with a note and no findings are raised

#### Scenario: Dangling citation detected even with zero parseable docs

- **WHEN** the repo has no parseable architecture docs BUT a change's metadata cites `architecture: {doc: missing-doc, stage: x}`
- **THEN** check (d) still runs and raises the CRITICAL dangling-citation finding (the skip never suppresses citation scanning)
