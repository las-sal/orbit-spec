# External Review: rc15-ended-stage-state (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is the EXTERNAL half of a BLIND PAIR (`spec-driven` v4, `review-system` cadence
`[blind-pair, in-context]`): a fresh Claude session reviews the same commit independently.
You must not read any `review-system-*.json` emit or walk log that may appear on the trail
after this prompt was packaged — review the pushed apply commit and nothing that came after.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`. The apply commit under review is
`d864ed1c` (its parent `fce353ab` is the proposal-cycle close). The whole change is
`50f7bed0^..d864ed1c`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read the "ACTIVE program" section; the rulings R-crc-10, R-crc-13, R-crc-14 and the ratified decisions D14/D15 bear on this change)
- `orbit/architecture/clean-up-review-cycle.md` — the program doc; `### Stage rc15-ended-stage-state` is the charter with three exit criteria
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/rc15-ended-stage-state/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (the proposal cycle: three passes, three walks)

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: none — the proposal cycle's 17 findings (external GPT-5 Codex 4W/2S; fresh 0C/3W/4S; in-context 0C/1W/3S) were all walked to zero before apply; no system-mode pass has run yet
- Prior external findings still open: none (the proposal-mode external pass, iter 1, is fully resolved — `address-reviews-2026-09-28T23-14-08Z.json`)
- Resolved since last review: 3A (the unprompted route declines on live stages), 6A (the lexical limit declared and shared, not hardened), 1B (arc-done over ended stages a declared non-goal + at-archive note 5.5), 2A (the unprompted route declines on a dated slot), W1 (the `[x]`+concluded detail names the conclusion, never "live citing work"), W2 (the fifteen-cell table test), W3 (audit-drift enumerations dropped), W4 (the §2 scaffold grammar mirror), S2/S3/S4 (retitled precedence test; `(concluded)` suffix; the `— withdrawn` suffix dropped from the production)

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/rc15-ended-stage-state/proposal.md, design.md, tasks.md, specs/ (three delta files, five MODIFIED requirement blocks — every one carries measurements appended at apply; the tasks record two plan facts the apply corrected)
- The apply commit: `git diff fce353ab..d864ed1c` (13 files) — and `git diff 50f7bed0^..d864ed1c` for the whole change
- orbit/changes/rc15-ended-stage-state/.orbit-runs/apply-2026-09-29T17-11-18Z.json — the apply emit (its `final_assessment` carries the exit-criterion measurements)
- orbit/specs/orbit-architecture-engine/spec.md, orbit/specs/orbit-architect/spec.md, orbit/specs/orbit-audit-drift/spec.md (baselines — the deltas MODIFY five of their requirements and are synced at archive, so compare the DELTA text against the implementation, and the baseline against anything the deltas do not touch)
- orbit/specs/orbit-orientation/spec.md and orbit/specs/orbit-conventions/spec.md (exit 3 claims orbit-orientation needs NO delta; orbit-conventions owns the status-header production the state reader now consumes)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched: `src/core/architecture/{parser,state,buckets}.ts`, `src/core/parsers/explore-rules.ts` (one export), `src/core/emit-composition.ts` (one payload key), `src/core/templates/workflows/{architect,audit-drift}.ts`, and the tests `test/core/architecture/engine.test.ts`, `test/core/orientation.test.ts`, `test/core/emit-composition.test.ts`, `test/core/templates/{orbit-content-fidelity,skill-templates-parity}.test.ts`
- Untouched consumers worth checking for ripple: `src/core/orientation.ts` (WAITING keys on the exact awaiting string — deliberately NOT edited), `src/commands/architecture.ts`, `src/commands/workflow/status.ts`, `src/core/architecture/validate.ts`, `test/core/architecture/live-arc.test.ts`

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). 13 of 14 tasks are checked; 5.3 is a declared user-validation handoff (Sal writes rc03a's mark in the next architect session). Does every delta scenario have an executing test? Does any task claim a measurement the tree does not bear out?
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement? In particular: `orbit-orientation`'s WAITING closed set; `orbit-conventions`' status-header ownership (R-crc-14: the reader must consume the explore parser's ONE reader, never a second grammar); `orbit-architecture-engine`'s passthrough-reader table (the new `explore.md` read is a read of a citing artifact's FILE from the state scan — is that a new "engine reader of passthrough" that the CLOSED table should name, or is it outside that table's domain?); `orbit-emit-composition`'s payload-table closure.
2. **Cohesion** — callers/dependents outside the tasks list. `StageCompletion` gained a required `ended` boolean: every constructor site? `CitingArtifact.concluded` is optional and only on explores: any consumer that keys on `kind === 'explore'` as "live"? `ObservedState` and `RenderedState` gained members: any exhaustive switch or closed-set test elsewhere (orientation, status, audit-drift references, run-summary schema docs) that now silently accepts or mis-renders them? The `ratifiedDate`/`ratifiedWho` fields are now gated on `ratified` — was anything reading them off an ended stage?
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still coherent? `orbit architecture status` (text + `--json`), `orbit status --full` PROGRAM band, `orbit architecture validate` (structure-only — does the third production reach it correctly, including the duplicate-slot case?), `orbit architecture show`, `orbit emit architect` (`stages_ended`), `orbit emit apply`. Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`, simulate the caller's POV. Especially an ADOPTER whose installed `orbit-architect` skill has neither our specs nor our parser: is the body's unprompted route executable from the skill text alone (it tells the AI to read `orbit architecture status --json` — does that payload actually carry what the body's decision needs: `observed`, the slot's dated/undated state, the live citer's name)?
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end. Walk the rc03a flow the change was built for: Sal opens an architect session on `clean-up-review-cycle`, rc03a renders awaiting, the offer fires with three answers, "ended" writes `Complete: [~] <date> (Sal)` after the stage's `Depends-on:` line, the next `orbit architecture status` renders `ended (declared <date> by Sal)`, `orbit status --full` WAITING drops it, the emit carries `stages_ended`. Then the re-entry path: a new change citing an ended stage → INCONSISTENT; clearing the slot by hand. Then the exploration-layer path: a stage whose only citer is a concluded staging directory. Does each step hold against the shipped code and body text?
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses. The two living sentences that still say the reader keys on location (`orbit/specs/orbit-conventions/spec.md`'s concluded-outcome KNOWN paragraph; the explore body) are DECLARED residue handed to at-archive note 5.4 — flag anything ELSE that describes the old four-rung precedence or two-production grammar: docs, `references/*.md` inside the generated skills (the run-summary schema reference for architect?), the architecture-engine deep-dive doc, CLAUDE.md, test titles. The source lint (`orbit validate --sources`) is clean; the rulings/stages/capabilities counts did not move — confirm the deltas indeed ADD no capability.

## Output format — write to:

`orbit/changes/rc15-ended-stage-state/.orbit-runs/external-system-<TS>.md`

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
   git add orbit/changes/rc15-ended-stage-state/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc15-ended-stage-state

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
