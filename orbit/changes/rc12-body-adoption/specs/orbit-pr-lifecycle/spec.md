## MODIFIED Requirements

### Requirement: Agent-written landmark descriptions at seams only

The PR description SHALL be agent-written narrative — a LANDMARK recording what the effort
achieved, never an engine render and never live telemetry. Refresh points are SEAMS ONLY:
per-change PRs — INTENT at propose (adapted from proposal.md's Why/What), rewritten as
ACHIEVEMENT at the archive tail (outcomes, the review-cycle story, decisions ratified along
the way); program PRs — program intent at birth, then appended stage entries at stage
archives, and NOTHING FURTHER: the accumulated entries ARE the landmark, so there is no
mandatory terminal rewrite. (A whole-program rewrite is OPTIONAL polish an agent performs
only when the user explicitly asks — it is deliberately absent from this SHALL sequence,
because arc-done has no authorized body to perform an outward write.) The PR TITLE is set
ONCE at birth and passed explicitly — `<change-name>: <summary>` for per-change PRs, where
`<summary>` is ONE line the agent writes from proposal.md's Why (the proposal template carries
no title line, so the summary is judgment, written once), and `<doc stem>: <doc title line>`
for program PRs (every architecture doc opens with a `# ` line) — and no seam rewrites it; the program
body at birth is program intent adapted from the doc's opening prose plus its stage list,
by the same discipline as the per-change intent body. A stage-entry append is
READ-APPEND-WRITE (the current body is fetched, the entry appended, the composed whole
written), never a body replacement. No per-emit or
per-gate-transition PR edits. Deterministic claims inside the narrative (gate verdicts, counts, positions) SHALL
be read from the engine's surfaces at authoring time, never hand-invented — the same
standing discipline as every narrative surface.

#### Scenario: Draft window carries intent, archive carries achievement

- **WHEN** a per-change PR opens at propose and the change later archives
- **THEN** the body at open states the change's intent; after the tail it states the
  achievement — and no PR body edit occurred at any intermediate emit or review pass

#### Scenario: A per-change title is written from the Why

- **WHEN** propose opens a per-change PR for a change whose `proposal.md` opens at `## Why`
- **THEN** the title passed to `gh pr create` is `<change-name>: ` followed by one line the agent
  wrote from that Why, and no step looks for a `# ` title line in `proposal.md`

### Requirement: PR actions are workflow-body choreography (zero engine git)

Every git and GitHub WRITE of this capability SHALL live as workflow-body steps in the
generated skill bodies — branch creation, switch, commit, push, `gh pr create/edit/ready` — the
same choreography class as the existing review-handoff commit+push; the orbit
engine SHALL NOT perform a PR-lifecycle write. The title's "zero engine git" names that WRITE
boundary. The engine OBSERVES: `orbit pr` (per `The \`orbit pr\` command observes and prints;
it never writes`) runs the read-only `git` and `gh` invocations that requirement's allowlist
names and PRINTS the writes for the body to run, under the user's own invocation (R-crc-5's
conditional reversal of D-d6-7, effective for the steps `Printed commands are proven by
execution` executes). The engine's total
surface for this capability is the `pr:` config reader, the READ-ONLY `pr` field the reader's
resolved regime is surfaced through on every bare-tier `orbit status --json` shape (per
`orbit-orientation` — the surface the bodies read the regime from, never parsing the config
themselves), the `orbit pr` command group, the optional structured `pr_attachment` object on the PROPOSE and FF emit
payloads, and the optional flat `pr_url`/`pr_state` pass-through fields on the ARCHIVE emit
payload (per `orbit-emit-composition`). The asymmetry is deliberate and is not a naming inconsistency:
propose and ff RESOLVE an attachment and must record its identity as one correlated unit,
while archive resolves nothing — it reports the state it observed at emit time. Because the
engine's write gate is fail-loud on unknown payload keys, this enumeration is normative:
`pr_url` on a propose payload is a REJECTED key, not a tolerated alias.

A body SHALL CONSUME an `orbit pr` record by its fields alone, and SHALL NOT re-derive a step
the record decided: it calls `select` at propose and ff phase 1, `publish` at phase 3,
`preflight` before the archive emit, `tail` after it, and `program` at the architect arc-done
readout, and acts by this table, whose rows cover every shape the record type
(`The \`orbit pr\` command observes and prints; it never writes`) can return:

| the call returns | the body |
|---|---|
| a non-zero exit (a usage error, the only one) | stops the PR layer and reports the error verbatim; the lifecycle continues unattached |
| `action: off` | engages no PR step and writes no note of its own, beyond the unattached line `preflight`'s requirement assigns it |
| `action: skip` | writes ONE line from `reason.code` and `reason.detail`, runs nothing, and continues unattached |
| `action: proceed`, `degraded: null` | runs `segments` in order; before each segment it authors that segment's `inputs`; it runs each step's `argv` exactly, substituting only an element equal to an input token, every element shell-quoted |
| `action: proceed`, `degraded: "pr"` | the same, plus ONE line for the PR-half degradation from `reason` |
| a step fails | stops at that step and writes ONE line naming the completed and the skipped steps by their `step` names; nothing after it runs |
| a segment whose `inputs` name `<emit-path>` | writes the emit between the segments and passes its path |
| `human_acts` non-empty | shows each act's argv verbatim, labelled as the user's own act; never runs one |
| `observations` | reads only what the emit or a note needs; never re-decides a step from it |

The hand-run runbook a body carried before `orbit pr` existed is NOT kept beside the call as a
fallback: a body carrying both would run both.

