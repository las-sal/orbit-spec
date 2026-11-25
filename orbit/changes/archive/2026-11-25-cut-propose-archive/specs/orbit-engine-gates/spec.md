## MODIFIED Requirements

### Requirement: Inflection-prompt override contract

The consuming workflow SHALL fire an inflection prompt when a user invokes a command whose phase
is gated by an unpassed or stale gate, offering exactly: address the gate (halt; canonical next
command), proceed anyway, or abort. Proceeding SHALL be recorded in the command's run summary,
carrying the gate, its state, and its reason AT DECISION TIME. This requirement states THAT the
override is recorded and WHICH FACTS ABOUT THE GATE it must carry; the FIELD those facts are
carried in, and its shape, belong to the emit layer and are not named here.
Gates NEVER hard-block — apply-parity enforcement:
the engine reports, the skill prompts, the user decides, the trail records.

**AT ARCHIVE, THE GATE SET IS EVERY REVIEWED GATE.** Archive is the last seam: a gate whose
`before` names a phase that never ran has no later prompt to speak at. The archive workflow's gate
prompt SHALL read every `reviewed` gate the schema declares, whatever its `before`, and list in ONE
prompt each that is not `passed` and whose `superseded` field is not true — an `unpassed` or
`stale` gate with its reason, a `blocked` gate with the reason naming what blocks it. A superseded
gate (its `before` names a gate that has passed) is NOT listed: it gated a phase that has run, and
that phase's seam owned the decision. Named limit: a phase entered without its workflow — tasks
checked by hand, so the `apply` gate passes with no apply-seam prompt — leaves the earlier gate
superseded with no recorded decision, and archive does not ask again. A `tracked` gate is NOT listed: its unchecked work is the archive's task check.
The recorded `independentSpend` MAY be shown beside a listed gate and SHALL NOT decide whether the
prompt fires or which gates it lists — effort is recorded, never targeted. Proceeding records one
entry per listed gate. When no gate is listed, the prompt does not fire.

#### Scenario: Override recorded, not prevented

- **WHEN** the user proceeds past an unpassed `review-system` gate at archive
- **THEN** the archive completes and its run summary records the override with the gate's state
  and reason at decision time

#### Scenario: The prompt is the only skip surface

- **WHEN** a gate is unpassed
- **THEN** no recommendation text offers proceeding past it; the option exists only inside the
  inflection prompt fired by the actual invocation

#### Scenario: An unapplied change's proposal gate speaks at archive

- **WHEN** archive is invoked on a change whose `review-proposal` gate is `unpassed`, whose `apply`
  gate is `ready`, and whose `review-system` gate is `blocked` by `apply`
- **THEN** ONE gate prompt lists `review-proposal` with its reason and `review-system` with the
  reason naming `apply`; `apply` is not listed; proceeding records two entries, one per listed gate

#### Scenario: A superseded gate stays silent at archive

- **WHEN** archive is invoked on a change whose `review-proposal` gate is `unpassed` and superseded
  because `apply` passed, and whose `review-system` gate is `passed`
- **THEN** no gate prompt fires

#### Scenario: Spend is shown, never decisive

- **WHEN** a listed gate carries `independentSpend` equal to or above its declared `budget`
- **THEN** the prompt MAY show the figure; the gate is listed because of its state, and a gate
  whose state is `passed` is never listed whatever its spend

### Requirement: The chain setting grants each command on its own key

The project configuration SHALL accept an optional `chain` key in `orbit/config.yaml`: a map from a command key to a
boolean, read by ONE resolver, each key granting the AI to run the commands of its row unasked when the engine names
one as the change's next command. A key that is absent, false or not a boolean grants nothing, and a `chain` value that
is absent or not a map grants nothing at all — today's behaviour. No key derives another and no umbrella key exists
(R-adf-6):

