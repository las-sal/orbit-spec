## Why

rc17c's in-context verification passed `review-proposal` carrying three SUGGESTIONs. The gate row listed the pass
under `unwalkedPasses`, but the canonical next read `/orbit:apply`: the engine knew a walk was owed and did not say
so. Sal: "even if there are suggestions, i think the next recommended path should be an address-reviews". rc17a made
SUGGESTION-only passes DISCOVERABLE; this change makes them the RECOMMENDED next while they stay unwalked. The gate's
verdict does not move, because SUGGESTIONs never gate (rc02). Only the recommendation moves (see explore.md).

The exploration found that the charter's safety measurement covered one case of two. Walking the cadence's LAST pass
leaves the gate `passed`. Walking a SUGGESTION-only pass that fills an EARLIER slot, after the gate passed, un-passes
it, because rc17a's ratified 2A makes every walk raise the following slot's ordering bar (explore.md D-rc18-1, Case 1).
Sal kept 2A (D-rc18-4): the walk is still named, and it may owe one bounded in-context check.

## What Changes

- In the change-level next selection, a reviewed gate that is `passed`, whose `before` gate has not passed (the
  FRONTIER), and whose `unwalkedPasses` is non-empty yields `/orbit:address-reviews <change>` as the canonical next.
  Its state is unchanged (D-rc18-5). This covers the proposal gate, whose `/orbit:apply` today comes from the tracked
  `apply` gate's `ready` branch rather than from the passed review gate (D-rc18-3). It also covers the system gate,
  whose `/orbit:archive` today comes from the all-passed fall-through.
- The passed gate's own row `nextCommand` and the change-level `next_command` come from ONE predicate, so the row and
  the change never name different commands.
- After the walk, the next is the phase command again. When the walk un-passed an earlier slot, the next is the one
  in-context check it now owes, which is rc17a's 2A operating unchanged (D-rc18-4).
- `A reviewed gate lists its outstanding passes` says of `unwalkedPasses` that "The gate never reads it". The sentence
  is qualified: the gate's STATE never reads the field, and the change's canonical next does.
- The charter's exit (2) is revised in `clean-up-review-cycle.md` under R-crc-12's first case. Its wording came from
  the one measured branch (D-rc18-4).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`: `Single-voiced canonical-next computation` gains the passed-frontier-with-unwalked-pass row
  as a decision table over the reviewed states the selection visits (D-rc18-5's DERIVED domain). `A reviewed gate
  lists its outstanding passes` has its "never reads it" sentence qualified, and gains a scenario for the walk the next
  names.

**Size: one capability**, measured at exploration (D-rc18-6).

## Impact

- `src/core/artifact-graph/instruction-loader.ts`: `formatChangeStatus`'s next-selection loop.
- `src/core/artifact-graph/gates.ts`: the passed branch's `nextCommand`, through a shared frontier predicate.
- Tests: gate and status unit tests covering every row of the domain table, including the Case 1 trail shapes (last
  slot walked, earlier slot walked, unpassed unchanged).
- `orbit/architecture/clean-up-review-cycle.md`: exit (2) revised, with the reason recorded.
- No migration and no schema version bump: no gate's state changes, and only `next_command` moves on states that hold
  an unwalked pass.
