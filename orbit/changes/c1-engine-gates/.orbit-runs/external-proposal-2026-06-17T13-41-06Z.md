# External Review: c1-engine-gates (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-17

## CRITICAL

None.

## WARNING

### Proposal summary still states the old convergence rule
**File**: orbit/changes/c1-engine-gates/proposal.md:24
**Description**: The high-level "Computed review convergence" bullet still says a reviewed gate passes when "every cadence-required reviewer class" has a fresh resolved pass and the latest independent iteration yielded 0 CRITICAL and 0 new findings. That is the pre-remediation rule: it treats cadence as a class set rather than ordered slots, and it omits the per-gate `confirm` predicate that lets `review-system` pass with `confirm: findings-resolved` after a no-CRITICAL external's findings are resolved. This contradicts `design.md`, `tasks.md`, and `specs/orbit-engine-gates/spec.md`, and it reintroduces the exact system-gate contradiction the prior internal review resolved. Update this bullet to describe ordered cadence slots plus per-gate `confirm` (`review-proposal: no-new-findings`; `review-system: findings-resolved`), or replace the abbreviated rule with a pointer to the engine-gates spec.

### Override recording is not wired into the emit and archive summary schemas
**File**: orbit/changes/c1-engine-gates/specs/orbit-engine-gates/spec.md:241
**Description**: The inflection-prompt contract requires proceeding past an unpassed/stale gate to be recorded in the command run summary as `gate_overridden: {gate, state, reason}`, and `tasks.md` applies that to both apply and archive. But the change never modifies the per-command summary contracts that implementers will follow: `orbit-run-summary-emit`'s `Apply per-chunk-end emission` field list still has no `gate_overridden`, and `orbit-archive-modifications` leaves `Archive run summary written` plus `Archive summary schema reference ships with the skill` as closed-looking baseline contracts whose reference lists only the existing archive fields. A fresh implementer could satisfy those unchanged summary schemas while omitting the gate override audit trail. Add MODIFIED deltas for the apply emit extension list and the archive summary/schema-reference requirements, making `gate_overridden` optional when no override occurs and required when the user chooses proceed-anyway at the gate prompt; also update the archive reference/body examples so the generated skill documents the field.

## SUGGESTION

None.

## Notes

`node bin/orbit.js validate c1-engine-gates --strict` passes after a local build, and no `@review:` marker residue was found under the change directory.
