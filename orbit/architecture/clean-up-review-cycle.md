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
  buys exactly ONE more blind review after the walk (the new state, not the diff). Nothing is
  reviewed after a walk except the walk's own diff — the freshness loop is removed by
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

Fourteen small stages in four phases (R-crc-2; rc11 moved to Considered & out under R-crc-4; rc02
split into rc02 + rc02b on 2026-09-12; rc13 added 2026-09-14).
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
Complete: [ ]

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
REMOVAL IS CONFIRMED BY VERIFICATION, NOT BY ANOTHER REVIEW (2026-09-14). The reviewed-gate rule
that a CRITICAL buys one further independent pass assumes the defect was FIXED IN PLACE — something
must re-read the changed state. When a walk resolves BY REMOVAL under R-crc-6's redesign lane, the
material the CRITICAL described is gone, and the correct confirming instrument is a VERIFICATION
pass over the walk's diff (is the removal complete, did anything else regress), not a further whole-
artifact review of a change that just got smaller. The gate cannot distinguish the two cases — it
reads the pass's immutable CRITICAL count — so this stage's genre split is what makes the
distinction available at all, and rc02's own seam is the first instance: two CRITICALs resolved by
removing the clause they lived in, with the gate still asking for another fresh review.

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
estimate appears whenever a blind pair exists on one state; (3) the archive emit carries
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

### Phase 3 — reduce injection upstream

### Stage rc08-walk-completeness — walks sweep requirements, not examples

Depends-on: rc03-review-genres
Complete: [ ]

Charter: when a walk edits a command example or a normative sentence, the address-reviews body
sweeps the owning requirement's prose, every scenario, task restatements, transcriptions, and
sibling seams before the finding is marked resolved, recording the sweep set per resolution in
the log; the R-crc-4 verification pass over the walk's own diff precedes any further review.
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

This stage adds the Mechanism section to the convention, makes the emit's maturity signal read
mechanism PRESENCE rather than decision count, and adds R-crc-7's execute-once step as an explore
affordance rather than a discipline someone remembers. Goal G3. Touches: orbit-explore-modifications,
orbit-conventions (the five-section format), orbit-run-summary-emit (the explore extension fields).
Exit: (1) an exploration whose deliverable is a decision procedure cannot render Mature without a
Mechanism section carrying an executed case; (2) the emit's recommendation names the missing
mechanism rather than a decision count; (3) the next stage explored under it reaches its first
review pass with zero CRITICALs in mechanism authored after the exploration closed. Evidence base
(2026-09-14): rc02 ran SIX proposal passes and 72 findings; nine of its first ten CRITICALs, and
both of the sixth pass's, were in mechanism that did not exist when its exploration closed.

NOTE ON ORDERING: R-crc-2 places this phase third, and rc13 sits here because it reduces what
propose injects. It is nevertheless the highest-leverage stage in the program — it addresses the
ROOT CAUSE that R-crc-6 identified downstream — and pulling it forward would revise a Sal-ratified
ordering, so the recommendation is surfaced rather than taken.

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
