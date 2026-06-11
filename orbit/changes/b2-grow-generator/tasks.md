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
- [ ] 1.3 Add a shared reference-writer/reconciler helper in `skill-generation.ts`: writes every
  declared reference to `<skill-dir>/references/<name>`, removes undeclared files within
  `references/` only, returns written/removed counts for reporting.

## 2. Engine: wiring init + update

- [ ] 2.1 `init.ts` skill loop calls the reference writer after writing `SKILL.md`.
- [ ] 2.2 `update.ts` skill refresh calls the same helper (single writer — init and update cannot
  diverge); removed-file counts surface in update's output.
- [ ] 2.3 Skills with no `references` produce no `references/` dir (no empty-dir litter).

## 3. Content: archive schema reference

- [ ] 3.1 Migrate `archive-summary-schema.md` content from the overlay
  (`../openspec-orbit/.claude/skills/openspec-archive-change/references/`) into
  `archive-change.ts` as an inline-TS literal on the skill template's `references` (orbit-named
  paths; content fidelity per read-before-reference — verify field list against the
  `orbit-archive-modifications` baseline).
- [ ] 3.2 Confirm the skill body's existing cites ("read `references/archive-summary-schema.md`")
  match the shipped filename exactly.

## 4. Tests

- [ ] 4.1 Parity: reference content participates in the function-payload hashes (template object
  now includes `references`); rebaseline.
- [ ] 4.2 Fidelity: assert `archive-change` declares exactly `archive-summary-schema.md` and that
  no other workflow declares references (D-b2-4 lean-scope guard).
- [ ] 4.3 e2e generated-surface: after default init, `references/archive-summary-schema.md`
  exists on disk for claude AND codex, byte-identical; non-reference skills have no
  `references/` dir.
- [ ] 4.4 Writer units (init/update suites): emission on init; refresh on update; remove-unknown
  on update (seed a stray file in `references/`, assert removal + report); reconciliation never
  touches files outside `references/`; `generatedBy` override; arbitrary metadata key
  pass-through.

## 5. Validation & completeness

- [ ] 5.1 `npm run build && npm test` green (baseline 1459 + new tests).
- [ ] 5.2 `node bin/orbit.js validate b2-grow-generator --strict` passes.
- [ ] 5.3 Self-host refresh: `node bin/orbit.js update` in this repo; confirm
  `.claude/skills/orbit-archive-change/references/archive-summary-schema.md` materializes.
- [ ] 5.4 Residue sweep: grep for remaining "deferred to B2" / dangling-reference language that
  this change resolves (CLAUDE.md deferred-follow-ups list, proposal/design provenance).
