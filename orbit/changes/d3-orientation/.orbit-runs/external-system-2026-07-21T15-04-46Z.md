# External Review: d3-orientation (iteration 1, system)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-21

## CRITICAL

### Metadata failures are swallowed instead of producing degraded entries

**File**: src/core/orientation.ts:299
**Description**: `readCitation` catches every `readChangeMetadata` failure and
returns no citation even though its caller's contract says metadata failures
reach the outer `try`/`catch` and produce a degraded entry. For changes,
`loadChangeContext` then reaches `resolveSchemaForChange`, which also catches the
invalid metadata and silently defaults to `spec-driven`; for explores there is
no later metadata read at all. A scratch fixture with invalid YAML therefore
produced healthy, fully populated change and explore entries instead of
`{name, kind, degraded: true, error}`. The same call omits `projectRoot`, so
valid metadata naming a project-local schema is treated as unknown: its
architecture citation disappears (the stage engine still sees it, so `--full`
incorrectly lists the workstream under `standalone`), and the emit-less
`created` fallback at lines 503-510 similarly discards its date. Read and
validate metadata with `readChangeMetadata(ws.dir, projectRoot)` inside
`composeWorkstreamEntry`'s fault-isolation boundary, reuse that validated object
for citation and created-date selection, and let actual load errors reach the
degraded variant. Add direct invalid-metadata fixtures for both workstream kinds
plus a valid project-local-schema citation/recency fixture; the current “broken
workstream” test only breaks the referenced schema, so it never exercises the
normative metadata-failure scenario.

## WARNING

### A ready apply gate at zero tasks has no current glyph

**File**: src/core/orientation.ts:269
**Description**: The apply chip receives `▶` only when `checked > 0`. With
proposal review passed and an apply gate reporting `ready`, `checked: 0`,
`total: 1`, the engine's position is `apply ready` and its canonical next is
`/orbit:apply`, but the orientation strip renders `apply 0/1` rather than the
closed-mapping current form `apply ▶ 0/1`. Mark a non-passed tracked gate
current when its engine state is `ready`, including zero checked tasks, and add
a 0/N entry-boundary fixture rather than testing only mid-apply progress.

### Spine-invalid review emits still increment the strip

**File**: src/core/orientation.ts:237
**Description**: Recency uses `readValidEmits`, but review iteration counts come
from the more permissive `readTrail`. A `review-proposal-*.json` missing
`final_assessment` and `next_recommended` is correctly absent from
`readValidEmits` and from `last`, yet `readTrail` still parses it as an internal
pass and the strip renders `review ⟲1`. That contradicts the fault-isolation
rule that a spine-invalid emit is skipped. Count strip iterations from
spine-valid review emits (or make the trail reader apply the same validity
predicate without regressing its gate contract) and assert that a spine-invalid
review file changes neither `last` nor the review chip count.

### Per-trail same-token selection reverses the shared filename tie-break

**File**: src/core/orientation.ts:153
**Description**: `readValidEmits` sorts equal tokens by ascending filename and
callers select the final element, so the lexicographically later filename wins
within one trail. The shared `compareRecency` comparator at lines 210-217 makes
the lexicographically earlier filename win. A same-workstream fixture containing
`apply-<same-TS>.json` and `propose-<same-TS>.json` selected `propose` as its own
`last` before the shared comparator could run. Use the same recency comparator
(including filename direction) for per-trail newest selection, sprint
anchoring, and global LAST, and add the missing same-workstream/same-token test.

### PROGRAM does not reuse the architecture-status malformed bucket or render

**File**: src/core/orientation.ts:525
**Description**: The full JSON's malformed bucket is not the
architecture-status bucket promised by the spec: orientation emits only
`{doc, violations}`, omits computed `stages`, and exposes parser-native
zero-based violation lines, while `orbit architecture status --json` emits
`{doc, stages, violations}` with one-based lines. The text renderer compounds
the divergence by changing the legacy literal and reducing a malformed doc to
`<doc>: MALFORMED`, omitting architecture status's validate command, violation
lines, and well-formed sibling stages. In a scratch doc, architecture status
reported line 3 plus a computed `d5-good` stage, while orientation reported line
2 and no stages. Extract and reuse one architecture-status bucket builder and
matching listing renderer, then cover legacy and malformed docs (including a
well-formed stage inside a malformed doc) in full text and JSON tests.

### Single-review WAITING output violates the normative singular literal

**File**: src/core/orientation.ts:416
**Description**: The renderer always emits `external review(s)`. The
repository's live one-handoff state therefore prints `1 external review(s)
packaged, 0 returned`, while the explicit single-handoff scenario requires
`1 external review packaged, 0 returned`. Preserve the already-correct
`review(s)` literal for the two-handoff scenario, but pluralize by count so the
single scenario renders exactly, and add a one-packaged/zero-returned assertion.

### The also line reports a completed predecessor instead of the active review phase

**File**: src/commands/workflow/status.ts:278
**Description**: `phaseOf` looks only for `▶`, then falls back to the last `✓`.
The strip intentionally leaves stale/unpassed review gates unmarked, so a change
whose apply gate is passed and whose system review gate is unpassed is shown as
`name (apply done)` even though its engine next command and WAITING reason both
place it in review. A scratch bare render produced `also: system-review (apply
done) · system-review: gate review-system unpassed ...`. Derive the compact
phase from the engine frontier/`next_command` (with strip data as presentation),
or otherwise explicitly recognize unpassed/stale review frontiers, and add an
`also` fixture for a post-apply system-review change.

## SUGGESTION

None.

## Notes

Build, lint, strict validation, and all 7 fingerprint checks passed. The suite
completed with 1718 passing and the expected 24 space-path command failures
described in the prompt. The targeted orientation module tests passed. Real
bare/full text and JSON surfaces, the unchanged `--change` text/JSON surface,
architecture status, and a fresh generated Claude surface were exercised;
generation produced 16 skills/commands, no status slash surface, and the
explore skill contained the mode-aware BEGIN-emit instructions.
