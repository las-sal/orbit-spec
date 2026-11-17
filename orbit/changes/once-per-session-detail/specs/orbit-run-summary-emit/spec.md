## ADDED Requirements

### Requirement: A body reads its run-summary detail before the session's first emit

Seven workflow bodies' run-summary emit steps SHALL keep in the body when the emit fires, the `orbit emit` command
with its scope forms, and the chat behaviour placed beside them: apply, archive, architect, review, verify, propose and
address-reviews. Each SHALL tell the agent, in one sentence carried byte-equal by all seven, to read the skill's
`references/run-summary-emit.md` before the session's first emit and to follow it in composing the payload. That
reference SHALL hold the emit section whole, as the body carried it before this requirement, so the payload detail is
read there and carried by no body. Each part of an emit section lands by this table:

| part of an emit section | lands |
|---|---|
| when the emit fires (one-shot, chunk boundary, conversation boundary, the sweep before it) | the body |
| the `orbit emit <cmd>` command and its scope forms | the body |
| the sentence telling the agent to read the reference before the session's first emit | the body, byte-equal in all seven |
| chat behaviour placed in the section (a completion-prompt override, propose's second publish segment) | the body |
| each payload field's meaning and shape | the reference only |
| when a field a session event owes is owed (apply's and archive's `judgements`, archive's `deferred_validations`, propose's `pr_attachment`) | the reference only |
| the token source and the readiness and continuation composition rules | the reference only |
| what the engine owns | the reference only |
| the withdrawn-grant re-emit (apply, archive) | the reference only, read before a refusal can arrive |
| a provenance note naming the owning requirements | the reference only |
| a rationale for the step's shape | the reference only |

ff's, continue's, new's and audit-drift's emit sections stay whole in their bodies: the first three name only
`final_assessment`, `model` and (ff) `pr_attachment`, and audit-drift's already composes from its reference's example. A
body whose moved section named a schema reference its skill ships (archive's `archive-summary-schema.md`,
address-reviews' `run-summary-schema.md`) keeps a sentence naming it, so every reference stays one level from the body.

Named limit — a session that does not read the reference composes without the triggers of the fields a session event
owes, and the write gate, which checks a present field's shape and never an owed field's absence, writes the emit
without them; only an absent `consent` is flagged, by audit-drift's consent tripwire.

Named limit — the table's rows are the parts read in the eleven emit sections in scope on 2026-11-17, each paragraph
classified before any text moved; the provenance and rationale rows were found by that classification.

Residual kind: a paragraph of an emit section that is neither when, command, payload detail nor chat behaviour

Residual method: classify each paragraph of every moving section against this table at propose, before any text moves

#### Scenario: The seven bodies carry the read sentence

- **WHEN** the apply, archive, architect, review, verify, propose and address-reviews skills are generated
- **THEN** each body's emit step carries the shared read sentence once, followed by its `orbit emit` command, and each
  skill ships `references/run-summary-emit.md`

#### Scenario: The reference holds the section as it was

- **WHEN** the apply skill's `references/run-summary-emit.md` is read
- **THEN** it holds apply's emit section whole as the body carried it before this requirement, the `judgements` entry
  after Step 3's Proceed anyway, the token source, `consent` and the withdrawn grant included, and the apply body
  carries none of those

#### Scenario: The trigger of an owed field is in the reference

- **WHEN** the archive skill is generated
- **THEN** its `references/run-summary-emit.md` holds the readiness record's composition (a `judgements` entry of kind
  `readiness` when the archive concludes a review cadence), and its body does not

#### Scenario: What stays is in the body

- **WHEN** the apply body is generated
- **THEN** its emit step carries the chunk-boundary sentence with `(chain: not a prompt)` and the completion-prompt
  override, and propose's carries its second publish segment and its completion-prompt override

#### Scenario: Four sections are left as they are

- **WHEN** the ff, continue, new and audit-drift skills are generated
- **THEN** each emit section reads as before this requirement, and none of the four ships `references/run-summary-emit.md`
