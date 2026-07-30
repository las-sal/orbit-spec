# External Review: d4-review-consistency (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-07-22

## CRITICAL

### Suppressed findings are simultaneously required in and excluded from the report
**File**: orbit/specs/orbit-review/spec.md:321
**Description**: The untouched `Pushback discipline on stale findings` scenario says a stale finding is "not included in the user-facing report", while the new `orbit-report-rendering` grammar requires a suppressed-findings section with evidence and task 3.4 explicitly says suppressions are now first-class report content. Archiving these deltas would leave contradictory live requirements. Add a MODIFIED delta for `Pushback discipline on stale findings` (preserving its other behavior and scenarios) that distinguishes omission from active findings/counts from inclusion in the dedicated suppressed-with-evidence section, and add the requirement to the fingerprint/task accounting.

### Non-fork decisions have nowhere to record their ratification channel
**File**: orbit/changes/d4-review-consistency/specs/orbit-address-reviews/spec.md:82
**Description**: This paragraph requires every decision-lane resolution to record `ratified_via`, but the only defined location is inside `recommendation_fork`, which lines 202–208 make present only when a fork was detected. Lines 116–119 and 243–246 then explicitly require a non-disjunctive decision-lane finding to omit `recommendation_fork`. Such a finding can be ratified by chat or prompt but cannot satisfy the recording requirement. Put `ratified_via` (and the ratified resolution needed for off-menu/non-fork cases) on every decision-lane resolution, or define a separate decision record common to forked and non-forked decisions; then align all scenarios, the reference schema, and task 3.2/3.4.

### External Notes bypass the commentary safety contract
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:123
**Description**: External `## Notes` are mapped verbatim into Commentary, yet the external prompt contract is deliberately unchanged and does not prohibit counts, gate verdicts, or next commands in Notes. Per-genre validation accepts an external file based only on its header and severity sections. Therefore a valid external report can put a conflicting verdict or command into the supposedly quarantined slot, contradicting lines 76–79's claim that the two voices can never disagree. Either update the external prompt/spec/template so Notes carry the same normative content restriction and add parser/renderer rejection tests, or relax the structural claim and define deterministic handling for prohibited external commentary. The current unchanged-prompt decision and commentary contract cannot both hold.

### The normalized external shape cannot populate the mandatory shared header
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:26
**Description**: The fixed header mandates change, mode, iteration, reviewer class, and depth, but the normalized external parse defined at lines 118–124 supplies reviewer/date plus findings/Notes; the external findings format contains no depth field, and external validation expressly has no internal spine. The spec also says external passes omit the scorecard, despite the fixed grammar listing the scorecard as an unconditional frame element. Two implementers must either invent a depth, silently omit required header data, or reject every conforming external file. Define the complete normalized external record (including the source of change/mode/iteration/depth and whether reviewer date renders), and explicitly make each genre-inapplicable grammar element conditional in the grammar rather than only in validation prose.

### Persist-first leaves required review emit fields without a value contract
**File**: orbit/changes/d4-review-consistency/specs/orbit-review/spec.md:46
**Description**: Review JSON still inherits the universal spine, whose required `final_assessment` and `next_recommended` strings are consumed by orientation, but D8/task 3.1 delete the skill-authored final-assessment machinery and compute the authoritative tail only after the emit is persisted. The modified requirement never says what values a change-mode review writes into those required fields; task 3.4 also leaves the reference schema's stock `final_assessment` and authored `iteration_note` contract unaddressed. An implementer cannot both persist first and store the later engine tail, and leaving the old values preserves the second, stale voice this change is meant to remove. Specify deterministic pre-render spine values (and orientation semantics), or modify the spine/orientation contracts; remove or redefine stored `iteration_note`; and carry all reference-schema edits explicitly in tasks.

### The untouched fresh-review requirement still depends on deleted stock phrasings
**File**: orbit/specs/orbit-review/spec.md:293
**Description**: The live `--fresh` requirement says the system-mode stock phrasings offer `--fresh` alongside external review. D4 collapses those stock phrasings into the single-voiced engine tail, which never co-offers alternatives. Because this requirement is not among the MODIFIED blocks, the archived baseline would retain a direct description of machinery D8 says is deleted. Add a MODIFIED delta preserving the flag behavior while replacing the stock-phrasing sentence with the gate/cadence relationship, plus a task/fingerprint carrier.

