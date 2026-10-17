## Context

`orbit instructions proposal|specs` serves the instruction text of `schemas/spec-driven/schema.yaml`, and the
proposal artifact's template is `schemas/spec-driven/templates/proposal.md`. Four lines in them name `openspec/specs/`
(issue #30; see explore.md's Premise). `orbit-cli-name`'s source scan already reads every line of `schemas/**`, but
its pattern is `PATTERN = /OpenSpec|Openspec/g` (`test/helpers/cli-name.ts:14`), so a lowercase path passes. The
requirement's own named limit records that choice: lowercase "is overwhelmingly the protected paths, tags and
identifiers". In `schemas/**` it is not: the only lowercase occurrences there are the four stale paths (a probe of
the shipped-file walk, 2026-10-17).

## Goals / Non-Goals

**Goals:**
- The served instructions and the proposal template name `orbit/specs/`.
- A lowercase `openspec` in a shipped schema file fails the suite, so the next one cannot land silently.

**Non-Goals:**
- Telling the agent to read the spec of each modified capability (issue #29; D-opf-2).
- A case-insensitive scan over `src/`, `bin/`, `scripts/` or `build.js` (Considered & out in explore.md).
- Migrating a schema copy outside the package (a project fork or a user-level copy).

## Decisions

**D1 — The pattern is chosen per file, by path (D-opf-1).** `occurrences` matches `/openspec/gi` in a file whose
repo-relative path begins `schemas/`, and `PATTERN` in every other file. The failure line keeps its form,
`<file>:<line>: residue '<occurrence>'`, with the occurrence as written (`openspec`). The admitted list is unchanged:
`admits` compares positions and lengths, which a case-insensitive match leaves the same, and no entry names a
schema file. The domain is every file the shipped-file walk returns under `schemas/**` (five today); a schema file
added later is in it with no edit.

**D2 — The four lines change only their path (D-opf-2).** `openspec/specs/` becomes `orbit/specs/`; the sentences
around it stay as they are.

**D3 — The resolver comments are fixed here (D-opf-3).** `resolver.ts:52` and `:97` describe the project-local
schema as `<projectRoot>/openspec/schemas/<name>/schema.yaml`; `getProjectSchemasDir` (`:44-45`) returns
`orbit/schemas`. The comments become `<projectRoot>/orbit/schemas/<name>/schema.yaml`. The `XDG_DATA_HOME/openspec/`
lines beside them name the global data directory, a kept name, and stay.

**D4 — Three pins move, recorded as one act.** `rc03b-untouched-modules.test.ts` pins `schemas/spec-driven/schema.yaml`,
`schemas/spec-driven/templates/proposal.md` and `src/core/artifact-graph/resolver.ts`. Each moves to its new hash and
the file's header comment gains a `MOVED at openspec-path-fix apply` entry naming the three, in the form its earlier
entries use.

## Alternatives considered

From explore.md's Considered & out:
- The four lines and a one-off test: leaves the case-sensitive scan blind to the next lowercase path in a schema.
- Case-insensitive over every shipped file: `src/` string literals carry legitimate legacy paths
  (`legacy-cleanup.ts`, the costrict adapter's `.cospec/openspec/commands`) and the kept names, each needing an
  admission. That is the Tier-C scrub's work.
- Rewording "Research existing specs" into a read obligation: issue #29's question.

## Touchpoints

- `schemas/spec-driven/schema.yaml` — lines 17, 39 and 55.
- `schemas/spec-driven/templates/proposal.md` — line 18.
- `test/helpers/cli-name.ts` — the per-path pattern in `occurrences`.
- `test/core/cli-name.test.ts` — the new scenario's test.
- `src/core/artifact-graph/resolver.ts` — two comments.
- `test/core/rc03b-untouched-modules.test.ts` — three pins and the act's record.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-opf-1 | SOURCED | live rule | `orbit-cli-name`'s `The old name appears in what the package ships only for an admitted reason` — a SENTENCE naming the source (the shipped-file walk under `schemas/**`) |
| D-opf-2 | not carried | scope | none |
| D-opf-3 | not carried | scope | none |

## Risks / Trade-offs

- A project that already ran `orbit schema fork` keeps the stale paths in its own `orbit/schemas/` copy, and a user
  schema copy under the global data directory's `schemas/` keeps them too; both outrank the package schema
  (`getSchemaDir`, `resolver.ts:69-82`), and a fork takes whichever copy resolves. Neither copy is shipped, so no
  check here reaches it; the requirement names both as a limit. Nothing in orbit writes the user directory.
- A future schema line that names a kept name in lowercase (for example `.openspec.yaml`) fails the suite until an
  admission is added. That is the intended cost: the admission records why.
