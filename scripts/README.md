# orbit scripts

The maintenance and release scripts behind `package.json`'s scripts.

- `postinstall.js` — runs after `npm install`; prints the shell-completions tip (`npm run test:postinstall` runs it by hand).
- `test-postinstall.sh` — exercises `postinstall.js` under a normal install, CI, and the opt-out variable.
- `release-tree.mjs` — `npm run release:tree`: cuts a release as a built release tree and its annotated `v<version>` tag; orbit's only release path.
- `capture-gh-contract.mjs` — `npm run capture:gh`: records the `gh` CLI contract the test suite validates documented `gh` commands against.
- `capture-git-contract.capture.ts`, with `capture.vitest.config.ts` — `npm run capture:git`: records the `git` contract the same way, under its own vitest config so `npm test` never runs it.
- `skill-size-report.mjs` — `npm run size:report`: prints each generated skill body's characters, lines and estimated tokens against the 5,000 kept after a compaction, and each reference file's size; reads the built templates and always exits 0 (CI runs it after the tests on Linux).
- `validate-skills.mjs` — `npm run validate:skills`: generates the skill surface in a temporary project (`orbit init --tools claude`) and runs `claude plugin validate --strict` over its `.claude/`, Claude Code pinned (the `claude` on PATH at that version, else `npx`); a warning fails it (CI runs it after the size report on Linux). `--surface <dir>` validates an existing `.claude/`.

The replay set (`npm run replay`, `npm run replay:compare`) lives in `replay/`, not here: see `replay/README.md`.
