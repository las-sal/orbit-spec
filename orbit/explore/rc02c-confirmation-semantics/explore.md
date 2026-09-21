> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc02c-confirmation-semantics

## Premise

Clause (c) — the independent-confirmation predicate — is four lines of shipped code, and it is
asking a question the program no longer wants asked.

As shipped, `findings-resolved` reads the MOST RECENT independent pass and fails if it carried any
CRITICAL, demanding "one further independent pass on the walked state". That is a CONVERGENCE test:
it decides whether the work is done. R-crc-11 moved that decision to a recorded judgement (the AI
believes it is ready, knowing what came back) and left the gate the narrower job of reporting what
is MISSING.

This stage arrives with three measured problems from rc02's cadence and one inherited from the
2026-09-21 program rework (the `budget` demotion). The open question this exploration opens with is
whether R-crc-11 DISSOLVES two of the three rather than requiring them to be solved.

## Decisions

- **2026-09-21 — D-rc02c-1: problem (2) DISSOLVES under R-crc-11; problem (3) does NOT — it is
  PROMOTED.** Tested against rc02's own trail rather than reasoned about. Problem (2) asked what
  defines "which later pass supersedes the set and when the iteration ENDS", and rc02's two attempts
  produced a non-terminating rule then a falsely-converging one. Under R-crc-11 there is no
  iteration to terminate: the AI's recorded readiness judgement ends the cadence, so the predicate
  never has to decide "is this done" and therefore needs no terminal condition to get wrong.
  Problem (3) — "the terminal condition is about LATENESS, not about records" — survives, inverted:
  there is no terminal condition left, but LATENESS becomes the DEFINITION of the fact the predicate
  reports. My first reading had both dissolving; the trail said otherwise, which is the whole reason
  it was tested.

- **2026-09-21 — D-rc02c-2: clause (c) becomes a FACT, not a VERDICT.** Shipped, it asks "has this
  converged?" and demands another pass. Redesigned, it reports "does an independent pass STAND on
  the walked state?" — true or false, with nothing to iterate and nothing to demand. This is a
  SUBTRACTION, which is the right shape for a stage whose prior attempts failed by adding rules.
  It also makes the rc02c/rc04 boundary fall out rather than be imposed: rc02c computes what
  stands, rc04 records "I know that, and here is why I am ready anyway."

- **2026-09-21 — D-rc02c-3: a pass STANDS iff it carried ZERO substantive findings AND no
  substantive walk followed it.** The second clause is the non-obvious half, and the justification
  matters more than the rule: **any substantive walk invalidates every earlier pass, regardless of
  which pass it was sourced from, because a walk EDITS THE TREE the pass read.** Verified on the
  `explicit-lifecycle-consent` trail, where a walk at 18:32 followed the last independent pass at
  18:24 — the walk was sourced from that very pass, and it still invalidates it, because after the
  edit no independent reader had seen the result. Timestamp ordering is therefore sufficient and
  walk-to-source attribution is NOT required, which removes a dependency: `source_token` is null on
  every `--from-file` walk in the repo's history and only `source_path` is reliable.

- **2026-09-21 — D-rc02c-4: problem (1) is REAL, and it is the same defect rc07 archived as
  residual risk.** The shipped predicate reads `independents[length - 1]`, so with a blind pair on
  one state a CRITICAL in the EARLIER-finishing member never reaches it. Clause (b) still forces
  those findings to be walked, but clause (c) is then satisfied by a pass that ran BEFORE that walk.
  That is precisely the sentence hand-written into rc07's archive — "no clean independent pass
  stands on the final tree" — found once as a charter prediction and once by an AI writing prose
  into a `warnings` field. D-rc02c-3's rule closes it without special-casing pairs at all, because
  it never selects a single pass to interrogate.

