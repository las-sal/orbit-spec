## Context

The reviewed gate is computed, not asserted: `computeReviewedStatus` in
`src/core/artifact-graph/gates.ts` reads the change's `.orbit-runs/` trail and evaluates three
clauses in `evaluateReviewed` — (a) ordered-slot class coverage, (b) resolution over every
relevant pass, (c) a `confirm` predicate over the most recent independent pass. The trail reader
(`src/core/artifact-graph/trail.ts`) supplies `TrailPass` records (token, reviewer class, mode,
per-severity counts, findings as `{title, file}`) and `TrailResolution` records (token,
`sourcePath`, `deferred`, `escalated`). The cadence vocabulary is a closed four-value enum in
`src/core/artifact-graph/types.ts`; the shipped cadences live in `schemas/spec-driven/schema.yaml`
at version 3, where tuning the rhythm is a version bump rather than an engine change.

Every clause counts events. None weighs consequence. The exploration
(`explore.md`) measured what that costs and settled ten decisions; this design records how the
engine-side half of them lands, the ladder half having moved to `rc02b-severity-ladder` (D1). The program doc is `orbit/architecture/clean-up-review-cycle.md`; the
governing rulings are R-crc-1 (the size ceiling), R-crc-3 (method delegated to the authoring AI),
and R-crc-4 (the canonical cadence this stage makes computable). See `explore.md` for the full
decision record and the rejected alternatives summarized below.

Three facts about the existing data shaped the design and were verified before it was written:

- `address-reviews` emits carry per-entry `severity`, so clause (b) can become severity-aware with
  no payload change — but the shape is not uniform, and FOUR generations are live on disk. Of 526
  array-element entries: 260 carry `outcome`, 49 carry the legacy key `status`, and **217 carry
  neither**; every one carries `severity`. Beyond those, 8 archived records carry `resolutions` as a
  COUNTER OBJECT rather than an array at all, with no `resolution_summary`. The fields are narrative
  and the emit surface validates none of them, which is why the clause asks one readability question
  rather than trusting them.
- `TrailFinding` carries only `{title, file}`, so clause (c) needs severity plumbed onto it.
- `schema_version` in `.openspec.yaml` is a consent-era tripwire marker, never a schema selector:
  gate computation always loads the current schema by name.

## Goals / Non-Goals

**Goals:**

- Stop SUGGESTIONs from gating any reviewed gate, in both the clauses that today make them gate,
  reading data the walk already records and failing safe where that data is unvalidated.
- Make R-crc-4's blind pair a computable cadence slot, so "two independent reviewers on one state
  before any walk" is a property the engine checks rather than a habit the prompts request.
- Confirm over the whole of a cadence slot, so a parallel pair's findings cannot depend on which
  member finished last.
- Bound the pathological case with a declared budget whose exhaustion is reported beside the gate
  state, never enforced as a block and never as a state of its own.
- Make the gate's reason the surface that teaches the new rules, including before their cost is
  sunk.

**Non-Goals:**

- **The severity ladder and its evidence tax** — the consequence definitions, the `reproduction`
  field, its write-gate enforcement, and the address-reviews reader are stage `rc02b-severity-ladder`
  (D1). This stage needs only the three severity NAMES, which exist today.
- **Review genres and prompt templates** — the verification pass, the genre split of the external
  prompt, and the removal of the resolved-since list are rc03's, which depends on this stage.
- **Cost rendering and the archive-side residual record** — the cadence line, the
  capture-recapture estimate, and `residual_risk` are rc04's. This stage keeps today's
  `gate_overridden` seam and changes only the reason it carries.
- **Re-grading findings.** The engine never changes a severity a reviewer authored.
- **Byte-exact same-state enforcement for the blind pair.** Blindness is enforced; identical trees
  are approximated. Named as a version-one limit with detection deferred, per R-d-11's house rule
  of a named limit plus detection rather than a lock.
- **A per-change budget override.** Deferred to rc04 (D-rc02-8).
- **Any migration mechanism for v3-era trails.** A test carries the claim instead (D-rc02-10).

## Decisions

### D1 — The stage is split; what a severity MEANS left, what the engine COMPUTES stayed

The original change carried the severity ladder (consequence definitions, the CRITICAL
reproduction tax, its write-gate enforcement) alongside the convergence arithmetic. Its first
fresh proposal review measured it at 40 task checkboxes against R-crc-1's ceiling of under 20,
and found that completing it honestly — the reproduction needs a READER in `orbit-address-reviews`
as well as a producer — took it to five capabilities against a ceiling of three.

