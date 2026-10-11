# External Review: rc02-gate-semantics (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-14

## CRITICAL

### The gate parser can still certify severity headings that exist only inside a CommonMark fence
**File**: src/core/artifact-graph/trail.ts:371
**Description**: `parseExternalMarkdown` remembers only the fence character and closes an open fence on any later run of that character. It does not require the closing run to be at least as long as the opener or to have only whitespace after it. Executed against the real engine: an external file with a canonical header and reviewer, then a four-backtick fence containing a three-backtick line followed by all three severity headings, is rejected by `normalizeExternalPass` because the headings remain fenced under CommonMark, but `readTrail` admits it as a clean external pass. Adding a clean fresh member and the trailing in-context pass makes `computeGateStates` report the system gate passed even though no real external findings sections exist. This reopens false convergence at the exact boundary the prior walk intended to harden. Move the CommonMark fence tracker to a shared parser utility and use it here (same character, closing length at least the opener, whitespace-only suffix, at most three spaces of indentation), then add a full-gate regression with a four-backtick outer fence and a shorter delimiter inside it.

## WARNING

### The gate accepts malformed findings that the supported ingestion path refuses
**File**: src/core/artifact-graph/trail.ts:399
**Description**: Within a severity section, every `###` line increments the count and creates a finding immediately; `**File**:` is optional in practice and `**Description**:` is never validated. A constructed WARNING containing only `### Truncated warning` is therefore a cadence-eligible external pass with `file: ""`, while the canonical external parser and the `--from-file` contract reject the same artifact for missing the required fields. The gate can consequently recommend resolving a pass that the supported walk cannot ingest. Make external shape validation consistent at the shared boundary: every finding counted by the gate must have the strict `###` / `**File**:` / nonblank `**Description**:` triple, while the documented empty-severity sentinel remains valid.

### Blocked reviewed gates erase spend that already exists on disk
**File**: src/core/artifact-graph/gates.ts:647
**Description**: The blocked-gate branch hardcodes `independentSpend` and `independentSpendFresh` to zero instead of counting the trail. Executed with an unchecked tracked task plus one fresh and one external system pass: `readTrail` sees both passes, but the blocked `review-system` row reports `0/3`. The budget requirement says the reported figure counts independent passes on the gate's mode across the whole trail; blocking on `requires` is not an exemption, and reviews can be run before the tracked gate completes or under an override. Factor budget counting out of `computeReviewedStatus` so blocked reviewed gates report their real totals; keep the exhaustion boolean false while the reviewed pass condition is not runnable if that is the intended state rule.

### Open-pair precedence suppresses a safe walk even when no pair member stands
**File**: src/core/artifact-graph/gates.ts:467
**Description**: `evaluateReviewed` sets `openPair` for `none-standing` as well as for a missing partner, then returns it alongside any unresolved pass; `canonicalNextForReviewed` lets that value outrank resolution unconditionally. Executed with a substantive fresh pass followed by an apply token: the pass is stale and unresolved, the current-state coverage list contains no pairable member, yet the reason says the pair is open and directs another review before walking the stale finding. Walking that stale pass cannot foreclose a future pair because neither future member exists and the resolution references neither of them. The normative precedence rule is explicitly limited to “a PAIRABLE member standing.” Attach the precedence override only for `no-fresh` / `no-external`; retain the `none-standing` explanation for a pure coverage failure, but let a safe outstanding resolution run first.

### The terminal gate row drops all budget data for superseded reviewed gates
**File**: src/commands/workflow/status.ts:198
**Description**: `printStatusText` returns early for a superseded gate before composing the spend suffix. The JSON projection for this change reports proposal spend (`budget: 3`, five total independent passes), while the human row renders only `(past — phase already ran)`. That contradicts the requirement and task 4.2 that the human gate-row projection carry the budget fields, and it hides historical cost precisely though reported spend is defined across the whole trail. Preserve the subdued `(past)` rendering but append the same spend suffix, including fresh versus total, before continuing.

### Canonical resolution paths break when an ancestor directory is named `orbit`
**File**: src/core/artifact-graph/gates.ts:859
**Description**: `toRepoRelPath` finds the first `"/orbit/"` substring in an absolute findings path and slices there. In this checkout (`.../orbit/orbit/changes/...`), rendering this review produced `--from-file orbit/orbit/changes/rc02-gate-semantics/...`, but the repository-relative artifact is `orbit/changes/rc02-gate-semantics/...`; the emitted command points at a nonexistent file. The same failure occurs whenever any directory above the project root is named `orbit`. Compute the path with `path.relative(projectRoot, absFile)` using an explicit project-root value (or derive that root structurally from `changeDir`) rather than searching the absolute path for a magic segment, and add a checkout-under-`orbit` regression.

## SUGGESTION

### The design pseudocode still specifies an exclusive blindness interval
**File**: orbit/changes/rc02-gate-semantics/design.md:200
**Description**: D4's pseudocode uses `min(token(P1), token(P2)) < token(R) < max(...)`, while the delta and implementation require endpoint-inclusive blindness so a same-token resolution fails safe. The surrounding design prose later describes the inclusive behavior, leaving two algorithms in the same design. Change the pseudocode operators to `<=` or replace the predicate with a pointer to the normative decision procedure.

## Notes

Structural checks were otherwise clean: strict validation passed for all 21 changes/specs, fingerprints verified 8/8, the targeted 56 cases and the full 2,097-test suite passed, and the measured size remains three capabilities, ten requirement blocks, 58,485 delta bytes, and 18 task checkboxes (15 complete plus three declared user-validation handoffs). The archive probe read all 15 archived changes and classified the 101 resolution records as 46 readable and 55 fallback-shaped, including the eight counter objects, one empty array, and two records without the key. The cadence memo's consumed-set omission remained consistent with its strict-token invariant, including the pair's earlier member, and the long-cadence probe terminated well inside its bound. `orbit/lenses/` does not exist, so the perspective and critical-path passes were skipped as instructed. The main remaining risk is duplicated parsing logic: the strict report parser already implements the CommonMark and finding-shape rules, but the lean gate parser has drifted to a materially weaker language.
