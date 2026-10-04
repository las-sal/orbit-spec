# orbit-review Specification

## Purpose

The unified `/orbit:review` command — editorial review of an OpenSpec change in proposal mode (pre-apply, 9 passes over artifacts) or system mode (post-apply, `verify-change` as Pass 0 + 6 system-wide passes), or of an architecture doc in architecture mode (a doc under `orbit/architecture/`, six passes, no gate). All modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION), pushback discipline, and `.orbit-runs/` persistence. Generates findings but does not resolve them; resolution flows through `/orbit:address-reviews`.
## Requirements
### Requirement: Review command available with `--as` mode flag

The system SHALL expose a single `/orbit:review` command that runs an editorial review. The `--as proposal` flag reviews a change's pre-implementation artifacts (proposal/design/specs/tasks); the `--as system` flag reviews the whole product state after a change has been applied; the `--as architecture` flag reviews an architecture doc (the positional resolves to a doc name under `orbit/architecture/`, not a change name — D-arc Stage D2). The command additionally carries the REVIEWER-CLASS axis (D-arc Stage D5): `--reviewer in-context|fresh|external` (default `in-context`; `--fresh` remains as shorthand for `--reviewer fresh`) — the same three-class vocabulary the gate cadence, the emit `reviewer_class` field, and the report header already share. Supplying BOTH `--fresh` and an explicit `--reviewer` value in one invocation is a clean usage error naming the shorthand equivalence — agreeing forms are redundant, conflicting forms ambiguous; neither runs a pass. `--reviewer external` dispatches to the external-handoff branch (packaging a prompt for an external AI per `orbit-review-external`'s requirements — the behavior formerly invoked as the separate `/orbit:review-external` command), whose full instructions load from `references/external-handoff.md` ONLY when that class is selected. `--reviewer external` REQUIRES `--as proposal|system`: architecture mode supports the in-context and fresh classes only, and `--as architecture --reviewer external` exits with a clean usage error naming the constraint (the external handoff's downstream — T0 WAITING arithmetic, the shared pass axis, cadence slots, the `external-<as>-*.md` ingest vocabulary — is change-scoped machinery the gate-less architecture mode does not participate in; defining architecture external packaging is a future change if the need arises). The per-mode pass definitions likewise load from per-mode references (`references/passes-<mode>.md`) for the RESOLVED mode only — the body carries the shared trunk (resolution, disciplines, persistence, render protocol), and a run loads only the material its mode and reviewer class need.

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

#### Scenario: Architecture mode rejects the external reviewer class

- **WHEN** the user invokes `/orbit:review --as architecture <doc-name> --reviewer external`
- **THEN** the command exits with a clean usage error stating that `--reviewer external` requires `--as proposal|system` and that architecture mode supports in-context and fresh only; no prompt file and no T0 emit are produced

#### Scenario: Shorthand and explicit reviewer flags do not combine

- **WHEN** the user invokes `/orbit:review foo --fresh --reviewer external` (or `--fresh --reviewer fresh`)
- **THEN** the command exits with a clean usage error naming `--fresh` as shorthand for `--reviewer fresh`; no pass runs and no file is written

#### Scenario: Per-mode reference loading

- **WHEN** a proposal-mode review runs
- **THEN** the body loads `references/passes-proposal.md` and does NOT load the system or architecture pass references — pass CONTENT is unchanged by the split (an organizational move only)

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
- **THEN** Pass 0 invokes `/orbit:verify <change-name>` (via the upstream `orbit-verify-change` skill) and folds its findings into the report under the appropriate scorecard dimensions — GRADED BY `orbit-conventions`' Severity ladder as the folding body's own findings, not by verify-change's rules (the composing body is their AUTHOR here, so this is not a reader's re-grade): an incomplete task or an uncovered scenario is WARNING (an implementation built to the artifact would diverge); a violated requirement is CRITICAL ONLY when the violation breaks a user path or loses data, with the requirement and the observed behaviour as its reproduction — a violated formatting or documentation requirement with neither consequence is WARNING; a CRITICAL the body cannot reproduce is folded as WARNING. verify-change's own emit is untouched

#### Scenario: System mode default depth runs all passes

