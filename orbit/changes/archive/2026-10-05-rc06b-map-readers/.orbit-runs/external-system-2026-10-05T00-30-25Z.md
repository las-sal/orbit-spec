# External Review: rc06b-map-readers (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-05

## CRITICAL

None.

## WARNING

### Simultaneous verify failures do not follow the stated precedence
**File**: src/core/emit-composition.ts:1630
**Description**: This change retains `orbit-run-summary-emit`'s rule that the emit layer classifies simultaneous failures with validator errors ahead of incomplete tasks, and adds a `text` declaration for that scenario. The emit layer instead trusts one caller-authored `fail_mode`; its `tasks-incomplete` branch never checks validation or `validator_message`. In a temporary change with an invalid spec and one unchecked task, `orbit validate dual --strict` exited 1, but a verify payload with `fail_mode: "tasks-incomplete"` and `validator_message: "invalid spec"` emitted `/orbit:apply dual — 1 tasks remaining` instead of the required validation-error recommendation. Either make the emit layer accept the underlying failure signals and enforce precedence, or revise the contract so verify owns classification and test that combined case at its actual boundary. The new text-only assertion at `test/core/templates/verify-scenario-map.test.ts:293` checks neither behavior.

## SUGGESTION

### The upstream-verbatim declaration checks only the additions
**File**: test/core/templates/verify-scenario-map.test.ts:254
**Description**: This test declares `Upstream-verbatim — kept unchanged` as covered, but asserts only the headings and absence of a numbered step or code fence in `# Orbit additions`. An edit to the upstream portion could pass after a hash update while the scenario map still shows a declaration. Compare that portion with the vendored upstream body using the repo's rename normalization, or record the untested preservation claim explicitly in the ledger.

## Blocks

None.

## Direction

**Disposition**: hold

The reader instructions and scenario-map output agree, but the modified verify recommendation contract still promises a precedence the emit path does not enforce. Resolve that contract or implementation mismatch before treating this change as complete.

## Notes

The change validates strictly, the scenario map reports no uncovered, orphaned, or malformed delta entries, and the full test suite passes. The optional project and lenses files named in the review prompt are absent, so there were no named perspectives or critical paths to walk.
