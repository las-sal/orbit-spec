# External Review: decision-reading (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-11-08

## CRITICAL

None.

## WARNING

### The selection cutoff discards records that were never read
**File**: orbit/changes/decision-reading/specs/orbit-decision-records/spec.md:167
**Description**: Selection advances past every in-context system review emit, including one that skipped its reading. Constructed case: write ledger A, emit an in-context review with `reading` in `passes_skipped`, then request another brief. A is excluded, contradicting the review spec's promise that skipped records stay selected. Archive also reports zero unread records. Records written between rendering a brief and emitting its review disappear the same way; design.md:120 incorrectly says these will be counted unread at archive. Track which records a completed reading actually covered, preserve skipped and subsequently written records, and test both sequences.

### Independent token allocation cannot establish ordering across the two folders
**File**: orbit/changes/decision-reading/design.md:51
**Description**: The design assumes the gate's token ordering also orders decision records against review emits. Existing allocation in `src/core/emit-composition.ts` bumps collisions independently in `.orbit-runs/` and its `decisions/` child. A review and a subsequently written ledger can therefore receive the same token within one second; strict “after” selection excludes the ledger forever. Collision bumps can also place an earlier record ahead of a later write in the other folder. Define an ordering or explicit coverage mechanism valid across both folders, and add fixtures for equal tokens and collision bumps.

### Preserving an existing link can make its replacement impossible
**File**: orbit/changes/decision-reading/specs/orbit-decision-records/spec.md:95
**Description**: Replacements must retain their link fields exactly, but the write gate unconditionally refuses links to replaced targets. Constructed case: ledger A cites resolution B; B is replaced by D; a reader then requests a wording correction to A. Keeping B is refused by the replaced-target check, while citing D is refused because `relies_on` changed. The same conflict affects ledger entries and resolutions naming replaced stops. Specify that inherited, unchanged links in replacements remain valid and resolve forward, while genuinely new links must name current targets. Test all three link forms after their targets are replaced.

### Resolution uniqueness is not explicitly preserved across stop replacements
**File**: orbit/changes/decision-reading/specs/orbit-emit-composition/spec.md:27
**Description**: The uniqueness rule collapses resolution replacement chains but does not explicitly compare stop identities through their replacement chains. Constructed case: stop S has resolution B, then S is replaced by T. A new resolution naming T passes the replaced-target check, and an implementation comparing stored `stop` filenames finds no resolution naming T. It can accept a second answer to the same event. Define open/closed state and resolution uniqueness over the entire stop chain, including resolutions that still name an earlier stop version, and add this scenario.

### The clean reader receives no specified task or evaluation instructions
**File**: orbit/changes/decision-reading/specs/orbit-review/spec.md:7
**Description**: The reader must receive the rendered brief verbatim “and nothing else,” but the brief's exhaustive content table contains documents and record content, with no instruction to perform a reading, no complete reader criteria, and no response contract. The fourth reader row and severity guidance exist in the dispatching session's spec, which the clean reader does not receive. The architecture charter describes only the original three rows. Include a fixed reader instruction section in the engine-rendered brief, or explicitly permit a fixed instruction envelope around its content. Specify stable record identifiers and how returned findings map to record paths without exposing forbidden read pointers.

### Rendering cited content conflicts with the absolute ban on trail paths
**File**: orbit/changes/decision-reading/specs/orbit-decision-records/spec.md:186
**Description**: The brief must render full architecture documents, record prose and cited requirement text, yet must never contain a path under `.orbit-runs/`. Valid cited content already contains those paths: the baseline requirement `Where decision records are kept` includes complete decision-record paths before its first scenario, exactly within the required extraction range. A renderer cannot preserve that text and satisfy the prohibition. Distinguish executable read pointers from paths quoted inside source content, or define an explicit transformation and its fidelity guarantees. Test a citation of this existing requirement.

## SUGGESTION

### Specify brief failures after previously valid references disappear
**File**: orbit/changes/decision-reading/specs/orbit-decision-records/spec.md:163
**Description**: The command defines successful rendering and an empty selection, but not its behavior when selected records are malformed or cited sources have disappeared since emission. Specify exit status, diagnostics, whether partial output is allowed, and how system review records an unavailable brief. This would prevent implementations from silently treating failed rendering as nothing selected.

## Blocks

None.

## Direction

**Disposition**: hold

The reader is a useful addition, but its coverage bookkeeping currently permits unread records to disappear, and its replacement rules do not consistently preserve linked events. Resolve those semantics and make the clean reader's input contract executable before implementation.

## Notes

Strict validation with `orbit validate decision-reading --type change --strict --json --no-interactive` passed; scenario-map notices were informational. ADDED and MODIFIED requirement names match their baseline status, and no inline review markers were found in the reviewed artifacts.

The principal risk is in sequences across multiple records and review runs. The proposed scenarios mostly exercise individual successful operations; skipped readings, linked replacements and token collisions need explicit coverage.

This environment is read-only. I could not write the findings file or commit/push it; the complete markdown above is provided for manual saving and committing.