- **WHEN** the command runs as `--as system` with default `--full` depth
- **THEN** Passes 0–6 all execute (subject to `--skip-verify`) and each produces findings (possibly zero)

#### Scenario: System mode `--fast` runs cheap subset only

- **WHEN** the command runs as `--as system` with `--fast`
- **THEN** Pass 0 (verify-change), Pass 1 (Baseline Compliance), and Pass 6 (Drift/Residue) execute; Passes 2–5 are reported as skipped

#### Scenario: Pass 1 — Baseline Compliance

- **WHEN** Pass 1 runs in system mode
- **THEN** the command reads every requirement in archived `orbit/specs/*/spec.md` (not just the change's deltas) and reports CRITICAL when a baseline requirement is violated AND the violation breaks a user path or loses data — per `orbit-conventions`' Severity ladder, with the violated requirement and the observed behaviour as the reproduction — WARNING when a requirement is violated with neither consequence (a formatting or documentation rule: the artifact and the product diverge), and WARNING when a baseline scenario looks regressed (regression RISK: a divergence an implementation could make)

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

### Requirement: Findings rolled into a shared 3-dimension scorecard

The system SHALL roll all passes (mode-specific) into a 3-dimension scorecard (Completeness / Correctness / Coherence) per the orbit-conventions reporting standard, regardless of mode.

#### Scenario: Proposal-mode scorecard mapping

- **WHEN** the command runs in proposal mode and findings are reported
- **THEN** Pass 1 (Structure & Delta), Pass 5 (Codegen Readiness), and Pass 6 (Gap Hunt) contribute to Completeness; Pass 2 (Internal Coherence) and Pass 4 (Archive Consistency) contribute to Correctness; Pass 3 (Cross-Doc), Pass 7 (Drift Hunt), Pass 8 (Inline Review Marker Residue), and Pass 9 (Pre-Handoff Sweep) contribute to Coherence

#### Scenario: System-mode scorecard mapping

- **WHEN** the command runs in system mode and findings are reported
- **THEN** Pass 0 contributes to all three dimensions per verify-change's own mapping (Completeness: task-completion + spec-coverage findings; Correctness: requirement-implementation-mapping + scenario-coverage findings; Coherence: design-adherence + code-pattern-consistency findings); Pass 1 (Baseline Compliance) contributes to Correctness; Pass 2 (Cohesion) contributes to Correctness; Pass 3 (Surface Walk) contributes to Coherence; Pass 4 (Perspective Reviews) contributes to Coherence; Pass 5 (Critical-Path Scan) contributes to both Completeness and Correctness; Pass 6 (Drift/Residue) contributes to Coherence

#### Scenario: Severity ladder applied

- **WHEN** any pass produces a finding
- **THEN** the finding is tagged CRITICAL, WARNING, or SUGGESTION with bias toward lower severity when uncertain; includes a file:line reference and an actionable recommendation

### Requirement: Final assessment phrasings depend on mode

The final-assessment, gate, position, and eligibility lines of proposal- and system-mode review reports SHALL be the ENGINE-RENDERED TAIL of the pasted report (per `orbit-report-rendering`): the renderer computes them from the on-disk trail and gate graph — which includes the just-completed pass, because the run summary is PERSISTED BEFORE the report renders — and the reviewing AI authors none of them. The convergence branch routing formerly enumerated in this requirement (ordered-slot coverage, unresolved-pass precedence, confirm predicates, the five external-dimension states) lives where it always computed: `orbit-engine-gates`' reviewed-gate model, whose computed state, reason, and single-voiced canonical next command the renderer prints verbatim; the exact rendered phrasings are the renderer's fixed grammar, pinned by golden tests, following the eligibility-phrasing rule (`Ready when you are:`, ` — user-invoked` markers preserved, never an imperative label). The as-of-completion synthetic-pass computation is RETIRED: persist-first ordering makes the on-disk computation complete, so `orbit status`, `orbit instructions`, and the report tail all read the same pure function of the trail with no interval where surfaces disagree. The `--as architecture` mode is NOT covered by this requirement — its gate-less final assessment is specified by the `Architecture-mode final assessment has no gate` requirement (D-arc Stage D2).

#### Scenario: Persist-first ordering replaces the synthetic pass

- **WHEN** a proposal- or system-mode review completes
- **THEN** the `review-<mode>-<TS>.json` emit is written BEFORE the report renders, and the rendered tail's gate computation naturally includes the just-persisted pass — no synthetic-pass machinery, and no window where status and the report disagree

#### Scenario: The tail is the engine's verdict verbatim

- **WHEN** the pasted report's final lines render
- **THEN** the gate line, position readout, and canonical next command come from the engine's computed state (single-voiced, eligibility-phrased, ` — user-invoked` markers preserved) — the reviewing AI cannot author a verdict, and a hand-authored assessment line never appears in a change-mode report

### Requirement: Special-case lenses supported via `--focus`

The system SHALL accept a `--focus <lens>` flag that adds emphasis to specific passes without skipping others.

#### Scenario: Proposal-mode `--focus rename`

- **WHEN** the command runs as `--as proposal --focus rename`
- **THEN** Pass 7 (Drift Hunt), Pass 3 (Cross-Doc), and Pass 4 (Archive Consistency) run with elevated rigor; all other passes still execute

#### Scenario: Proposal-mode `--focus flip`

- **WHEN** the command runs as `--as proposal --focus flip`
- **THEN** Pass 2 (Internal Coherence) emphasizes directionality and Pass 5 (Codegen Readiness) emphasizes that surfaces are specified for both directions

#### Scenario: System-mode `--focus hotpath`

- **WHEN** the command runs as `--as system --focus hotpath`
- **THEN** Pass 5 (Critical-Path Scan) runs with elevated rigor; all other passes still execute

### Requirement: `--mark` flag is proposal-mode only

The system SHALL support a `--mark` flag that, after the review report is generated, writes `@review: <text>` markers into the relevant artifacts based on the findings; this flag is meaningful only in proposal mode.

#### Scenario: `--mark` enabled in proposal mode

- **WHEN** the command runs as `--as proposal --mark`
- **THEN** for each finding, a corresponding `@review: <finding text>` marker is inserted at the finding's file:line, enabling unified resolution via `/orbit:address-reviews`

#### Scenario: `--mark` ignored in system mode (v1)

- **WHEN** the command runs as `--as system --mark`
- **THEN** the flag is accepted but produces a note `--mark` writes to source files is v2; ignored for v1 system-mode runs

### Requirement: `--skip-verify` flag is system-mode only

The system SHALL support a `--skip-verify` flag in system mode to bypass Pass 0 when the user has already run `/orbit:verify` separately.

#### Scenario: `--skip-verify` flag in system mode

- **WHEN** the command runs as `--as system --skip-verify`
- **THEN** Pass 0 is skipped with a note "verify-change skipped per --skip-verify flag" and Passes 1–6 execute

#### Scenario: `--skip-verify` ignored in proposal mode

- **WHEN** the command runs as `--as proposal --skip-verify`
- **THEN** the flag is ignored (there is no Pass 0 in proposal mode); no error

### Requirement: `--fresh` runs pass work in a clean execution context

The system SHALL support a `--fresh` flag (all modes — proposal, system, and architecture) as shorthand for `--reviewer fresh` (D-arc Stage D5): the main pass work runs in a fresh execution context (e.g., a clean-context subagent) rather than the invoking conversation — mitigating anchoring when the invoking context authored or extensively discussed the artifacts under review. Findings, scorecard rollup, and run-summary persistence are unchanged; the flag affects only where pass work executes. A fresh-context pass fills the review cadence's independent slot (per `orbit-engine-gates`' reviewed-gate model) as the lighter-weight alternative to the external reviewer class (`--reviewer external` — same model, fresh context, no cross-AI handoff) — the relationship the engine's computed canonical next command reflects when the cadence needs an independent pass.

