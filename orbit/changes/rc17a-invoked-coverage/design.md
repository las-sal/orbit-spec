## Context

The reviewed gates' first slots are hardcoded in `schemas/spec-driven/schema.yaml` (version 4):
`review-proposal` reads `[independent, in-context]`, `review-system` reads `[blind-pair, in-context]`.
Coverage is computed in `src/core/artifact-graph/gates.ts` by `assignCadence`, an existential DFS
memoized on `(slot, lowerBound)`; `slotCandidates` builds each slot's candidates; `diagnosePair`
explains a failed `blind-pair` slot; `canonicalNextForReviewed` picks the one next command. The trail
reader (`trail.ts`) loads passes (internal `review-<mode>-*.json`, external `external-<mode>-*.md`),
walk records and apply tokens; it reads the external T0 (`review-external-*.json`) as NOT a pass.

The exploration (`explore.md`, see it for the full reasoning) settled the stage's four live rules:
D-bpc-6 (the slot-bound diagnosis), D-bpc-8 (the first slot accepts what was invoked; config picks the
recommendation), D-bpc-10 (pair membership computed from the trail, with a launch record) and
D-bpc-15 (discovery reaches every unwalked pass). Seven further rules are assigned to rc17b and rc17c
(D-bpc-9, D-bpc-17) and are not carried here.

Constraints: gate state is a pure function of on-disk artifacts (C1); the gate reports and never
rules (R-crc-13); one canonical next (single-voiced); three capabilities (R-crc-1).

## Goals / Non-Goals

**Goals:**
- Both gates' first slot is covered by what the user invoked: a single fresh or external pass, or a
  complete blind pair (exit (2)).
- A pair with one half landed reports `openPair` and the slot uncovered on every cadence the grammar
  admits, measured by an exhaustive oracle (exit (1)).
- A SUGGESTION-only pass is walked by `/orbit:address-reviews <change>` (exit (3), as narrowed by the
  rc17c split).

**Non-Goals:**
- The one-command pair, the external runner and its setup (rc17b).
- The review emit's next line naming the change rather than a path (rc17c).
- A versioned schema selector (D3).
- Any change to clause (b) or to what holds the gate: SUGGESTIONs still never gate.

## Decisions

### D1 — a new cadence token, `invoked`, rather than widening `independent` or `blind-pair`

