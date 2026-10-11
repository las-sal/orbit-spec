# External Review: rc02c-confirmation-semantics (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **post-apply system review**: the change is implemented and committed.
It is also a **SUBTRACTIVE** change — it deletes engine mechanism rather than
adding it — so the risk lives in what was taken away and in the seams where the
removed mechanism used to be load-bearing, not in new code paths.

## Repo

https://github.com/las-sal/orbit-spec — branch `d-arc`, HEAD `4ab8b7a`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the LIVE program. Read the
  `rc02c-confirmation-semantics` stage section, **including the 2026-09-21
  SUPERSEDED note and the amended exit criteria**, plus rulings R-crc-1
  (size ceiling), R-crc-8 (finding quality never licenses another pass),
  R-crc-10 (mechanize only what the engine can observe) and R-crc-11
  (alignment over cost; effort RECORDED never TARGETED).
- `orbit/project.md`, `*_convention.md`, `orbit/lenses/` — **ABSENT in this
  repo.** Passes that depend on them should be skipped with a note.
- `orbit/changes/rc02c-confirmation-semantics/.orbit-runs/` — the full
  iteration history: two proposal passes, two walks, two apply emits.

## Cycle context

- Iteration: **1** (first external review of this change, in any mode)
- Prior internal findings still open: **0.** Two proposal-mode passes ran — a
  clean-context `fresh` pass (6 CRITICAL / 8 WARNING / 3 SUGGESTION) and an
  `in-context` pass (0 CRITICAL / 5 WARNING / 2 SUGGESTION) — and both were
  walked to zero. Nothing is outstanding for you to inherit.
- Prior external findings still open: none — no external pass has run.
- Resolved since last review: 24 findings across two walks. The records are
  `address-reviews-2026-09-21T03-53-52Z.json` and
  `address-reviews-2026-09-21T04-08-27Z.json` if you want to see what was
  already answered; you are under no obligation to read them, and **re-finding
  something they resolved is useful signal, not noise.**

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What this change does

It retires two things from the gate engine:

1. **Clause (c)** — the independent-confirmation predicate. A `reviewed` gate
   used to pass only if the MOST RECENT independent review pass satisfied a
   `confirm` predicate (`no-new-findings` or `findings-resolved`). That clause
   is deleted. Convergence is now clauses (a) coverage and (b) resolution ONLY;
   the gate no longer computes whether a change has converged.
2. **The budget signal.** `budgetExhausted`, the `independentSpendFresh`
   trigger count, both `BUDGET-SPENT` position tokens and the
   `budget spent: N of M` clause in the gate's reason string are removed.
   `budget` stays in the schema grammar (no version bump) as an inert declared
   expectation; `independentSpend` survives as a recorded cost and now reports
   on gate MODE alone rather than on a declared budget being present.

`confirm` likewise stays accepted by the grammar and becomes inert.

## What to read for THIS review (--as system)

```
- orbit/changes/rc02c-confirmation-semantics/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff 800f33c..HEAD
  (800f33c = propose; 6d28a00 = the apply commit; ff17234 is SEPARATE
   instrument work, deliberately not part of this change — see below)
- orbit/specs/orbit-engine-gates/spec.md and orbit/specs/orbit-run-summary-emit/spec.md
  (archived baselines — for baseline-compliance and delta-fidelity checks)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md — ABSENT; skip with a note
- Code paths touched: src/core/artifact-graph/gates.ts,
  src/core/artifact-graph/instruction-loader.ts, src/core/artifact-graph/types.ts,
  src/core/artifact-graph/schema.ts, src/commands/workflow/status.ts,
  schemas/spec-driven/schema.yaml,
  test/core/artifact-graph/{gates,rc02-gate-semantics}.test.ts
```

Two commits in the range are deliberately NOT this change and should not be
judged as part of it, though noticing if that separation was drawn wrongly IS
in scope: `ff17234` (a fix to two `orbit-source-lint` test instruments that were
failing before this change) and `4ab8b7a` (architecture-doc amendments).

## What to look for

0. **verify-change-style structural check** — tasks done (18/18 claimed), spec
   coverage, design adhered. Run your own equivalent of a structural verify.
1. **Baseline Compliance** — does this change break any archived
   `orbit/specs/` requirement? The delta carries EIGHT MODIFIED requirements
   across two capabilities; each reproduces its baseline. **Check the
   reproduction, scenario by scenario.** The change claims every scenario it
   did not explicitly name is preserved byte-identically — a claim worth
   verifying mechanically rather than reading. A prior pass found three
   scenarios that were preserved in BODY while still ASSERTING retired
   behaviour; that class of defect is the one to hunt.
2. **Cohesion** — callers and dependents outside the tasks list. Deleted
   fields, signature drift, ripple effects. `budgetExhausted` and
   `independentSpendFresh` had consumers in two modules and two render sites;
   is the removal complete, and did anything that READ the trigger get
   re-pointed deliberately rather than defaulted to the surviving field?
3. **Surface Walk** — every CLI / public-function surface still coherent?
   `orbit status --change <name>` (human rows and `--json`), the position
   readout, the gate-status projection, `orbit instructions apply`. Does the
   JSON projection still carry what consumers expect, and is `budget` present
   only when declared?
4. **Perspective Reviews** — `orbit/lenses/perspectives.md` is absent; skip.
5. **Critical-Path Scan** — `orbit/lenses/critical-paths.md` is absent. Walk
   the real lifecycle instead: propose → review → address-reviews → apply →
   review(system) → archive, and ask what the gate now does at each seam.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence
   misses. `CLAUDE.md` and the architecture doc both described the retired
   signal in the present tense and were edited; check they are now correct and
   that nothing else still describes mechanism that no longer exists.

### Questions this change's own reasoning invites

Not a checklist — places where an independent reader may disagree with choices
already argued, which is exactly what a second opinion is for:

- **Does removing clause (c) strand a gate state?** The design claims the
  `confirmFailed` recommendation branch becomes unreachable and nothing is
  stranded. Verify or refute by reading `canonicalNextForReviewed`.
- **Is `stale` now over-reported?** Five archived changes moved from `unpassed`
  to `stale` under the new engine. The change argues this is clause (c)
  un-masking a staleness that was always true. Is that right, and is `stale`
  the correct state for a live change in that position?
- **Is an inert `confirm` a landmine?** It keeps two declared values that
  nothing reads. The change argues the version bump isn't worth it. Consider
  whether a schema author is now misled.
- **Does the record survive the deletion intact?** `independentSpend` must
  still count stale passes and rejected external returns, and must now report
  when no `budget` is declared. Test it.
- **Task 4.1 deliberately LEFT two schema-version pins** in example sentences
  (`orbit/specs/orbit-run-summary-emit/spec.md` line ~385 and
  `src/core/templates/workflows/apply-change.ts`) on the grounds that both are
  currently TRUE. Is that distinction sound, or is it a rationalisation?
- **The delta is ~62.7 KB against R-crc-1's ~40 KB ceiling** (recorded, with
  the argument that ~80% is mandatory MODIFIED reproduction). Is the
  measurement honest and the conclusion defensible?

## Output format — write to:

`orbit/changes/rc02c-confirmation-semantics/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02c-confirmation-semantics (iteration 1)

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
   git add orbit/changes/rc02c-confirmation-semantics/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc02c-confirmation-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
