## 1. The gate lists its outstanding passes (`orbit-engine-gates`)

- [ ] 1.1 Red first, in `test/core/artifact-graph/gates.test.ts` (or a new `test/core/artifact-graph/outstanding-passes.test.ts`): every scenario of `A reviewed gate lists its outstanding passes`. Two unresolved passes listed in token order, internal then external, with `reason` naming the first; `[]` when all are resolved; `openPair: {missing: "external"}` on an open pair beside an unchanged `reason`; neither field on a blocked gate. Plus one assertion that `orbit status --change <name> --json` carries both fields on the gate row with `file` repo-relative, one that a `passed` gate carries `unresolvedPasses: []`, and one that the unresolved-pass canonical next is `/orbit:address-reviews <change>` with no `--from-file` (`The walk next names no file`). Confirm they fail.
- [ ] 1.2 Implement (design D1): the `resOrdered` loop in `src/core/artifact-graph/gates.ts` collects instead of returning early, and `reason` / `unresolvedPass` come from the first collected element; the passed branch (`gates.ts:735`) adds `unresolvedPasses: []`; the unresolved-pass canonical next (`gates.ts:807-809`) drops its `--from-file`. `GateStatus` gains `unresolvedPasses` and `openPair`, and `src/core/artifact-graph/instruction-loader.ts` carries both onto the row. 1.1 goes green, and every gate, readout and orientation golden that does not print the unresolved-pass next stays byte-identical.
- [ ] 1.3 The rider (design D7): in the change's `orbit-engine-gates` delta the sentence is already swapped. Confirm no code or body restates "validates the payload KEY and none of the entry shapes" (grep `src/` and `orbit/specs/` excluding archives); a baseline hit is fixed at archive by the sync.
- [ ] 1.4 Move the `gates.ts` and `instruction-loader.ts` hashes in `test/core/rc03b-untouched-modules.test.ts`, each with a dated comment naming this change, as recorded acts.
- [ ] 1.5 Move the goldens and assertions that print the unresolved-pass next with `--from-file` (`test/fixtures/report-golden/*.golden.md`, `test/core/report-render*.test.ts`, `test/core/artifact-graph/gates.test.ts` and any others a full run turns red), as a recorded act listing each file in this task's note.

## 2. The T0 line (`orbit-run-summary-emit`)

- [ ] 2.1 Red first: the T0 emit's `next_recommended` ends at `save the response as <path>` and contains no `/orbit:address-reviews` (emit-composition tests); the generated `orbit-review` skill's T0 section carries the same line. Confirm they fail.
- [ ] 2.2 Edit `src/core/emit-composition.ts:1901`, the T0 copy in `src/core/templates/workflows/review.ts` (design D6), and that section's prose describing the recommendation as "the user action plus the follow-up command (per D14)". 2.1 goes green. Move the `emit-composition.ts` hash in the untouched-modules pin as a recorded act.

## 3. The walk body (`orbit-address-reviews`)

- [ ] 3.1 Red first, in the address-reviews template tests and a parity test: Step 1 carries the `DISCOVERY` fence as a CHECKED MIRROR held byte-equal to the delta's fence (the `sweep-path-parity` pattern), and reads `unresolvedPasses` / `openPair` from `orbit status --change <name> --json`; the single-newest recency rule and its tie-break text are gone from the body and `references/resolution-detail.md`; the one-log-per-source rule with token order and stale-with-evidence for converged findings; the `--mark` restatement rule; the rediscovered-pass carry-forward; the disagreement test run at triage with each refuted claim `stale` in its own log; classify (3b) carries the remedy test and the four-row remedy table pointer; REDESIGN names the route and invokes nothing; the disagreement record; the run-summary schema reference documents `remedy`, `routed_to` and `disagreement` and no longer documents `tie_break_rationale` as written. Confirm they fail.
- [ ] 3.2 Edit `src/core/templates/workflows/address-reviews.ts` (design D2–D5): Step 1, the scope-resolution reference, the graceful-degradation lines (the "no candidate JSON" message becomes `No @review: markers and no outstanding passes in scope. Nothing to walk.`), the description/compatibility frontmatter, classify, the report's `Source:` line, the schema reference's field notes (pointing at the owners, restating no rule), and `json example` blocks carrying the new keys. 3.1 goes green; `test/core/emit-schema-parity.test.ts` and `test/core/reference-roundtrip.test.ts` stay green.
- [ ] 3.3 Sweep for the retired rule's other carriers: grep `src/` and the change's specs for `most-recent` / `most recent` / `recency` / `auto-discover` / `tie_break` near address-reviews, and the review body's restatements of the T1 walk (`review.ts`), and either repoint them or record why each stays (an explicit `--from-file` aim is legitimate). List each site in the task note.

## 4. Exit (1) end-to-end

- [ ] 4.1 A behaviour test in a disposable project: one active change, a `review-system` gate with two unwalked passes (a fresh JSON and an external return). The bare-invocation discovery read (status JSON → the `DISCOVERY` fence's rows) yields both, names the change, and two walk payloads, one per `source_path`, pass the write gate and leave the gate's list empty. This is exit (1)'s measure.

## 5. Declare this change's scenarios

- [ ] 5.1 Tag every ADDED scenario (`orbit-engine-gates`' list requirement as `behaviour` at 1.1's tests; `orbit-address-reviews`' three as `text` at 3.1's tests, or `behaviour` at 4.1 where the THEN is about engine state) and the modified `orbit-run-summary-emit` and `orbit-address-reviews` scenarios at their tests.
- [ ] 5.2 The 22 carried scenarios of `Reviewed-gate pass condition`: first MEASURE how many existing gate tests exercise each (record the count in this task's note), then tag those and declare any remainder in `orbit/scenario-ledger.yaml` with a `why`.
- [ ] 5.3 Run `orbit status --change rc08b-walk-routing --scenarios` and confirm zero UNCOVERED, ORPHAN and MALFORMED; run `orbit validate rc08b-walk-routing --strict` and confirm no `scenario-map` issue at any level.

## 6. Close-out

- [ ] 6.1 `npm run build && node bin/orbit.js update --force`, then sweep the generated `.claude/skills/orbit-address-reviews/` and `.claude/skills/orbit-review/` for the retired recency rule and the T0 walk clause, and confirm neither survives.
- [ ] 6.2 Run the FULL `npm test` and confirm the `Test Files` line reports no failures.
- [ ] 6.3 (User-validation) The first walk after apply, on this change's own system-review pair, is invoked BARE, discovers both halves, names the change, and writes two logs the gate reads as resolved; any `remedy` the walk records is on the log. This is exit (1) observed live, and exit (2)'s record half.

At-archive note (not a task): rc08a's exit (3) — zero ripple-miss findings — is measured on THIS stage's cadence from `ripple_misses` plus the `regressed` verdict count, and recorded in this stage's archive.
