# External Review: reference-docs (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Artifact edits do not refresh review evidence
**File**: docs/workflow-engine.md:28
**Description**: “Editing an artifact never leaves stale state behind” incorrectly implies that recomputing gates detects changed review inputs. `orbit-engine-gates`’ v1 freshness rule uses apply timestamps, not artifact contents; editing a reviewed proposal, design or spec can leave its gate passed against earlier evidence. `docs/workflows.md` already acknowledges this limitation. Qualify this statement to distinguish recomputed artifact availability from review freshness, and tell readers to request another review after substantive edits.

### Bulk archive is presented as inheriting all archive checks
**File**: docs/commands.md:231
**Description**: “Runs archive's checks for each change” promises the reviewed-gate prompts and drift audit listed immediately above for single archive. `src/core/templates/workflows/bulk-archive-change.ts` does not inherit those steps: it implements its own batch checks, user-validation closure and fingerprint checks. It also explicitly performs no commit, push or READY flip, regardless of `pr:` configuration. Document these differences so readers can choose the appropriate archive route without assuming equivalent review checks or PR completion.

## SUGGESTION

### Trail description incorrectly covers every workflow and scope
**File**: docs/workflow-engine.md:158
**Description**: The assertion that every workflow leaves a record in the change's `.orbit-runs/` directory conflicts with `orbit-run-summary-emit`’s `Emit scope`. Onboard, standalone sync and bare explore emit no JSON; named explore and architect use exploration and architecture trails; bulk archive emits per inner archive. Replace the universal statement with a scoped description and name these exceptions, pointing to the owning capability for details.

### Thin launchers are confused with workflow skills
**File**: docs/workflow-engine.md:3
**Description**: The page calls the skills “thin” and suggests that they merely write what the CLI requests. The thin component is the command launcher; skills contain substantial behavioral instructions, including review judgment, consent handling and ripple processing. Describe launchers as thin and skills as the workflow instructions that consult the engine for computed state.

## Blocks

None.

## Direction

**Disposition**: hold

Correct the freshness assurance and bulk-archive description before treating these pages as reliable references. Both affect lifecycle decisions: whether existing review evidence covers edited artifacts, and what safeguards and PR actions an archive route actually performs.

## Notes

All implementation tasks are checked. Static inspection of the coverage helper matches the design’s command boundaries, recursive command domain and file-local behavior. The feedback changes consistently retarget both submission paths and remove the label.

The scenario-map coverage check and strict validation were not run successfully: both CLI invocations failed because `dist/cli/index.js` is absent. Dependencies are also absent, and the read-only environment prevents building or installing them. This is a verification limitation, not evidence of an `orbit validate` failure in the change.

`orbit/project.md`, root `*_convention.md` files and both requested lens files are absent, so named-perspective and named-critical-path reviews could not be performed. The documentation lifecycle and affected source surfaces were inspected directly.

---

Could NOT write the findings file or commit/push because this environment is read-only. Suggested filename: `orbit/changes/reference-docs/.orbit-runs/external-system-2026-10-12T23-50-13Z.md`.