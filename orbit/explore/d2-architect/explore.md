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
  `requirement-blocks.ts` earned that lesson at C1's archive, and the arc doc itself contains
  fenced diagrams with stage-like text.
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

## Open questions

- **Q-d2-3 (residue) — Citation field format + validation semantics**: the carrier is decided
  (D-d2-2); still open: the field's exact shape (`architecture: {doc: <name>, stage: <id>}` vs a
  single `architecture: <doc>/<stage>` token), and what validation fails on — dangling doc name,
  dangling stage id within a real doc, or both (exit criterion 2 says "fails on a dangling
  citation"). Also: is the citation immutable after propose, or re-pointable?
  Standing recommendation: none yet (proposal-level detail unless discussion surfaces a fork).

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
