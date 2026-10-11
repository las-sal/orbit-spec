> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc10-apply-closure

## Premise
The charter (clean-up-review-cycle, Stage rc10-apply-closure) carries two defects and four riders.

1. **User-validation tasks are a deferred annotation, not a pre-archive condition.** D6's dogfood (6.3)
   archived unchecked with no record of when or where it would run. Exit (1): an archive with an
   unchecked user-validation task records a reasoned deferral or halts. Exit (2): the next stage's
   dogfood runs before its archive.
2. **The archive seam's gate prompt is scoped to one gate.** Step 3.4 reads only `review-system`; rc03a
   and rc13 archived past an exhausted `review-proposal` with no prompt because `review-system` read
   `blocked`. Amended 2026-09-21: fire on any gate whose state is `unpassed` or `stale`, whatever its
   `before`; `independentSpend` MAY be shown, never branched on. Exit (3): an archive past a
   non-passing gate of ANY phase fires the prompt and records the decision.

Riders handed in: (R1) the external-first canonical next for an empty pair slot, take or leave
(D-rc03-7); (R2) the archive's stop on an undeclared delta scenario (D-rc06b-8); (R3) the close-out half
of the 2026-09-14 delta-scope report — a task cannot assert post-sync baseline state; (R4) the charter's
"apply emit points at the scenario map" names a record that will never exist (D-rc06-3) — decide
whether the pre-archive condition reads `orbit status --change <name> --scenarios` directly.

