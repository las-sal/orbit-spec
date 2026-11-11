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

### Requirement: Gate declaration in schema YAML

The schema YAML SHALL accept an optional `gates:` list. Each gate declares: `id` (unique among
gates and artifacts), `kind` (`tracked` | `reviewed` — a CLOSED set; any other value fails schema
validation), `requires` (artifact and/or gate ids that must be complete/passed before the gate is
runnable), and per-kind fields — `tracks` (checkbox file, `tracked` kind), `inputs` (freshness
scope: artifact ids whose change invalidates a pass; `reviewed` kind; defaults to `requires`),
`cadence` (ordered slot list, `reviewed` kind — see the cadence-entry vocabulary below), `confirm`
(a CLOSED set, `reviewed` kind: `no-new-findings` | `findings-resolved`; defaults to
`no-new-findings`. ACCEPTED BUT INERT — the clause it selected is retired, and the field remains
only so existing schemas stay valid without a version bump), `budget`
(optional positive integer, `reviewed` kind — the DECLARED EXPECTATION per the review-budget
requirement; absent means NO EXPECTATION IS DECLARED — never "unbounded", which would imply the
present form bounds something), `before`
(the target this gate blocks — see legal `before:` targets below), optional `consent` (see the
consent vocabulary below), and optional `instruction`.
There is NO generic pass-condition plugin mechanism — the two kinds are the extension surface.

**Cadence-entry vocabulary** (defined once here; referenced by clause (a) of the reviewed-gate
pass condition and by `spec-driven`): each `cadence` entry is one of the three reviewer classes
`in-context` | `fresh` | `external`, the meta-class `independent` (satisfied by a `fresh` OR an
`external` pass; never `in-context`), OR the compound slot `blind-pair` (satisfied by TWO passes
of DISTINCT independent classes read blind of each other — see the blind-pair rule in clause (a)),
OR `invoked` (satisfied by what the user INVOKED: a single independent pass that is not a pair member,
or a complete pair — per `The first review slot covers what the user invoked`).
`independent`, `blind-pair` and `invoked` are cadence-only tokens — none is a value the
`reviewer_class` emit field ever carries.

**Legal `before:` targets**: a declared gate id, a declared artifact id, OR a lifecycle-phase token
from the enumerated set {`apply`, `archive`}. `apply` is modeled by the engine as a phase
(`orbit instructions apply` returns its gate state); `archive` is a lifecycle phase the CLI does
NOT model as an `instructions` target — a gate with `before: archive` is queried through the
archive workflow's gate surface (`orbit status --change <name> --json`, which carries `gates[]` and
`next_command`), never through `orbit instructions archive`.

**Consent vocabulary** (D-arc Stage D1, per `orbit-lifecycle-consent`): `consent` is an optional gate
attribute with the single legal value `user-invoked` (a CLOSED set of one for v1; any other value
fails schema validation). It declares that entry into the gate's `before:` phase requires an
explicit user invocation, or a grant by the project's `chain` setting (per `orbit-lifecycle-consent`'s
`Invocation-provenance rule`) — the engine PARSES and SURFACES the marker (in `gates[]` JSON and the
readouts per the single-voiced requirement below); the consuming workflow bodies implement the
consent prompt per `orbit-lifecycle-consent`'s provenance rule. The attribute changes NO gate
pass-condition computation — consent is orthogonal to gate state (a gate can be `passed` while
its phase still awaits the user's invocation or grant). `spec-driven` sets `consent: user-invoked` on
`review-proposal` (before: apply) and `review-system` (before: archive).

#### Scenario: Valid gates list parses

- **WHEN** a schema YAML declares `gates:` entries with valid ids, kinds, and references
- **THEN** `parseSchema` accepts it; gate ids participate in the same duplicate/reference/cycle
  validation as artifact ids

#### Scenario: Unknown kind rejected

- **WHEN** a schema YAML declares a gate with `kind: scored` (or any value outside the closed set)
- **THEN** schema validation fails with an error naming the gate id and the allowed kinds

#### Scenario: Unknown cadence entry rejected

- **WHEN** a schema YAML declares a cadence slot outside the six-token vocabulary
- **THEN** schema validation fails naming the gate id and the allowed entries

#### Scenario: Non-positive budget rejected

- **WHEN** a reviewed gate declares `budget: 0` or a negative or fractional value
- **THEN** schema validation fails naming the gate id and the required positive integer

#### Scenario: Consent attribute parses, surfaces, and rejects unknown values

- **WHEN** a schema YAML declares `consent: user-invoked` on a gate
- **THEN** `parseSchema` accepts it and `orbit status --change <name> --json` carries the marker on that gate's
  `gates[]` entry; a schema declaring any other consent value fails validation naming the gate id
  and the single legal value

#### Scenario: Consent does not alter gate computation

- **WHEN** a gate with `consent: user-invoked` meets its pass condition
- **THEN** its computed state is `passed` exactly as without the attribute — eligibility and
  consent are independent axes

#### Scenario: The invoked token parses

- **WHEN** a schema YAML declares a reviewed gate with `cadence: [invoked, in-context]`
- **THEN** `parseSchema` accepts it
