<!--
Implementation chunks:
  Chunk 1 (groups 1-2): the command, and the rule moved to the reference
  Chunk 2 (groups 3-4): the text that says "every setting", sizes, and the close
-->

## 1. The command (design Decisions 1 and 2)

- [ ] 1.1 Run the full `npm test` for the baseline count; then add `src/core/decision-status.ts` with the predicate over `resolveChainSetting`'s grants, `takesAccount(resolveSignoffSetting(...))` and every sensor in `tripwireSensors()` whose `onFire` reads `halt` from `resolveTripwiresSetting({ projectRoot })`, returning `write` and `readers` in the order `chain`, `signoff`, `tripwires`
- [ ] 1.2 Register `orbit decisions status [--json]` beside `orbit decisions brief` in `src/cli/program.ts`, with the two human lines and the JSON shape of `orbit decisions status says whether decision records are written`, and add it to the completion registry
- [ ] 1.3 Add `test/core/decision-status.test.ts`: one case per row of `Decision records are written when a setting reads them` (a granted chain key, a map with no grant, `signoff: change` and `program`, `off` and `weekly`, a halting and a recording tripwire, no config, an unparseable config), all three readers in order, and the CLI's plain and `--json` output; tag the ADDED requirement's scenarios and the renamed requirement's three new ones as `behaviour`
- [ ] 1.4 Re-tag `test/core/decision-records.test.ts`' `A stop under supervised settings halts nothing` to `Decision records are written when a setting reads them`, and rehearse the RENAMED and MODIFIED merge with `buildUpdatedSpec` from `dist/core/specs-apply.js` (the new title present, the old absent)

## 2. The rule moves to the reference (design Decisions 3, 4 and 5)

- [ ] 2.1 In `src/core/disciplines.ts`: change `DECISION_WRITING_DISCIPLINE`'s opening clause to "when `orbit decisions status` reports `write: true`,", add `DECISION_WRITING_BASIC` (the basic content's fence), and give `DECISION_RECORDS_REFERENCE` its new opening sentence, a first `## When to write a record` section holding the rule, and the Contents entry
- [ ] 2.2 Replace `${DECISION_WRITING_DISCIPLINE}` with `${DECISION_WRITING_BASIC}` in the fourteen workflow templates, and reword onboard's one-line Decision-writing statement to say records are written when a setting reads them, naming `orbit decisions status`
- [ ] 2.3 Move `test/core/decision-writing-parity.test.ts` to two fences: the rule held equal to its fence, the basic content held byte-equal in the fourteen bodies and to its fence, no body carrying the rule, and the reference carrying the rule in its first section; tag `Every workflow body carries the basic content`, `At the defaults the body directs no record`, `The basic content names when the command runs` and `The reference carries the rule whole`
- [ ] 2.4 In `tightened-bodies.test.ts`, undo the swap first (the basic content replaced by the labelled form as `tighten-bodies` left it, "under every setting," restored), keep the pairs and hashes as they are, run the clause check on the rule in the reference with "under every setting" named as the one replaced clause, and show a mutation (a dropped clause) still fails
- [ ] 2.5 Run the full suite and move every other assertion that pinned the bullet in a body to the text's new home, per RG0 (follow the text, never weaken): re-record `skill-templates-parity.test.ts`' hashes, and list every edited test for the archive; an assertion that fits no such move stops the work and is raised

## 3. Everything that says "every setting" (design Decision 6)

- [ ] 3.1 Edit `orbit/specs/orbit-decision-records/spec.md`'s Purpose in place so it says the records are written when a setting reads them
- [ ] 3.2 In `docs/cli.md`, reword the decision-records paragraph and add an `orbit decisions status` section beside `orbit decisions brief`; in `docs/customization.md`, say in each of the `chain`, `signoff` and `tripwires` rows which state of the setting makes the AI write decision records; run the user-docs suites
- [ ] 3.3 Rewrite CLAUDE.md's Decision-writing bullet: records are written when `orbit decisions status` says so (`node bin/orbit.js decisions status` until a release carries it), which in this repository, with no `chain`, `signoff` or `tripwires` key, is never
- [ ] 3.4 Sweep the repository (`src/`, `test/`, `docs/`, `orbit/specs/`, `README.md`, `CLAUDE.md`, `skill_body_convention.md`) with whitespace-normalized searches for "under every setting", "in every mode" and "written in every mode" applied to decision records, and fix each current-state hit

## 4. Sizes and close

- [ ] 4.1 `npm run build && node bin/orbit.js update --force`; confirm `node bin/orbit.js decisions status` prints `Decision records: not written (no setting reads them)` here, and that a regenerated body carries the basic content
- [ ] 4.2 Lower `skill-body-budget.test.ts`' ceilings to each body's new size plus 5% from `npm run size:report`, and explore's line ceiling to its new line count, each a named edit (RG3); update `skill_body_convention.md`'s statement of explore's line ceiling
- [ ] 4.3 Run the full `npm test` and `node bin/orbit.js validate records-by-setting --strict` (no undeclared scenario), and record the before and after body totals for the archive
