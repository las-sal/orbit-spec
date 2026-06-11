# External Review: b2-grow-generator (iteration 1, system mode)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-11

## CRITICAL

### Reconciliation escapes through a symlinked skill directory
**File**: src/core/shared/skill-generation.ts:239
**Description**: The reconciler checks only the final `references/` entry, so any symlink in the preceding `skillDir` path is followed. A focused scratch case with `logical-skill -> outside-skill` and a real `outside-skill/references/` caused reconciliation to write the declared file into the outside target and delete its stray file. This violates the physical-containment and links-never-followed contract and creates a user-data-loss path during init or update. Give reconciliation a trusted physical root and reject or safely replace symlinked path components before either `SKILL.md` generation or reference reconciliation; add an init/update regression test with a symlinked skill directory and an outside sentinel.

## WARNING

### Preflight still runs after mutating init and update steps
**File**: src/core/init.ts:112
**Description**: The claimed fix does not put preflight before every write. Init first calls `validate()`, whose permission probe creates and deletes a test file (and may create a parent directory), then performs legacy cleanup and profile migration before reaching `validateSkillTemplates()` at line 145. Update likewise migrates global config and may clean/delete legacy artifacts before either of its preflight calls. An invalid template can therefore mutate files before failing, directly contradicting the no-file-written-or-modified preflight scenarios. Validate all potentially generated skill templates immediately after path resolution and before permission probes, migration, cleanup, or any other mutating operation; cover both init and update ordering with integration tests.

### Reference-name validation accepts an invalid NUL filename
**File**: src/core/shared/skill-generation.ts:198
**Description**: The validator rejects separators, dot names, absolutes, and duplicates, but accepts a name containing a NUL byte even though no filesystem can write it. A focused run showed preflight returning successfully, the first declared reference changing from `OLD` to `NEW`, and the later NUL-named write failing with `ERR_INVALID_ARG_VALUE`. In real generation, `SKILL.md` and earlier skills/references can therefore be modified before this invalid name fails, violating the invalid-name preflight atomicity contract. Reject NUL and other non-filename/control cases during preflight; preferably define a conservative cross-platform filename policy including reserved/aliasing names, and add a no-mutation regression test.

### Declared-path replacement can leave the surface worse on write failure
**File**: src/core/shared/skill-generation.ts:260
**Description**: The helper removes a non-directory `references/` root and removes symlink/directory entries at declared names before attempting the corresponding writes. If `mkdir` or `writeFile` then fails, those existing entries are already gone; earlier declared regular files may also have been overwritten. The test only fails the first write on a clean target, so it does not verify the spec's stronger promise that the existing surface is left no worse. Stage declared content and replacements before committing them, or narrow the requirement to only guarantee no undeclared pruning; add failure tests after a root/declared collision and after an earlier declared write succeeds.

## SUGGESTION

### Root-shape cleanup reporting is incomplete and malformed
**File**: src/core/shared/skill-generation.ts:245
**Description**: Removing an empty `references/` directory returns no removal, while removing a file or symlink at that root returns the name `references`; callers then prefix it and report `<skill>/references/references`. Init also accumulates `referenceEntriesWritten` but never surfaces or returns it despite the checked task saying written/removed counts are aggregated into output. Return structured paths/events that distinguish root removal from child-entry pruning, report them accurately, and either surface written counts or remove the completed-task claim.

### Checked integration-test coverage overstates the exercised paths
**File**: orbit/changes/b2-grow-generator/tasks.md:70
**Description**: Task 4.4 claims a current-version project with missing/stray references is reconciled by plain `update`, but the update integration test starts from an unknown-version skill, so version drift reaches generation regardless; current-stamps behavior is only tested at helper/profile-drift level. The newly fixed legacy-upgrade removal report and literal preflight-before-any-write ordering also have no regression tests. Add end-to-end current-stamps update cases plus assertions for legacy-path reporting and preflight ordering before migration/cleanup.

### Post-remediation artifact wording still disagrees
**File**: orbit/changes/b2-grow-generator/design.md:20
**Description**: The design still says the overlay disagrees on only the three original archive-schema points, while the delta and tasks now specify four shape disagreements including the flat `audit_skipped_via_flag`. The exploration's original D-b2-1 title/body also still describes update-only removal of undeclared files, with the broader entry-type/init behavior only in its amendment note. Sweep these residues so the completed artifacts consistently describe the implemented contract.

## Notes

`npm run build`, `node bin/orbit.js validate b2-grow-generator --strict`, and the full test suite all pass (`69` files, `1496/1496` tests). Change status reports complete and no unresolved review markers remain. The generated archive reference and metadata pass-through otherwise match the amended deltas, and the two update generation paths both call the reconciler.