## Mechanism
### D-rc10-1 — an unchecked user-validation task at the archive seam is OBSERVED or FORWARD, never silent
Domain: every unchecked task carrying the `(User-validation` marker when archive reaches its task check
| member | covered by |
|---|---|
| declared + marked, all remaining (apply gate `passed` with `userValidationPending`) | the seam reads the engine's `userValidationPending` list and takes a disposition per id |
| marked but undeclared, or mixed with ordinary unchecked tasks (apply gate `ready`) | upstream Step 3's incomplete-tasks prompt, unchanged; the gate honestly reads `ready` |
| disposition OBSERVED — the validation happened before the seam | the AI checks the box with a one-line evidence note (the practice since rc02b, now stated) |
| disposition FORWARD — observable only after the change ships | a deferral record (D-rc10-3) |
Closure: DERIVED — the tracked gate's two non-blocked states partition the unchecked set (the subset rule is all-or-nothing), and the two dispositions partition by whether the event can precede the archive
Moves:
- READ: applied — `gates.ts:885-920` (subset rule, all-or-nothing, recomputed from disk); `orbit-engine-gates`' `Tracked-gate pass condition`; archive Step 3 counts every `- [ ]` generically (Case 1)
- ENUMERATE: applied — this table; the measured record (Case 2) has members in both disposition rows and none outside them
- COHERE: applied — Step 3's generic prompt would ALSO fire on the pending ids; the seam step owns them and Step 3 excludes the engine's `userValidationPending` ids, a named edit to an upstream portion under `Generated-file disposition`
- EXECUTE: not applied — no code yet; to execute at propose against a fixture with a passed-for-flow apply gate
- FALSIFY: applied — a FORWARD label could hide a task that was simply skipped; the deferral's `when`/`where` slots are prose, so this is a RECORD the human reads at the seam and the readout (R-crc-10), not a check of honesty
- CONFORM: applied — R-crc-13 (the seam reports; halting is the human's Abort, never a hard block); R-crc-10 (the id set is engine-observed and checkable, the reasons are records); orbit's purpose: the AI does the work, the human is told what is true
- FEASIBILITY: not applied — one status read and one prompt
- CONSUME: applied — the deferral record is consumed by the completion readout (human) and, for a cited stage, by the architect's ratification offer, which already grades exit criteria (rc15 5.3 WAS exit (1))
- INVOKE: applied — fires at archive's task check, every archive; the engine computes the list, so nothing depends on the AI remembering the habit

### Case 1 — archive's task check today
Upstream Step 3 counts `- [ ]` vs `- [x]` and asks "proceed?" on any incomplete task. It cannot tell a user-validation handoff from unfinished code work, and records nothing about the answer.

### Case 2 — how every archived user-validation task ended (measured 2026-10-11)
Archived unchecked, all five FORWARD by their own wording: d6 6.3 ("once main carries this work"), rc02 7.3–7.5 (an issue close; "one full system cadence … under the shipped rules"), bounded-closure 6.1 ("the NEXT stage explored"), rc13c 4.4 ("the next `/orbit:propose` … after this change ships"), rc15 5.3 ("in the next architect session"). Since rc02b (2026-10-03) every one closed at archive by observation. rc03a and rc13 (withdrawn, never applied) are outside the domain: their apply gate read `ready`.

### D-rc10-2 — the archive seam's gate prompt reads every non-passing FRONTIER gate, in ONE prompt
Domain: every gate state, per gate, at the archive seam (spec-driven v5: `review-proposal`, `apply`, `review-system`)
| member | covered by |
|---|---|
| reviewed `passed` | silent |
| reviewed `unpassed` or `stale`, NOT superseded | LISTED in the one prompt with its reason; `independentSpend` shown, never branched on |
| reviewed `unpassed` or `stale`, superseded (its `before` gate passed) | silent: the decision belonged to that phase's seam and is on the trail |
| reviewed `blocked` | listed with its reason, which names the blocking gate |
| tracked `passed` (incl. passed-for-flow) | silent at the gate prompt; pending ids are D-rc10-1's |
| tracked `ready` | upstream Step 3's incomplete-tasks prompt |
Closure: SOURCED — `GateState` in `gates.ts` is the closed union `blocked \| ready \| passed \| stale \| unpassed`; the reviewed evaluator never yields `ready`, and the tracked one yields only `blocked`, `ready`, `passed`
Moves:
- READ: applied — `gates.ts:25` (the union), `:935-943` (superseded = `before` gate passed, gate ids only), `:1009-1105` (reviewed yields passed/stale/unpassed, blocked upstream of it); archive Step 3.4 reads only `review-system`
- ENUMERATE: applied — this table; rc03a/rc13's shape (review-proposal unpassed and NOT superseded, apply `ready`, review-system `blocked`) lands in rows 2, 4 and 6
- COHERE: applied — ONE prompt, one decision, many facts; a `continuation` entry per listed gate, so the record keeps one gate per entry
- EXECUTE: not applied — to run at propose against rc03a's archived trail
- FALSIFY: applied — excluding superseded gates could hide an apply-seam proceed that was never recorded; pre-rc04c trails carry it as `gate_overridden`, so the claim holds only for trails the apply body wrote under a recording contract (a named limit)
- CONFORM: applied — the 2026-09-21 amendment (unpassed or stale, spend shown, never branched on); R-crc-13; R-crc-14 (`orbit-engine-gates`' `Inflection-prompt override contract` owns which gates speak; archive points at it)
- FEASIBILITY: applied — `validateJudgements` takes `gate` as any non-empty string (`emit-composition.ts:1300-1305`), so N continuation entries need no engine change
- CONSUME: applied — the archive emit's `judgements` array already admits `continuation` and `readiness` together
- INVOKE: applied — fires at archive's existing Step 3.4 position, every archive

### D-rc10-3 — a FORWARD deferral is a record the archive write gate CHECKS for presence
Domain: every unchecked `(User-validation` task in the archived `tasks.md` when `orbit emit archive` runs
| member | covered by |
|---|---|
| the id has a deferral entry naming `task`, `when`, `where` | accepted; printed in the completion readout |
| the id has none | refused, naming the id |
| a deferral names a CHECKED task, or no task | refused (the apply emit's `user_validation_tasks` precedent) |
Closure: DERIVED — the set is computed by the engine from the archived `tasks.md`, the same reader the tracked gate uses; the record keys exactly that set
Moves:
- READ: applied — `emit-composition.ts:1426-1437` refuses a `user_validation_tasks` id that is checked or absent; archive emits resolve an `archived` scope (`:786`)
- ENUMERATE: applied — this table
- COHERE: applied — presence is checked and content is not: `when`/`where` are prose (R-crc-10); the engine checks the id set, never the reasoning
- EXECUTE: not applied — to run at propose: does the archive write gate read the MOVED `tasks.md`? (Case 3)
- FALSIFY: applied — a deferral with no reader after archive is D6 written neatly; the reader for a cited stage is ratification, and for an uncited change only the readout (a named residual, Open question Q-rc10-2)
- CONFORM: applied — R-crc-10 (mechanize what the engine observes — the id set); R-crc-14 (the field's owner is the emit layer's archive table)
- FEASIBILITY: not applied — one list per archive, usually empty
- CONSUME: applied — the completion readout prints each deferral; the architect readout's ratification offer grades the stage exit that carries it
- INVOKE: applied — every archive emit; refusal makes it impossible to forget

### Case 3 — what propose must execute
(1) A fixture whose apply gate is passed-for-flow: confirm Step 3 and the new seam step do not both ask. (2) rc03a's archived trail through the widened prompt: which rows fire. (3) `orbit emit archive` after the move: confirm the write gate can read the archived `tasks.md`.

## Decisions
- **2026-10-11 — D-rc10-0: the stage's test is orbit's purpose — AIs develop, humans are informed** (Sal, this session). Every seam behaviour here REPORTS what is true and RECORDS what was decided; halting is the human's choice from a prompt, never a block (R-crc-13 applied to this stage).
  Kind: scope
- **2026-10-11 — D-rc10-1: an unchecked user-validation task at the archive seam is OBSERVED or FORWARD, never silent** (Sal: "push this forward with your recommendation"). OBSERVED: the AI checks it with an evidence note. FORWARD (observable only after shipping — a merge, the next stage, the next session): a deferral record. A task asserting post-sync baseline state is FORWARD by construction (rider R3 folded in).
  Kind: rule
- **2026-10-11 — D-rc10-2: the archive gate prompt reads every non-passing frontier gate, in one prompt** (Sal, same). Every reviewed gate `unpassed`/`stale` and not superseded, plus a `blocked` one with its reason; one `continuation` entry per listed gate; `independentSpend` shown, never branched on. Closes rc03a/rc13's shape.
  Kind: rule
- **2026-10-11 — D-rc10-3: a FORWARD deferral is a record the archive write gate checks for presence** (Sal, same). One entry per unchecked user-validation task (`task`, `when`, `where`); the id set is checked, the prose is not.
  Kind: rule
- **2026-10-11 — D-rc10-4: forward validations mostly ARE stage exit criteria, and ratification already reads them** — the measured record: all five archived-unchecked tasks were forward by their own wording; none since rc02b; rc15 5.3 was literally exit (1).
  Kind: fact
- **2026-10-11 — D-rc10-5: exit (2) is revised at exploration** (Sal, same). "The next stage's dogfood runs before its archive" cannot be met by a forward validation without never archiving. Revised: the next archive carrying a user-validation task either closes it by observation or writes a deferral the write gate accepted. R-crc-12's first case, taken before the test rather than after.
  Kind: scope
- **2026-10-11 — D-rc10-6: riders R1 and R4 are not carried** (Sal, same). R1 (external-first canonical next) is ergonomic only and adds an engine-gates sentence unrelated to the seam. R4: the apply emit never points at the map; a deferral keys a TASK, the scenario ledger keys a SCENARIO.
  Kind: scope
- **2026-10-11 — D-rc10-7: capability count — declare one over rather than split** (Sal at propose: "take the recs", Q-rc10-1 resolved). The two halves share one seam and one prompt; if the size record reads four capabilities, the proposal's `## Size` section declares it.
  Kind: scope
- **2026-10-11 — D-rc10-8: an uncited change's FORWARD deferral has no post-archive reader in this stage** (Sal at propose, Q-rc10-2 resolved). Stated as a named limit in the deferral requirement's text; a post-archive reader (orientation's WAITING band) is a later stage's.
  Kind: scope
- **2026-10-11 — D-rc10-9: rider R2 (the archive's stop on an undeclared delta scenario, D-rc06b-8) is not carried** (Sal at propose, Q-rc10-3 resolved). Archive runs no `orbit validate` today, so it would add a step, not a line; the scenario map already reports the scenario at ERROR after apply.
  Kind: scope

## Open questions

## Considered & out
- **2026-10-11 — HALT on any unchecked user-validation task** (the charter's "or halts"): out — a forward validation would mean never archiving; halting stays the human's Abort.
- **2026-10-11 — move forward validations out of `tasks.md` at propose**: out — it touches `orbit-propose-modifications` for a class the seam can classify; the deferral record makes the task honest where it already lives.
- **2026-10-11 — deferrals as readiness `accepted` pairs**: out — a readiness entry is written only when the archive concludes a review cadence, and its pairs key nothing the engine can check.

## References
- `orbit/architecture/clean-up-review-cycle.md` — Stage rc10-apply-closure (charter, 2026-09-15 addition, 2026-09-21 amendment, two riders); status-log entries 2026-09-15 (seam watches one gate) and 2026-09-14 (delta-scope report).
- `src/core/templates/workflows/archive-change.ts` — upstream Step 3 (task check) and NEW Step 3.4 (review-system-only gate prompt).
- `src/core/artifact-graph/gates.ts:885-920` — the tracked gate's user-validation subset rule (passed-for-flow, `userValidationPending`).
- `src/core/emit-composition.ts:1426-1537` — the apply emit's `user_validation_tasks` verification.
- `orbit/changes/archive/2026-10-05-rc06b-map-readers/explore.md` — D-rc06b-8 (the undeclared-scenario stop handed here).
