## ADDED Requirements

### Requirement: A body reads its run-summary detail before the session's first emit

Every workflow body's run-summary emit step in scope SHALL keep in the body when the emit fires, the `orbit emit`
command with its scope forms, and the chat behaviour placed beside them: apply, archive, architect, review, verify,
propose, address-reviews, ff, continue, new and audit-drift. Each SHALL tell the agent, in a read cue carried
byte-equal by all eleven, to read the skill's
`references/run-summary-emit.md` before the session's first emit and to follow it in composing the payload. That
reference SHALL hold the emit section whole, as the body carried it before this requirement, so the payload detail is
read there and carried by no emit section. Each part of an emit section lands by this table:

| part of an emit section | lands |
|---|---|
| when the emit fires (one-shot, chunk boundary, conversation boundary, the sweep before it) | the body |
| the `orbit emit <cmd>` command and its scope forms | the body |
| the read cue telling the agent to read the reference before the session's first emit | the body, byte-equal in all eleven |
| chat behaviour placed in the section (a completion-prompt override, propose's and ff's second publish segment) | the body |
| each payload field's meaning and shape | the reference, out of the emit section |
| when a field a session event owes is owed (apply's and archive's `judgements`, archive's `deferred_validations`, propose's and ff's `pr_attachment`) | the reference, out of the emit section |
| the token source and the readiness and continuation composition rules | the reference, out of the emit section |
| what the engine owns | the reference, out of the emit section |
| the withdrawn-grant re-emit (apply, archive) | the reference, out of the emit section; read before a refusal can arrive |
| a provenance note naming the owning requirements | the reference, out of the emit section |
| a rationale for the step's shape | the reference, out of the emit section |

Two emit steps keep their sections whole, outside phase 1 of `reduce-orbit-phase1`: explore's, and bulk-archive's
per-change archive emit. A body whose moved section was the only place it named a reference its skill ships
(archive's `archive-summary-schema.md`, address-reviews' `run-summary-schema.md`) keeps a sentence naming it, so every
reference stays one level from the body.

The table governs the emit section alone. Text of these kinds elsewhere in a body stays where it is: apply's Step 3
states the `judgements` trigger where Proceed anyway is chosen, and archive's Step 3.2 composes `deferred_validations`
where a task is deferred. Two mixed paragraphs stay whole in their sections, because each is mostly when the emit
fires: address-reviews' paragraph on one log per source, which also names a discovered log's provenance fields, and
architect's opening parenthetical, a provenance note beside its timing.

Named limit — a session that does not read the reference composes without each trigger only the emit section stated
(archive's readiness record is one), and the write gate, which checks a present field's shape and never an owed field's
absence, writes the emit without it; only an absent `consent` is flagged, by audit-drift's consent tripwire. A long
session reads the reference before its first emit only: when a compaction later drops that read, its later emits are
composed without it, and the cue does not send it back. Whether a read lost to a compaction calls for a re-read or a
read named by an orbit command is weighed at `evaluation` (R-rop-4, R-rop-12).

Named limit — the table's rows are the parts read in the eleven emit sections in scope on 2026-11-17, each paragraph
classified before any text moved; the provenance and rationale rows were found by that classification.

Residual kind: a paragraph of an emit section that is neither when, command, payload detail nor chat behaviour

Residual method: classify each paragraph of every moving section against this table at propose, before any text moves

#### Scenario: Every emit step in scope carries the read cue

- **WHEN** the apply, archive, architect, review, verify, propose, address-reviews, ff, continue, new and audit-drift
  skills are generated
- **THEN** each body's emit step carries the shared read cue once, followed by its `orbit emit` command, and each
  skill ships `references/run-summary-emit.md`

#### Scenario: The reference holds the section as it was

- **WHEN** the apply skill's `references/run-summary-emit.md` is read
- **THEN** it holds apply's emit section whole as the body carried it before this requirement, the `judgements` entry
  after Step 3's Proceed anyway, the token source, `consent` and the withdrawn grant included, and the apply body's
  emit step carries none of those

#### Scenario: The trigger of an owed field is in the reference

- **WHEN** the archive skill is generated
- **THEN** its `references/run-summary-emit.md` holds the readiness record's composition (a `judgements` entry of kind
  `readiness` when the archive concludes a review cadence), and its body does not

#### Scenario: What stays is in the body

- **WHEN** the apply body is generated
- **THEN** its emit step carries the chunk-boundary sentence with `(chain: not a prompt)` and the completion-prompt
  override, and propose's and ff's carry their second publish segment and their completion-prompt override

#### Scenario: Explore and bulk-archive are left as they are

- **WHEN** the explore and bulk-archive skills are generated
- **THEN** each emit section reads as before this requirement, and neither ships `references/run-summary-emit.md`
