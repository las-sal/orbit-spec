# External Review: d3-orientation (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D3 of the D-arc
  program**; run `node bin/orbit.js architecture show d-arc-arbitered-flow d3-orientation` for
  the charter + TWO exit criteria (the acceptance tests); rulings R-d-1..10 constrain the
  design. Artifacts contradicting the arc are findings.
- `orbit/lenses/` — ABSENT in this repo
- `orbit/changes/d3-orientation/.orbit-runs/` — full iteration history (incl. the explore trail
  that moved in at promotion)

## Cycle context

- Iteration: 1 in PROPOSAL mode (first external pass; two internal passes preceded you).
- Prior internal findings still open: 0 — iter 1 (in-context, 4 findings: begin-emit
  limitation-paragraph qualification; bare-JSON fallback shape; a conventions-scenario scope
  call the user resolved as leave-it; a trail-misstatement record-only correction) and iter 2
  (fresh, 6 findings incl. 1 CRITICAL) are BOTH fully resolved.
- Iter-2's CRITICAL, resolved via user fork option A, is worth knowing: the Mode C
  (crystallization) begin emit originally mandated `decisions_captured: 0`, contradicting the
  live crystallization requirement ("capturing decisions to date") and Mode C's own back-fill.
  Resolution: the begin emit is now MODE-AWARE (Mode B: zero counts + the maturity
  requirement's Early canonical string; Mode C: back-filled counts + maturity-consistent
  recommendation; a third MODIFIED block declares the crystallization's first emit IS the begin
  emit). Verify this reconciliation is complete and internally consistent — it is the
  least-reviewed text.
- Also resolved in iter 2: engine-gates `orbit status` references scoped to `--change` (a 4th
  delta file); degradation-ladder predicates made explicit; maturity string aligned in 3 spots;
  glyph mapping closed; eligibility label capitalized.
- Running pattern across five orbit cycles: EVERY prior CRITICAL was one of three classes —
  (a) un-delta'd live-baseline text contradicting a delta (enumerations, "always"/"only"
  claims), (b) a delta requirement with no task carrier, (c) a triggered live-baseline
  obligation with no carrier. All three have been swept twice here; verify the exhaustion
  with your own sweeps.

Do not push back on stale findings — pushback discipline is enforced on resolution, not review.
Just flag what you observe.

## What the change does (orientation)

D-arc Stage D3 — orientation (status absorption). NEW capability `orbit-orientation`
(8 ADDED requirements): bare `orbit status` renders the CURRENT-SPRINT view — strip
(`explore → propose → review ⟲ → apply → review ⟲ → archive`, chips like `review ⟲6 ✓` /
`apply ▶ 12/20`, closed glyph mapping incl. superseded/stale/unpassed), `last` (most recent
emit's `final_assessment`, first-sentence/~160-char text trim), `next` (engine `next_command`
for changes; recorded `next_recommended` for explores — time-shifted, never live judgment),
one `also` line. Bare-with-changes is TODAY an error path ("Missing required option --change")
— claiming it repurposes nothing; `--change` and no-changes outputs byte-identical. Continuity
predicate: most recent emit among LIVE workstreams (active changes + staging explores; archived/
architecture/project trails never anchor); explicit degradation ladder (zero live + docs → the
`--full` view incl. its JSON shape; zero live + zero docs → existing no-changes message;
emit-less workstream → metadata `created` fallback, name tiebreak). `--full` = arc view
(PROGRAM band, workstreams nested under cited stages, uncited → standalone, LAST + WAITING
bands; zero parseable docs → flat fleet). WAITING is a CLOSED 3-item set. CLI-only (no slash
surface; CLAUDE.md cold-start pointer). Composition-only: NO artifact-content inference (the
retired `~/code/orbit-status` bash approach is the named anti-pattern).
MODIFIED: `orbit-run-summary-emit` (3 blocks — mode-aware explore BEGIN emit in Emit scope;
begin+boundary Emit timing with the qualified known-limitation; the crystallization first-emit
clarification), `orbit-explore-modifications` (Mode B/C scaffolding fires the begin emit),
`orbit-engine-gates` (2 blocks scoping `orbit status` references to the `--change` form).
Counts: 14 delta requirements (8 ADDED + 6 MODIFIED) across 4 delta files; 16 tasks in 5
groups; fingerprints 6/6 verified; `--strict` valid; baseline 16 → 17 at archive; generated
surface unchanged at 16 (no new workflow).

## What to read for THIS review (--as proposal)

- orbit/changes/d3-orientation/proposal.md, design.md, tasks.md
- orbit/changes/d3-orientation/specs/<capability>/spec.md — all 4 delta files
- orbit/changes/d3-orientation/explore.md (ratified decisions D-d3-1..5)
- orbit/specs/<capability>/spec.md (live baselines — the 6 MODIFIED blocks should contain
  current baseline requirements verbatim plus only intended edits; especially
  orbit-run-summary-emit and orbit-engine-gates)
- Grounding code the design cites: src/commands/workflow/status.ts (the :57 throw),
  src/core/artifact-graph/trail.ts (parseTsToken), src/core/architecture/state.ts

Useful commands: `npm install && npm run build`,
`node bin/orbit.js validate d3-orientation --strict`,
`node bin/orbit.js fingerprint d3-orientation --check` (expect 6/6 verified),
`node bin/orbit.js architecture show d-arc-arbitered-flow d3-orientation`.
(`npm test` expects 1712 — if your workspace path contains a SPACE, ~24 command tests fail on
unquoted path interpolation; that class is environmental, not evidence.)

## What to look for

1. **Structure & Delta Integrity** — artifacts present; ADDED/MODIFIED valid; validate passes.
2. **Internal Coherence** — proposal ↔ design ↔ specs ↔ tasks; counts (14 delta requirements;
   4 files; 16 tasks; 16→17 baseline); every requirement has a task carrier; no scope creep
   beyond D-d3-1..5 + the review-cycle resolutions.
3. **Cross-Doc Coherence** — CLAUDE.md/arc accurate post-apply (tasks 4.1/5.4 carriers are
   declared, not findings).
4. **Archive Consistency** — the contradiction sweep over live baselines (all three CRITICAL
   classes; especially: any OTHER baseline claim about `orbit status`, emits, explore modes,
   or maturity recommendations the deltas outgrow).
5. **Codegen Readiness** — the strip grammar, continuity predicate, ladder, WAITING matching
   rules, JSON shapes, mode-aware begin emit: would two implementers converge?
6. **Gap Hunt** — unstated assumptions, error paths (corrupt emit JSONs during the trail scan?
   unreadable metadata?), state transitions.
7. **Drift Hunt** — stale vocabulary; overlay-era (`opsx`/openspec-orbit) leakage outside
   historical references.
8. **Inline Review Marker Residue** — `@review:` markers (fenced/example contexts excluded).
9. **Pre-Handoff Sweep** — anything else before apply.

## Output format — write to:

`orbit/changes/d3-orientation/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens. Pick a fresh timestamp.)

Use this exact markdown structure:

```markdown
# External Review: d3-orientation (iteration 1)

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
   git add orbit/changes/d3-orientation/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): d3-orientation

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, output the findings markdown in this chat, state explicitly that
you could NOT commit/push, and the user will commit it manually.
