## Context

This is the last stage of `update-gh-documentation` (`orbit architecture show update-gh-documentation public-readiness`).
The repository becomes public at arc-done, and the stage's last act is the `v2.0.0` release (R-ugd-8, R-ugd-9). The
exploration measured the repository at `371981b2` and recorded twelve decisions on Sal's word (see explore.md). The
measurements this design rests on:

- **The root.** 21 tracked files. Most of upstream's are unchanged since the vendor commit, and two orbit-written
  records sit beside them.
- **CI has never passed on orbit.** `ci.yml` runs `pnpm install --frozen-lockfile` against the vendor-era
  `pnpm-lock.yaml` and fails with `ERR_PNPM_OUTDATED_LOCKFILE`. Of its last 100 runs, 93 failed and 7 were cancelled.
  **The test suite has therefore never run in CI**, on any of the three operating systems the push matrix names.
- **Upstream's release path is still wired.** `release-prepare.yml` runs changesets with npm OIDC publishing, and
  `package.json`'s `release` / `release:ci` scripts run `pnpm exec changeset publish`.
- **`LICENSE`** names only `OpenSpec Contributors`.
- **The scan probe found no token shapes** in the tree or in `main`'s history. It found absolute paths in 30 tracked
  files: 24 archive records, one architect trail emit, fixtures, and `.devcontainer`'s home-directory mount.

Constraints the trimmed `CLAUDE.md` must keep, because baseline requirements name it:

- `orbit-conventions`' `Upstream version pinning`: the vendored baseline version is stated in the introductory context.
- `orbit-orientation`'s cold-start pointer: one sentence naming `orbit status`, bare and `--full`.
- `orbit-conventions`' outward-actions requirement: a one-line note stating the rule for non-orbit sessions (SHOULD).
- `orbit-source-lint`'s scenario `A stale figure in a governing document outside orbit/ fails` has `CLAUDE.md` carry a
  marked span.

## Goals / Non-Goals

**Goals:**
- Every root-level file has a recorded disposition, and the repository config upstream left behind is swept with it.
- CI passes with npm before the repository is public.
- `LICENSE` carries both notices before the release ships it.
- The secrets-and-paths scan is recorded, with every finding resolved or accepted for a reason.
- `CLAUDE.md` is a short guide, and its history stays readable in `orbit/architecture/program-history.md`.

**Non-Goals:**
- The visibility flip, the repository description and topics, and deleting the old branches on origin. These are Sal's
  acts at arc-done (D-prd-11).
- Publishing to npm (R-ugd-4).
- The Tier-C scrub of `OpenSpec` strings in code (R-ugd-3).
- Rewriting any record. Archive and trail paths are accepted, never edited (D-prd-9).
- Nix and dev-container support (D-prd-2, D-prd-3). Either returns as its own change if someone asks for it.

## Decisions

### D1 — The root-level dispositions (D-prd-6; exit (1))

The table is copied from explore.md D-prd-6. Each of the 21 tracked root files is in exactly one row.

