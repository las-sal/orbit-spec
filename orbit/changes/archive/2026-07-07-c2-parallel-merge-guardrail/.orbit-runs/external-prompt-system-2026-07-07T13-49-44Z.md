# External Review: c2-parallel-merge-guardrail (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git — branch `c2-parallel-merge-guardrail`

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/c2-parallel-merge-guardrail/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change in system mode)
- Prior internal findings still open: 0 — the in-context system review
  (`review-system-2026-07-07T13-44-44Z.json`) found 2 WARNING + 1 SUGGESTION, all resolved via
  `address-reviews-2026-07-07T13-45-52Z.json` (CLAUDE.md applied-state entry; orbit-engine-gates
  baseline Purpose written; plan-doc status header).
- Prior external findings still open: none (no prior external review in this mode).
- Resolved since last review: proposal-mode cadence resolved 12 findings across 2 iterations
  before apply (see `review-proposal-*.json` + `address-reviews-*.json`), including 2 CRITICAL
  from the fresh pass: a MODIFIED delta block that silently dropped 3 baseline scenarios, and a
  false guard-coverage model (the generated archive workflows never invoke `orbit archive`;
  coverage was respec'd as a two-layer model).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What the change does (orientation)

C2 fixes the archive parallel-merge silent data-loss bug (repo-root
`openspec-parallel-merge-plan.md`, Phase 0): `## MODIFIED Requirements` blocks are absolute
snapshots authored against a possibly-stale baseline, and archiving wholesale-replaces the live
requirement (`nameToBlock.set` in `src/core/specs-apply.ts`), silently dropping sibling changes'
edits. The change adds: `base_fingerprints` in `.openspec.yaml` (SHA-256 of each
MODIFIED/REMOVED/RENAMED requirement's baseline block, captured at authoring); the top-level
`orbit fingerprint <change>` stamp/check command (`src/commands/fingerprint.ts`,
`src/core/fingerprints.ts`); a refuse-by-default divergence guard in `buildUpdatedSpec` with
`orbit archive --override-fingerprints` as the deliberate escape; and workflow-template updates
(capture step in propose/continue/ff; a Step 3.45 divergence inflection prompt in archive-change;
a per-change check in bulk-archive — the generated workflows apply deltas agent-driven, so the
check step is their only guard layer, per the two-layer coverage model in design.md).

## What to read for THIS review (--as system)

- orbit/changes/c2-parallel-merge-guardrail/proposal.md, design.md, tasks.md, specs/
- The change's commit range: `git diff 818951a..HEAD` (818951a = review-proposal gate PASSED;
  the apply + system-review commits follow it)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer; currently absent
  in this repo — note and move on)
- Code paths touched: src/core/fingerprints.ts, src/core/specs-apply.ts, src/core/archive.ts,
  src/commands/fingerprint.ts, src/cli/index.ts, src/core/artifact-graph/types.ts,
  src/utils/change-metadata.ts, src/core/templates/workflows/{propose,continue-change,ff-change,archive-change,bulk-archive-change}.ts,
  test/core/fingerprints.test.ts, test/core/templates/skill-templates-parity.test.ts

Useful commands: `npm install && npm run build && npm test` (expect 1605/1605),
`node bin/orbit.js validate c2-parallel-merge-guardrail --strict`,
`node bin/orbit.js fingerprint c2-parallel-merge-guardrail --check`.

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (run your
   own equivalent of upstream verify-change against the delta specs' requirements/scenarios).
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects,
   side-effect additions (e.g. `buildUpdatedSpec`'s new options param, `readChangeMetadata`
   consumers, the parity-test hash re-pins).
3. **Surface Walk** — every CLI / MCP / public-function surface in `orbit/specs/` still coherent?
   Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV. (Absent in this repo → note and skip.)
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end.
   (Absent → skip; but DO walk the archive flow end-to-end as the de-facto critical path: stamp →
   diverge → refused archive → reconcile → clean archive.)
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.

Correctness probes worth your attention (independent take encouraged): the hashing rule's
normalization (verbatim `raw`, `\r\n?`→`\n` only); the touched-set derivation
(RENAMED FROM ∪ REMOVED ∪ MODIFIED-mapped-through-RENAMED); the idempotent-write skip and its
precedence over `unverified`; the guard's `missing` deferral to existing not-found errors;
exit-code semantics of `--check`; whether the workflow bodies' check step actually closes the
agent-driven loophole (the sync-specs subagent edits baseline directly); YAML round-trip of
requirement-name keys; the scratch e2e claims in `.orbit-runs/apply-2026-07-07T13-41-53Z.json`.

## Output format — write to:

`orbit/changes/c2-parallel-merge-guardrail/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g. `2026-07-07T15-30-00Z`. Pick a
fresh timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: c2-parallel-merge-guardrail (iteration 1)

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

<Optional: overall impression, broader concerns. Omit the whole `## Notes` section if you have nothing to add.>
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
   git add orbit/changes/c2-parallel-merge-guardrail/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): c2-parallel-merge-guardrail

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
