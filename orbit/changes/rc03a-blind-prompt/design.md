# Design: rc03a-blind-prompt

## Context

rc02 shipped the `blind-pair` slot and left blindness enforced only against WALKS. The engine's
canonical command for an empty pair names the fresh half first, which is the order that anchors the
pair. Full evidence: `explore.md` — Case 3 enumerates the channels, Case 4 runs each order against
them.

## Goals / Non-Goals

**Goals**
- The two members of a pair do not receive each other's findings, on the path the engine itself
  recommends.
- The mechanism is structural, not a list of sites to remember.

**Non-Goals**
- Blindness to all prior history (D-rc03a-10 — a descope; R-crc-4 asks for blind to each other,
  and the stronger property is what made the previous shape unbuildable).
- Attesting blindness on the trail so the gate can VERIFY rather than trust it (D-rc03a-6).
- Changing the launching flow so one invocation runs both halves (rc13's D-rc13-4). This change
  makes that launcher's job easier, not redundant.

## Decisions

**D1 — ordering, not suppression.** The empty-pair canonical command names the external half.
A prompt composed while the trail holds no pair member has nothing of its partner to carry. This
closes six channels at once and no prose says the word "withhold" anywhere. Alternative considered
and abandoned after two proposal passes: suppress per site, keyed on a genre read from the engine.
It failed on enumeration (eleven sites, one with no artifact) and on the signal (see D3).

**D2 — the two residuals are handled explicitly, because ordering cannot empty them.**
The system-mode commit range contains the partner's committed findings file by construction — the
handoff preflight guarantees a clean, pushed tree — so the blind path's diff instruction excludes
the change's `.orbit-runs/`. And the launching brief has no artifact behind it: under external-first
the orchestrator HOLDS the external findings when it dispatches the fresh half, so this is the one
channel ordering leaves fully open. Recorded honestly rather than waved at: Case 4's first draft
claimed ordering retired this channel, which was wrong.

**D3 — nothing infers a genre, because nothing can.** `next_hint_keys.slot` was the previous
shape's signal and it is unusable twice over: it is scoped to the FIRST UNPASSED gate rather than
the gate matching the invoked mode (a system-mode pair run while `apply` is `ready` reads no slot at
all), and the empty-pair branch a non-leak proof rested on sits downstream of the resolution clause,
so "pair empty" does not imply "slot rendered". Under ordering the engine simply chooses, and
neither body branch asks what kind of pass it is. The per-gate `nextSlot` exists on the gate object
and is not projected into the status rows; exposing it is worth doing WHEN something needs it.

**D4 — the delivered property is R-crc-4's, stated plainly.** Members are blind to each other.
An iteration-2 pair still sees iteration 1's walked findings, which both share. The residual
correlation that introduces into a capture-recapture estimate is a NAMED limit for rc04 to discount,
not a defect chased here.

## Risks / Trade-offs

- **The brief constraint is unenforceable by any artifact check** → it is a rule the launching
  context must follow, with no file to grep. Stated rather than hidden; D-rc03a-6's attestation is
  the mechanism that would make it checkable, and it is deliberately deferred.
- **External-first makes the human round-trip the first step** → better scheduling, not worse:
  the slow half is dispatched while the fast half runs. This was argued as an ergonomic benefit
  before it was understood as a correctness property.
- **Iteration-2+ pairs share prior walked history** → accepted (D4), named for rc04.

## Alternatives considered

- **Suppress per site, keyed on the engine-reported genre.** The shape of this change through two
  proposal passes. Abandoned: eleven channels, one with no artifact, and a signal that cannot carry
  the question. Both passes' findings are in the trail; the second's CRITICALs invalidated the fix
  chosen for the first's.
- **Blind to all prior history.** Stronger than R-crc-4 requires, and the direct cause of the
  eleven-channel problem. Descoped (D4).
- **Delete the Cycle context section.** Never necessary under ordering; the section is correct as
  written and `orbit-review-external` is not touched at all.

## Migration Plan

None. The ordering change alters a recommendation; older trails receive the new one. No schema bump,
no metadata change, nothing to backfill.

## Instruments — what can actually be measured

The ordering lives in `gates.ts` and IS unit-testable: assert the empty-pair branch renders the
external command, and that the open-pair branch still names the missing member. The two residual
rules live in body prose and are assertable only over the GENERATED surface text — the rc01
instrument class. The brief constraint is assertable only as surface text; there is no run-time
check, and saying so is part of the design.

## Open Questions

None.

## Touchpoints

- `src/core/artifact-graph/gates.ts` — the empty-pair branch's rendered command.
- `src/core/templates/workflows/review.ts` — the system-mode read instruction and the dispatch-brief constraint.
- `test/core/artifact-graph/` + `test/core/templates/` — the ordering unit test and the generated-surface assertions.
