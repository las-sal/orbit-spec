# External Review: d5-context-economy (iteration 1)

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
- `orbit/changes/d5-context-economy/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in system mode; a proposal-mode
  external review ran 2026-08-04 — see `external-proposal-2026-08-04T16-47-38Z.md`)
- Prior internal findings still open: 0 — the fresh system pass
  (`review-system-2026-08-06T18-15-14Z.json`, 0C/4W/5S) was fully resolved by the walk
  `address-reviews-2026-08-06T19-08-12Z.json`, and the in-context confirm pass
  (`review-system-2026-08-06T19-28-04Z.json`) is clean (0 findings)
- Prior external findings still open: 0 (none in system mode)
- Resolved since last review: the 9 findings of the fresh system pass — (1) the ≤20k
  body-size target miss surfaced + user-ratified at 28.5k (proposal.md outcome note, arc
  exit-criterion-1 ratified reading); (2) verify emit vocabulary extended (warn-state +
  incomplete-run + scenario counts per the baseline strings); (3) model-hint garnish
  threaded through the report tail and all orientation eligibility lines; (4) retired
  `/orbit:review-external` residue swept from six generated-surface sites; (5) sticky
  user-validation declaration semantics spec'd (delta reworded + scenario + test);
  (6) emit temp-file cleanup + honest atomicity claim; (7) typed `userValidationPending`
  on status --json gate rows; (8) boot ACTUAL touchpoints collapse change-own bookkeeping
  to a count; (9) count-free generated-surface test titles. Earlier in the cycle: the
  retired-surface update reconciliation (RETIRED_SKILL_DIRS registry), the touchpoints
  divergence accept-and-record, the commented `models:` example, and the user-logged
  gate-layer fix (the user-validation subset rule itself).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d5-context-economy/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD (estimate <change-start> from
  git log — the D5 apply landed as the "D5 apply chunk 1/4..4/4" commits) PLUS the
  latest commit(s) carrying the review-cycle fixes described above
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched by the change (cohesion + surface walk): src/core/emit-composition.ts,
  src/core/report-render.ts, src/core/boot-render.ts, src/core/orientation.ts,
  src/core/model-hints.ts, src/core/artifact-graph/{gates,trail,instruction-loader}.ts,
  src/core/profile-sync-drift.ts, src/core/update.ts, src/commands/workflow/status.ts,
  src/core/templates/workflows/*.ts (the generated surface sources), and the generated
  .claude/ surface is NOT in VCS — regenerate with `npm install && npm run build &&
  node bin/orbit.js init --tools claude` if you want to inspect it

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (run your own equivalent of upstream verify-change; note task 9.6 is a declared
   user-validation handoff — the designed passed-for-flow state, not a completeness defect).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple
   effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV (absent in this repo — note the skip).
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk
   end-to-end (absent in this repo — note the skip).
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

## Output format — write to:

`orbit/changes/d5-context-economy/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-08-06T20-15-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d5-context-economy (iteration 1)

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
   git add orbit/changes/d5-context-economy/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): d5-context-economy

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
