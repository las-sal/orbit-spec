# External Review: d5-context-economy (iteration 2)

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

- Iteration: 2 (your iteration-1 system pass was `external-system-2026-08-06T20-09-20Z.md`,
  reviewer OpenAI Codex GPT-5, 4 CRITICAL / 3 WARNING / 1 SUGGESTION)
- Prior internal findings still open: 0 — the in-context confirm pass
  (`review-system-2026-08-10T01-46-07Z.json`) is clean
- Prior external findings still open: 0 — ALL EIGHT iteration-1 findings were resolved by
  the walk `address-reviews-2026-08-09T22-50-28Z.json`. This iteration's primary job is
  VERIFYING those resolutions landed correctly (and hunting anything new the fixes
  introduced):
  1. emit path traversal → contained-identifier rule + realpath symlink containment in
     `resolveTarget` (emit-composition.ts), no-write regression tests
  2. address-reviews hand-written project logs / no archived scope → the emit surface is
     now TRIPLE-scope (bare project / `--change` with archived fallback / `--doc`); the
     hand-write branch is deleted from the generated body
  3. AI-computed touchpoints divergence → engine set-difference on the boot JSON
     (`touchpoints.actual_unpredicted` / `.predicted_unsatisfied` / `.malformed` via the
     previously-uncalled matchers); audit-drift category 5 consumes, judgment-only
  4. chunk-preamble omitted groups → content-coverage ends rule vs parsed numbered groups
     (chunk-preamble.ts), malformed→no-chunking degradation
  5. boot ACTUAL-on-emit → transition keys on committed non-bookkeeping work
     (boot-render.ts; empty post-exclusion actual falls back to predicted)
  6. untracked files in diff boundaries → temp index = HEAD + `add -u` + real-index staged
     additions (apply-state.ts captureDiffBase)
  7. write-gate shape gaps → `model` string|null + full handoff shape (model_hint, seam)
  8. non-repo-relative touchpoint targets → rejected as malformed (touchpoints.ts)
- Resolved since last review: the eight items above, plus (same cycle, from the internal
  fresh pass) the verify warn-state/incomplete emit vocabulary, the model-hint garnish on
  every eligibility surface, the sticky user-validation declaration wording, and the emit
  temp-file cleanup + honest atomicity claim.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d5-context-economy/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD (the D5 apply landed as the
  "D5 apply chunk 1/4..4/4" commits) — PLUS the latest commit(s) carrying the two
  review-cycle fix sets described above
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched by the fixes: src/core/emit-composition.ts (target resolution, write
  gate, verify branch, address-reviews composer), src/core/boot-render.ts,
  src/core/parsers/{chunk-preamble,apply-state,touchpoints}.ts, src/core/report-render.ts,
  src/commands/workflow/status.ts, src/commands/emit.ts,
  src/core/artifact-graph/{gates,trail,instruction-loader}.ts,
  src/core/templates/workflows/{address-reviews,audit-drift,verify-change,onboard,archive-change,review}.ts,
  and the corresponding test suites. The generated .claude/ surface is NOT in VCS —
  regenerate with `npm install && npm run build && node bin/orbit.js init --tools claude`
  if you want to inspect it

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (task 9.6 is a declared user-validation handoff — the designed passed-for-flow state,
   not a completeness defect).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple
   effects, side-effect additions — especially around the eight fix sites.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV (absent in this repo — note the skip).
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk
   end-to-end (absent in this repo — note the skip).
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

## Output format — write to:

`orbit/changes/d5-context-economy/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-08-10T14-30-00Z`. Pick a fresh
timestamp so this file doesn't overwrite your iteration-1 review.)

Use this exact markdown structure:

```markdown
# External Review: d5-context-economy (iteration 2)

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
   git commit -m "External review (system, iter 2): d5-context-economy

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
