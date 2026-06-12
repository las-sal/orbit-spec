# External Review: b3-net-new-workflows (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git

## Project context (read first)

- `CLAUDE.md` — handoff orientation (if present)
- `orbit/project.md` — project goals + stack (if present)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` — named callers worth validating from (if present)
- `orbit/lenses/critical-paths.md` — user flows worth walking end-to-end (if present)
- `orbit/changes/b3-net-new-workflows/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles

## Cycle context

- Iteration: 1 (first external review for this change; first system-mode review of any kind)
- Prior internal findings still open: 0 — two internal PROPOSAL-mode review iterations ran
  pre-implementation (iter 1: 2 CRITICAL / 6 WARNING / 4 SUGGESTION, fresh-context; iter 2:
  1 SUGGESTION) and all 13 findings were resolved via address-reviews (see
  `review-proposal-*.json` + `address-reviews-2026-06-12T16-42-57Z.json` in `.orbit-runs/`).
  Notable resolved themes worth re-checking against the IMPLEMENTATION: audit-drift's
  persistence model was aligned to the baseline emit spec (standalone-only emits; no separate
  JSON in library/pre-archive contexts) in both the spec delta AND the relocated skill body —
  verify the alignment actually landed everywhere; overlay-era citations were scrubbed
  (D-b3-1) — hunt for any the greps missed.
- Prior external findings still open: none (first external pass)
- Resolved since last review: n/a (no prior external)

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What this change is (orientation)

B3 relocates orbit's four editorial workflows (review, review-external, address-reviews,
audit-drift) from the retired-overlay repo into this fork as first-class generated workflows:
4 new modules under `src/core/templates/workflows/` ({review,review-external,address-reviews,
audit-drift}.ts — inline-TS skill bodies + 7 reference files + thin launcher commands),
registration 11→15 across `ALL_WORKFLOWS` / `SKILL_NAMES` / `COMMAND_IDS` /
`getSkillTemplates`+`getCommandTemplates` / `WORKFLOW_TO_SKILL_DIR`, four ADDED capability
spec deltas under the change's `specs/`, test growth 1504→1543, and the
`orbit/specs/orbit-run-summary-emit/spec.md` Purpose-stub restoration. Constraints the
implementation claims to honor: D13 (inline-TS literals), D14 (thin launchers, <600 chars),
D15 (full surface always), D-b3-1 (no overlay-era citations in shipped content), D-b3-2
(prose-native only — no engine/artifact-graph awareness), D-b3-3 (spec-ownership split with
baseline `orbit-run-summary-emit` preserved). See `design.md` (incl. "Amendments from iter-1
proposal review") and `explore.md` in the change directory.

## What to read for THIS review (--as system)

- orbit/changes/b3-net-new-workflows/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD (estimate <change-start> from git log)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched by the change (cohesion + surface walk): src/core/templates/workflows/,
  src/core/templates/skill-templates.ts, src/core/shared/skill-generation.ts,
  src/core/shared/tool-detection.ts, src/core/profiles.ts, src/core/profile-sync-drift.ts,
  test/core/templates/, test/core/shared/, test/commands/config-profile.test.ts

## What to look for

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (run
   your own equivalent of upstream verify-change). Note: tasks.md group 6 is deliberately
   unchecked (archive-time work); groups 1–5 claim complete.
1. **Baseline Compliance** — does this change break any archived `orbit/specs/` requirement?
   Pay particular attention to `orbit-run-summary-emit` (the four bodies' emit prose must match
   its requirements) and `orbit-skill-generation` (reference handling, metadata pass-through).
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects,
   side-effect additions. Did the 11→15 growth miss an enumeration somewhere?
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in `orbit/specs/` still
   coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in `orbit/lenses/perspectives.md`,
   simulate the caller's POV. (Lens files are currently absent in this repo; skip if absent.)
5. **Critical-Path Scan** — for each flow in `orbit/lenses/critical-paths.md`, walk end-to-end.
   (Skip if absent.)
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.
   For this change specifically: overlay-era residue in the four skill bodies + 7 reference
   files (`/opsx:`, `openspec/` working-dir paths, overlay repo/issue/change-name citations,
   `orbit-status` mentions), and consistency between each skill body and its capability spec
   delta in `orbit/changes/b3-net-new-workflows/specs/`.

## Output format — write to:

`orbit/changes/b3-net-new-workflows/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: b3-net-new-workflows (iteration 1)

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
   git add orbit/changes/b3-net-new-workflows/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): b3-net-new-workflows

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above) and the user will commit it manually.
