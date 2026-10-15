## Why

`architect-first` made every strict start surface name `/orbit:architect` first, and left the user docs as a prose
surface "pending stage docs-refinement", a named limit in `orbit-architect`'s `Start surfaces name the architect
workflow first`. Until this change lands, the README Quickstart, getting-started and workflows still lead with
`/orbit:explore`, and `v2.0.1` cannot ship docs that contradict the tool they describe (see explore.md, Premise).

## What Changes

- **README.md**: "Your first change" opens with `/orbit:architect <program>`; the command table lists
  `/orbit:architect` first (D-dr-5).
- **docs/getting-started.md**: a new step 0 runs `/orbit:architect <program>` to declare the work, and the
  `add-dark-mode` walk that follows is that program's stage's change. The page names `/orbit:explore` alone as the
  working path for a one-off fix, after architect and never as the default (D-dr-1). The walk ends with a closing
  architect session that ratifies the stage, and README's list ends the same way.
- **docs/workflows.md**: "One change, start to finish" opens its flow block with architect; "Step by step" opens
  after an architect session; "Exploring first" and the
  "Explore when unsure" practice place explore after architect.
- **docs/commands.md**: the Quick reference lists `/orbit:architect` first (D-dr-5).
- **docs/workflow-engine.md**: the flow diagram starts at architect; **docs/concepts.md** gains a sentence placing
  explore after architect (D-dr-6).
- **A new check** in `orbit-user-docs`: an exact list of (page, heading) START SECTIONS, in each of which the first
  start command named is `/orbit:architect` (D-dr-4).
- **`orbit-architect`'s start-surfaces table**: the user-docs row stops being "pending stage docs-refinement" and
  points at the new check; its named limit ("until then the docs still lead with explore") is removed.
- **No CLI-output re-capture**: the docs quote no output that `cli-says-orbit` or `architect-first` changed
  (D-dr-3, measured); the charter's re-capture item is discharged by that probe, recorded in design.md.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-user-docs`: ADDS `The user docs' start sections name the architect workflow first`; MODIFIES `The user docs
  are a checked surface, gated by an exact pending-rewrite list` so its file-local check set names the new check.
- `orbit-architect`: MODIFIES `Start surfaces name the architect workflow first` — the user-docs row becomes a
  checked prose surface and its named limit is dropped.

## Impact

- User docs: `README.md`, `docs/getting-started.md`, `docs/workflows.md`, `docs/commands.md`,
  `docs/workflow-engine.md`, `docs/concepts.md`.
- Tests: a new `test/core/user-docs/start-sections.test.ts` and its helper in `test/helpers/user-docs.ts`.
- No CLI, engine or generated-body change; no version bump (the `release` stage cuts `v2.0.1`).
