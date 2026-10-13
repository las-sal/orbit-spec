# Concepts

This page explains the ideas orbit is built on and how they fit together. The first part covers the spec model orbit
inherits from its 1.3.1 baseline (see [Built on](../README.md)): specs, changes, artifacts, delta specs, schemas and
the archive. The rest covers what orbit adds: reviewed gates, the blind pair and walks, run summaries and reports,
orientation, programs of changes, pull requests and consent. Each section ends with a `Carried by:` line naming what
carries its claims: an `orbit-*` capability (its spec is under `orbit/specs/` in orbit's repository), a decision of
the plan that forked orbit, or `the 1.3.1 baseline` for behaviour orbit left unchanged. For practice rather than
concepts, see [Getting started](getting-started.md) and [Workflows](workflows.md).

## The big picture

A project's orbit work lives in one directory, `orbit/`, in two parts:

```text
orbit/
├── specs/      the source of truth: how your system behaves now
└── changes/    proposed modifications, one folder each
```

**Specs** describe how the system behaves. **Changes** propose modifications to it, each in its own folder, until
they are finished. A change states its modifications to the specs as deltas, and archiving the change merges those
deltas into `specs/`. You can work on several changes at once, and review a change before it touches the specs.

Carried by: the 1.3.1 baseline, `orbit-conventions`

## Specs

A spec describes behaviour as requirements, each with scenarios:

```markdown
# auth Specification

## Purpose
Authentication and session management.

## Requirements

### Requirement: User Authentication
The system SHALL issue a session token on successful login.

#### Scenario: Valid credentials
- **WHEN** a user submits valid credentials
- **THEN** a session token is returned
```

Specs live at `orbit/specs/<capability>/spec.md`, one directory per capability. A requirement states what the system
does; its first line carries `SHALL` or `MUST`. A scenario is a concrete, checkable example of it.

A spec is a behaviour contract, not an implementation plan. It holds what users or other systems rely on: inputs,
outputs, errors, and constraints such as security or compatibility. Class names, library choices and step-by-step
plans belong in the change's design and tasks. If the implementation can change without changing anything visible
from outside, it does not belong in the spec. Keep specs as light as the change allows; most changes need only a few
requirements and scenarios.

Carried by: the 1.3.1 baseline

## Changes

A change is a folder under `orbit/changes/` holding everything needed to understand and implement one modification:

```text
orbit/changes/add-dark-mode/
├── proposal.md       why, and what changes
├── design.md         how
├── tasks.md          the implementation checklist
├── specs/            the delta specs
│   └── ui/
│       └── spec.md
├── .openspec.yaml    the change's metadata: its schema, its creation date
└── .orbit-runs/      the change's trail: every review and run summary
```

Each change is self-contained, so several can be in flight at once. When a change is archived, its folder moves to
`orbit/changes/archive/` with a date prefix, keeping the proposal, design, tasks and trail beside the specs it
merged.

The `.orbit-runs/` trail is orbit's: each workflow that runs on the change writes a record there, and orbit's gates
are computed from it.

Carried by: the 1.3.1 baseline, `orbit-conventions`

## Artifacts

A change's artifacts are written in dependency order:

```text
proposal ──► specs ──► tasks
    └──────► design ──┘
```

- **The proposal** states why the change is needed, what changes and which capabilities it adds or modifies.
- **The delta specs** state the requirements the change adds, modifies, removes or renames.
- **The design** states how it will be built: decisions, alternatives considered, risks.
- **The tasks** are the implementation checklist, one checkbox per task.

The order is a dependency graph, not a set of locked phases: you can revise any artifact while implementing.

orbit adds an exploration before the proposal. `/orbit:explore` thinks a change through with you and, when the
conversation settles, writes `orbit/explore/<name>/explore.md`: a premise, the rules decided and how far each was
worked out, decisions, open questions and what was considered and left out. `/orbit:propose` then starts the change
from that file, carrying its decisions and open questions into the artifacts, and keeps it with the change.

Carried by: the 1.3.1 baseline, `orbit-explore-modifications`, `orbit-propose-modifications`

## Delta specs

A delta spec describes what a change does to a capability's spec, in sections:

| Section | On archive |
|---|---|
| `## ADDED Requirements` | appended to the spec |
| `## MODIFIED Requirements` | replaces the requirement of the same name |
| `## REMOVED Requirements` | deleted from the spec |
| `## RENAMED Requirements` | renamed in the spec |

A delta shows exactly what changes, so a reviewer reads the change rather than diffing whole files, and two changes
can touch the same spec as long as they touch different requirements. A MODIFIED requirement carries its whole new
text, scenarios included.

Carried by: the 1.3.1 baseline

## Schemas

A schema defines a change's artifacts, their templates and their dependencies. orbit ships one, `spec-driven`
(proposal, specs, design, tasks), and you can fork it or write your own under `orbit/schemas/`
([Customization](customization.md) describes how). A schema can also declare gates, the checks between artifacts and
phases: `spec-driven` declares the three described next.

Carried by: the 1.3.1 baseline, `orbit-engine-gates`

## Gates and the review cadence

`spec-driven` places three gates on a change's path:

```text
propose ──► [review-proposal] ──► apply ──► [apply] ──► [review-system] ──► archive
```

- **`review-proposal`** is a reviewed gate before apply: the proposal, design, specs and tasks are reviewed before
  any code is written.
- **`apply`** is a tracked gate: it passes when every task in `tasks.md` is checked.
- **`review-system`** is a reviewed gate before archive: the implementation is reviewed against the change.

A reviewed gate passes when the reviews its **cadence** asks for have run and every CRITICAL and WARNING finding of
every review is resolved. The `spec-driven` cadence is two slots: first an independent review (a fresh review in a
clean context, an external review by another AI, or a blind pair of both), then an in-context review by your working
session, which checks the fixes made since.

A review is an editorial pass in one of three modes. **Proposal** mode reads the artifacts in nine passes before
apply. **System** mode runs verify as its Pass 0, checking the code against the tasks and the specs, then reads the
change in six system-wide passes. **Architecture** mode reads a program document and holds no gate. Each finding
carries a severity: CRITICAL, when a user path breaks or data is lost, with a reproduction; WARNING, when an
implementation built to the artifact as written could diverge from what it intends; SUGGESTION, everything else.
SUGGESTIONs never hold a gate.

A gate's state is computed from the change's files and its `.orbit-runs/` trail; nothing asserts it by hand. A review
goes stale when an apply runs after it. A gate reports, and you decide: running a phase whose gate has not passed is
allowed, and the workflow asks and records the decision.

Carried by: `orbit-engine-gates`, `orbit-review`, `orbit-conventions`

## The blind pair and walks

A **fresh** review runs in a clean context with none of the session's conversation. An **external** review is run by
another AI, such as Codex: orbit writes the request, and a recorded runner (`orbit external runner`) launches the
other AI with no copy and paste, or you paste the request yourself. `orbit external save` then checks the return and
files it on the trail.

The **blind pair** runs one of each, blind to each other: `/orbit:review --as <mode> --reviewer blind-pair <change>`
launches the external half and runs the fresh half in one command. Two reviewers from different models, neither
seeing the other's findings, catch more than either alone; where they disagree, the disagreement itself is evidence.
A pair covers the first slot once both halves have landed.

A review produces findings; a **walk** resolves them. `/orbit:address-reviews <change>` finds every review the gate
holds and walks each finding in turn:

- **Pushback first.** Each finding is checked against the current state before anything is fixed; a stale finding
  is suppressed with evidence, not re-fixed.
- **Lanes.** An obvious fix is previewed at triage and applied. A finding that needs a decision is briefed to you in
  prose, and you decide in the conversation.
- **Ripple.** A fix is swept across the files it affects, and the walk records what it retired and introduced.

The walk writes a log the gate reads: a finding counts as resolved only when a walk resolved it.

Carried by: `orbit-review-external`, `orbit-external-runner`, `orbit-address-reviews`

## Run summaries, trails and reports

Each lifecycle and review workflow records its run as a JSON summary on the change's `.orbit-runs/` trail. The AI
supplies only what it authors (the narrative, its findings, its judgements); `orbit emit <command>` composes the rest
(the timestamps, the counts, the gate state, the next step), validates the record, and refuses to write one that does
not hold together.

Every review renders through one report, computed by the engine from the trail:

```bash
orbit status --change add-dark-mode --report
```

The report's header, scorecard, findings and closing lines (the gate's state and what is eligible next) are the
engine's; the reviewing AI writes none of them.

