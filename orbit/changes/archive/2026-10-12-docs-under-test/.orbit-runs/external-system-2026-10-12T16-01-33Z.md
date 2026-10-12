# External Review: docs-under-test (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### A zero floor permits the vacuous success the guard should prevent
**File**: test/helpers/user-docs.ts:150
**Description**: Once the pending list is empty, the guard accepts any non-null floor and checks only `count < floor`. Evaluating the function with `pending: []` and `{ sweep: 'orbit', floor: 0, count: 0 }` returns `[]`: a sweep reading nothing passes. Zero also satisfies the specification’s instruction to set a floor below a positive measured count, so a later rewrite can follow the artifact literally while defeating its intended non-vacuity protection. Require each active floor to be a finite positive integer, state that constraint in the owning requirement, and exercise zero, negative, and non-finite values.

### The new inventory lookup uses an encoded URL pathname as a filesystem path
**File**: test/helpers/user-docs.ts:19
**Description**: `REPO` comes from `new URL('../../', import.meta.url).pathname` and is passed to `inventorySource`, which uses filesystem path operations. In a checkout containing a space, the pathname contains `%20`; lookup therefore searches a different directory and fails to read the owning spec. This affects the new file-local checks even though the docs-reading helper correctly passes URL objects directly to the filesystem. Convert the URL with `fileURLToPath`. Apply the same correction to the inventory test’s repository-root calculation so both consumers work in such checkouts.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The docs checks need reliable spec lookup in ordinary checkout paths and a floor constraint that actually guarantees non-vacuity. Both repairs fit the existing mechanism and should be resolved before relying on it to grade the subsequent rewrites.

## Notes

Reviewed the change range from `9977da6d` through HEAD, the proposal, design, completed task list, delta requirements, affected helpers, sweep wiring, and capture changes. The modified CLI-grammar requirements retain their archived scenarios. The inventory extraction largely preserves its previous behavior while separating the docs declarations.

Scenario coverage verification was not run: `node bin/orbit.js status --change docs-under-test --scenarios --json` failed because `dist/cli/index.js` is absent. Validation failed to launch for the same reason; this is an environment limitation, not an observed validation rejection. The full test suite and deliberate git capture were not run because dependencies are absent and the environment prohibits writes. No scenario coverage conclusion was inferred from test-file searches.

The requested project file and both lenses files are absent, so named-perspective and named-critical-path reviews could not be performed. No unresolved `@review:` marker was found in the proposal, design, tasks, or delta specs.