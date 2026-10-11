# External Review: d5-context-economy (iteration 3)

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

- Iteration: 3 (iter 1: `external-system-2026-08-06T20-09-20Z.md`, 4C/3W/1S, all resolved
  in `address-reviews-2026-08-09T22-50-28Z.json`; iter 2: `external-system-2026-08-10T02-50-05Z.md`,
  2C/3W/1S — your verification round confirmed all iter-1 resolutions hold, and found six
  edge-hardening items, all resolved in `address-reviews-2026-08-10T03-06-19Z.json`)
- Prior internal findings still open: 0
- Prior external findings still open: 0 — the six iter-2 resolutions to verify this round:
  1. trail-child symlink escape → `assertContained(runsDir, dirname(runsDir))` at the
     write boundary after creation, every scope (emit-composition.ts); per-scope
     symlinked-`.orbit-runs` no-write regressions
  2. unnumbered checkbox groups → malformed→no-chunking when a preamble exists
     (chunk-preamble.ts); composer test proves `chunk: null` + honest remaining count
  3. committed-work-hidden-until-emit → the `applyStarted` trail-gate is deleted; the
     committed non-bookkeeping diff alone discriminates (boot-render.ts)
  4. defaulted-clean marker count → `remaining_markers_in_scope` required non-negative
     integer at project scope, fail-loud pre-write (emit-composition.ts)
  5. pre-apply malformed vs skip rule → category 5 explicitly gated on
     `touchpoints.actual !== null` including `malformed` (audit-drift body + delta)
  6. stale bare-scope parenthetical → both project-scoped commands named (delta + comment)
- Resolved since last review: the six items above.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d5-context-economy/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD (the "D5 apply chunk 1/4..4/4"
  commits) — PLUS the latest commit carrying the iter-2 resolution set described above
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched by the iter-2 fixes: src/core/emit-composition.ts (write-boundary
  containment, project-scope count validation, bare-scope comment),
  src/core/parsers/chunk-preamble.ts, src/core/boot-render.ts,
  src/core/templates/workflows/audit-drift.ts, the emit-composition delta spec, and the
  corresponding test suites. The generated .claude/ surface is NOT in VCS — regenerate
  with `npm install && npm run build && node bin/orbit.js init --tools claude` if you
  want to inspect it

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (task 9.6 is a declared user-validation handoff — the designed passed-for-flow state,
   not a completeness defect).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple
   effects, side-effect additions — especially around the six iter-2 fix sites.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV (absent in this repo — note the skip).
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk
   end-to-end (absent in this repo — note the skip).
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

## Output format — write to:

`orbit/changes/d5-context-economy/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-08-10T15-00-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d5-context-economy (iteration 3)

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
   git commit -m "External review (system, iter 3): d5-context-economy

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
