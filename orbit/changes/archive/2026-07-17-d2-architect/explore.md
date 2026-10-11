> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: d2-architect

## Premise

D-arc Stage D2 (`orbit/architecture/d-arc-arbitered-flow.md`, Stage D2 section — the arc owns
premise and exit criteria per R-d-7; this explore owns decision detail). **RULED (R-d-1): the
program layer gets FIRST-CLASS ENGINE standing, not prose.** The engine grows a third declaration
tier — architecture (cross-change program) above schema (per-change flow) — both data, both
engine-interpreted. Five concrete pieces named by the arc: (1) parseable doc structure (this arc
doc retrofits as the first instance), (2) `.openspec.yaml` `architecture:` citation linkage,
(3) computed program position (stage state as a pure function of disk — extending C1's gate
principle upward), (4) CLI surface (`orbit architecture show/status`; a session loads ONE stage
section, not the whole doc), (5) trail + review standing (`.orbit-runs/` for the architecture;
`/orbit:review --as architecture` from a generated body — pass set dogfooded by hand 2026-07-08).

Sized as a C1-class engine change — the arc's biggest single effort. D3 depends on D2 (program
position is D2 machinery). The arc names the remaining design territory, which is exactly this
explore's job: the parseable format itself, update triggers, explore/change linkage details, and
how much of the review mode ships in v1.

## Decisions

