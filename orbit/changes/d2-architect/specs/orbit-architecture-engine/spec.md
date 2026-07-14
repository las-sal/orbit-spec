## ADDED Requirements

### Requirement: Parseable architecture-doc format

Architecture docs SHALL declare engine-readable structure via markdown heading conventions while
remaining judgment-dense prose documents: a stage is declared by a heading of the form
`### Stage <id> — <title>` (kebab-case `<id>`, unique within the doc), and a stage section MAY
carry two labeled slot lines — `Depends-on: <id>[, <id>…]` (or `Depends-on: (none)`) and
`Complete: [ ]` / `Complete: [x] <YYYY-MM-DD> (<who>)`. The engine reads ONLY: stage ids/titles,
the two slots, and section boundaries (a stage section runs from its heading to the next
same-or-higher-level heading). All other content — charter prose, exit criteria, premise,
rulings, status log — is engine-opaque. The parser SHALL be fence-aware: headings and slot lines
inside fenced code blocks are content, never declarations. Architecture docs live at
`orbit/architecture/<name>.md`; `<name>` (the filename stem) is the doc's citable identity.

#### Scenario: Stage declarations parse

- **WHEN** the parser reads a doc containing `### Stage d2-architect — architect (the program layer)` followed by `Depends-on: (none)` and `Complete: [ ]` lines
- **THEN** it yields a stage with id `d2-architect`, title `architect (the program layer)`, no dependencies, and an unratified completion mark

#### Scenario: Fenced look-alikes are content

- **WHEN** a doc contains a fenced code block whose text includes `### Stage fake-stage — x` or a `Complete: [x]` line
- **THEN** the parser declares no stage and no slot from inside the fence

#### Scenario: Duplicate stage id fails validation

- **WHEN** a doc declares two stages with the same `<id>`
- **THEN** `orbit architecture validate` fails with an error naming the duplicated id

#### Scenario: Legacy prose docs degrade gracefully

- **WHEN** a doc under `orbit/architecture/` declares no parseable stages (e.g. a pre-D2 prose
  document)
- **THEN** it is listed as legacy/opaque by the status surface and is never an error; only
  parseable docs participate in stage-state computation

### Requirement: Computed stage state with completion-as-ratification

Stage state SHALL be a pure function of on-disk artifacts — never stored, never hand-authored.
For a stage `<id>` in doc `<doc>`, the observed state is computed with this precedence: (1) any
ACTIVE change whose metadata cites `{doc, stage: <id>}` → `in-change`; (2) else any live explore
(`orbit/explore/*/`) whose metadata cites it → `exploring`; (3) else ≥1 ARCHIVED change citing it
→ `quiescent`; (4) else → `premised`. **Completion is a composition of observation and
ratification**: the engine renders `complete` ONLY when the observed state is `quiescent` AND the
stage's `Complete:` slot is ratified (`[x]` with date); a quiescent stage with an unratified slot
renders as quiescent-awaiting-ratification. A ratified `Complete:` mark on a stage whose OBSERVED
state is not quiescent — live citing work (active change or live explore) OR no citing artifacts
at all (`premised`, e.g. a pre-D2 archived stage whose archive was never backfilled with its
citation) — is an inconsistency surfaced by validation and the audit-drift staleness check, not
silently honored. The propose staging-move and the archive move
are the state transitions — no additional bookkeeping exists.

#### Scenario: Precedence over multiple citations

- **WHEN** a stage is cited by one archived change AND one active change
- **THEN** its observed state is `in-change` (live activity outranks history)

#### Scenario: Quiescent awaiting ratification

- **WHEN** all changes citing a stage are archived, no live explore cites it, and its `Complete:` slot is `[ ]`
- **THEN** the status surface renders the stage as quiescent with completion awaiting the user's ratification — the readout is the reminder; no command prompts for it unprovoked

#### Scenario: Complete only when quiescent AND ratified

- **WHEN** a stage is quiescent and its `Complete:` slot is `[x] 2026-08-01 (Sal)`
- **THEN** the engine renders the stage `complete`

#### Scenario: Ratified mark without observable quiescence is an inconsistency

- **WHEN** a stage's `Complete:` slot is ratified but the observed state is `premised` (no citing artifact exists — e.g. its work archived before the citation field existed and was never backfilled)
- **THEN** the status surface renders the inconsistency (never a silent `complete`), and validation/audit-drift flag it; the remedy is backfilling the archived change's `architecture:` citation (a deliberate migration edit — the citation records a true historical fact)

