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
  **AMENDED 2026-09-21 (Sal, verbatim): *"finding requiring expansion get kicked back to
  architecture, unless it makes more sense to include them in the current effort despite the
  expansion. and i think that's what we've been doing pretty well: the AI noting its an expansion,
  recommending it go back to architecture (or stay if it really makes sense) and then giving me the
  decision"*.** Two corrections to the original. FIRST, routing to architecture is the DEFAULT and
  not the rule — sometimes absorbing the expansion is the better call, and the exception is part of
  the design rather than a lapse from it. SECOND, and this is where the original overstated: the AI
  does NOT make the call. The AI makes the CLASSIFICATION (this is an expansion) and the
  RECOMMENDATION (route it, or keep it, with reasons); **the DECISION is Sal's**. That is a
  three-part division, and it is narrower than "the AI decides" while still satisfying D-rc04-5 —
  the user is steering, not adjudicating each finding, because the AI has already done the work of
  naming the fork and taking a position on it.
  **Observed, not aspirational.** rc02c's cycle ran this shape four times without it being written
  down: the E7 finding (a future stage's charter requiring a field rc02c deletes) was classified as
  expansion, recommended for architecture with the reasoning that the defect survives the
  retirement while only its vocabulary died, and ratified by Sal as option (A); F7 (the declaration
  hoist) was classified as absorb-it-here and ratified; the instrument fix was recommended as
  SEPARATE work and ratified as option 1; the scoped iteration-2 pass was recommended over an
  already-passed gate and ratified. Four forks, four recommendations, four Sal decisions, zero
  cases of the AI deciding alone and zero cases of Sal adjudicating unaided.

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

- **2026-09-21 (later) — D-rc04-12: what a READINESS RECORD is, defined.** *A dated, AI-authored
  assertion, made at the end of a cadence, that the work is ready to move forward — citing the
  independent passes it was formed against, and naming what was accepted without resolution and why
  that was acceptable.* Four properties, of which exactly ONE is machine-checkable, and that
  asymmetry is the stage's whole design: it ASSERTS a direction (not checkable — it is a belief);
  it CITES the independent passes it was formed against (checkable — do they exist on the trail);
  it POST-DATES every pass it cites (checkable, and this is exit (3), the reason the stage is
  buildable at all); it NAMES what was accepted unresolved and why (not checkable — prose by
  construction, R-crc-10). The engine never judges whether the AI was RIGHT to be ready. It refuses
  a claim the AI COULD NOT HAVE FORMED — one predating the evidence it names.

  **What it is NOT, each contrasted with a thing it would otherwise be confused for.** Not the GATE
  VERDICT: the gate computes coverage and resolution, which are procedural facts, and after rc02c it
  computes nothing about convergence at all; D4's single-voiced rule keeps that verdict the
  engine's alone. Not `gate_overridden`: that record is REACTIVE and NEGATIVE — "the gate said no
  and I proceeded" — and exists only on failure, whereas a readiness record is AFFIRMATIVE and
  UNCONDITIONAL, made when the gate passes too. rc02c is the proof: a computed passed gate that
  still needed six paragraphs of what passing does not mean. Not a CORRECTNESS PROOF: under
  D-rc04-6 specs and reviews are alignment instruments, so readiness is "aligned and on task,
  knowing what came back", never "defect-free". Not a COST RECORD: that was rc04-cost-visibility,
  retired by R-crc-11.

  **The frame that makes it concrete:** a readiness record is to the ARCHIVE what a review emit is
  to a REVIEW — the D5 emit-composition architecture applied one seam later. Engine owns the spine
  (timestamps, citations, ordering, refusal); the AI supplies the judgement. Prose with a checkable
  spine.

  **Worked against rc02c's six `warnings` entries, which sort cleanly into it** — decent evidence
  the structure is right rather than merely tidy. FORMED AGAINST: the four independent passes on
  the trail. ACCEPTED UNRESOLVED: the ~58% capture-recapture residual, the 158% size overage, the
  stale cross-reference left for audit-drift. WHY ACCEPTABLE: "the scoped pass executed a branch
  matrix and found the walk-authored mechanism sound in the implementation" — which is a citation
  of a reviewer's forward recommendation, exactly as exit (2) wants. And two entries — the
  touchpoint divergence and the at-archive correction — are NOT readiness at all; they are process
  notes, and they were in `warnings` only because `warnings` is where everything goes when nothing
  has a home. That is the argument for the stage in miniature.

  **What the definition does NOT settle, per D-rc04-3 as amended**: the record's "direction" is the
  AI's own belief about readiness, but an EXPANSION disposition is not the AI's to decide — it is
  classified and recommended by the AI and decided by Sal. So a record that routes work to
  architecture is carrying a RATIFIED decision, not an autonomous one, and it needs to say which.

- **2026-09-21 — D-rc04-13: WHICH judgements qualify, settled by ONE test, executed against a real
  trail** (answers Q-rc04-e's sub-question; R-crc-7 — mechanism worked out before any spec prose).

  **THE TEST.** *Is the judgement FORMED AGAINST INDEPENDENT REVIEW OUTPUT?* If yes it is
  readiness-shaped and needs a structured slot. If no, it is a METHOD call (R-crc-3 — the AI
  settles it and records the rationale), a SCOPE call (Sal's), or a PROCESS NOTE. The test is worth
  more than its tidiness: **citing the passes is the same property exit (3) makes checkable**, so
  the qualifying criterion and the enforceable constraint are one thing rather than two. A
  judgement that cites no pass has no ordering to check, which is exactly why it does not belong.

  **EXECUTED against all ELEVEN judgements rc02c's cycle actually made** (not constructed — read
  off the archived trail and this session's ratifications):

  | # | Judgement | Formed against passes? | Where it lives today | Verdict |
  |---|---|---|---|---|
  | 1 | Don't split despite 153% of the byte ceiling | NO — against R-crc-1 + c2 calibration | `design.md` size section | method — correct home |
  | 2 | Apply over an unpassed `review-proposal` | **YES** | `gate_overridden` | **QUALIFIES** (partial — see below) |
  | 3 | Fix the two lint instruments as separate work | NO — capability boundary | task 5.1 prose | scope — correct home |
  | 4 | Buy a scoped external pass over a PASSED gate | **YES** | `final_assessment` prose | **QUALIFIES — no home** |
  | 5 | Accept the ~58% capture-recapture residual | **YES** | `warnings` prose | **QUALIFIES — no home** |
  | 6 | Accept the 158% size overage | NO — against R-crc-1 | `warnings` + `design.md` | method — MISFILED in warnings |
  | 7 | Accept the stale `orbit-review` cross-reference | NO — found by the sync agent, not a review pass | `warnings` | process note — correct home |
  | 8 | Sync specs now rather than archive unsynced | NO — against the fingerprint check | NOWHERE | ratification, unrecorded |
  | 9 | Ratify rc02c complete | NO — against exit criteria | `Complete: [x]` | program — correct home |
  | 10 | Leave rc03a unratified | NO | nowhere (deliberately not re-prompted) | program |
  | 11 | **Believe the work is ready to archive** | **YES** | **NOWHERE** | **QUALIFIES — the missing terminal assertion** |

  **FOUR of eleven qualify.** The test earns its keep by what it EXCLUDES: six judgements that feel
  readiness-adjacent are not, and two of them are provably in the wrong place today — #6 is a
  method call misfiled into `warnings`, and #8 is a ratification recorded nowhere at all. Neither
  is rc04's to fix, and saying so is the point: this stage would otherwise absorb them.

  **TWO SHAPES, not four.** The qualifying set splits cleanly by WHEN it is formed.
  **(A) CONTINUATION** — mid-cadence, "given what came back, what next?" — covering #2 and #4, whose
  dispositions are the negative `proceed` (past a gate that says no) and the positive `spend` (buy
  another pass past a gate that says yes). **(B) READINESS ASSERTION** — terminal, "given what came
  back, I believe this is ready, accepting X and Y" — covering #11, with #5 as its CONTENT rather
  than a peer: the accepted residuals are the assertion's reasons, not separate judgements.

  **THIS ANSWERS EXIT CRITERION (4).** The charter says `gate_overridden` must gain a reader or be
  retired, because nothing in `src/` reads it and swapping one write-only record for another
  delivers nothing. It gains a reader by **becoming the negative case of the continuation slot** —
  same shape, opposite disposition. rc04 does not add a record beside it; it generalises it.

  **ONE DEFECT FOUND IN PASSING, and it constrains the design.** `gate_overridden` cites its pass
  in PROSE — `"latest independent pass has 6 CRITICAL"` — not by token. Exit (3)'s ordering check
  could not run against that even today: there is nothing to compare timestamps with. **The slot
  must cite passes by TOKEN**, with prose as commentary beside it rather than instead of it.
  Whatever else rc04 ships, this is the part that makes it checkable rather than merely tidy.

- **2026-09-21 — D-rc04-14: SHIP BOTH SHAPES** (Sal, ratifying D-rc04-13's standing
  recommendation). The stage carries the CONTINUATION judgement and the TERMINAL readiness
  assertion, not the terminal one alone. They are not independent: a readiness assertion CITES
  continuation decisions as its reasons — *"I accepted the residual because I bought a scoped pass
  and it came back sound"* is one statement spanning both shapes, and structuring half of it leaves
  the citation dangling back in prose, which is the failure this stage exists to remove. Accepted
  cost: a larger stage than chartered, the second time rc04 grew today (the first being exit (4)
  turning out to be answerable).

- **2026-09-21 — D-rc04-15: the SLOT, worked out from the four qualifying judgements.**

  **ONE SPINE, two kinds.** Every record carries: `kind` (`continuation` | `readiness`);
  `formed_against` — a NON-EMPTY list of independent pass TOKENS, which is the whole checkable
  surface and the reason D-rc04-13's test is the test; `disposition`, whose value set varies by
  kind; `reasoning` (prose, R-crc-10); and `ratified_by` (`ai` | `user`), required because
  D-rc04-3 as amended makes the difference between the AI's own belief and a Sal ratification a
  thing the record must STATE rather than imply.

  **`kind: continuation`** — formed mid-cadence, "given what came back, what next?".
  `disposition` is `proceed` (past a gate that says no — today's `gate_overridden`) or `spend`
  (buy a further pass past a gate that says yes — what has no home at all). The `proceed` case
  additionally carries `gate`, `gate_state` and `gate_reason`, which is exactly `gate_overridden`'s
  existing payload, so the generalisation is ADDITIVE and the old record's content survives intact.

  **`kind: readiness`** — formed at the cadence's end. `disposition` is `ready` or `not-ready`, the
  latter carrying the destination D-rc04-3 names (architecture) and being a RATIFIED disposition
  rather than an autonomous one. It additionally carries `accepted`: a list of `{claim, why}` pairs
  — the residuals, which are the assertion's CONTENT and not peer judgements. rc02c's would have
  held three: the capture-recapture residual, the passed-gate-is-not-a-clean-pass reading, and the
  stale cross-reference deferred to audit-drift.

  **THE ENGINE RULE, and it is the only one.** Every token in `formed_against` MUST precede the
  record's own timestamp, and a record violating that is REFUSED at the write gate — the
  materialize-first shape `orbit-emit-composition` already uses. Nothing else here is computed: the
  engine never judges whether the AI was RIGHT to be ready, only that the claim could have been
  informed. This is exit (3) finally with something to check, because the citation is BY TOKEN
  rather than the prose citation `gate_overridden` carries today.

  **NO NEW TRAIL LOCATION IS NEEDED**, verified against rc02c's archived trail: every qualifying
  judgement already lands on an emit that exists. `continuation/proceed` on the APPLY emit (where
  `gate_overridden` lives now) and on ARCHIVE; `continuation/spend` on the `review-external` T0
  emit, written at exactly the moment that decision is taken; `readiness` on the ARCHIVE emit. The
  stage adds fields to three existing payload tables and invents no fourth trail.

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

- **Q-rc04-e — which judgements get a STRUCTURED home, and what is the shape?** (replaces the
  retired Q-rc04-d; see Considered & out.)
  The trail as of rc02c shows a split that nobody designed. WALK decisions have real structure —
  nine across the cycle, each carrying `ratified_via`, `recommendation_fork.chosen` and a verbatim
  `resolution` — because `orbit-address-reviews` was built for them. READINESS-shaped judgements
  have none: "buy a scoped external pass over an already-passed gate", the clearest readiness call
  of the cycle, lives in the T0 emit's `final_assessment` as prose, indistinguishable from any
  other sentence in a paragraph and readable back by nothing.
  That asymmetry is the whole of what rc04 has to fix, and fixing it makes the archive step
  exactly what Sal describes: the records already exist, so summarize and emit.
  Standing recommendation: give readiness judgements the SAME treatment walk decisions already
  have — a named, structured slot written AT THE DECISION POINT, carrying what was decided, what
  data it was formed against (the pass tokens), and whether the disposition was the AI's own belief
  or a Sal ratification (D-rc04-3 as amended requires that distinction). The archive then RENDERS
  rather than composes, and exit (3)'s ordering check has something to check.
  Sub-question ANSWERED by D-rc04-13: four of eleven observed judgements qualify, under one test
  (formed against independent review output), and they take TWO shapes — continuation and terminal
  — with `gate_overridden` generalising into the first. Note that "route this expansion to
  architecture" turned out NOT to need a new home: it is per-FINDING and the walk's decision lane
  already structures it. FIELD SHAPE is settled by D-rc04-15 and SCOPE by D-rc04-14; what remains is narrower than either (see the two leanings below). Historical framing of the scope call:
  whether rc04 ships BOTH shapes or only the terminal assertion the charter names. Continuation
  produced the most value in rc02c's cycle and has no home at all, which argues for both; shipping
  both is also a larger stage than chartered, so under D-rc04-3 as amended this is a recommendation
  for Sal rather than a call the AI makes. **Standing recommendation: ship both**, because the
  terminal assertion cites continuation decisions as its reasons — "I accepted the residual because
  I bought a scoped pass and it came back sound" is one sentence spanning both shapes, and
  structuring only half of it leaves the citation dangling in prose. **RATIFIED: both**
  (D-rc04-14, Sal).

  **Still open, and both are small.** (i) Does a `readiness` record with `disposition: not-ready`
  BLOCK the archive, or merely RECORD that the cadence ended by routing to architecture? Leaning:
  record only — a blocking readiness record re-creates the target-shaped signal R-crc-11(h)
  retires, and the archive already has consent and gate prompts for stopping. (ii) Is
  `gate_overridden` RETIRED outright here, or kept as a deprecated alias for one release? Leaning:
  retire — exit (4) says a write-only record delivers nothing, nothing in `src/` reads it, and a
  deprecated alias for a record with no readers is ceremony.

## Considered & out

- **2026-09-21 — Q-rc04-d, "is the readiness record WRITTEN at the archive or RENDERED there from
  a judgement formed earlier?" — RETIRED as a false distinction, by Sal.** The question was raised
  with a standing recommendation for rendering, on the argument that authorship at the seam is what
  produced rc02c's 3,333 characters of `warnings` prose. Sal's response: *"these things seem the
  same to me. we are working through this flow together, when we get to decision points (gates), we
  make a judgement based on the data, record it, and move on as indicated. at archive, there is
  record of the judgements and we can summarize and emit."* Checked against the trail rather than
  argued, and Sal is right — the flow ALREADY works that way, and the walk decisions ARE recorded
  at their decision points with real structure. The 3,333 characters were not caused by authoring
  at the seam; they were caused by three of the six entries having no structured home to be
  rendered FROM, so they were rewritten from prose scattered across narrative fields. The axis was
  wrong: not WHEN the record is written, but WHICH judgements have a structured home. Replaced by
  Q-rc04-e. Kept here because the diagnosis inside it survives — authorship reconstructs, and
  reconstruction is where length and drift come from.
  (A residue worth keeping too: THREE of rc02c's six warnings genuinely AROSE at the archive seam
  — the sync agent's stale cross-reference, the at-archive correction, the touchpoint divergence.
  Those are not reconstructions. D-rc04-12 already classifies them as PROCESS NOTES rather than
  readiness, which suggests `warnings` is their legitimate home and rc04 should not try to absorb
  them.)

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
