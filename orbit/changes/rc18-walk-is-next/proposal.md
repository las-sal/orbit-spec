## Why

rc17c's in-context verification passed `review-proposal` carrying three SUGGESTIONs. The gate row listed the pass
under `unwalkedPasses`, but the canonical next read `/orbit:apply`: the engine knew a walk was owed and did not say
so. Sal: "even if there are suggestions, i think the next recommended path should be an address-reviews". rc17a made
SUGGESTION-only passes DISCOVERABLE; this change makes them the RECOMMENDED next while they stay unwalked. The gate's
verdict does not move, because SUGGESTIONs never gate (rc02). Only the recommendation moves (see explore.md).

The exploration found that the charter's safety measurement covered one case of two. Walking the cadence's LAST pass
leaves the gate `passed`. Walking a SUGGESTION-only pass that fills an EARLIER slot, after the gate passed, un-passes
it, because rc17a's ratified 2A makes every walk raise the following slot's ordering bar (explore.md D-rc18-1, Case 1).
Sal kept 2A (D-rc18-4). The proposal's blind pair then showed the un-pass is the ORDINARY path: an unpassed gate
whose first pass carries only SUGGESTIONs names the in-context review before the walk, so the walk named after the gate
passes lands after that review. Sal took option A at the walk: the walk is named on the unpassed gate too, before the
following slot's review, as it already is for a pass carrying a WARNING.

## What Changes

- In the change-level next selection, a reviewed gate that is `passed`, whose `before` names no gate that has passed
  (the FRONTIER), and whose `unwalkedPasses` is non-empty yields `/orbit:address-reviews <change>` as the canonical next.
  Its state is unchanged (D-rc18-5). This covers the proposal gate, whose `/orbit:apply` today comes from the tracked
  `apply` gate's `ready` branch rather than from the passed review gate (D-rc18-3). It also covers the system gate,
  whose `/orbit:archive` today comes from the all-passed fall-through.
- On a passed frontier gate with an unwalked pass, the gate row's own `nextCommand` and the change-level
  `next_command` come from ONE predicate, so the row and the change never name different commands. Every other passed
  gate's row keeps its phase command, and the selection takes a passed gate's command only on that predicate.
- On an unpassed or stale reviewed gate, the canonical command is chosen in a stated order: an open pair's missing
  member, then the walk when a pass is unresolved OR unwalked, then the review for the cadence position. The unwalked
  half of the second step is new, so a SUGGESTION-only pass is walked before the review that checks it.
- After the walk, the next is the phase command again. A walk can still un-pass a gate, but only off the recommended
  path: an earlier slot's pass walked after the following slot's review ran. The next is then whatever the order
  computes for the slots it uncovered (rc17a's 2A, unchanged; D-rc18-4).
- `A reviewed gate lists its outstanding passes` says of `unwalkedPasses` that "The gate never reads it". The sentence
  is qualified: the gate's STATE never reads the field, and the gate's and the change's canonical next do.
- The charter's exits (2) and (3) are revised in `clean-up-review-cycle.md`. Exit (2)'s wording came from the one
  measured branch (D-rc18-4, R-crc-12's first case). Exit (3), "an unpassed gate's next is unchanged", is widened on
  Sal's word at the proposal walk.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`, three requirements:
  - `Single-voiced canonical-next computation` gains the unpassed gate's command order, and the change-level
    selection as a decision table over the reviewed states it visits (D-rc18-5's DERIVED domain).
  - `A reviewed gate lists its outstanding passes` qualifies its "never reads it" sentence to the gate's STATE, and
    its walk-form sentence covers an unwalked pass as well as an unresolved one.
  - `The first review slot covers what the user invoked` says its table decides the slot's command, which the order
    in `Single-voiced canonical-next computation` can precede.

**Size: one capability**, measured at exploration (D-rc18-6).

## Impact

- `src/core/artifact-graph/instruction-loader.ts`: `formatChangeStatus`'s next-selection loop.
- `src/core/artifact-graph/gates.ts`: `canonicalNextForReviewed`'s walk step reads the unwalked set; the passed
  branch's `nextCommand`, through a shared frontier predicate.
- Tests: gate and status unit tests covering every row of the selection table and each step of the order, including
  the Case 1 trail shapes and the ordinary order the fresh proposal pass reproduced.
- `orbit/architecture/clean-up-review-cycle.md`: exits (2) and (3) revised, with the reasons recorded.
- No migration and no schema version bump: no gate's state or reason changes, and only the canonical next moves, on
  states that hold an unwalked pass.
