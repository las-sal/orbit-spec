# External Review: rc13c-propose-consumes-mechanism (iteration 1)

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
- `orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in proposal mode)
- Prior internal findings still open: 0 — one fresh (clean-context) internal pass,
  `review-proposal-2026-09-26T18-17-21Z.json`, returned 2 CRITICAL / 6 WARNING / 6 SUGGESTION;
  all 14 were walked in `address-reviews-2026-09-26T18-28-16Z.json`.
- Prior external findings still open: 0 (none yet)
- Resolved since last review (the fresh pass's 14, by title): the consume-time explore emit
  contradicting `orbit-run-summary-emit`'s one-shot scenario (option B taken — the emit is
  DESCOPED; propose reads the Mechanism section from the file by the grammar `orbit-conventions`
  owns, with an OPTIONAL cross-check against the staging trail's newest explore emit when it
  postdates the last file write, and fires no emit itself; design D-rc13c-2 marked REVISED,
  D-rc13c-8 SUPERSEDED); task 2.2's emit ordering before Step 0b (closed by the descope); the
  refuse dropping the `Re-entry:` trigger (option A taken — the halt states the date AND the live
  `Re-entry:` slot verbatim; no reopen offered); `(no other field)` refusing at the write gate
  (closed by the descope); the `open` state having no ID (row, scenario and record now point at
  `orbit-run-summary-emit`'s identifier rule); the five open-state names restated (now "any state
  `orbit-emit-composition`'s `rules_open` defines"); the record's shape column wrong for two CLOSED
  entries (corrected; one sentence added to the consume-mode requirement for D-rc13c-1's fifth
  member); task 3.1's hand-written opener (now interpolates `EXPLORE_DECISION_ENTRY_PRODUCTION`);
  parity normalization unstated (stated); "staging trail" false on the regenerate path (closed by
  the descope); the `reused, not edited` Touchpoints entry (dropped); the deferral parked under
  Q-crc-24 (task 4.5 opens its own question at archive); `head -1` vs first non-blank line
  (corrected in Risks and task 1.2); the residue grep forbidding the owner's title (tasks 2.1/2.3
  point by description).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

```
- orbit/changes/rc13c-propose-consumes-mechanism/proposal.md
- orbit/changes/rc13c-propose-consumes-mechanism/design.md
- orbit/changes/rc13c-propose-consumes-mechanism/tasks.md
- orbit/changes/rc13c-propose-consumes-mechanism/specs/<capability>/spec.md (every spec under specs/ — ONE: orbit-propose-modifications, one ADDED requirement + five MODIFIED blocks)
- orbit/changes/rc13c-propose-consumes-mechanism/explore.md (if present — it is; its Mechanism section is the recorded mechanism, one entry per rule. NOTE: the file persists UNCHANGED after promotion by rule, so its D-rc13c-2 and D-rc13c-8 entries describe a consume-time emit that the first proposal walk DESCOPED; the design's Decisions section is the live statement and says so)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks; the delta MODIFIES five blocks of orbit/specs/orbit-propose-modifications/spec.md and POINTS at requirements owned by orbit/specs/orbit-conventions/spec.md — "`explore.md` five-section format" (a retained title; the format is six), "Decision entry identity and classification", "Mechanism entry grammar and accounted closure", "Concluded exploration outcome" — by orbit/specs/orbit-explore-modifications/spec.md ("Re-entry resolution and the conclude verb"), by orbit/specs/orbit-run-summary-emit/spec.md (the one-shot scenario, the maturity requirement's identifier rule) and by orbit/specs/orbit-emit-composition/spec.md (the `rules_open` field))
```

Worth reading beside the artifacts, because the artifacts make claims about current code and
tests: `src/core/templates/workflows/propose.ts` (the whole body — Mode detection Step 0, Steps
0a–0d, Graceful degradation, and the PR lifecycle "Position" paragraph, which places the branch
switch between Step 0 and Step 0a; the change claims its refuse is unreachable by that switch);
`src/core/explore-grammar.ts` (`EXPLORE_DECISION_ENTRY_PRODUCTION`, which task 3.1 interpolates);
`src/core/parsers/explore-rules.ts` (the `rules_open` states and the ID-less `open` case);
`src/core/emit-composition.ts` (payload rules; target resolution order — an existing change
directory wins over a staging directory); `test/core/templates/orbit-content-fidelity.test.ts`
(the propose marker rows the tasks extend), `test/core/templates/skill-templates-parity.test.ts`
(the `orbit-propose` hash pin the change says moves once), `test/helpers/owner-text.ts` (the
single-active-owner lookup task 2.4 reuses). The program doc's stage section is
`### Stage rc13c-propose-consumes-mechanism` in `orbit/architecture/clean-up-review-cycle.md`
(three exit criteria; the charter sizes the stage at ONE capability and says the exploration
chooses between refuse and treat-as-reopen at the concluded seam — the exploration chose refuse,
and Sal ruled that no reopen avenue is offered from propose). Two archived explorations are the
evidence for the design's four CLOSED shapes:
`orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` and
`orbit/changes/archive/2026-09-25-rc13b-explore-maturity-signal/explore.md`.

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

Places a prior pass found the mechanism weakest, if you want somewhere to start: the SEAMS with
neighbouring specs — the fresh pass's CRITICALs were a READ miss on `orbit-run-summary-emit`'s
one-shot rule and a COHERE defect between two of the exploration's own rules, and the walk answered
by DESCOPING (the program's R-crc-6 lane), so the ADDED requirement's first paragraph and two of its
scenarios were REWRITTEN at the walk and no independent reader has seen them; whether the surviving
"optional cross-check against the newest staging explore emit when it postdates the last file
write" is well-defined (what is "the last file write" when Step 0b writes to the file — mtime? and
is that observable by a workflow body?) or should simply go; whether every MODIFIED block is still a
byte-complete copy of its baseline block with only the intended edits (diff them — the walk edited
three of the five after the fresh pass diffed them); whether the refuse text now stated in the
delta (date + `Re-entry:` slot verbatim; `(no Re-entry: slot found)` when none) agrees with
`orbit-explore-modifications`' re-entry table's third row and with `orbit-conventions`' concluded
outcome (which says exactly one LIVE entry carries the slot) without RESTATING either (the
program's R-crc-14: a rule is stated once, in the spec that owns it; every other surface points);
whether the design's `Mechanism → artifacts` record — the first ever produced by the mapping this
change specifies — is exact against `explore.md`'s Mechanism section and against the delta text
each row claims as its destination and shape; whether the "no usable entry" row can be executed for
an ID-less `open` rule now that it points at the identifier rule; whether the stage's three exit
criteria are measurable by what the tasks and specs deliver (exit (2) is measured on THIS change:
D-rc13c-5's two residual lines verbatim in the ADDED requirement, the design's Risks pointing at it);
whether the tasked body edits would break the existing fidelity, hash-pin, generated-surface, or
PR-choreography byte-identity tests beyond the one pin the plan names; and size against R-crc-1
(one capability, six blocks, 16 tasks, bound 20). Classify each CRITICAL you raise as READ /
ENUMERATE / COHERE (or none of those) in your Notes — the program tracks that count.

## Output format — write to:

`orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc13c-propose-consumes-mechanism (iteration 1)

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
   git add orbit/changes/rc13c-propose-consumes-mechanism/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): rc13c-propose-consumes-mechanism

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
