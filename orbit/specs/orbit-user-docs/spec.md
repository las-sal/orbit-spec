# orbit-user-docs Specification

## Purpose
The user docs — `README.md` and `docs/*.md` — are a machine-checked surface: what the old upstream name may appear
in, which files are still owed their rewrite (the pending-rewrite list), the docs' own declared command heads, and the
non-vacuity floors the docs sweeps carry once nothing is pending. `orbit-cli-grammar` owns the grammar checks this
capability's surface is also swept by.
## Requirements
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
snippet sweep, the `git`/`gh` sweep, the tool inventory's unknown-head rule, and the improvement-claims check (which
reads `README.md` alone and passes every other file). The rules that hold over the user
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

### Requirement: The old name appears in the user docs only in four admitted places

In every unlisted user doc, every case-insensitive occurrence of `openspec`, `opsx` or `fission` SHALL be RESIDUE,
and fail the suite naming the file, the line and the occurrence, unless it sits in one of four admitted places:

| member | covered by |
|---|---|
| anything under the `README.md` heading `Built on OpenSpec` | admitted: the attribution |
| anything under the `README.md` heading `How orbit improves on OpenSpec` | admitted: the comparison |
| any occurrence in `docs/migration-guide.md` | admitted: the file describes what an adopter arriving from OpenSpec has |
| the identifier `.openspec.yaml`, anywhere | admitted: a name the tool still writes on disk |
| a global directory the tool still writes, anywhere: `~/.config/openspec`, `~/.local/share/openspec`, `$XDG_CONFIG_HOME/openspec`, `$XDG_DATA_HOME/openspec`, `%APPDATA%/openspec`, `%LOCALAPPDATA%/openspec`, `~/AppData/Roaming/openspec` or `~/AppData/Local/openspec`, with `/` or `\` before `openspec` | admitted: the global configuration and data directories (`src/core/global-config.ts`) |
| `openspec` as a command, in any fence or span | residue |
| a `/opsx:` slash command | residue |
| `@fission-ai/openspec`, a Fission-AI URL, upstream's Discord or badges | residue |
| any other occurrence, in prose, a path or a link | residue |

The rows are tested in order and the first match wins, so an admitted place precedes every residue row: `openspec
init` in a fence inside an admitted README section is admitted by this check (the tool inventory still judges its
head, separately). A README section is the text from an ATX heading whose text is exactly one of the two admitted
titles, at any level, to the next ATX heading whose level is at most the admitted heading's (a `##` section ends at
the next `#` or `##`); everything in it, fenced or not, is admitted. A heading line inside a fence, an HTML block, a list item or a
blockquote is not a heading: only a top-level ATX heading opens or ends a section.
The admitted identifiers are matched as whole substrings, so `.openspec.yaml` admits that occurrence and nothing
beside it.

Named limit (the residue check). Residual kind: an upstream name or link form that contains none of `openspec`,
`opsx` or `fission` (a renamed product, a shortened URL, a logo asset path). Residual method: a case-insensitive grep
of upstream's v1.3.1 README and docs (the `upstream/v1.3.1` tag) for its product, org and link names, compared
against the three patterns, plus the public-readiness stage's sweep of upstream assets and links. The check also
cannot judge intent: residue inside an admitted place passes (an upstream install line pasted into the comparison
section, or the migration guide telling a NEW user to run `openspec`); review owns that. And a setext heading is not
read as a heading: it neither opens nor ends an admitted section, so the README's sections are written with ATX
headings.

#### Scenario: An upstream command in a rewritten page is residue

- **WHEN** an unlisted user doc other than `docs/migration-guide.md` carries `openspec init` in a shell fence
- **THEN** the residue check fails, naming the file, the line and the occurrence

#### Scenario: The attribution section admits the old name

- **WHEN** `README.md` carries "OpenSpec" in prose under a heading titled exactly `Built on OpenSpec`
- **THEN** the residue check passes that occurrence, and an occurrence under the next heading of the same level fails

#### Scenario: An on-disk name is admitted anywhere

