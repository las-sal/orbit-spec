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

### Requirement: Config selects the regime; citation selects the target

The `pr:` value SHALL select the REGIME for the repository, and within `per-architecture`
the change's own metadata SHALL select its TARGET. A change whose `.openspec.yaml` carries an
`architecture: {doc, stage}` citation rides that doc's PROGRAM BRANCH — its commits land
directly on the program branch, it gets no branch of its own, and its PR presence is the
doc's single program PR; a change with no citation takes the `per-proposal` path. Under
`pr: per-proposal` the citation is irrelevant to the PR layer — every change gets its own
branch and PR regardless of what it cites. Branch naming: `<change-name>` for per-proposal
branches; the architecture doc's filename stem for program branches.

Granularity is resolved ONCE, at propose, and FROZEN for the change's life: the propose emit
records the resolved ATTACHMENT (branch name, granularity, `pr_url` when a PR opened), and
that record — not a re-read of the citation — governs every later seam. A citation added or
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
- **THEN** the frozen attachment from the propose emit still governs — the archive tail acts on the existing per-change PR and notes the ignored citation in one line; no program PR is sought or opened

#### Scenario: Uncited change gets its own branch

- **WHEN** a change with no `architecture:` citation is proposed under `pr: per-proposal`
- **THEN** propose creates `<change-name>` off the default branch, commits the artifacts,
  pushes, and opens a draft PR `<change-name> → <default-branch>`

### Requirement: PR entry points

The PR choreography SHALL be carried by the ARTIFACT-SET-CREATING commands that complete a
change's canonical artifacts in ONE invocation: `/orbit:propose` and `/orbit:ff` (the
fast-forward path is propose-in-one-breath — same artifacts, same single invocation, same
user intent, and it already shares propose's emit shape). Both carry the identical
choreography, preconditions, degradation, and `pr_url`/`pr_state` emit fields; a change is
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
- **THEN** the branch is created, artifacts committed and pushed, a draft PR opened, and the ff emit carries `pr_url`/`pr_state` — indistinguishable from the propose path

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
ratification are read-only over the PR. Instead, when the architect flow observes arc-done
at a completion ratification, its readout SHALL surface the remaining human acts — naming
the program PR's URL (read from the trail record written at its birth), its current DRAFT
state, and the exact commands (`gh pr ready <n>`, and `gh pr merge <n>` when satisfied) —
recommending, never invoking, per the residual outward-actions rule. A whole-program body
rewrite is OPTIONAL polish available on request, never a required transition step.

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
the way); program PRs — program intent at birth, appended stage entries at stage archives,
the whole-program landmark rewrite at arc-done. No per-emit or per-gate-transition PR
edits. Deterministic claims inside the narrative (gate verdicts, counts, positions) SHALL
be read from the engine's surfaces at authoring time, never hand-invented — the same
standing discipline as every narrative surface.

#### Scenario: Draft window carries intent, archive carries achievement

- **WHEN** a per-change PR opens at propose and the change later archives
- **THEN** the body at open states the change's intent; after the tail it states the
  achievement — and no PR body edit occurred at any intermediate emit or review pass

### Requirement: PR actions are workflow-body choreography (zero engine git)

Every git and GitHub action of this capability SHALL live as workflow-body steps in the
generated skill bodies — branch creation, commit, push, `gh pr create/edit/ready` — the
same choreography class as the existing review-handoff commit+push; the orbit
engine SHALL NOT shell to git or `gh` for any PR-lifecycle purpose. The engine's total
surface for this capability is the `pr:` config reader and the optional `pr_url`/`pr_state`
narrative payload fields on the propose/archive emits (per `orbit-emit-composition`).

#### Scenario: Engine untouched by PR flows

- **WHEN** the full PR lifecycle runs end-to-end
- **THEN** every git/`gh` invocation traces to a workflow-body step, and no engine module
  spawns git or `gh`
