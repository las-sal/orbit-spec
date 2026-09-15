> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc13-explore-mechanism

## Premise

Invention is supposed to happen in explore. It doesn't — it happens in walks, which is where
R-crc-6 found it. rc02 is the evidence: six proposal passes, 72 findings, zero repeats, and nine
of its first ten CRITICALs sat in mechanism that did not exist when its exploration closed. The
reviews were working correctly; they were reviewing mechanism nobody had reviewed, because the
mechanism was being invented in the walks that answered the previous round.

**Premise corrected 2026-09-14, by Case 1 below**: the charter attributes this to explorations
carrying no mechanism. That is not what the record shows. rc02's exploration carried dense
mechanism; what it never did was RUN any of it. The target is unexecuted mechanism, not absent
mechanism — which is a different and harder problem, because the failing case would have satisfied
the fix the charter proposes.

This exploration asks what the explore surface would have to be for that not to happen — and
carries a self-imposed constraint from rc13's charter: R-crc-7 is applied BY HAND here, since
rc13's own exploration necessarily runs under the weak surface it exists to fix. Mechanism gets
written and executed once before anything is specified. This exploration's own cycle is the
control measurement.

## Mechanism

<!-- NOT part of the shipped five-section convention. Present here because R-crc-7 is applied by
     hand for this change, and because whether this section earns its place is itself one of the
     questions under exploration. -->

### Case 1 — run the charter's own diagnosis against rc02's record (2026-09-14)

**Input**: rc02's `explore.md` (249 lines, 10 decisions) and the four CRITICALs its cycle found in
blind-pair mechanism.

**Procedure**: for each CRITICAL, ask whether the exploration (a) never specified the mechanism,
(b) specified it and got it wrong, or (c) never had to confront the question at all.

**Output**:

| CRITICAL | Class | Evidence |
|---|---|---|
| `isPairable` bound inclusive vs exclusive | (b) specified, WRONG | D-rc02-4 says "no walk … recorded STRICTLY BETWEEN their two tokens" — strictly between is exclusive; the shipped predicate is `r.token >= pass.token`, inclusive. The walk corrected the exploration. |
| `assignCadence` exponential blowup | (c) never confronted | D-rc02-4 defines what SATISFIES a slot; it never asks how assignment SEARCHES for a satisfying set. |
| `diagnosePair` "foreclosed" state | (c) never confronted | No state for "a pair exists but ordering excludes it" appears anywhere in the exploration. |
| canonical-next steers the user into breaking the pair | (c) never confronted | The exploration defines the slot; it never asks what the gate RECOMMENDS once one pair member has landed. |

**Finding — the charter's stated diagnosis does not survive its own evidence.** The charter says
rc02's exploration carried "zero worked mechanism behind any of" its decisions. False. D-rc02-3
names clause (b), the `deferred == 0 AND escalated == 0` predicate, the `resolutions[]` shape, the
`TrailFinding.severity` addition, and the legacy-fallback precedent. D-rc02-4 names the class
pair, the freshness requirement, the no-walk-between rule, which token a following slot must beat,
`sourcePath`-based blindness detection, and a named v1 limit. That is dense mechanism.

What rc02's exploration lacked was not mechanism. It was **execution**. Three of four CRITICALs are
class (c) — questions that do not arise while SPECIFYING a rule and do arise immediately on RUNNING
it. The fourth is class (b), a specification that was wrong in a way only running it exposes.

**Consequence for this stage's own design**: a Mechanism section would have been FILLED by rc02 —
D-rc02-3 and D-rc02-4 are exactly what an author writes under that heading — and rc13's proposed
gate would have passed. The stage would have shipped and changed nothing. The charter's cure is
vulnerable to the charter's own critique: it replaces a count of decisions with a count of
sections, and both are events counted where substance was meant.

### Case 2 — execute the gate's own blind-pair recommendation (2026-09-14)

**Input**: an empty `blind-pair` slot on `review-system`, and the engine's canonical next command.

**Procedure**: follow the recommendation literally, step by step, and read what each step produces.

**Output**:

```
1.  gates.ts:113 — an empty `blind-pair` slot renders `--fresh`
       /orbit:review --as system --fresh X
       → lands review-system-<TS>.json, findings unresolved

2.  gate sees an open pair → recommends the external half

3.  /orbit:review --as system --reviewer external X
       → external-handoff.md:57 — "Prior internal review findings still open:
         read the most-recent review-<mode>-*.json summary in .orbit-runs/;
         list count + short titles of unresolved findings"
       → the FRESH HALF'S FINDINGS ARE WRITTEN INTO THE EXTERNAL PROMPT

4.  the external reviewer reads them before looking at the code

5.  gate computes blind-pair SATISFIED   ← no walk between the tokens. True.
```

