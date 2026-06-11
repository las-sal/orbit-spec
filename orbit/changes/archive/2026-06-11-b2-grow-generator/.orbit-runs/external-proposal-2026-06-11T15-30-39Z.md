# External Review: b2-grow-generator (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-11

## CRITICAL

### Plain update bypasses reference reconciliation when stamps are current
**File**: orbit/changes/b2-grow-generator/tasks.md:56
**Description**: Task 5.3 and the proposal's self-host loop run plain `node bin/orbit.js update`, and the spec promises that `orbit update` removes undeclared references. Current `src/core/update.ts:151` returns before generation whenever version and config stamps are current, while `src/core/profile-sync-drift.ts:104` checks only `SKILL.md` and command presence. A missing archive reference or user-parked stray reference on a current-version install therefore never reaches the proposed reconciler; the cleanup test could pass only by forcing an update or seeding stale version metadata. Add reference-set/content drift to smart update detection, with current-version missing/stray-reference tests, or explicitly require `--force` and narrow the convergence contract and self-host instructions accordingly.

## WARNING

### Verbatim archive-schema migration would contradict the baselines
**File**: orbit/changes/b2-grow-generator/design.md:19
**Description**: The design says the overlay reference is migrated "verbatim, paths orbit-named", but the named migration source contains schema-shape conflicts that path renaming does not fix: it represents `unresolved_markers` as an object while `orbit-conventions`' canonical lifecycle example and the actual B1 archive emit use an array; it nests delta counts under `sync_specs.counts` while the canonical shape places them directly under `sync_specs`; and it includes `user_decision: aborted` even though `orbit-archive-modifications` says abort writes no summary and limits successful-summary decisions to three values. The planned fidelity test only checks the declaration/filename, so parity hashes could lock in the wrong schema. Specify the reconciled canonical content rather than "verbatim", and add semantic fidelity assertions for the baseline-defined shape and allowed values.

### Re-running init has unspecified destructive reconciliation semantics
**File**: orbit/changes/b2-grow-generator/tasks.md:22
**Description**: Task 1.3 defines one helper that both writes references and removes undeclared files, then task 2.1 has `init.ts` call that helper. Current init explicitly supports extend mode and refreshes a previously configured tool when init is re-run, so this wiring can delete unknown reference files during `orbit init`, although D-b2-1 and the delta spec authorize remove-unknown behavior only for `orbit update`. Decide and specify whether re-init reconciles/deletes and reports removals; if deletion is update-only, split emission from reconciliation or give the helper an explicit mode, and test same-tool extend init.

### Update's legacy-upgrade generation path is missing from the wiring plan
**File**: orbit/changes/b2-grow-generator/tasks.md:23
**Description**: `src/core/update.ts` has two separate skill-generation paths: the normal refresh loop at line 193 and `upgradeLegacyTools()` at line 663. Task 2.2 names only the update skill refresh, so an implementation following the tasks can wire references into the first loop while legacy tools upgraded by `orbit update --force` still receive only `SKILL.md`. Add an explicit task and test that the legacy-upgrade path calls the shared reference writer and produces the archive reference for every newly configured skill-capable tool.

### Reference-name and filesystem safety behavior is undefined
**File**: orbit/changes/b2-grow-generator/specs/orbit-skill-generation/spec.md:28
**Description**: The type accepts any string, but the spec states bare-filename validity only as a successful `THEN` and defines no rejection behavior for separators, `.`, `..`, absolute names, or duplicate names. Reconciliation also says "files", leaving undeclared directories and symlinks ambiguous; a symlinked `references/` directory or entry can violate the promise that writes/deletes never escape the subtree. Define validation and failure behavior, duplicate-name handling, treatment of every directory entry type, and physical containment/symlink policy, then add traversal, duplicate, directory, and symlink tests.

## SUGGESTION

### Define failure ordering before destructive reconciliation
**File**: orbit/changes/b2-grow-generator/design.md:34
**Description**: The design does not say what happens when one declared-reference write fails partway through reconciliation. A codegen implementation could prune undeclared files before discovering the write failure, leaving a more damaged partial surface while update merely reports the tool failure. Specify that all declared writes must succeed before pruning begins (or define another atomic strategy), and add a failure-path test proving a write error does not trigger destructive cleanup.

### Test metadata order and YAML-safe string preservation
**File**: orbit/changes/b2-grow-generator/tasks.md:46
**Description**: The spec explicitly requires template-declared metadata order, but task 4.4 tests pass-through/defaults/override without an order assertion. Add a unit test with deliberately non-alphabetic keys, a template-declared `generatedBy` in the middle, and a string value requiring YAML quoting; parse the generated frontmatter and assert key order, string preservation, and generator-owned `generatedBy` placement/value.

### CLAUDE.md still says the B1 change is pending archive
**File**: CLAUDE.md:34
**Description**: B1 is already archived at `orbit/changes/archive/2026-06-11-relocate-modified-upstream-workflows/`, and its six baselines are live, but the handoff still says archive is pending. Extend task 5.4's residue sweep to correct this current-state claim so implementers do not treat the archived B1 change as active.

## Notes

`node bin/orbit.js validate b2-grow-generator --strict` passed. The current baseline test suite also passed: 68 test files, 1459 tests. No unresolved `@review:` markers were found in the change artifacts.
