# Tasks — b2-grow-generator

<!--
Implementation chunks:
  Chunk 1 (groups 1-2):  Engine — references field, writer, metadata pass-through
  Chunk 2 (groups 3):    Content — archive schema reference
  Chunk 3 (groups 4-5):  Tests + validation + self-host refresh
-->

## 1. Engine: template shape + generation

- [ ] 1.1 `SkillTemplate` gains `references?: Array<{ name: string; content: string }>`
  (`src/core/templates/types.ts`).
- [ ] 1.2 `generateSkillContent()` emits ALL `template.metadata` keys in declared order;
  `generatedBy` generator-injected and overriding (`src/core/shared/skill-generation.ts`).
- [ ] 1.3 Add a shared reference-writer/reconciler helper in `skill-generation.ts`: validates
  names (bare filename, no separators/dot-segments, unique — fail fast naming the template);
  writes every declared reference to `<skill-dir>/references/<name>`; all writes succeed BEFORE
  any pruning; removes undeclared entries (files/dirs/symlinks-as-links, never following links;
  if `references/` is itself a symlink, replace with a real dir) within `references/` only;
  when the declared set is empty, removes the `references/` dir itself (no empty-dir litter);
  returns written/removed counts for reporting.

## 2. Engine: wiring init + update

- [ ] 2.1 `init.ts` skill loop calls the reference writer after writing `SKILL.md` (extend-mode
  re-runs reconcile too — D-b2-1 as amended).
- [ ] 2.2 `update.ts` calls the same helper on BOTH generation paths: the skill refresh loop AND
  `upgradeLegacyTools()` (single writer — entry points cannot diverge); removed-entry counts
  surface in update's output.
- [ ] 2.3 Smart update detection (`profile-sync-drift.ts`) gains reference drift: a generated
  skill missing a declared reference, or carrying an undeclared entry, counts as drift and
  defeats the current-stamps short-circuit (`update.ts:151`).
- [ ] 2.4 Skills with no `references` produce no `references/` dir (no empty-dir litter).

## 3. Content: archive schema reference

- [ ] 3.1 Migrate `archive-summary-schema.md` content from the overlay
  (`../openspec-orbit/.claude/skills/openspec-archive-change/references/`) into
  `archive-change.ts` as an inline-TS literal on the skill template's `references`, RECONCILING
  to the baseline-canonical shape (read both baselines first): `unresolved_markers` as array;
  sync delta counts directly under `sync_specs`; exactly the three baseline `user_decision`
  values (no `aborted` — abort writes no summary); orbit-named paths.
- [ ] 3.2 Confirm the skill body's existing cites ("read `references/archive-summary-schema.md`")
  match the shipped filename exactly.

## 4. Tests

- [ ] 4.1 Parity: reference content participates in the function-payload hashes (template object
  now includes `references`); rebaseline.
- [ ] 4.2 Fidelity: assert `archive-change` declares exactly `archive-summary-schema.md` and that
  no other workflow declares references (D-b2-4 lean-scope guard); semantic content assertions on
  the schema — `unresolved_markers` documented as array, flat `sync_specs` counts, exactly the
  three baseline `user_decision` values.
- [ ] 4.3 e2e generated-surface: after default init, `references/archive-summary-schema.md`
  exists on disk for claude AND codex, byte-identical; non-reference skills have no
  `references/` dir.
- [ ] 4.4 Writer units (init/update suites): emission on init; refresh on update; remove-unknown
  on update AND on extend-mode re-init (seed a stray file, assert removal + report);
  has-references→none transition removes the `references/` dir entirely; legacy-upgrade path
  (`upgradeLegacyTools`) emits references; reference drift defeats current-stamps smart detection
  (current-version project, missing/stray reference → update reconciles without --force); write
  failure aborts pruning (declared write error → no removals); name validation (separator /
  dot-segment / duplicate → generation error, no partial write); entry-type handling (undeclared
  dir and symlink removed as entries, symlink target untouched; symlinked `references/` replaced
  with real dir); reconciliation never touches files outside `references/`; `generatedBy`
  override; no-fallback-defaults metadata; metadata ORDER + YAML safety (non-alphabetic declared
  order with mid-position template `generatedBy` and a value requiring quoting → parsed
  frontmatter preserves order, quotes correctly, generator-owned `generatedBy`); arbitrary
  metadata key pass-through.

## 5. Validation & completeness

- [ ] 5.1 `npm run build && npm test` green (baseline 1459 + new tests).
- [ ] 5.2 `node bin/orbit.js validate b2-grow-generator --strict` passes.
- [ ] 5.3 Self-host refresh: `node bin/orbit.js update --force` in this repo (template edits
  don't bump the version; --force is the dev-loop path — though 2.4's reference-drift detection
  should also catch the missing reference, verify both routes); confirm
  `.claude/skills/orbit-archive-change/references/archive-summary-schema.md` materializes.
- [ ] 5.4 Residue sweep: grep for remaining "deferred to B2" / dangling-reference language that
  this change resolves (CLAUDE.md deferred-follow-ups list, proposal/design provenance).
