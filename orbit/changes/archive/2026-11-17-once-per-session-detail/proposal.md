## Why

A skill body a session invokes stays in its context on every turn, yet two of its blocks are acted on once: the
run-summary payload detail, at the session's emit, and the account step, when apply completes. This is the second stage
of `reduce-orbit-phase1` (`once-per-session-detail`, the brief's stage B): both move to reference files the body tells
the agent to read at that moment, without changing what any workflow does (RG0). The exploration found that the move
cannot rest on the write gate alone, since it refuses a malformed field and never notices an owed one left out
(D-opsd-1), and that the apply gate never reads the account folder (D-opsd-2). See `explore.md` (D-opsd-1 to D-opsd-9).

## What Changes

- **The account step splits into basic content and a reference file** (D-opsd-8). Apply's basic content sends the
  agent, at the session's end, to `references/account-step.md`, which holds `ACCOUNT_STEP` whole; the walk's, after its
  logs, sends the agent to `references/account-walk-step.md`, holding `ACCOUNT_WALK_STEP` whole. Each is read every time
  its moment comes, and the reference decides whether to write anything; no condition sits in the body. No engine
  change.
- **Every emit step in scope keeps when the emit fires, the command and the chat behaviour beside them, and reads its
  reference before the session's first run-summary emit** (D-opsd-4, D-opsd-9): apply, archive, architect, review, verify,
  propose, address-reviews, ff, continue, new and audit-drift, one shape for all eleven. The payload detail (each field's meaning and shape, when an optional field is
  owed, the token source, the composition rules, what the engine owns), with the provenance notes and rationale beside
  it, moves verbatim to one new reference file per skill, `references/run-summary-emit.md`, which holds the emit section
  whole; the existing schema references (review's and address-reviews' `run-summary-schema.md`, archive's
  `archive-summary-schema.md`) are left as they are. This departs from D-opsd-5's last sentence and from the charter's
  "each skill's run-summary schema reference": those files run to 15,000 to 31,000 characters, and a session that must
  read its reference whole before its first run-summary emit would read more than the body carries today (design Decision 2).
  Explore and bulk-archive keep theirs, outside this phase.
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
- `orbit-run-summary-emit`: a new requirement, `A body reads its run-summary detail before the session's first run-summary emit`,
  says what every emit step in scope keeps in the body and what its reference holds, with the named limit of a skipped
  read.

## Impact

- `src/core/disciplines.ts` (the account steps' basic content, the shared read cue) and
  `src/core/templates/workflows/{apply-change,address-reviews,archive-change,architect,review,verify-change,propose,ff-change,continue-change,new-change,audit-drift}.ts`
  (the moved detail as constants, the new and grown reference files).
- Tests that pin the moved text retarget to its new home (R-adf-15, RG0); `moved-blocks.test.ts` holds each moved
  block byte-equal to its text before the change; the per-skill reference lists and `skill-templates-parity` hashes
  move; `skill-body-budget.test.ts` ceilings go down.
- `skill_body_convention.md` and the CLAUDE.md line that summarizes it.
- No engine command, payload, emit, gate or config changes; no behaviour changes under any setting.
