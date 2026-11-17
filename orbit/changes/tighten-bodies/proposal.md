## Why

`reduce-orbit-phase1`'s third stage tightens the text that stays in the skill bodies after stages `conditional-steps`
and `once-per-session-detail` moved the rarely needed text to reference files, and meets RG2's structural rules from
Anthropic's guidance for building skills. The bodies total 369,392 characters (measured at `a5ba0f0c`). Each still
carries Guardrails lines that restate its own steps, and provenance the agent never acts on: stage tags, ruling ids,
mirror notes and spec citations. Three skill descriptions are not valid YAML, eleven long reference files have no
table of contents, and review reaches two of its reference files only through a third (see explore.md, Premise).

## What Changes

- **The decision-writing bullet is restructured** into labelled sub-bullets with every clause, gloss and area name
  kept (R-rop-7). It is one constant carried byte-equal by the fourteen bodies with a disciplines epitome. Keeping its
  content saves nothing (D-tb-1), so RG1's figures are re-set to what the stage measures (D-tb-2, RG1 as amended).
- **Restated Guardrails lines are removed.** A line goes only when a step line of the same body says it, with
  nothing added: 23 of 42 lines in six bodies, archive's whole block among them; sync-specs, classed as
  upstream-verbatim, keeps its five (D-tb-16). Each removal is named as an edit to the upstream portion (D-tb-3).
- **Provenance leaves the twelve tightened bodies**: stage tags, the `NEW` before orbit's step numbers, ruling and
  decision ids, the thirteen mirror notes, owning-spec citations in headings, and spec citations in prose where the
  sentence still instructs without them (D-tb-6). A citation a requirement asks a body to carry, such as the
  Severity ladder's name, stays (D-tb-16). Mirror notes go entirely, so R-crc-14's mirror corollary no
  longer asks a copy to say it is one (D-tb-7, R-rop-14); the copies stay byte-equal under their parity tests.
- **Every frontmatter value is written YAML-safe.** The generator quotes `name`, `description`, `license` and
  `compatibility` as it already quotes metadata, so the three descriptions that fail a strict YAML parse are fixed at
  the source. Address-reviews' description is cut from 1,140 characters to about 360, and architect's and onboard's
  gain a when-clause (D-tb-9).
- **Reference files**: each of the eleven over 100 lines opens with a written table of contents (D-tb-10), and
  review's body names `prompt-template.md` and `mode-sections.md` itself, so every reference is linked from its
  skill's `SKILL.md` (D-tb-11).
- **Tests prove nothing an agent acts on is removed**: an edit-ledger test lists every edit to a tightened body as a
  classed pair and reconciles each body to its hash recorded before the first edit (D-tb-14); existing tests change
  only to follow their instruction to the text that remains, or a requirement this change modifies (D-tb-15).
- **The budget test's ceilings come down** to the new sizes plus 5%. RG1's figures were set from the measured drafts
  and written into the architecture doc at propose (`4acf48f9`); apply confirms the sizes sit under them.

No workflow changes what it does under any setting (RG0). Explore, onboard and bulk-archive keep their bodies apart
from the shared decision-writing bullet and their descriptions (D-tb-4).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Decision-writing discipline` carries the restructured bullet; `Review mode decision
  framework` drops the review body's mirror note; ADDED: restated Guardrails lines removed (the named edit), tightened
  bodies carry no provenance, and an edit ledger holding every body edit to its recorded text.
- `orbit-emit-composition`: `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk
  record` drops the review body's mirror note.
- `orbit-skill-generation`: `Frontmatter metadata pass-through` covers every frontmatter value and every
  description's length and content; ADDED: reference files are linked from their `SKILL.md` and long ones open with a
  table of contents.

## Impact

- `src/core/disciplines.ts` (the decision-writing constant and shared steps' headings), the twelve tightened workflow
  templates under `src/core/templates/workflows/`, and the reference constants of the eleven long reference files.
- `src/core/shared/skill-generation.ts` (`generateSkillContent`); every installed `SKILL.md` is rewritten once by
  `orbit update`.
- Tests: a new edit-ledger test, a frontmatter parse test, a table-of-contents test; edits to
  `chain-prompt-tags.test.ts`, the mirror parity suites, the decision-writing parity test, `moved-blocks.test.ts`
  (`TWO_LEVEL` removed), `skill-templates-parity.test.ts` and `skill-body-budget.test.ts`.
- `skill_body_convention.md` (its Exceptions, its commit-step example, its budget rule); `orbit/architecture/reduce-orbit-phase1.md`
  already carries RG1's figures, written at propose (`4acf48f9`).
