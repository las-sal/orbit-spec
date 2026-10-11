## MODIFIED Requirements

### Requirement: Architect run-summary emit with handoff section

`/orbit:architect` SHALL emit `orbit/architecture/.orbit-runs/architect-<TS>.json` at
conversation boundaries (the conversation-boundary timing per `orbit-run-summary-emit`'s
`Emit timing semantics`; architect fires no BEGIN emit — the begin+boundary genre is
named-mode explore's, D-arc Stage D3), on the universal spine
(`kind: "workflow"`, `change: null`) with per-command extensions: `doc` (the architecture doc's
name), `stages_touched`, `rulings_captured`, `completions_ratified` (stage ids, possibly empty),
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
