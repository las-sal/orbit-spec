# External Review: seam-chaining-grants (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-10

## CRITICAL

None.

## WARNING

### Shared summary format still excludes setting
**File**: orbit/changes/seam-chaining-grants/specs/orbit-conventions/spec.md:1
**Description**: The conventions delta omits `Internal-run JSON summary format`. Its archived baseline still specifies `consent: "user-invoked" | "prompted"` for both workflow-kind apply emits and lifecycle-kind archive emits (`orbit/specs/orbit-conventions/spec.md:238` and `:240`). Archiving these deltas therefore leaves the shared format contradicting the new three-value consent contract. Add a MODIFIED block updating both consent descriptions, and include that work in the tasks.

### Grant withdrawal contradicts constant consent across chunk emits
**File**: orbit/changes/seam-chaining-grants/specs/orbit-lifecycle-consent/spec.md:152
**Description**: The recovery rule says a withdrawn grant causes the session to ask the user and record `prompted`, while the arrival table at line 63 and the run-summary delta require the invocation’s consent value to remain constant across all chunk emits. For example, chunk 1 emits `setting`; the user withdraws `chain.apply`; chunk 2’s emit is refused. Recovery now requires `prompted`, violating the constant-value contract. The recovery also leaves Abort undefined after implementation writes—or the archive move—have already happened, and the body tasks contain no instructions for this refusal path. Specify whether renewed consent starts a new invocation, how earlier emits remain truthful, and what Proceed and Abort do after writes. Carry that behavior into the templates and add a multi-chunk withdrawal scenario.

### Granted archive scenario incorrectly grants program PR readiness
**File**: orbit/changes/seam-chaining-grants/specs/orbit-archive-modifications/spec.md:268
**Description**: This new scenario applies to any PR-attached change but requires the tail to rewrite the description and flip the PR ready. A change attached to a program PR instead appends its stage entry and must leave the program PR’s ready flip to the human. This contradicts the engine-gates delta’s explicit distinction between per-change and program PRs, as well as the archived PR lifecycle contract. Restrict this scenario to a valid per-change attachment and add a program-attachment scenario requiring append without a ready flip. Qualify successful tail execution so degraded preflight or push failure does not contradict the scenario.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the conflicting consent and PR-tail contracts before implementation. A fresh implementer currently has to choose which normative statement to obey, especially when permission changes during a chunked apply or archive targets a program PR.

## Notes

The installed Orbit 2.0.2 CLI accepted `orbit validate seam-chaining-grants --strict`; undeclared scenario diagnostics were informational at proposal stage. The checkout’s CLI could not run because its built `dist/cli/index.js` is absent. All modified requirement names matched their archived baselines. Occurrences of `@review:` in the proposal artifacts describe marker handling rather than unresolved inline review comments.