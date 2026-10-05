# orbit-address-reviews Specification

## Purpose

The `/orbit:address-reviews` command — resolves `@review:` markers anywhere in the repo (or review findings ingested via `--from-file` external markdown / internal JSON, or auto-discovered from a change's `.orbit-runs/`) by walking each through pushback → classify → fix → ripple-cascade → remove-marker. Walk-mode is the default (`--batch` opts in); cascade-by-default auto-applies ripple edits to IN-set files (`--no-cascade` opts out). Pushback is the primary discipline: verify against current state before fixing, suppress stale findings with evidence. Output is a resolution log (NOT a scorecard) with ✓ Resolved / ⚠ Stale / ⏸ Deferred / ✗ Escalated counts. Marker-removal invariant ensures markers don't leak into canonical artifacts.
## Requirements
### Requirement: Address-reviews command available

The system SHALL expose a `/orbit:address-reviews` command that scans for `@review:` markers in the repo (or ingests review findings via `--from-file`) AND walks each through resolution with pushback discipline. When the walk is aimed at an active change, the system SHALL ALSO walk every OUTSTANDING pass the change's reviewed gates report, so a walk and the gate cannot disagree about what is outstanding: the outstanding set is the gate's own, read from `orbit status --change <name> --json` per `orbit-engine-gates`' `A reviewed gate lists its outstanding passes`, never computed by a second rule in the body.

**Discovery** (normative) is the fence below, rows tested in order, first match wins.

Markers never suppress trail discovery: a stray marker hiding an outstanding pass is the disagreement this requirement exists to remove. A marker that RESTATES a discovered finding — at that finding's `file`, its text beginning with the finding's title, the form `/orbit:review --mark` writes — is walked AS that finding, in its pass's log, and removed at marker removal; the markers' log omits it, so no finding is walked twice. An audit-drift emit is discovered only while no log names it; once named it is NOT rediscovered, even when that walk left an entry deferred or escalated, because audit-drift is not a gate pass and the body reads no second predicate. The empty-result line lists such emits with their `--from-file` route, so a partially walked audit never reads as clean. Only a pass carrying a CRITICAL or WARNING is outstanding (a pass whose findings are all SUGGESTION-grade, or none, needs no walk for the gate), so such a pass is never discovered and is reached by `--from-file`, as the review emit's own next line names it. A blocked reviewed gate computes no resolution, and a superseded one gates nothing, so neither contributes passes; a pass of either is reached by `--from-file`. The single-newest-by-`<TS>` recency rule is retired. The body carries the fence below as a CHECKED MIRROR, held byte-equal by a parity test (R-crc-14's mirror corollary: an installed skill cannot open this spec); the fence is the owner's, and the body never edits its copy.

```
DISCOVERY — rows tested in order, first match wins:
1 --from-file <path>, with or without a positional: the file ONLY; no marker grep, no trail discovery, no openPair stop; the positional, if any, resolves only where the log lands.
2 no positional, exactly one active change (per orbit list --json): say "resolved to the single active change <name>; markers outside it are not scanned", then re-enter these rows as a positional naming that change.
3 no positional, zero or several active changes: the whole-repo @review: marker scan; several are named in the header so the user can aim the walk.
4 active change, a reviewed gate neither blocked nor superseded reports openPair: stop before triage; name the missing member and the gate's canonical next command; walk nothing; write no log.
5 active change: the UNION of @review: markers in the change directory, every unresolvedPasses entry of each reviewed gate neither blocked nor superseded (internal review-<mode>-*.json and external external-<mode>-*.md alike), and every audit-drift-*.json in its .orbit-runs/ whose basename no address-reviews-*.json there names in source_path.
6 archived change: markers in the archived directory + its unwalked audit-drift-*.json by the same basename rule; its review passes are reached by --from-file, and the header says so.
7 a positional resolving to no change (a path or pattern): markers in that scope only.
AFTER the matched row: when it discovered nothing, print "No @review: markers and no outstanding passes in scope. Nothing to walk.", then list each audit-drift-*.json in scope that a log already names as "walked before; reach by --from-file <path>", and exit clean.
```

