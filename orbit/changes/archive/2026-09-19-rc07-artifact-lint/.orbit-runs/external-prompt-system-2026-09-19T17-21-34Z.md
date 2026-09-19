# External Review: rc07-artifact-lint (iteration 3)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **system-mode** review: the change is APPLIED.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`, at commit `ba43686`.

## Why this pass exists, and what it is for

**The reviewed gate's independent-pass budget is SPENT — 3 of 3.** This is a
fourth pass, run deliberately and recorded as such. It exists because the last
walk did something the earlier ones did not: it **changed the marker format and
deleted a subsystem**, on your recommendation, and no independent reviewer has
seen the result.

```
git diff 77c5ddf..HEAD -- src        131 insertions(+), 133 deletions(-)
```

That near-zero net line count hides the shape: a 42-line inline-code scanner was
removed, the closer grammar changed, and six repairs landed.

**What changed, and why**, so you review the decision rather than rediscover it:

Your iteration-2 CRITICALs were both defects in an inline-code-span scanner whose
job was to keep prose mentioning the ANONYMOUS closer `<!-- /src -->` from
becoming a live orphan closer. Your second finding named the shape rather than
another instance — inline elements never cross CommonMark BLOCK boundaries, and a
blank line is only one of many things that end a block. Four reviewers had each
found a different defect in that function.

So the NEED was removed instead of the bug. **The closer now carries its name**
(`<!-- /src:NAME -->`), which lets the marker NAME GRAMMAR make prose inert — the
same rule that always protected the opener. The authoring rule is one sentence:
write a PLACEHOLDER name in prose. Backticks now confer no inertness at all; the
NAME does. `computeCodeRegionMask` went 112 → 45 lines and is fence-only over the
shared tracker.

**This is the thing to attack.** It is a format change to the capability's core,
adopted inside a walk, reviewed by nobody independent. Specifically worth
probing:

- Is the new inertness rule actually sufficient? Prose that uses a REAL source
  name is now LIVE, everywhere, including inside backticks. The spec says so and
  a test asserts it — but is that a trap for future authors, and is the failure
  mode acceptable when they fall into it?
- Does anything still depend on the deleted behaviour? Search for assumptions
  that backticks confer inertness.
- The mismatched-closer error is new. Check its interaction with the pairing
  table's other rows, and whether nesting is now expressible in a way the spec
  denies.
- Migration: any document in the wild using the old anonymous closer now has an
  INERT marker rather than a failing one. Is silent inertness the right
  migration failure mode, or should an old-form closer be a named error?

The six repairs from your iteration 2, each of which you may want to check the
way you checked the last round:

| your finding | what was done |
|---|---|
| symlinked tier root bypasses containment | ONE shared `resolveWithinTier` for schema AND doc. The tier root is no longer realpath'd first; its own directory ENTRY must not be a symlink (lstat). `loadArchitectureDoc` deliberately NOT widened — shared by architecture status/show/validate. My first attempt compared realpath(root) to the lexical path and wrongly rejected every project under a symlinked ancestor; the suite caught it. |
| `existsSync` drops a dangling symlink | `lstatSync`; a missing directory ENTRY is still the one correct silence, a dangling link is a `domain` fault, and any tracked symlink now has a stated deterministic policy (domain fault, never followed). |
| partial domain failure reports sources passed | `unverified` now fires on PARTIAL incompleteness, not only total. You named this as the third instance of one pattern; that framing is recorded in the program doc. |
| live-repo inertness test forbids future adoption | The exclusive-file-set assertion is gone; it now asserts every live span names a DECLARED source. |
| taxonomy still says four | Five, in code, design and docs; docs gain the domain fault and the incomplete-domain semantics. |
| parser header states the repaired contract | Rewritten in interpret/passthrough vocabulary. |

One further commit (`ba43686`) is unrelated to your findings: a malformed fence
in `orbit/specs/orbit-review-external/spec.md` meant 24 requirement and scenario
declarations sat inside an unclosed code block. Fixed, verified inert to the
parser. Review it as an ordinary change if you wish; it is not the subject.

## Project context (read first)

