# External Review: rc06a-scenario-map (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-04

## CRITICAL

### Duplicate scenario titles silently share one declaration
**File**: src/core/scenario-map.ts:369
**Description**: `resolveScenarioKeys` discards a repeated scenario title within a requirement, so two distinct scenario blocks become one map entry and one tag can satisfy both. This breaks the declaration check's promise to account for every delta scenario. Reject duplicate scenario keys as a validation error, or otherwise make each block independently identifiable before accepting a declaration.
**Reproduction**: In a temporary project, set `orbit/config.yaml` to `schema: spec-driven` with `scenario_map.tests: ['test/**/*.test.ts']`. Create change `c1` with `schema: spec-driven`, a checked `tasks.md`, and an ADDED `orbit-x` requirement `Req A` whose text says `The system SHALL do both.` and whose two `#### Scenario: Same` blocks have different WHEN/THEN outcomes. Put only `// @scenario behaviour orbit-x :: Req A :: Same` above one `it('only first', ...)` in `test/a.test.ts`. Run `orbit status --change c1 --scenarios --json` and `orbit validate c1 --strict`. The contract requires both scenario blocks to be accounted for, so the second cannot silently pass on the first block's test. Observed: the map reports `delta_scenarios: 1`, `behaviour: 1`, `uncovered: 0`, and validate prints `Change 'c1' is valid` with exit 0.

## WARNING

None.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The duplicate-title case lets an untested scenario inherit another block's declaration. The map needs to detect that collision before its validation result can be relied on.

## Notes

The rebuilt targeted suite, the full test suite, and strict validation of this change pass. The duplicate-title case was reproduced against the built CLI in a temporary project. The optional project and lens files named in the prompt are absent from this checkout.
