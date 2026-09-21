> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc04-readiness-record

## Premise

The cadence produces two judgements and records neither.

An INDEPENDENT reviewer forms a view on whether the work should move forward, and emits only
findings. The IN-CONTEXT AI forms a view on whether it is ready, and states it in chat, where it
dies. Both are the output R-crc-11 says the cycle exists to produce, and both are thrown away at
the moment they are made. This stage gives each one a home: a forward RECOMMENDATION on every
independent pass, and a READINESS RECORD at the archive naming the recommendations it was formed
against.

**What makes it buildable, where a general readiness check would not be.** Belief is not
observable. ORDERING is. R-crc-11(g) says the AI must believe it is ready *knowing what came back*,
and the engine can enforce exactly that much: a readiness record must POST-DATE the independent
passes it cites, and a record that does not is refused. Everything else here is a RECORD under
R-crc-10, because "why this was acceptable" is prose by construction. The engine never judges
readiness; it only refuses a claim that could not have been informed.

**The artifact this replaces now exists, and it is the argument for the stage.** rc02c archived on
2026-09-21 through a computed passed gate with SIX residual-risk entries — 3,333 characters of free
prose — in the archive emit's `warnings` array, a field whose schema example is
`"Archived with 2 incomplete artifacts"`. Each entry is a judgement a human made and wrote down: a
passed gate that does not mean a clean independent pass stands on the final tree; a measured ~58%
capture-recapture residual; a size measurement over the R-crc-1 ceiling; a stale cross-reference in
an untouched capability; an expected touchpoint divergence; a correction made in flow. That is
what a readiness record has to structure, observed rather than imagined. See D-rc04-11.

**And exit criterion (4) is the guard that keeps this honest**: `gate_overridden` either gains a
reader or is retired. Nothing in `src/` reads it today, so replacing one write-only record with
another would deliver nothing. A readiness record that no surface consumes is the same failure in
new vocabulary.

**HISTORICAL — what this stage used to be.** rc04 was `rc04-cost-visibility` and asked what the
cycle COSTS: a cadence line in `orbit status` (passes so far, findings trending, budget remaining),
a capture-recapture residual estimate from the blind pair, and an archive record replacing
`gate_overridden` when a cadence ended on an exhausted budget. R-crc-11 established that cost is
not what the user is protecting, so two of those three answered a question nobody asked — they are
in Considered & out with the measurements that were taken before they were set aside. The third
survived because it was a readiness judgement wearing a cost costume. The exhausted-budget TRIGGER
is separately gone: rc02c made `budget` inert, so no cadence can end exhausted (D-rc04-10).

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

- **2026-09-21 (later) — D-rc04-9: the rc04/rc02c boundary DISSOLVED rather than being drawn**
  (resolves Q-rc04-a by events). The standing recommendation was "rc02c owns the predicate, rc04
  owns the record and the judgement". rc02c then shipped and DELETED the predicate outright: there
  is no clause (c), and the gate computes nothing about whether a change has converged. So there is
  no adjacent rule for rc04 to collide with, and the boundary question is not answered — it is
  gone. **rc04 owns the record and the judgement, full stop.** This is the cleaner outcome and it
  removes the prerequisite that blocked either stage from proposing.
  One CHARTER RESIDUE to recommend at the next architect session: the stage declaration's boundary
  paragraph still closes with "the predicate may read the record's existence, never its content".
  That clause describes a relationship with something that no longer exists. It is harmless — it
  constrains nothing — but it will read to a future proposer as though a predicate is waiting for
  this record to appear.

- **2026-09-21 (later) — D-rc04-10: `budget` is no longer a gate input, DELIVERED** (resolves
  Q-rc04-b). Raised here as a ruling-level call; taken by Sal as Q-crc-19 and shipped by rc02c the
  same day. `budget` is an inert DECLARED EXPECTATION that nothing consults; `independentSpend`
  survives as the recorded cost, reports on gate mode alone, and renders alone. The question needs
  no further work from this stage — but note what it cost to answer: it took its own stage, because
  demoting a signal meant retiring the predicate that made the signal meaningful.

