## ADDED Requirements

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

A file leaves the list only by the edit of the stage that rewrites it. While a file is listed it has no protection:
the program this capability serves is run as one sequence and validated by use at its end, so interim states are
not defended.

#### Scenario: An unlisted doc is held to every check

- **WHEN** a user doc that is not on the pending-rewrite list carries a failing snippet or residue
- **THEN** the suite fails, naming the file, the line and the check

#### Scenario: A finished file cannot stay listed

- **WHEN** a listed user doc passes every check
- **THEN** the suite fails, naming the file to remove from the list

#### Scenario: A stale entry fails

- **WHEN** the pending-rewrite list names a path that is not a user doc
- **THEN** the suite fails, naming the entry

### Requirement: The old name appears in the user docs only in four admitted places

In every unlisted user doc, every case-insensitive occurrence of `openspec`, `opsx` or `fission` SHALL be RESIDUE,
and fail the suite naming the file, the line and the occurrence, unless it sits in one of four admitted places:

| member | covered by |
|---|---|
| prose under the `README.md` heading `Built on OpenSpec` | admitted: the attribution |
| prose under the `README.md` heading `How orbit improves on OpenSpec` | admitted: the comparison |
| any occurrence in `docs/migration-guide.md` | admitted: the file describes what an adopter arriving from OpenSpec has |
| the identifier `.openspec.yaml`, anywhere | admitted: a name the tool still writes on disk |
| the identifier `~/.config/openspec`, anywhere | admitted: the global configuration directory the tool still writes |
| `openspec` as a command, in any fence or span | residue |
| a `/opsx:` slash command | residue |
| `@fission-ai/openspec`, a Fission-AI URL, upstream's Discord or badges | residue |
| any other occurrence, in prose, a path or a link | residue |

A README section is the text from an ATX heading whose text is exactly one of the two admitted titles, at any level,
to the next heading of the same or a higher level; everything in it, fenced or not, is admitted. The admitted
identifiers are matched as whole substrings, so `.openspec.yaml` admits that occurrence and nothing beside it.

Named limit (the residue check). Residual kind: an upstream name or link form that contains none of `openspec`,
`opsx` or `fission` (a renamed product, a shortened URL, a logo asset path). Residual method: a case-insensitive grep
of upstream's v1.3.1 README and docs (the `upstream/v1.3.1` tag) for its product, org and link names, compared
against the three patterns, plus the public-readiness stage's sweep of upstream assets and links. The check also
cannot judge intent: residue inside an admitted place passes (an upstream install line pasted into the comparison
section, or the migration guide telling a NEW user to run `openspec`); review owns that.

#### Scenario: An upstream command in a rewritten page is residue

- **WHEN** an unlisted user doc other than `docs/migration-guide.md` carries `openspec init` in a shell fence
- **THEN** the residue check fails, naming the file, the line and the occurrence

#### Scenario: The attribution section admits the old name

- **WHEN** `README.md` carries "OpenSpec" in prose under a heading titled exactly `Built on OpenSpec`
- **THEN** the residue check passes that occurrence, and an occurrence under the next heading of the same level fails

#### Scenario: An on-disk name is admitted anywhere

- **WHEN** an unlisted user doc names `.openspec.yaml` or `~/.config/openspec`
- **THEN** the residue check passes those occurrences

### Requirement: The user docs declare their own command heads

The tool inventory SHALL judge the unlisted user docs against the user docs' OWN declared set (the inventory of
`orbit-cli-grammar`'s `Every command head on the generated surface is a recorded tool or a declared exemption`), which
is this requirement's one fenced block whose info string is `docs-inventory`, in that requirement's line grammar
(`<kind>: <head> <head> …`, the kinds `utility`, `placeholder` and `prose`):

```docs-inventory
```

The set is exact for the user docs alone: a declared head that no read segment of an unlisted user doc uses fails,
naming the head and its kind; a head the user docs declare does not excuse it on the generated surface, and a head
the generated surface declares does not excuse it in the user docs. The set starts EMPTY, because every user doc
starts on the pending-rewrite list; a head is added by the edit of the stage whose rewritten page first uses it.

#### Scenario: A docs declaration does not reach the generated surface

- **WHEN** a head is declared in the `docs-inventory` fence and a generated skill uses it undeclared in `orbit-cli-grammar`'s fence
- **THEN** the inventory fails on the generated skill, naming its surface, line and head

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

While any user doc is listed the floors are inactive, so a floor never pins a file the list still exempts. Their
values are set at the program's public-readiness stage, below the measured counts of the rewritten docs.

#### Scenario: A floor is inactive while files are listed

- **WHEN** the pending-rewrite list is not empty
- **THEN** no docs floor is asserted

#### Scenario: A vacuous sweep fails once the list is empty

- **WHEN** the pending-rewrite list is empty and the `orbit` sweep reads fewer `orbit` snippets in the user docs than its floor
- **THEN** the suite fails, naming the sweep, its count and its floor
