# orbit-conventions Specification

## Purpose
TBD - created by archiving change relocate-modified-upstream-workflows. Update Purpose after archive.
## Requirements
### Requirement: `@review:` marker convention

The system SHALL recognize `@review: <content>` as the inline review marker convention across all file types.

#### Scenario: Markdown — bare

- **WHEN** a markdown file contains `@review: <text>` in prose
- **THEN** the marker is recognized as an inline review request and is discoverable by `/orbit:address-reviews`

#### Scenario: Source code — inside file-type comments

- **WHEN** a source code file (TypeScript, JavaScript, Swift, Go, Rust, C, etc.) contains `// @review: <text>` (or `/* @review: <text> */`)
- **THEN** the marker is recognized; the marker text is the `@review:` portion onward

#### Scenario: Hash-comment files

- **WHEN** a Python, Ruby, shell, YAML, TOML, or similar hash-comment file contains `# @review: <text>`
- **THEN** the marker is recognized

#### Scenario: Single grep pattern

- **WHEN** a tool scans for markers
- **THEN** the grep pattern `@review:` finds markers across all supported file types without per-type wrappers

### Requirement: `@review(escalated):` and `@todo:` companion conventions

The system SHALL recognize two companion markers used by `/orbit:address-reviews` for unresolvable items: `@review(escalated): <content>` (deliberately persisted unresolved review) and `@todo: <content>` (permanent TODO).

#### Scenario: Escalated marker recognized

- **WHEN** a file contains `@review(escalated): <text>`
- **THEN** tools treat it as deliberately persisted; address-reviews does not re-prompt it unless the user explicitly opts in

#### Scenario: TODO marker recognized

- **WHEN** a file contains `@todo: <text>`
- **THEN** tools treat it as a permanent TODO, not as a review item

### Requirement: `orbit/lenses/` directory structure

The system SHALL define `orbit/lenses/` as the project-level judgment layer.

#### Scenario: Required files

- **WHEN** the lenses layer is in use
- **THEN** it contains `orbit/lenses/perspectives.md` and `orbit/lenses/critical-paths.md`

#### Scenario: Other lens files permitted

- **WHEN** future orbit lens types emerge (e.g., `error-paths.md`, `performance-budgets.md`)
- **THEN** they can be added to `orbit/lenses/` following the same content shape

### Requirement: `orbit/lenses/perspectives.md` entry shape

The system SHALL use a consistent entry shape for named perspectives.

#### Scenario: Per-entry structure

- **WHEN** a perspective entry is written
- **THEN** it uses the form: `## <Perspective Name>` heading, `**Surfaces**: <surface IDs>`, description prose, `**Typical call patterns**:` list

### Requirement: `orbit/lenses/critical-paths.md` entry shape

The system SHALL use a consistent entry shape for named critical paths.

#### Scenario: Per-entry structure

- **WHEN** a critical path entry is written
- **THEN** it uses the form: `## <Flow Name>` heading, description prose, `**Touchpoints**:` numbered list, `**Expected behavior**:` list (SLOs / contracts / invariants)

### Requirement: Lenses files grown via explore capture

The system SHALL grow `orbit/lenses/` files via `/orbit:explore` capture triggers, not via direct user authoring required.

#### Scenario: Empty lenses on fresh project

- **WHEN** a project is newly set up with orbit
- **THEN** `orbit/lenses/` may be empty; orbit commands degrade gracefully

#### Scenario: Captured during explore

- **WHEN** the user describes a caller or critical flow during exploration and accepts the capture offer
- **THEN** the new entry is appended to the appropriate file in `orbit/lenses/`

### Requirement: Surfaces NOT redeclared in lenses

The system SHALL derive surfaces from `orbit/specs/<capability>/spec.md` rather than redeclaring them in lenses.

#### Scenario: Surface reference

- **WHEN** a perspective entry references a surface ID
- **THEN** the ID corresponds to a capability under `orbit/specs/<capability>/`; the surface's behavior is defined by that capability's spec, not duplicated in lenses

### Requirement: `orbit/explore/<name>/` staging directory

The system SHALL define `orbit/explore/<name>/` as the staging area for `/orbit:explore` work prior to promotion via `/orbit:propose` — and as the HOME of an exploration that concluded in nothing (per the concluded outcome requirement), which stays in place with its trail so the readouts have a surface to render the conclusion on.

#### Scenario: Created by explore in named/crystallized modes

- **WHEN** `/orbit:explore` creates a named exploration
- **THEN** the directory `orbit/explore/<name>/` is created with an `explore.md` file and the minimal `.openspec.yaml` metadata file (D-arc Stage D2; contents per `orbit-explore-modifications`)

#### Scenario: Sibling files supported

- **WHEN** additional captures occur during exploration
- **THEN** sibling files (e.g., `sketches/*.md`, draft conventions) may be written under `orbit/explore/<name>/`

#### Scenario: Promoted via propose

