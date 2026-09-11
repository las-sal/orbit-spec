# External Review: d6-pr-lifecycle (iteration 3)

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

- Iteration: 3 in SYSTEM mode by file count. Iteration 1 was TWO parallel passes of one
  prompt: GPT-5 Codex (`external-system-2026-09-10T15-31-02Z.md`, 1C/2W/0S) and a
  clean-context Claude Fable 5.1 session (`external-system-2026-09-10T15-49-04Z.md`,
  1C/7W/4S). Both found the SAME CRITICAL independently by the same real-git experiment
  (the generation-input precondition keyed on worktree presence). All 15 findings were
  resolved — walks `address-reviews-2026-09-10T20-44-29Z.json` (Codex, 3/3) and
  `address-reviews-2026-09-10T22-35-57Z.json` (Fable, 11/11 + 1 stale-suppressed as the
  shared CRITICAL). An in-context confirm pass then found 1W/1S introduced by those walks
  (`review-system-2026-09-10T23-10-54Z.json`), resolved in
  `address-reviews-2026-09-10T23-19-40Z.json`. Earlier system passes: in-context pass 1
  (0C/2W/1S) and fresh pass 2 (1C/5W/2S), all resolved.
- Prior internal findings still open: 0
- Prior external findings still open: 0
- Resolved since the last external review — THE VERIFICATION SET for this round (all of
  it landed after both externals ran; no independent eye has checked it):
  1. CRITICAL (both externals) — generation-input precondition now keys on TRACKED state,
     on BOTH switch paths: reference (`pr-choreography.ts`, PR_PROPOSE_SECTION), the
     orbit-propose-modifications delta (+ scenario `An uncommitted exploration does not
     trigger the skip`), tasks.md, the transcription (`phase1.ts` `generationInputGuard`
     hoisted ahead of both paths), three harness cases.
  2. Codex W — a present-but-empty `pr:` (YAML null) now WARNS instead of silently
     resolving as absent (`project-config.ts`; test flipped; delta clause + scenario).
  3. Codex W — 25 shell-interpolated `node ${bin}` test sites across seven
     `test/commands/*.test.ts` files quoted so the suite reproduces from a checkout path
     containing spaces (verified both ways in a real copy).
  4. Fable W — both Position paragraphs' phase labels corrected to the reference's map
     (Phase 2 = generation + validation; Phase 3 carries the no-CI note), pinned by a
     fidelity assertion (this was a regression from an earlier walk).
  5. Fable W — PR TITLE and PROGRAM BODY at birth are now specified in the reference
     (`Title and body at birth`), the recovery `gh pr create` carries `--title`/`--body-file`,
     and the orbit-pr-lifecycle landmark requirement states title-once + program-body rules.
  6. Fable W — stage-entry APPEND is READ-APPEND-WRITE (fetch body via `gh pr view … --json
     body -q .body`, append, write the composed whole) in the tail reference, the recovery
     bullet, and the spec.
  7. Fable W — the attachment record (propose/ff emit) is now COMMITTED AND PUSHED as the
     seam's final act (reference `Recording the attachment`; both bodies' emit steps;
     orbit-propose-modifications phase 3 + scenario `The attachment record reaches the
     branch`).
  8. Fable W — reference step 6 (remote-ahead fast-forward / diverged skip) is transcribed
     in `phase1.ts` with two harness cases; 6.2a/6.2b tail-side clauses carry RESCOPED notes.
  9. Fable W — the architect skill now ships `references/pr-resolution.md` (the SHARED
     resolution algorithm + the four-axis query); the readout points at it. The confirm
     pass then found the reference had carried the seams' config-order early-return gate
     (which would suppress the arc-done readout under a later `pr: never`); the shared
     constant was SPLIT (`PR_RESOLUTION_SECTION` + new `PR_CONFIG_ORDER_SECTION`, both
     interpolated by the seams — bytes unchanged — and only the first by the architect
     reference, whose header now names the attachment as the readout's only gate).
  10. Fable W — design.md's mid-flight-adoption risk bullet corrected (program branch is the
      doc STEM; `d-arc` would not be adopted; per-proposal branches cut from `origin/main`);
      the proposal's Dogfood bullet carries the base caveat.
  11. Fable S ×4 — early HEAD-mismatch observation at archive Step 5.45 + consent preview;
      "own artifact commits" is a PATH test (reference, transcription, harness); the propose
      commit set enumerated explicitly (`.openspec.yaml`, moved `.orbit-runs/` named); the
      Step 5.8 echo clause for positive invalidation.
  12. Confirm S — the architect reference is inside the repository-qualified `gh` sweep.
  Earlier (before the externals, also unverified by any external eye): the no-changes rung
  of bare `orbit status --json` carries `pr`; the eighth delta `specs/orbit-orientation/`;
  the tail's `On POSITIVE invalidation` bullet; the config.yaml per-architecture wording;
  archive steps renumbered (tail 5.6, garnish 5.7); bulk-archive readout source clause.

