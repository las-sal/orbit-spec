# External Review: rc10-apply-closure (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### OBSERVED and FORWARD do not cover a skipped validation
**File**: orbit/changes/rc10-apply-closure/specs/orbit-archive-modifications/spec.md:7
**Description**: The requirement assigns every unchecked marked task exactly one disposition, but the dispositions are not exhaustive. For example, `- [ ] 5.3 (User-validation) Ask the user to exercise the implemented preview before archive` can remain unchecked even though the validation could already have happened. It is neither OBSERVED nor FORWARD, whose definition requires that validation can happen only after shipping. Step 3 now excludes this task from its warning, so an implementation must invent behavior or falsely label it FORWARD. Specify how the seam handles an available-but-unperformed validation: perform it when possible, or explicitly report and record its postponement under a disposition that permits this case. Add a scenario covering it.

### The selected parser cannot enforce the stated task domain
**File**: orbit/changes/rc10-apply-closure/design.md:43
**Description**: The accepted parser limitation contradicts the universal closure and refusal requirements. With `# Tasks` followed by `- [ ] 4.4 (User-validation) Observe the next deployment`, and no preceding `## ` group, `parseCheckboxes` returns no tasks. The proposed write gate therefore accepts an omitted deferral even though the requirement says every unchecked marked task must have one. Conversely, the workflow can compose a deferral for that visible task and the parser will treat it as naming no task. Absence of historical examples does not resolve this implementation divergence. Define one supported task domain for both the seam and the write gate, and either recognize these lines or explicitly reject unsupported task layout before the move. Cover this case in verification.

### A predictable write-gate refusal occurs after the active change is gone
**File**: orbit/changes/rc10-apply-closure/specs/orbit-archive-modifications/spec.md:22
**Description**: A marked unchecked task without a parseable id must be refused, but the only specified enforcement happens after sync and the Step 5 move. For `- [ ] (User-validation) Observe the next deployment` under a valid group, the seam cannot compose a keyed FORWARD entry; following the prescribed order still moves the change and then refuses its archive emit. The active change is gone, the summary is absent, and no recovery behavior is specified. Add a pre-move check for predictable task/deferral errors and instructions to repair them. Also specify recovery for a post-move emit refusal, including how to retry against the archived directory without repeating sync or move.

### Bulk archive has no concrete integration for the new closure contract
**File**: orbit/changes/rc10-apply-closure/design.md:58
**Description**: The touchpoints and tasks update only `archive-change.ts`, although bulk archive produces per-change archive emits subject to the new write gate. Its existing body independently counts tasks, syncs and moves changes in Step 8, and prints a batch summary; its wrapper description does not explicitly route execution through the single-change workflow. An implementation following this task list can leave bulk archive moving a change with an unchecked validation and then failing its emit for lack of `deferred_validations`, without the promised pre-move brief or deferral readout. Specify whether bulk archive delegates each change through the new seam or implements equivalent per-change handling, and add the corresponding touchpoint, task and scenario. If bulk archive is intentionally excluded, state that exclusion and reconcile it with the command-wide write gate.

## SUGGESTION

### Exploration still describes superseded mechanism as live
**File**: orbit/changes/rc10-apply-closure/explore.md:24
**Description**: D-rc10-1 still sends marked-but-undeclared tasks to unchanged Step 3 and says the seam reads `userValidationPending`; design D3 instead assigns every marked task to the seam and excludes all of them from Step 3. D-rc10-3 also calls the write-gate reader the tracked gate's reader, while design D4 deliberately selects a different reader. Update these mechanism entries or clearly mark their superseded portions and point to the revised decisions, so implementers do not encounter competing live instructions.

## Blocks

None.

## Direction

**Disposition**: hold

The gate-set widening is coherent, and the modified requirement blocks preserve their baseline scenarios. The validation closure needs a complete disposition rule and a consistent task domain before implementation. The archive paths also need explicit handling for failures after the move and for bulk execution, so the promised record remains dependable across entry points.

## Notes

I compared all delta requirement blocks with their archived baselines, inspected the task parser, gate evaluator, emit validation, single-change archive template and bulk-archive template, and scanned the change for inline review markers.

Strict validation could not execute: `node bin/orbit.js validate rc10-apply-closure --strict` failed to load the absent `dist/cli/index.js`. The read-only environment prevented building the CLI. This establishes neither a validation pass nor an artifact validation failure.