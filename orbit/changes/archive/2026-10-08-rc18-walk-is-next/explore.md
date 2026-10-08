> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc18-walk-is-next

## Premise

rc17c's in-context verification passed `review-proposal` carrying three SUGGESTIONs. The gate row listed the pass
under `unwalkedPasses`, but the canonical next read `/orbit:apply`. The engine knew a walk was owed and did not
say so. Sal: "even if there are suggestions, i think the next recommended path should be an address-reviews". The
charter (`clean-up-review-cycle.md`, Stage rc18-walk-is-next) sets the direction: when a reviewed gate has PASSED
and its mode carries an unwalked pass, the single canonical next is `/orbit:address-reviews <change>`. The phase
command returns once the pass is walked. The gate's verdict does not change.

The charter's safety claim rests on one measurement: a walk written after the passed gate's LAST pass leaves the
gate `passed`. This exploration must find out whether that holds for EVERY unwalked pass the new next would send
the user to walk.

## Mechanism

### D-rc18-5 — a passed frontier gate with an unwalked pass names the walk as the change's next
Domain: the reviewed-gate states the change-level next-selection loop visits, in flow order
| member | covered by |
|---|---|
| ungated schema | unchanged: no gates, no next from this rule |
| tracked gate, any state | unchanged: `ready` names apply, `passed` falls through |
| reviewed gate `blocked` | unchanged: carries no `unwalkedPasses` |
| reviewed gate `unpassed` or `stale`, not superseded | unchanged: its own canonical next (exit (3)); its unwalked passes are already discovered by the walk it may name |
| reviewed gate superseded (its `before` gate passed) | unchanged: skipped; its unwalked passes are not recommended, as `orbit-address-reviews`' superseded-gate scenario already says of discovery |
| reviewed gate `passed`, `before` gate not passed (the FRONTIER), `unwalkedPasses` non-empty | `/orbit:address-reviews <change>` (exit (1)); hint keys `{phase: <gate id>}`, the rc08b walk precedent; no ` — user-invoked` marker |
| the same, every unwalked pass stale | the same row: one list, one voice; the walk's pushback suppresses stale findings with evidence |
| reviewed gate `passed`, frontier, `unwalkedPasses` empty | unchanged: the phase command (exit (2), first branch) |
| reviewed gate `passed`, `before` gate passed (not the frontier) | unchanged: the frontier has moved on |
| a walk that un-passed an earlier slot (D-rc18-1, kept by D-rc18-4) | the `unpassed` row: the in-context check is the next (exit (2), second branch) |
Closure: DERIVED — reviewed state (`blocked` / `unpassed` / `stale` / `passed`) × superseded × frontier × unwalked set empty or not; `passed` is never superseded, so its frontier split stands alone; plus the two non-reviewed rows the loop also visits
Moves:
- READ: applied — `formatChangeStatus`'s loop and all-passed fall-through (D-rc18-3), `gates.ts`' converged branch and `unwalkedFor`, the outstanding-passes requirement, and rc17a's 2A record (`address-reviews-2026-10-06T01-20-25Z.json`)
- ENUMERATE: applied — this table; the readers of the result are enumerated under CONSUME
- COHERE: applied — two parts must agree. The outstanding-passes requirement says "The gate never reads it": still true of the gate's STATE, but the change's next now reads it, so that sentence must name which. And the passed gate's row `nextCommand` feeds the all-passed fall-through (the system gate), while the loop decides the proposal gate. Both must come from ONE predicate, or the row and the change name different commands.
- EXECUTE: applied — Case 1 runs the current engine over the frontier-with-unwalked row, the empty row and the un-passed row; the new branch itself cannot run until written
- FALSIFY: applied — the rule never names a superseded proposal gate's SUGGESTION-only pass after apply. Accepted: the phase it reviewed has run, and discovery already treats it the same way.
- CONFORM: applied — `Single-voiced canonical-next computation` (one command, the phase command not co-offered); R-crc-13 and rc02 (the gate's state is untouched, only the recommendation moves); rc17a's 2A (D-rc18-4); no-chaining (the walk is named, never invoked)
- FEASIBILITY: not applied — one predicate over fields the status computation already holds
- CONSUME: applied — every reader renders `next_command` verbatim: `orbit status`'s eligibility line, the `--boot` render, orientation's `next`, and the report tail (with the model hint). The walk's own emit composes `next_recommended` POST-WRITE against its candidate, so exit (2) shows on the walk's record. The archive body reads the gate's state, not the next, so archive stays eligible over an unwalked pass. Apply's blocked-by-gate fires only on `unpassed` or `stale`, so it is unchanged. verify's `systemReviewNext` keeps a review only when the next names one, which the archive next already fails.
- INVOKE: applied — fires on every status computation; nothing new triggers it

### Case 1 — earlier-slot walk on rc17c's system trail (scratch copy)

The `review-system` cadence is `[invoked, in-context]`. The invoked slot is the launched pair: fresh
`14-54-11Z` (0C/0W/3S) and external `14-54-33Z`. The in-context slot is `15-33-53Z`.

| state | gate | next |
|---|---|---|
| as archived | passed | archive |
| in-context walk (`15-34-55Z`) removed | passed, unwalked `15-33-53Z` | archive |
| that walk restored at its own token | passed, none unwalked | archive |
| fresh-half walk (`15-29-22Z`) and the in-context walk removed | passed, unwalked `14-54-11Z`, `15-33-53Z` | archive |
| fresh-half walk re-added at `15-40-00Z` (after the in-context pass) | **unpassed** — "cadence class 'in-context' has no fresh pass" | `/orbit:review --as system` |

## Decisions

- **2026-10-07 — D-rc18-1: walking an earlier-slot pass after the gate passed UN-PASSES the gate** The charter's
  measurement holds only when the unwalked pass is the cadence's LAST pass. When it fills an earlier slot, a
  later walk record raises the next slot's ordering bar above the pass that already filled that slot. The gate
  then falls to `unpassed` and asks for another in-context review. Measured on a scratch copy of rc17c's archived
  trail (Case 1). As written, the charter's direction would turn a SUGGESTION into a review loop, and exit (2)
  would be missed on this branch.
  Kind: fact

- **2026-10-07 — D-rc18-2: every unwalked pass on a PASSED gate is SUGGESTION-only** Derived from the gate code.
  Resolution (clause (b)) runs over every relevant pass, stale ones included, and a pass with any CRITICAL or
  WARNING resolves only when an address-reviews record references it. `unwalkedPasses` lists only passes that no
  record references. So when the gate is `passed`, every pass it lists carries SUGGESTIONs and nothing else
  (`src/core/artifact-graph/gates.ts`: `passResolved`, `unwalkedFor`). The domain the new next ranges over is
  therefore exactly "SUGGESTION-only passes with no walk record".
  Kind: fact

- **2026-10-07 — D-rc18-3: the passed proposal gate does not supply the change's next** In
  `formatChangeStatus` (`src/core/artifact-graph/instruction-loader.ts`), the change-level `next_command` comes
  from the first gate that is neither passed nor superseded, in flow order. A passed `review-proposal` is
  skipped, and `/orbit:apply` comes from the tracked `apply` gate's `ready` branch. Changing only the passed
  gate's own `nextCommand` (`nextAfterPass` in `gates.ts`) would therefore fix the system gate, through the
  all-passed fall-through, and leave the proposal gate, the case that motivated the stage, unchanged. The
  selection loop is where the rule lives.
  Kind: fact

- **2026-10-07 — D-rc18-4: keep rc17a's walk rule; revise exit (2) to name the check the walk can owe** Sal: "c,
  keep the rc17a rule". A walk at any severity still raises the following slot's ordering bar, which Sal ratified
  at rc17a's proposal walk (2A, 2026-10-05). So walking a SUGGESTION-only pass that fills an earlier slot, after
  the gate passed, un-passes the gate and the next is one in-context check. The extra review is BOUNDED: that
  check fills the last slot, and walking the last pass cannot un-pass anything (Case 1, first two rows). Exit
  (2), as written, came from the one measured case. Under R-crc-12's first case it is revised to: after the
  pass is walked, the canonical next is the phase command, or, when the walk un-passed an earlier slot, the
  in-context check it now owes.
  Kind: scope

- **2026-10-07 — D-rc18-5: a passed frontier gate with an unwalked pass names the walk as the change's next** In
  the change-level next selection, a reviewed gate that is `passed`, whose `before` gate is not passed, and whose
  `unwalkedPasses` is non-empty yields `/orbit:address-reviews <change>` before any later gate or the all-passed
  fall-through is read. Its state is unchanged.
  Kind: rule

- **2026-10-07 — D-rc18-6: the stage touches ONE capability, `orbit-engine-gates`** Measured by grep over
  `orbit/specs` for every statement of the change's next after a pass, and every reader of `unwalkedPasses`.
  Three things in `orbit-engine-gates` change: `Single-voiced canonical-next computation` gains D-rc18-5's row;
  `A reviewed gate lists its outstanding passes` qualifies "The gate never reads it" to the gate's STATE; and the
  walk-after-confirm scenario stays as written. Statements that stay true: `orbit-address-reviews`' discovery
  scenario (the walk holds nothing on the gate and raises the bar, as before) and its superseded-gate scenario;
  `orbit-orientation`'s `next` (renders the engine's `next_command`, its archive command an example); and the run-summary
  and apply-body next lines (read the engine). The charter's exit (2) revision is an edit to the architecture
  doc, not a capability.
  Kind: fact

