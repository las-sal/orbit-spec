# orbit scripts

The maintenance and release scripts behind `package.json`'s scripts.

- `postinstall.js` — runs after `npm install`; prints the shell-completions tip (`npm run test:postinstall` runs it by hand).
- `test-postinstall.sh` — exercises `postinstall.js` under a normal install, CI, and the opt-out variable.
- `release-tree.mjs` — `npm run release:tree`: cuts a release as a built release tree and its annotated `v<version>` tag; orbit's only release path.
- `capture-gh-contract.mjs` — `npm run capture:gh`: records the `gh` CLI contract the test suite validates documented `gh` commands against.
- `capture-git-contract.capture.ts`, with `capture.vitest.config.ts` — `npm run capture:git`: records the `git` contract the same way, under its own vitest config so `npm test` never runs it.
