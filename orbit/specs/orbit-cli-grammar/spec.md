# orbit-cli-grammar Specification

## Purpose
The `orbit` CLI's grammar as ONE program: an exported builder that declares every command, argument and option (`src/cli/index.ts` only builds and parses), which a check can build in-process with its hooks skipped and ask through commander's own parser; the requirement that every `orbit` snippet on the generated surface parse against that program, with a shared, tool-agnostic extractor and a guard for commands written where it does not look; and the completion registry held to the program as a checked copy. It proves grammar only: nothing a snippet names is executed.
## Requirements
### Requirement: The CLI's grammar is one program, built by an exported builder

The `orbit` CLI's commander program SHALL be constructed by ONE exported builder function, and `src/cli/index.ts`
SHALL do nothing but build the program and parse the process arguments with it. Every command, argument and option
the CLI accepts, including those the three `register*Command` modules add, is declared inside the builder, so a test
can build the same program in-process without running any command. The builder SHALL accept an option that skips
registering lifecycle hooks, because commander offers no public way to remove a hook once added, and SHALL pass that
option into the three `register*Command` modules, which register three of the CLI's five hooks themselves.

The program is the ONE statement of the CLI's grammar. A check that needs the grammar builds the program and asks
commander's own parser; it never derives, records or re-implements a contract beside it. To run that parser without
effects, a check neutralises every commander setting that alters a parse or causes an effect, as this table states
(the settings the CLI uses, grepped in `src/cli/index.ts` and the three `register*Command` modules):

| member | covered by |
|---|---|
| `.action()` handlers (they exit, write output and touch the repository) | replaced by a no-op on every command that declares one; a command without an action (a group) keeps none, so commander still rejects it run without a subcommand and still reports an unknown subcommand as unknown |
| `.hook('preAction', …)` on the root and `change` (`src/cli/index.ts`), `spec` (`src/commands/spec.ts`), `config` (`src/commands/config.ts`, which exits on a non-global `--scope`) and `schema` (`src/commands/schema.ts`, which writes to stderr) | skipped by the builder's option, passed into the register modules, so no hook is registered |
| commander's own exits (a parse error, `--help`, `--version`, `help <command>`) | `exitOverride()` on every command, recursively; an exit is accepted exactly when commander's exit code is 0, as the CLI's process would exit (`--help`, `--version`, `help <command>`), and every nonzero exit is a rejection — `commander.help` from a group run without a subcommand included, though `help <command>` throws the same error code with exit code 0 |
| commander's error and help output | `configureOutput` on every command, recursively, capturing commander's message for the failure |
| `.allowUnknownOption(true)` on `show` | not covered: any flag passes there |
| `.requiredOption()` on `external save` (`--as`, `--from`) | kept and enforced: a missing one rejects with `commander.missingMandatoryOptionValue`, as the CLI does |
| option values (no command declares `.choices()`) | not covered: values are checked in action code a grammar check never runs |
| async actions | `parseAsync`, so a rejected promise is caught, never unhandled |
| module-level work (the version read, the tool list, the parse call) | the builder holds everything except the parse call, which `index.ts` keeps |
| the three `register*Command(program)` modules | called inside the builder, each passed the hook option |

Closure: commander 14's Command settings that change parsing or cause effects — action, hook, exitOverride,
configureOutput, allowUnknownOption, requiredOption, allowExcessArguments, passThroughOptions, enablePositionalOptions,
help and version — each grepped in `src/cli/index.ts` and the three `register*Command` modules.

#### Scenario: The entry point declares nothing of its own

- **WHEN** `src/cli/index.ts` is read, and a test builds the program with hooks skipped and neutralises it
- **THEN** `index.ts` declares no command, option or hook and builds its program through the exported builder, and the
  test's build runs no action and no hook

#### Scenario: A group command run without its subcommand is rejected

- **WHEN** a check hands the neutralised program `external`, a group command with no action of its own
- **THEN** `parseAsync` rejects with `commander.help` and exit code 1, as the CLI rejects it, and `external frobnicate` rejects with
  commander's unknown-command error

#### Scenario: A parse error throws instead of exiting

- **WHEN** a check hands the neutralised program an argv carrying an option the command does not declare
- **THEN** `parseAsync` rejects with commander's error, carrying commander's own message, and the process does not
  exit

### Requirement: Every `orbit` snippet on the generated surface parses against that program

