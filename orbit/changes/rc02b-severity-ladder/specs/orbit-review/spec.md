## MODIFIED Requirements

### Requirement: Proposal mode runs nine passes

The system SHALL execute 9 distinct review passes in proposal mode: (1) Structure & Delta Integrity, (2) Internal Coherence, (3) Cross-Doc Coherence, (4) Archive Consistency, (5) Codegen Readiness, (6) Gap Hunt (generative completeness probe), (7) Drift Hunt, (8) Inline Review Marker Residue, (9) Pre-Handoff Sweep.

#### Scenario: Proposal mode default depth runs all passes

- **WHEN** the command runs as `--as proposal` with default `--full` depth
- **THEN** all 9 passes execute sequentially and each produces findings (possibly zero) of severity CRITICAL, WARNING, or SUGGESTION

#### Scenario: Proposal mode `--fast` runs cheap subset only

- **WHEN** the command runs as `--as proposal` with `--fast`
- **THEN** only Passes 1 (Structure & Delta), 7 (Drift Hunt), and 8 (Inline Review Marker Residue) execute, and the remaining passes are reported as skipped

#### Scenario: Pass 6 Gap Hunt operational heuristic (proposal mode)

- **WHEN** Pass 6 runs
- **THEN** for each requirement in the change's spec deltas, the AI asks (and answers in the finding when affirmative): (a) are there unstated assumptions an implementer would have to invent (e.g., "what file path?", "what default value?")? (b) are error or edge-case paths specified, not just happy paths? (c) are state transitions explicit, including invalid transitions? (d) for any "X SHALL do Y", is Y precise enough that two implementers would produce the same behavior? Findings cite the requirement's file:line and the specific gap; suggest concrete spec additions to close the gap

#### Scenario: Pass 8 marker residue detection (operational)

- **WHEN** Pass 8 runs
- **THEN** the AI greps the change directory for `@review:` markers and distinguishes two cases: (a) **actual unresolved markers** — markers in proposal/design/spec/tasks/explore.md content that represent unaddressed review notes (these are BLOCKS, per `orbit-conventions`' Severity ladder — carried in the emit's `blocks` array, rendered above the findings, in no scorecard cell — and they MUST be addressed before applying; nothing stops on them mechanically, which the ladder names as a known limit); (b) **documentation appearances of the marker syntax** — `@review:` text inside code blocks, examples, or scenarios that document the marker convention itself (these are NOT findings). The distinction is whether the marker is inside a fenced code block / inline-code span / explicit "example" prose context (documentation) vs. sitting bare in artifact content (unresolved). When ambiguous, the marker is listed as a block, never graded, and the user decides during `/orbit:address-reviews`.

#### Scenario: `--strict` and `--mark` on a block

- **WHEN** `--strict` is set and a pass reports a block, or `--mark` is set in proposal mode
- **THEN** `--strict` stops on the first BLOCK exactly as on the first CRITICAL (the CI-like intent is "stop on what must be addressed"); `--mark` writes no marker for a block — a block is already a condition the artifact carries, and a marker would be a second record of it

#### Scenario: Pass severities name the ladder

- **WHEN** a proposal-mode pass assigns a severity
- **THEN** it names `orbit-conventions`' Severity ladder and states the condition with its consequence, defining nothing of its own: a validate failure (Pass 1) is a BLOCK; a requirement with no task (Pass 2) and old vocabulary in a delta (Pass 7) are WARNING — an implementation built to the artifact would diverge; a direct contradiction of baseline (Pass 4) is CRITICAL only with a reproduction naming the baseline behaviour that breaks, else WARNING; ambiguity that could split implementations (Pass 5) is the ladder's WARNING definition

### Requirement: System mode runs verify-change + six system-wide passes

The system SHALL execute 7 review passes in system mode: Pass 0 delegates to upstream `verify-change`; Passes 1–6 are orbit additions covering Baseline Compliance, Cohesion, Surface Walk, Perspective Reviews, Critical-Path Scan, Drift/Residue.

#### Scenario: Pass 0 delegates to upstream verify-change

- **WHEN** the command runs as `--as system` and `--skip-verify` is not specified
- **THEN** Pass 0 invokes `/orbit:verify <change-name>` (via the upstream `orbit-verify-change` skill) and folds its CRITICAL/WARNING/SUGGESTION findings into the report under the appropriate scorecard dimensions

#### Scenario: System mode default depth runs all passes

- **WHEN** the command runs as `--as system` with default `--full` depth
- **THEN** Passes 0–6 all execute (subject to `--skip-verify`) and each produces findings (possibly zero)

#### Scenario: System mode `--fast` runs cheap subset only

- **WHEN** the command runs as `--as system` with `--fast`
- **THEN** Pass 0 (verify-change), Pass 1 (Baseline Compliance), and Pass 6 (Drift/Residue) execute; Passes 2–5 are reported as skipped

#### Scenario: Pass 1 — Baseline Compliance

