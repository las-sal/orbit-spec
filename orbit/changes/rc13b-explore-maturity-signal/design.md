# Design: rc13b-explore-maturity-signal

## Context

The explore emit's `next_recommended` is computed by `maturityRecommendation` in
`src/core/parsers/explore-counter.ts` from two counts the same module parses fence-aware from
`explore.md`. The emit surface (`src/core/emit-composition.ts`, the `explore` case) calls it and
refuses any payload attempt to supply the counts. Orientation (`src/core/orientation.ts`) renders an
explore row from its trail: `next` is the newest spine-valid emit's recorded `next_recommended`,
verbatim and time-shifted; the strip's explore chip and the `position` literal are hardcoded to
`▶` and `exploring`.

rc13a (archived 2026-09-25 as `bounded-closure-semantics`) gave `explore.md` three parseable
productions — the status header (two tokens), the Decisions entry (ID opener, `Kind:`,
`Disposition:`, `Re-entry:`), and the Mechanism entry (`Domain:` table, `Closure:` token, residual
slots iff BOUNDED, nine move lines) — stated once in `orbit-conventions` and mirrored byte-equal into
the explore body by `test/core/templates/orbit-generated-surface.test.ts`, whose regexes are the
grammar's first extension. No engine code shipped. This stage is the consumer that makes the
convention more than advisory.

Constraints: R-crc-1 (three capabilities, this change sits exactly at it); R-crc-10 (the engine
judges FORM, never truth); R-crc-13 (a readout reports, never rules); R-crc-14 (a production is
stated once; every extension points — here, imports); D3's orientation contract (read-only, closed
data sources, fault-isolated, time-shifted); D-bcs-10 (what this stage inherits: the six entry
states, complete BOUNDED never withheld on, header read first).

The mechanism is settled in `explore.md` (see D-rc13b-1 … D-rc13b-9 and their Mechanism entries);
this document restates only what an implementer needs and cites the rest.

## Goals / Non-Goals

**Goals:**
- The top rung stops asserting readiness on heading count; it reports what the file accounts for.
- A concluded exploration renders a rung that points at nothing, and a row that agrees with it.
- The parse judges form over a closed state table; MALFORMED is named by line and never blocks.
- The productions have one source in code, imported by every extension, held to the spec by a test.

**Non-Goals:**
- Judging whether an enumeration is TRUE, a residual honest, or a rule written down at all. The
  requirement states these holes; audit-drift or a later reader is the cross-check.
- Any change to the stage-state reader (`src/core/architecture/state.ts`) — rc15's.
- Propose consuming Mechanism content or refusing a concluded name — rc13c's.
- Retiring the "until the maturity-signal stage lands" clauses in `orbit-conventions` and the explore
  body — a fourth capability; deferred to the retirement-class sweep (see Risks).
- Building the `command`/`args` reader the maturity spec imagines. The sentence is corrected.

## Decisions

- **D-rc13b-2 — header first; counts kept; the verb changes in one cell** (see `explore.md`). The
  grid is a pure function of four inputs — header token, decision count, open-question count,
  open-rule count — with the header's `concluded` value collapsing everything to CONCLUDED. Early,
  Mid and Stalled keep their shipped strings byte-for-byte. Mature splits into UNACCOUNTED (explore,
  gap by ID) and Accounted (propose, reporting). *Alternative rejected*: dropping the count entirely —
  two accounted rules and nothing else would render the top rung (`explore.md`, Considered & out).
- **D-rc13b-1 — the CONCLUDED rung's recommendation is prose naming no command.** `Concluded
  <YYYY-MM-DD>. Reopens when: <Re-entry verbatim>.` Legal under the spine (`orbit-conventions`:
  "verbatim recommendation, suitable for best-effort parse"); the archive emit already does this.
  Orientation validates a string and renders it. *Alternative rejected*: `/orbit:architect <doc>` as
  the verb when cited — two shapes for one rung, and nothing for the uncited case.
- **D-rc13b-8 — nine entry states, form only.** D-bcs-10's six Mechanism states joined to the
  Decisions side: an entry is WELL-FORMED when its FIRST line matches the opener prefix
  `- **<date> — <ID>: ` (the closing `**` may fall on a later line — settled at the proposal walk,
  option A of the fresh pass's first CRITICAL: the archived exemplar wraps three of twelve openers and
  none was written carelessly; `orbit-conventions` points at this rule on its next touch); a
  prefix-less entry → OPEN named by line; duplicate ID → MALFORMED naming the second; an unknown
  `Kind:`/`Disposition:` value is NO MATCH, so the slot is absent and the demanding default applies
  (a typo cannot escape the obligation — *alternative rejected*: MALFORMED, which would let it);
  orphan Mechanism entry → MALFORMED naming the heading, reported in `rules_open` with
  `state: malformed`; a duplicate ID → the first owns the key, the second `malformed` by line and
  excluded from `rules_total`; `re_entry` absent when no live slot, first-in-file-order with a stderr
  note when two; no `## Mechanism` section → every live rule ABSENT plus one stderr note. `rules_open`
  is ordered (Decisions in file order, then Mechanism-only malformed in heading order) so the bounded
  render is deterministic, and the rung's K counts live-rule states only — a malformed entry is a key
  defect, reported in its own clause, never a rule with an open domain. A live
  rule is a Decisions entry whose `Kind:` is rule or absent AND whose `Disposition:` is live or
  absent. The parser lives in a new `src/core/parsers/explore-rules.ts` beside the counter, sharing
  its fence tracking; the counter module keeps the grid function and gains the two new inputs.
