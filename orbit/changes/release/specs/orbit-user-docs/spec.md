## ADDED Requirements

### Requirement: The user docs state orbit's current version as package.json's

The VERSION CHECK SHALL read every VERSION TOKEN in the user docs, and each SHALL equal `package.json`'s `version`,
or be ADMITTED by an entry of an exact admitted list held in the test. A VERSION TOKEN is three dot-separated runs of
digits, optionally prefixed by `v`, neither preceded by a letter, digit or dot nor followed by a letter, a digit or a
dot that is followed by a digit (a sentence-ending period does not hide a token). A token equal to `v<version>` or
`<version>` is CURRENT. An INSTALL TARGET — `github:las-sal/orbit-spec#v<x>` — SHALL be current whatever the
admitted list says: no admission applies to it. A VALUE admission compares the token with any leading `v` removed, so
`1.3.1` admits `v1.3.1`. A PHRASE admission matches the file's text read with each line break, and the indentation
after it, as one space, so a phrase the page wraps still matches; each token it admits is still reported at its own
line. The list is exact, by this table, which is the measurement of 2026-10-15: a grep for the token
over `README.md` and `docs/*.md`, every hit classified:

| member | covered by |
|---|---|
| an install target `github:las-sal/orbit-spec#v<x>` (`README.md`, `docs/installation.md`) | current: `<x>` is `package.json`'s version, and no admission applies |
| a stated version `orbit --version` prints (`README.md`, `docs/installation.md`) | current |
| `docs/installation.md`'s `#v<x>` naming the tag in prose | current |
| `README.md`'s "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0" | admitted by PHRASE: an entry (file, phrase) admits the tokens inside each occurrence of that phrase in that file, a line break read as a space; true at every later version |
| `1.3.1` and `v1.3.1` (the upstream baseline, on many pages) | admitted by VALUE: not orbit's version, because orbit's versions begin at 2.0.0 |
| `1.14.1` (`docs/migration-guide.md`'s measured upstream version) | admitted by VALUE, owned by `The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project` |
| `20.19.0` (the Node floor in `README.md` and `docs/installation.md`) | admitted by VALUE: the `engines` range, not orbit's version |
| any other token | fails |

The check fails the suite, naming the file, the line, the token and `package.json`'s version, when a token is neither
current nor admitted. It fails naming the page when `README.md` or `docs/installation.md` carries no install command
`npm install -g github:las-sal/orbit-spec#v<version>`, so dropping every install command never passes empty, and
a current tag named in prose never stands in for one. Both rules are file-local: run over one doc alone, the check reports that doc's
tokens, and the install-command rule applies to the page it reads when that page is one of the two. The list's exactness is a
WHOLE-DOCS rule, run over the unlisted user docs together and never over one listed file: it fails naming the entry
when an admitted entry admits no token in them, so a stale admission never lingers.

#### Scenario: The shipped docs state the current version

- **WHEN** the version check reads the shipped user docs at `package.json`'s version
- **THEN** every token is current or admitted, every admitted entry admits a token, and the suite passes

#### Scenario: A stale install pin fails

- **WHEN** a user doc carries `#v2.0.0` while `package.json` says `2.0.1`
- **THEN** the suite fails, naming the file, the line, the token and the version

#### Scenario: A stale version in prose fails, sentence-ending period and all

- **WHEN** a user doc says `orbit --version` prints `2.0.0.` while `package.json` says `2.0.1`
- **THEN** the suite fails, naming the token `2.0.0`

#### Scenario: An admitted phrase admits only its own tokens

- **WHEN** `README.md` carries the admitted phrase "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0" wrapped across two lines, as the shipped page wraps it, and, elsewhere, a `2.0.0` outside any admitted phrase
- **THEN** both tokens inside the phrase pass, each reported at its own line when it fails, and the other token fails

#### Scenario: A wrong install target fails beside current-tag prose

- **WHEN** `docs/installation.md` carries `npm install -g github:las-sal/orbit-spec#v1.3.1` and the prose "The `#v2.0.1` tag names a release tree" while `package.json` says `2.0.1`
- **THEN** the suite fails, naming the install target `v1.3.1` (no value admission applies to it) and the page's missing current install command

#### Scenario: A stale admission fails

- **WHEN** an admitted entry admits no token in the user docs
- **THEN** the suite fails, naming the entry

#### Scenario: A page without its install pin fails

- **WHEN** `docs/installation.md` carries no `#v<version>` install pin
- **THEN** the suite fails, naming the page

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
and passes every other file), the start-sections check (which reads the pages its requirement lists and passes
every other file), and the version check (which reads every user doc). The rules that hold over the user
docs as a WHOLE — an unused `docs-inventory` declaration, the non-vacuity floors and a stale version admission — are never run on one listed
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
