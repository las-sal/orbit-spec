## Context

The engine's completion model is monotonic file existence (`state.ts detectCompleted`, 37 lines);
the only non-artifact phase is `ApplyPhaseSchema` (`artifact-graph/types.ts:14`). Its
`blocked|ready|all_done` state machine lives in `src/commands/workflow/shared.ts:35` (the
`ApplyInstructions.state` type) + `src/commands/workflow/instructions.ts:318` (`state = 'all_done'`);
`instruction-loader.ts` holds the per-artifact `done|ready|blocked` statuses, not the apply phase
machine. (Chunk-1 implementers start in `src/commands/workflow/`; `explore.md`'s earlier
`instruction-loader.ts` attribution is historical.) The B-arc shipped the editorial
layer as prose, and B3's convergence-state logic (the 5 system-mode states, filename-token
staleness comparison) is a hand-executed prototype of exactly the computation C1 moves into the
engine. D-b3-2 explicitly reserved the editorial baselines' gate language for this change.

The design was driven by the user's three observed failure modes and their maxims (full record:
`explore.md`, D-c1-1..D-c1-9 — wording there is authoritative): no suggested/implied skipping;
always state position + the full next command; bias toward more reviews with convergence measured,
not judged. Empirical basis for the cadence and criterion: B-arc yield data — findings-per-
iteration decays per reviewer *class* and resets when an unexposed class engages (B3: fresh iter-1
found 12, in-context iter-2 found 1, external then found 7 after in-context system found 2; same
pattern in B2 and the overlay era's 3-of-3).

## Goals / Non-Goals

**Goals:**
- Gate truth computed by the engine; rendered single-voiced at every handoff (position readout +
  one canonical full command).
- Review convergence as `.orbit-runs/` arithmetic; prescribed v1 cadence; `reviewer_class` field.
- Upstream/third-party schema compatibility (`apply:` sugar); no new on-disk state.

**Non-Goals (with owners):**
- Hard enforcement (position 3) — rejected (D-c1-1); architecturally incoherent here.
- Content-hash freshness — deferred precision upgrade; the pure-function architecture admits it
  as added emit fields later (D-c1-8).
- Project-scoped gates / audit-drift as a gate — stays orthogonal (D-c1-9); future change.
- Cadence configuration machinery — the cadence is data in the shipped schema YAML; tuning is a
  schema revision, not a config system (D-c1-4).
- Generic pass-condition plugins — `kind` is a closed set of two (D-c1-7).

## Decisions

(Ratified in `explore.md` D-c1-1..D-c1-9; restated with implementation consequence.)

### Gate model: apply-parity, single-voiced (D-c1-1; resolves fork Q2 via D-c1-8)

Gates carry exactly the enforcement weight `apply`'s blocked state has today. The engine reports;
skills surface and prompt at inflection points; overrides are recorded (`proceeded_despite_*`
idiom), never prevented. Recommendations are single-voiced: the canonical next step only. The
B3 stock phrasings' skip clauses move out of recommendation text and into the inflection prompt
fired only when the user invokes a gated command with an unpassed gate.
**Alternatives considered & out**: pure advisory (fails the no-skipping maxim — advice without a
computed canonical step is the surface the AI currently mangles); hard enforcement (user-rejected,
"too hard"; skills can't police a `mv`); pragmatic file-artifact staleness bolt-on (fork Q2 —
cannot compute the convergence criterion or position readout).

### Schema shape (D-c1-7)

```yaml
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal, specs, design, tasks]   # runnable when these exist
    inputs:   [proposal, specs, design, tasks]   # freshness scope
    cadence:  [independent, in-context]
    confirm:  no-new-findings                    # clause-(c) predicate
    before:   apply
  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md
  - id: review-system
    kind: reviewed
    requires: [apply]                            # gates can require gates
    cadence:  [in-context, external, in-context]
    confirm:  findings-resolved                  # relaxed: external repeats only on CRITICALs
    before:   archive
```

`kind` is closed: `tracked` (checkbox arithmetic) | `reviewed` (convergence criterion). The
upstream `apply:` block remains valid; the loader normalizes it to the `kind: tracked` gate when
no `gates:` list declares an `apply` id (and validates against double declaration). Cadence lives
in the YAML — per-schema, tunable by version-bumped schema edits. `schemas/spec-driven/schema.yaml`
goes to `version: 2`.

### State computation (D-c1-8)

`gate_state(change) = f(.orbit-runs tokens, review JSONs (findings, reviewer_class),
address-reviews JSONs (resolution_summary, source_path), tasks.md, artifact existence)` — computed
on demand by `status`/`instructions`; nothing new written. v1 freshness: an `apply-*.json` token
newer than a pass's token marks the pass stale (the exact semantics `orbit-review`'s baseline
already specifies for external staleness, generalized). Hash upgrade path: future emits add
normalized content hashes; the function gains a clause; architecture unchanged.

