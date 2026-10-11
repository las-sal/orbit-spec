# External Review: explicit-lifecycle-consent (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/architecture/d-arc-arbitered-flow.md` — this change is **Stage D1 of the D-arc
  program**; the arc's D1 exit criteria are the change's acceptance tests, and rulings R-d-1..8
  constrain the design (esp. R-d-2, the harness-hooks deferral). Artifacts contradicting the arc
  are findings.
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/explicit-lifecycle-consent/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: 0 — two internal iterations are fully resolved:
  iter 1 (in-context, 6 findings incl. a CRITICAL scope miss: orbit-review's stock phrasings
  mandated the imperative `Next:` label the change prohibits → 6th capability delta added) and
  iter 2 (fresh-context, 3 findings incl. a CRITICAL scope miss: the `spec-driven v1 gates and
  cadence` baseline requirement pinned version 2 without `consent` → third MODIFIED block added;
  and a WARNING that an iter-1 resolution had silently failed to land — since verifiably landed).
  See `review-proposal-*.json` + `address-reviews-*.json`.
- Prior external findings still open: none (no prior external in this mode).
- Resolved since last review: all 9 internal findings across both iterations.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change does (orientation)

The consent/arbiter layer (D-arc Stage D1). Motivating incident: an AI session auto-ran the
entire lifecycle through archive + an unrequested PR because all of orbit's prompts are
anomaly-gated — the all-green path never asks the human, and the imperative `Next:` readout
reads as an instruction to a model. The change adds: a `consent: user-invoked` gate attribute in
the schema (spec-driven v3; engine parses + surfaces, never prompts); provenance-conditioned
consent AskUserQuestions in the apply/archive/bulk-archive workflow bodies (user-typed commands
NEVER prompt; AI-mediated arrivals ALWAYS do; uncertain → treat as AI-mediated); a no-chaining
contract in orbit-conventions (the AI recommends, never invokes); eligibility phrasing
(`Ready when you are:` replacing `Next:`, with a ` — user-invoked` marker on consent-marked
entries) across the engine and orbit-review's stock assessment phrasings; a flat
`consent: "user-invoked" | "prompted"` field on apply/archive emits; and an audit-drift tripwire
(WARNING on post-era emits missing the field) that is the named re-entry trigger for the
deferred harness-hooks enforcement.

## What to read for THIS review (--as proposal)

- orbit/changes/explicit-lifecycle-consent/proposal.md
- orbit/changes/explicit-lifecycle-consent/design.md
- orbit/changes/explicit-lifecycle-consent/tasks.md
- orbit/changes/explicit-lifecycle-consent/specs/<capability>/spec.md — every spec under specs/:
  orbit-lifecycle-consent (new), orbit-engine-gates, orbit-conventions,
  orbit-archive-modifications, orbit-run-summary-emit, orbit-audit-drift, orbit-review
- orbit/changes/explicit-lifecycle-consent/explore.md (the decision record, D-elc-1..10)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks; the six
  MODIFIED blocks should contain their current baseline requirements verbatim plus only intended
  edits)

Useful commands: `npm install && npm run build` (expect clean),
`node bin/orbit.js validate explicit-lifecycle-consent --strict`,
`node bin/orbit.js fingerprint explicit-lifecycle-consent --check` (expect 6/6 verified).

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

Probes two internal iterations may still have missed (independent take encouraged): remaining
un-delta'd baseline carriers of behavior this change prohibits or redefines (the two CRITICALs
so far were both this class); whether the provenance rule is implementable from spec text alone
(what a workflow body can actually observe); consent semantics under bulk-archive and sync
inheritance; whether the six MODIFIED blocks drifted semantically beyond their intended edits;
interaction of the `consent` attribute with gate normalization (the upstream `apply:` block) and
with superseded-gate rendering.

## Output format — write to:

`orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g. `2026-07-10T09-30-00Z`. Pick a
fresh timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: explicit-lifecycle-consent (iteration 1)

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
   is the immediately-visible read for the user. The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/explicit-lifecycle-consent/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): explicit-lifecycle-consent

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
