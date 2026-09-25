> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc13b-explore-maturity-signal

## Premise

The explore readout's top rung ASSERTS readiness on evidence that cannot support it. Today the
maturity grid (`orbit-run-summary-emit`, `Named-mode explore recommendation by maturity`; computed in
`src/core/parsers/explore-counter.ts`) grades an exploration by two counts — top-level list items
under `## Decisions` and under `## Open questions` — and fires `Mature` ("ready to formalize") at
four or more decisions and at most one open question. Confidence rises with heading count. The
record shows the defect firing on the convention's own artifact: `bounded-closure-semantics`
rendered Mature at five decisions and zero questions while the file held only the hinge (D-bcs-10's
FALSIFY move).

rc13a shipped what this stage needs to read: a Mechanism section with one entry per live rule, a
`Closure:` token (DERIVED / SOURCED / BOUNDED), two residual slots iff BOUNDED, nine move lines, and
a status header with two tokens (`exploring.` / `concluded <date>.`). No engine code shipped — the
format is proven by a generated-surface test over two exemplars, and this stage's parser is the
grammar's SECOND extension, kept honest by the shared fixture (D-bcs-11).

What this exploration must settle: the rung's WITHHOLDING predicate over the six entry states
D-bcs-10 enumerated (form only — never whether an enumeration is true); the FIFTH rung for a
concluded exploration (header read FIRST, recommends neither verb, renders the `Re-entry:` slot);
what the top rung REPORTS once it stops vouching (R-crc-13 applied to the grid); the bounded render
of the open-rule list; the honest residual that ENGINE-COMPUTED relocates self-classification from
payload to file rather than removing it; and the parity between the surface test's regexes and this
parser — one constant, or two checked extensions.

## Mechanism

