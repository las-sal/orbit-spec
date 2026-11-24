## 1. Record before editing

- [ ] 1.1 Run `npm test` for the green baseline count, then, before any template is edited, create `test/core/templates/cut-ledger.test.ts` recording the sha256 of the `instructions` of the six bodies this change edits (`orbit-address-reviews`, `orbit-review`, `orbit-apply-change`, `orbit-ff-change`, `orbit-propose`, `orbit-onboard`), generated from HEAD (design D5).

## 2. The shared step and the two removals

- [ ] 2.1 `CHAIN_END_STEP_BASIC` (`src/core/disciplines.ts`): drop `CHAIN_TAG_MEANING`, add D2's pointer sentence; `CHAIN_END_STEP` unchanged. One `shared` pair in the cut ledger naming the five carriers; `chain-prompt-tags`, `moved-blocks` and `conditional-steps-results` follow the scenario `Each chaining body points at the tags' meaning`.
- [ ] 2.2 Remove batch mode (R-rop2-12, design D3): the body's triggers and batch-mode UX, the Constraints bullet, the sweep clause, the per-source paragraph's batch sentences (body and `run-summary-emit.md`), `resolution-detail.md`'s trigger table and batch paragraph, the schema reference's two rows, its batch example replaced by a per-finding one still carrying `delegation_directive`, the `compatibility` clause, the launcher's `[--batch]`, onboard's command table and `docs/commands.md`'s row; add the one-line notice for a retired trigger; drop `walk_mode_source` and `walk_mode_shifted_at_finding` from `emit-composition.ts`' address-reviews `payloadFields`. Each removal a `removed` pair naming R-rop2-12 and its phrase.
- [ ] 2.3 Remove the blind-pair disagreement test (R-rop2-12): the body's paragraph, the schema reference's `disagreement` key and its example values; `removed` pairs as in 2.2.

## 3. Address-reviews' moves (design D1, D4)

- [ ] 3.1 M1 → `references/discovery.md` (the DISCOVERY fence, the outstanding-set rule, marker restating, `--from-file` ingest) and M2 → `references/triage-sources.md` (several sources, a rediscovered pass), each leaving its basic content and its read; `discovery-parity` re-anchored on the reference, its byte-equality unchanged.
- [ ] 3.2 M3 + M6 → `references/sweep-record.md` (ripple-miss attribution, the five arrays, CHECK SCOPE / PATH, the refusal rule), M7 → `references/reading-findings.md`, M8 → `references/redesign.md`; `sweep-path-parity` re-anchored for the walk skill.
- [ ] 3.3 M5 → `references/resolution-detail.md` (hybrid detection, ratification recording), M9 → `references/report.md`, M10 → `references/run-summary-emit.md` (the per-source paragraph and scope forms leave the body; `moved-blocks`' recorded hash for `ADDRESS_REVIEWS_RUN_SUMMARY_EMIT` re-recorded with a dated note naming 2.2's batch sentences), M11 → `references/cascade.md`.
- [ ] 3.4 R1 (Constraints keep only "never write new markers") and R2 (tighten the prose that stays, no step removed); every positional pointer a move would make wrong reworded BEFORE its text moves. Every edit of group 3 is a `moved` or `reworded` pair.

## 4. Review's moves (design D1, D4)

- [ ] 4.1 V1 → `references/verification.md` (procedure (a)–(e), Verdicts, Sweep scope and paths), the body keeping the genre probe and D4's route for a refusal naming owed `verification` keys; `verification-verdict-parity` and `sweep-path-parity` re-anchored; `review-verification-branch` follows.
- [ ] 4.2 V2 → `references/fresh-dispatch.md` (the dispatch, its brief, a pair's missing fresh half), with `blind-pair.md` step 5c re-pointed to it; V3 → `references/architecture-mode.md`; `review-genre-brief`'s brief regions follow `orbit-review`'s modified grep rule; `blind-pair-command` follows.
- [ ] 4.3 V4 → `references/flags-detail.md` (the flag table, the reviewer-selector table, the wrong-mode notes; its "Loaded only when…" line reworded), V5 (drop "Output format (change modes)"), R1 (the preamble's dispatch detail), R2 (tighten the prose that stays). Every edit of group 4 is a `moved` or `reworded` pair.

## 5. The surface, the ledgers and the budgets

- [ ] 5.1 Each new reference named by its body by path; one over 100 lines opens with `## Contents`; the per-skill reference lists in `orbit-generated-surface.test.ts` and `config-profile.test.ts` gain the new files; `reference-contents` passes.
- [ ] 5.2 The tests that read moved or removed text follow it (`orbit-content-fidelity`, `walk-routing`, `emit-schema-parity`, `reference-roundtrip`), each such edit named for the archive; `tightened-bodies.test.ts` undoes the cut ledger first; each cut-ledger check (`moved`, `removed`, `shared`, the reconstruction) shown failing by a mutation, then reverted.
- [ ] 5.3 After the last template edit, re-pin `skill-templates-parity.test.ts`' hashes that moved (apply, ff, propose, onboard; count them before writing the note), with a dated note.
- [ ] 5.4 `npm run size:report`: address-reviews and review each at most 5,000 estimated tokens (a body still over after R2 is raised, per the inventory's re-entry, never cut further unnamed); lower the character ceilings of review, address-reviews, apply, ff, propose and onboard to their new sizes plus 5%, each a named edit naming its previous ceiling, or keep a ceiling where size plus 5% would exceed it.
- [ ] 5.5 `npm run build`, the full `npm test` (count against 1.1's baseline), `npm run validate:skills`, `node bin/orbit.js validate cut-review-walk --strict`; then `node bin/orbit.js update --force` so the local surface matches the source.
