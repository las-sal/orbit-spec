# Proposal: rc15-ended-stage-state (stage rc15-ended-stage-state)

## Why

The stage grammar has two `Complete:` productions where the program has three states. `[ ]` and
`[x] <date> (<who>)` compose with the observed state into complete, awaiting ratification, and the
live observations — but a stage that ENDED WITHOUT MEETING ITS EXIT CRITERIA has no honest mark.
rc03a-blind-prompt is the live instance: withdrawn 2026-09-15 after three passes, its one archived
change cites it, so it observes `quiescent` and renders `quiescent — completion awaiting your
ratification` at every architect session, and the WAITING band lists it as yours. Four firings, four
declines, each re-derived from the charter — Q-crc-11's ledger, taken up as this stage on its second
reading (a third occurrence of the COST, not a third withdrawn stage).

D-bcs-6 named the same gap from the exploration layer: the state reader keys on LOCATION
(`orbit/explore/*/` plus a citing `.openspec.yaml`) and never reads the `> **Status**: concluded
<date>.` header rc13a shipped as the concluded record's pointer, so a stage cited only by a concluded
exploration renders `exploring` — live activity — when nothing is happening. WITHDRAWN (declared in the
doc) and CONCLUDED (declared in the exploration) are one missing state seen from two layers. Both
inputs are on-disk tokens the engine can read (R-crc-10); neither is inferred from a trail.

The mechanism was settled in the exploration at promotion (`explore.md`: six decisions, five live
rules, five Mechanism entries parsing clean under the engine — five rules, none open, no key defects —
every closure DERIVED or SOURCED). Sal ruled the two scope calls: an ended mark asserts nothing about
the work, so it is honoured on `premised` too (D-rc15-1); and the mark reaches the doc as a third
answer on the existing ratification offer, or unprompted on the user's word (D-rc15-3).

## What Changes

- **The `Complete:` slot gains a THIRD exact production, `Complete: [~] <YYYY-MM-DD> (<who>)`** — the
  user's declaration that the stage ended without meeting its criteria, dated and attributed like the
  ratified mark, with no free-text suffix (the reason lives in the status log). The near-miss rule is
  unchanged: a bare `[~]`, a bad date, or a trailing suffix is a validation error naming the line. The
  duplicate-slot rule keeps the three marks mutually exclusive. (D-rc15-4)
