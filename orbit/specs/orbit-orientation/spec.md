# orbit-orientation Specification

## Purpose

The two-tier orientation surface (D-arc Stage D3 — status absorption): bare `orbit status`
renders the CURRENT-SPRINT view — one live workstream's lifecycle strip, its last emit in the
trail's own recorded words, the time-shifted next recommendation, and an `also` line — while
`orbit status --full` renders the arc view (program band with every workstream carrying its own
position/last/next tuple, plus LAST and WAITING bands). The surface is a COMPOSITION of existing
engine-computed and trail-recorded data only — never new inference from artifact contents —
answering the return-after-a-day and cold-start questions with one command and zero artifact
reads. Invocation is CLI-only with a CLAUDE.md cold-start pointer; both tiers support `--json`.

## Requirements
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
nothing; the no-active-changes message and the PRE-EXISTING `--change` surface are
byte-identical to pre-capability output (later capabilities may EXTEND the `--change` form
with new flags — e.g. `--report`, D-arc Stage D4 — without touching its pre-existing outputs).

#### Scenario: Bare invocation mid-sprint

- **WHEN** `orbit status` runs with one active change mid-apply and no other live workstreams
- **THEN** the output shows that change's sprint strip, its latest emit as `last`, the engine's `next_command` as `next`, and an `also` line reporting no other active work plus any waiting items — and nothing requires opening an artifact to understand

#### Scenario: Error path claimed, neighbors unchanged

- **WHEN** `orbit status` runs with active changes present (formerly the "Missing required option --change" error) and separately with `--change <name>` and with zero changes
- **THEN** the bare invocation renders the sprint view (exit 0); the `--change` output and the no-active-changes message are unchanged from pre-capability behavior

#### Scenario: No live inference beyond engine and trail

