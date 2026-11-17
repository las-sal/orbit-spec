## 1. Baseline

- [x] 1.1 Run the full `npm test` for the green baseline, then, before any template edit, record the sha256 of each block that moves (design §1: `COMMIT_STEP`, `CHAIN_END_STEP`, `SIGNOFF_HOLD_STEP`, `PROGRAM_SIGNOFF_STEP`, archive Step 3.4's and Step 3.45's text, propose's size brief, propose's and ff's PR Position paragraphs, each from its bold `**Position` label up to the line beginning "Read the RESOLVED regime", architect 5.5's arc-done act) as today's templates compose it, into a new `test/core/templates/moved-blocks.test.ts`

## 2. The shared steps

- [x] 2.1 In `src/core/disciplines.ts`, add `COMMIT_STEP_BASIC`, `CHAIN_TAG_MEANING` (composed into `CHAIN_END_STEP` with its bytes unchanged), `CHAIN_END_STEP_BASIC` and the two reference constants (`commit-step.md`, `chain-end-step.md`); the six commit-carrying and five chaining bodies interpolate the basic contents (design §3) and ship the references
- [x] 2.2 Retarget `commit-step.test.ts`, `chain-prompt-tags.test.ts` (its stripped text also strips the chain end step's basic content) and `account-step.test.ts` (its anchor becomes `COMMIT_STEP_BASIC`); tag the delta scenarios of `The commit step closes each carrying body` and `No-chaining contract` `text`, each tag on a test that asserts its THEN about the generated text

## 3. Archive, architect, propose and ff

- [x] 3.1 In `archive-change.ts`, export Step 3.4's and Step 3.45's text as constants and ship `gate-inflection.md`, `fingerprint-divergence.md` and `signoff-hold.md` (`SIGNOFF_HOLD_STEP`, which bulk-archive keeps interpolating unchanged); the body carries the three basic contents, headings kept
- [x] 3.2 In `architect.ts`, compose `PROGRAM_SIGNOFF_STEP` from a save part and a hold part (bytes unchanged), ship `program-signoff.md`, carry the save part and the hold's basic content in 5.4, and move 5.5's arc-done act into `pr-resolution.md` (in `pr-choreography.ts`)
- [x] 3.3 In `propose.ts`, ship `size-brief.md` (the section's text with its checked mirror) and carry its basic content; move propose's and ff's PR Position paragraphs into a new `## Where each phase runs` section of `pr-choreography.md` (design §1: the selection line, then `### In /orbit:propose` and `### In /orbit:ff`) and carry their one-line replacements
- [x] 3.4 Retarget `signoff-hold-step.test.ts`, `program-signoff-step.test.ts`, `size-declaration-parity.test.ts`, `archive-user-validation.test.ts` and `orbit-content-fidelity.test.ts`, and extend the closed reference lists in `orbit-generated-surface.test.ts`, `config-profile.test.ts` and `orbit-content-fidelity.test.ts`; tag the delta scenarios of the archive, architect and size-brief requirements `text`, as in 2.2
- [x] 3.5 Complete `moved-blocks.test.ts`: each reference file holds its block, whose sha256 equals the recorded one; each basic content is byte-equal across its carrying bodies; each body names every reference file its skill ships (one level deep); the pointer of each of the seven basic contents that follow a command's result (design §3) carries "the result you already have", and the three PR-section pointers are not checked for it; `pr-choreography.md` carries the selection line and both workflow subsections; show the test able to fail with one deliberate byte change, then revert

## 4. Holding the size

- [x] 4.1 Add `test/core/templates/skill-body-budget.test.ts` (design §5): character ceilings at each body's post-change size plus 5%, the 500-line limit with explore's 664-line ceiling, and the failure message that states the rule and names `skill_body_convention.md`; show it able to fail by lowering one ceiling, then revert
- [x] 4.2 Add `scripts/skill-size-report.mjs` and the `size:report` npm script (design §6), and a CI step running it after `npm test` on the Linux leg that never fails the build

## 5. The rule and the docs

- [x] 5.1 Write `skill_body_convention.md` at the root (design §7) and add CLAUDE.md's one line naming the rule and the file
- [x] 5.2 Correct README's and `docs/supported-tools.md`'s count of workflows holding a `references/` directory from eight to fourteen (every workflow but onboard), recording the docs call as a ledger entry

## 6. Closing

- [x] 6.1 Update `skill-templates-parity.test.ts`'s function and generated-skill hashes with a dated comment naming each moved hash and why
- [x] 6.2 Show by test, in a disposable project at the defaults, that each gating command returns the result its basic content handles itself: `orbit pr commit` → `action: off`, the status `chain` object → `configured: false`, `orbit brief --change` and `orbit brief <doc>` `--hold` → `why: "off"`, and the status `size` object → `ceiling: null`; and that the three stage-D steps' usual results are the ones their basic contents handle (the stage's second exit criterion): every reviewed gate `passed` or `superseded`, `orbit fingerprint --check` with every requirement `verified`, and a size check that is on with `breaches` empty
- [x] 6.3 Run the full `npm test` green, `npm run build && node bin/orbit.js update --force`, and `npm run size:report`; record each body's post-change size against design's size table and set the budget test's ceilings from the measured sizes
- [ ] 6.4 (User-validation) Observe this change's own apply, review and archive sessions on the new bodies and record, for each, whether it compacted and what of the skill bodies it lost (R-rop-12, D-cs-9)
