## 1. One predicate, the gate row and the change (D1, D2, exit (1))

- [ ] 1.1 In `src/core/artifact-graph/gates.ts`, add and export the predicate: a `passed` reviewed gate that is the FRONTIER (its `before` names no gate that has passed — the superseded test's negation, on gate ids only) and whose `unwalkedPasses` is non-empty. In `computeGateStates`, after the superseded marking, set such a gate's `nextCommand` to `/orbit:address-reviews <change>`; every other passed gate's row keeps its phase command, and state, reason and every other field are unchanged
- [ ] 1.2 In `formatChangeStatus` (`src/core/artifact-graph/instruction-loader.ts`), call that same predicate on each `passed` gate in the selection loop: when it holds, take the walk with hint keys `{phase: <gate id>}` and no ` — user-invoked` marker, and stop; when it does not, skip the gate as today. Never take a passed gate's command because the row carries one. The system gate's walk is taken by the loop, before the all-passed fall-through
- [ ] 1.3 Tests over every row of the spec's selection table (`test/core/artifact-graph/outstanding-passes.test.ts` or `instruction-loader.test.ts`): ungated; tracked `ready` and `passed`; reviewed `blocked`; superseded skipped; passed frontier with and without unwalked passes; passed not frontier, including a passed `review-proposal` after `apply` passed (the next is never `/orbit:apply`); a `before` naming an artifact or nothing stays frontier; `next_hint_keys` is `{phase: "review-proposal"}` on the proposal walk and `{phase: "review-system"}` on the system walk; the row's `nextCommand` equals the change's `next_command` on every passed frontier gate holding an unwalked pass
- [ ] 1.4 Show the row-equality assertion can fail: make the loop ignore the predicate on the proposal gate, see the test fail naming both commands, then restore it

## 2. The unpassed gate's order (D5, exit (3) as widened)

- [ ] 2.1 In `canonicalNextForReviewed` (`gates.ts`), extend the walk step to fire when `unwalkedPasses` is non-empty as well as when a pass is unresolved, after the `openPair` step and before every slot command; pass the computed unwalked set in rather than recomputing it
- [ ] 2.2 Tests: an `[invoked, in-context]` gate with a SUGGESTION-only fresh pass and no in-context pass names the walk with state and reason unchanged, and names the in-context review once the walk lands; a half-landed pair with a SUGGESTION-only member names the missing member, not the walk; a stale gate holding an unwalked pass names the walk; an unpassed gate holding no unresolved or unwalked pass keeps its slot command (exit (3)'s unchanged branch)
- [ ] 2.3 Run the rc17a oracle shards and the invoked-coverage suite unchanged; any test asserting a review next on a state holding an unwalked pass is updated to the walk, each one listed in the apply emit

## 3. After the walk (D4, exit (2) as revised)

- [ ] 3.1 Test the Case 1 shapes and the ordinary order on synthetic `[invoked, in-context]` trails: the in-context pass unwalked on a passed gate → the walk; walked at its own token → the phase command and `passed`; the ordinary order the fresh proposal pass reproduced (SUGGESTION-only invoked pass → the walk first → the in-context review → `passed`); an off-path walk of the invoked pass after the in-context pass → `unpassed` and the in-context command
- [ ] 3.2 Test a three-slot `[fresh, external, in-context]` cadence: an off-path walk of the SUGGESTION-only fresh pass after the in-context pass names the external review, and an in-context review is still owed once it lands
- [ ] 3.3 Test the walk's own emit: an `address-reviews` emit composed post-write over the last unwalked pass carries the phase command as `next_recommended`
- [ ] 3.4 Add `@scenario` tags for the delta's eight new `Single-voiced canonical-next computation` scenarios on the tests that assert their THENs; `orbit status --change rc18-walk-is-next --scenarios` shows none uncovered

## 4. Pins, charter, suite

- [ ] 4.1 Move the `test/core/rc03b-untouched-modules.test.ts` hashes for `gates.ts` and `instruction-loader.ts`, recording the move in the pin's comment as a planned act of this stage
- [ ] 4.2 In `orbit/architecture/clean-up-review-cycle.md`, revise rc18's exit (2) under R-crc-12's first case to "after that pass is walked, the canonical next is the phase command, or, when an off-path walk un-passed an earlier slot, the review the order names for the slots it uncovered; the gate's state is never changed by the selection", and widen exit (3) to "an unpassed gate holding no unwalked pass keeps its next; one holding an unwalked pass, and no open pair, names the walk before its next review". Add a dated note recording why: D-rc18-1, D-rc18-4, and Sal's A at the proposal walk
- [ ] 4.3 Full `npm test` green; `orbit validate rc18-walk-is-next --strict` clean
- [ ] 4.4 (User-validation — observed on this stage's own review cycle) a review pass on this change that leaves an unwalked SUGGESTION-only pass renders `/orbit:address-reviews rc18-walk-is-next` as the `Ready when you are:` line, and the line moves on once that pass is walked