- **WHEN** an unlisted user doc names `.openspec.yaml`, `~/.config/openspec` or `~/.local/share/openspec`
- **THEN** the residue check passes those occurrences

#### Scenario: A command inside an admitted section is admitted by the residue check

- **WHEN** `README.md` carries `openspec init` in a shell fence under a heading titled exactly `How orbit improves on OpenSpec`
- **THEN** the residue check passes that occurrence

### Requirement: The user docs declare their own command heads

The tool inventory SHALL judge the unlisted user docs against the user docs' OWN declared set (the inventory of
`orbit-cli-grammar`'s `Every command head on the generated surface is a recorded tool or a declared exemption`), which
is this requirement's one fenced block whose info string is `docs-inventory`, in that requirement's line grammar
(`<kind>: <head> <head> …`, the kinds `utility`, `placeholder` and `prose`):

```docs-inventory
utility: npm cd
```

A fence with no lines is a legal block and declares nothing. In this fence, `utility` also admits a package
manager or installer a page tells the reader to run (`npm`, `pnpm`, `yarn`, `bun`, `nix`); every kind otherwise keeps
the meaning `orbit-cli-grammar` gives it. Every malformed-block rule of the generated fence
applies to this one unchanged: no `docs-inventory` fence, a second one, a malformed line, an unknown kind, a repeated
kind or a repeated head fails the suite naming this requirement and the offending line.

The set is exact for the user docs alone: a declared head that no read segment of an unlisted user doc uses fails,
naming the head and its kind; a head the user docs declare does not excuse it on the generated surface, and a head
the generated surface declares does not excuse it in the user docs. The set starts EMPTY, because every user doc
starts on the pending-rewrite list; a head is added by the edit of the stage whose rewritten page first uses it.

#### Scenario: A docs declaration does not reach the generated surface

- **WHEN** a head is declared in the `docs-inventory` fence and a generated skill uses it undeclared in `orbit-cli-grammar`'s fence
- **THEN** the inventory fails on the generated skill, naming its surface, line and head

#### Scenario: The empty docs fence is a legal block

- **WHEN** the `docs-inventory` fence holds no lines
- **THEN** the inventory reads an empty declared set and reports no malformed line

#### Scenario: An unused docs declaration fails

- **WHEN** the `docs-inventory` fence declares a head that no unlisted user doc uses
- **THEN** the suite fails, naming the head and its kind

### Requirement: The docs sweeps carry non-vacuity floors once the pending list is empty

A sweep that finds nothing passes, so each sweep extended to the user docs SHALL assert a minimum count of snippets
it reads in the UNLISTED user docs, by this table:

| member | covered by |
|---|---|
| the `orbit` snippet sweep | a floor, active once the pending-rewrite list is empty |
| the `git` recorded-contract sweep | the same |
| the `gh` recorded-contract sweep | the same |
| the tool inventory | no floor of its own: its heads include `orbit` once the list is empty, which the `orbit` floor proves read |
| the residue check | no floor: it fails on presence, and finding nothing is its success |

While any user doc is listed the floors are inactive and have no value, so a floor never pins a file the list still
exempts. The edit that EMPTIES the list SETS the floors in the same commit, each a positive integer at most the count its sweep measures
over the user docs at that edit, so a floor becomes active and valued at once and no placeholder is ever asserted. An
empty list with a floor still unset fails the suite, naming the sweep and that its floor is unset, and one with a floor
that is not a positive integer fails naming the sweep and the value, because a floor of zero passes a sweep that read
nothing.

#### Scenario: A floor is inactive while files are listed

- **WHEN** the pending-rewrite list is not empty
- **THEN** no docs floor is asserted

#### Scenario: Emptying the list without setting the floors fails

- **WHEN** the pending-rewrite list is empty and a docs sweep's floor has no value
- **THEN** the suite fails, naming the sweep and that its floor is unset

#### Scenario: A vacuous sweep fails once the list is empty

- **WHEN** the pending-rewrite list is empty and the `orbit` sweep reads fewer `orbit` snippets in the user docs than its floor
- **THEN** the suite fails, naming the sweep, its count and its floor

