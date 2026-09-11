# External Review: d6-pr-lifecycle (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git (branch `d-arc`, at `9dfb587`)

## Project context (read first)

- **`orbit/architecture/d-arc-arbitered-flow.md` — the `### Stage d6-pr-lifecycle`
  section. THIS CHANGE IS CITED: its metadata declares it serves that stage, and the
  section holds the stage's CHARTER and its falsifiable EXIT CRITERIA. Read it before the
  artifacts and grade the change against those criteria — a change that is internally
  coherent but does not satisfy what it was chartered to do is a finding.**
  **One deliberate exception:** that section's PROSE is knowingly stale — it still shows
  the superseded two-key `pr:` config sketch and the rejected (f) leaning about
  AI-mediated propose skipping the PR step. Retiring it is at-archive note 5.5, already
  ratified. Do NOT re-file that staleness; the EXIT CRITERIA are current and are what you
  should grade against. (`orbit architecture show d-arc-arbitered-flow d6-pr-lifecycle`
  prints the section.)
- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/d6-pr-lifecycle/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 — FIRST external review of this change (proposal mode). This is the
  D-arc's sixth stage; the five prior stages all converged through external passes,
  and you (or a peer) caught the highest-value findings in each.
- Prior internal findings still open: 0. One fresh-class internal pass ran
  (`review-proposal-2026-08-11T19-02-06Z.json`, 3 CRITICAL / 10 WARNING / 4
  SUGGESTION) and ALL 17 were walked to resolution in
  `address-reviews-2026-08-12T16-37-44Z.json`.
- Prior external findings still open: none (no prior external pass).
- **Resolved since that pass — read this before reviewing, because the artifacts
  changed shape substantially:**
  1. The config vocabulary was REPLACED: the two-key `pr: {open, program-branches}`
     block became a single three-valued scalar `pr: never | per-proposal |
     per-architecture`. Uncited changes fall back to per-proposal under
     per-architecture. The `at-archive` (born-READY) timing mode was RETIRED.
  2. An entire delta was DELETED: `orbit-lifecycle-consent`. Propose is deliberately
     NOT consent-scoped — the no-chaining contract already bars unbidden AI
     invocation, so every propose is user-typed or chat-ratified, and the outward
     write is a reversible draft PR. D1's closed consent set is untouched; no schema
     gate, no `spec-driven` version bump.
  3. The program PR's arc-done READY flip became a HUMAN act (orbit surfaces the PR
     URL + `gh pr ready` / `gh pr merge` at the architect ratification; it never
     flips). Rationale: arc-done is strictly later than the last stage archive, so no
     body is present when the condition becomes true.
  4. A sixth delta was ADDED: `orbit-run-summary-emit` (`PR fields on the propose and
     ff emits`) — the OWNING definition of `pr_url`/`pr_state`, since
     `orbit-emit-composition`'s table is explicitly a mirror. The archive delta gained
     its first MODIFIED block for the same reason.
  5. `/orbit:ff` now carries the identical choreography as propose; `new`/`continue`
     explicitly do not, with the archive-side consequence stated.
  6. Nine smaller fixes: branch preconditions (default-branch resolution, dirty tree,
     existing branch), propose failure path, archive-tail PR discovery, frozen
     granularity at propose, enumerated commit scope, `pr_state` value enum, a
     CLAUDE.md task, and a CI-claim correction.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/d6-pr-lifecycle/proposal.md
- orbit/changes/d6-pr-lifecycle/design.md
- orbit/changes/d6-pr-lifecycle/tasks.md
- orbit/changes/d6-pr-lifecycle/specs/<capability>/spec.md (all SIX: orbit-pr-lifecycle
  NEW, plus orbit-propose-modifications, orbit-archive-modifications,
  orbit-run-summary-emit, orbit-conventions, orbit-emit-composition)
- orbit/changes/d6-pr-lifecycle/explore.md (the decision record the artifacts were
  generated from — check FIDELITY: do the artifacts faithfully carry the ratified
  decisions, including the ones revised during the walk?)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks;
  note `orbit-emit-composition` and `orbit-archive-modifications` carry MODIFIED blocks
  that must match their live baseline except for the intended edit)
- orbit/architecture/d-arc-arbitered-flow.md — already listed under Project context above;
  the stage's exit criteria are the acceptance bar this change must meet

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/
   REMOVED/RENAMED valid; `orbit validate d6-pr-lifecycle --strict` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with
   tasks. Count/label consistency. No scope creep. Pay attention to whether the
   config-vocabulary replacement and the consent-delta deletion left residue anywhere.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate
   after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; the two MODIFIED blocks
   match their baselines except the intended edit; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no
   ambiguity. Could a fresh AI implement the branch/PR choreography and the archive tail
   from these specs alone?
6. **Gap Hunt** — unstated assumptions, error paths, state transitions. Especially: the
   per-architecture program-branch lifecycle, what happens across concurrent changes on
   one program branch, and any seam where the PR layer meets a failure mode.
7. **Drift Hunt** — old vocabulary lingering (the retired two-key config, `at-archive`,
   consent-scoped propose); consistency with conventions.
8. **Inline Review Marker Residue** — any `@review:` markers still present?
9. **Pre-Handoff Sweep** — anything else before this goes to implementation? Include an
   explicit CHARTER CHECK here: walk the stage's exit criteria one by one and say, for
   each, whether these artifacts would satisfy it — naming any criterion the change does
   not plausibly reach, and any criterion whose satisfaction depends on work the tasks
   don't cover.

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-08-12T18-00-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d6-pr-lifecycle (iteration 1)

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
   git commit -m "External review (proposal, iter 1): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
