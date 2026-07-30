# External Review: d4-review-consistency (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D4 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow
  d4-review-consistency` for the charter + TWO exit criteria; rulings R-d-1..10 constrain the
  design. Artifacts contradicting the arc are findings.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d4-review-consistency/.orbit-runs/` — full iteration history (incl. the
  explore trail that moved in at promotion)

## Cycle context

- Iteration: 1 in PROPOSAL mode (first external pass; one internal fresh pass preceded you).
- Internal iter 1 (fresh subagent): 5 CRITICAL + 7 WARNING + 4 SUGGESTION — ALL resolved
  (`address-reviews-2026-07-22T22-03-04Z.json`). Worth knowing, because the resolutions are
  the LEAST-REVIEWED text:
  1. Four CRITICALs were un-delta'd baseline text describing the machinery this change
     replaces. Resolutions: orbit-review's `Final assessment phrasings depend on mode` is now
     a MODIFIED block COLLAPSING the branch-and-phrasings machinery into the engine-rendered
     tail (the as-of-completion SYNTHETIC-PASS computation is RETIRED by persist-first
     ordering; design D8 records where each piece went); orbit-conventions' stock phrasings
     scoped to audit + architecture reports; orbit-address-reviews' `Walk-mode…` UX
     de-prompted to lane resolution and its `Resolution-log JSON shape…` rewritten
     (`ratified_via: "chat"|"prompt"`, top-level `delegation_directive`, off-menu
     `chosen: "off-menu"` + verbatim `resolution`; `discuss_invoked` dropped with reader
     tolerance for pre-D4 logs).
  2. The fifth CRITICAL: the external-render path had cited a parsed form (`TrailPass`) that
     cannot supply the grammar's fields. Resolution: the one-grammar requirement now specifies
     a NORMALIZED parse (Description body → verbatim recommendation with the File line
     RETAINED; header reviewer/date; `## Notes` → the report's Commentary slot), validation
     splits PER GENRE (internal: spine + review extensions; external: confident parse), and
     NEW task 1.5 extends the parser — fence-aware (user fork) — without touching the gate
     model's lean TrailPass contract.
  3. User forks (all option A): a one-line orientation delta scoping its byte-identical
     `--change` clause; fence-awareness added rather than the claim dropped; the dropped
     baseline scenario re-added (non-disjunctive decision-lane finding, log-omission
     contract).
  4. Determinism pins: ONE first-run note literal (`First <mode>-mode review of this
     change.`); iteration/trend are AS-OF-AND-INCLUDING the rendered pass (historical
     `--report <TS>` renders as-of values with the CURRENT tail); the equal-token tie-break is
     named (orbit-orientation's earlier-filename-wins); zero-renderable-passes and
     `--report --json` are clean errors.
- Running pattern across eight orbit cycles: EVERY prior CRITICAL was one of: (a) un-delta'd
  live-baseline text contradicting a delta, (b) a delta requirement with no task carrier,
  (c) a triggered live-baseline obligation with no carrier, (d) same-cadence resolutions
  contradicting each other, (e) implementation-vs-scenario-literal divergence (system mode).
  Classes (a) and (d) are the live risks here: the iter-1 resolutions added FIVE new MODIFIED
  blocks — sweep for baseline text they still miss, and for contradictions BETWEEN the
  resolutions themselves.

Do not push back on stale findings — pushback discipline is enforced on resolution, not review.
Just flag what you observe.

## What the change does (orientation)

D-arc Stage D4 — review-consistency. Two moves. (1) The ENGINE owns the human-facing review
report as a PURE FUNCTION over the findings record: NEW capability `orbit-report-rendering`
(7 requirements) — byte-identical golden-tested render; the sandwich grammar (header →
trail-computed trend → scorecard → findings verbatim → suppressed-with-evidence → ONE
delimited `commentary` slot → the ENGINE tail gate/position/eligibility ALWAYS last, computed
at render time from the gate graph, never stored/authored); strict/loud per-genre validation;
one grammar for internal emits AND normalized external findings files; the surface
`orbit status --change <name> --report [<TS>]` (the D3 status gateway's deepest zoom;
read-only; genre dispatch on the spine `command` field; newest-default with the shared
tie-break). (2) The address-reviews walk becomes THREE LANES: obvious-fix (auto-resolved,
previewed at triage BEFORE any fix — provisional classification, reclassification announced),
decision lane (full-prose briefing → genuine discussion → ratification by user CHAT DIRECTIVE
or an OPTIONAL closure AskUserQuestion fired only after the discussion concludes without a
crisp directive; dismissed/inconclusive → the finding re-presents losing nothing), stale/
unresolvable unchanged. Batch PROMPTS prohibited; batch DELEGATION survives as user
prerogative. The review body's report machinery is DELETED (persist-first, run-and-paste, a
greppable hand-rendering prohibition exempting architecture mode) — the economy dividend rides
this change. The review emit gains optional `commentary` (prohibited from counts/verdicts/
next-commands).
Deltas: `orbit-report-rendering` ADDED (7); `orbit-review` ADDED 1 + MODIFIED 3
(final-assessment collapse; commentary on the emit; renderer-computed iteration note with an
architecture carve-out); `orbit-address-reviews` MODIFIED 5 (lifecycle lane preview;
classification-as-lanes; the fork requirement rewritten present→discuss→ratify; walk-mode UX;
resolution-log shape); `orbit-conventions` MODIFIED 1; `orbit-orientation` MODIFIED 1.
Totals: 18 delta requirements (8 ADDED + 10 MODIFIED) across 6 files; 16 tasks in 5 groups;
fingerprints 10/10 verified; `--strict` valid; baseline 17 → 18 at archive; generated surface
unchanged (16 — `--report` is a flag, not a workflow).

## What to read for THIS review (--as proposal)

- orbit/changes/d4-review-consistency/proposal.md, design.md (D1–D8), tasks.md
- orbit/changes/d4-review-consistency/specs/<capability>/spec.md — all 6 delta files
- orbit/changes/d4-review-consistency/explore.md (ratified decisions D-d4-1..6)
- orbit/specs/<capability>/spec.md (live baselines — the 10 MODIFIED blocks should contain
  current baseline requirements verbatim plus only intended edits; especially the LARGE
  collapse of orbit-review's final-assessment requirement and the two rewritten
  orbit-address-reviews blocks — diff them; zero silent scenario drops is the bar, deliberate
  drops must be recorded in design D8)
- Grounding code the design cites: src/core/artifact-graph/trail.ts (TrailPass + the external
  parser task 1.5 extends — verify the design's claims about its CURRENT shape),
  src/core/artifact-graph/gates.ts (computeGateStates), src/commands/workflow/status.ts (the
  D3 --change form + read-only invariant), src/core/templates/workflows/review.ts +
  address-reviews.ts (the bodies tasks 3.1/3.2 rewrite — what exactly gets deleted)

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate d4-review-consistency --strict`,
`node bin/orbit.js fingerprint d4-review-consistency --check` (expect 10/10 verified),
`node bin/orbit.js architecture show d-arc-arbitered-flow d4-review-consistency`.
(`npm test` expects 1754 — if your workspace path contains a SPACE, ~24 command tests fail on
unquoted path interpolation; that class is environmental, not evidence.)

## What to look for

1. **Structure & Delta Integrity** — artifacts present; ADDED/MODIFIED valid; validate passes.
2. **Internal Coherence** — proposal ↔ design ↔ specs ↔ tasks; counts (18 delta requirements;
   6 files; 16 tasks; 17→18 baseline); every requirement has a task carrier; no scope creep
   beyond D-d4-1..6 + the recorded iter-1 resolutions.
3. **Cross-Doc Coherence** — CLAUDE.md/arc accurate post-apply.
4. **Archive Consistency** — the contradiction sweep over ALL live baselines (classes (a) and
   (d) above; especially: any OTHER baseline text about review reports, final assessments,
   AskUserQuestion-in-the-walk, `[discuss]`, `discuss_invoked`, stock phrasings, or the
   `--change` surface the deltas outgrow — e.g. orbit-engine-gates' single-voiced
   recommendation text, orbit-review-external's references to the report format,
   orbit-audit-drift's fork-consumption references, generated-body prose in the templates).
5. **Codegen Readiness** — the render grammar's section forms, the trend/iteration as-of
   semantics, the per-genre validation split, the normalized external shape, the genre
   dispatch, the lane protocol's observable ordering, `ratified_via`/off-menu semantics:
   would two implementers converge?
6. **Gap Hunt** — unstated assumptions, error paths, state transitions the specs miss.
7. **Drift Hunt** — stale vocabulary; overlay-era leakage outside historical references.
8. **Inline Review Marker Residue** — `@review:` markers (fenced/example contexts excluded).
9. **Pre-Handoff Sweep** — anything else before apply.

## Output format — write to:

`orbit/changes/d4-review-consistency/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d4-review-consistency (iteration 1)

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
   git commit -m "External review (proposal, iter 1): d4-review-consistency

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.
