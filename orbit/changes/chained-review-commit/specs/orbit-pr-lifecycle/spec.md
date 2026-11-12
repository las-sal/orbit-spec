## ADDED Requirements

### Requirement: The commit and push settings

The system SHALL read two OPTIONAL top-level keys from `orbit/config.yaml`, `commit` and `push`, each granting ONE act
of the commit step (`orbit-conventions`' `The commit step closes each carrying body`): `commit` lets
the step commit everything uncommitted on the change's attached branch, and `push` lets it push that branch to the
resolved remote. A key is granted only by the literal `true`; any other value (`false`, a string, a number, a map, a
list) or an absent key grants nothing, read silently with no warning, as the `chain` map is read. Neither key derives
the other, neither derives from or grants a `chain` key, and nothing but `orbit pr commit` reads them (R-adf-6: each
outward act its own setting; R-adf-1: the default is today's behaviour). What `orbit pr commit` prints for each
combination, DERIVED from two keys each granted or not:

| `commit` | `push` | `orbit pr commit` prints |
|---|---|---|
| not granted | not granted | `off`, after no `git` call: nothing to run |
| granted | not granted | the stage and the commit, no push |
| not granted | granted | the push of the branch's unpushed commits, no stage and no commit |
| granted | granted | the stage, the commit, then the push |

#### Scenario: Neither key is today's behaviour

- **WHEN** `orbit/config.yaml` sets neither `commit` nor `push`, and `orbit pr commit <change>` runs on an attached
  change with uncommitted work
- **THEN** it prints `action: "off"` with no segments, the invocation record shows no `git` call, and the working tree
  is unchanged

#### Scenario: A value other than true grants nothing

- **WHEN** `orbit/config.yaml` sets `commit: "yes"` and `push: false`
- **THEN** neither act is granted, `orbit pr commit` prints `off`, and no warning names either key

#### Scenario: Push alone commits nothing

- **WHEN** only `push: true` is set, the attached branch carries one unpushed commit, and a file is modified
- **THEN** the printed segment carries the push and no stage or commit step, and the modified file stays uncommitted

#### Scenario: Commit alone pushes nothing

- **WHEN** only `commit: true` is set and a file is modified on the attached branch
- **THEN** the printed segment carries the stage and the commit and no push step

### Requirement: `orbit pr commit` computes the closing commit step

`orbit pr commit <change-name>` SHALL compute the commit step that `orbit-conventions`' `The commit step closes each
carrying body` runs, and print it in the record of `` The `orbit pr` command observes and prints; it never writes ``. It resolves the change as active, else as the latest archived change of that name (the step runs
after the archive's move); a name resolving to neither is the usage error. Its gate is tested in this order, the
first matching row deciding:

| test | `action` | reason code |
|---|---|---|
| the resolved `pr:` regime is `never` or inert | `off`, after no `git` call | — |
| neither setting of `The commit and push settings` is granted | `off`, after no `git` call | — |
| no attachment on the change's trail (the latest attachment-bearing propose or ff emit) | `off`, after no `git` call | — |
| HEAD is detached | `skip` | `detached` |
| HEAD is not the attachment's branch | `skip` | `head-mismatch`, `detail` naming HEAD's branch and the attachment's |
| `refs/remotes/<resolved-remote>/HEAD` exists and names the attachment's branch | `skip` | `default-branch` |
| a merge, rebase, cherry-pick or revert is in progress: an unmerged porcelain entry (`DD`, `AU`, `UD`, `UA`, `DU`, `AA`, `UU`), `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, or a rebase directory | `skip` | `merge-in-progress` |
| otherwise | `proceed` | `null`, or the resolution's code when the push is dropped |

The attachment's branch cannot be named like the default branch at the propose that created it: `orbit pr select` refuses that name (`default-collision`). The `default-branch` row covers a default branch changed since, and it reads the remote's `HEAD` ref only, with no `gh` query. Named limit: when that ref is absent (a remote added by hand never sets it), the row is not tested, and a default branch renamed to the attachment's name since propose is not caught.

A commit takes EVERYTHING uncommitted, the user's own edits included, except the untracked files `.gitignore` excludes, by state as
`git status --porcelain -z --untracked-files=all` reports it (read by the parser `orbit pr publish` and `orbit pr tail`
share):

| uncommitted path | the stage |
|---|---|
| a modified or deleted tracked file, whoever changed it, including one that matches a `.gitignore` rule (ignore rules never apply to tracked files) | staged |
| an untracked file `.gitignore` does not exclude | staged, and listed in `observations.untracked` |
| an untracked file `.gitignore` excludes | never staged: porcelain does not report it |
| a path already staged | committed with the rest |
| an unmerged path | never reached: the gate's `merge-in-progress` row |
| no uncommitted path at all | no stage and no commit are printed |

`observations.untracked` lists each untracked path the stage would add, read from that one porcelain call, and the body
names them in one line (the archive tail's naming of untracked files, R-adf-13, is the precedent). A `proceed` prints
ONE segment when at least one step is printed, its inputs `<message-file>` when the commit is printed and none
otherwise, and NO segment when nothing is printed (a clean tree with nothing to push). The body writes `<message-file>`
OUTSIDE the working tree (the OS temp directory), never inside it, because the stage is `git add -A` and would commit
the message itself; it keeps the file until every printed step has run, so a failure line's recovery can name it.

| step | `argv` | printed when |
|---|---|---|
| `stage` | `git add -A` | `commit` is granted and a path is uncommitted |
| `commit` | `git commit -F <message-file>` | with the stage |
| `push` | `git push -u <resolved-remote> <branch>` | `push` is granted and there is something to push to that destination: the printed commit, a commit `git rev-list refs/remotes/<resolved-remote>/<branch>..HEAD` counts, or no such remote-tracking ref |

The remote is resolved by `Remote and default-branch resolution` WITHOUT the default-branch query, so the subcommand
never needs `gh` and has no `gh-absent` skip: the shared resolver checks `gh`'s availability only on the path that
queries the default branch, and every subcommand that queries it meets `gh-absent` exactly as before. The push's
destination is that resolved remote and the attachment's branch, never the branch's configured upstream, and what is
unpushed is measured against that destination's remote-tracking ref. Named limit: the subcommand does not fetch, so a
remote-tracking ref older than the remote counts commits as pushed that the remote has since lost; the push is then
not printed until a later commit. When no remote resolves, the `default-branch` row is not tested, the push
is dropped with `degraded: "pr"` and the resolution's reason code, and the stage and commit stand. `observations`
carries the resolution, `branch`, `settings` (`{commit, push}`), `untracked` and `unpushed`. `human_acts` is always
empty. Every `git` invocation it makes is in that requirement's allowlist.

#### Scenario: A granted step on the attached branch commits and pushes everything

- **WHEN** both settings are granted, HEAD is on the attached branch, a tracked file is modified by hand, and a new file
  is untracked
- **THEN** `orbit pr commit` prints the stage, the commit and the push; `observations.untracked` names the new file;
  and after the body runs the segment, `git status --porcelain` is empty and the remote branch carries the commit

#### Scenario: An ignored file is never committed

- **WHEN** both settings are granted and an untracked file `.gitignore` excludes is present beside a modified tracked file
- **THEN** the printed segment's commit carries the tracked file only, and `observations.untracked` does not name the
  ignored file

#### Scenario: A step off the attached branch prints nothing to run

- **WHEN** both settings are granted and HEAD is on a branch other than the attachment's
- **THEN** it prints `action: "skip"` with reason code `head-mismatch` naming both branches, and no segments

#### Scenario: The default branch is never committed to

- **WHEN** both settings are granted and `refs/remotes/<resolved-remote>/HEAD` exists and names the attachment's branch
  (the default branch was changed to that name after propose)
- **THEN** it prints `action: "skip"` with reason code `default-branch`, and no segments

#### Scenario: A missing remote HEAD ref leaves the default-branch row untested

- **WHEN** both settings are granted on the attached branch, a file is modified, and `refs/remotes/<resolved-remote>/HEAD`
  does not exist
- **THEN** it prints `proceed` with the stage, the commit and the push; the `default-branch` row is not tested

#### Scenario: A tracked file matching an ignore rule is committed

- **WHEN** both settings are granted, a tracked file matches a `.gitignore` rule, and that file is modified
- **THEN** the printed segment's stage and commit carry it, as `git add -A` does

#### Scenario: The message file never lands in the commit

- **WHEN** the body runs a printed segment that carries the commit
- **THEN** `<message-file>` was written outside the working tree, the commit's tree holds no message file, and
  `git status --porcelain` is empty after the segment

#### Scenario: A clean tree with nothing to push prints no segment

- **WHEN** both settings are granted on the attached branch, nothing is uncommitted, and the branch's remote-tracking ref
  equals HEAD
- **THEN** it prints `proceed` with no segments, and the body writes no message and runs nothing

#### Scenario: The push goes to the resolved remote, set as upstream

- **WHEN** only `push: true` is set, HEAD tracks a branch on another remote, and the attachment's branch on the resolved
  remote lacks a commit HEAD has
- **THEN** the printed push is `git push -u <resolved-remote> <branch>`, measured against
  `refs/remotes/<resolved-remote>/<branch>`, not the configured upstream

#### Scenario: A merge in progress prints nothing to run

- **WHEN** both settings are granted and the working tree holds an unmerged path from an unfinished merge, or a
  cherry-pick stopped with no conflicted path (`CHERRY_PICK_HEAD` present)
- **THEN** it prints `action: "skip"` with reason code `merge-in-progress`, and no segments

#### Scenario: No gh is needed to commit and push

- **WHEN** both settings are granted on the attached branch, a file is modified, and no `gh` is on PATH
- **THEN** it prints `proceed` with the stage, the commit and the push, and the invocation record shows no `gh` call

#### Scenario: No remote drops the push and keeps the commit

- **WHEN** both settings are granted on the attached branch, a file is modified, and the repository has no remote
- **THEN** it prints `proceed` with `degraded: "pr"`, the stage and the commit, and no push

#### Scenario: An archived change resolves

- **WHEN** the step runs after `/orbit:archive <change>` has moved the change, with `commit: true` and an unrelated
  tracked edit the tail left out of its commit
- **THEN** `orbit pr commit <change>` resolves the archived change's attachment and prints the stage and the commit
  that carry the edit

## MODIFIED Requirements

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
| `off` | the gate is closed: for `select` and `publish` the resolved `pr:` regime is `never`, for `preflight` and `tail` no attachment resolves, for `commit` the regime is `never`, neither setting of `The commit and push settings` is granted, or no attachment resolves | `null`, and NO `git` or `gh` invocation ran | none |
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
surface for this capability is the `pr:` config reader, the reader of the `commit` and `push` settings (`The commit and push settings`), the READ-ONLY `pr` field the reader's
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
`program` at the architect arc-done readout, and `commit` at the commit step that closes each carrying body (`orbit-conventions`' `The commit step closes each carrying body`), and acts by this table, whose rows cover every shape the record type
(`The \`orbit pr\` command observes and prints; it never writes`) can return:

| the call returns | the body |
|---|---|
| a non-zero exit (a usage error, the only one) | stops the PR layer and reports the error verbatim; the lifecycle continues unattached |
| `action: off` | engages no PR step and writes no note of its own, beyond the unattached line `preflight`'s requirement assigns it |
| `action: skip` | writes ONE line from `reason.code` and `reason.detail`, runs nothing, and continues unattached |
| `action: proceed`, `degraded: null` | runs `segments` in order; before each segment it authors that segment's `inputs`; it runs each step's `argv` exactly, substituting only an element equal to an input token, every element shell-quoted |
| `action: proceed`, `degraded: "pr"` | the same, plus ONE line for the PR-half degradation from `reason` |
| `select` returns `off` or `skip`, exits non-zero, or one of its steps fails | ends the PR layer for this invocation: `publish` is never called, and generation proceeds on the current branch, unattached; a failed step is named in ONE line with no recovery shown, since running it would attach nothing |
| a `publish`, `tail` or `commit` step fails | stops at that step and writes ONE line naming the completed, the failed and the skipped steps by their `step` names, showing the failed step's argv and then each skipped step's, verbatim with every input filled, as the recovery the user runs in that order, and stating the consequence for its seam: at propose and ff the change proceeds unattached until that recovery lands; at the archive tail the archive itself has landed and never rolls back, and the PR stays as the completed steps left it; at the commit step the session's writes stay uncommitted or unpushed until that recovery lands, and nothing the session wrote is undone; no later PR step runs, and the lifecycle's own steps (the emit among them) still do |
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
