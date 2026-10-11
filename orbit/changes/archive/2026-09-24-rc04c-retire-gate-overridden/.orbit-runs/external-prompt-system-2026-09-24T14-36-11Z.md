# External Review: rc04c-retire-gate-overridden (iteration 1)

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
- `orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles
- `orbit/architecture/clean-up-review-cycle.md` — the live program; this change is its stage
  `rc04c-retire-gate-overridden`. Rulings R-crc-6 (the walk authors nothing), R-crc-10 (mechanize
  only what the engine can observe) and R-crc-13 (a gate reports, it never rules) are the ones
  this change leans on.

## Cycle context

- Iteration: 1 — first external review for this change in `system` mode. (Two external
  proposal-mode passes preceded apply, both by GPT-5 Codex, both walked to zero.)
- Prior internal findings still open: 0. The last in-context proposal pass found one WARNING
  ("the emptiness predicate is stated in two capabilities with DIFFERENT extensions"), resolved by
  DE-DUPLICATION: `orbit-run-summary-emit` now owns the predicate and its set;
  `orbit-emit-composition` names the check without restating the condition. No system-mode review
  has run yet.
- Prior external findings still open: 0.
- Resolved since last review: the proposal cadence's 17 findings (3 CRITICAL / 5 WARNING / 3
  SUGGESTION from the fresh pass; 3 CRITICAL / 2 WARNING / 1 SUGGESTION from external iter 1;
  1 WARNING in-context) — every one resolved, none re-opened. The apply that followed is what you
  are reviewing.

**THIS IS THE EXTERNAL HALF OF A BLIND PAIR.** The schema's `review-system` cadence is
`[blind-pair, in-context]`: one fresh (clean-context Claude) pass and one external pass, blind to
each other. If a `review-system-<TS>.json` with `reviewer_class: "fresh"` has landed in
`.orbit-runs/` by the time you pull, DO NOT READ IT. Its findings must not inform yours; the
value of the pair is two independent reads of the same tree. Read only what is listed below.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- `orbit/changes/rc04c-retire-gate-overridden/proposal.md`, `design.md`, `tasks.md`, `specs/`
  (three delta specs: `orbit-run-summary-emit`, `orbit-archive-modifications`,
  `orbit-emit-composition` — 10 MODIFIED requirements). `tasks.md` carries dated
  **MEASURED / REPORTED / RECORDED** notes under every section-4 and section-5 task: those are the
  apply's own claims about itself, and each is a thing to attack.
- `orbit/changes/rc04c-retire-gate-overridden/explore.md` — seven dated decisions (D-rc04c-1..7)
  the design cites rather than re-derives.
- The change's commit range: `git log --oneline -- orbit/changes/rc04c-retire-gate-overridden/`
  gives the start (`2431af05`, 2026-09-22); the apply commit is the most recent one touching
  `src/core/emit-composition.ts`. `git diff 2431af05^..HEAD -- src/ test/ CLAUDE.md` is the
  implementation diff; the change directory's own commits are bookkeeping.
- **The engine**: `src/core/emit-composition.ts` — `validateJudgements` (the relaxed structural
  check: NON-EMPTY `formed_against` exempted for `continuation`/`proceed` ONLY) and
  `judgementOrderingCheck` (the NEW emptiness-truthfulness rule: an empty citation is refused
  naming the LATEST preceding independent pass, accepted when none precedes; the resolution set is
  `readTrail(...).passes` filtered to `fresh`/`external`, which EXCLUDES rejected external
  returns). Also the two `payloadFields` tables (`apply`, `archive`) that no longer list the field,
  and the deleted coexistence guard (`GATE_FIELD_PAIRS` — gone).
- **The bodies**: `src/core/templates/workflows/archive-change.ts` (Step 3.4 **Proceed anyway**
  and its continuation-record paragraph — including the rewritten branch for a trail with NO
  independent pass; the shipped `references/archive-summary-schema.md` literal: its schema block,
  the `consent` / `fingerprint_overridden` / `judgements` field notes; Step 5.65's reader
  rationale), `apply-change.ts` (Step 3 `blocked-by-gate`; the Run-summary emit payload bullets
  and the **AT THIS SEAM** paragraph), `pr-choreography.ts` (the **READY** paragraph).
- **The tests**: `test/core/emit-composition.test.ts` (the rc04a describe: new edge-(d) cases,
  the spend scope guard, the two negative regressions for the retired key; the CONDITIONAL-fields
  test now carrying a continuation with `formed_against: []`; the both-kinds fixture),
  `test/core/emit-schema-parity.test.ts` (three conditional fields; the victim swap),
  `test/core/judgement-record-fixture.test.ts` (the NARROWED last case, routed through
  `readTrail` over `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/`),
  `test/core/templates/orbit-content-fidelity.test.ts` (the replaced body pins),
  `test/core/templates/skill-templates-parity.test.ts` (the re-pinned hashes — a file OUTSIDE the
  stage's sized test set; see tasks.md 4.4).
- `CLAUDE.md` lines ~59–60 and ~222–233 — the two live-engine passages rewritten by task 5.0; the
  surrounding archive narrative was deliberately left as history.
- `orbit/specs/<capability>/spec.md` — the archived baselines, for baseline-compliance. NOTE the
  three touched baselines are PRE-SYNC: the deltas replace their MODIFIED requirements at archive,
  so compare against the delta text, not the baseline's, for those ten requirements — and check
  whether any UNMODIFIED baseline requirement (in those three capabilities or in `orbit-engine-gates`,
  `orbit-lifecycle-consent`, `orbit-pr-lifecycle`, `orbit-conventions`) still mandates the retired
  field or the old non-empty contract.
- `orbit/lenses/perspectives.md`, `orbit/lenses/critical-paths.md` — absent in this repo; passes 4
  and 5 below run against the capabilities in `orbit/specs/` instead.

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (run your
   own equivalent of upstream verify-change). 36/36 boxes are checked; several section-5 boxes are
   RECORD/RECOMMEND tasks whose deliverable is the note under them — judge whether each note
   actually discharges its task or merely restates it.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? In
   particular: does the totality rule as IMPLEMENTED match the predicate `orbit-run-summary-emit`
   states (set = the trail reader's pass set, rejected externals excluded, "latest" named)? Does
   `orbit-emit-composition`'s edge (d) prose match the code path? Does anything still require a
   field nothing writes?
2. **Cohesion** — callers/dependents outside the tasks list. Who else reads `formed_against`,
   `judgements`, or the apply/archive payload tables? Does the report renderer, orientation, or
   any trail reader assume the legacy field? Does the `readTrail`-based test prove what tasks.md 4.2
   says it proves?
3. **Surface Walk** — every CLI / public-function surface in `orbit/specs/` still coherent?
   `orbit emit apply|archive` behaviour on a legacy payload; the built CLI vs `src/` (the tasks
   ordered a rebuild — is `dist/` what ships?); the generated skill surface after `update --force`.
4. **Perspective Reviews** — simulate the callers: the AI composing an archive emit from the
   shipped schema reference alone (does the reference now teach it to WRITE the entry on an empty
   trail, or could it still read the field note as "omit"?); the AI at apply's Step 3 proceed-anyway;
   a cold session reading `CLAUDE.md`.
5. **Critical-Path Scan** — walk end-to-end: proceed-anyway at archive on a trail with (a) two
   preceding independent passes, (b) only an in-context pass, (c) only a rejected external return,
   (d) nothing — what does the body instruct, what does the engine accept or refuse, what error text
   does the human see, and does each path write exactly one record or none?
6. **Drift / Residue** — vocabulary residue (`coexist`, "until retired", "strict widening" as a
   LIVE claim, the retired field named anywhere in `src/`), stale references (line numbers in
   design/tasks that moved), archive-coherence misses (does the rc04a paragraph in `CLAUDE.md` still
   read as history where it should, and as live where it should?). Also: the tasks preamble names a
   "ONE LIVE WATCH" — a rule stated in more than one place, fixed by deletion, three times so far.
   Did the apply introduce a FOURTH instance (the emptiness rule is now stated in the engine, two
   bodies and a shipped reference)? If you think it did, say so and say where.

## Output format — write to:

`orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc04c-retire-gate-overridden (iteration 1)

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
   git add orbit/changes/rc04c-retire-gate-overridden/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc04c-retire-gate-overridden

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
