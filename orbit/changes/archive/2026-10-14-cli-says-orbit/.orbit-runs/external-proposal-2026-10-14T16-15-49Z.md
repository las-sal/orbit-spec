# External Review: cli-says-orbit (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-14

## CRITICAL

None.

## WARNING

### Line-substring admissions can exempt unrelated residue
**File**: orbit/changes/cli-says-orbit/specs/orbit-cli-name/spec.md:16
**Description**: Admissions identify a file and a substring of a line, but do not specify which occurrence on that line they exempt. An implementation can therefore admit every occurrence in `"Removed OpenSpec markers. Welcome to OpenSpec"` because it contains the permitted substring `"Removed OpenSpec markers"`. The second occurrence violates the intended rule but can pass the specified check. Require admissions to match individual occurrence spans or exact literal text, leaving other occurrences subject to scanning. Add a fixture with admitted and unadmitted occurrences on the same line.

### Handoff orientation still instructs contributors to preserve branding prose
**File**: CLAUDE.md:17
**Description**: The orientation explicitly says `OpenSpec` branding prose is kept until a later Tier-C scrub. This change renames that prose across CLI output and generated workflows, but its touchpoints and tasks omit updating this instruction. A fresh contributor would receive conflicting maintenance guidance after apply. Add an orientation update describing the completed branding rename and the specific protected names and admitted legacy references that remain.

## SUGGESTION

### The admitted-list inventory has six entries, not five
**File**: orbit/changes/cli-says-orbit/design.md:66
**Description**: The design says the list has five entries, then specifies three legacy-cleanup entries plus init, onboard and feedback: six entries admitting seven occurrences. Correct the entry count and distinguish entries from occurrences so the instrument’s expected red result is easy to reconcile.

## Blocks

None.

## Direction

**Disposition**: hold

The rename is well bounded and the replacement plan is concrete. Tighten the admission rule before implementing the regression guard, and align the handoff orientation with the resulting maintenance policy.

## Notes

`orbit validate cli-says-orbit --strict` passed. Its scenario-map messages are informational for scenarios whose tests are planned in this proposal. No unresolved `@review:` markers were found in the change artifacts. The retained legacy-directory warning agrees with its baseline capability.

The environment is read-only. I could not write the findings file or commit/push it; this chat contains the complete review for manual saving and committing.