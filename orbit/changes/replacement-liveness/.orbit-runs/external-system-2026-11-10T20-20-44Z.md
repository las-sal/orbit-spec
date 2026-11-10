# External Review: replacement-liveness (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-10

## CRITICAL

None.

## WARNING

None.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: forward

The implementation follows the proposed scope. Replacement link equality is enforced before the relaxed decision lookup, so a replacement cannot introduce a different citation. Carried citations use the same entry lookup as the brief; new citations retain the live-decision requirement. Other citation kinds and named-stop checks preserve their existing behavior.

## Notes

Reviewed the commit range beginning at `23fc5415`, change artifacts, affected baseline requirements, replacement-chain checks, citation parsing, brief rendering, and generated-reference changes. The baseline’s live-decision rule is explicitly modified by the delta; no additional baseline conflict was identified.

The installed CLI successfully ran `orbit status --change replacement-liveness --scenarios --json`: all 11 delta scenarios have behavior declarations, with no uncovered scenarios, orphans, or malformed declarations. `orbit validate replacement-liveness --strict` passed. All tasks are marked complete.

Runtime verification of the changed implementation was unavailable: this checkout lacks build output and dependencies, and Vitest is not installed locally. The installed CLI’s structural checks do not establish that the changed tests pass.

No project file, root convention files, or perspective and critical-path lens files were present, so named perspective reviews and critical-path scans could not be performed.