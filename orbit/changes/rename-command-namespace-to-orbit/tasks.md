# Tasks — rename-command-namespace-to-orbit (before B1)

## 1. Sweep the namespace

- [x] 1.1 `opsx` → `orbit` (lowercase: `opsx:`, `opsx-`, `opsx/`, `'opsx'`) across `src/` + `test/`,
  excluding `orbit/` design docs.
- [x] 1.2 `OPSX` → `ORBIT` (command display-name fields + "(OPSX)" tag).
- [x] 1.3 Verify adapters now emit `<tool>/commands/orbit/<id>.md` and hyphen variants `orbit-<id>`.
- [x] 1.4 Verify `transformToHyphenCommands` operates on `orbit:` → `orbit-`.

## 2. Tests & parity

- [x] 2.1 Update command-generation/adapter test assertions (paths, names).
- [x] 2.2 Update template-body `/opsx:` assertions.
- [x] 2.3 Regenerate skill-templates-parity baseline hashes (command + skill bodies / name fields).
- [x] 2.4 `npm run build && npm test` green (1369).

## 3. Verify & wrap

- [x] 3.1 `orbit init --tools claude` in a scratch dir emits `.claude/commands/orbit/<id>.md`;
  bodies reference `/orbit:<cmd>`.
- [x] 3.2 Confirm command ids / workflow ids / skill dirs (`orbit-*`) unchanged.
- [x] 3.3 Update CLAUDE.md: A2 "Kept `/opsx:`" → namespace now `/orbit:`.
