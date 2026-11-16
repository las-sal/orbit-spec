# External Review: tripwires (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-16

## CRITICAL

None.

## WARNING

### Recreating metadata resets the frozen reference
**File**: src/core/tripwires.ts:148
**Description**: The latest addition of `.openspec.yaml` is treated as a new change’s birth without checking whether the previous incarnation was archived. After apply begins, a run can commit deletion of that file, then restore it alongside widened Touchpoints or exemptions. The old apply records fall outside `sinceBirth`; the sensor now treats the change as not begun and reads the widened plan at `HEAD`. A subsequent apply commit freezes that widened reference. This defeats the promise that a run cannot loosen what watches it. Distinguish a legitimate post-archive incarnation from metadata recreation within the same change, and preserve the original fixed point in the latter case.

### An uncommitted reused name inherits the archived change’s history
**File**: src/core/tripwires.ts:151
**Description**: After change `n` is archived, creating another `n` without committing its metadata leaves the previous birth and apply commits as the latest matching history. `changeCommits` therefore returns the old change’s frozen reference instead of `uncommitted`. Its measurement also includes intervening work. Proposal reviews can consequently report unrelated deviations or write a halt stop against the old plan. Check whether the committed history belongs to the current incarnation before adopting its birth; an uncommitted recreation after archive must return `cannot-read: uncommitted`.

### Malformed readings can produce a false clean statement
**File**: src/core/tripwires.ts:352
**Description**: `isReadingList` accepts readings missing required `reference` and `frozen` fields, quiet readings with deviations, and fired readings with no deviation keys. In-memory execution confirmed all three are accepted. For a fired reading with `deviations: []`, `readTripwires` collects no keys and `renderTripwires` prints “No tripwire fired,” followed by a latest outcome of “fired.” Validate the complete reading contract and its outcome/deviation invariants, and reject malformed input naming the seam emit before rendering. Also avoid deriving a clean statement solely from the number of collected keys.

## SUGGESTION

### Document that uncommitted work can remain invisible through archive
**File**: orbit/changes/tripwires/design.md:221
**Description**: The claim that readings lag one seam and the final system review sees everything assumes commits occur between seams. `commit` defaults to false, so a committed proposal followed by uncommitted implementation can keep producing quiet readings through system review. The archive reading also precedes the archive tail’s commit. Document this potentially indefinite blind spot and qualify the brief’s clean wording as applying to committed work only.

## Blocks

None.

## Direction

**Disposition**: hold

The reference needs a durable change identity before it can support the promised protection against mid-run widening. The brief should also reject contradictory readings rather than turn them into a clean claim. These issues affect the trustworthiness of the sensor’s evidence and the decisions made from it.

## Notes

Reviewed the change range beginning at `c3617bb0`, the proposal, design, checked tasks, delta specs, affected baseline contracts, implementation, and downstream decision and brief readers. No root convention files or named perspective and critical-path lens files were present.

Scenario coverage verification and strict validation were not run successfully: both CLI invocations failed at startup because `dist/cli/index.js` is absent. Dependencies are also absent, and the read-only environment prevents building or installing them. No scenario coverage was inferred from test files. The reading-validator probe ran directly against the source in memory; history findings are based on static tracing. `git diff --check` passed.