**Positional argument resolution** (normative): a positional argument is treated as a change name if and only if it matches one of these locations, checked in this order: (1) **active**: `orbit/changes/<name>/` (exact directory match); (2) **archived**: `orbit/changes/archive/<YYYY-MM-DD>-<name>/` — enumerate entries in `orbit/changes/archive/` matching the regex `^\d{4}-\d{2}-\d{2}-<name>$`. If multiple archive entries match the same `<name>` suffix (rare; would mean the same change name was archived on different dates), the lexicographically-latest date wins (most-recent archive). If no active match AND no archive match, the positional is treated as a path/pattern scope for the grep, and trail discovery does NOT apply.

**`--from-file` exclusivity** (normative): when `--from-file <path>` is specified, the parser ingests the file's content and that is the ONLY input source. Marker grep does NOT run; trail discovery does NOT run, and neither does the `openPair` stop — an explicit aim is the user's; the positional argument (if present) is used only for emit-path resolution (where the resulting `address-reviews-<TS>.json` is written) and does NOT affect discovery.

How the discovered work is written — one log per pass — is owned by `One invocation writes one log per discovered source`.

#### Scenario: Default scan

- **WHEN** the user invokes `/orbit:address-reviews` with no arguments and zero active changes exist
- **THEN** the command greps the whole repo for `@review:` markers, respecting safe exclusions (`.git`, `node_modules`, `dist`, `build`); no trail is read

#### Scenario: Bare invocation resolves the single active change

- **WHEN** the user invokes `/orbit:address-reviews` with no arguments, exactly one active change `foo` exists, and its `review-system` gate reports two unresolved passes
- **THEN** the triage header names `foo` as the single active change, both passes are discovered and walked, and two resolution logs are written to `orbit/changes/foo/.orbit-runs/`

#### Scenario: Bare invocation with several active changes names them

- **WHEN** the user invokes `/orbit:address-reviews` with no arguments and two active changes exist
- **THEN** the whole-repo marker scan runs and the triage header names both active changes

#### Scenario: Scoped scan — path or pattern

- **WHEN** the user invokes `/orbit:address-reviews <scope>` with a path or pattern (NOT a recognized change name)
- **THEN** the command restricts the marker scan to the specified scope while keeping safe exclusions; no trail is read

#### Scenario: Markers and outstanding passes are walked together

- **WHEN** the user invokes `/orbit:address-reviews foo`, the change directory holds one `@review:` marker, and the `review-proposal` gate reports one unresolved pass
- **THEN** triage lists the marker AND the pass's findings; markers do not suppress the trail

#### Scenario: An external return is discovered

- **WHEN** a change's `review-system` gate reports an unresolved `external-system-<TS>.md`
- **THEN** a change-scoped walk discovers it with no `--from-file`, and its log's `source_path` names that file

#### Scenario: An open blind pair stops the walk

- **WHEN** the user invokes `/orbit:address-reviews foo` and the `review-system` gate reports `openPair: {missing: "external"}`
- **THEN** the walk names the missing external member and the gate's canonical next command, walks nothing, and writes no log

#### Scenario: A bare invocation meets the openPair stop

- **WHEN** the user invokes `/orbit:address-reviews` with no arguments, `foo` is the single active change, and its `review-system` gate reports `openPair: {missing: "fresh"}`
- **THEN** the header names `foo`, the walk stops naming the missing fresh member, and no log is written

#### Scenario: A --mark marker is walked once

- **WHEN** `/orbit:review foo --as proposal --mark` wrote a marker beginning with a WARNING's title at that WARNING's file, and a change-scoped walk discovers both the marker and the pass
- **THEN** the finding is walked once, in the pass's log; the marker is removed; the markers' log does not carry it

#### Scenario: A suggestion-only pass is not discovered

- **WHEN** the just-written proposal pass carries only SUGGESTIONs and the change holds no markers
- **THEN** a change-scoped walk prints `No @review: markers and no outstanding passes in scope. Nothing to walk.`, and the pass is walked by `--from-file`

#### Scenario: Superseded and blocked gates contribute nothing

- **WHEN** a change is past apply, its superseded `review-proposal` gate holds an unwalked pass, and its `review-system` gate reports none
- **THEN** discovery finds no pass, and the proposal pass is reachable by `--from-file`

#### Scenario: An unwalked audit-drift emit is discovered

- **WHEN** `orbit/changes/foo/.orbit-runs/` holds `audit-drift-<TS>.json` and no `address-reviews-*.json` there names it in `source_path`
- **THEN** a change-scoped walk discovers it and walks it through the `--from-file` ingest path; once a log names it, it is no longer discovered

