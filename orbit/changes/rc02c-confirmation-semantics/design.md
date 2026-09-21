# Design: rc02c-confirmation-semantics

## Context

Clause (c) has been redesigned twice and failed twice — rc02's attempts produced a non-terminating
rule and then a falsely-converging one. The exploration (`explore.md`) establishes why both failed
for the same reason: they were better answers to a question the cadence does not ask.

The full reasoning, the twelve-cell decision table that produced and then retired the `stands`
predicate, and the measurements taken against real trails live in `explore.md` and
`sketches/stands-decision-table.py`. This design records what SHIPS.

## Decisions

### D1 — clause (c) is REMOVED from the convergence computation

Not re-pointed at a better pass. Removed. See `explore.md` D-rc02c-5/6: the cadence ends on a walk
of a review with findings, that is correct, and only 3 of 11 archived changes ever had an
independent pass standing clean on the final state. A predicate demanding what the terminal state
almost never provides is measuring the wrong thing.

Two defects disappear rather than being fixed. `independents[length - 1]` selected a single pass, so
a blind pair's earlier-finishing member could carry a CRITICAL the predicate never saw; with nothing
selecting a pass, the case cannot arise. And the demand for "one further independent pass on the
walked state" — the sentence that drove rc07 to a fourth over-budget pass — has no source left.

**Independent review is NOT weakened.** Clause (a) coverage still requires the blind pair and the
in-context slot. Clause (c) only ever governed what happened after them.

### D2 — the readiness obligation is NOT shipped here, and the sequencing is the reason

**Decided at propose, not in the exploration.** `explore.md` D-rc02c-6 frames clause (c) as
REPLACED by "does a readiness record exist, and does it post-date every independent pass it
cites?" That obligation is correct and it is `rc04-readiness-record`'s to build — the record is
rc04's artifact.

Shipping the requirement HERE, before rc04 ships the record, would make every gate fail clause (c)
for want of a record no command yet writes. That is precisely the defect this change removes: a
demand nothing can satisfy. So the work splits on the natural seam — **rc02c SUBTRACTS the
convergence predicate; rc04 ADDS the readiness obligation** — and between the two, the gate reports
on coverage and resolution alone, which is a coherent interim rather than a broken one.

The ordering rule is recorded in rc04's charter and in `explore.md`; this change does not restate
it as a requirement, because a requirement nothing enforces is worse than a charter nothing
implements.

### D3 — `budget` stays in the schema, restated as a DECLARED EXPECTATION (Q-crc-19)

Removing it would cost a schema version bump and a migration of every declaring schema for no
behavioural gain. It stays, and it is given a job so it is not a vestige: `budget` declares what a
pair plus one repeat is EXPECTED to cost, which is useful at the moment a schema is authored.

**Nothing compares it to actual effort, and that gap is the design.** A declared expectation informs
an author; an automatic comparison against it is a target, which R-crc-11(h) forbids. The spec must
say so plainly — a reader who finds `budget: 3` and assumes it constrains something is the failure
mode this choice creates, and closing it is this change's obligation.

What is retired: `budgetExhausted`, the `BUDGET-SPENT` position token, and the budget clause in the
gate's reason string. What survives: the SPEND figure, as effort under R-crc-11(h).

### D4 — `stands` is NOT shipped here

`explore.md` D-rc02c-7 re-homes `stands` as a recorded FACT under R-crc-11(h) — "did anyone
independent read the final state?", false for most changes and true for three. That makes it
evidence for Q-crc-18's deferred reading surface, not a gate field.

**Decided at propose**: shipping it here would add computed surface to a change whose value is
subtraction, and would give the fact a writer before it has a reader — the write-only pattern this
repository has now recorded three times. The executable definition travels with the change at
`sketches/stands-decision-table.py` so the eventual reader inherits it rather than rebuilding it.

### D4b — the budget requirement KEEPS its baseline title

`Review budget reported beside the gate state` reads slightly stale once exhaustion is retired, and
the obvious move is to rename it to something about spend. It is NOT renamed, deliberately.

