## MODIFIED Requirements

### Requirement: Discover → triage → walk → ripple flag → report lifecycle

The system SHALL execute five lifecycle stages: (1) discover markers (or load from file), (2) triage with user (numbered list, optional scoping) — the triage OPENS with a compact preview of every finding headed for the OBVIOUS-FIX lane (its one-line resolution named) BEFORE any fix lands, so the user can pull any item into the decision lane with a word (the over-classification guard: presentation-ordering, not a prompt); the preview derives from a PROVISIONAL classification (per-finding pushback has not yet run) — walk-time pushback may reclassify a finding, and a reclassified item is announced before its fix lands, (3) walk each marker per-finding (walk-mode default; `--batch` opts INTO legacy batch-mode), (4) ripple cascade (auto-apply ripples to in-scope files by default; `--no-cascade` opts out), (5) report a resolution log.

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

### Requirement: Classification of each marker

The system SHALL classify each marker as one of: trivial fix, decision required, stale, or unresolvable — the classification IS the lane assignment: trivial fix = the obvious-fix lane (auto-resolved, previewed at triage); decision required = the decision lane (present → discuss → ratify); stale and unresolvable follow their own paths unchanged.

#### Scenario: Classification heuristics

- **WHEN** the AI classifies a marker after pushback
- **THEN** it applies these heuristics in order: (a) **stale** — pushback determined the issue is already resolved at HEAD; (b) **trivial fix** — the resolution is a single-line edit or a few-line localized edit with one obvious correct answer (no design implication, no scope question, no ambiguity in intent); (c) **decision required** — the resolution requires ambiguity resolution, a design choice between defensible alternatives, a scope decision, or has implications beyond the immediate location; (d) **unresolvable** — the resolution needs information not currently available (e.g., depends on a deferred decision, requires a future capability, blocked on external input)

#### Scenario: Trivial fix

- **WHEN** a marker is classified as trivial fix
- **THEN** the command proposes the edit in the triage-time lane preview, applies it, and removes the marker (no `AskUserQuestion`, no discussion — unless the user pulled it into the decision lane at the preview)

#### Scenario: Decision required

- **WHEN** a marker is classified as decision required
- **THEN** the command presents a FULL-PROSE briefing in chat — what the finding means, why it matters, terminology level-set where concepts are novel, the options with real tradeoffs — and engages the discussion; ratification follows per the decision-lane protocol (a user chat directive suffices; the closure prompt is optional); the marker is removed on resolution

#### Scenario: Unresolvable — default file as task

- **WHEN** the marker can't be resolved now and the user has not specified an alternative
- **THEN** the command files a follow-up task in `tasks.md` and removes the marker

#### Scenario: Unresolvable — convert to permanent TODO

- **WHEN** the user chooses to convert an unresolvable marker
- **THEN** the marker text is replaced with `@todo: <content>` and the resolution log notes the conversion

#### Scenario: Unresolvable — escalate

- **WHEN** the user chooses to escalate
- **THEN** the marker is replaced with `@review(escalated): <content with explanation>` and the resolution log notes the escalation

### Requirement: Disjunctive recommendation fields surface as decision forks

When a finding enters the DECISION lane, the system SHALL resolve it through the present → discuss → ratify protocol: (1) PRESENT — a full-prose briefing in chat carrying what the finding means, why it matters, terminology level-setting where concepts are novel, and the concrete options with real tradeoffs; the briefing's option set comes from the detection machinery below; the briefing is the presentation — option content is never confined to prompt labels; (2) DISCUSS — genuine back-and-forth for as many exchanges as the finding needs (zero exchanges is legitimate for crisp cases); (3) RATIFY — a direction the user types in chat IS ratification (user-typed provenance, the consent model's strongest signal); the `AskUserQuestion` is an OPTIONAL CLOSURE DEVICE, fired only AFTER the finding's discussion CONCLUDES without a crisp user directive (never before the briefing, never mid-discussion), carrying the discussed conclusion as its default option. A dismissed or inconclusive prompt RE-PRESENTS the finding — the walk position and briefing context are never lost. The prompt NEVER precedes the briefing, and one prompt NEVER spans multiple findings (batch prompts prohibited; batch DELEGATION — an explicit user directive compressing the decision lane, e.g. "handle the rest, brief me only on real decisions" — remains the user's prerogative and is recorded in the resolution log).

