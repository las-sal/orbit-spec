## ADDED Requirements

### Requirement: Every command head on the generated surface is a recorded tool or a declared exemption

Every command head the inventory reads on the generated surface SHALL be a RECORDED tool or a DECLARED exemption, and
any other head SHALL fail the suite, naming the surface (the workflow and the file), the line and the head — so a new
tool reaches the surface only with a recorded contract, or with an exemption written down here. The surface is every
generated SKILL.md and `references/*.md` file of every workflow the generator emits, as the shared extractor of
`Every \`orbit\` snippet on the generated surface parses against that program` reads it: the same markdown parse, the
same fence table, the same tokenizer and segments.

A RECORDED tool is DERIVED, never listed: `orbit`, whose program `The CLI's grammar is one program, built by an
exported builder` builds, and each tool the recorded-contract sweep of `Every \`git\` and \`gh\` snippet on the generated
surface validates against its tool's recorded contract` validates (`git` and `gh` today). A tool gains a row there by
gaining a contract.

The inventory reads a segment's HEAD: its first token after any assignment prefix (a token matching
`^[A-Za-z_][A-Za-z0-9_]*=`). Which segments it reads:

| member | covered by |
|---|---|
| a segment of a line in a fence whose info string is `bash`, `sh` or `shell`, top-level or nested in a list item or a blockquote | read |
| a segment of a line in a shell fence inside a `markdown` or `md` fence | read, as the extractor parses the outer fence's content again |
| a segment of a single-backtick inline span, whose head matches `^[a-z][a-z0-9._-]*$` and some later token of which is a FLAG TOKEN, matching `^--?[A-Za-z0-9]` | read |
| an inline segment carrying no flag token, or whose head is not a lowercase bare word (a path, a `/orbit:` slash command, capitalised prose) | not read |
| a shell-fence line or inline span the tokenizer refuses or leaves open | not read: an extraction failure of the shared extractor where it fails one |
| a comment or blank fence line | not read |
| a shell-fence line continued by a trailing `\` | each line read as its own command: a continuation line's first token is its head, so a continuation beginning with a flag fails as an unknown head; write the command on one line, never declare the flag |
| a line in a `json`, untagged or other data-tagged fence, or prose outside every span | not read |
| a subshell, `( … )` | its grouping is stripped by the tokenizer; each inner segment's head is read |
| a brace group (`{ …; }`), a reserved word (`if`, `then`, `fi`, …) or a `!` or `time` prefix | read as the head as written (`{`, `if`, `!`), so it fails until declared under `utility`; the tokenizer strips no other grouping |

The declared exemptions SHALL be this requirement's one fenced block whose info string is `inventory`, one line per
kind, `<kind>: <head> <head> …`, the heads separated by single spaces:

```inventory
utility: mv mkdir grep rm rmdir head tail cd [ command sh node
placeholder: <argv[0]>
prose: argument reach skipped unknown
```

`utility` holds the POSIX utilities, shell builtins, reserved words and test words the surface writes, and `node`, the runtime orbit
requires: furniture of the shell, where a grammar contract buys little. `placeholder` holds a head that stands for a
command recorded elsewhere (`<argv[0]>`, the external runner record). `prose` holds the first word of a message
template that carries a flag token (`skipped per --fast`), read by the inline row and never a command. The kind set is
exactly those three.

The suite SHALL hold the inventory EXACT in both directions: a declared head that no read segment of the surface has
fails, naming the head and its kind, so an exemption leaves with the last line that used it; a declared head that is
also a recorded tool fails, naming the head, because one head has one standing; and a block that is absent, is not
the requirement's only `inventory` fence, carries a line not matching the production, repeats a kind, or repeats a
head fails, naming the requirement and the offending line — an absent block, which has no line, names the
requirement's heading line. The test reads the block from the requirement as it stands: the
active change's delta that adds or modifies this requirement when exactly one does (two such deltas fail, naming
both), the baseline otherwise.

Named limit (the inventory). Residual kind: a tool whose every inline invocation carries no flag token, is
path-prefixed, or sits in a span the tokenizer refuses; a tool run as an argument of a declared head (`command <tool>
…`, `sh -c '<…>'`, `node <script> …`, `node bin/orbit.js` among them) or after a declared reserved word; or one
invoked only in prose, in a double-backtick span, or in a `json` or untagged fence. Residual method: an independent
review reading a new surface's inline spans and the arguments of every declared head that runs a command; rc05's guard
already fails a recorded tool's flagged line outside a fence.

#### Scenario: Today's surface passes the inventory

- **WHEN** the inventory reads every generated surface
- **THEN** every head it reads is a recorded tool or a declared exemption, and every declared head is read at least
  once

#### Scenario: A new tool in a shell fence fails

- **WHEN** a reference's shell fence gains the line `jq -r .url <path>`
- **THEN** the suite fails naming that surface, the line and the head `jq`

#### Scenario: A new tool in a flagged inline span fails

- **WHEN** a SKILL.md body gains the inline span `jq -r .url <path>`
- **THEN** the suite fails naming that surface, the line and the head `jq`

#### Scenario: An inline span without a flag token is not read

- **WHEN** a SKILL.md body gains the inline span `jq output`
- **THEN** the inventory reads no head from it and the suite passes

#### Scenario: An assignment prefix does not hide the head

- **WHEN** a shell fence gains the line `FOO=1 jq -r .url <path>`
- **THEN** the suite fails naming the head `jq`

#### Scenario: A head in a markdown-nested shell fence is read

- **WHEN** a shell fence inside a `markdown` fence gains the line `jq -r .url <path>`
- **THEN** the suite fails naming the head `jq`

#### Scenario: An exemption no line uses fails

- **WHEN** the `inventory` block declares `utility: … rsync` and no read segment of the surface has the head `rsync`
- **THEN** the suite fails naming `rsync` and its kind `utility`

#### Scenario: An exemption naming a recorded tool fails

- **WHEN** the `inventory` block declares `git` under `utility`
- **THEN** the suite fails naming `git`

#### Scenario: A malformed exemption block fails

- **WHEN** the requirement carries no `inventory` fence, a second one, a line not matching `<kind>: <head> …`, an
  unknown kind, a repeated kind or a repeated head
- **THEN** the suite fails naming the requirement and the offending line (the requirement's heading line when no
  `inventory` fence exists), and never passes vacuously

## MODIFIED Requirements

### Requirement: Every `orbit` snippet on the generated surface parses against that program

Every snippet that invokes `orbit` SHALL parse when its argument vector is handed to commander's own parser over the
builder's neutralised program (`The CLI's grammar is one program, built by an exported builder`), for every generated
SKILL.md and `references/*.md` file of every workflow the generator emits. The check proves GRAMMAR only: nothing is
executed, and a snippet that parses but is wrong for its moment is not caught. One contract per tool decides grammar,
and this requirement covers `orbit`. Its places table, guard, tokenizer and fence table are the SHARED extractor's:
every recorded tool `Every command head on the generated surface is a recorded tool or a declared exemption` derives
is extracted and guarded by them, with the tool's own name where they say `orbit`. Which tools are recorded, and which
command heads are exempt from a contract, is that requirement's to state.

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
| an unquoted shell control operator (`&&`, `\|\|`, `\|`, `\|&`, `;`, `&`), spaced or glued to a word, in a shell-fence line or in an inline span beginning `orbit ` | the snippet splits there; each segment is a candidate whose own first token decides its tool, so a segment of another tool is no `orbit` snippet and an `orbit` segment after an operator is extracted; an inline span beginning with any other word is not read |
| an operator inside quotes | an argument, never a split |
| a redirection (`>`, `>>`, `>\|`, `>&`, `<` followed by whitespace, `<>`, `<&`, a digit glued before any of them) | the operator and its target are dropped from the argument vector |
| a `(` opening a segment, and its matching `)` (a subshell: `( cd <dir> && … )`) | grouping, stripped; the commands inside are segments like any other |
| an unquoted `$(`, backtick, `<(`, `>(` or `;;`, or a `$(` or backtick inside double quotes, where the shell still runs it | fails extraction, naming the surface, the line and the snippet: substitution is refused, never parsed |
| an unquoted `<<` or `<<-` (a here-document) | fails extraction at its opening line, naming the surface, the line and the snippet: the body is never delimited, so its lines are still read, but no fence holding one can pass |

Closure of the operator rows: POSIX XCU 2.10's control and redirection operators, plus bash's `|&`; grouping is
stripped, and substitution — unquoted or inside double quotes, plus bash's process substitution — and the
here-document are refused rather than parsed.

Named limit (the places). Residual kind: a command in a container not listed: a blockquote, an indented code block, an
HTML block, a table cell, or — outside every shell fence and single-backtick span — mid-line after `&&`, `$ ` or `|`;
a command after an operator in a single-backtick span that begins with another word (`cd x && orbit …`); a command
in a double-backtick inline span; and, inside
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
whitespace is a redirect, never a placeholder's opener. Outside quotes, `&&`, `||`, `|&`, `|`, `;` and `&` are
operators whether or not whitespace surrounds them, and a redirection operator is dropped together with its target.
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

#### Scenario: A chained snippet splits at its operator

- **WHEN** a shell fence line reads `orbit validate <name> && orbit status --change <name> --frobnicate`
- **THEN** the sweep extracts two `orbit` snippets from the line, the first parses, and the second fails naming the
  surface and the line

#### Scenario: A pipe into another tool leaves one snippet

- **WHEN** an inline span reads `orbit status --change <name> --json | head -1`
- **THEN** the sweep extracts one `orbit` snippet without `|`, `head` or `-1`, and it parses

#### Scenario: A command substitution fails extraction

- **WHEN** a shell fence line reads `orbit status --change $(cat name.txt)`
- **THEN** extraction fails naming the surface, the line and the snippet
