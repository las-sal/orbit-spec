# Handoff: c2-parallel-merge-guardrail (pre-propose)

You are picking up an OpenSpec change that has been **explored and designed but not yet
proposed**. Your job is to review the exploration and then run `/orbit:propose
c2-parallel-merge-guardrail` (or push back on the design first if something is wrong). This
document is self-contained orientation; the **authoritative design record is
`orbit/explore/c2-parallel-merge-guardrail/explore.md`** — read it in full before acting.

---

## 1. Repo orientation

- **orbit-spec** is a self-contained hard fork of `@fission-ai/openspec@1.3.1`. Read `CLAUDE.md`
  (repo root) first — it explains the fork, the 6-phase program, and the current state.
- **This repo IS the tool.** The engine is vendored TypeScript under `src/`; the AI-facing
  workflows are generated from `src/core/templates/workflows/*.ts` into `.claude/skills/` (the
  `.claude/` surface is gitignored — regenerate with `npm run build && node bin/orbit.js update
  --force`).
- **Build/test**: `npm run build` (→ `tsc`), `npm test` / `npx vitest run`. Baseline as of C1:
  **1576 tests green**. `node bin/orbit.js validate <change> --strict` validates a change.
- **The canonical flow** (now engine-computed after C1): `propose → review(proposal) → apply →
  review(system) → archive`, gated by the C1 gate model.

## 2. Where C2 stands

