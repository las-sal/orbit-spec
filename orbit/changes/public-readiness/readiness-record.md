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

PENDING: recorded after the push.

## 4. The past-stage branches on origin, for Sal (D-prd-11)

`git ls-remote --heads origin` at apply lists 13 heads. `main` and `public-readiness` (this change's own) stay. These
eleven are past stages' branches, every one an ancestor of `origin/main` (checked with
`git merge-base --is-ancestor`). Deleting them is Sal's act at arc-done:

`b1-relocate-workflows`, `c1-engine-gates`, `c2-parallel-merge-guardrail`, `concept-docs`, `d-arc`, `docs-under-test`,
`landing-page`, `rc12-body-adoption`, `rc12-engine-owned-choreography`, `reference-docs`, `report-archived-change`.