#### Scenario: Nothing to walk

- **WHEN** the user invokes `/orbit:address-reviews foo`, the change holds no markers, every reviewed gate reports `unresolvedPasses: []`, and every audit-drift emit is named by a log
- **THEN** the command prints `No @review: markers and no outstanding passes in scope. Nothing to walk.` and exits cleanly

#### Scenario: Explicit `--from-file` overrides discovery

- **WHEN** the user invokes `/orbit:address-reviews <change-name> --from-file <path>`
- **THEN** marker grep, trail discovery and the `openPair` stop do NOT run; the file is the ONLY input source, and the positional is used only for emit-path resolution

#### Scenario: Discovered work walks the standard ingest lifecycle

- **WHEN** discovery yields a pass or an audit-drift emit
- **THEN** it is fed to the parser per the `--from-file ingest of review findings file` requirement's contract (content-sniff routes JSON and external markdown to their parsers; per-finding virtual markers; pushback → classify → fix → ripple-flag → no-op marker-removal)

#### Scenario: A discovered log captures its provenance

- **WHEN** a discovered pass or audit-drift emit is walked and its log is emitted
- **THEN** the log carries `source: "auto-discovered"`, `source_path` (the repo-relative path of that one file), `source_command` (the file's top-level `command` value, or `null` for an external return, which carries none), `source_token` (its filename `<TS>` token) and `latest_apply_token` (the most-recent `apply-*.json` token in the same `.orbit-runs/`, or `null`); no `tie_break_rationale` is written, because nothing is selected by recency

#### Scenario: `--mark` is not a prerequisite

- **WHEN** a user runs `/orbit:review <change-name>` (without `--mark`) and the pass carries a CRITICAL or WARNING, followed by `/orbit:address-reviews <change-name>`
- **THEN** the just-written pass is discovered as outstanding and walked; `--mark` stays a stylistic choice

#### Scenario: Archived change reads markers and audit-drift only

- **WHEN** the positional resolves to `orbit/changes/archive/<YYYY-MM-DD>-foo/`
- **THEN** markers there and its unwalked audit-drift emits are discovered, and the triage header says its review passes are reached by `--from-file`

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

### Requirement: Marker removal invariant

The system SHALL remove the original `@review:` marker on resolution unless `--keep-resolved-markers` is set.

#### Scenario: Marker removed by default

- **WHEN** a marker has been resolved (trivial fix applied, decision applied, or stale-suppression)
- **THEN** the marker text is deleted from its source file

#### Scenario: `--keep-resolved-markers` debug flag

- **WHEN** the command runs with `--keep-resolved-markers`
- **THEN** markers remain in their source files even after resolution (debug use)

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

### Requirement: Resolution log output

The system SHALL emit a resolution log (not a 3-dimension scorecard) summarizing per-item outcomes.

#### Scenario: Output structure

- **WHEN** the command completes
- **THEN** the output includes a summary table with counts of ✓ Resolved, ⚠ Stale, ⏸ Deferred, ✗ Escalated; followed by per-section listings of each marker's file:line, brief description, action taken, and any related files flagged

#### Scenario: Final assessment

- **WHEN** the resolution log is complete
- **THEN** the final assessment reports remaining markers in scope (0 if clean, plus count of any deliberately persisted escalated markers) and suggests next step (e.g., "re-run /orbit:review --as proposal to confirm clean baseline")

### Requirement: Marker convention across file types

The system SHALL recognize `@review:` markers uniformly across file types: bare in markdown; inside the file type's comment syntax in source code and configs.

#### Scenario: Markdown marker

- **WHEN** a markdown file contains `@review: <text>` (bare)
- **THEN** the marker is discovered and resolution applies

#### Scenario: Source code marker (C-style comment)

- **WHEN** a source file contains `// @review: <text>` or `/* @review: <text> */`
- **THEN** the marker is discovered; resolution can either remove the marker text alone (leaving the comment) or remove the comment entirely if it contained only the marker

#### Scenario: Source code marker (hash comment)

- **WHEN** a source file or config contains `# @review: <text>`
- **THEN** the marker is discovered with the same removal behavior

### Requirement: No new markers without user consent

The system SHALL NOT create new `@review:` markers as part of its own operation.

#### Scenario: address-reviews does not write markers

- **WHEN** address-reviews runs
- **THEN** the only marker creation possible is by `/orbit:review --as proposal --mark` (a different command); address-reviews never writes new markers

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

### Requirement: Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade

The system SHALL extend the `address-reviews-<TS>.json` resolution-log shape with three additions: a top-level `walk_mode` field, a per-resolution optional `recommendation_fork` object, and a per-resolution `ripple_cascade.applied / flagged_not_applied` split.

**Field semantics**:

- **`sweep`** and **`ripple_miss_of`** (per-resolution): shapes owned by `A resolved walk entry records its sweep evidence` and `A ripple miss is attributed by the walk that finds it`; checked at the write gate per `orbit-emit-composition`.

- **`remedy`**, **`routed_to`** and **`disagreement`** (per-resolution): shapes owned by `A walk entry records its remedy, and a REDESIGN leaves the walk` and `A disagreement between the halves of a pair is settled by one test`; recorded, never checked at the write gate.

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

### Requirement: Architecture-scoped resolution logs

The resolution log SHALL land in the architecture trail when the walked findings are
architecture-scoped: when `--from-file` points into `orbit/architecture/.orbit-runs/` (a
`review-architecture-*.json` emit), the resulting `address-reviews-<TS>.json` is written to
`orbit/architecture/.orbit-runs/` (no change positional exists for architecture scope; routing
the log to the project-wide location would split the architecture evidence chain the review
standing depends on — D-arc Stage D2).

#### Scenario: Architecture findings walk emits to the architecture trail

- **WHEN** `/orbit:address-reviews --from-file orbit/architecture/.orbit-runs/review-architecture-<TS>.json` completes its walk
- **THEN** the resolution log lands at `orbit/architecture/.orbit-runs/address-reviews-<TS>.json` with `change: null` and the `doc` carried from the source emit

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

### Requirement: One invocation writes one log per discovered source

A walk that discovers more than one source SHALL write ONE resolution log PER SOURCE — one per discovered pass, one per discovered audit-drift emit, and one for the markers when any were found — each carrying its own `source_path` (the markers' log carries the scope, `source: "scope"`). `source_path` stays a single path, so the gate's per-pass record match and the trail reader read the logs unchanged. After ONE shared triage the walk proceeds SOURCE BY SOURCE in that order — pass sources in the engine's token order, oldest first, then the markers — and, in walk mode, writes each source's log when that source's findings are walked, before the next source begins. In batch mode the invocation resolves every source's findings, runs its ONE aggregated cascade, then writes every source's log, in the same order. An interrupted batch writes no log for any source whose log was not yet written. A mid-walk switch to batch (`Walk-mode by default with --batch opt-in`'s command-shaped interruption) applies to the sources whose logs are not yet written; the logs already written stand.

A pass is REDISCOVERED when discovery lists it although a log already names it — its latest log left an entry `deferred` or `escalated`, names only some of its substantive findings, or is unreadable with a `resolution_summary` that leaves a deferral or escalation or carries no readable counts: each a reason the gate's resolution clause rejects a walked pass (an unreadable log whose counts are clean resolves its pass, per `orbit-engine-gates`' `Reviewed-gate pass condition — the computed convergence criterion`). It is presented at triage with that log's dispositions, where it has any, and a substantive finding that log does not name is walked. Its new log must name every substantive finding of the pass (the gate's per-pass match reads only the latest log), so each finding the earlier log closed is re-checked by pushback against current state: still fixed, it is recorded `stale`, with evidence naming the earlier log's token; reproduced — the fix regressed — it is walked again like any finding, with a fresh `sweep`. The open findings are walked again, except one the earlier log escalated with `remedy: "redesign"` and a `routed_to`: it is re-recorded `escalated` with the same `routed_to` and is not walked, since nothing it waits on has changed until the routed exploration's repair lands. Nothing is copied forward: a copied `resolved` entry would owe a fresh `sweep` the write gate checks against today's files.

