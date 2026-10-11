## ADDED Requirements

### Requirement: A resolved walk entry records its sweep evidence

The system SHALL record, on every resolution entry whose `outcome` is `resolved`, a `sweep` object with exactly five keys, each an array (any of which may be empty; an empty array is the WRITTEN answer that there is nothing of that kind, never an omission):

| key | element | meaning | checked at the write gate? |
|---|---|---|---|
| `retired` | non-empty string | wording the fix removed, which must no longer appear anywhere the gate looks | yes |
| `introduced` | `{path, text}`, both non-empty strings | text the fix added, which must appear in `path` | yes |
| `searched` | non-empty string | what the walker searched for to find the fix's other sites (a phrase, an identifier, a grep pattern) | no, a record |
| `scope` | non-empty string, a path | files or directories the walker examined beyond the entry's `file` and `ripple_cascade.applied` | each path must resolve; its contents are part of the retired check |
| `kept` | `{path, why}`, both non-empty strings | a file that must keep this entry's `retired` strings: history that quotes the old wording, or a check that asserts its absence | the path is excluded from this entry's retired check |

An entry whose `outcome` is `stale`, `deferred` or `escalated` carries no `sweep`: nothing was edited, so there is nothing to sweep. The walk body composes the record after the ripple cascade, as the entry's last step before marker removal; in batch mode, every entry's record is composed after the one aggregated cascade. `retired` names the wording the fix made FALSE; `searched` names how the walker looked for it, which may be broader. The checks themselves are owned by `orbit-emit-composition`'s `The walk write gate checks sweep evidence`; this requirement owns the shape. A walk log written before this requirement carries no `sweep` and is exempt by absence: no reader re-grades it.

#### Scenario: A resolved entry carries all five keys

- **WHEN** the walk resolves a finding by rewording "seventeen blocks" to "sixteen blocks" in `design.md` and `tasks.md`
- **THEN** the entry carries `sweep: {retired: ["seventeen blocks"], introduced: [{path: "<change>/design.md", text: "sixteen blocks"}, …], searched: ["seventeen", "17 blocks"], scope: ["<change>/proposal.md"], kept: []}`

#### Scenario: Nothing to retire is written, not omitted

- **WHEN** a resolved fix only adds a missing scenario and retires no wording
- **THEN** the entry carries `retired: []` and the added scenario's text under `introduced`

#### Scenario: A stale entry carries no sweep

- **WHEN** pushback finds a finding already fixed and the entry's `outcome` is `stale`
- **THEN** the entry carries no `sweep`

#### Scenario: History that quotes the old wording is kept

- **WHEN** the change's `explore.md` records "we first wrote seventeen blocks" in a Decisions entry
- **THEN** the walker lists `{path: "<change>/explore.md", why: "Decisions history"}` under `kept`, and that file is not searched for this entry's retired strings

### Requirement: A ripple miss is attributed by the walk that finds it

The system SHALL let a resolution entry whose `outcome` is `resolved` name the earlier walk entry whose sweep should have caught the finding, through an optional `ripple_miss_of` object with exactly four keys: `walk` (the earlier walk log's filename token), `title` and `file` (that walk's resolution entry, as written there; the gate compares both sides after one normalization, so a title's surrounding whitespace and a file's `:<line>` suffix never decide a match), and `kind`, one of the CLOSED values:

| `kind` | the site of the later finding was… |
|---|---|
| `scope` | outside that entry's check scope |
| `query` | inside the scope, but matched none of its `retired` or `searched` strings |
| `judgement` | matched by them, and judged unaffected |

The walker attributes at TRIAGE, when it reads the finding against the trail's earlier walks of the same change; a REVIEW-genre pass cannot attribute, because its brief names no prior pass (per `orbit-conventions`' `Review mode decision framework`). Only a `resolved` entry carries it: a stale finding was already fixed, and a deferred or escalated one is not yet a fixed leftover. Attribution is the walker's judgement and the field is optional: an unattributed miss is the named residual, invisible to every check. A VERIFICATION-genre pass keeps its own channel, `regressed` verdicts and `walk_entry` links (per `orbit-emit-composition`'s verification requirement), unchanged. The pointer check and the count are owned by `orbit-emit-composition`'s `A ripple-miss pointer resolves and is counted`.

