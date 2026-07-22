## ADDED Requirements

### Requirement: Engine-rendered report output with loose-form engagement

After persisting the run summary, the command SHALL produce its report by RUNNING
`orbit status --change <name> --report` and pasting the output VERBATIM as the report — the
body never hand-renders the structured sections (header, trend, scorecard, findings,
suppressions, gate/position/eligibility tail); hand-rendering them is PROHIBITED, and the
prohibition is greppable body text (the D1 imperative-label pattern). The reviewer's insight
travels as the emit's `commentary` field, rendered inside the report's delimited slot — never
as freestanding structured claims. The chat turn is LOOSE FORM: the pasted report grounds,
and unconstrained conversational engagement follows it (the report is the anchor, not the
whole voice); the conversation may not contradict the tail's engine-computed gate/position
lines. Architecture mode pastes its own trail's render when the surface supports it;
until then it keeps the shared scorecard shape with NO gate line (its no-gate contract is
unchanged).

#### Scenario: The report is the pasted render

- **WHEN** a proposal- or system-mode review completes and its emit is persisted
- **THEN** the chat report is the verbatim output of `orbit status --change <name> --report`, followed by free conversational remarks — never a hand-rendered scorecard or gate line

#### Scenario: Hand-rendering prohibition is greppable

- **WHEN** the generated review body is inspected
- **THEN** it contains the explicit prohibition on hand-rendering the structured report sections (grep-testable), alongside the run-and-paste instruction

## MODIFIED Requirements

### Requirement: Internal run summary persisted per mode

The system SHALL write a JSON run summary after each invocation: to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, iteration number, findings summary (counts by severity and by pass), and a `findings[]` array of full per-finding entries (severity / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md` — the shape `/orbit:address-reviews` maps to virtual markers on ingest and `orbit status --change <name> --report` renders

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section

#### Scenario: Commentary carried for the renderer

- **WHEN** a proposal- or system-mode summary is written with reviewer insight worth carrying
- **THEN** it rides the optional `commentary` field — and never asserts counts, verdicts, or next commands

### Requirement: Iteration note when prior runs exist

The system SHALL include a one-sentence iteration note in the report when prior run summaries exist for the same change and mode — COMPUTED BY THE RENDERER from the trail (per `orbit-report-rendering`'s render-time-context requirement), never authored by the reviewing AI; in architecture mode — where summaries share the `orbit/architecture/.orbit-runs/` trail — iteration is anchored to prior `review-architecture-*.json` emits whose `doc` field matches the doc under review.

#### Scenario: Subsequent run on same change in same mode

- **WHEN** the command runs and `.orbit-runs/` contains at least one prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the rendered report includes the trail-computed note (repeat/new finding counts and the severity trend) — sourced from the prior emits, not from anything the reviewing AI wrote

#### Scenario: First run for a mode on a change

- **WHEN** the command runs and `.orbit-runs/` contains no prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the report omits the iteration note, or notes "First proposal-mode run for this change." / "First system-mode run for this change."

#### Scenario: Architecture-mode iteration anchored per doc

- **WHEN** an architecture-mode review runs and the architecture trail contains prior `review-architecture-*.json` emits, some with a matching `doc` field and some for other docs
- **THEN** only the matching-`doc` emits count toward the iteration number and the iteration note
