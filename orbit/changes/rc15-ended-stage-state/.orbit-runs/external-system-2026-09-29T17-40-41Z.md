# External Review: rc15-ended-stage-state (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-29

## CRITICAL

None.

## WARNING

### The generated architect grammar copy is not governed as a mirror
**File**: src/core/templates/workflows/architect.ts:81
**Description**: The generated skill body reproduces the complete-slot production, but the sentence neither declares the copy to be a mirror nor names `orbit-architecture-engine` as its owner. The fidelity test hard-codes the same string and checks only that it occurs once, so it does not hold the generated copy byte-equal to the owner. This leaves the grammar able to drift while the test remains green and violates R-crc-14's mirror corollary. Mark the sentence explicitly as a mirror of the owning requirement and make the test extract and compare the owner's production byte-for-byte (or render both surfaces from one owner-controlled constant), without adding local semantics.

### Living orientation surfaces still publish the retired state vocabulary
**File**: orbit/architecture/d-arc-arbitered-flow.md:103
**Description**: The program doc labels this as the controlled, computed stage-state vocabulary but still gives only `premised → exploring → in-change → quiescent (+ ratified complete)`. `CLAUDE.md:414` repeats the same four-rung model. Both omit the new `concluded` observation and the ended mark/render outcomes, and neither is one of the two location-keyed residual sentences explicitly handed to archive. Update both living orientation surfaces to the current model, or replace their enumerations with a pointer to the owning `orbit-architecture-engine` requirement so the vocabulary has one durable owner.

## SUGGESTION

### The unreadable-explore fallback has no executing test
**File**: test/core/architecture/engine.test.ts:476
**Description**: The delta requirement and task 2.1 specify that both a missing and an unreadable `explore.md` must observe as live `exploring`, but the focused test covers only the missing-file branch. The implementation currently catches read failures correctly, yet that promised leniency can regress without a test failure. Add a test that stubs the relevant `readFileSync` call to throw an `EACCES`-shaped error and asserts `observed: exploring` with `concluded: false`; stubbing is preferable to permission bits so the case remains reliable under privileged and cross-platform test runners.

## Notes

The executable state machine is internally coherent: the full composition matrix, CLI text and JSON propagation, WAITING exclusion, emit acceptance, strict validation, fingerprints, source lint, build, and full test suite all passed. The rc03a user-validation handoff and the two apply-time corrections are recorded accurately in the tasks and apply emit. Residual risk is concentrated in mirror/prose governance rather than the runtime composition logic.
