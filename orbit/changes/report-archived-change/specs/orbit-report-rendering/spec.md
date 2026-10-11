## MODIFIED Requirements

### Requirement: Report grammar — the frame sandwiches the commentary

The rendered report SHALL follow one fixed section order: (1) header (change · mode ·
iteration · reviewer class · depth · pass genre — computed at render time, per `Render-time computed context — never stored, never authored`, printed on the INTERNAL header line as its last field, `· Pass genre: REVIEW` or `· Pass genre: VERIFICATION` — labelled "Pass genre", never "Genre", because the render genre is a different axis), (2) the engine-computed trend line, (3) the 3-dimension
scorecard table, (4) the `### Blocks` section when the pass carries blocks (per `Reproduction renders beside the
recommendation and its absence is marked`, which owns it), (5) findings grouped by severity — each entry rendering title, file:line, and
the recommendation VERBATIM (structured `recommendation_options` rendered as labeled
alternatives), (6) suppressed findings with their evidence, (6a) the `### Verification` section on a VERIFICATION-genre internal pass, per `Verification renders as its own section and its absence is marked` (omitted whole on every other pass), (7) the `### Direction` section — the reviewer's
forward recommendation, per `Direction renders as its own section and its absence is marked on
independent passes`: present for every independent pass (carrying the mark when the record has
none), omitted for an in-context pass without one — (8) the ONE delimited
`### Commentary` section, (9) the ENGINE tail — gate line, position readout, and the
`Ready when you are:` eligibility line, or for an ARCHIVED change the one `Archived:` line
`Render-time computed context — never stored, never authored` defines in their place — ALWAYS last: the report's final word is the computed
truth, never the reviewer's framing of it. Grammar elements inapplicable to a genre are
OMITTED WHOLE — the conditionality lives IN the grammar: for an EXTERNAL pass the header's
fields are change = the `--change` argument, mode = the `<as>` token from the filename,
iteration = the pass's same-mode trail ordinal (as-of semantics, shared with internal passes),
reviewer class = `external` with the parsed reviewer name and date, and depth and pass genre are OMITTED (the
external contract has no depth, and every external pass is REVIEW by `orbit-conventions`' table, so the field would carry nothing); the scorecard table renders for INTERNAL passes only (an
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
- **THEN** the sections appear in the fixed order with the engine tail last; an empty section (no suggestions, no suppressions, absent commentary, an in-context pass's absent direction, a REVIEW-genre pass's verification) is omitted whole, never reordered

#### Scenario: Findings render verbatim

- **WHEN** a finding entry carries a recommendation and `recommendation_options`
- **THEN** the rendered entry quotes the recommendation text verbatim and lists each option as a labeled alternative — no paraphrase

### Requirement: Render-time computed context — never stored, never authored

The iteration number, trend line, PASS GENRE, and the tail's gate/position/eligibility SHALL be COMPUTED
at render time — the pass genre by the function `orbit-emit-composition`'s `The review emit records its pass genre and the walks it verifies` exports, over the trail records preceding the rendered pass (so a prior-generation emit with no stored `pass_genre` renders its genre too; the stored value and the render-time value read the same tokens and agree on any trail not edited by hand), iteration and trend from the trail's same-mode review passes (internal emits
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
in engine-computed sections. For an ARCHIVED change — one the archived fallback of `The render
surface is the status gateway` resolved — NO live gate computation runs: the tail is the `---`
rule followed by exactly ONE line, `Archived: <the archived directory, repo-relative, no trailing
slash>`, and no gate line, position readout or eligibility line. An archived change has no live
position, and grading its frozen trail under today's schema would misreport a trail written under
an earlier schema version's rules. The archived line is a COMPUTED value (the resolved directory),
never an invented one; the header, iteration, trend, pass genre and every section above the tail
render from the archived trail exactly as they render from an active one.

#### Scenario: Historical pass renders with the current tail

- **WHEN** `--report <TS>` renders a boundary-conformant pass from last week and the gate state has since changed
- **THEN** the findings body is that pass verbatim while the gate/position/eligibility tail reflects the engine's CURRENT computation

#### Scenario: The trend is trail-computed, as-of the rendered pass

- **WHEN** a change's trail holds review passes of the rendered pass's mode, some later than the rendered pass
- **THEN** the trend line derives from the same-mode passes' severity counts in token order UP TO AND INCLUDING the rendered pass (later passes excluded — as-of semantics, stable for goldens)

#### Scenario: The pass genre is recomputed at render time

- **WHEN** `--report <TS>` renders an in-context emit written before `pass_genre` existed, and a walk of its mode precedes it after the latest accepted independent pass
- **THEN** the header carries `VERIFICATION`, computed from the trail, and no stored field is consulted for it

#### Scenario: An archived change's report carries the archived tail

- **WHEN** `orbit status --change <name> --report` renders a pass of a change that exists only as `orbit/changes/archive/<YYYY-MM-DD>-<name>/`
- **THEN** the report's sections above the tail are those the same pass renders while active, and the tail is the `---` rule followed by `Archived: orbit/changes/archive/<YYYY-MM-DD>-<name>` alone — no `Gate`, `Position:` or `Ready when you are:` line

### Requirement: The render surface is the status gateway

The renderer SHALL surface exclusively as `orbit status --change <name> --report [<TS>]` — the
trail gateway's deepest zoom (bare → `--full` → `--change` → `--report`), never a standalone
verb. The `--change <name>` argument resolves ACTIVE FIRST, as `orbit/changes/<name>/`; on a miss
it falls back to an ARCHIVED change, `orbit/changes/archive/<YYYY-MM-DD>-<name>/`, chosen by the
archive emit's lexically-greatest rule (`orbit-emit-composition`'s `Atomic next_recommended —
pre-computable and post-write classes` owns it). An invalid name is rejected before either lookup,
and a miss in both fails with a clean error naming both locations checked, exit non-zero. The
fallback is `--report`'s alone: every other `orbit status` form resolves active changes only. With no `<TS>`, the NEWEST review pass renders — internal emits and external findings
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

#### Scenario: An archived change resolves through the fallback

- **WHEN** `orbit status --change <name> --report` runs and `orbit/changes/<name>/` is absent while `orbit/changes/archive/2026-01-01-<name>/` and `orbit/changes/archive/2026-02-01-<name>/` exist
- **THEN** the newest renderable pass of `orbit/changes/archive/2026-02-01-<name>/` renders, and an explicit `<TS>` resolves against that directory's trail

#### Scenario: An active change wins over an archived one of the same name

- **WHEN** both `orbit/changes/<name>/` and `orbit/changes/archive/<YYYY-MM-DD>-<name>/` exist
- **THEN** the report renders from the active change, with its live tail

#### Scenario: A miss in both places names both locations

- **WHEN** `orbit status --change <name> --report` runs and neither `orbit/changes/<name>/` nor any `orbit/changes/archive/*-<name>/` exists
- **THEN** the command fails naming both locations it checked; exit non-zero; no partial output
