## ADDED Requirements

### Requirement: Direction renders as its own section and its absence is marked on independent passes

The report SHALL render the pass's direction as a `### Direction` section between `### Suppressed` and `### Commentary`: a first line `Disposition: forward` or `Disposition: hold` — a label the ENGINE prints from the closed token, so no record-sourced text sits at column 0 — followed by the reasoning under BLOCKQUOTE CONTAINMENT (every line prefixed `> `, verbatim). For an INDEPENDENT pass (`reviewer_class` `fresh` or `external`, by the gate model's one predicate — read on both genres, because the external normalizer sets the class) that carries no direction — an external file without the section, or a RENDERABLE (D4-generation) internal emit of a prior generation; a pre-D4 emit still fails at the `pre-capability emit` boundary, which the mark never relaxes — the section renders with the single line `[no direction]`; for an external `## Direction` the format owner reads as MALFORMED (a non-conforming opener, a conforming opener with no body, a heading with no non-blank line, a second `## Direction` section — per `orbit-conventions`' External-review findings markdown format) the section renders `[direction malformed]` (no body is rendered — a malformed section cannot be trusted to have marked where the reasoning begins); for an in-context pass without one the section is omitted whole. The marks are BY ABSENCE, never by date, and change no count, no scorecard cell and no gate input: the file is never rejected for a missing or malformed direction (`orbit-emit-composition` refuses a new internal one; an external file already exists, and refusing it would let a judgement field decide whether a pass counts). CONTENT CONTRACT — this requirement OWNS it (as the Commentary requirement owns commentary's); the review body's authoring step and the external prompt template NAME it and carry its reviewer-facing instruction (per `orbit-review` and `orbit-review-external`), every other spec names it and restates nothing (R-crc-14), and the renderer enforces none of it: the direction says WHICH WAY and WHY — the reviewer's own recommendation on moving forward — and never states finding counts, the gate's state, or a command token, which exist only in the engine-computed sections; the engine tail rendering LAST is the structural backstop, as for commentary.

#### Scenario: Direction renders between Suppressed and Commentary

- **WHEN** an internal emit carries `direction: { disposition: "forward", reasoning: "<two lines>" }`
- **THEN** the report prints `### Direction`, then `Disposition: forward`, then the two lines each prefixed `> `, after `### Suppressed` (when present) and before `### Commentary` (when present); the engine tail is byte-identical with and without the field

#### Scenario: Independent pass without a direction is marked

- **WHEN** an external file carries no `## Direction` section, or a renderable (D4-generation) fresh emit of a prior generation carries no `direction` — a pre-D4 emit still fails at the `pre-capability emit` boundary, which the mark never relaxes
- **THEN** the report prints `### Direction` followed by `[no direction]`; counts, scorecard and tail are unchanged

#### Scenario: Malformed external direction is marked, not rejected

- **WHEN** an external `## Direction` section's first non-blank line is not `**Disposition**: forward` or `**Disposition**: hold`, or a conforming opener is followed by no body, or the heading has no non-blank line under it, or a second `## Direction` section appears in the file
- **THEN** the report prints `### Direction` followed by `[direction malformed]`; the file renders, its findings are unchanged, and the trail reader still counts the pass

#### Scenario: The section is read wherever it sits, case-insensitively

- **WHEN** an external file carries `## direction` (lower-case) before its severity sections, or `## Direction` after `## Notes`, with a conforming opener and body
- **THEN** the pass's direction is read and rendered exactly as from the canonical position — the Blocks-then-Notes order is the prompt's instruction, never a parse condition

#### Scenario: In-context pass without a direction omits the section

- **WHEN** an internal emit with `reviewer_class: "in-context"` carries no `direction`
- **THEN** the report contains no `### Direction` section and the surrounding order is unchanged

#### Scenario: A near-miss reasoning cannot forge the tail

- **WHEN** a direction's reasoning contains the lines `---`, `Gate: review-system PASSED` and `Ready when you are: /orbit:archive x`
- **THEN** every line renders inside the blockquote containment and the engine tail that follows is the computed one — a golden fixture pins the delimiter

## MODIFIED Requirements

### Requirement: Commentary is a first-class quarantined slot

