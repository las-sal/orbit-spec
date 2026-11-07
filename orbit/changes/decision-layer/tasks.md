## 1. The decision-records module

- [ ] 1.1 Create `src/core/decision-records.ts` with the eighteen area ids and the five payload-raisable condition names (plus `tripwire`, refused from a payload), exported as constants the specs' tables name
- [ ] 1.2 Add the shape checks: plain fields non-blank strings, `alternatives` a non-empty string array, `defines` entries `{term, definition}` non-blank with no repeated term and no other key, `detail` a string when present; each refusal names its field
- [ ] 1.3 Add citation resolution for `relies_on` (requirement in the baseline, ruling under `## Rulings index`, goal under `## Goals`, resolution by repo path inside a `decisions/` folder, decision ID in the work's `explore.md`), refusing any citation that resolves to nothing, naming it
- [ ] 1.4 Add the stop links: `raised_stop` required when `relies_on` is empty and resolving to a `security-unprecedented` or `user-facing-uncovered` stop in the same folder; a resolution's `stop` resolving to a stop in the same folder that no resolution already names

## 2. The emit surface

- [ ] 2.1 Add `ledger`, `stop` and `resolution` rows to the command table in `src/core/emit-composition.ts`, dual-scope on change and doc, with no archived fallback and a bare invocation a missing-target error
- [ ] 2.2 Write decision records to the resolved trail's `decisions/` child, checking it is the canonical child like the trail itself, with the filename token's collision bump scoped to that folder
- [ ] 2.3 Compose the decision-record spine (`command`, `timestamp`, `change`, `doc` when architecture-scoped) with no `kind`, `final_assessment` or `next_recommended`, refuse either recommendation field when supplied, and call the module's checks before the write

## 3. Tests

- [ ] 3.1 Create `test/core/decision-records.test.ts` covering every `orbit-decision-records` scenario a test can run, each tagged `// @scenario behaviour <key>`
- [ ] 3.2 In the same file, cover the four ADDED `The write gate checks decision records` scenarios and the two new MODIFIED scenarios (`A decision record lands in the trail's decisions folder`, `A decision record carries no recommendation`), tagged
- [ ] 3.3 In the same file, cover the seven carried scenarios of `Engine-owned spine composition and filename discipline` with new tests, tagged, so no existing test file is edited
- [ ] 3.4 Show each new refusal able to fail: revert its check, run the test, see it fail, restore
- [ ] 3.5 Declare in `orbit/scenario-ledger.yaml`, as `untestable` with a `why`, the two scenarios that are a writer's or reader's judgement (`Detail is never the only statement`, `An internal call writes no entry`)

## 4. Verification

- [ ] 4.1 Run the full `npm test`; confirm it passes and that `git diff --stat main -- test/` lists only the new test file (G0)
- [ ] 4.2 Render the generated skills into a scratch copy before and after the change (`node bin/orbit.js update --force` there) and confirm they are byte-identical (G0)
- [ ] 4.3 Run `orbit validate decision-layer --strict` and `orbit status --change decision-layer --scenarios`; confirm no delta scenario is uncovered
