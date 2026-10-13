# Readiness record — public-readiness

Written at apply (2026-10-13) on branch `public-readiness`, over the tree as staged after tasks 1.1–4.2 (parent
`c2ea2c1f`), and over `main`'s full history at `7febd8ce` (898 commits). This is a RECORD (design D7): it states what was
run and found, and nothing re-runs it. The scan's rule, its classes and its named limit are `orbit-public-repository`'s
`A secrets-and-paths scan is recorded before the first public release`; this file names them and does not restate them.

## 1. The scan (task 5.1)

### Commands

The token patterns and path prefixes are the requirement's, joined as one extended regex each (`$TOK`, `$P` below).
`grep` on this machine is ugrep; every pattern was checked to fire on a planted sample before a zero was believed.

```bash
TOK='ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|xox[abposr]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----'
P='(/Users/|/home/|/tmp/|/private/|/var/folders/)[A-Za-z0-9._~-]|(^|[^A-Za-z0-9_])[A-Z]:\\[A-Za-z0-9._~-]'
git add -A                                   # so files new at apply are tracked
git grep --cached -nE "$TOK"                 # the tree: 2,282 tracked files
git grep --cached -lE "$P"
git log main -p --no-color --format='commit %H' \
  | awk '/^commit [0-9a-f]{40}$/{c=$2; next} /^\+\+\+ /{f=substr($2,3); next} /^\+[^+]/{print c"\t"f"\t"substr($0,2)}' \
  | grep -E "$TOK"                           # history: every line any commit on main ever added
#   … and the same stream through "$P"
git log main --format='%ae' | sort | uniq -c # authorship
git log main --format='%ce' | sort | uniq -c
git log main --format='%b' | grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' | sort | uniq -c
```

