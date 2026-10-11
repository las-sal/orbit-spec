## 1. Shared resolver

- [ ] 1.1 Move `findArchivedDir` (and its `escapeRegExp`) from `src/core/emit-composition.ts` into a new `src/core/archived-change.ts`, exported; `emit-composition.ts` imports it, its behaviour byte-unchanged (design D1).
- [ ] 1.2 Unit tests for the resolver: no archive root → null; no match → null; two dated matches → the lexically greatest; a name containing regex metacharacters matches literally; a sibling whose name only ends with `-<name>` after another hyphenated word does not match unless the date prefix is exact.

## 2. Report resolution and the archived tail

- [ ] 2.1 `src/commands/workflow/status.ts`: the `--report` branch validates the name, resolves `orbit/changes/<name>/` first, then the archived directory through the shared resolver, and on a miss throws `Change '<name>' not found — checked orbit/changes/<name> and orbit/changes/archive/*-<name>` followed by the available active changes (design D3, D5). Every other status form keeps `validateChangeExists`.
- [ ] 2.2 `src/core/report-render.ts`: `renderReport` takes the resolved `{ changeDir, archived }`; `buildReportContext` composes the tail as `Archived: <repo-relative archived dir>` with no gate, position or eligibility line when `archived`, and the live tail otherwise (design D2, D4). Callers in tests and `canonical-examples.test.ts` updated.
- [ ] 2.3 `renderReviewReport` prints the archived line after the `---` rule; an active change's render is byte-identical (every existing golden unchanged).

## 3. Tests

- [ ] 3.1 Report tests in `test/core/report-render.test.ts`, each with its `@scenario` tag: an archived change renders its newest pass and an explicit `<TS>` from the archived trail; two dated archive directories resolve to the greater; an active change of the same name wins with its live tail; a miss names both locations and writes nothing; an archived render creates and modifies no file.
- [ ] 3.2 A golden in `test/fixtures/report-golden/` pinning the archived tail (the `---` rule and the `Archived:` line alone), transcribed from the spec's form.
- [ ] 3.3 Tag the existing tests that exercise the nine carried scenarios (`Report grammar`, `Render-time computed context`, `The render surface is the status gateway`) with `@scenario` declarations, or add a test where none exercises one; `orbit status --change report-archived-change --scenarios` reports zero undeclared.
- [ ] 3.4 `npm run build` and the full `npm test` green; `orbit validate report-archived-change --strict` passes.

## 4. Observed on the real repository

- [ ] 4.1 (User-validation) `orbit status --change rc10-apply-closure --report` renders rc10's newest review pass with the `Archived:` tail, run on the built CLI against this repository's real archive.