### D-rc13b-1 — the fifth rung's recommendation is prose that names no command
Domain: every engine reader and writer of an EXPLORE emit's `next_recommended`
| member | covered by |
|---|---|
| `src/core/emit-composition.ts` (writer, the `explore` case) | composes the string from the header token and the `Re-entry:` slot |
| `src/core/orientation.ts` (reader: `typeof === 'string'` check, then verbatim render on the row's `next` line) | a string; renders as written |
| `src/core/report-render.ts` (asserts `next_recommended` equals the deterministic pointer) | REVIEW emits only — never reads an explore trail |
| the audit-drift `deferred` read (`emit-composition.ts:1316`) | reads the CHANGE trail's prior emits, never an explore trail |
| the spine definition (`orbit-conventions`: "verbatim recommendation, suitable for best-effort parse") | prose is legal; the archive emit already fills the field with prose naming no single command |
Closure: SOURCED — `grep -rn next_recommended src/core --include='*.ts'` excluding `templates/`, 2026-09-25; five sites, each classified
Moves:
- READ: applied — the spine text, the archive emit's example value, and orientation's explore branch were read; the maturity spec's "parses into command/args" sentence describes no code that exists (D-rc13b-6)
- ENUMERATE: applied — this table, from the grep
- COHERE: applied — D-bcs-10 says the rung recommends neither verb; a field whose contract is "verbatim, best-effort parse" can carry that without a second contract
- EXECUTE: not applied — the string is composed at rc13b's apply; orientation's render of an arbitrary string is exercised by its existing tests over the recorded trail
- FALSIFY: applied — a future reader that DOES parse a leading `/orbit:` token would see no command on the fifth rung; that is the correct reading of a rung that points at nothing, and the archive emit set the precedent
- CONFORM: applied — R-crc-13 (report, never rule); D1's eligibility framing (no imperative); R-crc-11's instruction to read `judgements` before coining a word — `judgements` is an archive-emit record of a BELIEF, and the concluded record is a file-derived FACT, so no vocabulary is borrowed and none coined beyond the two tokens rc13a already shipped
- FEASIBILITY: not applied — one string
- CONSUME: applied — orientation renders it verbatim and validates only that it is a string (`orientation.ts:127`); `--json` carries it as `next`
- INVOKE: applied — fires on every explore emit whose file's first non-blank line matches the `concluded` production; header read FIRST (D-bcs-10)

### D-rc13b-2 — the grid reads header first, keeps the counts, and changes the verb in exactly one cell
Domain: every cell of the rung table — header × decisions × open questions × open rules
| member | covered by |
|---|---|
| header `concluded` (any counts, any rules) | CONCLUDED — D-rc13b-1's prose; open rules rendered beside it as a record |
| exploring · 0–1 decisions | Early — as today; open-rule record beside it |
| exploring · 2–3 decisions | Mid — as today (explore, propose as alternative); open-rule record beside it |
| exploring · 4+ decisions · >1 open questions | Stalled — as today; open-rule record beside it |
| exploring · 4+ decisions · ≤1 open question · ≥1 live rule OPEN | UNACCOUNTED (new) — `/orbit:explore <name> — N of M live rules have open domains (<IDs>); account for them before formalizing` |
| exploring · 4+ decisions · ≤1 open question · 0 live rules OPEN | Accounted (the top rung) — `/orbit:propose <name> — M live rules accounted, K bounded residuals named (<IDs>); formalize when you are ready (or /orbit:explore <name> to keep refining)` — REPORTS, never vouches |
| header neither token | resolves as not-concluded (the conventions production); the exploring rows apply |
| no `## Mechanism` section | every live rule is ABSENT → OPEN by ID; the rows above apply with rules_open = live rules |
Closure: DERIVED — the product of the four inputs, with the header's precedence collapsing its `concluded` value to one row and the counts partitioning `exploring` exactly as the shipped grid does
Moves:
- READ: applied — the shipped grid (`explore-counter.ts` `maturityRecommendation`; the spec's four rungs) and D-bcs-10's precedence rule
- ENUMERATE: applied — this table; every shipped rung keeps a row, two rows are new (CONCLUDED, UNACCOUNTED) and one splits (Mature)
- COHERE: applied — the open-rule list is a RECORD beside every rung and a VERB change in one cell only, so "visible everywhere, withholding at the seam where propose would be the sole verb" is one predicate; complete BOUNDED counts as accounted (D-bcs-3), so the honest author is never deferred
- EXECUTE: applied — run against `bounded-closure-semantics`' final file: 12 decisions, 0 open questions, 9 live rules, 9 accounted (8 CLOSED, 1 BOUNDED) → Accounted, reporting "9 live rules accounted, 1 bounded residual named (D-bcs-12)"; against the SAME file at 2026-09-15 (5 decisions, 0 questions, no Mechanism section) → UNACCOUNTED naming five IDs, where the shipped grid said Mature
- FALSIFY: applied — a file with 4+ decisions all `Kind: fact` or `Kind: scope` has zero live rules and renders Accounted on counts alone; that is D-bcs-9's stated residual (self-classification relocated to the file), owned by D-rc13b-8 and by the requirement text, not closed here
- CONFORM: applied — R-crc-13 (the top rung reports); D1 (eligibility phrasing, no imperative); R-crc-10 (the deliverable is a record — nothing blocks); D-bcs-10 (header first)
- FEASIBILITY: not applied — one more branch in a pure function
- CONSUME: applied — orientation renders whichever string results; the spec's four scenarios keep passing (Early/Mid/Stalled strings unchanged; the 5-decision-0-question scenario gains a Mechanism precondition, or is re-cut into the two rows it now spans)
- INVOKE: applied — every explore emit computes it; the BEGIN emit on an empty scaffold renders Early with rules_open empty

### D-rc13b-3 — the open-rule list is bounded in prose and total in the field
Domain: every surface on which the open-rule list renders
| member | covered by |
|---|---|
| `next_recommended` text (recommendation reason) | at most THREE IDs, then `+N more` when N > 0 |
| the emit field `rules_open` | the FULL list, one entry per open rule |
| orientation's `next` line | the same string as the field above it — no third render |
| `orbit status --json` | the recorded string verbatim (time-shifted; never recomputed) |
Closure: SOURCED — the surfaces are D-rc13b-1's reader set plus the new field this stage adds
Moves:
- READ: applied — the exit criterion's words ("within a bounded render"); D-bcs-10's FEASIBILITY line ("first few IDs + count")
- ENUMERATE: applied — this table
- COHERE: applied — the bound truncates prose only; nothing is lost because the field is total
- EXECUTE: applied — five open rules render `(D-x-1, D-x-2, D-x-3 +2 more)`; three render all three with no suffix; one renders one
- FALSIFY: applied — a reader of the ROW alone cannot see the fourth ID; the row is orientation, not the record, and the trail is one file away
- CONFORM: applied — R-crc-10 (record); R-crc-14 (the bound is stated once, in the emit spec's maturity requirement; the body points)
- FEASIBILITY: not applied — string slicing
- CONSUME: applied — orientation's row width is the motivating consumer; the strip already truncates long `last` text by the same instinct
- INVOKE: applied — every rung that carries a non-empty open list

### D-rc13b-4 — four engine-computed fields join the explore emit, refused from the payload
Domain: the fields the explore emit gains, and how the seam treats each
| member | covered by |
|---|---|
| `rules_total` (integer: live rules — `Kind:` rule or absent AND `Disposition:` live or absent) | computed from the Decisions parse; in `ENGINE_OWNED_EXTRA.explore` |
| `rules_open` (array of `{id, state, line?}` — `state` from D-rc13b-8's table; `line` on MALFORMED and ID-less entries) | computed from the Mechanism parse joined to Decisions; engine-owned |
| `residuals` (array of `{id, kind, method}` — every accounted BOUNDED entry) | computed; engine-owned — the "named beside the rung" record in structured form |
| `status` (`{token: 'exploring' \| 'concluded', date?, re_entry?}` — `date` and `re_entry` iff concluded) | computed from the header production and the live CONCLUDED entry's `Re-entry:` slot; engine-owned |
| a payload carrying any of the four | refused with the engine-owned error, not the unknown-key error — the same sentence `decisions_captured` drew at this exploration's BEGIN emit |
| the computed-extensions requirement in `orbit-emit-composition` (the ONE statement of the shapes — AMENDED 2026-09-25 at the proposal walk: no explore field table exists in `orbit-run-summary-emit` and no explore schema reference exists for the parity test to read, so the first draft's two extra members were not members) | gains the four fields; readers tolerate their absence on prior-generation emits (the existing generation rule) |
Closure: SOURCED — the seam's own mechanism (`validatePayload`: `SPINE_FIELDS ∪ ENGINE_OWNED_EXTRA[command]` refused as engine-owned; anything else not in `payloadFields` refused as unknown), read 2026-09-25
Moves:
- READ: applied — `validatePayload` and the `explore` COMMANDS entry (`payloadFields: ['final_assessment']`); `decisions_captured`'s treatment as the template
- ENUMERATE: applied — this table
- COHERE: applied — `status` carries the `Re-entry:` text and D-rc13b-1's prose repeats it: one source (the slot), two renders, both engine-composed — not two statements of a rule
- EXECUTE: applied — the BEGIN emit of this exploration was refused for `decisions_captured` with the engine-owned sentence; the four new fields take the same path once listed
- FALSIFY: applied — a field added to the emit but NOT to `ENGINE_OWNED_EXTRA` is refused as UNKNOWN, which is still refused; the distinction is the error's honesty, so the test asserts the sentence
- CONFORM: applied — R-crc-13/rc04a: `judgements` is for beliefs; these are facts about a file, so they live beside `decisions_captured`, not inside a judgement record; R-crc-14: the field shapes are stated once in the emit spec's table
- FEASIBILITY: not applied — four keys
- CONSUME: applied — orientation reads only `next_recommended` and `final_assessment` from explore emits (`orientation.ts:112`), so the new fields break no reader; audit-drift's cross-check may read `rules_open` later (a stated possibility, not a dependency)
- INVOKE: applied — every explore emit; the BEGIN emit records `rules_total: 0`, `rules_open: []`, `residuals: []`, `status: {token: 'exploring'}`

### D-rc13b-5 — the productions live in one module, and every extension imports it
Domain: every place the three productions (status header, Decision entry, Mechanism entry) are stated or matched
| member | covered by |
|---|---|
| `orbit/specs/orbit-conventions/spec.md` (the OWNER — fenced text in three requirements) | stays the owner; a parity test compares the module's strings to the spec's fenced lines |
| `src/core/templates/workflows/explore.ts` (the body's byte-equal mirrors) | interpolates the module's strings — zero rendered diff, so the `orbit-explore` hash pin in `skill-templates-parity.test.ts` is unchanged |
| `test/core/templates/orbit-generated-surface.test.ts` (the grammar's first extension — regexes at lines 287–439) | imports the module's regexes instead of restating them |
| this stage's parser (the second extension) | imports the module |
| the existing spec-vs-body mirror test (`orbit-generated-surface.test.ts:346`) | unchanged in purpose; it now proves spec ≡ module ≡ body transitively |
Closure: SOURCED — the four sites the design's Risks entry names plus the mirror test that already holds two of them equal; grep over `Closure: <TOKEN>` and the status production across `src/` and `test/`, 2026-09-25
Moves:
- READ: applied — the design's HANDOFF sentence; the hash-pin test hashes `getExploreSkillTemplate()`'s rendered output, so identical bytes hash identically
- ENUMERATE: applied — this table
- COHERE: applied — one module cannot diverge from itself; the spec parity test is the ONE remaining seam, and it is a check, not a hope
- EXECUTE: not applied — the move happens at apply; the acceptance is the unchanged hash pin plus a green parity test
- FALSIFY: applied — if the module's regex and the spec's prose grammar disagree, the parity test can only compare STRINGS, not semantics: a production stated as prose ("matched from line start to the first ` — `") has no fenced regex to compare. The parity test covers the fenced productions; the prose-stated matching rules are covered by the parser's fixture tests over the two exemplars (D-bcs-11)
- CONFORM: applied — R-crc-14 (stated once; extensions point — importing IS pointing); the mirror corollary survives because the body still carries a checked copy
- FEASIBILITY: applied — the template is a TS literal already; interpolating a constant into it is the D13 inline-TS idiom; measured risk is the hash pin, which is unchanged iff the bytes are
- CONSUME: applied — the parser and the surface test are the consumers; both import
- INVOKE: applied — the parity test runs in `npm test`; the pin runs in `npm test`

### D-rc13b-8 — the parse judges FORM over nine entry states, and MALFORMED never blocks
Domain: the states a Decisions entry and its Mechanism entry can be in, joined by ID
| member | covered by |
|---|---|
| Decisions entry with no well-formed ID opener (its FIRST line lacks the prefix `- **<date> — <ID>: `; the closing `**` may fall anywhere — amended 2026-09-25 at the proposal walk) | OPEN — named by LINE (no key exists to name it by); counted in `rules_total` |
| Decisions entry whose ID duplicates an earlier one | MALFORMED — named with the second entry's line; the FIRST owns the key and joins its Mechanism entry, the second is excluded from `rules_total` (amended 2026-09-25 at the proposal walk) |
| `Kind:` line whose value is outside `rule \| fact \| scope` | does not match the production → the slot is ABSENT → `rule` (the demanding default; the grammar's own consequence, not a new rule) |
| `Disposition:` line whose value is outside `live \| superseded … \| assigned …` | does not match → ABSENT → `live` |
| `Kind: fact` / `Kind: scope` / `Disposition: superseded …` / `Disposition: assigned …` | OUT of the obligation; a Mechanism entry for it is permitted history, never an orphan |
| Mechanism entry: absent / no `Closure:` / DERIVED or SOURCED / BOUNDED complete / BOUNDED missing a slot / MALFORMED per D-bcs-8 | D-bcs-10's six states, inherited verbatim |
| Mechanism entry whose ID matches no Decisions entry (orphan) | MALFORMED naming the heading (D-bcs-8) — reported in `rules_open` with `state: malformed` even though it is not a live rule, because a key with no owner is a form defect the record must show |
| a fenced block anywhere | never structure (the counter's fence tracker, shared) |
| no `## Mechanism` section | every live rule ABSENT; one format note on stderr like the counter's, never an emit blocker |
Closure: DERIVED — the Decisions side is the two slot productions' match/no-match outcomes times the ID opener's three outcomes; the Mechanism side is D-bcs-10's table; the join adds the orphan
Moves:
- READ: applied — the conventions spec's Decision-entry requirement ("a Decisions entry without a well-formed ID is a format violation the explore body corrects on next touch"), the `Kind:` production regex, D-bcs-8's MALFORMED list, D-bcs-10's six states; no parser reads `Kind:` or `Disposition:` today (grep over `src/core/parsers`, empty)
- ENUMERATE: applied — this table
- COHERE: applied — "unknown Kind = absent = rule" follows from the production being a match, not a parse; making it MALFORMED instead would let a typo escape the obligation, the opposite of the demanding default's purpose
- EXECUTE: applied — the two exemplars in the body parse to accounted (D-bcs-3 SOURCED; D-bcs-12 BOUNDED with both slots); `bounded-closure-semantics`' full file parses to 9 live rules, 9 accounted, 0 malformed; the 2026-09-15 file (no Mechanism section, five ID'd decisions) parses to 5 open by ID; THIS file's D-rc13b-7 was first written with its bold opener wrapped across two lines and a strict same-line reading of the production made it ID-LESS — AMENDED 2026-09-25 at the proposal walk: the fresh pass EXECUTED the parse over the archived fixture and found THREE wrapped openers (D-bcs-8, D-bcs-9, D-bcs-11), so under the strict reading the fixture parses 9 live / 7 accounted / 2 open by line / 2 orphans — the READING was wrong, not the fixture; the opener is a FIRST-LINE PREFIX match (Sal ratified option A), wrapping is legal, and ID-less means no prefix at all
- FALSIFY: applied — a rule never written down is invisible; a rule written as `Kind: fact` to dodge the obligation is invisible. The parse judges FORM; the requirement text states both holes and names audit-drift or a later reader as the cross-check (exit (3))
- CONFORM: applied — R-crc-10 (form is what the engine can observe; truth is not); the architecture parser's near-miss rule (nothing reads as legacy silently); D-bcs-11 (the exemplars are the fixtures)
- FEASIBILITY: not applied — a fence-aware line scanner over one file, the counter's shape
- CONSUME: applied — D-rc13b-2 consumes `rules_open`'s count and IDs; D-rc13b-4 carries the states; the emit surface's stderr carries the format note
- INVOKE: applied — every explore emit; exit (2)'s instrument list names each row above as a fixture case

### D-rc13b-9 — the orientation row reads the header token: one chip variant, one position literal
Domain: every field of orientation's explore workstream entry, and what each reads
| member | covered by |
|---|---|
| `strip` (`composeExploreStrip()`, `orientation.ts:339` — six chips, explore glyph `▶` hardcoded) | the explore chip's glyph becomes `■` when the header token is `concluded`; the five pending chips are unchanged |
| `position` (the literal `'exploring'`, `orientation.ts:408`) | becomes the literal `'concluded'` when the header token is `concluded`; otherwise unchanged |
| `next` (the trail's recorded `next_recommended`, time-shifted) | D-rc13b-1's prose arrives through it — AMENDED 2026-09-25 at the proposal walk (fresh pass, option A ratified): NOT unchanged, because the status render labels every explore next `Ready when you are:`; the sourcing requirement gains the concluded rule and the line renders BARE |
| `last` (the newest emit's summary) | unchanged |
| `stage` (the `architecture:` citation) | unchanged |
| the degraded branch (`orientation.ts:414`) | unchanged — a header read that throws falls to `exploring`, never to a false `concluded` |
| the token's source | the newest spine-valid explore emit's `status.token` (D-rc13b-4), read where orientation already reads `next_recommended` — NEVER the file (AMENDED at propose: the bare-status requirement forbids artifact-content parsing; a pre-capability newest emit lacking `status` reads as `exploring`) |
Closure: SOURCED — the `WorkstreamEntry` fields the explore branch composes (`orientation.ts:400–432`), read 2026-09-25; seven members, two change
Moves:
- READ: applied — `composeExploreStrip` takes no input and returns six literals; the position is a literal; `listDirs` over `orbit/explore` with an empty exclusion set is how the row exists at all (Case 2 of the bounded-closure exploration)
- ENUMERATE: applied — this table
- COHERE: applied — the row and the rung read the SAME token, the rung from the file at emit time and the row from that emit, so they cannot disagree except by the lag `next` already has; the first draft read the file from orientation and CONTRADICTED the bare-status requirement's closed data-source list (found writing the delta at propose — the READ move had read `composeExploreStrip`, not the requirement that governs it); the position word `concluded` is a stage-state-vocabulary literal that rc15 will also need for the ended-from-explore observation — whichever ships first names it and the other adopts (the R-crc-11 impact note's own rule for rc13b and rc04), recorded as a handoff to rc15
- EXECUTE: applied — run by hand against this file's own row today: `explore ▶ → propose → …`, position `exploring`, next from the BEGIN emit; against the same directory with the header flipped: `explore ■ → propose → …`, position `concluded`, next `Concluded 2026-09-25. Reopens when: …`
- FALSIFY: applied — a header flipped by hand with no emit afterward leaves the row `exploring` until the next emit — the same lag `next` carries, stated rather than hidden; a spine-invalid newest emit is skipped by the existing fault-isolation rule and the next-older valid emit's token governs; the false-`exploring` on a concluded row is exactly the defect this rule removes
- CONFORM: applied — R-crc-1 (a THIRD capability, `orbit-orientation`, at the ceiling: two fields, one requirement's scenarios); R-crc-14 (the token is read via the owned production, never restated); D3's read-only, fault-isolated orientation contract (no new file reads beyond the header line of a file the row already implies)
- FEASIBILITY: applied — zero new file reads: one optional field on a record orientation already parses
- CONSUME: applied — `orbit status` (bare and `--full`) and `--json` render the entry; the `--json` `strip` chip array carries the new glyph as data, and the WAITING band's closed set is untouched (nothing about a concluded exploration is yours to do)
- INVOKE: applied — every orientation render that lists a staging explore; the strip scenario in `orbit-orientation` gains one sibling for the concluded case

## Decisions

- **2026-09-25 — D-rc13b-1: the fifth rung's `next_recommended` is prose that names no command** (settled
  under R-crc-3). `Concluded <YYYY-MM-DD>. Reopens when: <the Re-entry: slot, verbatim>.` The spine
  defines the field as "verbatim recommendation, suitable for best-effort parse"; the archive emit
  already fills it with prose naming no single command; orientation renders the string as written and
  nothing under `src/core` parses a leading `/orbit:` token from an explore emit. A rung that points at
  nothing says so in the field, and the row says the same.
  Kind: rule
- **2026-09-25 — D-rc13b-2: header first, counts kept, the verb changes in exactly one cell** (settled
  under R-crc-3). The `concluded` header collapses every count to the CONCLUDED rung. Under `exploring`
  the shipped counts keep Early, Mid and Stalled as they are. Mature SPLITS: with any live rule OPEN it
  renders UNACCOUNTED (`/orbit:explore <name>`, naming the gap by ID); with every live rule accounted it
  renders the top rung, which REPORTS — live-rule count, zero open, each BOUNDED residual named — in
  eligibility phrasing and still points at propose. The open-rule list renders as a RECORD beside every
  rung; it changes the VERB only where propose would otherwise be the sole recommendation. Rationale:
  the count is a weak proxy for breadth and the accounting a proxy for checkability; neither is
  readiness (R-crc-13), so both stay records and the withholding sits at the one seam that matters.
  Kind: rule
- **2026-09-25 — D-rc13b-3: the open-rule list is bounded in prose, total in the field** (settled under
  R-crc-3). At most three IDs then `+N more` in the recommendation text; the full list in `rules_open`.
  Kind: rule
- **2026-09-25 — D-rc13b-4: four engine-computed fields join the explore emit, refused from the payload**
  (settled under R-crc-3). `rules_total`, `rules_open`, `residuals`, `status` — computed from the file
  like `decisions_captured`, listed in `ENGINE_OWNED_EXTRA.explore` so a payload carrying one draws the
  engine-owned sentence (observed on this exploration's own BEGIN emit) rather than the unknown-key one.
  They are facts about a file, so they sit beside the counts and not inside a `judgements` record
  (R-crc-11's instruction to read rc04a's vocabulary first — read; not borrowed, because the genres
  differ).
  Kind: rule
- **2026-09-25 — D-rc13b-5: the productions live in ONE module and every extension imports it** (settled
  under R-crc-3; rc13a's design handoff, taken IN). The spec stays the owner; a parity test compares the
  module to the spec's fenced text; the body template interpolates the module byte-identically (the
  `orbit-explore` hash pin is unchanged); the surface test and this stage's parser import it. A parser
  written as a third hand-copy is the divergence R-crc-14 exists to stop.
  Kind: rule
- **2026-09-25 — D-rc13b-6: the maturity requirement's parse claim is corrected in this stage's delta**
  (settled under R-crc-3). The sentence "the leading `/orbit:<verb> <name>` token is the canonical
  recommendation that a downstream status reader parses into `command`/`args`" describes no reader that
  exists; it becomes the spine's own words — rendered verbatim, parse best-effort. A READ finding on the
  spec this stage edits, repaired rather than built toward.
  Kind: scope
- **2026-09-25 — D-rc13b-7: the first independent pass's READ / ENUMERATE / COHERE CRITICAL count is recorded in this stage's review emit** (rc13a's task 6.1, a user-validation handoff to "the NEXT stage
  explored under this convention" — this one). Recorded either way, zero or not, in the emit's
  commentary; the number is rc13a's evidence, not this stage's grade.
  Kind: scope
- **2026-09-25 — D-rc13b-8: the parse judges FORM over nine entry states, and MALFORMED never blocks**
  (settled under R-crc-3). D-bcs-10's six Mechanism states inherited verbatim, joined to the Decisions
  side: an entry with no well-formed ID is OPEN named by line; a duplicate ID is MALFORMED naming the
  second; a `Kind:` or `Disposition:` value outside its production does not match, so the slot is ABSENT
  and the demanding default applies (a typo cannot escape the obligation); an orphan Mechanism entry is
  MALFORMED naming the heading; no `## Mechanism` section makes every live rule ABSENT with one stderr
  note. The parse never blocks the emit — the rung is the report (R-crc-10). Whether an enumeration is
  TRUE, or a rule was written down at all, stays a reader's judgement and the requirement says so.
  Kind: rule

- **2026-09-25 — D-rc13b-9: the orientation row reads the header token — chip `explore ■`, position `concluded`, nothing else touched** (Sal, 2026-09-25: "take your rec"). `orbit-orientation` becomes the stage's THIRD capability, at the R-crc-1 ceiling. The row and the rung read the same token, so they cannot disagree. AMENDED 2026-09-25 at propose (a CONFORM finding while writing the delta): the row reads the token from the TRAIL — the newest spine-valid explore emit's engine-computed `status.token` (D-rc13b-4) — never from the file, because `orbit-orientation`'s bare-status requirement CLOSES its data sources at engine computations, directory presence, metadata citations and emit files, with artifact-content parsing forbidden; the conclude verb flips the header BEFORE its final emit (D-bcs-6), so the newest emit carries the token, and the row lags a hand-flipped header exactly as `next` already does (time-shifted, never live). The position word is shared vocabulary with rc15's ended-from-explore state: whichever stage ships first names it and the other adopts. The alternative — leave the chip wrong, record it in Considered & out — was declined because the stage exists to make the readout say the right thing and the strip is that readout one line up.
  Kind: rule

## Open questions

## Considered & out

- **Dropping the decision count entirely** (2026-09-25) — a grid over header × rules only (no rules
  yet / rules open / rules accounted / concluded). Fewer inputs, and the survivor cannot be inflated
  with bullets. Rejected: an exploration with two accounted rules and nothing else would render the
  top rung, because accounting says only that what was written is checkable, not that enough was
  written. Both proxies stay as records; neither rules (R-crc-13; D-rc13b-2).
- **Building the reader the maturity spec imagines** (2026-09-25) — a `command`/`args` parser over
  `next_recommended`. Rejected: nothing consumes it, and a parser would make D-rc13b-1's prose rung
  a special case in code that exists only to have one. The sentence is corrected instead
  (D-rc13b-6).
- **`/orbit:architect <doc>` as the fifth rung's verb when the exploration is cited** (2026-09-25) —
  the conclusion's re-entry trigger is the program layer's Considered & out shape, so pointing at the
  program doc has a logic. Rejected: it points at nothing for an uncited exploration, and D-bcs-10
  says the rung recommends neither verb; two shapes for one rung is the pattern R-crc-14 names.
- **Treating an unknown `Kind:` value as MALFORMED** (2026-09-25) — rejected in D-rc13b-8: a typo
  would then escape the obligation, which is the opposite of the demanding default's purpose. The
  production is a match, not a parse; no match means no slot.

## References

- `orbit/architecture/clean-up-review-cycle.md` — the rc13b stage section (charter, R-crc-11 impact note, exit criteria); rc13a's archive record directly above it
- `orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` — D-bcs-10 (what rc13b inherits: the six entry states, header-first precedence), D-bcs-11 (the shared fixture), D-bcs-12 (the BOUNDED instance), Case 2 (the three readers of a staging directory)
- `orbit/changes/archive/2026-09-25-bounded-closure-semantics/design.md` — Risks: the one-constant handoff for the productions; D-bcs-8's escaped-pipe row as the GFM-cell fixture
- `orbit/specs/orbit-conventions/spec.md` — the three productions this stage parses (status header; Decision entry identity; Mechanism entry grammar and accounted closure)
- `orbit/specs/orbit-run-summary-emit/spec.md` — `Named-mode explore recommendation by maturity` (the four-rung grid this stage edits)
- `orbit/specs/orbit-emit-composition/spec.md` — `Per-command computed extensions` (the explore counts; where the parse plugs in)
- `orbit/specs/orbit-orientation/spec.md` — `Next-recommendation sourcing is time-shifted, never live` (the explore row reads the trail's recorded `next_recommended`; the fifth rung's consumer)
- `src/core/parsers/explore-counter.ts` — the counter and `maturityRecommendation` (the grid as engine data)
- `src/core/emit-composition.ts` — the `explore` case of the per-command switch
- `test/core/templates/orbit-generated-surface.test.ts` — the parity test whose regexes are the grammar's first extension
