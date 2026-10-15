## 1. The bump

- [ ] 1.1 Move `package.json`'s `version` and `package-lock.json`'s two root `version` fields from `2.0.0` to `2.0.1` (by `npm version 2.0.1 --no-git-tag-version`, which writes no tag)
- [ ] 1.2 Run the full `npm run build && npm test`; re-point any fixture that pinned `2.0.0` at `package.json`'s version (design Risks)
- [ ] 1.3 Add the `## 2.0.1` entry to `CHANGELOG.md` above `## 2.0.0`: three user-facing bullets and the issue #24 link (design D3, D-rel-4)

## 2. The version check

- [ ] 2.1 In `test/helpers/user-docs.ts`, add the version check per `orbit-user-docs`' `The user docs state orbit's current version as package.json's`: the token rule (sentence-ending period accepted), current-or-admitted, the exact admitted list (by value: `1.3.1`, `1.14.1`, `20.19.0`; by phrase: README.md's "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0"), and the two-page pin rule; join it to `fileLocalFailures` under `version`
- [ ] 2.2 Add the stale-admission rule to the whole-docs run over the unlisted user docs, beside the unused docs-inventory rule
- [ ] 2.3 Write `test/core/user-docs/version.test.ts` with one `@scenario behaviour` test per scenario of the new requirement (six), each shown able to fail, and an exact-list assertion on the admitted list
- [ ] 2.4 Mutation-check: with the docs still at `2.0.0`, the shipped-docs test fails naming all five sites. Reverting one admitted phrase, or adding a stale value admission, turns it red

## 3. The docs

- [ ] 3.1 Move the five sites to `2.0.1`: `README.md` lines 52 and 56, and `docs/installation.md` lines 14, 17 and 30; leave README.md:14–15's historical phrase
- [ ] 3.2 Run the full `npm test`; confirm the version check and every other `orbit-user-docs` check pass and the test-file count did not drop (`Test Files`, no `FAIL`)
- [ ] 3.3 Run `node bin/orbit.js --version` after `npm run build` and confirm it prints `2.0.1`
