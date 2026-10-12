## MODIFIED Requirements

### Requirement: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract

Every snippet that invokes `git` or `gh` SHALL validate against its tool's RECORDED contract, extracted and guarded by
the shared extractor of `Every \`orbit\` snippet on the generated surface parses against that program` — its places
table, guard, tokenizer and fence table, with the tool's own name — over every generated SKILL.md and
`references/*.md` file of every workflow the generator emits. The check proves GRAMMAR only: the suite never spawns
`git` or `gh`, and a snippet that validates but is wrong for its moment is not caught.

| tool | contract | validator |
|---|---|---|
| `gh` | `test/integration/pr-lifecycle/gh-contract.json`, `orbit-pr-lifecycle`'s `Test instruments derive from a recorded real-CLI contract` | the one validator the harness stub loads |
| `git` | `test/integration/cli-contracts/git-contract.json`, captured as this requirement states | one CommonJS validator over that file |

A recorded tool's bare-name tree SHALL be its contract's command keys, each split on spaces into a path, and the
rule SHALL apply to each segment of an inline span, so `git fetch <r> && git push` yields one validated snippet and
one prose name:

| member | covered by |
|---|---|
| an inline segment whose tokens resolve to a key with nothing after (`git push`, `gh pr merge`) | prose, never validated |
| an inline segment whose tokens resolve to a key with more after | extracted and validated |
| an inline segment whose first token after the tool matches no key | extracted; fails as an unknown command, so an invented verb cannot pass as prose |
| a two-level key's first word alone (`git worktree`) | prose: an interior node of the tree |

Closure of the bare-name table: DERIVED — a span walks the tree to a node with nothing left, to a node with tokens
left, or out of the tree; the fourth row is the first outcome at an interior node.