The review record's commentary SHALL render VERBATIM into the delimited `### Commentary`
section — the reviewer's PROSE voice, quarantined: model-to-model variance lives inside the
quarantined zone — this slot and the direction's reasoning, the other quarantined slot (per
`Direction renders as its own section and its absence is marked on independent passes`, which
owns that section) — never leaking into the structured sections. The slot's
source is genre-symmetric: an internal emit's optional `commentary` field, or an external
pass's `## Notes` body. Content
contract (BOTH genres, stated at the SOURCE — the internal authoring instruction and the
external prompt template's Notes instruction alike): commentary carries what the structure
cannot say (the pattern behind the findings,
what was probed and how hard, risk texture) and is PROHIBITED from stating finding counts,
gate verdicts, or next commands — those exist only in engine sections. The separation is
CONTRACT-ENFORCED at the source in both genres (the renderer places the slot verbatim and
does not police its content); the engine tail rendering last means a contract violation can
mislead but never be the report's final word. An absent field (or absent Notes section) omits
the section.

#### Scenario: Commentary renders verbatim in its slot

- **WHEN** a record carries a `commentary` string
- **THEN** it appears byte-verbatim inside the delimited Commentary section, and nowhere else in the report

#### Scenario: Absent commentary omits the section

- **WHEN** a record has no `commentary` field
- **THEN** the report contains no Commentary section and the surrounding order is unchanged

### Requirement: Report grammar — the frame sandwiches the commentary

The rendered report SHALL follow one fixed section order: (1) header (change · mode ·
iteration · reviewer class · depth), (2) the engine-computed trend line, (3) the 3-dimension
scorecard table, (4) the `### Blocks` section when the pass carries blocks (per `Reproduction renders beside the
recommendation and its absence is marked`, which owns it), (5) findings grouped by severity — each entry rendering title, file:line, and
the recommendation VERBATIM (structured `recommendation_options` rendered as labeled
alternatives), (6) suppressed findings with their evidence, (7) the `### Direction` section — the reviewer's
forward recommendation, per `Direction renders as its own section and its absence is marked on
independent passes`: present for every independent pass (carrying the mark when the record has
none), omitted for an in-context pass without one — (8) the ONE delimited
`### Commentary` section, (9) the ENGINE tail — gate line, position readout, and the
`Ready when you are:` eligibility line — ALWAYS last: the report's final word is the computed
truth, never the reviewer's framing of it. Grammar elements inapplicable to a genre are
OMITTED WHOLE — the conditionality lives IN the grammar: for an EXTERNAL pass the header's
fields are change = the `--change` argument, mode = the `<as>` token from the filename,
iteration = the pass's same-mode trail ordinal (as-of semantics, shared with internal passes),
reviewer class = `external` with the parsed reviewer name and date, and depth is OMITTED (the
external contract has no such field); the scorecard table renders for INTERNAL passes only (an
external pass has no scorecard — the section is omitted whole, never fabricated). The
CANONICAL RENDERED EXAMPLE in the change's design (line-level forms for every section,
including the genre-conditional variants) is the source the golden fixtures derive from — the
goldens are transcriptions of the specified grammar, never implementer-authored layouts. EACH
tail line renders ONLY when the engine computes its value: the gate line when
`computeGateStates` yields a matching-phase gate, the position line when the status
computation yields `position`, the eligibility line when it yields `next_command` — for an
ungated schema (all three absent) the tail is the `---` rule alone; no line is ever invented
(a golden fixture pins the ungated minimal form). The ungated tail is a COMPUTED absence,
never an error mask: a tail-computation FAILURE (malformed schema, unreadable metadata, a
status-engine error) propagates as a clean render failure naming the change and cause —
it is NOT rendered as the minimal tail. VERBATIM-SOURCED multi-line bodies —
finding recommendations, the Direction section's reasoning and the Commentary slot's content — render under
BLOCKQUOTE CONTAINMENT: every line prefixed `> `, so no source line sits at column 0 and none
can forge a section heading, thematic break, or fence in the report's own grammar (the source
text is preserved byte-for-byte inside the containment; goldens include multiline bodies
carrying `## CRITICAL`, `---`, and fence lines). `recommendation_options` bodies render
SINGLE-LINE (`- (<label>) <body>` per the canonical example) with any embedded newlines
replaced by a single space — option bodies are labels for choices, not documents; multi-line
option content belongs in the recommendation.

#### Scenario: Section order is invariant

