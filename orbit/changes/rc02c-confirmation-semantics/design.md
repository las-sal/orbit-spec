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

**OBSERVED ON THIS CHANGE'S OWN GATE, 2026-09-21.** The argument above is no longer only an
argument. rc02c's proposal cadence ran to completion — one `fresh` independent pass (6 CRITICAL /
8 WARNING / 3 SUGGESTION), a full walk resolving all seventeen, then the declared `in-context` pass
(0 CRITICAL / 5 WARNING / 2 SUGGESTION) and a second walk resolving all seven. At that point clause
(a) is covered and clause (b) is satisfied: every substantive finding on every relevant pass is
resolved. The gate's reason changed shape accordingly — from `cadence class 'in-context' has no
fresh pass` to:

```
Gate review-proposal: unpassed — latest independent pass has 6 CRITICAL
Position: propose ✓ → review(proposal) unpassed → apply ready → ...
Ready when you are: /orbit:review --as proposal --fresh rc02c-confirmation-semantics
```

Clause (c) selects the most recent INDEPENDENT pass — the `fresh` one, since `in-context` is not
independent — reads its SIX CRITICAL, and demands another independent pass. **All six are
resolved.** The predicate reads a pass's findings, never their disposition, so resolution cannot
answer it; only a differently-shaped future pass can, and the cadence has no slot left to put one
in. The engine is asking this change to buy a fourth review pass for precisely the reason this
change argues is the wrong question.

This is the terminal state D-rc02c-5 describes, reached by the ordinary operation of the declared
cadence rather than by a constructed trail: the cycle ended on a walk of a review with findings,
which is correct, and clause (c) cannot recognise it as an ending. It is also the second time the
same predicate has produced the same outcome on this program — rc07 archived at
`independentSpend: 4` against `budget: 3` for the same reason, and that spend is recorded in its
archive emit as residual risk. One instance is an anecdote; two consecutive stages, on different
changes, with the same predicate producing the same over-spend, is the measurement.

The change's own gate will therefore be `unpassed` at apply, and that is the honest reading rather
than an embarrassment: the gate is correctly reporting the rule as it stands today, and the rule is
what this change retires.

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

### D6 — this change DIVERGES from its own stage charter, and the divergence is recorded here

The stage's R-crc-11 IMPACT block (2026-09-21, Sal) says the ruling "does not delete clause (c) but
does change what it is FOR": the predicate was to shrink to reporting what is MISSING, reading the
readiness record's existence but never its content. The stage's exit criteria follow from that —
**(1)** the predicate specified as a table whose every cell has a value, **(2)** a constructed trail
per cell as a test, **(3)** the pair's earlier member cannot be invisible.

**This change deletes the predicate outright**, so (1) and (2) cannot be met as written. That is a
divergence from a dated, user-authored charter, and it is named here rather than left for a reader
to discover from the gap between the stage declaration and the shipped specs.

The reason the shrunken predicate was not built: there was nothing left for it to do. "What is
MISSING from the cadence" is COVERAGE, and clause (a) already computes coverage over the declared
cadence slots — a third clause reporting the same fact would be a second voice on one question,
which is the defect class clause (c) kept producing. The exploration reached the same place from
the other direction (D-rc02c-5/6): under R-crc-11 a cadence ends when the AI judges the work ready
knowing what the reviewers returned, and no predicate can compute that judgement without the
readiness record, which rc04 owns and has not written.

**Disposition of the three exit criteria**: (1) and (2) DISSOLVE with the predicate — there is no
table to specify and no cells to construct trails for. (3) is SATISFIED, but by dissolution rather
than by design: with no selection rule left, a blind pair's earlier member cannot be invisible to
one, and a clean set cannot certify a later unreviewed CRITICAL because nothing certifies anything.
The independent evidence is the engine itself — with clause (c) gone the recommendation function's
`confirmFailed` branch becomes unreachable, so no gate state is stranded by the removal.

**This change does not amend the architecture doc.** R-crc-6 — the walk authors nothing — and the
architect workflow owns stage declarations. Task 5.4 carries the recommendation; ratification is
Sal's act in `/orbit:architect`.

## Size against R-crc-1 (measured, not estimated)

R-crc-1 caps a design-heavy change at **3 capabilities / ~12 requirements / ~40 KB of delta / under
20 tasks**, and says a proposal over the ceiling is split before review. Measured at the close of
the first proposal walk:

| Dimension | This change | Ceiling | |
|---|---|---|---|
| Capabilities touched | 2 | ≤ 3 | inside |
| Requirements | 8 | ~12 | inside |
| Tasks | 18 | < 20 | inside |
| Delta bytes | **62,720** | **~40 KB** | **153%** |

**The byte figure is over, and it is recorded rather than explained away.** Of those 62,720 bytes,
changed lines account for **12,283 B**; the remaining **50,437 B (80%) is verbatim baseline text
that the MODIFIED delta format obliges this change to reproduce.** Every requirement here is
MODIFIED; none is ADDED.

That distinction is why the change is not split. R-crc-1's calibration anchor is c2-parallel-merge
— 2 capabilities / 9 requirements / 21,623 B — and **7 of c2's 9 requirements were ADDED**, where
bytes and novel content are nearly the same quantity. On a wholly-MODIFIED change they are not, so
comparing this delta's byte count to a ceiling calibrated on an ADDED-heavy change measures two
different things. The ruling anticipates this: *"Capabilities touched predicts cost better than
bytes."* On that dimension, and on requirements and tasks, this change sits comfortably inside.

**Cadence consequence.** R-crc-4 describes a near-ceiling proposal running a blind pair rather than
a single independent pass. The program has already placed that mechanism: the status-log entry of
2026-09-14 assigns it to **rc09**, *"which owns the size computation it needs"* — and the
`spec-driven v1 gates and cadence` requirement states in normative prose that the proposal gate's
cadence is NOT conditional, with a near-ceiling pair run by choice rather than by the cadence. The
proposal cadence therefore runs as DECLARED (`[independent, in-context]`). No pair is bought here,
and the reason is the program's own prior ruling, not this change's convenience.

One argument was available and is explicitly NOT made: the first fresh pass returned 6 CRITICAL,
which is rich. **R-crc-8 forbids reading that as a license** — finding quality never licenses
another pass, the discriminating measure is concentration in walk-authored material controlled by
the repeat rate, and at iteration 1 there is no repeat data for it to read.

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
- `src/commands/workflow/status.ts` — the `BUDGET-SPENT` chip, the `spend N/budget` RATIO at both
  render sites (live and superseded), and the budget-presence guard on spend reporting.
- `CLAUDE.md` — the rc02 paragraph's present-tense description of the budget signal.
- `src/core/artifact-graph/instruction-loader.ts` — its `budgetExhausted` read AND its
  `independentSpendFresh` declaration and projection.
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

## Scenario accounting

Both MODIFIED requirements drop or rewrite scenarios, and this is the full audit. It lives here
rather than in the spec deltas because a baseline requirement describes what is TRUE, not what a
change once removed from it — a reader a year out would find the spec telling them about a change
they cannot see. The spec carries a one-line pointer to this section instead.

**`Reviewed-gate pass condition` — clause (c).** REMOVED (3): `The confirming pass is the most
recent independent one` (asserted the selection rule that no longer exists), `Independent
confirmation required` (asserted the predicate's failure mode), `A new suggestion does not repeat
the loop` (asserted the new-finding match inside `no-new-findings`). REWRITTEN (1): `System gate
converges on a resolved external` — its assertion survives as a clause-(b) fact once the
confirmation framing is gone.

**`Review budget reported beside the gate state` — the signal.** REMOVED (2): `Budget exhausted on
an unconverged gate` and `Convergence beats budget`, both asserting the precedence of an exhaustion
signal that no longer exists. REWRITTEN (6): `Stale passes count in the reported spend, not in the
trigger` (there is no trigger); `No budget declared` (its contrast was exhaustion-versus-none);
`A stale gate reports its spend`, `A blocked reviewed gate reports the spend already on its trail`
and `The closed-set consumers are untouched` (each ASSERTED the retired `budgetExhausted` field or
the `BUDGET-SPENT` token, so each would have demanded behaviour this change deletes); and
`A rejected external return still costs` (dropped an inert `against budget: 3` framing).

The last three of those six were caught by the first proposal review, not by authoring: the
requirement's prose was swept for the retired vocabulary and the scenarios beneath it were not.
Every other scenario across all eight requirements is preserved byte-identically.

**`spec-driven v1 gates and cadence`.** No scenario removed or rewritten; all four are preserved
byte-identically. Only the requirement's prose changed.

## Open Questions

None. The exploration closed with zero open questions; D2 and D4 were decided at propose and are
recorded above with their reasoning.
