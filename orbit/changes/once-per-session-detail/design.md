## Context

The second stage of `reduce-orbit-phase1` (`once-per-session-detail`; the brief's section 4.2). After
`conditional-steps` the generated bodies total 389,374 characters (apply 27,124), and two kinds of block in them are
acted on once per session or less, yet carried on every turn:

| block | bodies | size today | acted on |
|---|---|---|---|
| the account step (`ACCOUNT_STEP`, `ACCOUNT_WALK_STEP` in `src/core/disciplines.ts`) | apply, address-reviews | 4,036 + 4,656 | at most once per change, when apply completes, or by a walk that changes the account's facts |
| the run-summary emit step | apply 5,703 · archive 3,775 · address-reviews 2,380 · review 2,278 · architect 1,725 · propose 1,398 · ff 1,193 · verify 1,044 · audit-drift 923 · continue 838 · new 592 | 21,849 | at the session's emit |

Two findings frame the move (see `explore.md`): the emit write gate checks a field's shape and never whether a field a
session event owes is present (D-opsd-1: `validateJudgements` returns at once on an absent key), so the triggers of those
fields live only in body text; and the apply gate is checkbox arithmetic that never reads the account folder (D-opsd-2).
The rules this stage follows are the program's: R-rop-3 (basic content and reference), R-rop-4 (the body directs the
read), R-rop-5 (one body under every configuration), R-rop-8 (the budget test), RG0 (nothing is lost), and the brief's
section 3.

## Goals / Non-Goals

**Goals:**

- The account step keeps its basic content in apply and address-reviews and moves its full text, byte-equal, to a
  reference file each (D-opsd-8).
- Every emit step in scope (eleven bodies) keeps when the emit fires, the command and the chat behaviour beside them, and
  reads the moved detail before the session's first emit: one shape, so a payload field added later has one place to go
  and one test holding it there (D-opsd-4, D-opsd-9).
- The budget test's ceilings go down to the new sizes plus 5%, set in a fresh apply session on the regenerated bodies,
  which also writes this change's account under the new body (D-opsd-6).

**Non-Goals:**

