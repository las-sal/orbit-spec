# orbit-propose-modifications Delta

## ADDED Requirements

### Requirement: PR choreography at propose (config-gated)

The propose flow SHALL append the branch/PR choreography AFTER artifact generation and
validation succeed, whenever `pr:` config activates the PR layer (`per-proposal` or
`per-architecture`, per `orbit-pr-lifecycle`). Under `per-proposal` — and under
`per-architecture` for a change with NO citation (the fallback path) — create
`<change-name>` off the default branch, commit the generated artifacts (and moved staging
material), push, and open a DRAFT PR with the agent-written INTENT description. Under
`per-architecture` for a CITED change — land the work on the doc's program branch (creating
it off the default branch if absent) and open the program PR if it does not yet exist
(first-configured-touch birth). With `pr: never` or degraded (no remote/no
`gh`) the choreography is skipped with a one-line note. A step that FAILS mid-flight (push
rejected for auth, branch protection, or divergence; `gh pr create` erroring) SHALL skip the
remaining choreography with a one-line note naming completed vs skipped steps, elide
`pr_attachment`'s `url`/`state` from the emit (the object persists with `branch` and
`granularity` when the branch work succeeded), and never block or roll back artifact
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
line that no CI is configured (the PR's checks section will be empty) — reporting, never
scaffolding, never prompting.

#### Scenario: Typed propose opens the draft silently

- **WHEN** the user types `/orbit:propose my-feature` in a repo with `pr: per-proposal`
  and a remote
- **THEN** artifacts generate, the `my-feature` branch is created/committed/pushed, a draft
  PR opens with an intent description, and no PR-related prompt fires

#### Scenario: Uncited change under per-architecture takes the fallback

- **WHEN** `pr: per-architecture` and a change with no `architecture:` citation is proposed
- **THEN** the choreography runs the per-proposal path — own branch, commit, push, draft PR
  — and no program branch is sought

#### Scenario: Push failure degrades, artifacts stand

- **WHEN** the push is rejected mid-choreography (auth, branch protection, or divergence)
- **THEN** the PR step is skipped, one note names completed vs skipped steps, `pr_url`/`pr_state` are elided from the propose emit, and the generated artifacts remain intact

#### Scenario: Failure note carries manual recovery

- **WHEN** the push succeeds but `gh pr create` fails
- **THEN** the note names the completed and skipped steps, gives the exact `gh pr create --draft --base <base> --head <branch>` command that completes the work, and states that leaving it unattached means the archive tail will find no PR and skip; no retry surface is offered and nothing is rolled back

#### Scenario: No-CI note on first PR

- **WHEN** the first PR for a change opens on a repo lacking `.github/workflows/`
- **THEN** the completion output contains a single note that no CI is configured; nothing
  is scaffolded and no prompt fires

### Requirement: Branch preconditions at propose

Branch creation SHALL resolve its preconditions explicitly, never by implementer choice.

The REMOTE is resolved before anything else, since branch identity, default base, and the
GitHub repository must all agree: exactly one remote → use it (whatever its name — `origin`
is a convention, not a requirement); multiple remotes → prefer `origin` when present,
otherwise the choreography is SKIPPED with a one-line note naming the ambiguity and the
candidates (orbit never guesses which remote owns the PR); zero remotes → the degraded path
(`never`). All subsequent steps — push target, default-branch resolution, and `gh`
repository selection — use that ONE resolved remote.

The DEFAULT BRANCH is resolved as `gh repo view --json defaultBranchRef` when `gh` is
available, falling back to `git symbolic-ref refs/remotes/<resolved-remote>/HEAD`; when
neither resolves, the choreography is skipped with a one-line note naming the failure (the
PR layer degrades, the lifecycle never blocks). A mechanical branch name that COLLIDES with
the resolved default branch (a change literally named `main`, or an architecture doc whose
stem is the default branch) makes `<head> → <base>` impossible: the choreography SKIPS with
a one-line note naming the collision rather than creating an unmergeable PR or misclassifying
the default branch as an unrelated existing branch. A DIRTY working tree at the choreography step (any
tracked modification outside the change's own generated artifacts and moved staging
material) SHALL skip the branch/PR steps with a one-line note rather than sweep unrelated
edits onto the branch — artifact generation has already succeeded and is never rolled back.
An EXISTING branch of the target name is REUSED when it is COMPATIBLE, and compatibility is
defined PER PATH because the two paths mean opposite things by "expected history":

- **Per-proposal branch** — compatible when it is either absent, or present and containing
  no commits beyond the resolved default branch other than this change's own artifact
  commits. A same-named branch carrying unrelated work is a COLLISION: skip with a one-line
  note naming it.
- **Program branch** — compatible when it exists and descends from the resolved default
  branch. Commits authored by OTHER citing changes are EXPECTED, not disqualifying — a
  program branch accumulates every stage's work by design, so a rule that rejected
  "commits this change did not author" would reject every program branch after its first
  stage. Only a branch that has diverged from the default branch's history entirely
  (unrelated root) is a collision.

Before reusing any existing branch the choreography SHALL fetch and compare against the
resolved remote's tip; when the remote is AHEAD, it fast-forwards if possible and otherwise
SKIPS with a one-line note naming the divergence rather than committing onto a stale local
branch. orbit never force-moves, renames, rebases, or force-pushes a user's branch.

#### Scenario: Default branch resolved, not assumed

- **WHEN** the choreography runs in a repo whose default branch is not `main`
- **THEN** the branch is created off the resolved default branch, and a repo where neither resolution method succeeds skips the choreography with a note instead of guessing

#### Scenario: Remote resolved, never assumed

- **WHEN** the repository has exactly one remote not named `origin`, or has several remotes with no `origin`
- **THEN** the single remote is used in the first case; the second SKIPS the choreography with a one-line note naming the ambiguity and the candidate remotes — push target, default base, and `gh` repository never disagree

#### Scenario: Branch name colliding with the default branch skips

- **WHEN** the mechanical branch name equals the resolved default branch (a change named `main`, or a program doc whose stem is the default branch)
- **THEN** the choreography skips with a one-line note naming the collision; no unmergeable `<head> → <base>` PR is attempted and the default branch is never treated as an unrelated existing branch

#### Scenario: Dirty tree skips rather than sweeps

- **WHEN** unrelated tracked modifications exist at the choreography step
- **THEN** no branch is created and no commit is made; the artifacts remain generated and validated, and one note names the skipped steps

#### Scenario: Program branch reused across stages

- **WHEN** a second (and third, and tenth) citing change is proposed onto an existing program branch already carrying earlier stages' commits
- **THEN** the branch is REUSED — commits by other citing changes are expected history, never a collision — and only a branch unrelated to the default branch's history is reported and skipped

#### Scenario: Remote-ahead branch is not committed onto blindly

- **WHEN** the resolved remote's tip is ahead of the local branch at the choreography step
- **THEN** the choreography fast-forwards when possible, and otherwise SKIPS with a one-line note naming the divergence — never committing onto a stale local branch, never rebasing or force-pushing

#### Scenario: Existing branch reused or reported

- **WHEN** a branch of the target name already exists
- **THEN** it is reused when compatible; when it is unrelated the choreography is skipped with a note naming the collision — never force-moved, renamed, or committed onto blindly
