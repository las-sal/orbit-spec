> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: c1-engine-gates

## Premise

C1 is the first C-arc change (fork plan D9): the **net-new engine capability** that the B-arc
deliberately deferred. With parity reached (B3 archived 2026-06-12), the four editorial workflows
exist as prose-level citizens — the engine (`src/core/artifact-graph/`, ~1,150 lines) still knows
nothing about review. C1 makes the engine review-aware: generalize upstream's singular `apply`
phase into **N gates** (D4), give gates the **non-monotonic completion** concept — pass relative
to a snapshot of inputs, invalidated when inputs change (D3, "staleness is the whole prize") —
and wire `review` as the one new gate (D5: address-reviews is its remediation loop,
review-external an alternate executor, audit-drift a project-wide check).

Engine ground truth (verified 2026-06-12): completion today is `state.ts detectCompleted` —
file-existence, monotonic (37 lines). The only non-artifact phase is `ApplyPhaseSchema`
(`artifact-graph/types.ts:14`): `{ requires: string[], tracks?: string|null, instruction? }`,
state machine (`blocked|ready|all_done`) computed in `instruction-loader.ts`. Schemas come from
YAML (`SchemaYamlSchema`; `spec-driven` is the shipped one). D-b3-2 reserved for C1: the four
editorial baseline specs get MODIFIED deltas when review becomes a gate; the no-forward-look
discipline kept all gate language out of them.

## Decisions

- **D-c1-1 (2026-06-12) — Apply-parity gates with single-voiced recommendations** (resolves
  Q-c1-5). Gates get exactly the enforcement weight upstream `apply`'s blocked state has today:
  the engine computes and reports truth (`status` / `instructions` show gate state with reasons);
  skills surface it and prompt at inflection points; overrides are recorded, never prevented.
  Position 3 (hard enforcement) is out — "too hard," and architecturally incoherent (skills can't
  police a `mv`). **User refinement beyond position 2**: recommendations are SINGLE-VOICED — the
  canonical next step only, never an advertised skip path. The B3-era stock phrasings that
  co-offer "Proceed directly to /orbit:archive if accepting that risk" get MODIFIED in C1: the
  skip option appears ONLY at the inflection prompt when the user actually invokes the gated
  command (archive with unpassed gate → address / proceed-anyway / abort, decision recorded),
  not as a pre-offered alternative in recommendation text. **Why**: observed failure modes in
  real overlay-era use — (1) AI recommends the wrong step (verify instead of full review) or
  nothing; (2) early exit to apply/archive skipping reviews. Maxim: no suggested or implied
  skipping of steps.

- **D-c1-2 (2026-06-12) — Position readout + full-command convention.** Every workflow handoff
  (chat completion text AND `next_recommended` emits) SHALL state (a) WHERE the change is in
  the canonical flow — a position readout derived from engine gate state (e.g.
  `propose ✓ → review(proposal) ✓ → apply ✓ → review(system) STALE → archive blocked-by-gate`)
  — and (b) the FULL next command with all applicable arguments and flags
  (`/orbit:review-external --as system <change>`, never "you should run review-external next").
  **Why**: makes chat history self-documenting for humans; eliminates the
  AI-recommends-wrong-step failure mode by making the engine (not AI judgment) the source of
  the next step. The emit spec's leading-token parse rule already points this direction; C1
  makes the engine the computer of the token.

- **D-c1-3 (2026-06-12) — Review convergence is COMPUTED from the audit trail, not judged by
  the AI; orbit ships a recommended review cadence.** Maxim: bias toward more reviews. Observed:
  the AI consistently wants to end review cycles early ("maximum effectiveness reached") and
  has been wrong — critical issues found AFTER such declarations. Therefore: (a) the review
  gate's pass-condition is engine-computed from `.orbit-runs/` arithmetic (findings-per-
  iteration by reviewer class, repeat rates, class coverage since last artifact change,
  staleness tokens) — never from the AI's self-assessment of review quality; (b) orbit
  prescribes a RECOMMENDED review cadence per phase (exact pattern TBD — Q-c1-7; user sketch:
  something like external → in-context → fresh → in-context) instead of today's ad-hoc
  ordering; the cadence is what the single-voiced recommendations walk the user through.

