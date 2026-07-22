## ADDED Requirements

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
truth, never the reviewer's framing of it.

#### Scenario: Section order is invariant

- **WHEN** any review pass renders
- **THEN** the sections appear in the fixed order with the engine tail last; an empty section (no suggestions, no suppressions, absent commentary) is omitted whole, never reordered

#### Scenario: Findings render verbatim

- **WHEN** a finding entry carries a recommendation and `recommendation_options`
- **THEN** the rendered entry quotes the recommendation text verbatim and lists each option as a labeled alternative — no paraphrase

### Requirement: Render-time computed context — never stored, never authored

The iteration number, trend line, and the tail's gate/position/eligibility SHALL be COMPUTED
at render time — iteration and trend from the change's prior review passes in the trail
(internal emits and parsed external findings files alike), the tail from the live gate
computation (the same engine sources the orientation surface composes from). None of these
values are read from the record being rendered, and none are stored: a rendered historical
pass shows that pass's findings with the CURRENT tail — a status view of a past pass, honestly
labeled. The reviewer CANNOT author a gate verdict, a position, or a next-command into the
report; those exist only in engine-computed sections.

#### Scenario: Historical pass renders with the current tail

- **WHEN** `--report <TS>` renders a pass from last week and the gate state has since changed
- **THEN** the findings body is that pass verbatim while the gate/position/eligibility tail reflects the engine's CURRENT computation

#### Scenario: The trend is trail-computed

- **WHEN** a change's trail holds prior review passes of the rendered pass's mode
- **THEN** the trend line derives from those passes' severity counts in token order — never from any field of the rendered record

### Requirement: Commentary is a first-class quarantined slot

The review record's optional `commentary` field SHALL render VERBATIM into the single
delimited `### Commentary` section — the reviewer's voice, quarantined: model-to-model
variance lives inside this field, never leaking into the structured sections. Content
contract: commentary carries what the structure cannot say (the pattern behind the findings,
what was probed and how hard, risk texture) and is PROHIBITED from stating finding counts,
gate verdicts, or next commands — those exist only in engine sections, so the two voices can
never disagree. An absent field omits the section.

#### Scenario: Commentary renders verbatim in its slot

- **WHEN** a record carries a `commentary` string
- **THEN** it appears byte-verbatim inside the delimited Commentary section, and nowhere else in the report

#### Scenario: Absent commentary omits the section

- **WHEN** a record has no `commentary` field
- **THEN** the report contains no Commentary section and the surrounding order is unchanged

### Requirement: Strict input validation — fail loud, no partial render

The renderer SHALL validate its input BEFORE rendering: the universal spine plus the review
extensions (`mode`, the scorecard shape, the `findings[]` entry shape). A missing or mistyped
field fails the render with a clean error NAMING the field and the offending file; NO partial
render is produced. This is deliberately the opposite policy from the orientation surface's
graceful degradation: `--report` is the reviewing AI's own tool in the run-and-paste loop, so
failing loud catches a malformed emit at the source pass where it can be fixed. Optional
fields (`commentary`, `recommendation_options`) are absent-safe, never validation failures.

#### Scenario: Malformed record fails naming the field

- **WHEN** a review emit lacks a `scorecard` or a finding entry lacks `severity`
- **THEN** the render fails with an error naming the missing field and the emit path; nothing renders

#### Scenario: Legacy emits without commentary render fine

- **WHEN** a pre-capability review emit (no `commentary` field) is rendered
- **THEN** the render succeeds with the Commentary section omitted

### Requirement: One grammar for internal and external passes

External findings files (`external-<as>-<TS>.md`) SHALL render through the SAME report grammar
from their PARSED form — the fence-aware external-markdown parse the trail reader owns — so an
external pass and an internal pass of the same trail read identically framed. The external
prompt template's markdown contract is UNCHANGED (external AIs keep writing markdown;
determinism applies from ingest onward). An external file the parser rejects (malformed shape
→ the parser's null) is non-renderable and fails with the clean error naming the file.

#### Scenario: External pass renders through the shared grammar

- **WHEN** `--report <TS>` resolves to an external findings file
- **THEN** the report renders with the same section order and engine tail as an internal pass — reviewer and date from the parsed header, findings from the parsed severity sections

#### Scenario: Parse-rejected external file fails loud

- **WHEN** the token resolves to an external file the trail parser rejects
- **THEN** the render fails with an error naming the file and the parse rejection; no partial render

### Requirement: The render surface is the status gateway

The renderer SHALL surface exclusively as `orbit status --change <name> --report [<TS>]` — the
trail gateway's deepest zoom (bare → `--full` → `--change` → `--report`), never a standalone
verb. With no `<TS>`, the NEWEST review pass renders (internal emits and external findings
files competing on the same recency axis, the shared tie-break applying); an explicit `<TS>`
token selects a specific pass. `--report` rides the `--change` form only (bare stays the
sprint view). The surface is READ-ONLY — the render creates and modifies no files. A `<TS>`
resolving to a non-renderable emit genre (propose, apply, archive, …) fails with a clean error
naming the renderable genres — the dispatch reads the emit's spine `command` field, leaving
future genres a cheap extension.

#### Scenario: No-argument report renders the newest pass

- **WHEN** `orbit status --change <name> --report` runs on a change whose trail holds three review passes
- **THEN** the newest by token (shared tie-break) renders; repeated invocations render identically

#### Scenario: Non-renderable genre fails naming the renderable set

- **WHEN** `--report <TS>` resolves to an `apply-<TS>.json` emit
- **THEN** the command fails with an error naming the genre and listing what is renderable; exit non-zero; no partial output

#### Scenario: Read-only surface

- **WHEN** any `--report` invocation completes
- **THEN** no file was created or modified