Settled under R-crc-3, which places stage sizing with the authoring AI: SPLIT, rather than an
exception to a Sal-ratified ruling. The ladder half is stage `rc02b-severity-ladder`
(`orbit-conventions`, `orbit-emit-composition`, `orbit-address-reviews`). Neither half blocks the
other: the convergence clauses need only the three severity NAMES, which exist today, and the
ladder's definitions change what reviewers write rather than what the engine computes. The split
also produced two coherent theses where there had been four moving parts, which is the better
outcome independent of the arithmetic.

### D2 — Severity-aware clauses, not a third `confirm` value

Clause (b) reads the completing walk's `resolutions[]` entries and blocks only on a CRITICAL or
WARNING entry whose `outcome` is `deferred` or `escalated`; clause (c) counts a new finding only
at CRITICAL or WARNING. `TrailFinding` gains `severity` to make the second possible.

Those per-entry fields are AI-authored narrative — the emit surface validates the payload KEY, not
the entry shapes — so the rule is fail-safe in two directions, both added after the first review
pass traced a trail that would otherwise have passed the gate while its own summary recorded an
unresolved deferral. An `outcome` outside the closed four counts as UNRESOLVED, matching the trail
reader's existing null-means-unresolved precedent. And when `resolution_summary.deferred +
escalated` exceeds the substantive entries read as deferred or escalated, the record falls back to
the bare counts: the summary and the entries disagree, so the gate trusts the more conservative
one. A record with no per-entry `severity` at all (a pre-capability emit) falls back the same way.

The disposition rules are the measured half of this decision, and the measurement corrected the
design twice. A first draft keyed on `outcome` alone and fell back only when per-entry `severity`
was absent — a condition that NEVER occurs on real trails, so the fallback was dead code while 217
entries would have read as resolved. The fix was three fail-safe rules, and the THIRD of them
inverted the change's own goal: it compared the severity-BLIND `resolution_summary` counters against
a severity-FILTERED entry count, so any walk deferring a SUGGESTION fell the record back to the bare
rule and re-gated exactly what this stage exists to exempt.

The lesson was not a fourth rule. Each rule had been validated against the trail that motivated it
and not against the trails the other rules produce, and a clause accumulating fail-safes is a clause
carrying more mechanism than prose can hold. Clause (b) was SIMPLIFIED instead, to one question and
one fallback: a record is READABLE when `resolutions` is an array whose every element is an object
with a recognised severity and a recognised disposition; readable records are read per entry and
PREFER the entries over the aggregate; everything else falls back whole to the bare counts, and an
unreadable record with no readable summary leaves the pass unresolved. That single predicate subsumed
all three fail-safe rules, the fourth on-disk shape, and the missing fail-safe on the severity axis.
EXISTENCE is checked first and separately: a findings-bearing pass with no referencing record at all
is unresolved, never vacuously resolved by a rule that quantifies over an empty set.

R-d-10 tracked this as issue #8, a third `confirm` value `no-new-substantive-findings`. Its intent
ships here exactly; its mechanism is superseded for two reasons. `confirm` is a per-gate
configuration axis, and "SUGGESTIONs never gate" is a rule no schema author should be able to
flip. More decisively, `confirm` selects clause (c) alone, so the literal follow-up would have
left a deferred SUGGESTION blocking through clause (b) as well.

**Correction, measured 2026-09-12.** An earlier draft called clause (b) "the clause that actually
held the D-arc archives", and the trail says otherwise: across all 101 archived `address-reviews`
records, ZERO carry a deferred or escalated disposition at any severity, so clause (b) has never
blocked anything. Both recorded overrides (`d6-pr-lifecycle`, `rc01-instrument-fidelity`) cite
clause (c) verbatim — "latest independent pass carried N CRITICAL; cadence repeats external until
none". The severity-awareness in clause (b) is PROPHYLACTIC, and the honest form of the argument is
that a third `confirm` value would not have touched the clause that did the blocking either, since
it too selects clause (c). The closed two-value `confirm` set stays closed, and issue #8 closes with
a pointer to this change.

A gate that passes while suggestions stand deferred says so: `GateStatus` carries the deferred
substantive-exempt count and the reason names it, so nothing is silently dropped.

### D2a — The defect class is QUANTIFICATION, and the requirement now states its empty cases

Four proposal passes have found ten CRITICALs in this one requirement, and after the fourth the
class is unmistakable: every one is a rule whose English reads as obviously right and whose formal
content is vacuous, inverted, or narrower than the property it carries. Succession quantified over
resolution records and went vacuous when the confirming set was clean — the terminal state it
exists to reach. Readability quantified over entries and went vacuous on an empty array, overriding
the summary that would have blocked. Existence quantified over "any findings" in a clause titled
"substantive", so the stage's headline goal died inside its own text. Canonical-next tested whether
a pass EXISTS where the property needed was whether it can still PAIR.

Settled under R-crc-3, and applied as a sweep rather than a patch. That sweep had to be applied
TWICE: its first application was written through a script that aborted before its single write, so
seven of the seventeen edits never reached the artifact while the scenarios asserting them did — the
delta spent one review cycle contradicting itself in three places. The fifth pass caught it by
grepping each claimed edit rather than re-reading the requirement, which is the verification genre
rc03 owns and the only instrument that can see a walk's claim diverge from its work.

The pass condition now opens with
two conventions stated once — which pass list each clause quantifies over, and that an empty set is
NEVER vacuously satisfying — and every rule beneath states its empty case explicitly. Freshness has
exactly one home instead of being restated inside the pair predicate, where it made the `stale` gate
state unreachable.

The alternative considered and NOT taken: moving clause (b)'s interpretation to the emit boundary,
where `orbit emit address-reviews` would compute one canonical resolution verdict at write time and
the gate would read a single number. That remains the right move if this defect class recurs in
clause (b) specifically, and it is recorded here so a later walk need not rediscover it — but the
fourth pass showed the class spans all three clauses, so relocating one would have fixed a third of
the problem while adding a capability.

### D3 — Clause (c) leaves this change (2026-09-14)

Clause (c) is the SHIPPED predicate with one edit: the new-finding match becomes substantive, so a
new SUGGESTION no longer repeats the independent loop. Nothing else about how confirmation selects
its pass changes here.

That is a REVERSAL of what this change carried for five review passes, and R-crc-8's sectional
trigger is why. Counting CRITICALs by location across six proposal passes, clause (b) took four and
converged while clause (c) took five and did not; the sixth pass put both of its CRITICALs in a
succession sentence written ninety minutes earlier to fix the fifth pass's CRITICAL. One of those
two was decisive on its own: a clean confirming set was FINAL, so an independent pass running after
coverage was met could raise a CRITICAL, have it walked, and never reach the predicate — while the
shipped rule reports unpassed on the identical trail. The rewrite was a strength REGRESSION in the
exact direction this stage exists to prevent.

So the removal is not a retreat. Shipping the unchanged predicate is strictly safer than shipping
the rewrite, and the rewrite's real motivation — with a `blind-pair` slot the later-finishing member
is the one read, so a CRITICAL in the earlier member is invisible — survives as the premise of
`rc02c-confirmation-semantics`, which will specify it as a decision table under R-crc-7 with every
empty case enumerated before any prose. That limit is the status quo today; this stage neither fixes
it nor worsens it.

### D4 — `blind-pair`, with blindness computed and same-state approximated

R-crc-4's "two blind reviews on the same artifact state before any walk" is inexpressible in the
current vocabulary, whose every slot demands a pass strictly later than the previous slot's —
ordering is exactly the property a parallel pair lacks. A fifth cadence entry joins `in-context` /
`fresh` / `external` / `independent`:

```
blind-pair := two passes P1, P2 such that
  class(P1) = fresh and class(P2) = external   (distinct independent classes, order irrelevant)
  both fresh under the freshness rule           (no apply token later than either)
  no TrailResolution R with sourcePath referencing P1 or P2
      and min(token(P1),token(P2)) < token(R) < max(token(P1),token(P2))