- **Program position**: C2 is the **final phase** of the fork's 6-phase plan (`explore.md` D9):
  `A1 → B1 → B2 → B3(parity) → C1 ✅ → C2`. C1 (engine gates/freshness) is COMPLETE, archived
  (`orbit/changes/archive/2026-07-06-c1-engine-gates/`), and **merged to `main`** (PR #6).
- **C2 status**: exploration **complete** — 8 decisions, 0 open questions — living in
  `orbit/explore/c2-parallel-merge-guardrail/explore.md`. It has NOT been proposed yet, so it does
  NOT appear in `orbit list` (that happens when `/orbit:propose` moves the staging dir into
  `orbit/changes/`).
- **Baseline**: `orbit/specs/` currently holds **12 capabilities** (C1 added `orbit-engine-gates`).

## 3. The problem C2 fixes (understand this before proposing)

The archive **parallel-merge data-loss bug** (fork Q8; full analysis in the repo-root
`openspec-parallel-merge-plan.md`). When two active changes touch the same spec requirement,
archiving the second **silently overwrites** the first and drops scenarios.

**The mechanism — and it is NOT a sequencing bug.** Archiving already sequences correctly: when
change B archives, `buildUpdatedSpec` (`src/core/specs-apply.ts`) reads the *current* live baseline
as its target, which already contains change A's edits (target = `BASE+A`). The bug is that a
`## MODIFIED Requirements` block is an **ABSOLUTE snapshot of the whole requirement**, authored
against a **stale base** (`BASE`, before A landed), applied via `nameToBlock.set(key, mod)` — a
**wholesale replace**. Setting `req = [BASE + scenarioB]` onto `BASE+A` overwrites A's scenario.

> Absolute values don't compose under sequencing (`x=5; x=6 → 6`). Relative ops do (`+2; +3 → +5`).
> orbit's `MODIFIED` delta is absolute + base-unaware, so a stale snapshot clobbers.

Two ways to make a delta compose: (1) make it *relative* (scenario-level ops — Phase 2, deferred);
(2) restore *base-awareness* so divergence is detectable (Phase 0 — **this change**).

## 4. The design (decisions — explore.md is authoritative)

C2 scope = **Phase 0: base fingerprint + detect-and-block.** Eight decisions (D-c2-1..8):

1. **D-c2-1** — Phase 0 first; Phase 1 (3-way merge/rebase) and Phase 2 (scenario granularity) are
   explicit follow-ups. **Guarantee: no *SILENT* loss** — loss is possible only via a deliberate,
   recorded override, never accidentally. ("No loss at all" needs the Phase-1 merge.)
2. **D-c2-2** — base fingerprints stored in **`.openspec.yaml`** (extend `ChangeMetadataSchema` in
   `src/core/artifact-graph/types.ts` with an optional `base_fingerprints:` map keyed
   capability → requirement-name → hash).
3. **D-c2-3** — captured at **propose** (scaffold writes `{schema, created}`; propose back-fills
   `base_fingerprints` after generating the delta specs, reading each touched requirement's current
   baseline via the fence-aware `extractRequirementsSection`).
4. **D-c2-4** — divergence at archive fires **C1's apply-parity inflection prompt**
   (reconcile / proceed-anyway / abort); `proceed anyway` records
   `fingerprint_overridden: {capability, requirement, base_hash, live_hash}` in the archive run
   summary (mirrors C1's `gate_overridden`).
5. **D-c2-5** — reconcile is **guided-manual** for Phase 0: the CLI prints the `base ▸ live` diff;
   the user hand-edits the delta and re-stamps via a propose `--refresh`. **Known footgun**: a blind
   re-stamp re-opens the hole (the guard checks `fingerprint == live_hash`, not "delta incorporated
   the change") — accepted for Phase 0 because it's deliberate-after-warning, and it is exactly what
   the Phase-1 merge removes.
6. **D-c2-6** — store the **hash only** (raw base text is a Phase-1 concern; don't pre-store — it
   would bloat `.openspec.yaml`).
7. **D-c2-7** — capture at **propose/continue/ff**; a MODIFIED/REMOVED/RENAMED requirement with **no
   stored fingerprint WARNS** at archive ("can't verify") — missing-fingerprint must not be a
   silent-loss loophole.
8. **D-c2-8** — hash the requirement block **verbatim with line-ending normalization only** (reuse
   the block `raw` from `extractRequirementsSection`; normalize `\r\n?` → `\n`, nothing else).

**Considered & out**: scenario-level granularity as the C2 *core* (it's the follow-up — bigger
surface, doesn't alone guarantee no-loss, and wants Phase-0 detection underneath regardless).

## 5. Code touchpoints (where the implementation will land — for the specs/tasks)

- `src/core/artifact-graph/types.ts` — `ChangeMetadataSchema` (add `base_fingerprints`).
- `src/utils/change-metadata.ts` — `writeChangeMetadata` / `readChangeMetadata` (persist the field).
- `src/core/specs-apply.ts` — `buildUpdatedSpec`: the MODIFIED path (`nameToBlock.set(key, mod)`) is
  where the guard goes — recompute the live hash for each MODIFIED/REMOVED/RENAMED requirement and
  compare to the stored fingerprint before mutating.
- `src/core/archive.ts` — calls `buildUpdatedSpec` (~line 228); the inflection prompt + override
  recording live in the archive workflow body (`src/core/templates/workflows/archive-change.ts`,
  which already has C1's `review-system` gate prompt at "NEW Step 3.4" — a model to copy).
- `src/core/parsers/requirement-blocks.ts` — `extractRequirementsSection` extracts the requirement
  `raw` to hash (it is now **fence-aware** — I just fixed a fence-unaware bug there during C1's
  archive; a plain read of a requirement block is reliable).
- Capture point: the **propose/continue/ff workflow bodies** (`src/core/templates/workflows/`) need
  a step that computes + writes fingerprints after spec generation.

## 6. What C1 established that C2 rides on

C1 shipped the machinery C2 reuses — do NOT reinvent it:
- **Apply-parity inflection prompt** + `gate_overridden` in the archive body (Step 3.4/3.5) — the
  exact pattern D-c2-4 mirrors for `fingerprint_overridden`.
- **`.orbit-runs/` audit trail** + the run-summary emit spine.
- **The review cadence** (`review-proposal` / `review-system` gates) — C2's own proposal + apply
  will run through it. The `review-system` external slot is empirically strong: on C1 it caught
  2 CRITICAL bugs the in-context passes missed. Budget for a real external review.
- **The fence-aware parser** (my C1-archive fix) — C2 relies on clean requirement extraction.

## 7. Your task

1. **Read** `orbit/explore/c2-parallel-merge-guardrail/explore.md` (authoritative) + this doc +
   `openspec-parallel-merge-plan.md` + skim the touchpoint files in §5.
2. **Sanity-check the design** — if a decision looks wrong, raise it before proposing (the whole
   point of a handoff is fresh eyes). Note especially: is `.openspec.yaml` the right home vs a
   sidecar? is the missing-fingerprint→warn (D-c2-7) strict enough? is the D-c2-5 footgun acceptable?
3. **Run `/orbit:propose c2-parallel-merge-guardrail`.** In consume-mode it reads `explore.md` as
   authoritative, prompts on any Open questions (there are none), generates
   `proposal.md` / `design.md` / `specs/<capability>/spec.md` / `tasks.md`, and **moves** the staging
   dir into `orbit/changes/c2-parallel-merge-guardrail/`.
4. Then follow the cadence: `/orbit:review --as proposal` (+ external) → address-reviews → apply →
   `/orbit:review --as system` (+ external) → archive.

## 8. State / gotchas

- **Branch**: the work so far is on `main` at the C1 merge (`4aba73c`). The exploration files
  (`orbit/explore/c2-parallel-merge-guardrail/`) may be **uncommitted** — confirm with `git status`.
  If you pull this repo and the exploration dir isn't present, it wasn't pushed; ask the human to
  commit+push the exploration (on a `c2-parallel-merge-guardrail` branch, since committing to `main`
  directly is discouraged).
- **Recursion to expect**: C2's *own* delta will be the **first change verified by the fingerprint
  guard C2 defines** — a natural dogfood, but sequence-sensitive (the guard must exist before you
  archive C2). The apply order in `tasks.md` should land the guard + capture together.
- **Scope discipline**: resist scope creep into Phase 1 (3-way merge) or Phase 2 (scenario
  granularity). They are explicitly deferred. C2 = detect + block + guided-manual reconcile.
- **Keep tests green**: 1576 is the contract; run `npm test` before/after substantive changes.
