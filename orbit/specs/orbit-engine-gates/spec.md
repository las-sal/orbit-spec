# orbit-engine-gates Specification

## Purpose
Make the engine review-aware: schemas declare `gates:` (a CLOSED two-kind set — `tracked`
checkbox arithmetic and `reviewed` convergence computed from the `.orbit-runs/` trail), whose
state is a pure function of on-disk artifacts. The engine computes gate state, freshness
(v1 timestamp-token ordering), a single-voiced canonical-next command, and a one-line position
readout; consuming workflows surface inflection prompts at gated phases (apply-parity — the
engine reports, the skill prompts, the user decides, the trail records; gates never hard-block).
## Requirements
### Requirement: Gate declaration in schema YAML

The schema YAML SHALL accept an optional `gates:` list. Each gate declares: `id` (unique among
gates and artifacts), `kind` (`tracked` | `reviewed` — a CLOSED set; any other value fails schema
validation), `requires` (artifact and/or gate ids that must be complete/passed before the gate is
runnable), and per-kind fields — `tracks` (checkbox file, `tracked` kind), `inputs` (freshness
scope: artifact ids whose change invalidates a pass; `reviewed` kind; defaults to `requires`),
`cadence` (ordered slot list, `reviewed` kind — see the cadence-entry vocabulary below), `confirm`
(the independent-confirmation predicate, `reviewed` kind: `no-new-findings` | `findings-resolved` —
a CLOSED set; selects which clause-(c) rule the gate uses; defaults to `no-new-findings`), `budget`
(optional positive integer, `reviewed` kind — the independent-pass ceiling per the review-budget
requirement; absent means unbounded), `before`
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

### Requirement: Upstream `apply:` block normalized as a tracked gate

The upstream `apply:` block (`requires` / `tracks` / `instruction`) SHALL remain valid. When
present, the loader normalizes it into the gates list as a `kind: tracked` gate with id `apply`.
A schema declaring BOTH an `apply:` block AND a `gates:` entry with id `apply` fails validation
(double declaration). Schemas with no `gates:` list and only `apply:` (upstream and existing
project-local/XDG schemas) parse and behave exactly as today. As part of gate reference-validation,
the normalized `apply` gate's `requires`/`inputs` are now checked against declared artifact/gate ids
— so an `apply:` block with a dangling reference (e.g. `requires: [<typo>]`) fails schema validation
eagerly rather than surfacing as a missing artifact at apply time. Well-formed apply-only schemas
are unaffected.

#### Scenario: apply-only schema unchanged

- **WHEN** a WELL-FORMED v1 schema with only an `apply:` block loads
- **THEN** the engine produces one tracked gate (id `apply`) with today's `blocked|ready|all_done`
  semantics; no behavior change is observable (the reference-validation tightening affects only
  malformed schemas with dangling `apply.requires`)

#### Scenario: Double apply declaration rejected

- **WHEN** a schema declares both `apply:` and a gate with id `apply`
- **THEN** schema validation fails naming the conflict

### Requirement: Gate state is a pure function of existing on-disk artifacts

Gate state SHALL be computed on demand from: `.orbit-runs/` filename `<TS>` tokens, review-emit
JSON contents (findings counts, `reviewer_class`), address-reviews JSON contents
(`resolution_summary`, `source_path`), external findings markdown, the tracked checkbox file, and
artifact file existence. The engine SHALL NOT write any dedicated gate-state file; the audit
trail is the gate ledger.

#### Scenario: No new files written by state computation

- **WHEN** `orbit status` or `orbit instructions` computes gate state for a change
- **THEN** no file in the change directory (or anywhere else) is created or modified

#### Scenario: Recomputation reflects new trail entries immediately

- **WHEN** a new `review-system-<TS>.json` lands in `.orbit-runs/` and status is re-run
- **THEN** the computed gate state reflects it with no refresh/sync step

### Requirement: v1 freshness rule — timestamp-token ordering