**Detection** (hybrid — structured path preferred, heuristic fallback) supplies the briefing's option set:

1. **Structured path** (orbit-emit pipelines): when `--from-file` ingests an internal review JSON or audit-drift JSON whose finding entries include the optional `recommendation_options: [{label, body}, …]` field (per `orbit-review` and `orbit-audit-drift` finding-emit specs), the parser SHALL use this array directly as the briefing's options.
2. **Heuristic path** (external markdown findings, JSON findings without `recommendation_options`): the parser SHALL scan the finding's `**Description**:` (markdown) or `recommendation` (JSON) field for STRICT disjunctive signals:
   - Numbered alternatives: `(A) … (B)`, `1. … 2.`, `[A] … [B]`
   - "Either … or …" with clause-level branches (each clause is a recognizable recommendation)
   - "Options:" prefix followed by a list or numbered enumeration, including both bold variants (`**Options**:` with the colon outside the bold span, AND `**Options:**` with the colon inside the bold span) — both are accepted equivalently after markdown normalization. Implementers SHOULD normalize the input's markdown emphasis before pattern-matching this trigger so the detector behaves consistently across the two conventions.
3. **NOT** triggers: loose "or" in prose like "fix it now or later", "X or Y could happen", "the issue is A or B and we should address one of them." These prose patterns do NOT trigger fork detection. A non-disjunctive decision-lane finding still gets the full briefing — with the AI surfacing 2–4 concrete options in prose.

**Source recording**: the resolution-log entry's `recommendation_fork.source` field SHALL be `"structured"` when the structured path fired, `"heuristic"` when the heuristic path fired.

**Ratification recording**: each decision-lane resolution SHALL record the ratified resolution AND how it was expressed as PER-RESOLUTION fields — `ratified_via: "chat" | "prompt"` and (when the direction is not one of the briefed options, or no fork was detected) a verbatim `resolution` string — on the resolution-log ENTRY itself (per `Resolution-log JSON shape extensions`), so non-disjunctive decision-lane findings record their channel without a `recommendation_fork` object; the fork object, when present, carries only the DETECTION data (source, options, chosen). The `[discuss]` escape-hatch option is RETIRED (discussion is the medium, not an escape), so `discuss_invoked` is no longer emitted.

**No global opt-out**: there is no flag to suppress the decision-lane protocol; delegation is the user's per-walk lever.

#### Scenario: Numbered-alternative finding briefs with parsed options

- **WHEN** address-reviews walks a finding (classified as "decision required") whose `recommendation` field reads `"Either (A) file a follow-up issue tracking the v2 polish work, or (B) add Group 19 to tasks.md extending this change's scope"`
- **THEN** the heuristic detector recognizes the `(A) … (B)` pattern and the BRIEFING presents both options with tradeoffs in prose; no prompt fires before the briefing

#### Scenario: Structured recommendation_options drive the briefing

- **WHEN** address-reviews ingests an internal review JSON via `--from-file` and one finding's entry includes `recommendation_options: [{label: "A", body: "file a follow-up issue"}, {label: "B", body: "extend scope to tasks.md"}]`
- **THEN** the parser uses `recommendation_options` directly (skipping heuristic scan) as the briefing's option set; the resolution log records `recommendation_fork.source: "structured"`

#### Scenario: Chat directive ratifies without a prompt

- **WHEN** the briefing and discussion conclude and the user types a direction in chat (e.g., "drop the key — option A")
- **THEN** that directive IS the ratification; no `AskUserQuestion` fires; the resolution log records the chosen resolution with `ratified_via: "chat"`

#### Scenario: Closure prompt when the discussion trails off

- **WHEN** a decision-lane discussion ends without a crisp user directive
- **THEN** an `AskUserQuestion` fires carrying the discussed conclusion as its default option (plus the live alternatives); the resolution log records `ratified_via: "prompt"`

#### Scenario: Dismissed prompt re-presents, losing nothing

- **WHEN** the user dismisses a closure prompt (or the discussion remains inconclusive)
- **THEN** the finding RE-PRESENTS — the briefing context and walk position are retained; nothing is auto-resolved and no context is lost

