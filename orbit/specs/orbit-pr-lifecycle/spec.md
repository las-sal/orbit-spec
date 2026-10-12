# orbit-pr-lifecycle Specification

## Purpose

The pull request as a DESIGNED lifecycle step (D-arc Stage D6): a config-selected regime (`pr:` vocabulary in `orbit/config.yaml`) decides whether a change carries a PR at all, and the architecture citation on the change decides which PR it targets — a per-change PR or a program PR (Shape A) shared by every stage of one arc. The draft PR opens at propose (config-gated, branch preconditions checked), the archive tail flips it READY under the generalized READY rule, and agent-written landmark descriptions land at the seams only. Remote and default-branch resolution is ONE shared algorithm across both seams, skipping with a one-line note rather than guessing; the single-session operating assumption names the v1 limits (detection, never locking). Every PR WRITE is workflow-body choreography over git and `gh` — the engine performs no git or GitHub write: `orbit pr` observes (read-only git and `gh` queries and one bounded fetch) and prints the writes for the body to run — and the residual outward actions (merge, release, external-tracker issues) stay the human's.
## Requirements
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

RESOLUTION ORDER IS CONFIG FIRST, AVAILABILITY SECOND, and the two must not be conflated.
When `pr:` is absent, `never`, or an inert unrecognized value/shape, the PR layer returns
IMMEDIATELY: it probes NOTHING (no remote enumeration, no `gh` invocation) and emits NO
availability note, so behavior is BYTE-IDENTICAL to pre-capability — the promise `never`
makes is silence, and a degradation note about tooling the user disabled would break it.
ONLY when a recognized ACTIVE mode (`per-proposal` or `per-architecture`) is selected does
availability resolution run; a repo with no git remote or no `gh` CLI then degrades to
`never` behavior for that invocation, reported once as a one-line note, never an error (the
lifecycle itself never blocks on the PR layer). The inert-value and invalid-shape warnings
are independent of availability and fire on their own: they name a config problem, are
emitted without probing anything, and are never suppressed or duplicated by a degradation
note that will not run. An unrecognized value is inert — treated as
`never` with a one-line warning naming the value — config garnish, never an error source.
A NON-SCALAR shape (a YAML map or list where a scalar is expected — including the two-key
`{open, program-branches}` block this key superseded, which an early adopter may have
written) takes the SAME inert path: treated as `never` with a one-line warning naming the
INVALID SHAPE rather than a value. A PRESENT-BUT-EMPTY key (`pr:` with no value, which
parses as null) is NOT the absent case: it takes the same inert path with a one-line warning
naming the key as empty — only a genuinely ABSENT key is silent, so the closed set carries no
undocumented exception and a half-finished edit is caught rather than silently disabling
every PR seam. Garnish never escalates by malformation; a config typo
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

#### Scenario: Disabled mode probes nothing and says nothing

- **WHEN** `pr:` is absent or `never` in a repository that also has no remote and no `gh`
- **THEN** the PR layer returns without enumerating remotes or invoking `gh`, and emits NO availability note — byte-identical to pre-capability; the availability note exists only for an ACTIVE mode that could not proceed

#### Scenario: Present-but-empty config key warns

- **WHEN** `orbit/config.yaml` contains `pr:` with no value
- **THEN** it is treated as `never` with a one-line warning naming the key as empty; no lifecycle command errors or blocks, and an absent key remains silent

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
HTTPS or SSH form) and that identifier passed EXPLICITLY on EVERY `gh` invocation at either
seam, IN THE GRAMMAR EACH COMMAND ACCEPTS: the `gh pr` verbs (`pr list`, `pr create`,
`pr view`, `pr edit`, `pr ready`, and any `pr merge` text) take `--repo <owner>/<repo>`;
`gh repo view` takes the repository POSITIONALLY (`gh repo view <owner>/<repo>`) and has no
`--repo` flag. The selector-taking verbs (`pr view`, `pr edit`, `pr ready`, `pr merge`)
additionally carry the PR's identity — its full URL, or its number alongside `--repo` — since
`--repo` without a selector is rejected by the CLI before any request. A bare PR NUMBER is
likewise repository-relative and SHALL NOT be used alone; commands surfaced in readouts and
recovery notes carry the full PR URL or the `--repo` flag, so text the user copies resolves
the same repository the algorithm chose. A remote URL that does not parse as a GitHub repository is a
degradation skip with a one-line note, never a guess. Without this the rule defeats itself:
the whole point of resolving a remote is defeated if the commands then ask `gh` to pick.