### Convergence criterion + reviewer_class (D-c1-3, D-c1-5)

A `reviewed` gate passes when ALL of: (a) every `cadence` SLOT has a FRESH pass of its class whose
token is strictly later than the prior slot's (ordered slots, not a set — so the trailing
`in-context` confirm needs a distinct later pass); (b) every pass's findings are RESOLVED
(`deferred=0, escalated=0` in its address-reviews run); (c) the latest independent-class iteration
satisfies the gate's per-gate `confirm` predicate — `no-new-findings` (proposal: 0 CRITICAL + 0 new
findings) or `findings-resolved` (system: 0 CRITICAL + that pass's findings resolved, so a resolved
external converges even though external repeats only on CRITICALs). Never AI-judged. The
`confirm` choice lives in the schema YAML alongside `cadence`, reconciling clause (c) with the
system gate's Path A/B "PASSED" phrasing (a first external with resolved findings must pass).
Enabler: `reviewer_class: "in-context" | "fresh" | "external"` on review-cycle emits (ADDED
requirement in `orbit-run-summary-emit`); absent field → engine infers class
(`flags.fresh` → fresh; external-*.md provenance → external; else in-context) so existing trails
keep working.

### Cadence v1 (D-c1-4)

Proposal: `independent (fresh or external) → address-reviews → in-context confirm`, repeating the
independent+address pair while the independent pass yields new findings. System:
`in-context → external → address-reviews → in-context confirm`, external repeating (different
model) while it yields CRITICALs. Hard recommendation, not config; revisions are schema edits.

### Position readout + full commands (D-c1-2)

Handoffs render the engine-computed flow position (`propose ✓ → review(proposal) ✓ → apply ✓ →
review(system) STALE → archive blocked-by-gate`) and the complete next invocation with flags
(`/orbit:review-external --as system <change>`). The engine computes the canonical-next token;
skills render it verbatim — the AI never composes the recommendation from judgment.

### External-handoff attestations (D-c1-6)

Packaging: preflight-satisfied output affirmatively states `Prompt committed (<short-sha>) and
pushed to <remote>/<branch>` alongside the pull invocation — never implied by warning-absence.
External side: the template's "After completing the review" requires the external AI to state its
findings commit/push (sha) or its chat-only inability. Both as MODIFIED deltas on
`orbit-review-external`.

### Edges (D-c1-9; resolves fork Q4/Q5)

`review-proposal → before: apply`; `review-system → before: archive`. Archive is a gated phase,
not a gate. Verify stays a command (D5 holds — it is Pass 0 inside system review; a separate gate
would double-count). Audit-drift stays orthogonal (findings keep traveling via the archive prompt
+ `archive-<TS>.json` `audit.*` fields).

## Risks / Trade-offs

- [Timestamp freshness over-triggers on trivial edits] → apply-parity makes a false-stale cost
  one inflection prompt, not a forced re-review; hash upgrade path stays open (D-c1-8).
- [v1 freshness is vacuous for the proposal gate] → the only v1 artifact-changing event is
  `apply-*.json`, which cannot exist before apply, so a `review-proposal` pass never goes stale in
  v1 (artifact edits during the proposal phase don't invalidate it). Accepted for v1: the proposal
  gate still enforces class coverage + resolution + confirmation; only the staleness dimension is
  inert there. `inputs` is declared for the content-hash upgrade that closes this gap (D-c1-8); the
  limitation is stated normatively in the freshness requirement.
- [MODIFIED stock phrasings break habits formed on B3 text] → deliberate (the old text advertised
  skips); the phrasing contract is exact-text spec'd, so the deltas are explicit and reviewable.
- [Gate-aware status misreads legacy/partial `.orbit-runs/`] → inference fallbacks specified
  (missing reviewer_class → infer; unparseable tokens → treated as absent, per the baseline's
  edge-case scenario the engine inherits); engine unit tests cover trails from the actual B2/B3
  archives as fixtures.
- [Schema v2 vs existing `.openspec.yaml` pins] → loader accepts v1 schemas unchanged
  (`apply:`-only normalization path is the v1-compat path); version bump only ships in
  `spec-driven`.
- [Scope creep into config machinery] → closed two-kind set and YAML-as-tuning-knob are explicit
  non-goals fences.

## Migration Plan

Chunked apply (preamble in tasks.md): engine core → schema+CLI surface → editorial bodies/specs
alignment → tests+verification. Each chunk lands green (`npm test`); rollback = revert. Existing
audit trails need no migration (pure-function reader with inference fallbacks). After C1 lands,
`orbit update --force` refreshes installed surfaces with the rephrased bodies.

## Open Questions

(none — all resolved in explore.md; non-goals carry owners above.)
