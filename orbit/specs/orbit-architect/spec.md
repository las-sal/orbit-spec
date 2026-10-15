# orbit-architect Specification

## Purpose
The `/orbit:architect` workflow — author or resume an architecture doc (the program layer above
changes) as a first-class generated skill with thin launcher command. The body scaffolds the
parseable format by construction, captures rulings / stage declarations / considered-and-out
entries as they are ratified, renders all stage state from `orbit architecture status` (never
hand-writes it), and offers completion-ratification as a recorded interaction. It is where new
work starts and where it returns — orbit's start surfaces name `/orbit:architect` first, and the
closing session ratifies the stage — yet a stance, never a gatekeeper: no session is ever required,
and `/orbit:explore` plus hand-editing remains a first-class path, the one-off fix's. Sessions
emit `architect-<TS>.json` to the architecture trail with the structured `handoff` section.
## Requirements
### Requirement: Architect workflow available

The system SHALL expose `/orbit:architect [<doc-name>]` as a first-class generated workflow with
the complete command anatomy: a generated skill (`orbit-architect`) plus a thin launcher command
(per the D14 pattern), the four execution disciplines block, a run-summary emit, registration in
every generator registry, and installation for all tools (D15 full surface — the addition
grew the generated surface to 16 workflows at D2; 15 post-D5's review-external merge). Invoked with a `<doc-name>`: create `orbit/architecture/
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
and asks (AskUserQuestion — ratify / not yet / ended); on ratify it writes
`Complete: [x] <date> (<who>)` into that stage's slot, and on ended it writes
`Complete: [~] <date> (<who>)` (the ended production, per `orbit-architecture-engine`'s format
requirement) — either one inserting the slot line directly after the stage's `Depends-on:` line, or
after the heading when no slots exist, if the stage was slotless, per the format's omission
semantics — and records the act in the session's emit (`completions_ratified` or `stages_ended`,
per the emit requirement). The offer's text states what ended means: the stage's exit criteria will
not be met, the stage renders `ended`, and the mark is a slot edit that can be reversed by hand. The
offer fires on the awaiting state ONLY — a stage rendering `ended`, `ended-from-explore` or
`complete` is offered nothing. The mark is the USER's word: unprompted, inside an architect session,
the user may declare a stage ended — the only route for a `premised` stage, which no offer
reaches — and the body writes the same production with the same insert rule when the stage's
observed state is `premised`, `quiescent` or `concluded` AND its slot is UNDATED (absent, or
`[ ]`). On a LIVE stage (`in-change`, or a live `exploring`) the body DECLINES the write, naming
the live citer and the act that would make the mark supportable (archive the change; conclude the
exploration) — the two observations the engine's composition table refuses are never written by
this flow. On a slot that already carries a DATED mark (`[x]` or `[~]`) the body also DECLINES,
naming the existing mark and pointing at the hand edit as the reversal path — this flow never
authors a reversal of a recorded mark. The three ways a mark
is written are the prompted answer, the unprompted word inside a session, and a hand edit outside
any session (the flow-entry ruling: first-class; the engine reads the token the same). The body never
checks or ends a stage on its own judgment, and never nags: the offer fires when the user opens the
doc's architect session, not as an interruption elsewhere. (A mark on an observation the engine's
composition rule refuses is an inconsistency the status render and audit-drift surface; this flow
writes marks the engine's observation supports — and the ended mark is supported wherever no live
work contradicts it, `premised` included.)

#### Scenario: Ratification writes the mark

- **WHEN** a stage is quiescent-awaiting-ratification and the user answers ratify
- **THEN** the body writes `Complete: [x] <YYYY-MM-DD> (<who>)` into the stage's slot and the emit records the ratified stage id

#### Scenario: Not-yet leaves the slot untouched

- **WHEN** the user answers not-yet
- **THEN** the slot stays `[ ]`, nothing else changes, and the readout continues to render awaiting-ratification

#### Scenario: Ended writes the third production