### Requirement: Every improvement the README claims over OpenSpec names capabilities that exist

The IMPROVEMENT-CLAIMS CHECK SHALL read the `README.md` section headed `How orbit improves on OpenSpec` (the section
as `The old name appears in the user docs only in four admitted places` bounds it) and dispose of its content by this
table, failing the suite naming `README.md`, the line and the reason. It is a file-local check that reads `README.md`
alone and passes every other user doc, so the suite runs it as it runs every file-local check: over the unlisted user
docs, and, in the pending-rewrite list's exactness rule, over a listed `README.md` alone.

A NAME is an inline code span whose whole content matches this production; any other span, including one that merely
begins `orbit-`, is not a name:

```
<name> ::= orbit-[a-z0-9]+(-[a-z0-9]+)*        the whole content of one inline code span
```

| member | covered by |
|---|---|
| a top-level list item whose names (its own and its nested items') number at least one, every one resolving to `orbit/specs/<name>/spec.md` | passes |
| a top-level list item with no name in it or in its nested items | fails, naming the item's line |
| a name, in a top-level item or one of its nested items, that resolves to no capability (a skill name such as `orbit-explore`, the package name `orbit-spec`, a typo, a retired name) | fails, naming the line the name is on and the name |
| a nested list item | its names count toward its top-level item; it is not judged as an item of its own |
| an inline code span beginning `orbit-` that is not a whole name (`orbit-explore/SKILL.md`, `orbit-review --as`) | not a name: not read |
| a name inside a fenced block in the section | not read: fences are never structure |
| the section absent, or holding no top-level list item | fails: an empty comparison passes nothing |
| a non-list block in the section (an intro paragraph, a table, a sub-heading's prose) | not read |

A name resolves when `orbit/specs/<name>/spec.md` exists in the repository the check runs in. The check reads the
claims; it never judges them.

Named limit (the improvement-claims check). Residual kind: an improvement claim written outside a top-level list item of the section — in its prose, a table, or anywhere else on the page. Residual method: review reads the page for claims of improvement; the same review owns whether each named capability actually carries its claim (truth is a record, R-crc-11).

#### Scenario: A claim naming existing capabilities passes

- **WHEN** a top-level list item under `How orbit improves on OpenSpec` names `orbit-engine-gates` and `orbit-review` in backticks
- **THEN** the improvement-claims check passes that item

#### Scenario: A claim naming no capability fails

- **WHEN** a top-level list item under `How orbit improves on OpenSpec` has no name in it or in its nested items
- **THEN** the suite fails, naming `README.md` and the item's line

#### Scenario: A name that is not a capability fails

- **WHEN** a top-level list item names `orbit-explore`, a skill, beside an existing capability
- **THEN** the suite fails, naming the line and `orbit-explore`

#### Scenario: A nested item rides its parent

- **WHEN** a top-level list item names a capability and a list item nested under it names none
- **THEN** the improvement-claims check passes both

#### Scenario: A name only in a nested item counts for its parent

- **WHEN** a top-level list item carries no name of its own and a list item nested under it names `orbit-review`
- **THEN** the improvement-claims check passes the top-level item; and when the nested item instead names `orbit-explore`, the suite fails naming the nested item's line and `orbit-explore`

#### Scenario: A span that is not a whole name is not read

- **WHEN** a top-level list item names `orbit-review` and also carries the span `orbit-explore/SKILL.md`
- **THEN** the improvement-claims check passes the item, reading only `orbit-review` as a name

#### Scenario: An empty comparison fails

- **WHEN** `README.md` has no `How orbit improves on OpenSpec` section, or the section holds no top-level list item
- **THEN** the suite fails, naming `README.md` and that no claim was found

#### Scenario: A listed README is held by the exactness rule, not the suite

- **WHEN** `README.md` is on the pending-rewrite list
- **THEN** the unlisted-doc suite reports no improvement-claims failure against it, and the exactness rule still runs the check over it alone, so a listed README that passes every file-local check is reported finished