Known NON-defects (please do not re-flag; they are designed or deferred by ratified
decision — flag only if you find them WRONG, not merely present):
- Task 6.3 is an unchecked user-validation handoff (dogfood exit criterion 1 on a real
  change) — the designed passed-for-flow state, not a completeness defect.
- The arc doc's `### Stage d6-pr-lifecycle` section still carries the superseded
  three-value sketch (`pr: draft-at-propose | at-archive | never`) — retired at archive
  per at-archive note 5.5 in tasks.md.
- The outward half of the choreography (push, `gh pr create/edit/ready`) has NO automated
  coverage by ratified decision; the phase-1 harness (36 cases) covers the local git half
  with a `gh` stub.
- Touchpoints category-5 divergence (`status.ts`, `orientation.ts`, two tests) is explained
  by a dated provenance note under design D-d6-7 — by decision, not drift.
- `orbit/lenses/` does not exist in this repo — passes 4 and 5 are skips.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d6-pr-lifecycle/proposal.md, design.md, tasks.md, explore.md, specs/ (8 deltas)
- The change's commit range: `git diff 7597759..HEAD` (7597759 is the last pre-change
  commit; the walks listed above are in the latest commits on `d-arc`)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched: `src/core/templates/workflows/pr-choreography.ts` (the ONE source —
  now FOUR exported sections: `PR_RESOLUTION_SECTION`, `PR_CONFIG_ORDER_SECTION`,
  `PR_PROPOSE_SECTION`, `PR_ARCHIVE_TAIL_SECTION` — composed into THREE references:
  `pr-choreography.md` for propose + ff, `pr-archive-tail.md` for archive,
  `pr-resolution.md` for architect), `propose.ts`, `ff-change.ts`, `archive-change.ts`,
  `bulk-archive-change.ts`, `onboard.ts`, `architect.ts`, `src/core/project-config.ts`,
  `src/core/orientation.ts` + `src/commands/workflow/status.ts`, `src/core/emit-composition.ts`,
  `orbit/config.yaml`, and tests under `test/core/`, `test/commands/`, `test/core/templates/`,
  `test/integration/pr-lifecycle/` (harness + phase-1 transcription, 36 cases).
  The generated `.claude/` surface is NOT in VCS — regenerate with
  `npm install && npm run build && node bin/orbit.js init --tools claude` to inspect the
  emitted SKILL.md + references/ files as a reading AI sees them. `npm test` should report
  2004 passing (from an ordinary checkout path — spaces now tolerated).

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (task 6.3 is a declared user-validation handoff). Trace every scenario in the eight
   deltas — especially the SIX scenarios added today — to the body or engine text that
   implements it.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
   ZERO ENGINE GIT is the thesis; verify it rather than trusting it.
2. **Cohesion** — callers/dependents outside the tasks list. The verification set above is
   dense with cross-file edits made in one day: probe for edits that landed in one seam
   and not its sibling (propose vs ff bodies; the three references vs the four sections;
   the transcription vs the reference it transcribes; spec clause vs body text).
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces. Three skills now carry PR references; check
   the shared section is byte-identical across all three and that no reference carries
   text meant for a different consumer (the config-order gate belongs to the seams only).
4. **Perspective Reviews** — absent in this repo; note the skip.
5. **Critical-Path Scan** — absent in this repo; note the skip. In its place, walk the PR
   paths AS A PERFORMING AI with today's additions in mind: the attachment record's own
   commit + push at the propose seam (is the sequence performable? does anything now
   happen after "command completion" that the emit contract did not anticipate?); the
   read-append-write on program PRs; title + body at birth; step 6 remote-ahead handling;
   the arc-done readout with the split reference; every degradation branch.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses;
   anything the walks left half-updated.

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-09-11T14-00-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d6-pr-lifecycle (iteration 3)

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
   git commit -m "External review (system, iter 3): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