- **2026-09-21 — D-rc02c-5: the cadence ends on a WALK of a review with findings, and that is
  CORRECT** (Sal, from practice: *"we will never end on a clean review, we will end on a walk of a
  review with findings. that is completely fine"*). Borne out by the trail: only 3 of 11 archived
  changes ever had an independent pass standing on the final state, and none of the recent ones.
  A predicate reporting "no pass stands" therefore reports the NORMAL case as if it were a
  deficiency, and a signal that is false nearly every time is not a signal.

- **2026-09-21 — D-rc02c-6: clause (c) is REPLACED, not refined — it was asking about CONVERGENCE,
  and convergence is not the terminal state.** The shipped predicate asks "has the latest
  independent pass converged?" and demands another pass; under D-rc02c-5 that demand can never be
  satisfied by how work actually ends. The replacement asks a different question entirely: **does a
  READINESS RECORD exist, and does it POST-DATE every independent pass it cites?** That demands
  nothing extra — it is satisfied by ending the way the cadence already ends — and it is trivially
  computable, since the record is timestamped and every pass carries a token. It is also exactly
  rc04's one mechanical rule, so the two stages meet at a single obligation rather than at a
  boundary that has to be policed.

  **Independent passes remain REQUIRED — by clause (a).** Coverage demands the blind pair and the
  in-context slot. Clause (c) was only ever about what happens AFTER them, which is why removing it
  removes no review.

- **2026-09-21 — D-rc02c-7: `stands` survives as a RECORDED FACT, not a clause.** "Did anyone
  independent read the final state?" is false for most changes and true for three (c1, d2, d4),
  which makes it evidence about how the flow behaves rather than a verdict about one change —
  precisely what R-crc-11(h) says to record and never target. Its executable definition and the
  twelve-cell table that produced it are kept at `sketches/stands-decision-table.py`; the work is
  not wasted, it is re-homed.

## Open questions

## Considered & out

- **2026-09-21 — `stands` as the redesigned clause (c).** Built, tested through twelve constructed
  cells, refined once when the table exposed a hole (cell F), and validated against all eleven real
  trails — then rejected as a CLAUSE by D-rc02c-5/6, because it answers a convergence question the
  cadence does not actually end on. Re-homed as a recorded fact under R-crc-11(h). Recorded at
  length because the sequence is the lesson: a careful redesign of the wrong question still
  produces the wrong answer, and only the user's practice revealed which question it was. This is
  the SECOND time in one session that direction was corrected from outside the reasoning —
  cost → readiness, then convergence → judgement — both times by experience rather than by
  analysis.

- **2026-09-21 — the claim that R-crc-11 dissolves BOTH problems (2) and (3).** My opening read.
  Rejected on evidence: problem (3)'s lateness concern survives as the definition of "stands". Kept
  in the record because the correction is the useful part — a reframe that dissolves one problem
  will look like it dissolves its neighbours, and the neighbour is where the work moved to.

## References

- `src/core/artifact-graph/gates.ts:524-566` — the shipped predicate, both `confirm` branches.
  The `findings-resolved` branch is the one `review-system` uses.
- `orbit/architecture/clean-up-review-cycle.md` — rc02c's charter (the three measured problems,
  R-crc-7's decision-table requirement), its R-crc-11 IMPACT block, R-crc-11 itself, and Q-crc-19's
  resolution naming this stage's full implementation scope.
- `orbit/specs/orbit-engine-gates/spec.md` — the baseline this stage modifies; lines 324-326 price
  the repeat, and the `budget` grammar is declared around line 20.
- `schemas/spec-driven/schema.yaml:158-186` — the comment describing `budgetExhausted` and the
  distinct position token, both of which Q-crc-19 retires.
- `orbit/changes/archive/2026-09-19-rc07-artifact-lint/.orbit-runs/` — a real blind pair on one
  state, and an archive whose residual was exactly the hole problem (1) describes.
- `orbit/explore/rc04-readiness-record/` — the sibling stage; the rc02c/rc04 boundary is drawn in
  rc04's charter (predicate versus record) and both inherit each other's shape.