**Finding — blindness is enforced against walks and not against prompts.** The predicate checks
for a `TrailResolution` whose `sourcePath` references either pass. It cannot see that the second
reviewer's PROMPT contained the first reviewer's findings. The pair is certified blind while being
anchored, and the capture-recapture overlap — the number rc04 will build residual estimation on —
silently stops meaning anything. Note rc03's exit criterion already targets the "resolved since"
list; this is the ADJACENT bullet ("prior internal review findings still open") and is the one that
breaks a pair, so rc03's scope needs widening from "no resolved-since list" to "a blind-pair member's
prompt carries NO prior-findings context at all".

### Case 3 — was rc02's own pair actually blind? (2026-09-14)

**Input**: rc02's system-mode trail timestamps.

**Procedure**: compare when the external prompt was generated against when the fresh pass landed,
then read the prompt's cycle-context section.

**Output**:

```
external-prompt-system-2026-09-14T09-42-11Z.md   ← generated FIRST
   "- Prior internal findings still open: 0."
external-system-2026-09-14T10-02-06Z.md          ← external findings written
review-system-2026-09-14T10-06-20Z.json          ← fresh pass lands, 24 min LATER
```

**Finding — rc02's pair was blind by luck of ordering, not by construction.** The run happened to
go external-first, so there was nothing on the trail to leak. The engine recommends fresh-first.
Anyone following the engine's own recommendation would have produced an anchored pair that the gate
certifies as blind. The one measurement this program has produced — zero CRITICAL overlap, ~60%
residual — survives only because the operator did not do what the tool said.

### Case 4 — record a merged blind-pair walk (2026-09-14)

**Input**: R-crc-4's rule that a pair's findings "merge into ONE walk", and the trail types.

**Procedure**: attempt to represent one walk resolving two passes.

**Output**: impossible. `TrailResolution.sourcePath` is `string | null` (trail.ts:71) and
`recordsFor` (gates.ts:175-180) matches ONE pass by basename. A single merged record claims one
pass; the other half gets `recs.length === 0`, `passResolved` returns false, clause (b) fails, and
the gate demands another independent pass — the exact loop this program exists to kill, triggered
by obeying R-crc-4.

**And it already happened, in rc02's own pair:**

```
address-reviews-2026-09-14T11-42-49Z.json  →  external-system-...10-02-06Z.md
address-reviews-2026-09-14T11-42-50Z.json  →  review-system-...10-06-20Z.json
                              ^^ one second apart — the engine's collision bump
```

The merge happened in conversation; the record had to be split in two because the engine cannot
represent it. **The engine supports the workaround and not the rule**, and the workaround is
invisible afterwards — those two lines read as two independent walks.

### Case 5 — is the blindness leak a bug, or is it specified? (2026-09-14)

**Input**: the leak from Case 2, and the archived baselines.

**Procedure**: one grep — does any baseline requirement mandate the cycle-context content?

**Output**: it is SPECIFIED. `orbit/specs/orbit-review-external/spec.md:273` —

> **Requirement: Cycle context populated from prior runs** — "The system SHALL include a
> 'Cycle context' section in the prompt with iteration number, prior findings (open and
> resolved), populated from `.orbit-runs/` if it contains prior runs."
> *Scenario: Prior internal review summary exists* → "the cycle context section includes counts
> and short titles of those findings"

**Finding — this is a requirement CONFLICT rc02 introduced, not an implementation defect.** The
cycle-context requirement was written when every external review was a SEQUENTIAL ITERATION —
iteration 2 reviewing what iteration 1 found — and in that world, telling the reviewer what is
open is correct and useful. The blind pair inverts the premise: a pair member must receive
nothing. rc02 added `blind-pair` to the cadence and never touched the requirement that
contradicts it. Two archived requirements now cannot both hold:

```
orbit-review-external   the prompt SHALL carry prior open findings
orbit-engine-gates      a blind-pair's members are blind to each other
```

