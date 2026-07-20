## MODIFIED Requirements

### Requirement: Emit scope

The following orbit commands SHALL emit `orbit/changes/<name>/.orbit-runs/<command>-<TS>.json` (or `orbit/explore/<name>/.orbit-runs/<command>-<TS>.json` for explore, or `orbit/architecture/.orbit-runs/<command>-<TS>.json` for architecture-scoped commands) when invoked. This requirement covers two categories:

- **New emit behavior** (commands that don't emit any run-summary JSON today):
  - Workflow commands: `/orbit:explore` (named mode only — bare mode does NOT emit; named mode emits at BEGIN as well as at boundaries, per `Emit timing semantics` — D-arc Stage D3), `/orbit:propose`, `/orbit:new`, `/orbit:continue`, `/orbit:ff`, `/orbit:apply`, `/orbit:verify`, `/orbit:architect` (D-arc Stage D2; emits to the architecture trail with `change: null` + a `doc` field, shape owned by `orbit-architect`)
  - `/orbit:review-external` at T0 (when the prompt is packaged, before findings return — today it writes only the `.md` prompt file)
- **Refined existing emit** (already emits today; this change refines the recommendation logic and aligns with the universal spine from orbit-conventions):
  - Standalone `/orbit:audit-drift` (schema documented in the `orbit-audit-drift` skill's `references/run-summary-schema.md`, shipped alongside the generated skill)

The following commands SHALL NOT emit additional JSONs as part of this change:

- `/orbit:bulk-archive` — wrapper; each inner `/orbit:archive` invocation emits separately
- `/orbit:onboard` — meta walkthrough; no change-state transition
- `/orbit:sync` (the `orbit-sync-specs` skill) — upstream primitive, unmodified by orbit; no emit behavior is added to it

Existing emit-producing commands (`/orbit:review`, `/orbit:address-reviews`, `/orbit:archive`, inline `/orbit:audit-drift` during archive) continue emitting as today; `/orbit:review`'s architecture mode persists to the architecture trail per `orbit-review`'s per-mode persistence requirement — a location change for that mode, not a new emitter.

#### Scenario: Named-mode /orbit:explore writes explore JSON
- **WHEN** the user invokes `/orbit:explore foo` (named mode) and the session ends
- **THEN** the emit-layer writes `orbit/explore/foo/.orbit-runs/explore-<TS>.json`

#### Scenario: Named-mode explore BEGIN emit at scaffold (D-arc Stage D3)
- **WHEN** `/orbit:explore foo` creates the staging directory (Mode B new, or Mode C crystallization)
- **THEN** the emit-layer writes a begin `explore-<TS>.json` immediately — `decisions_captured: 0`, `next_recommended: "/orbit:explore foo — continue capturing"`, the `final_assessment` recording the scaffold and the citation decision (cited or declined) — so the trail records the workstream's start (and any `premised → exploring` stage transition) and the orientation surface can anchor from minute zero

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

### Requirement: Emit timing semantics

The emit-layer SHALL fire at well-defined moments per command type. Three categories cover the full command surface:

**One-shot commands** — emit ONCE on natural command completion (when the AI completes the command's intended work and is about to return control to the user):
- `/orbit:propose`, `/orbit:new`, `/orbit:ff`, `/orbit:continue`
- `/orbit:verify`
- `/orbit:audit-drift` standalone (excluding the inline-during-archive case captured in `archive-<TS>.json`)
- `/orbit:review-external` at T0 (when the prompt is packaged, before findings return)

**Multi-turn commands with explicit phases** — emit at phase boundaries per the command-specific requirement:
- `/orbit:apply` — emits per `Requirement: Apply per-chunk-end emission` (chunk completion is the primary trigger; mid-chunk pause is the secondary trigger per the conversation-boundary rules below)

**Multi-turn conversational commands** — emit at conversation boundaries:
- `/orbit:explore` (named mode) — a BEGIN emit at staging-dir creation (D-arc Stage D3; the begin+boundary genre, like apply's chunk+pause) AND boundary emits per `Requirement: Named-mode explore recommendation by maturity` with the timing defined here; resuming a pre-D3 staging directory that has no emits does NOT retro-fire a begin emit (add-only, no backdating — the next boundary emit covers it)
- `/orbit:architect` (D-arc Stage D2) — emits to the architecture trail with the conversation-boundary timing defined here; the emit's shape and extensions are owned by `orbit-architect`

A **conversation boundary** for multi-turn conversational commands is defined as EITHER of (both rules are operational signals the emit-layer can detect at JSON-write time without requiring future-message inspection):

1. **User explicitly signals stop or pause** — "stop", "pause", "that's it for now", "we'll come back to this later", or equivalent intent
2. **AI-initiated wrap** — AI says "I've captured everything; type `/orbit:propose <name>` when ready" or equivalent intent (an explicit suggestion of the next workflow step, signalling the conversation is at a natural pause point)

**Canonical orbit UX convention**: to make most natural handoffs become explicit boundaries, when the AI hands control back to the user after a multi-turn conversational command session (such as `/orbit:explore` named-mode), the AI SHOULD include an explicit wrap phrase suggesting the next step (e.g., "type `/orbit:propose <name>` when ready" or "type `/orbit:explore <name>` to continue capturing"). This turns the handoff itself into a rule-2 signal and triggers the emit naturally without requiring the AI to predict future user behavior.

**Known limitation** (accepted tradeoff): if the user closes the conversation without either an explicit stop signal or an AI-initiated wrap (e.g., user simply walks away mid-session), no emit fires for that session. The change's state persists in on-disk artifacts (e.g., `explore.md`), but the `.orbit-runs/` JSON timeline misses the implicit boundary. Capturing the implicit case would require future-message inspection unavailable to the emit-layer at JSON-write time; explicit-signal-only is the operationally simpler tradeoff.

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
- **THEN** no emit fires for that session. The `orbit/explore/foo/explore.md` artifact retains captured state. The next `/orbit:explore foo` invocation picks up from disk and will emit at its own boundary; the prior session's implicit boundary is not captured in the `.orbit-runs/` timeline

#### Scenario: AI-initiated wrap fires emit
- **WHEN** during `/orbit:explore foo` the AI says "I've captured everything; type `/orbit:propose foo` when ready"
- **THEN** the emit-layer treats this as a conversation boundary and emits `explore-<TS>.json` with current state
