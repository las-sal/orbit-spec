## MODIFIED Requirements

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
grammar slots — finding `title` and `file`, `recommendation_options[].label`, `verification[].title`/`file`, `findings[].walk_entry.title`/`file`,
`stale_suppressed[].title`/`evidence`, `reviewer_class`, `depth` — REJECT embedded newlines
(CR or LF; fail loud naming the exact slot): record-sourced text must not
be able to forge column-0 report grammar, and the blockquote containment covers only the
multi-line bodies. Optional
fields (`commentary`, `recommendation_options`, `direction`, `verification`, a finding's `walk_entry`, and the computed `pass_genre` / `verified_walks`) are absent-safe, never validation failures
— a PRESENT `direction` is checked as the READ-SIDE TWIN of `orbit-emit-composition`'s `The review
payload carries direction`, which OWNS the shape (this requirement re-lists nothing): a shape the owner
refuses fails the render naming `direction`, while ABSENCE is never a validation failure at any class — on an independent pass it is a MARK, per `Direction renders
as its own section and its absence is marked on independent passes`; a PRESENT `verification` or `walk_entry` is checked the same way as the read-side twin of `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (SHAPE only — the owed-set, completeness and pairing checks are the write gate's and are not repeated at render), its `title` and `file` slots joining the single-line slots above, while ABSENCE is a MARK, per `Verification renders as its own section and its absence is marked`;
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
findings-dependent pointer `orbit-emit-composition`'s `Deterministic facts are engine-composed
per command` composes — or, on a pass WITH findings, the PRIOR GENERATION's self pointer
`/orbit:address-reviews <change> --from-file orbit/changes/<change>/.orbit-runs/<this emit's
file name>`, accepted by VALUE: on a pass with findings the accepted set is closed at those two
values, both computed from the emit itself (its `change` and its file name), and no date and no
field marks the generation, so an emit written before the short form keeps rendering while a
self pointer naming any OTHER path is drift (drift fails naming the field: the orientation
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

- **WHEN** a boundary-conformant emit's `final_assessment` disagrees with the scorecard-derived counts sentence, or its `next_recommended` is neither the findings-dependent pointer nor — on a pass with findings — the prior generation's self pointer naming this emit's own path, or its `change` disagrees with the change being rendered
- **THEN** the render fails with a clean error naming the drifted field (and for `change`, both values); nothing renders

#### Scenario: A prior-generation self pointer renders

- **WHEN** `--report <TS>` resolves to an emit with findings written before the short form, whose `next_recommended` is `/orbit:address-reviews foo --from-file orbit/changes/foo/.orbit-runs/review-proposal-<TS>.json` naming that same file
- **THEN** the render succeeds and its bytes equal a render of the same emit carrying `/orbit:address-reviews foo` — the report prints neither value; the tail's eligibility line is the gate's canonical next, computed at render time

#### Scenario: A self pointer at another file is drift

- **WHEN** an emit with findings carries `/orbit:address-reviews foo --from-file` naming a DIFFERENT pass file, or carries `/orbit:address-reviews foo` while it has no findings
- **THEN** the render fails naming `next_recommended`

#### Scenario: A mis-shaped direction fails the render; an absent one never does

- **WHEN** an internal emit carries `"direction": { "disposition": "ship", "reasoning": "…" }` (or a non-object, or a blank `reasoning`)
- **THEN** the strict normalizer fails with `missing or mistyped field 'direction'` naming the emit path; an emit with NO `direction` renders — marked on an independent pass, section omitted on an in-context one

#### Scenario: A mis-shaped verification fails the render; an absent one never does

- **WHEN** an internal emit carries `"verification": [{"title": "T", "file": "F", "verdict": "fixed"}]`, or a `walk_entry` whose `title` contains a newline
- **THEN** the strict normalizer fails naming `verification[<i>].verdict` (or `findings[<i>].walk_entry.title`) and the emit path; an emit with NO `verification` renders — marked `[no verification record]` when its computed genre is VERIFICATION
