## ADDED Requirements

### Requirement: The `orbit pr` command observes and prints; it never writes

The engine SHALL provide one command group, `orbit pr`, whose subcommands compute the DETERMINISTIC steps of this capability's choreography and PRINT the writes, never performing one. Each subcommand runs only the read-only invocations in the table below, decides one of three ACTIONS, and reports. The writes (branch creation, switch, commit, push, `gh pr create`, `gh pr edit`, `gh pr ready`) appear as printed argument vectors that the workflow body runs under the user's own invocation:

| tool | invocations a subcommand MAY run |
|---|---|
| `git` | `remote`, `remote get-url`, `config --get`, `rev-parse`, `symbolic-ref`, `check-ref-format`, `status --porcelain`, `fetch <resolved-remote>`, `merge-base`, `rev-list`, `diff --name-only` / `diff --quiet`, `ls-files`, `ls-tree`, `branch --show-current` |
| `gh` | `repo view <owner>/<repo>`, `pr view`, `pr list` |

`gh` AVAILABILITY is a PATH lookup, never an invocation, and an absent executable is reported as `gh: "absent"`. That is a different fact from an installed `gh` whose query fails, which is a degradation skip naming the failure. `git fetch` of the resolved remote is the ONE ref-store update a subcommand performs. It moves remote-tracking refs and nothing else: no branch, index entry, worktree path or remote ref.

Every subcommand prints one record, as JSON with `--json` and as text otherwise, with the same fields: `subcommand`; `action`; `notes` (one-line strings); `resolution` (`{remote, repo, default_branch, gh}`, or `null`); the subcommand's own `facts`; and `commands`, an ordered list of `{step, argv}`. The ACTION is one of three:

| action | when | resolution | notes | commands |
|---|---|---|---|---|
| `off` | the gate is closed (`select` and `publish`: the resolved `pr:` regime is `never`; `preflight`, `tail` and `program`: no attachment resolves) | `null` | none | none, and NO `git` or `gh` invocation ran |
| `skip` | a precondition or a degradation, per the rule's owner | as far as it resolved | exactly one, naming the reason | none |
| `proceed` | every precondition held | resolved | zero or more (an ahead-by-N, unrelated untracked paths) | the writes, in the order the body runs them |

An argv element that the body must supply is one of the CLOSED placeholder set `<title>`, `<body-file>`, `<message-file>`, `<emit-path>`, written as that exact element and never inside another. Every other element is concrete. A subcommand exits 0 whatever its action, because the PR layer degrades and never blocks the lifecycle; it exits non-zero only on a usage error (an unknown change or doc).

Named limit: the deterministic step set is BOUNDED. Residual kind: a step the runbook is silent on, so no row names it (tracking at creation, the post-merge return were two). Residual method: the dogfood log's rows classed "wrong (silent)", and every later live run's log classified the same way.

#### Scenario: A closed gate probes nothing

- **WHEN** `orbit pr select <change> --json` runs where `pr:` resolves to `never`
- **THEN** it prints `action: "off"` with `resolution: null`, no notes and no commands, exits 0, and the invocation record shows no `git` or `gh` call

#### Scenario: An absent gh is its own fact

- **WHEN** any subcommand runs past its gate with no `gh` on PATH
- **THEN** it prints `action: "skip"` with `resolution.gh: "absent"` and one note saying `gh` is not available, never a note about a failed query

#### Scenario: Writes are printed, never run

- **WHEN** `orbit pr select <change>` decides `proceed` on a branch absent locally and on the remote
- **THEN** the branch does not exist after the command returns, HEAD is unchanged, and `commands` carries the `git switch` argv that would create it

### Requirement: `orbit pr select` computes propose's branch selection

`orbit pr select <change-name>` SHALL compute Phase 1 of `orbit-propose-modifications`' `PR choreography at propose (config-gated)` for propose and ff. That covers the remote and default branch by this capability's `Remote and default-branch resolution`, and every precondition by `orbit-propose-modifications`' `Branch preconditions at propose`, in that requirement's order and with its skip notes. The branch name is the change name, or the cited doc's filename stem when the change is cited under `per-architecture`. The gate reads the regime from the same reader `orbit status --json` surfaces as `pr`.

On `proceed`, `facts` carries `branch`, `granularity`, and `branch_state`, one of `absent`, `local`, `remote-only` or `fast-forward`, plus `ahead_by` on the program path. `commands` carries the switch for that state:

| `branch_state` | printed commands |
|---|---|
| `absent` | `git switch -c <branch> --no-track <resolved-remote>/<default>` |
| `local` | `git switch <branch>` |
| `remote-only` | `git switch -c <branch> --track <resolved-remote>/<branch>` |
| `fast-forward` | `git switch <branch>`, then `git merge --ff-only <resolved-remote>/<branch>` |

