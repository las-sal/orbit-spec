## MODIFIED Requirements

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
the user may declare ANY stage ended — the only route for a `premised` stage, which no offer
reaches — and the body writes the same production with the same insert rule. The three ways a mark
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

#### Scenario: Unprompted ended on a premised stage

- **WHEN** the user declares, inside an architect session, that a stage with no citing artifacts has ended
- **THEN** the body writes the ended production with the insert rule, no prompt fires, the emit's `stages_ended` lists the id, and the stage renders `ended`

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
