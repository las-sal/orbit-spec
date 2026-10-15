## Why

`v2.0.0` carries the old CLI: `orbit init` says "Welcome to OpenSpec", nothing suggests `/orbit:architect`, and the
docs on `main` describe a tool the tag does not install. The program's last stage (`refine-documentation-and-architect`,
stage `release`, G4) cuts `v2.0.1` so that the installed CLI matches the docs. Five places in the user docs pin the
install to `2.0.0`, and nothing checks them, so this bump would be a hand edit with nothing to catch a miss, now and at
every release after it (see explore.md, D-rel-1 and D-rel-2).

## What Changes

- `package.json` and `package-lock.json` move from `2.0.0` to `2.0.1`.
- `CHANGELOG.md` gains a `2.0.1` entry: three user-facing bullets, one per prior stage of the program, and a link to
  issue #24 (D-rel-4).
- The five current-version sites move to `2.0.1`: `README.md` lines 52 and 56, and `docs/installation.md` lines 14, 17
  and 30 (D-rel-2). README's "orbit 2.0.0 is orbit's first release" stays, because it remains true.
- A new user-docs check: every version token in the user docs equals `package.json`'s version, or is on an exact
  admitted list naming why it is not orbit's current version (D-rel-1). It joins the file-local set.
- Not in this change (D-rel-3, D-rel-5): cutting the tag. After archive and merge, `npm run release:tree` runs on
  `main`'s merge commit, Sal pushes `v2.0.1` by name, and the install is observed at ratification. Sal closes issue #24
  at ratification. `scripts/release-tree.mjs` and `orbit-release` are unchanged.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-user-docs`: a new requirement, `The user docs state orbit's current version as package.json's`; and
  `The user docs are a checked surface, gated by an exact pending-rewrite list` names the version check in its
  file-local set.

## Impact

- `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md`, `docs/installation.md`.
- `test/helpers/user-docs.ts` (the check and its admitted list, joined to `fileLocalFailures`) and a new test under
  `test/core/user-docs/`.
- Anything that renders the package version (`orbit --version`, the generated skills' `generatedBy` stamp) moves to
  `2.0.1`. That is the point of the change, and `npm test` shows whether any test pinned the old value.
- No engine code, no workflow template, no generated body changes.
