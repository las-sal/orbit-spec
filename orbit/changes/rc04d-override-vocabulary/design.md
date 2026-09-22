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
- `orbit-engine-gates` stops being a second voice on the override record's SHAPE; ownership moves
  to the emitting command's own capability — `orbit-run-summary-emit` for the apply emit,
  `orbit-archive-modifications` for the archive emit. BOTH owners are named, because the
  requirement is gate-generic and its own first scenario is the archive case.
- `gate_overridden`'s footprint in `orbit/specs/` drops from six capabilities to three, leaving
  `rc04c` a stage that fits under R-crc-1 rather than one at twice the ceiling.

**Non-Goals:**

- **Retiring the field.** That is `rc04c`, which declares `Depends-on` this stage.
- **Touching `src/`.** No engine change, no workflow-body change. The bodies keep naming the field
  because they describe what is written today.
- **Touching `test/`.** The two `orbit-content-fidelity` pins on `gate_overridden` are rc04c's to
  update when the bodies stop writing it.
- **Re-litigating the split, the ordering, or `D-rc04c-1`'s totality rule** — settled in the
  architect session and in `rc04c`'s exploration respectively.

## Decisions

### D1 — the four passing mentions become plain substitutions

Sites 1, 3, 4a, 4b and 5 name the field while asserting something about the OVERRIDE, not about
the record's shape. Each becomes "the override" / "the override record" / "a recorded
proceed-anyway override". Nothing else in those requirements moves. The verbatim table is
`explore.md` D-rc04d-2 — transcribe it; do not re-derive the wording.

### D2 — site 2 moves OWNERSHIP, and this is the stage's one substantive edit

`orbit-engine-gates`' `Inflection-prompt override contract` currently reads
"…recorded in the command's run summary (`gate_overridden: {gate, state, reason}`)". That restates
a shape another capability owns (`orbit-run-summary-emit` for the apply emit,
`orbit-archive-modifications` for the archive one), which is the one-voice-for-facts defect `rc07` was built
around — sitting inside the requirement this stage is editing anyway. The replacement states THAT
the override is recorded and WHAT it must carry (gate, state, reason AT DECISION TIME), then names
the EMITTING COMMAND'S OWN CAPABILITY as the shape's owner — `orbit-run-summary-emit` for the
apply emit, `orbit-archive-modifications` for the archive emit — and says explicitly that this
requirement never names the field carrying it.

**The two-owner form is a CORRECTION made during the proposal cadence, not the original design.**
The first version named `orbit-run-summary-emit` alone. That capability's Purpose scopes it to
WORKFLOW commands and its `gate_overridden` entry sits inside `Apply per-chunk-end emission`,
naming `apply-<TS>.json`; the ARCHIVE record's shape is stated in `orbit-archive-modifications`.
The requirement being edited is GATE-GENERIC and its own first scenario is the archive case, so
the single-owner pointer was wrong for half its domain — it would have replaced one
cross-capability voice problem with another. The two-owner sentence mirrors an existing precedent
one requirement away in the file it targets (`orbit-run-summary-emit`:567, the consent field).

That final clause is true today AND after `rc04c`, which is the entire reason the ownership moves
now: a pure substitution would leave `orbit-engine-gates` quietly authoritative about another
capability's record, and `rc04c` would have to return to a capability this stage was supposed to
finish with — defeating the point of splitting on capability boundaries.

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

## Risks / Trade-offs

- **A de-named form could be subtly less precise than the field name it replaced.** Mitigated by
  transcribing D-rc04d-2's table rather than re-wording at authoring time, and by the proposal
  review cadence reading the five replacements against their originals.
- **Site 2's extra clause is scope beyond substitution.** Accepted deliberately: it lands inside a
  requirement already being edited, in a capability already in scope, and `explore.md` records the
  counter-argument (that "fix the one-voice defect while you're in there" is how a three-capability
  stage becomes a five-capability one). The judgement is that it does not widen the stage here.
- **The interim state has bodies naming a field their specs do not.** Accepted and verified
  invisible to every instrument in the repo (D3). The alternative ordering — retire first — has
  the strictly worse interim, where three specs REQUIRE a record the emit layer refuses.
- **`rc04c` inherits two red pins.** Not a risk of this stage but a consequence recorded here so
  that stage plans for it: `orbit-content-fidelity`'s `apply-change` and `archive-change` entries
  go red the moment the bodies stop writing the field. That is a pin doing its job.

## Alternatives considered

- **Minimal de-naming at site 2** — RAISED AND REJECTED TWICE, which is why it is worth reading
  carefully. First at exploration (2026-09-21, `explore.md` Q-rc04d-a) on the grounds below.
  Then AGAIN during the proposal walk (2026-09-22), after the fresh pass's CRITICAL showed the
  ownership move was harder than it had been presented: the option there was to retreat to a plain
  substitution, make all five sites uniform, and leave the one-voice defect for rc04c. Rejected a
  second time, on a different argument from the first — retreating would forfeit the reason the
  move was ratified (stopping rc04c returning to a capability this stage had finished with), and
  the correct two-owner form turned out to be one clause with an existing precedent rather than
  new design. The honest counter, recorded because it is reasonable: a "pure vocabulary" stage
  that keeps growing judgement is evidence it should have stayed vocabulary. The original
  exploration-time reasoning follows. Substitute the
  phrase and leave the shape restatement in place. Cheaper and mechanically uniform across all
  five sites, but it leaves `orbit-engine-gates` silently authoritative about a record belonging to
  another capability, and forces `rc04c` back into a capability this stage had finished with.
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
