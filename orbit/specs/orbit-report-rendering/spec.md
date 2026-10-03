# orbit-report-rendering Specification

## Purpose

The engine-owned review-report render (D-arc Stage D4 — review consistency): ONE pure,
deterministic, byte-stable render of any review pass — an internal review emit or a parsed
external findings file — through one shared report grammar, surfaced as the trail gateway's
deepest zoom at `orbit status --change <name> --report [<TS>]`. The report's structured
sections (header, trend, scorecard, findings, suppressions) and its gate/position/eligibility
tail are engine-computed single-voice facts — verbatim from the record, computed from the
trail/gate engine, or fixed grammar text, pinned by golden tests. The reviewing AI authors
only findings and commentary; verdicts, iteration context, and next commands it cannot
author at all.
## Requirements
### Requirement: Deterministic review-report rendering

The engine SHALL own the human-facing review report as a PURE FUNCTION over a review pass
record: the same input record and render-time context produce a BYTE-IDENTICAL markdown
report, regardless of which model produced the record, on every invocation (arc exit
criterion 1). The function performs NO judgment — no summarizing, no wording choices, no
severity calls; every rendered sentence is either verbatim from the record, computed from the
trail/gate engine, or fixed grammar text. Determinism SHALL be pinned by golden tests
(`expect(render(fixture)).toBe(golden)`), making any report-format change a deliberate
golden-file edit.

#### Scenario: Same record, same bytes

- **WHEN** the same findings record is rendered twice (any machine, any session)
- **THEN** the two outputs are byte-identical, and the golden test suite pins the format

#### Scenario: No judgment in the render

- **WHEN** the renderer processes a record
- **THEN** it never rephrases, reorders by its own judgment, or omits findings; ordering and phrasing follow the fixed grammar only

### Requirement: Report grammar — the frame sandwiches the commentary

The rendered report SHALL follow one fixed section order: (1) header (change · mode ·
iteration · reviewer class · depth), (2) the engine-computed trend line, (3) the 3-dimension
scorecard table, (4) findings grouped by severity — each entry rendering title, file:line, and
the recommendation VERBATIM (structured `recommendation_options` rendered as labeled
alternatives), (5) suppressed findings with their evidence, (6) the ONE delimited
`### Commentary` section, (7) the ENGINE tail — gate line, position readout, and the
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
finding recommendations and the Commentary slot's content — render under
BLOCKQUOTE CONTAINMENT: every line prefixed `> `, so no source line sits at column 0 and none
can forge a section heading, thematic break, or fence in the report's own grammar (the source
text is preserved byte-for-byte inside the containment; goldens include multiline bodies
carrying `## CRITICAL`, `---`, and fence lines). `recommendation_options` bodies render
SINGLE-LINE (`- (<label>) <body>` per the canonical example) with any embedded newlines
replaced by a single space — option bodies are labels for choices, not documents; multi-line
option content belongs in the recommendation.

#### Scenario: Section order is invariant

- **WHEN** any review pass renders
- **THEN** the sections appear in the fixed order with the engine tail last; an empty section (no suggestions, no suppressions, absent commentary) is omitted whole, never reordered

#### Scenario: Findings render verbatim

- **WHEN** a finding entry carries a recommendation and `recommendation_options`
- **THEN** the rendered entry quotes the recommendation text verbatim and lists each option as a labeled alternative — no paraphrase

### Requirement: Render-time computed context — never stored, never authored

The iteration number, trend line, and the tail's gate/position/eligibility SHALL be COMPUTED
at render time — iteration and trend from the trail's same-mode review passes (internal emits
and parsed external findings files alike), the tail from the live gate computation (the same
engine sources the orientation surface composes from). ONE TOTAL PASS ORDER governs
everything recency-shaped: passes order by `<TS>` token, equal tokens by the shared tie-break
(lexicographically-earlier full filename is more recent) — the SAME order for newest
selection, explicit-token resolution, the trail ordinal, prior-pass matching, and the trend
prefix, so two same-second passes have distinct ordinals and a unique final trend point.
Iteration and trend are AS-OF the rendered pass and INCLUDE it: iteration = the rendered
pass's ordinal in the total order; the trend's points are the severity counts of the passes
preceding-or-equal in that order,
its last point being the rendered pass itself (post-persist the record IS a trail member — the
record/trail boundary is the persist, not the render) — stable values, golden-testable, never
read from bespoke fields inside the record. The TAIL alone is always CURRENT: a rendered
historical pass shows that pass's findings and as-of-then iteration/trend with TODAY's
gate/position/eligibility — a status view of a past pass, honestly labeled. The reviewer
CANNOT author a gate verdict, a position, or a next-command into the report; those exist only
in engine-computed sections.

