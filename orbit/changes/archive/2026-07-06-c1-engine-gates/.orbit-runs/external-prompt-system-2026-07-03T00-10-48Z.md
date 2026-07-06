# External Review: c1-engine-gates (system mode, iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. This is a
**system-mode** review: the change is IMPLEMENTED, so this is **code-vs-spec
verification** (does the code faithfully implement the specs? does it break any
baseline? is it cohesive?), NOT a proposal review. Be thorough and skeptical;
the authoring AI wrote every line and is heavily anchored — your independent
read of the actual code against the contract is the value. Don't be charitable.

## Repo

https://github.com/las-sal/orbit-spec.git

**Check out the `c1-engine-gates` branch** — this change lives there, not on
`main`. After cloning/pulling: `git checkout c1-engine-gates`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read first; explains the fork, the 6-phase
  plan, and that C1 makes the engine review-aware). Note the post-C1 state block.
- `orbit/lenses/perspectives.md` / `orbit/lenses/critical-paths.md` — NOT present
  in this repo; skip Passes 4 and 5.
- `orbit/changes/c1-engine-gates/.orbit-runs/` — iteration history (proposal arc:
  5 internal + 3 external reviews; system arc: 1 internal in-context review so far).

## Background (this is a fork; C1 is implemented)

orbit-spec is a self-contained hard fork of `@fission-ai/openspec@1.3.1`. C1
makes the engine (`src/core/artifact-graph/`) **review-aware**: a schema `gates:`
list with a CLOSED two-kind set — `tracked` (checkbox arithmetic; upstream
`apply` normalized in) and `reviewed` (convergence COMPUTED from the `.orbit-runs/`
audit trail: ordered cadence slots + resolution-over-every-pass + per-gate
`confirm` predicate) — plus a v1 timestamp-token freshness rule, single-voiced
canonical-next + a position readout, and gate inflection prompts (apply-parity:
surfaced + recorded via `gate_overridden`, never hard-blocking). Gate state is a
pure function of on-disk artifacts (no new state files). `spec-driven` is now
version 2 (`review-proposal → apply → review-system`). It is fully implemented
(21/21 tasks) and dogfooded — the tool ran its own gate model on this very change.

## Cycle context

- Iteration: 1 (FIRST external system-mode review — sets the independent baseline).
- Prior internal findings still open: **0**. One internal system review
  (`review-system-2026-07-02T23-51-05Z.json`, in-context) found 0 CRITICAL / 1
  WARNING / 3 SUGGESTION — all resolved (`address-reviews-2026-07-03T00-06-30Z.json`,
  0 deferred / 0 escalated). What it caught (verify these landed correctly and
  introduced no regressions):
  - **W1** — the `no-new-findings` convergence check compared an independent pass's
    findings against prior INDEPENDENT passes only; spec says "same-gate prior
    passes". Fixed in `gates.ts` (`evaluateReviewed`) to compare against all prior
    same-gate passes; a discriminating test was added.
  - **S1-S3** (spec-doc gaps, now in `specs/orbit-engine-gates/spec.md`): apply
    reference-validation tightening; `blocked-by-gate` is entry-gated
    (`complete===0`); the superseded-gate concept + position-readout render tokens.
- Prior external findings still open: **0** (this is the first external system pass).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as system)

- **The implementation diff**: `git diff main..HEAD -- src/ schemas/` (16 files,
  +761/-73). The engine core is:
  - `src/core/artifact-graph/types.ts` — GateSchema, closed kind/confirm enums, cadence vocabulary, NormalizedGate
  - `src/core/artifact-graph/schema.ts` — `normalizeGates` (apply:→tracked gate), gate validation (kinds/references/cycles/double-apply)
  - `src/core/artifact-graph/trail.ts` (NEW) — `.orbit-runs/` trail reader (token parsing, reviewer_class inference, external-markdown parsing)
  - `src/core/artifact-graph/gates.ts` (NEW) — gate-state computation (tracked + reviewed convergence: clauses a/b/c), `isPassStale`, canonical-next, position readout, superseded-gate logic
  - `src/core/artifact-graph/instruction-loader.ts` — ChangeContext.schema, gate rows/position/next_command in status, applyRequires via normalized gate
  - `src/commands/workflow/{instructions,status,shared}.ts` — blocked-by-gate (entry-gated), gate rows text output
  - `schemas/spec-driven/schema.yaml` — version 2 gates
  - `src/core/templates/workflows/{review,review-external,apply-change,archive-change,onboard,audit-drift}.ts` — gate-aware body edits
- **The specs (the contract)**: `orbit/changes/c1-engine-gates/specs/orbit-engine-gates/spec.md` (PRIMARY), plus `specs/{orbit-run-summary-emit,orbit-review,orbit-review-external,orbit-conventions,orbit-archive-modifications}/spec.md`.
- **Baselines** (for Pass 1 compliance): `orbit/specs/<capability>/spec.md`.
- **Tests**: `test/core/artifact-graph/gates.test.ts` + siblings (does coverage match the spec's edge cases?).
- Run `node bin/orbit.js validate c1-engine-gates --strict` and `npx vitest run` if your environment allows (suite should be 1569 green).

## What to look for (7 system-mode passes)

0. **verify-change-style structural check** — are all 21 `tasks.md` items genuinely implemented in code (don't trust checkboxes)? Does every REQUIREMENT in `orbit-engine-gates/spec.md` have faithful implementation? Design adhered (`design.md`)?
1. **Baseline Compliance** — does the change break any archived `orbit/specs/` requirement? Especially: does the new gate validation (now running on ANY `apply:` schema) or routing apply-config through `normalizeGates` change upstream apply-only behavior?
2. **Cohesion** — callers/dependents outside the change's own edits. `ChangeContext` gained a required `schema` field; `ApplyInstructions` gained `state: 'blocked-by-gate'` + `gate`/`next_command`. All construction/consumer sites updated? Signature drift?
3. **Surface Walk** — `orbit status` / `orbit instructions apply` coherent per the spec (JSON carries `gates[]`/`position`/`next_command`; `blocked-by-gate` + gate + next_command)?
4. **Perspective Reviews** — SKIP (no `orbit/lenses/perspectives.md`).
5. **Critical-Path Scan** — SKIP (no `orbit/lenses/critical-paths.md`).
6. **Drift / Residue** — the highest-value pass here: does `evaluateReviewed` (gates.ts) actually implement clauses (a) ordered slots with strictly-increasing tokens / (b) resolution over EVERY pass / (c) per-gate confirm (`no-new-findings` vs `findings-resolved`, incl. the same-gate new-finding matching by trimmed title + repo-relative path)? Does `isPassStale` match the freshness rule? Do `normalizeGates` + validation match the gate-declaration requirement? Any spec requirement with NO implementation, or code behavior in NO spec? Edge cases: same-second tokens, multiple independent passes, external-vs-internal independent, empty/malformed trail files.

## Output format — write to:

`orbit/changes/c1-engine-gates/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp, ISO hyphenated, e.g. `2026-07-03T09-15-00Z`.
Pick a fresh timestamp so this file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: c1-engine-gates (system mode, iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Repeat per finding. Use `None.` if no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. `None.` if none.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. `None.` if none.)

## Notes

<Optional: overall impression. Omit the section if nothing to add.>
```

If your environment doesn't support file writes, output the markdown directly
and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat (every
   severity section, every `### Title`, every `**File**:` / `**Description**:`).
   Do NOT abbreviate — the chat output is the immediately-visible read.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/c1-engine-gates/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): c1-engine-gates

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — or state explicitly that you
   could NOT (chat-only fallback), so the human never has to infer whether they
   reached the repo.
