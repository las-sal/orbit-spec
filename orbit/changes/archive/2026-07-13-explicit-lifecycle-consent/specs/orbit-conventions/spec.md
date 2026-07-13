## ADDED Requirements

### Requirement: No-chaining contract

The AI SHALL invoke at most the orbit workflow commands the user's message explicitly requests —
one command per explicit user request; the AI recommends, never invokes. Completing a command
ENDS the turn at the position readout and the engine's canonical-next line (eligibility-framed,
per `orbit-engine-gates`); the AI SHALL NOT invoke the next orbit command — any `/orbit:*`
workflow, review iterations included — unless the user's message requests it. Blanket delegation
("follow the cadence", "take it through review") covers work WITHIN each explicitly requested
command (the passes of one review, the tasks of one apply), never the next command; gate `passed`
means *eligible*, not *commanded*. This contract is echoed in every generated workflow body
(the self-contained-disciplines pattern) and is the behavior layer the consent prompts
(`orbit-lifecycle-consent`) backstop at the consent-marked seams.

#### Scenario: Command completion ends the turn

- **WHEN** an orbit workflow command completes and a next command is eligible
- **THEN** the AI renders the position readout + the engine's canonical-next line and stops;
  it does not invoke the eligible command

#### Scenario: Blanket delegation does not cross commands

- **WHEN** the user has said "run the review cadence" and one review command completes with the
  gate still unpassed
- **THEN** the AI reports position and recommends; the next review invocation is the user's
  (review-cycle COUNT is the user's call)

#### Scenario: Explicit multi-command requests are honored as scoped

- **WHEN** the user's message explicitly names multiple commands ("run a fresh review, then
  address its findings")
- **THEN** exactly those named commands are run — the request defines the scope; nothing beyond
  it is invoked

## MODIFIED Requirements

### Requirement: Internal-run JSON summary format

The system SHALL use a consistent JSON shape for run-summary emissions across **all orbit commands that mutate artifacts** — workflow, editorial, and lifecycle alike. Every run-summary JSON SHALL include a universal spine; commands extend the spine with per-kind and per-command extensions.

The universal spine (6 required fields):

```
command          string       identifies which command emitted (matches filename prefix)
timestamp        string       ISO-8601 UTC; JSON field uses standard colon format `YYYY-MM-DDTHH:MM:SSZ`
                              (e.g., `"2026-05-21T13:34:12Z"`). Filename embeds a colon-replaced `<TS>` token
                              `YYYY-MM-DDTHH-MM-SSZ` (e.g., `propose-2026-05-21T13-34-12Z.json`) because
                              colons aren't filesystem-safe across all platforms.
change           string|null  the change name (or null for project-scope commands)
final_assessment string       narrative of what just happened (human-readable)
next_recommended string       verbatim recommendation, suitable for best-effort parse by downstream status readers
kind             enum         "workflow" | "editorial" | "lifecycle"
```

Per-kind extensions:

- **`kind: "workflow"`** — emitted by `explore`, `propose`, `new`, `continue`, `ff`, `apply`, `verify`. Per-command extensions are defined in the `orbit-run-summary-emit` capability (e.g., `apply.chunk_complete`, `verify.verdict`, `explore.decisions_captured`). Consent-era `apply` emits additionally carry `consent: "user-invoked" | "prompted"` (per `orbit-lifecycle-consent`).
- **`kind: "editorial"`** — emitted by `review`, `address-reviews`, `audit-drift`, `review-external`. Per-command extensions include: `iteration` (when applicable to the command — e.g., review iter-N, address-reviews iter-N), `findings_summary` (counts by severity; included when findings are present — i.e., review/address-reviews/audit-drift completion emits; review-external at T0 emits before external findings return and SHALL omit this field), `finding_titles` (array of brief titles; included with `findings_summary`, omitted in the same cases), plus command-specific fields defined in per-skill schema references (`references/run-summary-schema.md`, shipped alongside the generated skill).
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
  "tasks_completed": 28,
  "tasks_remaining": 48,
  "user_validation_remaining": 0,
  "chunk": "2 of 5",
  "chunk_name": "inventory+parsing",
  "chunk_complete": true,
  "tasks_completed_this_session": 16,
  "consent": "user-invoked"
}
```

Editorial-kind example — `review-proposal-2026-05-21T00-18-14Z.json` written by `/orbit:review --as proposal` iter-1:

```json
{
  "command": "review",
  "timestamp": "2026-05-21T00:18:14Z",
  "change": "emit-run-summary-jsons-from-workflow-commands",
  "final_assessment": "1 CRITICAL finding + 2 WARNING. Ready for /orbit:address-reviews.",
  "next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands --from-file <findings-bridge>",
  "kind": "editorial",
  "mode": "proposal",
  "iteration": 1,
  "depth": "full",
  "passes_run": ["1","2","3","4","5","6","7","8","9"],
  "findings_summary": {
    "critical": 1,
    "warning": 2,
    "suggestion": 0
  },
  "finding_titles": [
    "Emit timing undefined for bare-mode explore",
    "Apply chunk-preamble format unspecified",
    "Verify fail-mode precedence missing"
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
- **THEN** the JSON contains the 6 spine fields with valid values: `command`, `timestamp`, `change` (or null), `final_assessment`, `next_recommended`, and `kind`

#### Scenario: Workflow command emit shape

- **WHEN** a workflow command (e.g., `/orbit:propose`, `/orbit:apply`, `/orbit:verify`) writes its JSON
- **THEN** `kind` equals `"workflow"`; per-command extensions are present per the `orbit-run-summary-emit` capability (which defines the specific extension fields per workflow command)

#### Scenario: Editorial command emit shape (with findings)

- **WHEN** an editorial command that has produced findings (`/orbit:review`, `/orbit:address-reviews`, `/orbit:audit-drift`) writes its JSON
- **THEN** `kind` equals `"editorial"`; per-command extensions include `iteration` (when the command tracks iterations), `findings_summary` (counts by severity), `finding_titles` (array of brief titles), plus command-specific fields documented in the emitting skill's `references/run-summary-schema.md`

#### Scenario: Editorial command emit shape (pre-findings T0 case)

- **WHEN** `/orbit:review-external` writes its T0 JSON (prompt packaged, external findings not yet returned)
- **THEN** `kind` equals `"editorial"`; per-command extensions include `mode`, `prompt_path`, `target`, `awaiting_findings: true` — and OMIT `findings_summary` and `finding_titles` because no findings exist yet

#### Scenario: Lifecycle command emit shape

- **WHEN** `/orbit:archive` writes its JSON
- **THEN** `kind` equals `"lifecycle"`; per-command extensions include `archive_path`, `audit`, `sync_specs`, `unresolved_markers`, `user_decision` per the archive skill's emit. Consent-era archive emits also include `consent`.

#### Scenario: Downstream status readers parse next_recommended uniformly across kinds

- **WHEN** a downstream status reader reads any run-summary JSON (regardless of `kind`) and best-effort parses `next_recommended`
- **THEN** the leading `/orbit:<verb> [args]` token (if present) is extracted into `command` and `args`; on parse failure (e.g., prose recommendation), the full string is preserved in `reason`

#### Scenario: Future consumers route by `kind` field rather than parsing filename prefix

- **WHEN** a downstream consumer (dashboard, CI bot, IDE plugin) reads `.orbit-runs/*.json` files
- **THEN** the consumer MAY route by reading the `kind` field directly rather than pattern-matching filename prefixes (e.g., `review-*`, `address-reviews-*`); filename prefix routing remains valid as a fallback
