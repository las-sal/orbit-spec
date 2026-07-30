## MODIFIED Requirements

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
- **Malformed preamble handling** (graceful degradation): if the preamble comment block exists but cannot be parsed (missing parens, typo in `Chunk N`, malformed group range, etc.), the emit-layer SHALL log a single warning to stderr (`"warning: tasks.md preamble at <path> could not be parsed as chunk declarations; falling back to no-chunking mode"`) and proceed under no-chunking-apply rules (single emit at session end with `chunk: null`). The implementation is "tolerant on read, strict on write" — don't block the user's work; surface the parse issue so they can fix the preamble.

The emit follows these rules:

1. **Chunk completion**: when the last task in chunk N is checked, emit with `chunk: "N of M"`, `chunk_complete: true`, and `next_recommended` advancing to the next chunk (`/orbit:apply <name>`) or to `/orbit:verify <name>` on apply-complete (chunk N == M).
2. **Mid-chunk session pause**: when the user pauses or hands off mid-chunk-N (e.g., "stopping here for now"), emit with `chunk: "N of M"`, `chunk_complete: false`, and `next_recommended: "/orbit:apply <name>"` to resume.
3. **No-chunking apply**: when tasks.md has no explicit chunk preamble, emit once at session end with `chunk: null`, `chunk_complete: true`, and `next_recommended` advancing to `/orbit:verify <name>` on apply-complete or `/orbit:apply <name>` if tasks remain.

The apply emit per-command extensions SHALL include the following fields beyond the spine:

```
tasks_completed              int   running total of checked tasks across all chunks
tasks_remaining              int   running total of unchecked tasks (includes user-validation tasks if present)
user_validation_remaining    int   subset of tasks_remaining that are acknowledged user-validation tasks
                                   (acknowledged-convention work intentionally left unchecked at apply-time for runtime
                                   testing or user confirmation; surfaces as warnings at archive time, not blockers).
                                   Default: 0. Set to a positive count when the AI recognizes specific unchecked tasks
                                   as user-validation per their text (e.g., "Live-test ...", "(User-validation handoff)").
                                   The ONE checkbox field the payload supplies (a judgment call, not arithmetic).
chunk                        string | null   e.g., "3 of 5" or null — ENGINE-computed from the preamble
chunk_name                   string | null   e.g., "phase+attention engine" — ENGINE-computed
chunk_complete               bool             true when AI-doable work in this chunk is done (i.e.,
                                              tasks_remaining - user_validation_remaining == 0 for this chunk's tasks);
                                              user_validation_remaining > 0 does NOT block chunk_complete: true
tasks_completed_this_session int             delta since prior apply JSON — ENGINE-computed from the trail
files_touched                string[] | null  file paths changed since the previous apply emit — ENGINE-computed
                                              from the git diff (D-arc Stage D5; the per-chunk half of the
                                              predicted/actual touchpoints split); null outside a git repo or when
                                              no prior reference resolves; NEVER hand-listed
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

#### Scenario: Apply-complete recommends verify
- **WHEN** `/orbit:apply foo` completes the last task in the final chunk
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true` and `next_recommended` beginning with `"/orbit:verify foo"`

#### Scenario: No-chunking apply emits once at session end
- **WHEN** `/orbit:apply foo` runs on a change with no explicit chunk preamble in tasks.md
- **THEN** exactly one `apply-<TS>.json` is written at session end with `chunk: null` and `chunk_complete: true`

#### Scenario: Final chunk completes with user-validation tasks remaining
- **WHEN** `/orbit:apply foo` completes the last AI-doable task in the final chunk, but 6 user-validation tasks (e.g., "9.1 Live-test ...", "9.9 (User-validation handoff)") remain explicitly unchecked per the user-validation convention
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true`, `tasks_remaining: 6`, `user_validation_remaining: 6` (matching `tasks_remaining`), and `next_recommended` begins with `"/orbit:verify foo"` — the AI is done; user-validation happens at verify time

#### Scenario: Apply past an unpassed proposal gate records the override
- **WHEN** the user invokes `/orbit:apply foo` while the `review-proposal` gate is unpassed or stale and chooses proceed-anyway at the inflection prompt
- **THEN** the `apply-<TS>.json` emit includes `gate_overridden: {gate: "review-proposal", state: "<unpassed|stale>", reason: "<gate reason at decision time>"}`; emits for applies with no gate override omit the field entirely

#### Scenario: Per-chunk touched files computed from the diff
- **WHEN** a chunk-completion emit fires in a git repository with commits since the previous apply emit
- **THEN** `files_touched` lists the changed paths engine-computed from the diff; in a non-git workspace, or when no prior reference resolves, the field is `null` — never an AI-authored list
