## MODIFIED Requirements

### Requirement: Config selects the regime; citation selects the target

The `pr:` value SHALL select the REGIME for the repository, and within `per-architecture`
the change's own metadata SHALL select its TARGET. A change whose `.openspec.yaml` carries an
`architecture: {doc, stage}` citation rides that doc's PROGRAM BRANCH — its commits land
directly on the program branch, it gets no branch of its own, and its PR presence is the
doc's single program PR; a change with no citation takes the `per-proposal` path. Under
`pr: per-proposal` the citation is irrelevant to the PR layer — every change gets its own
branch and PR regardless of what it cites. Branch naming: `<change-name>` for per-proposal
branches; the architecture doc's filename stem for program branches. NEITHER SOURCE
GUARANTEES A VALID GIT REF: change names and architecture doc stems are constrained to be
contained and citable, not to satisfy Git's ref grammar, so a name valid on disk can still be
rejected by Git (a stem ending in `.lock`, a name containing `..`, a trailing dot). The
mechanical name SHALL therefore be validated with `git check-ref-format --branch <name>`
before use, in addition to the default-branch collision check; a name Git rejects is a
DEGRADATION SKIP with a one-line note naming the name and the reason, never a silent
transformation — orbit does not invent a different branch name than the one its own rule
derives.

Granularity is resolved ONCE, at the artifact-creating invocation (propose or ff), and FROZEN
for the change's life: that emit records the resolved ATTACHMENT as the structured
`pr_attachment` object — `{branch, granularity, url?, state?, doc?}`, whose owning definition
is `orbit-run-summary-emit`'s attachment-record requirement — and that record, not a re-read
of the citation, governs every later seam. The object exists precisely so the freeze is
REPRESENTABLE: a later seam that needed the branch or the granularity but could only read a
URL would have to re-derive them from the mutable citation, which is the flip hazard this
rule forbids. A citation added or
removed after propose is a documented NO-OP for the PR layer, surfaced as a one-line note at
the next seam when it would change the target, per `orbit pr preflight`'s divergence table; re-pointing an already-attached change is a manual act. (The same
freeze-at-commitment discipline the predicted Touchpoints map carries, and for the same
reason: a mid-flight granularity flip would leave the tail hunting a program PR that never
existed while the real per-change PR sat forever draft.)

#### Scenario: Cited change rides the program branch

- **WHEN** a change citing `{doc: my-program, stage: s2}` is proposed under
  `pr: per-architecture`
- **THEN** no per-change branch is created; work lands on the `my-program` branch (created
  off the default branch if absent) and no per-change PR is opened — the program PR is the
  change's outward window

#### Scenario: Citation edited after propose is a no-op

- **WHEN** an uncited change (own branch, per-change PR) gains an `architecture:` citation after propose under `pr: per-architecture`
- **THEN** the frozen attachment from the propose (or ff) emit still governs — the archive tail acts on the existing per-change PR and notes the ignored citation in one line; no program PR is sought or opened

#### Scenario: Uncited change gets its own branch

- **WHEN** a change with no `architecture:` citation is proposed under `pr: per-proposal`
- **THEN** propose creates `<change-name>` off the default branch, commits the artifacts,
  pushes, and opens a draft PR `<change-name> → <default-branch>`

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
`preflight` before the archive's move (the change is still active; its record is carried
forward to the archive emit and to `tail --outcome`), `tail` after the move and the emit, and
`program` at the architect arc-done readout, and acts by this table, whose rows cover every shape the record type
(`The \`orbit pr\` command observes and prints; it never writes`) can return:

