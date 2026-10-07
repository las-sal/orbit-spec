# External Review: rc18-walk-is-next (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-07

## CRITICAL

None.

## WARNING

### Frontier completion is ambiguous for legal artifact targets
**File**: orbit/changes/rc18-walk-is-next/design.md:52
**Description**: The design defines frontier as “its `before` gate has not passed” and directs implementation to reuse the superseded test. However, the baseline permits `before` to name an artifact, and the existing superseded test checks only passed gate IDs. Consider a passed reviewed gate targeting an artifact that is already complete, with an unwalked SUGGESTION-only pass. Negating the existing test treats that gate as frontier and recommends the walk; the delta’s definition, “its `before` phase is not yet complete,” excludes it. Define completion separately for gate, artifact, lifecycle, and absent targets, and test those cases. If preserving the existing gate-ID-only behavior is intentional, state that narrower rule explicitly instead of equating it with target completion.

### Empty frontier row contradicts the required row-command equality
**File**: orbit/changes/rc18-walk-is-next/specs/orbit-engine-gates/spec.md:79
**Description**: The spec requires a passed frontier gate’s `nextCommand` to equal the command its table row yields. But the empty-unwalked row at line 73 yields “nothing” while explicitly retaining the phase command on the gate row. Task 1.3 additionally requires gate-row and change-command equality on every passed frontier state, although the selection continues to later gates in the empty case. These are different contracts. Restrict the shared-predicate and equality requirement to the passed-frontier-with-unwalked case; explicitly retain the ordinary phase command on other passed rows and allow the change-level selection to continue. Adjust task 1.3 accordingly.

### The one-in-context-check guarantee assumes the shipped two-slot cadence
**File**: orbit/changes/rc18-walk-is-next/specs/orbit-engine-gates/spec.md:85
**Description**: The new normative text claims the trailing slot is the cadence’s last, and design D4 says walking an earlier slot makes the next command an in-context check. The capability accepts arbitrary ordered cadences. For a valid `[fresh, external, in-context]` cadence covered by passes at T1, T2, and T3, walking the SUGGESTION-only fresh pass at T4 invalidates the external slot first. The next command is external, and a subsequent in-context pass is also needed. Scope the bounded one-check claim to `spec-driven`’s `[invoked, in-context]` cadence. For general schemas, specify that existing cadence computation determines the missing class and remaining checks, and add a longer-cadence preservation test.

## SUGGESTION

### Exploration status still says the decisions are awaiting promotion
**File**: orbit/changes/rc18-walk-is-next/explore.md:1
**Description**: The status header says “exploring” and describes promotion as future work, although proposal, design, tasks, and deltas already exist and cite ratified decisions. Update the header to reflect its role as the exploration record supporting this proposal.

## Blocks

None.

## Direction

**Disposition**: hold

The default proposal and system flows have a clear implementation path, and preserving the existing walk ordering rule is explicitly authorized. The frontier definition and command-equality contract still permit conflicting implementations, while the bounded-check language extends a measurement from the shipped cadence to schemas where it does not hold. Resolve those contracts before implementation.

## Notes

Both MODIFIED requirement names exist in the archived baseline. Comparing their full blocks found the existing scenarios preserved, with the intended additions and qualification of the unwalked-pass reader. No inline review markers were found in the change artifacts.

CLI validation could not start: `node bin/orbit.js validate rc18-walk-is-next --strict` failed because `dist/cli/index.js` is absent. Dependencies are also absent, and the read-only environment prevents building the checkout. This is an unverified validation result, rather than an observed artifact-validation failure.