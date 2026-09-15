# Program: clean-up-review-cycle

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

> **Status (2026-09-11):** scaffolded from the D6 review cycle's evidence; re-cut into twelve
> small stages in four phases at the second session (R-crc-1, R-crc-2 ratified). Stage
> charters are proposed until a citing change exists; goals remain proposed.

## Premise

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

- **G1 — the cycle ends (Phase 1).** A change's post-apply cadence converges in at most three
  passes (blind pair, walk, verification) with no CRITICAL, or in five with one; the archive
  records residual risk instead of an override. Falsified by any `gate_overridden` whose
  reason is "no clean pass yet" after rc02 ships, or by a fourth review pass without a
  CRITICAL having been found.
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

## Open questions (program-level)

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

## Program stages

Fifteen small stages in four phases (R-crc-2; rc11 moved to Considered & out under R-crc-4; rc02
split into rc02 + rc02b on 2026-09-12; rc13 added 2026-09-14 and moved to phase 1 the same day;
rc03a split from rc03 on 2026-09-15).
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
Complete: [ ]

Charter: the explore surface is where invention is licensed, and today it is not strong enough to
hold it — so invention leaks downstream into walks, which is where R-crc-6 found it. Three
structural weaknesses, each verified against the shipped surface (2026-09-14). (1) There is NO
MECHANISM SECTION: the five-section convention is Premise / Decisions / Open questions / Considered
& out / References, every one about intent and context, and nothing asks how the thing computes; the
`sketches/` sibling-file affordance appears twice in the whole body, once as decoration inside an
ASCII-art box and once as an optional aside, and is never prompted, required, or counted. (2)
MATURITY IS A DECISION COUNT: the explore emit records `decisions_captured`,
`open_questions_count` and `open_questions_with_recommendation` — three counts — and grades the
exploration from them, so rc02's exploration read "7 decisions captured … before formalizing" with
zero worked mechanism behind any of them. That is the same disease as a review budget that counts
passes: events counted where substance was meant. (3) THERE IS NO FALSIFICATION STEP: decisions are
auto-captured with a brief acknowledgment, and nothing asks what would make this wrong or requires
the proposed rule to be run once.

**RE-AIMED 2026-09-15 (Sal), after rc03a falsified this stage's original cure.** The charter
proposed a Mechanism section carrying an EXECUTED CASE. rc03a carried exactly that from its first
exploration onward, would have rendered Mature under the original exit criterion 1 at every point,
and failed three times across three independent passes. An executed case shows ONE PATH through a
rule, and none of rc03a's three failures were on a path anyone walked.

THE UNIT IS A CLOSED ENUMERATION per rule, not an executed case. That also dissolves the trigger
question this stage could not answer for two sessions: the original scoping — "an exploration whose
deliverable is a decision procedure" — required the AI to classify itself, which is dodgeable in a
sentence. Under a closed-enumeration unit there is nothing to self-assess: a Decision that states a
CONDITIONAL has a domain, and either every member is stated or it is not.

THE STAGE ENFORCES SIX MOVES, DERIVED from the structure of a mechanism rather than listed. A
mechanism is an assembly of parts computing outputs from inputs under constraints, and each part is
a way to be wrong:

| part | the way it goes wrong | move | status |
|---|---|---|---|
| the facts it cites | the fact is not true | READ | EXISTS (read-before-reference) — violated |
| its input domain | a member it ranges over is unhandled | ENUMERATE | EXISTS (R-crc-7's table) — unenforced |
| its own parts | two of them assume incompatible things | COHERE | unnamed until 2026-09-15 |
| its computation | wrong output on a member it handles | EXECUTE | this stage's original proposal |
| its purpose | correct, and still misses a class of defect | FALSIFY | nobody's |
| its context | it violates a standing ruling | CONFORM | unenforced |

So this stage's contribution is less "add an affordance" than MAKE EXISTING RULINGS ENFORCEABLE AT
EXPLORE TIME and add the ones nobody owns. R-crc-7 already says "empty cases are explicit by
construction; a blanket default does not substitute for stating them" — rc03a shipped prose plus a
blanket default, its second pass flagged the R-crc-7 violation as a WARNING and the CRITICAL it
produced as the same defect at two levels, and nothing at explore time had checked.

THE DERIVATION EARNED ITS KEEP WITHIN THE HOUR, which is the stage's own thesis operating on the
stage. A five-move set was ratified, no sixth could be named on request, and then classifying
rc03a's fifteen CRITICALs found FOUR that landed nowhere: COHERE — the delta asserting both "empty
pair → external" and "no pairable pass → fresh"; design D3 forbidding the only signal its own two
rules required, twice. Not ENUMERATE (the domain was covered twice over, with conflicting
dispositions) and not CONFORM (nothing external was violated). The most-recurring class on the
record, invisible to the set ratified minutes earlier. Confidence about closure was wrong twice in
one sitting; the sixth move was found by CLASSIFYING A RECORD, not by thinking harder.

Goal G3. Touches: orbit-explore-modifications, orbit-conventions (the five-section format),
orbit-run-summary-emit (the explore extension fields) — THREE, at R-crc-1's ceiling deliberately.
None is droppable: without the emit change the convention is ADVISORY, which is the exact failure
R-crc-7 just demonstrated. If the proposal review shows the stage is OVER the ceiling, the standing
R-crc-1 corollary says SPLIT THE MECHANISM — not shrink it.

Exit: (1) an exploration cannot render Mature while any rule in its Decisions lacks a closed
enumeration of its domain; (2) the emit's recommendation names what is missing per rule rather than
a decision count; (3) the next stage explored under it reaches its first review pass with zero
CRITICALs of the READ, ENUMERATE or COHERE classes — the three that account for eleven of rc03a's
fifteen. Evidence base: rc02 ran SIX proposal passes and 72 findings, nine of its first ten
CRITICALs in mechanism that did not exist when its exploration closed (2026-09-14); rc03a ran THREE
passes and 15 CRITICALs with zero repeats, was WITHDRAWN, and its record is what the six-move set
was derived against (2026-09-15).

ADDED 2026-09-15 (surfaced twice by rc03a's own cycle): this stage also owns the RE-ENTRY case.
R-crc-6 routes REDESIGN back to explore, and rc03a took that route twice — but its staging
directory had moved into the change at propose, so Mode B would have scaffolded a SECOND
`explore.md` beside the authoritative one, which is the second-claim-on-one-truth condition that
propose's own metadata merge refuses. Both sessions resumed in place by judgment, with nothing in
the body sanctioning it. The body should RESUME IN PLACE against `orbit/changes/<name>/explore.md`
when the name resolves to an active change, and say so.

ORDERING RESOLVED 2026-09-14 (Sal): rc13 MOVES TO PHASE 1 and is the next stage. This is not an
exception to R-crc-2 — it is R-crc-2 applied correctly. The stage was originally filed in phase 3
by its MECHANISM (it reduces what propose injects); phase 1's criterion is "the cheapest,
highest-lever changes to the cycle's own rules FIRST", which is precisely what this stage is. Where
a stage's mechanism and its leverage point at different phases, leverage governs placement.
Two consequences worth stating. Its exit criterion 3 is measured on THE NEXT STAGE EXPLORED UNDER
IT, so every stage after it is the measurement — running it seventh would have discarded six of
them. And rc13's own exploration necessarily runs under the weak surface it exists to fix, so
R-crc-7 is applied BY HAND for this one change (Mechanism section written, the procedure executed
once before specifying); its own cycle then stands as the control. If mechanism still leaks into
its walks under manual discipline, that is evidence the affordance is necessary rather than
merely convenient.

### Stage rc02b-severity-ladder — a severity is a consequence, and CRITICAL pays for itself

Depends-on: (none)
Complete: [ ]

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

### Stage rc02c-confirmation-semantics — what counts as having been confirmed

Depends-on: rc02-gate-semantics
Complete: [ ]

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

### Stage rc03a-blind-prompt — a blind reviewer is told nothing

Depends-on: rc02-gate-semantics
Complete: [ ]

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
Complete: [ ]

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

### Stage rc04-cost-visibility — the cycle measures itself in-flow

Depends-on: rc02-gate-semantics
Complete: [ ]

Charter: `orbit status` renders a cadence line per change — passes so far, findings per pass
trending, budget remaining — and the capture-recapture residual estimate from R-crc-4's blind
pair (overlap between two independent reviewers' findings estimates what remains; D6's
parallel externals overlapped 1 of 3 and 12). This stage OWNS the archive-side record: when
the gate reports `budgetExhausted` (rc02 — a boolean beside the state, not a state), the archive
flow prompts once and records
`residual_risk` — what was not converged and why the user accepted it — replacing the
`gate_overridden` path for that reason. Goal G1. Touches: orbit-orientation,
orbit-archive-modifications. Exit: (1) the line renders from the trail alone; (2) the residual
estimate appears whenever a blind pair exists on one state — its first real measurement is rc02's
system pair (12 and 11 findings, 4-5 shared, ZERO shared CRITICALs, residual near 60%), which is
also the first evidence that the estimate is worth rendering at all; (3) the archive emit carries
`residual_risk` on a budget-ended cadence; (4) the cadence line carries the CHURN-VERSUS-AUTHORING
diagnostic per R-crc-6 AND R-crc-8, measured PER REQUIREMENT rather than per change — a
change-level figure cannot see a single clause generating every CRITICAL while the rest converges,
which is the signal that identifies a redesign-lane section — prior-walk-file concentration crossed with the repeat rate, so the readout
distinguishes reviewers grinding edited ground (stop reviewing) from walks inventing new mechanism
(stop walking) from genuine fresh coverage (keep going). rc02's own cadence is the first fixture:
high concentration, zero repeats, and nothing in the tooling said so for three consecutive passes.

### Phase 2 — move checking into tests

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
Complete: [ ]

Charter: every delta scenario names the test id (or harness case) that exercises it, in a
grammar `orbit validate` checks; verify-change reports the scenario → test map mechanically
(covered / uncovered / test missing) instead of prose tracing, and the first review reads the
map. Uncovered scenarios are a verify finding, not a review finding. This stage is the map's
ONLY owner: the apply emit points at the latest verify emit rather than re-recording it. Goal
G2. Touches: orbit-verify-change, orbit-conventions (scenario grammar), the validator. Exit:
(1) `orbit validate <change>` fails a scenario without a test id; (2) verify-change's emit
carries the map; (3) a system review's Pass 0 consumes the map rather than rebuilding it.

### Stage rc07-artifact-lint — consistency is a lint, not a review

Depends-on: (none)
Complete: [ ]

Charter: the cross-doc consistency class the reviews keep finding (a figure restated in prose
that differs from its generated source; decision ordering; a heading grammar drift; a count in
a title) moves into `orbit validate` and audit-drift as mechanical checks, under a ONE VOICE
FOR FACTS rule: a computed number lives in exactly one generated place and prose points at it.
Goal G2. Touches: the validator, orbit-audit-drift, orbit-conventions. Exit: (1) a restated figure that
disagrees with its source fails validation; (2) the next proposal review carries zero
restated-count findings.
MEASURED 2026-09-14: the audit-drift payload divergence this stage inherits is not a TYPE
disagreement — it is a HARD REFUSAL. The option-B ratification (2026-09-12) and the parity test's
`KNOWN_DIVERGENCE` note both describe the engine as "accepting a third shape"; in fact
`orbit emit audit-drift` REJECTS every per-command field the shipped reference documents
(`context`, `caller`, `depth`, `flags`, `categories_skipped`, `findings_summary`), so the
standalone command's own Step 10 is unfollowable from its own reference. The project-wide sweep on
2026-09-14 failed twice on this before its payload was rewritten against `emit-composition.ts`.
In-place repair was evaluated and rejected: it fails the parity test's exact-set assertion and
trades a doc-vs-engine break for a doc-vs-baseline break — which is precisely the three-voice knot
this stage exists to untie. The consequence belongs in the exit criteria: (3) every shipped
payload reference round-trips through its own emit surface, proven by execution rather than by
field-set comparison.

### Phase 3 — reduce injection upstream

### Stage rc08-walk-completeness — walks sweep requirements, not examples

Depends-on: rc03-review-genres
Complete: [ ]

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
SPIKE PRECONDITION generalizes: it fires for any change whose deliverable is a decision procedure,
not only for one touching an external tool or protocol.
Goal G3. Touches: orbit-propose-modifications, orbit-conventions,
the validator. Exit: (1) the size check fires on a fixture over the ceiling and names the split;
(2) a proposal touching an external tool without a cited spike fails strict validation.

### Stage rc10-apply-closure — the end-to-end run precedes the archive

Depends-on: rc06-scenario-test-map
Complete: [ ]

Charter: a change's user-validation tasks are a PRE-ARCHIVE condition rather than a deferred
annotation: the archive flow requires them checked, or records a reasoned deferral naming
when and where the run will happen (D6's real dogfood was deferred past its own archive with
no such record). The scenario map is rc06's; the apply emit points at it. Goal G3. Touches:
orbit-archive-modifications, orbit-engine-gates (the tracked gate's user-validation subset).
Exit: (1) an archive with an unchecked user-validation task records a reasoned deferral or
halts; (2) the next stage's dogfood runs before its archive.

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
  whose `residual_risk` or override names freshness as the reason.
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
