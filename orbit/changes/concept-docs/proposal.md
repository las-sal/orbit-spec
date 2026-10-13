## Why

Five `docs/` pages still describe upstream OpenSpec: `concepts.md`, `customization.md`, `supported-tools.md`,
`multi-language.md` and `migration-guide.md`. None mentions `orbit`, and the migration guide covers a different
migration, from pre-1.0 OpenSpec to upstream's own 1.x workflow. Before the repository goes public, these pages must
say what orbit adds and how an adopter gets from OpenSpec to orbit. The exploration measured the second part on real
projects (see explore.md, Cases 1 and 2). `orbit init` run over an OpenSpec project silently builds an empty `orbit/`
beside `openspec/`. A project made with upstream 1.14.1 also degrades in orbit's 1.3.1 engine in eleven ways, five of
them silent.

## What Changes

- **The five pages are rewritten for orbit** (stage `update-gh-documentation › concept-docs`; goals G2, G3) and leave
  `test/core/user-docs/pending-rewrite.json`. That empties the list, so this change also sets the docs sweeps' floors
  (`orbit-user-docs`' existing floors requirement, which says the emptying edit sets them).
- **`docs/concepts.md`** covers what orbit adds over OpenSpec: reviewed gates and the review cadence, the blind pair and
  walks, emits and trails, orientation, the architect tier, `orbit pr` and lifecycle consent. Inherited 1.3.1 behaviour orbit leaves
  alone (the spec and delta format, schemas, `config.yaml`, the archive merge) is credited to the 1.3.1 baseline
  (D-cd-3).
- **A new check: every H2 section of four concept pages declares its owner** on a `Carried by:` line. Each item is an
  `orbit-*` capability, a `fork-and-orbify D<n>` decision, or `the 1.3.1 baseline`, and each must resolve (D-cd-7).
  This is how exit (2) is graded.
- **`docs/supported-tools.md` lists every init target in two tiers**, and a test holds the page to `AI_TOOLS`. Tier 1
  is Claude and Codex, which orbit designs for and tests. Tier 2 is the other 26 available tools: their files are
  generated into OpenSpec 1.3.1's directories, and orbit does not test them (D-cd-8).
- **`docs/migration-guide.md` is rewritten for an adopter arriving from OpenSpec.** It opens with a "before you move"
  checklist (one `grep`, `find` or `ls` per hazard Case 2 found, run against `openspec/`). The move steps follow, then a
  table of what orbit does not have. The guide names the upstream version it was measured against, 1.14.1 (D-cd-5).
  `grep`, `find`, `ls` and `rm` join the docs' declared command heads, and the git contract is re-captured so it
  records `git mv`.
- **`orbit init` warns when an OpenSpec project directory sits beside it** (R-ugd-11; D-cd-1, D-cd-2). The trigger is
  `openspec/` holding `specs/` or `changes/`, whether or not `orbit/` exists. The warning names the manual steps and
  points at the migration guide, then init proceeds: never a prompt, never a stop.
- **Exit (3)'s run**: the guide's steps are run once on a fresh upstream 1.14.1 project carrying one fixture per
  checklist hazard, and the transcript is recorded in the change (D-cd-6).

## Capabilities

### New Capabilities
- `orbit-init-openspec-warning`: `orbit init`'s warning when an OpenSpec project directory sits beside the one it
  builds. The trigger, the message's content, and the rule that it reports and proceeds.

### Modified Capabilities
- `orbit-user-docs`:
  - The pending-rewrite requirement lists two new file-local checks: the carried-by check and the tool-coverage check.
  - The `docs-inventory` fence gains `grep`, `find`, `ls` and `rm`.
  - The residue requirement admits the identifier `.cospec/openspec/`, CoStrict's command directory, so
    `docs/supported-tools.md` can give its real path (carried at the system walk).
  - Three requirements are ADDED: the carried-by check, the supported-tools coverage, and the migration guide's
    checklist.

## Impact

- `docs/concepts.md`, `docs/customization.md`, `docs/supported-tools.md`, `docs/multi-language.md`,
  `docs/migration-guide.md`: rewritten.
- `test/core/user-docs/pending-rewrite.json` emptied; the docs floors set where the sweeps wire them.
- `test/helpers/user-docs.ts` and new tests under `test/core/user-docs/` for the two new checks.
- `src/core/init.ts` gains the warning; a new test covers it.
- `orbit/scenario-ledger.yaml` records the exit (3) run for the migration guide's scenarios.
- Baseline capabilities 28 → 29.
