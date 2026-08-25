# orbit-pr-lifecycle Delta

## ADDED Requirements

### Requirement: PR lifecycle config vocabulary

The system SHALL read an OPTIONAL `pr:` key from `orbit/config.yaml` — a SINGLE scalar with
exactly three mutually exclusive values, never a multi-key block (combinations are
inexpressible by construction, so no combination can be undefined):

- **`never`** (also the behavior when `pr:` is absent) — no PR machinery anywhere;
  byte-identical to pre-capability behavior.
- **`per-proposal`** — every change gets its own `<change-name>` branch and its own PR.
- **`per-architecture`** — a change CITING an architecture doc rides that doc's program
  branch under the single-program-PR semantics; a change with NO citation FALLS BACK to
  `per-proposal` behavior (its own branch, its own PR). A standalone change never loses its
  outward window merely because the repo organizes its program work by architecture.

A repo with no git remote or no `gh` CLI SHALL degrade to `never` regardless of
configuration, reported once per invocation as a one-line note, never an error (the
lifecycle itself never blocks on the PR layer). An unrecognized value is inert — treated as
`never` with a one-line warning naming the value — config garnish, never an error source.
A NON-SCALAR shape (a YAML map or list where a scalar is expected — including the two-key
`{open, program-branches}` block this key superseded, which an early adopter may have
written) takes the SAME inert path: treated as `never` with a one-line warning naming the
INVALID SHAPE rather than a value. Garnish never escalates by malformation; a config typo
must not be the thing that stops a lifecycle command from running.

#### Scenario: Unset config is today's behavior

- **WHEN** `orbit/config.yaml` has no `pr:` key and the user runs the full
  propose→archive lifecycle
- **THEN** no branch, PR, or git action is taken or offered by the PR layer anywhere — the
  flow is byte-identical to pre-capability behavior

#### Scenario: Uncited change under per-architecture falls back

- **WHEN** `pr: per-architecture` and a change with NO `architecture:` citation is proposed
- **THEN** it gets its own `<change-name>` branch and its own PR, exactly as under
  `per-proposal` — no program branch is sought and no outward window is skipped

#### Scenario: No remote degrades to never

- **WHEN** `pr: per-proposal` is set but the repository has no git remote
- **THEN** propose proceeds without branch/PR steps, emitting one note naming the
  degradation; nothing errors

#### Scenario: Non-scalar config shape is inert

