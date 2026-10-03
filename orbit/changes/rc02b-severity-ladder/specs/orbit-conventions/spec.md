## MODIFIED Requirements

### Requirement: Severity ladder

The system SHALL use a consistent severity ladder across reports, and SHALL define each severity by its CONSEQUENCE — stated ONCE, here. CRITICAL: a user path breaks or data is lost, AND the finding carries its REPRODUCTION. WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. A REPRODUCTION is a case the reader can re-execute — the inputs, the rule or command, the expected result, the observed result; a command in system mode, a CONSTRUCTED CASE in proposal mode, where nothing runs (a named trail, the rule applied by hand, the wrong answer it yields). Every other surface that assigns a severity — a review pass's rule, a prompt's guidance, a parser's section — SHALL NAME this ladder and state the condition and its consequence, never a second definition (the one-statement rule). A lifecycle BLOCK — a condition that stops apply whatever it would cost a user, such as an `orbit validate` failure or an unresolved `@review:` marker — is NOT a severity: it is reported, named as a block, and carried in no scorecard cell — on an internal pass in the review emit's `blocks` array (per `orbit-review` and `orbit-emit-composition`), on an external file under `## Blocks`, rendered in the report's Blocks section above the findings (per `orbit-report-rendering`), and listed before any finding at the walk's triage (per `orbit-address-reviews`). Known limit: no lifecycle seam STOPS on a block today — the apply flow carries no validate or marker precondition, and the only lifecycle reader of markers is the archive flow's Step 1.5 warning; a block is a report with a name, and the stop is the human's until a stage gives apply a precondition. The engine checks the PRESENCE of a reproduction where it writes the record (per `orbit-emit-composition`) and marks its absence where it cannot refuse (per `orbit-report-rendering`); whether a reproduction reproduces is the walk's judgement (per `orbit-address-reviews`), never a reader's re-grade. Known limit: `orbit-audit-drift` assigns its own severities, which system review preserves — a statement site this ladder does not yet reach.

#### Scenario: Three severities

- **WHEN** a finding is reported
- **THEN** it is one of CRITICAL, WARNING, or SUGGESTION; never any other severity name

#### Scenario: False-positive bias

- **WHEN** a command is uncertain whether a finding rises to a given severity
- **THEN** it picks the lower severity (SUGGESTION over WARNING; WARNING over CRITICAL); no surface inverts this bias for any condition — a condition that must stop apply regardless is a BLOCK, not an ambiguous CRITICAL

#### Scenario: CRITICAL is a consequence plus its reproduction

- **WHEN** a finding is graded CRITICAL
- **THEN** it names a user path that breaks or data that is lost AND carries a reproduction the reader can re-execute; a finding that names the consequence and carries no reproduction is REFUSED at the internal write gate until its author supplies the reproduction or grades it WARNING at most, and is counted as authored but marked unreproduced where no gate can refuse it (an external file)

#### Scenario: WARNING is divergence risk

- **WHEN** a finding shows that an implementation built to the artifact as written could diverge from what the artifact intends — a requirement with no task, old vocabulary in a delta, an ambiguity that could split implementations
- **THEN** it is WARNING: it gates (the substantive set is CRITICAL + WARNING per `orbit-engine-gates`) and it buys no further independent pass

#### Scenario: A block leaves the scorecard

- **WHEN** a review pass finds a condition that stops apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker in artifact content
- **THEN** the pass reports it as a BLOCK — an entry in the emit's `blocks` array on an internal pass, an item under `## Blocks` on an external file — rendered above the findings, listed first at triage, and no scorecard cell changes; nothing stops on it mechanically (the known limit above), so the report is what the human reads before apply

