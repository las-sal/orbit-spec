## ADDED Requirements

### Requirement: Bare `orbit status` renders the current sprint

Bare `orbit status` (no `--change`, no `--full`) SHALL render the CURRENT-SPRINT view when at
least one live workstream exists: the sprint strip (per the strip-composition requirement), a
`last` line (the sprint workstream's most recent emit as `command · relative time` plus its
`final_assessment` trimmed to the first sentence, hard cap ~160 characters with ellipsis), a
`next` line (per the recommendation-sourcing requirement), and ONE `also` line naming other
live workstreams (`name (phase)`) and any waiting-on-you items (per the waiting requirement).
The view is a COMPOSITION of engine-computed and trail-recorded data only — it SHALL NOT infer
state from artifact contents (no task-file parsing beyond what the gate graph already computes,
no marker scans, no mtime heuristics). Bare invocation with active changes is, before this
capability, an error path ("Missing required option --change") — claiming it repurposes
nothing; the no-active-changes message and all `--change` behavior are byte-identical to
pre-capability output.

#### Scenario: Bare invocation mid-sprint

- **WHEN** `orbit status` runs with one active change mid-apply and no other live workstreams
- **THEN** the output shows that change's sprint strip, its latest emit as `last`, the engine's `next_command` as `next`, and an `also` line reporting no other active work plus any waiting items — and nothing requires opening an artifact to understand

#### Scenario: Error path claimed, neighbors unchanged

- **WHEN** `orbit status` runs with active changes present (formerly the "Missing required option --change" error) and separately with `--change <name>` and with zero changes
- **THEN** the bare invocation renders the sprint view (exit 0); the `--change` output and the no-active-changes message are unchanged from pre-capability behavior

#### Scenario: No live inference beyond engine and trail

- **WHEN** the orientation surface composes any view
- **THEN** its data sources are limited to: the change-status computation (`position`/`next_command`/gates/task counts), architecture stage-state computation, workstream directory presence, metadata citations, and `.orbit-runs/` emit files — never artifact-content parsing

### Requirement: Continuity predicate and degradation ladder

The current sprint SHALL be the workstream owning the most recent emit (by filename `<TS>`
token) among LIVE workstreams only — active changes under `orbit/changes/` (excluding
`archive/`) and staging explores under `orbit/explore/`. Archived changes, the architecture
trail, and the project-wide trail never anchor the sprint. Degradation ladder: zero live
workstreams → bare renders the `--full` view (nothing in flight IS the orientation); a live
workstream with zero emits (pre-begin-emit staging dir) participates via its directory presence
but cannot anchor recency — if NO live workstream has any emit, the most recently `created`
(metadata date) live workstream anchors, ties broken by name; zero workstreams at all → the
existing no-active-changes message.

#### Scenario: Archive emit does not orient to a closed sprint

- **WHEN** a change was archived minutes ago (its trail moved under `orbit/changes/archive/`) and a staging explore has a begin emit seconds older than the archive emit
- **THEN** bare `orbit status` orients to the staging explore — the archived change's emits are not live-workstream emits

#### Scenario: Nothing in flight falls back to the arc view

- **WHEN** no active changes and no staging explores exist but parseable architecture docs do
- **THEN** bare `orbit status` renders the `--full` view (program band + LAST + WAITING)

#### Scenario: Emit-less live workstream still participates

- **WHEN** the only live workstream is a pre-D3 staging explore with no `.orbit-runs/` at all
- **THEN** it anchors the sprint via metadata `created` (the fallback), its strip shows `explore ▶`, `last` reports no emits yet, and `next` falls back to `/orbit:explore <name> — continue capturing`

### Requirement: Sprint strip composition

The sprint strip SHALL render the lifecycle as one line of phase chips —
`explore → propose → review ⟲ → apply → review ⟲ → archive` — with states from the gate graph
plus an `explore` phase the graph does not model: `explore ✓` when the workstream is a change
containing `explore.md` (a consumed exploration), `explore ▶` when the workstream IS a staging
explore (later phases render pending), and the chip absent when the change has no `explore.md`
(standalone-mode propose). Review phases render as ONE chip each with the iteration count from
the workstream's trail (`review ⟲6 ✓` = six `review-proposal-*.json` emits, gate passed);
apply renders the tracked gate's progress (`apply ▶ 12/20`); phase glyphs are `✓` (passed/
complete), `▶` (current), `⟲N` (review iterations), and unmarked (pending). The strip carries
the workstream name and, when its metadata cites a stage, `stage <id> · <doc>`.

#### Scenario: Strip for a staging explore

- **WHEN** the current sprint is a staging explore with two boundary emits
- **THEN** the strip reads `explore ▶ → propose → review ⟲ → apply → review ⟲ → archive` with only the explore chip active

#### Scenario: Strip mid-apply with review history

- **WHEN** the current sprint is a change whose trail holds six proposal-review emits, whose review-proposal gate is past, and whose apply gate reports 12/20 tasks
- **THEN** the strip reads `explore ✓ → propose ✓ → review ⟲6 ✓ → apply ▶ 12/20 → review ⟲ → archive` (explore chip present because explore.md was consumed into the change)

