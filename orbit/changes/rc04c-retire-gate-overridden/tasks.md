## 1. The engine (part 1 — the checks)

**THE ORDER IS NORMATIVE AND IT CLOSES A WINDOW IN BOTH DIRECTIONS.** Run
`1.1, 1.2 → section 2 → 2.5a, 2.5b`. There are TWO hazards, not one, and they point opposite ways:

- **Forward**: the ordering check must ACCEPT a legal empty `formed_against` BEFORE the bodies start
  relying on it, or an emit composed by an updated body is refused by a stale engine.
- **BACKWARD, and the likelier of the two**: `validatePayload` refuses unknown payload keys OUTRIGHT
  (`src/core/emit-composition.ts:471-472`). If 2.5b removes `gate_overridden` from the payload tables
  while the INSTALLED bodies still instruct composing it, every apply and archive emit in that
  window is refused ENTIRELY — not degraded, refused. So the table must keep accepting the legacy
  key until nothing composes it, which puts the removals (2.5a/2.5b) AFTER section 2.

This is not hypothetical for this repository: the archive table's own comment at
`emit-composition.ts:179-181` records that omitting these conditional fields "made the fail-loud
gate reject the first proceed-anyway archive routed through the surface". It is not hypothetical for
THIS change either — `review-proposal` is unpassed as this is written, so a proceed-anyway apply
runs the OLD installed body, and the surface is not refreshed until 2.4.

The backward hazard was found by the fresh proposal pass; the original preamble named only the
forward one and then ordered the work by it, which is how a rationale that is true ends up
justifying the wrong sequence.

- [ ] 1.1 `src/core/emit-composition.ts` — `validateJudgements` (`:533`): RELAX the non-empty
  `formed_against` requirement for `kind: "continuation"` + `disposition: "proceed"` ONLY. Every
  other kind/disposition keeps the unconditional refusal. The array-of-strings check is unchanged.
  Per `design.md` D1's table — the split exists because this function is STRUCTURAL and has no
  trail access. **While in this function**, reword the error message five lines above the check
  (`:588`): `"'<req>' is required on a continuation/proceed — it carries what gate_overridden
  carried."` names the field this stage retires, and after 2.5b it would point a user at a key the
  same engine refuses as unknown. Replace that clause with what the record carries in its own terms
  (the gate facts at decision time). This is the retired FIELD NAME, not the `override` word — the
  charter NON-GOAL is untouched.
- [ ] 1.2 `src/core/emit-composition.ts` — `judgementOrderingCheck` (`:958`): ADD the
  emptiness-truthfulness rule. An empty `formed_against` on `continuation`/`proceed` is REFUSED,
  NAMING the LATEST preceding independent pass, when any independent pass (`reviewer_class` `fresh`
  or `external`, any mode) precedes this emit's own token; accepted when none does. "LATEST" is
  stated because the ordinary case has SEVERAL preceding passes and two implementers would
  otherwise split between naming one and naming all; it also matches how the rest of the check
  reports a single offending token. This is the
  half that needs trail access, which is why it lives here and not in 1.1.
## 2. The workflow bodies

Three bodies, verified by enumeration at exploration (NOT four — the charter's original claim was
off by one; `emit-composition.ts` is the engine and `bulk-archive-change.ts` never mentions it).

- [ ] 2.1 `src/core/templates/workflows/archive-change.ts` (9 occurrences) — Step 3.4 stops
  composing `gate_overridden` and composes only the `continuation`/`proceed` entry. The archive
  schema reference it ships must lose the field too, or `emit-schema-parity` fails on the mismatch.
- [ ] 2.1a **THE OMIT BRANCH — without this the stage ships its own headline claim contradicted.**
  `archive-change.ts:287` currently instructs: *"If the trail carries NO independent pass earlier
  than this emit, OMIT the entry and let `gate_overridden` stand alone: `formed_against` must be
  non-empty, so a record cannot be written here."* Replace it with the write rule: the entry IS
  written, carrying `formed_against: []`, precisely when no independent pass precedes this emit.
  Left standing, this instruction produces NO record in exactly the case this stage exists to close
  — and names a field the same section retires. The archive delta makes the write NORMATIVE
  (`specs/orbit-archive-modifications/spec.md`, the edge-that-now-can-be-written requirement), so
  body and spec would otherwise disagree on the stage's central claim.
