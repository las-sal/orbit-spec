## MODIFIED Requirements

### Requirement: Payload tables agree with their schema references

For every emit command whose per-command schema is documented in a `references/*schema*.md` file (review, address-reviews, audit-drift, archive), a test SHALL derive the AI-supplied field set from that reference — the top-level keys of its schema block minus one explicit, asserted-non-empty list of engine-owned spine and computed fields — and assert that the command's `payloadFields` table accepts every derived field. A field the reference documents as AI-supplied but the table rejects is a failing test, never an archive-time discovery. The engine table remains the definition and the reference remains its mirror; the test makes them agree without changing which is authoritative. Commands whose payload fields are documented only inline in bodies are outside this requirement (recorded for the artifact-lint stage).

#### Scenario: A documented conditional field is accepted by the table

- **WHEN** the archive schema reference documents `fingerprint_overridden`, `fingerprints_unverified`, and `audit_skipped_via_flag`
- **THEN** the parity test asserts each is in the archive command's `payloadFields`, and removing any one from the table fails the test naming the field and the reference

#### Scenario: Every full-record block is read

- **WHEN** a schema reference carries more than one JSON block whose top-level keys include `command` (the review reference documents change modes and architecture mode separately)
- **THEN** the parity test unions the blocks' keys before subtraction, so a field documented only in a later block (architecture mode's) is checked against the table like any other

#### Scenario: A new engine-owned key must be declared

- **WHEN** a schema reference gains a top-level key that is engine-composed rather than AI-supplied
- **THEN** the test fails until the key is added to the explicit engine-owned list — a visible edit, never a silent pass

### Requirement: Write-gate validation via the shared normalizers

Before ANY write, the composed candidate SHALL pass the same validation the read side uses.
For review emits the gate is MODE-SCOPED (D4's architecture-mode render exemption drawn at
write time): proposal/system review emits pass `orbit-report-rendering`'s strict internal
normalizer (spine semantics, scorecard/findings cell-rollup equality, single-line slot
enforcement, dimension membership); architecture-mode review emits — which that normalizer
rejects by design (`mode` pinned to `proposal|system`, spine `change` required to be a
string) — instead pass the universal-spine checks (which SHALL accept `change: null` plus a
required `doc` for architecture-scoped emits), the same scorecard/findings cell-rollup
equality, and the `orbit-architect`-owned `handoff`-section shape. Every kind passes the
universal-spine checks. Validation failure means NO file, a non-zero exit, the field-naming
error on stderr, and empty stdout. One validator, two gates: the fail-loud boundary that D4
placed at render time moves to write time, so a malformed emit is refused before it becomes a
record rather than discovered when rendered.

**THE ORDERING REFUSAL (rc04a).** A payload carrying JUDGEMENT RECORDS — identified by the presence
of the top-level `judgements` KEY, and by nothing else — SHALL additionally pass an ORDERING check
PER ENTRY. `judgements` is an ARRAY (shape owned by `orbit-run-summary-emit`) and each entry carries
its own `formed_against`, so the check iterates: it is not one comparison against a merged set, and
two entries on one emit may legitimately cite different passes. For EVERY entry,
every token in that entry's `formed_against` MUST be STRICTLY EARLIER than the EMIT'S OWN `<TS>` FILENAME
TOKEN — the engine-composed one, compared in that single representation. The record carries no
timestamp of its own; the comparand is the emit's, and naming it explicitly matters because the
emit holds that instant in TWO forms (the colon-bearing JSON `timestamp` and the hyphenated
filename `<TS>`) and comparing across the two would silently never match. An ENTRY citing a token equal to or later than that
is REFUSED, naming the offending token, the emit's token, and the entry's index — an array of
judgements needs the index or the error cannot be acted on. This is the single computed thing about a judgement
record and the reason the record is buildable at all: R-crc-11(g) requires the AI to judge
readiness KNOWING what the independent reviewers returned, belief is not observable, and ORDERING
is. The engine SHALL NOT evaluate whether the judgement was correct, whether the cited passes were
clean, or whether enough of them were cited — it refuses only a claim that COULD NOT have been
informed by the evidence it names.

The check is SCOPED BY PRESENCE so that no emit that exists today can newly fail: a payload with no
`judgements` key carries no judgement record and is not ordering-checked. Scoping on the KEY rather
than on a nested field is what keeps the check cheap and total — the engine decides whether to
descend at all before it reads anything inside. The RESOLUTION SOURCE is the trail reader's PASS SET — the same `trail.passes` that clause (a)
coverage reads, which admits `review-(proposal|system)-<TS>.json` AND `external-(proposal|system)-<TS>.md`.
Naming it matters: an external pass has no JSON emit and `review-external-<TS>.json` is a PACKAGING
record rather than a pass, so without this the most common external citation would look
unresolvable. A token naming nothing in that set is REFUSED as unresolvable rather than silently
skipped — a citation that cannot be resolved certifies nothing, which is the `Q-crc-17` failure
mode in a new field.