- **WHEN** `pr:` is written as a YAML map or list (for example the superseded `{open, program-branches}` block)
- **THEN** it is treated as `never` with a one-line warning naming the invalid SHAPE; no lifecycle command errors or blocks

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
the next seam; re-pointing an already-attached change is a manual act. (The same
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

- **WHEN** an uncited change (own branch, per-change PR) gains an `architecture:` citation after propose
- **THEN** the frozen attachment from the propose (or ff) emit still governs — the archive tail acts on the existing per-change PR and notes the ignored citation in one line; no program PR is sought or opened

#### Scenario: Uncited change gets its own branch

- **WHEN** a change with no `architecture:` citation is proposed under `pr: per-proposal`
- **THEN** propose creates `<change-name>` off the default branch, commits the artifacts,
  pushes, and opens a draft PR `<change-name> → <default-branch>`

### Requirement: Remote and default-branch resolution

Both PR seams SHALL resolve the remote and the default branch by ONE shared algorithm
defined here, never by implementer choice and never per-seam. The propose choreography needs
them to create a branch and open a PR; the archive tail needs them to CONSTRAIN its
discovery query (`--repo` and the base filter) and to push. A seam that resolved them
differently would defeat the very constraint the other seam relies on — `gh`'s own implicit
default can select a different repository in a fork or multi-remote checkout, which is
exactly the case `--repo` exists to defend against, and a differently-resolved base makes
discovery find ZERO survivors for a PR that plainly exists.

The REMOTE is resolved before anything else, since branch identity, default base, and the
GitHub repository must all agree: exactly one remote → use it (whatever its name — `origin`
is a convention, not a requirement); multiple remotes → prefer `origin` when present,
otherwise SKIP with a one-line note naming the ambiguity and the candidates (orbit never
guesses which remote owns the PR); zero remotes → the degraded path (`never`). Every
subsequent step at either seam — push target, default-branch resolution, `gh` repository
selection — uses that ONE resolved remote.

Resolving the remote is not enough on its own: `gh` selects a repository by its OWN
heuristics unless told otherwise, so the resolved remote SHALL be converted into a CANONICAL
GITHUB REPOSITORY IDENTIFIER (`<owner>/<repo>`, derived from that remote's URL in either the
HTTPS or SSH form) and that identifier passed EXPLICITLY — `--repo <owner>/<repo>` — on
EVERY `gh` invocation at either seam: `repo view`, `pr list`, `pr create`, `pr view`,
`pr edit`, `pr ready`, and any `pr merge` text. A bare PR NUMBER is likewise
repository-relative and SHALL NOT be used alone; commands surfaced in readouts and recovery
notes carry the full PR URL or the `--repo` flag, so text the user copies resolves the same
repository the algorithm chose. A remote URL that does not parse as a GitHub repository is a
degradation skip with a one-line note, never a guess. Without this the rule defeats itself:
the whole point of resolving a remote is defeated if the commands then ask `gh` to pick.

The DEFAULT BRANCH is resolved as `gh repo view --repo <owner>/<repo> --json
defaultBranchRef` when `gh` is available, falling back to `git symbolic-ref
refs/remotes/<resolved-remote>/HEAD`. When
neither resolves, the PR work at that seam SKIPS with a one-line note naming the failure —
the PR layer degrades, the lifecycle never blocks. At the ARCHIVE seam specifically, an
unresolvable remote or base is a DEGRADATION SKIP, never a zero-result: the tail reports
that it could not resolve, and never reports a missing PR on that basis.

#### Scenario: Every gh command carries the resolved repository

- **WHEN** any seam invokes `gh` in a fork checkout, or in a checkout whose single remote is not named `origin`
- **THEN** the invocation carries `--repo <owner>/<repo>` derived from the RESOLVED remote (or addresses the PR by full URL) — `gh`'s implicit repository selection is never relied on, and recovery/readout text the user copies carries the same qualification; an unparseable remote URL is a degradation skip

#### Scenario: One algorithm, both seams

- **WHEN** propose opens a PR and, later, the archive tail discovers it in a checkout with several remotes and no `origin`
- **THEN** both seams apply the same resolution and both SKIP with the same ambiguity note — the tail never falls back to `gh`'s implicit default, so the repository and base it queries can never disagree with the ones propose used

#### Scenario: Unresolvable base at archive is degradation, not a miss

- **WHEN** the archive tail cannot resolve the default branch (neither `gh repo view` nor `git symbolic-ref` succeeds)
- **THEN** the tail skips with a one-line note naming the resolution failure, and does NOT report that the change's PR is missing

### Requirement: PR entry points

The PR choreography SHALL be carried by the ARTIFACT-SET-CREATING commands that complete a
change's canonical artifacts in ONE invocation: `/orbit:propose` and `/orbit:ff` (the
fast-forward path is propose-in-one-breath — same artifacts, same single invocation, same
user intent, and it already shares propose's emit shape). Both carry the identical
choreography, preconditions, degradation, and `pr_attachment` emit record; a change is
never treated differently for having been started one way rather than the other.

`/orbit:new` and `/orbit:continue` — the step-by-step path — explicitly DO NOT carry the
choreography: artifacts arrive incrementally, so no invocation is the natural branch moment,
and a user stepping through artifacts one at a time is in an exploratory posture where a
premature PR is noise. The ARCHIVE-SIDE CONSEQUENCE is stated rather than left to discovery:
a PR-configured change whose artifacts were built via `new`/`continue` reaches archive
UNATTACHED — the tail's discovery finds no PR, notes it in one line, and skips (it never
opens one at that seam). A user who wants a PR for such a change opens it manually, or
starts the next change with `propose`/`ff`.

#### Scenario: ff behaves exactly like propose

- **WHEN** a change is created with `/orbit:ff` under `pr: per-proposal`
- **THEN** the branch is created, artifacts committed and pushed, a draft PR opened, and the ff emit carries the `pr_attachment` object — indistinguishable from the propose path

#### Scenario: new/continue reaches archive unattached

- **WHEN** a change built via `/orbit:new` + `/orbit:continue` archives under an active `pr:` config
- **THEN** the archive tail's discovery finds no PR, notes the unattached state in one line, and skips the tail — no PR is opened at the archive seam

### Requirement: Program PR (Shape A) semantics

A program branch SHALL have exactly ONE PR — draft `<program-branch> → <default-branch>` —
born when the branch is born, or on the FIRST configured touch of a pre-existing
(mid-flight) program branch. Its body is APPENDED with a stage entry at each citing
change's archive (adapted from the arc status-log entry written at that same seam — the
narrative is written once and published twice); the accumulated entries ARE the program's
landmark, written incrementally, so no terminal rewrite is required. Stage archives NEVER
flip the program PR; per-change PRs are never opened for cited changes (stacked PRs are out).

