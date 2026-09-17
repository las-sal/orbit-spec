# External Review: rc07-artifact-lint (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-17

## CRITICAL

### The modified opacity contract is false of the existing parser API
**File**: orbit/changes/rc07-artifact-lint/specs/orbit-architecture-engine/spec.md:12
**Description**: The delta says the architecture parser's model contains only stage structure, that opaque prose contributes no field, and that nothing downstream of `parseArchitectureDoc` may read it except the newly named source lint. In the shipped API, `ParsedArchitectureDoc.lines` contains the entire document, including rulings and charter prose, and `sliceStageSection` reads those lines downstream to implement `orbit architecture show`. The source lint itself also obtains rulings through that parser-returned field. The proposed baseline would therefore be false immediately after archive, and the source lint is not the sole engine-level reader it claims to be. Separate raw document bytes from the parsed model, or rewrite the requirement around semantic interpretation/passthrough and name every permitted reader (including `sliceStageSection`/`show`); then add a scenario that exercises the actual public parser shape and existing show path.

### The ruling source counts entries inside valid fenced code
**File**: src/core/sources-registry.ts:96
**Description**: `countRulingEntries` uses the heuristic `computeFenceMask`, while marker scanning uses the strict shared `createFenceTracker`. The heuristic treats any bare fence as closing the current depth without checking delimiter character or opening length. In a parseable document with an outer four-backtick fence, a three-backtick body line, two ruling-shaped bullets, the four-backtick closer, and one live ruling, the shipped function returns `2`: it admits both fenced bullets and masks the live one, even though the shared tracker correctly says a three-backtick line cannot close a four-backtick fence. This makes an engine-computed source value false and can let a marked false count pass validation. Make the architecture parser and ruling reader derive line masks from the shared CommonMark tracker (or another single grammar), and add mismatched-length, mismatched-character, and info-string fence regressions for both architecture sources.

## WARNING

### Marker recognition accepts comments outside the specified exact grammar
**File**: src/core/source-lint.ts:65
**Description**: The spec defines the literal opener `<!-- src:NAME -->` and closer `<!-- /src -->`, and says a comment that does not match exactly is inert. Both regexes use `\s*`, which accepts missing spaces, tabs, and even line breaks. The shipped parser therefore turns `<!--src:stages-->18<!--/src-->` and multi-line comment forms into live spans instead of ignoring them. This can create false failures from prose the contract declares inert. Match the literal delimiter whitespace exactly (while applying the NAME regex only to NAME) and add negative tests for compact, tabbed, and cross-line forms.

### Escaped backticks incorrectly hide live markers
**File**: src/core/markdown-fence.ts:128
**Description**: The code-region scan treats every maximal backtick run as a possible delimiter and never checks whether it was backslash-escaped. Under [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/#backslash-escapes), an escaped backtick is literal and does not open a code span. A marker placed between two escaped single backticks is nevertheless masked by `computeCodeRegionMask`, so a stale marked claim can be skipped entirely. Account for backslash escaping before candidate opening and closing runs, including odd/even backslash counts, and add a regression that proves the intervening marker remains live.

### An empty registry file disables the lint without any output
**File**: src/core/sources-registry.ts:303
**Description**: `sources: {}` is accepted and returned as an empty declaration list. On a human `orbit validate --sources` run, `registryPresent` is true but there are no findings or coverage rows, so `printSourceLint` emits nothing and exits zero. This is the exact existing-file silence task 1.3 says must be unreachable, and a truncation to an empty map can disable all checks without a named reason. Reject an empty `sources:` map as a registry fault, or explicitly specify and render an intentional empty-registry state; cover both JSON and human output.

### Schema parameters can traverse outside the schema namespace
**File**: src/core/sources-registry.ts:187
**Description**: `schema.version` validates only that `schema` is a non-empty string, then passes it through `path.join`. A value such as `../../schemas/spec-driven` escapes `orbit/schemas/` and resolves successfully in this repository; further traversal can probe any reachable directory containing `schema.yaml`. That violates the closed engine-input boundary and makes a read-only validation command consume files outside the declared project-local/package schema tiers. Validate schema identifiers with the product's kebab-case schema-name rule and enforce resolved-path containment (including symlinks) for both tiers.

### Tracked markdown read failures are silently reported as scanned
**File**: src/core/source-lint.ts:275
**Description**: Any `readFileSync` failure is swallowed, including permission errors and I/O faults, yet `filesScanned` is returned as `files.length`. The run can therefore exit clean while claiming a tracked living document was scanned when it was never read. Distinguish a deliberately absent working-tree file from other read failures, surface unreadable tracked files as a named lint/domain failure, and compute `filesScanned` from successful reads.

### Unmatched backtick runs cause repeated whole-suffix scans
**File**: src/core/markdown-fence.ts:138
**Description**: For every candidate backtick run without an equal-length closer, `maskCodeSpans` scans the entire remaining group again. A markdown file containing many differently sized unmatched runs drives superlinear work before marker scanning, and `--all` applies it across the whole tracked markdown domain. Pre-index the next run by length or otherwise make pairing linear in document size, and add a bounded adversarial performance test.

### Prototype properties bypass the closed engine-source membership check
**File**: src/core/sources-registry.ts:331
**Description**: Membership is tested with `engine in ENGINE_SOURCES`, so inherited names such as `toString` and `constructor` are admitted as though they were exposed engine sources. The code then throws a generic `TypeError` while accessing `.params` or `.resolve`, instead of the required clean unknown-source error listing the four allowed names. Use `Object.hasOwn(ENGINE_SOURCES, engine)` (or a null-prototype map) and test inherited property names.

### The four motivating fixtures do not exercise the lint implementation
**File**: test/core/source-lint.test.ts:31
**Description**: The tests labeled as the four real defects assert only JavaScript's built-in `d.span.includes(d.sourceValue)`. They never call `parseMarkedSpans`, `runSourceLint`, or inspect a finding, so the actual implementation could stop checking containment and all four mandated fixtures would still pass. Drive each case through the production parser/check with a declared source and assert the discriminated mismatch record; retain a separate small unit test only if direct containment documentation is useful.

## SUGGESTION

### Use NUL-delimited git output for the project file domain
**File**: src/core/source-lint.ts:106
**Description**: `git ls-files` output is split on newlines and every path is trimmed. Legal tracked paths containing newlines or leading/trailing spaces are therefore corrupted and then silently skipped by the read-error path. Invoke `git ls-files -z -- '*.md'`, split on NUL, and preserve path bytes instead of trimming them.

### The live ruling-count test derives its oracle from the same raw-text assumptions
**File**: test/core/sources-registry.test.ts:21
**Description**: Task 1.1 called for the live `R-crc` count to assert `10`, but the test computes `byHand` with another raw regex and checks only that the production result equals it. Shared mistakes in section/fence/bold interpretation can therefore pass both sides, and the test does not establish the promised live value. Pin the current contract value in this change's fixture or build the oracle through an independent Markdown parse, while keeping separate evolution tests for later ruling additions.

## Notes

I exercised the capability from the adopter, CI, and hand-author perspectives using the baseline specs in place of the absent lens files. The complete suite passed (97 files, 2,179 tests), the change validates strictly, and the live dogfood reports one agreeing marker for each of its four sources. I found no in-repository consumer of the changed bulk JSON fields; the documented `totals.items`/`items.length` break remains an external-consumer migration risk rather than a hidden local regression. Task 5.4's checkbox-free at-archive note matches the repository's established convention and is not a quiet descope: its action is necessarily post-sync. The two prose edits in `CLAUDE.md` preserve their historical/current-state meanings.
