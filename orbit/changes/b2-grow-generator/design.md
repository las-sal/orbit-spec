## Context

Upstream's skill pipeline is single-file: `SkillTemplate { …, instructions }` → one `SKILL.md`
write per skill dir in `init`/`update`, with frontmatter built by `generateSkillContent()` from
three hardcoded metadata keys. Orbit's skill shape is richer (multi-file `SKILL.md + references/`,
`capability:` metadata) — proven by the overlay's 8 reference files and by the Agent Skills
standard both targets consume (Claude `.claude/skills/`, Codex `.codex/skills/`, same format).
B1 left one live dangling cite (archive's `references/archive-summary-schema.md`); B3 is blocked
outright without this. The full exploration record is `explore.md` (D-b2-1…6) alongside this file.

## Goals / Non-Goals

**Goals:**
- `SkillTemplate.references` → `references/*.md` emitted next to `SKILL.md` by the shared
  skill-writer, identically for every skill-capable tool.
- Update-time convergence: a generated skill dir matches fresh-init output exactly (declared
  references written, undeclared files under `references/` removed).
- Full metadata pass-through with `generatedBy` still generator-owned.
- Archive's schema reference becomes real (overlay content migrated verbatim, paths orbit-named).

**Non-Goals:**
- No new reference files beyond archive's (B3 brings its own 7; disciplines stay inline per D-b2-2).
- No markdown-as-source, no body-injection (D6/D8 deferred; D13 stands).
- No `scripts/`/`assets/` support — orbit skills are prose-only; markdown references suffice.
- No upstreaming PR (Considered & out).

## Decisions

- **D-b2-3 — inline-TS representation**: `references?: Array<{ name: string; content: string }>`
  on `SkillTemplate`; content as template literals in the owning workflow module. `name` is the
  bare filename (e.g., `archive-summary-schema.md`); the writer owns the `references/` path
  segment. Rationale: matches how bodies live; upstream has no grain to mimic; keeps the future
  D6 migration a single cohesive move.
- **D-b2-1 — remove-unknown on update**: the writer reconciles `references/` to the declared set
  (write all, delete undeclared). Update's charter is convergence (`generatedBy` stamps + smart
  detection exist for exactly this); overwrite-only would leave projects in states no CLI version
  generates. Scope of deletion: ONLY files under `<skill-dir>/references/` — never the skill dir
  itself, never user project files.
- **D-b2-5 — metadata pass-through**: emit every `template.metadata` key in declared order;
  `generatedBy` appended by the generator and wins over any template-declared key of the same
  name (generator-owned provenance).
- **Single writer**: emission + reconciliation live in the shared skill-generation module so
  `init` and `update` cannot diverge (same single-source principle as D14).
- **D-b2-4/D-b2-6 — proof scale**: one real reference (archive) exercises the whole path;
  three-layer test growth (parity / fidelity / e2e on-disk both tools) plus writer unit tests
  makes the mechanism's contract explicit before B3 leans on it.

## Risks / Trade-offs

- **Remove-unknown deletes user files parked inside a generated `references/` dir.** Accepted:
  the skill dir is generated territory (documented stance since D14); deletion is scoped to
  `references/` only.
- **Frontmatter key collisions** (template declares `generatedBy`): generator wins; unit-tested.
- **Self-host lag**: this repo's own `.claude/` won't show the new reference until
  `build + update` is run (documented loop in CLAUDE.md).
- **Cherry-pick surface**: touches `init.ts`/`update.ts`/`skill-generation.ts` — upstream-active
  files. Kept small and additive (new helper + one loop) to minimize future merge friction.
