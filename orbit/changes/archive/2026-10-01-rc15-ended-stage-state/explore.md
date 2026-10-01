> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc15-ended-stage-state

## Premise

A stage that ended without meeting its exit criteria has no honest mark, so the engine asks for one forever. The stage grammar has two `Complete:` productions (`[ ]` and `[x] <date> (<who>)`) where the program has three states — complete, awaiting ratification, and ENDED-WITHOUT-MEETING-ITS-CRITERIA. rc03a-blind-prompt is the live instance: withdrawn 2026-09-15 after three passes, its one archived change cites it, so it observes `quiescent` and renders `quiescent — completion awaiting your ratification` at every architect session. Four firings, four declines, each re-derived from the charter (Q-crc-11's ledger). rc13a's first attempt was the second instance until its second attempt shipped and was ratified; today rc03a is the only one on disk.

D-bcs-6 named the same gap from the exploration layer: `state.ts` keys on LOCATION (`orbit/explore/*/` with a citing `.openspec.yaml`) and never reads the `> **Status**: concluded <date>.` header rc13a shipped, so a stage cited only by a concluded exploration renders `exploring` — live activity — when nothing is happening. WITHDRAWN (declared by the user in the doc) and CONCLUDED (declared by the user in the exploration) are one missing state seen from two layers. No concluded exploration exists on disk today; exit (2) is graded on a fixture.

The charter (clean-up-review-cycle, Stage rc15): the engine learns the third state as a PURE FUNCTION of on-disk artifacts, like the other four. (1) A third `Complete:` production for a user-declared ENDED stage, dated and attributed, the near-miss rule unchanged. (2) The state reader reads the status-header production (owned by `orbit-conventions`; the reader points) on the `explore.md` of a citing staging directory; a stage whose only live citer is a concluded exploration observes as ended-from-explore. (3) The rendered vocabulary, the STATUS render and the `--json` bucket carry it; the WAITING band's closed set does NOT list it; the architect ratification offer fires on awaiting ONLY. (4) An ended mark on a stage with LIVE citing work is INCONSISTENT, raised by audit-drift's check (b) — one sentence there at most, by pointer. The mark is the USER's, written in an architect session on their word; the engine never infers withdrawal from a trail.

What the engine looks like today, read 2026-09-28:

- `src/core/architecture/parser.ts` — `COMPLETE_REGEX` is the whole slot grammar; a non-matching `Complete:` line is a violation naming the line; a duplicate slot is a second violation. `StageCompletion = {ratified, date?, who?}`.
- `src/core/architecture/state.ts` — `scanCitations` reads only `.openspec.yaml` in `orbit/changes/*`, `archive/*`, `orbit/explore/*`; `observe()` is a four-rung precedence (`in-change > exploring > quiescent > premised`); `compose()` honours a ratified mark on `quiescent` only, everything else INCONSISTENT with a two-branch detail. `RenderedState` is a six-value union.
- `src/core/architecture/buckets.ts` — `renderStageLine` has explicit branches for complete / inconsistent / awaiting and falls through to the raw token otherwise; `buildArchitectureBuckets` feeds both `orbit architecture status --json` and orientation's PROGRAM band.
- `src/core/orientation.ts` — WAITING (a) keys on the exact string `quiescent-awaiting-ratification`; a new rendered value is excluded by construction.
- `src/core/explore-grammar.ts` — `STATUS_HEADER` is the one regex for the header production; `parsers/explore-rules.ts` reads it (`readStatus`, not exported: neither token = exploring, never MALFORMED).
- `src/core/templates/workflows/architect.ts` §5 — the body's ONE AskUserQuestion, ratify / not yet, fires on awaiting.
- `src/core/templates/workflows/audit-drift.ts` check (b) — body prose consuming `orbit architecture status --json`; no engine code behind it.
- Tests: `test/core/architecture/engine.test.ts` (near-miss `Complete: [x] soon (someone)` is already a fixture), `live-arc.test.ts` (asserts no stage on the live arc is inconsistent).

Exit criteria, from the charter: (1) rc03a carries the mark, renders neither `complete` nor awaiting, and the next architect session fires no offer for it; (2) a fixture stage cited only by a concluded exploration observes as ended-from-explore, never `exploring`, the two-layer parity stated in one requirement; (3) every new production is exercised by a test that EXECUTES it against a near-miss as well as the well-formed line, and `orbit-orientation`'s WAITING requirement has a delta count of zero.

## Mechanism

### D-rc15-1 — the ended mark is honoured wherever no live work contradicts it
Domain: the observed states an ended mark can meet
| member | covered by |
|---|---|
| in-change | INCONSISTENT — live citing work (the detail names the change) |
| exploring (live) | INCONSISTENT — live citing work (the detail names the staging directory) |
| quiescent | `ended` — rc03a's cell |
| concluded | `ended` — the mark and the header agree |
| premised | `ended` — declared and withdrawn before any work; the doc-layer Considered & out |
Closure: SOURCED — the `ObservedState` union in `state.ts` once D-rc15-2 adds `concluded`; five members, one row each
Moves:
- READ: applied — `compose()` today honours `[x]` on `quiescent` only, with a two-branch detail (premised vs live); the ended column reuses the live branch and drops the premised one
- ENUMERATE: applied — this table; every member of the union has a row; Case 1 holds the other two columns
- COHERE: applied — the `[x]` column is byte-unchanged, so the two marks differ in exactly one cell (premised), and the audit-drift sentence names only that difference
- EXECUTE: not applied — no engine code yet; the five cells are the test set the stage writes
- FALSIFY: applied — refusing ended-on-premised would leave a withdrawn-before-work stage with no honest mark and a heading to delete: Q-crc-11's defect reproduced one rung earlier
- CONFORM: applied — the mark is the USER's (the arc's rules of engagement); R-crc-10 (the inputs are a slot token and a citation scan, both engine-observable); R-crc-14 (the rule is stated in the composition requirement; audit-drift POINTS)
- FEASIBILITY: not applied — one column in a lookup
- CONSUME: applied — `renderStageLine` gains an `ended` branch; orientation's WAITING (a) never sees it (D-rc15-6); audit-drift (b) consumes the INCONSISTENT rows by pointer
- INVOKE: applied — fires on every `computeStageStates` call, i.e. every status, orientation and audit read

