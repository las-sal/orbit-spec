# External Review: conditional-steps (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-17

## CRITICAL

None.

## WARNING

### Reference handoffs can repeat commands instead of consuming the existing result
**File**: orbit/changes/conditional-steps/design.md:71
**Description**: The basic content runs a command, then tells the agent to read and follow a reference containing the original complete step byte-for-byte. That complete step instructs the agent to run the command again. This affects commit, chain, fingerprint, size and sign-off handling. The architect reference also retains the save command, so following it literally can repeat the save and replace the failure outcome that the hold table must use. The artifacts never establish whether the reference consumes the existing result or restarts the procedure. Define that handoff explicitly: preserve the original command output, exit status and preceding save outcome, and direct the agent to the reference's result-handling portion without repeating commands already executed. Add structural checks for that instruction alongside the byte-equality checks.

### The shared PR reference receives incompatible timing instructions without a selection rule
**File**: orbit/changes/conditional-steps/tasks.md:14
**Description**: Both workflow-specific Position paragraphs move into the same `pr-choreography.md`, but the design supplies no wrapper or rule identifying which paragraph applies. Propose places Phase 3 after Step 0d's move; ff places it after Step 5's final status. Propose also places Phase 1 between its mode detection and Step 0a, whereas ff places it before Step 2. The replacement body text delegates later phase timing to this shared reference. A literal implementation can therefore ship both sets of instructions without explaining how the installed agent selects one, leaving ff following nonexistent propose steps or publishing at the wrong point. Specify explicitly labelled propose and ff subsections and an instruction to follow only the invoking workflow's subsection, while preserving the moved paragraphs within those wrappers.

## SUGGESTION

### Fingerprint handoff omits command failures and unexpected results
**File**: orbit/changes/conditional-steps/design.md:97
**Description**: The fingerprint basic content delegates only on `diverged`, `unverified` or `missing`, unlike the sign-off basic contents, which explicitly include non-zero exits. A command failure produces no usable per-requirement status, leaving the agent without a defined next action at the archive path's only parallel-change guard. Specify that a non-zero exit or unreadable result stops before sync and surfaces the error, or delegates to a reference that explicitly defines that behavior. This also avoids treating an absent result as an empty, successful check.

## Blocks

None.

## Direction

**Disposition**: hold

Clarify how execution resumes inside a reference and how the shared PR reference selects workflow-specific timing before implementation. Preserving instruction bytes alone does not preserve behavior when those instructions acquire a new entry point and share a file with another workflow's ordering.

## Notes

Strict validation with `orbit validate conditional-steps --strict --json` passed. The modified requirement names exist in their archived baselines, and no inline `@review:` markers were found in the change artifacts. This was a proposal review; the planned implementation and tests do not yet exist. The principal risk is the execution context lost when complete procedures move behind conditional reads.