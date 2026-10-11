## 1. Shared resolver

- [ ] 1.1 Move `findArchivedDir` (and its `escapeRegExp`) from `src/core/emit-composition.ts` into a new `src/core/archived-change.ts`, exported; `emit-composition.ts` imports it. Its behaviour is unchanged except that only DIRECTORIES match — a regular file of a matching name is skipped before the lexical selection — a correction the emit surface inherits (design D1).
- [ ] 1.2 Unit tests for the resolver: no archive root → null; no match → null; two dated matches → the lexically greatest; a name containing regex metacharacters matches literally; a sibling whose name only ends with `-<name>` after another hyphenated word does not match unless the date prefix is exact; a regular file `2026-02-01-<name>` beside a directory `2026-01-01-<name>` resolves to the directory; only a regular file → null.

## 2. Report resolution and the archived tail

- [ ] 2.1 `src/commands/workflow/status.ts`: the `--report` branch validates the name, resolves `orbit/changes/<name>/` first, then the archived directory through the shared resolver, refuses an archived directory whose real path lies outside `orbit/changes/archive/`, and on a miss throws `Change '<name>' not found — checked orbit/changes/<name> and orbit/changes/archive/*-<name>`, followed by `. Available changes:` and the names when any active change exists and by nothing more when none does (design D1, D3, D5). Every other status form keeps `validateChangeExists`.
- [ ] 2.2 `src/core/report-render.ts`: `renderReport` gains an optional fourth argument `{ changeDir, archived }`, defaulting to the active directory with `archived: false`; `buildReportContext` composes the tail as `Archived: <repo-relative archived dir>` — the relative path joined with `/` on every platform — with no gate, position or eligibility line when `archived`, and the live tail otherwise (design D2, D4). `src/commands/emit.ts` and the existing test call sites stay on the three-argument form.
- [ ] 2.3 `renderReviewReport` prints the archived line after the `---` rule; an active change's render is byte-identical (every existing golden unchanged).

## 3. Tests

- [ ] 3.1 Report tests in `test/core/report-render.test.ts`, each with its `@scenario` tag: an archived change renders its newest pass and an explicit `<TS>` from the archived trail; two dated archive directories resolve to the greater; an active change of the same name wins with its live tail; a miss names both locations and writes nothing; an archived render creates and modifies no file; a regular file beside an archived directory of the same name never resolves; an archived directory symlinked outside the archive root is refused; an archived pre-D4 emit fails with the `pre-capability emit` error, as it does on an active change; `orbit emit review --render` renders unchanged.
- [ ] 3.2 A golden in `test/fixtures/report-golden/` pinning the archived tail (the `---` rule and the `Archived:` line alone), transcribed from the spec's form.
- [ ] 3.3 Tag the existing tests that exercise the eighteen carried scenarios (`Report grammar`, `Render-time computed context`, `The render surface is the status gateway`, `Strict input validation`) with `@scenario` declarations, or add a test where none exercises one; `orbit status --change report-archived-change --scenarios` reports zero undeclared.
- [ ] 3.4 `npm run build` and the full `npm test` green; `orbit validate report-archived-change --strict` passes.

## 4. Observed on the real repository

- [ ] 4.1 (User-validation) `orbit status --change rc10-apply-closure --report` renders rc10's newest review pass with the `Archived:` tail, run on the built CLI against this repository's real archive.
- [ ] 4.2 At archive: mark Q-crc-26 RESOLVED in `orbit/architecture/clean-up-review-cycle.md`'s Open questions, naming this change.
