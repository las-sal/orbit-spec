## Context

The decisions here come from `explore.md` (D-rc18-1 through D-rc18-6, Case 1). Two code sites produce a next command
today:

- `gates.ts` computes a per-gate `nextCommand`. A `passed` gate gets `nextAfterPass` (the `before` phase's command); an
  unpassed or stale reviewed gate gets `canonicalNextForReviewed`. A passed reviewed gate already carries
  `unwalkedPasses` (rc17a) but nothing reads it.
- `formatChangeStatus` in `instruction-loader.ts` selects the change's `next_command`. It walks the gates in flow
  order, skips `passed` and superseded gates, and takes the first per-gate command or the tracked `apply` gate's
  `ready` branch. When nothing is found it falls through to the flow-latest passed gate's command.

So the motivating case, a passed `review-proposal` that still holds an unwalked pass, gets `/orbit:apply` from the
`apply` gate's `ready` branch. The review gate's own command is never read (D-rc18-3). A fix confined to
`nextAfterPass` would reach the system gate, through the fall-through, and miss the proposal gate.

Every pass a `passed` gate lists in `unwalkedPasses` is SUGGESTION-only (D-rc18-2). Resolution runs over every
relevant pass, and a pass with any CRITICAL or WARNING resolves only through a walk record that references it.

## Goals / Non-Goals

**Goals:**

- Exit (1): a change whose reviewed gate has passed, with an unwalked pass in that gate's mode, renders
  `/orbit:address-reviews <change>` as its canonical next, and the gate still reads `passed`.
- Exit (2), as revised (D-rc18-4): after that pass is walked, the canonical next is the phase command. When an
  off-path walk un-passed an earlier slot, it is the review the order computes for the uncovered slots.
- Exit (3), as widened at the proposal walk (D5, Sal): an unpassed gate holding an unwalked pass, and no open pair,
  names the walk before its next review; an unpassed gate holding neither keeps its next unchanged.

**Non-Goals:**

- Changing any gate's state, reason or cadence. rc17a's 2A (every walk raises the following slot's ordering bar)
  stands, on Sal's word (D-rc18-4).
- Offering the walk beside the phase command. `Single-voiced canonical-next computation` stands.
- Recommending walks for superseded gates' passes. Their phase has run, and discovery skips superseded gates too.
  KNOWN DIFFERENCE: `superseded` is marked only on a gate that has NOT passed, so a `review-proposal` still `passed`
  after apply (tasks checked, no apply emit yet making its passes stale) is not superseded. The selection never names
  the walk for it (it is not the frontier), but a walk named for another reason, such as the system gate's, discovers
  and walks its unwalked passes too. Selection and discovery differ on that one row by design: discovery walks what is
  outstanding, while selection decides only what to recommend.
- Gating apply or archive on the walk. Eligibility is unchanged, so `/orbit:archive` over an unwalked pass still
  proceeds.

## Decisions

**D1 — the passed-gate rule lives in the selection, decided by one predicate shared with the gate row (D-rc18-5).**
An exported function in `gates.ts` returns whether a gate is a passed FRONTIER gate holding an unwalked pass.
`computeGateStates` applies it after the superseded marking, where the frontier is known, and for such a gate sets the
row's `nextCommand` to `/orbit:address-reviews <change>`. The selection loop in `formatChangeStatus` calls the SAME
function on each `passed` gate. When it holds, the loop takes the walk with hint keys `{phase: <gate id>}` and stops.
When it does not, the loop skips the gate as today. The loop never takes a passed gate's command merely because the
row carries one: every passed `review-proposal` carries `/orbit:apply … — user-invoked` from `nextAfterPass`, and
taking that would name apply again after apply passed. The system gate is always the frontier (its `before` is
`archive`, which names no gate), so the loop takes its walk BEFORE the all-passed fall-through is reached. That keeps
its hint keys the gate's phase id rather than the fall-through's `{phase: g.before}` (`archive`). One predicate
computes the row and the change, so they cannot disagree, and every other passed row keeps its phase command.

*Alternative:* compute the walk only in the loop and leave the row's `nextCommand` as the phase command. Rejected:
the row and the change would then name different commands for one state.

**D2 — the frontier is the negation of the superseded test, and only that.** A reviewed gate is the frontier while
its `before` names no gate that has passed. `computeGateStates` already marks a NON-passed reviewed gate superseded on
exactly that test (`passedGateIds.has(s.before)`), so the frontier reuses it and adds no new concept. It is a test on
GATE IDS: a `before` naming an artifact, a lifecycle phase that is not a gate (`archive`), or nothing never makes a
gate non-frontier, whether or not that artifact is complete. That narrower rule is stated in the spec rather than
equated with "the phase is complete", which an artifact target would make ambiguous. One consequence is stated, not hidden: during apply, before the `apply`
gate passes and before any apply emit makes the proposal passes stale, a passed `review-proposal` with an unwalked
pass still names the walk. The walk is still owed at that point, and the recommendation is not an entry gate.

*Alternative:* mirror `orbit instructions apply`'s entry rule (frontier only while no task is checked). Rejected: that
rule decides whether apply ENTRY is gated. This one decides what is recommended, and a pass left unwalked mid-apply
is still unwalked.

**D3 — stale unwalked passes are not filtered (D-rc18-5's stale row).** `unwalkedPasses` lists stale SUGGESTION-only
passes, and the walk's pushback suppresses stale findings with evidence. A second, narrower list here would be a
second rule over the set the walk already discovers.

**D4 — the walk that un-passes is answered by the existing computation (D-rc18-4).** No new branch. After an
off-path walk of an earlier slot's pass, the gate is `unpassed` and `canonicalNextForReviewed` names the review for
whichever slot the raised bar uncovered. On `spec-driven`'s `[invoked, in-context]` that is the in-context check; a
longer cadence can owe more than one review, and a test holds a three-slot case.

**D5 — the unpassed gate names the walk too, before the next review (Sal: A, proposal walk 1).** The fresh proposal
pass reproduced the ordinary order. An invoked pass carrying only SUGGESTIONs leaves the gate `unpassed`, and the gate
named the in-context review, not the walk. Following that line put the in-context pass BEFORE the walk rc18 then named,
so the walk un-passed the gate on every such change. `canonicalNextForReviewed` already names the walk for an
UNRESOLVED pass, after the open-pair check and before any slot command. The unwalked set joins that step: `openPair` →
the walk when `unresolvedPasses` or `unwalkedPasses` is non-empty → the slot's command. The walk then precedes the review
that checks it on the recommended path, and the passed-gate rule (D1) ordinarily meets only the last slot's pass. An
open pair stays first because walking a landed member ends the pair. rc17a's oracle is untouched: every pass it builds
carries zero findings, so its unwalked set is always empty. The cost is exit (3), widened on Sal's word.

*Alternative (option B):* keep D1 alone and document the second in-context review as the ordinary cost. Rejected by
Sal at the walk.

## Alternatives considered

From `explore.md`'s Considered & out:

- **A SUGGESTION-only walk does not raise the next slot's bar (the exploration's option A).** Out: it reverses rc17a's 2A, which Sal
  ratified over exactly this narrowing (2026-10-05). Sal kept 2A.
- **Name the walk only when it cannot un-pass the gate (the exploration's option B).** Out: it leaves SUGGESTION-only passes in earlier
  slots silent, the hole Sal named.
- **Offer the walk and the phase command on two lines.** Out per the charter: it reverses `Single-voiced
  canonical-next computation`, which is Sal's to take.

## Risks / Trade-offs

- [A walk can still un-pass a gate] → Only off the recommended path (D5): an earlier slot's pass walked after the
  following slot's review ran. On `spec-driven`'s cadence that costs one in-context review; a longer cadence can owe
  more (D4). The cost is Sal's ratified 2A operating as designed.
- [An unpassed gate's next moves from a review to the walk whenever an unwalked pass stands] → Intended (exit (3) as
  widened). The gate's state and reason do not move, so a reason naming a slot can sit beside a next naming the walk.
  That is already the case for an unresolved pass.
- [A `models:` hint keyed by the review gate's phase id now garnishes the walk] → The same keying the unresolved-pass
  walk already uses (rc08b); the hint describes the phase the walk belongs to.
- [verify's `systemReviewNext` keeps the graph's next only when it names a system review] → When `review-system` has
  passed with an unwalked pass, verify falls back to the bare system-review invocation. The archive next fails that
  filter today in the same way, so nothing new is introduced.
- [The rc03b hash pin covers `gates.ts` and `instruction-loader.ts`] → Moving both hashes is a planned act (tasks.md),
  recorded in the pin's header.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc18-5 | DERIVED | live rule | `orbit-engine-gates`' `Single-voiced canonical-next computation` — a normative TABLE |
| D-rc18-1 | — | `Kind: fact` | not carried |
| D-rc18-2 | — | `Kind: fact` | not carried |
| D-rc18-3 | — | `Kind: fact` | not carried |
| D-rc18-4 | — | `Kind: scope` | not carried |
| D-rc18-6 | — | `Kind: fact` | not carried |

## Touchpoints

- `src/core/artifact-graph/gates.ts` — the shared frontier predicate; the passed gate row's `nextCommand`.
- `src/core/artifact-graph/instruction-loader.ts` — the selection loop's hint keys for the walk.
- `test/core/artifact-graph/outstanding-passes.test.ts` + `test/core/artifact-graph/instruction-loader.test.ts` — the table's rows and the five scenarios.
- `test/core/rc03b-untouched-modules.test.ts` — the two pinned hashes move, recorded.
- `orbit/architecture/clean-up-review-cycle.md` — exit (2) revised.
