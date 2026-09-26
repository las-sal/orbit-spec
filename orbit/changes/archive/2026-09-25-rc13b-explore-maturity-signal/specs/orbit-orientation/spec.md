## MODIFIED Requirements

### Requirement: Sprint strip composition

The sprint strip SHALL render the lifecycle as one line of phase chips —
`explore → propose → review ⟲ → apply → review ⟲ → archive` — with states from the gate graph
plus an `explore` phase the graph does not model: `explore ✓` when the workstream is a change
containing `explore.md` (a consumed exploration), `explore ▶` when the workstream IS a staging
explore (later phases render pending), `explore ■` when the workstream is a staging explore whose
NEWEST spine-valid emit carries `status.token: "concluded"` (the engine-computed field per
`orbit-emit-composition`; a concluded exploration stays in place per `orbit-conventions`, and this
chip is how its row stops reading as active work — later phases still render pending, because a
conclusion builds nothing), and the chip absent when the change has no `explore.md`
(standalone-mode propose). The concluded glyph is read from the TRAIL, never from the file (per the bare-status
requirement's closed data-source scenario), so the header token reaches the row only through the
emit the conclude verb writes AFTER flipping it; a header flipped by hand with no emit afterward leaves the
chip `▶` until the next emit, the same time-shifted rule `next` has always had. A newest emit
lacking `status` (a prior-generation record), or carrying a `status` that is not an object with a
string `token`, reads as `exploring` — the field is optional, not spine, so it never degrades a row. Review phases render as ONE chip each with the iteration count from
the workstream's trail on the SHARED PASS AXIS (D-arc Stage D4 — the same axis the report
ordinal counts, so "iteration" means ONE thing across surfaces): `review ⟲7 ✓` = six
SPINE-VALID `review` emits of mode `proposal` PLUS one confident
`external-proposal-<TS>.md` findings file in the trail, gate passed. The fault-isolation skip
applies to the internal count exactly as it does to recency and WAITING (a spine-invalid
`review-proposal-*.json` file counts nowhere); external findings files count under the
report-rendering capability's lenient confidence gate (header plus all three severity
sections — an unreadable or unconfident file contributes nothing);
apply renders the tracked gate's progress (`apply ▶ 12/20`); phase glyphs are `✓` (passed/
complete — the engine's SUPERSEDED `(past)` state renders `✓`-equivalent by design), `▶`
(current), `■` (the explore chip only — a concluded staging exploration), `⟲N` (review iterations), and unmarked (pending — the engine's `stale` and `unpassed`
states render unmarked in the strip, with the WAITING band carrying the gate's reason; the
renderer makes no judgment calls beyond this closed mapping). The strip carries
the workstream name and, when its metadata cites a stage, `stage <id> · <doc>`.

#### Scenario: Strip for a staging explore

- **WHEN** the current sprint is a staging explore with two boundary emits
- **THEN** the strip reads `explore ▶ → propose → review ⟲ → apply → review ⟲ → archive` with only the explore chip active

#### Scenario: Strip for a concluded staging explore

- **WHEN** the current sprint is a staging explore whose newest spine-valid emit carries `status: {token: "concluded", date: "2026-09-25", re_entry: "…"}`
- **THEN** the strip reads `explore ■ → propose → review ⟲ → apply → review ⟲ → archive`, and the `next` line renders that emit's recorded `next_recommended` — the Concluded rung's prose — verbatim and BARE, with no `Ready when you are:` label (per the sourcing requirement's concluded rule)

#### Scenario: Hand-flipped header without an emit lags like next

- **WHEN** a staging explore's `explore.md` header reads `concluded` but its newest emit predates the flip and carries `status.token: "exploring"` (or no `status` at all, or a `status` that is not an object carrying a string `token`)
- **THEN** the chip renders `▶` and the position `exploring` until the next emit — the surface reads no file content

#### Scenario: Strip mid-apply with review history

- **WHEN** the current sprint is a change whose trail holds six proposal-review emits, whose review-proposal gate is past, and whose apply gate reports 12/20 tasks
- **THEN** the strip reads `explore ✓ → propose ✓ → review ⟲6 ✓ → apply ▶ 12/20 → review ⟲ → archive` (explore chip present because explore.md was consumed into the change)

#### Scenario: External passes count in the chip

- **WHEN** a change's trail holds two spine-valid system-review emits and one confident `external-system-<TS>.md` findings file
- **THEN** the system review chip renders `review ⟲3` — the same count the report ordinal would assign the newest pass — while a directory with an unreadable or section-incomplete external file adds nothing

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
render the `--full` view (zero live workstreams), bare `--json` emits the FULL shape — the
fallback switches the whole tier, not just the text render — and the no-changes rung keeps its
text byte-identical while its JSON carries `pr`. No stability contract beyond shape
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
- **THEN** the emitted object is `{changes: [], message, pr}` with `pr` equal to `"per-proposal"` — the same key rungs 1 and 2 carry — and the text render of that rung is unchanged

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

#### Scenario: Change next comes from the engine

- **WHEN** the sprint is a change whose review-system gate just passed
- **THEN** `next` renders the engine's `next_command` (e.g. `/orbit:archive <name> — user-invoked`) — not the older recorded recommendation from the last emit

#### Scenario: Explore next comes from the recorded trail

- **WHEN** the sprint is a staging explore whose last emit recorded `next_recommended: "/orbit:propose <name> — substantial thinking captured..."`
- **THEN** `next` renders that recorded string verbatim

#### Scenario: Concluded explore next renders bare

- **WHEN** the sprint is a staging explore whose newest spine-valid emit carries `status.token: "concluded"` and `next_recommended: "Concluded 2026-09-25. Reopens when: a third withdrawn stage."`
- **THEN** the `next` line is exactly that recorded string — no `Ready when you are:` prefix, no model hint — in the text render, while `--json`'s `next` carries the same string as every other entry