A pass SHALL be marked STALE when an artifact-changing event exists whose `.orbit-runs/` filename
`<TS>` token is lexically later than the pass's token. v1 artifact-changing events are
`apply-*.json` emits (an apply is the one v1 event that rewrites the artifacts a review pass
judged, so any pass predating it no longer describes current state — D-arc Stage D4 collapsed
the prose formerly restating this in `orbit-review`; the semantics live here alone). Tokens are `YYYY-MM-DDTHH-MM-SSZ` and compare lexically. Files with unparseable
tokens are treated as absent. **v1 scope limitation**: because the only v1 artifact-changing event
is `apply-*.json` and no apply emit can exist before the `apply` gate runs, v1 freshness detects
POST-APPLY staleness only — a `review-proposal` pass never goes stale under v1 (artifact edits
during the proposal phase — address-reviews fixes, regeneration, hand edits — are not v1
artifact-changing events). The `inputs` freshness scope is declared for this upgrade path but is
not consulted by v1. Content-hash freshness is an explicit future upgrade: emits may later add
normalized input hashes keyed by `inputs` and the freshness function gains a clause — the
pure-function architecture is unchanged.

#### Scenario: Apply after pass marks the pass stale

- **WHEN** a review pass token precedes the latest `apply-*.json` token
- **THEN** the gate reports that pass STALE with the reason naming both tokens

#### Scenario: Resolution traffic does not trigger staleness

- **WHEN** only `address-reviews-*.json` or `review-*-*.json` files are newer than a pass
- **THEN** the pass is NOT stale (per-external scoping: resolution and re-review traffic are not
  artifact-changing events)

### Requirement: Tracked-gate pass condition

