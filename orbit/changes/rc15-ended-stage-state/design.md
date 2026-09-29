# Design: rc15-ended-stage-state

## Context

Stage state is a pure function in `src/core/architecture/state.ts` (D-arc Stage D2): `scanCitations`
reads `.openspec.yaml` under `orbit/changes/*`, `orbit/changes/archive/*` and `orbit/explore/*`,
`observe()` is a four-rung precedence (`in-change > exploring > quiescent > premised`), and
`compose()` honours a ratified `Complete:` mark on `quiescent` only, rendering INCONSISTENT with a
two-branch detail otherwise. The parser (`parser.ts`) holds the whole slot grammar in one regex,
`COMPLETE_REGEX`, with two productions; a non-matching `Complete:` line is a violation naming the line.
`buckets.ts` renders one stage line per rendered state and feeds both `orbit architecture status
--json` and orientation's PROGRAM band. Orientation's WAITING (a) keys on the exact string
`quiescent-awaiting-ratification`. The architect body's §5 is its ONE AskUserQuestion (ratify / not
yet), firing on awaiting; its emit payload carries `completions_ratified`. audit-drift's check (b) is
body prose consuming `orbit architecture status --json`. The explore grammar module
(`src/core/explore-grammar.ts`) exports `STATUS_HEADER`, the one regex for the status-header production
`orbit-conventions` owns; `parsers/explore-rules.ts` reads it through an unexported `readStatus`
(neither token = exploring, never MALFORMED).

Constraints: R-crc-1 (three capabilities, measured); R-crc-7 (decision tables — the composition is
one); R-crc-10 (the inputs are a slot token and a header token, both engine-observable; the mark is
never inferred); R-crc-14 (the header production is owned by `orbit-conventions` and imported, never
restated; the composition rule is owned by `orbit-architecture-engine` and audit-drift points at it);
the arc's rules of engagement (every mark is the user's word in an architect session). The mechanism
was settled in `explore.md` at promotion — D-rc15-1 … D-rc15-6 with five Mechanism entries and Case 1
— and is restated here as the live statement; `explore.md` is history by rule.

## Goals / Non-Goals

**Goals:**
- A stage the user has declared ended renders a state that is neither `complete` nor awaiting, is
  listed in no WAITING band, and is offered nothing by the architect session (exit 1).
- A stage cited only by a concluded exploration observes as ended-from-explore and never as
  `exploring`, with the two layers' parity stated in one requirement's table (exit 2).
- Every new production is executed by a test against a near-miss as well as the well-formed line,
  and `orbit-orientation` carries no delta (exit 3).

**Non-Goals:**
- Writing rc03a's mark here (the user's act; a handoff task).
- Inferring withdrawal from any trail, budget, or count.
- A body flow for clearing an ended mark (a hand edit; the engine renders the consequence).
- `Depends-on` semantics over ended stages; the `Architecture CLI surface` requirement's text.
- Retiring the two living sentences that describe the reader's known limit (at-archive note 5.4).
- The ARC-DONE predicate's treatment of an ended stage (`orbit-pr-lifecycle` owns it; a fourth
  capability, over R-crc-1) — an accepted residual, opened as a program question by at-archive note 5.5
  (fresh iter 2, W1, Sal: 1B).

## Decisions

- **D-rc15-1 — an ended mark asserts nothing about the work, so it is honoured wherever no live
  work contradicts it** (Sal, in chat; see `explore.md`). The `[~]` mark composes to `ended` on
  `quiescent`, `concluded` and `premised`, and to INCONSISTENT on `in-change` or live `exploring`.
  Completion needs evidence, so a ratified mark on `premised` stays inconsistent; ending needs none —
  a stage declared and withdrawn before any exploration is the doc-layer twin of Considered & out, and
  refusing the mark would push the user to delete the heading and lose the record. Alternative
  rejected: mirroring the ratified rule (honoured on `quiescent` only) — it reproduces Q-crc-11's
  defect one rung earlier. Consequence: audit-drift's (b) names the second mark and POINTS at the table for both marks —
  its two enumerations of observations dropped at the fresh iter-2 walk (W3), so the check consumes the
  rule and enumerates none of its observations.