### D-rc15-2 — `concluded` is a fifth observed state, read from the header
Domain: what a citing staging directory can present to the reader
| member | covered by |
|---|---|
| no `explore.md` | live `exploring` (the convention adds a stub on next touch; never MALFORMED) |
| first non-blank line matches `exploring.` | live `exploring` |
| first non-blank line matches `concluded <date>.` | `concluded` |
| first non-blank line matches neither token | live `exploring` (not-concluded; the header is added on next touch) |
| no `.openspec.yaml` citation | not a citer at all — `scanCitations` unchanged |
Closure: DERIVED — (file present × header token ∈ {exploring, concluded, neither}) plus the absent-file and absent-citation cases; the header production has exactly two tokens (`orbit-conventions` owns it; `explore-grammar.ts` mirrors it)
Moves:
- READ: applied — `STATUS_HEADER` in `explore-grammar.ts` (group 3 is the concluded date); `readStatus` in `explore-rules.ts` is not exported and returns exploring for neither token — the reader imports the grammar regex or an exported helper, never a second regex (Q-crc-15's lesson)
- ENUMERATE: applied — this table; Case 1 enumerates the precedence over citer kinds
- COHERE: applied — `concluded` sits below `quiescent` (a stage with an archived change AND a concluded exploration renders awaiting: the archive is evidence to grade) and above `premised` (a conclusion is a record, not nothing)
- EXECUTE: not applied — no concluded exploration exists on disk; exit (2) is graded on a fixture the stage writes
- FALSIFY: applied — D-bcs-6's known limit is exactly the `concluded → exploring` cell; a reader keyed on `.openspec.yaml` alone can never see it, so the fix must read the file
- CONFORM: applied — R-crc-14 (the production is owned elsewhere; the reader points and imports); D-bcs-6 (the citation is KEPT, unannotated — it is what locates the directory); R-crc-10 (a header token is engine-observable)
- FEASIBILITY: not applied — one file read per citing staging directory; the corpus is small
- CONSUME: applied — `observe()` gains one rung; `compose()` gains one row (Case 1); orientation's PROGRAM band and `architecture status --json` carry it through `buildArchitectureBuckets` unchanged
- INVOKE: applied — same trigger as D-rc15-1; the `explore` citer kind already reaches `observe()`

### Case 1 — the composition table, both layers in one requirement
Precedence over citer kinds: `in-change > exploring > quiescent > concluded > premised`, where `exploring` is any citing staging directory NOT observed `concluded`, and `concluded` is a stage whose citers are ALL concluded staging directories (one archived change beside them lifts it to `quiescent`).

| observed \ mark | `[ ]` | `[x]` ratified | `[~]` ended |
|---|---|---|---|
| in-change | in-change | INCONSISTENT | INCONSISTENT |
| exploring (live) | exploring | INCONSISTENT | INCONSISTENT |
| quiescent | quiescent-awaiting-ratification | complete | ended |
| concluded | ended-from-explore | INCONSISTENT | ended |
| premised | premised | INCONSISTENT | ended |

The `[x]` column is today's rule unchanged. Re-entry falls out: a new live change citing an ended stage renders INCONSISTENT, and clearing the slot by hand is the user's re-entry act (the charter's (4)).

### D-rc15-3 — the mark reaches the doc on the user's word
Domain: the ways the ended mark can be written
| member | covered by |
|---|---|
| in an architect session, at the ratification offer (stage awaiting) | the third answer `ended`; the offer text states that the criteria will not be met, that the stage renders `ended`, and that the mark is a slot edit, reversible |
| in an architect session, unprompted (any stage, including premised) | the body writes the mark on the user's declared word, with the same insert rule as ratification; the only route for a premised stage |
| outside any session, by hand | first-class (the flow-entry ruling); the engine reads the token the same; an inconsistent one is audit-drift's (b) |
Closure: DERIVED — (inside an architect session × {prompted, unprompted}) + outside one; there is no fourth place a doc edit originates
Moves:
- READ: applied — the body's §5 is the ONE AskUserQuestion (ratify / not yet), fired on `quiescent-awaiting-ratification` read from status; the insert rule is stated there and in `orbit-architect`'s "Completion-ratification flow"
- ENUMERATE: applied — this table
- COHERE: applied — the offer still fires on awaiting ONLY, so an ended stage is offered nothing (exit 1) and a premised stage is reached only unprompted; the AskUserQuestion count stays one
- EXECUTE: not applied — the next architect session on the arc doc is the execution (rc03a, exit 1)
- FALSIFY: applied — an offer with only ratify / not yet is what fired four times; the third answer is the missing honest one, and it cannot fire a fifth time once the mark is written
- CONFORM: applied — the arc's rules of engagement (user-declared, never inferred from a trail); "never nags"; R-crc-13 (the emit records the act — D-rc15-5)
- FEASIBILITY: not applied — one option, one paragraph
- CONSUME: applied — the ended answer writes the D-rc15-4 production; the emit (D-rc15-5) records the id
- INVOKE: applied — the prompted route fires when the user opens the doc's architect session; the unprompted route on the user's word inside one

### D-rc15-4 — the third production, exact-match
Domain: the `Complete:`-prefixed lines the parser can meet outside a fence
| member | covered by |
|---|---|
| `Complete: [ ]` | unratified (unchanged) |
| `Complete: [x] <date> (<who>)` | ratified (unchanged) |
| `Complete: [~] <date> (<who>)` | ended — the NEW production |
| `Complete: [~]` bare | MALFORMED naming the line (the mark is dated and attributed like the ratified one) |
| `Complete: [~] soon (someone)` | MALFORMED naming the line (bad date; the existing `[x]` fixture's twin) |
| `Complete: [~] <date> (<who>) — withdrawn` | MALFORMED naming the line (no suffix; the reason lives in the status log) |
| a second `Complete:` line in one stage | MALFORMED — duplicate slot (unchanged) |
| absent | unratified (omission semantics, unchanged) |
Closure: DERIVED — three exact productions, absence, duplication, and the near-miss rule covering every other `Complete:`-prefixed line
Moves:
- READ: applied — `COMPLETE_REGEX` and its violation message in `parser.ts`; `engine.test.ts` already carries `[x] soon (someone)` as the near-miss fixture
- ENUMERATE: applied — this table
- COHERE: applied — `[ ]`, `[x]`, `[~]` are mutually exclusive by the duplicate-slot rule, so a stage is never both ratified and ended
- EXECUTE: not applied — the stage's tests execute each row (exit 3: the near-miss AND the well-formed line)
- FALSIFY: applied — a suffix production (`[x] … — ended`) would read as complete to any reader matching `[x]` first, the exact wrong failure; exact-match forecloses it
- CONFORM: applied — the near-miss rule (unchanged); Q-crc-11's ledger spelling; R-crc-7 (this table)
- FEASIBILITY: not applied — one alternation in one regex, two fields on `StageCompletion`
- CONSUME: applied — `state.ts` reads `{ended, date, who}`; `renderStageLine` renders `ended (declared <date> by <who>)` and `ended-from-explore`; `validate` stays structure-only
- INVOKE: applied — every parse

### D-rc15-5 — the emit records ended ids
Domain: the surfaces that state the architect emit's payload fields
| member | covered by |
|---|---|
| `orbit-architect`'s "Architect run-summary emit with handoff section" | gains `stages_ended` (stage ids, possibly empty) beside `completions_ratified` |
| `COMMANDS.architect.payloadFields` in `emit-composition.ts` | gains the key (the table refuses unknowns) |
| the architect body's compose step | names the field |
Closure: SOURCED — grep `completions_ratified` over `orbit/specs/` and `src/` (2026-09-28): the code table plus these two; no schema-reference file carries it
Moves:
- READ: applied — the grep above; the emit shape is `orbit-architect`'s, not `orbit-emit-composition`'s, so no fourth capability
- ENUMERATE: applied — this table, sourced
- COHERE: applied — one act, one record: the mark in the doc and the id in the emit, in the same session
- EXECUTE: not applied — the next architect session's emit
- FALSIFY: applied — without the field the trail would show a session that wrote a mark and recorded nothing; the narrative would be the only record
- CONFORM: applied — R-crc-13 (an emit RECORDS); R-crc-1 measured: engine + architect + one audit-drift sentence = three capabilities
- FEASIBILITY: not applied — one key
- CONSUME: applied — orientation's LAST line reads `final_assessment`, not this field; nothing else consumes it today
- INVOKE: applied — every architect emit

## Decisions

- **2026-09-28 — D-rc15-1: an ended mark asserts nothing about the work, so it is honoured wherever no live work contradicts it** The `[~]` mark composes to `ended` on `quiescent`, `concluded` and `premised`, and to INCONSISTENT on `in-change` or live `exploring`. Completion needs evidence, so a ratified mark on `premised` stays inconsistent; ending needs none — a stage declared and withdrawn before any exploration is the doc-layer twin of Considered & out, and refusing the mark would push the user to delete the heading and lose the record. Consequence: audit-drift's check (b) gains one sentence naming the second mark with its own condition (live citing work only) — the one sentence the charter permits there. Ratified by Sal.
  Kind: rule
- **2026-09-28 — D-rc15-2: `concluded` is a FIFTH observed state, below `quiescent` and above `premised`, read from the header** Precedence becomes `in-change > exploring > quiescent > concluded > premised`. A citing staging directory observes `concluded` iff the first non-blank line of its `explore.md` matches the concluded production (`orbit-conventions` owns it; the reader imports the grammar module's regex, one source); a missing file, the `exploring` token, or neither token observe as live `exploring`. Archived work outranks a conclusion: the archive is evidence to grade, the conclusion only a decision to build no more. The full composition is Case 1 — the one requirement that states both layers' parity (exit 2).
  Kind: rule
- **2026-09-28 — D-rc15-3: the mark reaches the doc on the user's word — a third answer on the existing offer, or unprompted** The ratification offer becomes ratify / not yet / ended and still fires on awaiting ONLY; its text states what ended means (the criteria will not be met; the stage renders `ended`; the mark is a slot edit, reversible). Unprompted, in an architect session, the user may declare any stage ended — the only route for a premised stage — written with the same insert rule as ratification. The body's AskUserQuestion count stays one; it never nags; the engine never infers withdrawal from a trail. Ratified by Sal.
  Kind: rule
- **2026-09-28 — D-rc15-4: the third production is `Complete: [~] <YYYY-MM-DD> (<who>)`, exact-match, no suffix** Q-crc-11's ledger spelling since 2026-09-15; nothing reads checkbox dialects. Exact-match keeps the parser strict — the reason lives in the status log, where rc03a's already is. Near-misses MALFORMED naming the line: a bare `[~]`, `[~] soon (someone)`, a trailing suffix. Rendered: `ended (declared <date> by <who>)` for the mark; `ended-from-explore [explore:<name>]` for the header-only observation; the observed token is `concluded`.
  Kind: rule
- **2026-09-28 — D-rc15-5: the architect emit records ended stage ids in `stages_ended`, beside `completions_ratified`** Same act, same record shape. The field is stated in `orbit-architect`'s emit requirement (its only spec home — measured by grep, so no fourth capability), the code payload table, and the body's compose step. Size measured against R-crc-1: THREE capabilities — `orbit-architecture-engine` (format + state requirements), `orbit-architect` (ratification flow + emit), `orbit-audit-drift` (one sentence by pointer).
  Kind: rule
- **2026-09-28 — D-rc15-6: what stays untouched, by construction** Orientation's WAITING (a) keys on the exact string `quiescent-awaiting-ratification`, so the new states are excluded without an edit and exit (3)'s zero-delta measure holds. `live-arc.test.ts` asserts no inconsistent stage and passes through rc03a's mark. `orbit architecture show --json` carries the new fields for free; `validate` stays structure-only; the source lint's `architecture.stage-count` is unaffected.
  Kind: fact

## Open questions

## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc15 charter; Q-crc-11 (its four-firing ledger and the 2026-09-25 assignment); rc03a's stage section (`Complete: [ ]`, `Depends-on: rc02-gate-semantics`).
- `orbit/changes/archive/2026-09-25-bounded-closure-semantics/explore.md` — D-bcs-6 (the stage-state scan as a KNOWN LIMIT, SOURCED over the readers of a staging directory); D-bcs-7 (re-entry table).
- `orbit/specs/orbit-architecture-engine/spec.md` — "Parseable architecture-doc format" (slot grammar, near-miss rule, the closed passthrough-reader table), "Computed stage state with completion-as-ratification".
- `orbit/specs/orbit-architect/spec.md` — "Completion-ratification flow".
- `orbit/specs/orbit-orientation/spec.md` — "Waiting-on-you derivation is a closed set" (must not move).
- `orbit/specs/orbit-audit-drift/spec.md` — "Architecture staleness check", (b).
- `orbit/specs/orbit-conventions/spec.md` — the status-header production's owner.
- `src/core/architecture/{parser,state,buckets,validate}.ts`, `src/core/explore-grammar.ts`, `src/core/orientation.ts`.
