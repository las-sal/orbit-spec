## MODIFIED Requirements

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

## ADDED Requirements

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
