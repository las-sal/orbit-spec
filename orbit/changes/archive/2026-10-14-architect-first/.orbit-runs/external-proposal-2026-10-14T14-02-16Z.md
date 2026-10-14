# External Review: architect-first (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-14

## CRITICAL

None.

## WARNING

### Idle status is both a strict architect start and an unrestricted recorded-command surface
**File**: orbit/changes/architect-first/specs/orbit-architect/spec.md:19
**Description**: Idle status is classified as strict, and the enclosing requirement says every new-work start surface names architect first and strict-surface tests fail when another start is named. However, its table row and the orientation delta require preserving any newest recommendation beginning with `/orbit:`. For example, with no live workstreams and a newest architect emit recording `/orbit:explore next-stage`, orientation must render explore without architect. The exploration explicitly accepts this case, but the normative strict-surface rule does not express the exception, and task 5.1 omits idle status from its purported strict-row test. State explicitly that idle status preserves recorded continuations and only its fallback is subject to architect-only assertions. Add a scenario and test preserving a non-architect recorded command, including on rung 3.

### Optional architect scenario promises identical behavior that the change deliberately differentiates
**File**: orbit/changes/architect-first/specs/orbit-architect/spec.md:54
**Description**: The new scenario says an uncited change’s lifecycle runs “exactly as a cited change’s does.” This contradicts this change’s archive recommendation: cited changes return to their program, while uncited changes recommend a new architect session. Existing `orbit-pr-lifecycle` also differentiates cited and uncited changes under `pr: per-architecture`. An implementer or test author could enforce equality and erase intentional citation-dependent behavior. Limit the assertion to absence of additional architect-session prerequisites, penalties, or gates; explicitly preserve citation-dependent routing and recommendations.

### Onboarding incorrectly limits the per-change flow to once per stage
**File**: orbit/changes/architect-first/specs/orbit-onboard/spec.md:5
**Description**: The new walkthrough requirement says the per-change flow “runs once per stage.” Stages can have multiple citing changes; design decision 2 explicitly relies on another change still citing a stage when one archives. Teaching one lifecycle per stage misstates the program-to-change relationship and could lead the generated walkthrough to describe a one-to-one mapping. Say the flow runs once per change, with a stage potentially served by multiple changes, while keeping architect above the per-change phases.

## SUGGESTION

### Promised Purpose edit has no executable task
**File**: orbit/changes/architect-first/proposal.md:48
**Description**: The proposal promises an in-place edit of `orbit-architect`’s Purpose, and the design repeats that commitment, but tasks.md contains no task for it. The delta contains only requirement operations; the spec-apply engine preserves the baseline’s non-requirement content, so archive will not perform this edit automatically. Add an explicit task identifying the intended Purpose wording and when the baseline edit occurs.

### Exploration still describes itself as awaiting promotion
**File**: orbit/changes/architect-first/explore.md:1
**Description**: The opening status says the exploration is still exploring and will be promoted when decisions firm up, although the proposal, design, tasks, and deltas already exist and the decisions are settled. Update the header to reflect promotion and retain the exploration as decision provenance.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the contradictory acceptance rules before implementation. The intended architect-first behavior is clear in the design, but the normative specs currently permit incompatible interpretations of idle recommendations and citation-dependent lifecycle behavior. Correcting those statements and the onboarding relationship will give implementation and tests a consistent contract.

## Notes

Compared all six capability deltas with their baselines and inspected the relevant orientation, emit-composition, metadata, template, and spec-apply code. The installed orbit CLI reports version 2.0.0; `orbit validate architect-first --strict` succeeds, with informational undeclared-scenario notices covered by task 6.2. No unresolved inline review markers were found in the change artifacts. Optional project-context and lens files were absent. No implementation changes or test suite execution were performed during this proposal review.