# External Review: seam-chaining (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-11-09

## CRITICAL

None.

## WARNING

### Open-stop handling returns superseded questions
**File**: src/core/chain.ts:128
**Description**: The loop selects the earliest filename in an unresolved stop’s replacement chain, including a replaced original. The closing step then reads that original’s question and instructs the session to resolve it. This presents superseded wording, and the resolution write gate rejects a new resolution targeting a replaced stop (`checkDecisionLinks` in `src/core/decision-records.ts`). Preserve earliest-chain ordering but return its latest member using `latestInChain`. Verify an original stop replaced by a corrected stop: status should name the corrected record, and the resulting resolution should be accepted.

### Prompt enforcement checks tag vocabulary rather than listed prompt membership
**File**: test/core/templates/chain-prompt-tags.test.ts:128
**Description**: `tagFailures` accepts any new prompt carrying one of four recognized tags. Adding `Confirm deployment with AskUserQuestion. (chain: routine, default: walk all)` passes this check even though the requirement’s prompt list names no such prompt. The separate row assertions only check that existing prompts remain; they do not reject additions. This falls short of the explicit requirement to reject a tagged site whose prompt the list does not name, allowing new prompts to acquire automatic handling without review of their classification. Match discovered sites against an explicit inventory of listed prompts and their expected kinds, and demonstrate rejection of an unlisted prompt carrying an otherwise valid tag.

### The shared closing step has no architecture-mode exclusion
**File**: src/core/disciplines.ts:92
**Description**: The closing step directs the invoking session to run `orbit status --change "<name>" --json` unconditionally and is appended to the review body, which also supports architecture reviews. Architecture mode explicitly has a document target, no change, and a gate-less ending. Following the new closing step can therefore query a nonexistent change or an unrelated change sharing the document’s name. Scope this step explicitly to change modes and retain architecture mode’s existing ending, including a generated-surface assertion for that exclusion.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

Correct the stop replacement handling and make the prompt inventory enforce the stated contract before relying on unattended chaining. The closing instructions also need an explicit boundary around architecture reviews so the existing document workflow remains coherent.

## Notes

Reviewed the change range beginning at `02bef2cd`, its artifacts, affected implementation and workflow surfaces, and relevant baseline contracts. All tasks are marked complete. The installed CLI’s `orbit validate seam-chaining` succeeded. Its scenario map reported all delta scenarios declared, with no uncovered scenarios, orphans, or malformed declarations. These checks used the installed CLI; the checkout’s CLI could not start because `dist/cli/index.js` is absent. Build and tests were not run because dependencies are absent and the filesystem is read-only.

The optional project, root convention, and lens files were absent; named-perspective and critical-path reviews therefore could not run.

The findings file could not be written, committed, or pushed because this environment is read-only. The full findings above are provided for manual saving and commit.