A `tracked` gate SHALL be: `blocked` while any `requires` entry is incomplete; `ready` when
runnable with unchecked boxes remaining in `tracks`; `passed` (today's `all_done`) when every
checkbox in `tracks` is checked. This is upstream apply's state machine, renamed into the gate
vocabulary — with ONE addition (D-arc Stage D5, the user-validation subset rule): when unchecked
boxes remain but EVERY one of them (a) is named in the engine-verified `user_validation_tasks`
declaration of the MOST RECENT apply emit CARRYING one (per `orbit-run-summary-emit` — the list
persists on the emit; the declaration is STICKY: a durable fact about the tasks, so a later
apply emit without the field leaves the standing declaration governing — retraction happens
where the task lives, via the tasks.md edit that checks the box or removes its marker) AND
(b) self-describes as a handoff (its checkbox line carries the `(User-validation`
marker), the gate SHALL compute `passed` FOR FLOW PURPOSES, carrying the pending task ids as an
annotation — the position readout renders `apply ✓ (awaiting user validation: <ids>)`, the
status row's reason names them, supersession and downstream `requires` treat the gate as passed,
and the canonical next command points forward. The condition is recomputed from disk on every
render (a pure function — no stored state): a new unchecked box outside the declared-and-marked
set breaks the subset and the gate honestly drops back to `ready`. A declaration alone never
suffices (the marker requirement makes mislabeling visible in the tasks.md diff review reads),
and the pending obligation is always surfaced, never hidden.

#### Scenario: Checkbox arithmetic decides

- **WHEN** the tracked file has N checked of M boxes and no user-validation subset condition holds
- **THEN** the gate is `passed` iff N == M, with `N/M` surfaced in the gate's status row

#### Scenario: Only declared user-validation handoffs remain

- **WHEN** tasks.md has one unchecked box `- [ ] 9.6 (User-validation handoff) ...`, and the latest apply emit declares `user_validation_tasks: ["9.6"]`
- **THEN** the apply gate computes `passed` with `userValidationPending: ["9.6"]`; the position renders `apply ✓ (awaiting user validation: 9.6)`; `review-proposal` becomes superseded and the canonical next command is the `review-system` gate's next step — never a backward pointer at a moot gate

#### Scenario: A new ordinary task breaks the subset

- **WHEN** the subset condition held, and a review walk adds `- [ ] 10.1 fix the regression` to tasks.md
- **THEN** the next render computes the apply gate back to `ready` (10.1 is neither declared nor marked) — self-healing, no state file involved

#### Scenario: Declaration without the self-describing marker is insufficient

- **WHEN** the latest apply emit declares `user_validation_tasks: ["9.6"]` but the 9.6 checkbox line lacks the `(User-validation` marker
- **THEN** the subset condition fails and plain arithmetic governs

#### Scenario: The declaration is sticky across later field-less emits

- **WHEN** the subset condition held via an apply emit declaring `user_validation_tasks: ["9.6"]`, and a LATER apply emit carries no `user_validation_tasks` field
- **THEN** the standing declaration still governs and the gate remains `passed (awaiting user validation: 9.6)` — a field omission never silently regresses the readout; retraction is the tasks.md edit

### Requirement: Reviewed-gate pass condition — the computed convergence criterion

A `reviewed` gate SHALL pass when ALL of the three clauses below hold. Two conventions govern
every rule in them, stated once here because leaving either implicit has repeatedly produced rules
that read correctly and compute wrongly:

**PASS-LIST QUANTIFICATION.** Clauses (a) and (c) are evaluated over the FRESH pass list (per the
freshness rule); clause (b) over EVERY relevant pass, stale ones included. The `stale` versus
`unpassed` discrimination re-evaluates (a) and (c) over the full list: a gate whose full-list
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
a rule stated over EVERY cadence, pair-bearing or not, because clause (c)'s confirming pass is a
function of the chosen assignment and a cadence with two satisfying assignments would otherwise
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
  the pass SHALL be matched by an entry, keyed by trimmed title and repo-relative file exactly as
  the new-finding match is keyed; a record naming only some of a pass's substantive findings
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

**(c) independent confirmation (per the gate's `confirm` predicate).** The MOST RECENT pass from
an independent class (`fresh` or `external`; never `in-context`) satisfies the gate's `confirm`
rule: `no-new-findings` requires 0 CRITICAL AND 0 new SUBSTANTIVE (CRITICAL or WARNING) findings;
`findings-resolved` requires 0 CRITICAL AND that pass's findings all resolved per clause (b) (the
relaxed rule for a gate whose independent class repeats only on CRITICALs — e.g. the system
external, where a first external pass with findings later resolved via address-reviews DOES
converge). A **new finding** is matched against same-gate prior passes only, by trimmed
case-sensitive title equality AND repo-relative file path with any `:line` suffix stripped;
SUGGESTION-grade findings are excluded from the match set entirely.

This clause is the SHIPPED predicate, edited on ONE axis only: the new-finding match is now
substantive, so a new SUGGESTION no longer repeats the independent loop. Everything else about how
confirmation selects its pass is UNCHANGED by this stage, deliberately. A rewrite selecting a
confirming pass SET with a succession rule was carried here through five review passes and removed
on 2026-09-14 under R-crc-8's sectional trigger; `rc02c-confirmation-semantics` owns it and will
specify it as a decision table. The known limits of the shipped rule are that stage's premise, not
this one's: with a `blind-pair` slot the later-finishing member is the one read, so a CRITICAL in
the earlier member is invisible to the predicate. That limit is the status quo — it is what the
engine does today — and shipping it unchanged is strictly safer than the rewrite it replaces, which
could certify convergence over a CRITICAL that no independent pass had re-read.

A CRITICAL in that pass fails the predicate and costs one further independent pass on the walked
state. The repeat is NOT BOUNDED BY THE ENGINE. The gate's `budget` PRICES it — the spend is
reported and exhaustion annotated — and the decision to stop is the user's at the inflection
prompt, since exhaustion is a report and never a block. A gate declaring no `budget` repeats with
no reported ceiling.

**Deferred-suggestion aggregation.** The count the reason reports is the number of DISTINCT
SUGGESTION-grade entries carrying a `deferred` or `escalated` disposition, deduplicated by
(trimmed title, repo-relative file) across the most recent resolution record of every pass
relevant to the gate — the same dedup key the new-finding match uses, so one suggestion deferred
across two passes counts once.

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

#### Scenario: The confirming pass is the most recent independent one

- **WHEN** a `blind-pair` slot is covered and the fresh member's token is later than the external
  member's
- **THEN** the fresh member is the confirming pass — the shipped selection rule is unchanged by
  this stage, and the earlier member's invisibility is `rc02c-confirmation-semantics`' premise

#### Scenario: Independent confirmation required

- **WHEN** all coverage and resolution clauses hold but the latest independent-class pass fails the
  gate's `confirm` predicate — a CRITICAL under either predicate, OR (for `confirm: no-new-findings`)
  a new SUBSTANTIVE finding
- **THEN** the gate is unpassed; the canonical next command continues the cadence's
  independent+address loop

#### Scenario: A new suggestion does not repeat the loop

- **WHEN** the latest independent proposal pass carries 0 CRITICAL, no new WARNING, and two new
  SUGGESTIONs
- **THEN** the `no-new-findings` predicate is satisfied and the gate passes

#### Scenario: System gate converges on a resolved external

- **WHEN** a `review-system` gate (`confirm: findings-resolved`) has full ordered class coverage,
  its latest external pass carried findings, those findings are resolved per clause (b), and that
  external pass yielded 0 CRITICAL
- **THEN** the gate passes — the resolved-with-no-CRITICAL external satisfies `findings-resolved`
  even though the findings were "new" relative to prior passes

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

### Requirement: Reviewer-class resolution for legacy trails

When counting class coverage, the engine SHALL read `reviewer_class` from emits (per
`orbit-run-summary-emit`'s `Reviewer-class field on review-cycle emits`); for emits predating the
field it SHALL infer: `flags.fresh: true` → `fresh`; `external-*.md` provenance → `external`;
otherwise `in-context`. Absence of the field never fails gate computation.

#### Scenario: B-arc-era trail computes

- **WHEN** gate state is computed over an archived change whose emits predate `reviewer_class`
- **THEN** classes are inferred and the convergence computation completes

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
cadence-entry vocabulary). The proposal gate's `no-new-findings` confirm matches its repeat rule
(the independent+address pair repeats while the independent pass yields new substantive findings);
the system gate's `findings-resolved` confirm matches its repeat rule (a further independent pass
is bought only by a CRITICAL, so a resolved no-CRITICAL pair converges). The system cadence's
leading slot is the BLIND PAIR — two independent classes on one state before any walk — and its
trailing `in-context` slot is the check on the walk that resolved the pair's findings; a `--fresh`
system run (reviewer_class `fresh`) does NOT satisfy that trailing slot. Both budgets declare the SAME
expected cost — three independent passes. The proposal gate's cadence is NOT conditional: R-crc-4
describes a near-ceiling proposal running a blind pair, but no engine surface computes size
proximity and this stage does not add one (the size computation belongs with rc09, which owns the
propose-time size check; until it ships, a near-ceiling proposal pair is run by choice, not by the
cadence). The budget is sized for that choice being made — one independent pass, a second by
choice, and one repeat — so exercising it never exhausts spend before a repeat is possible. The cadence arrays and budgets live in the schema
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

