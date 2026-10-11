## Why

rc05's charter: every copyable command in a generated reference is a claim about a tool's grammar, and claims are
tested, not reviewed (see explore.md, Premise). rc01 already ships that for `gh`, as grammar, in the three PR
references (D-rc05-1). Nothing checks the rest of the generated surface. The exploration measured it: `orbit`, our own
CLI, is the most-cited tool, with 164 snippets across every SKILL.md and most references, and no instrument holds a
single one of them to the CLI (D-rc05-2, D-rc05-8). Its grammar cannot even be read from code today: `src/cli/index.ts`
builds the commander program at module scope and parses on import. The one readable copy, the shell-completion
`COMMAND_REGISTRY`, has already drifted. It lacks `architecture`, `emit`, `external`, `fingerprint`, `instructions`,
`status`, `templates`, `schemas` and `new`, so users' tab completion cannot offer the commands every body tells them to
run (D-rc05-7).

A probe at propose ran commander's own parser over today's `orbit` snippets: 131 parse, 35 are bare command names,
and one is a real defect (D-rc05-18; the probe counts spans by its own rule, D-rc05-8 counts first tokens, so the two
totals differ). The architect body's doc scaffold shows a literal backslash before each backtick around
`orbit architecture status`, which an AI copying the scaffold writes into a new architecture doc. The probe's naive
span finder found it; the sweep this change builds cannot, because CommonMark reads an escaped backtick as text, so a
separate test-only check guards that slip on every generated body.

Sal rescoped the stage at its exploration: every generated surface, `orbit` first, grammar only (D-rc05-4, D-rc05-5,
D-rc05-6). `git` and the move of rc01's `gh` sweep onto the shared extractor split into `rc05b-git-grammar`
(D-rc05-15).

## What Changes

- The commander program moves into an exported builder that `src/cli/index.ts` imports and parses, so the CLI's
  grammar has ONE statement that tests can read in-process (D-rc05-9).
- A sweep hands every `orbit` snippet on the generated surface to commander's OWN parser, over the builder's program
  with every action, hook, exit and output neutralised. No contract is derived or recorded: the production parser is
  the validator, so the sweep and the CLI cannot disagree (D-rc05-9).
- The sweep reads every generated SKILL.md and reference. It extracts commands from shell-tagged fences and inline
  spans, and a guard fails any line outside a shell fence whose first token is `orbit` and that carries a flag
  (D-rc05-11). A bare
  command name is prose, decided by the program (D-rc05-18). Fences are located by a CommonMark library added as a
  dev-only dependency, with `markdown`-tagged fences parsed again so a shell fence shown inside a document is reached
  (D-rc05-13).
- `COMMAND_REGISTRY` stays hand-written, keeps its completion metadata, and is held to the builder's program by a
  parity test in both directions; its missing commands are filled (D-rc05-10).
- A test-only check fails any backslash-escaped backtick in a generated body; the architect scaffold and the same
  slip twice in the review body are fixed under it.
- rc05's charter exits are revised under R-crc-12's first case (D-rc05-14, D-rc05-17).

## Capabilities

### New Capabilities

- `orbit-cli-grammar`: the CLI's grammar is one program, built by an exported builder; every `orbit` snippet on the
  generated surface parses against it; and the shell-completion registry is a checked copy of it (D-rc05-16).

### Modified Capabilities

(none)

**Size: one capability**, three ADDED requirements (D-rc05-16).

## Impact

- `src/cli/index.ts` and a new `src/cli/program.ts`: the builder. `src/commands/spec.ts`, `config.ts` and
  `schema.ts`: their register functions take the hook option. CLI behaviour is unchanged.
- `src/core/completions/command-registry.ts`: the missing commands and flags.
- `src/core/templates/workflows/architect.ts` and `review.ts`: the escaped backticks; the `skill-templates-parity`
  pin and the `external-runner-branch` paste-route constant move.
- Tests: a shared snippet-extraction helper (rc05b consumes it), the sweep with its guard, the registry parity, and the
  injections showing each check able to fail.
- `package.json`: one devDependency, a CommonMark parser, never shipped to adopters.
- `orbit/architecture/clean-up-review-cycle.md`: rc05's charter and exits revised, with the reasons.
