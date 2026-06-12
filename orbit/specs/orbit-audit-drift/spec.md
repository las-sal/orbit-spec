# orbit-audit-drift Specification

## Purpose

The `/orbit:audit-drift` command — project-wide scan for drift between captured knowledge and reality across four categories: (1) vocabulary residue (renamed/removed terms in non-delta'd docs), (2) lens staleness (perspectives/critical-paths referencing missing capabilities), (3) cross-doc consistency (`CLAUDE.md` / `project.md` / `*_convention.md` claims vs current state), (4) archive coherence (sync-specs propagation failures). Three invocation paths: standalone (user runs when "something feels off"), library call (system-mode review Pass 6), pre-archive (auto-invoked by `/orbit:archive`). Findings roll into the 3-dimension scorecard; final-assessment phrasing varies by invocation context.

## Requirements

### Requirement: Audit-drift command available

The system SHALL expose a `/orbit:audit-drift` command that performs a project-wide scan for drift between captured knowledge and reality.

#### Scenario: Invoke project-wide standalone

- **WHEN** the user invokes `/orbit:audit-drift` with no arguments
- **THEN** the command scans the project for drift across the four scan categories and reports findings

#### Scenario: Invoke change-scoped standalone

- **WHEN** the user invokes `/orbit:audit-drift <change-name>` with a change-name positional
- **THEN** the command runs the same four-category scan, with the run associated to the named change: the run summary is written to the change's `.orbit-runs/` and the emit's `change` field and recommendation logic follow `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` requirement for the change-scoped form

#### Scenario: Invoke as library function

- **WHEN** `/orbit:review --as system` Pass 6 invokes audit-drift internally
- **THEN** audit-drift runs with the same logic and its findings are folded into the review report (system mode) under the Coherence dimension

#### Scenario: Invoke from archive pre-sweep

- **WHEN** `/orbit:archive` auto-invokes audit-drift before completing
- **THEN** audit-drift runs with the same logic and its findings are presented to the user as a pre-archive prompt

### Requirement: Four scan categories executed

The system SHALL execute four scan categories: (1) Vocabulary residue, (2) Lens staleness, (3) Cross-doc consistency, (4) Archive coherence.

#### Scenario: Default depth runs all categories

- **WHEN** the command runs with default `--full` depth
- **THEN** all four categories execute and each produces findings (possibly zero)

#### Scenario: `--fast` runs cheap subset only

- **WHEN** the command runs with `--fast`
- **THEN** Category 1 (Vocabulary residue) and Category 2 (Lens staleness) execute; Categories 3 and 4 are reported as skipped

### Requirement: Category 1 — Vocabulary residue

The system SHALL build a residue-pattern set from archived changes' deltas (RENAMED FROM symbols, REMOVED requirement names) and grep target docs for residue.

#### Scenario: Stale vocabulary in non-delta'd spec

- **WHEN** an archived change RENAMED `BridgeServer` to `HostLifecycle`, and Category 1 finds `BridgeServer` still referenced in a non-delta'd `orbit/specs/<capability>/spec.md`
- **THEN** a WARNING finding is reported with the file:line, the rename context, and a recommendation to either delta the file in a future change or apply a hotfix commit

#### Scenario: Stale vocabulary in governing doc

- **WHEN** Category 1 finds residue in `project.md` or `CLAUDE.md`
- **THEN** a CRITICAL finding is reported because governing docs are followed by future implementers

### Requirement: Category 2 — Lens staleness

The system SHALL check each entry in `orbit/lenses/` references against current state.

#### Scenario: Perspective references missing capability

- **WHEN** a perspective in `orbit/lenses/perspectives.md` references a surface `<capability>` that no longer exists under `orbit/specs/<capability>/`
- **THEN** a WARNING finding is reported with the perspective's file:line and a recommendation to update or remove the entry

#### Scenario: Critical path touchpoint unresolvable

- **WHEN** a critical path in `orbit/lenses/critical-paths.md` lists a touchpoint that references a non-existent capability or tool
- **THEN** a WARNING finding is reported

### Requirement: Category 3 — Cross-doc consistency

The system SHALL extract structured claims from `CLAUDE.md`, `orbit/project.md`, and `*_convention.md`, and check for inconsistencies across docs and against current specs.

#### Scenario: Structured claim extraction

- **WHEN** Category 3 reads a doc
- **THEN** it extracts at minimum these claim categories: (a) **named entities** — capability names, surface names, tool names, file paths mentioned; (b) **quantitative claims** — port numbers, counts, version pins, size limits; (c) **architectural assertions** — "X talks to Y", "X is the server, Y is the client", "X must be in place before Y"; (d) **rules/conventions** — naming patterns, error formats, file location conventions referenced in non-convention docs

#### Scenario: Two docs disagree on a fact

- **WHEN** Category 3 finds the same fact described differently in two docs (e.g., port number, architecture flow, naming)
- **THEN** a WARNING finding is reported with both file:line references and a recommendation to reconcile

#### Scenario: Doc-vs-spec disagreement

- **WHEN** Category 3 finds a governing doc's claim materially disagrees with a current spec
- **THEN** a CRITICAL finding is reported

### Requirement: Category 4 — Archive coherence

The system SHALL check recently archived changes (default: last 5; override with `--since <ref>`) for sync-specs propagation failures.

#### Scenario: ADDED requirement not propagated to baseline

- **WHEN** Category 4 finds an archived change with an ADDED requirement that does not appear in the corresponding `orbit/specs/<capability>/spec.md`
- **THEN** a CRITICAL finding is reported

#### Scenario: REMOVED requirement still in baseline

- **WHEN** Category 4 finds an archived change marked a requirement REMOVED but the requirement still appears in baseline
- **THEN** a CRITICAL finding is reported

### Requirement: Findings rolled into 3-dimension scorecard

The system SHALL roll the four categories into the standard 3-dimension scorecard.

#### Scenario: Mapping

- **WHEN** findings are reported
- **THEN** Category 4 contributes to Completeness; Categories 1 and 2 contribute to Correctness; Category 3 contributes to Coherence

### Requirement: Final assessment phrasings vary by invocation context

The system SHALL emit a final-assessment line whose gate text depends on how audit-drift was invoked.

#### Scenario: Standalone — at least one CRITICAL

- **WHEN** invoked standalone with at least one CRITICAL finding
- **THEN** the final assessment reads `X critical issue(s) found.` (no gate mentioned)

#### Scenario: Pre-archive — at least one CRITICAL

- **WHEN** invoked as an archive pre-sweep with at least one CRITICAL finding
- **THEN** the final assessment reads `X critical issue(s) found. Address before /orbit:archive?` (prompt, not gate)

#### Scenario: Library call from `/orbit:review --as system`

- **WHEN** invoked as a library function by `/orbit:review --as system` (Pass 6)
- **THEN** no standalone final-assessment line is emitted; findings are folded into the review report's Coherence dimension

### Requirement: Flag family parity with review commands

The system SHALL support `--fast` / `--full` / `--thorough`, `--parallel`, `--focus <area>` (vocabulary / lenses / docs / archive), `--strict`, and `--since <ref>`. Parity refers to the shared flag-family **spelling**; per-flag semantics are command-specific (notably `--focus` here selects a single category to run, whereas review's `--focus` adds emphasis without skipping passes).

#### Scenario: `--focus` limits scope

- **WHEN** the command runs with `--focus lenses`
- **THEN** only Category 2 (Lens staleness) executes; other categories are skipped with notes

#### Scenario: `--strict` fails fast on first CRITICAL

- **WHEN** the command runs with `--strict` and a category pass produces a CRITICAL finding
- **THEN** the run stops at that finding and reports it; categories not yet run are reported as skipped per `--strict`

#### Scenario: `--thorough` accepted with fallback to `--full`

- **WHEN** the command runs with `--thorough`
- **THEN** the depth flag is accepted; where thorough-specific behavior is not further specified, the command falls back to `--full` semantics

#### Scenario: `--since` overrides archive window

- **WHEN** the command runs with `--since <git-ref>`
- **THEN** Category 4 scans archived changes since the specified ref instead of the default window

### Requirement: Internal run summary persisted

The system SHALL write a JSON run summary for **standalone** invocations only, per the emit model owned by `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` requirement: change-scoped standalone (`/orbit:audit-drift <change-name>`) writes to `orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json`; project-wide standalone (`/orbit:audit-drift` with no positional) writes to `orbit/.orbit-runs/audit-drift-<TS>.json` (creating the directory if needed). Non-standalone contexts write NO separate audit-drift JSON: library-call findings (system-mode review Pass 6) are folded into the review report and travel in its `review-system-<TS>.json` emit; pre-archive findings are captured in the archive's `archive-<TS>.json` `audit.*` fields per `orbit-archive-modifications`.

#### Scenario: Change-scoped standalone summary written

- **WHEN** `/orbit:audit-drift <change-name>` completes
- **THEN** a JSON summary is created at `orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json` with command name, timestamp, findings summary by category and severity, and finding titles

#### Scenario: Project-wide standalone summary written

- **WHEN** `/orbit:audit-drift` (no positional) completes
- **THEN** a JSON summary with the same content shape is created at `orbit/.orbit-runs/audit-drift-<TS>.json`

#### Scenario: No separate JSON in library or pre-archive contexts

- **WHEN** audit-drift runs as a library call (review Pass 6) or as the archive pre-sweep
- **THEN** no `audit-drift-<TS>.json` is written; findings travel in the caller's emit (the review's `review-system-<TS>.json`, or the archive's `archive-<TS>.json` `audit.*` fields respectively)

### Requirement: Optional `recommendation_options` field on audit-drift finding entries

The system SHALL emit audit-drift findings whose `recommendation` is genuinely disjunctive — offering the user a choice between two or more concrete remediation paths — with an additional optional structured field `recommendation_options: [{label, body}]` alongside the existing prose `recommendation` field. This field is the producer-side affordance for address-reviews' structured decision-fork detection (per `orbit-address-reviews` `Disjunctive recommendation fields surface as decision forks`).

**Field shape**: identical to `orbit-review`'s `Optional recommendation_options field on finding entries` requirement. The shape is shared across both producers so the consumer (address-reviews) reads it uniformly regardless of which command produced the finding.

```
recommendation_options: [
  { "label": "A", "body": "<concrete option 1 text>" },
  { "label": "B", "body": "<concrete option 2 text>" },
  ...
]
```

**When to emit** in audit-drift specifically:

- Category 1 (Vocabulary residue): typically single-recommendation ("delta this file" or "apply a hotfix commit"). Emit `recommendation_options` only when both options are equally defensible and which to pick depends on the user's context (e.g., "Either (A) delta this file in a future change, or (B) apply a hotfix commit now").
- Category 2 (Lens staleness): typically disjunctive ("Either (A) rename the surface ref, or (B) remove the perspective if obsolete"). Emit `recommendation_options` when the choice between options is genuinely the user's to make.
- Category 3 (Cross-doc consistency): often disjunctive when two docs disagree ("Either (A) update doc X to match doc Y, or (B) update doc Y to match doc X — depending on which is canonical"). Emit `recommendation_options` for these.
- Category 4 (Archive coherence): typically requires running `sync-specs` or applying a hotfix. Emit only when multiple resolution paths are equally defensible.

**Backward compatibility**: optional on every finding; absence means single-recommendation. Existing parsers SHALL ignore the field without erroring.

#### Scenario: Category 2 lens-staleness finding with rename-or-remove options

- **WHEN** audit-drift Category 2 identifies a perspective referencing a capability that no longer exists under that name (potentially renamed)
- **THEN** the finding's JSON entry includes `recommendation_options: [{label: "A", body: "rename the surface ref to match the current capability name <name>"}, {label: "B", body: "remove the perspective if it's obsolete"}]` AND the prose `recommendation` field summarizes the disjunction

#### Scenario: Category 1 single-recommendation residue emit omits options

- **WHEN** audit-drift Category 1 identifies vocabulary residue in a baseline spec and the obvious resolution is to delta the file in a future change (no equally defensible alternative)
- **THEN** the finding's JSON entry contains the prose `recommendation` field but does NOT include `recommendation_options`

#### Scenario: Category 3 disagree-which-is-canonical finding emits options

- **WHEN** audit-drift Category 3 identifies two governing docs disagreeing on a fact, and which doc is canonical depends on user context
- **THEN** the finding's JSON entry includes `recommendation_options` enumerating "update X to match Y" and "update Y to match X" as separate paths

#### Scenario: Field is consumer-shared across orbit-review and orbit-audit-drift

- **WHEN** address-reviews ingests an audit-drift JSON via `--from-file` or auto-discovery
- **THEN** the parser handles `recommendation_options` on audit-drift findings using the same logic it applies to orbit-review findings — uniform consumer-side behavior across both producers

#### Scenario: Standalone contexts preserve the field

- **WHEN** audit-drift runs in a standalone context (change-scoped or project-wide) and produces findings with `recommendation_options`
- **THEN** the field is preserved in the standalone run-summary JSON (per the `Internal run summary persisted` requirement), available to `/orbit:address-reviews`' structured decision-fork detection on later ingest

#### Scenario: Pre-archive findings surface via the archive prompt

- **WHEN** audit-drift runs in `pre-archive` context (invoked by `/orbit:archive`) and produces findings with disjunctive recommendations
- **THEN** the findings travel in the archive's `archive-<TS>.json` `audit.*` fields and are presented to the user via the archive flow's critical-drift prompt (per `orbit-archive-modifications` `Critical-drift prompt, not gate`); no separate audit-drift JSON is written

#### Scenario: Producer-side enforcement — minimum 2 entries

- **WHEN** an audit-drift category pass (C1-C4) would emit a finding with `recommendation_options` containing fewer than 2 entries
- **THEN** the producer SHALL omit the field entirely (single-recommendation findings use prose `recommendation` only); emitting a 0- or 1-entry `recommendation_options` array is a producer bug. Equivalent to the orbit-review producer-side enforcement scenario.

#### Scenario: Producer-side enforcement — every entry has required label and body fields

- **WHEN** an audit-drift category pass would emit a finding with `recommendation_options` where any entry has missing or empty `label` or `body`
- **THEN** the producer SHALL either populate the field with a meaningful value, drop the malformed entry (and re-check the ≥ 2-entry rule), or refuse to emit. Equivalent to the orbit-review producer-side enforcement scenario for entry shape.