### Onboarding will continue teaching both retired interaction models
**File**: src/core/templates/workflows/onboard.ts:81
**Description**: The generated onboarding body still prints the hand-authored review final-assessment branch examples at line 81 and teaches decision findings as immediate `AskUserQuestion` / A-B-`[discuss]` forks at line 83 (also in the quick-reference row at line 103). Neither task 3.1/3.2 nor the docs task touches `onboard.ts`, so the applied product will contradict both halves of D4 in a generated first-contact surface. Add an onboarding rewrite task, update the phase and quick-reference prose to engine-rendered reports and the three-lane present-discuss-ratify protocol, and re-pin/test its generated surface.

## WARNING

### The alleged fixed grammar is not specified tightly enough to reproduce
**File**: orbit/changes/d4-review-consistency/specs/orbit-report-rendering/spec.md:24
**Description**: The requirement fixes section order but not the actual header syntax, heading levels, scorecard columns/alignment, finding entry form, ordering within severities, escaping/newline rules, trend literal and repeat/new matching algorithm, commentary delimiters, option formatting, or which gate row is the singular "gate line". Task 1.4 asks the implementer to create both renderer and goldens, so virtually any deterministic layout can make its own tests pass; two implementers will not converge. Put a canonical complete rendered example or a line-level grammar in the spec/design and derive goldens from it, including empty/legacy/external cases and the exact trend algorithm.

### Change-wide delta-file counts are wrong
**File**: orbit/changes/d4-review-consistency/.orbit-runs/external-prompt-proposal-2026-07-22T22-11-59Z.md:91
**Description**: The change contains 18 delta requirements across five `specs/*/spec.md` files, not six. The review orientation repeats "across 6 files" here and again at line 122, while the proposal's affected-spec list itself names only five capabilities. Correct both six-file claims so the review and archive bookkeeping matches the tree; if the missing sixth delta was intended, add it rather than merely changing the number.

### The required D4 phase-seam handoff audit has no recorded evidence
**File**: orbit/changes/d4-review-consistency/tasks.md:4
**Description**: The preamble says the R-d-9 handoff audit runs by hand, but no task records its completion/evidence and the current propose/review emits have no usable `handoff` section. R-d-9 requires the seam audit to verify residency, boot-chain currency, charter coverage, and code touchpoints. Add a checkable task or file-resident audit record for the proposal-to-review seam so this obligation cannot disappear between prose and apply; explicitly note the pre-D5 interim representation if the structured emit field is not yet available.

## SUGGESTION

### Clarify explicit-token lookup independently of the gate trail parser
**File**: orbit/changes/d4-review-consistency/tasks.md:35
**Description**: `readTrail` currently drops malformed external files and ignores non-pass genres, while `--report <TS>` must distinguish parse-rejected external files from non-renderable internal genres and report each cleanly. Name a raw artifact-resolution step before normalized pass parsing, with the shared tie-break applied there, so task 1.5's parser extension and task 2.1's genre errors do not encourage overloading the gate model's lean `TrailPass` reader.

### Record the expected environmental test result in the verification notes
**File**: orbit/changes/d4-review-consistency/tasks.md:100
**Description**: In this workspace `npm test` ran 1754 tests with 1730 passing and the expected 24 command-test failures caused by unquoted interpolation of the space-containing repository path (`Cannot find module '/Users/sal/Documents/orbit'`). The prompt already classifies this as environmental. When task 5.3 is executed, record that exact distinction (or rerun from a no-space path) so the known harness defect is not mistaken for a D4 regression.

## Notes

Strict validation passes and fingerprints report 10/10 verified. The renderer/walk direction is coherent, but the least-reviewed resolution text introduced two direct schema contradictions, and the residue sweep still misses baseline and generated-body text describing the machinery being replaced.
