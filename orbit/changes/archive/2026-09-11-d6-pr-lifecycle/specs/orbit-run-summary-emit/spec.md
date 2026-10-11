# orbit-run-summary-emit Delta

## ADDED Requirements

### Requirement: PR attachment record on the propose and ff emits

The propose AND ff emits SHALL each carry an OPTIONAL structured `pr_attachment` object
recording the PR ATTACHMENT resolved during that invocation (per `orbit-pr-lifecycle`'s
config regimes). The attachment is ONE COMPOSITE FACT — born together at the
artifact-creating invocation, read together at every later seam — so it is recorded as one
object rather than scattered scalars:

| key | required | value |
|---|---|---|
| `branch` | yes | the branch the change's work lands on — `<change-name>` on the per-proposal path, the architecture doc's filename stem on the program path |
| `granularity` | yes | `"per-proposal"` or `"per-architecture"` — the RESOLVED regime for THIS change, not the repo's config value (an uncited change under `per-architecture` records `"per-proposal"`, the path it actually took) |
| `url` | no | the PR's URL; elided when the branch choreography ran but PR creation did not (degraded or failed mid-flight) |
| `state` | no | exactly one of the lowercase strings `"draft"` or `"ready"` AS OBSERVED at emit time; elided when no PR exists or the state cannot be observed |
| `doc` | conditional | the architecture doc's name — REQUIRED when `granularity` is `"per-architecture"`, absent otherwise; without it a program PR cannot be correlated to its program once the birth change is archived, and a repo running two programs has two indistinguishable URLs |

The WHOLE object is ELIDED when no branch or PR work occurred at all (`pr: never`, a
degraded no-remote/no-`gh` repo, or a choreography skipped by a precondition) — an absent
object is the honest record of "no attachment at this seam", never a null placeholder or an
empty shell. When the choreography ran but PR creation failed, the object IS present with
`branch` and `granularity` (AND `doc` when the granularity is `"per-architecture"` — the
conditional key is required by the write gate whatever the PR outcome, so a program-path
record omitting it is REJECTED and no emit is written at all) and no `url`/`state`, because
the branch attachment is real even
when the PR is not.

The object is NARRATIVE pass-through in its VALUES: the emitting body observes and supplies
them, and the engine neither computes nor verifies them (it cannot — the branch state and the
PR live outside the records the engine reads). Its STRUCTURE is a different matter and IS
engine-validated at the write gate, because this object is the AUTHORITATIVE record later
bodies dereference: an emit carrying `{granularty: ...}`, a missing `branch`, a `state`
outside the two-value enum, or `granularity: "per-architecture"` with no `doc` would sail
through a seam advertised as FAIL-LOUD and then be read back at archive as truth. The gate
SHALL therefore reject, by the same unknown-key/mistyped-field mechanism it already applies
to the payload's top level: an unrecognized nested key; a missing required `branch` or
`granularity`; a non-string value for any of `branch`/`url`/`state`/`doc`; a `granularity`
outside `{"per-proposal", "per-architecture"}`; a `state` outside `{"draft", "ready"}`; and
`doc` absent when `granularity` is `"per-architecture"` or present when it is
`"per-proposal"`. Structure only — whether the branch exists, whether the URL resolves, and
whether the PR is open remain BODY-owned observations the engine never second-guesses.
The archive emit's flat `pr_url`/`pr_state` fields are type- and enum-checked on the same
basis. It is the AUTHORITATIVE ATTACHMENT RECORD: the archive tail reads
it back to discover which PR to act on and which granularity governs (per
`orbit-archive-modifications`), and it is what FREEZES the change's granularity for its life
(per `orbit-pr-lifecycle`) — later seams consult this record, never a fresh read of the
mutable `architecture:` citation.


#### Scenario: Malformed attachment structure is rejected at the gate

- **WHEN** a propose payload carries `pr_attachment` with a misspelled key (`granularty`), a missing `branch`, a non-string `url`, a `state` outside `draft`/`ready`, or `granularity: "per-architecture"` without `doc`
- **THEN** the write gate REJECTS the emit naming the offending nested field — the object never reaches the trail as an authoritative record — while a structurally valid object whose branch or PR later proves stale is written unchallenged (existence is body-owned, structure is not)

#### Scenario: Propose or ff emit records the PR it opened

- **WHEN** propose — or `/orbit:ff`, which carries the identical choreography — opens a draft PR under `pr: per-proposal`
- **THEN** that command's emit carries `pr_attachment: {branch: "<change-name>", granularity: "per-proposal", url: "<url>", state: "draft"}` with no `doc` key, and the archive tail later reads that object to find both the PR and the governing granularity

#### Scenario: Program attachment carries its doc

- **WHEN** a change citing `{doc: my-program, stage: s2}` is proposed under `pr: per-architecture`
- **THEN** the emit carries `pr_attachment: {branch: "my-program", granularity: "per-architecture", doc: "my-program", url: "<program PR url>", state: "draft"}` — so the architect readout can identify WHICH program's PR this is even after the change is archived, and a repo running two programs never confuses them

#### Scenario: No attachment means no object

- **WHEN** propose or ff runs under `pr: never`, in a repo with no remote, or after a precondition skipped the choreography entirely
- **THEN** `pr_attachment` is elided from the emit — never present-and-null, never an empty object

#### Scenario: Branch without a PR still records the attachment

- **WHEN** the branch is created and pushed but `gh pr create` fails mid-flight
- **THEN** `pr_attachment` is present with `branch` and `granularity` (and `doc` when the granularity is `per-architecture` — the conditional key is gate-required whatever the PR outcome) and WITHOUT `url`/`state` — the branch attachment is real even though the PR is not
