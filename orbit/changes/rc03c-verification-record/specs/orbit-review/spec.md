## ADDED Requirements

### Requirement: Verification-genre passes grade the walk record

The system SHALL run an `in-context` pass whose pass genre is VERIFICATION (per `orbit-conventions`' `Review mode decision framework`, which owns the table) as a verification of the walks, not a re-review of the whole artifact. Concretely, in the review body's VERIFICATION branch, in proposal or system mode: (a) the body learns its genre by the bounded metadata probe `Review-genre passes read the artifacts and the code, never the trail's findings` describes, unchanged — the ENGINE's computation is authoritative, and a write-gate refusal (an owed record missing, a verdict not owed) is the channel that reconciles the two: the body reads the keys the refusal names, grades or drops them, and emits again; (b) it READS the walk records of its mode after the latest accepted independent pass — a VERIFICATION-genre read, outside the review-genre brief rule; (c) it GRADES every owed entry — the `resolved` ones, at every severity, one verdict per key — `landed` or `regressed` by the definition `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` owns, reading each entry's SWEEP SCOPE: its `file` plus its `ripple_cascade.applied` paths (the cascade record `orbit-address-reviews` specifies); (d) it REVIEWS the union of the sweep scopes with the passes the body already runs for its mode, and checks the scope against `git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'` plus the untracked files `git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'` list — `<C>` the commit that first added the latest accepted independent pass's file, found by a hash-only read (`git log --diff-filter=A --format=%h -- <that file> | tail -1`), or `HEAD` when that file is not yet committed; the trail is excluded because walk logs and pass records are bookkeeping, never edits a walk claims, naming each listed file outside the scope as a SUGGESTION — a record gap, not a defect; a defect the pass finds in such a file is its own finding, graded by `orbit-conventions`' Severity ladder by consequence; (e) it composes `verification` and, on each finding about a walk entry, `walk_entry` — a defect in a `resolved` entry's edit names that entry and grades it `regressed`; a finding about a `stale`, `deferred` or `escalated` entry names that entry; a finding about no entry carries no link and is marked by the renderer. The sweep scope is the walk's CLAIM of what it touched, not an observation of the tree: its named limit — Residual kind: an edit the walk record does not list — a resolved entry written without `ripple_cascade` (126 of 986 resolved entries across the archive, 2026-10-04), an edit made outside the walk's log, a cascade path recorded wrongly, or an edit committed in the same commit that first added the latest accepted independent pass's file (that commit is the range's start, so the diff cannot see it). Residual method: at the verification pass, compare the scope against `git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'` plus the untracked files `git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'` list — `<C>` the commit that first added the latest accepted independent pass's file, found by a hash-only read (`git log --diff-filter=A --format=%h -- <that file> | tail -1`), or `HEAD` when that file is not yet committed; the trail is excluded because walk logs and pass records are bookkeeping, never edits a walk claims, and name each listed file outside the scope as a SUGGESTION finding without `walk_entry` — a record gap, marked by the renderer and outside exit (3)'s WARNING-and-above count. A pass that re-reviews the whole artifact anyway is not refused; its unlinked findings carry `[outside the walk record]`, which is how the drift is seen. Architecture mode has no VERIFICATION genre.

#### Scenario: A verification grades each owed entry over its sweep scope

- **WHEN** an in-context system-mode pass computes VERIFICATION over a walk whose `resolved` entry names `src/core/templates/workflows/review.ts` with `ripple_cascade.applied` listing two delta specs, `design.md` and a test
- **THEN** the body reads all five files for that entry, writes one verdict for its key, and reviews the five files in its scoped passes

#### Scenario: A defect in the walk's own addition is a regression with its finding

- **WHEN** the verifying pass finds that an entry's edit introduced a defect
- **THEN** the payload grades that key `regressed` and carries a finding whose `walk_entry` names it, the finding's text stating the cause

#### Scenario: A file touched outside the record is named

- **WHEN** the residual check's listing — the trail excluded — names a file in no owed entry's sweep scope
- **THEN** the body names it as a SUGGESTION finding without `walk_entry`, which the renderer marks `[outside the walk record]`; a walk log or pass record under `.orbit-runs/` is never listed

#### Scenario: An edit co-committed with the pass file is outside the check's reach

- **WHEN** the commit that first added the latest accepted independent pass's file also carries a walk edit no sweep scope lists
- **THEN** the residual check does not list it — a declared limit, named in the Residual kind — and the body does not claim the scope was checked against that commit

#### Scenario: A refusal reconciles the probe with the engine

- **WHEN** the body's metadata probe read REVIEW and the emit surface refuses the payload because the engine computes VERIFICATION with an owed record missing
- **THEN** the body reads the owed keys the refusal names, grades them, and emits again — no second probe and no hand-computed walk set

## MODIFIED Requirements

### Requirement: Internal run summary persisted per mode

The system SHALL persist a JSON run summary after each invocation VIA THE ENGINE EMIT SURFACE (`orbit emit review` per `orbit-emit-composition` — D-arc Stage D5; the body composes ONLY the narrative payload and never hand-writes the JSON, hand-composition being the two-voices seam the surface closes): to `orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json` for `proposal` and `system` modes, and to `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` for `architecture` mode (the architecture trail location per `orbit-architecture-engine`; the emit's `change` field is `null` and a `doc` field names the reviewed doc; per arc ruling R-d-9(b) the architecture-mode emit also carries the structured `handoff` section whose shape is owned by `orbit-architect`). The summary MAY carry an optional `commentary` string — the reviewer's color commentary (the pattern behind the findings, what was probed, risk texture), rendered verbatim into the report's delimited Commentary slot per `orbit-report-rendering`; commentary SHALL NOT state finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections). The summary SHALL carry a `direction: {disposition, reasoning}` object when `reviewer_class` is `fresh` or `external` — the reviewer's FORWARD RECOMMENDATION (its SHAPE owned by `orbit-emit-composition`'s `The review payload carries direction`, its CONTENT contract by `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` — this requirement names both and restates neither) — and MAY carry one when `in-context` (the reacting class's direction is the readiness record's job, per R-crc-11(f)); `orbit emit review` refuses an independent-class payload without it and a mis-shaped one at any class, per `orbit-emit-composition`'s `The review payload carries direction`, which owns the rule and its class predicate. The report renders it in its own `### Direction` section per `orbit-report-rendering`; Step 8 of the body carries the owner's contract as the reviewer-facing authoring instruction. A pass whose computed pass genre is VERIFICATION SHALL carry `verification` — one verdict per owed walk entry — and MAY carry `walk_entry` on each finding; the record's shape, the owed set and the verdicts' meaning are `orbit-emit-composition`'s `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record`, the computed `pass_genre` and `verified_walks` are its `The review emit records its pass genre and the walks it verifies`, the render is `orbit-report-rendering`'s `Verification renders as its own section and its absence is marked`, and the body's grading procedure is `Verification-genre passes grade the walk record` — this requirement names the four and restates none. Architecture-mode emits carry the field under the same rule (keyed on class, never mode), and the mode's interim hand-rendered report prints `Direction: <disposition>` followed by the reasoning under BLOCKQUOTE CONTAINMENT — every reasoning line prefixed `> `, as the change-mode renderer contains it — before its final assessment, so no reasoning line sits at column 0 where it could forge the report's next action. Under persist-first ordering the required universal-spine fields carry DETERMINISTIC FACTS, never verdicts — and the emit surface COMPOSES them (the payload cannot supply them): `final_assessment` is the severity-counts sentence computed from the emit's own scorecard (`"X critical, Y warning, Z suggestion."`; `"No findings."` when clean), and `next_recommended` is the deterministic pointer — the `/orbit:address-reviews <change> --from-file <this emit's own path>` invocation when the pass has findings, the `orbit status --change <change> --report` render pointer when clean (the engine-computed canonical next rides the rendered tail, never the emit). This keeps the orientation surface's `last:` line factual and leaves the gate verdict with the engine alone; the emit stores NO `iteration_note` (the renderer computes it — a stored copy would be the second stale voice this change removes).

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
- **THEN** `final_assessment` reads `0 critical, 1 warning, 3 suggestion.` and `next_recommended` is the `/orbit:address-reviews <change> --from-file <own path>` pointer — no gate verdict, no eligibility judgment; a clean pass instead points `next_recommended` at the `orbit status --change <change> --report` render — both COMPOSED by the emit surface, rejected if supplied in the payload

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