- **`concluded` is a FIFTH observed state, read from the header.** Precedence becomes `in-change >
  exploring > quiescent > concluded > premised`. A citing staging directory observes `concluded` iff
  the first non-blank line of its `explore.md` matches the concluded token of the status-header
  production `orbit-conventions` owns (the reader imports the grammar module's one regex); a missing
  file, the `exploring` token, or neither token observe as live `exploring`. Archived work outranks a
  conclusion. (D-rc15-2)
- **Completion composition becomes ONE table, both layers in one requirement** — five observed states
  × three marks. The `[x]` column is byte-unchanged. The `[~]` mark composes to `ended` on
  `quiescent`, `concluded` and `premised`, and to INCONSISTENT on live work (`in-change`, live
  `exploring`). A stage whose only citers are concluded explorations and whose slot is `[ ]` renders
  `ended-from-explore`, never `exploring`. Re-entry falls out: a new live change citing an ended stage
  renders INCONSISTENT, and clearing the slot by hand is the user's re-entry act. (D-rc15-1, D-rc15-2)
- **The rendered vocabulary gains `ended (declared <date> by <who>)` and `ended-from-explore`**, carried
  by the status render, the `--json` bucket (`ended`, `endedDate`, `endedWho` on the stage payload), and
  orientation's PROGRAM band through the shared builder. The WAITING band's closed set is UNCHANGED
  BY CONSTRUCTION — it keys on the exact awaiting string, so neither new state reaches it, and
  `orbit-orientation` carries no delta (exit 3's zero-delta measure). (D-rc15-6)
- **The architect's ratification offer gains a third answer — ratify / not yet / ended** — and still
  fires on awaiting ONLY, so an ended stage is offered nothing. The offer text states what ended means:
  the criteria will not be met, the stage renders `ended`, the mark is a slot edit and reversible.
  Unprompted, in an architect session, the user may declare any stage ended — the only route for a
  premised stage — written with the same slot-insert rule as ratification. The body's AskUserQuestion
  count stays one; it never nags; the engine never infers withdrawal from a trail. (D-rc15-3)
- **The architect emit records ended stage ids in `stages_ended`**, beside `completions_ratified` —
  one act, one record. (D-rc15-5)
- **audit-drift's check (b) gains ONE sentence naming the second mark with its own condition**: an
  ended mark on a stage with LIVE citing work → CRITICAL; `premised` and `concluded` are consistent
  with it. The check consumes the engine's composition rule by pointer and restates none of it.
  (D-rc15-1's consequence — the one sentence the charter permits there)

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-architecture-engine`: `Parseable architecture-doc format` (the third production; the slot's
  closed domain; near-miss scenarios that EXECUTE against each malformed shape); `Computed stage state
  with completion-as-ratification` (the fifth observed state and its header read; the composition
  table; the ended mark's inconsistency rule; the two rendered states and their JSON fields).
- `orbit-architect`: `Completion-ratification flow` (the third answer; the unprompted route; ended
  stages offered nothing); `Architect run-summary emit with handoff section` (`stages_ended`).
- `orbit-audit-drift`: `Architecture staleness check` (one sentence in (b) for the ended mark, by
  pointer; two scenarios).

THREE capabilities, five requirement blocks, all MODIFIED — inside R-crc-1's ceiling (at most 3
capabilities, ~12 requirements, under 20 tasks). The third capability is the one the charter allowed
"only if audit-drift's check text must name the mark, measured at exploration": it must, because the
ended mark's consistency condition differs from the ratified mark's (D-rc15-1).

## Impact

- **Engine**: `src/core/architecture/parser.ts` (the regex's third alternation; `StageCompletion`
  gains `ended`); `src/core/architecture/state.ts` (the header read through the grammar module's
  regex or the explore parser's exported reader — never a second regex; `ObservedState` gains
  `concluded`; `RenderedState` gains `ended` and `ended-from-explore`; `compose()` implements the
  table; `StageState` gains the three ended fields); `src/core/architecture/buckets.ts` (two render
  branches); `src/core/emit-composition.ts` (the `stages_ended` payload key). `src/core/orientation.ts`
  is NOT touched.
- **Templates**: `src/core/templates/workflows/architect.ts` (§5 and the emit compose step);
  `src/core/templates/workflows/audit-drift.ts` (check (b)). Two hash pins move, each once, named in
  tasks.
- **Tests**: `test/core/architecture/engine.test.ts` — every new production EXECUTED against the
  well-formed line AND each near-miss (exit 3); every cell of the composition table, with a
  concluded-exploration fixture for exit (2), a neither-token header, and a missing `explore.md`;
  `test/core/orientation.test.ts` — an ended or ended-from-explore stage contributes nothing to
  WAITING; fidelity markers for both bodies; the emit table accepts `stages_ended`.
  `test/core/architecture/live-arc.test.ts` is unchanged and passes through rc03a's mark once written
  (it asserts no inconsistent stage).
- **Specs**: five blocks across three capabilities; fingerprints stamped on all five.
- **Exit criteria, measured on this change**: (1) is a USER act after apply — rc03a's mark is written
  in an architect session on Sal's word; the tasks carry it as a user-validation handoff, and Q-crc-11
  closes on its observation; (2) the fixture test in `engine.test.ts`; (3) the near-miss tests, and
  `ls specs/` on this change showing no `orbit-orientation` directory (delta count zero).
- **Not in scope, declared**: writing rc03a's mark inside this change (the user's act, exit 1);
  `Depends-on` semantics over an ended stage (nothing reads dependencies for state; `validate` stays
  structure-only); a body flow for clearing an ended mark (a hand edit, first-class); the
  `Architecture CLI surface` requirement (its vocabulary is the state requirement's — no delta); the
  two living surfaces that describe the reader's known limit (`orbit-conventions`' concluded-outcome
  KNOWN paragraph and the explore body's) — handed to the retirement-class sweep by an at-archive note.