The program PR's READY flip is a HUMAN ACT — orbit never performs it. ARC-DONE (every
declared stage archived AND the closing architecture review recorded, per R-d-3) is by
construction later than the last stage's archive, so no orbit body is present at the moment
it becomes true: the archive tail runs too early, and the closing review and completion
ratification are read-only over the PR. Instead the readout is OBSERVATION-DRIVEN and
IDEMPOTENT: ANY architect invocation that observes arc-done SHALL surface the remaining
human acts — not only a completion ratification. This matters because arc-done can become
true when no ratifiable stage remains: the natural order final-stage archive → final-stage
ratification → closing architecture review makes the condition true at the LAST step, after
the ratification interaction the baseline architect flow offers for a quiescent unratified
stage has already passed. Tying the readout to that interaction would mean the required
surfacing never appears. Because the readout is idempotent and derived from observed state
(never from a stored "already surfaced" flag), it appears at whichever invocation first
observes arc-done and re-appears on every later one until the PR is no longer draft — which
also makes it safe under either ordering. The DRAFT STATE IS READ LIVE, not from the located
record: `pr_attachment.state` is frozen at propose and is therefore permanently `"draft"` by
construction, so a readout gated on it would keep nagging forever after the human flips
READY. The architect flow resolves the CURRENT state with a READ-ONLY `gh pr view --json
isDraft` query against the located URL — permitted here because it is an observation, not an
outward write, and the zero-engine-git rule constrains the ENGINE, not a body's reads. When
that query fails or `gh` is unavailable, the readout still SURFACES, carrying a one-line
`state unverified` note: an unverifiable state must never silently suppress the one surfacing
the program relies on. The readout names
the program PR's URL — located by scanning the change trails (active AND archived) for
`pr_attachment` objects whose `granularity` is `per-architecture` and whose `doc` MATCHES
this architecture doc, taking the most recent URL-BEARING record (never merely the most
recent match: `url` is deliberately optional after a failed query or failed PR creation, so
a later citing change can emit a `{branch, granularity, doc}` record with no URL, and
most-recent-wins would let that record permanently MASK the still-valid program PR the
program depends on surfacing), then validating it live; when no URL-bearing record exists,
fall back to the constrained query of `Remote and default-branch resolution`'s repository
with `--head <program-branch>`; the `doc` key is what makes this lookup
possible after the birth change has been archived, and what keeps two programs in one repo
distinguishable — its current DRAFT
state, and the exact commands (`gh pr ready <n>`, and `gh pr merge <n>` when satisfied) —
recommending, never invoking, per the residual outward-actions rule. A whole-program body
rewrite is OPTIONAL polish available on request, never a required transition step.

#### Scenario: Arc-done observed with no ratifiable stage remaining

- **WHEN** an architect invocation runs in the ordering final-stage archive → final-stage ratification → closing architecture review, so arc-done becomes true at the LAST step and no stage awaits ratification at the moment it is observed
- **THEN** the readout STILL surfaces the program PR's URL, its live draft state, and the `gh pr ready` / `gh pr merge` commands — this is the ordering a ratification-gated readout would miss entirely, and it is surfaced because the check is unconditional on every invocation

#### Scenario: Arc-done surfaces the human acts, orbit flips nothing

- **WHEN** the architect flow ratifies the final stage complete and `orbit architecture status` plus the architecture trail show every stage archived and the closing review recorded
- **THEN** the readout names the program PR's URL, its DRAFT state, and the `gh pr ready` / `gh pr merge` commands as the user's — and no orbit surface invokes either

#### Scenario: Stage archive appends, never flips

- **WHEN** a citing change archives while other declared stages remain unarchived
- **THEN** the program PR body gains an appended stage entry and remains DRAFT

#### Scenario: Mid-flight adoption

- **WHEN** `pr:` config is first enabled on a repo whose program branch already carries
  archived stages
- **THEN** the first configured touch opens the program PR as draft with its appended
  history starting at the current stage — no retroactive back-fill is required

### Requirement: Generalized READY rule

READY SHALL mean: the branch's governing unit has reached its merge-eligible condition —
for a per-change branch, its change ARCHIVED (gates passed, baseline synced); for a program
branch, ARC-DONE. The flip is `gh pr ready` — a reversible GitHub metadata transition
(Draft → Ready for review) with no merge, push, or code effect. The CONDITION is uniform
across both granularities; WHO performs the flip is not, and deliberately so: a per-change
flip is PERFORMED by the archive tail (it happens constantly, and a body is present at the
exact moment the condition becomes true), while a program flip is SURFACED for the human
(it happens once per program, no body is present when arc-done becomes true, and the user is
standing at the ratification anyway). A change archived via a
recorded `gate_overridden` proceed-anyway SHALL still flip READY — the recorded override IS
the user's ratification, and a draft PR contradicting the user's explicit decision would be
the falser record; the landmark narrative records the override. MERGING IS NEVER an orbit
action in either mode — READY is the terminus for per-change PRs; for program PRs both the
flip and the merge are the human's.

