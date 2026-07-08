> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: c2-parallel-merge-guardrail

## Premise

C2 is the final phase of the 6-phase fork program (D9): fix the **archive parallel-merge
data-loss bug** (fork Q8; upstream analysis in `openspec-parallel-merge-plan.md`).

**Mechanism** (grounded in code this session): archiving IS already sequenced — when change B
archives, `buildUpdatedSpec` (`src/core/specs-apply.ts`) reads the CURRENT live baseline as its
target, which already contains change A's edits (target = `BASE+A`). The bug is not sequencing;
it is that a `## MODIFIED Requirements` block is an **ABSOLUTE snapshot of the whole requirement**,
authored against a **stale base** (`BASE`, before A landed), and applied via
`nameToBlock.set(key, mod)` — a **wholesale replace**. Setting `req = [BASE + scenarioB]` onto
`BASE+A` overwrites A's scenario. Absolute values don't compose under sequencing (`x=5; x=6 → 6`);
relative ops do (`+2; +3 → +5`). The delta is absolute + base-unaware, so a stale snapshot clobbers.

The two ways to make a delta compose under the existing sequencing:
1. **Make the delta relative** — scenario-level ADD/MODIFY/REMOVE ops (sibling adds commute).
2. **Recover the relative diff from an absolute delta via a stored base** — 3-way merge (git diff3).

C2 targets the minimal guarantee: make **silent** data-loss impossible.

## Decisions

- **D-c2-1 (2026-07-06) — C2 = Phase 0 (base fingerprint + detect-and-block) first; Phase 1
  (rebase/3-way-merge) and Phase 2 (scenario-level granularity) are explicitly DEFERRED
  follow-ups.** Rationale: (a) only detection delivers the actual objective — "silent data-loss
  becomes impossible" — and it does so with the SMALLEST surface (archive guard + one capture
  point; NO delta-format change, NO AI-authoring change, NO migration of in-flight changes);
  (b) scenario-granularity alone reduces conflict FREQUENCY (sibling adds commute) but does NOT
  guarantee no-loss (same-scenario edits still clobber) — it still wants a base/detection layer
  underneath; (c) Phase 0's fingerprint is the load-bearing foundation Phases 1-2 build on, so
  it comes first regardless. Matches orbit's D-c1 "ship the safe minimal, escalate via cheap
  deltas" grain. **Guarantee scope (refined 2026-07-06):** Phase 0 promises no *SILENT* loss —
  data loss becomes possible only via a deliberate, recorded override (D-c2-4) or a re-stamp
  performed after the CLI showed the divergence diff (D-c2-5), never accidentally. "No loss at
  all" — auto-incorporating the sibling so the footgun disappears — requires the Phase-1 3-way merge.

- **D-c2-2 (2026-07-06) — Base fingerprints stored in `.openspec.yaml`.** Extend
  `ChangeMetadataSchema` (`src/core/artifact-graph/types.ts`, today `{schema, created}`) with an
  optional `base_fingerprints` field keyed capability → requirement-name → hash:
  ```yaml
  base_fingerprints:
    orbit-review-external:
      "Handoff preflight blocks unusable pull invocations": "sha256:…"
  ```
  Chosen over a new `meta.json` (plan's suggestion) — reuse the change-metadata file orbit
  already has and moves with the change into archive.

- **D-c2-3 (2026-07-06) — Fingerprints captured at propose.** The scaffold writes
  `{schema, created}`; once `/orbit:propose` generates the delta specs, it reads each
  MODIFIED/REMOVED/RENAMED requirement's CURRENT baseline block (via the now-fence-aware
  `extractRequirementsSection`), hashes it, and writes `base_fingerprints` back into
  `.openspec.yaml`. At archive, `buildUpdatedSpec` recomputes the live hash and compares —
  mismatch = the baseline diverged since authoring = a parallel change landed here.

- **D-c2-4 (2026-07-06) — Divergence uses C1's apply-parity inflection prompt, not a hard block**
  (resolves Q-c2-c). At archive, a fingerprint mismatch fires the SAME inflection-prompt pattern
  C1 built for gates: **reconcile / proceed-anyway / abort**. `proceed anyway` overwrites (drops
  the sibling) and records `fingerprint_overridden: {capability, requirement, base_hash, live_hash}`
  in the archive run summary — mirroring `gate_overridden`. Chosen over a hard block to stay
  consistent with C1's "the engine reports, the skill prompts, the user decides, the trail records"
  philosophy: silent loss is impossible; deliberate, recorded loss remains the user's call. (This is
  the truest reading of the plan's "silent data loss" objective.)