A MODIFIED delta matches its baseline requirement by HEADER. Renaming makes it a RENAMED operation
— a path no archived change in this repository has ever exercised — and a mismatched MODIFIED
header does not replace the baseline block, it ADDS a second one beside it. That is silent spec
duplication, which is the failure class C2's fingerprints exist to catch.

It was in fact caught that way: `orbit fingerprint` reported `skipped — requirement not found in
live baseline` on the renamed header while `orbit validate --strict` passed. The title stays; the
prose carries the meaning.

### D5 — the assigned residue from rc02's v4 bump

`orbit-run-summary-emit` carries two next-command examples still scoped to `spec-driven` v3
(baseline lines 278 and 343, both reading "under `spec-driven` v3"). The schema is at v4. rc02
assigned this residue to whichever stage next touched the cadence vocabulary; that is this one.

## Alternatives considered

- **`stands` as the redesigned clause (c)** — an independent pass stands iff it carried zero
  substantive findings, no substantive walk followed it, and no earlier independent pass has
  unwalked substantive findings. Built, worked through twelve constructed cells per R-crc-7 (the
  table exposing a real hole at cell F, where the rule leaned on clause (b)), and validated against
  all eleven real trails. REJECTED: it answers a convergence question the cadence does not end on.
  Recorded at length in `explore.md` because the sequence is the lesson — a careful redesign of the
  wrong question still produces the wrong answer.
- **Refining which pass clause (c) reads** (e.g. "all passes in the latest cadence slot") — fixes
  the blind-pair hole and leaves the wrong question intact.
- **Keeping `budgetExhausted` as a pure readout** — rejected: it says "you have spent too much",
  which is the one thing R-crc-11(h) forbids a cost record from saying. The spend figure carries the
  information without the judgement.
- **Removing `budget` from the schema grammar** — correct in principle, rejected on cost: a version
  bump and a migration of every declaring schema, for a field that is simply no longer consulted.
- **The walk-invalidation rule** (whether a suggestion-only walk invalidates a standing pass, and
  whether edits-vs-no-edits is the truer criterion) — dropped entirely; see `explore.md` D-rc02c-8.
  The `files_touched` field a correct rule would need is deliberately NOT added.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — the clause (c) block, `budgetExhausted` computation, the
  reason strings that name budget, and the position-token labels.
- `src/commands/workflow/status.ts` — the `BUDGET-SPENT` chip in the gate readout.
- `src/core/artifact-graph/instruction-loader.ts` — its `budgetExhausted` read.
- `schemas/spec-driven/schema.yaml` — the comment describing exhaustion and the position token.
- `test/core/artifact-graph/` — the gate-model suite; constructed-trail cases for the removal.
- `orbit/specs/orbit-engine-gates/spec.md` + `orbit/specs/orbit-run-summary-emit/spec.md` — the two
  baselines this change modifies (delta authoring, not direct edits).

## Risks / Trade-offs

- **A gate that no longer computes convergence may read as weaker.** It is narrower, deliberately:
  coverage and resolution are process facts the engine can own, while convergence is a judgement
  R-crc-11 moved to a record. The interim between this change and rc04 is the honest state, not a
  gap — and clause (a) means no review is lost.
- **`budget` surviving as an inert-looking declaration is a landmine** if the spec does not say
  plainly that nothing consults it. That sentence is a requirement here, not a nicety.
- **This change makes some currently-unpassed gates pass.** Intended. Any change previously held
  only by clause (c) was being held by a demand the terminal state cannot satisfy.

## Migration Plan

Additive-to-subtractive with no data migration. No schema version bump; `budget` declarations stay
valid and simply stop being consulted. Emits already written keep whatever `budgetExhausted` they
recorded — those are RECORDS, true when written, and are never rewritten.

## Open Questions

None. The exploration closed with zero open questions; D2 and D4 were decided at propose and are
recorded above with their reasoning.
