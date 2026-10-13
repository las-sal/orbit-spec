# External Review: concept-docs (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-10-12

## CRITICAL

None.

## WARNING

### Migration’s empty-directory test overlooks other orbit work
**File**: docs/migration-guide.md:143
**Description**: Finding no files under `orbit/specs/` or `orbit/changes/` does not establish that `orbit/` is disposable. A project can hold an architecture document, an unpromoted exploration, custom schemas, or a manually maintained configuration while both checked directories are empty. The guide nevertheless prescribes `rm -rf orbit` and claims that only an init-generated configuration is lost. This conflicts with the legitimate storage locations defined by `orbit-architecture-engine` and `orbit-conventions`. Check the entire directory and permit deletion only after establishing that its contents are disposable init output; otherwise direct the reader to preserve and merge them. Update the corresponding delta requirement and `OPENSPEC_PROJECT_WARNING` at `src/core/init.ts:107`, which repeat the same incomplete definition of empty.

### Custom-schema documentation promises freshness tracking the engine does not implement
**File**: docs/customization.md:249
**Description**: The `inputs` row says changes to the named artifacts make a passed review stale. The archived `orbit-engine-gates` freshness requirement explicitly says `inputs` is not consulted by v1; `src/core/artifact-graph/gates.ts:103` implements timestamp ordering against apply emits. Editing a declared input without a later apply emit therefore does not provide the promised invalidation. Describe `inputs` as a declaration reserved for future freshness tracking, and explain the current apply-emit rule and its limitation for proposal edits.

## SUGGESTION

### Budget documentation confuses the declaration with recorded spend
**File**: docs/customization.md:251
**Description**: “Reported beside the gate” suggests that the terminal gate readout displays the declared budget. The archived `orbit-engine-gates` requirement specifies that rendered gate rows show `independentSpend` alone; the JSON projection carries the optional `budget` declaration separately. Say that `budget` is inert schema documentation available in JSON, and distinguish it from the actual independent-pass spend shown in readouts.

### CoStrict’s command location is unnecessarily incomplete
**File**: docs/supported-tools.md:70
**Description**: The table gives only a `commands/` directory somewhere under `.cospec/`, while the adapter writes the exact path `.cospec/openspec/commands/orbit-<id>.md` (`src/core/command-generation/adapters/costrict.ts:19`). The migration guide directs other-tool users to this table when removing upstream commands, making the omitted directory useful information. State the exact path and admit that retained on-disk name in the residue rule if necessary.

## Blocks

None.

## Direction

**Disposition**: hold

Correct the migration deletion rule and the freshness promise before moving forward. The former mistakes valid orbit storage for an empty workspace; the latter gives schema authors an assurance the current engine cannot provide. Both affect how adopters use the documented workflows.

## Notes

All task checkboxes are marked complete. Static inspection covered the change artifacts, rewritten pages, init detector and call placement, new documentation checks, migration transcript, and relevant archived contracts. No unresolved review markers were found in the proposal, design, or tasks.

Scenario coverage was **not run**. The requested `node bin/orbit.js status --change concept-docs --scenarios --json` invocation failed because `dist/cli/index.js` is absent. Strict validation failed to start for the same reason; this is an unavailable check, not evidence of an `orbit validate` rejection. Dependencies are also absent, and the read-only environment prevents installing or building them. Test-file tags were not used as a substitute for the scenario map.

`orbit/project.md`, root convention files, and both named lens files are absent. No named-perspective or declared-critical-path review could therefore be performed. The migration transcript was inspected as recorded evidence; its scratch-project execution was not independently repeated.

The report could not be written to `orbit/changes/concept-docs/.orbit-runs/external-system-2026-10-13T01-51-18Z.md`. **I could NOT commit or push the findings because this environment is read-only.**