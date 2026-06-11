# External Review: b2-grow-generator (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-11

## CRITICAL

None.

## WARNING

### Smart detection misses reference-root drift
**File**: orbit/changes/b2-grow-generator/tasks.md:31
**Description**: Detection is specified only as a missing declared reference or an undeclared entry. That does not cover an empty `references/` directory for a reference-less skill, and it does not reliably cover `references/` itself being a symlink whose target happens to contain exactly the declared names. On a current-stamps project, plain `update` can therefore short-circuit without enforcing the no-empty-directory and real-directory containment contracts. Treat any undesired root presence and any root that is not a real directory as reference drift, and add current-stamps tests for both states.

### Declared-path symlinks are not safely reconciled
**File**: orbit/changes/b2-grow-generator/specs/orbit-skill-generation/spec.md:55
**Description**: The contract says links are never followed and all declared writes complete before any removal, but it does not define what happens when an existing entry with a declared name is itself a symlink or directory. A normal write follows a matching symlink outside `references/`; removing or replacing it before writing conflicts with the stated write-before-removal ordering. Define a safe declared-path collision strategy, such as staging all content and then atomically replacing non-regular declared entries, or failing without following them, and test matching-name symlink and directory cases rather than only undeclared entries and a symlinked root.

### Fail-fast validation is wired after an earlier write
**File**: orbit/changes/b2-grow-generator/tasks.md:26
**Description**: The name-validation requirement says invalid and duplicate names fail before writing, with no file or partial write, while task 2.1 explicitly invokes the validating reference writer only after writing `SKILL.md`. An invalid template can therefore overwrite `SKILL.md` before the required failure, and earlier skills/tools may already have been changed. Add a preflight validation phase before generation writes begin, or explicitly narrow the no-write guarantee and align its scenarios and tests.

### Archive reconciliation omits additional source-to-baseline drift
**File**: orbit/changes/b2-grow-generator/specs/orbit-archive-modifications/spec.md:9
**Description**: The delta claims the overlay source disagrees with the baselines on only three points, but the source also models the skip flag as nested `audit.skipped_via_flag` while the archive baseline and current skill body require the exact field `audit_skipped_via_flag: true`. It also contains `/opsx:*`, `openspec/changes`, `openspec/specs`, and `openspec-sync-specs` residue that is broader than merely renaming paths. Expand the reconciliation contract and fidelity tests to cover the skip-flag shape and assert that no stale opsx/openspec-era vocabulary survives in the shipped Orbit reference.

### Init removal reporting is required but not wired
**File**: orbit/changes/b2-grow-generator/tasks.md:26
**Description**: The spec requires an undeclared reference removed by extend-mode init to be reported, and the shared helper returns counts, but task 2.1 only says to call the helper. Task 2.2 explicitly surfaces counts only for update, and the current init result/output has no reference-removal count. Add explicit init count aggregation/output work and a focused extend-mode reporting assertion so an implementer cannot satisfy reconciliation while silently dropping the required report.

### Fresh-install convergence overclaims smart detection
**File**: orbit/changes/b2-grow-generator/proposal.md:19
**Description**: The proposal and requirement say the generated surface is indistinguishable from a fresh install and that the convergence contract holds without `--force`, but the design deliberately excludes same-name, user-edited declared-reference content from smart detection. A current-stamps plain update can therefore leave content that differs from fresh install. Either detect declared-content drift, or narrow the convergence claims throughout proposal/spec/design to declared-set and root-shape convergence when smart detection short-circuits.

## SUGGESTION

### Arbitrary metadata-key order and YAML safety remain undefined
**File**: orbit/changes/b2-grow-generator/specs/orbit-skill-generation/spec.md:114
**Description**: Metadata is a `Record<string, string>` and every arbitrary key must pass through in template-declared order, but JavaScript reorders integer-like object keys and the requirement only makes values YAML-safe. Keys containing YAML-significant characters can also make emitted frontmatter invalid. Constrain supported key syntax and define order as JavaScript property enumeration order, or use an ordered entry representation; add coverage for integer-like and YAML-significant keys.

### Post-amendment wording residue remains
**File**: orbit/changes/b2-grow-generator/design.md:16
**Description**: The design goal still says update-time convergence and undeclared files although the amendment covers init and every entry type; the proposal capability summary repeats update-time convergence; the design risk says `build + update` despite the documented `update --force` self-host loop; and task 5.3 attributes reference-drift detection to 2.4 instead of 2.3. Sweep these small residues before handoff so implementers do not have to decide which wording is authoritative.

## Notes

Strict change validation passes and the full existing test suite passes (68 files, 1459 tests). The prior review resolutions are substantially present, but the remaining warnings should be resolved before apply because they affect containment, fail-fast behavior, smart-update convergence, and the one migrated payload's canonical schema.
