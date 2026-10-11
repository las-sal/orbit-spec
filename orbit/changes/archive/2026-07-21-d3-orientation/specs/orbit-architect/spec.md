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
is owned here; the review emit itself is specified in `orbit-review`).

#### Scenario: Emit lands in the architecture trail with handoff

- **WHEN** an architect session against doc `my-program` reaches a boundary
- **THEN** `orbit/architecture/.orbit-runs/architect-<TS>.json` is written with `doc: "my-program"`, the spine fields, and a `handoff` object whose `boot_sequence` entries are pointers into existing artifacts
