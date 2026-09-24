> **READ THIS FIRST IF YOU ARE A COLD SESSION.** The proposal gate PASSED after three review
> passes (fresh internal → external GPT-5 Codex → in-context), 17 findings, all resolved. Boot with
> `orbit status --change rc04c-retire-gate-overridden --boot`, which renders position, read order,
> emit summaries and the predicted touchpoint map.
>
> **ONE LIVE WATCH DURING APPLY, and it is the only thing from the review cycle that does not
> survive in the artifacts on its own.** Three times in this change a rule turned out to be STATED
> IN MORE PLACES THAN ONCE, and all three times the correct fix was to DELETE a statement rather
> than reconcile two: (1) rc04d's site-2 edit, reversed twice before landing on removal rather than
> redirection; (2) external iter 1's C1, where a requirement's defining clause excluded the record
> its own lower clause admitted; (3) the in-context pass's WARNING, where one predicate had two
> extensions across two capabilities. That is not a run of unlucky edits — it is what a RETIREMENT
> does to a spec that grew by accretion, because removing a field exposes every place its behaviour
> was described. **If a FOURTH instance appears during apply, treat it as a structural signal about
> the stage rather than another repair**: stop and say so rather than fixing it quietly, because at
> four the right response may be a different decomposition rather than a fourth deletion.
>
> **Task count, stated because this stage carries a ratified ceiling breach and stale figures are
> the failure it keeps finding in others.** R-crc-9's breach was ratified at THIRTY-FOUR; the count
> is now 36 (34 + 5.1e + 5.1f — the earlier "35" here was the preamble's own arithmetic off by
> one, caught by both halves of the system blind pair), the additions being handoff RECORDS
> written at the pre-apply boundary, not new work. The ratification stands — it ratified a breach, not a number — but
> `clean-up-review-cycle.md`'s rc04c stage section cites 34, and the next architect session should
> reconcile the two rather than let them drift.
>
> **Two trail facts that will mislead a cold reader if not said here.** (a) `independentSpend`
> reads 3, but two of those are ONE reviewer's re-run of the same review — the trail cannot
> distinguish a re-run from an independent pass, so do not read 3 as three distinct reviews.
> (b) The boot render surfaces the `review-external` T0 emit with `awaiting_findings: true` and the
> text "awaiting findings from". Findings DID return (two files, both walked to zero); nothing flips
> that flag today, by design — see `references/external-handoff.md`. It is not an outstanding task.

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

- [x] 1.1 `src/core/emit-composition.ts` — `validateJudgements` (`:533`): RELAX the non-empty
  `formed_against` requirement for `kind: "continuation"` + `disposition: "proceed"` ONLY. Every
  other kind/disposition keeps the unconditional refusal. The array-of-strings check is unchanged.
  Per `design.md` D1's table — the split exists because this function is STRUCTURAL and has no
  trail access. **While in this function**, reword the error message five lines above the check
  (`:588`): `"'<req>' is required on a continuation/proceed — it carries what gate_overridden
  carried."` names the field this stage retires, and after 2.5b it would point a user at a key the
  same engine refuses as unknown. Replace that clause with what the record carries in its own terms
  (the gate facts at decision time). This is the retired FIELD NAME, not the `override` word — the
  charter NON-GOAL is untouched.
- [x] 1.2 `src/core/emit-composition.ts` — `judgementOrderingCheck` (`:958`): ADD the
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

- [x] 2.1 `src/core/templates/workflows/archive-change.ts` (9 occurrences) — Step 3.4 stops
  composing `gate_overridden` and composes only the `continuation`/`proceed` entry. The archive
  schema reference it ships must lose the field too, or `emit-schema-parity` fails on the mismatch.
