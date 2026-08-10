# External Review: d5-context-economy (iteration 3)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-08-10

## CRITICAL

### Trail containment still accepts symlinks that leave `.orbit-runs`
**File**: src/core/emit-composition.ts:745
**Description**: The new check proves only that the resolved trail path is somewhere under its lexical parent; it does not prove that it is the parent's physical `.orbit-runs` child. A `.orbit-runs` symlink to `.` resolves exactly to `realRoot`, so `assertContained` explicitly accepts it. I reproduced a successful change-scoped explore emit whose returned path was lexically under `.orbit-runs` but whose JSON was physically created beside `tasks.md` in the change root. The same predicate also permits a project trail symlink to any descendant of `orbit/`, allowing project records to land in another scope. This still violates the requirement that the surface writes Orbit trails only and leaves trail readers with non-canonical persistence. Require the resolved directory to equal `path.join(realpath(parent), '.orbit-runs')` exactly (or reject a symlinked trail entry with `lstat`) rather than accepting any contained descendant, re-check at the write boundary, and add regressions for `.orbit-runs -> .` and an in-container sibling at every scope in addition to the existing outside-container cases.

## WARNING

None.

## SUGGESTION

None.

## Notes

The chunk-preamble fallback, emit-independent boot transition, project marker-count validation, pre-apply audit gate, and bare-scope wording now match their iteration-2 resolutions on the paths probed. The remaining containment gap is the distinction between broad ancestry and canonical trail identity: the outside-parent tests pass while an inside-parent alias redirects the same write.

Build, strict change validation, all 26 base-fingerprint checks, and the 57 focused emitter/parser/boot tests succeeded. The full suite reached 1,890 passing tests with the same 24 unrelated workspace-path failures: subprocess tests interpolate `/Users/sal/Documents/orbit 3 2/bin/orbit.js` without shell quoting, so Node attempts to load `/Users/sal/Documents/orbit`. The repository has no `orbit/lenses/perspectives.md` or `orbit/lenses/critical-paths.md`, so those judgment-layer walks were skipped as instructed.
