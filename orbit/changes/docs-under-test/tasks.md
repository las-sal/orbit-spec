## 1. The docs surface and its list

- [ ] 1.1 Add `test/core/user-docs/pending-rewrite.json` listing all twelve user docs (`README.md` and the eleven `docs/*.md`), and in `test/helpers/surface-snippets.ts` add `docSurfaces()` (unlisted user docs as `Surface` records, `workflowId: 'docs'`, `file` the repo-relative path) and an all-docs helper (design D1, D2)
- [ ] 1.2 Add the list's exactness test in `test/core/user-docs/`: a listed file that passes every check fails naming it, a stale path fails naming it, and today's twelve all fail at least one check (the `orbit-user-docs` gating table)

## 2. The residue check

- [ ] 2.1 Add the residue check over unlisted user docs: case-insensitive `openspec`, `opsx` and `fission`, admitted only in the README's `Built on OpenSpec` and `How orbit improves on OpenSpec` sections (sections read through `src/core/markdown-fence.ts`), anywhere in `docs/migration-guide.md`, and inside `.openspec.yaml` and `~/.config/openspec` (design D3)
- [ ] 2.2 Show it able to fail: injected cases for an upstream command, a `/opsx:` command, an occurrence under the heading after an admitted section, and the two admitted identifiers passing

## 3. The sweeps over the docs

- [ ] 3.1 Extend the `orbit` snippet sweep and the `git`/`gh` recorded-contract sweep to `docSurfaces()`, each with an inactive floor asserted only when the pending list is empty (design D5)
- [ ] 3.2 Extend the tool inventory to `docSurfaces()`, judged against the `docs-inventory` fence read from `orbit-user-docs`' requirement through `test/helpers/owner-text.ts`, each fence exact for its own surface (design D4)
- [ ] 3.3 Show each extended check able to fail on an injected unlisted doc: an unknown `orbit` flag, an unrecorded `git` flag, a head only the generated fence declares, a continuation line, and an unused `docs-inventory` declaration (design D7)

## 4. Instruments

- [ ] 4.1 Tag every delta scenario (the carried `orbit-cli-grammar` ones included) against the tests that exercise them
- [ ] 4.2 Full `npm test` green; state the count
