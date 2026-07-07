# External Review: c2-parallel-merge-guardrail (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-07

## CRITICAL

None.

## WARNING

### Public `buildUpdatedSpec` callers can still bypass the guard
**File**: src/core/specs-apply.ts:261
**Description**: The fingerprint guard only runs when callers pass `options.changeDir`. The current CLI/archive callers do pass it, but `buildUpdatedSpec` is an exported spec-apply engine function and its default call path still performs the old wholesale MODIFIED replace with no fingerprint comparison. That conflicts with the new spec/design claim that the guard lives in `buildUpdatedSpec` and covers every path that runs it, including programmatic callers. Derive the change directory from `update.source`/`changeName`, or make the guard context required with an explicit unsafe test-only bypass, then add a regression test that a stale snapshot is refused when `buildUpdatedSpec(update, changeName)` is called directly.

### Pure-rename divergence reports claim the live block will be removed
**File**: src/core/fingerprints.ts:341
**Description**: A diverged RENAMED-only requirement has no `incomingRaw`, so `formatDivergenceReport` falls into the "archive would REMOVE this live block" branch. But the actual apply path renames the current live block's header and preserves its body; it does not remove the block or overwrite the sibling's body content. This violates the promised "current live -> what-would-be-written" report and can mislead the user at the proceed/reconcile decision point. For RENAMED-only entries, synthesize the would-be-written block by replacing the live header with the rename target and diff against that, or present a rename-specific conflict message that does not describe the operation as removal/destruction.

## SUGGESTION

### Validate stored fingerprint hashes in the metadata schema
**File**: src/core/artifact-graph/types.ts:114
**Description**: The delta spec says hash values SHALL carry `sha256:<lowercase hex>`, but `ChangeMetadataSchema` currently accepts any string under `base_fingerprints`. The stamping path writes valid values, yet malformed hand-edited metadata will parse as valid and only fail later as an ordinary divergence. Consider tightening the Zod value schema to `^sha256:[0-9a-f]{64}$` so metadata validation enforces the documented format.

## Notes

`npm run build`, `node bin/orbit.js validate c2-parallel-merge-guardrail --strict`, `node bin/orbit.js fingerprint c2-parallel-merge-guardrail --check`, `npm test -- test/core/fingerprints.test.ts`, and `npm test -- test/core/templates/skill-templates-parity.test.ts` passed. A scratch CLI walk of stamp -> diverge -> refused archive -> reconcile -> refresh -> clean archive also passed, preserving both sibling scenarios.

Full `npm test` ran all 1605 tests but failed 24 pre-existing shell-out tests because this checkout path contains a space (`orbit-spec 1`) and those tests interpolate `node ${bin}` without quoting, causing Node to look for `/Users/sal/Documents/orbit-spec`. The failing files were outside the C2 change.
