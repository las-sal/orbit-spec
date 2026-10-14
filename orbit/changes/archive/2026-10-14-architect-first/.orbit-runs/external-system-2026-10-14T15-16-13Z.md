# External Review: architect-first (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-14

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

### Archive recommendation accepts a directory as an architecture document
**File**: src/core/emit-composition.ts:1839
**Description**: `existsSync` accepts a directory named `orbit/architecture/prog.md`, so metadata citing `{doc: prog, stage: s1}` produces `/orbit:architect prog` even though no document file exists. Architecture discovery excludes directories using `statSync(...).isFile()`, making these surfaces disagree. Check that the target is a file, catching filesystem errors and returning the uncited fallback.

## Blocks

None.

## Direction

**Disposition**: forward

The implementation follows the intended architect-first recommendations while preserving architect’s optional status. The directory edge case merits tightening but does not undermine the ordinary flows. This recommendation is based on static inspection; runtime verification remains outstanding.

## Notes

Reviewed the change artifacts, the requested hash-based commit range beginning at `7807e5ca`, affected baseline contracts, and the implementation’s status, archive, initialization, update, welcome, and generated-workflow surfaces.

The scenario-map check was **not run successfully**. `node bin/orbit.js status --change architect-first --scenarios --json` failed because `dist/cli/index.js` is absent. Scenario coverage was not inferred from test files. Dependencies are also absent, and the read-only environment prevents preparing the build; tests and strict validation were not independently verified.

Task 6.5 remains unchecked: the scratch-directory user validation of initialization followed by bare status. The other tasks are marked complete; those marks do not substitute for independent runtime verification.

Neither `orbit/lenses/perspectives.md` nor `orbit/lenses/critical-paths.md` exists, so named-perspective and declared-critical-path reviews were unavailable. No unresolved review markers were found in the proposal, design, tasks, or delta specs.

The environment is read-only. I could **not write the findings file, commit, or push**. Save this complete markdown manually as `orbit/changes/architect-first/.orbit-runs/external-system-2026-10-14T15-11-13Z.md`.