`invoked` is satisfied by a single independent pass that is not a pair member, or by a complete pair
(per the new `The first review slot covers what the user invoked` requirement). `independent` and
`blind-pair` keep their meanings byte-for-byte: other schemas, the test fixtures and every archived
trail still compute exactly as before, and D-bpc-6's fix applies to the structural `blind-pair` slot
wherever a schema still declares it. Widening `independent` in place would silently change what an
existing token means. Alternative considered: one token per preference (`[preferred, in-context]`)
— rejected because the preference must never enter coverage (D-bpc-8's FALSIFY line).

### D2 — the launch is the pair's T0, marked `pair: true`, not a new emit kind

D-bpc-10 called for "one new record, the pair LAUNCH", and its FALSIFY line rejected the T0 as the
launch because a re-run of the missing external half re-packages and writes a new T0. A boolean
answers that objection: only the pair's own packaging carries `pair: true`, and a re-run's T0 does not,
so a re-run writes no launch and refills the open pair, as D-bpc-10's own row requires. Every pair has a
T0, because every pair packages its external half, including on the paste route. A dedicated emit
command would add a command to the emit-kind taxonomy that `orbit-conventions` enumerates ("editorial —
emitted by review, address-reviews, audit-drift, review-external"), a fourth capability. The `review-external`
payload table already carries fields its run-summary table does not list (`judgements`), so one more
optional field changes no other spec. The write gate refuses a non-boolean `pair`, and `pair: true`
without an explicit `mode` of `proposal` or `system`, since a launch the trail cannot attribute to a mode
would be no launch at all. **rc17b handoff:** D-bpc-13's steps 2 and 3 (launch record, then packaging) become one
act, the flagged T0.

### D3 — no versioned cadence: version 5 gates every change, and no change loses coverage

The charter says "a v4 change keeps its cadence". There is no reader that could do that: the engine
always loads the current `schema.yaml`, and `orbit-engine-gates` already states "no versioned schema
selector exists". So v5 gates every change, including ones stamped `schema_version: 4` (this change
among them: its proposal review runs under v4, and its system review under v5 once apply edits the
schema). The move is MONOTONE, checked case by case. A v4 trail carries no `pair: true` T0, since the field is new, so every
independent pass on it is a single. `[independent, in-context]` → `[invoked, in-context]` is then the
same computation. For `[blind-pair, in-context]` → `[invoked, in-context]`: a v4 covering assignment
has a blind pair (F, E) and an in-context pass I later than both members and every record closing
either. Take the earlier member alone as the `invoked` single; I beats its token and its records. So
every assignment that covered v4 covers v5, and a live change can only become easier to pass, never
harder. Building a version store to keep a stricter rule for changes stamped v4 buys nothing this repo
has (no active change other than this one, whose system review is meant to run under v5) and nothing
an adopter needs (their gate relaxes). Accepted as a scope call at the proposal walk (Sal, 2026-10-05).

### D4 — membership is by ORDER for both classes (revises D-bpc-10's stamp)

D-bpc-10 matched the external member by order and the fresh member by a launch token stamped on the
fresh emit. This design matches both by order, the first pass of each class after the launch, within the
window `A pair's membership is computed from its launch` states (and D10 explains); every other
independent pass is a single. This adds no review payload field, keeps the two halves
symmetric, and lets a pair run by hand before rc17b exists — but only through a hand-composed T0 payload
carrying `pair: true`, since no shipped body writes the field yet.
The cost is the residual D-bpc-10 already named, widened from one class to both: a single invoked while
a pair is open is counted as its member. The requirement states that widening beside the residual's
verbatim lines.

### D5 — the pair diagnosis reads the eligible set at the lowest reaching bound (D-bpc-6)

`assignCadence` already records the deepest slot it reaches. It now also records the minimum lower
bound seen there; `diagnosePair` reads only the passes with tokens above that bound, PAIRABLE, of each
class. The lowest bound is canonical because eligibility is `token > bound`, so its eligible set
contains every other reaching state's. `PairFailure` loses `foreclosed`: under this reading a pair
excluded by the ordering constraints IS a missing class above the bound, which is what rc08b's
reproduction state (`[external, blind-pair]`, clean external T1 consumed by slot 0, unwalked fresh T2)
should have reported. `canonicalNextForReviewed`'s own pairability scan reads the same set, so the
reason and the command cannot disagree.

### D6 — the preference is config, read only by the presentation

`orbit/config.yaml` gains `review_preference`, a map from gate id to `blind-pair` | `fresh` | `external`,
parsed beside `models:` and `pr:` in `project-config.ts`. An absent map or entry is `blind-pair`. An
unknown value warns, naming the gate and the value, and resolves to `blind-pair`. A non-map value warns
and is ignored, as the `pr:` scalar's inert shapes do. The gate computation reads it
ONCE, itself, from the change's project root, so `orbit status`, `orbit instructions` and the
orientation surface cannot present different commands. It is read ONLY where the canonical next is
chosen for an uncovered `invoked` slot with nothing standing or tied. Gate state, reason and every field but `nextCommand` /
`nextSlot` are independent of it, so a teammate's config cannot re-grade a change. **Interim:** until
rc17b ships `--reviewer blind-pair`, the `blind-pair` preference presents the fresh review. Switching that one
branch to rc17b's command is an `orbit-engine-gates` edit, written into rc17b's charter at this propose so
its count includes it.

### D7 — what the `invoked` slot presents, and its reason

The presentation is the table in `orbit-engine-gates`' `The first review slot covers what the user
invoked`, rows tested in order; it is stated there once and not restated here. Two choices behind it:
`openPair` is set on the PAIR-OPEN-one-landed row only, because that is the one state where a walk
would foreclose a pair still formable; and `nextSlot` names the class of the presented command, so a
`models:` hint keyed `fresh` or `external` garnishes the command it describes. The preference
`blind-pair` presents the fresh review until rc17b (D6), so its class is `fresh`.

### D8 — `unwalkedPasses`, the discovery set beside the hold

A reviewed gate's row carries `unwalkedPasses`: every pass in clause (b)'s set (every relevant pass,
stale included) that carries at least one finding of any severity, is referenced by no
`address-reviews-*.json` record's `source_path`, and is not already in `unresolvedPasses`. Rows use the
`unresolvedPasses` shape `{token, file, mode, source}`, in token order. On a `passed` gate it is computed
like any other field, since a passed gate can still hold an unwalked SUGGESTION-only pass. A `blocked` gate
carries none. The gate never reads it. The walk's discovery row 5 reads the union, and the fence's prose stops
saying a suggestion-only pass "is reached by `--from-file`". A walk that only defers a SUGGESTION has walked the
pass, so the pass leaves the set and is not rediscovered. Like any walk, such a walk raises the following
slot's ordering bar (clause (a) counts walk records at any severity); in the ordinary order the walk
precedes the confirm, and walking after a confirm calls for another — accepted at the proposal walk (Sal,
2026-10-05) over narrowing clause (a) to substantive records, which would be unreviewed gate mechanism.

### D10 — a walk ends a half-landed pair (Sal, proposal walk, 2026-10-05)

Both reviewers showed that a launch's window, open until the mode's next launch, absorbed the next pass
of the missing class as a member after the pair had already failed, so the engine recommended a pass
that could not cover. Sal's rule: a pair stays open through anything the user does except a walk of its
landed half. The walk's `openPair` stop becomes a warning that offers to stop (so the missing review can
run) or to walk; walking ENDS the pair at the walk record, the walked member reads as a single and covers
the slot, and every later independent pass is a single. An apply between the halves ends nothing: the
freshness rule already keeps a stale member from covering. Members are drawn from the trail reader's
accepted passes, so a rejected return takes no position. The membership and presentation tables carry
it (`orbit-engine-gates`), and discovery row 4 (`orbit-address-reviews`). The BROKEN state is gone with
the change; the tie stays.

### D9 — exit (1)'s oracle is an independent brute-force implementation

`test/core/invoked-coverage-oracle.test.ts` enumerates every cadence of length 1 to 3 over the six
tokens, and every trail of up to five events: passes of the three classes, `pair: true` T0s, walk records
referencing a chosen pass, external returns the trail reader rejects, and apply tokens, with distinct
tokens plus the tie case. It calls the exported pure
entry that evaluates one reviewed gate over an in-memory `Trail` (task 3.1), never on-disk fixtures, and
compares the engine's `openPair` and slot coverage against a reference written directly from the
requirements' text. The reference enumerates every assignment (no memo, no pruning) and reads membership
straight from the launch definition. Two properties are asserted on each case:

- **Equality.** `openPair` equals the reference's own reading of the diagnosis: `missing: X` exactly when,
  on a structural `blind-pair` slot, the failed slot's eligible pairable set holds the other class and
  not X; or, on an `invoked` slot, the live launch has exactly one member landed, of the other class,
  above the bound, and the pair has not ended — the presentation table's first row and no other.
  Absent otherwise: on `tie`, on `blindness-broken`, on a landed member at or below the bound, and on an
  ended pair.
- **Repairability, one direction only.** Whenever `openPair.missing` is X, adding one new pass of class X
  above every token lets the failed slot be covered. The converse is NOT asserted: on a `tie`, adding
  either class repairs the slot while `openPair` is rightly absent.

The stated size is in the test's header. A disagreement fails naming the cadence and the trail.
`[external, blind-pair]` with rc08b's reproduction trail is also pinned as a named case.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-bpc-1 | BOUNDED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-2 | SOURCED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-3 | DERIVED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-4 | BOUNDED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-6 | DERIVED | live rule | `orbit-engine-gates` · `Single-voiced canonical-next computation` (TABLE) |
| D-bpc-8 | BOUNDED | live rule | `orbit-engine-gates` · `The first review slot covers what the user invoked` (TABLE) |
| D-bpc-10 | BOUNDED | live rule | `orbit-engine-gates` · `A pair's membership is computed from its launch` (TABLE) |
| D-bpc-11 | SOURCED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-13 | DERIVED | assigned rc17b-blind-pair-command | not carried |
| D-bpc-15 | DERIVED | live rule | `orbit-engine-gates` · `A reviewed gate lists its outstanding passes` (TABLE) |
| D-bpc-16 | SOURCED | assigned rc17c-short-review-next | not carried |

The tables carried for D-bpc-8 and D-bpc-10 are revised where D2, D4 and D7 change a row (the stamp row,
the interim presentation row, the cross-reference row). Each revision is named in the requirement's
prose, and the exploration's table is the record of the original.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — the `invoked` slot candidates, the launch state, the slot-bound diagnosis, the presentation table, `unwalkedPasses`.
- `src/core/artifact-graph/trail.ts` — launches read from `pair: true` T0s.
- `src/core/artifact-graph/types.ts` — the `invoked` cadence token.
- `schemas/spec-driven/schema.yaml` — version 5.
- `src/core/project-config.ts` — the `review_preference` key.
- `src/core/emit-composition.ts` — the T0's `pair` field and its write-gate checks.
- `src/core/artifact-graph/gates.ts` + `src/core/project-config.ts` — the preference read once inside the gate computation.
- `src/core/templates/workflows/address-reviews.ts` — the discovery fence's checked mirror.
- `test/core/` — the oracle, gate, config, emit and discovery suites.

## Risks / Trade-offs

- **D-bpc-8** (BOUNDED): its named limit is stated once, in `orbit-engine-gates`' `The first review slot
  covers what the user invoked`.
- **D-bpc-10** (BOUNDED): its named limit is stated once, in `orbit-engine-gates`' `A pair's membership
  is computed from its launch`.
- [Order membership absorbs a single invoked while a pair is open] → the residual is stated with its
  widening (D4); a deliberate single after an open pair is still possible as the class's second pass.
- [v5 relaxes the system gate for a change stamped v4] → monotone by D3; no other active change exists, and
  the relaxation is the ruling (R-crc-4 amended); this change is the one active change it reaches.
- [The interim presents the fresh review under the `blind-pair` preference] → a fresh run then lands as a
  single and covers, the D-bpc-8 row 1 interim the exploration chose; rc17b replaces the branch (D6).
- [`orbit-run-summary-emit`'s scenario `Verify pass emit recommends review-as-system canonically`
  says "under `spec-driven` v4, whose first uncovered system slot is `blind-pair`"] → a named residual,
  not a fourth capability: the sentence is qualified by version and true of v4, and its THEN (the
  verify emit's next begins `/orbit:review --as system --fresh foo`) still holds under v5, where the
  default preference presents the fresh review.
- [Existing tests pin v4 cadences, `foreclosed` and the `PairFailure` set] → the red set is measured at
  task 1.1 before code moves, including hash pins (rc04c's lesson).

## Migration Plan

No data migration. No `pair: true` T0 exists on any archived trail, so every independent pass on one
reads as a single. Coverage under v5 can only RELAX relative to v4, never be lost (D3): a system trail
holding one fresh pass and a later in-context pass was uncovered under v4 and is covered under v5. Every
active change moves to v5 at the build that ships the schema. Rollback is
reverting the schema to version 4, since nothing new is written except the optional `pair` field.

## Open Questions

(none)

## Alternatives considered

From the exploration's Considered & out, carried so they are not rediscovered:

- A SUGGESTION-only pass reached only by `--from-file`: out (D-bpc-15); severity is a judgement.
- One half of an invoked pair covers the first slot, with `openPair` as a hint: out (Sal's clarification of D-bpc-8); the invocation decides coverage.
- `independent` as a preference value: out; Sal named three choices.
- Launching a runner merely because it is on PATH; a runner record in a committed per-repo file: out (rc17b's territory, recorded for it).
- Stamping the resolved cadence on the change at propose: out; config shapes only the recommendation.
- The first slot requires the blind pair on `review-system`: out (D-bpc-8, R-crc-4 amended).
- The command never pushes: out (D-bpc-3, rc17b).

New at this propose:

- A dedicated `pair-launch` emit command: out (D2); a fourth capability for a record the T0 already carries.
- A per-version cadence store: out (D3); monotone, and nothing reads it.
- A fresh emit stamped with its launch: out (D4); order matching is symmetric and needs no payload field.
