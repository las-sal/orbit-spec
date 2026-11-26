## MODIFIED Requirements

### Requirement: A body reads its run-summary detail before the session's first run-summary emit

Every workflow body's run-summary emit step in scope SHALL keep in the body when the emit fires, the `orbit emit`
command with its scope forms, and the chat behaviour placed beside them: apply, archive, architect, review, verify,
propose, address-reviews, ff, continue, new, audit-drift and explore, save address-reviews' and explore's exceptions below. Each SHALL tell the agent, in a read cue carried
byte-equal by all twelve, to read the skill's
`references/run-summary-emit.md` before the session's first run-summary emit and to follow it in composing the payload. That
reference SHALL hold the emit section whole, as the body carried it before this requirement less what a later removal
ruling took from it (address-reviews' batch-mode sentences, `reduce-orbit-phase2`'s R-rop2-12) and the rewording explore's
paragraph below names, so the payload detail is
read there and carried by no emit section. Each part of an emit section lands by this table:

| part of an emit section | lands |
|---|---|
| when the emit fires (one-shot, chunk boundary, conversation boundary, the sweep before it) | the body |
| the `orbit emit <cmd>` command and its scope forms | the body (address-reviews' scope forms excepted, below) |
| the read cue telling the agent to read the reference before the session's first run-summary emit | the body, byte-equal in all twelve |
| chat behaviour placed in the section (a completion-prompt override, propose's and ff's second publish segment) | the body |
| each payload field's meaning and shape | the reference, out of the emit section |
| when a field a session event owes is owed (apply's and archive's `judgements`, archive's `deferred_validations`, propose's and ff's `pr_attachment`) | the reference, out of the emit section |
| the token source and the readiness and continuation composition rules | the reference, out of the emit section |
| what the engine owns | the reference, out of the emit section |
| the withdrawn-grant re-emit (apply, archive) | the reference, out of the emit section; read before a refusal can arrive |
| a provenance note naming the owning requirements | the reference, out of the emit section |
| a rationale for the step's shape | the reference, out of the emit section |

Explore's emit step came under this requirement at `reduce-orbit-phase2`'s `cut-explore-onboard` (it was kept whole
through `reduce-orbit-phase1`), so that the body fits that program's G1. Its reference holds the section whole as the body
carried it at `9a122611`, less its crystallization subsection, with two edits made in the section before it moved: a
positional pointer reworded to name its target, and the timing paragraphs the body keeps tightened with their stage tags,
each named in `reduce-orbit-phase2`'s cut ledger, so the body and the reference carry one wording. That subsection runs in bare mode, before any file exists
or any emit fires, so a read before the first emit would come after the moment it serves. It leaves the emit section for
the skill's `references/crystallization.md`, which the body reads before writing any file when a bare exploration is
about to be named: the user asks to save it under a name, or accepts the Mode C prompt. Explore's body keeps, by the
table: the BEGIN emit after the scaffold and its metadata, a Mode C session back-filling `explore.md` first; the two
boundary rules and what is not a boundary; the wrap-phrase convention, chat behaviour placed in the section; the residency
sweep before every boundary emit; no retro-fire; bare mode's non-emission; and the `orbit emit explore` command.

A body whose moved section was the only place it named a reference its skill ships
(archive's `archive-summary-schema.md`, address-reviews' `run-summary-schema.md`) keeps a sentence naming it, so every
reference stays one level from the body.

The table governs the emit section alone. Text of these kinds elsewhere in a body stays where it is: apply's Step 3
states the `judgements` trigger where Proceed anyway is chosen, and archive's `references/user-validation.md`, read at
its Step 3.2, composes `deferred_validations` where a task is deferred. One mixed paragraph stays whole in its section,
because it is mostly when the emit fires: architect's opening parenthetical, a provenance note beside its timing.
Address-reviews' paragraph on one log per source, which also names a discovered log's provenance fields, and its scope
forms (the `--doc` invocation of an architecture-scoped ingest and the bare one of a walk with no change anchor) leave its
body for its `references/run-summary-emit.md`, which held both whole already, so the body fits the 5,000 estimated tokens
`reduce-orbit-phase2`'s G1 keeps (`cut-review-walk`, Sal's ruling at its apply): the body keeps a one-line pointer saying
that a walk which discovered several sources writes one log for each, and the paragraph's sentences on the order of the
walk are also in the skill's `references/triage-sources.md`, which the body reads before the walk when discovery yields
more than one source. Named limit — the body's emit command shows only `--change`, so a walk of an architecture review
or with no change anchor takes its form from the reference the read cue sends it to before its first emit; a session
that skipped that read invokes `--change` with no change to name, which the emit surface refuses, naming what it lacks.

Named limit — a session that does not read the reference composes without each trigger only the emit section stated
(archive's readiness record is one), and the write gate, which checks a present field's shape and never an owed field's
absence, writes the emit without it; only an absent `consent` is flagged, by audit-drift's consent tripwire. A long
session reads the reference before its first run-summary emit only: when a compaction later drops that read, its later emits are
composed without it, and the cue does not send it back. `reduce-orbit-phase1`'s evaluation answered how a compaction is
met (R-rop-18): every body fits the tokens a compaction keeps of it, so the timing, the command and the cue survive, and a
reference read the compaction drops is not read again. A named exploration that compacts after its BEGIN emit is the
longest case: its body still says when each boundary emit fires and runs the sweep before it, and a payload composed
without the reference is refused by the emit surface, naming the field, when it lacks `model` or carries a key the engine
owns or the command does not take.

Named limit — the table's rows are the parts read in the eleven emit sections in scope on 2026-11-17, each paragraph
classified before any text moved; the provenance and rationale rows were found by that classification. Explore's
section was read against the same rows at `cut-explore-onboard`'s propose (2026-11-25), and is classified paragraph by
paragraph at its apply before any text moves, its crystallization subsection apart; a paragraph that mixes rows is
split by the table, each part going where its row puts it.

Residual kind: a paragraph of an emit section that is neither when, command, payload detail nor chat behaviour

Residual method: classify each paragraph of every moving section against this table at propose, before any text moves

#### Scenario: Every emit step in scope carries the read cue

- **WHEN** the apply, archive, architect, review, verify, propose, address-reviews, ff, continue, new, audit-drift and
  explore skills are generated
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

#### Scenario: Explore's emit step keeps its timing in the body

- **WHEN** the explore skill is generated
- **THEN** its emit step carries the read cue, the `orbit emit explore` command, the BEGIN emit's moment with Mode C's
  back-fill first, the two boundary rules, the residency sweep before every boundary emit and bare mode's non-emission,
  and carries none of the payload's field list, what the engine owns, the Mode B begin emit's `final_assessment` content
  or the rationale for the timing; its `references/run-summary-emit.md` carries them

#### Scenario: Explore's crystallization is read before any file is written

- **WHEN** the explore skill is generated
- **THEN** its body says to read `references/crystallization.md` before writing any file when a bare exploration is about
  to be named, the reference carries the warning's four consequences and its confirmation gate, its step after confirmation
  reads `references/new-exploration.md` before the metadata is written, and the skill's
  `references/run-summary-emit.md` does not carry them

#### Scenario: Address-reviews reads its per-source paragraph and scope forms from its reference

- **WHEN** the address-reviews skill is generated
- **THEN** its emit step carries the read cue, the `--change` command and a one-line pointer that one log is written per
  discovered source, and carries neither the per-source paragraph nor the `--doc` and bare forms; its
  `references/run-summary-emit.md` carries both, and its triage step reads `references/triage-sources.md`, which carries
  the paragraph's sentences on the order of the walk
