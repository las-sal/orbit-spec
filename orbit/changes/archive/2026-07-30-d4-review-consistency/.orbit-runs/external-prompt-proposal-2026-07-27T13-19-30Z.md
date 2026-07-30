# External Review: d4-review-consistency (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes — the INDEPENDENT pass the
review cadence needs: the last independent pass (an internal fresh subagent) carried 1
CRITICAL, since resolved; an in-context confirm then came back clean. Your job is adversarial
confirmation — verify the latest resolutions actually landed, and find what four prior passes
missed. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D4 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow
  d4-review-consistency` for the charter + TWO exit criteria; rulings R-d-1..10 constrain.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d4-review-consistency/.orbit-runs/` — full iteration history

## Cycle context

- Iteration: 2 in PROPOSAL mode (your iter 1 was GPT-5 Codex, 2026-07-22). Four passes so
  far: internal fresh (16 findings, 5 CRITICAL) → YOUR iter 1 (12 findings, 7 CRITICAL) →
  internal fresh (7 findings, 1 CRITICAL) → in-context confirm (CLEAN). All 42 findings
  RESOLVED, none re-opened.
- Resolved since your iter 1 (the batches to re-verify — the LATEST is least-reviewed):
  - **Your 7 CRITICALs**: pushback-suppression MODIFIED block (suppressed = excluded from
    active counts, first-class in the suppressed section); `ratified_via`/`resolution`
    promoted to ENTRY-LEVEL resolution-log fields (fork objects carry detection data only;
    new non-fork-channel + off-menu scenarios); the genre-symmetric Notes contract (task 3.5
    extends the external prompt template's Notes instruction with the
    no-counts/verdicts/next-commands prohibition; never-disagree restated contract-enforced
    with the tail-last backstop); the genre-conditional header IN the grammar (external:
    change from argument, mode from filename, trail-ordinal iteration, reviewer/date, depth
    omitted; scorecard internal-only); the deterministic-facts spine contract (severity-counts
    `final_assessment`; findings → address-reviews self-pointer / clean → `--report` pointer;
    NO stored `iteration_note`); the `--fresh` MODIFIED block (stock-phrasings sentence →
    cadence relationship); task 3.6 onboard.ts rewrite (both retired models).
  - **Your 3 WARNINGs**: design D2b — the canonical rendered example as line-level grammar
    (goldens TRANSCRIBED from it, never authored); counts corrected; R-d-9 dated evidence
    notes in task 5.4.
  - **Internal iter 3's CRITICAL** (the latest batch): the `scorecard` emit field is now
    DECLARED end-to-end — the persisted-summary scenario names it (3-dimension × severity;
    the renderer's required counts source); a SECOND `orbit-conventions` MODIFIED block
    rewrites the emit-format requirement (editorial extensions declare `scorecard`;
    `findings_summary` RETIRED for review emits with two-generation reader tolerance —
    audit-drift and archive-audit keep their own; the canonical review example updated to the
    counts sentence + scorecard shape); task 3.4 declares it in the schema reference. Plus: a
    7th delta file — `orbit-engine-gates`' freshness parenthetical made self-contained (it
    cited the convergence-state prose this change deletes); D2's never-disagree overclaim
    aligned; skipped-pass notes homed in the loose-form conversation; the `detected: false`
    variant killed (absence IS the no-fork representation); the ungated-schema gate line
    specified (omitted whole, golden-pinned).
- Record-only corrections on the trail (do not re-flag): an emit/commit misstated "7 delta
  files" (true count SIX); three emits' `next_recommended` initially diverged from the
  engine's computed next (all corrected; one pointed at the not-yet-shipped `--report`
  surface).
- Running CRITICAL classes across nine cycles: (a) un-delta'd baseline text contradicting a
  delta, (b) a delta requirement with no task carrier, (c) a triggered baseline obligation
  with no carrier, (d) same-cadence resolutions contradicting each other, (e)
  implementation-vs-scenario-literal (system mode). Classes (a) and (d) remain the live
  risks: the resolution batches added SEVEN new MODIFIED blocks since your pass — sweep for
  baseline text THEY still miss and for contradictions between THEM.

Do not push back on stale findings — pushback discipline is enforced on resolution, not
review. Just flag what you observe.

## What the change does (orientation)

