# External Review: rc06b-map-readers (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-05

## CRITICAL

None.

## WARNING

### An unkeyable-only change is reported as having no delta scenarios
**File**: orbit/changes/rc06b-map-readers/specs/orbit-verify-modifications/spec.md:11
**Description**: The map excludes unkeyable delta scenarios from `scenarios` and puts them in `malformed` with `source: "spec"` (`orbit-scenario-map`, `A declaration is owed by every scenario in the change's delta blocks`). For a change whose sole delta scenario is titled `A :: B`, `scenarios` is empty even though the change has a delta scenario. The required "change has no delta scenarios" note is false and appears beside the unkeyable warning. Say "no keyable delta scenarios" or suppress the note when spec-source malformed entries exist; cover that combination in a reader scenario.

### The ledger-file row requires a location the surface does not return
**File**: orbit/changes/rc06b-map-readers/specs/orbit-verify-modifications/spec.md:16
**Description**: A `malformed` entry with `source: "ledger-file"` contains only `{source, reason}` in the baseline JSON shape. It has neither file and line nor ledger index, yet this row requires one of those locations. Specify the fixed path `orbit/scenario-ledger.yaml` without a line for this source, and give it a separate reader scenario so an implementation can satisfy the table without inventing a location.

### Orphan recommendations require facts absent from the map
**File**: orbit/changes/rc06b-map-readers/specs/orbit-verify-modifications/spec.md:15
**Description**: The `orphans` entry carries only source, location and key. It cannot distinguish a typo from a scenario added by another active change, but the table demands different recommendations for those causes while also saying verify reports what the surface returns. Specify an additional read of active changes and how to resolve competing matches, or use one recommendation that remains true from the map alone. Otherwise two implementations can make opposite claims for the same JSON.

### The closeout grep cannot pass before archive
**File**: orbit/changes/rc06b-map-readers/tasks.md:24
**Description**: Task 5.1 expects no `left intact`, `MUST NOT modify the upstream-authored body`, or `verify itself does not gain` under `orbit/specs/`, but all three are still in the archived baselines this change modifies. Delta specs are synced to `orbit/specs/` at archive, after apply tasks are checked. Move this baseline grep to the archive check, or restrict the pre-archive sweep to source and generated bodies plus this change's deltas; retain the stated CLAUDE.md update for archive.

### The verify emit does not persist the named warning fields
**File**: orbit/changes/rc06b-map-readers/specs/orbit-verify-modifications/spec.md:20
**Description**: This says an uncovered, orphan or malformed finding is "recorded in the verify emit through `fail_mode: \"warnings\"` and `warnings_count`". The current emit surface consumes both as payload fields and deletes them before writing `verify-<TS>.json`; a task-incomplete or scenario-fail run also has a higher-precedence single `fail_mode`. State that isolated pass-with-warnings runs submit those payload values and that the persisted record carries the resulting `next_recommended`; specify where warnings are represented when another fail mode wins. This keeps the reader requirement consistent with the baseline emit contract and engine behavior.

### The new named-edit scenario contradicts its own legacy exception
**File**: orbit/changes/rc06b-map-readers/specs/orbit-conventions/spec.md:20
**Description**: The scenario applies to a named edit in any orbit-modified upstream portion and says "the rest of the upstream portion stays the snapshot". The preceding rule explicitly acknowledges pre-rule edits already present in `orbit-apply-change` and `orbit-archive-change`. A future named edit to either body cannot both preserve those edits and make the rest match the vendored snapshot. Qualify the scenario with the pre-rule exceptions, or scope its snapshot assertion to verify-change's currently pristine upstream portion.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The reader table needs to describe states the map can actually return, and the apply closeout needs a check that can succeed before archive. Clarifying the emit and named-edit language will keep the implementation and later baseline sync aligned with the stated design.

## Notes

I read the proposal, design, tasks, explore record, all three deltas and their affected baselines, the map's JSON contract and implementation, and the verify/review templates. `orbit validate rc06b-map-readers --strict --json` passes with expected pre-apply INFO entries; `orbit fingerprint rc06b-map-readers --check --json` verifies all three touched baselines. No unresolved inline review marker appears in the proposal, design, tasks or delta specs.
