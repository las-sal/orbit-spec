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

### Requirement: The old name appears in the user docs only in four admitted places

In every unlisted user doc, every case-insensitive occurrence of `openspec`, `opsx` or `fission` SHALL be RESIDUE,
and fail the suite naming the file, the line and the occurrence, unless it sits in one of four admitted places:

| member | covered by |
|---|---|
| anything under the `README.md` heading `Built on OpenSpec` | admitted: the attribution |
| anything under the `README.md` heading `How orbit improves on OpenSpec` | admitted: the comparison |
| any occurrence in `docs/migration-guide.md` | admitted: the file describes what an adopter arriving from OpenSpec has |
| the identifier `.openspec.yaml`, anywhere | admitted: a name the tool still writes on disk |
| the directory `.cospec/openspec/`, anywhere | admitted: the CoStrict command directory the generator still writes (`src/core/command-generation/adapters/costrict.ts`), which `docs/supported-tools.md` names so a reader can find those files |
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
beside it, and `.cospec/openspec/` admits that directory and not `openspec/` on its own.

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

- **WHEN** an unlisted user doc names `.openspec.yaml`, `~/.config/openspec`, `~/.local/share/openspec` or `.cospec/openspec/`
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
utility: npm cd find grep ls rm
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

A page NAMES a command path `orbit <words>` when its text carries that string, matched case-sensitively, with no letter, digit, `_`, `/`, `.`
or `-` immediately before `orbit` and no letter, digit, `_` or `-` immediately after the last word; the words are
separated by single spaces. It NAMES a workflow id when its text carries `/orbit:<id>` with no letter, digit, `_` or
`-` immediately after. Text is the whole file, fences and inline code included. A path names each of its prefixes,
so `orbit pr select` names `orbit pr`.

The suite also fails when either owing page, `docs/cli.md` or `docs/commands.md`, is neither on the pending-rewrite
list nor present among the user docs, naming the missing page, so deleting or renaming a page never satisfies the check.
A file-local check never sees an absent file, so this one runs over the suite's document set.

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

#### Scenario: A missing owing page fails

- **WHEN** `docs/cli.md` is neither on the pending-rewrite list nor present among the user docs
- **THEN** the suite fails naming `docs/cli.md` as missing

#### Scenario: Every other user doc passes

- **WHEN** a user doc other than `docs/cli.md` and `docs/commands.md` names no command at all
- **THEN** the command-coverage check passes it

### Requirement: Every H2 section of four concept pages declares its owner on a checked Carried by line

The CARRIED-BY CHECK SHALL read `docs/concepts.md`, `docs/customization.md`, `docs/supported-tools.md` and
`docs/multi-language.md`, each parsed as the improvement-claims check parses `README.md` (markdown-it, a fence never
structure), and pass every other user doc. A SECTION is the text from an H2 heading to the next H1 or H2 heading or the
end of the file. A CARRIED-BY LINE is a paragraph at the section's top level (not inside a list, a blockquote or a fence)
whose text begins `Carried by:`. Its soft line breaks are joined with a space, and the joined text is then
parsed by this production:

```
Carried by: <item>(, <item>)*
<item> ::= `<name>`  |  fork-and-orbify D<n>  |  the 1.3.1 baseline
```

where `<name>` is the improvement-claims check's production (`Every improvement the README claims over OpenSpec
names capabilities that exist`), written as one inline code span, and `<n>` is a decimal number. The check disposes of
what it meets by this table, failing the suite naming the file, the line and the reason:

| member | covered by |
|---|---|
| a section with exactly one carried-by line, every item resolving | passes |
| a `<name>` item | resolves when `orbit/specs/<name>/spec.md` exists |
| a `fork-and-orbify D<n>` item | resolves when `orbit/architecture/fork-and-orbify.md` has a heading beginning `### D<n> — ` |
| the item `the 1.3.1 baseline` | resolves always: behaviour inherited from the OpenSpec 1.3.1 baseline and left unchanged |
| any other item, or a carried-by line with no item | fails, naming the line and the item |
| a section with no carried-by line, or with more than one | fails, naming the heading's line |
| a section whose every block is a list whose every item's text is exactly one link, with nothing beside it but whitespace or one trailing punctuation mark (Related, See also, Next steps) | exempt: navigation makes no claim |
| a list item holding a link and any other text | not navigation: its section owes a carried-by line |
| a concept page that is neither listed nor present | fails, naming the page: a file-local check never sees an absent file |
| content before the first H2 | not read |
| H3 and deeper headings | not sections: they belong to their H2 |
| a carried-by line inside a fence, a list or a blockquote | not read |
| `docs/migration-guide.md`, `README.md` and every other user doc | not read: the migration guide describes OpenSpec and gives instructions, and the README's claims have their own check |

