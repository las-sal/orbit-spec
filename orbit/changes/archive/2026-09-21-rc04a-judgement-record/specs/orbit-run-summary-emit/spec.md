## ADDED Requirements

### Requirement: The judgement record — one spine, two kinds

A CADENCE JUDGEMENT is a decision formed against INDEPENDENT REVIEW OUTPUT, and it SHALL be
recorded rather than left in narrative prose. The qualifying test is exactly that — *is the
judgement formed against independent review output?* — and it is not a tidiness rule: citing the
passes is the SAME property the write gate's ordering check consumes, so the criterion for
belonging and the constraint that makes the record trustworthy are ONE thing. A judgement citing no
pass has no ordering to check, which is why it does not belong here: method calls, scope calls and
process notes keep their existing homes.

**THE PAYLOAD KEY IS `judgements`, AND IT IS AN ARRAY.** It is a literal top-level payload key on
the commands named below, and it is named here because `orbit-emit-composition`'s payload tables
are a literal allowlist that refuses unknown keys — a record whose key is left to the implementer
is a record that does not ship. It is an ARRAY because a single emit can legitimately carry more
than one judgement: an archive may both continue past an unpassed gate AND assert readiness, and
those are two decisions, not one with two faces. An emit carrying no judgement omits the key
entirely rather than sending an empty array.

Each entry SHALL carry:

```
kind            enum          "continuation" | "readiness"
formed_against  string[]      NON-EMPTY list of independent pass <TS> tokens (fresh or external)
disposition     enum          kind-dependent; see below
reasoning       string        prose — why, in the author's own words (a RECORD under R-crc-10)
ratified_by     enum          "ai" | "user"
```

`formed_against` sits INSIDE each entry, never beside the array: two judgements on one emit may be
formed against different passes, and the write gate's ordering check runs per entry.

`ratified_by` is REQUIRED and is never inferred. The difference between the AI's own belief and a
user's ratification is a fact about the decision that context will not preserve, and a record that
leaves it implicit claims an authority it may not have.

`formed_against` cites BY TOKEN, never in prose. A prose citation — the shape `gate_overridden`
uses — cannot be ordered against anything, which is why no ordering check has ever been possible on
it.

**`kind: "continuation"`** is formed MID-CADENCE and answers *given what came back, what next?*
Its `disposition` is `proceed` (continue past a gate that has not passed, additionally carrying
`gate`, `gate_state` and `gate_reason`) or `spend` (buy a further independent pass past a gate that
HAS passed — a decision the cadence has no other home for).

**When an emit carries BOTH a `continuation/proceed` record and a `gate_overridden` field, their
`gate`, `gate_state` and `gate_reason` MUST be identical, and a mismatch is REFUSED.** The two
coexist until `gate_overridden` is retired, and the retirement argument is that the record is a
STRICT WIDENING of the field — an argument that fails outright if the trail can show them
disagreeing. The constraint is observable, so R-crc-10 permits a check here rather than only a
record.

**`kind: "readiness"`** is formed at the cadence's END. Its `disposition` is `ready` or `not-ready`.

A `not-ready` record is an ARCHIVE-TIME DISSENT: the work was archived against the author's own
judgement. It is NOT a routing decision, and it carries no `destination`. Readiness is admitted
only on `archive`, the archive's completion readout calls the record *the session's own
judgement*, and routing a cadence back to architecture was already excluded from this capability
for want of a reader — so requiring a routing destination here would re-import the excluded
concept through the validator while refusing the honest dissent the one reader describes.
Accordingly `ratified_by` on a `not-ready` record takes EITHER value and records which it was: `ai`
when the belief is the authoring session's own, `user` when a human ratified it. That is the field
doing its ordinary work — the difference between the AI's belief and a user's ratification is a
fact about the decision, and here it is recorded rather than legislated. Every readiness record
additionally carries `accepted`: a list of `{claim, why}` pairs naming what was accepted WITHOUT resolution and
why that was acceptable. The accepted residuals are the assertion's CONTENT, not peer records —
*"I accepted the residual because the scoped pass came back sound"* is one statement, and splitting
it loses the because.

A `not-ready` record RECORDS; it SHALL NOT block. Readiness is a judgement, and an engine that
blocks on it acts on what it cannot observe (R-crc-10); the lifecycle already carries consent, gate
and audit prompts for stopping.

#### Scenario: A readiness record carries its acceptances as content

- **WHEN** a cadence ends with residual risk the author judges acceptable
- **THEN** the record's `accepted` list names each `{claim, why}`, and they appear there rather
  than as separate judgement records

