## MODIFIED Requirements

### Requirement: Reviewed-gate pass condition — the computed convergence criterion

A `reviewed` gate SHALL pass when BOTH of the two clauses below hold. Two conventions govern
every rule in them, stated once here because leaving either implicit has repeatedly produced rules
that read correctly and compute wrongly:

**PASS-LIST QUANTIFICATION.** Clause (a) is evaluated over the FRESH pass list (per the
freshness rule); clause (b) over EVERY relevant pass, stale ones included. The `stale` versus
`unpassed` discrimination re-evaluates (a) over the full list: a gate whose full-list
evaluation converges while its fresh-list evaluation does not is `stale`. No individual rule below
restates a freshness condition — the filter has exactly one home, this paragraph.

**EMPTY SETS ARE NEVER VACUOUSLY SATISFYING.** Every rule below quantifies over some set, and each
one states its empty case explicitly. Where a rule's set is empty, the reading is the one that does
NOT advance the gate, unless this text says otherwise in that rule.

**(a) class coverage (ordered slots).** The gate's `cadence` is an ordered list of SLOTS, not a
set. Coverage holds iff THERE EXISTS an assignment of trail passes to slots satisfying every
constraint below — the criterion is existential, and a gate is uncovered only when NO assignment
works. An implementation MAY search greedily from the earliest candidates, but greedy assignment
without backtracking is NOT the criterion: a pair chosen early can raise the lower bound on a
following slot (through that pair's resolution records) and foreclose an assignment that a later
pair leaves open, so a greedy implementation SHALL backtrack rather than report a covered cadence
as unpassed. Each slot is satisfied by pass(es) of the slot's class drawn from the list the quantification
convention selects, and
slot ordering has TWO constraints, both strict: the satisfying pass(es) SHALL be later than every
pass satisfying the previous slot, AND later than every `address-reviews-*.json` record that
resolves a previous slot's pass findings. The second constraint makes a following slot a
CHECK ON THE WALK rather than a pass that merely arrived late. A pass INDEX is consumed by the slot it
satisfies and SHALL NOT satisfy another, so a repeated class requires a distinct later pass.

An `independent` slot is satisfied by any `fresh` or `external` pass meeting those constraints.

A **`blind-pair`** slot is satisfied by TWO passes — one `fresh` and one `external`, DISTINCT
CLASSES, order between them irrelevant — where BOTH members meet the ordering constraints above
(both strictly later than the previous slot's passes and its resolution records) and the two are
BLIND to each other: no `address-reviews-*.json` record
whose `source_path` references EITHER pass's findings artifact carries a token that falls between
the two passes' tokens INCLUSIVE OF THE ENDPOINTS (a walk of an unrelated source — an audit-drift
ingest, say — does NOT break the pair). The slot is satisfied at the LATER of the two tokens,
which is what a following slot must beat. Among the assignments that satisfy the WHOLE cadence, the engine SHALL select the one whose
assigned token sequence is lexicographically smallest, ties broken by findings-artifact filename —
a rule stated over EVERY cadence, pair-bearing or not, because the assignment determines which
passes clause (b) quantifies over and a cadence with two satisfying assignments would otherwise
give two verdicts. For a pair-bearing cadence this resolves to the pair with the smallest later
token, then the smallest earlier token. Selection is TOTAL and implementation-order-independent. "Earliest" is a DETERMINISM
rule over successful assignments, never a pre-filter: a pair that satisfies its own constraints but
forecloses a following slot is not selected in preference to one that completes the cadence.

**Token equality fails SAFE.** Trail tokens are second-granular and distinct events can share one.
Two candidate members sharing a token, or a resolution record WHOSE `source_path` REFERENCES either
member sharing a token with either member, leave blindness UNKNOWABLE (an unrelated walk landing in
the same second does not, exactly as it does not break blindness); the engine SHALL reject such a pair rather than certify it, and the
reason SHALL name the tie. SAME-STATE is otherwise APPROXIMATED, not enforced: the engine observes
apply tokens and walk records, so an unrelated edit between the two passes is an accepted v1 limit
(detection, never a lock).

**(b) resolution.** Every pass's SUBSTANTIVE findings are resolved. Resolution is PER FINDINGS
ARTIFACT: an `address-reviews-*.json` record carries ONE `source_path`, so a `blind-pair` whose
members both carried findings is resolved by ONE RECORD PER MEMBER. R-crc-4's "one merged walk" is
one resolution SITTING by the human, not one emitted record; a multi-source record does not exist
at this stage and this gate SHALL NOT be specified as though it did. (Whether the walk surface
should gain multi-source ingest is rc03's to decide when it owns the cadence templates.)

**EXISTENCE FIRST.** A pass carrying any SUBSTANTIVE (CRITICAL or WARNING) finding SHALL have at
least one `address-reviews-*.json` record whose `source_path` references its findings artifact.
Absent any such record that pass is UNRESOLVED — never vacuously resolved. A pass with no findings,
and a pass whose findings are ALL SUGGESTION-grade, need no resolution run at all: requiring a walk
before a suggestion-only pass could clear the gate would be SUGGESTIONs gating by another route,
which is the defect this clause exists to remove.

**ONE READABILITY PREDICATE, ONE FALLBACK.** Per-entry resolution data is AI-authored narrative:
the emit surface validates the payload KEY and none of the entry shapes, and four generations of
the shape exist on real trails. The gate asks ONE question of the most recent record referencing the pass's findings artifact.

A record is **READABLE** when `resolutions` is a NON-EMPTY ARRAY and EVERY element is an object
carrying
BOTH a recognised `severity` (`CRITICAL` | `WARNING` | `SUGGESTION`) AND a recognised DISPOSITION
(`resolved` | `stale` | `deferred` | `escalated`, read from `outcome`, or from the legacy key
`status` ONLY when the `outcome` PROPERTY IS ABSENT — presence is a property test, not a
non-empty-string test, so a present `outcome` the reader cannot interpret (null, a number, an
object, an unrecognised word) makes the record unreadable rather than reviving the legacy key — both generations are live and readers SHALL tolerate both).

- **Readable record** — COMPLETENESS is checked before disposition. Every SUBSTANTIVE finding of
  the pass SHALL be matched by an entry, keyed by the tuple (TRIMMED TITLE, REPO-RELATIVE FILE) —
  stated directly here because the new-finding match this used to cite was retired with clause (c),
  and a key defined by reference to a deleted rule cannot be derived without archaeology; a record
  naming only some of a pass's substantive findings
  certifies only those, and the pass stays UNRESOLVED. Only then does disposition decide: the pass
  is resolved iff NO entry with `severity` CRITICAL or WARNING
  carries a disposition of `deferred` or `escalated`. SUGGESTION-grade entries NEVER block, whatever
  their disposition and whatever the record's aggregate counters say. The per-entry data is
  PREFERRED over `resolution_summary` when the two disagree.
- **Unreadable record** — anything else, including a `resolutions` that is absent, EMPTY, or not an
  array (real archived records carry a counter OBJECT there, and one carries an empty array), an
  element that is not an object, an
  unrecognised or absent `severity`, and an unrecognised or absent disposition. The gate falls back
  to the bare `resolution_summary.deferred == 0 AND escalated == 0` rule for that record. When
  `resolution_summary` is itself absent or non-numeric, the pass is UNRESOLVED.

The fallback is severity-BLIND by construction, so a pre-capability record that deferred a
SUGGESTION does block — the accepted cost of not guessing at an unreadable shape.

**(c) independent confirmation — RETIRED.** The convergence criterion is clauses (a) and (b)
ONLY. There is no third clause, and the gate SHALL NOT compute whether a change has converged.

The retired predicate read the MOST RECENT independent pass and failed on any CRITICAL, costing
"one further independent pass on the walked state". It is removed rather than repaired because the
question it asked is not the question this cadence answers. Under R-crc-11 a cadence ends when the
AI judges the work ready knowing what the independent reviewers returned — it does NOT end when
reviewers stop finding things. Measured across the eleven gate-era archives that ran a system review, only THREE ever had an
independent pass standing clean on the final state, and none of the recent ones: the retired clause
stated a demand the terminal state almost never satisfies.

Two defects are removed with it rather than fixed. Nothing selects a single pass any more, so a
`blind-pair` slot's earlier-finishing member can no longer carry a CRITICAL the predicate never
reads — the limit the shipped rule declared as its known cost. And no rule demands a further pass,
so the engine never prices a repeat it cannot bound.

**Independent review is NOT weakened, and the reason is structural**: clause (a) coverage requires
the cadence's declared slots, which for `review-system` are a `blind-pair` and an `in-context`
pass. Clause (c) only ever governed what happened AFTER those slots were satisfied. Removing it
removes no review.

The obligation that eventually stands in its place — that a readiness RECORD exist and post-date
every independent pass it cites — belongs to `rc04-readiness-record`, which writes that record.
It is deliberately NOT specified here: a requirement demanding a record no command yet writes
would fail every gate, which is the defect this retirement removes.

Three scenarios were REMOVED with the clause and one REWRITTEN; the change record names each and
why (`rc02c-confirmation-semantics`'s `design.md`, "Scenario accounting").

**Deferred-suggestion aggregation.** The count the reason reports is the number of DISTINCT
SUGGESTION-grade entries carrying a `deferred` or `escalated` disposition, deduplicated by
(trimmed title, repo-relative file) across the most recent resolution record of every pass
relevant to the gate — the SAME (trimmed title, repo-relative file) tuple clause (b) uses for
completeness, so one suggestion deferred across two passes counts once.

The engine SHALL NEVER RE-GRADE a finding's authored severity — the counts it reads are the
reviewer's. The criterion SHALL be computed exclusively from the audit trail — never from AI
self-assessment of review quality.

#### Scenario: Missing class coverage fails the gate

- **WHEN** the cadence requires `external` and no fresh external pass exists
- **THEN** the gate is unpassed with reason `cadence class 'external' has no fresh pass` and the
  canonical next command targets that class

#### Scenario: Blind pair satisfied by two distinct classes with no walk between

- **WHEN** a fresh pass and an external pass stand on the current state and no walk of either
  pass's findings is recorded between their tokens
- **THEN** the `blind-pair` slot is satisfied at the later token

#### Scenario: A walk between the pair breaks blindness

- **WHEN** the external pass's findings are walked before the fresh pass runs
- **THEN** the `blind-pair` slot is UNSATISFIED and the reason says the pair was broken by a walk
  of one member's findings

#### Scenario: Same class twice does not form a pair

- **WHEN** two `fresh` passes run blind of each other with no external pass
- **THEN** the `blind-pair` slot is unsatisfied and the canonical next command targets `external`

#### Scenario: An unrelated walk does not break the pair

- **WHEN** an `address-reviews` record between the two passes references an audit-drift findings
  artifact rather than either pass
- **THEN** blindness holds and the slot is satisfied

#### Scenario: Findings with no completing address-reviews run fail the gate

- **WHEN** a fresh pass has findings and NO `address-reviews` record references its findings
  artifact
- **THEN** the gate is unpassed — existence is checked before any per-entry rule, so an unwalked
  pass is never vacuously resolved

#### Scenario: An unwalked SUGGESTION-only pass does not block

- **WHEN** the latest independent pass carries two SUGGESTIONs, no CRITICAL or WARNING, and no
  `address-reviews` record references it
- **THEN** existence is satisfied without a walk and the gate may pass — a suggestion-only pass
  needs no resolution run, exactly as a findings-free pass does

#### Scenario: Unresolved substantive findings fail the gate

- **WHEN** a fresh pass has a WARNING finding whose walk entry carries `outcome: "deferred"`
- **THEN** the gate is unpassed with reason naming the pass and its unresolved substantive counts

#### Scenario: Deferred suggestions do not fail the gate

- **WHEN** a READABLE record's only deferred or escalated entries are SUGGESTION-grade
- **THEN** clause (b) holds; the gate may pass, and the deferred suggestion count is named in the
  reason

#### Scenario: Legacy `status` is read as the disposition

- **WHEN** every entry carries a recognised `severity` and a disposition, some under `outcome` and
  some under the legacy key `status` (the shape 49 real archived entries use)
- **THEN** the record is READABLE and reads per entry — both disposition keys are live

#### Scenario: A dispositionless entry makes the record unreadable

- **WHEN** any entry carries neither `outcome` nor `status` (the shape 217 real archived entries
  use)
- **THEN** the record is UNREADABLE and falls back WHOLE to
  `resolution_summary.deferred == 0 AND escalated == 0` — a missing field is never read as "not
  deferred"

#### Scenario: An empty `resolutions` array is unreadable

- **WHEN** a record carries `resolutions: []` and a `resolution_summary` reporting two deferrals
- **THEN** the record is UNREADABLE and the bare counts apply, so the pass is UNRESOLVED — an empty
  array never vacuously resolves a pass over its own summary

#### Scenario: A non-array `resolutions` is unreadable

- **WHEN** `resolutions` is a counter object rather than an array (the shape 8 real archived
  records use) and no `resolution_summary` is present
- **THEN** the record is UNREADABLE and, with no readable summary, the pass is UNRESOLVED

#### Scenario: An unrecognised severity makes the record unreadable

- **WHEN** an entry's `severity` is `"blocker"`, `"critical"` in lower case, or absent
- **THEN** the record is UNREADABLE and falls back to the bare counts — an unreadable severity is
  never treated as non-substantive

#### Scenario: System gate passes on a resolved external, with no confirmation clause

- **WHEN** a `review-system` gate has full ordered class coverage and its latest external pass
  carried findings that are resolved per clause (b)
- **THEN** the gate passes on (a) and (b) alone; whether that external pass carried a CRITICAL is
  IRRELEVANT to the verdict, because no clause reads it — a CRITICAL that was found, walked and
  resolved is a resolved finding like any other

#### Scenario: A viable assignment is found rather than foreclosed

- **WHEN** an earlier candidate pair's findings were walked late and a later candidate pair's were
  walked promptly, so only the later pair leaves the following slot's pass admissible
- **THEN** coverage HOLDS — the criterion is existential, and a greedy implementation backtracks
  rather than reporting a covered cadence as unpassed

#### Scenario: The earliest qualifying pair is taken

- **WHEN** a fresh pass at T2 can pair blindly with an external at T1 or a later external at T4,
  and an in-context pass sits at T3
- **THEN** the pair is assigned at T2 (the earliest qualifying pair) and the in-context pass at T3
  satisfies the following slot — the cadence is covered, and the late second external neither
  invalidates it nor demands a further pass

#### Scenario: A following slot must beat the previous slot's resolution records

- **WHEN** the trail is external T1, fresh T2 (a valid pair), in-context T3, then the pair's two
  resolution records at T4 and T5
- **THEN** the `in-context` slot is UNSATISFIED — its pass precedes the walk it exists to check —
  and the gate is unpassed naming the ordering

#### Scenario: A pair member cannot be reused from the previous slot

- **WHEN** cadence `[external, blind-pair]` has external T1 and fresh T2, and T1 would serve both
  the first slot and the pair's external member
- **THEN** the pair is UNSATISFIED — both members must be strictly later than the previous slot's
  pass, and a consumed pass index never satisfies a second slot

#### Scenario: Token ties fail safe

- **WHEN** two candidate members share a timestamp token
- **THEN** the pair is REJECTED rather than certified, and the reason names the tie. (A resolution
  record sharing a member's token is covered by the INCLUSIVE blindness interval rather than by this
  rule. Two candidate PAIRS sharing both tokens is not stated because it is UNREACHABLE: two
  artifacts of one class in one mode cannot share a token, since the filename embeds it — settled
  2026-09-14 by the blind pair's own disagreement, one half calling it unreachable and the other
  filing it with a reproduction.)

#### Scenario: An unrecognised disposition makes the record unreadable

- **WHEN** an entry carries an `outcome` outside the closed four (e.g. `"deferred to rc04"`)
- **THEN** the record is UNREADABLE and falls back to the bare counts — never a pass on an
  unrecognised token

#### Scenario: A deferred SUGGESTION does not block a readable record

- **WHEN** a readable record holds one resolved WARNING and one deferred SUGGESTION, and its
  `resolution_summary` therefore reports `deferred: 1`
- **THEN** the pass is RESOLVED — the per-entry data is preferred over the severity-blind
  aggregate, which is the whole point of making SUGGESTIONs non-gating

### Requirement: Review budget reported beside the gate state

A `reviewed` gate SHALL accept an optional `budget` — a positive integer declaring what the gate's
cadence is EXPECTED to cost in independent review passes. **The declaration is documentation for
the schema author; NOTHING CONSULTS IT.** The engine SHALL NOT compare it against actual spend,
SHALL NOT derive an exhaustion signal from it, and SHALL NOT let it colour any gate state, reason
string, position token or recommendation. A reader who finds `budget: 3` and concludes that it
constrains something has been misled, and this sentence exists to prevent that.

**NO SURFACE RENDERS SPEND AGAINST THE DECLARATION.** The prohibition above enumerates the four
COMPUTED outputs, and a rendered gate row is none of them — so it is stated separately here, because
the readout that motivated this change was exactly that: a terminal row reading `[spend 4/3]`. A
ratio is a verdict wearing a figure's clothes. The rule is about COMPOSITION, never about
co-presence, and it splits by surface. On every RENDERED surface — the live gate row and the
superseded gate row — `independentSpend` appears ALONE: never as a fraction of `budget`, never
beside a label derived from comparing the two. The JSON projection carries `budget` and
`independentSpend` as SEPARATE named fields and composes neither; the declaration is a real part of
the schema and stays readable there. What may not exist on any surface is the two of them divided.

The reason is R-crc-11(h): effort is RECORDED, never TARGETED. A cost target distorts the behaviour
it measures — a cadence stops early to hit a number — while a cost record is how the tool gets
better. `budgetExhausted` was target-shaped by construction: it said "you have spent too much",
which is the one thing a cost record must not say. It is RETIRED, together with the
`independentSpendFresh` trigger count that existed only to fire it and the `BUDGET-SPENT` position
tokens that rendered it.

What survives is the RECORD. The engine SHALL count independent passes (`reviewer_class` `fresh` or
`external`) on the gate's mode across the WHOLE trail, STALE PASSES INCLUDED (spend is spend; a
pass invalidated by a later apply was still paid for), and SHALL report TWO NAMED FIELDS on the
gate's status: `budget` (the declaration, when present) and `independentSpend` (what the cadence
actually cost). The names are normative: a new field on the gate status reaches
`orbit status --change --json` and the terminal gate row only when BOTH field-by-field projections
carry it.

**Spend counts REJECTED returns too.** An external findings file that fails the trail reader's
shape validation — which uses the ONE SHARED CommonMark fence tracker (a fence closes only on a run
of the same character at least as long as the opener with whitespace after, so a three-backtick line
inside a four-backtick fence is body), requires the format's canonical metadata, and requires every
counted finding to carry the full `### Title` / `**File**:` / `**Description**:` triple the
`--from-file` ingestion contract requires — is not a pass, and does not satisfy coverage. It DOES
count toward the recorded spend, because the attempt was paid for whether or not it returned a
usable artifact. The trail reader SHALL surface rejected external artifacts separately from
cadence-eligible passes, and the gate's reason SHALL NAME them (`1 external return rejected as
malformed — <filename>`). Naming a rejected artifact is not reporting the spend: it names the
rule that fired — a return arrived and could not be read — which is exactly what the reason slot
is for, and it survives the rule that the reason NEVER carries the spend figure.

**Mode attribution survives the demotion.** A rejected artifact is ATTRIBUTED to the mode in its
filename (`external-(proposal|system)-<TS>.md`, recoverable before the shape check runs) and counts
only toward the gate operating on that mode; a reviewed gate whose mode cannot be derived from its
id reports NO SPEND at all rather than counting passes of every mode — but it STILL REPORTS ITS
`budget` when one is declared. The declaration and the record are gated SEPARATELY and always have
independent fates: `budget` is schema text, and deriving a mode has nothing to do with whether an
expectation was declared. Coupling them would be the mirror of the defect this requirement removes
— a figure that appears only when an unrelated field happens to be present. The rule is unchanged from
the exhaustion era except in what it guards: it now keeps a recorded cost attributed to the cadence
that paid it, rather than keeping a trigger from firing on the wrong passes.

Two scenarios were REMOVED with the signal, six REWRITTEN and one ADDED; every other scenario is
preserved byte-identically. The change record names each and why (`rc02c-confirmation-semantics`'s
`design.md`, "Scenario accounting").

#### Scenario: An open pair outranks the walk recommendation

- **WHEN** one member of an uncovered `blind-pair` slot stands carrying a substantive finding and
  its partner has not run
- **THEN** the canonical next command names the MISSING MEMBER's class, not the walk, and the reason
  carries both the pass awaiting resolution and the open pair with the walk deferred

#### Scenario: A partial resolution record certifies only what it names

- **WHEN** a pass carried two WARNINGs and the latest referencing record names one of them resolved
- **THEN** the pass is UNRESOLVED — completeness is checked before disposition, so a record cannot
  certify a finding it omits

#### Scenario: A present but uninterpretable `outcome` does not revive `status`

- **WHEN** an entry carries `outcome: null` alongside `status: "resolved"`
- **THEN** the record is UNREADABLE and falls back to the bare counts — the legacy key is consulted
  only when the `outcome` property is ABSENT

#### Scenario: Nothing pairable standing lets the walk run first

- **WHEN** a pass carrying a substantive finding has gone stale and no pairable independent pass
  stands on the current state
- **THEN** the canonical next command is the walk — there is no pair to foreclose, so deferring the
  resolution would buy nothing

#### Scenario: A blocked reviewed gate reports the spend already on its trail

- **WHEN** a reviewed gate is blocked by an unmet `requires` while two independent passes stand
- **THEN** its row carries the real `independentSpend` — blocking is not an exemption from
  counting

#### Scenario: A finding missing the ingestion triple is not a pass

- **WHEN** an external findings file carries a `### Title` with no `**File**:` or `**Description**:`
- **THEN** shape validation rejects the file — a pass the gate counts must be a pass the walk can
  ingest

#### Scenario: A fenced example is not a review

- **WHEN** an external findings file's only severity headings sit inside a fenced code block, or the
  file omits the format's `**Reviewer**:` field
- **THEN** shape validation rejects it: it satisfies no cadence slot and is recorded as a rejected
  return that still counts as spend

#### Scenario: A rejected external return still costs

- **WHEN** an external findings file fails shape validation and one valid independent pass exists
- **THEN** the spend is two, the rejected artifact is named in the reason, and it satisfies no
  cadence slot

#### Scenario: A stale gate reports its spend

- **WHEN** a previously-converged gate goes stale after an apply, with a recorded spend at or
  above its declared `budget`
- **THEN** the state stays `stale` and the position token reads `STALE` — the spend appears only
  as `independentSpend`, and no token is derived from it

#### Scenario: Stale passes count in the recorded spend

- **WHEN** a gate's trail carries independent passes invalidated by a later apply
- **THEN** they are counted in `independentSpend` — spend is spend — and there is no second count,
  because no trigger remains for one to feed

#### Scenario: A mode-underivable gate keeps its declaration and reports no spend

- **WHEN** a reviewed gate declares `budget: 3` but its id yields no derivable mode
- **THEN** it reports the `budget` declaration and NO `independentSpend` — the declaration is
  schema text and does not depend on mode, while the spend does, and the two are gated separately

#### Scenario: No budget declared

- **WHEN** a reviewed gate declares no `budget`
- **THEN** `independentSpend` is still reported and the gate behaves identically to one that
  declares a budget — the declaration changes nothing the engine computes

#### Scenario: The closed-set consumers are untouched

- **WHEN** an unpassed gate whose recorded spend exceeds its declared `budget` is read by the
  WAITING derivation, the inflection prompt, and the `gate_overridden` record
- **THEN** each sees `state: "unpassed"` and behaves exactly as for any unpassed gate — no
  consumer enumerates a new state, and the spend reaches them only as `independentSpend`, never
  inside `reason`

### Requirement: Gate declaration in schema YAML

The schema YAML SHALL accept an optional `gates:` list. Each gate declares: `id` (unique among
gates and artifacts), `kind` (`tracked` | `reviewed` — a CLOSED set; any other value fails schema
validation), `requires` (artifact and/or gate ids that must be complete/passed before the gate is
runnable), and per-kind fields — `tracks` (checkbox file, `tracked` kind), `inputs` (freshness
scope: artifact ids whose change invalidates a pass; `reviewed` kind; defaults to `requires`),
`cadence` (ordered slot list, `reviewed` kind — see the cadence-entry vocabulary below), `confirm`
(a CLOSED set, `reviewed` kind: `no-new-findings` | `findings-resolved`; defaults to
`no-new-findings`. ACCEPTED BUT INERT — the clause it selected is retired, and the field remains
only so existing schemas stay valid without a version bump), `budget`
(optional positive integer, `reviewed` kind — the DECLARED EXPECTATION per the review-budget
requirement; absent means NO EXPECTATION IS DECLARED — never "unbounded", which would imply the
present form bounds something), `before`
(the target this gate blocks — see legal `before:` targets below), optional `consent` (see the
consent vocabulary below), and optional `instruction`.
There is NO generic pass-condition plugin mechanism — the two kinds are the extension surface.

**Cadence-entry vocabulary** (defined once here; referenced by clause (a) of the reviewed-gate
pass condition and by `spec-driven`): each `cadence` entry is one of the three reviewer classes
`in-context` | `fresh` | `external`, the meta-class `independent` (satisfied by a `fresh` OR an
`external` pass; never `in-context`), OR the compound slot `blind-pair` (satisfied by TWO passes
of DISTINCT independent classes read blind of each other — see the blind-pair rule in clause (a)).
`independent` and `blind-pair` are cadence-only tokens — neither is a value the `reviewer_class`
emit field ever carries.

**Legal `before:` targets**: a declared gate id, a declared artifact id, OR a lifecycle-phase token
from the enumerated set {`apply`, `archive`}. `apply` is modeled by the engine as a phase
(`orbit instructions apply` returns its gate state); `archive` is a lifecycle phase the CLI does
NOT model as an `instructions` target — a gate with `before: archive` is queried through the
archive workflow's gate surface (`orbit status --change <name> --json`, which carries `gates[]` and
`next_command`), never through `orbit instructions archive`.

