# External Review: d6-pr-lifecycle (iteration 1)

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
- `orbit/architecture/d-arc-arbitered-flow.md` — the program doc this change cites
  (`### Stage d6-pr-lifecycle`); `node bin/orbit.js architecture show d-arc-arbitered-flow d6-pr-lifecycle`
  slices it

## Cycle context

- Iteration: 1 in SYSTEM mode (first external pass after apply). The PROPOSAL cadence
  ran 8 internal + 3 external passes (all three external iterations were GPT-5 Codex:
  17/17, 14/14, 7/7 resolved — `external-proposal-*.md` + the matching
  `address-reviews-*.json`). The SYSTEM cadence so far: in-context pass 1
  (`review-system-2026-09-01T14-59-24Z.json`, 0C/2W/1S, all resolved in
  `address-reviews-2026-09-01T15-08-26Z.json`) and a fresh-context pass 2
  (`review-system-2026-09-10T01-54-45Z.json`, 1C/5W/2S, all resolved in
  `address-reviews-2026-09-10T13-53-49Z.json`).
- Prior internal findings still open: 0
- Prior external findings still open: 0 (none yet in this mode)
- Resolved since last review (walk 10 — the items to VERIFY this round, since they
  landed after the last review pass):
  1. CRITICAL — the bare `orbit status --json` degradation ladder's no-changes rung
     (`{changes: [], message}`) omitted the `pr` key the bodies read the PR regime from,
     so a fresh adopter's FIRST change (no active changes, no architecture doc) silently
     resolved to `never`. Fixed at the engine (`src/commands/workflow/status.ts` rung 3
     now carries `pr: orientation.pr`), guarded by a new rung-3 test in
     `test/commands/status-orientation.test.ts` (`pr: per-proposal` in an empty project).
  2. Its spec half — an EIGHTH delta `specs/orbit-orientation/spec.md` (MODIFIED `JSON
     output for both tiers`: `pr` on every bare-tier shape, new rung-3 scenario), and the
     zero-engine-git surface enumeration amended in `specs/orbit-pr-lifecycle/spec.md`,
     design D-d6-7, and the proposal to include the read-only orientation field.
  3. The archive tail reference's step 2 (validate a stored URL live) gained its
     consequence: an `On POSITIVE invalidation` bullet (skip only the PR-writing steps,
     name the specific reason, commit+push proceed, never fall through to the fallback
     query) and the four query axes mirrored inline (`pr-choreography.ts`,
     `PR_ARCHIVE_TAIL_SECTION`).
  4. Both propose and ff bodies gained a `Position` paragraph anchoring the three PR
     phases at step positions (propose: phase 1 after Step 0, before Step 0a; ff: phase 1
     before Step 2 `orbit new change`).
  5. `orbit/config.yaml` commentary now distinguishes per-proposal (tail flips READY)
     from per-architecture (tail appends a stage entry; the flip is the human's act at
     arc-done).
  6. A dated Touchpoints-provenance sentence under design D-d6-7 (outside the frozen
     `## Touchpoints` map) explaining why `status.ts`, `orientation.ts`, and two tests
     appear as `actual_unpredicted`.
  7. Archive body steps renumbered in text order (tail = NEW Step 5.6, garnish = 5.7).
  8. Bulk-archive readout names its source for PR URLs (`pr_attachment` from the latest
     propose/ff emit, read-only).

Known NON-defects (please do not re-flag; they are designed or deferred by ratified
decision — flag only if you find them WRONG, not merely present):
- Task 6.3 is an unchecked user-validation handoff (dogfood exit criterion 1 on a real
  change) — the designed passed-for-flow state, not a completeness defect.
- The arc doc's `### Stage d6-pr-lifecycle` section still carries the superseded
  three-value sketch (`pr: draft-at-propose | at-archive | never`) — retired at archive
  per at-archive note 5.5 in tasks.md.
- The outward half of the choreography (push, `gh pr create/edit/ready`) has NO automated
  coverage by ratified decision; the phase-1 integration harness covers the local git half
  with a `gh` stub. Read the outward half as a PERFORMING AI would and flag anything not
  performable or ambiguous — that is the highest-value probe available.
- `orbit/lenses/` does not exist in this repo — passes 4 and 5 are skips.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d6-pr-lifecycle/proposal.md, design.md, tasks.md, explore.md, specs/ (8 deltas)
- The change's commit range: `git diff 7597759..HEAD` (7597759 is the last pre-change
  commit; the walk-10 resolutions above are in the latest commit on `d-arc`)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check;
  the deltas modify orbit-archive-modifications, orbit-conventions, orbit-emit-composition,
  orbit-onboard, orbit-orientation, orbit-propose-modifications, orbit-run-summary-emit and
  ADD orbit-pr-lifecycle)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched: `src/core/templates/workflows/pr-choreography.ts` (NEW — the ONE
  source of the shared remote/default-branch resolution, the three propose phases, and the
  archive tail, emitted as `references/pr-choreography.md` into propose + ff and
  `references/pr-archive-tail.md` into archive), `propose.ts`, `ff-change.ts`,
  `archive-change.ts`, `bulk-archive-change.ts`, `onboard.ts`, `architect.ts`,
  `src/core/project-config.ts` (the `pr:` scalar reader), `src/core/orientation.ts` +
  `src/commands/workflow/status.ts` (the `pr` field on the orientation surface),
  `src/core/emit-composition.ts` (the `pr_attachment` payload row + write-gate structural
  validation for propose/ff; flat `pr_url`/`pr_state` for archive), `orbit/config.yaml`
  (commented `pr:` example), and tests under `test/core/`, `test/commands/`,
  `test/core/templates/`, `test/integration/pr-lifecycle/` (harness + phase-1 cases).
  The generated `.claude/` surface is NOT in VCS — regenerate with
  `npm install && npm run build && node bin/orbit.js init --tools claude` to inspect the
  emitted SKILL.md + references/ files as a reading AI sees them. `npm test` should report
  1997 passing.

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (task 6.3 is a declared user-validation handoff — the designed passed-for-flow state,
   not a completeness defect). Trace every scenario in the eight deltas to the body or
   engine text that implements it.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
   The thesis is ZERO ENGINE GIT: the engine never shells to git or `gh` for any
   PR-lifecycle purpose; verify it rather than trusting it.
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple
   effects, side-effect additions — especially the `pr` field's three ladder rungs on the
   orientation surface, the reader's inert-value paths, and the write gate's
   `pr_attachment` validation versus the delta's clause-by-clause shape.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces; don't redefine them. The three seams
   (propose / ff / archive + bulk-archive) share one reference — check that no seam can
   drift from another and that the body pointers agree with the reference on ordering,
   degradation, and the `never`/absent/inert return.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV (absent in this repo — note the skip).
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk
   end-to-end (absent in this repo — note the skip). In its place, walk the four PR paths
   as a performing AI: per-proposal propose → archive; per-architecture cited change
   (program-PR adopt-or-open → stage-entry append → arc-done human-acts readout in
   architect.ts); `pr: never` / absent / inert (byte-identical silence); and every
   degradation branch (no remote, no `gh`, dirty tree, refused switch, diverged remote tip,
   positive invalidation of a stored URL).
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-09-10T18-00-00Z`. Pick a fresh
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
   git add orbit/changes/d6-pr-lifecycle/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
