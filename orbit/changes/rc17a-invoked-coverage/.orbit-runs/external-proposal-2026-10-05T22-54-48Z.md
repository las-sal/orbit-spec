# External Review: rc17a-invoked-coverage (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-05

## CRITICAL

None.

## WARNING

### Broken-pair recovery can recommend a pass that cannot cover the slot
**File**: orbit/changes/rc17a-invoked-coverage/specs/orbit-engine-gates/spec.md:53
**Description**: The BROKEN row recommends the preference’s command, but the missing class’s first subsequent pass remains reserved as the broken pair’s member. Consider `[invoked, in-context]`, preference `external`, launch L1, fresh F2, and a completing walk of F2 at T3. The recommended external E4 becomes L1’s first external member. Its interval contains the walk, so the pair remains BROKEN and E4 cannot cover as a single. The engine recommends an external again; only E5 becomes a single. The engine can predict that the first recommendation buys a pass without satisfying the slot. Define recovery that starts a new launch or guarantees an eligible single, reconcile it with the membership table’s “new launch or recorded proceed” row, and test both missing-class directions.

### The oracle’s equivalence fails on its explicitly included tie case
**File**: orbit/changes/rc17a-invoked-coverage/design.md:149
**Description**: D9 requires `openPair.missing = X` exactly when adding a new pass of class X would cover the failed structural `blind-pair` slot. Take cadence `[blind-pair]`, clean fresh and external passes sharing T1, and no walks. The normative diagnosis is `tie`, with no `openPair`. Adding either a fresh pass at T2 or an external pass at T2 nevertheless covers the slot. The equivalence therefore demands incompatible values for a field that should be absent. Read-only probes of the existing structural-pair implementation confirm both repairs succeed. Task 6.1 cannot satisfy this assertion and the diagnosis table simultaneously. Derive `openPair` from the missing-class diagnosis and test repairability separately, explicitly covering ties.

### Suggestion-only walks are not universally neutral to gate state
**File**: orbit/changes/rc17a-invoked-coverage/tasks.md:35
**Description**: Task 6.3 asserts identical gate state with and without the suggestion-only walk; the discovery scenario at `specs/orbit-address-reviews/spec.md:77` repeats the claim. However, clause (a)’s unchanged ordering rule makes a following slot beat the preceding slot’s walk records regardless of severity. With no launch, a fresh SUGGESTION-only pass at T1 and a clean in-context pass at T2 satisfy `[invoked, in-context]`. Discovering and deferring T1’s suggestions at T3 makes T2 precede its required walk, leaving coverage unsatisfied. The existing equivalent no-launch cadence `[independent, in-context]` reproduces the transition from passed to unpassed. Qualify the invariance claim to a fixture where ordering cannot change, and explicitly test discovery after confirmation. Preserve the distinction between suggestions not blocking resolution and their walks participating in cadence ordering.

### Retained scenarios still require mandatory pairs and ignore unwalked suggestions
**File**: orbit/changes/rc17a-invoked-coverage/specs/orbit-engine-gates/spec.md:917
**Description**: “Two fresh passes and no external still report the open pair” unconditionally requires `openPair` on `review-system`. Under the proposed default cadence, two fresh passes without a launch are singles: one covers `invoked`, the remaining need is `in-context`, and no pair is open. The scenario at line 834 similarly treats an external system pass without a fresh partner as an open pair without requiring a launch or a structural `blind-pair` cadence.

The address-reviews delta also retains “Nothing to walk” at `specs/orbit-address-reviews/spec.md:94`: its premises require only empty `unresolvedPasses`, no markers, and no unwalked audits. An unwalked SUGGESTION-only pass satisfies those premises while the new discovery rule requires walking it. Qualify the pair scenarios with their intended cadence or launch, and require empty `unwalkedPasses` in the empty-discovery scenario. Otherwise the normative scenarios demand contradictory implementations.

### The live charter and migration claims disagree with the chosen design
**File**: orbit/architecture/clean-up-review-cycle.md:3049
**Description**: The active rc17a charter still promises that a v4 change keeps its cadence and that fresh emits carry their launch token. Design D3 removes version-specific cadence behavior, and D4 removes the fresh stamp. The charter must reflect these revisions so its implementation and downstream handoff requirements agree with the proposal.

The migration section at `orbit/changes/rc17a-invoked-coverage/design.md:205` also says archived trails “compute as before.” D3 proves only that coverage cannot be lost: a historical system trail containing one fresh pass followed by an in-context pass is uncovered under v4 and covered under v5. Replace the unchanged-computation claim with the actual monotone-relaxation guarantee, and explicitly include the charter’s stamp and compatibility statements in the documentation sweep.

## SUGGESTION

### Record the task-count ceiling breach
**File**: orbit/changes/rc17a-invoked-coverage/proposal.md:66
**Description**: The sizing statement reports only the three-capability ceiling. `tasks.md` contains exactly 20 checkbox tasks, while R-crc-1 specifies “under 20 tasks”; its clarification expressly preserves that dimension. Record the complete sizing assessment and acknowledge the task overage for disposition, or reduce actual scope. Renumbering or combining task lines would not resolve the ruling’s stated concern.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the pair-recovery behavior, oracle assertion, and conflicting scenarios before implementation. These determine observable control flow, and the current artifacts would force an implementer to choose which requirements to contradict.

## Notes

Strict change validation, source validation, and baseline fingerprint verification succeeded. The marker sweep found convention references and examples, with no unresolved inline review annotations.

The tied-pair and suggestion-walk cases were checked through read-only, in-memory calls to the installed engine from the checkout at the same Git commit as this worktree. New `invoked` behavior was assessed from the proposed rules. The main risk is disagreement among individually plausible coverage, diagnosis, discovery, and ordering rules.