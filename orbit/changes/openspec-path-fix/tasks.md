## 1. The scan reads schemas in any case (design D1)

- [ ] 1.1 In `test/helpers/cli-name.ts`, make `occurrences` match `/openspec/gi` in a file whose path begins `schemas/` and `PATTERN` in every other file; the failure line keeps its form, the occurrence as written.
- [ ] 1.2 In `test/core/cli-name.test.ts`, add the test for `A lowercase openspec in a shipped schema file is residue`, declared `@scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: A lowercase openspec in a shipped schema file is residue`: a `schemas/spec-driven/schema.yaml` fixture carrying `openspec/specs/` fails naming the file, the line and `openspec`, and a `src/` string literal carrying the same path passes.
- [ ] 1.3 Before fixing the paths, run `npx vitest run test/core/cli-name.test.ts` and confirm the shipped-files test fails with exactly the four residues: `schema.yaml` lines 17, 39, 55 and `templates/proposal.md` line 18.

## 2. The paths (design D2, D3)

- [ ] 2.1 In `schemas/spec-driven/schema.yaml`, change `openspec/specs/` to `orbit/specs/` on lines 17, 39 and 55, changing nothing else in those lines.
- [ ] 2.2 In `schemas/spec-driven/templates/proposal.md`, change `openspec/specs/` to `orbit/specs/` on line 18.
- [ ] 2.3 In `src/core/artifact-graph/resolver.ts`, change `<projectRoot>/openspec/schemas/<name>/schema.yaml` to `<projectRoot>/orbit/schemas/<name>/schema.yaml` in the comments at lines 52 and 97; leave the `XDG_DATA_HOME/openspec/` lines.

## 3. The pins and the suite (design D4)

- [ ] 3.1 In `test/core/rc03b-untouched-modules.test.ts`, move the pins of `schemas/spec-driven/schema.yaml`, `schemas/spec-driven/templates/proposal.md` and `src/core/artifact-graph/resolver.ts` to their new hashes, and add a `MOVED at openspec-path-fix apply (<date>)` entry to the header comment naming the three and the reason.
- [ ] 3.2 Run `npm run build`, then `node bin/orbit.js instructions specs --change openspec-path-fix --json` and confirm the served instruction names `orbit/specs/` and no `openspec/`.
- [ ] 3.3 Run `npm test` and confirm it passes in full, the `Test Files` line counting every file.
