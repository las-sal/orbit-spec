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

The system SHALL use a fixed five-section format for `explore.md`. Open-question entries SHALL carry a `Standing recommendation:` slot — `Standing recommendation: <the current leaning>` or `Standing recommendation: none yet` — so a pending leaning discussed in conversation has a named, file-resident home (D-arc Stage D5, leak-hardening layer 1: AIs fill template slots far more reliably than they obey prose rules; the slot's RECORDED LEANING is what the emit surface's attestation counts — a `none yet` value attests an honestly empty slot, not a leaning, per `orbit-emit-composition`'s membership criterion).

#### Scenario: Section order

- **WHEN** an `explore.md` file is created
- **THEN** the sections appear in this order: Premise, Decisions, Open questions, Considered & out, References

#### Scenario: Status header

- **WHEN** an `explore.md` file is created
- **THEN** it includes a `> **Status**: exploring...` header indicating the file is a pre-propose record

#### Scenario: Open questions carry the standing-recommendation slot

- **WHEN** an open question is captured in `explore.md`
- **THEN** its entry includes a `Standing recommendation:` line — the current leaning, or the literal `none yet`; an entry lacking the slot is a format violation the explore body corrects on next touch

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
- **THEN** `/orbit:review --reviewer external` is the appropriate mode. The cross-AI round-trip cost is justified by the independence — a different model + different session has no anchoring to the code the original AI wrote. The `review-system` cadence's external slot encodes this default (per `orbit-engine-gates`), and the engine-rendered report tail surfaces the resulting canonical next command (per `orbit-report-rendering` — D-arc Stage D4). In C1+ this recommendation is realized as the `review-system` gate (per `orbit-engine-gates`), whose `external` cadence slot must be covered for convergence; the gate surfaces the canonical next command but NEVER hard-blocks — the user may proceed past it at the archive inflection prompt, and the override is recorded. The recommendation is gate-surfaced, not gate-enforced.

#### Scenario: Framework is documented in README + spec; drift between the two is caught

- **WHEN** the README's "Choosing a review mode" section drifts from this requirement's normative criteria (e.g., README claims `--fresh` is appropriate for X but the spec scenarios don't reflect that)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; orbit's docs and spec stay aligned via the audit-drift discipline rather than ad-hoc reconciliation.

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change is "substantial" by the README's guidance (would benefit from external review per the framework) BUT the user chooses to archive without running external
- **THEN** orbit's archive flow proceeds via the inflection-prompt override (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; choosing proceed records `gate_overridden` in the archive run summary. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the override, not to refuse archive of changes that skip the recommendation.

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
