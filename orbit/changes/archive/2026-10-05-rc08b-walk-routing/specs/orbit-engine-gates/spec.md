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
at this stage and this gate SHALL NOT be specified as though it did. (The walk surface writes one
record per discovered source, per `orbit-address-reviews`' `One invocation writes one log per
discovered source`.)

**EXISTENCE FIRST.** A pass carrying any SUBSTANTIVE (CRITICAL or WARNING) finding SHALL have at
least one `address-reviews-*.json` record whose `source_path` references its findings artifact.
Absent any such record that pass is UNRESOLVED — never vacuously resolved. A pass with no findings,
and a pass whose findings are ALL SUGGESTION-grade, need no resolution run at all: requiring a walk
before a suggestion-only pass could clear the gate would be SUGGESTIONs gating by another route,
which is the defect this clause exists to remove.

**ONE READABILITY PREDICATE, ONE FALLBACK.** Per-entry resolution data is AI-authored narrative:
the emit surface checks some entry fields at write time — those `orbit-emit-composition`'s `The walk
write gate checks sweep evidence` and `A ripple-miss pointer resolves and is counted` name — written
logs are never re-validated, and four generations of the shape exist on real trails. The gate asks ONE question of the most recent record referencing the pass's findings artifact.

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
- **THEN** the gate is unpassed with reason naming the pass (`pass <token> has unresolved substantive findings`)

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

## ADDED Requirements

### Requirement: A reviewed gate lists its outstanding passes

A reviewed gate whose state is `unpassed`, `stale` or `passed` — `superseded` being a flag on one of those, never a state of its own — SHALL report EVERY pass its resolution clause finds unresolved, not only the first: its status row carries `unresolvedPasses`, an array in token order (oldest first) of `{token, file, mode, source}` — `token` the pass's filename `<TS>` token, `file` its repo-relative path, `mode` its review mode, `source` `internal-review` or `external`. The array is `[]` when every pass is resolved. It is computed by the same predicate and the same pass set as the resolution clause of `Reviewed-gate pass condition — the computed convergence criterion`, so its first element is the pass the gate's `reason` names; a `passed` gate carries `unresolvedPasses: []` from its own return path. `reason`, the position readout and every human rendering are unchanged.

When the gate's canonical next command names a walk because a pass is unresolved, it SHALL be the change-scoped form `/orbit:address-reviews <change>`, naming no file: the walk discovers every listed pass, and the `openPair` stop applies (`orbit-address-reviews`' `Address-reviews command available`). A `--from-file` aim at one pass would walk one half and skip both. The blind-pair command that precedes it in the canonical-next order is unchanged.

When the gate's own pair diagnosis — the computation behind the `reason`'s pair note — finds the cadence's blind-pair slot open with a pairable member standing and the other class missing, however many members of the standing class there are, the row SHALL also carry `openPair: {missing}`, `missing` `fresh` or `external`: the same fact the pair note states in prose, now a field a reader need not parse. Absent otherwise.

A `blocked` gate computes no resolution and carries neither field. A `superseded` gate carries both as computed; whether a reader acts on a superseded gate's list is the reader's rule (`orbit-address-reviews`' `Address-reviews command available` does not).

The fields REPORT; nothing new is ruled (R-crc-13). `orbit status --change <name> --json` carries them on the gate row, and they are the outstanding set the walk discovers.

#### Scenario: Two unresolved passes are both listed

- **WHEN** a `review-system` gate's trail holds a fresh pass at `T1` and an external return at `T2`, both with unwalked substantive findings
- **THEN** its row carries `unresolvedPasses` with two entries, `T1` first, `source` `internal-review` then `external`, and `reason` still names `T1`

#### Scenario: A resolved gate lists nothing

- **WHEN** every pass on a reviewed gate's trail is resolved
- **THEN** its row carries `unresolvedPasses: []`

#### Scenario: An open pair is a field

- **WHEN** a `review-system` gate's trail holds a fresh pass and no external pass on the same state, and the cadence's blind-pair slot is open
- **THEN** its row carries `openPair: {missing: "external"}` beside the unchanged `reason`

#### Scenario: The walk next names no file

- **WHEN** a `review-proposal` gate's first unresolved pass is `review-proposal-T1.json` and no blind pair is open
- **THEN** its canonical next command is `/orbit:address-reviews <change>`, with no `--from-file`

#### Scenario: Two fresh passes and no external still report the open pair

- **WHEN** a `review-system` gate's trail holds two pairable fresh passes and no external pass
- **THEN** its row carries `openPair: {missing: "external"}`

#### Scenario: A blocked gate carries neither field

- **WHEN** `review-system` is blocked by an incomplete `apply`
- **THEN** its row carries no `unresolvedPasses` and no `openPair`
