## ADDED Requirements

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

`orbit pr preflight <change-name>` SHALL compute the read-only preflight of `orbit-archive-modifications`' `PR-attached archive tail`, before the archive emit. It reads the attachment (the latest attachment-bearing propose or ff emit on the change's trail), notes citation divergence in `observations`, and decides one OUTCOME from this closed set, reported as `observations.outcome`:

| outcome | when | `action` | emit values |
|---|---|---|---|
| `valid` | the stored URL passes all four predicates | `proceed` | `pr_url`, `pr_state` as observed |
| `closed`, `merged`, `retargeted`, `head-mismatch`, `repository-mismatch` | the stored URL resolves and fails that predicate | `proceed`, `degraded: "pr"` | `pr_url` only |
| `not-found` | `gh pr view` exits non-zero with the recorded "could not resolve" message | `proceed`, `degraded: "pr"` | `pr_url` only |
| `discovered` | no stored URL; the fallback query has exactly one survivor | `proceed` | `pr_url`, `pr_state` |
| `none`, `several` | no stored URL; the query has zero or several survivors | `proceed`, `degraded: "pr"` | none |
| `unobserved` | any other non-zero `gh` exit, or a failed resolution (no remote, several remotes, an unparseable URL, no default branch — the reason code then being the resolution's) | `skip` | none |
| `gh-absent` | no `gh` on PATH | `skip` | none |

The live validation is one call: `gh pr view --repo <owner>/<repo> <url> --json state,isDraft,headRefName,baseRefName,url`. A failed validation never triggers the fallback query; a stored URL that resolves is ANSWERED, per the owner. On a positive invalidation `reason.detail` carries the failed predicate's `observed` value and, where one exists, the `expected` one (the base a `retargeted to <base>` note names), so the body never invents a fact or observes again. `observations.emit` carries the values the archive emit records. `preflight` prints no segments. An unattached change is `off`, with no reason. The one line noting the unattached state, which `PR entry points`' scenario `new/continue reaches archive unattached` requires, is the body's: it writes that line from `off` together with the `pr` regime it reads from `orbit status --json`.

#### Scenario: A closed PR is answered, not missing

- **WHEN** the stored URL resolves to a closed PR
- **THEN** the outcome is `closed`, `observations.emit` carries `pr_url` and no `pr_state`, and no fallback query runs

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

## MODIFIED Requirements

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
