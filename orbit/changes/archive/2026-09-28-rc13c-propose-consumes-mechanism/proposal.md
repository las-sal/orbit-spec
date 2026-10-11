# Proposal: rc13c-propose-consumes-mechanism (stage rc13c-propose-consumes-mechanism)

## Why

rc13a made a rule's domain ACCOUNTED inside the exploration, and D-bcs-3 settled that an
OPEN-DECLARED residual never blocks — it TRAVELS: the spec delta's requirement text owns it (only
spec text survives archive), the design's Risks points at it. rc13b made the readout read that form.
The layer downstream of both has not moved. `/orbit:propose`'s consume mode maps five sections and
has no row for Mechanism; its structure check still counts "five sections" against a format that has
been six since rc13a (the exemption rc13a's residue sweep declared for this stage); and it keys on
`explore.md`'s PRESENCE, reading no header token, so an exploration that CONCLUDED — decided to build
nothing — is promoted into a live change like any other. The failure D-bcs-1 forbids at the
exploration, a domain left open silently, reappears one layer down: the account dies at the seam
where the work becomes a change.

Every mechanism here was settled in the exploration at promotion (`explore.md`: eight decisions,
seven live rules, six with Mechanism entries parsing clean under the engine, one BOUNDED residual —
this stage's own exit-(2) exemplar) and then REVISED by two review walks, so the live figure is SIX
rules: D-rc13c-2 revised (the consume-time emit descoped, then its optional trail cross-check),
D-rc13c-4 amended to a true partition, D-rc13c-8 superseded. The design's Decisions section is the
live statement; `explore.md` is history by rule. Sal ruled the two scope calls: a concluded exploration is DONE, propose refuses it
and offers no way back (D-rc13c-1); and the stage stays at ONE capability (D-rc13c-3).

## What Changes

- **Propose REFUSES a concluded staging directory, in Step 0.** When the staging `explore.md`'s
  first non-blank line carries the `concluded <date>.` token, mode detection halts stating the
  conclusion date and the recorded `Re-entry:` trigger, verbatim, and stops: no prompt, nothing written, nothing moved — and no branch cut, because the
  PR layer's phase 1 (select + switch) runs between Step 0 and Step 0a and a refused promotion must
  never reach it. Naming inference (`/orbit:propose` with no name) never offers a concluded directory as
  a candidate. Beside an active change of the same name, a concluded staging directory is refused
  BEFORE the conflict prompt, naming both paths — no Step 0 path deletes or overwrites a concluded
  record (the system blind pair's external half found the prompt's Continue choice would have). The reopen path stays where rc13a put it — `orbit-conventions`' reopen scenario, executed
  by the explore body — and propose does not mention it. (D-rc13c-1)
- **Consume mode reads the Mechanism section from the file; propose fires no emit of its own.** The
  proposing AI reads entries, tokens and residual slots by the grammar `orbit-conventions` owns — carried
  in the body as a checked mirror of the grammar module's production, so an adopter's skill can decide
  "accounted" (full conformance to the grammar) without this repository's specs or parser — and
  reads no prior emit as a cross-check (git keeps no modification time, so no trail record can be
  shown to describe the current bytes); the record's header says the AI's reading is its source. `orbit-run-summary-emit`'s
  one-shot rule is untouched. A read-only engine print of the parsed form is the proper cross-check and
  is opened as its own question at archive. (D-rc13c-2 as revised at the first walk; the consume-time
  emit the exploration settled was descoped there — it contradicted the one-shot rule and would have
  needed a second capability)
- **The mapping gains a MECHANISM ROW, stated as a decision table that PARTITIONS what propose
  meets** — owner's live-rule status × the readout's accounting state, rows tested in order, "accounted"
  defined by pointer as not in `rules_open`. A CLOSED entry (DERIVED / SOURCED) on an accounted live rule lands in the spec delta requirement the
  rule derives — its domain table as one of the four shapes on record (a normative table, a grammar
  block, a scenario set, a sentence naming the source; a BOUNDED set), its `Closure:` justification as
  the sentence naming the source. A BOUNDED entry lands its `Residual kind:` and `Residual method:`
  VERBATIM in that requirement's text as a named limit (the OWNER), with one `design.md` Risks entry
  naming the rule ID and POINTING at the requirement. An entry whose owner is not a live rule (`Kind:
  fact` / `scope`, `Disposition: superseded` / `assigned`) is history and is not carried. A live rule
  with no usable entry lands in Risks as UNACCOUNTED with the engine's state word; key defects are
  reported and carry nowhere. `design.md` carries a `Mechanism → artifacts` record naming, per entry,
  its token and destination. Propose consumes FORM; whether an enumeration is TRUE stays the
  reviewer's. (D-rc13c-4, D-rc13c-5)
- **The structure check reads the sections `orbit-conventions`' format requirement lists, by
  POINTER.** The spec scenario names the owner and no number; the body carries the six names as a
  CHECKED MIRROR of that requirement (R-crc-14's mirror corollary — an adopter's body cannot resolve
  our spec at runtime), held byte-equal to the requirement's stated order by a parity test. An absent
  Mechanism section warns like any other missing section, proceeds by default, and makes every live
  rule UNACCOUNTED in the record. (D-rc13c-6, D-rc13c-3)
- **A Step 0b resolve-now writes a CONFORMING Decisions entry** — dated ID opener, `Kind:` per the
  answer's normative force, `Disposition: live` — per `orbit-conventions`' entry-identity requirement.
  A rule answered at propose gets NO Mechanism entry authored there: it lands in the record as a visible
  open domain, and the prompt says so. (D-rc13c-7)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-propose-modifications`: `Consume mode when staging directory exists` (the concluded refuse
  in Step 0, before the PR layer's switch); `Section-to-artifact mapping` (ONE new row pointing at the
  ADDED requirement below); `Validate explore.md structure before consuming` (six sections by pointer,
  the Mechanism-absent case); `Open question handling` (the conforming entry; a rule answer as an open
  domain); `Naming inference fallback` (concluded directories are not candidates); plus ONE ADDED
  requirement, `Mechanism section consumption`, carrying the partitioned decision table, the file read
  as sole source, the four CLOSED shapes with their declared residual, and the design record.

ONE capability, six requirement blocks (five MODIFIED, one ADDED) — inside R-crc-1's ceiling, as
chartered ("one capability, which is why this is a stage and not a fold"). The first walk kept it at
one by descoping rather than repairing a neighbour (R-crc-6).

## Impact

- **Templates**: `src/core/templates/workflows/propose.ts` — Step 0 (the concluded branch and the
  naming-inference exclusion), Step 0a (the mirrored section list), Step 0b (the entry format; the Mechanism read after the last
  file write), Step 0c (the Mechanism row), a new Step 0c.6 (the `Mechanism → artifacts` record and
  the residual travel), Graceful degradation. The `orbit-propose` hash pin in
  `test/core/templates/skill-templates-parity.test.ts` MOVED at apply and once more at the system
  blind-pair walk, each re-record carrying its dated reason.
- **Tests**: `test/core/templates/orbit-content-fidelity.test.ts` — the propose marker set gains the
  refuse branch, the mirror, the no-engine-record header and the record; a parity assertion holding the
  body's section list byte-equal to `orbit-conventions`' format requirement, and the Step 0c.6
  decision table and four-shape list byte-equal to this change's `Mechanism section consumption`
  requirement, through the existing single-active-owner lookup (`test/helpers/owner-text.ts`); a residue grep proving
  `(five|5)[- ]sections?` no longer matches in the propose body (rc13a's declared exemption closed).
- **Engine**: none. No new command, no new field, no parser change, no new emit.
- **Specs**: six blocks in `orbit-propose-modifications`; fingerprints stamped on the five MODIFIED
  requirements.
- **Exit criteria, measured on this change**: (1) the mapping's Mechanism row and the pointer-not-
  number scenario are in the delta; (2) D-rc13c-5's two residual slots appear verbatim in the ADDED
  requirement's text and the design's Risks points at it; (3) the refuse branch is grep-tested and
  the re-entry requirement in `orbit-explore-modifications` is pointed at, not restated.
- **Not in scope, declared**: removing the reopen path from `orbit-conventions` (Sal's "no avenue"
  applies to propose; retiring explore's reopen scenario is a separate change); the retained
  "five-section" requirement TITLES (the retirement-class sweep rc13a deferred them to); the
  `audit-drift.ts` pointer to that title; the staging-aware engine print (Q-crc-24); the
  stage-state reader (rc15).
