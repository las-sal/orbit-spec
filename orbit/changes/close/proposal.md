## Why

`reduce-orbit-phase2`'s last stage, `close`, measures the program against its goals. After `cut-explore-onboard`,
`npm run size:report` reads every one of the fourteen generated skill bodies at or under 5,000 estimated tokens, the
part of an invoked skill Claude Code keeps after a compaction (explore 4,996, the largest). No baseline requirement says
they must stay there. G1 is a goal of this program, and `test/core/templates/skill-body-budget.test.ts` holds each body
under a character ceiling. Once the program ends, though, a later edit could raise a ceiling past 20,000 characters and
the suite would accept it. `skill_body_convention.md` says to fix a breach by moving a step's procedure, never by
raising a ceiling, but nothing checks that rule. At this propose Sal chose to make G1 a lasting rule (2026-11-28),
alongside the charter's grading of G0 to G3.

## What Changes

- **A new requirement in `orbit-skill-generation`**: every generated skill body stays at or under the 5,000 estimated
  tokens a compaction keeps, measured as `npm run size:report` measures it. That is the generated `SKILL.md`,
  frontmatter included, at four characters a token, so at most 20,000 characters. The requirement also states:
  - each body is held to a character ceiling of at most 20,000 and to the 500-line limit;
  - a breach is fixed by moving a step's procedure to a reference file, never by raising a ceiling past the cap.
- **The budget test holds it.** `skill-body-budget.test.ts` fails when any ceiling is over 20,000 characters, naming
  the body. It also fails when its cap and `scripts/skill-size-report.mjs`' constants disagree, so the test and the
  report measure the same budget. Each new check is shown failing on a clean mutation.
- **Stale figures corrected.** Two ceiling comments give sizes taken before `cut-explore-onboard`'s walk: explore's
  (19,854, now 19,984) and onboard's (19,939, now 19,951). They are corrected. The size report's header comment and the
  test's doc comment say the cap is permanent, not a goal of this program alone.
- **`skill_body_convention.md`** names the requirement as the rule behind its budget bullet.
- **The program graded at archive.** The stage's Shipped as and the doc's status log grade G0 to G3, each with its
  evidence: the removals by ruling, the size report, the ceiling history, and the replay marks. `CLAUDE.md`'s program
  paragraph records that phase 2 is done and that `automate-dev-flow` goes back to architecture to be rescoped first
  (R-rop2-3).

No skill body's text changes, so the cut ledger and the parity hashes are untouched, and nothing is replayed
(R-rop2-10).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-skill-generation`: ADDED requirement, "Every generated skill body fits what a compaction keeps".

## Impact

- `test/core/templates/skill-body-budget.test.ts`: the cap check, the cross-check against the size report's constants,
  their mutations, and the corrected comments.
- `scripts/skill-size-report.mjs`: header comment only. It still reports and never fails.
- `skill_body_convention.md`: one sentence naming the requirement.
- The new requirement's three scenarios are tagged (`@scenario behaviour`) on the budget-test cases that assert them.
- At archive: `orbit/architecture/reduce-orbit-phase2.md` (Shipped as, status log) and `CLAUDE.md`.
- Adopters: none. The budget test and the size report are development-time checks of this repository; nothing
  `orbit init` or `orbit update` writes changes.
