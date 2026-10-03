## Context

The severity labels are the one vocabulary every mechanism in the review cycle consumes and nothing
defines. `trail.ts` reads them from section membership or the `severity` field and never re-grades;
`isSubstantive` makes CRITICAL + WARNING the gating set; R-crc-4 lets a CRITICAL buy a further blind
pass; R-crc-11(b) asks the AI to route findings on them. The producers grade by habit: the review
body carries seventeen per-pass rules written before the ladder existed (two of them lifecycle blocks
named CRITICAL so the count would carry a second meaning), the external prompt carries no severity
guidance at all, and `orbit-conventions`' Severity ladder says three names and a bias. The evidence
that would make a CRITICAL checkable already appears on the trail unprompted — eleven internal
CRITICALs with a `reproduction` key the write gate never inspected (it checks top-level payload keys
only), three recent external files writing `Reproduction:` inline where `normalizeExternalPass` buries
it in the recommendation (after `**Description**:`) or drops it (before). See `explore.md` for the
measurements and the walk that settled the six decisions this design implements.

**Size.** The stage charter named three capabilities; the exploration measured five; this proposal
measures SIX. The sixth, `orbit-review-external`, owns the prompt's output format (`Output format
specification in prompt`) and the reference template that restates it — the exploration read the
template in `review.ts` and attributed its ownership to `orbit-review`, a READ failure of the kind
D-rc02b-2's own Mechanism entry claims to have applied. It is recorded here rather than absorbed,
because the R-crc-1 breach Sal ratified at five is being declared at six. Fourteen requirement blocks
against ~12; the two over are carried-bytes blocks whose changed bytes are one line each.

## Goals / Non-Goals

**Goals:**
- One statement of what each severity MEANS, by consequence, in `orbit-conventions`; every other surface
  names it and points (R-crc-14).
- A CRITICAL carries a reproduction, REFUSED at the write gate where the engine produces the record,
  REQUESTED and MARKED where it cannot refuse (the external file).
- Lifecycle blocks leave the severity vocabulary and the scorecard.
- A walk reads the reproduction first.

**Non-Goals:**
- Re-grading any finding on the trail, or any external CRITICAL at parse (D-rc02b-6).
- Judging whether a reproduction reproduces — the engine checks presence of a non-empty value, nothing
  more (R-crc-10); truth is the walk's.
- `orbit-audit-drift`'s own severity assignment (D-rc02b-4) — a seventh statement site, reached by a
  later pointer touch.
- Migrating prior-generation emits. Readers tolerate absence as they do for `model` and `consent`.
- Changing the gate's counting rule, the cadence, or `isSubstantive`.

## Decisions

- **D1 — the ladder's text, by consequence (D-rc02b-2, D-rc02b-5).** CRITICAL: a user path breaks or
  data is lost, AND the finding carries its reproduction. WARNING: an implementation built to the
  artifact as written could diverge from what it intends. SUGGESTION: everything else. A reproduction is
  a case the reader can re-execute — the inputs, the rule or command, the expected result, the observed
  result; a command in system mode, a CONSTRUCTED CASE in proposal mode (the eleven on record are the
  exemplar: a named trail, the rule applied by hand, the wrong answer it yields). The false-positive bias
  stays and now has one direction only. *Alternative*: executed-only reproductions — rejected, because
  proposal mode runs nothing and the constructed cases on record were what made rc02's CRITICALs
  settle in one walk.
- **D2 — per-pass rules are pointers with their reading (D-rc02b-2).** Each of the seventeen body sites
  and the five `orbit-review` scenarios that state a severity becomes "<condition>: <severity>, per the
  ladder, because <consequence>". Grades that change: P2's missing task and P7's delta vocabulary →
  WARNING (divergence risk; still gating, no longer buying a pass); P4's contradiction and S3's removal →
  CRITICAL only with the reproduction. The pointer test for the delta's wording is "names the ladder,
  states the condition, states no definition" — a pointer that restates the definition beside itself is
  the rc16 disease. *Alternative*: keep the per-pass rules as the ladder's worked examples in
  `orbit-review` — rejected as a second statement site (R-crc-14).
- **D3 — blocks are reported, never counted (D-rc02b-3).** A validate failure (P1) and an unresolved
  `@review:` marker (P8) are BLOCKS: the pass reports them in the body under a block line; apply's
  existing precondition (`orbit validate --strict`, the marker grep) owns stopping on them; no scorecard
  cell changes. P8's "when ambiguous, classify as CRITICAL" is deleted. External reviewers get a
  `## Blocks` section in the output format; BOTH parsers already treat an unknown `##` section as
  non-structural (`trail.ts` sets `section = null`; `report-render.ts` routes it to `other`), so the
  count and the render are unchanged by construction and a test pins it. The walk's triage reads the
  section from the file and lists blocks before findings. *Alternative*: keep blocks as a special-cased
  CRITICAL stated in the ladder — rejected (Sal: leave) because "0 CRITICAL" would keep two meanings.
