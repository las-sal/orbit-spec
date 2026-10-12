## 1. Version and tags

- [ ] 1.1 Bump `package.json` and `package-lock.json` to `2.0.0` with `npm version 2.0.0 --no-git-tag-version` (design D3); `orbit --version` from a fresh build prints `2.0.0`
- [ ] 1.2 Clean the tag namespace (design D4): delete exactly the local tags that `git ls-remote --tags upstream` also lists, except `upstream/v1.3.1`, keeping any local-only tag; run `git config remote.upstream.tagOpt --no-tags`, and show that `git fetch upstream` then brings no tag; record the exact deletion set under this task

## 2. Onboard

- [ ] 2.1 Rewrite the Orientation version bullet in `src/core/templates/workflows/onboard.ts` (design D6): `orbit --version` prints orbit's own version, and the engine is pinned at the upstream baseline 1.3.1, stated apart
- [ ] 2.2 Re-record both onboard hashes in `test/core/templates/skill-templates-parity.test.ts` as one recorded act; write a text test over the onboard template asserting each of the three Orientation scenarios and tag it `@scenario`, so none is left undeclared; rebuild and `orbit update --force`

## 3. The improvement-claims check

- [ ] 3.1 Implement the check in `test/helpers/user-docs.ts` over the residue check's section reader (design D2): top-level list items under `How orbit improves on OpenSpec`, names by the requirement's `<name>` production over whole `code_inline` contents with nested items counted toward their top-level item, resolution against `orbit/specs/<name>/spec.md`, fences never read
- [ ] 3.2 Add it to the file-local set `fileLocalFailures` runs, as a `README.md`-only check
- [ ] 3.3 A test per scenario of the ADDED requirement, each tagged `@scenario`, and each case shown able to fail by a mutation of the check

## 4. The README

- [ ] 4.1 Rewrite `README.md` in design D1's outline: the two admitted ATX sections (`@fission-ai/openspec@1.3.1` named in full), the claims of D-lp-6 each naming capabilities, the pinned `v2.0.0` install with Node and Git as prerequisites, the Claude Code quickstart with its one Codex line, Docs (ten pages; `docs/opsx.md` unlinked), Development, Contributing, License (MIT, pointing at `LICENSE`); no upstream logo, badge, Discord or `/opsx:` command
- [ ] 4.2 Remove `README.md` from `test/core/user-docs/pending-rewrite.json`; declare the README's heads in the delta's `docs-inventory` fence (design D7), exact both ways
- [ ] 4.3 Record how the shared extractor reads the `#` in the install argument (design Risks)
- [ ] 4.4 `npm test` green on the full suite; `orbit validate landing-page --strict` passes; `orbit status --change landing-page --scenarios` shows every delta scenario declared

## 5. Clean-machine run and release

- [ ] 5.1 Commit and push the apply
- [ ] 5.2 (User-validation) Rehearse exit (3) before the flip, per design D5: from a scratch `git+file://` clone carrying a local `v2.0.0`, run the README's install and every quickstart shell step plus one `/orbit:propose` in Claude Code on a machine or account with no orbit installed; record the commands and their output under this task
- [ ] 5.3 (User-validation) After Sal merges the PR, in the orbit session he opens then and on his word: cut the annotated `v2.0.0` on `main`'s merge commit, push it by name (never `--tags`), and observe it with `git ls-remote --tags origin` (design D4)
- [ ] 5.4 (User-validation) After the repository is public: re-run the README's install and quickstart against `github:las-sal/orbit-spec#v2.0.0` on a clean machine and record it (exit (3)'s second half)