#### Scenario: Fresh pass execution

- **WHEN** the command runs with `--fresh` (or the equivalent `--reviewer fresh`)
- **THEN** the passes execute in a clean context that did not author the artifacts under review; the report and run summary are produced identically to a non-fresh run, with `fresh: true` recorded in the run summary's `flags` object and `reviewer_class: "fresh"` on the emit

### Requirement: Parallel execution via `--parallel`

The system SHALL support a `--parallel` flag that spawns subagents for heavy passes to run concurrently. Which passes are parallelized depends on mode.

#### Scenario: Proposal mode `--parallel`

- **WHEN** the command runs as `--as proposal --parallel`
- **THEN** Passes 2 (Internal Coherence), 4 (Archive Consistency), and 6 (Gap Hunt) execute concurrently in separate subagents and their findings are merged into the unified report

#### Scenario: System mode `--parallel`

- **WHEN** the command runs as `--as system --parallel`
- **THEN** Passes 2, 3, 4, and 5 execute concurrently in separate subagents and their findings are merged into the unified report

### Requirement: Pushback discipline on stale findings

The system SHALL verify each finding against current state before reporting it, regardless of mode.

#### Scenario: Stale finding suppressed

- **WHEN** an internal pass would produce a finding for an issue already resolved in current state (verified via `grep`, `git log`, or file inspection)
- **THEN** the finding is suppressed with an explanatory note ("stale finding suppressed: <evidence>") and excluded from the report's ACTIVE findings and severity counts — it appears ONLY in the rendered report's dedicated suppressed-with-evidence section (per `orbit-report-rendering`'s report grammar; suppression removes a finding from the scorecard, not from the audit record)

### Requirement: Internal run summary persisted per mode

The system SHALL persist a JSON run summary after each invocation VIA THE ENGINE EMIT SURFACE (`orbit emit review` per `orbit-emit-composition` — D-arc Stage D5; the body composes ONLY the narrative payload and never hand-writes the JSON, hand-composition being the two-voices seam the surface closes): to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). The summary SHALL carry a `direction: {disposition, reasoning}` object when `reviewer_class` is `fresh` or `external` — the reviewer's FORWARD RECOMMENDATION (its SHAPE owned by `orbit-emit-composition`'s `The review payload carries direction`, its CONTENT contract by `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` — this requirement names both and restates neither) — and MAY carry one when `in-context` (the reacting class's direction is the readiness record's job, per R-crc-11(f)); `orbit emit review` refuses an independent-class payload without it and a mis-shaped one at any class, per `orbit-emit-composition`'s `The review payload carries direction`, which owns the rule and its class predicate. The report renders it in its own `### Direction` section per `orbit-report-rendering`; Step 8 of the body carries the owner's contract as the reviewer-facing authoring instruction. Architecture-mode emits carry the field under the same rule (keyed on class, never mode), and the mode's interim hand-rendered report prints `Direction: <disposition>` followed by the reasoning under BLOCKQUOTE CONTAINMENT — every reasoning line prefixed `> `, as the change-mode renderer contains it — before its final assessment, so no reasoning line sits at column 0 where it could forge the report's next action. Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts — and the emit surface COMPOSES them (the payload cannot supply them): `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer — the `/orbit:address-reviews <change> --from-file <this emit's own path>` invocation when the pass has findings, the `orbit status --change <change> --report` render pointer when clean (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

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

