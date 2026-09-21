> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc04-readiness-record

## Premise

The cycle cannot see what it costs while it is being paid.

rc04's charter asks for three things: a cadence line in `orbit status` (passes so far, findings
trending, budget remaining), the capture-recapture residual estimate from a blind pair, and the
archive-side `residual_risk` record that replaces `gate_overridden` when a cadence ends on an
exhausted budget.

What makes it startable NOW rather than speculative is that every exit criterion names a fixture
that already exists on disk, and two of them acquired a second data point this week.

## Decisions

- **2026-09-21 — D-rc04-1: the question is READINESS, not COST** (Sal, verbatim: *"i'm not really
  all that concerned about whether i end on a walk or a pass — i'm concerned with the AI believing
  it is ready to move forward — knowing what is coming back in the external reviews"*). Every
  clause the gate computes today is PROCEDURAL: slots covered, findings resolved. None is a
  judgement about whether the work is right. The measurements taken above (11 of 16 archives ended
  on a walk; `budgetExhausted` fires on 1 of 16) answer "what did this cost and what is uncovered",
  which is a question Sal is explicitly not asking.

- **2026-09-21 — D-rc04-2: the blind pair IS the mechanism** (Sal). Code and specs are written TO BE
  REVIEWED, from different angles and different AIs; one `fresh` + one `external` is the way to get
  that. This ratifies R-crc-4's hardcoded pair from the product side rather than the engine side —
  it is not merely a coverage device, it is the point.

- **2026-09-21 — D-rc04-3: reviews must not GROW the proposal** (Sal). Findings that align tightly
  with the current effort and are common-sense get addressed; findings that require expansion get
  KICKED BACK TO ARCHITECTURE, which is natural and part of development rather than a failure.
  **The AI makes that call**, not the user.

- **2026-09-21 — D-rc04-4: budget is not the constraint** (Sal, verbatim: *"if the blind-pair
  uncovers something that does require expansion, i'm not really worried about the budget of
  reviews, the goal is to come out with a good implementation"*). rc02 built `budget` to bound
  convergence cost. Cost is not what the user is protecting.

- **2026-09-21 — D-rc04-5: the AI decides more; the user steers** (Sal, verbatim: *"i want to make
  less decisions and let the AI make more … a highly technical product manager with some input into
  the implementation and not defining every aspect"*). The user's job is confirming direction and
  catching deviation, not adjudicating each call. This has a direct consequence on the
  address-reviews DECISION LANE, which currently briefs the user per finding.

- **2026-09-21 — D-rc04-6: what specs and reviews are FOR** (Sal). Specs keep the AI aligned and on
  task. Reviews exist so INDEPENDENT reviewers agree the AI is aligned and on task. Neither is a
  correctness proof; both are alignment instruments.

- **2026-09-21 — D-rc04-7: the in-context pass is a REACTION, not a search** (Sal, verbatim: *"the
  main job of the in context reviewer is to use the additional insight it has in context and
  react/pushback/learn from independent reviewers"*). Independently measured already and recorded in
  rc03-review-genres' charter: ONE CRITICAL in ~25 in-context passes across the D-arc, while fresh
  and external found nearly all. Two derivations, one from product intent and one from the trail,
  agreeing.

- **2026-09-21 — D-rc04-8: independent reviews should carry a FORWARD RECOMMENDATION** (Sal,
  proposed: *"could also be a good practice for these out of context reviews to provide a general
  recommendation on moving forward"*). Today a review emits findings plus commentary and no verdict
  on whether the work should ship. Under D-rc04-6 that is the reviewer's most useful output, and it
  is the input the readiness judgement in D-rc04-1 has to be formed against.

## Open questions

- **Q-rc04-a — where is the rc04 / rc02c boundary?** rc02c owns clause (c), "what counts as having
  been confirmed". The readiness record is adjacent to that and could easily become a second
  capability in charge of one rule — the defect this program keeps catching.
  Standing recommendation: rc02c owns the PREDICATE (what the engine computes about a cadence);
  rc04 owns the RECORD and the JUDGEMENT (what the reviewers recommend and what the AI believes).
  Not yet ratified; drawing this line is a prerequisite for either stage proposing.

- **Q-rc04-b — does `budget` stop being a gate input?** D-rc04-4 says cost is not the constraint.
  Budget exists to bound convergence cost, so on that reading it should be a READOUT rather than a
  clause the gate consults.
  Standing recommendation: demote it to a readout, keeping the spend figure visible. This partially
  reverses rc02, so it is a RULING-level call for Sal rather than a method call — raised, not taken.

- **Q-rc04-c — how far does D4's commentary prohibition narrow?** It currently forbids a reviewer
  stating finding counts, gate verdicts, or next commands, to keep the engine single-voiced.
  D-rc04-8 wants reviewers to recommend a direction.
  Standing recommendation: forbid asserting the GATE's state (still the engine's alone), permit
  asserting the REVIEWER's own recommendation, and keep counts with the engine since it computes
  them. The distinction is judgement-versus-computation, not who-may-speak.

## Considered & out

- **2026-09-21 — the cadence line and the capture-recapture residual estimate (rc04's first two
  chartered deliverables).** Both answer "what did this cost and what remains uncovered". D-rc04-1
  establishes that cost is not the question being asked, and the estimator is statistically thin
  besides — two blind pairs have ever existed. Rejected as the stage's core; recoverable later if
  cost ever becomes a live concern.

- **2026-09-21 — "did the cadence end on a walk or a pass?" as the residual trigger.** Measured and
  genuinely predictive (11 of 16 archives ended on a walk; every override did), and it would have
  caught rc07 where `budgetExhausted` did not. Rejected anyway: it measures process shape, and
  D-rc04-1 moved the question to judgement. Kept in the record because the measurement is reusable
  if a coverage signal is ever wanted.

## References

- `orbit/architecture/clean-up-review-cycle.md` — the rc04 stage declaration (Goal G1; touches
  `orbit-orientation`, `orbit-archive-modifications`), and R-crc-4/6/8 which the churn diagnostic
  has to operationalise.
- `src/core/artifact-graph/gates.ts` — `budgetExhausted`, `independentSpend`,
  `independentSpendFresh`: the boolean-beside-the-state shape rc02 built, which rc04 extends.
- `src/core/emit-composition.ts` — the archive emit's payload field table. It has no
  `residual_risk` today; `warnings` is where the record currently goes as free prose.
- `orbit/changes/archive/2026-09-19-rc07-artifact-lint/.orbit-runs/` — the second blind pair, and
  an archive whose residual went into a hand-written `warnings` string.
- `orbit/changes/archive/2026-09-14-rc02-gate-semantics/.orbit-runs/` — the first blind pair, and
  the archive that spent its budget and overrode.
- `orbit/changes/archive/2026-09-11-d6-pr-lifecycle/` — the other `gate_overridden` customer.
- `src/core/orientation.ts` — where a cadence line would render.