- **D4 — the field and its gate (D-rc02b-5).** `reproduction` is a string on the internal finding entry:
  multi-line allowed (never a single-line slot — the trail shape is three lines on a good day), required
  non-empty when `severity` is CRITICAL, optional otherwise. `validatePayload` gains its first check
  INSIDE a finding entry: a CRITICAL whose `reproduction` is absent, non-string or blank is refused
  naming the finding's title; unknown finding keys stay unchecked (the gap is named, not closed — closing
  it would refuse `recommendation_options`-style forward-compat). The rule lands as an ADDED requirement
  in `orbit-emit-composition` rather than a MODIFIED copy of the 145-line write-gate block: it is a new
  check with its own trigger, and R-crc-1's carried-bytes clarification says the copy would measure the
  format, not the work.
- **D5 — the external body and the mark (D-rc02b-5, D-rc02b-6).** `**Reproduction**:` opens a labelled
  body AFTER `**Description**:`, ended by the next `###` or `##` heading, so a file without it parses
  exactly as today. `normalizeExternalPass` learns the label; the internal normalizer passes the string
  through; the renderer prints the reproduction as a second blockquote under the recommendation; a
  CRITICAL with none renders `unreproduced` beside its title. Nothing re-grades: the counts, the gate and
  R-crc-4's extra-pass rule read the authored severity. *Alternative*: demote on absence at parse —
  rejected (explore.md, Considered & out).
- **D6 — the walk reads it first.** Both virtual-marker tables carry `reproduction`; Step 3a's procedure
  gains step (0): for a CRITICAL, re-run the reproduction and record the result as the first evidence;
  a CRITICAL carrying none is noted `unreproduced` and pushback proceeds on the claim alone.
- **D7 — the two contradictions and the residue close in the same change.** The conventions' canonical
  review-emit example gains `"reproduction": "…"` on its CRITICAL; the review body's Step 9 enumeration
  and `references/run-summary-schema.md` name the field (the rc01 parity test's nested allowlist learns
  it); the conventions' external-slot sentence becomes "whose `blind-pair` slot the external return
  half-covers".