- **D-rc15-2 — `concluded` is a FIFTH observed state, below `quiescent` and above `premised`, read
  from the header.** A citing staging directory observes `concluded` iff the first non-blank line of
  its `explore.md` matches the concluded token; a missing file, the `exploring` token, or neither
  token observe as live `exploring` (the convention's never-MALFORMED rule). Archived work outranks a
  conclusion: the archive is evidence to grade, the conclusion only a decision to build no more — so a
  stage with both renders awaiting. The reader: `explore-rules.ts`' `readStatus` is EXPORTED and
  called on the file's content from `state.ts` — ONE reader of the header in the engine, never a
  second regex (Q-crc-15's lesson; the alternative of importing `STATUS_HEADER` directly would be a
  second matching site with its own first-non-blank-line logic). Unreadable file → live `exploring`,
  lenient like `readCitation`.
- **D-rc15-3 — the mark reaches the doc on the user's word: a third answer on the existing offer, or
  unprompted** (Sal, in chat). The offer becomes ratify / not yet / ended and still fires on awaiting
  ONLY; its text states what ended means (the criteria will not be met; the stage renders `ended`; the
  mark is a slot edit, reversible). Unprompted, in an architect session, the user may declare any
  stage ended — the only route for a premised stage — with the same insert rule as ratification. AMENDED at the external iter-1 walk (W3, Sal: 3A): the unprompted route on a LIVE stage — `in-change` or
  live `exploring`, the two observations the composition table refuses — is DECLINED, the body naming the
  live citer and the act that would make the mark supportable (archive the change; conclude the
  exploration); `premised`, `quiescent` and `concluded` are written. The exploration's Mechanism table
  wrote "any stage" without running D-rc15-1's live rows against it — a COHERE failure between two rules
  written in one sitting; `explore.md` is history and keeps the wider row. The hand edit outside a session
  stays first-class, so a deliberately inconsistent state remains reachable and the engine renders it.
  AMENDED AGAIN at the fresh iter-2 walk (W2, Sal: 2A): the route is closed over the SLOT's content as
  well as the observation — the write lands only on an UNDATED slot (absent or `[ ]`); a present `[x]` or
  `[~]` is declined naming the existing mark and pointing at the hand edit, because this flow never
  authors a reversal of a recorded mark (an earlier emit recorded the ratified id). D-rc15-3's Mechanism
  domain enumerated WHERE a mark is written, not what the slot already held. The
  body's AskUserQuestion count stays one. Alternative rejected: a separate prompt or command — a
  second prompt where one already stands at the right moment, and a command the arc's rules would
  make user-invoked anyway.
- **D-rc15-4 — the third production is `Complete: [~] <YYYY-MM-DD> (<who>)`, exact-match, no
  suffix.** The ledger's `[~]` mark (Q-crc-11's standing recommendation, 2026-09-15) with its `— withdrawn` suffix
  DROPPED — the ledger spelled the suffix and this production rejects it (fresh iter 2, S4); nothing reads
  checkbox dialects. Exact-match
  keeps the parser strict; the reason lives in the status log. Alternative rejected: `[x] … — ended` —
  any reader matching `[x]` first reads it as complete, the exact wrong failure. Rendered: `ended
  (declared <date> by <who>)`; the header-only observation renders `ended-from-explore`; the observed
  token is `concluded`. `StageCompletion` becomes `{ratified, ended, date?, who?}` — the two booleans
  are exclusive by the duplicate-slot rule. DECLARED LIMIT (external iter 1, S2, Sal: 6A): the dated
  productions are lexical, not semantic — the date is shape-only (`\d{4}-\d{2}-\d{2}`; `2026-99-99` parses)
  and the attribution is opaque up to the final closing paren (`(Sal))` yields `Sal)`), exactly as the
  ratified production has behaved since D2; the limit is stated in the format requirement's near-miss
  scenario as SHARED and tested in 1.2. Hardening both was rejected: it would change how every existing
  ratified mark can read, for a defect no mark on record exhibits.
