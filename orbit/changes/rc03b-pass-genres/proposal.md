## Why

Two things the canonical cadence (R-crc-4) assumes are not written anywhere a body can read. First,
REVIEW and VERIFICATION are different tasks — an independent reviewer reads the whole artifact; the
in-context pass that follows a walk checks what the walk claimed — and nothing names which one a pass
is: nine rc-stage in-context confirms have run as unnamed verifications, and `orbit-conventions`'
`Review mode decision framework` still says in-context is the right first pass for a small change.
Second, the brief a REVIEW-genre reviewer receives is built to anchor it: the external prompt's Cycle
context lists prior open and resolved findings, points the reviewer at `.orbit-runs/`, and at
iteration 3 recommends continuing a same-AI session so it can "verify its earlier findings" — while
the engine's blindness predicate reads only walk records and so certifies an anchored pair as blind.
rc03a tried three times to close that by deny-listing eleven channels and was withdrawn. Stage
`rc03b-pass-genres` of `clean-up-review-cycle` (Goal G1; the first child of the split parent
`rc03-review-genres`) states the genre ONCE as a table the trail decides, and makes the review brief
carry nothing — which dissolves the channel problem on every launch order instead of solving it.

## What Changes

- **A genre table, stated once.** A pass's genre — REVIEW or VERIFICATION — is COMPUTED from three
  trail facts (reviewer class, mode, whether a readable walk record of its mode precedes it), never
  declared: `fresh`/`external` are REVIEW; an `in-context` pass after a readable walk of its mode is
  VERIFICATION — a qualifying walk being one with a token after the latest independent pass of the
  mode and before the pass; every other `in-context` pass (none before it, only mode-less walks,
  architecture mode) is REVIEW. "Pass genre" is qualified throughout: "genre" already means
  internal-versus-external in the renderer and two baseline requirements, and the owner says so by
  pointer rather than renaming a ruling's word. The table lives in `orbit-conventions`' `Review mode decision framework`, whose
  class descriptions are repaired (`fresh` = same model, clean context; `external` = a different AI in
  a separate session) and whose per-change "which class should I run" scenarios are replaced — the
  schema's cadence says which class runs next (explore D-rc03-2). The pass genre is a record and a header
  word; the gate reads nothing of it (R-crc-13). The in-context body learns it from one directory
  fact — the token-ordered walk listing and each record's `source_path`, never findings. No record FIELD is defined by this change; the
  engine function that computes the genre and the verification record are the second child's.
- **A REVIEW-genre brief carries no findings and no pointer at the trail.** Owned by the same
  conventions requirement, with its BOUNDED residual stated there once. The external prompt's Cycle
  context keeps the iteration number ONLY; the `.orbit-runs/` "iteration history" bullet leaves the
  project-context list; the recommended-session note's iteration-3+ option (a) — continue a same-AI
  session — and its trade-off sentence are deleted; both halves' system-mode `git diff` excludes the
  trail by pathspec; the body's prior-run inspection step is not run for review-genre passes and its pushback epitome
  names no prior-run comparison; a new "Dispatching a fresh pass" step hands the subagent what the
  owner's list names and nothing from the trail (explore D-rc03-3, D-rc03-10). One exemption, stated in
  the owner: the architecture body's hand-computed per-doc iteration note — no pair and no gate exist
  in that mode.
  Pushback is unchanged: it verifies against current state, not a prior list.
- **Two repairs.** `orbit-review`'s `--fresh` requirement described `--reviewer external` with
  `fresh`'s own definition ("same model, fresh context, no cross-AI handoff"); the parenthetical moves
  to the right noun. The conventions framework rewrite above is the second.
- **Nothing launches, nothing orders.** No `--pair` invocation (the engine already outranks the walk
  while a pair is open — `gates.ts:798-805`), no body sentence spawning the fresh half (it would breach
  the no-chaining contract, and the eligibility line at the end of the packaging turn already renders
  `--fresh` for an empty pair), no external-first ordering (its blindness value is gone once the brief
  carries nothing; a rider for rc10). No engine code.

**Size, measured at exploration (D-rc03-8).** THREE capabilities — at R-crc-1's ceiling, not over it:
`orbit-conventions` (1 MODIFIED), `orbit-review` (1 ADDED, 1 MODIFIED), `orbit-review-external`
(3 MODIFIED — one of them the 186-line prompt requirement, edited in six lines, carried whole because a
MODIFIED block is the entire requirement). Six requirements, no engine code, one new generated-surface
test. The parent stage was split preventively under R-crc-9 because its live work touched five
capabilities; the verification record (`orbit-emit-composition`, `orbit-report-rendering`,
`orbit-review`) is `rc03c-verification-record`, which depends on this change for the table.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Review mode decision framework` — the two genres and the genre table (six
  rows, one scenario each), the repaired class descriptions, the review-genre brief rule with its
  BOUNDED residual stated once, the per-change class-choice scenarios replaced; the two gate-surfaced
  scenarios kept.
- `orbit-review`: ADDED `Review-genre passes read the artifacts and the code, never the trail's
  findings` (the fresh brief's contents, the skipped prior-run step, the trail-excluding diff pathspec,
  the generated-surface grep test); MODIFIED `` `--fresh` runs pass work in a clean execution context ``
  (the parenthetical on the right noun; a fresh pass is REVIEW genre by pointer).
- `orbit-review-external`: `Cycle context populated from prior runs` (iteration number only; no finding
  list; no trail pointer — by pointer to the owner); `Prompt written to versioned file with chat
  invocation snippet` (the `Prompt file contents` scenario and the template fence lose the trail
  pointer and the three cycle-context bullets); `Recommended-session note in chat output` (iteration 3+
  is a fresh session in a previously-unused AI; option (a) and the trade-off sentence deleted).

## Impact

- `src/core/templates/workflows/review.ts` — the external-handoff reference's Step 5 (cycle context
  gathering → iteration only), Step 6 (iteration-3+ phrasing with its ordering input; trade-off
  sentence deleted) and its worked example; the body's pushback epitome bullet; a NEW "Dispatching a
  fresh pass" step; the prompt template (`.orbit-runs/` bullet removed; `## Cycle context` reduced to `- Iteration: <N>`);
  the system-mode "what to read" diff line and the body's own Step 4 read list gain the trail-excluding
  pathspec; Step 5 "Inspect prior runs" is scoped to VERIFICATION-genre passes; the body gains a "Pass
  genre" heading carrying the owner's FENCED table verbatim as a CHECKED MIRROR (an adopter's skill has
  no specs; the owner's sentence permits this one mirror);
  the `--reviewer`/`--fresh` prose carries the repaired class words.
- `test/core/templates/` — a new generated-surface test under the ADDED requirement's PHRASE and REGION
  rules (the red count is computed from the rules at apply); a fence parity pin holding the body's
  pass-genre table byte-equal to the owner's fence; an untouched-modules hash pin; the fidelity test's
  Step 5/6 and template expectations move.
- `orbit/specs/*` — three capabilities, synced at archive. `CLAUDE.md` — the ACTIVE program section's
  rc03b paragraph. `orbit/architecture/clean-up-review-cycle.md` — the rc03b charter paragraph, amended
  at walk 1 of the proposal cadence (slot arithmetic; the phrase list).
- No change to `src/core/artifact-graph/`, `src/core/emit-composition.ts`, `src/core/report-render.ts`
  or the schema: a test may pin that the stage's diff touches none of them.
