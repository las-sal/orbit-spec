# External Review: d6-pr-lifecycle (iteration 4)

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
- `orbit/changes/d6-pr-lifecycle/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles
- `orbit/architecture/d-arc-arbitered-flow.md` — the program doc this change cites
  (`### Stage d6-pr-lifecycle`)

## Cycle context

- Iteration: 4 in SYSTEM mode (pass 7 on the shared internal+external axis). Six system
  passes so far, every one walked to zero open findings: in-context 1 (0C/2W/1S), fresh 2
  (1C/5W/2S), external iteration 1 as two parallel passes — GPT-5 Codex (1C/2W/0S) and a
  clean-context Claude Fable 5.1 session (1C/7W/4S), sharing one CRITICAL — an in-context
  confirm 5 (0C/1W/1S), and external iteration 3, GPT-5 Codex
  (`external-system-2026-09-11T00-54-45Z.md`, 2C/5W/1S, resolved in
  `address-reviews-2026-09-11T14-57-12Z.json`). 36 findings across six passes; none re-opened.
  NO pass has yet come back clean over the current tree.
- Prior internal findings still open: 0
- Prior external findings still open: 0
- Resolved since the last external review — THE VERIFICATION SET for this round (the
  iteration-3 walk, commit `c8a8a9c`; none of it has been checked by an independent eye):
  1. CRITICAL — `gh repo view --repo …` was invalid grammar (the real CLI rejects it:
     `unknown flag: --repo`; the repository is POSITIONAL). Fixed in the shared resolution
     section (`pr-choreography.ts`), the orbit-pr-lifecycle delta, tasks.md, and the
     transcription (`phase1.ts` `ghRepoView`); repository qualification is now stated
     command-specifically (`--repo` on `gh pr` verbs, positional on `gh repo view`). The
     INSTRUMENTS that let five passes miss it are now strict: the `gh` stub (`harness.ts`)
     rejects `--repo` on `repo view` with the real message and rejects `gh pr` verbs that
     lack `--repo`; the fidelity sweep (`orbit-content-fidelity.test.ts`) is command-specific;
     a harness case proves the stub fails the flag form and passes the positional one.
  2. CRITICAL — remote-ahead fast-forward bypassed the generation-input guard and
     compatibility. Reference step 6 is now resolved FIRST and defines the EFFECTIVE tip;
     compatibility and the guard are evaluated against it, and the guard covers every tree
     transition (switch, then fast-forward). Transcription reordered to match, with two
     regression cases (rewritten remote exploration; foreign remote path).
  3. W — commit ISOLATION at both seams: `git add <enumerated>` then `git commit --only <the
     same enumerated paths>`; pre-staged unrelated index entries stay staged and are named,
     never published. Spec clauses in the orbit-archive-modifications requirement + scenario
     and the orbit-propose-modifications phase 3; a harness case proves the recipe.
  4. W — the archive reference no longer interpolates `PR_CONFIG_ORDER_SECTION` (the tail is
     attachment-gated; its header says so); the constant's doc comment says it is emitted
     ONLY into the propose/ff reference; a fidelity assertion pins the absence.
  5. W — the architect reference's gate is a MATCHING per-architecture record, URL
     OPTIONAL (URL-bearing → live validation; no URL → four-axis discovery).
  6. W — the attachment record's final commit+push runs ONLY when a PR opened or was adopted
     (`pr_attachment.url` present), with an explicit success gate; after a mid-flight failure
     the emit stays local and landing it is a named manual-recovery line. Reference, both
     bodies, propose delta.
  7. W — that record's recovery is STEP-DEPENDENT (push only when the commit already
     succeeded), completed-vs-pending named.
  8. S — the early HEAD-vs-attachment observation moved to a genuine pre-write entry step
     (`NEW Step 0.7` in the archive body, every provenance path, before Step 1); Step 5.45
     observes live PR state only; the fidelity ordering test asserts 0.7 precedes any write.
  Earlier resolutions (iterations 1–3 and the internal passes) are listed in the
  iteration-3 prompt (`external-prompt-system-2026-09-11T00-33-55Z.md`) and its walk logs.