| file | disposition |
|---|---|
| `README_OLD.md`, `MAINTAINERS.md`, `AGENTS.md` (empty), `.coderabbit.yaml`, `.actrc`, `pnpm-lock.yaml` | DELETE |
| `flake.nix`, `flake.lock` | DELETE (D-prd-2) |
| `openspec-parallel-merge-plan.md`, `adopter-report-openspec-to-orbit-dir.md` | MOVE to `orbit/architecture/` as records, names unchanged |
| `CHANGELOG.md` | REPLACE with orbit's changelog: first entry `2.0.0`, linking upstream's changelog for 1.3.1 and earlier |
| `CLAUDE.md` | KEEP, trimmed (D-prd-4) |
| `LICENSE` | KEEP, both notices (D-prd-5) |
| `package.json` | KEEP, edited (D-prd-7) |
| `README.md`, `package-lock.json`, `.gitignore`, `build.js`, `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `vitest.setup.ts` | KEEP |

The readiness record re-lists the root from `git ls-files` after apply. It confirms that every file left is a KEEP or
REPLACE row and that no file is left without a row.

**Re-pointing the moved records.** Living text that names a moved file as a place to find it is updated to the new
path. That covers `CLAUDE.md`'s source-of-truth list and `orbit/architecture/openspec-1.3.1-architecture.md`'s "the
repo's own" pointer. Text that names a file as history is left alone: a record never changes, and the charter names
what the stage sweeps.

### D2 — CI on npm, keeping the job shape (D-prd-7)

`ci.yml` keeps its structure: a Linux test job on pull requests, the three-OS matrix on pushes to `main`, and the lint
and type-check job. Every `pnpm` step becomes its npm equivalent: `actions/setup-node` with `cache: 'npm'`, `npm ci`,
`npm run build` and `npm test`. The `changes` job existed only to trigger the nix job, so it goes with that job and with
`validate-changesets`. Nothing else in the workflow changes.

The suite has never run in CI, so the first run is a measurement rather than a formality.
- **A job's time limit** is set from the measured local duration of `npm test`, with headroom. Today's limits are 10
  and 15 minutes, and the suite has an exhaustive oracle (rc17a, six shards).
- **A leg that fails** on a test that never ran there is investigated. Where the cause is the test, it is repaired.
  Where the cause is a platform orbit does not support, dropping the leg is a scope call for Sal, briefed with the
  failure. Dropping a leg would narrow a support claim. A test is never skipped to turn a leg green.

Alternative considered: delete CI and rely on local `npm test`. Rejected because a public repository with no check
gives a visitor or contributor no signal, and the failure it hides here was invisible until measured.

### D3 — Upstream's publish machinery goes whole (D-prd-7)

The following are deleted:
- `release-prepare.yml` and `.changeset/`.
- The `changeset`, `release`, `release:ci` and `check:pack-version` scripts, with `scripts/pack-version-check.mjs`
  and its section in `scripts/README.md`.
- `@changesets/changelog-github` and `@changesets/cli` from `devDependencies`, with `package-lock.json` regenerated by
  `npm install`.

`prepublishOnly` and `publishConfig` stay: both are inert unless someone runs `npm publish`, which stays Sal's act
(R-ugd-4). `orbit-release`'s new requirement states the path once. The test for it reads the scripts and the workflow
files.

### D4 — LICENSE (D-prd-5)

Add one line after upstream's copyright line: `Copyright (c) 2026 Michael Sallas`. Nothing else in the file changes. A
test holds both lines, adjacent and in order.

### D5 — CLAUDE.md trimmed; the narrative moves word for word (D-prd-4, D-prd-12)

**What moves.** The per-stage narrative goes to `orbit/architecture/program-history.md` in one move commit:
- the paragraphs from "Current state (as of B3 — parity)" onward that narrate B1–C2;
- the whole "previous program" section, rc01–rc12;
- the D-arc section.

The only edit made to the moved text is stripping its `src:` markers, so a marked figure is left as its bare value.
A short header states what the file is and that its figures are true when written. It opens with a `# ` title so that
`orbit architecture status` lists it as `legacy/opaque`, like `fork-and-orbify`.

**What stays.** The trimmed `CLAUDE.md` keeps:
- what orbit-spec is: a hard fork of `@fission-ai/openspec@1.3.1`, and the read-only `upstream` remote;
- the renames already made;
- the npm toolchain and the refresh command (`npm run build && node bin/orbit.js update --force`);
- D14, D15 and the D11 refinement;
- the live-program pointer, with position computed by `orbit architecture status`;
- the `orbit status` cold-start sentence;
- the five execution disciplines, including outward actions;
- "When in doubt";
- the source-of-truth list, with the history file and the moved merge plan;
- a capability count in a `src:capabilities` marker, so the lint's `CLAUDE.md` scenario keeps a live claim.

The target is about 120 lines. The size is a guide for the editor, not an exit.

**Alternative considered:** trim only and leave the narrative to git history. Rejected (D-prd-4) because the lessons
that appear only in the narrative would become hard to find.

### D6 — The source-lint row retires (D-prd-10)

The `README_OLD.md` / `adopter-report-*.md` exclusion leaves the spec table, `isExcludedPath` in
`src/core/source-lint.ts`, and the two paths in the exclusion test. The moved adopter report needs no new row,
because it carries no `src:` marker and the lint reads only marked spans (measured 2026-10-13). The same holds for the
moved merge plan and for the history file after its markers are stripped. The requirement's paragraph that named
`CLAUDE.md` as its example of narrated history now names the history file. A test asserts that `README_OLD.md` is no
longer excluded.

