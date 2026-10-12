# External Review: docs-under-test (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Per-file pending-list checks incorrectly apply aggregate inventory exactness
**File**: orbit/changes/docs-under-test/design.md:38
**Description**: D2 runs all three sweeps over each listed file individually. The inventory sweep includes unused-declaration failures, whereas the docs specification makes declarations exact across all unlisted user docs collectively. Construct a case where an unlisted README uses declared `npm`, and a listed, fully rewritten concept page contains only clean prose. Running inventory exactness over that concept page reports unused `npm`; the page therefore appears unfinished and may remain listed indefinitely. Separate file-local failures from surface-wide invariants: evaluate residue, extraction, grammar and unknown heads per listed file, but evaluate unused declarations and snippet floors over their specified aggregate domain. Add a scenario covering a clean listed page that does not use another page’s declared head.

### Floors activate before the stage that supplies their values
**File**: orbit/changes/docs-under-test/specs/orbit-user-docs/spec.md:119
**Description**: Floors become active when the pending list empties, but their values are supplied at public-readiness. The final rewrite stage empties the list before public-readiness, which depends on all rewrite stages. Design D5 nevertheless assumes placeholders remain unread until their replacement. At that transition an implementation must invent behavior: zero permits vacuous success, undefined can fail comparisons, and a positive provisional value is unspecified. Define the placeholder values and the expected behavior when the list is empty but values have not yet been measured. Assign the measurement work explicitly to the appropriate stage and add a transition scenario.

## SUGGESTION

### Residue table and section exemption disagree about commands
**File**: orbit/changes/docs-under-test/specs/orbit-user-docs/spec.md:45
**Description**: The table admits README section “prose” and labels `openspec` commands in any fence or span as residue. The following paragraph instead admits everything in those sections, fenced or not, and the named limit explicitly permits an upstream install line there. State exemption precedence in the table and use the same scope terminology throughout. Add a scenario showing the intended residue-check result for `openspec init` inside an admitted README section, separately from the tool inventory’s result.

### The cited owner lookup is not the inventory’s existing lookup
**File**: orbit/changes/docs-under-test/design.md:48
**Description**: D4 says the inventory already uses `test/helpers/owner-text.ts`. It actually uses a local `inventorySource()` in `test/core/cli-grammar/tool-inventory.test.ts`, which checks requirement headings outside fences and under ADDED/MODIFIED sections. `ownerText()` uses substring presence and can select a quoted heading or a REMOVED requirement; its conflict error also does not name both source files. Correct the reference and state which lookup semantics the docs fence must use. If sharing the existing inventory reader, explicitly account for the empty docs fence: its current parser treats empty content as a malformed line.

## Blocks

None.

## Direction

**Disposition**: hold

The pending-list mechanism needs a clear separation between file-local validity and aggregate inventory exactness. The floor transition also needs defined behavior before implementation. Resolving those interactions would make the intended staged rollout substantially clearer.

## Notes

Reviewed the proposal, design, tasks, exploration, both delta specs, the CLI grammar baseline, project handoff context, program stage ordering and relevant sweep helpers. No unresolved inline review markers were found in the change artifacts. The CLI delta retains the existing scenarios of its modified requirements.

Executable validation was unavailable: `node bin/orbit.js validate docs-under-test --strict` failed to load the missing `dist/cli/index.js`; this checkout also lacks dependencies. That prevents claiming a successful validation run, but does not establish an artifact validation failure.