#### Scenario: A system-review finding is attributed to the proposal walk that missed it

- **WHEN** a fresh system pass finds "'stated at both sources' survives in the generated review body", `src/core/templates/workflows/review.ts`, and the proposal walk's entry for the finding that introduced the ownership move edited only files under the change directory, with `scope: []` and no cascade path outside it, so the body file was outside that entry's check scope
- **THEN** the system walk's resolution carries `ripple_miss_of: {walk: "<proposal walk token>", title: "<that entry's title>", file: "<that entry's file>", kind: "scope"}`

#### Scenario: An unrelated finding carries no attribution

- **WHEN** a finding concerns a defect no earlier walk entry touched
- **THEN** its resolution carries no `ripple_miss_of`

## MODIFIED Requirements

### Requirement: Discover → triage → walk → ripple flag → report lifecycle

The system SHALL execute five lifecycle stages: (1) discover markers (or load from file), (2) triage with user (numbered list, optional scoping) — the triage OPENS with a compact preview of every finding headed for the OBVIOUS-FIX lane (its one-line resolution named) BEFORE any fix lands, so the user can pull any item into the decision lane with a word (the over-classification guard: presentation-ordering, not a prompt); the preview derives from a PROVISIONAL classification (per-finding pushback has not yet run) — walk-time pushback may reclassify a finding, and a reclassified item is announced before its fix lands, (3) walk each marker per-finding (walk-mode default; `--batch` opts INTO legacy batch-mode), (4) ripple cascade (auto-apply ripples to in-scope files by default; `--no-cascade` opts out), (5) report a resolution log.

A `resolved` entry closes its cycle by recording its sweep evidence after the ripple cascade and before marker removal, per `A resolved walk entry records its sweep evidence`; triage reads earlier walks for ripple misses, per `A ripple miss is attributed by the walk that finds it`.

**Walk-mode is the default**: each finding receives its own pushback → classify → resolve → ripple-cascade → remove-marker cycle, where "resolve" follows the finding's lane — obvious-fix findings apply directly; decision-lane findings follow the present → discuss → ratify protocol (per `Disjunctive recommendation fields surface as decision forks`: a full-prose briefing in chat, genuine back-and-forth, ratification by user chat directive or by the optional closure prompt). Batch-mode (all findings resolved together before any ripple) is opt-in via the `--batch` flag or by verbal batch-intent in the user's invocation message (per `Walk-mode by default with --batch opt-in`).

**Cascade is the default**: when a finding resolves, ripple-flagged files are automatically updated unless they fall into one of four lifecycle-invariant OUT categories (audit trail, baseline specs, cross-change directories, safe-exclusions) — see `Ripple cascade by default`. `--no-cascade` reverts to v1 list-only behavior; the resolution log records ripple-flagged files in `flagged_not_applied` regardless of mode.

**Decision-lane protocol** fires within Step 3's walk, after classify, and only when classify == "decision required" (per `Disjunctive recommendation fields surface as decision forks`).

#### Scenario: Triage scoping

- **WHEN** markers are discovered and presented as a numbered list
- **THEN** the user can specify subset scoping (e.g., "just 1-3") and only those markers are walked

#### Scenario: Lane preview before any fix

- **WHEN** the walk begins with findings classified into lanes
- **THEN** the obvious-fix lane's items are listed compactly (finding + its one-line resolution) BEFORE the first fix is applied, and a user word ("discuss the import one") moves that item to the decision lane

#### Scenario: Walk-mode lifecycle order per finding

- **WHEN** the lifecycle runs in walk-mode (default) with multiple findings in scope
- **THEN** each finding completes its full inner cycle (pushback → classify → resolve per lane → ripple-cascade → remove-marker) before the next finding's pushback begins; the user can interrupt between findings, and the resolution log captures partial completion if interrupted

#### Scenario: Batch-mode lifecycle order

- **WHEN** the lifecycle runs in batch-mode (`--batch` flag or verbal trigger)
- **THEN** all findings complete pushback + classify + resolve in one pass before any ripple-cascade fires; ripples are applied once at the end as a single aggregated step; decision-lane findings STILL get their per-finding briefing and ratification (batch never merges decisions into one prompt). The resolution log records `walk_mode: "batch"`.