Known NON-defects (please do not re-flag; they are designed or deferred by ratified
decision — flag only if you find them WRONG, not merely present):
- Task 6.3 is an unchecked user-validation handoff (dogfood exit criterion 1 on a real
  change) — the designed passed-for-flow state, not a completeness defect.
- The arc doc's `### Stage d6-pr-lifecycle` section still carries the superseded
  three-value sketch (`pr: draft-at-propose | at-archive | never`) — retired at archive
  per at-archive note 5.5 in tasks.md.
- The outward half of the choreography (push, `gh pr create/edit/ready`) has NO automated
  coverage by ratified decision; the phase-1 harness (33 cases) covers the local git half
  with a `gh` stub that now enforces real-CLI grammar.
- Touchpoints category-5 divergence (`status.ts`, `orientation.ts`, two tests) is explained
  by a dated provenance note under design D-d6-7 — by decision, not drift.
- `orbit/lenses/` does not exist in this repo — passes 4 and 5 are skips.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- orbit/changes/d6-pr-lifecycle/proposal.md, design.md, tasks.md, explore.md, specs/ (8 deltas)
- The change's commit range: `git diff 7597759..HEAD` (7597759 is the last pre-change
  commit); the iteration-3 walk is commit `c8a8a9c` — `git show c8a8a9c` is the smallest
  view of what changed since your last pass
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; absent in
  this repo — note the skip)
- Code paths touched: `src/core/templates/workflows/pr-choreography.ts` (four exported
  sections composed into three references: `pr-choreography.md` for propose + ff carries
  resolution + config-order + phases; `pr-archive-tail.md` for archive carries resolution +
  tail; `pr-resolution.md` for architect carries resolution + the four-axis query),
  `propose.ts`, `ff-change.ts`, `archive-change.ts`, `bulk-archive-change.ts`, `onboard.ts`,
  `architect.ts`, `src/core/project-config.ts`, `src/core/orientation.ts` +
  `src/commands/workflow/status.ts`, `src/core/emit-composition.ts`, `orbit/config.yaml`,
  and tests under `test/core/`, `test/commands/`, `test/core/templates/`,
  `test/integration/pr-lifecycle/` (harness + phase-1 transcription, 33 cases).
  The generated `.claude/` surface is NOT in VCS — regenerate with
  `npm install && npm run build && node bin/orbit.js init --tools claude` to inspect the
  emitted SKILL.md + references/ files as a reading AI sees them. `npm test` should report
  2008 passing.

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered
   (task 6.3 is a declared user-validation handoff). Trace every scenario in the eight
   deltas to the body or engine text that implements it.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
   ZERO ENGINE GIT is the thesis; verify it rather than trusting it.
2. **Cohesion** — callers/dependents outside the tasks list. The last three walks edited the
   same reference file, the transcription, the stub, and the specs in quick succession:
   probe for edits that landed in one place and not its sibling, and for any documented
   command whose grammar you can check against the real `gh` and `git` CLIs — that is the
   probe that found the last CRITICAL.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/`
   still coherent? Capabilities ARE surfaces. Three skills carry PR references; the shared
   resolution section must be byte-identical across all three, and the config-order gate
   must appear in the propose/ff reference ONLY.
4. **Perspective Reviews** — absent in this repo; note the skip.
5. **Critical-Path Scan** — absent in this repo; note the skip. In its place, walk the PR
   paths AS A PERFORMING AI with the iteration-3 changes in mind: step-6 effective-tip
   resolution before the guards; commit isolation with `--only` (including the record's own
   commit); the success-gated final push and its step-dependent recovery; the entry-step
   HEAD observation; the attachment-gated archive tail and arc-done readout; every
   degradation branch. Real-git probes in disposable repositories are welcome — they have
   been the highest-signal instrument in this cycle.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses;
   anything the walks left half-updated.

## Output format — write to:

`orbit/changes/d6-pr-lifecycle/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format, e.g. `2026-09-11T18-00-00Z`. Pick a fresh
timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: d6-pr-lifecycle (iteration 4)

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
   git add orbit/changes/d6-pr-lifecycle/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 4): d6-pr-lifecycle

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
