# Workflow engine

orbit's workflows are skills your assistant follows, and the skills are thin: they ask the `orbit` CLI what state a
change is in and what to do next, then write what it asks for. This page describes the engine underneath, which
computes that state from files on disk: the artifact graph, the gates, and the two commands the workflows read them
through.

You do not need any of this to use orbit. It explains why the workflows behave as they do, and what to change when
you write your own schema.

## Actions, not phases

orbit has no planning phase that locks before an implementing phase. A change is a folder of artifacts, and each
workflow is an action on it:

```text
   explore ──► propose ──► review ──► apply ──► review ──► archive
                  ▲           │         │          │
                  └───────────┴─────────┴──────────┘
                     edit any artifact, at any point
```

What orders the actions is not a phase but two things the engine computes:

- the **artifact graph**: an artifact can be written once the artifacts it needs exist;
- the **gates**: apply waits on the proposal review, and archive on the system review.

Both are recomputed from the change's files every time they are asked, so editing an artifact never leaves stale
state behind.

## The artifact graph

A schema declares the artifacts of a change and what each requires. The `spec-driven` schema that orbit ships:

```text
                proposal
             (requires nothing)
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
       specs                 design
  (requires proposal)   (requires proposal)
         │                     │
         └──────────┬──────────┘
                    ▼
                  tasks
          (requires specs, design)
```

Each artifact is in one of three states, read from the filesystem:

```text
   BLOCKED ──────────► READY ──────────► DONE
   a dependency        every dependency    its file exists
   is missing          is done
```

Dependencies enable; they do not force an order beyond what they state. `specs` and `design` both need only the
proposal, so either can come first.

## How the workflows read the engine

Two commands carry the engine's state to the workflows.

**`orbit status --change <name> --json`** reports every artifact's state, every gate's state, the position and the
next eligible command:

```json
{
  "changeName": "add-dark-mode",
  "schemaName": "spec-driven",
  "artifacts": [
    { "id": "proposal", "outputPath": "proposal.md", "status": "done" },
    { "id": "design", "outputPath": "design.md", "status": "ready" },
    { "id": "specs", "outputPath": "specs/**/*.md", "status": "ready" },
    { "id": "tasks", "outputPath": "tasks.md", "status": "blocked", "missingDeps": ["design", "specs"] }
  ],
  "gates": [
    { "id": "review-proposal", "kind": "reviewed", "state": "blocked", "reason": "blocked by incomplete requires: specs, design, tasks" }
  ],
  "position": "propose … → review(proposal) blocked-by-gate → apply blocked-by-gate → review(system) blocked-by-gate → archive blocked-by-gate"
}
```

(Abridged: the real output carries more gate fields, the other gates, and a size record.)

**`orbit instructions <artifact> --change <name> --json`** returns what the AI needs to write one artifact: the
schema's instruction for it, its template, the paths of the artifacts it depends on, and what it unlocks.
`orbit instructions apply` returns the task list and its progress instead.

So `/orbit:continue` runs, in effect:

1. `orbit status` to find the first ready artifact;
2. `orbit instructions` for it;
3. reads the dependencies, writes the artifact, and reports what it unlocked.

`/orbit:propose` and `/orbit:ff` repeat that until every artifact is done. Because each step re-reads the state,
you can stop and resume between any two, in a new session or after editing a file by hand.

## Iteration

When implementation shows the design was wrong, edit `design.md`, and the specs or tasks if they follow from it,
then carry on with `/orbit:apply`. Apply reads the artifacts again and picks up from the unchecked tasks. Nothing
needs to be re-generated or un-done first.

Whether an edit is a refinement or a different change is a judgment; [Workflows](workflows.md#when-to-update-vs-start-fresh)
gives the tests.

## The gates

The gates are nodes in the same graph, declared in the schema beside the artifacts:

```yaml
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal, specs, design, tasks]
    cadence: [invoked, in-context]
    before: apply
    consent: user-invoked

  - id: apply
    kind: tracked
    requires: [tasks]
    tracks: tasks.md

  - id: review-system
    kind: reviewed
    requires: [apply]
    cadence: [invoked, in-context]
    before: archive
    consent: user-invoked
```

There are two kinds:

- A **tracked** gate passes when every checkbox in the file it `tracks` is checked.
- A **reviewed** gate passes when its `cadence` is covered by review passes in the change's `.orbit-runs/` trail and
  every substantive finding of those passes is resolved by a walk. [Workflows](workflows.md#the-review-cadence)
  describes the cadence.

`requires` names what must be done before the gate can be evaluated; `before` names the step the gate stands in
front of. `consent: user-invoked` marks that step as one you invoke yourself: an AI that arrives at it by any other
route asks first. The shipped schema file also carries `budget` and `confirm` keys, which no gate reads.

The position line strings the steps and gates together:

```text
propose ✓ → review(proposal) ✓ → apply ready → review(system) blocked-by-gate → archive blocked-by-gate
```

A gate's state is a pure function of the files: the artifacts, `tasks.md`, and the trail of run records. Nothing
stores it, so nothing can drift from it. The engine reports a gate; it never refuses you. A workflow that reaches an
unpassed gate tells you and asks, and records the answer.

## The trail

Every workflow run leaves a record in the change's `.orbit-runs/` directory: `propose-<TS>.json`,
`review-proposal-<TS>.json`, `address-reviews-<TS>.json`, `apply-<TS>.json` and so on, where `<TS>` is a UTC
timestamp. The AI writes only the narrative part of each record; `orbit emit` composes the rest and refuses a record
that fails its checks. The trail is what the gates read, and it moves with the change when it is archived.

## Custom schemas

A schema is a directory holding a `schema.yaml` and the artifacts' templates:

```text
orbit/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md
```

```yaml
name: research-first
version: 1
description: Research before proposing
artifacts:
  - id: research
    generates: research.md
    requires: []
  - id: proposal
    generates: proposal.md
    requires: [research]
  - id: tasks
    generates: tasks.md
    requires: [proposal]
```

```text
research ──► proposal ──► tasks
```

Schemas resolve from the project (`orbit/schemas/`) first, then your user data directory
(`~/.local/share/openspec/schemas/` on macOS and Linux), then the schemas orbit ships. Start from a copy of the
shipped one, and check it as you go:

```bash
orbit schema fork spec-driven research-first
orbit schema validate research-first
orbit schema which research-first
```

[Customization](customization.md) covers writing schemas and templates in full, and the project configuration in
`orbit/config.yaml`. The [CLI reference](cli.md#schemas) lists the schema commands.

## See also

- [Commands](commands.md): the workflows that drive this engine
- [Workflows](workflows.md): the patterns, the review cadence, and when to start a new change
- [CLI](cli.md): `orbit status`, `orbit instructions` and the rest