- **D-c1-4 (2026-06-12) — The prescribed cadence (v1, hard recommendation, tunable later).**
  Orbit ships ONE exact recommended sequence per phase — a hard set of recommendations, NOT a
  configuration surface; future tuning happens via ordinary spec revisions (cheap deltas), not
  config machinery. The v1 cadence (derived from B-arc yield data: independence first while
  artifacts are wrong-est; cheap in-context confirmation after each fix wave; external
  mandatory at system phase where it has out-caught in-context three cycles running):
  - **Proposal phase**: `fresh (or external) → address-reviews → in-context confirm`; repeat
    the independent+address pair while the independent pass yields new findings.
  - **System phase**: `in-context → external → address-reviews → in-context confirm`; external
    repeats (different model per the recommended-session note) while it yields CRITICALs.
  The gate's single-voiced recommendation walks the user through this sequence step by step,
  full command with flags at each step (per D-c1-2).

- **D-c1-5 (2026-06-12) — The computed convergence criterion + `reviewer_class` field.** A
  review phase converges when ALL of: (a) every reviewer class the cadence requires has a pass
  that is FRESH (no artifact-changing event after its `<TS>` token); (b) every pass's findings
  are RESOLVED (its address-reviews run shows `deferred=0, escalated=0`); (c) the most recent
  INDEPENDENT-class iteration (fresh-context or external — never the authoring context) yielded
  0 CRITICAL and 0 new findings. Every term is `.orbit-runs/` arithmetic. Enabler: emits gain a
  first-class `reviewer_class: "in-context" | "fresh" | "external"` field (today the class is
  inferable but scattered across `flags.fresh` and the external `**Reviewer**:` line) — a small
  emit-schema addition (MODIFIED delta on `orbit-run-summary-emit` / conventions spine).

- **D-c1-6 (2026-06-12) — External-handoff state must be affirmatively attested, both
  directions.** Observed inconsistency in real use: whether the prompt commit/push happened
  at all, and how (or whether) it was stated. Two requirements (MODIFIED deltas on
  `orbit-review-external`, riding in C1 alongside its other editorial-spec deltas):
  (a) **Packaging side**: when the handoff preflight is satisfied, the chat output SHALL
  affirmatively state the prompt's committed-and-pushed state with evidence — e.g.
  `Prompt committed (<short-sha>) and pushed to <remote>/<branch>` — never implied by the
  absence of a warning. The pull invocation is emitted only alongside this attestation.
  (b) **External side**: the prompt template's "After completing the review" section SHALL
  require the external AI to state plainly in its chat output that its findings file was
  committed and pushed (with the sha), OR state explicitly that it could not (chat-only
  fallback) — so the human never has to infer whether the findings landed in the repo.

