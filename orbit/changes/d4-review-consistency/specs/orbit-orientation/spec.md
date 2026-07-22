## MODIFIED Requirements

### Requirement: Bare `orbit status` renders the current sprint

Bare `orbit status` (no `--change`, no `--full`) SHALL render the CURRENT-SPRINT view when at
least one live workstream exists: the sprint strip (per the strip-composition requirement), a
`last` line (the sprint workstream's most recent emit as `command · relative time` plus its
`final_assessment` trimmed to the first sentence, hard cap ~160 characters with ellipsis), a
`next` line (per the recommendation-sourcing requirement), and ONE `also` line naming other
live workstreams (`name (phase)`) and any waiting-on-you items (per the waiting requirement).
The view is a COMPOSITION of engine-computed and trail-recorded data only — it SHALL NOT infer
state from artifact contents (no task-file parsing beyond what the gate graph already computes,
no marker scans, no mtime heuristics). Bare invocation with active changes is, before this
capability, an error path ("Missing required option --change") — claiming it repurposes
nothing; the no-active-changes message and the PRE-EXISTING `--change` surface are
byte-identical to pre-capability output (later capabilities may EXTEND the `--change` form
with new flags — e.g. `--report`, D-arc Stage D4 — without touching its pre-existing outputs).

#### Scenario: Bare invocation mid-sprint

- **WHEN** `orbit status` runs with one active change mid-apply and no other live workstreams
- **THEN** the output shows that change's sprint strip, its latest emit as `last`, the engine's `next_command` as `next`, and an `also` line reporting no other active work plus any waiting items — and nothing requires opening an artifact to understand

#### Scenario: Error path claimed, neighbors unchanged

- **WHEN** `orbit status` runs with active changes present (formerly the "Missing required option --change" error) and separately with `--change <name>` and with zero changes
- **THEN** the bare invocation renders the sprint view (exit 0); the `--change` output and the no-active-changes message are unchanged from pre-capability behavior

#### Scenario: No live inference beyond engine and trail

- **WHEN** the orientation surface composes any view
- **THEN** its data sources are limited to: the change-status computation (`position`/`next_command`/gates/task counts), architecture stage-state computation, workstream directory presence, metadata citations, and `.orbit-runs/` emit files — never artifact-content parsing; and the surface is READ-ONLY — it creates and modifies no files
