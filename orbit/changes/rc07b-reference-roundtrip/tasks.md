## 1. Engine — audit-drift counts are computed (D-rc07b-3; design D4)

- [ ] 1.1 Red first: in `test/core/emit-composition.test.ts`, add the four scenarios of `Audit-drift counts are engine-computed` (a supplied `findings_total` refused naming the field; counts computed from findings with `categories_run`; a malformed count input refused — the object shape, numeric ids, a category-less finding, each separately; a finding outside `categories_run` still counted, the union rule) and change the existing audit-drift cases that supply `findings_total` to supply `findings` instead; confirm the new cases fail.
- [ ] 1.2 In `src/core/emit-composition.ts`, remove `findings_total` and `findings_by_category` from the audit-drift `payloadFields`, refuse both as engine-owned, refuse the malformed count inputs naming the field, compute both from `findings` per design D4, and make the `next_recommended` branch read the computed total (the `?? 0` default goes). Green 1.1.
- [ ] 1.3 Move the `src/core/emit-composition.ts` hash in `test/core/rc03b-untouched-modules.test.ts`, with a dated comment naming this change (design D7 — a planned act).

## 2. The audit-drift reference and body (D-rc07b-4; design D5)

- [ ] 2.1 Rewrite the schema block in `audit-drift.ts`'s `run-summary-schema.md` to the owner's shape (`orbit-run-summary-emit`'s `Audit-drift standalone recommendations`): `categories_run` as category-id strings, `findings`, `stale_suppressed`, the two counts shown and marked engine-computed; delete `context`, `caller`, `depth`, `flags`, `categories_skipped`, `findings_summary` and their field notes; delete the RESTORED paragraph naming the three-way divergence and rc07; replace the "6-field universal spine" list with a pointer to `orbit-conventions`' `Internal-run JSON summary format` by name (it omits `model`, which every example carries).
- [ ] 2.2 Add the reference's `json example change project` block — the payload Step 10 tells the AI to write, carrying every AI-supplied key the schema block documents — and repoint the spine paragraph's "per-command extensions ADDED" list to the owner's fields.
- [ ] 2.3 Replace Step 10's inline field list with a pointer to the reference's example.

## 3. Examples for the other payload references (D-rc07b-2; design D1, D6)

Every example below carries every AI-supplied key its schema block documents (a second example per block only where fields are mutually exclusive).

- [ ] 3.1 `review.ts` `run-summary-schema.md`: a `json example change` block for the change-mode schema block and a `json example doc` block for the architecture-mode block.
- [ ] 3.2 `review.ts` `external-handoff.md`: a `json example change` block for the review-external T0 payload.
- [ ] 3.3 `address-reviews.ts` `run-summary-schema.md`: an example block whose scope words are the scopes the reference documents (`archived` included if it documents the archived fallback).
- [ ] 3.4 `archive-change.ts` `archive-summary-schema.md`: a `json example archived` block carrying its `judgements` (the trail is seeded per design D3); repoint the `audit.findings_summary` field note to what the field is (design D6); replace the "6-field universal spine" list with a pointer to `orbit-conventions` by name.
- [ ] 3.5 Move the `getArchiveChangeSkillTemplate` hash in `test/core/templates/skill-templates-parity.test.ts` (and its generated-content hash if it moves), with a dated comment naming this change (design D7 — a planned act).

## 4. Instruments (D-rc07b-1, D-rc07b-5)

- [ ] 4.1 Extract `REFERENCES` from `test/core/emit-schema-parity.test.ts` into `test/helpers/schema-references.ts` and import it in both suites (design D2). Add `test/core/reference-roundtrip.test.ts`: read each reference through `createFenceTracker`, take every `json example` block, map its scope words through the requirement's table, seed the trail per design D3, and submit each block verbatim through `composeAndWriteEmit` in a fresh disposable project per (example, scope) pair; assert acceptance and a written file. Assert each block's examples jointly carry its AI-supplied keys.
- [ ] 4.2 In the same suite, the negative scenarios of `Payload schema references are proven by execution`, each built from a mutated copy of a real reference: an unknown key fails carrying the gate's `unknown payload key` text; a supplied `next_recommended` fails as engine-owned (nothing stripped); an unknown scope word fails naming the opening line; a schema block with no example fails naming the reference; a documented key absent from every example fails naming the key. Plus a count assertion: six schema blocks across five references, each with at least one example.
- [ ] 4.3 In `test/core/emit-schema-parity.test.ts`, delete `KNOWN_DIVERGENCE`, its uses, and the two tests that pin it (`the audit-drift divergence is EXACTLY…`, `known divergence is EXACT…`); set `ENGINE_OWNED_PER_COMMAND['audit-drift'] = ['findings_total', 'findings_by_category']` with a comment naming this change (the requirement's `A new engine-owned key must be declared`); add the `No divergence is tolerated` scenario as a negative test over a mutated reference.
- [ ] 4.4 Measure exit (1) by mutation on the real tree: re-add one refused field (`depth`) to the audit-drift example and confirm the round-trip suite fails with the gate's error; revert. Record the command and its output in the apply emit.
- [ ] 4.5 Measure exit (3) against the BUILT CLI: run `npm run build`, then copy the audit-drift example from the SOURCE template (`audit-drift.ts`'s reference) to a temp file and run `node bin/orbit.js emit audit-drift --payload <file>` (project) and with `--change rc07b-reference-roundtrip`; both write an emit whose `findings_total` equals the example's findings count. Delete both written emits after recording the result in the apply emit.

## 5. Close

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`; grep the generated `.claude/skills/orbit-audit-drift/references/run-summary-schema.md` for each deleted field name (expect none) and for `json example`.
- [ ] 5.2 Sweep for residue: grep `src/`, `test/` and `orbit/specs/` for `KNOWN_DIVERGENCE`, `finding_titles` and "artifact-lint stage" (expect none outside archived records and this change's deltas); grep `src/core/templates/` for `findings_summary` and confirm each hit is a non-audit-drift shape.
- [ ] 5.3 Run the FULL `npm test` (never a filtered run) and confirm the `Test Files` line reports no failures.
