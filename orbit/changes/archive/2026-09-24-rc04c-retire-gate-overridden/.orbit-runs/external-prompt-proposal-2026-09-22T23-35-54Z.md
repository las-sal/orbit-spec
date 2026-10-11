# External Review: rc04c-retire-gate-overridden (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

Two more worth reading, because this change is a stage in a running program:

- `orbit/architecture/clean-up-review-cycle.md` — the program doc. This change is stage
  `rc04c`, and its charter there carries an explicit **NON-GOAL** that bounds the work.
  The `R-crc-*` rulings the artifacts cite also live there.
- `orbit/changes/rc04c-retire-gate-overridden/explore.md` — the exploration this was promoted
  from; seven dated decisions the artifacts cite by ID (`D-rc04c-1` … `D-rc04c-7`).

## Cycle context

- Iteration: 1 (first external review of this change, in either mode)
- Prior internal findings still open: **0**
- Prior external findings still open: 0 (none yet)
- Resolved since last review: **10**, from one fresh-class internal proposal pass
  (`.orbit-runs/review-proposal-2026-09-22T21-17-10Z.json`), walked to zero in
  `.orbit-runs/address-reviews-2026-09-22T23-25-59Z.json`. Summary of what that pass found,
  so you don't spend your pass re-finding it:
  - 3 CRITICAL — (a) the change's headline "totality" claim was specified in the engine and
    the specs but had no workflow-body task, leaving a body instruction that contradicted it;
    (b) the test-impact sizing named one site in a file holding five; (c) the new engine rule
    contradicted an unmodified baseline requirement's prose, which is now carried as a tenth
    MODIFIED requirement.
  - 4 WARNING — a proposal bullet describing the wrong capability's delta; a task ORDER that
    opened a mid-flight emit-refusal window; two live-engine-description passages left stale.
  - 3 SUGGESTION — an underspecified error message; a standing regression pin at risk of being
    silently dropped; a restated count that disagreed with its source.

  **Everything above is already fixed.** Treat it as the previous reviewer's territory, not
  as a checklist to re-verify — though if you think any fix is WRONG or incomplete, say so.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/rc04c-retire-gate-overridden/proposal.md
- orbit/changes/rc04c-retire-gate-overridden/design.md
- orbit/changes/rc04c-retire-gate-overridden/tasks.md
- orbit/changes/rc04c-retire-gate-overridden/specs/<capability>/spec.md (all three)
- orbit/changes/rc04c-retire-gate-overridden/explore.md
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks)
```

The three capabilities with deltas are `orbit-run-summary-emit` (4 requirements),
`orbit-archive-modifications` (4), and `orbit-emit-composition` (2) — ten MODIFIED
requirements in total, zero ADDED, zero REMOVED.

Because this change also plans engine and test work, these are worth reading even though the
change has not been applied yet:

```
- src/core/emit-composition.ts            (the engine: payload tables, validateJudgements,
                                           judgementOrderingCheck, the coexistence guard)
- src/core/templates/workflows/apply-change.ts, archive-change.ts, pr-choreography.ts
- test/core/emit-composition.test.ts, emit-schema-parity.test.ts,
  judgement-record-fixture.test.ts, templates/orbit-content-fidelity.test.ts
```

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

### Specific claims this change makes that are worth attacking

Stated as questions, not as hints about where the answers are:

- The change RETIRES a field (`gate_overridden`) whose successor record shipped in an earlier
  stage. Is the successor genuinely total over the old field's domain, end to end — engine,
  workflow bodies, and the schema references an AI reads while composing an emit?
- Five mentions of the retired field SURVIVE in the deltas deliberately, as prior-generation
  narration. Is that coherent? Is any of them actually normative?
- The change claims archived trails keep reading after the retirement. Does anything verify
  that, and does the verification survive the change's own test edits?
- The work is ordered across engine, bodies and tests. Is the stated order actually required,
  and is there a window in which a partially-applied change would refuse or corrupt an emit?
- The charter declares a vocabulary reframe a NON-GOAL. Do the artifacts respect that boundary,
  or does the retirement quietly widen into it?
- Requirement counts, occurrence counts and site counts appear throughout. Do they match the
  tree?

## Output format — write to:

`orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc04c-retire-gate-overridden (iteration 1)

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
   git add orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc04c-retire-gate-overridden

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