#### Scenario: Loose "or" in prose does NOT trigger fork

- **WHEN** address-reviews walks a finding whose `recommendation` field reads `"This will break if X or Y change; consider tightening the type signature"`
- **THEN** the heuristic detector does NOT trigger (no numbered alternatives, no clause-level "either…or", no "Options:" prefix); the finding still receives its decision-lane briefing with AI-surfaced options in prose

#### Scenario: Non-disjunctive decision-lane finding briefs without a fork record

- **WHEN** address-reviews walks a decision-lane finding whose recommendation is a single concrete action (no disjunctive structure) — or one that falls through to trivial fix if it qualifies
- **THEN** no detection fires; when it stays in the decision lane, the briefing surfaces 2–4 AI-derived options in prose and resolution proceeds per the protocol; the resolution-log entry omits `recommendation_fork` entirely — absence IS the no-fork representation (consumers MUST treat absence as "no fork"; a `detected: false` variant is never emitted)

#### Scenario: Stale classification short-circuits before the decision lane

- **WHEN** a finding's pushback classifies it as "stale" (already fixed at HEAD)
- **THEN** the lifecycle short-circuits to stale-suppression; no briefing, no prompt; the resolution log records the stale suppression without a `recommendation_fork` field

#### Scenario: Trivial fix classification short-circuits before the decision lane

- **WHEN** a finding's pushback + classify yields "trivial fix" (single-line edit, one obvious correct answer)
- **THEN** the lifecycle applies the fix per the obvious-fix lane (previewed at triage); no briefing, no prompt; the resolution log omits `recommendation_fork`

#### Scenario: Unresolvable classification short-circuits before the decision lane

- **WHEN** a finding's pushback + classify yields "unresolvable" (needs information not currently available; will be filed as task / converted to TODO / escalated)
- **THEN** the lifecycle proceeds to the unresolvable-path UX; no briefing-protocol prompt; the resolution log omits `recommendation_fork`

#### Scenario: Batch delegation compresses the lane; batch prompts never fire

- **WHEN** the user issues an explicit mid-walk delegation ("handle the rest, only brief me on real decisions") OR batch-mode is active with decision-lane findings in scope
- **THEN** the AI resolves per the delegation's scope, briefing only what the directive reserves; every prompt that does fire covers exactly ONE finding — a single `AskUserQuestion` spanning multiple findings never fires; the resolution log records the delegation directive

#### Scenario: Malformed `recommendation_options` array falls back to heuristic detection

- **WHEN** the parser ingests a finding whose `recommendation_options` field is present but malformed — zero entries, exactly one entry, or any entry missing the required `label` or `body` keys
- **THEN** the consumer SHALL log a warning to stderr (e.g., `"warning: finding <title> at <file>:<line> has malformed recommendation_options (<reason>); falling back to heuristic detection over the recommendation prose"`) AND proceed via the heuristic-detection path over the finding's `recommendation` string. The malformed array does NOT abort the walk; the consumer treats the structured path as if it were absent and applies heuristic detection. The resolution log records `recommendation_fork.source: "heuristic"` (if detection fires) and includes a `recommendation_fork.structured_path_skipped_reason` field naming why the structured path was skipped (e.g., `"only 1 entry in array"`, `"missing label on entry index 2"`).

### Requirement: Walk-mode by default with --batch opt-in

The system SHALL execute Step 3's lifecycle in walk-mode by default — each finding completes its full inner cycle (pushback → classify → resolve per lane → ripple-cascade → remove-marker) before the next finding begins. Batch-mode (all findings resolved together before any ripple-cascade fires) is opt-in.

**Opt-in triggers** (mutually-exclusive):

1. **`--batch` flag** in the invocation: `/orbit:address-reviews <scope> --batch`. Canonical signal.
2. **Verbal `--batch` in the invocation message only**: if the user's invocation message (the message that triggered the command) contains a clearly batch-intent phrase ("fix them all", "batch them", "go ahead with all", "address all at once", or similar phrases conveying batch-resolution intent), the AI SHALL treat this as a verbal `--batch` and proceed in batch-mode. The verbal phrase MUST be in the invocation message; phrases inside subsequent walk-step responses do NOT shift mode unless they are clearly command-shaped (e.g., a bare "go batch" or "switch to batch" message).
3. **Command-shaped mid-walk interruption**: during a walk, if the user sends a bare message that is unambiguously a mode-switch command ("go batch", "switch to batch", "batch the rest"), the AI SHALL treat this as a verbal `--batch` for the remainder of the walk. Ambiguous mid-walk phrases ("just fix them all" said in passing, "let's keep going") do NOT shift mode.

