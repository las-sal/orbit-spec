# External Review: rc05-executable-references (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-08

## CRITICAL

None.

## WARNING

### A non-orbit line can silently swallow an orbit command
**File**: test/helpers/surface-snippets.ts:213
**Description**: The extractor joins lines whenever its tokenizer reports an open quote, including on non-orbit commands. The tokenizer does not handle backslash-escaped quotes outside quoted strings. Consequently, a shell fence containing `echo \"` followed by `orbit status --frobnicate` yields neither a snippet nor an extraction failure: the first line consumes the second, and the failure is discarded because the first word is `echo`. I replayed the committed tokenizer and fence-extraction functions and observed empty `snippets` and `failures` arrays; `sh -n` accepts this input. The guard also exempts these lines because they are inside a shell fence. This undermines the requirement that each orbit invocation in a shell fence reaches the parser. Handle shell escapes when tracking quote boundaries, and add an injection proving that a preceding non-orbit command cannot hide an unknown orbit flag.

## SUGGESTION

### SKILL.md diagnostic locations omit the generated frontmatter
**File**: test/helpers/surface-snippets.ts:74
**Description**: The helper labels each surface `SKILL.md` but analyzes only `template.instructions`. Installed SKILL.md files have frontmatter and a separator prepended by `generateSkillContent`, so reported line numbers do not identify the corresponding lines in those files. Analyze the generated content or explicitly label locations as template-body lines.

### The generated touchpoints example still names the former grammar owner
**File**: src/core/templates/workflows/propose.ts:215
**Description**: The example describes `src/cli/index.ts` as “registration; flags,” although this change moves both into `src/cli/program.ts`. This leaves a misleading code-location example in a workflow that authors predicted touchpoints. Update the example to reference the new builder.

## Blocks

None.

## Direction

**Disposition**: hold

Repair the extractor’s silent omission before relying on this sweep as evidence that documented orbit commands match the CLI. The builder refactor appears faithful, but sharing the production parser cannot establish grammar fidelity for commands the extractor never submits.

## Notes

Reviewed the change artifacts, the implementation diff from `86fdde4e`, archived requirement surfaces, registration callers, completion generators, and generated-template changes. The whitespace-insensitive builder diff preserves the existing declarations and handlers apart from the intended hook options.

Scenario-map coverage and strict validation were not run successfully: both CLI attempts failed because `dist/cli/index.js` is absent. The checkout also lacks `node_modules`, so the test suite could not run in this read-only environment. Coverage was not inferred from test-file searches. Task 6.4 remains unchecked as the declared user-validation handoff.

The requested project file, root convention files, and perspective and critical-path lenses are absent. No named perspective or lens-defined flow could therefore be simulated. The extractor finding was reproduced independently using the committed functions without installing dependencies.