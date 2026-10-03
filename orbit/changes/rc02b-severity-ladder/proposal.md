## Why

`orbit-conventions`' Severity ladder says three names and "prefer the lower one", and nothing about
what a CRITICAL costs. Yet every downstream mechanism grades against those labels: the reviewed gate's
substantive set is CRITICAL + WARNING (rc02), R-crc-4 says a CRITICAL buys one more blind pass, and
R-crc-11(b)'s fix-now versus route-to-architecture call has no basis but severity. Meanwhile the review
body already states severities FOURTEEN times, by pass ("CRITICAL when a spec requirement has no task"),
two of them lifecycle blocks wearing a severity's name; external reviewers receive no severity guidance
at all (59 prompts on record, one with a hand-written ladder); and the evidence that would make a
CRITICAL checkable — its reproduction — is already being written unprompted (11 internal CRITICALs carry
a `reproduction` key the write gate never looked at; three recent external files write `Reproduction:`
inline where the parser buries or drops it) with no slot to land in. Stage `rc02b-severity-ladder` of
`clean-up-review-cycle` (Goal G1) gives the ladder DEFINITIONS BY CONSEQUENCE, states them ONCE, and
makes the evidence tax enforceable where evidence is produced and visible where it cannot be.

## What Changes

- **The ladder is defined by consequence, once.** `orbit-conventions`' Severity ladder requirement
  gains the definitions — CRITICAL = a user path breaks or data is lost AND the finding carries its
  REPRODUCTION; WARNING = an implementation built to the artifact as written could diverge from what it
  intends; else SUGGESTION — plus what a reproduction IS (a case the reader can re-execute: inputs, rule
  or command, expected, observed — a command in system mode, a constructed case in proposal mode), and
  the rule that every other surface NAMES the ladder and points (R-crc-14).
- **Per-pass severity rules become pointers with their reading.** The FOURTEEN per-pass sites in the review body — eight proposal-pass rules, five
  system-pass rules, the report example; measured by `grep -n "CRITICAL\|WARNING\|SUGGESTION"
  src/core/templates/workflows/review.ts` on 2026-10-03 (P6 states none, S6 is out) — plus the body's
  general bias line (review.ts:873) and the five `orbit-review` scenarios that state severities stop defining CRITICAL and start
  naming the ladder with the condition's consequence. Two grades change: a requirement with no task
  (P2) and old vocabulary in a delta (P7) read as divergence risk and become WARNING; a baseline
  contradiction (P4) and an unintentional surface removal (S3) are CRITICAL only with the reproduction.
- **A lifecycle BLOCK is not a severity, and it has a carrier.** A validate failure (P1) and an unresolved
  `@review:` marker (P8) are reported as BLOCKS and LEAVE the scorecard: on an internal pass in a new
  optional `blocks` array on the review payload (single-line strings), on an external file under a new
  `## Blocks` section whose items the renderer's parser collects; the report renders a `### Blocks`
  section above the findings for both genres; the walk lists blocks first at triage; `--strict` stops on
  a block as on a CRITICAL and `--mark` writes none. P8's "when ambiguous, classify as CRITICAL" clause
  is deleted, restoring the false-positive bias to one direction. "0 CRITICAL" on a report means what the
  ladder says. KNOWN LIMIT, stated in the ladder: nothing STOPS on a block mechanically — the apply body
  carries no validate or marker precondition (the fresh pass executed the grep; the exploration had
  asserted one) and the only lifecycle marker reader is archive Step 1.5's warning; the stop is the
  human's, and giving apply a precondition is rc10-apply-closure's territory.
- **The evidence tax, enforced where evidence is produced.** `reproduction` is a named field on the
  internal finding entry (string, multi-line allowed; required non-empty when severity is CRITICAL,
  optional otherwise). `orbit emit review` REFUSES a CRITICAL without one in every mode, naming the finding — the
  first gate check that refuses on a finding's narrative field (the scorecard rollup already reads each
  entry's dimension and severity; the unknown-KEY check stays top-level).
- **The evidence tax, surfaced where it cannot be enforced.** The external prompt carries the ladder's
  one paragraph as a CHECKED MIRROR — a fenced production in the conventions requirement, held byte-equal
  in the template by a parity test (R-crc-14's mirror corollary) — and asks for a `**Reproduction**:`
  body after `**Description**:`; the renderer's external
  parser learns the label; a CRITICAL without one is counted, rendered `unreproduced`, and NEVER
  re-graded by any consumer. The trail reader is brought to the format's field-line rule — a `**File**:` line inside any body is content,
  so a path quoted in a reproduction cannot re-file the finding at the gate (the external pass found the
  trail reader took the LAST File line; the render parser already stopped at Description) — and a test pins
  the (title, file) key through both readers.
- **The tax has a reader.** Both address-reviews virtual-marker mappings carry `reproduction`; Step 3a's
  pushback for a CRITICAL opens by re-running it and records the result in a new closed-value entry field
  `reproduction_rerun`; triage lists blocks before findings.
- **Two contradictions and one residue close.** The conventions' canonical review-emit example gains a
  reproduction on its CRITICAL (the exact payload the new gate would otherwise refuse); the review body's
  Step 9 field enumeration names the field; the conventions' external-slot sentence falsified by rc02's
  `blind-pair` cadence is repaired.
- **No migration.** The 99 CRITICALs on record without a reproduction are history; readers tolerate
  absence on prior-generation emits exactly as they do for `model` and `consent` — and the render marks
  such a CRITICAL `[unreproduced]` by absence, which on internal passes is exactly the prior-generation set.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Severity ladder` (definitions by consequence, the reproduction, blocks, the
  one-statement rule); `External-review findings markdown format` (the `**Reproduction**:` body and the
  `## Blocks` section); `Internal-run JSON summary format` (the canonical review example's CRITICAL
  carries a reproduction); `Review mode decision framework` (the external-slot residue sentence).
