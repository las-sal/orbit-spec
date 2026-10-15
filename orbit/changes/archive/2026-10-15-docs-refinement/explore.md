> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: docs-refinement

## Premise

Stage `docs-refinement` of `refine-documentation-and-architect`: the docs follow the tool. `architect-first` made every
strict start surface name `/orbit:architect` first and left the user docs as a PROSE surface "pending stage
docs-refinement" — a named limit in `orbit-architect`'s `Start surfaces name the architect workflow first`. This stage
discharges that limit: the README Quickstart, getting-started and workflows lead with architect; quoted CLI output
agrees with the shipped CLI after `cli-says-orbit`; and the result holds under the `orbit-user-docs` checks (G1's docs
half, G3). Sal reviews the pages before archive.

Measured on 2026-10-14 — the first start command (`/orbit:architect|explore|new|propose|ff`) each page names:

| page | first start command | first `/orbit:architect` | a start surface? |
|---|---|---|---|
| README.md | explore (77, command table) | 90 (table); none in "Your first change" (100) | yes: "Your first change" |
| docs/getting-started.md | explore (18, step 1) | none | yes: the whole walk |
| docs/workflows.md | explore (21, the flow block) | 68 ("A program of changes") | yes: "One change, start to finish", "Exploring first", the "Explore when unsure" tip (177) |
| docs/commands.md | explore (14, Quick reference row 1) | 27 (row 14) | reference table; its order reads as a ranking |
| docs/concepts.md | explore (99, "orbit adds an exploration before the proposal") | 224 | flow description |
| docs/workflow-engine.md | diagram at 17 starts `explore ──► propose` | none | flow diagram |
| docs/cli.md, migration-guide.md, supported-tools.md | new / propose as examples | — | no: reference and examples |

## Mechanism

### D-dr-4 — each declared start section names /orbit:architect before any other start command
Domain: the passages of the user docs that suggest where new work starts, by (page, heading)
| member | covered by |
|---|---|
| README.md › `### Your first change` | listed; architect is its first step |
| docs/getting-started.md › `## The change` | listed; step 0 is architect (D-dr-1) |
| docs/workflows.md › `### One change, start to finish` | listed; the flow block opens with architect |
| docs/workflows.md › `### Exploring first` | listed; names architect before explore, explore as the one-off path |
| docs/workflows.md › `## Practices` (the "Explore when unsure" tip) | listed; the tip places explore after architect |
| docs/workflow-engine.md › `## Actions, not phases` (the flow diagram) | listed; the diagram starts at architect (D-dr-6) |
| docs/concepts.md › `## Changes` ("orbit adds an exploration") | listed; gains the sentence placing explore after architect (D-dr-6) |
| README.md command table, docs/commands.md `## Quick reference` | not listed: reference order (D-dr-5) |
| docs/cli.md, migration-guide.md, supported-tools.md, workflow-engine.md:100 | not listed: commands named as reference or example, never as where to start |
Closure: BOUNDED — the set is a sweep's result over today's pages, not a structure; a new start passage can be written anywhere
Residual kind: a passage that suggests where new work starts under a heading the list does not name, or one that steers to explore without naming a command
Residual method: `orbit-architect`'s residual grep ("start", "begin", "first change", "new work", "entry", "create") run over README.md and docs/ whenever a change edits a user doc, each hit classified against this table
Moves:
- READ: applied — each member's heading read from the file (2026-10-14 heading map); the first-start-command table in Premise measured by grep
- ENUMERATE: applied — this table, from a grep of every `/orbit:(architect|explore|new|propose|ff)` mention in README.md and docs/, each first mention classified
- COHERE: applied — the check's "architect before any other start command" is the `orbit-architect` prose row's "explore after architect, never the default", made checkable; one predicate
- EXECUTE: not applied — no check exists yet; the propose-time probe runs it over the edited pages
- FALSIFY: applied — a page-wide rule falsified on cli.md and migration-guide.md (examples, not suggestions), hence the section domain; the list alone cannot see an unlisted section (the residual)
- CONFORM: applied — R-rda-2 (suggestion, never requirement: explore stays described), `orbit-user-docs`' exact-list idiom (pending-rewrite), and its non-vacuity floors (a listed heading that vanishes fails, never passes empty)
- FEASIBILITY: not applied — seven sections, one ordered scan each
- CONSUME: applied — the test is the consumer; it must fail on a missing listed heading as well as on a wrong first command, or a renamed heading passes silently
- INVOKE: applied — runs in `npm test` with the other `test/core/user-docs/` checks, in CI on every push

