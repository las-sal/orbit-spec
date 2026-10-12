## Why

The repository goes public when `update-gh-documentation` ends, and its landing page still describes upstream
OpenSpec. `README.md` tells a newcomer to install `@fission-ai/openspec`, run `openspec init` and type `/opsx:propose`,
none of which is orbit. It carries upstream's logo, badges and Discord, and it says nothing about what orbit adds. This
is the program's `landing-page` stage (goals G1 and G2): the README says what orbit is, how it improves on OpenSpec,
how to install it at its first version, and how to start, and docs-under-test's checks grade it (see explore.md).

## What Changes

- **`README.md` is rewritten** as orbit's landing page, in the outline of D-lp-4: what orbit is and for whom;
  `Built on OpenSpec` (attribution, the `upstream/v1.3.1` baseline, "forked from 1.3.1, frozen there", telemetry
  removed); `How orbit improves on OpenSpec` (the claims of D-lp-6, each naming its capabilities); `Install` (the
  pinned GitHub install of R-ugd-4 at `v2.0.0`); `Quickstart` (init, the install surface it writes, then explore → propose →
  review → apply → review → archive with the readout naming each gate's walk and confirming review, and `orbit
  status`); `Docs`; `Development`; `Contributing` (D-lp-8); `License`. The page names Claude Code
  and Codex (D-lp-7). Upstream's logo, badges, Discord, philosophy block, dashboard image, tool comparison, usage
  notes, telemetry and maintainers sections leave.
- **`README.md` leaves the pending-rewrite list**, so every docs check now reads it, and the heads it writes (`npm`,
  `cd`) are declared in the `docs-inventory` fence.
- **A new check grades exit (2)** (D-lp-5): every top-level list item under `How orbit improves on OpenSpec` names at
  least one `orbit-*` capability in backticks, and every such name resolves to `orbit/specs/<name>/spec.md`. Whether a
  claim is TRUE stays review's.
- **orbit's first version is `2.0.0`** (R-ugd-7, superseding R-ugd-6's `1.0.0`): `package.json` and
  `package-lock.json` go from upstream's `1.3.1` to `2.0.0`, and the annotated `v2.0.0` tag is cut on the release commit
  R-ugd-8 builds from `main`'s merge commit.
- **A release ships a built release tree** (D-lp-16, R-ugd-8; the system walk's repair of the escalated install
  route): npm cannot build a git dependency installed with `-g` (D-lp-11 … D-lp-13), so `scripts/release-tree.mjs`
  (`npm run release:tree`) builds the commit to release in a detached worktree, commits its `dist/` on a release commit
  whose `package.json` names none of npm's prepare triggers, and tags that commit. R-ugd-4's install line installs it
  unchanged; the from-source route (`npm install -g .`, a link into the clone) is stated in Development.
- **The clone stops fetching upstream's tags** (D-lp-2): the 56 fetched upstream tags are deleted locally (keeping
  `upstream/v1.3.1`), and the `upstream` remote is set to `--no-tags`. Local repository configuration only; nothing in
  the tracked tree changes.
- **The onboard body separates orbit's version from the upstream baseline** (D-lp-9). Today it says "run `orbit
  --version` … the pinned engine version is 1.3.1", which reads as a contradiction once `--version` prints `2.0.0`.
- **The install and quickstart are run on a clean machine** (exit (3), D-lp-10): rehearsed from a local `git+file://`
  clone before the repository is public, and re-run against the public URL after the flip.

## Capabilities

### New Capabilities

- `orbit-release`: a release ships a built release tree, cut by the release script; the trigger table and the
  npm-version named limit (D-lp-16).

### Modified Capabilities

- `orbit-user-docs`: an ADDED requirement for the improvement-claims check; the file-local check set gains it; the
  `docs-inventory` fence declares the README's heads.
- `orbit-onboard`: the Orientation requirement names orbit's version (`orbit --version`) apart from the upstream
  engine baseline (1.3.1).

## Impact

- `README.md` (rewritten); `test/core/user-docs/pending-rewrite.json` (README removed);
  `test/helpers/user-docs.ts` and a new test under `test/core/user-docs/` (the claims check).
- `package.json`, `package-lock.json` (version `2.0.0`).
- `src/core/templates/workflows/onboard.ts` (one sentence) and the onboard hash pins in
  `test/core/templates/skill-templates-parity.test.ts`.
- `scripts/release-tree.mjs`, the `release:tree` script in `package.json`, and `test/integration/release-tree.test.ts`.
- Local git: tags and the `upstream` remote's tag option. Outward: the `v2.0.0` tag pushed to `origin` by name.
- No engine code changes. Baseline capabilities 27 → 28 (`orbit-release`).
