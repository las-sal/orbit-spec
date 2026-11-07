## 1. The owning statement in code

- [ ] 1.1 Create `src/core/disciplines.ts`: `DECISION_WRITING_DISCIPLINE`, composed from `PAYLOAD_STOP_CONDITIONS` and `LEDGER_AREAS` with a typed gloss per payload condition, equal to the fence in this change's `orbit-conventions` delta (design D1, D2)
- [ ] 1.2 Write `test/core/decision-writing-parity.test.ts`: the module string equals the owning fence (read through `test/helpers/owner-text.js`); it names every payload condition and ledger area in order and not `tripwire`; show each assertion able to fail with a clean mutation

## 2. The bodies

- [ ] 2.1 In the fourteen workflow templates carrying an epitome, rename the heading to `## Execution disciplines (epitome)`, drop the count from the intro line, and append `${DECISION_WRITING_DISCIPLINE}` as the fifth bullet after no-chaining (design D2, D3)
- [ ] 2.2 Drop the count from `review.ts`'s two mentions ("the execution disciplines"); in `onboard.ts`, drop the count from the list heading and add a fifth descriptive item naming decision-writing (design D4)
- [ ] 2.3 Extend the parity test: every epitome-carrying workflow body contains the statement exactly once, as the bullet after no-chaining; then grep the generated surface and `src/` for any remaining "four … disciplines" wording and fix each current-state hit

## 3. Tests that enumerate the edited text (G0, design D7)

- [ ] 3.1 Update the generated-skill hash pins in `skill-templates-parity.test.ts`, the onboard marker in `orbit-content-fidelity.test.ts`, and the sync-specs heading list in `verify-scenario-map.test.ts`; record each edit, with the reason, for the archive's G0 note

## 4. Specs and project docs

- [ ] 4.1 Edit `orbit/specs/orbit-decision-records/spec.md`'s Purpose in place to say "the user" (design D5)
- [ ] 4.2 Add the decision-writing discipline to `CLAUDE.md`'s execution disciplines list
- [ ] 4.3 Declare every delta scenario: a `@scenario` tag where a test asserts what the THEN is about, else an `orbit/scenario-ledger.yaml` entry (the AI-conduct scenarios as `untestable`); `orbit validate decision-writing --strict` reports no undeclared scenario (design D6)

## 5. Verification

- [ ] 5.1 `npm run build && node bin/orbit.js update --force`, then confirm the installed `.claude/skills/*/SKILL.md` carry the statement; measure the bodies' size growth and record it
- [ ] 5.2 Run the full `npm test` and `orbit validate decision-writing --strict`; both green
