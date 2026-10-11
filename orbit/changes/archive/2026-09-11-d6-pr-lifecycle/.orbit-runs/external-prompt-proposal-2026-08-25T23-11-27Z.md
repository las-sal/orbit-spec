# External Review: d6-pr-lifecycle (iteration 3)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git (branch `d-arc`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/d6-pr-lifecycle/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

### What this change is

Stage D6 of the architecture program `orbit/architecture/d-arc-arbitered-flow.md`.
It adds a **pull-request lifecycle layer** to orbit's spec-driven flow. A DRAFT PR
opens during `/orbit:propose`. `/orbit:archive` grows a **tail** — a read-only PR
preflight, then commit → push → PR-description rewrite → `gh pr ready` — that runs
after the archive's existing sync/move/emit work. A single config scalar
`pr: never | per-proposal | per-architecture` selects the regime; a change's
`architecture:` citation selects its target within `per-architecture` (cited changes
share one program branch with a single program PR — "Shape A"; uncited changes fall
back to their own branch and PR).

Standing constraints — each user-ratified. Do NOT flag these as defects:

- **Single user, single session.** Concurrency support (locking, serialization,
  optimistic retry, conflict-merge) is an explicit NON-GOAL. Detection of a diverged
  state is in scope; protocols are not.
- **Zero engine git** — every git/`gh` action is a workflow-BODY step (instructions in
  generated skill bodies), never engine TypeScript. The engine's only surface is the
  `pr:` config reader and emit payload fields.
- **Merging stays a human act.** READY is the terminus.
- **Recommend, never invoke** — orbit bodies never auto-chain lifecycle commands.
- Proposal stage: ZERO tasks are implemented. Do NOT flag missing source code or
  unchecked tasks. You are reviewing the SPECIFICATION.

## Cycle context

- Iteration: **3** (third EXTERNAL pass; six review passes total have run)
- Prior internal findings still open: **0**
- Prior external findings still open: **0**
- **71 findings across six passes, all resolved, none ever re-raised.**

Pass history (severity mix): 3C/10W/4S → 5C/9W/3S → 1C/9W/2S → 4C/8W/2S →
0C/4W/1S → 0C/2W/4S. The last two passes found zero CRITICALs.

Each pass has identified a different dominant defect pattern, and each was closed:

1. **Representation** — records that could not express what the flow needed (the flat
   PR fields became a structured `pr_attachment` object).
2. **Seam asymmetry** — propose and archive each borrowing the other's unstated half
   (remote/default-branch resolution was hoisted into one shared requirement both cite).
3. **Fallback-vs-primary** — every protection guarded the fallback discovery path while
   the stored record, which is what is actually used, was trusted end to end (stored
   URLs are now validated live against the same four predicates).
4. **Boundary** — what counts as "the archive flow" (bulk-archive is now declared out of
   the tail's scope; the move's deletion is staged alongside its addition).

**Resolved themes — do NOT re-report these:** the structured `pr_attachment` record and
its gate-validated structure; `/orbit:ff` parity with propose; the four-axis constrained
discovery query with distinct zero/ambiguous/error outcomes; live validation of stored
URLs with the failure scoped to PR-writing steps; the read-only pre-emit preflight and
observed-not-predicted `pr_state`; the idempotent flip for an already-READY PR;
HEAD-branch precondition with per-case recovery text; `gh` availability as a pre-staging
precondition; attachment authority over live config at archive; the shared remote and
default-branch resolution requirement with `--repo` on every `gh` call; enumerated commit
scopes at both seams; the moved-archive-directory prefix exception; the move's deletion;
bulk-archive out of tail scope; consent-preview naming outward writes; the integration
harness (`test/integration/pr-lifecycle/`); `git check-ref-format` validation;
non-scalar config inertness; remote-only branch tracking; URL-bearing selection for the
arc-done lookup; `merge-base` shared-ancestry with continue-on-base-ahead; the
unconditional idempotent arc-done readout; the R-d-4 subtraction exception; the
single-session non-goal.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/d6-pr-lifecycle/proposal.md
- orbit/changes/d6-pr-lifecycle/design.md
- orbit/changes/d6-pr-lifecycle/tasks.md
- orbit/changes/d6-pr-lifecycle/specs/<capability>/spec.md (all seven)
- orbit/changes/d6-pr-lifecycle/explore.md (decision record, incl. its dated
  "Post-promotion revisions" subsection)
- orbit/specs/<capability>/spec.md (live baselines — MODIFIED blocks must reproduce the
  FULL baseline requirement, since they replace it wholesale at archive; a dropped
  scenario is silent data loss)
```

Structural notes: `orbit-pr-lifecycle` is a NEW capability with no baseline. The change
carries **18 requirement blocks across 7 capabilities** — 14 ADDED, 4 MODIFIED (the four
MODIFIED are `orbit-archive-modifications`' `Consent prompt on AI-mediated archive entry`
and `Archive run summary written`, `orbit-emit-composition`'s `Generic emit surface with a
narrative-only payload contract`, and `orbit-onboard`'s `Canonical-flow walkthrough
section`; each is fingerprinted).

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — `CLAUDE.md`, `project.md`, `*_convention.md` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; MODIFIED reproduce their baseline faithfully (diff them); REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with `*_convention.md`.
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d6-pr-lifecycle (iteration 3)

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
   content as the file: every severity section, every `### Title` entry, every
   `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize —
   the chat output is the immediately-visible read for the user. The file
   remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/d6-pr-lifecycle/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 3): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
