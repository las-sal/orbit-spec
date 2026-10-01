# External Review: rc15-ended-stage-state (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc15-ended-stage-state/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles
- `orbit/architecture/clean-up-review-cycle.md` — the program doc; this change is its
  Stage `rc15-ended-stage-state` (read the stage section and open question Q-crc-11)

## Cycle context

- Iteration: 1 — first external review for this change in proposal mode
- Prior internal findings still open: none (no internal proposal-mode review has run on this change)
- Prior external findings still open: none
- Resolved since last review: n/a

What the change is, in one paragraph: the architecture-doc stage grammar has two `Complete:`
productions (`[ ]` and `[x] <date> (<who>)`) where the program has three states. A stage that
ended without meeting its exit criteria renders "awaiting your ratification" forever, and a stage
cited only by a CONCLUDED exploration renders `exploring` because the state reader never reads the
exploration's status header. The change adds a third production `Complete: [~] <date> (<who>)`, a
fifth observed state `concluded` read from the header, one composition table over five observed
states × three marks, two rendered states (`ended`, `ended-from-explore`), a third answer on the
architect's ratification offer, an emit field, and one sentence in audit-drift. The mechanism was
settled in `explore.md` as decision tables before any artifact was generated; the specs restate
those tables. Two places worth probing hardest: every cell of the composition table (is any cell
wrong, and is the `[x]` column truly unchanged from the baseline requirement?), and the near-miss
set for the new production (what `Complete:`-prefixed line could parse as something it is not?).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/rc15-ended-stage-state/proposal.md
- orbit/changes/rc15-ended-stage-state/design.md
- orbit/changes/rc15-ended-stage-state/tasks.md
- orbit/changes/rc15-ended-stage-state/specs/orbit-architecture-engine/spec.md
- orbit/changes/rc15-ended-stage-state/specs/orbit-architect/spec.md
- orbit/changes/rc15-ended-stage-state/specs/orbit-audit-drift/spec.md
- orbit/changes/rc15-ended-stage-state/explore.md (the exploration record; the Mechanism section
  carries the decision tables the specs restate)
- orbit/specs/orbit-architecture-engine/spec.md, orbit/specs/orbit-architect/spec.md,
  orbit/specs/orbit-audit-drift/spec.md (the baselines the MODIFIED blocks replace — diff them)
- orbit/specs/orbit-orientation/spec.md (the WAITING-set requirement the change claims is unchanged
  by construction — check the claim)
- orbit/specs/orbit-conventions/spec.md (the status-header production the state reader consumes)
- The engine the tasks name: src/core/architecture/{parser,state,buckets}.ts,
  src/core/parsers/explore-rules.ts, src/core/explore-grammar.ts, src/core/orientation.ts,
  src/core/emit-composition.ts; the bodies src/core/templates/workflows/{architect,audit-drift}.ts;
  the tests test/core/architecture/{engine,live-arc}.test.ts

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

`orbit/changes/rc15-ended-stage-state/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc15-ended-stage-state (iteration 1)

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
   git add orbit/changes/rc15-ended-stage-state/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc15-ended-stage-state

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
