# External Review: b2-grow-generator (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec (branch `main`; if you have local access,
the repo is at `/Users/sal/code/orbit-spec`)

## Project context (read first)

- `CLAUDE.md` — handoff orientation: orbit-spec is a self-contained hard fork of
  `@fission-ai/openspec@1.3.1`; B1 (relocation) is archived; this change is
  phase **B2** of the D9 program (grow generator: `references[]` + metadata
  pass-through, D7).
- `orbit/explore/fork-and-orbify/explore.md` — fork-level decisions D1–D15
  (esp. D7 the B2 mandate, D13 inline-TS, D14 thin launchers, D15 full-surface
  installs, D11 + Claude-primacy refinement).
- `orbit/changes/b2-grow-generator/explore.md` — the change's own exploration
  record with decisions **D-b2-1…6** (update convergence; disciplines
  consolidation REVERSED; inline-TS representation; one-file content scope;
  no-fallback metadata; three-layer test growth). This is the change's design
  provenance — the proposal/design/specs should be consistent with it.
- `orbit/architecture/openspec-1.3.1-architecture.md` — engine deep-dive (the
  template→generation→adapter pipeline this change grows).
- **Baselines now exist**: `orbit/specs/` holds 6 archived capabilities from
  B1. This is the repo's first change with real baselines — delta-consistency
  checks are live for the first time.
- NOT present: `orbit/lenses/`, `orbit/project.md`, `*_convention.md` at root.
  README is still upstream's (tracked: issue #1).

## Cycle context

- Iteration: 1 (first external review for this change; proposal mode)
- Prior internal findings still open: 0 — an in-context proposal-mode review
  (iter 1, 0 CRITICAL / 3 WARNING / 2 SUGGESTION) was fully resolved by
  address-reviews iter 1 (see `.orbit-runs/review-proposal-*.json` and
  `address-reviews-*.json`). Resolved: wrong baseline cite for the schema
  field list; unspecified metadata-defaults behavior; stale CLAUDE.md
  disciplines line; implicit empty-dir removal; missing transition test.
- NOTE: that internal review was the authoring AI reviewing its own
  just-written artifacts — maximum anchoring. Your independence is the point
  of this pass.

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## Scope facts (calibration, not suppression)

This change is at the **pre-apply (proposal) stage**: the specs describe
FUTURE generator behavior; none of it is implemented yet. Do NOT flag
"not implemented" — flag spec/design flaws, ambiguities, contradictions, and
false claims about CURRENT code. Claims you can verify against source: the
generator's current single-file emission (`src/core/shared/skill-generation.ts`,
`src/core/init.ts`, `src/core/update.ts`), the hardcoded 3-key metadata
emission, `SkillTemplate`'s shape (`src/core/templates/types.ts`), and the
archive skill body's dangling `references/archive-summary-schema.md` cite
(`src/core/templates/workflows/archive-change.ts`). The migration source for
the one content file is `https://github.com/las-sal/openspec-orbit` →
`.claude/skills/openspec-archive-change/references/archive-summary-schema.md`
(if you can't access it, note that and review the rest).

## What to read for THIS review (--as proposal)

- `orbit/changes/b2-grow-generator/proposal.md`
- `orbit/changes/b2-grow-generator/design.md`
- `orbit/changes/b2-grow-generator/tasks.md`
- `orbit/changes/b2-grow-generator/specs/orbit-skill-generation/spec.md` (ADDED capability)
- `orbit/changes/b2-grow-generator/specs/orbit-archive-modifications/spec.md`
  (ADDED requirement against an existing baseline — the repo's first)
- `orbit/changes/b2-grow-generator/explore.md` (decision provenance)
- `orbit/specs/<capability>/spec.md` — archived baselines, for delta
  consistency (esp. `orbit-archive-modifications`, `orbit-conventions`)

## What to look for

1. **Structure & Delta Integrity** — required artifacts present;
   ADDED/MODIFIED deltas valid; `node bin/orbit.js validate b2-grow-generator
   --strict` passes (claimed green).
2. **Internal Coherence** — proposal ↔ design ↔ specs ↔ tasks ↔ explore.md
   alignment; count/label consistency; no scope creep beyond D-b2-4's
   one-file payload.
3. **Cross-Doc Coherence** — `CLAUDE.md` still accurate given this change;
   the D-b2 decisions consistent with fork-level D13/D14/D15.
4. **Archive Consistency** — the ADDED requirements don't contradict the six
   B1 baselines (check `orbit-archive-modifications`' new requirement against
   its baseline's `Archive run summary written`, and `orbit-skill-generation`
   against `orbit-conventions`' distribution-model/disposition requirements).
5. **Codegen Readiness** — could a fresh AI implement from these specs alone?
   No implicit requirements, no decisions left to codegen, no ambiguity
   (e.g., reconciliation edge cases, metadata ordering, delivery-mode
   interplay, per-tool behavior).
6. **Gap Hunt** — unstated assumptions, error paths, state transitions
   (init vs update vs delivery switches; skills-only/commands-only modes;
   what happens on partial-write failure?).
7. **Drift Hunt** — old vocabulary (overlay/opsx/openspec-era), stale
   references, contradictions with ratified decisions.
8. **Inline Review Marker Residue** — any unresolved `@review:` markers in
   the change's artifacts.
9. **Pre-Handoff Sweep** — anything else before implementation starts.

## Output format — write to:

`orbit/changes/b2-grow-generator/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format with hyphens, e.g.
`2026-06-11T16-30-00Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: b2-grow-generator (iteration 1)

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
   content as the file: every severity section, every `### Title` entry, every
   `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize.
   The file remains the canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/b2-grow-generator/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 1): b2-grow-generator

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, just output the findings markdown in this chat
and the user will commit it manually.
