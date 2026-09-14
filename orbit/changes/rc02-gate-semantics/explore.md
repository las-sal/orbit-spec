> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc02-gate-semantics

## Premise

Stage rc02 of `clean-up-review-cycle` (Phase 1, goal G1): the reviewed gate must converge on
CONSEQUENCE rather than on cadence-slot arithmetic. Today's criterion (`gates.ts`
`evaluateReviewed`) has three clauses — ordered-slot class coverage, resolution over every
pass, and a `confirm` predicate over the latest independent pass — and every one of them
counts events rather than weighing risk:

- **Severity is a reviewer's adjective, not a defined term.** Clause (c) keys on
  `critical > 0`, and clause (b) demands every finding of every severity resolved, but
  nothing in the repo defines what makes a finding CRITICAL. The review body says only
  "prefer the lower severity". A prose-heavy artifact gives a diligent reviewer unlimited
  defensible WARNINGs, and each of them has to be walked before the gate moves.
- **SUGGESTIONs gate.** R-d-10 (Sal, 2026-07-16) ratified that suggestion-grade findings
  should not repeat the independent loop, and the follow-up (issue #8, a third `confirm`
  value) never shipped; the sanctioned interim path has been a recorded `gate_overridden`.
  Clause (b) still requires every SUGGESTION resolved before the gate passes.
- **The loop has no declared end.** `confirm: findings-resolved` renders the reason
  "cadence repeats external until none", which is a loop with no bound: the walk that
  resolves the CRITICAL stales the pass that found it, the next pass reads the walk's edits,
  and the only exit is the override. D6 archived that way after seven passes and 131
  findings, of which three were the defects that mattered.

The charter: a severity ladder defined by consequence, the rule that SUGGESTIONs never gate,
the R-crc-4 stop rule stated in the engine's own terms, and a declared per-change REVIEW
BUDGET whose exhaustion the gate REPORTS as a state (`budget-exhausted`) rather than
enforcing as a block. Gates never hard-block: the engine reports, the body prompts, the user
decides, the trail records.

Sized under R-crc-1. Touches `orbit-engine-gates`, `orbit-conventions`, and the `spec-driven`
schema (v3 → v4). Depends on nothing; runs in parallel with the rest of Phase 1.

## Decisions

- **MOVED 2026-09-12 to rc02b-severity-ladder (design D1); kept verbatim below as the historical record.**
- **2026-09-12 — D-rc02-1: the ladder is defined by CONSEQUENCE, and its CRITICAL rung carries
  an evidence tax** (settled under R-crc-3). `orbit-conventions`' Severity ladder requirement
  today says only "three names" and "prefer the lower severity" — it never says what makes a
  finding critical, so every reviewer supplies a private definition. The rungs become:
  **CRITICAL** — a user path breaks or data is lost, AND the finding carries a reproduction
  (the exact invocation, input, or state that exhibits it); **WARNING** — an implementation
  built to the artifact as written could diverge from what the artifact intends; **SUGGESTION**
  — everything else, including every stylistic, redundancy, and wording finding. The
  false-positive bias survives unchanged. Rationale: severity is the only lever the gate reads,
  and D6's evidence is unambiguous — three of 131 findings were the defects that mattered and
  all three arrived with a reproduction. An evidence tax on the top rung prices the rung
  without asking any reviewer to be less thorough: everything found is still reported, it is
  simply reported at the rung its consequence earns.

- **MOVED 2026-09-12 to rc02b-severity-ladder (design D1); kept verbatim below as the historical record.**
- **2026-09-12 — D-rc02-2: the engine never re-grades a finding; the evidence tax is ENFORCED
  where evidence is produced and SURFACED where it cannot be** (settled under R-crc-3). Two
  provenances, two treatments. An INTERNAL review emit is written by an AI under our own write
  gate, so `orbit emit review` rejects a `severity: "CRITICAL"` finding with no non-empty
  `reproduction` — fail-loud, in the idiom of the existing `scorecardRollupCheck` and
  `validatePrFields` closed-key check, with an error naming the finding and what to supply. An
  EXTERNAL findings file arrives from another AI's session and cannot be gated at write time:
  the prompt template's CRITICAL entry shape gains `**Reproduction**:`, `parseExternalMarkdown`
  reads it, and a CRITICAL without one is still counted as a CRITICAL — never silently
  downgraded — but is marked unreproduced on the trail and named in the gate's reason. Rationale:
  an engine that quietly demotes an outside reviewer's CRITICAL would trade the loop this
  program is fixing for a class of silently-dropped defect, which is strictly worse. The
  unreproduced CRITICAL is a claim the walk's pushback discipline already exists to settle; the
  engine's job is to make it visible, and the downgrade — when it is right — is a walk decision
  recorded on the trail, by a human-ratified path, not an engine act.