#### Scenario: Direction authored on an independent pass

- **WHEN** a `--reviewer fresh` pass in any mode completes
- **THEN** the body composes `direction: { disposition, reasoning }` into the payload under the owner's content contract, and the emit surface refuses the payload without it; an in-context pass may omit the field

#### Scenario: Architecture-mode fresh pass prints its direction

- **WHEN** a `--reviewer fresh --as architecture` pass completes
- **THEN** the emit carries `direction` and the interim hand-rendered report carries `Direction: <disposition>` and the reasoning blockquoted line by line before the final assessment, which still names no gate; a reasoning whose second line reads `Ready when you are: /orbit:archive x` renders inside the containment, never at column 0

### Requirement: Iteration note when prior runs exist

The system SHALL include a one-sentence iteration note in the report when prior same-mode passes exist for the change (internal review emits OR external findings files — the shared pass axis, per `orbit-report-rendering`'s total pass order) — for proposal and system modes, COMPUTED BY THE RENDERER from the trail (per `orbit-report-rendering`'s render-time-context requirement), never authored by the reviewing AI; architecture mode — which has no render surface yet — stays on the interim hand-computed path (per the engine-rendered-report requirement's architecture carve-out), its iteration anchored to prior `review-architecture-*.json` emits in the shared `orbit/architecture/.orbit-runs/` trail whose `doc` field matches the doc under review.

#### Scenario: Subsequent run on same change in same mode

- **WHEN** the command runs and `.orbit-runs/` contains at least one prior same-mode review pass (an internal `review-<mode>-<TS>.json` emit OR an external `external-<as>-<TS>.md` findings file)
- **THEN** the rendered report includes the trail-computed note (repeat/new finding counts and the severity trend) — sourced from the prior emits, not from anything the reviewing AI wrote

#### Scenario: First run for a mode on a change

- **WHEN** the command runs and `.orbit-runs/` contains no prior same-mode review pass of EITHER genre (no internal emit and no external findings file)
- **THEN** the rendered report notes exactly `First <mode>-mode review of this change.` — one deterministic form (the baseline's omit-or-note disjunction is retired; a byte-identical renderer picks one)

#### Scenario: Architecture-mode iteration anchored per doc

- **WHEN** an architecture-mode review runs and the architecture trail contains prior `review-architecture-*.json` emits, some with a matching `doc` field and some for other docs
- **THEN** only the matching-`doc` emits count toward the iteration number and the iteration note

### Requirement: Graceful degradation on missing inputs

The system SHALL degrade gracefully when expected inputs are absent.

#### Scenario: No `orbit/specs/` baseline (proposal mode)

- **WHEN** Pass 4 (Archive Consistency) would run in proposal mode but `orbit/specs/` is empty
- **THEN** Pass 4 is skipped with a note "no baseline to check against" and other passes proceed normally

#### Scenario: No `orbit/lenses/` (system mode)

- **WHEN** Passes 4 or 5 would run in system mode but `orbit/lenses/` is empty or absent
- **THEN** the affected passes skip with a note; Pass 3 (Surface Walk) still runs against capabilities derived from `orbit/specs/`

#### Scenario: No project context docs (proposal mode)

- **WHEN** Pass 3 (Cross-Doc Coherence) would run in proposal mode but `CLAUDE.md` / `project.md` / `*_convention.md` are absent
- **THEN** lens-driven cross-checks within Pass 3 are skipped with a note; the rest of Pass 3 runs normally

### Requirement: Optional `recommendation_options` field on finding entries

The system SHALL emit findings whose `recommendation` is genuinely disjunctive — offering the user a choice between two or more concrete alternatives — with an additional optional structured field `recommendation_options: [{label, body}]` alongside the existing prose `recommendation` field. This field exists as a producer-side affordance for the address-reviews consumer's structured decision-fork detection path (per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks`).

**Field shape** (when present on a finding entry):

```
recommendation_options: [
  { "label": "A", "body": "<concrete option 1 text>" },
  { "label": "B", "body": "<concrete option 2 text>" },
  ...
]
```

- `label`: short identifier (typically `"A"`, `"B"`, `"C"`, …, or `"1"`, `"2"`, `"3"`, …).
- `body`: the concrete option text (the action the user would take if they pick this option).
- Array MUST contain ≥ 2 entries when present (single-option arrays defeat the purpose; the regular `recommendation` field carries single recommendations).

**When to emit** (normative — applies to all passes in all modes: 9 proposal-mode + 7 system-mode + 6 architecture-mode passes (D-arc Stage D2; architecture-mode findings are ingestible by `/orbit:address-reviews` exactly like other internal review JSON, so their disjunctive recommendations get the same structured affordance); pass-specific behavior is enumerated in scenarios below where helpful):

- Emit `recommendation_options` when the finding's recommendation genuinely requires a choice — multiple defensible paths, each producing a different outcome (e.g., "file a follow-up issue" vs. "extend the current change's scope").
- Do NOT emit `recommendation_options` for findings with a single concrete action ("rename X to Y", "remove the duplicate scenario") — those use the prose `recommendation` field alone.
- The prose `recommendation` field SHALL still summarize the disjunction for readers of the markdown report (e.g., "Either (A) file a follow-up issue, or (B) extend scope to tasks.md"). The structured field complements the prose; it does not replace it.

**Backward compatibility**: the `recommendation_options` field is OPTIONAL on every finding. Findings without disjunctive recommendations omit it. Existing parsers that don't recognize the field SHALL ignore it (forward-compatible by design).

#### Scenario: Disjunctive finding emits both recommendation prose and structured options

- **WHEN** a proposal-mode pass identifies a finding where the recommendation is "Either file a follow-up issue tracking the v2 polish work, OR add Group 19 to tasks.md extending this change's scope to cover the missing scenarios"
- **THEN** the finding's JSON entry contains both: (a) `recommendation`: the prose summary string with "Either … or …" phrasing; (b) `recommendation_options`: `[{label: "A", body: "file a follow-up issue tracking the v2 polish work"}, {label: "B", body: "add Group 19 to tasks.md extending this change's scope to cover the missing scenarios"}]`

#### Scenario: Single-recommendation finding omits structured options

- **WHEN** a system-mode pass identifies a finding whose recommendation is a single concrete action (e.g., "Rename `ReviewMode` to `ReviewModeConfig` consistently across all callers")
- **THEN** the finding's JSON entry contains the prose `recommendation` field but does NOT include `recommendation_options`

#### Scenario: Three-way option fork emitted with three entries

- **WHEN** a pass identifies a finding offering three distinct paths (e.g., "(A) rewrite the assertion, (B) skip the test, (C) file an issue and document the skip rationale")
- **THEN** the `recommendation_options` array contains three entries with labels "A", "B", "C" and the corresponding option bodies

#### Scenario: Address-reviews structured-path detection uses recommendation_options

- **WHEN** address-reviews ingests a `review-<mode>-<TS>.json` produced by this command and one of its findings includes `recommendation_options`
- **THEN** address-reviews surfaces the structured options directly (without re-parsing the prose `recommendation` field via heuristic), per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks`

#### Scenario: Field is forward-compatible — old parsers ignore it cleanly

- **WHEN** a downstream parser (e.g., a hypothetical older `address-reviews` or a downstream status reader) reads a review JSON containing `recommendation_options`
- **THEN** the parser MUST treat the field as ignorable (parsers SHOULD NOT fail on unknown fields per JSON forward-compat conventions); the parser's behavior on the finding's other fields is unchanged

#### Scenario: Producer-side enforcement — minimum 2 entries when field is present

- **WHEN** an editorial pass would emit a finding with `recommendation_options` containing fewer than 2 entries (zero or one)
- **THEN** the producer SHALL EITHER (a) omit the field entirely (preferred — single-recommendation findings use the prose `recommendation` field alone) OR (b) refuse to emit and surface a writer-side warning. Producing a JSON with a 0- or 1-entry `recommendation_options` array is a producer bug; downstream consumers handle it via fallback (per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks` malformed-array scenario), but emit-time should not produce such arrays in the first place.

#### Scenario: Producer-side enforcement — every entry has required label and body fields

- **WHEN** an editorial pass would emit a finding with `recommendation_options` where any entry is missing the required `label` or `body` field, or either field is an empty string
- **THEN** the producer SHALL EITHER (a) populate the missing/empty field with a meaningful value OR (b) drop the malformed entry (re-check the ≥ 2-entry rule afterward) OR (c) refuse to emit. The structured field's contract is "every entry has non-empty label AND non-empty body"; emitting malformed entries is a producer bug.

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
`--parallel` is accepted but is a no-op in architecture mode (architecture docs are small; the
six passes run in one context), noted in the report like other wrong-mode flags; `--fast` and
`--focus <lens>` are likewise accepted but no-ops (all six passes run — no per-mode subset or
lens table is defined for architecture mode), noted in the report the same way.

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
lines. Skipped-pass notes (the emit's `passes_run`/`passes_skipped` record) surface in the
LOOSE-FORM conversation after the pasted report when worth mentioning — never as
hand-rendered structured sections. Architecture mode pastes its own trail's render when the
surface supports it;
until then it keeps the shared scorecard shape with NO gate line (its no-gate contract is
unchanged).

#### Scenario: The report is the pasted render

- **WHEN** a proposal- or system-mode review completes and its emit is persisted
- **THEN** the chat report is the verbatim output of `orbit status --change <name> --report`, followed by free conversational remarks — never a hand-rendered scorecard or gate line

#### Scenario: Hand-rendering prohibition is greppable

- **WHEN** the generated review body is inspected
- **THEN** it contains the explicit prohibition on hand-rendering the structured report sections (grep-testable), alongside the run-and-paste instruction

