> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: public-readiness

## Premise

The last stage of `update-gh-documentation`. After it, Sal makes the repository public. The stage must leave nothing
in the repository that misleads, embarrasses or misdirects a visitor, and its last act is the `v2.0.0` release
(R-ugd-8, R-ugd-9). Its charter names root files, upstream assets and links, `LICENSE` attribution, and a scan for
secrets, tokens and local absolute paths.

What the repository holds, measured 2026-10-13 at `371981b2`:

- **Root (22 tracked files; the first count said 21, dropping `flake.nix`, corrected at the proposal walk).** Orbit's own: `CLAUDE.md` (1091 lines of internal program narrative), `README.md`,
  `package.json`, `package-lock.json`. Build tooling: `build.js`, `tsconfig.json`, `eslint.config.js`,
  `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`. Upstream files unchanged since the vendor commit:
  `README_OLD.md`, `CHANGELOG.md` (upstream's history up to 1.3.1), `MAINTAINERS.md` (names upstream's maintainers),
  `AGENTS.md` (empty), `.coderabbit.yaml`, `.actrc`, `pnpm-lock.yaml` (stale: it still lists `posthog-node` and lacks
  `markdown-it`), `flake.lock` (`flake.nix` was edited in A2). Orbit-written records at the root:
  `adopter-report-openspec-to-orbit-dir.md` (2026-08-11) and `openspec-parallel-merge-plan.md` (inherited, with C2's
  status header; cited by `CLAUDE.md` and three architecture docs).
