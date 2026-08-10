# External Review: d5-context-economy (iteration 2)

**Reviewer**: OpenAI Codex (GPT-5)
**Date**: 2026-08-10

## CRITICAL

### A symlinked trail directory still escapes the emit containment check
**File**: src/core/emit-composition.ts:740
**Description**: The fix realpaths the change/explore/archive directory, but the actual write destination is its `.orbit-runs` child and that child is never containment-checked. An otherwise-contained `orbit/changes/foo/` with `.orbit-runs` symlinked to an external directory passes `assertContained`; `mkdirSync`, the temporary write, and `renameSync` then follow the child symlink and create the emit outside every Orbit trail. I reproduced this with `composeAndWriteEmit('propose', {change: 'foo'}, ...)`: the returned lexical path was under the change, while `realpath(dirname(path))` was the external directory. Validate the resolved trail directory itself (for all change, explore, archive, architecture, and project scopes), safely create it when absent and re-check before writing, and add regressions for a symlinked `.orbit-runs` at every scope.

### Unnumbered task groups still bypass chunk coverage and permit a contradictory emit
**File**: src/core/parsers/chunk-preamble.ts:104
**Description**: The new content-coverage check drops every `parseCheckboxes` group whose `group` is null. Yet checkbox arithmetic deliberately counts tasks under unnumbered `## <title>` groups. A file with a completed declared `## 1.` group and an unchecked task under `## Extra work` therefore returns an `ok` preamble; `computeApply` ignores the unnumbered group when calculating the chunk and can emit final `chunk_complete: true` with `tasks_remaining: 1` and `user_validation_remaining: 0`, still violating the spec's unconditional MUST-NOT-produce semantic rule. Treat any unnumbered group containing checkboxes as malformed when a chunk preamble exists (or independently reject the global contradiction before write), and cover checked and unchecked unnumbered task groups in parser plus composer tests.

## WARNING

### Committed apply work is still hidden until an apply emit exists
**File**: src/core/boot-render.ts:99
**Description**: The resolution correctly prevents an emit-before-commit from switching to ACTUAL, but the whole committed-diff computation remains inside `if (applyStarted)`, where `applyStarted` is trail-derived. This retains trail presence as a necessary condition despite the updated requirement saying the transition keys on committed non-bookkeeping files, never trail presence. I reproduced a change-start commit followed by a committed `src/a.ts` apply commit and no apply emit; boot returned `predicted: ["src/a.ts"], actual: null`. Compute the committed diff independently of emit presence and use whether its non-bookkeeping portion is non-empty as the lifecycle discriminator; add commit-before-boundary-emit and missing/malformed-emit regressions.

### Pre-apply malformed touchpoints contradict audit-drift's skip signal
**File**: src/core/templates/workflows/audit-drift.ts:297
**Description**: The body says all divergence fields are absent without committed apply work and therefore the change is skipped, but boot intentionally includes `touchpoints.malformed` whenever the section is present, even while `actual` is null. A pre-apply malformed entry can consequently look like a live category-5 result and be reported despite the governing audit requirement saying changes without committed work are skipped silently. Make the audit instruction explicitly gate the entire category—including `malformed`—on `touchpoints.actual !== null` (while retaining boot's useful pre-apply parse diagnostics), and add a generated-surface/integration case for malformed pre-apply versus post-apply behavior.

### Project address-reviews can manufacture a clean recommendation from a missing count
**File**: src/core/emit-composition.ts:857
**Description**: The new project-scope recommendation coerces `remaining_markers_in_scope` with `Number(... ?? 0)`, but the payload validator neither requires the field nor validates its type. Omitting it—or supplying a nonnumeric value—therefore takes the clean branch. I reproduced an accepted whole-repo payload whose `final_assessment` says `3 unresolved markers remain.` but whose engine-authored recommendation says no markers remain. Because this field now drives a deterministic engine fact, require a non-negative integer for project-scoped address-reviews before filename creation/write (and reject missing, NaN, fractional, and negative values); add no-write tests alongside the triple-scope cases.

## SUGGESTION

### Bare-scope exception text still excludes address-reviews
**File**: orbit/changes/d5-context-economy/specs/orbit-emit-composition/spec.md:81
**Description**: The target contract first defines bare project scope for both address-reviews and audit-drift, then says every bare invocation is an error except project-scoped audit-drift. The implementation follows the former rule, so the latter parenthetical is stale and makes the same requirement self-contradictory. Change it to except both project-scoped commands and add address-reviews to the nearby bare-scope wording/comment where it still names only audit-drift.

## Notes

Verified each iteration-1 resolution against the new implementation, delta wording, generated-body sources, and focused regression tests; the active-name traversal, archived/project address-reviews routing, engine touchpoint arithmetic, tracked snapshot behavior, spine/handoff typing, and repo-relative touchpoint parsing all hold on their covered paths. Task 9.6 remains the explicitly designed user-validation handoff. The repository still has no `orbit/lenses/perspectives.md` or `orbit/lenses/critical-paths.md`, so those judgment-layer walks were skipped as instructed.

`npm run build`, strict change validation, all base-fingerprint checks, and 137 focused fix/generated-surface tests succeeded. The full suite reached 1,886 passing tests and the same 24 workspace-path failures: affected CLI tests interpolate `/Users/sal/Documents/orbit 3 2/bin/orbit.js` into an unquoted subprocess command and Node receives `/Users/sal/Documents/orbit`. Those failures did not exercise the reviewed D5 paths.
