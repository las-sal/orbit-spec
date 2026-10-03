## ADDED Requirements

### Requirement: Reproduction renders beside the recommendation and its absence is marked

The report SHALL render a finding's reproduction, when present, as a second blockquote directly under its recommendation, labelled `Reproduction:`, verbatim; and SHALL render `unreproduced` beside the title of any CRITICAL that carries none — on external passes, where the file could not be refused, and on internal passes of a prior generation. The mark changes no count, no scorecard cell, and no gate input: severity is the author's and is NEVER re-graded (per `orbit-conventions`' Severity ladder and `orbit-engine-gates`). The internal normalizer passes a string `reproduction` through and rejects a non-string one as a mistyped field.

#### Scenario: Reproduction rendered under the recommendation

- **WHEN** a finding (internal or external) carries a reproduction
- **THEN** the render prints `> Reproduction:` followed by the body's lines, each blockquoted, immediately after the recommendation blockquote

#### Scenario: Unreproduced CRITICAL marked, not re-graded

- **WHEN** an external CRITICAL carries no `**Reproduction**:` body
- **THEN** its title line renders with the trailing mark ` — unreproduced`, it remains under `## CRITICAL`, and the engine tail's gate computation is byte-identical to the same file with the mark's cause absent

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
`orbit-conventions`' External-review findings markdown format), plus the header's reviewer and date; a
`## Blocks` section is non-structural (routed like any unknown `##` section) and changes no count; the
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

#### Scenario: Blocks section is invisible to the counts

- **WHEN** an external file carries a `## Blocks` section with entries
- **THEN** the trail counter's per-severity counts and the renderer's findings are unchanged by it — the section is read as non-structural by both parsers, which a test pins