- **D-rc15-5 — the architect emit records ended ids in `stages_ended`, beside
  `completions_ratified`.** Optional like its sibling, so every archived architect emit stays valid.
  Its only spec home is `orbit-architect`'s emit requirement (measured by grep, 2026-09-28: the spec,
  the body, the code table), so no fourth capability.
- **D-rc15-6 — what stays untouched, by construction** (`Kind: fact`). WAITING (a) matches the exact
  awaiting string; `live-arc.test.ts` asserts no inconsistent stage; `status --json` carries the new
  fields for free (`show --json` returns an index or a section slice and computes no state — corrected at
  the external iter-1 walk); `validate` stays structure-only; the source lint's stage count is unaffected. Each
  is pinned by a test or a measurement in tasks, never asserted.

## Mechanism → artifacts

Source: the proposing AI's reading of the file; no engine record. Five Mechanism entries under five
live rules, every one conforming in full (heading ID owned; Domain table with member rows; a closed
token; no residual slots; nine move lines); one Case; one `Kind: fact` owner with no entry (permitted
history, row 2). No key defects. Five accounted, none open, no BOUNDED entry — so nothing lands
verbatim as a named limit and the pre-move grep has nothing to check.

| entry | token | owner | destination |
|---|---|---|---|
| D-rc15-1 | SOURCED | live rule | `Computed stage state with completion-as-ratification` (MODIFIED) — a normative TABLE (Case 1's five-by-three composition) plus a SCENARIO SET over the ended column; source sentence: the `ObservedState` union. Its consequence is the (b) clause of `Architecture staleness check` (MODIFIED), pointing at this table for both marks |
| D-rc15-2 | DERIVED | live rule | the same requirement — a SENTENCE naming the source (the header production's owner and its two tokens) with the five members in prose, the precedence, and scenarios for the concluded-only, concluded-beside-archive, neither-token and missing-file cases |
| D-rc15-3 | DERIVED | live rule | `Completion-ratification flow` (MODIFIED) — a SCENARIO SET, one per member (prompted at the offer; unprompted, split at the walk into the written and the declined observations; by hand outside a session) |
| D-rc15-4 | DERIVED | live rule | `Parseable architecture-doc format` (MODIFIED) — the three productions as a GRAMMAR (the slot's closed domain stated in the SHALL) plus a SCENARIO SET over the near-misses |
| D-rc15-5 | SOURCED | live rule | `Architect run-summary emit with handoff section` (MODIFIED) — a SENTENCE naming the field |
| D-rc15-6 | — | `Kind: fact` | not carried; its claims are exit (3)'s zero-delta measure and tests 2.5 and 5.1 |

## Risks / Trade-offs

- [Exit (1) cannot be graded at apply] → it is the user's act. Task 5.3 is the user-validation
  handoff: the next architect session on `clean-up-review-cycle` in which Sal declares rc03a ended;
  the tracked gate carries it as pending until observed. Q-crc-11 closes on the same observation.
- [Two surfaces read the concluded token from two sources] → `orbit architecture status` reads the
  FILE's header; `orbit status` reads the newest emit's `status.token` (D3, by design: no file reads).
  They can disagree between the conclude verb's header flip and its final emit — a window the verb
  closes in its next step. Stated, not mechanised; an ACCEPTED residual for the readiness record.
- [`ended-from-explore` reads as a state that wants a mark] → it is an observation, not a claim: the
  render carries the citing directory, and the requirement says a mark is optional there (the ended
  mark on a concluded observation renders `ended` — agreement, not contradiction).
- [A file read enters a scan that was metadata-only] → one read of the first non-blank line per
  citing staging directory (the corpus is small); unreadable → live `exploring`, the same leniency as
  `readCitation`. The reader is the explore parser's exported `readStatus`; a grep in task 2.1 proves
  `state.ts` carries no `Status` regex of its own.
- [The `[x]` column must not move] → its OUTCOMES do not: the table-driven test executes all fifteen cells,
  and the six existing tests under `computed stage state` keep their ASSERTIONS byte-unchanged (the first
  one's four-rung title is retitled to five rungs as a named second act — fresh iter 2, S2);
  `live-arc.test.ts` is the live pin. Its
  inconsistency DETAIL does move by one branch: `[x]` + `concluded` names the conclusion ("not evidence
  that the criteria were met") rather than the pre-existing "live citing work observed" string, which
  would have called the new observation live (external iter 1, W1).
- [Two hash pins move] → `orbit-architect` (§5, the emit step) and `orbit-audit-drift` (check (b)),
  each re-recorded ONCE in the task that edits the body, with a dated reason (rc04c's sizing lesson:
  the plan names the pins).
- [`StageState` JSON gains three fields] → additive; orientation's `program` array passes the payload
  through the shared builder; no consumer tests key-set equality (measured at 2.4).
- [Two living sentences say the reader keys on location] → `orbit/specs/orbit-conventions/spec.md`
  (the concluded-outcome KNOWN paragraph) and `src/core/templates/workflows/explore.ts` (the same
  paragraph in the body). Outside this change's three capabilities; at-archive note 5.4 hands them to
  the retirement-class sweep rc13a and rc13c already feed, and the stale sentence is an accepted
  residual until then.
- [Arc-done over an ended stage] → `orbit-pr-lifecycle`'s predicate counts archived stages; an ended stage with
  no archive holds a program open until that owner says otherwise. A fourth capability, over R-crc-1 —
  accepted as a residual for the readiness record, opened by at-archive note 5.5 as a program question, with
  the consequence bounded: arc-done is surfaced for a human act, and no live doc carries an ended stage
  without an archive (fresh iter 2, W1, Sal: 1B).
- [Size] → THREE capabilities, five MODIFIED blocks (27.1 KB after three walks), six decisions, five live rules;
  tasks held under 20. Measured before generation, re-measured at each walk.

## Touchpoints

- `src/core/architecture/parser.ts` — `COMPLETE_REGEX` third alternation; `StageCompletion.ended`; the violation message names three productions.
- `src/core/architecture/state.ts` — the header read; `ObservedState` + `concluded`; `RenderedState` + `ended` + `ended-from-explore`; `compose()` as the table; `StageState` ended fields; the inconsistency detail for the ended mark.
- `src/core/architecture/buckets.ts` — two render branches; the citing suffix renders a concluded explore citer as `explore:<name> (concluded)`.
- `src/core/parsers/explore-rules.ts` — `readStatus` exported.
- `src/core/emit-composition.ts` — `stages_ended` in the architect payload table.
- `src/core/templates/workflows/architect.ts` — §5 (third answer; unprompted route, declined on live; ended offered nothing); the §2 scaffold-format sentence (the body's second copy of the slot grammar gains the third production); the emit compose step.
- `src/core/templates/workflows/audit-drift.ts` — check (b).
- `test/core/architecture/engine.test.ts` — production tests; composition cells; the concluded fixture.
- `test/core/orientation.test.ts` — ended states never reach WAITING.
- `test/core/templates/orbit-content-fidelity.test.ts` + `test/core/templates/skill-templates-parity.test.ts` — markers; two pins.
- `test/core/emit-composition.test.ts` — the payload key.
- `orbit/specs/orbit-architecture-engine/spec.md` + `orbit/specs/orbit-architect/spec.md` + `orbit/specs/orbit-audit-drift/spec.md` — synced at archive.
