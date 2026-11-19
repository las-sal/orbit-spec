# External Review: records-by-setting (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-18

## CRITICAL

None.

## WARNING

### Working-tree settings can suppress answers to active tripwire stops

**File**: orbit/changes/records-by-setting/specs/orbit-decision-records/spec.md:82  
**Description**: The specified status command reads the working tree, while tripwire evaluation reads committed configuration or a change’s fixed point. If a halt is removed in the working tree before a session starts, status can report `write: false` while the sensor still uses a committed `halt`. The basic content then prohibits writing a resolution, leaving the engine-written tripwire stop unanswered and allowing the same keys to halt again. The named limit acknowledges the fixed-point case but incorrectly says it is the only disagreement: an uncommitted removal also creates one before apply. Resolve the predicate against the effective tripwire configuration for the work being performed, or specify an independent path that always records answers to engine-written tripwire stops; cover both committed-config and fixed-point cases.

### Scenarios require records even when the new rule forbids them

**File**: orbit/changes/records-by-setting/specs/orbit-conventions/spec.md:110  
**Description**: Several retained scenarios unconditionally require a stop, resolution, or ledger entry, although the modified requirement now forbids those records when status reports `write: false`. For example, “A stop record precedes the question it keeps” has no reading-setting precondition and therefore also applies at the defaults. The same conflict appears in the scenarios for a call put to the user, a directed act, a call after a clarifying question, and a seam described by a stop condition. Add the applicable `write: true` precondition to these scenarios, and retain separate coverage for the default `write: false` behavior.

### Rechecking settings can strand a stop awaiting an answer

**File**: orbit/changes/records-by-setting/specs/orbit-conventions/spec.md:13  
**Description**: The basic content instructs the session to rerun status after it edits configuration and to write no resolution on `write: false`. If a session writes a stop while a reader is enabled, then disables the last reader before the user answers, the instruction suppresses the resolution even though the stop remains in the trail. Re-enabling chaining later can expose that open stop and block a subsequent command. Specify how in-flight stops are resolved across a transition to `write: false`, and add a scenario for the transition.

## SUGGESTION

### Proposal and design disagree about the predicate’s location

**File**: orbit/changes/records-by-setting/proposal.md:51  
**Description**: The impact section offers `decision-records.ts` or `project-config.ts` as the predicate’s home, while the design selects a new `decision-status.ts` and explains why `decision-records.ts` would introduce a dependency cycle. Update the proposal to name the selected module.

## Blocks

None.

## Direction

**Disposition**: hold

The setting transition and tripwire configuration cases need a defined resolution path before implementation. The unconditional scenarios also need to agree with the new default behavior so that an implementation and its tests have one contract to follow.

## Notes

The inline-marker sweep found no `@review:` markers in the proposal artifacts. I could not run `orbit validate`: the checkout lacks `dist/cli/index.js`, and the read-only environment prevents building it.

The findings file could not be written, committed, or pushed because the environment is read-only. The complete findings are provided above for manual saving and commit.