Carried by: `orbit-emit-composition`, `orbit-run-summary-emit`, `orbit-report-rendering`, `orbit-conventions`

## Orientation

`orbit status` answers where you are with no artifact reads:

- `orbit status` shows the current change: its lifecycle strip, what happened last in the trail's own words, and what
  is ready next.
- `orbit status --full` shows every change and program, what happened last across the project, and what is waiting
  on you.
- `orbit status --change <name>` shows one change's artifacts and gates, with a one-line position readout.

Every workflow ends with a `Ready when you are:` line computed by the same engine: the one command that is eligible
next. A workflow never invents it.

Carried by: `orbit-orientation`, `orbit-engine-gates`

## Programs: the architect tier

Work too large for one change is declared as a program: an architecture document under `orbit/architecture/`, with
goals, rulings, and stages each of which becomes a change. `/orbit:architect` authors and resumes one.

A stage's state is computed from disk: `in-change` while a change citing it is active, `exploring` while an
exploration cites it, `quiescent` once its change is archived, `concluded` when the explorations citing it concluded
without a change, and `premised` before anything starts. A stage is `complete` only when it is quiescent and you
have ratified it, and you can declare a stage ended without meeting its criteria. `orbit architecture status` shows where a program stands, and `orbit architecture show <doc> <stage>`
prints one stage.

