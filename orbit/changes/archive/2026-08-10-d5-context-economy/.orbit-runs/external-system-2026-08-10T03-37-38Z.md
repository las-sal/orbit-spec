# External Review: d5-context-economy (iteration 4)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-08-10

## CRITICAL

### Canonical trail identity is checked before caller-controlled composition, not at the write boundary
**File**: src/core/emit-composition.ts:768
**Description**: `assertCanonicalTrailDir` correctly rejects every alias that exists when line 768 runs, but the function then evaluates and copies caller-supplied payload values, computes command-specific facts, and may synthesize status before writing at lines 1044-1045; it never checks the directory again. This leaves the same external-write primitive as a check/use race. I reproduced it deterministically through the exported `composeAndWriteEmit` surface with a `model` accessor that replaces the already-validated real `.orbit-runs` directory with a symlink while line 784 reads the payload: the call succeeded, returned a lexical trail path, and physically created the JSON in an outside directory. A concurrent workspace process can perform the equivalent swap during ordinary CLI composition, and a nested `toJSON` hook can do it during serialization. Materialize and serialize all caller-controlled values first, then run `assertCanonicalTrailDir` immediately before writing the already-serialized bytes (or use a directory-handle/no-follow design that binds validation and creation); add a regression that swaps the trail after the current early check and proves no file lands at the redirected target.

## WARNING

None.

## SUGGESTION

None.

## Notes

The canonical-identity predicate itself now handles the static outside-parent, parent-root, sibling, and cross-scope aliases correctly, and its delta wording matches that behavior. The remaining risk is temporal: the check is labeled as write-boundary validation but precedes substantial caller-influenced work, so the validated directory need not be the directory used by the eventual atomic rename.

Build, strict change validation, all 26 base-fingerprint checks, and the 58 focused emitter/parser/boot tests succeeded. The full suite reached 1,891 passing tests with the same 24 unrelated workspace-path failures: subprocess tests interpolate `/Users/sal/Documents/orbit 3 2/bin/orbit.js` without shell quoting, so Node attempts to load `/Users/sal/Documents/orbit`. Task 9.6 remains the declared user-validation handoff. The repository has no `orbit/lenses/perspectives.md` or `orbit/lenses/critical-paths.md`, so those judgment-layer walks were skipped as instructed.
