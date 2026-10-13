# Customization

You can shape orbit at three levels: the project's `orbit/config.yaml`, a custom schema in the project, and
user-level schemas shared by every project on the machine. The config's `schema`, `context` and `rules`, and schemas
with their templates, are inherited unchanged from orbit's 1.3.1 baseline (see [Built on](../README.md)); orbit adds
config keys for its own layer and a `gates:` list to schemas.

## Project configuration

`orbit/config.yaml` sets a default schema, gives the AI your project's context, and adds rules for particular
artifacts. Run interactively (or with `--force`), `orbit init` writes a starter file holding `schema: spec-driven`; a
non-interactive init without `--force` writes none, and you can create it by hand:

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js, PostgreSQL
  API style: RESTful, documented in docs/api.md
  Testing: Jest + React Testing Library
  We value backwards compatibility for all public APIs

rules:
  proposal:
    - Include a rollback plan
    - Identify affected teams
  specs:
    - Reference existing patterns before inventing new ones
```

- **`schema`** is the schema a new change uses when you do not name one.
- **`context`** is injected into the instructions for every artifact.
- **`rules`** are injected only into the instructions for the artifact they are keyed by (`proposal`, `specs`,
  `design`, `tasks`, or a custom schema's artifact ids).

When the AI asks for an artifact's instructions, it receives your context, the rules for that artifact, and the
schema's template, in that order. You can see exactly what it receives:

```bash
orbit instructions proposal --change my-change
```

A schema is chosen in this order: the `--schema` option on the command, then the change's own metadata
(`.openspec.yaml` in the change folder), then `schema` in `orbit/config.yaml`, then `spec-driven`.

Carried by: the 1.3.1 baseline

## orbit's config keys

orbit reads five more optional keys from `orbit/config.yaml`. Each is off, or at its default, when absent.

| Key | What it does |
|---|---|
| `review_preference` | Per reviewed gate, which review the readout presents when nothing covers the gate's first slot: `blind-pair` (the default), `fresh` or `external`. It changes only what is suggested: any independent review you invoke covers the slot. |
| `models` | Hints appended to the `Ready when you are:` line, keyed by a phase or a review class, for example `fresh: "any frontier model, clean context"`. Each value is one line of at most 80 characters. |
| `pr` | The pull-request regime: `never` (the default), `per-proposal` (each change gets a branch and a draft PR at propose, marked ready at archive), or `per-architecture` (the changes of one architecture doc share one program PR). Merging is always yours. |
| `scenario_map` | Turns on the scenario map: `tests` lists globs of test files whose `// @scenario` tags declare which delta scenario each test covers, and `orbit validate <change>` reports undeclared scenarios. |
| `size_ceiling` | Maxima for a change's size: `capabilities`, `requirements`, `changed_bytes` and `tasks`. `orbit validate <change>` warns when a change exceeds one without declaring it in a `## Size` section of its proposal. |

A complete example:

```yaml
review_preference:
  review-proposal: fresh
  review-system: blind-pair
models:
  external: "a different AI from the session's"
pr: per-proposal
scenario_map:
  tests: ['test/**/*.test.ts']
size_ceiling:
  capabilities: 3
  requirements: 12
  changed_bytes: 40960
  tasks: 19
```

Carried by: `orbit-engine-gates`, `orbit-pr-lifecycle`, `orbit-scenario-map`, `orbit-change-size`

## Custom schemas

A schema defines a change's artifacts, the order they are written in, and the gates between them. When the project
config is not enough, write your own. Project schemas live in `orbit/schemas/<name>/` and are versioned with your
code:

```text
your-project/
├── orbit/
│   ├── config.yaml
│   ├── schemas/
│   │   └── my-workflow/
│   │       ├── schema.yaml
│   │       └── templates/
│   ├── specs/
│   └── changes/
└── src/
```

### Fork the built-in schema

The quickest start is a copy of `spec-driven`, which brings its gates with it:

```bash
orbit schema fork spec-driven my-workflow
```

This copies `schema.yaml` and its templates (`proposal.md`, `spec.md`, `design.md`, `tasks.md`) to
`orbit/schemas/my-workflow/`, where you edit them.

### Create one from scratch

```bash
orbit schema init rapid --description "Rapid iteration workflow" --artifacts "proposal,tasks" --default
```

Run without options, `orbit schema init <name>` asks for them.

### The artifacts

