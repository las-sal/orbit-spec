# External Review: brief-render (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-11-13

## CRITICAL

None.

## WARNING

### Invalid delta specs are rendered without validation
**File**: src/core/program-brief.ts:386
**Description**: `readCapabilities` uses `parseDeltaSpec`, which extracts recognized sections but does not validate them. A delta containing arbitrary text, an incomplete rename pair, or an added requirement without scenarios can therefore produce a successful brief with missing or invalid requirement information. This contradicts the whole-or-absent requirement that an invalid delta spec cause a non-zero exit naming the source and no standard output. Validate each delta before building the brief, and refuse invalid content rather than rendering the parser’s partial extraction.

### Directory read failures silently become missing history
**File**: src/core/program-brief.ts:373
**Description**: Directory enumeration errors are treated as empty input. An existing `specs` directory that cannot be listed becomes “This change has no delta specs: it added and changed no requirement.” The same pattern in `readArchive` converts inaccessible archive history into “no record,” and `subdirs` can omit changes from a program brief. The decision and account folder readers used here also suppress enumeration errors. These successful outputs misrepresent unavailable sources as absent sources, violating the whole-or-absent contract. Distinguish an absent optional directory from permission, I/O, and invalid-path failures; propagate other failures as a `ProgramBriefError` naming the directory.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The brief is intended to support a later sign-off, so it must distinguish complete evidence from evidence it could not read or validate. The renderer currently presents incomplete source extraction as a successful account of the work. Resolve those failure paths before relying on its saved output.

## Notes

Reviewed the change artifacts, implementation, command registration, completion entry, documentation, shared publish changes, PR-tail exclusion, and archive template integration against the relevant baseline contracts. Task 5.3 remains unchecked and explicitly belongs after archive.

Scenario coverage verification and strict validation were not run successfully: both requested CLI invocations failed because `dist/cli/index.js` is absent. Coverage was not inferred from test files. Runtime tests were not run. The requested perspective and critical-path lens files are absent from this checkout.

The environment is read-only. I could not write the findings file, commit, or push; the full findings above are provided for manual saving.