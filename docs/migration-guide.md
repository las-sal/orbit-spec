# Migrating from OpenSpec

This guide moves a project made with OpenSpec 1.x to orbit. orbit is a fork of OpenSpec 1.3.1 (see
[Built on OpenSpec](../README.md#built-on-openspec)), so a project's specs, changes and `config.yaml` carry over
unchanged in form. orbit keeps them in `orbit/` rather than `openspec/`, and its engine stayed at 1.3.1 while OpenSpec
kept releasing, so a project that uses something added after 1.3.1 needs fixing before it moves.

This guide was measured against **OpenSpec 1.14.1**: its checklist finds the forms a 1.14.1 project can hold that
orbit's engine reads differently. A form added to OpenSpec after 1.14.1 is not covered.

Run every command from the project's root, in a shell where `orbit` is installed
([Installation](installation.md)), with the project committed to git so each step can be undone.

## Before you move

Run each check against `openspec/`. A check that prints nothing found nothing. Each finds a form on disk, never a
meaning: a clean checklist shows that no known hazard is present, and nothing more.

### 1. Task lines orbit reads differently

orbit's apply gate counts `- [ ]` and `- [x]` lines, and `orbit list` counts unindented `-` and `*` boxes. Any other
form is read as done, or not read at all, so a gate can pass with work left.

```bash
grep -rnE --include=tasks.md --exclude-dir=archive '^([[:space:]]+[-*+]|[*+]|[0-9]+[.)])[[:space:]]+\[|^- \[([^] xX]|[^]]{2,})\]' openspec/changes
```

Fix: rewrite each line it prints as an unindented `- [ ]` or `- [x]`. A sub-task becomes a task of its own.

### 2. Change metadata orbit drops

orbit drops these keys from a change's `.openspec.yaml` without a warning: `skip_specs`, `retire_capabilities`,
`goal`, `affected_areas` and `initiative`. A change with `skip_specs` then fails validation for having no delta, and
one with `retire_capabilities` cannot archive.

```bash
grep -rnE --include=.openspec.yaml --exclude-dir=archive '^(skip_specs|retire_capabilities|goal|affected_areas|initiative):' openspec/changes
```

Fix: finish and archive those changes with OpenSpec before you move.

### 3. Nested capability paths

orbit reads a capability as `specs/<capability>/spec.md`, one level deep. A nested baseline
(`openspec/specs/<area>/<capability>/spec.md`) is skipped by validation, and a nested delta
(`openspec/changes/<change>/specs/<area>/<capability>/spec.md`) reads as no deltas at all.

```bash
find openspec -path '*/specs/*/*/spec.md' -not -path 'openspec/changes/archive/*'
```

Fix: flatten each to `specs/<capability>/spec.md`, in the baseline and in every change's delta alike. Where two
capabilities would flatten to the same name, rename one, for example `billing-invoices`.

### 4. A Purpose section in a delta spec

orbit validates a delta spec carrying `## Purpose`, but archiving it writes a placeholder Purpose into a new baseline
spec instead of the delta's text.

```bash
grep -rlE --include=spec.md --exclude-dir=archive '^## Purpose' openspec/changes
```

Fix: keep a copy of each Purpose it finds, and after archiving that change with orbit, replace the placeholder in
`orbit/specs/<capability>/spec.md` with it.

### 5. Specs kept in a store

orbit has no stores: it reads specs only from the repository.

```bash
grep -snE '^store:|defaultStore' openspec/config.yaml ~/.config/openspec/config.json
```

Fix: a project whose specs live in a store cannot move until they are in the repository.

### 6. Change names orbit refuses

orbit refuses a change name that begins with a digit, and archives an already dated name with a second date in front.

```bash
find openspec/changes -mindepth 1 -maxdepth 1 -type d -name '[0-9]*'
```

Fix: rename each change folder to a kebab-case name beginning with a letter, for example `add-login`.

### 7. Newer spec syntax

orbit's archive stops on a requirement heading that ends in `#` characters, and its validation fails a `*` or `+`
bullet under `## REMOVED Requirements` or `## RENAMED Requirements`.

```bash
grep -rnE --include=spec.md --exclude-dir=archive '^#+ Requirement:.*#[[:space:]]*$|^[[:space:]]*[*+] ' openspec
```

Fix: remove the closing `#` characters, and write bullets with `-`.

### 8. Configuration orbit ignores

orbit ignores the `operations` and `githubCopilot` keys of `config.yaml`, and any metadata key it does not know,
without a warning.

```bash
grep -nE '^(operations|githubCopilot):' openspec/config.yaml
grep -rnvE --include=.openspec.yaml --exclude-dir=archive '^(schema|created|skip_specs|retire_capabilities|goal|affected_areas|initiative):|^[[:space:]]|^$' openspec/changes
```

Fix: nothing is lost by moving, but nothing reads these settings either. The table below says what orbit has instead.

## Move the project

### 1. Remove OpenSpec's skills and commands

OpenSpec's skills and commands stay installed beside orbit's and keep calling `openspec`, so delete them. For Claude
Code:

```bash
rm -rf .claude/skills/openspec-* .claude/commands/opsx
```

For Codex, whose commands are global (in `$CODEX_HOME/prompts/` when `CODEX_HOME` is set, otherwise
`~/.codex/prompts/`):

```bash
rm -rf .codex/skills/openspec-* .agents/skills/openspec-* ~/.codex/prompts/opsx-*
```

The `opsx-*` prompts are shared by every project on the machine: if another project still uses OpenSpec with Codex,
leave them in place until that project moves too.

For any other tool, delete the `openspec-*` skill directories and `opsx` command files under its directory
([Supported tools](supported-tools.md) lists them). In zsh, a pattern that matches nothing stops the whole command;
leave out the paths you do not have.

### 2. Move `openspec/` to `orbit/`

What to run depends on whether `orbit/` exists yet:

```bash
ls -d orbit
find orbit -type f
```

| State of `orbit/` | What to run |
|---|---|
| No `orbit/` (the first command prints an error) | `git mv openspec orbit`, then `orbit init --tools claude` |
| `orbit/` exists, and the second command prints nothing, or only `orbit/config.yaml`: an `orbit init` created it and nothing else is in it | `rm -rf orbit`, then `git mv openspec orbit`, then `orbit init --tools claude` |
| `orbit/` exists, and the second command prints any other file: it holds orbit work | No move command: merge by hand, below |

For the first two rows:

```bash
git mv openspec orbit
orbit init --tools claude
```

with `rm -rf orbit` first in the second row. In that row the only file deleted is an `orbit/config.yaml`, which
`orbit init` writes when run interactively; your `openspec/config.yaml` moves across in its place. If you edited
`orbit/config.yaml`, keep a copy and merge what you added into the moved one. Name your own tools in place of
`claude`, for example `--tools claude,codex`.

**When `orbit/` already holds work, do not run `git mv openspec orbit`.** Work is any file besides
`orbit/config.yaml`: specs or changes, but also an architecture doc, an exploration, a schema or a lens file, none of
which `orbit/specs/` or `orbit/changes/` would show. Moving a directory into one that exists puts it inside: the
project would land at `orbit/openspec/`, where orbit reads nothing. Merge by hand instead: move each
capability folder from `openspec/specs/` into `orbit/specs/` and each change folder from `openspec/changes/` into
`orbit/changes/`, resolving any name that exists on both sides, and compare the two `config.yaml` files. Then delete
`openspec/` and run `orbit init` for your tools.

### 3. Check the result

```bash
orbit list
orbit validate --all
orbit status --change add-login
```

`orbit list` shows your active changes, `orbit validate --all` checks every spec and change, and `orbit status
--change <name>` shows a change's artifacts and gates. Nothing should be left under `orbit/openspec/`.

### 4. Stamp your active changes

orbit records, for each baseline requirement a change modifies, removes or renames, a fingerprint of the text the
change was written against, and archive refuses to overwrite a requirement that has changed since. A change made with
OpenSpec has no fingerprints, so its archive can only warn that it cannot check. Stamp each active change once:

```bash
orbit fingerprint add-login
```

A change with only added requirements needs none, and stamping it does no harm. The stamp records the baseline as
it stands now, so it guards only against edits made after it: before stamping a change that has been open a long
time, read its modified, removed and renamed requirements against the current baseline.

## What orbit does not have

| What you may use | In orbit |
|---|---|
| Tools added after OpenSpec 1.3.1 | Not init targets. [Supported tools](supported-tools.md) lists what `orbit init` accepts |
| Tool directories OpenSpec moved after 1.3.1 (Codex skills in `.agents/skills/`) | orbit writes the 1.3.1 directories: Codex skills go to `.codex/skills/` |
| `skip_specs` and `retire_capabilities` change metadata | Dropped (check 2); finish those changes with OpenSpec first |
| Stores (`store:`, `defaultStore`) | None; specs live in the repository |
| `operations` guidance and `githubCopilot` settings in `config.yaml` | Ignored |
| A warning on unknown metadata keys | None; the keys are dropped silently |
| `--language` at init | Write the language into `context` ([Multi-language](multi-language.md)) |
| `/opsx:update`; the `version` and `doctor` commands; `instructions archive`; the `--all` option of status, `--archived` of list and `--diff` of show | Not in orbit's CLI; [CLI](cli.md) lists what is |
| `--json` fields added after 1.3.1 | Not emitted; a script reading them needs updating |

## What changes for you

- **Commands are `/orbit:`**, not `/opsx:`: `/orbit:propose`, `/orbit:apply`, `/orbit:archive`, and so on.
  [Commands](commands.md) lists all 15, and every install carries all of them.
- **The CLI is `orbit`** and the project directory is `orbit/`. A change's metadata file keeps its name,
  `.openspec.yaml`, and orbit shares the global config directory `~/.config/openspec/` with OpenSpec.
- **Reviews sit between the steps.** The `spec-driven` schema adds reviewed gates: a review of the proposal before
  apply, and a review of the implementation before archive. A change you were midway through gains these gates when
  it moves; `orbit status --change <name>` shows where it stands. [Workflows](workflows.md) describes the cadence.
- **You invoke each step.** orbit recommends the next command and does not run it for you.

## Related

- [Getting started](getting-started.md)
- [Concepts](concepts.md)
- [Supported tools](supported-tools.md)
