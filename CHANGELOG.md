# Changelog

orbit's version numbers are its own. orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0.

## 2.0.0

orbit's first release: a hard fork of [`@fission-ai/openspec@1.3.1`](https://github.com/Fission-AI/OpenSpec),
vendored as this repository's root commit (tagged `upstream/v1.3.1`), with orbit's editorial layer added on top in the
same CLI. [`README.md`](README.md) lists what orbit adds, and [`docs/migration-guide.md`](docs/migration-guide.md)
covers moving a project over from OpenSpec.

- The CLI is `orbit`, a project's working directory is `orbit/`, and the generated skills and commands are named
  `orbit-*` and `/orbit:*`.
- Upstream's telemetry is removed: orbit collects nothing.
- orbit installs from a release tag on GitHub (`npm install -g github:las-sal/orbit-spec#v2.0.0`), not from npm.

## 1.3.1 and earlier

Releases up to and including 1.3.1 are OpenSpec's. Their changelog is
[upstream's](https://github.com/Fission-AI/OpenSpec/blob/v1.3.1/CHANGELOG.md).
