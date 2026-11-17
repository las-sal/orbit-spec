<!--
Implementation chunks:
  Chunk 1 (groups 1-2): Hashes and the account step
  Chunk 2 (groups 3-5): The emit steps, the convention, the regenerated surface
  Chunk 3 (groups 6):   A fresh session on the new bodies: ceilings and the account
-->

## 1. Before any edit

- [ ] 1.1 From the skills generated at HEAD, record in `test/core/templates/moved-blocks.test.ts` the sha256 of each block that leaves a body: `ACCOUNT_STEP`, `ACCOUNT_WALK_STEP`, and the emit section of apply, archive (Step 5.5), architect, review (Step 9), verify, propose and address-reviews (step 6), each whole with its heading, as the body carries it today

## 2. The account step (D-opsd-3)

- [ ] 2.1 Add `ACCOUNT_STEP_BASIC` and `ACCOUNT_WALK_STEP_BASIC` to `src/core/disciplines.ts` (design Decision 1), interpolate them where the full steps sit in the apply and address-reviews templates, and ship `references/account-step.md` (apply) and `references/account-walk-step.md` (address-reviews), each a one-line title followed by the full constant
- [ ] 2.2 Retarget `account-step.test.ts` and `account-reading-walk.test.ts` to the reference files; add tests that each basic content is carried once and in place (apply's before its run-summary emit and commit step; the walk's after step 6 and before the commit step) and that each reference is its title plus its constant; tag the two new `orbit-decision-records` scenarios

## 3. The emit steps (D-opsd-4, D-opsd-5)

- [ ] 3.1 Add `RUN_SUMMARY_READ_CUE` to `src/core/disciplines.ts`; in each of the seven templates export the emit section as one constant composed from its parts, the staying paragraphs being constants interpolated into both the section and the body, so the body carries its heading, staying paragraphs, the cue and its command block (design Decision 3's table), and ship `references/run-summary-emit.md` as a one-line title followed by the section constant; archive and address-reviews keep a sentence naming their schema reference
- [ ] 3.2 Retarget the pins the propose probe found to the reference, keeping each `@scenario` tag on its assertion: `archive-user-validation.test.ts` (not-ready), `orbit-content-fidelity.test.ts` (the editorial markers of propose, apply and archive; architect's `stages_ended` mirror; review Step 9's `reproduction`, `blocks` and `direction`; the consent, consent-Abort and withdrawn-grant lines), `orbit-generated-surface.test.ts` (propose, apply and address-reviews) and `reading-step-surface.test.ts` (`decision_records_read`)
- [ ] 3.3 Add tests for `A body reads its run-summary detail before the session's first emit`: the cue byte-equal and once in each of the seven bodies, followed by its command; each `run-summary-emit.md` equal to its title plus its section constant; apply's chunk-boundary sentence with `(chain: not a prompt)`, the completion-prompt overrides and propose's second publish segment in the bodies; ff, continue, new and audit-drift unchanged and shipping no `run-summary-emit.md`; tag the five scenarios
- [ ] 3.4 Move the per-skill reference lists (`test/core/init.test.ts`, `test/commands/config-profile.test.ts`, `orbit-generated-surface.test.ts`) and the `skill-templates-parity.test.ts` hashes to the new surface, and confirm `moved-blocks.test.ts`' one-level check passes with every body naming every reference it ships

## 4. The convention

- [ ] 4.1 Add the once-a-session rule to `skill_body_convention.md` (design Decision 4), with the emit step as an example and the four untouched emit sections among the Exceptions, and widen the CLAUDE.md sentence that summarizes the convention

## 5. Close the first session

- [ ] 5.1 Run the full `npm test` (record the count; 4,331 at propose) and `orbit validate once-per-session-detail`, then `npm run build && node bin/orbit.js update --force` so `.claude/` carries the new bodies, and commit and push, ending the session after its run summary

## 6. Final chunk, in a NEW `/orbit:apply` session on the regenerated bodies (D-opsd-6)

- [ ] 6.1 Confirm this session loaded the new apply body: its Account step section is the basic content naming `references/account-step.md`, and its run-summary step carries the read sentence
- [ ] 6.2 Lower each ceiling in `skill-body-budget.test.ts` to its body's new size plus 5%, rounded up, as a named edit per body (none rises), and run `npm run size:report`, recording each body's and reference's size and the bodies' total
- [ ] 6.3 Run the full `npm test` after the ceilings change; this session then reads the apply gate, follows the account cue to write the change's account, and composes its run summary from `references/run-summary-emit.md` (the exit criterion's evidence, checked at the system review)
