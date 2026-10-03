## Context

The severity labels are the one vocabulary every mechanism in the review cycle consumes and nothing
defines. `trail.ts` reads them from section membership or the `severity` field and never re-grades;
`isSubstantive` makes CRITICAL + WARNING the gating set; R-crc-4 lets a CRITICAL buy a further blind
pass; R-crc-11(b) asks the AI to route findings on them. The producers grade by habit: the review
body carries fourteen per-pass rules written before the ladder existed (measured by grep on 2026-10-03;
the exploration said sixteen and seventeen in different places — corrected at walk 1) (two of them lifecycle blocks
named CRITICAL so the count would carry a second meaning), the external prompt carries no severity
guidance at all, and `orbit-conventions`' Severity ladder says three names and a bias. The evidence
that would make a CRITICAL checkable already appears on the trail unprompted — eleven internal
CRITICALs with a `reproduction` key the write gate never inspected (its unknown-KEY check is top-level only; the rollup reads
severity and dimension), three recent external files writing `Reproduction:` inline where `normalizeExternalPass` buries
it in the recommendation (after `**Description**:`) or drops it (before). See `explore.md` for the
measurements and the walk that settled the six decisions this design implements.

**Size.** The stage charter named three capabilities; the exploration measured five; this proposal
measures SIX. The sixth, `orbit-review-external`, owns the prompt's output format (`Output format
specification in prompt`) and the reference template that restates it — the exploration read the
template in `review.ts` and attributed its ownership to `orbit-review`, a READ failure of the kind
D-rc02b-2's own Mechanism entry claims to have applied. It is recorded here rather than absorbed,
because the R-crc-1 breach Sal ratified at five is being declared at six. Sixteen requirement blocks
after three walks (13 MODIFIED, 3 ADDED) against ~12; the carried-bytes blocks change a line or two each.

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
- Judging whether a reproduction reproduces — the engine checks presence and shape (a non-empty string on
  a CRITICAL; a string wherever present; single-line `blocks` entries), never truth (R-crc-10); truth is the
  walk's.
- `orbit-audit-drift`'s own severity assignment and upstream `verify-change`'s rules (D-rc02b-4) — statement
  sites outside the six, named in the ladder as known limits; a system review folding verify-change's
  findings grades them by the ladder as their author (Pass 0 scenario).
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
- **D2 — per-pass rules are pointers with their reading (D-rc02b-2).** Each of the fourteen body sites,
  the body's general bias line (review.ts:873), and the five `orbit-review` scenarios that state a severity becomes "<condition>: <severity>, per the
  ladder, because <consequence>". Grades that change: P2's missing task and P7's delta vocabulary →
  WARNING (divergence risk; still gating, no longer buying a pass); P4's contradiction and S3's removal →
  CRITICAL only with the reproduction. The pointer test for the delta's wording is "names the ladder,
  states the condition, states no definition" — a pointer that restates the definition beside itself is
  the rc16 disease. *Alternative*: keep the per-pass rules as the ladder's worked examples in
  `orbit-review` — rejected as a second statement site (R-crc-14).
- **D3 — blocks are reported with a carrier, never counted (D-rc02b-3).** A validate failure (P1) and an
  unresolved `@review:` marker (P8) are BLOCKS. Carrier: an optional `blocks` array on the review payload
  (single-line strings, gate-checked for shape, never rolled up) on internal passes; a `## Blocks` section
  whose `- ` items the renderer's parser COLLECTS on external files (the trail counter ignores the section —
  pinned by a test). The report renders `### Blocks` above `### Findings` for both genres; the walk lists
  blocks first at triage; `--strict` stops on a block as on a CRITICAL; `--mark` writes none. P8's "when
  ambiguous, classify as CRITICAL" is deleted. **The stopper, honestly:** the exploration's Mechanism entry
  named "apply's existing precondition" as the owner that stops on a block. It does not exist — the fresh
  proposal pass grepped `apply-change.ts` for validate and marker checks and found none; the only
  lifecycle marker reader is archive Step 1.5's warning. The ladder states this as a KNOWN LIMIT: a block
  is a report with a name, the stop is the human's, and giving apply a precondition belongs to
  rc10-apply-closure (which owns pre-archive conditions). *Alternatives*: keep blocks as a special-cased
  CRITICAL (rejected — Sal: leave); descope blocks to the external genre (rejected at walk 1 — "0 CRITICAL"
  would keep two meanings on internal passes); add an apply Step 0 precondition here as a seventh capability
  (rejected at walk 1 — rc10's territory, and the stage is already two axes over).
- **D4 — the field and its gate (D-rc02b-5).** `reproduction` is a string on the internal finding entry:
  multi-line allowed (never a single-line slot — the trail shape is three lines on a good day), required
  non-empty when `severity` is CRITICAL, optional otherwise. `validatePayload` gains the first check that
  REFUSES on a finding entry's narrative field (the scorecard rollup already reads each entry's dimension
  and severity): a CRITICAL whose `reproduction` is absent, non-string or blank is refused naming the
  finding's title and index, in EVERY mode; a PRESENT non-string `reproduction` on any severity is refused
  too (type is every entry's requirement, content is CRITICAL's — the gate never persists what the
  normalizer refuses; external walk 1) — the check reads one field of one severity and never reads
  `mode` (the architecture-mode exemption is the renderer's, not this check's); unknown finding keys stay
  unchecked (the gap is named, not closed — closing
  it would refuse `recommendation_options`-style forward-compat). The rule lands as an ADDED requirement
  in `orbit-emit-composition` rather than a MODIFIED copy of the 145-line write-gate block: it is a new
  check with its own trigger, and R-crc-1's carried-bytes clarification says the copy would measure the
  format, not the work.
