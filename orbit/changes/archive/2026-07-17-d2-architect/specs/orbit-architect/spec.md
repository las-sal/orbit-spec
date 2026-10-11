## ADDED Requirements

### Requirement: Architect workflow available

The system SHALL expose `/orbit:architect [<doc-name>]` as a first-class generated workflow with
the complete command anatomy: a generated skill (`orbit-architect`) plus a thin launcher command
(per the D14 pattern), the four execution disciplines block, a run-summary emit, registration in
every generator registry, and installation for all tools (D15 full surface — the generated
surface grows to 16 workflows). Invoked with a `<doc-name>`: create `orbit/architecture/
<doc-name>.md` scaffolded in the parseable format (per `orbit-architecture-engine`) if absent, or
resume the existing doc. Invoked bare: list parseable docs via `orbit architecture status` and
prompt selection (offering create-new).

#### Scenario: Create scaffolds the parseable format

- **WHEN** `/orbit:architect my-program` runs and `orbit/architecture/my-program.md` does not exist
- **THEN** the body scaffolds the doc with the parseable structure by construction — status header, Premise/Goals/Rulings/Stages/Status-log skeleton, and at least the stage-heading + slot-line conventions demonstrated — so format correctness never depends on prose memory

#### Scenario: Resume reads the doc as authoritative

- **WHEN** `/orbit:architect my-program` runs and the doc exists
- **THEN** the body reads the doc (and `orbit architecture status` for its computed position) before any edit

### Requirement: Architect authoring stance and capture

During an architect session the body SHALL capture program-level material into the doc the way
explore captures decisions: rulings (dated, attributed, addressable IDs), stage declarations
(heading + slots + charter prose + exit criteria), and considered-and-out entries are written as
they are ratified in conversation, with brief chat acknowledgment. The R-d-8 residency sweep
applies at every conversation boundary: pending recommendations and open items must be
file-resident before the emit writes. The body does NOT carry explore-grade thinking-partner
stance prose, stage-lifecycle helpers, or retrofit guidance (deliberately out of v1 scope —
D-d2-6 rungs 6–8).

#### Scenario: Ruling captured on ratification

- **WHEN** the user ratifies a program-level ruling during an architect session
- **THEN** the body appends it to the doc's rulings (dated, attributed, with an addressable ID) and acknowledges briefly in chat

#### Scenario: Residency sweep before emit

- **WHEN** an architect session reaches a conversation boundary with a recommendation discussed but not yet ratified
- **THEN** the body writes it into the owning section (e.g. an open question's standing-recommendation slot) BEFORE emitting — chat is never the store of record

### Requirement: Architect renders state, never authors it

The architect body SHALL source all stage-state and program-position statements from the engine
(`orbit architecture status`) and is PROHIBITED from hand-writing state into the doc: no
`*State:*` lines, no position summaries duplicating what the engine computes. When the doc
predates this contract (carries legacy hand-written state lines), the body flags them for
deletion rather than updating them.

#### Scenario: Position comes from the engine

- **WHEN** an architect session needs to state where a stage stands
- **THEN** it runs `orbit architecture status` and renders the computed answer verbatim — it never infers or hand-writes state prose into the doc

### Requirement: Completion-ratification flow

The architect body SHALL offer the completion ratification as a recorded interaction: when
`orbit architecture status` shows a stage quiescent-awaiting-ratification, the body surfaces it
and asks (AskUserQuestion — ratify / not yet); on the user's yes it writes
`Complete: [x] <date> (<who>)` into that stage's slot (inserting the slot line directly after
the stage's `Depends-on:` line — or after the heading when no slots exist — if the stage was
slotless, per the format's omission semantics) and records the ratification in the
session's emit. The body never checks the box on its own judgment, and never nags: the offer
fires when the user opens the doc's architect session, not as an interruption elsewhere.

#### Scenario: Ratification writes the mark

- **WHEN** a stage is quiescent-awaiting-ratification and the user answers ratify
- **THEN** the body writes `Complete: [x] <YYYY-MM-DD> (<who>)` into the stage's slot and the emit records the ratified stage id

#### Scenario: Not-yet leaves the slot untouched

- **WHEN** the user answers not-yet
- **THEN** the slot stays `[ ]`, nothing else changes, and the readout continues to render awaiting-ratification

### Requirement: Architect is a stance, never a gatekeeper

Architecture authoring via `/orbit:explore` plus hand-editing SHALL remain a first-class path: no
generated body recommends `/orbit:architect` as a required entry point, no validation or drift
check flags architecture content for having originated outside an architect session, and the
canonical flow (explore → propose → …) is unchanged by this workflow's existence.

#### Scenario: Explore-born architecture content is first-class

- **WHEN** an architecture doc is created or edited during an `/orbit:explore` session or by hand
- **THEN** no orbit surface flags, warns, or scores it differently from architect-session content

### Requirement: Architect run-summary emit with handoff section

`/orbit:architect` SHALL emit `orbit/architecture/.orbit-runs/architect-<TS>.json` at
conversation boundaries (the named-mode-explore emit-timing genre), on the universal spine
(`kind: "workflow"`, `change: null`) with per-command extensions: `doc` (the architecture doc's
name), `stages_touched`, `rulings_captured`, `completions_ratified` (stage ids, possibly empty),
and — per arc ruling R-d-9(b), complied with from birth — a structured `handoff` section:
`boot_sequence` (ordered pointers, never duplicated substance), `next_command`, `model_hint`,
and `seam`. `/orbit:review --as architecture` emits carry the same `handoff` section (its shape
is owned here; the review emit itself is specified in `orbit-review`).

#### Scenario: Emit lands in the architecture trail with handoff

- **WHEN** an architect session against doc `my-program` reaches a boundary
- **THEN** `orbit/architecture/.orbit-runs/architect-<TS>.json` is written with `doc: "my-program"`, the spine fields, and a `handoff` object whose `boot_sequence` entries are pointers into existing artifacts
