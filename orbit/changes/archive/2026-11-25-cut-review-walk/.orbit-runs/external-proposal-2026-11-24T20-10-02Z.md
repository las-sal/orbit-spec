# External Review: cut-review-walk (iteration 1)

**Reviewer**: GPT-6 Codex  
**Date**: 2026-11-24

## CRITICAL

None.

## WARNING

### Ripple-miss attribution is routed after triage
**File**: orbit/changes/cut-review-walk/proposal.md:18  
**Description**: The proposal loads ripple-miss attribution when an entry resolves. The lifecycle and the archived `A ripple miss is attributed by the walk that finds it` requirement call for attribution at triage, before the walk changes the files. A literal implementation can miss the attribution entirely or judge the earlier sweep against a tree the current walk has already changed. Add a Step 2 read cue for change-scoped walks and retain the Step 3d.5 cue for composing the sweep and recording the attribution on resolved entries.

### The source-by-source loop loses its scheduling instruction
**File**: orbit/changes/cut-review-walk/design.md:56  
**Description**: M10 removes the per-source paragraph from the body and routes to its replacement before the first emit. That paragraph tells the walker to emit the first source’s log before starting the second. Step 5 is the report, and Step 6 is persistence, so a walker following those steps in order can finish both sources before learning that it owes the first log. A converged finding in the second source then lacks the first log’s token, and an interruption can leave a completed source unrecorded. Keep the source boundary and emit trigger in the body or require the triage reference to establish the loop before the first finding. Make task 3.3 verify that ordering with the converged-finding and interrupted-walk scenarios.

### Retired trigger handling leaves discovery inputs ambiguous
**File**: orbit/changes/cut-review-walk/specs/orbit-address-reviews/spec.md:177  
**Description**: The new rule promises a notice and a normal walk for an invocation containing `--batch` or a verbal trigger. The discovery fence has no rule for removing either from positional input, and task 2.2 deletes the trigger table that defined the verbal forms. For `/orbit:address-reviews foo --batch`, an implementation could reject the flag or use `foo --batch` as the scope and skip `foo`’s outstanding passes. Specify how Step 1 strips the retired flag before resolving scope, define the verbal forms that get the notice, and state how the former mid-walk switch interacts with the surviving delegation directive.

### The removal checklist misses live schema instructions and examples
**File**: orbit/changes/cut-review-walk/tasks.md:8  
**Description**: The schema reference has more than the two field rows and the executable batch payload. It also lists the retired fields in its opening inventory and v2 compatibility prose, permits `"batch"` in the schema, and shows a separate verbal-batch snippet in `src/core/templates/workflows/address-reviews.ts:990`. The external-return fixture at line 730 still describes a repair after the retired disagreement test, even if task 2.3 removes its `disagreement` object. Explicitly cover all of those sites. Keep any historical explanation confined to reading old logs and make the live examples show only behavior the new workflow can produce.

### The cut ledger cannot reliably identify the bytes it must restore
**File**: orbit/changes/cut-review-walk/design.md:154  
**Description**: The `moved` row records only the first line of the moved text. That provides no end boundary when a partial block is inserted into an existing reference, as M5 does in `resolution-detail.md`. Checking bytes extracted from the destination against that same destination also cannot independently identify the changed pair as the delta’s mutation scenario requires. Record a uniquely bounded span and its pre-move digest for each move. For M10 and the shared chain paragraph, whose destination already contains the text, specify how the ledger selects the existing span and restores the body without appending a duplicate.

### The body and emitter have different guarantees for new logs
**File**: orbit/changes/cut-review-walk/specs/orbit-address-reviews/spec.md:179  
**Description**: The spec requires `"per_finding"` on new logs, and the log-shape requirement says the walk writes no `disagreement`. The proposed engine change only removes the two retired top-level keys from the allowlist. A direct caller can still submit `walk_mode: "batch"` without those keys, and the proposed change adds no check for a nested `disagreement`. State explicitly whether these restrictions govern skill-generated payloads or every new emit. If they govern every emit, specify the write checks and exercise them while preserving reads of old logs.

### Two reference read cues need an explicit call site
**File**: orbit/changes/cut-review-walk/design.md:129  
**Description**: The fresh-dispatch route is described in terms of the selected reviewer, but the selector is also visible to the dispatched worker, which must skip dispatch. The chain-tag pointer is at the closing step, while a chained session may encounter a tagged prompt earlier. Put the fresh-dispatch read inside the invoking session’s dispatch branch, including the blind-pair path, and state that a chained session reads the tag guidance before acting on its first tagged prompt when the guidance is absent from context.

## SUGGESTION

### Retired batch vocabulary still labels the surviving delegation
**File**: orbit/changes/cut-review-walk/specs/orbit-address-reviews/spec.md:270  
**Description**: The revised scenario still says “Batch delegation compresses the lane; batch prompts never fire,” and the template labels the surviving directive “Batch DELEGATION.” Rename both to mid-walk delegation so the preserved behavior has a consistent name after batch mode is removed.

### Two design references disagree with their source
**File**: orbit/changes/cut-review-walk/design.md:74  
**Description**: The design cites the stage’s third exit criterion, but the stage in `orbit/architecture/reduce-orbit-phase2.md:218` lists two bullets. D6 also says “Four sentences in three owners” while enumerating five placements. Point to the actual shared-step decision and describe D6 by the affected requirements.

### The evidence breakdown leaves eight logs unexplained
**File**: orbit/architecture/reduce-orbit-phase2.md:122  
**Description**: The ruling cites 476 logs but accounts for 438 per-finding and 30 legacy logs, with zero batch logs. Account for the remaining eight or label the category counts as partial so the reader can tell which logs support the absence claim.

## Blocks

None.

## Direction

**Disposition**: hold

The two bodies can be shortened by moving procedure into references. The proposal needs to preserve the points at which the walker makes decisions and persists evidence. Ripple attribution must be available at triage, and each source’s log must exist before work on the next source starts. The compatibility rules and ledger checks also need enough detail for the implementation and its tests to agree.

## Notes

`orbit validate cut-review-walk --type change --strict` passed. The `@review:` matches in the delta specs describe marker syntax and discovery behavior. I found no unresolved inline review marker in the proposal artifacts.

The workspace is read-only. I could not save, commit, or push the findings. The intended file is `orbit/changes/cut-review-walk/.orbit-runs/external-proposal-2026-11-24T20-00-26Z.md`.