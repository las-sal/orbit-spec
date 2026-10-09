## Context

The decisions here come from `explore.md` (D-rc05-1 through D-rc05-18). What exists today:

- `test/core/templates/orbit-content-fidelity.test.ts` holds rc01's `gh` sweep. It finds inline `gh` spans in the three
  PR references by regex and validates them through `gh-contract-validate.cjs`, the validator the harness stub also
  loads (D-rc05-1). It reads no fenced line and no SKILL.md body.
- `src/cli/index.ts` builds one commander 14 program at module scope: 33 inline `.command(` calls plus the
  `register*Command` modules for `spec`, `config` and `schema`. It ends in `program.parse()` (line 609), so importing it
  runs the CLI (D-rc05-7). Five `preAction` hooks are registered: on the root, `change` and `spec`
  (`src/cli/index.ts`, `src/commands/spec.ts`), `config` (`src/commands/config.ts:215`, which calls `process.exit(1)`
  on a non-global `--scope`) and `schema` (`src/commands/schema.ts:296`, which writes to stderr).
- `src/core/completions/command-registry.ts` is a 463-line hand-written grammar, inherited from upstream, read only by
  `orbit completion`. It lacks nine of orbit's commands (D-rc05-7).
- `src/core/markdown-fence.ts`, the engine's shared fence tracker, opens a fence only at zero to three spaces of
  indentation (line 31), so it cannot see the four list-nested `bash` fences on today's surface (D-rc05-12).

A probe at propose ran commander's own parser over today's `orbit` snippets: 131 parse, 35 are bare command names, and 1
is a real defect, the architect scaffold's literal backslashes (D-rc05-18). The probe's naive span finder found that
defect; the sweep this change specifies cannot see it, because CommonMark reads a backslash before a backtick as a
literal and the line starts with `>` (proposal walk, D8 below). The probe's 167 snippets and D-rc05-8's 164 are two
measurements by two rules: the probe counted spans and fence lines its own way, and D-rc05-8 counted first tokens that
resolve to an executable. Exit (1) states the sweep's own figure at apply.

## Goals / Non-Goals

