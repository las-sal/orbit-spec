## MODIFIED Requirements

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

**THE ORDERING REFUSAL (rc04a).** A payload carrying a JUDGEMENT RECORD — identified by the
presence of `formed_against`, and by nothing else — SHALL additionally pass an ORDERING check:
every token in `formed_against` MUST be STRICTLY EARLIER than the EMIT'S OWN `<TS>` FILENAME
TOKEN — the engine-composed one, compared in that single representation. The record carries no
timestamp of its own; the comparand is the emit's, and naming it explicitly matters because the
emit holds that instant in TWO forms (the colon-bearing JSON `timestamp` and the hyphenated
filename `<TS>`) and comparing across the two would silently never match. A record citing a token equal to or later than that
is REFUSED, naming the offending token and the emit's token. This is the single computed thing about a judgement
record and the reason the record is buildable at all: R-crc-11(g) requires the AI to judge
readiness KNOWING what the independent reviewers returned, belief is not observable, and ORDERING
is. The engine SHALL NOT evaluate whether the judgement was correct, whether the cited passes were
clean, or whether enough of them were cited — it refuses only a claim that COULD NOT have been
informed by the evidence it names.

The check is SCOPED BY PRESENCE so that no emit that exists today can newly fail: a payload with no
`formed_against` field carries no judgement record and is not ordering-checked. The RESOLUTION SOURCE is the trail reader's PASS SET — the same `trail.passes` that clause (a)
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
carries no findings a judgement could have been formed against.

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

- **WHEN** an archive payload carries a `readiness` record whose `formed_against` names a pass token
  later than the emit's own `<TS>` token
- **THEN** the surface exits non-zero naming the offending token and the emit's `<TS>` token; no file
  is written; stdout is empty

#### Scenario: A record citing its own timestamp exactly is refused

- **WHEN** `formed_against` names a token EQUAL to the emit's own `<TS>` token
- **THEN** it is refused — the comparison is STRICTLY earlier, because a judgement formed in the
  same second as the pass it cites cannot be shown to have been informed by it

#### Scenario: An unresolvable citation is refused rather than skipped

- **WHEN** `formed_against` names a token matching no readable pass on the change's trail
- **THEN** the emit is refused naming the unresolvable token — a citation that resolves to nothing
  certifies nothing

#### Scenario: A payload with no judgement record is not ordering-checked

- **WHEN** any emit without a `formed_against` field is composed
- **THEN** the ordering check does not run and the emit's behaviour is byte-identical to before this
  change — the check is scoped by PRESENCE so no existing emit can newly fail
