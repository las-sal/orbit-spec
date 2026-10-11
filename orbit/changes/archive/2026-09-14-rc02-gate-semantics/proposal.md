## Why

The reviewed gate converges on cadence-slot arithmetic rather than on consequence, and the cost
is measured. Across the D-arc, findings per change roughly tripled as the machinery matured —
c1 41, c2 18, d1 27, d2 56, d3 51, d4 77, d5 100, d6 131, a strong trend rather than a monotone
one — with d2 onward running 14 to 17 passes each; from d3 onward, later passes landed 60–100% of
their findings on files the previous walk had just edited. D6 archived through a recorded
`gate_overridden` after seven system passes and 42 post-apply findings walked to zero, because
no independent pass ever came back clean over a tree that changed under every pass. Three of
those 131 findings were the defects that mattered, and all three arrived with a reproduction.

Three properties of the gate's computation produce that cost, independent of any reviewer's
quality:

- **SUGGESTIONs gate.** R-d-10 (Sal, 2026-07-16) ratified that suggestion-grade findings must not
  repeat the independent loop; the tracked follow-up (issue #8) never shipped, and the sanctioned
  interim path has been a recorded override. Convergence clause (b) still requires every finding
  of every severity resolved, and clause (c) counts a new SUGGESTION as a new finding.
- **The loop has no declared end.** `confirm: findings-resolved` renders the reason "cadence
  repeats external until none" — a loop whose only exit, when passes keep finding things, is the
  override. The schema's system cadence `[in-context, external, in-context]` writes that loop
  down: a leading pass of the class that yielded one CRITICAL in roughly 25 across the arc, and a
  trailing slot that must follow the external no matter what the external found.
- **Nothing measures what a change has spent.** The engine reports whether the gate converged and
  never what converging has cost, so "we are past diminishing returns" has been a judgment made
  outside the tool, every time.

This is stage rc02 of `clean-up-review-cycle` (Phase 1, goal G1: a change's post-apply cadence
converges in at most three passes with no CRITICAL, or five with one, and the archive records
residual risk instead of an override). The stage was SPLIT on 2026-09-12 after its first fresh
proposal review measured it at 40 tasks against R-crc-1's ceiling of under 20: what a severity
MEANS — the consequence definitions and the CRITICAL evidence tax — moved to the sibling stage
`rc02b-severity-ladder`. What the ENGINE COMPUTES stays here. The clauses need only the three
severity NAMES, which already exist, so neither stage blocks the other.

## What Changes

- **SUGGESTIONs stop gating.** Convergence clauses (b) (resolution) and (c) (the confirm
  predicate) become substantive-only — CRITICAL and WARNING — for every reviewed gate. The closed
  two-value `confirm` set stays closed; issue #8's third value is superseded, its intent shipped.
  Clause (b) checks EXISTENCE first (a pass carrying a substantive finding must have a record
  referencing it), then asks ONE readability question of that record: is `resolutions` a non-empty
  array whose every element carries a recognised severity and a recognised disposition, read from
  `outcome` or the legacy key `status`. A readable record is read per entry, in PREFERENCE to the
  severity-blind `resolution_summary`; every other shape falls back whole to the bare counts, and an
  unreadable record with no readable summary leaves the pass unresolved.
- **Every cadence slot gains a second ordering constraint.** A satisfying pass must now be later
  than every `address-reviews` record resolving a PREVIOUS slot's pass findings, not only later
  than that slot's pass. This makes a following slot a check on the walk rather than a pass that
  merely arrived late. It applies to BOTH gates, including the otherwise-untouched proposal cadence,
  where a flow that ran both passes and then walked them in one sitting will now need a third pass.
  That cost is intended: an unchecked walk is the hole the constraint closes.
- **Clause (c) is UNCHANGED except on one axis.** The shipped predicate still reads the most recent
  independent pass; only the new-finding match becomes substantive, so a new SUGGESTION no longer
  repeats the loop. A rewrite selecting a confirming pass SET with a succession rule was carried
  here through five review passes and REMOVED on 2026-09-14 under R-crc-8's sectional trigger; the
  new stage `rc02c-confirmation-semantics` owns it and specifies it as a decision table.
- **`blind-pair` joins the cadence-entry vocabulary.** A `blind-pair` slot is satisfied by two
  passes of distinct independent classes (one `fresh`, one `external`), both fresh under the
  freshness rule, with no walk of either pass's own findings recorded strictly between their
  tokens. The EARLIEST qualifying pair is taken, so the slot composes with clause (a)'s greedy
  earliest-satisfying walk instead of contradicting it. This is R-crc-4's canonical cadence made
  computable.
- **A review budget is declared per gate and reported BESIDE the state.** The REPORTED spend counts
  independent passes on the gate's mode across the whole trail, stale ones included; the EXHAUSTION
  TRIGGER counts only passes fresh against the current state, so an apply landing mid-cadence
  cannot report exhaustion during the re-cover the gate is itself asking for. Exhaustion surfaces
  as a boolean on the gate status, a spend clause in the reason, and a distinct position-readout
  token — NOT as a new gate state. Spend and convergence are orthogonal: a budget-exhausted gate
  is precisely `unpassed`, and every closed-set consumer of gate state keeps working untouched.
- **BREAKING (schema): `spec-driven` goes to version 4.** The system cadence becomes
  `[blind-pair, in-context]` and both reviewed gates declare `budget: 3`. The proposal cadence is
  otherwise unchanged. The trailing in-context slot survives deliberately as the check on the walk
  that resolved the pair's findings; rc03 renames it `verification` when it ships the genre.
- **The gate reason becomes the teaching surface.** It names the rule that fired and the rule
  about to fire — an open blind pair is announced before the first pass is walked, so the
  sequential habit does not silently make the pair unformable on that state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orbit-lifecycle-consent`: one scenario made version-agnostic — it asserts that a scaffolded
  change records `schema_version: 3`, which the v4 bump falsifies.
- `orbit-run-summary-emit`: one scenario's external-slot wording generalized — the new cadence
  vocabulary means an external return may satisfy a bare `external` slot, an `independent` slot, or
  the external half of a `blind-pair`.
- `orbit-engine-gates`: the reviewed-gate pass condition becomes severity-aware in clause (b) and in
  the new-finding match; the cadence-entry vocabulary gains `blind-pair` with
  its blindness and earliest-pair rules; the gate declaration gains `budget`; a new requirement
  defines the budget's count, its reporting beside the state, and its readout token; a new
  requirement defines the reason as the teaching surface; the status readout and single-voiced
  canonical-next requirements take the new token and slot name; the spec-driven declaration
  requirement moves to version 4.

## Impact

- **Engine**: `src/core/artifact-graph/gates.ts` (convergence clauses, the blind-pair slot
  predicate, the budget count and report, reason composition),
  `src/core/artifact-graph/trail.ts` (finding severity; per-entry resolution severity and
  outcome), `src/core/artifact-graph/types.ts` (the cadence entry, the `budget` field),
  `src/core/artifact-graph/schema.ts` (gate-id-naming validation for both new fields).
- **Schema**: `schemas/spec-driven/schema.yaml` to version 4.
- **The two gate-row projections**: `src/core/artifact-graph/instruction-loader.ts` (the
  `GateStatusRow` field-by-field JSON projection) and `src/commands/workflow/status.ts` (the human
  gate row) must carry `budget`, `independentSpend`, and `budgetExhausted`, or the new fields never
  reach either surface.
- **Unchanged by design**: `src/core/orientation.ts`, `src/commands/workflow/instructions.ts`, and
  the archive and apply bodies' prompt conditions. Reporting spend beside the state rather than as
  a state is what keeps them unchanged.
- **Tests**: the gate-model unit suite gains the severity-aware, blind-pair, budget, reason, and
  legacy-trail cases; a v3-archived-change computation test carries the no-migration claim.
- **Not touched**: the severity ladder and its evidence tax (rc02b), the review genres and prompt
  templates (rc03), the cadence line and `residual_risk` (rc04), the walk's sweep set (rc08).
