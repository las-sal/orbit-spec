## MODIFIED Requirements

### Requirement: `--from-file` ingest of review findings file

The system SHALL accept a `--from-file <path>` flag and parse the file's content into virtual markers for resolution. The parser SHALL auto-detect the file's format via content sniff and support TWO format families: (a) external-review markdown (produced by external AIs per `references/external-findings-format.md`), (b) internal findings JSON (produced by `/orbit:review` or `/orbit:audit-drift`, per `references/internal-findings-format.md`). V1 accepts JSON files whose top-level `command` field is either `"review"` or `"audit-drift"`; other `command` values are rejected with a clean error. Each finding becomes a virtual marker that walks the same lifecycle as inline markers, with marker-removal as a no-op (no source-file marker text exists to remove for either virtual-marker type).

#### Scenario: Parse external findings markdown

- **WHEN** the command runs with `--from-file <path>` and the file's first non-whitespace prefix is `# External Review:` (markdown header) and the body follows the orbit external-review markdown format
- **THEN** the parser extracts each finding (severity, title, file:line, description, and — when present — reproduction) as a virtual marker with `source: "external"` and walks it through the same lifecycle as inline markers, except no source-file marker text exists to remove; entries under a `## Blocks` section are listed FIRST in the triage table as blocks and are never walked as virtual markers

#### Scenario: Parse internal review JSON

- **WHEN** the command runs with `--from-file <path>` and the file's first non-whitespace character is `{` AND the file parses as valid JSON AND the top-level `command` field is `"review"` AND the JSON shape matches the orbit internal-run review summary (per orbit-conventions `Internal-run JSON summary format` + the review-specific extensions documented in the `orbit-review` skill's `references/run-summary-schema.md` (shipped alongside the generated skill))
- **THEN** the parser extracts each entry in the JSON's `findings[]` array as a virtual marker — mapping `severity` directly, `title` directly, `file:line` from `file` + `line` fields, `description` from the entry's `recommendation` field, `reproduction` from the entry's `reproduction` field when present — tags `source: "internal-review"`; the JSON's optional `blocks[]` entries are listed FIRST in the triage table as blocks and never become virtual markers on each, and walks each through the same lifecycle as inline markers, with marker-removal as a no-op

#### Scenario: Parse internal audit-drift JSON

- **WHEN** the command runs with `--from-file <path>` and the file's first non-whitespace character is `{` AND the file parses as valid JSON AND the top-level `command` field is `"audit-drift"` AND the JSON shape matches the orbit audit-drift summary (per orbit-conventions `Internal-run JSON summary format` + the audit-drift-specific extensions documented in the `orbit-audit-drift` skill's `references/run-summary-schema.md` (shipped alongside the generated skill))
- **THEN** the parser extracts each entry in the JSON's `findings[]` array as a virtual marker — mapping `severity` directly, `title` directly, `file:line` from `file` + `line` fields, `description` from the entry's `recommendation` field, with the audit-drift `category` field (`"1"`–`"4"`) used as the provenance/pass-slot detail in the virtual marker — tags `source: "audit-drift"` on each, and walks each through the same lifecycle as inline markers, with marker-removal as a no-op. The audit-drift virtual-marker lifecycle is identical to internal-review except for the `source` tag value and the provenance detail (`category` rather than `pass`); the resolution log and address-reviews emit are otherwise indistinguishable.

#### Scenario: Auto-detect content sniff routes to correct parser

- **WHEN** the command runs with `--from-file <path>` and the file's content needs format routing
- **THEN** the parser inspects only the first non-whitespace token to route: leading `{` routes to JSON parser; leading `# External Review:` routes to markdown parser (the only markdown format orbit produces); anything else triggers the format-mismatch error. The sniff does NOT depend on file extension or pathname.

#### Scenario: Unsupported JSON command field

- **WHEN** `--from-file <path>` resolves to a JSON file whose top-level `command` field is anything other than `"review"` or `"audit-drift"` (e.g., `"address-reviews"`, `"apply"`, `"archive"`, `"propose"`, `"explore"`, `"new"`, `"continue"`, `"ff"`, `"review-external"`)
- **THEN** the parser emits a clean error message naming the supported `command` values (`"review"`, `"audit-drift"`) and the unsupported value detected, and exits without acting on any findings. The message references both supported format reference files so the user can self-diagnose. Notably, `command: "address-reviews"` is rejected to avoid recursive cycles (a walk that produces its own input would loop).

#### Scenario: Internal JSON missing `findings[]` field

- **WHEN** `--from-file <path>` resolves to a JSON file with a supported `command` (`"review"` or `"audit-drift"`) AND valid JSON parse AND no `findings` field at the top level (or `findings` present but not an array)
- **THEN** the parser treats this as a malformed-input parse error — emits a clean error message naming the missing/malformed `findings[]` requirement and references `references/internal-findings-format.md` for the expected shape; exits without acting

#### Scenario: Internal JSON with empty `findings[]`