- **2026-09-12 — D-rc02-3: SUGGESTIONs never gate, implemented as severity-awareness in
  convergence clauses (b) and (c) for EVERY reviewed gate — not as a third `confirm` value**
  (settled under R-crc-3; supersedes the mechanism of a Sal-ratified follow-up, see below).
  Clause (b) today resolves a pass only when the completing `address-reviews` shows
  `deferred == 0 AND escalated == 0` at any severity; clause (c)'s `no-new-findings` counts a
  new finding at any severity. Both become substantive-only (CRITICAL + WARNING). The data is
  already on the trail: `address-reviews` emits carry `resolutions[]` entries with both
  `severity` and `outcome` (`resolved` / `stale` / `deferred` / `escalated`), so clause (b)
  reads the entries rather than the bare counts, and `TrailFinding` gains the `severity` it
  needs for clause (c). Legacy tolerance follows the `reviewer_class` precedent: an emit whose
  `resolutions[]` is absent or severity-less falls back to today's bare-count rule, which is
  strictly more conservative.
  **On issue #8 and R-d-10**: R-d-10 (Sal, 2026-07-16) ratified that suggestion-grade findings
  must not repeat the independent loop, and tracked the follow-up as a third `confirm` value,
  `no-new-substantive-findings`. Its INTENT ships here exactly; its MECHANISM is superseded. A
  confirm value is a per-gate configuration axis, and "SUGGESTIONs never gate" is a rule no
  schema author should ever be able to flip; worse, `confirm` selects only clause (c), so the
  literal follow-up would have left clause (b) blocking on a deferred SUGGESTION — the clause
  that actually blocked the D-arc archives. The closed two-value `confirm` set therefore stays
  closed. Issue #8 closes with a pointer to this stage.

- **2026-09-12 — D-rc02-4: `blind-pair` joins the cadence vocabulary; blindness is computed
  from the trail, and same-state is a named v1 limit** (settled under R-crc-3). R-crc-4's
  "two blind reviews on the same artifact state before any walk" is not expressible in today's
  slot vocabulary, whose every slot demands a pass STRICTLY LATER than the previous slot's —
  ordering is exactly the property a parallel pair does not have. A fifth cadence entry joins
  `in-context` / `fresh` / `external` / `independent`: a **`blind-pair`** slot is satisfied by
  TWO passes of DISTINCT independent classes (one `fresh`, one `external`), both fresh under
  the freshness rule, with NO walk of either pass's own findings recorded strictly between
  their two tokens; the pair's later token is what a following slot must beat. Blindness is
  precise and computable — a `TrailResolution` whose `sourcePath` references either pass breaks
  it, an unrelated walk (an audit-drift ingest, say) does not. Distinct classes are required
  rather than merely two independents: the pair's value is two different model families on one
  state, which is also what makes rc04's capture-recapture residual estimate meaningful.
  **Named v1 limit**: blindness is enforced, byte-exact SAME-STATE is not. Two passes with no
  intervening walk may still straddle an unrelated edit, and the engine sees only apply tokens
  and walk records. Detection, not prevention, per R-d-11's house rule; a per-pass tree
  fingerprint is the obvious upgrade and belongs with rc04's measurement work, not here.

- **2026-09-12 — D-rc02-5: at schema v4 the system cadence becomes `[blind-pair, in-context]`;
  the proposal cadence is unchanged** (settled under R-crc-3). Today's system cadence
  `[in-context, external, in-context]` is the loop written into the schema: a leading
  in-context pass whose class yielded ONE CRITICAL in roughly 25 passes across the D-arc, and
  a trailing in-context slot that must come after the external no matter what the external
  found. The leading slot is struck. The TRAILING slot survives deliberately: something must
  read the walk that resolved the pair's findings, and under R-crc-4 that something is the
  verification pass — which is rc03's to name. Keeping the slot as `in-context` at v4 preserves
  the safety property with no new genre, and rc03's schema edit renames it `verification`,
  which is precisely the exit criterion rc03 already declares. The proposal cadence
  (`[independent, in-context]`, `confirm: no-new-findings`) is R-crc-4's one-blind-review shape
  already and needs no edit; the ladder and the budget reach it through the engine, not the
  schema. Net effect on evidence: the system gate demands MORE independent scrutiny than today
  (two distinct classes on one state, versus one external) and fewer passes.