slot satisfied at max(token(P1), token(P2))     (what a following slot must beat)
```

Distinct classes are required rather than merely two independents: the pair's value is two
different model families reading one state, which is also what makes rc04's capture-recapture
residual estimate meaningful. Blindness is precise — a walk of an unrelated finding, an
audit-drift ingest say, does not break the pair, while a walk of either pass's own findings does.

When several qualifying pairs exist the EARLIEST is taken. The first draft said the latest, and
the first review pass showed why that is wrong: clause (a) is implemented as a greedy
earliest-satisfying walk, so pinning one slot to the latest candidate can push a following slot
past a pass that already covers it. On a trail of external, fresh, in-context, late-second-external
the cadence is covered by pair-then-in-context, yet "latest" fixes the pair at the fourth pass and
demands a fifth — while the budget simultaneously reports the spend as exhausted. That is the
precise cost this stage exists to remove, manufactured by the stage itself.

The second ordering constraint applies to EVERY slot on BOTH gates, and that is a deliberate
decision rather than a side effect of the pair work. The proposal cadence is not otherwise edited,
yet a common flow there — run the independent pass, run the in-context pass, then walk both in one
sitting — stops satisfying the cadence, because the in-context pass now precedes the walk it must
check. The stage's thesis is fewer passes, so an added pass needs a reason: an unchecked walk is the
hole this closes, and D5 keeps the trailing slot precisely to have something read the walk. The cost
is one pass on a gate whose budget is sized for three.

Coverage is EXISTENTIAL, and saying so is what keeps the pair rule honest. The third proposal pass
showed that "earliest pair" composes with a greedy walk only when the constraint is pass tokens: the
resolution-record constraint is not monotone in the pair's token, so an earlier pair walked late can
impose a later lower bound than a later pair walked promptly, and greedy selection without
backtracking would report unpassed on a covered cadence — the same manufactured cost the "latest
pair" rule was rejected for, arriving by another route. The criterion is that an assignment EXISTS;
greedy search is an implementation that must backtrack.

Two further constraints came from the first external pass, both cases where the prose read
cleanly and the arithmetic did not. BOTH members must beat the previous slot, not merely the
pair's later token: otherwise cadence `[external, blind-pair]` lets one external pass satisfy the
first slot AND serve as the pair's external member, which the general "one pass cannot satisfy two
slots" rule forbids everywhere else. And token equality FAILS SAFE: trail tokens are
second-granular, so a resolution record sharing a token with a pair member leaves blindness
unknowable and two candidate pairs sharing a later token leave selection implementation-defined.
The engine rejects an ambiguous pair rather than certifying it, and pair selection is given a
total order (later token, then earlier token, then findings-artifact filename).

Same-state is approximated, not enforced: two passes with no intervening walk may still straddle
an unrelated edit, and the engine sees only apply tokens and walk records. A per-pass tree
fingerprint would make it literal and belongs with rc04's measurement work; until then this is a
named version-one limit.

### D4a — The merged walk is one SITTING, not one record

R-crc-4 says the blind pair's findings "merge into ONE walk", and the first external pass showed
that the product cannot record that. An `address-reviews` emit carries ONE `source_path`, and
`--from-file` is exclusive to a single input, so a pair whose members both carried findings
produces one record per member no matter how the human works. The first draft of clause (b) and
one of its scenarios described a single record resolving both — a trail orbit cannot emit, and a
test asserting it would have encoded a fiction.

Settled under R-crc-3: clause (b) resolves PER FINDINGS ARTIFACT, and R-crc-4's "one merged walk"
is named for what it is — one resolution SITTING by the human, emitted as one record per source.
Nothing in the engine changes; the blindness property is unaffected, because both records land
after both passes. Whether the walk surface should gain multi-source ingest (`source_paths`, or
per-resolution provenance) is left to rc03, which owns the cadence templates, and is recorded as
such rather than left as an implied need. The alternative — building multi-source ingest here —
would add `orbit-address-reviews` and `orbit-emit-composition` to a change that just shed them.

### D5 — Schema version 4: `[blind-pair, in-context]` for the system gate

The leading `in-context` slot is struck: that class yielded one CRITICAL in roughly 25 passes
across the D-arc. The trailing slot survives deliberately — something must read the walk that
resolved the pair's findings, and under R-crc-4 that something is the verification pass, which is
rc03's to name. Keeping it `in-context` at version 4 preserves the safety property with no new
genre, and rc03's schema edit renames it `verification`, which is precisely the exit criterion
rc03 already declares.

The proposal cadence (`[independent, in-context]`, `confirm: no-new-findings`) is already
R-crc-4's one-blind-review shape and is not edited; the ladder and the budget reach it through the
engine rather than the schema.

Net effect on evidence: the system gate demands **more** independent scrutiny than today — two
distinct independent classes on one state, versus one external — in **fewer** passes. This is not
a loosening.

### D6 — The budget is reported BESIDE the state, not as a state

`budget` is a new optional positive integer on the gate declaration. Version 4 declares 3 for both
reviewed gates. It counts independent passes (`fresh` + `external`) on the gate's mode across the
whole trail, stale passes included — spend is spend, and a change that has burned four independent
passes is over budget whatever invalidated them. Both gates carry the same number because R-crc-4
runs the proposal gate as a pair too whenever the change is within 20% of the R-crc-1 ceiling; a
budget of two would leave such a change exhausted by its own pair before any repeat was possible.

The exploration recorded exhaustion as a SIXTH GATE STATE (`budget-exhausted`) and rejected a flag
on the grounds that a flag would hide the cost. **That decision is reversed here**, and the first
review pass is what surfaced it: three requirements outside this change — `orbit-orientation`'s
WAITING derivation, whose own text says the set is CLOSED; `orbit-run-summary-emit`'s
`gate_overridden.state` enum; and `orbit-archive-modifications`' prompt condition — all enumerate
the five-state set, so a sixth state cost four capability deltas against a ceiling of three.

The capability count is what made us look, but it is not what decides it. The gate `state` answers
one question: has this gate converged, and if not, which clause is unmet. A budget-exhausted gate
is precisely `unpassed` — the budget changes nothing about whether the review converged. Spend and
convergence are ORTHOGONAL axes, and overloading `state` with a spend fact was the modeling error.
Exhaustion therefore surfaces three ways: a `budgetExhausted` boolean on the gate status, the
spend clause in the reason, and the position token `unpassed BUDGET-SPENT`. The human reading the
readout sees the cost — the rejection's actual concern — while every closed-set consumer keeps
working untouched, and rc04 branches on the boolean exactly as it would have on a state.

The `isUnconverged` predicate the exploration proposed is dropped with the sixth state: with the
set back at five values there is nothing to widen, and the consumers this change would have
re-routed are left alone.

The budget has TWO numbers, not one. The REPORTED spend counts every independent pass on the gate's
mode, stale included. The EXHAUSTION TRIGGER counts only passes fresh against the current state.
Without the split, an apply landing mid-cadence staleness-invalidates a whole blind pair and the
gate reports its budget spent halfway through the very re-cover its own next command is asking for —
an artifact of the arithmetic rather than real non-convergence. The two fields are NAMED normatively
(`independentSpend`, `budget`, beside `budgetExhausted`) because the JSON gate row is a
field-by-field projection and rc04 branches on them.

Two edges the first external pass named, both settled toward the conservative reading. A returned
external findings file that fails shape validation is absent from the trail entirely, so under a
naive count a malformed return is FREE — the reason would tell the user to buy another run without
mentioning that one already came back unreadable. Rejected artifacts are therefore surfaced
separately, counted as spend, and named in the reason, while still satisfying no cadence slot. And
a `stale` gate CAN be budget-exhausted: staleness is a form of not-converged and stale passes
already count as spend, so the annotation applies with its own token (`STALE BUDGET-SPENT`) rather
than leaving two defensible renderings to the implementer.

**The budget is a backstop, not an exit.** If the stop rule works, no change reaches it, and a
change that does has told us something the program wants to hear.

### D7 — The reason line teaches, and fires before the cost is sunk

Exit criterion 2 asks the reason to name whichever rule fired. It should also name the rule about
to fire. Once one independent pass exists on a state and its blind partner does not, the reason
says so and the canonical next command targets the missing class:

```
blind pair open: an external pass on this state has no fresh partner; run it before walking
```

Without that line the blind-pair rule is a trap for the sequential habit the D-arc built: walk the
first pass, then discover the pair can no longer be formed on that state. The same discipline
applies to the other reasons — a
deferred-suggestion count on a gate that passed anyway. The reason is read at every status render
and costs nothing.

### D8 — Budget declaration, archive recording, and v3 trails (resolved at promotion)

Three questions the exploration left open, all settled under R-crc-3 by their standing
recommendations (see `explore.md` D-rc02-8 through D-rc02-10):

- The budget is schema-declared per gate with **no per-change override**. The budget is a property
  of the cadence, and the cadence lives in the schema. An override is deferred to rc04, where cost
  is the subject; re-entry trigger is the first change whose budget exhaustion is judged a wrong
  reading of that change rather than a real signal.
- At budget exhaustion the archive records **today's `gate_overridden`**, carrying the gate's own
  reason verbatim — and, because exhaustion is not a state, the recorded `state` stays `unpassed`
  and the archive body needs no change at all. G1's falsification test is an override whose reason
  is "no clean pass yet", so a budget-exhausted override remains consistent with the goal. rc04
  replaces the field with `residual_risk`, branching on the `budgetExhausted` boolean.
- **No migration mechanism** for v3-era trails. Every archived change recomputes under version 4
  with no `blind-pair` on its trail; archived changes are not gated and orientation's gate band
  covers live changes only. The claim that this is cosmetic is verified by a test rather than
  assumed.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — the convergence clauses, the confirming pass set, the
  blind-pair slot predicate, the budget count and report, reason composition, the readout token.
- `src/core/artifact-graph/trail.ts` — finding severity; per-entry resolution severity and outcome.
- `src/core/artifact-graph/types.ts` — the `blind-pair` cadence entry, the gate `budget` field.
- `src/core/artifact-graph/schema.ts` — gate-id-naming validation for cadence entries and budget.
- `schemas/spec-driven/schema.yaml` — version 4, the system cadence, both budgets.
- `src/core/artifact-graph/instruction-loader.ts` + `src/commands/workflow/status.ts` — the two
  gate-row projections that must carry the budget fields.
- `test/core/` — the gate-model suite's new cases and the archived-v3 computation test.

## Risks / Trade-offs

- **A distinct-class blind pair hard-requires an external reviewer for every system cadence.** The
  current system cadence already requires one, so this is not new for `review-system`, but it does
  mean a change cannot converge on two fresh Claude passes. → Accepted: two passes from one model
  family are not the independence R-crc-4 is buying, and rc04's residual estimate depends on the
  distinctness. The gate says which class is missing.
- **The blindness rule can be tripped by habit.** A user who walks the first pass before running
  its partner has spent a pass that satisfies no slot, and the budget counts it. → Mitigated by D7:
  the reason announces the open pair before the walk. The residual case is visible on the trail,
  which is what the program wants to measure.
- **The engine trusts authored severity more than before.** With SUGGESTIONs non-gating, a
  mis-graded CRITICAL-as-SUGGESTION now escapes the gate entirely, where previously it would have
  blocked clause (b). → Accepted: the false-positive bias pushes the other way, the walk still sees
  every finding, and rc02b's consequence definitions are what make the grading trustworthy. This
  stage ships the arithmetic before the definitions arrive; the interim risk is that reviewers
  grade by the old vacuous ladder, which is the status quo, not a regression.
- **A hard write-gate failure on a missing reproduction** is rc02b's risk, not this stage's.
- **Version 4 reinterprets in-flight changes.** Gate computation always loads the current schema,
  so this change's own cadence flips under its own rules mid-flight. → This is the dogfood: exit
  criterion 3 is exactly that the next archive on this repo proceeds through the stop rule.
- **This stage specifies a cadence whose middle step another stage owns.** The blind pair is
  rc02's; the merged walk and the verification genre are rc03's, and rc03 depends on rc02. The
  first external pass found this seam as a defect rather than a risk (a scenario asserting an
  unemittable trail). → Resolved by D4a: rc02 specifies only what the product can record today,
  and the multi-source question is handed to rc03 by name. The residual risk is that rc03 chooses
  differently and clause (b) needs revisiting; that is a delta on one requirement, not a rework.
- **The v4 bump reaches surfaces no delta can touch.** Three sites are inside this change and fixed
  by task 7.2: the verify emit's three hardcoded post-apply recommendations in
  `src/core/emit-composition.ts` and two prose predictions in `apply-change.ts`, all of which would
  name a pass satisfying no v4 slot. Two are outside its three capabilities and are ASSIGNED rather
  than deferred silently: `orbit-conventions`' external-slot sentence to rc02b, which already
  touches that capability, and `orbit-run-summary-emit`'s two v3-scoped examples to rc02c, which has
  capability headroom. Copying an 8.4 KB requirement block to fix two scoped illustrations would
  cost more against an already-breached byte axis than the assignment does.
- **Clause (b) is the mechanism concentration point.** It reads the least validated data on the
  trail and has already been rewritten twice, the second time because its own fail-safes inverted
  the change's goal. → Simplified to one readability predicate and one fallback (D2); if a fourth
  pass finds a fourth defect in this clause, the signal is to move the interpretation to the emit
  boundary where the writer can be held to a contract, not to patch again.
- **Size after six review passes and one scope removal: THREE capabilities, nine requirement
  blocks, 56 scenarios, ~50 KB of delta, 18 tasks. ONE R-crc-1 axis is exceeded — delta bytes,
  against a ~40 KB guide — and one sits AT the ceiling: capabilities, where R-crc-1 reads "at most
  3", so three is compliant rather than breached.** Requirements and tasks remain inside. An earlier
  draft of this bullet called that two breaches; the honest record is one breach and one at-limit. → Held by the non-goals: the ladder is
  rc02b's, and every genre, template, and cost-rendering concern stays with rc03 and rc04.