- **2026-09-21 (later) — D-rc04-11: the artifact rc04 replaces now EXISTS, and it is 3,333
  characters of free prose.** rc02c's archive emit carries SIX residual-risk entries in `warnings`
  — a passed gate that does not mean a clean independent pass stands; a measured ~58% capture-
  recapture residual; a size measurement over the R-crc-1 byte ceiling; a stale cross-reference in
  an untouched capability; an expected touchpoint divergence; and an at-archive correction made in
  flow. Every one is a judgement a human made and wrote down, in a field whose schema says
  "`<text — e.g., 'Archived with 2 incomplete artifacts'>`". **That is the concrete shape of what a
  `residual_risk` record has to structure**, and it is far richer than the charter's original
  "replace `gate_overridden` when a cadence ends on an exhausted budget" — which, after D-rc04-10,
  can no longer happen at all.

## Open questions

- **Q-rc04-c — how far does D4's commentary prohibition narrow?** It currently forbids a reviewer
  stating finding counts, gate verdicts, or next commands, to keep the engine single-voiced.
  D-rc04-8 wants reviewers to recommend a direction.
  Standing recommendation: forbid asserting the GATE's state (still the engine's alone), permit
  asserting the REVIEWER's own recommendation, and keep counts with the engine since it computes
  them. The distinction is judgement-versus-computation, not who-may-speak.
  **EVIDENCE 2026-09-21: the prohibition as written may already permit what D-rc04-8 wants.** The
  scoped iteration-2 external pass on rc02c ended its Notes with *"The declaration hoist,
  conditional spreads, and public reason are sound in the implementation; the residual risk is that
  the comments and under-specific assertions do not preserve that result against later edits."*
  That is a forward recommendation in substance — a verdict on whether the work should ship and
  what would undo it — delivered inside the commentary slot while naming no count, no gate state
  and no next command. So the change D-rc04-8 asks for may be SMALLER than a new practice: give the
  recommendation a NAMED SLOT so it is reliably present and machine-readable, rather than arriving
  as the last sentence of prose when a reviewer happens to offer it. Worth checking the other three
  passes of that cycle for whether they did the same unprompted.

- **Q-rc04-d — is the readiness record WRITTEN at the archive, or RENDERED there from a judgement
  formed earlier?** The charter and Q-crc-20 both place the record at the archive seam. But the
  judgement it records is formed earlier — at the end of the cadence, when the independent passes
  have returned and the AI decides whether to buy another. rc02c has a worked instance: a scoped
  external pass was bought BY CHOICE over an already-passed gate, because the walk had authored
  mechanism no independent reader had seen. That decision WAS the readiness judgement, and it
  happened hours before the archive. By the time the archive ran, it was history being reported.
  Standing recommendation: BOTH, with the archive record DERIVED rather than authored — the
  judgement is captured at the moment it is formed (which is also the moment the ordering
  constraint in exit (3) can be checked against the passes that informed it), and the archive
  renders it. The reason to prefer derivation: authorship at the seam is precisely how rc02c
  produced 3,333 characters of free prose in a `warnings` array. A record composed at the moment of
  judgement is short because the judgement is fresh; a record composed at the seam is long because
  it is reconstructing. NOT RATIFIED — this is a scope call about how much of the cadence the stage
  touches, and it may be the difference between one capability and two.

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
- `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs/archive-2026-09-21T15-38-59Z.json`
  — the SIX-entry `warnings` array D-rc04-11 describes: the concrete artifact this stage replaces.
- `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs/external-system-2026-09-21T15-17-10Z.md`
  — the Notes slot carrying an unprompted forward recommendation (evidence under Q-rc04-c).
- `orbit/architecture/clean-up-review-cycle.md` — **Q-crc-20**, opened 2026-09-21: a gate can
  compute PASSED over mechanism no independent pass has read, because freshness keys on APPLY
  tokens. Its standing recommendation is a RECORD at the archive seam, which is rc04's territory.
