# Program: clean-up-review-cycle

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

**WHAT THIS PROGRAM IS FOR (stated 2026-09-15, after a day in which one stage shipped and two did
not).** orbit exists to adapt a development workflow to how ITS OWNER thinks and to how AIs in
different forms drive work forward. This program is where that adaptation is stress-tested, so
DIGGING IN AND FAILING IS THE PRODUCT, not an overrun: the breakages are what export to other
projects. A stage that ships nothing but leaves an intact trail has delivered — rc03a and rc13a
shipped no baseline and their trails are the evidence base for four rulings. Judge a stage by what
its cycle taught and recorded, not only by what it merged.

With one distinction that decides when pain is research and when it is a missing constraint:
**failing in a NEW way is the product; failing the SAME way twice is the signal to CODIFY.** rc03a
taught something new — the eleven channels, the state-space-versus-site-list error. rc13a taught
much less, because it repeated rc03a's error in different clothes, and R-crc-10 exists because the
second one was a repeat.

The D6 system cadence ran SEVEN passes (three internal, three external GPT-5 Codex iterations
plus a parallel clean-context Claude pass) and 42 findings post-apply, every one walked to zero
— and still archived through a `gate_overridden`, because no independent pass ever came back
clean over the final tree. Reading the trail, the cost was not in the reviewers finding things;
it was in the cycle's own mechanics producing the things they found:

- **Instruments that accepted what the real tool rejects.** `gh repo view --repo` and a
  selector-less `gh pr view --repo` were invalid CLI grammar; five passes walked past the first
  because the `gh` stub accepted it and the fidelity sweep checked only for `--repo`'s presence.
  Both were found only when an external reviewer ran the documented command against the real
  binary. The highest-signal instrument in the whole cycle was one the cycle did not own.
- **Walks that created the next pass's findings.** Three of iteration 4's six findings were
  ripple misses from the iteration-3 walk (a spec's recovery recipe, a requirement's surviving
  universal-flag prose, a task's wording); the confirm pass found a shared constant reused one
  consumer past its meaning; the fresh pass found a phase mislabel a walk had introduced the
  day before. The walk edits the example and not the requirement around it.
- **Cadence accounting that the cycle's own shape strained.** Two parallel external files for
  one iteration made the ordinal count files, not iterations; a handoff phrase ("pull and
  review") was read two ways in one afternoon; the gate's "repeat external until none" rule
  met a tree that changed under every pass, so the only exit was the override.
- **Engine tables that lagged their own schemas.** The archive emit's payload table omitted
  the four conditional fields its schema reference defines, so the first proceed-anyway
  archive routed through the D5 surface would have been rejected while recording the very
  field the override requires. Found at the emit, fixed in-flow.

**Measured (2026-09-11, both repos' trails parsed pass by pass).** Findings per change grew
monotonically as the machinery matured — c1 41, d2 56, d3 51, d4 77, d5 100, d6 131 — over 12
to 17 passes each. From d3 onward, later passes land 60–100% of their findings on files the
PREVIOUS WALK had just edited; home-env-test's `surface-parity-audit` ran nine passes and 102
findings, carried zero CRITICAL after pass 3, spent its last four passes 100% on prior-walk
files (counts restated in prose, decision ordering, a percentage that appears nowhere), and
has not passed its gate. In D6, three findings of 131 were the defects that mattered (two
invalid `gh` grammars, the fast-forward hole), and all three came with a reproduction.

Three mechanisms in the cycle itself produce this, independent of the reviewers' quality:

1. **Freshness turns every walk into a mandatory new pass.** A walk edits artifacts; the
   edit stales the last independent pass; the next pass reads the diff first and finds the
   walk's edits imperfect; the loop restarts. The gate cannot converge while walks edit, and
   walks edit while passes find.
2. **The prompts steer the reviewer at the fixed areas.** The external template's `Resolved
   since last review` and `Prior findings still open` sections, and the internal pushback
   rule (`surface what's new or unresolved`), are right for VERIFICATION and wrong for
   REVIEW — they spend fresh eyes on the most recently edited tenth of the artifact.
3. **Severity is unbounded and WARNING blocks convergence.** The confirm predicate needs
   zero CRITICAL and every finding resolved; a WARNING is a judgment call; prose-heavy
   artifacts give a diligent reviewer unlimited defensible WARNINGs. Nothing distinguishes
   "a user path breaks" from "this sentence disagrees with that one".

This program exists to make the review cycle cheaper by making it produce fewer of its own
findings: convergence rules bounded by consequence, review separated from verification,
instruments that enforce the real world, walks that sweep whole requirements, tables that
cannot drift from their schemas, and artifacts that give reviewers less to find in the first
place.

## Goals

One goal per phase, each falsifiable, each stage naming its goal (settled under R-crc-3):

- **G1 — the cycle ends in AGREEMENT (Phase 1).** A change's post-apply cadence ends when the
  independent reviewers agree the work is aligned and on task, and the AI states that it is ready
  to move forward KNOWING what those reviewers returned. The archive records that readiness
  judgement — what was accepted and why — instead of an override. Falsified by an archive whose
  readiness was asserted BEFORE the independent passes it cites, by an independent pass whose
  recommendation is absent or unread, or by a review that GREW the proposal instead of routing the
  expansion to architecture.

  *(REWRITTEN 2026-09-21 under R-crc-11, because the original was falsified by work the user judged
  successful.* It read "converges in at most three passes … or in five with one", and was falsified
  by "a fourth review pass". rc07-artifact-lint ran FOUR independent passes plus an in-context one,
  carried CRITICALs in three of them, archived through the program's first COMPUTED PASSED system
  gate, and was ratified complete. A goal whose falsification criteria fire on the outcome the user
  calls success is measuring the wrong thing: G1 was a COST bound wearing a convergence costume,
  and R-crc-11(c) says cost is not what is being protected. The cost figures are not lost — they
  remain computable from the trail, and Q-crc-18 records what becomes of them.)*
- **G2 — claims a machine can check leave the reviewer's budget (Phase 2).** Documented
  commands run in CI; scenarios name their tests and verify reports the map; restated facts
  fail validation. Falsified if an independent review after Phase 2 carries a grammar defect,
  an uncovered scenario, or a restated-count finding.
- **G3 — less is injected upstream (Phase 3).** Walks sweep whole requirements and record the
  sweep; proposals are size-checked and spike-backed; the end-to-end run precedes the archive.
  Falsified by a ripple-miss finding traceable to a prior walk's sweep set, a proposal over the
  ceiling reaching review, or an archive with the dogfood deferred and no reasoned record.
- **G4 — the engine owns what is deterministic (Phase 4).** The PR choreography's deterministic
  steps are engine-tested and the references shrink by more than half, with the consent
  properties intact. Falsified if any consent property regresses or the references do not
  shrink.
- **G0 — measured on this program's own trail.** Every stage's cadence is the stage's own
  measurement (exit criteria phrased "on the next cadence" mean the stage's own archive); the
  program is complete when three consecutive stages converge under G1.

## Rulings index

- **R-crc-1** (Sal, 2026-09-11) — SIZE CEILING for a design-heavy change: at most 3
  capabilities touched, ~12 requirements, ~40 KB of delta, under 20 tasks. Calibrated on the
  archived stages: every stage over 5 capabilities cost 12–17 review passes; the one
  design-heavy stage that converged in a week (c2-parallel-merge) was 2 capabilities / 9
  requirements / 21 KB. Capabilities touched predicts cost better than bytes. A proposal over
  the ceiling is split before review, never reviewed as one.

  **HOW THE BYTE DIMENSION IS MEASURED, clarified 2026-09-23 (Sal, ratifying option B on rc04c's
  external iteration 1): ~40 KB counts CHANGED bytes, not CARRIED bytes.** The delta format
  requires a MODIFIED block to reproduce its requirement's FULL updated content, so a stage that
  rewrites ten long prose requirements carries their entire text into the delta whether it alters
  one line or fifty. Measured on `rc04c-retire-gate-overridden`: 57,418 bytes of delta across three
  capabilities, of which only ~150 lines differ from their baselines — roughly 43 KB is verbatim
  carriage the format compels. Counting that as size makes the ceiling fire on the FORMAT rather
  than on the work, and it fires hardest on exactly the stages this program keeps producing:
  retirements and de-namings, which touch many requirements shallowly. The calibration point stands
  and explains why — `c2-parallel-merge`'s 21 KB was a MECHANISM stage, where delta bytes and new
  text were nearly the same thing. Changed-bytes is as observable as total-bytes, so R-crc-10
  permits the check rather than only a record.

  **WHAT THIS CLARIFICATION DOES NOT DO.** It does not touch the other three dimensions, and it is
  not a general licence to remeasure a ceiling that is inconvenient. The stage that produced it was
  over on TWO dimensions; only the byte one was measuring the wrong thing. Its task overage was
  left standing as a breach to be ratified under R-crc-9 rather than defined away — redefining what
  counts as a task to get under the bound is the move this ruling exists to prevent, and a stage
  arguing its way under a ceiling should expect the argument to be read as evidence it is over.
- **R-crc-2** (Sal, 2026-09-11) — ORDERING PRINCIPLE for this program: (1) stop the bleeding
  — the cheapest, highest-lever changes to the cycle's own rules first; (2) move checking
  into tests — every claim a machine can verify leaves the reviewer's budget; (3) reduce
  injection upstream — propose and apply produce less to find; (4) engine changes last —
  the riskiest work runs after the earlier phases have removed most of its pressure.
- **R-crc-3** (Sal, 2026-09-11) — DELEGATION OF METHOD: Sal ratifies scope and priority;
  decisions settleable by the state of the art in AI-assisted development are settled by the
  authoring AI and recorded here with their rationale ("I do not think I have the ability to
  drive code development workflow … I will defer to you"). Such decisions are dated and marked
  *(settled under R-crc-3)*; Sal may strike any of them.
- **R-crc-4** (settled under R-crc-3, 2026-09-11) — THE CANONICAL CADENCE: for a change's
  post-apply review, two BLIND reviews (external ∥ fresh) run in parallel on the SAME artifact
  state before any walk; their findings merge into ONE walk; ONE verification pass over the
  walk's diff answers landed / regressed per resolution; converged when the merged reviews
  carried zero CRITICAL and the verification shows no regression. A CRITICAL in the reviews
  buys exactly ONE more blind review after the walk (the new state, not the diff).
  **AMENDED 2026-09-14, on the first pair this repo actually ran, then CORRECTED the same day**: the
  pair is ONE `fresh` and ONE `external` — the classes are not a choice, and the engine already
  admits no other combination. Both halves are IN FLIGHT on one artifact state before either is
  walked. An earlier wording of this amendment said "spawned simultaneously as independent agents",
  which overreached: `external` means a CROSS-VENDOR handoff a human runs in another tool, and orbit
  running inside one assistant cannot spawn an agent of a different vendor. What simultaneity buys is
  available without that claim — both in flight, neither walked — and the blindness predicate already
  enforces it mechanically rather than as a discipline. The classes stay HARDCODED, permanently and
  not merely for now: making the pair's composition configurable would invite the degenerate pairing
  of two same-model reviewers, which buys coverage without the model diversity that is the whole
  point. What SHOULD become one invocation is the launching (see rc03), because the window between
  two separate invocations is exactly where the gate can recommend the foreclosing walk. Their DISAGREEMENT is a first-class
  signal rather than noise: where the halves contradict each other, the contradiction localizes an
  ambiguity neither would have surfaced alone, and is usually settled by one cheap empirical test.
  Nothing is reviewed after a walk except the walk's own diff — the freshness loop is removed by
  construction, not bounded. Proposal-mode reviews follow the same shape with one blind
  review (external OR fresh) unless the change is within 20% of the R-crc-1 ceiling, when the
  pair runs. Rationale: pairs of blind reviewers are the standard instrument for both coverage
  and residual estimation; verification is a different task from review and should not be
  asked of a reviewer; in-context passes yielded one CRITICAL in ~25 across the D-arc.
  **AMENDED 2026-10-05 (Sal, from extended use; rc17 exploration D-bpc-8):** the pair is the RECOMMENDED
  first review, no longer the REQUIRED one. Both reviewed gates read `[<first>, in-context]`: the first
  slot accepts a blind pair, a single fresh or a single external pass, and the user's INVOCATION decides
  what covers it — an invoked pair needs BOTH halves before the slot is covered; a single covers it only
  when the user invoked that single. A per-gate preference in `orbit/config.yaml` (proposal and system
  separately, default blind-pair) changes only the command the readout PRESENTS, never what the gate
  accepts. Unchanged: the pair's composition stays one `fresh` and one `external`, hardcoded, for the
  reason above; the in-context slot after the walk; one verification pass over the walk's diff. The user
  may always proceed past an unpassed gate through the recorded judgement (D-bpc-12). Carried by
  rc17a-invoked-coverage.
- **R-crc-5** (settled under R-crc-3, 2026-09-11; CONDITIONAL) — D-d6-7's "the engine never
  shells to git or `gh`" is REVERSED at the boundary the D-arc's own thesis draws: DETERMINISTIC
  sequences (remote/default-branch resolution, tip comparison, the isolated commit, the record
  push) may live in an engine command the body invokes under the user's own invocation; every
  JUDGMENT step (titles, landmark prose, degradation notes, when to skip) stays in the body;
  the consent properties are unchanged (user-invoked seams only, draft-only creation, merge
  never, no outward write without the same consent the body had). Effective only when rc12 is
  proposed, and only for steps rc05 has shown to be deterministic by executing them. Flagged:
  this reverses a ruling Sal ratified at D6; struck on a word.

- **R-crc-6** (settled under R-crc-3, 2026-09-14) — THE WALK AUTHORS NOTHING. A resolution walk
  has exactly three lanes. **REPAIR**: the artifact says the wrong thing and the right thing is
  local; fix it in the walk. **DESCOPE**: the finding shows the change is doing something it should
  not; remove it — the only lane that makes the next review cheaper. **REDESIGN**: closing the
  finding requires mechanism nobody has reviewed; it LEAVES the change and routes back to
  `/orbit:explore`, which is the only phase licensed to invent. The test is not the finding's size
  but whether closing it requires inventing something unreviewed. Rationale, measured on rc02's own
  cadence (2026-09-14): four proposal passes produced 0C/9W/4S → 3C/7W/1S → 3C/8W/2S → 4C/9W/4S with
  **zero repeat findings across the whole axis** — so this was not the churn the premise describes.
  Each walk answered findings by inventing new mechanism, and each pass then correctly found defects
  in mechanism no reviewer had seen. Of the ten CRITICALs, ONE was a fact explore could have read off
  the product; the other nine were in mechanism that did not exist when explore ended or existed only
  as a sentence of intent. A walk that repairs converges because each fix reduces what is left to
  find; a walk that authors resets the review clock and does so invisibly, because nobody reviews a
  walk. Corollary for measurement (rc04's): prior-walk-file concentration alone cannot separate churn
  from authoring — pair it with the REPEAT rate. High concentration with high repeats is churn and
  the answer is to stop reviewing; high concentration with zero repeats is authoring and the answer
  is to stop walking.

  **DESCOPE SWEEP COROLLARY** (added 2026-09-22, settled under R-crc-3): *descope is "the only
  lane that makes the next review cheaper" — TRUE OF THE MECHANISM, FALSE OF THE ARTIFACTS.* When a
  walk removes something a ratified decision ARGUED FOR, every artifact carrying that argument goes
  wrong the instant the removal lands: the decision record, the proposal's summary of what shipped,
  the task that certifies the decision, the handoff pointing a downstream stage at it. Nothing in
  the lane's definition says they travel with the deletion, and a descope does not LOOK like a
  substantive modification because the diff it produces is a subtraction. Measured on rc04d
  (2026-09-22): its 03:02 walk correctly took this lane on an external CRITICAL, deleting a
  shape-ownership claim from the delta. The delta was then right and STAYED right — the next pass
  found ZERO findings in it. That pass found NINE elsewhere, SEVEN of them descope wake: the
  stage's own designated source-of-truth table still held the refuted wording; the task certifying
  that table claimed it recorded corrections it did not; the handoff record actively pointed the
  downstream stage at the refuted form; the proposal miscounted what shipped; the design's decision
  section still CLOSED with the argument its own body called wrong. So the lane is not complete
  when the artifact under review is correct — it is complete when every artifact that argued for
  the removed thing has been swept, and the sweep belongs to the lane rather than to a follow-up.
  Practical form, because this one is cheap: after a descope lands, grep the change's own artifacts
  for the REMOVED THING'S VOCABULARY before closing the finding. On rc04d that grep is
  `two-owner|shape owned by|moves OWNERSHIP`, and it returns all seven sites in one command.

- **R-crc-7** (settled under R-crc-3, 2026-09-14) — EXPLORE PRODUCES MECHANISM TO THE FIDELITY THE
  ARTIFACT DEMANDS. Where the deliverable is a DECISION PROCEDURE the machine executes, the procedure
  IS the deliverable: it SHALL be worked out and EXECUTED ONCE against real data or a constructed
  case before any spec prose is written. Emergent detail remains legitimate where the artifact is
  not a decision procedure. This GENERALIZES rc09's spike precondition past external tools and
  protocols — the trigger is the shape of the deliverable, not the presence of a foreign API.
  Rationale: every CRITICAL in rc02's passes 2 through 4 was found by constructing an input and
  walking it through the rule, never by reading the rule. That work costs the same at explore time
  and a fraction as much: no spec to rewrite, no walk to author, no review clock to reset. Authoring
  corollary: a decision procedure is specified as a DECISION TABLE or normative pseudocode, where
  empty cases are explicit by construction. **A blanket default does not substitute for stating
  them** (added 2026-09-14): rc02 tried to close the class with one convention — "where a rule's set
  is empty, the reading is the one that does NOT advance the gate" — and the sixth pass showed why a
  default is not a specification. The convention covered three empty cases in the requirement; two
  were harmless because no implementer would read them literally, and the third was the canonical
  happy path, where the default silently means the gate can never converge. A default tells a
  reader what to assume where the author did not think; a table makes not thinking impossible — all ten of rc02's CRITICALs were prose quantifier
  ambiguity (a rule ranging over a set assumed non-empty, or testing EXISTENCE where the property
  needed was usability), and prose is the wrong medium for a procedure a reader must execute.

- **R-crc-8** (settled under R-crc-3, 2026-09-14) — FINDING QUALITY NEVER LICENSES ANOTHER PASS.
  The decision to run one more review is made on WHERE findings live, never on whether they are
  real. A pass can be excellent and the cadence still be wrong, and those two facts are not in
  tension — a program that asks only "did the review find real defects?" never stops, because a
  walk that authors guarantees the next pass finds real defects. The discriminating measure is
  R-crc-6's pair: concentration in walk-authored material, controlled by the REPEAT rate.
  **Corollary — the redesign-lane trigger is SECTIONAL.** When CRITICALs persist in ONE requirement
  or clause across passes while the rest of the change converges, that section is a redesign-lane
  candidate under R-crc-6 and SHALL be removed from the change rather than walked again. A
  change-level concentration figure cannot see this; the measurement must be per requirement.
  Evidence (rc02, six proposal passes, 2026-09-14): 72 findings, 13 CRITICAL, **zero repeats across
  the whole axis** — so the reviewers were never grinding — while the sixth pass put 12 of its 13
  findings in walk-authored material and both its CRITICALs in a sentence written 90 minutes
  earlier to fix the previous pass's CRITICAL. By section, clause (b) took four CRITICALs and
  converged; clause (c) took five and did not. Control against the objection that reviewers produce
  under pressure: the sixth pass was told explicitly that zero findings was a legitimate outcome and
  returned thirteen anyway, with a commentary naming what it had tested and found sound.
- **R-crc-9** (Sal, 2026-09-15) — WHEN THE CORRECT MECHANISM EXCEEDS THE CEILING, SPLIT IT OR
  DECLARE THE STAGE BLOCKED; NEVER SUBSTITUTE A CHEAPER MECHANISM FOR THE ONE THE PROBLEM NEEDS.
  R-crc-1's ceiling is not in question and its calibration held — a stage over three capabilities
  does cost 12-17 passes. What was missing is what a stage DOES when the mechanism the problem
  actually needs is over that ceiling. Empirical origin: rc03a-blind-prompt. Attestation — recording
  on the trail what a prompt carried, so the gate could VERIFY blindness instead of trusting it —
  was identified in its FIRST exploration and deferred THREE times, every time on ceiling grounds,
  because it needs `orbit-run-summary-emit` and `orbit-engine-gates` on top of the stage's own
  capabilities. Each deferral bought a cheaper PREVENTION mechanism, and each cheaper mechanism was
  found wrong by the next independent pass: the premise was false, then the signal was unusable,
  then the state space was halved. Three passes, 15 CRITICALs, zero repeats, stage WITHDRAWN, and
  nothing shipped. "The correct fix exceeds the ceiling, so ship a cheaper one" is worse than either
  building it or not starting — it spends the review budget discovering that the cheap mechanism is
  the wrong mechanism. The two sanctioned moves are to SPLIT the correct mechanism across stages
  whose prerequisites are declared, or to DECLARE THE STAGE BLOCKED on its prerequisite and say so
  in the charter. Neither is a substitution.

- **R-crc-10** (Sal, 2026-09-15) — MECHANIZE ONLY WHAT THE ENGINE CAN OBSERVE. Before a stage
  commits to a mechanism, NAME THE INPUTS the engine will read. If every input is an artifact the
  engine already owns — a trail record, a timestamp token, a count, a file path — the mechanism is
  buildable. If any input is PROSE, INTENT, or a JUDGMENT ABOUT SUBSTANCE, the engine cannot check
  it, and the deliverable is a **RECORD** (a slot the author fills, surfaced where a reader sees it)
  rather than a **CHECK**.
  **Evidence, all from one day.** rc02 SHIPPED: its inputs were trail records, tokens and severity
  counts, and the engine computed them. rc03a spent three passes trying to make the gate see what a
  reviewer had READ — eleven channels, one of them a subagent brief with no artifact at all — and
  shipped nothing. rc13a spent three passes trying to make the emit judge whether an enumeration was
  CLOSED, which is a judgment about prose; its own requirement conceded the engine sees FORM and not
  TRUTH, and that concession was the stage's obituary. Both failures were visible on day one under
  this test, and neither was caught until an external pass.
  **A RECORD IS NOT THE LESSER OUTCOME.** rc02's `budgetExhausted` is a record — reported BESIDE the
  state, never a block — and it is the most load-bearing thing that stage shipped. So is
  `gate_overridden`. The instinct that a record is a consolation prize for a check you could not
  build is what produced both failures.
  **This ruling complies with itself**: whether a mechanism's inputs are observable is a judgment
  about substance, so nothing checks it. It is a ruling, and rc09 carries only the QUESTION.

- **R-crc-11** (Sal, 2026-09-21) — **THE PROGRAM OPTIMISES FOR ALIGNMENT, NOT FOR CYCLE COST.**
  Stated whole, because every earlier ruling in this index assumed the opposite and the assumption
  was never written down. (a) Code and specs are written TO BE REVIEWED, from different angles and
  different AIs; the BLIND PAIR is the mechanism and is the point, not a coverage device. (b) A
  review MUST NOT grow the proposal: findings that are common-sense and tightly aligned with the
  current effort get addressed, and findings requiring EXPANSION are kicked back to ARCHITECTURE —
  which is natural and part of development, not a failure. **The AI makes that call.** (c) When a
  blind pair uncovers something that requires expansion, the REVIEW BUDGET IS NOT THE CONCERN; the
  goal is a good implementation with the extra work routed to architecture. (d) The AI decides
  more and the user decides less: the user is a highly technical product manager confirming
  direction and catching deviation, not defining every aspect. (e) SPECS exist to keep the AI
  aligned and on task; REVIEWS exist so independent reviewers AGREE that it is. Neither is a
  correctness proof. (f) The IN-CONTEXT pass is a REACTION — it uses the context it alone holds to
  react to, push back on, and learn from the independent reviewers — not a second search. (g) The
  readiness signal is **the AI believing it is ready to move forward, knowing what came back in the
  independent reviews**; and independent reviews should carry a general RECOMMENDATION on moving
  forward, which nothing emits today.
  (h) **EFFORT IS RECORDED, NEVER TARGETED** (added by Sal, 2026-09-21, as part of the same
  statement). How much a change cost — passes by class, findings per pass, walks, elapsed span — is
  RECORDED on every change, because it is the evidence base for developing orbit itself and for
  understanding what is actually happening in the dev flow. It never becomes a goal, a bound, or a
  gate input. The distinction is measure-versus-target: a cost TARGET distorts the behaviour it
  measures (a cadence stops early to hit a number, which is the failure R-crc-11 exists to prevent),
  while a cost RECORD is how the tool gets better. Both halves are load-bearing; dropping the
  recording to escape the targeting would throw away the program's only longitudinal evidence.
  **THE RECORDED SHAPE** (ratified by Sal, 2026-09-21, extending (h)). Effort is recorded per PASS
  *and per WALK* — walks are frequently the more expensive half and omitting them would make the
  record describe the cheaper activity. The unit carries its own PROVENANCE, because reliability
  differs by class and a figure that is a measurement in one place and a guess in another is worse
  than no figure at all — it invites averaging across incomparable numbers:

  `cost: { tokens: <number|null>, tool_uses: <number|null>, source: "harness" | "reported" | "unavailable" }`

  `harness` — a real number the runtime reported (a `fresh` pass run as a subagent; measured
  examples from 2026-09-21: 208,424 tokens / 56 tool uses for a system review, 159,151 / 72 for an
  audit sweep, 87,099 / 23 for a spec sync). `reported` — a figure the external tool showed and a
  human transcribed, for an `external` pass orbit cannot see. `unavailable` — no honest number
  exists, which is the truthful value for anything running IN CONTEXT, where the activity has no
  boundary to measure between. A null with a stated source is a record; a null without one is a gap.

  **THE ASYMMETRY, stated because it is the uncomfortable part**: the most expensive activity is the
  least measurable. Walks run in-context BY DESIGN — they need the whole context to be any good —
  so their `tokens` will usually be `unavailable`. Their cost is therefore carried by DERIVABLE
  proxies instead: resolutions walked, files touched, and elapsed. This is a real limit on the
  evidence base, not a defect to engineer away, and it is written down so nobody later reads an
  all-`unavailable` walk column as "walks are cheap".

  **ELAPSED IS FREE AND ALREADY THERE**: every emit is timestamped, so per-pass and per-walk elapsed
  is engine-computed with no new field and applies retroactively to every archived change. It is
  noisy — it includes the human being asleep — and it is still worth recording beside the rest.

  **TOKENS ARE THE FIELD THIS RULING WILL BE TESTED ON.** Named explicitly rather than left to (h)'s
  general protection, because a token count is the most targetable number a development process can
  hold, and the first reader who wants to "bring the cost down" will reach for it. Recording it is
  how orbit gets better; targeting it would make a cadence stop early to hit a number, which is the
  exact failure R-crc-11 exists to prevent. Record it; never bound it; never let a readout rank
  changes by it.

  (i) The division of labour, stated crisply because it is the theme the rest of this ruling
  serves: **the user FRAMES and GUARDRAILS; the AI SOLVES.**

  CONSEQUENCE, stated so it is not discovered later: this ruling REVERSES the premise under which
  G1 and the rc02 budget were written. It does not reverse the blind pair (it promotes it), the
  severity ladder, or any Phase 2/3/4 goal.

- **R-crc-12** (Sal, 2026-09-21) — **A CRITERION WRITTEN BEFORE THE TEST CANNOT GRADE THE TEST.**
  An exit criterion is authored at charter time, before the mechanism exists and often before the
  vocabulary that mechanism will introduce. When the SHIPPED mechanism invalidates the criterion's
  own terms, the stage REVISES the criterion and RECORDS WHY, in the same archive that ships the
  mechanism. It does not quietly satisfy a different criterion, and it does not fail one that was
  measuring the wrong thing.

  **The two instances that produced this.** rc07's exit read `independentSpend: 4` against a
  budget of 3 and was ratified as a MISS, with the real reading recorded as residual risk —
  honest, but it left a criterion standing that the stage had shown to be measuring something
  else. rc04a's exit (3) named THREE `accepted` pairs; the qualifying test the stage SHIPPED
  disqualified one of them, and the stage revised the criterion to TWO with the derivation
  recorded. The second handling is the one this ruling generalises.

  **The boundary, because this ruling is easy to abuse.** Revision is available when the
  mechanism CHANGED WHAT THE CRITERION MEANS — a definition the stage introduced, a test the
  stage shipped, a term the stage retired. It is NOT available when the stage simply did not
  reach the bar: a criterion the mechanism can still measure and does not meet is a MISS, and a
  miss is recorded as a miss. The distinguishing question is whether the criterion is still
  measurable in the shipped vocabulary. If it is, it grades; if it is not, it is revised.

  WHO: the stage PROPOSES the revision with its derivation (a method call under R-crc-3); the
  architect session RECORDS it. A revision that never reaches the doc did not happen.

  **THE THIRD CASE, added 2026-09-22 (settled under R-crc-3; recorded because this ruling says of
  itself that it is easy to abuse): AN INSTRUMENT CORRECTION IS NOT A REVISION, AND MUST NOT BE
  RECORDED AS ONE.** The ruling above splits two cases — the criterion changed meaning (revise) or
  the stage missed the bar (MISS). rc04d hit a third: the criterion was right, measurable, and met,
  while the COMMAND WRITTEN TO MEASURE IT measured something else. Its task 2.2 read
  "`git diff --name-only` for this change touches NOTHING under `src/`/`test/`" — an UNSCOPED
  command standing in for a change-scoped claim, so on a shared working tree it reported a
  concurrent workstream's edit as the stage's. Nothing about the shipped mechanism caused that;
  rc04d shipped NO mechanism, being a pure-vocabulary stage. So the distinguishing question this
  ruling already states — *is the criterion still measurable in the shipped vocabulary?* — answers
  YES, and the criterion GRADES. It graded MET.
  Why the distinction earns a paragraph rather than a footnote: "I fixed the measuring tool" and
  "the criterion changed meaning" produce the same diff in a task file and mean opposite things,
  and only one of them is licensed here. An instrument correction is ordinary repair — it needs no
  licence, it does not touch the charter, and claiming R-crc-12 for it would launder a bad command
  into a ratified change of terms. The recording obligation is unchanged and independent: say what
  the instrument measured, what it should have measured, and what the corrected instrument reads.
  **Corollary for authors**: an exit criterion lives in the CHARTER; the command in a task is only
  its instrument. When they disagree, the charter grades. rc04d's charter exit (2) says `src/` and
  the suite; its task had tightened this to `src/` AND `test/` without the charter ever saying so,
  and it was the unratified half that appeared to fail. A task may not silently narrow the bar its
  stage is graded against.

- **R-crc-13** (Sal, 2026-09-22) — **A GATE REPORTS; IT NEVER RULES. PASSAGE IS A JOINT
  JUDGEMENT.** The mechanics compute a position and the engine states it. The decision to go
  forward from that position is taken TOGETHER, on the facts, by the AI and the user — and the
  same is true of every other decision the flow reaches: whether to split a proposal, whether to
  buy another pass, whether the work is ready. **An emit RECORDS that judgement and tracks
  position. It does not grade how the past went.**

  Stated verbatim because the phrasing is the ruling: *"we move through the flow based on the
  mechanics laid down, but the judgement to go forward is always a joint decision between the AI
  and me … we look at the facts, and then we jointly move forward — passing the gate. The emits
  just help us track the status — they aren't necessarily rendering judgement on how the past
  went."*

  **This is not new behaviour and the ruling does not change any.** `orbit-engine-gates`' own
  override contract has said it since C1 — *"Gates NEVER hard-block — apply-parity enforcement:
  the engine reports, the skill prompts, the user decides, the trail records"* — and D1 built the
  consent model on it. What the ruling adds is STANDING: the contract lived inside one capability
  as an enforcement note, where a later stage could narrow it without anyone noticing the premise
  had moved. It is a program-level commitment now, and a stage that wants to make a gate
  authoritative must argue against this entry rather than merely edit that sentence.

  **What follows from it, named so the consequences are not rediscovered.** (a) R-crc-10's
  "mechanize only what the engine can observe" is a COROLLARY rather than a neighbour: an engine
  that cannot rule has nothing to compute a verdict from, so a judgement input yields a RECORD.
  (b) rc04a's `ratified_by: ai | user` is this ruling's existing mechanism — the field exists
  precisely because the difference between the AI's belief and a joint ratification is a fact the
  record must state. (c) The program's vocabulary does not match the ruling: "override" names a
  breach of authority the gate never had, and Q-crc-23 carries that question with its scope
  unresolved. (d) A readiness record that RECORDS a belief is consistent with this ruling; a
  readiness record that BLOCKED would not be, which is why rc04a's never-blocks clause is load-
  bearing rather than a courtesy.

  **The boundary, since "joint" is easy to over-read.** Joint means the decision is taken on
  shared facts with both parties able to see them — it does not mean every decision needs a
  prompt. R-crc-3 still governs: method is the AI's to settle and record, scope and rulings are
  Sal's. D1's consent model still decides WHERE a prompt fires. This ruling says what a gate IS,
  not how often the user is asked.

- **R-crc-14** (Sal, 2026-09-24) — **A RULE IS STATED ONCE, IN THE SPEC THAT OWNS IT; EVERY OTHER
  SURFACE NAMES IT AND POINTS.** A workflow body, a shipped reference, a sibling capability or
  CLAUDE.md may NAME a rule and state its observable CONSEQUENCE for the reader in front of it —
  "the gate refuses an empty citation when a pass precedes the emit" — but never restates the
  PREDICATE or the SET it ranges over. Two statements of one rule are two extensions, and they
  diverge.

  **Earned by rc04c, which paid for it four times in one change.** (1) rc04d's site-2 edit was
  reversed twice before landing on removal rather than redirection. (2) External proposal iter 1
  found a requirement whose defining clause excluded the record its own lower clause admitted.
  (3) The in-context pass found one predicate with two extensions across two capabilities. (4) The
  system blind pair — both halves, independently — found the token-source sentence pasted into
  four bodies, all four wrong the same way, already diverged from the schema reference's field
  note beside them. Every time, the fix that held was DELETE the copy, keep the owner; every
  attempt to RECONCILE two statements produced a third. rc04c's own preamble named the pattern at
  three and said stop at four; four arrived, and this is the stop.

  **What follows, named so it is not rediscovered.** (a) For RETIREMENTS: removing a field exposes
  every place its behaviour was described, so a retirement stage's sweep looks for RESTATED RULES,
  not only the retired name — the grep for the name found none of the four. (b) For WALKS: when a
  finding lands on a restated rule, the lane is delete-the-copy, never reconcile-the-two; R-crc-6's
  descope-sweep corollary already says deletion is the cheap lane for mechanism, and this extends
  it to prose. (c) For the consumer half: Q-crc-24's reader-backed surface is this ruling's
  mechanism where the "rule" is a computed SET — a body that reads the set from the engine cannot
  restate it. (d) A field NAME in a shipped reference is a POINTER, not a predicate; the schema
  references keep listing fields.

  **MIRROR COROLLARY** (added 2026-09-25, ratified by Sal in chat on rc13a's system walk): where a
  GENERATED surface cannot resolve the owning spec at runtime — a skill body installed into an
  adopter's project, whose `orbit/specs/` are the adopter's, not orbit's — the surface MAY carry a
  MIRROR of the owner's production, on three conditions: the mirror SAYS it is one and names the
  owner; a test holds it BYTE-EQUAL to the owner, so divergence fails the build instead of waiting
  for a fourth reviewer; and the mirror is a COPY, never an extension — nothing is added on the
  mirror side. Earned by rc13a, whose system blind pair found the spec-owned Mechanism grammar and
  the explore body's copy textually different on day one, with nothing holding them equal. The
  remedy that held is rc01's shape — one authority, checked mirrors: the run-summary schema
  reference is documented as "a MIRROR of the engine's authoritative table, never its definition"
  and held there by the schema-table parity test. The fuller form — ONE engine constant that the
  body template, the spec check, the surface test and the parser all read — is rc13b's, recorded
  in that stage's handoff.

  **The boundary.** This does not forbid a body from telling its reader what will happen to them:
  an instruction needs its consequence in place. It forbids the body from carrying the rule's
  DEFINITION — the class list, the exclusion, the comparison — which is what turns a pointer into
  a second extension. The test is whether the sentence could be WRONG on its own: a pointer cannot,
  a restatement can.

## Open questions (program-level)

- **Q-crc-11 — the stage grammar has no WITHDRAWN state, and two stages now need one.**
  Observed 2026-09-15, twice. rc03a was withdrawn after three passes; rc13a's first attempt archived
  without shipping. Both render `quiescent — completion awaiting your ratification` and will render
  that FOREVER, because their exit criteria were not met and ticking `Complete: [x]` would assert
  something false. The grammar has two states where the program now has three: complete, awaiting,
  and ENDED-WITHOUT-MEETING-ITS-CRITERIA.
  Standing recommendation: a third mark — `Complete: [~] <date> (<who>) — withdrawn` or an explicit
  `Withdrawn:` slot — so the readout resolves and a reader can tell a stage that was abandoned from
  one that is merely unratified. It is an `orbit-architecture-engine` change (a D-arc capability, not
  an rc one), so it needs either a new rc stage or a declared exception; recorded rather than
  assigned, because assigning it is a scope call. NOTE the honest counter: a withdrawn stage that
  keeps asking for ratification is ANNOYING but not WRONG, and the two instances cost nothing but a
  confusing readout — this may be worth leaving until a third occurrence.
  **2026-09-25 — the engine-readable INPUT this question was waiting for now exists.** rc13a shipped
  the concluded outcome: `> **Status**: concluded <YYYY-MM-DD>.` as the first non-blank line of the
  `explore.md` in the staging directory the stage's KEPT `architecture:` citation locates. A stage
  cited only by a concluded exploration renders `exploring` until this question's stage teaches
  `state.ts` to read that header — the third state, from the exploration side. Nothing is written to
  metadata (the helpers strip unknown keys, measured), so the header IS the input.
  **2026-09-21 — the counter's own test, sharpened.** The ratification offer fired again for rc03a
  in an architect session and was again declined, which makes the cost RECURRING rather than
  one-time: the readout does not ask once, it asks at EVERY architect session on this doc, forever,
  and each time a human has to re-derive from the charter that the correct answer is "no". That is
  still not a third WITHDRAWN stage, so the standing recommendation does not change — but the
  counter's premise that two instances "cost nothing but a confusing readout" is now measurably
  weaker than when it was written.
  **2026-09-22 — THIRD FIRING, declined again (Sal).** The offer fired for rc03a in a third
  architect session and was declined for the third time, on the same reasoning the charter has
  carried since 2026-09-15. The cost is now a MEASURED CADENCE rather than an inference: three
  sessions, three identical prompts, three identical answers, and the only thing preventing a wrong
  mark each time is that whoever answers re-derives the charter's reasoning. Still not a third
  WITHDRAWN stage, so the recommendation STILL does not change — but the honest counter that opened
  this entry ("worth leaving until a third occurrence") has now been overtaken on its own terms by
  a third OCCURRENCE OF THE COST, which is not the same thing as the third instance it named. Worth
  stating plainly for whoever takes the scope call: the trigger this question set itself is
  ambiguous between "a third withdrawn stage" and "a third time the gap costs something", and the
  second reading is now satisfied.
  **2026-09-25 — ASSIGNED (Sal): `rc15-ended-stage-state`, declared in Phase 4.** Taken up on the
  second reading, after a FOURTH firing for rc03a earlier the same day (declined, then suppressed for
  the rest of the day rather than fired a fifth time). The stage carries both layers — the `Complete:`
  slot's third production for a user-declared ENDED stage, and the state reader consulting the concluded
  header in a citing staging directory — because D-bcs-6 showed them to be one missing state. The
  standing recommendation above is the stage's starting shape, not its specification; the mark's
  spelling is the exploration's. This question CLOSES when rc03a carries the mark and the next architect
  session offers it nothing (rc15's exit (1)).
  CLOSED 2026-10-01 — rc15's exit (1) observed in the architect session on the archive's day: Sal
  answered the three-answer offer with ENDED, the body wrote `Complete: [~] 2026-10-01 (Sal)` into
  rc03a's slot, `orbit architecture status` renders `ended (declared 2026-10-01 by Sal)`, the WAITING
  band dropped it, and the offer did not fire for it again. The firing count stopped at four. The
  second stage this question named (rc13a's first attempt) shipped on its second attempt and is
  ratified complete, so nothing else is owed here.
- **Q-crc-12 — the archive seam is silent when the gate that is exhausted is not the gate archive
  watches.** Observed 2026-09-15, twice in one day. Both rc03a and rc13a archived with
  `review-proposal` reading `budget spent: 3 of 3` and NO inflection prompt, because Step 3.4 is
  scoped to `review-system` — which read `blocked (blocked by incomplete requires: apply)`, and
  `blocked` is neither `unpassed` nor `stale`. `review-proposal`'s `before` is apply rather than
  archive, so the archive seam never asks about it. No `gate_overridden` was recorded either time,
  because no override was offered. This is exactly the moment rc02 built the budget signal for, and
  it fired for neither change.
  Standing recommendation: the archive prompt should fire on ANY gate that is `unpassed` or
  `budgetExhausted` at the seam, not only the one whose `before` is archive — a change that never
  applied still archives past its proposal gate, and that is the case both instances hit. Owner:
  rc10-apply-closure (the archive-side close-out) or rc04-cost-visibility (which owns the
  budget-exhaustion record). **ASSIGNED 2026-09-15 (Sal) to rc10-apply-closure**, which already owns
  the archive-side close-out condition, so the seam's prompt logic is its territory.
  **RECOMMENDATION RE-FRAMED 2026-09-21 (Sal), same reason as rc10's charter: `budgetExhausted` is
  retired and the DEFECT IS NOT.** Read `unpassed` or `stale` wherever the sentence above says
  `unpassed` or `budgetExhausted`. The question stands open and its owner is unchanged; what
  changed is that its recommendation can no longer be implemented literally. Worth noting how this
  was caught — an external reviewer reading the PLAN against the diff, not a check: nothing in the
  repo compares a stage's charter to the engine it will run on, which is the same missing moment
  Q-crc-14 describes one layer down.

Raised by the 2026-09-11 cohesion review (the plan has two parents: the orbit-constrained
seven-step re-cut and the best-practices suggestions; the seams fall where they meet).
ALL TEN RESOLVED the same day under R-crc-3 (Sal delegated method); each entry keeps its
question and recommendation, marked with what was applied — resolved questions are marked,
never deleted.

- **Q-crc-1 — RESOLVED (R-crc-4 captured; rc02/rc03/rc04 re-cut).** Which cadence does the program assume?** rc02's stop rule ("two consecutive
  independent passes") presumes repeated independent passes; rc03 presumes one review then
  verification; rc04's capture-recapture needs two BLIND reviews rc03 never produces. Three
  stages, three cadences. *Standing recommendation:* ONE canonical cadence, owned by rc03 —
  two blind reviews (external ∥ fresh) on the SAME artifact state before any walk; findings
  merged into one walk; one verification pass over the walk's diff (landed / regressed);
  converged when the merged reviews carried zero CRITICAL and the verification shows no
  regression; a CRITICAL buys ONE more blind review after the walk, never an open loop. rc02's
  stop rule restated in those terms; rc04 gets its blind pair for free; premise mechanism 1
  (the freshness loop) is removed by construction.
- **Q-crc-2 — RESOLVED (Goals rewritten G0–G4, one per phase; goal 3 struck).** Goals are stale against the twelve stages.** Goal 3 has no stage (its stage is
  in Considered & out); goal 6 bundles rc02 with rc11; goal 7 bundles rc07/rc09/rc10; rc03,
  rc04, rc12 have no goal. *Standing recommendation:* one goal per phase, each stage naming
  its goal; goal 3 struck.
- **Q-crc-3 — RESOLVED (exit moved to rc05).** rc01/rc05 split one property wrongly.** rc01's exit (1) — an injected grammar
  defect fails the suite — is only true once rc05's extractor EXECUTES commands; a regex
  sweep cannot promise it. *Standing recommendation:* move that exit to rc05; rc01 keeps the
  recorded stub contract and the schema-table test.
- **Q-crc-4 — RESOLVED (rc02 reports budget exhaustion; rc04 records `residual_risk`). AMENDED
  2026-09-12: the gate STATE was reversed to an annotation** — rc02's first external review showed
  a sixth state contradicting three closed-set requirements in capabilities rc02 does not modify,
  and the deciding argument was the modeling one: gate `state` answers whether the gate converged,
  and spend is an orthogonal axis. Exhaustion now surfaces as a `budgetExhausted` boolean, a spend
  clause in the reason, and the position token `unpassed BUDGET-SPENT` / `STALE BUDGET-SPENT`;
  rc04 branches on the BOOLEAN, never on a state. Original resolution follows.** `residual_risk` has two owners.** rc02 says budget exhaustion is a recorded
  residual-risk decision at archive; the archive emit field is rc04's; rc02's exit (3)
  depends on rc04 shipping. *Standing recommendation:* rc02 computes `budget-exhausted` as a
  GATE state; rc04 records `residual_risk` at archive; rc02's exit (3) reads "through the
  stop rule, or with the gate reporting budget-exhausted".
- **Q-crc-5 — RESOLVED (rc03 exit (3) restated).** rc03's exit (3) measures the wrong thing.** "< 30% of the second pass's
  findings on prior-walk files" is false by design once the second pass is a verification
  pass (all its findings are on prior-walk files). *Standing recommendation:* verification
  passes raise zero WARNINGs outside the diff; review passes receive no resolved-since list.
- **Q-crc-6 — RESOLVED (rc06 sole owner; rc10 narrowed to two capabilities).** rc06 and rc10 both carry the scenario map into an emit.** *Standing
  recommendation:* rc06 alone owns the map (verify computes it; the first review reads it);
  rc10 narrows to the end-to-end-before-archive condition (two capabilities).
- **Q-crc-7 — RESOLVED (dependency dropped).** rc09 depends on rc07 for no stated reason** (a leftover from the c5a bundle).
  *Standing recommendation:* drop the dependency.
- **Q-crc-8 — RESOLVED (rc11 moved to Considered & out with a re-entry trigger).** rc11 may be unnecessary under Q-crc-1's cadence** (nothing is reviewed after
  a walk except its diff). *Standing recommendation:* a re-evaluation trigger — revisit after
  rc03's first cadence; defer to Considered & out if no override was needed.
- **Q-crc-9 — RESOLVED (R-crc-5 conditional reversal; rc12 explored as two changes).** rc12 sits at the ceiling's edge** (engine command + pr-lifecycle spec + two
  bodies) and needs the ruling reversing D-d6-7. *Standing recommendation:* pre-split into
  engine command first, body adoption second, when it is explored.
- **Q-crc-10 — RESOLVED (clause struck; self-measurement stated in the preamble and G0).** Premise residue.** The closing sentence still lists "cadence arithmetic that
  matches how passes actually run" (the stage was cut). *Standing recommendation:* strike the
  clause. Also: exit criteria phrased "on the next cadence" are self-measured by the stage's
  own archive — say so once, in the Program stages preamble.

- **Q-crc-13 — RESOLVED 2026-09-18 (repaired in rc07, not deferred; see the re-walk record `address-reviews-2026-09-18T12-54-57Z.json`).** `orbit-architecture-engine`'s opacity contract was FALSE of the shipped parser API.
  Observed 2026-09-17 by the system-mode external pass (GPT-5 Codex) on rc07, and DEFERRED by Sal
  rather than repaired. rc07's MODIFIED delta narrows "the engine reads ONLY" to "the architecture
  PARSER's model contains ONLY" and names the source lint as the single engine-level exception. But
  `ParsedArchitectureDoc.lines` is a public field carrying the WHOLE document, `sliceStageSection`
  reads it downstream to implement `orbit architecture show`, and `countRulingEntries` obtains the
  rulings THROUGH that same field — so both the "nothing downstream may read it" clause and the
  single-exception claim are false as written. Verified, not argued: the field and both readers were
  read at HEAD.
  Standing recommendation: this is a REDESIGN, not a repair — either separate raw document bytes
  from the parsed model, or rewrite the requirement around semantic interpretation versus
  passthrough and name every permitted reader (`sliceStageSection`/`show` included), with a scenario
  exercising the actual public parser shape. Under R-crc-6 redesign routes back to explore, so it
  needs its own stage rather than a walk. CONSEQUENCE while it stood: rc07's `review-system` gate
  could not compute passed — resolution is per-entry and a substantive DEFERRED entry leaves the
  pass unresolved.
  **RESOLUTION (Sal, 2026-09-18): repaired inside rc07 as PROSE, and the redesign framing above was
  over-broad.** The external offered two shapes and the deferral costed the expensive one. Separating
  raw bytes from the parsed model IS a code redesign; rewriting the requirement around what the
  parser INTERPRETS versus what it CARRIES invents no mechanism — every sentence describes code that
  already exists — so R-crc-6 routes it nowhere and it belonged in the change under review, not in a
  new stage. The delta now names a CLOSED two-row table of engine readers that attach meaning to
  passthrough (`sliceStageSection` serving `architecture show`; the source lint's ruling count),
  counted rather than assumed. No code changed; the base fingerprint re-verified; all six original
  baseline scenarios preserved byte-identically; one scenario added making passthrough falsifiable.
  **The lesson worth keeping is about the deferral, not the defect:** a finding in an UNARCHIVED
  delta is not residual risk, because the delta SYNCS INTO BASELINE at archive — deferring one writes
  the false statement into the live contract permanently. Deferral is a legitimate disposition for a
  shipped behaviour with a stated workaround; for an unsynced spec claim it is a decision to publish
  something known to be wrong.

- **Q-crc-14 — the source lint ships with no TRIGGER: nothing in the repo runs it.**
  Observed 2026-09-17 by the system-mode fresh pass on rc07, which checked each path the design
  claimed would pick the check up "for free". `.github/workflows/ci.yml` runs build and test only,
  with no validate step and no npm script calling the CLI; the archive body's pre-archive sweep is
  `/orbit:audit-drift`; every `orbit validate` in a workflow body is the per-item form, which the
  lint deliberately leaves unchanged. Only a hand-written close-out task in a change's own tasks.md
  runs `validate --all`, and that fires at APPLY time — whereas all four motivating defects were
  edits to living governing prose made during WALKS and at ARCHIVE, when no such task is running.
  The mechanism is correct and the blind pair could not break it; what is missing is a moment.
  Standing recommendation: wire the lifecycle seam — `orbit validate --sources` in the archive
  body's pre-archive sweep and in the address-reviews close-out — which lands the check exactly
  where the recorded defects were written. It is a workflow-body change to TWO lifecycle bodies, so
  it is scope rc07 never proposed and no reviewer has seen; it belongs to a stage that declares it.
  rc07 records the same residual in its own design.md with kind and method.

  **SECOND INSTANCE, 2026-09-21 — the missing moment is now MEASURED, not argued, and it is one
  layer up from where this question first found it.** `test/core/sources-registry.test.ts` pins the
  live ruling count at a literal, deliberately: its own comment says a derived oracle can share a
  mistake with the implementation, so the number is stated outright and "when a ruling is added this
  test is the thing that must be updated deliberately." **R-crc-11 was recorded into this doc on
  2026-09-21 and nobody performed that update.** The pin went red and sat red through an entire
  stage's propose, two reviews, two walks and an apply — surfacing only when rc02c's apply ran the
  full suite for an unrelated reason. Nothing in the architect session that added the ruling, and
  nothing at any lifecycle seam since, asked whether the doc's dependent checks still held.

  This sharpens the question in two ways. First, the gap is not specific to the `src:` lint: it is
  ANY check coupled to this doc's live content, and the architect seam has the same hole the archive
  and walk seams do. Second, it supplies the cheap test of whether the standing recommendation is
  sufficient — wiring `validate --sources` into the archive and address-reviews bodies would NOT
  have caught this one, because the tripwire that fired is a unit test, not the lint. Whoever takes
  this up should decide whether the answer is "run the lint at more seams" or the broader "the
  architect seam runs the doc's dependent checks", and the second reading is the one this instance
  supports. Recorded rather than fixed, per R-crc-10: the input is a judgement about which seams
  matter, so the deliverable is this record until a stage declares it.

  **THIRD INSTANCE, 2026-09-22 (recorded 2026-09-24 from rc04c's handoff), and it is a different
  FAILURE MODE from the missing trigger.** The lint enumerates its file domain through `git
  ls-files` — the INDEX. During the window between a consume-mode `/orbit:propose` moving
  `explore.md` with `mv` and the change being committed, the lint reads a path git still tracks and
  THROWS `ENOENT`: it does not report a finding, it fails the suite with an exception, and the file
  at its new path is untracked and therefore unlinted for the same window. Measured at rc04c's
  promotion: the ENOENT set was exactly the moved file; both clear on commit. EVERY consume-mode
  propose opens that window. So the answer to "run the lint at more seams" has a precondition this
  instance names — the lint's domain must survive an uncommitted move — and whoever wires the
  trigger should read the working tree's tracked set, not the index's paths, or tolerate the miss.
  **2026-09-25 — a FOURTH instance, at the ARCHIVE seam.** rc13a's archive flow moved the change
  directory with `mv` and ran the suite before staging: the lint's file domain is `git ls-files`,
  which still listed the change at its old path, so the lint opened files that no longer existed
  (ENOENT) and the suite went red on nothing wrong with the tree. Staging the move — not
  committing — restored 2254/2254. Same failure mode as the third instance (a consume-mode
  propose's uncommitted-move window), now on the other lifecycle move; the domain reads git's
  index, and every workflow move is uncommitted at the moment the suite runs.
- **Q-crc-15 — the engine carries TWO CommonMark fence grammars, and one of them is wrong.**
  Observed 2026-09-17 by the system-mode external pass. `src/core/markdown-fence.ts` is the strict
  shared tracker; `computeFenceMask` in `src/core/parsers/requirement-blocks.ts` is a depth
  heuristic in which a bare delimiter closes the current level regardless of its character or
  length. rc07's ruling parse originally used the heuristic and returned 2 where the answer was 1 on
  a doc carrying a four-backtick fence around a three-backtick example — admitting the fenced
  bullets AND masking the live one. rc07 fixed its own reader by importing the tracker; the
  ARCHITECTURE PARSER still uses the heuristic.
  **MEASURED 2026-09-19, and the measurement reframed the question.** The two grammars were run
  over every tracked markdown file and compared line by line: **5 files of 308 disagreed, 382
  lines of 52,805.** Four of the five were the same capability spec (`orbit-review-external`, one
  live baseline and three archived copies); the fifth was `docs/concepts.md`. So the duplication
  is not a pervasive hazard — it is nearly inert, and it concentrates in two documents.

  **The heuristic is wrong in BOTH directions, which is the part worth keeping.** It does not
  merely differ from CommonMark; it fails on well-formed input as well as rescuing malformed
  input:
  - `orbit/specs/orbit-review-external/spec.md` nested a ```` ```markdown ```` block inside
    another one. CommonMark closes a three-backtick fence at the first bare three-backtick line,
    so the file carried an UNCLOSED fence to EOF and **24 `### Requirement:` / `#### Scenario:`
    declarations sat inside a code block** — rendering as one grey block on GitHub. The heuristic's
    depth counting accidentally rescued them, which is why nobody noticed for months.
  - `docs/concepts.md` is authored CORRECTLY, with a four-backtick outer fence. The heuristic
    treats the first bare three-backtick line inside it as a close and lets seven lines of an
    ASCII diagram escape the fence. The shared tracker gets it right.

  **The document half is DONE (2026-09-19):** the spec's outer fence is now four backticks. The
  fix was verified inert to the engine — the shipped parser sees the same 9 requirements before
  and after, `validate --all --strict` clean, 2199 tests green — so it repairs the RENDERING
  without touching any requirement. `docs/concepts.md` needed no change; it was already right.
  Recorded convention exception: a baseline spec was edited DIRECTLY rather than through a
  change delta, because the edit alters two fence characters, changes no requirement text and no
  parse, and no active change fingerprints that capability. Routing two characters through a full
  lifecycle would have been disproportionate.

  Standing recommendation, now sized: delete `computeFenceMask` and point its two consumers
  (`requirement-blocks.ts`, `architecture/parser.ts`) at the shared tracker, landing the corpus
  comparison as a TEST so a future malformed document fails loudly instead of being silently
  rescued. After the document fix FOUR files still disagree: three are ARCHIVED copies of the same
  spec — records, never validated, correctly left alone — and one, `docs/concepts.md`, is LIVING
  documentation the heuristic mis-parses, which is the instance this entry describes correctly two
  paragraphs above and is the reason the deletion is worth doing at all. (An earlier wording said
  "only three … all three archived", which would have let a follow-up conclude no living document
  was affected. Corrected at rc07's pre-archive sweep.) This is an ordinary SMALL CHANGE (one
  MODIFIED capability at most, well under R-crc-1's ceiling), not a stage: it is only weakly
  on-program, and a stage's cycle would cost an order of magnitude more than the work. Not done
  inside rc07's walk deliberately — the parser is shared by `architecture status`, `show` and
  `validate`, and inventing that mid-walk is what R-crc-6 forbids.
  **2026-09-25 — the count is THREE, not two.** rc13b's external proposal pass (GPT-5 Codex) executed a
  counterexample against `src/core/parsers/explore-counter.ts`'s LOCAL fence scanner: it remembers three
  delimiter characters and closes on a prefix match, so a four-backtick fence closes on an inner
  three-backtick line, and it accepts fences indented past CommonMark's three-space limit — a fenced
  decoy was counted as a decision and the live entry after the real closer was hidden. rc13b's delta
  makes both the counter and its new form parser import `createFenceTracker` from
  `src/core/markdown-fence.ts`; that retires one of the three grammars in passing and leaves this
  question's original two. The lesson for this entry's small change: grep for every local fence regex
  (`{3,}` against a backtick or tilde) before declaring the count, because the third was found by a
  reviewer executing a case, not by anyone counting.

  **WIDENED 2026-10-03 at rc02b-severity-ladder's system blind pair — the same disease, one grammar over.**
  rc02b framed the EXTERNAL FINDINGS format as "two readers, one contract" (`parseExternalMarkdown` in
  `trail.ts`, `normalizeExternalPass` in `report-render.ts`) and brought the second to the first; the fresh
  half found a THIRD copy in the same file the change edited — `lenientExternalCounts`, the trend counter —
  carrying the retired last-`**File**:`-wins bug verbatim, and both halves found the two reconciled readers
  disagreeing a second time, on where a Description body OPENS (the renderer on the label, the gate's
  reader only on same-line text — a renderable pass was a rejected return). All three were patched in
  place under R-crc-6's repair lane and the rules stated once in `orbit-conventions`' format requirement,
  with the (title, file) key pinned through the two gate-facing readers by test; the COLLAPSE was declined
  as redesign and is this question's. Standing recommendation unchanged in direction, revised in size:
  when this question is taken up, its stage owns THREE external-format readers plus the two fence
  grammars, not two and two — re-measure before sizing. One carried residual belongs here too: the trail
  reader's has-a-body test reads a `**Reproduction**:` line inside a code fence as the label while the
  renderer reads it as content (no input constructed makes the difference observable; rc02b's archive emit,
  readiness accepted (a)) — a one-line symmetry fix for whichever change next touches `trail.ts`.

- **Q-crc-16 — RESOLVED 2026-09-20 (both halves applied together, as the entry required).** This doc stated its own stage count twice, unmarked, and once staler than the other.
  Observed 2026-09-17 while applying rc07's recommended amendments. The header blockquote
  (`Status (2026-09-11)`) says the program was "re-cut into twelve small stages", and the Program
  stages preamble says "Eighteen small stages in four phases". The second is currently true; the
  first is a dated record of that session, but it sits in a blockquote that ALSO carries a
  hand-written state claim which is now false — "Stage charters are proposed until a citing change
  exists; goals remain proposed" — of the kind `/orbit:architect` says to flag for DELETION rather
  than update, because every hand-maintained state line is a future staleness bug.
  **RESOLUTION.** Both halves applied together, as the coupling required. The header blockquote is
  DELETED — the R-d-4 subtraction; all three of its clauses had gone false (twelve stages, charters
  proposed, goals proposed) and `orbit architecture status` already answers everything it claimed.
  The Program stages preamble's count is MARKED IN PLACE, `Eighteen` converted to the numeral a
  marked span requires. Doing one without the other would have left a marked figure beside an
  unmarked stale duplicate — the exact rule rc07 exists to enforce, committed inside rc07's own
  program doc.

  This superseded rc07 task 5.5's recommendation to WRITE a new current-state sentence: the doc
  already had a living present-tense one, so marking what exists beat adding a third voice.

  Verified rather than assumed: the mark FAILS when the source moves (declaring a nineteenth stage
  produced `source 'stages' emits "19", but the marked span reads "18"`), and it is free of the
  self-reference hazard the spec records — the mark sits above the first counted `### Stage`
  heading, so it is outside the text its own source is computed from. This doc is now the second
  marked document in the repository, and the first that is not `CLAUDE.md`.

- **Q-crc-17 — a walk record can certify NOTHING and still read as a clean walk.**
  Observed 2026-09-18, on this program's own cycle, and caught by Sal asking whether the last
  review had actually been walked rather than by any check. rc07's fresh-half walk applied and
  verified all ten of its findings, but the log was written with hand-RETYPED finding titles —
  abbreviated, em-dashes dropped, backticks lost. The gate matches a resolution entry to a finding
  on `(title, file)`, so NOT ONE of the six substantive entries matched: the pass read as entirely
  uncovered while the record declared `resolved: 10, deferred: 0`. The fixes were real and in the
  tree; the record certified none of them.
  **Two things made it invisible.** The gate evaluates COVERAGE (clause a) before RESOLUTION
  (clause b), so while the `in-context` cadence slot was still empty the reason line named the
  missing slot and never reached the uncovered pass — the readout looked like progress. And the
  walk body composes entry keys by hand, so the one field the gate keys on is the one field no
  mechanism checks. This is the stage's own thesis turned on the cycle that produced it: a log that
  silently certifies nothing is a review reporting itself clean over files it never read.
  Standing recommendation: `orbit emit address-reviews` already receives `source_path` and already
  fail-loud-validates the frozen record at write time; it can read that source with the SAME parse
  the trail uses (external markdown AND internal review/audit-drift JSON — reuse it, never restate
  it, per the two-fence-grammars lesson in Q-crc-15) and compare keys. The R-crc-10 split matters
  here, because the two directions are NOT symmetric:
  (a) an ENTRY whose key matches no finding in the source is a pure defect with no legitimate
  reading — nothing an author intends produces it — so it FAILS THE WRITE, naming the entry;
  (b) a FINDING named by no entry may be a deliberately scoped subset, which the engine cannot
  observe, so it is RECORDED — an engine-computed `uncovered` list on the emit — never refused.
  Recording (b) is what would have made this visible in seconds: the gap becomes a field instead of
  a silence. NOTE the honest limit: `source_path` is AI-supplied, so a record pointed at the wrong
  file still passes both halves. That is a smaller hole than the present one and is not closed here.
  Recorded rather than assigned; it is engine work on the emit surface, and rc07 is already carrying
  a walk's worth of new mechanism.
  **SECOND OBSERVATION 2026-09-22 (rc04d), and it is clean — which is the point.** That walk's nine
  entries matched all nine findings on `(title, file)`: measured, not assumed —
  `entries matching a finding: 9, orphan entries: 0, uncovered findings: 0`. The keys matched
  because the author happened to copy them verbatim while the source JSON was in context. NOTHING
  CHECKED IT. The gate went `unpassed → passed` on those keys, and would have gone
  `unpassed → still unpassed, reason naming a different clause` on nine retyped ones, with the
  fixes equally real in the tree either way. So the hazard's realisation is a coin-flip on author
  diligence at the moment of writing, and a clean instance is evidence about THIS WALK rather than
  about the mechanism. The standing recommendation above is unchanged and still unbuilt.

- **Q-crc-18 — RESOLVED 2026-09-21 by R-crc-11(h): effort is RECORDED, never targeted.** The
  question as first written asked "what becomes of the cost figures", which was vague enough to be
  unactionable. Concretely there are six, and they are three different kinds of thing:
  **EFFORT** — (1) pass count by class, (2) budget spend, (3) findings per pass trending.
  **RESIDUAL** — (4) the capture-recapture estimate from a blind pair's overlap, (5) whether the
  cadence ended on a walk or a pass.
  **DIAGNOSTIC** — (6) churn-versus-authoring, per requirement.
  RESOLUTION: (1)-(3) are RECORDED on every change and TARGETED by nothing — that is R-crc-11(h)'s
  whole content. (4)-(5) are subsumed by R-crc-11(g): an AI stating readiness after reading the
  independents IS someone having read the final state, so the proxy is redundant rather than wrong.
  (6) is re-homed as an INPUT to the readiness judgement rather than a cost readout — "the last two
  passes found nothing in new territory" is evidence of alignment, and "every round the walk invents
  mechanism the next round breaks" is evidence against it.

  **The finding that made this cheap: effort is ALREADY recorded, and what is missing is a READER.**
  A full profile for every archived change — passes by class, walks, findings per pass, elapsed span
  — was derived on 2026-09-21 from existing `.orbit-runs/` trails with NO new instrumentation. The
  same shape as `gate_overridden` being write-only: the data exists and nothing consumes it. So the
  deliverable is a reading surface, not a recording obligation, which is both cheaper and more
  robust — there is no new field anyone can forget to write.

  What the first reading already showed, recorded here because it is the kind of thing this
  evidence base exists to produce: **findings-per-pass going back UP is the signature of a walk
  having invented mechanism.** Changes that converged are monotonic (`c1: 5,0,0,0`; `c2: 3,0,0`;
  `consent: 3,0,0,0`); changes that ground oscillate (`d5: 8,6,1,1,3,9,0`; `d6: 3,12,8,6,3,8…`;
  `rc07: 12,8,5,10,5` — the jump to 10 at pass four is the external pass finding defects in code the
  previous walk had just written). Nothing in the tooling said so at the time; it took reading a
  reviewer's prose.
  The one thing the trail CANNOT yield retroactively is token cost — see R-crc-11(h)'s recorded
  shape, ratified 2026-09-21: `cost: {tokens, tool_uses, source}` per pass AND per walk, with
  provenance in the unit because a `fresh` subagent yields a harness number, an `external` pass
  yields a transcription, and anything in-context yields nothing honest. Everything else in the
  profile above is derivable from records that already exist.
  Standing recommendation: the reading surface is cross-change and program-level rather than
  per-change, so it belongs beside `orbit architecture status` rather than in a change's readout.
  Whether that is rc04's to build or its own small stage is not settled here.

- **Q-crc-19 — RESOLVED 2026-09-21 (Sal): YES. `budget` is demoted to a recorded figure.
  DELIVERED 2026-09-21 by rc02c's apply.** `budgetExhausted`, the `independentSpendFresh` trigger
  count, both `BUDGET-SPENT` position tokens and the `budget spent: N of M` reason clause are gone
  from the engine. `budget` keeps its grammar slot with no version bump and nothing consults it;
  the record is `independentSpend`, which now reports on MODE alone rather than on an inert
  declaration happening to be present, and renders ALONE — `[spend 1]`, never a ratio. The `4 of 3`
  readout this question resolves against cannot be produced by any surface.
  rc02 built `budget` to bound convergence cost and made exhaustion a boolean reported BESIDE the
  state — deliberately never a block. R-crc-11(c) establishes that cost is not what the user is
  protecting, and R-crc-11(h) establishes that effort is RECORDED, never TARGETED. `budgetExhausted`
  is a target-shaped signal by construction: it says "you have spent too much", which is the one
  thing the ruling forbids the record from saying.

  **What is decided.** The SPEND figure survives, as effort under (h): how many independent passes a
  cadence ran is exactly the kind of number the evidence base exists to hold. What stops is the
  spend COLOURING THE GATE — the reason string, the distinct position token, and the
  `budgetExhausted` boolean itself, all of which exist to make a reader feel the cost. A gate should
  report what is MISSING, not what was SPENT.

  **The evidence this resolves against, rather than the argument.** rc07 ran a FOURTH independent
  pass over an exhausted budget. That pass was the most valuable of the five: it validated the
  format change the previous walk had made, confirmed the migration fails loud, and named the root
  cause — completeness inferred rather than carried — that four rounds of patching had missed. The
  only cost of running it was a readout line saying `4 of 3`, and the only effect of that line was
  to make a good decision feel like a transgression. That is the distortion R-crc-11 exists to
  prevent, observed in the wild.

  **What this REVERSES, stated plainly because rc02 is archived, complete and user-ratified.** Part
  of rc02's shipped model goes: `orbit-engine-gates`' budget reporting (baseline lines 324-326 price
  the repeat and report exhaustion) and the schema's `budget: 3` on both reviewed gates. The rest of
  rc02 — the blind pair, the substantive-only resolution, the cadence slots, `assignCadence` — is
  UNTOUCHED and in several places PROMOTED by R-crc-11. This is a narrow reversal of one signal, not
  a repudiation of the stage.

  **The schema fork is SETTLED too (Sal, 2026-09-21): `budget` STAYS in the grammar.** Removing it
  would cost a schema version bump and a migration of every declaring schema, for no behavioural
  gain — the gate simply stops consulting it either way.

  But an inert field that LOOKS live is a landmine, and this program has spent two stages on exactly
  that defect, so the retained declaration is given a job rather than left as a vestige. `budget`
  becomes the cadence's **DECLARED EXPECTATION** — what a pair plus one repeat is expected to cost —
  which is genuinely useful documentation at the point a schema is authored. Effort records what the
  cadence ACTUALLY cost (R-crc-11(h)). **Nothing compares the two automatically**, and that gap is
  the entire point: a declared expectation informs an author, while an automatic comparison against
  it is a target, which (h) forbids. The spec must say this plainly — a reader who finds `budget: 3`
  and assumes it constrains something is the failure mode this decision creates and must therefore
  close.

  **Who implements it.** rc02c owns the predicate, so it owns this: a MODIFIED delta on
  `orbit-engine-gates` retiring `budgetExhausted`, the distinct position token and the budget clause
  in the reason string, while restating `budget` as a declared expectation; plus the schema comment
  at `schemas/spec-driven/schema.yaml` (which today describes the exhaustion boolean and the
  position token) and the baseline prose at `orbit-engine-gates` lines 324-326 that prices the
  repeat. No schema version bump.

- **Q-crc-20 — a gate can compute PASSED over mechanism no independent pass has read, because
  freshness keys on APPLY tokens and a walk's commits are not an apply.**
  Observed 2026-09-21 on rc02c's own cadence, at the moment its `review-system` gate passed.
  The blind pair read the tree at `fbcee57`. The walk that resolved their findings then landed
  **42 insertions and 24 deletions of ENGINE code** — a two-branch change to how gate status is
  assembled (the `spendFields` hoist), the conditional spreads in `formatChangeStatus`, the
  passed-gate reason string — plus the normative rules and scenarios behind them. The gate
  computed `passed` over that tree. It was not wrong: clause (a) coverage and clause (b)
  resolution were both genuinely satisfied, and the freshness rule invalidates passes only when a
  LATER APPLY TOKEN exists. A walk's commits are not an apply, so nothing marked those passes
  stale, and nothing needed to.

  **The gap is not a defect in the rule; it is a category the rule cannot see.** R-crc-6 says the
  walk authors nothing, and where that holds the rule is exactly right — repairs to prose and
  records need no re-review. But this program has TWICE recorded walks that DID author mechanism:
  rc02's cycle ("nine of the first ten CRITICALs sat in mechanism that did not exist when the
  exploration closed"), and rc02c's own decision lane, where two ratified options became engine
  behaviour mid-walk. When a walk authors, the gate's passed verdict covers a tree that is no
  longer the tree anybody independent read, and NOTHING SURFACES THAT — not the state, not the
  reason, not the position readout.

  Standing recommendation: **do not make this a new gate state or a blocking rule.** The reasoning
  that retired `budgetExhausted` applies, and a gate that re-opened itself on every commit would
  be unusable. The deliverable is a RECORD under R-crc-10, because the input is a judgement about
  whether a walk AUTHORED or merely REPAIRED and no engine can observe that: at the archive seam,
  surface how much of the tree changed since the last independent pass and let the human decide
  whether it needs another look. The figure is already computable from the trail and the diff.
  Related: `rc04-readiness-record` owns the record this would feed, and R-crc-6's
  repair/descope/redesign lanes are the vocabulary for classifying which kind of walk happened.
  Recorded rather than assigned; assigning it is a scope call.

  **What it cost here, for calibration**: nothing yet, and possibly nothing at all — rc02c bought
  a scoped external pass BY CHOICE over the passed gate to cover exactly this diff (iteration 2,
  packaged 2026-09-21). That decision came from reading the evidence, not from a prompt, which is
  the behaviour R-crc-11 wants. It is also precisely why this question exists: it should not have
  depended on the authoring AI happening to notice.

  **Nearest proxy, NOT a closure (`rc03c-verification-record`, at archive 2026-10-04 — D-rc03-15).**
  rc03c ships the closest thing the engine has to this record, and it is named here so it is not
  mistaken for one: every review emit now stores `verified_walks` — the walks an in-context
  VERIFICATION-genre pass graded — and that pass reads each walk entry's SWEEP SCOPE, its `file`
  plus its `ripple_cascade.applied` paths, grading every `resolved` entry `landed` or `regressed`
  (`orbit-emit-composition`; `orbit-review`'s `Verification-genre passes grade the walk record`).
  What a walk AUTHORED therefore now has a reader after the pair, and a git-diff residual check from
  the base file names what the walk touched without saying so. It does NOT close this question,
  for three reasons: the sweep scope is the walk's CLAIM of what it touched, not an observation of
  the tree; the verifying pass is in-context, so it is not the independent read this question asks
  about; and a `landed` verdict is a judgement the engine checks only for completeness, never for
  truth (R-crc-10). The question stays open.

  **SECOND INSTANCE 2026-09-22 (rc04d), and it is SHARPER than rc02c's — the walk changed the
  REVIEWED SENTENCE ITSELF.** rc02c's walk authored engine code ADJACENT to what the pair read.
  rc04d's blind pair (external GPT-5 Codex 02-21-40Z, fresh 02-25-46Z) reviewed a site-2
  replacement reading *"The record's SHAPE is owned by the EMITTING COMMAND'S OWN CAPABILITY —
  `orbit-run-summary-emit` for the apply emit, `orbit-archive-modifications` for the archive
  emit"*. The external half's CRITICAL refuted it; the 03:02 walk took the descope lane and DELETED
  the clause. The shipped requirement now reads *"the FIELD those facts are carried in, and its
  shape, belong to the emit layer and are not named here"* — a sentence NO INDEPENDENT PASS HAS
  EVER READ. The only pass over it is in-context (03:10Z). The gate computed `passed`, correctly:
  coverage and resolution are both genuinely satisfied, and no apply token followed, so nothing
  went stale.
  **The calibration figure this question asks for is unusually clean here**, because the walk that
  followed was measured prose-only: `git diff --stat` on `specs/` byte-identical across it,
  fingerprints 5/5, 2238/2238 green. So the record would read *one normative sentence changed since
  the last independent pass, in the requirement that pass was reviewing; everything since is
  prose.* That is exactly the figure a human needs and exactly the figure nothing surfaces. Note
  what it also shows: the DESCOPE lane is the cheap one for mechanism (R-crc-6) and the expensive
  one for this question, because deleting a reviewed sentence leaves a replacement nobody read.

- **Q-crc-21 — the Touchpoints parser reads a LINE where its own spec says LIST ITEM, and drops
  the difference silently.**
  Found 2026-09-21 by the pre-archive audit sweep on rc04a, then verified directly against both
  sides. `orbit-propose-modifications` defines an entry as *"a markdown list item whose LEADING
  inline-code span(s) name the targets"*, with several `+`-joined spans permitted for grouped
  alternatives. `src/core/parsers/touchpoints.ts:31` anchors `LIST_ITEM` to `/^\s*[-*+]\s+(.*)$/`
  — a LINE. A list item that WRAPS therefore loses every target on its continuation lines, and
  the loss is SILENT: the dropped members are not reported `malformed`, they simply never enter
  the predicted map.

  **Observed live, in the change that found it.** rc04a's own `design.md` declares a three-member
  baseline group across three lines; the engine's predicted map carries two of them, and
  `orbit/specs/orbit-archive-modifications/spec.md` is absent. No wrong answer resulted there —
  the whole group was unsatisfied pre-archive either way — but a wrapped group whose later member
  IS touched yields a false `predicted_unsatisfied` AND a false `actual_unpredicted` from one
  defect, in a check whose entire output is those two lists.

  **Why it belongs on this list rather than in a stage.** It is the same shape as Q-crc-15 (two
  fence grammars, one wrong) and as rc07's retired inline-code scanner: a line-grouping heuristic
  standing in for a block parser. That is now the THIRD instance of one class, which is the
  threshold at which this program has previously stopped patching instances and named the class —
  and rc07's lesson was that REMOVING THE NEED beat patching the bug. Sizing looks ordinary (one
  parser, one spec, its scenarios), so it is a candidate stage rather than a question needing
  research.

  Standing recommendation: **fold it into Q-crc-15's stage rather than chartering a fourth.**
  Both are one-parser-one-grammar defects in the same engine, both are ordinary-sized, and a
  single stage that fixes the fence tracker and the touchpoints entry parser together would cost
  barely more than either alone while making the CLASS the unit of work rather than the instance.
  Whether that stage exists, and whether these two belong in it, is a scope call.

- **Q-crc-22 — the blind pair has a PRODUCER and no CONSUMER: no invocation walks two passes
  together, and the one that looks like it does silently walks one.**
  Raised 2026-09-22 after the gap was hit for the SECOND time in a single session (rc04a's system
  pair, then rc04d's), resolved by conversation both times because no command does it.

  rc02 shipped `blind-pair` as a two-member cadence slot and R-crc-4 requires both members to
  return before EITHER is walked — the gate enforces it, and its reason string says so in words.
  But every ingest path on the walk side is SINGLE-SOURCE, verified against the shipped bodies
  rather than remembered: `--from-file <path>` takes one path and is specified as "always
  exclusive" (it suppresses marker grep and auto-discovery); auto-discovery picks "the SINGLE
  most-recent file by filename `<TS>` token"; there is no multi-path flag; and `address-reviews`
  is not a CLI command at all, so there is no engine-side parse to extend — the only engine
  surface is `orbit emit address-reviews`, which writes ONE record per invocation.

  **The sharpest edge is not the missing feature, it is the SILENT one.** Bare
  `/orbit:address-reviews <change>` — the form that reads as "walk this change's findings" —
  auto-discovers the single most-recent pass. Run against a returned blind pair it walks whichever
  half arrived later, ignores the other, and produces a resolution log that reads as complete. At
  rc04d that would have walked the fresh half and dropped the external half's CRITICAL. Clause (b)
  would then have gone on to report the unwalked half as unresolved, which is the system working —
  but only after the walk had already presented itself as finished.

  **Why this is a CLASS, not an oversight.** It is the same shape as Q-crc-14 (a lint that ships
  with no trigger): a mechanism is built, and the surface that CONSUMES it is never built, so the
  mechanism's guarantee depends on a human remembering the procedure. rc02 built the pair; nothing
  built the pair's walk. Two sessions of evidence now say the procedure does not survive contact
  without the operator reconstructing it each time.
  **2026-10-04 (rc03 exploration, D-rc03-5):** the PRODUCER side is narrower than this entry assumed —
  `gates.ts:798-805` already outranks the walk recommendation while a pair is open, so the engine never
  recommends the foreclosing walk; what remained was same-turn overlap, now one sentence in rc03b's
  review body. The CONSUMER side — one walk over both halves — is unchanged and stays rc08's.

- **Q-crc-23 — the word "override" encodes the hard-gate authority the program does not claim,
  and one requirement is visibly arguing with itself about it.**
  Raised 2026-09-22 (Sal, top-down, mid-walk on rc04d): *"i've never been a big fan of hard gates
  … we move through the flow based on the mechanics laid down, but the judgement to go forward is
  always a joint decision between the AI and me … the emits just help us track the status — they
  aren't necessarily rendering judgement on how the past went."*

  **The contract already says exactly that**, and has since C1: `orbit-engine-gates`' own
  `Inflection-prompt override contract` closes *"Gates NEVER hard-block — apply-parity
  enforcement: the engine reports, the skill prompts, the user decides, the trail records."* The
  PHILOSOPHY is not in dispute and is not new. What is in dispute is the VOCABULARY wrapped around
  it, because you override something that had authority over you, and under this contract the gate
  never had any.

  **The tension is visible inside a single requirement.** Its title is `Inflection-prompt OVERRIDE
  contract`; its first scenario is `Override recorded, NOT PREVENTED` — a scenario name already
  arguing with the title it sits under; and the field it mandates is `gate_OVERRIDDEN`. Meanwhile
  rc04a's successor record names the same event the other way without anyone having noticed:
  `continuation` / `proceed`, formed against named evidence, carrying `ratified_by: ai | user` —
  a JOINT DECISION RECORDED rather than a breach logged. The new vocabulary was already built on
  the frame this question asks about.

  **Measured before being characterised**: `override` appears 48 times across `orbit/specs/`
  (heaviest in `orbit-base-fingerprints` 8, `orbit-archive-modifications` 15) and the workflow
  bodies carry 17 `gate_overridden`, 9 `Proceed anyway` and 5 `proceed-anyway`. Note the
  fingerprint and audit-drift seams use `override` for their OWN proceed-anyway prompts, so this
  is not one field's vocabulary — it is the program's word for "the human decided to continue",
  used at four distinct seams.

  **Why it matters beyond taste.** `rc04c-retire-gate-overridden`'s charter says it retires a
  FIELD. If the frame is wrong, the honest scope is a WORD across ten capabilities and four
  seams, which is far past R-crc-1's ceiling and would trigger R-crc-9 on sight. A stage that
  believes it is doing the former while the program means the latter is exactly the
  mis-scoping this program keeps recording.

  Standing recommendation: **do NOT widen rc04c.** Keep it retiring the field, and declare the
  vocabulary reframe an explicit NON-GOAL in its charter so the boundary is stated rather than
  discovered mid-apply. Whether the reframe becomes its own stage, rides an existing one, or is
  judged not worth doing at all is a SCOPE call — raised here, not taken. Worth weighing when it
  is taken: the successor vocabulary already exists and is already right, so the cost may be
  mostly mechanical once `gate_overridden` is gone; and a rename that touches four seams for
  conceptual clarity alone is precisely the kind of change R-crc-11 says to judge on ALIGNMENT
  rather than on cycle cost.

  **RE-MEASURED 2026-09-24 at rc04c's apply, as this entry asked.** Whole word, case-insensitive:
  `override` reads 53 across `orbit/specs/` on the pre-sync tree and **46 post-sync** (computed by
  substituting rc04c's delta requirements for their baseline text: `orbit-archive-modifications`
  16→11, `orbit-run-summary-emit` 4→2, every other capability unchanged — base-fingerprints 10,
  conventions 6, engine-gates 6, pr-lifecycle 6, source-lint 2, one each in address-reviews,
  audit-drift and propose-modifications). Workflow bodies: `gate_overridden` 17→**0**, the word
  `override` 17→**11**. The 48 above was a different count on an earlier tree; whoever takes the
  scope call inherits **46 + 11**, across ten capabilities and the same four seams.

  **THE NON-GOAL HALF IS APPLIED 2026-09-22.** rc04c's charter now carries an explicit NON-GOAL
  declaring the reframe out of scope, with the measurement and the R-crc-9 reasoning stated there
  rather than left for its exploration to rediscover — which was this recommendation's whole
  point. Recorded here because a standing recommendation that is quietly acted on becomes
  indistinguishable from one nobody read. THE SCOPE CALL REMAINS OPEN AND UNTAKEN: whether the
  reframe becomes its own stage, rides an existing one, or is judged not worth doing at all. Note
  one thing the charter now says that sharpens the question — retiring the field shrinks the wrong
  word's footprint as a SIDE EFFECT, since rc04a's successor vocabulary already names the event
  correctly. So the residual reframe after rc04c is smaller than the 48-occurrence figure above
  suggests, and whoever takes the scope call should re-measure rather than inherit that number.

  Standing recommendation: **`rc08-walk-completeness` should own this, and it is the strongest
  evidence that stage has.** The minimum deliverable is not a merge feature — it is making the
  SILENT case loud: when a change's trail carries an unwalked pass that the selected source does
  not cover, the walk SAYS SO rather than reporting clean. Whether the surface also grows a
  two-source ingest is a design call for that stage; whether rc08 is the right home, and when it
  runs, is a scope call and is raised here rather than taken.


- **Q-crc-24 — the citable-pass set is enumerated BY HAND in four workflow bodies, and the
  enumeration was wrong in all four the same way.**
  Found 2026-09-24 by BOTH halves of rc04c's system blind pair, independently. The token-source
  sentence — "list `.orbit-runs/`, take each `review-<mode>-<TS>.json` whose class is fresh or
  external, plus each `external-<mode>-<TS>.md`; that set is exactly what the write gate resolves
  against" — is one paragraph pasted into apply's proceed seam, archive Steps 3.4 and 5.5, and
  review's spend record. The write gate's set is `readTrail(...).passes` filtered to the two
  independent classes, and the trail reader routes an unreadable external return to
  `rejectedExternals`, so the enumeration over-counts by exactly the rejected returns. On a trail
  holding only such a return the reference taught `formed_against: []` and the body taught citing
  the token — a refusal, and at archive a refusal AFTER the move. Repaired once, everywhere, with a
  fidelity pin (option A); the mechanism below was declined inside rc04c because the blind pair had
  already read the tree (design D4) and the stage sat at R-crc-1's capability ceiling.

  **This is the engine-computes / body-reads thesis with a hole in it.** The set IS engine-computed
  — the gate consults it on every render — but no surface PRINTS it, so four bodies reconstruct it
  from filename rules and one of the rules is a lie by omission. It is the same class as Q-crc-14
  and Q-crc-22: a mechanism whose consumer was never built, so its guarantee depends on prose
  staying in step with code. Standing recommendation (Sal, 2026-09-24 — "B as a follow-up,
  canonized here"): an engine surface that prints, for a change, the trail reader's ACCEPTED
  independent passes as `{token, class, mode}` — most naturally on `orbit status --change <name>
  --json`, which every body already reads for the gate, so the token source becomes "read the
  `passes` field" and the four copies collapse to a call. Fully observable, so R-crc-10 permits it.
  Owner: a stage that declares it; rc12's charter (engine computes, body reads) is the nearest home
  in spirit, though its scope is the PR choreography, so this is more likely its own small stage or
  a rider on whichever stage next touches the judgement bodies. Until then the fidelity pin
  (`ACCEPTED as a pass`) is what holds the four copies honest.

- **Q-crc-25 — the SPEND record has a carrier only for a pass bought past a gate that has
  PASSED, and rc04c bought one past a gate that had not.**
  Found 2026-09-22 while packaging rc04c's proposal-mode external handoff; recorded 2026-09-24.
  `orbit-run-summary-emit` admits `continuation`/`spend` when a handoff buys a FURTHER independent
  pass past a gate that has ALREADY PASSED, and says a handoff merely covering a declared,
  still-uncovered slot carries no record. rc04c's handoff was neither: the `review-proposal`
  cadence is `[independent, in-context]`, the independent slot was already covered by the fresh
  pass, and the slot the gate still waited on was `in-context` — which an external pass cannot
  satisfy. So it was a genuine "another independent pass is worth buying" decision, taken past an
  UNPASSED gate whose remaining slot is a different class: a spend in substance with no carrier in
  the vocabulary, because the trigger keys on gate PASSAGE. Recorded, not taken — widening the
  trigger to "a further independent pass beyond what the cadence requires, whatever the gate
  state" is a one-sentence spec change plus a body change, but assigning it is a scope call.

- **Q-crc-26 — `orbit status --change <name> --report` cannot target an ARCHIVED change.**
  Found 2026-09-22 by rc04c's external proposal pass, which ran the command the exit criterion
  named and got `Change '<name>' not found`. `--report` resolves through `validateChangeExists`,
  which enumerates active `orbit/changes/` only — so no rendered review report can be produced for
  a change once archived, and the archived trail is exactly where a report is most useful to a
  reader reconstructing how a change converged. It is an engine change in the status/orientation
  surface, a capability rc04c neither touched nor held a fingerprint on; doing it there would have
  taken the stage to four capabilities. Standing recommendation: the same archived-fallback the
  emit surface already performs for `address-reviews` (triple scope) is the pattern — resolve
  active first, then `orbit/changes/archive/<date>-<name>`. Owner: whichever stage next touches
  `orbit-orientation` or `orbit-report-rendering`.

- **Q-crc-27 — no READ-ONLY surface prints the engine's parse of an exploration's Mechanism form,
  so a body that consumes it reads the file by eye.** Opened 2026-09-28 at rc13c's archive (its
  at-archive note 4.5). rc13c's exploration settled a consume-time explore emit so propose could read
  the engine's `rules_open` / `key_defects` / `residuals` beside its own reading; the fresh proposal
  pass found it contradicted `orbit-run-summary-emit`'s one-shot rule (propose writes exactly one
  emit) and it was DESCOPED; the mtime-keyed cross-check that replaced it was removed at the external
  proposal walk (git keeps no modification time, so no trail record can be shown to describe the
  current bytes). The external SYSTEM pass then found the adopter blind spot: an installed skill has
  neither this repository's specs nor its parser, so rc13c shipped the Mechanism grammar in the
  propose body and defined "accounted" as full conformance to it — decidable from the file, with the
  FAILING CLAUSE named in the record where the readout would name a state word. What remains is the
  Q-crc-24 shape one layer over: the parse IS engine-computed on every explore emit, but no surface
  PRINTS it without writing, so every consumer re-derives form from the grammar. Standing
  recommendation: a read-only print of `parseExploreRules` for a staging name — no emit, the
  one-shot rule untouched — most naturally a flag on the change-scoped status once it resolves staging
  names (Q-crc-26's fallback pattern); the propose body then reads the state word instead of naming
  the clause. Owner: whichever stage next touches `orbit-emit-composition` or `orbit-orientation`.

- **Q-crc-28 — the retirement-class sweep has a list and no owner.** Opened 2026-09-28 at rc13c's
  archive (its at-archive note 4.6). Three stages have each deferred living text that a later stage
  made false, to "a retirement-class sweep" nobody has declared: rc13a deferred the retained
  "five-section" TITLES and their pointer sites (`orbit-conventions`' format requirement title;
  `audit-drift.ts:302`); rc13b's design deferred the "until the maturity-signal stage lands" clauses
  (`orbit-conventions`' concluded-outcome requirement; the explore body's KNOWN paragraph); rc13c adds
  FIVE sites that still call it a pending follow-on — `orbit/specs/orbit-conventions/spec.md` lines 980,
  994 and 1022, and `src/core/templates/workflows/explore.ts` lines 610 and 657 ("until then, REOPEN
  before promoting"; "until a propose-consumption stage lands, that transfer is an instruction … not a
  checked mapping"). Each deferral was correct under R-crc-1 at the time; together they are a
  baseline spec asserting three facts the shipped tree contradicts. Standing recommendation: ONE small
  change touching `orbit-conventions` and `orbit-explore-modifications` (two capabilities), pointer-only
  edits and the title rename with its pointer sites, no mechanism — declared as a stage or taken as a
  rider on the next stage that touches either capability. Until then the stale sentences are an
  accepted residual on rc13c's readiness record. ADDED 2026-10-01 at rc15's archive (its at-archive
  note 5.4, widened at the system blind-pair walk — fresh W1, Sal: B): FOUR more sentences of the
  same class, two of them now FALSE rather than pending. The concluded-outcome KNOWN paragraph in
  `orbit-conventions` (line 1022 at rc15's archive) and its copy in the explore body
  (`src/core/templates/workflows/explore.ts` line 610) say the stage-state reader keys on LOCATION and
  renders a stage cited only by a concluded exploration as `exploring` — rc15 shipped the header read,
  so both describe a limit that no longer exists (delete the KNOWN sentence; point at
  `orbit-architecture-engine`'s state requirement). And two `orbit-orientation` sentences the new read
  makes false in letter: the `No live inference beyond engine and trail` THEN clause's closing "never
  artifact-content parsing" (line 44 — its source list already names architecture stage-state
  computation, which now reads the concluded header of citing staging directories, so the clause is
  true of orientation's module and false of the composed view), and the explore-chip parenthetical
  "never from the file (per the bare-status requirement's closed data-source scenario)" (lines 94-95
  — true of the chip, which stays trail-read; the cited rationale no longer forbids a file read
  transitively). The one-clause repairs: qualify the THEN clause as "orientation itself parses no
  artifact content; the stage-state source it consumes reads the concluded header per
  `orbit-architecture-engine`", and soften the chip parenthetical to "the ROW's chip is read from the
  trail". A fourth capability inside rc15 was declined under R-crc-1 and exit (3)'s recorded
  no-orientation-delta measure. The sweep now spans THREE capabilities (`orbit-conventions`,
  `orbit-explore-modifications`, `orbit-orientation`) — at R-crc-1's ceiling, still pointer-only and
  mechanism-free; the standing recommendation stands, with `orbit-orientation` added to its touch list.
  RATIFIED 2026-10-01 (Sal: A, at the project-wide audit-drift walk after rc15's archive — the fourth
  surface to raise the set): the sweep runs as its OWN small change on Sal's word, not as a rider; the
  walk recorded the finding as deferred with this question as its owner and edited no baseline.
  CLOSED 2026-10-01 at rc16-retirement-sweep's archive (its at-archive note 3.3), on the post-archive
  project-wide audit-drift run `orbit/.orbit-runs/audit-drift-2026-10-01T19-22-49Z.json` — no drift
  detected; Category 3 raised nothing on the retired set, and this question's own finding from the prior
  run (2026-10-01T16-53-35Z) is suppressed there as stale with the archive as evidence. The nine sites are
  retired in baseline by pointer or deletion (six MODIFIED blocks across the three capabilities, synced
  byte-verified; the explore body's six copies moved with their owners; the eleven quoted sentences grep
  to zero over the synced baselines and the body). Named here as TRUE OF THE MODULE and deliberately
  untouched: the two `src/core/orientation.ts` comments at lines 22 and 50 (orientation itself parses no
  artifact content; the row chip is trail-read) — D-rc16-2's named-out rows. Carried in this CLOSED
  record, not as an open item: the class C re-entry trigger (D-rc16-1 — the retained "five-section"
  requirement titles and their pointer sites, five capabilities once the `ownerText` anchors count): the
  question REOPENS only if the next change touching both `orbit-conventions` and
  `orbit-explore-modifications` for another reason declines the rename as a rider, or a reader is actually
  misled by a title. Outside the set and left as the record it is: CLAUDE.md's D3 line in the section
  headed historical ("with no artifact reads"), an accepted residual on rc16's readiness record.
- **Q-crc-29 — the ARC-DONE predicate has no treatment for a stage rendering `ended` or
  `ended-from-explore`.** Opened 2026-10-01 at rc15's archive (its at-archive note 5.5; raised by the
  fresh proposal pass, iter 2, W1; Sal: 1B — a declared non-goal and an accepted residual on rc15's
  readiness record). `orbit-pr-lifecycle` owns arc-done as "every declared stage archived AND the
  closing architecture review recorded", consumed by the architect body's arc-done readout. rc15's
  D-rc15-1 honours the ended mark on `premised` — a stage declared and withdrawn before any work — so
  `ended` is now reachable with NO archive at all, and a program carrying such a stage cannot observe
  arc-done until that owner says an ended stage does not hold the program open. The consequence is
  bounded: arc-done is surfaced for a human act, never taken by the engine, and no live doc carries an
  ended stage without an archive today (rc03a's archive exists; its mark is exit (1)'s pending act).
  Standing recommendation: ONE sentence in `orbit-pr-lifecycle`'s predicate — "archived OR ended" for
  the per-stage clause, with `ended-from-explore` counted the same way, since a concluded exploration
  is the same decision to build no more — plus the architect readout's one line; a rider on the next
  stage that touches `orbit-pr-lifecycle`, or its own small change. Until then the open predicate is
  rc15's accepted residual.

- **Q-crc-30 — the apply emit's `files_touched` lists TRACKED files only.** Opened 2026-10-04 at
  rc04b's archive (raised by the fresh system pass, iter 2, S4; deferred at walk 2 as another owner's
  mechanism). `filesTouchedSince` runs `git diff --name-only <base>`, which never lists untracked
  files, so an apply emit written before the apply is committed omits every NEW file — rc04b's three
  (a test module and a golden pair, the stage's own instrument) were absent from its apply record
  while the committed diff names them. Bounded: the boot render's committed view is correct once the
  commit lands, and the archive emit's `diff_base` chain is unaffected. Standing recommendation:
  append `git ls-files --others --exclude-standard` to the working-tree view (one call, one union),
  or document the tracked-only limit on the apply reference's `files_touched` field note so the
  record says what it measures; a rider on the next stage that touches `orbit-apply-change`'s emit.
- **Q-crc-31 — the external format's duplicate-section rule is stated for Direction and unstated for
  Notes.** Opened 2026-10-04 at rc04b's archive (raised by the fresh system pass, iter 2, S5; deferred
  at walk 2 — the stage touched `## Direction` only, correctly). rc04b's format rule reads a SECOND
  `## Direction` as MALFORMED ("two claims on one truth"); the renderer's parser resets `## Notes` on
  every heading, so a second Notes section silently keeps the LAST body with no mark. Two sibling
  sections now carry two different, one-unstated, duplicate-handling rules. Standing recommendation:
  whichever stage next touches `orbit-conventions`' External-review findings markdown format either
  marks a duplicate Notes as Direction marks one, or declares last-wins for Notes in the requirement —
  one sentence either way, with the parser and a test moving together. Two riders travel with it,
  each owned elsewhere and named on rc04b's readiness record: the gate's fallthrough reason wording
  (`has no fresh pass` for any uncovered non-pair slot — `orbit-engine-gates`) and `orbit fingerprint`'s
  key-order re-serialization of `.openspec.yaml` (`orbit-base-fingerprints`).
- **Q-crc-32 — a `kept` path exempts its whole file from the retired check.** Opened 2026-10-05 at
  rc08a's system walk 1 (fresh W2, Sal: B). rc08a's `sweep.kept` takes a file out of an entry's retired
  check in full, so a live leftover in a file that ALSO quotes the old wording as history passes under a
  log that records the wording as retired — and the files a walk most often keeps (the change's own
  design, tasks and explore) are exactly the ones that mix the two. rc08a names the limit in
  `orbit-emit-composition`'s `The walk write gate checks sweep evidence` and ships no narrower form.
  Standing recommendation: rc08b's exploration decides whether `kept` gains an occurrence- or line-scoped
  form (e.g. `{path, why, line}`), which is new mechanism (R-crc-6, R-crc-7), and measures against the
  first walks' `kept` records how often a kept file carried a live site.

## Program stages

<!-- src:stages -->37<!-- /src:stages --> small stages in four phases (R-crc-2; rc11 moved to Considered & out under R-crc-4; rc02
split into rc02 + rc02b on 2026-09-12; rc13 added 2026-09-14 and moved to phase 1 the same day;
rc03a split from rc03 on 2026-09-15 and WITHDRAWN the same day; rc13 split into rc13a + rc13b on
2026-09-15 under R-crc-9; rc07b split from rc07 the same day under R-crc-9 applied PREVENTIVELY; rc04d split from rc04c on 2026-09-21, the THIRD preventive application, caught at exploration by a size check rather than after a cadence;
rc13c declared 2026-09-25 from rc13a's archive proposal, and rc15 declared the same day taking up Q-crc-11; rc16 declared 2026-10-01 from Q-crc-28's ratified direction; rc03 split into rc03b + rc03c on 2026-10-04 under R-crc-9, the FOURTH preventive application, again caught at exploration by a size check; rc06 split into rc06a + rc06b the same day, the FIFTH, caught at exploration; rc08 split into rc08a + rc08b on 2026-10-05, the SIXTH, caught at exploration; rc17 declared the same day from rc08b's system walk, taking Sal's one-command blind pair and the walk's routed pair-diagnosis redesign; rc17 split into rc17a + rc17b the same day, the SEVENTH preventive application, caught at exploration; rc17c split from rc17a the same day at propose, the EIGHTH, caught by a capability count before any artifact was written; rc17d split from rc17b on 2026-10-06, the NINTH, caught at exploration by a capability count; rc18 declared 2026-10-07 from rc17c's proposal cycle — rc14 stays reserved for the undeclared `rc14-delta-scope` recommendation).
Every stage is sized under R-crc-1, names the capabilities it touches, and names its goal.
Charters are settled under R-crc-3 until a citing change refines them; exit criteria are
falsifiable and self-measured by the stage's own cadence (G0). Position is computed — see the
readout, never this text.

### Phase 1 — stop the bleeding

### Stage rc01-instrument-fidelity — the cycle's instruments enforce the real tool

Depends-on: (none)
Complete: [x] 2026-09-14 (Sal)

Charter: the `gh` stub's accepted-invocation set is derived from a RECORDED real-CLI contract
(captured from the installed binary's `--help`, checked in), rejecting in both directions
(flag forms the CLI rejects; missing qualification the contract requires); the fidelity sweep
is grammar-aware per verb and selector-aware; a test asserts every emit payload table accepts
every field its schema reference names (the archive-table gap is the first regression case).
Goal G2. Touches: test/ + the harness, one spec delta (orbit-pr-lifecycle's instrument note).
Exit: (1) the stub's accepted set is derived from the checked-in contract and a flag form the
contract rejects fails the stub; (2) a schema field a payload table rejects fails the suite.
Smallest stage; ships first. (The "injected grammar defect fails" property belongs to rc05,
which executes commands; a sweep cannot promise it.)

### Stage rc02-gate-semantics — convergence bounded by consequence

Depends-on: (none)
Complete: [x] 2026-09-14 (Sal)

**PARTIALLY REVERSED 2026-09-21 by R-crc-11 / Q-crc-19 — recorded here because this stage is
complete and ratified, and a reader arriving at it should not have to find out elsewhere.** The
`budget` mechanism this stage shipped is demoted from a gate-adjacent signal to a recorded figure:
the SPEND survives as effort under R-crc-11(h), while `budgetExhausted`, the distinct position
token, and the budget clause in the gate's reason string go. The reasoning is that
`budgetExhausted` is target-shaped by construction — it says "you have spent too much" — and
R-crc-11 establishes that cost is recorded and never targeted. Everything else rc02 shipped stands,
and the blind pair is PROMOTED by the same ruling from a coverage device to the program's central
mechanism. rc02c carries the implementation.

SPLIT 2026-09-12 (settled under R-crc-3; see the status log). The original charter carried the
severity ladder AND the convergence arithmetic; measured at proposal review it was 40 tasks
against R-crc-1's ceiling of under 20, and completing it honestly needed FIVE capabilities
against a ceiling of three. The ladder half is now stage rc02b-severity-ladder. What the ENGINE
COMPUTES stays here; what a SEVERITY MEANS moves there. Neither blocks the other: the clauses
need only the three severity NAMES, which already exist.

SCOPE NARROWED 2026-09-14 (R-crc-8's sectional trigger): clause (c) — independent confirmation —
LEFT this change for the new stage rc02c-confirmation-semantics. rc02 keeps the shipped confirm
predicate untouched. What remains has been through six proposal passes with its findings now local.

Charter: the reviewed-gate model gains SEVERITY-AWARE CONVERGENCE — clause (b) resolution and the
new-finding match become substantive-only (CRITICAL + WARNING), so SUGGESTIONs NEVER GATE (issue #8's
intent ships here; its third-`confirm`-value mechanism is superseded, because `confirm` selects
clause (c) alone and it was clause (b) that held the D-arc archives) — plus the STOP RULE in
R-crc-4's terms as a computable cadence slot `blind-pair` (two passes of DISTINCT independent
classes, both fresh, blind to each other: no walk of either pass's own findings between their
tokens), and a REVIEW BUDGET declared per gate (the R-crc-4 shape plus one extra independent
pass) whose exhaustion the gate reports BESIDE the state — a `budgetExhausted` boolean, a spend
clause in the reason, and a distinct position token, never a new gate state and never a hard
block; rc04 records what the user decides at archive. Goal G1. Touches: orbit-engine-gates,
orbit-run-summary-emit (one scenario whose external-slot wording the new cadence vocabulary
outgrows), spec-driven schema v4. Exit: (1)
`gates.ts` implements severity-aware clauses + blind-pair + budget; (2) the gate reason names
whichever rule fired, and names an OPEN BLIND PAIR before its cost is sunk; (3) the next archive
on this repo proceeds through the stop rule, or with the gate reporting its budget spent — never
a `gate_overridden` for "no clean pass yet".

### Stage rc13-explore-mechanism — invention happens in explore, or it happens in review

Depends-on: (none)
Complete: [~] 2026-10-01 (Sal)

**SPLIT 2026-09-15 (Sal) into rc13a + rc13b, under R-crc-9 — its first application.** This heading
is retained as the program's record of the problem and the evidence; the WORK is declared in the two
stages below. The split seam is FORMAT versus ENFORCEMENT, and it is a dependency rather than a
compromise: the engine half was never buildable first, because `rules_open` cannot be computed from
a format that defines no decision identifiers and no parseable per-rule entry. The format has to
exist before anything can parse it.

THE PROBLEM. Invention is supposed to happen in explore; it happens in walks, which is where
R-crc-6 found it. rc02 ran six proposal passes and 72 findings, nine of its first ten CRITICALs in
mechanism that did not exist when its exploration closed. rc03a ran three passes and 15 CRITICALs
with zero repeats, was WITHDRAWN, and shipped nothing.

THE DIAGNOSIS THIS STAGE ESTABLISHED, and it is not the one the charter opened with. Explorations
do not lack mechanism — rc02's carries dense mechanism and rc03a's carried executed cases from its
first sitting. What an executed case shows is ONE PATH through a rule, and none of those failures
were on a path anyone walked. Classifying the record by the PART of a mechanism that failed: eleven
of rc03a's fifteen were READ, ENUMERATE or COHERE failures and ZERO were EXECUTE failures.

THE UNIT IS A CLOSED ENUMERATION per rule, closure has three DECLARED forms (DERIVED / SOURCED /
BOUNDED), and a Decision is a RULE iff it has a DOMAIN OF SITUATIONS — a test deliberately
GRAMMAR-INDEPENDENT, because a form-based test lets an author state a rule in prose carrying no
WHEN/THEN and fall outside it.

THE MOVE SET IS ITSELF BOUNDED, and its history is the stage's best evidence. A five-move set was
ratified; no sixth could be named on request; classifying rc03a's record found COHERE. The six were
then ratified; classifying rc02's four found FEASIBILITY and CONSUME. The eight were then ratified;
a proposal pass hunting a ninth found one in this stage's own Case 8 — a mechanism that is correct,
complete, and NEVER INVOKED, which lands outside all eight. Three times, confidence about closure
was wrong, and each time the correction came from CLASSIFYING A RECORD rather than from thinking
harder. That is the argument for the whole stage, produced by the stage on itself, and rc13a
inherits it as its central evidence rather than as a rhetorical flourish.

### Stage rc13a-explore-mechanism-convention — the format that makes a rule checkable

Depends-on: (none)
Complete: [x] 2026-09-25 (Sal)

Charter: the explore convention gains a **Mechanism** section whose unit is a CLOSED ENUMERATION per
rule; the RULE test (a Decision is a rule iff it has a domain of situations, applied PER CLAIM since
an entry may state a finding and embed a rule — superseded by the archived change, see SETTLED: the
test is NORMATIVE force, a quantified fact is not a rule); the three DECLARED closure forms with the
taxonomy itself declared BOUNDED (superseded by the archived change, see SETTLED: closure is
ACCOUNTED — two outcomes, three tokens); the move set with its residual and its growth path stated — including where
a set-finding is RECORDED and what test distinguishes "a way a mechanism is wrong" from "outside the
set's domain", which the first shape left to the classifier's word; and the explore RE-ENTRY case
(a name resolving to an active change resumes in place, never scaffolding a second staging directory
beside the authoritative one).

CRITICALLY, AND THIS IS WHY THE SPLIT FALLS HERE: this stage also ships the MACHINE-READABLE FORMAT
that the enforcement half must parse — a decision-ID slot in the Decisions section, and a per-rule
Mechanism entry grammar with a declared closure-form token and a disposition slot. The first shape
of this work asserted an engine-computed `rules_open` over a format that defines no identifiers and
no entry boundaries; a proposal pass traced the parser it would need and found nothing to key on.
The format is the prerequisite, not the leftover.

Goal G3. Touches: orbit-conventions, orbit-explore-modifications. Exit: (1) a rule's domain
enumeration, its declared closure form and each move's disposition have named slots a parser can key
on, and the Decisions section carries a stable identifier per entry; (2) the convention's own
artifact — this stage's exploration — conforms to it, with every live rule's domain ACCOUNTED (REVISED
at ratification 2026-09-25 from "closed", R-crc-12's first case — see the archive record below) and
every out-of-domain entry carrying the disposition annotation ON THE ENTRY rather than in commentary
about it; (3) the shipped body carries ONE conforming exemplar entry, so the convention shows its shape
rather than describing it.

**FIRST ATTEMPT ARCHIVED 2026-09-15 WITHOUT SHIPPING.** Three independent passes — two fresh, one
external (GPT-5 Codex) — 55 findings, 17 CRITICALs, ZERO repeats. The stage is NOT done; the
archived change is the record of an attempt, and a later change may cite this stage again. The
cadence was working throughout: the change kept being wrong in NEW places, which is the signature
this program exists to produce rather than the churn G0 describes.

**THE PREREQUISITE THE NEXT ATTEMPT MUST SETTLE FIRST.** The external pass found a contradiction
load-bearing for this stage AND for rc13b: the requirement says every live rule carries a CLOSED
enumeration while defining BOUNDED as "the domain is open". An author names a partial list plus a
residual and satisfies the obligation that exists to stop an open domain reaching propose; rc13b
gets no honest basis for treating `Closure: BOUNDED` as closed. The move set was declared BOUNDED
precisely to be honest about openness, and the honesty was real — the WORD was load-bearing in the
opposite direction, and the contradiction survived three internal passes. Either BOUNDED stops being
a closure form (an open domain is open, and the maturity signal says so), or "closed" splits into
two tiers with different consequences. That question is one sitting's work and it is the hinge for
both stages; it is settled BEFORE the next citing change, not inside it.

**SETTLED 2026-09-15** in what is now
`orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` (the exploration became the
second attempt's vehicle and moved with it at propose; pointer corrected at the archive tail) — the
reasoning and its worked cases live there and were consumed when the second attempt proposed. The answer: the obligation is
**ACCOUNTED**, not CLOSED, because closure was never the point — **no domain may be open SILENTLY**.
Two outcomes discharge it. **CLOSED** (DERIVED or SOURCED): every member covered, and the
justification says why that is provable. **OPEN-DECLARED** (BOUNDED): members covered, a residual
remains, and the residual NAMES ITS KIND AND THE METHOD by which a member would be found — "there
may be others" discharges nothing and is the sentence the obligation exists to forbid. BOUNDED stops
being a third kind of closure and becomes the other way to satisfy the obligation, so `Closure:`
reads honestly downstream and rc13b never has to pretend.
The consequence difference is VISIBILITY, never BLOCKING: an open-declared domain does not block
readiness — if it did, rc02's same-state v1 limit could never have shipped and authors would fake
closure to proceed — the residual is SURFACED and TRAVELS into the change's artifacts instead of
dying in the exploration. That is rc02's `budgetExhausted` shape, and under R-crc-10 it is a RECORD
rather than a check, which is why it is buildable where the previous attempt was not.
Tested against every bounded claim on the record: rc02's same-state limit passes (names the kind and
assigns the method to rc04); the previous attempt's move-set residual passes marginally; its
CLOSURE-TAXONOMY residual FAILS, having named a kind and no method — a defect that sat unchallenged
through three internal passes, in the artifact that invented the form.

**SIX REPAIRS CARRIED, all from the external pass, all verified**: the per-claim rule test has only
per-ENTRY identifiers and dispositions, so two rule claims in one entry collide on one key; the
Mechanism grammar names slots without a container, an entry boundary, or a move-line syntax, so no
parser can be written from it; the situation-set test classifies quantified FACTS as rules, with
D-rc13-2 as the worked counter-example; re-entry is undefined when an active change AND a staging
directory both exist, and the carried Mode B resume scenario sends it back to staging; the change
never tasked the exit-criterion-2 conformance of its own artifact, and its live decision still said
EIGHT moves with no successor recording INVOKE; and the residue sweep's acceptance grep can never
return zero, because it exempts a file the grep matches.

ADDED 2026-09-15 (Sal) — **AN EXPLORATION MAY CONCLUDE IN NOTHING, and this stage gives it the
words.** Today the only exit from an exploration is promotion to a change: nothing in the convention
defines a no-change outcome, and `Considered & out` rejects OPTIONS WITHIN an exploration, never the
exploration itself. The program layer already has the concept — rc11 was moved to Considered & out
with a re-entry trigger and that is recorded as a good outcome — while the exploration layer has no
equivalent verb. This stage adds it: a CONCLUDED decision stating what was decided and WHY nothing
is built, a status-header flip from `exploring` to concluded, a re-entry trigger naming what would
reopen it, and a stated home for the staging directory so the concluded work is a record rather than
clutter.

**Why it belongs here rather than in a stage of its own**: the declaration is convention, which is
this stage's subject, and its sibling half — the readout — is rc13b's. A third stage editing the
same two capabilities is how a requirement ends up with three owners. The irony is worth keeping:
the fix for building too much would itself have been a new stage if nobody was watching.

**Evidence, 2026-09-15**: two stages ran full propose-review-archive cycles and shipped nothing.
rc13a's own second attempt might have concluded at EXPLORE — R-crc-10 would have told it to — but
there was no way to say so and have the workflow agree. Dropping at explore costs one sitting;
dropping at archive cost three passes, twice. R-crc-10 SHAPE: the author DECLARES the conclusion and
the engine records it; nothing asks the engine to judge whether an exploration should stop.

**SECOND ATTEMPT ARCHIVED 2026-09-25** as `bounded-closure-semantics` (`orbit/changes/archive/2026-09-25-bounded-closure-semantics/`),
through a COMPUTED PASSED `review-system` gate — the blind pair (external GPT-6 Astra 2C/2W/1S;
fresh 0C/5W/4S; zero CRITICAL overlap by title, three shared findings) walked in two logs, then an
in-context confirm (0C/3W/2S, all on what the walks themselves added) walked to zero. The exit
criteria, graded at the tail: **(1) MET** — the status-header, Decisions-entry and Mechanism-entry
productions carry named slots, stated once in the owning specs and mirrored byte-equal into the
body by a parity test (R-crc-14's MIRROR COROLLARY, ratified this cycle). **(3) MET** — the body
carries TWO conforming exemplars where the criterion says ONE, one per closure outcome (the fresh
pass found the BOUNDED branch had no fixture; the count word was the instrument, the intent "shows
its shape" is met). **(2) — MET 9 of 9, RATIFIED BY SAL 2026-09-25 under R-crc-12's FIRST CASE; the criterion's
wording revised to ACCOUNTED above, and the reasoning kept here as written before the call.** As
written it said "every live rule's domain CLOSED"; the archived artifact has NINE live rules, EIGHT closed (DERIVED/SOURCED) and
ONE OPEN-DECLARED — D-bcs-12, the nine-move set, BOUNDED with both residual slots, added on the
system walk precisely so the OPEN-DECLARED production would have a real instance. The at-archive
note written at apply pre-committed to grading "closed" as written while all eight were closed; the
walk changed the facts. Two readings: R-crc-12's FIRST case (the shipped mechanism — ACCOUNTED —
invalidates the criterion's own term, so the stage revises the criterion to "every live rule's
domain ACCOUNTED" and records why: MET, 9 of 9), or a MISS as written (8 of 9 closed, the word
still measures). The AI's recommendation is the first case, because the ninth entry is the
convention's own thesis applied honestly and grading it a MISS would reward faking closure — the
exact behaviour D-bcs-1 exists to stop. Sal took the first case in the architect session the same
afternoon; the mark above is that ratification.

**PROPOSED FOLLOW-ON — DECLARED 2026-09-25 (Sal) as `rc13c-propose-consumes-mechanism`, its own stage below rc13b; the proposal text is kept as written:**
`rc13c-propose-consumes-mechanism`. `orbit-propose-modifications`' consume-mode mapping has no
Mechanism row and its validation scenario names five sections; under D-bcs-3 a BOUNDED residual
must TRAVEL at propose (spec row owns, design Risks points), and today that transfer is an
instruction the proposing AI follows from the authoritative file, not a checked mapping. The same
stage owns the one transition the re-entry table cannot see: propose keys on `explore.md`'s presence
and reads no header token, so a concluded name can be promoted without reopening — the follow-on
refuses it or treats it as the reopen. Touches: orbit-propose-modifications (a third capability,
which is why it is a scope call and not folded in). rc13b's handoff (design.md Risks) additionally
carries: the productions moved into ONE TypeScript constant read by body, spec check, test and
parser; D-bcs-8's escaped-pipe Domain row as the GFM-cell fixture; and Q-crc-11's input below.

KNOWN AND ACCEPTED: this stage is ADVISORY until rc13b lands. An author can ignore the convention and
no readout notices. That is the dependency, stated rather than discovered — and it is the difference
between this split and rc03a, which substituted a cheaper MECHANISM for the correct one three times.
Here the correct mechanism is kept whole and sequenced.

### Stage rc13b-explore-maturity-signal — the readout stops asserting what it cannot see

Depends-on: rc13a-explore-mechanism-convention

Complete: [x] 2026-09-25 (Sal)

**R-crc-11 IMPACT (2026-09-21) — SAME DISEASE, DIFFERENT SURFACE.** This charter says the maturity
grid must "stop ASSERTING readiness on evidence that cannot support it", because confidence today
rises with heading count. R-crc-11 says the review cadence must stop asserting convergence from PASS
COUNTS. Those are one defect on two surfaces: a proxy that is easy to count standing in for a
judgement nobody recorded. The remedy is the same shape in both places — an asserted readiness is
replaced by a RECORDED one, and the engine verifies ORDERING (was the belief formed after the
evidence) rather than the belief. rc13b and rc04 should be read together by whoever proposes either,
and if one ships a vocabulary for recorded readiness the other adopts it rather than inventing a
second.

**BLOCKED 2026-09-15 on rc13a, which has not shipped.** Its first attempt archived without syncing;
until rc13a's format exists there is nothing for this stage to parse. Its own inherited residual —
ENGINE-COMPUTED relocates self-classification rather than removing it — is unaffected and still
stands. Recorded here so the dependency is a stated block rather than an inferred one, per R-crc-9's
declare-the-stage-blocked branch.

**UNBLOCKED 2026-09-25, and ARCHIVED the same day.** rc13a shipped as `bounded-closure-semantics` and
was ratified; this stage was then explored under the convention, proposed, applied (17/18, task 6.4
the user-validation handoff), walked through the blind pair on the pushed apply commit (fresh +
external GPT-5 Codex) and an in-context confirm, and archived through a COMPUTED PASSED
`review-system` gate — `orbit architecture status` renders it quiescent, awaiting ratification. The
block above is history; the status log carries the cycle.

Charter: the maturity grid's TOP RUNG loses its promotion. `next_recommended` is a required spine
field whose value is a command, so the engine must point somewhere; what it must stop doing is
ASSERTING readiness on evidence that cannot support it. Today confidence RISES with heading count —
the floor and middle rungs already defer, and only Mature asserts, on four counted headings and at
most one open question. Without every live rule's domain ACCOUNTED (rc13a: CLOSED, or OPEN-DECLARED
with both residual slots — corrected at rc13a's archive tail, 2026-09-25), the emit renders a
deferring rung plus the named gap.

ADDED 2026-09-15 (Sal) — **A FIFTH RUNG FOR AN EXPLORATION THAT CONCLUDES IN NOTHING.** Every rung
in the shipped grid points at continuing or building: Early and Stalled say keep exploring, Mid
offers propose, Mature asserts readiness. An exploration that has decided NOT to build must fight
its own readout to say so — the emit keeps recommending propose at it. That is a structural nudge
toward building, sitting in the one surface whose job is to help decide whether to build, and it is
the same defect as the top rung asserting readiness on heading count: the readout asserting a
direction the evidence does not support.

The rung reads the CONCLUDED declaration rc13a's convention defines — a record the author wrote —
and renders the conclusion plus its re-entry trigger, recommending NEITHER explore nor propose. It
is the only rung that points at nothing, which is the point of it.

This stage owns the parse rc13a's format makes possible: `rules_open` and `rules_total`,
ENGINE-COMPUTED from the Mechanism section, with the domain of "every rule" stated — which
dispositions put an entry out of it, and in what annotation vocabulary. It also owns the honest
residual its predecessor claimed to close: ENGINE-COMPUTED does not remove self-classification, it
RELOCATES it from the payload to the file. The engine sees the rules an author declared; a rule never
entered yields an empty gap list and the top rung asserts. That is reachable by OMISSION, the
cross-check is a later reader or audit-drift, and the requirement must say so rather than claim the
loophole closed.

Goal G3. Touches: orbit-run-summary-emit, orbit-emit-composition. Exit: (1) the rung withholds the
Mature assertion when any live rule's domain is open, naming the gap by identifier within a bounded
render; (2) the parse has instruments over the real format — an entry with a declared form, one
without, each out-of-domain disposition, a fenced block that must not count, a file with no Mechanism
section; (3) the requirement states what the engine judges (FORM) and what it cannot (whether an
enumeration is TRUE, and whether a rule was declared at all).

### Stage rc13c-propose-consumes-mechanism — what an exploration accounted for reaches the proposal

Depends-on: rc13a-explore-mechanism-convention
Complete: [x] 2026-09-28 (Sal)

DECLARED 2026-09-25 (Sal), from the follow-on rc13a's archive proposed. rc13a made a rule's domain
ACCOUNTED in the exploration; D-bcs-3 says an OPEN-DECLARED residual does not block and instead
TRAVELS into the change's artifacts. Today that travel is an instruction the proposing AI follows
from the authoritative file: `orbit-propose-modifications`' `Section-to-artifact mapping` has rows for
Premise, Decisions, Considered & out and References and NO row for Mechanism, and its
`Validate explore.md structure before consuming` scenario still counts FIVE sections against a
convention that now has six. The residual either reaches the spec delta and the design's Risks
because the author remembered, or it dies in the exploration — which is the outcome D-bcs-1 exists
to forbid, one layer downstream of where rc13a forbade it.

Charter: the consume-mode mapping gains a MECHANISM ROW stating where each closure outcome lands —
a CLOSED entry informs the requirement it derives (the domain table is the requirement's scenario
set, or points at what is); a BOUNDED entry's `Residual kind:` and `Residual method:` land in the
owning spec delta's requirement text with the design's Risks section POINTING at it (spec owns,
design points, per D-bcs-3 as settled) — and the structure check reads SIX sections, the Mechanism
section's absence warning like any other missing section. The same stage owns the one transition
the re-entry table cannot see: propose keys on `explore.md`'s PRESENCE and reads no header token, so
a `concluded` name can be promoted without reopening. The stage specifies that seam — refuse,
naming the conclusion and its `Re-entry:` trigger, or treat the invocation as the reopen on the
user's word; the exploration chooses, and D-bcs-7's third row is the shape it must agree with.
Propose consumes FORM, as rc13b renders form: whether an enumeration is true stays the reviewer's.

Goal G3. Touches: orbit-propose-modifications — one capability, which is why this is a stage and
not a fold into rc13a (three owners on one requirement) or rc13b (a third capability at its
ceiling). Exit: (1) the mapping names a Mechanism row with a destination per closure token, and the
validation scenario's section count matches `orbit-conventions`' format requirement by POINTER, not
by a restated number; (2) a BOUNDED exemplar consumed at propose lands its two residual slots in a
spec delta and its pointer in design Risks — measured on the stage's own proposal, whose exploration
carries at least one BOUNDED entry; (3) `/orbit:propose <name>` against a concluded staging directory
does NOT scaffold a change silently: the body's step is grep-tested for the refuse-or-reopen branch,
and the re-entry requirement in `orbit-explore-modifications` is pointed at, not restated (R-crc-14).

### Stage rc02b-severity-ladder — a severity is a consequence, and CRITICAL pays for itself

Depends-on: (none)
Complete: [x] 2026-10-03 (Sal)

**R-crc-11 IMPACT (2026-09-21) — this stage becomes load-bearing for a rule it did not know about.**
R-crc-11(b) says a review must not GROW the proposal: findings that are common-sense and tightly
aligned get addressed, findings requiring EXPANSION go back to architecture, and **the AI makes that
call**. That call needs a vocabulary, and severity-by-consequence is the only candidate the program
has. A ladder that distinguishes "a user path breaks" from "an implementation built to the artifact
would be wrong" is exactly the distinction between fix-now and route-to-architecture. Without it the
AI is making the routing call on unstated instinct, which is what R-crc-11(d) asks it to do MORE of
and therefore needs a defensible basis for.

Charter: `orbit-conventions`' Severity ladder requirement, which today says only "three names"
and "prefer the lower one", gains DEFINITIONS BY CONSEQUENCE — CRITICAL = a user path breaks or
data is lost AND the finding carries its REPRODUCTION; WARNING = an implementation built to the
artifact as written could diverge from what it intends; else SUGGESTION — and the evidence tax
is ENFORCED where evidence is produced (the `orbit emit review` write gate refuses an internal
CRITICAL with no non-empty `reproduction`) and SURFACED where it cannot be (an external findings
file's `**Reproduction**:` line; a CRITICAL lacking one is counted, marked unreproduced, and
never re-graded by any consumer). The tax needs a READER as well as a producer: the
address-reviews virtual-marker mapping carries `reproduction` into the marker so the walk's
pushback can re-run it, and the address-reviews body's expected-file-format block learns the
line. Two contradictions ship with it: `orbit-conventions`' own canonical review-emit example
shows a CRITICAL with no reproduction — the exact payload the new write gate refuses — and the
review body's Step 9 field enumeration, which is what a reviewing AI actually follows when
building a payload, does not name the field. Goal G1. Touches: orbit-conventions, orbit-emit-composition,
orbit-address-reviews. Also carries one ASSIGNED RESIDUE from rc02's v4 bump (2026-09-14):
`orbit-conventions`' external-slot sentence — "whose `external` cadence slot must be covered for
convergence" — which v4 falsifies, since the external return now covers half a `blind-pair`; this
stage already touches that capability, so the fix costs no ceiling headroom.
Exit: (1) a CRITICAL payload without a reproduction is refused at write
time naming the finding; (2) an external CRITICAL without one parses, stays CRITICAL, and is
marked unreproduced; (3) the walk that ingests it can see the reproduction it must settle.

**MEASURED 2026-10-03 at exploration — FIVE capabilities, not three; held as ONE change on Sal's word.**
Read against the code, the mechanism the charter describes touches `orbit-review` (it owns the finding
entry shape — the `recommendation_options` requirement is the precedent for a finding-level field — the
external prompt template, and the SIXTEEN per-pass severity rules the review body states today) and
`orbit-report-rendering` (its external parser is the only reader that could see a `**Reproduction**:`
line as structure, so the unreproduced mark lands there). The rule-before-enforcement split (conventions +
review, then emit-composition + report-rendering + address-reviews) was briefed and DECLINED: the five
surfaces are one mechanism — a field born in the prompt and the entry shape, refused at the gate, marked
at the parser, re-run at the walk — and a rule nothing checks for the gap's duration is the shape rc03a's
deferrals took. This is a declared exception to R-crc-1's "never reviewed as one" clause, ratified by Sal
as rc04c's task overage was (R-crc-1's own text: left standing as a breach to be ratified under R-crc-9,
never defined away); the proposal runs the blind pair R-crc-4 prescribes at the ceiling. Three further
things the exploration settled, recorded here because the charter is graded on them: (1) the sixteen
per-pass rules are the SIXTH instance of the rule-stated-twice pattern (R-crc-14), counted at exploration
this time, and become POINTERS with their consequence reading — P2's missing task and P7's delta vocabulary
downgrade to WARNING; (2) a lifecycle BLOCK (validate failure, an unresolved marker) is not a severity and
LEAVES the scorecard, so "0 CRITICAL" means what the ladder says — Sal: leave; (3) audit-drift's own
severity assignment (`orbit-audit-drift`, preserved by system Pass 6) is a sixth statement site OUTSIDE the
five and travels as a named residual, not a sixth capability. The exit criteria stand as written.
Exploration: `orbit/explore/rc02b-severity-ladder/` — six decisions, three live rules with Mechanism
entries, the engine's parse 3 accounted / 0 open (consumed at propose 2026-10-03; the file now travels at
`orbit/changes/archive/2026-10-03-rc02b-severity-ladder/explore.md`).

### Stage rc02c-confirmation-semantics — what counts as having been confirmed

Depends-on: rc02-gate-semantics
Complete: [x] 2026-09-21 (Sal)

**SUPERSEDED 2026-09-21 (Sal), after the stage proposed and applied — the IMPACT block below is
kept verbatim as the record of what was expected, and this note states what actually shipped.**
rc02c DELETES clause (c) outright rather than shrinking it. The reasoning is in the change's design
D6, and it is one sentence: "what is MISSING from the cadence" is COVERAGE, and clause (a) already
computes coverage over the declared slots — so the shrunken predicate would have been a second
voice on one question, which is the defect class clause (c) kept producing. The exploration reached
the same place from the other direction (D-rc02c-5/6): under R-crc-11 a cadence ends when the AI
judges the work ready knowing what the reviewers returned, and no predicate computes that judgement
without the readiness record rc04 owns and has not written. The boundary with rc04 is UNCHANGED —
rc04 still owns the record and the judgement; what changed is that rc02c ships no predicate for the
record to be read by. Evidence the removal strands nothing: with clause (c) gone the recommendation
function's `confirmFailed` branch becomes unreachable, and the verdict diff over all 19 archived
changes (57 gates) found 13 changes, 44 identical, ZERO unexplained.

**R-crc-11 IMPACT (2026-09-21) — read this before proposing.** The ruling moves the cycle's end
condition from CONVERGENCE (computed) to AGREEMENT (recorded), which does not delete clause (c) but
does change what it is FOR. The predicate no longer has to decide whether the work is done — the
readiness record does that — so it can shrink to what it is actually good at: telling the cadence
what is MISSING. The boundary with rc04 is drawn in that stage: **rc02c owns the predicate, rc04
owns the record and the judgement, and the predicate may read the record's existence but never its
content.** Also inherited: `budget` is no longer a thing the user is protecting (R-crc-11(c)), so
whether it stays a gate input or becomes a readout is Q-crc-19 and is settled BEFORE this stage
proposes, not inside it.

Charter: clause (c) — the independent-confirmation predicate — LEFT rc02 on 2026-09-14 under
R-crc-8's sectional trigger, after five of rc02's thirteen CRITICALs landed in it while clause (b)
took four and converged. rc02 ships the SHIPPED predicate unchanged (the most recent independent
pass must satisfy `confirm`), which on the trail that exposed rc02's worst defect is STRICTLY
STRONGER than the rewrite it was carrying: a clean confirming set was FINAL, so an independent pass
running after coverage was met could raise a CRITICAL, have it walked, and never reach the
predicate, while the shipped rule reports unpassed on the same trail.

This stage owns the redesign, and R-crc-7 governs how: the procedure is worked out as a DECISION
TABLE with every empty case enumerated, and EXECUTED against constructed trails, before any spec
prose. The problems it must solve are already measured, not guessed. (1) A `blind-pair` slot puts
TWO independent passes on one state and the shipped predicate reads only the later one, so a
CRITICAL in the earlier-finishing member is invisible — found by rc02's first external pass. (2)
After a CRITICAL is walked, something must define which later pass supersedes the set and when the
iteration ENDS; rc02's two attempts produced a non-terminating rule and then a falsely-converging
one. (3) The terminal condition is about LATENESS, not about records. Also carries one ASSIGNED
RESIDUE from rc02's v4 bump (2026-09-14): `orbit-run-summary-emit`'s two v3-scoped next-command
examples, which this stage's cadence-vocabulary work has to reconcile anyway. Goal G1. Touches:
orbit-engine-gates, orbit-run-summary-emit. Exit: (1) the predicate is specified as a table whose every
cell has a value, with no empty case left to a default; (2) a constructed trail for each cell is a
test; (3) the pair's earlier member cannot be invisible and a clean set cannot certify a later
unreviewed CRITICAL.

**EXIT CRITERIA AMENDED 2026-09-21 (Sal), for the same reason the IMPACT block is superseded.**
(1) and (2) presuppose a shipped predicate and DISSOLVE with it — there is no table to specify and
no cells to construct trails for. (3) is SATISFIED, but BY the dissolution rather than by design:
with no selection rule left, a blind pair's earlier member cannot be invisible to one, and a clean
set cannot certify a later unreviewed CRITICAL because nothing certifies anything. The criteria
that REPLACE (1) and (2), against which this stage is judged: **(1')** clause (c) is removed from
the convergence computation and no engine surface computes whether a change has converged;
**(2')** the removal is verified against EVERY archived trail, with each changed verdict explicable
by clause (c)'s removal or the budget demotion and no verdict changing for a third reason. Both
were met at apply — (2') by the 19-change, 57-gate diff recorded in the status log below.

### Stage rc03a-blind-prompt — a blind reviewer is told nothing

Depends-on: rc02-gate-semantics
Complete: [~] 2026-10-01 (Sal)

**R-crc-11 IMPACT (2026-09-21) — the withdrawn stage's UNRESOLVED CONFLICT is now load-bearing.**
This stage was withdrawn with its content folded into rc03, and the conflict it could not solve was
left standing: `orbit-review-external` requires the cycle context to include prior open findings,
while `orbit-engine-gates` requires a blind pair's members to be blind to each other — and the
blindness predicate observes WALK RECORDS, so it cannot see prompt content and will certify an
anchored pair as blind. R-crc-11(a) promotes the blind pair from coverage device to THE mechanism,
which raises the cost of that hole from a latent inconsistency to a defect in the program's central
instrument. Whoever proposes rc03 inherits it; it is no longer optional to resolve.

**WITHDRAWN 2026-09-15 (Sal). Descoped to nothing; its content folds into rc03-review-genres.**
The stage is kept declared, unratified, as the record of what three independent passes cost and
bought. Its citing change archives WITHOUT SYNCING — the deltas describe a mechanism nobody is
implementing, and writing an unimplemented requirement into baseline is the silent-drift class C2
exists to prevent.

SPLIT 2026-09-14 from rc03-review-genres to resolve, ahead of rc13's own system review, a conflict
rc02 introduced: `orbit-review-external`'s `Cycle context populated from prior runs` SHALL-includes
prior open findings in every external prompt, while `orbit-engine-gates` requires a `blind-pair`'s
members to be blind to each other — and the blindness predicate observes WALK RECORDS between two
tokens, so it cannot see prompt content and certifies an anchored pair as blind. THAT CONFLICT IS
REAL AND REMAINS UNRESOLVED. What failed was every mechanism proposed for it.

WHAT THREE PASSES ESTABLISHED (15 CRITICALs, ZERO repeats, three mechanisms, no shipped fix):

1. **Per-site suppression keyed on the engine-reported genre** — pass 1 killed the premise (the
   external-handoff branch makes no `orbit status` call, so "the call it already makes" was false);
   pass 2 killed the signal (`next_hint_keys.slot` is scoped to the FIRST UNPASSED gate rather than
   the reviewed mode, and the empty-pair branch a non-leak proof rested on sits downstream of the
   resolution clause, so "pair empty" does not imply "slot rendered").
2. **Ordering** — pass 3 showed it answers only HALF THE STATE SPACE. The mechanism reorders the
   EMPTY-pair branch; the leaking state is the OPEN-pair branch (`gates.ts:857-863`), which renders
   `--reviewer external` exactly when a pairable fresh pass stands. That branch was left unchanged
   by design. **The state space of a blind pair has two entries, not one**, and every mechanism
   attempted here was a site-level answer to a state-level problem.
3. **The channels number TWELVE, enumerated from source** — three cycle-context bullets, the
   iteration count's directory read, the project-context pointer, the write-path collision aside,
   two system-mode diff instructions, a prior-run read, the disciplines epitome's own comparison,
   `git log` over the change directory (whose commit subjects in this repo read `7/7 resolved
   (1C/4W/2S)` — precisely the counts and trend a blind member must not see), and a LAUNCHING BRIEF
   WITH NO ARTIFACT BEHIND IT. Every one is the same instruction wearing different clothes: read the
   change's own history.

WHAT THE SUCCESSOR SHOULD CARRY: the property is R-crc-4's — members blind TO EACH OTHER, not to
all prior history; the stronger property was this stage's own invention and is what made the
problem unbounded. Ordering is a real PARTIAL mechanism (it empties the empty-pair route by making
the partner's findings not yet exist) and must be paired with something covering the open-pair
state. And the actual fix is ATTESTATION, not prevention: the prompt file is committed, the T0 emit
could record what it carried, and the gate could REQUIRE that before counting a blind-pair member —
converting "the body promised" into "the trail proves", which is R-crc-6's own principle and
R-d-11's house rule (detection, not prevention). It was deferred three times on ceiling grounds.

### Stage rc03-review-genres — review is not verification

Depends-on: rc02-gate-semantics
Complete: [~] 2026-10-04 (Sal)

**SPLIT 2026-10-04 (Sal) into rc03b + rc03c, under R-crc-9 — its fourth preventive application, the
second caught at exploration by a size check before anything was proposed.** This heading is retained
as the program's record of the problem, the charter and the evidence; the WORK is declared in the two
stages that follow. The exploration (`orbit/explore/rc03-review-genres/`, one sitting on 2026-10-04)
first re-measured the charter against the shipped tree and found it eaten from three sides: the
forward recommendation shipped as rc04b's `direction`; the fixed classes and the `blind-pair` slot
shipped in rc02; and the "REMOVAL IS CONFIRMED BY VERIFICATION, NOT BY ANOTHER REVIEW" paragraph below
argues against clause (c), which rc02c RETIRED — the gate never asks for a further pass, so the
verification genre's justification was re-derived (Q-crc-20, and nine rc-stage in-context confirms
that each ran as an unnamed verification over "the walks' own additions"). What survived: the review
brief ANCHORS (rc04b's real system prompt carried the walk logs under "Resolved since last review");
the in-context pass has no record shape; and two shipped sentences contradict R-crc-4. Three rules
were captured with accounted Mechanism entries — D-rc03-2 (genre is COMPUTED from class × mode × trail
position, never declared), D-rc03-3 (a REVIEW-genre brief carries NO findings and NO trail pointer —
which DISSOLVES rc03a's eleven-channel problem on every order, so no ordering rule and no attestation
field is needed), D-rc03-4 (the verification record). Three scope calls ratified by Sal (A on all):
the DISAGREEMENT class is named here and its handling rule is ASSIGNED to rc08, whose walk log is where
a disagreement is observed; D-rc03a-9's external-first ordering is NOT carried (its blindness value is
gone under D-rc03-3; a fourth capability for an ergonomic gain — a one-line rider for rc10, which
touches that spec); and the split itself. One-launch is DESCOPED: `gates.ts` already outranks the walk
while a pair is open, so the window this charter describes was closed by rc02; same-turn overlap is
one body sentence. The exploration was RENAMED to `orbit/explore/rc03b-pass-genres/` and repointed at
the first child, by the rc04 precedent (propose consumes a staging directory by NAME). Exit-criteria
partition: this heading's (1) review-template half and (3) prompt clause → rc03b; (1)'s verification
half and (2) → rc03c; (3)'s "zero WARNINGs outside the diff" → rc03c, measured on the next cadence's
record. The parent's (1) names a cadence-slot wording the children's mechanism does not use (the genre
is computed from position; the slot token is unchanged) — the children's criteria are authored fresh
at declaration in their mechanism's terms, so no R-crc-12 case arises on this heading.

**R-crc-11 IMPACT (2026-09-21) — this stage is PROMOTED, and gains a deliverable.** R-crc-11(a)
makes the blind pair the point rather than a coverage device, and R-crc-11(f) states what this
charter had already MEASURED independently: the in-context pass is a REACTION to the independent
reviewers, not a second search (one CRITICAL in ~25 in-context passes across the D-arc). Product
intent and trail evidence arriving at the same conclusion from opposite directions is the strongest
signal this program has produced; it should be said out loud in the shipped requirement rather than
left as a parenthetical.

NEW, from R-crc-11(g): every independent pass carries a forward RECOMMENDATION. The genre split is
where it belongs, because a REVIEW recommends a direction on the whole artifact while a VERIFICATION
answers landed/regressed on a diff — they cannot carry the same recommendation vocabulary. The
record and the readiness judgement are rc04's; the PROMPT and the EMIT SHAPE that make a
recommendation exist are this stage's.

Charter: this stage OWNS the canonical cadence (R-crc-4) and its two pass genres. A REVIEW
reads the whole artifact and the thesis and receives NO "resolved since" list; the post-apply
cadence opens with a BLIND PAIR (external ∥ fresh) on the same state, merged into one walk. A
VERIFICATION pass reads the walk's diff, answers landed/regressed per resolution, and may not
raise WARNINGs outside the diff; the in-context class is verification ONLY (measured: one
CRITICAL in ~25 in-context passes across the D-arc; fresh and external found nearly all). The
external prompt template splits by genre — the verification set travels ONLY with a
verification prompt; the handoff snippet's phrasing is unambiguous about who runs the pass
and what "evaluate" means. Goal G1. Touches: orbit-review, orbit-review-external,
orbit-address-reviews. Exit: (1) both templates exist and the schema's cadence slots read
blind-pair → walk → verification; (2) a verification emit carries per-resolution
landed/regressed; (3) verification passes raise zero WARNINGs outside the diff and review
prompts contain no resolved-since list (grep-tested on the generated surface).
NARROWED 2026-09-15: criterion (3)'s prompt clause targeted the "Resolved since last review"
bullet. rc13's exploration found the ADJACENT bullet — "prior internal review findings still
open" — is the one that anchors a blind pair.

**ABSORBED 2026-09-15: rc03a-blind-prompt is WITHDRAWN and this stage owns the conflict itself.**
There is no inherited resolution — rc03a produced none. What it produced instead is the evidence,
and this stage starts from it rather than rediscovering it:

- **The conflict is live.** `orbit-review-external`'s `Cycle context populated from prior runs`
  SHALL-includes prior open findings in every external prompt; `orbit-engine-gates` requires a
  `blind-pair`'s members blind to each other; the blindness predicate observes walk records and
  cannot see prompt content, so it certifies an anchored pair as blind.
- **The state space has TWO entries, not one.** The leaking state is the OPEN-pair branch
  (`gates.ts:857-863`), which renders `--reviewer external` exactly when a pairable fresh pass
  stands. Three mechanisms failed here because each answered the empty-pair state; a site-level fix
  to a state-level problem cannot converge.
- **There are TWELVE channels**, enumerated from source, including `git log` over the change
  directory and a launching brief with no artifact behind it. Deny-listing them rots on the next
  body edit.
- **Ordering is a real PARTIAL mechanism** — it empties the empty-pair route rather than suppressing
  it, and must be paired with something for the open-pair state.
- **The property is R-crc-4's**: blind TO EACH OTHER, not to all prior history. The stronger
  reading was rc03a's own invention and is what made the problem unbounded.
- **The fix is ATTESTATION, not prevention** — the prompt is committed, the T0 emit can record what
  it carried, and the gate can require that before counting a member. R-crc-6's principle and
  R-d-11's house rule both point there, and rc03a deferred it three times on ceiling grounds.

What remains beyond the conflict is the genre split across the whole template set.
REMOVAL IS CONFIRMED BY VERIFICATION, NOT BY ANOTHER REVIEW (2026-09-14). The reviewed-gate rule
that a CRITICAL buys one further independent pass assumes the defect was FIXED IN PLACE — something
must re-read the changed state. When a walk resolves BY REMOVAL under R-crc-6's redesign lane, the
material the CRITICAL described is gone, and the correct confirming instrument is a VERIFICATION
pass over the walk's diff (is the removal complete, did anything else regress), not a further whole-
artifact review of a change that just got smaller. The gate cannot distinguish the two cases — it
reads the pass's immutable CRITICAL count — so this stage's genre split is what makes the
distinction available at all, and rc02's own seam is the first instance: two CRITICALs resolved by
removing the clause they lived in, with the gate still asking for another fresh review.

MEASURED ON THE FIRST REAL PAIR (2026-09-14, rc02's system review). Two independent agents on one
artifact state with no walk between them: the fresh half returned 1 CRITICAL / 6 WARNING / 5
SUGGESTION, the external half 4 CRITICAL / 7 WARNING / 0 SUGGESTION. **The CRITICAL overlap was
ZERO.** Four or five defects were found by both; seven were unique to each. Lincoln-Petersen on
those counts estimates roughly 29 defects present, so the pair surfaced about four in five of what
one reviewer alone would have left behind. The halves also DISAGREED once, and the disagreement was
the most useful thing either produced: one called a token-tie scenario unreachable, the other filed
it as a CRITICAL with a reproduction. A thirty-second test settled it in both directions — two
external artifacts cannot share a token because the filename embeds it, so that scenario is
unreachable and its engine defect is real but harmless, while the SAME test confirmed the other
half's fence-unaware-parser CRITICAL by feeding the reader a document whose only severity headings
sat inside a fenced example and watching it count as a clean external pass. Neither half could have
produced that resolution alone. This stage owns three consequences. (1) ONE INVOCATION LAUNCHES BOTH HALVES — it packages the
external prompt AND spawns the fresh subagent, so the pair is guaranteed to sit on one artifact
state and there is no window between two commands for the gate to recommend the walk that forecloses
it. Orbit can do half of this itself and can only ever do half: the fresh member is a subagent it
spawns, the external member is a prompt a human carries to another vendor, and no amount of design
collapses that asymmetry. (2) The pair's CLASSES ARE FIXED at one `fresh` and one `external`, which
the engine already enforces; the stage records why they should never become configurable rather than
treating that as deferred work. (3) The DISAGREEMENT class gets a name and a handling rule.

A NOMENCLATURE DEFECT to fix here, found while checking the above: `orbit-review`'s `--fresh`
requirement describes `--reviewer external` parenthetically as "same model, fresh context, no
cross-AI handoff" — which is the definition of `--fresh`, not of `external`. The parenthetical is
attached to the wrong noun in the shipped baseline, and it inverts the one distinction the pair
depends on.

MEASURED SUPPORT (2026-09-14, rc02's cadence): blind review was applied by hand on three of four
passes — the reviewer received the artifacts and the code but no resolved-since list — and the
shared-axis trend recorded **zero repeat findings across four passes**. The other half of that
result belongs in the prompt this stage owns: the highest-yield instruction was to EXECUTE the
specified behaviour against the real code on inputs the reviewer constructs, rather than to read it
for plausibility. Every CRITICAL in passes 2 through 4 came from that instruction; none came from
careful reading. A third prompt line earned its place at pass 6: state explicitly that reporting
few or zero findings is a legitimate outcome. It did not suppress anything — that pass returned
thirteen findings including two CRITICALs — which is the point: it removes the production pressure
without removing the findings, so a clean pass becomes a readable signal rather than an
embarrassment.

### Stage rc03b-pass-genres — a brief that carries nothing, and a genre the trail decides

Depends-on: rc02-gate-semantics
Complete: [x] 2026-10-04 (Sal)

Declared 2026-10-04 (Sal) from the rc03 exploration's split (D-rc03-8). Charter: a pass's GENRE —
REVIEW or VERIFICATION — is COMPUTED from reviewer class, mode and trail position and never declared:
the independent classes are reviews; an in-context pass that follows a QUALIFYING walk of its mode on the
trail (one whose source resolves to the mode, after the latest accepted independent pass of the mode — "qualifying"
replaced "readable" at walk 2 of the proposal cadence, 2026-10-04) is a verification; every other in-context pass (none before it, only mode-less marker-scan walks
before it, or architecture mode) is a review — and the cadence's slot arithmetic is unchanged by the genre
(corrected 2026-10-04 at walk 1 of the proposal cadence: an earlier wording said such a pass is "not counted"
toward the `in-context` slot, which is false when it follows the pair and precedes the walk; a VERIFICATION's
qualifying walk is bounded to walks after the latest accepted independent pass of the mode, the same set rc03c names).
The table is stated ONCE, in `orbit-conventions`, REPLACING the `Review mode decision framework`
requirement's scenarios (whose "in-context is the right first pass for a small change" R-crc-4
contradicts); every other surface names it and points (R-crc-14). A REVIEW-genre brief carries NO
findings and NO trail pointer: the external prompt's Cycle context keeps the iteration number only;
the project-context bullet pointing the reviewer at `.orbit-runs/` goes; both halves' system-mode
`git diff` excludes the trail by pathspec; review-genre passes skip Step 5 ("Inspect prior runs" —
pushback is a resolution-time discipline the walk owns); the recommended-session note's iteration-3+
option (a) — "carry context from a same-AI prior session" so it can verify its earlier findings — is
DELETED with its trade-off sentence, a TWELFTH channel found on the exploration's resume by reading the
owning spec rather than the body (D-rc03-10: an external is always REVIEW genre, and a continued session
carries prior findings in its own head); the fresh brief names artifacts and the apply
commit and nothing else — the one member with no artifact, carried as a rule with its residual declared
(D-rc03-3, BOUNDED). The review body gains NO launch sentence (corrected 2026-10-04 on the exploration's resume, D-rc03-5 amended): the eligibility line at the end of the packaging turn already renders `--fresh` for an empty pair, and a spawn inside a `--reviewer external` invocation would breach the no-chaining contract. Two repairs ride: `orbit-review`'s `--fresh` requirement
describes `--reviewer external` with `fresh`'s definition ("same model, fresh context, no cross-AI
handoff") — the parenthetical moves to the right noun; and the framework rewrite above. The engine's
genre FUNCTION ships in rc03c; this stage ships the table it implements. Inputs named (R-crc-10):
`TrailPass.reviewerClass`, `TrailPass.mode`, `TrailResolution.sourcePath`, token order — all trail
facts. Goal G1. Touches: orbit-conventions, orbit-review, orbit-review-external — at R-crc-1's ceiling,
no engine code, ~7 MODIFIED blocks. Exit: (1) the genre table is the single statement — a grep of
`orbit/specs/` and the generated surface finds the class-to-genre mapping stated once and pointed at
elsewhere; (2) the generated surface carries none of the finding-list phrasings ("still open",
"Resolved since", "carry context", and "iteration history" beside a trail path — four, the fourth added at
walk 1) and no `.orbit-runs/` read pointer in any review-genre brief, grep-tested under a decidable rule; (3) the
next blind pair's COMMITTED external prompt carries no findings and no trail pointer, read at the walk.

### Stage rc03c-verification-record — a verification says what landed and what regressed

Depends-on: rc03b-pass-genres
Complete: [x] 2026-10-04 (Sal)

Declared 2026-10-04 (Sal) from the rc03 exploration's split (D-rc03-8). Charter: the review emit
gains `verification: {walks: [<tokens>], resolutions: [{title, file, verdict}]}`, OWED when the genre
computes VERIFICATION (rc03b's table, implemented here as ONE exported function over the trail and
stored on the emit as a computed extension like `iteration`) and refused mis-shaped at any genre
(R-crc-13 permits refusing SHAPE where the record is produced — rc04b's `direction` is the pattern).
The walks are every address-reviews record of the pass's mode with a token after the latest
independent pass of that mode and before this pass; each resolution is keyed EXACTLY as the gate keys
it (Q-crc-17); `verdict` ∈ `landed` | `regressed`, a CLOSED pair; a `regressed` entry pairs with a
finding carrying `regresses: {title, file}` and the write gate checks EXISTENCE both ways. The walk
record's `resolutions[].file` union is the engine's DECLARED PROXY for "the walk's diff", because walk
edits need not be committed when the pass runs. The renderer adds `### Verification` inside the
quarantine (one row per entry), marks a finding without `regresses` as `[outside the walk record]` —
never refuses it — and marks an in-context pass the genre computes VERIFICATION for with no field
`[no verification record]`, by absence and never by date. The review body's in-context branch, in a
change mode with a preceding walk, reads the walk record(s), checks each resolution against the
artifact, sweeps the walk's files for regressions, and emits — a whole-artifact re-review is what the
marks make visible. The gate reads NONE of it. Q-crc-20 is NOT closed by this (a verification is
in-context and reads the walk RECORD, not the tree's diff since the pair); `verification.walks` plus the
file-set union is its nearest proxy and is to be named in Q-crc-20's entry at archive. Goal G1.
Touches: orbit-emit-composition, orbit-report-rendering, orbit-review — at R-crc-1's ceiling. Exit:
(1) a verification pass is a computed genre with its own body section and its owed record — the
cadence-slot token is unchanged, and `gates.ts` carries no diff; (2) a verification emit carries
per-resolution landed / regressed (rc03's (2) verbatim); (3) the next cadence's verification record
carries zero findings marked `[outside the walk record]` at WARNING or above, measured on the record.
Shipped as (2026-10-04; the charter above stays as declared — the departures are recorded in the archived design,
`orbit/changes/archive/2026-10-04-rc03c-verification-record/design.md`): the walk set is engine-computed and stored
as `verified_walks`, the payload carrying only `verification: [{title, file, verdict}]` (D1); the finding's link is
`walk_entry`, naming ANY entry of the walk set — `regresses` was renamed (D4); the sweep scope is each entry's `file`
plus its `ripple_cascade.applied` paths, not the `resolutions[].file` union (D6); `### Verification` renders in the
frame, outside the quarantine (D8).

### Stage rc04-readiness-record — the cycle ends when someone says it is ready, and says why

Depends-on: rc02-gate-semantics

Complete: [~] 2026-10-01 (Sal)

**SPLIT 2026-09-21 (Sal) into rc04a + rc04b + rc04c, under R-crc-9 — its second application, and
the first taken PREVENTIVELY from a size check rather than from a post-mortem.** This heading is
retained as the program's record of the problem, the charter and the evidence; the WORK is declared
in the three stages below. Its exploration — twenty decisions, zero open questions — was RENAMED
to `orbit/explore/rc04a-judgement-record/` and repointed at the FIRST child, because orbit's
propose consumes a staging directory by NAME and moves it into the change. It remains the shared
source for all three: rc04b and rc04c read it from wherever rc04a lands, active then archived,
which is ordinary. It was deliberately NOT copied three ways — three copies of one truth is the
defect class this program keeps catching, and the decisions interlock (D-rc04-13's qualifying test,
D-rc04-15's slot and D-rc04-17's verified retirement scope are cited by all three).

**Why three and not two.** The exploration produced the mechanism (D-rc04-13/15/16/17), and
measuring the mechanism rather than the charter gave TEN capabilities against a ceiling of three —
3.3x. The charter named three because it was written before the mechanism existed. The single
largest surprise: **`gate_overridden` occurs in SIX baseline specs**, so retiring it (exit
criterion (4)) is itself a ceiling-sized piece of work. A two-way split does not exist — the record
is 3 capabilities and everything else is 6 — so three is the minimum that keeps each stage AT the
ceiling rather than over it.

**The seam is WHAT IS RECORDED versus WHAT IS RECOMMENDED versus WHAT IS RETIRED**, and the
ordering is a dependency, not a preference: `continuation/proceed` must exist before the record it
replaces can be retired.

**ACCEPTED COST, bounded rather than hoped away.** Between rc04a and rc04c, `gate_overridden` and
`continuation/proceed` both exist — two records for one fact, which is the defect class this
program keeps catching. It is accepted deliberately and bounded by declaring rc04c NOW; rc03a's
history is the warning, where attestation was deferred three times on ceiling grounds and each
deferral bought a cheaper mechanism that failed.

**RE-CHARTERED 2026-09-21 under R-crc-11, from `rc04-cost-visibility`.** The original stage asked
what the cycle COSTS — a cadence line (passes, findings trending, budget remaining) and a
capture-recapture residual estimate from the blind pair. R-crc-11 establishes that cost is not what
the user is protecting, so two of the three chartered deliverables were answering a question nobody
asked. The third — the archive-side record of what was not converged and why that was acceptable —
survives, because it was a READINESS judgement wearing a cost costume all along.

Charter: the cadence produces two judgements today and records neither. An INDEPENDENT reviewer
forms a view on whether the work should move forward and emits only findings; the IN-CONTEXT AI
forms a view on whether it is ready and states it in chat, where it dies. This stage gives both a
home. Each independent pass carries a forward RECOMMENDATION (R-crc-11(g)) — a direction with its
reasons, distinct from the engine's gate verdict, which remains the engine's alone. The archive
carries the AI's READINESS judgement: what it believes, what it accepted, and why.

THE ONE COMPUTABLE THING, and the reason this is buildable where a general readiness check would
not be: R-crc-11(g) says the AI must believe it is ready *knowing what came back*. Belief is not
observable, but ORDERING is — the readiness record must POST-DATE the independent passes it cites,
and the engine can refuse a record that does not. Everything else here is a RECORD under R-crc-10,
because "why this was acceptable" is prose by construction.

Goal G1. Touches: orbit-review, orbit-review-external, orbit-archive-modifications.
Exit: (1) every independent pass emits a forward recommendation, and a pass without one is
incomplete rather than merely quiet; (2) the archive carries a readiness record naming the
recommendations it was formed against; (3) the engine REFUSES a readiness record that predates a
pass it cites; (4) `gate_overridden` either gains a reader or is retired — today nothing in `src/`
reads it, so replacing one write-only record with another would deliver nothing.

**BOUNDARY WITH rc02c, drawn before either proposes** (the two-capabilities-one-rule defect this
program keeps catching): rc02c owns the PREDICATE — what the engine COMPUTES about a cadence.
rc04 owns the RECORD and the JUDGEMENT — what the reviewers RECOMMEND and what the AI BELIEVES.
Where they meet: **NOWHERE, as it turned out.** The boundary was drawn against clause (c), the
`confirm` predicate — the only part of the gate that could have read a readiness record. rc02c
RETIRED clause (c) outright rather than narrowing it, so the predicate reads nothing about the
record, not even its existence. The line survives as the shape of a boundary that no longer has
two sides. Recorded at rc04a's archive (2026-09-21) rather than quietly corrected, because the
residue is instructive: a boundary drawn between two stages stops describing anything the moment
either stage deletes its own half, and nothing in the program surfaces that.

**Prior exploration**: `orbit/explore/rc04-readiness-record/` carries eight decisions taken with
Sal on 2026-09-21, the measurements that were taken and then deliberately set aside once the
question changed, and three open questions with standing recommendations.


### Phase 2 — move checking into tests

### Stage rc04a-judgement-record — the judgement gets a structured home

Depends-on: rc02-gate-semantics
Complete: [x] 2026-09-21 (Sal)

Charter: the cadence's judgements are recorded unevenly. WALK decisions have real structure —
`ratified_via`, `recommendation_fork`, a verbatim `resolution` — because `orbit-address-reviews`
was built for them. READINESS-shaped judgements have none: "buy a scoped external pass over an
already-passed gate", the clearest readiness call of rc02c's cycle, lives in a T0 emit's
`final_assessment` as prose, readable back by nothing. This stage gives them the same treatment.

ONE SPINE, TWO KINDS (explore D-rc04-15). Every record carries `kind`
(`continuation` | `readiness`), a NON-EMPTY `formed_against` list of independent pass TOKENS,
a kind-varying `disposition`, prose `reasoning`, and `ratified_by` (`ai` | `user`) — the last
required because the difference between the AI's own belief and a Sal ratification must be STATED
rather than implied. `continuation` is mid-cadence (`proceed` past a gate that says no, carrying
`gate`/`gate_state`/`gate_reason`; or `spend`, buying a further pass past a gate that says yes).
`readiness` is terminal (`ready` | `not-ready`, carrying `accepted: [{claim, why}]` — the residuals
are the assertion's CONTENT, not peer judgements).

**AMENDED BY rc04c (applied 2026-09-24; D-rc04c-1).** NON-EMPTY holds for every kind EXCEPT
`continuation`/`proceed`, where `formed_against: []` is LEGAL exactly when no independent pass the
trail reader accepted precedes the emit's own token (a rejected external return is not one), and
is REFUSED naming the latest preceding pass otherwise. The paragraph above is left as ratified;
this line is what a reader of it needs to know now. `orbit-run-summary-emit` owns the rule and its
set, stated once.

THE ONE COMPUTED RULE ABOUT THE EVIDENCE: every token in `formed_against` MUST precede the
record's own timestamp, or the write gate REFUSES it. **Qualified at rc04a's archive** — two
further refusals shipped, and both are about the record's SHAPE and LOCATION rather than its
relation to what it cites, so neither contradicts the claim this line was making: the carrier
table's KIND half (a `readiness` on a `review-external` emit has no reader), and the
`gate_overridden` field-agreement constraint, which retires with the field in rc04c. Both are
fully observable, so R-crc-10 permits them. What stays off limits is unchanged and is the point:
the engine never forms an opinion about whether the judgement was RIGHT. That is R-crc-11(g) made checkable — belief is not observable, ORDERING
is — and it is why the citation is BY TOKEN rather than the prose citation `gate_overridden` uses.
A `not-ready` record RECORDS and never BLOCKS (D-rc04-16): readiness is judgement, and an engine
blocking on it acts on what it cannot verify. No new trail location — the records land on emits
that already exist.

Goal G1. Touches: orbit-emit-composition, orbit-run-summary-emit, orbit-archive-modifications.
Exit: (1) a readiness record citing a pass token that POSTDATES it is refused at the write gate,
with a named error; (2) the archive completion readout STATES a `not-ready` disposition — the
record has a reader, which exit (4) of the parent charter demands; (3) rc02c's six free-prose
`warnings` entries are reproducible as structured records, TWO of them as `accepted` pairs and
the rest correctly OUT of scope as process notes. **REVISED at rc04a's archive (2026-09-21) from
THREE.** The criterion was written from the exploration's worked example, which predates the
qualifying test the stage shipped; re-deriving the sort under that test disqualified the stale
cross-reference (found by the sync agent, formed against no pass). A criterion written before the
test cannot grade the test — the stage revised it and recorded why, which is the only honest move
available once the two disagree.

### Stage rc04b-forward-recommendation — an independent pass says which way, not just what is wrong

Depends-on: rc02-gate-semantics
Complete: [x] 2026-10-04 (Sal)

Charter: an independent reviewer forms a view on whether the work should move forward and emits
only findings; the view dies in prose. R-crc-11(g) makes that view the readiness judgement's
INPUT, so it has to survive. Each independent pass carries a forward RECOMMENDATION — a direction
with its reasons, distinct from the engine's gate verdict, which stays the engine's alone.

Evidence it is close to free: rc02c's scoped iteration-2 external pass wrote one UNPROMPTED into
its Notes — *"the declaration hoist, conditional spreads and public reason are sound in the
implementation; the residual risk is that the comments and under-specific assertions do not
preserve that result against later edits"* — a ship verdict plus what would undo it, naming no
count, no gate state and no next command. The practice exists; what is missing is a NAMED SLOT so
it is reliably present and machine-readable rather than arriving when a reviewer happens to offer
it. That also narrows D4's commentary prohibition on the right axis: the line is
JUDGEMENT-versus-COMPUTATION, not who-may-speak (explore Q-rc04-c).

LOOSELY COUPLED to rc04a by construction: a readiness record cites pass TOKENS whether or not
those passes carry recommendations, so neither stage blocks the other.

Goal G1. Touches: orbit-review, orbit-review-external, orbit-report-rendering.
Exit: (1) an independent pass without a recommendation is INCOMPLETE rather than merely quiet;
(2) the recommendation RENDERS in the report under the existing single-voiced rules, asserting no
gate state; (3) the external prompt template carries it as a named field rather than as Notes prose.

### Stage rc04d-override-vocabulary — the override is a fact, not a field

Depends-on: (none)
Complete: [x] 2026-09-22 (Sal)

Charter: THREE capabilities name `gate_overridden` only while stating that an override is
RECORDED. They do not depend on its shape: `orbit-engine-gates` ("records `gate_overridden:
{gate, state, reason}`"), `orbit-pr-lifecycle` ("a recorded `gate_overridden` proceed-anyway SHALL
still flip READY"), and `orbit-conventions` ("choosing proceed records `gate_overridden` in the
archive run summary"). De-named — *the override is recorded on the emit* — every one of those
sentences is TRUE BEFORE AND AFTER the retirement.

**THIS CHARTER DELIBERATELY NAMES NO SHAPE OWNER**, and the deletion is itself a finding. It
originally illustrated the de-named form as *"shape owned by `orbit-run-summary-emit`"*. The
stage's own cadence has now refuted that wording TWICE from two independent directions: a fresh
proposal pass established it is wrong for the ARCHIVE emit, and the external system pass
established that the two-owner replacement is ALSO wrong, because `orbit-archive-modifications`
itself says the successor record's *"shape and carrier [are] both defined by
`orbit-run-summary-emit`"*. A charter that illustrates a form the stage is still litigating
becomes a third voice on an unsettled fact. The AUTHORITY on the de-named wording is the stage's
delta, not this paragraph; the paragraph states the PROPERTY the wording must have — true before
and after the retirement — and stops there.

**That property is the whole reason this stage exists SEPARATELY and FIRST.** Run first, there is
never a moment where a spec normatively demands a field nothing writes. Run after, the interim
state has three capabilities requiring a record the emit layer has already refused. The same total
work in either order; one ordering has an incoherent middle and the other does not. Split from
rc04c on 2026-09-21 under R-crc-9, applied PREVENTIVELY at exploration — the third time this
program has caught a ceiling breach before proposing rather than after.

**It is also what makes rc04c buildable.** `gate_overridden` spans SIX baseline capabilities
across FOURTEEN requirements, twice R-crc-1's ceiling on the binding dimension. This stage removes
three of them from the retirement's scope while moving no behaviour at all, leaving both halves AT
the ceiling rather than one at double.

**NO BEHAVIOUR CHANGES.** No engine edit, no workflow-body edit, no emit-shape change. If a task
in this stage touches `src/`, the stage has been mis-scoped — and exit (2) is written to catch
exactly that rather than leave it to a reviewer's judgement.

Goal G1. Touches: orbit-engine-gates, orbit-pr-lifecycle, orbit-conventions.
Exit: (1) no requirement in the three capabilities names `gate_overridden`, grep-verified;
(2) every de-named requirement is true of the CURRENT engine — verified by the suite staying green
with NO `src/` change anywhere in the stage's diff, which makes "this is pure vocabulary" a
falsifiable claim rather than an assertion; (3) `gate_overridden`'s footprint in `orbit/specs/`
drops from 6 capabilities to 3, measured the same way it was measured at exploration.

### Stage rc04c-retire-gate-overridden — one record for one fact

Depends-on: rc04a-judgement-record, rc04d-override-vocabulary
Complete: [x] 2026-09-25 (Sal)

**RATIFIED CEILING BREACH — the task dimension (Sal, 2026-09-24). R-crc-9's first.** Measured at
external iteration 1 and re-measured after its walk, this stage sits UNDER R-crc-1 on three
dimensions — capabilities 3 of 3, requirements 10 of ~12, and changed-bytes 163 lines under the
2026-09-23 clarification — and OVER on the fourth: **34 tasks against "under 20"** (22 work items
plus 12 verification and handoff records). **FINAL FIGURE 36 (reconciled 2026-09-24):** two more
handoff RECORDS (5.1e, 5.1f) were written at the pre-apply boundary after ratification, and the
preamble's own arithmetic then misstated the total as 35 until both halves of the system blind pair
caught it. The ratification stands — it ratified a BREACH, not a number — and both figures are
stated here so neither reader is misled.

**Why the breach is accepted rather than split.** R-crc-9's own first branch was considered and
does not help here: the obvious split — the totality amendment out, the legacy-key retirement in —
puts one requirement in EACH of the same three capabilities on both sides, so neither half drops
below 3 on the binding dimension. That is `D-rc04c-4`'s recorded objection to splitting by seam,
arriving again from a different direction, and a split that leaves both halves at the ceiling buys
nothing but a second cadence.

**What the count actually grew from, stated because it is the whole argument and also its own
limit.** 22 tasks at propose, 30 after the fresh internal pass, 34 after the external pass. Every
addition was a sub-task naming an exact site a reviewer had found: the body-side OMIT branch, four
previously unnamed test sites, a second build step, a standing negative regression. The stage did
not grow — its description got more precise, and precision costs boxes. **That is a reason this
breach is acceptable, NOT a reason it is not a breach.** The honest reading is that a task ceiling
is a poor proxy for cost in a program whose review cadence converts findings into enumerated
sub-tasks, and this stage is the first place that showed plainly.

**What was NOT done, deliberately.** The task dimension was not redefined to count work items only
(which would read 22 — still over), and the boxes were not coalesced. Both moves were available and
both are what the external reviewer named as hiding overage by recounting. The breach is recorded
at its real figure so a later reader can weigh it, and so R-crc-1's task bound can be recalibrated
on evidence if this recurs rather than on one stage's inconvenience.


Charter: `gate_overridden` is write-only. **Two claims in this paragraph were checked again when
the stage opened for exploration (2026-09-21) and BOTH had gone stale — recorded here rather than
corrected away, because the charter was right to state them and the re-check is the point.**
(i) "NOTHING COMPUTES ANYTHING FROM IT" is NO LONGER TRUE: rc04a's coexistence guard
(`emit-composition.ts:620`) reads the field and computes a refusal from it, so the parent
charter's exit (4) — *"either gains a reader or is retired"* — was technically satisfied by the
stage that prepared its retirement. That reader exists ONLY to prove the successor carries what
the old record carried, so it is scaffolding and comes down with the thing it braced; retiring the
field DELETES ITS ONLY READER in the same stroke. (ii) "four workflow templates" is THREE
(`apply-change`, `archive-change`, `pr-choreography`); `emit-composition.ts` is the engine, not a
template, and `bulk-archive-change` never mentions the field. The six-baseline-spec claim below IS
correct.

**And one claim checked in the RETIRING field's favour.** The tempting simplification is that
`gate_overridden` was always redundant, since `orbit-engine-gates` makes gate state a pure
function of on-disk artifacts and any past state should therefore be recomputable. The trail
refutes it: TEN archived apply emits across FOUR changes (CORRECTED 2026-09-24 — the charter said
"four"; rc04c's fresh proposal pass counted) record `reason: "latest independent pass yielded new
findings"` — clause-(c) vocabulary that rc02c RETIRED, which today's engine cannot produce for any
input. A recorded reason is what the human SAW; a recomputed one is what today's rules WOULD say.
So this stage MOVES three facts rather than deleting a redundancy.

Once rc04a ships
`continuation/proceed` — which carries `gate`, `gate_state` and `gate_reason`, the whole of
`gate_overridden`'s payload, PLUS the `formed_against` tokens it never had — the old record is a
strict subset of the new one and keeping both is two records for one fact.

**ONE NAMED HOLE IN THAT SUBSET CLAIM, found by rc04a's own trailing pass and inherited here
rather than left to be discovered.** `formed_against` is required NON-EMPTY, and a gate is
unpassed precisely when its cadence is incomplete — which INCLUDES the state where no independent
pass exists at all. In that state the successor record CANNOT be written, while `gate_overridden`
can. So the widening is strict over every override this repo has actually recorded — measured at
rc04a's archive: 20 `gate_overridden` emits across every archived change, all 20 with an earlier
independent pass, 0/20 reaching the edge — but it is NOT strict over the field's full domain.
`orbit-archive-modifications` now carries the case as a scenario (the entry is omitted and
`gate_overridden` stands alone). **SUPERSEDED at rc04c's apply (2026-09-24): the delta makes the
WRITE normative — the entry IS written, with `formed_against: []`, and the field is retired.**

**THE HOLE IS CLOSED BY D-rc04c-1 (Sal, 2026-09-21), and closing it is this stage's first task.**
An empty `formed_against` becomes LEGAL on a `continuation/proceed` — and ONLY when the emptiness
is TRUE. The engine verifies that no independent pass precedes the emit's token and REFUSES an
empty citation when one exists, naming the pass it should have cited. *"I cited nothing because
there was nothing to cite"* is fully observable, so R-crc-10 permits the check. That makes the
continuation record TOTAL over the override's domain, which is what "strict subset" needed in
order to be true, and it does so by ADDING a check rather than relaxing one. The exemption is
scoped to `proceed` alone: `spend` buys a pass past a gate that has already passed, so passes
necessarily exist, and an empty citation on `readiness` would be the uncheckable record rc04a's
design refused. Recorded honestly: this amends `formed_against` one day after rc04a shipped it
through a blind pair.

RETIRED FROM THE WRITE PATH, not deprecated (D-rc04-17): a deprecation period protects readers and
there are none. Readers of ARCHIVED trails are handled by the existing generation precedent —
`report-render.ts` already fails loud on a prior emit generation with a clean named error — so old
records stay readable as history and are never written again. Nothing is deleted.

SCOPE, RE-MEASURED AT EXPLORATION AND NARROWED BY THE SPLIT: `gate_overridden` spans SIX baseline
capabilities across FOURTEEN requirements — twice R-crc-1's ceiling on capabilities-touched, which
is the binding dimension. `rc04d-override-vocabulary` takes `orbit-engine-gates`,
`orbit-pr-lifecycle` and `orbit-conventions` (5 requirements — four plain substitutions plus ONE
ownership move, which is where every finding against that stage landed; "pure de-naming" was the
split-time estimate and is corrected here); THIS stage takes
`orbit-emit-composition`, `orbit-run-summary-emit` and `orbit-archive-modifications` (9
requirements) plus the three workflow bodies, D-rc04c-1's totality rule, and the removal of the
coexistence guard. Both halves sit AT the ceiling. The alternative split axis — by SEAM, apply
versus archive — was considered and rejected: `orbit-emit-composition` and `orbit-engine-gates`
straddle both seams, so neither half would be self-contained and the capability count would not
actually drop.

(Superseded scope note, kept because the charter's original reasoning is still instructive: the
line below assigned this stage "the three not already touched by rc04a", which had the right
instinct and half the work — rc04a MODIFIED those three capabilities without removing
`gate_overridden` from any of them.) The three not already
touched by rc04a are this stage's capabilities.

**NON-GOAL — THE VOCABULARY REFRAME. This stage retires a FIELD, not a WORD.** Declared here
under Q-crc-23's standing recommendation so the boundary is STATED rather than discovered
mid-apply. R-crc-13 establishes that a gate REPORTS and never RULES, which makes "override" — a
word meaning *you overrode something that had authority over you* — the wrong name for a joint
decision the gate never had standing to refuse. That is a real defect and it is NOT this stage's.
Measured before being bounded: `override` appears 48 times across `orbit/specs/`, and the bodies
carry `gate_overridden`, `Proceed anyway` and `proceed-anyway` at FOUR distinct seams — the gate,
the fingerprint guard, audit-drift, and the PR seam — so the reframe is a word across roughly ten
capabilities, far past R-crc-1 and an R-crc-9 trigger on sight. A stage that believes it is doing
the former while the program means the latter is exactly the mis-scoping this program keeps
recording, which is why the line is drawn in the charter rather than left to exploration.
What this stage MAY do without widening: retire `gate_overridden` as a FIELD, and let rc04a's
successor vocabulary (`continuation` / `proceed`, formed against named evidence, carrying
`ratified_by`) stand where it already stands. It names the same event correctly and was built on
the right frame before anyone remarked on it, so the field's retirement shrinks the wrong word's
footprint as a SIDE EFFECT. Whether the remaining reframe becomes its own stage, rides an existing
one, or is judged not worth doing at all stays a SCOPE call, open at Q-crc-23 and not taken here.

Goal G1. Touches: orbit-emit-composition, orbit-run-summary-emit, orbit-archive-modifications.
(CORRECTED 2026-09-22: this slot read `orbit-engine-gates, orbit-pr-lifecycle, orbit-conventions`
— byte-identical to rc04d's own line — for the whole interval between the split declaring the two
stages and rc04d's external review finding it. The SCOPE paragraph above was rewritten at the
split and the machine-shaped SLOT was not, which is the class this program keeps recording: a fix
landing where the edit was and stopping at the edge of the thing it described. Nothing catches it
— `orbit architecture validate` reads the slot's GRAMMAR, never its agreement with the prose.)
Exit: (1) no workflow body instructs writing `gate_overridden`, grep-verified; (2) an archived
trail carrying the old record still reads without error, as a prior generation; (3) the parent
charter's exit (4) is MET — the record is retired rather than left write-only.

**APPLY AND SYSTEM CADENCE RECORD (2026-09-24).** Applied 36/36 in one session; the three exit
criteria measured at apply — (1) the grep over `src/core/templates/` and `emit-composition.ts`
reads 0; (2) witnessed through `readTrail` over rc02c's archived trail and bare `orbit status`
over twenty archived emits carrying the field; (3) met on the RETIRED disjunct, the field's only
reader (the coexistence guard) removed with it. The built CLI refuses the legacy key on both
seams with no file written. ONE test outside the stage's sized set went red: the template hash
pin, moved by exactly the two bodies the stage names — a sizing miss (a grep for a field name
finds no hash pin), re-pinned and reported, not absorbed.

The system cadence ran design D4's way, the blind pair AFTER apply on the shipping tree: external
(GPT-5 Codex) 2 CRITICAL / 1 WARNING, fresh 0 / 3 / 4, both blind, no walk between them. The
halves converged on ONE defect: the token-source sentence — one paragraph pasted into FOUR bodies
— told the composing AI to cite every `external-<mode>-<TS>.md`, while the write gate's set is the
trail reader's ACCEPTED passes and a rejected return is not one; on a rejected-only trail the body
led straight into a refusal, at archive after the move. The fresh half proved the engine on all
four trail states from the built CLI; the defect was in the prose that feeds it. **This was the
FOURTH instance of the rule-stated-in-several-places watch the stage's own preamble said to stop
on, and the apply emit had claimed no fourth instance appeared — a false claim, corrected on the
walk record.** Closed by DELETION (option A, Sal, 2026-09-24): the sentence repaired once, everywhere,
with a fidelity pin on the qualifier; the reader-backed engine surface that would make the copies
collapse to a call (option B) was declined INSIDE the stage — authoring after the pair read the
tree, at the capability ceiling — and is canonized at **Q-crc-24**. The external half also found
the owning requirement's opening definition still excluding the zero-pass record (the earlier
repair had added a paragraph beside the sentence instead of replacing it) — closed by deletion too,
the sentence rewritten around cadence position and stated once.

### Stage rc05-executable-references — documented commands run in CI

Depends-on: rc01-instrument-fidelity
Complete: [ ]

Charter: every copyable command in a generated reference is a claim about a tool's grammar,
and claims are tested, not reviewed. A doctest-style extractor pulls fenced/backticked
invocations from the emitted references and runs each against the real `git` or the
contract-recorded `gh` stub in a disposable repo; a documented step that cannot be executed
is a failing test, not a reviewer's finding. Goal G2. Touches: test/integration,
orbit-skill-generation (the reference contract). Exit: (1) the extractor covers 100% of
invocation-shaped snippets in the three PR references; (2) a grammar defect injected into a
reference fails the suite; (3) the next blind pair finds zero grammar or selector defects.

### Stage rc06-scenario-test-map — scenarios are the test contract

Depends-on: (none)
Complete: [~] 2026-10-05 (Sal)

**SPLIT 2026-10-04 (Sal) into rc06a + rc06b, under R-crc-9 — its fifth preventive application, the
third caught at exploration before anything was proposed.** This heading is retained as the program's
record of the problem and the charter; the WORK is declared in the two stages that follow. The
exploration (`orbit/explore/rc06-scenario-test-map/`, one sitting on 2026-10-04) measured the ground —
1090 baseline scenarios, 25–101 per change; today's link is tasks.md prose at requirement grain naming
test FILES (1 of rc07b's 34 scenario titles appears under `test/`); ZERO `verify-*.json` emits on any
archived trail, because verify runs only as system Pass 0, which writes none; roughly 400 scenarios
describe AI behaviour no test can run; and no baseline capability owns verify-change — and captured
four rules with accounted Mechanism entries: D-rc06-1 (coverage is declared on the TEST side by a
`@scenario` tag keyed by the capability / requirement / scenario title triple, unique over all 1090),
D-rc06-2 (a CLOSED set of cover kinds — behaviour, text, observed, untestable — rendered separately and
never summed; only an undeclared scenario is UNCOVERED), D-rc06-3 (the map is ENGINE-COMPUTED by one
read surface and stored in no emit), D-rc06-4 (every scenario in a change's delta blocks owes a
declaration). Four scope calls (Sal): the split; no backfill of the baseline; the surface is `orbit
status --change <name> --scenarios`; the ledger is `orbit/scenario-ledger.yaml` (the last two settled
under R-crc-3). The charter below is SUPERSEDED in three terms and kept as written: "names the test id"
(the link points the other way), "verify-change's emit carries the map" (no emit carries it), and
"Touches: orbit-verify-change" (no such capability exists).

Charter: every delta scenario names the test id (or harness case) that exercises it, in a
grammar `orbit validate` checks; verify-change reports the scenario → test map mechanically
(covered / uncovered / test missing) instead of prose tracing, and the first review reads the
map. Uncovered scenarios are a verify finding, not a review finding. This stage is the map's
ONLY owner: the apply emit points at the latest verify emit rather than re-recording it. Goal
G2. Touches: orbit-verify-change, orbit-conventions (scenario grammar), the validator. Exit:
(1) `orbit validate <change>` fails a scenario without a test id; (2) verify-change's emit
carries the map; (3) a system review's Pass 0 consumes the map rather than rebuilding it.

### Stage rc06a-scenario-map — a scenario's coverage is declared, and the engine computes the map

Depends-on: (none)
Complete: [x] 2026-10-04 (Sal)

Declared 2026-10-04 (Sal) from the rc06 exploration's split (D-rc06-6). Charter: a test declares the
scenario it exercises with a `@scenario` tag naming its kind (`behaviour` or `text`) and the scenario's
capability / requirement / scenario title triple; `orbit/scenario-ledger.yaml` declares the scenarios no
test can run (`observed`, citing a record; `untestable`, with a why), keyed by the same triple. The
engine computes the map from both sources at read time — `orbit status --change <name> --scenarios`,
human and `--json` — with each cover kind its own column, ORPHAN tags and entries and MALFORMED lines
reported by name, and nothing stored in any emit. `orbit validate <change>` fails naming every scenario
in the change's ADDED or MODIFIED blocks (and every baseline scenario a RENAMED requirement re-keys) that
carries no declaration; baseline scenarios outside the delta are reported, never failing, and the
baseline is not backfilled. The grammar and the four mechanisms are the exploration's D-rc06-1..4, each
with its Mechanism entry. Goal G2. Touches: a NEW capability owning the map, its grammar and the check;
the owner of the status command's flags — measured at propose against R-crc-1. Exit: (1) `orbit validate
<change>` fails a delta scenario with no declaration, naming its key; (2) the surface renders the map
with the four kinds as separate columns and reports orphans — REVISED at declaration from "verify-change's
emit carries the map" (R-crc-12's first case: the mechanism retires the emit, D-rc06-3); (3) every
scenario in rc06a's own delta is declared when it archives.

Shipped as (2026-10-04; the charter above stays as declared — the departures are recorded in the archived design,
`orbit/changes/archive/2026-10-04-rc06a-scenario-map/design.md`): the check is OPT-IN by `scenario_map: {tests: [globs]}`
in `orbit/config.yaml`, absent or inert leaving `orbit validate` byte-identical (D-rc06-10), and this repo opts in; an
undeclared delta scenario "fails" validate only once the change's `apply` gate passes — INFO before, ERROR after, read from
the same gate computation `orbit status --change` renders, with an unresolvable schema reading INFO (D-rc06-12, design D4;
the metadata's schema passed explicitly at apply); a delta title whose key cannot name exactly one scenario — it contains
` :: `, or (system walk 2, the external CRITICAL) it repeats within its requirement — is UNKEYABLE, an ERROR at every gate
state; the charter's "owner of the status command's flags" needed no delta (`orbit-orientation` already licenses new
`--change` flags), so ONE capability, `orbit-scenario-map`, shipped. Exit (1) graded on the post-apply ERROR the
validation suite pins; exit (3) on 35 of 35 delta scenarios declared.

### Stage rc06b-map-readers — verify and the first review read the map

Depends-on: rc06a-scenario-map
Complete: [x] 2026-10-05 (Sal)

Declared 2026-10-04 (Sal) from the rc06 exploration's split (D-rc06-6). Charter: verify-change's
Scenario Coverage step stops tracing scenarios to tests by prose and reads rc06a's surface, reporting
UNCOVERED scenarios as verify findings; system review's Pass 0, which runs verify-change, therefore
consumes the map rather than rebuilding it. Neither records a copy. Goal G2. Touches: orbit-review
(Pass 0); verify-change has no orbit capability and either gains one or rides orbit-review — measured
at propose. Exit: (1) the verify body's coverage step names the surface and carries no prose-tracing
instruction; (2) a system review's Pass 0 consumes the map rather than rebuilding it (rc06's exit (3)).

RIDER 2026-10-04 (from rc06a's archive readiness record, `archive-2026-10-04T22-43-17Z.json`). A tag or ledger
entry naming an UNKEYABLE key — a delta title containing ` :: ` or repeated within its requirement — renders ORPHAN on
rc06a's surface, and no sentence or test pins that. The behaviour fits ORPHAN's definition (the key resolves to no
single scenario); whether a reader should present it beside the two MALFORMED spec lines as one problem is this
stage's to decide, since its readers are the ones that interpret the surface.

Shipped as (2026-10-05; archived at `orbit/changes/archive/2026-10-05-rc06b-map-readers/`): verify-change GAINED a
capability, `orbit-verify-modifications` (baseline capabilities 22 → 23), and `orbit-review` carries no delta. Verify's step 6
test-tracing line was replaced IN PLACE by a read of `orbit status --change <name> --scenarios --json`, reported by one
closed eleven-row table the body carries as a CHECKED MIRROR; the implementation check stays, its miss retitled `Scenario not
handled in code`; check OFF prints one note naming `scenario_map:` and traces nothing by any other means. System Pass 0 reads
the map through its existing `/orbit:verify` invocation; the external prompt's item 0 names the surface. The pristine-upstream
rule is narrowed and stated once in `orbit-conventions`' `Generated-file disposition` — an upstream portion changes only
through a named delta edit, in place — with apply-change's and archive-change's pre-rule edits and the propose/bulk-archive
overrides named as limits. The RIDER above was HALF FALSE as stated: a title containing ` :: ` makes its tag MALFORMED, never
ORPHAN; only the repeated-title shape renders ORPHAN, and the reader pairs that orphan with its unkeyable entry by exact key
equality (both pinned in `test/core/scenario-map.test.ts`). Two corrections the cycle made beyond the charter, both by Sal's A:
`orbit-sync-specs` was never "upstream-verbatim with no additions" (it has carried an additions section since D1/D5), and the
verify fail-mode contract said the emit layer classifies when the engine has composed from verify's `fail_mode` since D5 —
verify now classifies after an `orbit validate <name>` run, in its additions. Exits (1) and (2) MET as written: the body test
asserts (1), and both system blind-pair halves consumed the map at Pass 0. The archive's undeclared-scenario stop stays out of
scope (D-rc06b-8), proposed to rc10-apply-closure as a rider.

### Stage rc07-artifact-lint — consistency is a lint, not a review

Depends-on: (none)
Complete: [x] 2026-09-20 (Sal)

**SPLIT 2026-09-15 (Sal): the payload round-trip left for rc07b-reference-roundtrip**, under
R-crc-9 — and PREVENTIVELY, at exploration, before anything was written. R-crc-9's first
application came after two proposal passes and 48 findings had proved a change too wide; this one
fired on a charter that had carried both halves since it was drafted, because the ruling was
applied on purpose rather than in post-mortem. The two shared a sentence and nothing else:
different inputs, different mechanism, different capabilities. **A ruling that only fires in
post-mortem costs a stage every time.**

Charter: the cross-doc consistency class the reviews keep finding — a figure restated in prose that
disagrees with its generated source — moves into `orbit validate` as a mechanical check, under ONE
VOICE FOR FACTS: a computed number lives in exactly one generated place and prose POINTS AT IT.

*(AMENDED 2026-09-17, on the shipped change.* The charter said "`orbit validate` **and
audit-drift**". Audit-drift is an AI-driven workflow whose findings are judgments, and putting a
deterministic string comparison behind an AI pass is the inversion R-crc-10 exists to prevent; the
check is `orbit validate --sources`, run by `--all`. The overlap with audit-drift's Category 3
quantitative-claims scan is acknowledged and left standing — different MECHANISMS with different
reliability, the lint deterministic over DECLARED links and audit-drift able to see the unmarked
figure the lint declares as its residual.)*

R-crc-10 APPLIED AT EXPLORATION, and it decided the shape. The engine can observe a NUMBER in prose;
it cannot observe that the number is a RESTATEMENT, or which source it restates — that is authorial
intent, and inferring it is what two stages died doing on 2026-09-15. So the deliverable is a RECORD
the author writes (a marker naming a source) and a CHECK the engine runs against the DECLARED links
only. The charter's own wording already said it: prose POINTS AT IT.

THE DOMAIN IS THE WHOLE PROJECT, not `orbit/`. Three of the four restated-figure defects the
2026-09-15 session produced were in `CLAUDE.md`, which no validator reads; a lint scoped to `orbit/`
would have caught one of four and reported itself clean. It closes three ways, all SOURCED and none
from memory: FILES over `git ls-files '*.md'` minus a DECLARED exclusion list, SOURCES over a
registry file mapping each name to the ENGINE FACT that computes it, MARKERS by scanning the file
domain.

*(AMENDED 2026-09-17.* The charter pinned the domain at "61 today" — an incidental total, which is
one more instance of exactly the defect this stage exists to stop, and it was already wrong by the
time the change applied. The domain is whatever `git ls-files '*.md'` minus the declared exclusions
yields at the time of reading; `orbit validate --sources --json` reports it as
`source_domain.files_scanned` rather than leaving a reader to restate it.)*

THE EXCLUSIONS FORCED A PRINCIPLE rather than a preference: **the lint reads LIVING documents, never
RECORDS.** A figure in an archived change or an emit was TRUE WHEN WRITTEN, and linting it would
demand rewriting history to match the present — which inverts what a record is for. Fixtures
(`test/**`), templates (`schemas/*/templates/**`), generated surface (`.claude/**`) and superseded
files follow the same logic. Living-versus-record is decidable BY PATH, so no judgment is asked of
the engine anywhere in the domain.

THE RESIDUAL IS STATED, per the kind-and-method rule settled in `bounded-closure-semantics`: an
UNMARKED restatement is INVISIBLE to the lint. KIND — a figure written into living prose that nobody
marked; METHOD — a human or a review pass notices it, which is today's status quo unchanged. The
mitigation is a RECORD and not a check: the lint reports per-source marker COVERAGE — one line per
declared source, `<name> = <value> (<n> markers)` — so a reader can see a fact nothing points at.
It counts; it judges nothing.

*(AMENDED 2026-09-17.* The charter's example read `stages = 17 (2 markers)` against a real count of
18. The shape is shown schematically now: a charter illustrating an output format has no business
pinning the value that output computes.)*

Goal G2. Touches: the validator; ONE new capability `orbit-source-lint`, plus a MODIFIED
`orbit-architecture-engine`. Exit: (1) a MARKED figure that disagrees with
its source fails validation — "marked", not "restated", because an unmarked one can never fail
anything and saying otherwise would promise what R-crc-10 forbids; (2) the next proposal review
carries zero restated-count findings among MARKED figures; (3) the four facts this session's defects
earned — stages, rulings, capabilities, schema-version — are registry entries backed by ENGINE
SOURCES, and `CLAUDE.md` carries markers for each.

*(AMENDED 2026-09-17, on the shipped change.* Three corrections, all recorded in the change's own
charter-divergence table before they were made here. **Touches** said "the validator,
orbit-conventions": the marker's syntax and the rule that checks it are one mechanism, so splitting
them would put two capabilities in charge of one rule — `orbit-source-lint` owns the `src:` family
end to end, while `orbit-conventions` keeps the review-marker family. The MODIFIED
`orbit-architecture-engine` was not foreseen at all and was added two walks into the proposal
cadence: the source lint reads a doc's rulings index, which the live baseline called engine-opaque.
**Exit (3)** said registry entries "with **live commands**": there is no `command:` field, because
orbit is a published package and a shell field would mean that cloning a project and running a
read-only-looking `orbit validate` executes repository data. The registry names ENGINE FACTS from a
CLOSED table, so adding one is a code change with a test rather than a line of YAML.)*

### Stage rc07b-reference-roundtrip — a shipped reference is proven by running it

Depends-on: (none)
Complete: [x] 2026-10-04 (Sal)

SPLIT 2026-09-15 from rc07-artifact-lint under R-crc-9, preventively (see rc07's note). The two
halves share a charter sentence and nothing else.

Charter: every reference orbit ships describing a payload, a format or an invocation SHALL be
provable by RUNNING it against the surface it documents. The instrument is round-trip, not
comparison: build the documented shape, submit it to the real surface, assert acceptance.

The empirical origin is exact, and it is why comparison is not enough. `orbit-audit-drift`'s shipped
`run-summary-schema.md` documents six per-command payload fields (`context`, `caller`, `depth`,
`flags`, `categories_skipped`, `findings_summary`). `orbit emit audit-drift` REJECTS every one. The
existing parity test (`test/core/emit-schema-parity.test.ts`, rc01's instrument) compares FIELD SETS
and therefore records the gap as a `KNOWN_DIVERGENCE` exemption — accurate, and it let a ratified
follow-up describe the engine as "accepting a third shape" when the truth is a HARD REFUSAL. The
project-wide audit-drift sweep on 2026-09-14 failed twice on this before its payload was rewritten
against `emit-composition.ts`: the standalone command's own documented Step 10 is unfollowable from
its own reference. **A field-set comparison cannot tell a divergence from a refusal; running it can.**

R-crc-10 CHECK — every input is an artifact the engine owns: the reference text (generated), the
payload table (`COMMANDS[cmd].payloadFields`), and the surface's own accept/reject on a submitted
payload. Nothing asks the engine to judge prose, which is why this half is buildable while its
sibling needs an author-written marker. The contrast between the two is the clearest worked example
of R-crc-10 the program has.

Goal G2. Touches: orbit-audit-drift, orbit-emit-composition. Exit: (1) a reference whose documented
shape the surface refuses fails a test, BY EXECUTION; (2) the `KNOWN_DIVERGENCE` exemption is
retired or re-stated as a refusal rather than a divergence; (3) the audit-drift reference and its
emit surface agree, so the command's own Step 10 is followable from its own shipped reference.

Shipped as (2026-10-04; the charter above stays as declared — the departures are recorded in the archived design,
`orbit/changes/archive/2026-10-04-rc07b-reference-roundtrip/design.md`): examples are per SCHEMA BLOCK, not per
reference — six blocks across five references, each example attached to its nearest preceding block, a block's examples
jointly carrying its AI-supplied keys with `verification` exempt by name (D1); the closed scope words are `change`,
`archived`, `project`, `doc` — `archived` added because the archive emit resolves only against an archived directory
(D1); the address-reviews reference carries three examples, one per provenance (system walk 1);
`test/helpers/schema-references.ts` holds the reference table, the engine-owned subtraction list and the one block
grammar both suites read (D2, widened at apply and walk 1); audit-drift's counts are keyed over the union of
`categories_run` and the categories findings carry, on a null-prototype accumulator (D4, system walk 1), and the gate
checks the category TYPE only — the `"1"`–`"6"` range stays the body's (system walk 2). Exit (2) took its first branch:
the exemption is retired, not re-stated.

### Stage rc08-walk-completeness — walks sweep requirements, not examples

Depends-on: rc03c-verification-record
Complete: [~] 2026-10-05 (Sal)

**SPLIT 2026-10-05 (Sal) into rc08a + rc08b, under R-crc-9: its sixth preventive application, the fourth
caught at exploration before anything was proposed.** The heading is kept as the program's record of the
problem and the charter; the WORK is declared in the two stages that follow. The exploration
(`orbit/explore/rc08a-sweep-evidence/`, opened as `rc08-walk-completeness` and renamed at this
declaration) measured the trail: 205 walk logs and 1404 resolutions. `ripple_cascade` records the files a
walk edited and never how it found them, so a site that was never examined and a site judged unaffected
leave the same record. The exploration settled four decisions under Sal's delegation of method
(D-rc08-1..4, three rules with accounted Mechanism entries). Charter jobs (1) sweep set plus ripple-miss
detection and (3) walk execution go to rc08a. Job (3) folds into job (1)'s mechanism only as far as text
shows it: an edit that did not land is refused when it leaves named retired wording present or named
introduced text absent; the gate cannot certify that each intended edit happened (rc08a's external
proposal pass, W5), and that remainder goes to rc08b. Jobs (2) discovery, (4) three lanes, (5) the disagreement rule and (6) the T0 next line go to rc08b.
The charter below is kept as written. It is SUPERSEDED in one term: "`sweep_set`" ships as a `sweep`
record, two of whose fields the gate checks (D-rc08-2, D-rc08-3).

Charter: when a walk edits a command example or a normative sentence, the address-reviews body
sweeps the owning requirement's prose, every scenario, task restatements, transcriptions, and
sibling seams before the finding is marked resolved, recording the sweep set per resolution in
the log; the R-crc-4 verification pass over the walk's own diff precedes any further review.
ADDED 2026-09-15 (rc03a's third walk): this stage also owns WALK DISCOVERY. Bare
`/orbit:address-reviews` is defined as a whole-repo `@review:` marker scan, with auto-discovery
firing only when a positional anchor is supplied — so with zero markers repo-wide and exactly ONE
active change carrying two unwalked review passes, its defined behaviour is a clean no-findings
exit. The anchor the body says is missing is computable. Two related corrections belong here: bare
invocation resolves to the single active change when exactly one exists and says so, and discovery
walks EVERY outstanding pass rather than the most-recent-by-token one — reusing the gate's own
`passResolved` predicate, so a walk and the gate cannot disagree about what is outstanding (rc13's
exploration, D-rc13-3; blocked there on `TrailResolution.sourcePath` being singular).

This stage also owns the WALK EXECUTION discipline the same cadence exposed twice on 2026-09-14: a
walk's edit set SHALL be applied so that a failure cannot leave it PARTIALLY applied, and each edit
SHALL be VERIFIED AGAINST THE ARTIFACT before the log records it. Both failures came from one
habit — a multi-edit script with a single trailing write, which aborts on a bad match and writes
nothing while the author fixes only the edit that failed. The first cost seven unwritten edits that
shipped alongside three scenarios asserting them, and was caught only because the fifth pass grepped
each claimed edit instead of re-reading the requirement. A log that certifies work which did not
happen is the one failure no independent reviewer can see, because the claim lives on the trail and
not in the artifact. Goal G3. Touches: orbit-address-reviews, orbit-emit-composition (the log field).
Exit: (1) the log
carries `sweep_set` per resolution; (2) a later finding at a site the sweep should have
covered is detectable from the trail as a ripple-miss; (3) the next cadence records zero
ripple-miss findings; (4) the walk body implements R-crc-6's THREE LANES, and a REDESIGN finding
routes back to `/orbit:explore` rather than being fixed in place — the log records the routing so a
change that keeps generating them is visible on the trail.

ADDED 2026-10-04 (from the rc03 exploration, Sal: A). This stage also owns the DISAGREEMENT class's
HANDLING RULE (D-rc03-6): a disagreement is the two halves of one pair returning contradictory claims
on one site; it is observed at the merged walk, so its rule — settle by one cheap empirical test,
record the test on the walk log — lives in `orbit-address-reviews`, which this stage touches and
rc03b could not add under R-crc-1. The NAME stays with rc03's record. And it owns Q-rc03-5 from the
same exploration: the review-external T0 emit's `next_recommended` (`orbit-run-summary-emit`'s
`Review-external T0 multi-step recommendation`) ends "then `/orbit:address-reviews <name>
--from-file <path>`" — on a blind pair that is Q-crc-22's silent single-half walk written into a
record, while the gate's eligibility line on the same turn names the missing member. Standing
recommendation carried from the exploration: the T0 prose ends at "save the response as …" and the
eligibility line owns what follows. Both are the walk CONSUMER's business, which is why they land here.

### Stage rc08a-sweep-evidence — a walk's log carries what it retired, and the gate checks it

Depends-on: rc03c-verification-record
Complete: [x] 2026-10-05 (Sal)

Declared 2026-10-05 (Sal) from the rc08 exploration's split (D-rc08-1). Charter: every `resolved` walk
entry carries `sweep: {retired, introduced, searched, scope, kept}` (D-rc08-2). `orbit emit
address-reviews` REFUSES a log if a `retired` string survives in the check scope or an `introduced` text
is absent from its path. The check scope is the change directory with the trail excluded, plus the
entry's file, its cascaded files and `sweep.scope`. Matching is literal and whitespace-normalised, and
`kept` is the one exemption (D-rc08-3). `searched` and `scope` are a RECORD that the VERIFICATION pass
reads as part of an entry's sweep scope. A later finding is attributed by its walker through an optional
`ripple_miss_of: {walk, title, file, kind}`, where `kind` is `query` | `scope` | `judgement` and the
pointer is checked; `ripple_misses` is engine-computed (D-rc08-4). Prior-generation logs are exempt by
absence. Goal G3. Touches: orbit-address-reviews (the field), orbit-emit-composition (the gate),
orbit-review (the verification sweep scope), which is three, at R-crc-1's ceiling. Exit: (1) the walk log
carries `sweep` on every resolved entry, and a fixture whose retired string survives, or whose introduced
text is absent, is refused naming path and line; (2) a later finding at a site an earlier entry should
have covered is detectable from the trail, as `ripple_miss_of` on its walk or as a `regressed`
verification verdict; (3) the cadence of the stage after rc08a records zero ripple misses, read from
`ripple_misses` plus the `regressed` count. Exits (1)–(3) are rc08's (1)–(3), with (1) restated in the
shipped field's name.

Shipped as (2026-10-05; the charter above stays as declared — the departures are recorded in the archived design,
`orbit/changes/archive/2026-10-05-rc08a-sweep-evidence/design.md`): the CHECK SCOPE and PATH rule are ONE fenced
production in `orbit-emit-composition`'s `The walk write gate checks sweep evidence`, mirrored byte-equal into the walk
and review bodies (system walk 1, Sal: B); the checks run on the record as frozen for writing, the never-read
directories hold however a path entered the scope, a `kept` element is one FILE exempt in full (Q-crc-32 carries the
occurrence-scoped form to rc08b), and an unreadable scope member refuses rather than reading as absent (system walk 2);
`trail.ts` exports `stripLineSuffix`, `normalizeDisposition` and `toRepoRelative`, each unchanged, so the gate keys as
the reader does. Exit (1)'s "naming path and line" grades the retired half by the line and the introduced half by the
path and the text, since an absent text has no line. `orbit-engine-gates`' stale "none of the entry shapes" sentence
rides rc08b's charter (system walk 2, Sal: B).

### Stage rc08b-walk-routing — a walk finds every outstanding pass, and a redesign leaves the walk

Depends-on: rc08a-sweep-evidence
Complete: [x] 2026-10-05 (Sal)

Declared 2026-10-05 (Sal) from the rc08 exploration's split (D-rc08-1). It depends on rc08a because both
edit `orbit-address-reviews` and its walk body. Charter, as rc08's charter states each job, with nothing
restated here: walk DISCOVERY (a bare invocation resolves the single active change and says so; every
outstanding pass is walked, through the gate's `passResolved`); R-crc-6's THREE LANES, with a REDESIGN
finding routed to `/orbit:explore` and the routing recorded on the log; the DISAGREEMENT handling rule
(D-rc03-6) in `orbit-address-reviews`; and the review-external T0 `next_recommended` ending at "save the
response as …" (Q-rc03-5). It also takes the remainder of rc08's job (3) that rc08a's text check cannot
reach: whether a walk needs an edit-level record certifying that each intended edit happened, decided at
its exploration. It carries one rider from rc08a (system walk 2, external W5, Sal: B): `orbit-engine-gates`'
`Reviewed-gate pass condition` justifies its readability fallback with "the emit surface validates the
payload KEY and none of the entry shapes", which rc08a's walk write gate made false for new walk logs; the
sentence becomes a pointer to `orbit-emit-composition`'s `The walk write gate checks sweep evidence`, the
fallback itself unchanged. Goal G3. Touches: orbit-address-reviews, orbit-run-summary-emit, and possibly
orbit-engine-gates for the discovery predicate (and the rider). These are measured at its exploration against R-crc-1.
Exit: (1) a bare walk with one active change and two unwalked passes walks both, naming the change; (2)
rc08's exit (4): the body implements the three lanes, a REDESIGN routes to explore, and the log records
the routing; (3) the T0 emit's `next_recommended` names no walk command.

Shipped as (2026-10-05; the charter above stays as declared — departures are recorded in the archived design,
`orbit/changes/archive/2026-10-05-rc08b-walk-routing/design.md`): a reviewed gate's status row carries
`unresolvedPasses` (every pass clause (b) rejects, token order) and `openPair`, its `reason` byte-identical, and the
unresolved-pass canonical next is `/orbit:address-reviews <change>`, naming no file. The walk discovers from that list
through a DISCOVERY fence owned by `orbit-address-reviews`' `Address-reviews command available` and mirrored byte-equal
into the body, writes one log per source in token order, records `remedy` / `routed_to` / `disagreement` per entry, and
the T0 line ends at the save step. Three capabilities at R-crc-1's ceiling; 4 ADDED + 5 MODIFIED synced 9/9
byte-verified. The system pair ran with its external half launched by `codex exec` from the command line (GPT-6 Astra,
read-only), the fresh half a clean subagent; the walks routed the pair-diagnosis gap (`openPair` ignores passes an
earlier slot consumed — rc02's, newly consequential) to rc17 (Sal: C), and the in-context VERIFICATION confirm graded 9
landed and 1 regressed (a widened trigger carried a false claim copied from the finding's own text), walked to zero.
Exit (1) is MET by test 4.1 and observed live except row 2: the walk was invoked with the change name, so a bare
invocation resolving the single active change was never seen live (task 6.3, closed with that gap noted, Sal). Exits
(2) and (3) are MET on the walk logs and the T0 emit `review-external-2026-10-05T14-14-36Z.json`. rc08a's exit (3) was
measured on this cadence as its charter places it: `ripple_misses` 0 across six walks, `regressed` 4 (3 at the proposal
confirm, 1 at the system confirm), so the measure reads 4, not zero — of the four, two are true ripple misses (an edited
requirement's own scenario and a qualified cell's neighbour, both caught by a VERIFICATION pass) and two are unclean
edits. Recorded as measured, not graded: the grade is rc08a's.

### Stage rc09-propose-hygiene — spike before spec, size before review

Depends-on: (none)
Complete: [ ]

Charter: propose gains two gates of its own. A SIZE CHECK against R-crc-1 (capabilities,
requirements, bytes, tasks) that names a split when exceeded. A SPIKE PRECONDITION for any
change touching an external tool or protocol: a disposable prototype has run the outward path
and its findings are cited in design.md before the spec is written (D6 wrote 108 KB about `gh`
before anyone ran `gh`). This stage also OWNS the size computation that R-crc-4's conditional
proposal-mode blind pair depends on: no engine surface computes size proximity today, so "within
20% of the ceiling runs a pair" is exercised by choice rather than by the cadence until rc09 makes
proximity computable (surfaced by rc02's first external review, 2026-09-12). Under R-crc-7 the
INPUTS NAMED (added 2026-09-15, R-crc-10): design.md names the INPUTS the proposed mechanism will
read, one line each. A reviewer can see whether the list is present and whether any entry is prose,
intent or a judgment — the engine requires the QUESTION be answered and a human judges the ANSWER,
which is the `Standing recommendation:` idiom rather than a check. R-crc-10 forbids the engine
judging observability itself.
SPIKE PRECONDITION generalizes: it fires for any change whose deliverable is a decision procedure,
not only for one touching an external tool or protocol.
Goal G3. Touches: orbit-propose-modifications, orbit-conventions,
the validator. Exit: (1) the size check fires on a fixture over the ceiling and names the split;
(2) a proposal touching an external tool without a cited spike fails strict validation.

### Stage rc10-apply-closure — the end-to-end run precedes the archive

Depends-on: rc06a-scenario-map
Complete: [ ]

Charter: a change's user-validation tasks are a PRE-ARCHIVE condition rather than a deferred
annotation: the archive flow requires them checked, or records a reasoned deferral naming
when and where the run will happen (D6's real dogfood was deferred past its own archive with
no such record). The scenario map is rc06's; the apply emit points at it. Goal G3. Touches:
orbit-archive-modifications, orbit-engine-gates (the tracked gate's user-validation subset).
Exit: (1) an archive with an unchecked user-validation task records a reasoned deferral or
halts; (2) the next stage's dogfood runs before its archive.

ADDED 2026-09-15 (Sal; Q-crc-12): this stage also owns THE SEAM'S GATE PROMPT. Twice in one day —
rc03a and rc13a — a change archived with `review-proposal` reading `budget spent: 3 of 3` and NO
inflection prompt, because the archive's Step 3.4 is scoped to `review-system`, which read `blocked
(blocked by incomplete requires: apply)` — and `blocked` is neither `unpassed` nor `stale`. A change
that never applied still archives past its proposal gate, and both instances were exactly that. No
`gate_overridden` was recorded either time, because no override was offered. The prompt SHALL fire
on any gate that is `unpassed` or carries `budgetExhausted` at the seam, not only the one whose
`before` is archive. Exit gains: (3) an archive past an exhausted or unpassed gate of ANY phase
fires the inflection prompt and records the override.

**AMENDED 2026-09-21 (Sal) — `budgetExhausted` NO LONGER EXISTS; the defect above does.** rc02c
retired the field, so the clause as written instructs this stage to branch on a signal the engine
cannot produce. The amendment is a RE-FRAME and deliberately not a deletion, because the defect the
2026-09-15 block describes is untouched by the retirement: an archive seam scoped to one gate is
silent about every other gate, and a change that never applied still archives past its proposal
gate. Only the vocabulary died. **The prompt SHALL fire on any gate whose computed state is not a
passing one — `unpassed` or `stale` — at the seam, whatever its `before` phase**, and the recorded
`independentSpend` MAY be shown in that prompt but SHALL NOT be branched on: under R-crc-11(h)
effort is recorded, never targeted, so a cost figure may inform the human at the seam and may never
decide whether the seam speaks. Exit (3) restated: an archive past a non-passing gate of ANY phase
fires the inflection prompt and records the override. Found by rc02c's system blind pair, which
read the plan and not only the diff.

RIDER 2026-10-04 (from the rc03 exploration, D-rc03-7, Sal: A — not carried in rc03b). If the
EXTERNAL-FIRST canonical next for an empty `blind-pair` slot (rc03a's D-rc03a-9, ratified in the
withdrawn stage) is ever wanted, it is one `case` label in `commandForClass` (`gates.ts`) and one
sentence in `orbit-engine-gates`' single-voiced canonical-next requirement — a spec this stage already
touches. Its blindness value is gone under rc03b's no-findings brief; what remains is ergonomic
(the human carries the prompt while the fresh subagent runs). Take it or leave it at exploration.

RIDER 2026-10-04 (from the rc06 exploration, D-rc06-3). The dependency moved from rc06 to
rc06a-scenario-map, the child that ships the map. This charter's "the scenario map is rc06's; the apply
emit points at it" names a record that will never exist: the map is computed at read time by `orbit
status --change <name> --scenarios` and stored in no emit, so there is nothing for the apply emit to
point at. rc10's exploration decides whether its pre-archive condition reads the surface directly (the
`observed` column is the natural evidence for a user-validation task).

### Stage rc16-retirement-sweep — living prose retires with the limit it described

Depends-on: (none)
Complete: [x] 2026-10-01 (Sal)

DECLARED 2026-10-01 (Sal), in the architect session on rc15's archive day, from Q-crc-28's ratified
direction (Sal: A at the project-wide audit-drift walk the same day — "its own small change, not a
rider"). rc14 stays reserved for the undeclared `rc14-delta-scope` recommendation.

Three stages in a row — rc13a, rc13b, rc13c — each deferred living prose that a later stage made
false, to "a retirement-class sweep" nobody had declared, and rc15 added four more sentences, two of
them FALSE rather than pending. Q-crc-28 is the ledger: nine sites across three capabilities and the
explore body that describe reader limits the shipped tree has retired — the "five-section" titles and
their pointer sites, the "until the maturity-signal stage lands" clauses, the "until a
propose-consumption stage lands" sentences, the concluded-outcome KNOWN paragraph (keys on location,
renders `exploring`), and `orbit-orientation`'s "never artifact-content parsing" clause with its chip
parenthetical. Each deferral was correct under R-crc-1 when taken; together they are a baseline
asserting facts the tree contradicts in three capabilities, and every stage since rc13a has lengthened
the list rather than shortened it. The project-wide audit after rc15's archive was the fourth surface
to raise the set.

Charter: retire the set, by POINTER, in one change. (1) Every site Q-crc-28 lists is edited to its
written one-clause repair or deleted — a sentence describing a retired limit either points at the
requirement that now owns the behaviour or goes; no site gains a restatement of the rule it pointed
at (R-crc-14). (2) The explore body's copies move WITH their owning `orbit-conventions` sentences, in
the same change, so the body and the spec never say different things (the reason the audit walk
declined to fix the body alone). (3) No mechanism: the change ships no engine code, no new test
beyond the existing fidelity and parity pins moving once each, and no new requirement — MODIFIED
blocks only. The site list is owned by Q-crc-28 and is NOT restated here; the exploration reads it
from the question and counts it at exploration, under R-crc-1's ceiling.

Goal G4. Touches: orbit-conventions, orbit-explore-modifications, orbit-orientation (three
capabilities — at the ceiling, pointer-only, measured at exploration; a fourth site class found at
exploration splits under R-crc-9 rather than exceeds). Exit: (1) every site Q-crc-28 names at the
stage's exploration greps to zero on the archived tree, measured by the exact sentences the question
quotes; (2) the deltas are MODIFIED-only and add no requirement — `ls specs/` on the change shows the
three directories and `orbit validate --strict` passes; (3) the project-wide audit-drift run after
the archive raises no Category 3 finding on the retired set, and Q-crc-28 closes on that run.

### Phase 4 — engine changes last

### Stage rc12-engine-owned-choreography — deterministic git steps become an engine command

Depends-on: rc05-executable-references
Complete: [ ]

Charter: revisit D6's zero-engine-git absolute (D-d6-7) at the boundary the D-arc's own thesis
draws — engine computes, body reads. The DETERMINISTIC sequences of the PR choreography
(remote and default-branch resolution, tip comparison, the isolated commit, the attachment
record's push) become an `orbit pr` engine command that prints or performs the exact steps
under the body's consent, leaving the body only what needs judgment (titles, landmark prose,
degradation notes). The 20 KB runbook a performing AI must execute correctly shrinks to a
call. Governed by R-crc-5 (the conditional reversal of D-d6-7): effective only for steps
rc05 has executed and shown deterministic. At the R-crc-1 ceiling's edge — explored as TWO
changes: the engine command first, body adoption second. Goal G4. Touches: orbit-pr-lifecycle,
the engine (change 1); propose/archive bodies (change 2). Exit: (1) the deterministic steps
are engine-tested; (2) the three PR references shrink by more than half; (3) the consent
properties (user-invoked, draft-only, merge never) hold unchanged.

### Stage rc15-ended-stage-state — a stage that ended without meeting its criteria says so

Depends-on: (none)
Complete: [x] 2026-10-01 (Sal)

DECLARED 2026-09-25 (Sal), taking up Q-crc-11 on its second reading — a third occurrence of the
COST, not a third withdrawn stage. rc14 is not this stage: that id stays reserved for the standing
`rc14-delta-scope` recommendation in the status log (2026-09-14), undeclared.

The grammar has two states where the program has three. `orbit-architecture-engine`'s
`Computed stage state with completion-as-ratification` composes `complete` from an observed
`quiescent` and a ratified `Complete: [x] <date> (<who>)` slot; the only other slot value is `[ ]`.
A stage whose citing work all archived WITHOUT meeting its exit criteria — rc03a, withdrawn after
three passes; rc13a's first attempt, before its second shipped — has no honest mark, so it renders
`quiescent — completion awaiting your ratification` at every architect session forever, and the
WAITING band lists it as yours to ratify. Four firings for rc03a alone, four declines, each one
re-derived from the charter. D-bcs-6 named the same gap from the exploration side: a stage cited
only by a CONCLUDED exploration renders `exploring`, because the state reader keys on LOCATION
(`orbit/explore/*/`) and never reads the `> **Status**: concluded <date>.` header rc13a shipped as
the concluded record's pointer. WITHDRAWN and CONCLUDED are one missing state seen from two layers.

Charter: the engine learns the third state, from both layers, as a PURE FUNCTION of on-disk
artifacts like the other four. (1) The `Complete:` slot grammar gains a third production for a stage
the user has declared ENDED without meeting its criteria — one mark, dated and attributed like the
ratified one, with the parser's NEAR-MISS rule unchanged (a slot line that matches none of the three
productions is MALFORMED naming the line). (2) The state reader reads the status-header production
(`orbit-conventions` owns it; the reader points) on the `explore.md` in any citing staging
directory, and a stage whose ONLY live citer is a concluded exploration observes as ended-from-explore
rather than `exploring`. (3) The rendered vocabulary gains the state, the STATUS render and the
`--json` bucket carry it, the WAITING band's closed set does NOT list it (nothing is yours to do),
and the ratification offer in `orbit-architect`'s `Completion-ratification flow` fires on
awaiting-ratification ONLY — a declared-ended stage is offered nothing. (4) The same inconsistency
rule the ratified mark has: an ended mark on a stage with LIVE citing work renders INCONSISTENT and
audit-drift's check (b) raises it — that check names the ratified mark today and consumes the
engine's rule; if its text needs the second mark named, that is the one sentence this stage may add
to `orbit-audit-drift`, by pointer. The mark is the USER's, written in an architect session on their
word exactly as ratification is (the arc's rules of engagement); the engine never infers withdrawal
from a trail.

Goal G4. Touches: orbit-architecture-engine, orbit-architect (two capabilities; a third only if
audit-drift's check text must name the mark, measured at exploration). Exit: (1) rc03a carries the
ended mark, renders a state that is neither `complete` nor awaiting, and the next architect session
on this doc fires NO ratification offer for it — Q-crc-11's firing count stops at four; (2) a stage
cited only by a concluded exploration (a fixture, since none exists on disk today) observes as the
ended-from-explore state and never as `exploring`, with the parity between the two layers stated in
one requirement; (3) every new production is exercised by a test that EXECUTES it against a
malformed near-miss as well as the well-formed line (the rc13a discipline: a production asserted
present is not a production tested), and the WAITING-set requirement in `orbit-orientation` is
unchanged, measured by its delta count being zero.

### Stage rc17-blind-pair-command — the pair is one command, as it is one slot

Depends-on: rc08b-walk-routing
Complete: [ ]

**SPLIT 2026-10-05 (Sal) into rc17a + rc17b, under R-crc-9: its seventh preventive application, the fifth
caught at exploration before anything was proposed.** The heading is kept as the program's record of the
problem and the charter; the WORK is declared in the two stages that follow. The exploration
(`orbit/explore/rc17a-invoked-coverage/`, opened as `blind-pair-command` and renamed at this declaration)
settled sixteen decisions (D-bpc-1..16, eleven rules with accounted Mechanism entries), several of them
Sal's from extended use, and they REFRAME the charter: the pair becomes the recommended first review rather
than the required one (R-crc-4 amended this day), the invocation decides what covers the first slot, and a
walk discovers every unwalked pass at any severity. Measured by capability, one stage would touch five or
six. The gate, the launch record, discovery and the short next line go to rc17a; the command, the
per-user runner and the setup step go to rc17b. The charter below is kept as written. Its exit (2) is
carried by rc17a in the reframed terms; its exits (1) and (3) by rc17b.

**Exit owners as of 2026-10-06** (the paragraph above stays as the split's record; two later splits moved what it
names). The short next line split from rc17a into `rc17c-short-review-next` (2026-10-05). The per-user runner, the
setup step and this charter's exit (3) split from rc17b into `rc17d-external-runner` (2026-10-06), where exit (3) is
rc17d's exit (2), met. Exit (1) stays rc17b's, met on rc17b's own system review, and exit (2) stays rc17a's. Of the
four children, rc17c is the only one still open.

Declared 2026-10-05 (Sal) during rc08b's system walk. The cadence's `blind-pair` slot is one unit — two
passes of distinct classes, one state, no walk between — but running it is two commands, a handoff, a
wait and an ordered commit, and the engine meanwhile reports a half-open pair the user must not walk.
Charter: `/orbit:review --as <mode> --reviewer blind-pair` launches an isolated fresh pass and an
isolated external pass from ONE pushed commit, waits for both, commits each pass file in its own commit,
and renders both reports; the walk follows as its own command. NARROWS D-rc03-5 (no launch sentence in
the review body): that ruling barred a spawn the user had not named, and here the user names both halves
in one command, so no-chaining holds. It also takes rc08b's routed redesign (system walk 1, external W1,
Sal: C): `openPair` reads the whole pass list without the failed slot's ordering bound, so on a cadence
that puts a pair after another slot the gate recommends the walk that forecloses the pair — the state a
failed half of this command would hand back. Open at exploration: the external runner for an adopter
without Codex (a configured command, with the manual handoff as fallback); where orchestration lives
(the body, per D6's zero engine processes, unless rc12 settles otherwise); partial failure; and size
against R-crc-1 (orbit-review, orbit-review-external, orbit-engine-gates, likely config). Its exploration
is `orbit/explore/blind-pair-command/`, the route rc08b's walk log already records. Goal G4.
Exit: (1) one invocation produces both pass files on one commit, each committed alone, with no walk
between them; (2) with only one half returned, the gate reports `openPair` on every supported cadence,
including `[external, blind-pair]`; (3) an adopter without a configured external runner gets today's
handoff, unchanged.

### Stage rc17a-invoked-coverage — the invocation decides what covers a review, and a walk finds every pass

Depends-on: rc08b-walk-routing
Complete: [x] 2026-10-06 (Sal)

Declared 2026-10-05 (Sal) from the rc17 exploration's split (D-bpc-9). Charter: both reviewed gates move to
`[<first>, in-context]` (`spec-driven` version 5; a v4 change keeps its cadence), where the first slot
accepts a blind pair, a single fresh or a single external pass, and a per-gate preference in
`orbit/config.yaml` changes only what the readout presents (D-bpc-8; R-crc-4 as amended). Pair membership
is a state machine COMPUTED from the trail — NO-LAUNCH, PAIR-OPEN, COMPLETE, BROKEN — with one new
engine-composed record, the pair LAUNCH, and the fresh emit stamped with its launch (D-bpc-10). The pair
diagnosis reads only the passes the uncovered slot could use, retiring the `foreclosed` label (D-bpc-6,
rc08b's routed external W1). Discovery widens beside the gate's hold: the engine computes every pass that
carries a finding and has no walk record, at any severity, and a change-scoped walk reads that set with
`unresolvedPasses` (D-bpc-15). The review emit's short next line (D-bpc-16) moved to rc17c at propose
(2026-10-05, Sal): counted against the specs that restate the pointer, it touches two more capabilities.
The exploration's Mechanism entries are the design input.
Capabilities: `orbit-engine-gates`, `orbit-emit-composition`, `orbit-address-reviews` — at R-crc-1's
ceiling. Goal G4.
Exit: (1) with a pair launched and one half landed, the gate reports `openPair` and the slot uncovered on
every cadence the schema grammar admits up to a stated size, including `[external, blind-pair]` —
measured by an exhaustive oracle over enumerated small cadences and trails, not by hand-picked cases;
(2) a single invoked fresh or external pass covers the first slot on both gates, and the preference — set,
absent or unknown — changes only the presented command; (3) a SUGGESTION-only pass is walked by
`/orbit:address-reviews <change>`. (Exit (3)'s second half, that no change-mode review emit's
`next_recommended` names a path, moved to rc17c with D-bpc-16.)
Refined at propose (2026-10-05; the change's design D2–D4, which give the reasons): the pair LAUNCH is
the external half's T0 written with `pair: true`, not a new record kind; the fresh member is matched by
order, as the external one is, so no fresh emit is stamped; and no versioned cadence reader exists, so
version 5 gates every change, including one stamped v4 — a relaxation that never removes coverage.
Refined at the proposal walk (Sal; the design's D10): the state set is NO-LAUNCH, PAIR-OPEN, COMPLETE,
ENDED — a walk of a pair's landed half ENDS the pair and the walked half covers as a single, where the
charter's BROKEN left the pair open — and the walk's `openPair` stop becomes a warning that offers to
stop or walk. The charter above is kept as written.
Shipped as (2026-10-06; archived as `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/`; the charter
above stays as declared): `spec-driven` version 5, both reviewed gates `[invoked, in-context]`, with the
refinements above plus three made at the system walk. "Landed" is read from membership, stale or not, and a
stale landed member is its own presentation row, presenting a further review of its class (a single that
covers) rather than a partner that would complete a pair unable to cover (fresh W1, Sal: C). A pass sharing its
launch's own token is neither member nor single, the tie fail-safe at the launch boundary (external W2). And the
walk's half-pair warning offers to walk only when the landed half carries a finding; a clean landed half has
nothing to walk, so the warning names the routes that can end the pair (external W1, Sal: B). Exit (1)'s oracle
ran at 21,007,908 cases (258 cadences × 81,426 trails, reason text compared on the `invoked` slot) and was
shown able to fail on four re-introduced defects; exits (2) and (3) are suites over the shipped schema and the
real walk write gate. The system review ran as the program's first LAUNCHED blind pair, by hand (a `pair: true`
T0; rc17b ships the command), and the gate computed PASSED through it.

### Stage rc17d-external-runner — a recorded runner launches the external review

Depends-on: (none)
Complete: [x] 2026-10-06 (Sal)

Split from rc17b 2026-10-06 (Sal) at its exploration, under R-crc-9: its ninth preventive application, caught by a
capability count before anything was proposed (D-rc17b-1, `orbit/explore/rc17b-blind-pair-command/`). It carries
the half of rc17b's charter that stands alone. Charter: the external runner is the USER's, recorded in the per-user
global config at `orbit init`, which explains the concept and offers the Codex preset, an own command or none
(D-bpc-2, D-bpc-11); the engine prints the resolved record through its own read command, `orbit external runner
--json` (corrected at propose: `orbit-orientation` enumerates the status JSON key set), and never executes it; a recorded and
reachable runner launches EVERY external half — today's single `--reviewer external` first, the pair's half once
rc17b ships — in the background, its return normalized (lines above `# External Review:` removed and quoted in the
commit message) and committed without hand edits; otherwise the prompt is printed for paste, today's handoff
unchanged (D-bpc-1, D-bpc-5, D-bpc-14). A runner on PATH with nothing recorded launches nothing. The setup note lives
in init's output, owned by the new capability, so `orbit-onboard` is not touched. The decisions and their Mechanism
entries live in the change's `explore.md` (`orbit/changes/archive/2026-10-06-rc17d-external-runner/`, D-rc17d-1..8, re-entered from rc17a's archived exploration and
re-read for the single external path). Capabilities: an ADDED runner capability (no baseline owns init's
prompts, the global config or the record's status field), `orbit-review-external` (its `Command does not run the
review or ingest findings` and handoff requirements gain the launched branch), `orbit-conventions` (the external
class is "reached by a packaged prompt a human carries across vendors") — three, at R-crc-1's ceiling. Named limit
(Sal, 2026-10-06, D-rc17d-7): the T0 record's `next_recommended` stays the paste/save prose `orbit-run-summary-emit`
requires and `orbit-emit-composition` composes — it states the manual fallback even when a runner launches, and the
launch is reported in chat; making the record launch-aware would add those two capabilities and is left as a
follow-up. Goal G4.
Exit: (1) with a runner recorded, `--reviewer external` launches with no paste and its return is committed without
hand edits; (2) an adopter without a recorded runner gets today's handoff, unchanged; (3) a runner present on PATH
but not recorded is never launched.

Shipped as (2026-10-06; archived as `orbit/changes/archive/2026-10-06-rc17d-external-runner/`, where its
`explore.md` now lives; the charter above stays as declared): the ADDED capability is `orbit-external-runner`, and
the return is normalized by an ENGINE command, `orbit external save` (D-rc17d-8, Sal at propose), not a body step: it
cuts at the first `# External Review:` line OUTSIDE every fence, checks the result with the trail reader and the
report renderer, refuses an aliased change directory or trail, and — given the launch's T0 token — refuses a return
an apply has since superseded. A single external also runs in a worktree at the handoff commit (design D4), launched
in a subshell, and the return's commit message is a FILE passed by `-F`, because the removed preamble is text an
external AI wrote (the system pair's converged CRITICAL: `$(...)` in a preamble ran under `-m`). A path-bearing
`argv[0]` must be absolute. Task count 27, declared over R-crc-1's "under 20" at the proposal walk (Sal; design
D10); the capability count held at three. Exit (1) was observed on the stage's own system review: its external
half launched Codex through the recorded runner with no paste, and the return was committed with no hand edit.

### Stage rc17b-blind-pair-command — the pair is one command

Depends-on: rc17a-invoked-coverage, rc17d-external-runner
Complete: [x] 2026-10-06 (Sal)

**Narrowed 2026-10-06 (Sal) at its exploration:** the runner half of the charter below — the per-user record, the
init setup step, auto-launch of every external half (D-bpc-1's dispatch, D-bpc-2, -5, -11, -14) — moved to
`rc17d-external-runner`, on which this stage now depends, and with it this stage's exits (2) and (3) (D-rc17b-1).
This stage keeps the one-command pair: D-bpc-3, -4, -13, the three shorthands and the `blind-pair` presentation row,
across `orbit-review` and `orbit-engine-gates` — two capabilities. It also takes a residual rc17d hands it (rc17d's
proposal walk, 2026-10-06): two `orbit-review` sentences describe the external class as packaging-only — the scenario
"External reviewer class dispatches to the handoff branch" ("no review passes run in this invocation", repeated in the
review body's trunk) and the `--fresh` requirement's "the cross-vendor handoff a human carries" — which a recorded
runner makes false in letter; correcting them inside rc17d would have made `orbit-review` its fourth capability. The charter is kept as written; its capability
sentence and exits are superseded by this paragraph and the exit line below.

Declared 2026-10-05 (Sal) from the rc17 exploration's split (D-bpc-9). It depends on rc17a because the
command writes the launch record rc17a defines and must never hand back a half-open pair the gate cannot
see. Charter: `/orbit:review --as <mode> --reviewer blind-pair` runs both halves in one invocation, in the
step order D-bpc-13 records — the launch record, the packaging and one commit as BASE, pushed; the external
half in a throwaway worktree at BASE so it can read nothing the fresh half writes (D-bpc-4); the fresh half
as a clean-context subagent; both awaited; the external return normalized; each pass file committed alone in
token order and pushed (D-bpc-3); both reports rendered; the walk left to the user. The external runner is
the USER's, recorded in the per-user global config at `orbit init`, which explains the concept and offers
the Codex preset, an own command or none (D-bpc-2, D-bpc-11); a recorded and reachable runner launches
every external half, single or pair, and otherwise the prompt is printed for paste (D-bpc-1, D-bpc-5,
D-bpc-14). The `--reviewer` axis gets one shorthand per class, as `--fresh` already is for `fresh`:
`--in-context`, `--external` and `--blind-pair`, each exactly `--reviewer <class>`, mutually exclusive with one
another and with an explicit `--reviewer` (a clean usage error, as `--fresh` has today) — Sal, 2026-10-05, for a
coherent interface; `--fresh` stays. NARROWS D-rc03-5 as the parent charter states. The decisions live in rc17a's archived
exploration. Capabilities: `orbit-review`, `orbit-review-external`, `orbit-onboard`, plus whichever owns
init's setup step — measured at propose, and a fourth is declared there under R-crc-9 rather than found
later. Two handoffs from rc17a's propose (its design D2 and D6), counted in that measurement: the pair's
launch is the external half's T0 written with `pair: true`, so D-bpc-13's steps 2 and 3 are one act;
and while no pair command exists the `blind-pair` review preference presents the fresh review, so
switching that one presentation row to this command is an `orbit-engine-gates` edit. Goal G4.
Exit (as narrowed 2026-10-06): (1) one invocation produces both pass files on one commit, each committed alone,
with no walk between them, and pushed; (2) with no runner recorded, the invocation runs the fresh half, prints the
external prompt for paste, and ends with the pair open (`openPair: {missing: "external"}`), never a half covering
alone. The original exits (2) and (3) are rc17d's exits (1) and (2).

Shipped as (2026-10-06; archived as `orbit/changes/archive/2026-10-06-rc17b-blind-pair-command/`, where its
`explore.md` now lives; the charter above stays as declared, narrowed as stated): `--reviewer blind-pair` (shorthand
`--blind-pair`) loads a new `references/blind-pair.md`, a thirteen-step order that names rc17d's launch path rather than
restating it. Two acts are new and both decide blindness. The external return is SAVED only after the fresh pass file is
committed alone (D-rc17b-3), so token order is fixed on the launched route. And EVERY half of a pair reads the pair's
reviewed state (D-rc17b-4, BOUNDED): a re-run of a missing external half launches at BASE and saves with `--launch L`. The
system walk added one more case (D10 as revised, Sal: A′). After an apply later than the launch, the engine still counts
the next run of the missing class as the pair's member, so the re-run reviews the commit before the landed member's own
and saves under its own token. Only a member read from the trail as STALE makes a run a single. BASE is committed and
pushed on both routes, so the no-runner pair ends open after its fresh half (exit (2), by the harness). Four
capabilities, declared one over R-crc-1's ceiling at exploration (D-rc17b-8); the default review preference now
presents the pair command (an `orbit-engine-gates` row), and onboard points at the reviewer axis instead of enumerating
it. Exit (1) was observed on the stage's own system review, run as one `--reviewer blind-pair` invocation.

### Stage rc17c-short-review-next — the review emit's next names the change, never a path

Depends-on: rc17a-invoked-coverage
Complete: [ ]

Split from rc17a 2026-10-05 (Sal) at its propose, under R-crc-9: its eighth preventive application, caught by
counting capabilities before any artifact was written. D-bpc-16, recorded in rc17a's exploration, says a
change-mode review emit's `next_recommended` names `/orbit:address-reviews <change>` rather than
`--from-file <own path>`, because rc17a's discovery (D-bpc-15) reaches every pass that carries a finding.
Three specs state the old pointer: `orbit-emit-composition` composes it, `orbit-report-rendering` validates it
at render and fails the render on any other value, and `orbit-review` has a scenario asserting it. So the stage
is those three, at R-crc-1's ceiling. It depends on rc17a because the short form walks a SUGGESTION-only pass
only once discovery reaches one. Every review emit already on a trail carries the old pointer, so the renderer
must keep rendering it: the earlier form is a prior generation, never a render failure. Architecture mode and
project-wide audit-drift keep `--from-file` (no change-scoped walk reaches them). Goal G4.
Exit: (1) no change-mode review emit's `next_recommended` names a path; (2) a review emit written before the
stage, carrying the `--from-file` self pointer, renders unchanged; (3) the architecture-mode pointer is
unchanged.

**2026-10-07 — size declared: four capabilities, one over R-crc-1's ceiling (D-rc17c-6, Sal).** Measuring the
stage at exploration found a fourth surface stating the old pointer: the editorial example in
`orbit-conventions`' `Internal-run JSON summary format`. All three of that requirement's canonical examples
were stale, because nothing read them. Sal: "why wait til audit-drift to fix something we see now? let's fix it
now." The stage refreshes the three examples and adds a test that executes each one, so `orbit-conventions` is
the fourth capability. This is declared under R-crc-9, following the rc07b, rc02b and rc17b precedents. The
charter text above stays as written: it named three capabilities, and the fourth is an addition, not a revision.

### Stage rc18-walk-is-next — a passed gate with an unwalked pass names the walk next

Depends-on: rc17a-invoked-coverage
Complete: [ ]

Declared 2026-10-07 (Sal) from rc17c's proposal cycle. rc17c's in-context verification passed the
`review-proposal` gate with three SUGGESTIONs. The gate row listed that pass under `unwalkedPasses`, while the
canonical next read `/orbit:apply`: the engine knew a walk was owed and did not say so. Sal: "even if there are
suggestions, i think the next recommended path should be an address-reviews". rc17a made SUGGESTION-only passes
DISCOVERABLE (D-bpc-15); this stage makes them the RECOMMENDED next while they stay unwalked. SUGGESTIONs still never
gate (rc02): the gate's verdict and the next phase's eligibility are unchanged, and only the recommendation moves.
Direction: one voice. When a reviewed gate has PASSED and its mode carries an unwalked pass, the canonical next is
`/orbit:address-reviews <change>`, and the phase command returns once the pass is walked. `orbit-engine-gates`'
`Single-voiced canonical-next computation` stands. Offering both commands on two lines was considered and is NOT this
stage's direction: it would reverse that ruling, which is Sal's to take. Measured before declaring: in a scratch copy
of rc17c's trail, a walk written after the passed gate's last pass left the gate `passed` and `unwalkedPasses` empty,
so walking cannot start a review loop. The capability count is the exploration's to measure (`orbit-engine-gates` at
least, plus every surface that reads or restates the next line). Goal G4.
Exit: (1) a change whose reviewed gate has passed, with an unwalked pass in that gate's mode, renders
`/orbit:address-reviews <change>` as its canonical next, and the gate's state still reads `passed`; (2) after that pass
is walked, the canonical next is the phase command again and the gate still reads `passed`; (3) an unpassed gate's
next is unchanged.

## Considered & out

- **Iteration grouping for parallel external passes** (the scaffold's c3-cadence-arithmetic;
  2026-09-11) — four-capability engine work to make two findings files for one prompt count
  as one iteration. Deferred: it occurred once, because a second reviewer was spawned in
  error; the handoff-phrasing half folds into rc03. Re-entry trigger: a second occurrence on
  any trail.
- **Finding-scoped freshness** (the re-cut's rc11; settled under R-crc-3, 2026-09-11) —
  moving the freshness rule from pass-level to finding-level is the riskiest engine change in
  the program, and R-crc-4 removes the loop it addressed by construction (nothing is reviewed
  after a walk except the walk's diff). Deferred. Re-entry trigger: an archive after rc03 ships
  whose readiness record's `accepted` residuals or gate override names freshness as the reason.
  (Field name corrected 2026-09-21: rc04a ships `judgements[].accepted`, never `residual_risk`.)
- **Rewriting rc02's convergence criterion as a decision table before applying it** (2026-09-14) —
  the medium is the right target (R-crc-7's authoring corollary says so) but doing it inside rc02
  would re-author the central requirement a fifth time and reset the review clock again, which is
  the behaviour R-crc-6 names. The criterion's prose has had its quantifier sweep, its task list
  already demands a test for every rule including the empty cases, and TESTS are the stronger
  falsifier from here because they persist. The table convention applies to rc02b and everything
  after. Re-entry trigger: a fifth pass, or an implementation, finding a further quantifier defect
  in the same requirement.
- **Splitting rc02 again on the byte overage** (2026-09-14) — rc02 closed at three capabilities (at
  the ceiling) and 51.3 KB (28% over the guide), with 19 tasks and 9 requirement blocks inside. No
  FINDING demanded a split: all seventeen in the final walk were repairs to mechanism already in
  scope. Splitting would move the same criterion into a smaller change where it would still be
  specified in the same medium, and R-crc-1 itself says capabilities predict cost better than bytes.
  The overage is recorded in the change's design rather than hidden.
- **Demoting the split-parent headings (rc13, rc04) out of the stage grammar** (2026-10-01) — rewriting
  `### Stage` to a non-stage record heading so the count moved 25 → 23 and the two headings stopped rendering
  `premised`. Rejected the same session in favour of the ended mark: `[~]` on `premised` is DEFINED by
  `orbit-architecture-engine` as declared-and-withdrawn-before-any-work, which is what a split parent is, and
  it costs no grammar edit, no count move and no marked-figure update. Re-entry trigger: a program that needs
  arc-done while Q-crc-29's "archived OR ended" sentence is still unlanded.
- **Fixing the cycle by adding reviewer classes or passes** (2026-09-11) — rejected on the
  data: findings per change grew as the machinery matured; the lever is what a pass is asked
  to do and when it stops, not how many there are.

## Status log

- **2026-09-11 — Created** at the first architect session, scaffolded from the D6 archive's
  evidence (seven-pass system cadence, 42 findings, gate override at archive; the two
  real-CLI grammar CRITICALs; three ripple-miss findings in one external pass; the archive
  emit table gap). Premise, goals, and four candidate stages are PROPOSED and unratified.
- **2026-09-11 — Second session.** The premise gained the measured evidence (both repos'
  trails parsed: findings per change 41 → 131 across the D-arc; later passes 60–100% on
  prior-walk files; `surface-parity-audit` 9 passes / 102 findings / no gate) and the three
  cycle mechanisms (freshness loop, prompts steering at fixed areas, unbounded severity).
  Two stages added as PROPOSED: c0-cadence-convergence (proposed FIRST — ladder by
  consequence, SUGGESTIONs never gate, the two-clean-passes stop rule, finding-scoped
  freshness, review vs verification genres, external first) and c5-artifact-hygiene (one
  voice for facts, propose-time size check, apply-time self-trace, executed commands). c3
  now depends on c0. Still no ruling spoken; candidate rulings put to Sal in chat.
- **2026-09-11 — Sizing review** (Sal asked, given prior stages proved too big): the six
  proposals calibrated against the archived stages' measured cost; a ceiling proposed (≤ 3
  caps / ~12 reqs / ~40 KB / < 20 tasks) and a seven-change re-cut recorded in the Sizing
  section — c0 split in three, c1+c4 merged, c3 cut, c5 split in two. Awaiting ratification.
- **2026-09-11 — Re-cut ratified in conversation.** Sal: "this is sounding good … bring this
  into the architecture; break it into small approachable chunks and be intentional about
  how they are ordered." R-crc-1 (the size ceiling) and R-crc-2 (the ordering principle)
  captured. The stage set re-cut to TWELVE small stages in four phases — stop the bleeding
  (rc01 instruments, rc02 gate semantics, rc03 review genres, rc04 cost visibility); move
  checking into tests (rc05 executable references, rc06 scenario-test map, rc07 artifact
  lint); reduce injection upstream (rc08 walk completeness, rc09 propose hygiene with the
  spike precondition, rc10 apply closure with the end-to-end run before archive); engine
  last (rc11 finding-scoped freshness, rc12 engine-owned choreography — the latter needs an
  explicit ruling reversing D-d6-7). The step-back suggestions folded in: executable
  references, scenarios as the test contract, consistency as a lint, in-context as
  verification only, capture-recapture residual estimate, review budget with recorded
  residual risk, spike before spec, dogfood before archive, cost visible in-flow. The Sizing
  section's content moved into R-crc-1; c3's grouping moved to Considered & out.
- **2026-09-11 — Cohesion review** (Sal asked, the plan having two parents). Ten open
  questions recorded with standing recommendations (Q-crc-1..10). The main seam: rc02, rc03,
  and rc04 each assume a different cadence; the standing recommendation is ONE canonical
  cadence — two blind reviews in parallel before any walk, one merged walk, one verification
  pass — which also removes the premise's freshness loop by construction. Secondary: stale
  goals, the rc01/rc05 exit split, dual ownership of `residual_risk`, rc03's exit metric,
  the rc06/rc10 map overlap, a vestigial rc09 dependency, a re-evaluation trigger for rc11,
  rc12's ceiling risk, premise residue. None applied; awaiting ratification.
- **2026-09-11 — Method delegated; all ten questions settled.** Sal: "I do not think I have
  the ability to drive code development workflow … I will defer to you." Captured as R-crc-3.
  Under it: R-crc-4 (the canonical cadence — blind pair → merged walk → verification;
  removes the freshness loop by construction), R-crc-5 (the CONDITIONAL reversal of D-d6-7,
  flagged as reversing a Sal-ratified ruling; effective only when rc12 is proposed and only
  for steps rc05 proves deterministic). Goals rewritten G0–G4; rc02/rc03/rc04 re-cut to one
  cadence; rc01's grammar exit moved to rc05; rc06 the map's sole owner and rc10 narrowed;
  rc09's dependency dropped; rc11 moved to Considered & out; rc12 to be explored as two
  changes; premise residue struck. ELEVEN stages remain. First stage to explore: rc01.
- **2026-09-12 — rc01 ARCHIVED; rc02 explored, proposed, reviewed, and SPLIT.**
  `rc01-instrument-fidelity` archived (the instruments now derive from a recorded real-CLI
  contract; one external pass found 3 CRITICAL that were all one mistake). rc02 explored to ten
  decisions and proposed as one change, then measured by its first fresh proposal pass at 40
  tasks against R-crc-1's under-20 ceiling, with two baseline capabilities outside its three
  (`orbit-orientation`'s CLOSED waiting set and `orbit-run-summary-emit`'s `gate_overridden`
  state enum) contradicted by the new sixth gate state — completing it honestly meant five
  capabilities. SPLIT under R-crc-3 (stage sizing is the authoring AI's) rather than taking an
  exception to a Sal-ratified ruling: rc02 keeps what the engine COMPUTES (severity-aware
  clauses, `blind-pair`, budget, schema v4 — the sixth gate state was itself reversed the same day,
  see the entry below); the new stage `rc02b-severity-ladder` takes what a severity MEANS (the
  consequence definitions, the `reproduction` evidence tax, its write-gate enforcement, and the
  address-reviews reader the original change lacked entirely). The same pass also found two real
  defects in the blind-pair design — clause (c) reads only the LATEST independent pass, so a
  CRITICAL in the earlier pair member buys nothing; and "the latest qualifying pair is taken"
  contradicts clause (a)'s greedy earliest-match walk, which can report a covered cadence as
  unpassed AND budget-exhausted at once. Both fixed in the walk. TWELVE stages now.
- **2026-09-12 — rc02's first external pass (GPT-5 Codex) found 3 CRITICAL, all in the blind
  pair.** The merged walk R-crc-4 prescribes has NO trail representation: an `address-reviews`
  record carries one `source_path` and `--from-file` is exclusive to one input, so a pair whose
  members both carried findings needs ONE RECORD PER MEMBER — rc02 had specified a trail the
  product cannot emit. A cadence-fixed confirming set also had no successor, so a CRITICAL in a
  pair could never be cleared and the gate could never reach `passed`. And nothing ordered a
  following slot's pass after the resolution records it exists to check, so the trailing slot's
  whole safety rationale was unenforced. All three fixed: resolution is per findings artifact and
  R-crc-4's "one merged walk" is named as one human SITTING, not one emitted record; the
  confirming set gains a SUCCESSION rule (a later independent pass strictly after the set's
  resolution records replaces it); slot ordering gains the resolution-record constraint. The pass
  also measured the trail the engine actually reads — of 526 archived resolution entries, 260
  carry `outcome`, 49 carry legacy `status`, and 217 carry neither — so clause (b) now reads both
  disposition keys and falls the whole record back to bare counts when any substantive entry has
  neither. R-crc-4's near-ceiling proposal pair is assigned to rc09, which owns the size
  computation it needs.
- **2026-09-12 — rc02's third proposal pass (fresh, read BLIND) found 3 more CRITICAL, none a
  repeat.** All three were one kind: a rule whose English reads as obviously right and whose formal
  content is vacuous, inverted, or narrower than the property it carries. Clause (b)'s replacement
  sentence quantified over an empty set, so a findings-bearing pass nobody walked read as resolved.
  A fail-safe rule compared the severity-BLIND `resolution_summary` counters against a
  severity-FILTERED entry count, so any walk deferring a SUGGESTION fell the record back to the bare
  rule and re-gated exactly what the stage exists to exempt. And the succession rule added that
  morning replaced a two-member confirming set with a single latest pass, reintroducing the
  which-member-finished-last dependency one paragraph after abolishing it. The shared cause is worth
  the ruling it did not get: each rule had been validated against the trail that motivated it and
  not against the trails the other rules produce. The response was SIMPLIFICATION rather than a
  fourth and fifth patch — clause (b) now asks ONE readability question of a record and has ONE
  fallback, which subsumed three fail-safe rules and two further warnings (a fourth on-disk
  `resolutions` shape that is a counter object, and the missing fail-safe on the severity axis).
  Coverage is restated as EXISTENTIAL (a greedy implementation must backtrack), succession is
  set-valued and iterated, and the budget's exhaustion TRIGGER is separated from its reported spend
  so an apply landing mid-cadence cannot report exhaustion during the re-cover the gate itself is
  asking for.
- **2026-09-14 — The diagnosis changed: this was not churn, and the fix is upstream.** rc02's four
  proposal passes ran 0C/9W/4S → 3C/7W/1S → 3C/8W/2S → 4C/9W/4S with ZERO repeat findings across the
  whole axis — so the premise's churn mechanism does not describe it. What was happening instead:
  each walk answered findings by inventing mechanism, and each pass correctly found defects in
  mechanism nobody had reviewed. Ten CRITICALs, nine of them in mechanism that did not exist when
  the exploration closed. Captured as **R-crc-6** (the walk authors nothing; three lanes, with
  redesign routing back to explore) and **R-crc-7** (explore produces mechanism to the fidelity the
  artifact demands; execute the procedure once before specifying it; specify procedures as tables).
  NEW STAGE **rc13-explore-mechanism** carries the fix at its root — the explore surface has no
  mechanism section, grades maturity by decision COUNT, and never asks the author to falsify. Four
  charters gained measured evidence rather than new scope: rc03 (blind review produced the zero-repeat
  result; execute-don't-read produced every CRITICAL), rc04 (the churn-versus-authoring diagnostic),
  rc08 (the three lanes), rc09 (the generalized spike). Two directions declined and recorded. Thirteen
  stages.
- **2026-09-14 — The sixth pass, and the first application of R-crc-6 to the change that produced
  it.** rc02's sixth proposal pass (fresh, blind, and told explicitly that zero findings was a
  legitimate outcome) returned 2 CRITICAL / 8 WARNING / 3 SUGGESTION, zero repeats, both CRITICALs
  in clause (c)'s succession rule — one leaving the change's own canonical cadence with no stated
  convergence, the other making a clean confirming set FINAL so a later independent pass carrying a
  CRITICAL never reaches the predicate, a strength REGRESSION against the shipped engine. Twelve of
  the thirteen findings were in walk-authored material; three were written within ninety minutes.
  Measured across all six passes: 72 findings, 13 CRITICAL, ZERO repeats — the reviewers were never
  grinding; the walks were authoring. Captured as **R-crc-8** (finding quality never licenses another
  pass; the redesign-lane trigger is SECTIONAL and measured per requirement) plus R-crc-7's
  blanket-default corollary (a convention that defaults unstated empty cases is not a specification —
  two of rc02's three were harmless and the third was the happy path). ACTED on rather than walked:
  clause (c) LEAVES rc02 for the new stage **rc02c-confirmation-semantics**, which will specify it as
  a decision table under R-crc-7 with the three measured problems as its premise. rc02 ships the
  shipped predicate unchanged, which is stronger than the rewrite it was carrying. Fourteen stages.
- **2026-09-14 — R-crc-8's first application, and two disciplines it exposed.** rc02's sixth pass was
  walked under the new ruling and the walk SHRANK the change for the first time: clause (c) left for
  rc02c, taking five scenarios and a whole task group, and rc02 now ships the shipped confirm
  predicate with one substantive-match edit — which on the trail that exposed the worst defect is
  strictly stronger than the rewrite it replaces. Every size figure fell. The other eleven findings
  were local repairs, and three residue dispositions were recorded rather than swept (five engine and
  body sites fixed in the change; `orbit-conventions`' external-slot sentence assigned to rc02b and
  `orbit-run-summary-emit`'s v3-scoped examples to rc02c, both stages already touching those
  capabilities). Two disciplines captured from the seam rather than from theory. **rc03**: when a walk
  resolves BY REMOVAL, the confirming instrument is a VERIFICATION pass over the diff, not another
  review — the gate reads a pass's immutable CRITICAL count and cannot tell a fix-in-place from a
  removal, so only the genre split makes the distinction available. **rc08**: a walk's edit set is
  applied so a failure cannot leave it partial, and each edit is verified against the artifact before
  the log records it; the same multi-edit-script habit cost seven unwritten edits earlier in the day
  and two more in this walk, and only a grep-based reconciliation ever caught it.
- **2026-09-14 — The first blind pair the repo has run, and what it measured.** rc02's system review
  ran two independent agents on one artifact state with no walk between them. Fresh: 1C/6W/5S.
  External (GPT-5 Codex): 4C/6W/0S [count corrected 2026-09-14 against the archived findings
  file; first written 4C/7W/0S]. **Zero CRITICAL overlap.** Four or five defects shared, seven
  unique to each half, residual estimated near 60% by capture-recapture. Every CRITICAL is in the
  engine this change shipped, and the fresh half's is the sharpest: the gate's own canonical next
  command steers the user into breaking the blind pair, because convergence runs resolution before
  coverage, so the moment a pair member lands with findings the recommendation becomes "walk it" —
  which forecloses the pair and spends the budget. It demonstrated itself live: persisting that pass
  made the gate recommend exactly that. R-crc-4 AMENDED — the pair is SPAWNED SIMULTANEOUSLY rather
  than packaged and awaited, because simultaneity makes blindness free instead of a discipline, and
  because it closes the window in which the gate can recommend the foreclosing walk. Also recorded:
  DISAGREEMENT between the halves is a first-class signal. The two contradicted each other once, one
  empirical test settled it in both directions at once, and neither half could have produced that
  resolution alone.
  **CORRECTION APPENDED 2026-09-14** (the log is append-only; the entry above stands as written):
  the wording "the pair is SPAWNED SIMULTANEOUSLY" overreached and was corrected the same day —
  R-crc-4 carries the corrected text. `external` means a CROSS-VENDOR handoff a human runs in
  another tool, and orbit running inside one assistant cannot spawn an agent of a different vendor.
  What the amendment actually holds is weaker and sufficient: both halves are IN FLIGHT on one
  artifact state before either is walked, and the blindness predicate enforces that mechanically
  rather than as a discipline. What should become one invocation is the LAUNCHING (rc03).
- **2026-09-14 — rc02 CLOSED, and the gate produced the signal the stage was built to produce.**
  The pair's findings walked to zero over two iterations. The external half's CRITICAL in iteration 2
  was the sharpest thing the cycle has caught about itself: the fence tracker written during walk 7
  remembered only the fence CHARACTER, so a four-backtick fence containing a three-backtick line
  closed early — and a findings-free document could therefore be admitted as a CLEAN EXTERNAL PASS.
  A parser bug that manufactures convergence is the exact failure class this program exists to
  remove, and it was introduced BY A WALK, one day after R-crc-6 was ratified for that reason. It is
  now one shared CommonMark tracker (`src/core/markdown-fence.ts`) behind both the report renderer
  and the external parser, and external findings require the full `### Title` / `**File**:` /
  `**Description**:` triple. Measured totals for the pair, stated once here so nothing restates them
  (rc07's one-voice rule applied to this log): fresh 12 findings (1C/6W/5S), external 10 (4C/6W/0S).
  **Then the archive.** `review-system` computed `unpassed` with `budgetExhausted: true` — 3 of 3
  independent passes spent, the latest carrying 1 CRITICAL, since resolved. Exit criterion 3 was
  satisfied literally: the seam REPORTED THE BUDGET SPENT rather than looping, and the archive
  proceeded through a recorded `gate_overridden` whose reason IS the budget-spent clause, not
  R-d-10's "no clean pass yet". Buying a fourth pass would have been exactly the behaviour R-crc-8
  prohibits. The spend stands as residual risk; rc04 owns replacing that override with a
  `residual_risk` record, which is the last thing keeping the sanctioned case and the prohibited one
  in the same field. Sync 10 blocks byte-verified, fingerprints 8/8, 2103 tests green. The three
  unchecked tasks are all user-validation handoffs: 7.4 and 7.5 were satisfied in-session and at the
  seam, 7.3 (issue #8) is an outward act and stays the human's.
  **Two process notes.** The pre-archive and project-wide audits both ran clean on every mechanical
  category — zero vocabulary residue (no archived delta has EVER carried a REMOVED or RENAMED
  section, so that category has never had anything to catch here), zero archive-coherence failures,
  zero consent-record gaps across 23 emits. Every finding either audit produced was DRIFT IN PROSE,
  which is where rc07's lint should be aimed. And of the six findings the project-wide sweep raised,
  TWO did not survive their own pushback — one was already owned verbatim by rc04's charter, one was
  already a ratified and tested rc07 follow-up. An audit that does not run pushback against the
  program's own declarations manufactures work; the walk is where that gets caught, which is the
  first evidence for R-crc-8 outside a review.
- **2026-09-14 — rc13 moved to phase 1, and it is the next stage.** Not an exception to R-crc-2:
  the stage had been filed in phase 3 by its MECHANISM (it reduces what propose injects) when
  phase 1's own criterion — "the cheapest, highest-lever changes to the cycle's own rules first"
  — describes it exactly. The general rule that falls out, recorded here rather than promoted to a
  ruling until it recurs: where a stage's mechanism and its leverage point at different phases,
  LEVERAGE GOVERNS PLACEMENT. Two things made the cost of the misfiling concrete. rc13's exit
  criterion 3 is measured on the next stage explored under it, so each stage run before it discards
  one measurement — filing it seventh would have thrown away six. And rc02 had already paid the
  bill the stage exists to prevent: six proposal passes, 72 findings, nine of its first ten
  CRITICALs in mechanism that did not exist when its exploration closed. Ratified by Sal on the
  recommendation surfaced in rc13's own charter, which had declined to take it unilaterally.
- **2026-09-14 — A delta cannot reach non-requirement baseline prose, and orbit tells authors it
  can.** Reported by an AI using orbit on another project: corrected contract notes placed in a
  MODIFIED delta's preamble were silently discarded at sync. Verified here BY EXECUTION against the
  compiled engine — a fixture whose delta changed both a preamble note and `## Purpose` came back
  with the requirement body replaced and both prose changes dropped, exit 0, no warning.
  `buildUpdatedSpec` parses the BASELINE for `before`/`preamble`/`after` and re-emits them
  verbatim, so BOTH sync layers drop delta prose — including the engine path C2 built as the guard
  for exactly this class of silent loss. Exposure here is total but latent: 0/20 baselines carry
  requirement-section preamble, 20/20 carry a `## Purpose`, and 0/77 archived delta files have ever
  carried either, so the behaviour is UNTESTED rather than established. The root cause is a
  contradiction, not a gap: `buildSpecSkeleton` writes "Update Purpose after archive" (direct
  baseline edit) while the address-reviews cascade OUT rule tells a walk to "add a delta … to
  capture this ripple" — and the second fires at the moment of need. Direction: declare
  non-requirement prose out of delta scope and WARN on discarded delta text, rather than making it
  deltable — `base_fingerprints` are keyed per requirement, so deltable prose would carry zero
  divergence detection and reintroduce precisely the data-loss class C2 closed. STANDING
  RECOMMENDATION: a new small stage (`rc14-delta-scope`), queued after rc13; the close-out half of
  the report (a task cannot assert post-sync baseline state, because sync runs at archive after
  apply) is one sentence in rc10, which already owns user-validation tasks as a pre-archive
  condition. A GitHub issue is drafted and its filing is Sal's.
- **2026-09-14 — `orbit/lenses/` does not exist here, so three review instruments have never run.**
  Surfaced by the project-wide audit and recorded for residency rather than treated as drift, since
  every one of them degrades BY DESIGN: system-mode review Passes 4 (perspective reviews) and 5
  (critical-path scan) skip when the lens files are empty or absent, and audit-drift Category 2
  (lens staleness) does the same. The design is sound; the observation is that across roughly
  thirty review passes in this repo nobody noticed that two of system review's seven passes and one
  of audit-drift's six categories do nothing on every run. A graceful skip is indistinguishable
  from a pass that ran and found nothing unless the report says which it was — and the skip notes
  are loose-form prose, not a counted field. No stage owns lenses today. The question worth putting
  to a stage is not "should we write lenses" but "should an instrument be allowed to report itself
  as having run when it did not", which is rc03's genre territory (a pass that cannot run is not a
  pass that was clean) and rc04's measurement territory (a skipped pass should be visible in the
  cadence line). Left as a standing observation; no ruling, no stage assignment.
- **2026-09-15 — rc03a-blind-prompt SPLIT from rc03, because rc13's exploration found the blind
  pair is not blind.** R-crc-7 applied by hand to rc13's own exploration produced five executed
  cases; three found defects in SHIPPED, ARCHIVED rc02 mechanism, none reachable by reading the
  specification — which is what rc02's six proposal passes were doing. The one that forced a stage:
  `orbit-review-external`'s `Cycle context populated from prior runs` requires every external
  prompt to carry prior open internal findings, and the gate's blindness predicate checks only for
  a WALK between the two tokens. So following the engine's OWN recommendation — an empty
  `blind-pair` slot renders `--fresh` first — lands the fresh half, feeds its findings into the
  external half's prompt, and the gate certifies the anchored pair as blind. rc02's pair escaped by
  ordering luck alone: its external prompt was written 24 minutes before the fresh pass existed and
  recorded "Prior internal findings still open: 0". The one measurement this program has produced
  survives because the operator did not do what the tool said. TWO FURTHER DEFECTS are recorded in
  the exploration and not yet assigned: a merged blind-pair walk is unrepresentable
  (`TrailResolution.sourcePath` is singular, so obeying R-crc-4's one-walk rule strands the second
  half unresolved — rc02's own pair was split into two emits one second apart by the collision
  bump), and walk DISCOVERY uses a private most-recent-by-token rule where the gate's own
  `passResolved` predicate already defines what is outstanding.
  **Why a split rather than folding it into rc13**: R-crc-1. rc13 already touches three
  capabilities and this adds a fourth, and the ruling is explicit that a proposal over the ceiling
  is split before review, never reviewed as one. Also because Case 5 changed what the fix IS — one
  grep moved it from a two-line prompt tweak to a conflict between two archived requirements, whose
  real question is what a review prompt owes a reviewer as a function of what kind of pass it is.
  rc03 already owned that territory; rc03a is its first and most urgent slice, rc03 now Depends-on
  it, and rc03's exit criterion (3) was NARROWED to inherit rather than restate a smaller version
  of it. EXPLICITLY REJECTED: running rc13's own pair external-first by hand, the way rc02 escaped
  — a stage whose thesis is that disciplines fail where affordances work cannot rely on a
  discipline to produce its own evidence.
  **Method note worth keeping**: the charter's own stated diagnosis did not survive its evidence.
  It said rc02's exploration carried "zero worked mechanism"; that exploration carries dense
  mechanism and never executed a line of it. A Mechanism section — rc13's charter's own first
  proposal — would have been FILLED by rc02 and changed nothing. The target is UNEXECUTED
  mechanism, a harder problem, and the charter's cure was vulnerable to the charter's own critique.
  That correction is itself the first evidence that executing beats specifying.
- **2026-09-15 — rc03a's mechanism REPLACED after two fresh passes, and the stage no longer touches
  the capability it began as.** Ten CRITICALs across two proposal iterations, zero repeats. The
  first pass killed the premise (the external-handoff branch makes no `orbit status` call, so
  "the call it already makes" was false) and the second killed the signal: `next_hint_keys.slot` is
  scoped to the FIRST UNPASSED gate rather than the reviewed mode, and the empty-pair branch a
  non-leak proof rested on sits downstream of the resolution clause, so "pair empty" does not imply
  "slot rendered". Neither is repairable by conjunction.
  **What finally worked was an enumeration nobody had done.** Two proposal passes shipped a claim
  to close "every channel" without ever listing the channels. There are ELEVEN, and the eleventh —
  the launching brief — has no artifact to edit. Every one is the same instruction wearing
  different clothes: read the change's own history. Deny-listing that is a chore that rots; ORDERING
  empties it. An external prompt composed while the trail holds no pair member has nothing of its
  partner to carry. Six channels close at once, with no prose change at all.
  **Three things this cost, recorded because they are the stage's real content.** (1) External-first
  was REJECTED TWICE before the enumeration — as "a discipline, not a fix" and as "obsoleted by
  D-rc13-4" — and neither argument survived a list of sites. Reasoning about a mechanism's SHAPE
  instead of reading its SITES is the failure this program keeps finding, now at three levels: in
  rc02's exploration, in rc13's charter, and in rc03a's own two shapes. (2) The property the stage
  was chasing — blind to ALL PRIOR HISTORY — was its own invention, not R-crc-4's "blind to each
  other", and was the direct cause of the eleven-channel problem: blinding a pair to each other is a
  TIMING fact, while blinding it to all history is censorship with no closed boundary. A requirement
  harder than its ruling could not be met. (3) The third walk FALSIFIED ITS OWN EVIDENCE: the
  enumeration case claimed ordering retires the launching-brief channel, and it does not, because
  the orchestrator holds the external findings when it dispatches the fresh half. That claim was
  written in the same sitting as the correct enumeration — an enumeration protects nothing about the
  prose wrapped around it.
  **Two workflow gaps assigned**: rc13 gains the explore RE-ENTRY case (R-crc-6 routes redesign back
  to explore, but a promoted name has no staging directory, so Mode B would scaffold a second
  `explore.md`; rc03a hit this twice and resumed in place by judgment both times), and rc08 gains
  WALK DISCOVERY (bare `/orbit:address-reviews` is a whole-repo marker scan with no anchor, so with
  one active change carrying two unwalked passes its defined behaviour is a clean exit).
  **Also corrected**: the charter's `gates.ts:113` citation for the fresh-first default — that case
  in `commandForClass` is unreachable, because `canonicalNextForReviewed` intercepts at 868 and
  returns at 878.
- **2026-09-15 — rc03a WITHDRAWN and folded into rc03, after three independent passes and no
  shipped fix.** 15 CRITICALs, ZERO repeats, three mechanisms, two redesigns, budget spent 3/3. The
  conflict rc03a was split out to resolve is real and remains open; every mechanism proposed for it
  failed, and the stage's deliverable turned out to be the evidence rather than the fix. rc03 now
  owns the conflict and starts from that evidence: the state space has TWO entries and the leaking
  one is the OPEN-pair branch that every attempt left alone; the channels number twelve including a
  `git log` whose commit subjects carry finding counts and a launching brief with no artifact; the
  property is R-crc-4's "blind to each other", not the unbounded "blind to all history" rc03a
  invented for itself; ordering is a real partial mechanism; and the fix is ATTESTATION rather than
  prevention. The citing change archives WITHOUT SYNCING — its deltas describe a mechanism nobody is
  implementing, and writing an unimplemented requirement into baseline is the silent-drift class C2
  exists to prevent.
  **The transferable lesson, and it is about the rulings rather than the stage.** Attestation — the
  mechanism that would make blindness CHECKABLE instead of promised — was identified in the first
  exploration and deferred three times, every time on R-crc-1 ceiling grounds: it needs
  `orbit-run-summary-emit` and `orbit-engine-gates` on top of the stage's own capabilities. Each
  deferral bought a cheaper prevention mechanism, and each cheaper mechanism was found wrong by the
  next pass. The ceiling is right and R-crc-1 is not in question — a stage over three capabilities
  DOES cost 12-17 passes. But "the correct fix exceeds the ceiling, so ship a cheaper one" spent
  three passes and shipped nothing, which is worse than either building it or not starting. The
  missing rule is about what a stage does when its correct mechanism is over the ceiling: SPLIT THE
  MECHANISM, or DECLARE THE STAGE BLOCKED ON ITS PREREQUISITE — never substitute a cheaper mechanism
  for the one the problem needs. STANDING RECOMMENDATION, not a ruling: R-crc-1 gains that
  corollary, or R-crc-8 gains a companion for the pre-review side. Ratification is Sal's; recorded
  here rather than written into the rulings index because it is a priority rule, and priority is
  his under R-crc-3.
  **Also recorded**: rc03a's own third walk showed the counting hazard from the other side. Its
  resolution log wrote eleven entries for eleven findings — complete by COUNT — while five titles
  were paraphrases, so clause (b)'s coverage check correctly reported the pass unresolved. A record
  can look complete and be incomplete by name; the discipline is that a walk echoes each finding's
  title byte-for-byte.
- **2026-09-15 — rc13 RE-AIMED after it falsified its own cure, and R-crc-9 ratified.** The stage
  had proposed a Mechanism section carrying an EXECUTED CASE. rc03a carried exactly that from its
  first exploration onward, would have rendered Mature under the original exit criterion 1 at every
  point, and failed three times. An executed case shows ONE PATH through a rule, and none of rc03a's
  three failures were on a path anyone walked. The unit moved up a level to a CLOSED ENUMERATION per
  rule — which also dissolved the trigger question the stage could not answer across two sessions,
  since a Decision stating a conditional has a domain and nothing needs to be self-classified.
  **The move set is SIX, DERIVED from the structure of a mechanism rather than listed** — facts
  (READ), domain (ENUMERATE), the parts' mutual consistency (COHERE), computation (EXECUTE), purpose
  (FALSIFY), context (CONFORM) — and two of those already existed as rulings that nothing enforced
  at explore time. The derivation earned its keep inside the hour, in the way that is the stage's
  own argument: a FIVE-move set was ratified, no sixth could be named on request, and then
  classifying rc03a's fifteen CRITICALs found FOUR that landed nowhere. COHERE — a mechanism's own
  parts assuming incompatible things — was the most-recurring class on the record and had no name.
  Confidence about closure was wrong twice in one sitting, and the sixth move was found by
  CLASSIFYING A RECORD rather than by thinking harder. Exit criterion 3 now names the three classes
  that account for eleven of rc03a's fifteen.
  **R-crc-9 RATIFIED** (Sal) into the rulings index — when the correct mechanism exceeds R-crc-1's
  ceiling, SPLIT it or DECLARE THE STAGE BLOCKED; never substitute a cheaper one. It binds
  immediately: rc13 sits AT the ceiling at three capabilities, none droppable, and the charter now
  says that if review shows it OVER, the answer is to split rather than shrink.
  **rc03a left UNRATIFIED, deliberately** (Sal). Its exit criteria were never met and never will be,
  so ticking `Complete:` would assert something false. The consequence is a readout that renders
  awaiting-ratification indefinitely for a stage that is finished — the first withdrawn stage in the
  program, and the grammar has no third state for it. Left as a known gap rather than papered over
  with a mark that means the wrong thing.
  **Leverage-governs-placement stays in the log** (Sal) — one firing, on rc13, and no pending
  decision depends on it. Promote if a second stage is misfiled the same way.
- **2026-09-15 — rc13 SPLIT into rc13a + rc13b: R-crc-9's first application, hours after it was
  ratified.** Two proposal passes, 48 findings, 12 CRITICALs, zero repeats. The second pass found
  the change was a FOURTH capability wide with no delta for it — `orbit-emit-composition`'s
  computed-extensions requirement enumerates exactly which explore fields the surface computes and
  names the four-state grid, and this work falsifies both — and that a task swept a `propose.ts`
  site governed by a FIFTH capability the proposal declared untouched. The correct mechanism needs
  an entry grammar, a decision-ID slot, a parser and two more deltas. That is over the ceiling, and
  R-crc-9 says SPLIT or DECLARE BLOCKED, never substitute a cheaper mechanism.
  **The seam is FORMAT versus ENFORCEMENT, and it is a DEPENDENCY rather than a compromise.** The
  engine half was never buildable first: a proposal pass traced the parser `rules_open` would
  require and found nothing to key on — the Decisions section defines no identifiers and the
  Mechanism entry has no stated boundaries. rc13a ships the format that makes a rule checkable;
  rc13b ships the readout that checks it. D-rc13-10 had argued the emit change was not droppable
  because the convention is ADVISORY without it, and that is true and now STATED as the interval
  rather than hidden — it is the sequence, not a concession.
  **Why this is not rc03a repeating.** rc03a substituted a cheaper MECHANISM three times and shipped
  nothing. Here the correct mechanism is kept whole and sequenced. That distinction is precisely
  what R-crc-9 was ratified to make available, and it was available within a day of costing a stage.
  **What the stage established, carried into rc13a as evidence rather than rhetoric**: an executed
  case shows ONE PATH, and eleven of rc03a's fifteen CRITICALs were READ/ENUMERATE/COHERE failures
  with ZERO in EXECUTE. And the move set's own history is the argument: five ratified, no sixth
  nameable on request, classification found COHERE; six ratified, classification of a second record
  found FEASIBILITY and CONSUME; eight ratified, a pass hunting a ninth found one in this stage's
  OWN Case 8 — a mechanism correct, complete and NEVER INVOKED, landing outside all eight. Three
  times confidence about closure was wrong, and every correction came from CLASSIFYING A RECORD
  rather than thinking harder.
  **Also inherited by rc13b, because the first shape claimed to close it**: ENGINE-COMPUTED does not
  remove self-classification, it RELOCATES it from the payload to the file. The engine sees the rules
  an author declared; a rule never entered yields an empty gap list and the top rung asserts. The
  loophole is reachable by OMISSION, and the requirement must say so.
- **2026-09-15 — rc13a's first attempt ARCHIVED without shipping, and the stage stays open.** Three
  independent passes — two fresh, one external (GPT-5 Codex) — 55 findings, 17 CRITICALs, ZERO
  repeats across the whole axis. The archived change is the record of an ATTEMPT; the stage is not
  done and a later change may cite it again. The cadence was working throughout: the change kept
  being wrong in NEW places, which is the signature this program produces rather than the churn G0
  describes.
  **The prerequisite the next attempt settles first.** The requirement said every live rule carries a
  CLOSED enumeration while defining BOUNDED as "the domain is open" — so an author could name a
  partial list plus a residual and satisfy the obligation that exists to stop an open domain reaching
  propose, and rc13b would have no honest basis for treating `Closure: BOUNDED` as closed. Worth
  recording HOW that happened, because it was not carelessness: the move set was declared BOUNDED
  deliberately, to be honest about its own openness, and the honesty was real. The WORD was
  load-bearing in the opposite direction. Three internal passes did not catch it and an external one
  did, which is the clearest argument for the external slot this program has produced.
  **Not synced, deliberately**: writing a format whose closure vocabulary contradicts itself into
  baseline would hand rc13b a requirement it cannot read. rc13b is now explicitly BLOCKED on rc13a
  under R-crc-9's declare-the-stage-blocked branch.
  **Two SECOND OCCURRENCES recorded as program questions rather than fixed in passing.** Q-crc-11:
  the stage grammar has no WITHDRAWN state, and rc03a and rc13a will both render "awaiting
  ratification" forever because their criteria were not met and the mark would assert something
  false. LEFT AS A QUESTION (Sal) — annoying is not wrong, and two instances cost only a confusing
  readout; revisit at a third. Q-crc-12: the archive seam fired no prompt for an exhausted budget,
  twice in one day, because Step 3.4 watches `review-system` while the exhausted gate was
  `review-proposal`, whose `before` is apply. ASSIGNED to rc10 (Sal) and written into its charter as
  a third exit criterion. One occurrence is a gap; two in a day is a pattern, and the distinction is
  why one was assigned and the other was not.
  **rc13a left UNRATIFIED** (Sal), like rc03a: its exit criteria were never met, so the mark would
  assert something false.
- **2026-09-15 — R-crc-10 ratified, the premise reframed, and BOUNDED settled in one sitting.**
  Three things, and the order matters because each is the reason for the next.
  **The premise now says what this program is FOR**, which it did not: orbit adapts a development
  workflow to how its owner thinks and to how AIs in different forms drive work, and this program is
  where that adaptation is stress-tested — so digging in and failing IS the product, and the
  breakages export to other projects. rc03a and rc13a shipped no baseline and their trails are the
  evidence base for four rulings. A stage is judged by what its cycle taught and recorded, not only
  by what it merged. With the distinction that makes the claim usable rather than consoling:
  FAILING IN A NEW WAY IS THE PRODUCT; FAILING THE SAME WAY TWICE IS THE SIGNAL TO CODIFY.
  **R-crc-10 is what the repeat earned.** Mechanize only what the engine can observe: name the
  inputs, and if any is prose, intent, or a judgment about substance, the deliverable is a RECORD
  rather than a CHECK. rc02 shipped because its inputs were trail records, tokens and counts. rc03a
  spent three passes trying to make the gate see what a reviewer had READ; rc13a spent three trying
  to make the emit judge whether an enumeration was CLOSED. Both were visible on day one under this
  test and neither was caught until an external pass. The ruling complies with itself — whether
  inputs are observable is a judgment, so nothing checks it; rc09 carries only the QUESTION, as a
  design.md slot a human judges.
  **BOUNDED then settled in a single sitting, and cheaply, BECAUSE of the ruling.** The obligation is
  ACCOUNTED, not CLOSED: no domain may be open silently, and both closure and declared-openness
  discharge that. A residual names its KIND and its METHOD or discharges nothing. The tier difference
  is VISIBILITY, never blocking — rc02's `budgetExhausted` shape, and the reason authors will not
  fake closure to proceed. The test was run against every bounded claim on the record and REJECTED
  one of the previous attempt's own two residuals. All of it is a record; nothing asks the engine to
  judge prose, which is why the previous attempt could not build it and this one can.
  **And the recursion was closed deliberately** (D-bcs-5): "is the kind-and-method test itself
  closed?" is NOT pursued. The move set went five to six to eight to nine by exactly that route, and
  naming the stopping point is the discipline the day's two failures bought.
- **2026-09-15 — rc07 re-cut and rc07b declared: R-crc-9 fired PREVENTIVELY for the first time.**
  The ruling's first application came after two proposal passes and 48 findings had proved a change
  too wide. This one fired at EXPLORATION, before anything was written, on a charter that had carried
  both halves since it was drafted — nothing new made the split visible except applying the test on
  purpose. **A ruling that only fires in post-mortem costs a stage every time**, and this is the
  first evidence it need not.
  **R-crc-10 also fired at exploration, and it decided rc07's shape rather than auditing it.** The
  engine can see a NUMBER in prose; it cannot see that the number is a RESTATEMENT or which source it
  restates. So rc07 is a RECORD the author writes (a marker naming a source) plus a CHECK against
  DECLARED links only — and its exit criterion is restated from "a restated figure" to "a MARKED
  figure", because an unmarked one can never fail anything and promising otherwise is what R-crc-10
  forbids. The charter's own wording had said it all along: prose POINTS AT IT.
  **The domain is the WHOLE PROJECT**, ratified by Sal: `orbit/` is the package's working directory,
  not the boundary of what must stay true. Three of the four restated-figure defects this session
  produced were in `CLAUDE.md`, which no validator reads — a lint scoped to `orbit/` would have
  caught one of four and reported itself clean. It closes three ways, all SOURCED: files over
  `git ls-files` minus DECLARED exclusions, sources over a registry file, markers by grep.
  **And the exclusions forced a principle worth keeping beyond this stage: the lint reads LIVING
  documents, never RECORDS.** A figure in an archived change or an emit was TRUE WHEN WRITTEN, and
  linting it would demand rewriting history to match the present — which inverts what a record is
  for. Fixtures, templates, generated surface and superseded files follow the same logic, and
  living-versus-record is decidable BY PATH, so no judgment is asked of the engine anywhere.
  **rc07b is the cleanest worked contrast R-crc-10 has**: same charter sentence, and every one of its
  inputs is engine-owned — the reference text, the payload table, and the surface's own accept/reject
  on a submitted payload. Its origin is exact: rc01's parity test compares FIELD SETS, so it recorded
  the audit-drift gap as a `KNOWN_DIVERGENCE` exemption, and that let a ratified follow-up describe
  the engine as "accepting a third shape" when the truth is a HARD REFUSAL. A comparison cannot tell
  a divergence from a refusal; running it can.
- **2026-09-15 — "drop this" becomes a first-class exploration outcome (Sal), captured into rc13a
  and rc13b.** Verified before capturing: NO explore path defines a no-change outcome — the only
  exit from an exploration is promotion to a change, and `Considered & out` rejects options WITHIN
  an exploration, never the exploration itself. And the maturity grid cannot express it: Early and
  Stalled say keep exploring, Mid offers propose, Mature asserts readiness. **Every rung points at
  continuing or building.** An exploration that has decided not to build must fight its own readout
  to say so.
  That is the same defect as the top rung asserting readiness on heading count — a readout asserting
  a direction the evidence does not support — and it sits in the one surface whose job is to help
  decide WHETHER to build.
  **The program layer already had the concept and the exploration layer did not.** rc11 was moved to
  Considered & out with a re-entry trigger, and that is recorded as a good outcome. rc13a now gives
  an exploration the same words: a CONCLUDED decision with its reason, a status-header flip, a
  re-entry trigger naming what would reopen it, and a home for the staging directory so concluded
  work is a record rather than clutter. rc13b gains the fifth rung that reads it and recommends
  NEITHER explore nor propose — the only rung pointing at nothing, which is the point of it.
  **Evidence from this day.** Two stages ran full propose-review-archive cycles and shipped nothing.
  rc13a's own second attempt might have concluded at EXPLORE — R-crc-10 would have told it to — but
  there was no way to say so and have the workflow agree. Dropping at explore costs one sitting;
  dropping at archive cost three passes, twice.
  **Captured into two existing stages rather than a third**, because the declaration is convention
  (rc13a's subject) and the readout is rc13b's, and a third stage editing the same two capabilities
  is how a requirement ends up with three owners. Worth keeping the irony: the fix for building too
  much would itself have been a new stage if nobody was watching. R-crc-10 shape throughout — the
  author DECLARES, the engine RECORDS; nothing judges whether an exploration should stop.

**2026-09-17 — rc07's charter amendments applied; four open questions opened from its blind pair.**
An architect session against the shipped change. FIVE factual amendments to the rc07 stage
declaration, each recorded in the change's own charter-divergence table before it was made here:
`Touches` corrected to one NEW capability plus a MODIFIED `orbit-architecture-engine` (the latter
unforeseen, added two walks into the proposal cadence); the "and audit-drift" clause struck; exit
criterion (3)'s "live commands" corrected to ENGINE SOURCES (there is no shell field, deliberately);
the "61 today" file-domain figure removed rather than updated, because an incidental total is one
more instance of the defect the stage exists to stop; and the `stages = 17 (2 markers)` coverage
example made schematic, since a charter illustrating an output format has no business pinning the
value that output computes.

FOUR open questions opened, three of them from rc07's system-mode blind pair (one `fresh`, one
external GPT-5 Codex, zero CRITICAL overlap): Q-crc-13 records the DEFERRED finding that
`orbit-architecture-engine`'s opacity contract is false of the shipped parser API, and names the
consequence — rc07's `review-system` gate cannot compute passed while a substantive deferral stands.
Q-crc-14 records that the lint ships with no trigger: nothing in the repo runs it at the moments the
four motivating defects were written. Q-crc-15 records that the engine carries two fence grammars
and one is wrong. Q-crc-16 records that THIS doc states its own stage count twice, unmarked, and
supersedes rc07 task 5.5's recommendation to write a new current-state sentence — the doc already
has a living one, so marking it is the move, coupled with deleting the stale header blockquote.

`rc03a-blind-prompt` was offered for completion ratification and DECLINED (Sal): the stage was
withdrawn, so ticking the box would assert criteria it never met. That is Q-crc-11's case, now
observed a third time.

**2026-09-18 — rc07's deferred CRITICAL repaired; a walk-record defect found by hand.**
Q-crc-13 closed: the `orbit-architecture-engine` opacity contract was repaired as PROSE inside rc07
rather than deferred or routed to a new stage, after the earlier "this is a redesign" framing proved
over-broad. The lesson recorded with it is about DEFERRAL, not the defect: a finding in an
UNARCHIVED delta is not residual risk, because the delta syncs into baseline at archive.

Then Q-crc-17, which is the sharper one. Asked whether the last review had actually been walked, I
checked against the gate's matching key instead of the record's own counts and found that rc07's
fresh-half walk log matched zero of its six substantive findings — hand-retyped titles. The fixes
were real; the record certified nothing. No check caught it and the gate's reason line could not
have, because coverage is evaluated before resolution. The corrected record supersedes; the
mechanism that would have caught it is recorded for a stage that can review it.

**2026-09-19 — Q-crc-15 measured, and its document half fixed.**
Running both fence grammars over all 308 tracked markdown files turned a vague "the engine carries
two grammars" into something actionable: they disagree on 5 files and 382 of 52,805 lines, and the
heuristic is wrong in BOTH directions — it rescued a malformed spec whose 24 requirements were
sitting inside an unclosed fence (rendering as a code block on GitHub), and it mis-parses a
CORRECTLY authored document, letting seven lines escape a four-backtick fence. The malformed spec
is now fixed, verified inert to the parser. The remaining work is sized as a small change rather
than a stage. The lesson generalises past this item: "two implementations of one grammar" is a
claim about RISK, and the cheap way to price it is to run both over the real corpus and count.

**2026-09-20 — rc07-artifact-lint RATIFIED complete; the stage's own lesson applied to this log.**
All three exit criteria met, and criterion (1) was demonstrated LIVE rather than argued: at archive,
the moment the sync moved baseline capabilities 20 → 21, the change's own lint failed on
`CLAUDE.md:109` because the marked span still read 20. A stage catching the exact defect class it
was built for, on its own archive, in the one place nothing else would have looked. Criterion (2)
holds under the preamble's self-measurement rule — across six passes, zero findings concerned a
MARKED figure disagreeing with its source.

Worth recording that the two count errors reviewers DID find this cycle (a design table saying
"four failures" above a five-member union, and Q-crc-15's own sizing sentence claiming three files
when the answer is four) were both UNMARKED figures. That is the declared residual operating
exactly as specified, twice, inside the cadence of the stage that declared it — which is better
evidence for the residual being real than any argument for it.

This stage also archived with `independentSpend: 4` against a budget of 3, passing because clause
(c) is `findings-resolved`. PASSED therefore means every finding is resolved, not that a clean
independent pass stands on the final tree. The distinction is recorded as residual risk in the
archive emit. **rc04 still owns replacing that shape of record with a `residual_risk` field**, and
this is now the second stage to need it.

**2026-09-20 — Q-crc-16 closed; this doc now carries a live mark.**
The header blockquote is gone and the Program stages preamble's count is marked. Both halves landed
together because either alone reproduces the defect: a marked figure beside an unmarked stale
duplicate. The mark was perturbation-tested (a nineteenth stage makes it fail) and checked against
the self-reference hazard (it sits above the first counted heading). The program doc is now the
second marked document in the repository, which is the first evidence that `orbit-source-lint`
works on something other than the file it was dogfooded in.

**2026-09-21 — R-crc-11 recorded; the program reworked around it.**
Sal restated what the program is for, and the restatement reversed an assumption every earlier
ruling had made without writing it down: the cycle is optimised for ALIGNMENT, not for cycle cost.
The clearest evidence that the old premise had gone wrong is that **G1 was falsified by work the
user judged successful** — it bounded a cadence at three passes, or five with one CRITICAL, and
declared itself falsified by a fourth; rc07 ran four independent passes plus an in-context one,
carried CRITICALs in three, archived through the program's first computed-passed system gate, and
was ratified complete. G1 is rewritten to end in AGREEMENT rather than convergence.

The rework reached five other stages, and two of the connections were not visible before. **rc13b
turns out to have the same defect on a different surface**: its charter says the maturity grid must
stop asserting readiness from heading counts, while R-crc-11 says the cadence must stop asserting
convergence from pass counts — one disease, two proxies standing in for a judgement nobody
recorded, and the remedy is the same shape in both places. And **rc02b becomes load-bearing for a
rule it did not know about**: R-crc-11(b) has the AI deciding what to fix now versus what to route
to architecture, and severity-by-consequence is the only vocabulary the program has for making that
call defensibly.

rc04 is re-chartered from `cost-visibility` to `readiness-record` and renamed, with its boundary
against rc02c drawn in the charter rather than left to be discovered: the predicate is computed,
the record and the judgement are recorded, and the predicate may read the record's existence but
never its content. Two open questions carry what the rework could not settle — what becomes of the
cost figures (Q-crc-18) and whether `budget` stops being a gate input (Q-crc-19, a ruling-level
call, raised not taken).

Worth recording as evidence rather than anecdote: adding R-crc-11 moved the ruling count and
`orbit validate --sources` went red on CLAUDE.md's marked span within seconds — the third time in
two days that rc07's lint has caught live work, and the first time it caught an edit to the
architecture doc itself.

**2026-09-21 (later) — R-crc-11 gains (h) and (i); the recorded cost shape is ratified.**
Sal amended the ruling with the half I had got wrong: cost is not a constraint, but it IS worth
RECORDING — passes, walks, effort — because it is the evidence base for developing orbit and for
seeing what the dev flow actually does. Measure-versus-target, with both halves load-bearing.

Two findings came out of testing that rather than asserting it. **Effort is already recorded and
merely unread**: a full profile for every archived change — passes by class, walks, findings per
pass, elapsed — was derived from existing `.orbit-runs/` trails with no instrumentation at all, so
the deliverable is a reading surface rather than a recording obligation. And the first reading
already produced a diagnostic: **findings-per-pass going back UP is the signature of a walk having
invented mechanism.** Converged changes are monotonic (`c1: 5,0,0,0`); ground ones oscillate
(`rc07: 12,8,5,10,5`, where the jump at pass four is an external reviewer finding defects in code
the previous walk had just written). Nothing in the tooling said so at the time.

The cost shape was ratified with its provenance inside the unit, and with the asymmetry written
down rather than discovered: walks run in-context by design, so the most expensive activity is the
least measurable, and an all-`unavailable` walk column must never be read as "walks are cheap".
Tokens are named as the field this ruling will be tested on, because it is the most targetable
number a development process can hold.

This is the third write-only record found in two days — `gate_overridden`, the residual in a
`warnings` string, and now the effort profile. **Orbit is better at writing records than at reading
them.** Recorded as an observation rather than a ruling; a fourth instance would earn one.

**2026-09-21 (later still) — Q-crc-19 resolved: `budget` is demoted to a recorded figure.**
Sal ratified the lean. The SPEND survives as effort under R-crc-11(h); what stops is the spend
COLOURING THE GATE — `budgetExhausted`, the distinct position token, and the budget clause in the
reason string. The reasoning is that `budgetExhausted` is target-shaped by construction: it says
"you have spent too much", which is the single thing R-crc-11(h) forbids a record from saying.

It resolves against evidence rather than argument. rc07 ran a FOURTH independent pass over an
exhausted budget, and that pass was the most valuable of its five — it validated the format change
the previous walk had made, confirmed the migration fails loud rather than silently, and named the
root cause that four rounds of patching had missed. The only cost of running it was a readout line
saying `4 of 3`, and the only effect of that line was to make a good decision feel like a
transgression. That is R-crc-11's distortion, observed in the wild, in the stage that triggered
the whole reframe.

**This partially reverses rc02, which is archived, complete and user-ratified**, so the reversal is
recorded in rc02's own stage section as well as here — a reader arriving at that stage should not
have to learn it somewhere else. The reversal is NARROW: one signal. The blind pair, the
substantive-only resolution, the cadence slots and `assignCadence` all stand, and R-crc-11 PROMOTES
the blind pair from a coverage device to the program's central mechanism. rc02c carries the
implementation, and inherits one genuinely open fork the direction does not settle — whether
`budget` leaves the schema grammar (a version bump, migrating every declaring schema) or stays as
an inert declaration the gate no longer consults.

**2026-09-21 — the Q-crc-19 schema fork settled: `budget` stays, with a job.**
Sal chose the inert-declaration path over removing `budget` from the grammar, which avoids a schema
version bump and a migration of every declaring schema for no behavioural gain. Settled under
R-crc-3 in the same breath: an inert field that LOOKS live is a landmine, and this program has
spent two stages on that exact defect, so the retained declaration is given a job instead of being
left vestigial. `budget` becomes the cadence's DECLARED EXPECTATION — what a pair plus one repeat is
expected to cost, useful at the moment a schema is authored — while effort records what it actually
cost, and NOTHING compares the two automatically. That gap is the point rather than an omission: a
declared expectation informs an author; an automatic comparison against it is a target, which
R-crc-11(h) forbids. The spec has to say so plainly, because a reader who finds `budget: 3` and
assumes it constrains something is the failure mode this choice creates.

**2026-09-21 — the first measurement off R-crc-11(h)'s evidence base, and it is about PROPOSE, not review.**
Sal's standing surprise — how many issues turn up in reviews that the original propose/apply did not
address — is now quantified from the trails. **The first INDEPENDENT look at applied work finds a
mean of 5.3 substantive findings, 1.3 of them CRITICAL, across fourteen archived changes. It has
never once been zero.** Range 1 to 10, with the two worst being the two most recent design-heavy
stages (rc02 at 10, rc07 at 10). An earlier cut of this number was confounded and is recorded here
so it is not repeated: measuring the FIRST pass of any class gives near-zero, because in-context
went first on most changes and in-context finds almost nothing by design (rc03's own measurement:
one CRITICAL in ~25 passes). Only the first INDEPENDENT pass measures what propose/design/apply
actually missed.

So the gap is structural rather than occasional: this pipeline has never produced work an
independent reader had nothing substantive to say about. Two readings remain open and the evidence
does not yet separate them. **(a)** propose/design under-specify, apply fills the gaps with
unreviewed judgement, and review is where that judgement first meets resistance — in which case a
heavier exploration attacks it directly. **(b)** ~5 findings is simply what any independent reading
of a few hundred new lines yields regardless of upstream rigour — in which case a heavier
exploration moves cost rather than removing it. The cheap discriminator, stated so whoever picks
this up does not have to invent it: does first-pass count correlate with how much MECHANISM the
exploration settled before propose?

The program has been here before without naming it this way. **R-crc-7** — explore produces
mechanism, execute the procedure once, specify as decision tables — was ratified out of rc02's
cycle for exactly this reason, and **rc13a is the stage that tried to build it and archived without
shipping** (17 CRITICALs across three passes). The insight exists; the mechanism does not. What is
new is that the target is now MEASURABLE and the claim FALSIFIABLE. Captured as **issue #13**
rather than a stage, per Sal, so findings can accrete against it while the current stages proceed —
the issue carries the full fourteen-change table, the reproduction method, the two competing
readings and the discriminator between them.


**2026-09-21 — rc02c applied: clause (c) is gone, and the gate demonstrated the case for its own
removal before removing it.**

The stage ran its declared proposal cadence to completion — one `fresh` independent pass
(6 CRITICAL / 8 WARNING / 3 SUGGESTION), a walk resolving all seventeen, the `in-context` pass
(0 CRITICAL / 5 WARNING / 2 SUGGESTION), a walk resolving all seven — and then produced, without
anybody constructing it, the terminal state D-rc02c-5 describes. With clauses (a) and (b) both
satisfied the gate advanced to clause (c), selected the most recent INDEPENDENT pass, read its six
CRITICAL, and demanded a fourth review pass. **All six were resolved.** The predicate reads a
pass's findings, never their disposition, so resolution could not answer it and the cadence had no
slot left to put another pass in. The change applied through a recorded `gate_overridden` whose
reason is that line. Once applied, the same gate computed PASSED on the identical trail. That is
the second consecutive stage where this predicate produced this over-spend — rc07 archived at
`independentSpend: 4` against `budget: 3` for the same reason — and two instances on different
changes is a measurement rather than an anecdote.

**What the verdict diff showed.** Old engine against new over all 19 archived changes, 57 gates:
**13 changed, 44 identical, ZERO unexplained.** Seven reason-only changes losing exactly the
`budget spent: N of 3` prefix and keeping the rule clause verbatim. One state change on
`rc02-gate-semantics / review-system`, `unpassed` -> `passed`, whose old reason was clause (c)
verbatim — rc02 being the change that archived through an override for precisely this. And five
`review-proposal` transitions to `stale`, whose mechanism was checked rather than assumed: `stale`
is `allEval.converged && !freshEval.converged`, and clause (c) used to fail the ALL-pass evaluation
too, masking staleness as plain `unpassed`. Budget never entered convergence, so no transition can
originate there.

**The cycle's own shape is worth recording, because both walks left residue at their own edges.**
The fresh pass found a change that had swept its vocabulary through the paragraphs it rewrote and
stopped at their boundaries — the requirement's opening SHALL contradicting its own body 100 lines
down, three scenarios still demanding a retired signal, a sibling requirement outside the delta, a
terminal render two files over. The walk fixed those paragraphs and stopped at ITS boundaries: a
count sentence written before the section it counted was finished, a Touchpoints list predicting
the work as it stood at propose while the walk had added a file to it, a task naming one module for
one field while the sibling field sat in a second module. The in-context pass found five of those
seven. Then the post-fix completeness sweep found one MORE that no review reported — the recorded
delta-size figures went stale the moment a finding rewrote a rule. Structural edits have a blast
radius prose edits do not, and the discipline that caught each round was the same: RECOMPUTE, never
hand-adjust. This is the same shape as Q-crc-17 (records written beside the thing they describe
rather than derived from it) and belongs as evidence against issue #13.

**Two instruments went red without a line of engine code changing**, and the diagnosis is recorded
under Q-crc-14 because only one of them was actually wrong. `countRulingEntries`' pinned ruling
count was WORKING AS DESIGNED — its comment demands a deliberate update whenever a ruling is added,
R-crc-11 was recorded without one, and the red was the feature. `source-lint`'s requirement that the
live file domain contain at least one fenced `src:` example was genuinely unsound twice over: it
depended on rc07's own in-flight artifacts, which became excluded RECORDS at archive, and it
demanded prose this capability's own AUTHORING RULE tells writers not to produce. Both were fixed
as SEPARATE work in their own commit, deliberately outside rc02c, so the stage's diff and its
predicted Touchpoints stayed what they claim to be.


**2026-09-21 — rc02c's system blind pair: the program's SECOND pair, and it reproduced the first
one's economics.**

Two independent reads of the same tree. External (GPT-5 Codex) returned 8 findings; fresh
(clean-context Opus) returned 9; **2 overlapped, 15 distinct, ZERO CRITICAL from either half.**
Capture-recapture on those counts puts the population near 36, so **roughly 58% of what exists was
still unfound after two independent passes.** rc02's first pair measured ≈60% residual with ZERO
CRITICAL overlap. Two pairs, on different stages, months apart, agreeing to within a couple of
points: **the residual is a property of the pipeline, not of a bad day.** That is the number issue
#13 exists to move, and it is now measured twice rather than once.

**Each half found what the other structurally could not**, which is the argument for the pair's
HARDCODED class composition (R-crc-4) stated as evidence rather than as design intent. The external
half alone found the PROJECTION-layer defect — `formatChangeStatus` reconstructing every gate row
unconditionally, putting `budget` back as an undefined-valued key on the public object *after* the
computation had correctly omitted it, invisible to JSON and visible to an in-process consumer — plus
a passed gate still emitting `reason: "converged with …"` in the change whose whole thesis is that
the engine no longer computes convergence. The fresh half alone found `trail.ts`, the fourth
version pin, and the engine's own touchpoints divergence. Where they overlapped, the external half
was the more complete BOTH times, including a third unaccounted scenario rewrite the fresh half
missed.

**The finding that reached THIS document was one only a reviewer reading the PLAN could make.** The
external half checked rc02c's diff against the program and found that `rc10-apply-closure`'s charter
and Q-crc-12's standing recommendation both still instruct a future seam to branch on
`budgetExhausted` — a field the change under review deletes. Nothing was broken, because both are
premised; what was wrong was the PLAN, which now told a later stage to consume an impossible signal.
Both are re-framed above, deliberately as a RE-FRAME and not a deletion: the seam defect they
describe survives the retirement untouched, and only its vocabulary died. **Nothing in this
repository compares a stage's charter to the engine it will run on**, which is the same missing
moment Q-crc-14 describes one layer down, now observed at the program layer.

**Two smaller things worth keeping.** The walk applied R-crc-4's "one merged walk" as ONE SITTING
with TWO RECORDS — because clause (b) matches resolution records to passes by `source_path`, a
single record naming only the external file would have certified only the external pass and left
the fresh one reading unresolved, which is precisely the shape Q-crc-17 describes. The reading was
already settled here (2026-09-14: "one human SITTING, not one emitted record") and this is its
first mechanical application. And the walker's own instrument failed once: a probe of the
touchpoints finding read the wrong JSON key, returned null, and briefly made a valid finding look
stale — the rc01 lesson landing on the person checking rather than the person authoring.


**2026-09-21 — rc02c ARCHIVED through a computed passed gate, and the gate said it in this
change's own words.**

`review-system: passed — passed with 1 SUGGESTION-grade finding deferred`. That string is the
change's own repair: an external reviewer found the engine still emitting `converged with …` on a
passed gate, inside the change whose whole thesis is that the engine no longer computes
convergence. The verdict is now rendered in the vocabulary rc02c introduced. Third rc-stage to
archive without an override; 8 MODIFIED requirements synced and byte-verified 8/8 two independent
ways; baseline capabilities stay at 21.

**The closing move is the one worth carrying forward: a pass bought BY CHOICE over an
already-passed gate.** The blind pair read the tree, and the walk that resolved their findings then
landed 42 insertions and 24 deletions of ENGINE code — the two-branch declaration hoist, the
conditional spreads, the reason string. The gate computed `passed` over that, correctly, because
coverage and resolution were both satisfied and freshness keys on apply tokens. So a SCOPED
iteration-2 external pass was packaged against exactly that diff, asking one question: does the
walk's own mechanism hold? GPT-5 Codex ran a branch matrix — live and blocked gates, derivable and
underivable modes, declared and undeclared budgets — and reported the mechanism SOUND IN THE
IMPLEMENTATION. What it found instead was DURABILITY: three engine comments still defining the
resolution key by reference to a rule clause (c) deleted, a projection comment asserting the
opposite of the surface split this change specifies, and — the sharpest finding of the cycle — a
test suite that pinned the new behaviour without excluding the old, plus a hoist applied in two
branches and covered in one. The new coverage was verified by MUTATION rather than by reading.

**This is Q-crc-20 with a worked example attached.** The question was opened from the observation;
the scoped pass is what the standing recommendation looks like when a human performs it by
judgement instead of being prompted. It cost one model run and it is the reason this archive's
residual-risk record can say the walk-authored mechanism was independently executed rather than
merely asserted by its author.

**The cycle in numbers.** Four independent passes (fresh proposal, blind pair = fresh + external,
scoped external), five walk records, 35 findings, **ZERO CRITICAL anywhere in the system phase**,
none re-opened. The blind pair overlapped on 2 of 15 distinct findings, residual ≈58% by
capture-recapture, matching rc02's first pair at ≈60%.

**And the cycle's own diagnosis, which four independent reviewers reached separately.** Every
residue this change produced had ONE shape: a fix that landed on the INSTANCE a reviewer named and
stopped at the edge of the CLASS it belonged to. Spec references updated, code comments missed.
New behaviour asserted, old behaviour not excluded. A vocabulary swept through prose and stopped at
comments no instrument scans. It recurred through propose, two walks, the pair's walk, and the
archive itself — where the sync agent caught a synced requirement still claiming "every other
scenario is preserved byte-identically" after a scenario had been added beneath it. Twice a finding
of the authoring AI's own came from its own bad probe and was overturned by EXECUTING the check
rather than reading it. If rc08-walk-completeness wants a premise, this is it: the walk's failure
mode is not missing findings, it is resolving them narrowly.


**2026-09-21 — rc04 SPLIT THREE WAYS, and the split came from a SIZE CHECK rather than a
post-mortem.**

R-crc-9's second application, and its first taken PREVENTIVELY. rc13's split came after three
passes and 17 CRITICALs; rc07b's came at exploration. This one came from measuring a mechanism
against R-crc-1 BEFORE promoting it: **ten capabilities against a ceiling of three, 3.3x over.**

**The charter named three because it was written before the mechanism existed.** The exploration
then produced the mechanism — one test for which judgements qualify, executed against all eleven
judgements rc02c's cycle actually made; a two-kind slot derived from the four that qualified; and
two settlements about blocking and retirement. Measuring THAT rather than the charter gave ten.
The single largest surprise was not the record at all: **`gate_overridden` occurs in SIX baseline
specs**, so retiring it — the parent charter's own exit criterion (4) — is itself a ceiling-sized
piece of work. No two-way split exists (the record is 3, everything else is 6), so three is the
minimum that keeps each stage AT the ceiling rather than over it.

**The seam is WHAT IS RECORDED / WHAT IS RECOMMENDED / WHAT IS RETIRED**, and the ordering is a
dependency rather than a preference: `continuation/proceed` must exist before the record it
replaces can go. rc04a and rc04b are loosely coupled by construction — a readiness record cites
pass TOKENS whether or not those passes carry recommendations — so neither blocks the other, and
only rc04c has a hard `Depends-on`.

**The accepted cost is named and BOUNDED rather than hoped away**: between rc04a and rc04c,
`gate_overridden` and `continuation/proceed` both exist, which is two records for one fact and
exactly the defect class this program keeps catching. It is bounded by declaring rc04c NOW.
rc03a is the warning — attestation deferred three times on ceiling grounds, each deferral buying a
cheaper mechanism that failed, which is why R-crc-9 exists at all.

**One thing the session demonstrated in passing, and it belongs to Q-crc-14.** Adding three stages
moved the program's stage count 18 → 21, and the `src:` lint caught BOTH stale marked spans
immediately — in `CLAUDE.md` and in this document. It caught them because the author chose to run
`orbit validate --sources` by hand. **Nothing triggered it.** Q-crc-14's second instance recorded
the same gap from the other direction, where a pinned ruling count sat red through a whole stage
because nobody ran the check. Here the check ran and worked; the gap is that running it was a
judgement, not a seam. That is the third instance, and the first where the lint SUCCEEDED and the
missing trigger is still the finding.

**2026-09-21 — rc04a-judgement-record ARCHIVED; the program's first readiness record, and the
first record it wrote about itself.**
Archived through a computed PASSED gate, no override. The archive emit carries a `readiness`
judgement — `ratified_by: "ai"`, formed against three named independent passes, with four
residuals as structured `{claim, why}` pairs. rc02c's identical residuals, four days earlier,
were 3,333 characters of free prose in `warnings`. Baseline stayed at 21 capabilities (the two
ADDED requirements land in an existing one); 6 blocks synced byte-verified 6/6, 25 scenarios
added, 0 dropped. Cadence: fresh proposal pass → in-context → system blind pair (external GPT-5
Codex + clean-context fresh) → trailing in-context. 21 findings across three walks, all resolved,
none re-opened, ZERO repeats between passes.

**The mechanism dogfooded itself one level deeper than the record.** Step 5.5 read its pass tokens
from the ARCHIVED trail, because `orbit status --change` no longer resolves post-move — which is
exactly the defect the fresh reviewer found and the walk fixed, exercised in flow one command
later.

**Two findings from its cycle are worth more than the stage.** First: both external findings were
rules that READ correctly and COMPUTED wrongly — a coexistence guard indexing two differently
shaped objects with one key set, and a closed carrier table enforced by command but never by kind
— and both were found by CONSTRUCTING A PAYLOAD AND RUNNING THE REAL CLI, not by reading code.
That is rc01's thesis arriving from the reviewer's side. Second, and it belongs to Q-crc-14: the
trailing pass pointed an EXISTING instrument at one file it had never read (`external-handoff.md`,
added to the schema-parity table), and got a pre-existing defect for free — the reference
documented a `reviewer_class` field the payload table REFUSES and the engine never composes, so
it had been leading authors into a refused emit for as long as it existed. Widening an
instrument's domain by one row has now paid this program twice.

**Recorded here because the stage could not record it itself.** Four residues from rc04a's own
cadence were routed to this session and are now repaired in place: exit (3)'s count moved THREE →
TWO with the reason; the stage's ONE-COMPUTED-RULE claim qualified to name what it is a rule
ABOUT; the rc04 parent's boundary-with-rc02c paragraph, which described a relationship with the
clause-(c) predicate rc02c DELETED; and the `residual_risk` field name in the one forward-looking
place it still steered something (the Considered & out re-entry trigger). The field never shipped
under that name — `judgements[].accepted` is the shipped shape. The remaining `residual_risk`
occurrences sit in the status log and in RESOLVED question records, and are deliberately left: a
ledger that is rewritten to match what later happened stops being evidence.

**One inherited hole, named rather than discovered.** rc04c's charter claimed the new record is a
strict subset of `gate_overridden`. It is not, quite: `formed_against` must be non-empty, and a
gate is unpassed precisely when its cadence is incomplete — including when no independent pass
exists to cite. Measured at archive: 20 recorded overrides across every archived change, all 20
with an earlier independent pass, so 0/20 reach the edge. The charter now carries it.

**2026-09-21 — rc04c SPLIT into rc04d-override-vocabulary + rc04c-retire-gate-overridden; the
third PREVENTIVE application of R-crc-9.**
A size check run at exploration — before anything was proposed — measured `gate_overridden` across
**6 baseline capabilities and 14 requirements**, twice R-crc-1's ceiling on capabilities-touched.
The charter's own scope line ("the three not already touched by rc04a are this stage's
capabilities") had the right instinct and half the work: rc04a MODIFIED those three capabilities
without removing the field from any of them, so all six still needed normative change.

**What the size check produced was better than a split.** Three of the six name the field only
while saying an override is RECORDED — they do not depend on its shape. De-named, every one of
those sentences is TRUE BEFORE AND AFTER the retirement, which is the property that decides the
ORDER: de-naming first, there is never a moment when a spec normatively demands a field nothing
writes; retiring first, the interim has three capabilities requiring a record the emit layer has
already refused. Same total work, and only one ordering has a coherent middle. rc04d therefore
carries no dependency and rc04c depends on it.

**The naming was decided on evidence, not taste.** Nothing declares `Depends-on: rc04c`, but
NINETEEN immutable records cite it in prose — rc04a's four archived artifacts, eleven of its trail
emits including the readiness record's own reasoning, two architect emits, and the live
exploration's directory name, metadata citation and both its emits — all saying rc04c retires
`gate_overridden`. Re-lettering the pair would have made all nineteen false to buy one letter of
reading order. `Depends-on` carries sequence; letters are labels, and this doc's letters have
never ordered anything.

**Two charter claims had gone stale and are corrected in place rather than quietly dropped.**
"NOTHING COMPUTES ANYTHING FROM IT" stopped being true the moment rc04a shipped: the coexistence
guard READS the field and computes a refusal from it, which means the parent charter's exit (4) —
*"either gains a reader or is retired"* — was satisfied by the stage that prepared the retirement,
and that reader is scaffolding which comes down with what it braced. And "four workflow templates"
was three. A third check went the retiring field's way and changed the stage's framing from
deletion to MOVE: the recorded gate reason is not reconstructible, because four archived emits
carry clause-(c) vocabulary rc02c retired that today's engine cannot produce for any input.

**D-rc04c-1 closes the hole this doc named yesterday.** An empty `formed_against` is legal on a
`continuation/proceed` and ONLY when the emptiness is TRUE — the engine verifies no independent
pass precedes the emit and refuses an empty citation when one exists. The absence of evidence
becomes a CHECKED ASSERTION rather than an unchecked hole, which makes the continuation record
total over the override's domain and the strict-subset claim finally true. It adds a check rather
than relaxing one, and it amends `formed_against` one day after rc04a shipped it through a blind
pair — recorded loudly here for that reason.

**2026-09-22 — Q-crc-22 opened; three rc04d-earned corrections applied to this doc.**
The blind pair has a producer and no consumer. rc02 shipped `blind-pair` as a two-member slot and
R-crc-4 requires both members back before EITHER is walked, but no invocation walks two passes
together — `--from-file` is single-path and "always exclusive", auto-discovery picks "the SINGLE
most-recent file", and `address-reviews` is a workflow body rather than a CLI command, so there is
no engine-side parse to extend. The gap was hit TWICE in one session (rc04a's system pair, rc04d's)
and resolved by conversation both times. The sharp edge is the silent one: bare
`/orbit:address-reviews <change>` auto-discovers ONE pass and reports a complete-looking walk; at
rc04d it would have dropped the external half's CRITICAL. Recommended to `rc08-walk-completeness`,
whose minimum deliverable is making that case LOUD rather than building a merge feature.

**Three corrections this doc earned from rc04d's cadence, applied here because stage declarations
are the architect's.** (a) rc04c's `Touches:` slot named rc04d's three capabilities, byte-identical
to rc04d's own line, for the entire interval between the split and rc04d's external review — the
SCOPE paragraph was rewritten at the split and the machine-shaped SLOT was not. `orbit architecture
validate` reads that slot's grammar and never its agreement with the prose, so nothing caught it.
(b) rc04d is no longer described as "5 requirements, pure de-naming": four are plain substitutions
and one is an ownership move, which is where every finding against that stage landed. (c) rc04d's
charter now names NO SHAPE OWNER at all, and that deletion is the interesting one — the charter
illustrated the de-named form as "shape owned by `orbit-run-summary-emit`", and the stage's cadence
refuted that wording twice from two directions: a fresh pass showed it wrong for the archive emit,
and the external pass showed the two-owner replacement ALSO wrong, because
`orbit-archive-modifications` itself says the successor's shape and carrier are defined by
`orbit-run-summary-emit`. A charter that illustrates a form the stage is still litigating becomes a
third voice on an unsettled fact; the delta is the authority, and the charter now states only the
PROPERTY the wording must have.

**Worth recording about the cadence itself.** rc04d's blind pair converged on ONE defect from
opposite sides with zero title overlap — the fresh half attacked the ARGUMENT ("your reason is
wrong: that capability does cover archive") and the external half attacked the CONCLUSION ("your
owner is wrong: that capability owns the shape"). Neither could have reached the other's evidence.
Capture-recapture over the pair: 4 + 2 findings, overlap 1, population ~8, five distinct, residual
~37% — the lowest of the session, on the smallest change of the session.

**2026-09-22 — R-crc-13 captured and Q-crc-23 opened: the program says what a gate IS, and asks
whether its own vocabulary agrees.**
Raised top-down by Sal mid-walk on rc04d, which is worth noting because the prompt was not a
finding: *"i've never been a big fan of hard gates … the judgement to go forward is always a joint
decision between the AI and me … the emits just help us track the status — they aren't necessarily
rendering judgement on how the past went."*

**R-crc-13 changes no behaviour and that is the point.** `orbit-engine-gates` has carried the
contract verbatim since C1 — *"Gates NEVER hard-block — apply-parity enforcement: the engine
reports, the skill prompts, the user decides, the trail records"* — and D1 built consent on it.
What the ruling adds is STANDING. The commitment lived inside one capability as an enforcement
note, where a later stage could narrow it without anyone noticing the premise had moved; it is a
program-level entry now, and a stage wanting an authoritative gate has to argue against it rather
than edit a sentence. Its corollaries are named in the entry so they are not rediscovered: R-crc-10
follows FROM it rather than sitting beside it, rc04a's `ratified_by` is its existing mechanism, and
rc04a's never-blocks clause is load-bearing rather than a courtesy.

**Q-crc-23 asks the question the ruling exposes.** You override something that had authority over
you; under R-crc-13 the gate never had any. The tension is visible inside ONE requirement — title
`Inflection-prompt OVERRIDE contract`, first scenario `Override recorded, NOT PREVENTED` (a
scenario name arguing with its own title), field `gate_OVERRIDDEN` — while rc04a's successor
already names the same event correctly (`continuation`/`proceed`, formed against named evidence,
`ratified_by: ai | user`) without anyone having remarked on it. Measured rather than
characterised: `override` appears 48 times across `orbit/specs/` and the bodies carry 17
`gate_overridden`, 9 `Proceed anyway`, 5 `proceed-anyway` — and the fingerprint, audit-drift and PR
seams use the word for their OWN proceed-anyway prompts, so this is the program's word for "the
human decided to continue" at FOUR seams, not one field's vocabulary.

**The scope consequence is named rather than left to be discovered.** `rc04c-retire-gate-overridden`
believes it is retiring a FIELD. If the frame is wrong, the honest scope is a WORD across ten
capabilities and four seams — past R-crc-1 on sight. The standing recommendation is to NOT widen
rc04c and to declare the reframe an explicit NON-GOAL in its charter, so the boundary is stated
rather than found mid-apply; whether the reframe becomes its own stage is a scope call raised and
not taken.


**2026-09-22 — rc04d's system cadence closed; three captures, and one scope call raised and not
taken.** The stage's `review-system` gate computed PASSED with `independentSpend: 2` of a declared
3, no override — a blind pair (external GPT-5 Codex, fresh), both halves walked in one sitting,
then an in-context confirm finding 9 (2C/5W/2S), all nine walked to zero. The delta closed
byte-identical to its pre-walk state: fingerprints 5/5, `validate --strict` clean, 2238/2238 green,
`gate_overridden` absent from the deltas.

**Ratification offered and declined (rc03a, third firing).** The engine's readout raised
`rc03a-blind-prompt — quiescent, completion awaiting your ratification`; the slot stays `[ ]`. The
recurring cost is recorded on Q-crc-11, where it now overtakes that question's own "leave it until a
third occurrence" counter on the second of its two readings.

**What the cadence earned this doc.** (1) A DESCOPE SWEEP COROLLARY on R-crc-6, settled under
R-crc-3 and appended rather than promoted to a new ruling — the ruling count stays 13, deliberately,
so the `src:rulings` marker and the `sources-registry` pin stay out of rc04d's working tree (see the
exit-(2) note below). Its content: descope is the cheap lane for MECHANISM and the expensive one for
ARTIFACTS, evidenced 7-of-9. (2) A clean SECOND OBSERVATION on Q-crc-17 — nine entries matched nine
findings, measured; the keys matched because the author copied them verbatim and nothing checked it,
so a clean instance is evidence about the walk and not about the mechanism. (3) A SECOND INSTANCE on
Q-crc-20, sharper than rc02c's.

**THE SCOPE CALL, RAISED AND NOT TAKEN — rc04d is archive-eligible over a sentence no independent
pass has read.** Q-crc-20's new instance is not abstract for this stage: the blind pair reviewed the
two-owner site-2 replacement, the external half refuted it, the 03:02 walk DELETED the clause, and
the shipped sentence has been read only in-context. The gate is right to pass — coverage and
resolution are both satisfied and no apply followed — and the residual is real. It is also unusually
small and measured: ONE normative sentence changed since the pair, everything after it prose, with
the delta byte-identical across the confirm walk.
*Standing recommendation*: ARCHIVE AS IS and carry the residual in rc04a's readiness record
`accepted` list as a `{claim, why}` pair — the sentence's own correctness is the most-reviewed
question in the stage (three independent refutations converged on removal, and R-crc-13 supplies the
principle), so a fourth pass would be buying coverage of a conclusion rather than of an argument.
Buying one scoped independent pass is the defensible alternative and is what rc02c chose in the
analogous spot.
**TAKEN 2026-09-22 (Sal): archive as is, residual carried in the readiness record.** Recorded here
because the alternative was live and evidenced, and a later reader should see that the residual was
WEIGHED rather than missed. The commit-boundary recommendation below was NOT taken with it and
remains standing: clause (c) carries the `test/` residual unless the R-crc-13 bump is landed
separately first.

**Exit (2)'s instrument was corrected mid-cadence, and the correction is a program-level lesson.**
rc04d's task 2.2 read "`git diff --name-only` for this change touches NOTHING under `src/`/`test/`"
— an UNSCOPED command standing in for a change-scoped claim, so on a shared working tree it reports
another workstream's edits as the stage's and the criterion stops being falsifiable. It is now
path-scoped to the change's own commits, with the R-crc-10 boundary stated explicitly: WHICH COMMITS
carry a change is observable and may be checked; WHETHER an edit belongs to a workstream is a
judgement and is RECORDED at archive. The concrete residual is `test/core/sources-registry.test.ts`,
red from the R-crc-13 ruling-count bump — the ruling rc04d's own design rests on. Landing that bump
in its own architect commit makes the scoped check read clean by construction; the commit boundary
is the user's, and rc04d's AT-ARCHIVE NOTE clause (c) records the residual either way.

**2026-09-22 — rc04d-override-vocabulary RATIFIED COMPLETE (Sal); R-crc-12 gains its third case.**
Ratified on measurement rather than on the archive's own report, re-run against the post-archive
tree: exit (1) greps ZERO across the three capabilities; exit (2) shows `src/` untouched with
2238/2238 green; exit (3) reads 6 capabilities down to 3. The split's arithmetic closes exactly —
`gate_overridden` spanned 14 requirements across 6 capabilities, rc04d took 5 across 3, and rc04c
now inherits a MEASURED 9 across 3 (`orbit-run-summary-emit` 4, `orbit-archive-modifications` 4,
`orbit-emit-composition` 1), which is the figure its charter has claimed since the split and is
now verified rather than asserted. Both halves sit AT R-crc-1's ceiling, which is what R-crc-9's
third preventive application was for.

**R-crc-12 THIRD CASE — an instrument correction is not a revision.** Recorded because ratifying
rc04d required deciding what its mid-cadence exit-(2) change actually was, and the wrong answer was
available and flattering. R-crc-12 splits two cases: the shipped mechanism changed the criterion's
meaning (REVISE) or the stage missed the bar (MISS). rc04d was neither — the criterion was right and
measurable throughout, and the COMMAND WRITTEN TO MEASURE IT measured the working tree while
claiming to measure the change. rc04d shipped no mechanism at all, so nothing could have changed the
criterion's meaning, and the ruling's own distinguishing question (*is the criterion still measurable
in the shipped vocabulary?*) answers YES. So it GRADED, and it graded MET. The clarification carries
a corollary the stage earned the hard way: an exit criterion lives in the CHARTER and the command in
a task is only its instrument — rc04d's task had tightened the bar from `src/` to `src/` AND `test/`
without the charter ever saying so, and it was the unratified half that appeared to fail. A task may
not silently narrow the bar its stage is graded against. Appended inside R-crc-12 rather than
promoted to R-crc-14: the ruling count stays 13, keeping the `src:rulings` marker and the
`sources-registry` pin out of an already-uncommitted tree — the same reasoning as the R-crc-6
corollary earlier today, and now twice-applied enough to be a habit worth naming.

**rc03a was NOT re-prompted.** Its offer was fired and declined earlier the same day (Q-crc-11's
third firing, recorded there). The body is told never to nag, and firing an identical declined prompt
twice within one day is nagging — so the readout was stated in prose and the slot left `[ ]`. Noted
because Q-crc-11 is accumulating cost evidence and a SUPPRESSED firing is different from an absent
one: the annoyance was real, it was simply not paid twice.

**2026-09-24 — R-crc-1 clarified on the BYTE dimension; rc04c's TASK overage ratified as R-crc-9's
first recorded breach.** Both halves earned by rc04c's external iteration 1 (GPT-5 Codex), which
measured the stage against all four of R-crc-1's dimensions where the proposal had argued only the
one that flattered it.

**The byte half is a measurement error the ruling could not have anticipated.** The delta format
compels a MODIFIED block to carry its requirement's FULL text, so a stage rewriting ten long prose
requirements ships ~43 KB of verbatim carriage regardless of what it changes. rc04c reads 57,418
bytes and 163 changed lines. R-crc-1's calibration point, `c2-parallel-merge` at 21 KB, was a
MECHANISM stage where delta bytes and new text were nearly the same quantity — so the ceiling was
never calibrated on the case it now fires hardest on, which is exactly the retirements and
de-namings this program keeps producing. Clarified INSIDE R-crc-1 rather than as a new ruling,
deliberately: a reader who reaches R-crc-1 must not be able to apply the superseded measure.

**The task half was NOT clarified, and that distinction is the point.** rc04c is over on tasks (34
against "under 20"; 22 work items plus 12 verification and handoff records) and stays over. Two
escapes were available and both were declined: redefining the dimension to count work items only
(22 — still over, and transparently motivated), and coalescing boxes. The external reviewer named
both in advance as hiding overage by recounting, which is the correct reading and is why neither
was taken. R-crc-9 permits a ratified breach and the program had never taken one; this is the first,
recorded at its real figure in the stage section with the reason — the count grew 22 → 30 → 34 as
three review passes each converted findings into sub-tasks naming exact sites, so it measures
review DEPTH rather than scope. That is an argument for accepting this breach, not for pretending
it is not one, and the stage section says so in those words.

**R-crc-9's split branch was examined and rejected on evidence, not preference.** The obvious split
— totality amendment out, legacy-key retirement in — leaves one requirement in EACH of the same
three capabilities on both sides, so neither half drops below the binding dimension. That is
`D-rc04c-4`'s objection to splitting by seam arriving again from a new direction, and it is worth
noting that the program has now twice proposed a split for this stage family and twice found the
capability count immovable.

**Habit worth continuing to watch (third instance).** This is the third capture in three days
appended INSIDE an existing ruling rather than promoted to a new one — R-crc-6's descope corollary,
R-crc-12's third case, and now R-crc-1's byte clarification. Each was right on its merits: all three
complete an existing rule and a reader of that rule needs to see them. But the count has now been
held at 13 across three substantive additions, and the earlier note that this habit is partly
shaped by a test pin still stands. If a fourth arrives, the question to ask is whether the rulings
index is being kept artificially short.

**2026-09-24 — rc04c APPLIED and its system blind pair FORMED; the FOURTH instance arrived and
R-crc-14 is the stop.** The apply landed 36/36 with the engine half proven from the built CLI on
every trail state the totality rule names. The pair ran design D4's way — after apply, on the
shipping tree, both halves blind: external (GPT-5 Codex) 2C/1W, fresh 0C/3W/4S — and converged on
one defect neither the apply nor its three proposal passes had seen: the token-source sentence,
one paragraph in four bodies, counting rejected external returns as citable. It was the FOURTH
instance of the rule-stated-in-more-places-than-once pattern rc04c's preamble had been counting,
and the apply emit had claimed no fourth appeared. The walk closed it by deletion (option A) and
recorded the mechanism that would make the copies collapse to a call (option B) at Q-crc-24.

**The ruling, not another append.** The previous entry warned that a fourth capture appended
inside an existing ruling would be the moment to ask whether the index was being kept short. The
fourth capture was a NEW rule, and it went in as R-crc-14 — a rule is stated once, in its owning
spec; everything else names it and points. The pin moved with it in the same edit (13 → 14 in
CLAUDE.md's marked span and in `sources-registry.test.ts`), which is Q-crc-14's second-instance
lesson applied rather than re-learned.

**Records of fact corrected in this session, none of them state.** rc04a's stage section now
carries the NON-EMPTY amendment as a dated line under the ratified paragraph; rc04c's "four
archived apply emits" reads ten across four changes; its omit-scenario sentence is marked
superseded by the delta's normative write; its task figure is stated at both 34 (ratified) and 36
(final), with why. Q-crc-14 gained a THIRD instance (the lint throws ENOENT during a consume-mode
propose's uncommitted-move window — a different failure mode from the missing trigger); Q-crc-23
carries the re-measurement it asked for (46 in specs post-sync, 11 in bodies); Q-crc-25 (the spend
record's trigger keys on gate PASSAGE and rc04c's handoff had no carrier) and Q-crc-26 (`--report`
cannot address an archived change) are new, from the apply's handoff notes.

**Two things worth carrying forward from the cadence itself.** The test-sizing lesson: rc04c
sized its red-test set by grepping for the field name, and a HASH PIN names nothing — the template
parity pin went red on exactly the two bodies the stage names, and the stage had no line for it.
And the pair's shape: zero CRITICAL overlap by severity, but the top finding was shared, found by
both halves through different routes (the external by reading the bodies against the spec, the
fresh by driving the CLI and then reading the prose that feeds it). One cheap experiment settled
the engine question in both directions at once, which is rc02's lesson repeating.

**2026-09-25 — rc04c RATIFIED; rc03a declined a FOURTH time.** rc04c's completion ratified by Sal the
morning after its archive, on the readout the engine rendered (quiescent, all citing work archived)
and the three exit criteria measured at apply and re-measured at archive. Seven stages complete.
The same offer fired for rc03a — its fourth firing (2026-09-22, 2026-09-24 twice counting the
suppressed one, now 2026-09-25) — and was declined again: the stage is WITHDRAWN and the grammar has
no state for that, so every "complete?" offer asks the wrong question. Q-crc-11's cost evidence now
stands at four firings for one stage, which is the number a reader should weigh when that question
is taken up.

**Closed out between sessions, recorded so the trail is whole.** A project-wide `/orbit:audit-drift`
after the archive found one drift: CLAUDE.md's handoff narrative had no rc04c archive paragraph, the
first time the customary paragraph was not written at the seam. Walked and written the next morning,
with the ruling figure inside it MARKED so the source lint checks it. The same audit corrected a
record of its own: the pre-archive sweep inside rc04c's archive emit claimed the boot JSON carries
no `touchpoints` key; it does, nested under `boot` as `orbit-orientation` specifies — a reader error,
corrected on the audit's record and not by editing the emit.

**2026-09-25 — rc13a's SECOND ATTEMPT ARCHIVED (`bounded-closure-semantics`), through a computed
PASSED gate; one exit grade left for Sal.** The cycle in one paragraph: apply landed 14/15 (6.1 the
declared user-validation handoff; 6.2 converted from a checkbox to an at-archive note at apply, per
the repo's convention); the external half of the blind pair ran on the pushed apply commit (GPT-6
Astra, 2C/2W/1S) and the fresh half on the same tree (0C/5W/4S), blind to each other, zero CRITICAL
overlap, three findings shared; both walked in two logs; the in-context confirm found 0C/3W/2S — all
five in what the walks themselves had added, rc02's lesson one level down — and walked to zero.
**What the cycle earned:** R-crc-14's MIRROR COROLLARY (a generated surface that cannot resolve its
owner may carry a mirror a test holds byte-equal; ratified in chat; the rulings count stays 14) and
its mechanism, a parity test over three fenced productions and two tables; the re-entry table's
FOURTH fact (found by the external pass: an edge sentence gave one input two results); the status
production end-anchored and EXECUTED by a test rather than asserted present; GFM cell escaping named
in the grammar with the change's own D-bcs-8 row as fixture; D-bcs-12, the nine-move set as a real
BOUNDED entry so the OPEN-DECLARED production has an instance; and a sixth residue hit the acceptance
grep could not see (`5-section`, spelled with a numeral, in the onboard body). **Two records
corrected on the trail rather than by editing emits:** the fresh-walk log claimed the boot
touchpoint divergence was clear before the right key had been read (the same reader error rc04c's
audit recorded on itself four days earlier — the key nests under `boot`), corrected in the
in-context review's commentary; and the at-archive note's pre-committed grade for exit (2) no
longer matches the artifact, recorded in the stage section and left to ratification. **Residual
risk, carried in the archive emit's readiness record**: no independent pass stood on the FINAL tree
(both halves read it before three walks landed), so PASSED here means resolution, the rc07
distinction; and the parity test's owner rule was rewritten on the in-context pass alone.

**2026-09-25 — rc13a RATIFIED (eight stages complete); exit (2) revised at ratification.** Sal
ratified rc13a's completion in an architect session two hours after the archive, on the engine's
readout (quiescent, both attempts archived) and the three exit criteria as graded at the archive
tail — taking R-crc-12's first case on exit (2): the stage's shipped mechanism, ACCOUNTED closure,
invalidates the criterion's own word "closed", so the criterion is revised to "every live rule's
domain ACCOUNTED" and graded MET 9 of 9 rather than a MISS at 8 of 9. The distinction from the
third case is worth one sentence: rc04d's exit (2) had a wrong INSTRUMENT and a sound criterion;
rc13a's exit (2) had a sound instrument and a criterion whose term the stage itself retired.
rc03a's offer was NOT re-fired — declined earlier today, its fourth — so Q-crc-11's count stands
at four firings. Proposed and awaiting Sal's word: `rc13c-propose-consumes-mechanism` (in the rc13a
section). Next uncovered stage in dependency order: rc13b, now unblocked.

**2026-09-25 — TWO STAGES DECLARED (Sal): rc13c and rc15; 22 → 24.** In the architect session that
followed rc13a's ratification by ten minutes, Sal took both scope calls the archive had left open.
`rc13c-propose-consumes-mechanism` (Phase 1, depends on rc13a) is the follow-on rc13a's archive
proposed: the consume-mode mapping gains a Mechanism row so a BOUNDED residual TRAVELS at propose as a
checked mapping rather than a remembered instruction, the structure check reads six sections by
pointer, and propose stops promoting a `concluded` name silently — one capability,
`orbit-propose-modifications`, which is why it is a stage and not a fold. `rc15-ended-stage-state`
(Phase 4, no dependencies) takes up Q-crc-11 on its second reading — the third occurrence of the
COST, after rc03a's fourth ratification offer was declined this morning: the `Complete:` slot gains a
third production for a user-declared ENDED stage, the state reader consults rc13a's concluded header
in a citing staging directory, the ratification offer fires on awaiting-ratification only, and the
WAITING set is unchanged. rc14 was NOT used: it stays reserved for the undeclared `rc14-delta-scope`
standing recommendation of 2026-09-14. rc03a's offer was not re-fired in this session — the fourth
firing and its decline stand as the day's record, and rc15's exit (1) is what ends the count. Both
stage-count marks (this doc's preamble, CLAUDE.md) moved to 24 in the same edit. Eight stages
complete; rc13b remains the next uncovered stage in dependency order, and rc13c now queues behind
it; rc15 has no dependency and could be explored at any time.

**2026-09-25 — rc13b ARCHIVED through a COMPUTED PASSED gate via the blind pair; the first
D-rc13b-7 measurement is ONE ENUMERATE failure.** The cycle in one paragraph: explored under the
rc13a convention (nine decisions, seven rules with Mechanism entries checked clean by an executed
script), proposed in CONSUME mode; one fresh proposal pass (2C/11W/5S), one external (GPT-5 Codex,
1C/4W/2S — one array carrying two semantic roles had no correct predicate, and the opener rule sat in
its consumer with no owner, which made this a FOUR-capability change by a one-sentence
`orbit-conventions` delta, declared under R-crc-9 and ratified), one in-context confirm; apply 17/18
in one session (the grammar module interpolated with the `orbit-explore` pin MEASURED unchanged);
then the blind pair on the pushed apply commit — fresh 0C/5W/4S and external GPT-5 Codex 1C/4W/1S,
blind to each other, converging on four defects (the repeated-section collector — the external
CRITICAL, an ENUMERATE failure of the parser's input domain — the GFM row regex, the retired
Mature-rung prose, the field-shape contradictions) and each finding two more; walked in two logs; an
in-context confirm 0C/1W/2S over the walks' own additions, walked to zero; gate PASSED, independent
spend 2. The third rc-stage through a computed PASSED gate and the second through the pair. Two
things to carry: the pin moved TWICE afterwards as a SECOND act (the pin that must not move and the
prose that must be repaired are two acts, recorded as such in the parity test and under the task);
and Q-crc-14's fourth instance fired again at this archive (the source lint reads the git index, and
an unstaged archive move leaves paths that no longer exist). The readiness record accepts five
residuals, headlined by rc07's distinction: PASSED means every finding resolved, not that an
independent pass stood clean on the final tree. This corrects the entry above: rc13b is no longer
the next uncovered stage — rc13c queues next in dependency order, rc15 stays free — and the count of
ratified stages stays eight until Sal ratifies. **2322 tests green.**

**2026-09-25 — rc13b RATIFIED (nine stages complete); all three exit criteria graded MET as
written.** Sal ratified in the architect session on the archive's day. Exit (1): the Unaccounted
rung withholds the propose verb when any live rule's domain is open and names the gap by identifier
within the three-plus-`+N more` bound — the criterion's word "Mature" names a rung the mechanism
retired, but the cell it occupied is exactly where the verb changes, so the criterion still measures
and no R-crc-12 revision was needed. Exit (2): every named instrument is a fixture in the parser
suite (a declared form, one without, each out-of-domain disposition, a fenced decoy, no Mechanism
section), plus the archived exemplar and the two body exemplars; the blind pair added the cases the
plan missed (repeated sections, GFM row padding, list-item boundaries, BOM, colon-wrap). Exit (3):
the synced `orbit-emit-composition` requirement states the FORM-only claim and both holes — a file
of `Kind: fact` entries yields zero truthfully; a rule never written is invisible. rc03a's offer was
not re-fired (its fourth decline stands; rc15's exit (1) ends that count). Next in dependency order
is rc13c-propose-consumes-mechanism; rc15-ended-stage-state remains free to explore at any time.

**2026-09-28 — rc13c ARCHIVED through a COMPUTED PASSED gate via the blind pair; the fourth
rc-stage through one, the third through the pair; Q-crc-27 and Q-crc-28 opened.** Explored 2026-09-25/26
under the rc13a convention (eight decisions, seven live rules, six accounted, one BOUNDED — D-rc13c-5,
the exit-(2) exemplar); Sal ruled the two scope calls in chat (a concluded exploration is DONE, propose
refuses it and offers no reopen; one capability). Proposal cadence: fresh 2C/6W/6S (the consume-time
explore emit contradicted `orbit-run-summary-emit`'s one-shot rule — DESCOPED, option B; the refuse
carries the `Re-entry:` slot, option A), external GPT-5 Codex 2C/4W/2S (the decision table was not a
PARTITION — ENUMERATE, on a table the exploration marked DERIVED; the concluded path overlapped two
inherited scenarios — COHERE; the mtime cross-check removed), in-context 0C/4W/6S (the duplicate-ID
second entry still reached a carrier row — the key-defects row moved FIRST and "accounted" became
"counted in `rules_total` AND not in `rules_open`"); 32 findings walked to zero in three logs; gate
PASSED. Apply 14/15 in one session (4.4 the user-validation handoff to the next propose; 4.5 an
at-archive note). System cadence on the pushed apply commit: the blind pair — fresh 0C/4W/3S (executed
the partition against the parser with every edge case: it held) and external GPT-5 Codex 2C/2W/0S
(Continue would have DELETED a concluded record beside an active change — COHERE, now refused before any
prompt naming both paths; an adopter's installed skill cannot derive parser-owned states — READ, now the
Mechanism grammar ships in the propose body as the grammar module's mirror and "accounted" is decidable
from the file as full conformance), zero CRITICAL overlap, two walk logs; an in-context confirm 0C/0W/2S
applied in flow; gate PASSED on resolution. Exit (1)–(3) measured as met on the archived tree. Two
process facts recorded on the trail rather than hidden: a walk script wrote three task lines with a
literal backreference (rebuilt from the committed file), and the regenerated local skill lagged the
template between two walk commands (a chained build never ran; caught by re-diffing the render). Specs
synced 6/6 byte-verified; fingerprints 5/5; audit 0C/1W/1S; 2330 tests green. Q-crc-27 (a read-only
print of the parsed Mechanism form) and Q-crc-28 (the retirement-class sweep's list — five new sites
from this stage) opened from the at-archive notes; the five stale follow-on sentences are an accepted
residual on the readiness record. rc13c renders quiescent, awaiting ratification. Next in dependency
order: rc15-ended-stage-state (free), or rc02b / rc03 / rc04b in Phase 2.

**2026-09-28 — rc13c RATIFIED (ten stages complete); all three exit criteria graded MET as
written.** Sal ratified in the architect session on the archive's day. Exit (1): the mapping
carries a Mechanism row (the pointer row in `Section-to-artifact mapping`; the partition in the ADDED
`Mechanism section consumption`) and the structure-check scenario counts sections by POINTER to
`orbit-conventions`' format requirement — the walks removed the one restated number the in-context
pass found. Exit (2): D-rc13c-5's two residual lines sit verbatim in the ADDED requirement and the
design's first Risks entry points at it (measured 1/1/1 at apply, at the confirm and at archive).
Exit (3): the refuse is position-tested inside Mode detection (the both-exist refuse inside the
conflict sub-step before its prompt; the phrase taught once body-wide), and `orbit-explore-
modifications`' re-entry requirement is named with zero occurrences of its table row or its
predicate. The charter's "refuse-or-reopen branch" left the choice to the exploration; the exploration
chose refuse on Sal's word and the criterion still measured, so no R-crc-12 revision. rc03a's offer
was not re-fired (its fourth decline stands; rc15's exit (1) ends that count). Next in dependency
order: rc15-ended-stage-state is free; Phase 2's rc02b, rc03 and rc04b are open.

**2026-10-01 — rc15 ARCHIVED through a COMPUTED PASSED gate via the blind pair (the fifth
rc-stage through one, the fourth through the pair); specs synced 5/5; Q-crc-28 widened and Q-crc-29
opened; exit (1) pending on Sal's act.** Proposed 2026-09-28 in consume mode over the exploration
(six decisions, five live rules, five Mechanism entries all CLOSED — none open, no key defects, no
BOUNDED residual); Sal ruled the two scope calls in chat (an ended mark asserts nothing about the
work, so it is honoured on `premised`; the mark reaches the doc as a third answer on the existing
offer or unprompted on the user's word). Proposal cadence: external GPT-5 Codex 4W/2S (the unprompted
route on a LIVE stage declined — 3A; the lexical limit DECLARED and shared with the ratified
production, not hardened — 6A), fresh 0C/3W/4S (arc-done over ended stages a declared non-goal —
1B, now Q-crc-29; the unprompted route closed over the SLOT's content too — 2A; audit-drift's two
enumerations dropped so "consumes the rule and enumerates none of its observations" is literally
true), in-context 0C/1W/3S; 17 findings walked to zero in three logs; gate PASSED. Apply 13/14 in
one session (5.3 the user-validation handoff: rc03a's mark is Sal's act): the third production
`Complete: [~] <date> (<who>)` beside the ratified one, `StageCompletion` gaining `ended`;
`concluded` the FIFTH observed state read through the explore parser's exported `readStatus` — ONE
reader of the header production in the engine, proven by grep; `compose()` the five-by-three table
cell for cell, the `[x]` column's outcomes byte-unchanged while its detail learned the conclusion's
name; `ended (declared <date> by <who>)` and `ended-from-explore` renders with `ended`/`endedDate`/
`endedWho` on the JSON payload and `concluded` on explore citers; the architect offer ratify / not yet
/ ended, firing on awaiting ONLY, with the unprompted route written on `premised`/`quiescent`/
`concluded` + an UNDATED slot and declined on live work or a dated mark; `stages_ended` in the emit
table; audit-drift's check (b) by POINTER. Two plan facts corrected on the record at apply: no
`orbit-audit-drift` hash pin exists, and `live-arc.test.ts` reads the D-arc doc only. System cadence
on the pushed apply commit d864ed1c: the blind pair — fresh 0C/1W/3S (the `orbit-orientation` closed
data-source scenario and its chip parenthetical made false in letter by the header read — the one
scope call, Sal: B, named as residual and handed to Q-crc-28; the unprompted route restated in the
status JSON's own field names, `concluded` given its owner sentence) and external GPT-5 Codex
0C/2W/1S (the architect §2 grammar copy UNGOVERNED as a mirror — the fifth instance of the rule-stated-
twice pattern rc04c counted, now ONE parser constant `COMPLETE_SLOT_PRODUCTIONS` interpolated into the
body and held to the owner by a parity test through the single-active-owner lookup; the D-arc doc and
CLAUDE.md pointing at the owning state requirement; an EISDIR fixture executing the unreadable-file
leniency), zero CRITICAL overlap, one shared SUGGESTION, two walk logs; an in-context confirm
0C/0W/1S (the task record's second pin move, applied in flow); gate PASSED on resolution. Every
finding of the pair sat in prose describing the engine; none in the engine. Exit (2) and (3) measured
MET on the archived tree (the concluded fixture renders `ended-from-explore` in the fifteen-cell
table; every production executed against its near-misses; `orbit-orientation` carries no delta —
`ls specs/` three directories). Exit (1) PENDING: rc03a's mark is written on Sal's word in the next
architect session on this doc, and Q-crc-11 closes on that observation. Specs synced 5/5
byte-verified (five MODIFIED blocks across three capabilities); fingerprints 5/5; audit 0C/1W/1S;
2376 tests green. rc15 renders quiescent, awaiting ratification. Next in dependency order: Phase 2's
rc02b, rc03 and rc04b are open; the retirement-class sweep (Q-crc-28, now three capabilities) is the
cheapest standing recommendation on the board.

**2026-10-01 — rc03a-blind-prompt declared ENDED (the first real ended mark); rc15's exit (1) observed;
Q-crc-11 CLOSED.** In the architect session on rc15's archive day the offer fired for rc03a with three
answers; Sal answered ended, and the body wrote `Complete: [~] 2026-10-01 (Sal)` after the stage's
`Depends-on:` line. The engine renders `ended (declared 2026-10-01 by Sal)` with its archived citer, the
awaiting set and the WAITING band no longer carry it, and the offer did not fire for it again in the
same session. Four firings, four declines, one mark — the cost Q-crc-11 ledgered is paid. The reason
for the ending lives where it always did: the 2026-09-15 withdrawal entry below, folded into rc03.

**2026-10-01 — rc15 RATIFIED (eleven stages complete); all three exit criteria graded MET as written,
exit (1) on this session's observation.** Sal ratified in the same architect session, directly after
rc03a's mark landed. Exit (1): rc03a carries the ended mark, renders a state that is neither `complete`
nor awaiting, is listed in no WAITING band, and the offer did not fire for it after the mark — the
charter said "the next architect session"; the observation is the same engine read, taken minutes
later rather than days, and Sal took it as meeting the criterion (no R-crc-12 revision: the criterion
measured as written and was met). Exit (2): the concluded-only fixture renders `ended-from-explore`,
never `exploring`, in the engine suite's fifteen-cell table and the real-CLI probe the fresh system
pass ran. Exit (3): every production executed against its near-misses (bare `[~]`, malformed date,
trailing suffix, the duplicate slot, the shared lexical limit), and `orbit-orientation` carried no
delta — three directories under the change's `specs/`. Next in dependency order: Phase 2's rc02b,
rc03 and rc04b are open; the retirement-class sweep runs as its own small change on Sal's word
(Q-crc-28, ratified 2026-10-01).

**2026-10-01 — rc16-retirement-sweep DECLARED (the stage count moves to 25).** In the same architect
session, on Sal's word, Q-crc-28's ratified direction became a stage rather than a standalone change:
the program keeps the record of why nine living sentences across three capabilities outlived the
limits they described, and the exit criteria are plain measurements (the sites grep to zero; MODIFIED
blocks only; the next project-wide audit raises nothing on the set, and Q-crc-28 closes on that run).
Pointer-only, no mechanism, three capabilities at R-crc-1's ceiling. Next in dependency order: rc16 is
free (no dependencies) and is the cheapest open stage on the board; Phase 2's rc02b, rc03 and rc04b
remain open.

**2026-10-01 — rc16-retirement-sweep ARCHIVED (declared, explored, proposed, applied, reviewed and archived
in one day).** The nine living sentences Q-crc-28 ledgered are retired in baseline: six MODIFIED blocks across
the three capabilities synced byte-verified, the explore body's six copies moved with their owners, and the
eleven quoted sentences grep to zero over the synced baselines and the body — exit (1) MET; three directories,
MODIFIED only — exit (2) MET as written (the proposal's first "two capabilities" count was wrong, not the
charter). Exit (3) waits on the post-archive project-wide audit, its own invocation; Q-crc-28 closes on that
run with the two `orientation.ts` comments named as module-true and the class C trigger carried in its closed
record. The cycle: fresh + in-context on the proposal (the enumeration short by three sites — the stage's own
thesis turned on itself); apply 11/11 with 3.3 an at-archive note and one instrument correction; the blind pair
on the pushed apply commit (fresh 0C/2W/1S, external GPT-5 Codex 1C/2W/2S, zero CRITICAL overlap, one converged
defect at two severities) walked in two logs; an in-context confirm 0C/2W/1S walked to zero in the record layer;
a COMPUTED PASSED gate, the sixth rc-stage through one and the fifth through the pair. Four findings in one
shape across the cycle — a pointer chosen from a title rather than a read body — which is the class this stage
exists to retire. Next in dependency order: rc16 awaits ratification after the audit; Phase 2's rc02b, rc03 and
rc04b remain open.

**2026-10-01 — Architect session: rc16-retirement-sweep RATIFIED (twelve stages complete); Q-crc-28 CLOSED.**
The post-archive project-wide audit (`orbit/.orbit-runs/audit-drift-2026-10-01T19-22-49Z.json`) detected no
drift — exit (3) MET — so all three of rc16's exit criteria graded MET as written and Sal ratified completion
through the offer. Q-crc-28 closed on that run with its dated line: the two `orientation.ts` comments named as
module-true and untouched, the class C trigger (D-rc16-1) carried in the closed record, CLAUDE.md's historical
D3 line left outside the set. One day, declaration to ratification: the shortest cycle on the program, and the
one whose finding class — a pointer chosen from a title rather than a read body — appeared four times inside
the change built to retire it. Next in dependency order: rc13 (premised; rc13a/b/c complete) and rc04 (premised;
rc04a/c/d complete) are parent stages whose children have shipped; Phase 2's rc02b, rc03 and rc04b remain open.

**2026-10-01 — Architect session: rc13-explore-mechanism and rc04-readiness-record declared ENDED (Sal), through
the unprompted route.** Both are split parents under R-crc-9 — rc13 into rc13a/b/c (2026-09-15, the ruling's first
application), rc04 into rc04a/b/c and later rc04d (2026-09-21) — whose headings were retained as the program's record
of the problem and the evidence while every exit criterion moved to a child. As declared stages they could never cite
work and would render `premised` forever. The ended mark fits by its owner's own rule: ending asserts nothing about
the work, and on `premised` it means declared and withdrawn before any work, the doc-layer twin of Considered & out.
rc13's criteria are all owned by ratified children; rc04's exit (1) is still owned by rc04b, which keeps its own
charter and renders `premised` — ending the parent heading ends nothing of the child. The stage count does not move
(25); the headings and their prose stay byte-unchanged below the slot. Arc-done is unaffected either way: Q-crc-29
already records that an ended stage holds the predicate open until `orbit-pr-lifecycle` says "archived OR ended", and
this doc has no program PR. Next in dependency order: Phase 2's rc02b, rc03 and rc04b remain open; the remaining
premised stages are rc05–rc10, rc07b and rc12.

**2026-10-03 — Architect session: rc02b-severity-ladder EXPLORED and its ceiling breach DECLARED.** The
exploration (opened 2026-10-01 on the architect session's recommendation; walked 2026-10-03) measured the
stage at FIVE capabilities against R-crc-1's three — `orbit-review` and `orbit-report-rendering` own the
surfaces between the ladder, the gate and the walk that the charter did not count. Sal held it as one change
(the split declined, recorded in the exploration's Considered & out), a ratified exception in rc04c's shape.
Six decisions, three live rules accounted. Next in dependency order: rc02b is eligible for propose; Phase 2's
rc03 and rc04b remain open.

**2026-10-03 — rc02b-severity-ladder ARCHIVED through a COMPUTED PASSED gate via the blind pair (the seventh
rc-stage through one, the sixth through the pair).** The ladder is defined by CONSEQUENCE, once, in
`orbit-conventions`, and a CRITICAL carries its reproduction: refused at `orbit emit review` without a non-empty
one in every mode, requested of external reviewers by a `## Severity` paragraph that is a checked mirror of the
conventions fence, marked `[unreproduced]` by the renderer as a prefix outside the title token, re-run first at
the walk (`reproduction_rerun`). A lifecycle BLOCK left the scorecard (`blocks` / `## Blocks`, rendered above the
findings, listed first at triage) and P8's ambiguity clause is gone. Exit (1) MET: both halves of the pair
executed the refusal under `--change` and `--doc` (exit 1, empty stdout, no file). Exit (2) MET: an external
CRITICAL without a body parses, counts, renders marked — pinned by test, executed by the fresh half. Exit (3)
MET: walk 1 opened the external CRITICAL by re-running its reproduction (reproduced; then not, after the fix)
and recorded it. CORRECTED FIGURES for the dated MEASURED paragraph above: FOURTEEN per-pass sites, not
sixteen (walk 1's grep); SIX capabilities, not five (propose found `orbit-review-external` owns the prompt's
output format) — the breach declared at six and the pair run at the ceiling. The cycle: fresh + external
(GPT-6 Codex, 2C) + in-context on the proposal, three walks; apply 24/25 in one session (5.4 the handoff,
CLOSED AT ARCHIVE BY OBSERVATION — the first external return under the new prompt wrote its Reproduction
body and the render marked none); the blind pair on the pushed apply commit `245a8879` — external GPT-6
Codex 1C/2W/0S, fresh 0C/4W/5S, zero CRITICAL overlap, one defect converged at two severities (where a
Description body OPENS: the renderer on the label, the gate's reader only on same-line text) and one more
(the four-tuple restated beside its pointer at six sites) — walked in two logs (Sal: A on the one scope call,
the framework requirement's phantom README section); an in-context confirm 0C/0W/2S, its two SUGGESTIONs
carried as residuals; a COMPUTED PASSED gate. The pair's lesson is Q-crc-15 one layer wider than it was drawn:
the external grammar lived in THREE readers — the trend counter was the third — and the exploration's
"read file by file" closure surfaced two; all three now follow the field-line rule and the Description-opening
rule, stated once in the format owner and pinned through both gate-facing readers by test; collapsing them
stays Q-crc-15's. One instrument lesson for every later stage: the engine's user-validation subset rule reads
the literal `(User-validation` marker on the task LINE, and a line without it leaves apply `ready` at N-1/N
and the graph pointing at a stale proposal review. 2429 tests green (2376 → 2429). Next in dependency order:
rc02b awaits ratification; Phase 2's rc03 and rc04b remain open.

**2026-10-03 — Architect session: rc02b-severity-ladder RATIFIED (thirteen stages complete).** All three exit
criteria graded MET as written on the cycle's record — (1) the write-gate refusal, executed by both halves of the
blind pair under `--change` and `--doc`; (2) the unreproduced mark on a parsed, still-CRITICAL external finding,
pinned by test, executed by the fresh half, and observed on the first live external return under the new prompt;
(3) walk 1's step (0) re-run of the external CRITICAL's own reproduction, recorded as `reproduction_rerun` —
none revised, none an instrument correction. The post-archive project-wide audit (`orbit/.orbit-runs/audit-drift-
2026-10-03T21-46-06Z.json`) detected no drift beyond two prose suggestions written during the stage's own cycle,
both walked to zero the same hour (`address-reviews-2026-10-03T21-47-30Z.json`): the stage section's exploration
sentence now points at the archived file, and the `Review mode decision framework` requirement's dated measurement
was trimmed out of baseline as a hotfix. Q-crc-15 WIDENED in the same session: the external-format grammar has
three readers, not two, and the standing recommendation now says re-measure before sizing. Two days, exploration to
ratification. Next in dependency order: Phase 2's rc03-review-genres and rc04b-forward-recommendation are both
premised and both depend only on rc02 (complete) — either is eligible for exploration; the remaining premised
stages are rc05–rc10, rc07b and rc12.

**2026-10-04 — rc04b-forward-recommendation ARCHIVED through a COMPUTED PASSED gate via the blind pair (the eighth
rc-stage through one, the seventh through the pair; the whole cycle ran 2026-10-03, the confirm crossing midnight UTC).**
Every independent pass now owes a `direction` — `{disposition: forward|hold, reasoning}`, rc04a's vocabulary — refused at
the write gate where produced (fresh/external, every mode, keyed on class; an unrecognised class refused naming the three
values), marked where it cannot be (`### Direction` between Suppressed and Commentary; `[no direction]` by absence,
`[direction malformed]` with no body on an external section the format reads as malformed; omitted on in-context), the gate
reading nothing new (three-readers test; `gates.ts` diff exactly the `export` keyword on `isIndependent`, `trail.ts`
untouched). Five capabilities DECLARED (D-rc04b-7), eleven blocks synced 11/11 byte-verified through the engine's own
merge, the capability count unchanged at 21. The cycle: proposal fresh → external (GPT-6 Codex) → in-context, nineteen
findings, zero CRITICAL, zero repeats; apply 18/19 in one session; the **blind pair on the pushed apply commit
`2f482e65`** — external GPT-6 Codex 0C/2W/1S, fresh 0C/1W/5S — **zero CRITICAL on either half, the program's first
system pair with none**; zero findings converged in location, ONE pattern converged (a rule stated twice: the schema
field note and rc04c's ordering check), fixed at both sites on each log's own evidence; the external's one mechanism
finding — a bare carriage return escaping blockquote containment — was PRE-EXISTING on the recommendation, reproduction
and commentary bodies and inherited by the fourth, closed once in a shared splitter with a four-body pin; two scope
calls by chat (2A: a ninth MODIFIED block qualifying the Commentary requirement so the two quarantined slots read as one
zone; 4A: extra keys inside `direction` DECLARED carried-never-read rather than refused — R-crc-6); an in-context
confirm 0C/0W/3S whose SUGGESTIONs ride the readiness record. **Task 4.5 closed at archive by observation on BOTH
halves**: the fresh emit's direction accepted first time; the external return's `## Direction` conforming, with three
parser probes planted in its reasoning, rendered unmarked and contained; the halves DISAGREED (hold against forward) —
the slot producing two cited views where before there was prose, which is what Goal G1 asked for. Q-crc-30 and Q-crc-31
opened at archive; the readiness record accepts seven residuals, headlined by rc07's distinction. 2465 tests green
(2429 → 2465). Position is engine-computed: `orbit architecture status` renders rc04b quiescent, awaiting ratification.

**2026-10-04 — Architect session: rc04b-forward-recommendation RATIFIED (fourteen stages complete).** All three exit
criteria graded MET as written on the archived tree: (1) an independent pass without a recommendation is INCOMPLETE —
refused at the write gate where produced (fresh/external, every mode; the CLI case pinned with empty stdout and no
file) and MARKED where it cannot be (`[no direction]` on a section-less external file and on a renderable
prior-generation fresh emit; `[direction malformed]` on a bad section), the gate reading nothing new (the
three-readers test; `gates.ts` changed by the `export` keyword alone, `trail.ts` untouched); (2) the recommendation
RENDERS under the single-voiced rules — `### Direction` inside the quarantine, the label engine-printed, the reasoning
contained, the engine tail last, the near-miss golden pinning a gate line and an eligibility line inside the
containment — and walk 1 of the system cadence tightened the rule past apply by closing a pre-existing bare-CR escape
in one shared splitter over all four verbatim bodies; (3) the prompt template carries `## Direction` as a NAMED FIELD,
installed byte-equal from the owning delta's fence and held by the parity test, and the first external return under it
wrote the section with a conforming opener and three planted parser probes, rendered unmarked and contained, while
the fresh half's emit carried its direction on the first attempt — the halves DISAGREED (hold against forward), the
slot producing two cited views for the readiness author where before there was prose. Ratified through the offer
(Sal): `Complete: [x] 2026-10-04 (Sal)`. The post-archive project-wide audit raised one WARNING — CLAUDE.md's unmarked
shipped-since count, moved to eleven at the walk — and nothing on the retired set or the archives. Q-crc-30 and
Q-crc-31 stand as opened at the archive. Next in dependency order: Phase 2's rc03-review-genres is premised and
depends only on rc02 (complete) — eligible for exploration; the remaining premised stages are rc05–rc10, rc07b and
rc12.

**2026-10-04 — Architect session: rc03-review-genres SPLIT into rc03b-pass-genres + rc03c-verification-record
(R-crc-9, fourth preventive application).** Opened from the explore session that ran the same evening. The
exploration re-measured the charter against the shipped tree before designing anything and found three of its five
items already shipped or standing on retired ground (rc04b's `direction`; rc02's fixed classes and slot; clause (c),
retired by rc02c, which the "removal is confirmed by verification" paragraph argued against). Three rules captured with
accounted Mechanism entries — genre computed from class × mode × trail position (DERIVED, six cells); a review-genre
brief carries no findings and no trail pointer (BOUNDED — rc03a's eleven channels re-enumerated at current source lines,
the launching brief the declared residual; the rule dissolves the channel problem on every order, so D-rc03a-9's
ordering and rc03a's attestation idea are both unnecessary); the verification record (SOURCED). Three scope calls
ratified in chat (Sal, A on all): disagreement handling assigned to rc08 with the name kept here; external-first
ordering not carried (a rider for rc10); the split. One-launch DESCOPED on a read of `gates.ts:798-805` — the window the
charter describes was closed by rc02's open-pair outranking. Declared here: `rc03b-pass-genres` (Depends-on rc02;
conventions, review, review-external; no engine code) and `rc03c-verification-record` (Depends-on rc03b;
emit-composition, report-rendering, review). Exit criteria partitioned across the children in their mechanism's terms;
the parent heading retained as record with a SPLIT note, its `Complete:` slot left `[ ]` for Sal's word. The exploration
RENAMED to `orbit/explore/rc03b-pass-genres/` and repointed at the first child (the rc04 precedent, commit `5565d8d0`).
Stage count 25 → 27 at both marked sites. Q-crc-22 gained a 2026-10-04 note
narrowing its producer side. Position is engine-computed: `orbit architecture status` renders rc03 premised, rc03b
exploring, rc03c premised.

**2026-10-04 — Architect session: the rc03 split RECONCILED into the doc after the exploration's resume.** The resume
sitting (same evening, under the renamed `rc03b-pass-genres`) changed four things the doc had to follow. (1) rc03b's
charter lost its "gains one sentence" launch line — a spawn inside a `--reviewer external` invocation would breach the
no-chaining contract and the eligibility line already renders `--fresh` for an empty pair (D-rc03-5 amended; corrected in
the charter the same sitting). (2) A TWELFTH anchoring channel, in a SPEC rather than the body: `orbit-review-external`'s
recommended-session note tells an iteration-3+ external to continue a same-AI session so it can verify its earlier
findings — found by D-rc03-3's own residual method; rc03b's charter now names it. (3) rc08's charter gains what the split
assigned to it and the resume found for it — the disagreement class's handling rule (D-rc03-6) and Q-rc03-5, the T0
emit's `next_recommended` naming a single-half walk. (4) rc10's charter carries the external-first ordering as a RIDER
(D-rc03-7), not an obligation. The exploration's D-rc03-4 (the verification record) is `Disposition: assigned
rc03c-verification-record`, so rc03b's propose consumes two live rules. Nothing else in the two sessions is outside the
doc: the stage declarations, both stage-count markers, the Q-crc-22 note and the rename are in the previous entry.
Position is engine-computed: rc03 premised (parent, undated), rc03b exploring, rc03c premised.

**2026-10-04 — rc03-review-genres declared ENDED (Sal), through the unprompted route.** The retained split parent observed
`premised` with an undated slot; every exit criterion it carried is owned by rc03b or rc03c, so the mark asserts nothing
about the work and matches rc13's and rc04's. Fourth ended mark in the program.

**2026-10-04 — rc03b-pass-genres ARCHIVED through a COMPUTED PASSED gate via the blind pair (the ninth rc-stage through
one, the eighth through the pair).** A pass's genre — REVIEW or VERIFICATION — is COMPUTED from three trail facts and
stated ONCE as a fenced six-row table in `orbit-conventions`' `Review mode decision framework`, mirrored fence-pinned in
the review body; "pass genre" is qualified throughout and the gate reads nothing of it (R-crc-13). A REVIEW-genre brief
names the artifacts, project context, baselines, lenses and (system mode) the commit range with the trail excluded, and
NO finding, NO prior pass, NO trail path to read — the twelfth channel (iteration 3+'s "carry context from a same-AI
session") deleted; Cycle context is the iteration line alone. Three capabilities at R-crc-1's ceiling, 1 ADDED + 5
MODIFIED synced 6/6 byte-verified through the engine's merge; no engine code (hash pin over 17 files); capability count
unchanged at 21. The cycle: proposal fresh → external (GPT-6 Codex) → in-context, zero repeats; apply 15/16 in one
session; the **blind pair on the pushed apply commit `82b6f757`** — fresh 0C/4W/3S, external GPT-6 Astra 0C/3W/0S —
converging on ONE defect (the in-context genre probe counted every external file and read only the literal class field,
where the trail reader drops rejected returns and infers legacy `flags.fresh`; Sal: A — the accepted-pass rule with
acceptance named as the probe's one known limit, pinned by a six-row decision table) and each half finding what the other
could not: the fresh half that the commands a brief tells a reviewer to RUN surfaced prior passes (`git log` subjects,
the status gate reason — now hash-only reads, the remaining output channels named in the owner's residual), the external
half that the fresh brief as written made its own reader dispatch again (now the WORKER, not a dispatcher). The brief
grep exempts output destinations BY LINE and reaches every reference a REVIEW pass loads to read (Sal: a, twice); a
reworded read naming no path is the owner's named residual, pinned green so the boundary is visible. The in-context
confirm was the program's first pass to RECORD its own genre — VERIFICATION, decided from the metadata probe alone — and
its four findings were all the walks' cascade stopping one site short (Step 1's `git log --oneline`; one scenario
parenthetical), closed at walk 3. Task 3.5 (exit (3)) closed at archive by observation. The readiness record accepts five
residuals, headlined by rc07's distinction. **2507 tests green.** Position is engine-computed: rc03b
quiescent-awaiting-ratification; rc03c-verification-record premised, its dependency now met.

**2026-10-04 — Architect session: rc03b-pass-genres RATIFIED (fifteen stages complete).** All three exit criteria graded
MET as written, each measured on the final tree: (1) the class-to-genre table is stated once in `orbit/specs/`
(`orbit-conventions`' `Review mode decision framework`), present elsewhere only as the review body's named, fence-pinned
mirror (R-crc-14's mirror corollary — the exception the owner's own sentence states) with every other surface pointing;
(2) zero hits under the PHRASE and REGION rules across all fifteen generated skills, the planted pointers red — the rule
as the system walks left it, by-line output exemption and the five read references; (3) the first committed external
prompt under the new surface (`external-prompt-system-2026-10-04T03-49-33Z.md`) carried the iteration line alone, observed
at the walk and confirmed by the external half. Ratified by Sal through the offer, after the post-archive project-wide
audit came back clean. Carried, not captured as rulings or questions this session: the readiness record's five accepted
residuals (`archive-2026-10-04T04-20-29Z.json`) — among them the output channels (commit subjects carrying per-pass
counts, the status gate reason) named as a rider for a later owner, and the acceptance blind spot of the in-context
probe, which is rc03c-verification-record's to close with the engine function its dependency now permits.

**2026-10-04 — rc03c-verification-record ARCHIVED through a COMPUTED PASSED gate via the blind pair (the tenth rc-stage
through one, the ninth through the pair).** The pass genre is now COMPUTED by the engine: ONE exported function beside
the trail reader (`src/core/artifact-graph/pass-genre.ts`) implements `orbit-conventions`' table over the ACCEPTED pass
set — a walk's mode resolves by source basename through that set — and every review emit stores `pass_genre` and
`verified_walks` (unnarrowed), refused in the payload. A VERIFICATION-genre payload OWES `verification:
[{title, file, verdict}]`, one `landed` | `regressed` per `resolved` walk entry at every severity, keyed as the gate keys
resolutions; the write gate refuses it absent (naming each owed key with its walk), incomplete, stray, duplicated, or on a
REVIEW-genre pass, and pairs every `regressed` with a finding's `walk_entry`. The report prints the genre on the internal
header, a FRAME `### Verification` section, a `walk entry:` line, `[outside the walk record]` and `[no verification
record]`. The verdict definition is a fenced production the review body carries as a CHECKED MIRROR. Three capabilities,
4 ADDED + 6 MODIFIED synced 10/10 byte-verified through the engine's merge; `gates.ts`, `trail.ts` and the schema carry
no diff (rc03b's hash pin, moved three times for the two edited engine files and recorded each time). The cycle: proposal
fresh → external (GPT-6 Codex) → in-context VERIFICATION, zero repeats; apply 16/17 in one session; the **blind pair on
the pushed apply commit `80a9e343`** — external GPT-6 1C/1W/1S and fresh 0C/3W/3S, **zero findings shared** — the external
half on engine edges (a same-second walk read as not preceding its review, because the emit surface's collision bump
checked only its own filename — Sal: B, trail tokens unique per trail directory, a tenth block; the residual check's
undefined base with no independent pass), the fresh half on the body a verifier executes (the verdict definition an
installed skill could not open — now a mirror; a one-directional probe/engine reconciliation — Sal: a, both directions,
the unnamed probe case an accepted residual; which system passes a verification runs). Committing the fresh pass file
ALONE before any walk edit put both walks' edits inside the confirm's residual range — the ordinary-case limit the fresh
half named, avoided in practice. The in-context confirm was the first pass emitted under the mechanism it ships:
VERIFICATION over both walks, nine owed verdicts all `landed`, one SUGGESTION (a fingerprint stamp no ripple record
listed). **Exit (3) MET** by design D9's instrument, run verbatim — task 4.5 closed at archive by observation. Q-crc-20's
entry now names `verified_walks` plus the sweep scope as its nearest proxy, NOT a closure. The readiness record accepts four
residuals, headlined by rc07's distinction. **2559 tests green.** Position is engine-computed: rc03c
quiescent-awaiting-ratification.

**2026-10-04 — Architect session: rc03c-verification-record RATIFIED (sixteen stages complete).** All three exit criteria
graded MET as written, each measured on the final tree: (1) the pass genre is a COMPUTED field — `computePassGenre` in
`src/core/artifact-graph/pass-genre.ts`, stored as `pass_genre` / `verified_walks` on every review emit — with its own
body section (Step 5's VERIFICATION branch) and its owed record; `gates.ts`, `trail.ts` and the schema's cadence tokens
carry no diff, held by rc03b's hash pin; (2) VERIFICATION-genre emits carry per-resolution `landed` / `regressed`, written
by 1.2's fixtures and by the stage's own confirm (nine verdicts); (3) MET by design D9's instrument, fixed at propose and
run verbatim on `review-system-2026-10-04T17-09-30Z` — zero findings at WARNING or above outside the walk record — the
rendered cross-check agreeing. Ratified by Sal through the offer, after the post-archive project-wide audit was walked to
zero (its one SUGGESTION added the stage section's `Shipped as:` line). Carried, not captured as rulings or questions this
session: the readiness record's four accepted residuals (`archive-2026-10-04T17-12-45Z.json`) — among them the second
probe/engine divergence (a walk naming a pass file absent from this trail), unnamed in `orbit-conventions`' KNOWN LIMIT
and handed to the next stage that touches that capability, and Q-crc-20, which rc03c names a proxy for and does not
close. With rc03b and rc03c both ratified, the split parent `rc03-review-genres` (ended 2026-10-04) has every exit
criterion owned by a ratified child.

**2026-10-04 — rc07b-reference-roundtrip ARCHIVED through a COMPUTED PASSED gate via the blind pair (the eleventh rc-stage
through one, the tenth through the pair).** A payload schema reference is now PROVEN BY EXECUTION: every one of the six
schema blocks across five references carries `json example <scope>…` blocks — real JSON, exactly a payload the body tells
the AI to write — and `test/core/reference-roundtrip.test.ts` submits each, unchanged, through `composeAndWriteEmit` in a
fresh disposable project per (example, scope) pair, with no engine-owned strip, seeding the trail only with the passes a
`formed_against` names; an example attaches to its NEAREST PRECEDING schema block and a block's examples jointly carry its
AI-supplied keys (`verification` exempt by name, the one genre-dependent key). audit-drift's `findings_total` /
`findings_by_category` are ENGINE-COMPUTED from `findings` and refused in the payload, over refused malformed inputs, so
the clean-recommendation branch can no longer disagree with the findings; the reference was rewritten to its owner's shape
and `KNOWN_DIVERGENCE` is RETIRED (exit (2)). FOUR capabilities against R-crc-1's ceiling of three (D-rc07b-7, declared and
ratified at exploration), 2 ADDED + 4 MODIFIED synced 6/6 byte-verified through the engine's merge. The cycle: proposal
fresh → external (GPT-6 Astra) → in-context VERIFICATION; apply 19/19 in one session; the **blind pair on the pushed apply
commit `d949639e`** — fresh 0C/1W/3S and external GPT-6 Astra 1C/2W/1S — **converging, by execution on both halves, on
the stage's own new mechanism**: the counts accumulator was a plain object, so a category named `__proto__` vanished and
`constructor` / `toString` concatenated onto inherited functions (fresh WARNING, external CRITICAL with its script) — now
null-prototype, pinned by an engine test on the written file. They converged a second time on the address-reviews example
submitted to scopes its provenance cannot occur in (Sal: A — three examples, one per provenance). Each half found what the
other missed: the fresh half two block grammars across the two suites (now one, in the shared helper) and a non-stock
example phrasing; the external half the consumer reference's retired review shape beside the audit-drift block apply had
repaired, and a refusal message promising a range the gate never checked (Sal: B — the message states the type-only check;
the range stays the body's). Two walk logs; an in-context VERIFICATION confirm graded six entries `landed` with an empty
residual check from `b5897ca2`. Exits (1) and (3) were MEASURED at apply: (1) by mutating the real audit-drift example
(the suite failed with the gate's own `unknown payload key 'depth'`), (3) against the built CLI in both scopes
(`findings_total: 2`). Two sizing lessons: the exploration counted four voices on audit-drift's shape and apply's residue
sweep found a fifth (address-reviews' `internal-findings-format.md`), the external half the block beside it; and the
`emit-composition.ts` hash pin moved three times, each recorded. The readiness record (`archive-2026-10-04T19-11-53Z.json`)
accepts five residuals, headlined by rc07's distinction. **2583 tests green** (2559 → 2583). Position is engine-computed:
rc07b quiescent-awaiting-ratification.

**2026-10-04 — Architect session: rc07b-reference-roundtrip RATIFIED (seventeen stages complete).** All three exit
criteria graded MET as written, each measured on the final tree: (1) a reference whose documented shape the surface
refuses fails a test BY EXECUTION — re-measured in this session after the walks, by re-adding `depth` to the real
audit-drift example: `reference-roundtrip.test.ts` failed carrying the write gate's own `unknown payload key 'depth' for
'audit-drift'`, and passed again on revert; (2) the `KNOWN_DIVERGENCE` exemption is RETIRED, the charter's first branch —
named nowhere in either suite, with a `no divergence is tolerated` negative test in its place; (3) the audit-drift
reference and its emit surface agree — measured at apply against the built CLI in both scopes, and observed in use by the
post-archive project-wide audit, whose payload followed Step 10 to the reference's example and whose counts the engine
computed (`audit-drift-2026-10-04T19-14-51Z.json`, `findings_total: 1`). Ratified by Sal through the offer, after that
audit was walked to zero (its one SUGGESTION added the stage section's `Shipped as:` paragraph). Carried, not captured as
rulings or questions this session: the readiness record's five accepted residuals
(`archive-2026-10-04T19-11-53Z.json`) — among them the consumer-side description of the audit-drift and review JSON in
address-reviews' `internal-findings-format.md`, which no spec owns and which the exploration's four-voice count missed,
handed to the next stage that touches the address-reviews input formats; and the archive schema's `audit.summary_path`,
recorded at design for the next stage that touches the archive emit.

**2026-10-04 — Architect session: rc08-walk-completeness's dependency re-pointed (Sal).** `Depends-on:
rc03-review-genres` → `Depends-on: rc03c-verification-record`. rc03 is a split parent, ENDED 2026-10-04 with every
exit criterion owned by a child; the slot named a stage that will never complete, so the doc read rc08 as waiting on
unfinished work. The dependency the charter actually carries — "the R-crc-4 verification pass over the walk's own diff
precedes any further review" — is the verification record rc03c shipped, and rc03c depends on rc03b, so the edge
subsumes both children. The charter's prose references to rc03 (the DISAGREEMENT class's name staying with rc03's
record) are unchanged: they cite rc03's record, not a dependency.

**2026-10-04 — Architect session: the rc06 split DECLARED (Sal).** The rc06 exploration
(`orbit/explore/rc06-scenario-test-map/`, boundary emit `explore-2026-10-04T19-29-45Z.json`) ratified
the split (D-rc06-6) and this session declares it: `rc06a-scenario-map` (the tag and ledger grammar, the
engine-computed map at `orbit status --change <name> --scenarios`, the `orbit validate` check — rc06's
exits (1) and (2), (2) revised under R-crc-12's first case, plus a self-measured exit (3)) and
`rc06b-map-readers` (verify-change and system Pass 0 read the map — rc06's exit (3)), rc06b depending on
rc06a. rc06's heading is retained as the record with a SPLIT paragraph; its charter is kept as written and
named superseded in three terms. rc10's `Depends-on:` moved from rc06 to rc06a, with a RIDER naming the
apply-emit pointer its charter assumed and D-rc06-3 retired. Stage count 27 → 29 at both
marked sites (this entry's mark is the third; the previous entry's was unmarked as history). rc06 stays
`exploring` while the exploration cites it; it takes its ENDED mark once both children have shipped, as
rc03 did. Next: propose rc06a from the exploration.

**2026-10-04 — Architect session: rc06a-scenario-map RATIFIED (Sal).** Offered on its quiescent-awaiting state and
ratified; all three exit criteria graded MET as written — (1) on the post-apply ERROR the validation suite pins (an
undeclared ADDED scenario with every task checked fails validate naming its key; INFO before apply is design D4's
refinement of WHEN, not a revision of the criterion), (2) on `orbit status --change <name> --scenarios` rendering the
four cover kinds as separate columns with ORPHAN and MALFORMED by name, (3) on 35 of 35 delta scenarios declared at
archive. Archived through a COMPUTED PASSED gate (`archive-2026-10-04T22-43-17Z.json`); its readiness record carries
five accepted residuals, one of which — a tag naming a repeated title's key renders ORPHAN, unpinned — is handed to
rc06b-map-readers, whose readers interpret the surface. rc06 keeps its heading as the split record and takes its ENDED
mark once rc06b ships, as rc03 did.

**2026-10-05 — rc06b-map-readers RATIFIED (Sal, at the architect offer).** Both exit criteria graded MET as written: (1) on
the verify body's coverage step naming `orbit status --change <name> --scenarios --json` with no prose-tracing instruction
(body test), (2) on both system blind-pair halves consuming the map at Pass 0. Archived through a COMPUTED PASSED gate
(`archive-2026-10-05T00-46-38Z.json`), readiness ready with six accepted residuals; the undeclared-scenario stop is proposed
to rc10-apply-closure as a rider. Baseline capabilities 22 → 23 (`orbit-verify-modifications`). A post-archive project-wide
audit found one WARNING — archive-change's additions preamble claimed an unchanged upstream portion the narrowed
`Generated-file disposition` names as edited — walked to zero the same session (`orbit/.orbit-runs/address-reviews-2026-10-05T00-50-35Z.json`).

**2026-10-05 — rc06-scenario-test-map declared ENDED (Sal), through the unprompted route.** The retained split parent
observed `premised` with an undated slot; every exit criterion it carried is owned by a child — (1) and (2) by
rc06a-scenario-map ((2) revised there under R-crc-12's first case: no emit carries the map), (3) by rc06b-map-readers —
both ratified, so the mark asserts nothing about the work and matches rc13's, rc04's and rc03's. Fifth ended mark in the
program.

**2026-10-05 — Architect session: the rc08 split DECLARED (Sal).** The rc08 exploration (boundary emit
`explore-2026-10-05T01-02-59Z.json`) settled the split as D-rc08-1 under Sal's delegation of method, and
this session declares it. `rc08a-sweep-evidence` takes the sweep record, the write-gate check of retired
and introduced strings, and ripple-miss attribution: rc08's exits (1)–(3) and charter jobs (1) and (3).
`rc08b-walk-routing` takes discovery, the three lanes, the disagreement rule and the T0 next line: rc08's
exit (4) and jobs (2), (4), (5) and (6). rc08b depends on rc08a. rc08's heading is kept as the record with
a SPLIT paragraph, and its charter is kept as written and named superseded in one term. The staging
directory was renamed `rc08-walk-completeness` → `rc08a-sweep-evidence`, with its citation re-pointed, so
rc08a renders `exploring`; rc08 takes its ENDED mark once both children have shipped, as rc03 and rc06
did. Stage count 29 → 31 at both marked sites (this entry's mark was the third; unmarked as history
when the count next moved). Sixth preventive application of R-crc-9.

**2026-10-05 — rc08a-sweep-evidence RATIFIED (Sal, at the architect offer).** Exits (1) and (2) graded MET as written:
(1) on both system walk logs carrying `sweep` on 14 of 14 resolved entries and the gate suite's refusals of a surviving
retired string (path and line) and an absent introduced text (path and text — an absent text has no line, the reading the
archived tasks' at-archive note records); (2) on system walk 1's `ripple_miss_of` naming proposal walk 1's entry
(`kind: query`), counted `ripple_misses: 1`, beside the confirm's one `regressed` verdict. Exit (3) is PENDING BY DESIGN,
not graded: the charter places it on the cadence of the stage after rc08a, read from `ripple_misses` plus the `regressed`
count and recorded in THAT stage's archive; rc08a's own cadence (1 attributed miss, 1 regression) is its baseline, not its
measure. Ratified on the recommendation that unmeasured is not unmet (R-crc-12) — the first ratification in the program
with an exit criterion open, stated here so the mark does not imply otherwise. Archived through a COMPUTED PASSED gate
(`archive-2026-10-05T02-53-30Z.json`), readiness ready with six accepted residuals; Q-crc-32 opened; the
`orbit-engine-gates` sentence rides rc08b. The post-archive project-wide audit found one SUGGESTION — walk provenance in
the `orbit-emit-composition` baseline — walked to zero the same session
(`orbit/.orbit-runs/address-reviews-2026-10-05T03-03-04Z.json`).

**2026-10-05 — Architect session: rc17-blind-pair-command DECLARED (Sal).** Proposed by Sal during rc08b's
system walk, after the program's first blind pair run with the external half launched from the command
line (`codex exec`, read-only, the prompt verbatim on stdin): the pair is one slot and should be one
command, so the engine never waits on a half and the user never sequences one. Declared premised in
Phase 4, depending on rc08b; it narrows D-rc03-5 (the review body's no-launch sentence), and its charter
says why no-chaining holds. It takes rc08b's system walk 1 redesign (external W1, Sal: C, routed to
`orbit/explore/blind-pair-command/` in `address-reviews-2026-10-05T14-37-54Z.json`): the pair diagnosis
ignores passes an earlier slot consumed, which the shipped cadence never reaches and a failed half of
the new command would. Stage count 31 → 32 at both marked sites
(this entry's mark is the third; the previous entry's is unmarked as history).

**2026-10-05 — rc08b-walk-routing RATIFIED; rc08-walk-completeness ENDED (Sal, at the architect offer).** rc08b's exits
graded MET as written: (1) by test 4.1 against the real engine (discovery yields both passes of one active change; two
logs, one per `source_path`, empty the gate's list), the "naming the change" half held by the row-2 text test, and
observed live by system walk 1 except DISCOVERY row 2 — that walk was invoked with the change name, so a bare invocation
was never seen (task 6.3, closed with the gap noted); (2) on system walk 1's log, every entry carrying `remedy` and the
routed redesign carrying `routed_to: "orbit/explore/blind-pair-command/"`; (3) on `review-external-2026-10-05T14-14-36Z.json`,
whose `next_recommended` ends at the save step. Archived through a COMPUTED PASSED gate
(`archive-2026-10-05T15-14-29Z.json`), readiness ready with five accepted residuals. rc08a's exit (3), measured on this
cadence as its charter places it, read 4 (0 ripple misses + 4 regressed; two are ripple misses proper), not zero — recorded
in rc08b's archive; rc08a's mark is unchanged and the miss stands beside it. rc08 takes its ENDED mark through the offer,
as rc03 and rc06 did: its heading stays as the record and every exit criterion is owned by a child.

**2026-10-05 — Architect session: rc17 SPLIT into rc17a-invoked-coverage + rc17b-blind-pair-command; R-crc-4
AMENDED (Sal).** The rc17 exploration (`orbit/explore/rc17a-invoked-coverage/`, opened as `blind-pair-command`)
closed with sixteen decisions and no open questions, and Sal's calls from extended use reframed the stage:
both reviewed gates become `[<first>, in-context]`, the first slot covered by whatever the user INVOKED (a pair
needs both halves; a single covers alone), a per-gate `orbit/config.yaml` preference choosing only what is
presented, default blind-pair — the R-crc-4 amendment recorded in the rulings index, the rulings count
unchanged; the external runner per user, set at init, auto-launching every external half; the command
committing and pushing; and a walk discovering every unwalked pass at any severity, with the review emit's
next naming the change rather than a path. Measured by capability the stage was five or six, so it split
under R-crc-9, the seventh preventive application: rc17a takes the engine half (three capabilities), rc17b
the command (three, a fourth to be declared at propose if init's owner adds one). The parent keeps its heading
as the record, its exits owned by the children, its slot unmarked until both are done. Stage count 32 →
34 at both marked sites (this entry's mark was the third, unmarked as history by the rc17c entry; the previous
entry's is unmarked as history).

**2026-10-05 — Architect session: rc17b gains a shorthand per reviewer class (Sal).** Sal found the review
interface incoherent in use: `--fresh` is the only shorthand on the `--reviewer` axis, so `--external` was refused
each time they reached for it. Of the two coherent shapes — retire `--fresh` so every class is spelled
`--reviewer <class>`, or give every class a shorthand — Sal chose the second. Slotted into rc17b's charter, beside
the new `blind-pair` value it names: `--in-context`, `--external`, `--blind-pair`, each exactly
`--reviewer <class>`, mutually exclusive with each other and with an explicit `--reviewer`. It sits inside
capabilities rc17b already carries (`orbit-review` owns the flag table, `orbit-onboard` the command table), so
the stage's size is unchanged and no exit criterion moves; `--fresh` stays, so no other spec needs a sweep. The
commands the engine prints are untouched here.

**2026-10-05 — rc17c-short-review-next SPLIT from rc17a at its propose (Sal).** Before writing any artifact,
propose counted the capabilities rc17a's five rules touch against the specs that restate them. D-bpc-16 (the
review emit's next names the change, never a path) reaches two specs the exploration's count missed:
`orbit-report-rendering`, whose renderer fails any review emit whose `next_recommended` is not the self pointer
(so every emit already on a trail must keep rendering), and `orbit-review`, whose scenario asserts the pointer.
With it rc17a was five capabilities against R-crc-1's three. D-bpc-15 does not need it (the `--from-file` pointer
still reaches the pass), so Sal took the split: rc17c carries D-bpc-16 across `orbit-emit-composition`,
`orbit-report-rendering` and `orbit-review`, depending on rc17a; rc17a keeps three capabilities and the first half
of its exit (3). This is R-crc-9's eighth preventive application, the first caught at propose by a count rather
than at exploration. Stage count 34 → 35 at the marked sites (this entry's mark was the third, unmarked as history by the rc17d entry; the previous
entry's is unmarked as history).

**2026-10-06 — rc17a-invoked-coverage ARCHIVED.** `spec-driven` is version 5: both reviewed gates read
`[invoked, in-context]`, the first slot covered by what the user invoked — a single fresh or external pass, or a
complete pair launched by a `pair: true` T0 — and the blind pair is the recommended first review through the
default `review_preference`, no longer the required one (R-crc-4 as amended). The pair diagnosis reads the
failed slot's eligible set (`foreclosed` retired), and the gate row lists `unwalkedPasses`, so a walk discovers
SUGGESTION-only passes. The cycle: proposal blind pair (fresh + external GPT-6) with three walks and an
in-context verification; apply 20/20; then the program's first LAUNCHED system blind pair — a hand-composed
`pair: true` T0, a fresh subagent and a `codex exec` external (GPT-6 Astra) on the pushed apply commit, blind,
zero findings in common — 1C/5W/3S across the halves, every claim reproduced, walked in two logs (Sal: C and B
on the two decisions); an in-context VERIFICATION graded six `landed` and one `regressed` (three spec sentences
the widened term no longer fit, a ripple miss of kind `query`), walked to zero; a COMPUTED PASSED gate.
Both halves named the same oracle blind spot (it compared no reason text and had no launch-boundary tie), and
the oracle grew from 11.7M to 21.0M cases to close it. Fingerprints 8/8; sync 3 ADDED + 8 MODIFIED, 11/11
byte-verified; the capability count is unchanged. The readiness record accepts five residuals, headlined by
rc07's distinction. Exits (1)–(3) are met as written; ratification is the architect session's.

**2026-10-06 — rc17a-invoked-coverage RATIFIED (Sal)**, through the architect session's offer, all three exit
criteria graded MET as written: (1) the exhaustive oracle, 258 cadences × 81,426 trails = 21,007,908 cases
including `[external, blind-pair]` with rc08b's reproduction pinned by name, shown able to fail on four
re-introduced defects; (2) a single fresh or external pass covers the first slot on both shipped gates, and the
preference in every shape changes only the presented command; (3) a SUGGESTION-only pass is discovered through
`unwalkedPasses` and walked through the real write gate. The split parent `rc17-blind-pair-command` stays
`premised`: rc17b and rc17c still own its other criteria, so no ended mark is due yet.

**2026-10-06 — rc17d-external-runner SPLIT from rc17b at its exploration (Sal).** The exploration opened by
measuring the charter against the baseline before anything was proposed: six capabilities against R-crc-1's three —
`orbit-review`, `orbit-review-external` (its `Command does not run the review or ingest findings` is false once a
runner launches), `orbit-engine-gates` (rc17a's D6 presentation row), `orbit-conventions` (the external class is
"a packaged prompt a human carries"), `orbit-onboard`, and an ADDED capability, because no baseline owns `orbit
init`'s prompts or the global config. The rules divide by dependency: the runner stands alone and serves the old
exits (2) and (3); the pair consumes it and serves exit (1). Sal: "yes split" (D-rc17b-1). rc17d takes the runner
(the ADDED capability, `orbit-review-external`, `orbit-conventions`); rc17b keeps the pair (`orbit-review`,
`orbit-engine-gates`) and depends on rc17d; the setup note moves into init's output, so `orbit-onboard` drops out.
Following the rc04d precedent, rc17b keeps its id so the exploration's citation stays valid. rc17b's exit (2) is
restated for the no-runner path, which the pair command still owns. The exploration also recorded three facts
rc17a shipped that the assigned rules predate (the launch is the `pair: true` T0; membership is by order, so the
fresh emit carries no launch token; the presentation row is this program's edit). R-crc-9's ninth preventive
application. Stage count 35 → 36 at the marked sites (this entry's mark is the third; the previous
entry's is unmarked as history).

**2026-10-06 — Architect session: rc17d's charter re-pointed before propose (Sal).** A pre-propose sweep for specs
the runner makes false found one the exploration's count missed: the review-external T0's `next_recommended` is
required to be the user's paste/save action (`orbit-run-summary-emit`, composed by `orbit-emit-composition`), which a
launched runner makes stale. Sal took A: keep the record as the stated manual fallback, a named limit in rc17d's
`orbit-review-external` delta, rather than B (a launch-aware record, five capabilities). The charter now names the
limit and points at rc17d's own exploration, where the six rules carry Mechanism entries. Stage count unchanged.

**2026-10-06 — rc17d-external-runner ARCHIVED.** A per-user `externalRunner` record in the global config
(`{preset: "codex"}` or `{argv: [...]}`, never a shell string), written by `orbit init`'s interactive setup step and
`orbit config`; `orbit external runner [--json]` prints it resolved and never executes it; `orbit external save`
normalizes a raw return into the trail; and the review body's external branch launches a recorded, reachable runner in
a worktree at the handoff commit and commits its return alone — with no record, today's handoff unchanged byte for
byte. The cycle: proposal blind pair with three walks and an in-context verification; apply 21/22 (5.5 the
user-validation handoff; the five at-archive tasks converted to notes at apply); then a system blind pair launched by
hand with the external half through the new runner — the first external review in the program run with no paste,
closing 5.5 by observation — fresh 0C/3W/3S (forward) and external GPT-6 Codex 2C/5W/0S (hold), converging on three
defects (the shell-interpolated commit message, the recovery line without `--launch`, the fallback naming a removed
worktree), walked in two logs; an in-context VERIFICATION graded ten `landed`; its two suggestions walked; a COMPUTED
PASSED gate. Fingerprints 6/6; sync 7 ADDED + 5 MODIFIED + 1 REMOVED across three capabilities, 12/12 blocks
byte-verified (one doubled blank line collapsed by the merge); baseline capabilities 23 → 24. **Handed to rc17b**
(note 6.5; the proposal walk's ruling, kept at the system walk, Sal: A): `orbit-review`'s scenario "External reviewer
class dispatches to the handoff branch" ("no review passes run in this invocation"), its `--fresh` requirement's
"the cross-vendor handoff a human carries", and the generated review trunk's matching line in
`src/core/templates/workflows/review.ts` describe the external class as packaging-only and now contradict the
external-handoff reference's launch branch; rc17b, which modifies `orbit-review`, corrects all three. Exits (1)–(3)
are met as written; ratification is the architect session's.

**2026-10-06 — rc17d-external-runner RATIFIED (Sal)**, through the architect session's offer, all three exit
criteria graded MET as written: (1) with the Codex preset recorded, the stage's own system review launched its
external half with no paste, and the return was saved by `orbit external save --launch` and committed alone with no
hand edit (task 5.5, closed by observation at archive); (2) with no record, the external branch is today's handoff —
the paste route's five chat items pinned byte-equal to the reference text before runners existed, the sixth item
firing only for a recorded runner that does not resolve; (3) a `codex` on PATH with nothing recorded resolves to
`{"runner": null}` and is never executed (a CLI test with a marker-writing stub). The post-archive project-wide audit
found no drift beyond one charter pointer, walked the same day. The split parent `rc17-blind-pair-command` stays
`premised`: rc17b and rc17c still own its other criteria.

**2026-10-06 — rc17b-blind-pair-command ARCHIVED.** The one-command pair: `/orbit:review --as <mode> --reviewer
blind-pair <change>` (`--blind-pair`) runs a fresh and an external pass of the mode, blind to each other, in one
invocation. The steps: a dirty-tree refusal; the `pair: true` launch; BASE committed and pushed on both routes; the
external half launched through rc17d's runner at BASE or printed for paste; a fresh subagent beside it; the fresh pass
file committed ALONE before the external return is saved with `--launch L` and committed alone; one push; both reports;
no walk. Every half of a pair reads the pair's reviewed state, including both re-runs, and the shorthands `--in-context`,
`--external` and `--blind-pair` join `--fresh`. The default `blind-pair` preference now PRESENTS the pair command,
retiring rc17a D6's interim fresh-review row. rc17d's two packaging-only sentences in `orbit-review` and the trunk are
corrected (its note 6.5). The cycle: a proposal blind pair (the external half re-run after a model-capacity failure) with
three walks and a verification; apply 17/18 (6.5 the user-validation handoff); then the stage's OWN system review run as
one `--reviewer blind-pair` invocation (the long form of `--blind-pair`) — the program's first pair run by its command,
closing 6.5 by observation at archive: BASE `e71cdb14`, the fresh pass `611642b1`, the external return `a2b150c5` (it
finished first and waited outside the repository), one push, no walk between. Fresh 1C/2W/1S (hold) and external GPT-6
Codex 0C/4W/1S (hold), no finding at a shared site, both clustered on the re-run and supersession branches. The fresh
CRITICAL was reproduced with the real CLI: an apply after the launch, a fresh member emitted after it, and the
proposal's "ordinary single" handed the gate a pair it counted blind when it wasn't. Walked in two logs under Sal's A′.
An in-context VERIFICATION graded 8 `landed` and 1 `regressed` (the stale notice keyed on the gate's reason, which names
the first failing clause), walked from the trail. A second verification graded all ten `landed` with no finding. A
COMPUTED PASSED gate. Fingerprints 7/7; sync 2 ADDED + 7 MODIFIED across four capabilities, 9/9 blocks byte-verified;
the capability count holds at 24. Exit (2) is recorded by the harness's no-runner case (note 7.3). The readiness record
accepts four residuals, headlined by rc07's distinction (no fresh or external reviewer read the A′ derivation or the
trail-read STALE rule). Its warnings carry one observation from the run itself: the fresh worker's completion hands its
report to the orchestrating session before Step 7's commit, so the pair reference's "reads neither half's return"
cannot hold for the fresh half. Exits (1)–(2) are met as written; ratification is the architect session's.

**2026-10-06 — rc17b-blind-pair-command RATIFIED (Sal)**, through the architect session's offer, both exit criteria
graded MET as written. (1) The stage's own system review ran as one `--reviewer blind-pair` invocation: BASE
`e71cdb14`, the fresh pass alone `611642b1`, the external return alone `a2b150c5`, one push, no walk between, and the
gate's invoked slot covered by the complete pair (task 6.5, closed by observation at archive). (2) The harness's
no-runner case commits and pushes BASE and the fresh half and ends with the gate reporting `openPair: {missing:
"external"}`, as note 7.3 planned. The post-archive project-wide audit found one drift: the split parent's exit owners
named rc17b for what rc17d took. It was walked the same day with a dated note under the parent. Six B1 placeholder
Purposes were deferred to a change. The split parent `rc17-blind-pair-command` stays `premised`, and rc17c is the only
child still open.

**2026-10-07 — Architect session: `rc18-walk-is-next` declared (Sal).** rc17c's in-context verification passed
`review-proposal` with three SUGGESTIONs that the gate listed as unwalked, while the canonical next named apply.
Sal: the next recommended path should be the walk, even for suggestions. The stage takes the single-voiced direction:
the walk is the canonical next while a passed gate's mode carries an unwalked pass, and eligibility is untouched. The
two-line alternative was recorded as NOT this stage's direction, since it would reverse `Single-voiced canonical-next
computation`, which is Sal's call. A scratch-copy simulation showed a walk after the passed gate leaves it passed.
Depends on rc17a, which shipped `unwalkedPasses`. Stage count 36 → <!-- src:stages -->37<!-- /src:stages --> at the
marked sites (this entry's mark is the third; the previous entry's is unmarked as history).
