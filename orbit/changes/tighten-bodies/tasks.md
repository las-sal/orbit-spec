<!--
Implementation chunks:
  Chunk 1 (groups 1-4): Hashes, the decision-writing bullet, Guardrails, provenance
  Chunk 2 (groups 5-6): Frontmatter, descriptions and reference files
  Chunk 3 (groups 7-8): The edit ledger, the test sweep, sizes and ceilings
-->

## 1. Before any edit

- [ ] 1.1 From the skills generated at HEAD, record in the new `test/core/templates/tightened-bodies.test.ts` the sha256 of the `instructions` of each body this change edits (the twelve tightened bodies, plus explore and bulk-archive for the shared bullet), and run the full `npm test` for the baseline count

## 2. The decision-writing bullet (design Decision 1)

- [ ] 2.1 Restructure `DECISION_WRITING_DISCIPLINE` in `src/core/disciplines.ts` to the `Decision-writing discipline` fence, still composed from the write gate's condition and area lists; move `test/core/decision-writing-parity.test.ts` to the new form and tag the requirement's modified and new scenarios

## 3. Guardrails (design Decision 2)

- [ ] 3.1 Remove the twenty-three lines `Restated Guardrails lines are removed from orbit-modified bodies` names from the apply, archive, continue, ff, new and propose templates (archive's heading with them), leaving sync-specs' list unchanged; remove `chain-prompt-tags.test.ts`' rows for apply's lines 4 and 7, whose step 6 lines already have their own rows

## 4. Provenance (design Decision 3)

- [ ] 4.1 Remove stage tags, `NEW` before step numbers, ruling and decision ids, and owning-spec citations in headings from the twelve tightened templates and from the basic-content step headings in `src/core/disciplines.ts` (`COMMIT_STEP_BASIC`, `CHAIN_END_STEP_BASIC`, and the account steps' basic contents, splitting `ACCOUNT_STEP_HEADING` and `ACCOUNT_WALK_STEP_HEADING` so the full steps keep theirs and `moved-blocks.test.ts`' hashes hold; and split the three paragraphs apply's and architect's bodies share with their pinned run-summary references — apply's completion-prompt override, architect's "(Per `orbit-run-summary-emit` …)" note and "No emit without sweep" paragraph — the body's copy losing its provenance), per `Tightened bodies carry no provenance`; remove a prose citation only when its sentence still instructs without it and no requirement asks the body to name it (grep `orbit/specs/` for each before removing; the Severity ladder and brief-rule citations stay); move text only authors need to a comment beside the literal
- [ ] 4.2 Remove the thirteen mirror notes, keeping each copied text byte-equal; give each parity suite anchored on a `CHECKED MIRROR` note a new anchor on the copied text itself; tag the modified scenarios of `Review mode decision framework` and `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record`
- [ ] 4.3 Read each of the twelve regenerated bodies whole for any provenance form outside the six kinds (the named limit's method), and record each find in the change's account, leaving it in place for the evaluation: a form the six kinds' patterns do not cover is never removed in this stage

## 5. Frontmatter and descriptions (design Decision 4)

- [ ] 5.1 Make `generateSkillContent` write `name`, `description`, `license` and `compatibility` through `yamlScalar`; reword address-reviews' description to about 360 characters and add architect's and onboard's when-clauses (design Decision 4's drafts); add a test that parses every generated frontmatter with `yaml`, holds each description at most 1,024 characters with a when-clause (a "Use" clause containing "when", or "Use after" — audit-drift's unchanged "Use standalone when" passes), a colon-bearing description string-equal after parsing, and a plain value bare; tag the requirement's scenarios

## 6. Reference files (design Decision 4 and RG2)

- [ ] 6.1 Add a hand-written `## Contents` section after the title of each of the eleven references over 100 lines, in its source (`decision-records.md` once, in `src/core/disciplines.ts`; `prompt-template.md`'s naming the template as one section); add a test over every generated reference: over 100 lines means `## Contents` first after the title, and each entry names a heading the file carries; tag the scenarios
- [ ] 6.2 Name `references/prompt-template.md` and `references/mode-sections.md` in review's `--reviewer external` flag row; remove `TWO_LEVEL` from `moved-blocks.test.ts` so its one-level check covers review whole; remove the sentence naming the two-level chain from `skill_body_convention.md`'s Exceptions, update its commit-step example to the basic content's new heading, and make its budget rule say explore's line ceiling rose once, to 669, for the decision-writing bullet's five lines (D-tb-17); tag `Review's body names its prompt references`

## 7. The edit ledger (design Decisions 5 and 6)

- [ ] 7.1 In `tightened-bodies.test.ts`, write every edit to the fourteen bodies as a (before, after) pair of kind `restated`, `provenance`, `restructured` or `link`, from the generated diff; check each kind as `An edit ledger holds every tightened body to its recorded text` states; undo every pair and compare with the hashes from task 1.1; add one mutation per check shown to fail; tag the ledger's, the Guardrails' and the provenance requirements' scenarios
- [ ] 7.2 Grep `test/` for every removed string the pairs list, and move each assertion by the ledger requirement's second table; an assertion fitting no row stops the work and is raised, not edited to pass; list every edited test by row for the archive

## 8. Sizes, ceilings and close

- [ ] 8.1 Re-record `skill-templates-parity.test.ts`' hashes; run `npm run size:report` and confirm the bodies total at most 365,500 and apply at most 18,300 (RG1 as amended; if either is over, stop and raise it, never trimming further); lower each ceiling in `skill-body-budget.test.ts` to its body's new size plus 5%, rounded up, as a named edit per body; a body whose new size plus 5% would exceed its current ceiling (explore, bulk-archive, onboard and sync-specs, by the drafts) keeps that ceiling, after checking it still fits under it, so none rises; and raise explore's line ceiling, with the test's `≤ 664` assertion, from 664 to 669 for the decision-writing bullet's five lines, the one named rise (D-tb-17; R-rop-8 and RG3 as amended), then lower it to explore's line count if that is less
- [ ] 8.2 Run the full `npm test` (the count against task 1.1's) and `orbit validate tighten-bodies`, then `npm run build && node bin/orbit.js update --force` so `.claude/` carries the new bodies, and commit and push
