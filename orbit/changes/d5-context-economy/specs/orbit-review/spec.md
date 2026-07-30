## MODIFIED Requirements

### Requirement: Review command available with `--as` mode flag

The system SHALL expose a single `/orbit:review` command that runs an editorial review. The `--as proposal` flag reviews a change's pre-implementation artifacts (proposal/design/specs/tasks); the `--as system` flag reviews the whole product state after a change has been applied; the `--as architecture` flag reviews an architecture doc (the positional resolves to a doc name under `orbit/architecture/`, not a change name — D-arc Stage D2). The command additionally carries the REVIEWER-CLASS axis (D-arc Stage D5): `--reviewer in-context|fresh|external` (default `in-context`; `--fresh` remains as shorthand for `--reviewer fresh`) — the same three-class vocabulary the gate cadence, the emit `reviewer_class` field, and the report header already share. `--reviewer external` dispatches to the external-handoff branch (packaging a prompt for an external AI per `orbit-review-external`'s requirements — the behavior formerly invoked as the separate `/orbit:review-external` command), whose full instructions load from `references/external-handoff.md` ONLY when that class is selected. The per-mode pass definitions likewise load from per-mode references (`references/passes-<mode>.md`) for the RESOLVED mode only — the body carries the shared trunk (resolution, disciplines, persistence, render protocol), and a run loads only the material its mode and reviewer class need.

#### Scenario: Invoke with change name and explicit mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal` or `/orbit:review <change-name> --as system`
- **THEN** the command reads the change's artifacts, loads the resolved mode's pass reference, and runs the appropriate set of passes for that mode

#### Scenario: Invoke architecture mode with doc name

- **WHEN** the user invokes `/orbit:review --as architecture <doc-name>`
- **THEN** the command resolves `<doc-name>` against `orbit/architecture/` (prompting via `AskUserQuestion` over parseable docs when omitted or ambiguous) and runs the architecture passes; a `<doc-name>` resolving to a LEGACY doc (zero stage-prefixed headings) is an error suggesting retrofit, and one resolving to a MALFORMED doc (fails `orbit architecture validate`'s near-miss rule) is an error naming the grammar violation — architecture mode requires a parseable doc

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review` with no argument (proposal/system context)
- **THEN** the command runs `orbit list --json`, presents the active changes via `AskUserQuestion`, and uses the user's selection as the change scope

#### Scenario: Mode inference when `--as` omitted

- **WHEN** the user invokes `/orbit:review <change-name>` without `--as`
- **THEN** the command infers the mode from `tasks.md` state: ALL task boxes unchecked → `proposal`; all tasks checked and code exists → `system`; ambiguous (mixed checked/unchecked, or checked without visible code changes) → prompt the user via `AskUserQuestion` to pick; the inferred mode is shown in the report header. Architecture mode is NEVER inferred — it requires the explicit `--as architecture` flag (a positional that happens to match a doc name does not trigger it)

#### Scenario: External reviewer class dispatches to the handoff branch

- **WHEN** the user invokes `/orbit:review <change-name> --as system --reviewer external`
- **THEN** the command loads `references/external-handoff.md` and performs the packaging flow (prompt file + T0 emit + chat invocation snippet) per `orbit-review-external`'s requirements — no review passes run in this invocation, and the internal-class branches never load the external reference

#### Scenario: Per-mode reference loading

- **WHEN** a proposal-mode review runs
- **THEN** the body loads `references/passes-proposal.md` and does NOT load the system or architecture pass references — pass CONTENT is unchanged by the split (an organizational move only)

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (all modes — proposal, system, and architecture) as shorthand for `--reviewer fresh` (D-arc Stage D5): the main pass work runs in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; the flag affects only where pass work executes. A fresh-context pass fills the review cadence's independent slot (per `orbit-engine-gates`' reviewed-gate model) as the lighter-weight alternative to the external reviewer class (`--reviewer external` — same model, fresh context, no cross-AI handoff) — the relationship the engine's computed canonical next command reflects when the cadence needs an independent pass.

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh` (or the equivalent `--reviewer fresh`)
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object and `reviewer_class: "fresh"` on the emit

### Requirement: Internal run summary persisted per mode

The system SHALL persist a JSON run summary after each invocation VIA THE ENGINE EMIT SURFACE (`orbit emit review` per `orbit-emit-composition` — D-arc Stage D5; the body composes ONLY the narrative payload and never hand-writes the JSON, hand-composition being the two-voices seam the surface closes): to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts — and the emit surface COMPOSES them (the payload cannot supply them): `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer — the `/orbit:address-reviews <change> --from-file <this emit's own path>` invocation when the pass has findings, the `orbit status --change <change> --report` render pointer when clean (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location — composed and written by `orbit emit review` from the body's payload — containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, iteration number, the `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence each with critical/warning/suggestion counts; the renderer's REQUIRED counts source, per `orbit-report-rendering`'s strict validation; it supersedes the retired `findings_summary` field, which readers tolerate per `orbit-conventions`), and a `findings[]` array of full per-finding entries (severity / OWNING `dimension` — `completeness | correctness | coherence`, the scorecard cell the finding rolls into / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md`; the scorecard's cells SHALL equal the active findings' dimension × severity rollup (suppressed excluded — the emit surface's write gate AND the renderer validate the equality per `orbit-report-rendering`) — the shape `/orbit:address-reviews` maps to virtual markers on ingest and `orbit status --change <name> --report` renders

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section

#### Scenario: Commentary carried for the renderer

- **WHEN** a proposal- or system-mode summary is written with reviewer insight worth carrying
- **THEN** it rides the optional `commentary` field — and never asserts counts, verdicts, or next commands

#### Scenario: Spine fields carry deterministic facts under persist-first

- **WHEN** a proposal-mode pass with 1 warning and 3 suggestions persists its emit
- **THEN** `final_assessment` reads `0 critical, 1 warning, 3 suggestion.` and `next_recommended` is the `/orbit:address-reviews <change> --from-file <own path>` pointer — no gate verdict, no eligibility judgment; a clean pass instead points `next_recommended` at the `orbit status --change <change> --report` render — both COMPOSED by the emit surface, rejected if supplied in the payload
