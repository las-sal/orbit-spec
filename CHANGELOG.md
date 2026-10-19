# Changelog

orbit's version numbers are its own. orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0.

## 2.0.2

- `/orbit:propose` and `/orbit:ff` now tell the agent to read the baseline spec of each capability the change
  modifies, and to search the specs for the rule it changes, before writing `proposal.md`; and to copy each MODIFIED
  requirement whole, so no baseline scenario is dropped at archive. Run `orbit update` in a project to pick it up.

See [issue #29](https://github.com/las-sal/orbit-spec/issues/29).

## 2.0.1

- Where orbit suggests starting new work, it names `/orbit:architect <name>` first. An architect session stays
  optional.
- The CLI's user-visible strings say orbit, not OpenSpec. Some names are kept for now: `.openspec.yaml`, the
  data-format tags (such as `openspec-change`), the global config directory, the `OPENSPEC_*` environment
  variables, and the `# OPENSPEC:START` / `# OPENSPEC:END` markers around the completion block orbit writes into a
  bash or zsh rc file.
- The user docs lead with `/orbit:architect` and describe the CLI this release installs.

See [issue #24](https://github.com/las-sal/orbit-spec/issues/24).

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
