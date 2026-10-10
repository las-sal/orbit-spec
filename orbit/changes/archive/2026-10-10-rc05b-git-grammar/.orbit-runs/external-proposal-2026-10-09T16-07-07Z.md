# External Review: rc05b-git-grammar (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-09

## CRITICAL

None.

## WARNING

### Valid flags can be recorded as rejected when a probe omits required positionals
**File**: orbit/changes/rc05b-git-grammar/specs/orbit-cli-grammar/spec.md:41
**Description**: The running-probe rule classifies a usage page as rejection of the flag, but the probe supplies no command positionals. On the available git 2.50.1, `git rev-list --count` prints usage, while `git rev-list --count HEAD` succeeds. The generated review body already uses `git rev-list @{u}..HEAD --count`. Following the specified algorithm therefore records a valid surface flag as rejected and fails the required “Today's surface validates” scenario. Define a valid positional fixture per probed command and separate missing-positional outcomes from flag rejection. Test this case through capture classification and the resulting validator.

### The contract cannot represent the attached-value distinction the design promises
**File**: orbit/changes/rc05b-git-grammar/design.md:58
**Description**: Flags contain only `name`, `takes_value`, `accepted`, and an optional message, with `--name=value` normalized to `--name`. D3 nevertheless promises that adding `=value` after capture to a previously bare flag fails as an unrecorded form. Neither the proposed schema nor D5's validator rules retain the information needed to enforce that promise. For example, a recorded bare `git status --short` must not make `git status --short=x` pass; real git rejects the latter with `option 'short' takes no value`. Define how the contract records permitted argument forms, how repeated forms of the same flag combine, and how the validator distinguishes required, optional, and forbidden attached values. Add corresponding scenarios.

### Inline extraction scope conflicts with per-segment classification
**File**: orbit/changes/rc05b-git-grammar/specs/orbit-cli-grammar/spec.md:141
**Description**: The inherited places table extracts only an inline span beginning with the swept tool, but the new operator row says each segment's first token decides its tool and that a later tool segment is extracted. Design D1 also promises per-segment classification. For an inline span `echo ready && git commit --only <paths> --frobnicate`, retaining the existing `extractInline` prefix filter skips the entire span during the git sweep; tokenizing before filtering catches the defective git segment. Both interpretations have textual support. Explicitly define eligibility for inline spans containing later covered-tool segments, update the places table, and test chains beginning with another tool.

### Command-key discovery is unspecified for the surface-derived capture
**File**: orbit/changes/rc05b-git-grammar/specs/orbit-cli-grammar/spec.md:39
**Description**: The capture must derive one- and two-word command keys from extracted argv, but no rule determines where a command key ends and its positionals begin. `git worktree remove <path>` needs the key `worktree remove`; `git remote-name <path>` might be an unknown command; and bare `git worktree` is separately allowed as an interior tree node. The contract-keyed tree cannot resolve this during initial capture because the contract does not yet exist. Specify an empirical command-key discovery procedure, including bare groups and unknown nested verbs, or name a deliberate command-group rule and its limits. Add capture tests so codegen does not invent a remembered command-family table.

## SUGGESTION

### Tasks permit template changes that the declared scope excludes
**File**: orbit/changes/rc05b-git-grammar/tasks.md:15
**Description**: Task 2.4 instructs the implementer to repair rejected surface flags in templates, whereas proposal line 66 and design line 32 exclude generated-surface text changes. Clarify that confirmed grammar defects permit narrowly scoped template corrections, or specify how those discoveries are routed out of this stage. A rejected probe should first be checked against capture defects such as the missing-positional case above.

### Exploration status still says decisions are awaiting promotion
**File**: orbit/changes/rc05b-git-grammar/explore.md:1
**Description**: The opening status remains “exploring” and says promotion happens when decisions firm up, despite the proposal, design, tasks, and deltas already being present. Update the status to reflect the actual handoff state.

## Blocks

None.

## Direction

**Disposition**: hold

The shared-extractor direction is sound, but the capture procedure currently turns a valid existing command into a contract rejection. The contract's representation and extraction boundaries also leave decisions to implementation that should be settled in the proposal. Resolve those mechanisms before handing this to codegen.

## Notes

I compared both capability deltas with their archived baselines, inspected the existing extractor, gh validator and capture script, and checked relevant generated-template commands. The modified requirements preserve their baseline titles and scenarios. No `@review:` markers were found in the change artifacts.

Read-only probes used git 2.50.1. Strict validation was attempted but could not execute because the checkout lacks `dist/cli/index.js`; this establishes no artifact validation failure.

The environment prohibits filesystem writes. I could not save the findings file or commit/push it. The complete markdown above is provided for manual saving and committing.