| key | grants |
|---|---|
| `review` | `/orbit:review --as <mode> <change>` and `/orbit:review --as <mode> --fresh <change>` |
| `review-external` | `/orbit:review --as <mode> --reviewer external <change>` and `/orbit:review --as <mode> --reviewer blind-pair <change>` |
| `address-reviews` | `/orbit:address-reviews <change>` |
| `apply` | `/orbit:apply <change>`, with or without the ` — user-invoked` marker, and every write the apply flow makes: its edits and its run summary |
| `archive` | `/orbit:archive <change>`, with or without the ` — user-invoked` marker, and every write the archive flow makes, the PR tail's outward writes included: the push to the attachment's branch, the rewrite of a per-change PR's description or the append of a program PR's stage entry, and a per-change PR's ready flip |

The rows cover every command the engine can name as a change's next command: the next command is set only by the
gate walk `Single-voiced canonical-next computation` owns, whose command strings are the review forms above, the
walk, apply and archive. Any other key is not a grant. Granting `review` never grants the external forms, because
those send the change to an outside service and spend money. The `apply` and `archive` keys each grant exactly what
the user's typed invocation of the command authorizes today, so a granted arrival and a typed one write the same
things; each member of what they cover is disposed of here:

| what a granted apply or archive meets | covered by |
|---|---|
| apply: the body's edits (code, `tasks.md`) and its run summary | key `apply` |
| apply: a commit or a push of the applied work | not a write the apply flow makes; granted by no key |
| archive: the baseline sync, the move, the run summary, an at-archive doc edit | key `archive`; the sync assessment takes its marked default (`orbit-conventions`' `A chain treats each prompt by its kind`) |
| archive tail: `stage` and `commit` of the named paths | key `archive` |
| archive tail: `push` to the attachment's branch | key `archive`, named in its row |
| archive tail: `rewrite` of a per-change PR's description, or `append` of a program PR's stage entry | key `archive`, named in its row |
| archive tail: `ready`, on a per-change PR only | key `archive`, named in its row |
| the tail's `human_acts`: the merge, the return to the default branch | never granted by any key; shown, never run |
| an unattached change | no tail runs, so nothing outward is granted |

The tail's steps are the step names `orbit pr tail` composes (`stage`, `commit`, `push`, `append` or `rewrite`,
`ready`) and `human_acts` is its other output; the in-repo writes are the archive flow's sync, move and emit. The
`chain` key is NOT a gate-state input: it enters no gate row, no state, no reason, no position token and no
`next_command` — the ` — user-invoked` marker stays on the rendered next command whatever the setting grants.

#### Scenario: An absent key grants nothing and changes no readout

- **WHEN** `orbit/config.yaml` carries no `chain` key and `orbit status --change <name>` runs
- **THEN** every gate row, the position readout and `next_command` are byte-identical to a run without the capability,
  and the JSON's `chain` object reports `may_run: false`

#### Scenario: Granting review does not grant an external review

- **WHEN** `chain` is `{review: true}` and the engine's next command is `/orbit:review --as system --reviewer blind-pair <change>`
- **THEN** the `chain` object reports `may_run: false` with `why: "not-granted"`

#### Scenario: A key no row names grants nothing

- **WHEN** `chain` is `{merge: true, review: "yes"}` and the next command is `/orbit:archive <change> — user-invoked` or `/orbit:review --as proposal --fresh <change>`
- **THEN** neither is granted: `merge` names no row and `"yes"` is not a boolean

#### Scenario: The apply key grants the marked apply command

- **WHEN** `chain` is `{apply: true}`, no stop record is open, and the next command is `/orbit:apply <change> — user-invoked`
- **THEN** the `chain` object reports `may_run: true`, and the next command still carries the ` — user-invoked` marker

#### Scenario: Granting apply does not grant archive

- **WHEN** `chain` is `{apply: true}` and the next command is `/orbit:archive <change> — user-invoked`
- **THEN** the `chain` object reports `may_run: false` with `why: "not-granted"`
