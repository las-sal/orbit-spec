## RENAMED Requirements

- FROM: `### Requirement: Walk-mode by default with --batch opt-in`
- TO: `### Requirement: Every walk runs finding by finding`

## MODIFIED Requirements

### Requirement: Address-reviews command available

The system SHALL expose a `/orbit:address-reviews` command that scans for `@review:` markers in the repo (or ingests review findings via `--from-file`) AND walks each through resolution with pushback discipline. When the walk is aimed at an active change, the system SHALL ALSO walk every pass the change's reviewed gates list as unresolved or unwalked, so a walk and the gate cannot disagree about what is left to walk: the set is the gate's own, `unresolvedPasses` with `unwalkedPasses`, read from `orbit status --change <name> --json` per `orbit-engine-gates`' `A reviewed gate lists its outstanding passes`, never computed by a second rule in the body.

**Discovery** (normative) is the fence below, rows tested in order, first match wins.

Markers never suppress trail discovery: a stray marker hiding an outstanding pass is the disagreement this requirement exists to remove. A marker that RESTATES a discovered finding — at that finding's `file`, its text beginning with the finding's title, the form `/orbit:review --mark` writes — is walked AS that finding, in its pass's log, and removed at marker removal; the markers' log omits it, so no finding is walked twice. An audit-drift emit is discovered only while no log names it; once named it is NOT rediscovered, even when that walk left an entry deferred or escalated, because audit-drift is not a gate pass and the body reads no second predicate. The empty-result line lists such emits with their `--from-file` route, so a partially walked audit never reads as clean. A pass whose findings are all SUGGESTION-grade needs no walk for the GATE, which never holds on it, but it is still DISCOVERED while no walk record references it, through `unwalkedPasses`: severity ranks a finding and does not decide whether one is read. A pass with no findings is discovered by neither set. A blocked reviewed gate computes no resolution, and a superseded one gates nothing, so neither contributes passes; a pass of either is reached by `--from-file`. The single-newest-by-`<TS>` recency rule is retired. The skill carries the fence below as a CHECKED MIRROR in its `references/discovery.md`, which the body reads and follows at its discovery step, held byte-equal by a parity test (R-crc-14's mirror corollary: an installed skill cannot open this spec); the fence is the owner's, and the skill never edits its copy.

```
DISCOVERY — rows tested in order, first match wins:
1 --from-file <path>, with or without a positional: the file ONLY; no marker grep, no trail discovery, no openPair warning; the positional, if any, resolves only where the log lands.
2 no positional, exactly one active change (per orbit list --json): say "resolved to the single active change <name>; markers outside it are not scanned", then re-enter these rows as a positional naming that change.
3 no positional, zero or several active changes: the whole-repo @review: marker scan; several are named in the header so the user can aim the walk.
4 active change, a reviewed gate neither blocked nor superseded reports openPair: before triage, warn that the pair is half-landed, naming the missing member and the gate's canonical next command. When the landed half is listed in that gate's unresolvedPasses or unwalkedPasses, offer two choices — stop (walk nothing, write no log, so the missing review can run) or walk now. Walking now ends the pair: on an invoked slot the walked half then covers alone; on a blind-pair slot no pair can form on this state. On walk, continue at row 5. When the landed half is listed in neither (it carries no finding), no walk can end the pair: say so, name the routes that can — a further review of the landed half's class, which on an invoked slot lands as a single and covers, or a continuation/proceed judgement at the gate's seam — then walk nothing and write no log.
5 active change: the UNION of @review: markers in the change directory, every unresolvedPasses and unwalkedPasses entry of each reviewed gate neither blocked nor superseded (internal review-<mode>-*.json and external external-<mode>-*.md alike), and every audit-drift-*.json in its .orbit-runs/ whose basename no address-reviews-*.json there names in source_path.
6 archived change: markers in the archived directory + its unwalked audit-drift-*.json by the same basename rule; its review passes are reached by --from-file, and the header says so.
7 a positional resolving to no change (a path or pattern): markers in that scope only.
AFTER the matched row: when it discovered nothing, print "No @review: markers and no outstanding passes in scope. Nothing to walk.", then list each audit-drift-*.json in scope that a log already names as "walked before; reach by --from-file <path>", and exit clean.
```

**Positional argument resolution** (normative): a positional argument is treated as a change name if and only if it matches one of these locations, checked in this order: (1) **active**: `orbit/changes/<name>/` (exact directory match); (2) **archived**: `orbit/changes/archive/<YYYY-MM-DD>-<name>/` — enumerate entries in `orbit/changes/archive/` matching the regex `^\d{4}-\d{2}-\d{2}-<name>$`. If multiple archive entries match the same `<name>` suffix (rare; would mean the same change name was archived on different dates), the lexicographically-latest date wins (most-recent archive). If no active match AND no archive match, the positional is treated as a path/pattern scope for the grep, and trail discovery does NOT apply.

**`--from-file` exclusivity** (normative): when `--from-file <path>` is specified, the parser ingests the file's content and that is the ONLY input source. Marker grep does NOT run; trail discovery does NOT run, and neither does the `openPair` warning — an explicit aim is the user's; the positional argument (if present) is used only for emit-path resolution (where the resulting `address-reviews-<TS>.json` is written) and does NOT affect discovery.

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

#### Scenario: An open pair warns before the walk

- **WHEN** the user invokes `/orbit:address-reviews foo` and the `review-system` gate reports `openPair: {missing: "external"}`
- **THEN** before triage the walk names the missing external member and the gate's canonical next command and offers to stop or walk; on stop it walks nothing and writes no log

#### Scenario: Walking past the warning ends the pair

- **WHEN** the gate's `invoked` slot has a launched pair whose fresh half landed, and the user chooses to walk at the warning
- **THEN** the fresh pass is walked and its log written; the gate's row then carries no `openPair`, and the walked pass covers the `invoked` slot as a single

#### Scenario: A clean landed half cannot be walked past

- **WHEN** the gate's `invoked` slot has a launched pair whose fresh half landed carrying no finding, so `openPair: {missing: "external"}` stands and neither list names the fresh pass
- **THEN** the walk warns naming the missing external member, says no walk can end the pair, names a further fresh review and a `continuation`/`proceed` judgement as the routes that can, and writes no log

#### Scenario: A bare invocation meets the openPair warning

- **WHEN** the user invokes `/orbit:address-reviews` with no arguments, `foo` is the single active change, and its `review-system` gate reports `openPair: {missing: "fresh"}`
- **THEN** the header names `foo`, the walk warns naming the missing fresh member, and on stop no log is written

#### Scenario: A --mark marker is walked once

- **WHEN** `/orbit:review foo --as proposal --mark` wrote a marker beginning with a WARNING's title at that WARNING's file, and a change-scoped walk discovers both the marker and the pass
- **THEN** the finding is walked once, in the pass's log; the marker is removed; the markers' log does not carry it

#### Scenario: A suggestion-only pass is discovered

- **WHEN** the just-written proposal pass carries only SUGGESTIONs, no walk record references it, and the change holds no markers
- **THEN** a change-scoped walk discovers the pass through the gate's `unwalkedPasses`, walks it, and writes its log; the walk holds nothing on the gate, though like any walk it raises the following cadence slot's ordering bar (`orbit-engine-gates`' `A reviewed gate lists its outstanding passes`)

#### Scenario: A walked suggestion-only pass is not rediscovered

- **WHEN** a log references that pass, having deferred both of its SUGGESTIONs
- **THEN** a change-scoped walk prints `No @review: markers and no outstanding passes in scope. Nothing to walk.`

#### Scenario: Superseded and blocked gates contribute nothing

- **WHEN** a change is past apply, its superseded `review-proposal` gate holds an unwalked pass, and its `review-system` gate lists none in either set
- **THEN** discovery finds no pass, and the proposal pass is reachable by `--from-file`

#### Scenario: An unwalked audit-drift emit is discovered

- **WHEN** `orbit/changes/foo/.orbit-runs/` holds `audit-drift-<TS>.json` and no `address-reviews-*.json` there names it in `source_path`
- **THEN** a change-scoped walk discovers it and walks it through the `--from-file` ingest path; once a log names it, it is no longer discovered

#### Scenario: Nothing to walk

- **WHEN** the user invokes `/orbit:address-reviews foo`, the change holds no markers, every reviewed gate reports `unresolvedPasses: []` and `unwalkedPasses: []`, and every audit-drift emit is named by a log
- **THEN** the command prints `No @review: markers and no outstanding passes in scope. Nothing to walk.` and exits cleanly

#### Scenario: Explicit `--from-file` overrides discovery

- **WHEN** the user invokes `/orbit:address-reviews <change-name> --from-file <path>`
- **THEN** marker grep, trail discovery and the `openPair` warning do NOT run; the file is the ONLY input source, and the positional is used only for emit-path resolution

#### Scenario: Discovered work walks the standard ingest lifecycle

- **WHEN** discovery yields a pass or an audit-drift emit
- **THEN** it is fed to the parser per the `--from-file ingest of review findings file` requirement's contract (content-sniff routes JSON and external markdown to their parsers; per-finding virtual markers; pushback → classify → fix → ripple-flag → no-op marker-removal)

#### Scenario: A discovered log captures its provenance

- **WHEN** a discovered pass or audit-drift emit is walked and its log is emitted
- **THEN** the log carries `source: "auto-discovered"`, `source_path` (the repo-relative path of that one file), `source_command` (the file's top-level `command` value, or `null` for an external return, which carries none), `source_token` (its filename `<TS>` token) and `latest_apply_token` (the most-recent `apply-*.json` token in the same `.orbit-runs/`, or `null`); no `tie_break_rationale` is written, because nothing is selected by recency

#### Scenario: `--mark` is not a prerequisite

- **WHEN** a user runs `/orbit:review <change-name>` (without `--mark`) and the pass carries a CRITICAL or WARNING, followed by `/orbit:address-reviews <change-name>`
- **THEN** the just-written pass is discovered as outstanding and walked; `--mark` stays a stylistic choice

#### Scenario: The fence is read from the skill's reference

- **WHEN** the address-reviews skill is generated
- **THEN** its body names `references/discovery.md` at the discovery step, and that reference carries the DISCOVERY fence byte-equal to this requirement's

#### Scenario: Archived change reads markers and audit-drift only

- **WHEN** the positional resolves to `orbit/changes/archive/<YYYY-MM-DD>-foo/`
- **THEN** markers there and its unwalked audit-drift emits are discovered, and the triage header says its review passes are reached by `--from-file`

### Requirement: Discover → triage → walk → ripple flag → report lifecycle

The system SHALL execute five lifecycle stages: (1) discover markers (or load from file), (2) triage with user (numbered list, optional scoping) — the triage OPENS with a compact preview of every finding headed for the OBVIOUS-FIX lane (its one-line resolution named) BEFORE any fix lands, so the user can pull any item into the decision lane with a word (the over-classification guard: presentation-ordering, not a prompt); the preview derives from a PROVISIONAL classification (per-finding pushback has not yet run) — walk-time pushback may reclassify a finding, and a reclassified item is announced before its fix lands, (3) walk each marker per-finding (the only walk mode, per `Every walk runs finding by finding`), (4) ripple cascade (auto-apply ripples to in-scope files by default; `--no-cascade` opts out), (5) report a resolution log.

A `resolved` entry closes its cycle by recording its sweep evidence after the ripple cascade and before marker removal, per `A resolved walk entry records its sweep evidence`; triage reads earlier walks for ripple misses, per `A ripple miss is attributed by the walk that finds it`.

**Every walk runs finding by finding**: each finding receives its own pushback → classify → resolve → ripple-cascade → remove-marker cycle, where "resolve" follows the finding's lane — obvious-fix findings apply directly; decision-lane findings follow the present → discuss → ratify protocol (per `Disjunctive recommendation fields surface as decision forks`: a full-prose briefing in chat, genuine back-and-forth, ratification by user chat directive or by the optional closure prompt).

**Cascade is the default**: when a finding resolves, ripple-flagged files are automatically updated unless they fall into one of four lifecycle-invariant OUT categories (audit trail, baseline specs, cross-change directories, safe-exclusions) — see `Ripple cascade by default`. `--no-cascade` reverts to v1 list-only behavior; the resolution log records ripple-flagged files in `flagged_not_applied` regardless of mode.

**Decision-lane protocol** fires within Step 3's walk, after classify, and only when classify == "decision required" (per `Disjunctive recommendation fields surface as decision forks`).

#### Scenario: Triage scoping

- **WHEN** markers are discovered and presented as a numbered list
- **THEN** the user can specify subset scoping (e.g., "just 1-3") and only those markers are walked

#### Scenario: Lane preview before any fix

- **WHEN** the walk begins with findings classified into lanes
- **THEN** the obvious-fix lane's items are listed compactly (finding + its one-line resolution) BEFORE the first fix is applied, and a user word ("discuss the import one") moves that item to the decision lane

#### Scenario: Walk-mode lifecycle order per finding

- **WHEN** the lifecycle runs with multiple findings in scope
- **THEN** each finding completes its full inner cycle (pushback → classify → resolve per lane → ripple-cascade → remove-marker) before the next finding's pushback begins; the user can interrupt between findings, and the resolution log captures partial completion if interrupted

### Requirement: Every walk runs finding by finding

The system SHALL execute Step 3's lifecycle finding by finding — each finding completes its full inner cycle (pushback → classify → resolve per lane → ripple-cascade → remove-marker) before the next finding begins. It is the only walk mode: batch mode — all findings resolved together before one aggregated ripple cascade, entered by a `--batch` flag, a batch-intent phrase in the invocation message or a command-shaped mid-walk switch — is removed (`reduce-orbit-phase2`'s R-rop2-12: none of the 476 walk logs on this repository's trails used it).

**Walk UX**: at each per-finding boundary, the AI resolves per the finding's LANE — an obvious-fix finding (previewed at triage) applies its resolution with no prompt and no discussion; a decision-lane finding follows the present → discuss → ratify protocol (per `Disjunctive recommendation fields surface as decision forks`). No mandatory per-finding `AskUserQuestion` exists; the user can interrupt between findings. A mid-walk DELEGATION ("handle the rest, only brief me on real decisions") compresses the decision lane as that requirement says; it is not a mode, and every prompt that fires still covers exactly one finding.

**A retired trigger walks finding by finding.** `--batch` is a flag, dropped before discovery resolves the positional, so it is never read as part of a scope: `/orbit:address-reviews foo --batch` discovers `foo` exactly as `/orbit:address-reviews foo` does. An invocation carrying `--batch`, or one of the retired verbal forms in its message ("fix them all", "batch them", "go ahead with all", "address all at once", or a phrase of the same intent), is walked finding by finding like any other, and the walk says in one line that batch mode was removed. A bare mid-walk message that was the retired command-shaped switch ("go batch", "switch to batch", "batch the rest") is read as a mid-walk delegation (`Disjunctive recommendation fields surface as decision forks`): the rest of the findings are resolved as it delegates, a decision-lane finding is still briefed and ratified on its own, and the message is recorded verbatim as `delegation_directive`.

**Resolution log capture**: the top-level `walk_mode` field in `address-reviews-<TS>.json` SHALL be `"per_finding"`. A log written while batch mode existed may carry `"batch"`, `walk_mode_source` and `walk_mode_shifted_at_finding`: it stays on the trail and is read as before, since no reader reads those fields, and the emit surface refuses the two retired fields on a new payload as unknown keys. These rules govern what the walk writes: the write gate checks neither `walk_mode`'s value nor a per-resolution `disagreement` object, so a payload composed outside the skill could carry `"batch"` or `disagreement` and be accepted — a named limit, since no reader reads either.

#### Scenario: Default invocation walks finding by finding

- **WHEN** the user invokes `/orbit:address-reviews <change-name>` and three findings are discovered
- **THEN** the lifecycle walks each finding individually: pushback finding 1 → classify → resolve per lane → cascade → remove-marker → pushback finding 2 → … The resolution log records `walk_mode: "per_finding"`.

#### Scenario: A retired batch trigger walks finding by finding

- **WHEN** the user invokes `/orbit:address-reviews <change-name> --batch`, or `/orbit:address-reviews <change-name> — fix them all`
- **THEN** the walk runs finding by finding, says in one line that batch mode was removed, and the resolution log records `walk_mode: "per_finding"` and carries no `walk_mode_source`

#### Scenario: A retired mid-walk switch is a delegation

- **WHEN** during a walk, after finding 1 is resolved, the user sends the bare message "batch the rest"
- **THEN** findings 2 to N are resolved as a delegation of the rest, each decision-lane finding is still briefed and ratified on its own, and the log records `delegation_directive: "batch the rest"` and `walk_mode: "per_finding"`

#### Scenario: A retired field is refused on a new payload

- **WHEN** a walk's payload carries `walk_mode_source` or `walk_mode_shifted_at_finding`
- **THEN** `orbit emit address-reviews` refuses the payload, naming the field as one its table does not carry, and writes nothing

#### Scenario: A log written in batch mode still reads

- **WHEN** a change's trail holds a log written with `walk_mode: "batch"` and `walk_mode_source: "flag"`
- **THEN** the reviewed gate reads that log's resolutions exactly as it reads any walk log's

### Requirement: Disjunctive recommendation fields surface as decision forks

When a finding enters the DECISION lane, the system SHALL resolve it through the present → discuss → ratify protocol: (1) PRESENT — a full-prose briefing in chat carrying what the finding means, why it matters, terminology level-setting where concepts are novel, and the concrete options with real tradeoffs; the briefing's option set comes from the detection machinery below; the briefing is the presentation — option content is never confined to prompt labels; (2) DISCUSS — genuine back-and-forth for as many exchanges as the finding needs (zero exchanges is legitimate for crisp cases); (3) RATIFY — a direction the user types in chat IS ratification (user-typed provenance, the consent model's strongest signal); the `AskUserQuestion` is an OPTIONAL CLOSURE DEVICE, fired only AFTER the finding's discussion CONCLUDES without a crisp user directive (never before the briefing, never mid-discussion), carrying the discussed conclusion as its default option. A dismissed or inconclusive prompt RE-PRESENTS the finding — the walk position and briefing context are never lost. The prompt NEVER precedes the briefing, and one prompt NEVER spans multiple findings (a prompt spanning several findings is prohibited; a mid-walk DELEGATION — an explicit user directive compressing the decision lane, e.g. "handle the rest, brief me only on real decisions" — remains the user's prerogative and is recorded in the resolution log).

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

#### Scenario: A delegation compresses the lane; multi-finding prompts never fire

- **WHEN** the user issues an explicit mid-walk delegation ("handle the rest, only brief me on real decisions") with decision-lane findings left in scope
- **THEN** the AI resolves per the delegation's scope, briefing only what the directive reserves; every prompt that does fire covers exactly ONE finding — a single `AskUserQuestion` spanning multiple findings never fires; the resolution log records the delegation directive

#### Scenario: Malformed `recommendation_options` array falls back to heuristic detection

- **WHEN** the parser ingests a finding whose `recommendation_options` field is present but malformed — zero entries, exactly one entry, or any entry missing the required `label` or `body` keys
- **THEN** the consumer SHALL log a warning to stderr (e.g., `"warning: finding <title> at <file>:<line> has malformed recommendation_options (<reason>); falling back to heuristic detection over the recommendation prose"`) AND proceed via the heuristic-detection path over the finding's `recommendation` string. The malformed array does NOT abort the walk; the consumer treats the structured path as if it were absent and applies heuristic detection. The resolution log records `recommendation_fork.source: "heuristic"` (if detection fires) and includes a `recommendation_fork.structured_path_skipped_reason` field naming why the structured path was skipped (e.g., `"only 1 entry in array"`, `"missing label on entry index 2"`).

### Requirement: Resolution-log JSON shape extensions for walk-mode / decision-forks / cascade

The system SHALL extend the `address-reviews-<TS>.json` resolution-log shape with three additions: a top-level `walk_mode` field, a per-resolution optional `recommendation_fork` object, and a per-resolution `ripple_cascade.applied / flagged_not_applied` split.

**Field semantics**:

- **`sweep`** and **`ripple_miss_of`** (per-resolution): shapes owned by `A resolved walk entry records its sweep evidence` and `A ripple miss is attributed by the walk that finds it`; checked at the write gate per `orbit-emit-composition`.

- **`remedy`** and **`routed_to`** (per-resolution): shapes owned by `A walk entry records its remedy, and a REDESIGN leaves the walk`; recorded, never checked at the write gate. A log written before the blind-pair disagreement test was removed (`reduce-orbit-phase2`'s R-rop2-12) may carry a per-resolution `disagreement` object; readers ignore it, and the walk writes none.

- **`walk_mode`** (top-level, required): `"per_finding"`, the only walk mode (`Every walk runs finding by finding`); a log written while batch mode existed may carry `"batch"`.
- **`walk_mode_source`** and **`walk_mode_shifted_at_finding`** (top-level): RETIRED with batch mode (R-rop2-12). They appear only in logs written before its removal, and the emit surface refuses them on a new payload.
- **`delegation_directive`** (top-level, optional): the user's verbatim mid-walk delegation ("handle the rest, only brief me on real decisions"), present when one was issued (per the decision-lane protocol's delegation rule).
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

### Requirement: A resolved walk entry records its sweep evidence

The system SHALL record, on every resolution entry whose `outcome` is `resolved`, a `sweep` object with exactly five keys, each an array (any of which may be empty; an empty array is the WRITTEN answer that there is nothing of that kind, never an omission):

| key | element | meaning | checked at the write gate? |
|---|---|---|---|
| `retired` | non-empty string | wording the fix removed, which must no longer appear anywhere the gate looks | yes |
| `introduced` | `{path, text}`, both non-empty strings | text the fix added, which must appear in `path` | yes |
| `searched` | non-empty string | what the walker searched for to find the fix's other sites (a phrase, an identifier, a grep pattern) | no, a record |
| `scope` | non-empty string, a path | files or directories the walker examined beyond the entry's `file` and `ripple_cascade.applied` | each path must resolve; its contents are part of the retired check |
| `kept` | `{path, why}`, both non-empty strings | a file that must keep this entry's `retired` strings: history that quotes the old wording, or a check that asserts its absence | the path is excluded from this entry's retired check |

An entry whose `outcome` is `stale`, `deferred` or `escalated` carries no `sweep`: nothing was edited, so there is nothing to sweep. The walk composes the record after the ripple cascade, as the entry's last step before marker removal. `retired` names the wording the fix made FALSE; `searched` names how the walker looked for it, which may be broader. The checks themselves are owned by `orbit-emit-composition`'s `The walk write gate checks sweep evidence`; this requirement owns the shape. A walk log written before this requirement carries no `sweep` and is exempt by absence: no reader re-grades it.

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

### Requirement: One invocation writes one log per discovered source

A walk that discovers more than one source SHALL write ONE resolution log PER SOURCE — one per discovered pass, one per discovered audit-drift emit, and one for the markers when any were found — each carrying its own `source_path` (the markers' log carries the scope, `source: "scope"`). `source_path` stays a single path, so the gate's per-pass record match and the trail reader read the logs unchanged. After ONE shared triage the walk proceeds SOURCE BY SOURCE in that order — pass sources in the engine's token order, oldest first, then the markers — and writes each source's log when that source's findings are walked, before the next source begins.

A pass is REDISCOVERED when discovery lists it although a log already names it — its latest log left an entry `deferred` or `escalated`, names only some of its substantive findings, or is unreadable with a `resolution_summary` that leaves a deferral or escalation or carries no readable counts: each a reason the gate's resolution clause rejects a walked pass (an unreadable log whose counts are clean resolves its pass, per `orbit-engine-gates`' `Reviewed-gate pass condition — the computed convergence criterion`). It is presented at triage with that log's dispositions, where it has any, and a substantive finding that log does not name is walked. Its new log must name every substantive finding of the pass (the gate's per-pass match reads only the latest log), so each finding the earlier log closed is re-checked by pushback against current state: still fixed, it is recorded `stale`, with evidence naming the earlier log's token; reproduced — the fix regressed — it is walked again like any finding, with a fresh `sweep`. The open findings are walked again, except one the earlier log escalated with `remedy: "redesign"` and a `routed_to`: it is re-recorded `escalated` with the same `routed_to` and is not walked, since nothing it waits on has changed until the routed exploration's repair lands. Nothing is copied forward: a copied `resolved` entry would owe a fresh `sweep` the write gate checks against today's files.

