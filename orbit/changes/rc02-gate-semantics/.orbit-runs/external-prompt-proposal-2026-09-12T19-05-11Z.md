# External Review: rc02-gate-semantics (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the ACTIVE program. Goals G0–G4, rulings
  R-crc-1 through R-crc-5, twelve stages. This change is stage rc02; read its charter, the
  charter of its new sibling `rc02b-severity-ladder`, and the charters of rc03 / rc04 / rc08,
  which own adjacent work this change must not do and must not leave a hole in.
- `orbit/project.md`, `*_convention.md` at repo root (if present)
- `orbit/lenses/perspectives.md`, `orbit/lenses/critical-paths.md` (if present)
- `orbit/changes/rc02-gate-semantics/.orbit-runs/` — iteration history

## Cycle context

- Iteration: 1 (first EXTERNAL review of this change; one internal fresh pass preceded it)
- Prior internal findings still open: 0. The fresh proposal pass
  (`review-proposal-2026-09-12T18-15-33Z.json`) raised 13 findings — 0 CRITICAL, 9 WARNING,
  4 SUGGESTION — and all 13 were resolved in the walk
  (`address-reviews-2026-09-12T18-59-14Z.json`).
- Prior external findings still open: none — this is the first external pass.
- Resolved since last review — read the walk log for the full record; the four structural ones:
  1. The stage was **SPLIT**. It carried the severity ladder AND the convergence arithmetic, and
     measured 40 task checkboxes against R-crc-1's ceiling of under 20. The ladder half (the
     consequence definitions, the CRITICAL `reproduction` evidence tax, its write-gate
     enforcement, and the address-reviews reader) moved to a NEW stage `rc02b-severity-ladder`.
     What the engine COMPUTES stayed here.
  2. A proposed **sixth gate state** `budget-exhausted` was **REVERSED** in favour of reporting
     spend beside the state (a `budgetExhausted` boolean, a spend clause in the reason, and the
     position token `unpassed BUDGET-SPENT`). Reason given: gate `state` answers whether the gate
     converged, and spend is an orthogonal axis; the sixth state also contradicted three
     closed-set requirements in capabilities this change does not modify.
  3. Convergence clause (c) was changed from "the most recent independent pass" to a **confirming
     pass SET** (both members of a `blind-pair`), because a CRITICAL in the earlier-finishing pair
     member was otherwise invisible.
  4. The `blind-pair` slot now selects the **EARLIEST** qualifying pair, not the latest, so it
     composes with clause (a)'s greedy earliest-satisfying walk.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/rc02-gate-semantics/proposal.md
- orbit/changes/rc02-gate-semantics/design.md
- orbit/changes/rc02-gate-semantics/tasks.md
- orbit/changes/rc02-gate-semantics/specs/orbit-engine-gates/spec.md
- orbit/changes/rc02-gate-semantics/explore.md (the exploration that produced it, including the
  rejected alternatives and the decisions later reversed)
- orbit/specs/orbit-engine-gates/spec.md (the baseline this delta modifies — diff every MODIFIED
  block against it)
- orbit/specs/orbit-orientation/spec.md, orbit/specs/orbit-run-summary-emit/spec.md,
  orbit/specs/orbit-archive-modifications/spec.md (the three closed-set consumers the reversal in
  item 2 above claims are left untouched — verify that claim)

You must also read the ENGINE this change modifies. Reasoning about it abstractly is not enough:

- src/core/artifact-graph/gates.ts — `evaluateReviewed` (the three clauses),
  `computeReviewedStatus`, `passResolved`, `hasNewFindings`, `canonicalNextForReviewed`,
  `buildPositionReadout`
- src/core/artifact-graph/trail.ts — `readTrail`, `TrailPass`, `TrailResolution`,
  `parseInternalReview`, `parseExternalMarkdown`, `parseAddressReviews`
- src/core/artifact-graph/types.ts — `GateSchema`, `CADENCE_ENTRIES`, `GateConfirmSchema`
- src/core/artifact-graph/schema.ts — `normalizeGates`, `validateGates`
- schemas/spec-driven/schema.yaml — version 3 today; this change bumps it to 4
- src/core/orientation.ts, src/commands/workflow/instructions.ts — the consumers the change
  claims it no longer needs to touch

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with `*_convention.md`.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

### Highest-value probes for THIS change

This change rewrites the criterion by which every future change's review gate converges. A
defect here is a defect in the instrument that will judge everything after it. The
highest-signal thing you can do is **trace the specified arithmetic against the real code on
constructed trails**, rather than reading the prose for plausibility. Concretely:

- **Trace the `blind-pair` slot through clause (a)'s ordered walk** (`gates.ts` lines ~193–213).
  The slot is two passes where every other slot is one. Build trails and check the arithmetic:
  a pair straddling a prior slot's token; an in-context pass sitting between the two members;
  two candidate pairs; a pair where one member is stale; passes sharing a timestamp token. Does
  "satisfied at the later token" plus "earliest qualifying pair" actually compose, or is there a
  trail where the greedy walk and the pair selection still disagree?
- **Test the blindness predicate against what `readTrail` can actually see.** Blindness is "no
  `address-reviews` record whose `source_path` references either pass carries a token strictly
  between theirs". What is `sourcePath` when it is null, or a path shape the matcher does not
  expect, or a walk that ingested findings from two sources at once? What happens when an
  external findings file fails `parseExternalMarkdown`'s shape validation and is therefore absent
  from the trail entirely — is the gate's reason then honest about why the pair is unformed?
- **Attack termination.** The change claims the common case converges in a pair plus a walk, and
  the pathological case is bounded by the budget. Construct the worst case you can and check
  whether the gate can still demand passes without limit, or can report exhaustion while a
  cadence slot was never covered. Which condition wins, and does the reason mislead?
- **Verify the "left untouched" claim in the reversal.** The design asserts that reporting spend
  beside the state rather than as a state leaves `orbit-orientation`'s WAITING derivation,
  `orbit-run-summary-emit`'s `gate_overridden.state`, and `orbit-archive-modifications`' prompt
  condition all working unchanged. Read those three requirements and say whether that is true, or
  whether a stale claim has simply moved.
- **Check the severity-aware clause (b) against real data.** Read several real
  `address-reviews-*.json` emits under `orbit/changes/archive/*/.orbit-runs/`. Do the
  `resolutions[]` entries carry `severity` and `outcome` reliably? The change adds two fail-safe
  rules for unvalidated values — are they sufficient, and is the claimed relationship to the
  legacy bare-count fallback actually true?
- **Check the split's seams.** rc02b-severity-ladder now owns the severity ladder. Does this
  change still depend on anything that left with it? Does anything that left have a dangling
  reference back? Is there a property neither stage now owns?
- **Measure R-crc-1 for yourself** — capabilities touched, requirement blocks, delta bytes, task
  checkboxes — and say whether the numbers stated in `design.md` are the numbers on disk.

## Output format — write to:

`orbit/changes/rc02-gate-semantics/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02-gate-semantics (iteration 1)

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
   git add orbit/changes/rc02-gate-semantics/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc02-gate-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