#### Scenario: A body runs what the record prints

- **WHEN** `orbit pr select` returns `proceed` with one segment carrying `git switch -c <branch> --no-track <remote>/<default>`
- **THEN** the body runs exactly that argv, and runs no branch-existence, collision or tip check of its own

#### Scenario: A human act is shown, never run

- **WHEN** `orbit pr tail` returns `human_acts` carrying the PR merge and the return to the default branch
- **THEN** the archive's closing summary shows each argv verbatim as the user's act, and the body runs none of them

#### Scenario: Engine untouched by PR flows

- **WHEN** the full PR lifecycle runs end-to-end
- **THEN** every git/`gh` WRITE traces to a workflow-body step, and every git/`gh` invocation an
  engine module makes is a read in `orbit pr`'s allowlist or its one bounded `git fetch`

### Requirement: `orbit pr preflight` computes the archive's read-only preflight

`orbit pr preflight <change-name>` SHALL compute the read-only preflight of `orbit-archive-modifications`' `PR-attached archive tail`, before the archive emit. It reads the attachment (the latest attachment-bearing propose or ff emit on the change's trail), notes citation divergence in `observations.citation` (defined below), and decides one OUTCOME from this closed set, reported as `observations.outcome`:

| outcome | when | `action` | emit values |
|---|---|---|---|
| `valid` | the stored URL passes all four predicates | `proceed` | `pr_url`, `pr_state` as observed |
| `closed`, `merged`, `retargeted`, `head-mismatch`, `repository-mismatch` | the stored URL resolves and fails that predicate | `proceed`, `degraded: "pr"` | `pr_url` only |
| `not-found` | `gh pr view` exits non-zero with the recorded "could not resolve" message | `proceed`, `degraded: "pr"` | `pr_url` only |
| `discovered` | no stored URL; the fallback query has exactly one survivor | `proceed` | `pr_url`, `pr_state` |
| `none`, `several` | no stored URL; the query has zero or several survivors | `proceed`, `degraded: "pr"` | none |
| `unobserved` | any other non-zero `gh` exit, or a failed resolution (no remote, several remotes, an unparseable URL, no default branch — the reason code then being the resolution's) | `skip` | none |
| `gh-absent` | no `gh` on PATH | `skip` | none |

CITATION DIVERGENCE is computed, never inferred from a missing field. `observations.citation`
carries `{recorded, current, would_select, diverged}`: `recorded` is the attachment's `doc` (null on
a `per-proposal` attachment), `current` the change's citation now, `would_select`
`{granularity, doc}` the target the CURRENT inputs select, and `diverged` is true exactly when
`would_select` differs from the frozen attachment. The CURRENT inputs select by the predicate
`orbit pr publish` resolves with: a program target of the cited doc when the resolved `pr:`
regime is `per-architecture` and a citation is present, else a per-change target. ONE function
computes it for both subcommands, so the note and the target can never disagree:

| frozen attachment | `would_select` | `diverged` |
|---|---|---|
| `per-architecture`, doc X | `per-architecture`, doc X | false |
| `per-architecture`, doc X | `per-architecture`, doc Y | true |
| `per-architecture`, doc X | `per-proposal` (the citation removed, or the regime no longer `per-architecture`) | true |
| `per-proposal` | `per-proposal` (regime `per-proposal`, `never` or inert, or no citation) | false |
| `per-proposal` | `per-architecture`, any doc | true |

The regime is read ONLY to decide `diverged`: the frozen attachment governs every seam regardless,
per `Config selects the regime; citation selects the target`, and the body writes the one-line note
from `diverged: true`. An unattached change is `off` before any citation is read.

The live validation is one call: `gh pr view --repo <owner>/<repo> <url> --json state,isDraft,headRefName,baseRefName,url`. A failed validation never triggers the fallback query; a stored URL that resolves is ANSWERED, per the owner. On a positive invalidation `reason.detail` carries the failed predicate's `observed` value and, where one exists, the `expected` one (the base a `retargeted to <base>` note names), so the body never invents a fact or observes again. `observations.emit` carries the values the archive emit records. `preflight` prints no segments. An unattached change is `off`, with no reason. The one line noting the unattached state, which `PR entry points`' scenario `new/continue reaches archive unattached` requires, is the body's: it writes that line from `off` together with the `pr` regime it reads from `orbit status --json`.

#### Scenario: A closed PR is answered, not missing

- **WHEN** the stored URL resolves to a closed PR
- **THEN** the outcome is `closed`, `observations.emit` carries `pr_url` and no `pr_state`, and no fallback query runs

#### Scenario: A per-proposal change cited since creation has not diverged

- **WHEN** `preflight` runs under `pr: per-proposal` on a change whose attachment is `per-proposal` and whose `.openspec.yaml` has cited an architecture doc since creation
- **THEN** `observations.citation.diverged` is false and `would_select` is `{granularity: "per-proposal"}`

#### Scenario: A citation that would re-target has diverged

- **WHEN** `preflight` runs under `pr: per-architecture` on a change whose attachment is `per-proposal` (it was uncited at propose) and which now cites a doc
- **THEN** `observations.citation.diverged` is true, `would_select` names `per-architecture` and that doc, and the outcome is decided from the frozen attachment exactly as without the citation

#### Scenario: Not-found and a failed query are told apart

- **WHEN** `gh pr view` exits non-zero, once with the recorded could-not-resolve message and once with an authentication error
- **THEN** the first is `not-found` (`proceed`, degraded, `pr_url` kept) and the second is `unobserved` (`skip`, no emit values)
