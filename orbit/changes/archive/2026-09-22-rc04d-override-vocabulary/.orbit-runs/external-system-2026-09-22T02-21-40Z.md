# External Review: rc04d-override-vocabulary (iteration 1)

**Reviewer**: Codex (GPT-5)
**Date**: 2026-09-21

## CRITICAL

### The archive ownership pointer does not survive the successor it is meant to bridge
**File**: orbit/changes/rc04d-override-vocabulary/specs/orbit-engine-gates/spec.md:75
**Description**: The new invariant wording says the override record's shape is owned by `orbit-archive-modifications` for the archive emit, but the live archive capability says the opposite for the successor record: `orbit/specs/orbit-archive-modifications/spec.md:62-65` explicitly says the archive `judgements` entry's "shape and carrier [are] both defined by `orbit-run-summary-emit`", and `orbit/specs/orbit-run-summary-emit/spec.md:665-704,759-768` centrally defines that entry, its continuation fields, and archive as a carrier. Today an archive can carry both the legacy field and that successor entry, so the de-named singular "record" is already ambiguous; after rc04c retires the legacy field, the only remaining record is unambiguously shaped by `orbit-run-summary-emit`, making the claimed archive owner false. This breaks task 1.2/design D2's load-bearing assertion that the clause is true both before and after rc04c. Rewrite the clause to separate ownership of the command-specific obligation to emit from ownership of the payload shape: the archive capability can own WHEN archive emits the record, while the carrier-owning capability owns its concrete shape. If the sentence must remain invariant across the migration, avoid hard-coding a command capability as the shape owner.

## WARNING

### The architecture charter still carries the rejected single-owner wording
**File**: orbit/architecture/clean-up-review-cycle.md:1470
**Description**: The live rc04d charter still says the de-named form is "shape owned by `orbit-run-summary-emit`", while the applied delta, proposal, and design say the correction is the two-owner form. This is the same stale single-owner wording task 3.3 flags in the sibling rc04c exploration, but task 3.2's architect handoff omits the copy in the live program that every stage is told to read first. Record an additional architect recommendation in task 3.2 to reconcile this charter sentence with the final ownership model; otherwise the program remains a contradictory source of truth even if the delta is corrected.

## SUGGESTION

None.

## Notes

I mechanically split each MODIFIED requirement and its live baseline on requirement and scenario headings, compared scenario-title sets, and diffed the bodies. All 27 scenarios are preserved (20 in `orbit-engine-gates`, 2 in `orbit-pr-lifecycle`, and 5 in `orbit-conventions`), with only the five declared wording substitutions. The full change diff touches neither `src/` nor `test/`; the current apply and archive workflow bodies still write `gate_overridden`, and the content-fidelity tests pin body markers rather than specification prose. `npm run build`, all 2,238 tests, strict validation, and the five-entry base-fingerprint check completed successfully. `orbit/project.md`, root convention files, and `orbit/lenses/` are absent as the prompt states, so the lens passes were skipped.
