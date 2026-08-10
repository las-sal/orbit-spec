# External Review: d5-context-economy (iteration 1)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-08-06

## CRITICAL

### Emit target resolution permits writes outside Orbit trails
**File**: src/core/emit-composition.ts:255
**Description**: `--change` and `--doc` values are joined directly into filesystem paths without validating them as single identifiers or checking that the resolved path remains below `orbit/changes`, `orbit/explore`, or `orbit/architecture`. A value containing `../` can therefore make an existing directory outside those roots pass the `existsSync` test, after which the public emit command creates `.orbit-runs` and writes JSON there. This is a path-traversal write primitive on a surface intended to write only Orbit trails. Validate change/doc identifiers before resolution, enforce canonical containment (including symlink handling) before `mkdirSync`, and add no-write regressions for parent traversal, separators, absolute-looking values, and symlink escapes.

### Address-reviews still hand-composes project logs and cannot emit for archived changes
**File**: src/core/templates/workflows/address-reviews.ts:906
**Description**: The generated body explicitly tells whole-repo/cross-change walks to write an `address-reviews-*.json` by hand, contradicting D5's requirement that every emitting body use `orbit emit`. The same seam breaks the archived-change flow promised by the baseline: the workflow resolves archived change names and auto-discovers their trail, but its emit instruction uses `orbit emit address-reviews --change <name>` while `address-reviews` declares only change/doc scopes and `resolveTarget` searches archives only for the `archive` command. Add project and archived target resolution for `address-reviews` (with the destination derived unambiguously from the resolved scope/source), remove the hand-write branch, and cover active, archived, architecture, path/cross-change, and whole-repo persistence end to end.

### Touchpoints divergence remains AI-computed despite the engine-set-difference design
**File**: src/core/boot-render.ts:90
**Description**: Boot exposes only flattened predicted strings and the actual path list. It discards `parse.malformed`, and the parser's `isPredicted`/`entrySatisfied` matching helpers have no production caller. The audit-drift body must consequently reimplement exact/prefix/glob/group matching and cannot report malformed entries from its one prescribed boot call, even though design.md requires an engine set-difference and the delta requires malformed entries to surface. Have the engine return typed entries plus computed `actual_unpredicted`, `predicted_unsatisfied`, and `malformed` results (or provide an equivalent dedicated engine check), make audit-drift consume those results, and add an integrated test covering prefix, glob, grouped alternatives, and malformed entries.

### Chunk declarations can omit task groups and produce a prohibited complete record
**File**: src/core/parsers/chunk-preamble.ts:76
**Description**: The parser checks gaps only between declared ranges; it never compares the declared span with the numbered groups actually present in `tasks.md`. A preamble can therefore declare groups 1-4 while unchecked AI-doable work remains in group 5. `computeApply` considers only the selected declaration, can emit the final declared chunk with `chunk_complete: true`, and still report `tasks_remaining > user_validation_remaining`—the exact contradiction the run-summary spec says the emit layer MUST NOT produce. Validate full leading/trailing coverage against parsed task groups (or reject the contradiction independently before write), degrade malformed coverage to no-chunking, and test omitted first and final groups.

## WARNING

### An apply emit switches boot to ACTUAL before any apply commit exists
**File**: src/core/boot-render.ts:93
**Description**: Lifecycle selection uses the presence of any `apply` emit as `applyStarted`, but the orientation requirement says the switch occurs once apply commits exist. Apply emits can be written at a boundary before the chunk commit lands, so a cold pickup in that interval receives `actual: []`/an incomplete committed diff instead of the predicted-only pre-commit view. Base the transition on committed apply work rather than trail presence and add a case with an apply emit plus uncommitted implementation changes but no apply commit.

### Diff boundary snapshots include unstaged untracked files
**File**: src/core/parsers/apply-state.ts:128
**Description**: `captureDiffBase` seeds a temporary index from HEAD and runs `git add -A`, which adds every untracked file to the boundary tree. The governing spec says the snapshot is the tracked working state and explicitly states that brand-new untracked files remain invisible until staged. Capturing them can also make a later removal appear as a touched-file deletion even though the file was never tracked or staged. Build the temporary tree from tracked working changes plus additions already present in the real index, and add a regression where an unstaged untracked file exists at one boundary and is removed or changed before the next.

### The universal write gate accepts invalid declared shapes
**File**: src/core/emit-composition.ts:538
**Description**: The universal check verifies only that `model` exists, so values such as a number or object are written despite the required `string|null` spine type. In addition, `handoffShapeCheck` checks only `boot_sequence` and `next_command`, allowing architect and architecture-review records to omit the required `model_hint` and `seam`. Enforce the complete universal spine types and the full architect-owned handoff schema before any write, with malformed-payload tests for each required type/field.

## SUGGESTION

### Touchpoint target validation does not enforce repo-relative paths
**File**: src/core/parsers/touchpoints.ts:34
**Description**: `isValidTarget` returns true for every non-empty string and `targetForm` treats every whitespace-free non-glob/non-prefix token as an exact path. Absolute paths, `../` paths, and other non-repo-relative forms therefore parse as valid even though the delta defines exact targets as repo-relative, so the required malformed-entry suggestion cannot fire for them. Normalize and validate target syntax as a safe repo-relative path/prefix/glob and add rejection cases for absolute and parent-resolving targets.

## Notes

Reviewed the D5 proposal, design, task map, delta specs, archived baselines, implementation range, review-cycle fixes, generated workflow sources, and current trail. Task 9.6 remains unchecked as the explicitly designed user-validation handoff, not an implementation-completeness defect. The repository has no `orbit/lenses/perspectives.md` or `orbit/lenses/critical-paths.md`, so those judgment-layer walks were skipped as instructed.

`npm run build`, strict change validation, the focused emit/boot suite, generated-surface fidelity suite, and all recorded base-fingerprint checks succeeded. The full suite reached 1,876 passing tests and 24 failures; every failure came from existing CLI-test subprocess strings splitting the space-containing workspace path (`/Users/sal/Documents/orbit 3 2/bin/orbit.js`) at `/Users/sal/Documents/orbit`, so those failures did not exercise the D5 behavior under review.
