## Why

A walk picks up the wrong work, and it has nowhere to send work it must not do. Bare
`/orbit:address-reviews` never looks at a change's trail. A change-scoped walk picks the ONE newest
review JSON, never an external return, and skips the trail entirely when a single `@review:` marker
exists. So a walk can report success while the gate still holds an unwalked pass: the gate's predicate
(`passResolved`) and the walk's rule (newest by `<TS>`) are two voices on one fact. Separately, R-crc-6
says a walk has three lanes and a REDESIGN leaves the change. The walk body names neither, and the log
records the lane only as prose ("Descoped to rc13b", "Repair, not redesign"), so a change that keeps
producing redesigns is invisible on the trail (see explore.md, Premise). This is stage
`rc08b-walk-routing` of `orbit/architecture/clean-up-review-cycle.md`, the second child of rc08 (D-rc08-1).

## What Changes

- **The gate lists every outstanding pass.** A reviewed gate's status row gains `unresolvedPasses:
  [{token, file, mode, source}]` (every pass `passResolved` rejects, in token order) and `openPair:
  {missing}`. Its `reason` and every rendering are unchanged. When a pass is unresolved, its canonical next
  becomes the change-scoped `/orbit:address-reviews <change>` with no `--from-file`, so the engine's own
  next line reaches discovery (D-rc08b-2; walk 1).
- **Discovery reads that list.** A change-scoped walk covers markers in scope, every pass in the
  non-superseded reviewed gates' `unresolvedPasses` (external returns included), and every unwalked
  `audit-drift-*.json`. Markers no longer suppress the trail. The single-newest recency rule is
  retired. A bare invocation with exactly one active change resolves to it and says so. A gate reporting
  `openPair` stops the walk before triage and names the missing member. `--from-file` stays the
  exclusive override (D-rc08b-3).
- **One invocation, one log per pass**, written in token order. A finding that converges with an earlier
  log's is stale-with-evidence naming that log. `source_path` stays a single path, so the gate and the
  trail reader read the logs unchanged (D-rc08b-1).
- **R-crc-6's three lanes become a field**: `remedy: repair | descope | redesign` on an entry, beside D4's
  process `lane` (D-rc08b-4).
- **A REDESIGN leaves the walk** in one of two shapes, carrying `routed_to`. If the mechanism is
  separable, it is descoped and routed to a new exploration (`resolved`). If it is essential, the entry
  is `escalated` and routed to the change's own `explore.md`, and the gate holds. The walk names the
  route and never invokes it (D-rc08b-5).
- **A disagreement** between the two halves of one pair is settled by one cheap empirical test, recorded
  on the later log as `disagreement: {with, test, observed}` (D-rc08b-6, D-rc03-6).
- **The review-external T0 `next_recommended` ends at "save the response as …"**. It no longer names a
  walk, and the eligibility line owns what follows (D-rc08b-8, Q-rc03-5).
- **Rider:** `orbit-engine-gates`' `Reviewed-gate pass condition` stops saying the emit surface
  validates no entry shapes, and points at the walk write gate instead (D-rc08b-9).
- **Not built:** an edit-level "edit happened" record. rc08a's `sweep.introduced` check and the
  VERIFICATION pass already cover what can be observed (D-rc08b-7).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-address-reviews`: discovery (the command requirement's priority order and its scenarios), one
  log per pass, the `remedy` field and REDESIGN routing, and the disagreement record.
- `orbit-engine-gates`: the reviewed gate exposes `unresolvedPasses` and `openPair`; the rider's pointer
  swap in `Reviewed-gate pass condition`.
- `orbit-run-summary-emit`: the T0 recommendation ends at the save step; the change-scoped audit-drift
  recommendation's recency sentence points at the new discovery rule.

Three capabilities, at R-crc-1's ceiling, as measured at exploration (D-rc08b-10).

## Impact

- `src/core/artifact-graph/gates.ts`: the convergence loop collects every unresolved pass; `GateStatus`
  gains two optional fields.
- `src/core/artifact-graph/instruction-loader.ts`: the gate row carries the two fields into
  `orbit status --change <name> --json`.
- `src/core/emit-composition.ts`: the T0 `next_recommended` string.
- `src/core/templates/workflows/address-reviews.ts`: Step 1 discovery, per-pass logs, classification
  (`remedy`), REDESIGN routing, the disagreement record, and the schema reference with `json example`
  blocks for the new fields.
- Tests: gate unit tests for the list and `openPair`, the status JSON shape, the T0 string, the
  round-trip and schema-parity suites, and the template text suites.
- No migration. Prior walk logs carry no `remedy` and are never re-graded. `budget`, `reason` and the
  position readout are unchanged. The eligibility line for an unresolved pass changes (see above), and
  its goldens move.
