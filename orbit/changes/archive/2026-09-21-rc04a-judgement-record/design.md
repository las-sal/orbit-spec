# Design: rc04a-judgement-record

## Context

This change implements the first child of `rc04-readiness-record`, split three ways under R-crc-9
on 2026-09-21 after a size check measured the full mechanism at ten capabilities against a ceiling
of three. The mechanism itself was settled in exploration — eighteen decisions at propose time, nineteen now
(D-rc04-19 was appended during the post-apply system cadence, correcting two of D-rc04-15's claims
against what shipped), and two open questions both carrying standing recommendations, neither owned
by this child — so this design CITES rather than invents. See `explore.md`, which travels with this change and
remains the shared source for `rc04b-forward-recommendation` and `rc04c-retire-gate-overridden`.

The prior art is close at hand and is the model: `orbit-address-reviews` gives walk decisions
`ratified_via`, `recommendation_fork` and `resolution`, and `orbit-emit-composition` (D5) already
owns the engine/AI split this record needs — engine owns the spine, the AI supplies the judgement,
and a fail-loud write gate validates the frozen record before anything is written. This change is
that same architecture applied one seam later.

## Goals / Non-Goals

**Goals:**

- Give readiness-shaped judgements the structural treatment walk decisions already have.
- Make R-crc-11(g)'s "knowing what came back" CHECKABLE to the one degree it can be: ordering.
- Keep the record honest about authorship — `ratified_by` distinguishes the AI's own belief from a
  user ratification, per D-rc04-3 as amended.
- Give the record a READER, so this stage does not commit the write-only sin its own parent charter
  condemns in exit (4).

**Non-Goals:**

- **Judging readiness.** The engine never evaluates whether the AI was right. It refuses a claim
  that could not have been informed, and nothing more (R-crc-10).
- **Blocking.** A `not-ready` record records; it does not stop an archive (D-rc04-16).
- **Forward recommendations on passes** — `rc04b`.
- **Retiring `gate_overridden`** — `rc04c`. It keeps being written here.
- **A second reader.** `orbit status --change` surfacing the latest readiness record is deferred;
  exit (4) is satisfied by the first reader, and adding `orbit-orientation` would put this change
  over the ceiling it was split to respect.

## Decisions

### D1 — the test for what qualifies, and why it is the same as the constraint

A judgement qualifies for this record iff it is **formed against independent review output**
(explore D-rc04-13). The test was executed against all ELEVEN judgements rc02c's cycle actually
made, read off the archived trail rather than constructed: four qualify.

Its value is not tidiness. **Citing the passes is the same property the ordering rule checks**, so
the qualifying criterion and the enforceable constraint are one thing rather than two. A judgement
citing no pass has no ordering to check, which is exactly why it does not belong — and the test
earns its keep by what it EXCLUDES: six readiness-adjacent judgements are not readiness, and two of
those were provably in the wrong place already (a size-overage acceptance misfiled into `warnings`,
a sync ratification recorded nowhere).

### D2 — one spine, two kinds, rather than four slots

The four qualifying judgements split by WHEN they are formed, not by subject. `continuation` is
mid-cadence; `readiness` is terminal. The acceptances are the terminal assertion's CONTENT, not
peer records — *"I accepted the residual because I bought a scoped pass and it came back sound"* is
one statement, and modelling it as two loses the because.

### D3 — ordering is the only computed rule ABOUT THE EVIDENCE, and it is checked at the WRITE GATE

Not at the gate graph. The gate graph computes coverage and resolution and must keep computing only
those — rc02c retired clause (c) precisely to stop it computing judgements. The refusal belongs
where `orbit-emit-composition` already validates frozen records, materialize-first, so the
validated candidate and the written bytes are one read of caller state.

Two other refusals shipped and are NOT counterexamples, because they are about the record's SHAPE
and LOCATION rather than about the judgement's relation to its evidence: the carrier table's KIND
half (a `readiness` on a `review-external` T0 emit has no reader), and the `gate_overridden`
field-agreement constraint (D6 below). Both are fully observable, so R-crc-10 permits them; the
second retires with `gate_overridden` in rc04c. What stays off limits is the engine forming an
opinion about whether the judgement was RIGHT — including whether the cited passes were clean,
whether enough were cited, or whether they were the right MODE.

### D4 — the record cites by TOKEN, and this is the load-bearing detail

