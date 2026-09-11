# External Review: d6-pr-lifecycle (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git (branch `d-arc`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/d6-pr-lifecycle/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

### What this change is

Stage D6 of the architecture program `orbit/architecture/d-arc-arbitered-flow.md`.
It adds a **pull-request lifecycle layer** to orbit's spec-driven flow: a DRAFT PR
opens during `/orbit:propose`, and `/orbit:archive` grows a **tail** that commits the
archive's writes, pushes, rewrites the PR description into an achievement landmark,
and flips the PR READY. A single config scalar `pr: never | per-proposal |
per-architecture` selects the regime; a change's `architecture:` citation selects its
target within `per-architecture` (cited changes ride a shared program branch under
"Shape A" — one PR per program; uncited changes fall back to their own branch + PR).

Standing constraints you should NOT flag as defects (each is user-ratified):

- **Zero engine git** — every git/`gh` action is a workflow-BODY step (instructions in
  generated skill bodies), never engine TypeScript. The engine's only surface is the
  `pr:` config reader plus emit payload fields.
- **Single user, single session** — concurrency support (locking, serialization,
  optimistic retry, conflict-merge protocols) is an explicit NON-GOAL. Detection of a
  diverged state is in scope; protocols are not.
- **Merging stays a human act.** READY is the terminus.
- **Recommend, never invoke** — orbit bodies never auto-chain lifecycle commands.
- This is a PROPOSAL-stage review: zero tasks are implemented. Do not flag missing
  source code or unchecked tasks. You are reviewing the SPECIFICATION.

## Cycle context

- Iteration: 2 (second EXTERNAL pass; four internal passes have also run)
- Prior internal findings still open: **0**. The most recent internal pass
  (`review-proposal-2026-08-24T23-36-30Z.json`, fresh reviewer, 1 CRITICAL / 9 WARNING
  / 2 SUGGESTION) was fully walked and resolved in
  `address-reviews-2026-08-25T02-23-35Z.json`.
- Prior external findings still open: **0**. Iteration 1
  (`external-proposal-2026-08-12T18-17-55Z.md`, GPT-5 Codex, 5 CRITICAL / 9 WARNING /
  3 SUGGESTION) was fully walked and resolved in
  `address-reviews-2026-08-21T00-20-50Z.json`.
- Resolved since the last external review (the 12 findings of the most recent pass):
  the zero-engine-git requirement's retired `pr_url`/`pr_state` propose-side naming;
  the archive tail's missing HEAD-equals-attachment-branch precondition; the program
  PR's missing existence check at propose; the tail-scope conflict between attachment
  authority and live config; the arc-done readout's stop condition reading a frozen
  state value; the tail's use of "resolved remote"/"resolved base" with no rule in
  scope; propose's unenumerated commit scope and untracked-file blind spot; the
  citation-divergence note having a scenario but no task; the AI-mediated consent
  preview under-describing the tail's outward writes; a promised `CLAUDE.md` entry no
  task carried; a stale decision count; at-archive note ordering.

Across three prior passes (17 + 17 + 12 findings) **no finding has recurred** — every
round has reached a genuinely new layer. Iteration 1's reviewer (GPT-5 Codex)
identified the change's dominant defect pattern as *representation* (records that
could not express what the flow needed); the most recent internal pass identified it
as *seam asymmetry* (propose and archive each borrowing the other's unstated half).
Both have been addressed. Your job is to find what neither saw.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/d6-pr-lifecycle/proposal.md
- orbit/changes/d6-pr-lifecycle/design.md
- orbit/changes/d6-pr-lifecycle/tasks.md
- orbit/changes/d6-pr-lifecycle/specs/<capability>/spec.md (all seven — orbit-pr-lifecycle,
  orbit-propose-modifications, orbit-archive-modifications, orbit-run-summary-emit,
  orbit-emit-composition, orbit-onboard, orbit-conventions)
- orbit/changes/d6-pr-lifecycle/explore.md (the decision record, incl. its dated
  "Post-promotion revisions" subsection)
- orbit/specs/<capability>/spec.md (live baselines — for delta consistency checks; note
  that MODIFIED blocks must reproduce the FULL baseline requirement text, since they
  replace it wholesale at archive)
```

Two structural notes that will save you time:

- `orbit-pr-lifecycle` is a **NEW** capability — it has no baseline to diff against.
  The other six capabilities have live baselines in `orbit/specs/`.
- The change carries **8 delta blocks across 7 capabilities**
  (`orbit-archive-modifications` holds two MODIFIED blocks plus one ADDED).

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with `*_convention.md`.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d6-pr-lifecycle (iteration 2)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d6-pr-lifecycle/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 2): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