#### Scenario: An empty formed_against is refused

- **WHEN** a judgement entry carries `formed_against: []`
- **THEN** the emit is refused — a judgement formed against no independent output is not a cadence
  judgement, and recording it here would defeat the test that defines the record

#### Scenario: ratified_by is never inferred

- **WHEN** a judgement entry omits `ratified_by`
- **THEN** the emit is refused naming the field — the engine SHALL NOT guess whether a human
  ratified a decision

#### Scenario: An AI-authored archive dissent is accepted

- **WHEN** a `readiness` entry carries `disposition: "not-ready"` with `ratified_by: "ai"` and no
  `destination`
- **THEN** the emit is WRITTEN — the record is the authoring session's own dissent about work that
  archived anyway, and refusing it would leave the archive readout describing a record the engine
  will not accept

#### Scenario: A routing destination is refused as an unknown key

- **WHEN** a `readiness` entry carries `destination`
- **THEN** the emit is refused naming the key — the record's shape is closed, and routing has no
  carrier in this capability

### Requirement: Where a judgement record may appear

`judgements` SHALL appear ONLY on the emits written at the moments a cadence judgement is actually
taken. There are THREE, and the enumeration is CLOSED:

| emit | admits | because |
|---|---|---|
| `apply` | `continuation` | the proceed-past-`review-proposal` decision is taken here |
| `review-external` (T0) | `continuation` | the spend decision is taken at the moment the handoff is packaged |
| `archive` | `continuation` AND `readiness` | `review-system` is overridden here, and the cadence ends here |

The archive admits BOTH kinds, which is why the carrier is an array. This is not symmetry for its
own sake: `gate_overridden` at archive guards `review-system` while apply is gated by
`review-proposal`, and the archive seam is where that override is actually taken — three archived
changes carry the field there. A `continuation/proceed` that could not be recorded at archive would
leave `gate_overridden`'s most common use with no successor, which the stage that retires it
depends on having.

A judgement record supplied on any other emit is REFUSED naming the command. The record marks where
a decision was TAKEN; admitting it anywhere would make its location meaningless, and the location
is what the ordering check is anchored to.

**BOTH HALVES OF THAT TABLE ARE ENFORCED.** The COMMAND half is the payload allowlist, which refuses
the `judgements` key outright on any command outside the three. The KIND half is a separate refusal:
an entry whose `kind` is not in the `admits` column for the command being emitted is REFUSED, naming
the command and the kind. Without it the `admits` column reads as a contract and behaves as a
comment — a `readiness` writes cleanly onto a `review-external` T0 emit, which no surface reads,
producing exactly the write-only record this capability condemns. Kind-per-command is fully
observable, so R-crc-10 permits a check rather than only a record.

**DELIBERATELY NOT ADMITTED HERE: the `address-reviews` emit.** A cadence can also end by ROUTING
the work back to architecture rather than archiving, and that judgement is real. It is NOT carried
by this change, for a reason about READERS rather than size: the archive completion readout is the
single reader that keeps this record from being write-only, and in the routing case there is no
archive to read it. A routing-case record would be exactly the write-only record this capability
condemns. Its carrier belongs with whatever surface reads it, which no stage has yet declared.

#### Scenario: A continuation record names the passes it was formed against

- **WHEN** a further independent pass is bought past a gate that has already passed
- **THEN** the emit carries a `judgements` entry with `kind: "continuation"`,
  `disposition: "spend"`, a non-empty `formed_against` of pass tokens, prose `reasoning`, and
  `ratified_by`

#### Scenario: One archive emit carries both kinds

- **WHEN** an archive both continues past an unpassed `review-system` gate and asserts readiness
- **THEN** `judgements` carries TWO entries — one `continuation/proceed`, one `readiness` — each
  with its own `formed_against`, and the ordering check runs per entry

#### Scenario: A judgement record on an emit that takes no judgement is refused

- **WHEN** `judgements` is supplied on any command outside the closed three
- **THEN** the emit is refused naming the command

#### Scenario: A kind the seam does not admit is refused

- **WHEN** a `readiness` entry is supplied on an `apply` or `review-external` emit — a command that
  admits `judgements` but not that kind
- **THEN** the emit is refused naming the command and the kind; no file is written

#### Scenario: An emit with no judgement omits the key

- **WHEN** an emit carries no cadence judgement
- **THEN** `judgements` is absent entirely rather than present-and-empty, so key presence means a
  judgement was taken