- **D-d2-1 (2026-07-13, Sal) — Stage state is COMPUTED from disk; completion is a USER
  RATIFICATION.** The engine derives the state token from observable facts (precedence:
  any active change cites the stage → `in-change`; else a live explore cites it → `exploring`;
  else ≥1 archived citing change → quiescent; else → `premised`) — the transitions ARE the file
  moves propose/archive already perform, so the mapping self-heals and re-exploration flips a
  quiescent stage back honestly. Crucially, **quiescent ≠ complete**: whether exit criteria are
  met is a judgment, so the stage section carries ONE declared (not computed) bit — a completion
  mark the user sets, with date. Engine renders `complete` only when observation says quiescent
  AND the user ratified; quiescent-but-unratified renders as exactly that ("all work archived;
  completion awaiting ratification"). This is D1's thesis at the program layer: gate `passed` =
  eligible-not-commanded ↔ stage quiescent = eligible-to-be-called-complete, the arbiter
  ratifies. Subtraction (R-d-4): every hand-maintained `*State:*` line in the arc doc is DELETED
  at retrofit — the stale-state bug class (hit twice in the D1 cycle) becomes structurally
  impossible.
- **D-d2-2 (2026-07-13, Sal) — Named explores gain a minimal `.openspec.yaml`** (same metadata
  genre as changes — one schema, one parser; NOT a new filename). Carries the optional
  `architecture:` citation so the engine never parses AI-authored prose for identity (R-d-1
  applied to linkage; name-match rejected — D1's explore was `explicit-lifecycle-consent`).
  Absence of the file/field = unlinked explore (no ceremony for standalone explores). Consume-mode
  propose MERGES the staged metadata into the change's freshly-written `.openspec.yaml` (citation
  carries forward; fresh `schema`/`created`/`schema_version` win) — explicit handling, never the
  bulk `mv` (precedent: propose already moves `.orbit-runs/` explicitly). Verify at propose time
  that no existing tooling treats `.openspec.yaml` presence outside `orbit/changes/` as
  is-a-change.
- **D-d2-3 (2026-07-13, Sal) — The parseable format is MARKDOWN HEADING CONVENTIONS + two
  labeled slots; the parser is fence-aware from day one.** Stage sections declare
  `### Stage <id> — <title>` (id from heading), a `Depends-on:` labeled line (sequencing render;
  D3's will cite d2-architect), and a `Complete:` checkbox line — the D-d2-1 ratification mark,
  checked form `[x] <date> (<who>)`, riding the engine's existing tracked-checkbox genre. The
  engine reads ONLY: stage id/title, the two slots, and section boundaries (heading-to-heading
  slicing IS `orbit architecture show <stage>` — one stage section into context, never the whole
  doc). Charter prose, exit-criteria content, premise, rulings, and status log stay engine-opaque.
  Rejected: YAML frontmatter/islands (second syntax in a human document) and sidecar YAML (two
  files claiming one truth — the C2 divergence class). Convention fragility (typo'd heading,
  duplicate id) is handled the same way specs handle it: `orbit architecture validate` (structure
  + citations per exit criterion 2) and the audit-drift hook. Fence-awareness is non-negotiable —
  `requirement-blocks.ts` earned that lesson at C1's archive. (Correction 2026-07-14, review
  iter 1: this entry originally also claimed the arc doc itself contains fenced diagrams — it
  contains none; the fences are in `fork-and-orbify.md`. The C1 lesson carries the justification
  alone.)
- **D-d2-4 (2026-07-14, Sal) — No automatic doc updates, no new triggers.** Nothing edits the
  architecture doc when a stage's change archives — the archive move IS the state transition
  (computed, D-d2-1). The doc's manual surface shrinks to exactly two things, manual by design:
  status-log entries (append-only ledger, narrative) and `Complete:` ratification marks (the
  arbiter's act). The reminder-to-ratify is the READOUT itself: the status surface renders
  quiescent-awaiting-ratification until the box is checked. One garnish ratified in: when a
  stage-citing change archives, the archive completion readout includes the stage line (e.g.
  "stage d2-architect: now quiescent — completion is yours to ratify") — one line riding the
  existing position render, not a new mechanism.
- **D-d2-5 (2026-07-14, Sal) — Architecture review ships WITHOUT a gate in v1.** D2 delivers
  review STANDING: the generated `--as architecture` body (6-pass set from the 2026-07-08 hand
  dogfood: cohesion/traceability, completeness/exit-criteria, dependencies/sequencing, layer-fit,
  route-level alternatives, economy self-audit), the architecture's own `.orbit-runs/` trail, and
  the emit schema — but NO program-level gate graph. Rationale: every seam the arc crosses is
  already gated per-change; no incident motivates a gate over the arc itself, and pre-need
  enforcement is the over-engineering class the hooks deferral (R-d-2) rejected. Same shape as
  D1: skip the enforcement, ship the evidence — the trail means a future gate (if ever warranted)
  has something to compute over, and the 2026-07-08 review's narrative-only evidence gets a real
  emit home going forward.
- **D-d2-6 (2026-07-14, Sal) — `/orbit:architect` ships in v1: FULL first-class anatomy,
  floor-plus-ratification scope; and it is an available stance, NEVER a mandatory flow entry.**
  Two axes settled. (Integration — not negotiable): the body gets the complete command anatomy
  every orbit command has — generated SKILL.md + thin launcher (D14), four-disciplines block,
  `architect-<TS>.json` emit on the universal spine, registration in EVERY registry (B3 lesson),
  parity/fidelity/on-disk tests, a baseline `orbit-architect` capability spec, claude+codex
  install (D15). (Scope — the ratified ladder rungs 1–5): create/resume with the parseable format
  scaffolded by construction; capture rulings/stages/considered-out during architecture sessions;
  render engine-computed state and NEVER hand-author it (the D-d2-1 contract enforced at the body
  layer); R-d-8 residency sweep + emit at boundaries; and the completion-RATIFICATION flow — the
  body renders quiescent stages and, on the user's yes, writes `Complete: [x] <date> (<who>)`
  (the arbiter's mark as a recorded interaction). Skipped until felt (rungs 6–8): stage-lifecycle
  helpers, explore-grade stance prose (the most token-expensive, least mechanical body material —
  architecture thinking already flows through explore naturally), permanent retrofit guidance
  (the arc-doc retrofit is a one-time act of D2's apply). The audit-drift architecture-staleness
  hook ships in v1 per the ratified standing recommendation (rides the parser + computed state
  D2 builds anyway; "a stale architecture doc is the most expensive drift there is").
  **Flow-entry ruling (Sal): starting with `/orbit:explore` remains fully legitimate** — architect
  is not a gatekeeper; architecture content born in explore sessions (how this very arc was built)
  is a first-class path, no body recommends architect as required entry, and no drift check flags
  architecture material for having originated in explore.
- **D-d2-7 (2026-07-14, Sal — resolved at propose)** — Citation field shape + validation
  semantics: structured object `architecture: {doc: <name>, stage: <id>}` (in-genre with
  `base_fingerprints`; Zod-natural; extensible), validation fails on BOTH dangling levels — doc
  file missing under `orbit/architecture/`, or stage id not declared in an existing doc — with
  the error naming which level failed; the citation stays re-pointable by hand-edit (validation
  checks resolvability; no immutability enforcement, consistent with the rest of metadata).

## Open questions

(none — Q-d2-3's residue resolved to D-d2-7 at propose, 2026-07-14)

## Considered & out

(none yet)

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — the arc (Stage D2 section = this stage's charter;
  R-d-1 ruling text; exit criteria; the doc itself is the retrofit target and live genre specimen).
- `orbit/architecture/fork-and-orbify.md` — genre precedent #1 (the A→C program plan).
- `../home-env/architect-host-first-strategy.md` + `vendor-backends-strategy.md` — genre
  precedents #2/#3 (independent growth of the same organ).
- `src/core/artifact-graph/gates.ts` + `trail.ts` — C1's computed-state machinery (the principle
  D2 extends upward); `state.ts`, `resolver.ts`, `schema.ts` — the schema tier D2 parallels.
- `src/core/artifact-graph/types.ts` (`ChangeMetadataSchema`) — C2/D1 precedent for metadata
  extensions (`base_fingerprints`, `schema_version`, `consent_era_from`) that Q-d2-3's
  `architecture:` citation follows.
- `src/core/templates/workflows/review.ts` — the review-body genre `--as architecture` extends;
  arc status log 2026-07-08 records the hand-dogfooded architecture review (0 C / 5 W / 3 S) and
  its working pass set: cohesion/traceability, completeness/exit-criteria,
  dependencies/sequencing, layer-fit, route-level alternatives, economy self-audit.
- Arc status log 2026-07-13 (D1 completion entry) — cycle lessons queued for D4 but relevant to
  D2's review standing: severity-aware confirm vocabulary; mechanizable contradiction sweep.
- **Arc ruling R-d-9 (handoff posture, ratified 2026-07-14 during this explore)** — constrains
  D2's proposal: the new `architect-<TS>.json` and `review-architecture` emits must carry the
  structured `handoff` section from birth (clause b), and D2's phase seams get hand-run handoff
  audits until D5 mechanizes them (clause c). Model-per-phase hints (clause a) are D5 machinery —
  D2 only needs to not contradict them in readout prose.

**Code touchpoints (where the work lands — R-d-8 boot material)**:

- New engine module home: `src/core/architecture/` (by analogy to `src/core/artifact-graph/` —
  parser, computed stage state, validation). Nothing exists there today.
- CLI registration: `src/cli/index.ts` (where `orbit architecture show/status/validate`
  subcommands register; existing commands under `src/commands/` show the genre).
- Metadata extension: `ChangeMetadataSchema` in `src/core/artifact-graph/types.ts` gains the
  optional `architecture:` citation (D1/C2 precedent fields sit right there); read/write helpers
  in `src/utils/change-metadata.ts` round-trip it for free once declared.
- Propose merge step: `src/core/templates/workflows/propose.ts` (consume-mode Step 0d move —
  the explicit `.orbit-runs/` move is the precedent slot for explicit metadata merge).
- New/edited workflow bodies: `src/core/templates/workflows/` — **the B3 all-registries trap**: a
  new generated workflow must register in EVERY registry (B3's external review found a sixth in
  `src/commands/init.ts`); grep for an existing body's name (e.g. `audit-drift`) across `src/` to
  enumerate the current registry set before adding `/orbit:architect` or `--as architecture`.
- Tests: parity hash re-pins (`test/core/templates/skill-templates-parity.test.ts` — new bodies
  join the hash maps), fidelity markers (`orbit-content-fidelity.test.ts` + on-disk
  `orbit-generated-surface.test.ts`), and a new architecture-module unit suite (genre:
  `test/core/artifact-graph/gates.test.ts`).
- The retrofit target: `orbit/architecture/d-arc-arbitered-flow.md` itself (first parseable
  instance; its `*State:*` lines are deleted by the retrofit per D-d2-1). `fork-and-orbify.md`
  retrofit is optional/deferred.
