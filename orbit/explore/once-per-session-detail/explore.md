> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: once-per-session-detail

## Premise

The second stage of `reduce-orbit-phase1` (its charter; the brief's section 4.2). Two moves: the run-summary payload
detail the bodies still carry inline moves to each skill's run-summary schema reference, the body keeping the emit's
call; and the account step keeps its basic content and moves its field rules to a reference file. Before the account
step moves, the charter asks whether the apply gate could report a missing account, since nothing in the engine
prompts for one today. What this exploration has to settle is how each move is cut, what each body keeps, which
requirements and tests move, and the answer to the charter's account question.

## Mechanism

### D-opsd-3 — the apply gate's `passed` picks the account step's read
Domain: every situation an account step decides, and what picks its read
| member | covered by |
|---|---|
| an apply session ends with the apply gate not passed | apply's basic content: no read, no account |
| an apply session ends with the gate passed and no account | basic content cues the read; the reference writes one |
| an apply session ends with the gate passed, an account, and work since that changed what it says | basic content cues the read; the reference writes a replacement |
| the same, with nothing changed | basic content cues the read; the reference writes none |
| an apply session arriving on `all_done` (no run summary) | the gate reads passed; the read comes before the completion readout, as today's step orders it |
| a walk of an active change whose `.orbit-runs/account/` holds an account | address-reviews' basic content cues the read of its walk reference |
| a walk of a change with no account, of an archived change, or with no change target | address-reviews' basic content: no read, no account |
Closure: SOURCED — the branches of `ACCOUNT_STEP` and `ACCOUNT_WALK_STEP` in `src/core/disciplines.ts`
Moves:
- READ: applied — `ACCOUNT_STEP` defines "APPLY IS COMPLETE when the change's apply gate passes"; the gate's pass condition is D-opsd-2's
- ENUMERATE: applied — this table, one row per branch of the two constants
- COHERE: applied — the cue and the reference's definition of complete are one predicate, the gate's `passed`, user-validation subset included
- EXECUTE: not applied — no body yet; Q4's run executes it
- FALSIFY: applied — a session that skips the read writes no account and nothing reports it; the same holds today with the step in the body, and the move adds only the read to skip, a named limit as in `conditional-steps`; an engine report goes to `evaluation`
- CONFORM: applied — R-rop-3 (basic content and reference, each byte-equal to a source), R-rop-4 (the body directs the read), R-rop-5 (same body under every configuration), the brief's rule 2, and the Premise (no engine change)
- FEASIBILITY: not applied — one `orbit status` read the step already implies
- CONSUME: applied — the account's readers (the brief, the decision-records reader) read the folder, whatever body wrote it
- INVOKE: applied — the cue sits in the body and fires at every apply session's end and every walk of an active change

### D-opsd-4 — each emit section keeps when and the command, and reads its reference before the session's first emit
Domain: the parts of a body's run-summary emit section, and where each lands
| member | covered by |
|---|---|
| when the emit fires (one-shot, chunk boundary, conversation boundary, the sweep before it) | stays in the body |
| the `orbit emit <cmd>` command and its scope flags | stays in the body |
| the instruction to read the reference before the session's first emit | new basic content in the body |
| each payload field's meaning and shape | moves to the reference, byte-equal |
| the triggers of event-owed fields (apply's and archive's `judgements`, `deferred_validations`, `pr_attachment`, …) | move to the reference; read at every session's first emit, so in front of the agent when composing |
| the token source and the readiness/continuation composition rules | move to the reference |
| what the engine owns ("never hand-compose") | moves to the reference |
| the withdrawn-grant re-emit (apply, archive) | moves to the reference; already read before the refusal can arrive |
| chat behaviour placed in the section (apply's and propose's completion-prompt overrides, propose's second publish segment) | not payload detail: stays in the body |
Closure: BOUNDED — all eleven sections in scope were read in full on 2026-11-17 and each paragraph sorted to a row while reading, not listed paragraph by paragraph
Residual kind: a paragraph of an emit section that is neither when, command, payload detail nor chat behaviour
Residual method: classify each paragraph of every moving section against this table at propose, before any text moves
Moves:
- READ: applied — the eleven sections read in full; the write gate's presence checks are `model` and review's owed fields (D-opsd-1)
- ENUMERATE: applied — this table
- COHERE: applied — the event-owed triggers move with the shapes because the read is unconditional; under option 1 they would have stayed, which this rule supersedes
- EXECUTE: not applied — no body yet
- FALSIFY: applied — a session that skips the read composes without the owed-field triggers and loses those records silently; only an absent `consent` is flagged (audit-drift's tripwire), a named limit Sal accepted against option 1's second home for the triggers
- CONFORM: applied — the brief's rule 3 (one home), R-rop-3 (the reference byte-equal to today's text), R-rop-4 (the body directs the read), R-rop-10 ("first emit" avoids the unmeasured re-read at later emits)
- FEASIBILITY: applied — the read happens once per session, at its first emit; apply and architect then carry the text for the rest of the session, which Sal accepted
- CONSUME: applied — the emit-composition schema-table parity test reads each skill's schema reference against the engine's payload table; new `run-summary-schema.md` files join its set, and archive already has `archive-summary-schema.md`
- INVOKE: applied — the read instruction sits beside the command, at the one moment every session reaches

## Decisions

- **2026-11-17 — D-opsd-1: the emit write gate checks a payload's shape, never whether an owed field is present** The
  brief's case for moving the payload detail ("the engine refuses a bad payload and names the field") holds for a field
  that is present and wrong, and for an unknown key. A field whose presence a session event owes is checked by presence
  only: `validateJudgements` returns at once when `judgements` is absent ("scoped BY PRESENCE — no key, no check"), and
  an absent `consent` is allowed (the withdrawn-grant path writes the emit without it). So an apply after **Proceed
  anyway** that omits its `continuation` entry, or an archive concluding a review cadence that omits its `readiness`
  entry, writes cleanly and loses the record. The triggers for those fields live only in the body text today.
  Kind: fact
- **2026-11-17 — D-opsd-2: the apply gate is checkbox arithmetic and never reads the account folder** The tracked gate
  (`src/core/artifact-graph/gates.ts`) passes on `checked === total`, or on the user-validation subset rule; nothing in
  it, in `orbit status` or in the apply emit lists `.orbit-runs/account/`. The engine's readers of an account are the
  brief (`program-brief.ts`) and the decision-records reader. All six changes archived since accounts began
  (2026-11-13: brief-render, change-account, program-brief, program-signoff, tripwires, conditional-steps) carry one,
  written under bodies carrying the full step.
  Kind: fact

- **2026-11-17 — D-opsd-3: the apply gate's `passed` picks the account step's read, with no engine change** Sal's
  answer to Q1. Apply's basic content says that at the session's end, when the apply gate reads `passed`, the agent
  reads `references/account-step.md` and follows it; address-reviews' says that after the logs, when the walk's change
  is active and its `.orbit-runs/account/` holds an account, the agent reads its walk reference. Whether an account
  exists and whether it is replaced are decided in the reference. An engine report of a missing account is not built
  here: it is a guard against a missed read, not a branch, and goes to `evaluation`'s list beside R-rop-4's.

- **2026-11-17 — D-opsd-4: every emit section keeps when it fires and its command, and reads its reference before the
  session's first emit** Sal's answer to Q2 after a comparison, choosing option 2 everywhere over the
  owed-when lines (option 1) and over a hybrid keeping option 1 for apply. The payload detail, the triggers of the
  event-owed fields included, moves to the skill's run-summary schema reference byte-equal; the body says to read it
  before the session's first emit. One home for each text and no judgement about whether to read; apply and architect
  carry the full text after their first emit.

- **2026-11-17 — D-opsd-5: seven bodies' emit sections move: apply, archive, architect, review, verify, propose and
  address-reviews** Sal's answer to Q3, over the five carrying real detail (the recommendation), all eleven, or apply
  and archive alone. ff, continue, new and audit-drift keep their sections as they are: audit-drift's already composes
  from its reference's example, and the other three name only `final_assessment`, `model` and (ff) `pr_attachment`.
  No test holds propose's and ff's sections equal, so propose's moving alone breaks no pin; the two then differ. Apply,
  architect, verify and propose gain a run-summary schema reference; archive's moved text joins
  `archive-summary-schema.md`; review's and address-reviews' join their existing `run-summary-schema.md`.
  Kind: scope

- **2026-11-17 — D-opsd-6: this change's own apply shows the account written under the new bodies, its last chunk run
  in a fresh session** Sal's answer to Q4, over a throwaway project or the next stage's apply. A session runs on the
  body loaded when its command was invoked, so the apply ends in two sessions: the first implements all but the last
  chunk and regenerates the surface (`npm run build && node bin/orbit.js update --force`); a new `/orbit:apply` does the
  last chunk, which is real work (lowering the budget-test ceilings and running the size report), sees the gate read
  `passed`, follows the cue to the account reference and writes the account. Its run-summary emit runs under D-opsd-4
  too, and every later session of the change (system review, walk, archive) runs on the new bodies.
  Kind: scope
- **2026-11-17 — D-opsd-7: what the specs pin of the moving text, as far as read here** `orbit-decision-records`'
  `Each change carries one account, written when apply is complete` states the account's behaviour, not where its step
  text sits; the step's text is pinned by tests (`account-step.test.ts`, `account-reading-walk.test.ts`,
  `skill-templates-parity.test.ts`). `orbit-emit-composition`'s `Payload schema references are proven by execution`
  counts "six blocks across five references"; the moving emit text is prose, not a schema block carrying `command`, so
  it adds none. Which `@scenario text` tags assert moving wording into a body is not measured here; propose measures it
  before planning tasks.
  Kind: fact

## Open questions


## Considered & out

- **2026-11-17 — An engine report of a missing account, in this stage:** a guard against a skipped read rather than a
  branch, and an engine change the Premise rules out; for `evaluation`'s list beside R-rop-4's (D-opsd-3).
- **2026-11-17 — Owed-when lines in each emit section (option 1), and the hybrid keeping them for apply only:** a second
  home for the triggers of the event-owed fields, kept in step by hand; Sal chose one home and an unconditional read
  (D-opsd-4).
- **2026-11-17 — Moving ff's, continue's, new's and audit-drift's emit sections:** each is already about as short as
  basic content would be, or (audit-drift) already composes from its reference (D-opsd-5).
- **2026-11-17 — A throwaway project, or the next stage's apply, as the account evidence:** artificial, or too late for
  this stage's ratification (D-opsd-6).

## References

- `orbit/architecture/reduce-orbit-phase1.md` — stage `once-per-session-detail`, R-rop-3, R-rop-4, R-rop-5, R-rop-8
- `orbit/architecture/reduce-orbit-phase1-brief.md` — section 4.2 (stage B)
- `orbit/changes/archive/2026-11-17-conditional-steps/` — the previous stage, its pattern for moved blocks
- `skill_body_convention.md`
- `src/core/emit-composition.ts` — the payload table (`COMMANDS`), `validateJudgements` (scoped by presence)
- `src/core/artifact-graph/gates.ts` — the tracked gate's pass condition
- `src/core/disciplines.ts` — `ACCOUNT_STEP`, `ACCOUNT_WALK_STEP`, `ACCOUNT_HOW`
- `orbit/specs/orbit-decision-records/spec.md` — `Each change carries one account, written when apply is complete`
- `orbit/specs/orbit-emit-composition/spec.md` — `Payload schema references are proven by execution`
