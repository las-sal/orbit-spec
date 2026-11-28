## Context

`reduce-orbit-phase2` set out to fit every generated skill body into the 5,000 estimated tokens Claude Code keeps of an
invoked skill after a compaction (G1). Its three cut stages did that. `npm run size:report` at `dacc46ed` reads the
fourteen bodies from 1,142 (new-change) to 4,996 (explore) estimated tokens, none over. The stage's charter: "The size
report against G1 for every body, the ceilings at their final sizes, and the goals graded; then `automate-dev-flow`
returns to architecture to be rescoped (R-rop2-3)."

What holds the result today:

- `test/core/templates/skill-body-budget.test.ts` renders every skill as `orbit init` writes its `SKILL.md`
  (`generateSkillContent`, frontmatter included), the same text `scripts/skill-size-report.mjs` measures. It fails when a
  body exceeds its character ceiling or the 500-line limit.
- Each ceiling is its body's final size plus 5%. The four bodies where that would pass 20,000 (explore, archive, review,
  address-reviews) and onboard are capped at 20,000. `cut-explore-onboard` set every ceiling at its last edit.
- `skill_body_convention.md` says to fix a breach by moving procedure, never by raising a ceiling.

What does not hold it: no baseline requirement states G1, and the test accepts any ceiling value. After the program, a
ceiling raised to 21,000 in an ordinary change would pass the suite and every review that does not read the program doc.
The size report never fails by design (its header says so).

The ceiling history settles the G2 grade. A comparison of every ceiling at `e2eabb02` (phase 1's merge) with `HEAD` and
across each commit that edited the test shows no ceiling rising. Twelve were lowered, and one (bulk-archive's) left with
its workflow.

## Goals / Non-Goals

**Goals:**

- G1 becomes a baseline requirement that outlives the program, with the suite failing on a ceiling over the cap.
- The test's cap and the size report's arithmetic cannot drift apart unnoticed.
- The two stale ceiling comments are corrected ("Fix what we see now").
- The program's goals are graded with evidence at archive, and `CLAUDE.md` names what comes next.

**Non-Goals:**

- Any body text edit. The cut ledger, the parity hashes and the replay set are untouched.
- Making the size report fail. CI already fails through the suite, and a second failing surface would be a duplicate.
- The macOS CI leg's two known failures (the zsh completion parse and `pr/commit.test.ts`' ignore-rule case). They
  predate this program's last stage and are outside its charter. The status log names them as open.
- Rescoping `automate-dev-flow`. That is an architect session Sal opens after this archive (R-rop2-3).

## Decisions

**D1 — The rule lives in `orbit-skill-generation`.** That capability owns how the generator emits the installed skill
surface, and its frontmatter requirement already holds a size limit on generated text (the 1,024-character
description). `orbit-conventions` owns the disciplines and dispositions a body carries, not its size. A new capability
would hold one requirement and add a 36th baseline for a check the generator's capability can carry. Chosen over both.

**D2 — The cap is measured as the size report measures it.** The cap is 20,000 characters of the generated `SKILL.md`,
frontmatter included, that is 5,000 tokens at four characters each, rounded up as the report rounds. The test already
renders that text. Measuring only the `instructions` literal would let a body whose frontmatter pushes it over pass. The
requirement names the report's arithmetic, so the two read one number.

**D3 — The cross-check reads the report's constants from its source.** The script runs `main()` at top level, so
importing it would print a report into the test run. The test reads `scripts/skill-size-report.mjs` as text and parses
`KEPT_AFTER_COMPACTION` and `CHARS_PER_TOKEN` with an anchored pattern. It fails when the pattern finds no match or
their product differs from the test's cap. A function over the text carries the check, so its mutation (a source with
4,000 tokens) is a direct call. Chosen over moving the constants to a shared module. That would edit the report's
structure for one comparison, and the report must keep running from `dist/` with no build step of its own.

**D4 — A ceiling is never raised to fit a body.** The requirement keeps the convention's rule, not a looser one: a
ceiling below the cap is lowered as a named edit when its body shrinks, and a breach is fixed by moving procedure. The
cap check makes the ceiling's upper bound mechanical. A ceiling raised below the cap would still be caught only in
review, as today, since a test cannot tell a raise from a re-recording. The requirement names that limit by stating the
rule.

**D5 — The grading is written at archive, in the doc.** The charter puts G0 to G3's grades "in the status log". The
archive writes the stage's Shipped as and a status-log entry grading each goal with its evidence:

| goal | evidence |
|---|---|
| G0 | the three removal rulings (R-rop2-11 to R-rop2-13), each named in its stage's Shipped as; the full suite passing; every baseline change through a named delta |
| G1 | `npm run size:report` at this archive, every body listed |
| G2 | the ceiling history above; the budget test and the size report running in CI throughout |
| G3 | no cut list entry was marked yes, so none was replayed (R-rop2-10); the replay baseline is available to run |

`CLAUDE.md`'s program paragraph is updated in the same tail: phase 2 done, and `automate-dev-flow` going back to
architecture to be rescoped before any stage is proposed (R-rop2-3).

## Risks / Trade-offs

- [A source-text parse breaks on a harmless refactor of the report] → The anchored pattern fails loudly, naming the
  file, rather than passing on no match. A refactor then edits one regex.
- [A new body is added near the cap] → It gets a ceiling at its size plus 5%, capped at 20,000. The existing
  "every generated body has a ceiling" check already demands one.
- [The 5,000-token figure changes in Claude Code] → The figure is a constant in two files that the cross-check keeps
  equal. A change is one edit to the report, one to the test and a MODIFIED delta of this requirement.

## Touchpoints

- `test/core/templates/skill-body-budget.test.ts` — the cap check, the cross-check, their mutations, the scenario tags,
  the corrected comments.
- `scripts/skill-size-report.mjs` — header comment naming the requirement.
- `skill_body_convention.md` — the budget bullet names the requirement.
- `orbit/architecture/reduce-orbit-phase2.md` — at archive: Shipped as and the status log's grading.
- `CLAUDE.md` — at archive: the program paragraph.
