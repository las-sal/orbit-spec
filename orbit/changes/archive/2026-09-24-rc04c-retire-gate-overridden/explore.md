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
record adds nothing. **That is false, and the trail proves it.** TEN archived apply emits across FOUR changes record
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
  **SUPERSEDED BY EVENTS 2026-09-22 — the figures above are the PRE-SPLIT measurement and are kept
  because they are what triggered R-crc-9.** rc04d shipped and archived the same day, taking 5
  requirements across 3 capabilities. Re-measured against the post-sync tree, THIS stage's actual
  footprint is **3 capabilities / 9 requirements** — `orbit-run-summary-emit` 4,
  `orbit-archive-modifications` 4, `orbit-emit-composition` 1 — which is AT the ceiling, exactly
  what the split was for. Also measured and NOT in the original figures: 3 workflow templates
  (`apply-change` 3 occurrences, `archive-change` 9, `pr-choreography` 1), the engine
  (`emit-composition.ts`, 7), and FOUR test files.
  **SUPERSEDED AGAIN 2026-09-22, by the proposal walk rather than by events: the requirement count
  is TEN, not nine.** The fresh proposal pass found that the emptiness rule this stage adds to
  `judgementOrderingCheck` sits under `orbit-emit-composition`'s `Write-gate validation via the
  shared normalizers`, whose prose forbids the engine judging "whether enough of them were cited" —
  so shipping the rule without touching that requirement would leave two live baselines disagreeing
  about what the write gate may do. It is now a tenth MODIFIED requirement carrying the refusal as a
  named well-formedness edge. CAPABILITIES are unchanged at three, so R-crc-1's binding dimension
  still holds and the stage stays AT the ceiling. Every "9 requirements" below is the pre-walk
  figure; the artifacts carry the current one.
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

  **EXECUTED 2026-09-22 by `rc04d-override-vocabulary`, and the `orbit-engine-gates` row above did
  NOT ship as written — read the shipped delta, not this row.** The row's de-named form
  ("shape owned by `orbit-run-summary-emit`") was refuted TWICE during rc04d's cadence: a fresh
  proposal pass showed it wrong for the ARCHIVE emit, and the external system pass showed the
  two-owner replacement ALSO wrong, since it would be true today and false after THIS stage. The
  shipped text names NO shape owner at all, under R-crc-13 — a gate REPORTS, an emit RECORDS, so
  shape was never that capability's to adjudicate. The `orbit-pr-lifecycle` row additionally
  gained a qualifier it does not show here ("at the `review-system` gate"), because the unqualified
  form widened a normative SHALL across both archive-seam overrides. AUTHORITY for all five
  replacements is the archived delta at
  `orbit/changes/archive/2026-09-22-rc04d-override-vocabulary/specs/`, never this table.

  Every de-named form is TRUE BEFORE AND AFTER the retirement. That is the property that matters:
  done first, there is never a moment where a spec normatively requires a field nothing writes.
  Done in the other order — retire the field, then clean up the references — the interim state has
  three capabilities demanding a record the emit layer refuses. Same total work, one ordering has
  an incoherent middle and the other does not.

- **2026-09-21 — D-rc04c-4: the split is RATIFIED and DECLARED — `rc04d-override-vocabulary`
  precedes `rc04c-retire-gate-overridden`.** (Sal, settling Q-rc04c-c; declared in
  `clean-up-review-cycle.md` in the same session, which is where stage declarations live.)

  Two stages of three capabilities each, both AT the ceiling rather than one at double.
  `rc04d` carries `Depends-on: (none)` and the pure de-naming of `orbit-engine-gates`,
  `orbit-pr-lifecycle` and `orbit-conventions` (5 requirements, no `src/` change — its exit (2)
  makes that falsifiable by requiring a green suite with no `src/` in the stage's diff). `rc04c`
  gains `Depends-on: rc04a-judgement-record, rc04d-override-vocabulary` and keeps the retirement
  proper: `orbit-emit-composition`, `orbit-run-summary-emit`, `orbit-archive-modifications`
  (9 requirements), the three workflow bodies, D-rc04c-1's totality rule, and the removal of the
  coexistence guard.

  **The naming was decided on evidence.** Nothing declares `Depends-on: rc04c`, but NINETEEN
  immutable records cite it in prose — rc04a's four archived artifacts, eleven of its trail emits
  including the readiness record's own reasoning, two architect emits, and this exploration's own
  directory name, metadata citation and emits — all saying rc04c retires `gate_overridden`.
  Re-lettering the pair to put the sequence in the letters would have made all nineteen false.
  `Depends-on` carries sequence; letters are labels.

  **Open follow-up, deliberately not answered here**: `rc04d` has no exploration and may not need
  one — it is pure vocabulary with its mechanism already worked out in D-rc04c-3's table. Whether
  it goes straight to `/orbit:propose` or gets its own exploration first is a call for whoever
  picks it up.

  **ANSWERED 2026-09-22: it got its own exploration, and needed it.** The "mechanism already
  worked out" premise was the thing that turned out to be wrong — D-rc04c-3's table had a defect
  in the row that mattered (above), and rc04d's cadence spent one fresh proposal pass and one
  external system pass refuting two successive formulations of it before R-crc-13 settled the
  question. A stage whose mechanism is one table is still a stage whose table can be wrong, which
  is R-crc-7 arriving from the other direction: explore produces mechanism, and mechanism
  inherited from a sibling exploration has not been reviewed just because it is written down.

- **2026-09-22 — D-rc04c-5: rc04c NAMES THE SUCCESSOR CORRECTLY IN TEXT IT WRITES, AND HUNTS
  NOWHERE.** (Sal, ratifying the line as stated. Settles a tension the charter's new NON-GOAL
  created the same morning.)

  The charter now declares the vocabulary reframe an explicit NON-GOAL (Q-crc-23: this stage
  retires a FIELD, not a WORD). But rc04c must REWRITE nine requirements that currently describe
  `gate_overridden`, and writing a sentence means choosing a word — so the NON-GOAL, read
  literally, forbids nothing and decides nothing at the only moment it matters.

  Three readings were on the table: (i) keep "override" in the new sentences, faithful to the
  NON-GOAL but knowingly writing nine NEW sentences in a word R-crc-13 says is wrong; (ii) use the
  successor vocabulary, correct but performing the reframe in three capabilities by the back door;
  (iii) describe structurally and name neither.

  **THE RATIFIED LINE.** rc04c MAY name the successor record correctly — `continuation`,
  `proceed` — wherever it is ALREADY WRITING NEW TEXT, because that is not a rename: the stage
  deletes a field and the sentences describing it, then writes sentences about the record that
  replaces it, and that record's own name is `continuation`/`proceed`. Naming a thing by its name
  is accuracy, not editorialising. rc04c MAY NOT go hunting for `override` in text it is not
  otherwise touching — no sweep of the fingerprint guard, audit-drift, or PR seams, and no
  requirement opened solely to change a word.

  **Why the line falls there.** The NON-GOAL's own text already concedes the principle: it says
  retiring the field shrinks the wrong word's footprint as a SIDE EFFECT. A side effect is exactly
  what this is — vocabulary improving where the stage was working anyway, and nowhere else. The
  boundary is therefore not "which word" but "which text", which is observable: a diff either
  touches a requirement or it does not. That makes the NON-GOAL enforceable at review instead of
  arguable, which is what a declared boundary is for.

  **What it protects.** The difference between rc04c touching 9 requirements and rc04c being
  tempted toward ten capabilities — R-crc-9 on sight, and the mis-scoping this program keeps
  recording. Q-crc-23's scope call (whether the residual reframe becomes its own stage) stays open
  and is NOT prejudged by this decision.

- **2026-09-22 — D-rc04c-6: the four red test files are THREE KINDS of break, and naming the kinds
  is what keeps the stage honestly sized.** (Settled under R-crc-3; measured from source, not from
  the inherited inventory.)

  rc04d's D-rc04d-1 handed this stage a list of FOUR test files that go red the moment the bodies
  stop writing `gate_overridden`. The list is correct and the framing is not: treating it as four
  instances of one problem overstates the work and, worse, hides that one entry carries no
  semantic content at all. Enumerated by reading each site:

  | site | kind | what rc04c actually does |
  |---|---|---|
  | `orbit-content-fidelity` (`apply-change`, `archive-change` body markers) | SEMANTIC | the pins assert the BODIES write the field; the bodies stop, so the pins go |
  | `emit-schema-parity.test.ts:167` | SEMANTIC | the field leaves the archive schema table's conditional-field set |
  | `emit-composition.test.ts` | SEMANTIC | asserts `persisted.gate_overridden` on a real archive emit |
  | `emit-schema-parity.test.ts:219` | **FIXTURE ONLY** | does not test the field. It CRIPPLES the payload table by filtering `gate_overridden` out, to prove the parity check notices a documented-but-missing key. Needs a NEW VICTIM (`fingerprint_overridden` qualifies, VERIFIED not assumed: absent from the test's `ENGINE_OWNED` list — `['command','timestamp','change','doc','kind','model','next_recommended','iteration']`, with no per-command additions for `archive` — documented among the archive reference's conditional fields, and live in the payload table at `emit-composition.ts:184`); one line, zero semantic content |
  | `judgement-record-fixture.test.ts` | **DIES WITH THE GUARD** | exists to exercise the coexistence pairing; it is the guard's test and goes when the guard goes — see Q-rc04c-b, where the surviving three-facts assertion should REPLACE its body rather than arrive as a new file |

  **Why this is a decision and not a note.** The two framings produce different stages. "Fix four
  broken test files" reads as four units of retirement work; "three semantic updates, one fixture
  swap, one deletion-with-replacement" is both smaller and true, and it is the version that
  survives a size check honestly. Mis-sizing in the CONSERVATIVE direction is still mis-sizing —
  it is how a stage acquires imaginary weight and gets split, or gets deferred, for work that does
  not exist. R-crc-9 has fired three times in this program on measurements; a measurement that
  corrects DOWNWARD deserves the same standing as one that corrects up.

  **SIZE CHECK, run preventively at exploration and CLEAN — the first one in this program that
  found nothing.** 3 capabilities on the binding dimension against R-crc-1's ceiling of <=3, and 9
  requirements against ~12. D-rc04c-5 does not move it: naming the successor record inside text
  the stage is already rewriting adds no capability. D-rc04c-6 does not move it either — it
  corrects the test inventory DOWNWARD. Recorded because R-crc-9 has now fired three times in this
  program on size checks that found a breach, and a check that reports no breach is evidence about
  the check as much as about the stage; an instrument only ever seen firing is an instrument nobody
  has seen exercise its negative case.

  **The generalisable half, worth carrying past this stage**: a grep for a symbol finds every
  mention, and a mention is not a dependency. `emit-schema-parity:219` names `gate_overridden`
  while depending only on the existence of SOME documented AI-supplied key. Inventories built by
  grep should be read once at the SITE before their counts are believed — which is the same
  instrument lesson this program has now recorded at rc01, rc07, rc04d's exit (2), and here.

- **2026-09-22 — D-rc04c-7: after the overlap there is nothing to disagree with, so the guarantee
  is a TEST, not a mechanism — and it replaces the guard's own test rather than joining it.**
  (Sal, resolving Q-rc04c-b at promotion. The standing recommendation carried unchanged since
  2026-09-21 and was sharpened rather than challenged.)

  The coexistence refusal in `validateJudgements` is the only executable proof that
  `continuation/proceed` and `gate_overridden` agree, and it is also the field's ONLY reader — so
  it cannot outlive the retirement. The question was what guarantees the widening afterwards.

  **The answer is that the question dissolves rather than being solved.** The guard's job was to
  hold the invariant DURING the overlap, while two records described one fact. After the overlap
  there is ONE record, and a single record cannot disagree with anything. Demanding a successor
  mechanism would be building a guard against a contradiction that no longer has two parties.
  This is stated rather than solved DELIBERATELY, and the statement belongs in the change record
  so that a later reader does not mistake the absence of a check for an oversight.

  **What DOES deserve to survive is narrower and concrete**: an assertion that the continuation
  record still carries all three gate facts (`gate`, `gate_state`, `gate_reason`), so that
  retiring the legacy SHAPE does not quietly become a loss of the FIELDS. That is a different
  claim from the coexistence claim — it is about completeness of one record, not agreement
  between two — and it is the half that still has teeth once the field is gone.

  **It REPLACES `judgement-record-fixture.test.ts`'s body rather than arriving as a new file.**
  That test exists to exercise the coexistence pairing (D-rc04c-6 classifies it as the one test
  that dies with the guard), so narrowing it in place makes the retirement read as what it is — a
  test losing the half that became meaningless and keeping the half that did not. A deletion plus
  an unrelated new file would tell the same story worse.

  **R-crc-6's DESCOPE SWEEP COROLLARY applies and names a specific victim.** Removing the guard is
  descope-shaped: cheap for the MECHANISM and expensive for the ARTIFACTS, because every sentence
  arguing for coexistence goes wrong the moment the guard leaves. `orbit-run-summary-emit` spends
  a paragraph on the two records coexisting *"until `gate_overridden` is retired"* — prose a
  mechanism-only diff leaves standing. It is in this stage's scope and is swept here.

## Open questions

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
  Verified still present 2026-09-22, with `validateJudgements:533` and `judgementOrderingCheck:958`
  both live as D-rc04c-1's mechanism table names them.
- `orbit/changes/archive/2026-09-22-rc04d-override-vocabulary/` — the PRECEDING stage, archived and
  ratified. Its `specs/` holds the AUTHORITATIVE shipped wording for all five de-namings
  (D-rc04c-3's table is superseded); its `explore.md` D-rc04d-1 carries the four-test-file
  inventory this stage inherits; its `tasks.md` 3.1-3.4 are the handoff records written FOR this
  stage, including task 3.3, which points here and was itself corrected when it briefly pointed at
  a refuted formulation.
- `orbit/architecture/clean-up-review-cycle.md` — rc04c's charter, now carrying the explicit
  **NON-GOAL** (the vocabulary reframe is not this stage's; see D-rc04c-5 for the line as ratified)
  and, in the rulings index, R-crc-13, R-crc-6's DESCOPE SWEEP COROLLARY and R-crc-12's THIRD CASE
  — all three recorded during rc04d's cadence and all three operative here.
- `orbit/explore/rc04c-retire-gate-overridden/explore.md:100` — **this file's own D-rc04c-3 table**,
  flagged by rc04d's tasks 3.3 as carrying a superseded row and deliberately left unedited then
  (cascade scope is the current change). Corrected in place 2026-09-22.
- `orbit/specs/orbit-engine-gates/spec.md:112` — "Gate state is a pure function of existing
  on-disk artifacts", the claim that makes the redundancy argument tempting and the retired
  vocabulary that defeats it.
