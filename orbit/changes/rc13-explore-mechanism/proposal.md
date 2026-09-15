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
  rule** — not an executed case. Executing keeps its place as one move of nine.
- **A Decision is a RULE iff it has a DOMAIN OF SITUATIONS**, tested by asking which situations it
  governs. Deliberately grammar-independent: a form-based test ("states a conditional") lets an
  author write a rule in prose carrying no WHEN/THEN and fall outside it.
- **Closure has THREE DECLARED FORMS** — DERIVED (from a structure whose parts are known), SOURCED
  (exhaustive over a set an authority defines), BOUNDED (members plus an explicit residual). The
  enumeration declares which. *"I can name no more"* is not a form; it is the state every failed
  enumeration on this record was in, and from the inside it is indistinguishable from closure.
- **Nine moves per rule, declared BOUNDED**, with the residual stating not only that the set is
  open but HOW IT GROWS (a set-finding is an `@review:` marker plus a review finding against this
  requirement — nothing grows it silently) and the TEST separating a missing move from an
  out-of-domain concern. The set's own history is the argument: five ratified with no sixth
  nameable, classification found COHERE; six ratified, a second record found FEASIBILITY and
  CONSUME; eight ratified, a pass found INVOKE — a rule correct, complete and never invoked.
- **The MACHINE-READABLE FORMAT the enforcement half must parse**: a stable identifier slot per
  Decisions entry, a named Mechanism entry shape (`Domain:` / `Closure:` / one line per move), and
  a `Disposition:` slot with a FIXED vocabulary (`live` / `superseded` / `assigned` / `illustrative`)
  so leaving the closure obligation is a named act rather than whatever word fit the sentence.
- **The explore body gains the RE-ENTRY case**: when the name resolves to an ACTIVE CHANGE, resume
  in place against `orbit/changes/<name>/explore.md` and say so — never scaffold a second staging
  directory beside the authoritative one.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities**:
- `orbit-conventions` — the format gains Mechanism, the per-claim rule test, the BOUNDED closure
  taxonomy, the decision-ID slot, the Mechanism entry shape, and the `Disposition:` vocabulary.
- `orbit-explore-modifications` — the nine moves and the Mechanism section's content, the re-entry
  case, and three MODIFIED requirements carrying the second copy of what this change edits: the
  capability's own `explore.md five-section convention`, `Three invocation modes supported` (whose
  Mode B scenario would otherwise both prescribe creating a staging directory in the promoted-name
  case AND scaffold five sections), and `Boundary residency sweep before emits` (whose slot
  enumeration had no home for Mechanism content).

**DESCOPED 2026-09-15 to stage rc13a under R-crc-9.** The maturity-signal half — `rules_open` /
`rules_total`, the top rung losing its promotion, and the parse instruments — is stage
**rc13b-explore-maturity-signal**, which `Depends-on` this one. A second proposal pass found that
half was a FOURTH capability wide (`orbit-emit-composition`'s computed-extensions requirement
enumerates the explore fields and the four-state grid, both falsified) and that it could not be
implemented at all against a format defining no identifiers and no entry boundaries. R-crc-9 says
SPLIT or DECLARE BLOCKED, never substitute a cheaper mechanism. The split seam is a DEPENDENCY: the
engine half was never buildable first.

**KNOWN AND ACCEPTED**: until rc13b lands, this convention is ADVISORY — an author can ignore it and
no readout notices. That is the interval, stated rather than discovered.

**NOT touched**: `orbit-propose-modifications`' section-to-artifact mapping has no Mechanism row, so
the enumerations this stage produces inform nothing at promotion; and its `All five sections present`
validation scenario keeps specifying five. Both are a follow-on stage's, and no task in this change
edits `propose.ts`.

## Impact

- `src/core/templates/workflows/explore.ts` — the convention, the nine moves, the format slots
  (decision ID, Mechanism entry shape, `Disposition:`), and the re-entry case.
- `src/core/parsers/explore-counter.ts` — `maturityRecommendation`'s top rung.
- `src/core/emit-composition.ts` — the explore extension fields.
- No schema bump. No migration: an exploration with no rules is unaffected, and existing staging
  directories parse unchanged.