- **SUPERSEDED 2026-09-12 by design D6 on three points** (the sixth gate state, the exported
  `isUnconverged` predicate, and `budget: 2` for `review-proposal`): exhaustion is reported BESIDE
  the state as a `budgetExhausted` boolean with `independentSpend`/`budget` fields and a distinct
  position token; the state set stays at five values; both gates declare `budget: 3`. The entry is
  kept verbatim below as the historical record of what was decided at exploration time.
- **2026-09-12 — D-rc02-6: the budget counts every independent pass on the gate's mode, stale
  ones included, and its exhaustion is a sixth gate state routed through one exported
  predicate** (settled under R-crc-3). `budget` is a new optional integer on the gate
  declaration; `spec-driven` v4 declares 3 for `review-system` (the pair plus one) and 2 for
  `review-proposal` (one blind review plus one). It counts INDEPENDENT passes (`fresh` +
  `external`) on the gate's mode across the whole trail — stale passes included, because spend
  is spend, and a change that has burned four independent passes is over budget whatever
  invalidated them. `GateState` gains `budget-exhausted`, reported only when the gate has not
  otherwise converged; a converged gate is `passed` regardless of what it cost. Gates never
  hard-block, so this is a report: the existing inflection prompt fires, the user decides, the
  trail records. To keep the widening bounded, gates.ts exports one predicate —
  `isUnconverged(state)`, true for `unpassed` / `stale` / `budget-exhausted` — and every
  consumer that today tests `state === 'unpassed' || state === 'stale'` (orientation's WAITING
  band, the instructions loader's `blocked-by-gate`, the archive and apply bodies' prompt
  conditions, the rendered tail) routes through it, so the next state after this one costs
  nothing. **The budget is a backstop, not an exit**: if the stop rule works, no change ever
  reaches it, and a change that does has told us something the program wants to hear.

- **2026-09-12 — D-rc02-7: the gate reason is this stage's teaching surface, and it fires
  BEFORE the cost is sunk** (settled under R-crc-3). Exit criterion (2) asks the reason to name
  whichever rule fired; the reason should also name the rule about to fire. Concretely: once one
  independent pass exists and its blind partner does not, the reason says so and the canonical
  next command targets the missing class — `blind pair open: an external pass on this state has
  no fresh partner; run it before walking these findings`. Without that line the blind-pair rule
  is a trap for the sequential habit the D-arc built: walk the first pass, then discover the
  pair can no longer be formed on that state. The same discipline applies to the other reasons —
  an unreproduced CRITICAL, a budget one pass from exhaustion, a deferred-SUGGESTION count on a
  gate that passed anyway. The reason line is read at every status render and costs nothing.

- **2026-09-12 — D-rc02-8 (resolves Q-rc02-1): the budget is declared in the schema per gate;
  no per-change override at rc02** (settled under R-crc-3, at promotion). The standing
  recommendation is adopted verbatim. The budget is a property of the cadence, and the cadence
  already lives in the schema where tuning is a version bump. A per-change override would add a
  `.openspec.yaml` field, its validation, its propose-time authoring prompt, and a second place
  the number can be wrong, for a capability no change has yet asked for. Deferred to rc04, where
  cost is the subject; re-entry trigger is the first change whose budget exhaustion is judged a
  wrong reading of that change rather than a real signal.

- **2026-09-12 — D-rc02-9 (resolves Q-rc02-2): at budget exhaustion the archive records today's
  `gate_overridden`, carrying the gate's own reason verbatim** (settled under R-crc-3, at
  promotion). rc02 must not depend on rc04, so the seam is unchanged and only the reason text
  differs. G1's falsification test is an override whose reason is "no clean pass yet", so a
  budget-exhausted override is consistent with the goal and legible on the trail. rc04 replaces
  the field with `residual_risk`; it does not move the seam.

- **2026-09-12 — D-rc02-10 (resolves Q-rc02-3): no migration mechanism for v3-era trails; a test
  carries the claim instead** (settled under R-crc-3, at promotion). `schema_version` in
  `.openspec.yaml` is a consent-era tripwire marker, never a schema selector — gate computation
  loads the current schema by name — so every archived change recomputes under v4 with no
  `blind-pair` on its trail. The claim that this is cosmetic is verified rather than assumed: a
  test computes gate state over an archived v3 change, asserts the computation completes, and
  asserts orientation surfaces no live-change WAITING row for it. If a readout does mislead, the
  fix is a rendering note; a versioned schema selector is out of scope and out of character for
  an engine whose gate state is a pure function of on-disk artifacts.

