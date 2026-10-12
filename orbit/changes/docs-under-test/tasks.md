## 1. The docs surface and its list

- [x] 1.1 Add `test/core/user-docs/pending-rewrite.json` listing all twelve user docs (`README.md` and the eleven `docs/*.md`), and in `test/helpers/surface-snippets.ts` add `docSurfaces()` (unlisted user docs as `Surface` records, `workflowId: 'docs'`, `file` the repo-relative path) taking the pending list as a parameter, and an all-docs helper; make `describeSurface` return `file` alone for a docs surface (design D1, D2)
- [x] 1.2 Add the list's exactness test in `test/core/user-docs/`: a listed file that passes every FILE-LOCAL check (residue, the `orbit` and `git`/`gh` sweeps, the inventory's unknown heads) fails naming it, a stale path fails naming it, and today's twelve all fail at least one check (the `orbit-user-docs` gating table)

## 2. The residue check

- [x] 2.1 Add the residue check over unlisted user docs: case-insensitive `openspec`, `opsx` and `fission`, admitted only in the README's `Built on OpenSpec` and `How orbit improves on OpenSpec` sections (sections read through `src/core/markdown-fence.ts`), anywhere in `docs/migration-guide.md`, and inside `.openspec.yaml` and the global configuration and data directories in every form the requirement lists; a section ends at the next ATX heading of its level or above (design D3)
- [x] 2.2 Show it able to fail: injected cases for an upstream command, a `/opsx:` command, an occurrence under the heading after an admitted section, `openspec init` inside an admitted section passing, and the admitted identifiers passing

## 3. The sweeps over the docs

- [x] 3.1 Extend the `orbit` snippet sweep and the `git`/`gh` recorded-contract sweep to `docSurfaces()`, each with a floor that is `null` while any file is listed, asserted only when the pending list is empty, and failing there when unset; the guard takes the list and the floors as parameters (design D5)
- [x] 3.2 Extend the tool inventory to `docSurfaces()`, judged against the `docs-inventory` fence read from `orbit-user-docs`' requirement through `inventorySource`, extracted from `tool-inventory.test.ts` into a shared helper taking the capability, title and info string; an empty fence is legal and the malformed-block rules apply; each fence exact for its own surface (design D4)
- [x] 3.3 Show each extended check able to fail on an injected case: an unknown `orbit` flag, an unrecorded `git` flag, a head only the generated fence declares, a continuation line, an unused `docs-inventory` declaration, an empty docs fence passing, a clean listed page beside a declared head it does not use, an empty list with a floor unset and with a count below its floor, each docs failure asserting the exact surface name (design D7)
- [x] 3.4 Widen `scripts/capture-git-contract.capture.ts`'s candidate set to the generated surface plus every user doc, listed or not; run `npm run capture:git` and confirm the contract is unchanged (design D8)

## 4. Instruments

- [x] 4.1 Tag every delta scenario (the carried `orbit-cli-grammar` ones included) against the tests that exercise them
- [x] 4.2 Full `npm test` green; state the count
