# orbit-init-openspec-warning Specification

## Purpose
`orbit init`'s warning when an OpenSpec project directory sits beside the project it builds: what triggers it, what it says (that `orbit/` is separate from `openspec/`, the move steps by the state of `orbit/`, and the migration guide), and that it reports and proceeds, never prompting and never stopping. It is the one engine change R-ugd-11 carves out of the documentation program.
## Requirements
### Requirement: orbit init warns when an OpenSpec project directory sits beside it

`orbit init` SHALL print a WARNING when the project it runs in holds an OpenSpec project directory, and SHALL then
proceed exactly as without it: the warning is never a prompt, never a stop, and never changes the exit code. Upstream's
project directory is the fixed name `openspec` (upstream's `OPENSPEC_DIR_NAME` in 1.3.1 and in every release read
since, up to 1.14.1; in orbit that constant is `'orbit'`, so the detector names the literal `'openspec'`), and `specs/`
and `changes/` are the two directories its init creates. Only directories count: an `openspec`, `specs` or `changes`
that is a regular file is absent. `orbit init` disposes of the project
state by this table:

| member | covered by |
|---|---|
| no `openspec/` | silent |
| `openspec/` holding `specs/` or `changes/`, and no `orbit/` | WARN, then proceed |
| `openspec/` holding `specs/` or `changes/`, and `orbit/` present | WARN, then proceed |
| `openspec/` holding neither `specs/` nor `changes/` | silent: it is not an OpenSpec project |
| a pre-1.0 OpenSpec project (`openspec/AGENTS.md`, `openspec/project.md`) | WARN as above when it holds `specs/` or `changes/`; the legacy cleanup still runs beside it, unchanged |

The warning is printed in interactive and non-interactive runs alike, before the legacy cleanup runs and before
`orbit init` creates the `orbit/` directory structure, so a run that the legacy cleanup's prompt cancels has already
printed it. It SHALL say that `orbit/` is separate from `openspec/` and that `orbit` reads nothing in
`openspec/specs/` or `openspec/changes/`; name the move steps by the state of `orbit/`, as `orbit-user-docs`' `The migration guide opens with a
before-you-move checklist for an OpenSpec 1.x project` states them, including that a move into an existing `orbit/`
nests the project at `orbit/openspec/`; and point at the migration guide by its URL on the orbit repository, whose checklist
should be run first.

Upstream's `openspec-*` skills and `opsx` commands are not detected on their own: a project whose `openspec/` was
moved while they were kept gets no warning, and the migration guide's move steps cover it.

#### Scenario: A first init over an OpenSpec project warns and proceeds

- **WHEN** `orbit init --tools claude` runs where `openspec/specs/` exists and `orbit/` does not
- **THEN** it prints the warning naming the move steps for each state of `orbit/` and the migration guide, creates `orbit/` and the skills, and exits 0

#### Scenario: A later init beside an OpenSpec project still warns

- **WHEN** `orbit init` runs where both `openspec/changes/` and `orbit/` exist
- **THEN** it prints the warning and proceeds

#### Scenario: A pre-1.0 project warns before the legacy cleanup

- **WHEN** `orbit init` runs where `openspec/AGENTS.md` and `openspec/specs/` exist
- **THEN** the warning is printed before the legacy cleanup's summary, and the cleanup runs as before

#### Scenario: A directory that is not an OpenSpec project is silent

- **WHEN** `orbit init` runs where `openspec/` exists holding neither `specs/` nor `changes/`
- **THEN** no warning is printed

#### Scenario: A project with no openspec directory is silent

- **WHEN** `orbit init` runs where no `openspec/` exists
- **THEN** no warning is printed

