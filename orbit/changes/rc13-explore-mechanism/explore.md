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

### Case 6 — run rc13's own cure against rc03a (2026-09-15)

**Input**: rc13's exit criterion 1 — "an exploration whose deliverable is a decision procedure
cannot render Mature without a Mechanism section carrying an EXECUTED CASE" — and rc03a's three
failed mechanisms (15 CRITICALs, zero repeats, stage withdrawn 2026-09-15).

**Procedure**: for each of rc03a's three failures, ask whether the criterion would have caught it.

**Output**:

| rc03a failure | had a Mechanism section with executed cases? | would criterion 1 have caught it? |
|---|---|---|
| The premise was false — "the `orbit status` call it already makes"; the branch makes none | YES — two executed cases | **NO.** The cases ran the RULE; nobody READ the branch the rule depends on |
| The signal was unusable — `slot` is gate-scoped to the first unpassed gate, and absent in reachable pair states | YES — Case 1 enumerated five slot states | **NO.** Five is not all. The two absent-slot states were missing, and the verdicts for the five present were correct, so the table looked sound |
| The state space was halved — the mechanism answered the empty-pair state and left the open-pair one | YES — Cases 3 and 4, and Case 3's channel enumeration was EXHAUSTIVE and correct | **NO.** Sites were enumerated exhaustively; STATES never were |

**Finding — rc13's cure is insufficient BY ITS OWN EVIDENCE BASE.** rc03a carried a Mechanism
section with executed cases from its first exploration onward. It would have rendered Mature under
exit criterion 1 at every point, and it failed three times. An executed case shows you ONE PATH
through a rule; none of rc03a's failures were on the path anyone walked.

**What would have caught each one, named precisely:**

- Failure 1 → **READ.** Verify a cited construct before building on it. That is
  read-before-reference, an EXISTING discipline, and it was simply violated.
- Failures 2 and 3 → **ENUMERATE.** Close the domain the rule ranges over and state every member's
  disposition. That is R-crc-7's decision-table corollary — "empty cases are explicit by
  construction; a blanket default does not substitute for stating them" — an EXISTING ruling, and
  nothing at explore time enforced it. rc03a shipped prose plus a blanket default, the second pass
  flagged the R-crc-7 violation as a WARNING and its consequence as a CRITICAL, and noted they were
  "the same defect at two levels".

**Consequence — the missing thing is EXHAUSTIVENESS OVER THE RULE'S DOMAIN, not an example of the
rule running.** The four moves are distinct and rc13's charter conflates the last two:

```
READ       verify the facts the rule cites            existing (read-before-reference), violated
ENUMERATE  close the domain; state every member       existing (R-crc-7), unenforced
EXECUTE    run it; get an output that can be wrong    rc13's proposal
FALSIFY    name what class of defect this misses      nobody's, yet
```

rc03a EXECUTED three times and skipped READ once and ENUMERATE twice. So rc13's contribution is
less "add an affordance" than "make two existing rulings enforceable at explore time, and add the
one nobody owns."

### Case 7 — DERIVE the move set, then test it against every CRITICAL on record (2026-09-15)

**Input**: the claim that a proposed mechanism can be wrong in a fixed number of ways, and the
fifteen CRITICALs rc03a's three passes produced.

**Procedure**: derive the set from the STRUCTURE of a mechanism rather than listing moves, then
classify every recorded CRITICAL into it. A member that classifies nowhere falsifies the set.

**Derivation** — a mechanism is an assembly of parts computing outputs from inputs under
constraints. Each part is a way to be wrong:

| part of a mechanism | the way it goes wrong | move |
|---|---|---|
| the facts it cites | the fact is not true | **READ** |
| its input domain | a member it ranges over is unhandled | **ENUMERATE** |
| its own parts | two of them assume incompatible things | **COHERE** |
| its computation | it produces the wrong output on a member it does handle | **EXECUTE** |
| its purpose | it is correct and still misses a class of defect | **FALSIFY** |
| its context | it violates a standing ruling | **CONFORM** |

**Output — the FIVE-move set ratified an hour ago is NOT closed; the test found a sixth.**
Classifying rc03a's CRITICALs:

