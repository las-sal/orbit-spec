# orbit-propose-modifications Delta

## ADDED Requirements

### Requirement: PR choreography at propose (config-gated)

The propose flow's PR choreography SHALL run in THREE ORDERED PHASES whenever `pr:` config
activates the PR layer (`per-proposal` or `per-architecture`, per `orbit-pr-lifecycle`),
and the order is normative because a simpler one cannot execute:

1. **BRANCH SELECTION (local only, BEFORE artifact generation).** Resolve remote and default
   branch, derive and validate the branch name, run the collision, ref-format, and
   dirty-tree preconditions, resolve reuse-vs-create against local AND remote refs, and
   SWITCH to (or create) the target branch. No NETWORK writes occur in this phase, but the
   switch is not merely a HEAD move: `git switch` also rewrites every TRACKED path that
   differs between HEAD and the target commit, so phase 1 changes worktree CONTENT and must
   be guarded accordingly (see the generation-input precondition below).
2. **ARTIFACT GENERATION + VALIDATION**, performed ON that branch exactly as it is
   performed without the PR layer.
3. **OUTWARD WRITES, only after (2) SUCCEEDS.** Commit the generated artifacts (and moved
   staging material), push, and open the DRAFT PR with the agent-written INTENT description
   — or, on the cited program path, land on the program branch and adopt-or-open the
   program PR. Then record the attachment in the propose (or ff) emit and COMMIT + PUSH that
   emit file as the seam's FINAL act: the record is the authority the archive tail
   dereferences, and an uncommitted record is lost to any fresh checkout between the seams,
   stranding the PR draft with no designed recovery. Same seam, same invocation, no new
   consent; the seams-only refresh rule is untouched.

GENERATION-INPUT PRECONDITION (phase 1, checked BEFORE the switch, on BOTH the reuse and
the create path). Because the switch rewrites TRACKED content and phase 2 now runs after it,
the flow SHALL verify that every input generation will need survives the target ref. The
check keys on TRACKED state, never on worktree presence: when a consume-mode staging
directory `orbit/explore/<change-name>/` is TRACKED in HEAD, the TARGET REF must carry the
same content — absent or different on the target means the switch would delete or rewrite
the exploration, and the choreography SKIPS the PR layer ENTIRELY — the switch never
happens — with artifacts generated on the current branch, the change proceeding unattached,
and one note naming the reason. An UNTRACKED staging directory — the ordinary state, since
`/orbit:explore` commits nothing — NEVER triggers the skip: `git switch` rewrites only
tracked paths, so untracked content survives it intact. Checking BEFORE rather than
recovering after is deliberate: it preserves the property phase 1 is supposed to have, that
it destroys nothing. The dirty-tree precondition does NOT cover this case, since it detects
uncommitted modifications while the hazard is COMMITTED content that exists on the current
branch and not on (or differs from) the target — reachable whenever propose runs from a
branch other than the resolved default, or from a local default carrying unpushed commits,
and the flow makes no assumption about where the user is standing.

Selection MUST precede generation because the reuse path is otherwise IMPOSSIBLE: a
compatible per-proposal branch is DEFINED as one carrying this change's artifact commits, so
it already tracks the very paths that generation has just written as untracked files in the
worktree, and `git switch` REFUSES rather than overwrite them. Generating first and
switching after mandates a step that stops on a git error — reachable by the MID-FLIGHT
FAILURE this same requirement specifies: propose creates the branch and commits the
artifacts, then the push or `gh pr create` fails, and the user re-proposes. (The branch now
exists carrying this change's artifact commits, which is exactly the compatible-reuse case.
A `gh`-absent first run is NOT that route — availability resolution degrades the layer to
`never` before any branch work, so no branch is created to reuse.) Selecting first
means nothing untracked exists at switch time and the collision cannot arise.