An item names the owner of the section's claims about orbit's behaviour, by whose behaviour the claim describes: what
orbit ADDED names the capability that carries it; what orbit CHANGED names the capability that states the change, or,
where none does (telemetry removed, every workflow installed regardless of profile), the fork-and-orbify decision
(D12, D15); the user-facing names (the `orbit` CLI, the `orbit/` workspace, the generated skills and commands) are
stated by `orbit-conventions`' `Distribution model — self-contained fork`, so a section about them names that
capability; what orbit left UNCHANGED is `the 1.3.1 baseline`. The check reads the
declaration and never its truth: whether a named owner carries the section is the system review's reading.

Named limit (the carried-by check). Residual kind: an orbit change to inherited behaviour that no capability states and that is not fork-and-orbify D12 or D15, so a page could present it as inherited or as a capability claim. Residual method: diff the page's claim against the upstream `1.3.1` tag (`git diff upstream/v1.3.1 -- <path>`) when the system review reads the page for orbit behaviour.

#### Scenario: A section naming existing owners passes

- **WHEN** an unlisted concept page's H2 section carries ``Carried by: `orbit-engine-gates`, fork-and-orbify D15, the 1.3.1 baseline``
- **THEN** the carried-by check passes the section

#### Scenario: A section with no carried-by line fails

- **WHEN** an unlisted concept page has an H2 section with no carried-by line and a paragraph in its body
- **THEN** the suite fails, naming the file and the heading's line

#### Scenario: A section with two carried-by lines fails

- **WHEN** an H2 section of a concept page carries two carried-by lines
- **THEN** the suite fails, naming the file and the heading's line

#### Scenario: An unresolved item fails

- **WHEN** a carried-by line names `orbit-explore` (a skill, not a capability), `fork-and-orbify D99`, or free text
- **THEN** the suite fails, naming the file, the line and the item

#### Scenario: A navigation section is exempt

- **WHEN** an H2 section holds only a list whose every item is exactly one link
- **THEN** the carried-by check passes it with no carried-by line

#### Scenario: A link followed by a claim is not navigation

- **WHEN** an H2 section's only list item is a link followed by text that makes a claim, and the section has no carried-by line
- **THEN** the suite fails, naming the file and the heading's line

#### Scenario: A wrapped carried-by line is read whole

- **WHEN** a carried-by line's items soft-wrap onto a second source line
- **THEN** the check reads one carried-by line and resolves every item on both lines

#### Scenario: A missing concept page fails

- **WHEN** one of the four concept pages is neither on the pending-rewrite list nor present
- **THEN** the suite fails, naming the page

#### Scenario: A line inside a fence or a list is not read

- **WHEN** a section's only carried-by line sits inside a fence or a list item
- **THEN** the section fails as having no carried-by line

#### Scenario: Other user docs are not read

- **WHEN** `docs/migration-guide.md` or `README.md` has an H2 section with no carried-by line
- **THEN** the carried-by check passes the file

### Requirement: The supported-tools page lists every init target in two tiers

The TOOL-COVERAGE CHECK SHALL hold `docs/supported-tools.md` to `AI_TOOLS` (`src/core/config.ts`), the list
`orbit init --tools` accepts, read from the code and never restated in the test, and pass every other user doc. The page
names a tool by its id as an inline code span in a table row. The check disposes of the list by this table, failing the
suite naming the page and the tool id:

| member | covered by |
|---|---|
| `claude` | named in the page's tier 1: designed for (fork-and-orbify D11 and its Claude-primacy refinement) and run by a real init in the generated-surface test |
| `codex` | named in tier 1, the same test |
| every other entry whose `available` is not `false` | named in tier 2: generated from the same templates into the OpenSpec 1.3.1 directories, and not tested by orbit |
| an entry whose `available` is `false` | named nowhere on the page: it is not an init target |
| a tier-1 tool named in tier 2, or the reverse | fails, naming the tool and the tier it sits in |
| an inline-code id in a tier's table row that is no `AI_TOOLS` entry | fails, naming the page and the id |
| a page that is neither listed nor present | fails, naming the page |

