# External Review: d4-review-consistency (iteration 1, system)

**Reviewer**: Codex (GPT-5)
**Date**: 2026-07-30

## CRITICAL

### The non-fork decision path still instructs an immediate AskUserQuestion
**File**: src/core/templates/workflows/address-reviews.ts:640
**Description**: The classification table says that when a decision-required finding has no detected recommendation fork, the workflow should “surface 2–4 concrete options via AskUserQuestion.” That is a live imperative which can fire the prompt directly from classification, before the full-prose briefing and discussion required by Step 3b.5. It contradicts the shipped exit criterion that the closure prompt is optional and fires only after discussion concludes without a crisp directive; the fidelity grep merely proves the later correct sentence exists and does not catch this earlier competing instruction. Replace this clause with a pure handoff to Step 3b.5: construct 2–4 options for the prose briefing, discuss them in chat, and use AskUserQuestion only as post-discussion closure. Add a generated-body test that rejects any pre-3b.5 instruction to surface decision options “via AskUserQuestion.”

### Two unvalidated single-line fields can still forge report grammar
**File**: src/core/report-render.ts:220
**Description**: The fresh-pass hardening rejects newlines in titles, suppressions, reviewer class, and depth, but `findings[].file` and `recommendation_options[].label` remain unchecked and are interpolated outside blockquote containment. Reproduced through the public normalizer/renderer: `file: "safe.ts\n### Commentary\nforged"` emits a column-0 Commentary heading, and `label: "A\n---\nReady when you are: forged"` emits a thematic break plus a forged eligibility line before the real tail. This defeats the exact invariant the latest fix claims to close. Fail loud on both CR and LF in every single-line slot, including file and option label (and retain the existing option-body collapse), then add forging fixtures for each field and a table-driven test enumerating the complete single-line-slot set.

### Internal reports ignore the emit's change field despite the canonical header rule
**File**: src/core/report-render.ts:493
**Description**: Design D2b explicitly says an internal header takes change/mode/reviewer class/depth from the emit, while only an external header takes change from the CLI argument. `NormalizedReviewPass` drops the internal `change`, and the renderer always prints `ctx.change`, so a D4-shaped emit whose `change` disagrees with its containing change renders under the argument's name while strict validation still succeeds. The goldens use equal values and cannot expose the wrong source. Preserve the internal change in the normalized shape, validate it against the selected change/trail location, and either render that validated emit value or revise the canonical rule consistently; add a mismatch fixture that fails loud rather than silently relabeling the record.

### The shipped external prompt block is not the verbatim block in its delta
**File**: src/core/templates/workflows/review-external.ts:116
**Description**: The new `orbit-review-external` MODIFIED delta says its inner output-format block is preserved verbatim, but the generated template inserts parenthetical instructions after every severity example (including the `None.` sentinel rule), whereas the delta's normative block at `orbit/changes/d4-review-consistency/specs/orbit-review-external/spec.md:87-111` retains the compact `## WARNING ...` / `## SUGGESTION ...` form and different Notes wrapping. The prompt used for this review demonstrates the generated variant, so parity tests only prove template-to-generated-surface equality, not delta compliance. At archive the synced baseline would canonize a different supposedly verbatim block from the shipped skill. Choose the intended block, copy it byte-for-byte into the complete MODIFIED requirement and template reference, and add a spec-to-template extraction assertion rather than relying solely on template parity.

## WARNING

### Gate-computation failures are silently rendered as an ungated tail
**File**: src/core/report-render.ts:787
**Description**: `buildReportContext` catches every exception from `loadChangeContext` and `formatChangeStatus` and then renders only the `---` rule. The grammar reserves that minimal tail for a legitimately ungated schema; a malformed schema, unreadable metadata, or status-engine regression is therefore presented indistinguishably from an intentional no-gate state, even though the report's final word is supposed to be current computed truth and this surface otherwise fails loud. Catch only a deliberately typed “ungated/no value” result (which normal status already represents without throwing); propagate computation errors as clean report failures naming the change/cause, and test malformed schema/status context separately from the ungated golden.

