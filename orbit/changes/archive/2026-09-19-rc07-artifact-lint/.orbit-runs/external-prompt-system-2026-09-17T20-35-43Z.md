# External Review: rc07-artifact-lint (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **system-mode** review: the change is APPLIED. You are reviewing the
implemented product state, not the proposal.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `d-arc`, at commit `49113ac`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation. Note: this file is itself a SUBJECT of this
  change (it carries the first four marked spans), so read it as both context
  and artifact.
- `orbit/architecture/clean-up-review-cycle.md` — the live program; the rc07
  stage declaration and rulings R-crc-1..R-crc-10 govern this change.
- `orbit/project.md` — ABSENT in this repo.
- `*_convention.md` at repo root — ABSENT in this repo.
- `orbit/lenses/perspectives.md`, `orbit/lenses/critical-paths.md` — ABSENT in
  this repo. Passes 4 and 5 below therefore have no lens file to drive them;
  run them from the capability set in `orbit/specs/` instead, or say plainly
  that you skipped them.
- `orbit/changes/rc07-artifact-lint/.orbit-runs/` — iteration history; see what
  has already been addressed in prior cycles.

## Cycle context

- Iteration: 1 (first EXTERNAL pass in SYSTEM mode for this change).
- Prior internal findings still open: **0**. The last internal proposal pass
  (fresh, clean-context, 2026-09-17T18-00-55Z) raised 12 findings — 2 CRITICAL,
  6 WARNING, 4 SUGGESTION — and all 12 were walked to resolution in
  `address-reviews-2026-09-17T18-28-27Z.json` (zero stale, zero deferred).
- Prior external findings still open: **0**. The proposal-mode external pass
  (GPT-5 Codex, 2026-09-15T18-19-29Z) raised 12 findings — 3 CRITICAL,
  7 WARNING, 2 SUGGESTION — all walked in
  `address-reviews-2026-09-17T17-45-12Z.json`.
- Resolved since the last external review (the ones most worth re-checking,
  because each was answered by INVENTING MECHANISM that no later pass reviewed):
  - the self-reference hazard was DEMOTED from a normative SHALL to an authoring
    RECORD, and its scenario deleted (no engine input exists for it);
  - `orbit-architecture-engine` was ADDED as a MODIFIED capability narrowing
    "the engine reads ONLY" to "the architecture PARSER's model contains ONLY",
    reversing an earlier option-B ruling that no delta was owed;
  - the ruling-count prefix became a DECLARED registry parameter rather than one
    derived from the doc's filename stem;
  - endpoint-marking was reversed outright in favour of marking a COUNT in a
    written current-state sentence;
  - the `byType.sources` item unit was defined as one declared source, and the
    `summary.totals.items === items.length` invariant deliberately retired.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## An important note on this pass's role

This is one half of a BLIND PAIR. A clean-context `fresh` reviewer is running
the same state independently and has not seen your findings, and you will not
see theirs. Neither half will be walked until both are in. Do not try to guess
what the other half will find or to cover for it — maximum independence is the
whole point of the pairing.

The change applied through a recorded `gate_overridden`: the proposal gate's
3-pass independent budget was spent, so no independent pass ever stood clean on
the final proposal state. Treat the artifacts as UNVERIFIED by any independent
reader before implementation.

## What to read for THIS review (--as system)

```
- orbit/changes/rc07-artifact-lint/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff a10da7d..49113ac
    (the apply commit alone is 49113ac; a10da7d is the last commit before the
     change directory existed)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance
  check). The two capabilities this change touches are the NEW
  orbit-source-lint (delta only; no baseline yet) and the MODIFIED
  orbit-architecture-engine (baseline present).
- Code paths touched by the change (cohesion + surface walk):
    src/core/sources-registry.ts       (new)
    src/core/source-lint.ts            (new)
    src/core/markdown-fence.ts         (additive: computeCodeRegionMask)
    src/commands/validate.ts           (the --sources path and its --all inclusion)
    src/cli/index.ts                   (the --sources flag)
    orbit/sources.yaml                 (new — the dogfood registry)
    CLAUDE.md                          (new — the four marked spans)
    docs/cli.md                        (the validate section, regenerated)
    test/core/sources-registry.test.ts, test/core/source-lint.test.ts,
    test/commands/validate.sources.test.ts   (new instruments)
```

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design
   adhered. Note specifically: task 5.4 was converted from a checkbox to the
   repo's checkbox-free at-archive-note form during apply, taking the tracked
   total from 19 to 18. Judge whether that was legitimate or a quiet descope.