Carried by: `orbit-architect`, `orbit-architecture-engine`

## Pull requests

With `pr` set in `orbit/config.yaml`, a change carries a pull request. Under `per-proposal`, the change gets its own
branch and a draft pull request at propose, and archive marks that pull request ready. Under `per-architecture`, the
changes that cite one program share that program's pull request: each archive adds its stage to the description and
never marks it ready, because the program pull request is yours to mark ready and merge when the whole program is
done (a change citing no program gets its own pull request, as under `per-proposal`). `orbit pr` computes each step: it reads the repository and prints the git and
GitHub commands to run, and the workflow runs them. Merging is always yours: once the pull request is ready and you
have read it, merge it yourself, for example with GitHub's CLI:

```bash
gh pr merge <number> --repo <owner>/<repo> --merge
```

Carried by: `orbit-pr-lifecycle`

## Consent

You invoke each lifecycle step. A passed gate means a step is eligible, never that it runs: a workflow ends at its
readout and recommends the next command, and never runs it for you. When an AI arrives at apply, archive or bulk
archive on its own, rather than because you typed the command, the workflow asks before it writes anything.

Carried by: `orbit-lifecycle-consent`, `orbit-conventions`

## Archive

Archiving finishes a change. The delta specs are merged into `orbit/specs/`, and the change folder moves to
`orbit/changes/archive/<date>-<name>/` with its artifacts and trail. Specs grow change by change, and the archive
keeps why each grew.

orbit guards the merge. When a change is proposed, it fingerprints each baseline requirement its deltas modify,
remove or rename (`orbit fingerprint <change>`). If another change has edited one of those requirements since,
archiving refuses to overwrite it and asks you to reconcile, rather than silently losing the other change's edit;
`orbit archive --override-fingerprints` proceeds deliberately. Before archiving, the workflow also runs a drift audit,
which reports and never blocks, and asks about any gate that has not passed.

Carried by: the 1.3.1 baseline, `orbit-base-fingerprints`, `orbit-archive-modifications`

## What orbit removed

orbit collects nothing: the baseline's telemetry is gone. And every install carries every workflow: the profile
setting is kept but no longer narrows what `orbit init` and `orbit update` install.

Carried by: fork-and-orbify D12, fork-and-orbify D15

## Glossary

| Term | Meaning |
|---|---|
| **Artifact** | A document of a change: the proposal, the design, the delta specs or the tasks |
| **Archive** | Finishing a change: its deltas merge into the specs and its folder moves to `changes/archive/` |
| **Blind pair** | A fresh and an external review of the same state, blind to each other |
| **Cadence** | A reviewed gate's ordered list of review slots |
| **Change** | A proposed modification, packaged as a folder of artifacts |
| **Delta spec** | A spec stating what a change adds, modifies, removes or renames |
| **Gate** | A check between artifacts and phases, computed from the change's files: tracked or reviewed |
| **Requirement** | One behaviour the system must have |
| **Scenario** | A concrete, checkable example of a requirement |
| **Schema** | The definition of a change's artifacts, their dependencies and its gates |
| **Spec** | A capability's requirements and scenarios, the source of truth for its behaviour |
| **Trail** | A change's `.orbit-runs/` directory: every review and run summary |
| **Walk** | Resolving a review's findings one at a time, with pushback |

Carried by: the 1.3.1 baseline, `orbit-engine-gates`, `orbit-conventions`, `orbit-address-reviews`

## Next steps

- [Getting started](getting-started.md)
- [Workflows](workflows.md)
- [Commands](commands.md)
- [Customization](customization.md)
