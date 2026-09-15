# Tasks: rc07-artifact-lint

## 1. The engine source table

- [ ] 1.1 Add `countRulingEntries(doc, prefix)` to `src/core/architecture/parser.ts` — top-level list items inside the `## Rulings index` section whose first bold span matches `<prefix>-<n>`, with the prefix DECLARED by the caller, never derived from the doc name; fence-aware; a section yielding zero entries is a MALFORMED source that throws naming doc + prefix, never a count of zero. Unit-test against the live `clean-up-review-cycle.md` (prefix `R-crc` → 10), a wrong prefix (malformed), and a doc with no rulings section.
- [ ] 1.2 Create `src/core/sources-registry.ts` with the CLOSED engine-source table (design D3): `architecture.stage-count` (`doc`), `architecture.ruling-count` (`doc`, `prefix`), `specs.capability-count` (none), `schema.version` (`schema`). Each entry declares its required parameter names and returns a STRING. `stage-count` reads `parseArchitectureDoc(...).stages.length` (well-formed only) and ERRORS on a MALFORMED or LEGACY doc rather than emitting a short count.
- [ ] 1.3 Add the registry reader to the same module: parse `orbit/sources.yaml` and fail loudly, naming the file or entry, on EVERY fault the spec's malformed-registry scenario lists — unparseable YAML, a `sources:` value that is not a map, an entry that is a scalar rather than a map, a duplicate source name, a missing `engine:`, an unknown `engine:` value (the error lists the names the engine does expose), a missing required parameter, and any unknown key. Absent file → empty registry, no error; an existing file SHALL NOT be able to reach that silence.

## 2. The lint

- [ ] 2.1 Create `src/core/source-lint.ts` — file domain from `git ls-files '*.md'` minus the declared exclusions (design/spec table); a non-git checkout degrades to an empty domain with a named reason, never an exception.
- [ ] 2.2 Add the span parser: opener `<!-- src:NAME -->` with `NAME` = `[a-z0-9][a-z0-9-]*`, closer `<!-- /src -->`, non-matching comments inert, and the spec's five-row pairing table implemented exactly (opener/closer, second opener, orphan closer, opener-at-EOF, empty span). Inertness covers fences AND INLINE CODE SPANS — extend `src/core/markdown-fence.ts` with inline-backtick-span tracking (it is line-based and fence-only today); this is real work, not a flag. Report the table's two outcome KINDS distinctly (a MARKER ERROR names the delimiter; an empty span is a CHECK FAILURE carrying the source value), and bound a marker error's blast radius to ONE FILE — abandon that file's remaining spans, keep linting every other file.
- [ ] 2.3 Add the check: `span.includes(sourceValue)` — never a numeric parse. A disagreeing span is an ERROR naming file, line, source name, the span's text and the source's value. An unknown source name in a well-formed marker is an ERROR.
- [ ] 2.4 Add the coverage record: each declared source, its current value, and its marked-span count. It never fails anything.

## 3. Surface

- [ ] 3.1 Add `--sources` to the `orbit validate` bulk family in `src/cli/index.ts` and `src/commands/validate.ts`; `--all` runs it too. Per-item `orbit validate <change>` is unchanged.
- [ ] 3.2 Render human output (findings, then the coverage section) and `--json` (findings array + coverage array). Non-zero exit on any finding.
- [ ] 3.3 Verify the no-registry path end to end: with no `orbit/sources.yaml`, `orbit validate --all` output is byte-identical to before this change.

## 4. Dogfood

- [ ] 4.1 Write `orbit/sources.yaml` with the four v1 sources, entries nested under the top-level `sources:` key exactly as design D2 shows; the `rulings` entry carries `prefix: R-crc`.
- [ ] 4.2 Give `CLAUDE.md` a present tense and mark it (design D6b): add ONE current-state line carrying the live stage count, rulings endpoint, baseline capability count and schema version, and mark each figure. Mark the stage count and the rulings ENDPOINT — not the range — in `orbit/architecture/clean-up-review-cycle.md` too, spans drawn tight around the figure alone. Convert word-form figures to numerals inside marked spans only. Mark NO figure inside an archived-stage narrative: those are records that happen to live in a living file.
- [ ] 4.3 Run `orbit validate --sources` against the live tree; confirm it passes, and confirm each mark FAILS when its source is perturbed.

## 5. Instruments and close-out

- [ ] 5.1 `test/core/sources-registry.test.ts` — the four sources' values, each error path, absent-file silence.
- [ ] 5.2 `test/core/source-lint.test.ts` — the four real defects from `explore.md` Case 2 as fixtures (all four must FAIL), the compound-string case, every inertness case (fenced, placeholder name, AND inline code span — using this change's own four in-backtick markers verbatim: three openers, one orphan closer, all must go silent), all five pairing-table rows, an excluded record ignored, an untracked file skipped, the non-git empty domain, and the coverage count.
- [ ] 5.3 Add the `--sources` row to `docs/cli.md`'s `validate` flags table (branding in that file is stale by a declared deferral; do not widen into a doc pass).
- [ ] 5.4 RECOMMEND — do not perform — the architect amendments this change earned, naming them in the completion readout: the rc07 stage declaration's `Touches:` line, its "and audit-drift" clause, and exit criterion (3)'s "live commands" (all three recorded in design.md's charter-divergence table), plus the charter's own stale `61 today` file-domain figure and its `stages = 17` coverage example. Stage declarations and charters belong to `/orbit:architect`; apply never edits them.
- [ ] 5.5 `npm run build && npm test` green; `orbit validate --all --strict` clean.
