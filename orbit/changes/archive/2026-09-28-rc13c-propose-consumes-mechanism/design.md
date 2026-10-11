# Design: rc13c-propose-consumes-mechanism

## Context

`/orbit:propose`'s consume mode is workflow-body prose in `src/core/templates/workflows/propose.ts`:
Step 0 (mode detection — the presence check, naming inference, the both-dirs conflict), Step 0a (the
structure check), Step 0b (open questions), Step 0c (the section-to-artifact table), Step 0c.5
(Touchpoints), Step 0d (the metadata merge and the move). The PR layer's phase 1 (select + switch)
sits between Step 0 and Step 0a. Its spec is `orbit-propose-modifications`. No engine code reads the
exploration at propose time; the engine's only parse of `explore.md` is the explore emit surface
(`orbit emit explore`, which computes rc13b's five fields through `parseExploreRules`), and the
change-scoped status refuses a staging name (measured 2026-09-26).

rc13a's conventions (`orbit-conventions`: the status-header production, the entry-identity
requirement, the Mechanism grammar, the concluded outcome) and rc13b's readout are live. The explore
body's re-entry table (`orbit-explore-modifications`) already resolves a concluded name on the explore
side; its concluded-outcome requirement names propose's blindness to the header as "the
propose-consumption follow-on's to specify". rc13a's design lists `propose.ts:154/156` as the
"five-section" residue this stage closes.

Constraints: R-crc-1 (one capability, as chartered); R-crc-7 (decision tables; execute the procedure
once — this proposal is the first run through the mapping, and the record below is that execution);
R-crc-10 (propose consumes FORM; truth is the reviewer's); R-crc-14 and its mirror corollary (the
section list and the re-entry rule are pointed at; the body carries a checked mirror only where it
cannot resolve the owner); the no-chaining contract (propose invokes no explore act). The mechanism was
settled in `explore.md` at promotion (D-rc13c-1 … D-rc13c-8 and their Mechanism entries) and REVISED
by two review walks: the live figure is SIX rules — D-rc13c-2 revised twice (the consume-time emit
descoped, then its optional cross-check), D-rc13c-4 amended to a true partition, D-rc13c-8 superseded.
This document's Decisions section is the live statement; `explore.md` is history by rule.

## Goals / Non-Goals

**Goals:**
- A concluded exploration cannot be promoted: propose refuses in Step 0, before any branch is cut, and
  never suggests one by inference.
- What an exploration accounted for reaches the proposal by a stated mapping: CLOSED entries inform
  the requirement they derive; BOUNDED residuals land verbatim in spec text with design pointing at it;
  unaccounted rules are visible in the record.
- The structure check reads the format's owner by pointer, and the body's copy of the list is held to
  it by a test.
- The record says what its source was — the AI's reading of the file — and claims no engine check it cannot show.

**Non-Goals:**
- Reopening a concluded exploration from propose, or removing explore's reopen path (Sal's "no
  avenue" is applied to propose; retiring the reopen scenario in `orbit-conventions` is a separate
  change).
- A new engine surface printing the parsed form for a staging name (Q-crc-24's shape; see
  Considered & out).
- Authoring Mechanism entries at propose (a rule answered at Step 0b is an open domain, D-rc13c-7).
- Judging whether an enumeration is true (R-crc-10).
- The retained "five-section" requirement titles and the `audit-drift.ts` pointer to them.

## Decisions

- **D-rc13c-1 — propose REFUSES a concluded staging directory; it neither reopens nor offers to**
  (Sal, in chat; see `explore.md`). The refuse is a Step 0 outcome, in the resolve-mode sub-step,
  because the PR layer's phase 1 runs between Step 0 and Step 0a — a fact found by reading the body's
  Position paragraph, not the charter. The halt states the conclusion date AND the live `Re-entry:`
  slot verbatim, then stops (AMENDED at the first walk, 2026-09-26, Sal: "a" — the exploration's
  entry quoted the explore-side row without its trigger; stating the trigger is reading the record,
  not offering a reopen, so "no avenue" holds). Naming inference counts LIVE directories only.
  AMENDED at the external system walk (2026-09-28, Sal: "b"): a concluded staging directory BESIDE an
  active change is REFUSED before the conflict prompt, naming both paths — the external pass found the
  prompt's Continue choice would have discarded the concluded record (COHERE); the shape is the explore
  body's own both-exist row, and propose does not become a two-claim resolver. *Alternative rejected*:
  a status-aware Continue that preserves the directory — leaves the two-claim state unnamed. *Alternatives rejected*: offering the reopen inside propose (a second
  executor of the reopen edit; the "why" written from a prompt); treating the invocation as the reopen
  word (the charter allowed it; it makes a "build nothing" record reversible by the command the
  conclusion guards against).
