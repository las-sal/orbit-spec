## 1. Root files and repository config (design D1, D3)

- [x] 1.1 Delete `README_OLD.md`, `MAINTAINERS.md`, `AGENTS.md`, `.coderabbit.yaml`, `.actrc`, `pnpm-lock.yaml`,
  `flake.nix`, `flake.lock`, `.github/CODEOWNERS`, `.github/workflows/README.md`, `.changeset/`, `.devcontainer/`,
  `assets/` and `scripts/update-flake.sh` (D-prd-2, D-prd-3, D-prd-6, D-prd-8; design D2)
- [x] 1.2 `git mv` `openspec-parallel-merge-plan.md` and `adopter-report-openspec-to-orbit-dir.md` into
  `orbit/architecture/`, and re-point the living text that names either file as a place to find it (design D1)
- [x] 1.3 Replace `CHANGELOG.md` with orbit's changelog: a `2.0.0` entry for the fork's first release, linking
  upstream's changelog for 1.3.1 and earlier
- [x] 1.4 Delete `.github/workflows/release-prepare.yml`, the `changeset`, `release`, `release:ci` and
  `check:pack-version` scripts, `scripts/pack-version-check.mjs`, both `@changesets/*` devDependencies (with
  `npm install` regenerating `package-lock.json`), and rewrite `scripts/README.md` under an orbit title with one line
  per remaining script (design D3)
- [x] 1.5 Add `Copyright (c) 2026 Michael Sallas` beneath upstream's line in `LICENSE` (D-prd-5)

## 2. CI, the upstream links, and their test (design D2, D10)

- [x] 2.1 Rewrite `.github/workflows/ci.yml` on npm per design D2: the three-OS matrix runs on `pull_request`,
  `merge_group` and `push` and absorbs `test_pr`; both aggregate jobs drop `nix-flake-validate` from `needs` and their scripts, and
  `required-checks-pr` needs `test_matrix`; the `changes`, nix and `validate-changesets` jobs go; every remaining
  `needs` entry names a defined job; each test job's time limit is set from the measured local duration of `npm test`,
  with headroom
- [x] 2.2 Retarget the three upstream links in `src/core/init.ts` and `src/core/update.ts` to
  `https://github.com/las-sal/orbit-spec` and its `/issues` (design D10, R-ugd-12)
- [x] 2.3 `test/core/public-repository.test.ts` tags `Both notices, upstream's first`, `The CI workflow installs, builds
  and tests with npm`, `No package script publishes` and `No workflow publishes`, reads the workflow files as
  `.github/workflows/*.yml` and `*.yaml`, holds the three links of 2.2, and shows each assertion able to fail

## 3. The source-lint row (design D6)

- [x] 3.1 Retire the historical exclusion from `isExcludedPath` in `src/core/source-lint.ts` and from the exclusion
  test, add a case showing `README_OLD.md` is no longer excluded, and tag the eight carried scenarios of `The lint
  reads living documents across the whole project` on the tests that assert them (or declare one in the ledger, with
  a reason, where no test does)

## 4. CLAUDE.md and the history file (design D5)

- [x] 4.1 Move the per-stage narrative word for word to `orbit/architecture/program-history.md` under a short header,
  stripping only its `src:` markers; confirm `orbit architecture status` lists the file as `legacy/opaque`
- [x] 4.2 Trim `CLAUDE.md` to design D5's keep list, with a `src:capabilities` marker; check by grep that it states
  the upstream baseline, names `orbit status` bare and `--full`, and carries the outward-actions note; `orbit validate
  --sources` passes

## 5. The readiness record (design D7)

- [x] 5.1 Run the scan over every tracked file and over `main`'s full history, read every config-shaped tracked file,
  and write `readiness-record.md`: each finding under its row of the scan requirement's table, the config-file read,
  the root listing against design D1, and the eleven branches for Sal
- [ ] 5.2 Push and record the pull request's CI run: every job's outcome, all three matrix legs among them; a failing
  leg is handled per design D2 (a test repaired, or a dropped leg briefed to Sal as a scope call)
- [x] 5.3 Declare `CI passes on the change that moves it` and the two scan scenarios `observed` in
  `orbit/scenario-ledger.yaml`, citing `readiness-record.md` at the change's active path; the archive's at-archive
  edits re-point those citations to the archived path (design D7)

## 6. Close

- [ ] 6.1 `npm test` (full suite), `orbit validate public-readiness --strict`, `orbit validate --sources`, and `orbit
  status --change public-readiness --scenarios` showing every delta scenario declared
- [ ] 6.2 (User-validation) After this change archives and its PR merges, on Sal's word: `npm run release:tree` on
  `main` cuts the annotated `v2.0.0`, `git push origin v2.0.0` pushes it by name, and a release-tree install prints
  `2.0.0` (exit (4); design D8)
