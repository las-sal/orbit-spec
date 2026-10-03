> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc02b-severity-ladder

## Premise

The charter (`### Stage rc02b-severity-ladder`, clean-up-review-cycle) says: `orbit-conventions`'
Severity ladder requirement today gives three names and "prefer the lower one"; the stage gives them
DEFINITIONS BY CONSEQUENCE — CRITICAL = a user path breaks or data is lost AND the finding carries its
REPRODUCTION; WARNING = an implementation built to the artifact as written could diverge from what it
intends; else SUGGESTION — and an EVIDENCE TAX enforced where evidence is produced (the `orbit emit
review` write gate refuses an internal CRITICAL with no non-empty `reproduction`) and surfaced where it
cannot be (an external findings file's `**Reproduction**:` line; a CRITICAL lacking one is counted,
marked unreproduced, never re-graded). The tax needs a reader: address-reviews carries `reproduction`
into the virtual marker so the walk's pushback can re-run it. Two known contradictions ship with it
(the conventions' canonical review-emit example shows a CRITICAL with no reproduction; the review
body's Step 9 field enumeration does not name the field), plus one assigned residue from rc02's v4
bump (the conventions' external-slot sentence, falsified by `blind-pair`). Three capabilities, at the
ceiling: orbit-conventions, orbit-emit-composition, orbit-address-reviews.

Why this stage now (recommended and accepted 2026-10-01): the ladder is the vocabulary every
downstream mechanism grades against — the reviewed gate's substantive-only clause (CRITICAL + WARNING),
R-crc-4's "a CRITICAL buys one more pass", and R-crc-11(b)'s fix-now versus route-to-architecture call.
What this exploration must settle is the MECHANISM under the rc13a convention: each rule's domain
accounted, the write gate's exact predicate, the parser's exact marking, the walk's exact reader, and
what the two contradictions and the residue cost against the ceiling.

## Mechanism

### D-rc02b-2 — the ladder is stated ONCE; every per-pass severity rule becomes a POINTER with its reading
Domain: every site in the generated review surface that states a severity by pass (the body's pass lists, proposal and system), plus the one documentation echo
| member | covered by |
|---|---|
| P1 Structure — CRITICAL on validate failure; WARNING on delta anomalies; SUGGESTION cosmetic | validate failure → BLOCK (D-rc02b-3); anomalies WARNING per ladder; cosmetic SUGGESTION |
| P2 Internal Coherence — CRITICAL when a requirement has no task; WARNING count/label | missing task DOWNGRADES to WARNING (an implementation would omit it); count/label WARNING |
| P3 Cross-Doc — WARNING stale context; SUGGESTION enrichment | survives as written, pointer added |
| P4 Archive — CRITICAL direct contradiction; WARNING dangling refs | CRITICAL only with a reproduction naming the baseline behaviour that breaks; else WARNING |
| P5 Codegen — WARNING for ambiguity that could split implementations | the ladder's WARNING definition verbatim; pointer only |
| P6 Gap Hunt — no severity rule | unchanged; out of the domain by inspection |
| P7 Drift — CRITICAL when a delta uses old vocab; WARNING project docs | delta vocabulary DOWNGRADES to WARNING (misleads an implementer); docs WARNING |
| P8 Markers — unresolved marker CRITICAL; ambiguous → CRITICAL | BLOCK (D-rc02b-3); the inverted false-positive clause deleted |
| P9 Sweep — almost always SUGGESTION | survives, pointer added |
| S1 Baseline — CRITICAL on violation; WARNING regression risk | survives; the tax applies to the CRITICAL |
| S2 Cohesion — CRITICAL downstream clearly broken; WARNING contract drift | survives; "broken" is a reproducible user path |
| S3 Surface — CRITICAL surface removed unintentionally; WARNING inconsistencies | CRITICAL only with the removal shown; else WARNING |
| S4 Perspective — WARNING awkward/surprising | survives, pointer added |
| S5 Critical-Path — CRITICAL path breakage; WARNING regression risk | the ladder's CRITICAL definition verbatim; pointer only |
| S6 Drift/Residue — audit-drift assigns and the pass preserves | OUT of the stage (D-rc02b-4); the pointer is a later touch in `orbit-audit-drift` |
| the body's report example, "(CRITICAL — must address before apply)" at P8 | rewritten to the block wording |
| the external prompt's pass lists (mode-sections, proposal 1–9 and system 0–6) | carry NO severity words today — the ladder's paragraph is ADDED to the prompt, not substituted |
Closure: SOURCED — `grep -n "CRITICAL\|WARNING\|SUGGESTION" src/core/templates/workflows/review.ts` on 2026-10-03, every hit classified; the external pass lists (lines 505–545) read in full and found severity-free
Moves:
- READ: applied — each rule quoted from review.ts lines 161–177 and 220–230, not from the charter's summary
- ENUMERATE: applied — the table; the charter counted none of these, which is how three capabilities became five. CORRECTED 2026-10-03 at walk 1: the table has seventeen rows but FOURTEEN are rule sites (P6, S6 and the prompt lists are non-members); the body's general bias line at review.ts:873 was missing and is a fifteenth site
- COHERE: applied — the two BLOCK rows are D-rc02b-3's and the audit-drift row is D-rc02b-4's; no row is graded by two rules
- EXECUTE: applied — every row carries its consequence reading; the two downgrades (P2, P7) and the two conditionals (P4, S3) are the only grade changes
- FALSIFY: applied — a pointer that restates the ladder beside itself is the rc16 disease (A4); the delta's wording test is "names the ladder, states the condition, states no definition"
- CONFORM: applied — R-crc-14 (stated once, others point), R-crc-10 (the pointer form is a text change a grep can check; the reading is prose)
- FEASIBILITY: applied — seventeen line edits in one body plus one prompt paragraph; `orbit-review`'s delta is MODIFIED blocks only
- CONSUME: applied — the readers of a severity (trail, gate, render, walk) read the VALUE, not the rule that chose it; nothing downstream parses the pointer
- INVOKE: applied — fires every time a reviewing AI loads the pass reference; the prompt paragraph fires on every external handoff

### D-rc02b-3 — a lifecycle BLOCK is not a severity; it is reported and leaves the scorecard
Domain: every site where the review surface names something that must be addressed before apply
| member | covered by |
|---|---|
| P1 — `orbit validate` failure (body line 161) | reported as a block in the emit's `blocks` array; not counted; NOTHING stops on it mechanically (corrected at walk 1 — apply has no precondition) |
| P8 — unresolved `@review:` marker (body line 175) | same; the "when ambiguous, classify as CRITICAL" clause deleted with it |
| the report example's P8 line (body line 157) | wording follows P8 |
| the external pass list's P8 line (body line 523, "must be addressed before apply") | wording follows P8; an external reviewer REPORTS the marker under a block line, not under `## CRITICAL` |
Closure: SOURCED — `grep -n -i "before apply\|must address\|block" src/core/templates/workflows/review.ts` on 2026-10-03; four hits in the review surface, the rest are the handoff preflight and position-readout prose
Moves:
- READ: applied — all four lines read; P1's rule is "CRITICAL on validate failure", P8's carries the inverted bias clause
- ENUMERATE: applied — the table; the system pass list names no block
- COHERE: applied — one open seam: where does an external reviewer PUT a block? The prompt's output format has three severity sections and no block slot — the delta adds a `## Blocks` section. CORRECTED 2026-10-03 at walk 1: the INTERNAL pass had no carrier either (a `blocks` payload key is refused by the live gate — executed by the fresh pass) and the render had no slot for either genre; the change now adds `blocks` to the review payload, collects `## Blocks` items in the render parser, and renders a `### Blocks` section
- EXECUTE: applied — on today's record, P8 fired as CRITICAL in rc02's proposal pass 3 (a marker left in design.md); under this rule the same pass reports it under the block line and its CRITICAL count drops by one
- FALSIFY: applied — a block that leaves the count could be MISSED by a walk that reads only findings; the walk body's triage table must list blocks first, which is a one-line edit in `orbit-address-reviews` (already in the five)
- CONFORM: applied — the false-positive bias in `orbit-conventions` is restored to one direction. CORRECTED 2026-10-03 at walk 1: the claim that "apply's existing precondition is the owner" was FALSE — the fresh proposal pass grepped `apply-change.ts` for validate and marker checks and found none; the only lifecycle marker reader is archive Step 1.5's warning. A READ failure written inside a CONFORM line; the ladder now states the absent stopper as a known limit and names rc10-apply-closure
- FEASIBILITY: applied — four line edits plus one prompt section
- CONSUME: applied — `scorecardRollupCheck` never sees a block; the gate's counts fall by exactly the blocks that used to be CRITICAL; the render gains a `### Blocks` slot and the walk lists `blocks[]` first (walk 1)
- INVOKE: applied — P1 and P8 run on every proposal review; the external section is in every prompt

### D-rc02b-5 — a REPRODUCTION is a case the reader can re-execute, carried as a named field or body
Domain: every surface that produces, checks, carries, documents or consumes a finding's reproduction
| member | covered by |
|---|---|
| review body Step 9 field enumeration (producer, internal) | names `reproduction` beside `recommendation` |
| external prompt output format (producer, external) | the `**Reproduction**:` body after `**Description**:`, with the one-paragraph ladder |
| `validatePayload` / write gate in emit-composition (checker) | refuses a CRITICAL whose `reproduction` is absent, non-string or blank, naming the title; the nested-key gap stays (unknown finding keys were never checked) |
| `normalizeExternalPass` in report-render (reader, external) | learns the label as a body opener; absent on a CRITICAL → `unreproduced` mark |
| the internal normalizer in report-render (reader, internal) | carries the string through; renders it under the recommendation |
| `parseExternalMarkdown` in trail.ts (counter) | must NOT see the label as structure — counts by `###` only; untouched, verified by a test |
| address-reviews virtual-marker tables, markdown and JSON (consumer) | gain a `reproduction` row each; Step 3a's first move for a CRITICAL is "re-run it" |
| `references/run-summary-schema.md` (documentation mirror) | names the field; the rc01 parity test's nested allowlist (test line 157) learns it |
| `orbit-conventions`' canonical review-emit example (documentation) | its CRITICAL gains a reproduction — the known contradiction the charter named |
| `orbit-review`'s finding-entry shape (owner of the field) | the `recommendation_options` precedent: one requirement, "Optional … field on finding entries", mirrored as REQUIRED-when-CRITICAL |
Closure: SOURCED — the readers of a finding entry are the five modules whose finding-entry access was read file by file on 2026-10-03 (emit-composition's rollup and `validatePayload`; report-render's two normalizers; trail's `parseExternalMarkdown`; the two bodies' mapping tables) plus the two documentation sites the charter named. CORRECTED at walk 1: an earlier wording named a grep for `recommendation_options` as the act; that grep returns four files including `audit-drift.ts` and was not what was run — audit-drift's reference documents finding entries too and is a documentation mirror OUTSIDE the stage (D-rc02b-4)
Moves:
- READ: applied — the eleven on record carry the field as a free string (rc02's cycle); the write gate's unknown-KEY check is top-level only (emit-composition 474–490) while the scorecard rollup already reads each entry's dimension and severity (901–920 — corrected at walk 1: "first check inside an entry" was false); the external parser drops a non-structural line before the Description body opens (report-render 470–500)
- ENUMERATE: applied — the table; the counter row is the one a naive edit would miss (Q-crc-15's two grammars)
- COHERE: applied — a body AFTER Description keeps today's parser contract intact for files that lack it; a label BEFORE Description would change where the body opens
- EXECUTE: applied — on the 110 CRITICALs on record, 11 pass the gate as-is, 99 would be refused; the 99 predate the rule and are history, not a migration
- FALSIFY: applied — a non-empty check admits "see above"; the walk is the falsifier, not the gate (R-crc-10), and D-rc02b-6 states the cost
- CONFORM: applied — R-crc-10 (presence is observable; truth is judged), R-crc-14 (the ladder owns what a CRITICAL carries; the entry-shape requirement points)
- FEASIBILITY: applied — one gate predicate, one parser label, two table rows, one allowlist entry, two doc edits
- CONSUME: applied — the report renders it under the recommendation blockquote; the walk reads it from the marker; the gate never reads it
- INVOKE: applied — fires on every CRITICAL written through `orbit emit review` and on every external file parsed for a report

## Decisions

- **2026-10-03 — D-rc02b-1: the stage is explored as ONE change over FIVE capabilities; the R-crc-1 breach is declared for ratification, not split away.** Sal: hold. The
  charter named `orbit-conventions`, `orbit-emit-composition`, `orbit-address-reviews`; the code reads two more — `orbit-review` owns the finding entry shape (the
  `recommendation_options` precedent), the external prompt template and the sixteen per-pass severity rules; `orbit-report-rendering` owns the external parser, the
  only reader that could see a `**Reproduction**:` line as structure. The rule-before-enforcement split (conventions + review, then emit-composition +
  report-rendering + address-reviews) was briefed and declined: the five surfaces are one mechanism — a field born in the prompt and the entry shape, refused at
  the gate, marked at the parser, re-run at the walk — and splitting it would ship a rule nothing checks for the gap's duration. Under R-crc-1's own text the
  breach stands as a breach to be ratified at propose, with the proposal-mode blind pair R-crc-4 prescribes within 20% of the ceiling.
  Kind: scope
  Disposition: live

- **2026-10-03 — D-rc02b-2: the ladder is stated ONCE, in `orbit-conventions`; every per-pass severity rule in the review body becomes a POINTER with its
  consequence reading.** Fourteen sites today — eight proposal-pass rules, five system-pass rules, the report example (CORRECTED 2026-10-03 at walk 1 from "sixteen": measured by `grep -n "CRITICAL\|WARNING\|SUGGESTION" src/core/templates/workflows/review.ts`; the domain table's extra rows are non-members listed for completeness) — each state a severity by pass — "CRITICAL when a spec requirement has no task" — which
  is a second statement of what CRITICAL means (R-crc-14; the sixth instance of the rule-stated-twice pattern, counted at exploration this time). Each becomes
  "<condition>: <severity>, per the ladder, because <the consequence>": P2's missing task and P7's delta vocabulary read as divergence risk and DOWNGRADE to
  WARNING (still gating; no longer buying an extra blind pass under R-crc-4); P4's contradiction and S3's removal are CRITICAL only with the reproduction, else
  WARNING; P5 and S5 are the ladder's own definitions and stay; P3, P9, S1, S2, S4 survive as written with the tax on their CRITICALs. Settled under R-crc-3.
  Kind: rule
  Disposition: live
- **2026-10-03 — D-rc02b-3: a lifecycle BLOCK is not a severity; it is reported in the body and leaves the scorecard.** Two of the sixteen rules name no
  consequence: P1's validate failure and P8's unresolved `@review:` marker stop apply whatever they would cost a user, and P8 had to invert the false-positive
  bias ("when ambiguous, classify as CRITICAL") to make the count carry that second meaning. Both become "report and block" — the pass names the block, apply's
  precondition owns stopping on it — with zero effect on the review's CRITICAL count, so "0 CRITICAL" on a report means exactly what the ladder says. Sal: leave.
  Kind: rule
  Disposition: live
- **2026-10-03 — D-rc02b-4: audit-drift's own severity assignment (system Pass 6 preserves it) is a SIXTH statement site, OUT of this stage.** It lives in
  `orbit-audit-drift`, a capability outside the five; the ladder's one-statement rule reaches it by a later pointer touch, not by this change. Named here so the
  residual travels: the proposal's design Risks and the conventions delta carry it as a known limit. ADDED
  2026-10-03 at walk 3: upstream `verify-change` is a second such site (its own CRITICAL/WARNING rules); a
  system review folding its findings grades them by the ladder as their AUTHOR (Pass 0), which is not the
  reader's re-grade D-rc02b-6 forbids.
  Kind: scope
  Disposition: live

- **2026-10-03 — D-rc02b-5: a REPRODUCTION is a case the reader can re-execute — the inputs, the rule or command, the expected result, the observed result.**
  A command in system mode; a CONSTRUCTED CASE in proposal mode, where nothing runs (the eleven on record from rc02's cycle are the exemplar: a named trail,
  the rule applied by hand, the wrong answer it yields). The engine checks PRESENCE of a non-empty value and nothing else (R-crc-10); whether it reproduces is
  the walk's judgement, made at Step 3a's first move for a CRITICAL. Internal: `reproduction` is a string on the finding entry, required non-empty when severity
  is CRITICAL, optional otherwise, multi-line allowed (never a single-line slot), refused by the write gate naming the finding's title. External: `**Reproduction**:`
  opens a labelled BODY after `**Description**:`, ended by the next `###` or `##` heading; a CRITICAL with no such body is counted, rendered `unreproduced`, never
  re-graded. Settled under R-crc-3; Sal: go ahead.
  Kind: rule
  Disposition: live

- **2026-10-03 — D-rc02b-6: an unreproduced CRITICAL still COUNTS — in the gate's substantive set and in R-crc-4's extra-pass rule — and is SETTLED at the walk,
  never re-graded by a reader.** A consequence of D-rc02b-5 and of `trail.ts`'s standing rule (severity from section membership, "NEVER re-graded"): the
  render marks it `unreproduced`, the walk's Step 3a asks for the reproduction first and resolves it stale-with-evidence when none can be produced, and the
  gate reads the walk's disposition exactly as it does for any other finding. The cost is stated: an external reviewer can gate a change on a CRITICAL with no
  evidence until the walk answers it; the alternative (demote on absence) is a consumer re-grading an author's severity, which is the move every reader refuses.
  Kind: fact
  Disposition: live

## Open questions

## Considered & out

- **Splitting on the rule-before-enforcement seam** (2026-10-03) — stage 1 the definitions, the re-pointed per-pass rules, the prompt and the entry field
  (`orbit-conventions` + `orbit-review`); stage 2 the write gate, the parser mark and the walk reader (three at the ceiling). Declined by Sal (hold): the
  five surfaces are one mechanism, and a rule nothing checks for the gap's duration is the shape rc03a's deferrals took. The breach is declared instead
  (D-rc02b-1). Re-entry trigger: the proposal's size check (requirements, bytes, tasks) reading more than 20% over R-crc-1 on a second axis.
- **Demoting an unreproduced CRITICAL to WARNING at parse** (2026-10-03) — a consumer re-grading an author's severity, the move every reader on the trail
  refuses by rule; and it would silently change the gate's count on the file's shape rather than its content. The mark is render-only (D-rc02b-6).

## References

- `orbit/architecture/clean-up-review-cycle.md` — `### Stage rc02b-severity-ladder` (the charter, with its R-crc-11 impact note) and R-crc-11
- `orbit/specs/orbit-conventions/spec.md` — `### Requirement: Severity ladder` (three names + false-positive bias; nothing by consequence) and the external-slot sentence at line 822 (the assigned residue from rc02's v4 bump)
- `src/core/templates/workflows/review.ts` — the per-pass severity rules (proposal lines 161–177, system 220–230), the external prompt template (lines 560–660; the `### Title` / `**File**:` / `**Description**:` triple), Step 9's field enumeration (line 816)
- `src/core/emit-composition.ts` — `validatePayload` (474–490: unknown keys refused at the TOP level only; finding entries unchecked), `scorecardRollupCheck` (901–920)
- `src/core/report-render.ts` — `NormalizedFinding` (57–72), the internal finding normalizer (236–283), `normalizeExternalPass` (396–560: the only reader that could see a `**Reproduction**:` line as structure)
- `src/core/artifact-graph/trail.ts` — `isSubstantive` (19–22), `parseExternalMarkdown` (348–400: severity from section membership, never re-graded)
- `src/core/templates/workflows/address-reviews.ts` — the two virtual-marker mapping tables (51–60 markdown, 215–226 JSON), Step 3a pushback (777–786)
- `orbit/specs/orbit-review/spec.md` — `Optional recommendation_options field on finding entries` (line 308; the precedent for a finding-level field)
- `test/core/emit-schema-parity.test.ts` — line 157: the nested finding-key allowlist the parity test consults
- On record: 133 internal review emits, 819 findings, 110 CRITICAL, 11 with a `reproduction` key (rc02's cycle); 120 external findings files; 59 external prompts, ONE carrying a hand-written consequence ladder (`2026-09-12-rc01-instrument-fidelity/.orbit-runs/external-prompt-system-2026-09-11T23-59-50Z.md`, lines 161–166)