### Requirement: Gate-aware status and instructions with position readout

`orbit status --change <name>` (the per-change form; bare `orbit status` is the orientation surface per `orbit-orientation` — D-arc Stage D3) SHALL render gate rows (state: `blocked | ready | passed | stale | unpassed`, with
reasons, plus `budget`, `independentSpend`, `independentSpendFresh` and `budgetExhausted` on a
reviewed gate that declares a budget) alongside artifact rows, and a one-line POSITION READOUT of the canonical flow (e.g.
`propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate`).
Each position-readout step token is a gate id or lifecycle-phase token (`propose`, `review(proposal)`,
`apply`, `review(system)`, `archive`); a gate step renders its computed state (`✓` passed, `STALE`,
`ready`, `blocked-by-gate`, `unpassed`, `unpassed BUDGET-SPENT` when an unpassed gate's
`independentSpendFresh` has reached its declared budget, `STALE BUDGET-SPENT` when a `stale` gate's
has, or `(past)` for a superseded gate). **Superseded gates**: a
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

#### Scenario: A budget-exhausted gate renders its own token

- **WHEN** an unpassed reviewed gate's `independentSpendFresh` has reached its declared budget
- **THEN** its gate row carries `state: "unpassed"` with `budgetExhausted: true` and the
  spend-and-clause reason, and its position token reads `unpassed BUDGET-SPENT` — the cost is
  visible in the one-line readout without adding a state

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
recommended run satisfies no slot while counting against the budget.
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
ids (for `spec-driven` v4: `review-proposal`, `apply`, `review-system`, plus any other declared
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

### Requirement: Inflection-prompt override contract

The consuming workflow SHALL fire an inflection prompt when a user invokes a command whose phase
is gated by an unpassed or stale gate, offering exactly: address the gate (halt; canonical next
command), proceed anyway, or abort. Proceeding SHALL be recorded in the command's run summary
(`gate_overridden: {gate, state, reason}`). Gates NEVER hard-block — apply-parity enforcement:
the engine reports, the skill prompts, the user decides, the trail records.

#### Scenario: Override recorded, not prevented

- **WHEN** the user proceeds past an unpassed `review-system` gate at archive
- **THEN** the archive completes and its run summary records the override with the gate's state
  and reason at decision time

#### Scenario: The prompt is the only skip surface

- **WHEN** a gate is unpassed
- **THEN** no recommendation text offers proceeding past it; the option exists only inside the
  inflection prompt fired by the actual invocation

### Requirement: Review budget reported beside the gate state

A `reviewed` gate SHALL accept an optional `budget` — a positive integer bounding the INDEPENDENT
review passes the gate's convergence is expected to cost. The engine SHALL count independent
passes (`reviewer_class` `fresh` or `external`) on the gate's mode across the WHOLE trail, STALE
PASSES INCLUDED (spend is spend; a pass invalidated by a later apply was still paid for), and
SHALL distinguish the REPORTED spend from the EXHAUSTION TRIGGER. The reported figure counts every
independent pass on the gate's mode across the whole trail, stale included — spend is spend, and a
pass invalidated by a later apply was still paid for. The trigger counts only passes that are FRESH
against the current state, plus rejected returns on it. The engine SHALL report THREE NAMED FIELDS on the gate's status: `budget` (the
declaration), `independentSpend` (the reported figure — DISPLAY ONLY) and `independentSpendFresh`
(the trigger count), alongside the `budgetExhausted` boolean. `budgetExhausted` and the
`BUDGET-SPENT` position tokens key off `independentSpendFresh` and NEVER off `independentSpend`;
any sentence elsewhere saying "spend" without qualification means the trigger count. The names are normative: a new field on the gate status reaches
`orbit status --change --json` and the terminal gate row only when BOTH field-by-field projections
carry it.

