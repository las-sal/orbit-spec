## Why

B3 is the final B-arc change (fork plan D9): orbit's four net-new editorial workflows — **review,
review-external, address-reviews, audit-drift** — exist today only as hand-maintained skills in the
retired-overlay repo (`../openspec-orbit`), while this fork's surface already *points at them*:
ff/continue/propose/verify emits recommend `/orbit:review`, `archive-change` invokes
`/orbit:audit-drift` in its Step 3.5 pre-archive sweep, onboard documents the full canonical flow,
and the baseline `orbit-run-summary-emit` spec cites their requirement names. Landing the four as
first-class generated workflows closes every dangling forward reference and reaches the **parity
milestone** — full behavioral parity with the overlay, after which `openspec-orbit` retires as
migration source-of-truth.

## What Changes

- Add 4 workflow modules under `src/core/templates/workflows/` (`review.ts`, `review-external.ts`,
  `address-reviews.ts`, `audit-drift.ts`), each exporting a `SkillTemplate` (inline-TS body per D13,
  with `references` per B2's multi-file capability) and a thin ~3-line launcher `CommandTemplate`
  (per D14). The overlay's 106/55/84/64-line command bodies are **dropped, not migrated** — fresh
  launchers are written; parity is defined against the skill bodies.
- Skill bodies relocate the overlay's `SKILL.md` content (465/213/441/328 lines) plus 7 reference
  files, rebranded to the orbit namespace (`/opsx:*`→`/orbit:*`, `openspec` CLI→`orbit`,
  `openspec/{changes,specs,lenses}/`→`orbit/...`, skill names `openspec-*`→`orbit-*`) and scrubbed
  of overlay-era citations per D-b3-1 (no `bootstrap-openspec-orbit` example names, no
  `openspec-orbit` repo URL, no `orbit-status` references — "a downstream status reader" per fork
  precedent; review's State-1 empirical rationale keeps its force, drops its referents).
- Register the 4 workflows across the full surface: `ALL_WORKFLOWS` (src/core/profiles.ts) 11→15,
  `SKILL_NAMES` (src/core/shared/tool-detection.ts) 11→15, `getSkillTemplates()` /
  `getCommandTemplates()` (src/core/shared/skill-generation.ts), facade re-exports
  (src/core/templates/skill-templates.ts).
- Tests: count assertions 11→15 (profiles, skill-generation ×3, tool-detection, e2e
  generated-surface); per-workflow required-marker rows ×4 in `orbit-content-fidelity.test.ts`;
  thin-launcher assertions ×4; a `capability:` metadata pass-through assertion (first real consumer
  of B2's metadata pass-through).
- Restore the baseline `orbit/specs/orbit-run-summary-emit/spec.md` `Purpose:` section (currently
  the archive-flow `TBD` stub) from the overlay's real Purpose paragraph, rebranded (D-b3-3 rider).
- **No engine changes** (D-b3-2): no artifact-graph awareness, no gates, no staleness, no
  `orbit status` knowledge of review runs — all C1 scope. **No generator changes**: B2 delivered
  everything needed (multi-file references, metadata pass-through, reconciliation).

## Capabilities

### New Capabilities

- `orbit-review`: editorial review command (`/orbit:review`) — `--as proposal|system` modes,
  9 proposal passes / verify+6 system passes, 3-dimension scorecard, severity ladder,
  iteration-aware convergence states, per-mode run-summary persistence.
- `orbit-review-external`: external-review packager (`/orbit:review-external`) — versioned
  self-contained prompt file + chat invocation snippet; does not run or ingest reviews.
- `orbit-address-reviews`: findings resolver (`/orbit:address-reviews`) — `@review:` marker walk,
  `--from-file` dual-format ingest (external markdown + internal JSON), auto-discovery,
  pushback→classify→fix→ripple-cascade→remove-marker lifecycle, decision forks.
- `orbit-audit-drift`: project-wide drift scanner (`/orbit:audit-drift`) — four categories
  (vocabulary residue, lens staleness, cross-doc consistency, archive coherence), three invocation
  contexts (standalone / library / pre-archive).

All four relocate the overlay's capability specs **as-is structurally** (D-b3-3): they keep their
thin emit-persistence requirements (review-external deliberately has none) and do NOT absorb the
recommendation/timing/spine logic owned by the baseline `orbit-run-summary-emit` spec. (A handful
of targeted corrections from the iter-1 proposal review amend the relocated content — see
design.md "Amendments from iter-1 proposal review".)

### Modified Capabilities

(none — the four ADDED specs slot into the ownership split the baseline already encodes; the
`orbit-run-summary-emit` Purpose restoration is prose metadata, not a requirement change.)

## Impact

- **Code**: 4 new files under `src/core/templates/workflows/`; line-level additions to
  `skill-templates.ts`, `skill-generation.ts`, `profiles.ts`, `tool-detection.ts`.
- **Generated surface**: `orbit init` / `orbit update` emit 15 skills + 15 commands (Claude +
  Codex from the same source, per D11/D15); this repo's own `.claude/` surface refreshes via
  `npm run build && node bin/orbit.js update --force`.
- **Specs**: 4 ADDED baseline capabilities (7→11); every dangling cross-spec citation in
  `orbit-run-summary-emit` (e.g. `Address-reviews command available`) resolves.
- **Tests**: ~6 count assertions updated; ~10 new assertions (fidelity rows, launchers, metadata).
  Baseline 1504 green before and after, plus the new ones.
- **Parity milestone**: after this change archives, `../openspec-orbit` retires (overlay-era audit
  trail stays archived there).
