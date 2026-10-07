# External Review: rc17c-short-review-next (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-10-07

## CRITICAL

### The review requirement still directs callers to one pass

**File**: orbit/changes/rc17c-short-review-next/specs/orbit-review/spec.md:5  
**Description**: The main SHALL requirement still says a review with findings stores `/orbit:address-reviews <change> --from-file <this emit's own path>`. Its scenario, the proposal, and the owning composition spec require the change-scoped pointer. Replace the old instruction in the main requirement with a reference to the owning composition rule so an implementation cannot preserve the one-pass path.  
**Reproduction**: Construct change `foo` with findings in both `review-proposal-2026-10-07T13-00-00Z.json` and `external-proposal-2026-10-07T13-01-00Z.md`. Implement the main requirement as written and follow the review emit’s stored `--from-file` recommendation. That invocation ingests only the named review file; the external finding is omitted. The intended `/orbit:address-reviews foo` invocation discovers both passes.

## WARNING

### The schema task retains a second pointer rule

**File**: orbit/changes/rc17c-short-review-next/tasks.md:16  
**Description**: The proposal and design say both review-body sites will stop restating the composition rule, but this task tells the implementer to put the short form directly in the schema placeholder. That leaves a second statement that can drift from `orbit-emit-composition`. Make the placeholder refer to the owning requirement, and align the task with the stated decision.

## SUGGESTION

### Correct the delta scenario count

**File**: orbit/changes/rc17c-short-review-next/design.md:126  
**Description**: The design says 35 delta scenarios must be declared. The four MODIFIED blocks contain 36: 11 in `orbit-conventions`, 7 in `orbit-emit-composition`, 9 in `orbit-report-rendering`, and 9 in `orbit-review`. Correct the count so the coverage plan matches the artifacts.

## Blocks

None.

## Direction

**Disposition**: hold

The normative review requirement still gives a caller the one-pass recommendation this change is meant to remove. Resolve that contradiction and align the schema task with the single-owner decision before moving forward.

## Notes

I compared the four MODIFIED blocks with their archived requirements; no baseline scenario names were dropped. I found no `@review:` marker in the proposal artifacts. I could not run `orbit validate` because this checkout has neither `dist` nor `node_modules`.