#### Scenario: Re-exploration reopens honestly

- **WHEN** a quiescent stage gains a new live explore citing it
- **THEN** its observed state returns to `exploring`

### Requirement: Architecture citation in change and explore metadata

The change metadata schema SHALL gain an optional `architecture` field of shape
`{doc: <name>, stage: <id>}` — `doc` is an architecture doc's filename stem under
`orbit/architecture/`, `stage` is a stage id declared in that doc. The field is valid in both
change metadata (`orbit/changes/<name>/.openspec.yaml`) and explore metadata
(`orbit/explore/<name>/.openspec.yaml`), round-trips through the metadata read/write helpers
without loss, and is re-pointable by hand-edit (validation checks resolvability; no immutability
is enforced, consistent with the rest of metadata). Absence of the field means an unlinked
change/explore and imposes no ceremony.

#### Scenario: Citation round-trips

- **WHEN** metadata containing `architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` is written and re-read through the helpers
- **THEN** the field is preserved exactly, alongside existing fields (`base_fingerprints`, `schema_version`, `consent_era_from`)

#### Scenario: Two-level dangling validation

- **WHEN** change validation (`orbit validate <change>` — the citation's OWNER: citations live in change/explore metadata, so they are validated where that metadata is validated; `orbit architecture validate` checks doc structure only) resolves a citation whose `doc` has no file under `orbit/architecture/`, OR whose `doc` exists but declares no stage with the cited id
- **THEN** validation fails with an error naming WHICH level dangled (the doc, or the stage within the named doc)

#### Scenario: Uncited metadata unaffected

- **WHEN** a change or explore has no `architecture` field
- **THEN** all validation and state computation behave exactly as before this capability

### Requirement: Architecture CLI surface

The system SHALL expose three subcommands under `orbit architecture`: **`status`** renders the
computed program position across all parseable docs — per stage: id, observed state (with the
completion composition), and the citing artifacts — honoring D1's eligibility framing (no
imperative labels); **`show <doc> [<stage>]`** prints one stage's section (heading-to-heading
slice) or, without `<stage>`, the doc's stage index — a session loads ONE stage section, never
the whole doc, as the layer's read-cost answer; **`validate <doc>`** checks parseable structure
(heading form, slot syntax, stage-id uniqueness, dependency references resolve to declared
stages). All three support `--json`.

#### Scenario: Status computes from disk

- **WHEN** `orbit architecture status --json` runs against a repo with one parseable doc whose stage is cited by an active change
- **THEN** the output lists that stage as `in-change` with the citing change named, computed live from disk (no stored state is read, because none exists)

#### Scenario: Show slices one stage

- **WHEN** `orbit architecture show d-arc-arbitered-flow d2-architect` runs
- **THEN** exactly that stage's section (heading through the line before the next same-or-higher heading) prints — not the whole document

#### Scenario: Validate catches a dangling Depends-on

- **WHEN** a stage declares `Depends-on: d9-nonexistent` and no such stage exists in the doc
- **THEN** `orbit architecture validate` fails naming the stage and the unresolvable dependency

#### Scenario: Show on a legacy doc or a nonexistent stage

- **WHEN** `show <doc>` targets a legacy (zero-parseable-stage) doc, or `show <doc> <stage>` names a stage id the doc does not declare
- **THEN** the legacy case prints an empty stage index with a legacy/opaque note (exit 0 — not an error); the nonexistent-stage case fails with an error listing the doc's declared stage ids

#### Scenario: Status with zero parseable docs

- **WHEN** `orbit architecture status` runs in a repo whose `orbit/architecture/` has no parseable docs (or does not exist)
- **THEN** it reports `no parseable architecture docs` cleanly (exit 0; `--json` yields an empty docs list) — never an error

### Requirement: Architecture trail location

Architecture-scoped work SHALL persist its run summaries to `orbit/architecture/.orbit-runs/`
(one directory shared by all architecture docs; each emit names its doc), committed like the
other `.orbit-runs/` locations. This is the fourth persistence location alongside per-change,
per-explore, and project-wide (per `orbit-conventions`); it never moves (architecture docs are
not archived by change archiving).

#### Scenario: Architecture emits land in the architecture trail

- **WHEN** `/orbit:architect` or `/orbit:review --as architecture` completes against doc `<doc>`
- **THEN** its run-summary JSON lands under `orbit/architecture/.orbit-runs/` with the doc named in the emit body