### D7 — The readiness record

The record is `orbit/changes/public-readiness/readiness-record.md`, written at apply and moved with the change at
archive. It holds:
- the scan, per D-prd-9's table: the commands run, every finding with its row, and the config-file read that stands
  in for the residual;
- the root listing after apply, against D1;
- the pull request's CI run, with its job outcomes;
- the eleven branches for Sal (D-prd-11).

`orbit/scenario-ledger.yaml` declares the scenarios the record observes, citing it.

### D8 — The release (exit (4))

The release is outside apply. After the change archives and its PR merges, Sal says the word. Then
`npm run release:tree` runs on `main`, `git push origin v2.0.0` pushes the tag by name, and a release-tree install
prints `2.0.0`. The release happens after the merge, a state the archive does not reach, so the task is DEFERRED at
the archive seam (`orbit-archive-modifications`' Step 3.2). The architect session that grades exit (4) observes it.

### D9 — Three capabilities, at the ceiling

`orbit-public-repository` is new. Its requirements are the durable claims of D4, D2 and the scan rule. The scan rule's
bounded residual must live in a requirement's own text, and no existing capability owns repository hygiene.
`orbit-release` gains the only-path requirement because it owns how orbit is released (R-crc-14). `orbit-source-lint`
is modified. Three capabilities is R-crc-1's ceiling, not over it.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-prd-9 | BOUNDED | live rule | `orbit-public-repository`: `A secrets-and-paths scan is recorded before the first public release` (a normative TABLE; residual as a named limit) |

The other eleven Decisions entries are `Kind: scope` and have no Mechanism entry, so nothing is carried for them.

## Risks / Trade-offs

- **[CI's first real run]** The suite has never run on Linux, macOS or Windows runners, so failures may surface that
  have nothing to do with this change. → Investigated per D2. A leg is dropped only on Sal's scope call. The record
  carries the run.
- **[A secret no pattern names]** → D-prd-9's named limit, stated once in `orbit-public-repository`'s scan requirement.
  The config-file read is its method.
- **[Three more opaque entries in the program band]** The history file and the two moved records are listed by
  `orbit architecture status` as `legacy/opaque`. → Accepted (D-prd-12): opaque is the honest reading of a record.
- **[The archive habit changes]** Archives no longer append a stage paragraph to `CLAUDE.md`. Each stage's
  `Shipped as` paragraph in its architecture doc already carries the narrative.
- **[`CLAUDE.md` under-trimmed or over-trimmed]** → D5's keep list is enumerated, and the four baseline constraints in
  Context are checked by grep at apply.

## Touchpoints

- `LICENSE` — orbit's notice added.
- `CHANGELOG.md` — replaced.
- `CLAUDE.md` — trimmed.
- `orbit/architecture/program-history.md` — new; the moved narrative.
- `orbit/architecture/openspec-parallel-merge-plan.md` + `orbit/architecture/adopter-report-openspec-to-orbit-dir.md` — moved records.
- `orbit/architecture/openspec-1.3.1-architecture.md` — the merge-plan pointer re-pointed.
- `README_OLD.md` — deleted.
- `MAINTAINERS.md` — deleted.
- `AGENTS.md` — deleted.
- `.coderabbit.yaml` — deleted.
- `.actrc` — deleted.
- `pnpm-lock.yaml` — deleted.
- `flake.nix` + `flake.lock` — deleted.
- `.github/` — `ci.yml` rewritten; `release-prepare.yml` and `CODEOWNERS` deleted.
- `.changeset/` — deleted.
- `.devcontainer/` — deleted.
- `assets/` — deleted.
- `scripts/` — `update-flake.sh` and `pack-version-check.mjs` deleted; `README.md` loses their sections.
- `package.json` + `package-lock.json` — scripts and devDependencies removed.
- `src/core/source-lint.ts` — the historical exclusion retired.
- `test/core/source-lint.test.ts` — the exclusion test updated; the carried scenarios tagged.
- `test/core/public-repository.test.ts` — new; the LICENSE, CI and release-path claims.
- `orbit/scenario-ledger.yaml` — the observed scenarios.
- `orbit/changes/public-readiness/readiness-record.md` — new; the record.
