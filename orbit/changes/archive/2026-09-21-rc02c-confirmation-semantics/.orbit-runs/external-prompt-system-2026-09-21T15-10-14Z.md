# External Review: rc02c-confirmation-semantics (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

**This is a SCOPED pass, not a repeat of iteration 1.** Iteration 1 reviewed the
whole change post-apply. Since then the authoring AI walked your findings and
the fresh half's, and that walk **authored new mechanism** — which nobody
independent has read. This pass has one question:

> **Does the walk's own mechanism hold?**

## Repo

https://github.com/las-sal/orbit-spec — branch `d-arc`, HEAD `51a4969`.

## The scope, exactly

```
git diff fbcee57..HEAD -- src/ test/ orbit/changes/rc02c-confirmation-semantics/specs/
```

Six files, 116 insertions / 38 deletions:

| File | What changed in the walk |
|---|---|
| `src/core/artifact-graph/gates.ts` | the `spendFields` **hoist** (see below); the passed-gate reason string; a vocabulary sweep across seven comments; `budgetFields`→`spendFields`, `blockedBudget`→`blockedSpend` |
| `src/core/artifact-graph/instruction-loader.ts` | `formatChangeStatus` row assembly changed from unconditional keys to **conditional spreads** |
| `src/core/artifact-graph/trail.ts`, `types.ts` | comment-only vocabulary |
| `test/core/artifact-graph/rc02-gate-semantics.test.ts` | one case corrected, two cases added |
| `specs/orbit-engine-gates/spec.md` | the normative rules behind the two engine changes, plus two new scenarios |

Everything outside that diff — the clause-(c) retirement, the budget demotion,
the archived-trail verdict work — you already reviewed at iteration 1 and it is
**not** in scope now. Read it only as context.

## Cycle context

- Iteration: **2** (second external pass; iteration 1 was yours)
- Prior external findings still open: **0.** Your eight from iteration 1 were
  all walked and resolved.
- Prior internal findings still open: **0.** A fresh clean-context pass (9) and
  an in-context pass (3) were also walked to zero.
- Resolved since your last review: 20 findings across two walks.

**Your iteration-1 findings are the reason this pass exists**, so you are not
blind to them and should not try to be. Two in particular became engine changes
whose correctness is now the question:

- You found `formatChangeStatus` reconstructing every row unconditionally,
  putting `budget` back as an undefined-valued key on the public object after
  `computeGateStates` had correctly omitted it. **The fix was conditional
  spreads.** Is the fix complete and correct at every row-producing path?
- You found the passed-gate reason still saying `converged with …`. **It now
  says `passed with …`.** Is anything — parser, test, golden, doc — still
  keyed on the old string?

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## The one change nobody independent has seen

A fresh reviewer found that a reviewed gate whose id yields no derivable mode
suppressed the `budget` **declaration** along with the recorded spend, because
both sat in one field bundle gated on `spendReportable` (`mode !== null`).
The authoring AI's argument for changing it was that the change elsewhere
condemns exactly this shape — *"a recorded cost that appears only when an inert
field happens to be present is incoherent"* — and this was that coupling from
the other side.

**The ratified fix hoists the declaration**: `budget` is emitted whenever
`gate.budget !== undefined`, independent of mode; only `independentSpend` stays
behind the mode check. Applied in **two** branches of `gates.ts` — the live
reviewed-status path and the blocked path.

This is a behavioural change to how gate status is assembled, made during a walk
and verified only by its own author. It is the single highest-value target in
this pass. Worth asking: is the two-branch implementation consistent? Is there a
third path that assembles a gate status? Does any consumer assume the two fields
travel together? Is the argument for hoisting actually sound, or does an
unattributable gate reporting a declaration it cannot contextualise mislead
worse than reporting nothing?

## What to look for

1. **Correctness of the three engine changes** — the hoist (both branches), the
   conditional spreads, the reason string. Construct trails and execute the
   engine; do not reason about it. This codebase's worst historical defects were
   rules that read correctly and computed wrongly.
2. **Completeness of the vocabulary sweep** — the walk swept `budget`-as-ceiling
   language as a CLASS across comments, spec prose, projections and types.
   Sweeps by class miss differently than sweeps by instance. Is anything left
   that still describes `budget` as bounding something, or clause (c) as live?
3. **Spec/code agreement on the NEW rules** — two normative rules were added
   (the JSON key-omission rule; the declaration-survives-mode-underivability
   rule) and two scenarios written for them. Do the scenarios assert what the
   code does? Do the rules contradict anything else in the requirement?
4. **The tests added and corrected** — one existing case asserted a property
   that no longer exists (vitest does not type-check, so it was green while
   covering nothing). Are the replacements actually covering the invariants they
   name, or do they have the same defect in a new place?
5. **Anything the walk broke** — 42 insertions and 24 deletions of engine code
   landed after your iteration-1 read. Callers, ripple, side effects.

**Explicitly NOT in scope**: re-reviewing the clause-(c) retirement, the budget
demotion, R-crc-1 size, the archived-trail verdict diff, or the change's records
and design prose. If something there is genuinely broken by the walk, say so —
but do not re-derive iteration 1.

## Practical notes

- CLI is `node bin/orbit.js` from the repo root.
- `npm test` is green at 2205; `node bin/orbit.js validate --all --strict` is
  clean at 26 items.
- `orbit/project.md`, `*_convention.md` and `orbit/lenses/` are **absent**; skip
  any pass depending on them with a note.

## Output format — write to:

`orbit/changes/rc02c-confirmation-semantics/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02c-confirmation-semantics (iteration 2)

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

**A clean result is a real result here.** This is a narrow verification pass over
a small diff. If the walk's mechanism holds, say so plainly with what you
executed to establish it — that is worth more than a manufactured finding, and
it is the evidence the change needs to archive honestly.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc02c-confirmation-semantics/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 2): rc02c-confirmation-semantics

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, just output the findings markdown in this chat,
state explicitly that you could NOT commit/push, and the user will commit it
manually.
