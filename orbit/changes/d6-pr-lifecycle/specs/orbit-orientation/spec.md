# orbit-orientation Delta

## MODIFIED Requirements

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
`position` is the stage-state vocabulary literal `"exploring"`; `stage` is present only when
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

#### Scenario: Degraded entry emits the degraded variant in both tiers

- **WHEN** a workstream's metadata load fails and `--json` runs (bare with it as sprint, or `--full`)
- **THEN** its entry is `{name, kind, degraded: true, error}` plus only trustworthy fields — never a fabricated full tuple, never null-padded

#### Scenario: Every bare-tier JSON rung carries the resolved PR regime

- **WHEN** `orbit status --json` runs with `pr: per-proposal` configured and NO active workstream and NO parseable architecture doc (the degradation ladder's no-changes rung)
- **THEN** the emitted object is `{changes: [], message, pr}` with `pr` equal to `"per-proposal"` — the same key rungs 1 and 2 carry — and the text render of that rung is unchanged
