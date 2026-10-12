# Getting started

The README's [Quickstart](../README.md#quickstart) installs orbit's workflows and lists the six commands of a first
change. This page walks that change end to end, with the step the Quickstart leaves implicit (the walk of each
review's findings) and what every step writes on disk. It assumes Claude Code and a project where `orbit init` has
run; [Installation](installation.md) covers both.

Every step below is a command you type. orbit's AI recommends the next step and never runs it unasked, and each
command ends with a `Ready when you are:` line naming what is eligible next.

## The change

The example adds a dark mode to an app. Its change name is `add-dark-mode`.

### 1. Explore

```text
/orbit:explore dark mode for the settings page
```

A conversation, not a form: the AI reads the code, asks questions and sketches options. Exploring changes no code.
When the thinking is worth keeping, it writes `orbit/explore/<name>/explore.md`, which the next step picks up.
Skip this step when you already know what you want.

### 2. Propose

```text
/orbit:propose add-dark-mode
```

The AI writes the change, in one folder:

```text
orbit/changes/add-dark-mode/
├── .openspec.yaml        the change's metadata: its schema, and fingerprints of the specs it touches
├── proposal.md           why, and what changes
├── design.md             how: the decisions and the alternatives
├── specs/
│   └── ui/spec.md        the requirements the change adds, modifies or removes
├── tasks.md              the implementation checklist
└── .orbit-runs/          the change's trail: one JSON record per command run
```

The specs under `specs/` are **delta specs**: they say what changes relative to your project's living specs in
`orbit/specs/`, which stay untouched until archive. [Concepts](concepts.md) describes their format.

### 3. Review the proposal

```text
/orbit:review --as proposal --fresh add-dark-mode
```

A fresh review runs in a clean context, so it reads the artifacts without the conversation that wrote them. It
reports findings by severity (CRITICAL, WARNING, SUGGESTION) and writes `.orbit-runs/review-proposal-<TS>.json`,
where `<TS>` is a UTC timestamp. It fixes nothing.

With a second AI set up, `--blind-pair` in place of `--fresh` runs a fresh review and an external review from
another model, blind to each other. [Commands](commands.md#orbitreview) describes every reviewer.

### 4. Walk the findings

```text
/orbit:address-reviews add-dark-mode
```

The walk takes the findings one at a time. It first checks each against the current files and suppresses, with
evidence, any that no longer hold. Then it fixes the obvious ones, and briefs you on any that need a decision. It
edits the artifacts and writes `.orbit-runs/address-reviews-<TS>.json`, which records how each finding was
resolved.

A review with findings leaves its gate naming this walk next. The readout after the walk usually names a confirming
review in this session:

```text
/orbit:review --as proposal add-dark-mode
```

That review checks that the walk's fixes landed. If it finds anything, walk it too. The gate passes when the
review cadence is covered and every finding is resolved. [Workflows](workflows.md#the-review-cadence) describes the
cadence.

### 5. Apply

```text
/orbit:apply add-dark-mode
```

The AI implements the tasks, checking each one off in `tasks.md` as it lands, and writes
`.orbit-runs/apply-<TS>.json`. If implementation shows the design was wrong, edit the artifacts and carry on: apply
picks up from the unchecked tasks.

### 6. Review the system, and walk it

```text
/orbit:review --as system --fresh add-dark-mode
/orbit:address-reviews add-dark-mode
```

A system review reads the implemented change: it verifies the code against the artifacts first, then reviews the
whole of it. It writes `.orbit-runs/review-system-<TS>.json`. Walk its findings as in step 4, and run the confirming
review the readout names.

### 7. Archive

```text
/orbit:archive add-dark-mode
```

Archive merges the change's delta specs into `orbit/specs/` and moves the change folder, trail included, to
`orbit/changes/archive/<YYYY-MM-DD>-add-dark-mode/`. Before it merges, it checks that no other change has edited the
requirements this one touches since it was proposed.

## The readout

Every command ends with a position and an eligibility line, computed from the change's files:

```text
Position: propose ✓ → review(proposal) ✓ → apply ready → review(system) blocked-by-gate → archive blocked-by-gate
Ready when you are: /orbit:apply add-dark-mode — user-invoked
```

`Ready when you are:` names what is eligible, never what you must do. The `— user-invoked` marker says the step is
one you invoke yourself. A gate that is `blocked-by-gate` is waiting on an earlier one.

## Where am I?

Ask orbit at any point, outside any workflow:

```bash
orbit status
```

With no options it shows the changes in flight: where each is, what happened last, and what is ready next. For one
change's artifacts and gates:

```bash
orbit status --change add-dark-mode
```

The [CLI reference](cli.md#orbit-status) lists the other views.

## Next

- [Workflows](workflows.md): the patterns, the review cadence, and when to start a new change.
- [Commands](commands.md): every `/orbit:` workflow.
- [CLI](cli.md): every `orbit` command.
