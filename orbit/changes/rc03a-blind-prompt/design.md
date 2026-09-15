# Design: rc03a-blind-prompt

## Context

rc02 shipped the `blind-pair` cadence slot and left standing a requirement that contradicts it.
The full evidence base is `explore.md` (moved here from staging) — Cases 1 and 2, and rc13's
exploration Cases 2, 3 and 5 before them. The short version:

- `orbit-review-external`'s `Cycle context populated from prior runs` requires prior open findings
  in every external prompt (`orbit/specs/orbit-review-external/spec.md:273`).
- The gate's blindness predicate checks only for a WALK between the two passes' tokens, so an
  anchored pair is certified blind.
- `gates.ts:877` renders `--fresh` for an empty `blind-pair` slot, making the leaking order the
  engine's default. rc02 escaped by running external-first, by accident.

## Goals / Non-Goals

**Goals**
- A blind-pair member, in either reviewer class, receives no prior-findings context.
- The distinction is COMPUTED from the gate, not inferred by a body-side heuristic.
- A sequential iteration's prompt is byte-unchanged.

**Non-Goals**
- Attesting blindness on the trail so the gate can VERIFY it rather than trust it (D-rc03a-6 —
  deferred; needs `orbit-run-summary-emit` + `orbit-engine-gates` on top, which is R-crc-1's
  ceiling). Fixing the leak and proving it is fixed are separable.
- Changing the launching flow so one invocation runs both halves (rc13's D-rc13-4).
- Changing `gates.ts`'s recommended order — obsoleted by that same decision (see Alternatives).

## Decisions

**D1 — the genre is read from the engine, never inferred.** Both branches read
`next_hint_keys.slot` from the `orbit status --change <name> --json` call they already make.
`canonicalNextForReviewed` returns `slot: 'blind-pair'` from the open-pair branch
(`gates.ts:857-863`) and the empty-pair branch (`gates.ts:868-878`). Alternative considered:
have the body detect a pair by scanning the trail for a standing unwalked independent pass. Rejected
— the gate is already computing exactly this, and a second implementation of one question is the
one-voice-for-facts failure rc07 exists to remove; worse, the two could disagree about the very
property the gate is certifying.

**D2 — blinding is symmetric across reviewer classes.** The external half's Cycle context and the
internal half's Step-5 prior-run read are the same context wearing two names. `explore.md` Case 2
shows the fresh half does not leak TODAY — but only because Step 5's glob matches
`review-<mode>-*.json` and external findings live in `external-<as>-*.md`. That immunity rests on a
filename pattern nobody marked load-bearing. Shipping one half explicitly blinded and the other
accidentally safe would ship the asymmetry that caused this stage.

**D3 — fail closed when the slot is undeterminable.** Asymmetric consequences: withholding from a
sequential iteration costs convenience and SAYS SO in the prompt; retaining for a pair member
silently anchors the pair, passes the gate, and corrupts the residual estimate. Severity by
consequence.

**D4 — the requirement is MODIFIED, not REMOVED.** Case 1 walked all five slot states the cadence
can produce; three legitimately keep cycle context (a confirming `external` pass, a budget-spent
`external` pass, and any `independent` pass in proposal mode, whose cadence has no pair at all).
Deleting the section would make a confirming pass strictly worse at its job.

**D5 — the withheld note is visible, not silent.** The section still renders, carrying the
iteration number and one line naming why prior findings are absent. A silently-shortened prompt is
indistinguishable from a bug, and the external reviewer is a human-operated session that benefits
from knowing the omission is deliberate.

## Risks / Trade-offs

- **Duplicate stale findings across pair members** → accepted and stated in the spec. Independence
  is what makes the overlap interpretable; the walk suppresses the duplicates as stale. Priming
  both members on a common prior frame would inflate overlap and DEFLATE the residual estimate,
  making the instrument read safer than it is — the more expensive error.
- **The body still self-polices** → the gate cannot verify the prompt was actually blinded; that is
  exactly D-rc03a-6's deferred attestation. Mitigation for now: the withheld note is IN the
  committed prompt file, so a human reading the trail can see which way it went.
- **`next_hint_keys` is a status-shape dependency** → it is already consumed by `boot-render.ts` and
  `report-render.ts` for the model-hint garnish, so this adds a consumer to an existing contract
  rather than a new one.

## Alternatives considered

- **Delete the Cycle context section.** Rejected — D4.
- **Scope the rule to "must not read the PARTNER's findings".** Rejected — narrower and wrong.
  rc03's charter already defines the genre: a REVIEW receives no resolved-since list. A blind-pair
  member IS that genre, so the rule follows from what a review is, not from who the partner is.
- **Swap the canonical recommendation to external-first.** Considered three ways and rejected on
  all three (`explore.md` Considered & out): as the fix it leaves blindness an ordering discipline;
  as hardening alongside the fix it is superseded by D2, which makes order irrelevant to blindness;
  as an ergonomic change on its own merits — the strongest reading, since dispatching the slow
  human round-trip first is genuinely better scheduling — it is obsoleted by rc13's D-rc13-4, which
  already decided one invocation launches both halves, leaving no first and no second to order.
- **Attest blindness on the trail.** Deferred — D-rc03a-6; see Non-Goals.

## Migration Plan

None required. Older trails never report a `blind-pair` slot, and D3's fail-closed default covers
every path where the field is absent. No schema-version bump; no engine change; the generated
surface regenerates from one source with `npm run build && node bin/orbit.js update --force`.

## Open Questions

None. Q-rc03a-1 was resolved at promotion (D-rc03a-6, deferred as a declared follow-up).

## Touchpoints

- `src/core/templates/workflows/review.ts` — the external-handoff reference's cycle-context step and the internal branches' prior-run step.
- `orbit/specs/orbit-review-external/spec.md` + `orbit/specs/orbit-review/spec.md` — synced at archive, not by this change.
- `test/core/` — the genre-conditional cases and the fail-closed default.
