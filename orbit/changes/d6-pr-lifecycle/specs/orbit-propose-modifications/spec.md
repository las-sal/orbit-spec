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
`pr_url`/`pr_state` from the propose emit, and never block or roll back artifact generation
— the same apply-parity degradation the archive tail carries. The invocation NEVER carries a "pr"
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

#### Scenario: No-CI note on first PR

- **WHEN** the first PR for a change opens on a repo lacking `.github/workflows/`
- **THEN** the completion output contains a single note that no CI is configured; nothing
  is scaffolded and no prompt fires

### Requirement: Branch preconditions at propose

Branch creation SHALL resolve its preconditions explicitly, never by implementer choice.
The DEFAULT BRANCH is resolved as `gh repo view --json defaultBranchRef` when `gh` is
available, falling back to `git symbolic-ref refs/remotes/origin/HEAD`; when neither
resolves, the choreography is skipped with a one-line note naming the failure (the PR layer
degrades, the lifecycle never blocks). A DIRTY working tree at the choreography step (any
tracked modification outside the change's own generated artifacts and moved staging
material) SHALL skip the branch/PR steps with a one-line note rather than sweep unrelated
edits onto the branch — artifact generation has already succeeded and is never rolled back.
An EXISTING branch of the target name is REUSED when its checked-out state is compatible
(the change's artifacts commit onto it); when a same-named branch exists but is unrelated
(diverged from the resolved default branch by commits the change did not author), the
choreography is skipped with a one-line note naming the collision — orbit never force-moves
or renames a user's branch.

#### Scenario: Default branch resolved, not assumed

- **WHEN** the choreography runs in a repo whose default branch is not `main`
- **THEN** the branch is created off the resolved default branch, and a repo where neither resolution method succeeds skips the choreography with a note instead of guessing

#### Scenario: Dirty tree skips rather than sweeps

- **WHEN** unrelated tracked modifications exist at the choreography step
- **THEN** no branch is created and no commit is made; the artifacts remain generated and validated, and one note names the skipped steps

#### Scenario: Existing branch reused or reported

- **WHEN** a branch of the target name already exists
- **THEN** it is reused when compatible; when it is unrelated the choreography is skipped with a note naming the collision — never force-moved, renamed, or committed onto blindly
