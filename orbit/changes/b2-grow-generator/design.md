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
- (Re)generation-time convergence: a regenerated skill dir matches fresh-init output exactly
  (declared references written, undeclared entries under `references/` removed).
- Full metadata pass-through with `generatedBy` still generator-owned.
- Archive's schema reference becomes real — overlay content **reconciled to the
  baseline-canonical shape**, not verbatim (the overlay source predates the B1 baselines and
  disagrees on `unresolved_markers` shape, `sync_specs` nesting, and `user_decision` values),
  paths orbit-named.

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
- **D-b2-1 (amended at external review iter 1) — reconciliation on init AND update**: the shared
  writer reconciles `references/` to the declared set (write all, delete undeclared) on every
  (re)generation — `init` extend-mode re-runs and both of update's generation paths (refresh loop
  AND `upgradeLegacyTools()`). One writer, one semantics. Ordering: all declared writes succeed
  BEFORE any pruning; on write failure nothing is removed. Scope of deletion: ONLY entries under
  `<skill-dir>/references/` (every entry type — files, dirs, symlinks-as-links); containment is
  physical, links never followed — including DECLARED-path collisions: a symlink or directory
  sitting at a declared name is replaced as part of the write phase, never followed (the
  write-before-prune ordering governs undeclared pruning only). Reference names and metadata keys
  validate PREFLIGHT, before any file write in the operation.
- **Smart update detection grows reference drift**: `update`'s stamp short-circuit
  (`update.ts:151`) + drift check (`profile-sync-drift.ts`) currently see only `SKILL.md` and
  command presence — a current-version install would never reach the reconciler. Detection gains
  reference-set drift (missing declared / stray undeclared ⇒ proceed to generation). Within a
  version, declared content cannot change, so presence/stray detection suffices; the self-host
  dev loop (template edits without version bumps) uses `update --force` instead. User-edited
  *declared* references (right name, tampered content) are deliberately outside detection scope —
  consistent with the existing presence-only `SKILL.md` drift checks; `--force` or the next
  version bump restores them.
- **D-b2-5 — metadata pass-through**: emit every `template.metadata` key in declared order;
  `generatedBy` appended by the generator and wins over any template-declared key of the same
  name (generator-owned provenance).
- **Single writer**: emission + reconciliation live in the shared skill-generation module so
  `init` and `update` cannot diverge (same single-source principle as D14).
- **D-b2-4/D-b2-6 — proof scale**: one real reference (archive) exercises the whole path;
  three-layer test growth (parity / fidelity / e2e on-disk both tools) plus writer unit tests
  makes the mechanism's contract explicit before B3 leans on it.

## Risks / Trade-offs

- **Remove-unknown deletes user files parked inside a generated `references/` dir — on update AND
  re-init.** Accepted: the skill dir is generated territory (documented stance since D14);
  deletion is scoped to `references/` entries only, write-before-prune ordered, symlink-safe.
- **Frontmatter key collisions** (template declares `generatedBy`): generator wins; unit-tested.
- **Self-host lag**: this repo's own `.claude/` won't show the new reference until
  `build + update --force` is run (documented loop in CLAUDE.md).
- **Cherry-pick surface**: touches `init.ts`/`update.ts`/`skill-generation.ts` — upstream-active
  files. Kept small and additive (new helper + one loop) to minimize future merge friction.
