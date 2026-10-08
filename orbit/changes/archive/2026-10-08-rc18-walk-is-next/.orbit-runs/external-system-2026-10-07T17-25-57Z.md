# External Review: rc18-walk-is-next (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-07

## CRITICAL

None.

## WARNING

### Verify handoffs discard the newly recommended walk
**File**: src/core/emit-composition.ts:264
**Description**: `systemReviewNext` accepts the graph’s recommendation only when it contains `/orbit:review --as system`; otherwise it substitutes a bare system review. With apply complete and a SUGGESTION-only system pass awaiting its walk, rc18 now computes `/orbit:address-reviews <change>`, but a subsequent clean or warning-only verify emit recommends another system review. For an invoked-slot pass, following that handoff puts the following review before the walk—the ordinary ordering problem D5 intends to prevent. The design acknowledges only the passed-gate case and dismisses it because archive recommendations already failed this filter; that does not address the newly affected unpassed-gate case. Reconcile verify’s recommendation contract with the canonical-next requirement, preserve the outstanding walk in the handoff, and verify both passed and unpassed system-gate cases.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The central gate changes match the proposed mechanism, but the verify handoff still directs callers around the walk that mechanism prioritizes. Resolve that competing recommendation before moving forward so the intended review–walk–verification order survives across workflow surfaces.

## Notes

Reviewed the change range beginning at `b6f087f7`, the proposal, design, tasks, delta requirements, affected gate computations, and downstream status, instructions, report, emit, walk-discovery, and archive contracts. The three modified requirements preserve their baseline scenario titles.

Scenario coverage and strict validation were not run successfully: both CLI invocations failed before execution because `dist/cli/index.js` is absent. No test-coverage conclusion was inferred from searching test files. Runtime tests were not run.

Task 4.4 remains unchecked and explicitly describes pending user validation. No unresolved review markers were found in the proposal, design, tasks, or delta specs. Project, perspective, and critical-path files named in the brief are absent, so no named perspective or critical-path reviews were available.

The filesystem is read-only. I could not write `orbit/changes/rc18-walk-is-next/.orbit-runs/external-system-2026-10-07T17:20:52Z.md`, commit it, or push it. The complete report is provided here for manual saving and commit/push.