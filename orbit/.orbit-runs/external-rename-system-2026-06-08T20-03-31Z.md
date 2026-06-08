# External Review: orbit-spec rename (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-06-08

## CRITICAL

### `npx orbit update` can execute an unrelated npm package
**File**: src/commands/config.ts:625
**Description**: The profile flow now applies changes with `execSync('npx orbit update', ...)`. This package is named `orbit-spec`, while the npm package named `orbit` already exists and is unrelated. If the current project does not have a local `orbit` bin, `npx` may download and execute that unrelated package or fail instead of invoking this CLI. Invoke the current CLI deterministically (for example, call the update implementation directly or run this package's resolved bin with `process.execPath`) and add a test that exercises the `applyNow` branch and asserts the safe invocation.

## WARNING

### Legacy cleanup treats current Orbit commands as legacy and misses old `opsx-*` commands
**File**: src/core/legacy-cleanup.ts:53
**Description**: `LEGACY_SLASH_COMMAND_PATHS` changed the OpenCode and Junie legacy patterns from `opsx-*` to `orbit-*`. This map is specifically for finding old generated artifacts, so the namespace rename should not have changed the legacy source patterns. For Junie, cleanup can now offer to remove current `.junie/commands/orbit-*.md` files while failing to find stale `.junie/commands/opsx-*.md` files. The mechanically edited tests at `test/core/legacy-cleanup.test.ts:339` and `:357` are tautological: they now assert that current `orbit-*` files are legacy and no longer test `opsx-*` cleanup. Restore `opsx-*` in the legacy patterns, keep the intentional `openspec-*` patterns, and add negative coverage proving current `orbit-*` artifacts are not reported.

### Project migration hint points users to the removed working directory
**File**: src/core/legacy-cleanup.ts:645
**Description**: The migration hint correctly identifies the old source file as `openspec/project.md`, but tells users to move its contents to `openspec/config.yaml`. The new destination is `orbit/config.yaml`. This is a mixed old/new-path disambiguation error, and the test at `test/core/legacy-cleanup.test.ts:880` only checks the unqualified substring `config.yaml`, so it passes despite the wrong path. Change the destination text to `orbit/config.yaml` and assert the complete old source and new destination paths.

### PowerShell completion installation retains the old OpenSpec namespace
**File**: src/core/completions/installers/powershell-installer.ts:123
**Description**: PowerShell still installs `OpenSpecCompletion.ps1`, writes and removes `# OPENSPEC:START` / `# OPENSPEC:END` profile blocks, and generates `$openspecCompleter` plus `Get-OpenSpecChanges` / `Get-OpenSpecSpecs` helpers (`src/core/completions/generators/powershell-generator.ts:48` and `:185`). Although the completer registers for `orbit`, the stale file, symbols, and markers violate the completion rename requirement and can collide with an existing OpenSpec completion installation or cause uninstall to remove the wrong managed block. Rename the installed file, generated symbols, and managed markers to Orbit, with migration-aware handling for any old OpenSpec block, and add installer/generator assertions for those names.

### Public user documentation still directs users to the old CLI, directory, skills, and command namespace
**File**: README.md:39
**Description**: The primary README still tells users to run `/opsx:propose`, install `@fission-ai/openspec`, execute `openspec init`, and expect `openspec/changes`. `docs/supported-tools.md:3` likewise documents `openspec init`, `openspec-*` skills, and `opsx-*` command files across every adapter. These are active user guides, not the intentionally deferred historical prose under `orbit/`, so following them produces the wrong installation and commands. Sweep active user-facing documentation to `orbit-spec`, `orbit`, `orbit/`, `orbit-*`, and `/orbit:` while retaining old names only where explicitly labeled as migration history.

### The active B1 proposal and tasks encode the pre-rename contract
**File**: orbit/changes/relocate-modified-upstream-workflows/proposal.md:30
**Description**: The next active change says `/opsx:` stays, capabilities belong under `openspec/specs/`, acceptance uses `openspec init`, and the bin remains `openspec` (`proposal.md:41`, `:65`, `:68`; `tasks.md:14`, `:24`, `:47`, `:51`). It also describes overlay inputs with old names without consistently distinguishing legacy source paths from new generated targets. Because B1 is explicitly sequenced after this rename, these instructions will steer the next implementation back toward the old surface. Update the active proposal/tasks to the post-rename contract and label any genuinely legacy overlay paths as source-only.

### Packaging and release automation still expect the old binary and package layout
**File**: flake.nix:79
**Description**: The Nix package still declares `mainProgram = "openspec"` and launches `/bin/openspec`; CI verifies `result/bin/openspec` (`.github/workflows/ci.yml:209`); the packed-version guard looks for `node_modules/@fission-ai/openspec/bin/openspec.js` (`scripts/pack-version-check.mjs:83`); the postinstall tip says `openspec completion install` (`scripts/postinstall.js:73`); and `package-lock.json:22` still records the old bin mapping. These checks and installation surfaces will fail, verify the wrong artifact, or give stale instructions. Update them to the `orbit-spec` package and `orbit` bin, then regenerate the lockfile and exercise the pack/Nix checks.

## SUGGESTION

### Rename the residual internal `Opsx` template API
**File**: src/core/templates/skill-templates.ts:9
**Description**: Generated content uses the correct `/orbit:` namespace, but the exported template API and its call sites still use names such as `getOpsxExploreCommandTemplate` and `getOpsxProposeSkillTemplate`. The command-namespace proposal describes `opsx` as unambiguous and does not list an internal-code keep exception. Rename these symbols to `getOrbit...` so future namespace-residue searches remain meaningful and new workflow work does not perpetuate the old term.

## Notes

`npm run build` succeeded, and `npm test` passed all 66 files / 1369 tests. A scratch `node bin/orbit.js init --tools claude` produced a coherent `orbit/` tree, `.claude/skills/orbit-*`, and `.claude/commands/orbit/`; generated bash, zsh, and fish completions also used `orbit` structurally.

The deliberate keeps I checked remain intact: global config/data directory names still use `openspec`; data-format tags remain `openspec` / `openspec-change`; `.openspec.yaml` remains the per-change metadata filename; and legacy detection still retains old `openspec/AGENTS.md`, `openspec/project.md`, `.claude/commands/openspec/`, `openspec-*`, and CoStrict `.cospec/openspec/commands` paths. The main wrongly-changed keep is the separate old `opsx-*` legacy-command detection described above.
