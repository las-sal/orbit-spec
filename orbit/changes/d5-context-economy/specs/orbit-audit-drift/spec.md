## ADDED Requirements

### Requirement: Touchpoints divergence check

Audit-drift SHALL check, for each active change whose design.md carries a `## Touchpoints`
section and whose apply has commits, the set difference between the PREDICTED map (the section)
and the ACTUAL map (the engine-computed diff from the change's first commit) — the two
representations of one fact the D5 split makes cross-validatable (the D4 scorecard-rollup
pattern). Files in actual-but-not-predicted are surfaced as scope-drift findings (WARNING when
substantive source paths, SUGGESTION for tests/docs riding along); files
predicted-but-never-touched surface at pre-archive context as SUGGESTION (the plan overshot —
informational). The check is mechanical set arithmetic on engine-computed inputs; no prose is
consulted beyond the section's file list, and changes without the section or without commits
are skipped silently (pre-capability changes are not findings).

#### Scenario: Actual exceeds predicted

- **WHEN** a change's diff touches `src/core/gates.ts` but the design.md Touchpoints section never names it
- **THEN** audit-drift reports a scope-drift finding naming the file and both maps' sources

#### Scenario: Pre-capability change skipped

- **WHEN** an active change's design.md has no Touchpoints section
- **THEN** the check is skipped for that change with no finding and no warning

### Requirement: Emit attestation cross-check

Audit-drift SHALL cross-check, for each staging exploration with emits, the most recent explore
emit's engine-computed counts (`decisions_captured`, `open_questions_count`,
`open_questions_with_recommendation`) against a fresh parse of the CURRENT `explore.md`
(leak-hardening layer 3's closing loop — D-arc Stage D5). A mismatch is a WARNING naming both
values and the file: either the file changed after the last boundary emit (a session ended
without its sweep/emit) or an emit was produced outside the engine surface. Open-question
entries missing the `Standing recommendation:` slot are reported per the five-section format
(SUGGESTION — the explore body corrects them on next touch).

#### Scenario: Counts drifted since the last emit

- **WHEN** `explore.md` carries 5 decisions but the newest explore emit records `decisions_captured: 3`
- **THEN** audit-drift reports a WARNING naming both counts and the staleness interpretation (un-emitted session or out-of-surface emit)

#### Scenario: Missing standing-recommendation slot

- **WHEN** an open-question entry has no `Standing recommendation:` line
- **THEN** audit-drift reports a SUGGESTION naming the entry