- **D-rc13b-4 — four engine-owned fields.** `rules_total` (integer), `rules_open` (array of
  `{id, state, line?}`), `residuals` (array of `{id, kind, method}`), `status` (`{token, date?,
  re_entry?}`). Listed in `ENGINE_OWNED_EXTRA.explore` so a payload carrying one draws the
  engine-owned sentence rather than the unknown-key one (the test asserts the sentence). They are
  facts about a file and sit beside `decisions_captured`, not inside a `judgements` record — rc04a's
  vocabulary was read (R-crc-11) and not borrowed, because the genres differ. Their shapes are stated
  ONCE, in `orbit-emit-composition`'s computed-extensions requirement: no explore payload schema
  reference exists today (`test/core/emit-schema-parity.test.ts` lists review, review-external,
  address-reviews, audit-drift and archive; the explore skill ships only `capture-formats.md`), so
  there is no explore field table to extend and no parity row to add — corrected at the proposal walk
  from the exploration's D-rc13b-4 table, which had named both as members.
- **D-rc13b-3 — bounded in prose, total in the field.** At most three IDs then `+N more` in the
  recommendation text; `rules_open` carries every entry.
- **D-rc13b-5 — one grammar module.** `src/core/explore-grammar.ts` exports the three productions as
  the strings the spec fences plus the regexes that match them. The explore body template
  interpolates the strings — the rendered SKILL.md is byte-identical, so the `orbit-explore` pin in
  `test/core/templates/skill-templates-parity.test.ts` does not move. The generated-surface test and
  the parser import the regexes. A new parity test reads `orbit/specs/orbit-conventions/spec.md`'s
  three fenced productions and asserts the module's strings equal them — the ONE remaining seam, and
  a check rather than a hope. The prose-stated matching rules (e.g. "matched from line start to the
  first ` — `") have no fenced form to compare; they are covered by the parser's fixture tests over
  the two body exemplars (D-bcs-11).
- **D-rc13b-9 (as amended at propose) — the row reads the trail, not the file.** The explore chip
  renders `■` and the position literal reads `concluded` when the newest spine-valid explore emit
  carries `status.token: "concluded"`. Orientation already parses that emit for `next_recommended`;
  one optional field is added to the record it extracts. The first draft read the header from the
  file and contradicted the bare-status requirement's closed data-source list (found writing the
  delta; the READ move had read `composeExploreStrip`, not the requirement governing it). The row lags
  a hand-flipped header until the next emit, exactly as `next` already does; the conclude verb emits
  after the flip (D-bcs-6), so the ordinary path has no lag. A pre-capability newest emit lacking
  `status` reads as `exploring`. The WAITING set is untouched — nothing about a concluded exploration
  is the user's to do. The `next` line is NOT unchanged, as the exploration's table first said: the
  status render prefixes every explore next with `Ready when you are:`, an eligibility label on the one
  rung that points at nothing, so the sourcing requirement (same capability) gains the concluded rule —
  the recorded prose renders BARE — option A of the fresh pass's finding, ratified by Sal.
- **D-rc13b-6 — the parse sentence is corrected.** The maturity requirement's claim that a downstream
  reader parses the token into `command`/`args` becomes the shape requirement's own wording — "(if
  present)", best-effort, prose preserved whole.
- **Strings the exemption list assigned to this stage.** `emit-composition.ts`'s stderr note
  "(five-section format violation to fix on next touch)" becomes a pointer to `orbit-conventions`'
  format requirement; `explore-counter.ts:12`'s doc comment likewise. Both were listed for rc13b in
  rc13a's design Risks.

## Risks / Trade-offs

