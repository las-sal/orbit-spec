## Why

orbit-spec is a hard fork of openspec@1.3.1 (D10). The A1 rebrand set `package.json name: orbit-spec`
but left the **user-facing invocation + on-disk structure** as upstream's `openspec`: the CLI bin is
`openspec`, the project working dir is `openspec/`, and skill dirs are `openspec-*`. For the fork to
feel cohesive — and crucially, so the **B1 workflow bodies are authored against the final names from
the start** (they hardcode the bin command and the working-dir path) — these are settled now, on the
clean pre-relocation tree.

This is a deliberately **narrow, surgical** rename of the *user-facing structural* surface only. The
broad internal/branding scrub (~2,000 `openspec` occurrences in identifiers, prose, data-format tags)
is **out of scope** and deferred to a dedicated post-parity "Tier-C" change — it does not couple to
B1 and renaming it now would torch `git diff upstream/v1.3.1` legibility and the C2 archive-fix
cherry-pick path for invisible churn.

Recon found the literal `'openspec'` is **overloaded** across distinct concerns; the rename must
disambiguate them rather than blind-replace.

## What Changes

### In scope (rename `openspec` → `orbit`)

- **Bin name**: `openspec` → `orbit`. `package.json` `bin` key + `dev:cli` script, rename
  `bin/openspec.js` → `bin/orbit.js`, the bash/zsh/fish completion script name.
- **Project working dir**: `openspec/` → `orbit/`. The `OPENSPEC_DIR_NAME` constant and the ~working-
  dir-path literals that currently bypass it (archive, list, view, project-config, specs-apply,
  legacy-cleanup, config commands) — refactored onto the constant where practical. Physically move
  the repo's own `openspec/` → `orbit/` (carrying the dogfood change dirs).
- **Skill-dir prefix**: `openspec-*` → `orbit-*` (the `dirName` strings in `getSkillTemplates()` +
  matching command/skill plumbing and tests).
- **Sync current template bodies**: update `openspec …` command invocations and `openspec/` paths in
  the existing (pristine-upstream) workflow modules so the tree stays green. B1 overwrites these
  bodies anyway, but they must be coherent meanwhile.

### Explicitly OUT of scope (deferred to the Tier-C internal/branding sweep)

- **Global config/data dir** (`GLOBAL_CONFIG_DIR_NAME` / `GLOBAL_DATA_DIR_NAME`) — migration-
  sensitive (renaming orphans existing global config); not coupled to B1.
- **Data-format tags** — `format: 'openspec'`, `z.literal('openspec')` (breaking API/JSON change).
- **Branding** — `author: 'openspec'` skill frontmatter, `package.json` keywords, "OpenSpec" prose in
  help text / success messages / comments.
- **`.openspec.yaml`** per-change metadata filename (hidden; not user-typed; engine-coupled).
- **legacy-cleanup `openspec-*` detection globs** — kept; they should still find legacy openspec
  installs for migration.

### Kept

- The `/opsx:` command namespace (already orbit-flavored; `transformToHyphenCommands` handles per-tool
  rewrites).

## Capabilities

### New / Modified Capabilities

(none — this is a behavior-preserving rename; no spec deltas. Archived with `--skip-specs`.)

## Impact

- **Affected source**: `config.ts` (constant), the working-dir path literals across core/commands,
  `package.json`, `bin/`, completion installers, `skill-generation.ts` (dirNames), the 11 current
  template modules (body refs).
- **Affected tests**: a large slice of the ~1,308 test `openspec` references (path fixtures, generated-
  content assertions, dirName assertions, bin-name assertions). Must return to green (1369 baseline).
- **Sequencing**: lands **before B1**. After this change, the dogfood change dirs live under
  `orbit/changes/`, and B1 authors orbit-native bodies (bin `orbit`, paths `orbit/…`).
- **Backward compat**: this is a fork-internal rename; orbit-spec now manages `orbit/` dirs and is
  invoked as `orbit`. Existing openspec projects would need migration (out of scope; personal tool).