#### Scenario: Historical pass renders with the current tail

- **WHEN** `--report <TS>` renders a boundary-conformant pass from last week and the gate state has since changed
- **THEN** the findings body is that pass verbatim while the gate/position/eligibility tail reflects the engine's CURRENT computation

#### Scenario: The trend is trail-computed, as-of the rendered pass

- **WHEN** a change's trail holds review passes of the rendered pass's mode, some later than the rendered pass
- **THEN** the trend line derives from the same-mode passes' severity counts in token order UP TO AND INCLUDING the rendered pass (later passes excluded — as-of semantics, stable for goldens)

### Requirement: Commentary is a first-class quarantined slot

The review record's commentary SHALL render VERBATIM into the single
delimited `### Commentary` section — the reviewer's voice, quarantined: model-to-model
variance lives inside this field, never leaking into the structured sections. The slot's
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
fields (`commentary`, `recommendation_options`) are absent-safe, never validation failures;
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
reviewer's voice, quarantined exactly like an internal `commentary` field. An external pass
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

### Requirement: The render surface is the status gateway

The renderer SHALL surface exclusively as `orbit status --change <name> --report [<TS>]` — the
trail gateway's deepest zoom (bare → `--full` → `--change` → `--report`), never a standalone
verb. With no `<TS>`, the NEWEST review pass renders — internal emits and external findings
files competing on the same recency axis, equal tokens breaking by `orbit-orientation`'s
shared tie-break rule (lexicographically-earlier full filename is more recent); an explicit
`<TS>` token selects a specific pass, the same rule resolving a token matching multiple pass
artifacts. `--report` rides the `--change` form only (bare stays the
sprint view); `--report` combined with `--json` is a clean error (the emit IS the JSON — no
render variant is defined). The surface is READ-ONLY — the render creates and modifies no
files. A `<TS>`
resolving to a non-renderable emit genre (propose, apply, archive, …) fails with a clean error
naming the renderable genres — the dispatch reads the emit's spine `command` field, leaving
future genres a cheap extension; a change whose trail holds NO renderable pass at all fails
the same way (the error names the empty renderable set), exit non-zero.

#### Scenario: No-argument report renders the newest pass

- **WHEN** `orbit status --change <name> --report` runs on a change whose trail holds three review passes
- **THEN** the newest by token (shared tie-break) renders; repeated invocations render identically

#### Scenario: Non-renderable genre fails naming the renderable set

- **WHEN** `--report <TS>` resolves to an `apply-<TS>.json` emit
- **THEN** the command fails with an error naming the genre and listing what is renderable; exit non-zero; no partial output

#### Scenario: Zero renderable passes fails loud

- **WHEN** `orbit status --change <name> --report` runs on a change whose trail holds no review pass of any genre (the common pre-review state)
- **THEN** the command fails with a clean error naming the empty renderable set; exit non-zero; no partial output

#### Scenario: Read-only surface

- **WHEN** any `--report` invocation completes
- **THEN** no file was created or modified

### Requirement: Reproduction renders beside the recommendation and its absence is marked

The report SHALL render a finding's reproduction, when present, as a second blockquote directly under its recommendation, labelled `Reproduction:`, verbatim; and SHALL render the mark `[unreproduced]` as a PREFIX before the bold file reference of any CRITICAL that carries none — outside the title token, so a copied line still yields the gate's exact title (Q-crc-17) — on external passes, where the file could not be refused, and on internal passes of a prior generation. The mark changes no count, no scorecard cell, and no gate input: severity is the author's and is NEVER re-graded (per `orbit-conventions`' Severity ladder and `orbit-engine-gates`). The internal normalizer passes a non-blank string `reproduction` through, reads a blank one as ABSENT (the same reading the external parser gives a blank body — the mark is by absence on both genres), and rejects a non-string one as a mistyped field. The report SHALL also render a `### Blocks` section ABOVE `### Findings` whenever the pass carries blocks (an internal emit's `blocks` array; an external file's `## Blocks` items), one `- ` line each, verbatim; the section is omitted when there are none, and it feeds no scorecard cell and no gate input.

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