- **D8 — no migration.** The gate applies to new writes. The 99 CRITICALs on record without the field are
  a prior generation; the renderer marks nothing on them (the mark is for external files; internal
  prior-generation emits render as today).

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination (shape) |
|---|---|---|---|
| D-rc02b-2 | SOURCED | live rule | `orbit-conventions` › `Severity ladder` — the one-statement clause (SENTENCE naming the source: the review body's pass lists, grep-enumerated); the seventeen members land as the re-pointed scenarios in `orbit-review` › `Proposal mode runs nine passes` and `System mode runs verify-change + six system-wide passes` (SCENARIO SET) |
| D-rc02b-3 | SOURCED | live rule | `orbit-conventions` › `Severity ladder` — the block clause (SENTENCE naming the four sites); `orbit-conventions` › `External-review findings markdown format` — the `## Blocks` section; `orbit-review` › `Proposal mode runs nine passes` — the Pass 8 scenario |
| D-rc02b-5 | SOURCED | live rule | `orbit-conventions` › `Severity ladder` — the reproduction definition (SENTENCE); the ten surfaces land one each as scenarios across `orbit-emit-composition` (ADDED gate requirement), `orbit-report-rendering` (`One grammar…` + ADDED render requirement), `orbit-address-reviews` (`--from-file ingest`, `Pushback discipline`), `orbit-review` (`Internal run summary persisted per mode`), `orbit-review-external` (`Output format specification in prompt`, the reference template) (SCENARIO SET) |
| D-rc02b-1 | — | `Kind: scope` | not carried — history; stated in proposal.md's size paragraph |
| D-rc02b-4 | — | `Kind: scope` | not carried — history; the residual is a Risk below and a named limit in the ladder's text |
| D-rc02b-6 | — | `Kind: fact` | not carried — history; its consequence is D5's never-re-grade clause |

No BOUNDED entry; no `key_defects`; the engine's parse of the file on 2026-10-03 read 3 rules
accounted, 0 open, which my reading of the three entries against the grammar agrees with.

## Touchpoints

- `src/core/emit-composition.ts` — the finding-level CRITICAL/reproduction check in `validatePayload`; the review payload table unchanged.
- `src/core/report-render.ts` — `normalizeExternalPass` learns `**Reproduction**:` as a body opener; the internal normalizer passes `reproduction` through; `renderReport` prints it and the `unreproduced` mark.
- `src/core/artifact-graph/trail.ts` — no edit; a new test pins that the label and a `## Blocks` section leave the counter untouched.
- `src/core/templates/workflows/review.ts` — the seventeen per-pass sites and the report example re-pointed; Step 9's field list; the prompt template's ladder paragraph, Reproduction body and Blocks section; `references/run-summary-schema.md`.
- `src/core/templates/workflows/address-reviews.ts` — both virtual-marker tables; the expected-file-format block; Step 3a step (0); triage lists blocks first.
- `test/core/emit-schema-parity.test.ts` — the nested allowlist learns `reproduction`.
- `test/core/*.test.ts` — gate refusal, external body parse, unreproduced mark, counter blindness, internal pass-through; the generated-surface fidelity tests for the re-pointed sites.
- `orbit/specs/*/spec.md` — six capabilities, synced at archive.

## Risks / Trade-offs

- [The gate admits any non-empty string — "see above" passes] → by design (R-crc-10): the engine checks
  presence, the walk checks truth at Step 3a step (0); D-rc02b-6 states the cost.
- [External reviewers ignore the request and keep writing CRITICALs without the body] → the mark is
  visible on every render and the walk asks first; the count is unchanged either way, so a lazy
  reviewer costs a mark, not a verdict.
- [`orbit-audit-drift` grades by its own rules — a seventh statement site] → D-rc02b-4, out of scope;
  the ladder names it as a known limit so the residual survives archive; the later touch is a pointer.
- [The exploration miscounted a capability (five, not six)] → recorded here and in the proposal; the
  blind pair reviews the measurement as well as the mechanism; the breach is declared at six.
- [Prior-generation emits lack the field] → readers tolerate absence; the gate applies to new writes
  only; no re-grade, no migration.
- [Two parsers, one contract (Q-crc-15)] → the external body is parsed in `report-render.ts` only; the
  trail counter is untouched and pinned by a test to ignore both the label and `## Blocks`.
- [Fourteen blocks over ~12] → the two over are carried-bytes copies with one changed line each; the
  reviewer reads the diff, not the carriage.

## Alternatives considered

- **Rule-before-enforcement split** (conventions + review, then emit-composition + report-rendering +
  address-reviews) — declined by Sal (explore.md, Considered & out): one mechanism, and a rule nothing
  checks for the gap's duration is the shape rc03a's deferrals took.
- **Demoting an unreproduced CRITICAL to WARNING at parse** — a consumer re-grading an author's severity;
  rejected (explore.md, Considered & out).
- **Per-pass rules as the ladder's worked examples in `orbit-review`** — a second statement site;
  rejected under R-crc-14 (D2).
- **Modifying the 145-line write-gate requirement** — rejected for an ADDED requirement (D4).