D-arc Stage D4 — review-consistency. (1) The ENGINE owns the review report as a pure
function: NEW `orbit-report-rendering` (7 requirements — byte-identical golden-tested render;
the sandwich grammar with genre-conditional elements IN the grammar and design D2b's
line-level canonical example as the goldens' source; render-time computed context
(as-of-and-including iteration/trend; the CURRENT gate/position/eligibility tail, gate line
omitted whole for ungated schemas); the genre-symmetric quarantined Commentary slot (internal
`commentary` field / external `## Notes`, contract stated at the SOURCE in both genres);
per-genre strict/loud validation; one grammar via a NORMALIZED fence-aware external parse
(task 1.5 — Description body as verbatim recommendation, File line retained, reviewer/date,
Notes → Commentary) without touching the gate model's lean TrailPass; the surface
`orbit status --change <name> --report [<TS>]` — read-only, raw artifact-resolution step
before parse, genre dispatch on the spine `command`, zero-passes/`--json`/non-renderable
clean errors, the shared earlier-filename tie-break). (2) The address walk: three lanes
(obvious-fix previewed at triage from PROVISIONAL classification, reclassification announced;
decision lane = full-prose briefing → discussion → ratification by chat directive or an
optional closure AskUserQuestion fired only AFTER the discussion concludes; dismissed →
re-present; batch prompts dead, delegation alive and recorded). Persist-first with the
deterministic-facts spine. The review/address bodies shed their report machinery (the economy
dividend; greppable prohibitions); tasks 3.5/3.6 sweep the review-external and onboard
templates.
Deltas: `orbit-report-rendering` ADDED 7; `orbit-review` ADDED 1 + MODIFIED 5;
`orbit-address-reviews` MODIFIED 5; `orbit-conventions` MODIFIED 2; `orbit-orientation`
MODIFIED 1; `orbit-engine-gates` MODIFIED 1. TOTALS: 22 delta requirements (8 ADDED + 14
MODIFIED) across SIX files; 18 tasks in 5 groups; fingerprints 14/14 verified; `--strict`
valid; baseline 17 → 18 at archive; generated surface unchanged (16).

## What to read for THIS review (--as proposal)

- orbit/changes/d4-review-consistency/proposal.md, design.md (D1–D8 incl. D2b), tasks.md
- orbit/changes/d4-review-consistency/specs/<capability>/spec.md — all 6 delta files
- orbit/changes/d4-review-consistency/explore.md (ratified D-d4-1..6)
- orbit/specs/<capability>/spec.md — live baselines: diff ALL 14 MODIFIED blocks
  (baseline-verbatim + only intended edits; zero silent scenario drops — deliberate drops
  must be recorded in design D8); sweep ALL 17 baselines for classes (a)/(d)
- Grounding code: src/core/artifact-graph/trail.ts (TrailPass, parseExternalMarkdown),
  gates.ts (computeGateStates), src/commands/workflow/status.ts, and the FOUR templates
  tasks 3.1/3.2/3.5/3.6 rewrite (review.ts, address-reviews.ts, review-external.ts,
  onboard.ts) — verify the cited content exists and nothing ELSE in the generated bodies
  still teaches the retired models

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate d4-review-consistency --strict`,
`node bin/orbit.js fingerprint d4-review-consistency --check` (expect 14/14),
`node bin/orbit.js architecture show d-arc-arbitered-flow d4-review-consistency`.
(`npm test` expects 1754 — if your workspace path contains a SPACE, ~24 command tests fail
on unquoted path interpolation; environmental, not evidence.)

## What to look for

1. **Structure & Delta Integrity** — validate passes; delta forms correct.
2. **Internal Coherence** — counts (22 requirements; 6 files; 18 tasks; 17→18); every
   requirement has a task carrier; no scope creep beyond D-d4-1..6 + recorded resolutions.
3. **Cross-Doc Coherence** — CLAUDE.md/arc accurate post-apply.
4. **Archive Consistency** — classes (a)/(d) over ALL baselines; especially neighbors of the
   newest blocks (the conventions format requirement's OTHER consumers; anything else citing
   findings_summary, stock phrasings, iteration_note, or the walk prompts).
5. **Codegen Readiness** — D2b's grammar complete enough to transcribe? the scorecard/spine
   contracts deterministic? entry-level ratification consistent across every scenario?
6. **Gap Hunt** — error paths, edge cases, unstated assumptions.
7. **Drift Hunt** — stale vocabulary; generated-body residue.
8. **Inline Review Marker Residue** — `@review:` markers.
9. **Pre-Handoff Sweep** — anything else before apply.

## Output format — write to:

`orbit/changes/d4-review-consistency/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d4-review-consistency (iteration 2)

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
   git add orbit/changes/d4-review-consistency/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 2): d4-review-consistency

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly
that you could NOT commit/push, and the user will commit it manually.
