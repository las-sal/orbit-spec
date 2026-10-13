## ADDED Requirements

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
`npm run build` and `npm test`. No workflow SHALL invoke `pnpm` or `nix`, because npm is orbit's toolchain and
`package-lock.json` is its only lockfile. Upstream's workflow installed with pnpm against a lockfile frozen at the
vendor commit, so it failed at install on every run once orbit's dependencies diverged.

#### Scenario: The CI workflow installs, builds and tests with npm

- **WHEN** the workflow files under `.github/workflows/` are read
- **THEN** the CI workflow runs `npm ci`, `npm run build` and `npm test`, and no workflow file names `pnpm` or `nix`

#### Scenario: CI passes on the change that moves it

- **WHEN** the change that moves CI to npm is pushed and its pull request's checks complete
- **THEN** every CI job completes successfully

### Requirement: A secrets-and-paths scan is recorded before the first public release

Before the repository is made public, a scan SHALL run over every tracked file at HEAD and over the default branch's
full history, because history becomes public with the tree. Every finding SHALL be resolved or ACCEPTED, with the
reason its class carries in this table. A secret found in history is rotated, never rewritten out of history. The scan
is a RECORD kept in the change that ran it, not a check: nothing re-runs it.

| member | covered by |
|---|---|
| a token shape (`ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox[bp]-`, a private-key header) in a tracked file at HEAD | RESOLVED: removed and rotated |
| a token shape in the default branch's history | RESOLVED: rotated, history never rewritten |
| an absolute local path in `orbit/changes/archive/**` or `**/.orbit-runs/**` | ACCEPTED: records are true when written and never rewritten |
| an absolute path in `test/**` or a template's worked example | ACCEPTED: an example, not a machine's path |
| an absolute local path in any other living file | RESOLVED: removed |
| an email address in the default branch's authorship | ACCEPTED: the author's chosen public address |

Named limit (the scan's patterns). Residual kind: a secret in a shape no pattern names: a bespoke API key, a password or private URL in prose, a credential in a config file. Residual method: a read of every tracked config-shaped file (`*.json`, `*.yml`, `*.yaml`, dotfiles) at HEAD, recorded beside the pattern scan; no published secret scanner is installed here (`gitleaks`, `trufflehog`: not found, 2026-10-13).

#### Scenario: Every finding is resolved or accepted with its class's reason

- **WHEN** the scan has run over the tree and the default branch's history
- **THEN** the record lists every finding under one row of the table, with a removal for each RESOLVED finding and the
  row's reason for each ACCEPTED one

#### Scenario: The pattern scan's residual is read, not assumed

- **WHEN** the scan is recorded
- **THEN** the record also lists the config-shaped tracked files that were read for unpatterned secrets, and what that
  read found
