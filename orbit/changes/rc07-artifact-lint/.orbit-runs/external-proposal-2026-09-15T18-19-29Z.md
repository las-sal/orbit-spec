# External Review: rc07-artifact-lint (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-15

## CRITICAL

### The ruling-count source is dogfooded as a different fact and can invalidate its own input
**File**: orbit/changes/rc07-artifact-lint/design.md:122
**Description**: `architecture.ruling-count` emits the number of matching entries, but D3 and task 4.2 use that value to check the highest ruling id. The design admits those facts coincide only while ids stay contiguous, yet neither the new requirement nor the live architecture baseline requires contiguity or uniqueness of ruling suffixes. A correct endpoint therefore fails after any gap or duplicate. Self-application makes this sharper: `clean-up-review-cycle.md` has no separate ruling-count or endpoint summary; its only `R-crc-10` endpoint is the counted list entry at line 232. Putting the requested marker around that entry's `10` changes its first bold span so it no longer matches `<prefix>-<n>`, drops the computed count to 9, and makes the dogfood fail itself. Specify an exact current-state sentence outside the counted list and mark a ruling COUNT there (and in `CLAUDE.md`), or expose a distinct endpoint source with explicit gap/duplicate semantics. Do not put a marker inside an entry used to compute the source.

### The new ruling parser silently reverses a live baseline contract
**File**: orbit/specs/orbit-architecture-engine/spec.md:23
**Description**: The archived `Parseable architecture-doc format` requirement says the engine reads only stage ids/titles, the two slots, and section boundaries, and explicitly declares rulings engine-opaque. This proposal adds `countRulingEntries` to `src/core/architecture/parser.ts`, makes rulings engine-readable, and nevertheless declares no modified capabilities or delta for `orbit-architecture-engine`. After archive, the new ADDED requirement and the baseline requirement would contradict each other. Either add `orbit-architecture-engine` as a modified capability with the full MODIFIED requirement that permits this narrowly defined ruling-index read, or keep the architecture parser's contract intact by placing the source-specific parser outside that subsystem and clarify why the baseline's opacity statement remains true.

### Literal review markers will leak into canonical artifacts
**File**: orbit/changes/rc07-artifact-lint/proposal.md:33
**Description**: This line contains a literal `@review:` token, and the new spec contains another at `specs/orbit-source-lint/spec.md:9`. The existing `orbit-address-reviews` contract discovers markers with a raw `@review:` grep and gives those hits priority; it has no inline-code inertness rule. If applied, one token also lands in the new baseline spec, violating the marker-removal invariant and creating spurious review work. Rephrase both references so the literal grep token is absent, then require a pre-apply `rg -n '@review:' orbit/changes/rc07-artifact-lint --glob '!**/.orbit-runs/**'` sweep to return zero.

## WARNING

