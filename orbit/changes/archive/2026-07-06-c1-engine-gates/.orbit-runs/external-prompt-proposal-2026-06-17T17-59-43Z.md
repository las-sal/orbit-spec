# External Review: c1-engine-gates (iteration 2)

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
  already been addressed in prior cycles (one internal proposal review + two
  address-reviews resolution runs + one prior external proposal review so far)

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

- Iteration: 2 (second external review for this change in proposal mode; iter 1
  was GPT-5 Codex)
- Prior internal findings still open: **0**. An internal proposal review
  (`review-proposal-2026-06-13T00-38-15Z.json`) found 2 CRITICAL / 7 WARNING /
  2 SUGGESTION; all 11 were resolved by `address-reviews-2026-06-16T16-24-44Z.json`
  (0 deferred, 0 escalated).
- Prior external findings still open: **0**. Iter 1 (GPT-5 Codex,
  `external-proposal-2026-06-17T13-41-06Z.md`) found 0 CRITICAL / 2 WARNING /
  0 SUGGESTION; both were resolved by `address-reviews-2026-06-17T17-52-12Z.json`
  (0 deferred, 0 escalated).
- Resolved since last external review (the 2 iter-1 external warnings —
  verify they actually landed and didn't introduce new inconsistencies):
  - **W1** — the proposal's high-level "Computed review convergence" bullet
    (`proposal.md`) stated the pre-remediation convergence rule (cadence as a
    class set; no per-gate `confirm` predicate). It was rewritten to state
    ordered cadence slots + the per-gate `confirm` predicate
    (`review-proposal: no-new-findings`; `review-system: findings-resolved`),
    matching `specs/orbit-engine-gates/spec.md`, `design.md`, and `tasks.md`.
  - **W2** — the inflection-prompt override field `gate_overridden`
    (`{gate, state, reason}`) was specified in `orbit-engine-gates` but NOT
    wired into the enumerated run-summary field-list contracts an implementer
    follows. Three MODIFIED deltas were added:
    `orbit-run-summary-emit` → `Apply per-chunk-end emission` (apply emit gains
    the conditional field); `orbit-archive-modifications` →
    `Archive run summary written` + `Archive summary schema reference ships with
    the skill` (archive summary + its reference doc document the field). The
    field is present only on proceed-anyway, absent otherwise. `tasks.md` 5.3
    and the `proposal.md` Modified-Capabilities list were updated to match.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/c1-engine-gates/proposal.md
- orbit/changes/c1-engine-gates/design.md
- orbit/changes/c1-engine-gates/tasks.md
- orbit/changes/c1-engine-gates/specs/<capability>/spec.md (every spec under specs/ —
  there are 6: orbit-engine-gates, orbit-review, orbit-review-external,
  orbit-run-summary-emit, orbit-conventions, orbit-archive-modifications)
- orbit/changes/c1-engine-gates/explore.md (the D-c1-* decisions — authoritative)
- orbit/specs/<capability>/spec.md (the archived baselines — for delta consistency
  checks; the MODIFIED deltas above must faithfully reproduce + extend their
  baseline requirements)

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate c1-engine-gates --strict` would pass. For each MODIFIED requirement, the delta reproduces the full baseline requirement body (sync-specs replaces baseline wholesale — a partial body silently drops content).
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency (capability counts, MODIFIED/ADDED tallies). No scope creep. **Pay special attention to the iter-1 remediations**: does the rewritten convergence bullet in `proposal.md` exactly match the `Reviewed-gate pass condition` requirement in `specs/orbit-engine-gates/spec.md`? Is `gate_overridden` consistent across `orbit-engine-gates`' override contract, the three MODIFIED field-list deltas, `tasks.md` 5.3, and the `proposal.md` capability list?
3. **Cross-Doc Coherence** — `CLAUDE.md` still accurate after this change (baseline capability count, phase status).
4. **Archive Consistency** — ADDED don't contradict baseline; the MODIFIED deltas don't contradict the baseline requirements they extend; REMOVED (if any) not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity. Could the gate state machine (ordered-slot coverage, freshness, per-gate `confirm`) be implemented from the spec alone without inventing semantics?
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions (blocked/ready/passed/stale/unpassed)? Edge cases in the freshness rule and class-coverage ordering?
7. **Drift Hunt** — old vocabulary lingering (e.g. residual "cadence-required reviewer class" / class-set framing, advertised skip paths); consistency with the single-voiced-recommendation contract.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## Output format — write to:

`orbit/changes/c1-engine-gates/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format, hyphenated, e.g.
`2026-06-18T09-15-00Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews — in particular do NOT reuse `2026-06-17T13-41-06Z` from iter 1.)

Use this exact markdown structure:

```markdown
# External Review: c1-engine-gates (iteration 2)

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
   git commit -m "External review (proposal, iter 2): c1-engine-gates

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   State your findings commit/push in chat (`Findings committed (<short-sha>)
   and pushed`) — or state that you couldn't.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above) and the user will commit it manually.
