> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc04c-retire-gate-overridden

## Premise

`gate_overridden` records that a human chose **Proceed anyway** past a gate that said no. rc04a
shipped `judgements[]` with a `continuation/proceed` entry carrying the same three facts
(`gate`/`gate_state`/`gate_reason`) PLUS `formed_against` tokens, `reasoning` and `ratified_by`.
The charter's thesis is that the old record is now a strict subset of the new one, and keeping
both is two records for one fact.

**Two charter claims were checked before this exploration opened, and both are wrong.**

**(1) "NOTHING COMPUTES ANYTHING FROM IT" is no longer true — rc04a gave it a reader.**
`validateJudgements` (`src/core/emit-composition.ts:620`) READS `payload.gate_overridden` and
computes a refusal from it: a `continuation/proceed` whose `gate`/`gate_state`/`gate_reason`
disagree with the legacy object's `gate`/`state`/`reason` is refused, field by field. The parent
charter's exit (4) says `gate_overridden` *"either gains a reader or is retired"*. It gained one —
and the reader exists for the sole purpose of making the retirement safe. Retiring the field means
deleting its only reader in the same stroke, which is a shape worth naming rather than tripping on:
**the coexistence guard is scaffolding, and scaffolding comes down with the thing it braced.**

**(2) The scope claim "four workflow templates" is off by one — it is THREE.**
Verified by enumeration: `apply-change.ts` (3 occurrences), `archive-change.ts` (9),
`pr-choreography.ts` (1). `emit-composition.ts` (7) is the ENGINE, not a template. There is no
fourth template — `bulk-archive-change.ts` does not mention the field. The six-baseline-spec half
of the claim IS correct (`orbit-engine-gates`, `orbit-run-summary-emit`,
`orbit-archive-modifications`, `orbit-pr-lifecycle`, `orbit-emit-composition`,
`orbit-conventions`), as is the derived capability set for this stage (the three rc04a did not
touch: `orbit-engine-gates`, `orbit-pr-lifecycle`, `orbit-conventions`).

**What the check ALSO settled, in the retiring field's favour.** A tempting simplification is that
`gate_overridden` was always redundant, because `orbit-engine-gates` states gate state is a pure
function of on-disk artifacts — so the state at any past token should be recomputable and the
record adds nothing. **That is false, and the trail proves it.** Four archived apply emits record
`reason: "latest independent pass yielded new findings"` — clause-(c) vocabulary that rc02c
RETIRED. Today's engine cannot produce that string for any input. The recorded reason is what the
human SAW at decision time; a recomputed reason is what today's rules would say, and after any
vocabulary change those differ. So the three facts are worth carrying — which is exactly why
rc04a's continuation record carries them, and why this stage is a MOVE rather than a deletion.

## Decisions

- **2026-09-21 — D-rc04c-1: an EMPTY `formed_against` is legal on `continuation/proceed`, and ONLY
  when the emptiness is TRUE.** (Sal, ratifying option C over A/B/D. Settles Q-rc04c-a.)

  The override's trigger condition includes the state where no independent pass exists, so
  `gate_overridden` currently covers a case the successor cannot express. Rather than accept the
  silence (A) or relax the citation requirement outright (B), the emptiness becomes a CHECKED
  ASSERTION: `formed_against: []` is accepted on a `continuation/proceed` if and only if the trail
  carries no independent pass earlier than the emit's own token, and REFUSED — naming the pass it
  should have cited — when one exists. *"I cited nothing because there was nothing to cite"* is
  fully observable, so R-crc-10 permits the check.

  **What this buys, and it is the whole retirement argument**: the continuation record becomes
  TOTAL over the override's domain, which is what "strict widening" needed in order to be true.
  Option D (keep the field narrowly for this case) was rejected as two records for one fact — the
  defect the stage exists to remove.

  **Honest cost, recorded rather than slipped in**: this amends `formed_against`'s contract ONE
  DAY after rc04a shipped it through a blind pair. It is ordinary stage work on a capability, not
  a reversal of a ruling, but it is the second move for the same field in two days.

  **Mechanism (R-crc-7 — the procedure executed once, not sketched).** The non-empty check
  currently lives in `validateJudgements`, which is STRUCTURAL and has no trail access; the
  emptiness exemption is conditional on TRAIL STATE, which only `judgementOrderingCheck` at the
  write gate can see. So the check SPLITS:

  | check | lives in | rule |
  |---|---|---|
  | `formed_against` is an array of strings | `validateJudgements` | unchanged |
  | non-empty required | `validateJudgements` | RELAXED: exempt `continuation`/`proceed` only |
  | empty is TRUTHFUL | `judgementOrderingCheck` | NEW: empty refused if any independent pass precedes the emit token |
  | every cited token resolves + precedes | `judgementOrderingCheck` | unchanged |

  The exemption is scoped to `continuation`/`proceed` deliberately. `continuation`/`spend` buys a
  pass past a gate that HAS passed, so passes necessarily exist. `readiness` asserts a belief
  formed knowing what came back; with nothing back there is no readiness judgement to record, and
  an empty citation there would be the uncheckable hole rc04a's design refused.

- **2026-09-21 — D-rc04c-2: the stage as chartered is 2.0x the ceiling — R-crc-9 fires.**
  Measured, not estimated: `gate_overridden` appears in **6 baseline capabilities across 14
  requirements** (`orbit-archive-modifications` 4, `orbit-run-summary-emit` 4,
  `orbit-engine-gates` 3, `orbit-conventions` 1, `orbit-emit-composition` 1,
  `orbit-pr-lifecycle` 1) against R-crc-1's ceiling of <=3 capabilities and ~12 requirements.
  Capabilities-touched is the binding dimension and it is double. The charter's own line — "the
  three not already touched by rc04a are this stage's capabilities" — had the right intuition and
  assigned only HALF the work: rc04a MODIFIED those three capabilities but did not remove
  `gate_overridden` from any of them, so all six still require normative change.

