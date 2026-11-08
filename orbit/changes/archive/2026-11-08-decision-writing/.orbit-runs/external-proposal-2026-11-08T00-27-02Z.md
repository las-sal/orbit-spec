# External Review: decision-writing (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-07

## CRITICAL

None.

## WARNING

### Generated instructions omit the information needed to write valid records
**File**: orbit/changes/decision-writing/specs/orbit-conventions/spec.md:10
**Description**: The shipped statement names commands, conditions and areas, but supplies neither payload schemas nor a shipped reference explaining them. An adopter cannot learn from it that `model` is required, `alternatives` is an array, citations have specific object shapes, or stop links use filenames. `orbit emit` help exposes the payload channel, not these schemas. The design explicitly assumes adopters lack this repository's specs and parser, yet its implementation tasks add no equivalent reference. Ship a shared decision-record reference with valid payload examples, citation forms, link conventions and the plain-language writing rule, and make each body load it when recording a decision. Verify those examples against the write gate.

### The shipped ledger trigger excludes calls that required asking the user
**File**: orbit/changes/decision-writing/specs/orbit-conventions/spec.md:10
**Description**: The fence requires a ledger entry “AFTER a call made without asking,” then includes “for a call that needed a stop” inside that instruction. A call made after asking does not satisfy the opening trigger. For example, an unprecedented security decision produces a stop and resolution, but the generated instruction can reasonably be followed without writing its ledger entry. The normative table at line 24 requires that entry, and `Three decision records, one job each` requires recording every qualifying call. Make the shipped trigger explicitly cover both calls made without consultation and calls made after a stop is answered. Add a scenario covering the complete stop → answer → resolution → ledger sequence.

### Universal recording has no scope rule for workflows without a change or doc
**File**: orbit/changes/decision-writing/specs/orbit-conventions/spec.md:10
**Description**: Every epitome receives the instruction, but its only recording targets are `--change` and architect-session `--doc`. Existing workflows include project-wide `/orbit:audit-drift` and address-reviews sessions without a change anchor. If such a session encounters an `unresolvable-critical` condition, the discipline requires a stop before asking, while `Where decision records are kept` explicitly provides no project-wide record location. The proposal does not say whether to skip recording, select existing work, or establish new work; inventing a target would misattribute the event. Define the behavior for sessions without an eligible scope, carry it in the generated instructions, and add a scenario demonstrating it.

## SUGGESTION

### Onboard exception conflicts with the program’s universal exit criterion
**File**: orbit/changes/decision-writing/design.md:54
**Description**: D4 intentionally gives onboard only a descriptive mention and excludes it from statement parity. The architecture stage’s exit criterion says every generated skill carries the discipline, held by parity against one owning statement; the modified every-mode requirement likewise says every generated workflow body carries it. The read-only onboard exception is reasonable, but these contracts should explicitly distinguish descriptive onboarding from executable discipline instructions so completion does not depend on interpreting “every” differently across documents.

## Blocks

None.

## Direction

**Disposition**: hold

The instruction needs to be executable from an adopter’s installed surface and consistent about which events require records. Resolve the payload-reference gap, the consulted-call trigger and the missing-scope behavior before implementation; otherwise byte parity can preserve text that still produces incomplete or misattributed trails.

## Notes

Compared every modified requirement with its archived baseline and checked the new instruction against the decision-record shape and link checks, emit CLI, workflow templates and architecture charter. No unresolved inline review markers were found in the proposal artifacts.

Strict validation could not execute because this checkout lacks `dist/cli/index.js`; that is an environment limitation, not evidence of an artifact validation failure.

---

The environment is read-only. I could **not** write the findings file, commit, or push. Save this review manually as `orbit/changes/decision-writing/.orbit-runs/external-proposal-2026-11-08T00:21:58Z.md`.