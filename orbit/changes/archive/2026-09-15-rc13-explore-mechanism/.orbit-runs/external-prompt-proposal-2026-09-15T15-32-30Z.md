# External Review: rc13-explore-mechanism (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`

## Project context (read first)

- `CLAUDE.md` — handoff orientation
- `orbit/architecture/clean-up-review-cycle.md` — the live program. Read the stage sections for
  `rc13-explore-mechanism` (retained, carries the problem and the evidence),
  `rc13a-explore-mechanism-convention` (THIS change's stage) and `rc13b-explore-maturity-signal`,
  plus rulings R-crc-1 through R-crc-9.
- `orbit/changes/rc13-explore-mechanism/.orbit-runs/` — iteration history; see what has already
  been addressed in prior cycles.
- (`orbit/project.md`, root `*_convention.md`, and `orbit/lenses/` do not exist in this repo.)

## Cycle context

- Iteration: 1 (first EXTERNAL review of this change; third pass on the shared axis)
- Prior internal findings still open: 0. Two fresh internal passes ran — 23 findings then 25,
  ZERO repeats between them — and both were fully walked. Their emits and walk logs are on the
  trail if you want them.
- Prior external findings still open: none in proposal mode.
- Resolved since: the change was DESCOPED between pass 2 and now. It was rc13 (three capabilities,
  convention + engine enforcement); it is now rc13a (two capabilities, convention + the
  machine-readable FORMAT only). The maturity-signal half is stage rc13b and `Depends-on` this one.
  That split was made under ruling R-crc-9 and is the single largest thing to judge.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- `orbit/changes/rc13-explore-mechanism/proposal.md`
- `orbit/changes/rc13-explore-mechanism/design.md`
- `orbit/changes/rc13-explore-mechanism/tasks.md`
- `orbit/changes/rc13-explore-mechanism/specs/orbit-conventions/spec.md` (MODIFIED delta)
- `orbit/changes/rc13-explore-mechanism/specs/orbit-explore-modifications/spec.md` (2 ADDED + 3 MODIFIED)
- `orbit/changes/rc13-explore-mechanism/explore.md` — ten worked cases; 6, 7, 8, 9 and 10 are load-bearing
- `orbit/specs/orbit-conventions/spec.md` and `orbit/specs/orbit-explore-modifications/spec.md` —
  the baselines the MODIFIED blocks must carry in full
- `orbit/specs/orbit-run-summary-emit/spec.md` and `orbit/specs/orbit-emit-composition/spec.md` —
  NOT modified by this change; check whether that is actually true after the descope
- The code the artifacts make claims about: `src/core/templates/workflows/explore.ts`,
  `src/core/parsers/explore-counter.ts`, `src/core/emit-composition.ts`

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED valid; `orbit validate --strict` would pass. **Each of the four MODIFIED blocks must carry its baseline requirement's FULL text** — diff every one line-by-line; a dropped scenario or silently altered prose is CRITICAL.
2. **Internal Coherence** — proposal vs design vs specs vs tasks. Count and label consistency. This change has been rewritten three times; look for survivors of the earlier shapes (it used to say "six moves", then "eight", and used to include a maturity-rung requirement that is now rc13b's).
3. **Cross-Doc Coherence** — does the change satisfy `rc13a`'s three exit criteria as written in the arc doc? Is CLAUDE.md still accurate?
4. **Archive Consistency** — ADDED requirements don't contradict baseline; MODIFIED text is faithfully carried.
5. **Codegen Readiness** — could a fresh implementer build this from the specs alone? The central deliverable is a FORMAT (a decision-ID slot, a `Domain:`/`Closure:`/per-move entry shape, a `Disposition:` vocabulary). Is it specified precisely enough that a parser could be written against it by someone who has not read this conversation?
6. **Gap Hunt — press hardest here.**
   - The move set is NINE, declared **BOUNDED**. Its residual claims to state how the set grows and a test separating "a missing move" from "outside the set's domain". **Try to find a TENTH class**: a way a mechanism can be wrong that lands outside all nine. The record to classify against is in `explore.md` Cases 1, 7 and 10 (two prior stages' CRITICALs). Three prior attempts at closing this set were each falsified by classifying one more record.
   - The rule test is "a Decision is a RULE iff it has a DOMAIN OF SITUATIONS", applied PER CLAIM. Find a Decision in `explore.md` that this test classifies wrongly in either direction.
   - Closure has three forms (DERIVED / SOURCED / BOUNDED) and the taxonomy declares itself BOUNDED. Is that honest or circular?
   - The change asserts it touches exactly two capabilities. Verify that — a prior pass found it was silently four wide.
   - Does anything in the change still require an engine change? It claims none.
7. **Drift Hunt** — vocabulary residue from the abandoned shapes; consistency with the rulings.
8. **Inline `@review:` marker residue** — any left in the change directory?
9. **Pre-Handoff Sweep** — anything else before this goes to apply.

## Output format — write to:

`orbit/changes/rc13-explore-mechanism/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc13-explore-mechanism (iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

## Notes

<Optional — rendered VERBATIM into the report's Commentary slot: the pattern behind the findings,
what you probed, risk texture. Do NOT state finding counts, gate verdicts, or next commands.>
```

Every finding needs the `### Title` / `**File**:` / `**Description**:` triple — the ingesting
parser requires all three. Use `None.` as a single-word body if there are no findings at a severity.

If your environment doesn't support file writes, output the markdown directly and the user will
save it.

## After completing the review

1. **Output the full findings markdown in chat** as well as writing the file — every severity
   section, every entry, every field. Do not abbreviate; the chat output is what the user reads.
2. **Commit and push the findings file** if your environment supports git.
