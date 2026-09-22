> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc04d-override-vocabulary

## Premise

Split from `rc04c-retire-gate-overridden` on 2026-09-21 under R-crc-9 (third preventive
application). Three baseline capabilities name `gate_overridden` only while stating that an
override is RECORDED — they do not depend on its shape. De-named, every one of those sentences is
TRUE BEFORE AND AFTER the retirement, which is why this stage runs FIRST: there is then never a
moment when a spec normatively demands a field nothing writes.

**All five sites read before anything was written about them.** Exact current text:

| # | capability :: requirement | the text naming the field |
|---|---|---|
| 1 | `orbit-engine-gates` :: Gate-aware status and instructions with position readout | "…prompts (address / proceed-anyway / abort) and records `gate_overridden` on proceed-anyway." |
| 2 | `orbit-engine-gates` :: Inflection-prompt override contract | "Proceeding SHALL be recorded in the command's run summary (\`gate_overridden: {gate, state, reason}\`)." — this row names the field's SHAPE, not just the field; see D-rc04d-2 row 2 for the replacement and its two corrections. |
| 3 | `orbit-engine-gates` :: Review budget reported beside the gate state | scenario: "…read by the WAITING derivation, the inflection prompt, and the `gate_overridden` record" |
| 4 | `orbit-pr-lifecycle` :: Generalized READY rule | "A change archived via a recorded `gate_overridden` proceed-anyway SHALL still flip READY…" + its scenario "with `gate_overridden` recorded" |
| 5 | `orbit-conventions` :: Review mode decision framework | scenario: "…choosing proceed records `gate_overridden` in the archive run summary." |

Five requirements, three capabilities — AT R-crc-1's ceiling, not over it.

**Site 2 is not like the others.** Sites 1, 3, 4 and 5 name the field in passing; site 2 names its
SHAPE — `{gate, state, reason}` — which makes `orbit-engine-gates` a second voice on a fact it
does not own. That is the one-voice-for-facts defect rc07 was built around, sitting inside the
stage that exists to stop naming the field. Whether this stage merely removes the name or moves
the OWNERSHIP is the question below, and it is the difference between a cosmetic pass and a
structural one. (Asked at exploration, it read as a two-way
choice — leave the shape restatement, or name its true owner. It was not: DELETING the shape
claim while naming NO owner was a third option nobody listed, and D-rc04d-2's reversal note
records that it is the one the stage took.)

## Decisions

