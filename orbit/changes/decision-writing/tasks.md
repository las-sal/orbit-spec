## 1. The owning statement in code

- [ ] 1.1 Create `src/core/disciplines.ts`: `DECISION_WRITING_DISCIPLINE`, composed from `PAYLOAD_STOP_CONDITIONS` and `LEDGER_AREAS` with a typed gloss per payload condition, equal to the fence in this change's `orbit-conventions` delta (design D1, D2)
- [ ] 1.2 Write `test/core/decision-writing-parity.test.ts`: the module string equals the owning fence (read through `test/helpers/owner-text.js`); it names every payload condition and ledger area in order and not `tripwire`; show each assertion able to fail with a clean mutation

- [ ] 1.3 Export the citation shapes and plain-field list from `src/core/decision-records.ts`; add `DECISION_RECORDS_REFERENCE` to `src/core/disciplines.ts`: per record the command, payload form, fields, citation kinds, the plain-language rule, and one example payload as a plain `json` block (design D8)
- [ ] 1.4 Extend the parity test: the reference names exactly each command's `DECISION_PAYLOAD_FIELDS` and every citation kind; each example payload is submitted unchanged through its `orbit emit` command in a disposable project seeded with what it cites, and accepted; `emit-schema-parity`'s reference list is unchanged; show each assertion able to fail with a clean mutation

## 2. The bodies

- [ ] 2.1 In the fourteen workflow templates carrying an epitome, rename the heading to `## Execution disciplines (epitome)`, drop the count from the intro line, append `${DECISION_WRITING_DISCIPLINE}` as the fifth bullet after no-chaining, and add `{ name: 'decision-records.md', content: DECISION_RECORDS_REFERENCE }` to each one's `references` (design D2, D3, D8)
- [ ] 2.2 Drop the count from `review.ts`'s three mentions (lines 406, 1059, 1308: "the execution disciplines"); in `onboard.ts`, drop the count from the list heading and add a fifth descriptive item naming decision-writing; in `orbit-content-fidelity.test.ts`, assert the onboard body names all five disciplines, and show the assertion fails with the fifth item removed (design D3, D4)
- [ ] 2.3 Extend the parity test: every epitome-carrying workflow body contains the statement exactly once, as the bullet after no-chaining; then grep the generated surface and `src/` for any remaining "four … disciplines" wording and fix each current-state hit

## 3. Tests that enumerate the edited text (G0, design D7)

- [ ] 3.1 Update the generated-skill hash pins in `skill-templates-parity.test.ts`, the onboard marker in `orbit-content-fidelity.test.ts`, the sync-specs heading list in `verify-scenario-map.test.ts`, the per-skill reference lists in `orbit-generated-surface.test.ts` and `config-profile.test.ts`, and `profile-sync-drift.test.ts`'s reference-less example (re-pointed at a skill that ships no reference); then run the full suite and treat any other failing enumeration the same way, naming it; record each edit, with the reason, for the archive's G0 note

## 4. Specs and project docs

- [ ] 4.1 Edit `orbit/specs/orbit-decision-records/spec.md`'s Purpose in place to say "the user" (design D5)
- [ ] 4.2 Add the decision-writing discipline to `CLAUDE.md`'s execution disciplines list, noting that until a release carrying decision records is installed, records here are written with `node bin/orbit.js emit …` (design Risks)
- [ ] 4.3 Declare every delta scenario: a `@scenario` tag where a test asserts what the THEN is about, else an `orbit/scenario-ledger.yaml` entry (the AI-conduct scenarios as `untestable`); `orbit validate decision-writing --strict` reports no undeclared scenario (design D6)

## 5. Verification

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`, then confirm the installed `.claude/skills/*/SKILL.md` carry the statement; measure the bodies' size growth and record it
- [ ] 5.2 Run the full `npm test` and `orbit validate decision-writing --strict`; both green