## Decisions

- **2026-10-14 — D-dr-1: getting-started opens with a step 0 architect session, then walks one stage's change** (Sal,
  settling the example question). The page keeps its single `add-dark-mode` walk; a new first step runs
  `/orbit:architect <program>` to declare the work, and the walk that follows is that program's stage's change. As
  the onboard body does, the page names `/orbit:explore` alone as the working path for a one-off fix — after
  architect, never as the default. Rejected: running the whole example as a one-stage program through ratify, and
  keeping the walk with only a lead pointer (Considered & out).
  Kind: scope
- **2026-10-14 — D-dr-2: the stage's scope is the architect-first docs, their check, and the re-capture probe** (Sal).
  Issue #24 §3 ("other documentation clean-up") adds nothing; the stage is items 1–3 of the opening readout:
  architect-first pages, a check holding them, and re-capturing quoted CLI output.
  Kind: scope
- **2026-10-14 — D-dr-3: the docs quote no CLI output that `cli-says-orbit` or `architect-first` changed** (measured).
  `docs/cli.md` paraphrases each command (its flags tables follow `--help`, its descriptions are its own); no page
  quotes `orbit init`'s banners, the welcome screen, the `Getting started:` lines or `No active changes.`. The only
  quoted outputs are `orbit validate --sources`' block (`docs/cli.md:220`) and one `Ready when you are:` line
  (`docs/getting-started.md:119`), neither touched by either stage. The `OpenSpec` side is already held by
  `orbit-user-docs`' `The old name appears in the user docs only in four admitted places`. The charter's re-capture
  item therefore needs no edit; the change records the probe rather than a task.
  Kind: fact

- **2026-10-14 — D-dr-4: a declared start-section list holds the docs' architect-first order** (Sal, settling
  Q-dr-1). A new `orbit-user-docs` requirement lists the start sections exactly as (page, heading); in each, the
  first start command named (`/orbit:architect`, `/orbit:explore`, `/orbit:new`, `/orbit:propose`, `/orbit:ff`)
  is `/orbit:architect`, and a listed heading that is missing fails. Mechanism entry D-dr-4.
  Kind: rule
- **2026-10-14 — D-dr-5: the two reference tables put /orbit:architect first, unchecked** (Sal, settling Q-dr-2).
  README's command table and commands.md's Quick reference reorder to the onboard table's order; no test, since a
  reference order is not a suggestion.
  Kind: scope
- **2026-10-14 — D-dr-6: workflow-engine.md's diagram and concepts.md's exploration paragraph join the reach** (Sal,
  settling Q-dr-3). The diagram starts at architect; concepts.md keeps its paragraph and gains a sentence placing
  explore after architect. Both are D-dr-4 members.
  Kind: scope

## Open questions

(None open. Q-dr-1, Q-dr-2 and Q-dr-3 were settled on 2026-10-14 as D-dr-4, D-dr-5 and D-dr-6.)

## Considered & out

- **2026-10-14 — inline HTML-comment markers around start passages** (Q-dr-1 (b)) — puts check machinery into
  user-facing source; the heading list reads structure the docs already have.
- **2026-10-14 — a page-wide first-start-command rule over named pages** (Q-dr-1 (c)) — coarser: one passage per page
  is checked and later passages are not.
- **2026-10-14 — a one-stage program for the dark-mode example, end to end through ratify** — accurate to the flow,
  but turns the first-change walk into a program tutorial; D-dr-1 instead.
- **2026-10-14 — keep the single-change walk and add only a lead pointer to architect** — leaves the page's first
  step explore, which the `orbit-architect` table forbids once this stage archives.

## References

- `orbit/architecture/refine-documentation-and-architect.md` — the stage charter, R-rda-1/R-rda-2, G1/G3.
- `orbit/specs/orbit-architect/spec.md` — `Start surfaces name the architect workflow first`: the user-docs row
  ("prose, pending stage docs-refinement") is restated by this change; a MODIFIED carry pulls its two scenarios.
- `orbit/specs/orbit-user-docs/spec.md` — the checks G3 runs under; a new requirement would host Q-dr-1's check.
- `test/core/start-surfaces.test.ts`, `test/core/user-docs/` — the existing strict check and the docs checks.
- `.claude/skills/orbit-onboard/SKILL.md:63-72,128` — the shipped architect-first prose the docs should match.
- las-sal/orbit-spec issue #24 — §2 (architect in the Quickstart); §3 empty (D-dr-2).
