## Why

A skill body a session invokes stays in its context on every turn, yet two of its blocks are acted on once: the
run-summary payload detail, at the session's emit, and the account step, when apply completes. This is the second stage
of `reduce-orbit-phase1` (`once-per-session-detail`, the brief's stage B): both move to reference files the body tells
the agent to read at that moment, without changing what any workflow does (RG0). The exploration found that the move
cannot rest on the write gate alone, since it refuses a malformed field and never notices an owed one left out
(D-opsd-1), and that the apply gate never reads the account folder (D-opsd-2). See `explore.md` (D-opsd-1 to D-opsd-7).

## What Changes

- **The account step splits into basic content and a reference file** (D-opsd-3). Apply's basic content reads the apply
  gate at the session's end and, when it reads `passed`, sends the agent to `references/account-step.md`, which holds
  `ACCOUNT_STEP` whole; the walk's, after its logs, sends the agent to `references/account-walk-step.md`, holding
  `ACCOUNT_WALK_STEP` whole, when the walk's change is active and its `account/` folder holds an account. No engine
  change: the gate's `passed` already picks the branch.
- **Seven bodies' run-summary emit steps keep when the emit fires, the command and the chat behaviour beside them, and
  read their reference before the session's first emit** (D-opsd-4, D-opsd-5): apply, archive, architect, review,
  verify, propose and address-reviews. The payload detail (each field's meaning and shape, when an optional field is
  owed, the token source, the composition rules, what the engine owns), with the provenance notes and rationale beside
  it, moves verbatim to the skill's run-summary reference: a new `run-summary-schema.md` for apply, architect, verify
  and propose; a new section of the existing `archive-summary-schema.md` and of review's and address-reviews'
  `run-summary-schema.md`. ff, continue, new and audit-drift keep their sections as they are.
- **The rule for once-a-session detail joins `skill_body_convention.md`** beside the rule for conditional steps: a
  block acted on once, at a moment the body names, keeps that moment and its command in the body and is read there.
- **The budget test's ceilings are lowered** to the new sizes plus 5% (R-rop-8), by a fresh apply session that runs on
  the regenerated bodies and writes this change's account under them (D-opsd-6).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-decision-records`: `Each change carries one account, written when apply is complete` says the two bodies carry
  each step's basic content and its reference file the full instruction.
- `orbit-run-summary-emit`: a new requirement, `A body reads its run-summary detail before the session's first emit`,
  says what a moving emit step keeps in the body and what its reference holds, with the named limit of a skipped read.

## Impact

- `src/core/disciplines.ts` (the account steps' basic content, the shared read cue) and
  `src/core/templates/workflows/{apply-change,address-reviews,archive-change,architect,review,verify-change,propose}.ts`
  (the moved detail as constants, the new and grown reference files).
- Tests that pin the moved text retarget to its new home (R-adf-15, RG0); `moved-blocks.test.ts` holds each moved
  block byte-equal to its text before the change; the per-skill reference lists and `skill-templates-parity` hashes
  move; `skill-body-budget.test.ts` ceilings go down.
- `skill_body_convention.md` and the CLAUDE.md line that summarizes it.
- No engine command, payload, emit, gate or config changes; no behaviour changes under any setting.
