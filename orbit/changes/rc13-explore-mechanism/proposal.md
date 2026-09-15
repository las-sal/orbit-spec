# Proposal: rc13-explore-mechanism

## Why

Invention is supposed to happen in explore. It doesn't — it happens in walks, which is where R-crc-6
found it. Two stages are the evidence:

- **rc02** ran six proposal passes and 72 findings; nine of its first ten CRITICALs were in mechanism
  that did not exist when its exploration closed.
- **rc03a** ran three passes, 15 CRITICALs with zero repeats, two redesigns, and was WITHDRAWN
  having shipped nothing.

The charter's original diagnosis — explorations carry no mechanism — is FALSE and this change does
not rest on it. rc02's exploration carries dense mechanism. rc03a's carried a Mechanism section with
executed cases from its first sitting. Both failed anyway, because **an executed case shows ONE PATH
through a rule and none of those failures were on a path anyone walked.**

Classifying rc03a's fifteen CRITICALs against the parts of a mechanism gives the real shape: eleven
were READ, ENUMERATE or COHERE failures — a cited fact that was not true, a domain member never
handled, or two parts of the mechanism assuming incompatible things. **Zero were EXECUTE failures.**
Every executed case ran correctly on the path it walked.

Two of those three moves already exist as rulings that nothing enforces at explore time:
read-before-reference, and R-crc-7's decision-table corollary ("empty cases are explicit by
construction; a blanket default does not substitute for stating them"). rc03a shipped prose plus a
blanket default, its second pass flagged the R-crc-7 violation and the CRITICAL it produced as the
same defect at two levels, and nothing had checked.

## What Changes

- **The explore convention gains a MECHANISM section, and its unit is a CLOSED ENUMERATION per
  rule** — not an executed case. Executing keeps its place as one move of six.
- **A Decision is a RULE iff it has a DOMAIN OF SITUATIONS**, tested by asking which situations it
  governs. Deliberately grammar-independent: a form-based test ("states a conditional") lets an
  author write a rule in prose carrying no WHEN/THEN and fall outside it.
- **Closure has THREE DECLARED FORMS** — DERIVED (from a structure whose parts are known), SOURCED
  (exhaustive over a set an authority defines), BOUNDED (members plus an explicit residual). The
  enumeration declares which. *"I can name no more"* is not a form; it is the state every failed
  enumeration on this record was in, and from the inside it is indistinguishable from closure.
- **Six moves per rule**, derived from the parts of a mechanism: its FACTS (READ), its DOMAIN
  (ENUMERATE), its own PARTS' consistency (COHERE), its COMPUTATION (EXECUTE), its PURPOSE
  (FALSIFY), its CONTEXT (CONFORM).
- **The maturity grid's TOP RUNG loses its promotion.** Without a closed enumeration for every rule,
  `>=4 decisions` renders the middle rung's deferring language plus a named gap. Confidence
  currently RISES with heading count on no additional evidence about substance.
- **The explore body gains the RE-ENTRY case**: when the name resolves to an ACTIVE CHANGE, resume
  in place against `orbit/changes/<name>/explore.md` and say so — never scaffold a second staging
  directory beside the authoritative one.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities**:
- `orbit-conventions` — the five-section format gains Mechanism and the rule/closure definitions.
- `orbit-explore-modifications` — the six moves, the Mechanism section's content, the re-entry case.
- `orbit-run-summary-emit` — the maturity signal reads rule-closure rather than decision count.

Three capabilities, AT R-crc-1's ceiling deliberately. None is droppable: without the emit change
the convention is ADVISORY, which is the exact failure R-crc-7 just demonstrated. Per R-crc-9, if
review shows this is OVER the ceiling the answer is to SPLIT the mechanism, never to shrink it.

## Impact

- `src/core/templates/workflows/explore.ts` — the convention, the six moves, the re-entry case.
- `src/core/parsers/explore-counter.ts` — `maturityRecommendation`'s top rung.
- `src/core/emit-composition.ts` — the explore extension fields.
- No schema bump. No migration: an exploration with no rules is unaffected, and existing staging
  directories parse unchanged.
