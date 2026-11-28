## ADDED Requirements

### Requirement: Every generated skill body fits what a compaction keeps

Every generated skill body SHALL be at most 5,000 estimated tokens, the part of an invoked skill Claude Code keeps after
a compaction (`reduce-orbit-phase2`'s G1, made lasting at its `close` stage). The body is measured as
`npm run size:report` measures it: the generated `SKILL.md`, frontmatter included, as `generateSkillContent()` writes
it, at four characters an estimated token, so at most 20,000 characters. The rule is held by the suite and was not a
goal of that program alone:

| member | covered by |
|---|---|
| each generated body | a character ceiling in `test/core/templates/skill-body-budget.test.ts`, and the suite fails when the body is over it |
| each character ceiling | at most 20,000 characters; the suite fails naming the body whose ceiling is over |
| each body's length | the 500-line limit; no body has a line ceiling of its own |
| the cap and the size report | the test's cap equals `scripts/skill-size-report.mjs`' tokens kept after a compaction times its characters per token, and the suite fails when they differ |
| a body that outgrows its ceiling | fixed by moving a step's procedure to a reference file, keeping its basic content in the body, as `skill_body_convention.md` says, and never by raising a ceiling past the cap |
| a ceiling below the cap | lowered as a named edit when its body shrinks, to the new size plus 5% where that is lower; never raised to fit a body |

The size report still reports and never fails: the suite carries the rule.

#### Scenario: Every body is within the cap

- **WHEN** every skill is generated as `orbit init` writes it
- **THEN** each `SKILL.md` is at most 20,000 characters, at most 5,000 estimated tokens as `npm run size:report`
  computes them, and at most 500 lines

#### Scenario: A ceiling over the cap fails the suite

- **WHEN** a body's character ceiling is set above 20,000 characters
- **THEN** the budget test fails naming the body and its ceiling, and states that a body over the cap moves a step's
  procedure to a reference

#### Scenario: The test and the size report measure the same budget

- **WHEN** `scripts/skill-size-report.mjs`' tokens kept after a compaction, or its characters per token, no longer
  multiply to the test's cap
- **THEN** the budget test fails naming both figures
