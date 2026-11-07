# External Review: decision-layer (iteration 1)

**Reviewer**: Codex (GPT-6)
**Date**: 2026-11-07

## CRITICAL

None.

## WARNING

### Concurrent writes can bypass the single-resolution rule
**File**: src/core/emit-composition.ts:1991
**Description**: Checking whether a stop already has a resolution and publishing the new resolution are separate operations without synchronization. Two processes can both pass the sibling scan before either writes, then publish conflicting answers. Same-token writers also share a temporary filename and can overwrite bytes or fail during rename. Atomic rename protects individual file visibility, not the invariant that a stop has at most one resolution. Serialize decision writes per history folder across token allocation, link validation, and publication, and use exclusive temporary files. Validate with concurrent processes answering the same stop and emitting distinct records.

### Prototype property names bypass citation-kind validation
**File**: src/core/decision-records.ts:231
**Description**: `CITATION_SHAPES[c.kind]` includes inherited object properties. With an otherwise valid ledger shape, `relies_on: [{kind: "toString"}]` produces `TypeError: shapes.some is not a function`; `constructor` and `__proto__` behave the same way. I reproduced this by executing the source module in memory. The CLI consequently reports an internal implementation error instead of naming `relies_on[0]` and the allowed kinds, violating the specified field-specific refusal. Check own-property membership before indexing, or use a `Map` or an object without a prototype.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Protect the single-resolution invariant across concurrent writers before treating these records as reliable precedent. Also make malformed citation kinds follow the normal validation path so callers receive actionable errors.

## Notes

Reviewed the artifacts and commit range beginning at `9e8204b`, the relevant archived contracts, command routing, citation lookup, stop links, and the history readers identified by the design. The separate `decisions/` folder is excluded by the existing readers inspected. All task checkboxes are marked complete, and the diff whitespace check passed.

Scenario coverage verification and strict validation were not run successfully: both CLI invocations failed to start because `dist/cli/index.js` is absent. Dependencies are also absent, and the read-only environment prevents installing or building them. The test suite and claimed mutation evidence therefore remain independently unverified. No scenario coverage was inferred from test files.

The optional project file, root convention files, and named perspective and critical-path lens files are absent.

The environment prohibits file writes. This report could not be saved to `orbit/changes/decision-layer/.orbit-runs/external-system-2026-11-07T21-53-58Z.md`, committed, or pushed; it must be saved and committed manually.