## ADDED Requirements

### Requirement: Reproduction renders beside the recommendation and its absence is marked

The report SHALL render a finding's reproduction, when present, as a second blockquote directly under its recommendation, labelled `Reproduction:`, verbatim; and SHALL render the mark `[unreproduced]` as a PREFIX before the bold file reference of any CRITICAL that carries none — outside the title token, so a copied line still yields the gate's exact title (Q-crc-17) — on external passes, where the file could not be refused, and on internal passes of a prior generation. The mark changes no count, no scorecard cell, and no gate input: severity is the author's and is NEVER re-graded (per `orbit-conventions`' Severity ladder and `orbit-engine-gates`). The internal normalizer passes a string `reproduction` through and rejects a non-string one as a mistyped field. The report SHALL also render a `### Blocks` section ABOVE `### Findings` whenever the pass carries blocks (an internal emit's `blocks` array; an external file's `## Blocks` items), one `- ` line each, verbatim; the section is omitted when there are none, and it feeds no scorecard cell and no gate input.

#### Scenario: Reproduction rendered under the recommendation

- **WHEN** a finding (internal or external) carries a reproduction
- **THEN** the render prints `> Reproduction:` followed by the body's lines, each blockquoted, immediately after the recommendation blockquote

#### Scenario: Unreproduced CRITICAL marked, not re-graded

- **WHEN** an external CRITICAL carries no `**Reproduction**:` body
- **THEN** its finding line renders as `- [unreproduced] **<file>** — <title>`, it remains under `## CRITICAL`, and the engine tail's gate computation is byte-identical with and without a Reproduction body

#### Scenario: Blocks render above the findings for both genres

- **WHEN** an internal emit carries `blocks: ["…"]` or an external file carries `## Blocks` items
- **THEN** the report prints `### Blocks` with one line per entry between the scorecard table (internal) or header (external) and `### Findings`; the scorecard, counts and engine tail are unchanged

#### Scenario: Internal reproduction mistyped

- **WHEN** an internal emit's finding carries `"reproduction": 42`
- **THEN** the strict normalizer fails with `missing or mistyped field 'findings[<i>].reproduction'` (the write gate refuses such an emit first; the normalizer's check is the read-side twin)

## MODIFIED Requirements

### Requirement: One grammar for internal and external passes

External findings files (`external-<as>-<TS>.md`) SHALL render through the SAME report grammar
from their PARSED form, NORMALIZED to the render shape: the trail reader's external-markdown
parse is EXTENDED (fence-aware — heading and field lines inside code fences never count) to carry, per finding, the full `**Description**` body as the recommendation (verbatim, the
`**File**` line reference RETAINED un-stripped), the `**Reproduction**` body when present (a labelled
body opened AFTER the Description and ended by the next `###` or `##` heading — per
`orbit-conventions`' External-review findings markdown format, whose field-line rule — a field-shaped
line inside any body is content, in BOTH readers — the trail reader is brought to conform with so the
gate's finding key and this render's file reference never diverge), plus the header's reviewer and date; a
`## Blocks` section is collected — its `- ` items become the pass's blocks, rendered above the findings — and
is never a severity section, so it changes no count (the trail counter ignores it entirely); the
`## Notes` section (when present) supplies the report's Commentary slot — the external
reviewer's voice, quarantined exactly like an internal `commentary` field. An external pass
and an internal pass of the same trail thus read identically framed. The external
prompt template's markdown contract is UNCHANGED (external AIs keep writing markdown;
determinism applies from ingest onward). An external file the parser rejects (malformed shape
→ the parser's null) is non-renderable and fails with the clean error naming the file.

#### Scenario: External pass renders through the shared grammar

- **WHEN** `--report <TS>` resolves to an external findings file
- **THEN** the report renders with the same section order and engine tail as an internal pass — the genre-conditional header (change from the argument, mode from the filename, trail-ordinal iteration, `external` + parsed reviewer and date, no depth), NO scorecard table, findings from the parsed severity sections, and the `## Notes` body (when present) in the Commentary slot

#### Scenario: Parse-rejected external file fails loud

- **WHEN** the token resolves to an external file the trail parser rejects
- **THEN** the render fails with an error naming the file and the parse rejection; no partial render

#### Scenario: Reproduction body parsed after Description

- **WHEN** an external finding carries `**Description**:` then `**Reproduction**:` bodies
- **THEN** the recommendation is the Description body alone and the reproduction is the Reproduction body (both verbatim, blank edges trimmed); a file without the label normalizes byte-identically to before this requirement

#### Scenario: A path quoted inside a body does not re-file the finding

- **WHEN** an external CRITICAL's Reproduction body contains the line `**File**: specs/b/spec.md:99` while its own `**File**:` line names `specs/a/spec.md:7`
- **THEN** the render shows `specs/a/spec.md:7` AND the trail reader's finding key carries `specs/a/spec.md` — a walk record resolving (title, `specs/a/spec.md`) resolves it at the gate; the test asserts the key through both readers (per `orbit-conventions`' field-line rule)

#### Scenario: Blocks section is collected, never counted

- **WHEN** an external file carries a `## Blocks` section with `- ` items (or `None.`)
- **THEN** the renderer's parser carries the items as the pass's blocks, its findings are unchanged by them, and the trail counter's per-severity counts are unchanged — a test pins both; a heading-shaped line inside `## Blocks` is content, never a finding
