## ADDED Requirements

### Requirement: Architecture mode runs six passes

The system SHALL run six architecture-mode passes when invoked `--as architecture` (the pass set
dogfooded by hand on the D-arc, 2026-07-08): (1) **Cohesion / traceability** — rulings, stages,
and premise agree; stage charters trace to goals; (2) **Completeness / exit-criteria** — every
stage carries falsifiable exit criteria; charter items are covered by stage content; (3)
**Dependencies / sequencing** — `Depends-on:` declarations match the sequencing prose and no
cycle exists; (4) **Layer-fit** — content sits at the right tier (arc-level rulings vs
stage-level detail, per the arc's ownership rule); (5) **Route-level alternatives** — major
directions record what was considered and rejected; (6) **Economy self-audit** — the doc's
read-cost story holds (what a session must load, what the engine renders vs prose re-narrates).
The target is an architecture DOC, not a change; findings cite `<doc>.md:line` and roll into the
shared 3-dimension scorecard (passes 1–3 → Correctness, 2 → Completeness, 4–6 → Coherence).

#### Scenario: Architecture review runs against a doc

- **WHEN** the user invokes `/orbit:review --as architecture d-arc-arbitered-flow`
- **THEN** the six passes run against `orbit/architecture/d-arc-arbitered-flow.md` (plus `orbit architecture status` for computed-state cross-checks) and findings carry file:line citations into the doc

### Requirement: Architecture-mode final assessment has no gate

The architecture-mode final assessment SHALL render findings counts and ONE canonical next
command without referencing any gate: no gate exists over architecture docs (review standing
without a gate — D-arc D-d2-5), so the assessment never says PASSED/UNPASSED of a gate. With
findings: `X critical / Y warning(s). Ready when you are: /orbit:address-reviews --from-file
<the just-written review-architecture emit>.` All clear: `No findings. The architecture trail
records this pass.` Labels follow D1's eligibility phrasing; findings are ingestible by
`/orbit:address-reviews` exactly like other internal review JSON.

#### Scenario: No gate vocabulary in architecture mode

- **WHEN** an architecture-mode review completes with zero findings
- **THEN** the final assessment mentions no gate state and recommends no lifecycle command — the trail records the pass and the turn ends at the readout

## MODIFIED Requirements

### Requirement: Review command available with `--as` mode flag

The system SHALL expose a single `/orbit:review` command that runs an editorial review. The `--as proposal` flag reviews a change's pre-implementation artifacts (proposal/design/specs/tasks); the `--as system` flag reviews the whole product state after a change has been applied; the `--as architecture` flag reviews an architecture doc (the positional resolves to a doc name under `orbit/architecture/`, not a change name — D-arc Stage D2).

#### Scenario: Invoke with change name and explicit mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal` or `/orbit:review <change-name> --as system`
- **THEN** the command reads the change's artifacts and runs the appropriate set of passes for that mode

#### Scenario: Invoke architecture mode with doc name

- **WHEN** the user invokes `/orbit:review --as architecture <doc-name>`
- **THEN** the command resolves `<doc-name>` against `orbit/architecture/` (prompting via `AskUserQuestion` over parseable docs when omitted or ambiguous) and runs the architecture passes

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review` with no argument (proposal/system context)
- **THEN** the command runs `orbit list --json`, presents the active changes via `AskUserQuestion`, and uses the user's selection as the change scope

#### Scenario: Mode inference when `--as` omitted

- **WHEN** the user invokes `/orbit:review <change-name>` without `--as`
- **THEN** the command infers the mode from `tasks.md` state: ALL task boxes unchecked → `proposal`; all tasks checked and code exists → `system`; ambiguous (mixed checked/unchecked, or checked without visible code changes) → prompt the user via `AskUserQuestion` to pick; the inferred mode is shown in the report header. Architecture mode is NEVER inferred — it requires the explicit `--as architecture` flag (a positional that happens to match a doc name does not trigger it)

### Requirement: Internal run summary persisted per mode

The system SHALL write a JSON run summary after each invocation: to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, iteration number, findings summary (counts by severity and by pass), and a `findings[]` array of full per-finding entries (severity / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md` — the shape `/orbit:address-reviews` maps to virtual markers on ingest

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section
