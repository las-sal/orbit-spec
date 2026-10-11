# External Review: d2-architect (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D2 of the D-arc
  program**; §Stage D2's FOUR exit criteria are the acceptance tests; rulings R-d-1..9 constrain
  the design. Artifacts contradicting the arc are findings.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d2-architect/.orbit-runs/` — full iteration history

## Cycle context

- Iteration: 2 (prior external: iteration 1 by **GPT-5 Codex**, 2026-07-14 — 1 CRITICAL +
  1 WARNING + 1 SUGGESTION, all resolved: the archived-D1 citation backfill added to the
  retrofit task + falsified-mark rule tightened to ANY non-quiescent observation; the audit's
  dangling-citation scan made independent of doc presence; staged-metadata-authoritative merge
  precedence).
- Prior internal findings still open: 0 — two fresh-context passes fully resolved (iter 1:
  12 findings incl. an un-delta'd orbit-review final-assessment CRITICAL and a new 9th delta;
  iter 2: 6 findings incl. the 9th delta being carrier-less and a SECOND un-delta'd enumeration
  in orbit-run-summary-emit's `Emit timing semantics`).
- Resolved since last external review: iter-2's 6 (task 4.5 now carries the address-reviews
  body edit; Emit-timing MODIFIED block; falsified-mark owner = status render + audit-drift,
  architecture validate stays structure-only; quick-reference table row; spine `change`
  annotation widened in both copies; `--parallel` no-op in architecture mode).
- Running pattern worth knowing: across three orbit cycles, EVERY CRITICAL has been one of two
  classes — **un-delta'd baseline text contradicting a delta** (mode/location/emitter/count
  enumerations, "always"/"both"/"cover the full surface" claims) or **a spec delta with no
  implementation carrier in tasks**. Both classes have now been swept twice each. Verify the
  exhaustion with your own sweeps of both classes.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change does (orientation)

D-arc Stage D2: a THIRD engine declaration tier — architecture (cross-change program) above
schema (per-change flow). Parseable docs (`### Stage <id> — <title>` headings +
`Depends-on:`/`Complete:` slots; fence-aware; all else engine-opaque). Stage state COMPUTED from
disk (in-change > exploring > quiescent > premised; file moves ARE transitions); completion =
user RATIFICATION composed with observed quiescence; ratified marks on non-quiescent observations
surface via the status render + audit-drift. Citation `architecture: {doc, stage}` in
change/explore metadata (explores gain minimal `.openspec.yaml`; propose merges staged metadata,
staged citation authoritative on conflict; archived-D1 backfill at retrofit). CLI:
`orbit architecture status/show/validate` (`show` slices one stage; validate = doc structure;
change validation owns citation resolution). NEW `/orbit:architect` (16th skill; scaffolding,
capture, render-never-author, residency sweep, completion-ratification flow; never a mandatory
entry). `/orbit:review --as architecture` (six passes, NO gate, evidence in
`orbit/architecture/.orbit-runs/` — the fourth trail location; findings walk through
address-reviews with architecture-scoped resolution logs). Audit-drift staleness check
(doc-side checks skip without parseable docs; citation scan runs regardless). Archive stage-line
garnish. The arc doc retrofits as the first instance, DELETING its hand-maintained state lines.
Baseline 14 → 16 capabilities; 2 new + 9 modified delta files; 31 delta requirements.

## What to read for THIS review (--as proposal)

- orbit/changes/d2-architect/proposal.md, design.md, tasks.md
- orbit/changes/d2-architect/specs/<capability>/spec.md — all 11 delta files
- orbit/changes/d2-architect/explore.md (ratified decisions D-d2-1..7 + code-touchpoints map)
- orbit/specs/<capability>/spec.md (live baselines — the 15 MODIFIED blocks should contain
  current baseline requirements verbatim plus only intended edits)

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate d2-architect --strict`,
`node bin/orbit.js fingerprint d2-architect --check` (expect 15/15 verified),
`node bin/orbit.js status --change d2-architect --json`.

## What to look for

1. **Structure & Delta Integrity** — artifacts present; ADDED/MODIFIED valid; validate passes.
2. **Internal Coherence** — proposal ↔ design ↔ specs ↔ tasks; counts (2 new + 9 modified;
   31 delta requirements; 14→16 capabilities; surface 15→16; 20 tasks); every requirement has a
   task carrier (the class that produced iter-2's CRITICAL — re-sweep it); no scope creep beyond
   D-d2-1..7.
3. **Cross-Doc Coherence** — CLAUDE.md/arc accurate post-apply (tasks 3.1/5.4 carriers are
   declared, not findings).
4. **Archive Consistency** — the contradiction sweep over live baselines (both CRITICAL classes;
   claims like "cover the full command surface", "both modes", "all three/four", emitter lists,
   OUT-path enumerations, surface counts).
5. **Codegen Readiness** — parser grammar, state precedence, completion composition, merge
   algorithm, validation ownership: would two implementers converge?
6. **Gap Hunt** — unstated assumptions, error paths, state transitions.
7. **Drift Hunt** — stale vocabulary within artifacts.
8. **Inline Review Marker Residue** — `@review:` markers (fenced/example contexts excluded).
9. **Pre-Handoff Sweep** — anything else before apply.

Independent-take probes:
- The two exhausted-CRITICAL-class beliefs (un-delta'd enumerations; carrier-less deltas) — are
  they actually exhausted now?
- The completion-composition edges: archived-D1 backfill + ratified-mark-on-premised
  inconsistency + at-stamp boundaries — consistent across engine spec, audit-drift delta,
  design D3/D7, and tasks 3.1?
- The four-trail story: conventions persistence locations, cascade OUT-set, resolution-log
  destinations, emit-timing categories — all mutually consistent across the five capabilities
  that now mention `orbit/architecture/.orbit-runs/`?

## Output format — write to:

`orbit/changes/d2-architect/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp so this file
doesn't overwrite the iteration-1 review.)

Use this exact markdown structure:

```markdown
# External Review: d2-architect (iteration 2)

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
   git add orbit/changes/d2-architect/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 2): d2-architect

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.
