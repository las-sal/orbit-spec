# External Review: rc17c-short-review-next (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-07

## CRITICAL

None.

## WARNING

### Example-source selection does not identify a MODIFIED requirement structurally
**File**: test/core/canonical-examples.test.ts:43
**Description**: `requirementSource` treats any file containing the heading text as an active modifier. It checks neither the delta section nor whether the heading is outside a fence. `canonicalExamples` likewise selects the first matching heading without tracking fences beforehand. An unrelated change quoting this requirement inside a fenced example can therefore trigger the multiple-modifier refusal or replace the baseline as the selected source. An occurrence under REMOVED or RENAMED Requirements is also treated as MODIFIED. This diverges from design D8 and the normative source-selection rule. Select the requirement using the engine’s delta parser, or a fence-aware section parser that explicitly requires MODIFIED Requirements. Verify that quoted headings and other delta operations do not qualify.

## SUGGESTION

### The documented guard limit omits stale engine-owned review values
**File**: orbit/changes/rc17c-short-review-next/specs/orbit-conventions/spec.md:115
**Description**: The named limit says stale values pass for apply and archive, while describing additional renderer grading for review. However, the guard removes the review example’s `next_recommended`, `final_assessment`, `iteration`, `pass_genre`, and `verified_walks` before composing and rendering a replacement emit. Changing the example’s `next_recommended` to `/orbit:apply wrong-change` leaves its key set unchanged and never reaches renderer validation. The example can therefore regain the very pointer drift this stage repairs without failing the guard. Extend the named limit to explicitly include discarded review values; preferably compare context-independent values such as the review counts sentence and change-scoped pointer against the example before substitution.

## Blocks

None.

## Direction

**Disposition**: hold

The runtime pointer change and its compatibility boundary are coherent on inspection. The new guard should first select the actual MODIFIED requirement structurally: otherwise an unrelated change can alter which documentation the suite checks or prevent it from running. Its documented limits should also distinguish validation of the supplied example from validation of the recomposed emit.

## Notes

All task checkboxes are complete. Comparing the four MODIFIED requirements against their archived baselines found no dropped scenario headings. The composer and renderer changes follow the intended mode split; change-scoped discovery includes outstanding internal and external passes, while architecture mode retains its explicit file pointer.

Scenario-map coverage was not checked. Attempts to run `node bin/orbit.js status --change rc17c-short-review-next --scenarios --json` and strict validation failed before command execution because `dist/cli/index.js` is absent. Dependencies are also absent, and the read-only environment prevents building or running the disposable-project tests. This is an execution limitation, not an observed artifact-validation failure.

`orbit/project.md`, root `*_convention.md` files, and both named lens files are absent. Named-perspective and named-critical-path reviews therefore could not be performed. Caller inspection covered review composition, report normalization, orientation consumers, change-scoped walk discovery, and the external T0 branch.

---

I could **not** write the findings file or commit/push it because this environment is read-only. The complete markdown above is provided for manual saving and committing.