## ADDED Requirements

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

The rows cover every command the engine can name as a change's next command except `/orbit:apply <change>` and
`/orbit:archive <change>` (each with or without the ` — user-invoked` marker), which no key grants: the next command
is set only by the gate walk `Single-voiced canonical-next computation` owns, whose command strings are the review
forms above, the walk, apply and archive. Any other key is not a grant. Granting `review` never grants the external
forms, because those send the change to an outside service and spend money. The `chain` key is NOT a gate-state
input: it enters no gate row, no state, no reason, no position token and no `next_command`.

#### Scenario: An absent key grants nothing and changes no readout

- **WHEN** `orbit/config.yaml` carries no `chain` key and `orbit status --change <name>` runs
- **THEN** every gate row, the position readout and `next_command` are byte-identical to a run without the capability,
  and the JSON's `chain` object reports `may_run: false`

#### Scenario: Granting review does not grant an external review

- **WHEN** `chain` is `{review: true}` and the engine's next command is `/orbit:review --as system --reviewer blind-pair <change>`
- **THEN** the `chain` object reports `may_run: false` with `why: "not-granted"`

#### Scenario: A key no row names grants nothing

- **WHEN** `chain` is `{apply: true, review: "yes"}` and the next command is `/orbit:apply <change> — user-invoked` or `/orbit:review --as proposal --fresh <change>`
- **THEN** neither is granted: `apply` names no row and `"yes"` is not a boolean

### Requirement: The change status says whether the next command may run unasked

`orbit status --change <name> --json` SHALL carry a top-level `chain` object — `next` (the change's `next_command`, or
`null`), `configured` (whether `orbit/config.yaml` carries a `chain` map), `may_run`, `head`, when `may_run` is false
`why`, and when `why` is `open-stop` `stop` (the trail path of the earliest open stop record) — composed from the gate
computation and the `chain` setting alone. `head` is the latest token among the change trail's run records — its
`<command>-<TS>.json` emits and its `external-<mode>-<TS>.md` returns — leaving out the external launch record
`review-external-<TS>.json`, the `external-prompt-*.md` files and the `decisions/` folder, or `null` when there is none:
a launch that wrote only its launch record and prompt has not moved it. The workflow body runs the next command only
when `may_run` is true and judges no reason of its own, beyond a decision prompt it asked (`orbit-conventions`' `A
chain treats each prompt by its kind`). `may_run` is true exactly when no row below matches; the rows are tested in
order and the first match is `why`:

| `why` | matches when |
|---|---|
| `none` | the engine names no next command |
| `not-granted` | the `chain` setting grants no row covering the next command (`The chain setting grants each command on its own key`) |
| `open-stop` | a stop record in the change's trail `decisions/` folder has no resolution naming any record of its replacement chain |
| `needs-user` | the next command is an external or blind-pair review and `orbit external runner --json` reports no runner or one not reachable, so the external half would go out by paste |
| `no-progress` | the status call carries `--chain-ran <command> --chain-head <token>`, the next command equals `<command>`, and `head` equals `<token>`: the command the chain just ran wrote no run record — an external launch whose runner failed, or whose return `orbit external save` refused, included |

A body that runs a chained command passes the `next` and `head` it read as `--chain-ran` and `--chain-head` on its
next status call; a call without the two flags never matches `no-progress`. A stop record left open stays open until a
resolution names it: when the chain stops on `open-stop`, the body names the `stop` record and puts its question to the
user, and the resolution their answer writes lets the next status read pass that row. The human `orbit status --change` output
renders no part of the object. These reasons are a named limit, not a closed set — Residual kind: a state where the
next command is granted and would run, yet running it unasked is wrong. Residual method: the stage's fixture chain,
and each signal the tripwires stage adds, read as a candidate reason.

#### Scenario: A granted next command may run

- **WHEN** `chain` is `{address-reviews: true}`, a fresh system review left findings, no stop record is open, and the next command is `/orbit:address-reviews <change>`
- **THEN** the `chain` object reports `next: "/orbit:address-reviews <change>"`, `configured: true`, `may_run: true` and no `why`

#### Scenario: An open stop record halts a granted chain

- **WHEN** the same state holds and the change's trail carries a `stop-<TS>.json` that no resolution names
- **THEN** the `chain` object reports `may_run: false` with `why: "open-stop"` and `stop` naming that record's path

#### Scenario: An answered stop lets the chain run again

- **WHEN** the chain stopped on `open-stop`, the user answered the named stop's question, and a resolution naming that
  stop was written
- **THEN** the next status read no longer matches `open-stop`, and `may_run` follows the remaining rows

#### Scenario: A pasted external review needs the user

- **WHEN** `chain` is `{review-external: true}`, the next command is `/orbit:review --as system --reviewer blind-pair <change>`, and no external runner is recorded
- **THEN** the `chain` object reports `may_run: false` with `why: "needs-user"`

#### Scenario: A launch that wrote no run record is not run again

- **WHEN** a body ran `/orbit:review --as system --reviewer external <change>` under a grant, the recorded runner exited
  non-zero so the launch wrote only its prompt and its `review-external-<TS>.json` launch record, and the status call
  passes `--chain-ran` with that command and `--chain-head` with the head it read before running it
- **THEN** `head` is unchanged and the `chain` object reports `may_run: false` with `why: "no-progress"`

#### Scenario: The human readout is unchanged

- **WHEN** `orbit status --change <name>` runs without `--json` under any `chain` setting
- **THEN** its output carries no chain line and is byte-identical to the output with no `chain` key
