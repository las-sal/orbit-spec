# External Review: rc02-gate-semantics (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`, at commit `3be1283`.

## You are ONE HALF of a BLIND PAIR — this matters

This change ships the rule you are about to be governed by, and this review is its
first live exercise. The system cadence is now `[blind-pair, in-context]`: two
independent passes of DISTINCT classes (one external — you — and one fresh-context
Claude) must both run on the SAME artifact state, BLIND to each other, before EITHER
pass's findings are walked. A walk of either pass's findings landing between the two
tokens breaks the pair, and the gate will say so.

Two consequences for you:

- Your findings will NOT be acted on until the fresh half has also run. That is by
  design, not neglect. Do not tailor the review expecting an immediate fix.
- Do not read the other half's findings if they land before you finish. Blindness is
  the property being bought.

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the ACTIVE program: goals G0–G4,
  rulings R-crc-1 through R-crc-8, fourteen stages. Read rc02's charter and those of
  rc02b, rc02c, rc03, rc04, rc08, rc09, rc13 — this change must not do their work and
  must not leave a hole none of them owns. In particular rc02c owns the confirming-pass
  redesign that LEFT this change, and its charter records why.
- `orbit/project.md`, `*_convention.md` at repo root, `orbit/lenses/*` (if present)
- `orbit/changes/rc02-gate-semantics/.orbit-runs/` — iteration history

## Cycle context

- Iteration: 1 (first EXTERNAL review of this change in system mode)
- Prior internal findings still open: 0. Six proposal passes ran before apply
  (fresh, external, fresh, fresh, in-context verification, fresh) producing 72
  findings and 13 CRITICALs, ZERO repeats across the whole axis; all were walked.
- Prior external findings still open: none in system mode.
- Resolved since — read the walk logs for the record; the two that shape what you are
  reading now: clause (c)'s confirming-pass-set and succession rewrite was REMOVED
  from this change entirely (it now ships the pre-existing predicate with one edit),
  and the pass condition gained two stated conventions after four passes found rules
  that read correctly and computed wrongly.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- `orbit/changes/rc02-gate-semantics/` — proposal.md, design.md, tasks.md, and all
  three deltas under `specs/` (orbit-engine-gates, orbit-run-summary-emit,
  orbit-lifecycle-consent)
- The change's commit range: `git diff 1519bb2..3be1283` — the apply commit is
  `3be1283` and carries the whole engine change
- `orbit/specs/orbit-engine-gates/spec.md`, `orbit/specs/orbit-run-summary-emit/spec.md`,
  `orbit/specs/orbit-lifecycle-consent/spec.md` — the archived baselines, for
  baseline-compliance
- The CODE, which is the point of a system review:
  - `src/core/artifact-graph/gates.ts` — `evaluateReviewed`, `assignCadence`,
    `slotCandidates`, `passResolved`, `deferredSuggestionCount`, `hasNewFindings`,
    `diagnosePair`, `isPairable`, `commandForClass`, `canonicalNextForReviewed`,
    `computeReviewedStatus`, `buildPositionReadout`
  - `src/core/artifact-graph/trail.ts` — `readResolutionEntries`, `normalizeDisposition`,
    `normalizeSeverity`, `parseExternalMarkdown`, `readTrail`
  - `src/core/artifact-graph/types.ts`, `schema.ts`, `schemas/spec-driven/schema.yaml`
  - `src/core/artifact-graph/instruction-loader.ts`, `src/commands/workflow/status.ts`
    — the two gate-row projections
  - `src/core/emit-composition.ts` — `systemReviewNext` and the verify branches
  - `test/core/artifact-graph/rc02-gate-semantics.test.ts` — 45 new cases
- Real trail data: `orbit/changes/archive/*/.orbit-runs/` — four generations of
  `address-reviews` shape exist on disk. Find them and test the reader against them.

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / public-function surface in `orbit/specs/` still coherent?
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

### Highest-value probes for THIS change

This change rewrote the criterion by which every future change's review gate converges.
A defect here is a defect in the instrument that judges everything after it. The code is
now the artifact — **execute it**, do not read it for plausibility. Every CRITICAL found
in this change's six proposal passes came from constructing a trail and walking it
through the rule; none came from careful reading.

- **Run the engine on trails you invent.** `test/core/artifact-graph/rc02-gate-semantics.test.ts`
  shows the harness: write `review-<mode>-<TS>.json`, `external-<mode>-<TS>.md`,
  `address-reviews-<TS>.json` and `apply-<TS>.json` into a temp `.orbit-runs/`, then call
  `computeGateStates`. Invent trails the tests do NOT cover and check the verdict is the one
  the spec claims. Can the gate converge on every legitimate path? Can it falsely converge on
  any? Is there a cadence where no assignment can satisfy every constraint?
- **Attack `assignCadence` specifically.** It is a backtracking search added to satisfy an
  existential coverage criterion. Does it terminate on every trail? Is it exponential on a
  trail with many passes? Does the candidate ordering actually yield the lexicographically
  smallest assignment the spec promises, or only the first one found?
- **Attack the two stated conventions.** The spec says freshness has exactly one home and
  every rule states its empty case. Verify BOTH against the code, not the prose. Is there a
  rule whose empty case is still implicit? Is freshness re-filtered anywhere inside a slot
  predicate, which would make the `stale` gate state unreachable?
- **Test `readResolutionEntries` against every real archived record**, not the fixtures.
  Find a record it classifies in a way the spec does not intend.
- **The budget's two counts.** `independentSpend` versus `independentSpendFresh`. Are the
  inputs to each well defined for a gate whose id encodes no mode? Can a rejected external
  return be attributed to the wrong gate?
- **Spec-versus-code fidelity.** Diff every normative sentence in the engine-gates delta
  against what `gates.ts` actually does. Both of the last two reviews found the prose and the
  arithmetic disagreeing.
- **What the removal left behind.** Clause (c)'s rewrite was removed mid-cycle. Is there
  residue — a scenario, a task, a design paragraph, a test — that still assumes it? Does
  anything now reference a capability rc02c owns as though rc02 shipped it?
- **R-crc-1.** Measure capabilities, requirement blocks, delta bytes and task checkboxes
  yourself and compare against what `design.md` states.

## Output format — write to:

`orbit/changes/rc02-gate-semantics/.orbit-runs/external-system-<TS>.md`

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

Reporting few or zero findings is a legitimate and useful outcome if that is what the
evidence supports. This change has been through six review cycles; a clean pass is a real
possible result, not a failure on your part. Do not pad.

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
   git add orbit/changes/rc02-gate-semantics/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc02-gate-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

   **Do NOT walk or fix any finding.** This is one half of a blind pair; the walk
   happens after both halves have run, and a walk landing now would break the pair.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
