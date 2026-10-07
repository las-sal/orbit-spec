## 1. One predicate, the gate row and the change (D1, D2, exit (1))

- [ ] 1.1 In `src/core/artifact-graph/gates.ts`, add the frontier predicate: a reviewed gate is the frontier while its `before` gate has not passed (the superseded test's negation). In `computeGateStates`, after the superseded marking, set a `passed` frontier reviewed gate's `nextCommand` to `/orbit:address-reviews <change>` when its `unwalkedPasses` is non-empty; its state, reason and every other field are unchanged
- [ ] 1.2 In `formatChangeStatus` (`src/core/artifact-graph/instruction-loader.ts`), let the selection loop take that command from a `passed` gate before skipping it, with hint keys `{phase: <gate id>}` and no ` — user-invoked` marker; confirm the all-passed fall-through yields the walk for the system gate through the row with no change of its own
- [ ] 1.3 Tests over every row of the spec's selection table (`test/core/artifact-graph/outstanding-passes.test.ts` or `instruction-loader.test.ts`): ungated; tracked `ready` and `passed`; reviewed `blocked`; `unpassed` and `stale` unchanged (exit (3)); superseded skipped; passed frontier with and without unwalked passes; passed not frontier; the row's `nextCommand` equal to the change's `next_command` on every passed frontier state
- [ ] 1.4 Show the row-equality assertion can fail: make the loop ignore the row on the proposal gate, see the test fail naming both commands, then restore it

## 2. After the walk (D4, exit (2) as revised)

- [ ] 2.1 Test the Case 1 shapes on a synthetic `[invoked, in-context]` trail: the in-context pass unwalked → the walk; walked at its own token → the phase command and `passed`; a SUGGESTION-only invoked pass walked after the in-context pass → `unpassed` and the in-context command
- [ ] 2.2 Test the walk's own emit: an `address-reviews` emit composed post-write over the last unwalked pass carries the phase command as `next_recommended`
- [ ] 2.3 Add `@scenario` tags for the five new `Single-voiced canonical-next computation` scenarios on the tests that assert their THENs; `orbit status --change rc18-walk-is-next --scenarios` shows none uncovered

## 3. Pins, charter, suite

- [ ] 3.1 Move the `test/core/rc03b-untouched-modules.test.ts` hashes for `gates.ts` and `instruction-loader.ts`, recording the move in the pin's comment as a planned act of this stage
- [ ] 3.2 In `orbit/architecture/clean-up-review-cycle.md`, revise rc18's exit (2) under R-crc-12's first case to "after that pass is walked, the canonical next is the phase command, or the in-context check the walk owes when it un-passed an earlier slot; the gate's state is never changed by the selection", and add a dated note recording why (D-rc18-1, D-rc18-4)
- [ ] 3.3 Full `npm test` green; `orbit validate rc18-walk-is-next --strict` clean
- [ ] 3.4 (User-validation — observed on this stage's own review cycle) a review pass on this change that passes its gate carrying only SUGGESTIONs renders `/orbit:address-reviews rc18-walk-is-next` as the `Ready when you are:` line, and the line returns to the phase command once that pass is walked
