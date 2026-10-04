## MODIFIED Requirements

### Requirement: External-review findings markdown format

The system SHALL use a consistent markdown shape for external-review findings files.

#### Scenario: Required structure

- **WHEN** an external-review findings file is written
- **THEN** it contains: `# External Review: <change> (iteration N)` title, `**Reviewer**:` and `**Date**:` fields, severity sections (`## CRITICAL`, `## WARNING`, `## SUGGESTION`), each containing `### <Title>` entries with `**File**: <path>:<line>` and `**Description**: <text>` fields; optional `## Notes` section. The `**Description**:` label OPENS the body whether its text begins on the same line or on the following lines; the body runs to the `**Reproduction**:` label, the next `###` or the next `##` heading, and a Description with no non-blank body (fenced lines count as body) is MALFORMED in both readers — the renderer rejects the file naming the finding, the trail reader records a rejected return — never a present-but-empty field in one and absent in the other. A CRITICAL entry additionally carries a `**Reproduction**: <text>` body AFTER its `**Description**:` body (ended by the next `###` or `##` heading); a CRITICAL without one is counted as authored and marked `unreproduced` by the renderer, never re-graded. An optional `## Blocks` section (before `## Notes`) lists must-address-before-apply conditions that are not severities (per the Severity ladder requirement) as `- <what>` items; the renderer's parser collects those items for the report's Blocks section (a bulleted `- None.` is the empty-section sentinel, not a block) and the trail counter ignores the section, so it changes no count. A `## Direction` section — AFTER `## Blocks` and BEFORE `## Notes` — is REQUIRED on every return: its first non-blank line is the opener `**Disposition**: forward` or `**Disposition**: hold` (recognised ONLY as that first line; the field-line rule applies inside the body), and the remaining body, to the next `##`, is the reviewer's reasoning — the forward recommendation whose CONTENT contract `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` owns (this format names it and restates nothing). A return without the section is read as direction-ABSENT; a section whose first non-blank line is not the opener, a conforming opener followed by NO body, a heading with no non-blank line under it, or a SECOND `## Direction` section is read as MALFORMED (a direction without reasoning is not one; two sections are two claims on one truth); the heading matches case-insensitively like `## Blocks` and `## Notes`, and the section is read wherever it sits — the Blocks-then-Notes order is the prompt's instruction, not a parse condition. Absent or malformed, the return is STILL a pass: the renderer (`orbit-report-rendering`) marks it `[no direction]` / `[direction malformed]` and never rejects the file for it, the trail counter ignores the section exactly as it ignores `## Blocks` so it changes no count, and `/orbit:address-reviews --from-file` never walks it.

#### Scenario: Parseable by --from-file

- **WHEN** `/orbit:address-reviews --from-file <path>` reads this format
- **THEN** the parser extracts per-finding severity, title, file:line, description, and — when present — the reproduction body; `## Blocks` entries are listed at triage and never walked as findings

#### Scenario: Field lines are recognised only before the Description body opens — in BOTH readers

- **WHEN** a finding's `**Description**:` body — opened by the label, with its text on the same line or the next — (and any `**Reproduction**:` body after it, or a `## Blocks` item) contains a line that looks like a field — `**File**: other/path.md:99`, `**Description**: …` — because a reproduction quotes a path or a reviewer pastes a snippet
- **THEN** that line is CONTENT, with ONE exception: `**Reproduction**:` is the sole field label recognised AFTER a Description body opens — it ENDS the Description body and opens the Reproduction body, which runs to the next `###` or `##` heading. Every other field-shaped line inside a Description, Reproduction or Blocks body is content: the finding's file is the `**File**:` line read BEFORE its Description body opened, and both the renderer's parser (`orbit-report-rendering`) and the trail reader that feeds the gate (`orbit-engine-gates`' shape validation) read it the same way, so the gate's finding key (title, repo-relative file) and the report's file reference never diverge; a test pins the KEY across both readers, not only the per-severity counts

#### Scenario: Reproduction body is the fourth field, never the first

- **WHEN** an external findings file carries `**Reproduction**:` on a finding
- **THEN** it follows the `**Description**:` body; a `**Reproduction**:` line placed before `**Description**:` is not recognised (the parser contract opens the recommendation body at Description, and a file without the label parses exactly as before this requirement)

#### Scenario: Direction section is read by the renderer, ignored by the counters, never walked

- **WHEN** an external-review findings file carries `## Direction` with the opener `**Disposition**: forward` and a reasoning body
- **THEN** the renderer's parser carries `{disposition, reasoning}` as the pass's direction and prints it in the report's `### Direction` section; the trail reader's per-severity counts are unchanged by the section; the walk lists no entry for it; a file WITHOUT the section renders marked `[no direction]` and is otherwise read exactly as before this requirement; a file whose section has a conforming opener and no body, or no non-blank line, or a second `## Direction`, renders marked `[direction malformed]` and still counts as a pass; `## direction` in lower case, or the section after `## Notes`, is read as the canonical form is