`--no-track` on creation is deliberate: a branch created from the default ref would otherwise track the default branch, a setting the runbook never mentioned and the publish push replaces. Closure: DERIVED from the existence and remote-ahead preconditions' four outcomes that proceed.

#### Scenario: A branch absent everywhere is created off the remote default, untracked

- **WHEN** `select` runs for a change whose branch exists neither locally nor on the resolved remote, with the local default ref stale
- **THEN** `branch_state` is `absent` and the printed command bases the branch on `<resolved-remote>/<default>` with `--no-track`

#### Scenario: A diverged branch is a skip

- **WHEN** the change's branch exists locally and on the remote and neither tip contains the other
- **THEN** `select` prints `action: "skip"` with the divergence note `Branch preconditions at propose` prescribes, and no commands

### Requirement: `orbit pr publish` computes propose's outward phase

`orbit pr publish <change-name>` SHALL compute Phase 3 of `orbit-propose-modifications`' `PR choreography at propose (config-gated)`, run after generation and validation on the selected branch. It computes three things:

- The ENUMERATED commit scope, from disk: every path under `orbit/changes/<change-name>/` that git reports as new or modified, and every deletion under `orbit/explore/<change-name>/`. These are listed path by path; there is never a directory prefix.
- The no-CI observation, against the resolved remote's default-branch ref, by `git ls-tree`.
- On the program path, the four-axis adopt-or-create query of this capability's `Program PR (Shape A) semantics`, with its four outcomes: adopt, create, several, or query error. Several and query error are skips.

Any other path that is modified or staged is named in a note and never enters the scope. `commands` carries `git add` and `git commit --only` over the scope with `-F <message-file>`, then `git push -u <resolved-remote> <branch>`, then (unless adopted) `gh pr create --repo <owner>/<repo> --draft --base <default> --head <branch> --title <title> --body-file <body-file>`, then the attachment record: `git add <emit-path>`, `git commit --only <emit-path>`, `git push <resolved-remote> <branch>`. `facts` carries `scope`, `ci` (`present` / `absent`), and on the program path `adopted_url` when one PR survived. The title and body are the body's judgment, never computed.

#### Scenario: The scope never sweeps an unrelated file

- **WHEN** `publish` runs with an unrelated file pre-staged and another untracked
- **THEN** `facts.scope` lists only the change's own paths, a note names the unrelated entries, and the printed commit is `--only` over exactly the scope

#### Scenario: A query error never creates

- **WHEN** the program path's query fails
- **THEN** `publish` prints `action: "skip"` with the degradation note and no `gh pr create` argv

### Requirement: `orbit pr preflight` computes the archive's read-only preflight

`orbit pr preflight <change-name>` SHALL compute the read-only preflight of `orbit-archive-modifications`' `PR-attached archive tail`, before the archive emit. It covers:

- The attachment: the latest attachment-bearing propose or ff emit on the change's trail. A wholly absent attachment is `off`.
- The citation-divergence note.
- Live validation of a stored `url` against the four predicates, with one call: `gh pr view --repo <owner>/<repo> <url> --json state,isDraft,headRefName,baseRefName,url`.
- The fallback query, when the attachment has no `url`.
- The draft or ready observation.

`facts` carries `attachment`, `validation` (`valid`, or the specific reason: `closed`, `merged`, `retargeted to <base>`, `repository mismatch`, `not found`), and `emit`, the values the archive emit records: `{pr_url, pr_state}`, with `pr_state` elided on a positive invalidation and both fields elided when the observation is unavailable. `preflight` prints no commands.

#### Scenario: A closed PR is answered, not missing

- **WHEN** the stored `url` resolves to a closed PR
- **THEN** `validation` is `closed`, `emit` carries `pr_url` and no `pr_state`, and no fallback query runs

#### Scenario: An unavailable observation elides both fields

- **WHEN** `gh` is installed and the `pr view` query fails
- **THEN** `preflight` prints `action: "skip"` with the failure note, and `emit` is empty

### Requirement: `orbit pr tail` computes the archive tail

`orbit pr tail <change-name> [--include <path>]…` SHALL compute the tail of `orbit-archive-modifications`' `PR-attached archive tail`, after the archive's move. It resolves the change by name among archived changes. It checks both preconditions: `gh` is available, and HEAD is the attachment's branch. On mismatch it gives that requirement's case-specific recovery note and no commands.

It computes the commit scope:

- each `orbit/specs/<capability>/spec.md` whose capability the archived change's delta names AND git reports as changed;
- the deletion at the pre-move `orbit/changes/<change-name>/` path;
- the archived directory, as the one path staged whole;
- every path named by `--include`, which is how the body passes its at-archive-note edits.