- **2026-09-21 — D-rc04c-3: DE-NAMING FIRST shrinks the retirement from six capabilities to
  three, and removes the inconsistent interim entirely.** (The mechanism the size check produced.)

  Three of the six capabilities do not depend on the field's SHAPE at all — they name it only
  while describing that an override is recorded:

  | capability | the text | de-named form |
  |---|---|---|
  | `orbit-engine-gates` | "records `gate_overridden: {gate, state, reason}`" | "records the override on the emit (shape owned by `orbit-run-summary-emit`)" |
  | `orbit-pr-lifecycle` | "a recorded `gate_overridden` proceed-anyway SHALL still flip READY" | "a recorded proceed-anyway override SHALL still flip READY" |
  | `orbit-conventions` | "choosing proceed records `gate_overridden` in the archive run summary" | "choosing proceed records the override in the archive run summary" |

  Every de-named form is TRUE BEFORE AND AFTER the retirement. That is the property that matters:
  done first, there is never a moment where a spec normatively requires a field nothing writes.
  Done in the other order — retire the field, then clean up the references — the interim state has
  three capabilities demanding a record the emit layer refuses. Same total work, one ordering has
  an incoherent middle and the other does not.

## Open questions

- **Q-rc04c-b — what guarantees the widening once the guard that enforced it is gone?**
  The coexistence refusal is the only mechanism proving the two records agree. It is also the only
  reader of the field being retired, so it cannot outlive it. Once both are gone, the claim "the
  new record carries everything the old one did" is supported by nothing executable.
  Standing recommendation: this is probably fine and should be stated rather than solved — the
  guard's job was to hold the invariant DURING the overlap, and after the overlap there is one
  record and nothing to disagree with. What deserves to survive is a test asserting the
  continuation record still carries all three gate facts, so the loss of the legacy shape does not
  quietly become a loss of the fields.

- **Q-rc04c-c — what shape does the split take, and what are the halves called?**
  A SCOPE call, so it is raised and not taken (R-crc-3; the D-rc04-18 precedent — splitting a
  chartered stage is architecture work and belongs to `/orbit:architect`).
  Standing recommendation: **two stages of three capabilities each, de-naming first.**
  (i) the de-naming pass over `orbit-engine-gates`, `orbit-pr-lifecycle` and `orbit-conventions` —
  5 requirements, every edit a one-line reword, no behaviour change, no dependency, and safe to
  archive on its own; then (ii) the retirement proper over `orbit-emit-composition`,
  `orbit-run-summary-emit` and `orbit-archive-modifications` — 9 requirements, carrying D-rc04c-1's
  totality rule, the three workflow bodies, and the removal of the coexistence guard. (ii)
  `Depends-on:` (i). Both halves sit AT the ceiling rather than over it. The alternative axis —
  splitting by seam (apply vs archive) — was considered and is worse: `orbit-emit-composition` and
  `orbit-engine-gates` straddle both seams, so neither half would be self-contained.

## Considered & out

- **Accept the silence in the no-citable-pass case** (option A, 2026-09-21) — retire the field
  outright and let the trail say nothing when an override has no evidence to cite. Defensible and
  cheaper, and it turns on a real question: proceeding when nothing came back is arguably not a
  judgement *formed against independent review output* at all. Rejected because the recorded
  REASON is provably unreconstructible (four archived emits carry clause-(c) vocabulary rc02c
  retired), so the silence would lose something the engine cannot recover.

- **Allow an empty `formed_against` unconditionally on `proceed`** (option B, 2026-09-21) — one
  record, wider domain, no trail check. Rejected: the ordering check would have nothing to check,
  which is exactly the uncheckable record rc04a's design was built to refuse. D-rc04c-1 keeps the
  widening while keeping the check, by making the emptiness itself the thing that is verified.

- **Keep `gate_overridden` narrowly for the evidence-free case** (option D, 2026-09-21) — two
  records for one fact, just rarer. Rejected: that is the defect the stage exists to remove.

- **Split rc04c by SEAM rather than by layer** (2026-09-21) — an apply-seam half and an
  archive-seam half. Rejected: `orbit-emit-composition` and `orbit-engine-gates` straddle both
  seams, so neither half is self-contained and the capability count does not actually drop.

## References

- `orbit/architecture/clean-up-review-cycle.md` — the stage charter (amended 2026-09-21 with the
  named hole in its own strict-subset premise) and R-crc-12.
- `orbit/changes/archive/2026-09-21-rc04a-judgement-record/explore.md` — the SHARED source for
  rc04b and rc04c. **Read D-rc04-19 first**: it supersedes parts of D-rc04-15. D-rc04-17 is this
  stage's own decision (retired from the write path, not deprecated).
- `orbit/changes/archive/2026-09-21-rc04a-judgement-record/.orbit-runs/archive-2026-09-21T23-08-19Z.json`
  — the program's first readiness record; the shape this stage's argument depends on.
- `src/core/emit-composition.ts:606-632` — the coexistence guard: the field's only reader.
- `orbit/specs/orbit-engine-gates/spec.md:112` — "Gate state is a pure function of existing
  on-disk artifacts", the claim that makes the redundancy argument tempting and the retired
  vocabulary that defeats it.
