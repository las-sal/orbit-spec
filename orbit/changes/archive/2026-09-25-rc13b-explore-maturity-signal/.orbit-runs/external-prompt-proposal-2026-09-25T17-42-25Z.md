# External Review: rc13b-explore-maturity-signal (iteration 1)

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
- `orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: 0 — one fresh (clean-context) internal pass,
  `review-proposal-2026-09-25T15-54-12Z.json`, returned 2 CRITICAL / 11 WARNING / 5 SUGGESTION;
  all 18 were walked in `address-reviews-2026-09-25T16-05-42Z.json`.
- Prior external findings still open: 0 (none yet)
- Resolved since last review (the fresh pass's 18, by title): task 2.3's fixture counts vs the
  wrapped-opener rule (option A: the Decisions ID opener is a FIRST-LINE PREFIX match); the
  Unaccounted string's `K of R` counting MALFORMED orphans (K now counts live-rule states only;
  malformed in its own clause); byte-identical strings vs the appended record (now "byte-identical
  PREFIX"); the concluded row's `Ready when you are:` label (option A: the orientation sourcing
  requirement gains a concluded rule — the prose renders BARE); the opener rule stated in no
  production; duplicate Decisions IDs unspecified; `status.re_entry` with no or two live slots;
  a `status` that is not `{token: string}`; scenario titles naming the retired Mature rung; task
  2.2 missing two out-of-domain dispositions; task 4.3 naming artifacts that do not exist
  (deleted); four R-crc-14 restatements (now pointers); a design Risk claiming change-directory
  `explore.md` is never parsed (corrected); pluralisation; `rules_open` ordering; a handoff clause
  in baseline spec text; missing-file output; the design's task count.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/rc13b-explore-maturity-signal/proposal.md
- orbit/changes/rc13b-explore-maturity-signal/design.md
- orbit/changes/rc13b-explore-maturity-signal/tasks.md
- orbit/changes/rc13b-explore-maturity-signal/specs/<capability>/spec.md (every spec under specs/ — three: orbit-run-summary-emit, orbit-emit-composition, orbit-orientation)
- orbit/changes/rc13b-explore-maturity-signal/explore.md (if present — it is; its Mechanism section is the recorded mechanism, one entry per rule, and the Decisions carry dated AMENDED notes from the proposal walk)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks; the deltas MODIFY six requirement blocks across the three capabilities above and point at productions owned by orbit/specs/orbit-conventions/spec.md — "Decision entry identity and classification", "Mechanism entry grammar and accounted closure", "`explore.md` five-section format", "Concluded exploration outcome" — and by orbit/specs/orbit-explore-modifications/spec.md)
```

Worth reading beside the artifacts, because the deltas make claims about current code: `src/core/parsers/explore-counter.ts` (the shipped maturity grid), `src/core/emit-composition.ts` (the `explore` case, `validatePayload`, `ENGINE_OWNED_EXTRA`), `src/core/orientation.ts` (the explore branch: `composeExploreStrip`, the position literal, the emit-record validation), `src/commands/workflow/status.ts` (`renderNextLine`), `src/core/templates/workflows/explore.ts` (the body's mirrored productions), `test/core/templates/orbit-generated-surface.test.ts` (the grammar regexes and the mirror parity test), `test/core/templates/skill-templates-parity.test.ts` (the hash pin the change claims will not move). The program doc's stage section is `### Stage rc13b-explore-maturity-signal` in `orbit/architecture/clean-up-review-cycle.md` (its three exit criteria are what the tasks must make measurable). Two archived fixtures the change names: `orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` (task 2.3 asserts 12 decisions / 9 live / 9 accounted / 0 malformed / 1 residual under the first-line-prefix opener rule — three of its openers wrap) and the two exemplar Mechanism entries inside the generated explore skill body.

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

Places a prior pass found the mechanism weakest, if you want somewhere to start: the JOIN between the Decisions side and the Mechanism side of the form parse (the nine `rules_open` states, the opener rule, duplicate IDs, orphans, the array order); whether a parser can be written from the emit-composition delta's text ALONE; whether every MODIFIED block preserves every baseline scenario (diff against the baseline); whether the orientation delta honours the bare-status requirement's closed data-source list and the fault-isolation rules by reading `status` from the newest emit; whether "one grammar module, byte-identical interpolation, hash pin unchanged" is actually achievable given how `explore.ts` renders; whether any delta RESTATES a rule owned elsewhere (the program's R-crc-14: state once, point); and whether the stage's three exit criteria are measured by what the tasks build.

## Output format — write to:

`orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc13b-explore-maturity-signal (iteration 1)

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
   git add orbit/changes/rc13b-explore-maturity-signal/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc13b-explore-maturity-signal

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