- **WHEN** Pass 1 runs in system mode
- **THEN** the command reads every requirement in archived `orbit/specs/*/spec.md` (not just the change's deltas) and reports CRITICAL when a baseline requirement is violated — per `orbit-conventions`' Severity ladder, with the violated requirement and the observed behaviour as the reproduction — and WARNING when a baseline scenario looks regressed (regression RISK: a divergence an implementation could make)

#### Scenario: Pass 2 — Cohesion walk

- **WHEN** Pass 2 runs in system mode
- **THEN** the command identifies files the change touched (from `git diff` and the tasks list) and walks callers/dependents not in the change's tasks for signature drift, semantic shifts, or side effects; flags WARNING for caller-side contract drift, CRITICAL when a downstream is clearly broken (per the ladder: broken is a reproducible user path, drift is divergence risk)

#### Scenario: Pass 3 — Surface walk derives surfaces from specs

- **WHEN** Pass 3 runs in system mode
- **THEN** the command enumerates surfaces from `orbit/specs/<capability>/spec.md` (capabilities ARE surfaces) and checks each entry remains coherent after the change; flags WARNING for inconsistencies, CRITICAL when a surface was removed unintentionally and the removal is shown as the reproduction (per the ladder; else WARNING)

#### Scenario: Pass 4 — Perspective reviews from lenses

- **WHEN** Pass 4 runs in system mode and `orbit/lenses/perspectives.md` exists
- **THEN** for each named perspective, the command simulates typical call patterns; flags WARNING when interactions are awkward, inconsistent, or surprising from a registered caller's POV (per `orbit-conventions`' Severity ladder: a caller built against the artifact would diverge — divergence risk), SUGGESTION below that

#### Scenario: Pass 4 — No perspectives defined

- **WHEN** Pass 4 runs in system mode but `orbit/lenses/perspectives.md` is empty or absent
- **THEN** Pass 4 is skipped with a note "no perspectives defined; skip Pass 4"

#### Scenario: Pass 5 — Critical-path scan from lenses

- **WHEN** Pass 5 runs in system mode and `orbit/lenses/critical-paths.md` exists
- **THEN** for each named flow, the command walks the code end-to-end checking for breakage, regression, or drift; flags CRITICAL for path breakage, WARNING for regression risk — the ladder's own two definitions, per `orbit-conventions`

#### Scenario: Pass 5 — No critical paths defined

- **WHEN** Pass 5 runs in system mode but `orbit/lenses/critical-paths.md` is empty or absent
- **THEN** Pass 5 is skipped with a note "no critical paths defined; skip Pass 5"

#### Scenario: Pass 6 — Drift / Residue via audit-drift

- **WHEN** Pass 6 runs in system mode
- **THEN** the command invokes `/orbit:audit-drift` as a library function and folds its findings into the report under the Coherence dimension

### Requirement: Internal run summary persisted per mode

The system SHALL persist a JSON run summary after each invocation VIA THE ENGINE EMIT SURFACE (`orbit emit review` per `orbit-emit-composition` — D-arc Stage D5; the body composes ONLY the narrative payload and never hand-writes the JSON, hand-composition being the two-voices seam the surface closes): to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts — and the emit surface COMPOSES them (the payload cannot supply them): `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer — the `/orbit:address-reviews <change> --from-file <this emit's own path>` invocation when the pass has findings, the `orbit status --change <change> --report` render pointer when clean (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location — composed and written by `orbit emit review` from the body's payload — containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, the ENGINE-COMPUTED iteration number (proposal/system: the next ordinal on the shared internal+external pass axis; architecture: the per-doc ordinal over matching-`doc` emits — computed by the emit surface from the trail either way, payload supply rejected, per `orbit-emit-composition`), the `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence each with critical/warning/suggestion counts; the renderer's REQUIRED counts source, per `orbit-report-rendering`'s strict validation; it supersedes the retired `findings_summary` field, which readers tolerate per `orbit-conventions`), and a `findings[]` array of full per-finding entries (severity / OWNING `dimension` — `completeness | correctness | coherence`, the scorecard cell the finding rolls into / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md`; the scorecard's cells SHALL equal the active findings' dimension × severity rollup (suppressed excluded — the emit surface's write gate AND the renderer validate the equality per `orbit-report-rendering`) — the shape `/orbit:address-reviews` maps to virtual markers on ingest and `orbit status --change <name> --report` renders

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section

#### Scenario: Commentary carried for the renderer

- **WHEN** a proposal- or system-mode summary is written with reviewer insight worth carrying
- **THEN** it rides the optional `commentary` field — and never asserts counts, verdicts, or next commands

#### Scenario: Spine fields carry deterministic facts under persist-first

- **WHEN** a proposal-mode pass with 1 warning and 3 suggestions persists its emit
- **THEN** `final_assessment` reads `0 critical, 1 warning, 3 suggestion.` and `next_recommended` is the `/orbit:address-reviews <change> --from-file <own path>` pointer — no gate verdict, no eligibility judgment; a clean pass instead points `next_recommended` at the `orbit status --change <change> --report` render — both COMPOSED by the emit surface, rejected if supplied in the payload

#### Scenario: Blocks ride the payload beside the findings

- **WHEN** a proposal- or system-mode pass finds a BLOCK (Pass 1's validate failure, Pass 8's unresolved marker)
- **THEN** the body composes it into the payload's `blocks` array — one single-line string per block naming the condition and its location — never into `findings[]` and never into the scorecard; the array is optional and absent when no block was found

#### Scenario: A finding entry carries its reproduction

- **WHEN** the body composes a finding entry for the payload
- **THEN** the entry carries `reproduction` — a string, multi-line allowed, never a single-line slot — beside `recommendation`: REQUIRED non-empty when `severity` is `CRITICAL` (per `orbit-conventions`' Severity ladder; refused otherwise by `orbit emit review`, per `orbit-emit-composition`), optional on WARNING and SUGGESTION; the body's field enumeration and `references/run-summary-schema.md` name it. Prior-generation emits lack the field and remain valid on the trail