- [x] 2.1a **THE OMIT BRANCH — without this the stage ships its own headline claim contradicted.**
  `archive-change.ts:287` currently instructs: *"If the trail carries NO independent pass earlier
  than this emit, OMIT the entry and let `gate_overridden` stand alone: `formed_against` must be
  non-empty, so a record cannot be written here."* Replace it with the write rule: the entry IS
  written, carrying `formed_against: []`, precisely when no independent pass precedes this emit.
  Left standing, this instruction produces NO record in exactly the case this stage exists to close
  — and names a field the same section retires. The archive delta makes the write NORMATIVE
  (`specs/orbit-archive-modifications/spec.md`, the edge-that-now-can-be-written requirement), so
  body and spec would otherwise disagree on the stage's central claim.
- [x] 2.1b The shipped `archive-summary-schema.md` reference (composed in `archive-change.ts:97`)
  carries the `judgements` field note an AI READS while composing an archive emit. TWO edits, not
  one — the cardinality AND the membership rule:
  (i) restate `formed_against` as non-empty EXCEPT on `continuation`/`proceed`, where an empty
  array is legal exactly when the emptiness is true of the trail;
  (ii) `archive-change.ts:97` currently says `judgements` is present ONLY when a decision "formed
  against INDEPENDENT REVIEW OUTPUT" was taken — the MEMBERSHIP definition, which excludes the
  evidence-free record by its own terms. Re-ground it on CADENCE POSITION the way the spec now
  does. Changing only the cardinality leaves the body's own definition forbidding the record the
  same body is told to write. (External iter 1 found exactly this: the tasks changed cardinality
  and left the definition.)
  A reference that still says unconditionally non-empty teaches the composing AI to omit the
  entry, which is the same defect as 2.1a arriving by a different route.
- [x] 2.2 `src/core/templates/workflows/apply-change.ts` (3 occurrences) — same, at the
  `review-proposal` inflection.
- [x] 2.2a `apply-change.ts:205` states the contract as "`formed_against` (NON-EMPTY array of
  independent pass `<TS>` tokens...)" — false for `continuation`/`proceed` once 1.1 lands — AND
  carries the same "formed against INDEPENDENT REVIEW OUTPUT" membership sentence. Apply BOTH of
  2.1b's edits here. Both bodies declare this contract independently, so both need both; fixing one
  body, or one half in each, is the boundary-one-line-short failure this change is prone to.
- [x] 2.3 `src/core/templates/workflows/pr-choreography.ts` (1 occurrence) — the reference to a
  recorded override; name the `continuation` record instead. NOTE D-rc04c-5's line: this is text
  the stage is already rewriting, so naming the successor correctly here is in scope — but do NOT
  sweep `override` vocabulary elsewhere in this file.
- [x] 2.4 Rebuild and refresh the local surface (`npm run build && node bin/orbit.js update
  --force`), because template edits do not bump the version and plain `update`'s smart detection
  may skip them. **This is NOT the final build — see 2.6.**

## 2.5 The engine (part 2 — the removals, AFTER the bodies)

Both tasks here REMOVE the legacy key's support and MUST follow section 2 per the backward hazard
above. Nothing composes `gate_overridden` by this point, so the window is closed by construction
rather than by remembering not to emit mid-section.

- [x] 2.5a `src/core/emit-composition.ts` — REMOVE the coexistence guard (`:606-632`, the
  `GATE_FIELD_PAIRS` block). It is the field's only reader and comes down with it (`design.md` D2).
  (Was task 1.3 before the ordering correction.)
- [x] 2.5b `src/core/emit-composition.ts` — remove `gate_overridden` from the `archive` and `apply`
  `payloadFields` tables. After this a payload carrying it is refused as an unknown key, which is
  the intended terminal behaviour (`design.md` D5) — no deprecation path, no warn-then-refuse.
  (Was task 1.4.)
- [x] 2.6 **REBUILD AGAIN — the runnable surface, not just the source.** `npm run build && node
  bin/orbit.js update --force`, AFTER 2.5a/2.5b. `bin/orbit.js` imports `../dist/cli/index.js`, so
  without this the installed CLI still carries the coexistence guard and still accepts
  `gate_overridden` while `src/` grep and the Vitest suite (which exercise `src/`) both pass green
  — a source/runtime split that hides the stage's own central claim from the only surface a user
  touches. Then SMOKE-TEST THE BUILT CLI, not the source: submit a payload carrying
  `gate_overridden` to an apply and an archive emit through `node bin/orbit.js emit ...` and confirm
  the unknown-key refusal fires and no file is written.
  **This task exists because the F5 reorder created the gap**: before it, the removals sat in
  section 1 and 2.4's build followed everything; moving them after the bodies stranded the only
  build in the middle. External iter 1 caught it. A reorder that fixes one ordering hazard can
  create another, and the build step is the thing to re-check whenever work moves across it.

