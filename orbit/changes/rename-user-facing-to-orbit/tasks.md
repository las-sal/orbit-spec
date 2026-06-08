# Tasks — rename-user-facing-to-orbit (A2, before B1)

Worked on a branch with green-checkpoint commits per chunk.

## 1. Working dir `openspec/` → `orbit/`

- [ ] 1.1 `OPENSPEC_DIR_NAME = 'openspec'` → `'orbit'` in `src/core/config.ts`.
- [ ] 1.2 Refactor working-dir path literals onto the constant (archive, list, view, project-config,
  specs-apply, legacy-cleanup, config commands) — disambiguate from global-config / format / branding
  uses, which stay `'openspec'`.
- [ ] 1.3 Physically move `openspec/` → `orbit/` (carries `architecture/`, `explore/`, `specs/`,
  `changes/` incl. both dogfood change dirs + `config.yaml`).
- [ ] 1.4 Update test fixtures/expectations referencing the `openspec/` working dir.
- [ ] 1.5 `npm run build && npm test` green → commit.

## 2. Bin `openspec` → `orbit`

- [ ] 2.1 `package.json` `bin` key + `dev:cli`; rename `bin/openspec.js` → `bin/orbit.js`.
- [ ] 2.2 Completion script name (bash/zsh/fish installers) → `orbit`.
- [ ] 2.3 Update `openspec …` command invocations in the 11 current template bodies → `orbit …`.
- [ ] 2.4 Update tests asserting bin name / invocations / completion name.
- [ ] 2.5 `npm run build && npm test` green → commit.

## 3. Skill-dir prefix `openspec-*` → `orbit-*`

- [ ] 3.1 `dirName` strings in `getSkillTemplates()` (`openspec-explore` → `orbit-explore`, ×11).
- [ ] 3.2 Any plumbing keyed on the prefix (NOT the legacy-cleanup detection globs — those stay).
- [ ] 3.3 Update tests asserting skill dir names.
- [ ] 3.4 `npm run build && npm test` green → commit.

## 4. Verify & wrap

- [ ] 4.1 Full `npm run build && npm test` green (1369).
- [ ] 4.2 `orbit init --tools none` in a scratch dir creates `orbit/…` (smoke-test the renamed CLI).
- [ ] 4.3 Confirm OUT-of-scope items untouched (global cfg dir, format tags, branding, `.openspec.yaml`,
  legacy globs).
- [ ] 4.4 Update CLAUDE.md "Current state" note (bin is now `orbit`; working dir `orbit/`).
