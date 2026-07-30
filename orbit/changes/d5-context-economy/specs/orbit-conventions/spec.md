## MODIFIED Requirements

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
- **`kind: "editorial"`** — emitted by `review`, `address-reviews`, `audit-drift`, `review-external`. Per-command extensions include: `iteration` (when applicable to the command — e.g., review iter-N, address-reviews iter-N), `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence, each with critical/warning/suggestion — on review completion emits; the renderer's required counts source per `orbit-report-rendering`; D-arc Stage D4), and full `findings[]` entries (each carrying its own `title` — no separate title array). The former `findings_summary` AND `finding_titles` fields are RETIRED for review emits (superseded by `scorecard`; live practice had already migrated) — readers SHALL tolerate both generations (a severity count is recoverable by counting `findings[]`, the existing trail-reader fallback; the report RENDERER's strict generation boundary is the named exception, per `orbit-report-rendering`); audit-drift and archive-audit emits keep their own `findings_summary` shapes unchanged. Command-specific fields beyond these are defined in per-skill schema references (`references/run-summary-schema.md`, shipped alongside the generated skill — payload-field lists; the spine is engine-owned and documented HERE, not per skill).
- **`kind: "lifecycle"`** — emitted by `archive` only. Per-command extensions include: `archive_path`, `audit`, `sync_specs` (reports what the archive flow's spec-sync step did, mirroring upstream's archive summary), `unresolved_markers`, `user_decision`, plus other fields defined in the archive skill. Consent-era emits (per `orbit-lifecycle-consent`) additionally carry the flat `consent: "user-invoked" | "prompted"` field.

**Canonical examples** (one per kind, illustrating spine + per-kind extensions):

Workflow-kind example — `apply-2026-05-21T13-34-12Z.json` written at chunk 2 completion of a chunked apply:

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
    { "severity": "CRITICAL", "dimension": "completeness", "title": "Emit timing undefined for bare-mode explore", "file": "specs/emit/spec.md", "line": 12, "recommendation": "…" },
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

### Requirement: `explore.md` five-section format

The system SHALL use a fixed five-section format for `explore.md`. Open-question entries SHALL carry a `Standing recommendation:` slot — `Standing recommendation: <the current leaning> ` or `Standing recommendation: none yet` — so a pending leaning discussed in conversation has a named, file-resident home (D-arc Stage D5, leak-hardening layer 1: AIs fill template slots far more reliably than they obey prose rules; the slot is what the emit surface's attestation counts).

#### Scenario: Section order

- **WHEN** an `explore.md` file is created
- **THEN** the sections appear in this order: Premise, Decisions, Open questions, Considered & out, References

#### Scenario: Status header

- **WHEN** an `explore.md` file is created
- **THEN** it includes a `> **Status**: exploring...` header indicating the file is a pre-propose record

#### Scenario: Open questions carry the standing-recommendation slot

- **WHEN** an open question is captured in `explore.md`
- **THEN** its entry includes a `Standing recommendation:` line — the current leaning, or the literal `none yet`; an entry lacking the slot is a format violation the explore body corrects on next touch
