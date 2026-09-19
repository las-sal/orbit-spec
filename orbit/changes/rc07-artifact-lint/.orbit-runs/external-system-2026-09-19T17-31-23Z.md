# External Review: rc07-artifact-lint (iteration 3)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-19

## CRITICAL

None.

## WARNING

### A marker-aborted file still lets every resolved source report passed
**File**: src/commands/validate.ts:389
**Description**: `parseMarkedSpans` deliberately abandons the rest of a file after a marker error because its pairing is no longer trustworthy, but `domainIncomplete` considers only a failed Git listing or a `domain` finding. The existing marker-error CLI test therefore expects `{items: 2, passed: 1, failed: 1}` for the sole declared source even though its only marker is unterminated and no span was ever compared. This is the same epistemic gap the `unverified` bucket was introduced to close: the pseudo-item makes the run fail, but the source-level claim underneath is still unjustified, and the abandoned suffix could contain any source's only marker. Treat a marker finding as incomplete source verification (mark every resolved, non-failed source `unverified` while retaining the failed pseudo-item), or carry finer-grained per-source scan completeness; specify the marker-abort summary shape and reverse the passing assertion in `test/commands/validate.sources.test.ts:153`.

### `lstat` errors other than absence are still silently treated as deletion
**File**: src/core/source-lint.ts:328
**Description**: The repair correctly switched from `existsSync` to `lstatSync`, but its bare `catch` continues for every error, not just `ENOENT`. A tracked Markdown path below an unsearchable parent directory, for example, makes `lstatSync` throw `EACCES`; the file then produces no `domain` finding, is not counted as scanned, and leaves resolved sources eligible to be reported as passed. `ENOTDIR`, metadata I/O failures, and other lookup faults take the same silent path, contradicting the requirement that only a genuinely absent working-tree entry is skipped. Inspect the error code, continue only for `ENOENT`, and emit a `domain` finding for every other metadata failure; add a regression that makes the parent directory inaccessible rather than merely chmodding the file, because the current unreadable-file test reaches the later `readFileSync` catch and cannot cover this branch.

### `specs.capability-count` can still resolve outside the project through symlinks
**File**: src/core/sources-registry.ts:306
**Description**: The shared `resolveWithinTier` repair closes the document and schema inputs, but the fourth filesystem-backed source still uses `existsSync(specsDir)`, `readdirSync(specsDir)`, and `existsSync(.../spec.md)` directly. If `orbit/specs` is a symlink to an outside directory, the source enumerates that outside tree; even with a real in-project root, a symlinked `spec.md` is counted according to whether its outside target exists. The emitted project capability count can therefore depend on untracked state outside the project, which is precisely the input-containment failure the adjacent sources now reject and is inconsistent with defining the source as directories under the project's `specs/`. Apply the same lexical-root/lstat/realpath containment policy to this source (including each counted `spec.md`), state the policy in the source table, and add root-directory and final-file symlink regressions.

### Completed tasks and a regression test still assert the deleted inline-code contract
**File**: orbit/changes/rc07-artifact-lint/tasks.md:12
**Description**: Task 2.2 first records that the inline-code mask was deleted, then in the same checked item still requires inline-code inertness, the additive whole-document mask, and the removed six-row table; task 5.2 likewise still requires conforming markers inside backticks to go silent. The shipped JSDoc at `src/core/source-lint.ts:175` repeats the old three-case inertness rule, and `test/core/source-lint.test.ts:187` is still titled as an inline-backtick guarantee even though its stale token regex recognizes the anonymous closer and its mask is now fence-only. That test can pass without exercising the behavior its name claims, while the completed plan contradicts the normative named-closer design. Rewrite tasks 2.2 and 5.2 and the parser JSDoc around the two current inertness cases, then replace or rename the live-repository test so it explicitly proves placeholder names are inert and real names remain live inside backticks.

## SUGGESTION

### The migration plan still calls a breaking marker-format change additive
**File**: orbit/changes/rc07-artifact-lint/design.md:337
**Description**: D4c correctly states that the marker format changed and records its cost, but the formal migration plan still begins “Additive,” while the proposal says “No migration.” An old-spec pair does fail loudly rather than silently disappearing—the opener reaches EOF because the anonymous closer is now inert—but that is still a breaking draft-format transition, and neither migration section tells an adopter why the formerly valid document now reports an unclosed opener or how to update it. Describe this as a pre-archive breaking format replacement, record `<!-- /src -->` to `<!-- /src:NAME -->` as the upgrade, and add a legacy-pair regression that pins the intended fail-loud diagnostic.

## Notes

The named closer itself held up under the pairing probes: mismatched names fail at the closer, a second opener remains a nesting error, and a complete legacy pair fails at its opener rather than disappearing. The recurring risk is now completeness state being inferred indirectly from selected finding kinds instead of carried explicitly; the marker-abandon and metadata-lookup paths show why that inference remains fragile.
