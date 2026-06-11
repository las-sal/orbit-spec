# External Review: b2-grow-generator (iteration 2)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `main`; if you have local access,
the repo is at `/Users/sal/code/orbit-spec`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation: self-contained hard fork of
  `@fission-ai/openspec@1.3.1`; B1 archived (six baselines live in
  `orbit/specs/`); this change is phase **B2** (grow the skill generator:
  multi-file `references/` emission + frontmatter metadata pass-through, D7).
- `orbit/explore/fork-and-orbify/explore.md` — fork-level decisions D1–D15.
- `orbit/changes/b2-grow-generator/explore.md` — the change's decision record
  (D-b2-1 as amended …D-b2-6). The artifacts should be consistent with it.
- `orbit/architecture/openspec-1.3.1-architecture.md` — engine deep-dive.
- NOT present: `orbit/lenses/`, `orbit/project.md`, `*_convention.md` at root.
  README is still upstream's (tracked: issue #1; this change's Impact notes the
  inheritance).

## Cycle context

- Iteration: 2 (iter-1 external reviewer: GPT-5 Codex)
- Prior findings still open: 0. Three completed review cycles, 21 findings,
  all resolved — read the audit trail in
  `orbit/changes/b2-grow-generator/.orbit-runs/`:
  1. Internal proposal review iter 1 (0C/3W/2S) — wrong baseline cite,
     metadata-defaults ambiguity, stale CLAUDE.md line, implicit empty-dir
     removal, missing transition test.
  2. External iter 1, GPT-5 Codex (1C/4W/3S) — the CRITICAL: plain `update`'s
     current-stamps short-circuit would bypass reference reconciliation;
     resolved by growing smart-detection with reference-set drift. Also:
     overlay schema source contradicts baselines (now "reconciled, not
     verbatim"); init re-run deletion semantics (D-b2-1 amended:
     reconciliation is a shared-writer property, both update generation paths
     included); name-validation/symlink containment; write-before-prune
     ordering; metadata order/YAML tests; CLAUDE.md staleness.
  3. Fresh-context internal review iter 2 (0C/2W/6S) — verified all 13 prior
     resolutions landed; found post-remediation seams (proposal.md hadn't
     absorbed the smart-detection change; explore.md D-b2-1 lacked its
     amendment note) + 6 precision items. All fixed.
- This is the LAST planned gate before `/orbit:apply`. The highest-value work:
  (a) anything ALL THREE prior reviewers missed; (b) verify the iter-1
  external resolutions and the seam-fixes landed completely; (c) implementer's
  dry-run — walk tasks.md as if you had to build it tomorrow and flag anything
  underdetermined.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Scope facts (calibration, not suppression)

PRE-APPLY stage: the specs describe FUTURE generator behavior; nothing is
implemented. Do NOT flag "not implemented" — flag spec/design flaws,
ambiguities, contradictions, and false claims about CURRENT code. Verifiable
current-code surfaces: `src/core/templates/types.ts`,
`src/core/shared/skill-generation.ts`, `src/core/init.ts`,
`src/core/update.ts` (note: TWO generation paths — refresh loop and
`upgradeLegacyTools()`), `src/core/profile-sync-drift.ts`,
`src/core/templates/workflows/archive-change.ts`. Ratified decisions are
calibration, not findings: D13 (inline-TS), D14 (thin launcher commands),
D15 (full surface installs), D-b2-1 as amended (shared-writer reconciliation,
remove-unknown), D-b2-2 (disciplines stay inline; consolidation reversed).
Migration source for the one content file:
`https://github.com/las-sal/openspec-orbit` →
`.claude/skills/openspec-archive-change/references/archive-summary-schema.md`
(the change deliberately RECONCILES it to the baselines rather than copying
verbatim — the source's three shape conflicts are documented in the delta).

## What to read for THIS review (--as proposal)

- `orbit/changes/b2-grow-generator/proposal.md`, `design.md`, `tasks.md`,
  `explore.md`
- `orbit/changes/b2-grow-generator/specs/orbit-skill-generation/spec.md`
  (ADDED capability — 5 requirements)
- `orbit/changes/b2-grow-generator/specs/orbit-archive-modifications/spec.md`
  (ADDED requirement against the existing baseline)
- `orbit/specs/<capability>/spec.md` — the six B1 baselines, for delta
  consistency (esp. `orbit-archive-modifications`, `orbit-conventions`)
- `orbit/changes/b2-grow-generator/.orbit-runs/` — the three prior review
  cycles' findings + resolutions

## What to look for

1. **Structure & Delta Integrity** — artifacts present; deltas valid;
   `node bin/orbit.js validate b2-grow-generator --strict` passes (claimed).
2. **Internal Coherence** — proposal ↔ design ↔ specs ↔ tasks ↔ explore.md
   after THREE rounds of remediation edits; count/label consistency; no scope
   creep beyond the one-file payload.
3. **Cross-Doc Coherence** — CLAUDE.md accurate; D-b2 decisions consistent
   with fork-level D13/D14/D15.
4. **Archive Consistency** — deltas don't contradict the six baselines.
5. **Codegen Readiness** — could a fresh AI implement from these specs alone?
   Reconciliation edge cases, validation failure behavior, detection
   semantics, per-tool behavior, delivery-mode interplay.
6. **Gap Hunt** — unstated assumptions, error paths, state transitions
   (delivery switches, tool add/remove, partial failures, concurrent stamps).
7. **Drift Hunt** — overlay/opsx/openspec-era vocabulary; stale references;
   contradictions with ratified decisions.
8. **Inline Review Marker Residue** — unresolved `@review:` markers.
9. **Pre-Handoff Sweep** — anything else before implementation starts.

## Output format — write to:

`orbit/changes/b2-grow-generator/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g.
`2026-06-11T16-30-00Z`. Pick a fresh timestamp so this file doesn't overwrite
the iteration-1 findings.)

Use this exact markdown structure:

```markdown
# External Review: b2-grow-generator (iteration 2)

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
   findings file, output the COMPLETE findings markdown in this chat: every
   severity section, every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize. The file remains
   the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/b2-grow-generator/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 2): b2-grow-generator

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
and the user will commit it manually.