## 3. The tests — FOUR kinds of break, sized per `design.md` D3

Do NOT treat these as equivalent repairs; the classification is the point. The fourth kind —
DELETION — was found by the fresh proposal pass, which read the whole of
`emit-composition.test.ts` rather than the one site the author had in mind. That correction is
recorded rather than absorbed: the original sizing was produced by reading SITES a grep had
surfaced, and it missed four sites in a file the grep DID surface.

- [x] 3.1 SEMANTIC — `test/core/templates/orbit-content-fidelity.test.ts`: the `apply-change` and
  `archive-change` body pins on `gate_overridden` retire with the bodies. Record the reason in the
  test comment the way the ruling-count pin does — a pin going red on deliberate work is the pin
  doing its job, and the next reader should see which.
- [x] 3.2 SEMANTIC — `test/core/emit-schema-parity.test.ts:167`: the archive conditional-field set
  drops to three (`fingerprint_overridden`, `fingerprints_unverified`, `audit_skipped_via_flag`).
- [x] 3.3 SEMANTIC — `test/core/emit-composition.test.ts:187`: the assertion on
  `persisted.gate_overridden` becomes an assertion on the `continuation` entry.
- [x] 3.3a SEMANTIC — `test/core/emit-composition.test.ts:169`: the conditional-fields test drops
  to three fields, INCLUDING ITS TITLE, which names four.