- **D-c2-5 (2026-07-06) — Reconcile is GUIDED-MANUAL for Phase 0; the residual footgun is accepted
  and explicitly motivates Phase 1** (resolves Q-c2-d). On `reconcile`: the CLI PRINTS the
  divergence — the requirement plus a `your base ▸ current live` diff so the user literally sees the
  sibling scenario they'd drop. The user hand-edits their MODIFIED delta to incorporate it, then
  re-stamps via reusing propose's capture (a `--refresh` / re-run over the touched specs) — NO heavy
  new command, no `/orbit:rebase` yet. **Known footgun**: a blind re-stamp (refresh without editing
  the delta) re-opens the exact hole, because the guard checks `fingerprint == live_hash`, not
  "delta incorporated the divergent content." Accepted for Phase 0 because it is only reachable AFTER
  the loud block + shown diff (a deliberate act, same category as proceed-anyway) — so "no silent
  loss" holds. The thing that REMOVES the footgun (auto-incorporating so you can't restamp-without-
  merging) is the Phase-1 3-way merge — which is now concretely justified, not just "nicer UX".

- **D-c2-6 (2026-07-06) — Store the hash only, not the raw base text** (resolves Q-c2-a). Phase 0
  detection needs only the hash; storing raw requirement bodies would bloat `.openspec.yaml`. Where
  the raw base lives (for the eventual 3-way merge) is a Phase-1 concern — deferred, not pre-stored.

- **D-c2-7 (2026-07-06) — Capture at propose/continue/ff; a missing fingerprint WARNS at archive**
  (resolves Q-c2-b). Fingerprint capture happens at every spec-authoring point (`/orbit:propose`,
  `/orbit:continue`, `/orbit:ff`), not just propose. A MODIFIED/REMOVED/RENAMED requirement with NO
  stored fingerprint (e.g. a hand-added delta) SHALL warn at archive ("can't verify — no base
  recorded") rather than silently pass — the missing-fingerprint case must not become a silent-loss
  loophole.

- **D-c2-8 (2026-07-06) — Hash the requirement block verbatim, with line-ending normalization only**
  (resolves Q-c2-e). Reuse the existing block `raw` from `extractRequirementsSection`, normalizing
  line endings (`\r\n?` → `\n`) but nothing else. Rationale: any real change to the baseline block —
  even "cosmetic" — is content the author did not see, so treating it as divergence is the safe
  default; only pure line-ending differences are noise worth normalizing away.

## Open questions

(none — architecture and Phase-0 implementation details all resolved. Anything finer is a
codegen-level decision for design.md / the specs.)

## Considered & out

- **Scenario-level granularity (Phase 2) as the C2 CORE — out (2026-07-06).** It's the right
  LONG-TERM ergonomic direction (makes the documented Windsurf/Kilo sibling-add case a non-event,
  commutative), but as the core it fails on three counts: far larger surface (new delta language +
  parser + `buildUpdatedSpec` + the propose/continue/review templates the AI authors from + docs +
  migration), it does NOT alone guarantee no-loss (same-scenario edits still clobber), and it wants
  Phase 0's detection underneath regardless. Reclassified as the C2 follow-up, not C2.

## References

- `openspec-parallel-merge-plan.md` (repo root) — upstream 4-phase layered-remediation analysis
  (Phase 0 detection → Phase 1 rebase → Phase 2 scenario granularity → Phase 3 spec graph); the
  source of the failure-mode repro (Windsurf vs Kilo Code) and design objectives.
- `src/core/archive.ts` (`buildUpdatedSpec` call at ~:228) — the archive→spec-update path.
- `src/core/specs-apply.ts` (`buildUpdatedSpec`; MODIFIED = `nameToBlock.set(key, mod)` wholesale
  replace) — where the clobber happens; where the archive-time hash guard would live.
- `src/core/parsers/requirement-blocks.ts` (`extractRequirementsSection`, `parseDeltaSpec`) — the
  requirement/scenario parser; now fence-aware (fixed during C1's archive). Phase 2 would extend it
  with scenario-level ops.
- `src/core/artifact-graph/types.ts` (`ChangeMetadataSchema`) + `src/utils/change-metadata.ts`
  (`writeChangeMetadata`) — where `.openspec.yaml` is defined + written; the D-c2-2 extension point.
- `orbit/changes/archive/2026-07-06-c1-engine-gates/` — C1's `gate_overridden` inflection-prompt +
  apply-parity pattern that Q-c2-c mirrors.
- `orbit/explore/fork-and-orbify/explore.md` — fork plan D9 (C2 is the final phase); Q8.