### Inline-code inertness is not specified to an implementable grammar
**File**: orbit/changes/rc07-artifact-lint/specs/orbit-source-lint/spec.md:55
**Description**: The requirement says "inside an inline code span" while task 2.2 asks to extend a line-based fence tracker, but it never defines the backtick procedure. Under [CommonMark 0.31.2 code-span rules](https://spec.commonmark.org/0.31.2/#code-spans), delimiters close only with an equal-length backtick run, spans may cross line endings, and an opener with no matching run is literal text. A straightforward streaming toggle cannot know the last case without lookahead and can incorrectly hide every real marker later in the file. Modifying `FenceTracker.inFence`/`handle` also risks the trail and report parsers that share that API. Add a closed decision table and tests for equal/unequal runs, unmatched runs, multiline spans, adjacent spans, and fence interaction; implement an additive whole-document code-region mask (or separate API) that preserves existing fence consumers. For the required job of classifying marker offsets, this is plausibly tens of lines plus tests, not hundreds, once that boundary is explicit.

### The JSON contract cannot represent required error kinds or summary validity
**File**: orbit/changes/rc07-artifact-lint/design.md:156
**Description**: D5b describes every `source_findings` entry as carrying file, line, source, span text, and source value, but the spec deliberately distinguishes marker errors that have no span/value, orphan closers that have no source, and registry parse errors that may have no markdown line at all. The current validator JSON also represents validity through `items` and `summary.totals`; a `--sources`-only run has no change/spec item, and the design never says how a source failure changes those totals. Implementations can therefore emit null-filled records, throw non-JSON errors, or report zero failed items while exiting non-zero. Define an exact discriminated finding schema for registry, marker, unknown-source, and mismatch failures, plus the validity/summary representation for both `--sources --json` and `--all --json`; test malformed-registry JSON as well as ordinary mismatches.

### The template exclusion misses the engine's project-local schema path
**File**: orbit/changes/rc07-artifact-lint/specs/orbit-source-lint/spec.md:126
**Description**: The exclusion table promises that templates are outside the living-document domain, but it excludes only package-source `schemas/*/templates/**`. Engine reality puts version-controlled project-local schemas under `orbit/schemas/<name>/`, with their markdown templates under `orbit/schemas/<name>/templates/` (`src/core/artifact-graph/resolver.ts:40-45`). Those templates remain in `git ls-files` and would be linted as living prose, contrary to the stated principle. Add `orbit/schemas/*/templates/**` (or a sourced equivalent covering every supported schema tier) and a project-local-template fixture.

### `schema.version` has an unnamed environment-dependent input
**File**: orbit/changes/rc07-artifact-lint/design.md:107
**Description**: The source table names only `schema`, but the real resolver chooses project-local, then user-global, then package-built-in schemas (`src/core/artifact-graph/resolver.ts:63-90`). With no project-local `spec-driven`, the same checkout can therefore emit a different value when one developer has a global override; the planned `CLAUDE.md` marker for this repository's shipped schema version becomes machine-dependent. That resolution tier is an input under R-crc-10 and must be named. Define whether this source means the effective resolved schema or a specific project/package tier; for reproducible repository facts, either exclude user-global overrides or add an explicit tier parameter, and test the override case.

### Registry source names can be valid yet impossible to reference
**File**: orbit/changes/rc07-artifact-lint/specs/orbit-source-lint/spec.md:5
**Description**: Marker names must match `[a-z0-9][a-z0-9-]*`, but the registry requirement assigns no grammar to the map keys. An entry such as `Bad_Name` can consequently parse, resolve, and appear in coverage while no legal marker can ever name it. Parameter value types and resolution failures are similarly implicit: YAML numbers/nulls for `doc`, `prefix`, or `schema`, a missing architecture doc, and an unknown schema have no specified outcome. Require registry names to use the marker NAME grammar, require declared parameters to be non-empty strings (with any tighter identifier rules stated), and make unresolved doc/schema references clean validation errors with tests.

### Ruling-source zero behavior contradicts itself inside the design
**File**: orbit/changes/rc07-artifact-lint/design.md:195
**Description**: D3, the normative spec, and task 1.1 say that a declared prefix yielding zero entries is a malformed source that fails; this risk entry says the same source counts zero and relies on coverage to expose it. A codegen reader cannot satisfy both. Rewrite the risk entry to preserve the zero-match failure and distinguish a source-resolution error from changing the architecture document's `docClass`; add the missing normative statement for how both architecture sources handle absent, LEGACY, and MALFORMED documents.

### The documentation task leaves `--all` documented with false behavior
**File**: orbit/changes/rc07-artifact-lint/tasks.md:32
**Description**: Task 5.3 adds only a `--sources` row, while `docs/cli.md` currently describes the command and its `--all` flag as validating changes and specs only (`docs/cli.md:272-295`). After this change, that text is behaviorally false even if the known `openspec` branding remains deferred. Expand the task to update the command description and the existing `--all` row (and the JSON example once D5b's schema is settled), without widening into the unrelated branding pass.

## SUGGESTION

### The change's own measured counts are already stale
**File**: orbit/changes/rc07-artifact-lint/design.md:181
**Description**: On the committed review tree, the declared path rules yield 54 markdown files before the HISTORICAL exclusion and 52 after it, not 50/48; the four generated proposal artifacts entered the tracked domain after the earlier measurement. D4b and task 5.2 also say the change contains four conforming markers inside backticks (three openers and one closer), but it now contains ten (three openers and seven closers) after the pairing scenarios were added. Replace incidental totals with reproducible commands or refresh them at apply, and have the inertness test derive/cover every current exemplar rather than pinning the stale count.

### The dogfood description overstates coverage of the motivating defects
**File**: orbit/changes/rc07-artifact-lint/design.md:204
**Description**: Case 1's fourth real defect is the archived findings-file severity string, and D3 correctly says v1 has no source for it. Task 4.2 instead marks a capability count, which is useful but is not that fourth defect. The migration plan's claim that the dogfood checks "the four figures this session got wrong" conflicts with the exploration's explicit three-of-four coverage statement. Say that dogfood exercises all four registry sources while the severity-count defect remains deliberately unsupported, and carry that distinction into any charter amendment so the split is not narrated as closure.

## Notes

The observable-input boundary is mostly sound: file paths, declared source links, parsed counts, and span bytes are machine-owned, while unmarked authorial intent remains an explicit record-only residual. The concentrated risk is at semantic adapters: count versus endpoint, schema name versus resolution tier, path category versus every real path, and generic "finding" versus four structurally different failures. I also verified strict proposal validation, walked the archived architecture baseline, enumerated the current git-derived file domain and inline marker sites, and ran the repository test suite.
