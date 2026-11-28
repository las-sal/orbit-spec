# External Review: cut-review-walk (iteration 1)

**Reviewer**: GPT-6  
**Date**: 2026-11-24

## CRITICAL

None.

## WARNING

### The grouped-triage instructions arrive after the preview and scoping prompt

**File**: src/core/templates/workflows/address-reviews.ts:1249  
**Description**: Step 2 tells the walker to present and number the findings, preview proposed fixes, and settle scope with the user before it loads `triage-sources.md`. That reference governs what the user is supposed to see during that same triage, including source grouping, converged findings, and the prior dispositions of a rediscovered pass. With two passes reporting the same issue, a walker following the body in order can offer two separately numbered items for one resolution or have to redo triage after the user picks a subset. Read the reference before composing the preview or asking about scope.

### A zero-entry verification refusal can miss the new read cue

**File**: src/core/templates/workflows/review.ts:1406  
**Description**: The fallback loads `verification.md` when the refusal names owed `verification` keys. If the metadata probe reads REVIEW and the engine computes VERIFICATION over a walk with only stale or deferred entries, the engine says that `verification` is owed but lists zero keys and asks for `[]` (`src/core/emit-composition.ts:1443`). The reference stays unloaded under the literal cue. The session can then retry with an empty array while retaining the whole-artifact review it already performed. Trigger the reference read whenever the refusal says the engine computed VERIFICATION, including when it owes zero verdicts.

### The reading-finding route is introduced after the ordinary write steps

**File**: src/core/templates/workflows/address-reviews.ts:1305  
**Description**: The cue to load `reading-findings.md` sits under the resolved-entry sweep step, after Step 3c has directed the walker to apply a fix and Step 3d has directed it to cascade. A wording finding against a decision record or account needs a replacement before the sweep, while a gap in the brief may need to be deferred and never reach the resolved-entry branch. Route `pass: "reading"` findings before Step 3c and have the resulting disposition determine whether the sweep runs.

### Reviewer selector validation follows steps that can already prompt

**File**: src/core/templates/workflows/review.ts:1376  
**Description**: The selector table requires validation before anything is read or written, but the body first resolves mode and target. For `/orbit:review --as architecture --external` with no doc argument, following the numbered steps reaches the architecture document picker before recognizing the invalid reviewer and mode combination. With conflicting selectors and no explicit mode, it can begin mode inference before reporting the usage error. Check selector conflicts and explicit mode restrictions before state reads or target prompts.

### A retired verbal batch invocation can exit before giving its notice

**File**: src/core/templates/workflows/address-reviews.ts:1253  
**Description**: The delta requires a one-line removal notice for both `--batch` and the retired invocation phrases. The flag notice is in the input paragraph, but the verbal notice is in Step 3. Discovery can exit with nothing to walk, and the half-landed-pair route can stop before Step 3 as well. Handle the invocation forms together before discovery so both get the notice on early exits.

## SUGGESTION

### The walk report template models a competing next command

**File**: src/core/templates/workflows/address-reviews.ts:1171  
**Description**: The newly extracted report reference shows a fixed `Suggested next` line recommending proposal review. The body directs the walker to follow the reference’s structure and separately says the engine supplies the eligibility line. Replace the hard-coded example with a placeholder for the engine’s line so the example also works for a system walk or a walk with an outstanding redesign.

## Blocks

None.

## Direction

**Disposition**: hold

The cut meets the estimated size target, and the spec deltas merge cleanly in a dry run. The handoffs still need correction where they govern decisions the session is told to make earlier, particularly selecting findings from a shared preview and replacing immutable records. The verification recovery cue also needs to cover the engine’s zero-entry refusal so the retry uses the right procedure.

## Notes

All task boxes are checked. Strict validation passed using the installed Orbit CLI, and its scenario map reported no uncovered delta scenarios, orphan declarations, or malformed declarations. An in-memory render from the reviewed source measured 4,991 estimated tokens for review and 4,981 for address-reviews using the repository’s character-based estimator. A read-only spec merge dry run accepted all six capability deltas, including the renamed walk-mode requirement. The named perspective and critical-path lens files were absent. The workflow findings come from walking the generated instructions and tracing the relevant engine paths. The full test suite and live skill sessions were not run in this checkout.

---

The workspace is read-only. I could not write the findings file, commit it, or push it. The complete report is above for manual saving.