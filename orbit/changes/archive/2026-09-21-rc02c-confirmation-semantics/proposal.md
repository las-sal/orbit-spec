# Proposal: rc02c-confirmation-semantics

## Why

Clause (c) — the gate's independent-confirmation predicate — asks whether a change has CONVERGED,
and R-crc-11 established that convergence is not how this cadence ends. It ends on a WALK of a
review with findings, and that is correct: a review reads code the last propose/apply produced, any
AI's output carries issues, and once named they are addressed immediately.

The trail agrees. Across eleven archived changes, only THREE ever had an independent pass standing
clean on the final state, and none of the recent ones. So the shipped predicate — "the most recent
independent pass must carry zero CRITICAL, or one further pass is required" — states a demand that
how-work-actually-ends can almost never satisfy. It is not a bar that is rarely cleared; it is a
bar measuring the wrong thing.

Two further defects ride on the same line of code. `independents[length - 1]` selects a single pass,
so on a BLIND PAIR — two independent passes on one state, which R-crc-11(a) makes the program's
central mechanism — a CRITICAL in the earlier-finishing member never reaches the predicate at all.
And `budgetExhausted` reports "you have spent too much", which R-crc-11(h) identifies as the one
thing a cost record must never say.

## What Changes

- **Clause (c) is REMOVED from the convergence computation.** Not refined, not re-pointed at a
  better pass — removed, because the question it asks is the wrong question. Convergence stops being
  computed; it becomes a judgement rc04 records.
- **Independent review is NOT weakened.** Clause (a) coverage still demands the blind pair and the
  in-context slot. Clause (c) only ever governed what happens AFTER them.
- **The blind-pair invisibility defect disappears** rather than being fixed, because nothing selects
  a "latest" pass any more.
- **`budgetExhausted`, its distinct position token, and the budget clause in the gate's reason
  string are RETIRED** (Q-crc-19). The SPEND figure survives as effort under R-crc-11(h).
- **`confirm` STAYS in the schema grammar and becomes INERT.** Both gates keep their declared
  values (`no-new-findings`, `findings-resolved`) so every existing schema validates without a
  version bump — but `confirm` selected clause (c), and with the clause gone nothing reads either
  value. A schema author maintaining `schemas/spec-driven/schema.yaml` will see the attribute
  survive the removal of what it chose; the delta says so in normative prose rather than leaving
  it to be inferred.
- **`budget` STAYS in the schema grammar** — no version bump, no migration — restated as the
  cadence's DECLARED EXPECTATION. Nothing compares it to actual effort, and that gap is the point:
  a declared expectation informs an author, an automatic comparison is a target.
- **The assigned residue from rc02's v4 bump is cleared**: `orbit-run-summary-emit`'s two v3-scoped
  next-command examples, which this stage's cadence-vocabulary work touches anyway.

## Capabilities

**Modified Capabilities**:
- `orbit-engine-gates` — the convergence computation loses clause (c); the budget signal is demoted
  from gate-adjacent reporting to a declared expectation the gate does not consult.
- `orbit-run-summary-emit` — two next-command examples still scoped to schema v3.

**New Capabilities**: none. This change is a SUBTRACTION, which is the correct shape for a stage
whose two prior redesigns both failed by adding rules — one non-terminating, one falsely
converging.

## Impact

- No schema version bump and no migration: `budget` keeps its grammar slot and its declaration
  stays valid, it is simply no longer consulted.
- Gates that previously reported `unpassed` on clause (c) will now report on (a)/(b) alone. No
  change becomes newly BLOCKED; some become newly passable, which is the intent.
- The readiness obligation that eventually replaces clause (c) belongs to `rc04-readiness-record`
  and is deliberately NOT shipped here — see design D2 for why the sequencing matters.
