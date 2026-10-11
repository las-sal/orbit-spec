# External Review: rc08b-walk-routing (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-05

## CRITICAL

None.

## WARNING

### Blind-pair protection ignores passes consumed by earlier cadence slots
**File**: src/core/artifact-graph/gates.ts:469
**Description**: `diagnosePair(ordered0, trail)` examines the entire pass list without the failed slot’s ordering bound or consumed passes. I exercised `computeGateStates` with cadence `[external, blind-pair]`, a clean external at T1, and an unwalked fresh WARNING at T2. The first slot consumes T1, so the pair needs another external. Observed: `openPair` is absent and `nextCommand` is `/orbit:address-reviews demo`. Discovery therefore walks T2 instead of protecting it; that walk prevents T2 from pairing with a later external. The same omission occurs for `[blind-pair, blind-pair]` with a complete first pair and only the fresh member of the second. Diagnose the missing member using candidates eligible for the uncovered slot, and exercise the resulting `openPair` and canonical next for these supported cadences.

### Rediscovery mandates stale dispositions even when a previous fix regressed
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:197
**Description**: The rule requires previously closed findings to be rechecked and then recorded `stale`, while permitting only previously open findings to be walked again. Its scenario at line 211 repeats that unconditional outcome, and the generated body carries it at `address-reviews.ts:1075`. Consider a pass whose first WARNING was resolved and second WARNING escalated: another edit regresses the first fix before rediscovery. Pushback now reproduces the first finding, but this rule still prescribes `stale` based on its earlier disposition. That conflicts with the baseline’s current-state pushback contract and can let the latest log certify a regressed finding. Make stale suppression conditional on successful current verification; a reproduced finding must re-enter the walk and receive fresh sweep evidence if repaired.

### Essential redesigns do not universally hold the gate
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:239
**Description**: The requirement says an essential redesign’s `escalated` disposition keeps its pass unresolved and holds the gate, without restricting this assurance to substantive findings on reviewed-gate passes. The generated branch at `address-reviews.ts:1110` makes the same promise across the walk’s sources. I exercised a completed review cadence followed by a discovered audit-drift WARNING escalated with `remedy: "redesign"` and an active-change route. Observed: the gate remains `passed`, `unresolvedPasses` remains empty, and its next command remains archive. An escalated SUGGESTION likewise does not hold the gate. These are existing gate semantics: audit-drift is not a gate pass, and suggestions do not gate. Qualify the assurance accordingly and explain that other sources and severities record a route without creating a gate hold.

## SUGGESTION

### The degradation reference retains the old bare-scan exit
**File**: src/core/templates/workflows/address-reviews.ts:502
**Description**: The bundled reference still says that finding no markers in bare scope produces `No @review: markers in scope. Nothing to do.` and exits. Discovery now resolves a bare invocation to the single active change, and the mirrored fence’s AFTER clause owns a different empty-result message. Remove this leftover instruction or explicitly restrict it to marker-only discovery outcomes and reference the owning empty-result rule. This avoids secondary guidance suggesting the retired marker-only path.

### The example logs described as one pair do not belong to one pair
**File**: src/core/templates/workflows/address-reviews.ts:623
**Description**: The introduction describes the first two payloads as the internal and external halves of the same pair. The first actually references `review-proposal-2026-10-02T09-00-00Z.json`; the second references `external-system-2026-10-02T10-00-00Z.md`. Its disagreement additionally points to an internal pass at `09-30-00Z`, and its converged finding does not appear in the first example. Write coherent companion examples with matching mode, tokens, and findings, or describe them as independent examples. Acceptance of each payload by the write gate does not establish the claimed relationship.

## Blocks

None.

## Direction

**Disposition**: hold

I recommend repairing rediscovery’s handling of regressed findings and making blind-pair protection respect earlier cadence slots before moving forward. The redesign guidance also needs to distinguish a recorded escalation from an engine-enforced hold, so callers receive an accurate account of what their walk accomplished.

## Notes

Reviewed the change artifacts, relevant archived baselines, touched implementation and callers, and the requested commit range `c71692af..a7f9f6a2`, excluding this change’s `.orbit-runs` directory.

Strict change validation, fingerprint checking, and TypeScript checking with `--noEmit` succeeded. The required scenario-map command reported 76 delta scenarios: 39 behavior declarations and 37 text declarations, with no uncovered, orphaned, or malformed entries. These are declaration results, not a claim that the tests were rerun. Task 6.3 remains the declared live user-validation handoff.

The engine observations above used in-memory trails without filesystem writes. The relevant built modules matched source transpilation. The full Vitest suite and live AI walk were not run in this read-only environment.

`orbit/project.md`, root `*_convention.md` files, and both named lens files were absent. Named-perspective and named-critical-path checks therefore could not run; caller inspection covered change discovery, explicit ingestion, archived and architecture scopes, cadence ordering, rediscovery, and redesign routing.

Intended report path: `orbit/changes/rc08b-walk-routing/.orbit-runs/external-system-2026-10-05T14-28-24Z.md`.

**I could not write the findings file or commit/push it because the workspace is read-only.**