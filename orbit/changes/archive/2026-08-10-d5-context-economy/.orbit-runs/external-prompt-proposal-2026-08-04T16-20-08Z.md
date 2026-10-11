# External Review: d5-context-economy (iteration 1)

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
- `orbit/architecture/d-arc-arbitered-flow.md` — the live program; this change is Stage d5
  (read the stage charter + rulings R-d-4/R-d-5/R-d-9 for intent)
- `orbit/changes/d5-context-economy/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first EXTERNAL review; this is pass 5 on the change's shared internal+external
  review axis — four internal passes precede you: fresh 2026-07-30 (20 findings), fresh
  2026-08-03 (15), in-context 2026-08-04 (4), fresh 2026-08-04 (7))
- Prior internal findings still open: 0 — all 46 findings across the four passes were resolved
  through three `address-reviews` walks (logs in `.orbit-runs/address-reviews-*.json`, each
  entry recording the resolution and any user-ratified decision)
- Prior external findings still open: none (no prior external pass)
- Resolved since last review: the fresh iter-4 pass's 7 findings (two baseline surface-count
  sweeps, the attestation membership criterion, `--doc` coverage, archive-dir resolution,
  payload-channel error paths, reviewer-class wording)

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

Vocabulary note you will need: this change RETIRES the standalone `/orbit:review-external`
command into `/orbit:review --reviewer external`, but deliberately FREEZES record vocabulary —
`command: "review-external"` emits, `review-external-<TS>.json` / `external-<as>-<TS>.md`
filenames, and archived-trail mentions are records, not drift. Flag live *invocation*
steering to the retired command; do not flag frozen record names or historical narrative.

## What to read for THIS review (--as proposal)

- orbit/changes/d5-context-economy/proposal.md
- orbit/changes/d5-context-economy/design.md
- orbit/changes/d5-context-economy/tasks.md
- orbit/changes/d5-context-economy/specs/<capability>/spec.md (every spec under specs/ — 12 capability dirs)
- orbit/changes/d5-context-economy/explore.md (and sketches/, notably sketches/body-inventory.md)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks; MODIFIED
  delta blocks replace whole baseline requirements at sync, so diff each block against its
  baseline requirement for silently dropped scenarios)

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

## Output format — write to:

`orbit/changes/d5-context-economy/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d5-context-economy (iteration 1)

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
   git add orbit/changes/d5-context-economy/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): d5-context-economy

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