A TIER is the text under the page's H2 heading `Tier 1` or `Tier 2` (the heading's text begins with that word and
number), to the next H2. Tier 2 says "untested", never "supported": a tool can be generated into a directory its tool
later moved, so generation does not show it works. The page also states, for each tier-1 tool, the directories orbit writes and how the
tool invokes the workflows. For Codex these are two facts: orbit writes its skills under `.codex/skills/` (upstream
later moved them to `.agents/skills/`), and its commands to the global `$CODEX_HOME/prompts/`, by default
`~/.codex/prompts/` (upstream later retired them). The check does not read that prose; the system review
does.

#### Scenario: Every available tool has a row in its tier

- **WHEN** `docs/supported-tools.md` is unlisted and names `claude` and `codex` in tier 1 and every other available tool in tier 2
- **THEN** the tool-coverage check passes

#### Scenario: A tool added to the code without a row fails

- **WHEN** `AI_TOOLS` holds an available tool the page names in neither tier
- **THEN** the suite fails, naming the page and the tool id

#### Scenario: The unavailable tool is not listed

- **WHEN** the page names the tool whose `available` is `false`
- **THEN** the suite fails, naming the page and the tool id

#### Scenario: A tool in the wrong tier fails

- **WHEN** the page names `codex` under tier 2
- **THEN** the suite fails, naming the tool and the tier it sits in

#### Scenario: An id that is no init target fails

- **WHEN** a tier's table names an id that `AI_TOOLS` does not hold
- **THEN** the suite fails, naming the page and the id

### Requirement: The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project

`docs/migration-guide.md` SHALL be written for an adopter moving an OpenSpec 1.x project to orbit, and SHALL carry, in
this order: a "before you move" checklist run against `openspec/`; the move steps; and a table of what orbit does not
have. It SHALL name the upstream version it was measured against (1.14.1). Each checklist line is one `grep`, `find`
or `ls` command and the fix for what it finds, and every hazard measured on an upstream 1.14.1 project is disposed of by
this table:

| member | covered by |
|---|---|
| task lines written `+ [ ]`, `* [ ]`, `- [~]`, `- [ x]`, `1. [ ]`, or as indented sub-tasks (read as done, or invisible to the apply gate) | a checklist line over `openspec/changes/*/tasks.md`; rewrite them as `- [ ]` or `- [x]` |
| `skip_specs`, `retire_capabilities`, `goal`, `affected_areas` or `initiative` in a change's `.openspec.yaml` (dropped without a warning) | a checklist line over the changes' `.openspec.yaml`; finish or archive those changes under upstream first |
| a nested capability path, in a baseline (`openspec/specs/<area>/<capability>/spec.md`) or in a change's delta (`openspec/changes/<change>/specs/<area>/<capability>/spec.md`) | a checklist line over both; flatten each to `specs/<capability>/spec.md` first, renaming the capability where two would flatten to one name |
| a `## Purpose` in a change's delta spec (archive writes the TBD placeholder instead) | a checklist line; after the archive, replace the placeholder by hand |
| `store:` in `openspec/config.yaml`, or a `defaultStore` | a checklist line; a project whose specs live in a store cannot move until they are in the repository |
| a change name beginning with a digit, or already carrying a date prefix | a checklist line; rename the change first |
| a requirement heading ending in `###`, or `*` or `+` bullets under REMOVED or RENAMED | a checklist line over every `spec.md`; rewrite to the 1.3.1 forms |
| `operations` or `githubCopilot` keys in `openspec/config.yaml`, or unknown metadata keys (ignored, with no warning) | a checklist line; the table says orbit ignores them |
| upstream's `openspec-*` skills and `opsx` commands | the move steps, which delete them; `orbit init`'s warning (`orbit-init-openspec-warning`) names them |
| a tool added after 1.3.1, or a tool directory upstream later moved | the table, pointing at `docs/supported-tools.md` |
| a command, flag or `--json` field upstream added after 1.3.1 | the table |