| the call returns | the body |
|---|---|
| a non-zero exit (a usage error, the only one) | stops the PR layer and reports the error verbatim; the lifecycle continues unattached |
| `action: off` | engages no PR step and writes no note of its own, beyond the unattached line `preflight`'s requirement assigns it |
| `action: skip` | writes ONE line from `reason.code` and `reason.detail`, runs nothing, and continues unattached |
| `action: proceed`, `degraded: null` | runs `segments` in order; before each segment it authors that segment's `inputs`; it runs each step's `argv` exactly, substituting only an element equal to an input token, every element shell-quoted |
| `action: proceed`, `degraded: "pr"` | the same, plus ONE line for the PR-half degradation from `reason` |
| `select` returns `off` or `skip`, exits non-zero, or one of its steps fails | ends the PR layer for this invocation: `publish` is never called, and generation proceeds on the current branch, unattached |
| a step fails | stops at that step and writes ONE line naming the completed, the failed and the skipped steps by their `step` names, showing the failed step's argv and then each skipped step's, verbatim with every input filled, as the recovery the user runs in that order, and stating the consequence for its seam: at propose and ff the change proceeds unattached until that recovery lands; at the archive tail the archive itself has landed and never rolls back, and the PR stays as the completed steps left it; no later PR step runs, and the lifecycle's own steps (the emit among them) still do |
| a segment whose `inputs` name `<emit-path>` | writes the emit between the segments and passes its path |
| `publish`'s first segment ends | composes the emit's `pr_attachment` as `observations.attachment` plus, when the `open` step created a PR, `url` from that step's standard output and `state: "draft"`, or, on adoption, `url` and `state` from `observations.adopted_url` and `observations.adopted_state`; after a PR-half degradation the attachment carries neither, and the second segment does not run; after a failed step the emit is still written, its attachment `observations.attachment` alone, and stays local, the second segment's argv joining the failure line's recovery with both its inputs filled: `<emit-path>` the emit just written, and `<message-file>` a record commit message the body authors before writing the line |
| `tail` is called | passes every path the archive flow edited at its at-archive steps as `--include <path>`, so those edits land in the tail's commit |
| `human_acts` non-empty | shows each act's argv verbatim, labelled as the user's own act; never runs one |
| `observations` | reads only what the emit or a note needs; never re-decides a step from it |

The hand-run runbook a body carried before `orbit pr` existed is NOT kept beside the call as a
fallback: a body carrying both would run both.

#### Scenario: A body runs what the record prints

- **WHEN** `orbit pr select` returns `proceed` with one segment carrying `git switch -c <branch> --no-track <remote>/<default>`
- **THEN** the body runs exactly that argv, and runs no branch-existence, collision or tip check of its own

#### Scenario: A free-text input stays one argument

- **WHEN** the body authors a `<title>` containing a space and a double quote and runs `publish`'s `open` step
- **THEN** `gh pr create` receives the whole title as the one argument after `--title`, unaltered

#### Scenario: A skipped selection ends the PR layer

- **WHEN** `orbit pr select` returns `skip` (for example, reason code `dirty-tree`) at propose
- **THEN** generation proceeds on the current branch, `orbit pr publish` is never called, and the propose emit carries no `pr_attachment`

#### Scenario: A human act is shown, never run

- **WHEN** `orbit pr tail` returns `human_acts` carrying the PR merge and the return to the default branch
- **THEN** the archive's closing summary shows each argv verbatim as the user's act, and the body runs none of them

#### Scenario: Engine untouched by PR flows

- **WHEN** the full PR lifecycle runs end-to-end
- **THEN** every git/`gh` WRITE traces to a workflow-body step, and every git/`gh` invocation an
  engine module makes is a read in `orbit pr`'s allowlist or its one bounded `git fetch`

### Requirement: `orbit pr preflight` computes the archive's read-only preflight

`orbit pr preflight <change-name>` SHALL compute the read-only preflight of `orbit-archive-modifications`' `PR-attached archive tail`, before the archive's move and its emit, while the change is still active: it resolves active changes only, so a call after the move is a usage error. It reads the attachment (the latest attachment-bearing propose or ff emit on the change's trail), notes citation divergence in `observations.citation` (defined below), and decides one OUTCOME from this closed set, reported as `observations.outcome`:

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
computes it for `select`, `publish` and `preflight`, so the target selected, the target
published and the note can never disagree. Under `never` (or an inert value) `select` and
`publish` are `off` before the predicate runs; there its per-change answer is only the divergence
reading, and the note says no PR would be selected now:

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

The live validation is one call: `gh pr view --repo <owner>/<repo> <url> --json state,isDraft,headRefName,baseRefName,url`. A failed validation never triggers the fallback query; a stored URL that resolves is ANSWERED, per the owner. On a positive invalidation `reason.detail` carries the failed predicate's `observed` value (the base a `retargeted to <base>` note names) and, where one exists, the `expected` one (the default branch it should target), so the body never invents a fact or observes again. `observations.emit` carries the values the archive emit records. `preflight` prints no segments. An unattached change is `off`, with no reason. The one line noting the unattached state, which `PR entry points`' scenario `new/continue reaches archive unattached` requires, is the body's: it writes that line from `off` together with the `pr` regime it reads from `orbit status --json`.

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
