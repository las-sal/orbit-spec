## Context

Stage `docs-refinement` of `refine-documentation-and-architect` (see explore.md, Premise). `architect-first` shipped
the engine and spec half of R-rda-1/R-rda-2 and recorded the user docs as a prose start surface "pending stage
docs-refinement". The docs today lead with explore: the first start command on README's "Your first change",
getting-started, workflows, concepts and the workflow-engine diagram is explore (the measured table in explore.md's
Premise). The shipped onboard body (`.claude/skills/orbit-onboard/SKILL.md:63-72,128`) is the model the docs follow:
architect is where new work starts and where it returns; `/orbit:explore` alone stays a working path for a one-off fix.

## Goals / Non-Goals

**Goals:**
- G1's docs half: every start section of the user docs names `/orbit:architect` before any other start command.
- G3: the docs agree with the shipped CLI under the `orbit-user-docs` checks, the new start-sections check among them.
- A check that fails when a start section regresses, a listed heading disappears, or a flow diagram starts at explore.

**Non-Goals:**
- Requiring architect: explore, new and propose stay described (R-rda-2: the suggestion changes, never the
  requirement).
- Any CLI, engine or generated-body edit; the version bump (stage `release`).
- Issue #24 §3 clean-up: none was added (D-dr-2).

## Decisions

- **Getting-started's step 0 is an architect session** (D-dr-1, see explore.md). The page keeps its single
  `add-dark-mode` walk; a new first step runs `/orbit:architect <program>` to declare the work, and the walk that
  follows is that program's stage's change. The page names `/orbit:explore` alone as the path for a one-off fix —
  after architect, never as the default.
- **Scope is the architect-first docs, their check, and the re-capture probe** (D-dr-2).
- **No CLI-output re-capture is needed** (D-dr-3, a measured fact). `docs/cli.md` paraphrases each command; no page
  quotes `orbit init`'s banners, the welcome screen, the `Getting started:` lines or `No active changes.`. The only
  quoted outputs are `orbit validate --sources`' block (`docs/cli.md:220`) and one `Ready when you are:` line
  (`docs/getting-started.md:119`), touched by neither prior stage; the `OpenSpec` side is already held by
  `orbit-user-docs`' residue requirement. The charter's re-capture item is discharged by this record, not a task.
- **A declared start-section list holds the order** (D-dr-4). A new `orbit-user-docs` requirement lists the start
  sections exactly as (page, heading); the test holds the list exactly. Alternatives: inline HTML-comment markers
  (puts check machinery into user-facing source) and a page-wide first-mention rule (fails on reference pages, and
  checks one passage per page) — see Alternatives considered. A propose-time probe of the planned check over
  today's docs (2026-10-14) found six of the seven members then listed leading with explore, and one wrong member: the concepts
  paragraph sits under `## Artifacts`, not the `## Changes` explore.md's Mechanism entry names. The requirement
  lists `## Artifacts`; explore.md stays as written, the historical record.
- **Two match forms: `/orbit:<id>` and a fenced `<id> ──►`.** The workflow-engine diagram draws bare
  `explore ──► propose`, which a `/orbit:` matcher never sees; without the second form the diagram member would pass
  with explore first. The arrow form is the one the docs draw (`docs/workflow-engine.md:17`,
  `docs/concepts.md:87,136`), and it is matched inside fences only, so prose "new" or "explore" is never a start.
- **Sections end at the next same-or-higher heading**, so `## The change` in getting-started spans its numbered
  `###` steps, and `## Practices` spans its list. A missing listed heading fails the suite rather than passing empty.
- **The new check joins the pending-rewrite gate's file-local set.** `The user docs are a checked surface, gated by
  an exact pending-rewrite list` enumerates every file-local check; the new check is added to that sentence (MODIFIED,
  its four scenarios carried and already declared in `pending-rewrite.test.ts`).
- **`### Step by step` is a start section; two start-headed neighbours are not** (proposal review, walk of
  2026-10-15). workflows.md's `### Step by step` walks a path to a new change (`/orbit:new`), the sibling of
  `### One change, start to finish`, so it is listed and opens with a clause placing it after an architect session.
  commands.md's `## Starting a change` is a per-command reference section (architect starts a program and is
  documented under `## Across the project`), and workflows.md's `### Start a new change when` names no command; the
  requirement's table classifies both as not listed, so the residual sweep finds them settled.
- **The walks return to architect** (proposal review, walk of 2026-10-15). getting-started ends with `### 8. Ratify
  the stage` and README's list ends with the same line, as the onboard flow ends `archive ─→ architect (ratify the
  stage)` and the archive emit names `/orbit:architect <doc>` next; the step gates nothing. The start-sections check
  reads only the opening order, so the closing step is unchecked.
- **The two reference tables reorder, unchecked** (D-dr-5): README's command table and commands.md's Quick reference
  list `/orbit:architect` first, as the onboard table does. A reference order is not a suggestion, so neither is a
  start section.
- **The diagram and concepts paragraph join the reach** (D-dr-6): workflow-engine.md's diagram starts at architect;
  concepts.md's `## Artifacts` gains a sentence placing explore after architect.
- **`orbit-architect`'s user-docs row** becomes "prose, checked", pointing at the new requirement; the "until then
  the docs still lead with explore" named limit is removed, since this change discharges it.

## Alternatives considered

- **A one-stage program for the dark-mode example, end to end through ratify** — accurate to the flow, but turns the
  first-change walk into a program tutorial (explore.md, Considered & out).
- **Keep the single-change walk with only a lead pointer to architect** — leaves the page's first step explore.
- **Inline HTML-comment markers around start passages** — puts check machinery into user-facing source; the heading
  list reads structure the docs already have.
- **A page-wide first-start-command rule over named pages** — coarser: one passage per page is checked and later
  passages are not.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-dr-4 | BOUNDED | live rule | `orbit-user-docs`' `The user docs' start sections name the architect workflow first` (residual slots verbatim as its named limit) |
| D-dr-1 | — | scope | not carried |
| D-dr-2 | — | scope | not carried |
| D-dr-3 | — | fact | not carried |
| D-dr-5 | — | scope | not carried |
| D-dr-6 | — | scope | not carried |

## Risks / Trade-offs

- **D-dr-4's residual** → the start-section list is a sweep's result, not a closed structure; the named limit lives in
  `orbit-user-docs`' `The user docs' start sections name the architect workflow first`. Mitigation: task 4 runs its
  residual method over the edited docs at apply.
- [Heading renames] A later docs edit renaming a listed heading breaks the suite → intended: the failure names the
  page and heading, and the edit updates the list in the same commit.
- [Fence form is narrow] A diagram drawn with `->` or `→` instead of ` ──►` escapes the fence form → accepted: the
  docs draw one arrow style today; a new style is a residual member found by the same grep.
- [Getting-started grows] Step 0 lengthens the first-change walk → kept short: one command, one paragraph on what the
  architect session writes, and a pointer to the one-off path.

## Touchpoints

- `README.md` — "Your first change" and the command table.
- `docs/getting-started.md` — step 0, the closing ratify step, the intro and the one-off path.
- `docs/workflows.md` — the flow block, "Step by step", "Exploring first", the Practices tip.
- `docs/commands.md` — Quick reference order.
- `docs/workflow-engine.md` — the flow diagram.
- `docs/concepts.md` — the `## Artifacts` sentence.
- `test/core/user-docs/start-sections.test.ts` — the new check.
- `test/helpers/user-docs.ts` — the section reader and start-command scan.
