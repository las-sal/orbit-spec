## 1. The two keys

- [ ] 1.1 Add `apply` and `archive` to `CHAIN_KEYS` (`src/core/project-config.ts`) and their rows to `CHAIN_KEY_TABLE` (`src/core/chain.ts`), each listing `/orbit:<cmd> <change>` and `/orbit:<cmd> <change> — user-invoked`; make `chainKeyFor` return the target itself and fold `ChainTarget` into `ChainKey | null`; update the module comments that say no key grants the two commands, and in `project-config.ts` the `chain` schema's `.describe(...)` string (which lists the three keys) and the comment above it (which says the change status reads the setting on its own: the emit write gate reads it too), and the `consent` JSDoc in `src/core/artifact-graph/gates.ts` (entry "requires an explicit user invocation": add "or a grant by the project's `chain` setting")
- [ ] 1.2 In `test/core/chain.test.ts`: `chain: {apply: true}` grants the marked apply command with `may_run: true` and leaves `next` carrying the marker; `{apply: true}` does not grant archive (`not-granted`); `{archive: true}` grants the marked archive command; the key-no-row-names case uses `merge`; an open stop still halts a granted apply. Tag each new engine-gates scenario
- [ ] 1.3 Confirm `CHAIN_END_STEP` now lists the `apply` and `archive` rows through its interpolation (the first `chain-prompt-tags` test iterates `CHAIN_KEYS`, so it covers them); edit no body by hand for the rows

## 2. The write gate's consent check

- [ ] 2.1 In `src/core/emit-composition.ts`, add `validateConsent(command, payload, projectRoot)` after `validatePayload` in `composeAndWriteEmit`, for apply and archive when `consent` is present: refuse a value outside `user-invoked`, `prompted`, `setting` (non-strings included) naming the three; refuse `setting` naming the key unless `resolveChainSetting(projectRoot).grants[command]` is true; test no open stop
- [ ] 2.2 In `test/core/emit-composition.test.ts`: a granted `setting` is written (apply and archive); an ungranted `setting` is refused, no file written, error naming the key (no `chain` map, `{review: true}`, `{apply: false}`); `"granted"` and `true` are refused naming the three values; an absent field is still accepted; `consent` on a review payload is still refused as unknown. Tag the three new lifecycle-consent value scenarios `behaviour`
- [ ] 2.3 Re-pin `test/core/rc03b-untouched-modules.test.ts`' hash for `emit-composition.ts`, with a dated comment naming this change

## 3. The bodies

- [ ] 3.1 `src/core/templates/workflows/apply-change.ts` Step 0: add the granted bullet (not typed, and the `chain` object's `next` is this command with `may_run: true` → `setting`, no consent prompt, the era stamp as on the other paths), keep "uncertain → AI-mediated"; the recorded-story sentence and the `consent` payload note name the three values; the emit step says that when the gate refuses `setting` naming the key (a grant withdrawn mid-run), the session writes the emit again with no `consent` field, names the withdrawn key in `final_assessment`, and asks nothing
- [ ] 3.2 `src/core/templates/workflows/archive-change.ts` NEW Step 0: the same granted bullet, plus one sentence stating the tag rules for a granted arrival, worded without any parenthesized `(chain: …)` form so the tag test reads no site there (a target prompt does not fire; a routine prompt takes the default its tag names and `final_assessment` records `The chain took the default: <prompt> — <answer>.`; a decision prompt is asked as on a typed arrival), and that the tail runs as after a Proceed with no preview shown; the emit step carries the same withdrawn-grant line as apply's
- [ ] 3.3 `ARCHIVE_SUMMARY_SCHEMA_REFERENCE`: the schema's `consent` line and the field note name `setting` and the write gate's check; keep the executed example's `user-invoked` (it stays accepted)
- [ ] 3.4 Tag every prompt site in the apply and archive bodies and their references per `A chain treats each prompt by its kind`'s rows: target selection `(chain: target)`; the consent prompt `(chain: not a prompt)`; the two sync lines `(chain: routine, default: Sync now)` and `(chain: routine, default: Archive now)`; every other listed prompt `(chain: decision)`; a mention `(chain: not a prompt)`
- [ ] 3.5 `src/core/disciplines.ts` `CHAIN_END_STEP`: the sentence on where a chained command records its grant gains "a chained apply or archive records it as its `consent: \"setting\"` value and writes no sentence"; update the matching assertion in `chain-prompt-tags.test.ts`

## 4. The tag test

- [ ] 4.1 `test/core/templates/chain-prompt-tags.test.ts`: scan `orbit-apply-change` and `orbit-archive-change` with their references; add their sites to `INVENTORY` and the `ROWS` table; add the two sync tags to `ALLOWED_TAGS`; restate the routine-count test as the three routine tags each appearing once; add a mutation case adding an untagged `AskUserQuestion` to the archive body. Tag the conventions scenarios the test asserts
- [ ] 4.2 Assert in `test/core/templates/orbit-content-fidelity.test.ts` that both bodies' Step 0 carry the granted bullet, read the `chain` object, keep "uncertain, treat the arrival as AI-mediated", that archive's carries the tag sentence, and that both emit steps carry the withdrawn-grant line; tag the provenance, prompt and archive-entry scenarios these assertions cover `text`

## 5. Docs

- [ ] 5.1 `docs/customization.md`: the `chain` row names the `apply` and `archive` keys and the archive key's outward writes (push, description or stage entry, ready flip) and that the merge stays yours, dropping "No key grants apply or archive"; the `consent` row says a marked step is one you invoke or grant with `chain`. `docs/workflow-engine.md`'s consent paragraph and `docs/getting-started.md`'s marker sentence say the same

## 6. Declare and verify

- [ ] 6.1 Declare every delta scenario still uncovered (`orbit status --change seam-chaining-grants --scenarios`) by a test tag, or by an `orbit/scenario-ledger.yaml` entry when no test can assert it (the carried bulk-archive, abort and preview scenarios), until `uncovered` is 0 — including the 40 scenarios of the four blocks carried at the proposal walk (`Internal-run JSON summary format` 12, `PR-attached archive tail` 20, `Gate declaration in schema YAML` 7, `The engine never prompts for consent` 1)
- [ ] 6.2 Re-pin `skill-templates-parity.test.ts`' function and generated-content hashes for every skill whose body moved (propose, ff, apply, review, address-reviews, archive), after confirming each diff is this change's
- [ ] 6.3 `npm run build && node bin/orbit.js update --force`, then the full `npm test` (green, no `FAIL`), `orbit validate seam-chaining-grants --strict`, and `orbit validate --sources`
