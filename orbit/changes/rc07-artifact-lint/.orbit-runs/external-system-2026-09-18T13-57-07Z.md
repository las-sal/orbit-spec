# External Review: rc07-artifact-lint (iteration 2)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-18

## CRITICAL

### Backslash escape handling is incorrectly applied inside an open code span
**File**: src/core/markdown-fence.ts:151
**Description**: Candidate runs are filtered for odd preceding backslashes before pairing, without regard to whether the run is already inside a code span. CommonMark explicitly says [backslash escapes do not work inside code spans](https://spec.commonmark.org/0.31.2/#example-338). In the document `` `code\` <!-- src:stages -->99<!-- /src --> tail` ``, the second backtick closes the span despite the backslash, so the marker is live and stale; the shipped scanner drops that closer, pairs the first backtick with the final one, and returns no span or finding. Delimiter recognition must be context-sensitive: apply backslash escaping only while looking for an opener in ordinary inline text, never while looking for the equal-length closer of an already-open span. Add this exact false-negative as a regression, plus odd/even backslashes on both sides of a real span.

### Inline-code pairing still crosses nonblank Markdown block boundaries
**File**: src/core/markdown-fence.ts:99
**Description**: The repair treats only blank and fenced lines as barriers, but CommonMark gives block structure precedence and parses inline elements independently inside each block; [inline parsing in one block cannot affect another](https://spec.commonmark.org/0.31.2/#precedence). For `paragraph \`` followed immediately by `# heading <!-- src:stages -->99<!-- /src -->` and then `trailing \``, CommonMark has three blocks and no code span crossing them, while `computeCodeRegionMask` groups all three nonblank lines, pairs the two backticks, and silently masks the stale heading marker. Blank-line splitting fixed one symptom rather than the block-boundary invariant stated in the design. Derive inline ranges from actual CommonMark block structure (or a complete equivalent scanner), and cover ATX/setext headings, lists, block quotes, thematic breaks, indented code and HTML blocks without intervening blank lines.

## WARNING

### Symlink containment is bypassed by a symlinked tier root and by architecture-doc symlinks
**File**: src/core/sources-registry.ts:225
**Description**: `findSchemaFile` calls `realpathSync(dir)` before constructing and checking the candidate. If the declared project tier `orbit/schemas` is itself a symlink to an outside directory, that outside directory becomes `tierRoot`, the containment comparison is tautologically satisfied, and an outside schema is read; a probe emitted version `777` from such a target. The same normative rule also covers `doc`, but `loadArchitectureDoc` (`src/core/architecture/parser.ts:188`) performs only lexical filename/dirname checks and accepts `orbit/architecture/prog.md` as a symlink to an outside parseable document. This contradicts the delta's requirement that both document and schema inputs remain within their declared tiers with symlinks resolved. Preserve the lexical declared roots, reject symlinked tier roots (or prove them repository-contained), realpath each candidate, and apply one shared containment rule to both source kinds; add root-directory and final-file symlink regressions.

### `existsSync` silently drops a tracked dangling symlink from the lint domain
**File**: src/core/source-lint.ts:309
**Description**: The pre-read `existsSync` check follows symlinks and returns false for a tracked `dangling.md` whose target is missing. A reproduction listed both that path and one readable Markdown file, then returned no finding, `filesScanned: 1`, and a passing source summary. The working-tree directory entry exists, so this is not the deliberately silent tracked-but-deleted case; it is a read failure swallowed before the `try` block. A readable tracked Markdown symlink is conversely followed outside the repository, so the lint reads target bytes rather than the tracked Git object's link text. Use `lstat`/explicit error-code handling to distinguish a genuinely absent directory entry from other failures, define a deterministic symlink policy (preferably reject symlinked domain files as `domain` findings), and test dangling and outside-target symlinks.

### A partial domain failure still reports every declared source as passed
**File**: src/commands/validate.ts:385
**Description**: `unverified` is assigned only when Git cannot resolve the entire domain. If one tracked file raises a `domain` finding, `domainReason` remains null, so `summarizeSources` adds one failed pseudo-item but counts every resolved source as passed; with one source the shape is `{items: 2, passed: 1, failed: 1}` even though the unread file may contain that source's only marker. This repeats the empty-domain repair pattern at partial scope: the failure is visible, but the claim underneath remains unjustified. Carry domain completeness separately from the whole-domain reason and mark resolved sources unverified whenever any domain member was not read, while retaining the domain pseudo-failure and nonzero exit; specify and test that partial-domain summary shape in both output modes.

### The live-repository inertness test forbids legitimate future marker adoption
**File**: test/core/source-lint.test.ts:195
**Description**: The rewritten test scans the entire live Git domain and asserts that `CLAUDE.md` is exactly the only file containing live spans. The capability is explicitly project-wide, so adding a valid marked claim to any other living document will make the suite fail even when the lint correctly parses and validates it; unrelated repository evolution also changes a unit test's fixture implicitly. Keep the useful assertion that syntax examples inside code regions are inert, but derive and assert those occurrences independently of live spans. Test the current dogfood in a focused integration assertion without making its present file set an exclusive product invariant.

## SUGGESTION

### The five-kind reporting taxonomy is still described as four and incompletely documented
**File**: orbit/changes/rc07-artifact-lint/design.md:244
**Description**: The design and `SourceFinding` comment still say there are “four failures” immediately before/above a five-member union, while `docs/cli.md` says unattributable findings are registry, marker and unknown-source faults even though `summarizeSources` also treats `domain` as unattributable. This residue makes the newly added kind's summary semantics easy for a CI consumer to miss. Update the count and the pseudo-item list everywhere, and state explicitly how `domain` interacts with `passed`/`unverified` after the partial-domain behavior is settled.

### The parser module header still states the opacity contract that the delta just repaired
**File**: src/core/architecture/parser.ts:5
**Description**: The module header says “The engine reads ONLY” stage structure and that all other content is engine-opaque, while the repaired delta now carefully distinguishes what this parser interprets from passthrough lines consumed by `sliceStageSection` and the source lint's ruling reader. The shipped comment therefore preserves the false engine-wide wording that prompted the iteration-1 finding. Rewrite it in the delta's parser-scoped interpretation/passthrough vocabulary so future maintainers do not reintroduce the contradiction.

## Notes

I used the archived capability baselines for the perspective and critical-path passes because the repository has no lens files. I verified that the architecture delta preserves all six original scenarios byte-for-byte and that the two-row passthrough-reader table covers the production consumers of `ParsedArchitectureDoc.lines`. The existing build, test suite, strict validation and live four-source dogfood all complete successfully; the critical cases above were separate executable adversarial probes. The no-registry object construction remains shape-identical by inspection, while the new conditional `unverified` fields are absent on a working domain as documented.
