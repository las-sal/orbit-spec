# External Review: c1-engine-gates (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git

**Check out the `c1-engine-gates` branch** — this change lives there, not on
`main`. After cloning/pulling: `git checkout c1-engine-gates`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read this first; it explains the fork, the
  6-phase plan, and that C1 is the first net-new C-arc change)
- `orbit/project.md` — project goals + stack (NOT present in this repo; skip)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (NOT
  present; skip)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (NOT
  present; skip)
- `orbit/changes/c1-engine-gates/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (one internal proposal review +
  one address-reviews resolution run so far)

## Background you need (this is a fork)

orbit-spec is a self-contained hard fork of `@fission-ai/openspec@1.3.1`. The
engine lives in `src/core/artifact-graph/` (~1,150 lines); today completion is
monotonic file-existence and the only non-artifact phase is `apply`. **C1 makes
the engine review-aware**: it generalizes the singular `apply` phase into N
**gates** with a closed two-kind set (`tracked` = checkbox arithmetic;
`reviewed` = a computed review-convergence criterion), a prescribed review
cadence living in the schema YAML, gate state as a pure function of the
`.orbit-runs/` audit trail (no new state files), single-voiced recommendations,
position readouts, and external-handoff attestations. The design decisions
(D-c1-1..D-c1-9) are in `orbit/changes/c1-engine-gates/explore.md` and are
authoritative. The deep architecture map is
`orbit/architecture/openspec-1.3.1-architecture.md`.

This is a **proposal-mode** review: the change has NOT been implemented yet
(`tasks.md` is all unchecked). Review the artifacts for internal coherence and
codegen-readiness, not code-vs-spec.

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: **0**. An internal proposal review
  (`review-proposal-2026-06-13T00-38-15Z.json`) found 2 CRITICAL / 7 WARNING /
  2 SUGGESTION; all 11 were resolved by `address-reviews-2026-06-16T16-24-44Z.json`
  (0 deferred, 0 escalated). The resolutions touched the artifacts you're about
  to read — so you're reviewing the post-remediation state.
- Prior external findings still open: none (first external pass).
- Resolved since last review (the 11 internal findings, summarized — verify they
  actually landed and didn't introduce new inconsistencies):
  - Added a per-gate `confirm` predicate (`no-new-findings` | `findings-resolved`)
    to reconcile the convergence criterion's clause (c) with the system gate's
    "PASSED" phrasing (a first external pass whose findings are resolved must
    converge).
  - Redefined cadence class-coverage as **ordered slots** (each slot needs a
    fresh pass with a strictly-later token than the prior slot) so the trailing
    `in-context` confirm is meaningful.
  - Documented the v1 freshness scope limitation (proposal passes can't go stale
    in v1 because the only artifact-changing event is `apply-*.json`).
  - Defined the cadence-entry vocabulary and legal `before:` targets (incl.
    `archive` has no `instructions` phase; queried via `status --json`).
  - Excluded packaged-but-unreturned externals (`awaiting_findings: true`) from
    class coverage.
  - Added two new MODIFIED deltas — `orbit-conventions` and
    `orbit-archive-modifications` — reconciling baseline "advisory, not a gate"
    and "archive proceeds without prompting" language with the gate model.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- `orbit/changes/c1-engine-gates/proposal.md`
- `orbit/changes/c1-engine-gates/design.md`
- `orbit/changes/c1-engine-gates/tasks.md`
- `orbit/changes/c1-engine-gates/specs/<capability>/spec.md` (every spec under
  `specs/` — there are 6: `orbit-engine-gates` [ADDED capability],
  `orbit-review`, `orbit-review-external`, `orbit-run-summary-emit`,
  `orbit-conventions`, `orbit-archive-modifications` [all MODIFIED])
- `orbit/changes/c1-engine-gates/explore.md` (the D-c1-* decisions — authoritative)
- `orbit/specs/<capability>/spec.md` (the live baselines — for delta-consistency
  checks; especially `orbit-conventions`, `orbit-archive-modifications`,
  `orbit-review`, `orbit-review-external`, `orbit-run-summary-emit`, and confirm
  the MODIFIED deltas reproduce each baseline requirement faithfully)

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED
   deltas valid; `orbit validate --strict` would pass (it does locally — look for
   anything that should fail it but doesn't). For each MODIFIED requirement,
   confirm the delta reproduces the FULL baseline requirement (OpenSpec merges by
   requirement name — a partial reproduction silently drops scenarios).
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns
   with tasks. Count/label consistency (e.g. "1 ADDED + 5 MODIFIED",
   "11 baseline → 12"). The per-gate `confirm` field must appear consistently
   across the engine-gates spec, the design schema block, and tasks. No scope creep.
3. **Cross-Doc Coherence** — does `CLAUDE.md` need updating (it currently says
   "Next: C1" and describes 11 baseline capabilities)? Are the D-c1-* decisions in
   `explore.md` consistent with what the specs now say after remediation?
4. **Archive/Baseline Consistency** — the MODIFIED deltas must not contradict
   parts of their baselines they don't intend to change; the new gate model must
   not contradict any OTHER baseline requirement left untouched (the internal
   review caught two such contradictions — are there more? e.g. check
   `orbit-review`'s other requirements, `orbit-verify-change`, `orbit-apply-change`,
   `orbit-run-summary-emit`'s apply/archive emit requirements).
5. **Codegen Readiness** — could a fresh AI implement the engine from these specs
   alone? The convergence criterion (ordered slots + per-gate `confirm` + the
   freshness rule + legacy-class inference) is the highest-risk area — is every
   term computable from `.orbit-runs/` without judgment? Any decision left to the
   implementer that the spec should pin?
6. **Gap Hunt** — unstated assumptions, error paths, edge cases. Specifically:
   what happens when cadence slots can't be ordered (same-second tokens)? When a
   gate `requires` another gate that is stale? When `inputs` differs from
   `requires`? Is the `apply:`→`tracked`-gate normalization fully specified
   (double-declaration, validation)?
7. **Drift Hunt** — vocabulary residue, stale references; any place still saying
   "advisory, not a gate" / "3 MODIFIED" / "without prompting" unscoped.
8. **Inline Review Marker Residue** — any `@review:` markers still present
   anywhere in the change (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before this proposal goes to
   `/orbit:apply`? Is the chunked migration plan (4 chunks in `tasks.md`)
   coherent and independently landable?

## Output format — write to:

`orbit/changes/c1-engine-gates/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-06-16T19-30-00Z`.
Pick a fresh timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: c1-engine-gates (iteration 1)

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
   git add orbit/changes/c1-engine-gates/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): c1-engine-gates

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state that you could NOT commit/push, and
the user will commit it manually.