**Walk-mode UX**: at each per-finding boundary, the AI resolves per the finding's LANE — an obvious-fix finding (previewed at triage) applies its resolution with no prompt and no discussion; a decision-lane finding follows the present → discuss → ratify protocol (per `Disjunctive recommendation fields surface as decision forks`). No mandatory per-finding `AskUserQuestion` exists; the user can interrupt between findings.

**Batch-mode UX**: the AI completes pushback + classify + resolve for all findings, then applies all ripple-cascades together as a final step. Decision-lane findings STILL receive their per-finding briefing and ratification (chat directive or closure prompt) — batch-mode does NOT suppress user decisions; it only suppresses per-finding-completion pacing for obvious-fix and stale findings, and one prompt NEVER spans multiple findings.

**Resolution log capture**: the top-level `walk_mode` field in `address-reviews-<TS>.json` SHALL be set to `"per_finding"` in walk-mode and `"batch"` in batch-mode.

#### Scenario: Default invocation runs in walk-mode

- **WHEN** the user invokes `/orbit:address-reviews <change-name>` (no `--batch` flag, no batch-intent verbal phrase in the invocation message) and three findings are discovered
- **THEN** the lifecycle walks each finding individually: pushback finding 1 → classify → resolve per lane → cascade → remove-marker → pushback finding 2 → … The resolution log records `walk_mode: "per_finding"`.

#### Scenario: --batch flag triggers batch-mode

- **WHEN** the user invokes `/orbit:address-reviews <change-name> --batch`
- **THEN** the lifecycle completes all findings' pushback + classify + resolve without per-finding pacing checkpoints, then applies all ripple-cascades together. The resolution log records `walk_mode: "batch"`.

#### Scenario: Verbal batch-intent in invocation message triggers batch-mode

- **WHEN** the user's invocation message reads `/orbit:address-reviews <change-name> — fix them all` or `/orbit:address-reviews <change-name>` accompanied by a paragraph saying "batch them; I just want everything resolved"
- **THEN** the AI recognizes the verbal batch-intent and proceeds in batch-mode. The resolution log records `walk_mode: "batch"` AND includes a top-level `walk_mode_source` field with value `"verbal"` (vs. `"flag"` when `--batch` was passed; `"command-shape-interruption"` when triggered mid-walk).

#### Scenario: Mid-walk command-shaped interruption shifts to batch

- **WHEN** during a walk, after finding 1 is resolved, the user sends the bare message "go batch" or "switch to batch"
- **THEN** the AI shifts to batch-mode for findings 2, 3, …, N. The resolution log records `walk_mode: "batch"` with `walk_mode_source: "command-shape-interruption"` and an additional field `walk_mode_shifted_at_finding: 2` (the finding number at which the mode-shift occurred).

#### Scenario: Ambiguous mid-walk phrases do NOT shift mode

- **WHEN** during a walk, between finding 2 and finding 3, the user sends a response like "yeah let's just keep going" or "fine, fix them all" in the context of a back-and-forth conversation
- **THEN** the AI does NOT shift to batch-mode; the walk continues. The threshold for command-shape recognition is a bare, unambiguous mode-switch message; conversational continuations are not triggers.

#### Scenario: Batch-mode preserves per-finding decisions

- **WHEN** batch-mode is active AND one of the findings is classified as "decision required"
- **THEN** that finding STILL receives its full-prose briefing and per-finding ratification (chat directive, or a closure prompt covering exactly that one finding) even in batch-mode; only obvious-fix and stale findings short-circuit user interaction in batch-mode

### Requirement: Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade

The system SHALL extend the `address-reviews-<TS>.json` resolution-log shape with three additions: a top-level `walk_mode` field, a per-resolution optional `recommendation_fork` object, and a per-resolution `ripple_cascade.applied / flagged_not_applied` split.