The guarantee this reordering must NOT weaken is preserved exactly: NOTHING LEAVES THE
MACHINE until generation and validation succeed. Phase 1 is local-only, so a validation
failure at phase 2 leaves the user on the target branch with no commit, no push, and no PR
— and the failure note SHALL NAME THE BRANCH they are now on, since the flow moved them
there. Recovery is `git switch <default>`; the branch is discardable. Under
`per-architecture` for a CITED change — land the work on the doc's program branch (creating
it off the default branch if absent) and open the program PR if it does not yet exist
(first-configured-touch birth). EXISTENCE IS RESOLVED BY QUERY, never assumed from the
branch's newness or from a `gh pr create` duplicate error: run the SAME four-axis
constrained query the archive tail uses (per `orbit-archive-modifications`' discovery rule —
the resolved remote's repository, `--head <program-branch>`, `--state open`, and candidates
DISCARDED unless their base is the resolved default branch). Exactly one survivor: ADOPT it
— record its identity in this propose's `pr_attachment` and create nothing (Shape A's
one-PR-per-program rule is what makes adoption correct, not a fallback). Zero survivors:
create the draft program PR. More than one: SKIP the PR step with a one-line ambiguity note
listing the candidates, exactly as the tail does. A query that ERRORS is degradation, not a
zero result — skip with the failure note rather than creating a PR that may duplicate an
existing one, since a duplicate program PR is the one outcome Shape A cannot represent. With `pr: never` or degraded (no remote/no
`gh`) the choreography is skipped with a one-line note — but ONLY on the DEGRADED-BUT-ACTIVE
path. Under `pr: never`, an absent key, or an inert unrecognized value/shape, the PR layer
produces NO output at all and probes nothing, per `orbit-pr-lifecycle`'s config-first
resolution order: `never`'s promise is silence, and a note would break byte-identity with
pre-capability behavior. A step that FAILS mid-flight (push
rejected for auth, branch protection, or divergence; `gh pr create` erroring) SHALL skip the
remaining choreography with a one-line note naming completed vs skipped steps, elide
`pr_attachment`'s `url`/`state` from the emit (the object persists with `branch`,
`granularity`, and — on the program path — `doc`, which the write gate requires whenever the
granularity is `per-architecture`, when the branch work succeeded), and never block or roll back artifact
generation — the same apply-parity degradation the archive tail carries. RECOVERY IS MANUAL
BY DESIGN (v1): there is no retry entry point and no idempotent re-run surface. The failure
note SHALL name the exact commands that complete the interrupted work — the push
(`git push -u <resolved-remote> <branch>`) and, when PR creation was what failed, the
creation (`gh pr create --draft --base <resolved-base> --head <branch>`) — and SHALL state
the consequence of leaving it: the change proceeds UNATTACHED, and its archive tail will
find no PR, note it, and skip. This is deliberate: orbit is single-user and single-session
(see `orbit-pr-lifecycle`'s operating-assumption requirement), so the user is present at the
moment of failure and a precise message serves better than a retry surface. The invocation NEVER carries a "pr"
word — the config is the standing declaration; behavior after entry is identical on every
provenance path. The choreography's outward writes ride the user's OWN invocation of propose
— propose is NOT promoted to the consent-scoped set and fires NO consent prompt: the
no-chaining contract (`orbit-conventions`) already bars the AI from invoking propose unbidden,
so every propose is user-typed or chat-ratified (both user-invoked provenance), and the
outward write it performs — a DRAFT PR on a NEW branch — is reversible in two commands,
unlike the consent-marked `→ apply` and `→ archive` seams D1 backstops. When opening a
change's FIRST PR on a repository with no `.github/workflows/`, the body SHALL note in one
line that no CI is configured (the PR's checks section will be empty). The check is BOUND TO
ONE REF — the RESOLVED REMOTE's default-branch ref, the same ref branch creation uses and one
the existence check has already fetched — never the pre-switch worktree and never the target
branch. Those three can disagree (a long-lived program branch may carry workflows the base
lacks, or the reverse), and the note describes the CI context the NEW PR INHERITS, which is
the base's — reporting, never
scaffolding, never prompting.

#### Scenario: The attachment record reaches the branch

- **WHEN** the choreography opens (or adopts) a PR and the propose emit records `pr_attachment`
- **THEN** that emit file is committed and pushed to the change's branch before propose completes, so a later archive from a fresh checkout of that branch resolves the attachment

#### Scenario: A switch that would delete the exploration is not performed

- **WHEN** propose runs in consume mode from a branch where `orbit/explore/<change-name>/` is committed, and that path does not exist on the resolved target ref (or exists with different content)
- **THEN** the PR layer is SKIPPED ENTIRELY — no switch occurs, so the staging input is never removed or rewritten — and artifacts are generated on the current branch with the change proceeding unattached, one note naming the reason

#### Scenario: An uncommitted exploration does not trigger the skip

- **WHEN** propose runs in consume mode with `orbit/explore/<change-name>/` present but UNTRACKED (the ordinary explore-then-propose session), and the target ref — an existing compatible branch or the resolved default for a new one — does not carry that path
- **THEN** the precondition does NOT fire: the switch proceeds, the untracked exploration survives it intact, and the change attaches normally

#### Scenario: Reusing an existing branch is possible because selection precedes generation

- **WHEN** propose runs from the default branch while a compatible `<change-name>` branch already exists carrying this change's earlier artifact commits (the re-propose-after-degradation case)
- **THEN** the branch is selected and switched to BEFORE any artifact is written, so no untracked file blocks the switch; artifacts are then generated on that branch and the outward writes follow validation

#### Scenario: Validation failure leaves the user on a named branch, nothing pushed

- **WHEN** artifact generation or validation fails after phase 1 has switched to the target branch
- **THEN** no commit, push, or PR occurs, and the failure note NAMES the branch the flow moved the user to, with `git switch <default>` as the recovery — the branch is local-only and discardable

#### Scenario: Typed propose opens the draft silently

- **WHEN** the user types `/orbit:propose my-feature` in a repo with `pr: per-proposal`
  and a remote
- **THEN** artifacts generate, the `my-feature` branch is created/committed/pushed, a draft
  PR opens with an intent description, and no PR-related prompt fires

#### Scenario: Program PR is adopted, not duplicated

- **WHEN** a second citing change is proposed under `per-architecture` and the constrained query finds exactly one open PR from the program branch into the resolved base
- **THEN** that PR is ADOPTED — its identity is recorded in this propose's `pr_attachment` and no PR is created; a query returning several candidates skips with an ambiguity note, and a query that errors skips with the failure note rather than creating a possible duplicate

#### Scenario: Uncited change under per-architecture takes the fallback

- **WHEN** `pr: per-architecture` and a change with no `architecture:` citation is proposed
- **THEN** the choreography runs the per-proposal path — own branch, commit, push, draft PR
  — and no program branch is sought

#### Scenario: Push failure degrades, artifacts stand

- **WHEN** the push is rejected mid-choreography (auth, branch protection, or divergence)
- **THEN** the PR step is skipped, one note names completed vs skipped steps, `pr_attachment`'s `url`/`state` keys are elided from the propose emit (the object persists carrying `branch` and `granularity`), and the generated artifacts remain intact

#### Scenario: Failure note carries manual recovery

- **WHEN** the push succeeds but `gh pr create` fails
- **THEN** the note names the completed and skipped steps, gives the exact `gh pr create --draft --base <base> --head <branch>` command that completes the work, and states that leaving it unattached means the archive tail will find no PR and skip; no retry surface is offered and nothing is rolled back

#### Scenario: No-CI note on first PR

- **WHEN** the first PR for a change opens on a repo lacking `.github/workflows/`
- **THEN** the completion output contains a single note that no CI is configured; nothing
  is scaffolded and no prompt fires

### Requirement: Branch preconditions at propose

Branch creation SHALL resolve its preconditions explicitly, never by implementer choice.
Every precondition in this requirement belongs to PHASE 1 of the choreography — before any
artifact is generated — so each one that SKIPS does so having written nothing at all: the
flow then proceeds without the PR layer, generating artifacts on the current branch exactly
as it would with `pr: never`. A precondition skip is therefore never a partial state.

The REMOTE and the DEFAULT BRANCH are resolved FIRST, by the shared algorithm defined in
`orbit-pr-lifecycle`'s `Remote and default-branch resolution` requirement — the single
definition both PR seams consume, so propose and archive can never disagree about which
repository owns the PR or which branch it targets. An unresolvable remote or default branch
degrades exactly as that requirement states: the choreography SKIPS with the one-line note
it prescribes, and the lifecycle never blocks. The preconditions below are propose's OWN —
they govern creating a branch, which the archive seam never does.

Wherever this capability says a branch is created "off the default branch", the BASE REF is
the RESOLVED REMOTE's default-branch ref (`<resolved-remote>/<default>`), never the local ref
of the same name. The existence check below already fetches, so that ref is current, while
the local ref may be arbitrarily stale in a checkout the user has not pulled — and two
implementers would otherwise reasonably write `git switch -c <name> <default>` and
`git switch -c <name> <resolved-remote>/<default>` and cut the branch from different commits.
Naming it once here binds every creation site, per-proposal and program alike.

A mechanical branch name that COLLIDES with
the resolved default branch (a change literally named `main`, or an architecture doc whose
stem is the default branch) makes `<head> → <base>` impossible: the choreography SKIPS with
a one-line note naming the collision rather than creating an unmergeable PR or misclassifying
the default branch as an unrelated existing branch. A DIRTY working tree at phase 1 (any
tracked modification outside the change's own generated artifacts and moved staging
material) SHALL skip the branch/PR steps with a one-line note rather than carry unrelated
edits onto a new branch — and because phase 1 precedes generation, the skip costs nothing:
artifacts are generated on the current branch and the change proceeds unattached.
Unrelated UNTRACKED paths do not trigger the skip (a fresh working tree routinely carries
them), but they are NAMED in that same note when the choreography proceeds, so nothing the
commit deliberately leaves behind is silent.

The propose COMMIT SCOPE is an ENUMERATED FILE LIST on the same discipline the archive tail
carries, and for the same reason — this commit becomes the first commit of a PR: stage the
change's own generated artifacts, the moved staging material now under
`orbit/changes/<change-name>/`, and the staging-directory DELETIONS the move produced
(`orbit/explore/<change-name>/`), and nothing else. `git add -A` is PROHIBITED, as is
staging a bare directory prefix: the obvious reach for `-A` (the artifacts are newly created
and therefore untracked) is exactly what would sweep an unrelated untracked file into a PR
the user is about to publish.
"EXISTING" means EXISTING ANYWHERE — locally OR on the resolved remote. The choreography
SHALL fetch the resolved remote and check `<resolved-remote>/<branch>` BEFORE concluding a
branch is absent, because the common fresh-checkout case (a program branch that exists on the
remote from an earlier stage, with no local ref) would otherwise be read as "absent",
creating a divergent local history off the default branch that can only reach a REJECTED
push. When only the remote ref exists, create a LOCAL TRACKING BRANCH from it
(`git switch -c <branch> --track <resolved-remote>/<branch>`) and proceed on the reuse path —
resuming a program branch from a clean checkout is ordinary, not exceptional. "Absent" means
absent both locally and on the resolved remote; only then is a branch created off the default
branch.

An EXISTING branch of the target name is REUSED when it is COMPATIBLE, and compatibility is
defined PER PATH because the two paths mean opposite things by "expected history":

- **Per-proposal branch** — compatible when it is either absent, or present and containing
  no commits beyond the resolved default branch other than this change's own artifact
  commits. A same-named branch carrying unrelated work is a COLLISION: skip with a one-line
  note naming it.
- **Program branch** — compatible when it exists and SHARES ANCESTRY with the resolved
  default branch. The test is EXACTLY `git merge-base <program-branch> <resolved-default>`
  SUCCEEDING (a common ancestor exists) — NOT "the default branch's tip is an ancestor of
  the program branch". The stricter reading holds only at the instant the branch is created:
  a program branch is DESIGNED to be long-lived, so the default branch advancing underneath
  it is the EXPECTED condition at every stage after the first, and a tip-ancestry test would
  reject healthy program work in any active repository. Commits authored by OTHER citing
  changes are likewise EXPECTED, not disqualifying — a program branch accumulates every
  stage's work by design. Only a branch with NO common ancestor (an unrelated root) is a
  collision.

  **Base-ahead policy — CONTINUE WITH DETECTION.** When the resolved default branch has
  advanced beyond the merge-base, the choreography PROCEEDS on the branch and emits a
  one-line note stating that the default branch is ahead by N commits and that the program
  PR's diff will carry that gap until the user integrates. It NEVER merges, rebases, or
  fast-forwards the program branch to catch it up — the same restraint the remote-ahead rule
  carries — and it never SKIPS on this basis: blocking propose because the default branch
  moved would make `per-architecture` unusable in an active repository, and a stale diff-base
  is visible in the PR itself, which is what the PR is for. Integration is the user's act,
  reported and never performed.

Before reusing any existing branch the choreography SHALL fetch and compare against the
resolved remote's tip; when the remote is AHEAD, it fast-forwards if possible and otherwise
SKIPS with a one-line note naming the divergence rather than committing onto a stale local
branch. orbit never force-moves, renames, rebases, or force-pushes a user's branch.

#### Scenario: New branches are cut from the remote ref, not a stale local one

- **WHEN** a branch is created in a checkout whose local default-branch ref is behind the resolved remote's
- **THEN** it is cut from `<resolved-remote>/<default>` — the ref the existence check already fetched — so the base commit does not depend on when the user last pulled

#### Scenario: Default branch resolved, not assumed

- **WHEN** the choreography runs in a repo whose default branch is not `main`
- **THEN** the branch is created off the resolved default branch, and a repo where neither resolution method succeeds skips the choreography with a note instead of guessing

#### Scenario: Remote resolved, never assumed

- **WHEN** the repository has exactly one remote not named `origin`, or has several remotes with no `origin`
- **THEN** the single remote is used in the first case; the second SKIPS the choreography with a one-line note naming the ambiguity and the candidate remotes — push target, default base, and `gh` repository never disagree

#### Scenario: Mechanically derived name that Git rejects skips

- **WHEN** the derived branch name is valid on disk but rejected by `git check-ref-format --branch` (an architecture stem ending in `.lock`, a name containing `..`)
- **THEN** the choreography SKIPS with a one-line note naming the name and the reason; no branch is created under a silently transformed name

#### Scenario: Branch name colliding with the default branch skips

- **WHEN** the mechanical branch name equals the resolved default branch (a change named `main`, or a program doc whose stem is the default branch)
- **THEN** the choreography skips with a one-line note naming the collision; no unmergeable `<head> → <base>` PR is attempted and the default branch is never treated as an unrelated existing branch

#### Scenario: Propose stages an enumerated list, never `-A`

- **WHEN** the choreography commits with unrelated UNTRACKED files present in the working tree
- **THEN** only the change's generated artifacts, the moved staging material, and the staging-directory deletions are staged; the unrelated untracked paths are left alone and named in the note; `git add -A` and bare directory-prefix staging are never used

#### Scenario: Dirty tree skips rather than sweeps

- **WHEN** unrelated tracked modifications exist at the choreography step
- **THEN** no branch is created and no commit is made; the artifacts remain generated and validated, and one note names the skipped steps

#### Scenario: Remote-only branch is tracked, not recreated

- **WHEN** a citing change is proposed in a fresh checkout where the program branch exists on the resolved remote but has no local ref
- **THEN** the fetch/remote-ref check finds it, a local TRACKING branch is created from the remote ref, and the reuse path proceeds — no divergent branch is created off the default branch and no push is left to be rejected

#### Scenario: Default branch advancing does not reject the program branch

- **WHEN** a second citing change is proposed after the resolved default branch has advanced beyond the program branch's merge-base
- **THEN** `git merge-base` still succeeds, the branch is REUSED, and one note states the default branch is ahead by N commits and that integration is the user's act — nothing is merged, rebased, or skipped; only a branch with NO common ancestor is reported as a collision

#### Scenario: Program branch reused across stages

- **WHEN** a second (and third, and tenth) citing change is proposed onto an existing program branch already carrying earlier stages' commits
- **THEN** the branch is REUSED — commits by other citing changes are expected history, never a collision — and only a branch unrelated to the default branch's history is reported and skipped

#### Scenario: Remote-ahead branch is not committed onto blindly

- **WHEN** the resolved remote's tip is ahead of the local branch at the choreography step
- **THEN** the choreography fast-forwards when possible, and otherwise SKIPS with a one-line note naming the divergence — never committing onto a stale local branch, never rebasing or force-pushing

#### Scenario: Existing branch reused or reported

- **WHEN** a branch of the target name already exists
- **THEN** it is reused when compatible; when it is unrelated the choreography is skipped with a note naming the collision — never force-moved, renamed, or committed onto blindly
