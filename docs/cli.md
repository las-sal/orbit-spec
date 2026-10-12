# CLI reference

The `orbit` CLI sets a project up, browses and validates its changes and specs, and archives them. It also serves the
workflows: the `/orbit:` commands documented in [Commands](commands.md) call it for state and to write their records.
This page documents every command and subcommand. Each command's flags are as `orbit <command> --help` prints them.

## Summary

| Group | Commands |
|---|---|
| [Setup](#setup) | `orbit init`, `orbit update` |
| [Browsing](#browsing) | `orbit list`, `orbit view`, `orbit show`, `orbit change`, `orbit spec` |
| [Validation](#validation) | `orbit validate` |
| [Lifecycle](#lifecycle) | `orbit archive` |
| [Workflow support](#workflow-support) | `orbit status`, `orbit instructions`, `orbit templates`, `orbit schemas`, `orbit new change` |
| [Engine surfaces](#engine-surfaces) | `orbit emit`, `orbit fingerprint`, `orbit external`, `orbit pr`, `orbit architecture` |
| [Schemas](#schemas) | `orbit schema` |
| [Configuration](#configuration) | `orbit config` |
| [Utility](#utility) | `orbit feedback`, `orbit completion` |

## Human and agent commands

Most commands are for you, in a terminal. Some are mainly for the AI: the workflows call them for structured state
(`--json`) and to write their records. You can run any of them yourself; nothing is hidden from you.

| Used by | Commands |
|---|---|
| You | `orbit init`, `orbit update`, `orbit view`, `orbit config`, `orbit completion`, `orbit feedback` |
| You, and the AI with `--json` | `orbit list`, `orbit show`, `orbit validate`, `orbit status`, `orbit architecture` |
| Mainly the AI | `orbit instructions`, `orbit templates`, `orbit schemas`, `orbit new change`, and the [engine surfaces](#engine-surfaces) |

## Global options

| Option | Description |
|---|---|
| `--version`, `-V` | Print the version |
| `--no-color` | Disable color output |
| `--help`, `-h` | Print help for any command |

---

## Setup

### `orbit init`

Set orbit up in a project: create `orbit/` (`specs/`, `changes/`, `changes/archive/`) and install the workflows for
your AI tools, as skills and commands.

Usage: `orbit init [path]`, where `path` defaults to the current directory.

| Option | Description |
|---|---|
| `--tools <tools>` | The tools to configure without prompting: `all`, `none`, or a comma-separated list (`claude`, `codex`, and the other ids `orbit init --help` lists) |
| `--force` | Clean up legacy files without prompting |
| `--profile <profile>` | Accepted and inert: `core` or `custom` (see below) |

```bash
orbit init
orbit init --tools claude
orbit init --tools claude,codex
```

Claude Code and Codex are orbit's supported tools. The generator carries adapters for the other ids too, inherited
and untested; [Supported tools](supported-tools.md) describes them.

**Profiles.** `--profile` accepts `core` or `custom` and refuses any other value. Either way, `orbit init` installs all
15 workflows: every install carries the full surface. The option, and the profile in the global config, are kept from
the upstream code orbit forked; they do not choose which workflows are installed.

Run interactively, `orbit init` also offers to record your external review runner (see
[`orbit external runner`](#orbit-external-runner)).

### `orbit update`

Regenerate the project's skills and commands from the installed CLI. Run it in each project after upgrading orbit;
it downloads nothing ([Installation](installation.md#upgrade)).

Usage: `orbit update [path]`.

| Option | Description |
|---|---|
| `--force` | Regenerate even when the installed files are up to date |

```bash
orbit update
orbit update --force
```

`orbit update` takes no profile option; like `orbit init`, it installs every workflow.

---

## Browsing

### `orbit list`

List the active changes, or the specs.

| Option | Description |
|---|---|
| `--specs` | List specs instead of changes |
| `--changes` | List changes (the default) |
| `--sort <order>` | `recent` (the default) or `name` |
| `--json` | Output JSON |

```bash
orbit list
orbit list --specs
orbit list --json
```

### `orbit view`

An interactive dashboard of the project's specs and changes. It takes no options.

```bash
orbit view
```

### `orbit show`

Show a change or a spec. With no name, it prompts.

Usage: `orbit show [item-name]`.

| Option | Description |
|---|---|
| `--json` | Output JSON |
| `--type <type>` | `change` or `spec`, when the name is ambiguous |
| `--no-interactive` | Do not prompt |
| `--deltas-only` | Changes, JSON only: show only the deltas |
| `--requirements-only` | Deprecated alias of `--deltas-only` |
| `--requirements` | Specs, JSON only: requirements without scenarios |
| `--no-scenarios` | Specs, JSON only: exclude scenario content |
| `--requirement <id>`, `-r` | Specs, JSON only: one requirement, by its 1-based number |

```bash
orbit show add-dark-mode
orbit show ui --type spec --json
```

### `orbit change`

The older, noun-first form of the change commands. `orbit show`, `orbit list` and `orbit validate` cover the same
ground and are preferred.

| Subcommand | Usage | Options |
|---|---|---|
| `orbit change show` | `orbit change show [change-name]`: a change as JSON or markdown | `--json`, `--deltas-only`, `--requirements-only` (deprecated), `--no-interactive` |
| `orbit change list` | Deprecated: its help says to use `orbit list` instead | `--json`, `--long` (id and title with counts) |
| `orbit change validate` | `orbit change validate [change-name]` | `--strict`, `--json`, `--no-interactive` |

```bash
orbit change show add-dark-mode --json
```

### `orbit spec`

The noun-first form of the spec commands.

| Subcommand | Usage | Options |
|---|---|---|
| `orbit spec show` | `orbit spec show [spec-id]` | `--json`, `--requirements`, `--no-scenarios`, `--requirement <id>` / `-r`, `--no-interactive` |
| `orbit spec list` | All specs | `--json`, `--long` |
| `orbit spec validate` | `orbit spec validate [spec-id]` | `--strict`, `--json`, `--no-interactive` |

```bash
orbit spec show ui --json
orbit spec validate ui --strict
```

---

## Validation

### `orbit validate`

Validate changes and specs for structural issues, and lint marked source spans against `orbit/sources.yaml`. With no
name and no scope option, it prompts.

Usage: `orbit validate [item-name]`.

| Option | Description |
|---|---|
| `--all` | Validate every change and spec, and lint marked source spans |
| `--changes` | Validate every change |
| `--specs` | Validate every spec |
| `--sources` | Lint marked source spans only (with no `orbit/sources.yaml`, it says so and exits zero) |
| `--type <type>` | `change` or `spec`, when the name is ambiguous |
| `--strict` | Strict mode: warnings fail |
| `--json` | Output JSON |
| `--concurrency <n>` | Parallel validations, 6 by default (`orbit validate --help` names the environment variable that changes the default) |
| `--no-interactive` | Do not prompt |

```bash
orbit validate add-dark-mode
orbit validate add-dark-mode --strict
orbit validate --all --json
orbit validate --sources
```

**Change checks beyond the format.** Validating one change also reports two opt-in checks, each switched on by a key
in `orbit/config.yaml`:

- `scenario_map:`, the scenario map. Each scenario the change's delta specs add or modify should be declared by a
  test or a ledger entry. An undeclared scenario is reported at INFO until the change's apply gate passes, and as an
  error after. `orbit status --change <name> --scenarios` shows the map.
- `size_ceiling:`, the size record. A change larger than the ceiling on any dimension is a WARNING, so `--strict`
  fails, unless the proposal declares the breach in a `## Size` section. A declared breach is reported at INFO.

**Source spans.** A `src:` marker in a living document wraps a figure the engine can compute:

```markdown
The project has <!-- src:NAME -->28<!-- /src:NAME --> capabilities.
```

`orbit/sources.yaml` maps each source name to an engine fact. The lint reads the markdown files git tracks, less
any exclusions the registry declares, and fails a span that does not contain its source's current value:

```text
✗ README.md:1: source 'stages' emits "2", but the marked span reads "3"
Sources:
  stages = 2 (1 marker)
```

An unmarked figure is invisible to the lint. With `--json`, the output adds `source_findings`, `source_coverage` and
`source_domain` when a registry is present. `source_domain.scan_complete` is false when any file was not fully
examined; sources are then reported `unverified`, never passed.

---

## Lifecycle

### `orbit archive`

Archive a completed change: merge its delta specs into `orbit/specs/` and move it to
`orbit/changes/archive/<YYYY-MM-DD>-<name>/`. With no name, it prompts. The `/orbit:archive` workflow runs this with
its own checks around it (gates, user-validation tasks, the run record); prefer the workflow.

Usage: `orbit archive [change-name]`.

| Option | Description |
|---|---|
| `--yes`, `-y` | Skip confirmation prompts |
| `--skip-specs` | Skip the spec merge, for tooling or doc-only changes |
| `--no-validate` | Skip validation (not recommended; asks to confirm) |
| `--override-fingerprints` | Merge past a base-fingerprint divergence, overwriting the live requirement (a deliberate, recorded act) |

```bash
orbit archive add-dark-mode
orbit archive add-dark-mode --yes
```

Before merging, archive compares each requirement the change touches with the fingerprint taken when the change was
proposed. If another change has edited it since, archive refuses rather than overwrite it silently (see
[`orbit fingerprint`](#orbit-fingerprint)).

---

## Workflow support

### `orbit status`

Where things are. With no options it is the orientation view: the changes in flight, what each did last, and what is
ready next.

| Option | Description |
|---|---|
| `--change <id>` | One change: its artifacts, its gates, its position and what is eligible next |
| `--full` | The program view: every architecture doc's stages, every workstream, the last action, and what waits on you |
| `--report [ts]` | With `--change`: render a review pass as the engine's report (the newest pass, or the one at `<ts>`) |
| `--boot` | With `--change`: the cold-start sequence, pointers into the change's artifacts for a new session |
| `--scenarios` | With `--change`: the scenario map, which test or ledger entry declares each delta scenario |
| `--schema <name>` | Override the schema (read from the change by default) |
| `--json` | Output JSON |

```bash
orbit status
orbit status --full
orbit status --change add-dark-mode
orbit status --change add-dark-mode --report
orbit status --change add-dark-mode --json
```

The change view ends with the position and the `Ready when you are:` line. Gate states are computed from the
change's files, never stored.

### `orbit instructions`

The enriched instructions for creating one artifact (its template, its dependencies and what it unlocks), or, with
`apply`, the task list and its progress. The workflows call it.

Usage: `orbit instructions [artifact]`.

| Option | Description |
|---|---|
| `--change <id>` | The change |
| `--schema <name>` | Override the schema |
| `--json` | Output JSON |

```bash
orbit instructions design --change add-dark-mode --json
orbit instructions apply --change add-dark-mode --json
```

### `orbit templates`

The resolved template path of every artifact in a schema.

| Option | Description |
|---|---|
| `--schema <name>` | The schema, `spec-driven` by default |
| `--json` | Output JSON, mapping artifact ids to paths |

```bash
orbit templates --json
```

### `orbit schemas`

List the available workflow schemas with their descriptions.

| Option | Description |
|---|---|
| `--json` | Output JSON |

```bash
orbit schemas
```

### `orbit new change`

Create an empty change directory, `orbit/changes/<name>/`, with its metadata. `/orbit:new` and `/orbit:propose`
call it.

Usage: `orbit new change <name>`.

| Option | Description |
|---|---|
| `--description <text>` | Also write a `README.md` in the change, holding this description |
| `--schema <name>` | The workflow schema, `spec-driven` by default |

```bash
orbit new change add-dark-mode
```

---

## Engine surfaces

orbit's workflows call these commands to write their records and to read state the engine computes. You rarely need
them by hand; they are documented so that what the workflows do is visible.

### `orbit emit`

Compose and write a run summary: the record each workflow leaves in a trail, `.orbit-runs/<command>-<TS>.json`. The
AI supplies only the narrative fields, in a payload; the engine composes the rest (timestamps, counts, gate state,
what is next) and refuses a payload that fails its checks.

Usage: `orbit emit <emit-command>`, where `<emit-command>` is one of `explore`, `propose`, `new`, `continue`, `ff`,
`apply`, `verify`, `architect`, `review`, `address-reviews`, `audit-drift`, `review-external` or `archive`.

| Option | Description |
|---|---|
| `--change <name>` | The target change, or the exploration for an explore emit |
| `--doc <doc-name>` | The target architecture doc, for architecture-scoped commands |
| `--payload <file>` | The payload JSON file (otherwise read from stdin) |
| `--json` | Print one `{path, emit, render?}` object |
| `--render` | Proposal and system review emits: print the engine's report after writing |

```bash
orbit emit apply --change add-dark-mode --payload payload.json
```

### `orbit fingerprint`

Stamp or check the base fingerprints of a change: a hash of each baseline requirement the change's delta specs touch,
taken when the change is proposed. Archive compares them to refuse a silent overwrite of another change's edits.

Usage: `orbit fingerprint <change-name>`. With no option it stamps the missing fingerprints and leaves existing ones.

| Option | Description |
|---|---|
| `--check` | Recompute and report each requirement's status; never writes. Exits non-zero when a requirement has diverged or gone missing |
| `--refresh` | Overwrite the existing fingerprints (a deliberate re-stamp after reconciling) |
| `--json` | Output JSON |

```bash
orbit fingerprint add-dark-mode --check
```

### `orbit external`

External review: the other AI that reviews a change from outside the session.

#### `orbit external runner`

Print your recorded external runner, resolved, without running it. The runner is a per-user record, `externalRunner`
in the global config: `{"preset": "codex"}` or `{"argv": [...]}`, never a shell string. `orbit init` offers to
record it; [`orbit config`](#orbit-config) edits it.

| Option | Description |
|---|---|
| `--json` | Output JSON |

```bash
orbit external runner
```

#### `orbit external save`

Save an external AI's raw return into a change's trail as `external-<mode>-<TS>.md`. The review workflow calls it
after a runner finishes; run it yourself when you pasted the review to another AI by hand and saved its answer.

Usage: `orbit external save <change-name> --as <mode> --from <path>`; both options are required.

| Option | Description |
|---|---|
| `--as <mode>` | Required. The review mode: `proposal` or `system` |
| `--from <path>` | Required. The raw return file |
| `--launch <token>` | The launch's token; refuses a return that a later apply made stale |
| `--json` | Output JSON |

```bash
orbit external save add-dark-mode --as proposal --from return.md
```

### `orbit pr`

The pull-request lifecycle, for projects that set `pr:` in `orbit/config.yaml` (`never` by default; `per-proposal`
or `per-architecture`). Each subcommand observes the repository and the remote and prints the writes the workflow
then performs; it never writes itself. Merging stays yours.

| Subcommand | Usage | What it prints |
|---|---|---|
| `orbit pr select` | `orbit pr select <name>` | Propose and ff, phase 1: the branch to work on, and the switch |
| `orbit pr publish` | `orbit pr publish <change-name>` | Propose and ff, phase 3: the commit scope, and the push and draft-PR segments |
| `orbit pr preflight` | `orbit pr preflight <change-name>` | Archive, before the move: checks the PR attachment and decides one outcome |
| `orbit pr tail` | `orbit pr tail <change-name>` | Archive, after the move: the commit scope and the PR steps, from the preflight's outcome |
| `orbit pr program` | `orbit pr program <doc>` | The architect's arc-done readout: the program's PR, its live state, and the acts left to you |

Each takes `--json`. `orbit pr tail` also takes `--outcome <code>` (the preflight's outcome, verbatim) and
`--include <path>` (repeatable: an extra edit to add to the commit).

```bash
orbit pr select add-dark-mode --json
orbit pr preflight add-dark-mode --json
```

### `orbit architecture`

The architecture tier: a program of changes declared as stages in a doc under `orbit/architecture/`, with each
stage's state computed from disk. `/orbit:architect` authors the docs.

| Subcommand | Usage | Description |
|---|---|---|
| `orbit architecture status` | `orbit architecture status` | Every doc's stages and their computed states, grouped as parseable, legacy or malformed |
| `orbit architecture show` | `orbit architecture show <doc> [stage]` | One stage's section, or the doc's stage index |
| `orbit architecture validate` | `orbit architecture validate <doc>` | Check a doc's structure: heading form, slot syntax, unique ids, resolvable dependencies |

Each takes `--json`.

```bash
orbit architecture status
orbit architecture show my-program first-stage
```

---

## Schemas

A schema defines a workflow: its artifacts, their dependencies, and its gates. orbit ships `spec-driven`.
[Customization](customization.md) describes writing your own.

### `orbit schema`

| Subcommand | Usage | Options |
|---|---|---|
| `orbit schema which` | `orbit schema which [name]`: where a schema resolves from | `--json`, `--all` (every schema and its source) |
| `orbit schema validate` | `orbit schema validate [name]`: check a schema's structure and templates | `--json`, `--verbose` |
| `orbit schema fork` | `orbit schema fork <source> [name]`: copy a schema into the project to customize | `--json`, `--force` (overwrite) |
| `orbit schema init` | `orbit schema init <name>`: create a project-local schema | `--json`, `--description <text>`, `--artifacts <list>` (comma-separated ids), `--default` / `--no-default` (set it, or do not prompt to set it, as the project default), `--force` |

```bash
orbit schema fork spec-driven my-workflow
orbit schema validate my-workflow
orbit schema which --all
```

---

## Configuration

### `orbit config`

Your global, per-user configuration. `orbit config path` prints its location (by default
`~/.config/openspec/config.json` on macOS and Linux). A project's own settings live in `orbit/config.yaml`, described
in [Customization](customization.md).

`orbit config` takes `--scope <scope>`; only `global` is supported.

| Subcommand | Usage | Description |
|---|---|---|
| `orbit config path` | `orbit config path` | Print the config file's location |
| `orbit config list` | `orbit config list` | Every setting (`--json` for JSON) |
| `orbit config get` | `orbit config get <key>` | One value, raw |
| `orbit config set` | `orbit config set <key> <value>` | Set a value, coercing its type (`--string` keeps it a string; `--allow-unknown` admits an unknown key) |
| `orbit config unset` | `orbit config unset <key>` | Remove a key, reverting it to its default |
| `orbit config reset` | `orbit config reset --all` | Reset everything (`--all` is required; `--yes` / `-y` skips the prompt) |
| `orbit config edit` | `orbit config edit` | Open the file in `$EDITOR` (or `$VISUAL`) |
| `orbit config profile` | `orbit config profile [preset]` | The profile settings; see below |

```bash
orbit config list
orbit config set externalRunner.preset codex
orbit config unset externalRunner
```

`externalRunner.preset` is the one nested path `orbit config set` accepts. To record your own runner as an argv array,
use `orbit config edit`.

#### `orbit config profile`

Run interactively, `orbit config profile` sets two things:

- **Delivery:** how workflows are installed, as skills, as commands, or both (the default). This setting is honored:
  the next `orbit update` installs accordingly.
- **Workflows:** a selection of workflows. It is stored, but it does not limit what is installed: every install
  carries all 15 workflows.

With a preset, `orbit config profile core` stores the `core` profile and its workflow list without prompting, and
leaves delivery as it was; any other preset is refused. After a change, it offers to run `orbit update` in the
current project.

`orbit config list` prints the stored profile and workflow selection. They describe the setting, not the
installation, which is always the full set.

---

## Utility

### `orbit feedback`

File feedback as an issue on orbit's tracker, [las-sal/orbit-spec](https://github.com/las-sal/orbit-spec/issues).
With the GitHub CLI installed and signed in, it files the issue directly. Otherwise it prints the issue and a link to
file it by hand.

Usage: `orbit feedback <message>`; the message becomes the issue's title.

| Option | Description |
|---|---|
| `--body <text>` | A longer description |

```bash
orbit feedback "Status readout hides the walk" --body "Steps to reproduce: ..."
```

### `orbit completion`

Shell completion for `orbit`, for `zsh`, `bash`, `fish` and `powershell`. With no shell named, it detects yours.

| Subcommand | Usage | Options |
|---|---|---|
| `orbit completion generate` | `orbit completion generate [shell]`: print the script | none |
| `orbit completion install` | `orbit completion install [shell]` | `--verbose` |
| `orbit completion uninstall` | `orbit completion uninstall [shell]` | `--yes` / `-y` |

```bash
orbit completion install
orbit completion generate zsh
```

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | An error: a validation failure, a missing file, a refused write |
| `130` | An interactive `orbit config` prompt was cancelled |

## Environment variables

| Variable | Description |
|---|---|
| `EDITOR` or `VISUAL` | The editor `orbit config edit` opens |
| `NO_COLOR` | Set to `1` to disable color output |
| `XDG_CONFIG_HOME` | Where the global config lives, when set |

## Related

- [Commands](commands.md): the `/orbit:` workflows
- [Workflows](workflows.md): the patterns and the review cadence
- [Workflow engine](workflow-engine.md): how the workflows use `orbit status` and `orbit instructions`
- [Customization](customization.md): project config and custom schemas