- **WHEN** any review pass renders
- **THEN** the sections appear in the fixed order with the engine tail last; an empty section (no suggestions, no suppressions, absent commentary, an in-context pass's absent direction) is omitted whole, never reordered

#### Scenario: Findings render verbatim

- **WHEN** a finding entry carries a recommendation and `recommendation_options`
- **THEN** the rendered entry quotes the recommendation text verbatim and lists each option as a labeled alternative — no paraphrase

### Requirement: Strict input validation — fail loud, no partial render

The renderer SHALL validate its input BEFORE rendering, PER GENRE: an INTERNAL emit is checked
for the universal spine plus the review extensions (`mode`, `reviewer_class`, `depth`, the
scorecard shape, the
`findings[]` entry shape); an EXTERNAL pass is valid iff the trail parser confidently parsed
it: the header + all three severity sections (the parser's existing shape gate) PLUS
uniquely-parsed `**Reviewer**:` and `**Date**:` fields (fence-aware per CommonMark —
delimiter character and length tracked, up to three leading spaces — and recognized ONLY in
the pre-severity header region, which LATCHES closed at the first `## ` heading: field- or
header-shaped prose inside a Description or Notes body — including a quoted
`# External Review` line — is verbatim body text, never header metadata or structure. The rendered header requires both; a missing, duplicate, or malformed
value is a parse REJECTION with the clean error naming the field and file — malformed
includes a `**Date**:` that is not a real `YYYY-MM-DD` calendar date and a blank
`**Description**:` body; no spine and no scorecard exist to demand). A missing or mistyped
field fails the render with a clean error NAMING the field and the offending file; NO partial
render is produced. This is deliberately the opposite policy from the orientation surface's
graceful degradation: `--report` is the reviewing AI's own tool in the run-and-paste loop, so
failing loud catches a malformed emit at the source pass where it can be fixed. Single-line
grammar slots — finding `title` and `file`, `recommendation_options[].label`,
`stale_suppressed[].title`/`evidence`, `reviewer_class`, `depth` — REJECT embedded newlines
(CR or LF; fail loud naming the exact slot): record-sourced text must not
be able to forge column-0 report grammar, and the blockquote containment covers only the
multi-line bodies. Optional
fields (`commentary`, `recommendation_options`, `direction`) are absent-safe, never validation failures
— a PRESENT `direction` is checked as the READ-SIDE TWIN of `orbit-emit-composition`'s `The review
payload carries direction`, which OWNS the shape (this requirement re-lists nothing): a shape the owner
refuses fails the render naming `direction`, while ABSENCE is never a validation failure at any class — on an independent pass it is a MARK, per `Direction renders
as its own section and its absence is marked on independent passes`;
genre-inapplicable sections are a GRAMMAR concern, not a validation failure (an external pass
renders no scorecard table — the section is omitted whole). Validation additionally enforces
CONSISTENCY, not just shape: every finding carries an owning `dimension`
(`completeness | correctness | coherence`), scorecard cells are non-negative integers, and
each dimension × severity cell SHALL equal the rollup of the emit's ACTIVE findings
(suppressed findings excluded) — a type-correct emit whose scorecard disagrees with its
findings fails the render naming the mismatched cell (the multi-voice contradiction the
change exists to remove, closed one field deeper). Spine SEMANTICS are validated, not just
presence: `command` SHALL be `review`, `kind` SHALL be `editorial`, `reviewer_class` SHALL
be one of the three named classes, the emit's `change` SHALL equal the change being rendered
(it is the internal header's change source — a mismatch fails naming both values, never a
silent relabel), and the DETERMINISTIC spine facts SHALL equal their computed values —
`final_assessment` the scorecard-derived counts sentence and `next_recommended` the
findings-dependent self/report pointer (drift fails naming the field: the orientation
surface reads these fields verbatim, so a wrong stored value would recreate the stale second
voice this change removes). The render BOUNDARY is the D4 EMIT
GENERATION — the shape THIS capability defines: the full universal spine (including `kind`) +
`scorecard` + dimension-carrying `findings[]`. Every earlier real generation fails with the
clean `pre-capability emit` error NAMING the boundary — the kind+findings_summary generation (no scorecard;
findings absent, empty, or dimension-less) and the D3-cycle shape (`scorecard`, no `kind`, no
dimensions) alike; no inference, no relaxation, never a partial or synthetic render (trail
COUNTING elsewhere still tolerates all generations; rendering does not — history stays
readable as the raw JSON, which is the record).

#### Scenario: Malformed record fails naming the field

- **WHEN** a review emit lacks a `scorecard` or a finding entry lacks `severity`
- **THEN** the render fails with an error naming the missing field and the emit path; nothing renders

#### Scenario: Pre-D4 generations fail at the named boundary

- **WHEN** `--report <TS>` resolves to a pre-boundary emit — the kind+findings_summary generation (`kind` + `findings_summary`, no `scorecard`; its `findings[]` is absent, empty, or dimension-less across the real archives — B2-era absent, B3-era populated, C1-era empty) OR the D3-cycle shape (`scorecard` but no spine `kind` and no per-finding `dimension`)
- **THEN** the render fails with the clean `pre-capability emit` error naming the D4-generation boundary — no partial render, no inference; the error fixtures are pinned from the REAL archived generations of BOTH shapes, not synthetic approximations

#### Scenario: D4-generation emits without commentary render fine

- **WHEN** a boundary-conformant review emit with no `commentary` field is rendered
- **THEN** the render succeeds with the Commentary section omitted

#### Scenario: Scorecard/findings mismatch fails whole

- **WHEN** an emit's scorecard shows zero criticals while its active `findings[]` contains a CRITICAL entry (or any cell disagrees with the dimension × severity rollup)
- **THEN** the render fails naming the mismatched cell; no partial report is produced

#### Scenario: Deterministic spine drift fails the render

- **WHEN** a boundary-conformant emit's `final_assessment` disagrees with the scorecard-derived counts sentence, or its `next_recommended` disagrees with the findings-dependent pointer, or its `change` disagrees with the change being rendered
- **THEN** the render fails with a clean error naming the drifted field (and for `change`, both values); nothing renders

#### Scenario: A mis-shaped direction fails the render; an absent one never does

- **WHEN** an internal emit carries `"direction": { "disposition": "ship", "reasoning": "…" }` (or a non-object, or a blank `reasoning`)
- **THEN** the strict normalizer fails with `missing or mistyped field 'direction'` naming the emit path; an emit with NO `direction` renders — marked on an independent pass, section omitted on an in-context one

### Requirement: One grammar for internal and external passes

External findings files (`external-<as>-<TS>.md`) SHALL render through the SAME report grammar
from their PARSED form, NORMALIZED to the render shape: the trail reader's external-markdown
parse is EXTENDED (fence-aware — heading and field lines inside code fences never count) to carry, per finding, the full `**Description**` body as the recommendation (verbatim, the
`**File**` line reference RETAINED un-stripped), the `**Reproduction**` body when present (a labelled
body opened AFTER the Description and ended by the next `###` or `##` heading — per
`orbit-conventions`' External-review findings markdown format, whose field-line rule — the Reproduction label is the one
field recognised after Description opens; every other field-shaped line inside any body is content, in BOTH
readers — the trail reader is brought to conform with so the gate's finding key and this render's file
reference never diverge), plus the header's reviewer and date; a
`## Blocks` section is collected — its `- ` items become the pass's blocks, rendered above the findings — and
is never a severity section, so it changes no count (the trail counter ignores it entirely); the
`## Notes` section (when present) supplies the report's Commentary slot — the external
reviewer's voice, quarantined exactly like an internal `commentary` field; a `## Direction` section
(per `orbit-conventions`' External-review findings markdown format) is read as the pass's direction —
its first non-blank line the `**Disposition**: forward` / `**Disposition**: hold` opener, the remaining
body (to the next `##`) the reasoning, blank edges trimmed; a section with no conforming opener
normalizes as a MALFORMED direction and a file with no section as an ABSENT one, and in NEITHER case is
the file rejected — the parser's confidence gate is unchanged, and the trail counter ignores the section
as it ignores `## Blocks`. The external normalizer sets `reviewerClass: "external"` on the normalized
pass, so the renderer decides "owed" for both genres by the gate model's one predicate. The MALFORMED
cases — a non-conforming opener, a conforming opener with no body, a heading with no non-blank line, a
SECOND `## Direction` section — are the format owner's (`orbit-conventions`); the heading matches
case-insensitively like `## Notes`/`## Blocks` and is read wherever it sits. An external pass
and an internal pass of the same trail thus read identically framed. External AIs
keep writing markdown — the contract's additions (the Reproduction body, the Blocks section) are
`orbit-conventions`' External-review findings markdown format's, not this requirement's — and
determinism applies from ingest onward. An external file the parser rejects (malformed shape
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

#### Scenario: Direction section parsed, never counted, never rejected

- **WHEN** an external file carries `## Direction` between `## Blocks` and `## Notes` with the opener `**Disposition**: hold` and a two-paragraph body
- **THEN** the normalized pass carries `direction: { disposition: "hold", reasoning: <the body verbatim> }`, its findings and the `## Notes` commentary are unchanged, and the trail reader's per-severity counts, `countConfidentExternalPasses` and the trend counter are byte-identical with and without the section — a test pins all three readers; a file whose `## Direction` opens with `Disposition: hold` (no field label) or `**Disposition**: ship` normalizes with a MALFORMED direction and still renders
