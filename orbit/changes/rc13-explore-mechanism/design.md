# Design: rc13-explore-mechanism

## Context

Two stages are the evidence base, and the second falsified this stage's original cure. rc02: six
proposal passes, 72 findings, nine of its first ten CRITICALs in mechanism that did not exist when
its exploration closed. rc03a: three passes, 15 CRITICALs, zero repeats, two redesigns, WITHDRAWN.
rc03a carried a Mechanism section with executed cases from its first sitting and failed anyway.

Full derivation in `explore.md` — Cases 6 through 9.

## Goals / Non-Goals

**Goals**
- A rule authored in explore cannot reach propose with an open domain, unnoticed.
- The obligations that already exist (read-before-reference; R-crc-7's table) become checkable where
  mechanism is AUTHORED, not only where it is reviewed.
- The engine stops asserting readiness on evidence that cannot support it.

**Non-Goals**
- Making the Mechanism section's CONTENT machine-verifiable. The engine can see whether a rule
  declares a closure form; it cannot judge whether the enumeration is true. That limit is stated,
  not hidden.
- Walk discovery (assigned to rc08) and the one-invocation launcher (assigned to rc03), both of
  which this exploration decided and then handed away.

## Decisions

**D1 — the unit is a CLOSED ENUMERATION per rule, not an executed case.** rc03a would have passed
an executed-case test at every point in its life and failed three times; an executed case shows one
path and none of its failures were on a path anyone walked. Classifying its fifteen CRITICALs:
eleven were READ, ENUMERATE or COHERE; **zero were EXECUTE.**

**D2 — the moves are assembled by CLASSIFICATION and the set is declared BOUNDED.** A mechanism is an assembly of parts computing
outputs from inputs under constraints; each part is a way to be wrong. The derivation is what makes
the set checkable instead of asserted, and it earned that immediately: a five-move set was ratified,
no sixth could be named on request, and classifying rc03a's record found COHERE — four CRITICALs
that landed nowhere in the five. Alternative considered: list the moves. Rejected because the list
was wrong within the hour, by its own author.

**D3 — closure has three DECLARED forms.** DERIVED / SOURCED / BOUNDED. Declaration matters more
than the taxonomy: it moves the reader's check from "does this list look complete" to "does this
justification hold". *"I can name no more"* is not a form — it is the state every failed enumeration
on this record was in, and from the inside it is indistinguishable from closure.

**D4 — the rule test is GRAMMAR-INDEPENDENT.** A Decision is a rule iff it has a domain of
situations. The earlier form — "a Decision that states a CONDITIONAL" — keyed on grammar and was
superseded by this change's own audit: it was ratified specifically to remove a dodge
(self-classification) and reintroduced one, since an author can state a rule in prose carrying no
WHEN/THEN. A rule that governs no situations constrains nothing.

**D5 — only the TOP rung of the maturity grid changes.** The floor and middle already defer; the
middle says "or propose if ready". Only Mature asserts, and it does so on heading count. Confidence
must not rise with heading count on no additional evidence about substance. One branch of one
function; the ratified requirement is MODIFIED, not REMOVED.

## Risks / Trade-offs

- **rc13's own control measurement now runs against an unfixed blindness leak.** rc03a was
  withdrawn on 2026-09-15 with its conflict unresolved and folded into rc03, so this stage's own
  system-review blind pair runs on the engine's default order, where the external half's prompt can
  carry the fresh half's findings. Exit criterion 3 is measured on the NEXT stage's first pass, and
  if that pass is a blind pair its overlap number is not independent. Either run it external-first
  by hand and record that the order was chosen deliberately, or judge criterion 3 on the READ /
  ENUMERATE / COHERE class counts alone, which do not depend on pair independence.
- **Task count sits at 19, inside R-crc-1's `under 20`.** The first pass correctly flagged 23 as an
  overage on the ceiling's FOURTH dimension while the change asserted AT-ceiling on capabilities
  only. The repairs that pass required added tasks, so the list was folded rather than restated:
  bookkeeping steps merged into the task they serve, and every remaining line is a distinct act.
  The capability count is unchanged at 3 and is the dimension R-crc-9 governs.

- **The engine sees form, not truth.** It can check that a rule declares a closure form and names a
  domain; it cannot check that the enumeration is complete. A determined author writes a DERIVED
  claim over a structure they invented. Mitigation is the same asymmetry that makes cases better
  than prose: a bad derivation is visible to a reader, where a confident list is not.
- **This change's own audit is the counter-example to its emit rule.** This exploration reached
  twelve decisions and an engine readout of "ready to formalize" with its two central rules
  unclosed — and no readout would have caught it; a scheduled audit did. The requirement is worth
  shipping and is not sufficient alone. Stated here rather than discovered in review.
- **Three capabilities, AT R-crc-1's ceiling.** None droppable: without the emit change the
  convention is advisory, which is the failure R-crc-7 demonstrated. Per R-crc-9, if review shows
  this is OVER the ceiling the answer is to SPLIT the mechanism, never to shrink it.

## Alternatives considered

- **Keep the executed case as the unit.** Falsified by rc03a (Case 6).
- **List the moves rather than derive them.** Falsified inside the hour (Case 7).
- **Have the engine stop asserting readiness entirely.** Considered and rejected: `next_recommended`
  is a required spine field whose value is a command, so the engine must point somewhere, and
  removing the Mature rung is a REMOVED delta against a ratified requirement for no gain over
  withholding the assertion.

## Migration Plan

None. The absent-Mechanism-section rule is stated in the SPEC, not here: an exploration with no
Mechanism section has no live rules and therefore no open domains, so it is not withheld from the
top rung. Existing staging directories parse unchanged.

## Instruments — what can actually be measured

The maturity-grid change is UNIT-testable in `explore-counter.ts`. The convention and the six moves
are body prose, assertable over the GENERATED surface text — the rc01 instrument class. What is NOT
testable is whether an author's enumeration is true; that is a reader's judgment, and no assertion
in this change pretends otherwise.

## Open Questions

None. Q-rc13-2 resolved at promotion (D-rc13-15).

## Touchpoints

- `src/core/templates/workflows/explore.ts` — the convention, the six moves, the re-entry case.
- `src/core/parsers/explore-counter.ts` — `maturityRecommendation`'s Mature rung.
- `src/core/emit-composition.ts` — the explore extension fields feeding the rung.
- `test/core/parsers/` + `test/core/templates/` — the rung's unit tests and the generated-surface assertions.