### Requirement: Next-recommendation sourcing is time-shifted, never live

The `next` line SHALL render, for a CHANGE workstream, the engine-computed `next_command`
(current, engine-vetted); for an EXPLORE workstream, the most recent emit's recorded
`next_recommended` (no gate graph exists over explores; the begin emit guarantees one exists
from scaffold time). All rendering follows the eligibility contract: `ready when you are:`
framing, ` — user-invoked` markers preserved verbatim from the source, never an imperative
label, and never fresh judgment generated by the CLI.

#### Scenario: Change next comes from the engine

- **WHEN** the sprint is a change whose review-system gate just passed
- **THEN** `next` renders the engine's `next_command` (e.g. `/orbit:archive <name> — user-invoked`) — not the older recorded recommendation from the last emit

#### Scenario: Explore next comes from the recorded trail

- **WHEN** the sprint is a staging explore whose last emit recorded `next_recommended: "/orbit:propose <name> — substantial thinking captured..."`
- **THEN** `next` renders that recorded string verbatim

### Requirement: `--full` renders the arc view

`orbit status --full` SHALL render the PROGRAM band (every stage of every parseable
architecture doc: id, computed state with the completion composition, one line each; legacy and
malformed docs listed as the architecture status surface lists them), with live workstreams
nested under their cited stages (citation from workstream metadata; workstreams without a
citation listed under `standalone`), followed by a LAST band (the globally most recent emit
across all four trail locations, including architecture) and a WAITING band (per the waiting
requirement). When zero parseable architecture docs exist, `--full` degrades to the flat fleet
view — all live workstreams unnested, no PROGRAM band. `--full` composes the SAME per-stage and
per-workstream data as the other surfaces — no `--full`-only computation.

#### Scenario: Workstreams nest under cited stages

- **WHEN** `--full` runs with a staging explore citing stage X and an uncited active change
- **THEN** the explore renders under stage X's line and the change renders under `standalone`

#### Scenario: No architecture docs degrades to flat fleet

- **WHEN** `--full` runs in a repo with no parseable architecture docs and two active changes
- **THEN** the output lists both workstreams with their strips and no PROGRAM band — never an error

### Requirement: Waiting-on-you derivation is a closed set

The WAITING items SHALL derive exclusively from three trail/engine conditions: (a) an
architecture stage rendering quiescent-awaiting-ratification; (b) a `review-external-<TS>.json`
with `awaiting_findings: true` and no `external-<as>-*.md` with a later `<TS>` token in the
same trail (a packaged external whose findings never came back); (c) a gate reporting
`unpassed` or `stale` on a live change, rendered with the engine's reason. The set is CLOSED —
adding a waiting class requires a spec change, never an inference tweak. Zero waiting items
renders no WAITING band (bare: the `also` line omits the waiting segment).

#### Scenario: Packaged external awaiting findings surfaces

- **WHEN** a live change's trail holds a T0 `review-external` emit with `awaiting_findings: true` and no later external findings file
- **THEN** WAITING includes `external review packaged — findings not yet returned` for that change

#### Scenario: Awaiting ratification surfaces

- **WHEN** a stage renders quiescent-awaiting-ratification
- **THEN** WAITING includes that stage's line (`<id> completion — yours to ratify`)

### Requirement: JSON output for both tiers

Both tiers SHALL support `--json`: bare emits `{sprint, last, next, also, waiting}` (the sprint
object embeds the same per-change status payload `--change --json` emits, plus the strip's
computed chips); `--full` emits `{program, workstreams, last, waiting}` (the program array
reusing the architecture-status bucket shapes). The JSON carries untruncated `final_assessment`
strings (truncation is a text-render concern only). When the degradation ladder makes bare
render the `--full` view (zero live workstreams), bare `--json` emits the FULL shape — the
fallback switches the whole tier, not just the text render. No stability contract beyond shape
is promised in this capability (deferred; see the change's proposal).

#### Scenario: Bare JSON carries untruncated last

- **WHEN** `orbit status --json` runs and the last emit's `final_assessment` exceeds the text cap
- **THEN** the JSON `last` object carries the full string; only the text render truncates

### Requirement: CLI-only invocation with a cold-start pointer

The orientation surface SHALL be CLI-only — no generated skill or command wraps it (in-session
use is `! orbit status`; prose asks have the AI run the identical command and quote its
output). CLAUDE.md SHALL carry a one-sentence pointer naming the command (the cold-start
contract: a fresh session whose only prior read is CLAUDE.md can find the surface), and no
generated body recommends a slash-command form of it.

#### Scenario: Cold start finds the surface from CLAUDE.md alone

- **WHEN** a fresh session's only prior read is CLAUDE.md
- **THEN** CLAUDE.md names `orbit status` (bare = current sprint; `--full` = arc view) and running it answers position / last / next per workstream with no artifact reads

#### Scenario: No slash surface exists

- **WHEN** the generated surface is inspected after this capability lands
- **THEN** no `orbit-status` skill and no `/orbit:status` command exist; the workflow count is unchanged
