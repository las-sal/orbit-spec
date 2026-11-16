# External Review: program-signoff (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-16

## CRITICAL

None.

## WARNING

### Arc-done instructions retain the superseded archived-stage condition
**File**: src/core/templates/workflows/architect.ts:171
**Description**: Step 5.5 still defines ARC-DONE as “every stage archived AND the closing review recorded,” then makes Step 5.4 an additional condition under `program`. The modified `orbit-pr-lifecycle` requirement instead replaces the archived-stage condition with FINISHED under `program`, explicitly allowing stages ended without an archived change. For a program containing such a stage, Step 5.4 can accept the signature and direct the agent to show the readout, while Step 5.5’s opening condition prevents it. State the two definitions explicitly: under `program`, use the hold and Step 5.4’s result; under other settings, retain the existing check.

### Matching bytes bypass the signature’s closing-review validity
**File**: src/core/signoff.ts:581
**Description**: The exact-hash branch returns `signed` before calling `signatureStands`. Meanwhile, the write gate permits a program signature with `closing_review: null`, and program briefs can be saved before a closing review exists. A caller can therefore save a finished program’s brief, sign it before its closing review, and later obtain `why: "signed"` once a closing review exists, without answering again. The brief renderer does not include architecture review summaries, so recording that review need not change the saved bytes. This conflicts with the stated intent that the program signature is given once the program is otherwise done, and with the unsigned row’s treatment of signatures naming no closing review. Require a standing signature for the exact-hash branch as well, and reconcile the normative table so its matching-hash row cannot override that condition.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The architect instructions should give one consistent completion rule for programs containing ended stages. The signature rules should also establish whether an answer recorded before the closing review can authorize completion afterward; the current implementation permits that despite the lifecycle intent. Resolve these contradictions before relying on the program sign-off to control completion.

## Notes

Reviewed the change artifacts and source changes from `b86f08ad..HEAD`, with attention to the save, emit, hold, account-selection, and architect readout surfaces and their archived requirements. All executable task checkboxes are marked complete. No unresolved `@review:` marker was found in the change artifacts outside run records.

The installed CLI’s `orbit validate program-signoff --strict` reported the change valid, with its size exceptions declared. Its scenario map reported 131 delta scenarios, zero uncovered scenarios, zero orphan declarations, and zero malformed declarations. These are coverage declarations, not evidence that tests passed.

The checkout’s own CLI could not start because `dist/cli/index.js` is absent. Runtime tests and a build were not run in this read-only environment. `orbit/project.md`, root `*_convention.md` files, and the named perspective and critical-path lens files were absent.

The environment permits no file writes. I could not save the findings file or commit/push it; this full markdown is supplied for manual saving and committing.