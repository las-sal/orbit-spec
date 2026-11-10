## MODIFIED Requirements

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
| `/orbit:bulk-archive` | never named as a next command, so never granted; it runs no tail |

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
