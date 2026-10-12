# External Review: report-archived-change (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### The renderer signature change omits a production caller
**File**: orbit/changes/report-archived-change/tasks.md:9
**Description**: Task 2.2 changes `renderReport` to accept the resolved location but lists only tests and `canonical-examples.test.ts` as callers to update. `src/commands/emit.ts:97` also calls `renderReport('.', changeName)` for `orbit emit review --render`. A required location argument leaves this production caller incompatible; making it optional instead introduces an unspecified resolution path. Add `src/commands/emit.ts` to the touchpoints and tasks, specify its active-change location argument, and verify both plain and JSON `--render` output through the emit command.

### The shared resolver selects matching files as archived directories
**File**: orbit/changes/report-archived-change/tasks.md:3
**Description**: Task 1.1 requires the extracted helper’s behavior to remain byte-unchanged, but the existing `findArchivedDir` filters `readdirSync` names without checking whether they are directories. With a valid directory `archive/2026-01-01-foo/` and a regular file `archive/2026-02-01-foo`, it selects the file. The report then reports an empty renderable trail instead of rendering the valid archived change. This conflicts with the directory resolution promised by the gateway requirement. Specify directory eligibility before lexical selection, reconcile that adjustment with the shared emit resolver’s contract, and add this mixed file/directory case to the resolver tests.

## SUGGESTION

### Qualify the promise to render any archived review pass
**File**: orbit/changes/report-archived-change/design.md:12
**Description**: The goal promises to render “any review pass” of an archived change, while the unchanged baseline’s strict-input requirement deliberately rejects pre-D4 internal emits. The design discusses old schema versions but never names this separate historical-format limit. Qualify the goal as rendering boundary-conformant passes, explicitly preserve the pre-D4 rejection policy, and include an archived pre-D4 fixture to make the limitation clear.

## Blocks

None.

## Direction

**Disposition**: hold

The archived tail is a sound approach, and active-first lookup is coherent. Before implementation, the handoff should account for the emit command’s renderer call and resolve the disagreement between selecting archived directories and preserving a helper that also selects files. These are concrete implementation choices that should be settled in the artifacts.

## Notes

The three modified requirement names exist in the baseline, and all nine carried scenarios remain present. No inline `@review:` markers were found in the change artifacts. The optional project, root convention, and lens files were absent; `AGENTS.md` was empty.

This was a static proposal review. Runtime validation and tests could not be executed because the checkout has neither `node_modules` nor `dist`, and filesystem writes are prohibited. No validator failure is asserted.