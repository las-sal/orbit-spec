# External Review: rc04d-override-vocabulary (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **post-apply system review**. All 14 tasks are complete. Note the unusual
shape: this change touches **NO `src/` and NO `test/` files at all** — that is not an
oversight, it is the stage's central claim and one of its exit criteria. Everything it
ships is FIVE RE-WORDED SENTENCES across three baseline capability specs.

## Repo

https://github.com/las-sal/orbit-spec — branch `d-arc`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the live program; read the stage
  declarations for `rc04d-override-vocabulary` AND `rc04c-retire-gate-overridden`,
  and the R-crc rulings index (especially R-crc-1 the size ceiling, R-crc-9 split-or-block,
  R-crc-10 mechanize-only-the-observable)
- `orbit/project.md`, root `*_convention.md`, `orbit/lenses/` — ABSENT in this repo; skip with a note
- `orbit/changes/rc04d-override-vocabulary/.orbit-runs/` — the full cycle history

## Cycle context

- Iteration: 1 (first external review for this change, in any mode)
- Prior internal findings still open: **0**. Two internal proposal passes ran and both were
  fully walked — a `fresh` clean-context pass (1 CRITICAL / 3 WARNING / 3 SUGGESTION) and an
  `in-context` pass (0 CRITICAL / 1 WARNING / 2 SUGGESTION). All 10 resolved, none deferred.
- Prior external findings still open: none (no prior external review).
- Resolved since last review: the fresh pass's CRITICAL found that this change's one
  substantive edit named the WRONG capability as owner of a record's shape for half of the
  edited requirement's domain. It was fixed by naming two owners. The in-context pass then
  found that the fix had not been carried into `proposal.md` and `design.md`'s Goals.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What this change does

`gate_overridden` is a payload field recorded when a user proceeds past a gate that said no.
A sibling stage (`rc04c-retire-gate-overridden`) will RETIRE that field. Three baseline
capabilities currently name the field while asserting only that *an override is recorded* —
they do not depend on its shape. This stage re-words those five requirement texts so they
describe the override generically.

The ORDER is the whole point of the split: de-named FIRST, there is never a moment when a
spec normatively demands a field nothing writes. Retired first, the interim state leaves
three capabilities requiring a record the emit layer has already refused.

Four of the five sites are plain substitutions. The fifth —
`orbit-engine-gates` :: `Inflection-prompt override contract` — additionally MOVES OWNERSHIP
of the record's shape to the emitting command's own capability, because that requirement
currently restates `{gate, state, reason}`, a shape another capability owns.

## What to read for THIS review (--as system)

```
- orbit/changes/rc04d-override-vocabulary/proposal.md, design.md, tasks.md, specs/, explore.md
- The change's commit range: git log/diff for orbit/changes/rc04d-override-vocabulary/
- orbit/specs/orbit-engine-gates/spec.md, orbit-pr-lifecycle/spec.md, orbit-conventions/spec.md
    (the live baselines the deltas MODIFY — compare scenario by scenario)
- orbit/specs/orbit-run-summary-emit/spec.md and orbit-archive-modifications/spec.md
    (the two capabilities the new ownership clause POINTS AT — verify the pointer is true)
- src/core/emit-composition.ts, src/core/templates/workflows/{apply-change,archive-change,pr-choreography}.ts
    (the BEHAVIOUR each re-worded sentence claims to describe)
- orbit/lenses/ — ABSENT; skip passes 4 and 5 with a note
```

## What to look for

0. **verify-change-style structural check** — 14/14 tasks claimed; spec coverage; design adhered. Run your own equivalent.
1. **Baseline Compliance** — all three deltas are MODIFIED blocks that must reproduce their live baselines exactly apart from the named substitutions. **Verify this MECHANICALLY, scenario by scenario** — this repo's characteristic defect is a MODIFIED block silently dropping baseline scenarios, and neither `validate --strict` nor `base_fingerprints` can catch it. The authoring claim is 27 scenarios preserved, 0 dropped.
2. **Cohesion** — nothing in `src/` changed. Is that actually right? Does any code, body, or test depend on the SPEC wording that changed?
3. **Surface Walk** — the five re-worded requirements are normative. Does any re-wording change what an implementer would build?
4. **Perspective Reviews** — lens files absent; skip.
5. **Critical-Path Scan** — lens files absent. Instead walk the override lifecycle: a user hits Proceed-anyway at apply, and at archive, and ask whether each re-worded requirement still describes what happens.
6. **Drift / Residue** — vocabulary residue, stale references, cross-artifact contradiction.

### Claims worth attacking

Stated so you can try to break them, not so you accept them:

- **"Every de-named form is TRUE OF THE ENGINE AS IT STANDS TODAY."** This is the load-bearing
  claim and the thing most worth your time. For each of the five replacements, compare the new
  wording against what the code and workflow bodies ACTUALLY do — not against its predecessor's
  wording. Does any substitution lose precision, widen a SHALL, narrow it, or become ambiguous?
- **The ownership pointer.** The new clause says the record's shape is owned by
  "the EMITTING COMMAND'S OWN CAPABILITY — `orbit-run-summary-emit` for the apply emit,
  `orbit-archive-modifications` for the archive emit". Is that true of BOTH? Is it COMPLETE —
  can any third command carry this field? An earlier version of this clause named only one
  owner and was wrong; the fix may be wrong in a new way.
- **"NO `src/` and NO `test/` change"** is exit criterion (2) and is claimed as verified.
  Check it yourself against the change's full diff.
- **The interim state is harmless.** After this stage, specs describe the override generically
  while workflow bodies still name `gate_overridden`. The claim is that no instrument couples
  spec wording to body wording. Is that true?
- **The stage is correctly scoped at 3 capabilities / 5 requirements.** Is any OTHER requirement
  anywhere left describing the override in a way that now contradicts the new wording?
- **`rc04c` inherits a clean handoff.** Tasks 3.1–3.4 record what the sibling stage must know.
  Is anything it will need missing or wrong?

## Output format — write to:

`orbit/changes/rc04d-override-vocabulary/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc04d-override-vocabulary (iteration 1)

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
   `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc04d-override-vocabulary/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc04d-override-vocabulary

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, just output the findings markdown in this chat,
state explicitly that you could NOT commit/push, and the user will commit it
manually.
