# External Review: d2-architect (iteration 2 — system mode)

You are reviewing an OpenSpec change as a second pair of eyes AFTER its implementation landed.
Your value is your independent take — be thorough; flag anything that looks wrong, inconsistent,
or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D2 of the D-arc
  program** AND the doc itself is part of the change's output (retrofitted as the first
  parseable instance); §Stage d2-architect's FOUR exit criteria are the acceptance tests;
  rulings R-d-1..10 constrain the design.
- `orbit/lenses/` — ABSENT in this repo (Passes 4–5 degrade)
- `orbit/changes/d2-architect/.orbit-runs/` — full iteration history
- `orbit/architecture/.orbit-runs/` — the NEW architecture trail (first evidence emit lives here)

## Cycle context

- Iteration: 2 in SYSTEM mode. Iter 1 was **GPT-5 Codex** (2026-07-16): 2 CRITICAL + 4 WARNING,
  ALL RESOLVED via address-reviews (commit `ea00036`):
  1. [C] Review body executed change-only setup before the architecture branches → body
     restructured MODE-FIRST (Steps 1/2/4/5/8/9 branch; `Using doc:` header; architecture mode
     never touches `orbit list`, change CLI calls, or gate computation).
  2. [C] Exit criterion 3 unevidenced → the first `/orbit:review --as architecture` RAN from the
     generated body (user-sanctioned):
     `orbit/architecture/.orbit-runs/review-architecture-2026-07-16T19-42-13Z.json` (no
     findings; `change: null` + `doc` + `handoff`); the arc status log gained a CORRECTION
     entry superseding the weakened claim.
  3. [W] Doc-scoped iteration (Step 5/8 anchor to matching-`doc` emits).
  4. [W] Three-mode launcher surface (skill description + command description/content).
  5. [W] Arc D1 prose pointed at the deleted state line → now points at
     `orbit architecture status`; live-arc test hardened against semantic stale pointers.
  6. [W] Onboarding now enumerates all FOUR trail locations.
- A FRESH internal system pass (iter 2, 2026-07-17) then independently verified all six
  resolutions landed and found 1 WARNING + 2 SUGGESTIONs — also resolved (commit `3c2215c`):
  the review skill's `references/run-summary-schema.md` was never extended for architecture
  mode (now extended: per-mode persistence, mode enum, `change: null` + `doc`, per-doc
  iteration, gate-less assessment, R-d-9(b) `handoff` shape); a launcher-surface e2e assertion
  added; the optional retro-edit of the first architecture emit DECLINED (audit-trail policy —
  the trail records what was actually emitted; its shape drift is materially nil at zero
  findings and is documented).
- Prior internal/external findings still open: 0. Test count is now **1708**.
- Your PRIMARY job (per the gate's confirm predicate): verify the iter-1 resolutions are real
  and complete, and hunt anything all four prior passes missed. A clean result is valid — the
  gate converges on a fresh external yielding 0 CRITICAL.

Do not push back on stale findings — pushback discipline is enforced on resolution, not review.
Just flag what you observe.

## What the change shipped (orientation)

D-arc Stage D2 — a third engine tier: architecture (cross-change program) above schema
(per-change flow). `src/core/architecture/{parser,state,validate}.ts` (fence-aware near-miss
grammar; computed stage state; citation resolution); `orbit architecture status|show|validate`;
`architecture: {doc, stage}` metadata citation with two-level dangling validation in
`orbit validate <change>`; the arc doc retrofitted in place (six kebab stage headings,
`Depends-on:`/`Complete:` slots, D1 ratified `[x] 2026-07-13 (Sal)`, hand-maintained state lines
deleted; archived D1 change backfilled; this change carries the first live citation); the 16th
workflow `/orbit:architect` + body edits to review/audit-drift/onboard/address-reviews/explore/
propose/archive-change; 34 delta requirements (16 ADDED + 18 MODIFIED) across 11 delta files;
20 tasks; baseline stays 14 capabilities until archive syncs to 16.

## What to read for THIS review (--as system)

- orbit/changes/d2-architect/proposal.md, design.md, tasks.md, specs/ (all 11 delta files)
- The change's commit range: `git diff ad2d58e..HEAD` (apply groups `6a74971`..`852be04`;
  post-apply resolution commits `ea00036`, `311421f`, `3c2215c`)
- orbit/specs/<capability>/spec.md (live baselines; body-ahead-of-baseline where a delta exists
  is normal mid-change — body-CONTRADICTS-baseline is a finding)
- orbit/architecture/d-arc-arbitered-flow.md + `node bin/orbit.js architecture status`
  (compare against reality)
- Code paths: src/core/architecture/, src/commands/architecture.ts, src/cli/index.ts,
  src/core/validation/validator.ts, src/core/artifact-graph/types.ts,
  src/core/templates/workflows/{review,architect,audit-drift,onboard,address-reviews,explore,propose,archive-change}.ts,
  src/core/shared/{skill-generation,tool-detection}.ts, src/core/profiles.ts

Useful commands: `npm install && npm run build`, `npm test` (expect **1708** — if your workspace
path contains a SPACE, some command tests fail on unquoted path interpolation; that class is
environmental, not evidence), `node bin/orbit.js validate d2-architect --strict`,
`node bin/orbit.js fingerprint d2-architect --check` (expect 18/18),
`node bin/orbit.js architecture validate d-arc-arbitered-flow`,
`node bin/orbit.js architecture status --json`.

## What to look for

0. **verify-change-style structural check** — tasks genuinely done; the four exit criteria
   evidenced on disk (incl. the architecture-trail emit); design D1–D7 adhered.
1. **Baseline Compliance** — do the landed bodies/engine break any LIVE `orbit/specs/`
   requirement?
2. **Cohesion** — callers/dependents outside the tasks list; the regenerated `.claude/` surface
   (16 skills + 16 commands + references) consistent with `src` templates after the three
   resolution commits.
3. **Surface Walk** — CLI + generated surfaces coherent; the three-mode review launcher.
4. **Perspective Reviews** — skipped (no lenses); note if you disagree.
5. **Critical-Path Scan** — skipped (no lenses).
6. **Drift / Residue** — iter-1-resolution completeness (any spot the mode-first restructure
   missed? any remaining two-mode phrasing in generated references/bodies?); 15→16 residue;
   stale tense outside the append-only status log; dangling citations.

## Output format — write to:

`orbit/changes/d2-architect/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp so this
file doesn't overwrite the iteration-1 review.)

Use this exact markdown structure:

```markdown
# External Review: d2-architect (iteration 2 — system mode)

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

<Optional: overall impression, broader concerns. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output the markdown
directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d2-architect/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 2): d2-architect

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.