- [x] 3.3b FIXTURE ONLY — `test/core/emit-composition.test.ts:1235` ('admits BOTH kinds on one
  archive emit'): the test is about KINDS and merely passes `gate_overridden` in its payload. Strip
  the field from the fixture; the assertion is unaffected. Same class as 3.4.
- [x] 3.3c DELETION — `test/core/emit-composition.test.ts:1178` ('accepts a continuation/proceed
  that AGREES with gate_overridden') and `:1259-1281` (three parameterized 'refuses ... whose
  <field> disagrees with gate_overridden' cases). These EXERCISE THE GUARD 2.5a deletes and assert
  its error text by regex; they cannot be updated, only removed. **Read the comment at `:1254`
  before deleting** — it records that a prior external review caught the first implementation
  comparing only ONE of the three fields, so these cases are an earned regression. Deleting them is
  correct (the guard is gone) but the earned lesson should survive in 3.5's narrowed assertion,
  which is the only remaining check that all three facts travel together.
- [x] 3.4 FIXTURE ONLY — `test/core/emit-schema-parity.test.ts:219`: this test does NOT test
  `gate_overridden`; it filters the field out of the payload table to prove the parity check
  notices a documented-but-missing key. Swap the victim to `fingerprint_overridden` and update the
  `toEqual` accordingly. One line, zero semantic content. Verified available: absent from
  `ENGINE_OWNED`, no per-command additions for `archive`, documented in the archive reference, live
  in the payload table at `emit-composition.ts:184`.
- [x] 3.5 NARROWED IN PLACE — `test/core/judgement-record-fixture.test.ts`: replace the coexistence
  body with the assertion that a `continuation`/`proceed` entry carries all three gate facts
  (`gate`, `gate_state`, `gate_reason`). Per `design.md` D2 this REPLACES rather than joins — the
  test loses the half that became meaningless and keeps the half that did not.
  **KEEP THE ARCHIVE DERIVATION** (`:213-220`) AND PUT IT THROUGH A READER: the narrowed test SHALL
  still read the REAL archived apply emits and derive the three facts from the one carrying the
  retired field, never from synthesized values — AND it SHALL reach them via `readTrail`
  (`src/core/artifact-graph/trail.ts:152`, which takes a change DIRECTORY and so can be pointed at
  `orbit/changes/archive/<dated-name>/`) rather than via raw `fs.readFileSync` + `JSON.parse`.
  **The raw read proves nothing about compatibility** — external iter 1 found that the existing
  derivation only demonstrates that JSON parses as JSON, which was never in doubt. The claim this
  stage makes is that ORBIT'S READERS tolerate a prior-generation emit carrying a field the engine
  no longer accepts, and only a reader can witness that. Synthesizing values, or keeping the raw
  read, would satisfy the words of this task while leaving exit (2) with no executable evidence at
  all. It costs nothing: this change does not rewrite the archived emit.
- [x] 3.5b ADD a STANDING NEGATIVE REGRESSION for the retired key, one per command: submit a
  payload carrying `gate_overridden` to `apply` and to `archive` and assert the ordinary unknown-key
  refusal fires AND no emit file is written. The existing pattern is
  `test/core/emit-composition.test.ts:1016` (`unknown payload key 'pr_attachment' for 'archive'`),
  so this is a transcription, not new machinery. **Why it is needed even though the key is being
  deleted**: section 3 otherwise only DELETES or rewrites the tests that currently exercise the
  field, and `emit-schema-parity` is ONE-WAY — it asserts documented keys are accepted, so it stays
  green if a later edit silently re-adds an undocumented legacy key. Task 4.1's grep is a one-time
  apply-day check, not a standing pin. Without this, nothing in the suite would notice the
  retirement being undone.
- [x] 3.6 ADD coverage for the new rule (1.2), both directions, because a conditional accepted
  without its refusal is half a check: an empty `formed_against` ACCEPTED on `continuation`/`proceed`
  with an empty trail, and REFUSED when one precedes the emit. **The refusal case SHALL seed at
  least TWO preceding independent passes and assert the error names the LATEST token** — and,
  preferably, asserts it does NOT name the older one — plus the entry index. A fixture with a
  single preceding pass would satisfy a looser wording while an implementation naming the oldest,
  or an arbitrary, pass still violated the spec; "latest" was made normative in 1.2 precisely
  because the ordinary trail carries several. Include the scope guard — empty still refused on
  `readiness` and on `continuation`/`spend`.

## 4. Verify the stage did what it claims

- [x] 4.1 Exit (1): `grep -rn "gate_overridden" src/core/templates/ src/core/emit-composition.ts`
  returns ZERO — no workflow body instructs writing the field AND the engine file the stage is
  named after carries no residue. The engine path was ADDED after the fresh proposal pass found a
  live error message naming the field that every sweep in this change missed: 4.1 covered templates
  only and 4.5 covers artifacts and specs, so the retirement's own implementation file was measured
  by nothing.
  **MEASURED 2026-09-24 at apply:** `grep -rn "gate_overridden" src/core/templates/ src/core/emit-composition.ts`
  → 0 lines. The whole of `src/` reads 0 as well (informational; the criterion names the two paths).
- [x] 4.2 Exit (2): an archived trail carrying the old record still reads without error.
  **THE COMMAND THIS TASK ORIGINALLY NAMED DOES NOT WORK, and external iter 1 proved it by running
  it**: `orbit status --change <archived-name> --report` fails with `Change '<name>' not found`
  before rendering, because `--report` resolves through `validateChangeExists`, which accepts only
  ACTIVE `orbit/changes/<name>` directories. A task instructing an impossible verification is worse
  than no task, because it reads as covered.
  Verify instead through surfaces that CAN address archived data: (a) the standing `readTrail`
  regression added in 3.5, which is the executable half and the one that survives this session; and
  (b) bare `orbit status` (no `--change`), which scans archived trails for global-LAST selection —
  confirm it renders without parse failure and without a degraded row while an archived emit
  carrying `gate_overridden` is the most recent. Both are runnable; neither invents a surface.
  This is the PRIOR-GENERATION claim, and it is the one a reviewer should attack hardest — it has
  now been attacked twice and failed once.
  **MEASURED 2026-09-24 at apply:** (a) `judgement-record-fixture.test.ts`'s narrowed case hands
  `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/` to `readTrail`, asserts the reader
  surfaced both apply tokens and all four pass tokens with `rejectedExternals: []`, then derives the
  three gate facts from the emit the reader NAMED — green. (b) bare `orbit status` rendered exit 0 with
  no degraded row over a tree whose archived trails hold 20 emits carrying the field. Stated rather than
  implied: the global LAST resolved to this change's own `address-reviews` emit, so the archived emits
  were SCANNED by the selection, not SELECTED by it — the parse-without-failure half is witnessed, the
  render-as-LAST half is not, and (a) is the half that survives the session.
- [x] 4.3 Exit (3): the parent charter's exit (4) is MET — the field is retired rather than left
  write-only. State it against the charter's wording, not a paraphrase.
  **STATED 2026-09-24 against the charter's wording** — *"(4) `gate_overridden` either gains a reader
  or is retired — today nothing in `src/` reads it, so replacing one write-only record with another
  would deliver nothing."* MET on the second disjunct, RETIRED: the field is gone from the write path
  (three bodies, two payload tables, the shipped schema reference — 4.1 reads 0), the built CLI refuses
  it on `apply` and `archive` as an unknown key with no file written (2.6 smoke, and 3.5b pins it), and
  the one reader it had gained (the coexistence guard) came down with it. The successor is not "another
  write-only record": it has the archive readout as its reader (Step 5.65) and the ordering check as
  its consumer, which is what the charter's second clause was guarding against.
- [x] 4.4 `npm test` green. Expect the four files in section 3 to have been deliberately updated
  (five sites in `emit-composition.test.ts` alone — see 3.3/3.3a/3.3b/3.3c);
  no OTHER test may need editing. A test outside that set going red means the retirement reached
  further than the stage claims — stop and report rather than widening.
  **REPORTED 2026-09-24 — one test OUTSIDE the named set went red, and it is recorded here rather than
  absorbed.** First full run after section 3: 2239 passed, 2 failed, both in
  `test/core/templates/skill-templates-parity.test.ts` — a SHA-256 pin over every template body and
  generated skill. The only hashes that moved were `getApplyChangeSkillTemplate`,
  `getArchiveChangeSkillTemplate` and their two generated skills: EXACTLY the two bodies section 2 names
  (pr-choreography's edit rides inside the archive skill's references). So the retirement did NOT reach
  further than the stage claims; the stage's test SIZING did not reach far enough — D-rc04c-6 sized the
  test set by grepping for the field name, and a hash pin names nothing. That is design.md D3's lesson
  in a third form: a grep finds every mention, a mention is not a dependency, and a pin is a dependency
  that is not a mention. Re-pinned as the file's own header prescribes ("updating it IS that act";
  precedent: rc04a's apply commit), with a dated comment naming which hashes moved and why. Final run
  after the re-pin: see the apply emit's assessment. No other file outside the set was touched.
- [x] 4.5 DESCOPE SWEEP (R-crc-6's corollary, and the defect class this stage is most exposed to):
  after the guard is removed, grep the change's own artifacts AND the touched specs for the removed
  thing's vocabulary — `coexist`, `until .* retired`, `strict widening`, `GATE_FIELD_PAIRS` — and
  confirm no prose still argues for a coexistence that no longer exists. The known instance is
  `orbit-run-summary-emit`'s coexistence paragraph, already swept in the delta; this task is the
  check that nothing else survives.
  **SWEPT 2026-09-24:** `grep -rn -i "coexist\|until .* retired\|strict widening\|GATE_FIELD_PAIRS"`
  over the change's artifacts, the three deltas, the three touched baselines, the engine, the bodies and
  the touched tests. Hits fall in three classes and none argues for a coexistence that persists: (1) the
  change's own proposal/design/explore/tasks DESCRIBE the guard's removal; (2) the BASELINE
  `orbit-run-summary-emit` still carries the coexistence paragraph, inside `The judgement record — one
  spine, two kinds`, which this delta MODIFIES — so sync replaces it at archive (the delta file itself:
  zero hits); (3) two test comments record the history of what the walk changed. Engine and bodies: zero.

## 5. Hand off what the next stage inherits

- [x] 5.0 PERFORM — rewrite CLAUDE.md's two LIVE-ENGINE-DESCRIPTION passages, which this change
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
  **PERFORMED 2026-09-24:** (a) the rc04a paragraph now records the hole as CLOSED and the record as
  TOTAL, dated to this apply; (b) the C1 passage names the `continuation`/`proceed` entry. Six other
  mentions remain in CLAUDE.md, all archive narrative (rc02's, D1's, D2's, D3's, D6's recorded overrides
  and rc04d's headline) — history, untouched per the scope guard. `orbit validate --sources` clean.
- [x] 5.1 RECORD (do not perform): Q-crc-23's residual vocabulary reframe. After this stage,
  `override` still appears at the fingerprint, audit-drift and PR seams. The charter's NON-GOAL and
  `design.md`'s D-rc04c-5 line kept it out of scope deliberately. Re-MEASURE the residual rather
  than inheriting the 48-occurrence figure — retiring the field shrinks it as a side effect, so the
  number recorded at Q-crc-23 will be stale by the time this archives.
  **RE-MEASURED 2026-09-24** (`grep -oiw override`, whole word, case-insensitive, occurrences):
  `orbit/specs/` reads **53** on the pre-sync tree and **46** post-sync (computed by substituting each
  delta requirement for its baseline text: `orbit-archive-modifications` 16→11, `orbit-run-summary-emit`
  4→2, every other capability unchanged — `orbit-base-fingerprints` 10, `orbit-conventions` 6,
  `orbit-engine-gates` 6, `orbit-pr-lifecycle` 6, `orbit-source-lint` 2, one each in address-reviews,
  audit-drift, propose-modifications). Q-crc-23's 48 was a different count on an earlier tree; the
  measure that matters is that the field's retirement removed 7 and left 46 across ten capabilities —
  the word is the program's word for "the human decided to continue" at the fingerprint, audit-drift
  and PR seams, and this stage did not touch it there. Workflow bodies: `gate_overridden` 17→**0**;
  the word `override` 17→**11**; `Proceed anyway` 7; `proceed-anyway` 8. Whoever takes the scope call
  inherits 46 + 11, not 48 + 17.
- [x] 5.1a RECOMMEND — do not perform — the architect amendment this stage earns:
  `orbit/architecture/clean-up-review-cycle.md:1611` states the same unconditional NON-EMPTY
  contract inside rc04a's stage section, and this change falsifies it. Stage declarations belong to
  `/orbit:architect`, so RECORD the recommendation and edit nothing there. Same for the charter's
  copy of the unreconstructible-reason figure (see 5.1b).
  **RECORDED 2026-09-24, not performed.** `clean-up-review-cycle.md`'s rc04a stage section still states
  the unconditional NON-EMPTY contract; this apply falsifies it. Architect-owned; for the next
  `/orbit:architect` session.
- [x] 5.1b RECOMMEND — do not perform: the rc04c charter repeats design.md's "four archived apply
  emits" figure, which is four CHANGES / ten EMITS (corrected here per the fresh pass). Architect-owned.
  **RECORDED 2026-09-24, not performed.** Architect-owned figure correction (four CHANGES / ten EMITS).
- [x] 5.1c **LANDED 2026-09-24 — the gate this task named is OPEN.** `/orbit:architect` recorded
  both halves: R-crc-1 gained the byte-measurement clarification (changed bytes, not carried
  bytes — appended inside the ruling so a reader who reaches R-crc-1 cannot apply the old measure),
  and rc04c's stage section carries the TASK breach as R-crc-9's first RATIFIED one (Sal,
  2026-09-24), at its real figure of 34 with the split-does-not-help reasoning recorded. Three of
  four dimensions now read UNDER; the fourth is a recorded, citable breach rather than an
  unexamined overage. The stage's review cadence may continue. Original recommendation follows.

  RECOMMEND — do not perform — AND IT GATES THIS STAGE: an R-crc-1 clarification the
  external pass earned. Rulings are architect-owned (D-d2-4), so this stage RECORDS the draft and
  edits nothing in `orbit/architecture/`; it must be landed by `/orbit:architect` BEFORE this
  stage's review cadence continues, because until it does the stage is over ceiling and R-crc-1
  says an over-ceiling proposal is split before review, never reviewed as one.

  **Measured against all four dimensions** (external iter 1, GPT-5 Codex): capabilities 3 of 3 AT;
  requirements 10 of ~12 UNDER; delta 57,418 B against ~40 KB, ~40% OVER; tasks 34 against
  "under 20", 70% OVER. **These figures ROSE during the external walk** (56,262 B / 30
  tasks at the time the finding was written): resolving the six findings added precision, and
  precision costs boxes and bytes. That direction of travel is itself evidence for draft (b) — a
  count that grows every time a reviewer is right is measuring review depth, not scope — and it is
  recorded rather than smoothed, because a ceiling argument that quietly restates a smaller number
  is the failure this stage keeps finding in others.

  **DRAFT (a) — the byte ceiling should measure CHANGED bytes, not CARRIED bytes.** The delta
  format requires a MODIFIED block to reproduce the requirement's FULL updated content, so a stage
  that rewrites ten long prose requirements carries their entire text whether it changes one line
  or fifty. Measured here: across the three deltas only ~145 lines differ from their baselines, so
  roughly 43 KB of the 56 KB is verbatim carriage. R-crc-1 was calibrated on `c2-parallel-merge`
  (21 KB / 9 requirements), a MECHANISM stage whose delta bytes were mostly new text. For a
  RETIREMENT or DE-NAMING stage the same figure measures format, not scope, and predicts nothing
  about review cost. Changed-bytes is as observable as total-bytes (R-crc-10 permits the check),
  so the clarification costs no judgement.

  **DRAFT (b) — the TASK overage is NOT explained away, and is proposed as a ratified breach under
  R-crc-9 instead.** Settled under R-crc-3 and recorded with the reasoning, because the tempting
  move here is the dishonest one. 34 boxes decompose as work items plus verification and handoff records — and even
  counting only work the stage is AT OR OVER a ceiling of "under 20", and redefining what counts as a task to get under it is
  precisely the "hide the overage by coalescing checkboxes" the external reviewer named. It is also
  worth recording WHY the count grew: 22 at propose, 30 after two review passes, every addition a
  sub-task naming an exact site a reviewer had found. Those passes made the stage more precise, not
  larger. That is an argument for why the breach is acceptable, NOT an argument that it is not a
  breach. R-crc-9 permits a ratified breach and the program has never taken one; this is proposed
  as the first, on the record, rather than absorbed.
- [x] 5.1d RECORD (do not perform) — a real limitation found while fixing 4.2, and out of scope
  here: **`orbit status --change <name> --report` cannot target an ARCHIVED change.** It resolves
  through `validateChangeExists`, which enumerates active `orbit/changes/` only, so no rendered
  review report can ever be produced for a change once archived — and the archived trail is exactly
  where a report is most useful for a reader reconstructing how a change converged. Fixing it is an
  engine change in the status/orientation surface, a capability this stage neither touches nor
  holds a fingerprint on; doing it here would take the stage to FOUR capabilities and breach the one
  R-crc-1 dimension it is still inside (see 5.1c). Recorded for whoever owns that surface next.
  **RECORDED 2026-09-24.** Re-confirmed in passing at 4.2: the archived trail was reachable only through
  `readTrail` and bare `orbit status`; `--report` still cannot address it.
- [x] 5.1e RECOMMEND — do not perform — a program-level observation for **Q-crc-14** (the source
  lint ships with no TRIGGER), found at this change's own promotion: `source-lint` enumerates via
  `git ls-files` — the INDEX — so during the window between a consume-mode `/orbit:propose` moving
  `explore.md` with `mv` and the change being committed, the lint READS A PATH GIT STILL TRACKS AND
  THROWS `ENOENT`. It does not report a finding; it fails the suite with an exception. Measured
  here: the ENOENT set was exactly the moved file, and the file at its NEW path was untracked and
  therefore unlinted for the same window. Both clear on commit. Worth recording because EVERY
  consume-mode propose creates that window, and a lint that throws rather than reports during a
  routine lifecycle step is a different failure mode from the missing trigger Q-crc-14 already
  names.
  **RECORDED 2026-09-24, not performed** — carried to the program doc's Q-crc-14 entry by whoever next
  edits it.
- [x] 5.1f RECOMMEND — do not perform — a vocabulary gap in the SPEND record, found while packaging
  this change's external handoff. `orbit-run-summary-emit` admits a `continuation`/`spend` entry
  when a handoff buys a further independent pass past a gate that has ALREADY PASSED. This handoff
  was neither that nor the other named case (covering a declared, still-uncovered slot): the
  `review-proposal` cadence is `[independent, in-context]`, the `independent` slot was already
  covered by the fresh pass, and the slot the gate waited on was `in-context` — which an external
  pass cannot satisfy. So it was a genuine further-independent-pass decision taken past an UNPASSED
  gate whose remaining slot is a different class: a spend in substance with no carrier in the
  vocabulary. The trigger keys on gate PASSAGE, and a cadence can reach "another independent pass
  is worth buying" without the gate having passed. Recorded, not taken — assigning it is a scope
  call.
  **RECORDED 2026-09-24, not performed** — a scope call, open.

  RECOMMEND — do not perform — **the reader-backed token surface (ratified as a FOLLOW-UP, Sal,
  2026-09-24, at the system blind-pair walk).** Both halves of the pair found the token-source
  sentence — pasted into four bodies (apply's seam paragraph, archive Steps 3.4 and 5.5, review's
  spend record) — counting REJECTED external returns as citable, which the write gate refuses. The
  walk took option A (repair the sentence once, everywhere; a fidelity pin holds the qualifier) and
  recorded option B here: an engine surface that PRINTS the citable pass set (the trail reader's
  accepted passes, filtered to `fresh`/`external`), so no body re-enumerates filenames at all and
  the four copies collapse to one call. B is authoring, and it was declined inside this stage
  because the pair had already read the tree (design D4) and the stage sits at R-crc-1's capability
  ceiling. Sal intends to canonize it in the program via `/orbit:architect` after this change.
- [x] 5.2 RECORD for the archive seam: whether this stage's resolution walk AUTHORED engine
  mechanism or merely REPAIRED it (R-crc-6's lanes). `design.md` D4 runs the blind pair AFTER apply
  precisely so the pair reads the shipping tree; if the walk then authors, the pair's verdict no
  longer covers what ships, and Q-crc-20 says that is a RECORD at archive rather than a gate.
  **RECORDED 2026-09-24 at apply; the JUDGEMENT is taken at archive per at-archive note (c).** What is
  known now: no walk has run (D4 runs the blind pair AFTER this apply, on the tree it produced). The
  engine mechanism the pair will read is tasks 1.1/1.2 (the relaxed structural check and the
  emptiness-truthfulness rule in `judgementOrderingCheck`) plus the two payload-table removals — all
  written here, under the tasks, before any review. So the line to hold at the seam: a post-pair walk
  that REPAIRS those functions (an off-by-one, an error string, a missed guard) is the repair lane; one
  that adds a predicate, a set, or a branch the pair did not read is AUTHORING, and the readiness
  record's `accepted` list must say so.

AT-ARCHIVE NOTE (execute in the archive flow, not at apply): (a) re-run 4.1 against the post-sync
tree. (b) Confirm `gate_overridden`'s footprint in `orbit/specs/` reads ZERO capabilities, down
from the 3 this stage inherited — measured the way rc04d measured it, by counting capabilities
whose requirements NAME the field normatively; the five descriptive prior-generation mentions in
these deltas are not normative demands and do not count. (c) Record 5.2's walk-lane judgement in
the readiness record's `accepted` list if the walk authored anything.
