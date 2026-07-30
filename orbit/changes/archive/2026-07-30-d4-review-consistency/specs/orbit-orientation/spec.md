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

### Requirement: Sprint strip composition

The sprint strip SHALL render the lifecycle as one line of phase chips —
`explore → propose → review ⟲ → apply → review ⟲ → archive` — with states from the gate graph
plus an `explore` phase the graph does not model: `explore ✓` when the workstream is a change
containing `explore.md` (a consumed exploration), `explore ▶` when the workstream IS a staging
explore (later phases render pending), and the chip absent when the change has no `explore.md`
(standalone-mode propose). Review phases render as ONE chip each with the iteration count from
the workstream's trail on the SHARED PASS AXIS (D-arc Stage D4 — the same axis the report
ordinal counts, so "iteration" means ONE thing across surfaces): `review ⟲7 ✓` = six
SPINE-VALID `review` emits of mode `proposal` PLUS one confident
`external-proposal-<TS>.md` findings file in the trail, gate passed. The fault-isolation skip
applies to the internal count exactly as it does to recency and WAITING (a spine-invalid
`review-proposal-*.json` file counts nowhere); external findings files count under the
report-rendering capability's lenient confidence gate (header plus all three severity
sections — an unreadable or unconfident file contributes nothing);
apply renders the tracked gate's progress (`apply ▶ 12/20`); phase glyphs are `✓` (passed/
complete — the engine's SUPERSEDED `(past)` state renders `✓`-equivalent by design), `▶`
(current), `⟲N` (review iterations), and unmarked (pending — the engine's `stale` and `unpassed`
states render unmarked in the strip, with the WAITING band carrying the gate's reason; the
renderer makes no judgment calls beyond this closed mapping). The strip carries
the workstream name and, when its metadata cites a stage, `stage <id> · <doc>`.

#### Scenario: Strip for a staging explore

- **WHEN** the current sprint is a staging explore with two boundary emits
- **THEN** the strip reads `explore ▶ → propose → review ⟲ → apply → review ⟲ → archive` with only the explore chip active

#### Scenario: Strip mid-apply with review history

- **WHEN** the current sprint is a change whose trail holds six proposal-review emits, whose review-proposal gate is past, and whose apply gate reports 12/20 tasks
- **THEN** the strip reads `explore ✓ → propose ✓ → review ⟲6 ✓ → apply ▶ 12/20 → review ⟲ → archive` (explore chip present because explore.md was consumed into the change)

#### Scenario: External passes count in the chip

- **WHEN** a change's trail holds two spine-valid system-review emits and one confident `external-system-<TS>.md` findings file
- **THEN** the system review chip renders `review ⟲3` — the same count the report ordinal would assign the newest pass — while a directory with an unreadable or section-incomplete external file adds nothing
