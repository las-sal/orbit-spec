# External Review: bounded-closure-semantics (iteration 1)

**Reviewer**: gpt-6-astra
**Date**: 2026-09-25

## CRITICAL

### The owning specs and the shipped workflow body define the same rules twice
**File**: src/core/templates/workflows/explore.ts:407
**Description**: The proposal says `orbit-conventions` owns the format, but the body repeats the status production (lines 437-446 versus `specs/orbit-conventions/spec.md:138-146`), the Decisions production and predicates (450-464 versus 3-21), and the Mechanism grammar and closure set (468-503 versus 43-76). It also repeats `orbit-explore-modifications`' nine-move set and re-entry predicate. These are definitions of predicates and sets, not merely reader-local consequences, so each copy can be wrong on its own; this is exactly what R-crc-14 forbids. The “stated once in the body” assertion only counts occurrences inside one copy and overlooks the owning-spec copy. Delete rather than reconcile the duplicates: choose one canonical, runtime-accessible owner and have every other surface name it and point. If a generated skill cannot access the owning capability spec, that is a delivery/source-design problem to solve explicitly (or a ruling change to take explicitly), not a reason to silently carry two normative extensions.

### The three-fact re-entry table depends on an undeclared fourth fact
**File**: orbit/changes/bounded-closure-semantics/specs/orbit-explore-modifications/spec.md:46
**Description**: The table's `no staging / active change` cell says to resume against `orbit/changes/<name>/explore.md`, but line 56 immediately gives a different result when that active change has no `explore.md`: Mode B new, creating the file in the change directory. Thus resolution also depends on “does the active change contain explore.md?”, a fact absent from the declared three-fact domain and the six-cell derivation. The body repeats the same conflict at `explore.ts:377-380`, while its Mode B summary defines New only for “no staging directory AND no active change.” A caller can therefore either try to resume a nonexistent file or create it depending on which paragraph it follows. Add the missing fact and split the cell (or define the row conditionally in the one canonical table), then make the Mode B summary and edge text point to that table rather than extending it.

## WARNING

### The status production does not encode the two fixed tokens
**File**: orbit/changes/bounded-closure-semantics/specs/orbit-conventions/spec.md:140
**Description**: The production uses `exploring\b` rather than the required `exploring.` token and has no end anchor. It therefore accepts headers such as `> **Status**: exploring-bad` and arbitrary suffixes after `concluded <date>.`; the scenario at line 156 also drops the concluded token's required final period. Because re-entry and rc13b are instructed to key on this production, malformed headers can be classified as legal and the byte-for-byte token contract already disagrees inside its owning requirement. Encode the literal period and permitted working-line prose explicitly, anchor the concluded form, align the scenario text, and add negative generated-surface cases rather than only asserting that the regex string is present.

### The table matcher rejects a legal row in the change's own conformance artifact
**File**: test/core/templates/orbit-generated-surface.test.ts:356
**Description**: The member-row regex treats every pipe as a delimiter, so it rejects D-bcs-8's legal GFM-escaped `\|` inside the “move dispositions” cell (`explore.md:222`). The apply record already had to dismiss that result as an instrument error, yet the owning grammar still only says “two columns” and leaves escape semantics to rc13b. That is not sound while this stage claims a parser can be written from the grammar alone and the test is the grammar's first extension. State the GFM escape rule now in the owning grammar, update the test to parse cells escape-aware, and include D-bcs-8's row (or an equivalent shared row) so the current instrument and the successor parser cannot choose different table languages.

## SUGGESTION

### The declared interim recommendation is narrower than the behavior observed
**File**: orbit/changes/bounded-closure-semantics/specs/orbit-conventions/spec.md:114
**Description**: The known-limit paragraph says the orientation row “keeps recommending propose” until rc13b. Executing a concluded staging file with one Decision instead produced `/orbit:explore review-concluded-probe — continue capturing thinking`; `orbit status` reported `position: exploring`, and architecture status reported the cited stage as `exploring`. The ownership of the broader gap is correctly declared, but the current recommendation remains count-derived and can point to either explore or propose. Replace the repeated “keeps recommending propose” claim with that exact interim behavior so the accepted limit is truthful for every maturity cell.

## Notes

I reviewed the applied commit range, the two deltas and their archived baselines, the generated body and tests, the counter/emit/orientation/stage-state readers, and the relevant program rulings. The lenses files are absent, so the perspective and critical-path passes were skipped as instructed. The full suite, strict change validation, source validation, and fingerprint checks passed. A live concluded-workstream probe confirmed that metadata unknown keys are stripped, the counter still counts the new structure, the emit remains count-derived, and both orientation and architecture state currently ignore the concluded header. The five `five-section` source hits are complete and correspond to named successor work or the retained-title pointer. Converting task 6.2 to an at-archive note is consistent with the repository's established form and with the tracked gate's checkbox semantics; I found no quiet narrowing there.
