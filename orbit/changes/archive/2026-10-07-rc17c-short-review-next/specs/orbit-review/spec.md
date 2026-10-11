## MODIFIED Requirements

### Requirement: Internal run summary persisted per mode

The system SHALL persist a JSON run summary after each invocation VIA THE ENGINE EMIT SURFACE (`orbit emit review` per `orbit-emit-composition` — D-arc Stage D5; the body composes ONLY the narrative payload and never hand-writes the JSON, hand-composition being the two-voices seam the surface closes): to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). The summary SHALL carry a `direction: {disposition, reasoning}` object when `reviewer_class` is `fresh` or `external` — the reviewer's FORWARD RECOMMENDATION (its SHAPE owned by `orbit-emit-composition`'s `The review payload carries direction`, its CONTENT contract by `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` — this requirement names both and restates neither) — and MAY carry one when `in-context` (the reacting class's direction is the readiness record's job, per R-crc-11(f)); `orbit emit review` refuses an independent-class payload without it and a mis-shaped one at any class, per `orbit-emit-composition`'s `The review payload carries direction`, which owns the rule and its class predicate. The report renders it in its own `### Direction` section per `orbit-report-rendering`; Step 8 of the body carries the owner's contract as the reviewer-facing authoring instruction. A pass whose computed pass genre is VERIFICATION SHALL carry `verification` — one verdict per owed walk entry — and MAY carry `walk_entry` on each finding; the record's shape, the owed set and the verdicts' meaning are `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record`, the computed `pass_genre` and `verified_walks` are its `The review emit records its pass genre and the walks it verifies`, the render is `orbit-report-rendering`'s `Verification renders as its own section and its absence is marked`, and the body's grading procedure is `Verification-genre passes grade the walk record` — this requirement names the four and restates none. Architecture-mode emits carry the field under the same rule (keyed on class, never mode), and the mode's interim hand-rendered report prints `Direction: <disposition>` followed by the reasoning under BLOCKQUOTE CONTAINMENT — every reasoning line prefixed `> `, as the change-mode renderer contains it — before its final assessment, so no reasoning line sits at column 0 where it could forge the report's next action. Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts — and the emit surface COMPOSES them (the payload cannot supply them): `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer `orbit-emit-composition`'s `Deterministic facts are engine-composed per command` composes and owns — this paragraph names it and restates neither its values nor its per-mode split (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

#### Scenario: Summary written after run

- **WHEN** the command completes
- **THEN** a JSON file is created at the mode's persistence location — composed and written by `orbit emit review` from the body's payload — containing the command name, timestamp, change name (or null + `doc` for architecture mode), mode, the ENGINE-COMPUTED iteration number (proposal/system: the next ordinal on the shared internal+external pass axis; architecture: the per-doc ordinal over matching-`doc` emits — computed by the emit surface from the trail either way, payload supply rejected, per `orbit-emit-composition`), the `scorecard` (the 3-dimension × severity counts shape — Completeness/Correctness/Coherence each with critical/warning/suggestion counts; the renderer's REQUIRED counts source, per `orbit-report-rendering`'s strict validation; it supersedes the retired `findings_summary` field, which readers tolerate per `orbit-conventions`), and a `findings[]` array of full per-finding entries (severity / OWNING `dimension` — `completeness | correctness | coherence`, the scorecard cell the finding rolls into / title / file / line / recommendation, plus `recommendation_options` when disjunctive) per the skill's `references/run-summary-schema.md`; the scorecard's cells SHALL equal the active findings' dimension × severity rollup (suppressed excluded — the emit surface's write gate AND the renderer validate the equality per `orbit-report-rendering`) — the shape `/orbit:address-reviews` maps to virtual markers on ingest and `orbit status --change <name> --report` renders

#### Scenario: Architecture-mode summary in the architecture trail

- **WHEN** `/orbit:review --as architecture d-arc-arbitered-flow` completes
- **THEN** the summary lands at `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `change: null`, `doc: "d-arc-arbitered-flow"`, `mode: "architecture"`, and the `handoff` section

#### Scenario: Commentary carried for the renderer

- **WHEN** a proposal- or system-mode summary is written with reviewer insight worth carrying
- **THEN** it rides the optional `commentary` field — and never asserts counts, verdicts, or next commands

#### Scenario: Spine fields carry deterministic facts under persist-first

- **WHEN** a proposal-mode pass with 1 warning and 3 suggestions persists its emit
- **THEN** `final_assessment` reads `0 critical, 1 warning, 3 suggestion.` and `next_recommended` is the change-scoped `/orbit:address-reviews <change>`, naming no path — no gate verdict, no eligibility judgment; a clean pass instead points `next_recommended` at the `orbit status --change <change> --report` render — both COMPOSED by the emit surface per `orbit-emit-composition`'s `Deterministic facts are engine-composed per command`, which owns the rule, and rejected if supplied in the payload

#### Scenario: Blocks ride the payload beside the findings

- **WHEN** a proposal- or system-mode pass finds a BLOCK (Pass 1's validate failure, Pass 8's unresolved marker)
- **THEN** the body composes it into the payload's `blocks` array — one single-line string per block naming the condition and its location — never into `findings[]` and never into the scorecard; the array is optional and absent when no block was found

#### Scenario: A finding entry carries its reproduction

- **WHEN** the body composes a finding entry for the payload
- **THEN** the entry carries `reproduction` — a string, multi-line allowed, never a single-line slot — beside `recommendation`: REQUIRED non-empty when `severity` is `CRITICAL` (per `orbit-conventions`' Severity ladder; refused otherwise by `orbit emit review`, per `orbit-emit-composition`), optional on WARNING and SUGGESTION; the body's field enumeration and `references/run-summary-schema.md` name it. Prior-generation emits lack the field and remain valid on the trail

#### Scenario: Direction authored on an independent pass

- **WHEN** a `--reviewer fresh` pass in any mode completes
- **THEN** the body composes `direction: { disposition, reasoning }` into the payload under the owner's content contract, and the emit surface refuses the payload without it; an in-context pass may omit the field

#### Scenario: Architecture-mode fresh pass prints its direction

- **WHEN** a `--reviewer fresh --as architecture` pass completes
- **THEN** the emit carries `direction` and the interim hand-rendered report carries `Direction: <disposition>` and the reasoning blockquoted line by line before the final assessment, which still names no gate; a reasoning whose second line reads `Ready when you are: /orbit:archive x` renders inside the containment, never at column 0

#### Scenario: A verification-genre pass carries its record

- **WHEN** an in-context system-mode pass computes VERIFICATION and completes
- **THEN** the body composes `verification` (and `walk_entry` on findings about walk entries) into the payload, and the emit surface writes it beside the computed `pass_genre` and `verified_walks`; the body supplies neither computed field