**Consent vocabulary** (D-arc Stage D1, per `orbit-lifecycle-consent`): `consent` is an optional gate
attribute with the single legal value `user-invoked` (a CLOSED set of one for v1; any other value
fails schema validation). It declares that entry into the gate's `before:` phase requires an
explicit user invocation — the engine PARSES and SURFACES the marker (in `gates[]` JSON and the
readouts per the single-voiced requirement below); the consuming workflow bodies implement the
consent prompt per `orbit-lifecycle-consent`'s provenance rule. The attribute changes NO gate
pass-condition computation — consent is orthogonal to gate state (a gate can be `passed` while
its phase still awaits the user's invocation). `spec-driven` sets `consent: user-invoked` on
`review-proposal` (before: apply) and `review-system` (before: archive).

#### Scenario: Valid gates list parses

- **WHEN** a schema YAML declares `gates:` entries with valid ids, kinds, and references
- **THEN** `parseSchema` accepts it; gate ids participate in the same duplicate/reference/cycle
  validation as artifact ids

#### Scenario: Unknown kind rejected

- **WHEN** a schema YAML declares a gate with `kind: scored` (or any value outside the closed set)
- **THEN** schema validation fails with an error naming the gate id and the allowed kinds

#### Scenario: Unknown cadence entry rejected

- **WHEN** a schema YAML declares a cadence slot outside the five-token vocabulary
- **THEN** schema validation fails naming the gate id and the allowed entries

#### Scenario: Non-positive budget rejected

- **WHEN** a reviewed gate declares `budget: 0` or a negative or fractional value
- **THEN** schema validation fails naming the gate id and the required positive integer

#### Scenario: Consent attribute parses, surfaces, and rejects unknown values

- **WHEN** a schema YAML declares `consent: user-invoked` on a gate
- **THEN** `parseSchema` accepts it and `orbit status --change <name> --json` carries the marker on that gate's
  `gates[]` entry; a schema declaring any other consent value fails validation naming the gate id
  and the single legal value

#### Scenario: Consent does not alter gate computation

- **WHEN** a gate with `consent: user-invoked` meets its pass condition
- **THEN** its computed state is `passed` exactly as without the attribute — eligibility and
  consent are independent axes

### Requirement: Gate-aware status and instructions with position readout

`orbit status --change <name>` (the per-change form; bare `orbit status` is the orientation surface per `orbit-orientation` — D-arc Stage D3) SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons, plus the RECORDED SPEND on a reviewed gate) alongside artifact rows, and a one-line
POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate`).

**THE TWO GATE-ROW SURFACES DIFFER DELIBERATELY, and the split is normative.** The HUMAN row
renders `independentSpend` ALONE — never beside the declaration, never composed with it. The JSON
projection carries the optional `budget` declaration and `independentSpend` as SEPARATE named
fields, composing neither, and OMITS either key entirely when its value is absent rather than
emitting it undefined-valued: an in-process consumer testing key presence must not be told a gate
declares a budget it does not.

Each position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`ready`, `blocked-by-gate`, `unpassed` — there is NO spend-derived token, because no
token may make a recorded cost read as a verdict (the retired forms were `unpassed BUDGET-SPENT`
and `STALE BUDGET-SPENT`), or `(past)` for a superseded gate). **Superseded gates**: a
`reviewed` gate whose `before` phase is already complete (e.g. `review-proposal` after `apply` has
passed) is no longer the active frontier — it gated ENTRY to a phase that has since run. Such a gate
is marked SUPERSEDED (distinct from `passed`: it may never have converged; the flow simply advanced
past it), renders as `(past)`, and is SKIPPED by the single-voiced canonical-next computation so the
recommendation advances to the next actionable gate rather than re-surfacing a moot earlier one.
Step order follows the gate graph's `requires`/`before` edges; ties broken by declaration order in
the schema YAML (v1 relies on declaration order matching flow order, as the shipped `spec-driven`
schema does). `orbit instructions` for a phase whose gate is unpassed SHALL return a `blocked-by-gate`
state carrying the gate id, the human-readable reason, and the canonical next command. JSON outputs
carry the same fields for downstream readers.

#### Scenario: Status shows the position readout

- **WHEN** `orbit status --change <name>` runs on a gated schema
- **THEN** the output includes the position readout and per-gate rows with reasons

#### Scenario: An undeclared budget is absent as a KEY, not merely as a JSON value

- **WHEN** a gate declaring no `budget` is projected to the gate-status row
- **THEN** the row carries NO `budget` key at all — `Object.hasOwn(row, 'budget')` is false, so an
  in-process consumer testing key presence is never told a gate declares what it does not; JSON
  hiding an undefined value is not sufficient

#### Scenario: Spend never renders a position token

- **WHEN** an unpassed reviewed gate's independent spend has reached or exceeded its declared budget
- **THEN** its gate row carries `state: "unpassed"` with `independentSpend` reporting the figure,
  its reason names only the clause that failed, and its position token reads `unpassed` — no
  spend-derived token exists, because a recorded cost must never read as a verdict

#### Scenario: Instructions surface blocked-by-gate

- **WHEN** `orbit instructions apply --change <name> --json` runs while `review-proposal` is
  unpassed AND no task has been checked yet (apply has not started)
- **THEN** the JSON includes `state: "blocked-by-gate"`, the gate id, the reason, and
  `next_command` (the canonical full invocation)

#### Scenario: blocked-by-gate is entry-gated, not a mid-apply re-block

- **WHEN** `orbit instructions apply` runs while `review-proposal` is unpassed/stale BUT one or more
  tasks are already checked (implementation is underway)
- **THEN** the state is `ready` (not `blocked-by-gate`): the gate gates ENTRY to apply and is checked
  only before the first task is completed. Post-apply the `review-proposal` pass goes stale relative
  to the `apply-*.json` emit (expected + moot per the v1 freshness scope) and the gate has already
  served its purpose, so mid-apply continuation is never re-blocked. Apply-parity holds throughout:
  even at entry the gate NEVER hard-blocks — the consuming skill prompts (address / proceed-anyway /
  abort) and records `gate_overridden` on proceed-anyway.

### Requirement: Single-voiced canonical-next computation

The engine SHALL compute ONE canonical next command per change state — the full invocation with
all applicable arguments and flags (e.g. `/orbit:review --as system --reviewer external <change>`
— the merged reviewer-class form, D-arc Stage D5; the retired `/orbit:review-external` invocation
never renders on any recommendation surface, while archived records citing it remain untouched) —
derived from the gate graph and cadence position. When the next uncovered cadence slot is the
`independent` meta-class (satisfiable by a `fresh` OR an `external` pass), the engine's single
canonical command SHALL be the fresh-context review (`/orbit:review --as <mode> --fresh <change>`)
— the lighter proposal-phase default. An external pass also satisfies an `independent` slot for
class-coverage purposes, but the rendered recommendation stays single-voiced: the fresh-context
command only, never co-offered with the external alternative. When the next uncovered slot is `blind-pair`, the canonical command names the class missing from
the earliest pair STILL FORMABLE on this state. A standing pass counts as a candidate member only
while it is PAIRABLE — that is, while no `address-reviews-*.json` record referencing its findings
artifact carries a token AT OR AFTER its own. The bound is INCLUSIVE because the blindness interval
is: a record sharing a member's token already falls inside it, so an exclusive test would recommend
buying a partner for a pass that cannot form a valid pair. Once a pass has been walked it can never
pair with any later partner, so its class no longer counts as present. DIAGNOSIS USES THE SAME
PREDICATE AS ASSIGNMENT, so the reason and the canonical command can never name different classes,
and a pair excluded by the ordering constraints is reported as FORECLOSED rather than as blindness
broken by a walk that does not exist. One consequence is worth stating rather than leaving as dead
vocabulary: the pairability filter SUBSUMES most of the blindness diagnosis, because a record that
breaks blindness has already made the member it references unpairable, so that member leaves the
candidate set before the blindness test runs. `blindness-broken` therefore survives as a DEFENSIVE
branch — reachable only for a record referencing the later member with an earlier token, which an
ordinary trail cannot produce — and not as a diagnosis a user should expect to see. When a pairable fresh pass stands, the command
is the external invocation; when a pairable external pass stands, the fresh invocation; when NO
pairable independent pass stands, the command is the fresh invocation as the lighter first half AND
the gate's reason SHALL state that both members must run before EITHER is walked. Without the
pairability test the engine recommends a partner for a pass that can never pair, and every
recommended run satisfies no slot while still costing an independent pass.
Recommendation surfaces (gate
reasons, blocked-by-gate payloads, and the workflow handoffs that render them) SHALL present only
this canonical command: no advertised alternatives, no skip paths, and no bare command names
without arguments. Skills render the engine-computed command verbatim.

**Eligibility phrasing (D-arc Stage D1, D-elc-4)**: the canonical-next command SHALL be rendered under
an eligibility-framed label — `Ready when you are:` — never an imperative label (`Next:` and
equivalents are prohibited on every recommendation surface: `orbit status` output,
`instructions` payload rendering, and generated workflow bodies that quote the readout). When the
canonical-next command's phase entry is consent-marked (`consent: user-invoked` on the gate whose
`before:` is that phase), the rendered line SHALL append the marker ` — user-invoked`
(e.g. `Ready when you are: /orbit:apply <name> — user-invoked`). Rationale: words are the API
when the consumer is a model; an imperative label reads as an instruction to execute. Emit FIELD
names (`next_recommended`) are unchanged — display wording only.

**Model-hint garnish (D-arc Stage D5, D-d5-9)**: when `orbit/config.yaml` carries an OPTIONAL
`models:` map and the canonical-next command's phase or cadence slot has an entry, the rendered
eligibility line SHALL append ` — hint: <value>` (after any ` — user-invoked` marker). Valid
keys are the two vocabularies the engine already computes against: the active schema's phase
ids (under the active schema, e.g. `review-proposal`, `apply`, `review-system`, plus any other declared
phase) and the cadence slot names (`in-context`, `fresh`, `independent`, `external`,
`blind-pair`). When both
the resolved command's phase AND its cadence slot carry entries, the SLOT entry wins (the more
specific hook); keys outside both vocabularies are inert (never an error — the map is garnish).
The VALUE is checked only at the rendering boundary: a renderable hint is a non-empty
single-line string of at most 80 characters containing no control characters — the
eligibility line is a model-facing protocol, and an embedded newline could forge additional
readout lines; a value failing the check is INERT exactly like an unknown key (the line
renders without the suffix, byte-identical to an absent entry, never an error). Beyond that
boundary check the hint is pure garnish: the content is not validated, nothing is enforced,
and an absent map (or absent
entry) yields byte-identical pre-capability output. The phase-mapping content itself is
user-owned config, never spec.

#### Scenario: One command, fully specified

- **WHEN** any recommendation surface renders the next step
- **THEN** it is a single complete invocation; phrasings like "run review-external next" (no
  arguments) or "or proceed directly to archive" (advertised skip) do not appear

#### Scenario: Eligibility label, never imperative

- **WHEN** `orbit status --change <name>` renders the canonical next command
- **THEN** the label is `Ready when you are:` (with ` — user-invoked` appended for
  consent-marked phase entries); no recommendation surface renders an imperative `Next:` label

#### Scenario: External slot renders the merged form

- **WHEN** the cadence's next uncovered slot is `external`
- **THEN** the canonical command renders as `/orbit:review --as <mode> --reviewer external <change>` — the retired standalone invocation appears on no surface

#### Scenario: Model hint appends when configured

- **WHEN** `orbit/config.yaml` maps the external slot to `"GPT-5 Codex"` and the canonical next command is the external review
- **THEN** the eligibility line ends ` — hint: GPT-5 Codex`; with no `models:` map the line is byte-identical to pre-capability output

#### Scenario: Malformed hint value is inert at the rendering boundary

- **WHEN** a `models:` entry's value contains an embedded newline (or control characters, or exceeds 80 characters)
- **THEN** the eligibility line renders WITHOUT the hint suffix — byte-identical to an absent entry; no error, no partial injection into the readout

#### Scenario: The blind pair's missing member is the canonical next

- **WHEN** a PAIRABLE external pass stands on the current state and the `blind-pair` slot has no
  fresh partner
- **THEN** the canonical next command is `/orbit:review --as <mode> --fresh <change>` and the gate
  reason says the pair is open, naming the missing class

#### Scenario: A walked pass is not a pairable member

- **WHEN** both a fresh and an external pass stand on the current state but each has been walked,
  so no pair can be formed with any later partner
- **THEN** the canonical next command is the fresh invocation and the reason states that BOTH
  members must run before either is walked — the engine never recommends a partner for an
  unpairable pass

### Requirement: The gate reason names the rule that fired and the rule about to fire

A non-passed reviewed gate's `reason` SHALL name the specific rule that produced the state —
which cadence slot is uncovered, or which pass has unresolved substantive findings — and NEVER the
spend, which is a recorded cost rather than a rule that fired — in terms a reader can act on without opening the
trail. The reason SHALL additionally carry a FORWARD note when the next rule is already
determinable and acting on it early is cheaper than acting on it late.

**AN OPEN BLIND PAIR OUTRANKS THE RESOLUTION RECOMMENDATION.** Clause (b) fails before clause (a)
is reached in the ordinary reading, so the moment one pair member lands carrying a substantive
finding the gate would otherwise recommend walking it — and that walk writes a record between the
two members, foreclosing the pair permanently and costing two further independent passes. Coverage
SHALL therefore be computed even when resolution fails, and when the cadence declares an UNCOVERED
`blind-pair` slot with a PAIRABLE member STANDING, the canonical next command SHALL name the missing
member's class rather than the walk. The qualifier is load-bearing in both directions: with NOTHING
pairable standing there is no pair to foreclose, so a safe outstanding walk SHALL run first rather
than being deferred behind a review of a state no future pair member shares, and the reason SHALL carry BOTH facts — the pass awaiting
resolution AND the open pair, with the walk explicitly deferred until the partner lands. An engine
that recommends the action which forecloses its own cadence is worse than one that recommends
nothing.

The named forward case: when the gate's cadence DECLARES a `blind-pair` slot that is not yet
covered, and one PAIRABLE independent pass stands on the current state without a partner, the
reason SHALL say the pair is open and name the missing class BEFORE the standing pass's findings
are walked — a walk of those findings makes the pair unformable on that
state, and the cost is not recoverable. One further note rides the same slot: a passed gate whose walk deferred
SUGGESTION-grade findings (reported, never blocking).

#### Scenario: Open blind pair announced before the walk

- **WHEN** an external system pass exists on the current state, no fresh partner exists, and no
  walk of that pass has run
- **THEN** the gate's reason states that the blind pair is open and names the missing `fresh`
  class, and the canonical next command targets it

#### Scenario: The reason names the rule, never the spend

- **WHEN** an unpassed gate's independent-pass spend has reached or exceeded its declared budget
  while a cadence slot is still uncovered
- **THEN** the reason names the uncovered slot ONLY; the spend appears in `independentSpend` and
  nowhere in the reason, because naming it would make a recorded cost read as a cause

#### Scenario: Deferred suggestions surfaced on a passed gate

- **WHEN** a gate converges while its completing walk deferred SUGGESTION-grade findings
- **THEN** the gate is `passed` and its reason names the deferred suggestion count — non-blocking
  and never silent

### Requirement: spec-driven v1 gates and cadence

The shipped `spec-driven` schema (version 4) SHALL declare: `review-proposal`
(`kind: reviewed`, requires/inputs the four artifacts, `cadence: [independent, in-context]`,
`confirm: no-new-findings`, `budget: 3`, `before: apply`, `consent: user-invoked`), `apply`
(`kind: tracked`, today's block normalized),
and `review-system` (`kind: reviewed`, `requires: [apply]`,
`cadence: [blind-pair, in-context]`, `confirm: findings-resolved`, `budget: 3`,
`before: archive`, `consent: user-invoked`).
`independent` in a cadence is the meta-class satisfiable by either `fresh` or `external`, and
`blind-pair` is the compound slot requiring one of each read blind of the other (per the
cadence-entry vocabulary). **`confirm` is DECLARED and INERT.** Both gates still carry a value —
`no-new-findings` on the proposal gate, `findings-resolved` on the system gate — so every existing
schema keeps validating without a version bump, but NOTHING READS EITHER. The convergence criterion
is clauses (a) and (b) only, and there are no repeat rules left for a `confirm` value to match: a
cadence ends when the AI judges the work ready knowing what the independent reviewers returned, not
when a predicate certifies that they stopped finding things. The system cadence's
leading slot is the BLIND PAIR — two independent classes on one state before any walk — and its
trailing `in-context` slot is the check on the walk that resolved the pair's findings; a `--fresh`
system run (reviewer_class `fresh`) does NOT satisfy that trailing slot. Both budgets declare the SAME
expected cost — three independent passes — and the declaration is ALL they are; nothing consults
either figure. The proposal gate's cadence is NOT conditional: R-crc-4
describes a near-ceiling proposal running a blind pair, but no engine surface computes size
proximity and this stage does not add one (the size computation belongs with rc09, which owns the
propose-time size check; until it ships, a near-ceiling proposal pair is run by choice, not by the
cadence). No sizing argument attaches to either budget — not headroom for a repeat, not a
threshold to stay under. `budget` records what a cadence is EXPECTED to cost, never what it is
PERMITTED to cost (R-crc-11(h)): a cost target distorts the behaviour it measures, and the figure
this change demoted was doing exactly that. The cadence arrays and budgets live in the schema
YAML — tuning the review rhythm is a schema revision (version bump), not an engine or config
change. Verify remains a command (Pass 0 inside system review), not a gate; audit-drift remains
orthogonal to the gate graph.

#### Scenario: Cadence tuning is a schema edit

- **WHEN** a future revision changes the system cadence
- **THEN** the change is an edit to `schemas/spec-driven/schema.yaml` with a version bump; no
  engine code changes

#### Scenario: v4 declares the blind pair and both budgets

- **WHEN** the shipped `spec-driven` schema (version 4) is parsed
- **THEN** `review-system` carries `cadence: [blind-pair, in-context]` and `budget: 3`, and
  `review-proposal` carries `budget: 3` with its cadence unchanged

#### Scenario: v4 declares the consent-marked seams

- **WHEN** the shipped `spec-driven` schema (version 4) is parsed
- **THEN** both reviewed gates carry `consent: user-invoked` (per the consent vocabulary in the
  gate-declaration requirement), and a v2- or v3-era schema without the newer attributes parses
  and behaves exactly as before the bump

#### Scenario: A v3-era archived trail still computes

- **WHEN** gate state is computed over an archived change whose trail predates `blind-pair`
- **THEN** the computation completes without error, the gate reports its uncovered slot, and no
  live-change orientation row is produced for it — archived changes are not gated, and no
  versioned schema selector exists
