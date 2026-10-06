## MODIFIED Requirements

### Requirement: Address-reviews command available

The system SHALL expose a `/orbit:address-reviews` command that scans for `@review:` markers in the repo (or ingests review findings via `--from-file`) AND walks each through resolution with pushback discipline. When the walk is aimed at an active change, the system SHALL ALSO walk every pass the change's reviewed gates list as unresolved or unwalked, so a walk and the gate cannot disagree about what is left to walk: the set is the gate's own, `unresolvedPasses` with `unwalkedPasses`, read from `orbit status --change <name> --json` per `orbit-engine-gates`' `A reviewed gate lists its outstanding passes`, never computed by a second rule in the body.

**Discovery** (normative) is the fence below, rows tested in order, first match wins.

Markers never suppress trail discovery: a stray marker hiding an outstanding pass is the disagreement this requirement exists to remove. A marker that RESTATES a discovered finding — at that finding's `file`, its text beginning with the finding's title, the form `/orbit:review --mark` writes — is walked AS that finding, in its pass's log, and removed at marker removal; the markers' log omits it, so no finding is walked twice. An audit-drift emit is discovered only while no log names it; once named it is NOT rediscovered, even when that walk left an entry deferred or escalated, because audit-drift is not a gate pass and the body reads no second predicate. The empty-result line lists such emits with their `--from-file` route, so a partially walked audit never reads as clean. A pass whose findings are all SUGGESTION-grade needs no walk for the GATE, which never holds on it, but it is still DISCOVERED while no walk record references it, through `unwalkedPasses`: severity ranks a finding and does not decide whether one is read. A pass with no findings is discovered by neither set. A blocked reviewed gate computes no resolution, and a superseded one gates nothing, so neither contributes passes; a pass of either is reached by `--from-file`. The single-newest-by-`<TS>` recency rule is retired. The body carries the fence below as a CHECKED MIRROR, held byte-equal by a parity test (R-crc-14's mirror corollary: an installed skill cannot open this spec); the fence is the owner's, and the body never edits its copy.

```
DISCOVERY — rows tested in order, first match wins:
1 --from-file <path>, with or without a positional: the file ONLY; no marker grep, no trail discovery, no openPair warning; the positional, if any, resolves only where the log lands.
2 no positional, exactly one active change (per orbit list --json): say "resolved to the single active change <name>; markers outside it are not scanned", then re-enter these rows as a positional naming that change.
3 no positional, zero or several active changes: the whole-repo @review: marker scan; several are named in the header so the user can aim the walk.
4 active change, a reviewed gate neither blocked nor superseded reports openPair: before triage, warn that the pair is half-landed, naming the missing member and the gate's canonical next command, and offer two choices — stop (walk nothing, write no log, so the missing review can run) or walk now. Walking now ends the pair: on an invoked slot the walked half then covers alone; on a blind-pair slot no pair can form on this state. On walk, continue at row 5.
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

#### Scenario: Archived change reads markers and audit-drift only

- **WHEN** the positional resolves to `orbit/changes/archive/<YYYY-MM-DD>-foo/`
- **THEN** markers there and its unwalked audit-drift emits are discovered, and the triage header says its review passes are reached by `--from-file`