`commands` carries `git add` and `git commit --only` over the scope with `-F <message-file>`, then `git push <resolved-remote> <branch>`. The PR steps follow on the attachment's granularity. Per-change: `gh pr edit --repo <owner>/<repo> <url> --body-file <body-file>`, then `gh pr ready --repo <owner>/<repo> <url>`. Program: the read of the current body, then `gh pr edit` with the composed `<body-file>`, and no flip. An already-ready PR prints no flip and one note.

`facts.after_merge` carries the return the merge leaves the user to make: `git switch <default>` and `git merge --ff-only <resolved-remote>/<default>`, each run after a `git fetch <resolved-remote>`. The engine never prints a merge.

#### Scenario: The scope is the delta's capabilities, not the specs prefix

- **WHEN** `tail` runs after an archive that synced one capability while another baseline spec carries an unrelated edit
- **THEN** `facts.scope` names the synced capability's spec file and not the other, and a note names the unrelated edit

#### Scenario: Archiving from the wrong branch prints no write

- **WHEN** `tail` runs with HEAD on the default branch and the attachment's branch existing only on the remote
- **THEN** it prints `action: "skip"` naming both branches and the `git fetch` + `git switch -c <branch> --track` recovery, and no commands

### Requirement: `orbit pr program` computes the architect readout's PR facts

`orbit pr program <doc>` SHALL compute the observations of this capability's `Program PR (Shape A) semantics` that the architect's arc-done readout makes. It gates on the attachment: a per-architecture record naming the doc, on any trail. It covers the shared resolution, live validation of a URL-bearing record against the four predicates, and the four-axis query when no record carries a URL. `facts` carries `pr` (`{url, state}` or `null`) and `outcome` (`valid`, a specific invalidation reason, `discovered`, `none`, `several`, or `query-error`). `commands` carries only the human acts the readout surfaces, the READY flip and the merge, as text the user copies; this one subcommand prints a merge, because naming the merge as the user's act is what that readout is for.

#### Scenario: No URL falls back to the query

- **WHEN** the doc's latest per-architecture record carries no `url` and exactly one open PR from the program branch targets the default
- **THEN** `outcome` is `discovered` and `pr` names it

### Requirement: Printed commands are proven by execution

The `orbit pr` subcommands SHALL be tested against REAL `git` repositories, each with a bare remote and the `gh` stub of `Test instruments derive from a recorded real-CLI contract` on PATH. In every `proceed` case the test runs the printed `commands` in order, with each placeholder filled, and asserts the repository state the step promises. A command git will not perform, or a `gh` argv the recorded contract rejects, fails the suite. A PATH shim records every `git` and `gh` invocation a subcommand makes, and the suite fails on any invocation outside the allowlist of `The \`orbit pr\` command observes and prints; it never writes`. This is the consent check: no write runs inside the engine, in any case. D6's executable transcription of Phase 1 (`test/integration/pr-lifecycle/phase1.ts`) is retired into the engine module, and its cases become cases of `select`.

Named limit: coverage of the deterministic steps is BOUNDED. Residual kind: deterministic behaviour of a real remote host neither the live run nor a local temporary repository reaches (e.g. branch protection, `gh` auth expiry, a renamed default branch). Residual method: a second live run under `per-architecture`, logged with the dogfood log's classes.

#### Scenario: A printed command git refuses fails the suite

- **WHEN** a `select` case for the `local` state prints a switch that git refuses to perform on that repository
- **THEN** the case fails naming the step and git's message

#### Scenario: A write inside the engine fails the suite

- **WHEN** any subcommand invokes `git commit`, `git push`, `git switch` or `gh pr create`
- **THEN** the shim's record holds a call outside the allowlist and the suite fails naming it

## MODIFIED Requirements

### Requirement: PR actions are workflow-body choreography (zero engine git)

Every git and GitHub WRITE of this capability SHALL live as workflow-body steps in the
generated skill bodies — branch creation, switch, commit, push, `gh pr create/edit/ready` — the
same choreography class as the existing review-handoff commit+push; the orbit
engine SHALL NOT perform a PR-lifecycle write. The engine OBSERVES: `orbit pr` (per `The
\`orbit pr\` command observes and prints; it never writes`) runs the read-only `git` and `gh`
invocations that requirement's allowlist names and PRINTS the writes for the body to run, under
the user's own invocation (R-crc-5's conditional reversal of D-d6-7, effective for the steps
`Printed commands are proven by execution` executes). The engine's total
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

#### Scenario: Engine untouched by PR flows

- **WHEN** the full PR lifecycle runs end-to-end
- **THEN** every git/`gh` WRITE traces to a workflow-body step, and every git/`gh` invocation an
  engine module makes is a read in `orbit pr`'s allowlist or its one `git fetch`