1. **Baseline Compliance** — does this change break any archived
   `orbit/specs/` requirement? The sharp one: `orbit-architecture-engine`'s
   `Parseable architecture-doc format` requirement previously asserted that the
   ENGINE reads only stage ids/titles, slots and section boundaries, with
   rulings engine-opaque. The change narrows that to the PARSER's model and
   names the source lint as the one engine-level exception. Check whether the
   MODIFIED delta actually preserves every original scenario, whether the
   narrowing is true of the shipped code, and whether any OTHER engine-level
   reader of opaque content now exists unnamed.
2. **Cohesion** — callers/dependents outside the tasks list. `markdown-fence.ts`
   is shared by the trail reader and the report parser; the change claims
   `FenceTracker.inFence`/`handle` are untouched and only adds
   `computeCodeRegionMask`. Verify. Note also that `countRulingEntries` uses
   `computeFenceMask` from `src/core/parsers/requirement-blocks.ts` (a different,
   heuristic fence implementation) while `computeCodeRegionMask` uses
   `createFenceTracker` (the strict CommonMark one) — two fence languages in one
   capability. Judge whether that is a defect.
3. **Surface Walk** — every CLI surface in `orbit/specs/` still coherent?
   `orbit validate` gained `--sources`; `--all` runs it; per-item
   `orbit validate <change>` is claimed unchanged. The JSON contract changed
   shape on a registry-bearing run (`summary.totals.items` no longer equals
   `items.length`, and `byType` gains a `sources` key). Check the claim that the
   NO-REGISTRY path is byte-identical to before, and check whether any consumer
   in this repo reads those fields.
4. **Perspective Reviews** — no `orbit/lenses/perspectives.md` exists. Suggested
   substitutes: (a) an ADOPTER arriving from upstream OpenSpec with no
   `orbit/sources.yaml` — does anything change for them?; (b) a CI job running
   `orbit validate --all --json` and parsing the result; (c) an author editing
   `CLAUDE.md` by hand and meeting an HTML-comment delimiter mid-sentence.
5. **Critical-Path Scan** — no `orbit/lenses/critical-paths.md` exists.
   Suggested flows to walk end-to-end: (a) a fresh clone → `orbit validate
   --sources` → what happens; (b) a source that fails to RESOLVE (broken
   architecture doc) versus a registry that fails to PARSE — are both reported
   distinctly and counted correctly in `summary`?; (c) a malformed marker in one
   file — does the rest of the project still lint?
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence
   misses. Specifically worth probing: the design and the spec both carry a
   v1 source TABLE and the design says the spec's survives if they drift — do
   they agree today? And `docs/cli.md`'s validate examples were regenerated from
   a real run during apply; verify they match what the code actually emits.

### Things the authoring AI considered risky, stated so you can attack them

These are declared, not defended. Attack them freely.

- **Containment's residual**: the check is `span.includes(sourceValue)`, so a
  stale span can pass if it happens to contain the current value — `20 baseline
  capabilities` contains `2`. The dogfood's spans were drawn tight around the
  numerals for this reason, which does not close it.
- **Two fence implementations** (see Pass 2).
- **The `summarizeSources` pseudo-item rule**: unattributable findings (registry
  fault, marker error, unknown source) roll up into ONE failed pseudo-item so a
  run can never report zero failed items beside a non-zero exit. The design
  named that guard only for registry faults; apply generalized it. Judge the
  generalization.
- **`computeCodeRegionMask` is new machinery**: a per-character mask over the
  whole document, with lookahead for unmatched backtick runs and fenced lines as
  barriers. Nobody outside the authoring session has read it.
- **The dogfood edited prose to remove "second voices"**: the live-program
  paragraph's `R-crc-1..10` endpoint was deleted, and rc02's "capabilities stay
  at **20**" was retensed to "stayed at". Judge whether those edits are honest
  or whether they quietly changed meaning.

## Output format — write to:

`orbit/changes/rc07-artifact-lint/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, hyphenated like
`2026-09-17T21-04-11Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc07-artifact-lint (iteration 1)

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
   git commit -m "External review (system, iter 1): rc07-artifact-lint

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