The MOVE STEPS delete upstream's `openspec-*` skills and `opsx` commands, then move `openspec/` by the state of
`orbit/`, because `git mv openspec orbit` into an existing `orbit/` moves the project inside it, to `orbit/openspec/`,
where orbit reads nothing:

| member | covered by |
|---|---|
| no `orbit/` (the guide read before `orbit init`) | `git mv openspec orbit`, then `orbit init` |
| `orbit/` present, and `find orbit -type f` prints nothing or only `orbit/config.yaml` (an `orbit init` created it and nothing else is in it) | delete `orbit/`, then `git mv openspec orbit`, then `orbit init`; `openspec/config.yaml` moves across in place of the deleted `orbit/config.yaml`, and the guide says to keep a copy of that file first if it was edited |
| `orbit/` present, holding any other file (specs or changes, an architecture doc, an exploration, a schema, a lens file) | no move command: the guide says how to merge by hand, and that a move here nests the project |

A checklist line finds a FORM, never a meaning: a clean checklist shows that no known hazard is present, nothing more.

Named limit (the migration checklist). Residual kind: a post-1.3.1 on-disk form the measurement missed (four were never verified: brace or extglob `generates`, symlinked schema directories, `.openspec-workspace/`, Copilot cloud-agent files) or one upstream ships after 1.14.1. Residual method: for the first, the recorded run of the guide's steps on an upstream 1.14.1 project; for the second, the guide names the upstream version it was measured against, and a later change re-reads upstream's changelog from that version.

#### Scenario: The guide's steps move a 1.14.1 project

- **WHEN** the guide's checklist, its fixes and its move steps are run on a fresh upstream 1.14.1 project carrying one fixture per checklist hazard, once before any `orbit init` and once after an `orbit init` has created `orbit/`
- **THEN** each checklist line reports its fixture, and after the fixes and the move `orbit list`, `orbit status` and `orbit validate --all` read the project, with nothing under `orbit/openspec/`

#### Scenario: A move into an existing orbit directory is never offered

- **WHEN** `orbit/` holds a file other than `orbit/config.yaml`, under `orbit/specs/` or `orbit/changes/` or anywhere else in it
- **THEN** the guide's move steps give no move command for that state and say why

#### Scenario: The guide names its measured version

- **WHEN** a reader opens `docs/migration-guide.md`
- **THEN** it states the upstream version its checklist was measured against

### Requirement: The user docs' start sections name the architect workflow first

The START-SECTIONS CHECK SHALL read the user docs' START SECTIONS, each named by (page, heading), and in each one the
first START COMMAND named SHALL be `/orbit:architect` (R-rda-1, R-rda-2; `orbit-architect`'s `Start surfaces name the
architect workflow first`). A page is parsed as the improvement-claims check parses `README.md` (markdown-it). A
SECTION is the text from its heading to the next heading of the same or a higher level, or the end of the file, fences
included. A START COMMAND is one of `architect`, `explore`, `new`, `propose` or `ff`, met in either of two
forms: a `/orbit:<id>` mention, or, inside a fence, `<id>` as a whole word (not preceded by a letter, digit or
hyphen) followed by ` ──►` (the flow-diagram form the docs draw).
The start sections are exactly this table, held in the test as an exact list:

| member | covered by |
|---|---|
| `README.md` › `### Your first change` | listed |
| `docs/getting-started.md` › `## The change` | listed |
| `docs/workflows.md` › `### One change, start to finish` | listed |
| `docs/workflows.md` › `### Step by step` | listed |
| `docs/workflows.md` › `### Exploring first` | listed |
| `docs/workflows.md` › `## Practices` | listed |
| `docs/workflow-engine.md` › `## Actions, not phases` | listed |
| `docs/concepts.md` › `## Artifacts` | listed |
| `README.md`'s command table, `docs/commands.md` › `## Quick reference` | not listed: a reference order, not a suggestion |
| `docs/commands.md` › `## Starting a change` | not listed: a per-command reference section, documenting the commands that create a change; `/orbit:architect` starts a program and is documented under `## Across the project` |
| `docs/workflows.md` › `### Start a new change when` | not listed: a judgement about scope (update or start anew) that names no command |
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

