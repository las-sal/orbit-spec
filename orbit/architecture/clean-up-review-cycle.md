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
- **Q-crc-4 — RESOLVED (rc02 reports `budget-exhausted`; rc04 records `residual_risk`).** `residual_risk` has two owners.** rc02 says budget exhaustion is a recorded
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

Eleven small stages in four phases (R-crc-2; rc11 moved to Considered & out under R-crc-4).
Every stage is sized under R-crc-1, names the capabilities it touches, and names its goal.
Charters are settled under R-crc-3 until a citing change refines them; exit criteria are
falsifiable and self-measured by the stage's own cadence (G0). Position is computed — see the
readout, never this text.

### Phase 1 — stop the bleeding

### Stage rc01-instrument-fidelity — the cycle's instruments enforce the real tool

Depends-on: (none)
Complete: [ ]

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

Charter: the reviewed-gate model gains a SEVERITY LADDER BY CONSEQUENCE (CRITICAL = a user
path breaks or data is lost, and the finding carries its reproduction; WARNING = an
implementation could diverge from the spec as written; else SUGGESTION), the rule that
SUGGESTIONs NEVER GATE (batched into one follow-up walk; issue #8's confirm value ships here),
the STOP RULE in R-crc-4's terms (converged when the latest blind reviews carried zero
CRITICAL and their walk's verification shows no regression; a CRITICAL buys one more blind
review), and a REVIEW BUDGET declared per change (default: the R-crc-4 shape plus one extra
blind review) whose exhaustion the gate reports as the state `budget-exhausted` — a gate
state, never a hard block; rc04 records what the user decides at archive. Goal G1. Touches:
orbit-engine-gates, orbit-conventions, spec-driven schema v4. Exit: (1) `gates.ts` implements
ladder + stop rule + budget; (2) the gate reason names whichever rule fired; (3) the next
archive on this repo proceeds through the stop rule, or with the gate reporting
budget-exhausted — never a `gate_overridden` for "no clean pass yet".

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

### Stage rc04-cost-visibility — the cycle measures itself in-flow

Depends-on: rc02-gate-semantics
Complete: [ ]

Charter: `orbit status` renders a cadence line per change — passes so far, findings per pass
trending, budget remaining — and the capture-recapture residual estimate from R-crc-4's blind
pair (overlap between two independent reviewers' findings estimates what remains; D6's
parallel externals overlapped 1 of 3 and 12). This stage OWNS the archive-side record: when
the gate reports `budget-exhausted` (rc02), the archive flow prompts once and records
`residual_risk` — what was not converged and why the user accepted it — replacing the
`gate_overridden` path for that reason. Goal G1. Touches: orbit-orientation,
orbit-archive-modifications. Exit: (1) the line renders from the trail alone; (2) the residual
estimate appears whenever a blind pair exists on one state; (3) the archive emit carries
`residual_risk` on a budget-ended cadence.

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
Goal G3. Touches: orbit-address-reviews, orbit-emit-composition (the log field). Exit: (1) the log
carries `sweep_set` per resolution; (2) a later finding at a site the sweep should have
covered is detectable from the trail as a ripple-miss; (3) the next cadence records zero
ripple-miss findings.

### Stage rc09-propose-hygiene — spike before spec, size before review

Depends-on: (none)
Complete: [ ]

Charter: propose gains two gates of its own. A SIZE CHECK against R-crc-1 (capabilities,
requirements, bytes, tasks) that names a split when exceeded. A SPIKE PRECONDITION for any
change touching an external tool or protocol: a disposable prototype has run the outward path
and its findings are cited in design.md before the spec is written (D6 wrote 108 KB about `gh`
before anyone ran `gh`). Goal G3. Touches: orbit-propose-modifications, orbit-conventions,
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
