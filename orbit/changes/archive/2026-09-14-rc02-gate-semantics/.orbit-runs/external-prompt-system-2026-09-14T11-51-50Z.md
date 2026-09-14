# External Review: rc02-gate-semantics (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`. Read the LATEST commit on that
branch; the walk this review examines is the most recent one.

## Why this pass exists — the stop rule bought it

This change ships the cadence governing this review, and the cadence has now run its full
shape on the change itself. A BLIND PAIR ran first: an external half and a fresh half, on one
artifact state, with no walk between them. Between them they found FIVE CRITICALs with ZERO
overlap. Both were walked in one sitting, then a verification pass reconciled every claimed
fix against the artifact.

The gate then said: `latest independent pass carried 1 CRITICAL; one further independent pass
on the walked state is required`. You are that pass. Its question is narrow and specific:

**Does the WALKED STATE carry a CRITICAL?** If it does not, the gate converges on its own
terms — no override, no loop. If it does, the budget has one pass left and then the gate
reports its spend.

You are reviewing the state AFTER the fixes, not the diff. Read it whole; you are an
independent pass, not a verification pass.

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the ACTIVE program: goals G0–G4, rulings
  R-crc-1 through R-crc-8, fourteen stages. rc02's charter, and those of rc02b, rc02c, rc03,
  rc04, rc08, rc09, rc13. rc02c owns the confirming-pass redesign that LEFT this change.
- `orbit/changes/rc02-gate-semantics/.orbit-runs/` — the full trail: six proposal passes, the
  blind pair, the two walks, the verification pass, and the closing walk.

## Cycle context

- Iteration: 2 (second EXTERNAL review in system mode)
- Prior external findings (iteration 1, GPT-5 Codex): 4 CRITICAL / 6 WARNING, ALL walked.
  Those four were: a partial resolution record certifying findings it omits; ambiguous
  same-token pair candidates; a null `outcome` reviving legacy `status`; and a fence-unaware
  external parser. The second was resolved as a SCENARIO correction rather than an engine
  change, after the fresh half of the pair disagreed and an empirical test settled it — two
  artifacts of one class in one mode cannot share a token, because the filename embeds it.
- Prior internal findings still open: 0. The fresh half's CRITICAL (the gate's own canonical
  next command steering the user into breaking the blind pair) is fixed and is the reason this
  pass was bought.
- Resolved since: 22 findings across two walks, then 2 more from the verification pass. The
  riskiest edit by far is the reordering inside `evaluateReviewed` — coverage is now computed
  BEFORE resolution so an open pair can outrank the walk recommendation. Probe that hardest.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- The CODE, which is the artifact in system mode:
  - `src/core/artifact-graph/gates.ts` — `evaluateReviewed` (note the reordering),
    `assignCadence` and its memoization, `slotCandidates`, `passResolved` (note the new
    completeness check), `deferredSuggestionCount`, `hasNewFindings`, `diagnosePair`,
    `isPairable`, `commandForClass`, `canonicalNextForReviewed` (note the openPair
    precedence), `computeReviewedStatus`, `computeGateStates`, `buildPositionReadout`
  - `src/core/artifact-graph/trail.ts` — `readResolutionEntries`, `normalizeDisposition`
    (presence semantics), `parseExternalMarkdown` (fence-awareness), `readTrail`
  - `src/core/artifact-graph/types.ts`, `schema.ts`, `schemas/spec-driven/schema.yaml`
  - `src/core/artifact-graph/instruction-loader.ts`, `src/commands/workflow/status.ts`
  - `src/core/emit-composition.ts` — `systemReviewNext`
  - `test/core/artifact-graph/rc02-gate-semantics.test.ts` — 56 cases, and your harness
- `orbit/changes/rc02-gate-semantics/` — proposal.md, design.md, tasks.md, three deltas
- `orbit/specs/orbit-engine-gates/spec.md`, `orbit-run-summary-emit/spec.md`,
  `orbit-lifecycle-consent/spec.md` — baselines, for Pass 1
- `orbit/changes/archive/*/.orbit-runs/` — four generations of real trail data

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list; signature drift; ripple effects.
3. **Surface Walk** — every CLI / public-function surface in `orbit/specs/` still coherent?
4. **Perspective Reviews** — `orbit/lenses/` does not exist here; skip and say so.
5. **Critical-Path Scan** — same; skip and say so.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

### Highest-value probes

**Execute the engine. Do not read it for plausibility.** Every CRITICAL this change has
produced came from constructing a trail and walking it through the rule. The test file shows
the harness: write `review-<mode>-<TS>.json`, `external-<mode>-<TS>.md`,
`address-reviews-<TS>.json` and `apply-<TS>.json` into a temp `.orbit-runs/`, call
`computeGateStates`.

- **The reordering.** Coverage is now computed before resolution, and its result is reused.
  Does that change any verdict it should not? Is the reused assignment correct when resolution
  fails? Can the open-pair recommendation fire when it should not, or suppress a walk that is
  genuinely the right next step?
- **The completeness check.** A record must now match every substantive finding by title and
  file. What happens when titles drift, when a finding has an empty file, when an external
  finding's file field is absent? Can a legitimate walk be made permanently unresolvable?
- **The memoization.** The key is (slot, lower bound) on the claim that the consumed set is
  redundant under strict token ordering. Is that claim true for a `blind-pair` slot, whose two
  members have different tokens? Construct a trail that breaks it if one exists.
- **Convergence and false convergence.** Invent trails the 56 tests do not cover.
- **The budget's two counts** and the blocked-gate fields.
- **Spec-versus-code fidelity**, and what the mid-cycle removal of clause (c) left behind.
- **R-crc-1.** Measure capabilities, requirement blocks, delta bytes and task checkboxes
  yourself; the design's bullet claims ten blocks and 58,485 bytes measured at a named point.

## Output format — write to:

`orbit/changes/rc02-gate-semantics/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02-gate-semantics (iteration 2)

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

**Reporting zero findings is a legitimate and expected outcome here.** This change has been
through eight review cycles. The question this pass answers is narrow: does the walked state
carry a CRITICAL? A clean pass is the result the stop rule is designed to reach, not a failure
on your part. Do not pad. The `**Reviewer**:` field is REQUIRED — the parser now rejects a
findings file without it, and a rejected return counts against the review budget.

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — the COMPLETE markdown, every severity
   section, every entry, not abbreviated. The file is the canonical record for `--from-file`
   parsing; the chat output is what the human reads.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc02-gate-semantics/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 2): rc02-gate-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

   **Do NOT walk or fix any finding.** Resolution is a separate step.

If you don't have git access, output the markdown in chat, state explicitly that you could NOT
commit/push, and the user will commit it manually.