The `git` contract SHALL be written only by a deliberate capture, `npm run capture:git`, reviewed as a diff. It is
the one code in the repository that runs a real `git`. Every probe runs in its OWN fresh copy of a template repository
holding one commit on branch `main` — a probe can mutate its repository (`switch -c` switches the branch, `init <word>`
creates a nested repository), so no probe may read another's effects — under `LANG=C`, with closed stdin, a failing
editor, no remote, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1` and a 10-second timeout. Its candidate set is
every `git` segment the shared extractor finds on the generated surface, bare names included, so a command written only
as a name is recorded. It records the git version and, per command key, whether git knows the command, its probe class,
whether it requires a positional, and each flag the surface writes on it, probed in the form the surface writes it:
whether git accepts it, git's line when it does not, and whether it takes a value. A REJECTION SHAPE is a first line
beginning `error: unknown option`, `error: invalid option`, `error: unknown switch`, `fatal: unrecognized argument:` or
`error: option ` and ending `takes no value`. Git's own response decides every entry:

| member | covered by |
|---|---|
| a command group | `git <a> orbitcapturebogusverb` reports `unknown subcommand` (`worktree` today) |
| a command key | a group's key is two words, its second the segment's verb (`worktree remove`) — the segment's second token, and only when it matches `^[a-z][a-z0-9-]*$`; a group segment whose second token is a flag or a placeholder has no key and fails as an unknown command; every other key is one word, and its second token is an argument (`push <remote>`) |
| a key git knows | `git <key> -h`: a first line beginning `usage:` records it known; `is not a git command` or `unknown subcommand` records it unknown, with that line |
| the command's probe class | `git <key> --orbit-capture-bogus -h` gives a rejection shape → PARSE-OPTIONS; otherwise `git <key> --orbit-capture-bogus HEAD` gives a rejection shape or a usage page → RUN; otherwise a named orbit-side rule, or the capture fails naming the key and writes nothing |
| whether a flag takes a value | `git <key> <name>` with nothing after it: `requires a value` records it value-taking |
| a flag's acceptance, PARSE-OPTIONS class | `git <key> <flag as written> [x when value-taking] -h`: a usage page records it accepted; a rejection shape records it rejected, with git's line; any other line fails the capture naming the probe |
| a flag's acceptance, RUN class (`log`, `show`, `rev-list`, `check-ref-format`) | `git <key> <flag as written> [x when value-taking] HEAD`, with `HEAD` standing in for the positional: a rejection shape or a usage page records it rejected, with git's line; anything else records it accepted |
| a flag written `--name=value` on the surface | probed as written (`--name=x`), recorded by the name before `=` |
| a flag the surface writes in more than one form (`--only <p>` and `--only=<p>`) | every distinct form probed; the name's one entry is rejected, with the first rejected form's line, when any form is, and accepted only when every form is |
| value arity on a flag git does not report as `requires a value` (`check-ref-format --branch`) | recorded not value-taking: its value reads as a positional, so a missing value on it is not caught |
| a required positional | `git <key>` alone: a first line beginning `usage:` records one required |
| a command neither bogus probe rejects (`rev-parse`, which echoes an unknown flag with exit 0) | the orbit-side rule named in the capture: recorded flags only, each recorded as written, unprobed |

Named limit (the classification). Residual kind: a grammar error whose message matches none of the recorded shapes, classified as accepted — a false pass
Residual method: the capture also probes a deliberately bogus flag on every subcommand and requires it to classify as rejected; a subcommand where it does not either carries a named orbit-side rule (`rev-parse`) or fails the capture

The `git` validator SHALL look up the longest command key leading the argument vector — failing a key the contract
records unknown with git's recorded line, and a leading word that matches no recorded key with `unknown command
"<x>" for "git"` and the re-capture hint, since that is a subcommand a body gained after capture or an invented one;
match each flag token by its
recorded name exactly — no abbreviation, no bundled short flags — refusing an unrecorded or rejected flag (with git's
recorded message for a rejected one, and a message naming re-capture for an unrecorded one); let a value-taking flag
consume the next token unless its value is attached; accept `--name=value` on any accepted long flag; read every
token after `--` as a positional; refuse a command
recorded as requiring a positional when none is given; apply the named orbit-side rules; and treat a `<…>` placeholder
as a value, exactly as a real value. Positional counts beyond that presence are not checked, and neither is an
`=value` written after capture on a long flag that takes none (`git status --short=x`), nor, conversely, a bare form
written after capture of a flag recorded from its `=` form (`git log --format %h`, which git refuses): the contract
records which flags git accepts, not which forms. A failure SHALL name the
surface (the workflow and the file), the line, the snippet, and the validator's message.

#### Scenario: Today's surface validates for both recorded tools

- **WHEN** the sweep runs over every generated surface for `git` and for `gh`
- **THEN** every extracted snippet validates against its tool's contract, and the guard fails no line for either tool

#### Scenario: A gh snippet in a SKILL.md body is validated

- **WHEN** a line `gh pr view --repo <owner>/<repo> --json isDraft`, which lacks its `<url>`, is placed in the
  architect SKILL.md
- **THEN** the sweep fails naming `architect/SKILL.md`, the line, the snippet and the contract's recorded
  `argument required when using the --repo flag`

#### Scenario: An unknown git flag fails the sweep

- **WHEN** a reference's shell fence carries `git commit --only <paths> --frobnicate`
- **THEN** the sweep fails naming the reference, the line, the snippet and the validator's message

#### Scenario: A missing value fails the sweep

- **WHEN** an inline span reads `git switch -c`
- **THEN** the sweep fails naming the surface, the line and the snippet, because the contract records `-c` as
  value-taking

#### Scenario: An unrecorded subcommand fails and a recorded bare name is prose

- **WHEN** one inline span reads `git frobnicate <path>` and another reads `git push`
- **THEN** the first fails as an unknown command and the second is not validated

#### Scenario: The orbit-side rule rejects what git would accept

- **WHEN** a snippet reads `git rev-parse --frobnicate HEAD`
- **THEN** the sweep fails it under the contract's named `rev-parse` rule, though real git echoes the flag and exits 0

#### Scenario: A flag added after capture asks for re-capture

- **WHEN** a body gains a `git log` snippet carrying a flag the contract does not record
- **THEN** the sweep fails naming the snippet, and its message names `npm run capture:git`

#### Scenario: The suite needs no git

- **WHEN** the full suite runs
- **THEN** every `git` case passes from the checked-in contract, and the contract's own tests assert that the file
  parses, records a git version and the orbit-side rule, and carries every command key the surface writes

#### Scenario: A flag on a command that needs a positional is recorded accepted

- **WHEN** the capture classifies `rev-list`, whose bogus flag prints usage under `-h` and under `HEAD`, and probes
  `--count` as `git rev-list --count HEAD`, which exits 0
- **THEN** `rev-list` is recorded in the RUN class and `--count` accepted, though `git rev-list --count` alone prints
  usage

#### Scenario: A value-taking flag is probed with a stand-in value

- **WHEN** the capture probes `commit -m`, for which `git commit -m` reports `requires a value`
- **THEN** it records `-m` value-taking and decides its acceptance from `git commit -m x -h`, never from
  `git commit -m -h`, which takes `-h` as the message and runs the command

#### Scenario: A group's verb is a key and another command's second word is an argument

- **WHEN** the candidate set holds `git worktree remove --force <dir>` and `git push <remote> <branch>`, and
  `git worktree orbitcapturebogusverb` reports `unknown subcommand` while `git push orbitcapturebogusverb` does not
- **THEN** the contract records the key `worktree remove` and the key `push`, with `<remote>` read as an argument

#### Scenario: The capture refuses a command it cannot classify

- **WHEN** the capture meets a command whose bogus-flag probe is not rejected and no orbit-side rule names it
- **THEN** the capture fails naming the command, and writes no contract

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
utility: mv mkdir grep rm rmdir head tail cd [ sh node
placeholder: <argv[0]>
prose: reach skipped
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
path-prefixed, or sits in a span the tokenizer refuses; a tool run as an argument of a declared head (`sh -c
'<…>'`, `node <script> …`, `node bin/orbit.js` among them) or after a declared reserved word; or one
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
