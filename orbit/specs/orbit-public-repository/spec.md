# orbit-public-repository Specification

## Purpose
What the public repository carries beside its code: the license notices orbit owes as a fork of an MIT project, a CI
workflow that checks every pull request, merge-queue group and push to `main` with orbit's own toolchain, and the
secrets-and-paths scan recorded before the repository's first public release.

## Requirements
### Requirement: The license carries upstream's notice and orbit's

`LICENSE` SHALL be one MIT license text carrying two copyright lines: upstream's
`Copyright (c) 2024 OpenSpec Contributors` first, and orbit's `Copyright (c) 2026 Michael Sallas` on the line directly
beneath it. The permission and warranty text is upstream's, unchanged, and appears once. orbit is a fork of an MIT
project, and MIT requires the upstream notice to be kept in every copy. Orbit's line names the holder of the work
added since the fork. The installed package carries `LICENSE`, so the release (`orbit-release`) ships both notices.

#### Scenario: Both notices, upstream's first

- **WHEN** `LICENSE` is read
- **THEN** it carries `Copyright (c) 2024 OpenSpec Contributors` on one line and `Copyright (c) 2026 Michael Sallas` on
  the next, and the MIT permission paragraph appears exactly once

### Requirement: CI checks every commit with orbit's toolchain

The repository's CI workflow SHALL install dependencies with `npm ci` against `package-lock.json`, then run
`npm run build` and `npm test`, on Linux and macOS, on every event the workflow's required checks run on: a
pull request, a merge-queue group, and a push to `main`. No
workflow SHALL invoke `pnpm` or `nix`, because npm is orbit's toolchain and `package-lock.json` is its only lockfile.
The workflow files are `.github/workflows/*.yml` and `.github/workflows/*.yaml`. Upstream's workflow installed with pnpm
against a lockfile frozen at the vendor commit, so it failed at install on every run once orbit's dependencies
diverged, and it ran its macOS and Windows legs only on a push to `main`, after a change had merged. Windows is not
checked: orbit is developed and used on Linux and macOS, its test harness assumes a POSIX shell and LF line endings,
and a `pwsh` leg reported success over failing tests because `npm test`'s exit did not reach the step. Restoring a
Windows leg that can fail is a change of its own (issue #23).

#### Scenario: The CI workflow installs, builds and tests with npm

- **WHEN** the workflow files (`.github/workflows/*.yml` and `*.yaml`) are read
- **THEN** the CI workflow runs `npm ci`, `npm run build` and `npm test` in a job whose matrix names Linux and macOS and
  which runs on `pull_request`, `merge_group` and `push`; every `needs` entry names a job the file defines; and no
  workflow file names `pnpm` or `nix`

#### Scenario: CI passes on the change that moves it

- **WHEN** the change that moves CI to npm is pushed and its pull request's checks complete
- **THEN** every job that runs on the pull request completes successfully, both test legs among them

### Requirement: A secrets-and-paths scan is recorded before the first public release

Before the repository is made public, a scan SHALL run over every tracked file at HEAD and over every blob reachable
from the default branch's commits, merge commits and renames included, because history becomes public with the tree. A
ref the repository publishes that the default branch does not contain (a branch, a pull request's head) SHALL be
scanned with it. Every finding SHALL be resolved or ACCEPTED, with the
action or reason its class carries in this table. A secret found in history is rotated or revoked, never rewritten out
of history. The scan is a RECORD kept in the change that ran it, not a check: nothing re-runs it.

The patterns are exact. A TOKEN CANDIDATE is a match of `ghp_[A-Za-z0-9]{36}`, `github_pat_[A-Za-z0-9_]{22,}`,
`sk-[A-Za-z0-9_-]{20,}`, `AKIA[0-9A-Z]{16}`, `xox[abposr]-[A-Za-z0-9-]{10,}` or `-----BEGIN [A-Z ]*PRIVATE KEY-----`. A
candidate is CONFIRMED when it is a credential, and otherwise is a FALSE POSITIVE: an example, a placeholder, or the
pattern written as text. An ABSOLUTE LOCAL PATH is a path beginning `/Users/`, `/home/`, `/tmp/`, `/private/`,
`/var/folders/` or a Windows drive (`C:\`). The record names a confirmed credential's kind and location, never its
value.

| member | covered by |
|---|---|
| a confirmed credential in a tracked file at HEAD | RESOLVED: removed and rotated |
| a confirmed credential only in the default branch's history | RESOLVED: rotated or revoked; history never rewritten |
| a false-positive token candidate | ACCEPTED: not a credential, with what it is |
| an absolute local path in `orbit/changes/archive/**` or `**/.orbit-runs/**` | ACCEPTED: records are true when written and never rewritten |
| an absolute local path in a record under `orbit/architecture/` (a completed program doc, `program-history.md`, a moved record) | ACCEPTED: records are true when written and never rewritten |
| an absolute local path in `test/**` or `src/core/templates/**` | ACCEPTED: an example, not a machine's path |
| an absolute local path in any other living file | RESOLVED: removed |
| an email address in the default branch's authorship | ACCEPTED: the author's chosen public address |

Named limit (the scan's patterns). Residual kind: a secret in a shape no pattern names: a bespoke API key, a password or private URL in prose, a credential in a config file. Residual method: a read of every tracked config-shaped file (`*.json`, `*.yml`, `*.yaml`, dotfiles) at HEAD, recorded beside the pattern scan: by eye for a living file, and by machine for a record or a test fixture, through a sweep for credential-shaped keys with a value and URL userinfo plus a scan for high-entropy mixed-case strings. The machine read misses a secret with neither shape, such as a password written in plain words inside a record. No published secret scanner is installed here (`gitleaks`, `trufflehog`: not found, 2026-10-13).

#### Scenario: Every finding is resolved or accepted with its class's reason

- **WHEN** the scan has run over the tree and the default branch's history
- **THEN** the record lists every finding under one row of the table, with the action its row names for each RESOLVED
  finding and the row's reason for each ACCEPTED one, and no credential's value

#### Scenario: The pattern scan's residual is read, not assumed

- **WHEN** the scan is recorded
- **THEN** the record also lists the config-shaped tracked files that were read for unpatterned secrets, which were
  read by eye and which by machine, and what each read found

