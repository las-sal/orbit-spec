# External Review: landing-page (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Nested capability names have contradictory semantics
**File**: orbit/changes/landing-page/specs/orbit-user-docs/spec.md:16
**Description**: The table says a nested item “neither needs nor supplies a name of its own,” but design.md:69–70 explicitly counts capability tokens anywhere inside the top-level item, including nested items. For a parent bullet containing no capability and a child containing `orbit-review`, the design passes the parent while the table implies failure. Choose one behavior, align both documents, and add a scenario for a capability appearing only in a nested item. Also specify whether an unknown capability in a nested item fails its parent.

### The Codex quickstart lacks its actual invocation path
**File**: orbit/changes/landing-page/design.md:54
**Description**: The quickstart offers `orbit init --tools codex` but then teaches the loop exclusively as `/orbit:*` slash commands. The repository’s Codex adapter writes global prompts named `orbit-<id>.md` (`src/core/command-generation/adapters/codex.ts:35`), rather than Claude’s command surface. Specify and verify the actual Codex invocation sequence, or explicitly scope this quickstart to Claude Code and provide a separate Codex entry path. The planned clean-machine rehearsal covers only Claude, so it would not detect this mismatch.

### Tag cleanup can delete unrelated local tags
**File**: orbit/changes/landing-page/design.md:85
**Description**: The intended scope is removal of fetched upstream tags, but the procedure deletes every local tag absent from `origin`, except `upstream/v1.3.1`. A contributor’s local-only release or checkpoint tag satisfies that predicate and would be deleted despite having no upstream provenance. Identify the upstream tags explicitly, intersect that set with local tags, and retain unrelated local-only tags. Align task 1.2 with that narrower procedure and record the exact deletion set rather than only counts.

## SUGGESTION

### The installation prerequisites omit Git
**File**: orbit/changes/landing-page/design.md:52
**Description**: The prescribed prerequisites name Node.js, while the GitHub dependency install also requires Git to fetch the repository. Add Git to the Install prerequisites and include its availability in the clean-machine record so a newcomer has the prerequisites needed to execute the documented command.

## Blocks

None.

## Direction

**Disposition**: hold

Resolve the claims-check contradiction and give Codex users a concrete, verified invocation path before implementation. Narrow the tag-cleanup procedure to the intended upstream tags so the release preparation preserves unrelated local work.

## Notes

The modified requirements retain their baseline scenarios, and the added requirement does not duplicate an existing baseline requirement. No unresolved `@review:` markers were found in the change artifacts.

Executable validation remains unverified. `node bin/orbit.js validate landing-page --strict` could not start because this checkout lacks `dist/cli/index.js`; dependencies are also absent, and the read-only environment prevents installation or building. This is an environment limitation rather than an observed delta-validation failure.

The environment does not support file writes. I could not save the findings file or commit/push it; the complete review above is provided for manual saving and committing.