# Tasks — relocate-modified-upstream-workflows (B1)

## 1. Spec deltas (bring the 6 capabilities into orbit-spec)

- [ ] 1.1 Author `specs/orbit-conventions/spec.md` (ADDED) — the three execution disciplines, from
  the overlay spec, mechanism-neutral.
- [ ] 1.2 Author `specs/orbit-run-summary-emit/spec.md` (ADDED) — `.orbit-runs/` JSON emit; note the
  two non-emitters (`sync-specs`, `bulk-archive-change`).
- [ ] 1.3 Author `specs/orbit-explore-modifications/spec.md` (ADDED).
- [ ] 1.4 Author `specs/orbit-propose-modifications/spec.md` (ADDED).
- [ ] 1.5 Author `specs/orbit-archive-modifications/spec.md` (ADDED) — flag the deferred reference
  file as a B2 dependency, not a B1 requirement.
- [ ] 1.6 Author `specs/orbit-onboard/spec.md` (ADDED).
- [ ] 1.7 `orbit validate relocate-modified-upstream-workflows --strict` passes.

## 2. Explore spike (prove the loop on ONE workflow — D1)

- [x] 2.1 Diff overlay `openspec-explore/SKILL.md` body vs current pristine `explore.ts`
  `instructions`; identify the exact orbit delta.
- [x] 2.2 Fold the delta into the `instructions` literal (mechanism-neutral per D11; backtick-escape
  code fences/diagrams).
- [x] 2.3 Fold the command delta into the `content` literal (preserve thin-launcher shape).
- [x] 2.4 `npm run build && npm test` green (1369 baseline).
- [x] 2.5 Acceptance gate: `orbit init --tools claude` in a scratch dir reproduces orbit's
  expected explore skill + command; `--tools codex` produces a sane skill.
- [x] 2.6 Add a generation-fidelity test asserting the explore skill/command content.

## 3. Roll out the remaining 10

Apply the proven pattern to each (skill `instructions` + command `content`, inline conventions +
run-summary where applicable):

- [x] 3.1 `propose.ts`
- [x] 3.2 `new-change.ts`
- [x] 3.3 `continue-change.ts`
- [x] 3.4 `apply-change.ts`
- [x] 3.5 `ff-change.ts`
- [x] 3.6 `sync-specs.ts` (conventions only; no run-summary)
- [x] 3.7 `archive-change.ts` (inline body + Step 5.5; reference file deferred to B2)
- [x] 3.8 `bulk-archive-change.ts` (conventions only; explicitly no run-summary)
- [x] 3.9 `verify-change.ts`
- [x] 3.10 `onboard.ts`

## 4. Validation & completeness

- [x] 4.1 `npm run build && npm test` green after the full roll-out.
- [ ] 4.2 Generation-fidelity: `orbit init --tools claude` reproduces all 11 workflows' expected
  content; diff against the overlay (modulo intentional mechanism-neutral edits) shows only expected
  deltas.
- [ ] 4.3 Change-completeness sweep (per CLAUDE.md): no half-relocated bodies, no Claude-only residue,
  no stale `/orbit:` mechanism assumptions, no dropped run-summary sections.
- [ ] 4.4 Confirm no generator/engine files were touched (B1 scope discipline).
- [ ] 4.5 Update CLAUDE.md "Current state" from A1 → B1-complete when done.
