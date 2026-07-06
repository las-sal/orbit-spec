## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Apply per-chunk-end emission

`/orbit:apply` SHALL emit `apply-<TS>.json` at chunk boundaries when chunks are explicitly declared in the change's tasks.md preamble. The chunk preamble SHALL use this format: an HTML comment block at the top of tasks.md (before the first `## <group-name>` header) containing lines of the form `Chunk N (groups X[-Y]): <chunk-name>`. Example:

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
chunk                        string | null   e.g., "3 of 5" or null
chunk_name                   string | null   e.g., "phase+attention engine"
chunk_complete               bool             true when AI-doable work in this chunk is done (i.e.,
                                              tasks_remaining - user_validation_remaining == 0 for this chunk's tasks);
                                              user_validation_remaining > 0 does NOT block chunk_complete: true
tasks_completed_this_session int             delta since prior apply JSON
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
