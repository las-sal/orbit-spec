# External Review: rc04c-retire-gate-overridden (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-23

## CRITICAL

### The empty-citation successor still contradicts the record's defining membership rule

**File**: orbit/changes/rc04c-retire-gate-overridden/specs/orbit-run-summary-emit/spec.md:132
**Description**: The requirement still defines a cadence judgement as a decision formed against independent review output, says that this qualifying test is exact, and explicitly concludes that a judgement citing no pass does not belong in `judgements`. The same requirement then admits `continuation/proceed` with `formed_against: []` when no independent pass exists and calls that record a cadence judgement. The new exception changes more than cardinality: it admits a decision that fails the carrier's stated membership test. A fresh implementer cannot satisfy both rules, and downstream prose such as `Where a judgement record may appear` inherits the contradiction. Either broaden the definition and qualifying test to explicitly include an evidence-free gate-continuation decision (then reconcile every sentence that derives placement from independent output), or keep the definition and give the zero-pass decision a carrier that is not `judgements`.

### The only rebuild occurs before the final engine removals

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:75
**Description**: Task 2.4 runs `npm run build` and refreshes the installed bodies, but tasks 2.5a and 2.5b then make the final source edits that remove the coexistence guard and both payload-table entries. No later task rebuilds `dist`, while `bin/orbit.js` imports `../dist/cli/index.js`. The source tests can therefore pass while the user-facing CLI still accepts `gate_overridden` and still runs the supposedly retired guard. Preserve the carefully chosen body-before-removal order, but add a final build after 2.5b (and run the refresh from that final build, or explicitly prove no generated body changed between builds) before verification.

### The proposal is already over two explicit R-crc-1 ceilings

**File**: orbit/architecture/clean-up-review-cycle.md:114
**Description**: R-crc-1 sets four ceilings and says a proposal over the ceiling is split before review. This proposal is at the capability and requirement limits, but the three delta files total 56,262 bytes against approximately 40 KB and `tasks.md` contains 30 checkbox tasks against "under 20". The proposal's claim that capabilities are the binding dimension does not waive the ruling's other explicit limits. Split the totality amendment from the legacy-key retirement (with a declared dependency) or otherwise restructure the work into stages that satisfy all four dimensions before continuing proposal review.

## WARNING

### The prior-generation exit cannot be exercised through the named report surface

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:128
**Description**: Task 3.5 calls raw `fs.readFileSync` plus `JSON.parse` the standing regression pin that an archived emit "still parses", but that does not pass the prior-generation record through an Orbit reader. Task 4.2 then requires the orientation and report surfaces against a real archived change, yet `orbit status --change rc02c-confirmation-semantics --report` fails before rendering because `status --report` calls `validateChangeExists`, which accepts active changes only. Bare orientation can scan archived trails only for global-LAST selection and cannot target the chosen fixture. Add a real reader-level regression over an archived trail carrying `gate_overridden`, and either make `--report` resolve archived changes or replace task 4.2 with an existing, targetable reader plus an exact command that succeeds.

### Retirement has no standing negative test for the retired payload key

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:88
**Description**: Task 2.5b promises that `gate_overridden` becomes an unknown payload key on both `apply` and `archive`, but section 3 only deletes or rewrites the tests that currently exercise the key. The schema-parity test is one-way (documented keys must be accepted), so it remains green if a later edit silently re-adds an undocumented legacy key; task 4.1's grep is only a one-time apply check. Add standing regressions that submit `gate_overridden` to both commands and assert the ordinary unknown-key refusal and no emitted file.

## SUGGESTION

### The new tests do not pin which preceding pass the refusal names

**File**: orbit/changes/rc04c-retire-gate-overridden/tasks.md:139
**Description**: Task 3.6 asks for refusal "naming the pass" even though the specs deliberately make the LATEST preceding independent pass normative. A fixture with only one preceding pass lets an implementation choose the oldest or arbitrary pass and still satisfy the task. Build the refusal case with at least two earlier independent passes and assert that the error names the later token (and, preferably, not the older one).

## Notes

The baseline build and all 2,238 tests passed; strict change validation passed; all ten base fingerprints verified. I also checked the full MODIFIED blocks against their baselines, the implementation sites and affected tests, the archived fixture path, source-marker residue, and the actual archived-change report invocation. The green structural checks do not reach the definition conflict, final-build ordering, ceiling arithmetic, or reader/test gaps above.