- **WHEN** a stage is quiescent-awaiting-ratification and the user answers ended
- **THEN** the body writes `Complete: [~] <YYYY-MM-DD> (<who>)` into the stage's slot, the emit's `stages_ended` lists the stage id, and the readout renders `ended (declared <date> by <who>)`

#### Scenario: An ended stage is offered nothing

- **WHEN** the user opens an architect session on a doc whose stage renders `ended` or `ended-from-explore`
- **THEN** no ratification offer fires for that stage — the offer keys on the awaiting state only

#### Scenario: Unprompted ended on a live stage is declined

- **WHEN** the user declares, inside an architect session, that a stage cited by an active change (or a live explore) has ended
- **THEN** the body writes nothing, names the live citing artifact, and states the act that would make the mark supportable — archiving the change, or concluding the exploration

#### Scenario: Unprompted ended on a slot that already carries a dated mark is declined

- **WHEN** the user declares, inside an architect session, that a stage whose slot reads `Complete: [x] <date> (<who>)` (or an existing `[~]` mark) has ended
- **THEN** the body writes nothing, names the existing mark, and points at the hand edit as the way to reverse or re-date it

#### Scenario: Unprompted ended on a premised stage

- **WHEN** the user declares, inside an architect session, that a stage with no citing artifacts has ended
- **THEN** the body writes the ended production with the insert rule, no prompt fires, the emit's `stages_ended` lists the id, and the stage renders `ended`

### Requirement: Architect is a stance, never a gatekeeper

Architecture authoring via `/orbit:explore` plus hand-editing SHALL remain a first-class path: no
generated body recommends `/orbit:architect` as a REQUIRED entry point, and no validation or drift
check flags architecture content, or a change, for having originated outside an architect session.
The canonical flow is architect-first and returns to architect — architect → explore → propose →
review → apply → review → archive → architect, the closing session ratifying the stage and taking up
the next — and that is a SUGGESTION, never a requirement: orbit's start surfaces name `/orbit:architect` first (per
`Start surfaces name the architect workflow first`), and explore remains a working path for
a one-off fix (R-rda-2).

#### Scenario: Explore-born architecture content is first-class

- **WHEN** an architecture doc is created or edited during an `/orbit:explore` session or by hand
- **THEN** no orbit surface flags, warns, or scores it differently from architect-session content

#### Scenario: A change that skipped the architect session is not flagged

- **WHEN** a change is proposed with no architecture citation and no architect session on record
- **THEN** no validation, gate, drift check or readout flags it for that, and no prerequisite, gate or penalty applies to it that a cited change escapes; behaviour keyed on the citation itself — the archive emit's recommendation, the `pr: per-architecture` PR target — still follows the citation

### Requirement: Architect run-summary emit with handoff section

