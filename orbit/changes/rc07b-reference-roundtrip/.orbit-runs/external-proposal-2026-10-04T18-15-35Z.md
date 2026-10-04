# External Review: rc07b-reference-roundtrip (iteration 1)

**Reviewer**: GPT-6 Astra
**Date**: 2026-10-04

## CRITICAL

None.

## WARNING

### The change-mode review example cannot execute `verification` under the prescribed seeding rule
**File**: orbit/changes/rc07b-reference-roundtrip/design.md:24
**Description**: The first review schema block documents the top-level AI-supplied `verification` field, and the new requirement says its examples must jointly execute every such field. Task 3.1 requests one `json example change` block. Design D3 gives each example a fresh trail and seeds only tokens named in `formed_against`; a review payload has no such field. The gate therefore computes REVIEW genre and refuses `verification` even when it is `[]`. Omitting it fails the proposed key-coverage assertion, while including it fails the write gate. Specify a separate verification example and the resolved-walk trail fixture that makes it VERIFICATION genre, then test both genres.

### The example-key equality contradicts the mandatory `model` key
**File**: orbit/changes/rc07b-reference-roundtrip/specs/orbit-emit-composition/spec.md:5
**Description**: This requirement mandates `model` in every example but also says the union of example keys equals schema-block keys minus the field-set test's engine-owned list. That list currently contains `model`, while the five schema references omit it from their full-record blocks. An example accepted by `composeAndWriteEmit` must therefore have a key that the stated equality forbids. Define the comparison as example keys *excluding* `model` versus documented AI-supplied keys, assert `model` separately, and describe it as AI-supplied provenance rather than engine-owned.

### Two edited references retain the obsolete six-field spine claim
**File**: orbit/changes/rc07b-reference-roundtrip/tasks.md:17
**Description**: Tasks 2.1 and 3.4 correct the audit-drift and archive references' “6-field universal spine” text, but tasks 3.1–3.3 add examples to the review and address-reviews references without correcting the same text there. Both still list six fields and omit the required `model`, whereas `orbit-conventions` specifies seven. Include those two reference corrections in the tasks and verify every touched schema reference points to the seven-field owner.

## SUGGESTION

### Define how examples attach to individual schema blocks
**File**: orbit/changes/rc07b-reference-roundtrip/specs/orbit-emit-composition/spec.md:5
**Description**: The rule requires coverage per schema block, but `json example <scope>` identifies only scope, not its block, and the review reference contains two full-record blocks in one file. State an attachment rule, such as examples belonging to the nearest preceding full-record block until the next such block, and add a mutation that moves a field between the two blocks to show the test checks the intended pairing.

## Blocks

None.

## Direction

**Disposition**: hold

The verification and `model` rules make the planned examples impossible to satisfy as written. Resolve those contracts before implementation so the new test can prove the references through actual accepted submissions.

## Notes

`node bin/orbit.js validate rc07b-reference-roundtrip --strict` passes. I compared the four deltas with their baseline requirements and traced the planned examples through the current parity test, reference templates, and emit gate; the structural validator does not check these execution constraints.
