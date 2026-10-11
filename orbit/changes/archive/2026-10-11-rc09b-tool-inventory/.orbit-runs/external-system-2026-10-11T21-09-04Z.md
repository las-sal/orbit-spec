# External Review: rc09b-tool-inventory (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### The derivation test pins the recorded-tool set
**File**: test/core/cli-grammar/tool-inventory.test.ts:308
**Description**: `recordedHeads()` correctly derives its external tools from `recordedTools()`, but this assertion requires exactly `['orbit', 'git', 'gh']`. Adding another tool’s contract and sweep entry therefore fails the inventory suite even though the requirement and design D3 promise that this is sufficient to give the tool standing without editing the inventory. Replace the fixed expectation with an assertion against the sweep’s derived inputs, preferably also demonstrating that an additional recorded tool is accepted.

### The non-vacuity check prevents exemptions from leaving with their last use
**File**: test/core/cli-grammar/tool-inventory.test.ts:314
**Description**: The test requires every current exemption head to remain present on the generated surface forever. Removing the last invocation of an exempt utility or message template and removing its exemption, as the new requirement explicitly prescribes, makes the sweep pass but this assertion fail. For example, retiring every `skipped` message template and deleting `skipped` from the spec’s `prose` line still fails `read.has('skipped')`. Use synthetic fixtures to verify extraction of these head shapes and derive live-surface expectations from the current inventory. Keep any aggregate non-vacuity floor independent of individual exemptions.

## SUGGESTION

### Temporary fixture repositories are never removed
**File**: test/core/cli-grammar/tool-inventory.test.ts:428
**Description**: The source-resolution cases create temporary repository trees with `mkdtempSync`, but no cleanup removes them. Repeated suite runs accumulate `orbit-inventory-*` directories. Track these directories and remove them in `afterEach` or `afterAll`, including when an assertion fails.

## Blocks

None.

## Direction

**Disposition**: hold

The extraction refactor appears cohesive, and the inventory’s bounded scope is stated clearly. However, the fixed expectations undermine the intended maintenance contract: adding a recorded tool or retiring an exemption should follow the owning sources automatically. Correct those assertions before moving forward.

## Notes

Reviewed the change range beginning at `7638a187`, the proposal, design, completed tasks, delta specification, archived CLI-grammar baseline, shared extractor, and its orbit and recorded-tool callers. The modified requirement preserves its baseline scenarios verbatim. No runtime source, generated workflow body, CLI registration, MCP surface, or HTTP surface changes appear in the range.

The globally installed `orbit` successfully ran strict validation. Its scenario map reports behavior declarations for all 21 delta scenarios, with no uncovered, orphaned, or malformed entries. This establishes declaration coverage, not successful test execution.

The checkout has neither installed test dependencies nor compiled CLI output. Vitest was unavailable, so the full suite and behavioral injections could not be independently executed. `git diff --check` passed, and no unresolved `@review:` marker was found in the change artifacts outside the run records.

`orbit/project.md`, root convention files, and both requested lens files are absent; the root `AGENTS.md` is empty. Named-perspective and critical-path reviews therefore had no supplied lens definitions.