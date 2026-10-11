## Why

Orbit's purpose is that AIs do the development work and humans are told what is going on. The archive seam is the last point where the human hears what is true about a change before it ships, and it is silent in two places where it should speak (see explore.md, Premise and Case 2):

- **User-validation tasks archive unread.** Five changes (d6, rc02, bounded-closure, rc13c, rc15) archived with an unchecked user-validation task. None recorded when or where the validation would happen. Every one of them could only be observed after the change shipped. The archive's only check is upstream Step 3's generic "N tasks incomplete, proceed?", which cannot tell a validation handoff from unfinished code and records nothing. Since rc02b every such task has closed at archive by observation, but that rests on a habit; nothing checks it.
- **The gate prompt watches one gate.** Step 3.4 reads only `review-system`. rc03a and rc13 archived past an exhausted `review-proposal` with no prompt, because `review-system` read `blocked` and `blocked` is neither `unpassed` nor `stale`. A change that never applied still archives past its proposal gate, and no decision is recorded.

## What Changes

- **The archive gate prompt reads every reviewed gate that has not passed and is not superseded**, in one prompt: `unpassed` and `stale` gates with their reasons, and a `blocked` gate with the reason that names what blocks it. `independentSpend` MAY be shown and is never branched on. Each gate the user proceeds past gets its own `continuation` entry in the archive emit's `judgements`. A superseded gate (its `before` gate passed) stays silent: that decision belonged to the earlier seam.
- **Each unchecked user-validation task is OBSERVED or DEFERRED at a new Step 3.2, before the move.** OBSERVED: the AI checks the box with a one-line evidence note. DEFERRED: the validation was not observed here, either because it can only happen after the change ships or because it could have happened and did not. The archive emit carries a `deferred_validations` entry `{task, why, when, where}` for it. The two dispositions partition the marked tasks by whether the box ends checked. The seam briefs the human on each one, with its `why`, before the move, and the completion readout prints every deferral. Bulk archive runs the same step per change, and its own task count stops counting the marked tasks.
- **The archive write gate checks deferral presence.** `orbit emit archive` reads the archived tasks file and refuses an emit that leaves any unchecked `(User-validation` task without a deferral. It also refuses a marked task with no id or outside every `## ` group, a deferral naming a checked task, an unmarked task or no task, and one whose `why`, `when` or `where` is empty. The refusals are stated once, as a fenced production; Step 3.2 checks a mirror of it before the move, so a predictable refusal surfaces while the change is still active; a refusal after the move is repaired by re-running the emit, never the sync or the move. The engine checks the id set and never the reasoning (R-crc-10).
- **Upstream Step 3's incomplete-tasks prompt stops counting user-validation tasks**, which the new seam step owns. The edit to the upstream portion is named here, per `orbit-conventions`' `Generated-file disposition`.
- **Exit (2) is revised at exploration**, recorded in explore.md D-rc10-5. "The next stage's dogfood runs before its archive" cannot be met by a validation that can only happen after shipping, without never archiving. Revised exit: the next archive that carries a user-validation task either closes it by observation or writes a deferral that the write gate accepted.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-engine-gates`: `Inflection-prompt override contract` gains the archive seam's gate set. At archive, the last seam, the prompt reads every reviewed gate that has not passed and is not superseded, whatever that gate's `before`.
- `orbit-archive-modifications`:
  - ADDED: `User-validation closure at the archive seam`, which owns the disposition rule, the `deferred_validations` record and its write-gate check, the pre-move check, the Step 3 edit, bulk archive's per-change step, and the named limit for an uncited change.
  - MODIFIED: `Archive run summary written`, so the continuation record covers every gate proceeded past.
  - MODIFIED: `Archive summary schema reference ships with the skill`, which documents `deferred_validations`.

## Impact

- `src/core/templates/workflows/archive-change.ts`: the archive body (Step 3's exclusion, Step 3.4 widened, a new user-validation step, the readout line) and the archive schema reference.
- `src/core/templates/workflows/bulk-archive-change.ts`: Step 3.2 per change, before that change's sync and move.
- `src/core/emit-composition.ts`: the `deferred_validations` payload field and its write-gate check, which reads the archived `tasks.md` through `parseCheckboxes`, the reader the apply emit's `user_validation_tasks` check already uses.
- `src/core/artifact-graph/gates.ts`: no diff. Gate state and its computation are unchanged; the archive body reads the existing `gates[]` rows.
- Tests: emit-composition, the archive body surface, the reference round trip, and scenario declarations for every scenario in the carried blocks.
- No schema version change, no config change, no CLI change.
