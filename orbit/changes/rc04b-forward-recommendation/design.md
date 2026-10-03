## Context

The review cadence produces two judgements and, after rc04a, records one of them. The IN-CONTEXT
AI's readiness judgement lives in the archive emit's `judgements` array, `formed_against` the
independent pass tokens it read. The INDEPENDENT reviewers' view — should this move forward — has no
slot: an internal pass emits findings and an optional `commentary`; an external return carries
findings and a `## Notes` body; both render VERBATIM into the report's one quarantined
`### Commentary` section (D-arc Stage D4), under a contract that forbids counts, gate verdicts and
next commands. A direction is permitted there and sometimes appears (rc02c's scoped iteration-2 pass;
33 of 124 archived returns by word match), always as prose a reader has to find. See `explore.md`'s
Premise for the measurement and the three code-read constraints the design rests on.

Three facts from the code bound the design. (1) `recommendation` is every finding's fix body and
`recommendation_options` its fork list, read by the walk's decision-fork path. (2) The external file
FORMAT is owned by `orbit-conventions` since rc02b; the prompt in `orbit-review-external`, the walk's
`--from-file` reference and the review body's template are its copies — the prompt and the
review-external reference are already held byte-equal by `test/core/severity-ladder-parity.test.ts`.
(3) All three engine readers of an external file — the trail reader, the renderer's parser and the
trend counter — treat an unknown `## <Heading>` as leaving the severity sections, so a new section
moves no count by construction (the property `## Blocks` relied on).

## Goals / Non-Goals

**Goals:**
- Exit (1): an independent pass without a direction is INCOMPLETE — refused at the write gate where
  it is produced internally, visibly marked in the report where an external file cannot be refused.
- Exit (2): the direction RENDERS under the existing single-voiced rules — its own section inside the
  quarantined zone, the engine tail still last, asserting no gate state.
- Exit (3): the external prompt template carries it as a NAMED FIELD (`## Direction` with a
  `**Disposition**:` opener), not as Notes prose.
- The slot adopts rc04a's recorded-judgement vocabulary so the two records read as one family.

**Non-Goals:**
- Reading the direction in the archive body when forming the readiness record — the stages are
  loosely coupled by construction; the readiness author reads the report (`explore.md`, Considered & out).
- Printing the direction beside its token on an engine surface — Q-crc-24's accepted-passes print is
  the natural consumer and is its own small stage; this change names it, never builds it.
- Any change to `trail.ts` or `gates.ts`: the gate reads no judgement (R-crc-13).
- A triage behaviour in the walk; a third disposition; a migration of prior-generation passes.

## Decisions

### D1. The slot is `direction: {disposition, reasoning}`, disposition ∈ {`forward`, `hold`} (explore D-rc04b-1)

`recommendation` is taken at the finding level and `verdict` is the gate's word in every spec. R-crc-11's
impact note says a vocabulary for recorded readiness is adopted, not reinvented: rc04a's judgement
record spells a judgement as `disposition` + `reasoning` with a kind-specific value set, so the
direction takes the shape and adds its own two values. Two, not three — `forward` and `hold` are the
two answers to "should this move forward"; routing an expansion to architecture is the in-context
AI's call under R-crc-11(b), so a reviewer who thinks so writes `hold` and says why. External form: a
`## Direction` section between `## Blocks` and `## Notes`, first non-blank line
`**Disposition**: forward` | `**Disposition**: hold`, remaining body the reasoning (runs to the next
`##`). The opener is a field line recognised ONLY as the section's first non-blank line — the format's
field-line discipline, as for `**Reproduction**:` after Description.

### D2. Owed by `fresh` and `external` in every mode; optional on `in-context` (explore D-rc04b-2)