- [ ] 2.1b The shipped `archive-summary-schema.md` reference (composed in `archive-change.ts:97`)
  carries the `judgements` field note an AI READS while composing an archive emit. Restate
  `formed_against` there as non-empty EXCEPT on `continuation`/`proceed`, where an empty array is
  legal exactly when the emptiness is true of the trail. A reference that still says
  unconditionally non-empty teaches the composing AI to omit the entry, which is the same defect as
  2.1a arriving by a different route.
- [ ] 2.2 `src/core/templates/workflows/apply-change.ts` (3 occurrences) — same, at the
  `review-proposal` inflection.
- [ ] 2.2a `apply-change.ts:205` states the contract as "`formed_against` (NON-EMPTY array of
  independent pass `<TS>` tokens...)" — false for `continuation`/`proceed` once 1.1 lands. Qualify
  it the same way as 2.1b. Both bodies declare this contract independently, so both need the
  qualification; fixing one is the boundary-one-line-short failure this change is prone to.
- [ ] 2.3 `src/core/templates/workflows/pr-choreography.ts` (1 occurrence) — the reference to a
  recorded override; name the `continuation` record instead. NOTE D-rc04c-5's line: this is text
  the stage is already rewriting, so naming the successor correctly here is in scope — but do NOT
  sweep `override` vocabulary elsewhere in this file.
- [ ] 2.4 Rebuild and refresh the local surface (`npm run build && node bin/orbit.js update
  --force`), because template edits do not bump the version and plain `update`'s smart detection
  may skip them.

## 2.5 The engine (part 2 — the removals, AFTER the bodies)

Both tasks here REMOVE the legacy key's support and MUST follow section 2 per the backward hazard
above. Nothing composes `gate_overridden` by this point, so the window is closed by construction
rather than by remembering not to emit mid-section.

- [ ] 2.5a `src/core/emit-composition.ts` — REMOVE the coexistence guard (`:606-632`, the
  `GATE_FIELD_PAIRS` block). It is the field's only reader and comes down with it (`design.md` D2).
  (Was task 1.3 before the ordering correction.)
- [ ] 2.5b `src/core/emit-composition.ts` — remove `gate_overridden` from the `archive` and `apply`
  `payloadFields` tables. After this a payload carrying it is refused as an unknown key, which is
  the intended terminal behaviour (`design.md` D5) — no deprecation path, no warn-then-refuse.
  (Was task 1.4.)

## 3. The tests — FOUR kinds of break, sized per `design.md` D3

Do NOT treat these as equivalent repairs; the classification is the point. The fourth kind —
DELETION — was found by the fresh proposal pass, which read the whole of
`emit-composition.test.ts` rather than the one site the author had in mind. That correction is
recorded rather than absorbed: the original sizing was produced by reading SITES a grep had
surfaced, and it missed four sites in a file the grep DID surface.

- [ ] 3.1 SEMANTIC — `test/core/templates/orbit-content-fidelity.test.ts`: the `apply-change` and
  `archive-change` body pins on `gate_overridden` retire with the bodies. Record the reason in the
  test comment the way the ruling-count pin does — a pin going red on deliberate work is the pin
  doing its job, and the next reader should see which.
- [ ] 3.2 SEMANTIC — `test/core/emit-schema-parity.test.ts:167`: the archive conditional-field set
  drops to three (`fingerprint_overridden`, `fingerprints_unverified`, `audit_skipped_via_flag`).
- [ ] 3.3 SEMANTIC — `test/core/emit-composition.test.ts:187`: the assertion on
  `persisted.gate_overridden` becomes an assertion on the `continuation` entry.
