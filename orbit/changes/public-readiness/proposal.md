## Why

The repository goes public when this stage ends (stage `update-gh-documentation › public-readiness`). As it stands, a
visitor would meet upstream's files at the root. `MAINTAINERS.md` names upstream's maintainers and `CODEOWNERS` routes
review requests to upstream's lead. A publish workflow and release scripts publish to npm, which R-ugd-4 ruled is not
the install path. CI has never passed on orbit: 93 of its last 100 runs failed at `pnpm install --frozen-lockfile`
against a lockfile left over from the vendor commit. `LICENSE` names only upstream. The stage's last act is the `v2.0.0`
release (R-ugd-8, R-ugd-9), which ships `LICENSE`, `package.json` and `README.md`, so they must be finished first. The
exploration recorded twelve decisions on Sal's word (see explore.md).

## What Changes

- **Every root-level file gets a recorded keep / move / delete decision** (D-prd-6; exit (1)). The table is in
  design.md. In outline:
  - **Delete:** `README_OLD.md`, `MAINTAINERS.md`, `AGENTS.md`, `.coderabbit.yaml`, `.actrc`, `pnpm-lock.yaml`,
    `flake.nix` and `flake.lock`.
  - **Move to `orbit/architecture/` as records:** `openspec-parallel-merge-plan.md` and the adopter report.
  - **Replace:** `CHANGELOG.md` with orbit's own changelog, starting at `2.0.0`.
- **Repository config is swept too** (D-prd-1). The following are deleted:
  - `.github/CODEOWNERS` and `assets/openspec_*` (D-prd-8).
  - `.devcontainer/` (D-prd-3).
  - Nix: `flake.*` and `scripts/update-flake.sh` (D-prd-2).
- **CI moves to npm** (D-prd-7). `ci.yml` runs `npm ci`, `npm run build` and `npm test` on Linux and macOS for every
  pull request, merge-queue group and push to `main`, and drops its nix and changesets jobs. Its Windows leg is dropped
  (Sal, at apply): it failed 198 tests and could not fail under `pwsh`; issue #23 carries it.
  `.github/workflows/README.md`, which documents the deleted `act` setup, is deleted. **Upstream's npm publish setup is deleted:** `release-prepare.yml`, `.changeset/`, the `changeset`,
  `release`, `release:ci` and `check:pack-version` scripts, `scripts/pack-version-check.mjs`, and the two
  `@changesets/*` devDependencies. `npm run release:tree` becomes the only release path.
- **`LICENSE` carries both notices** (D-prd-5; exit (3)). Upstream's `Copyright (c) 2024 OpenSpec Contributors` stays,
  and `Copyright (c) 2026 Michael Sallas` is added beneath it.
- **`CLAUDE.md` is trimmed to guidance** (D-prd-4, D-prd-12). Its per-stage narrative moves word for word to
  `orbit/architecture/program-history.md`, with its `src:` markers stripped. The trimmed file keeps what the specs ask
  of it: the upstream baseline, the `orbit status` pointer, and the outward-actions note.
- **A secrets-and-paths scan is recorded** (D-prd-9; exit (2)). It covers every tracked file and `main`'s full history.
  Every finding is resolved or accepted with its class's reason, in a readiness record in the change.
- **`orbit-source-lint` retires its historical exclusion row** (D-prd-10). That row names `README_OLD.md` and
  `adopter-report-*.md`. Its paragraph that named `CLAUDE.md` as the living file narrating history names an
  architecture doc's status log instead, and says that a record kept in the domain is read but inert while it carries
  no marker.
- **The upstream links `orbit init` and `orbit update` print are retargeted** to `las-sal/orbit-spec` (R-ugd-12, the
  third carve-out from R-ugd-3, ratified at the proposal walk). Today a new user's first command sends orbit's bug
  reports to OpenSpec's tracker.
- **The past-stage branches on origin are listed for Sal** (D-prd-11). Deleting them is Sal's act at arc-done.
- **The release** (exit (4); R-ugd-9): after this change's PR merges, `npm run release:tree` on `main` cuts the
  annotated `v2.0.0`, and it is pushed by name, on Sal's word. The visibility flip, the repository description and its
  topics stay Sal's acts.

## Capabilities

### New Capabilities
- `orbit-public-repository`: what the public repository carries beside its code. That is the license notices, the CI
  that checks every commit with orbit's toolchain, and the secrets-and-paths scan recorded before the first public
  release.

### Modified Capabilities
- `orbit-source-lint`: `The lint reads living documents across the whole project`. The `README_OLD.md` /
  `adopter-report-*.md` exclusion row retires. The paragraph that named `CLAUDE.md` as the living file narrating history
  names an architecture doc's status log instead, and says that a record kept in the domain is read but inert while it
  carries no marker.
- `orbit-release`: one ADDED requirement. The release tree is orbit's only release path, so the repository carries no
  npm publish script or workflow.

## Impact

- **Root:** eight files deleted, two moved, `CHANGELOG.md` replaced, and `LICENSE` and `CLAUDE.md` edited.
- **`.github/`:** `ci.yml` rewritten; `release-prepare.yml`, `CODEOWNERS` and `workflows/README.md` deleted.
- **Other deletions:** `.changeset/`, `.devcontainer/`, `assets/`, `scripts/update-flake.sh` and
  `scripts/pack-version-check.mjs`. `scripts/README.md` is rewritten for the scripts that remain.
- **`src/core/init.ts` and `src/core/update.ts`:** three upstream links retargeted (R-ugd-12).
- **`package.json` and `package-lock.json`:** four scripts and two devDependencies removed.
- **`src/core/source-lint.ts` and `test/core/source-lint.test.ts`:** the historical exclusion retired.
- **New:** `orbit/architecture/program-history.md`, and a test for the public-repository, release-path and link claims.
- **Records in the change:** a readiness record (the scan, the root dispositions, the CI run, the branch list), with
  `orbit/scenario-ledger.yaml` declaring the scenarios it observes.
- **Baseline capabilities:** 29 → 30.