## Open questions

## Considered & out

- **2026-10-07 — a SUGGESTION-only walk does not raise the next slot's bar (option A)** — out: it reverses
  rc17a's 2A, which Sal ratified over exactly this narrowing. Sal kept 2A (D-rc18-4).
- **2026-10-07 — name the walk only when it cannot un-pass the gate (option B)** — out: it leaves
  earlier-slot SUGGESTION passes silent, the hole Sal named.
- **2026-10-07 — offer the walk and the phase command on two lines** — out per the charter: it reverses
  `Single-voiced canonical-next computation`, which is Sal's to take.

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc18-walk-is-next (charter, exits (1)–(3))
- `orbit/specs/orbit-engine-gates/spec.md` — clause (a)'s two ordering constraints ("CHECK ON THE WALK", ~L242–247); `Single-voiced canonical-next computation` (~L675)
- `orbit/specs/orbit-address-reviews/spec.md:91` — "like any walk it raises the following cadence slot's ordering bar"
- `src/core/artifact-graph/gates.ts` — `nextAfterPass`, `unwalkedFor`, `canonicalNextForReviewed`, the coverage DFS's `nextBound`
- `src/core/artifact-graph/instruction-loader.ts` — `formatChangeStatus`'s next-selection loop and all-passed fall-through
- `orbit/changes/archive/2026-10-07-rc17c-short-review-next/.orbit-runs/` — the trail the cases were measured on