- `orbit-review`: `Proposal mode runs nine passes` (Pass 8 reports a block, not a CRITICAL; `--strict`/`--mark`
  on a block; pass severities name the ladder); `System mode runs verify-change + six system-wide passes`
  (Passes 1, 2, 3, 4, 5 name the ladder); `Internal run summary persisted per mode` (the finding entry's
  `reproduction` field; the payload's `blocks` array).
- `orbit-review-external`: `Output format specification in prompt` (the ladder paragraph, the
  Reproduction body, the Blocks section); `Prompt written to versioned file with chat invocation snippet`
  (the reference template's output-format block, kept verbatim-equal).
- `orbit-emit-composition`: ADDED `An internal CRITICAL carries its reproduction at the write gate` (every
  mode); ADDED `The review payload carries blocks`.
- `orbit-report-rendering`: `One grammar for internal and external passes` (the Reproduction body parsed;
  `## Blocks` items collected, never counted); ADDED `Reproduction renders beside the recommendation and
  its absence is marked` (the `[unreproduced]` prefix outside the title token; the `### Blocks` slot).
- `orbit-address-reviews`: `--from-file ingest of review findings file` (both mappings carry
  `reproduction`; `## Blocks` items and the JSON's `blocks[]` listed first at triage, never walked; the
  `reproduction_rerun` entry field); `Pushback discipline applied per marker` (a CRITICAL's pushback opens
  by re-running its reproduction).

**Size, measured at propose (R-crc-1):** SIX capabilities against a ceiling of three — the charter
named three, the exploration measured five, and this proposal found the sixth (`orbit-review-external`
owns the prompt's output format; the exploration attributed it to `orbit-review`, a READ miss recorded
in design). Sal held the stage as one change (D-rc02b-1; the split is in the exploration's Considered
& out); the breach is DECLARED here for ratification at review, and the proposal-mode blind pair
R-crc-4 prescribes at the ceiling runs. Fifteen requirement blocks (12 MODIFIED, 3 ADDED) against
~12. MEASURED on the written deltas: 65 KB of delta in total, of which the CHANGED lines across the
twelve MODIFIED blocks number 110 (ndiff +/−) — the 150-line canonical-example requirement changes 2
lines and the 172-line prompt template 14; R-crc-1's changed-bytes clarification applies and the byte
axis is under the ceiling; the task axis reads 25 against "under 20" — over by five after the two proposal walks added the block carrier and the trail-reader conformance, DECLARED rather
than merged away (rc04c's precedent: a stage arguing its way under a ceiling should expect the
argument read as evidence it is over). Two axes breached, both stated; the capability axis is the one
that predicts cost.

## Impact

- **Engine**: `src/core/emit-composition.ts` (the finding-level check in `validatePayload`; the `blocks`
  payload field), `src/core/report-render.ts` (external `**Reproduction**:` body; internal `reproduction`
  pass-through; the `[unreproduced]` prefix; `## Blocks` items collected; the `### Blocks` slot), `src/core/artifact-graph/trail.ts` (field lines recognised only before the Description body opens; a
  test pins the finding key through both readers and that the Blocks section is invisible to the counter).
- **Generated surface** (`src/core/templates/workflows/`): `review.ts` (seventeen per-pass sites, the
  report example, Step 9's field list, the prompt template's output block and ladder paragraph,
  `references/run-summary-schema.md`), `address-reviews.ts` (both mapping tables, the expected-file-format
  block, Step 3a, triage). Refresh with `npm run build && node bin/orbit.js update --force`.
- **Tests**: `test/core/emit-schema-parity.test.ts` (nested allowlist learns `reproduction`); new unit
  tests for the gate refusal, the external body parse, the unreproduced mark, the counter's blindness;
  the generated-surface marker-fidelity tests for the re-pointed sites.
- **Trail**: no migration. Prior-generation emits lack the field and stay valid; the gate applies to new
  writes only.
- **Out of scope, named**: `orbit-audit-drift`'s own severity assignment (system Pass 6 preserves it) is
  a seventh statement site outside this change — D-rc02b-4; it reaches the ladder by a later pointer
  touch.