- No engine change: no gate reports a missing account (D-opsd-8; the evaluation's list), no command names a reference.
- Explore's and bulk-archive's emit steps, and onboard, are not touched (the Premise; R-rop-2; D-opsd-9).
- No rewording of moved text (the brief's rule 4), and the existing schema references are not edited.
- RG2's table-of-contents and one-level fixes for files this stage does not create belong to `tighten-bodies`.

## Decisions

### 1. The account step: basic content at the step's moment, full step in a reference (D-opsd-8)

`ACCOUNT_STEP` and `ACCOUNT_WALK_STEP` stay exported as they are and become the reference files' contents:
`references/account-step.md` (apply) and `references/account-walk-step.md` (address-reviews), each a one-line title
followed by the constant (the convention's shape). Two new constants hold the basic content, interpolated where the
full steps sit today, keeping each step's heading so citations of it stay true. Verbatim, after the heading:

- `ACCOUNT_STEP_BASIC` (apply): "At the session's end, BEFORE the run-summary emit (or, when the session writes no run
  summary, before the completion readout), read `references/account-step.md` and follow it: it says whether this
  session writes the account, a replacement of it, or none, and how."
- `ACCOUNT_WALK_STEP_BASIC` (address-reviews step 7): "After the logs are written, read `references/account-walk-step.md`
  and follow it: it says whether this walk writes a replacement of the change's account, or none, and how."

No condition sits in either body: every branch, today's completion rule included ("APPLY IS COMPLETE when the change's
apply gate passes … named in this session's `user_validation_tasks`"), is decided by the reference, which carries the
step whole. The exploration's first form (D-opsd-3) keyed apply's cue on the gate reading `passed`, but the gate counts a
user-validation handoff only after an apply emit has declared it, and the account step precedes this session's emit, so
a session completing apply on its first declared handoff would have written none (the proposal walk's finding 1). An
unconditional read costs the reference's size in a session's last few turns; a condition that could see that case would
cost about 240 characters on every turn of every apply session, which runs 57 to 203 model calls. No command runs in the
cue, so there is no result to hand off and no exit to handle. Apply's `all_done` branch, which runs the Account step
whether or not an account exists, stays in the body as it is.

### 2. Each emit step's detail goes to a new `references/run-summary-emit.md`, not to the schema references

The exploration recorded that review's, address-reviews' and archive's moved text would join their existing schema
references (D-opsd-5's last sentence), and the charter speaks of "each skill's run-summary schema reference". Measured
at propose, those files are 20,107 (review), 30,760 (address-reviews) and 14,812 (archive) characters, and under
D-opsd-4 every session reads its reference whole before its first emit: joining them would make each such session read
15,000 to 31,000 characters where it carried 2,000 to 4,000, the opposite of the stage's purpose. So each of the eleven
skills gains one small `references/run-summary-emit.md`, the same name in all eleven, and the schema references are left
as they are. The bodies of address-reviews and archive name their schema reference only in the moving section today,
so each keeps a sentence naming it beside the cue (one level deep; `moved-blocks.test.ts` checks every body names every
reference it ships). This is a deviation from D-opsd-5's last sentence and from the charter's wording, for the account to
record.

### 3. What each body keeps, and what the reference holds

The reference holds the WHOLE emit section as today, heading included, byte-equal (as `chain-end-step.md` holds the
whole chain end step while the tag meaning also stays in the bodies): a reader of the reference meets the step complete,
and one hash per body holds it. The body keeps the section's heading, the paragraphs that stay, the shared cue, and the
command block. The paragraphs that stay are composed once in code and interpolated into both the body and the
section constant, so each text has one home in the source.

The shared cue, one constant (`RUN_SUMMARY_READ_CUE` in `src/core/disciplines.ts`), byte-equal in all eleven bodies:

> Before the session's first emit, read `references/run-summary-emit.md` and follow it to compose the payload: it holds
> this step whole, with where its fields are documented. Write the payload to a temp file and invoke:

The cue is two sentences; the spec calls it the READ CUE. Each body's emit section after the move, verbatim (heading,
then these paragraphs in order, then the command block, then any paragraph listed after it; `<CUE>` is the cue above):

- apply: "`/orbit:apply` is a chunked multi-turn command. Fire the emit at every chunk boundary, at a mid-chunk session
  pause (chain: not a prompt), or once at session end for a no-chunking change — the conversation-boundary judgment is
  yours; everything else is engine-computed. <CUE>"; after the command block, the **Completion-prompt override (chat)**
  paragraph as today.
- archive: "After upstream Step 5 (move-to-archive) completes, write the archive run summary. Its extension fields are
  documented in `references/archive-summary-schema.md`; read it when composing them. <CUE>"
- architect: the opening parenthetical and the **No emit without sweep** paragraph as today, then "<CUE>".
- review (Step 9): "<CUE>"; the command block keeps both forms.
- verify: "At command completion, write the verify run summary. <CUE>"
- propose and ff: "At command completion, write the <propose|ff> run summary. <CUE>"; after the command block, the
  second-segment paragraph and the **Completion-prompt override (chat)** paragraph as today.
- continue: "At command completion, write the continue run summary. <CUE>"; after the command block, the
  **Completion-prompt override (chat)** paragraph as today.
- new: "At command completion, write the new run summary. <CUE>"
- audit-drift (step 10): the paragraph's first sentence as today ("**Standalone invocations only** — library /
  pre-archive contexts write no separate JSON (…)."), then "<CUE>"; the command block keeps both forms. Its body names
  `references/run-summary-schema.md` again at its disjunctive-recommendations section, so it needs no naming sentence.
- address-reviews (step 6): the **ONE resolution log PER SOURCE** paragraph as today, then "Each payload's fields are
  listed in `references/run-summary-schema.md`. <CUE>"; after the command block, the scope-forms paragraph as today.

Archive's sentence keeps the instruction to READ `archive-summary-schema.md` when composing, which
`orbit-archive-modifications`' `Archive summary schema reference ships with the skill` describes the body as giving.

D-opsd-4's residual method (classify each paragraph of every moving section, before any text moves) was run at this
propose. Its result, which the requirement's table carries, with two kinds the table did not name: a PROVENANCE note
("(Per `orbit-run-summary-emit`; composed and written via …)") and a RATIONALE (apply's "Why chunk-aware"); both leave
the body with the detail.

| body | stays in the body, verbatim | leaves the body (kept in the reference's whole section) |
|---|---|---|
| apply | heading; "`/orbit:apply` is a chunked multi-turn command. Fire the emit … everything else is engine-computed." (carries `(chain: not a prompt)`); command block; **Completion-prompt override (chat)** | provenance note; "Compose the payload into a temp file and invoke:" (the cue replaces it); payload fields with `judgements`, `consent`, the withdrawn grant; "The ENGINE owns everything else…"; **Why chunk-aware** |
| archive | heading; command block; a new first sentence (after upstream Step 5 completes, write the archive run summary) and a sentence naming `references/archive-summary-schema.md` | the compose sentence and its field list; COMPOSE THE READINESS RECORD; the token source; not-ready; `accepted` versus `warnings`; "The ENGINE resolves…"; the withdrawn grant |
| architect | heading; the conversation-boundary paragraph; **No emit without sweep**; command block | the compose sentence and its field list; "The ENGINE owns the spine…" with the `handoff` rules |
| review (Step 9) | heading; command block (both forms) | the compose sentence and its field enumeration; "The ENGINE owns everything else…" with the architecture-mode `handoff` and the schema pointer (the body still names `references/run-summary-schema.md` at its disjunctive-recommendations section) |
| verify | heading; a first sentence (at command completion); command block | provenance note; the compose sentence and its fields; "The ENGINE owns…" with the fail-mode recommendation |
| propose | heading; command block; the second publish segment paragraph; **Completion-prompt override (chat)** | provenance note; the compose sentence and its fields (`pr_attachment` per `references/pr-choreography.md`); "The ENGINE owns…" |
| address-reviews (step 6) | heading; **ONE resolution log PER SOURCE** paragraph whole; command block; the scope-forms paragraph (`--doc`, bare, archived); a sentence naming `references/run-summary-schema.md` | "Compose each payload — … Write the payload to a temp file and invoke:" |
| ff | heading; a first sentence (at command completion); command block; the second publish segment paragraph; **Completion-prompt override (chat)** | provenance note; the compose sentence and its fields (`pr_attachment` per `references/pr-choreography.md`); "The ENGINE owns…" |
| continue | heading; a first sentence (at command completion); command block; **Completion-prompt override (chat)** | provenance note; the compose sentence and its fields; "The ENGINE owns…" |
| new | heading; a first sentence (at command completion); command block | provenance note; the compose sentence and its fields; "The ENGINE owns…" |
| audit-drift (step 10) | heading; the **Standalone invocations only** sentence; command block (both forms) | "Compose the payload in the shape of the **Example payload** … and invoke:"; "The ENGINE owns the spine…" |

Address-reviews' first paragraph mixes when the logs are written with one sentence of a discovered log's provenance
fields; it stays whole, since splitting it would reword and its when-text is the step's trigger. Its section therefore
saves nothing in size (its body stays level, and each walk reads the new file at its first log); most of
address-reviews' saving is the account step. It moves, as ff's, continue's, new's and audit-drift's short sections do,
so every emit step in scope has one shape (D-opsd-9).

### 4. The rule joins the convention

`skill_body_convention.md` gains a rule beside the conditional-steps one: a block acted on once, at a moment the body
names (the session's first emit, the end of apply, the end of a walk), keeps that moment, its command and any chat
behaviour in the body and tells the agent to read its reference there, every time; the reference decides what the
moment calls for. The emit steps and the account steps both follow it. Its Examples gain the emit step; its Exceptions name explore's and bulk-archive's emit steps. The CLAUDE.md
sentence summarizing the convention is widened to match.

### 5. Verification, and the session that lowers the ceilings (D-opsd-6)

Tests prove what can be proven by text: each moved block's sha256, recorded from HEAD before any edit, held by
`moved-blocks.test.ts`; each basic content byte-equal across its carrying bodies and carried once, in place; each
reference a title plus its constant; every body naming every reference it ships. The pinned tests found by a probe at
propose (the moving text removed in a throwaway worktree, 29 failures in 14 files) retarget to the reference: the
account tests, `archive-user-validation`, `orbit-content-fidelity`, `orbit-generated-surface`, `reading-step-surface`;
the probe's other failures (`walk-routing`, `chain-prompt-tags`, the size-brief split line, `moved-blocks`' one-level
check) were text that stays. The real-session check is the apply itself: the last chunk runs in a NEW `/orbit:apply`
session after `npm run build && node bin/orbit.js update --force`, so the session that checks the last task follows the
account cue at its end, reads `references/account-step.md` and writes this change's account, and composes its run
summary from `run-summary-emit.md`; it also lowers the ceilings, which needs the final sizes.

## Risks / Trade-offs

- [D-opsd-4 is BOUNDED] → its named limit and residual live in the requirement `A body reads its run-summary detail
  before the session's first emit` (`orbit-run-summary-emit`); see there.
- [A session skips the account read] → no account is written and nothing reports it; the same as today with the step in
  the body, plus one read to skip. Named in `Each change carries one account, written when apply is complete`; an engine
  report of a missing account is on `evaluation`'s list (D-opsd-8, R-rop-4's companion).
- [Every apply session and every walk reads its account reference] → 4,036 or 4,656 characters in the session's last
  few turns, also in a session that writes nothing; chosen over a condition in the body that every turn would carry
  (D-opsd-8).
- [A session skips the emit read] → an owed field's trigger is never met and the record is lost silently; only an absent
  `consent` is flagged. Accepted by Sal against keeping owed-when lines in the bodies (D-opsd-4); the named limit is in
  the new requirement.
- [RG1's margin] → `conditional-steps` projected about 352,700 after `tighten-bodies` (2,700 over 350,000), counting the
  brief's 21,700 for this stage. The cue lines stay in every body, and the four short sections and address-reviews'
  step 6 save about nothing in size, so this stage's saving is estimated at 19,000 to 20,000 and `tighten-bodies` starts
  further over: the archive records the measured figure and the new projection.
- [Five steps move for shape, not size] → address-reviews' body stays level and each walk reads a ~2,400-character
  reference at its first log; ff, continue, new and audit-drift each gain a reference under 1,200 characters, read once
  at their single emit. Accepted by Sal so every emit step in scope has one shape and a new field one place to go
  (D-opsd-9).
- [Positional phrases in a reference] → the moved text names its body's steps ("Step 3's inflection prompt", "Step
  0's provenance classification", "Step 5.65"); in the reference they still name the same skill's body, whose steps keep
  their headings.
- [Review sessions read a new file] → a review session reads `run-summary-emit.md` (about 2,500 characters) once,
  at its emit, where it carried about 2,300 inline; review's saving is per turn before the emit, not per session.

## Alternatives considered

- **An engine report of a missing account, in this stage** — a guard against a skipped read rather than a branch, and an
  engine change the Premise rules out; for `evaluation`'s list beside R-rop-4's (see explore.md, D-opsd-8).
- **A cue keyed on the apply gate (D-opsd-3), or on the gate or this session's declaration** — the gate alone missed a
  first declared handoff, and any condition rides every turn; one read at the step's moment costs less (see explore.md,
  D-opsd-8).
- **Owed-when lines in each emit section (option 1), and the hybrid keeping them for apply only** — a second home for
  the triggers of the event-owed fields, kept in step by hand; Sal chose one home and an unconditional read (D-opsd-4).
- **Leaving the short emit sections, or address-reviews' step 6, whole** — each would be a shape-exception where the
  next payload field lands inline by habit; Sal chose one shape across the eleven (see explore.md, D-opsd-9).
- **Joining review's, address-reviews' and archive's moved text to their schema references** — each session would read
  15,000 to 31,000 characters (Decision 2).
- **A throwaway project, or the next stage's apply, as the account evidence** — artificial, or too late for this stage's
  ratification (D-opsd-6).

## Touchpoints

- `src/core/disciplines.ts` — `ACCOUNT_STEP_BASIC`, `ACCOUNT_WALK_STEP_BASIC`, `RUN_SUMMARY_READ_CUE`.
- `src/core/templates/workflows/apply-change.ts` + `src/core/templates/workflows/address-reviews.ts` — account basic content and references; the emit sections.
- `src/core/templates/workflows/archive-change.ts` + `src/core/templates/workflows/architect.ts` + `src/core/templates/workflows/review.ts` + `src/core/templates/workflows/verify-change.ts` + `src/core/templates/workflows/propose.ts` + `src/core/templates/workflows/ff-change.ts` + `src/core/templates/workflows/continue-change.ts` + `src/core/templates/workflows/new-change.ts` + `src/core/templates/workflows/audit-drift.ts` — the emit sections and `run-summary-emit.md`.
- `test/core/templates/` — the retargeted pins, `moved-blocks.test.ts`, `skill-body-budget.test.ts`, `skill-templates-parity.test.ts`.
- `test/core/init.test.ts` + `test/commands/config-profile.test.ts` — per-skill reference lists.
- `skill_body_convention.md` + `CLAUDE.md` — the second rule.
- `orbit/specs/orbit-decision-records/spec.md` + `orbit/specs/orbit-run-summary-emit/spec.md` — synced at archive.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-opsd-1 | — | fact (not carried) | none |
| D-opsd-2 | — | fact (not carried) | none |
| D-opsd-3 | — | superseded D-opsd-8 (not carried) | none |
| D-opsd-4 | BOUNDED | live rule | `A body reads its run-summary detail before the session's first emit` (orbit-run-summary-emit), as a normative TABLE; its residual verbatim in that requirement, pointed at from Risks |
| D-opsd-5 | — | superseded D-opsd-9 (not carried) | none |
| D-opsd-6 | — | scope (not carried) | none |
| D-opsd-7 | — | fact (not carried) | none |
| D-opsd-9 | — | scope (not carried) | none |
| D-opsd-8 | SOURCED | live rule | `Each change carries one account, written when apply is complete` (orbit-decision-records), as a SENTENCE naming the source (the two steps' branches, decided in the reference) |