```yaml
name: my-workflow
version: 1
description: My team's custom workflow

artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document
    template: proposal.md
    instruction: |
      Create a proposal that explains WHY this change is needed.
    requires: []

  - id: design
    generates: design.md
    description: Technical design
    template: design.md
    instruction: |
      Create a design document explaining HOW to implement.
    requires:
      - proposal

  - id: tasks
    generates: tasks.md
    description: Implementation checklist
    template: tasks.md
    requires:
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
```

| Field | Purpose |
|---|---|
| `id` | The artifact's identifier, used in commands and in `rules` |
| `generates` | The file it writes; a glob such as `specs/**/*.md` for several |
| `template` | Its template file, under `templates/` |
| `instruction` | What the AI is told when writing it |
| `requires` | The artifacts that must exist before it can be written |

The `apply` block names what implementation needs and the checklist it tracks. orbit reads it as a tracked gate with
the id `apply` (below).

### Templates

A template is a markdown file the AI fills in for its artifact. It is injected into the instructions after your
context and rules:

```markdown
## Why

<!-- The motivation. What problem does this solve? -->

## What Changes

<!-- What changes. Name new capabilities and modifications. -->

## Impact

<!-- Affected code, APIs, dependencies, systems -->
```

A template can hold the section headings the AI fills in, HTML comments that guide it, and examples of the shape you
expect.

### Check, use and locate a schema

```bash
orbit schema validate my-workflow
orbit new change my-feature --schema my-workflow
orbit schema which my-workflow
orbit schema which --all
```

`orbit schema validate` checks the YAML, that every template exists, that no dependency is circular and that every
id is valid. To make a schema the project default, set `schema: my-workflow` in `orbit/config.yaml`. `orbit schema
which` reports where a schema resolves from: the project, the user directory or the package.

User-level schemas live in `~/.local/share/openspec/schemas/` (or under `$XDG_DATA_HOME`) and are shared by every
project on the machine. Project schemas are usually the better choice, because they are versioned with your code.

Carried by: the 1.3.1 baseline

## Gates in a schema

A schema can declare a `gates:` list: the checks between its artifacts and the lifecycle phases. A gate is one of two
kinds:

- **`tracked`** passes when every checkbox in the file it `tracks` is checked. An `apply:` block is read as a
  tracked gate with the id `apply`; declare one or the other, not both.
- **`reviewed`** passes when the reviews its `cadence` names have run and every CRITICAL and WARNING finding is
  resolved by a walk. Its state is computed from the review trail in the change's `.orbit-runs/` directory.

This is the gates list of the built-in `spec-driven` schema, abridged: the shipped file also carries `confirm:` on
both reviewed gates and an `instruction:` on the apply gate (both in the table below).

```yaml
gates:
  - id: review-proposal
    kind: reviewed
    requires: [proposal, specs, design, tasks]
    inputs: [proposal, specs, design, tasks]
    cadence: [invoked, in-context]
    budget: 3
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
    budget: 3
    before: archive
    consent: user-invoked
```

| Field | Purpose |
|---|---|
| `id` | The gate's identifier, unique among gates and artifacts |
| `kind` | `tracked` or `reviewed`; nothing else is accepted |
| `requires` | The artifacts and gates that must be complete before the gate can be run |
| `tracks` | A tracked gate's checklist file |
| `inputs` | A reviewed gate's declared freshness scope, defaulting to `requires`. No version of the engine reads it yet: today a review goes stale only when an apply runs after it, so an edit to an input during the proposal phase does not make a passed review stale |
| `cadence` | A reviewed gate's ordered review slots, each `in-context`, `fresh`, `external`, `independent` (a fresh or an external review), `blind-pair` (one of each, blind to each other) or `invoked` (what you invoked: one independent review or a complete pair) |
| `budget` | The number of independent reviews you expect to spend: a declaration, carried in `orbit status --change <name> --json` beside the spend and never enforced. Readouts show only the spend, the independent reviews actually run |
| `before` | What the gate holds: an artifact or gate id, or the phase `apply` or `archive` |
| `consent` | `user-invoked`: entering the `before` phase needs your explicit invocation; an AI that arrives there on its own asks first |
| `confirm` | `no-new-findings` or `findings-resolved`; accepted so that older schemas stay valid, and read by no gate |
| `instruction` | A tracked gate's instruction, shown when the AI asks for the phase's instructions |

A gate never blocks you outright. When you run a phase whose gate has not passed, the workflow says so and asks
whether to proceed, and a decision to proceed is recorded. `orbit status --change <name>` shows each gate's state.

Carried by: `orbit-engine-gates`, `orbit-lifecycle-consent`

## Related

- [Workflow engine](workflow-engine.md)
- [Workflows](workflows.md)
- [CLI](cli.md)