- [ ] 3.3a SEMANTIC — `test/core/emit-composition.test.ts:169`: the conditional-fields test drops
  to three fields, INCLUDING ITS TITLE, which names four.
- [ ] 3.3b FIXTURE ONLY — `test/core/emit-composition.test.ts:1235` ('admits BOTH kinds on one
  archive emit'): the test is about KINDS and merely passes `gate_overridden` in its payload. Strip
  the field from the fixture; the assertion is unaffected. Same class as 3.4.
- [ ] 3.3c DELETION — `test/core/emit-composition.test.ts:1178` ('accepts a continuation/proceed
  that AGREES with gate_overridden') and `:1259-1281` (three parameterized 'refuses ... whose
  <field> disagrees with gate_overridden' cases). These EXERCISE THE GUARD 2.5a deletes and assert
  its error text by regex; they cannot be updated, only removed. **Read the comment at `:1254`
  before deleting** — it records that a prior external review caught the first implementation
  comparing only ONE of the three fields, so these cases are an earned regression. Deleting them is
  correct (the guard is gone) but the earned lesson should survive in 3.5's narrowed assertion,
  which is the only remaining check that all three facts travel together.
- [ ] 3.4 FIXTURE ONLY — `test/core/emit-schema-parity.test.ts:219`: this test does NOT test
  `gate_overridden`; it filters the field out of the payload table to prove the parity check
  notices a documented-but-missing key. Swap the victim to `fingerprint_overridden` and update the
  `toEqual` accordingly. One line, zero semantic content. Verified available: absent from
  `ENGINE_OWNED`, no per-command additions for `archive`, documented in the archive reference, live
  in the payload table at `emit-composition.ts:184`.
- [ ] 3.5 NARROWED IN PLACE — `test/core/judgement-record-fixture.test.ts`: replace the coexistence
  body with the assertion that a `continuation`/`proceed` entry carries all three gate facts
  (`gate`, `gate_state`, `gate_reason`). Per `design.md` D2 this REPLACES rather than joins — the
  test loses the half that became meaningless and keeps the half that did not.
  **KEEP THE ARCHIVE DERIVATION** (`:213-220`): the narrowed test SHALL still read the REAL archived
  apply emits and derive the three facts from the one carrying the retired field, never from
  synthesized values. That read is currently the only STANDING regression pin that an archived emit
  carrying `gate_overridden` still parses — exactly what exit (2) otherwise verifies by hand once.
  Synthesizing would satisfy the words of this task while silently converting an executable
  prior-generation guarantee into a sentence in a spec. It costs nothing: this change does not
  rewrite the archived emit.
- [ ] 3.6 ADD coverage for the new rule (1.2), both directions, because a conditional accepted
  without its refusal is half a check: an empty `formed_against` ACCEPTED on `continuation`/`proceed`
  with an empty trail, and REFUSED naming the pass when one precedes the emit. Include the
  scope guard — empty still refused on `readiness` and on `continuation`/`spend`.

## 4. Verify the stage did what it claims

- [ ] 4.1 Exit (1): `grep -rn "gate_overridden" src/core/templates/ src/core/emit-composition.ts`
  returns ZERO — no workflow body instructs writing the field AND the engine file the stage is
  named after carries no residue. The engine path was ADDED after the fresh proposal pass found a
  live error message naming the field that every sweep in this change missed: 4.1 covered templates
  only and 4.5 covers artifacts and specs, so the retirement's own implementation file was measured
  by nothing.
- [ ] 4.2 Exit (2): an archived trail carrying the old record still reads without error. Run the
  orientation and report surfaces against a real archived change whose emit carries
  `gate_overridden` (20 such emits exist) and confirm no parse failure and no degraded row. This is
  the PRIOR-GENERATION claim, and it is the one a reviewer should attack hardest.
- [ ] 4.3 Exit (3): the parent charter's exit (4) is MET — the field is retired rather than left
  write-only. State it against the charter's wording, not a paraphrase.
- [ ] 4.4 `npm test` green. Expect the four files in section 3 to have been deliberately updated
  (five sites in `emit-composition.test.ts` alone — see 3.3/3.3a/3.3b/3.3c);
  no OTHER test may need editing. A test outside that set going red means the retirement reached
  further than the stage claims — stop and report rather than widening.
- [ ] 4.5 DESCOPE SWEEP (R-crc-6's corollary, and the defect class this stage is most exposed to):
  after the guard is removed, grep the change's own artifacts AND the touched specs for the removed
  thing's vocabulary — `coexist`, `until .* retired`, `strict widening`, `GATE_FIELD_PAIRS` — and
  confirm no prose still argues for a coexistence that no longer exists. The known instance is
  `orbit-run-summary-emit`'s coexistence paragraph, already swept in the delta; this task is the
  check that nothing else survives.

## 5. Hand off what the next stage inherits

- [ ] 5.0 PERFORM — rewrite CLAUDE.md's two LIVE-ENGINE-DESCRIPTION passages, which this change
  falsifies. (a) `CLAUDE.md:227-229` states the named hole in the present tense — "`formed_against`
  is required non-empty, so the entry cannot be written when no independent pass exists at all …
  and rc04c inherits it" — which is simply FALSE after apply, and it hands forward a hole this
  stage closes. Rewrite it to record the hole as CLOSED and the record as TOTAL. (b) `CLAUDE.md:59`
  describes C1's gate inflection prompts as "surfaced + recorded via `gate_overridden`", also live
  engine description. Name the `continuation` record instead.
  **Scope guard**: the surrounding ARCHIVE NARRATIVE stays as history — only passages that read as
  live engine description are rewritten — and no `src:` marked span is touched (`orbit validate
  --sources` must stay clean). Precedent: `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/tasks.md`
  task 5.2b did exactly this, for exactly this reason.
- [ ] 5.1 RECORD (do not perform): Q-crc-23's residual vocabulary reframe. After this stage,
  `override` still appears at the fingerprint, audit-drift and PR seams. The charter's NON-GOAL and
  `design.md`'s D-rc04c-5 line kept it out of scope deliberately. Re-MEASURE the residual rather
  than inheriting the 48-occurrence figure — retiring the field shrinks it as a side effect, so the
  number recorded at Q-crc-23 will be stale by the time this archives.
- [ ] 5.1a RECOMMEND — do not perform — the architect amendment this stage earns:
  `orbit/architecture/clean-up-review-cycle.md:1611` states the same unconditional NON-EMPTY
  contract inside rc04a's stage section, and this change falsifies it. Stage declarations belong to
  `/orbit:architect`, so RECORD the recommendation and edit nothing there. Same for the charter's
  copy of the unreconstructible-reason figure (see 5.1b).
- [ ] 5.1b RECOMMEND — do not perform: the rc04c charter repeats design.md's "four archived apply
  emits" figure, which is four CHANGES / ten EMITS (corrected here per the fresh pass). Architect-owned.
- [ ] 5.2 RECORD for the archive seam: whether this stage's resolution walk AUTHORED engine
  mechanism or merely REPAIRED it (R-crc-6's lanes). `design.md` D4 runs the blind pair AFTER apply
  precisely so the pair reads the shipping tree; if the walk then authors, the pair's verdict no
  longer covers what ships, and Q-crc-20 says that is a RECORD at archive rather than a gate.

AT-ARCHIVE NOTE (execute in the archive flow, not at apply): (a) re-run 4.1 against the post-sync
tree. (b) Confirm `gate_overridden`'s footprint in `orbit/specs/` reads ZERO capabilities, down
from the 3 this stage inherited — measured the way rc04d measured it, by counting capabilities
whose requirements NAME the field normatively; the five descriptive prior-generation mentions in
these deltas are not normative demands and do not count. (c) Record 5.2's walk-lane judgement in
the readiness record's `accepted` list if the walk authored anything.