- **D-rc13c-2 — the Mechanism section is read from the FILE; propose fires no emit of its own**
  (REVISED at the first proposal walk, 2026-09-26, Sal: "b" — the descope lane of R-crc-6). The
  fresh pass read what the exploration had not: `orbit-run-summary-emit`'s one-shot scenario says
  propose writes exactly one emit and no additional ones, and its trigger list names the explore body
  as the only writer of explore emits. The consume-time emit the exploration settled would have shipped
  a third writer with no delta on the owning spec, at a second capability. Descoped: propose reads
  entries, tokens and residual slots off `explore.md` by the grammar `orbit-conventions` owns, and
  reads NO prior emit as a cross-check (AMENDED at the external walk, 2026-09-28: the first descope
  kept an optional check keyed on the newest emit postdating the file's last write; the external pass
  measured that git preserves no mtime — a fresh checkout made the file newer than the emit by under
  a millisecond — so the observable is not provenance and the check is gone). The AI's reading of the
  file is the sole source and the record's header says so. The engine check proper waits for a READ-ONLY print of the parsed form, which has no home
  yet (see Risks; an at-archive note opens it as its own question rather than parking it under
  Q-crc-24, whose text is about the citable-pass set). `explore.md`'s D-rc13c-2 entry is history as
  written; this paragraph is the live statement. *Alternative rejected at the walk*: repairing the
  owner (a MODIFIED block on the one-shot scenario and the trigger list) — a second capability and a
  scenario narrowing invented at a walk, the pattern R-crc-6 exists to stop.
- **D-rc13c-8 — SUPERSEDED by the revised D-rc13c-2** (2026-09-26, same walk). It settled how a
  consume-time emit is told apart from a boundary emit; with no consume-time emit there is nothing to
  tell apart. `explore.md` keeps the entry as history; it no longer stands as a live rule, so the
  record below carries no open domain for it.
- **D-rc13c-3 — one capability: the body's section list is a checked mirror held by a parity test**
  (Sal: "a"). The spec scenario points at `orbit-conventions`' format requirement; the body carries the
  six names marked as a mirror; a test reads the requirement's "in this order:" sentence through the
  single-active-owner lookup (`test/helpers/owner-text.ts`) and asserts the body's list equals it.
  *Alternative rejected*: one shared constant interpolated into both bodies (rc13b's one-grammar
  pattern) — pulls `orbit-explore-modifications` into scope.