The external prompt's severity guidance is ONE paragraph, stated here as a production and carried into `orbit-review-external`'s reference template as a CHECKED MIRROR held byte-equal by a parity test (R-crc-14's mirror corollary — an external reviewer has no access to this spec, so the copy must exist and must say what it is):

```
Grade by `orbit-conventions`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an `orbit validate` failure, an unresolved `@review:` marker — is a BLOCK, not a severity: list it under `## Blocks`.
```

#### Scenario: The ladder paragraph is mirrored, never restated

- **WHEN** the external prompt template carries its `## Severity` paragraph
- **THEN** the paragraph is byte-equal to the fenced production above and a parity test holds it so; any other surface that would define a severity points here instead

#### Scenario: Every other surface points at the ladder

- **WHEN** a review pass rule, a prompt, or a reference states which severity a condition takes
- **THEN** it names this requirement and states the condition and its consequence ("a requirement with no task: WARNING, per the ladder — an implementation built to the artifact would omit it"), and states no definition of its own

### Requirement: External-review findings markdown format

The system SHALL use a consistent markdown shape for external-review findings files.

#### Scenario: Required structure

- **WHEN** an external-review findings file is written
- **THEN** it contains: `# External Review: <change> (iteration N)` title, `**Reviewer**:` and `**Date**:` fields, severity sections (`## CRITICAL`, `## WARNING`, `## SUGGESTION`), each containing `### <Title>` entries with `**File**: <path>:<line>` and `**Description**: <text>` fields; optional `## Notes` section. A CRITICAL entry additionally carries a `**Reproduction**: <text>` body AFTER its `**Description**:` body (ended by the next `###` or `##` heading); a CRITICAL without one is counted as authored and marked `unreproduced` by the renderer, never re-graded. An optional `## Blocks` section (before `## Notes`) lists must-address-before-apply conditions that are not severities (per the Severity ladder requirement) as `- <what>` items; the renderer's parser collects those items for the report's Blocks section and the trail counter ignores the section, so it changes no count.

#### Scenario: Parseable by --from-file

- **WHEN** `/orbit:address-reviews --from-file <path>` reads this format
- **THEN** the parser extracts per-finding severity, title, file:line, description, and — when present — the reproduction body; `## Blocks` entries are listed at triage and never walked as findings

#### Scenario: Reproduction body is the fourth field, never the first

- **WHEN** an external findings file carries `**Reproduction**:` on a finding
- **THEN** it follows the `**Description**:` body; a `**Reproduction**:` line placed before `**Description**:` is not recognised (the parser contract opens the recommendation body at Description, and a file without the label parses exactly as before this requirement)

### Requirement: Internal-run JSON summary format

The system SHALL use a consistent JSON shape for run-summary emissions across **all orbit commands that mutate artifacts** — workflow, editorial, and lifecycle alike. Every run-summary JSON SHALL include a universal spine; commands extend the spine with per-kind and per-command extensions. Emits are COMPOSED via the engine emit surface (`orbit emit <command>` per `orbit-emit-composition`, D-arc Stage D5) — the spine's computable fields are engine-owned; the emitting AI supplies only narrative payload fields.

The universal spine (7 required fields):

```
command          string       identifies which command emitted (matches filename prefix)
timestamp        string       ISO-8601 UTC; JSON field uses standard colon format `YYYY-MM-DDTHH:MM:SSZ`
                              (e.g., `"2026-05-21T13:34:12Z"`). Filename embeds a colon-replaced `<TS>` token
                              `YYYY-MM-DDTHH-MM-SSZ` (e.g., `propose-2026-05-21T13-34-12Z.json`) because
                              colons aren't filesystem-safe across all platforms.
change           string|null  the change name (or null for project-scope and architecture-scoped commands)
final_assessment string       narrative of what just happened (human-readable)
next_recommended string       verbatim recommendation, suitable for best-effort parse by downstream status readers
kind             enum         "workflow" | "editorial" | "lifecycle"
model            string|null  the emitting AI's model identity (provenance — D-arc Stage D5); null when unknown.
                              The emit surface REQUIRES the key in every payload (explicit null allowed) so
                              provenance is always a conscious act. Pre-capability emits lack the field —
                              readers SHALL tolerate absence (both generations valid on the trail).
```

Per-kind extensions:

- **`kind: "workflow"`** — emitted by `explore`, `propose`, `new`, `continue`, `ff`, `apply`, `verify`, `architect` (D-arc Stage D2; `architect` emits to the architecture trail with `change: null` plus a `doc` extension — shape owned by `orbit-architect`). Per-command extensions are defined in the `orbit-run-summary-emit` capability (e.g., `apply.chunk_complete`, `verify.verdict`, `explore.decisions_captured`). Consent-era `apply` emits additionally carry `consent: "user-invoked" | "prompted"` (per `orbit-lifecycle-consent`).
- **`kind: "editorial"`** — emitted by `review`, `address-reviews`, `audit-drift`, `review-external`. Per-command extensions include: `iteration` (when applicable to the command — e.g., review iter-N, address-reviews iter-N), `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence, each with critical/warning/suggestion — on review completion emits; the renderer's required counts source per `orbit-report-rendering`; D-arc Stage D4), and full `findings[]` entries (each carrying its own `title` — no separate title array). The former `findings_summary` AND `finding_titles` fields are RETIRED for review emits (superseded by `scorecard`; live practice had already migrated) — readers SHALL tolerate both generations (a severity count is recoverable by counting `findings[]`, the existing trail-reader fallback; the report RENDERER's strict generation boundary is the named exception, per `orbit-report-rendering`); audit-drift and archive-audit emits keep their own `findings_summary` shapes unchanged. Command-specific fields beyond these are documented in per-skill schema references (`references/run-summary-schema.md`, shipped alongside the generated skill — payload-field lists MIRRORING the engine's authoritative table per `orbit-emit-composition`, never defining it; the spine is engine-owned and documented HERE, not per skill).
- **`kind: "lifecycle"`** — emitted by `archive` only. Per-command extensions include: `archive_path`, `audit`, `sync_specs` (reports what the archive flow's spec-sync step did, mirroring upstream's archive summary), `unresolved_markers`, `user_decision`, plus other fields defined in the archive skill. Consent-era emits (per `orbit-lifecycle-consent`) additionally carry the flat `consent: "user-invoked" | "prompted"` field.

**Canonical examples** (one per kind, illustrating spine + per-kind extensions):

Workflow-kind example — `apply-2026-05-21T13-34-12Z.json` written at chunk 2 completion of a chunked apply (the `final_assessment` shown is the ENGINE-composed chunk/counts core per `orbit-emit-composition`'s deterministic-facts requirement — the payload may only append an optional `assessment_suffix`, never author the counts; the `next_recommended` shown is the engine's canonical next_command extended by the ENGINE-composed next-chunk suffix from the preamble — every character engine-owned):

```json
{
  "command": "apply",
  "timestamp": "2026-05-21T13:34:12Z",
  "change": "add-detail-flag",
  "final_assessment": "Completed chunk 2 of 5 (inventory+parsing); 28 of 76 tasks done.",
  "next_recommended": "/orbit:apply add-detail-flag — next chunk: phase+attention+recommendation engine",
  "kind": "workflow",
  "model": "claude-fable-5",
  "tasks_completed": 28,
  "tasks_remaining": 48,
  "user_validation_remaining": 0,
  "chunk": "2 of 5",
  "chunk_name": "inventory+parsing",
  "chunk_complete": true,
  "tasks_completed_this_session": 16,
  "files_touched": ["src/core/parsers/preamble.ts", "test/core/preamble.test.ts"],
  "consent": "user-invoked"
}
```

Editorial-kind example — `review-proposal-2026-05-21T00-18-14Z.json` written by `/orbit:review --as proposal` iter-1:

```json
{
  "command": "review",
  "timestamp": "2026-05-21T00:18:14Z",
  "change": "emit-run-summary-jsons-from-workflow-commands",
  "final_assessment": "1 critical, 1 warning, 0 suggestion.",
  "next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands --from-file <this emit's own path>",
  "kind": "editorial",
  "model": "claude-fable-5",
  "mode": "proposal",
  "iteration": 1,
  "depth": "full",
  "passes_run": ["1","2","3","4","5","6","7","8","9"],
  "scorecard": {
    "completeness": { "critical": 1, "warning": 0, "suggestion": 0 },
    "correctness": { "critical": 0, "warning": 1, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "findings": [
    { "severity": "CRITICAL", "dimension": "completeness", "title": "Emit timing undefined for bare-mode explore", "file": "specs/emit/spec.md", "line": 12, "recommendation": "…", "reproduction": "run /orbit:explore with no name, speak two decisions, stop: no explore-<TS>.json is written and the spec names no rule for it" },
    { "severity": "WARNING", "dimension": "correctness", "title": "Apply chunk-preamble format unspecified", "file": "specs/apply/spec.md", "line": 40, "recommendation": "…" }
  ]
}
```

Lifecycle-kind example — `archive-2026-05-20T16-31-59Z.json` written after `/orbit:archive bootstrap-orbit-status-cli`:

```json
{
  "command": "archive",
  "timestamp": "2026-05-20T16:31:59Z",
  "change": "bootstrap-orbit-status-cli",
  "final_assessment": "Archived bootstrap-orbit-status-cli to orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/.",
  "next_recommended": "Change archived. Run /orbit:new or /orbit:explore to start the next change, or /orbit:audit-drift for a project-wide drift check.",
  "kind": "lifecycle",
  "model": "claude-fable-5",
  "archive_path": "orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/",
  "audit": {
    "ran": true,
    "findings_summary": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "sync_specs": {
    "capabilities_updated": ["orbit-status-output"],
    "added": 3,
    "modified": 1,
    "removed": 0,
    "renamed": 0
  },
  "unresolved_markers": [],
  "user_decision": "proceeded_with_no_critical",
  "consent": "user-invoked",
  "warnings": []
}
```

#### Scenario: Universal spine present on every emit

- **WHEN** any orbit command (workflow, editorial, or lifecycle) writes a run-summary JSON
- **THEN** the JSON contains the 7 spine fields with valid values: `command`, `timestamp`, `change` (or null), `final_assessment`, `next_recommended`, `kind`, and `model` (nullable; absent only on pre-capability emits, which readers tolerate)

#### Scenario: Workflow command emit shape

- **WHEN** a workflow command (e.g., `/orbit:propose`, `/orbit:apply`, `/orbit:verify`) writes its JSON
- **THEN** `kind` equals `"workflow"`; per-command extensions are present per the `orbit-run-summary-emit` capability (which defines the specific extension fields per workflow command)

#### Scenario: Editorial command emit shape (with findings)

- **WHEN** an editorial command that has produced findings (`/orbit:review`, `/orbit:address-reviews`, `/orbit:audit-drift`) writes its JSON
- **THEN** `kind` equals `"editorial"`; per-command extensions include `iteration` (when the command tracks iterations), the counts shape the command owns (`scorecard` for review emits — D-arc Stage D4; audit-drift keeps its `findings_summary` and `finding_titles`), plus command-specific fields documented in the emitting skill's `references/run-summary-schema.md`

#### Scenario: Editorial command emit shape (pre-findings T0 case)

- **WHEN** the external-review packaging branch writes its T0 JSON (prompt packaged, external findings not yet returned)
- **THEN** `kind` equals `"editorial"`; per-command extensions include `mode`, `prompt_path`, `target`, `awaiting_findings: true` — and OMIT the counts shape because no findings exist yet

#### Scenario: Lifecycle command emit shape

- **WHEN** `/orbit:archive` writes its JSON
- **THEN** `kind` equals `"lifecycle"`; per-command extensions include `archive_path`, `audit`, `sync_specs`, `unresolved_markers`, `user_decision` per the archive skill's emit. Consent-era archive emits also include `consent`.

#### Scenario: Downstream status readers parse next_recommended uniformly across kinds

- **WHEN** a downstream status reader reads any run-summary JSON (regardless of `kind`) and best-effort parses `next_recommended`
- **THEN** the leading `/orbit:<verb> [args]` token (if present) is extracted into `command` and `args`; on parse failure (e.g., prose recommendation), the full string is preserved in `reason`

#### Scenario: Future consumers route by `kind` field rather than parsing filename prefix

- **WHEN** a downstream consumer (dashboard, CI bot, IDE plugin) reads `.orbit-runs/*.json` files
- **THEN** the consumer MAY route by reading the `kind` field directly rather than pattern-matching filename prefixes (e.g., `review-*`, `address-reviews-*`); filename prefix routing remains valid as a fallback

#### Scenario: Model provenance recorded, absence tolerated

- **WHEN** a post-capability emit is written via the surface and a pre-capability emit sits beside it on the trail
- **THEN** the new emit carries `model` (a string or explicit null); every reader treats the old emit's missing key as valid (no degradation, no warning)

### Requirement: Review mode decision framework

The system SHALL codify the decision criteria for choosing among orbit's three reviewer classes (in-context, fresh, external — the `--reviewer` axis on the merged `/orbit:review` surface, D-arc Stage D5; "mode" belongs to `--as proposal|system|architecture`). This is the normative-force complement to README's "Choosing a review mode" section, which documents the same framework as user-facing guidance. The framework exists because empirical evidence (notably `bootstrap-orbit-status-cli`'s 3-of-3 finding — in-context system review missed all 3 real implementation bugs that external review caught) demonstrates that mode choice materially affects review-finding completeness. As of C1 the framework's recommendations are BACKED BY the engine's `reviewed` gates (per `orbit-engine-gates`): the gate computes convergence and surfaces the canonical next mode, but enforcement is apply-parity — the gate surfaces and records, never hard-blocks. The framework remains advisory in the sense that the user can always proceed past an unpassed gate at the inflection prompt (the override is recorded); it is no longer purely advisory in the sense that the recommendation is now an engine-computed gate state rather than free-form prose.

The three classes:

1. **In-context** (default `/orbit:review`) — the current AI session does the review against its accumulated context. Fast iteration; low cross-AI cost. Anchoring risk: AI may be biased toward confirming work it has visibility into.
2. **Fresh internal subagent** (`/orbit:review --reviewer fresh`; `--fresh` remains as shorthand — D-arc Stage D5) — spawns a fresh subagent within the same Claude process. Loses session-level anchoring; same model architecture so model-level biases remain. Middle-ground between in-context and external.
3. **External** (`/orbit:review --reviewer external` — D-arc Stage D5's merge; the standalone launcher is retired, record vocabulary frozen per `orbit-review-external`) — packages a self-contained prompt for a different AI session (different model + different chat + completely separate context). Maximum independence; cross-AI round-trip cost. Best for substantive changes + code-vs-spec verification.

#### Scenario: In-context default for first-pass review with low anchoring risk

- **WHEN** the user invokes `/orbit:review` for the first review pass of a change AND no design ambiguity has been flagged AND the change is small (e.g., docs-only, single-file, or otherwise low-stakes)
- **THEN** in-context (the default) is the appropriate mode; session-level anchoring is an asset (the AI knows the context) rather than a liability; cross-AI cost is unnecessary. The framework does NOT require `--fresh` or external for low-stakes first passes. The `spec-driven` cadence still prescribes an independent pass before the gate converges, but apply-parity means a low-stakes change can proceed past the unpassed gate via the recorded inflection-prompt override.

#### Scenario: `--fresh` for anchoring-break in multi-iteration cases

- **WHEN** the same in-context AI session has reviewed an artifact 2+ times AND the user wants to verify convergence without paying cross-AI round-trip cost
- **THEN** `/orbit:review --fresh` is the appropriate mode. The fresh subagent loses the iter-1 + iter-2 in-session anchoring while preserving same-model semantics; it confirms that the multi-iteration in-context reviews didn't accumulate blind spots. Use `--fresh` as a lighter alternative to external when same-model coverage is acceptable.

#### Scenario: External for system-mode + substantive cross-AI verification

- **WHEN** running system-mode review (verifying code-vs-spec coherence where the AI may have authored the code in a recent session — high anchoring risk per `bootstrap-orbit-status-cli` evidence) OR the change is substantive enough that cross-AI cross-check pays for itself (e.g., breaking changes, security-sensitive code, multi-capability changes)
- **THEN** `/orbit:review --reviewer external` is the appropriate mode. The cross-AI round-trip cost is justified by the independence — a different model + different session has no anchoring to the code the original AI wrote. The `review-system` cadence's external slot encodes this default (per `orbit-engine-gates`), and the engine-rendered report tail surfaces the resulting canonical next command (per `orbit-report-rendering` — D-arc Stage D4). In C1+ this recommendation is realized as the `review-system` gate (per `orbit-engine-gates`), whose `blind-pair` slot the external return half-covers (one `external` and one `fresh`, per rc02's version-4 cadence); the gate surfaces the canonical next command but NEVER hard-blocks — the user may proceed past it at the archive inflection prompt, and the override is recorded. The recommendation is gate-surfaced, not gate-enforced.

#### Scenario: Framework is documented in README + spec; drift between the two is caught

- **WHEN** the README's "Choosing a review mode" section drifts from this requirement's normative criteria (e.g., README claims `--fresh` is appropriate for X but the spec scenarios don't reflect that)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; orbit's docs and spec stay aligned via the audit-drift discipline rather than ad-hoc reconciliation.

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change is "substantial" by the README's guidance (would benefit from external review per the framework) BUT the user chooses to archive without running external
- **THEN** orbit's archive flow proceeds via the inflection-prompt override (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; choosing proceed records the override in the archive run summary. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the override, not to refuse archive of changes that skip the recommendation.