Every snippet that invokes `orbit` SHALL parse when its argument vector is handed to commander's own parser over the
builder's neutralised program (`The CLI's grammar is one program, built by an exported builder`), for every generated
SKILL.md and `references/*.md` file of every workflow the generator emits. The check proves GRAMMAR only: nothing is
executed, and a snippet that parses but is wrong for its moment is not caught. One contract per tool decides grammar,
and this requirement covers `orbit`:

| member | covered by |
|---|---|
| `orbit` | commander's own parser over the builder's program, this requirement |
| `gh` | its recorded contract, `orbit-pr-lifecycle`'s `Test instruments derive from a recorded real-CLI contract` |
| `git` | not covered by this capability |
| POSIX utilities on the surface (`mv`, `grep`, `mkdir`, `head`, `rmdir`) | not covered: archive and move steps and pipeline fragments, where a grammar contract buys little |
| `node` and `sh` | not covered: `node -p` evaluates a script, and `sh` appears only inside a prohibition |

Named limit (the tool set). Residual kind: a tool invoked by a snippet the enumeration did not see: one not installed
on the measuring machine, one written path-prefixed (`./bin/orbit.js`, `node bin/orbit.js`), or one following `&&`,
`|` or `;` mid-line. Residual method: rerun the enumeration without the PATH filter, splitting each candidate on `&&`,
`|` and `;`, and classify every unrecognised token by reading its line.

A command is EXTRACTED from the places this table names, and a GUARD covers the others, so a command written in the
wrong place fails rather than escaping. The guard reads every line outside a shell-tagged fence after stripping its
leading whitespace, blockquote `>` markers, list markers and a leading `|`, and fails the line when its first token is
`orbit` and any later token begins with `-`:

| member | covered by |
|---|---|
| a line in a fence whose info string is `bash`, `sh` or `shell` | extracted, one argument vector per line |
| a line in such a fence nested in a list item | extracted the same way |
| a shell fence inside a fence whose info string is `markdown` or `md` | extracted: the outer fence's content is parsed again, and its reader runs those commands |
| a quoted argument spanning lines | the lines are joined until the quote closes, within the same shell fence's content; a quote still open at the fence's end fails extraction whatever the opening line's first token, naming the surface, the line and the snippet; and an `orbit` line joined into a quote another command opened fails extraction at its own line, though a later line closes the quote — so a line of another tool cannot hide the `orbit` lines after it |
| an inline single-backtick span beginning `orbit ` | extracted, unless every token resolves to a command of the program with nothing after it: a bare command NAME is prose |
| a line in an untagged fence, a data-tagged fence, or prose outside every fence | not extracted; the guard |
| a line whose first token is a placeholder (a runner's argument vector) | not extracted: not `orbit` |

Named limit (the places). Residual kind: a command in a container not listed: a blockquote, an indented code block, an
HTML block, a table cell, or mid-line after `&&`, `$ ` or `|`; a command in a double-backtick inline span; and, inside
a shell fence, a line prefixed `$ ` or by an assignment (`VAR=1 orbit …`), or a command continued onto the next line by
a trailing `\` (its `\` reaches the parser as an argument: a false failure on a command that takes no positional,
and on one that does, a parse that passes while the continued flags go unchecked). Residual method: the guard reads every
line OUTSIDE a shell fence whatever its container, so a residual member there that starts a line fails it; a member
mid-line, or in a double-backtick span, is found by splitting candidate lines on `&&`, `;` and `|` and rerunning the
guard; the shell-fence members are found by grepping the extracted fences' lines for a leading `$ ` or assignment and a
trailing `\`.

The tokenizer SHALL keep a quoted value as one token, keep a `<…>` placeholder as one token even with spaces inside
or a suffix attached (`<run-dir>/return.md`), drop a trailing ` # …` comment outside quotes, and drop `…` and `...`.
A backslash escapes as the shell's does: outside quotes it escapes the next character, so `\"` opens no quote; inside
double quotes it escapes `"`, `\`, `$` and a backtick; inside single quotes it escapes nothing. A `<` followed by
whitespace is a redirect, never a placeholder's opener.
A placeholder reaches the parser as a value, exactly as a real value would.

Fences are LOCATED by a CommonMark parser, the same parse serving the extractor and the guard, so a line cannot be
inside a shell fence for one and outside it for the other. The parser is a development dependency only and never
reaches an adopter's install. Each construct is classified as this table states:

| member | covered by |
|---|---|
| a top-level fenced block, backtick or tilde | the parser's fence token, with its info string |
| a fence nested in a list item | the parser's fence token, indentation measured from the item's content column |
| a longer fence enclosing shorter fence lines | the parser's one outer token; its inner lines are content |
| a shell fence inside a `markdown`- or `md`-tagged fence | reached by parsing that fence's content again, classified by this same table |
| an indented code block | not a fence; its lines fall to the guard |
| a fence inside a blockquote | the parser's fence token within the quote |
| an HTML block | not a fence; its lines fall to the guard |
| an inline code span | the extractor's inline source |

Closure of the fence table: CommonMark's block and inline constructs as the parser implements them; its one deliberate
departure, parsing `markdown` fences again, is stated as its own row.

A failure SHALL name the surface (the workflow and the file), the line, the snippet, and commander's own message.

#### Scenario: Today's surface parses

- **WHEN** the sweep runs over every generated surface
- **THEN** every extracted `orbit` snippet parses, and the guard fails no line

#### Scenario: An unknown flag in a reference fails the sweep

- **WHEN** a reference's shell fence carries `orbit status --change <name> --frobnicate`
- **THEN** the sweep fails naming that reference, the line, the snippet and commander's unknown-option message

#### Scenario: A list-nested shell fence is extracted

- **WHEN** a shell fence sits inside a nested list item of a SKILL.md and one of its lines carries an unknown
  subcommand
- **THEN** the sweep extracts that line and fails on it

#### Scenario: A shell fence inside a markdown fence is extracted

- **WHEN** a `markdown`-tagged fence contains a `bash` fence whose `orbit` line carries an extra positional
- **THEN** the sweep reaches the inner line by parsing the outer content again, and fails on it

#### Scenario: A command in an untagged fence fails the guard

- **WHEN** an untagged fence carries a line beginning `orbit validate --strict`
- **THEN** the guard fails naming the surface and the line

#### Scenario: Prose naming a command is not a guard failure

- **WHEN** an untagged fence carries the line `orbit validate passes`, which carries no token beginning with `-`
- **THEN** the guard does not fail it

#### Scenario: An unterminated quote fails extraction

- **WHEN** a shell fence's last line reads `orbit status --change "demo`
- **THEN** extraction fails naming the surface, the line and the snippet, and no line beyond the fence is joined to it

#### Scenario: A bare command name is prose

- **WHEN** an inline span reads `` `orbit feedback` ``, naming a command that requires an argument
- **THEN** the sweep does not parse it, because every token resolves to a command and nothing follows

#### Scenario: A placeholder with a suffix is one token

- **WHEN** a snippet reads `orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <L> --json`
- **THEN** `<run-dir>/return.md` is one token and the snippet parses

### Requirement: The completion registry is a checked copy of the program

`COMMAND_REGISTRY` SHALL stay hand-written and SHALL be held to the builder's program by a test in both directions,
failing on any command or flag one holds and the other does not. The registry (`src/core/completions/command-registry.ts`)
is the data `orbit completion` turns into shell completion scripts, and it stays hand-written because it carries
completion metadata the program does not. The registry's fields are compared as this table states:

| member | covered by |
|---|---|
| command name, including nested `subcommands` | compared both ways: every visible program command is in the registry, and every registry command is in the program |
| flag long name, including negatable `--no-<x>` forms | compared both ways, per command, the negated name as the program declares it |
| flag `short` | compared both ways |
| flag `takesValue` | compared: true exactly when the program's option declares a `<value>` or `[value]` |
| `acceptsPositional` | compared: true exactly when the program's command declares an argument |
| `positionalType` | not compared: completion metadata the program does not carry |
| flag `values` | not compared: completion metadata; the program declares no `.choices()` |
| `description` | not compared: prose |
| hidden program commands (`experimental`, `__complete`) | excluded: deliberately absent from completion |
| commander's automatic `--help` and `--version`, and the root `--no-color` | excluded by name in the test, so a later automatic option is a visible decision |

Closure: the registry's fields from its two interfaces in `src/core/completions/types.ts`, each either compared or
named as not comparable, plus the three kinds of program entry the registry deliberately omits. Named limit: whether a
`positionalType` offers the right ids, or a `values` list is still true, stays hand-maintained.

#### Scenario: A program command missing from the registry fails parity

- **WHEN** the builder declares a command the registry does not list
- **THEN** the parity test fails naming the command

#### Scenario: A registry entry with no program command fails parity

- **WHEN** the registry lists a command or flag the builder does not declare
- **THEN** the parity test fails naming it

#### Scenario: The registry offers orbit's own commands

- **WHEN** a user generates a completion script with `orbit completion generate <shell>`, for each of `zsh`, `bash`,
  `fish` and `powershell`
- **THEN** the script offers `status`, `emit`, `architecture`, `external`, `fingerprint`, `instructions`, `templates`,
  `schemas` and `new`