- **D-rc13c-4 — the Mechanism row is a decision table, and it is a PARTITION** (AMENDED at the
  external walk, 2026-09-28: the external pass found the first table was NOT one — "has a `Closure:`
  token" and "no usable entry" overlap, since a BOUNDED entry missing a slot carries the token AND
  sits in `rules_open` as `bounded-incomplete`, and the no-entry × non-live cell had no row. An
  ENUMERATE failure in a table the exploration marked DERIVED; recorded as such). Five rows tested in
  order: `key_defects` (orphan or duplicate) → reported, no carrier — FIRST, because a duplicate-ID
  second entry is excluded from `rules_total` and would otherwise read as accounted (AMENDED again at
  the in-context walk, 2026-09-28: the external-walk repair defined "accounted" as not-in-`rules_open`
  and let that entry through to the carrier rows); non-live owner → history, no state word; live rule
  in `rules_open` (any state, whatever token) → UNACCOUNTED with the state word; live rule accounted
  with DERIVED/SOURCED → the requirement it derives; live rule accounted with BOUNDED → the two slots
  verbatim in spec text and a Risks pointer. "Accounted" is defined by pointer as "counted in
  `rules_total` AND not in `rules_open`", so the table stays a partition when either field's set changes. The design
  carries a `Mechanism → artifacts` record. AMENDED a third time at the external system walk
  (2026-09-28, Sal: "a"): an adopter's generated skill has neither this repository's specs nor its
  parser (READ — the shipped skill was never read from an adopter's seat), so the body now carries the
  Mechanism grammar as a checked mirror (the grammar module's constant, the same import the explore body
  makes) and "accounted" is defined from the FILE as full conformance to it — the failing clause named
  in the record when no readout is at hand. Row 1 gained its record-row shape (ID plus `line N`, defect
  kind, owner `none`/`duplicate`, destination `none`) and now reports at the Mechanism read, not the
  structure check. *Alternatives rejected*: the read-only engine print (a second capability, reopening
  the size question twice settled); narrowing the claim to eyeballed form.
- **D-rc13c-5 — a CLOSED domain lands as one of four shapes, and the set is BOUNDED.** A normative
  table (D-bcs-7 → the re-entry table), a grammar block (D-bcs-8 → the grammar fences), a scenario set
  (rc13b's grid → the maturity scenarios), a sentence naming the source (D-bcs-6 → the concluded
  outcome's "keys on location"). Read from the only two archives that carry Mechanism sections. The
  residual is declared in the ADDED requirement's text (see Risks, first entry) — this stage's own
  exit-(2) exemplar.
- **D-rc13c-6 — Step 0a checks the listed sections by pointer; an absent Mechanism section warns like
  any other.** "Read, not rejected" (the conventions' pre-rc13a scenario) and "warn, proceed by
  default" (Step 0a) are one behaviour; the consequence of absence is a Risks entry per rule, never a
  block. The residue grep `(five|5)[- ]sections?` over the propose body returns zero after this
  change.
- **D-rc13c-7 — a Step 0b resolve-now writes a conforming Decisions entry; a rule answer is an open
  domain.** An entry appended without the opener has no ID, parses as `open` (line-only), and the
  readout would report an open rule nobody can name. Propose does not author nine-move
  entries; the user is told at the prompt that a rule answer stays unaccounted.

## Mechanism → artifacts

The record D-rc13c-4 requires, authored here for the first time by the mapping it specifies (R-crc-7:
execute the procedure once). Source: the proposing AI's reading of the file; no engine record. (For the reader's interest only,
not as a source: `explore-2026-09-26T18-01-34Z.json`, fired by hand at this propose under the
exploration's original D-rc13c-2 before that step was descoped, reported 7 live rules, 6 accounted, 1
open, 1 residual, 0 key defects, and the AI's reading agreed on every count.) Rows revised at the first walk: D-rc13c-8 is superseded and no longer an open domain,
so the live figure is 6 live rules, 6 accounted.

| entry | token | owner | destination |
|---|---|---|---|
| D-rc13c-1 | SOURCED | live rule | `Consume mode when staging directory exists` (MODIFIED) — a SCENARIO SET for four members (the refuse before the switch; the neither-token case; the conflict-first row, unchanged baseline; the inference exclusion in `Naming inference fallback`) plus ONE SENTENCE for the fifth (a concluded header in the change directory is not a propose input — points at the re-entry requirement); source sentence: the body's Step 0 sub-steps |
| D-rc13c-2 (as revised) | SOURCED | live rule | `Mechanism section consumption` (ADDED) — a SENTENCE naming the source (what is read from the file, by whose grammar; that no prior emit is read); source sentence: the parser's output shape |
| D-rc13c-3 | — | `Kind: scope` | not carried (a scope choice; its test is task 2.4) |
| D-rc13c-4 | DERIVED (derivation amended twice) | live rule | `Mechanism section consumption` (ADDED) — the decision table as REVISED at the external and in-context walks, a normative TABLE shape; the exploration's own table was superseded by the partition (see the amended D-rc13c-4 above) |
| D-rc13c-5 | BOUNDED | live rule | `Mechanism section consumption` (ADDED) — the four shapes as a table AND the two residual slots verbatim as the requirement's named limit; Risks below points at it |
| D-rc13c-6 | SOURCED | live rule | `Validate explore.md structure before consuming` (MODIFIED) — a scenario set (present / absent incl. Mechanism / unreadable); source sentence: the existing three scenarios |
| D-rc13c-7 | SOURCED | live rule | `Open question handling` (MODIFIED) — the resolve-now scenario, split for the rule case |
| D-rc13c-8 | — | superseded (design, first walk) | not carried — history; the consume-time emit it described no longer exists |

## Risks / Trade-offs

- [D-rc13c-5's set of CLOSED shapes is BOUNDED] → the residual is stated in
  `specs/orbit-propose-modifications/spec.md`, requirement `Mechanism section consumption`, as its
  named limit (the OWNER); this entry POINTS there and restates nothing. Exit criterion (2) is measured
  on exactly these two carriers.
- [One reader of the grammar at propose — the AI] → no engine record is consulted, because none can be
  shown to describe the current bytes (git keeps no mtime; the external pass measured a fresh checkout
  flipping the order). The engine's parse stays the REVIEWER's cross-check after the fact, and a
  READ-ONLY print of it for a staging name is the follow-on task 4.5 opens as its own question.
- [`explore.md`'s D-rc13c-2 and D-rc13c-8 entries read as live rules a reader of the archived file
  would take at face value] → the file is history by the persists-unchanged requirement; the design is
  the live statement (this document's Decisions), and the record above names the revision. A reader
  parsing the archived `explore.md` will count D-rc13c-8 as `absent`; that count describes the
  exploration as it closed, not the change as it shipped.
- [The `orbit-propose` hash pin moves] → deliberately — at apply for the body edit in five steps, and once
  more at the system blind-pair walk for its body edits — each re-record carrying its dated reason (rc04c's sizing lesson: a hash
  pin names nothing — this plan names it).
- [Naming inference now reads a header per staging directory] → one read of the first NON-BLANK line
  per directory (the status-header production keys on the first non-blank line, never the first
  line); the "exactly one" count is over live directories, so a repo with one live and one concluded
  staging dir proposes the live one without a prompt.
- [A pre-rc13a `explore.md` (no Mechanism section) reaches propose] → Step 0a warns, proceeds by
  default, and the record lists every live rule as UNACCOUNTED (`absent`). Intended: the demanding
  default, stated so the review does not rediscover it. The migration surface is zero staging
  directories today.
- [Body prose teaches a mapping the engine does not check] → CLOSED destinations are judgment and
  the deliverable is the RECORD (R-crc-10); the one mechanical check is BOUNDED's verbatim landing,
  which the body performs by grep before Step 0d and the fidelity test pins as a step.
- [Five living surfaces still describe this stage as a pending follow-on] → `orbit/specs/orbit-conventions/spec.md`
  lines 980, 994 and 1022 (the concluded-outcome KNOWN paragraph and the accounted-closure text) and
  `src/core/templates/workflows/explore.ts` lines 610 and 657 say propose does not read the header token and
  that the residual transfer is "the propose-consumption follow-on's to specify". This change made them
  false. DESCOPED at the system blind-pair walk (Sal: "a"): none is in this change's one capability, and
  the class is the one rc13a deferred — the at-archive note 4.6 hands the five sites to the retirement-class
  sweep, and the stale baseline sentence is an ACCEPTED RESIDUAL for the archive's readiness record.
- [Size] → ONE capability, six requirement blocks (five MODIFIED, one ADDED), eight decisions at promotion; six live rules after
  two walks (D-rc13c-2 revised, D-rc13c-4 amended, D-rc13c-8 superseded), and the task count is held under R-crc-1's bound of 20. Measured before generation.

## Touchpoints

- `src/core/templates/workflows/propose.ts` — Step 0 (concluded branch; inference exclusion), Step 0a (mirrored six-section list), Step 0b (entry format; the rule-answer note; the Mechanism read after the last file write), Step 0c (Mechanism row), NEW Step 0c.6 (the `Mechanism → artifacts` record; BOUNDED verbatim landing and the Risks pointer; the pre-move grep), Graceful degradation.
- `test/core/templates/orbit-content-fidelity.test.ts` — propose markers (refuse branch, mirror sentence, no-engine-record header, record heading); the section-list parity assertion via `ownerText`; the residue grep.
- `test/core/templates/skill-templates-parity.test.ts` — the `orbit-propose` pin, re-recorded once.
- `orbit/specs/orbit-propose-modifications/spec.md` — synced at archive (six blocks).
