# Proposal: d2-architect

## Why

The program layer — the tier ABOVE per-change flow, where multi-change arcs like the D-arc live —
has no engine standing: `orbit/architecture/*.md` docs are hand-maintained prose, and their
hand-copied stage-state lines went stale **three times during the D1 cycle alone** (twice caught
by reviewers, once by a handoff audit). Both this repo and `../home-env` grew the same organ
independently (program/strategy docs that changes are proposed against), which is the evidence
the layer is real. **RULED (arc R-d-1, Sal, 2026-07-08): architecture is FIRST-CLASS ENGINE, not
prose** — the fork thesis applied upward: A→C turned prose conventions into engine-computed state
(gates, fingerprints); D2 does the same for the program layer. This is D-arc Stage D2
(`orbit/architecture/d-arc-arbitered-flow.md` §Stage D2); its four exit criteria are this
change's acceptance tests, and D3 (orientation) hard-depends on the machinery built here.

## What Changes

- **A third declaration tier — architecture — joins the engine** (D-d2-1/3, R-d-1): architecture
  docs keep their judgment-dense prose but declare engine-readable structure via markdown heading
  conventions (`### Stage <id> — <title>`) plus two labeled slots (`Depends-on:`, `Complete:`);
  the parser is fence-aware from day one. The engine reads ONLY stage identity, the two slots,
  and section boundaries — charter prose, exit criteria, premise, rulings, and status log stay
  engine-opaque.
- **Stage state is COMPUTED from disk, never stored** (D-d2-1): `in-change` (an active change
  cites the stage) > `exploring` (a live explore cites it) > `quiescent` (≥1 archived citing
  change) > `premised` (declared only). The propose/archive file moves ARE the transitions.
  **Completion is a user ratification**: the `Complete:` checkbox is the one declared bit; the
  engine renders `complete` only when quiescent AND ratified — quiescent-but-unratified renders
  as awaiting ratification (the readout IS the reminder; no update triggers, per D-d2-4).
- **Citation linkage** (D-d2-2/7): `.openspec.yaml` gains optional
  `architecture: {doc: <name>, stage: <id>}`; named explores gain a minimal `.openspec.yaml`
  carrying the same optional citation; consume-mode propose MERGES the staged metadata forward
  (never bulk-`mv` clobber). Validation fails on either dangling level, naming which.
- **CLI surface**: `orbit architecture status` (computed program position, all docs),
  `orbit architecture show <doc> [<stage>]` (ONE stage section into context — the economy answer
  for the layer's read cost), `orbit architecture validate <doc>` (structure + slots + stage-id
  uniqueness). Change validation additionally resolves the metadata citation.
