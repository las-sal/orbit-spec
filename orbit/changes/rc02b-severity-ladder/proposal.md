## Why

`orbit-conventions`' Severity ladder says three names and "prefer the lower one", and nothing about
what a CRITICAL costs. Yet every downstream mechanism grades against those labels: the reviewed gate's
substantive set is CRITICAL + WARNING (rc02), R-crc-4 says a CRITICAL buys one more blind pass, and
R-crc-11(b)'s fix-now versus route-to-architecture call has no basis but severity. Meanwhile the review
body already states severities SIXTEEN times, by pass ("CRITICAL when a spec requirement has no task"),
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
- **Per-pass severity rules become pointers with their reading.** The seventeen sites in the review
  body (and the five `orbit-review` scenarios that state severities) stop defining CRITICAL and start
  naming the ladder with the condition's consequence. Two grades change: a requirement with no task
  (P2) and old vocabulary in a delta (P7) read as divergence risk and become WARNING; a baseline
  contradiction (P4) and an unintentional surface removal (S3) are CRITICAL only with the reproduction.
- **A lifecycle BLOCK is not a severity.** A validate failure (P1) and an unresolved `@review:` marker
  (P8) are reported as BLOCKS — in the body's report and, for external reviewers, under a new `## Blocks`
  section the parsers treat as non-structural — and LEAVE the scorecard; P8's "when ambiguous, classify
  as CRITICAL" clause is deleted with them, restoring the false-positive bias to one direction. "0
  CRITICAL" on a report means what the ladder says.
- **The evidence tax, enforced where evidence is produced.** `reproduction` is a named field on the
  internal finding entry (string, multi-line allowed; required non-empty when severity is CRITICAL,
  optional otherwise). `orbit emit review` REFUSES an internal CRITICAL without one, naming the finding —
  the first check the write gate performs INSIDE a finding entry (today it checks top-level keys only).
- **The evidence tax, surfaced where it cannot be enforced.** The external prompt carries the ladder's
  one paragraph and asks for a `**Reproduction**:` body after `**Description**:`; the renderer's external
  parser learns the label; a CRITICAL without one is counted, rendered `unreproduced`, and NEVER
  re-graded by any consumer. The trail counter is untouched and tested to stay so.
- **The tax has a reader.** Both address-reviews virtual-marker mappings carry `reproduction`; Step 3a's
  pushback for a CRITICAL opens by re-running it; triage lists blocks before findings.
- **Two contradictions and one residue close.** The conventions' canonical review-emit example gains a
  reproduction on its CRITICAL (the exact payload the new gate would otherwise refuse); the review body's
  Step 9 field enumeration names the field; the conventions' external-slot sentence falsified by rc02's
  `blind-pair` cadence is repaired.
- **No migration.** The 99 CRITICALs on record without a reproduction are history; readers tolerate
  absence on prior-generation emits exactly as they do for `model` and `consent`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Severity ladder` (definitions by consequence, the reproduction, blocks, the
  one-statement rule); `External-review findings markdown format` (the `**Reproduction**:` body and the
  `## Blocks` section); `Internal-run JSON summary format` (the canonical review example's CRITICAL
  carries a reproduction); `Review mode decision framework` (the external-slot residue sentence).
- `orbit-review`: `Proposal mode runs nine passes` (Pass 8 reports a block, not a CRITICAL); `System mode
  runs verify-change + six system-wide passes` (Passes 1, 2, 3, 5 name the ladder); `Internal run summary
  persisted per mode` (the finding entry's `reproduction` field).
- `orbit-review-external`: `Output format specification in prompt` (the ladder paragraph, the
  Reproduction body, the Blocks section); `Prompt written to versioned file with chat invocation snippet`
  (the reference template's output-format block, kept verbatim-equal).
- `orbit-emit-composition`: ADDED `An internal CRITICAL carries its reproduction at the write gate`.
- `orbit-report-rendering`: `One grammar for internal and external passes` (the Reproduction body parsed;
  `## Blocks` non-structural); ADDED `Reproduction renders beside the recommendation and its absence is
  marked`.
- `orbit-address-reviews`: `--from-file ingest of review findings file` (both mappings carry
  `reproduction`; `## Blocks` entries listed at triage, never walked); `Pushback discipline applied per
  marker` (a CRITICAL's pushback opens by re-running its reproduction).

**Size, measured at propose (R-crc-1):** SIX capabilities against a ceiling of three — the charter
named three, the exploration measured five, and this proposal found the sixth (`orbit-review-external`
owns the prompt's output format; the exploration attributed it to `orbit-review`, a READ miss recorded
in design). Sal held the stage as one change (D-rc02b-1; the split is in the exploration's Considered
& out); the breach is DECLARED here for ratification at review, and the proposal-mode blind pair
R-crc-4 prescribes at the ceiling runs. Fourteen requirement blocks (12 MODIFIED, 2 ADDED) against
~12. MEASURED on the written deltas: 65 KB of delta in total, of which the CHANGED lines across the
twelve MODIFIED blocks number 110 (ndiff +/−) — the 150-line canonical-example requirement changes 2
lines and the 172-line prompt template 14; R-crc-1's changed-bytes clarification applies and the byte
axis is under the ceiling; the task axis reads 22 against "under 20" — over by two, DECLARED rather
than merged away (rc04c's precedent: a stage arguing its way under a ceiling should expect the
argument read as evidence it is over). Two axes breached, both stated; the capability axis is the one
that predicts cost.

## Impact

- **Engine**: `src/core/emit-composition.ts` (the finding-level check in `validatePayload`),
  `src/core/report-render.ts` (external `**Reproduction**:` body; internal `reproduction` pass-through;
  the `unreproduced` mark; `## Blocks` ignored), `src/core/artifact-graph/trail.ts` (no change; a test
  pins that the label and the Blocks section are invisible to the counter).
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
