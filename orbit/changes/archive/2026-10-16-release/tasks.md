## 1. The bump

- [x] 1.1 Move `package.json`'s `version` and `package-lock.json`'s two root `version` fields from `2.0.0` to `2.0.1` (by `npm version 2.0.1 --no-git-tag-version`, which writes no tag)
- [x] 1.2 Run the full `npm run build && npm test`; re-point any fixture that pinned `2.0.0` at `package.json`'s version (design Risks)
- [x] 1.3 Add the `## 2.0.1` entry to `CHANGELOG.md` above `## 2.0.0`: three user-facing bullets and the issue #24 link (design D3, D-rel-4)

## 2. The version check

- [x] 2.1 In `test/helpers/user-docs.ts`, add the version check per `orbit-user-docs`' `The user docs state orbit's current version as package.json's`: the token rule (sentence-ending period accepted), current-or-admitted, install targets current whatever the list says, the exact admitted list (by value, a leading `v` stripped: `1.3.1`, `1.14.1`, `20.19.0`; by phrase, a line break read as a space: README.md's "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0"), and the two-page install-command rule; join it to `fileLocalFailures` under `version`
- [x] 2.2 Add the stale-admission rule as a whole-docs run over the unlisted user docs, in `test/core/user-docs/version.test.ts`
- [x] 2.3 Write `test/core/user-docs/version.test.ts` with one `@scenario behaviour` test per scenario of the new requirement (seven), each shown able to fail, and an exact-list assertion on the admitted list
- [x] 2.4 Mutation-check: with the docs still at `2.0.0`, the shipped-docs test fails naming all five sites. Reverting one admitted phrase, or adding a stale value admission, turns it red

## 3. The docs

- [x] 3.1 Move the five sites to `2.0.1`: `README.md` lines 52 and 56, and `docs/installation.md` lines 14, 17 and 30; leave README.md:14–15's historical phrase
- [x] 3.2 Run the full `npm test`; confirm the version check and every other `orbit-user-docs` check pass and the test-file count did not drop (`Test Files`, no `FAIL`)
- [x] 3.3 Run `node bin/orbit.js --version` after `npm run build` and confirm it prints `2.0.1`
- [x] 3.4 Rehearse the README's install and Quickstart shell steps in a fresh sandbox (design D4, `orbit-conventions`' `Install documentation describes actual install surface`): from a scratch clone carrying a local `v2.0.1` cut by `npm run release:tree`, install into an isolated HOME and npm prefix, run `orbit --version`, then `orbit init --tools claude` in a new project, and check the result against README's `What you should see after install`; record the commands and their output under this task
  - Run 2026-10-15 at the system walk, PASSED: a scratch clone of `release` at `67e98ffe` with the checkout's `node_modules` linked in; `npm run release:tree` printed "Cut v2.0.1 on release commit 36531548… (parent 67e98ffe…)" and `git push origin v2.0.1` (not run; the real repository has no `v2.0.1` tag). With HOME and the npm prefix in the scratch directory (node v25.9.0, npm 11.12.1, git 2.50.1), `npm install -g git+file://<clone>#v2.0.1 < /dev/null` exited 0 and installed a directory, not a link; `command -v orbit` then named the scratch prefix's `orbit` (the PATH also held Homebrew's bin, whose global `orbit` came after the prefix); `orbit --version` printed `2.0.1`. In a new `git init` project, `orbit init --tools claude < /dev/null` exited 0, printed "orbit Setup Complete", "15 skills and 15 commands in .claude/" and "Plan your first piece of work: /orbit:architect <name>", with no "OpenSpec" in its output; it wrote 51 files under `.claude/`: the 15 command files and 15 skill directories of the README's table, each skill with a `SKILL.md`, and `references/` in exactly `address-reviews`, `architect`, `archive`, `audit-drift`, `explore`, `ff`, `propose` and `review`; and `orbit/specs/`, `orbit/changes/`, `orbit/changes/archive/`. `orbit status` printed "No active changes." and "Ready when you are: /orbit:architect <name>" and exited 0