- **D5 — the external body and the mark (D-rc02b-5, D-rc02b-6).** `**Reproduction**:` opens a labelled
  body AFTER `**Description**:`, ended by the next `###` or `##` heading, so a file without it parses
  exactly as today. `normalizeExternalPass` learns the label; the internal normalizer passes the string
  through; the renderer prints the reproduction as a second blockquote under the recommendation; a
  CRITICAL with none renders the mark `[unreproduced]` as a PREFIX before the bold file reference — outside
  the title token, so a copied line still yields the gate's exact title (Q-crc-17). Nothing re-grades: the counts, the gate and
  R-crc-4's extra-pass rule read the authored severity. *Alternative*: demote on absence at parse —
  rejected (explore.md, Considered & out).
- **D6 — the walk reads it first.** Both virtual-marker tables carry `reproduction`; Step 3a's procedure
  gains step (0): for a CRITICAL, re-run the reproduction and record the result as the first evidence in a
  new closed-value entry field `reproduction_rerun` (`reproduced` / `not-reproduced` / `cannot-run` /
  `unreproduced`; absent below CRITICAL) with the output or derivation in `evidence`; a CRITICAL carrying
  none is `unreproduced` and pushback proceeds on the claim alone.
- **D7 — the two contradictions and the residue close in the same change.** The conventions' canonical
  review-emit example gains `"reproduction": "…"` on its CRITICAL; the review body's Step 9 enumeration
  and `references/run-summary-schema.md` name the field (the rc01 parity test's nested allowlist learns
  it); the conventions' external-slot sentence becomes "whose `blind-pair` slot the external return
  half-covers".
- **D8 — no migration.** The gate applies to new writes. The 99 CRITICALs on record without the field are
  a prior generation and stay valid; the renderer marks them `[unreproduced]` BY ABSENCE, never by date —
  on internal passes absence is exactly the prior-generation set, because the gate refuses new ones.
- **D9 — the ladder paragraph is a checked mirror.** The external prompt's `## Severity` paragraph is
  stated once as a fenced production in the conventions ladder requirement and held byte-equal in
  `orbit-review-external`'s reference template (and the generated body) by a parity test — R-crc-14's
  mirror corollary, the rc13a/rc15 shape. *Alternative*: pointer-only — rejected, an adopter's external
  reviewer has none of our specs.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination (shape) |