### Requirement: Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade

The system SHALL extend the `address-reviews-<TS>.json` resolution-log shape with three additions: a top-level `walk_mode` field, a per-resolution optional `recommendation_fork` object, and a per-resolution `ripple_cascade.applied / flagged_not_applied` split.

**Field semantics**:

- **`sweep`** and **`ripple_miss_of`** (per-resolution): shapes owned by `A resolved walk entry records its sweep evidence` and `A ripple miss is attributed by the walk that finds it`; checked at the write gate per `orbit-emit-composition`.

- **`walk_mode`** (top-level, required): `"per_finding"` (walk-mode, the default) or `"batch"`.
- **`walk_mode_source`** (top-level, required when `walk_mode == "batch"`): `"flag"` (via `--batch`), `"verbal"` (via verbal trigger in invocation message), or `"command-shape-interruption"` (via mid-walk command-shaped message). Omitted when `walk_mode == "per_finding"`.
- **`walk_mode_shifted_at_finding`** (top-level, present only when `walk_mode_source == "command-shape-interruption"`): the 1-indexed finding number at which the mode shifted.
- **`delegation_directive`** (top-level, optional): the user's verbatim mid-walk delegation ("handle the rest, only brief me on real decisions"), present when one was issued (per the decision-lane protocol's batch-delegation rule).
- **`reproduction_rerun`** (per-resolution, REQUIRED on every CRITICAL entry, absent below CRITICAL — rc02b): the Step 3a step-(0) result, one of the CLOSED values `reproduced` / `not-reproduced` / `cannot-run` (the marker carried a reproduction and it was re-run) or `unreproduced` (the marker carried none); the output or derivation rides `evidence`. Named in `references/run-summary-schema.md` and derived by the schema-table parity test; a reader that does not know the field ignores it (the `recommendation_options` precedent).
- **`ratified_via`** (per-resolution, required for EVERY decision-lane resolution — forked or not): `"chat"` (a user-typed directive ratified the resolution) or `"prompt"` (the optional closure `AskUserQuestion` did). Absent on non-decision-lane resolutions (stale, trivial fix, unresolvable).
- **`resolution`** (per-resolution, conditionally required): the ratified direction verbatim — required when no fork was detected (the briefing's options were AI-derived prose) OR when the ratified direction is off-menu; optional when `recommendation_fork.chosen` names a presented option (the label suffices).
- **`recommendation_fork`** (per-resolution, optional): present only when a fork was detected and the finding entered the decision lane; carries the DETECTION data (the ratification channel lives at the entry level, above). Object shape:
  - `detected: true` — always true when present
  - `source: "structured" | "heuristic"` — which detection path fired
  - `options_presented: [{label, body}, …]` — structured options as briefed to the user; shape is identical to the producer-side `recommendation_options` field on the input finding, so downstream consumers parse one shape across producer JSON and resolution-log JSON
  - `chosen: "A" | "B" | … | "off-menu"` — the ratified option's label when the resolution matches one of `options_presented`; the literal `"off-menu"` when the ratified direction was outside the presented options (the entry-level `resolution` string then carries it verbatim)
  - `structured_path_skipped_reason: string` — present only when the structured detection path was attempted but skipped due to malformed input (per the `Malformed recommendation_options array falls back to heuristic detection` scenario). Examples: `"only 1 entry in array"`, `"missing label on entry index 2"`, `"empty body on entry index 0"`. Omitted when the structured path either succeeded OR was simply absent (no `recommendation_options` field on the input).
- **`ripple_cascade`** (per-resolution, required): replaces the v1 `ripple_flagged_files_aggregate` array. Object shape:
  - `applied: [path, …]` — files cascade-edited consistent with the primary fix
  - `flagged_not_applied: [{path, reason}, …]` — files identified as ripple-related but NOT edited (either out-of-scope by policy, OR `--no-cascade` suppressed all)

**Backward compatibility — structural change, not just rename**: the v1 `ripple_flagged_files_aggregate` field is a top-level flat array of strings (aggregating ripple-flagged paths across ALL resolutions, with no per-resolution attribution). The v2 `ripple_cascade.applied / flagged_not_applied` fields are per-resolution (each entry in `resolutions[]` carries its own `ripple_cascade` object). The shapes are NOT bijective — v1 archived JSONs cannot be losslessly upconverted to v2 (per-resolution attribution is lost in v1). Reader guidance:

- **Reading v1**: presence of top-level `ripple_flagged_files_aggregate` (and absence of per-resolution `ripple_cascade`) signals v1 format. Treat the aggregate as the union of all per-resolution ripple sets across the run; attribution to specific findings is not available.
- **Reading v2**: presence of per-resolution `ripple_cascade` is the canonical format going forward. The top-level `ripple_flagged_files_aggregate` field is NOT emitted in v2 (removed, not renamed). Pre-D4 v2 logs carry `discuss_invoked` inside `recommendation_fork` and no `ratified_via`; readers MUST tolerate both generations.

#### Scenario: Walk-mode resolution log structure

- **WHEN** address-reviews completes a walk-mode run with 3 findings (all "decision required", no disjunctive recommendations) and 2 ripple-flagged files (both in the IN set; can be any extension)
- **THEN** the emitted JSON contains `walk_mode: "per_finding"` (top-level), 3 entries in `resolutions[]` each WITHOUT a `recommendation_fork` field, and each entry's `ripple_cascade` shows the applicable cascaded paths in `applied` and any policy-skipped paths in `flagged_not_applied`

#### Scenario: Batch-mode resolution log structure

- **WHEN** address-reviews completes a batch-mode run (triggered by `--batch`)
- **THEN** the emitted JSON contains `walk_mode: "batch"` and `walk_mode_source: "flag"`; per-resolution `ripple_cascade` fields are populated only at the end of the batch (each resolution's `applied`/`flagged_not_applied` reflects the final aggregated cascade pass)

#### Scenario: Forked decision records its ratification channel at the entry level

- **WHEN** address-reviews briefs a decision-lane finding with a disjunctive recommendation and the user types "go with A" in chat
- **THEN** the resolution-log entry contains `ratified_via: "chat"` (entry level) and `recommendation_fork: {detected: true, source: "heuristic", options_presented: [{label: "A", body: "..."}, {label: "B", body: "..."}], chosen: "A"}`

#### Scenario: Non-fork decision still records its channel

- **WHEN** a decision-lane finding with a non-disjunctive recommendation is briefed (AI-derived options in prose) and ratified by the closure prompt
- **THEN** the entry carries `ratified_via: "prompt"` and `resolution: "<the ratified direction verbatim>"` with NO `recommendation_fork` object — the channel recording never depends on fork detection

#### Scenario: Off-menu chat ratification recorded

- **WHEN** the discussion produces a direction that is none of the briefed options ("actually, do neither — split the requirement instead") and the user's directive ratifies it
- **THEN** the entry records `ratified_via: "chat"` and `resolution: "<the ratified direction verbatim>"` at the entry level, with `recommendation_fork.chosen: "off-menu"` when a fork had been detected

#### Scenario: --no-cascade resolution log records all ripples as flagged_not_applied

- **WHEN** address-reviews runs with `--no-cascade` and the finding's ripple-flag set includes 3 files (all IN-set files that would normally cascade)
- **THEN** the resolution-log entry contains `ripple_cascade.applied: []` (empty) AND `ripple_cascade.flagged_not_applied: [{path: <path1>, reason: "--no-cascade suppressed"}, …]` (all 3 paths). Note: `--no-cascade` does not classify by IN/OUT — it suppresses cascade entirely; the `--no-cascade suppressed` reason applies uniformly. Per-OUT-category reasons (audit-trail, baseline-spec, etc.) only appear in the default mode when cascade DID try to apply and was structurally blocked.

#### Scenario: Resolution log omits recommendation_fork for findings without forks

- **WHEN** address-reviews walks 5 findings: 1 stale, 2 trivial fix, 1 decision-required-with-fork, 1 decision-required-without-fork
- **THEN** only the 1 fork-triggered finding's resolution entry contains `recommendation_fork`; the other 4 entries omit the field entirely (consumers MUST treat absence as "no fork")

#### Scenario: A CRITICAL entry carries its re-run result

- **WHEN** the walk resolves a CRITICAL virtual marker
- **THEN** its resolution entry carries `reproduction_rerun` with one of the four closed values, and a WARNING or SUGGESTION entry carries no such field
