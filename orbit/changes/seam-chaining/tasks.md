## 1. The chain setting

- [ ] 1.1 Add the optional `chain` key to `ProjectConfigSchema` in `src/core/project-config.ts` and one resolver for it: a map of `review`, `review-external` and `address-reviews` to booleans; an absent or non-map value, a non-boolean entry and any other key grant nothing
- [ ] 1.2 Add `src/core/chain.ts` with the key table of `The chain setting grants each command on its own key` and a function mapping a next-command string to the key whose row covers it, or to no key for `/orbit:apply` and `/orbit:archive` (with or without the ` — user-invoked` marker)
- [ ] 1.3 Tests for every scenario of `The chain setting grants each command on its own key`, plus a test that every command string `commandForClass`, `canonicalNextForReviewed`, `nextAfterPass` and the tracked-gate apply line can return maps to a key or to apply or archive, each test shown able to fail by a clean mutation

## 2. The chain object in the change status

- [ ] 2.1 Compose the `chain` object in `src/core/chain.ts`: `next`, `configured`, `may_run`, `head` (the latest record token on the change's trail) and `why` by the five rows in order — `open-stop` from `readDecisionFolder` and `chainOf` in `src/core/decision-records.ts`, `needs-user` from `resolveExternalRunner` in `src/core/external-runner.ts`, `no-progress` from the two flags
- [ ] 2.2 Put the object on `orbit status --change <name> --json` (`src/commands/workflow/status.ts`, `src/commands/workflow/shared.ts`) and register `--chain-ran <command>` and `--chain-head <token>` in `src/cli/program.ts` and the completions registry; the human output renders nothing of it
- [ ] 2.3 Tests for every scenario of `The change status says whether the next command may run unasked`, each reason shown able to fail, and a byte comparison of the human readout, the gate rows and `next_command` with and without a `chain` key

## 3. The end step in the five bodies

- [ ] 3.1 In `src/core/templates/workflows/propose.ts`, `ff-change.ts`, `apply-change.ts`, `review.ts` and `address-reviews.ts`, make the closing step read `chain` from the status call that supplies the eligibility line: on `may_run: true` print `Chaining: <next> (granted by chain.<key>)` and run it; on `may_run: false` with `configured: true` print `Chain stops: <why>`; otherwise nothing more; pass `--chain-ran` and `--chain-head` on the status read that follows a chained command; and add "unless the change status's `chain` object allows it" to the no-chaining epitome bullet of these five bodies only
- [ ] 3.2 Change the blind-pair reference's end step in `src/core/templates/workflows/review.ts` to row 13 as the `orbit-review` delta words it
- [ ] 3.3 Generated-surface tests for the scenarios of `No-chaining contract` and the blind pair's two end scenarios: the five bodies carry the end step and the clause, every other body's epitome is byte-unchanged

## 4. Prompt kinds and their tags

- [ ] 4.1 Tag each prompt the table of `A chain treats each prompt by its kind` lists, at its site in the review and address-reviews bodies and references, as `(chain: target)`, `(chain: routine, default: <option>)` or `(chain: decision)`; on a chained arrival the address-reviews triage takes walk-all and writes `The chain took the default: triage scoping — walk all.` in `final_assessment`, and a decision prompt ends the chain after the command
- [ ] 4.2 Add `test/core/templates/chain-prompt-tags.test.ts`: find every `AskUserQuestion` site and every prose ask of the pause pattern in the generated review and address-reviews bodies and references; fail on a site without a tag and on a tag the requirement's table does not name; shown able to fail by a clean mutation of each kind
- [ ] 4.3 Generated-surface tests for every scenario of `A chain treats each prompt by its kind` and `Each chained prompt states its kind`

## 5. The fixture chain, docs, and the suite

- [ ] 5.1 Add `test/core/chain.test.ts` cases over a fixture change: a fresh system review with findings and `chain: {address-reviews: true}` gives `may_run: true` for the walk; an unresolved stop record on its trail turns it to `open-stop`; after a walk record the next review is `not-granted` under that setting and `may_run: true` once `review` is granted
- [ ] 5.2 Document the `chain` key, its three keys and its default in `docs/customization.md`, beside the other project settings
- [ ] 5.3 Run `npm run build && node bin/orbit.js update --force` and the full `npm test`; list every existing test edited because it pins body text or enumerates a closed set, for the archive's G0 note