#### Scenario: Override still flips

- **WHEN** the user archives through the gate inflection prompt's Proceed-anyway with
  `gate_overridden` recorded
- **THEN** the tail still flips the PR to READY, and the achievement description names the
  override

#### Scenario: Orbit never merges

- **WHEN** any lifecycle command completes against a READY PR
- **THEN** no `gh pr merge` (or equivalent) is ever invoked by any orbit workflow or engine
  path

### Requirement: Agent-written landmark descriptions at seams only

The PR description SHALL be agent-written narrative — a LANDMARK recording what the effort
achieved, never an engine render and never live telemetry. Refresh points are SEAMS ONLY:
per-change PRs — INTENT at propose (adapted from proposal.md's Why/What), rewritten as
ACHIEVEMENT at the archive tail (outcomes, the review-cycle story, decisions ratified along
the way); program PRs — program intent at birth, then appended stage entries at stage
archives, and NOTHING FURTHER: the accumulated entries ARE the landmark, so there is no
mandatory terminal rewrite. (A whole-program rewrite is OPTIONAL polish an agent performs
only when the user explicitly asks — it is deliberately absent from this SHALL sequence,
because arc-done has no authorized body to perform an outward write.) No per-emit or
per-gate-transition PR edits. Deterministic claims inside the narrative (gate verdicts, counts, positions) SHALL
be read from the engine's surfaces at authoring time, never hand-invented — the same
standing discipline as every narrative surface.

#### Scenario: Draft window carries intent, archive carries achievement

- **WHEN** a per-change PR opens at propose and the change later archives
- **THEN** the body at open states the change's intent; after the tail it states the
  achievement — and no PR body edit occurred at any intermediate emit or review pass

### Requirement: Single-session operating assumption and v1 limits

The PR layer SHALL be specified for orbit's actual operating model — SINGLE USER, SINGLE
SESSION, one user-invoked lifecycle command at a time (every lifecycle command is
user-invoked per `orbit-lifecycle-consent`, and the no-chaining contract forbids the AI from
running a second one unbidden). CONCURRENT operation is therefore an explicit NON-GOAL of
this capability: two changes archiving onto one program branch simultaneously, racing
PR-body appends, and multi-session branch contention are UNDEFINED and unsupported in v1.
The layer SHALL NOT carry serialization, locking, optimistic-retry, or conflict-merge
machinery for them.

What the layer DOES carry instead is honest DETECTION at the one point where a stale view
becomes visible: the remote-tip comparison before reusing a branch (per
`orbit-propose-modifications`' branch preconditions) and the push-rejection degradation on
both the propose choreography and the archive tail. A diverged or rejected state SKIPS with
a one-line note naming it — the user, who is present by construction, resolves it. This is
detection without a protocol: the failure is surfaced, never silently merged or retried.

#### Scenario: Concurrency is out of scope, divergence is still detected

- **WHEN** a program branch's remote tip has moved for any reason (another session, a manual push, a teammate)
- **THEN** the choreography detects the divergence at its remote-tip check and skips with a one-line note; no lock is taken, no retry loop runs, and no automatic merge or rebase is attempted

### Requirement: PR actions are workflow-body choreography (zero engine git)

Every git and GitHub action of this capability SHALL live as workflow-body steps in the
generated skill bodies — branch creation, commit, push, `gh pr create/edit/ready` — the
same choreography class as the existing review-handoff commit+push; the orbit
engine SHALL NOT shell to git or `gh` for any PR-lifecycle purpose. The engine's total
surface for this capability is the `pr:` config reader, the optional structured
`pr_attachment` object on the PROPOSE and FF emit payloads, and the optional flat
`pr_url`/`pr_state` pass-through fields on the ARCHIVE emit payload (per
`orbit-emit-composition`). The asymmetry is deliberate and is not a naming inconsistency:
propose and ff RESOLVE an attachment and must record its identity as one correlated unit,
while archive resolves nothing — it reports the state it observed at emit time. Because the
engine's write gate is fail-loud on unknown payload keys, this enumeration is normative:
`pr_url` on a propose payload is a REJECTED key, not a tolerated alias.

#### Scenario: Engine untouched by PR flows

- **WHEN** the full PR lifecycle runs end-to-end
- **THEN** every git/`gh` invocation traces to a workflow-body step, and no engine module
  spawns git or `gh`
