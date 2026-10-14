## MODIFIED Requirements

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
nothing; the PRE-EXISTING `--change` surface is byte-identical to pre-capability output except
the two errors it raises when the named change does not exist and no change does, which name
`/orbit:architect <name>` as where to start (`orbit-architect`'s `Start surfaces name the architect
workflow first`); and the no-active-changes message is `No active changes.`, followed by the idle
next line the recommendation-sourcing requirement defines (later capabilities may EXTEND the `--change` form
with new flags — e.g. `--report`, D-arc Stage D4 — without touching its pre-existing outputs).

#### Scenario: Bare invocation mid-sprint

- **WHEN** `orbit status` runs with one active change mid-apply and no other live workstreams
- **THEN** the output shows that change's sprint strip, its latest emit as `last`, the engine's `next_command` as `next`, and an `also` line reporting no other active work plus any waiting items — and nothing requires opening an artifact to understand

#### Scenario: Error path claimed, neighbors unchanged

- **WHEN** `orbit status` runs with active changes present (formerly the "Missing required option --change" error) and separately with `--change <name>` and with zero changes
- **THEN** the bare invocation renders the sprint view (exit 0); the `--change` output for an existing change is unchanged from pre-capability behavior, and the zero-changes invocation prints `No active changes.` followed by the idle next line

#### Scenario: No live inference beyond engine and trail

- **WHEN** the orientation surface composes any view
- **THEN** its data sources are limited to: the change-status computation (`position`/`next_command`/gates/task counts), architecture stage-state computation, workstream directory presence, metadata citations, and `.orbit-runs/` emit files — orientation itself parses no artifact content; the stage-state source it consumes reads the concluded header of citing staging directories, per `orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`; and the surface is READ-ONLY — it creates and modifies no files

### Requirement: Continuity predicate and degradation ladder

The current sprint SHALL be the workstream owning the most recent emit (by filename `<TS>`
token) among LIVE workstreams only — active changes under `orbit/changes/` (excluding
`archive/`) and staging explores under `orbit/explore/`. Archived changes, the architecture
trail, and the project-wide trail never anchor the sprint. Equal `<TS>` tokens (the token is
second-granular) break deterministically: lexicographic workstream name, then lexicographic
full emit filename — the SAME tie-break applies wherever emit recency is compared (sprint
anchoring and the `--full` LAST band alike). Degradation ladder (rungs in
precedence order, each predicate explicit): (1) ≥1 live workstream → the sprint view; (2) zero
live workstreams AND ≥1 parseable architecture doc → bare renders the `--full` view (nothing in
flight IS the orientation), followed by the idle next line; (3) zero live workstreams AND zero
parseable architecture docs → the no-active-changes message `No active changes.`, followed by the idle next
line. The idle next line is the recommendation-sourcing requirement's; rungs 2 and 3 are the only
rungs that render it. A live workstream with zero emits (pre-begin-emit staging
dir) participates via its directory presence but cannot anchor recency — if NO live workstream
has any emit, the most recently `created` (metadata date) live workstream anchors, ties broken
by name.

#### Scenario: Same-second emits resolve deterministically

- **WHEN** two live workstreams each own a newest emit carrying the identical `<TS>` token
- **THEN** the sprint anchors to the lexicographically-earlier workstream name, and repeated invocations render identically

#### Scenario: Archive emit does not orient to a closed sprint

- **WHEN** a change was archived minutes ago (its trail moved under `orbit/changes/archive/`) and a staging explore has a begin emit seconds older than the archive emit
- **THEN** bare `orbit status` orients to the staging explore — the archived change's emits are not live-workstream emits

#### Scenario: Nothing in flight falls back to the arc view

- **WHEN** no active changes and no staging explores exist but parseable architecture docs do
- **THEN** bare `orbit status` renders the `--full` view (program band + LAST + WAITING) followed by the idle next line

#### Scenario: Emit-less live workstream still participates

- **WHEN** the only live workstream is a pre-D3 staging explore with no `.orbit-runs/` at all
- **THEN** it anchors the sprint via metadata `created` (the fallback), its strip shows `explore ▶`, `last` reports no emits yet, and `next` falls back to `/orbit:explore <name> — continue capturing thinking` (the maturity requirement's Early canonical string)

### Requirement: Next-recommendation sourcing is time-shifted, never live

The `next` line SHALL render, for a CHANGE workstream, the engine-computed `next_command`
(current, engine-vetted); for an EXPLORE workstream, the most recent emit's recorded
`next_recommended` (no gate graph exists over explores; the begin emit guarantees one exists
from scaffold time). All rendering follows the eligibility contract: `Ready when you are:`
framing, ` — user-invoked` markers preserved verbatim from the source, never an imperative
label, and never fresh judgment generated by the CLI — with ONE exception the contract itself
demands: when an EXPLORE workstream's newest spine-valid emit carries `status.token: "concluded"`
(the same trail-sourced token the strip-composition requirement's concluded chip reads), the
recorded `next_recommended` is the Concluded rung's PROSE, which points at nothing, and the `next`
line renders it BARE — verbatim, with no `Ready when you are:` label — because an eligibility label
on a recommendation that names no command would assert an eligibility that does not exist.

With NO live workstream — the degradation ladder's rungs 2 and 3 — the surface SHALL render ONE
idle next line, sourced from the newest emit by the recency rule the `--full` LAST band uses (all
four trail locations plus archived changes' relocated trails, the same tie-break), whether or not
the rung renders that band: when the record's `next_recommended` begins with `/orbit:`, the line is
`Ready when you are: <that string, verbatim>`; when it begins with anything else, or is empty, or
no emit exists at all, the line is `Ready when you are: /orbit:architect <name>`. That constant is
the second exception to "never fresh judgment generated by the CLI": it is the architect-first
start (`orbit-architect`'s `Start surfaces name the architect workflow first`), never a reading of
the record's prose — a prose recommendation rendered under the label would assert an eligibility
that does not exist, for the concluded rule's reason.

#### Scenario: Change next comes from the engine

- **WHEN** the sprint is a change whose review-system gate just passed
- **THEN** `next` renders the engine's `next_command` (e.g. `/orbit:archive <name> — user-invoked`) — not the older recorded recommendation from the last emit

#### Scenario: Explore next comes from the recorded trail

- **WHEN** the sprint is a staging explore whose last emit recorded `next_recommended: "/orbit:propose <name> — substantial thinking captured..."`
- **THEN** `next` renders that recorded string verbatim

#### Scenario: Concluded explore next renders bare

- **WHEN** the sprint is a staging explore whose newest spine-valid emit carries `status.token: "concluded"` and `next_recommended: "Concluded 2026-09-25. Reopens when: a third withdrawn stage."`
- **THEN** the `next` line is exactly that recorded string — no `Ready when you are:` prefix, no model hint — in the text render, while `--json`'s `next` carries the same string as every other entry

#### Scenario: Idle next renders the newest recorded command

- **WHEN** no live workstream exists, a parseable architecture doc exists, and the newest emit is an archive emit whose `next_recommended` is `/orbit:architect refine-documentation-and-architect — change archived; review stage architect-first and take up the program's next stage, or run /orbit:audit-drift for a project-wide drift check.`
- **THEN** bare `orbit status` renders the `--full` view and then `Ready when you are: ` followed by that string verbatim

#### Scenario: Idle next falls back to architect

- **WHEN** no live workstream exists and the newest emit's `next_recommended` is `No markers remain in scope; the project trail records this walk.` — or no emit exists anywhere, as after a fresh `orbit init`
- **THEN** the idle next line is `Ready when you are: /orbit:architect <name>`, on rung 2 after the `--full` view and on rung 3 after `No active changes.`

#### Scenario: Idle next keeps a recorded continuation

- **WHEN** no live workstream and no parseable architecture doc exist, and the newest emit's `next_recommended` is `/orbit:explore next-stage — continue capturing thinking`
- **THEN** bare `orbit status` prints `No active changes.` and then `Ready when you are: /orbit:explore next-stage — continue capturing thinking` — a recorded command is continuing work and renders as recorded; only the fallback constant names architect

### Requirement: JSON output for both tiers

Both tiers SHALL support `--json`, sharing ONE discriminated workstream-entry shape defined
here and reused everywhere a workstream is emitted: a healthy entry is
`{name, kind, stage?, strip, position, last, next, status?}` — the enumerated keys are
CLOSED (nothing spreads into the entry) — where `kind` is `"change"` or
`"explore"`; a CHANGE entry carries a `status` key NESTING the same per-change
status payload `--change --json` emits, unmodified — gate state lives at `status.gates`, the
single source; the entry level carries no separate gates key (its `position` is the engine
position readout); an EXPLORE entry
carries NO `status` (no gate graph or per-change payload exists over explores),
and its
`position` is the literal `"exploring"`, or `"concluded"` when the workstream's newest
spine-valid emit carries `status.token: "concluded"` (per the strip-composition requirement's
concluded chip — the same trail-sourced token, so the chip and the position cannot disagree; the
stage-state vocabulary literal `concluded`); `stage` is present only when
the workstream's metadata carries an architecture citation; a workstream the fault-isolation
policy degrades carries the degraded variant `{name, kind, degraded: true, error}` plus any
tuple fields that remain trustworthy. Absent fields are OMITTED, never null. `strip` is an
ORDERED ARRAY of chip objects `{phase, glyph, detail?}` — `phase` from the strip-composition
requirement's phase list, `glyph` from its closed glyph mapping, `detail` carrying iteration
counts (`⟲6`) or progress (`12/20`) when present; the text strip render is DERIVED from this
array, and JSON never carries a pre-rendered strip string. Bare emits
`{sprint, last, next, also, waiting, pr}` — `sprint` IS one such workstream entry; `--full` emits
`{program, workstreams, last,
waiting, pr}` with `workstreams` an array of such entries (the program array reusing the
architecture-status bucket shapes). `pr` is the RESOLVED PR-lifecycle regime (D-arc Stage D6:
one of `never` / `per-proposal` / `per-architecture`, computed by the engine's `pr:` config
reader per `orbit-pr-lifecycle` — an absent, unrecognized, or malformed config value resolves
to `never` with the reader's own warning, never to an absent key), and it is present on EVERY
bare-tier `--json` shape, including the zero-workstreams / zero-parseable-docs rung whose
`{changes: [], message}` object gains the same key: the workflow bodies read the regime from
this surface rather than parsing `orbit/config.yaml`, and a fresh adopter's FIRST change is
proposed from exactly that rung, so an omitted key there would read as `never` by design. The JSON carries untruncated `final_assessment`
strings (truncation is a text-render concern only). When the degradation ladder makes bare
render the `--full` view (zero live workstreams), bare `--json` emits the FULL shape plus a string
`next` — the fallback switches the whole tier, not just the text render — and the no-changes rung's
JSON is `{changes: [], message, next, pr}`. On both idle rungs `next` carries the idle next line's
recommendation without its `Ready when you are:` label (per the recommendation-sourcing
requirement); `--full` invoked explicitly carries no top-level `next`. No stability contract beyond shape
is promised in this capability (deferred; see the change's proposal).

#### Scenario: Bare JSON carries untruncated last

- **WHEN** `orbit status --json` runs and the last emit's `final_assessment` exceeds the text cap
- **THEN** the JSON `last` object carries the full string; only the text render truncates

#### Scenario: Explore sprint emits the explore variant

- **WHEN** `orbit status --json` runs with a staging explore as the current sprint
- **THEN** `sprint.kind` is `"explore"`, `sprint.position` is `"exploring"`, no `status` key exists, and `last`/`next` come from the explore's trail per the sourcing requirement

#### Scenario: Concluded explore sprint emits the concluded position

- **WHEN** `orbit status --json` runs with a staging explore as the current sprint and its newest spine-valid emit carries `status.token: "concluded"`
- **THEN** `sprint.position` is `"concluded"`, the strip array's explore chip is `{phase: "explore", glyph: "■"}`, no `status` key exists on the entry, and `waiting` gains nothing for it

#### Scenario: Degraded entry emits the degraded variant in both tiers

- **WHEN** a workstream's metadata load fails and `--json` runs (bare with it as sprint, or `--full`)
- **THEN** its entry is `{name, kind, degraded: true, error}` plus only trustworthy fields — never a fabricated full tuple, never null-padded

#### Scenario: Every bare-tier JSON rung carries the resolved PR regime

- **WHEN** `orbit status --json` runs with `pr: per-proposal` configured and NO active workstream and NO parseable architecture doc (the degradation ladder's no-changes rung)
- **THEN** the emitted object is `{changes: [], message, next, pr}` with `pr` equal to `"per-proposal"` — the same key rungs 1 and 2 carry — and `next` equal to the idle next line's recommendation
