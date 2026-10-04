> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc04b-forward-recommendation

## Premise

An independent reviewer forms a view on whether the work should move forward, and emits only
findings. The view dies in prose — or, more often, is never written at all. R-crc-11(g) makes
that view the INPUT to the readiness judgement rc04a gave a structured home: the archive's
`readiness` record is `formed_against` independent pass TOKENS, and today a token points at
findings and commentary, never at a direction. This stage gives each independent pass a NAMED
SLOT for a forward recommendation — a direction with its reasons — distinct from the engine's
gate verdict, which stays the engine's alone.

**What exists today, measured 2026-10-03.** Every independent pass has a quarantined voice
already: the internal emit's optional `commentary` field and the external file's `## Notes`
section both render VERBATIM into the report's single `### Commentary` slot (D-arc Stage D4,
`orbit-report-rendering`'s `Commentary is a first-class quarantined slot`). The content contract,
stated at BOTH sources, forbids finding counts, gate verdicts and next commands — the engine's
sections — and asks for the pattern behind the findings, what was probed, risk texture. All 124
external returns on the archived trails carry a `## Notes` section (the template asks for one);
33 of them contain a direction-bearing sentence by a crude word match (`ready`, `ship`,
`proceed`, `sound`, `safe to`, `recommend`…) — the practice is real and SPORADIC. The clearest
instance is rc02c's scoped iteration-2 external pass: *"the declaration hoist, conditional spreads
and public reason are sound in the implementation; the residual risk is that the comments and
under-specific assertions do not preserve that result against later edits"* — a ship verdict plus
what would undo it, naming no count, no gate state and no next command, so it already lives
INSIDE the prohibition as written (Q-rc04-c's evidence). Recent fresh passes do the same
implicitly (*"Nothing correctness-grade survived execution"*; *"the mechanism the exit criteria
name … behaved exactly as specified under every input I could construct"*), as the last sentence
of a long commentary where a reader has to find it.

**Why a slot and not a practice.** The readiness judgement (rc04a, R-crc-11(g)) is formed
*knowing what came back*. What came back is today a findings list and a paragraph; whether the
reviewer thought the work should move forward is recoverable only by reading the paragraph for a
sentence that may not be there. A named slot makes the direction reliably PRESENT (exit (1): a
pass without one is incomplete, not quiet), RENDERED under the single-voiced rules (exit (2)) and
carried by the external prompt as a field rather than Notes prose (exit (3)). It also moves
D4's prohibition onto the right axis: the line is JUDGEMENT versus COMPUTATION — the reviewer
may say which way and why; counts, gate state and the command token stay the engine's — not
who-may-speak.

**Three constraints read from the code before anything was decided.**
(1) The word `recommendation` is TAKEN: every finding entry carries a `recommendation` field (the
verbatim fix; the external `**Description**:` body maps to it) and an optional
`recommendation_options` fork list, read by `orbit-address-reviews`' decision-fork path. A
pass-level field cannot reuse the name without two meanings in one record.
(2) The external file FORMAT is owned by `orbit-conventions`' `External-review findings markdown
format` (rc02b moved the Reproduction and Blocks additions there; `orbit-review-external` owns the
PROMPT's statement of it, `orbit-report-rendering` the parse-and-render, and the payload KEY set
is `orbit-emit-composition`'s closed table). The charter's three capabilities were written before
rc02b redrew that ownership — a size check under R-crc-1 is due at THIS exploration, as rc04d's
was, not at propose.
(3) All three external readers already treat an unknown `## <Heading>` as leaving the severity
sections (the trail reader and the trend counter set `section = null`; the renderer's parser sets
`'other'`), so a new section changes no count by construction — the same property `## Blocks`
relied on.

## Mechanism

### D-rc04b-1 — the slot is `direction`, shaped `{disposition, reasoning}`, disposition ∈ {forward, hold}
Domain: every surface that STATES the shape of a pass record — the owner and each copy the slot rides beside `commentary` / `## Notes`
| member | covered by |
|---|---|
| `orbit-emit-composition` — payload field enumeration + the write-gate check | the OWNER of the internal key: a new requirement beside `The review payload carries blocks`, named in the first requirement's field list |
| `references/run-summary-schema.md` (generated with the review skill) | the schema mirror; the schema-table parity test derives the field |
| `orbit-review` — Step 8 "Author the commentary", Step 9 payload sentence, `Internal run summary persisted per mode` | the authoring instruction and its content contract, pointing at the owner |
| `orbit-conventions` — `External-review findings markdown format` | the OWNER of the external section `## Direction` |
| `orbit-review-external` — `Output format specification in prompt`, the prompt's format block | names the section; the prompt is the format's checked copy |
| `src/core/templates/workflows/review.ts` prompt template `## Direction` instruction | the copy the external reviewer actually reads |
| `src/core/templates/workflows/address-reviews.ts` format copy (lines 45–51) | a copy that moves WITH its owner (D-rc04b-6); unchecked by any parity test today |
| `orbit-report-rendering` — the normalizers' read of the field / section | the reader; D-rc04b-4 renders it |
Closure: SOURCED — the member set is the grep over `src/` and `orbit/specs/` for `commentary` and `## Notes` (measured 2026-10-03: review.ts 6 sites, review spec 3, report-rendering spec 13, emit-composition spec 1, conventions 1, review-external spec 1, address-reviews.ts 1); the slot rides beside the existing quarantined voice everywhere a pass record is stated, so a surface naming neither is not a carrier
Moves:
- READ: applied — rc04a's judgement record is `{kind, formed_against, disposition, reasoning, ratified_by}` (emit-composition.ts `JUDGEMENT_COMMON_KEYS`); `recommendation` is every finding's fix field and `recommendation_options` its fork list (`orbit-review`), so the pass-level slot cannot reuse the word
- ENUMERATE: applied — this table; the address-reviews copy was found by the `## Notes` grep, not by the charter, which names three capabilities
- COHERE: applied — the external section's opener `**Disposition**: forward|hold` is a field line recognised ONLY as the section's first non-blank line, the same discipline as `**Reproduction**:` after Description (the field-line rule); the reasoning body runs to the next `##`
- EXECUTE: not applied — no record has yet been written under the shape; the proposal's red tests are the first execution
- FALSIFY: applied — the token and the prose can disagree (`forward` over hold-shaped reasons); the slot does not police that (R-crc-10), the in-context reaction reads both, and the readiness record is where the disagreement is resolved
- CONFORM: applied — R-crc-11 IMPACT ("if one ships a vocabulary for recorded readiness the other adopts it"): `disposition`/`reasoning` are rc04a's words with a kind-specific value set, as rc04a's own two kinds already have; R-crc-14: the external format is stated once in `orbit-conventions`, every other site names it
- FEASIBILITY: not applied — two fields on one record
- CONSUME: applied — the renderer reads both fields (D-rc04b-4); Q-crc-24's accepted-passes surface is the natural consumer of the token and is NAMED, not built (Considered & out); the gate reads neither
- INVOKE: applied — fires on every independent pass: the write gate for an internal emit, the prompt for an external return

### D-rc04b-2 — owed by the INDEPENDENT classes in every mode; optional on in-context
Domain: reviewer class × review mode
| member | covered by |
|---|---|
| fresh × proposal | owed — the write gate refuses the emit without it |
| fresh × system | owed — same |
| fresh × architecture | owed at the write gate; no render surface exists for the architecture trail, so the body's interim hand-rendered report prints the Direction line |
| external × proposal | owed — absence MARKED at render (D-rc04b-3), never refused |
| external × system | owed — same |
| external × architecture | not a cell that occurs: `--reviewer external` requires `--as proposal\|system` (a clean usage error) |
| in-context × proposal / system / architecture | optional; shape-checked when present; absent omits the section |
Closure: DERIVED — the product of two closed enums, `ReviewerClass` (three values, trail.ts line 13 — the citation read line 238, the inference branch, until the 2026-10-03 proposal walk) and `ReviewMode` (three values, emit-composition.ts mode check); one cell is foreclosed by the command's own usage rule
Moves:
- READ: applied — R-crc-11(f): the in-context pass is a REACTION, not a second search; `isIndependent` in gates.ts (line 95) is already the two-class predicate; the external/architecture refusal is in the review body's instructions literal
- ENUMERATE: applied — this table, nine cells, one foreclosed
- COHERE: applied — the write gate and the renderer's absence mark key on the SAME two-class predicate, so "owed" has one definition; exporting `isIndependent` rather than restating it is the implementation note
- EXECUTE: not applied — no emit under the rule yet
- FALSIFY: applied — an in-context pass cannot become independent by writing a direction: class is the emit's `reviewer_class`, the slot changes nothing the gate reads
- CONFORM: applied — R-crc-11(f) and (g); R-crc-13 (the gate never reads the slot, so a judgement field cannot move a verdict)
- FEASIBILITY: not applied — one predicate call at two sites
- CONSUME: applied — the readiness record's `formed_against` cites independent tokens only, so every token it can cite now points at a record that owes a direction; in-context records stay citable by nothing, as before
- INVOKE: applied — the write gate on every `review` emit (keyed on `reviewer_class`); the renderer on every external pass

### D-rc04b-3 — incompleteness is two-tier: REFUSED where produced, MARKED where it cannot be, and never read by the gate
Domain: every engine reader of a pass record (`review-<mode>-<TS>.json`, `external-<mode>-<TS>.md`)
| member | covered by |
|---|---|
| the write gate (`emit-composition.ts`) | REFUSES a `review` emit of an independent class with no `direction`, or a `direction` of the wrong shape at ANY class — presence and shape only, naming the field |
| the trail reader (`trail.ts` → gates) | reads NOTHING new: an unknown `##` leaves the severity sections (line 414); the slot never enters the gate's inputs |
| the renderer's internal normalizer (`report-render.ts`) | reads the field when present; a wrongly shaped one is a validation failure like `commentary` mistyped |
| the renderer's external parser (`normalizeExternalPass`) | reads `## Direction`; absence on an external pass renders the section with the mark `[no direction]`; a section whose opener is not `**Disposition**: forward\|hold` renders `[direction malformed]` — the file is NEVER rejected for it |
| the trend counter (`lenientExternalCounts`) | unchanged: any other `##` sets `section = null` (lines 21–22 of the function) |
| `countConfidentExternalPasses` (orientation's ⟲N) | unchanged: counts by header + three severity sections |
| the boot renderer (`boot-render.ts`) | matches filenames only (line 57); reads no field |
| the walk's `--from-file` read (the address-reviews body) | the AI's read, per the body's format copy: `## Direction` is not a finding and is never walked (D-rc04b-6) |
Closure: SOURCED — `grep -rln` over `src/core` for the two filename grammars and `reviewer_class` (measured 2026-10-03: report-render, emit-composition, orientation, trail, gates, types, boot-render) plus the one body that reads the external file by instruction
Moves:
- READ: applied — each reader's handling of an unknown `##` heading was read, not assumed: trail.ts 414 (`section = null`), the trend counter's reset, the renderer's `'other'` state; rc02b's `validateReviewEvidence` is the write-gate precedent (presence + type, never content)
- ENUMERATE: applied — this table; `boot-render.ts` matched the filename grep and was READ to confirm it consumes no field
- COHERE: applied — refuse-at-write and mark-at-render are ONE rule with two tiers, the rc02b asymmetry: an internal emit can be refused before it exists; an external file already exists and refusing it would let a judgement field decide whether a pass COUNTS, which is the gate ruling on prose
- EXECUTE: not applied — the renderer path for `## Direction` has not been run; a constructed file through `orbit status --report` on a scratch change is the proposal's red test
- FALSIFY: applied — the mark is weaker than a refusal, and an external reviewer who omits the section leaves a pass the gate counts in full; the charter's "incomplete rather than quiet" is met by VISIBILITY in the report, which is what the in-context reaction and the readiness author read — the residual is a reviewer who never opens the report, and nothing here reaches them
- CONFORM: applied — R-crc-10 (a presence/shape check is fully observable; whether the direction is RIGHT is not); R-crc-13 (a gate reports, it never rules — the gate reads no judgement); rc02b's `[unreproduced]` precedent (marked by absence, never by date)
- FEASIBILITY: not applied — one check in the write gate, one section state in the parser
- CONSUME: applied — the walk's read is told the section is not a finding (the body copy moves with the owner); the readiness author reads the report, where the mark is visible
- INVOKE: applied — the write gate on every emit; the renderer on every `--report`; nothing else needs to fire because nothing else reads it

### D-rc04b-4 — renders as `### Direction` between Suppressed and Commentary, under the content contract
Domain: the report's section order (`renderReviewReport`, fixed and byte-stable)
| member | covered by |
|---|---|
| header | unchanged |
| trend line | unchanged |
| scorecard (internal only) | unchanged |
| `### Blocks` | unchanged |
| `### Findings` | unchanged |
| `### Suppressed` | unchanged |
| `### Direction` | NEW — first line `Disposition: forward` / `Disposition: hold`, then the reasoning blockquote-contained; for an independent pass with no record, the section renders the mark instead; for an in-context pass with none, omitted |
| `### Commentary` | unchanged, now second-to-last |
| the engine tail (`---`, gate, position, `Ready when you are:`) | unchanged, ALWAYS last — the structural backstop |
Closure: SOURCED — the order is one function's block list (report-render.ts lines 654–750, read 2026-10-03); the five `.golden.md` goldens under `test/fixtures/report-golden/` pin it (14 files; corrected at the 2026-10-03 proposal walk)
Moves:
- READ: applied — the render order and its blockquote-containment rule read from `renderReviewReport`; D4's design D2 read for why commentary is quarantined INPUT variance and the tail renders last
- ENUMERATE: applied — this table, nine sections
- COHERE: applied — the slot sits INSIDE the quarantined zone above the tail, so a contract violation ("forward — the gate should pass") can mislead but never be the report's final word, the same backstop commentary has; the content contract moves to the axis Q-rc04-c named — the reviewer may state WHICH WAY and WHY; counts, gate state and the command token stay the engine's
- EXECUTE: not applied — no golden yet carries the section
- FALSIFY: applied — a reviewer can smuggle gate vocabulary into the reasoning; the renderer does not police content (as for commentary), the contract is stated at both sources, and a near-miss golden pins the delimiter exactly as D4 did for commentary
- CONFORM: applied — D4's D-d4-1/2 (one quarantined zone, engine tail last); R-crc-13; the `Ready when you are:` eligibility grammar untouched
- FEASIBILITY: applied — one golden moves (`external-pass.golden.md`, the only independent-pass fixture; the other four are in-context) and one near-miss fixture is added — corrected 2026-10-03 at the proposal walk from "14 goldens move", which counted files, not goldens
- CONSUME: applied — the in-context reaction (R-crc-11(f)) and the readiness author (R-crc-11(g)) read the report; the `--report` surface is the one place a human sees every pass framed identically
- INVOKE: applied — every report render of a change-mode pass

## Decisions

- **2026-10-03 — D-rc04b-1: the slot is `direction`, shaped `{disposition, reasoning}`, with `disposition` ∈ {`forward`, `hold`}** (AI, under R-crc-3 — method). The word
  `recommendation` is TAKEN at the finding level (the fix body; `recommendation_options` the fork
  list), `verdict` is the gate's word throughout the specs, and R-crc-11's IMPACT note says a
  second vocabulary for recorded readiness must not be invented: rc04a's judgement record already
  spells a judgement as `disposition` + `reasoning` with a kind-specific value set, so the direction
  adopts the shape and adds its own two values. Two, not three: `forward` and `hold` are the two
  answers to "should this move forward"; routing an expansion to architecture is the in-context
  AI's call under R-crc-11(b), never the reviewer's (Considered & out). Internal: a top-level
  `direction: {disposition, reasoning}` object on the `review` payload. External: a `## Direction`
  section whose first non-blank line is `**Disposition**: forward` or `**Disposition**: hold` and
  whose remaining body is the reasoning, placed between `## Blocks` and `## Notes`.
  Kind: rule
  Disposition: live

- **2026-10-03 — D-rc04b-2: the slot is OWED by the independent classes (`fresh`, `external`) in every mode, and OPTIONAL on `in-context`** (AI). R-crc-11(f) says the
  in-context pass is a reaction, so its direction would be a view formed knowing the independent
  ones — the readiness record's job, not a third voice beside it. The rule keys on `reviewer_class`,
  never on mode: an architecture-mode fresh pass owes it at the write gate even though no render
  surface covers that trail yet. One predicate (`isIndependent`, already in gates.ts) defines "owed"
  at both the write gate and the renderer.
  Kind: rule
  Disposition: live

- **2026-10-03 — D-rc04b-3: "incomplete" is TWO-TIER — the write gate REFUSES an independent internal emit without the slot, the renderer MARKS an external file's absence, and the gate reader never reads it** (AI). rc02b's evidence-tax
  pattern, applied to a judgement field: enforce where the record is produced (presence and shape
  only, R-crc-10), surface where it cannot be (an external file already exists; refusing it would make
  whether a pass COUNTS depend on a prose field, which is the gate ruling on judgement — R-crc-13).
  Two marks on the external side, `[no direction]` and `[direction malformed]`, never a rejection
  and never a re-reading of the file by the trail reader. Nothing in `trail.ts` changes, and `gates.ts`
  changes by exactly the `export` keyword on `isIndependent` (corrected 2026-10-03 at the proposal walk, Sal: A — the
  zero-diff claim was a proxy for "the gate reads nothing", which the three-readers test carries).
  Kind: rule
  Disposition: live

- **2026-10-03 — D-rc04b-4: the report renders `### Direction` as its own section between Suppressed and Commentary, inside the quarantined zone, under a content contract that narrows D4's on the JUDGEMENT-versus-COMPUTATION axis** (AI; resolves Q-rc04-c's
  standing recommendation into mechanism). First line `Disposition: <token>`, reasoning
  blockquote-contained, engine tail still last. The contract at both sources: the direction says
  WHICH WAY and WHY; it never states finding counts, the gate's state, or a command token — those
  stay the engine's. Commentary's own contract is unchanged. A near-miss golden pins the
  delimiter, as D4's did for commentary.
  Kind: rule
  Disposition: live

- **2026-10-03 — D-rc04b-5: NO migration — a prior-generation pass renders marked by absence, never by date** (AI; rc02b's precedent for the 99 unreproduced CRITICALs). Every archived
  external return and fresh emit lacks the slot; on an active trail, an independent pass written
  before the stage lands renders `[no direction]`, which is true. The `--report` surface cannot
  address an archived change (Q-crc-26), so the archived 124 render nowhere.
  Kind: scope
  Disposition: live

- **2026-10-03 — D-rc04b-6: the address-reviews body's copy of the external format moves WITH its owner, with no triage behaviour added and no `orbit-address-reviews` delta** (AI; D-rc16-3's pattern). The walk reads
  findings and lists blocks; `## Direction` is neither and is never walked. Showing the direction at
  triage would be a second reader worth having, and it is a GROWTH (R-crc-11(b)) that adds a sixth
  capability for a convenience — declined here, named for Q-crc-24's surface or a later rider.
  The copy is unchecked by any parity test today (only the severity ladder and the content-fidelity
  pins exist); that is a named residual of this stage, not a fix inside it.
  Kind: scope
  Disposition: live

- **2026-10-03 — D-rc04b-7: the stage is DECLARED at FIVE capabilities against R-crc-1's ceiling of three, under R-crc-9's declare branch** (Sal: *"declare at five"*; resolves Q-rc04b-a).
  `orbit-review`, `orbit-review-external`, `orbit-report-rendering` (the charter's three),
  `orbit-conventions` (owner of the external format since rc02b) and `orbit-emit-composition`
  (enumerates the payload fields; one requirement per new field since `blocks`). Requirements
  ~8–10 and changed bytes small; capabilities is the only binding dimension. Not split, because
  neither candidate seam exists: internal-from-external puts the renderer in both halves and leaves
  one trail with two generations of the rule; produce-from-render ships a slot nothing renders. The
  declaration travels into `proposal.md` at promotion and is recorded in the program doc's status
  log at the next architect session (rc02b's precedent at six).
  Kind: scope
  Disposition: live

## Open questions

(none — Q-rc04b-a resolved 2026-10-03 into D-rc04b-7)

## Considered & out

- **2026-10-03 — naming the slot `recommendation` or `verdict`.** `recommendation` is every
  finding's fix field (and `recommendation_options` its fork list, read by the walk's decision-fork
  path); one record carrying the word at two levels with two meanings is the defect class R-crc-14
  exists for. `verdict` is the gate's word in every spec ("gate verdict") and the direction is
  precisely NOT that. Rejected for `direction` (D-rc04b-1).
- **2026-10-03 — a third disposition, `route-to-architecture` (or `expand`).** R-crc-11(b): a
  finding that requires expansion is kicked back to architecture and "the AI makes that call" — the
  in-context AI, with the context the reviewer lacks. A reviewer who thinks so writes `hold` and
  says why. Rejected; the set stays two.
- **2026-10-03 — REJECTING an external file that lacks `## Direction` (making it a non-pass).**
  Would make the gate's pass set depend on a judgement field's presence: a reviewer's silence on
  direction would un-count their findings. R-crc-13. Rejected for the render-time mark (D-rc04b-3).
- **2026-10-03 — telling the archive body to read each cited pass's direction when forming the
  readiness record.** A sixth capability (`orbit-archive-modifications`) for an instruction the
  readiness author already follows by reading the report; the stages are loosely coupled by
  construction (a readiness record cites tokens whether or not they carry directions). Rejected
  here; Q-crc-24's accepted-passes surface printing `{token, class, mode, disposition}` is where
  the machine-readable form earns its consumer.
- **2026-10-03 — building Q-crc-24's print surface in this stage.** It is the natural consumer of
  the token, and it is its own small stage (the program doc says so); adding it here is growth over
  a stage already over the ceiling. Named, not built.
- **2026-10-03 — prose-only (no token), as rc02c's sentence was.** Reliably present but readable
  by nothing but a human; a slot that cannot be printed beside its token is half a record. Rejected
  for token + reasoning (D-rc04b-1).

## References

- `orbit/architecture/clean-up-review-cycle.md` — the rc04b stage declaration (Goal G1; touches
  `orbit-review`, `orbit-review-external`, `orbit-report-rendering`; three exit criteria); the
  rc04 parent's charter and split record; R-crc-11 (g) and (f); R-crc-1; R-crc-9; R-crc-14;
  Q-crc-24 (an engine surface printing the accepted independent passes — the natural consumer of
  a machine-readable direction).
- `orbit/changes/archive/2026-09-21-rc04a-judgement-record/explore.md` — the SHARED source for
  rc04a/b/c: D-rc04-8 (independent reviews carry a forward recommendation), D-rc04-6 (the
  in-context pass is a reaction), D-rc04-13 (which judgements qualify), Q-rc04-c (how far D4's
  commentary prohibition narrows — standing recommendation: judgement-versus-computation).
- `orbit/changes/archive/2026-09-21-rc02c-confirmation-semantics/.orbit-runs/external-system-2026-09-21T15-17-10Z.md`
  — the Notes body carrying the unprompted forward recommendation the charter quotes.
- `src/core/emit-composition.ts` — `COMMANDS.review.payloadFields` (the closed key set;
  `commentary` is a member), `validateReviewEvidence` (rc02b's write-gate precedent: a finding
  field refused by presence and shape, never by content), `JUDGEMENT_KINDS_BY_COMMAND`.
- `src/core/report-render.ts` — `NormalizedReviewPass.commentary` (internal field / external
  `## Notes`), `normalizeExternalPass` (section states `notes | blocks | other`),
  `renderReviewReport` (fixed order; Commentary then the engine tail LAST), `lenientExternalCounts`
  (the third external reader).
- `src/core/artifact-graph/trail.ts` — `TrailPass` (token, class, mode, counts, findings — no
  prose field), the external parse that leaves the severity sections on any other `##`.
- `src/core/templates/workflows/review.ts` — Step 8 "Author the commentary", the reference prompt
  template's `## Notes` instruction (line ~648), the payload composition sentence (Step 9).
- `orbit/specs/orbit-report-rendering/spec.md` — `Commentary is a first-class quarantined slot`,
  `One grammar for internal and external passes`, `Reproduction renders beside the recommendation
  and its absence is marked` (the `[unreproduced]` precedent for marking absence at render).
- `orbit/specs/orbit-conventions/spec.md` — `External-review findings markdown format` (owner of
  the file shape), `Severity ladder` (the one-paragraph CHECKED MIRROR precedent in the prompt).
- `orbit/specs/orbit-review/spec.md` — `Internal run summary persisted per mode` (the
  `commentary` contract), `Optional recommendation_options field on finding entries` (the name
  collision), `Engine-rendered report output with loose-form engagement`.
- `orbit/specs/orbit-review-external/spec.md` — `Output format specification in prompt`, `Prompt
  written to versioned file with chat invocation snippet`.
- `orbit/changes/archive/2026-07-30-d4-review-consistency/design.md` D2 — why commentary is
  quarantined INPUT variance and the engine tail renders last as the structural backstop.
- `test/fixtures/report-golden/` — 14 fixtures; any render-order change moves the goldens.
