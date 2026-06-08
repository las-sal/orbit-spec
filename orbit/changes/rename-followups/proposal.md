## Why

An external system-mode review (GPT-5 Codex, 2026-06-08) of the `openspec → orbit` rename surfaced
1 CRITICAL + 6 WARNING + 1 SUGGESTION. All were verified accurate against the code. This change
addresses every actionable finding except the docs rewrite (W4), which is deferred to a thorough
single-pass effort (tracked as las-sal/orbit-spec#1). Findings file:
`orbit/.orbit-runs/external-rename-system-2026-06-08T20-03-31Z.md`.

## What Changes

- **C1 (CRITICAL)** — `commands/config.ts` profile-apply shelled out to `execSync('npx orbit update')`,
  which would resolve to the **unrelated `orbit` npm package**, not this CLI. Now invokes
  `UpdateCommand` **in-process**. (`execSync` import dropped.)
- **W1** — legacy-cleanup detection patterns for opencode/junie were wrongly swept `opsx-*` → `orbit-*`
  by the namespace rename (legacy detection must keep matching the OLD `opsx-*`/`openspec-*` artifacts).
  Reverted to `opsx-*`. Fixed the tautological tests + **added negative coverage** proving current
  `orbit-*` files are NOT flagged as legacy.
- **W2** — migration hint said the new config lives at `openspec/config.yaml`; corrected to
  `orbit/config.yaml` (legacy SOURCE `openspec/project.md` correctly retained).
- **W3** — PowerShell completion still emitted `OpenSpec`/`OPENSPEC` artifacts (file name
  `OpenSpecCompletion.ps1`, `# OPENSPEC:START/END` markers, `$openspecCompleter`, `Get-OpenSpec*`).
  Renamed to Orbit, matching the already-renamed bash/zsh/fish completions (markers had collision risk
  with a real OpenSpec install).
- **W5** — packaging/CI still expected the old bin/package: `flake.nix` (mainProgram + bin path),
  `.github/workflows/ci.yml` (`result/bin/openspec`), `scripts/pack-version-check.mjs`
  (`@fission-ai/openspec` install path), `scripts/postinstall.js` (tip), and `package-lock.json` bin
  mapping (regenerated). Updated to `orbit` / `orbit-spec`.
- **W6** — the **next active change** (`relocate-modified-upstream-workflows`, B1) encoded the
  pre-rename contract (`/opsx:`, `openspec/specs`, `openspec init`, bin `openspec`). Updated its
  proposal/tasks to the post-rename contract; overlay-source paths (`../openspec-orbit`,
  `openspec-*/SKILL.md`) left labeled as source.
- **S1 (SUGGESTION)** — internal template API symbols still used `Opsx` (`getOpsx*`). Renamed to
  `getOrbit*` across src + tests (generated content was already correct; this kills namespace residue).

### Deferred (not in this change)

- **W4** — `README.md` + `docs/supported-tools.md` (and other active user docs) still reference the old
  install/CLI/namespace. Deferred to a comprehensive single-pass docs rewrite — **las-sal/orbit-spec#1**.

## Capabilities

### New / Modified Capabilities

(none — bug-fix/cleanup of the behavior-preserving rename; no spec deltas. Archived `--skip-specs`.)

## Impact

- **Affected source**: `commands/config.ts`, `core/legacy-cleanup.ts`, PowerShell completion
  generator+installer, the workflow template modules + `skill-templates.ts`/`skill-generation.ts`
  (Opsx→Orbit symbols), packaging files, `package-lock.json`, and the B1 change docs.
- **Affected tests**: legacy-cleanup + init legacy fixtures restored to `opsx-*` (+ new negative test);
  parity unaffected (S1 renamed identifiers, not template payloads). 1369/1369 green.
- **Not test-covered**: packaging/CI files (W5) — verified by inspection; exercised on next CI/pack run.