- **`/orbit:architect` — a new first-class workflow** (D-d2-6): full command anatomy (generated
  skill + thin launcher, four disciplines, emit, every registry, tests, baseline capability);
  scope = create/resume with the format scaffolded by construction, rulings/stages capture,
  render-never-author state, R-d-8 residency sweep, and the completion-RATIFICATION flow (the
  body renders quiescent stages; on the user's yes it writes `Complete: [x] <date> (<who>)`).
  **Flow-entry ruling: architect is an available stance, never a mandatory entry** — architecture
  content born in `/orbit:explore` remains first-class. Generated surface grows 15 → 16 workflows.
- **`/orbit:review --as architecture`** (D-d2-5): review standing WITHOUT a gate — the six
  dogfooded passes (cohesion/traceability, completeness/exit-criteria, dependencies/sequencing,
  layer-fit, route-level alternatives, economy self-audit), evidence in the architecture's own
  trail (`orbit/architecture/.orbit-runs/`), findings ingestible by `/orbit:address-reviews`.
  No program-level gate graph.
- **Audit-drift architecture-staleness check** (D-d2-6): computed-state-vs-prose contradictions,
  a `Complete:` mark on a stage with live citing work, dangling citations — "a stale architecture
  doc is the most expensive drift there is."
- **Archive stage-line garnish** (D-d2-4): a stage-citing change's archive readout renders the
  stage's post-archive computed position (e.g. "stage d2-architect: now quiescent — completion is
  yours to ratify").
- **R-d-9 compliance from birth**: the new `architect` and `review --as architecture` emits carry
  the structured `handoff` section (boot-read pointers, next command, model hint).
- **The arc doc retrofit** (exit criterion 1): `d-arc-arbitered-flow.md` converts to the
  parseable format as the first instance; its hand-maintained `*State:*` lines are DELETED
  (the R-d-4 subtraction for this change). `fork-and-orbify.md` retrofit is deferred.
- **Explicitly out**: program-level gates (D-d2-5); explore-grade stance prose, stage-lifecycle
  helpers, permanent retrofit guidance in the architect body (D-d2-6 rungs 6–8 — skipped until
  felt); model-per-phase mechanization and the handoff-audit mechanization (R-d-9 → D5);
  `orbit list` scanning architecture docs (D3 territory).

## Capabilities

### New Capabilities

- `orbit-architecture-engine`: the architecture declaration tier — parseable-format contract,
  computed stage state + completion-as-ratification, the `architecture:` metadata citation with
  two-level dangling validation, the CLI surface (status/show/validate), the architecture trail
  location, and graceful degradation for non-parseable (legacy prose) docs.
- `orbit-architect`: the authoring workflow — create/resume scaffolding, capture stance,
  render-never-author state, residency sweep, completion-ratification flow, emit shape with the
  R-d-9 `handoff` section, flow-entry non-gatekeeper rule, thin launcher.

### Modified Capabilities

- `orbit-review`: the `--as` mode set gains `architecture` (doc-targeted, not change-targeted);
  per-mode emit persistence gains the architecture-mode path; the `recommendation_options`
  When-to-emit scope extends to the architecture-mode passes; ADDED requirements for the
  six-pass set and the no-gate final assessment.
- `orbit-audit-drift`: ADDED architecture-staleness check (skips gracefully when no parseable
  architecture docs exist).
- `orbit-explore-modifications`: named-mode scaffolding writes the minimal `.openspec.yaml`
  (base fields `schema: spec-driven` + `created` as promotion-superseded placeholders; optional
  `architecture:` citation).
- `orbit-propose-modifications`: the staging-directory move gains the explicit metadata MERGE
  step.
- `orbit-archive-modifications`: ADDED stage-line garnish in the completion readout.
- `orbit-conventions`: the `.orbit-runs/` persistence requirement gains the fourth location
  (`orbit/architecture/.orbit-runs/`); the Internal-run JSON summary format's workflow-kind
  emitter list gains `architect`; the Generated-file disposition's orbit-authored enumeration
  gains `orbit-architect`.
- `orbit-run-summary-emit`: the Emit scope requirement gains `/orbit:architect` (and notes
  review's architecture mode rides review's existing emit).
- `orbit-onboard`: the identity enumeration gains the program-architecture layer.
- `orbit-address-reviews`: the cascade OUT-set's audit-trail category covers all four
  `.orbit-runs/` locations (architecture + explore trails added); ADDED architecture-scoped
  resolution-log destination.

## Impact

- **Engine (new module)**: `src/core/architecture/` — parser (fence-aware), computed stage
  state, citation resolution, validation. **Metadata**: `ChangeMetadataSchema`
  (`src/core/artifact-graph/types.ts`) gains optional `architecture: {doc, stage}`; helpers in
  `src/utils/change-metadata.ts` round-trip it. **CLI**: `orbit architecture
  status/show/validate` registered in `src/cli/index.ts`; change validation gains citation
  resolution.
- **Workflow templates** (`src/core/templates/workflows/`): NEW `architect.ts` (skill + thin
  launcher — must register in EVERY registry; grep-enumerate first, per the B3 sixth-registry
  lesson); edits to `review.ts`, `audit-drift.ts`, `explore.ts`, `propose.ts`, `address-reviews.ts`,
  `archive-change.ts`, `onboard.ts`. Surface 15 → 16 (profiles comment + D15 count mentions
  swept 15→16; CLAUDE.md count updates at archive).
- **Docs**: `orbit/architecture/d-arc-arbitered-flow.md` retrofitted (state lines deleted);
  `orbit/architecture/.orbit-runs/` created.
- **Baseline specs**: 2 new + 9 delta'd capabilities (14 → 16).
- **Tests**: architecture-module unit suite (parser incl. fences, state computation incl.
  precedence + ratification composition, citation validation both-levels); CLI surface tests;
  parity hash additions + re-pins; fidelity markers incl. the new body; exit-criteria checks
  (retrofitted doc parses + status matches reality; dangling citation fails validation;
  review-architecture emit lands in the architecture trail; single-stage `show`).
- **Compatibility**: everything is optional/additive — changes and explores without citations
  behave exactly as today; prose architecture docs without parseable stages are listed as
  legacy/opaque, never errors. No migration.
- **Program**: D-arc Stage D2; exit criteria in the arc doc §Stage D2 are the acceptance tests.
  D3 consumes this machinery. This change practices its own contract while being built (its own
  `.openspec.yaml` will carry the first `architecture:` citation).