- **WHEN** `--from-file <path>` resolves to a JSON file with a supported `command` (`"review"` or `"audit-drift"`) AND `findings: []` (empty array — the source command ran cleanly and surfaced no findings)
- **THEN** the parser succeeds with zero virtual markers; the resolution log reports an empty walk (✓ Resolved: 0, ⚠ Stale: 0, ⏸ Deferred: 0, ✗ Escalated: 0) with a one-line note `Source JSON had no findings to walk; resolution log is informational.` and exits cleanly. This is NOT an error — a clean review or clean audit-drift run with `findings: []` is the expected state for an all-clear pass.

#### Scenario: Malformed input — neither format matches

- **WHEN** the `--from-file` path resolves to a file whose first non-whitespace prefix is neither `{` nor `# External Review:`
- **THEN** the command emits a clean error message naming both supported formats (referencing `references/external-findings-format.md` and `references/internal-findings-format.md`) plus the observed leading-content snippet, and exits without acting on partial input

#### Scenario: Malformed input — JSON parse failure

- **WHEN** the `--from-file` path looks like JSON (leading `{`) but fails to parse as valid JSON
- **THEN** the command emits a clean parse-error message naming the file and the JSON parse-error position (best-effort), and exits without acting on partial input. The user fixes the file and re-runs.

#### Scenario: Malformed input — markdown missing required sections

- **WHEN** the `--from-file` path looks like markdown (leading `# External Review:`) but is missing required sections OR has broken field labels OR otherwise can't be parsed cleanly per the external-findings parser contract
- **THEN** the command reports a parse error with format guidance (referencing `references/external-findings-format.md`) and exits without acting on partial input

#### Scenario: Reproduction travels into the virtual marker

- **WHEN** a finding (markdown or JSON) carries a reproduction
- **THEN** the virtual marker carries it in a `reproduction` field and the Step 3a pushback re-runs it first (per `Pushback discipline applied per marker`); a CRITICAL marker without one is tagged `unreproduced` in the triage table and in the resolution log's entry field `reproduction_rerun` (owned by `Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade`, which states its closed values)

### Requirement: Pushback discipline applied per marker

The system SHALL verify each marker against current state before fixing — regardless of whether the marker is inline (grep-found), markdown-virtual (`--from-file` external), or JSON-virtual (`--from-file` internal review or audit-drift JSON).

#### Scenario: Already fixed at HEAD

- **WHEN** the marker's claim references something already fixed in the current state (verified via `grep`, `git log`, or file inspection)
- **THEN** the marker is classified as "stale, suppressed"; current state and evidence (commit hash or grep result) are reported; the marker is removed without further edit

#### Scenario: Still applies

- **WHEN** the marker's claim is still valid against current state
- **THEN** the resolution proceeds to classification

#### Scenario: Pushback decision procedure

- **WHEN** the AI verifies a marker against current state
- **THEN** it follows this procedure in order: (0) for a CRITICAL marker that carries a reproduction, RE-RUN it — execute the command, or re-derive the constructed case against the current artifact — and record the result as the first evidence — the entry's `reproduction_rerun` value (`reproduced` / `not-reproduced` / `cannot-run`) plus the output or derivation in `evidence`; a CRITICAL carrying none is noted `unreproduced` and pushback proceeds on the claim alone, never re-grading it (per `orbit-conventions`' Severity ladder); (1) identify the marker's referenced symbol, name, or concept; (2) `grep -rn` for current presence in expected locations (the file the marker is in, related files, baseline specs); (3) if the symbol is absent where the marker expects it, run `git log -S "<symbol>" --since=<reasonable-window>` (default: since the marker file was last modified) to confirm intentional removal; (4) read the relevant file's current content; (5) compare to the marker's claim and decide: still applies / already fixed / partially applies; (6) on already-fixed, report the commit hash or current-content evidence as part of suppression

#### Scenario: Internal JSON virtual markers receive fresh pushback

- **WHEN** the command ingests an internal review JSON OR audit-drift JSON via `--from-file` and walks its `findings[]` entries as virtual markers
- **THEN** each entry receives fresh pushback against current state — the source command (`/orbit:review` or `/orbit:audit-drift`) that produced the JSON already filtered findings into its own `stale_suppressed[]` array at source-run time, BUT pushback is re-applied at address-reviews time because state may have changed between the source run and the resolve (e.g., user fixed an issue ad-hoc; another commit landed). The lifecycle does NOT skip pushback for any JSON-virtual marker regardless of source `command`.

#### Scenario: A reproduction that no longer reproduces

- **WHEN** step (0) re-runs a CRITICAL's reproduction and the observed result now matches the expected one
- **THEN** the marker is classified stale-with-evidence, the evidence being the re-run's output (command + result, or the case and the derived answer), and no further edit is made

### Requirement: Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade

The system SHALL extend the `address-reviews-<TS>.json` resolution-log shape with three additions: a top-level `walk_mode` field, a per-resolution optional `recommendation_fork` object, and a per-resolution `ripple_cascade.applied / flagged_not_applied` split.

**Field semantics**:

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
