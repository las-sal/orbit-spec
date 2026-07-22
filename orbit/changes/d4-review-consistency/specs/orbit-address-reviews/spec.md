## MODIFIED Requirements

### Requirement: Discover → triage → walk → ripple flag → report lifecycle

The system SHALL execute five lifecycle stages: (1) discover markers (or load from file), (2) triage with user (numbered list, optional scoping) — the triage OPENS with a compact preview of every finding headed for the OBVIOUS-FIX lane (its one-line resolution named) BEFORE any fix lands, so the user can pull any item into the decision lane with a word (the over-classification guard: presentation-ordering, not a prompt), (3) walk each marker per-finding (walk-mode default; `--batch` opts INTO legacy batch-mode), (4) ripple cascade (auto-apply ripples to in-scope files by default; `--no-cascade` opts out), (5) report a resolution log.

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

When a finding enters the DECISION lane, the system SHALL resolve it through the present → discuss → ratify protocol: (1) PRESENT — a full-prose briefing in chat carrying what the finding means, why it matters, terminology level-setting where concepts are novel, and the concrete options with real tradeoffs; the briefing's option set comes from the detection machinery below; the briefing is the presentation — option content is never confined to prompt labels; (2) DISCUSS — genuine back-and-forth for as many exchanges as the finding needs (zero exchanges is legitimate for crisp cases); (3) RATIFY — a direction the user types in chat IS ratification (user-typed provenance, the consent model's strongest signal); the `AskUserQuestion` is an OPTIONAL CLOSURE DEVICE, fired only when the discussion trails off without a crisp directive, carrying the discussed conclusion as its default option. A dismissed or inconclusive prompt RE-PRESENTS the finding — the walk position and briefing context are never lost. The prompt NEVER precedes the briefing, and one prompt NEVER spans multiple findings (batch prompts prohibited; batch DELEGATION — an explicit user directive compressing the decision lane, e.g. "handle the rest, brief me only on real decisions" — remains the user's prerogative and is recorded in the resolution log).

**Detection** (hybrid — structured path preferred, heuristic fallback) supplies the briefing's option set:

1. **Structured path** (orbit-emit pipelines): when `--from-file` ingests an internal review JSON or audit-drift JSON whose finding entries include the optional `recommendation_options: [{label, body}, …]` field (per `orbit-review` and `orbit-audit-drift` finding-emit specs), the parser SHALL use this array directly as the briefing's options.
2. **Heuristic path** (external markdown findings, JSON findings without `recommendation_options`): the parser SHALL scan the finding's `**Description**:` (markdown) or `recommendation` (JSON) field for STRICT disjunctive signals:
   - Numbered alternatives: `(A) … (B)`, `1. … 2.`, `[A] … [B]`
   - "Either … or …" with clause-level branches (each clause is a recognizable recommendation)
   - "Options:" prefix followed by a list or numbered enumeration, including both bold variants (`**Options**:` with the colon outside the bold span, AND `**Options:**` with the colon inside the bold span) — both are accepted equivalently after markdown normalization. Implementers SHOULD normalize the input's markdown emphasis before pattern-matching this trigger so the detector behaves consistently across the two conventions.
3. **NOT** triggers: loose "or" in prose like "fix it now or later", "X or Y could happen", "the issue is A or B and we should address one of them." These prose patterns do NOT trigger fork detection. A non-disjunctive decision-lane finding still gets the full briefing — with the AI surfacing 2–4 concrete options in prose.

**Source recording**: the resolution-log entry's `recommendation_fork.source` field SHALL be `"structured"` when the structured path fired, `"heuristic"` when the heuristic path fired.

**Ratification recording**: each decision-lane resolution SHALL record the chosen resolution AND how it was expressed — `recommendation_fork.ratified_via: "chat" | "prompt"` — in its resolution-log entry (per `Resolution-log JSON shape extensions`); the `[discuss]` escape-hatch option is RETIRED (discussion is the medium, not an escape), so `discuss_invoked` is no longer emitted.

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