The DEFAULT BRANCH is resolved as `gh repo view <owner>/<repo> --json
defaultBranchRef` when `gh` is available (the repository is POSITIONAL on this command —
`gh repo view` has no `--repo` flag and rejects one; repository qualification is
command-specific: `--repo` on the `gh pr` verbs, positional on `gh repo view`), falling back
to `git symbolic-ref refs/remotes/<resolved-remote>/HEAD`. When
neither resolves, the PR work at that seam SKIPS with a one-line note naming the failure —
the PR layer degrades, the lifecycle never blocks. At the ARCHIVE seam specifically, an
unresolvable remote or base is a DEGRADATION SKIP, never a zero-result: the tail reports
that it could not resolve, and never reports a missing PR on that basis.

#### Scenario: Every gh command carries the resolved repository

- **WHEN** any seam invokes `gh` in a fork checkout, or in a checkout whose single remote is not named `origin`
- **THEN** the invocation names the repository derived from the RESOLVED remote in the grammar that command accepts — `--repo <owner>/<repo>` on the `gh pr` verbs (with the PR's URL or number where the verb takes a selector), the positional `<owner>/<repo>` on `gh repo view` — so `gh`'s implicit repository selection is never relied on, and recovery/readout text the user copies carries the same qualification; an unparseable remote URL is a degradation skip

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
UNATTACHED, and the tail's PR path TERMINATES before any remote or `gh` work — absence is
TERMINAL, so no discovery query runs at all and nothing is committed, pushed, or flipped
(per `orbit-archive-modifications`). The seam never opens a PR either. A user who wants a PR
for such a change opens it manually, or starts the next change with `propose`/`ff`.

#### Scenario: ff behaves exactly like propose

- **WHEN** a change is created with `/orbit:ff` under `pr: per-proposal`
- **THEN** the branch is created, artifacts committed and pushed, a draft PR opened, and the ff emit carries the `pr_attachment` object — indistinguishable from the propose path

#### Scenario: new/continue reaches archive unattached

- **WHEN** a change built via `/orbit:new` + `/orbit:continue` archives under an active `pr:` config
- **THEN** the archive tail's PR path terminates before any remote or `gh` work — no discovery query runs — and one line notes the unattached state; nothing is committed, pushed, or flipped, and no PR is opened at the archive seam

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
record: `pr_attachment.state` is a POINT-IN-TIME OBSERVATION recorded at the attaching invocation
and never updated afterward, so it goes stale the moment anything touches the PR — whatever
its initial value was. (It is USUALLY `"draft"`, but not necessarily: an ADOPTED program PR
can be recorded already `"ready"`, which is why the schema admits both.) A readout gated on
the recorded value would therefore either nag forever after the human flips READY, or fall
silent against a PR that has since been reopened as a draft. The architect flow resolves the CURRENT state with a READ-ONLY `gh pr view --json
isDraft` query against the located URL — permitted here because it is an observation, not an
outward write, and the zero-engine-git rule constrains the ENGINE, not a body's reads. Validation has THREE outcomes here, and the readout is NEVER SUPPRESSED by any of them —
that invariant matters more than which one obtains, because arc-done is surfaced once per
program and a silent readout is indistinguishable from a program that is not finished:

- **Valid** — surface the PR, its live draft state, and the commands.
- **Query FAILED** (auth, network, `gh` unavailable) — surface anyway with a one-line
  `state unverified` note. Nothing is known, so nothing is claimed.
- **Positively INVALID** (the query succeeded and reports the recorded PR closed, merged,
  retargeted to another base, or belonging to a different repository) — FALL THROUGH to the
  SAME four-axis constrained query the archive tail uses (per
  `orbit-archive-modifications`' discovery rule — resolved repository, `--head
  <program-branch>`, `--state open`, base filtered to the resolved default branch), and
  surface whatever it finds. Its three outcomes are all REPORTED, never suppressed: exactly
  one survivor → surface it; ZERO → surface the readout stating the recorded PR is closed or
  merged and NO open replacement exists, so the human learns the program has no open PR
  rather than being handed a dead link; MORE THAN ONE → surface the readout naming ALL
  candidates. Listing candidates is correct HERE precisely because this seam only reports —
  the tail's ambiguity skip exists to avoid writing to the wrong PR, and there is no write
  to misdirect.

The fall-through is deliberately the OPPOSITE of the archive tail's rule, where a positively
invalid record is ANSWERED rather than retried. The seams differ in risk, not in vocabulary:
the tail WRITES, so a second chance there could rewrite and flip the wrong pull request,
while this readout only REPORTS — the worst a fall-through can do is name a better URL. The readout names
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

#### Scenario: A closed recorded PR falls through to the query, never suppressing the readout

- **WHEN** the arc-done readout validates the most recent URL-bearing record and finds that PR closed, merged, retargeted, or in another repository
- **THEN** it falls through to the constrained `--head <program-branch>` query and surfaces whatever that finds; if nothing is open, it still surfaces — stating the recorded PR is closed or merged and no open replacement exists — because the readout is never suppressed by a validation outcome

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
recorded proceed-anyway override at the `review-system` gate SHALL still flip READY — the
recorded override IS
the user's ratification, and a draft PR contradicting the user's explicit decision would be
the falser record; the landmark narrative records the override. MERGING IS NEVER an orbit
action in either mode — READY is the terminus for per-change PRs; for program PRs both the
flip and the merge are the human's.

#### Scenario: Override still flips

- **WHEN** the user archives through the gate inflection prompt's Proceed-anyway with
  the override recorded
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
| `select` returns `off` or `skip`, exits non-zero, or one of its steps fails | ends the PR layer for this invocation: `publish` is never called, and generation proceeds on the current branch, unattached; a failed step is named in ONE line with no recovery shown, since running it would attach nothing |
| a `publish` or `tail` step fails | stops at that step and writes ONE line naming the completed, the failed and the skipped steps by their `step` names, showing the failed step's argv and then each skipped step's, verbatim with every input filled, as the recovery the user runs in that order, and stating the consequence for its seam: at propose and ff the change proceeds unattached until that recovery lands; at the archive tail the archive itself has landed and never rolls back, and the PR stays as the completed steps left it; no later PR step runs, and the lifecycle's own steps (the emit among them) still do |
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

### Requirement: Test instruments derive from a recorded real-CLI contract

The test instruments that stand in for the GitHub CLI SHALL derive from ONE recorded contract captured from the real binary — `test/integration/pr-lifecycle/gh-contract.json`, carrying per command the usage's positional shape, the accepted flag set, the empirically recorded error rules a help page cannot express (that `gh repo view` rejects `--repo` with `unknown flag: --repo`; that a selector-taking `gh pr` verb given `--repo` without a selector exits with `argument required when using the --repo flag`; and the message `gh pr view` gives for a pull request that does not exist, which `orbit pr` keys `not-found` on), and the `gh` version the capture ran against. The harness stub SHALL validate every invocation against that contract and reject in both directions — a flag the real CLI rejects, with the real message; a `gh pr` verb without the `--repo` qualification the shared resolution requires — while returning its scripted responses unchanged on success, and returning the recorded not-found message when a case scripts a missing pull request. The snippet sweep over every `gh` snippet on the generated surface — SKILL.md bodies as well as references — is `orbit-cli-grammar`'s `Every \`git\` and \`gh\` snippet on the generated surface validates against its tool's recorded contract`, which extracts through the shared extractor and validates through the SAME validator the stub loads, recognizing placeholders as positionals and proving grammar only (execution is a separate instrument). The contract's command set is exactly the commands the generated surface invokes plus the availability probe; a verb the contract does not know is a sweep failure. Re-capture is a DELIBERATE act (`npm run capture:gh`, reviewed as a diff); the suite SHALL never shell to a real `gh`. A remembered grammar — hand-written stub branches or sweep regexes beside the contract — is the defect this requirement retires.

#### Scenario: The stub rejects what the real CLI rejects, with the real message

- **WHEN** a harness case invokes the stub as `gh repo view --repo acme/widget --json defaultBranchRef`
- **THEN** the stub exits non-zero with `unknown flag: --repo` on stderr, exactly as the recorded contract states, and `gh repo view acme/widget --json defaultBranchRef` succeeds with the scripted response

#### Scenario: The selector rule is enforced from the contract

- **WHEN** a harness case invokes the stub as `gh pr view --repo acme/widget --json isDraft` with no URL or number
- **THEN** the stub exits non-zero with `argument required when using the --repo flag`, and the same invocation carrying `<url>` succeeds

#### Scenario: The sweep and the stub cannot disagree

- **WHEN** a `gh` snippet in a reference or a SKILL.md body is changed to a form the contract rejects (a flag the CLI does not accept on that verb, or a selector-taking verb without its selector)
- **THEN** the snippet sweep fails naming the surface, the line, the snippet and the contract rule, through the same validator module the stub loads

#### Scenario: Re-capture is deliberate and the suite needs no real gh

- **WHEN** the full suite runs on a machine with no `gh` installed
- **THEN** every contract-derived case passes from the checked-in file, the freshness test asserts only that the file parses and records a version, and no test process spawns a real `gh`; updating the contract requires running the capture script and committing the diff

#### Scenario: A missing pull request answers with the recorded message

- **WHEN** a harness case scripts a missing pull request and invokes the stub as `gh pr view --repo acme/widget <url> --json state`
- **THEN** the stub exits non-zero with the not-found message the contract records, which the capture observed from the real CLI

### Requirement: The `orbit pr` command observes and prints; it never writes

The engine SHALL provide one command group, `orbit pr`, whose subcommands compute the DETERMINISTIC steps of this capability's choreography and PRINT the writes, never performing one. Each subcommand runs only the read-only invocations in the table below and prints one RECORD. The writes (branch creation, switch, commit, push, `gh pr create`, `gh pr edit`, `gh pr ready`) appear in it as argument vectors that the workflow body runs under the user's own invocation:

| tool | invocations a subcommand MAY run |
|---|---|
| `git` | `remote`, `remote get-url`, `config --get remote.<r>.url`, `rev-parse`, `symbolic-ref <ref>` (one ref; no flag but `-q` / `--short`, so never `--delete`), `check-ref-format`, `status --porcelain`, `ls-remote --heads <resolved-remote> <ref>…` (refs only, no flag after the remote), `fetch --no-tags --refmap= <resolved-remote> +refs/heads/<x>:refs/remotes/<resolved-remote>/<x>…`, `merge-base`, `rev-list`, `diff --name-only` / `diff --quiet` (never `--output`), `ls-files`, `ls-tree`, `branch --show-current` |
| `gh` | `repo view <owner>/<repo>`, `pr view`, `pr list` |

The canonical `<owner>/<repo>` derives from the remote's CONFIGURED URL, read by `config --get remote.<r>.url`, never from `remote get-url`, which expands `url.<base>.insteadOf` rewrites and would return the rewritten target. `gh` AVAILABILITY is a PATH lookup, never an invocation. Every invocation runs with `GIT_OPTIONAL_LOCKS=0`, so `status` refreshes no index. The fetch is the ONE ref-store update a subcommand performs, in exactly the form above. `ls-remote` first decides which of the two refs exist, and only those are fetched, each with an explicit refspec and an empty `--refmap=`, so a configured `remote.<name>.fetch` refspec cannot redirect it and no tag is fetched. The empty refmap is load-bearing: without it git ALSO applies the configured refspec to the fetched refs (its opportunistic remote-tracking update), so a `refs/heads/` mapping would write local branches. Named limit: fetch side effects are BOUNDED. Residual kind: a fetch side effect configured outside the refspec and tag settings (e.g. `fetch.prune`, hooks, `remote.<r>.mirror`). Residual method: a test per configuration key, added when a run log names one; the shim records the exact argv so a changed form is visible.

The record has the same fields as JSON with `--json` and as text otherwise:

| field | what it carries |
|---|---|
| `subcommand` | the subcommand's name |
| `action` | `off`, `skip` or `proceed`, per the table below |
| `reason` | `{code, detail}` on a `skip` or a PR-half degradation, else `null`. `code` is from the subcommand's closed set and `detail` carries the facts a note needs. The engine writes no note: the body renders the one-line note from the code and detail |
| `degraded` | `"pr"` on a `proceed` whose PR half is removed while the subcommand's own writes stand, else `null` |
| `observations` | the resolution (`{remote, repo, default_branch, gh}`, `gh` being `present` or `absent`) and the subcommand's facts, including any read a later step consumes |
| `segments` | ordered `{inputs, steps}`. `steps` are `{step, argv}` the body runs in order. `inputs` names the files the body authors before that segment runs, from the CLOSED set `<message-file>`, `<title>`, `<body-file>`, `<emit-path>`, each written as an exact argv element. A segment ends wherever a later step consumes something the body authors from an earlier step's result |
| `human_acts` | `{act, argv}` the user performs. They are never run by the body, and never by a test |

| action | when | `reason` | `segments` |
|---|---|---|---|
| `off` | the gate is closed: for `select` and `publish` the resolved `pr:` regime is `never`, for `preflight` and `tail` no attachment resolves | `null`, and NO `git` or `gh` invocation ran | none |
| `skip` | a whole-seam precondition or degradation, as the rule's owner states it | its code | none |
| `proceed` | the seam's own writes go ahead; `degraded: "pr"` when only the PR half fell | its code when degraded, else `null` | the writes, the PR steps omitted when degraded |

A subcommand exits 0 whatever its action, because the PR layer degrades and never blocks the lifecycle. It exits non-zero only on a usage error. A skip an owner precondition decides is the engine's to decide, and only the note's wording is the body's. That narrows R-crc-5's "degradation notes, when to skip": "when to skip" stays judgment only where no owner rule decides it.

Named limit: the deterministic step set is BOUNDED. Residual kind: a step the runbook is silent on, so no row names it (tracking at creation, the post-merge return were two). Residual method: the dogfood log's rows classed "wrong (silent)", and every later live run's log classified the same way.

#### Scenario: A closed gate probes nothing

- **WHEN** `orbit pr select <name> --json` runs where `pr:` resolves to `never`
- **THEN** it prints `action: "off"` with `reason: null`, no segments and no human acts, exits 0, and the invocation record shows no `git` or `gh` call

#### Scenario: An absent gh is its own fact

- **WHEN** `select`, `publish`, `preflight` or `tail` runs past its gate with no `gh` on PATH
- **THEN** it prints `action: "skip"` with `observations.resolution.gh: "absent"` and reason code `gh-absent`, never the code for a failed query

#### Scenario: Writes are printed, never run

- **WHEN** `orbit pr select <name>` decides `proceed` on a branch absent locally and on the remote
- **THEN** the branch does not exist after the command returns, HEAD is unchanged, and `segments` carries the `git switch` argv that would create it

#### Scenario: A configured fetch refspec cannot move a local branch

- **WHEN** the resolved remote carries `remote.<name>.fetch` mapping into `refs/heads/` and the remote has tags
- **THEN** after `select` returns, no local branch and no tag has moved, and only `refs/remotes/<name>/<default>` and `refs/remotes/<name>/<branch>` (where they exist) were updated

### Requirement: `orbit pr select` computes propose's branch selection

`orbit pr select <name>` SHALL compute Phase 1 of `orbit-propose-modifications`' `PR choreography at propose (config-gated)` for propose and ff, BEFORE any change directory exists. It covers the remote and default branch by this capability's `Remote and default-branch resolution`, and every precondition by `orbit-propose-modifications`' `Branch preconditions at propose`, in that requirement's order. Each precondition that skips gives its own reason code. The gate reads the regime from the same reader `orbit status --json` surfaces as `pr`. Its inputs resolve as this table states:

| `<name>` resolves to | consume mode | citation read from |
|---|---|---|
| `orbit/explore/<name>/` exists | yes: the generation-input guard reads that directory | its `.openspec.yaml` `architecture:` block |
| no staging directory, an active change of that name | no | the change's `.openspec.yaml` |
| neither | no (standalone) | none: uncited |
| a name the change-name rule rejects | the one usage error | — |

The branch name is the name itself, or the cited doc's filename stem when the citation is present under `per-architecture`. On `proceed`, `observations` carries `branch`, `granularity`, and `branch_state`, one of `absent`, `local`, `remote-only` or `fast-forward`, plus `ahead_by` on the program path. `segments` holds one segment with no inputs, carrying the switch for that state:

| `branch_state` | steps |
|---|---|
| `absent` | `git switch -c <branch> --no-track <resolved-remote>/<default>` |
| `local` | `git switch <branch>` |
| `remote-only` | `git switch -c <branch> --track <resolved-remote>/<branch>` |
| `fast-forward` | `git switch <branch>`, then `git merge --ff-only <resolved-remote>/<branch>` |

`--no-track` on creation is deliberate: a branch created from the default ref would otherwise track the default branch, a setting the runbook never mentioned and the publish push replaces. Closure: DERIVED from the existence and remote-ahead preconditions' four outcomes that proceed.

#### Scenario: A branch absent everywhere is created off the remote default, untracked

- **WHEN** `select` runs for a name whose branch exists neither locally nor on the resolved remote, with the local default ref stale
- **THEN** `branch_state` is `absent` and the printed step bases the branch on `<resolved-remote>/<default>` with `--no-track`

#### Scenario: A staging-only cited exploration selects the program branch

- **WHEN** `select` runs under `per-architecture` for a name with only `orbit/explore/<name>/`, whose metadata cites a doc
- **THEN** the branch is the doc's filename stem, and the generation-input guard runs against that staging directory

#### Scenario: A diverged branch is a skip

- **WHEN** the branch exists locally and on the remote and neither tip contains the other
- **THEN** `select` prints `action: "skip"` with reason code `diverged` and no segments

### Requirement: `orbit pr publish` computes propose's outward phase

`orbit pr publish <change-name>` SHALL compute Phase 3 of `orbit-propose-modifications`' `PR choreography at propose (config-gated)`, after generation and validation on the selected branch. It computes three things:

- The ENUMERATED commit scope, from `git status --porcelain`: every path under `orbit/changes/<change-name>/` that is new, untracked, modified or deleted (a staged rename's source included), and every deletion under `orbit/explore/<change-name>/`. These are listed path by path; there is never a directory prefix. A deletion already STAGED (a `git rm`, a staged rename's source) is gone from the index and the worktree, so `git add` would refuse it: it is printed in the commit and kept out of the add. An empty scope prints neither the add nor the commit, only the push. Any other modified, staged or untracked path goes into `observations.unrelated` and never into the scope.
- The no-CI observation, against `<resolved-remote>/<default>` by `git ls-tree`.
- On the program path, the four-axis adopt-or-create query of this capability's `Program PR (Shape A) semantics`.

The record holds two segments:

| segment | inputs | steps |
|---|---|---|
| 1 — land, then open | `<message-file>`, `<title>`, `<body-file>` | `git add` and `git commit --only -F <message-file>` over the scope; `git push -u <resolved-remote> <branch>`; then, unless adopted or degraded, `gh pr create --repo <owner>/<repo> --draft --base <default> --head <branch> --title <title> --body-file <body-file>` |
| 2 — the attachment record, after the body writes the propose or ff emit from segment 1's result | `<emit-path>`, `<message-file>` | `git add <emit-path>`; `git commit --only <emit-path> -F <message-file>`; `git push <resolved-remote> <branch>` |

The program query's outcomes are as follows. One survivor is adopted: `observations.adopted_url` is set and no create is printed. Zero survivors means the PR is created. Several survivors, or a query error, means `proceed` with `degraded: "pr"` and reason code `several` (every candidate in `detail`) or `query-error`: the land steps stand and no create is printed. The title and body are the body's judgment, never computed.

#### Scenario: The scope never sweeps an unrelated file

- **WHEN** `publish` runs with an unrelated file pre-staged and another untracked
- **THEN** the scope lists only the change's own paths, `observations.unrelated` names both, and the printed commit is `--only` over exactly the scope

#### Scenario: A query error lands the work and creates nothing

- **WHEN** the program path's query fails
- **THEN** `publish` prints `proceed` with `degraded: "pr"`, reason code `query-error`, the commit and push in segment 1, and no `gh pr create`

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

### Requirement: `orbit pr tail` computes the archive tail

`orbit pr tail <change-name> --outcome <code> [--include <path>]…` SHALL compute the tail of `orbit-archive-modifications`' `PR-attached archive tail`, after the archive's move and emit. It resolves the change among archived changes. It never observes the PR again: preflight's one observation reaches it as `--outcome`, preflight's `observations.outcome` passed VERBATIM by the body, together with the WRITTEN archive emit (the latest `archive-*.json` on the archived change's trail), which supplies `pr_url`, `pr_state` and the sync's report:

| `--outcome` | `tail` decides | the archive emit must carry |
|---|---|---|
| `valid`, `discovered` | `proceed`; the PR steps run against `pr_url`, and `pr_state: "ready"` prints no flip | `pr_url` and `pr_state` |
| `closed`, `merged`, `retargeted`, `head-mismatch`, `repository-mismatch`, `not-found` | `proceed` with `degraded: "pr"` and the outcome as reason code: commit and push only | `pr_url`, no `pr_state` |
| `none`, `several` | `proceed` with `degraded: "pr"` and the outcome as reason code: commit and push only | neither |
| `unobserved`, `gh-absent` | `skip`, the outcome as reason code | neither |

With no attachment on the trail, `tail` is `off` whatever `--outcome` says. A code outside preflight's closed set, or an emit whose fields disagree with the code's row, is a usage error naming both, because it means the body did not pass preflight's outcome verbatim.

It then checks the owner's preconditions: `gh` is available, and HEAD is the attachment's branch, with the owner's case-specific recovery in `reason.detail` on a mismatch.

The commit scope is `orbit/specs/<capability>/spec.md` for each capability in the same emit's `sync_specs.capabilities_updated`, whether new, untracked or modified, plus every deletion at the pre-move `orbit/changes/<change-name>/` path, read from `git status --porcelain` rather than the index alone, so a move already staged (`git add -A orbit/changes`) still reaches the commit — its staged deletions printed in the commit and kept out of the add — the archived directory (the one path staged whole), and every path named by `--include` (the body's at-archive-note edits). Edits inside a synced spec file that predate the sync are not distinguished: the owner's commit-scope rule carries that limit, and this one inherits it.

There is one segment, with inputs `<message-file>` and `<body-file>`:

- `git add` and `git commit --only -F <message-file>` over the scope;
- `git push <resolved-remote> <branch>`;
- per-change, unless degraded: `gh pr edit --repo <owner>/<repo> <url> --body-file <body-file>`, then `gh pr ready --repo <owner>/<repo> <url>` unless ready;
- program, unless degraded: `gh pr edit` with `<body-file>`, which the body composes from `observations.current_body` plus this stage's entry, and no flip.

The current body is read by `gh pr view --json body`, an observation. On a per-change tail that is not degraded, `human_acts` carries the PR merge (`gh pr merge --repo <owner>/<repo> <url>`) and the return the merge leaves the user: `git fetch <resolved-remote>`, `git switch <default>`, `git merge --ff-only <resolved-remote>/<default>`. A degraded tail carries none, and neither does a program tail: a program PR is merged at arc-done, and its acts are `program`'s. The body runs none of them.

#### Scenario: A positive invalidation still lands the archive

- **WHEN** `tail` runs with `--outcome closed` and the archive emit carries `pr_url` and no `pr_state`
- **THEN** `tail` prints `proceed` with `degraded: "pr"`, the commit and push, and no `gh pr edit` or `gh pr ready`

#### Scenario: A URL-less attachment's fallback miss still lands the archive

- **WHEN** `tail` runs with `--outcome none` and the archive emit carries neither PR field
- **THEN** `tail` prints `proceed` with `degraded: "pr"`, reason code `none`, the commit and push, and no PR step, while the same emit with `--outcome unobserved` prints `skip`

#### Scenario: The scope is what the sync reported, including a new capability

- **WHEN** the emit's `sync_specs.capabilities_updated` names a modified capability and an ADDED one, while another baseline spec carries an unrelated edit
- **THEN** the scope names both synced spec files, the ADDED one untracked, and not the other

#### Scenario: Archiving from the wrong branch prints no write

- **WHEN** `tail` runs with HEAD on the default branch and the attachment's branch existing only on the remote
- **THEN** it prints `action: "skip"` with reason code `head-mismatch`, the `git fetch` + `git switch -c <branch> --track` recovery in `detail`, and no segments

### Requirement: `orbit pr program` computes the architect readout's PR facts

`orbit pr program <doc>` SHALL compute the observations of this capability's `Program PR (Shape A) semantics` that the architect's arc-done readout makes, and SHALL NEVER skip, because that readout is never suppressed. It reads the latest URL-BEARING per-architecture record naming the doc on any trail, never merely the latest record. It validates that record live against the four predicates. When the record is positively invalid, or when no URL-bearing record exists, it falls through to the four-axis query.

`observations` carries `pr` (`{url, state}`, `state` being `draft`, `ready` or `unverified`), `outcome` (one of `valid`, a positive-invalidation reason from `preflight`'s set or `not-found` — the recorded PR's reason when the fall-through finds no open replacement — `discovered`, `none`, `several`, `unobserved` or `gh-absent`), and `candidates` on `several`. An `unobserved` or `gh-absent` outcome is `proceed` with the record's URL and state `unverified`. With no attachment at all it is `off`. `segments` is always empty: the readout makes no write. `human_acts` carries the READY flip (unless the PR is observed ready) and the merge, each repository-qualified, whenever a PR is surfaced; `several` surfaces candidates and carries none.

#### Scenario: A newer URL-less record does not mask an older URL

- **WHEN** a doc's trails hold an older per-architecture record with a valid URL and a newer one without a URL
- **THEN** `program` validates the older URL, and the outcome is `valid`

#### Scenario: A failed query still surfaces the PR

- **WHEN** `gh` is absent and a URL-bearing record exists
- **THEN** `program` prints `proceed` with that URL, state `unverified`, and the two human acts

### Requirement: Printed commands are proven by execution

The `orbit pr` subcommands SHALL be tested against REAL `git` repositories, each with a bare remote reached through a `url.<path>.insteadOf` rewrite of a GitHub-shaped URL, and the `gh` stub of `Test instruments derive from a recorded real-CLI contract` on PATH. In every `proceed` case the test runs each segment in order. It authors the segment's inputs first: the emit between `publish`'s two segments is a real one, written through the emit surface from segment 1's result. It then asserts the repository and remote state the steps promise. A step git will not perform, or a `gh` argv the recorded contract rejects, fails the suite. `human_acts` are never run, and a case asserts that none of them was. A PATH shim records every `git` and `gh` invocation a subcommand makes, and the suite fails on any invocation outside the allowlist of `The \`orbit pr\` command observes and prints; it never writes`. That is the consent check: no write runs inside the engine, in any case. Injected cases prove the instrument can fail: a printed step git refuses, and a subcommand made to invoke a write. D6's executable transcription of Phase 1 (`test/integration/pr-lifecycle/phase1.ts`) is retired into the engine module, and its 39 cases move to the engine's tests: its commit-isolation case to `publish`, the rest to `select`. No test hook ships in `src/`: the harness's `insteadOf` rewrite replaces the transcription's `remote.<r>.ghurl` setting, and the engine reads the configured URL a real checkout carrying such a rewrite also has.

Named limit: coverage of the deterministic steps is BOUNDED. Residual kind: deterministic behaviour of a real remote host neither the live run nor a local temporary repository reaches (e.g. branch protection, `gh` auth expiry, a renamed default branch). Residual method: a second live run under `per-architecture`, logged with the dogfood log's classes.

#### Scenario: A printed step git refuses fails the suite

- **WHEN** an injected `select` case prints a switch that git refuses on that repository
- **THEN** the execution helper fails, naming the step and git's message

#### Scenario: A write inside the engine fails the suite

- **WHEN** an injected case makes a subcommand invoke `git commit`, `git push`, `git switch` or `gh pr create`
- **THEN** the shim's record holds a call outside the allowlist and the assertion fails, naming it