`/orbit:architect` SHALL emit `orbit/architecture/.orbit-runs/architect-<TS>.json` at
conversation boundaries (the conversation-boundary timing per `orbit-run-summary-emit`'s
`Emit timing semantics`; architect fires no BEGIN emit — the begin+boundary genre is
named-mode explore's, D-arc Stage D3), on the universal spine
(`kind: "workflow"`, `change: null`) with per-command extensions: `doc` (the architecture doc's
name), `stages_touched`, `rulings_captured`, `completions_ratified` (stage ids, possibly empty), `stages_ended` (the stage ids the session
declared ended — possibly empty, and optional so every earlier emit stays valid),
and — per arc ruling R-d-9(b), complied with from birth — a structured `handoff` section:
`boot_sequence` (ordered pointers, never duplicated substance), `next_command`, `model_hint`,
and `seam`. `/orbit:review --as architecture` emits carry the same `handoff` section (its shape
is owned here; the review emit itself is specified in `orbit-review`). The emit is composed via
the engine surface (`orbit emit architect` per `orbit-emit-composition` — D-arc Stage D5), and
the BOUNDARY RESIDENCY SWEEP precedes it — per the `Architect authoring stance and capture`
requirement's R-d-8 sweep, which is the sweep's ONE normative home (leak-hardening layer 2,
shared with named-mode explore per `orbit-explore-modifications`): "no emit without sweep",
riding the existing boundary trigger with no new prompt.

#### Scenario: Emit lands in the architecture trail with handoff

- **WHEN** an architect session against doc `my-program` reaches a boundary
- **THEN** `orbit/architecture/.orbit-runs/architect-<TS>.json` is written with `doc: "my-program"`, the spine fields, and a `handoff` object whose `boot_sequence` entries are pointers into existing artifacts

#### Scenario: Ended ids are recorded beside ratified ids

- **WHEN** an architect session writes an ended mark into a stage's slot
- **THEN** the session's emit carries that id in `stages_ended` and not in `completions_ratified`, and the engine's payload table accepts the field

### Requirement: Start surfaces name the architect workflow first

Every orbit surface that suggests where NEW work starts SHALL name `/orbit:architect <name>` first
(R-rda-1, R-rda-2). The surfaces are two kinds:

| surface | kind | what it names |
|---|---|---|
| the archive emit's `next_recommended` (`orbit-emit-composition`) | strict | `/orbit:architect <doc>` or `/orbit:architect <name>`; no `/orbit:explore`, `/orbit:new` or `/orbit:propose` |
| idle `orbit status`'s next line (`orbit-orientation`) | strict for its fallback | `/orbit:architect <name>` when no recorded command exists; a recorded `/orbit:` command is continuing work, not a start, and renders as recorded |
| the no-active-changes message and the two no-changes errors raised by `orbit status --change` and `orbit instructions` (`orbit-orientation`) | strict | `No active changes.`, naming no command; the errors name `/orbit:architect <name>` only |
| `orbit init`'s `Getting started:` line | strict | `/orbit:architect <name>` only |
| `orbit update`'s `Getting started:` list | strict for its first line | `/orbit:architect`, then `/orbit:explore` and `/orbit:propose` — the canonical flow's order; later lines list commands, not where to start |
| the welcome screen's quick-start list | strict for its first line | as `orbit update`'s list |
| this workflow's body (its stance paragraph) | prose | the architect-first canonical flow, and that an architect session is never required |
| the onboard body (`orbit-onboard`) | prose | architect first; explore described as the one-off path, after architect |
| the user docs' start sections (`orbit-user-docs`) | prose, checked | as the onboard body; `orbit-user-docs`' `The user docs' start sections name the architect workflow first` lists the sections and checks that each names `/orbit:architect` before any other start |

A strict surface is checked by a test that fails when it names another start. A prose surface may
describe explore, after architect and never as the default; a checked prose surface's test reads that order. Named limit: the table is the
set a sweep of the command names found. Residual kind: a surface that steers new work to explore or new without naming either command (e.g. "start by thinking it through").
Residual method: whenever a change adds or edits a user-visible start string, grep the generated bodies and the CLI's user-visible strings for "start", "begin", "first change", "new work", "entry" and "create", and classify each hit against this table; it first ran at architect-first's apply. Known residual instance: the
bulk-archive body's no-changes output (`No active changes found. Create a new change to get started.`)
lies in the upstream portion of an orbit-modified body, which changes only through a named edit
(`orbit-conventions`' `Generated-file disposition`); it is recorded here, not edited.

#### Scenario: A strict surface names only architect

- **WHEN** the start-surfaces test reads `orbit init`'s getting-started output, the first line of `orbit update`'s and the welcome screen's lists, the archive emit's `next_recommended` for a cited and an uncited change, idle `orbit status` with no emit, and the no-active-changes message and the two no-changes errors
- **THEN** each names `/orbit:architect`, except the no-active-changes message, which names no command; and none names `/orbit:explore`, `/orbit:new` or `/orbit:propose` as where to start

#### Scenario: A prose surface keeps the one-off path

- **WHEN** the onboard body is read
- **THEN** it names `/orbit:architect` before any other start and describes explore as the path for a one-off fix, never as the default

