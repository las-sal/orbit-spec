## ADDED Requirements

### Requirement: The reference pages name every command and every workflow

The COMMAND-COVERAGE CHECK SHALL fail the suite when `docs/cli.md` does not name a visible command path of the program
or `docs/commands.md` does not name a workflow id, naming the page and each missing path or id. It is a file-local
check that reads those two pages and passes every other user doc, so the suite runs it as it runs every file-local
check: over the unlisted user docs, and, in the pending-rewrite list's exactness rule, over a listed page alone. Its
domain is read from the code, never typed into the test, by this table:

| member | covered by |
|---|---|
| a visible top-level command of the program `buildProgram` returns (`src/cli/program.ts`) | owed by `docs/cli.md`, as the path `orbit <command>` |
| a visible subcommand, at any depth | owed by `docs/cli.md`, as the full path `orbit <command> <subcommand>…` |
| a hidden command (commander's `_hidden`, as `fromProgram` in `test/helpers/registry-parity.ts` reads it) and everything under it | not owed |
| a workflow id in `ALL_WORKFLOWS` (`src/core/profiles.ts`) | owed by `docs/commands.md`, as `/orbit:<id>` |
| a flag | not owed: the `orbit` snippet sweep parses every documented flag |

The command tree is the program the completion registry is held equal to (`orbit-cli-grammar`), and `ALL_WORKFLOWS`
is the installed workflow surface, so the two sources between them are every command a user can type.

A page NAMES a command path `orbit <words>` when its text carries that string, with no letter, digit, `_`, `/`, `.`
or `-` immediately before `orbit` and no letter, digit, `_` or `-` immediately after the last word; the words are
separated by single spaces. It NAMES a workflow id when its text carries `/orbit:<id>` with no letter, digit, `_` or
`-` immediately after. Text is the whole file, fences and inline code included. A path names each of its prefixes,
so `orbit pr select` names `orbit pr`.

The check reads names; it never judges whether a page teaches the command it names. That stays review's.

#### Scenario: A command the CLI page does not name fails

- **WHEN** `docs/cli.md` is unlisted and nowhere carries `orbit fingerprint`
- **THEN** the suite fails naming `docs/cli.md` and `orbit fingerprint`

#### Scenario: A subcommand names its parent

- **WHEN** `docs/cli.md` carries `orbit pr select` and never `orbit pr` on its own
- **THEN** the path `orbit pr` is named

#### Scenario: A longer word is not a name

- **WHEN** `docs/cli.md` carries `orbit validated` and never `orbit validate`
- **THEN** the path `orbit validate` is not named

#### Scenario: A hidden command is not owed

- **WHEN** `docs/cli.md` never names `orbit experimental` or `orbit __complete`
- **THEN** the check reports neither

#### Scenario: A workflow the commands page does not name fails

- **WHEN** `docs/commands.md` is unlisted and nowhere carries `/orbit:audit-drift`
- **THEN** the suite fails naming `docs/commands.md` and `/orbit:audit-drift`

#### Scenario: Every other user doc passes

- **WHEN** a user doc other than `docs/cli.md` and `docs/commands.md` names no command at all
- **THEN** the command-coverage check passes it

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
reads `README.md` alone and passes every other file), and the command-coverage check (which reads `docs/cli.md` and
`docs/commands.md` and passes every other file). The rules that hold over the user
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