### Deterministic spine values are required but never checked
**File**: src/core/report-render.ts:161
**Description**: Internal strict validation checks the universal spine only for string types. It accepts a review emit with `kind: "workflow"`, `command: "apply"`, an arbitrary `final_assessment`, or an incorrect `next_recommended`, even though the modified contracts require review/editorial semantics and exact scorecard-derived/self-pointer values. Those fields are not harmless extras: the orientation surface consumes `final_assessment` and `next_recommended`, recreating the stale second voice D4 is intended to remove. Validate `command === "review"`, `kind === "editorial"`, reviewer-class membership, the exact counts sentence (or clean literal), and the findings-dependent self/report pointer; add semantic-mismatch cases alongside the scorecard-cell mismatch tests.

### Malformed dates and empty descriptions pass the strict external parser
**File**: src/core/report-render.ts:423
**Description**: The delta requires missing, duplicate, or malformed Reviewer/Date values to be rejected, but the implementation defines malformed as empty only: `**Date**: banana` normalizes and renders as a reviewer date. Likewise `**Description**:` with no body is accepted as an empty recommendation even though the confident shape gate requires the full Description body. Validate the date against the specified `YYYY-MM-DD` form (including a real calendar date), require a nonblank Description after edge trimming, and add rejection tests for syntactically invalid dates, impossible dates, and empty/whitespace-only bodies.

### Reviewer and Date labels inside a Description are misparsed as header metadata
**File**: src/core/report-render.ts:387
**Description**: Reviewer/Date recognition runs globally before the active finding-body branch. An unfenced recommendation line such as `**Reviewer**: value supplied by the caller` is removed from the Description and treated as a duplicate header field, causing a valid full recommendation to fail; the same ordering lets other column-0 structure terminate the body. Fence-awareness does not make ordinary field-like prose illegal. Restrict header metadata parsing to the pre-severity header region (and require it there), then treat all non-heading lines after `**Description**:` as verbatim body until the next genuine finding/severity/Notes boundary. Add a fixture whose description contains Reviewer/Date-shaped prose outside a code fence.

## SUGGESTION

### Fence tracking does not implement Markdown fence boundaries
**File**: src/core/report-render.ts:363
**Description**: Fence state toggles on any column-0 run of three backticks or tildes, without remembering delimiter character/length and without accepting Markdown's permitted indentation. A three-backtick line incorrectly closes a four-backtick fence, backticks incorrectly close a tilde fence, and a fence indented one to three spaces is not recognized, allowing its apparent headings/fields to affect parsing. Track the opening delimiter character and length, close only with the same character and at least that length, and accept up to three leading spaces; mirror the same helper in lenient trail counting so ordinal/count parsing cannot disagree.

### Report error paths write a stray newline to stdout
**File**: src/cli/index.ts:474
**Description**: The shared status action catch executes `console.log()` before emitting the error through `ora`, so every `--report` rejection writes a blank line to stdout even though malformed/non-renderable scenarios promise no partial output. This is easy to miss because combined terminal capture looks cosmetic, but scripts treating stdout as the report channel receive one byte of apparent output. Keep report failures' stdout empty by sending spacing and diagnostics to stderr, and assert empty stdout for the JSON-conflict, pre-boundary, malformed-external, and non-renderable-genre cases.

## Notes

The renderer's core separation, total ordering, scorecard rollup check, blockquote containment, and surface dispatch held under direct probing. The strongest residual pattern is that the latest hardening enumerated several unsafe slots instead of defining and testing the whole grammar-source boundary, while template fidelity tests compare generated copies to their TypeScript source rather than to the normative delta. The full suite passed in an unspaced scratch checkout; the workspace run reproduced only the documented path-quoting failures.