**Why this case mattered**: it took one grep and it changed the answer. Before it, the fix was
priced as a two-line prompt tweak that could ride along in rc13's scope. After it, the fix is a
MODIFIED delta against a fourth capability (over R-crc-1's ceiling of three) whose real content
is deciding what a review prompt owes a reviewer AS A FUNCTION OF WHAT KIND OF PASS IT IS. The
cheap reading and the true reading differ by one executed check.

## Decisions

- **2026-09-14 — D-rc13-1: the target is UNEXECUTED mechanism, not absent mechanism**
  (settled under R-crc-3, by Case 1 above). Explorations produce SPECIFICATIONS, not RUNS, and
  nothing notices. rc02's exploration wrote dense mechanism and never executed a line of it; three
  of its four blind-pair CRITICALs were questions that do not arise while specifying a rule and
  arise instantly on running one, and the fourth was a specification that was simply wrong
  ("strictly between") in a way only running it exposes. This supersedes the charter's stated
  diagnosis, which attributed the failure to explorations carrying no mechanism.

- **2026-09-14 — D-rc13-6: the blindness fix is a new stage `rc03a-blind-prompt`, split from
  rc03** (ratified in chat by Sal, 2026-09-14; resolves Q-rc13-4). rc03-review-genres already owns
  this territory — the prompt-genre split IS its charter — so the fix is a slice of rc03 arriving
  early, not new ground. Carving the slice follows the rc02 → rc02b/rc02c precedent. REJECTED:
  pulling all of rc03 forward (three capabilities, the verification-emit genre, the whole cadence
  rewrite — it would displace rc13 and reverse an ordering decision made the same day), and filing
  it as an uncited standalone change (the citation is what makes rc03 inherit the resolved conflict
  instead of re-deciding it). A paste-ready charter in the doc's grammar is drafted at
  `sketches/rc03a-blind-prompt-charter.md`. THE DECLARATION ITSELF IS AN ARCHITECT ACT and has not
  been performed: writing a stage into the program doc from an explore session would leave a stage
  with no architect emit behind it.

- **2026-09-14 — D-rc13-5: the blindness fix leaves rc13's scope and becomes its own change**
  (ratified in chat by Sal, 2026-09-14; reverses the same conversation's earlier leaning to fold
  it in). Two reasons, in order of force. (1) R-crc-1: rc13 already touches three capabilities —
  `orbit-explore-modifications`, `orbit-conventions`, `orbit-run-summary-emit` — and the fix adds
  `orbit-review-external` as a fourth. The ruling is explicit that a proposal over the ceiling is
  SPLIT BEFORE REVIEW, never reviewed as one. (2) Case 5: the content is not a prompt tweak but a
  requirement conflict, whose real question is what a review prompt owes a reviewer as a function
  of what kind of pass it is — that is design, and it is exactly rc03's genre split arriving early.
  **Timing is not negotiable**: it lands BEFORE rc13's own system review runs a blind pair, or
  rc13's control measurement is taken on an anchored pair and its exit criterion 3 is worthless.
  **Explicitly rejected**: running rc13's pair external-first by hand, the way rc02 escaped. A
  stage whose thesis is that disciplines fail where affordances work cannot rely on a discipline
  to produce its own evidence.

- **2026-09-14 — D-rc13-3: walk DISCOVERY is the gate's own predicate, and `--from-file` is
  demoted to an override** (settled under R-crc-3). Bare `/orbit:address-reviews <change>` today
  auto-discovers the SINGLE most-recent review or audit-drift emit by `<TS>` token. It should
  instead walk EVERY OUTSTANDING pass — and "outstanding" must not be a second, parallel rule.
  The engine already computes it: `passResolved`/`recordsFor` (clause (b)) defines a pass with
  substantive findings and no referencing walk record as unresolved. Discovery reuses that
  predicate, so the walk and the gate agree BY CONSTRUCTION; a private recency rule lets a walk
  report success while leaving the gate unsatisfied, which is rc07's one-voice-for-facts failure
  wearing a different hat. `--from-file` is NOT removed — it keeps the off-trail case (a findings
  file handed over, or one outside `.orbit-runs/`) — it stops being the only way to aim a walk.
  Scope explosion is handled by machinery that already exists: the triage preview opens the walk
  and the user scopes it (all / subset / only-critical).
  **Blocked on**: Case 4. A merged walk cannot be recorded until `sourcePath` becomes a SET (or
  per-resolution provenance is added), so this decision ships with that or not at all.
  **Falls out for free once it does**: the pair walks as one record; the gate reads both halves
  resolved from that record; and the walk can open on the split a pair is run to produce —
  found-by-both (confirmed) / fresh-only + external-only (the residual estimate) /
  CONTRADICTORY (the highest-value rows; rc02 had one, and a single empirical test settled it in
  both directions).

- **2026-09-14 — D-rc13-4: one invocation launches both halves, and that is a CORRECTNESS
  property rather than ergonomics** (settled under R-crc-3, from Case 2 + Case 3). A single
  invocation writes the external prompt AND runs the fresh half, so at generation time NEITHER
  half exists on the trail and there is nothing for the prompt to leak. Blindness becomes
  structural instead of a discipline or, as in rc02, an accident of ordering. The invocation then
  PARKS: the fresh findings persist, the trail marks the pair open, and the gate already declines
  to recommend the foreclosing walk. NO background waiter — a human round-trip runs minutes to
  days, would outlive the session, and orbit is deliberately single-session with concurrency a
  non-goal (R-d-11). The user returns when the external findings land.
  **Naming caveat**: `--reviewer` takes a CLASS and `blind-pair` is not one — it is a slot naming
  two classes, and each half must still record its own `reviewer_class` or the trail cannot
  compute the slot. So it cannot be a `--reviewer` value that flows through to the field; it is a
  different axis and needs its own flag.

- **2026-09-14 — D-rc13-2: decision-count is a BAD PROXY, not a corrupted one** (settled under
  R-crc-3). The distinction matters for what we build next. Goodhart's law describes a measure that
  WAS good degrading because someone targets it; that is not what happened. Nobody padded rc02's
  decision count — its ten decisions are genuine and dense. Heading count has never correlated with
  whether anything was executed, under any conditions. Ten excellent decisions and zero executed
  cases is a perfectly consistent state, and it is exactly the state rc02 was in. CONSEQUENCE:
  Goodhart is a claim about the FIX, not the bug — the forward risk of whatever we make the new
  target — so the question to ask of any replacement is not "will people game it" but "does it
  track the thing at all".

## Open questions

- **Q-rc13-1 — What is the unit: "mechanism", or a worked case?**
  "Mechanism" is a noun that invites prose; "case" is a noun that invites a table. The naming
  decides what authors actually write.
  Standing recommendation: a WORKED CASE — named input, the procedure run by hand, the output
  written down — and the output must be the kind of thing that can be wrong. The argument rests on
  one asymmetry: a thin case is visible to any reader in two seconds ("Input: a trail. Output: the
  gate passes." says nothing, obviously), while thin prose is invisible — rc02 proves it, since
  three CRITICALs sat behind one good, thorough-reading sentence about `sourcePath` blindness. The
  claim is NOT that cases resist gaming; it is that cases put the gap where a human eye lands
  instead of behind confident prose.

- **Q-rc13-2 — What may the ENGINE assert about an exploration's readiness?**
  The engine can check structure and never substance. `next_recommended` is a required spine field
  whose value is a command, so "stop grading" is not available — the engine must point somewhere.
  Standing recommendation: NEVER BE MORE CONFIDENT THAN YOUR EVIDENCE TYPE SUPPORTS. Counting
  headings supports "how much is here"; it does not support "this is done". The grid's floor and
  middle rungs are already honest — the middle defers with "or /orbit:propose if ready" — and only
  the top rung asserts, on strictly no additional evidence about substance, just more headings.
  Confidence currently RISES with heading count. So: the top rung loses its promotion. Without a
  worked case, `>=4 decisions` renders the MIDDLE rung's deferring language plus a named gap; with
  a worked case, it may say ready. One branch of one function, the ratified
  `Named-mode explore recommendation by maturity` requirement MODIFIED rather than REMOVED, and it
  fits R-crc-1's ceiling.
  Held against it, and worth stating out loud: rc02 would still have hit `>=4 decisions` and still
  been told "continue thinking, or propose if ready", and its author would very likely have
  proposed anyway. This removes the tool's ENDORSEMENT of the mistake without removing the mistake.
  That may be all a readout can honestly do, but we should not pretend it prevents anything.

- **Q-rc13-3 — What triggers the requirement?**
  The charter scopes it to "an exploration whose deliverable is a decision procedure", which the
  AI would self-classify — dodgeable in one sentence.
  Standing recommendation: none yet. Leaning toward DERIVATION over self-classification (from the
  cited stage's charter, or from the capabilities touched), with "require a case always" as the
  blunt fallback worth pricing before it is dismissed.

## Considered & out

- **2026-09-14 — "Add a Mechanism section to the five-section convention", as the stage's fix.**
  This is the charter's own first proposal and it is REJECTED AS INSUFFICIENT ALONE (charters are
  settled under R-crc-3 until a citing change refines them; this is that refinement). rc02's
  exploration would have FILLED it — D-rc02-3 and D-rc02-4 are precisely what an author writes
  under that heading — so rc13's proposed gate would have passed, the stage would have shipped, and
  rc02 would have gone exactly the same way. Replacing a count of decisions with a count of
  sections is the same disease the charter diagnoses, one level up. A Mechanism section may still
  be the CONTAINER (see Q-rc13-1), but it is not the substance and cannot be the gate.

## References

- `orbit/architecture/clean-up-review-cycle.md` — rc13's charter, its three verified structural
  claims, and the ordering resolution that moved it to phase 1.
- `src/core/parsers/explore-counter.ts:146-163` — `maturityRecommendation`, the whole grading
  function. Verified 2026-09-14.
- `src/core/emit-composition.ts:202` — the explore emit's engine-computed extension fields.
- `src/core/templates/workflows/explore.ts` — the shipped explore body; `sketches/` appears once
  as an affordance (line 460).
- `orbit/changes/archive/2026-09-14-rc02-gate-semantics/` — the evidence base: its `explore.md`,
  and the six proposal-review emits on its trail.
