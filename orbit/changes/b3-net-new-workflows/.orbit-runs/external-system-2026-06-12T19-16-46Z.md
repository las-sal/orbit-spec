# External Review: b3-net-new-workflows (iteration 1)

**Reviewer**: GPT-5.1 Codex
**Date**: 2026-06-12

## CRITICAL

None.

## WARNING

### Commands-only re-init leaves the four B3 skill directories installed
**File**: src/core/init.ts:64
**Description**: B3 added the four workflows to the shared `WORKFLOW_TO_SKILL_DIR` map in `profile-sync-drift.ts`, but `InitCommand` has a separate private map that still ends at `propose`. When delivery changes from `both`/`skills` to `commands`, `removeSkillDirs()` iterates `ALL_WORKFLOWS` and silently skips any workflow absent from this map, so `orbit-review`, `orbit-review-external`, `orbit-address-reviews`, and `orbit-audit-drift` remain installed despite commands-only delivery. Replace the duplicate map with the shared typed map (preferred), or add all four entries, and add a both-to-commands re-init test that asserts all 15 skill directories are removed; the current "ALL workflow" init test arrays at `test/core/init.test.ts:86` and `:117` also still enumerate only 11.

### Generated onboarding still describes all four new commands as planned
**File**: src/core/templates/workflows/onboard.ts:96
**Description**: The onboarding skill says rows marked `*(planned)*` have not landed in the generator, then marks `address-reviews`, `audit-drift`, `review`, and `review-external` as planned even though B3 now generates all four. This ships a false command-surface description to every initialized project and conflicts with the baseline `orbit-onboard` complete-enumeration requirement. Remove the planned framing/markers for the four landed commands and add a fidelity assertion that generated onboarding no longer labels registered workflows as planned.

### Review-external can emit an unusable pull instruction before the prompt is remotely available
**File**: src/core/templates/workflows/review-external.ts:223
**Description**: Dirty-repo handling only prints a warning, then Step 8 still emits the required `Pull <repo URL> and read <prompt-path>` invocation. The workflow contains no commit/push or remote-ref verification step, despite describing the prompt as committed; this exact iteration initially failed because a fresh external pull could not find B3 or the prompt. Add a handoff preflight that blocks the pull-based invocation until the reviewed state and prompt are committed and pushed (or explicitly switches to a shared local-path handoff), and cover the dirty/unpushed case in the capability spec and tests.

### Audit-drift schema reference contradicts the change-scoped recommendation contract
**File**: src/core/templates/workflows/audit-drift.ts:39
**Description**: The bundled run-summary schema tells the composer that a findings emit may use `/orbit:address-reviews <name> --from-file <this-json>`, but the corrected `orbit-run-summary-emit` baseline and the same skill's later prose require change-scoped standalone audit-drift to recommend `/orbit:address-reviews <name>` without `--from-file` because auto-discovery selects the just-written JSON. Since the skill explicitly tells the AI to read this reference when composing summaries, it can produce a baseline-violating recommendation. Replace the schema example with the two distinct forms: change-scoped without `--from-file`, project-wide with it.

### Address-reviews reference hard-codes Claude-only skill paths
**File**: src/core/templates/workflows/address-reviews.ts:130
**Description**: The shipped `internal-findings-format.md` reference says the producer schemas live under `.claude/skills/...`, and repeats those paths in its worked example at lines 292 and 305. B3 generates the same skill for Claude and Codex, so those paths are nonexistent in a Codex-only installation and violate the design's path-neutral rebranding rule. Use `references/run-summary-schema.md`, `<skills-dir>/...`, or producer-skill-relative wording throughout the reference and add a residue assertion covering tool-specific `.claude/skills` paths in B3 content.

## SUGGESTION

### Address-reviews still claims audit-drift JSON exists for non-standalone contexts
**File**: src/core/templates/workflows/address-reviews.ts:236
**Description**: The internal-findings reference says V1 supports `audit-drift-*.json` from "both standalone and library/pre-archive contexts", but the corrected audit-drift spec, skill body, and schema header all say library/pre-archive calls write no separate audit-drift JSON. Tighten this sentence to standalone audit-drift JSON only so the resolved persistence-model correction is consistent everywhere.

### Partial-task mode inference is contradictory across spec and skill bodies
**File**: orbit/changes/b3-net-new-workflows/specs/orbit-review-external/spec.md:23
**Description**: One scenario says any unchecked task box infers proposal mode, while the next calls partial implementation ambiguous; both `review-external.ts:215` and `review.ts:134` implement only "all unchecked" as automatic proposal and prompt on mixed state. Define whether mixed checked/unchecked tasks infer proposal or prompt, then align both capability specs and both skill bodies to the same rule.

## Notes

Fresh-checkout gates passed: `npm test` (1543/1543 across 69 files), `node bin/orbit.js validate b3-net-new-workflows --strict`, and `git diff --check 2d26b9f..HEAD`. Lens files are absent, so perspective and critical-path passes were skipped.
