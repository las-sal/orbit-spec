# External Review: rc07-artifact-lint (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **system-mode** review: the change is APPLIED. You are reviewing the
implemented product state, not the proposal.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`, at commit `77c5ddf`.

## What is different about this iteration, and what it is actually for

You reviewed this change once already, at `49113ac`. **Everything you are being
asked to look at now is code written in response to review findings — yours and
two internal passes' — and almost none of it has been read by an independent
reviewer.**

```
git diff 49113ac..HEAD -- src        227 insertions(+), 69 deletions(-)  (4 files)
git diff 49113ac..HEAD -- src test   603 insertions(+), 108 deletions(-) (8 files)
```

Three walks have now written mechanism into this change, each reviewed only by
the AI that wrote it or by an in-context pass. That is the specific risk this
iteration exists to address, and it is why the diff — not the change — is the
subject. **Start with `git diff 49113ac..HEAD` and treat everything in it as
unreviewed.**

A second, narrower use of this pass: several fixes were made in response to YOUR
iteration-1 findings. You are the only reviewer who can tell whether they
actually address what you meant, or whether they address the symptom you named
and leave the thing you were worried about. One finding has already failed
exactly that way this cycle (see below), so it is a live failure mode, not a
hypothetical.

## Project context (read first)

- `CLAUDE.md` — handoff orientation. Note it is also a SUBJECT of this change
  (it carries the four marked spans).
- `orbit/architecture/clean-up-review-cycle.md` — the live program. Its rulings
  R-crc-1..R-crc-10 govern; Q-crc-13..17 record this cycle's open items.
- `orbit/project.md`, `*_convention.md`, `orbit/lenses/` — ABSENT in this repo.
  Passes 4 and 5 below have no lens file; run them from the capability set in
  `orbit/specs/` or say plainly that you skipped them.
- `orbit/changes/rc07-artifact-lint/.orbit-runs/` — the full trail, including
  your iteration-1 findings and every walk record.

## Cycle context

- Iteration: **2** (second EXTERNAL pass in system mode; you reviewed iter 1).
- Prior internal findings still open: **0**.
- Prior external findings still open: **0** — all 12 of your iteration-1
  findings were walked. One was deferred and later repaired (see below).
- Passes on this change so far: 3 proposal (2 internal + 1 external), then a
  system-mode blind pair (fresh + your external), then one in-context pass.

**What was done with your iteration-1 findings**, so you can check the work
rather than rediscover it:

| your finding | what happened |
|---|---|
| opacity contract false of the parser API | DEFERRED, then REPAIRED. The delta now separates what the parser INTERPRETS from what it CARRIES as passthrough, with a CLOSED two-row table of engine readers (`sliceStageSection`, the source lint's ruling count). No code changed. |
| ruling count uses the heuristic fence mask | `countRulingEntries` now builds its mask from the shared `createFenceTracker`. The ARCHITECTURE PARSER still uses the heuristic — recorded as Q-crc-15, deliberately not unified here. |
| marker regexes accept non-exact comments | Tightened to exact literal delimiters; four inertness regressions added. |
| escaped backticks hide live markers | Backslash counting added to `computeCodeRegionMask`. |
| empty registry file disables the lint silently | `sources: {}` is now a registry fault. |
| schema parameters can traverse | Name grammar + symlink containment. A follow-up pass then found the containment line itself unreachable; it was deleted and the comment rewritten. |
| tracked read failures silently scanned | Now reported, and `filesScanned` counts successful reads. **This fix was later found INCOMPLETE** — see the honesty note below. |
| unmatched runs cause superlinear scans | Pairing pre-indexes partners in one backward sweep. |
| prototype properties bypass the closed table | `Object.hasOwn`. |
| four fixtures do not exercise the lint | Routed through `runSourceLint` plus an exported `checkSpanAgainstValue`. |
| NUL-delimited git output | `git ls-files -z`, split on NUL, paths never trimmed. |
| ruling-count oracle derives from shared assumptions | The live value is now PINNED at 10, with the hand-scan kept as a second witness. |

**The honesty note, because it is the most useful thing to know about this
diff.** A fresh internal pass found that the empty-domain reason reached only
stderr. That was fixed by adding `source_domain` to the JSON — and the in-context
pass then found the fix had addressed the reported symptom and left the claim
underneath it: the summary still said `passed: 1, failed: 0` over a run that read
zero files. That has now been fixed again (an `unverified` bucket). **Assume the
same pattern may have happened elsewhere in this diff.**

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

```
- git diff 49113ac..HEAD                  ← THE PRIMARY SUBJECT
- orbit/changes/rc07-artifact-lint/proposal.md, design.md, tasks.md, specs/
- orbit/specs/<capability>/spec.md        (archived baselines)
- Code paths, in descending order of how much they changed since you last read them:
    src/core/markdown-fence.ts      (computeCodeRegionMask: 3 rewrites)
    src/core/sources-registry.ts    (fenceMaskFor, findSchemaFile, guards)
    src/core/source-lint.ts         (domain resolution, read failures, the `domain` kind)
    src/commands/validate.ts        (source_domain, the unverified bucket)
    test/core/source-lint.test.ts, test/core/sources-registry.test.ts,
    test/commands/validate.sources.test.ts, test/core/architecture/engine.test.ts
