# Design: rc04d-override-vocabulary

## Context

Split from `rc04c-retire-gate-overridden` on 2026-09-21 under R-crc-9 — the program's THIRD
preventive application, and the first caught by a size check run at exploration before anything was
proposed. Two decisions were taken in `explore.md`, zero open questions remain, and this design
CITES rather than invents: D-rc04d-2 carries all five replacements verbatim as a table, so the
delta specs transcribe them rather than paraphrase.

`gate_overridden` spans six baseline capabilities across fourteen requirements. Three of those
capabilities name it only while stating that an override is RECORDED, and de-named, their
sentences are true both before and after `rc04c` removes the field. That property is not a
convenience — it is what makes the two stages orderable at all (see `explore.md` Premise).

## Goals / Non-Goals

**Goals:**

- Five requirement texts across three capabilities stop naming `gate_overridden`, while remaining
  true of the engine exactly as it stands today.
- `orbit-engine-gates` stops being a second voice on the override record's SHAPE — by NAMING NO
  SHAPE OWNER, not by redirecting to a different one. It keeps what is genuinely its own: WHICH
  FACTS ABOUT THE GATE a joint decision must preserve. (Precise, because the looser reading has
  already cost this stage two formulations: the shipped text does say the field and its shape
  "belong to the emit layer" — a DIRECTION, so the sentence is readable rather than leaving a
  reader unsure the facts are recorded anywhere at all. What it never does is name the capability,
  which is the claim R-crc-13 puts outside this capability's standing.)
- `gate_overridden`'s footprint in `orbit/specs/` drops from six capabilities to three, leaving
  `rc04c` a stage that fits under R-crc-1 rather than one at twice the ceiling.

**Non-Goals:**

- **Retiring the field.** That is `rc04c`, which declares `Depends-on` this stage.
- **Touching `src/`.** No engine change, no workflow-body change. The bodies keep naming the field
  because they describe what is written today.
- **Touching `test/`.** The FOUR test files pinning `gate_overridden` (`orbit-content-fidelity`,
  `emit-schema-parity`, `emit-composition`, `judgement-record-fixture` — inventory in tasks 3.1)
  are rc04c's to update when the bodies stop writing it.
- **Re-litigating the split, the ordering, or `D-rc04c-1`'s totality rule** — settled in the
  architect session and in `rc04c`'s exploration respectively.

## Decisions

### D1 — three passing mentions are plain substitutions; pr-lifecycle gains a gate qualifier

Sites 1, 3, 4a, 4b and 5 name the field while asserting something about the OVERRIDE, not about
the record's shape. Site 4a is NOT a plain substitution and the walk corrected it: the
unqualified form widened a normative SHALL across both archive-seam proceed-anyway overrides,
so the shipped text reads "at the `review-system` gate". `explore.md` D-rc04d-2 row 4a records it. Each becomes "the override" / "the override record" / "a recorded
proceed-anyway override". Nothing else in those requirements moves. The verbatim table is
`explore.md` D-rc04d-2 — transcribe it; do not re-derive the wording.

### D2 — site 2 STOPS RESTATING THE RECORD'S SHAPE (R-crc-13: a gate reports, an emit records), and this is the stage's one substantive edit

`orbit-engine-gates`' `Inflection-prompt override contract` currently reads
"…recorded in the command's run summary (`gate_overridden: {gate, state, reason}`)". That restates
a shape this capability does not own — which is the one-voice-for-facts defect `rc07` was built
around, sitting inside the requirement this stage is editing anyway. WHICH capability owns it is
deliberately not answered here: the two attempts to answer it are recorded below as the reversal,
and R-crc-13 is why the question is not this stage's. The replacement states THAT
the override is recorded and WHAT it must carry (gate, state, reason AT DECISION TIME), then names
NO OWNER of the record's shape. It keeps only what the gate capability genuinely owns: THAT the
override is recorded, and WHICH FACTS ABOUT THE GATE must survive the decision.

**This is a REVERSAL of the ownership move originally ratified for this site, and it is recorded as
one rather than filed as a wording fix.** The move was approved on the argument that naming a shape
owner would stop `rc04c` returning to a capability this stage had finished with. That argument was
wrong — not because the goal was bad, but because the ownership question was never rc04d's to
settle. Two independent reviewers refuted two successive formulations: a fresh proposal pass showed
the single-owner form false for the ARCHIVE emit, and the external system pass showed the two-owner
replacement ALSO false, because `orbit-archive-modifications`:63 says the successor record's
"shape and carrier [are] both defined by `orbit-run-summary-emit`" — so the clause was true today
and false after `rc04c`, which is exactly the invariance it existed to provide.

**R-crc-13 (2026-09-22) supplies the principled line the evidence only gestured at.** A gate
REPORTS; it never RULES; an emit RECORDS. That splits ownership along the boundary this
requirement already sits on: `orbit-engine-gates` owns what the GATE does and which facts about
ITSELF a joint decision must preserve; the emit layer owns the shape those facts take on disk. So
the surviving clause is not a tolerated leftover — it is precisely the gate capability's business,
and the deleted sentence was precisely not. The one-voice defect is still fixed, by REMOVAL rather
than redirection: the baseline's sin was restating `{gate, state, reason}` as a shape, and an
obligation is not a shape.

The abstract-ownership alternative (state the obligation/shape distinction without naming
capabilities) was considered and rejected: under R-crc-13 this capability has no standing to
adjudicate shape ownership at all, so being vaguer about a claim it should not make is not an
improvement.

**What the surviving text must clear, and why removal is the only form that clears it.** Every
right-hand form in this stage has to be true of the engine TODAY; site 2 alone also has to be true
AFTER `rc04c`, because a requirement that outlives the field must not describe it. That second bar
is what both superseded formulations failed — each named an owner whose claim `rc04c` invalidates —
and it is what removal passes trivially: a requirement that says nothing about the field cannot be
falsified by the field's retirement. The one-voice defect is fixed in the same stroke, since the
baseline's sin was restating `{gate, state, reason}` as a shape, and an obligation is not a shape.

### D3 — the bodies stay untouched, and that is verified rather than assumed

`pr-choreography.ts:388` and the apply/archive bodies keep naming `gate_overridden`. A body naming
a field whose spec now describes it generically is not drift — the body describes what is written
TODAY. D-rc04d-1 confirmed by measurement that nothing couples the two:
`test/core/templates/orbit-content-fidelity.test.ts` pins the BODIES and reads zero spec files
(`grep -c "orbit/specs" → 0`), and the only tests that read `orbit/specs/` at all —
`sources-registry` and `source-lint` — count capabilities rather than read prose.

### D4 — exit (2) is the mechanism, not a formality

"No `src/` change anywhere in the stage's diff, suite green" converts *"this is pure vocabulary"*
from an assertion a reviewer must take on trust into something the stage can FAIL. It is checked
by looking at the diff, which is why it is stated as an exit criterion rather than a design
aspiration.

**The check must be PATH-SCOPED to the change's own commits, and tasks 2.2 was corrected to say
so.** A bare `git diff` measures the working tree, not the change; on a tree carrying concurrent
work it answers a question nobody asked and the criterion stops being falsifiable. The scoping is
legitimate mechanism because commit membership is observable (R-crc-12); attributing an individual
edit to a workstream is not, so that half is a RECORD at archive rather than a check.

## Risks / Trade-offs

- **A de-named form could be subtly less precise than the field name it replaced.** Mitigated by
  transcribing D-rc04d-2's table rather than re-wording at authoring time, and by the proposal
  review cadence reading the five replacements against their originals.
- **Site 2's edit is scope beyond substitution.** Accepted deliberately: it lands inside a
  requirement already being edited, in a capability already in scope, and `explore.md` records the
  counter-argument (that "fix the one-voice defect while you're in there" is how a three-capability
  stage becomes a five-capability one). The judgement is that it does not widen the stage here.
  NOTE the shipped edit is a net REMOVAL — the shape restatement deleted, replaced by one sentence
  scoping what the requirement does and does not claim. The "extra clause" framing described the
  ownership move that was reversed, and a reader sizing `rc04c`'s inherited scope should not carry
  it forward.
- **The interim state has bodies naming a field their specs do not.** Accepted and verified
  invisible to every instrument in the repo (D3). The alternative ordering — retire first — has
  the strictly worse interim, where three specs REQUIRE a record the emit layer refuses.
- **`rc04c` inherits red pins across FOUR test files, not two.** Not a risk of this stage but a consequence recorded here so
  that stage plans for it: `orbit-content-fidelity`'s `apply-change` and `archive-change` entries
  go red the moment the bodies stop writing the field — and so do `emit-schema-parity` (both the
  archive-table regression and the negative test asserting `rejected` equals exactly
  `['gate_overridden']`), `emit-composition` (asserts `persisted.gate_overridden` on a real
  archive emit), and `judgement-record-fixture` (composes a continuation alongside the legacy
  object). Four files. The undercount had a cause worth naming: D-rc04d-1's measurement asked
  whether anything couples SPEC wording to BODY wording, and the handoff claim built on it is
  about what rc04c BREAKS — a different question the grep never measured. Those are pins doing
  their job.

## Alternatives considered

- **Minimal de-naming at site 2** — RAISED AND REJECTED TWICE, which is why it is worth reading
  carefully. First at exploration (2026-09-21, `explore.md` Q-rc04d-a) on the grounds below.
  Then AGAIN during the proposal walk (2026-09-22), after the fresh pass's CRITICAL showed the
  ownership move was harder than it had been presented: the option there was to retreat to a plain
  substitution, make all five sites uniform, and leave the one-voice defect for rc04c. Rejected a
  second time, on the argument that retreating would forfeit the reason the move was ratified
  (stopping rc04c returning to a capability this stage had finished with) while the two-owner
  replacement looked like one clause with an existing precedent rather than new design.
  **BOTH halves of that second rejection have since failed** — the external system pass showed the
  two-owner form false after `rc04c`, and D2 records that the ratified reason was never rc04d's
  question to settle. The honest counter, recorded at the time because it was reasonable, reads as
  the correct call in hindsight: a "pure vocabulary" stage that keeps growing judgement is evidence
  it should have stayed vocabulary.

  **What was NOT adopted, stated precisely, because the shipped form resembles this alternative and
  is not it.** Minimal de-naming means: substitute the phrase and LEAVE THE SHAPE RESTATEMENT IN
  PLACE. Cheaper and mechanically uniform across all five sites, but `orbit-engine-gates` stays a
  second voice on a record it does not own, and the defect simply moves to `rc04c`. The shipped
  form DELETES the restatement and names no owner — closer to this alternative than to the
  ownership move, but distinct from both, and it is the only one of the three that is true after
  `rc04c`. Rejecting minimal de-naming twice and then shipping removal is not a reversal of this
  entry; it is a third position neither rejection had on the table.
- **One six-capability `rc04c`** (rejected 2026-09-21, architect session): keep the retirement
  whole and record a deliberate 2x ceiling breach. R-crc-9 permits a ratified breach but the
  program has never taken one, and rc02's six-pass proposal cadence is what an oversized stage
  cost last time.
- **Splitting `rc04c` by SEAM** — apply versus archive (rejected 2026-09-21, `rc04c`'s
  `explore.md`): `orbit-emit-composition` and `orbit-engine-gates` straddle both seams, so neither
  half is self-contained and the capability count does not actually drop.
- **Re-lettering the pair** so sequence lives in the letters (rejected 2026-09-21, architect
  session): nineteen immutable records cite `rc04c` as the stage that retires `gate_overridden`,
  including rc04a's readiness record. `Depends-on` carries sequence; letters are labels.

## Touchpoints

- `orbit/specs/orbit-engine-gates/spec.md` + `orbit/specs/orbit-pr-lifecycle/spec.md` + `orbit/specs/orbit-conventions/spec.md` — the three baselines, via delta authoring rather than direct edits.
- `orbit/changes/rc04d-override-vocabulary/specs/` — the three delta specs; five MODIFIED requirements.