- **WHEN** `/orbit:propose <name>` consumes a staging directory
- **THEN** the `orbit/explore/<name>/` directory's contents are moved to `orbit/changes/<name>/` — EXCEPT the staged `.openspec.yaml` (D-arc Stage D2), which is MERGED into the change's freshly-written metadata via the helpers and then discarded, never bulk-moved (per `orbit-propose-modifications`' merge requirement)

#### Scenario: A concluded exploration is not moved

- **WHEN** an exploration concludes
- **THEN** `orbit/explore/<name>/` remains in place with its header token flipped and its metadata untouched; nothing relocates it to an archive directory or a dot-directory

### Requirement: `explore.md` five-section format

The system SHALL use a fixed SIX-section format for `explore.md`, in this order: Premise, **Mechanism**, Decisions, Open questions, Considered & out, References. (The requirement's TITLE is retained for delta identity and as the name other capabilities point to; the format it specifies is six sections.) The status header carries one of two fixed tokens on the file's first non-blank line — `> **Status**: exploring. …` or `> **Status**: concluded <YYYY-MM-DD>.` (per the concluded outcome requirement) — matched by ONE production:

```
^> \*\*Status\*\*: (exploring\.( .*)?|concluded \d{4}-\d{2}-\d{2}\.)$      the file's first non-blank line
```

Any other first line is NEITHER token: the file resolves as not-concluded and the header is added on next touch (per `orbit-explore-modifications`' re-entry requirement), never MALFORMED — a status line is a pointer, not an entry. Decisions entries carry the ID opener and the `Kind:` / `Disposition:` slots (per the entry identity requirement); the Mechanism section carries one entry per live rule (per the Mechanism entry grammar). Open-question entries SHALL carry a `Standing recommendation:` slot — `Standing recommendation: <the current leaning>` or `Standing recommendation: none yet` — so a pending leaning discussed in conversation has a named, file-resident home (D-arc Stage D5, leak-hardening layer 1: AIs fill template slots far more reliably than they obey prose rules; the slot's RECORDED LEANING is what the emit surface's attestation counts — a `none yet` value attests an honestly empty slot, not a leaning, per `orbit-emit-composition`'s membership criterion).

#### Scenario: Section order

- **WHEN** an `explore.md` file is created
- **THEN** the sections appear in this order: Premise, Mechanism, Decisions, Open questions, Considered & out, References

#### Scenario: Status header

- **WHEN** an `explore.md` file is created
- **THEN** it includes the `> **Status**: exploring.` header (prose may follow the period); the only other legal status token is `concluded <YYYY-MM-DD>.` — the final period is part of the token, and nothing follows it

#### Scenario: Open questions carry the standing-recommendation slot

- **WHEN** an open question is captured in `explore.md`
- **THEN** its entry includes a `Standing recommendation:` line — the current leaning, or the literal `none yet`; an entry lacking the slot is a format violation the explore body corrects on next touch

#### Scenario: A pre-existing five-section file is read, not rejected

- **WHEN** an `explore.md` written before this format has no Mechanism section
- **THEN** it is read as authoritative and the section is added on next touch; the absent section is a format note, never a blocker

### Requirement: `.orbit-runs/` per-change persistence

The system SHALL use one of the following `.orbit-runs/` persistence locations, scoped by the type of work being persisted:

- **`orbit/changes/<change-name>/.orbit-runs/`** — per-change iteration history for active changes. Used by editorial commands (review, address-reviews, audit-drift inline), workflow commands operating on a named change (propose, new, continue, ff, apply, verify), and review-external T0. The primary persistence location. The `archive` emit is the deliberate EXCEPTION: it is written AFTER the directory move, directly to the archived change's trail (per `orbit-emit-composition`'s pre-computable archive rule — see the archived-trail scenario below).
- **`orbit/explore/<name>/.orbit-runs/`** — per-exploration iteration history for named-mode `/orbit:explore` sessions BEFORE the exploration is promoted to a formal change via `/orbit:propose`. Moves into `orbit/changes/<name>/.orbit-runs/` when `/orbit:propose <name>` consumes the staging directory (per the orbit-propose consume-mode convention).
- **`orbit/.orbit-runs/`** — project-scope iteration history for commands that have no change scope (currently: `/orbit:audit-drift` invoked with no `<change-name>` argument, i.e., project-wide standalone). Created if it doesn't exist.
- **`orbit/architecture/.orbit-runs/`** — architecture-scoped iteration history (D-arc Stage D2): `/orbit:architect` emits and `/orbit:review --as architecture` emits, one directory shared by all architecture docs (each emit names its doc). Created if it doesn't exist; NOT moved by change archiving (architecture docs persist across changes).

In all four locations, files are committed (the directory SHOULD NOT be in `.gitignore`) and follow the same naming pattern (`<command>-<ISO-timestamp>.json` for internal-run JSONs; `external-<as>-<ISO-timestamp>.md` for external-review files).

#### Scenario: Active-change emit goes to changes/<name>/.orbit-runs/

- **WHEN** orbit writes a run summary for a named, active change (e.g., `/orbit:review foo`, `/orbit:apply foo`)
- **THEN** the file lands at `orbit/changes/foo/.orbit-runs/<command>-<TS>.json`

#### Scenario: Archive emit lands on the archived trail

- **WHEN** `/orbit:archive foo` completes the move to `orbit/changes/archive/<YYYY-MM-DD>-foo/`
- **THEN** the `archive-<TS>.json` emit is written to `orbit/changes/archive/<YYYY-MM-DD>-foo/.orbit-runs/` (per `orbit-emit-composition`'s archive rule), joining the trail that moved with the change

#### Scenario: Named-mode exploration emit goes to explore/<name>/.orbit-runs/

- **WHEN** `/orbit:explore foo` (named mode) writes its run-summary JSON at a conversation boundary
- **THEN** the file lands at `orbit/explore/foo/.orbit-runs/explore-<TS>.json` (NOT `orbit/changes/foo/.orbit-runs/`, since `foo` is still in the staging area pre-`/orbit:propose`)

#### Scenario: Architecture-scoped emit goes to orbit/architecture/.orbit-runs/

- **WHEN** `/orbit:architect <doc>` or `/orbit:review --as architecture <doc>` writes its run-summary JSON
- **THEN** the file lands at `orbit/architecture/.orbit-runs/<command or review-architecture>-<TS>.json` with `change: null` and a `doc` field naming the architecture doc

#### Scenario: Project-wide standalone emit goes to orbit/.orbit-runs/

- **WHEN** `/orbit:audit-drift` runs with no change argument and writes its run-summary JSON
- **THEN** the file lands at `orbit/.orbit-runs/audit-drift-<TS>.json` (create the directory if it doesn't exist); the JSON's `change` field is `null`

#### Scenario: Exploration .orbit-runs/ travels with promotion to changes/

- **WHEN** `/orbit:propose foo` (consume mode) moves the staging directory `orbit/explore/foo/` into `orbit/changes/foo/`
- **THEN** the contents of `orbit/explore/foo/.orbit-runs/` (including any prior `explore-<TS>.json` emits) are preserved and now live at `orbit/changes/foo/.orbit-runs/`; subsequent emits go to the new location

#### Scenario: Committed, not gitignored (all four locations)

- **WHEN** orbit writes a run summary or external-review file to any of the four `.orbit-runs/` locations
- **THEN** the file is intended to be committed (none of the four directories should be in `.gitignore`); each represents real iteration history

#### Scenario: Internal run summary file name pattern

- **WHEN** a review, audit, address-reviews, archive, or workflow command writes a summary
- **THEN** the file is named `<command>-<ISO-timestamp>.json` (e.g., `review-proposal-2026-05-21T00-18-14Z.json`, `apply-2026-05-21T13-34-12Z.json`)

#### Scenario: External review file name pattern

- **WHEN** the external-review packaging branch (`/orbit:review --reviewer external`) produces a prompt file (or external AI produces a findings file following the prompt)
- **THEN** the file is named `external-prompt-<as>-<ISO-timestamp>.md` for prompts and `external-<as>-<ISO-timestamp>.md` for findings (e.g., `external-prompt-proposal-2026-05-21T01-32-52Z.md`, `external-proposal-2026-05-21T01-39-56Z.md`)

#### Scenario: Travels with archive

- **WHEN** the change is archived via `/orbit:archive`
- **THEN** the `.orbit-runs/` directory at `orbit/changes/<name>/.orbit-runs/` moves to `orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/` as part of the change content (the project-wide `orbit/.orbit-runs/` location is NOT moved — it's project-scope and persists across changes)

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

### Requirement: External-review findings markdown format

The system SHALL use a consistent markdown shape for external-review findings files.

#### Scenario: Required structure

- **WHEN** an external-review findings file is written
- **THEN** it contains: `# External Review: <change> (iteration N)` title, `**Reviewer**:` and `**Date**:` fields, severity sections (`## CRITICAL`, `## WARNING`, `## SUGGESTION`), each containing `### <Title>` entries with `**File**: <path>:<line>` and `**Description**: <text>` fields; optional `## Notes` section. The `**Description**:` label OPENS the body whether its text begins on the same line or on the following lines; the body runs to the `**Reproduction**:` label, the next `###` or the next `##` heading, and a Description with no non-blank body (fenced lines count as body) is MALFORMED in both readers — the renderer rejects the file naming the finding, the trail reader records a rejected return — never a present-but-empty field in one and absent in the other. A CRITICAL entry additionally carries a `**Reproduction**: <text>` body AFTER its `**Description**:` body (ended by the next `###` or `##` heading); a CRITICAL without one is counted as authored and marked `unreproduced` by the renderer, never re-graded. An optional `## Blocks` section (before `## Notes`) lists must-address-before-apply conditions that are not severities (per the Severity ladder requirement) as `- <what>` items; the renderer's parser collects those items for the report's Blocks section (a bulleted `- None.` is the empty-section sentinel, not a block) and the trail counter ignores the section, so it changes no count.

#### Scenario: Parseable by --from-file

- **WHEN** `/orbit:address-reviews --from-file <path>` reads this format
- **THEN** the parser extracts per-finding severity, title, file:line, description, and — when present — the reproduction body; `## Blocks` entries are listed at triage and never walked as findings

#### Scenario: Field lines are recognised only before the Description body opens — in BOTH readers

- **WHEN** a finding's `**Description**:` body — opened by the label, with its text on the same line or the next — (and any `**Reproduction**:` body after it, or a `## Blocks` item) contains a line that looks like a field — `**File**: other/path.md:99`, `**Description**: …` — because a reproduction quotes a path or a reviewer pastes a snippet
- **THEN** that line is CONTENT, with ONE exception: `**Reproduction**:` is the sole field label recognised AFTER a Description body opens — it ENDS the Description body and opens the Reproduction body, which runs to the next `###` or `##` heading. Every other field-shaped line inside a Description, Reproduction or Blocks body is content: the finding's file is the `**File**:` line read BEFORE its Description body opened, and both the renderer's parser (`orbit-report-rendering`) and the trail reader that feeds the gate (`orbit-engine-gates`' shape validation) read it the same way, so the gate's finding key (title, repo-relative file) and the report's file reference never diverge; a test pins the KEY across both readers, not only the per-severity counts

#### Scenario: Reproduction body is the fourth field, never the first

- **WHEN** an external findings file carries `**Reproduction**:` on a finding
- **THEN** it follows the `**Description**:` body; a `**Reproduction**:` line placed before `**Description**:` is not recognised (the parser contract opens the recommendation body at Description, and a file without the label parses exactly as before this requirement)

### Requirement: 3-dimension scorecard reporting convention

The system SHALL use a consistent 3-dimension scorecard for review and audit reports.

#### Scenario: Standard dimensions

- **WHEN** a review or audit command emits a scorecard
- **THEN** the dimensions are Completeness / Correctness / Coherence (matching upstream `verify-change`)

#### Scenario: Review-report scorecard table is the engine grammar (D-arc Stage D4)

- **WHEN** a proposal- or system-mode review report renders its scorecard table
- **THEN** the table is `orbit-report-rendering`'s pinned Dimension × severity-counts form (the cells ARE the validated findings rollup) — the Status-column convention below does not apply to engine-rendered review reports

#### Scenario: Status column carries metrics (hand-rendered scorecards)

- **WHEN** a verify- or audit-style scorecard is hand-rendered as a table (outside the engine-rendered review report)
- **THEN** the Status column contains brief metrics (e.g., "X/Y tasks, N reqs", "2 baseline regressions, 1 cohesion drift"), not just issue counts

### Requirement: Severity ladder

The system SHALL use a consistent severity ladder across reports, and SHALL define each severity by its CONSEQUENCE — stated ONCE, here. CRITICAL: a user path breaks or data is lost, AND the finding carries its REPRODUCTION. WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. A REPRODUCTION is a case the reader can re-execute — the inputs, the rule or command, the expected result, the observed result; a command in system mode, a CONSTRUCTED CASE in proposal mode, where nothing runs (a named trail, the rule applied by hand, the wrong answer it yields). Every other surface that assigns a severity — a review pass's rule, a prompt's guidance, a parser's section — SHALL NAME this ladder and state the condition and its consequence, never a second definition (the one-statement rule). A lifecycle BLOCK — a condition that stops apply whatever it would cost a user, such as an `orbit validate` failure or an unresolved `@review:` marker — is NOT a severity: it is reported, named as a block, and carried in no scorecard cell — on an internal pass in the review emit's `blocks` array (per `orbit-review` and `orbit-emit-composition`), on an external file under `## Blocks`, rendered in the report's Blocks section above the findings (per `orbit-report-rendering`), and listed before any finding at the walk's triage (per `orbit-address-reviews`). Known limit: no lifecycle seam STOPS on a block today — the apply flow carries no validate or marker precondition, and the only lifecycle reader of markers is the archive flow's Step 1.5 warning; a block is a report with a name, and the stop is the human's until a stage gives apply a precondition. The engine checks the PRESENCE of a reproduction where it writes the record (per `orbit-emit-composition`) and marks its absence where it cannot refuse (per `orbit-report-rendering`); whether a reproduction reproduces is the walk's judgement (per `orbit-address-reviews`), never a reader's re-grade. Known limits: `orbit-audit-drift` assigns its own severities, which system review preserves, and upstream `verify-change` grades by its own rules (an incomplete task is its CRITICAL) — two statement sites this ladder does not yet reach; a system review folding verify-change's findings into its own emit is their AUTHOR and grades them by this ladder (per `orbit-review`'s Pass 0 scenario).

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

### Requirement: Actionable findings

The system SHALL include actionable detail in every finding.

#### Scenario: File:line + recommendation

- **WHEN** a finding is reported
- **THEN** it includes a `file:line` reference (or equivalent location) and a specific actionable recommendation; never vague text like "consider reviewing X"

### Requirement: Final-assessment phrasings

The system SHALL use stock phrasings for the final-assessment line of AUDIT reports and gate-less architecture-mode review reports; proposal- and system-mode REVIEW reports carry no skill-authored final-assessment line — their assessment, gate, and eligibility lines are the engine-rendered tail of the pasted report per `orbit-report-rendering` (D-arc Stage D4).

#### Scenario: Stock phrasings (audit reports)

- **WHEN** an audit-drift scorecard report is emitted
- **THEN** the final-assessment line uses one of:
  - `X critical issue(s) found. Fix before <gate>.`
  - `No critical issues. Y warning(s) to consider. Ready <gate> (with noted improvements).`
  - `All checks passed. Ready <gate>.`
  where `<gate>` varies per audit-drift invocation context

#### Scenario: Review reports end in the engine tail (D-arc Stage D4)

- **WHEN** a proposal- or system-mode review report is produced
- **THEN** it is the pasted `orbit status --change <name> --report` render whose final lines are the engine-computed gate/position/eligibility tail — no stock skill-authored assessment line exists

#### Scenario: Gate-less architecture-mode phrasings (D-arc Stage D2)

- **WHEN** `/orbit:review --as architecture` emits its final-assessment line
- **THEN** the gate-referencing phrasings above do NOT apply (no gate exists over architecture docs); the line uses the gate-less forms specified in `orbit-review`'s `Architecture-mode final assessment has no gate` requirement (`X critical / Y warning(s). Ready when you are: /orbit:address-reviews --from-file <emit>.` with findings; `No findings. The architecture trail records this pass.` when clean)

### Requirement: Pushback discipline

The system SHALL verify findings against current state before reporting (for review/audit) or before fixing (for address-reviews).

#### Scenario: Discipline applies across commands

- **WHEN** a finding's basis may have changed since the finding was generated or proposed
- **THEN** the command checks current state (grep, git log, file read) before acting; if the finding is stale, it is suppressed (review/audit) or skipped (address-reviews) with evidence

### Requirement: Convention files at project root

The system SHALL place convention files (e.g., `naming_convention.md`) at the project root rather than under `orbit/` or in a subdirectory.

#### Scenario: Convention file location

- **WHEN** a convention is captured during explore
- **THEN** the target file is at the project root (e.g., `naming_convention.md`); `CLAUDE.md` (also at root) may reference these files

#### Scenario: Topic-specific naming

- **WHEN** a new convention category is captured
- **THEN** the file name follows the pattern `<topic>_convention.md` (e.g., `naming_convention.md`, `error_handling_convention.md`)

### Requirement: Convention file internal format

The system SHALL use a defined light-structured format for convention files: four named sections in a fixed order, with sections optional when not applicable to the topic.

#### Scenario: Required section order

- **WHEN** a convention file is created
- **THEN** the sections appear in this order when present: `## Purpose`, `## Rules`, `## Examples`, `## Exceptions`

#### Scenario: Purpose section

- **WHEN** a Purpose section is present
- **THEN** it contains 1-2 sentences explaining why the convention exists

#### Scenario: Rules section

- **WHEN** a Rules section is present
- **THEN** it contains numbered or bulleted rule statements, each with a brief rationale; rules use SHALL / MUST for normative force where applicable

#### Scenario: Examples section

- **WHEN** an Examples section is present
- **THEN** it shows correct usage (and may show incorrect usage) so AI and human readers can disambiguate edge cases

#### Scenario: Exceptions section

- **WHEN** an Exceptions section is present
- **THEN** it explicitly enumerates the cases where the convention does not apply

#### Scenario: Optional sections omitted

- **WHEN** a section does not apply to the convention's topic
- **THEN** the section header MAY be omitted; the remaining sections still appear in the canonical order

### Requirement: Convention file consumers

The system SHALL have multiple orbit commands consume convention files, with each consumer's behavior defined.

#### Scenario: `/orbit:review --as proposal` Pass 3 — cross-doc coherence

- **WHEN** Pass 3 (Cross-Doc Coherence) runs
- **THEN** it reads all `*_convention.md` files at project root and checks that the change's proposal, design, and spec deltas align with declared conventions; violations are reported as findings

#### Scenario: `/orbit:review --as proposal` Pass 7 — drift hunt

- **WHEN** Pass 7 (Drift Hunt) runs
- **THEN** it cross-checks the change's artifacts against current conventions, flagging vocabulary or naming that contradicts a declared convention

#### Scenario: `/orbit:review --as system` Pass 2 — cohesion

- **WHEN** Pass 2 (Cohesion) runs
- **THEN** it lightly checks that the change's code follows declared conventions; heavy syntactic enforcement is out of scope (that's a linter's job)

#### Scenario: `/orbit:audit-drift` Category 3 — cross-doc consistency

- **WHEN** Category 3 runs
- **THEN** it checks that conventions do not contradict each other, and that conventions do not contradict `CLAUDE.md` or `project.md`

#### Scenario: `/orbit:explore` reads conventions for context

- **WHEN** explore is running and the conversation touches a topic with an existing convention file
- **THEN** the AI reads the relevant `*_convention.md` to inform its responses; it offers updates if the conversation contradicts the existing convention

#### Scenario: `/orbit:propose` honors conventions during artifact generation

- **WHEN** propose generates artifacts (consume or standalone mode)
- **THEN** the generated content respects declared conventions (e.g., capability names follow `naming_convention.md`)

#### Scenario: `/orbit:address-reviews` ripple flag includes conventions

- **WHEN** a marker's resolution touches a topic that has a convention file
- **THEN** the resolution log's ripple-flag list includes the relevant `*_convention.md` for user awareness

### Requirement: Convention staleness handling

The system SHALL detect and surface stale convention files.

#### Scenario: Convention contradicts current state

- **WHEN** `/orbit:audit-drift` Category 3 finds that a convention contradicts the code's current behavior (e.g., convention says kebab-case but most files are snake_case)
- **THEN** a WARNING is reported with a recommendation to either update the convention to match reality or migrate the code to match the convention

#### Scenario: Convention contradicts another convention

- **WHEN** Category 3 finds two conventions making incompatible claims
- **THEN** a WARNING is reported with both file:line references

#### Scenario: Convention file references removed concepts

- **WHEN** a convention file mentions a term/symbol/concept that has been removed from the codebase per archived change deltas
- **THEN** Category 1 (Vocabulary residue) flags the file:line with a recommendation to update or remove the reference

### Requirement: Convention scope distinct from other knowledge layers

The system SHALL maintain conventions as a distinct knowledge layer from CLAUDE.md, project.md, specs, and lenses.

#### Scenario: Convention vs. CLAUDE.md

- **WHEN** a user describes a durable rule that applies broadly (e.g., "files use kebab-case")
- **THEN** the capture target is `<topic>_convention.md`, not `CLAUDE.md`; CLAUDE.md is reserved for orientation and may reference convention files

#### Scenario: Convention vs. spec

- **WHEN** a user describes a behavioral requirement specific to a capability
- **THEN** the capture target is the capability's spec, not a convention file; conventions apply broadly across the codebase, specs describe capability-specific behavior

#### Scenario: Convention vs. lens

- **WHEN** a user describes a caller or critical flow worth validating from
- **THEN** the capture target is `orbit/lenses/`, not a convention file; lenses describe judgment about *what matters for review*, conventions describe *how the system should be built*

### Requirement: Change completeness discipline

The system SHALL apply substantive modifications to a change-in-flight fully across all affected artifacts before the modification is declared done. Residue cleanup is not optional and is not deferred to subsequent review cycles. This requirement applies regardless of how the modification was triggered — formal orbit command, mid-cycle decision captured during exploration, or direct user request in chat all qualify equally.

#### Scenario: Substantive modification triggers full completeness sweep

- **WHEN** the AI makes a substantive change to a change-in-flight (rename, capability merge, scope change, command consolidation, marker-convention change, file-naming change, or any modification that touches multiple artifacts)
- **THEN** before declaring the modification done, the AI: (a) greps the change directory + `README.md` + sketches + `design.md` + `tasks.md` + `explore.md` for all plausible variants of the old form (capitalized, snake-cased, hyphenated, slash-prefixed-command, capability-name, file-name, JSON-key); (b) classifies each match as current-state or legitimate-historical (in Considered & out, alternatives-considered, prior-decision context); (c) fixes the current-state matches; (d) re-validates with `orbit validate <change>` and re-runs the grep to confirm zero current-state residue

#### Scenario: Mechanical replacement requires manual follow-up

- **WHEN** the AI uses `sed`, find-replace, or other mechanical replacement to apply a rename or pattern change
- **THEN** it MUST follow up with a manual review of each touched file looking for: (a) residue the mechanical pattern didn't reach (places the pattern was too narrow); (b) new bugs introduced by overly-broad replacement (e.g., file-name corruption like `"proposal-mode review.md"` produced by a pattern that should have stopped at word boundaries, or duplicate-entry corruption when two distinct names collapse to the same target); (c) awkward phrasing artifacts (e.g., parenthetical inserts like `"review (system mode) wraps"` that read clumsily and need a second-pass rewording)

#### Scenario: Known residue MUST NOT be left for review

- **WHEN** the AI is about to invoke `/orbit:review` (any reviewer class) or any other review-cycle command after a substantive modification
- **THEN** it MUST first verify completeness per the previous scenarios; known residue (residue the AI is aware of) MUST NOT be deferred to the review cycle to catch — leaving known issues for a reviewer corrupts the review signal (the reviewer wastes effort on things the AI knew about) and violates the cost-up-front guiding principle (small cost now to surface known issues, save the larger cost of having the reviewer rediscover them)

#### Scenario: Modification scope distinguishes substantive from cosmetic

- **WHEN** evaluating whether a modification requires the full completeness sweep
- **THEN** modifications that affect command names, capability names, file paths, marker conventions, file-format conventions, JSON schemas, or any term used across multiple artifacts qualify as **substantive** (full sweep required); modifications that affect a single isolated typo, a single comment in a single file, or a wording polish in a single paragraph are **cosmetic** (no full sweep required)

#### Scenario: Cleanup-before-prompt-push timing for external review

- **WHEN** the AI plans to follow up a substantive modification with an external review (`/orbit:review --reviewer external` — writing a prompt file and pushing it for an external AI to pull)
- **THEN** the completeness sweep MUST complete BEFORE the prompt file is pushed; doing the cleanup concurrent with an in-progress external review means the external AI is analyzing stale state and produces mixed-state findings the authoring AI then has to pushback-suppress at ingest time — friction that is avoidable by ordering cleanup first

#### Scenario: Lesson origin in `explore.md`

- **WHEN** the AI executes this requirement
- **THEN** it MAY reference the specific origin: this discipline was codified after a real-time failure during the bootstrap-orbit-spec dogfood where (a) a major rename (`/orbit:review-proposal` + `/orbit:review-system` → unified `/orbit:review --as <mode>`) was applied via sed; (b) the AI knew residue remained; (c) the AI proposed letting the next review cycle catch it; (d) the user correctly pushed back that this violated the cost-up-front principle; (e) the AI's corrective cleanup landed concurrent with the in-progress external review, producing the mixed-state findings problem the previous scenario describes. The lesson and its origin are captured in `explore.md` Decisions for future readers.

### Requirement: Read-before-reference discipline

The system SHALL read the actual definition of any specific named construct (function signature, type/interface, class definition, object shape, named symbol, file path, import target, API surface, spec requirement name) before generating code, tests, specs, or documentation that references it. Inference from training-data patterns, common conventions, or "this is how this is usually structured" is NOT a substitute for reading the actual definition. This discipline applies whenever the AI authors content that names or invokes specific local constructs.

#### Scenario: Test code references production code

- **WHEN** the AI is writing a test that calls, mocks, asserts on, or otherwise references a specific production-code construct (a function, method, class, object, API endpoint, schema field, etc.)
- **THEN** the AI MUST read the production code first via `Read`, `grep`, or `orbit instructions` — and use the actual signature/shape verbatim; the AI MUST NOT assume the shape based on conventions (e.g., must NOT assume `user.email` when the code may actually use `user.emailAddress` or `user.contact_email`)

#### Scenario: Implementation references existing code

- **WHEN** the AI is writing implementation that calls an existing function, instantiates an existing class, imports from an existing module, or constructs an object of an existing type
- **THEN** the AI MUST read the existing definition first — function signatures must match, type/interface shapes must match, import paths must verify, named exports must exist

#### Scenario: Spec deltas reference baseline capabilities

- **WHEN** a spec delta (`## ADDED`, `## MODIFIED`, `## REMOVED`, `## RENAMED Requirements`) references a baseline requirement by name
- **THEN** the AI MUST read the baseline spec at `orbit/specs/<capability>/spec.md` to confirm the requirement exists with the exact name being referenced; a `RENAMED FROM` symbol that doesn't exist in baseline is a structural error caught at the authoring step, not at review

#### Scenario: Cross-spec references in specs

- **WHEN** a scenario in one spec references a construct, command, or concept defined in another spec
- **THEN** the AI MUST grep for the referenced name (e.g., `grep -rn "<symbol>" orbit/`) before authoring the reference; if the name doesn't resolve, either the reference is wrong or the cross-spec target is missing — both surface at authoring time, not as a downstream finding

#### Scenario: Tool invocations or CLI commands

- **WHEN** the AI is invoking a CLI tool or shell command that takes specific flags / subcommands / arguments
- **THEN** the AI MUST verify the flag exists (via `<tool> --help`, `orbit --help`, manpage, or documentation) before using it; the AI MUST NOT guess flags based on "common patterns" (e.g., must NOT assume `--verbose` exists if the tool documents `-v` or `--debug`)

#### Scenario: Scope of "read" is the specific construct, not the whole module

- **WHEN** the AI applies this discipline
- **THEN** "read" means reading enough of the construct to verify the reference — typically a `grep -n <symbol>` to locate, followed by reading 10–50 lines of context around the definition; it does NOT mean "read the entire file" or "read the entire codebase" — that would be infeasible. The bar is: enough context to know the construct exists and has the shape you're using.

#### Scenario: When verification is genuinely uncertain

- **WHEN** the AI cannot verify a reference (the file doesn't exist, the symbol isn't found, the documentation is ambiguous)
- **THEN** the AI MUST either (a) ask the user via `AskUserQuestion` for clarification, or (b) report the uncertainty in the output (`@review: unable to verify <reference>; <fallback assumption>`), or (c) refuse to generate the reference. The AI MUST NOT invent a plausible-looking reference and proceed silently.

#### Scenario: Conceptual reasoning vs. specific references

- **WHEN** the AI is writing prose, design rationale, or architectural discussion at a conceptual level (e.g., "this looks like an Observer pattern", "the API follows REST conventions")
- **THEN** read-before-reference does NOT require verifying every detail — conceptual reasoning is allowed. The discipline kicks in when a SPECIFIC NAMED CONSTRUCT enters the output (a specific function name, a specific field, a specific import path); at that boundary, verification is required.

#### Scenario: Lesson origin

- **WHEN** the AI executes this requirement
- **THEN** it MAY reference the specific origin: this discipline was codified after a real-world failure during home-env development where the AI wrote a test case that assumed the structure of an object based on common patterns instead of reading the actual code. The test passed locally (because the AI's mock matched its own assumption) but the underlying assumption was wrong. The same failure mode in production code rather than test code would have shipped broken behavior. The discipline distinguishes authoring-time verification (read the source before referencing) from review-time pushback (verify against current state when responding to findings) and modification-time completeness (apply changes fully across all affected artifacts).

### Requirement: orbit does not replace linter/hook tooling

The system SHALL define convention files as an AI-readable rules layer that coexists with — does not replace — automated tooling like linters, formatters, and pre-commit hooks.

#### Scenario: Automated tooling preserved

- **WHEN** a project uses linters (`.eslintrc`, `.prettierrc`, etc.) or pre-commit hooks
- **THEN** orbit's convention files do NOT duplicate or replace those tools; the linter remains the authoritative enforcement mechanism for syntactic rules, while convention files carry rationale and apply to broader rules tooling can't catch

#### Scenario: Light vs heavy enforcement boundary

- **WHEN** an orbit command (e.g., `/orbit:review --as system` Pass 2) "lightly checks" code against conventions
- **THEN** "light" means: grep-pattern matching against expected names; spot-checks against named rules; spot-reading of representative files. "Heavy" means: full AST analysis; exhaustive walk of every line; per-file conformance certification — these are the linter's job, not orbit's. Light checks surface SUGGESTIONS for the user to investigate; the AI does not certify full conformance

### Requirement: Distribution model — self-contained fork

The system SHALL be distributed as a self-contained hard fork of upstream `@fission-ai/openspec` — one CLI (`orbit`) containing both the vendored upstream engine and orbit's editorial/judgment layer. Skill and command files in user projects are generated artifacts (`orbit init` / `orbit update`) produced from templates bundled in the CLI; there is no overlay, no separately-installed upstream CLI, and no file copy-step.

#### Scenario: Fork shape

- **WHEN** orbit ships
- **THEN** the deliverable is the `orbit` CLI; orbit's editorial content lives in the CLI's bundled workflow templates, and the per-project skill/command files are generated from those templates — never hand-copied into place

#### Scenario: Consumers adopt via orbit init

- **WHEN** a user adopts orbit in a project
- **THEN** they install the single `orbit` tool and run `orbit init`, which scaffolds the `orbit/` workspace and generates the tool-specific skills and commands; no upstream `@fission-ai/openspec` install is required or consulted

#### Scenario: Generated files are regenerated, not merged

- **WHEN** `orbit update` runs in a project
- **THEN** skill/command files are rewritten from the CLI's bundled templates; the customization surface is orbit's source (the templates), not hand-edits to generated files

#### Scenario: Upstream is a read-only cherry-pick source

- **WHEN** an upstream improvement is wanted in orbit
- **THEN** it arrives via a deliberate, surgical cherry-pick from the read-only `upstream` remote, landed as an ordinary orbit commit; there is no auto-ingest

### Requirement: Upstream version pinning

The system SHALL declare the specific upstream `@fission-ai/openspec` version its vendored engine is based on (currently 1.3.1 — the repo's root commit, tagged `upstream/v1.3.1`). Version upgrade is a deliberate change-proposal event, not an automatic ingest.

#### Scenario: Pinned baseline declared in CLAUDE.md

- **WHEN** a user or AI reads `CLAUDE.md` at the orbit repo root
- **THEN** the vendored upstream baseline version is clearly stated in the introductory context

#### Scenario: Pinned baseline declared in README

- **WHEN** a user reads the orbit `README.md`
- **THEN** the engine's upstream baseline (e.g., `@fission-ai/openspec@1.3.1`) is named, so consumers know which upstream behavior set the engine carries

#### Scenario: Version upgrade is a deliberate change

- **WHEN** orbit's contributors consider moving the vendored engine to a newer upstream version
- **THEN** the upgrade is proposed as its own change (with explicit upgrade-and-port scope) and lands as reviewed cherry-picks, not silent maintenance; the new baseline replaces the prior one in CLAUDE.md + README + this requirement's documented value

#### Scenario: Upstream improvements do not auto-propagate

- **WHEN** upstream releases `@fission-ai/openspec` v1.3.2, v1.4.0, or later
- **THEN** orbit users do not receive those improvements until a deliberate upgrade or cherry-pick change lands in orbit; this is an accepted trade-off of the self-contained fork model

### Requirement: Generated-file disposition

The system SHALL classify every skill and command file orbit generates into one of four disposition categories by template provenance. Each category dictates how the file's source template is maintained in the fork.

#### Scenario: Orbit-authored — full ownership

- **WHEN** a generated file's template body has no upstream-derived content (currently `orbit-onboard`, whose body replaces upstream's guided-tour content entirely; the net-new editorial workflows — review (whose `--reviewer external` branch absorbed the external packaging at D-arc Stage D5's merge; the standalone review-external template joined at B3 and RETIRED at D5), audit-drift, address-reviews; and `orbit-architect`, fully orbit-authored — joined as the 16th workflow at D-arc Stage D2, the surface standing at 15 post-D5)
- **THEN** the template is fully owned by orbit; orbit's contributors edit it freely; the file uses the `orbit-*` directory naming convention for consistency with siblings even when the body is 100% orbit-authored

#### Scenario: Orbit-modified — upstream body with `# Orbit additions`

- **WHEN** a generated file's template bundles upstream's body with an appended `# Orbit additions` section (`orbit-explore`, `orbit-propose`, `orbit-archive-change`, `orbit-apply-change`, `orbit-verify-change`, `orbit-continue-change`, `orbit-ff-change`, `orbit-new-change`, `orbit-bulk-archive-change`)
- **THEN** the upstream-authored portion is the vendored-baseline snapshot and is left intact (keeping future upstream cherry-picks tractable); orbit's behavior and constraints land in the additions section

#### Scenario: Upstream-verbatim — kept unchanged

- **WHEN** orbit generates an upstream skill it never modified because its interaction is at the invocation layer, not the skill-body layer (currently `orbit-sync-specs`, which upstream's own archive flow invokes as a callable primitive)
- **THEN** the template carries the upstream body unchanged; no `# Orbit additions` section is needed

#### Scenario: Not generated — excluded from the install surface

- **WHEN** an upstream skill provides no orbit-mission value (e.g., `feedback`, which sends user feedback to Fission-AI and has no role in orbit's workflow)
- **THEN** orbit does not register its template for generation; a fresh `orbit init` produces no such skill or command in the project

#### Scenario: Per-skill disposition is documented

- **WHEN** orbit's contributors evaluate a new upstream skill arriving via a future engine upgrade or cherry-pick
- **THEN** the disposition decision is recorded in the change proposal that performs the upgrade; the new skill is assigned to one of the four categories with rationale

#### Scenario: Commands are thin launchers delegating to skills

- **WHEN** orbit generates (or declines to generate) a `/orbit:*` command file
- **THEN** the command is a thin launcher that invokes its corresponding skill (the skill is the single source of workflow behavior and carries the disposition above); the command surface mirrors the skill surface 1:1, and a skill that is not generated has no command either

### Requirement: Verb-prefix naming taxonomy preserved

The system SHALL preserve the four-verb-prefix naming taxonomy across all current and future orbit commands.

#### Scenario: Verb categories

- **WHEN** a new orbit command is proposed
- **THEN** its name uses one of the four established verbs based on its operation: `verify-*` (upstream — structural correctness checks), `review-*` (orbit — opinionated editorial passes), `audit-*` (orbit — scan for drift/residue/staleness), `distill-*` (orbit — reduce to essential)

#### Scenario: New verb requires justification

- **WHEN** a proposed command does not fit any of the four established verbs
- **THEN** the proposal MUST justify the new verb explicitly (in `design.md` or equivalent) before the command's spec is accepted; ad-hoc verb proliferation is rejected

### Requirement: Install documentation describes actual install surface

The README's installation, update, and uninstall sections SHALL describe the actual surface `orbit init` (and `orbit update`) produces at the current orbit version. Skill counts, command counts, file lists, CLI invocations, and behavior warnings SHALL match what a fresh sandbox install produces. This requirement exists because README-vs-install-surface drift recurred under orbit's predecessor overlay distribution despite discipline alone; sandbox verification is the structural guard.

#### Scenario: README skill and command counts match install output

- **WHEN** a reader follows the README's documented install steps in a fresh sandbox (`mktemp -d` + a supported Node version) and runs `orbit init` for their tool
- **THEN** the generated skill and command directories for that tool contain exactly the files the README's "What you should see after install" section enumerates, with counts matching exactly; no file is documented that isn't generated, and no generated file is omitted from the documentation

#### Scenario: CLI invocations in README are non-interactively executable

- **WHEN** a reader executes the CLI commands documented in the README's install, update, or uninstall sections in a non-interactive shell (stdin closed)
- **THEN** each command succeeds (or exits with the specific error/warning the README documents); no command produces an unexpected error from missing required flags, no command hangs on a prompt the README didn't warn about, no command's exit behavior contradicts the prose

#### Scenario: README-modifying changes pair with sandbox verification

- **WHEN** a change proposal modifies README install/update/uninstall sections
- **THEN** the change SHALL include an apply-time fresh-sandbox verification task that runs the documented CLI sequence end-to-end and confirms the file-system state matches the documentation; verification failures escalate via `@review(escalated):` rather than ship undocumented behavior

#### Scenario: Engine upgrades and surface changes include README sync

- **WHEN** a change proposal upgrades the vendored upstream engine (per `Upstream version pinning`) OR modifies the generated surface (per `Generated-file disposition` — adding, removing, or recategorizing a workflow template)
- **THEN** the proposal SHALL include a README install-section synchronization task that updates counts, file lists, and CLI invocations to match the new install surface; the synchronization task is required before the upgrade/surface-change is considered apply-complete

#### Scenario: User-facing behavior warnings are accurate, not pessimistic

- **WHEN** the README documents the behavior of a CLI command (e.g., `init --force` overwrite scope, `orbit update` regeneration of skill/command files)
- **THEN** the warning text SHALL accurately describe what the command does at the current version, neither understating nor overstating risk; overly-cautious warnings that don't match actual behavior are themselves drift and SHALL be corrected to match sandbox-verified facts

### Requirement: Review mode decision framework

The system SHALL codify the decision criteria for choosing among orbit's three reviewer classes (in-context, fresh, external — the `--reviewer` axis on the merged `/orbit:review` surface, D-arc Stage D5; "mode" belongs to `--as proposal|system|architecture`). The framework is stated HERE and nowhere else today — no README or `docs/` section states review-mode guidance (measured 2026-10-03); a user-facing counterpart belongs to the deferred user-docs rewrite (issue #1), and when one lands it is held to this requirement, never the reverse. The framework exists because empirical evidence (notably `bootstrap-orbit-status-cli`'s 3-of-3 finding — in-context system review missed all 3 real implementation bugs that external review caught) demonstrates that mode choice materially affects review-finding completeness. As of C1 the framework's recommendations are BACKED BY the engine's `reviewed` gates (per `orbit-engine-gates`): the gate computes convergence and surfaces the canonical next mode, but enforcement is apply-parity — the gate surfaces and records, never hard-blocks. The framework remains advisory in the sense that the user can always proceed past an unpassed gate at the inflection prompt (the override is recorded); it is no longer purely advisory in the sense that the recommendation is now an engine-computed gate state rather than free-form prose.

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

#### Scenario: A user doc stating the framework is held to this requirement

- **WHEN** a user doc (README or `docs/`) states review-mode guidance that drifts from this requirement's normative criteria (e.g., it claims `--fresh` is appropriate for X but the spec scenarios don't reflect that)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; until such a doc exists the framework is spec-only and there is no second statement to drift — orbit's docs and spec stay aligned via the audit-drift discipline rather than ad-hoc reconciliation.

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change is "substantial" by the README's guidance (would benefit from external review per the framework) BUT the user chooses to archive without running external
- **THEN** orbit's archive flow proceeds via the inflection-prompt override (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; choosing proceed records the override in the archive run summary. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the override, not to refuse archive of changes that skip the recommendation.

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
(`orbit-lifecycle-consent`) backstop at the consent-marked seams. The per-body echo MAY take
the EPITOME form (D-arc Stage D5's body economy): for no-chaining, ~2 structural-leaning lines
leaning on the turn-ending structure (position readout + eligibility line); for the
four-discipline block generally, a four-bullet epitome with procedural detail moved to the
step that uses it (detail-to-situ) — the full normative text keeps ONE home (this capability's
discipline requirements), an epitome echo is COMPLIANT, and body-fidelity checks pin the
epitome form, not the pre-D5 full block.

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

#### Scenario: Epitome echo is a compliant echo

- **WHEN** a generated body carries the ~2-line no-chaining epitome and the four-bullet
  disciplines epitome instead of the full blocks
- **THEN** the body satisfies this contract's echo expectation — the full text's single
  normative home is this capability; fidelity and drift checks compare bodies against the
  epitome form, not the pre-D5 full block

### Requirement: Residual outward-actions rule

Outward-facing repository actions not designed into a lifecycle step SHALL remain the
human's — merging any PR, publishing releases, filing issues on external trackers, and any
comparable off-script outward act are invoked outside orbit workflows; orbit commands
recommend, never perform them. Lifecycle-completion outputs that hand control back at an
outward seam (the archive tail's readout, the arc-done readout) SHALL echo this rule in one
line where an outward act is the natural next step (e.g. "merging is yours: `gh pr merge`
when satisfied"). Projects SHOULD carry a one-line CLAUDE.md note stating the rule for
non-orbit sessions working the same repo. This requirement is the residue of the D1-era
outward-actions concern after `orbit-pr-lifecycle` designed the PR path: what remains
off-script stays off-script.

#### Scenario: Completion output echoes at the merge seam

- **WHEN** the archive tail completes with a READY PR
- **THEN** the completion readout names the merge as the human's act in one line, and no
  orbit surface offers to perform it

#### Scenario: Off-script actions stay out

- **WHEN** any orbit workflow completes
- **THEN** no release, external issue-filing, or merge has been performed by the workflow
  regardless of configuration

### Requirement: Decision entry identity and classification

Each entry in `explore.md`'s Decisions section SHALL be a top-level list item whose opener is the ID slot: `- **<YYYY-MM-DD> — <ID>: <title>**` with `<ID> ::= D-[a-z0-9]+-[0-9]+`, unique within the file. This is the opener every exploration on record already writes, formalized rather than replaced; a Decisions entry without a well-formed ID is a format violation the explore body corrects on next touch. An ID is WELL-FORMED when the FIRST line of the entry's list item matches the opener PREFIX `- **<YYYY-MM-DD> — <ID>:` followed by a space or the line end — the closing `**` of the bold title may fall on a later line, and the title itself may begin on the next line, so ordinary line-wrapping of a long title is never a format defect; an entry whose first line carries no such prefix has no well-formed ID.

**The ENTRY is the key: one claim under obligation per entry.** A Decision is a RULE when it PRESCRIBES or CONSTRAINS how something must be done across a SET of situations — the test is "in which situations does this apply?", applied to the claim's NORMATIVE force, never to its grammar. A quantified EMPIRICAL claim ("heading count has never correlated with readiness under any conditions") has a logical domain and is a FACT: it describes one world and is falsifiable by evidence. A SCOPE choice (in / out / deferred) is one-off. The test applies PER CLAIM as an authoring rule: an entry that carries more than one claim under obligation is SPLIT by the author; there are no claim-level identifiers.

Each entry carries slot LINES with FIXED vocabularies, stated as a production so a parser can be written from it (the counter's `Standing recommendation:` precedent: a slot is matched anywhere within the lines that belong to the entry's list item — a lazy-continuation line or a nested bullet both qualify; the ` — ` in the opener is the literal em-dash separator):

```
- **<YYYY-MM-DD> — <ID>: <title>** <prose…>            the opener; the ID slot; <ID> ::= D-[a-z0-9]+-[0-9]+, unique within the file
  Kind: rule | fact | scope                               ^\s*(?:[-*+]\s+)?Kind:\s*(rule|fact|scope)\s*$
  Disposition: live | superseded <ID or pointer> | assigned <stage-id>     same optional bullet prefix as Kind:
  Re-entry: <what would reopen it>                        concluded entries only; exactly one LIVE entry carries it
```

`Disposition:` and `Re-entry:` are matched with the same optional bullet prefix as `Kind:`; the prefix is what admits the nested-bullet form.

- `Kind: rule | fact | scope` — **absent means `rule`.** The demanding default converts an omission into a rule that owes a Mechanism entry (rendered as open by ID once a reader parses it) rather than an invisible escape; opting out is WRITTEN. A rule the author never entered at all remains outside every reader's sight — the stated residual, per `Mechanism entry grammar and accounted closure` (R-crc-10).
- `Disposition: live | superseded <ID or pointer> | assigned <stage-id>` — absent means `live`. The slot means ONE thing for every entry: `live` says the entry's claim STANDS; `superseded` and `assigned` say it does not, and point to what does. Two consequences follow: a RULE is IN the accounting obligation only while its Kind is rule (or absent) AND its Disposition is live (or absent); a CONCLUDED entry's `Re-entry:` slot is the live one only while its Disposition is live (or absent).

#### Scenario: A rule entry owes a Mechanism entry

- **WHEN** a Decisions entry's `Kind:` is `rule` or absent, and its `Disposition:` is `live` or absent
- **THEN** the Mechanism section carries an entry keyed by the same ID (per the Mechanism entry grammar); its absence is an OPEN domain, named by that ID

#### Scenario: A fact with a logical domain is not a rule

- **WHEN** a Decision states a quantified empirical claim and the author writes `Kind: fact`
- **THEN** it owes no Mechanism entry; the situations-test is applied to normative force, so the claim's logical domain does not make it a rule

#### Scenario: A mixed entry is split

- **WHEN** one Decisions entry carries a finding AND a rule clause that governs situations
- **THEN** the author splits it into two entries with distinct IDs; the rule entry owes a Mechanism entry and the finding carries `Kind: fact`

#### Scenario: Leaving the obligation is a named act

- **WHEN** a rule is replaced or handed to another stage
- **THEN** its entry carries `Disposition: superseded <ID or pointer>` or `Disposition: assigned <stage-id>`; an entry left `live` with a bare prose note ("overtaken", "moot") is still in the obligation

#### Scenario: A wrapped title keeps its ID

- **WHEN** an entry opens `- **2026-09-25 — D-foo-7: a long title that` and the closing `**` falls on the next line
- **THEN** its ID is well-formed (`D-foo-7`); an entry whose first line is `- **Decision:** …` has none

### Requirement: Mechanism entry grammar and accounted closure

`explore.md`'s Mechanism section SHALL carry one entry per live rule in this grammar, stated normatively so a parser can be written from it alone:

```
## Mechanism
### <ID> — <rule title>              an entry; ends at the next heading of level 1–3, or EOF
Domain: <the set, in one line>
| member | covered by |              the enumeration, as a table (R-crc-7: decision tables); at least one member row; cells follow GFM — `\|` is a literal pipe, never a separator
Closure: <TOKEN>[ — <justification>]   <TOKEN> ::= DERIVED | SOURCED | BOUNDED, matched from line start to the first ` — ` or end of line
Residual kind: <what lies outside>            required iff BOUNDED, forbidden otherwise
Residual method: <how a member would be found> required iff BOUNDED, forbidden otherwise
Moves:
- <MOVE>: applied — <what it found>   |   - <MOVE>: not applied — <reason>     (` — ` is the literal em-dash)
                                      nine lines, one per move, each move exactly once
### Case <n> — <title>               evidence, free-form, cited by move lines by name
```

An H3 under Mechanism whose heading begins `D-` is an ENTRY; one beginning `Case` is a CASE; any other H3 is prose and is neither. Fenced content is never structure.

**Closure is ACCOUNTED, not CLOSED.** The obligation is that no domain be open SILENTLY, and two outcomes discharge it:

| outcome | tokens | what it claims |
|---|---|---|
| **CLOSED** | DERIVED (generated by a structure whose parts are known, every part covered) · SOURCED (exhaustive over a set an authority defines — a type, a code branch set, a grep over a named file) | every member is covered, and the justification says why that is provable |
| **OPEN-DECLARED** | BOUNDED | the named members are covered, a residual REMAINS, and its shape is stated |

A BOUNDED residual SHALL name its KIND (what lies outside the named set) and its METHOD (how a member would be found), in the two slots. "There may be others" discharges nothing: it is the sentence the obligation exists to forbid, wearing the obligation's vocabulary. *"I can name no more"* is NOT a form — it is the state every failed enumeration on this program's record was in, and from the inside it is indistinguishable from closure. Classifying a record FALSIFIES an enumeration and never closes one.

**The tier difference is VISIBILITY, never BLOCKING.** An OPEN-DECLARED domain does not block readiness; its residual is SURFACED and TRAVELS rather than dying in the exploration. The two slots are the ORIGIN every downstream reader reads. Where it travels is an AUTHORING rule this format states — into the requirement's own text as a named limit (the OWNER, because only spec text survives archive) and into `design.md`'s Risks as a pointer; a residual carried in design alone is lost at archive — and the MECHANISMS that move it are OWNED elsewhere: `orbit-run-summary-emit`'s `Named-mode explore recommendation by maturity` surfaces it beside its rung, and `orbit-propose-modifications`' `Mechanism section consumption` carries it into spec text at promotion.

**A grammar failure is MALFORMED, naming the line** — a malformed ID; a second Mechanism entry with an ID already used (naming the second heading); an ORPHAN Mechanism entry whose ID matches no Decisions entry (naming the heading — a key with no owner); a `Domain:` table with other than the two `member | covered by` columns, no separator row, or NO member rows — an enumeration of nothing is not an enumeration — (naming the table's first line); a missing or duplicated move line; an unknown `Closure:` token; a residual slot on a non-BOUNDED entry; a BOUNDED entry missing a slot. NOT malformed: a Mechanism entry for a Decisions entry whose `Kind:` is fact or scope or whose `Disposition:` is superseded or assigned — history is permitted and sits outside the obligation. Nothing reads as legacy silently (the architecture parser's near-miss rule).

The engine judges FORM only: whether a live rule has an entry, whether it declares a token, whether the slots the token requires are present. Whether an enumeration is TRUE, whether a residual is honest, and whether a rule was written down at all are a reader's judgement — the deliverable is a RECORD, not a check (R-crc-10).

#### Scenario: An entry declares a closed outcome

- **WHEN** a Mechanism entry carries `Closure: DERIVED` or `Closure: SOURCED` and no residual slots
- **THEN** the rule's domain is ACCOUNTED as CLOSED; a residual slot on such an entry is MALFORMED naming the line

#### Scenario: An entry declares an open domain honestly

- **WHEN** a Mechanism entry carries `Closure: BOUNDED` with both `Residual kind:` and `Residual method:` present and non-empty
- **THEN** the rule's domain is ACCOUNTED as OPEN-DECLARED in its two slots — the origin every downstream reader reads (the maturity rung surfaces it, per `orbit-run-summary-emit`'s `Named-mode explore recommendation by maturity`; propose carries it into spec text, per `orbit-propose-modifications`' `Mechanism section consumption`) — never withheld on, never blocking

#### Scenario: A blank cheque is not accounted

- **WHEN** a Mechanism entry carries `Closure: BOUNDED` and either residual slot is absent or empty
- **THEN** the domain is OPEN, MALFORMED naming the line; "there may be others" in prose does not substitute for the slots

#### Scenario: Entry boundaries and non-entries

- **WHEN** the Mechanism section holds an H3 `### D-x-1 — …`, a `### Case 2 — …`, an H3 `### The reframing`, and a fenced block containing `### D-x-9`
- **THEN** exactly one entry (`D-x-1`) and one case are recognised; the prose H3 and the fenced lookalike are neither; `D-x-1`'s entry ends at the next H1–H3 heading

#### Scenario: Move lines are exhaustive and unique

- **WHEN** an entry's `Moves:` block omits a move or lists one twice
- **THEN** the entry is MALFORMED naming the line; a disposition of `not applied — <reason>` satisfies any move except that the `Domain:` table and `Closure:` token can never be dispositioned away

### Requirement: Concluded exploration outcome

An exploration MAY conclude in nothing, and the record SHALL say so in TWO engine-observable tokens, both written by the explore body on the USER'S declared word — recommend, never infer (the arc's rules of engagement); conclude is NOT a consent-marked seam: no gate, no prompt, no `consent` field on the explore emit, and no new command:

1. ONE Decisions entry — what was decided, WHY nothing is built — carrying `Kind: scope` and a `Re-entry: <what would reopen it>` slot (the owner of the trigger; exactly one LIVE entry — `Disposition:` live or absent — carries the slot).
2. The status header flips to the fixed token `> **Status**: concluded <YYYY-MM-DD>.` (the pointer).

Nothing is written to `.openspec.yaml`: the change-metadata helpers' schema STRIPS unknown keys at every level (measured, 2026-09-25), so a metadata token could not survive the body's own write path. The `architecture:` citation is KEPT unchanged — it is what locates the directory whose header a stage-state reader will read.

Both land BEFORE the final boundary emit, so the emit's engine-computed recommendation is composed from the concluded file. The staging directory STAYS IN PLACE: a conclusion carries a standing re-entry trigger, which is the program layer's Considered & out shape, and the orientation surface renders a workstream's next line from the trail in ITS directory — moving it would leave the conclusion with no surface to render on.

**Owned, since shipped**: the stage-state reader reads the header token from the staging directory the kept citation locates and observes a stage cited only by a concluded exploration as `concluded` (`orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`); the orientation row's next line renders the concluded rung from the trail's terminal emit (`orbit-orientation`'s `Next-recommendation sourcing is time-shifted, never live`); and `/orbit:propose <name>` refuses a concluded exploration, naming its `Re-entry:` slot (`orbit-propose-modifications`' `Consume mode when staging directory exists`). None of the three is a limit of concluding; each is named here so a reader of the conclude flow knows who owns the behaviour the conclusion depends on.

#### Scenario: The user concludes an exploration

- **WHEN** the user declares in a named explore session that nothing will be built
- **THEN** the body sweeps, writes the CONCLUDED entry with its `Re-entry:` slot, flips the header token, and THEN fires the boundary emit; the directory is not moved and no metadata is written

#### Scenario: A conclusion is user-declared, never inferred

- **WHEN** the AI judges that an exploration should stop and the user has not said so
- **THEN** the AI recommends concluding and writes nothing; the record exists only on the user's word

#### Scenario: Reopening is the inverse edit, recorded

- **WHEN** a concluded exploration is reopened on the user's word
- **THEN** the header returns to `exploring`; a dated Decisions entry records why (the trigger fired, or a new reason); the prior CONCLUDED entry gains `Disposition: superseded <the reopening entry's ID>`, so its `Re-entry:` slot is no longer the live one; then a boundary emit

#### Scenario: A reopened exploration concludes again

- **WHEN** an exploration that was concluded and reopened is concluded a second time
- **THEN** a NEW CONCLUDED entry carries the live `Re-entry:` slot; the earlier one stays as superseded history; the header token flips again; exactly one live entry carries the slot at every point in the cycle