Triage runs ONCE across every discovered source and SHALL mark each finding that converges with a finding of another discovered pass (same site, same claim) as found by both. A converged finding is walked in the log of the EARLIER pass; in each later pass's log it takes the earlier entry's disposition — `stale` with evidence naming the earlier log's token when the earlier entry is `resolved` or `stale`, and the same `deferred` or `escalated` disposition (and `routed_to`, when present) when the earlier entry stays open, so a later pass is never closed by a finding that is still open. The cross-pass split (found by both / one pass only / contradictory) is a triage rendering and is never stored as a merged record.

An interrupted walk leaves the logs it completed on the trail; the sources whose logs were not written stay outstanding, and the next invocation discovers them again.

#### Scenario: A blind pair walks in two logs

- **WHEN** discovery yields `review-system-T1.json` (fresh) and `external-system-T2.md` with `T1 < T2`, sharing one converged WARNING
- **THEN** the first log names `review-system-T1.json` and resolves the converged WARNING; the second names `external-system-T2.md` and records it `stale` with evidence naming the first log's token; the gate reads both passes resolved

#### Scenario: A rediscovered pass re-walks only its open entries

- **WHEN** a pass's latest log resolved four findings and escalated one, and a later walk discovers the pass again
- **THEN** triage shows the five prior dispositions, pushback finds the four resolved fixes still standing, only the escalated finding is walked, and the new log records the four `stale` with evidence naming the earlier log