- **D-c1-7 (2026-06-12) — Schema YAML shape: a `gates:` list with a closed two-kind set;
  cadence lives in the YAML; `apply:` stays valid as sugar.** Gates are declared per-schema:
  `{ id, kind: tracked|reviewed, requires: [artifact-or-gate ids], inputs (freshness scope),
  tracks (tracked kind), cadence: [reviewer classes] (reviewed kind), before: <phase>,
  instruction }`. `kind` is deliberately a closed set of two — `tracked` (pass = checkbox
  arithmetic; today's apply) and `reviewed` (pass = D-c1-5 convergence criterion) — no generic
  pass-condition plugins. The cadence array lives IN the schema YAML ("yaml for sure"):
  tuning the review rhythm = editing `schemas/spec-driven/schema.yaml` with a version bump,
  and future schemas can carry different rhythms. Upstream's `apply:` block remains parseable
  and is normalized into the gates list as the `kind: tracked` instance — third-party and
  project-local schemas (resolver supports both) keep working; cherry-pick compatibility
  preserved.

- **D-c1-8 (2026-06-12) — Gate state is a pure function of existing on-disk artifacts; no new
  state files.** `gate_state(change) = f(.orbit-runs/ filename tokens + review JSONs' findings
  and reviewer_class + address-reviews JSONs' resolution_summary/source_path + tasks.md
  checkboxes + artifact existence)`. Nothing new to write, sync, or drift — the audit trail
  the B-arc mandates IS the gate ledger; `status`/`instructions` compute on demand. This also
  fixes the snapshot mechanism (resolves fork Q3 / Q-c1-2): v1 freshness = promoted
  timestamp-token ordering (an `apply-*.json` token newer than the pass token = stale —
  B3's spec'd convergence semantics moved from prose into the engine), with content-hashing
  available later as added emit fields under the same pure-function architecture. And it
  ratifies the principled gate model (resolves fork Q2 / Q-c1-1): file-existence bolt-ons
  can't compute any of this.

- **D-c1-9 (2026-06-12) — v1 edges and non-goals** (resolves Q-c1-3 + Q-c1-4).
  `review-proposal` gates `apply`; `review-system` gates `archive` (archive is the gated
  phase, not a gate). **Verify stays a command** — D5's reclassification holds; it is Pass 0
  inside system review, and a separate verify gate would double-count. **Audit-drift stays
  orthogonal** in v1 — pre-archive findings keep traveling via the archive prompt +
  `archive-<TS>.json` `audit.*` fields; a project-scoped gate concept is a C1 non-goal.

## Open questions

(Inherited from the fork plan — the C-arc catalogue.)

- **Q-c1-1 (fork Q2) — Pragmatic vs principled** ✅ RESOLVED by D-c1-8 (principled; bolt-ons can't compute the criterion).
- **Q-c1-2 (fork Q3) — Freshness snapshot** ✅ RESOLVED by D-c1-8 (v1: promoted timestamp-token ordering; hashes later as emit fields).
- **Q-c1-3 (fork Q4) — Gate edges** ✅ RESOLVED by D-c1-9 (review-proposal→apply, review-system→archive; verify stays a command).
- **Q-c1-4 (fork Q5) — Project-wide check** ✅ RESOLVED by D-c1-9 (audit-drift stays orthogonal in v1; project-scoped gates are a non-goal).
- **Q-c1-5 — Advisory vs enforcing** ✅ RESOLVED by D-c1-1 (apply-parity + single-voiced
  recommendations; skip paths exist only as recorded inflection-prompt overrides).
- **Q-c1-7 — Cadence + convergence criterion specifics** ✅ RESOLVED by D-c1-4 + D-c1-5.
- **Q-c1-6 — Gate state + declaration** ✅ RESOLVED by D-c1-7 (YAML `gates:` list, two kinds, `apply:` sugar, cadence in YAML) + D-c1-8 (pure function of `.orbit-runs/`; no new state files).

## Considered & out

## References

- `orbit/explore/fork-and-orbify/explore.md` — D3 (non-monotonic completion), D4 (generalize
  apply→N gates), D5 (reclassification), Q2–Q5 (inherited above)
- `orbit/architecture/openspec-1.3.1-architecture.md` — engine deep-dive (three-layer model,
  schema/artifact-graph, init/update lifecycle)
- `src/core/artifact-graph/` — graph.ts (167L), state.ts (37L, monotonic detectCompleted),
  types.ts (ApplyPhaseSchema :14), instruction-loader.ts (368L, apply state machine),
  resolver.ts, schema.ts, outputs.ts — ~1,150 lines total
- `orbit/specs/orbit-review/spec.md` + the other three editorial baselines — get MODIFIED
  deltas in C1 per D-b3-2's corollary (no-forward-look kept gate language out)
- `orbit/specs/orbit-run-summary-emit/spec.md` — the `.orbit-runs/` JSON spine gates would
  read as pass records
- `orbit/changes/archive/2026-06-12-b3-net-new-workflows/` — B3's audit trail; the review
  convergence-state logic (5 states) is prose today and is the closest thing to a staleness
  algorithm already spec'd (filename-token comparison)
