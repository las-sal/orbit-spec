## MODIFIED Requirements

### Requirement: Emit scope

The following orbit commands SHALL emit `orbit/changes/<name>/.orbit-runs/<command>-<TS>.json` (or `orbit/explore/<name>/.orbit-runs/<command>-<TS>.json` for explore, or `orbit/architecture/.orbit-runs/<command>-<TS>.json` for architecture-scoped commands) when invoked — COMPOSED AND WRITTEN VIA THE ENGINE EMIT SURFACE (`orbit emit <command>` per `orbit-emit-composition`, D-arc Stage D5): generated bodies instruct the surface with a narrative-only payload and never hand-compose the JSON (hand-composition is the retired practice; pre-capability emits on the trail are historical records, readers tolerate both generations). This requirement covers two categories:

- **New emit behavior** (commands that don't emit any run-summary JSON today):
  - Workflow commands: `/orbit:explore` (named mode only — bare mode does NOT emit; named mode emits at BEGIN as well as at boundaries, per `Emit timing semantics` — D-arc Stage D3), `/orbit:propose`, `/orbit:new`, `/orbit:continue`, `/orbit:ff`, `/orbit:apply`, `/orbit:verify`, `/orbit:architect` (D-arc Stage D2; emits to the architecture trail with `change: null` + a `doc` field, shape owned by `orbit-architect`)
  - The external-review packaging branch at T0 (when the prompt is packaged, before findings return — the `command: "review-external"` emit, invoked via `/orbit:review --reviewer external` per D-arc Stage D5's merge; record vocabulary frozen)
- **Refined existing emit** (already emits today; this change refines the recommendation logic and aligns with the universal spine from orbit-conventions):
  - Standalone `/orbit:audit-drift` (schema documented in the `orbit-audit-drift` skill's `references/run-summary-schema.md`, shipped alongside the generated skill)

The following commands SHALL NOT emit additional JSONs as part of this change:

- `/orbit:onboard` — meta walkthrough; no change-state transition
- `/orbit:sync` (the `orbit-sync-specs` skill) — upstream primitive whose upstream portion orbit does not edit (per `orbit-conventions`' `Generated-file disposition`); no emit behavior is added to it

Existing emit-producing commands (`/orbit:review`, `/orbit:address-reviews`, `/orbit:archive`, inline `/orbit:audit-drift` during archive) continue emitting as today — through the emit surface; `/orbit:review`'s architecture mode persists to the architecture trail per `orbit-review`'s per-mode persistence requirement — a location change for that mode, not a new emitter.

#### Scenario: Named-mode /orbit:explore writes explore JSON
- **WHEN** the user invokes `/orbit:explore foo` (named mode) and the session ends
- **THEN** the emit-layer writes `orbit/explore/foo/.orbit-runs/explore-<TS>.json` via `orbit emit explore`

#### Scenario: Named-mode explore BEGIN emit at scaffold (D-arc Stage D3)
- **WHEN** `/orbit:explore foo` creates the staging directory in Mode B (new named exploration)
- **THEN** the emit-layer writes a begin `explore-<TS>.json` immediately — `decisions_captured: 0`, `next_recommended: "/orbit:explore foo — continue capturing thinking"` (the maturity requirement's Early canonical string), the `final_assessment` recording the scaffold and the citation decision (cited or declined) — so the trail records the workstream's start (and any `premised → exploring` stage transition) and the orientation surface can anchor from minute zero

#### Scenario: Mode C crystallization BEGIN emit carries the back-filled state (D-arc Stage D3)
- **WHEN** a bare-mode exploration crystallizes to `foo` (Mode C: the user confirmed the crystallization warning; 2+ substantive decisions are back-filled into `explore.md` at creation)
- **THEN** the begin emit carries the BACK-FILLED counts (`decisions_captured` = the decisions written at creation, `open_questions_count` likewise) and a maturity-consistent `next_recommended` per the `Named-mode explore recommendation by maturity` requirement — the trail's first record states true on-disk state, never a knowingly-false zero; this begin emit IS the crystallization's first emit (see the modified crystallization requirement below); the counts are ENGINE-COMPUTED from the back-filled file by the emit surface

#### Scenario: /orbit:architect writes to the architecture trail
- **WHEN** an `/orbit:architect my-program` session reaches a conversation boundary
- **THEN** the emit-layer writes `orbit/architecture/.orbit-runs/architect-<TS>.json` with `change: null` and `doc: "my-program"`

#### Scenario: Bare-mode /orbit:explore writes no JSON
- **WHEN** the user invokes `/orbit:explore` without a name argument
- **THEN** no `.orbit-runs/` JSON is written for that conversation

#### Scenario: /orbit:onboard does not emit
- **WHEN** the user invokes `/orbit:onboard` and completes the walkthrough
- **THEN** no `.orbit-runs/onboard-<TS>.json` is written anywhere in the project

#### Scenario: Bodies instruct the surface, never hand-compose
- **WHEN** any generated body reaches its emit step
- **THEN** the body's instruction is to compose the narrative payload and invoke `orbit emit <command>` — no generated body contains JSON-shape prose for the spine, timestamp/collision rules, or deterministic-fact composition (those are engine-owned per `orbit-emit-composition`)

### Requirement: A body reads its run-summary detail before the session's first run-summary emit

Every workflow body's run-summary emit step in scope SHALL keep in the body when the emit fires, the `orbit emit`
command with its scope forms, and the chat behaviour placed beside them: apply, archive, architect, review, verify,
propose, address-reviews, ff, continue, new and audit-drift, save address-reviews' one exception below. Each SHALL tell the agent, in a read cue carried
byte-equal by all eleven, to read the skill's
`references/run-summary-emit.md` before the session's first run-summary emit and to follow it in composing the payload. That
reference SHALL hold the emit section whole, as the body carried it before this requirement less what a later removal
ruling took from it (address-reviews' batch-mode sentences, `reduce-orbit-phase2`'s R-rop2-12), so the payload detail is
read there and carried by no emit section. Each part of an emit section lands by this table:

| part of an emit section | lands |
|---|---|
| when the emit fires (one-shot, chunk boundary, conversation boundary, the sweep before it) | the body |
| the `orbit emit <cmd>` command and its scope forms | the body (address-reviews' scope forms excepted, below) |
| the read cue telling the agent to read the reference before the session's first run-summary emit | the body, byte-equal in all eleven |
| chat behaviour placed in the section (a completion-prompt override, propose's and ff's second publish segment) | the body |
| each payload field's meaning and shape | the reference, out of the emit section |
| when a field a session event owes is owed (apply's and archive's `judgements`, archive's `deferred_validations`, propose's and ff's `pr_attachment`) | the reference, out of the emit section |
| the token source and the readiness and continuation composition rules | the reference, out of the emit section |
| what the engine owns | the reference, out of the emit section |
| the withdrawn-grant re-emit (apply, archive) | the reference, out of the emit section; read before a refusal can arrive |
| a provenance note naming the owning requirements | the reference, out of the emit section |
| a rationale for the step's shape | the reference, out of the emit section |

One emit step keeps its section whole, outside phase 1 of `reduce-orbit-phase1`: explore's. A body whose moved section was the only place it named a reference its skill ships
(archive's `archive-summary-schema.md`, address-reviews' `run-summary-schema.md`) keeps a sentence naming it, so every
reference stays one level from the body.

The table governs the emit section alone. Text of these kinds elsewhere in a body stays where it is: apply's Step 3
states the `judgements` trigger where Proceed anyway is chosen, and archive's `references/user-validation.md`, read at
its Step 3.2, composes `deferred_validations` where a task is deferred. One mixed paragraph stays whole in its section,
because it is mostly when the emit fires: architect's opening parenthetical, a provenance note beside its timing.
Address-reviews' paragraph on one log per source, which also names a discovered log's provenance fields, and its scope
forms (the `--doc` invocation of an architecture-scoped ingest and the bare one of a walk with no change anchor) leave its
body for its `references/run-summary-emit.md`, which held both whole already, so the body fits the 5,000 estimated tokens
`reduce-orbit-phase2`'s G1 keeps (`cut-review-walk`, Sal's ruling at its apply): the body keeps a one-line pointer saying
that a walk which discovered several sources writes one log for each, and the paragraph's sentences on the order of the
walk are also in the skill's `references/triage-sources.md`, which the body reads before the walk when discovery yields
more than one source. Named limit — the body's emit command shows only `--change`, so a walk of an architecture review
or with no change anchor takes its form from the reference the read cue sends it to before its first emit; a session
that skipped that read invokes `--change` with no change to name, which the emit surface refuses, naming what it lacks.

Named limit — a session that does not read the reference composes without each trigger only the emit section stated
(archive's readiness record is one), and the write gate, which checks a present field's shape and never an owed field's
absence, writes the emit without it; only an absent `consent` is flagged, by audit-drift's consent tripwire. A long
session reads the reference before its first run-summary emit only: when a compaction later drops that read, its later emits are
composed without it, and the cue does not send it back. Whether a read lost to a compaction calls for a re-read or a
read named by an orbit command is weighed at `evaluation` (R-rop-4, R-rop-12).

Named limit — the table's rows are the parts read in the eleven emit sections in scope on 2026-11-17, each paragraph
classified before any text moved; the provenance and rationale rows were found by that classification.

Residual kind: a paragraph of an emit section that is neither when, command, payload detail nor chat behaviour

Residual method: classify each paragraph of every moving section against this table at propose, before any text moves

#### Scenario: Every emit step in scope carries the read cue

- **WHEN** the apply, archive, architect, review, verify, propose, address-reviews, ff, continue, new and audit-drift
  skills are generated
- **THEN** each body's emit step carries the shared read cue once, followed by its `orbit emit` command, and each
  skill ships `references/run-summary-emit.md`

#### Scenario: The reference holds the section as it was

- **WHEN** the apply skill's `references/run-summary-emit.md` is read
- **THEN** it holds apply's emit section whole as the body carried it before this requirement, the `judgements` entry
  after Step 3's Proceed anyway, the token source, `consent` and the withdrawn grant included, and the apply body's
  emit step carries none of those

#### Scenario: The trigger of an owed field is in the reference

- **WHEN** the archive skill is generated
- **THEN** its `references/run-summary-emit.md` holds the readiness record's composition (a `judgements` entry of kind
  `readiness` when the archive concludes a review cadence), and its body does not

#### Scenario: What stays is in the body

- **WHEN** the apply body is generated
- **THEN** its emit step carries the chunk-boundary sentence with `(chain: not a prompt)` and the completion-prompt
  override, and propose's and ff's carry their second publish segment and their completion-prompt override

#### Scenario: Explore is left as it is

- **WHEN** the explore skill is generated
- **THEN** its emit section reads as before this requirement, and it ships no `references/run-summary-emit.md`

#### Scenario: Address-reviews reads its per-source paragraph and scope forms from its reference

- **WHEN** the address-reviews skill is generated
- **THEN** its emit step carries the read cue, the `--change` command and a one-line pointer that one log is written per
  discovered source, and carries neither the per-source paragraph nor the `--doc` and bare forms; its
  `references/run-summary-emit.md` carries both, and its triage step reads `references/triage-sources.md`, which carries
  the paragraph's sentences on the order of the walk