- **2026-09-21 — D-rc04d-1: no instrument couples spec wording to body wording, so exit (2) holds
  — and the same check tells rc04c what it will break.** (Resolves Q-rc04d-b by measurement.)

  The worry was that de-naming a spec while its implementing body still says `gate_overridden`
  might trip a fidelity or parity instrument, which would make exit (2) ("no `src/` change
  anywhere in the diff") and that instrument mutually unsatisfiable. Checked rather than reasoned:
  `test/core/templates/orbit-content-fidelity.test.ts` pins that the BODIES contain
  `gate_overridden` — for `apply-change` and `archive-change` — and reads **zero** spec files
  (`grep -c "orbit/specs" → 0`). The only tests that read `orbit/specs/` at all are
  `sources-registry` and `source-lint`, and both COUNT capabilities rather than reading prose.

  So a body naming a field its spec now describes generically is invisible to every instrument in
  the repo, and this stage can de-name all five sites without touching `src/`. The bodies describe
  what is written TODAY, and today the field IS written.

  **The same measurement is a gift to rc04c, recorded here so that stage inherits it instead of
  discovering it.** Those two content-fidelity pins go RED the moment rc04c stops the bodies
  writing `gate_overridden`. That is a pin doing its job — the same class as the ruling-count pin
  that went red on R-crc-12 earlier today — and it belongs in rc04c's task list as a deliberate
  update with the reason recorded, not as a surprise mid-apply.

  **CORRECTED 2026-09-22 (system pass, fresh half): the inventory is FOUR test files, not two,
  and the undercount has a cause worth keeping.** The full set is `orbit-content-fidelity`,
  `emit-schema-parity`, `emit-composition` and `judgement-record-fixture` (tasks 3.1 carries the
  per-file detail). The grep above asked whether anything couples SPEC wording to BODY wording —
  which is the question exit (2) needed answered, and it is answered correctly. The claim built
  on top of it was about what rc04c BREAKS, which is a DIFFERENT question the grep never
  measured. The decision above stands; only the handoff figure was wrong.

- **2026-09-21 — D-rc04d-2: site 2 STOPS RESTATING THE RECORD'S SHAPE; the other four are plain
  substitutions, and 4a additionally narrows its SHALL.** (Sal, settling Q-rc04d-a on the standing
  recommendation. The site-2 half was RATIFIED AS AN OWNERSHIP MOVE and REVISED on 2026-09-22 to a
  removal — both the original argument and its refutation are kept below, because the path is the
  evidence.)

  Four sites name the field in passing and become plain substitutions. Site 2 restates the
  record's SHAPE, which makes `orbit-engine-gates` a second voice on a fact another capability
  owns — the one-voice-for-facts defect rc07 was built around, sitting inside the stage that
  exists to stop naming the field. THAT diagnosis survived everything below; only the remedy
  moved.

  **THE ARGUMENT AS RATIFIED (2026-09-21), kept verbatim because the reversal is only legible
  against it:** *a pure substitution there would leave `orbit-engine-gates` silently authoritative
  about a record belonging to another capability, and rc04c would have to return to a capability
  this stage was supposed to finish with, which defeats the point of splitting on capability
  boundaries. The extra clause lands INSIDE a requirement already being edited, in a capability
  already in scope, so it buys the fix without widening the stage.*

  **THE REVERSAL (2026-09-22), after two independent refutations.** The remedy above was to name
  the shape's true OWNER. A fresh proposal pass showed the single-owner form false for the ARCHIVE
  emit; the external system pass showed the two-owner replacement ALSO false, since
  `orbit-archive-modifications`:63 says the successor record's *"shape and carrier [are] both
  defined by `orbit-run-summary-emit`"* — so the clause was true today and false after rc04c,
  which is precisely the invariance it existed to provide. R-crc-13, recorded between the blind
  pair's return and the walk, supplies the line the evidence was groping for: **a gate REPORTS, it
  never RULES; an emit RECORDS.** Under it, shape ownership was never this capability's to
  adjudicate, and the remedy is REMOVAL rather than redirection — `orbit-engine-gates` keeps THAT
  the override is recorded and WHICH FACTS ABOUT THE GATE must survive the decision, and says
  nothing about the field. The one-voice defect is still fixed; two attempts to fix it by pointing
  elsewhere were both a third voice on an unsettled fact.

  **THE FIVE REPLACEMENTS, verbatim — this is the stage's whole mechanism.**

  | # | capability :: requirement | from | to |
  |---|---|---|---|
  | 1 | `orbit-engine-gates` :: Gate-aware status and instructions with position readout | "…and records \`gate_overridden\` on proceed-anyway." | "…and records **the override** on proceed-anyway." |
  | 2 | `orbit-engine-gates` :: Inflection-prompt override contract | "Proceeding SHALL be recorded in the command's run summary (\`gate_overridden: {gate, state, reason}\`)." | "Proceeding SHALL be recorded in the command's run summary, carrying the gate, its state, and its reason AT DECISION TIME. This requirement states THAT the override is recorded and WHICH FACTS ABOUT THE GATE it must carry; the FIELD those facts are carried in, and its shape, belong to the emit layer and are not named here." **CORRECTED TWICE 2026-09-22 — the text above is the LIVE form; the two formulations below are SUPERSEDED, kept as history and NOT to be transcribed.** (i) Superseded by the fresh proposal pass: *"…shape owned by \`orbit-run-summary-emit\`"* — wrong for the ARCHIVE emit, whose shape that capability does not own, and this requirement's own FIRST scenario is the archive case. (ii) Superseded by the external system pass: *"…SHAPE is owned by the EMITTING COMMAND'S OWN CAPABILITY — \`orbit-run-summary-emit\` for the apply emit, \`orbit-archive-modifications\` for the archive emit"* — true today and FALSE after rc04c, forfeiting the before-and-after invariance the whole stage rests on. R-crc-13 ended the attempt; see the reversal note above. |
  | 3 | `orbit-engine-gates` :: Review budget reported beside the gate state (scenario) | "…the inflection prompt, and the \`gate_overridden\` record" | "…the inflection prompt, and **the override record**" |
  | 4a | `orbit-pr-lifecycle` :: Generalized READY rule | "A change archived via a recorded \`gate_overridden\` proceed-anyway SHALL still flip READY" | "A change archived via a recorded **proceed-anyway override** SHALL still flip READY" **CORRECTED 2026-09-22.** Shipped text adds "at the `review-system` gate": the unqualified form widened a normative SHALL across BOTH archive-seam proceed-anyway overrides, and `orbit-archive-modifications`:116 spends a sentence keeping `gate_overridden` and `fingerprint_overridden` apart. Only `review-system` can be unpassed at the archive seam, so the qualifier is true of the engine. |
  | 4b | `orbit-pr-lifecycle` :: Generalized READY rule (scenario) | "with \`gate_overridden\` recorded" | "with **the override** recorded" |
  | 5 | `orbit-conventions` :: Review mode decision framework (scenario) | "choosing proceed records \`gate_overridden\` in the archive run summary" | "choosing proceed records **the override** in the archive run summary" |

  Every right-hand form is TRUE OF THE ENGINE AS IT STANDS TODAY, which is what exit (2) makes
  falsifiable: the suite stays green with no `src/` change anywhere in the diff. Site 2's form
  clears a second bar the other four do not have to: it is ALSO true after rc04c. That is not a
  bonus — it is the property the two superseded formulations failed, and the reason the remedy had
  to be removal. A requirement that says nothing about the field cannot be falsified by the field's
  retirement.

## Open questions

## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — rc04d's charter (declared 2026-09-21) and
  rc04c's amended one; the ORDER between them is the point.
- `orbit/explore/rc04c-retire-gate-overridden/explore.md` — D-rc04c-3 carries this stage's whole
  mechanism as a three-row table; D-rc04c-2 carries the size check that produced the split.
- `orbit/specs/orbit-engine-gates/spec.md`, `orbit/specs/orbit-pr-lifecycle/spec.md`,
  `orbit/specs/orbit-conventions/spec.md` — the three capabilities; five requirements.
- `src/core/templates/workflows/pr-choreography.ts:388` — a body naming the field, deliberately
  untouched by this stage (Q-rc04d-b).