```
READ       "the orbit status call it already makes" (branch makes none); `slot`'s actual
           gate-scoping semantics; tests asserted against engine code that does not exist
ENUMERATE  slot absent in reachable states; architecture mode; the prompt-template site; the
           git log channel; the OPEN-pair state
EXECUTE    (none — every executed case ran correctly on the path it walked)
FALSIFY    (none raised as a CRITICAL; the misses surfaced as the NEXT pass's findings)
CONFORM    the untouched `Cycle context` baseline the new requirement contradicts
COHERE     ← FOUR CRITICALs classified NOWHERE in the five-move set:
           the delta asserting both "empty pair → external" and "no pairable pass → fresh";
           design D3 forbidding the only signal its own two rules require — twice, once per pass
```

**Finding — internal self-contradiction is a SIXTH move, and it is the one that recurred most.**
It is not ENUMERATE (the domain was covered, twice over, with conflicting dispositions), and it is
not CONFORM (nothing external was violated). It is the mechanism's own parts disagreeing. Four of
fifteen CRITICALs, appearing in both of the last two passes, and invisible to every move in the set
this exploration ratified before running the test.

**What this case demonstrates about its own method.** The five-move set was derived carefully, felt
complete, and I could name no sixth when asked — which is exactly the confidence D-rc13-7 says not
to trust. The sixth was not found by thinking harder; it was found by CLASSIFYING A RECORD. An
enumeration closes against evidence or it does not close at all, and "I can think of no more" is
the failure mode, not the check.

### Case 8 — audit this exploration against its OWN rule, before proposing (2026-09-15)

**Input**: the twelve decisions in this file, and D-rc13-7's rule — every RULE in Decisions needs a
CLOSED ENUMERATION of its domain.

**Procedure**: classify each decision as a RULE (states a conditional or predicate) or not, then ask
of each rule whether its domain is closed in the text.

**Output**:

| decision | rule? | domain closed? |
|---|---|---|
| D-rc13-1 target is unexecuted mechanism | finding | n/a |
| D-rc13-2 decision-count is a bad proxy | finding | n/a |
| D-rc13-3 walk discovery is the gate's predicate | RULE | **NO** — and now OUT OF SCOPE, assigned to rc08 |
| D-rc13-4 one invocation launches both halves | RULE | **NO** — and now OUT OF SCOPE, assigned to rc03 |
| D-rc13-5 / D-rc13-6 blindness fix scope | scope | n/a |
| D-rc13-7 the unit is a closed enumeration | RULE | **NO — what makes an enumeration CLOSED is never stated** |
| D-rc13-9 the trigger is derivable from the text | RULE | **NO — what counts as "a Decision stating a conditional" is never stated** |
| D-rc13-10 at the ceiling deliberately | position | n/a |
| D-rc13-11 the unit question is answered | finding | n/a |
| D-rc13-12 the move set is six, derived | RULE-SET | YES — closed by derivation from the parts of a mechanism |

**Finding — THREE OF FOUR IN-SCOPE RULES FAIL THIS EXPLORATION'S OWN TEST, and the two that matter
are its two central ones.**

