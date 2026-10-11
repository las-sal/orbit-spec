# External Review: rc09a-size-record (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-11

## CRITICAL

None.

## WARNING

### Successful validation is required before the prompt that resolves strict validation failure
**File**: src/core/templates/workflows/propose.ts:315
**Description**: The size brief runs only after artifacts are “generated and validated,” and Step 0d requires validation to pass. However, strict validation deliberately fails on an undeclared breach—the very state this brief must handle. The preceding validation command and its mode are unspecified. An author following the workflow with `orbit validate "<name>" --strict` can stop before offering Split or Declare; in PR mode, the choreography explicitly stops outward work when validation fails. For example, a structurally valid four-capability proposal with `capabilities: 3` and no declaration fails strict validation before reaching the declaration prompt. Specify that initial validation is non-strict, or explicitly permit size-only warnings to reach the brief while preserving handling of other failures. Align the requirement and design with that ordering, and state how the Split route completes despite its remaining strict size warning.

### Declaration parsing silently treats indented top-level items as nested content
**File**: src/core/change-size.ts:253
**Description**: The parser assumes every bullet indented two or more spaces is nested, without checking whether a parent item exists. A top-level Markdown list can start with two or three spaces of indentation. Thus `## Size\n  - tasks: approved` yields no declaration, malformed line, or duplicate; `## Size\n  * tasks: approved` likewise yields no MALFORMED warning. These results conflict with the declaration table’s distinction between section items and nested bullets. The installed parser reproduced both results. Either recognize top-level indentation using list context, or explicitly constrain indentation in the owning grammar and report unsupported section items as MALFORMED rather than silently ignoring them.

## SUGGESTION

### The documented tracked-gate counter is a different counter
**File**: orbit/changes/rc09a-size-record/specs/orbit-change-size/spec.md:12
**Description**: The requirement calls `parseCheckboxes` “the tracked gate’s own counter,” but the tracked gate uses `countCheckboxes` in `src/core/artifact-graph/gates.ts`. Their semantics differ: `parseCheckboxes` ignores boxes before the first recognized group heading and excludes fenced boxes; the gate counter includes both. For a headingless file containing two unchecked task lines, the installed `parseCheckboxes` reports zero tasks while the gate’s regex counts two. The implementation follows the explicitly named parser, but the ownership claim and expected agreement are misleading. Name it accurately and document these counting boundaries, or deliberately reconcile the counters in a separately scoped change.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify the validation ordering before moving forward: the main user interaction needs an explicit route through the warning it exists to resolve. The declaration parser should also distinguish unsupported formatting from nested content so declarations do not disappear silently. The core computation and separation from gate state otherwise appear consistent with the design.

## Notes

Reviewed the change artifacts, the commit range beginning at `0b913732`, affected implementation paths, and relevant archived contracts for gates, propose, emit recommendations, and conventions. All implementation tasks are checked.

The installed `orbit` CLI successfully ran strict validation and the requested scenario-map command. The map reports 38 delta scenarios: 31 behavior declarations, six text declarations, and one untestable declaration, with no uncovered, orphan, or malformed declarations. The workflow’s interaction scenarios principally have text coverage; that evidence does not resolve execution-order ambiguity.

Plain status reports three capabilities, seven requirements, 19,637 changed bytes, and 17 tasks. The checkout lacks `dist/` and dependencies, so checkout-local CLI execution failed and independent build/full-test verification was not performed. Installed-CLI results are separate from verification of a fresh build of this checkout.

`orbit/project.md`, `orbit/lenses/perspectives.md`, and `orbit/lenses/critical-paths.md` are absent, so named-perspective and named-critical-path reviews could not be performed. No unresolved `@review:` marker was found in the change artifacts outside its run directory.