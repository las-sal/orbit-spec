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
- Exit (2), as revised (D-rc18-4): after that pass is walked, the canonical next is the phase command. When the walk
  un-passed an earlier slot, it is the in-context check the walk now owes.
- Exit (3): an unpassed gate's next is unchanged.

**Non-Goals:**

- Changing any gate's state, reason or cadence. rc17a's 2A (every walk raises the following slot's ordering bar)
  stands, on Sal's word (D-rc18-4).
- Offering the walk beside the phase command. `Single-voiced canonical-next computation` stands.
- Recommending walks for superseded gates' passes. Their phase has run, and discovery already treats them that way.
- Gating apply or archive on the walk. Eligibility is unchanged, so `/orbit:archive` over an unwalked pass still
  proceeds.

## Decisions

**D1 — the rule lives in the selection, decided by one predicate shared with the gate row (D-rc18-5).** A function
in `gates.ts` returns whether a gate is a passed FRONTIER gate holding an unwalked pass. `computeGateStates` applies it
after the superseded marking, where the frontier is known: for such a gate it sets the row's `nextCommand` to
`/orbit:address-reviews <change>`. The selection loop in `formatChangeStatus` then treats that gate like any gate with
a command: it takes the command, with hint keys `{phase: <gate id>}`, and stops. The all-passed fall-through needs no
change, because it reads the row. One predicate computes the row and the change, so they cannot disagree. The
spec's `A passed frontier gate's own row nextCommand SHALL equal…` sentence states this.

*Alternative:* compute the walk only in the loop and leave the row's `nextCommand` as the phase command. Rejected:
the row and the change would then name different commands for one state.

**D2 — the frontier is the negation of the superseded test.** A reviewed gate is the frontier while its `before` gate
has not passed. `computeGateStates` already marks a NON-passed reviewed gate superseded on exactly that test, so the
frontier reuses it and adds no new concept. One consequence is stated, not hidden: during apply, before the `apply`
gate passes and before any apply emit makes the proposal passes stale, a passed `review-proposal` with an unwalked
pass still names the walk. The walk is still owed at that point, and the recommendation is not an entry gate.

*Alternative:* mirror `orbit instructions apply`'s entry rule (frontier only while no task is checked). Rejected: that
rule decides whether apply ENTRY is gated. This one decides what is recommended, and a pass left unwalked mid-apply
is still unwalked.

**D3 — stale unwalked passes are not filtered (D-rc18-5's stale row).** `unwalkedPasses` lists stale SUGGESTION-only
passes, and the walk's pushback suppresses stale findings with evidence. A second, narrower list here would be a
second rule over the set the walk already discovers.

**D4 — the walk that un-passes is answered by the existing table (D-rc18-4).** No new branch. After a walk of an
earlier slot's pass, the gate is `unpassed` and its `canonicalNextForReviewed` names the in-context check. The table's
`unpassed` row covers that state, and the spec's scenario holds it.

## Alternatives considered

From `explore.md`'s Considered & out:

- **A SUGGESTION-only walk does not raise the next slot's bar (option A).** Out: it reverses rc17a's 2A, which Sal
  ratified over exactly this narrowing (2026-10-05). Sal kept 2A.
- **Name the walk only when it cannot un-pass the gate (option B).** Out: it leaves SUGGESTION-only passes in earlier
  slots silent, the hole Sal named.
- **Offer the walk and the phase command on two lines.** Out per the charter: it reverses `Single-voiced
  canonical-next computation`, which is Sal's to take.

## Risks / Trade-offs

- [A walk of an earlier slot's pass costs one in-context review] → Bounded: that review fills the cadence's last
  slot, and walking the last slot's pass raises no bar (Case 1). The cost is Sal's ratified 2A operating as designed.
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