- `CLAUDE.md` — handoff orientation; also a SUBJECT (it carries the four marked spans).
- `orbit/architecture/clean-up-review-cycle.md` — the live program; Q-crc-14..17 record this cycle's open items.
- `orbit/project.md`, `*_convention.md`, `orbit/lenses/` — ABSENT. Passes 4 and 5 have no lens file; substitute from `orbit/specs/` or say you skipped them.
- `orbit/changes/rc07-artifact-lint/.orbit-runs/` — the full trail, including both of your prior reviews and every walk record.

## Cycle context

- Iteration: **3** (third EXTERNAL pass in system mode; you ran 1 and 2).
- Prior internal findings still open: **0**.
- Prior external findings still open: **0** — all 12 from iteration 1 and all 8 from iteration 2 were walked.
- Independent-pass budget: **spent, 3 of 3.** This pass is over it, deliberately.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

```
- git diff 77c5ddf..HEAD              ← THE PRIMARY SUBJECT (the format change)
- orbit/changes/rc07-artifact-lint/proposal.md, design.md (esp. D4 and D4c), tasks.md, specs/
- orbit/specs/<capability>/spec.md    (archived baselines)
- src/core/markdown-fence.ts          (what remains after the deletion)
- src/core/source-lint.ts             (named closer, pairing, domain policy)
- src/core/sources-registry.ts        (resolveWithinTier, shared containment)
- src/commands/validate.ts            (unverified on partial incompleteness)
- test/core/source-lint.test.ts, test/core/sources-registry.test.ts,
  test/commands/validate.sources.test.ts
```

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered. Two deliberate deviations to judge: task 5.4 converted to the checkbox-free at-archive-note form (19 → 18 tasks), and tasks 2.2 / 3.2 amended after the fact to record walk-added scope.
1. **Baseline Compliance** — does this break any archived `orbit/specs/` requirement? Note `orbit-review-external`'s baseline was edited directly (fence characters only) rather than through a delta; judge that convention exception.
2. **Cohesion** — `markdown-fence.ts` is shared with the trail and report parsers. `FenceTracker.inFence`/`handle` are claimed untouched throughout.
3. **Surface Walk** — the `--json` contract now carries `source_findings`, `source_coverage`, `source_domain`, and a conditional `unverified` in `byType.sources` and `summary.totals`. The no-registry path is claimed byte-identical to before this change existed.
4. **Perspective Reviews** — no lens file. Substitutes: an adopter arriving from upstream OpenSpec; a CI job parsing `--json`; an author hand-editing `CLAUDE.md`; **an author who read the OLD spec and writes an anonymous closer.**
5. **Critical-Path Scan** — no lens file. Suggested: a fresh clone → `orbit validate --sources`; a project that is NOT a git repository; a partially unreadable domain; one malformed marker in one file.
6. **Drift / Residue** — this change's thesis is that two copies of one fact drift, so check its own artifacts against each other: design D3 vs the spec's source table, D5b's kind table vs the code's union vs `docs/cli.md`, and every remaining mention of the deleted inline-code rule.

### Declared for attack, not defended

- **The format change itself** — see above. It is the reason this pass exists.
- **`resolveWithinTier`** — written twice, wrong the first time.
- **The symlink policy** — "any tracked symlink is a domain fault" is deterministic but possibly heavy-handed. Is it right?
- **`unverified` semantics** — three fixes in three rounds landed on this. Is the current rule actually complete, or is there a fourth scope where a source is reported passed without being checked?
- **Q-crc-17's class** — a walk record with retyped titles matched ZERO findings by the gate's key while claiming ten resolved. Nothing checks this. Other places where a record asserts a relationship nothing verifies are the highest-value thing you can report.

## Output format — write to:

`orbit/changes/rc07-artifact-lint/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, hyphenated like
`2026-09-19T18-04-11Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc07-artifact-lint (iteration 3)

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
   git add orbit/changes/rc07-artifact-lint/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 3): rc07-artifact-lint

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, just output the findings markdown in this chat,
state explicitly that you could NOT commit/push, and the user will commit it
manually.
