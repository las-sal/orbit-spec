## Why

The generator can only emit single-file skills (one `SKILL.md` per dir; `SkillTemplate` has no
sibling-file concept) and silently drops all frontmatter metadata except three hardcoded keys.
This is live debt — B1's generated archive skill instructs "read `references/archive-summary-schema.md`"
and no such file is ever generated — and it fully blocks B3, whose editorial workflows are
multi-file skills (7 reference files across 4 skills in the overlay). B2 is the D9 program's
generator-growth phase (D7): close both gaps now, on a deliberately small content payload, so B3
can ship an 8-file skill without touching the generator again.

## What Changes

- **`SkillTemplate` gains `references?: Array<{ name: string; content: string }>`** (D-b2-3) —
  reference content lives as inline-TS template literals in the workflow modules, exactly like
  bodies (D13-consistent; upstream has no grain to mimic here).
- **The shared skill-writer (used by `init` and `update`) emits `references/<name>` files**
  alongside `SKILL.md`, for every tool's skills dir (Claude `.claude/skills/`, Codex
  `.codex/skills/` — same bytes, per the e2e identity contract).
- **`update` converges `references/`** (D-b2-1): writes all declared references AND removes
  undeclared files within a generated skill's `references/` dir — after update, the surface is
  indistinguishable from a fresh init at the current version.
- **`generateSkillContent()` passes ALL template `metadata` keys through** to frontmatter in
  template-declared order (D-b2-5); `generatedBy` remains generator-injected and not overridable.
- **Content payload: exactly one file** (D-b2-4): `orbit-archive-change/references/
  archive-summary-schema.md`, migrated from the overlay (the B1 deferral). The generated archive
  skill's existing cite becomes real. No other references are invented; B3 brings its own
  (per D-b2-2, disciplines stay inline per body — the issue-#4 consolidation was reversed).
- **Tests grow in all three layers + writer units** (D-b2-6): parity hashes over reference
  content; fidelity assertion for the archive reference declaration; e2e generated-surface
  assertions for `references/*.md` on disk (both tools, byte-identity); init/update unit tests
  for emission and remove-unknown cleanup.

## Capabilities

### New Capabilities

- `orbit-skill-generation`: the generated-skill production surface — multi-file emission
  (`SKILL.md` + `references/*.md`), frontmatter metadata pass-through, and update-time
  convergence semantics for generated skill dirs.

### Modified Capabilities

- `orbit-archive-modifications`: ADDED requirement — the generated `orbit-archive-change` skill
  ships `references/archive-summary-schema.md` (the schema its body already cites for the Step
  5.5 archive run summary), satisfying the B1 deferral.

## Impact

- **Affected source**: `src/core/templates/types.ts` (`SkillTemplate`),
  `src/core/shared/skill-generation.ts` (metadata emission + reference helpers),
  `src/core/init.ts` / `src/core/update.ts` (skill-writers), and
  `src/core/templates/workflows/archive-change.ts` (declares the one reference).
- **Affected tests**: `skill-templates-parity` (reference hashes), `orbit-content-fidelity`
  (archive reference declaration), `orbit-generated-surface` (on-disk references, both tools),
  `init`/`update` suites (emission + cleanup semantics).
- **Engine deviation note**: like D15, this is deliberate, recorded engine growth — upstream has
  no references concept (D7 flagged it as "plausibly something upstream wants back"; upstreaming
  is out of scope per the exploration's Considered & out).
- **Self-host loop**: after apply, regenerate this repo's own surface
  (`npm run build && node bin/orbit.js update`) so the archive skill's reference materializes here too.
- **Exit criterion**: B3 can ship `review`/`review-external`/`address-reviews`/`audit-drift` as
  multi-file skills with `capability:` metadata, with zero further generator changes.
