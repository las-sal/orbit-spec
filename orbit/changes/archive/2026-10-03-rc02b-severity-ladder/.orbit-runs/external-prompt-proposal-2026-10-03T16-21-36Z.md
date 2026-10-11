# External Review: rc02b-severity-ladder (iteration 1)

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
- `orbit/changes/rc02b-severity-ladder/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles
- `orbit/architecture/clean-up-review-cycle.md` — the program this change serves: read
  `### Stage rc02b-severity-ladder` (the charter and its 2026-10-03 MEASURED paragraph) and
  rulings R-crc-1, R-crc-6, R-crc-9, R-crc-10, R-crc-14 in the Rulings index

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: 0 — the fresh proposal pass
  (`review-proposal-2026-10-03T14-53-10Z.json`, 1 CRITICAL / 6 WARNING / 10 SUGGESTION) was
  walked to zero in `address-reviews-2026-10-03T16-15-25Z.json`
- Prior external findings still open: none (no prior external pass)
- Resolved since last review: all 17 of that pass — headlined by the CRITICAL "A BLOCK has no
  carrier on the internal trail, no render slot, and the stopper every delta names does not exist
  in the apply body", resolved by ADDING a `blocks` carrier (review payload field, `## Blocks`
  collected by the render parser, a `### Blocks` report slot, blocks-first triage) and by stating
  as a KNOWN LIMIT that nothing stops on a block mechanically; the prompt's `## Severity`
  paragraph made a checked mirror of a fenced production in `orbit-conventions`; the per-pass site
  count corrected to fourteen; architecture mode brought under the gate check; `reproduction_rerun`
  named as the walk's carrier; the `[unreproduced]` mark moved outside the title token

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/rc02b-severity-ladder/proposal.md
- orbit/changes/rc02b-severity-ladder/design.md
- orbit/changes/rc02b-severity-ladder/tasks.md
- orbit/changes/rc02b-severity-ladder/specs/<capability>/spec.md (every spec under specs/ — six)
- orbit/changes/rc02b-severity-ladder/explore.md (the exploration; its Mechanism section carries
  dated corrections from walk 1)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks; at least
  every requirement the six deltas MODIFY, in full)
- The engine the deltas describe: `src/core/emit-composition.ts` (`validatePayload` ~474,
  `scorecardRollupCheck` ~901, the review table ~101), `src/core/report-render.ts`
  (`normalizeExternalPass` ~396–560, the internal normalizer ~236–283, the render ~600–665),
  `src/core/artifact-graph/trail.ts` (`parseExternalMarkdown` ~348–400),
  `src/core/templates/workflows/review.ts` (per-pass rules ~157–177 and ~218–232, the prompt
  template ~560–660, Step 9 ~814, the bias line ~873) and `address-reviews.ts` (~51–60, ~215–226,
  ~777–786)

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

**How to look (the program's own evidence says this is what finds CRITICALs):** EXECUTE the
mechanisms the deltas specify against the REAL code with inputs you construct — do not read for
plausibility. Run `npm ci && npm run build` and drive `dist/` with node, or run the CLI
(`node bin/orbit.js validate rc02b-severity-ladder --strict`, `node bin/orbit.js fingerprint
rc02b-severity-ladder --check`, `node bin/orbit.js emit review --change rc02b-severity-ladder
--payload <a file you write>` against a scratch payload — note the emit WRITES to the trail on
success, so use a payload the current gate will refuse, or delete what you wrote). Diff every
MODIFIED block against its baseline requirement by heading and confirm no baseline scenario was
dropped — this exact defect has been caught on this program before. Reporting few or zero findings
is a legitimate outcome.

**Where to look hardest, because no independent reader has seen it yet:** the `blocks` carrier
(the ADDED `The review payload carries blocks` requirement in the emit-composition delta, the
`### Blocks` slot and `## Blocks` collection in the report-rendering delta, blocks-first triage in
the address-reviews delta) was INVENTED at walk 1 under R-crc-6's repair lane on the fresh pass's
option A — it has had no independent read. Also: the six-capability count (the exploration said
five; the proposal found `orbit-review-external` as the sixth — is there a seventh?); whether the
checked-mirror parity test (task 1.8) is buildable the way rc13a/rc15's mirrors are (look at how
`test/` holds the explore body's fences byte-equal to `orbit-conventions`); whether any delta
RESTATES the ladder rather than naming it (R-crc-14 — the program has watched this diverge five
times); and the known-limit sentence about apply having no precondition — read
`src/core/templates/workflows/apply-change.ts` and say whether that is true.

**Severity guidance for THIS pass** (the rule this very change proposes to make canonical — grade
by it): CRITICAL means a user path breaks, data is lost, or an implementation built to the artifact
as written would be wrong — AND the finding carries a REPRODUCTION (a command you ran, or a case you
constructed: inputs, rule, expected, observed) inside its `**Description**:`. WARNING means an
implementer could diverge from the artifact's intent. Everything else is SUGGESTION. When unsure,
grade lower. A number or ordering restated in prose that disagrees with its source is ONE finding
naming the source, not one per site. Signal over volume.

## Output format — write to:

`orbit/changes/rc02b-severity-ladder/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g. `2026-10-03T18-05-00Z`. Pick a
fresh timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc02b-severity-ladder (iteration 1)

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
   git add orbit/changes/rc02b-severity-ladder/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc02b-severity-ladder

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
