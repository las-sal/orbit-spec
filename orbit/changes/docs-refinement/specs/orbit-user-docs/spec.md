## ADDED Requirements

### Requirement: The user docs' start sections name the architect workflow first

The START-SECTIONS CHECK SHALL read the user docs' START SECTIONS, each named by (page, heading), and in each one the
first START COMMAND named SHALL be `/orbit:architect` (R-rda-1, R-rda-2; `orbit-architect`'s `Start surfaces name the
architect workflow first`). A page is parsed as the improvement-claims check parses `README.md` (markdown-it). A
SECTION is the text from its heading to the next heading of the same or a higher level, or the end of the file, fences
included. A START COMMAND is one of `architect`, `explore`, `new`, `propose` or `ff`, met in either of two
forms: a `/orbit:<id>` mention, or, inside a fence, `<id>` followed by ` ──►` (the flow-diagram form the docs draw).
The start sections are exactly this table, held in the test as an exact list:

| member | covered by |
|---|---|
| `README.md` › `### Your first change` | listed |
| `docs/getting-started.md` › `## The change` | listed |
| `docs/workflows.md` › `### One change, start to finish` | listed |
| `docs/workflows.md` › `### Exploring first` | listed |
| `docs/workflows.md` › `## Practices` | listed |
| `docs/workflow-engine.md` › `## Actions, not phases` | listed |
| `docs/concepts.md` › `## Artifacts` | listed |
| `README.md`'s command table, `docs/commands.md` › `## Quick reference` | not listed: a reference order, not a suggestion |
| `docs/cli.md`, `docs/migration-guide.md`, `docs/supported-tools.md`, and every other passage | not listed: commands named as reference or example, never as where to start |

The check fails the suite, naming the page, the heading and the reason, when a listed section's first start command is
not `architect`, when a listed section names no start command, or when a listed heading is not found on its page, so
a renamed or deleted heading never passes empty. A section may describe explore, new or propose after architect; the
check reads ORDER, never absence (R-rda-2: an architect session is never required).

Named limit: the list is the result of a sweep over today's pages, and a start passage can be written anywhere.
Residual kind: a passage that suggests where new work starts under a heading the list does not name, or one that steers to explore without naming a command
Residual method: `orbit-architect`'s residual grep ("start", "begin", "first change", "new work", "entry", "create") run over README.md and docs/ whenever a change edits a user doc, each hit classified against this table

#### Scenario: Every listed section leads with architect

- **WHEN** the start-sections check reads the shipped user docs
- **THEN** each listed section's first start command is `/orbit:architect` and the suite passes

#### Scenario: A section that leads with explore fails

- **WHEN** a listed section names `/orbit:explore` before `/orbit:architect`
- **THEN** the suite fails, naming the page, the heading and the command found first

#### Scenario: A flow diagram is read as a start

- **WHEN** a listed section's fence draws `explore ──► propose` before any architect
- **THEN** the suite fails, naming `explore` as the first start command

#### Scenario: A missing heading fails

- **WHEN** a listed heading is not found on its page
- **THEN** the suite fails, naming the page and the heading

## MODIFIED Requirements

### Requirement: The user docs are a checked surface, gated by an exact pending-rewrite list

The USER DOCS SHALL be `README.md` at the repository root and every `*.md` file directly under `docs/` (the glob is
non-recursive). Every check this capability states, and every sweep `orbit-cli-grammar` extends to the user docs,
SHALL read a user doc unless it is on the PENDING-REWRITE LIST: `test/core/user-docs/pending-rewrite.json`, a JSON
array of repository-relative paths. The list is exact in both directions, by this table:

| member | covered by |
|---|---|
| listed, fails at least one check | skipped: owed to the stage that rewrites it |
| listed, passes every check | the suite FAILS naming the file, so a finished file cannot stay listed |
| unlisted, passes every check | passes |
| unlisted, fails a check | the suite FAILS naming file, line and check |
| a listed path that names no user doc | the suite FAILS naming the stale entry |
| a user doc added later, unlisted | held to every check from its first commit |

A listed file's "every check" is the FILE-LOCAL set, each run over that file alone: the residue check, the `orbit`
snippet sweep, the `git`/`gh` sweep, the tool inventory's unknown-head rule, the improvement-claims check (which
reads `README.md` alone and passes every other file), the command-coverage check (which reads `docs/cli.md` and
`docs/commands.md` and passes every other file), the carried-by check (which reads the four concept pages its
requirement names and passes every other file), the tool-coverage check (which reads `docs/supported-tools.md`
and passes every other file), and the start-sections check (which reads the pages its requirement lists and passes
every other file). The rules that hold over the user
docs as a WHOLE — an unused `docs-inventory` declaration and the non-vacuity floors — are never run on one listed
file, because no single file can decide them; they run over the unlisted user docs together.

A file leaves the list only by the edit of the stage that rewrites it. While a file is listed it has no protection:
the program this capability serves is run as one sequence and validated by use at its end, so interim states are
not defended.

#### Scenario: An unlisted doc is held to every check

- **WHEN** a user doc that is not on the pending-rewrite list carries a failing snippet or residue
- **THEN** the suite fails, naming the file, the line and the check

#### Scenario: A finished file cannot stay listed

- **WHEN** a listed user doc passes every check
- **THEN** the suite fails, naming the file to remove from the list

#### Scenario: A clean listed page is finished whatever the docs fence declares

- **WHEN** a listed user doc passes the file-local checks and uses none of the heads the `docs-inventory` fence declares
- **THEN** the suite fails naming it as finished; no unused-declaration failure is reported against it

#### Scenario: A stale entry fails

- **WHEN** the pending-rewrite list names a path that is not a user doc
- **THEN** the suite fails, naming the entry
