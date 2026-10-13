# External Review: concept-docs (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-12

## CRITICAL

### The warning’s migration steps fail after init creates the destination
**File**: orbit/changes/concept-docs/specs/orbit-init-openspec-warning/spec.md:21
**Description**: The warning tells users to move `openspec/` to `orbit/`, but init proceeds and creates `orbit/`. The same instruction is also required when both directories already exist. Exploration D-cd-2 specifies `git mv openspec orbit`, which moves the source inside an existing destination rather than replacing it. The migration rehearsal avoids this state by resetting before moving. Define separate instructions for an absent destination, an init-created destination, and an existing populated orbit project. Preserve existing data and explicitly prevent nesting. Rehearse migration after the warning-producing init, as well as migration before init.
**Reproduction**: Construct a tracked project containing `openspec/specs/auth/spec.md` and `openspec/changes/add-login/`. Apply the proposed first-init scenario: `orbit init --tools claude` warns, then creates `orbit/specs/` and `orbit/changes/`. Follow exploration D-cd-2’s instruction, `git mv openspec orbit`, then rerun init. Expected: the original spec and change occupy `orbit/specs/auth/` and `orbit/changes/add-login/` and are visible to orbit. Observed by applying the command’s destination-directory semantics: they occupy `orbit/openspec/specs/auth/` and `orbit/openspec/changes/add-login/`; orbit’s direct project directories remain empty, so the original change remains invisible.

## WARNING

### The nested-capability checklist omits active delta specs
**File**: orbit/changes/concept-docs/specs/orbit-user-docs/spec.md:217
**Description**: The checklist requirement names only nested baseline paths, `openspec/specs/<area>/<capability>/spec.md`. Exploration Case 2 also identifies nested delta paths as a hazard: orbit reads them as “No deltas found.” An implementation following the stated row and exploration’s `find openspec/specs ...` command will miss `openspec/changes/add-login/specs/security/auth/spec.md`. Require detection and flattening of both baseline and active-change capability paths, with an explicit collision policy, and include fixtures for both in the migration rehearsal.

### The navigation exemption permits behavioral claims without attribution
**File**: orbit/changes/concept-docs/specs/orbit-user-docs/spec.md:116
**Description**: The exemption accepts any list whose items *begin* with links, although the exploration requires each item to be a *single* link. For example, `- [Review](commands.md) automatically guarantees that every defect is fixed.` qualifies under the spec despite making a behavioral claim without a `Carried by:` line. Restore the single-link restriction, allowing only explicitly defined whitespace or punctuation around that link, and add a negative scenario for a link followed by claim-bearing text.

## SUGGESTION

### The migration rehearsal does not exercise the archive hazards it claims to cover
**File**: orbit/changes/concept-docs/design.md:106
**Description**: The rehearsal ends with `list`, `status`, and `validate --all`. Those commands cannot demonstrate that fixes preserve archive behavior, particularly the delta Purpose issue and requirement-heading parsing. Extend the recorded rehearsal with archive operations on disposable fixture copies and inspect the resulting baseline requirements and Purpose text. This would provide stronger evidence than merely showing that checklist commands find their fixtures.

## Blocks

None.

## Direction

**Disposition**: hold

The migration instructions need a safe answer for the side-by-side state that the new warning itself creates. The checklist also needs to cover nested active deltas, and the attribution exemption should match its intended navigation-only scope. These are concrete gaps in otherwise coherent, narrowly scoped documentation work.

## Notes

The modified requirements retain their baseline scenarios, and the new capability uses the expected ADDED structure. No unresolved `@review:` markers were found in the change artifacts.

CLI validation could not execute: `node bin/orbit.js validate concept-docs --strict` failed because `dist/cli/index.js` is absent. This is a checkout/tooling limitation, not evidence that the proposal fails validation.

The intended findings path is `orbit/changes/concept-docs/.orbit-runs/external-proposal-2026-10-13T01:09:25Z.md`. This environment is read-only, so I could not write the findings file or commit/push it. The complete findings are provided here for manual saving and committing.