**Goals** (the exits as restated at exploration, D-rc05-17 and D-rc05-14; rc05's charter is revised to match at apply):

- Exit (1): on the generated surface at the apply commit, the guard finds zero lines outside a shell fence that start
  with `orbit` and a flag, and every extracted `orbit` snippet parses against the builder's program. Real defects the
  sweep finds are fixed in the stage, and the extracted count is stated as a figure.
- Exit (2): each injection in tasks.md section 5 fails the suite. A snippet or guard injection names the snippet's
  surface and line; a parity injection names the command or flag.
- Exit (3): the stage's own system blind pair finds zero grammar defects in an `orbit` snippet.

**Non-Goals:**

- `git`, and moving rc01's `gh` sweep onto the shared extractor. Both are `rc05b-git-grammar`'s (D-rc05-15).
- Executing any documented command (D-rc05-6). The phase-1 harness remains the executing instrument.
- Option values. No command declares `.choices()`, and values are checked in action code (D-rc05-9's table).
- Closing `orbit show`'s `allowUnknownOption`, which is upstream behaviour, named as a limit.
- Generating the registry from the program (D-rc05-10's rejected option C).

## Decisions

**D1 — the program moves into an exported builder (D-rc05-9).** A new `src/cli/program.ts` exports
`buildProgram(options)`, holding everything `index.ts` builds today, including the three `register*Command` calls.
`index.ts` becomes the build plus `parse()`. One option, `hooks: false`, skips registering all five `preAction`
hooks, because commander has no public API to remove one. Three of the five are registered inside the register modules,
so `registerSpecCommand`, `registerConfigCommand` and `registerSchemaCommand` each take the option and skip their own
hook. Production passes nothing, so the CLI's behaviour is unchanged.

*Alternatives:* a walked contract with our own validator; parsing `--help` text; a recorded capture. All rejected (see
Alternatives considered).

**D2 — the check is commander's own `parseAsync` over a neutralised build (D-rc05-9).** The check builds with
`hooks: false`, then walks every command recursively: `exitOverride()` and `configureOutput` (capturing commander's
message) on every command, and `action(noop)` ONLY on a command that already declares an action. A group command
keeps no action, so commander still rejects it run without a subcommand (`commander.help`), still offers its implicit
`help` subcommand, and still reports an unknown subcommand as unknown; putting a no-op on every command would change
all three (proposal walk, both halves of the pair). Each snippet's argument vector goes to
`parseAsync(argv, { from: 'user' })`. A `CommanderError` is accepted exactly when its exit code is 0 (`--help`,
`--version`, `help <command>`), as the CLI's process would exit; its error code cannot decide, because `help <command>`
and a group run without a subcommand both throw `commander.help`. The program is built fresh per snippet, so option state cannot leak between snippets.

**D3 — one shared extraction helper (D-rc05-11, D-rc05-13, D-rc05-18).** A test helper enumerates every generated
surface through `getSkillTemplates()` (`src/core/shared/skill-generation.ts`), the generator's own registry, so it reads
exactly the shipped workflows (architect included, the never-generated feedback template excluded) and picks up a new
workflow without an edit. For each entry it reads the SKILL.md as `generateSkillContent` writes it (frontmatter above the `instructions`, so a reported line is a line of the installed file) and every `references` entry. It locates fences with a CommonMark
parser and parses the content of a `markdown`/`md` fence again. It extracts lines of `bash`/`sh`/`shell` fences and
inline `orbit ` spans, tokenizes them by the spec's rules, and applies the bare-name rule by walking the program's
command tree. Joining an open quote stops at the end of its shell fence's content, and a quote still open there fails extraction
whatever the line's first token, and an `orbit` line joined into another command's quote fails at its own line even when
a later line closes it; a backslash escapes as the shell's does, and a `<` followed by whitespace is a redirect. It is tool-agnostic apart from the tool name, so `rc05b-git-grammar`
consumes it unchanged. The guard reads the same parse: on every line outside a shell fence it strips leading
whitespace, `>` markers, list markers and a leading `|`, and fails a line whose first token is the tool and any later
token begins with `-`.

**D4 — the CommonMark parser is `markdown-it`, as a devDependency (D-rc05-13).** It is widely used, follows CommonMark,
and exposes `fence` tokens with `info` and `content`. Its version and its handling of the four list-nested fences and
the prompt template's ```` ```markdown ```` block are measured at task 2.1 before anything is built on it. A
devDependency is never installed for an adopter.

**D5 — `COMMAND_REGISTRY` is held by a parity test, and its gaps are filled by hand (D-rc05-10).** The test compares the
fields the spec's table names, both ways, over the builder's program. It is written red first, and the registry is
filled until it passes.

**D6 — the architect scaffold's backslash is fixed in the template.** `architect.ts:50` escapes each backtick
around `orbit architecture status` twice inside its template literal, so the generated body shows a backslash before
each one. The line is rewritten so the generated body carries plain backticks. The `getArchitectSkillTemplate` pin in
`test/core/templates/skill-templates-parity.test.ts` moves, recorded in its comment. The probe at propose found it;
D8's test is what keeps it from returning.

**D8 — a test-only check fails any backslash-escaped backtick in a generated body (Sal: B, proposal walk).** The
architect scaffold's defect is a slip of TypeScript escaping inside a template literal, and it renders a literal
backslash before a backtick in the generated text. The sweep cannot see it (Context above). A separate test reads every
generated surface's raw text and fails on any backslash immediately before a backtick, naming the surface and the line.
It fixes the architect line and the same slip at `src/core/templates/workflows/review.ts:427` and `:510` under it. The
paste-route item at `:510` is pinned byte for byte by `test/core/templates/external-runner-branch.test.ts`'s
`PASTE_ITEMS_BEFORE_RUNNERS`, so that constant moves with it, recorded in the test. It is a test, not a requirement: the
capability's subject stays the CLI's grammar.

**D7 — a bare command name is prose, decided by the program (D-rc05-18, Sal: A at propose).** A span whose tokens all
resolve to commands, with nothing after, is not parsed. It is decided by the program's command tree, not by a
heuristic. The probe counts 35 such names today.

## Alternatives considered

From `explore.md`'s Considered & out:

- **A walked contract with orbit's own validator.** A second grammar engine beside commander's.
- **Parsing `orbit … --help` text.** Anchors the instrument to a help formatter, the class of rc01's external CRITICAL.
- **A recorded `orbit` capture file.** A third copy that drifts, as the completion registry has.
- **Leaving the registry's drift as a recorded question, or generating the registry from the program.** Sal took the
  parity test.
- **Extracting every fence line, with a prose classifier.** The heuristic rc01 retired; the guard closes the escape
  instead.
- **Extending the shared fence tracker, or a third hand-written fence grammar.** The first changes two shipped readers
  on Q-crc-15's ground; the second is Q-crc-15's disease.
- **Keeping `git` in rc05.** Two independent instruments reviewed at once; split to `rc05b-git-grammar`.
- **Executing documented commands in a disposable repository.** The charter's original wording; grammar only.
- **Every backticked `orbit` span must parse, bare names included** (propose, D-rc05-18 option B). Forbids naming a
  command with a required argument in backticks; Sal took A.

## Risks / Trade-offs

- [D-rc05-6, the tool set, is BOUNDED] → Its named limit is stated in `orbit-cli-grammar`'s ``Every `orbit` snippet on
  the generated surface parses against that program``.
- [D-rc05-11, the places a command can sit, is BOUNDED] → Its named limit is stated in the same requirement.
- [The builder refactor touches the CLI entry and the three register modules] → `index.ts` keeps only the parse;
  task 1.4 measures once, at apply, that every command's `--help` output and `orbit --version` are byte-identical to the
  pre-refactor capture, and records it in the apply emit. The committed test asserts the entry point declares nothing.
- [A backslash before a backtick can be intended] → None is on today's surface besides the three slips; a later
  intended one would need the test's exception, named there.
- [The baseline `orbit-review-external` spec carries the same slip in its text (`spec.md:63`)] → D8 reads generated
  bodies, and a spec is not one. Fixing it needs a MODIFIED block of a second capability, so it is left, named here.
- [A grammar check passes a snippet that is wrong for its moment, or carries a wrong value] → Named limits in the
  requirements; review and the phase-1 harness remain the instruments for both.
- [A new devDependency] → Dev-only, never shipped; it serves a test, not the engine.
- [The registry's completion metadata stays hand-maintained] → A named limit in `The completion registry is a checked
  copy of the program`.

## Touchpoints

- `src/cli/program.ts` + `src/cli/index.ts` — the builder; `index.ts` keeps only the parse.
- `src/commands/spec.ts` + `src/commands/config.ts` + `src/commands/schema.ts` — the register modules take the hook option.
- `src/core/completions/command-registry.ts` — the missing commands and flags.
- `src/core/templates/workflows/architect.ts` + `src/core/templates/workflows/review.ts` — the backslash-escaped backticks.
- `test/helpers/surface-snippets.ts` — the shared extraction helper.
- `test/core/cli-grammar/` — the builder, sweep, guard, parity and injection tests.
- `test/core/templates/skill-templates-parity.test.ts` + `test/core/templates/external-runner-branch.test.ts` — the architect pin and the paste-route constant move.
- `package.json` + `package-lock.json` — the devDependency.
- `orbit/architecture/clean-up-review-cycle.md` — rc05's charter and exits revised.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc05-6 | BOUNDED | live rule | `orbit-cli-grammar`' ``Every `orbit` snippet on the generated surface parses against that program`` — a normative TABLE (the tool table), its residual verbatim as a named limit |
| D-rc05-9 | SOURCED | live rule | `orbit-cli-grammar`' `The CLI's grammar is one program, built by an exported builder` — a normative TABLE |
| D-rc05-10 | DERIVED | live rule | `orbit-cli-grammar`' `The completion registry is a checked copy of the program` — a normative TABLE |
| D-rc05-11 | BOUNDED | live rule | `orbit-cli-grammar`' ``Every `orbit` snippet on the generated surface parses against that program`` — a normative TABLE (the places table), its residual verbatim as a named limit |
| D-rc05-13 | SOURCED | live rule | `orbit-cli-grammar`' ``Every `orbit` snippet on the generated surface parses against that program`` — a normative TABLE (the fence table) |
| D-rc05-1 | — | `Kind: fact` | not carried |
| D-rc05-2 | — | `Kind: fact` | not carried |
| D-rc05-3 | — | `Kind: fact` | not carried |
| D-rc05-4 | — | `Kind: scope` | not carried |
| D-rc05-5 | — | `Kind: scope` | not carried |
| D-rc05-7 | — | `Kind: fact` | not carried |
| D-rc05-8 | — | `Kind: fact` | not carried |
| D-rc05-12 | — | `Kind: fact` | not carried |
| D-rc05-14 | — | `Kind: scope` | not carried |
| D-rc05-15 | — | `Kind: scope` | not carried |
| D-rc05-16 | — | `Kind: scope` | not carried |
| D-rc05-17 | — | `Kind: scope` | not carried |
| D-rc05-18 | — | `Kind: fact` | not carried |

`explore.md` keeps its entries as the exploration recorded them. The proposal walk corrected D-rc05-9's hook row and
accepted codes and D-rc05-11's guard rule in the spec's tables, which are the rule; the explore entries are history.
