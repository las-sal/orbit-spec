# Design: rc04c-retire-gate-overridden

## Context

The last stage of the `gate_overridden` retirement. `rc04a-judgement-record` shipped the successor
(`judgements[]` with a `continuation/proceed` entry carrying `gate`/`gate_state`/`gate_reason` plus
`formed_against`, `reasoning` and `ratified_by`); `rc04d-override-vocabulary` took the three
capabilities that named the field without depending on its shape. What remains is the retirement
proper: 3 capabilities, 10 requirements, 3 workflow bodies, the engine, and 4 test files (9 sites).

This design CITES rather than invents — `explore.md` carries seven dated decisions and zero open
questions, and its mechanism was worked out to R-crc-7's bar before promotion. Two things in that
record are load-bearing here and are NOT re-derived: D-rc04c-1's split of the `formed_against`
check across two engine sites, and D-rc04c-6's site-by-site classification of the four red tests.

**Two charter claims were checked at exploration and both were wrong** (`explore.md` Premise), which
is why this design restates neither. "Nothing computes anything from it" stopped being true when
rc04a gave the field a reader; "four workflow templates" is three. The six-baseline-spec claim WAS
correct and has since been reduced to three by rc04d.

**The redundancy argument does not hold, and that is why this is a MOVE rather than a deletion.**
`orbit-engine-gates` makes gate state a pure function of on-disk artifacts, which tempts the
conclusion that any past state is recomputable and the record adds nothing. The trail refutes it:
TEN archived apply emits, across FOUR changes, record
`reason: "latest independent pass yielded new findings"` —
clause-(c) vocabulary that `rc02c` RETIRED and today's engine cannot produce for any input. A
recorded reason is what the human SAW; a recomputed one is what today's rules would say.

## Goals / Non-Goals

**Goals:**

- `gate_overridden` is gone from the WRITE path — bodies, payload tables, schema reference — while
  every archived emit carrying it still reads as a prior generation.
- The successor record becomes TOTAL over the override's domain, closing the one case it could not
  express (D-rc04c-1), so "strict widening" is true rather than nearly true.
- The coexistence guard is removed together with the field it braced, and the assertion worth
  keeping survives as a NARROWING of that guard's own test rather than as a new file (D-rc04c-7).
- Prose that argued for coexistence is swept in the same change, not left standing.

**Non-Goals:**

- **The vocabulary reframe.** The charter declares it a NON-GOAL and `explore.md` D-rc04c-5 draws
  the operative line: name the successor correctly in text this stage is ALREADY writing; hunt
  nowhere else. No sweep of the fingerprint, audit-drift or PR seams. Q-crc-23's scope call is not
  prejudged.
- **Migrating archived trails.** No rewrite, no backfill. Prior-generation emits stay as written.
- **Re-litigating the split or the ordering** — settled in D-rc04c-4 and delivered by rc04d.

## Decisions

### D1 — the `formed_against` check SPLITS across two engine sites, because only one can see the trail

Transcribed from `explore.md` D-rc04c-1, which executed the procedure rather than sketching it
(R-crc-7). `validateJudgements` is STRUCTURAL and has no trail access; the emptiness exemption is
conditional on TRAIL STATE, which only `judgementOrderingCheck` at the write gate can see.

| check | lives in | rule |
|---|---|---|
| `formed_against` is an array of strings | `validateJudgements` | unchanged |
| non-empty required | `validateJudgements` | RELAXED: exempt `continuation`/`proceed` only |
| empty is TRUTHFUL | `judgementOrderingCheck` | NEW: empty refused if any independent pass precedes the emit token |
| every cited token resolves + precedes | `judgementOrderingCheck` | unchanged |

The exemption is scoped to `continuation`/`proceed` deliberately. `continuation`/`spend` buys a
pass past a gate that HAS passed, so passes necessarily exist. `readiness` asserts a belief formed
knowing what came back; with nothing back there is no readiness judgement to record, and an empty
citation there would be the uncheckable hole rc04a's design refused.

Both functions were re-verified present before this design named them: `validateJudgements:533`,
`judgementOrderingCheck:958`.

### D2 — the guarantee after the guard is a TEST, and it replaces the guard's own test

