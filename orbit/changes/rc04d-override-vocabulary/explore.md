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
| 2 | `orbit-engine-gates` :: Inflection-prompt override contract | "Proceeding SHALL be recorded in the command's run summary (`gate_overridden: {gate, state, reason}`)." |
| 3 | `orbit-engine-gates` :: Review budget reported beside the gate state | scenario: "…read by the WAITING derivation, the inflection prompt, and the `gate_overridden` record" |
| 4 | `orbit-pr-lifecycle` :: Generalized READY rule | "A change archived via a recorded `gate_overridden` proceed-anyway SHALL still flip READY…" + its scenario "with `gate_overridden` recorded" |
| 5 | `orbit-conventions` :: Review mode decision framework | scenario: "…choosing proceed records `gate_overridden` in the archive run summary." |

Five requirements, three capabilities — AT R-crc-1's ceiling, not over it.

**Site 2 is not like the others.** Sites 1, 3, 4 and 5 name the field in passing; site 2 names its
SHAPE — `{gate, state, reason}` — which makes `orbit-engine-gates` a second voice on a fact
`orbit-run-summary-emit` already owns. That is the one-voice-for-facts defect rc07 was built
around, sitting inside the stage that exists to stop naming the field. Whether this stage merely
removes the name or moves the OWNERSHIP is the question below, and it is the difference between a
cosmetic pass and a structural one.

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

- **2026-09-21 — D-rc04d-2: de-naming MOVES THE OWNERSHIP at site 2 and substitutes a phrase at
  the other four.** (Sal, settling Q-rc04d-a on the standing recommendation.)

  Four sites name the field in passing and become plain substitutions. Site 2 restates the
  record's SHAPE, which makes `orbit-engine-gates` a second voice on a fact
  `orbit-run-summary-emit` owns — the one-voice-for-facts defect rc07 was built around, sitting
  inside the stage that exists to stop naming the field. A pure substitution there would leave
  `orbit-engine-gates` silently authoritative about a record belonging to another capability, and
  rc04c would have to return to a capability this stage was supposed to finish with, which defeats
  the point of splitting on capability boundaries. The extra clause lands INSIDE a requirement
  already being edited, in a capability already in scope, so it buys the fix without widening the
  stage.

  **THE FIVE REPLACEMENTS, verbatim — this is the stage's whole mechanism.**

  | # | capability :: requirement | from | to |
  |---|---|---|---|
  | 1 | `orbit-engine-gates` :: Gate-aware status and instructions with position readout | "…and records \`gate_overridden\` on proceed-anyway." | "…and records **the override** on proceed-anyway." |
  | 2 | `orbit-engine-gates` :: Inflection-prompt override contract | "Proceeding SHALL be recorded in the command's run summary (\`gate_overridden: {gate, state, reason}\`)." | "Proceeding SHALL be recorded in the command's run summary, carrying the gate, its state, and its reason AT DECISION TIME. The record's SHAPE is owned by the EMITTING COMMAND'S OWN CAPABILITY — \`orbit-run-summary-emit\` for the apply emit, \`orbit-archive-modifications\` for the archive emit — and named there, not here; this requirement states THAT the override is recorded and WHAT it must carry, never the field it is carried in." | **CORRECTED 2026-09-22** after the fresh proposal pass: the original row named only \`orbit-run-summary-emit\`, whose Purpose scopes it to WORKFLOW commands and whose \`gate_overridden\` entry sits inside \`Apply per-chunk-end emission\`. The ARCHIVE shape is owned by \`orbit-archive-modifications\` — and this requirement's own FIRST scenario is the archive case, so the original pointer was wrong for half the requirement's domain. The two-owner form mirrors the precedent at \`orbit-run-summary-emit\`:567. |
  | 3 | `orbit-engine-gates` :: Review budget reported beside the gate state (scenario) | "…the inflection prompt, and the \`gate_overridden\` record" | "…the inflection prompt, and **the override record**" |
  | 4a | `orbit-pr-lifecycle` :: Generalized READY rule | "A change archived via a recorded \`gate_overridden\` proceed-anyway SHALL still flip READY" | "A change archived via a recorded **proceed-anyway override** SHALL still flip READY" |
  | 4b | `orbit-pr-lifecycle` :: Generalized READY rule (scenario) | "with \`gate_overridden\` recorded" | "with **the override** recorded" |
  | 5 | `orbit-conventions` :: Review mode decision framework (scenario) | "choosing proceed records \`gate_overridden\` in the archive run summary" | "choosing proceed records **the override** in the archive run summary" |

  Every right-hand form is TRUE OF THE ENGINE AS IT STANDS TODAY, which is what exit (2) makes
  falsifiable: the suite stays green with no `src/` change anywhere in the diff. Site 2's new
  final clause — *never the field it is carried in* — is additionally true AFTER rc04c, which is
  the whole reason the ownership moves now rather than later.

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
