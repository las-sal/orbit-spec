## 1. Version and tags

- [x] 1.1 Bump `package.json` and `package-lock.json` to `2.0.0` with `npm version 2.0.0 --no-git-tag-version` (design D3); `orbit --version` from a fresh build prints `2.0.0`
- [x] 1.2 Clean the tag namespace (design D4): delete exactly the local tags that `git ls-remote --tags upstream` also lists, except `upstream/v1.3.1`, keeping any local-only tag; run `git config remote.upstream.tagOpt --no-tags`, and show that `git fetch upstream` then brings no tag; record the exact deletion set under this task
  - Recorded 2026-10-12: local tags 57, upstream `ls-remote --tags` intersection 56, kept `upstream/v1.3.1` (the only local-only tag). Deleted (56): `@fission-ai/openspec@1.12.0`, `@fission-ai/openspec@1.13.0`, `@fission-ai/openspec@1.13.1`, `@fission-ai/openspec@1.13.2`, `@fission-ai/openspec@1.14.0`, `v0.1.0`, `v0.10.0`, `v0.11.0`, `v0.12.0`, `v0.13.0`, `v0.14.0`, `v0.15.0`, `v0.16.0`, `v0.17.0`, `v0.17.1`, `v0.17.2`, `v0.18.0`, `v0.19.0`, `v0.2.0`, `v0.20.0`, `v0.21.0`, `v0.22.0`, `v0.23.0`, `v0.3.0`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, `v0.8.1`, `v0.9.0`, `v0.9.1`, `v0.9.2`, `v1.0.0`, `v1.0.1`, `v1.0.2`, `v1.1.0`, `v1.1.1`, `v1.10.0`, `v1.11.0`, `v1.12.0`, `v1.13.0`, `v1.13.1`, `v1.13.2`, `v1.14.0`, `v1.2.0`, `v1.3.0`, `v1.3.1`, `v1.4.0`, `v1.4.1`, `v1.5.0`, `v1.6.0`, `v1.6.0-beta.1`, `v1.7.0`, `v1.8.0`, `v1.9.0`. `remote.upstream.tagOpt` = `--no-tags`; `git fetch upstream` then fetched branches only, and `git tag -l` read `upstream/v1.3.1` alone.

## 2. Onboard

- [x] 2.1 Rewrite the Orientation version bullet in `src/core/templates/workflows/onboard.ts` (design D6): `orbit --version` prints orbit's own version, and the engine is pinned at the upstream baseline 1.3.1, stated apart
- [x] 2.2 Re-record both onboard hashes in `test/core/templates/skill-templates-parity.test.ts` as one recorded act; write a text test over the onboard template asserting each of the three Orientation scenarios and tag it `@scenario`, so none is left undeclared; rebuild and `orbit update --force`

## 3. The improvement-claims check

- [x] 3.1 Implement the check in `test/helpers/user-docs.ts` over the residue check's section reader (design D2): top-level list items under `How orbit improves on OpenSpec`, names by the requirement's `<name>` production over whole `code_inline` contents with nested items counted toward their top-level item, resolution against `orbit/specs/<name>/spec.md`, fences never read
- [x] 3.2 Add it to the file-local set `fileLocalFailures` runs, as a `README.md`-only check
- [x] 3.3 A test per scenario of the ADDED requirement, each tagged `@scenario`, and each case shown able to fail by a mutation of the check
  - Recorded 2026-10-12 (`test/core/user-docs/claims.test.ts`, 11 tests, 8 tagged): eleven mutations of `claimsFailures`, each run against the suite and reverted. Unanchored name production → the whole-name test fails; resolution skipped → the not-a-capability and nested-name tests; nested inline blocks skipped → the nested-name test; nested items judged as items of their own → the no-name, nested-rides-parent, nested-name and non-list tests; the empty-comparison failure dropped → the empty test; the no-name failure dropped → the no-name, whole-name and listed-README tests; every name unresolved → nine tests; the check removed from `fileLocalFailures` → the listed-README test; line breaks not counted → the not-a-capability test (its name sits on a continuation line); the section left unbounded below → the section-end test. Every tagged scenario's test failed under at least one mutation.

## 4. The README

- [x] 4.1 Rewrite `README.md` in design D1's outline: the two admitted ATX sections (`@fission-ai/openspec@1.3.1` named in full), the claims of D-lp-6 each naming capabilities, the pinned `v2.0.0` install with Node and Git as prerequisites, the Claude Code quickstart with its one Codex line, Docs (ten pages; `docs/opsx.md` unlinked), Development, Contributing, License (MIT, pointing at `LICENSE`); no upstream logo, badge, Discord or `/opsx:` command
- [x] 4.2 Remove `README.md` from `test/core/user-docs/pending-rewrite.json`; declare the README's heads in the delta's `docs-inventory` fence (design D7), exact both ways
- [x] 4.3 Record how the shared extractor reads the `#` in the install argument (design Risks)
  - Recorded 2026-10-12, by a throwaway probe over the shared extractor's `tokenize` (deleted after the run): `npm install -g github:las-sal/orbit-spec#v2.0.0` tokenizes to one segment `[npm, install, -g, github:las-sal/orbit-spec#v2.0.0]` — the `#` inside a word is part of the word, as in POSIX shell; `npm install -g x # comment` tokenizes to `[npm, install, -g, x]`, so a `#` that begins a word still opens a comment. `analyseHeads` over the README reads ten heads: `npm` (fence, lines 51, 106–108), `cd` (fence, 62), `orbit` (fence 52, 63, 79; inline 55, 82).
- [x] 4.4 `npm test` green on the full suite; `orbit validate landing-page --strict` passes; `orbit status --change landing-page --scenarios` shows every delta scenario declared

## 5. Clean-machine run and release

- [x] 5.1 Commit and push the apply
- [ ] 5.2 (User-validation) Rehearse exit (3) before the flip, per design D5: from a scratch `git+file://` clone carrying a local `v2.0.0`, run the README's install and every quickstart shell step plus one `/orbit:propose` in Claude Code on a machine or account with no orbit installed; record the commands and their output under this task
- [ ] 5.3 (User-validation) After Sal merges the PR, in the orbit session Sal opens after the merge, on Sal's word: cut the annotated `v2.0.0` on `main`'s merge commit, push it by name (never `--tags`), and observe it with `git ls-remote --tags origin` (design D4)
- [ ] 5.4 (User-validation) After the repository is public: re-run the README's install and quickstart against `github:las-sal/orbit-spec#v2.0.0` on a clean machine and record it (exit (3)'s second half)
