## MODIFIED Requirements

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

1. **Chunk completion**: when the last task in chunk N is checked, emit with `chunk: "N of M"`, `chunk_complete: true`, and `next_recommended` = the engine's post-landing canonical `next_command` per `orbit-emit-composition`'s post-write-semantics class — `/orbit:apply <name>` while chunks remain (the engine MAY extend it with the engine-composed ` — next chunk: <chunk-name>` suffix; the next chunk's name is preamble data), or the schema's next phase command on apply-complete (chunk N == M — the SCHEMA's value, read from the gate graph and never transcribed here; a version-pinned example in this sentence goes stale at the next bump, as the `v3` one written here did). Never a hand-authored or fixed alternative — the pre-gates verify-first vocabulary is retired from this surface.
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
- **THEN** `apply-<TS>.json` is written with `chunk_complete: true` and `next_recommended` equal to the engine's post-landing canonical `next_command` as the gate graph computes it for the change's schema — never a hand-authored alternative

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