**Field semantics**:

- **`walk_mode`** (top-level, required): `"per_finding"` (walk-mode, the default) or `"batch"`.
- **`walk_mode_source`** (top-level, required when `walk_mode == "batch"`): `"flag"` (via `--batch`), `"verbal"` (via verbal trigger in invocation message), or `"command-shape-interruption"` (via mid-walk command-shaped message). Omitted when `walk_mode == "per_finding"`.
- **`walk_mode_shifted_at_finding`** (top-level, present only when `walk_mode_source == "command-shape-interruption"`): the 1-indexed finding number at which the mode shifted.
- **`delegation_directive`** (top-level, optional): the user's verbatim mid-walk delegation ("handle the rest, only brief me on real decisions"), present when one was issued (per the decision-lane protocol's batch-delegation rule).
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

### Requirement: Ripple cascade by default

The system SHALL automatically apply ripple-affected edits to in-scope files when a finding resolves, unless `--no-cascade` is specified. Ripple-flagged files are always recorded in the resolution log; the difference between default and `--no-cascade` modes is whether the system edits them or merely lists them.

**Cascade scope** (normative — defines which files cascade refuses to edit; everything else ripple-flagged is fair game regardless of file extension):

The cascade IN set is defined by exclusion. The OUT list captures four lifecycle-invariant categories — each entry is OUT for a structural workflow reason, not for a "this might be unsafe" heuristic. Files NOT matching any OUT category are IN, regardless of extension (`.py`, `.swift`, `.c`, `.sh`, `.md`, configs, dotfiles — all eligible if ripple-flagged).

