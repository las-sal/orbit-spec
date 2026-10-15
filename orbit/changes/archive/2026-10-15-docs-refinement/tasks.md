## 1. The start-sections check

- [x] 1.1 In `test/helpers/user-docs.ts`, add the start-section list (the eight (page, heading) members of `orbit-user-docs`' `The user docs' start sections name the architect workflow first`), a section reader (markdown-it headings; a section ends at the next heading of the same or a higher level; fences included), a start-command scan (`/orbit:<id>` anywhere, and `<id> ──►` inside a fence with `<id>` a whole word, for `architect|explore|new|propose|ff`), and `startSectionFailures(surfaces)` returning one message per failure naming page, heading and reason (wrong first command, no start command, heading not found).
- [x] 1.2 Add `test/core/user-docs/start-sections.test.ts`: the shipped-docs run plus fixture cases, tagged `@scenario` for the four new scenarios (every section leads with architect; a section leading with explore fails; a fenced `explore ──►` is read as a start; a missing heading fails). Mutation-check each fixture case: revert it to the passing shape and see it pass, then back to red.
- [x] 1.3 Wire the check into the pending-rewrite gate's file-local set in `test/core/user-docs/pending-rewrite.test.ts`, as the modified `The user docs are a checked surface, gated by an exact pending-rewrite list` states (it reads the listed pages and passes every other file).
- [x] 1.4 Run the new test against today's docs and confirm it fails on all eight sections before any doc edit (the oracle shown able to fail).

## 2. The architect-first pages

- [x] 2.1 `README.md` › `### Your first change`: open the numbered list with `/orbit:architect <program>` declaring the work, then the per-change steps; keep explore as the step after architect; end the list with `/orbit:architect <program>` reviewing and ratifying the stage after archive.
- [x] 2.2 `docs/getting-started.md` › `## The change`: add step 0 running `/orbit:architect <program>` (`### 0. Architect`: what the session writes, and that the change cites its stage; the existing steps keep their numbers), add a closing step after Archive (`### 8. Ratify the stage`: `/orbit:architect <program>` reviews the stage and ratifies it, a step that gates nothing), and name `/orbit:explore` alone as the path for a one-off fix, after architect (D-dr-1). Rewrite the page intro (`docs/getting-started.md:3`) so it states no command count ("lists the commands of a first change").
- [x] 2.3 `docs/workflows.md`: open "One change, start to finish"'s flow block with `/orbit:architect`; open "Step by step" with a clause placing it after an architect session ("After `/orbit:architect <program>` declares the work, …"; the check counts only a named command, never "an architect session"), keeping `/orbit:new` and `/orbit:continue` as the artifact-by-artifact way to create the change; make "Exploring first" name architect before explore, explore as the one-off path; make the Practices list name architect before "Explore when unsure".
- [x] 2.4 `docs/workflow-engine.md` › `## Actions, not phases`: the flow diagram starts at architect in the form `architect ──► explore ──► propose ──► …`, its return loop still spanning propose…archive only, and one clause says architect plans the program before any change exists, without changing what the section says about actions on a change.
- [x] 2.5 `docs/concepts.md` › `## Artifacts`: add the sentence placing explore after architect, before "orbit adds an exploration before the proposal"; add `orbit-architect` (whose `Start surfaces name the architect workflow first` owns the sentence) to its `Carried by:` line.
- [x] 2.6 Reorder README's command table and `docs/commands.md`'s Quick reference so `/orbit:architect` is first (D-dr-5); keep every row (the coverage check reads both).

## 3. Verify

- [x] 3.1 Run `npm run build && npm test`; the new check passes on every listed section, and the existing `orbit-user-docs` checks (residue, coverage, carried-by, claims, floors) stay green.
- [x] 3.2 Run `orbit validate docs-refinement --strict` and `orbit status --change docs-refinement --scenarios`; the four new scenarios are declared.

## 4. Residual sweep

- [x] 4.1 Run D-dr-4's residual method: grep README.md and docs/ for "start", "begin", "first change", "new work", "entry" and "create", classify each hit against the start-section table, and either add a missed start section to the list (and the requirement's table) or record why it is not one.

## 5. Review

- [x] 5.1 (User-validation) Sal reads the edited pages — README Quickstart, getting-started, workflows, workflow-engine's diagram, concepts' `## Artifacts` — and confirms they read architect-first (the stage's exit criterion "Sal has reviewed the pages"). — observed by Sal at the ratifying architect session, 2026-10-15.
