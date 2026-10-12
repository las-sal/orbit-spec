# Delta for orbit-user-docs

## ADDED Requirements

### Requirement: Every improvement the README claims over OpenSpec names capabilities that exist

When `README.md` is not on the pending-rewrite list, the IMPROVEMENT-CLAIMS CHECK SHALL read the README section headed
`How orbit improves on OpenSpec` (the section as `The old name appears in the user docs only in four admitted places`
bounds it) and dispose of its content by this table, failing the suite naming `README.md`, the line and the reason:

| member | covered by |
|---|---|
| a top-level list item naming at least one `orbit-*` capability in backticks, every one resolving to `orbit/specs/<name>/spec.md` | passes |
| a top-level list item naming no capability | fails, naming the item's line |
| a top-level list item naming a backticked `orbit-*` token that resolves to no capability (a skill name such as `orbit-explore`, a typo, a retired name) | fails, naming the line and the token |
| a nested list item | read as part of its top-level item; it neither needs nor supplies a name of its own |
| a capability name inside a fenced block in the section | not read: fences are never structure |
| the section absent, or holding no top-level list item | fails: an empty comparison passes nothing |
| a non-list block in the section (an intro paragraph, a table, a sub-heading's prose) | not read |

A name resolves when `orbit/specs/<name>/spec.md` exists in the repository the check runs in. The check reads the
claims; it never judges them.

Named limit (the improvement-claims check). Residual kind: an improvement claim written outside a top-level list item of the section — in its prose, a table, or anywhere else on the page. Residual method: review reads the page for claims of improvement; the same review owns whether each named capability actually carries its claim (truth is a record, R-crc-11).

#### Scenario: A claim naming existing capabilities passes

- **WHEN** a top-level list item under `How orbit improves on OpenSpec` names `orbit-engine-gates` and `orbit-review` in backticks
- **THEN** the improvement-claims check passes that item

#### Scenario: A claim naming no capability fails

- **WHEN** a top-level list item under `How orbit improves on OpenSpec` names no `orbit-*` token in backticks
- **THEN** the suite fails, naming `README.md` and the item's line

#### Scenario: A name that is not a capability fails

- **WHEN** a top-level list item names `orbit-explore`, a skill, beside an existing capability
- **THEN** the suite fails, naming the line and `orbit-explore`

#### Scenario: A nested item rides its parent

- **WHEN** a top-level list item names a capability and a list item nested under it names none
- **THEN** the improvement-claims check passes both

#### Scenario: An empty comparison fails

- **WHEN** `README.md` has no `How orbit improves on OpenSpec` section, or the section holds no top-level list item
- **THEN** the suite fails, naming `README.md` and that no claim was found

#### Scenario: A listed README is not read

- **WHEN** `README.md` is on the pending-rewrite list
- **THEN** the improvement-claims check reads nothing and reports nothing

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
