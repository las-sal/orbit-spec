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

### Requirement: Final assessment phrasings depend on mode

The final-assessment, gate, position, and eligibility lines of proposal- and system-mode review reports SHALL be the ENGINE-RENDERED TAIL of the pasted report (per `orbit-report-rendering`): the renderer computes them from the on-disk trail and gate graph — which includes the just-completed pass, because the run summary is PERSISTED BEFORE the report renders — and the reviewing AI authors none of them. The convergence branch routing formerly enumerated in this requirement (ordered-slot coverage, unresolved-pass precedence, confirm predicates, the five external-dimension states) lives where it always computed: `orbit-engine-gates`' reviewed-gate model, whose computed state, reason, and single-voiced canonical next command the renderer prints verbatim; the exact rendered phrasings are the renderer's fixed grammar, pinned by golden tests, following the eligibility-phrasing rule (`Ready when you are:`, ` — user-invoked` markers preserved, never an imperative label). The as-of-completion synthetic-pass computation is RETIRED: persist-first ordering makes the on-disk computation complete, so `orbit status`, `orbit instructions`, and the report tail all read the same pure function of the trail with no interval where surfaces disagree. The `--as architecture` mode is NOT covered by this requirement — its gate-less final assessment is specified by the `Architecture-mode final assessment has no gate` requirement (D-arc Stage D2).

#### Scenario: Persist-first ordering replaces the synthetic pass

- **WHEN** a proposal- or system-mode review completes
- **THEN** the `review-<mode>-<TS>.json` emit is written BEFORE the report renders, and the rendered tail's gate computation naturally includes the just-persisted pass — no synthetic-pass machinery, and no window where status and the report disagree

#### Scenario: The tail is the engine's verdict verbatim

- **WHEN** the pasted report's final lines render
- **THEN** the gate line, position readout, and canonical next command come from the engine's computed state (single-voiced, eligibility-phrased, ` — user-invoked` markers preserved) — the reviewing AI cannot author a verdict, and a hand-authored assessment line never appears in a change-mode report

### Requirement: Internal run summary persisted per mode

The system SHALL write a JSON run summary after each invocation: to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts: `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer — the `/orbit:address-reviews <change> --from-file <this emit's own path>` invocation when the pass has findings, the `orbit status --change <change> --report` render pointer when clean (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, iteration number, findings summary (counts by severity and by pass), and a `findings[]` array of full per-finding entries (severity / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md` — the shape `/orbit:address-reviews` maps to virtual markers on ingest and `orbit status --change <name> --report` renders

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section

#### Scenario: Commentary carried for the renderer

- **WHEN** a proposal- or system-mode summary is written with reviewer insight worth carrying
- **THEN** it rides the optional `commentary` field — and never asserts counts, verdicts, or next commands

#### Scenario: Spine fields carry deterministic facts under persist-first

- **WHEN** a proposal-mode pass with 1 warning and 3 suggestions persists its emit
- **THEN** `final_assessment` reads `0 critical, 1 warning, 3 suggestion.` and `next_recommended` is the `/orbit:address-reviews <change> --from-file <own path>` pointer — no gate verdict, no eligibility judgment; a clean pass instead points `next_recommended` at the `orbit status --change <change> --report` render

### Requirement: Iteration note when prior runs exist

The system SHALL include a one-sentence iteration note in the report when prior run summaries exist for the same change and mode — for proposal and system modes, COMPUTED BY THE RENDERER from the trail (per `orbit-report-rendering`'s render-time-context requirement), never authored by the reviewing AI; architecture mode — which has no render surface yet — stays on the interim hand-computed path (per the engine-rendered-report requirement's architecture carve-out), its iteration anchored to prior `review-architecture-*.json` emits in the shared `orbit/architecture/.orbit-runs/` trail whose `doc` field matches the doc under review.

#### Scenario: Subsequent run on same change in same mode

- **WHEN** the command runs and `.orbit-runs/` contains at least one prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the rendered report includes the trail-computed note (repeat/new finding counts and the severity trend) — sourced from the prior emits, not from anything the reviewing AI wrote

#### Scenario: First run for a mode on a change

- **WHEN** the command runs and `.orbit-runs/` contains no prior `review-<mode>-<TS>.json` matching the current mode
- **THEN** the rendered report notes exactly `First <mode>-mode review of this change.` — one deterministic form (the baseline's omit-or-note disjunction is retired; a byte-identical renderer picks one)

#### Scenario: Architecture-mode iteration anchored per doc

- **WHEN** an architecture-mode review runs and the architecture trail contains prior `review-architecture-*.json` emits, some with a matching `doc` field and some for other docs
- **THEN** only the matching-`doc` emits count toward the iteration number and the iteration note

### Requirement: Pushback discipline on stale findings

The system SHALL verify each finding against current state before reporting it, regardless of mode.

#### Scenario: Stale finding suppressed

- **WHEN** an internal pass would produce a finding for an issue already resolved in current state (verified via `grep`, `git log`, or file inspection)
- **THEN** the finding is suppressed with an explanatory note ("stale finding suppressed: <evidence>") and excluded from the report's ACTIVE findings and severity counts — it appears ONLY in the rendered report's dedicated suppressed-with-evidence section (per `orbit-report-rendering`'s report grammar; suppression removes a finding from the scorecard, not from the audit record)

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (all modes — proposal, system, and architecture) that runs the main pass work in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; `--fresh` affects only where pass work executes. A fresh-context pass fills the review cadence's independent slot (per `orbit-engine-gates`' reviewed-gate model) as the lighter-weight alternative to `/orbit:review-external` (same model, fresh context, no cross-AI handoff) — the relationship the engine's computed canonical next command reflects when the cadence needs an independent pass.

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh`
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object