- **OUT — audit trail (all four `.orbit-runs/` locations)**: `orbit/changes/<name>/.orbit-runs/*`, `orbit/.orbit-runs/*`, `orbit/explore/<name>/.orbit-runs/*`, and `orbit/architecture/.orbit-runs/*` (D-arc Stage D2: the architecture trail is the evidence review standing depends on; the explore trail closes the same pre-existing gap). Audit-trail files; editing would corrupt the workflow's own record. NEVER edited by cascade.
- **OUT — baseline specs**: `orbit/specs/<capability>/spec.md`. Baseline mutations flow through the proposal cycle (`/orbit:propose` → delta spec → `/orbit:archive` triggers `sync-specs` to propagate). Cascade refuses direct baseline edits; the appropriate action is to add a delta in the current change's `specs/<capability>/spec.md`.
- **OUT — cross-change directories (active and archived)**: `orbit/changes/<other-name>/*` (other active changes' directories) AND `orbit/changes/archive/*` (any archived change, regardless of date prefix). Change-isolation invariant for active changes; immutable-history invariant for archived changes. Cascade never edits either, even when the current change's ripple-flag set surfaces a path inside one. The corresponding scenario `Cascade respects current-change scope only` documents both cases.
- **OUT — safe-exclusions**: `.git/`, `node_modules/`, `dist/`, `build/`. Universal "never edit anywhere" set.

**Mode invariants**:

- Default mode (cascade on): IN ripples are edited; OUT ripples are recorded in `flagged_not_applied` with a reason naming the OUT category (preserving the v1 ripple-flag audit trail for files cascade refused to touch).
- `--no-cascade` mode: NO ripples are edited regardless of IN/OUT classification; all ripple-flagged files are recorded in `flagged_not_applied` with reason `--no-cascade suppressed`.
- Both modes: cascaded files are recorded in `ripple_cascade.applied`; flagged-not-applied files are recorded in `ripple_cascade.flagged_not_applied`.

**Cascade trusts the ripple-flag analysis**: the cascade step does NOT make independent "should this file be touched?" judgments beyond the four-category OUT check. Its job is to apply the fix to ripple-flagged files in the IN set. The contextual scope judgment ("is this file relevant to my finding?") lives in the earlier ripple-flag step, where the AI derives which files a fix affects. If ripple-flag analysis didn't surface a file, cascade doesn't touch it.

#### Scenario: Cascade applies to in-scope change-dir markdown

- **WHEN** a finding resolves and its ripple-flag set includes `orbit/changes/<name>/design.md` (a change-dir markdown file)
- **THEN** the cascade edits `design.md` consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`

#### Scenario: Cascade applies to non-markdown project files

- **WHEN** a finding resolves and its ripple-flag set includes a non-markdown project file (e.g., `src/handlers.py`, `bin/deploy.sh`, `Dockerfile`, `package.json`, a Swift / Go / C source file, or any dotfile in the project root)
- **THEN** the cascade edits the file consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`. File extension is NOT a discriminator — cascade applies the same pushback + classify + fix lifecycle to any file in the IN set. Pushback discipline + the decision-lane protocol (per `Disjunctive recommendation fields surface as decision forks`) handle ambiguous edits regardless of file type.

#### Scenario: Cascade applies to orbit framework files when developing orbit itself

- **WHEN** the current repo IS the orbit framework's source (i.e., orbit develops itself; the change's content includes orbit's own generated skill/command surface — the tool-specific skills and commands directories — README, etc.) AND a finding's ripple-flag set includes one of these files
- **THEN** the cascade edits the file consistent with the primary fix; the resolution log records the path under `ripple_cascade.applied`. Orbit's framework files have no special status when they ARE the project being developed — they're in scope because they're not in any OUT category. The mutation-via-delta rule applies only to baseline `orbit/specs/<capability>/spec.md`, not to the framework's behavioral surface (skill prompts, command mirrors, prose docs).

#### Scenario: Cascade skips .orbit-runs/ audit trail

- **WHEN** a finding's ripple-flag set includes any path under `orbit/changes/<name>/.orbit-runs/`, `orbit/.orbit-runs/`, `orbit/explore/<name>/.orbit-runs/`, or `orbit/architecture/.orbit-runs/`
- **THEN** the cascade SKIPS that file (it's audit-trail; editing would corrupt the workflow's own record); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `audit-trail file; cascade skipped by policy`

#### Scenario: Cascade skips baseline orbit/specs/ — guides user to add a delta

- **WHEN** a finding's ripple-flag set includes any path under `orbit/specs/<capability>/`
- **THEN** the cascade SKIPS that file (baseline mutations flow through the proposal cycle, not via direct edits during address-reviews); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `baseline spec; add a delta to your current change's specs/<capability>/spec.md to capture this ripple`. The reason text explicitly guides the user to the correct mutation path (delta operation in the change-dir, which sync-specs propagates at archive).

#### Scenario: Cascade skips safe-exclusion paths

- **WHEN** a finding's ripple-flag set includes any path under exactly one of the four safe-exclusion prefixes: `.git/`, `node_modules/`, `dist/`, `build/`
- **THEN** the cascade SKIPS that file (universal "never edit" set); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `safe-exclusion path; never edited`. Such paths typically should not appear in a ripple-flag set at all — if one does, it's likely a ripple-flag-analysis bug worth surfacing in the resolution log so the user can investigate. The safe-exclusion prefix set is EXACT — implementers MUST NOT extend it ad-hoc to other paths during codegen. Expanding the set requires a spec change to amend this list explicitly; the Option D framing depends on the OUT list being closed and predictable.

#### Scenario: --no-cascade flag suppresses all cascade

- **WHEN** the user invokes `/orbit:address-reviews --no-cascade <scope>` or `/orbit:address-reviews <change-name> --no-cascade`
- **THEN** NO cascade edits are made regardless of file type or scope; ALL ripple-flagged files are recorded under `ripple_cascade.flagged_not_applied`. The resolution log's per-resolution audit-trail entries are identical to v1 list-only behavior — the cascade output is preserved as an audit record without acting.

#### Scenario: Cascade respects current-change scope only

- **WHEN** a finding's ripple-flag set includes a path under another active change (e.g., `orbit/changes/<other-name>/proposal.md`) or a path in the archive
- **THEN** the cascade SKIPS that file (cross-change ripples are explicitly out-of-scope); the resolution log records the path under `ripple_cascade.flagged_not_applied` with reason `cross-change ripple; cascade scope is current change only`

#### Scenario: Cascade preserves marker-removal invariant

- **WHEN** a finding resolves with cascade-applied ripples in walk-mode
- **THEN** the `@review:` marker on the original finding is removed at the end of the per-finding cycle (per `Marker removal invariant`); cascaded files do NOT carry new markers (cascade is a fix, not a flagging operation)
