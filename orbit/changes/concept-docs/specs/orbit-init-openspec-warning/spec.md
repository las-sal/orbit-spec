## ADDED Requirements

### Requirement: orbit init warns when an OpenSpec project directory sits beside it

`orbit init` SHALL print a WARNING when the project it runs in holds an OpenSpec project directory, and SHALL then
proceed exactly as without it: the warning is never a prompt, never a stop, and never changes the exit code. Upstream's
project directory is the fixed name `openspec` (its `OPENSPEC_DIR_NAME` in 1.3.1 and in every release read since, up
to 1.14.1), and `specs/` and `changes/` are the two directories its init creates. `orbit init` disposes of the project
state by this table:

| member | covered by |
|---|---|
| no `openspec/` | silent |
| `openspec/` holding `specs/` or `changes/`, and no `orbit/` | WARN, then proceed |
| `openspec/` holding `specs/` or `changes/`, and `orbit/` present | WARN, then proceed |
| `openspec/` holding neither `specs/` nor `changes/` | silent: it is not an OpenSpec project |
| a pre-1.0 OpenSpec project (`openspec/AGENTS.md`, `openspec/project.md`) | WARN as above when it holds `specs/` or `changes/`; the legacy cleanup still runs beside it, unchanged |

The warning is printed in interactive and non-interactive runs alike, before `orbit init` creates the `orbit/`
directory structure. It SHALL say that `orbit/` is separate from `openspec/` and that `orbit` reads nothing in
`openspec/`; name the move steps (delete upstream's `openspec-*` skills and `opsx` commands, move `openspec/` to
`orbit/`, run `orbit init` again); and point at the migration guide by its URL on the orbit repository, whose checklist
should be run first.

Upstream's `openspec-*` skills and `opsx` commands are not detected on their own: a project whose `openspec/` was
moved while they were kept gets no warning, and the migration guide's move steps cover it.

#### Scenario: A first init over an OpenSpec project warns and proceeds

- **WHEN** `orbit init --tools claude` runs where `openspec/specs/` exists and `orbit/` does not
- **THEN** it prints the warning naming the move steps and the migration guide, creates `orbit/` and the skills, and exits 0

#### Scenario: A later init beside an OpenSpec project still warns

- **WHEN** `orbit init` runs where both `openspec/changes/` and `orbit/` exist
- **THEN** it prints the warning and proceeds

#### Scenario: A directory that is not an OpenSpec project is silent

- **WHEN** `orbit init` runs where `openspec/` exists holding neither `specs/` nor `changes/`
- **THEN** no warning is printed

#### Scenario: A project with no openspec directory is silent

- **WHEN** `orbit init` runs where no `openspec/` exists
- **THEN** no warning is printed
