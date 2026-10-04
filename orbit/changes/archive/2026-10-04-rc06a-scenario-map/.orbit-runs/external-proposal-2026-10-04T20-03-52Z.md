# External Review: rc06a-scenario-map (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-04

## CRITICAL

### A valid scenario title can make archive impossible
**File**: orbit/changes/rc06a-scenario-map/specs/orbit-scenario-map/spec.md:11
**Description**: The key grammar cannot represent a title containing ` :: `, but neither the delta spec grammar nor this change rejects that title before apply. Once the apply gate passes, the scenario is permanently UNCOVERED under this grammar and the new ERROR blocks the CLI archive path. Either make the key encoding unambiguous or reject unkeyable titles during proposal validation with a specific diagnostic, before tests and tasks are written.
**Reproduction**: In an opt-in project, add an otherwise valid ADDED requirement `Req A` with `#### Scenario: A :: B`. Put `// @scenario behaviour orbit-x :: Req A :: A :: B` above a real `it(` call and check every task. Expected: the declaration resolves, or proposal validation rejects the title before apply. As written, splitting the tag on ` :: ` yields four parts, so the tag is MALFORMED; the scenario stays UNCOVERED, `orbit validate` reports ERROR after the apply gate passes, and the CLI `orbit archive` validation refuses the change. A ledger key has the same unkeyable grammar.

## WARNING

### Baseline scenarios are promised in the map but absent from its output shape
**File**: orbit/changes/rc06a-scenario-map/specs/orbit-scenario-map/spec.md:125
**Description**: The delta-operation table says baseline scenarios outside the delta are "reported on the surface" (line 196), and the cover-kind requirement applies to every scenario the map reports. Yet the human render and JSON `scenarios` array contain delta scenarios only; baseline scenarios appear only as one undeclared count. A baseline `behaviour` tag can therefore resolve without appearing in any column. Define a baseline scenario collection with its declarations in both renders, or narrow the requirement and charter to say baseline coverage is only counted, not reported per scenario.

### The attachment rule classifies a stacked tag as a refused next line
**File**: orbit/changes/rc06a-scenario-map/specs/orbit-scenario-map/spec.md:13
**Description**: The specified search skips blank lines and `//` comments that are not tags. The next `// @scenario` line is itself a tag, so it is the next unskipped line and falls into the table's "anything else" refusal. The same paragraph and the "Stacked tags attach to one test" scenario require both tags to attach. State explicitly that tag candidates join the pending stack and are skipped when seeking the test call; include the behavior for a malformed tag in that stack.

### A fixture string can create a silent false declaration
**File**: orbit/changes/rc06a-scenario-map/specs/orbit-scenario-map/spec.md:25
**Description**: The line scanner accepts tag-shaped lines inside strings. If the following line in that string begins `it(`, the tag resolves to a real scenario and fills its `behaviour` column even though no such test exists. Neither ORPHAN nor MALFORMED exposes this case, contrary to the claim that it is never silent; the repo's own fixture-construction convention only protects this repo's new scanner tests. Either distinguish comments from string contents, or explicitly qualify the map and validate check as susceptible to this false declaration and stop claiming all such cases are visible.

## SUGGESTION

### The malformed-config byte-identity claim conflicts with its warning
**File**: orbit/changes/rc06a-scenario-map/specs/orbit-scenario-map/spec.md:262
**Description**: This paragraph says every malformed `scenario_map` shape leaves `orbit validate` exactly as it behaved without the capability, while the table requires a new warning for malformed shapes. Narrow the unchanged-output promise to an absent key, and state that malformed keys turn the check off but add one warning.

## Blocks

None.

## Direction

**Disposition**: hold

The delimiter case makes a valid change impossible to archive through the normal CLI path after apply. Resolve that contract and the map/attachment ambiguities before implementation, so the check's output has a stable meaning for its first reader.

## Notes

I read the change artifacts, exploration, program charter and relevant baseline contracts; checked the parser, archive, status and validation call paths; and ran `node bin/orbit.js validate rc06a-scenario-map --strict`, which passed. The current proposal has no `@review:` markers. The string-fixture case is a declared line-scanner limit, but its false positive can appear as ordinary coverage rather than as a visible malformed or orphan entry.