- [The row lags a hand-flipped header] → stated in the orientation delta; the same time-shifted rule
  `next` has always had, and the conclude verb's emit ordering makes the ordinary path lag-free.
- [Self-classification is RELOCATED, not removed] → a rule never written, or written as `Kind: fact`
  to dodge the obligation, is invisible to a form parse. The requirement text names both holes and the
  cross-check (audit-drift or a later reader); exit criterion (3) is exactly this sentence.
- [Every pre-rc13a exploration renders UNACCOUNTED at 4+ decisions] → true, and intended: with no
  Mechanism section every decision is a live rule with no entry. The migration surface is ZERO staging
  directories (rc13a's Risks: propose moved the only live one) PLUS every active change whose consumed
  `explore.md` predates rc13a — the emit surface resolves a change-scoped `orbit emit explore` to the
  change directory and parses its `explore.md` (the path task 6.3 depends on), so such a change renders
  UNACCOUNTED on its next in-change explore emit. Intended: the demanding default, stated so the system
  review does not rediscover it.
- [Two extensions of one grammar] → closed by D-rc13b-5: one module, imported everywhere; the spec
  parity test is the single seam. FEASIBILITY measured at apply: the pin is unchanged iff the bytes
  are; a moved pin means the interpolation is not byte-identical and the task fails, not the pin.
- [The `Mature` scenario in `orbit-run-summary-emit` names 5 decisions / 0 questions with no
  Mechanism precondition] → re-cut into the two rows it now spans (UNACCOUNTED when a rule is open;
  Accounted when none is), both stated in the delta.
- [Readers of prior-generation explore emits] → the four fields are absent on every emit before this
  change; the existing generation rule (readers tolerate absence) covers them; orientation's `status`
  extraction is optional.
- [`concluded` is shared vocabulary with rc15] → whichever stage ships first names the third state;
  the other adopts. Recorded in D-rc13b-9 and here; rc15's charter names the handoff.
- [Stale "until rc13b lands" clauses] → `orbit-conventions`' concluded-outcome requirement and the
  explore body's KNOWN paragraph say the orientation row stays count-derived "until the
  maturity-signal stage". Once this ships they are history, not falsehood. Retiring them touches a
  fourth capability and is DEFERRED to the retirement-class sweep rc13a deferred its "five-section"
  titles to — declared here so the system review does not rediscover it as drift.
- [Wrapped openers] → under a strict same-line reading of the opener, an author who wraps a bold title
  loses the ID; it happened in this stage's own exploration and, the fresh pass found, in three of the
  archived exemplar's twelve entries. The parse therefore matches the opener as a FIRST-LINE PREFIX;
  wrapping is legal, and ID-less means no prefix at all. The strict reading is Considered & out.
- [Size] → three capabilities (the ceiling), six requirement blocks (five MODIFIED, one ADDED — the
  sourcing requirement joined at the proposal walk), seven rules, 18 tasks after the walk deleted 4.3
  (19 before; the R-crc-1 task bound is 20, so any task a later walk adds must be paid for by merging
  two). Measured before generation (R-crc-9's preventive application); recorded rather than hidden.

## Touchpoints

- `src/core/explore-grammar.ts` — NEW: the three productions as strings and regexes; the single source.
- `src/core/parsers/explore-rules.ts` — NEW: the form parse (Decisions side, Mechanism side, the join); nine states.
- `src/core/parsers/explore-counter.ts` — the grid gains the header and open-rule inputs; the doc comment's "five-section" string retired.
- `src/core/emit-composition.ts` — the `explore` case computes the four fields; `ENGINE_OWNED_EXTRA.explore`; the stderr note's string.
- `src/core/orientation.ts` — `status` extracted from the newest explore emit; chip glyph and position literal.
- `src/commands/workflow/status.ts` — `renderNextLine` renders a concluded explore's next line bare.
- `src/core/templates/workflows/explore.ts` — interpolates the grammar module's strings (byte-identical render).
- `test/core/parsers/explore-rules.test.ts` — NEW: the nine states, the two body exemplars as fixtures, a fenced decoy, no Mechanism section, the wrapped-opener case (well-formed), the prefix-less case, the duplicate-ID case.
- `test/core/parsers/explore-counter.test.ts` — the six rungs and the bounded render.
- `test/core/emit-composition.test.ts` — the four fields computed; engine-owned refusal by sentence.
- `test/core/orientation.test.ts` — the concluded chip and position from the trail; pre-capability emit reads `exploring`.
- `test/core/templates/orbit-generated-surface.test.ts` — imports the module's regexes; the new spec-parity assertion.
- `test/core/templates/skill-templates-parity.test.ts` — the `orbit-explore` pin, asserted UNCHANGED.