## Open questions

All three RESOLVED at promotion (2026-09-12, under R-crc-3), each by its own standing
recommendation; the questions are kept, never deleted, and point at the decision that closed
them.

- **Q-rc02-1 — RESOLVED (D-rc02-8): schema-declared budget only; per-change override deferred
  to rc04.** Is the budget declared per CHANGE, or per gate in the schema with no override? The
  charter says "declared per change"; a schema default is computed per change for free, while a
  real override costs a metadata field, its validation, a propose-time prompt, and a second
  place the number can be wrong. `Standing recommendation: schema-declared only at rc02 — the
  budget is a property of the cadence, and the cadence lives in the schema.`

- **Q-rc02-2 — RESOLVED (D-rc02-9): the existing `gate_overridden` seam, with the gate's reason
  naming budget exhaustion.** What does the archive RECORD when the gate reports
  `budget-exhausted`, before rc04 ships its `residual_risk` field? `Standing recommendation: the
  existing gate_overridden path, with the gate's own reason naming budget exhaustion verbatim.`

- **Q-rc02-3 — RESOLVED (D-rc02-10): no migration mechanism; a test carries the claim.** Does
  the v4 bump need anything for trails computed under v3? `Standing recommendation: no migration
  mechanism; a test that computes gate state over an archived v3 change and asserts the
  computation completes without throwing and surfaces no live-change WAITING row.`

## Considered & out

- **A third `confirm` value, `no-new-substantive-findings`** (issue #8's literal shape;
  2026-09-12) — rejected in favour of severity-aware clauses (b) and (c) for every reviewed
  gate. `confirm` selects clause (c) only, so the literal follow-up would have left a deferred
  SUGGESTION blocking through clause (b) as well (CORRECTED 2026-09-12: clause (b) has never blocked an archive; both recorded overrides cite clause (c) — see design D2)
  and it would have made "SUGGESTIONs never gate" a flippable per-gate option. Intent preserved,
  mechanism superseded; see D-rc02-3.
- **Engine-side re-grading of an unreproduced CRITICAL** (2026-09-12) — an automatic downgrade
  would convert a loop problem into a silently-dropped-defect problem. Surfaced and walked
  instead; see D-rc02-2.
- **REVERSED 2026-09-12 — the rejection below did not survive its first external review; the flag
  shape SHIPPED.** The cost argument that decided it was not the capability count but the modeling
  one: gate `state` answers whether the gate converged, and spend is an orthogonal axis. The
  rejection is kept verbatim as the historical record.
- **`budget-exhausted` as a boolean flag on `unpassed` rather than a sixth state**
  (2026-09-12) — cheaper (no consumer widening, no prose drift across the archive spec), but it
  hides the very cost this program exists to surface: the position readout would still say
  `unpassed`, and the user would learn about the budget only by reading a reason. The state is
  the point. The widening is bounded by the `isUnconverged` predicate (D-rc02-6), and Q-crc-4
  already settled the shape as a gate state.
- **Byte-exact same-state enforcement for the blind pair** (2026-09-12) — a per-pass tree
  fingerprint would make "the same artifact state" literal rather than best-effort, but it adds
  a new recorded fact to every review emit for a property blindness already approximates well.
  Named as a v1 limit with detection deferred to rc04's measurement work; re-entry trigger is a
  pair that passed the blindness test while demonstrably reading different trees.

## References

- `orbit/architecture/clean-up-review-cycle.md` — the program doc; rc02's charter, R-crc-1
  through R-crc-5, goals G0–G4, and the measured premise.
- `src/core/artifact-graph/gates.ts` — `evaluateReviewed` (the three clauses),
  `computeReviewedStatus` (freshness split), `canonicalNextForReviewed` (single-voiced next).
- `src/core/artifact-graph/trail.ts` — what the gate can see: `TrailPass`
  (token/class/mode/counts/findings), `TrailResolution`, `applyTokens`.
- `src/core/artifact-graph/types.ts` — `GateSchema`, `CADENCE_ENTRIES`, `GateConfirmSchema`
  (the closed two-value confirm set), `NormalizedGate`.
- `schemas/spec-driven/schema.yaml` — version 3; the two reviewed gates and their cadences.
- `orbit/specs/orbit-engine-gates/spec.md` — "Reviewed-gate pass condition", "spec-driven v1
  gates and cadence", "Inflection-prompt override contract".
- `orbit/architecture/d-arc-arbitered-flow.md` R-d-10 — severity-thresholded convergence,
  ratified 2026-07-16; issue #8 is its unshipped follow-up.
