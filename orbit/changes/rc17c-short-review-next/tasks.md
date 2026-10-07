## 1. The short pointer (D1, exit (1))

- [ ] 1.1 In the `review` case of `composeEmit` (`src/core/emit-composition.ts`), the change-mode branch composes `/orbit:address-reviews <change>` when the pass has findings; the clean pointer and the architecture branch are unchanged
- [ ] 1.2 Update `test/core/emit-composition.test.ts`: a proposal/system pass with findings names no path; a clean pass names the report; an architecture pass with findings keeps `--from-file` naming its own emit (exit (3)); the T0 line still ends at the save step
- [ ] 1.3 Add `@scenario` tags for `orbit-emit-composition`'s delta scenarios on the tests that assert their THENs

## 2. The prior generation renders (D2, exit (2))

- [ ] 2.1 In `src/core/report-render.ts`'s spine-semantics check, accept on a pass with findings exactly two values, the short form and the self pointer rebuilt from the emit's `change` and file name; a clean pass accepts only the report pointer; the drift error names `next_recommended` and the accepted values
- [ ] 2.2 Tests in `test/core/report-render.test.ts` / `report-render-hardening.test.ts`: a prior-generation emit renders and its bytes equal a short-form copy's render; a self pointer at a different file fails; the short form on a clean pass fails; update the hardening test that asserts the old error text
- [ ] 2.3 Confirm the existing golden fixtures that carry the self pointer (`proposal-pass.json`, `verification-pass.json`) still render byte-equal to their goldens, untouched: exit (2) on real D4-generation shapes
- [ ] 2.4 Add `@scenario` tags for `orbit-report-rendering`'s delta scenarios

## 3. The review body points at the owner (D3)

- [ ] 3.1 In `src/core/templates/workflows/review.ts`, rewrite the spine paragraph's change-mode `next_recommended` clause to name `orbit-emit-composition`'s `Deterministic facts are engine-composed per command`, and make the schema line's placeholder NAME that owner rather than spell either pointer (D3: no second statement of the rule); repair the external-handoff reference's "the paste/save/ingest recommendation" (the T0 line ends at the save step, D4) to name `orbit-run-summary-emit`'s `Review-external T0 multi-step recommendation`; leave the architecture-mode lines alone
- [ ] 3.2 Grep the generated surface and `src/` for any other change-mode statement of the self pointer (`--from-file <own path>`, `--from-file <this emit`); repair each one or record why it stays
- [ ] 3.3 `npm run build && node bin/orbit.js update --force`; confirm the regenerated review skill carries the new text
- [ ] 3.4 Add `@scenario` tags (or ledger entries) for `orbit-review`'s delta scenarios

## 4. Canonical examples executed (D5, D6, D8)

- [ ] 4.1 Export `SPINE_FIELDS` and `ENGINE_OWNED_EXTRA` from `src/core/emit-composition.ts` (no behaviour change)
- [ ] 4.2 Write `test/core/canonical-examples.test.ts`: read `Internal-run JSON summary format` as it will stand (the active change's MODIFIED block, else the baseline; two active modifiers fail naming both); find the `json` fences after the `**Canonical examples**` line with `src/core/markdown-fence.ts`; subtract the engine's refused set; submit through `composeAndWriteEmit` in a disposable project per command target (a minimal `tasks.md` for apply — no chunk is seeded, since the engine writes the chunk keys either way; a pass per `formed_against` token for archive); assert acceptance and top-level key-set equality; render the review example through `--report`; fail naming the fence line for a command with no target
- [ ] 4.3 Run it against this change's delta; where an example disagrees with the engine, fix the delta's example, never the test
- [ ] 4.4 Show the guard can fail: remove one key from the delta's review example, see the test fail naming both sets, then restore it
- [ ] 4.5 Add `@scenario` tags for `orbit-conventions`' delta scenarios, with ledger entries where a scenario has no testable THEN

## 5. Pins, records, suite

- [ ] 5.1 Move the `test/core/rc03b-untouched-modules.test.ts` hash pin for `emit-composition.ts` and `report-render.ts`, recording the move in the pin's comment as a planned act of this stage
- [ ] 5.2 In `orbit/architecture/clean-up-review-cycle.md`, add a dated note under the rc17c stage declaring four capabilities, one over R-crc-1's ceiling (D-rc17c-6, Sal), with the charter text kept as written
- [ ] 5.3 `orbit status --change rc17c-short-review-next --scenarios`: every delta scenario declared
- [ ] 5.4 Full `npm test` green, `orbit validate rc17c-short-review-next --strict` clean
