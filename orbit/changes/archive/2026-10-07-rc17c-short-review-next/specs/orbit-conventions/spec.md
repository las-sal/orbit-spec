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
- **`kind: "editorial"`** — emitted by `review`, `address-reviews`, `audit-drift`, `review-external`. Per-command extensions include: `iteration` (when applicable to the command — e.g., review iter-N, address-reviews iter-N), `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence, each with critical/warning/suggestion — on review completion emits; the renderer's required counts source per `orbit-report-rendering`; D-arc Stage D4), and full `findings[]` entries (each carrying its own `title` — no separate title array). The former `findings_summary` AND `finding_titles` fields are RETIRED for review emits (superseded by `scorecard`; live practice had already migrated) — readers SHALL tolerate both generations (a severity count is recoverable by counting `findings[]`, the existing trail-reader fallback; the report RENDERER's strict generation boundary is the named exception, per `orbit-report-rendering`); audit-drift's payload is owned by `orbit-run-summary-emit`'s `Audit-drift standalone recommendations`, and archive-audit emits keep their own `findings_summary` shape unchanged. Command-specific fields beyond these are documented in per-skill schema references (`references/run-summary-schema.md`, shipped alongside the generated skill — payload-field lists MIRRORING the engine's authoritative table per `orbit-emit-composition`, never defining it; the spine is engine-owned and documented HERE, not per skill).
- **`kind: "lifecycle"`** — emitted by `archive` only. Per-command extensions include: `archive_path`, `audit`, `sync_specs` (reports what the archive flow's spec-sync step did, mirroring upstream's archive summary), `unresolved_markers`, `user_decision`, plus other fields defined in the archive skill. Consent-era emits (per `orbit-lifecycle-consent`) additionally carry the flat `consent: "user-invoked" | "prompted"` field.

**Canonical examples** (one per kind, illustrating spine + per-kind extensions; each is EXECUTED, per the paragraph after them):

Workflow-kind example — an `apply` emit written at chunk 2 completion of a chunked apply (the `final_assessment` shown is the ENGINE-composed chunk/counts core per `orbit-emit-composition`'s deterministic-facts requirement — the payload may only append an optional `assessment_suffix`, never author the counts; the `next_recommended` shown is the engine's canonical next_command extended by the ENGINE-composed next-chunk suffix from the preamble — every character engine-owned; `diff_base` is the tree the next apply's `files_touched` diffs from):

```json
{
  "command": "apply",
  "timestamp": "2026-05-21T13:34:12Z",
  "change": "add-detail-flag",
  "final_assessment": "Completed chunk 2 of 5 (inventory+parsing); 28 of 76 tasks done.",
  "next_recommended": "/orbit:apply add-detail-flag — next chunk: phase+attention+recommendation engine",
  "kind": "workflow",
  "model": "claude-fable-5",
  "consent": "user-invoked",
  "tasks_completed": 28,
  "tasks_remaining": 48,
  "user_validation_remaining": 0,
  "chunk": "2 of 5",
  "chunk_name": "inventory+parsing",
  "chunk_complete": true,
  "tasks_completed_this_session": 16,
  "files_touched": ["src/core/parsers/preamble.ts", "test/core/preamble.test.ts"],
  "diff_base": "fd6f2826ece1c27853a35ca6a7ed37efccb28218"
}
```

Editorial-kind example — a `review` emit written by a `/orbit:review --as proposal --reviewer fresh` iter-1 pass with findings (`next_recommended` is the change-scoped walk per `orbit-emit-composition`'s `Deterministic facts are engine-composed per command`; `pass_genre`, `verified_walks` and `iteration` are engine-computed; `direction` is owed by an independent class):

```json
{
  "command": "review",
  "timestamp": "2026-05-21T00:18:14Z",
  "change": "emit-run-summary-jsons-from-workflow-commands",
  "kind": "editorial",
  "model": "claude-fable-5",
  "mode": "proposal",
  "reviewer_class": "fresh",
  "depth": "full",
  "flags": { "parallel": false, "focus": null, "strict": false, "fresh": true, "mark": false, "skip_verify": false },
  "scorecard": {
    "completeness": { "critical": 1, "warning": 0, "suggestion": 0 },
    "correctness": { "critical": 0, "warning": 1, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "findings": [
    { "pass": "3", "severity": "CRITICAL", "dimension": "completeness", "title": "Emit timing undefined for bare-mode explore", "file": "specs/emit/spec.md", "line": 12, "recommendation": "…", "reproduction": "run /orbit:explore with no name, speak two decisions, stop: no explore-<TS>.json is written and the spec names no rule for it" },
    { "pass": "5", "severity": "WARNING", "dimension": "correctness", "title": "Apply chunk-preamble format unspecified", "file": "specs/apply/spec.md", "line": 40, "recommendation": "…" }
  ],
  "stale_suppressed": [],
  "passes_run": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  "passes_skipped": [],
  "direction": { "disposition": "hold", "reasoning": "The bare-mode emit gap is a user path with no rule; settle it before apply." },
  "final_assessment": "1 critical, 1 warning, 0 suggestion.",
  "pass_genre": "REVIEW",
  "verified_walks": [],
  "iteration": 1,
  "next_recommended": "/orbit:address-reviews emit-run-summary-jsons-from-workflow-commands"
}
```

Lifecycle-kind example — an `archive` emit written after `/orbit:archive bootstrap-orbit-status-cli` (the `judgements` array carries the readiness record per `orbit-emit-composition`, its `formed_against` naming the independent passes it was formed against):

```json
{
  "command": "archive",
  "timestamp": "2026-05-20T16:31:59Z",
  "change": "bootstrap-orbit-status-cli",
  "kind": "lifecycle",
  "model": "claude-fable-5",
  "final_assessment": "Archived bootstrap-orbit-status-cli to orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/.",
  "archive_path": "orbit/changes/archive/2026-05-20-bootstrap-orbit-status-cli/",
  "audit": { "ran": true, "failure_reason": null, "findings_summary": { "critical": 0, "warning": 0, "suggestion": 0 }, "summary_path": null },
  "sync_specs": { "ran": true, "skipped_reason": null, "capabilities_updated": ["orbit-status-output"], "added": 3, "modified": 1, "removed": 0, "renamed": 0 },
  "unresolved_markers": [],
  "user_decision": "proceeded_with_no_critical",
  "consent": "user-invoked",
  "warnings": [],
  "judgements": [
    { "kind": "readiness", "formed_against": ["2026-05-19T22-10-04Z"], "disposition": "ready", "reasoning": "The system gate passed and the one independent pass's findings are all resolved.", "ratified_by": "user", "accepted": [{ "claim": "no independent pass read the final tree", "why": "the walk's edits were single-line repairs the verification graded landed" }] }
  ],
  "next_recommended": "Change archived. Run /orbit:new or /orbit:explore to start the next change, or /orbit:audit-drift for a project-wide drift check."
}
```

**Each canonical example is executed, never trusted.** A test SHALL read every `json` fence after the `**Canonical examples**` line of this requirement AS IT WILL STAND — the MODIFIED block of an active change's delta for this requirement when one exists (more than one such active change fails the test naming both), and the baseline otherwise, so a change that edits the examples is held to them during its own apply — found by the engine's CommonMark fence tracker, and for each: subtract the keys the engine composes and refuses in a payload for the example's `command` (the spine plus that command's engine-owned set, read from the engine's own list, never a test-side copy), submit the remainder through the real write gate (`composeAndWriteEmit`) in a disposable project of the target the command writes to (an active change for `apply` and `review` — for `review`, one named by the example's own `change`; an archived change directory for `archive`), seeded only as the write gate requires (a minimal `tasks.md` for `apply`, with no chunk seeded, because the engine writes the chunk keys on every apply emit; one minimal independent pass at every `formed_against` token), and assert that the gate ACCEPTS the payload and that the written emit's top-level key set EQUALS the example's. For the `review` example — on a fresh trail every value the engine composes for it except `timestamp` is reproducible — each engine-composed key the example carries other than `timestamp` SHALL EQUAL the written emit's value, a difference failing the test naming the key and both values, so the subtraction cannot discard a stale pointer or counts sentence unseen; its written emit is additionally rendered through `orbit status --change <name> --report`. A fence whose `command` the test has no target for fails the test naming the fence's opening line, so an example cannot be added unexecuted. Unlike a payload reference's round trip (`orbit-emit-composition`'s `Payload schema references are proven by execution`), this one SUBTRACTS before submission, because an example here is a written emit, not a payload. **Named limit.** For `apply` and `archive` the check is exactly as strong as the write gate's validators plus a top-level key-set comparison: a stale value under a current key, or a stale nested key, passes for them — including their engine-composed values, which the subtraction discards and the renderer never sees. For `review`, a stale value the payload supplies passes wherever the write gate and the renderer accept it.

#### Scenario: Universal spine present on every emit

- **WHEN** any orbit command (workflow, editorial, or lifecycle) writes a run-summary JSON
- **THEN** the JSON contains the 7 spine fields with valid values: `command`, `timestamp`, `change` (or null), `final_assessment`, `next_recommended`, `kind`, and `model` (nullable; absent only on pre-capability emits, which readers tolerate)

#### Scenario: Workflow command emit shape

- **WHEN** a workflow command (e.g., `/orbit:propose`, `/orbit:apply`, `/orbit:verify`) writes its JSON
- **THEN** `kind` equals `"workflow"`; per-command extensions are present per the `orbit-run-summary-emit` capability (which defines the specific extension fields per workflow command)

#### Scenario: Editorial command emit shape (with findings)

- **WHEN** an editorial command that has produced findings (`/orbit:review`, `/orbit:address-reviews`, `/orbit:audit-drift`) writes its JSON
- **THEN** `kind` equals `"editorial"`; per-command extensions include `iteration` (when the command tracks iterations), the counts shape the command owns (`scorecard` for review emits — D-arc Stage D4; audit-drift's per `orbit-run-summary-emit`'s `Audit-drift standalone recommendations`), plus command-specific fields documented in the emitting skill's `references/run-summary-schema.md`

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

#### Scenario: A stale canonical example fails by execution

- **WHEN** an engine change adds a field every `review` emit carries, and this requirement's editorial example is not updated
- **THEN** the canonical-example test fails: the written emit's top-level key set carries the new field and the example's does not, and the message names both sets

#### Scenario: A stale engine-composed value in the review example fails

- **WHEN** the editorial example's `next_recommended` is edited back to the self pointer `--from-file <this emit's own path>` while every key stays present
- **THEN** the canonical-example test fails naming `next_recommended`, the example's value and the value the engine writes for the example's own change

#### Scenario: An example with no executable target fails

- **WHEN** a fourth `json` fence is added after the `**Canonical examples**` line whose `command` is one the test has no target for
- **THEN** the test fails naming that fence's opening line

#### Scenario: An active change's edit to the examples is checked during its apply

- **WHEN** an active change's delta MODIFIES this requirement and its editorial example omits a key the engine writes
- **THEN** the canonical-example test fails before that change archives, reading the delta's block rather than the baseline's