From `explore.md` D-rc04c-7. The coexistence refusal is the only executable proof the two records
agree AND the field's only reader, so it cannot outlive the retirement. The question dissolves
rather than being solved: the guard held the invariant while two records described one fact, and
after the overlap there is ONE record, which cannot disagree with anything.

What survives is narrower and still has teeth — an assertion that `continuation/proceed` carries
all three gate facts, so losing the legacy SHAPE does not quietly become losing the FIELDS. It
lands as a narrowing of `judgement-record-fixture.test.ts`, the test that exists to exercise the
pairing, so the retirement reads as a test losing the half that became meaningless and keeping the
half that did not.

### D3 — the four red tests are FOUR kinds of break, and the stage is sized accordingly

From `explore.md` D-rc04c-6, **corrected 2026-09-22 by the fresh proposal pass.** The original
classification named three kinds and is superseded; the correction is recorded rather than absorbed,
because HOW it was missed is the instructive part. D-rc04c-6 was built by reading each site a grep
surfaced — but it read one site per FILE, and `emit-composition.test.ts` carries five. The
generalisable lesson it already stated ("a grep finds every mention, and a mention is not a
dependency") has a twin it did not: a grep finds every FILE, and one site is not the file.

The four kinds: SEMANTIC updates (`orbit-content-fidelity` body pins; `emit-schema-parity:167`;
`emit-composition:169` and `:187`), FIXTURE-ONLY swaps (`emit-schema-parity:219` and
`emit-composition:1235` — neither tests the field; both merely use it), DELETION
(`emit-composition:1178` and `:1259-1281`, which exercise the guard D2 removes and assert its error
text by regex — updatable by nobody, since the thing they test is gone), and one test NARROWED in
place (3.5, per D2).

**The DELETION kind matters beyond counting.** `emit-composition.test.ts:1254` carries a comment
recording that a prior external review caught the first coexistence implementation comparing only
ONE of the three gate fields. Those cases are an earned regression, and they die with the guard.
Deleting them is correct, but the lesson should not die with them — 3.5's narrowed assertion
becomes the only remaining check that all three facts travel together, which raises its importance
above "a test losing half its body".

The fixture case is worth stating because it would otherwise inflate the stage:
`emit-schema-parity:219` does not test `gate_overridden` at all — it filters the field out of the
payload table to prove the parity check NOTICES a documented-but-missing key. It needs a new
victim, not a fix. `fingerprint_overridden` qualifies, verified rather than assumed: absent from
the test's `ENGINE_OWNED` list, with no per-command additions for `archive`, documented among the
archive reference's conditional fields, and live in the payload table at `emit-composition.ts:184`.

### D4 — the blind pair runs AFTER the engine work lands, not before

Settled under R-crc-3 (method), recorded here because Q-crc-20 makes the timing consequential and
the cost of deciding it afterwards is high.

Q-crc-20 observes that a gate can compute PASSED over mechanism no independent pass has read,
because freshness keys on APPLY tokens and a walk's commits are not an apply. rc04d's cadence gave
that question its sharpest instance — its walk DELETED the very sentence the blind pair had
reviewed — and rc04d was a prose-only stage. THIS stage touches the engine, three bodies and four
test files, so the same gap is wider here by construction.

Running the pair early, against artifacts alone, would buy a clean review of a design and tell us
nothing about the engine change that is the actual risk. Running it after apply means the pair
reads the tree that will ship. The cost is that findings arrive when the code exists and repairs
are more expensive — accepted, because R-crc-11 says this program optimises for ALIGNMENT, not
cycle cost, and a pair that read the wrong tree is a cost with no alignment purchased at all.

**Consequence to hold at the seam**: if the walk resolving those findings AUTHORS engine mechanism
rather than repairing it, the pair's verdict no longer covers the shipped tree, and R-crc-6's
lanes are the vocabulary for saying so. That is a RECORD at archive (Q-crc-20's own standing
recommendation), not a gate.

### D5 — the retirement is a payload-key removal, and needs no deprecation path

A payload carrying `gate_overridden` after this change is refused by the write gate as an unknown
key. That is the ordinary treatment of a retired field and requires no special-casing: the emit
surface already fails loudly on unknown payload keys, so the retirement inherits an error path
rather than inventing one. No grace period, no warn-then-refuse — orbit is single-user and
single-session, the bodies that compose payloads ship in the same commit as the table that rejects
them, and a deprecation window would be a mechanism guarding against a version skew that cannot
occur here.

## Risks / Trade-offs

- **The widening becomes unfalsifiable the moment the guard goes.** Accepted and stated rather than
  solved (D2). The honest limit: after this change, nothing executable compares the two records,
  because there is only one. What replaces the guard is a completeness assertion, not an agreement
  assertion, and the difference is recorded so a later reader does not mistake the absence for an
  oversight.
- **D1 amends `formed_against`'s contract, shipped days earlier through a blind pair.** Recorded in
  `explore.md` as an honest cost. It is ordinary stage work on a capability rather than a reversal
  of a ruling, but it is the second move for the same field in a short window, and a third would
  deserve a harder look at whether the contract was right.
- **Descope residue is the likeliest defect class here** (R-crc-6's corollary, earned on rc04d).
  Removing the guard invalidates prose that argued for coexistence. `orbit-run-summary-emit`'s
  "until `gate_overridden` is retired" paragraph is the known instance and is in scope; the
  corollary's practical form — grep the change's own artifacts for the removed thing's vocabulary
  before closing a finding — applies to this stage's walk.
- **Retiring a field whose archived instances remain readable means two generations coexist on
  disk.** This is already the repo's normal condition (rc02c's clause-(c) vocabulary, D4-generation
  emits) and the trail readers handle it; the risk is that a future reader treats an archived
  `gate_overridden` as a live contract. Mitigated by the specs saying explicitly that it is a prior
  generation.

## Alternatives considered

- **Accept the silence in the no-citable-pass case** (option A, 2026-09-21) — retire the field and
  let the trail say nothing when an override has no evidence to cite. Defensible and cheaper, and
  it turns on a real question: proceeding when nothing came back is arguably not a judgement
  *formed against independent review output* at all. Rejected because the recorded REASON is
  provably unreconstructible — four archived emits carry clause-(c) vocabulary `rc02c` retired — so
  the silence would lose something the engine cannot recover.
- **Allow an empty `formed_against` unconditionally on `proceed`** (option B, 2026-09-21) — one
  record, wider domain, no trail check. Rejected: the ordering check would have nothing to check,
  which is exactly the uncheckable record rc04a's design was built to refuse. D1 keeps the widening
  AND the check by making the emptiness itself the verified thing.
- **Keep `gate_overridden` narrowly for the evidence-free case** (option D, 2026-09-21) — two
  records for one fact, just rarer. Rejected: that is the defect the stage exists to remove.
- **Split rc04c by SEAM** — apply-seam half, archive-seam half (2026-09-21). Rejected:
  `orbit-emit-composition` and `orbit-engine-gates` straddle both seams, so neither half is
  self-contained and the capability count does not drop.
- **A deprecation window on the payload key** (considered at design time, 2026-09-22) — accept
  `gate_overridden` with a warning for one release before refusing. Rejected per D5: it guards
  against a version skew that cannot occur in a single-user, single-session tool where the composing
  bodies and the rejecting table ship together.

## Touchpoints

- `orbit/specs/orbit-run-summary-emit/spec.md` + `orbit/specs/orbit-archive-modifications/spec.md` + `orbit/specs/orbit-emit-composition/spec.md` — the three baselines, via delta authoring.
- `orbit/changes/rc04c-retire-gate-overridden/specs/` — three delta specs, 10 MODIFIED requirements.
- `src/core/emit-composition.ts` — payload tables, the coexistence guard's removal, and `judgementOrderingCheck`'s new emptiness-truthfulness rule.
- `src/core/templates/workflows/apply-change.ts` + `src/core/templates/workflows/archive-change.ts` + `src/core/templates/workflows/pr-choreography.ts` — the three bodies that compose the field.
- `test/core/emit-composition.test.ts` + `test/core/emit-schema-parity.test.ts` — semantic updates plus the fixture-victim swap.
- `test/core/judgement-record-fixture.test.ts` — narrowed in place to the three-facts assertion.
- `test/core/templates/orbit-content-fidelity.test.ts` — the body pins retire with the bodies.