**How the path prefixes were read.** The requirement defines an absolute local path as a path BEGINNING with a prefix.
The first run treated a drive letter as any letter followed by `:\`, which matched 157 files, nearly all of them regular
expressions and `\n` escapes in source (`Requirement:\s`, `changes:\n`). The run recorded here requires that no word
character precede the drive letter and that a path character follow every prefix. A prefix written alone, with no path
after it, is the class written as text (the scan requirement's own table), not a path. `git log -G` was not used,
because its pickaxe reads a basic regular expression, which the token patterns are not.

### Token candidates

| where | matches |
|---|---|
| tracked files (index) | 0 |
| `main`'s history (every added line) | 0 |

No token candidate, so no CONFIRMED credential and no FALSE POSITIVE row is used.

### Absolute local paths at HEAD

73 tracked files after the two resolutions below, each under one row:

| row | files | action / reason |
|---|---|---|
| a path in `orbit/changes/archive/**` or `**/.orbit-runs/**` | 66: 65 trail files (64 across 30 change directories, archived and this change's own, plus `orbit/architecture/.orbit-runs/architect-2026-09-11T20-36-35Z.json`) and `orbit/changes/archive/2026-10-13-concept-docs/migration-run.md` | ACCEPTED: records are true when written and never rewritten |
| a path in a record under `orbit/architecture/` | 1: `orbit/architecture/fork-and-orbify.md` (`/tmp/openspec-src`, lines 179 and 439) | ACCEPTED: records are true when written and never rewritten |
| a path in `test/**` or `src/core/templates/**` | 6: `src/core/templates/workflows/feedback.ts`, `src/core/templates/workflows/pr-choreography.ts`, `test/commands/completion.test.ts`, `test/core/pr/select.test.ts`, `test/utils/file-system.test.ts`, `test/utils/shell-detection.test.ts` | ACCEPTED: an example, not a machine's path |
| a path in any other living file | 2, both RESOLVED below | RESOLVED: removed |

The two resolved at apply:
- `orbit/changes/public-readiness/explore.md` (Premise, the exploration's scan probe): it quoted a directory under the
  author's home and two placeholder home directories. Reworded to name them without the paths.
- `src/core/boot-render.ts:106` (a comment): `macOS /var vs /private/var` became `macOS's /var symlink against its
  realpath`.

The real machine paths among the ACCEPTED records include the author's home directory in the architect trail emit
named above and the npm cache path in `concept-docs`' `migration-run.md`. Both are records, kept as written.

### Absolute local paths in `main`'s history only

106 added lines with a path, in 79 files. Every file that still carries one at HEAD is covered above. The files that
carried one only in history, each under the row its path had then:

| file (at the commit that added it) | row | action / reason |
|---|---|---|
| `.devcontainer/devcontainer.json` (`d665f12d`, the vendor commit; `/home/node/.ssh` mount target) | any other living file | RESOLVED: removed (the file is deleted, task 1.1); history never rewritten |
| `openspec/changes/archive/2025-12-20-add-global-config-dir/specs/global-config/spec.md`, `openspec/specs/global-config/spec.md` (`d665f12d`; `C:\Users\User\AppData\…`) | upstream's records and specs, as vendored | RESOLVED: removed when orbit stripped upstream's `openspec/` directory (A1); the vendor commit is the tagged baseline and is never rewritten |
| `openspec/changes/archive/2025-12-21-add-config-command/proposal.md`, `openspec/explorations/workspace-user-journeys.md` (`d665f12d`; `/Users/me/…` examples) | as above | as above |
| `openspec/explore/fork-and-orbify/explore.md` (`d2d4293a`; `/tmp/openspec-src`) | a record under `orbit/architecture/` (the file is now `orbit/architecture/fork-and-orbify.md`) | ACCEPTED: records are true when written |
| `orbit/changes/concept-docs/migration-run.md` (`91b04867`; the npm cache path) | `orbit/changes/archive/**` (archived since) | ACCEPTED: records are true when written |
| `orbit/explore/public-readiness/explore.md` (`7febd8ce`; the probe's quoted paths) | any other living file | RESOLVED: removed at HEAD (above); history never rewritten |

The scan requirement's table has no row of its own for a path found ONLY in history. Each row above is the one the
path's file had when the path was written. Where that was "any other living file", the path is removed at HEAD and
history keeps it. That is the requirement's own rule for history (never rewritten), applied to a path.

### Email addresses in authorship

| address | where | count | row |
|---|---|---|---|
| `public@sallas.org` | author and committer | 888 | ACCEPTED: the author's chosen public address |
| `sal@sallas.org` | author | 10 | ACCEPTED: the author's chosen public address (flagged to Sal at apply: the record cannot know whether this second address was chosen as public) |
| `noreply@github.com` | committer of the 10 commits GitHub made (merges) | 10 | ACCEPTED: GitHub's no-reply address |
| `noreply@anthropic.com` | `Co-Authored-By` trailers | 774 | ACCEPTED: a no-reply address |

### The residual read: config-shaped tracked files (the named limit's method)

1,197 tracked files are config-shaped (`*.json`, `*.yml`, `*.yaml`, dotfiles).

**Read in full, by eye (13 living files):** `.github/workflows/ci.yml`, `.gitignore`,
`orbit/changes/public-readiness/.openspec.yaml`, `orbit/config.yaml`, `orbit/scenario-ledger.yaml`, `orbit/sources.yaml`,
`package.json`, `package-lock.json`, `schemas/spec-driven/schema.yaml`, `test/core/user-docs/pending-rewrite.json`,
`test/integration/cli-contracts/git-contract.json`, `test/integration/pr-lifecycle/gh-contract.json`, `tsconfig.json`.
Found: no credential, password, private URL or token. `package-lock.json`'s 4,161 lines were read structurally: every
`resolved` URL is on `https://registry.npmjs.org/` (none elsewhere), and no `_auth`, `authToken` or `registry=` entry
exists. `gh-contract.json` records `gh --version` output only; no account, host login or token. `.gitignore` already
excludes `.env` and `.env.*`.

**Read by keyword sweep (1,184 record and fixture files):** 1,120 trail emits under `.orbit-runs/`, 54 other files under
`orbit/changes/archive/`, and 10 under `test/fixtures/`, searched for credential-shaped keys with a value
(`password`, `passwd`, `secret`, `api_key`, `access_key`, `auth_token`, `bearer`, `private_key`, `client_secret`)
and for URLs carrying `user:password@`. Found: 10 matches, all FALSE: nine are the word "pass:" in review prose
("this pass: …"), and one is the `@inquirer/password` dependency name in `package-lock.json`. The sweep is weaker
than a read by eye. These files are records written by the engine's emit surface from review and walk prose, and no
tool here writes credentials into them. That is the residual's residual, stated rather than assumed away.

No published secret scanner is installed here (`gitleaks`, `trufflehog`: not found, 2026-10-13), as the requirement's
named limit records.

## 2. The root after apply (design D1)

`git ls-files` at the root, after tasks 1.1–1.3 (12 files):

| file | D1 row |
|---|---|
| `.gitignore` | KEEP |
| `CHANGELOG.md` | REPLACE (orbit's changelog, first entry `2.0.0`) |
| `CLAUDE.md` | KEEP, trimmed (D-prd-4) |
| `LICENSE` | KEEP, both notices (D-prd-5) |
| `README.md` | KEEP |
| `build.js` | KEEP |
| `eslint.config.js` | KEEP |
| `package-lock.json` | KEEP |
| `package.json` | KEEP, edited (D-prd-7) |
| `tsconfig.json` | KEEP |
| `vitest.config.ts` | KEEP |
| `vitest.setup.ts` | KEEP |

Every file left is a KEEP or REPLACE row, and every KEEP / REPLACE row of D1 has its file. The ten DELETE and MOVE rows'
files are gone from the root: `README_OLD.md`, `MAINTAINERS.md`, `AGENTS.md`, `.coderabbit.yaml`, `.actrc`,
`pnpm-lock.yaml`, `flake.nix` and `flake.lock` deleted; `openspec-parallel-merge-plan.md` and
`adopter-report-openspec-to-orbit-dir.md` moved to `orbit/architecture/`.

## 3. The pull request's CI run (task 5.2)

The CI workflow's time limit for each test leg is 30 minutes. It was set from `npm test` measured locally at apply
(171 files, 3,679 tests): 118.9 s wall-clock on 12 cores, 437 s of summed test time. GitHub's hosted runners have 3–4
cores, and Windows file I/O is slower, so a leg's tests could take two to four times the summed time divided by its
cores, plus `npm ci` and the build. Upstream's limits were 10 and 15 minutes.

### Run 1 — `38406649116`, on `3f10556a` (the apply commit), event `pull_request`

The first run in orbit's history to get past install: `npm ci` succeeded on all three legs.

| job | outcome | duration |
|---|---|---|
| Lint & Type Check | success | 43 s |
| Test (linux-bash) | failure: 6 of 3,687 tests, in 6 files | 10 min 5 s |
| Test (macos-bash) | failure: 1 of 3,687 tests | 3 min 19 s |
| Test (windows-pwsh) | failure: 36 files, 198 of 3,633 tests (9 skipped) | 21 min 51 s |
| All checks passed (`required-checks-pr`) | failure (a needed job failed) | 5 s |
| All checks passed (`required-checks-main`) | skipped (push-only) | — |

**Linux and macOS: the test was the cause, and the test was repaired (commit `7a32000f`).**
- `test/integration/release-tree.test.ts` (both legs): the runners' Node 20 ships npm 10, which runs `prepare` on
  `npm pack` despite `--ignore-scripts` and writes the build's output to stdout ahead of the JSON. Reproduced locally
  with npm 10.9.9; npm 11, used locally, does not. The test now parses the JSON array from the line that opens it.
- Five `gh absent` cases in `test/core/pr/` (Linux only): the fixture's absent-gh PATH kept `/usr/bin` whole, and
  GitHub's Ubuntu runners install `gh` there beside `git`. The fixture now mirrors the system dirs as links with `gh`
  left out. A new test, `test/core/pr/gh-absent-path.test.ts`, builds a host with `gh` beside `git` and shows the
  links leave it out.

**Windows: five causes, none in the change.** Grouped by the first error of each failing file:
- CRLF checkout: the runner's `core.autocrlf` rewrites line endings. Fenced-mirror parity tests find no owner fence,
  hash pins and goldens differ, the generated-surface and migration-guide reads miss their text, and
  `release-tree.mjs` fails to load. About 20 files.
- POSIX stubs: the `gh` stub, the `git` shim and the external runner fixtures are `#!/bin/sh` scripts, which Windows
  cannot execute from PATH. Every `orbit pr` suite and both external-runner integration suites. About 110 tests.
- Path separators: absolute paths reported with `\` where a test expects `/` (`emit-composition`, `tool-inventory`,
  `boot-render`). Whether any of these is an engine defect on Windows, rather than a test assumption, is not
  established.
- `chmod 000` has no effect on Windows, so the unreadable-file cases in `source-lint` and `validate --sources` read
  the file.
- Two exhaustive-oracle shards exceed their 300 s per-test timeout.

The disposition of the Windows leg was a scope call for Sal (design D2), briefed at apply. It was taken after run 3,
below.

### Run 2 — `38409930678`, on `7a32000f` (the two repairs), event `pull_request`

| job | outcome |
|---|---|
| Lint & Type Check | success |
| Test (linux-bash) | failure: 3,688 of 3,688 tests passed; one suite-level teardown error and 6 unhandled errors (10 min 20 s) |
| Test (macos-bash) | failure: 3,688 of 3,688 tests passed; 4 unhandled errors |
| Test (windows-pwsh) | cancelled by the next push (run 1 holds its evidence) |

Both repairs held. Two causes remained, both in the test harness rather than the code under test, and both repaired:
- **`[vitest-worker]: Timeout calling "onTaskUpdate"`** (both legs). The exhaustive-oracle shards each run one
  synchronous loop of 45–96 s on these runners. A worker whose event loop never turns cannot read vitest's RPC
  replies, so its calls to the main process time out, and vitest fails the run although every test passed. On both
  legs only the oracle shards ran longer than 60 s. `runOracleShard` (`test/helpers/invoked-oracle.ts`) now yields to
  the event loop about once a second; its cases and verdicts are unchanged.
- **`ENOTEMPTY` removing the release-tree test's scratch clone** (Linux). Something was still writing the clone's
  `.git/objects` during teardown, most likely git's detached auto-gc or maintenance. The test's git environment now
  sets `gc.auto=0` and `maintenance.auto=false`, and the teardown retries the removal.

### Run 3 — `38411554553`, on `5257847f` (the harness repairs), event `pull_request`

| job | outcome | duration |
|---|---|---|
| Lint & Type Check | success | 30 s |
| Test (linux-bash) | success: 3,688 of 3,688 tests, no errors | 10 min 38 s |
| Test (macos-bash) | success: 3,688 of 3,688 tests, no errors | 3 min 6 s |
| Test (windows-pwsh) | **success reported, FALSE**: the step's own log reads `198 failed \| 3427 passed \| 9 skipped (3634)` | 18 min 2 s |
| All checks passed (`required-checks-pr`) | success, over the false Windows green | 4 s |

**The Windows leg cannot fail on a test failure.** Under `shell: pwsh`, `npm test`'s non-zero exit does not reach the
step. Run 1's Windows leg failed only because vitest also reported 7 unhandled errors. Run 3's had none, so the leg
reported success over 198 failing tests. Every run of upstream's Windows leg was exposed to the same fault, and none
had ever got past install. Linux and macOS run under `bash`, and their summaries above were read from the logs, not
from the job status.

## 4. The past-stage branches on origin, for Sal (D-prd-11)

`git ls-remote --heads origin` at apply lists 13 heads. `main` and `public-readiness` (this change's own) stay. These
eleven are past stages' branches, every one an ancestor of `origin/main` (checked with
`git merge-base --is-ancestor`). Deleting them is Sal's act at arc-done:

`b1-relocate-workflows`, `c1-engine-gates`, `c2-parallel-merge-guardrail`, `concept-docs`, `d-arc`, `docs-under-test`,
`landing-page`, `rc12-body-adoption`, `rc12-engine-owned-choreography`, `reference-docs`, `report-archived-change`.

### The Windows leg is dropped (Sal, 2026-10-13)

Briefed with runs 1–3. Sal's word: "i've no intention of using this on windows so fine to drop. ok to make a gh issue if
someone else wants to take up when i opensource". The matrix is now `linux-bash` and `macos-bash`.
`orbit-public-repository`'s CI requirement names Linux and macOS, and states that Windows is not checked, and why.
Issue [#23](https://github.com/las-sal/orbit-spec/issues/23) records the five causes, the false green, and what a
Windows leg would need. No test was skipped.

### Run 4 — `38418242716`, on `b981a334` (the Windows leg dropped), event `pull_request`: the run of record

| job | outcome | duration |
|---|---|---|
| Lint & Type Check | success | 45 s |
| Test (linux-bash) | success: 3,688 of 3,688 tests, in 173 files, no errors | 8 min 45 s |
| Test (macos-bash) | success: 3,688 of 3,688 tests, in 173 files, no errors | 3 min 29 s |
| All checks passed (`required-checks-pr`) | success | 3 s |
| All checks passed (`required-checks-main`) | skipped (push-only) | — |

Every job that runs on the pull request completed successfully, both test legs among them. The test summaries were
read from each leg's log. This is the observation `orbit-public-repository`'s `CI passes on the change that moves it`
cites (`orbit/scenario-ledger.yaml`). A later push to this branch runs CI again, and this record does not follow it.