- **D-rc13-7 does not say what CLOSED means.** It requires closed enumerations and never defines
  closure. A domain is closed when it is derived from a structure (D-rc13-12's method), when it is
  exhaustive over a finite set the code defines (rc03a's eleven channels), or when its members are
  enumerated and a residual is named. Those three are a candidate enumeration of closure itself —
  and naming them is precisely the work the rule demands of everyone else.
- **D-rc13-9 does not say what a CONDITIONAL is.** The trigger derives from "a Decision that states
  a conditional", and nothing states which forms qualify: a WHEN/THEN, a predicate, a table, a
  sentence containing "unless". An author who wants to dodge writes prose that states a rule without
  a conditional's grammar, and D-rc13-9 was ratified specifically to remove a dodge.
- D-rc13-3 and D-rc13-4 also fail, but they are no longer this stage's business — the walk-discovery
  rule is assigned to rc08 and the launcher to rc03. Their failure here is a warning to those
  stages, recorded rather than fixed.

**What this case demonstrates.** The audit was possible only because D-rc13-7 gave a checkable test,
which is the argument for the rule. It was also NEVER RUN until it was deliberately scheduled — the
exploration reached twelve decisions and an engine readout of "ready to formalize" with its two
central rules unclosed. Both facts belong in the stage's evidence: the rule works, AND a rule that
is not mechanically enforced does not get applied to the artifact that invented it.

### Case 9 — close the two central rules, by derivation (2026-09-15)

**Input**: Case 8's finding that D-rc13-7 never defines CLOSED and D-rc13-9 never defines what makes
a Decision a rule.

**Procedure**: derive each domain from what the claim must justify, rather than listing forms.

---

**(a) What makes an enumeration CLOSED?** An enumeration asserts "these are ALL the members of
domain X." Derive from how that assertion can be JUSTIFIED — a justification exists or it does not:

| justification | form | example on the record |
|---|---|---|
| the domain is generated by a structure whose parts are known | **DERIVED** | rc13's six moves, from the parts of a mechanism |
| the domain is a finite set some authority defines, and every member is covered | **SOURCED** | rc03a's eleven channels, from a grep over `review.ts` |
| the domain is open, and the enumeration names its members PLUS an explicit residual | **BOUNDED** | rc02's same-state v1 limit — blindness enforced, byte-exact same-state named as not |
| *"I thought hard and can name no more"* | **NOT A FORM** | the five-move set; rc03a's five-slot table |

The fourth row is the point. It is the state every failed enumeration on this record was in, and it
looks identical to a closed one from the inside.

**A closure form is DECLARED, not inferred.** The enumeration states which of the three it is, so a
reader checks the justification rather than the list's plausibility.

**Classification against a record FALSIFIES but never CLOSES.** Case 7 classified rc03a's fifteen
CRITICALs and destroyed the five-move set; it could not have proven six complete. Testing is an
instrument for finding a missing member, never a closure form — which is why DERIVED was still
needed after the test passed.

---

**(b) What makes a Decision a RULE?** A Decision states one of three things, and only one has a
domain:

| a Decision states | has a domain of situations? | example |
|---|---|---|
| a FACT about what happened | no — it is about one world, falsifiable by evidence | D-rc13-1, D-rc13-2, D-rc13-11 |
| a SCOPE choice (in / out / deferred) | no — it is one-off, it determines what is built | D-rc13-5, D-rc13-6, D-rc13-10 |
| a **RULE** constraining how something must be done | **YES** | D-rc13-7, D-rc13-9, D-rc13-12 |

**The test is "in which situations does this apply?"** A SET means rule, and the set is the domain.
"This one" or "nothing specific" means not a rule.

**This is deliberately GRAMMAR-INDEPENDENT**, and that is the whole repair. D-rc13-9's earlier
phrasing — "a Decision that STATES A CONDITIONAL" — keyed on form, so an author could state a rule
in prose carrying no WHEN/THEN and fall outside it. The dodge would have moved rather than closed,
in a decision ratified specifically to remove a dodge. Asking what situations a decision governs
cannot be dodged by phrasing, because a rule that governs no situations constrains nothing.

**Output — both domains now close, by DERIVED.** Tested against this file: the classification in (b)
reproduces Case 8's rule/not-rule split exactly, with no decision falling outside the three kinds.

## Decisions

- **2026-09-15 — D-rc13-15: the engine may never be more confident than its evidence type supports;
  the maturity grid's TOP RUNG loses its promotion** (resolved by Sal at promotion, 2026-09-15;
  resolves Q-rc13-2). `next_recommended` is a required spine field whose value is a command, so
  "stop grading" is not available — the engine must point somewhere. What is available is refusing
  to ASSERT readiness on evidence that cannot support it. The grid's floor and middle rungs are
  already honest: the middle defers with "or `/orbit:propose` if ready". Only the TOP rung asserts —
  "substantial thinking captured; ready to formalize the design" — and it does so on strictly no
  additional evidence about substance, just more headings. **Confidence currently RISES with heading
  count.** So: without a closed enumeration for every RULE in Decisions (D-rc13-14's test,
  D-rc13-13's forms), `>=4 decisions` renders the MIDDLE rung's deferring language plus a named gap;
  with them, it may say ready. One branch of one function; the ratified
  `Named-mode explore recommendation by maturity` requirement is MODIFIED rather than REMOVED.
  **Stated rather than oversold**: rc02's exploration would still have hit `>=4 decisions` and still
  been told "continue thinking, or propose if ready", and its author would very likely have proposed
  anyway. This removes the tool's ENDORSEMENT of the mistake, not the mistake. THIS EXPLORATION IS
  THE COUNTER-EXAMPLE THAT MATTERS: it reached twelve decisions and an engine readout of "ready to
  formalize" with its two central rules unclosed (Case 8), and no readout would have caught that —
  only a scheduled audit did. The requirement is worth shipping and it is not sufficient alone.


- **2026-09-15 — D-rc13-13: CLOSURE has three forms and is DECLARED, not inferred** (settled under
  R-crc-3; closes D-rc13-7's domain, per Case 8's audit and Case 9(a)). An enumeration is closed
  when it is **DERIVED** from a structure whose parts are known, **SOURCED** exhaustively from a set
  an authority defines (a type, a code branch set, a grep over a file), or **BOUNDED** — members
  named plus an explicit residual. The enumeration DECLARES which form it is, so a reader checks the
  justification rather than the list's plausibility. "I can name no more" is not a form; it is the
  state every failed enumeration on this record was in, and from the inside it is indistinguishable
  from closure. COROLLARY: classifying a record FALSIFIES an enumeration but never closes one —
  Case 7's classification destroyed the five-move set and could not have proven six complete, which
  is why a derivation was still required after the test passed.

- **2026-09-15 — D-rc13-14: a Decision is a RULE iff it has a DOMAIN OF SITUATIONS, and the test is
  grammar-independent** (settled under R-crc-3; closes D-rc13-9's domain, per Case 9(b)). A Decision
  states a FACT (about one world; no domain), a SCOPE choice (one-off; no domain), or a RULE
  (constrains how something must be done; has a domain). The test is "in which situations does this
  apply?" — a SET means rule. This REPLACES D-rc13-9's "a Decision that states a CONDITIONAL", which
  keyed on GRAMMAR and therefore reintroduced the dodge it was ratified to remove: an author could
  state a rule in prose carrying no WHEN/THEN and fall outside the trigger. A rule that governs no
  situations constrains nothing, so the situation test cannot be dodged by phrasing.


- **2026-09-15 — D-rc13-12: the move set is SIX and is DERIVED from the structure of a mechanism,
  not listed** (ratified in chat by Sal, 2026-09-15; resolves Q-rc13-4). A mechanism is an assembly
  of parts computing outputs from inputs under constraints, and each part is a way to be wrong:
  its FACTS (READ), its input DOMAIN (ENUMERATE), its own PARTS' mutual consistency (COHERE), its
  COMPUTATION (EXECUTE), its PURPOSE (FALSIFY), its CONTEXT (CONFORM). Deriving rather than listing
  is what makes the set checkable instead of asserted — and it earned its keep immediately: Case 7
  classified rc03a's fifteen CRITICALs into it and found FOUR that landed nowhere in the
  five-move set ratified an hour earlier. COHERE — the mechanism's own parts disagreeing — was the
  most-recurring class on the record and the one nobody had named.
  **The Mechanism section's template follows from it**, and is far more implementable than "carry
  an executed case": per rule, the cited facts verified, the domain closed, the parts checked
  against each other, one execution, the blind spot named, the standing rulings checked. An author
  knows when they are done and a reader knows what is missing.
  **Recorded as the stage's own dogfood**: this decision's predecessor asserted four, I could name
  no fifth when asked, and Q-rc13-4 named CONFORM within the hour; then classifying a record found
  COHERE. Twice in one sitting, confidence about closure was wrong. That is the argument for the
  whole stage, produced by the stage on itself.


- **2026-09-15 — D-rc13-11: the unit question is ANSWERED, and its earlier answer was one level too
  low** (settled under R-crc-3; resolves Q-rc13-1). The question asked whether the unit is
  "mechanism" or a WORKED CASE, and the standing recommendation was the worked case, argued on one
  asymmetry: a thin case is visible in two seconds while thin prose is invisible. That argument was
  RIGHT and its conclusion was one level short. A case is visible when it is thin; it is NOT visible
  when it is complete-looking and partial — which is exactly what rc03a's five-state table was, and
  what its channel enumeration was not. The unit is a CLOSED ENUMERATION (D-rc13-7); the same
  asymmetry carries up a level, because an enumeration either closes or it does not, and a reader
  can see which. The worked case survives as the EXECUTE move — one of four (D-rc13-8), not the
  deliverable.


- **2026-09-15 — D-rc13-7: the unit is a CLOSED ENUMERATION per rule, not an executed case** — **DOMAIN CLOSED 2026-09-15 by D-rc13-13 (three forms, declared). Case 8's audit found this rule required closure of everyone else's domains without defining its own.**
  (ratified in chat by Sal, 2026-09-15, on Case 6). An executed case shows ONE PATH through a rule.
  None of rc03a's three failures were on the path anyone walked, and rc03a carried executed cases
  from its first exploration onward — it would have rendered Mature under this stage's original
  exit criterion 1 at every point, and failed three times. What catches those failures is closing
  the DOMAIN the rule ranges over and stating every member's disposition. Executing keeps its place
  — it is how you discover an output is wrong — but it is secondary and, on this evidence,
  insufficient alone.

- **2026-09-15 — D-rc13-8: the stage is re-aimed on FOUR MOVES, two of which already exist as
  rulings and are simply unenforced** — **SUPERSEDED the same day by D-rc13-12: the set is SIX, DERIVED rather than listed. The four named here are real and the list was not closed — Case 7 found COHERE by classifying the record, and CONFORM had already been raised by Q-rc13-4.** (ratified in chat by Sal, 2026-09-15). The charter conflates
  the last two as one affordance; they are distinct:
  ```
  READ       verify the facts the rule cites          read-before-reference — EXISTS, violated
  ENUMERATE  close the domain; state every member     R-crc-7's table — EXISTS, unenforced
  EXECUTE    run it; get an output that can be wrong  rc13's original proposal
  FALSIFY    name what class of defect this misses    nobody owns this yet
  ```
  rc03a EXECUTED three times, skipped READ once and ENUMERATE twice. So this stage's contribution
  is less "add an affordance" than "make two existing rulings enforceable AT EXPLORE TIME, and add
  the one nobody owns". R-crc-7 already says "empty cases are explicit by construction; a blanket
  default does not substitute for stating them" — rc03a shipped prose plus a blanket default, and
  its second pass flagged the R-crc-7 violation as a WARNING and its consequence as a CRITICAL,
  noting they were the same defect at two levels. The ruling had the answer and nothing enforced it.

- **2026-09-15 — D-rc13-9: the trigger is DERIVABLE FROM THE TEXT, so self-classification is
  retired** — **SUPERSEDED 2026-09-15 by D-rc13-14: its "states a CONDITIONAL" test keyed on grammar and reintroduced the dodge it was ratified to remove. The situation test replaces it.** (settled under R-crc-3; resolves Q-rc13-3). The charter scoped the requirement to "an
  exploration whose deliverable is a decision procedure", which the AI would classify about itself
  — dodgeable in one sentence, which is why this question sat at `none yet` through two sessions.
  Under D-rc13-7 the question dissolves: a Decision that states a CONDITIONAL has a domain, and
  either every member of that domain is stated or it is not. Nothing to self-assess. A thin
  enumeration is as visible as a thin case, because an enumeration either CLOSES or it does not —
  which is the same asymmetry that made cases better than prose, applied one level up.

- **2026-09-15 — D-rc13-10: the stage sits AT R-crc-1's ceiling deliberately, and that is stated
  rather than discovered** (settled under R-crc-3). Three capabilities:
  `orbit-explore-modifications` (the convention and the four moves), `orbit-conventions` (the
  five-section format), `orbit-run-summary-emit` (the maturity signal reading enumeration presence
  rather than decision count). None is droppable — removing the emit change leaves the convention
  ADVISORY, which is precisely the failure mode R-crc-7 just demonstrated: a correct ruling nothing
  enforces. Recorded because this stage is being widened immediately after watching rc03a die of
  being harder than its ceiling, and the standing R-crc-1 corollary (split the mechanism or declare
  the stage blocked; never substitute a cheaper one) applies to a stage OVER the ceiling. This one
  is AT it. If the proposal review shows it is over, the corollary says SPLIT — not shrink the
  mechanism.


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

(None open. Q-rc13-2 resolved at promotion — see D-rc13-15.)

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