Two edges are settled rather than left to the implementer. (a) An `in-context` token is REFUSED:
`formed_against` names INDEPENDENT passes, and an in-context pass is not one — this is a
well-formedness check on the citation, not the forbidden judgement about whether ENOUGH passes were
cited. (b) A REJECTED external return (`trail.rejectedExternals` — a return that came back
unreadable and still cost a run) is not a pass and citing one is REFUSED: it satisfies no slot and
carries no findings a judgement could have been formed against. (c) The cited pass's MODE is
DELIBERATELY NOT CHECKED, and this is settled rather than overlooked: `TrailPass.mode` is as
observable as the other two, so a terminal `readiness` at archive citing only a
`review-proposal` pass could be refused as a category confusion. It is not, because a proposal-phase
pass genuinely CAN inform a terminal judgement — a design objection raised before apply and accepted
without resolution is exactly an `accepted` pair — and refusing it would be the engine ruling on
whether the cited evidence was the RIGHT evidence, which is the judgement R-crc-10 puts off limits.
(d) An EMPTY `formed_against` is REFUSED on a `continuation`/`proceed` entry WHEN ANY independent
pass in the resolution set is strictly earlier than the emit's own token, naming the LATEST such
pass and the entry's index; it is ACCEPTED when none is. `orbit-run-summary-emit` owns the rule's
statement and its scope (the exemption exists for `continuation`/`proceed` alone); this requirement
names it because THIS is the check that performs it, and a reader asking what the ordering check
may refuse must find it here.

**Edge (d) is well-formedness, NOT sufficiency, and the distinction is the same one edge (a)
already turns on.** The SHALL-NOT above forbids the engine judging whether ENOUGH passes were
cited — a question about adequacy, answerable only by opinion, and it remains forbidden: the engine
still never asks whether two passes should have been three. Edge (d) asks something the trail
answers outright — the entry asserts *there was nothing to cite*, and the trail either bears that
out or contradicts it. Refusing a contradicted assertion is the same act as refusing an
`in-context` token or a rejected external: the CITATION is malformed, not the judgement inadequate.
The boundary is ZERO: at zero the claim is checkable against the trail; above zero, adequacy is
opinion and the engine stays out.

Edges (a), (b) and (d) are well-formedness of the CITATION; mode would be an opinion about the
JUDGEMENT.

#### Scenario: Scorecard/findings mismatch refused at write

- **WHEN** a review payload's scorecard shows zero warnings while its findings contain a WARNING entry
- **THEN** `orbit emit review` exits non-zero naming the mismatched cell; no file is written; stdout is empty

#### Scenario: Forged single-line slot refused at write

- **WHEN** a review payload's finding title contains an embedded newline
- **THEN** the surface exits non-zero naming the slot; no file is written

#### Scenario: Architecture-mode review emit passes the mode-scoped gate

- **WHEN** `orbit emit review --doc my-program` composes an architecture-mode summary (`change: null`, `doc`, `handoff` section) with a valid spine and a rollup-consistent scorecard
- **THEN** the emit writes — the strict internal normalizer (proposal/system-only) is not applied; the universal-spine checks accept `change: null` + `doc`, and a missing or malformed `handoff` section is refused naming the section

#### Scenario: A readiness record citing a LATER pass is refused

- **WHEN** an archive payload's `judgements` array holds a `readiness` entry whose `formed_against`
  names a pass token later than the emit's own `<TS>` token
- **THEN** the surface exits non-zero naming the offending token and the emit's `<TS>` token; no file
  is written; stdout is empty

#### Scenario: A record citing its own timestamp exactly is refused

- **WHEN** an entry's `formed_against` names a token EQUAL to the emit's own `<TS>` token
- **THEN** it is refused — the comparison is STRICTLY earlier, because a judgement formed in the
  same second as the pass it cites cannot be shown to have been informed by it

#### Scenario: An unresolvable citation is refused rather than skipped

- **WHEN** an entry's `formed_against` names a token matching no readable pass on the change's trail
- **THEN** the emit is refused naming the unresolvable token — a citation that resolves to nothing
  certifies nothing

#### Scenario: The check runs per entry, not over a merged set

- **WHEN** an emit's `judgements` array holds two entries, one citing only earlier tokens and one
  citing a later token
- **THEN** the emit is refused naming the SECOND entry's index and its offending token — a valid
  entry does not rescue an invalid one, and a merged comparison would have hidden it

#### Scenario: An empty citation is refused when the trail contradicts it

- **WHEN** a `continuation`/`proceed` entry carries `formed_against: []` and the resolution set holds
  an independent pass strictly earlier than the emit's own token
- **THEN** the emit is REFUSED, naming the LATEST such pass and the entry's index — the entry
  asserts an empty cadence and the trail contradicts it, which is a malformed CITATION rather than
  an opinion about whether enough passes were cited

#### Scenario: An empty citation is accepted when the trail bears it out

- **WHEN** a `continuation`/`proceed` entry carries `formed_against: []` and no independent pass in
  the resolution set precedes the emit's own token
- **THEN** the ordering check ACCEPTS it — the assertion is true of the trail, and this is the case
  that makes the record total over the proceed-anyway domain

#### Scenario: Sufficiency above zero remains outside the engine

- **WHEN** an entry cites ONE independent pass while two preceded the emit
- **THEN** the emit is ACCEPTED — whether the cited evidence was ENOUGH is the judgement R-crc-10
  puts off limits, and edge (d)'s boundary is exactly zero

#### Scenario: A payload with no judgement record is not ordering-checked

- **WHEN** any emit without a `judgements` key is composed
- **THEN** the ordering check does not run and the emit's behaviour is byte-identical to before this
  change — the check is scoped by PRESENCE so no existing emit can newly fail
