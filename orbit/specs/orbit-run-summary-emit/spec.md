# orbit-run-summary-emit Specification

## Purpose

Defines the emit-layer that writes per-command `.orbit-runs/<command>-<TS>.json` run-summary JSONs for orbit workflow commands (`explore`, `propose`, `new`, `continue`, `ff`, `apply`, `verify`, `architect`) plus the external-handoff branch of `/orbit:review --reviewer external` at T0 (the frozen `review-external` record vocabulary) — alongside the existing editorial and lifecycle emit-producing commands. Specifies emit scope (which commands emit, which don't), the workflow-kind JSON shape (extends the universal spine from `orbit-conventions`), emit timing semantics (one-shot vs. multi-turn-phase-boundary vs. conversation-boundary), the wrapper architecture (upstream skill bodies are NOT modified), per-command recommendation logic (propose-shaped vs. artifact-completion-aware; explore maturity grid; apply per-chunk-end with chunk preamble parsing; verify pass/fail mode classification; review-external T0 multi-step prose; audit-drift standalone change-scoped vs. project-wide), and the no-forward-look discipline that keeps emit text scoped to today's behavior.
## Requirements
### Requirement: Emit scope

The following orbit commands SHALL emit `orbit/changes/<name>/.orbit-runs/<command>-<TS>.json` (or `orbit/explore/<name>/.orbit-runs/<command>-<TS>.json` for explore, or `orbit/architecture/.orbit-runs/<command>-<TS>.json` for architecture-scoped commands) when invoked — COMPOSED AND WRITTEN VIA THE ENGINE EMIT SURFACE (`orbit emit <command>` per `orbit-emit-composition`, D-arc Stage D5): generated bodies instruct the surface with a narrative-only payload and never hand-compose the JSON (hand-composition is the retired practice; pre-capability emits on the trail are historical records, readers tolerate both generations). This requirement covers two categories:

- **New emit behavior** (commands that don't emit any run-summary JSON today):
  - Workflow commands: `/orbit:explore` (named mode only — bare mode does NOT emit; named mode emits at BEGIN as well as at boundaries, per `Emit timing semantics` — D-arc Stage D3), `/orbit:propose`, `/orbit:new`, `/orbit:continue`, `/orbit:ff`, `/orbit:apply`, `/orbit:verify`, `/orbit:architect` (D-arc Stage D2; emits to the architecture trail with `change: null` + a `doc` field, shape owned by `orbit-architect`)
  - The external-review packaging branch at T0 (when the prompt is packaged, before findings return — the `command: "review-external"` emit, invoked via `/orbit:review --reviewer external` per D-arc Stage D5's merge; record vocabulary frozen)
- **Refined existing emit** (already emits today; this change refines the recommendation logic and aligns with the universal spine from orbit-conventions):
  - Standalone `/orbit:audit-drift` (schema documented in the `orbit-audit-drift` skill's `references/run-summary-schema.md`, shipped alongside the generated skill)

The following commands SHALL NOT emit additional JSONs as part of this change:

- `/orbit:bulk-archive` — wrapper; each inner `/orbit:archive` invocation emits separately
- `/orbit:onboard` — meta walkthrough; no change-state transition
- `/orbit:sync` (the `orbit-sync-specs` skill) — upstream primitive, unmodified by orbit; no emit behavior is added to it

Existing emit-producing commands (`/orbit:review`, `/orbit:address-reviews`, `/orbit:archive`, inline `/orbit:audit-drift` during archive) continue emitting as today — through the emit surface; `/orbit:review`'s architecture mode persists to the architecture trail per `orbit-review`'s per-mode persistence requirement — a location change for that mode, not a new emitter.

#### Scenario: Named-mode /orbit:explore writes explore JSON
- **WHEN** the user invokes `/orbit:explore foo` (named mode) and the session ends
- **THEN** the emit-layer writes `orbit/explore/foo/.orbit-runs/explore-<TS>.json` via `orbit emit explore`

#### Scenario: Named-mode explore BEGIN emit at scaffold (D-arc Stage D3)
- **WHEN** `/orbit:explore foo` creates the staging directory in Mode B (new named exploration)
- **THEN** the emit-layer writes a begin `explore-<TS>.json` immediately — `decisions_captured: 0`, `next_recommended: "/orbit:explore foo — continue capturing thinking"` (the maturity requirement's Early canonical string), the `final_assessment` recording the scaffold and the citation decision (cited or declined) — so the trail records the workstream's start (and any `premised → exploring` stage transition) and the orientation surface can anchor from minute zero

#### Scenario: Mode C crystallization BEGIN emit carries the back-filled state (D-arc Stage D3)
- **WHEN** a bare-mode exploration crystallizes to `foo` (Mode C: the user confirmed the crystallization warning; 2+ substantive decisions are back-filled into `explore.md` at creation)
- **THEN** the begin emit carries the BACK-FILLED counts (`decisions_captured` = the decisions written at creation, `open_questions_count` likewise) and a maturity-consistent `next_recommended` per the `Named-mode explore recommendation by maturity` requirement — the trail's first record states true on-disk state, never a knowingly-false zero; this begin emit IS the crystallization's first emit (see the modified crystallization requirement below); the counts are ENGINE-COMPUTED from the back-filled file by the emit surface

#### Scenario: /orbit:architect writes to the architecture trail
- **WHEN** an `/orbit:architect my-program` session reaches a conversation boundary
- **THEN** the emit-layer writes `orbit/architecture/.orbit-runs/architect-<TS>.json` with `change: null` and `doc: "my-program"`

#### Scenario: Bare-mode /orbit:explore writes no JSON
- **WHEN** the user invokes `/orbit:explore` without a name argument
- **THEN** no `.orbit-runs/` JSON is written for that conversation

#### Scenario: /orbit:onboard does not emit
- **WHEN** the user invokes `/orbit:onboard` and completes the walkthrough
- **THEN** no `.orbit-runs/onboard-<TS>.json` is written anywhere in the project

#### Scenario: /orbit:bulk-archive relies on inner /orbit:archive emits
- **WHEN** the user invokes `/orbit:bulk-archive` to archive 3 changes
- **THEN** 3 `archive-<TS>.json` files are written (one per inner archive), and no `bulk-archive-<TS>.json` file is written

#### Scenario: Bodies instruct the surface, never hand-compose
- **WHEN** any generated body reaches its emit step
- **THEN** the body's instruction is to compose the narrative payload and invoke `orbit emit <command>` — no generated body contains JSON-shape prose for the spine, timestamp/collision rules, or deterministic-fact composition (those are engine-owned per `orbit-emit-composition`)

### Requirement: Workflow-kind emit shape (extends the universal spine)

Every workflow-command run-summary JSON (per `Requirement: Emit scope`) SHALL include the universal spine defined in the `orbit-conventions` capability's `Internal-run JSON summary format` requirement — 7 required top-level fields (D-arc Stage D5 adds `model`):

```
command          string       identifies which command emitted (matches filename prefix)
timestamp        string       ISO-8601 UTC; JSON field uses standard colon format `YYYY-MM-DDTHH:MM:SSZ`. Filename embeds a colon-replaced `<TS>` token `YYYY-MM-DDTHH-MM-SSZ` (colons aren't filesystem-safe across all platforms).
change           string|null  the change name (or null for project-scope and architecture-scoped commands)
final_assessment string       narrative of what just happened (human-readable)
next_recommended string       verbatim recommendation, suitable for best-effort parse by downstream status readers
kind             enum         "workflow" | "editorial" | "lifecycle"  (always "workflow" for commands in this capability's scope)
model            string|null  the emitting AI's model identity (provenance — D-arc Stage D5); null when unknown. REQUIRED in every post-capability payload (explicit null allowed); pre-capability emits lack the field and readers SHALL tolerate absence (both generations valid on the trail), per `orbit-conventions`.
```

For workflow-kind emits specifically, `kind` SHALL equal `"workflow"`. Per-command extensions (defined in subsequent requirements in this capability) add command-specific state beyond the spine.

Filenames SHALL use the per-command prefix (preserving entry-point provenance): `<command>-<TS>.json`. Propose-family variants (`new`, `continue`, `ff`) each use their own command-name prefix, NOT `propose-<TS>.json`. ("Propose-family" here is the entry-point grouping for the per-variant-filename rule; "propose-shaped" is the recommendation-class term defined in `Requirement: Propose-shaped and artifact-completion-aware recommendation logic` and applies only to `/orbit:propose` + `/orbit:ff`.)

#### Scenario: explore emit includes all 7 spine fields
- **WHEN** the emit-layer writes `explore-<TS>.json` for a named-mode explore
- **THEN** the JSON contains `command`, `timestamp`, `change`, `final_assessment`, `next_recommended`, `kind`, and `model` fields with valid values (`model` nullable; absent only on pre-capability emits, which readers tolerate)

#### Scenario: apply emits with kind=workflow
- **WHEN** the emit-layer writes `apply-<TS>.json`
- **THEN** the `kind` field equals `"workflow"`

#### Scenario: /orbit:new uses its own filename prefix
- **WHEN** the user invokes `/orbit:new foo` and the emit-layer writes a JSON
- **THEN** the filename is `new-<TS>.json`, NOT `propose-<TS>.json`

#### Scenario: Downstream status reader parses next_recommended verbatim
- **WHEN** a downstream status reader reads any run-summary JSON and best-effort parses `next_recommended`
- **THEN** the leading `/orbit:<verb> [args]` token (if present) is extracted into `command` and `args`; on parse failure (e.g., prose recommendation), the full string is preserved in `reason`

### Requirement: Emit timing semantics

The emit-layer SHALL fire at well-defined moments per command type. Three categories cover the full command surface:

**One-shot commands** — emit ONCE on natural command completion (when the AI completes the command's intended work and is about to return control to the user):
- `/orbit:propose`, `/orbit:new`, `/orbit:ff`, `/orbit:continue`
- `/orbit:verify`
- `/orbit:audit-drift` standalone (excluding the inline-during-archive case captured in `archive-<TS>.json`)
- The external-review packaging branch at T0 (`/orbit:review --reviewer external`, D-arc Stage D5's merge — when the prompt is packaged, before findings return; record vocabulary frozen per `orbit-review-external`)

**Multi-turn commands with explicit phases** — emit at phase boundaries per the command-specific requirement:
- `/orbit:apply` — emits per `Requirement: Apply per-chunk-end emission` (chunk completion is the primary trigger; mid-chunk pause is the secondary trigger per the conversation-boundary rules below)

**Multi-turn conversational commands** — emit at conversation boundaries:
- `/orbit:explore` (named mode) — a BEGIN emit at staging-dir creation (D-arc Stage D3; the begin+boundary genre, like apply's chunk+pause; content is MODE-AWARE — Mode B records zero counts, Mode C records the back-filled counts, per the Emit-scope scenarios) AND boundary emits per `Requirement: Named-mode explore recommendation by maturity` with the timing defined here; on a filename collision (a boundary emit within the same ISO second as the begin emit — the `<TS>` token is second-granular), the emit-layer bumps the later emit's token forward by one second until the path is free, preserving lexical begin-before-boundary ordering (the review-external T0 precedent); resuming a pre-D3 staging directory that has no emits does NOT retro-fire a begin emit (add-only, no backdating — the next boundary emit covers it)
- `/orbit:architect` (D-arc Stage D2) — emits to the architecture trail with the conversation-boundary timing defined here; the emit's shape and extensions are owned by `orbit-architect`

A **conversation boundary** for multi-turn conversational commands is defined as EITHER of (both rules are operational signals the emit-layer can detect at JSON-write time without requiring future-message inspection):

1. **User explicitly signals stop or pause** — "stop", "pause", "that's it for now", "we'll come back to this later", or equivalent intent
2. **AI-initiated wrap** — AI says "I've captured everything; type `/orbit:propose <name>` when ready" or equivalent intent (an explicit suggestion of the next workflow step, signalling the conversation is at a natural pause point)

**Canonical orbit UX convention**: to make most natural handoffs become explicit boundaries, when the AI hands control back to the user after a multi-turn conversational command session (such as `/orbit:explore` named-mode), the AI SHOULD include an explicit wrap phrase suggesting the next step (e.g., "type `/orbit:propose <name>` when ready" or "type `/orbit:explore <name>` to continue capturing"). This turns the handoff itself into a rule-2 signal and triggers the emit naturally without requiring the AI to predict future user behavior.

**Known limitation** (accepted tradeoff): if the user closes the conversation without either an explicit stop signal or an AI-initiated wrap (e.g., user simply walks away mid-session), no BOUNDARY emit fires for that session (a FIRST session's begin emit still recorded the workstream's start — D-arc Stage D3; only the session's closing state goes uncaptured). The change's state persists in on-disk artifacts (e.g., `explore.md`), but the `.orbit-runs/` JSON timeline misses the implicit boundary. Capturing the implicit case would require future-message inspection unavailable to the emit-layer at JSON-write time; explicit-signal-only is the operationally simpler tradeoff.

For `/orbit:apply` mid-chunk pause specifically, the same conversation-boundary rules apply — in addition to the explicit chunk-completion trigger.

**What is NOT a session boundary**: AI returning control mid-thought to ask a clarifying question; user asking a tangential question and returning to the same workflow; AI mid-turn pauses to read files or run commands; AI tool-use sequences within a single response. These are continuations, not boundaries — no emit fires.

#### Scenario: One-shot command emits exactly once
- **WHEN** `/orbit:propose foo` runs and completes generating all artifacts
- **THEN** exactly one `propose-<TS>.json` is written at completion; no additional emits

#### Scenario: Apply chunk completion is an explicit phase boundary
- **WHEN** `/orbit:apply foo` checks the last task in chunk N
- **THEN** the emit fires per `Requirement: Apply per-chunk-end emission` with `chunk_complete: true`

#### Scenario: Apply mid-chunk pause on explicit user signal
- **WHEN** during `/orbit:apply foo` the user says "stopping here for now"
- **THEN** the emit-layer treats this as a conversation boundary and emits `apply-<TS>.json` with `chunk_complete: false` per the per-chunk-end requirement's rule 2

#### Scenario: Named-mode explore emits when AI includes wrap phrase on handoff
- **WHEN** `/orbit:explore foo` has captured N decisions; AI returns control to user with an explicit wrap phrase such as `"type /orbit:propose foo when ready"`
- **THEN** the emit-layer treats this as a rule-2 (AI-initiated wrap) boundary and emits `explore-<TS>.json` with current decision and question counts and recommendation per maturity rules

#### Scenario: Continuation within a conversation is NOT a boundary
- **WHEN** during `/orbit:explore foo` the user asks a tangential question, the AI answers, and the user returns to the exploration topic in the same conversation
- **THEN** the emit-layer does NOT emit during the tangent or upon return; emit only fires when an actual conversation boundary (rule 1 explicit signal, or rule 2 AI-wrap) is reached

#### Scenario: User abandons conversation without explicit signal (known limitation)
- **WHEN** `/orbit:explore foo` has captured N decisions; AI returns control to user without an explicit wrap phrase; the user does not respond and the conversation effectively ends
- **THEN** no boundary emit fires for that session (if this was the scaffolding session, the begin emit already recorded the start). The `orbit/explore/foo/explore.md` artifact retains captured state. The next `/orbit:explore foo` invocation picks up from disk and will emit at its own boundary; the prior session's implicit boundary is not captured in the `.orbit-runs/` timeline

#### Scenario: AI-initiated wrap fires emit
- **WHEN** during `/orbit:explore foo` the AI says "I've captured everything; type `/orbit:propose foo` when ready"
- **THEN** the emit-layer treats this as a conversation boundary and emits `explore-<TS>.json` with current state

### Requirement: Emit-layer wraps upstream skills without modifying them

The emit-layer SHALL be implemented as a wrapper that runs after a command completes, inspects the command's output (artifact state, return codes, tasks state), and writes the JSON. Upstream skill bodies (the `# <skill-name>` markdown for upstream-authored skills like `orbit-verify-change`, `orbit-apply-change`, etc.) MUST NOT gain new behavior as part of this change.

Specifically:

- `/orbit:verify` SHALL NOT gain marker-dropping, spec-edit shortcuts, or other behaviors that change what verify itself does. The recommendation-classification logic for verify-fail modes (per `Requirement: Verify fail-mode recommendations`) lives in the emit-layer, not in verify.
- `/orbit:apply` SHALL NOT gain task-ordering changes, parallel-task execution, or other behaviors that change what apply itself does. The chunk-end emit logic (per `Requirement: Apply per-chunk-end emission`) lives in the emit-layer, not in apply.
- Where orbit modifies an upstream skill via the `# Orbit additions` pattern (the orbit-modified workflows per `orbit-conventions`'s `Generated-file disposition` requirement), the emit-layer instructions MAY be added to those `# Orbit additions` sections; they MUST NOT modify the upstream-authored body above the additions marker.

#### Scenario: /orbit:verify upstream behavior unchanged
- **WHEN** a deliberate engine upgrade cherry-picks a newer upstream `verify-change` body into orbit's bundled template
- **THEN** the upstream-authored portion of the template is replaced wholesale while the `# Orbit additions` section (including any emit-layer instructions) carries over unchanged; the emit-layer never silently overrides upstream verify behavior

#### Scenario: emit-layer does not modify task-checking
- **WHEN** `/orbit:apply` runs and checks off tasks per upstream behavior
- **THEN** the task-checking algorithm is identical to upstream; only the side-effect of writing `apply-<TS>.json` is new

### Requirement: Bare-mode explore non-emission and crystallization warning

When `/orbit:explore` is invoked without a name argument (bare mode), the emit-layer SHALL NOT write a `.orbit-runs/` JSON. Exploration without a name is pre-commitment thinking; no persistent emit occurs until the user crystallizes the exploration to a named change.

When the user requests crystallization during a bare-mode explore (e.g., "give this exploration a name and save it"), the AI SHALL surface an explicit warning describing the persistence consequences before creating `orbit/explore/<name>/explore.md` and emitting the first `explore-<TS>.json`. The warning MUST mention:

1. A new directory `orbit/explore/<name>/` will be created with `explore.md` capturing decisions to date
2. A `.orbit-runs/explore-<TS>.json` will start the change's audit trail
3. The change will become visible to any consumer that scans `orbit/explore/` (e.g., a downstream status reader). Note: upstream `orbit list` does NOT scan `orbit/explore/`; the change appears in `orbit list` only after `/orbit:propose` moves the staging directory to `orbit/changes/<name>/`.
4. Abandonment after this point requires formal archive/discard, not just deleting the directory, once it's been moved to `orbit/changes/<name>/` by `/orbit:propose`

The AI MUST wait for explicit user confirmation before proceeding.

#### Scenario: Bare-mode explore produces no .orbit-runs JSON
- **WHEN** the user invokes `/orbit:explore` (no name) and converses for 30 minutes without crystallizing
- **THEN** no `.orbit-runs/` JSON is written; the conversation produces no on-disk persistence

#### Scenario: Crystallization request triggers warning
- **WHEN** during a bare-mode explore the user says "save this as `<name>`"
- **THEN** the AI surfaces a warning enumerating the 4 consequences above and waits for user confirmation before creating any file

#### Scenario: Confirmed crystallization writes first emit
- **WHEN** the user confirms the crystallization warning
- **THEN** the AI creates `orbit/explore/<name>/explore.md` and writes the first `explore-<TS>.json` capturing decisions to date — this first emit IS the Mode C BEGIN emit (D-arc Stage D3): it carries the back-filled `decisions_captured`/`open_questions_count` and a maturity-consistent recommendation, per the `Emit scope` begin-emit scenarios

### Requirement: Named-mode explore recommendation by maturity

Named-mode `/orbit:explore` emits SHALL include `next_recommended` text that adapts to the count of decisions captured and the count of open questions remaining. Four mutually-exclusive maturity states cover the full grid:

- **Early (0–1 decisions captured)**: `"/orbit:explore <name> — continue capturing thinking"`
- **Mid (2–3 decisions captured)**: `"/orbit:explore <name> — continue thinking, or /orbit:propose <name> if ready to formalize"`
- **Mature (4+ decisions captured AND ≤1 open question)**: `"/orbit:propose <name> — substantial thinking captured; ready to formalize the design (or /orbit:explore <name> to keep refining)"`
- **Stalled (4+ decisions captured AND >1 open question)**: `"/orbit:explore <name> — N decisions captured but M open questions remain; resolve open questions before formalizing"` (N = `decisions_captured`, M = `open_questions_count`). NOTE: this state does NOT surface `/orbit:propose` as an alternative because high open-question count signals NOT-ready regardless of decision count; the user is directed back to exploration to close out the open questions first.

In each case the leading `/orbit:<verb> <name>` token is the canonical recommendation that a downstream status reader parses into `command`/`args`; the alternative path (when present, Mid and Mature only) lives in the reason text.

#### Scenario: 1-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 1` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains "continue capturing thinking"

#### Scenario: 5-decision explore with 0 open questions recommends propose
- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 0`
- **THEN** `next_recommended` begins with `"/orbit:propose <name>"` and surfaces `/orbit:explore` as alternative in reason

#### Scenario: 0-decision explore recommends continued exploration
- **WHEN** named-mode explore emits with `decisions_captured: 0`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` and contains language acknowledging that thinking is just beginning (e.g., "continue capturing thinking — no decisions captured yet")

#### Scenario: Stalled — 5 decisions captured but 3 open questions remain (Mature criteria for decisions met but open-question check fails)
- **WHEN** named-mode explore emits with `decisions_captured: 5` and `open_questions_count: 3`
- **THEN** `next_recommended` begins with `"/orbit:explore <name>"` (NOT `/orbit:propose`); the text references both counts (e.g., "5 decisions captured but 3 open questions remain; resolve open questions before formalizing"); `/orbit:propose` is NOT surfaced as an alternative

### Requirement: Propose-shaped and artifact-completion-aware recommendation logic

The four propose-family commands SHALL emit their `next_recommended` per one of two recommendation classes based on what they actually produce:

**Propose-shaped** commands (`/orbit:propose`, `/orbit:ff`) produce the canonical artifact set (proposal.md + design.md + tasks.md + at least one specs/<capability>/spec.md) in a single invocation. They SHALL emit:

```
next_recommended: "/orbit:review <name> — proposal artifacts ready; review before apply"
```

(Propose should recommend review, not apply — review precedes apply in orbit's canonical flow.)

**Artifact-completion-aware** commands (`/orbit:new`, `/orbit:continue`) produce partial artifact state — `/orbit:new` scaffolds the change directory without generating artifacts; `/orbit:continue` generates the next missing artifact. Both SHALL emit a recommendation that depends on upstream `orbit status --change <name> --json`'s `isComplete` field (the same field upstream `orbit-continue-change` uses to gate completion). This keeps the emit-layer schema-agnostic — whatever upstream's authoritative completeness definition is, the emit recommendation follows it:

- **`isComplete: true`** (all required artifacts present): `next_recommended: "/orbit:review <name> — all proposal artifacts now present"`
- **`isComplete: false`** (more artifacts pending): `next_recommended: "/orbit:continue <name> — <next missing artifact> still pending"` (where `<next missing artifact>` is the first entry in upstream's `artifacts` array with `status: "ready"` — the array is sorted by build order; `applyRequires` is the terminal pre-apply requirement set, not the next-artifact queue)

For `/orbit:new` specifically, `isComplete: false` is the typical case immediately after scaffolding (upstream `/orbit:new` doesn't auto-generate artifacts; the user is expected to run `/orbit:continue` next). For `/orbit:continue`, `isComplete: true` is the typical terminal state.

#### Scenario: /orbit:propose recommends /orbit:review (propose-shaped)
- **WHEN** `/orbit:propose foo` completes after generating proposal/design/tasks/specs
- **THEN** the `propose-<TS>.json`'s `next_recommended` begins with `"/orbit:review foo"`

#### Scenario: /orbit:new (scaffold-only) recommends /orbit:continue
- **WHEN** `/orbit:new foo` completes after upstream scaffolds the change directory (no artifacts generated); `orbit status --change foo --json` reports `isComplete: false`
- **THEN** the `new-<TS>.json`'s `next_recommended` begins with `"/orbit:continue foo"` (artifact-completion-aware class, NOT propose-shaped — even though `/orbit:new` is in the propose family, it doesn't produce the canonical artifact set in one go)

#### Scenario: /orbit:continue with missing tasks.md recommends /orbit:continue
- **WHEN** `/orbit:continue foo` completes after generating design.md but tasks.md is still missing; `orbit status --change foo --json` reports `isComplete: false` with `tasks` as the first `status: "ready"` artifact
- **THEN** the `continue-<TS>.json`'s `next_recommended` begins with `"/orbit:continue foo"` and identifies `tasks.md` as the next missing artifact

#### Scenario: /orbit:continue with all artifacts present recommends /orbit:review
- **WHEN** `/orbit:continue foo` completes after the final missing artifact is generated; `orbit status --change foo --json` reports `isComplete: true`
- **THEN** the `continue-<TS>.json`'s `next_recommended` begins with `"/orbit:review foo"`

#### Scenario: Schema-agnostic — alternative schemas with different completeness criteria work via isComplete
- **WHEN** a hypothetical future change uses a non-spec-driven schema where completeness requires only proposal.md + tasks.md (no design.md, no specs/); upstream reports `isComplete: true` after both are generated
- **THEN** the emit-layer recommends `/orbit:review foo` based on `isComplete: true` alone, regardless of whether design.md or specs/ are present — the emit-layer does NOT hand-roll the completeness check

### Requirement: Apply per-chunk-end emission

`/orbit:apply` SHALL emit `apply-<TS>.json` at chunk boundaries when chunks are explicitly declared in the change's tasks.md preamble — via `orbit emit apply`, whose ENGINE parses the preamble and computes the chunk/checkbox fields (D-arc Stage D5; the grammar below is engine data, no longer body prose). The chunk preamble SHALL use this format: an HTML comment block at the top of tasks.md (before the first `## <group-name>` header) containing lines of the form `Chunk N (groups X[-Y]): <chunk-name>`. Example:

```
<!--
Implementation chunks:
  Chunk 1 (groups 1):    Foundation
  Chunk 2 (groups 2-3):  Workflow emits
  Chunk 3 (groups 4):    Apply behavior
-->
```

**Format constraints**:
- The `(groups X[-Y])` portion supports a single group (`X`) or a contiguous range (`X-Y`). Non-contiguous group sets (e.g., `(groups 6,8,9)`) are NOT supported in v1 — restructure tasks.md groups to be contiguous, or split into multiple chunks.
- **Cross-declaration coverage rules**: across the declaration set, chunk numbers SHALL be in ascending order and group ranges SHALL be non-overlapping with no gap (a declared-range group covered by no chunk); and the declared span's ENDS SHALL match the numbered groups actually present in tasks.md (declared start == the lowest numbered group, declared end == the highest — an omitted leading or trailing group is the same uncovered-work hazard as an internal gap, from outside the span); and NO unnumbered group may carry checkboxes when a preamble exists (its tasks count in the arithmetic but no chunk can ever cover them — undeclarable work is incompatible with chunking). Overlap, gap, out-of-order chunk numbers, and omitted leading/trailing groups are all malformed-preamble cases handled per the next bullet — a tolerated omission would let rule 1 recommend verify at final-chunk completion while uncovered tasks remain unchecked, the wrong-but-plausible record class this capability exists to prevent.
- **Malformed preamble handling** (graceful degradation): if the preamble comment block exists but cannot be parsed (missing parens, typo in `Chunk N`, malformed group range, overlapping/gapped/out-of-order declarations, etc.), the emit-layer SHALL log a single warning to stderr (`"warning: tasks.md preamble at <path> could not be parsed as chunk declarations; falling back to no-chunking mode"`) and proceed under no-chunking-apply rules (single emit at session end with `chunk: null`). The implementation is "tolerant on read, strict on write" — don't block the user's work; surface the parse issue so they can fix the preamble.

The emit follows these rules:

1. **Chunk completion**: when the last task in chunk N is checked, emit with `chunk: "N of M"`, `chunk_complete: true`, and `next_recommended` = the engine's post-landing canonical `next_command` per `orbit-emit-composition`'s post-write-semantics class — `/orbit:apply <name>` while chunks remain (the engine MAY extend it with the engine-composed ` — next chunk: <chunk-name>` suffix; the next chunk's name is preamble data), or the schema's next phase command on apply-complete (chunk N == M; under `spec-driven` v3, `/orbit:review --as system <name>`). Never a hand-authored or fixed alternative — the pre-gates verify-first vocabulary is retired from this surface.
2. **Mid-chunk session pause**: when the user pauses or hands off mid-chunk-N (e.g., "stopping here for now"), emit with `chunk: "N of M"`, `chunk_complete: false`, and `next_recommended: "/orbit:apply <name>"` to resume.
3. **No-chunking apply**: when tasks.md has no explicit chunk preamble, emit once at session end with `chunk: null`; `chunk_complete` is COMPUTED by the same engine formula with the whole task set as the "current chunk" (all unchecked tasks minus the full user-validation set == 0 — never a constant), and `next_recommended` is the engine's post-landing canonical `next_command` — the schema's next phase command when that computation is true, `/orbit:apply <name>` while AI-doable tasks remain.

The apply emit per-command extensions SHALL include the following fields beyond the spine:

```
tasks_completed              int   running total of checked tasks across all chunks
tasks_remaining              int   running total of unchecked tasks (includes user-validation tasks if present)
user_validation_remaining    int   subset of tasks_remaining that are acknowledged user-validation tasks
                                   (acknowledged-convention work intentionally left unchecked at apply-time for runtime
                                   testing or user confirmation; surfaces as warnings at archive time, not blockers).
                                   Default: 0. ENGINE-computed (D-arc Stage D5) as the length of the payload's
                                   `user_validation_tasks` identifier list — the ONE checkbox judgment the payload
                                   supplies: the task ids it recognizes as user-validation per their text (e.g.,
                                   ["9.6", "9.7"] for "Live-test ...", "(User-validation handoff)"). Each named task
                                   is validated to exist in tasks.md and be unchecked — a bad entry is rejected
                                   naming it; payload supply of the count itself is rejected as engine-owned.
                                   The VERIFIED identifier list PERSISTS on the emit as
                                   `user_validation_tasks` (an empty list is elided) — it is the trail record
                                   the tracked-gate user-validation subset rule consumes (per
                                   `orbit-engine-gates`' Tracked-gate pass condition).
chunk                        string | null   e.g., "3 of 5" or null — ENGINE-computed from the preamble
chunk_name                   string | null   e.g., "phase+attention engine" — ENGINE-computed
chunk_complete               bool             true when AI-doable work in this chunk is done — ENGINE-computed
                                              (D-arc Stage D5): the current chunk's unchecked tasks minus its
                                              user-validation subset == 0, where the per-chunk subset derives from
                                              task → group → chunk membership via the preamble grammar and the
                                              payload's `user_validation_tasks` list; when `chunk` is null
                                              (no-chunking), the "current chunk" is the WHOLE task set and the
                                              subset is the full list; payload supply rejected;
                                              user_validation_remaining > 0 does NOT block chunk_complete: true
tasks_completed_this_session int             delta since prior apply JSON — ENGINE-computed from the trail
files_touched                string[] | null  file paths changed since the previous apply emit's recorded
                                              `diff_base` boundary — ENGINE-computed from the git diff against
                                              the WORKING TREE (committed + uncommitted tracked changes; the
                                              first apply emit — or one whose predecessor lacks `diff_base` —
                                              references the change's first commit; boundary semantics per
                                              orbit-emit-composition — D-arc Stage D5; the per-chunk half of the
                                              predicted/actual touchpoints split); null outside a git repo or
                                              when no base resolves; NEVER hand-listed
diff_base                    string | null    the git TREE OID of the tracked working state at THIS emit's
                                              boundary — ENGINE-captured (`git write-tree` on a temporary index,
                                              per orbit-emit-composition; D-arc Stage D5); the next apply emit
                                              diffs from it, making per-chunk lists exact under every commit
                                              ordering; null outside a git repo; payload supply rejected
gate_overridden              object | absent  present ONLY when the user proceeds past an unpassed or stale gate
                                              at the apply phase (the `review-proposal` gate gates `apply`, per
                                              orbit-engine-gates) via the inflection prompt; shape
                                              {gate, state, reason} captured at decision time. Absent when no
                                              override occurred; REQUIRED when proceed-anyway was chosen.
```

**Semantic rule**: `chunk_complete: true` means "AI-doable work in this chunk is done." `tasks_remaining > 0` AND `user_validation_remaining == tasks_remaining` is the expected state at the final chunk's emit when user-validation tasks exist — the AI is done; the remaining work is user-driven runtime testing. `tasks_remaining > 0` AND `user_validation_remaining < tasks_remaining` with `chunk_complete: true` is a contradiction the emit-layer MUST NOT produce.

#### Scenario: Chunk-1-of-5 completion emits with chunk_complete=true
- **WHEN** `/orbit:apply foo` completes the last task in chunk 1 of a 5-chunk apply
- **THEN** `apply-<TS>.json` is written with `chunk: "1 of 5"`, `chunk_complete: true`, and `next_recommended` advancing to `/orbit:apply foo` (next chunk)

#### Scenario: Mid-chunk pause emits with chunk_complete=false
- **WHEN** the user pauses mid-chunk-3 with 5 of 12 tasks in the chunk checked
- **THEN** `apply-<TS>.json` is written with `chunk: "3 of 5"`, `chunk_complete: false`, `tasks_completed_this_session: 5`, and `next_recommended: "/orbit:apply foo"`

#### Scenario: Apply-complete recommends the engine's canonical next
- **WHEN** `/orbit:apply foo` completes the last task in the final chunk
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true` and `next_recommended` equal to the engine's post-landing canonical `next_command` (under `spec-driven` v3, `/orbit:review --as system foo`) — never a hand-authored alternative

#### Scenario: No-chunking apply emits once at session end
- **WHEN** `/orbit:apply foo` runs on a change with no explicit chunk preamble in tasks.md and completes all AI-doable tasks
- **THEN** exactly one `apply-<TS>.json` is written at session end with `chunk: null` and `chunk_complete: true` — the whole-task-set computation, not a constant

#### Scenario: Overlapping chunk declarations fall back to no-chunking
- **WHEN** tasks.md declares `Chunk 1 (groups 1-3)` and `Chunk 2 (groups 3-4)`
- **THEN** the emit-layer logs the single malformed-preamble stderr warning and proceeds under no-chunking rules (`chunk: null`); no chunk arithmetic is attempted against overlapping declarations

#### Scenario: Final chunk completes with user-validation tasks remaining
- **WHEN** `/orbit:apply foo` completes the last AI-doable task in the final chunk, but 6 user-validation tasks (e.g., "9.1 Live-test ...", "9.9 (User-validation handoff)") remain explicitly unchecked per the user-validation convention (the payload's `user_validation_tasks` list names them; the engine verifies each and derives the counts)
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true`, `tasks_remaining: 6`, `user_validation_remaining: 6` (matching `tasks_remaining`), and `next_recommended` equal to the engine's canonical `next_command` — the AI is done; user-validation happens through the review-system phase's verify pass

#### Scenario: Apply past an unpassed proposal gate records the override
- **WHEN** the user invokes `/orbit:apply foo` while the `review-proposal` gate is unpassed or stale and chooses proceed-anyway at the inflection prompt
- **THEN** the `apply-<TS>.json` emit includes `gate_overridden: {gate: "review-proposal", state: "<unpassed|stale>", reason: "<gate reason at decision time>"}`; emits for applies with no gate override omit the field entirely

#### Scenario: Per-chunk touched files computed from the diff
- **WHEN** a chunk-completion emit fires in a git repository with commits and/or uncommitted tracked edits since the previous apply emit
- **THEN** `files_touched` lists the changed paths engine-computed from the diff against the working tree; in a non-git workspace, or when no reference resolves, the field is `null` — never an AI-authored list

### Requirement: Verify pass recommendation

When standalone `/orbit:verify <name>` passes (verify-change reports no failures), the emit-layer SHALL write `verify-<TS>.json` with `next_recommended`:

```
"/orbit:review --as system <name> — verification clean; formal pre-archive
 review recommended (or /orbit:archive <name> if you're skipping the
 editorial pass)"
```

The leading `/orbit:review --as system <name>` token is the canonical recommendation; a downstream status reader extracts this into `command`/`args`. The alternative `/orbit:archive <name>` path lives in the reason text and is surfaced to the user via the reader's `reason` field.

#### Scenario: Verify pass emit recommends review-as-system canonically
- **WHEN** `/orbit:verify foo` passes
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:review --as system foo"` and the reason text mentions `/orbit:archive foo` as alternative

#### Scenario: Status reader parses verify-pass recommendation
- **WHEN** a downstream status reader reads the verify-pass JSON and best-effort parses
- **THEN** `command` is `"/orbit:review --as system"`, `args` is the change name, `reason` is the full verbatim string

### Requirement: Verify fail-mode recommendations

When standalone `/orbit:verify <name>` fails, the emit-layer SHALL classify the failure mode based on verify-change's output and write `next_recommended` accordingly:

- **Mode ① (tasks-incomplete)**: tasks.md has unchecked items → `"/orbit:apply <name> — N tasks remain unchecked; complete implementation before re-verifying"`
- **Mode ② (impl-vs-spec gap)**: tasks all checked but spec scenarios fail → `"/orbit:review --as system <name> — N spec scenarios fail against implementation; system review will surface findings in its scorecard for you to walk each as code fix or spec revision"`
- **Mode ③ (orbit-validate failure)**: `orbit validate` itself fails → `"Fix artifact validation errors: <validator message verbatim>"` (no leading orbit command; reason field carries the validator output)

When verify completes with warnings (passes but with non-blocking findings), the emit-layer SHALL write `next_recommended: "/orbit:review --as system <name> — verification passed with N warnings; system review recommended"`.

The classification SHALL happen in the emit-layer; verify itself does not gain marker-dropping or other behaviors (see `Requirement: Emit-layer wraps upstream skills without modifying them`). The mode-② recommendation does NOT use `/orbit:review --as system --mark` because that flag is proposal-mode only and silently ignored in system mode (per `orbit-review/spec.md`'s `Requirement: --mark flag is proposal-mode only`). The user manually walks each system-review finding to decide code-vs-spec.

**Precedence when multiple fail signals fire simultaneously** (highest precedence first):

1. **Mode ③ (orbit-validate failure)** — if `orbit validate` itself errors, verify cannot meaningfully evaluate impl-vs-spec until the spec is fixable. Mode ③'s recommendation wins over modes ① and ②.
2. **Mode ① (tasks-incomplete)** — if tasks.md has unchecked items, evaluation is premature regardless of any impl-vs-spec signal. Mode ①'s recommendation wins over mode ②.
3. **Mode ② (impl-vs-spec gap)** — applies when modes ③ and ① are clean.
4. **Warn state** — applies on pass with warnings only when none of the failure modes fire.

This precedence directs the user to the root cause first: fix the spec (mode ③) → complete the implementation (mode ①) → resolve impl-vs-spec gaps (mode ②).

**Out of scope**: partial or aborted verify runs (e.g., verify timed out before classifying findings, transient validator failure). These are upstream verify-change concerns; the emit-layer SHALL emit whatever verify-change reports. If verify-change reports incomplete output, the emit-layer SHALL set `next_recommended` to `"Re-run /orbit:verify <name> — prior verify run incomplete (see verify-change output for details)"`.

#### Scenario: Mode-① fail recommends /orbit:apply
- **WHEN** `/orbit:verify foo` fails because tasks.md has unchecked items
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:apply foo"` and mentions the count of remaining tasks

#### Scenario: Mode-② fail recommends /orbit:review --as system (without --mark)
- **WHEN** `/orbit:verify foo` fails because spec scenarios don't pass against the implementation
- **THEN** `verify-<TS>.json`'s `next_recommended` begins with `"/orbit:review --as system foo"` (without `--mark` — that flag is proposal-mode only); reason text explains the user must walk each system-review finding as either a code fix or spec revision

#### Scenario: Mode-③ fail preserves verbatim validator message
- **WHEN** `/orbit:verify foo` fails because `orbit validate` itself errors (e.g., malformed spec frontmatter)
- **THEN** `verify-<TS>.json`'s `next_recommended` text begins with `"Fix artifact validation errors:"` and includes the validator's verbatim error message; a downstream status reader's parse finds no leading slash command and preserves the full text in `reason`

#### Scenario: Multiple fail signals — precedence ③ > ① > ②
- **WHEN** `/orbit:verify foo` reports BOTH unchecked tasks (mode ① signal) AND `orbit validate` errors (mode ③ signal) simultaneously
- **THEN** `verify-<TS>.json`'s `next_recommended` follows mode ③ (verbatim validator message), NOT mode ①; the user is directed to fix the spec validation error first, after which a re-run will surface the tasks-incomplete signal

### Requirement: Review-external T0 multi-step recommendation

The external-review packaging branch (`/orbit:review --as <mode> --reviewer external`, D-arc Stage D5's merge — record vocabulary frozen per `orbit-review-external`) SHALL emit `review-external-<TS>.json` at T0 (when the prompt is packaged, before findings return from the external AI). The emit includes per-command extensions:

```
mode                  "proposal" | "system"
prompt_path           string   path to the just-written external-prompt-<mode>-<TS>.md
target                string|null   the named external AI (e.g., "codex", "gpt-5"), or null
awaiting_findings     bool     always true at T0
```

`next_recommended` SHALL be multi-step prose describing the user action plus the follow-up command:

```
"Paste orbit/changes/<name>/.orbit-runs/external-prompt-<mode>-<TS>.md
 into the target AI, save the response as
 orbit/changes/<name>/.orbit-runs/external-<mode>-<TS>.md,
 then /orbit:address-reviews <name> --from-file <path>"
```

A downstream status reader's best-effort parse will find no leading `/orbit:<verb>` (because the string leads with "Paste"); `command` and `args` are left null, and the full verbatim string is surfaced in `reason`. This is the expected behavior — multi-step user actions are accurately represented as prose, not collapsed into a single command.

T1 (findings returned, `/orbit:address-reviews --from-file` invoked) is the existing `/orbit:address-reviews` emit and is unaffected by this requirement.

#### Scenario: Review-external T0 emit has awaiting_findings=true
- **WHEN** `/orbit:review foo --as proposal --reviewer external` runs and packages the prompt
- **THEN** `review-external-<TS>.json` is written with `mode: "proposal"`, `awaiting_findings: true`, `prompt_path` pointing at the just-written `external-prompt-proposal-<TS>.md`

#### Scenario: Review-external T0 recommendation is prose-only
- **WHEN** a downstream status reader reads the review-external T0 JSON and best-effort parses `next_recommended`
- **THEN** no leading slash command is found; `command` and `args` are null; the full multi-step instruction is preserved verbatim in `reason`

### Requirement: Audit-drift standalone recommendations

Standalone `/orbit:audit-drift` already emits `audit-drift-<TS>.json` per the `orbit-audit-drift` skill's `references/run-summary-schema.md` (shipped alongside the generated skill). The emit SHALL include the universal spine from `orbit-conventions`'s `Internal-run JSON summary format` (with `kind: "editorial"`). The emit-layer recognizes TWO standalone invocation modes — **change-scoped** (`/orbit:audit-drift <name>`) and **project-wide** (`/orbit:audit-drift` with no argument) — each with distinct emit path, `change` value, and recommendation logic:

**Change-scoped standalone** (`/orbit:audit-drift <name>`):
- Emit path: `orbit/changes/<name>/.orbit-runs/audit-drift-<TS>.json`
- `change` field: the change name
- `next_recommended` on findings: `"/orbit:address-reviews <name> — N drift(s) detected; resolve before next workflow step"`. The `--from-file <this-json>` argument is NOT required: `/orbit:address-reviews` auto-discovers the most-recent `audit-drift-*.json` in the change's `.orbit-runs/` per the orbit-address-reviews `Address-reviews command available` requirement's auto-discovery fallback. Address-reviews picks the audit-drift JSON via the recency rule (single global most-recent across `review-<mode>-*.json` + `audit-drift-*.json`); the just-written `audit-drift-<TS>.json` will be the most recent at recommendation-emit time, so auto-discovery resolves to it cleanly.
- `next_recommended` on clean (zero findings): copy from the most recent prior `.orbit-runs/*.json` for the same change, excluding the just-written audit-drift JSON itself. `final_assessment` SHALL note "drift check clean; deferring to prior workflow state."

**Project-wide standalone** (`/orbit:audit-drift` with no argument):
- Emit path: `orbit/.orbit-runs/audit-drift-<TS>.json` (create the directory if it doesn't exist)
- `change` field: `null` (no change scope)
- `next_recommended` on findings: `"/orbit:address-reviews --from-file <this-json> — N drift(s) detected project-wide; resolve before next workflow step"`. The `--from-file <path>` argument IS required here: project-wide audit-drift has no change-directory anchor for `.orbit-runs/` lookup, so auto-discovery does NOT apply per the orbit-address-reviews spec's positional-resolution algorithm (no positional → bare invocation → grep-only; bare invocation skips auto-discovery).
- `next_recommended` on clean (zero findings): `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."` (no prior-workflow defer because project-wide audit-drift has no per-change workflow narrative to defer to). `final_assessment` SHALL note "project-wide drift check clean."

(Historical note: `--from-file <this-json>` was historically required for the change-scoped recommendation because earlier versions of `/orbit:address-reviews` did not auto-discover internal JSON. Now that auto-discovery handles change-scoped invocations, the `--from-file` argument is dropped for change-scoped recommendations to give users the cleaner 2-command workflow. Project-wide invocations still require explicit `--from-file` because they have no change-directory anchor.)

Per-command extensions for audit-drift SHALL include:

```
categories_run        object   { vocab_residue, lens_staleness, cross_doc_consistency, archive_coherence } — bools
findings_by_category  object   counts per category
findings_total        int
```

This requirement applies only to **standalone** `/orbit:audit-drift` invocations (both change-scoped and project-wide). Inline audit-drift during `/orbit:archive` is captured in `archive-<TS>.json` per the existing archive emit convention (unchanged).

#### Scenario: Change-scoped standalone audit-drift with findings recommends address-reviews

- **WHEN** `/orbit:audit-drift foo` runs and detects 3 drifts
- **THEN** `orbit/changes/foo/.orbit-runs/audit-drift-<TS>.json` is written with `change: "foo"`, `findings_total: 3`, and `next_recommended` beginning with `"/orbit:address-reviews foo —"` (no `--from-file` argument; auto-discovery picks up the just-written audit-drift JSON via the recency rule)

#### Scenario: Change-scoped clean audit-drift defers to prior workflow recommendation

- **WHEN** `/orbit:audit-drift foo` runs and detects 0 drifts, and the prior latest `.orbit-runs/*.json` for `foo` is `apply-2026-05-21T10-00-00Z.json` with `next_recommended: "/orbit:apply foo — chunk 3 of 5 done"`
- **THEN** the new `audit-drift-<TS>.json` has `findings_total: 0` and `next_recommended` equal to the verbatim string `"/orbit:apply foo — chunk 3 of 5 done"`, and `final_assessment` notes drift-check-clean + deferral

#### Scenario: Project-wide standalone audit-drift with findings

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 2 project-wide drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 2`, and `next_recommended` beginning with `"/orbit:address-reviews --from-file"` (still requires `--from-file` because project-wide invocations have no change-directory anchor; auto-discovery does not apply to bare `/orbit:address-reviews` invocations)

#### Scenario: Project-wide clean audit-drift (no prior workflow to defer to)

- **WHEN** `/orbit:audit-drift` runs with no change argument and detects 0 drifts
- **THEN** `orbit/.orbit-runs/audit-drift-<TS>.json` is written with `change: null`, `findings_total: 0`, and `next_recommended` reads `"No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."`

#### Scenario: Inline audit-drift during archive unchanged

- **WHEN** `/orbit:archive foo` runs and the inline audit-drift step produces findings
- **THEN** the findings are captured in `archive-<TS>.json` per existing archive emit behavior; no separate `audit-drift-<TS>.json` is written for the inline pass

### Requirement: No forward-look at planned future behavior changes

Emit text SHALL recommend canonical command names without anticipating behavior changes planned in other (not-yet-landed) changes. Specifically:

- When a planned change inverts a command's default behavior (e.g., inverting `/orbit:review --as system`'s default to external/fresh-context reviewer mode), the emit text SHALL recommend `/orbit:review --as system` without qualifiers like "external recommended" or "fresh-context preferred"
- When a planned change adds a flag or sub-behavior, the emit text SHALL NOT preview the new flag or behavior

When the planned change lands, every prior emit that recommended its command automatically benefits because users invoking the recommended command experience the new default behavior at that moment; no emit-time forward-references are needed.

#### Scenario: Verify-pass recommendation does not reference planned reviewer-mode changes
- **WHEN** the emit-layer writes a verify-pass JSON's `next_recommended`
- **THEN** the text contains `"/orbit:review --as system <name>"` and does NOT contain qualifiers about external review, fresh-context, or reviewer-mode defaults

#### Scenario: Emit text contains no other-issue references
- **WHEN** any run-summary JSON is inspected
- **THEN** `next_recommended` and `final_assessment` text contain no issue numbers (e.g., `#20`, `#15`) or references to future-issue behavior changes

### Requirement: Reviewer-class field on review-cycle emits

Review-cycle emits SHALL carry a first-class `reviewer_class` field identifying the execution context that produced the pass: `"in-context"` (the authoring conversation), `"fresh"` (a clean-context execution, e.g. `--fresh`), or `"external"` (a different AI via the review-external handoff). The field appears on `review-<mode>-<TS>.json` emits and on `review-external-<TS>.json` T0 emits (where it is `"external"` by definition, describing the packaged-but-not-yet-returned handoff). The field exists so the engine's reviewed-gate convergence computation (per `orbit-engine-gates`) can count class coverage from the audit trail without inference.

A `review-external-<TS>.json` T0 emit is a PACKAGING record, NOT a completed pass: it carries `awaiting_findings: true`. For class-coverage purposes an `external` pass exists ONLY when an `external-<as>-<TS>.md` findings file exists in `.orbit-runs/`; a T0 emit with `awaiting_findings: true` SHALL NEVER satisfy external class coverage, so a packaged-but-never-returned external cannot converge a `reviewed` gate. Its `reviewer_class: "external"` describes the intended handoff class for audit readability, not a counted pass.

#### Scenario: Review emit records its reviewer class

- **WHEN** `/orbit:review` completes and persists `review-<mode>-<TS>.json`
- **THEN** the JSON includes `reviewer_class`: `"fresh"` when the pass work ran in a clean execution context (`--fresh`), otherwise `"in-context"`

#### Scenario: Externally-sourced findings are classed external

- **WHEN** the engine computes class coverage and encounters an `external-<as>-<TS>.md` findings file
- **THEN** that pass counts as `reviewer_class: "external"` (the markdown's `**Reviewer**:` line carries the specific model; the class is structural)

#### Scenario: Packaged-but-unreturned external is not class coverage

- **WHEN** a `review-external-<TS>.json` T0 emit exists with `awaiting_findings: true` but no corresponding `external-<as>-<TS>.md` findings file has landed
- **THEN** the engine counts NO external pass for class coverage; the `external` cadence slot stays unsatisfied and the gate remains unpassed with the canonical next command targeting the external return

#### Scenario: Legacy emits without the field degrade to inference

- **WHEN** the engine reads an emit that predates this field
- **THEN** the class is inferred — `flags.fresh: true` → `"fresh"`; `external-*.md` provenance → `"external"`; otherwise `"in-context"` — and the absence of the field never breaks gate computation

### Requirement: Consent field on the apply emit

The apply emit (`apply-<TS>.json`) SHALL carry the flat `consent: "user-invoked" | "prompted"`
field per `orbit-lifecycle-consent`'s emit-field requirement — `user-invoked` when the apply was
user-typed, `prompted` when the AI-mediated-entry consent prompt fired and the user proceeded.
The field applies to every post-capability apply emit (all three emit rules: chunk completion,
mid-chunk pause, no-chunking session end — the consent story is a property of the apply
invocation, identical across its chunks' emits). Emits predating the consent capability lack the
field and are exempt from the audit-drift tripwire (per `orbit-audit-drift`). Downstream parsers
SHALL ignore the field if unknown (forward-compat, matching `recommendation_options` precedent).
The archive emit's consent field is specified in `orbit-archive-modifications`' `Archive run
summary written` requirement.

#### Scenario: Apply emit carries consent

- **WHEN** a user-typed `/orbit:apply` session writes its chunk-end emit
- **THEN** the emit includes `consent: "user-invoked"` alongside the existing spine and
  per-command extensions (`gate_overridden` unchanged and independent)

#### Scenario: Consent constant across one apply's chunk emits

- **WHEN** a single apply invocation emits at multiple chunk boundaries
- **THEN** every emit of that invocation carries the same consent value (provenance is a property
  of the invocation, not the chunk)
