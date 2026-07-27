# External Review: d4-review-consistency (iteration 2)

**Reviewer**: Codex (GPT-5)
**Date**: 2026-07-27

## CRITICAL

### The external Notes contract changes an untouched baseline requirement
**File**: orbit/changes/d4-review-consistency/tasks.md:89
**Description**: Task 3.5 changes the literal `## Notes` instruction in `orbit-review-external`'s reference prompt, but this change has no `orbit-review-external` delta at all. The current baseline requires the output-format block to be preserved verbatim (`orbit/specs/orbit-review-external/spec.md:71-74`, with the exact Notes placeholder at lines 142-145, reinforced by the verbatim scenario at lines 180-183). Calling the format “otherwise unchanged” does not authorize changing text that the baseline explicitly freezes. Add a MODIFIED `orbit-review-external` requirement carrying the complete reference-template requirement and scenarios with the new Notes wording, then add the baseline to the fingerprint manifest and account for the new delta in proposal/task counts.

### The advertised legacy-render path rejects real repository history
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:113
**Description**: Strict validation requires every internal review emit to have the universal spine and a scorecard, while the same delta promises that a “pre-capability” legacy emit renders successfully and the design claims pre-D4 emits carry the required shapes. Repository history disproves that premise: `orbit/changes/archive/2026-06-11-b2-grow-generator/.orbit-runs/review-proposal-2026-06-11T15-19-44Z.json` has `findings_summary` but no scorecard and no findings entries, and several D2/D3 review emits have a scorecard but no `kind`. This also contradicts `orbit-conventions`' line 47 promise that readers tolerate both generations; for the oldest shape, even severity totals cannot be recovered from `findings[]` because the array is empty. Specify an explicit legacy normalization/migration policy (including what happens when only flat `findings_summary` exists), or scope `--report` to a documented post-D4 compatibility boundary and remove the legacy-success/two-generation-tolerance claims. Pin fixtures from the actual archived generations rather than a synthetic no-commentary-only fixture.

### Equal-token passes have no single as-of order
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:64
**Description**: Iteration is defined as the count of same-mode passes with token `<=` the rendered token and trend is defined in token order, but artifact selection later declares a filename tie-break for equal tokens. Two passes in the same second therefore each include both artifacts, receive the same iteration, and cannot make “the rendered pass itself” the unique final trend point. Current trail sorting also returns equality for equal tokens (`src/core/artifact-graph/trail.ts:126`), so filesystem order can leak into the result. Define one total pass order—token plus the shared full-filename tie-break—and use that exact order for newest selection, explicit-token resolution, trail ordinal, prior-pass matching, and the as-of trend prefix. Add an equal-token golden that asserts iteration and trend, not only CLI selection.

### The required ungated tail asks the engine for values it does not compute
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:43
**Description**: For an ungated schema the grammar omits only the gate line and still requires Position and eligibility to render from “whatever the engine computes.” The existing status computation explicitly leaves `position` and `next_command` undefined whenever the schema has no gates (`src/core/artifact-graph/instruction-loader.ts:389-457`), while design D2b prints both tail lines unconditionally. An implementer cannot transcribe the mandated ungated golden without inventing values outside the engine contract. Define the ungated grammar concretely: either omit all unavailable tail fields, specify deterministic fallback values and add them to the status computation, or fail this surface for ungated change schemas. Update D2b and the golden task to the same choice.

### The scorecard can contradict the findings while passing strict validation
**File**: orbit/changes/d4-review-consistency/specs/orbit-review/spec.md:54
**Description**: The emit stores both a 3-by-3 scorecard and `findings[]`, but findings have no dimension field and strict validation checks only the two shapes. A type-correct emit can therefore render a scorecard with zero criticals alongside a CRITICAL finding, put counts in the wrong dimension, and produce a `final_assessment` and trend from counts that disagree with the visible findings—the exact class of multi-voice contradiction D4 is meant to remove. Give each finding an owning dimension (or define another auditable mapping), require non-negative integer scorecard cells, and validate that every dimension/severity cell equals the active findings rollup with suppressed findings excluded before persistence/rendering. Add mismatch fixtures that must fail without a partial report.

### `finding_titles` is required by conventions but absent from the review contract and work plan
**File**: orbit/changes/d4-review-consistency/specs/orbit-conventions/spec.md:47
**Description**: The modified conventions require `finding_titles` whenever editorial findings are present and repeat that requirement in the canonical example/scenario, but the modified `orbit-review` emit requirement lists `scorecard` and full `findings[]` without `finding_titles`, and tasks 3.1/3.4 never instruct the generated review body or schema reference to emit it. The current review template schema contains no `finding_titles` contract, so applying the listed work can satisfy `orbit-review` while violating `orbit-conventions`. Either retire `finding_titles` for review as redundant with `findings[].title`, or add it explicitly to the review requirement, schema-reference task, generated-body instructions, and consistency tests.

## WARNING

### Arbitrary verbatim recommendation markdown can escape the Findings section
**File**: orbit/changes/d4-review-consistency/design.md:73
**Description**: Recommendations and external Description bodies are rendered verbatim with only two spaces of indentation. CommonMark accepts headings and fenced-code markers with up to three leading spaces, so a recommendation containing `## CRITICAL`, `### Commentary`, `---`, or a fence can create apparent report sections or tail delimiters despite the promised invariant section order. Fence-aware ingestion does not protect the renderer from source content. Define an unambiguous containment/escaping representation that preserves the source text, and add goldens with multiline recommendations containing headings, thematic breaks, and fences.

### External parse confidence does not require the header fields the renderer needs
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:113
**Description**: An external pass is declared valid when the parser recognizes the header and all three severity sections, but the rendered header also requires parsed reviewer name and date. Task 1.5 says to parse those fields without saying their absence is a parse rejection, so a file can pass the stated shape gate yet lack values required by the grammar. Make `**Reviewer**` and `**Date**` mandatory, uniquely parsed, fence-aware fields for a renderable external pass; define clean errors for missing/duplicate/malformed values and cover them in parser and CLI tests.

### Handoff evidence notes conflict with the deterministic review assessment field
**File**: orbit/changes/d4-review-consistency/tasks.md:122
**Description**: Task 5.4 requires dated R-d-9 evidence notes in the corresponding emits' `final_assessment`, while the modified review contract fixes that field to exactly the scorecard-derived counts sentence (or `No findings.`) and prohibits narrative verdict content. At seams where the corresponding evidence carrier is a review emit, both rules cannot hold. Name the exact emit genre used at each seam and keep review `final_assessment` deterministic; if review emits must carry handoff evidence, introduce a separate structured or interim evidence field rather than appending prose to the counts sentence.

## SUGGESTION

## Notes

The proposal is substantially more explicit than the prior cadence, but several newly added resolutions do not yet compose with the existing baselines and historical trail data. Build, strict Orbit validation, architecture exit-criteria display, and fingerprints succeeded. The full test run reached the repository's documented spaced-workspace-path failure class: subprocesses split `/Users/sal/Documents/orbit 3 2/bin/orbit.js` at the first space, while the rest of the suite continued successfully.