|---|---|---|---|
| D-rc02b-2 | SOURCED | live rule | `orbit-conventions` › `Severity ladder` — the one-statement clause (SENTENCE naming the source: the review body's pass lists, grep-enumerated); the fourteen members (plus the bias line) land as the re-pointed scenarios in `orbit-review` › `Proposal mode runs nine passes` and `System mode runs verify-change + six system-wide passes` (SCENARIO SET) |
| D-rc02b-3 | SOURCED | live rule | `orbit-conventions` › `Severity ladder` — the block clause (SENTENCE naming the four sites and the known limit); `orbit-conventions` › `External-review findings markdown format` — the `## Blocks` section; `orbit-review` › `Proposal mode runs nine passes` — the Pass 8, `--strict`/`--mark` and `blocks`-payload scenarios; `orbit-emit-composition` › ADDED `The review payload carries blocks`; `orbit-report-rendering` › the `### Blocks` slot; `orbit-address-reviews` › blocks first at triage (SCENARIO SET — the carrier rows added at walk 1 after the fresh pass found the entry's CONFORM claim false) |
| D-rc02b-5 | SOURCED | live rule — the resolution-log field `reproduction_rerun` lands in `orbit-address-reviews` › `Resolution-log JSON shape extensions…` (walk 3) | `orbit-conventions` › `Severity ladder` — the reproduction definition (SENTENCE); the ten surfaces land one each as scenarios across `orbit-emit-composition` (ADDED gate requirement), `orbit-report-rendering` (`One grammar…` + ADDED render requirement), `orbit-address-reviews` (`--from-file ingest`, `Pushback discipline`), `orbit-review` (`Internal run summary persisted per mode`), `orbit-review-external` (`Output format specification in prompt`, the reference template) (SCENARIO SET) |
| D-rc02b-1 | — | `Kind: scope` | not carried — history; stated in proposal.md's size paragraph |
| D-rc02b-4 | — | `Kind: scope` | not carried — history; the residual is a Risk below and a named limit in the ladder's text |
| D-rc02b-6 | — | `Kind: fact` | not carried — history; its consequence is D5's never-re-grade clause |

No BOUNDED entry; no `key_defects`; the engine's parse of the file on 2026-10-03 read 3 rules
accounted, 0 open, which my reading of the three entries against the grammar agrees with.

## Touchpoints

- `src/core/emit-composition.ts` — the finding-level CRITICAL/reproduction check in `validatePayload` (every mode); `blocks` added to the review payload table with its shape check.
- `src/core/report-render.ts` — `normalizeExternalPass` learns `**Reproduction**:` as a body opener and collects `## Blocks` items; the internal normalizer passes `reproduction` and `blocks` through; `renderReport` prints the reproduction blockquote, the `[unreproduced]` prefix and the `### Blocks` slot.
- `src/core/templates/workflows/apply-change.ts` — NOT touched: no precondition is added here (the known limit; rc10's territory).
- `src/core/artifact-graph/trail.ts` — `parseExternalMarkdown` stops reading `**File**:`/`**Description**:` once a finding's Description body has opened (conforming to the conventions format rule the render parser already follows — external walk 1); a test pins the finding KEY (title, file) through both readers and that `## Blocks` leaves the counter untouched.
- `src/core/templates/workflows/review.ts` — the fourteen per-pass sites, the report example and the bias line re-pointed; Pass 0's fold rule; Step 9's field list; the prompt template's ladder paragraph, Reproduction body and Blocks section; `references/run-summary-schema.md`.
- `src/core/templates/workflows/address-reviews.ts` — both virtual-marker tables; the expected-file-format block; Step 3a step (0); triage lists blocks first.
- `test/core/emit-schema-parity.test.ts` — the nested allowlist learns `reproduction`, `blocks`, `reproduction_rerun`; a new parity test holds the template's `## Severity` paragraph byte-equal to the conventions fence.
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
- [Nothing stops on a block mechanically] → stated in the ladder as a known limit; the report's `### Blocks`
  section and triage-first listing are what the human reads before apply; the precondition is
  rc10-apply-closure's.
- [Two parsers, one contract (Q-crc-15)] → the external pass found the third instance inside this change:
  the trail reader took ANY later `**File**:` line as the finding's file, so a path quoted in a Reproduction
  body re-filed the finding at the gate. The rule is now stated ONCE in the conventions format requirement
  (field lines are recognised only before the Description body opens) and both readers conform; the key
  (title, file) is pinned through both by a test. The pre-existing hole — a Description body quoting a path —
  closes with it.
- [Sixteen blocks over ~12] → the three walks each added a carried block; changed lines stay small and the
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
- **An apply Step 0 precondition as a seventh capability** (walk 1, finding 1 option A′) — rejected: rc10-apply-closure owns pre-archive conditions and the stage is already over on two axes; the limit is stated instead.
- **Descoping blocks to the external genre** (walk 1, finding 1 option B) — rejected: "0 CRITICAL" would keep two meanings on internal passes, undoing the reason for D-rc02b-3.