R-crc-11(f): the in-context pass is a reaction, so its direction would be a view formed knowing the
independent ones — the readiness record's job, a third voice otherwise. The rule keys on
`reviewer_class`, never on mode: an architecture-mode fresh pass owes it at the write gate even though
no render surface covers that trail (the body's interim hand-rendered shape prints a `Direction:` line).
ONE predicate defines "owed": `gates.ts`'s `isIndependent` (today module-private) is exported and
called from the write gate and the renderer — never restated. The external normalizer sets `reviewerClass: "external"` on the normalized pass (today it carries only `reviewerName`/`reviewerDate`), so the renderer's single `isIndependent` call covers both genres; the field narrows from `string` to `ReviewerClass` (walk 1, fresh W5).

### D3. Incompleteness is two-tier, and the gate never reads it (explore D-rc04b-3)

rc02b's evidence-tax pattern applied to a judgement field. Where the record is produced, the write
gate refuses: an independent-class `review` payload with no `direction`, and a present `direction`
at ANY class whose `disposition` is not in the closed set or whose `reasoning` is not a non-empty
string — presence and shape only (R-crc-10), `mode` never read, naming the field. Where the record
already exists, the renderer marks: an independent pass with no direction renders
`### Direction` carrying `[no direction]`; an external `## Direction` whose opener is not the
production renders `[direction malformed]`; an in-context pass with none omits the section. Five edge cases decided at walk 1 (fresh W7), owned by the conventions format: a conforming opener with no body, a heading with no non-blank line, and a second `## Direction` section are each MALFORMED (a direction without reasoning is not one; two sections are two claims on one truth); the section is read wherever it sits — the Blocks-then-Notes order is advisory; the heading matches case-insensitively like its siblings. A `reviewer_class` outside the three values is refused by the write gate's direction check in every mode (fresh S1: the architecture-mode gate validated the class nowhere, so a typo would read as not-owed). The file is
NEVER rejected for it — refusing an external return would make whether a pass COUNTS depend on a
judgement field, the gate ruling on prose (R-crc-13). `trail.ts` changes by zero bytes and `gates.ts` by exactly the `export` keyword on `isIndependent` (walk 1, Sal: A — the honest measurement replaces the zero-diff proxy; the three-readers test carries the claim);
a test pins that `## Direction` moves no count in the trail reader, the trend counter and
`countConfidentExternalPasses`.

### D4. Renders as `### Direction` between Suppressed and Commentary, under the judgement-versus-computation contract (explore D-rc04b-4; resolves Q-rc04-c)

Fixed order becomes: header → trend → scorecard → Blocks → Findings → Suppressed → **Direction** →
Commentary → engine tail LAST. The section's first line is `Disposition: forward` / `Disposition: hold`
(a plain label line the engine prints — record-sourced text never sits at column 0); the reasoning
follows under blockquote containment. Content contract, stated at both sources (Step 8 and the prompt
template): the direction says WHICH WAY and WHY; it never states finding counts, the gate's state or a
command token — those stay the engine's. Commentary's contract is unchanged. OWNERSHIP (walk 1, fresh W4): the content contract is OWNED by `orbit-report-rendering`'s ADDED Direction requirement, where Commentary's contract already lives; the shape is OWNED by `orbit-emit-composition`'s ADDED requirement; every other spec site names the owner and states only its local consequence (R-crc-14) — the prompt template's one-sentence instruction is the reviewer-facing form of the contract, carried because an external reviewer has no specs to resolve. A violation can mislead
but never be the report's final word — the same structural backstop commentary has. A near-miss golden
pins the delimiter as D4's did for commentary.

### D5. No migration; absence marked, never dated (explore D-rc04b-5)

Every prior-generation independent pass renders `[no direction]`, which is true of it. On internal
passes absence is EXACTLY the prior-generation set, because the write gate refuses new ones; on
external passes the file could not be refused. The 124 archived returns render nowhere (`--report`
cannot address an archived change, Q-crc-26).

### D6. The walk's format copy moves with its owner; no triage behaviour; no `orbit-address-reviews` delta (explore D-rc04b-6)

D-rc16-3's pattern: the address-reviews body's expected-file-format block gains the `## Direction`
section in the same task as the conventions delta, stating that it is never walked. Listing the
direction at triage would be a second reader worth having and is GROWTH (R-crc-11(b)) for a
convenience — declined; Q-crc-24's surface is where the machine-readable form earns its consumer. The
copy is unchecked by any parity test today (only the severity ladder and the content-fidelity pins
exist) — a named residual below, not a fix here.

### D7. Five capabilities, declared (explore D-rc04b-7, Sal)

See proposal.md's size paragraph. The declaration is recorded in the program doc's status log at the
next architect session, as rc02b's was at six.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination (shape) |
|---|---|---|---|
| D-rc04b-1 | SOURCED | live rule | `orbit-emit-composition` › ADDED `The review payload carries direction` (the internal shape — SENTENCE naming the closed set); `orbit-conventions` › `External-review findings markdown format` (the `## Direction` section and its opener — GRAMMAR); `orbit-review-external` › `Output format specification in prompt` and `Prompt written to versioned file with chat invocation snippet` (the reference template's fence — the copy the parity test holds against the shipped prompt) and `orbit-review` › `Internal run summary persisted per mode` (the copies that name the owner — SCENARIO SET, one scenario each); the domain table's eight carriers land one each across those four plus `orbit-report-rendering` › `One grammar for internal and external passes` |
| D-rc04b-2 | DERIVED | live rule | `orbit-emit-composition` › ADDED `The review payload carries direction` — the class × mode table as a SCENARIO SET (owed fresh, owed external, optional in-context, architecture-mode fresh checked identically, the foreclosed external × architecture cell by pointer to the review body's usage rule) |
| D-rc04b-3 | SOURCED | live rule | `orbit-emit-composition` › ADDED `The review payload carries direction` (the refusal tier — SCENARIO SET); `orbit-report-rendering` › ADDED `Direction renders as its own section and its absence is marked on independent passes` (the mark tier and the never-rejected clause — SCENARIO SET); `orbit-conventions` › `External-review findings markdown format` (counters ignore the section — SENTENCE); the reader table's eight members: write gate, trail reader, two normalizers, trend counter, `countConfidentExternalPasses`, boot renderer and the walk's read each land as a scenario or a named no-change |
| D-rc04b-4 | SOURCED | live rule | `orbit-report-rendering` › `Report grammar — the frame sandwiches the commentary` (the section order — SENTENCE, nine sections) and ADDED `Direction renders…` (the line form, the containment, the content contract — SCENARIO SET); `orbit-review` › `Internal run summary persisted per mode` (the contract at the internal source) |
| D-rc04b-5 | — | `Kind: scope` | not carried — history; D5 above and the ADDED render requirement's prior-generation scenario |
| D-rc04b-6 | — | `Kind: scope` | not carried — history; D6 above; the unchecked copy is a Risk below |
| D-rc04b-7 | — | `Kind: scope` | not carried — history; proposal.md's size paragraph |

No BOUNDED entry; no `key_defects`; the engine's parse of the file on 2026-10-03 (the boundary emit
`explore-2026-10-03T22-09-04Z.json`) read 4 rules accounted, 0 open, which my reading of the four
entries against the grammar agrees with — every entry has its ID-matched owner, a Domain line and
table, a closure token from the set, no residual slots, and nine move lines each once.

## Touchpoints

- `src/core/emit-composition.ts` — `direction` added to `COMMANDS.review.payloadFields`; a new `validateReviewDirection` beside `validateReviewEvidence` (owed-by-class presence, closed-set disposition, non-empty string reasoning; `mode` never read).
- `src/core/artifact-graph/gates.ts` — `isIndependent` EXPORTED (no behaviour change; the one predicate for "owed").
- `src/core/report-render.ts` — `NormalizedReviewPass.direction?`; the internal normalizer passes a well-shaped `direction` through and fails a mis-shaped one naming the field; `normalizeExternalPass` gains a `direction` section state reading the `**Disposition**:` opener and the reasoning body; `renderReviewReport` prints `### Direction` between Suppressed and Commentary with the two marks.
- `src/core/artifact-graph/trail.ts` — NO change (pinned by test).
- `src/core/templates/workflows/review.ts` — Step 8 authors the direction under the contract; Step 9's field enumeration; `references/run-summary-schema.md`'s block and field note; the prompt template's `## Direction` section between `## Blocks` and `## Notes`; the architecture-mode interim shape's `Direction:` line.
- `src/core/templates/workflows/address-reviews.ts` — the expected-file-format block gains `## Direction` (never walked).
- `test/core/emit-composition*.test.ts` + `test/core/report-render*.test.ts` + `test/core/trail-rc02b.test.ts` — the red tests of tasks 1.1–1.4.
- `test/core/emit-schema-parity.test.ts` — the nested allowlist learns `direction` (`disposition`, `reasoning`).
- `test/core/severity-ladder-parity.test.ts` — unchanged in code; its byte-equality of the two output-format blocks binds task 3.2 to the review-external delta's `Prompt written…` fence (install the template's `## Direction` section FROM the delta's text, as rc02b's 5.1 did).
- `test/core/templates/orbit-content-fidelity.test.ts` — Step 8/9, the template section, the walk copy.
- `test/fixtures/report-golden/*.golden.md` — the goldens whose pass is independent gain the section; one new near-miss fixture.
- `CLAUDE.md` — the ACTIVE program section's rc04b paragraph.
- `orbit/specs/*/spec.md` — five capabilities, synced at archive.

## Risks / Trade-offs

- [The mark is weaker than a refusal: an external reviewer who omits `## Direction` leaves a pass the
  gate counts in full] → by design (R-crc-13): "incomplete rather than quiet" is met by VISIBILITY in
  the report the in-context reaction and the readiness author read; the residual is a reviewer who
  never opens the report, and nothing here reaches them (explore D-rc04b-3, FALSIFY).
- [The token and the prose can disagree — `forward` over hold-shaped reasons] → the slot does not
  police it (R-crc-10); the in-context reaction reads both and the readiness record is where the
  disagreement is resolved (D-rc04b-1, FALSIFY).
- [Gate vocabulary smuggled into the reasoning] → the contract is stated at both sources; the renderer
  places the slot verbatim and the engine tail renders last; a near-miss golden pins the delimiter.
- [The address-reviews format copy is unchecked by any parity test] → named residual (D6); it moves
  with its owner in the same task; a parity pin over that copy is a rider for whichever stage next
  touches the walk body.
- [The one independent-pass golden (`external-pass.golden.md`) gains the marked section and a near-miss
  fixture is added; the other four `.golden.md` files are in-context passes and stay byte-unchanged] →
  expected and recorded in the golden test's doc comment, as rc02b's `[unreproduced]` prefix was; the
  determinism test asserts against the same goldens (count corrected at walk 1, fresh S2).
- [`isIndependent` exported from a gate-model module into the emit surface and the renderer] → the
  function is pure and its set is the cadence vocabulary's; exporting it is the alternative to a second
  statement of the two-class set (R-crc-14).

## Alternatives considered

(From `explore.md`'s Considered & out, 2026-10-03.)

- **Naming the slot `recommendation` or `verdict`.** The first is every finding's fix field at another
  level; the second is the gate's word. Rejected for `direction`.
- **A third disposition, `route-to-architecture`.** R-crc-11(b) makes that the in-context AI's call;
  a reviewer writes `hold` and says why. Rejected; the set stays two.
- **Rejecting an external file that lacks `## Direction`.** Would let a judgement field decide whether a
  pass counts (R-crc-13). Rejected for the render-time mark.
- **Telling the archive body to read each cited pass's direction.** A sixth capability for an
  instruction the readiness author already follows by reading the report; the stages are loosely coupled
  by construction. Rejected; Q-crc-24's surface is where the machine-readable form earns its consumer.
- **Building Q-crc-24's print surface here.** Its own small stage; growth over a stage already over the
  ceiling. Named, not built.
- **Prose-only, as rc02c's sentence was.** Readable by nothing but a human; half a record. Rejected
  for token + reasoning.