#### Scenario: An incomplete log leaves its pass rediscovered

- **WHEN** a pass carries two WARNINGs and its only log names one of them, resolved
- **THEN** a change-scoped walk discovers the pass again, records the named WARNING `stale` after pushback finds it still fixed, and walks the unnamed one

#### Scenario: A routed redesign is carried, not re-walked

- **WHEN** a pass's latest log escalated a WARNING with `remedy: "redesign"` and `routed_to: "orbit/changes/foo/explore.md"`, and a later walk discovers the pass again
- **THEN** the new log records that WARNING `escalated` with the same `remedy` and `routed_to`, it is not walked, and the report names `/orbit:explore foo` again

#### Scenario: A regressed fix is walked again on rediscovery

- **WHEN** a pass's latest log resolved one WARNING and escalated another, and a later edit undid the resolved WARNING's fix before the pass is rediscovered
- **THEN** pushback reproduces the first WARNING, so it is walked again and resolved with a fresh `sweep` rather than recorded `stale`

#### Scenario: A converged finding left open stays open in the later log

- **WHEN** two passes report the same missing mechanism and the earlier log escalates it as an essential redesign
- **THEN** the later log records it `escalated` with the same `routed_to`, and the later pass stays outstanding

#### Scenario: A batch walk over two sources writes both logs after its cascade

- **WHEN** a `--batch` walk discovers two passes
- **THEN** every finding of both is resolved, the one aggregated cascade runs, and then both logs are written in token order

#### Scenario: An interrupted walk resumes by rediscovery

- **WHEN** a walk of two discovered passes is interrupted after the first log is written
- **THEN** the next invocation discovers only the second pass

### Requirement: A walk entry records its remedy, and a REDESIGN leaves the walk

R-crc-6's three lanes SHALL be recorded per entry as `remedy`, a field separate from the D4 process `lane` (`obvious-fix` | `decision` | `stale`, which says how a finding was CONDUCTED; `remedy` says what its resolution DID). Every `resolved` entry at every severity, and every `escalated` entry routed out, carries it; `stale` and unrouted `deferred` / `escalated` entries carry none. The values, decided by R-crc-6's test — does closing the finding require mechanism nobody has reviewed? — never by its size:

| `remedy` | the resolution | disposition | `routed_to` |
|---|---|---|---|
| `repair` | the artifact said the wrong thing and the right thing is local; fixed in the walk | `resolved` | absent |
| `descope` | the change was doing something it should not; removed (the removal's sweep rides `sweep`, per `A resolved walk entry records its sweep evidence`) | `resolved` | absent |
| `redesign`, separable | the unreviewed mechanism can leave the change: it is removed from the change and routed to a NEW exploration (the removal's sweep rides `sweep`, as a descope's does) | `resolved` | `orbit/explore/<new-name>/` |
| `redesign`, essential | the mechanism cannot be closed by this walk: the finding stays open; on an active change the change returns to exploration, and on any other scope the mechanism goes to a new exploration | `escalated` | `orbit/changes/<name>/explore.md` on an ACTIVE change; on any other scope (an archived change, a project-wide or architecture walk) `orbit/explore/<new-name>/` |

A REDESIGN is never closed in place. The walk NAMES the route — `/orbit:explore <new-name>`, or, on an active change, `/orbit:explore <name>` — and invokes nothing, per `orbit-conventions`' no-chaining contract. Where that command lands is the re-entry table's to decide (`orbit-explore-modifications`' re-entry resolution), including its refusal when a staging directory and an active change share the name; this requirement promises no resume. An essential redesign holds the gate only where the gate reads the entry: on a CRITICAL or WARNING of a reviewed-gate pass, its `escalated` disposition keeps that pass unresolved, and the gate reports that and rules nothing new. An escalated SUGGESTION, and any entry walked from an audit-drift emit or from markers, records the route and holds nothing, because SUGGESTIONs never gate and neither source is a gate pass. While the hold stands, the gate's canonical next stays the walk (`orbit-engine-gates`' `A reviewed gate lists its outstanding passes`), and that walk carries the routed entry forward unwalked, per `One invocation writes one log per discovered source`: the route the walk names is where the work goes, and the eligibility line's walk is bookkeeping. That second voice is a named limit of this requirement, standing until the explored repair lands; the gate does not read `routed_to`.

The write gate does not check `remedy` or `routed_to`: the remedy is a judgement, and the fields are a record.

#### Scenario: A separable redesign is descoped and routed

- **WHEN** a walk finds that closing a CRITICAL needs an unreviewed mechanism that the change can do without
- **THEN** the mechanism is removed from the change, the entry is `resolved` with `remedy: "redesign"` and `routed_to: "orbit/explore/<new-name>/"`, and the walk's report names `/orbit:explore <new-name>` without invoking it

#### Scenario: An essential redesign holds the gate

- **WHEN** a walk finds that closing a CRITICAL needs an unreviewed mechanism the change cannot do without
- **THEN** the entry is `escalated` with `remedy: "redesign"` and `routed_to: "orbit/changes/<name>/explore.md"`, the gate reports the pass unresolved, and the report names `/orbit:explore <name>`

#### Scenario: Repair and descope entries carry their remedy

- **WHEN** a walk resolves one finding by a local edit and another by removing a requirement the change should not carry
- **THEN** the first entry carries `remedy: "repair"` and the second `remedy: "descope"`, each beside its own `lane`

#### Scenario: A redesign outside a gate pass records its route and holds nothing

- **WHEN** a walk of a discovered audit-drift emit escalates a WARNING as an essential redesign on an active change
- **THEN** the entry is `escalated` with `remedy: "redesign"` and its `routed_to`, and the reviewed gate's state and `unresolvedPasses` are unchanged by it

#### Scenario: A stale entry carries no remedy

- **WHEN** pushback finds a finding already fixed at HEAD
- **THEN** its entry is `stale` and carries no `remedy`

### Requirement: A disagreement between the halves of a pair is settled by one test

When two discovered passes of one blind pair make CONTRADICTORY claims about one site — or about two sites whose premises contradict — the walk SHALL settle the contradiction by ONE cheap empirical test (a command run, or a constructed case derived against the current artifact), run AT TRIAGE before either pass's log is written, and SHALL record it on the entry in the LATER pass's log as `disagreement: {with: {pass, title, file}, test, observed}`: `with` names the other pass's token and its finding's title and file, `test` is the test as run, `observed` its output or derivation. Each claim's entry takes its disposition from what was observed, in its OWN pass's log: a claim the test refutes is `stale` with the test's output as its evidence; a claim the test upholds is walked like any finding. When the test cannot be run, `observed` says so and the finding enters the decision lane, so the user decides. A claim pushback finds stale at HEAD is not a disagreement; it is resolved by pushback. A difference in the two passes' forward `direction` is not a disagreement either; it is the readiness record's (`orbit-run-summary-emit`).

The write gate does not check `disagreement`; it is a record.

#### Scenario: A contradiction is settled by one test

- **WHEN** the fresh half claims a parser accepts an input and the external half claims it refuses it
- **THEN** the walk runs the parser on that input once, and the later log's entry carries `disagreement` naming the earlier pass's finding, the command and its output

#### Scenario: The earlier pass's claim is refuted

- **WHEN** the test upholds the later pass's claim and refutes the earlier pass's
- **THEN** the earlier log records the earlier finding `stale` with the test's output as evidence, and the later log's entry carries `disagreement` and is walked

#### Scenario: An untestable contradiction goes to the user

- **WHEN** the two halves contradict each other and no test can be run
- **THEN** `observed` states that, and the finding is briefed and ratified in the decision lane