```

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design
   adhered. Note two deliberate deviations to judge rather than assume: task 5.4
   was converted to the repo's checkbox-free at-archive-note form (19 tasks → 18),
   and task 3.2 was amended after the fact to record walk-added scope.
1. **Baseline Compliance** — does this break any archived `orbit/specs/`
   requirement? The sharp one remains `orbit-architecture-engine`: verify the
   REWRITTEN requirement is now true of the shipped API, that its two-row reader
   table is complete (I claim it is, having checked every consumer of the parse —
   check me), and that all six original baseline scenarios survive byte-identically.
2. **Cohesion** — `markdown-fence.ts` is shared with the trail and report parsers;
   the claim is that `FenceTracker.inFence`/`handle` are untouched and only the
   additive mask changed. `createFenceTracker` gained a second consumer.
3. **Surface Walk** — `orbit validate --sources` and its `--all` inclusion. The
   `--json` contract gained `source_domain` and a conditional `unverified` key in
   `byType.sources` and `summary.totals`. The promise is that a run with NO
   `orbit/sources.yaml` is byte-identical to before this change existed.
4. **Perspective Reviews** — no lens file. Suggested substitutes: an adopter
   arriving from upstream OpenSpec; a CI job parsing `--json`; an author editing
   `CLAUDE.md` by hand and meeting an HTML-comment delimiter mid-sentence.
5. **Critical-Path Scan** — no lens file. Suggested flows: a fresh clone →
   `orbit validate --sources`; a project that is NOT a git repository; a source
   that fails to RESOLVE versus a registry that fails to PARSE; one malformed
   marker in one file.
6. **Drift / Residue** — vocabulary residue, stale references, spec/design/docs
   disagreement. This change's own thesis is that two copies of one fact drift, so
   check its own artifacts against each other: the design's D3 source table versus
   the spec's, D5b's kind table versus the code's union versus `docs/cli.md`.

### The specific things I would attack, stated so you can attack them harder

Declared, not defended. Every one is code written after your iteration 1.

- **`computeCodeRegionMask` has been rewritten three times** and now carries
  blank-line block boundaries, backslash-escape handling, and a pre-indexed
  linear pairing sweep. Three independent reviewers have each found a different
  defect in this one function. I would not assume the fourth does not exist.
  Backslash handling in particular: escapes are counted before a run, but
  CommonMark does not honour backslash escapes INSIDE a code span.
- **The `unverified` bucket** changes `summary.totals` shape conditionally.
  Conditional shape is a contract hazard; check the no-registry byte-identity
  claim yourself rather than believing it.
- **The `domain` finding kind** was added rather than widening `marker`. Check
  that every renderer, summarizer and test agrees, and that `summarizeSources`
  attributes it the way the spec implies.
- **`findSchemaFile`'s remaining symlink guard** — the containment guard beside
  it was deleted as unreachable. Verify the survivor is actually reachable and
  actually sufficient.
- **The rewritten instruments.** The inertness test now derives its subject from
  `resolveFileDomain(process.cwd())` and asserts `CLAUDE.md` is the only file with
  live spans. That couples a unit test to the live repository's contents.
- **Q-crc-17's class:** a walk record with hand-retyped finding titles matched
  ZERO findings by the gate's key while claiming ten resolved. Nothing checks
  this. If you see other places where a record asserts a relationship nothing
  verifies, that is the highest-value thing you can report.

## Output format — write to:

`orbit/changes/rc07-artifact-lint/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, hyphenated like
`2026-09-18T15-04-11Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc07-artifact-lint (iteration 2)

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
   git add orbit/changes/rc07-artifact-lint/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 2): rc07-artifact-lint

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
