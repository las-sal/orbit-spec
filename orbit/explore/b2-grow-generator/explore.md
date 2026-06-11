# Explore: b2-grow-generator

> **Status**: exploring — pre-propose staging record for phase B2 of the D9 program
> (grow generator: `references[]` + metadata pass-through, per D7).

## Premise

B1 relocated orbit's editorial layer into the fork's workflow templates, but the generator still
emits exactly one `SKILL.md` per skill dir and hardcodes three frontmatter metadata keys. D7
verified the two gaps B2 exists to close:

1. **Multi-file skills.** Upstream `SkillTemplate` is `{ …, instructions: string }` — no sibling-file
   concept. The overlay ships 8 `references/*.md` across 5 skills, but only ONE belongs to a
   B1-relocated workflow (`archive-change/references/archive-summary-schema.md` — the explicit B1
   deferral; the generated archive skill already points at it with no fallback). The other 7 belong
   to B3's net-new editorial skills (address-reviews ×3, review-external ×2, review ×1,
   audit-drift ×1). So B2 is primarily *capability* — `references` on `SkillTemplate` + a
   skill-writer that emits them in `init`/`update` — consumed at small scale in B2 and at full
   scale by B3.
2. **Frontmatter metadata pass-through.** `generateSkillContent()` emits only `author`, `version`,
   `generatedBy`; anything else (e.g., the overlay's `metadata.capability: orbit-review`) is
   silently dropped. B3 skills need `capability:`; generalize emission now.

Both serve Claude and Codex identically (D11-resolved: Codex consumes the same
`SKILL.md + references/` shape from `.codex/skills/`). Bounded by D13 (inline-TS, mimic upstream's
grain; no markdown-as-source smuggling), D14 (commands stay thin launchers — references hang off
skills only), and D15 (full surface installs; references regenerate with their skill).

Concrete content payload queued for B2 (one file — see D-b2-2):
- `orbit-archive-change/references/archive-summary-schema.md` (B1 deferral; overlay content is the
  migration source)

## Decisions

- **D-b2-1 (2026-06-11) — `update` removes unknown files from generated `references/` dirs.**
  Ratified from first principles: `orbit update`'s charter is *convergence* — after update, the
  generated surface must be indistinguishable from a fresh `init` at the current version (it is the
  delivery channel for orbit's editorial layer; `generatedBy` stamps + smart detection exist to
  serve exactly this). Overwrite-only would leave projects in states no CLI version ever generates
  (stale reference files lingering after a template rename). So the skill-writer writes all declared
  references AND removes undeclared files within `references/`; the skill dir is generated
  territory — user files don't belong inside it. Consistent with D14's "generated files are
  regenerated, not merged".

- **D-b2-2 (2026-06-11) — Disciplines stay inline per body; the issue-#4 shared-reference
  consolidation is REVERSED; Q6 is moot.** User: as the workflow evolves and disciplines gain
  per-command granularity, divergence is *desired* — a single-sourced shared file is the wrong
  shape for content whose trajectory is tailoring. Supporting evidence: the 4 full-treatment bodies
  (explore/propose/archive/onboard) have already diverged into command-tailored discipline prose;
  the overlay's only repeated reference filename (run-summary-schema.md ×3) is three *different*
  per-skill schemas, not copies — orbit's reference content is skill-specific everywhere.
  Consequences: (a) the 5 condensed inline blocks are the correct architecture (per-module,
  individually evolvable toward granularity — D13's hand-duplication instinct vindicated);
  (b) disciplines are body material, not reference material (references = step-specific
  consumables read on demand; disciplines = always-on conduct rules); (c) no shared reference
  content exists in orbit, so no dedup mechanism is needed (revisit only if a genuinely
  identical-forever blob appears); (d) B2's content payload is exactly one file (archive's
  summary schema).

## Open questions

- **Q1 — Source representation**: how does reference content live in source? Lean: extend
  `SkillTemplate` with `references?: Array<{ name: string; content: string }>` as inline-TS
  template literals — D13-consistent (upstream has no grain to mimic here; inline literals match
  how bodies live). Markdown-as-source remains the deferred D6 move.
- **Q3 — B2 content scope**: capability + archive schema ref only (per D-b2-2; B3 brings its own
  7 files)? Lean: yes — keep B2 lean and testable; do NOT invent reference files the overlay never
  had.
- **Q4 — Metadata emission shape**: pass through all `metadata` keys (stable order), with
  `generatedBy` still injected by the generator. Any keys to reserve/forbid?
- **Q5 — Test growth**: parity hashes for reference content; fidelity markers for the disciplines
  pointer; e2e generated-surface test asserts `references/*.md` on disk for claude + codex
  (including the Codex-identical assertion).

## Considered & out

- **Upstreaming the `references[]` growth as a PR** — D7 noted upstream might want this back;
  orbit-spec is deliberately unaffiliated (D10/D12), and a PR round-trip is not B2's concern.
- **Markdown-as-source for reference files** — same answer as D13 gave for bodies: deferred to the
  single cohesive D6 architecture move, not smuggled into B2.

## References

- `orbit/explore/fork-and-orbify/explore.md` — D7 (the B2 mandate), D9 (program), D11 (+refinement),
  D13, D14, D15
- `src/core/templates/types.ts` — current `SkillTemplate` (no references field)
- `src/core/shared/skill-generation.ts` — `generateSkillContent()` (hardcoded metadata emission)
- `src/core/init.ts` / `src/core/update.ts` — the skill-writers B2 teaches
- `../openspec-orbit/.claude/skills/*/references/` — the 8-file migration inventory
- Issue #4 (disciplines-reference consolidation — REVERSED by D-b2-2; archive ref carried by B2),
  issue #3 (orbit-status absorption — post-parity, its specs will also ride the references
  mechanism)
- `orbit/specs/orbit-archive-modifications/spec.md` — baseline now requires the archive summary
  schema reference the generated skill cites
