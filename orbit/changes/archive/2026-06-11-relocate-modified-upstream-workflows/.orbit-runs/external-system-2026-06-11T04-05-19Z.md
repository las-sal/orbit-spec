# External Review: relocate-modified-upstream-workflows (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-11

## CRITICAL

None.

## WARNING

### Consume-mode promotion leaves hidden run history behind
**File**: src/core/templates/workflows/propose.ts:188
**Description**: The prescribed `mv orbit/explore/<name>/* ...` does not match dot-prefixed entries, so a named exploration's required `.orbit-runs/` directory remains in staging and the following `rmdir` fails. This contradicts the promotion requirements that prior `explore-<TS>.json` files move into the active change and that the source staging directory disappear. Move the staging directory as a unit or use a dotfile-safe contents move, and add a promotion test seeded with `.orbit-runs/explore-*.json`.

### `/orbit:new` still hardcodes the default schema's next artifact
**File**: src/core/templates/workflows/new-change.ts:111
**Description**: The remediation changed the example to `proposal still pending`, but the governing requirement says both `/orbit:new` and `/orbit:continue` must derive `next_recommended` from `orbit status --json`: `isComplete` plus the first `artifacts[]` entry whose status is `ready`. Unlike continue, new has no emit-time rule to do that, so a non-default schema whose first artifact is not `proposal` receives a false recommendation. Give new the same artifact-completion-aware rule and cover a schema with a different first ready artifact.

### The contributor handoff predates the remediation decisions
**File**: CLAUDE.md:29
**Description**: The handoff still says B1 is underway with about 1391 tests, lists the live design decisions only through D12, and states unqualified mechanism-neutrality. Current state has the B1 tasks and remediation complete enough for iteration-2 review, a claimed and verified 1459-test suite, and ratified D14/D15 plus the D11 Claude-primacy refinement. Update the current-state and source-of-truth sections so future contributors do not reintroduce fat commands, profile gating, or undo the named-tool decision.

## SUGGESTION

### Onboard calls propose's completion emit `T0`
**File**: src/core/templates/workflows/onboard.ts:76
**Description**: The walkthrough says propose emits a T0 run summary after artifact generation, while the emit spec classifies propose as a one-shot completion emit and uses T0 specifically for review-external prompt packaging. Call this a completion run summary so the timeline terminology stays unambiguous.

### Propose claims its upstream body is unchanged after editing it
**File**: src/core/templates/workflows/propose.ts:20
**Description**: The pre-`# Orbit additions` body replaces upstream's apply-next sentence with orbit's review-first flow, yet the additions section says the upstream content above is unchanged and D14 describes a pristine upstream body plus additions. The completion-prompt override already carries the operative review-first rule; restore the upstream sentence or qualify the preservation claim so future cherry-picks have a truthful boundary.

## Notes

`npm test` passed all 1459 tests, `npm run build` passed, and `node bin/orbit.js validate relocate-modified-upstream-workflows --strict` passed. The D14 launcher conversion, completion-prompt overrides, D15 full-surface install behavior, completed canonical examples, localized archive cite, and removed verify dangling cite are present. The two highest-value warnings are a newly observed promotion bug and a partial fix to the prior next-artifact finding.
