# orbit-cli-name Specification

## Purpose
The old upstream name in what the package ships. Every user-visible string the CLI prints, the help it renders, the schema it ships and the skills it generates says orbit; the old name stays only for an admitted reason (OpenSpec's own artefacts, the fork base, a template never generated) and in the identifiers a user types. A source scan over the shipped files and a runtime check of `init` and every command's help hold it, with a named limit for what neither reads.
## Requirements
### Requirement: The old name appears in what the package ships only for an admitted reason

In every file the package ships or its install runs, every occurrence of `OpenSpec` or `Openspec` a user can read SHALL
be RESIDUE, and fail the suite naming the file, the line and the occurrence, unless an entry of the exact admitted list
admits it. The files are those under package.json's `files`, the three npm ships whatever `files` says, and the
build script a git install runs. What a user can read in each is:

| member | covered by |
|---|---|
| `src/**/*.ts`, which builds to `dist/` | the source scan, over the text of every string literal, no-substitution template and template part; comments and identifiers are not read |
| `schemas/**` | the source scan, over every line |
| `bin/**` and `scripts/postinstall.js` | the source scan, over every line |
| `README.md`, `LICENSE` and `package.json`, which npm ships whatever `files` says | not read by this scan: `README.md` is held by `orbit-user-docs`' residue check; `LICENSE` carries the upstream copyright notice the MIT license requires; `package.json`'s description names the fork base as `@fission-ai/openspec@1.3.1`, which the case-sensitive pattern does not match |
| `build.js`, not shipped, which `prepare` runs during the documented git install, where its console output reaches the user | the source scan, over every line |
| the `dist/` test files, maps and `__tests__` that `files` excludes | not shipped, not read |

The admitted list SHALL be exact. Each entry names a file, a substring of the admitted occurrence's line and a reason
from this closed set. An entry admits only the occurrences that lie inside a match of its substring, so another
occurrence on the same line stays residue. An entry that admits no occurrence fails the suite as stale:

| reason | admits |
|---|---|
| names OpenSpec's own artefact | the legacy-upgrade lines naming OpenSpec's markers in `src/core/legacy-cleanup.ts`, and `orbit init`'s warning about an `openspec/` project directory in `src/core/init.ts` |
| names the fork base | the onboard body's sentence naming upstream OpenSpec in `src/core/templates/workflows/onboard.ts` |
| never generated | the `feedback` skill template in `src/core/templates/workflows/feedback.ts`, which `orbit-conventions`' `Generated-file disposition` classes as not generated |

A RUNTIME check SHALL hold what the CLI prints:
- the help text of every visible command and subcommand of the program `buildProgram` builds;
- the standard output of `orbit init --tools claude` in a scratch project.

That output SHALL carry no case-insensitive `openspec` except the admitted identifier `OPENSPEC_CONCURRENCY`, an
environment variable a user sets, which `validate --help` names. The identifiers a user types keep their names:
`OPENSPEC_CONCURRENCY` and `OPENSPEC_NO_AUTO_CONFIG`. So do the rc-file markers `# OPENSPEC:START` and
`# OPENSPEC:END`, which the bash and zsh completion removers detect.

The three directory errors SHALL name the directory they looked for. `orbit update` says "No orbit/ directory found.
Run 'orbit init' first.". `orbit archive` and `orbit list` say "No orbit/changes/ directory found. Run 'orbit init'
first.".

The orbit-modified bodies' upstream portions carry these named edits in place, per `orbit-conventions`' `Generated-file
disposition`. This requirement replaces each sentence it names and no additions-section text overrides one:

| template | the sentence it replaces | becomes |
|---|---|---|
| `explore.ts` | "You MAY create OpenSpec artifacts (proposals, designs, specs) if the user asks" | "You MAY create orbit artifacts (proposals, designs, specs) if the user asks" |
| `explore.ts` | the heading `## OpenSpec Awareness` | `## Orbit Awareness` |
| `explore.ts` | "You have full context of the OpenSpec system." | "You have full context of the orbit system." |
| `explore.ts` | "Creating OpenSpec artifacts is fine, writing application code is not." | "Creating orbit artifacts is fine, writing application code is not." |
| `apply-change.ts` | the skill description and the first instruction line, "Implement tasks from an OpenSpec change." | "Implement tasks from an orbit change." |
| `apply-change.ts` | the command description "Implement tasks from an OpenSpec change (Experimental)" | "Implement tasks from an orbit change (Experimental)" |
| `new-change.ts` | the description's "Start a new OpenSpec change" | "Start a new orbit change" |
| `ff-change.ts` | the description's "Fast-forward through OpenSpec artifact creation." | "Fast-forward through orbit artifact creation." |
| `continue-change.ts` | the description's "Continue working on an OpenSpec change" | "Continue working on an orbit change" |

Named limit (the source scan). Residual kind: user-visible text that is not a literal `OpenSpec` in a shipped file: a string assembled from parts, output of a dependency, or lowercase prose "openspec" (the scan matches the product-name forms `OpenSpec`/`Openspec`; lowercase is overwhelmingly the protected paths, tags and identifiers). One lowercase occurrence is known and kept: the skill templates' `metadata.author: 'openspec'`, which every generated SKILL.md's frontmatter carries as provenance and no code reads
Residual method: the runtime check (`orbit init` in a scratch dir, `--help` for every command) asserting stdout free of the word in any case outside the admitted identifiers (the `OPENSPEC_CONCURRENCY` env var named in `validate --help`, D-cso-5); and a lowercase grep for command-form prose (`openspec <verb>`), which on 2026-10-14 matched only a comment in `src/core/project-config.ts`, which no user reads
The runtime check reads only the commands it runs. A message on a branch that neither `init` nor `--help` reaches
is held by the source scan alone.

#### Scenario: An unadmitted OpenSpec in a string literal is residue

- **WHEN** a string literal in a file under `src/` reads "Welcome to OpenSpec" and no admitted entry names that file and line
- **THEN** the source scan fails, naming the file, the line and the occurrence

#### Scenario: A comment or an identifier is not read

- **WHEN** a file under `src/` names `OpenSpec` only in a comment or in an identifier such as `hasOpenSpecMarkers`
- **THEN** the source scan passes that file

#### Scenario: A shipped schema file is read

- **WHEN** `schemas/spec-driven/schema.yaml` carries "Default OpenSpec workflow" in its description
- **THEN** the source scan fails, naming the file and the line

#### Scenario: An admitted occurrence passes and a stale admission fails

- **WHEN** an admitted entry names `src/core/legacy-cleanup.ts`, the substring "OpenSpec markers will be removed" and the reason "names OpenSpec's own artefact", and a second entry admits no occurrence
- **THEN** the source scan passes the first occurrence and fails on the second entry as stale

#### Scenario: An admission covers only the occurrence inside its substring

- **WHEN** a string literal reads "Removed OpenSpec markers. Welcome to OpenSpec" and an admitted entry names that file and the substring "Removed OpenSpec markers"
- **THEN** the source scan passes the first occurrence and fails on the second, naming the file, the line and the occurrence

#### Scenario: orbit init prints orbit

- **WHEN** `orbit init --tools claude` runs in a scratch project with no `openspec/` directory
- **THEN** its standard output carries "orbit Setup Complete" and no case-insensitive `openspec`

#### Scenario: Every command's help says orbit

- **WHEN** the help text of every visible command of the built program is rendered
- **THEN** none carries a case-insensitive `openspec` except `OPENSPEC_CONCURRENCY`

#### Scenario: A directory error names the directory

- **WHEN** `orbit list` runs where `orbit/changes/` does not exist
- **THEN** it fails with "No orbit/changes/ directory found. Run 'orbit init' first."

