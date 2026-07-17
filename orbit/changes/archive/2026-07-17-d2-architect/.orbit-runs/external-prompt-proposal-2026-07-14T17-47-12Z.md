# External Review: d2-architect (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D2 of the D-arc
  program**; the arc's §Stage D2 FOUR exit criteria are the change's acceptance tests, and
  rulings R-d-1..9 constrain the design (R-d-1: architecture is first-class engine; R-d-9:
  handoff posture — the new emits must carry a `handoff` section from birth). Artifacts
  contradicting the arc are findings.
- `orbit/lenses/perspectives.md` / `orbit/lenses/critical-paths.md` — ABSENT in this repo
- `orbit/changes/d2-architect/.orbit-runs/` — iteration history (explore emits, propose emit,
  the iter-1 fresh review JSON, its address-reviews resolution log)

## Cycle context

- Iteration: 1 (first EXTERNAL review; one internal fresh-context pass preceded you).
- Prior internal findings still open: 0 — the fresh pass (2026-07-14) yielded 1 CRITICAL +
  6 WARNING + 5 SUGGESTION, ALL resolved (see `address-reviews-2026-07-14T*.json`): the CRITICAL
  was an un-delta'd baseline requirement (orbit-review's final-assessment "always renders the
  computed gate state" / "BOTH modes") contradicting the new gate-less architecture mode — fixed
  by a MODIFIED block scoping it to the change-review modes; a 9th delta (orbit-address-reviews)
  was added extending the cascade OUT-set to all four `.orbit-runs/` trails + an
  architecture-scoped resolution-log destination.
- Prior external findings: none.
- Running pattern worth knowing: across the D1 cycle AND this change's iter 1, EVERY CRITICAL
  has been one class — **un-delta'd baseline text contradicting what a delta introduces**
  (enumerations, mode counts, location counts, emitter lists, "always"/"both" claims). Iter 1
  swept and believes the class is now exhausted. Verify that belief with your own sweep.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change does (orientation)

D-arc Stage D2: the engine grows a THIRD declaration tier — architecture (cross-change program)
above schema (per-change flow). Parseable architecture docs (markdown heading conventions:
`### Stage <id> — <title>` + `Depends-on:` / `Complete:` slots; fence-aware parser; everything
else engine-opaque). Stage state COMPUTED from disk (in-change > exploring > quiescent >
premised; the propose/archive file moves ARE the transitions); completion = user RATIFICATION
composed with quiescence (`Complete: [x] <date> (<who>)` is the one declared bit). Citation
linkage: `.openspec.yaml` gains optional `architecture: {doc, stage}`; named explores gain a
minimal `.openspec.yaml`; consume-mode propose MERGES staged metadata (never bulk-mv clobber).
CLI: `orbit architecture status/show/validate` (show slices ONE stage section — the read-cost
answer). NEW workflow `/orbit:architect` (16th generated skill: create/resume scaffolding,
rulings/stages capture, render-never-author state, R-d-8 residency sweep,
completion-ratification flow; never a mandatory flow entry). `/orbit:review --as architecture`
(six passes, NO gate, evidence in `orbit/architecture/.orbit-runs/`). Audit-drift architecture
staleness check. Archive stage-line garnish. The arc doc itself retrofits as the first parseable
instance, DELETING its hand-maintained state lines (R-d-4 subtraction). Baseline 14 → 16
capabilities.

## What to read for THIS review (--as proposal)

- orbit/changes/d2-architect/proposal.md
- orbit/changes/d2-architect/design.md
- orbit/changes/d2-architect/tasks.md
- orbit/changes/d2-architect/specs/<capability>/spec.md — every spec under specs/ (11 files):
  orbit-architecture-engine + orbit-architect (new) and 9 modified (orbit-review,
  orbit-audit-drift, orbit-explore-modifications, orbit-propose-modifications,
  orbit-archive-modifications, orbit-conventions, orbit-run-summary-emit, orbit-onboard,
  orbit-address-reviews)
- orbit/changes/d2-architect/explore.md (decision record: D-d2-1..7, all user-ratified; includes
  the code-touchpoints map)
- orbit/specs/<capability>/spec.md (live baselines — the NINE capabilities' MODIFIED blocks
  should contain their current baseline requirements verbatim plus only intended edits)

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate d2-architect --strict`,
`node bin/orbit.js fingerprint d2-architect --check` (expect 13/13 verified),
`node bin/orbit.js status --change d2-architect --json`.

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency (2 new + 9 modified; 29 delta requirements; 14→16 capabilities; surface 15→16). No scope creep beyond the ratified D-d2-1..7.
3. **Cross-Doc Coherence** — `CLAUDE.md` and the arc doc still accurate after this change (note: CLAUDE.md count updates are declared archive-time items in tasks 5.4; the position-pointer fix is an apply-seam item in task 3.1 — those are carriers, not findings).
4. **Archive Consistency** — ADDED requirements don't contradict baseline; REMOVED/RENAMED n/a; **run the contradiction sweep yourself**: grep live baselines for every enumeration/count/claim the deltas touch (mode sets, `.orbit-runs/` location counts, emitter lists, cascade OUT paths, "both modes", "all three", surface counts).
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity (two implementers converge on the parser grammar, the state precedence, the merge algorithm, the citation validation owner).
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency across artifacts.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

Independent-take probes:
- Is the exhausted-contradiction-class belief true? Notably: `orbit-review-external`'s baseline
  accepts `--as proposal|system` only — the change deliberately does NOT extend external review
  to architecture mode (is that omission coherent, or does any artifact imply otherwise?).
  Same question for mode-enumeration text in generated-body baselines the deltas didn't touch.
- Does the computed-state mapping hold at its edges (a stage cited by an archived change AND a
  live explore; a citation added to an archived change's metadata by hand; two docs declaring
  the same stage id)?
- Is the propose metadata-MERGE deterministic and loss-free against the current propose flow
  (the staged file discarded AFTER carrying fields forward — what if the change's `.openspec.yaml`
  already has an `architecture:` from `orbit new change`-time stamping)?
- Do the R-d-9 handoff-section requirements on the new emits match the arc's R-d-9(b) text
  (pointers, never duplicated substance)?

## Output format — write to:

`orbit/changes/d2-architect/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d2-architect (iteration 1)

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

If your environment doesn't support file writes (chat-only interface), output the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — every severity section, every entry, no
   abbreviation. The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d2-architect/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): d2-architect

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.
