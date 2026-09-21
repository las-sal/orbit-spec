# Tasks: rc02c-confirmation-semantics

## 1. Retire clause (c)

- [ ] 1.1 In `src/core/artifact-graph/gates.ts`, delete the clause-(c) block (the `latestIndep` selection, both `confirm` branches, and the `no independent pass for the confirm predicate` early return) so the convergence criterion is clauses (a) and (b) only. Delete `confirmFailed` and `confirmNeedsExternal` from the result shape and every consumer — a field no producer sets is a trap for the next reader. Verify by construction, not by reading: a trail whose latest independent pass carries a CRITICAL that is RESOLVED must now converge, and the blind-pair case where the earlier member's CRITICAL was invisible must have no selection rule left to be invisible to.
- [ ] 1.2 `confirm` stays ACCEPTED in the schema grammar (`types.ts`, `schema.ts`) and becomes INERT — existing schemas must keep validating without a version bump. Assert inertness with a test rather than assuming it: two schemas identical but for `confirm: no-new-findings` versus `findings-resolved` must produce identical gate states on identical trails.
- [ ] 1.3 Sweep the reason strings and the canonical-next computation for every sentence that presupposed a confirming pass (`one further independent pass on the walked state`, `cadence repeats external until none`, and the `confirmNeedsExternal` branch of the recommendation). A reason naming a rule that no longer exists is worse than a missing reason.

## 2. Demote budget to a recorded figure (Q-crc-19)

- [ ] 2.1 Delete the `budgetExhausted` computation and the `independentSpendFresh` trigger count from `gates.ts`. `independentSpend` SURVIVES — it is the recorded cost under R-crc-11(h). Check for a silent behaviour change while deleting: the trigger counted only FRESH passes, the report counts all including stale, so anything that read the trigger must be re-pointed deliberately rather than defaulted to the other field.
- [ ] 2.2 Remove the `BUDGET-SPENT` position-token labels from `gates.ts` and the `budgetExhausted` chip from `src/commands/workflow/status.ts`, and drop the `budgetExhausted` read in `src/core/artifact-graph/instruction-loader.ts`. No spend-derived token survives anywhere: a recorded cost must never render as a verdict.
- [ ] 2.3 Remove the budget clause from the gate's reason string — the reason names the rule that fired, and spend is not a rule. Confirm the reason for an unpassed gate over its declared budget names ONLY the uncovered slot or the unresolved pass.
- [ ] 2.4 Update the `budget` comment block in `schemas/spec-driven/schema.yaml` (which today describes the exhaustion boolean and the position token) to state that `budget` is a DECLARED EXPECTATION and that nothing consults it. Leave both `budget: 3` declarations in place — no version bump, no migration.

## 3. Instruments

- [ ] 3.1 Update `test/core/artifact-graph/rc02-gate-semantics.test.ts` — every case asserting exhaustion, the position tokens, or the confirm predicate. Where a case dies, ask whether its INTENT survives under the new rules before deleting it; a test that was asserting "the gate does not falsely converge" may deserve rewriting rather than removal.
- [ ] 3.2 Add constructed-trail cases for what the removal must guarantee: a blind pair whose earlier member carried a CRITICAL now converges once resolved; a gate over its declared budget renders no token and names no spend in its reason; a schema with no `budget` behaves identically to one that declares it.
- [ ] 3.3 Assert the RECORD survives: `independentSpend` still counts stale passes and rejected external returns. These are the scenarios the delta preserved byte-identically, and they are exactly what a careless deletion would take with it.

## 4. The assigned residue

- [ ] 4.1 `orbit-run-summary-emit`'s two v3-scoped next-command examples (baseline lines 278 and 343) are corrected in the delta to read the schema's value from the gate graph rather than pinning a version. Verify no other spec or body pins a schema version in an example sentence — the residue exists because a pinned example went stale at a bump, and a second one would too.

## 5. Close-out

- [ ] 5.1 `npm run build && npm test` green; `orbit validate --all --strict` clean.
- [ ] 5.2 Run the gate against every ARCHIVED trail and diff the verdicts against what the shipped engine computes today. Changed verdicts are EXPECTED — that is the point of the change — but each one must be explicable by clause (c)'s removal or the budget demotion, and any verdict that changes for a third reason is a defect this change introduced.
- [ ] 5.3 Review-marker sweep returns ZERO: `rg -n '@review[:]' orbit/changes/rc02c-confirmation-semantics --glob '!**/.orbit-runs/**'`.
- [ ] 5.4 RECOMMEND — do not perform — the architect amendments this change earns: rc02c's stage section marking the three inherited problems closed (two dissolved, one re-homed), and Q-crc-19's resolution marked delivered. Stage declarations belong to `/orbit:architect`.
