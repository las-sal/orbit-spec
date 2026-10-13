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
requirement names and passes every other file), and the tool-coverage check (which reads `docs/supported-tools.md`
and passes every other file). The rules that hold over the user
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

## ADDED Requirements

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
| `orbit/` present, and `find orbit/specs orbit/changes -type f` prints nothing (an `orbit init` created it empty) | delete `orbit/`, then `git mv openspec orbit`, then `orbit init`; an `orbit/config.yaml` that init wrote is lost, and `openspec/config.yaml` moves across |
| `orbit/` present, holding a file under `orbit/specs/` or `orbit/changes/` | no move command: the guide says how to merge by hand, and that a move here nests the project |

A checklist line finds a FORM, never a meaning: a clean checklist shows that no known hazard is present, nothing more.

Named limit (the migration checklist). Residual kind: a post-1.3.1 on-disk form the measurement missed (four were never verified: brace or extglob `generates`, symlinked schema directories, `.openspec-workspace/`, Copilot cloud-agent files) or one upstream ships after 1.14.1. Residual method: for the first, the recorded run of the guide's steps on an upstream 1.14.1 project; for the second, the guide names the upstream version it was measured against, and a later change re-reads upstream's changelog from that version.

#### Scenario: The guide's steps move a 1.14.1 project

- **WHEN** the guide's checklist, its fixes and its move steps are run on a fresh upstream 1.14.1 project carrying one fixture per checklist hazard, once before any `orbit init` and once after an `orbit init` has created `orbit/`
- **THEN** each checklist line reports its fixture, and after the fixes and the move `orbit list`, `orbit status` and `orbit validate --all` read the project, with nothing under `orbit/openspec/`

#### Scenario: A move into an existing orbit directory is never offered

- **WHEN** `orbit/` holds a file under `orbit/specs/` or `orbit/changes/`
- **THEN** the guide's move steps give no move command for that state and say why

#### Scenario: The guide names its measured version

- **WHEN** a reader opens `docs/migration-guide.md`
- **THEN** it states the upstream version its checklist was measured against