**Spend counts REJECTED returns too.** An external findings file that fails the trail reader's
shape validation — which uses the ONE SHARED CommonMark fence tracker (a fence closes only on a run
of the same character at least as long as the opener with whitespace after, so a three-backtick line
inside a four-backtick fence is body), requires the format's canonical metadata, and requires every
counted finding to carry the full `### Title` / `**File**:` / `**Description**:` triple the
`--from-file` ingestion contract requires. Two parsers implementing one contract is the defect this
sharing prevents: a lean restatement drifted to a weaker language and admitted a document with no
findings at all as a clean pass. A pass the gate counts must be a pass the walk can INGEST — is
absent from the pass list, so it satisfies no cadence slot — correctly, since
its findings cannot be read. It still COST a model run, and "spend is spend" governs: the trail
reader SHALL surface rejected external artifacts separately from cadence-eligible passes, the
count SHALL include them in BOTH figures — `independentSpend` counts every rejected artifact
attributed to the gate's mode across the whole trail, and `independentSpendFresh` counts those with
no later apply token, the artifact's own filename `<TS>` serving as its token since a rejected
artifact has no pass record — and the gate's reason SHALL name them (`1 external return rejected as
malformed — <filename>`). A rejected artifact is ATTRIBUTED to the mode in its filename
(`external-(proposal|system)-<TS>.md`, recoverable before the shape check runs) and counts only
toward the gate operating on that mode; a reviewed gate whose mode cannot be derived from its id
reports no budget at all rather than counting passes of every mode.

**A STALE gate can be budget-exhausted.** "Has not converged" includes `stale`, and stale passes
explicitly count toward spend, so the annotation SHALL apply to a stale gate exactly as to an
unpassed one: the state stays `stale`, `budgetExhausted` is set, the reason carries spend plus the
staleness, and the position token reads `STALE BUDGET-SPENT`.

**Spend is reported BESIDE the state, never as a state.** The gate `state` answers one question —
has this gate converged, and if not, which clause is unmet — and a budget-exhausted gate is
precisely `unpassed`: the budget changes nothing about whether the review converged. Spend and
convergence are ORTHOGONAL axes, so the engine SHALL keep the gate-state set at its five values
(`blocked | ready | passed | stale | unpassed`) and surface exhaustion as (a) a boolean
`budgetExhausted` on the gate status, set when the count is at or above the declared budget AND
the gate has not converged (`unpassed` or `stale`). A BLOCKED reviewed gate reports its real
figures too: blocking on `requires` is not an exemption from "counts across the whole trail", since
reviews genuinely run before the tracked gate completes or under an override. Its `budgetExhausted`
stays `false` while the pass condition is not runnable, but the spend it already cost is reported
truthfully rather than as zero; (b) the spend clause in the gate's reason; and
(c) a distinct position-readout token (`unpassed BUDGET-SPENT` / `STALE BUDGET-SPENT`). Every closed-set consumer of gate state — the WAITING derivation, the
`gate_overridden.state` record, the inflection prompt's triggering set — therefore keeps working
unchanged, while a human reading the readout sees the cost. A gate that meets its pass condition
is `passed` regardless of what it cost; a gate with no `budget` declared never reports exhaustion.

Exhaustion is a REPORT, never a block — the apply-parity contract is unchanged: the engine
reports, the skill prompts, the user decides, the trail records. The budget is a BACKSTOP, not an
exit: when the pass condition converges as designed, no change reaches it, and a change that does
reach it has recorded a fact worth reading.

#### Scenario: Budget exhausted on an unconverged gate

- **WHEN** a `review-system` gate declares `budget: 3` and `independentSpendFresh` is three while
  the gate's pass condition is unmet
- **THEN** its state is `unpassed` with `budgetExhausted: true`, the reason names the budget, the
  count, AND the clause still unmet, and the canonical next command is unchanged from what that
  clause would otherwise recommend

#### Scenario: Convergence beats budget

- **WHEN** the same gate's pass condition is met after three independent passes
- **THEN** its state is `passed` and `budgetExhausted` is `false` — the field is present whenever
  the gate declares a budget and omitted only when it declares none, so a consumer's branch on it
  stays total; budget is never consulted for a converged gate

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
- **THEN** its row carries the real `independentSpend` with `budgetExhausted: false` — blocking is
  not an exemption from counting

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

- **WHEN** an external findings file fails shape validation and one valid independent pass exists,
  against `budget: 3`
- **THEN** the spend is two, the rejected artifact is named in the reason, and it satisfies no
  cadence slot

#### Scenario: A stale gate reports its spend

- **WHEN** a previously-converged gate goes stale after an apply, with spend at its budget
- **THEN** the state stays `stale`, `budgetExhausted` is set, and the position token reads
  `STALE BUDGET-SPENT`

#### Scenario: Stale passes count in the reported spend, not in the trigger

- **WHEN** two independent passes are stale (a later apply landed) and one is fresh, against
  `budget: 3`
- **THEN** `independentSpend` reports three, `independentSpendFresh` reports one, and
  `budgetExhausted` is FALSE — the trigger counts the
  one pass fresh against the current state, so a re-cover after an apply is never reported as
  exhaustion mid-pair

#### Scenario: No budget declared

- **WHEN** a reviewed gate declares no `budget`
- **THEN** the gate never reports exhaustion and behaves exactly as before the attribute existed

#### Scenario: The closed-set consumers are untouched

- **WHEN** a budget-exhausted gate is read by the WAITING derivation, the inflection prompt, and
  the `gate_overridden` record
- **THEN** each sees `state: "unpassed"` and behaves exactly as for any unpassed gate — no
  consumer enumerates a new state, and the override record carries the spend inside `reason`

### Requirement: The gate reason names the rule that fired and the rule about to fire

A non-passed reviewed gate's `reason` SHALL name the specific rule that produced the state —
which cadence slot is uncovered, which pass has unresolved substantive findings, or which confirm
clause failed — and, when the spend has reached the declared budget, that clause PLUS the spend — in terms a reader can act on without opening the
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
state, and the cost is not recoverable. Two further notes ride the same slot: the spend clause
when the declared budget is reached, and a passed gate whose walk deferred SUGGESTION-grade
findings (reported, never blocking).

#### Scenario: Open blind pair announced before the walk

- **WHEN** an external system pass exists on the current state, no fresh partner exists, and no
  walk of that pass has run
- **THEN** the gate's reason states that the blind pair is open and names the missing `fresh`
  class, and the canonical next command targets it

#### Scenario: Spend named beside the clause it displaced

- **WHEN** an unpassed gate's independent-pass spend has reached its declared budget while a
  cadence slot is still uncovered
- **THEN** the reason carries both — the spend figure AND the uncovered slot — so a reader can
  tell what a further pass would be for

#### Scenario: Deferred suggestions surfaced on a passed gate

- **WHEN** a gate converges while its completing walk deferred SUGGESTION-grade findings
- **THEN** the gate is `passed` and its reason names the deferred suggestion count — non-blocking
  and never silent
