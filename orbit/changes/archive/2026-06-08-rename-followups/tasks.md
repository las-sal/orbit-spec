# Tasks — rename-followups (external review remediation)

- [x] C1 — `config.ts`: replace `npx orbit update` with in-process `UpdateCommand`; drop `execSync`.
- [x] W1 — `legacy-cleanup.ts`: revert opencode/junie globs `orbit-*` → `opsx-*`; fix tautological
  tests; add negative test (current `orbit-*` not flagged legacy).
- [x] W2 — `legacy-cleanup.ts`: migration hint dest → `orbit/config.yaml` (keep legacy source).
- [x] W3 — PowerShell completion: `OpenSpec`/`OPENSPEC`/`openspec` → Orbit (file, markers, symbols).
- [x] W5 — packaging/CI: `flake.nix`, `ci.yml`, `pack-version-check.mjs`, `postinstall.js`,
  regenerate `package-lock.json` bin mapping.
- [x] W6 — update B1 (`relocate-modified-upstream-workflows`) proposal/tasks to post-rename contract.
- [x] S1 — `Opsx` → `Orbit` internal template API symbols (src + tests).
- [x] Deferred W4 — docs rewrite tracked as las-sal/orbit-spec#1 (not in this change).
- [x] `npm run build && npm test` green (1369).
