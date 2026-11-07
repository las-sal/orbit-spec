## 1. The decision-records module

- [x] 1.1 Create `src/core/decision-records.ts` with the eighteen area ids and the five payload-raisable condition names (plus `tripwire`, refused from a payload), exported as constants the specs' tables name
- [x] 1.2 Add the shape checks: plain fields non-blank strings, `alternatives` a non-empty string array, `defines` entries `{term, definition}` non-blank with no repeated term and no other key, `detail` a string when present; each refusal names its field
- [x] 1.3 Add citation resolution for `relies_on` (requirement in the baseline, ruling under `## Rulings index`, goal under `## Goals`, each ID matched whole and outside fenced blocks; resolution by `{change, token}` through the active change, the exploration, then the archived change, or by `{doc, token}` with a matching `doc`; decision ID of a live entry in the work's `explore.md`, refused on an architecture-scoped record), holding `capability`, `doc` and `change` to the identifier rule, and refusing any citation that resolves to nothing or to an unreadable or wrong-kind record, naming it
- [x] 1.4 Add the stop links: `raised_stop` required when `relies_on` is empty, refused when it is not, and resolving to a `security-unprecedented` or `user-facing-uncovered` stop in the same folder; a resolution's `stop` resolving to a stop in the same folder that no resolution already names; in both, the stop's `change` and `doc` equal the naming record's own

## 2. The emit surface

- [x] 2.1 Add `ledger`, `stop` and `resolution` rows to the command table in `src/core/emit-composition.ts`, dual-scope on change and doc, with no archived fallback and a bare invocation a missing-target error
- [x] 2.2 Write decision records to the resolved trail's `decisions/` child, checking it is the canonical child like the trail itself, with the filename token's collision bump scoped to that folder
- [x] 2.3 Compose the decision-record spine (`command`, `timestamp`, `change`, `doc` when architecture-scoped) with no `kind`, `final_assessment` or `next_recommended`, refuse either recommendation field when supplied, check it with the decision-record spine checks instead of the run-summary ones, and call the module's checks before the write
- [x] 2.4 Update `docs/cli.md`'s `orbit emit` section: name `ledger`, `stop` and `resolution` in the command list and say they write decision records to `.orbit-runs/decisions/`, not run summaries

## 3. Tests

- [x] 3.1 Create `test/core/decision-records.test.ts` covering every `orbit-decision-records` scenario a test can run, each tagged `// @scenario behaviour <key>`
- [x] 3.2 In the same file, cover the five ADDED `The write gate checks decision records` scenarios and the three new MODIFIED scenarios (`A decision record lands in the trail's decisions folder`, `A decision record carries no recommendation`, `A decision record passes its own spine checks`), tagged
- [x] 3.3 In the same file, cover with new tests, tagged, the seven carried scenarios of `Engine-owned spine composition and filename discipline` and the eleven carried scenarios of `Write-gate validation via the shared normalizers`; the six carried scenarios of `Atomic next_recommended — pre-computable and post-write classes` are already tagged by existing tests
- [x] 3.4 Show each new refusal able to fail: revert its check, run the test, see it fail, restore
- [x] 3.5 Declare in `orbit/scenario-ledger.yaml`, as `untestable` with a `why`, the three scenarios that are a writer's or reader's judgement (`Detail is never the only statement`, `An internal call writes no entry`, `A coined term is defined in the record`)

## 4. Verification

- [x] 4.1 Run the full `npm test`; confirm it passes and that `git diff --stat main -- test/` lists the new test file and only the two existing test files Sal ratified at apply (the `emit-composition.ts` hash pin; the spine test scoped to run summaries)
- [x] 4.2 Render the generated skills into a scratch copy before and after the change (`node bin/orbit.js update --force` there) and confirm they are byte-identical (G0)
- [x] 4.3 Run `orbit validate decision-layer --strict` and `orbit status --change decision-layer --scenarios`; confirm no delta scenario is uncovered