Triage runs ONCE across every discovered source and SHALL mark each finding that converges with a finding of another discovered pass (same site, same claim) as found by both. A converged finding is walked in the log of the EARLIER pass; in each later pass's log it takes the earlier entry's disposition — `stale` with evidence naming the earlier log's token when the earlier entry is `resolved` or `stale`, and the same `deferred` or `escalated` disposition (and `routed_to`, when present) when the earlier entry stays open, so a later pass is never closed by a finding that is still open. The cross-pass split (found by both / one pass only / contradictory) is a triage rendering and is never stored as a merged record. Two passes' contradictory findings are each walked like any finding, by pushback against current state.

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

#### Scenario: An interrupted walk resumes by rediscovery

- **WHEN** a walk of two discovered passes is interrupted after the first log is written
- **THEN** the next invocation discovers only the second pass

## REMOVED Requirements

### Requirement: A disagreement between the halves of a pair is settled by one test

**Reason**: Sal's ruling R-rop2-12 (`reduce-orbit-phase2`, G0): the test never fired in the 476 walk logs on this repository's trails (no resolution carries a `disagreement`).

**Migration**: Two passes' contradictory findings are each walked like any finding, by pushback against current state (`One invocation writes one log per discovered source`). A log already carrying `disagreement` keeps it; readers ignore it.
