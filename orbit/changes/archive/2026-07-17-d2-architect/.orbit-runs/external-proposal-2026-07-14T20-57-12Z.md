# External Review: d2-architect (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-14

## CRITICAL

### Generated-surface change has no README synchronization carrier
**File**: orbit/changes/d2-architect/tasks.md:76
**Description**: D2 adds a 16th generated workflow, but the implementation plan never names the README. The live `orbit-conventions` baseline requires every generated-surface change to include an apply-time README install-section synchronization task (`orbit/specs/orbit-conventions/spec.md:730`), covering counts, file lists, and CLI invocations. Task 4.4 sweeps source/test count pins and task 5.4 updates CLAUDE.md, so neither carries that baseline obligation. Amend task 4.4 (or add an explicit verification subtask) to audit and synchronize README's install surface for `/orbit:architect`, including recording that no edit was needed only if the audit proves the section has no affected count, list, or invocation. This preserves the 20-task structure while giving the triggered baseline requirement an implementation carrier.

## WARNING

### A malformed stage heading can silently downgrade a doc to legacy
**File**: orbit/changes/d2-architect/specs/orbit-architecture-engine/spec.md:31
**Description**: Validation promises to check heading form, but a document with zero recognized headings is explicitly accepted as legacy/opaque. Therefore a one-stage parseable doc whose heading is mistyped (or a retrofit whose headings are all slightly malformed) is indistinguishable from intentional legacy prose: `validate` exits successfully, `status` drops every stage, and citation/state checks lose their target. Define a detectable opt-in or near-miss rule so a doc intended to be parseable cannot silently become legacy—for example, an architecture-format marker, or validation errors for stage-like headings/slots that fail the exact grammar—while retaining graceful handling for genuinely opaque prose docs.

### Missing slot semantics are undefined
**File**: orbit/changes/d2-architect/specs/orbit-architecture-engine/spec.md:7
**Description**: The format says a stage MAY carry `Depends-on:` and `Complete:` slots, while state computation later depends on “the stage's `Complete:` slot,” validation advertises slot checks, and `/orbit:architect` must write a ratification into that slot. Two implementers can reasonably diverge on a parseable stage with no `Complete:` line: reject it, treat it as unratified forever, or insert a slot during ratification. Specify whether each slot is required. If omission remains valid, define the parsed value (`Depends-on` = none; `Complete` = unratified), the `validate` result, and whether the architect flow inserts a missing `Complete:` line before ratification.

## SUGGESTION

None.

## Notes

`npm run build`, strict change validation, and the fingerprint check passed (15/15 verified). The change contains the declared 31 delta requirements and 20 tasks. I found no additional un-delta'd contradiction in the mode/location/emitter/count sweeps, and every delta requirement has a plausible task carrier; the CRITICAL above is a triggered live-baseline requirement outside the 31 delta blocks. The full test run reached 1646 passing tests and 24 failures, all from command tests interpolating the workspace path without quoting it (`/Users/sal/Documents/orbit 3` was executed as `/Users/sal/Documents/orbit`), so those failures are environmental rather than evidence against this proposal.