- **WHEN** the orientation surface composes any view
- **THEN** its data sources are limited to: the change-status computation (`position`/`next_command`/gates/task counts), architecture stage-state computation, workstream directory presence, metadata citations, and `.orbit-runs/` emit files — never artifact-content parsing; and the surface is READ-ONLY — it creates and modifies no files

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
flight IS the orientation); (3) zero live workstreams AND zero parseable architecture docs → the
existing no-active-changes message. A live workstream with zero emits (pre-begin-emit staging
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
- **THEN** bare `orbit status` renders the `--full` view (program band + LAST + WAITING)

#### Scenario: Emit-less live workstream still participates

- **WHEN** the only live workstream is a pre-D3 staging explore with no `.orbit-runs/` at all
- **THEN** it anchors the sprint via metadata `created` (the fallback), its strip shows `explore ▶`, `last` reports no emits yet, and `next` falls back to `/orbit:explore <name> — continue capturing thinking` (the maturity requirement's Early canonical string)

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

### Requirement: `--full` renders the arc view

`orbit status --full` SHALL render the PROGRAM band (every stage of every parseable
architecture doc: id, computed state with the completion composition, one line each; legacy and
malformed docs listed as the architecture status surface lists them), with live workstreams
nested under their cited stages (citation from workstream metadata; workstreams without a
citation listed under `standalone`), followed by a LAST band (the globally most recent emit
across all four trail locations, including architecture, PLUS archived changes' relocated
trails under `orbit/changes/archive/*/.orbit-runs/` — archived trails feed the LAST band ONLY;
they never make a workstream live and never anchor the sprint) and a WAITING band (per the
waiting requirement). EVERY rendered workstream entry — nested or standalone, text and JSON
alike — SHALL carry the workstream's full orientation tuple: its strip/position, its OWN
`last` (most recent emit, per the bare view's trim rules in text; untruncated in JSON), and
its OWN `next` (per the recommendation-sourcing requirement) — `--full` is the tier that
satisfies the arc's cold-start exit criterion (ONE command answers position / last / next PER
workstream); the global LAST band is a convenience atop, not a substitute for, per-workstream
data. The SINGLE exception to the full-tuple mandate is a workstream the fault-isolation
policy renders DEGRADED: its entry carries the degraded variant of the shared workstream-entry
shape (per the JSON-output requirement) plus any tuple fields that remain trustworthy. The
`--full` JSON workstream entry IS the shared discriminated workstream-entry shape defined in
the JSON-output requirement (`{name, kind, stage?, strip, position, last, next, status?}` for
healthy entries — the per-change payload nesting under `status` where applicable, gate state
at `status.gates`). When zero
parseable architecture docs exist, `--full` degrades to the flat fleet view — all live
workstreams unnested (each still carrying the full tuple), no PROGRAM band. `--full` composes
the SAME per-stage and per-workstream data as the other surfaces — no `--full`-only
computation.

#### Scenario: Workstreams nest under cited stages

- **WHEN** `--full` runs with a staging explore citing stage X and an uncited active change
- **THEN** the explore renders under stage X's line and the change renders under `standalone`

#### Scenario: Every workstream carries its own orientation tuple (the cold-start criterion)

- **WHEN** `--full` runs with three live workstreams
- **THEN** each of the three entries — text and `--json` — carries its own strip/position, its own `last`, and its own `next`; a reader answers position / last / next for EVERY workstream from this one command with zero artifact reads

#### Scenario: Archived trail surfaces in global LAST without reviving the workstream

- **WHEN** the most recent emit anywhere is the `archive-*.json` of a change archived minutes ago and one staging explore is the only live workstream
- **THEN** `--full`'s LAST band names the archive emit while the workstream list contains only the explore — the archived change appears in no workstream entry and does not anchor the sprint

#### Scenario: No architecture docs degrades to flat fleet

- **WHEN** `--full` runs in a repo with no parseable architecture docs and two active changes
- **THEN** the output lists both workstreams with their strips and no PROGRAM band — never an error

### Requirement: Waiting-on-you derivation is a closed set

The WAITING items SHALL derive exclusively from three trail/engine conditions: (a) an
architecture stage rendering quiescent-awaiting-ratification; (b) outstanding packaged
externals, COUNT-BASED per change+mode: outstanding = (count of `review-external-*.json` T0
emits whose `mode` is M) − (count of `external-<M>-*.md` findings files) in the same trail;
when outstanding > 0, WAITING renders `N external review(s) packaged, M returned` for that
change+mode — v1 cannot name WHICH packaged handoff is outstanding (no pairing token exists);
the arithmetic is deterministic from the existing trail and never falsely clears on concurrent
handoffs; (c) a gate reporting
`unpassed` or `stale` on a live change, rendered with the engine's reason. The set is CLOSED —
adding a waiting class requires a spec change, never an inference tweak. Zero waiting items
renders no WAITING band (bare: the `also` line omits the waiting segment).

#### Scenario: Packaged external awaiting findings surfaces

- **WHEN** a live change's trail holds one system-mode T0 `review-external` emit and zero `external-system-*.md` findings files
- **THEN** WAITING includes `1 external review packaged, 0 returned` for that change

#### Scenario: Concurrent handoffs never falsely clear (count-based)

- **WHEN** a change's trail holds TWO proposal-mode T0 emits and ONE `external-proposal-*.md` findings file
- **THEN** WAITING still renders `2 external review(s) packaged, 1 returned` — the single return cannot clear both

#### Scenario: Awaiting ratification surfaces

- **WHEN** a stage renders quiescent-awaiting-ratification
- **THEN** WAITING includes that stage's line (`<id> completion — yours to ratify`)

### Requirement: Boot render composes cold-start pointers

`orbit status --change <name> --boot` SHALL render the cold-start boot sequence for a change —
ORDERED POINTERS into existing artifacts, never duplicated substance (arc ruling R-d-9(b)'s
`boot_sequence` genre generalized from architect emits to an engine surface; D-arc Stage D5):
the engine position and eligibility line (the existing status computation), the artifact set
(the existing contextFiles resolution), the latest-emit pointers from the trail — one per
command family present on the trail (`apply`, `address-reviews`, `explore`, `verify`,
`review-external` T0, …), with review emits further split per mode (`proposal` / `system` —
architecture-mode review emits persist to the architecture trail and never appear on a
change trail), each rendered as path + `final_assessment` first sentence — the presence of
`explore.md`/`sketches/` as historical context, and the TOUCHPOINTS view — lifecycle-aware: before COMMITTED apply work exists, the predicted
map (design.md's `## Touchpoints` section, when present) — the transition keys on committed
non-bookkeeping files, never on trail presence (an apply emit written at a boundary before its
chunk commit lands stays on the predicted view); once committed apply work exists, the ACTUAL
map (engine-computed `git diff --name-only` from the change's first commit, per the
propose-owned predicted/actual split) with the predicted map alongside as reference — the
ACTUAL map is the CODE map: the change's own files (`orbit/changes/<name>/**` — the same
exclusion audit-drift's divergence arithmetic applies as lifecycle bookkeeping) collapse out
of the list into one summary line carrying their count, never itemized. NO
hand-maintained handoff file exists anywhere in the flow — a boot render is computed fresh per
invocation (the R-d-4 subtraction). The render is READ-ONLY, degrades per this capability's
fault-isolation policy (a missing design.md section or non-git workspace yields an absent
touchpoints line, never an error), and composes with `--json`. The `--json` SHAPE: the
per-change status payload gains ONE typed `boot` object — `artifacts` (the ordered pointer
array, in read order), `emits` (array of `{family, mode?, path, headline}` entries — `mode`
present only for review-family entries; `headline` is the `final_assessment` first sentence),
`history` (`{explore_md: boolean, sketches: boolean}`), `touchpoints`
(`{predicted: string[] | null, actual: string[] | null, actual_change_own_count?: number,
actual_unpredicted?: string[], predicted_unsatisfied?: string[],
malformed?: Array<{line, text}>}` — `actual` null before committed apply work exists and
change-own-free otherwise, `actual_change_own_count` the collapsed change-own file count
(absent when zero), `predicted` null when the section is absent; the three divergence fields
are the ENGINE set-difference serving audit-drift's touchpoints check — `actual_unpredicted`
and `predicted_unsatisfied` present only when both maps are live, `malformed` the line-cited
unparseable entries whenever the section is present), and `skipped_emits` (the
fault-isolation array; absent when empty). Degradation renders as null or field omission per
the same policy, never an error — no implementer invents a second shape.

#### Scenario: Pre-apply boot shows the predicted map

- **WHEN** `orbit status --change foo --boot` runs before any apply commits exist and design.md carries a `## Touchpoints` section
- **THEN** the render shows position/eligibility, the artifact pointers, the latest-emit pointers per command family (review split per mode), and the predicted touchpoints — each entry a pointer or a computed line, nothing hand-maintained

#### Scenario: Post-apply boot shows the actual map

- **WHEN** apply commits exist for the change
- **THEN** the touchpoints view shows the diff-computed actual file list with the predicted map alongside as reference; the actual list is never sourced from prose, and the change's own `orbit/changes/<name>/**` files render only as the collapsed count line

#### Scenario: Degradation without error

- **WHEN** design.md has no Touchpoints section and the workspace is not a git repository
- **THEN** the boot render succeeds with the touchpoints line absent; exit 0

#### Scenario: Boot --json is one typed object

- **WHEN** `orbit status --change foo --boot --json` runs before any apply commits exist
- **THEN** the payload's `boot` object carries ordered `artifacts`, per-family `emits`, `history`, and `touchpoints` with `actual: null`; absent material is omitted or null per the degradation policy, never an error

### Requirement: Fault isolation and malformed-input policy

Fleet collection SHALL isolate faults per workstream — a single damaged workstream or emit
never erases orientation for healthy work: (a) an unreadable, JSON-invalid, or SPINE-INVALID
emit file is EXCLUDED from all arithmetic (consistent with the trail reader's existing skip behavior) and recency
falls back to the next-older valid emit in that trail — spine-invalid means parseable JSON
failing the minimum validity checks orientation renders from: a missing or non-string
`command`, `final_assessment`, or `next_recommended` (the universal-spine fields per
`orbit-conventions`), or, for a `review-external` T0 emit, a missing or non-string `mode` (the
WAITING arithmetic's discriminator); a skipped emit never wins recency, never counts in the
WAITING arithmetic, and never increments the strip's `⟲N` chip counts — but the exclusion is
SURFACED, never silent (D-arc Stage D5's fail-loud seam: a spine-invalid record — from
hand-tampering, a partial copy, or pre-capability tooling; the emit surface's atomic
single-write cannot produce one — must be
detectable, not invisible): the rendered view (bare, `--full`, and the boot render) carries a
one-line degraded note naming the skipped file (`⚠ invalid emit skipped: <filename>`), and
`--json` output carries the same exclusion as a `skipped_emits: ["<filename>", …]` array on
the affected workstream entry (absent when no file was skipped) —
detection without failure, the render still succeeds and exits 0; when NO valid emit
remains, the workstream follows the
emit-less rules (metadata-`created` recency; `last` reports the shared empty-trail line —
`no emits yet`, the same render as a never-emitted workstream; `next` falls
back per the continuity requirement's emit-less scenario — the maturity requirement's Early
canonical string for explores, the engine `next_command` for changes); (b) a workstream whose status computation or metadata load
fails renders a DEGRADED row (name + a one-line error note) while every other workstream
renders normally — the command exits 0 with the degraded row visible, never aborts the view;
when the degraded workstream IS the bare view's sprint, bare renders the degraded row in place
of the strip plus any tuple fields that remain trustworthy (a readable trail still yields
`last`; `next` is omitted with the error note when its source computation failed), the `also`
line, and exits 0;
(c) these fallbacks are deterministic (same inputs, same render) and never consult artifact
contents.

#### Scenario: Corrupt newest emit falls back deterministically

- **WHEN** the sprint workstream's newest emit file is invalid JSON but an older valid emit exists
- **THEN** `last`/`next` render from the older valid emit, the corrupt file is skipped, and repeated invocations render identically

#### Scenario: One broken workstream degrades alone

- **WHEN** one of three active changes has metadata that fails to load
- **THEN** that workstream renders a degraded row with an error note; the other two render fully; exit code 0

#### Scenario: Spine-invalid newest emit is skipped like invalid JSON

- **WHEN** the sprint workstream's newest emit parses as JSON but lacks a `final_assessment` string
- **THEN** the file is excluded, recency and `last` fall back to the next-older valid emit, the file counts in no WAITING arithmetic, and the render carries the one-line degraded note naming the file

#### Scenario: Spine-invalid trail file is detected at the next status render

- **WHEN** a spine-incomplete emit sits on the trail (hand-tampering, a partial copy, or pre-capability tooling — the emit surface's atomic single-write cannot produce one)
- **THEN** the next `orbit status` (any tier, and the boot render) surfaces the `⚠ invalid emit skipped: <filename>` note while excluding the file from arithmetic; exit 0

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
