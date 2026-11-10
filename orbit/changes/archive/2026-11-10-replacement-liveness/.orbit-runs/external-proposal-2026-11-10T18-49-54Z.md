# External Review: replacement-liveness (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-10

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

### Cover the assigned disposition and brief rendering in the test plan
**File**: orbit/changes/replacement-liveness/tasks.md:8
**Description**: The acceptance criteria include replacements citing assigned decisions and the brief rendering the accepted citation, but the planned tests only exercise write acceptance for superseded decisions and rejection for missing entries. Extend task 2.1 to cover `Disposition: assigned <stage-id>` and assert that the brief renders the replacement’s cited entry, including its disposition. This directly checks the motivating assigned-decision case and the promised agreement between writer and reader.

## Blocks

None.

## Direction

**Disposition**: forward

The change is narrowly scoped and specifies a concrete implementation. Checking replacement link equality before selecting the more permissive existence predicate preserves the original citation, while using the brief’s existing entry reader keeps acceptance aligned with rendering. The remaining citation checks and the requirement-rot limitation are stated consistently across the artifacts.

## Notes

I compared the delta with the baseline requirement, replacement-chain rules, citation checks, Decisions parser, brief renderer, generated-reference source, and existing tests. No unresolved `@review:` markers were present in the change artifacts.

Automated validation could not run: `node bin/orbit.js validate replacement-liveness --type change` failed to load the missing `dist/cli/index.js`. Dependencies and build output are absent, and the workspace is read-only. This is an unverified validation result, rather than an observed artifact validation defect.

The findings file could NOT be written, committed, or pushed because this environment permits filesystem reads only. The full review above is provided for manual saving and commit.