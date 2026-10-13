## Why

Six of the user docs still teach upstream OpenSpec: `docs/installation.md`, `docs/getting-started.md`, `docs/cli.md`,
`docs/commands.md`, `docs/workflows.md` and `docs/opsx.md`. They are about 100 KB, and five of them never mention
`orbit`. They install `@fission-ai/openspec`, run `openspec`, type `/opsx:`, and describe a `core` versus expanded
install that orbit made inert (D15). Eight orbit CLI commands and four orbit workflows appear on none of them. This is
the `update-gh-documentation` program's `reference-docs` stage (goal G3): the command and workflow pages teach orbit,
and a test holds them to the program. One command cannot be documented as it stands: `orbit feedback` files issues on
upstream's tracker, so R-ugd-10 retargets it in this stage (see explore.md).

## What Changes

- **The six pages are rewritten for orbit** and leave the pending-rewrite list, so every docs check reads them.
  - `docs/cli.md` documents every visible command and subcommand of the program.
  - `docs/commands.md` documents all 15 `/orbit:` workflows, including `review`, `address-reviews`, `architect` and
    `audit-drift`.
  - `docs/workflows.md` covers the workflow patterns, including the review cadence around apply.
  - `docs/installation.md` and `docs/getting-started.md` extend the README rather than restate it (D-rd-2).
  - `orbit config profile` and `orbit init --profile` are documented as they behave, with no `core` versus expanded
    selection (D-rd-5).
- **`docs/opsx.md` becomes `docs/workflow-engine.md`** (D-rd-7): the engine view of how artifacts, the dependency
  graph, `orbit status` and `orbit instructions` drive the workflows, and where the gates sit. Its config, command-list
  and update-versus-fresh sections become links to the pages that own them. The README's docs list gains the link,
  and `docs/migration-guide.md`'s link to `opsx.md` is repointed.
- **A coverage check grades exit (2)** (D-rd-1): `docs/cli.md` names every visible command path, and
  `docs/commands.md` names every workflow id. Both lists are read from the program and the workflow registry, never
  typed into the test.
- **`orbit feedback` is retargeted to `las-sal/orbit-spec`** (D-rd-6, R-ugd-10). Its issue URL, its `gh issue create
  --repo` argv and its help description (defined in `src/cli/program.ts` and the completion registry) stop naming
  upstream. It also stops passing or printing a `feedback` label, which the fork does not have.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-user-docs`: an ADDED requirement for the command-coverage check; the checked-surface requirement's
  file-local check set gains it.

## Impact

- `docs/installation.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/commands.md`, `docs/workflows.md`
  (rewritten); `docs/opsx.md` → `docs/workflow-engine.md` (renamed and rewritten); `docs/migration-guide.md` (one link);
  `README.md` (one docs-list line).
- `test/core/user-docs/pending-rewrite.json` (six entries out); `test/helpers/user-docs.ts` and a new test under
  `test/core/user-docs/` (the coverage check).
- `src/commands/feedback.ts` and `test/commands/feedback.test.ts` (the retarget), and the `feedback` help description in
  `src/cli/program.ts` and `src/core/completions/command-registry.ts` — R-ugd-10's carve-out only.
