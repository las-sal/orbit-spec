# External Review: rc13b-explore-maturity-signal (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-25

## CRITICAL

### `rules_open` conflates open live rules with malformed non-rules, so the rung has no correct predicate
**File**: orbit/changes/rc13b-explore-maturity-signal/specs/orbit-emit-composition/spec.md:25
**Description**: `rules_open` is simultaneously the set of live rules with open domains and the set of all malformed entries. The single `malformed` state covers a malformed Mechanism entry belonging to a unique live rule, a duplicate Decisions ID, and an orphan Mechanism entry, while the maturity text excludes every `malformed` entry from K but uses `rules_open` non-emptiness to select Unaccounted. A live rule with a bad table, missing move, or unknown closure therefore contributes to R but not K (so the string can report `0 of R` open even though that rule is open); conversely, an orphan or duplicate alone selects Unaccounted even when no live rule has an open domain. The appended `open domains` record also mislabels these key defects, and a BOUNDED entry missing a residual slot overlaps `bounded-incomplete` with the owning grammar's MALFORMED classification. Make the model discriminated and disjoint—for example, distinguish live-rule failures from key defects (or carry an explicit `live_rule` discriminator), state precedence for BOUNDED-incomplete, drive the rung/K/open-domain suffix only from open live rules, and report non-rule malformations in their own clause. Add isolated fixtures for a malformed unique live rule, orphan-only, duplicate-only, and BOUNDED-incomplete so none can pass through the same ambiguous branch.

## WARNING

### The new parser is directed toward a fence scanner that is not CommonMark-correct
**File**: orbit/changes/rc13b-explore-maturity-signal/design.md:76
**Description**: D-rc13b-8 says the parser shares `explore-counter`'s fence tracking, but `src/core/parsers/explore-counter.ts:46-55` is a local implementation that remembers only three delimiter characters. It closes a four-backtick fence on an inner three-backtick line and also accepts indentation beyond CommonMark's three-space limit. Executing the current counter over a valid four-backtick outer fence containing a three-backtick example caused a fenced Decisions item to be counted while the live item after the real closer was hidden. That violates the delta's unconditional “fenced content is never structure” rule and would let a fenced Mechanism decoy change accounting. Require both the counter and the new rule parser to import `createFenceTracker` from `src/core/markdown-fence.ts`, and add a four-backtick/three-backtick near-miss fixture (plus the indentation boundary) rather than only an ordinary fenced decoy.

### The first-line-prefix opener rule lives outside the specification that owns the production
**File**: orbit/changes/rc13b-explore-maturity-signal/specs/orbit-emit-composition/spec.md:43
**Description**: The change names `orbit-conventions` as owner of the Decision-entry production, but defines the materially different “first-line prefix; closing `**` may be later” well-formedness rule here, in the consuming capability. The proposed module-to-spec parity check compares only the fenced production from `orbit-conventions`, so it cannot detect drift in this extra matching rule; the generated authoring surface also mirrors the owner's full opener rather than this consumer-side interpretation. Design's promise that `orbit-conventions` will point at the rule “on its next touch” leaves the archived baseline with two authorities in the meantime, contrary to R-crc-14. Put the prefix/wrapping rule in the owning `orbit-conventions` requirement and make the module extend that owner, or explicitly reduce/split scope to remain under the capability ceiling; do not defer the ownership repair while shipping the parser that depends on it.

### MALFORMED identifiers have contradictory rendering rules
**File**: orbit/changes/rc13b-explore-maturity-signal/specs/orbit-run-summary-emit/spec.md:14
**Description**: The normative bound says every MALFORMED entry renders as `line <n>`, and task 3.1 repeats that rule, but this requirement's orphan scenario renders `D-x-9` and the emit-composition scenario renders `D-foo-9`. A duplicate ID especially needs its line to distinguish the second occurrence, while an orphan's ID is useful context; a fresh implementation cannot satisfy both forms. Define one rule, preferably `id at line <n>` when both are present and `line <n>` when no ID exists, then update the Unaccounted/malformed examples and task assertions to the same representation.

## SUGGESTION

### The new spec-parity test ignores the active-delta owner used by the existing mirror test
**File**: orbit/changes/rc13b-explore-maturity-signal/tasks.md:4
**Description**: Task 1.2 hard-codes `orbit/specs/orbit-conventions/spec.md`, while the existing generated-surface parity test deliberately resolves one active delta as the owner-to-be and falls back to baseline only when no delta holds the block. A later change to any production would otherwise have to choose between failing module-to-baseline parity before archive and leaving the module/body stale against the active delta. Reuse the existing single-active-owner lookup (or a shared helper) so spec → module → body parity remains enforceable during ordinary change development as well as after archive.

### The Accounted residual list is unordered and unbounded
**File**: orbit/changes/rc13b-explore-maturity-signal/specs/orbit-run-summary-emit/spec.md:12
**Description**: The Accounted string lists every BOUNDED residual ID, but `residuals` has no normative order and only the open-rule list receives the three-item prose bound. Different implementations can choose Decisions order or Mechanism-heading order, and a large exploration can produce an arbitrarily wide orientation line—the consumer that motivated bounding the neighboring list. State the `residuals` array order and either apply the same first-three-plus-`+N more` render or explicitly accept an unbounded string with a test.

### The recorded Mechanism still contains two pre-amendment claims
**File**: orbit/changes/rc13b-explore-maturity-signal/explore.md:104
**Description**: D-rc13b-4 still says both `date` and `re_entry` are present iff concluded, contradicting the walked rule that `re_entry` is absent when no live slot exists. D-rc13b-9's CONFORM line at 183 still permits reading “the header line of a file,” contradicting the same entry's trail-only amendment and its next line's “zero new file reads.” Amend these two Mechanism cells to the settled shapes so the recorded mechanism remains a reliable implementation input rather than preserving the exact ambiguities the proposal walk resolved elsewhere.

## Notes

The structural surface is healthy: strict validation passes, all five baseline fingerprints verify, every MODIFIED block preserves or deliberately re-cuts its baseline scenarios, and no `@review:` marker remains. The dominant residual risk is at representation seams: the parser's one array currently carries facts with different semantic roles, while two grammar details sit outside the parity/ownership boundary intended to keep extensions aligned. I also executed the archived-fixture claims and a nested-fence counterexample rather than relying only on prose inspection.