- **Repository meta outside the root.** `.github/CODEOWNERS` is `* @TabishB` (upstream's lead).
  `.github/workflows/release-prepare.yml` runs changesets with npm OIDC publishing. `package.json`'s `release` and
  `release:ci` scripts run `pnpm exec changeset publish`, which contradicts R-ugd-4: the install path is a pinned
  GitHub tag, and npm is Sal's separate outward act. Also: `.changeset/`, `.devcontainer/`, and
  `assets/openspec_*` (referenced only by `README_OLD.md`).
- **CI has never been green on orbit.** `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, which fails
  with `ERR_PNPM_OUTDATED_LOCKFILE` against the stale `pnpm-lock.yaml`. Of its last 100 runs, 93 failed and 7 were
  cancelled. Once the repository is public, every visitor sees a red check on every commit and PR.
- **`LICENSE`** is MIT, `Copyright (c) 2024 OpenSpec Contributors` only.
- **A coupling the deletions trip.** `orbit-source-lint`'s exclusion table names `README_OLD.md` and
  `adopter-report-*.md` as HISTORICAL (`src/core/source-lint.ts:131-132` and its test). Deleting or moving either
  file leaves a dead row, so the stage touches that capability.
- **Scan probe (rough, not the stage's scan).** No token shapes (`ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox[bp]-`,
  private-key headers) in tracked files or in `main`'s full history. Absolute local paths appear in 30 tracked files:
  24 under `orbit/changes/archive/`, one architect trail emit naming `/Users/sal/code/home-env-test`, and the rest
  are fixtures (`/home/user/…`, `/Users/john/…`) or `.devcontainer`'s `${localEnv:HOME}` mount. `main`'s authorship
  is `public@sallas.org` (887 commits) and `sal@sallas.org` (10).
- **Origin carries 12 branch heads**, eleven of them past stage branches, all visible once the repository is public.
  The only tag on origin is `upstream/v1.3.1`.

## Mechanism

### D-prd-9 — the secrets-and-paths scan covers the tree and `main`'s history, and its accepted findings carry a reason
Domain: every class of finding the scan can produce
| member | covered by |
|---|---|
| a token shape (`ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox[bp]-`, a private-key header) in a tracked file at HEAD | RESOLVED: removed and rotated. Probe 2026-10-13: 0 |
| a token shape in `main`'s history | RESOLVED: rotated, history never rewritten. Probe 2026-10-13: 0 |
| an absolute local path in `orbit/changes/archive/**` or `**/.orbit-runs/**` | ACCEPTED: records are true when written and never rewritten |
| an absolute path in `test/**` or a template's worked example (`src/core/templates/workflows/feedback.ts`) | ACCEPTED: an example, not a machine's path |
| an absolute local path in any other living file | RESOLVED: removed. `.devcontainer`'s `${localEnv:HOME}/.ssh` mount leaves with D-prd-3 |
| an email address in `main`'s authorship | ACCEPTED: `public@sallas.org` and `sal@sallas.org` are Sal's chosen public addresses |
Closure: BOUNDED — the shapes a secret takes are not a closed set
Residual kind: a secret in a shape no pattern names: a bespoke API key, a password or private URL in prose, a credential in a config file
Residual method: a read of every tracked config-shaped file (`*.json`, `*.yml`, `*.yaml`, dotfiles) at HEAD, recorded beside the pattern scan; no published secret scanner is installed here (`gitleaks`, `trufflehog`: not found, 2026-10-13)
Moves:
- READ: applied — the probe's counts were run on 2026-10-13: 0 token shapes in the tree and in `main`'s history, and 30 tracked files with absolute paths (24 in archive records)
- ENUMERATE: applied — this table; every probe hit falls in one row
- COHERE: applied — "rotated, never rewritten" for history and "records never rewritten" for archive paths are one principle: what was published stays as written
- EXECUTE: applied — the probe classified every hit outside the archive into the fixture, example, trail-record or `.devcontainer` rows
- FALSIFY: applied — a pattern scan misses unpatterned secrets; the residual's config-file read exists for exactly that
- CONFORM: applied — R-crc-10 (a record, not a check) and R-ugd-9 (the release follows the stage's merge, so the scan lands before the tag)
- FEASIBILITY: applied — the history pass over 897 commits on `main` ran in seconds
- CONSUME: applied — exit (2) reads the record; Sal reads it before the flip
- INVOKE: applied — runs once, in the change's apply, before the release act

## Decisions

- **2026-10-13 — D-prd-1: the keep / move / delete sweep covers repository meta, not only root files**
  Kind: scope
  The charter names root files. On Sal's word, the sweep also covers every upstream-owned config that a visitor or
  CI would act on: `.github/` (CODEOWNERS, both workflows), `.changeset/`, `.devcontainer/`, `assets/`, and the
  upstream release scripts in `package.json`. Exit (1)'s "every root-level file has a recorded decision" is the floor,
  not the boundary.
- **2026-10-13 — D-prd-2: Nix support is deleted, not repaired** (resolves Q-prd-5)
  Kind: scope
  Delete `flake.nix`, `flake.lock`, `scripts/update-flake.sh` and CI's nix job. The flake builds with pnpm from the
  stale `pnpm-lock.yaml` against a hard-coded dependency hash and still calls the package `openspec`. Nix is not
  installed here and nothing has used the flake. R-ugd-4 makes the pinned GitHub install the one supported path, and a
  second, unmaintained path is worse than none. Sal, 2026-10-13: "yes, delete it". A request from a Nix user after
  launch would be its own change.
- **2026-10-13 — D-prd-3: the dev container is deleted** (resolves Q-prd-3's `.devcontainer/` item)
  Kind: scope
  Delete `.devcontainer/` (`devcontainer.json`, `README.md`). It is upstream's VS Code setup, nothing in the
  repository references it, and like the flake (D-prd-2) it is a second, unmaintained way in. It also carries the
  `${localEnv:HOME}/.ssh` bind mount the scan probe found. Sal, 2026-10-13: "delete .devcontainer too".
- **2026-10-13 — D-prd-4: `CLAUDE.md` is trimmed to guidance and its narrative moves to a history file** (resolves Q-prd-9)
  Kind: scope
  `CLAUDE.md` keeps what every session needs, roughly 120 lines: what orbit-spec is, the npm toolchain and the
  refresh command, the D14 / D15 / D11 rulings, the execution disciplines, "When in doubt", where the plan lives,
  and the live-program pointer. The per-stage narrative (about 900 lines, the A1 to rc12 and D1 to D6 paragraphs)
  moves VERBATIM to a history file under `orbit/architecture/`, so the lessons that appear only there stay
  readable. Nothing in code or tests reads `CLAUDE.md`, and the engine reads only its `src:` markers. Consequence:
  archives stop appending a stage paragraph to `CLAUDE.md`. Sal, 2026-10-13: "trim and move the history".
- **2026-10-13 — D-prd-5: `LICENSE` carries both notices under one MIT text** (resolves Q-prd-7)
  Kind: scope
  Upstream's `Copyright (c) 2024 OpenSpec Contributors` stays first, and orbit's line is added directly beneath it:
  `Copyright (c) 2026 Michael Sallas`. The permission and warranty text is unchanged. This meets exit (3). A full
  legal name is the conventional and clearest holder for a single-maintainer project. Sal, 2026-10-13: "full name:
  Michael Sallas".
- **2026-10-13 — D-prd-6: every root-level file has a disposition** (resolves Q-prd-1; exit (1))
  Kind: scope
  | file | disposition |
  |---|---|
  | `README_OLD.md`, `MAINTAINERS.md`, `AGENTS.md` (empty), `.coderabbit.yaml`, `.actrc`, `pnpm-lock.yaml` | DELETE |
  | `flake.nix`, `flake.lock` | DELETE (D-prd-2) |
  | `openspec-parallel-merge-plan.md`, `adopter-report-openspec-to-orbit-dir.md` | MOVE to `orbit/architecture/` as records; re-point `CLAUDE.md`'s citations and the architecture docs' mentions |
  | `CHANGELOG.md` | REPLACE with orbit's changelog, first entry `2.0.0`, linking upstream's changelog for 1.3.1 and earlier |
  | `CLAUDE.md` | KEEP, trimmed (D-prd-4) |
  | `LICENSE` | KEEP, both notices (D-prd-5) |
  | `package.json` | KEEP, edited (D-prd-7) |
  | `README.md`, `package-lock.json`, `.gitignore`, `build.js`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `vitest.setup.ts` | KEEP |
  Twenty-two tracked root files (first counted as 21, corrected at the proposal walk), each in exactly one row (measured 2026-10-13 with `git ls-files`). Sal, 2026-10-13:
  "accept the leanings as written".
- **2026-10-13 — D-prd-7: CI moves to npm and upstream's publish machinery is deleted** (resolves Q-prd-2)
  Kind: scope
  `.github/workflows/ci.yml` installs with `npm ci` and runs `npm run build` and `npm test`, so the repository goes
  public with a passing check. Its nix job goes (D-prd-2) and so does its `validate-changesets` job. Deleted:
  `.github/workflows/release-prepare.yml`, `.changeset/`, the `changeset`, `release`, `release:ci` and
  `check:pack-version` scripts, `scripts/pack-version-check.mjs` and its section in `scripts/README.md`, and both
  `@changesets/*` devDependencies. R-ugd-4 makes the pinned GitHub tag the install path, R-ugd-8 makes
  `npm run release:tree` the release, and R-ugd-9 already names upstream's npm-publish scripts as this stage's edit.
  Sal, 2026-10-13: "accept the leanings as written".
- **2026-10-13 — D-prd-8: CODEOWNERS and upstream's image assets are deleted** (resolves Q-prd-3)
  Kind: scope
  `.github/CODEOWNERS` (`* @TabishB`) would route review requests to upstream's lead; a single-maintainer repository
  needs none. `assets/openspec_*` go with `README_OLD.md`, their only reader. Sal, 2026-10-13: "accept the leanings as
  written".
- **2026-10-13 — D-prd-9: the secrets-and-paths scan covers the tree and `main`'s history, and its accepted findings carry a reason** (resolves Q-prd-4; exit (2))
  Kind: rule
  The scan runs over every tracked file at HEAD and over `main`'s full history, because history goes public too. A
  finding is resolved by removal, or ACCEPTED with the reason its class carries in the Mechanism entry. A secret found
  in history is rotated, never rewritten out. The result is a RECORD in the change, not a check (R-crc-10): the
  program ends at the flip and nothing re-runs it. Sal, 2026-10-13: "accept the leanings as written".
- **2026-10-13 — D-prd-10: the two historical rows leave `orbit-source-lint`'s exclusion table** (resolves Q-prd-6)
  Kind: scope
  `README_OLD.md` is deleted and the adopter report moves (D-prd-6), so the table's `README_OLD.md` /
  `adopter-report-*.md` row, its two lines in `src/core/source-lint.ts`, and its test cases retire. The moved files
  need no new row: measured 2026-10-13, neither carries a `src:` marker, and the lint reads only marked spans. This
  touches one capability, `orbit-source-lint`. Sal, 2026-10-13: "accept the leanings as written".
- **2026-10-13 — D-prd-11: the past-stage branches on origin are listed, and deleting them is Sal's** (resolves Q-prd-8)
  Kind: scope
  The stage's record lists the eleven non-`main` heads on origin (`b1-relocate-workflows`, `c1-engine-gates`,
  `c2-parallel-merge-guardrail`, `concept-docs`, `d-arc`, `docs-under-test`, `landing-page`, `rc12-body-adoption`,
  `rc12-engine-owned-choreography`, `reference-docs`, `report-archived-change`, measured 2026-10-13). Deleting
  them is offered to Sal at arc-done beside the visibility flip; no orbit step deletes a remote branch. Sal,
  2026-10-13: "accept the leanings as written".
- **2026-10-13 — D-prd-12: the history file is `orbit/architecture/program-history.md`, its markers stripped** (resolves Q-prd-10)
  Kind: scope
  `orbit architecture status` lists it as `legacy/opaque`, the honest reading of a record. Its `src:` markers are
  stripped in the move so its figures read as true-when-written. Measured 2026-10-13: all six marker lines in
  `CLAUDE.md` sit in the narrative that moves, and no test pins a marker count in `CLAUDE.md`. Source coverage is a
  record, never a failure (`orbit-source-lint`), so a source left with no marker is reported, not refused. Where
  the trimmed `CLAUDE.md` states an engine figure, it marks it. Sal, 2026-10-13: "accept the leanings as written".

## Open questions

## Considered & out

## References

- `orbit/architecture/update-gh-documentation.md`: the stage charter (`orbit architecture show
  update-gh-documentation public-readiness`), R-ugd-4, R-ugd-8 and R-ugd-9.
- `scripts/release-tree.mjs`: the release mechanism the stage's last act runs.
- `orbit/specs/orbit-source-lint/spec.md`: the exclusion table naming the two historical root files.
- CI failure, run `38337245629` on `las-sal/orbit-spec`: `ERR_PNPM_OUTDATED_LOCKFILE`.