`gate_overridden` cites its pass in prose: `"latest independent pass has 6 CRITICAL"`. No ordering
check can run against that — there is nothing to compare. `formed_against` is a list of pass
TOKENS, with prose living in `reasoning` BESIDE it rather than instead of it. Everything this
change makes checkable rests on that choice.

### D5 — `not-ready` records, never blocks, and gets a reader

Three independent grounds agree (explore D-rc04-16): R-crc-10 (an engine blocking on judgement acts
on what it cannot verify); D-rc04-5 with D-rc04-3 as amended (the user steers, and an AI belief
that vetoes their archive inverts that); and redundancy (the archive already has consent, gate and
audit prompts — a fourth stop adds no reason to stop).

But record-only alone would violate exit (4), so `not-ready` gets a reader: **the archive
completion readout states it**. A change archived against the AI's own judgement should say so
where a human is looking, not only in a JSON field.

### D6 — the ROUTING case is deliberately not carried, and the reason is readers not size

A cadence can end two ways. Ending in ARCHIVE — the record goes on the archive emit, and
`not-ready` there is the honest dissent case: *archived, and I did not believe it was ready*.
Ending by ROUTING TO ARCHITECTURE (explore D-rc04-3) — there is no archive.

The first draft of this change carried the routing case on the `address-reviews` emit. That was
wrong, and the proposal review found why: **the routing case has no reader.** The archive
completion readout is the single reader that satisfies the parent charter's exit (4), and in the
routing case there is no archive to carry it. A routing-case record would therefore be precisely
the write-only record this change condemns `gate_overridden` for being — committed in the stage
whose own charter names that sin. It would also have reached a FOURTH capability
(`orbit-address-reviews`), breaching the three-capability ceiling the split exists to respect.

So the routing case is DESCOPED, and its carrier belongs with whatever surface reads it — which no
stage has yet declared. Recorded here rather than dropped silently, because the judgement is real
and someone will need it.

## Touchpoints

- `src/core/emit-composition.ts` — the write-gate ordering refusal; the payload tables for
  `apply`, `review-external` and `archive`.
- `orbit/specs/orbit-emit-composition/spec.md` + `orbit/specs/orbit-run-summary-emit/spec.md` +
  `orbit/specs/orbit-archive-modifications/spec.md` — the three baselines this change modifies
  (delta authoring, not direct edits).
- `src/core/templates/workflows/archive-change.ts` — the completion readout gains the `not-ready`
  line, and the archive payload table gains `readiness`.
- `src/core/templates/workflows/apply-change.ts` — the apply payload table gains `continuation`.
- `src/core/templates/workflows/review.ts` — the `review-external` T0 payload table gains
  `judgements` admitting `continuation` with disposition `spend`.
- `test/core/` — the ordering-refusal cases and the rc02c reproduction fixture.

## Risks / Trade-offs

- **Two records for one fact, deliberately, until rc04c.** `gate_overridden` and
  `continuation/proceed` coexist. This is the defect class this program keeps catching, accepted
  and BOUNDED by rc04c being declared up front rather than hoped for. rc03a is the warning: three
  deferrals on ceiling grounds, each buying a cheaper mechanism that failed.
- **A new refusal is a new way to fail an emit.** Mitigated by scope: the check fires only on
  records carrying `formed_against`, so no emit that exists today can newly fail. The failure is
  also the point — a readiness claim predating its evidence is exactly what must not be written.
- **`ratified_by` is self-reported.** The engine cannot verify that a user ratified anything. This
  is a RECORD under R-crc-10, and pretending otherwise would be the mechanize-what-you-cannot-
  observe error. Its value is that the distinction is STATED and auditable, not that it is proven.
- **Deferring the second reader** leaves readiness invisible to `orbit status`. Accepted: exit (4)
  needs a reader, not every reader, and taking `orbit-orientation` would breach the ceiling this
  split exists to respect.

## Alternatives considered

- **A readiness GATE CLAUSE** — rejected. rc02c retired clause (c) to stop the gate computing
  judgements; adding one back under a new name would reverse that in the same program.
- **Writing the record at the archive seam only** — rejected as a false distinction (explore
  Q-rc04-d, retired). The flow already records judgements at their decision points; what was
  missing was structure, not timing.
- **Copying the exploration three ways, one per child** — rejected: three copies of one truth,
  and the decisions interlock.

## Open Questions

None for this change. `Q-rc04-c` remains open in `explore.md` and belongs to
`rc04b-forward-recommendation` — it concerns D4's commentary prohibition, which lives in
`orbit-report-rendering` and `orbit-review`, neither of which this change touches.
