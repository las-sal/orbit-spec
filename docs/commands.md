# Commands

orbit's workflows are commands you type to your AI assistant. In Claude Code each is `/orbit:<id>`. Every install
carries all 15. The [CLI](cli.md) is the terminal side; the workflows call it.

Every workflow ends its turn with a `Ready when you are:` line naming what is eligible next. The AI recommends the
next step and does not run it unasked: you invoke each workflow. When the AI arrives at `apply`, `archive` or
`bulk-archive` by any route other than your typing it, it asks before writing anything.

## Quick reference

| Workflow | Purpose |
|---|---|
| [`/orbit:architect`](#orbitarchitect) | Author an architecture doc: a program of changes as stages |
| [`/orbit:explore`](#orbitexplore) | Think an idea through before committing to a change |
| [`/orbit:propose`](#orbitpropose) | Create a change and write all its artifacts in one step |
| [`/orbit:new`](#orbitnew) | Create a change and stop, to write its artifacts one at a time |
| [`/orbit:continue`](#orbitcontinue) | Write the change's next artifact |
| [`/orbit:ff`](#orbitff) | Write every remaining artifact |
| [`/orbit:review`](#orbitreview) | Review a change (or an architecture doc) and report findings |
| [`/orbit:address-reviews`](#orbitaddress-reviews) | Walk review findings one at a time, with pushback |
| [`/orbit:apply`](#orbitapply) | Implement the change's tasks |
| [`/orbit:verify`](#orbitverify) | Check the implementation against the artifacts |
| [`/orbit:sync`](#orbitsync) | Merge a change's delta specs into the baseline without archiving |
| [`/orbit:archive`](#orbitarchive) | Merge the specs and archive the change |
| [`/orbit:bulk-archive`](#orbitbulk-archive) | Archive several changes at once |
| [`/orbit:audit-drift`](#orbitaudit-drift) | Find drift between the project's documents and the repository |
| [`/orbit:onboard`](#orbitonboard) | A one-page orientation to orbit |

## Other assistants

Codex installs each workflow as a skill, and as a prompt named `orbit-<id>` in its global prompts directory.
[Supported tools](supported-tools.md) describes how each assistant invokes them. The workflow names, arguments and
behaviour below are the same for every assistant.

---

## Starting a change

### `/orbit:explore`

A thinking partner. The AI reads the code, asks questions, compares options and draws diagrams; it changes no code.
When the thinking is worth keeping, it writes `orbit/explore/<name>/explore.md`, which `/orbit:propose` picks up as
the change's starting point.

```text
/orbit:explore
/orbit:explore how should the settings page handle themes?
```

Use it when the problem or the approach is unclear. An exploration can also conclude without a change.

### `/orbit:propose`

Create a change and write all its artifacts: `proposal.md`, `design.md`, delta specs under `specs/` and `tasks.md`,
in `orbit/changes/<name>/`. Give it a kebab-case name or describe what you want.

```text
/orbit:propose add-dark-mode
/orbit:propose add a dark mode to the settings page
```

Before writing `proposal.md` it reads the baseline spec of each capability the change modifies, after searching
`orbit/specs/` for the rule it changes. It validates what it wrote, and stamps the fingerprints of the baseline
requirements the change touches. In a project whose `orbit/config.yaml` sets `pr:`, it also opens a draft pull
request for the change.

### `/orbit:new`

Create the change folder and stop, showing the first artifact to write. Pair it with `/orbit:continue` to write the
artifacts one at a time.

```text
/orbit:new add-dark-mode
```

### `/orbit:continue`

Write the change's next ready artifact: the one whose dependencies are done. It reads those dependencies first, then
shows what the new artifact unlocks.

```text
/orbit:continue
/orbit:continue add-dark-mode
```

### `/orbit:ff`

Fast-forward: write every remaining artifact in dependency order. Like `/orbit:propose`, but it also completes a
change that `/orbit:new` or `/orbit:continue` started.

```text
/orbit:ff add-dark-mode
```

---

## Reviewing

### `/orbit:review`

Review a change, or an architecture doc, and report findings by severity: CRITICAL, WARNING or SUGGESTION. A review
generates findings and never fixes them; `/orbit:address-reviews` walks them. Each review is recorded in the change's
trail, and `orbit status --change <name> --report` renders it.

```text
/orbit:review --as proposal --fresh add-dark-mode
/orbit:review --as system --blind-pair add-dark-mode
/orbit:review --as architecture my-program
```

**Modes** (`--as`):

| Mode | When | What it reads | Gate |
|---|---|---|---|
| `proposal` | Before apply | The change's artifacts, in nine passes | `review-proposal` |
| `system` | After apply | The implementation: `/orbit:verify` first, then six passes over the whole change, the last a drift audit | `review-system` |
| `architecture` | Any time | An architecture doc under `orbit/architecture/`, in six passes | None |

With no `--as`, the mode is inferred from `tasks.md`: none checked means proposal, all checked means system, and
anything else asks. Architecture mode is never inferred.

**Reviewers** (`--reviewer <value>`, or its shorthand). Give at most one.

| Reviewer | Shorthand | Who reviews |
|---|---|---|
| `in-context` (the default) | `--in-context` | This session, with the conversation it has |
| `fresh` | `--fresh` | The same model in a clean context, which reads only the artifacts |
| `external` | `--external` | A different AI, in a separate session. With a runner recorded (`orbit external runner`), orbit launches it; otherwise it prints the prompt to paste |
| `blind-pair` | `--blind-pair` | A fresh and an external review in one command, blind to each other |

`external` and `blind-pair` need `--as proposal` or `--as system`.

**Other options:**

| Option | Effect |
|---|---|
| `--fast`, `--full`, `--thorough` | Depth; `--full` by default |
| `--parallel` | Run the heavier passes in subagents |
| `--focus <lens>` | Emphasize some passes, without skipping the others |
| `--strict` | Stop at the first CRITICAL finding or block |
| `--mark` | Proposal mode: also write each finding as an `@review:` marker at its line |
| `--skip-verify` | System mode: skip the `/orbit:verify` pass, when you ran it separately |

[Workflows](workflows.md#the-review-cadence) describes which reviews a gate needs before it passes.

### `/orbit:address-reviews`

Walk review findings one at a time. Each finding is first checked against the current files: one that no longer
holds is suppressed with evidence, never re-fixed. Obvious fixes are previewed at the start and applied; a finding
that needs a decision is briefed to you in prose and settled in the conversation. Edits ripple to the other files the
fix affects. The walk is recorded in the change's trail, finding by finding.

```text
/orbit:address-reviews add-dark-mode
/orbit:address-reviews --from-file review.md
/orbit:address-reviews
```

Aimed at a change, it walks everything outstanding: every review the change's gates have not yet seen resolved,
internal and external alike, its unwalked drift audits, and any `@review:` markers in the change. With no argument
and one active change, it aims at that change; otherwise it scans the repository for `@review:` markers.

| Option | Effect |
|---|---|
| `--from-file <path>` | Walk one file only: an external review, a review record or a drift audit |
| `--batch` | Triage and resolve all findings together rather than one at a time |
| `--no-cascade` | Do not apply ripple edits to other files |

### `/orbit:verify`

Check the implementation against the change's artifacts: completeness (tasks and requirements), correctness
(each requirement's implementation and each scenario's handling, with test coverage read from the scenario map when
`orbit/config.yaml` turns it on), and coherence (the design's decisions in the code). It reports issues and does not
fix them.

```text
/orbit:verify add-dark-mode
```

A system review runs verify as its first pass, so there is no separate verify step in the lifecycle. Run it on its
own to check progress during apply.

---

## Implementing

### `/orbit:apply`

Implement the change's tasks, checking each one off in `tasks.md` as it lands. It reads the proposal, design, specs
and tasks first, and picks up from the unchecked tasks if you stop part way.

```text
/orbit:apply add-dark-mode
```

If the proposal review's gate has not passed, apply says so and asks whether to address the gate, proceed anyway
(the decision is recorded), or stop. It never blocks you outright.

---

## Finishing

### `/orbit:sync`

Merge a change's delta specs into the baseline in `orbit/specs/` without archiving the change. Archive does this
itself; use sync when a long-running change needs its specs in the baseline early.

```text
/orbit:sync add-dark-mode
```

### `/orbit:archive`

Finish a change: merge its delta specs into `orbit/specs/` and move it to
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`. Before the move, it:

- reports each reviewed gate that has not passed, and asks whether to proceed;
- settles any task left for you to validate, as observed or deferred;
- checks the fingerprints, so it never silently overwrites a requirement another change edited since this one was
  proposed;
- runs `/orbit:audit-drift` on the change (`--skip-audit` skips it, when you have just run one).

```text
/orbit:archive add-dark-mode
```

In a project whose `orbit/config.yaml` sets `pr:`, it then commits, pushes, and marks the change's pull request
ready. Merging it stays yours.

### `/orbit:bulk-archive`

Archive several finished changes in one go. It asks which, then, for each change in turn, settles the tasks left for
you to validate and checks the fingerprints before it merges the specs and moves the change. When two changes touch
the same spec, it applies them in the order they were created.

It does less than `/orbit:archive` run once per change: it does not report unpassed reviewed gates, does not run
`/orbit:audit-drift`, and makes no commit, push or pull-request change, whatever `pr:` says. Archive a change on its
own when you want those.

```text
/orbit:bulk-archive
```

---

## Across the project

### `/orbit:audit-drift`

Scan for drift between what the project's documents record and what is actually in the repository, in four
categories: vocabulary residue, stale review lenses, disagreements between documents, and archived changes whose
specs never reached the baseline. It reports findings; `/orbit:address-reviews` walks them.

```text
/orbit:audit-drift
/orbit:audit-drift add-dark-mode
```

With no argument it audits the whole project; with a change name, that change. System reviews run it as their last
pass, and archive runs it before the move.

| Option | Effect |
|---|---|
| `--fast`, `--full`, `--thorough` | Depth; `--full` by default |
| `--parallel` | Run the heavier categories in subagents |
| `--focus <area>` | One category only: `vocabulary`, `lenses`, `docs` or `archive` |
| `--since <ref>` | How far back the archive category looks: a git ref, or a number of archived changes (5 by default) |
| `--strict` | Stop at the first CRITICAL finding |

### `/orbit:architect`

Author or resume an architecture doc: a program of changes declared as stages under `orbit/architecture/`, with the
rulings that bind them. orbit computes each stage's state from disk (exploring, in a change, archived and waiting
for you to ratify it, complete, or ended without meeting its criteria), and the architect asks you to ratify a
stage once its change is archived.

```text
/orbit:architect
/orbit:architect my-program
```

With no name, it lists the docs and offers to create one. It is never a required step: a single change needs no
architecture doc.

### `/orbit:onboard`

A one-page orientation to orbit: the workflow, the commands, and where things live. It creates nothing.

```text
/orbit:onboard
```

---

## Troubleshooting

**"Change not found".** Name the change exactly, or run `orbit list` to see the active ones.

**The commands do not appear.** Restart your assistant after `orbit init` or `orbit update`. Check that
`.claude/commands/orbit/` and `.claude/skills/` exist in the project; if not, run `orbit init` again.

**The workflows behave like an older orbit.** After upgrading the CLI, run `orbit update` in the project
([Installation](installation.md#upgrade)).

## Next

- [Workflows](workflows.md): the patterns, and the review cadence
- [CLI](cli.md): the terminal commands
